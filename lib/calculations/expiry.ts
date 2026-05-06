/**
 * Expiry status helpers. We treat "expiring soon" as <= 60 days from today.
 */

export type ExpiryStatus = "none" | "ok" | "expiring_soon" | "expired";

export interface ExpiryAssessment {
  status: ExpiryStatus;
  /** Days from today. Negative if already expired, null if no date set. */
  daysFromToday: number | null;
}

const EXPIRING_SOON_DAYS = 60;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function assessExpiry(
  isoDate: string | null | undefined,
  now: Date = new Date(),
): ExpiryAssessment {
  if (!isoDate) {
    return { status: "none", daysFromToday: null };
  }
  const expiry = new Date(isoDate);
  if (Number.isNaN(expiry.getTime())) {
    return { status: "none", daysFromToday: null };
  }

  // Normalize both dates to midnight to count whole days
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const expiryUtc = Date.UTC(
    expiry.getFullYear(),
    expiry.getMonth(),
    expiry.getDate(),
  );
  const daysFromToday = Math.round((expiryUtc - todayUtc) / MS_PER_DAY);

  if (daysFromToday < 0) {
    return { status: "expired", daysFromToday };
  }
  if (daysFromToday <= EXPIRING_SOON_DAYS) {
    return { status: "expiring_soon", daysFromToday };
  }
  return { status: "ok", daysFromToday };
}

export const EXPIRING_SOON_WINDOW_DAYS = EXPIRING_SOON_DAYS;
