import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateBurnoutRisk } from '@/lib/formulas';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leaderIdStr = searchParams.get('leaderId');

    if (!leaderIdStr) {
      return NextResponse.json({ error: 'leaderId is required' }, { status: 400 });
    }
    const leaderId = parseInt(leaderIdStr);

    // 1. Fetch Leader Info and Department
    const leader = await db.user.findUnique({
      where: { id: leaderId },
      include: { department: true }
    });

    if (!leader || !leader.departmentId) {
      return NextResponse.json({ error: 'Leader department not found' }, { status: 404 });
    }

    const deptId = leader.departmentId;

    // 2. Fetch Team Members (Officers in same department)
    const team = await db.user.findMany({
      where: {
        departmentId: deptId,
        personaType: 'officer' // leaf level officers
      }
    });

    const teamIds = team.map(t => t.id);

    // 3. Compile Department average benchmarks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const teamKpis: any[] = [];
    for (const member of team) {
      const k = await db.kPIRecord.findFirst({
        where: { userId: member.id },
        orderBy: { date: 'desc' }
      });
      if (k) teamKpis.push(k);
    }

    const deptAvgPending = teamKpis.length === 0 ? 5.0 : teamKpis.reduce((sum, k) => sum + k.pendingCount, 0) / teamKpis.length;
    const deptAvgDpi = teamKpis.length === 0 ? 70.0 : teamKpis.reduce((sum, k) => sum + k.dpi, 0) / teamKpis.length;

    // 4. Calculate detailed metrics & burnout risk per member
    const teamMembersData = await Promise.all(team.map(async (member) => {
      const kpi = teamKpis.find(k => k.userId === member.id);
      const pendingCount = kpi ? kpi.pendingCount : 0;
      const attendancePct = kpi ? kpi.attendancePct : 90;
      
      // Count tasks
      const tasks = await db.task.findMany({ where: { assignedToId: member.id } });
      const overdueTasks = tasks.filter(t => t.status !== 'done' && new Date(t.deadline) < new Date()).length;
      
      // Calculate Burnout Risk
      const riskResult = calculateBurnoutRisk({
        pendingCount,
        deptAvgPending,
        overdueTaskCount: overdueTasks,
        totalTaskCount: tasks.length,
        attendancePct
      });

      return {
        id: member.id,
        name: member.name,
        designation: member.designation,
        avatarUrl: member.avatarUrl,
        dpi: kpi ? kpi.dpi : 70.0,
        pendingFiles: pendingCount,
        overdueTasks,
        attendancePct,
        burnoutRisk: riskResult.score,
        burnoutRiskLevel: riskResult.level,
        burnoutReason: riskResult.reason
      };
    }));

    // 5. Fetch Burnout Shield proposals
    // Propose file reassignments for high risk officers (handled dynamically/seeded)
    const proposedReassignments = await db.burnoutShieldEvent.findMany({
      where: {
        officerId: { in: teamIds },
        status: 'proposed'
      },
      include: {
        officer: true,
        reassignedTo: true
      }
    });

    // 6. Fetch Department Goals
    const deptGoals = await db.goal.findMany({
      where: { ownerType: 'department', ownerId: deptId, status: { not: 'archived' } }
    });

    return NextResponse.json({
      department: leader.department,
      deptAvgDpi: parseFloat(deptAvgDpi.toFixed(1)),
      deptAvgPending: parseFloat(deptAvgPending.toFixed(1)),
      teamMembers: teamMembersData,
      proposedReassignments,
      deptGoals
    });
  } catch (error) {
    console.error('Error fetching team leader dashboard data:', error);
    return NextResponse.json({ error: 'Failed to compile team leader dashboard data' }, { status: 500 });
  }
}
