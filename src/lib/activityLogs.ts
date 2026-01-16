/**
 * Activity Log Utility Functions
 *
 * Pure functions for working with activity log data.
 * These functions are used for streak calculations, date formatting,
 * and activity analysis.
 */

// ============================================================================
// TYPES
// ============================================================================

export type ActivityAction = 'card_added' | 'card_removed' | 'achievement_earned';

export interface ActivityLog {
  profileId: string;
  action: ActivityAction;
  metadata?: Record<string, unknown>;
  _creationTime: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  lastActiveDate: string | null;
}

export interface DailyActivitySummary {
  date: string; // YYYY-MM-DD
  cardsAdded: number;
  cardsRemoved: number;
  achievementsEarned: number;
  totalActions: number;
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Convert a timestamp to YYYY-MM-DD format in UTC
 */
export function timestampToDateString(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

/**
 * Get today's date as YYYY-MM-DD in UTC
 */
export function getTodayDateString(): string {
  return timestampToDateString(Date.now());
}

/**
 * Get yesterday's date as YYYY-MM-DD in UTC
 */
export function getYesterdayDateString(): string {
  const yesterday = Date.now() - 24 * 60 * 60 * 1000;
  return timestampToDateString(yesterday);
}

/**
 * Check if two dates are consecutive days
 */
export function areConsecutiveDays(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = diffMs / (24 * 60 * 60 * 1000);
  return diffDays === 1;
}

/**
 * Get the start of a day (midnight UTC) as timestamp
 */
export function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Get the end of a day (23:59:59.999 UTC) as timestamp
 */
export function getEndOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setUTCHours(23, 59, 59, 999);
  return date.getTime();
}

// ============================================================================
// STREAK CALCULATION
// ============================================================================

/**
 * Calculate streak information from an array of activity dates
 * Dates should be in YYYY-MM-DD format, sorted ascending
 */
export function calculateStreak(activityDates: string[]): StreakInfo {
  if (activityDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isActiveToday: false,
      lastActiveDate: null,
    };
  }

  // Sort dates in descending order (most recent first)
  const sortedDates = [...activityDates].sort((a, b) => b.localeCompare(a));
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  const isActiveToday = sortedDates[0] === today;
  const lastActiveDate = sortedDates[0];

  // Calculate current streak
  let currentStreak = 0;

  // Current streak only counts if active today or yesterday
  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      if (areConsecutiveDays(sortedDates[i], sortedDates[i - 1])) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak (looking at all dates in ascending order)
  const ascendingDates = [...activityDates].sort();
  let longestStreak = ascendingDates.length > 0 ? 1 : 0;
  let currentRun = 1;

  for (let i = 1; i < ascendingDates.length; i++) {
    if (areConsecutiveDays(ascendingDates[i - 1], ascendingDates[i])) {
      currentRun++;
      longestStreak = Math.max(longestStreak, currentRun);
    } else {
      currentRun = 1;
    }
  }

  return {
    currentStreak,
    longestStreak,
    isActiveToday,
    lastActiveDate,
  };
}

// ============================================================================
// ACTIVITY SUMMARIZATION
// ============================================================================

/**
 * Group activity logs by date and count actions
 */
export function summarizeActivityByDate(logs: ActivityLog[]): DailyActivitySummary[] {
  const byDate = new Map<string, DailyActivitySummary>();

  for (const log of logs) {
    const dateStr = timestampToDateString(log._creationTime);

    if (!byDate.has(dateStr)) {
      byDate.set(dateStr, {
        date: dateStr,
        cardsAdded: 0,
        cardsRemoved: 0,
        achievementsEarned: 0,
        totalActions: 0,
      });
    }

    const summary = byDate.get(dateStr)!;
    summary.totalActions++;

    switch (log.action) {
      case 'card_added':
        summary.cardsAdded++;
        break;
      case 'card_removed':
        summary.cardsRemoved++;
        break;
      case 'achievement_earned':
        summary.achievementsEarned++;
        break;
    }
  }

  // Return sorted by date descending (most recent first)
  return Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Get unique dates with card additions (for streak calculation)
 */
export function getCardAddDates(logs: ActivityLog[]): string[] {
  const dates = new Set<string>();

  for (const log of logs) {
    if (log.action === 'card_added') {
      dates.add(timestampToDateString(log._creationTime));
    }
  }

  return Array.from(dates).sort();
}

/**
 * Filter logs to a specific date range
 */
export function filterLogsByDateRange(
  logs: ActivityLog[],
  startDate: number,
  endDate: number
): ActivityLog[] {
  return logs.filter(
    (log) => log._creationTime >= startDate && log._creationTime <= endDate
  );
}

/**
 * Get the most recent activity of a specific type
 */
export function getLastActivityOfType(
  logs: ActivityLog[],
  action: ActivityAction
): ActivityLog | null {
  const filtered = logs.filter((log) => log.action === action);
  if (filtered.length === 0) return null;

  return filtered.reduce((latest, current) =>
    current._creationTime > latest._creationTime ? current : latest
  );
}

/**
 * Count total actions by type
 */
export function countActionsByType(
  logs: ActivityLog[]
): Record<ActivityAction, number> {
  const counts: Record<ActivityAction, number> = {
    card_added: 0,
    card_removed: 0,
    achievement_earned: 0,
  };

  for (const log of logs) {
    counts[log.action]++;
  }

  return counts;
}

// ============================================================================
// FORMATTING
// ============================================================================

/**
 * Format activity action for display
 */
export function formatActionForDisplay(action: ActivityAction): string {
  switch (action) {
    case 'card_added':
      return 'Added card';
    case 'card_removed':
      return 'Removed card';
    case 'achievement_earned':
      return 'Earned achievement';
    default:
      return 'Unknown action';
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "yesterday")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
}
