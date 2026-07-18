# Formula Reference

Implement all of these **server-side** (in API routes / Prisma query layer), never hardcoded inside a UI component. Every dashboard and screen should read computed values, not recompute or fake them client-side.

```
productivityScore =
    (w1 * completionRate) + (w2 * timelinessScore) + (w3 * qualityScore) +
    (w4 * attendanceScore) + (w5 * collaborationScore) - (w6 * delayPenalty)
Default weights: w1=0.30, w2=0.20, w3=0.15, w4=0.15, w5=0.10, w6=0.20
(w1-w6 must be configurable per department via the KPI Weight Configuration
panel in Goal & KPI Management — different departments genuinely need
different formulas per the original problem statement)

dpi (Departmental/Individual Productivity Index) = productivityScore
normalized to a 0-100 scale for display consistency across dashboards

engagementIndex =
    (recognitionScore*0.2) + (feedbackScore*0.2) + (skillDevScore*0.15) +
    (workloadFairnessScore*0.2) + (surveyScore*0.15) + (badgesScore*0.1)

benchmarkIndex = (entityScore / peerGroupAvgScore) * 100
(applied identically at every level: officer vs team, team vs department,
department vs ministry, district vs state, state vs national)

delayRisk = 0.35*(fileAge/slaCategoryDays)
          + 0.20*(holderBacklog/deptAvgBacklog)
          + 0.20*(onLeaveFlag ? 1 : 0)
          + 0.15*(reworkCount/2, capped at 1)
          + 0.10*priorityWeight[category]
Bands: <0.4 Low, 0.4-0.7 Medium, >0.7 High

burnoutRisk = 0.4*(pendingCount/deptAvgPending)
            + 0.3*(overdueTaskCount/totalTaskCount)
            + 0.3*(1 - attendancePct)
Threshold: >0.7 triggers an auto-generated BurnoutShieldEvent proposal
```

## Component-derivation notes (how to compute the inputs above)

- `completionRate` = tasks completed / tasks assigned, in the KPI period
- `timelinessScore` = 1 - (avg days late / avg SLA days), floored at 0
- `qualityScore` = derived from citizen rating and/or notes returned for
  correction (inverse relationship — more corrections lowers this score)
- `attendanceScore` = present days / working days
- `collaborationScore` = cross-team task participation + peer feedback signal
- `delayPenalty` = overdue tasks weighted by how overdue they are (not a
  flat count — a task 10 days late should weigh more than one 1 day late)

## Explainability rule (applies to delayRisk and burnoutRisk everywhere)

Whenever a risk score is shown to a user, also show a plain-language reason
built from whichever term in the formula contributed most to the score
(e.g. "High backlog on current holder" or "Awaiting return from leave").
Never show a bare number without a reason — this is what makes the AI
Decision Center defensible to judges instead of looking like a black box.