import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/audit-vault
export async function GET(request: Request) {
  try {
    const logs = await db.auditLogEntry.findMany({
      include: {
        actor: {
          select: {
            name: true,
            designation: true,
            department: { select: { name: true } }
          }
        }
      },
      orderBy: { id: 'desc' },
      take: 50 // cap at 50 for page size
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit vault logs' }, { status: 500 });
  }
}
