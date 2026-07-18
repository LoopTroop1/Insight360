import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateDelayRisk, calculateBurnoutRisk } from '@/lib/formulas';

export async function GET(request: Request) {
  try {
    // 1. Fetch pending files to run Delay Risk prediction
    const pendingFiles = await db.file.findMany({
      where: { status: 'pending' },
      include: {
        currentHolder: {
          include: {
            department: true
          }
        }
      }
    });

    const fileDelayPredictions = await Promise.all(pendingFiles.map(async (file) => {
      // Find historical holder files to check if they have a slow turnaround
      const holderId = file.currentHolderId;
      const history = await db.fileMovement.findMany({
        where: { toUserId: holderId },
        take: 10
      });

      const avgHolderDays = history.length === 0 ? 3.0 : 2.5; // mock based

      const created = new Date(file.createdAt);
      const daysPending = Math.max(0, Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)));

      // Count holder's actual backlog
      const holderBacklog = await db.file.count({
        where: { currentHolderId: holderId, status: 'pending' }
      });

      // Count movements as rework proxy
      const movementsCount = await db.fileMovement.count({
        where: { fileId: file.id }
      });
      const reworkCount = movementsCount > 2 ? movementsCount - 2 : 0;

      const prediction = calculateDelayRisk({
        fileAgeDays: daysPending,
        slaCategoryDays: file.slaCategoryDays,
        holderBacklog,
        deptAvgBacklog: 3.5,
        onLeave: false,
        reworkCount,
        category: file.category
      });

      return {
        id: file.id,
        subject: file.subject,
        priority: file.priority,
        holderName: file.currentHolder.name,
        holderDesignation: file.currentHolder.designation,
        departmentName: file.currentHolder.department?.name || 'e-Office Division',
        daysPending,
        slaDays: file.slaCategoryDays,
        riskScore: prediction.score,
        riskLevel: prediction.level,
        reason: prediction.reason,
        employeeReason: file.employeeReason || 'Routine review queue.'
      };
    }));

    // Sort predictions: highest risk level first
    fileDelayPredictions.sort((a, b) => b.riskScore - a.riskScore);

    // 2. Fetch all officers for the Digital Twin Simulator
    const officers = await db.user.findMany({
      where: { personaType: 'officer' },
      include: {
        department: true
      }
    });

    const simulatorOfficers = await Promise.all(officers.map(async (off) => {
      const latestKpi = await db.kPIRecord.findFirst({
        where: { userId: off.id },
        orderBy: { date: 'desc' }
      });
      
      const filesCount = await db.file.count({
        where: { currentHolderId: off.id, status: 'pending' }
      });

      return {
        id: off.id,
        name: off.name,
        designation: off.designation,
        departmentName: off.department?.name || 'e-Office Division',
        currentDpi: latestKpi ? latestKpi.dpi : 70.0,
        currentBacklog: filesCount,
        pendingCount: latestKpi ? latestKpi.pendingCount : 0
      };
    }));

    // 2b. Generate dynamic Burnout Shield proposals based on department & designation matching
    // Group simulatorOfficers by key: `${departmentId}-${designation}`
    const peerGroups: Record<string, any[]> = {};
    simulatorOfficers.forEach(o => {
      // Find the user object to get departmentId
      const u = officers.find(usr => usr.id === o.id);
      if (u && u.departmentId !== null) {
        const key = `${u.departmentId}-${u.designation}`;
        if (!peerGroups[key]) peerGroups[key] = [];
        peerGroups[key].push({ ...o, userObj: u });
      }
    });

    // Check each peer group for workload imbalances
    for (const key of Object.keys(peerGroups)) {
      const groupOfficers = peerGroups[key];
      if (groupOfficers.length < 2) continue;

      // Find highest workload officer (A) and lowest workload officer (B)
      let maxOfficer = groupOfficers[0];
      let minOfficer = groupOfficers[0];

      groupOfficers.forEach(o => {
        if (o.currentBacklog > maxOfficer.currentBacklog) {
          maxOfficer = o;
        }
        if (o.currentBacklog < minOfficer.currentBacklog) {
          minOfficer = o;
        }
      });

      const backlogDiff = maxOfficer.currentBacklog - minOfficer.currentBacklog;
      // Propose reassignment if the difference is at least 3 files
      if (backlogDiff >= 3) {
        const transferCount = Math.floor(backlogDiff / 2);
        if (transferCount > 0) {
          // Fetch the first transferCount pending files belonging to maxOfficer
          const filesToReassign = await db.file.findMany({
            where: { currentHolderId: maxOfficer.id, status: 'pending' },
            take: transferCount
          });

          if (filesToReassign.length > 0) {
            const filesStr = filesToReassign.map(f => f.id).join(',');
            
            // Check if this proposed event already exists in db to prevent duplicate proposals
            const existing = await db.burnoutShieldEvent.findFirst({
              where: {
                officerId: maxOfficer.id,
                reassignedToId: minOfficer.id,
                status: 'proposed'
              }
            });

            if (!existing) {
              await db.burnoutShieldEvent.create({
                data: {
                  officerId: maxOfficer.id,
                  reassignedToId: minOfficer.id,
                  filesReassigned: filesStr,
                  triggerReason: `Workload balance shield proposal: Officer ${maxOfficer.name} holds a high backlog of ${maxOfficer.currentBacklog} pending files, while coworker ${minOfficer.name} (${minOfficer.designation}) in the same department holds only ${minOfficer.currentBacklog} pending files. Reassigning ${transferCount} files to equalize workloads.`,
                  status: 'proposed'
                }
              });
            }
          }
        }
      }
    }

    // 3. Fetch active burnout shield proposals
    const proposedReassignments = await db.burnoutShieldEvent.findMany({
      where: { status: 'proposed' },
      include: {
        officer: {
          include: { department: true }
        },
        reassignedTo: true
      }
    });

    return NextResponse.json({
      fileDelayPredictions,
      simulatorOfficers,
      proposedReassignments
    });
  } catch (error) {
    console.error('Error fetching AI Decision Center payload:', error);
    return NextResponse.json({ error: 'Failed to fetch AI data' }, { status: 500 });
  }
}
