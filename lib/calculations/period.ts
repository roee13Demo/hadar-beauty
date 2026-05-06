/**
 * Date-range helpers for dashboard and analytics aggregations.
 *
 * All ranges are inclusive on both ends and use ISO date strings ("YYYY-MM-DD")
 * to match the format we store on Transaction rows. This keeps comparisons
 * lexicographic-safe and avoids timezone gotchas at month boundaries.
 */

export interface DateRange {
  /** Inclusive lower bound, ISO date "YYYY-MM-DD" */
  start: string;
  /** Inclusive upper bound, ISO date "YYYY-MM-DD" */
  end: string;
  /** Number of days the range spans (>= 1) */
  days: number;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

export function todayIso(now: Date = new Date()): string {
  return toIsoDate(now);
}

function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
}

/** A single day range for `now`. */
export function getTodayRange(now: Date = new Date()): DateRange {
  const iso = toIsoDate(now);
  return { start: iso, end: iso, days: 1 };
}

/** From the 1st of the month containing `now` through `now` (inclusive). */
export function getMonthToDateRange(now: Date = new Date()): DateRange {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    start: toIsoDate(start),
    end: toIsoDate(now),
    days: daysBetween(toIsoDate(start), toIsoDate(now)),
  };
}

/**
 * Same number of days from the 1st of the previous month, clamped to the
 * previous month's last day. For example, if today is 2026-05-31 and April
 * has only 30 days, returns 2026-04-01..2026-04-30.
 */
export function getPriorMonthSameRange(now: Date = new Date()): DateRange {
  const dayOfMonth = now.getDate();
  const priorMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const priorYear =
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  // Last day of prior month: day 0 of (priorMonth + 1)
  const lastDayOfPrior = new Date(priorYear, priorMonth + 1, 0).getDate();
  const clampedDay = Math.min(dayOfMonth, lastDayOfPrior);
  const start = new Date(priorYear, priorMonth, 1);
  const end = new Date(priorYear, priorMonth, clampedDay);
  return {
    start: toIsoDate(start),
    end: toIsoDate(end),
    days: daysBetween(toIsoDate(start), toIsoDate(end)),
  };
}

/** The last `n` days, ending today (inclusive). */
export function getLastNDaysRange(
  n: number,
  now: Date = new Date(),
): DateRange {
  const end = toIsoDate(now);
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - (n - 1));
  return {
    start: toIsoDate(startDate),
    end,
    days: n,
  };
}

/** True if `iso` is within `range` (both bounds inclusive). */
export function isInRange(iso: string, range: DateRange): boolean {
  return iso >= range.start && iso <= range.end;
}

/**
 * Percent change from `prior` to `current`. Returns null when prior is 0
 * (so the UI can show "—" instead of an infinite or 100% delta).
 */
export function percentChange(
  current: number,
  prior: number,
): number | null {
  if (prior === 0) return current === 0 ? 0 : null;
  return (current - prior) / Math.abs(prior);
}
