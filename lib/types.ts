export type TrajectoryStatus = 'building' | 'steady' | 'drifting' | 'dormant';

export interface ProcessTrajectory {
  status: TrajectoryStatus;
  
  // Frequency
  frequency: {
    perWeek: number;        // e.g., 4.2
    perMonth: number;       // e.g., 18
    trend: 'up' | 'down' | 'stable';
  };
  
  // Consistency (how regular are the gaps?)
  consistency: {
    score: number;          // 0-100, higher = more regular
    avgGapDays: number;     // e.g., 1.7 days between logs
    gapVariance: number;    // low = consistent, high = erratic
  };
  
  // Recency
  recency: {
    daysSinceLast: number;
    isOverdue: boolean;     // based on their usual pattern
  };
  
  // Patterns
  patterns: {
    strongestDay: string | null;   // "Saturday" or null if no pattern
    weekendBias: number;           // -1 to 1 (negative = weekday person)
  };
  
  // Projection (the "at this rate..." output)
  projection: {
    thirtyDay: number;      // projected logs in next 30 days
    sixtyDay: number;
    ninetyDay: number;
    confidence: 'high' | 'medium' | 'low';
  };
  
  // Human-readable insight
  insight: string;
}

export type LogEntry = {
    logged_at: Date;
}