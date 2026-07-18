import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateBenchmarkIndex } from '@/lib/formulas';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scopeDeptId = searchParams.get('departmentId');

    // 1. Core KPIs
    // Total pending files across organization
    const pendingFilesCount = await db.file.count({ where: { status: 'pending' } });
    
    // Total goals
    const totalGoals = await db.goal.count({ where: { status: { not: 'archived' } } });
    const completedGoals = await db.goal.count({ where: { status: 'completed' } });
    const goalsOnTrack = await db.goal.count({ where: { status: 'on_track' } });
    const goalCompletionPct = totalGoals === 0 ? 100 : parseFloat(((completedGoals / totalGoals) * 100).toFixed(1));

    // Latest user KPI records to calculate overall DPI and satisfaction
    const users = await db.user.findMany({ include: { department: true } });
    
    const kpis: any[] = [];
    for (const u of users) {
      const latestKpi = await db.kPIRecord.findFirst({
        where: { userId: u.id },
        orderBy: { date: 'desc' }
      });
      if (latestKpi) kpis.push(latestKpi);
    }

    const overallDpi = kpis.length === 0 ? 75.0 : parseFloat((kpis.reduce((sum, k) => sum + k.dpi, 0) / kpis.length).toFixed(1));
    const citizenSatisfaction = kpis.length === 0 ? 4.2 : parseFloat((kpis.reduce((sum, k) => sum + k.citizenRating, 0) / kpis.length).toFixed(1));

    // 2. Department Rankings
    const departments = await db.department.findMany({
      include: {
        users: true
      }
    });

    const deptRankings = await Promise.all(departments.map(async (dept) => {
      // Find average DPI for users in this department
      const userIds = dept.users.map(u => u.id);
      let avgProd = 70.0;
      let backlog = 0;

      if (userIds.length > 0) {
        const records = [];
        for (const id of userIds) {
          const r = await db.kPIRecord.findFirst({
            where: { userId: id },
            orderBy: { date: 'desc' }
          });
          if (r) records.push(r);
        }
        if (records.length > 0) {
          avgProd = records.reduce((sum, r) => sum + r.productivityScore, 0) / records.length;
          backlog = records.reduce((sum, r) => sum + r.pendingCount, 0);
        }
      }

      return {
        id: dept.id,
        name: dept.name,
        level: dept.level,
        avgProductivity: parseFloat(avgProd.toFixed(1)),
        backlog,
        status: avgProd < 65 ? 'At Risk' : 'Active'
      };
    }));

    deptRankings.sort((a, b) => b.avgProductivity - a.avgProductivity);

    const departmentsAtRisk = deptRankings.filter(d => d.status === 'At Risk');

    // 3. AI Recommendations & Alerts
    const aiRecommendations = await db.aIRecommendation.findMany({
      where: { status: 'pending' },
      orderBy: { confidenceScore: 'desc' }
    });

    // 4. Priorities (Combine high-risk recommendations and goals nearing deadline)
    const priorities = [
      ...aiRecommendations.filter(r => r.confidenceScore > 0.8).map(r => ({
        id: `rec-${r.id}`,
        title: r.message,
        urgency: 'HIGH',
        type: 'AI_ALERT'
      })),
      ...(await db.goal.findMany({
        where: { status: 'at_risk' },
        take: 3
      })).map(g => ({
        id: `goal-${g.id}`,
        title: `Goal at risk: "${g.title}" (Target deadline: ${new Date(g.deadline).toLocaleDateString()})`,
        urgency: 'HIGH',
        type: 'GOAL_DELAY'
      }))
    ].slice(0, 5);

    // 5. Citizen Impact Outcomes
    const citizenRecords = await db.citizenServiceRecord.findMany({
      include: { department: true }
    });
    const totalServed = citizenRecords.reduce((sum, r) => sum + r.citizensServed, 0);
    const avgWaitDays = citizenRecords.length === 0 ? 4.0 : citizenRecords.reduce((sum, r) => sum + r.avgWaitDays, 0) / citizenRecords.length;
    const baseWaitDays = citizenRecords.length === 0 ? 8.0 : citizenRecords.reduce((sum, r) => sum + r.baselineWaitDays, 0) / citizenRecords.length;
    const daysReduced = parseFloat(Math.max(0, baseWaitDays - avgWaitDays).toFixed(1));
    const citizenImprovementPct = baseWaitDays === 0 ? 0 : parseFloat(((baseWaitDays - avgWaitDays) / baseWaitDays * 100).toFixed(1));

    // 6. Benchmarks Comparison Data
    // Group users by department to compile peer averages for benchmarks page
    const benchmarkData = users
      .filter(u => u.personaType === 'officer')
      .map(u => {
        const uKpi = kpis.find(k => k.userId === u.id);
        const score = uKpi ? uKpi.productivityScore : 70.0;
        
        // Find department average for this user's peer group
        const deptAvg = deptRankings.find(d => d.id === u.departmentId)?.avgProductivity || 70.0;
        const benchmarkIdx = calculateBenchmarkIndex(score, deptAvg);

        return {
          name: u.name,
          designation: u.designation,
          department: u.department?.name || 'Unassigned',
          score: parseFloat(score.toFixed(1)),
          peerAvg: parseFloat(deptAvg.toFixed(1)),
          benchmarkIndex: benchmarkIdx,
          avgResolutionTime: uKpi ? parseFloat(uKpi.avgResolutionTime.toFixed(1)) : 3.5,
          rank: 1 // compiled dynamically on client
        };
      });

    // Sort benchmark results
    benchmarkData.sort((a, b) => b.score - a.score);
    benchmarkData.forEach((item, index) => {
      item.rank = index + 1;
    });

    return NextResponse.json({
      metrics: {
        overallDpi,
        goalCompletionPct,
        goalsOnTrack,
        departmentsAtRiskCount: departmentsAtRisk.length,
        departmentsAtRiskList: departmentsAtRisk.map(d => d.name),
        pendingFilesCount,
        citizenSatisfaction,
        totalServed,
        daysReduced,
        citizenImprovementPct
      },
      priorities,
      aiRecommendations,
      deptRankings,
      benchmarkData,
      departments,
      citizenRecords
    });
  } catch (error) {
    console.error('Error compiling admin dashboard payload:', error);
    return NextResponse.json({ error: 'Failed to compile dashboard metrics' }, { status: 500 });
  }
}
