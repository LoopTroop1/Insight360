import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/tasks?userId=X
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdStr = searchParams.get('userId');

    if (!userIdStr) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    const userId = parseInt(userIdStr);

    const tasks = await db.task.findMany({
      where: { assignedToId: userId },
      include: {
        goal: true
      },
      orderBy: {
        deadline: 'asc'
      }
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}
