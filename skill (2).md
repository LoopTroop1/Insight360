---
name: eoffice-pro-webapp-builder
description: Build the "e-Office Pro" hackathon web app — a replicated Government of India e-Office file-management demo with an integrated productivity/goal/KPI/AI module (Smart India Hackathon project). Use this skill whenever the user asks to build, scaffold, extend, or debug this specific project — including its Prisma schema, any individual feature (Executive Dashboard, Goal & KPI Management, Hierarchy Explorer, Officer Workspace, AI Decision Center, Benchmark Center, Citizen Impact Dashboard, SPARROW panel, Goal Cascade, Audit Vault, Notification Center, Reports, Review/Comments), the seed data, the productivity/engagement/benchmark/delay/burnout formulas, or the team/timeline plan. Trigger this even if the user only names one feature (e.g. "build the burnout shield" or "add the goal cascade view") — always check this skill's references for full context before writing code for this project.
---

# e-Office Pro — Hackathon Web App Builder

This skill contains the complete specification for a single project: **e-Office Pro**, a Smart India Hackathon demo combining a replicated e-Office (Government of India file-management system) with a native productivity/goal/KPI/engagement/AI module. Use this skill for ANY work on this project — first build, adding a feature, fixing a bug, or regenerating a prompt for Cursor or another tool.

## Project one-liner

A single Next.js + Prisma + SQLite web app, organized around three personas (Officer, Team Leader, Secretary/Administrator), where every productivity metric is derived from real file/task actions taken inside the app's own e-Office file-management core — not hardcoded demo numbers.

## Tech stack (fixed — don't deviate without the user asking)

Next.js 14 (App Router) + TypeScript + Tailwind CSS, Prisma ORM + SQLite, recharts for charts, NextAuth or a simple mock session for role-based login. Government-portal visual style: blue/grey palette, formal data tables, consistent shell across every screen.

## Build order (always respect this dependency chain)

1. **Master schema + seed + shell first, always.** Every feature below assumes the Prisma schema, persona-based nav shell, and seed data already exist. If they don't exist yet in the user's project, build them before anything else — see `references/schema.md`.
2. **e-Office core** (login, file inbox, file movement, approval, archive) — this is what every KPI/productivity number is derived from.
3. **Officer Workspace + Executive Dashboard + Goal & KPI Management** — the CORE productivity screens.
4. **Notification Center, Audit Vault, Review/Comments** — small builds, high credibility value, don't skip.
5. **AI Decision Center, Benchmark Center, Hierarchy Explorer** — HIGH-VALUE differentiators, build once CORE is stable.
6. **Citizen Impact Dashboard, Goal Cascade** — HIGH-VALUE, build if time allows.
7. **SPARROW Integration panel** — STRETCH only; explicitly a simulated/mock sync interface, never implied as a live integration.

Full per-feature build tags ([CORE]/[HIGH-VALUE]/[STRETCH]) and rationale are in `references/features.md`.

## Personas (organize all navigation and permissions around these three)

| Persona | Maps to roles | Home screen |
|---|---|---|
| Officer View | Government Employee | Officer Workspace |
| Team Leader View | Section Officer, Department Head | Team dashboard (KPIs, workload, Burnout Shield approvals) |
| Secretary/Administrator View | Secretary, Ministry Administration (+ read-only: Auditor, HR, Admin Reform Dept) | Executive Dashboard |

## Where to find things

- **`references/schema.md`** — the full Prisma data model (every entity: User, Department, File, Goal, Task, KPIRecord, EngagementRecord, BenchmarkRecord, AIRecommendation, DigitalTwinSimulation, BurnoutShieldEvent, CitizenServiceRecord, SparrowSyncRecord, AuditLogEntry, Notification, ReviewComment, Report) plus the Master Setup Prompt to run first in Cursor. Read this before touching the database or writing any model-dependent code.
- **`references/features.md`** — every individual feature with its own standalone build prompt (Executive Dashboard, Goal & KPI Management, Hierarchy Explorer, Officer Workspace, AI Decision Center, Benchmark Center, Citizen Impact Dashboard, SPARROW panel, Goal Cascade, Audit Vault, Notification Center, Reports, Review/Comments, e-Office core). Read the relevant section before building or modifying that feature. Each prompt is copy-paste-ready for Cursor.
- **`references/formulas.md`** — every scoring formula used across the app: productivityScore, dpi, engagementIndex, benchmarkIndex, delayRisk, burnoutRisk — with default weights and the rule that department-level weight configuration must stay user-adjustable, not hardcoded. Always compute these server-side; never hardcode a KPI number in a UI component.
- **`references/team-timeline.md`** — the 6-person team-to-feature assignment, the hour-by-hour build map, and the jury-facing narrative that ties every screen back to the original problem statement language ("set goals/objectives", "define and benchmark success parameters", "track progress", "calculate productivity levels", "improve engagement"). Use this when the user asks about task splitting, scheduling, or how to pitch/defend a feature to judges.

## Non-negotiable design principles for this project

- **KPIs must be derived from real actions**, not hardcoded. Every file movement, approval, or task update should feed the KPIRecord calculation.
- **One shell, one login, one design system.** The productivity module is NOT a separate tool or extension bolted onto e-Office — it must look and feel like native e-Office screens.
- **Explainable over black-box.** All "AI" features (delay prediction, burnout risk) use transparent weighted formulas with human-readable reasons, not opaque ML — this is both faster to build and easier to defend to judges.
- **Be explicit about what's simulated.** The SPARROW panel and Digital Twin projections must carry in-UI copy stating they are simulated/proof-of-concept, never implying a live external integration that doesn't exist.
- **Seed data must tell a story.** Always seed with a deliberate performance spread (some officers/departments clearly strong, some struggling, some trending up/down) so dashboards look realistic and compelling on first load, not flat/uniform.

## When the user asks for "the prompt" for a specific feature

Go straight to `references/features.md`, find that feature's section, and return its prompt block as-is (it's already written to be pasted directly into Cursor). Don't paraphrase or shorten it unless the user asks you to.

## When the user asks about scope/timing

Be honest: the full spec is realistically 3-4 days of good work, not 24 hours. Use the [CORE]/[HIGH-VALUE]/[STRETCH] tags in `references/features.md` to help the user or their team decide what to cut if time is short — CORE features alone form a complete, demoable product.