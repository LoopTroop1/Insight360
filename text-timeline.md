# Team Assignment, Timeline & Jury Narrative

## Reality check on scope

The full spec (all CORE + HIGH-VALUE + STRETCH features in `features.md`) is realistically 3-4 days of good work for 6 people, not 24 hours. CORE features alone are a complete, demoable product and a realistic 24-hour target. Always give the user this honest framing when they ask about timing — the [CORE]/[HIGH-VALUE]/[STRETCH] tags exist so the team can decide what to cut live if the clock runs short, rather than discovering the gap at hour 20.

## Team assignment (6 people: 3 technical, 3 support)

| Person | Primary CORE responsibility | Then move to (if time allows) |
|---|---|---|
| **T1** | e-Office core + Officer Workspace | Review/Comments system |
| **T2** | Master schema, seed data, productivity/engagement/benchmark formulas (server-side) | AI Decision Center logic (delay risk, burnout risk) |
| **T3** | Executive Dashboard + Goal & KPI Management UI | Hierarchy Explorer, Benchmark Center, Citizen Impact Dashboard |
| **N1** | Seed data realism (varied performance profiles across the full hierarchy) | Goal Cascade sample data (national -> officer chain) |
| **N2** | Real-world stats for pitch + problem framing | Demo screenshots as features complete |
| **N3** | Deck + demo script + Q&A prep | SPARROW/e-Samiksha framing slide, Audit Vault credibility talking points |

## Suggested build order across the team

1. Master Setup Prompt (schema + shell + seed) — everyone waits on this, T2 owns it, target: hour 0-3
2. e-Office core (T1) + Goal/KPI Management (T3) in parallel — hours 3-9
3. Officer Workspace (T1) + Executive Dashboard (T3) + productivity formulas wired in (T2) — hours 9-14
4. Notification Center + Audit Vault + Review/Comments (whoever is free first) — hours 14-17
5. AI Decision Center + Benchmark Center + Hierarchy Explorer — hours 17-21 (cut scope here first if behind schedule)
6. Citizen Impact + Goal Cascade + SPARROW (stretch) — only if ahead of schedule
7. Full dry-run, polish, Q&A rehearsal — final hours, non-negotiable, do not skip this for one more feature

## Jury narrative anchor — map every screen back to the problem statement

Problem statement: "Government offices often suffer from low levels of productivity at the organizational, team and individual levels, but there are no online tools to set goals/objectives, define and benchmark success parameters, track progress and calculate productivity levels at the aforesaid 3 levels."

- "set goals/objectives" → Goal & KPI Management + Goal Cascade
- "define and benchmark success parameters" → Goal.successParameter + Benchmark Center
- "track progress" → Officer Workspace, Hierarchy Explorer, real-time dashboards
- "calculate productivity levels at organizational, team and individual levels" → productivityScore formula applied at all three levels, visible in Executive Dashboard / Team views / Officer Workspace respectively
- "improve productivity and employee engagement" → engagementIndex, Burnout Shield, recognition/badges, Citizen Impact showing outcomes

## Jury Q&A prep

- **"Why replicate e-Office at all — why not just show the module?"** → Because the module needs to be shown *inside* the real workflow (file movement generating KPI data) to prove it's not a standalone dashboard guessing at numbers — it's derived from actual file actions.
- **"How would this really integrate with the live e-Office system?"** → Position the demo as a proof-of-concept for a certified module that would be built through NIC's own development process, not a public API — be upfront that no live integration exists in the demo.
- **"Why is your productivity formula valid?"** → Show the configurable weights screen — the team isn't claiming one formula fits all, it provides a framework departments can tune.
- **"How do you stop metric gaming?"** → Quality score and delay penalty are weighted into the same formula as completion rate, so padding low-value tasks doesn't meaningfully inflate the score.
- **"Isn't the AI Decision Center just guessing?"** → Walk through the transparent weighted formulas (delayRisk, burnoutRisk) and the explainability reason shown alongside every score — nothing is a black box.
- **"What about the SPARROW/e-Samiksha panels — are those real integrations?"** → No; explicitly framed and labeled in-app as simulated proof-of-concept interfaces for what a certified integration would send.ss