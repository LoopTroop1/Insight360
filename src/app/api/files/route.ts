import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

function sha256(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// GET /api/files?userId=X&status=pending/approved&createdById=Y&all=true
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdStr = searchParams.get('userId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const createdByIdStr = searchParams.get('createdById');
    const all = searchParams.get('all');

    const whereClause: any = {};

    if (all !== 'true') {
      if (userIdStr) {
        whereClause.currentHolderId = parseInt(userIdStr);
      }
      if (createdByIdStr) {
        whereClause.createdById = parseInt(createdByIdStr);
      }
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.subject = {
        contains: search,
      };
    }

    const files = await db.file.findMany({
      where: whereClause,
      include: {
        createdBy: true,
        currentHolder: true,
        movements: {
          include: {
            fromUser: true,
            toUser: true
          },
          orderBy: {
            timestamp: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}

// POST /api/files
// Create a new e-Office file
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subject, category, priority, initialHolderId, createdById } = body;

    if (!subject || !category || !priority || !initialHolderId || !createdById) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const holderId = parseInt(initialHolderId);
    const creatorId = parseInt(createdById);

    // Calculate SLA days based on priority
    const slaCategoryDays = priority === 'CRITICAL' ? 2 : priority === 'HIGH' ? 5 : priority === 'MEDIUM' ? 10 : 15;

    // 1. Create File
    const file = await db.file.create({
      data: {
        subject,
        category,
        priority,
        createdById: creatorId,
        currentHolderId: holderId,
        status: 'pending',
        slaCategoryDays
      }
    });

    // 2. Create Initial Movement
    await db.fileMovement.create({
      data: {
        fileId: file.id,
        fromUserId: creatorId,
        toUserId: holderId,
        note: 'File created and initiated.',
      }
    });

    // 3. Update KPIRecord for holder (increase pendingCount)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const holderKpi = await db.kPIRecord.findFirst({
      where: {
        userId: holderId,
        date: {
          gte: today
        }
      }
    });

    if (holderKpi) {
      await db.kPIRecord.update({
        where: { id: holderKpi.id },
        data: {
          pendingCount: holderKpi.pendingCount + 1
        }
      });
    } else {
      // Find latest record to inherit scores
      const latestKpi = await db.kPIRecord.findFirst({
        where: { userId: holderId },
        orderBy: { date: 'desc' }
      });
      await db.kPIRecord.create({
        data: {
          userId: holderId,
          date: new Date(),
          completionPct: latestKpi?.completionPct || 80,
          delayPct: latestKpi?.delayPct || 5,
          avgResolutionTime: latestKpi?.avgResolutionTime || 24,
          pendingCount: (latestKpi?.pendingCount || 0) + 1,
          attendancePct: latestKpi?.attendancePct || 95,
          citizenRating: latestKpi?.citizenRating || 4.2,
          collaborationScore: latestKpi?.collaborationScore || 80,
          qualityScore: latestKpi?.qualityScore || 85,
          productivityScore: latestKpi?.productivityScore || 75,
          dpi: latestKpi?.dpi || 75
        }
      });
    }

    // 4. Create Chained Audit Vault Entry
    const lastAudit = await db.auditLogEntry.findFirst({
      orderBy: { id: 'desc' }
    });
    const prevHash = lastAudit?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date();
    const details = `File ${file.subject} (ID: ${file.id}) created by User ${creatorId} and assigned to Holder ${holderId}.`;
    const hashInput = prevHash + `${creatorId}-file_created-${file.id}-File-${details}-${timestamp.getTime()}`;
    const currentHash = sha256(hashInput);

    await db.auditLogEntry.create({
      data: {
        actorId: creatorId,
        actionType: 'goal_created', // map to allowed: we can map file_created -> goal_created for SQLite enum simplicity, or add it
        entityId: file.id,
        entityType: 'File',
        details,
        timestamp,
        previousHash: prevHash,
        currentHash
      }
    });

    // 5. Trigger System Notification for receiver
    await db.notification.create({
      data: {
        userId: holderId,
        type: 'high_risk_file',
        message: `New file assigned to you: ${file.subject}. Priority: ${file.priority}.`,
      }
    });

    return NextResponse.json(file);
  } catch (error) {
    console.error('Error creating file:', error);
    return NextResponse.json({ error: 'Failed to create file' }, { status: 500 });
  }
}
