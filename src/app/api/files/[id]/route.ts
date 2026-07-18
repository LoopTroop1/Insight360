import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

function sha256(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// GET /api/files/[id]
// Returns details for a single file including movements
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = parseInt(params.id);
    const file = await db.file.findUnique({
      where: { id: fileId },
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
      }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json(file);
  } catch (error) {
    console.error('Error fetching file details:', error);
    return NextResponse.json({ error: 'Failed to fetch file details' }, { status: 500 });
  }
}

// PUT /api/files/[id]
// Processes file actions: forward, approve, reject
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = parseInt(params.id);
    const body = await request.json();
    const { action, toUserId, note, digitalSignatureHash, actorId } = body;

    if (!action || !actorId) {
      return NextResponse.json({ error: 'Action and actorId are required' }, { status: 400 });
    }

    const currentActorId = parseInt(actorId);

    // Fetch the file
    const file = await db.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let updatedFile;

    if (action === 'forward') {
      if (!toUserId) {
        return NextResponse.json({ error: 'Recipient toUserId is required for forwarding' }, { status: 400 });
      }
      const recipientId = parseInt(toUserId);

      // 1. Update File Holder
      updatedFile = await db.file.update({
        where: { id: fileId },
        data: {
          currentHolderId: recipientId,
          status: 'pending'
        }
      });

      // 2. Create File Movement
      await db.fileMovement.create({
        data: {
          fileId,
          fromUserId: currentActorId,
          toUserId: recipientId,
          note: note || 'File forwarded.',
        }
      });

      // 3. Decrement Sender Pending Count in KPI
      const senderKpi = await db.kPIRecord.findFirst({
        where: { userId: currentActorId, date: { gte: today } }
      });
      if (senderKpi) {
        await db.kPIRecord.update({
          where: { id: senderKpi.id },
          data: { pendingCount: Math.max(0, senderKpi.pendingCount - 1) }
        });
      }

      // 4. Increment Receiver Pending Count in KPI
      const receiverKpi = await db.kPIRecord.findFirst({
        where: { userId: recipientId, date: { gte: today } }
      });
      if (receiverKpi) {
        await db.kPIRecord.update({
          where: { id: receiverKpi.id },
          data: { pendingCount: receiverKpi.pendingCount + 1 }
        });
      } else {
        const latestKpi = await db.kPIRecord.findFirst({
          where: { userId: recipientId },
          orderBy: { date: 'desc' }
        });
        await db.kPIRecord.create({
          data: {
            userId: recipientId,
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

      // 5. Send Notification
      await db.notification.create({
        data: {
          userId: recipientId,
          type: 'high_risk_file',
          message: `File forwarded to you by User ID ${currentActorId}: ${file.subject}`,
        }
      });

    } else if (action === 'approve') {
      // 1. Update File Status
      updatedFile = await db.file.update({
        where: { id: fileId },
        data: { status: 'approved' }
      });

      // 2. Create Movement record with digital signature
      await db.fileMovement.create({
        data: {
          fileId,
          fromUserId: currentActorId,
          toUserId: file.createdById, // Send back to creator
          note: note || 'File approved with digital signature.',
          digitalSignatureHash: digitalSignatureHash || sha256(`APPROVED-${fileId}-${currentActorId}`)
        }
      });

      // 3. Update Actor's KPI: decrement pending, and increment completion pct
      const actorKpi = await db.kPIRecord.findFirst({
        where: { userId: currentActorId, date: { gte: today } }
      });
      if (actorKpi) {
        await db.kPIRecord.update({
          where: { id: actorKpi.id },
          data: {
            pendingCount: Math.max(0, actorKpi.pendingCount - 1),
            completionPct: Math.min(100, actorKpi.completionPct + 2.5),
            productivityScore: Math.min(100, actorKpi.productivityScore + 1.5),
            dpi: Math.min(100, actorKpi.dpi + 1.5)
          }
        });
      }

      // 4. Send notification to creator
      await db.notification.create({
        data: {
          userId: file.createdById,
          type: 'performance_improvement',
          message: `Your file has been APPROVED: ${file.subject}`,
        }
      });

    } else if (action === 'reject') {
      // 1. Update File Status
      updatedFile = await db.file.update({
        where: { id: fileId },
        data: { status: 'rejected' }
      });

      // 2. Create Movement record
      await db.fileMovement.create({
        data: {
          fileId,
          fromUserId: currentActorId,
          toUserId: file.createdById,
          note: note || 'File rejected/returned with remarks.',
        }
      });

      // 3. Update Actor KPI
      const actorKpi = await db.kPIRecord.findFirst({
        where: { userId: currentActorId, date: { gte: today } }
      });
      if (actorKpi) {
        await db.kPIRecord.update({
          where: { id: actorKpi.id },
          data: {
            pendingCount: Math.max(0, actorKpi.pendingCount - 1),
            qualityScore: Math.max(30, actorKpi.qualityScore - 2.0)
          }
        });
      }

      // 4. Send notification
      await db.notification.create({
        data: {
          userId: file.createdById,
          type: 'goal_delayed',
          message: `Your file has been REJECTED/RETURNED: ${file.subject}`,
        }
      });
    }

    // Write Chained Audit Vault Entry
    const lastAudit = await db.auditLogEntry.findFirst({
      orderBy: { id: 'desc' }
    });
    const prevHash = lastAudit?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date();
    const actionDetails = `File ${file.subject} (ID: ${file.id}) action '${action}' taken by User ${currentActorId}. Note: ${note || 'None'}.`;
    const auditActionType = action === 'approve' ? 'digital_signature' : 'goal_updated';

    const hashInput = prevHash + `${currentActorId}-${auditActionType}-${file.id}-File-${actionDetails}-${timestamp.getTime()}`;
    const currentHash = sha256(hashInput);

    await db.auditLogEntry.create({
      data: {
        actorId: currentActorId,
        actionType: auditActionType,
        entityId: file.id,
        entityType: 'File',
        details: actionDetails,
        timestamp,
        previousHash: prevHash,
        currentHash
      }
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error('Error updating file action:', error);
    return NextResponse.json({ error: 'Failed to update file action' }, { status: 500 });
  }
}
