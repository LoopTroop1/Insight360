import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

function sha256(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceUserId, targetUserId, filesCount, actorId } = body;

    if (!sourceUserId || !targetUserId || !filesCount || !actorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const srcId = parseInt(sourceUserId);
    const tgtId = parseInt(targetUserId);
    const count = parseInt(filesCount);
    const currentActorId = parseInt(actorId);

    // 1. Fetch source pending files
    const pendingFiles = await db.file.findMany({
      where: { currentHolderId: srcId, status: 'pending' },
      orderBy: { createdAt: 'asc' }, // oldest first
      take: count
    });

    if (pendingFiles.length === 0) {
      return NextResponse.json({ error: 'No pending files available to reassign' }, { status: 400 });
    }

    const actualCount = pendingFiles.length;
    const fileIds = pendingFiles.map(f => f.id);

    // 2. Perform reassignment
    await db.file.updateMany({
      where: { id: { in: fileIds } },
      data: {
        currentHolderId: tgtId
      }
    });

    // 3. Create BurnoutShieldEvent tracking record
    const event = await db.burnoutShieldEvent.create({
      data: {
        officerId: srcId,
        reassignedToId: tgtId,
        filesReassigned: fileIds.join(','),
        triggerReason: `Simulator Workload Balancing: Secretary reallocated ${actualCount} files to balance backlogs.`,
        status: 'auto_executed'
      }
    });

    // 4. Update KPI records for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const srcKpi = await db.kPIRecord.findFirst({
      where: { userId: srcId, date: { gte: today } }
    });
    if (srcKpi) {
      await db.kPIRecord.update({
        where: { id: srcKpi.id },
        data: { pendingCount: Math.max(0, srcKpi.pendingCount - actualCount) }
      });
    }

    const tgtKpi = await db.kPIRecord.findFirst({
      where: { userId: tgtId, date: { gte: today } }
    });
    if (tgtKpi) {
      await db.kPIRecord.update({
        where: { id: tgtKpi.id },
        data: { pendingCount: tgtKpi.pendingCount + actualCount }
      });
    }

    // 5. Create notifications
    const srcUser = await db.user.findUnique({ where: { id: srcId } });
    const tgtUser = await db.user.findUnique({ where: { id: tgtId } });

    await db.notification.create({
      data: {
        userId: srcId,
        type: 'performance_improvement',
        message: `Simulator balancing active: ${actualCount} files reassigned to ${tgtUser?.name} to relieve backlog.`,
      }
    });

    await db.notification.create({
      data: {
        userId: tgtId,
        type: 'high_risk_file',
        message: `Simulator balancing: ${actualCount} files transferred to your inbox from ${srcUser?.name}.`,
      }
    });

    // 6. Write Chained Audit Log
    const lastAudit = await db.auditLogEntry.findFirst({
      orderBy: { id: 'desc' }
    });
    const prevHash = lastAudit?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date();
    const actionDetails = `Digital Twin Simulator Triggered: Reassigned ${actualCount} files from User ${srcId} to User ${tgtId}.`;
    
    // Map simulator reassignments to 'burnout_shield_activated' inside standard SQLite audit categories
    const hashInput = prevHash + `${currentActorId}-burnout_shield_activated-${event.id}-BurnoutShieldEvent-${actionDetails}-${timestamp.getTime()}`;
    const currentHash = sha256(hashInput);

    await db.auditLogEntry.create({
      data: {
        actorId: currentActorId,
        actionType: 'burnout_shield_activated',
        entityId: event.id,
        entityType: 'BurnoutShieldEvent',
        details: actionDetails,
        timestamp,
        previousHash: prevHash,
        currentHash
      }
    });

    return NextResponse.json({ success: true, count: actualCount });
  } catch (error) {
    console.error('Error executing simulator reassignment:', error);
    return NextResponse.json({ error: 'Failed to execute simulator reassignment' }, { status: 500 });
  }
}
