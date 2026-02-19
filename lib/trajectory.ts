import { LogEntry } from './types';
import { ProcessTrajectory, TrajectoryStatus } from './types';

export function analyzeProcess(logs: LogEntry[]): ProcessTrajectory {
  const now = new Date();
  const sortedLogs = [...logs].sort((a, b) => 
    b.logged_at.getTime() - a.logged_at.getTime()
  );
  
  // Need at least 2 logs to derive anything meaningful
  if (sortedLogs.length < 2) {
    return createDormantTrajectory(sortedLogs[0]?.logged_at);
  }
  
  const frequency = calculateFrequency(sortedLogs, now);
  const consistency = calculateConsistency(sortedLogs);
  const recency = calculateRecency(sortedLogs, consistency.avgGapDays, now);
  const patterns = detectPatterns(sortedLogs);
  const projection = projectForward(frequency, consistency);
  const status = deriveStatus(frequency, recency, consistency);
  const insight = generateInsight(status, frequency, patterns, projection);
  
  return {
    status,
    frequency,
    consistency,
    recency,
    patterns,
    projection,
    insight,
  };
}

// --- Frequency ---
function calculateFrequency(
  logs: LogEntry[], 
  now: Date
): ProcessTrajectory['frequency'] {
  // Look at last 14 days for current frequency
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const recentLogs = logs.filter(l => l.logged_at >= fourteenDaysAgo);
  const perWeek = (recentLogs.length / 14) * 7;
  
  // Compare to previous 14 days for trend
  const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const previousLogs = logs.filter(l => 
    l.logged_at >= twentyEightDaysAgo && l.logged_at < fourteenDaysAgo
  );
  const previousPerWeek = (previousLogs.length / 14) * 7;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (perWeek > previousPerWeek * 1.2) trend = 'up';
  else if (perWeek < previousPerWeek * 0.8) trend = 'down';
  
  return {
    perWeek: Math.round(perWeek * 10) / 10,
    perMonth: Math.round(perWeek * 4.33),
    trend,
  };
}

// --- Consistency ---
function calculateConsistency(
  logs: LogEntry[]
): ProcessTrajectory['consistency'] {
  if (logs.length < 2) {
    return { score: 0, avgGapDays: 0, gapVariance: 0 };
  }
  
  // Calculate gaps between consecutive logs
  const gaps: number[] = [];
  for (let i = 0; i < logs.length - 1; i++) {
    const gap = (logs[i].logged_at.getTime() - logs[i + 1].logged_at.getTime()) 
      / (1000 * 60 * 60 * 24);
    gaps.push(gap);
  }
  
  const avgGapDays = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  
  // Need at least 3 logs (2 gaps) for meaningful consistency
  // With only 1 gap, variance is always 0 (misleading 100%)
  if (gaps.length < 2) {
    return {
      score: 0, // Not enough data
      avgGapDays: Math.round(avgGapDays * 10) / 10,
      gapVariance: 0,
    };
  }
  
  // Variance: how much do gaps deviate from average?
  const variance = gaps.reduce((sum, gap) => 
    sum + Math.pow(gap - avgGapDays, 2), 0
  ) / gaps.length;
  const stdDev = Math.sqrt(variance);
  
  // Consistency score: lower variance relative to avg = higher score
  // A coefficient of variation (stdDev/mean) near 0 = very consistent
  const cv = avgGapDays > 0 ? stdDev / avgGapDays : 0;
  const score = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
  
  return {
    score,
    avgGapDays: Math.round(avgGapDays * 10) / 10,
    gapVariance: Math.round(variance * 10) / 10,
  };
}

// --- Recency ---
function calculateRecency(
  logs: LogEntry[], 
  avgGapDays: number,
  now: Date
): ProcessTrajectory['recency'] {
  const lastLog = logs[0]?.logged_at;
  if (!lastLog) {
    return { daysSinceLast: Infinity, isOverdue: true };
  }
  
  const daysSinceLast = Math.floor(
    (now.getTime() - lastLog.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // "Overdue" if it's been longer than 1.5x their average gap
  const isOverdue = daysSinceLast > avgGapDays * 1.5;
  
  return { daysSinceLast, isOverdue };
}

// --- Day-of-week Patterns ---
function detectPatterns(logs: LogEntry[]): ProcessTrajectory['patterns'] {
  const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  for (const log of logs) {
    dayCounts[log.logged_at.getDay()]++;
  }
  
  const total = logs.length;
  const weekendCount = dayCounts[0] + dayCounts[6];
  const weekdayCount = total - weekendCount;
  
  // Weekend bias: positive means weekend-heavy
  // Expected weekend ratio is 2/7 ≈ 0.286
  const weekendRatio = total > 0 ? weekendCount / total : 0;
  const weekendBias = Math.round((weekendRatio - 0.286) / 0.286 * 100) / 100;
  
  // Find strongest day (if any day is >1.5x expected)
  const expectedPerDay = total / 7;
  let strongestDay: string | null = null;
  let maxCount = 0;
  
  for (let i = 0; i < 7; i++) {
    if (dayCounts[i] > expectedPerDay * 1.5 && dayCounts[i] > maxCount) {
      maxCount = dayCounts[i];
      strongestDay = dayNames[i];
    }
  }
  
  return { strongestDay, weekendBias };
}

// --- Forward Projection ---
function projectForward(
  frequency: ProcessTrajectory['frequency'],
  consistency: ProcessTrajectory['consistency']
): ProcessTrajectory['projection'] {
  const { perWeek } = frequency;
  
  // Simple linear projection
  const thirtyDay = Math.round(perWeek * (30 / 7));
  const sixtyDay = Math.round(perWeek * (60 / 7));
  const ninetyDay = Math.round(perWeek * (90 / 7));
  
  // Confidence based on consistency score
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (consistency.score >= 70) confidence = 'high';
  else if (consistency.score < 40) confidence = 'low';
  
  return { thirtyDay, sixtyDay, ninetyDay, confidence };
}

// --- Status Derivation ---
function deriveStatus(
  frequency: ProcessTrajectory['frequency'],
  recency: ProcessTrajectory['recency'],
  consistency: ProcessTrajectory['consistency']
): TrajectoryStatus {
  // Dormant: no activity in a while
  if (recency.daysSinceLast > 14) return 'dormant';
  
  // Drifting: frequency dropping or overdue
  if (frequency.trend === 'down' || recency.isOverdue) return 'drifting';
  
  // Building: frequency increasing
  if (frequency.trend === 'up') return 'building';
  
  // Steady: stable frequency
  return 'steady';
}

// --- Human Insight Generation ---
function generateInsight(
  status: TrajectoryStatus,
  frequency: ProcessTrajectory['frequency'],
  patterns: ProcessTrajectory['patterns'],
  projection: ProcessTrajectory['projection']
): string {
  const parts: string[] = [];
  
  // Pattern insight
  if (patterns.strongestDay) {
    const biasPercent = Math.round(Math.abs(patterns.weekendBias) * 100);
    parts.push(
      `Pattern suggests a distinct uptick on ${patterns.strongestDay}s.`
    );
  }
  
  // Projection insight
  if (projection.confidence === 'high') {
    parts.push(
      `At this rate, you're on track for ~${projection.thirtyDay} sessions this month.`
    );
  } else if (projection.confidence === 'medium') {
    parts.push(
      `Current pace suggests ~${projection.thirtyDay} sessions over the next 30 days.`
    );
  } else {
    parts.push(
      `Not enough consistent data to project reliably.`
    );
  }
  
  // Status-specific insight
  if (status === 'building') {
    parts.unshift(`Momentum is building.`);
  } else if (status === 'drifting') {
    parts.unshift(`Activity has tapered recently.`);
  }
  
  return parts.join(' ');
}

// --- Fallback for new/inactive processes ---
function createDormantTrajectory(lastLog?: Date): ProcessTrajectory {
  return {
    status: 'dormant',
    frequency: { perWeek: 0, perMonth: 0, trend: 'stable' },
    consistency: { score: 0, avgGapDays: 0, gapVariance: 0 },
    recency: { 
      daysSinceLast: lastLog 
        ? Math.floor((Date.now() - lastLog.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity,
      isOverdue: true 
    },
    patterns: { strongestDay: null, weekendBias: 0 },
    projection: { thirtyDay: 0, sixtyDay: 0, ninetyDay: 0, confidence: 'low' },
    insight: lastLog 
      ? 'No recent activity. Log once to restart tracking.'
      : 'Start logging to see your trajectory.',
  };
}