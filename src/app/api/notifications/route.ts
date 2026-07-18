import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/notifications?userId=X
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdStr = searchParams.get('userId');
    if (!userIdStr) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    const userId = parseInt(userIdStr);

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST /api/notifications
// Marks all as read
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, notificationId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (notificationId) {
      // Mark specific notification as read
      await db.notification.update({
        where: { id: parseInt(notificationId) },
        data: { read: true }
      });
    } else {
      // Mark all as read
      await db.notification.updateMany({
        where: { userId: parseInt(userId), read: false },
        data: { read: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
