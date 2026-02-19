import { TimeRangeToggleProps } from "./types";
import React from "react";

export function TimeRangeToggle({ value, onChange }: TimeRangeToggleProps) {
    const options: Array<7 | 14 > = [7, 14];
    
    return (
      <div className="flex bg-[var(--bg-cell-empty)] rounded-lg p-1 w-fit mx-auto">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`
              px-5 py-2 text-sm font-medium rounded-md transition-colors
              ${value === opt 
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }
            `}
          >
            {opt}d
          </button>
        ))}
      </div>
    );
  }