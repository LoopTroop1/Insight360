import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdStr = searchParams.get('userId');

    if (!userIdStr) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    const userId = parseInt(userIdStr);

    // 1. Fetch User details
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { department: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Fetch Active Tasks
    const tasks = await db.task.findMany({
      where: { assignedToId: userId },
      include: { goal: true },
      orderBy: { deadline: 'asc' }
    });

    // 3. Fetch Pending Files held by user
    const pendingFiles = await db.file.findMany({
      where: { currentHolderId: userId, status: 'pending' },
      orderBy: { createdAt: 'desc' }
    });

    // 4. Fetch Latest KPI Record
    const latestKpi = await db.kPIRecord.findFirst({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    // 5. Fetch 8 Weeks History for Trend Chart
    const kpiHistory = await db.kPIRecord.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
      take: 8
    });

    // 6. Fetch Latest Engagement Record for badges
    const engagement = await db.engagementRecord.findFirst({
      where: { userId },
      orderBy: { month: 'desc' }
    });

    // 7. Fetch Notifications
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // 8. Fetch upcoming deadlines (7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const upcomingDeadlines = [
      ...tasks.filter(t => t.status !== 'done' && new Date(t.deadline) <= sevenDaysFromNow).map(t => ({
        id: `task-${t.id}`,
        type: 'TASK',
        title: t.description.slice(0, 45) + '...',
        deadline: t.deadline
      })),
      ...(await db.goal.findMany({
        where: { ownerType: 'individual', ownerId: userId, status: { not: 'completed' }, deadline: { lte: sevenDaysFromNow } }
      })).map(g => ({
        id: `goal-${g.id}`,
        type: 'GOAL',
        title: g.title,
        deadline: g.deadline
      }))
    ].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

    return NextResponse.json({
      user,
      tasks,
      pendingFiles,
      latestKpi,
      kpiHistory: kpiHistory.map(k => ({
        week: new Date(k.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        dpi: k.dpi,
        quality: k.qualityScore,
        delay: k.delayPct
      })),
      engagement,
      notifications,
      upcomingDeadlines
    });
  } catch (error) {
    console.error('Error fetching officer dashboard payload:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
