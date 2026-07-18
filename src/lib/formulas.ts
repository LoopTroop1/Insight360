// e-Office Pro Mathematical formulas configuration and computation engine

export interface DepartmentWeights {
  w1: number; // Completion Rate
  w2: number; // Timeliness Score
  w3: number; // Quality Score
  w4: number; // Attendance Score
  w5: number; // Collaboration Score
  w6: number; // Delay Penalty
}

export const DEFAULT_WEIGHTS: DepartmentWeights = {
  w1: 0.30,
  w2: 0.20,
  w3: 0.15,
  w4: 0.15,
  w5: 0.10,
  w6: 0.20
};

/**
 * Computes individual or team productivity score
 */
export function calculateProductivityScore(
  inputs: {
    completionRate: number; // 0 to 1
    timelinessScore: number; // 0 to 1
    qualityScore: number; // 0 to 1
    attendanceScore: number; // 0 to 1
    collaborationScore: number; // 0 to 1
    delayPenalty: number; // 0 to 1
  },
  weights: DepartmentWeights = DEFAULT_WEIGHTS
): number {
  const score = 
    (weights.w1 * inputs.completionRate) +
    (weights.w2 * inputs.timelinessScore) +
    (weights.w3 * inputs.qualityScore) +
    (weights.w4 * inputs.attendanceScore) +
    (weights.w5 * inputs.collaborationScore) -
    (weights.w6 * inputs.delayPenalty);
    
  // Normalize and cap between 0 and 100
  const normalized = score * 100;
  return Math.min(100, Math.max(0, parseFloat(normalized.toFixed(2))));
}

/**
 * Computes engagement index from monthly engagement scores
 */
export function calculateEngagementIndex(inputs: {
  recognitionCount: number;
  feedbackScore: number; // 1 to 5
  skillDevHours: number;
  workloadFairnessScore: number; // 0 to 100
  surveyScore: number; // 0 to 100
  badgesCount: number;
}): number {
  // Normalize terms to a 0-100 scale
  const recognitionScore = Math.min(100, inputs.recognitionCount * 20); // 5 recognitions = 100
  const feedbackScore = inputs.feedbackScore * 20; // 5 stars = 100
  const skillDevScore = Math.min(100, inputs.skillDevHours * 6.25); // 16 hours = 100
  const workloadScore = inputs.workloadFairnessScore;
  const surveyScore = inputs.surveyScore;
  const badgesScore = Math.min(100, inputs.badgesCount * 25); // 4 badges = 100

  const index =
    (recognitionScore * 0.2) +
    (feedbackScore * 0.2) +
    (skillDevScore * 0.15) +
    (workloadScore * 0.2) +
    (surveyScore * 0.15) +
    (badgesScore * 0.1);

  return parseFloat(Math.min(100, Math.max(0, index)).toFixed(2));
}

/**
 * Computes benchmark index relative to peer group average
 */
export function calculateBenchmarkIndex(entityScore: number, peerGroupAvgScore: number): number {
  if (peerGroupAvgScore === 0) return 100;
  return parseFloat(((entityScore / peerGroupAvgScore) * 100).toFixed(2));
}

export interface RiskResult {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
}

/**
 * Computes delay risk of a file
 */
export function calculateDelayRisk(inputs: {
  fileAgeDays: number;
  slaCategoryDays: number;
  holderBacklog: number;
  deptAvgBacklog: number;
  onLeave: boolean;
  reworkCount: number;
  category: string;
}): RiskResult {
  const fileAgeTerm = 0.35 * (inputs.fileAgeDays / (inputs.slaCategoryDays || 1));
  const backlogTerm = 0.20 * (inputs.holderBacklog / (inputs.deptAvgBacklog || 1));
  const leaveTerm = 0.20 * (inputs.onLeave ? 1 : 0);
  const reworkTerm = 0.15 * Math.min(1, inputs.reworkCount / 2);
  
  // Category weights
  const categoryWeights: Record<string, number> = {
    'Budget Allocation': 0.90,
    'Security Audit': 0.80,
    'e-Governance': 0.70,
    'Policy Draft': 0.60,
  };
  const categoryWeight = categoryWeights[inputs.category] || 0.50;
  const categoryTerm = 0.10 * categoryWeight;

  const score = fileAgeTerm + backlogTerm + leaveTerm + reworkTerm + categoryTerm;
  const roundedScore = parseFloat(Math.min(1.0, Math.max(0.0, score)).toFixed(2));

  let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (roundedScore >= 0.7) level = 'HIGH';
  else if (roundedScore >= 0.4) level = 'MEDIUM';

  // Explainability - build a rich, data-driven explainability sentence
  const reasons: string[] = [];
  if (inputs.fileAgeDays > inputs.slaCategoryDays) {
    reasons.push(`Overdue by ${inputs.fileAgeDays - inputs.slaCategoryDays} days (Age: ${inputs.fileAgeDays}d vs SLA: ${inputs.slaCategoryDays}d)`);
  } else if (inputs.fileAgeDays > 0) {
    reasons.push(`Pending for ${inputs.fileAgeDays} days`);
  }

  if (inputs.holderBacklog > 5) {
    reasons.push(`high backlog (${inputs.holderBacklog} files)`);
  } else if (inputs.holderBacklog > inputs.deptAvgBacklog) {
    reasons.push(`above-average queue (${inputs.holderBacklog} files)`);
  }

  if (inputs.reworkCount > 0) {
    reasons.push(`rework detected (${inputs.reworkCount} forwards)`);
  }

  if (inputs.onLeave) {
    reasons.push(`holder on leave`);
  }

  if (reasons.length === 0) {
    reasons.push(`High priority ${inputs.category} category file`);
  }

  const reason = reasons.join('; ').replace(/^\w/, (c) => c.toUpperCase()) + '.';

  return {
    score: roundedScore,
    level,
    reason
  };
}

/**
 * Computes burnout risk of an officer
 */
export function calculateBurnoutRisk(inputs: {
  pendingCount: number;
  deptAvgPending: number;
  overdueTaskCount: number;
  totalTaskCount: number;
  attendancePct: number; // 0 to 100
}): RiskResult {
  const pendingTerm = 0.4 * (inputs.pendingCount / (inputs.deptAvgPending || 1));
  const overdueTerm = 0.3 * (inputs.totalTaskCount === 0 ? 0 : inputs.overdueTaskCount / inputs.totalTaskCount);
  const attendanceTerm = 0.3 * (1 - (inputs.attendancePct / 100));

  const score = pendingTerm + overdueTerm + attendanceTerm;
  const roundedScore = parseFloat(Math.min(1.0, Math.max(0.0, score)).toFixed(2));

  let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (roundedScore >= 0.7) level = 'HIGH';
  else if (roundedScore >= 0.4) level = 'MEDIUM';

  const reasons: string[] = [];
  if (inputs.pendingCount > inputs.deptAvgPending) {
    reasons.push(`Backlog exceeds average (${inputs.pendingCount} vs ${inputs.deptAvgPending.toFixed(1)} files)`);
  }
  if (inputs.overdueTaskCount > 0) {
    reasons.push(`${inputs.overdueTaskCount} overdue tasks`);
  }
  if (inputs.attendancePct < 85) {
    reasons.push(`Attendance dropped to ${inputs.attendancePct}%`);
  }

  if (reasons.length === 0) {
    reasons.push(`Workload is within healthy baseline limits`);
  }

  const reason = reasons.join('; ').replace(/^\w/, (c) => c.toUpperCase()) + '.';

  return {
    score: roundedScore,
    level,
    reason
  };
}
