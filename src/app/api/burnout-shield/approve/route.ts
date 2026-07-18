import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

function sha256(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, actorId } = body;

    if (!eventId || !actorId) {
      return NextResponse.json({ error: 'eventId and actorId are required' }, { status: 400 });
    }

    const currentActorId = parseInt(actorId);
    const evId = parseInt(eventId);

    // 1. Fetch Event
    const event = await db.burnoutShieldEvent.findUnique({
      where: { id: evId },
      include: {
        officer: true,
        reassignedTo: true
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Burnout Shield event not found' }, { status: 404 });
    }

    if (event.status !== 'proposed') {
      return NextResponse.json({ error: 'Event has already been processed' }, { status: 400 });
    }

    const targetHolderId = event.reassignedToId;
    if (!targetHolderId) {
      return NextResponse.json({ error: 'No target recipient configured for this event' }, { status: 400 });
    }

    // 2. Parse file IDs to reassign
    const fileIds = event.filesReassigned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    // 3. Update holder for all files
    await db.file.updateMany({
      where: { id: { in: fileIds } },
      data: {
        currentHolderId: targetHolderId,
        status: 'pending' // ensure status is pending for the new holder
      }
    });

    // 4. Update Event Status
    const updatedEvent = await db.burnoutShieldEvent.update({
      where: { id: evId },
      data: {
        status: 'auto_executed'
      }
    });

    // 5. Update KPI records:
    // Decrement pending count for source officer
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sourceKpi = await db.kPIRecord.findFirst({
      where: { userId: event.officerId, date: { gte: today } }
    });
    if (sourceKpi) {
      await db.kPIRecord.update({
        where: { id: sourceKpi.id },
        data: {
          pendingCount: Math.max(0, sourceKpi.pendingCount - fileIds.length)
        }
      });
    }

    // Increment pending count for target officer
    const targetKpi = await db.kPIRecord.findFirst({
      where: { userId: targetHolderId, date: { gte: today } }
    });
    if (targetKpi) {
      await db.kPIRecord.update({
        where: { id: targetKpi.id },
        data: {
          pendingCount: targetKpi.pendingCount + fileIds.length
        }
      });
    }

    // 6. Create notifications
    // Notify source officer
    await db.notification.create({
      data: {
        userId: event.officerId,
        type: 'performance_improvement',
        message: `Burnout Shield Active: ${fileIds.length} files reassigned to ${event.reassignedTo?.name} to relieve your queue backlog.`,
      }
    });

    // Notify target officer
    await db.notification.create({
      data: {
        userId: targetHolderId,
        type: 'high_risk_file',
        message: `Burnout Shield workload balance: ${fileIds.length} files reassigned to your inbox from ${event.officer.name}.`,
      }
    });

    // 7. Write Chained Audit Log
    const lastAudit = await db.auditLogEntry.findFirst({
      orderBy: { id: 'desc' }
    });
    const prevHash = lastAudit?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date();
    const actionDetails = `Burnout Shield Triggered: Reassigned ${fileIds.length} files from Officer ${event.officer.name} (ID: ${event.officerId}) to Officer ${event.reassignedTo?.name} (ID: ${targetHolderId}) by Supervisor ${currentActorId}.`;
    
    // Map to 'burnout_shield_activated' actionType in standard SQLite audit categories
    const hashInput = prevHash + `${currentActorId}-burnout_shield_activated-${evId}-BurnoutShieldEvent-${actionDetails}-${timestamp.getTime()}`;
    const currentHash = sha256(hashInput);

    await db.auditLogEntry.create({
      data: {
        actorId: currentActorId,
        actionType: 'burnout_shield_activated',
        entityId: evId,
        entityType: 'BurnoutShieldEvent',
        details: actionDetails,
        timestamp,
        previousHash: prevHash,
        currentHash
      }
    });

    return NextResponse.json({ success: true, updatedEvent });
  } catch (error) {
    console.error('Error executing burnout shield approval:', error);
    return NextResponse.json({ error: 'Failed to execute burnout shield reassignment' }, { status: 500 });
  }
}
