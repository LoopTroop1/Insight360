import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

function sha256(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// PUT /api/goals/[id]
// Edit or soft-delete goals
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const goalId = parseInt(params.id);
    const body = await request.json();
    const { title, description, currentValue, targetValue, status, deadline, successParameter, actorId } = body;

    if (!actorId) {
      return NextResponse.json({ error: 'actorId is required' }, { status: 400 });
    }

    const currentActorId = parseInt(actorId);

    // 1. Fetch Goal
    const goal = await db.goal.findUnique({
      where: { id: goalId }
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // 2. Perform Update
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (currentValue !== undefined) updateData.currentValue = parseFloat(currentValue);
    if (targetValue !== undefined) updateData.targetValue = parseFloat(targetValue);
    if (status) updateData.status = status;
    if (deadline) updateData.deadline = new Date(deadline);
    if (successParameter) updateData.successParameter = successParameter;

    const updatedGoal = await db.goal.update({
      where: { id: goalId },
      data: updateData
    });

    // 3. Register Audit Log
    const lastAudit = await db.auditLogEntry.findFirst({
      orderBy: { id: 'desc' }
    });
    const prevHash = lastAudit?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date();
    const actionDetails = `Goal '${goal.title}' (ID: ${goal.id}) updated. Changes: ${JSON.stringify(updateData)} by User ${currentActorId}.`;
    const hashInput = prevHash + `${currentActorId}-goal_updated-${goal.id}-Goal-${actionDetails}-${timestamp.getTime()}`;
    const currentHash = sha256(hashInput);

    await db.auditLogEntry.create({
      data: {
        actorId: currentActorId,
        actionType: 'goal_updated',
        entityId: goal.id,
        entityType: 'Goal',
        details: actionDetails,
        timestamp,
        previousHash: prevHash,
        currentHash
      }
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}
