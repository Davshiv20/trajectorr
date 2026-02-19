"use client";

import { useState, useEffect, useRef } from 'react';
import { analyzeProcess } from '../lib/trajectory';
import type { LogEntry } from '../lib/types';

interface TrajectoryCardProps {
  process: {
    id: string;
    name: string;
    category: string;
    key: string;
    ai_tag: string | null;
    ai_insight: string | null;
    ai_insight_log_count: number | null;
  };
  logs: LogEntry[];
}

function getTagStyle(tag: string): { className: string; borderColor: string } {
  const t = tag.toLowerCase();

  if (/build|grow|rise|surg|spark|ignit/.test(t)) {
    return { className: 'bg-emerald-100 text-emerald-700', borderColor: '#059669' };
  }
  if (/steady|flow|rhythm|anchor|root/.test(t)) {
    return { className: 'bg-[var(--accent-steady-bg)] text-[var(--accent-steady)]', borderColor: 'var(--accent-steady)' };
  }
  if (/drift|stall|fade|slow|cool/.test(t)) {
    return { className: 'bg-amber-100 text-amber-700', borderColor: '#D97706' };
  }
  if (/dormant|idle|silent|dark|cold/.test(t)) {
    return { className: 'bg-gray-100 text-gray-500', borderColor: '#9CA3AF' };
  }

  return { className: 'bg-[var(--accent-steady-bg)] text-[var(--accent-steady)]', borderColor: 'var(--accent-steady)' };
}

export function TrajectoryCard({ process, logs }: TrajectoryCardProps) {
  const trajectory = analyzeProcess(logs);

  // Use cached values from DB as initial state
  const cacheValid = process.ai_insight_log_count === logs.length && process.ai_insight !== null;
  const [aiTag, setAiTag] = useState<string | null>(cacheValid ? process.ai_tag : null);
  const [aiInsight, setAiInsight] = useState<string | null>(cacheValid ? process.ai_insight : null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Abort in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Need 3+ logs for meaningful AI analysis
    if (logs.length < 4) {
      setAiTag(null);
      setAiInsight(null);
      setIsLoading(false);
      return;
    }

    // Cache is still valid — no fetch needed
    if (process.ai_insight_log_count === logs.length && process.ai_insight) {
      setAiTag(process.ai_tag);
      setAiInsight(process.ai_insight);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch('/api/generate-insight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            processId: process.id,
            processName: process.name,
            category: process.category,
            trajectory,
            logCount: logs.length,
          }),
          signal: controller.signal,
        });

        if (response.ok) {
          const { tag, insight } = await response.json();
          setAiTag(tag);
          setAiInsight(insight);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Error fetching AI insight:', error);
      } finally {
        setIsLoading(false);
      }
    }, 1200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [process.id, process.name, process.category, process.ai_insight, process.ai_tag, process.ai_insight_log_count, logs.length]);

  // Use AI tag if available, fall back to local status
  const displayTag = aiTag || trajectory.status.toUpperCase();
  const tagStyle = getTagStyle(displayTag);

  return (
    <div
      className="trajectory-card"
      style={{ borderLeftColor: tagStyle.borderColor }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">
            {process.name}
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            {process.category}
          </p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded ${isLoading && !aiTag ? 'bg-gray-100 text-gray-400 animate-pulse' : tagStyle.className}`}>
          {isLoading && !aiTag ? '...' : displayTag}
        </span>
      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <div className="text-[var(--text-muted)] text-xs uppercase tracking-wide">Frequency</div>
          <div className="font-semibold mt-0.5">
            {trajectory.frequency.perWeek.toFixed(1)}x/week
            {trajectory.frequency.trend === 'up' && <span className="text-emerald-600 ml-1">↗</span>}
            {trajectory.frequency.trend === 'down' && <span className="text-amber-600 ml-1">↘</span>}
          </div>
        </div>

        <div>
          <div className="text-[var(--text-muted)] text-xs uppercase tracking-wide">Consistency</div>
          <div className="font-semibold mt-0.5">{trajectory.consistency.score}%</div>
        </div>

        <div>
          <div className="text-[var(--text-muted)] text-xs uppercase tracking-wide">Last Logged</div>
          <div className={`font-semibold mt-0.5 ${trajectory.recency.isOverdue ? 'text-amber-600' : ''}`}>
            {trajectory.recency.daysSinceLast === 0 ? 'Today' :
             trajectory.recency.daysSinceLast === 1 ? 'Yesterday' :
             trajectory.recency.daysSinceLast === Infinity ? 'Never' :
             `${trajectory.recency.daysSinceLast}d ago`}
          </div>
        </div>

        <div>
          <div className="text-[var(--text-muted)] text-xs uppercase tracking-wide">30d Projection</div>
          <div className="font-semibold mt-0.5">
            ~{trajectory.projection.thirtyDay}
            <span className="text-xs text-[var(--text-muted)] ml-1 font-normal">
              ({trajectory.projection.confidence})
            </span>
          </div>
        </div>
      </div>

      {/* AI Insight */}
      {aiInsight && (
        <div className="mt-4 pt-4 border-t border-[var(--bg-cell-empty)]">
          <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed">
            {aiInsight}
          </p>
        </div>
      )}

      {isLoading && !aiInsight && logs.length >= 3 && (
        <div className="mt-4 pt-4 border-t border-[var(--bg-cell-empty)]">
          <p className="text-xs text-[var(--text-muted)] italic animate-pulse">
            Analyzing pattern...
          </p>
        </div>
      )}

      {/* Pattern callout */}
      {trajectory.patterns.strongestDay && (
        <div className="mt-3 text-xs text-[var(--text-secondary)]">
          Peaks on {trajectory.patterns.strongestDay}s
        </div>
      )}
    </div>
  );
}
