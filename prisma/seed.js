const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function main() {
  console.log("Starting database seed...");

  // Clear existing data in reverse dependency order
  await prisma.departmentWeight.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.reviewComment.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLogEntry.deleteMany({});
  await prisma.sparrowSyncRecord.deleteMany({});
  await prisma.citizenServiceRecord.deleteMany({});
  await prisma.burnoutShieldEvent.deleteMany({});
  await prisma.digitalTwinSimulation.deleteMany({});
  await prisma.aIRecommendation.deleteMany({});
  await prisma.benchmarkRecord.deleteMany({});
  await prisma.engagementRecord.deleteMany({});
  await prisma.kPIRecord.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.fileMovement.deleteMany({});
  await prisma.file.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  console.log("Cleaned up existing database records.");

  // 1. Departments Hierarchy
  // Ministry -> State -> District -> Department -> Team
  const ministry = await prisma.department.create({
    data: { name: "Ministry of Electronics & IT (MeitY)", level: "national", ministryId: 1 },
  });
  const stateIT = await prisma.department.create({
    data: { name: "State IT Department (Karnataka)", level: "state", parentDepartmentId: ministry.id, ministryId: ministry.id },
  });
  const districtIT = await prisma.department.create({
    data: { name: "District IT Center (Bengaluru)", level: "district", parentDepartmentId: stateIT.id, ministryId: ministry.id },
  });
  const eGovDept = await prisma.department.create({
    data: { name: "e-Governance Division", level: "department", parentDepartmentId: districtIT.id, ministryId: ministry.id },
  });
  const prodTeam = await prisma.department.create({
    data: { name: "Productivity Task Force", level: "team", parentDepartmentId: eGovDept.id, ministryId: ministry.id },
  });

  console.log("Created departments hierarchy.");

  // 2. Department Weights (w1 to w6)
  const departments = [ministry, stateIT, districtIT, eGovDept, prodTeam];
  for (const dept of departments) {
    await prisma.departmentWeight.create({
      data: {
        departmentId: dept.id,
        w1: dept.level === "team" ? 0.35 : 0.30, // Completion Rate
        w2: dept.level === "team" ? 0.25 : 0.20, // Timeliness Score
        w3: 0.15, // Quality Score
        w4: 0.15, // Attendance Score
        w5: 0.10, // Collaboration Score
        w6: 0.20, // Delay Penalty
      },
    });
  }
  console.log("Created default department weights.");

  // 3. Users (Personas & Roles)
  // Persons: Secretary (1), Ministry Admin (1), Department Head (1), Section Officer (2), Officers (8), Auditor (1), HR (1), Reform (1)
  const usersData = [
    { name: "Rajiv Gauba", email: "rajiv.gauba@gov.in", role: "secretary", personaType: "secretary", designation: "Cabinet Secretary", departmentId: ministry.id, avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
    { name: "Sanjay Bahl", email: "sanjay.bahl@gov.in", role: "ministry_admin", personaType: "secretary", designation: "Director General", departmentId: ministry.id, avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" },
    { name: "Alkesh Sharma", email: "alkesh.sharma@gov.in", role: "department_head", personaType: "teamlead", designation: "Joint Secretary", departmentId: eGovDept.id, avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" },
    { name: "Ramesh Kumar", email: "ramesh.kumar@gov.in", role: "section_officer", personaType: "teamlead", designation: "Section Officer", departmentId: eGovDept.id, avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150" },
    { name: "Amit Shah (Tech)", email: "amit.tech@gov.in", role: "section_officer", personaType: "teamlead", designation: "Team Leader", departmentId: prodTeam.id, avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150" },
    
    // Officers (Employees)
    { name: "Rajesh V", email: "rajesh.v@gov.in", role: "employee", personaType: "officer", designation: "Senior Scientist", departmentId: eGovDept.id, avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150" },
    { name: "Priya Sharma", email: "priya.sharma@gov.in", role: "employee", personaType: "officer", designation: "Senior Scientist", departmentId: eGovDept.id, avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
    { name: "Sunita Deshmukh", email: "sunita.d@gov.in", role: "employee", personaType: "officer", designation: "Scientist C", departmentId: prodTeam.id, avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" },
    { name: "Vikram Malhotra", email: "vikram.m@gov.in", role: "employee", personaType: "officer", designation: "Scientist C", departmentId: prodTeam.id, avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150" },
    { name: "Anand Sen", email: "anand.sen@gov.in", role: "employee", personaType: "officer", designation: "Assistant Section Officer", departmentId: prodTeam.id, avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
    { name: "Kavita Rao", email: "kavita.rao@gov.in", role: "employee", personaType: "officer", designation: "Data Entry Operator", departmentId: eGovDept.id, avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150" },
    { name: "Deepa N", email: "deepa.n@gov.in", role: "employee", personaType: "officer", designation: "District IT Officer", departmentId: districtIT.id, avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150" },
    { name: "Suresh Hegde", email: "suresh.h@gov.in", role: "employee", personaType: "officer", designation: "State Nodal Officer", departmentId: stateIT.id, avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150" },

    // Staff/Special Roles
    { name: "Vinod Prasad", email: "vinod.auditor@gov.in", role: "auditor", personaType: "auditor", designation: "Senior Auditor", departmentId: ministry.id, avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
    { name: "Shreya Ghoshal", email: "shreya.hr@gov.in", role: "hr", personaType: "hr", designation: "HR Director", departmentId: ministry.id, avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150" },
    { name: "Anil Swarup", email: "anil.reform@gov.in", role: "admin_reform_dept", personaType: "reform", designation: "Policy Advisor", departmentId: ministry.id, avatarUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150" }
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.create({ data: u });
    users.push(user);
  }
  console.log(`Created ${users.length} users with distinct roles.`);

  // Find user groupings for file/task assignments
  const ramesh = users.find(u => u.email === "ramesh.kumar@gov.in");
  const alkesh = users.find(u => u.email === "alkesh.sharma@gov.in");
  const amit = users.find(u => u.email === "amit.tech@gov.in");
  const rajesh = users.find(u => u.email === "rajesh.v@gov.in");
  const priya = users.find(u => u.email === "priya.sharma@gov.in");
  const sunita = users.find(u => u.email === "sunita.d@gov.in");
  const vikram = users.find(u => u.email === "vikram.m@gov.in");
  const anand = users.find(u => u.email === "anand.sen@gov.in");
  const kavita = users.find(u => u.email === "kavita.rao@gov.in");

  // 4. Seeding e-Office Files & Movements
  const fileCategories = ["e-Governance", "Budget Allocation", "Security Audit", "Infrastructure", "Policy Draft", "Public Grievance"];
  const priorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  
  console.log("Creating 50 files and their movement history...");
  const files = [];
  for (let i = 1; i <= 50; i++) {
    const category = fileCategories[i % fileCategories.length];
    const priority = priorities[i % priorities.length];
    const createdBy = users[i % users.length];
    // Determine active current holder
    const currentHolder = users[(i + 3) % users.length];

    const employeeReasons = [
      "Awaiting clarifications from technical lead on implementation feasibility.",
      "Pending budget verification and fund allocation clearance.",
      "Reviewing drafts for alignment with the updated security policies.",
      "Awaiting response on public grievance verification request.",
      "Pending inter-departmental signature signs.",
      "Verifying credentials of the selected implementation agency.",
      "Awaiting legal review on draft policy guidelines."
    ];

    const file = await prisma.file.create({
      data: {
        subject: `File-${1000 + i}: Discussion on ${category} Action Plan ${2026 + (i % 2)}`,
        category,
        priority,
        createdById: createdBy.id,
        currentHolderId: currentHolder.id,
        status: i % 7 === 0 ? "approved" : i % 8 === 0 ? "rejected" : i % 10 === 0 ? "archived" : "pending",
        slaCategoryDays: priority === "CRITICAL" ? 2 : priority === "HIGH" ? 5 : priority === "MEDIUM" ? 10 : 15,
        createdAt: new Date(Date.now() - (i * 2 * 24 * 60 * 60 * 1000)), // spread out creations
        employeeReason: employeeReasons[i % employeeReasons.length]
      }
    });
    files.push(file);

    // Create 1-3 movements per file
    const numMovements = 1 + (i % 3);
    let lastHolderId = createdBy.id;
    for (let m = 0; m < numMovements; m++) {
      let receiverId = currentHolder.id;
      if (m < numMovements - 1) {
        // Intermediary holder
        receiverId = ramesh.id;
      }
      
      const sigHash = m === numMovements - 1 && file.status === "approved"
        ? sha256(`APPROVED-FILE-${file.id}-${receiverId}`)
        : null;

      await prisma.fileMovement.create({
        data: {
          fileId: file.id,
          fromUserId: lastHolderId,
          toUserId: receiverId,
          note: m === 0 ? "Initiating file for review." : m === 1 ? "Forwarding with technical remarks for changes." : "Final recommendation for approval/disposal.",
          timestamp: new Date(file.createdAt.getTime() + (m * 24 * 60 * 60 * 1000)),
          digitalSignatureHash: sigHash
        }
      });
      lastHolderId = receiverId;
    }
  }
  console.log("Seeded files and file movements.");

  // 5. Cascading Goals (15 goals)
  // National (1) -> State (2) -> Department (4) -> Officer (8)
  console.log("Seeding cascading goals...");
  const natGoal = await prisma.goal.create({
    data: {
      title: "Digital India Productivity Enhancements",
      description: "Scale e-Office adoption and clear administrative backlog across all national divisions by 30%.",
      level: "national",
      ownerType: "department",
      ownerId: ministry.id,
      targetMetric: "FILES_PROCESSED",
      targetValue: 50000.0,
      currentValue: 12400.0,
      deadline: new Date("2026-12-31"),
      status: "on_track",
      successParameter: "Achieve 95% SLA compliance in file disposals",
      createdById: ramesh.id
    }
  });

  const stateGoal1 = await prisma.goal.create({
    data: {
      title: "Karnataka e-Office Expansion Drive",
      description: "Onboard all districts under Karnataka state portal to digital filing.",
      level: "state",
      parentGoalId: natGoal.id,
      ownerType: "department",
      ownerId: stateIT.id,
      targetMetric: "DISTRICTS_ONBOARDED",
      targetValue: 30.0,
      currentValue: 18.0,
      deadline: new Date("2026-11-30"),
      status: "on_track",
      successParameter: "At least 20 active offices per district in e-Office",
      createdById: ramesh.id
    }
  });

  const stateGoal2 = await prisma.goal.create({
    data: {
      title: "Public Service Waiting Time Reduction",
      description: "Speed up clearance of citizen services files.",
      level: "state",
      parentGoalId: natGoal.id,
      ownerType: "department",
      ownerId: stateIT.id,
      targetMetric: "WAITING_DAYS_REDUCED",
      targetValue: 15.0,
      currentValue: 6.5,
      deadline: new Date("2026-10-31"),
      status: "at_risk",
      successParameter: "Average turnaround time under 4 days",
      createdById: ramesh.id
    }
  });

  // Department Goals
  const deptGoal1 = await prisma.goal.create({
    data: {
      title: "e-Governance Backlog Clearance",
      description: "Clear pending files older than 15 days in e-Governance division.",
      level: "department",
      parentGoalId: stateGoal2.id,
      ownerType: "department",
      ownerId: eGovDept.id,
      targetMetric: "BACKLOG_FILES_CLEARED",
      targetValue: 200.0,
      currentValue: 145.0,
      deadline: new Date("2026-09-30"),
      status: "on_track",
      successParameter: "Zero files pending over 15 days",
      createdById: ramesh.id
    }
  });

  const deptGoal2 = await prisma.goal.create({
    data: {
      title: "Productivity Analytics Implementation",
      description: "Build and deploy the SIH performance tracking dashboard.",
      level: "department",
      parentGoalId: stateGoal1.id,
      ownerType: "department",
      ownerId: eGovDept.id,
      targetMetric: "DASHBOARD_COMPLETED_PCT",
      targetValue: 100.0,
      currentValue: 85.0,
      deadline: new Date("2026-08-31"),
      status: "on_track",
      successParameter: "All core features deployed with green light",
      createdById: ramesh.id
    }
  });

  // Officer Goals (Individual)
  const officerGoals = [];
  const activeOfficers = [rajesh, priya, sunita, vikram, anand, kavita];
  for (let i = 0; i < activeOfficers.length; i++) {
    const officer = activeOfficers[i];
    const goal = await prisma.goal.create({
      data: {
        title: `Officer Goal: ${officer.name} - Individual Disposal Targets`,
        description: `Process and clear personal file queue within set SLAs.`,
        level: "officer",
        parentGoalId: i % 2 === 0 ? deptGoal1.id : deptGoal2.id,
        ownerType: "individual",
        ownerId: officer.id,
        targetMetric: "FILES_CLEARED",
        targetValue: 50.0,
        currentValue: officer.email === "priya.sharma@gov.in" ? 15.0 : officer.email === "rajesh.v@gov.in" ? 42.0 : 30.0,
        deadline: new Date("2026-08-31"),
        status: officer.email === "priya.sharma@gov.in" ? "at_risk" : "on_track",
        successParameter: "Maintain individual timeliness score above 85%",
        createdById: ramesh.id
      }
    });
    officerGoals.push(goal);
  }
  console.log("Seeded goals hierarchy.");

  // 6. Tasks Seeding (80 tasks)
  console.log("Seeding 80 tasks linked to goals...");
  const taskStatusOptions = ["to-do", "in-progress", "done"];
  const goalsForTasks = [deptGoal1, deptGoal2, ...officerGoals];
  for (let t = 1; t <= 80; t++) {
    const goal = goalsForTasks[t % goalsForTasks.length];
    
    // Pick an officer assigned to this task
    const assignedOfficer = users[t % users.length];

    const status = t % 4 === 0 ? "done" : t % 3 === 0 ? "in-progress" : "to-do";
    const completionPct = status === "done" ? 100 : status === "in-progress" ? (20 + (t * 5) % 60) : 0;

    await prisma.task.create({
      data: {
        goalId: goal.id,
        assignedToId: assignedOfficer.id,
        description: `Task-${200 + t}: Detail action item supporting ${goal.title.slice(0, 30)}. Requires detailed compliance review.`,
        deadline: new Date(Date.now() + ((t % 7) * 24 * 60 * 60 * 1000) - (2 * 24 * 60 * 60 * 1000)),
        status,
        completionPct,
        createdAt: new Date(Date.now() - (10 * 24 * 60 * 60 * 1000))
      }
    });
  }
  console.log("Seeded tasks.");

  // 7. Telemetry & History (8 weeks)
  // For each active officer, write 8 weekly records.
  // Deliberate spread:
  // - Rajesh (High-performing, improving): DPI 75 -> 92
  // - Priya (Struggling, declining): DPI 60 -> 45
  // - Vikram (Burned out, high backlog, low attendance): DPI 50 -> 48
  // - Sunita (Stable average): DPI ~70
  // - Anand (Highly collaborative, good quality): DPI ~78
  // - Kavita (Stable): DPI ~65
  console.log("Generating 8 weeks of historical KPI & Engagement records...");
  const weeks = 8;
  const today = new Date();

  for (const officer of users) {
    let startDPI = 70;
    let trend = 0; // change per week
    let attendance = 0.90;
    let quality = 0.80;
    let collab = 0.75;
    
    if (officer.email === "rajesh.v@gov.in") {
      startDPI = 75;
      trend = 2.4;
      attendance = 0.96;
      quality = 0.90;
      collab = 0.85;
    } else if (officer.email === "priya.sharma@gov.in") {
      startDPI = 62;
      trend = -2.5;
      attendance = 0.82;
      quality = 0.65;
      collab = 0.60;
    } else if (officer.email === "vikram.m@gov.in") {
      startDPI = 52;
      trend = -0.5;
      attendance = 0.75;
      quality = 0.70;
      collab = 0.65;
    } else if (officer.email === "sunita.d@gov.in") {
      startDPI = 70;
      trend = 0.2;
      attendance = 0.92;
      quality = 0.80;
      collab = 0.78;
    } else if (officer.email === "anand.sen@gov.in") {
      startDPI = 76;
      trend = 0.8;
      attendance = 0.94;
      quality = 0.85;
      collab = 0.92;
    } else if (officer.email === "kavita.rao@gov.in") {
      startDPI = 64;
      trend = 0.1;
      attendance = 0.88;
      quality = 0.75;
      collab = 0.70;
    }

    for (let w = weeks; w >= 1; w--) {
      const recDate = new Date(today.getTime() - (w * 7 * 24 * 60 * 60 * 1000));
      const currentDPI = Math.min(100, Math.max(0, startDPI + (weeks - w) * trend));
      
      const compPct = currentDPI * 0.95;
      const delayPct = Math.max(0, 40 - currentDPI * 0.4);
      const pendingCount = officer.email === "vikram.m@gov.in" ? 14 + w : Math.max(1, Math.round(15 - currentDPI * 0.15));

      // 7a. KPI Records
      await prisma.kPIRecord.create({
        data: {
          userId: officer.id,
          date: recDate,
          completionPct: parseFloat(compPct.toFixed(2)),
          delayPct: parseFloat(delayPct.toFixed(2)),
          avgResolutionTime: parseFloat((48.0 - currentDPI * 0.3).toFixed(2)), // in hours
          pendingCount,
          attendancePct: parseFloat((attendance * 100).toFixed(2)),
          citizenRating: parseFloat((3.0 + currentDPI * 0.02).toFixed(2)), // out of 5
          collaborationScore: parseFloat((collab * 100).toFixed(2)),
          qualityScore: parseFloat((quality * 100).toFixed(2)),
          productivityScore: parseFloat(currentDPI.toFixed(2)),
          dpi: parseFloat(currentDPI.toFixed(2))
        }
      });
    }

    // 7b. Engagement Records (Monthly snapshots for last 2 months)
    const months = ["2026-05", "2026-06"];
    for (let mIdx = 0; mIdx < months.length; mIdx++) {
      const monthStr = months[mIdx];
      let recCount = 1;
      let feedback = 4.0;
      let skillDev = 10;
      let workload = 85;
      let survey = 80;

      if (officer.email === "rajesh.v@gov.in") {
        recCount = 4;
        feedback = 4.8;
        skillDev = 16;
        workload = 92;
        survey = 90;
      } else if (officer.email === "priya.sharma@gov.in") {
        recCount = 0;
        feedback = 3.2;
        skillDev = 4;
        workload = 50;
        survey = 65;
      } else if (officer.email === "vikram.m@gov.in") {
        recCount = 0;
        feedback = 3.5;
        skillDev = 2;
        workload = 40; // poor fairness/overload feeling
        survey = 55;
      }

      const engIdx = (recCount * 10) * 0.2 + feedback * 20 * 0.2 + skillDev * 5 * 0.15 + workload * 0.2 + survey * 0.15 + 10 * 0.1;

      await prisma.engagementRecord.create({
        data: {
          userId: officer.id,
          month: monthStr,
          recognitionCount: recCount,
          feedbackScore: feedback,
          skillDevHours: parseFloat(skillDev.toFixed(2)),
          workloadFairnessScore: parseFloat(workload.toFixed(2)),
          surveyScore: parseFloat(survey.toFixed(2)),
          badgesEarned: officer.email === "rajesh.v@gov.in" ? "speed_demon,citizen_hero" : "team_player",
          engagementIndex: parseFloat(Math.min(100, engIdx).toFixed(2))
        }
      });
    }
  }
  console.log("Seeded weekly KPI records and monthly Engagement snapshots.");

  // 8. Benchmark Records
  console.log("Seeding Benchmark records...");
  const peerAvg = 70.0;
  await prisma.benchmarkRecord.create({
    data: {
      entityType: "department",
      entityId: eGovDept.id,
      month: "2026-06",
      avgProductivity: 72.5,
      avgTurnaround: 3.2, // days
      backlogCount: 22,
      rankInPeerGroup: 2,
      peerGroupAvg: 68.0
    }
  });
  await prisma.benchmarkRecord.create({
    data: {
      entityType: "team",
      entityId: prodTeam.id,
      month: "2026-06",
      avgProductivity: 65.2,
      avgTurnaround: 4.8,
      backlogCount: 38,
      rankInPeerGroup: 4,
      peerGroupAvg: 67.5
    }
  });
  console.log("Seeded benchmark records.");

  // 9. AI Recommendations
  console.log("Seeding initial AI recommendations...");
  await prisma.aIRecommendation.create({
    data: {
      type: "delay_risk",
      targetFileId: files[3].id, // a pending file
      message: "File is currently at high risk of SLA breach. Backlog count on officer Priya Sharma is 45% higher than team average.",
      confidenceScore: 0.85,
      status: "pending"
    }
  });

  await prisma.aIRecommendation.create({
    data: {
      type: "burnout",
      targetUserId: vikram.id,
      message: "Scientist C Vikram Malhotra shows high burnout risk (0.78). Attendance has dropped by 12% and pending backlog exceeds 15 files.",
      confidenceScore: 0.92,
      status: "pending"
    }
  });

  await prisma.aIRecommendation.create({
    data: {
      type: "reassignment",
      message: "Optionally balance the policy queue by reallocating 2 low-priority files from Sunita Deshmukh to Vikram Malhotra.",
      confidenceScore: 0.75,
      status: "pending"
    }
  });

  await prisma.aIRecommendation.create({
    data: {
      type: "rework_risk",
      message: "File-1005 shows high rework forwardings (3 transfers). Recommend resolving remarks before next forward.",
      confidenceScore: 0.68,
      status: "pending"
    }
  });

  await prisma.aIRecommendation.create({
    data: {
      type: "delay_risk",
      message: "Department e-Governance Division's average wait time has risen to 4.2 days. Consider reallocation of citizen requests.",
      confidenceScore: 0.72,
      status: "pending"
    }
  });

  console.log("Seeded AI recommendations.");

  // 10. Citizen Service Records
  console.log("Seeding Citizen Service records...");
  const citizenRecordsData = [
    { departmentId: ministry.id, month: "2026-06", citizensServed: 8400, avgWaitDays: 7.2, baselineWaitDays: 12.0 },
    { departmentId: stateIT.id, month: "2026-06", citizensServed: 6200, avgWaitDays: 5.8, baselineWaitDays: 10.0 },
    { departmentId: districtIT.id, month: "2026-06", citizensServed: 4300, avgWaitDays: 4.1, baselineWaitDays: 8.0 },
    { departmentId: eGovDept.id, month: "2026-06", citizensServed: 2850, avgWaitDays: 3.4, baselineWaitDays: 6.0 },
    { departmentId: prodTeam.id, month: "2026-06", citizensServed: 1950, avgWaitDays: 2.1, baselineWaitDays: 5.0 },
  ];

  for (const record of citizenRecordsData) {
    await prisma.citizenServiceRecord.create({
      data: {
        ...record,
        improvementPct: parseFloat(((record.baselineWaitDays - record.avgWaitDays) / record.baselineWaitDays * 100).toFixed(2))
      }
    });
  }
  console.log("Seeded citizen service records.");

  // 11. Sparrow Sync Records
  console.log("Seeding Sparrow Sync records...");
  await prisma.sparrowSyncRecord.create({
    data: {
      userId: rajesh.id,
      month: "2026-06",
      dpi: 90.5,
      achievements: "speed_demon,citizen_hero",
      attendancePct: 96.0,
      engagementIndex: 88.0,
      recommendations: "Excellent speed and SLA compliance maintained.",
      syncStatus: "Pending"
    }
  });
  console.log("Seeded Sparrow sync records.");

  // 12. Tamper-Evident Audit Logs
  console.log("Seeding initial chained audit logs...");
  let prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
  
  const auditEntries = [
    { actorId: ramesh.id, actionType: "goal_created", entityId: natGoal.id, entityType: "Goal", details: `Rajiv Gauba created National Goal: ${natGoal.title}` },
    { actorId: ramesh.id, actionType: "goal_created", entityId: stateGoal1.id, entityType: "Goal", details: `Ramesh Kumar created State Goal: ${stateGoal1.title}` },
    { actorId: rajesh.id, actionType: "digital_signature", entityId: files[0].id, entityType: "File", details: `Rajesh V applied cryptographic sign-off on file ${files[0].subject}` }
  ];

  for (const entry of auditEntries) {
    const timestamp = new Date();
    const detailsString = `${entry.actorId}-${entry.actionType}-${entry.entityId}-${entry.entityType}-${entry.details}-${timestamp.getTime()}`;
    const hashInput = prevHash + detailsString;
    const currentHash = sha256(hashInput);

    await prisma.auditLogEntry.create({
      data: {
        actorId: entry.actorId,
        actionType: entry.actionType,
        entityId: entry.entityId,
        entityType: entry.entityType,
        details: entry.details,
        timestamp,
        previousHash: prevHash,
        currentHash
      }
    });

    prevHash = currentHash; // move to next link in chain
  }
  console.log("Seeded chained audit vault.");

  // 13. Seeding proposed Burnout Shield reassignments
  console.log("Seeding proposed Burnout Shield reassignments...");
  const vikramFiles = await prisma.file.findMany({
    where: { currentHolderId: vikram.id, status: "pending" }
  });
  const vikramFileIds = vikramFiles.map(f => f.id);

  if (vikramFileIds.length > 0) {
    await prisma.burnoutShieldEvent.create({
      data: {
        officerId: vikram.id,
        reassignedToId: rajesh.id,
        filesReassigned: vikramFileIds.slice(0, 3).join(','),
        triggerReason: `Workload balance shield proposal: Officer Vikram Malhotra has a high backlog of ${vikramFileIds.length} pending files (peer average is 3.5). Reassigning 3 files to Rajesh V (spare capacity) is recommended.`,
        status: "proposed"
      }
    });
  }

  console.log("Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
