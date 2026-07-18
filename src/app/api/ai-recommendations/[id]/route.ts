import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

function sha256(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// PUT /api/ai-recommendations/[id]
// Accept or dismiss AI recommendations
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const recId = parseInt(params.id);
    const body = await request.json();
    const { status, actorId } = body; // status can be "accepted" or "dismissed"

    if (!status || !actorId) {
      return NextResponse.json({ error: 'status and actorId are required' }, { status: 400 });
    }

    const currentActorId = parseInt(actorId);

    // 1. Fetch Recommendation
    const rec = await db.aIRecommendation.findUnique({
      where: { id: recId }
    });

    if (!rec) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    // 2. Update Recommendation Status
    const updatedRec = await db.aIRecommendation.update({
      where: { id: recId },
      data: { status }
    });

    // 3. Register Audit Log if accepted
    const lastAudit = await db.auditLogEntry.findFirst({
      orderBy: { id: 'desc' }
    });
    const prevHash = lastAudit?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date();
    const actionDetails = `AI Recommendation ID ${recId} ('${rec.message}') ${status.toUpperCase()} by User ${currentActorId}.`;
    
    // Map AI recommendation acceptance to 'ai_recommendation_accepted' inside standard SQLite audit categories
    const hashInput = prevHash + `${currentActorId}-ai_recommendation_accepted-${rec.id}-AIRecommendation-${actionDetails}-${timestamp.getTime()}`;
    const currentHash = sha256(hashInput);

    await db.auditLogEntry.create({
      data: {
        actorId: currentActorId,
        actionType: 'ai_recommendation_accepted',
        entityId: rec.id,
        entityType: 'AIRecommendation',
        details: actionDetails,
        timestamp,
        previousHash: prevHash,
        currentHash
      }
    });

    return NextResponse.json(updatedRec);
  } catch (error) {
    console.error('Error updating AI recommendation status:', error);
    return NextResponse.json({ error: 'Failed to update recommendation status' }, { status: 500 });
  }
}
