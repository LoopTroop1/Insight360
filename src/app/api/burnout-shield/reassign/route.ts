import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

function sha256(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceUserId, targetUserId, filesCount, actorId, forceTransfer } = body;

    if (!sourceUserId || !actorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const srcId = parseInt(sourceUserId);
    const currentActorId = parseInt(actorId);
    const count = filesCount ? parseInt(filesCount) : 4;

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
    const filesStr = fileIds.join(',');

    const sourceUser = await db.user.findUnique({
      where: { id: srcId },
      include: { department: true }
    });

    if (!sourceUser) {
      return NextResponse.json({ error: 'Source officer not found' }, { status: 404 });
    }

    // Force Transfer (Direct Reassignment)
    if (forceTransfer && targetUserId) {
      const tgtId = parseInt(targetUserId);

      // Perform reassignment
      await db.file.updateMany({
        where: { id: { in: fileIds } },
        data: { currentHolderId: tgtId }
      });

      // Create BurnoutShieldEvent tracking record
      const event = await db.burnoutShieldEvent.create({
        data: {
          officerId: srcId,
          reassignedToId: tgtId,
          filesReassigned: filesStr,
          triggerReason: `Forced Workload Transfer: Secretary forced reallocation of ${actualCount} files to balance backlogs.`,
          status: 'auto_executed'
        }
      });

      // Update KPIs
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

      // Create notifications
      const tgtUser = await db.user.findUnique({ where: { id: tgtId } });
      await db.notification.create({
        data: {
          userId: srcId,
          type: 'performance_improvement',
          message: `Workload balanced: ${actualCount} files reassigned to ${tgtUser?.name} via direct administrative command.`,
        }
      });

      await db.notification.create({
        data: {
          userId: tgtId,
          type: 'high_risk_file',
          message: `Workload balance: ${actualCount} files transferred to your inbox from ${sourceUser.name} by administrative force.`,
        }
      });

      // Write Chained Audit Log
      const lastAudit = await db.auditLogEntry.findFirst({ orderBy: { id: 'desc' } });
      const prevHash = lastAudit?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
      const timestamp = new Date();
      const actionDetails = `Administrative Force Workload Transfer: Reassigned ${actualCount} files from Officer ${sourceUser.name} (ID: ${srcId}) to Officer ${tgtUser?.name} (ID: ${tgtId}).`;
      
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

      return NextResponse.json({ success: true, count: actualCount, status: 'auto_executed' });
    }

    // Collaborative Workload Redistribution Workflow
    // 1. Fetch eligible peers in the same department
    const peers = await db.user.findMany({
      where: {
        departmentId: sourceUser.departmentId,
        id: { not: srcId },
        personaType: 'officer'
      }
    });

    if (peers.length === 0) {
      return NextResponse.json({ error: 'No eligible peer officers found in this department' }, { status: 400 });
    }

    const rankedPeers = await Promise.all(peers.map(async (peer) => {
      const kpi = await db.kPIRecord.findFirst({
        where: { userId: peer.id },
        orderBy: { date: 'desc' }
      });
      const backlogCount = await db.file.count({
        where: { currentHolderId: peer.id, status: 'pending' }
      });
      const dpi = kpi ? kpi.dpi : 70.0;
      const avgResolutionTime = kpi ? kpi.avgResolutionTime : 3.5;
      const capacityLeft = Math.max(1, 8 - backlogCount);
      
      const scoreVal = 98 - (backlogCount * 2.5) - (avgResolutionTime * 2.0) + (dpi / 15);
      const aiScore = Math.min(98, Math.max(50, parseFloat(scoreVal.toFixed(1))));

      return {
        id: peer.id,
        name: peer.name,
        designation: peer.designation,
        backlogCount,
        capacityLeft,
        aiScore
      };
    }));

    // Sort descending by score
    rankedPeers.sort((a, b) => b.aiScore - a.aiScore);

    const queueIds = rankedPeers.map(p => p.id).join(',');
    const firstRecipientId = rankedPeers[0].id;

    // Simulation projections for Digital Twin
    const prodGain = 4 + Math.floor(Math.random() * 3);
    const backlogRed = 15 + Math.floor(Math.random() * 10);
    const waitDaysRed = 2;

    const metadata = {
      prodGain,
      backlogRed,
      waitDaysRed,
      estimatedEffort: actualCount > 5 ? 'High' : actualCount > 2 ? 'Medium' : 'Low',
      priority: 'High',
      expectedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      affectedProject: 'Digital India Service Delivery Initiative'
    };

    // Create BurnoutShieldEvent with 'proposed' status
    const event = await db.burnoutShieldEvent.create({
      data: {
        officerId: srcId,
        filesReassigned: filesStr,
        status: 'proposed',
        triggerReason: `Workload balance shield proposal: Officer ${sourceUser.name} holds a high backlog of ${actualCount} pending files. Collaborative assistance requested.`,
        redistributionQueue: queueIds,
        currentRecipientId: firstRecipientId,
        declineReasons: '{}',
        metadataJson: JSON.stringify(metadata)
      }
    });

    // Create Notification sent to first recipient
    await db.notification.create({
      data: {
        userId: firstRecipientId,
        type: 'ai_recommendation',
        message: `[AI Workload Assistance Request] Officer ${sourceUser.name} is overloaded. Recommended transferring ${actualCount} files to you. Estimated effort: ${metadata.estimatedEffort}. Would you like to assist? [Event ID: ${event.id}]`
      }
    });

    // Write Chained Audit Log
    const lastAudit = await db.auditLogEntry.findFirst({ orderBy: { id: 'desc' } });
    const prevHash = lastAudit?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date();
    const actionDetails = `Burnout Shield Triggered: Collaborative workload assistance initiated for Officer ${sourceUser.name}. Peer queue: [${queueIds}]. First request sent to Officer ID ${firstRecipientId}.`;

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

    return NextResponse.json({
      success: true,
      count: actualCount,
      status: 'proposed',
      event,
      rankedPeers
    });
  } catch (error) {
    console.error('Error executing workload reassignment:', error);
    return NextResponse.json({ error: 'Failed to execute workload redistribution' }, { status: 500 });
  }
}
