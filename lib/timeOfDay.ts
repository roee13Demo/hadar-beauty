"use client";

import { useEffect, useState } from "react";

/**
 * Maps the current hour of day to a "period" — used for both the dashboard
 * greeting and the gradient background. Updates every minute on mount.
 */

export type TimePeriod =
  | "dawn"        // 05–07 — sunrise
  | "morning"     // 07–11
  | "noon"        // 11–14
  | "afternoon"   // 14–17
  | "evening"     // 17–20 — sunset
  | "earlyNight"  // 20–23
  | "lateNight";  // 23–05

export interface PeriodMeta {
  period: TimePeriod;
  /** Hebrew greeting line, includes emoji */
  greeting: (name: string) => string;
  /** Tailwind gradient classes — applied to a soft glow above the welcome area */
  gradientClass: string;
  /** Whether the period is "late" — used to surface a gentle nudge to rest */
  isLate: boolean;
}

function pickPeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 11) return "morning";
  if (hour >= 11 && hour < 14) return "noon";
  if (hour >= 14 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  if (hour >= 20 && hour < 23) return "earlyNight";
  return "lateNight";
}

const META: Record<TimePeriod, PeriodMeta> = {
  dawn: {
    period: "dawn",
    greeting: (n) => `בוקר טוב, ${n} 🌅`,
    gradientClass:
      "from-orange-200/40 via-pink-200/30 to-transparent dark:from-orange-500/20 dark:via-pink-400/15 dark:to-transparent",
    isLate: false,
  },
  morning: {
    period: "morning",
    greeting: (n) => `בוקר טוב, ${n} ☕`,
    gradientClass:
      "from-amber-200/40 via-yellow-100/30 to-transparent dark:from-amber-500/15 dark:via-yellow-400/10 dark:to-transparent",
    isLate: false,
  },
  noon: {
    period: "noon",
    greeting: (n) => `צהריים טובים, ${n} ☀️`,
    gradientClass:
      "from-yellow-100/40 via-amber-50/30 to-transparent dark:from-yellow-400/10 dark:via-amber-300/10 dark:to-transparent",
    isLate: false,
  },
  afternoon: {
    period: "afternoon",
    greeting: (n) => `אחר הצהריים, ${n} — איך הולך?`,
    gradientClass:
      "from-amber-200/40 via-orange-100/30 to-transparent dark:from-amber-500/15 dark:via-orange-400/10 dark:to-transparent",
    isLate: false,
  },
  evening: {
    period: "evening",
    greeting: (n) => `ערב טוב, ${n} 🌇`,
    gradientClass:
      "from-pink-200/40 via-purple-200/30 to-transparent dark:from-pink-500/20 dark:via-purple-500/15 dark:to-transparent",
    isLate: false,
  },
  earlyNight: {
    period: "earlyNight",
    greeting: (n) => `ערב נעים, ${n} 🌙`,
    gradientClass:
      "from-indigo-200/40 via-purple-200/30 to-transparent dark:from-indigo-500/20 dark:via-purple-500/15 dark:to-transparent",
    isLate: false,
  },
  lateNight: {
    period: "lateNight",
    greeting: (n) => `כבר מאוחר, ${n} — תנוחי 😴`,
    gradientClass:
      "from-blue-300/40 via-indigo-300/30 to-transparent dark:from-blue-700/25 dark:via-indigo-700/20 dark:to-transparent",
    isLate: true,
  },
};

export function getPeriodMeta(date: Date = new Date()): PeriodMeta {
  return META[pickPeriod(date.getHours())];
}

/**
 * Reactive hook — re-evaluates every minute so the greeting and gradient
 * shift live as the user keeps the app open across time-of-day boundaries.
 *
 * Uses a deterministic initial value to avoid hydration mismatch when the
 * server and client clocks differ (e.g. UTC server vs IL client). The real
 * time-of-day is computed in the effect after mount.
 */
export function useTimeOfDay(): PeriodMeta {
  const [meta, setMeta] = useState<PeriodMeta>(META.morning);

  useEffect(() => {
    setMeta(getPeriodMeta());
    const interval = setInterval(() => setMeta(getPeriodMeta()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return meta;
}
