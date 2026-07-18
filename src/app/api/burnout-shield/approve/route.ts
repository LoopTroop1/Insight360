import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

function sha256(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, actorId, action, declineReason } = body;

    if (!eventId || !actorId || !action) {
      return NextResponse.json({ error: 'eventId, actorId, and action are required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Event has already been processed or completed' }, { status: 400 });
    }

    const fileIds = event.filesReassigned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    // Handle ACCEPT action
    if (action === 'accept') {
      // 1. Reassign files to the accepting officer
      await db.file.updateMany({
        where: { id: { in: fileIds } },
        data: {
          currentHolderId: currentActorId,
          status: 'pending'
        }
      });

      // 2. Update Event Status
      const updatedEvent = await db.burnoutShieldEvent.update({
        where: { id: evId },
        data: {
          status: 'auto_executed',
          reassignedToId: currentActorId
        }
      });

      // 3. Update Helping Score & Badges for recipient
      const user = await db.user.findUnique({ where: { id: currentActorId } });
      const newScore = (user?.helpingScore || 0) + 1;
      await db.user.update({
        where: { id: currentActorId },
        data: { helpingScore: newScore }
      });

      // Award Badges inside user's EngagementRecord if exists
      const today = new Date();
      const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      
      const engagement = await db.engagementRecord.findFirst({
        where: { userId: currentActorId, month: monthStr }
      });

      let earnedBadge = '';
      if (newScore >= 3) earnedBadge = '🥇 Team Support Champion';
      else if (newScore >= 2) earnedBadge = '🥈 Collaborative Officer';
      else earnedBadge = '🥉 Workload Hero';

      if (engagement) {
        const existingBadges = engagement.badgesEarned ? engagement.badgesEarned.split(',') : [];
        if (!existingBadges.includes(earnedBadge)) {
          existingBadges.push(earnedBadge);
        }
        await db.engagementRecord.update({
          where: { id: engagement.id },
          data: {
            badgesEarned: existingBadges.join(','),
            recognitionCount: engagement.recognitionCount + 1
          }
        });
      }

      // 4. Update KPIs
      today.setHours(0, 0, 0, 0);

      const sourceKpi = await db.kPIRecord.findFirst({
        where: { userId: event.officerId, date: { gte: today } }
      });
      if (sourceKpi) {
        await db.kPIRecord.update({
          where: { id: sourceKpi.id },
          data: { pendingCount: Math.max(0, sourceKpi.pendingCount - fileIds.length) }
        });
      }

      const targetKpi = await db.kPIRecord.findFirst({
        where: { userId: currentActorId, date: { gte: today } }
      });
      if (targetKpi) {
        await db.kPIRecord.update({
          where: { id: targetKpi.id },
          data: { pendingCount: targetKpi.pendingCount + fileIds.length }
        });
      }

      // 5. Create notifications
      const recipientUser = await db.user.findUnique({ where: { id: currentActorId } });
      await db.notification.create({
        data: {
          userId: event.officerId,
          type: 'performance_improvement',
          message: `Workload Assistance Accepted: Officer ${recipientUser?.name} has accepted ${fileIds.length} files from your queue. Badges updated.`,
        }
      });

      await db.notification.create({
        data: {
          userId: currentActorId,
          type: 'high_risk_file',
          message: `You accepted workload assistance: ${fileIds.length} files successfully transferred to your inbox. Helping Score: +1.`,
        }
      });

      // 6. Write Chained Audit Log
      const lastAudit = await db.auditLogEntry.findFirst({ orderBy: { id: 'desc' } });
      const prevHash = lastAudit?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
      const timestamp = new Date();
      const actionDetails = `Workload Accepted: Officer ${recipientUser?.name} (ID: ${currentActorId}) accepted reassignment of ${fileIds.length} files from overloaded Officer ID ${event.officerId}.`;

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

      return NextResponse.json({ success: true, action: 'accept', event: updatedEvent });
    }

    // Handle DECLINE action (Move to next officer or Automatic Fallback)
    if (action === 'decline') {
      const decliner = await db.user.findUnique({ where: { id: currentActorId } });
      
      // Update decline reasons JSON map
      let reasons: Record<string, string> = {};
      try {
        reasons = event.declineReasons ? JSON.parse(event.declineReasons) : {};
      } catch (err) {
        reasons = {};
      }
      reasons[currentActorId.toString()] = declineReason || 'Already handling urgent work';

      // Parse the queue
      const queueIds = event.redistributionQueue ? event.redistributionQueue.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
      
      // Remove decliner from queue
      const remainingQueue = queueIds.filter(id => id !== currentActorId);

      // Audit the decline action
      const declineAuditDetails = `Workload Declined: Officer ${decliner?.name} (ID: ${currentActorId}) declined assistance request for event ${evId} with reason: "${reasons[currentActorId.toString()]}".`;
      const lastAudit = await db.auditLogEntry.findFirst({ orderBy: { id: 'desc' } });
      const prevHash = lastAudit?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
      const timestamp = new Date();
      const hashInput = prevHash + `${currentActorId}-burnout_shield_activated-${evId}-BurnoutShieldEvent-${declineAuditDetails}-${timestamp.getTime()}`;
      const currentHash = sha256(hashInput);

      await db.auditLogEntry.create({
        data: {
          actorId: currentActorId,
          actionType: 'burnout_shield_activated',
          entityId: evId,
          entityType: 'BurnoutShieldEvent',
          details: declineAuditDetails,
          timestamp,
          previousHash: prevHash,
          currentHash
        }
      });

      if (remainingQueue.length > 0) {
        // Escalate to next ranked officer
        const nextRecipientId = remainingQueue[0];
        
        const updatedEvent = await db.burnoutShieldEvent.update({
          where: { id: evId },
          data: {
            redistributionQueue: remainingQueue.join(','),
            currentRecipientId: nextRecipientId,
            declineReasons: JSON.stringify(reasons)
          }
        });

        // Notify next recipient
        await db.notification.create({
          data: {
            userId: nextRecipientId,
            type: 'ai_recommendation',
            message: `[AI Workload Assistance Request] Officer ${event.officer.name} is overloaded. Recommended transferring ${fileIds.length} files to you. Would you like to assist? [Event ID: ${evId}]`
          }
        });

        return NextResponse.json({
          success: true,
          action: 'decline',
          escalated: true,
          nextRecipientId,
          event: updatedEvent
        });
      } else {
        // Automatic Fallback! No officers left in the queue.
        // We find the "best available" officer (i.e. the one who originally had the highest score or first in queue)
        // For fallback simplicity, let's grab the first officer in the original queue, or calculate the peer with minimum backlog.
        const peers = await db.user.findMany({
          where: {
            departmentId: decliner?.departmentId,
            id: { not: event.officerId },
            personaType: 'officer'
          }
        });

        // Find peer with lowest pending files
        let fallbackOfficer = peers[0];
        let minBacklog = 9999;
        
        for (const p of peers) {
          const count = await db.file.count({
            where: { currentHolderId: p.id, status: 'pending' }
          });
          if (count < minBacklog) {
            minBacklog = count;
            fallbackOfficer = p;
          }
        }

        const fallbackId = fallbackOfficer ? fallbackOfficer.id : currentActorId; // fallback to current if none found

        // Direct Reassign to Fallback Officer
        await db.file.updateMany({
          where: { id: { in: fileIds } },
          data: {
            currentHolderId: fallbackId,
            status: 'pending'
          }
        });

        const updatedEvent = await db.burnoutShieldEvent.update({
          where: { id: evId },
          data: {
            status: 'auto_executed',
            reassignedToId: fallbackId,
            redistributionQueue: '',
            currentRecipientId: null,
            declineReasons: JSON.stringify(reasons)
          }
        });

        // Update KPIs
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sourceKpi = await db.kPIRecord.findFirst({
          where: { userId: event.officerId, date: { gte: today } }
        });
        if (sourceKpi) {
          await db.kPIRecord.update({
            where: { id: sourceKpi.id },
            data: { pendingCount: Math.max(0, sourceKpi.pendingCount - fileIds.length) }
          });
        }

        const fallbackKpi = await db.kPIRecord.findFirst({
          where: { userId: fallbackId, date: { gte: today } }
        });
        if (fallbackKpi) {
          await db.kPIRecord.update({
            where: { id: fallbackKpi.id },
            data: { pendingCount: fallbackKpi.pendingCount + fileIds.length }
          });
        }

        // Notify Fallback Officer
        const fallbackUser = await db.user.findUnique({ where: { id: fallbackId } });
        await db.notification.create({
          data: {
            userId: fallbackId,
            type: 'high_risk_file',
            message: `No officers accepted the workload assistance request. AI has automatically assigned ${fileIds.length} files to your queue based on department workload policy.`
          }
        });

        await db.notification.create({
          data: {
            userId: event.officerId,
            type: 'performance_improvement',
            message: `Workload balanced: All peers declined. AI automatically assigned ${fileIds.length} files to ${fallbackUser?.name} based on department policy.`
          }
        });

        // Write Chained Audit Log for fallback
        const fallbackAuditDetails = `Workload Automatic Fallback: All peer officers declined. Reassigned ${fileIds.length} files from overloaded Officer ID ${event.officerId} to fallback Officer ${fallbackUser?.name} (ID: ${fallbackId}) based on department workload policy.`;
        const lastAudit = await db.auditLogEntry.findFirst({ orderBy: { id: 'desc' } });
        const prevHash = lastAudit?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
        const timestamp = new Date();
        const hashInput = prevHash + `system-burnout_shield_activated-${evId}-BurnoutShieldEvent-${fallbackAuditDetails}-${timestamp.getTime()}`;
        const currentHash = sha256(hashInput);

        await db.auditLogEntry.create({
          data: {
            actorId: currentActorId,
            actionType: 'burnout_shield_activated',
            entityId: evId,
            entityType: 'BurnoutShieldEvent',
            details: fallbackAuditDetails,
            timestamp,
            previousHash: prevHash,
            currentHash
          }
        });

        return NextResponse.json({
          success: true,
          action: 'decline',
          fallbackExecuted: true,
          fallbackId,
          event: updatedEvent
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error executing workload request approval:', error);
    return NextResponse.json({ error: 'Failed to process workload request' }, { status: 500 });
  }
}
