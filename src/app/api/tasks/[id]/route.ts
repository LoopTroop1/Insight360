import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateProductivityScore, DEFAULT_WEIGHTS } from '@/lib/formulas';
import crypto from 'crypto';

function sha256(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// PUT /api/tasks/[id]
// Updates task status and completion percentage, updating user's KPI telemetry dynamically
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = parseInt(params.id);
    const body = await request.json();
    const { status, completionPct } = body;

    if (!status || completionPct === undefined) {
      return NextResponse.json({ error: 'status and completionPct are required' }, { status: 400 });
    }

    // 1. Fetch Task details
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { goal: true }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const userId = task.assignedToId;

    // 2. Update Task
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        status,
        completionPct: parseFloat(completionPct),
      }
    });

    // 3. Dynamically re-compute User's KPI Records
    // Get all user tasks
    const userTasks = await db.task.findMany({
      where: { assignedToId: userId }
    });

    const totalTasks = userTasks.length;
    const completedTasks = userTasks.filter(t => t.status === 'done' || t.completionPct === 100).length;
    const completionRate = totalTasks === 0 ? 1 : completedTasks / totalTasks;

    // Get today's KPI Record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const kpi = await db.kPIRecord.findFirst({
      where: {
        userId,
        date: { gte: today }
      }
    });

    // Get weight configurations for this user's department
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { department: true }
    });

    let weights = DEFAULT_WEIGHTS;
    if (user?.departmentId) {
      const dbWeights = await db.departmentWeight.findUnique({
        where: { departmentId: user.departmentId }
      });
      if (dbWeights) {
        weights = {
          w1: dbWeights.w1,
          w2: dbWeights.w2,
          w3: dbWeights.w3,
          w4: dbWeights.w4,
          w5: dbWeights.w5,
          w6: dbWeights.w6
        };
      }
    }

    if (kpi) {
      // Recalculate productivity score
      const prodScore = calculateProductivityScore({
        completionRate,
        timelinessScore: kpi.avgResolutionTime > 24 ? 0.70 : 0.90, // mock derived
        qualityScore: kpi.qualityScore / 100,
        attendanceScore: kpi.attendancePct / 100,
        collaborationScore: kpi.collaborationScore / 100,
        delayPenalty: kpi.delayPct / 100
      }, weights);

      await db.kPIRecord.update({
        where: { id: kpi.id },
        data: {
          completionPct: parseFloat((completionRate * 100).toFixed(2)),
          productivityScore: prodScore,
          dpi: prodScore
        }
      });
    }

    // 4. Create Audit Vault entry
    const lastAudit = await db.auditLogEntry.findFirst({
      orderBy: { id: 'desc' }
    });
    const prevHash = lastAudit?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date();
    const actionDetails = `Task ${task.description.slice(0, 30)}... status updated to '${status}' (Pct: ${completionPct}%) by User ${userId}.`;
    
    // Map task update to 'goal_updated' in SQLite audit ledger
    const hashInput = prevHash + `${userId}-goal_updated-${task.id}-Task-${actionDetails}-${timestamp.getTime()}`;
    const currentHash = sha256(hashInput);

    await db.auditLogEntry.create({
      data: {
        actorId: userId,
        actionType: 'goal_updated',
        entityId: task.id,
        entityType: 'Task',
        details: actionDetails,
        timestamp,
        previousHash: prevHash,
        currentHash
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
