# Feature Prompts

Each feature has a tag: **[CORE]** (build no matter what), **[HIGH-VALUE]** (build once CORE is stable), **[STRETCH]** (only if time remains). Each prompt is copy-paste-ready for Cursor — return it as-is when the user asks for "the prompt" for a specific feature.

---

## e-Office Core Replication **[CORE]**
*Persona: all — the file-management layer everything else hooks into*

```
Add the e-Office core file-management flow to the e-Office Pro app (schema
already exists from the master setup prompt):

1. File inbox page (per logged-in user): table of files where user is
   currentHolder, columns: subject, category, priority, days pending,
   status. Sortable, filterable by category/priority.

2. File detail page: shows FileMovement history as a vertical timeline
   (from -> to, note, timestamp), a comment/notes thread, and action
   buttons: Forward (select next user), Approve (mock digital signature
   modal: type name to "sign", stores a hash in digitalSignatureHash),
   Reject (with reason).

3. Create file form: subject, category, priority, initial holder.

4. Archive/search page: search completed files by subject/category/date
   range, read-only view of full movement history.

5. Every file action (create, forward, approve, reject) should write an
   AuditLogEntry automatically (actionType appropriately chosen) and
   should update the relevant KPIRecord fields for the involved user
   (pendingCount, completionPct) so the productivity module later reflects
   real actions taken here -- this is the critical link between the
   e-Office core and the productivity module: KPIs must be DERIVED from
   real file actions, not hardcoded.
```

---

## Executive Dashboard **[CORE]**
*Persona: Secretary/Administrator (first screen after their login)*

```
Build the Executive Dashboard as the default landing screen for the
Secretary/Administrator persona after login. Layout: a grid of cards plus
two chart panels.

Cards (top row): Overall DPI (large number + trend arrow), Goal Completion
% (donut chart), Departments At Risk (count + list, red-flagged), Goals On
Track (count, green), Pending Files (count across org), Citizen
Satisfaction Score (number + trend).

Panels:
- "Today's Priorities" list: top 5 urgent items across the org pulled from
  AIRecommendation (type=delay_risk) and Goal records nearing deadline,
  sorted by urgency.
- "AI Recommendations" panel: latest AIRecommendation entries with an
  Accept/Dismiss action (updates status field).
- "AI Alerts" panel: high-confidence AIRecommendation entries (
  confidenceScore > 0.7) shown distinctly (red-tinted) from lower-confidence
  suggestions.
- "Department Ranking" table: departments sorted by their latest
  BenchmarkRecord avgProductivity descending, with rank change arrows
  vs. previous month.
- Notification bell + dropdown (latest 5 Notification records for this
  user, link to full Notification Center).

Pull all numbers from real seeded data via Prisma queries -- no hardcoded
demo numbers in the component code.
```

---

## Goal & KPI Management **[CORE]**
*Persona: Secretary/Administrator (create/edit/archive), Team Leader (view team goals), Officer (view own goals)*

```
Build the Goal & KPI Management screen. Main view: table of all Goal
records visible to the logged-in persona's scope (secretary sees all,
team leader sees their department's, officer sees their own), with
columns: title, level, owner, target, current progress %, deadline,
status.

Buttons/actions:
- "Create Goal": form with title, description, level (national/state/
  department/officer), parentGoalId (dropdown of goals one level up, for
  cascading), ownerType, ownerId, targetMetric, targetValue, deadline,
  successParameter (a plain text description of what "success" means for
  this goal, e.g. "90% of applications cleared within SLA").
- "Edit Goal": same form pre-filled, writes an AuditLogEntry on save
  (actionType: goal_updated).
- "Archive Goal": soft-delete (status = archived), still visible in
  reports/audit but not in active lists.
- "View Analytics": opens a detail panel showing this goal's progress
  over time (line chart), linked tasks and their completion status, and
  -- if this goal has child goals via parentGoalId -- a rollup view
  showing how child-goal progress aggregates into this goal's currentValue.

Also build a KPI Weight Configuration panel (Secretary/Team Leader only):
sliders/inputs for w1-w6 in the productivity formula (see formulas.md),
saved per department, so different departments can genuinely use
different formulas as the original problem statement requires.
```

---

## Hierarchy Explorer **[HIGH-VALUE]**
*Persona: Secretary/Administrator primarily, Team Leader for their subtree*

```
Build a Hierarchy Explorer screen: an interactive tree/breadcrumb view of
Government -> Ministry -> Department -> Division -> District -> Team ->
Officer, built from the Department table's parentDepartmentId chain plus
User.departmentId for the leaf (officer) level.

Clicking any node in the hierarchy shows a side panel with:
- Pending works count (Files where currentHolder is in this subtree and
  status = pending)
- Completed works count
- Goal progress (aggregate of Goal.currentValue/targetValue for goals
  owned at or below this node)
- Risk level (derived: if avg delayPct across this subtree's KPIRecords >
  a threshold, mark High/Medium/Low)
- AI suggestions (any AIRecommendation records targeting users/departments
  in this subtree)

Make the tree collapsible/expandable, and highlight risk level with a
color-coded badge (green/amber/red) at every node, not just leaf nodes,
so the jury can visually scan for problem areas top-down without clicking.
```

---

## Officer Workspace **[CORE]**
*Persona: Officer (their home screen)*

```
Build the Officer Workspace as the default landing screen for the Officer
persona. Sections:

- "Today's Tasks" list: Task records assigned to this user, due soon or
  overdue, with a quick status-update control (dropdown: To-do/In
  Progress/Done) that updates completionPct.
- "Pending Files" list: Files where this user is currentHolder.
- "Deadlines" widget: upcoming Task/Goal deadlines in the next 7 days,
  sorted soonest first.
- "Personal DPI" card: this user's latest productivityScore/dpi from
  KPIRecord, with a trend arrow vs. last period.
- "Performance Trend" chart: line chart of this user's productivityScore
  over the last 8 weeks (from KPIRecord history).
- "Notifications" panel: this user's Notification records.
- "Achievements" panel: badges from EngagementRecord.badgesEarned.

Also add these actions:
- "Update Progress": modal to update a task's completionPct directly from
  this screen.
- "Request Help": creates an AIRecommendation or a simple HelpRequest-style
  Notification sent to this officer's team leader, flagging overload.
- "Submit Feedback": a short form (rating + free text) that writes to
  EngagementRecord.feedbackScore for this month.
- "View Goals": link to Goal & KPI Management filtered to goals owned by
  this officer.
```

---

## AI Decision Center **[HIGH-VALUE — the innovation section, prioritize after CORE is stable]**
*Persona: Team Leader (Burnout Shield, team-level recommendations), Secretary (Digital Twin, org-level recommendations)*

```
Build the AI Decision Center with three sub-panels:

1. DELAY PREDICTION: For every open File and active Goal, compute a delay
   risk score using this rule-based formula (implement server-side, not
   client-side):
     delayRisk = 0.35*(fileAge/slaCategoryDays)
               + 0.20*(currentHolderBacklogCount/departmentAvgBacklog)
               + 0.20*(currentHolderOnLeaveFlag ? 1 : 0)
               + 0.15*(reworkCount/2, capped at 1)
               + 0.10*priorityWeight[category]
   Bands: <0.4 Low, 0.4-0.7 Medium, >0.7 High.
   Show a ranked list of at-risk files/goals with the score AND a
   plain-language reason built from whichever term contributed most
   (e.g. "High backlog on current holder" or "Awaiting return from leave").
   Store qualifying results as AIRecommendation(type=delay_risk).

2. DIGITAL TWIN (simplified simulation, not full ML): Let the Secretary
   persona select a "what-if" scenario from a dropdown (e.g. "Reassign
   officer X's backlog to officer Y and Z"). On submit, compute a simple
   before/after projection: current backlog for the affected officers vs.
   projected backlog if the reassignment happened (redistribute pending
   file counts proportionally to current capacity), and show a
   before/after bar chart. Store as DigitalTwinSimulation. Be explicit in
   the UI copy that this is a projection based on current data, not a
   guarantee.

3. BURNOUT SHIELD: Compute a burnout risk score per officer:
     burnoutRisk = 0.4*(pendingCount/departmentAvgPending)
                 + 0.3*(overdueTaskCount/totalTaskCount)
                 + 0.3*(1 - attendancePct)
   If burnoutRisk > 0.7, auto-generate a BurnoutShieldEvent proposing
   reassignment of some of that officer's files to teammates with lower
   current backlog (status=proposed). Team Leader persona sees these
   proposals in their dashboard with Approve/Reject buttons; Approve
   updates File.currentHolder for the reassigned files, sets
   BurnoutShieldEvent.status=auto_executed, and writes an
   AuditLogEntry(actionType=burnout_shield_activated).

Add an Accept/Dismiss action on every AIRecommendation shown anywhere in
the app -- accepting one should update its status and write an
AuditLogEntry(actionType=ai_recommendation_accepted).
```

---

## Benchmark Center **[HIGH-VALUE]**
*Persona: Secretary/Administrator, Team Leader (their scope only)*

```
Build the Benchmark Center with both a chart view AND a comparison table
(charts alone are not enough).

Use one reusable formula at every level:
  benchmarkIndex = (entityScore / peerGroupAvgScore) * 100
(>100 = above benchmark, <100 = below)

Build tabs for: Officer vs Team Average, Team vs Department Average,
Department vs Ministry Average, District vs State Average, State vs
National Average -- same formula, same UI pattern, different data slice,
so the reused-formula story is visually obvious to the jury.

Each tab: a bar/line chart (recharts) AND a sortable comparison table with
columns: entity name, own score, peer avg, benchmarkIndex, rank. Highlight
top performer and lowest performer rows distinctly.
```

---

## Citizen Impact Dashboard **[HIGH-VALUE]**
*Persona: Secretary/Administrator, framed as citizen-facing in the pitch*

```
Build the Citizen Impact Dashboard using CitizenServiceRecord data:
- Citizens served (count, with month-over-month trend)
- Average waiting time (days) vs baseline waiting time, shown as a
  before/after comparison
- Improvement percentage: ((baselineWaitDays - avgWaitDays) /
  baselineWaitDays) * 100
- "Days reduced" stat: baselineWaitDays - avgWaitDays, shown prominently
  as the single most citizen-relatable number on the whole dashboard
- A trend chart of avgWaitDays over the last 8 weeks per department,
  so improving departments are visually obvious
```

---

## SPARROW Integration Panel **[STRETCH — build only if CORE + HIGH-VALUE are done and stable]**
*Persona: Secretary/Administrator*

Note for the pitch: real SPARROW integration would require formal government API access. Present this screen explicitly as a simulated sync interface / proof-of-concept for what a certified integration would send — never imply live integration.

```
Build a SPARROW Sync panel: table of SparrowSyncRecord entries showing,
per officer per month: DPI, achievements, attendance %, engagement index,
AI recommendations summary, and a "Sync Status" column (Pending/Synced).
Add a "Sync to SPARROW" button that simply flips syncStatus to "Synced"
and sets syncedAt (mock action -- no real external call). Add a small
info banner on this screen: "This is a simulated interface demonstrating
the data structure that would sync to SPARROW under a certified
integration; no live connection to the actual SPARROW system exists."
```

---

## Goal Cascade View (National → State → Department → Officer) **[HIGH-VALUE]**
*Persona: Secretary/Administrator*

```
Build a Goal Cascade view: given a national-level Goal, recursively show
its child goals (via parentGoalId) as a tree/flow diagram: National Goal
-> State Goal(s) -> Department Goal(s) -> Officer Goal(s), each node
showing title, target, currentValue/targetValue %, and status color.
This should visually demonstrate that officer-level work rolls up
mathematically into the national target -- compute the national goal's
currentValue as the aggregate of its descendant goals' currentValues
where applicable, don't just hardcode it.
```

---

## Audit Vault **[CORE — small build, big credibility signal, don't skip]**
*Persona: Secretary/Administrator, Auditor (read-only)*

```
Build the Audit Vault: a read-only, chronological, filterable table of all
AuditLogEntry records (goal created, goal updated, digital signature
applied, AI recommendation accepted, burnout shield activated, survey
submitted), showing actor, action type, entity affected, timestamp, and
details. Filter by action type, date range, and actor.

Optional but recommended for credibility: chain each entry's
currentHash from a hash of (previousHash + entry details) so the log is
tamper-evident -- show a small "Verify Integrity" button that recomputes
the hash chain and confirms nothing has been altered. This is a cheap
build (a simple SHA-256 chain) that reads as a serious compliance feature
to judges.
```

---

## Notification Center **[CORE]**
*Persona: all — each user sees their own*

```
Build a full Notification Center page (beyond the dropdown preview):
full list of Notification records for the logged-in user, filterable by
type (goal delayed, deadline reminder, high-risk file, AI recommendation,
survey pending, performance improvement/recognition), with read/unread
state and a "mark all read" action. Auto-generate notifications from:
goals crossing risk thresholds, tasks nearing/crossing deadlines, new
AIRecommendation records targeting this user, pending survey requests,
and positive recognition events from EngagementRecord updates.
```

---

## Reports Section **[HIGH-VALUE]**
*Persona: Secretary/Administrator, Team Leader (their scope)*

```
Build a Reports section with four tabs: Weekly, Monthly, Quarterly,
Yearly. Each tab generates a Report record: aggregates KPIRecord,
EngagementRecord, BenchmarkRecord, and CitizenServiceRecord data for the
selected period and scope (org-wide or a chosen department), stores a
JSON snapshot, and renders it as a clean printable summary page
(productivity trend, top/bottom performers, goals completed vs missed,
citizen impact summary). Add a "Download" button that exports the
current report view (simple print-to-PDF via browser is acceptable for
the demo).
```

---

## Review/Comments System **[CORE]**
*Persona: Team Leader and Secretary (author), Officer (recipient, sees on their own file/task/workspace)*

```
Build a Review/Comments feature usable from a File detail page, a Task,
or an Officer's profile: any user with a supervisory role over the
target can add a ReviewComment (targetType: file/task/officer,
comment text, visibility: officer-only or officer-and-chain-of-command).
Comments appear as a threaded list on the relevant File detail page and
on the officer's own workspace under a "Reviews & Feedback" section, so
an officer whose work is incomplete sees the supervisor's note directly
where they'll act on it next.
```