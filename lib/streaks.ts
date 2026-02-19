// Streak calculation utilities

export interface StreakData {
  current: number;
  longest: number;
  lastLogDate: string | null;
}

export function calculateStreak(logDates: string[]): StreakData {
  if (logDates.length === 0) {
    return { current: 0, longest: 0, lastLogDate: null };
  }

  const sorted = [...logDates].sort().reverse();
  const lastLogDate = sorted[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Current streak: must include today or yesterday to be "active"
  let current = 0;
  if (sorted[0] === todayStr || sorted[0] === yesterdayStr) {
    const dateSet = new Set(sorted);
    const check = new Date(sorted[0]);
    check.setHours(0, 0, 0, 0);

    while (dateSet.has(check.toISOString().split("T")[0])) {
      current++;
      check.setDate(check.getDate() - 1);
    }
  }

  // Longest streak
  let longest = 0;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) {
      run++;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run, current);

  return { current, longest, lastLogDate };
}

export function formatTimeSince(dateStr: string | null, now: Date): string {
  if (!dateStr) return "never";

  const logDate = new Date(dateStr + "T23:59:59");
  const diffMs = now.getTime() - logDate.getTime();

  if (diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
