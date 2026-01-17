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

export type ActivityAction =
  | 'card_added'
  | 'card_removed'
  | 'achievement_earned'
  | 'trade_completed'
  | 'trade_logged';

// Trade card entry structure (used in trade_logged metadata)
export interface TradeCardEntry {
  cardId: string;
  cardName: string;
  quantity: number;
  variant: string;
  setName?: string;
}

// Metadata structure for trade_logged events
export interface TradeLoggedMetadata {
  cardsGiven: TradeCardEntry[];
  cardsReceived: TradeCardEntry[];
  tradingPartner?: string | null;
  totalCardsGiven: number;
  totalCardsReceived: number;
  tradeSummary?: string; // Pre-formatted summary from backend
}

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
  return logs.filter((log) => log._creationTime >= startDate && log._creationTime <= endDate);
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
export function countActionsByType(logs: ActivityLog[]): Record<ActivityAction, number> {
  const counts: Record<ActivityAction, number> = {
    card_added: 0,
    card_removed: 0,
    achievement_earned: 0,
    trade_completed: 0,
    trade_logged: 0,
  };

  for (const log of logs) {
    if (log.action in counts) {
      counts[log.action]++;
    }
  }

  return counts;
}

// ============================================================================
// CARD NAME EXTRACTION
// ============================================================================

/**
 * Metadata structure for card-related activity logs
 */
export interface CardActivityMetadata {
  cardId?: string;
  cardName?: string;
  variant?: string;
  quantity?: number;
  variantsRemoved?: number;
}

/**
 * Extract card name from activity log metadata.
 * Returns cardName if present, otherwise falls back to cardId.
 * Returns null if no card information is available.
 */
export function getCardNameFromMetadata(
  metadata: Record<string, unknown> | undefined
): string | null {
  if (!metadata) return null;

  const cardName = metadata.cardName as string | undefined;
  const cardId = metadata.cardId as string | undefined;

  if (cardName) return cardName;
  if (cardId) return cardId;
  return null;
}

/**
 * Extract card ID from activity log metadata.
 * Returns null if no cardId is present.
 */
export function getCardIdFromMetadata(
  metadata: Record<string, unknown> | undefined
): string | null {
  if (!metadata) return null;
  return (metadata.cardId as string | undefined) ?? null;
}

/**
 * Check if an activity log has card information in metadata
 */
export function hasCardMetadata(metadata: Record<string, unknown> | undefined): boolean {
  if (!metadata) return false;
  return typeof metadata.cardId === 'string';
}

/**
 * Build a display-friendly card label from metadata.
 * Includes variant and quantity if available.
 */
export function buildCardDisplayLabel(metadata: Record<string, unknown> | undefined): string {
  if (!metadata) return 'Unknown card';

  const cardName = getCardNameFromMetadata(metadata);
  if (!cardName) return 'Unknown card';

  const variant = metadata.variant as string | undefined;
  const quantity = metadata.quantity as number | undefined;

  let label = cardName;

  // Add variant if not normal
  if (variant && variant !== 'normal') {
    label += ` (${formatVariantForDisplay(variant)})`;
  }

  // Add quantity if more than 1
  if (quantity && quantity > 1) {
    label += ` x${quantity}`;
  }

  return label;
}

/**
 * Format variant name for display (e.g., "reverseHolofoil" -> "Reverse Holofoil")
 */
export function formatVariantForDisplay(variant: string): string {
  switch (variant) {
    case 'normal':
      return 'Normal';
    case 'holofoil':
      return 'Holofoil';
    case 'reverseHolofoil':
      return 'Reverse Holofoil';
    case '1stEditionHolofoil':
      return '1st Edition Holofoil';
    case '1stEditionNormal':
      return '1st Edition Normal';
    default:
      // Convert camelCase to Title Case
      return variant
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
  }
}

/**
 * Format a complete activity log entry for display.
 * Returns a human-readable string describing the activity.
 */
export function formatActivityLogForDisplay(log: ActivityLog): string {
  const action = formatActionForDisplay(log.action);
  const metadata = log.metadata as Record<string, unknown> | undefined;

  switch (log.action) {
    case 'card_added': {
      const cardLabel = buildCardDisplayLabel(metadata);
      return `${action}: ${cardLabel}`;
    }
    case 'card_removed': {
      const cardName = getCardNameFromMetadata(metadata);
      const variantsRemoved = metadata?.variantsRemoved as number | undefined;
      if (variantsRemoved && variantsRemoved > 1) {
        return `${action}: ${cardName ?? 'Unknown'} (${variantsRemoved} variants)`;
      }
      const variant = metadata?.variant as string | undefined;
      if (variant && variant !== 'normal') {
        return `${action}: ${cardName ?? 'Unknown'} (${formatVariantForDisplay(variant)})`;
      }
      return `${action}: ${cardName ?? 'Unknown'}`;
    }
    case 'achievement_earned': {
      const achievementKey = metadata?.achievementKey as string | undefined;
      return `${action}: ${achievementKey ?? 'Unknown achievement'}`;
    }
    case 'trade_logged': {
      // Use pre-formatted tradeSummary from backend if available
      const tradeSummary = metadata?.tradeSummary as string | undefined;
      if (tradeSummary) {
        return tradeSummary;
      }
      // Fallback: build summary from metadata
      return formatTradeLoggedForDisplay(metadata as TradeLoggedMetadata | undefined);
    }
    case 'trade_completed': {
      return `${action}`;
    }
    default:
      return action;
  }
}

/**
 * Format a trade_logged event for display.
 * Creates a human-readable summary of the trade.
 */
export function formatTradeLoggedForDisplay(metadata: TradeLoggedMetadata | undefined): string {
  if (!metadata) {
    return 'Logged trade';
  }

  const cardsGiven = metadata.cardsGiven ?? [];
  const cardsReceived = metadata.cardsReceived ?? [];

  // Build given summary
  const givenSummary =
    cardsGiven.length > 0
      ? cardsGiven
          .map((c) => (c.quantity > 1 ? `${c.quantity}x ${c.cardName}` : c.cardName))
          .join(', ')
      : null;

  // Build received summary
  const receivedSummary =
    cardsReceived.length > 0
      ? cardsReceived
          .map((c) => (c.quantity > 1 ? `${c.quantity}x ${c.cardName}` : c.cardName))
          .join(', ')
      : null;

  // Build formatted summary based on trade direction
  let tradeSummary = '';
  if (givenSummary && receivedSummary) {
    tradeSummary = `Traded ${givenSummary} for ${receivedSummary}`;
  } else if (givenSummary) {
    tradeSummary = `Gave away ${givenSummary}`;
  } else if (receivedSummary) {
    tradeSummary = `Received ${receivedSummary}`;
  } else {
    return 'Logged trade';
  }

  if (metadata.tradingPartner) {
    tradeSummary += ` with ${metadata.tradingPartner}`;
  }

  return tradeSummary;
}

/**
 * Get trade summary from trade_logged metadata.
 * Returns the tradeSummary or builds one from the cards.
 */
export function getTradeSummaryFromMetadata(
  metadata: Record<string, unknown> | undefined
): string | null {
  if (!metadata) return null;

  // Check for pre-formatted summary
  const tradeSummary = metadata.tradeSummary as string | undefined;
  if (tradeSummary) return tradeSummary;

  // Build summary from cards
  const tradeMetadata = metadata as TradeLoggedMetadata;
  if (!tradeMetadata.cardsGiven && !tradeMetadata.cardsReceived) {
    return null;
  }

  return formatTradeLoggedForDisplay(tradeMetadata);
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
    case 'trade_completed':
      return 'Completed trade';
    case 'trade_logged':
      return 'Logged trade';
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

// ============================================================================
// PAGINATION UTILITIES
// ============================================================================

/**
 * Default page size for paginated queries
 */
export const DEFAULT_PAGE_SIZE = 50;

/**
 * Maximum page size allowed for paginated queries
 */
export const MAX_PAGE_SIZE = 100;

/**
 * Minimum page size allowed for paginated queries
 */
export const MIN_PAGE_SIZE = 1;

/**
 * Paginated result structure returned by paginated queries
 */
export interface PaginatedResult<T> {
  logs: T[];
  nextCursor: number | undefined;
  hasMore: boolean;
  pageSize: number;
  totalFetched: number;
}

/**
 * Paginated result with additional family metadata
 */
export interface FamilyPaginatedResult<T> extends PaginatedResult<T> {
  familyProfileCount: number;
}

/**
 * Paginated result with action type metadata
 */
export interface ActionTypePaginatedResult<T> extends PaginatedResult<T> {
  action: ActivityAction;
}

/**
 * Paginated result with date range metadata
 */
export interface DateRangePaginatedResult<T> extends PaginatedResult<T> {
  dateRange: {
    start: number;
    end: number;
  };
}

/**
 * Clamp a page size to valid bounds (1-100)
 */
export function clampPageSize(pageSize: number | undefined): number {
  const size = pageSize ?? DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(size, MIN_PAGE_SIZE), MAX_PAGE_SIZE);
}

/**
 * Check if a page size is valid
 */
export function isValidPageSize(pageSize: number): boolean {
  return Number.isInteger(pageSize) && pageSize >= MIN_PAGE_SIZE && pageSize <= MAX_PAGE_SIZE;
}

/**
 * Check if a cursor is valid (positive timestamp)
 */
export function isValidCursor(cursor: number | undefined): boolean {
  if (cursor === undefined) return true;
  return Number.isFinite(cursor) && cursor > 0;
}

/**
 * Filter logs by cursor (return logs with timestamp less than cursor)
 */
export function filterByCursor<T extends { _creationTime: number }>(
  logs: T[],
  cursor: number | undefined
): T[] {
  if (cursor === undefined) return logs;
  return logs.filter((log) => log._creationTime < cursor);
}

/**
 * Get the next cursor from a page of logs
 */
export function getNextCursor<T extends { _creationTime: number }>(
  logs: T[],
  hasMore: boolean
): number | undefined {
  if (!hasMore || logs.length === 0) return undefined;
  return logs[logs.length - 1]._creationTime;
}

/**
 * Build a paginated result from logs
 */
export function buildPaginatedResult<T extends { _creationTime: number }>(
  allLogs: T[],
  cursor: number | undefined,
  pageSize: number
): PaginatedResult<T> {
  const filteredLogs = filterByCursor(allLogs, cursor);
  const pageLogs = filteredLogs.slice(0, pageSize);
  const hasMore = filteredLogs.length > pageSize;
  const nextCursor = getNextCursor(pageLogs, hasMore);

  return {
    logs: pageLogs,
    nextCursor,
    hasMore,
    pageSize,
    totalFetched: pageLogs.length,
  };
}

/**
 * Check if there are more pages available
 */
export function hasMorePages<T>(result: PaginatedResult<T>): boolean {
  return result.hasMore && result.nextCursor !== undefined;
}

/**
 * Get a display-friendly page info string
 */
export function getPageInfoString<T>(result: PaginatedResult<T>, currentPage: number): string {
  if (result.totalFetched === 0) {
    return 'No activity found';
  }
  const pageText = `Page ${currentPage}`;
  const moreText = result.hasMore ? ' (more available)' : ' (end)';
  return `${pageText}: ${result.totalFetched} items${moreText}`;
}

/**
 * Calculate the approximate total pages based on known data
 * Note: This is an estimate since we don't know total count without fetching all
 */
export function estimateTotalPages(totalKnown: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalKnown / pageSize));
}

/**
 * Merge multiple paginated results (for client-side caching)
 * Assumes results are in chronological order (newest first) and non-overlapping
 */
export function mergePaginatedResults<T extends { _creationTime: number }>(
  results: PaginatedResult<T>[]
): PaginatedResult<T> {
  if (results.length === 0) {
    return {
      logs: [],
      nextCursor: undefined,
      hasMore: false,
      pageSize: DEFAULT_PAGE_SIZE,
      totalFetched: 0,
    };
  }

  const allLogs: T[] = [];
  for (const result of results) {
    allLogs.push(...result.logs);
  }

  // Sort by creation time descending (newest first)
  allLogs.sort((a, b) => b._creationTime - a._creationTime);

  // Remove duplicates based on _creationTime (simple deduplication)
  const seen = new Set<number>();
  const dedupedLogs = allLogs.filter((log) => {
    if (seen.has(log._creationTime)) return false;
    seen.add(log._creationTime);
    return true;
  });

  // Use the last result's hasMore and pageSize
  const lastResult = results[results.length - 1];

  return {
    logs: dedupedLogs,
    nextCursor: lastResult.nextCursor,
    hasMore: lastResult.hasMore,
    pageSize: lastResult.pageSize,
    totalFetched: dedupedLogs.length,
  };
}
