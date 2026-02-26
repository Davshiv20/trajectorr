import { LogEntry } from './types';
import { ProcessTrajectory, TrajectoryStatus } from './types';
import {
  MS_PER_DAY,
  DAYS_PER_WEEK,
  WEEKS_PER_MONTH,
  MIN_LOGS_FOR_ANALYSIS,
  TREND_UP_THRESHOLD,
  TREND_DOWN_THRESHOLD,
  MIN_LIFETIME_FOR_TREND,
  CONSISTENCY_WINDOW_DAYS,
  DEFAULT_AVG_GAP_DAYS,
  MAX_RECENT_GAPS,
  OVERDUE_MULTIPLIER,
  EXPECTED_WEEKEND_RATIO,
  STRONGEST_DAY_THRESHOLD,
  PROJECTION_DAYS,
  CONFIDENCE_HIGH_THRESHOLD,
  CONFIDENCE_LOW_THRESHOLD,
  DORMANT_THRESHOLD_DAYS,
} from './constants';

export function analyzeProcess(logs: LogEntry[]): ProcessTrajectory {
  const now = new Date();
  const sortedLogs = [...logs].sort((a, b) =>
    b.logged_at.getTime() - a.logged_at.getTime()
  );

  if (sortedLogs.length < MIN_LOGS_FOR_ANALYSIS) {
    return createDormantTrajectory(sortedLogs[0]?.logged_at);
  }

  const earliestLog = sortedLogs[sortedLogs.length - 1].logged_at;
  const lifetimeDays = Math.max(1, Math.floor((now.getTime() - earliestLog.getTime()) / MS_PER_DAY));

  const frequency = calculateFrequency(sortedLogs, lifetimeDays);
  const consistency = calculateConsistency(sortedLogs, now);
  const recency = calculateRecency(sortedLogs, now);
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

// --- Frequency (lifetime-based) ---
function calculateFrequency(
  logs: LogEntry[],
  lifetimeDays: number
): ProcessTrajectory['frequency'] {
  const perWeek = (logs.length / lifetimeDays) * DAYS_PER_WEEK;

  let trend: 'up' | 'down' | 'stable' = 'stable';

  if (lifetimeDays >= MIN_LIFETIME_FOR_TREND) {
    const halfLifetimeMs = (lifetimeDays / 2) * MS_PER_DAY;
    const earliest = logs[logs.length - 1].logged_at;
    const midpoint = new Date(earliest.getTime() + halfLifetimeMs);

    const recentLogs = logs.filter(l => l.logged_at >= midpoint).length;
    const olderLogs = logs.filter(l => l.logged_at < midpoint).length;

    const halfDays = lifetimeDays / 2;
    const recentRate = recentLogs / halfDays;
    const olderRate = olderLogs / halfDays;

    if (olderRate > 0) {
      if (recentRate > olderRate * TREND_UP_THRESHOLD) trend = 'up';
      else if (recentRate < olderRate * TREND_DOWN_THRESHOLD) trend = 'down';
    }
  }

  return {
    perWeek: Math.round(perWeek * 10) / 10,
    perMonth: Math.round(perWeek * WEEKS_PER_MONTH),
    trend,
  };
}

// --- Consistency (last N days) ---
function calculateConsistency(
  logs: LogEntry[],
  now: Date
): ProcessTrajectory['consistency'] {
  const cutoff = new Date(now.getTime() - CONSISTENCY_WINDOW_DAYS * MS_PER_DAY);
  const recentLogs = logs.filter(l => l.logged_at >= cutoff);

  const uniqueDays = new Set(
    recentLogs.map(l => l.logged_at.toISOString().split('T')[0])
  );
  const daysLogged = uniqueDays.size;
  const score = Math.round((daysLogged / CONSISTENCY_WINDOW_DAYS) * 100);

  return { score, daysLogged };
}

// --- Recency ---
function calculateRecency(
  logs: LogEntry[],
  now: Date
): ProcessTrajectory['recency'] {
  const lastLog = logs[0]?.logged_at;
  if (!lastLog) {
    return { daysSinceLast: Infinity, isOverdue: true };
  }

  const daysSinceLast = Math.floor(
    (now.getTime() - lastLog.getTime()) / MS_PER_DAY
  );

  let avgGapDays = DEFAULT_AVG_GAP_DAYS;
  if (logs.length >= 2) {
    const gaps: number[] = [];
    for (let i = 0; i < Math.min(logs.length - 1, MAX_RECENT_GAPS); i++) {
      gaps.push(
        (logs[i].logged_at.getTime() - logs[i + 1].logged_at.getTime()) / MS_PER_DAY
      );
    }
    avgGapDays = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  }

  const isOverdue = daysSinceLast > avgGapDays * OVERDUE_MULTIPLIER;

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

  const weekendRatio = total > 0 ? weekendCount / total : 0;
  const weekendBias = Math.round((weekendRatio - EXPECTED_WEEKEND_RATIO) / EXPECTED_WEEKEND_RATIO * 100) / 100;

  const expectedPerDay = total / DAYS_PER_WEEK;
  let strongestDay: string | null = null;
  let maxCount = 0;

  for (let i = 0; i < DAYS_PER_WEEK; i++) {
    if (dayCounts[i] > expectedPerDay * STRONGEST_DAY_THRESHOLD && dayCounts[i] > maxCount) {
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

  const thirtyDay = Math.round(perWeek * (PROJECTION_DAYS.thirty / DAYS_PER_WEEK));
  const sixtyDay = Math.round(perWeek * (PROJECTION_DAYS.sixty / DAYS_PER_WEEK));
  const ninetyDay = Math.round(perWeek * (PROJECTION_DAYS.ninety / DAYS_PER_WEEK));

  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (consistency.score >= CONFIDENCE_HIGH_THRESHOLD) confidence = 'high';
  else if (consistency.score < CONFIDENCE_LOW_THRESHOLD) confidence = 'low';

  return { thirtyDay, sixtyDay, ninetyDay, confidence };
}

// --- Status Derivation ---
function deriveStatus(
  frequency: ProcessTrajectory['frequency'],
  recency: ProcessTrajectory['recency'],
  consistency: ProcessTrajectory['consistency']
): TrajectoryStatus {
  if (recency.daysSinceLast > DORMANT_THRESHOLD_DAYS) return 'dormant';
  if (frequency.trend === 'down' || recency.isOverdue) return 'drifting';
  if (frequency.trend === 'up') return 'building';
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

  if (patterns.strongestDay) {
    const biasPercent = Math.round(Math.abs(patterns.weekendBias) * 100);
    parts.push(
      `Pattern suggests a distinct uptick on ${patterns.strongestDay}s.`
    );
  }

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
    consistency: { score: 0, daysLogged: 0 },
    recency: {
      daysSinceLast: lastLog
        ? Math.floor((Date.now() - lastLog.getTime()) / MS_PER_DAY)
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