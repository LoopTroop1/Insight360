import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateEngagementIndex } from '@/lib/formulas';
import crypto from 'crypto';

function sha256(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, rating, comment } = body;

    if (!userId || rating === undefined) {
      return NextResponse.json({ error: 'userId and rating are required' }, { status: 400 });
    }

    const officerId = parseInt(userId);
    const feedbackScore = parseFloat(rating);

    // Get current month format YYYY-MM
    const today = new Date();
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // 1. Find or create EngagementRecord for this month
    let record = await db.engagementRecord.findFirst({
      where: {
        userId: officerId,
        month: monthStr
      }
    });

    if (!record) {
      // Find previous month record to inherit baseline scores
      const prev = await db.engagementRecord.findFirst({
        where: { userId: officerId },
        orderBy: { month: 'desc' }
      });
      
      record = await db.engagementRecord.create({
        data: {
          userId: officerId,
          month: monthStr,
          recognitionCount: prev?.recognitionCount || 0,
          feedbackScore: feedbackScore,
          skillDevHours: prev?.skillDevHours || 8,
          workloadFairnessScore: prev?.workloadFairnessScore || 75,
          surveyScore: feedbackScore * 20, // map 1-5 rating to 0-100
          badgesEarned: prev?.badgesEarned || 'team_player',
          engagementIndex: 70.0
        }
      });
    } else {
      record = await db.engagementRecord.update({
        where: { id: record.id },
        data: {
          feedbackScore: feedbackScore,
          surveyScore: feedbackScore * 20
        }
      });
    }

    // 2. Recompute engagement index
    const badgesCount = record.badgesEarned ? record.badgesEarned.split(',').length : 0;
    const engagementIndex = calculateEngagementIndex({
      recognitionCount: record.recognitionCount,
      feedbackScore: record.feedbackScore,
      skillDevHours: record.skillDevHours,
      workloadFairnessScore: record.workloadFairnessScore,
      surveyScore: record.surveyScore,
      badgesCount
    });

    await db.engagementRecord.update({
      where: { id: record.id },
      data: {
        engagementIndex
      }
    });

    // 3. Write Audit Log
    const lastAudit = await db.auditLogEntry.findFirst({
      orderBy: { id: 'desc' }
    });
    const prevHash = lastAudit?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date();
    const details = `User ${officerId} submitted feedback survey. Rating: ${feedbackScore}/5. Comments: "${comment || 'None'}".`;
    const hashInput = prevHash + `${officerId}-survey_submitted-${record.id}-EngagementRecord-${details}-${timestamp.getTime()}`;
    const currentHash = sha256(hashInput);

    await db.auditLogEntry.create({
      data: {
        actorId: officerId,
        actionType: 'survey_submitted',
        entityId: record.id,
        entityType: 'EngagementRecord',
        details,
        timestamp,
        previousHash: prevHash,
        currentHash
      }
    });

    return NextResponse.json({ success: true, engagementIndex });
  } catch (error) {
    console.error('Error submitting feedback survey:', error);
    return NextResponse.json({ error: 'Failed to submit feedback survey' }, { status: 500 });
  }
}
