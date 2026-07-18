import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

function sha256(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// GET /api/weights?departmentId=X
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentIdStr = searchParams.get('departmentId');

    if (!departmentIdStr) {
      return NextResponse.json({ error: 'departmentId is required' }, { status: 400 });
    }
    const departmentId = parseInt(departmentIdStr);

    const weights = await db.departmentWeight.findUnique({
      where: { departmentId }
    });

    return NextResponse.json(weights);
  } catch (error) {
    console.error('Error fetching department weights:', error);
    return NextResponse.json({ error: 'Failed to fetch department weights' }, { status: 500 });
  }
}

// POST /api/weights
// Configures and saves w1 to w6 weights for a department
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { departmentId, w1, w2, w3, w4, w5, w6, actorId } = body;

    if (!departmentId || !actorId) {
      return NextResponse.json({ error: 'departmentId and actorId are required' }, { status: 400 });
    }

    const deptId = parseInt(departmentId);
    const currentActorId = parseInt(actorId);

    // Upsert the weights
    const weights = await db.departmentWeight.upsert({
      where: { departmentId: deptId },
      update: {
        w1: parseFloat(w1),
        w2: parseFloat(w2),
        w3: parseFloat(w3),
        w4: parseFloat(w4),
        w5: parseFloat(w5),
        w6: parseFloat(w6),
      },
      create: {
        departmentId: deptId,
        w1: parseFloat(w1),
        w2: parseFloat(w2),
        w3: parseFloat(w3),
        w4: parseFloat(w4),
        w5: parseFloat(w5),
        w6: parseFloat(w6),
      }
    });

    // Write Chained Audit Log
    const lastAudit = await db.auditLogEntry.findFirst({
      orderBy: { id: 'desc' }
    });
    const prevHash = lastAudit?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date();
    const actionDetails = `KPI Weights w1-w6 reconfigured for Department ID ${deptId} (w1: ${w1}, w2: ${w2}, w3: ${w3}, w4: ${w4}, w5: ${w5}, w6: ${w6}) by User ${currentActorId}.`;
    
    // Map weight changes to 'goal_updated' inside standard SQLite audit categories
    const hashInput = prevHash + `${currentActorId}-goal_updated-${weights.id}-DepartmentWeight-${actionDetails}-${timestamp.getTime()}`;
    const currentHash = sha256(hashInput);

    await db.auditLogEntry.create({
      data: {
        actorId: currentActorId,
        actionType: 'goal_updated',
        entityId: weights.id,
        entityType: 'DepartmentWeight',
        details: actionDetails,
        timestamp,
        previousHash: prevHash,
        currentHash
      }
    });

    return NextResponse.json(weights);
  } catch (error) {
    console.error('Error saving department weights:', error);
    return NextResponse.json({ error: 'Failed to save department weights' }, { status: 500 });
  }
}
