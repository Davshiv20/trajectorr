"use client";

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ProcessRow } from './ProcessRow';
import type { ActivityGridProps } from './types';

const TOTAL_DAYS = 90;
const CELL_PX = 42; // --cell-size (36) + --cell-gap (6)
const VISIBLE_CELLS = 14;
const STEP = 7; // scroll by 1 week

export function ActivityGrid({
  processes, logs, onToggle,
}: ActivityGridProps) {
  const today = new Date();
  const dates = useMemo(() => {
    const result: Date[] = [];
    for (let i = TOTAL_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      result.push(d);
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today.toDateString()]);

  const logsByProcess = new Map<string, Set<string>>();
  for (const log of logs) {
    if (!logsByProcess.has(log.process_id)) {
      logsByProcess.set(log.process_id, new Set());
    }
    logsByProcess.get(log.process_id)!.add(log.logged_at);
  }

  // Offset = index of the first visible date. Start at the end.
  const maxOffset = TOTAL_DAYS - VISIBLE_CELLS;
  const [offset, setOffset] = useState(maxOffset);

  const canGoLeft = offset > 0;
  const canGoRight = offset < maxOffset;

  const viewportWidth = VISIBLE_CELLS * CELL_PX - 6; // subtract last gap

  return (
    <div className="flex items-start gap-4">
      {/* Fixed left column: Process labels */}
      <div className="w-20 shrink-0 space-y-3">
        <div className="h-6" />
        {processes.map((process) => (
          <div key={process.id} className="h-[var(--cell-size)] flex flex-col justify-center">
            <div className="font-medium text-sm">{process.name}</div>
            <div className="text-xs text-[var(--text-muted)]">{process.category}</div>
          </div>
        ))}
      </div>

      {/* Left arrow */}
      <button
        onClick={() => setOffset((o) => Math.max(0, o - STEP))}
        disabled={!canGoLeft}
        className="mt-6 shrink-0 w-7 h-[var(--cell-size)] flex items-center justify-center rounded text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-cell-empty)] transition-colors disabled:opacity-20 disabled:pointer-events-none"
        aria-label="Show earlier dates"
      >
        &larr;
      </button>

      {/* Sliding window */}
      <div className="overflow-hidden" style={{ width: viewportWidth }}>
        <motion.div
          animate={{ x: -(offset * CELL_PX) }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="space-y-3 min-w-fit"
        >
          {/* Date header */}
          <div className="flex gap-[var(--cell-gap)]">
            {dates.map((date) => {
              const isFirstOfMonth = date.getDate() === 1;
              return (
                <div
                  key={date.toISOString()}
                  className="w-[var(--cell-size)] shrink-0 text-center text-xs text-[var(--text-muted)]"
                >
                  {isFirstOfMonth ? (
                    <span className="font-medium text-[var(--text-secondary)]">
                      {date.toLocaleString('default', { month: 'short' })}
                    </span>
                  ) : (
                    date.getDate()
                  )}
                </div>
              );
            })}
          </div>

          {/* Process rows */}
          {processes.map((process) => (
            <ProcessRow
              key={process.id}
              process={process}
              dates={dates}
              loggedDates={logsByProcess.get(process.id) || new Set()}
              onToggle={onToggle}
            />
          ))}
        </motion.div>
      </div>

      {/* Right arrow */}
      <button
        onClick={() => setOffset((o) => Math.min(maxOffset, o + STEP))}
        disabled={!canGoRight}
        className="mt-6 shrink-0 w-7 h-[var(--cell-size)] flex items-center justify-center rounded text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-cell-empty)] transition-colors disabled:opacity-20 disabled:pointer-events-none"
        aria-label="Show later dates"
      >
        &rarr;
      </button>
    </div>
  );
}
