/**
 * Utility functions for calculating kid dashboard statistics.
 * These pure functions can be used for testing and client-side calculations.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CollectionStats {
  uniqueCards: number;
  totalCards: number;
  setsStarted: number;
}

export interface BadgeStats {
  total: number;
  recentlyEarned: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  lastActiveDate: string | null;
}

export interface ActivityLogEntry {
  action: 'card_added' | 'card_removed' | 'achievement_earned';
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface EnrichedActivity {
  action: string;
  displayText: string;
  icon: string;
  timestamp: number;
  relativeTime: string;
}

export interface DashboardStats {
  collection: CollectionStats;
  badges: BadgeStats;
  streak: StreakInfo;
  recentActivity: EnrichedActivity[];
}

export interface CollectionCard {
  cardId: string;
  quantity: number;
}

export interface Achievement {
  achievementKey: string;
  earnedAt: number;
}

// ============================================================================
// COLLECTION STATS
// ============================================================================

/**
 * Calculate collection statistics from a list of collection cards.
 */
export function calculateCollectionStats(cards: CollectionCard[]): CollectionStats {
  const uniqueCardIds = new Set(cards.map((c) => c.cardId));
  const totalCards = cards.reduce((sum, c) => sum + c.quantity, 0);
  const uniqueCards = uniqueCardIds.size;
  const setsStarted = new Set(cards.map((c) => extractSetId(c.cardId))).size;

  return {
    uniqueCards,
    totalCards,
    setsStarted,
  };
}

/**
 * Extract set ID from card ID (format: "setId-cardNumber").
 */
export function extractSetId(cardId: string): string {
  return cardId.split('-')[0];
}

// ============================================================================
// BADGE STATS
// ============================================================================

/**
 * Calculate badge statistics from achievements.
 * @param achievements - List of achievements
 * @param recentDays - Number of days to consider as "recent" (default 7)
 */
export function calculateBadgeStats(
  achievements: Achievement[],
  recentDays = 7
): BadgeStats {
  const now = Date.now();
  const recentCutoff = now - recentDays * 24 * 60 * 60 * 1000;

  return {
    total: achievements.length,
    recentlyEarned: achievements.filter((a) => a.earnedAt > recentCutoff).length,
  };
}

// ============================================================================
// STREAK CALCULATION
// ============================================================================

/**
 * Check if two date strings are consecutive days.
 */
export function areConsecutiveDays(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = diffMs / (24 * 60 * 60 * 1000);
  // Use a small tolerance for floating point comparison
  return Math.abs(diffDays - 1) < 0.01;
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date as YYYY-MM-DD string.
 */
export function getYesterdayDateString(): string {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Convert timestamp to date string (YYYY-MM-DD).
 */
export function timestampToDateString(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

/**
 * Calculate streak information from activity dates.
 * @param activityDates - Array of date strings (YYYY-MM-DD format)
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

  // Calculate current streak (only if active today or yesterday)
  let currentStreak = 0;
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

/**
 * Extract unique activity dates from activity logs.
 * @param logs - Array of activity logs with timestamps
 * @param action - Optional action type to filter by
 */
export function extractActivityDates(
  logs: Array<{ action: string; timestamp: number }>,
  action?: string
): string[] {
  const filteredLogs = action ? logs.filter((l) => l.action === action) : logs;
  const uniqueDates = new Set<string>();

  for (const log of filteredLogs) {
    const dateStr = timestampToDateString(log.timestamp);
    uniqueDates.add(dateStr);
  }

  return Array.from(uniqueDates).sort();
}

// ============================================================================
// ACTIVITY FORMATTING
// ============================================================================

/**
 * Format a timestamp as a relative time string.
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  } else if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  } else if (minutes > 0) {
    return minutes === 1 ? '1 min ago' : `${minutes} mins ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Get icon for activity action type.
 */
export function getActivityIcon(action: string): string {
  switch (action) {
    case 'card_added':
      return '➕';
    case 'card_removed':
      return '➖';
    case 'achievement_earned':
      return '🏆';
    default:
      return '📋';
  }
}

/**
 * Format activity log for display.
 * @param log - Activity log entry
 * @param cardNameMap - Optional map of cardId -> cardName for enrichment
 */
export function formatActivityForDisplay(
  log: ActivityLogEntry,
  cardNameMap?: Map<string, string>
): EnrichedActivity {
  const metadata = log.metadata as
    | { cardId?: string; cardName?: string; achievementName?: string; achievementKey?: string }
    | undefined;

  let displayText = '';
  const icon = getActivityIcon(log.action);

  if (log.action === 'card_added') {
    const cardName =
      metadata?.cardName ??
      (metadata?.cardId && cardNameMap?.get(metadata.cardId)) ??
      metadata?.cardId ??
      'a card';
    displayText = `Added ${cardName}`;
  } else if (log.action === 'card_removed') {
    const cardName =
      metadata?.cardName ??
      (metadata?.cardId && cardNameMap?.get(metadata.cardId)) ??
      metadata?.cardId ??
      'a card';
    displayText = `Removed ${cardName}`;
  } else if (log.action === 'achievement_earned') {
    const achievementName = metadata?.achievementName ?? metadata?.achievementKey ?? 'an achievement';
    displayText = `Earned ${achievementName}`;
  }

  return {
    action: log.action,
    displayText,
    icon,
    timestamp: log.timestamp,
    relativeTime: formatRelativeTime(log.timestamp),
  };
}

/**
 * Format multiple activity logs for display.
 */
export function formatActivitiesForDisplay(
  logs: ActivityLogEntry[],
  cardNameMap?: Map<string, string>
): EnrichedActivity[] {
  return logs.map((log) => formatActivityForDisplay(log, cardNameMap));
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

/**
 * Calculate complete dashboard stats from raw data.
 * This is a pure function that can be used for testing.
 */
export function calculateDashboardStats(
  collectionCards: CollectionCard[],
  achievements: Achievement[],
  activityLogs: Array<{ action: string; timestamp: number }>,
  recentActivityLogs: ActivityLogEntry[],
  cardNameMap?: Map<string, string>
): DashboardStats {
  const collection = calculateCollectionStats(collectionCards);
  const badges = calculateBadgeStats(achievements);

  // Filter to card_added actions for streak calculation
  const cardAddDates = extractActivityDates(activityLogs, 'card_added');
  const streak = calculateStreak(cardAddDates);

  const recentActivity = formatActivitiesForDisplay(recentActivityLogs, cardNameMap);

  return {
    collection,
    badges,
    streak,
    recentActivity,
  };
}

// ============================================================================
// STREAK STATUS HELPERS
// ============================================================================

/**
 * Get a friendly message about the user's streak status.
 */
export function getStreakStatusMessage(streak: StreakInfo): string {
  if (streak.currentStreak === 0) {
    if (streak.longestStreak > 0) {
      return `Start a new streak! Your best was ${streak.longestStreak} days.`;
    }
    return 'Add a card to start your streak!';
  }

  if (streak.isActiveToday) {
    if (streak.currentStreak === 1) {
      return "You're on a roll! Keep it going tomorrow!";
    }
    return `🔥 ${streak.currentStreak} day streak! Keep it up!`;
  } else {
    return `⚠️ ${streak.currentStreak} day streak at risk! Add a card today!`;
  }
}

/**
 * Check if the streak is at risk (active yesterday but not today).
 */
export function isStreakAtRisk(streak: StreakInfo): boolean {
  return streak.currentStreak > 0 && !streak.isActiveToday;
}

/**
 * Get the streak display text.
 */
export function formatStreakDisplay(streak: StreakInfo): string {
  if (streak.currentStreak === 0) {
    return 'No streak';
  }
  return streak.currentStreak === 1 ? '1 day' : `${streak.currentStreak} days`;
}
