import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

function sha256(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// GET /api/goals?userId=X
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdStr = searchParams.get('userId');

    if (!userIdStr) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    const userId = parseInt(userIdStr);

    // Fetch user info to determine scope
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { department: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let goals;

    if (user.personaType === 'secretary' || user.role === 'secretary' || user.personaType === 'auditor' || user.personaType === 'hr' || user.personaType === 'reform') {
      // Secretary and global personas see ALL goals
      goals = await db.goal.findMany({
        where: {
          status: { not: 'archived' }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (user.personaType === 'teamlead') {
      // Team Leader sees their department's goals, national/state goals, plus child goals
      goals = await db.goal.findMany({
        where: {
          OR: [
            { level: 'national' },
            { level: 'state' },
            { level: 'department' },
            { level: 'officer', parentGoalId: { not: null } }
          ],
          status: { not: 'archived' }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Officer sees high-level goals + goals they own
      goals = await db.goal.findMany({
        where: {
          status: { not: 'archived' },
          OR: [
            { level: 'national' },
            { level: 'state' },
            { level: 'department' },
            { ownerType: 'individual', ownerId: userId }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Attach user/dept owner names for readability
    const enrichedGoals = await Promise.all(goals.map(async (goal) => {
      let ownerName = 'Unknown';
      if (goal.ownerType === 'individual') {
        const u = await db.user.findUnique({ where: { id: goal.ownerId } });
        ownerName = u ? u.name : 'Unknown Officer';
      } else if (goal.ownerType === 'department' || goal.ownerType === 'team') {
        const d = await db.department.findUnique({ where: { id: goal.ownerId } });
        ownerName = d ? d.name : 'Unknown Department';
      }

      // Fetch task statistics
      const tasks = await db.task.findMany({ where: { goalId: goal.id } });
      const completedTasks = tasks.filter(t => t.status === 'done').length;

      return {
        ...goal,
        ownerName,
        totalTasks: tasks.length,
        completedTasks
      };
    }));

    return NextResponse.json(enrichedGoals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

// POST /api/goals
// Create a new goal
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, level, parentGoalId, ownerType, ownerId, targetMetric, targetValue, deadline, successParameter, createdById } = body;

    if (!title || !level || !ownerType || !ownerId || !targetMetric || !targetValue || !deadline || !createdById) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const creatorId = parseInt(createdById);

    // 1. Create Goal
    const goal = await db.goal.create({
      data: {
        title,
        description,
        level,
        parentGoalId: parentGoalId ? parseInt(parentGoalId) : null,
        ownerType,
        ownerId: parseInt(ownerId),
        targetMetric,
        targetValue: parseFloat(targetValue),
        currentValue: 0.0,
        deadline: new Date(deadline),
        status: 'pending',
        successParameter: successParameter || '100% completion',
        createdById: creatorId
      }
    });

    // 2. Create Audit Vault entry
    const lastAudit = await db.auditLogEntry.findFirst({
      orderBy: { id: 'desc' }
    });
    const prevHash = lastAudit?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date();
    const actionDetails = `Goal '${goal.title}' (ID: ${goal.id}) created at level '${level}' by User ${creatorId}.`;
    const hashInput = prevHash + `${creatorId}-goal_created-${goal.id}-Goal-${actionDetails}-${timestamp.getTime()}`;
    const currentHash = sha256(hashInput);

    await db.auditLogEntry.create({
      data: {
        actorId: creatorId,
        actionType: 'goal_created',
        entityId: goal.id,
        entityType: 'Goal',
        details: actionDetails,
        timestamp,
        previousHash: prevHash,
        currentHash
      }
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
