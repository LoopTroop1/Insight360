import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, message } = body;

    if (!userId || !message) {
      return NextResponse.json({ error: 'userId and message are required' }, { status: 400 });
    }

    const officerId = parseInt(userId);

    // 1. Find the officer and supervisor
    const officer = await db.user.findUnique({
      where: { id: officerId },
      include: { department: true }
    });

    if (!officer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find supervisor in same department (personaType = teamlead) or default to Secretary
    let supervisor = await db.user.findFirst({
      where: {
        departmentId: officer.departmentId,
        personaType: 'teamlead'
      }
    });

    if (!supervisor) {
      // Default to Rajiv Gauba (Cabinet Secretary)
      supervisor = await db.user.findFirst({
        where: { personaType: 'secretary' }
      });
    }

    if (!supervisor) {
      return NextResponse.json({ error: 'No supervisor found to handle request' }, { status: 404 });
    }

    // 2. Create Notification for Supervisor
    const notification = await db.notification.create({
      data: {
        userId: supervisor.id,
        type: 'ai_recommendation',
        message: `Workload Help Request from ${officer.name} (${officer.designation}): "${message}"`,
      }
    });

    // 3. Auto-generate an AI Recommendation for reassignment risk
    await db.aIRecommendation.create({
      data: {
        type: 'reassignment',
        targetUserId: officerId,
        message: `Workload overload alert: ${officer.name} has flagged stress. Propose reassigning pending files to balance team capacity.`,
        confidenceScore: 0.95,
        status: 'pending'
      }
    });

    return NextResponse.json({ success: true, supervisor: supervisor.name });
  } catch (error) {
    console.error('Error submitting help request:', error);
    return NextResponse.json({ error: 'Failed to submit help request' }, { status: 500 });
  }
}
