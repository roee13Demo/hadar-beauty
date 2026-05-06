"use client";

import { cn } from "@/lib/utils";
import { he } from "@/lib/i18n/he";

export type PeriodOption = 7 | 30 | 90 | 365;

const OPTIONS: ReadonlyArray<{ value: PeriodOption; labelKey: keyof typeof he.analytics.period }> = [
  { value: 7, labelKey: "d7" },
  { value: 30, labelKey: "d30" },
  { value: 90, labelKey: "d90" },
  { value: 365, labelKey: "d365" },
];

interface PeriodSelectorProps {
  value: PeriodOption;
  onChange: (value: PeriodOption) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card p-1">
      {OPTIONS.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {he.analytics.period[opt.labelKey]}
          </button>
        );
      })}
    </div>
  );
}
