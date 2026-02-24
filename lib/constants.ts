// ── Time ──
export const MS_PER_DAY = 1000 * 60 * 60 * 24;
export const DAYS_PER_WEEK = 7;
export const WEEKS_PER_MONTH = 4.33;

// ── Analysis thresholds ──
export const MIN_LOGS_FOR_ANALYSIS = 2;

// ── Frequency ──
export const FREQUENCY_WINDOW_DAYS = 14;
export const TREND_UP_THRESHOLD = 1.2;
export const TREND_DOWN_THRESHOLD = 0.8;

// ── Consistency ──
export const CONSISTENCY_WINDOW_DAYS = 14;

// ── Recency ──
export const DEFAULT_AVG_GAP_DAYS = 7;
export const MAX_RECENT_GAPS = 10;
export const OVERDUE_MULTIPLIER = 1.5;

// ── Patterns ──
export const EXPECTED_WEEKEND_RATIO = 2 / 7;
export const STRONGEST_DAY_THRESHOLD = 1.5;

// ── Projection ──
export const PROJECTION_DAYS = { thirty: 30, sixty: 60, ninety: 90 } as const;
export const CONFIDENCE_HIGH_THRESHOLD = 70;
export const CONFIDENCE_LOW_THRESHOLD = 40;

// ── Status ──
export const DORMANT_THRESHOLD_DAYS = 14;

// ── AI Insight ──
export const AI_INSIGHT_MIN_LOGS = 3;
export const AI_INSIGHT_REFETCH_DELTA = 3;