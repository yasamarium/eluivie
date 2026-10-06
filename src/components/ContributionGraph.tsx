'use client';

import React, { useMemo } from 'react';

interface ContributionGraphProps {
  username?: string;
  count?: number;
}

export function ContributionGraph({ username, count = 284 }: ContributionGraphProps) {
  // Generate stable mock grid for the user's past 28 weeks (7 days each)
  const weeks = useMemo(() => {
    const list: number[][] = [];
    let seed = 42;
    for (let w = 0; w < 32; w++) {
      const days: number[] = [];
      for (let d = 0; d < 7; d++) {
        seed = (seed * 9301 + 49297) % 233280;
        const rnd = seed / 233280;
        // Bias towards some activity
        let level = 0;
        if (rnd > 0.45) level = 1;
        if (rnd > 0.70) level = 2;
        if (rnd > 0.88) level = 3;
        if (rnd > 0.95) level = 4;
        days.push(level);
      }
      list.push(days);
    }
    return list;
  }, []);

  const getCellColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-emerald-900/50 border-emerald-800/40';
      case 2:
        return 'bg-emerald-700/70 border-emerald-600/50';
      case 3:
        return 'bg-emerald-500 border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]';
      case 4:
        return 'bg-emerald-400 border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.5)]';
      default:
        return 'bg-white/[0.03] border-white/[0.04]';
    }
  };

  return (
    <div className="p-5 rounded-3xl ios-glass-card border border-white/[0.08]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Contributions Matrix
          </h3>
          <p className="text-[11px] text-neutral-500">
            {count} commits and syncs in the past months
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-[3px] bg-white/[0.03] border border-white/[0.04]" />
          <div className="w-2.5 h-2.5 rounded-[3px] bg-emerald-900/50" />
          <div className="w-2.5 h-2.5 rounded-[3px] bg-emerald-700/70" />
          <div className="w-2.5 h-2.5 rounded-[3px] bg-emerald-500" />
          <div className="w-2.5 h-2.5 rounded-[3px] bg-emerald-400" />
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex gap-[3.5px] min-w-max">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-[3.5px]">
              {week.map((level, dIdx) => (
                <div
                  key={dIdx}
                  title={`Level ${level} activity`}
                  className={`w-3 h-3 rounded-[3px] border transition-all duration-150 hover:scale-125 hover:z-10 ${getCellColor(
                    level
                  )}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
