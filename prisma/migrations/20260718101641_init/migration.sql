-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "personaType" TEXT NOT NULL,
    "departmentId" INTEGER,
    "designation" TEXT NOT NULL,
    "joinedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatarUrl" TEXT,
    CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Department" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "parentDepartmentId" INTEGER,
    "ministryId" INTEGER,
    CONSTRAINT "Department_parentDepartmentId_fkey" FOREIGN KEY ("parentDepartmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "File" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "currentHolderId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slaCategoryDays" INTEGER NOT NULL,
    CONSTRAINT "File_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "File_currentHolderId_fkey" FOREIGN KEY ("currentHolderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FileMovement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fileId" INTEGER NOT NULL,
    "fromUserId" INTEGER NOT NULL,
    "toUserId" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "digitalSignatureHash" TEXT,
    CONSTRAINT "FileMovement_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FileMovement_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FileMovement_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT NOT NULL,
    "parentGoalId" INTEGER,
    "ownerType" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "targetMetric" TEXT NOT NULL,
    "targetValue" REAL NOT NULL,
    "currentValue" REAL NOT NULL DEFAULT 0,
    "deadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "successParameter" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "goalId" INTEGER NOT NULL,
    "assignedToId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "deadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "completionPct" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KPIRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "completionPct" REAL NOT NULL,
    "delayPct" REAL NOT NULL,
    "avgResolutionTime" REAL NOT NULL,
    "pendingCount" INTEGER NOT NULL,
    "attendancePct" REAL NOT NULL,
    "citizenRating" REAL NOT NULL,
    "collaborationScore" REAL NOT NULL,
    "qualityScore" REAL NOT NULL,
    "productivityScore" REAL NOT NULL,
    "dpi" REAL NOT NULL,
    CONSTRAINT "KPIRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EngagementRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "recognitionCount" INTEGER NOT NULL DEFAULT 0,
    "feedbackScore" REAL NOT NULL DEFAULT 0,
    "skillDevHours" REAL NOT NULL DEFAULT 0,
    "workloadFairnessScore" REAL NOT NULL DEFAULT 0,
    "surveyScore" REAL NOT NULL DEFAULT 0,
    "badgesEarned" TEXT NOT NULL,
    "engagementIndex" REAL NOT NULL,
    CONSTRAINT "EngagementRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BenchmarkRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "avgProductivity" REAL NOT NULL,
    "avgTurnaround" REAL NOT NULL,
    "backlogCount" INTEGER NOT NULL,
    "rankInPeerGroup" INTEGER NOT NULL,
    "peerGroupAvg" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "AIRecommendation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "targetUserId" INTEGER,
    "targetFileId" INTEGER,
    "targetGoalId" INTEGER,
    "message" TEXT NOT NULL,
    "confidenceScore" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIRecommendation_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AIRecommendation_targetFileId_fkey" FOREIGN KEY ("targetFileId") REFERENCES "File" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AIRecommendation_targetGoalId_fkey" FOREIGN KEY ("targetGoalId") REFERENCES "Goal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DigitalTwinSimulation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestedById" INTEGER NOT NULL,
    "scenarioDescription" TEXT NOT NULL,
    "beforeBacklog" TEXT NOT NULL,
    "afterBacklogProjection" TEXT NOT NULL,
    "affectedUserIds" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DigitalTwinSimulation_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BurnoutShieldEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "officerId" INTEGER NOT NULL,
    "triggerReason" TEXT NOT NULL,
    "filesReassigned" TEXT NOT NULL,
    "reassignedToId" INTEGER,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BurnoutShieldEvent_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BurnoutShieldEvent_reassignedToId_fkey" FOREIGN KEY ("reassignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CitizenServiceRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "departmentId" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "citizensServed" INTEGER NOT NULL,
    "avgWaitDays" REAL NOT NULL,
    "baselineWaitDays" REAL NOT NULL,
    "improvementPct" REAL NOT NULL,
    CONSTRAINT "CitizenServiceRecord_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SparrowSyncRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "dpi" REAL NOT NULL,
    "achievements" TEXT NOT NULL,
    "attendancePct" REAL NOT NULL,
    "engagementIndex" REAL NOT NULL,
    "recommendations" TEXT NOT NULL,
    "syncStatus" TEXT NOT NULL,
    "syncedAt" DATETIME,
    CONSTRAINT "SparrowSyncRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLogEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "actorId" INTEGER,
    "actionType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousHash" TEXT NOT NULL,
    "currentHash" TEXT NOT NULL,
    CONSTRAINT "AuditLogEntry_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "authorId" INTEGER NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "departmentId" INTEGER,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataSnapshotJson" TEXT NOT NULL,
    CONSTRAINT "Report_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DepartmentWeight" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "departmentId" INTEGER NOT NULL,
    "w1" REAL NOT NULL DEFAULT 0.30,
    "w2" REAL NOT NULL DEFAULT 0.20,
    "w3" REAL NOT NULL DEFAULT 0.15,
    "w4" REAL NOT NULL DEFAULT 0.15,
    "w5" REAL NOT NULL DEFAULT 0.10,
    "w6" REAL NOT NULL DEFAULT 0.20
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentWeight_departmentId_key" ON "DepartmentWeight"("departmentId");
