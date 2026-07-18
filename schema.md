# Data Model & Master Setup Prompt

Read this before touching the database or writing any model-dependent code. Every feature in `features.md` assumes this schema and shell already exist.

## Full Prisma Schema

```
User(id, name, email, role, personaType[officer/teamlead/secretary/auditor/hr/reform],
     departmentId, designation, joinedDate, avatarUrl)

Department(id, name, level[national/state/department/division/district/team],
           parentDepartmentId, ministryId)

File(id, subject, category, priority, createdBy, currentHolder, status,
     createdAt, slaCategoryDays)

FileMovement(id, fileId, fromUser, toUser, note, timestamp, digitalSignatureHash)

Goal(id, title, description, level[national/state/department/officer],
     parentGoalId, ownerType[individual/team/department], ownerId,
     targetMetric, targetValue, currentValue, deadline, status,
     successParameter, createdBy, createdAt)

Task(id, goalId, assignedTo, description, deadline, status, completionPct,
     createdAt)

KPIRecord(id, userId, date, completionPct, delayPct, avgResolutionTime,
          pendingCount, attendancePct, citizenRating, collaborationScore,
          qualityScore, productivityScore, dpi)

EngagementRecord(id, userId, month, recognitionCount, feedbackScore,
                 skillDevHours, workloadFairnessScore, surveyScore,
                 badgesEarned, engagementIndex)

BenchmarkRecord(id, entityType[officer/team/department/district/state],
                entityId, month, avgProductivity, avgTurnaround,
                backlogCount, rankInPeerGroup, peerGroupAvg)

AIRecommendation(id, type[delay_risk/burnout/rework_risk/reassignment],
                 targetUserId, targetFileId, targetGoalId, message,
                 confidenceScore, status[pending/accepted/dismissed],
                 createdAt)

DigitalTwinSimulation(id, requestedBy, scenarioDescription, beforeBacklog,
                      afterBacklogProjection, affectedUserIds, createdAt)

BurnoutShieldEvent(id, officerId, triggerReason, filesReassigned,
                   reassignedTo, status[proposed/auto_executed/reverted],
                   createdAt)

CitizenServiceRecord(id, departmentId, month, citizensServed,
                     avgWaitDays, baselineWaitDays, improvementPct)

SparrowSyncRecord(id, userId, month, dpi, achievements, attendancePct,
                  engagementIndex, recommendations, syncStatus, syncedAt)

AuditLogEntry(id, actorId, actionType[goal_created/goal_updated/
             digital_signature/ai_recommendation_accepted/
             burnout_shield_activated/survey_submitted], entityId,
             entityType, details, timestamp, previousHash, currentHash)

Notification(id, userId, type[goal_delayed/deadline/high_risk_file/
            ai_recommendation/survey_pending/performance_improvement],
            message, read, createdAt)

ReviewComment(id, authorId, targetType[file/task/officer], targetId,
              comment, visibility[officer/officer_and_chain], createdAt)

Report(id, type[weekly/monthly/quarterly/yearly], departmentId,
       generatedAt, dataSnapshotJson)
```

## Master Setup Prompt (run this first in Cursor, always, before any feature prompt)

```
Build a full-stack demo web application called "e-Office Pro" for Smart India
Hackathon. Tech stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS,
Prisma ORM with SQLite (fast local demo, no external DB setup), recharts for
data visualization, NextAuth (or a simple mock session) for role-based login.

Visual style: formal government-portal aesthetic — blue/grey palette (e.g.
#1a3c6e primary, #f5f7fa background), clear data tables, minimal decoration,
consistent header/sidebar shell across every screen so the whole app feels
like ONE cohesive product (not separate tools stitched together).

Implement the full Prisma schema above exactly as specified (this is the
single source of truth every feature builds on).

Build a persona-based navigation shell with three views:
- Officer View (role: employee)
- Team Leader View (role: section_officer or department_head)
- Secretary/Administrator View (role: secretary or ministry_admin), with
  read-only variants for auditor, hr, and admin_reform_dept roles

Login page: role selector, mock 2FA checkbox, redirect to the correct
persona's home screen after login.

Seed script: create 3 departments across a mock hierarchy (Ministry ->
State -> District -> Department -> Team), ~20 users spread across all
roles/personas, ~50 files at various pending/approved stages, ~15 goals
(mix of national/state/department/officer level, cascading via
parentGoalId), ~80 tasks, 8 weeks of historical KPIRecord and
EngagementRecord data per user with a DELIBERATE performance spread
(some users/departments clearly high-performing, some clearly struggling,
some with rising trends, some declining) so every dashboard and chart
looks realistic and tells a story on first load.

Build this shell and schema completely and correctly before any other
feature is added — every other prompt assumes this shell and schema
already exist.
```