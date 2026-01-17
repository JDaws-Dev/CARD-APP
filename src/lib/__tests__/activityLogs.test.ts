import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  timestampToDateString,
  getTodayDateString,
  getYesterdayDateString,
  areConsecutiveDays,
  getStartOfDay,
  getEndOfDay,
  calculateStreak,
  summarizeActivityByDate,
  getCardAddDates,
  filterLogsByDateRange,
  getLastActivityOfType,
  countActionsByType,
  formatActionForDisplay,
  formatRelativeTime,
  getCardNameFromMetadata,
  getCardIdFromMetadata,
  hasCardMetadata,
  buildCardDisplayLabel,
  formatVariantForDisplay,
  formatActivityLogForDisplay,
  formatTradeLoggedForDisplay,
  getTradeSummaryFromMetadata,
  // Pagination utilities
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
  clampPageSize,
  isValidPageSize,
  isValidCursor,
  filterByCursor,
  getNextCursor,
  buildPaginatedResult,
  hasMorePages,
  getPageInfoString,
  estimateTotalPages,
  mergePaginatedResults,
  type ActivityLog,
  type PaginatedResult,
  type TradeLoggedMetadata,
} from '../activityLogs';

// ============================================================================
// DATE UTILITIES TESTS
// ============================================================================

describe('timestampToDateString', () => {
  it('should convert timestamp to YYYY-MM-DD format', () => {
    // Use a specific timestamp: Jan 15, 2026 12:00:00 UTC
    const timestamp = Date.UTC(2026, 0, 15, 12, 0, 0);
    expect(timestampToDateString(timestamp)).toBe('2026-01-15');
  });

  it('should handle midnight timestamps', () => {
    const timestamp = Date.UTC(2026, 0, 15, 0, 0, 0);
    expect(timestampToDateString(timestamp)).toBe('2026-01-15');
  });

  it('should handle end of day timestamps', () => {
    const timestamp = Date.UTC(2026, 0, 15, 23, 59, 59);
    expect(timestampToDateString(timestamp)).toBe('2026-01-15');
  });
});

describe('getTodayDateString', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return today date string', () => {
    vi.setSystemTime(new Date('2026-01-15T10:00:00Z'));
    expect(getTodayDateString()).toBe('2026-01-15');
  });
});

describe('getYesterdayDateString', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return yesterday date string', () => {
    vi.setSystemTime(new Date('2026-01-15T10:00:00Z'));
    expect(getYesterdayDateString()).toBe('2026-01-14');
  });
});

describe('areConsecutiveDays', () => {
  it('should return true for consecutive days', () => {
    expect(areConsecutiveDays('2026-01-14', '2026-01-15')).toBe(true);
    expect(areConsecutiveDays('2026-01-15', '2026-01-14')).toBe(true);
  });

  it('should return false for same day', () => {
    expect(areConsecutiveDays('2026-01-15', '2026-01-15')).toBe(false);
  });

  it('should return false for non-consecutive days', () => {
    expect(areConsecutiveDays('2026-01-13', '2026-01-15')).toBe(false);
    expect(areConsecutiveDays('2026-01-10', '2026-01-15')).toBe(false);
  });

  it('should handle month boundaries', () => {
    expect(areConsecutiveDays('2026-01-31', '2026-02-01')).toBe(true);
    expect(areConsecutiveDays('2026-02-28', '2026-03-01')).toBe(true);
  });

  it('should handle year boundaries', () => {
    expect(areConsecutiveDays('2025-12-31', '2026-01-01')).toBe(true);
  });
});

describe('getStartOfDay', () => {
  it('should return midnight UTC of the day', () => {
    const timestamp = Date.UTC(2026, 0, 15, 14, 30, 45);
    const startOfDay = getStartOfDay(timestamp);
    const date = new Date(startOfDay);

    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
    expect(date.getUTCSeconds()).toBe(0);
    expect(date.getUTCMilliseconds()).toBe(0);
    expect(date.getUTCDate()).toBe(15);
  });
});

describe('getEndOfDay', () => {
  it('should return end of day UTC', () => {
    const timestamp = Date.UTC(2026, 0, 15, 14, 30, 45);
    const endOfDay = getEndOfDay(timestamp);
    const date = new Date(endOfDay);

    expect(date.getUTCHours()).toBe(23);
    expect(date.getUTCMinutes()).toBe(59);
    expect(date.getUTCSeconds()).toBe(59);
    expect(date.getUTCMilliseconds()).toBe(999);
    expect(date.getUTCDate()).toBe(15);
  });
});

// ============================================================================
// STREAK CALCULATION TESTS
// ============================================================================

describe('calculateStreak', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return zero streaks for empty array', () => {
    const result = calculateStreak([]);
    expect(result).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      isActiveToday: false,
      lastActiveDate: null,
    });
  });

  it('should calculate streak of 1 for today only', () => {
    const result = calculateStreak(['2026-01-15']);
    expect(result).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      isActiveToday: true,
      lastActiveDate: '2026-01-15',
    });
  });

  it('should calculate streak of 1 for yesterday only', () => {
    const result = calculateStreak(['2026-01-14']);
    expect(result).toEqual({
      currentStreak: 1,
      longestStreak: 1,
      isActiveToday: false,
      lastActiveDate: '2026-01-14',
    });
  });

  it('should calculate current streak for consecutive days including today', () => {
    const result = calculateStreak(['2026-01-13', '2026-01-14', '2026-01-15']);
    expect(result).toEqual({
      currentStreak: 3,
      longestStreak: 3,
      isActiveToday: true,
      lastActiveDate: '2026-01-15',
    });
  });

  it('should calculate current streak for consecutive days including yesterday', () => {
    const result = calculateStreak(['2026-01-12', '2026-01-13', '2026-01-14']);
    expect(result).toEqual({
      currentStreak: 3,
      longestStreak: 3,
      isActiveToday: false,
      lastActiveDate: '2026-01-14',
    });
  });

  it('should reset current streak if gap before today', () => {
    // Activity on 11, 12, 13, then gap on 14, then today on 15
    const result = calculateStreak(['2026-01-11', '2026-01-12', '2026-01-13', '2026-01-15']);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(3);
    expect(result.isActiveToday).toBe(true);
  });

  it('should track longest streak separately from current', () => {
    // Old streak of 5, gap, then current streak of 2
    const result = calculateStreak([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
      '2026-01-05',
      '2026-01-14',
      '2026-01-15',
    ]);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(5);
  });

  it('should handle unsorted input dates', () => {
    const result = calculateStreak(['2026-01-15', '2026-01-13', '2026-01-14']);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('should return 0 current streak if last activity was 2+ days ago', () => {
    const result = calculateStreak(['2026-01-10', '2026-01-11', '2026-01-12']);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(3);
    expect(result.lastActiveDate).toBe('2026-01-12');
  });
});

// ============================================================================
// ACTIVITY SUMMARIZATION TESTS
// ============================================================================

describe('summarizeActivityByDate', () => {
  const createLog = (
    action: 'card_added' | 'card_removed' | 'achievement_earned',
    timestamp: number
  ): ActivityLog => ({
    profileId: 'profile1',
    action,
    _creationTime: timestamp,
  });

  it('should return empty array for no logs', () => {
    expect(summarizeActivityByDate([])).toEqual([]);
  });

  it('should summarize single day activity', () => {
    const logs = [
      createLog('card_added', Date.UTC(2026, 0, 15, 10, 0, 0)),
      createLog('card_added', Date.UTC(2026, 0, 15, 11, 0, 0)),
      createLog('card_removed', Date.UTC(2026, 0, 15, 12, 0, 0)),
    ];

    const result = summarizeActivityByDate(logs);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      date: '2026-01-15',
      cardsAdded: 2,
      cardsRemoved: 1,
      achievementsEarned: 0,
      totalActions: 3,
    });
  });

  it('should summarize multiple days', () => {
    const logs = [
      createLog('card_added', Date.UTC(2026, 0, 15, 10, 0, 0)),
      createLog('card_added', Date.UTC(2026, 0, 14, 10, 0, 0)),
      createLog('achievement_earned', Date.UTC(2026, 0, 14, 11, 0, 0)),
    ];

    const result = summarizeActivityByDate(logs);
    expect(result).toHaveLength(2);

    // Should be sorted descending (most recent first)
    expect(result[0].date).toBe('2026-01-15');
    expect(result[1].date).toBe('2026-01-14');

    expect(result[0].cardsAdded).toBe(1);
    expect(result[1].cardsAdded).toBe(1);
    expect(result[1].achievementsEarned).toBe(1);
  });
});

describe('getCardAddDates', () => {
  const createLog = (
    action: 'card_added' | 'card_removed' | 'achievement_earned',
    timestamp: number
  ): ActivityLog => ({
    profileId: 'profile1',
    action,
    _creationTime: timestamp,
  });

  it('should return empty array for no logs', () => {
    expect(getCardAddDates([])).toEqual([]);
  });

  it('should return only dates with card_added actions', () => {
    const logs = [
      createLog('card_added', Date.UTC(2026, 0, 15, 10, 0, 0)),
      createLog('card_removed', Date.UTC(2026, 0, 14, 10, 0, 0)),
      createLog('card_added', Date.UTC(2026, 0, 13, 10, 0, 0)),
    ];

    const result = getCardAddDates(logs);
    expect(result).toEqual(['2026-01-13', '2026-01-15']);
  });

  it('should return unique dates only', () => {
    const logs = [
      createLog('card_added', Date.UTC(2026, 0, 15, 10, 0, 0)),
      createLog('card_added', Date.UTC(2026, 0, 15, 11, 0, 0)),
      createLog('card_added', Date.UTC(2026, 0, 15, 12, 0, 0)),
    ];

    const result = getCardAddDates(logs);
    expect(result).toEqual(['2026-01-15']);
  });
});

describe('filterLogsByDateRange', () => {
  const createLog = (timestamp: number): ActivityLog => ({
    profileId: 'profile1',
    action: 'card_added',
    _creationTime: timestamp,
  });

  it('should filter logs within range', () => {
    const logs = [
      createLog(Date.UTC(2026, 0, 10)),
      createLog(Date.UTC(2026, 0, 15)),
      createLog(Date.UTC(2026, 0, 20)),
    ];

    const start = Date.UTC(2026, 0, 12);
    const end = Date.UTC(2026, 0, 18);

    const result = filterLogsByDateRange(logs, start, end);
    expect(result).toHaveLength(1);
    expect(timestampToDateString(result[0]._creationTime)).toBe('2026-01-15');
  });

  it('should include logs on boundary dates', () => {
    const logs = [createLog(Date.UTC(2026, 0, 15, 12, 0, 0))];

    const start = Date.UTC(2026, 0, 15, 0, 0, 0);
    const end = Date.UTC(2026, 0, 15, 23, 59, 59);

    const result = filterLogsByDateRange(logs, start, end);
    expect(result).toHaveLength(1);
  });
});

describe('getLastActivityOfType', () => {
  const createLog = (
    action: 'card_added' | 'card_removed' | 'achievement_earned',
    timestamp: number
  ): ActivityLog => ({
    profileId: 'profile1',
    action,
    _creationTime: timestamp,
  });

  it('should return null for no matching logs', () => {
    const logs = [createLog('card_removed', Date.UTC(2026, 0, 15))];
    expect(getLastActivityOfType(logs, 'card_added')).toBeNull();
  });

  it('should return null for empty logs', () => {
    expect(getLastActivityOfType([], 'card_added')).toBeNull();
  });

  it('should return the most recent activity of the given type', () => {
    const logs = [
      createLog('card_added', Date.UTC(2026, 0, 10)),
      createLog('card_added', Date.UTC(2026, 0, 15)),
      createLog('card_added', Date.UTC(2026, 0, 12)),
      createLog('card_removed', Date.UTC(2026, 0, 20)),
    ];

    const result = getLastActivityOfType(logs, 'card_added');
    expect(result).not.toBeNull();
    expect(timestampToDateString(result!._creationTime)).toBe('2026-01-15');
  });
});

describe('countActionsByType', () => {
  const createLog = (
    action: 'card_added' | 'card_removed' | 'achievement_earned'
  ): ActivityLog => ({
    profileId: 'profile1',
    action,
    _creationTime: Date.now(),
  });

  it('should return zero counts for empty logs', () => {
    expect(countActionsByType([])).toEqual({
      card_added: 0,
      card_removed: 0,
      achievement_earned: 0,
      trade_completed: 0,
      trade_logged: 0,
    });
  });

  it('should count actions by type', () => {
    const logs = [
      createLog('card_added'),
      createLog('card_added'),
      createLog('card_added'),
      createLog('card_removed'),
      createLog('achievement_earned'),
      createLog('achievement_earned'),
    ];

    expect(countActionsByType(logs)).toEqual({
      card_added: 3,
      card_removed: 1,
      achievement_earned: 2,
      trade_completed: 0,
      trade_logged: 0,
    });
  });
});

// ============================================================================
// FORMATTING TESTS
// ============================================================================

describe('formatActionForDisplay', () => {
  it('should format card_added', () => {
    expect(formatActionForDisplay('card_added')).toBe('Added card');
  });

  it('should format card_removed', () => {
    expect(formatActionForDisplay('card_removed')).toBe('Removed card');
  });

  it('should format achievement_earned', () => {
    expect(formatActionForDisplay('achievement_earned')).toBe('Earned achievement');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format just now (under 60 seconds)', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 30 * 1000)).toBe('just now');
  });

  it('should format minutes', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 60 * 1000)).toBe('1 minute ago');
    expect(formatRelativeTime(now - 5 * 60 * 1000)).toBe('5 minutes ago');
  });

  it('should format hours', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 60 * 60 * 1000)).toBe('1 hour ago');
    expect(formatRelativeTime(now - 3 * 60 * 60 * 1000)).toBe('3 hours ago');
  });

  it('should format yesterday', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 24 * 60 * 60 * 1000)).toBe('yesterday');
  });

  it('should format days', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 2 * 24 * 60 * 60 * 1000)).toBe('2 days ago');
    expect(formatRelativeTime(now - 5 * 24 * 60 * 60 * 1000)).toBe('5 days ago');
  });

  it('should format weeks', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 7 * 24 * 60 * 60 * 1000)).toBe('1 week ago');
    expect(formatRelativeTime(now - 14 * 24 * 60 * 60 * 1000)).toBe('2 weeks ago');
  });

  it('should format months', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 30 * 24 * 60 * 60 * 1000)).toBe('1 month ago');
    expect(formatRelativeTime(now - 60 * 24 * 60 * 60 * 1000)).toBe('2 months ago');
  });
});

// ============================================================================
// CARD NAME EXTRACTION TESTS
// ============================================================================

describe('getCardNameFromMetadata', () => {
  it('should return null for undefined metadata', () => {
    expect(getCardNameFromMetadata(undefined)).toBeNull();
  });

  it('should return null for empty metadata', () => {
    expect(getCardNameFromMetadata({})).toBeNull();
  });

  it('should return cardName when present', () => {
    expect(getCardNameFromMetadata({ cardName: 'Pikachu', cardId: 'sv1-25' })).toBe('Pikachu');
  });

  it('should fall back to cardId when cardName is missing', () => {
    expect(getCardNameFromMetadata({ cardId: 'sv1-25' })).toBe('sv1-25');
  });

  it('should prefer cardName over cardId', () => {
    expect(getCardNameFromMetadata({ cardName: 'Charizard', cardId: 'sv1-100' })).toBe('Charizard');
  });

  it('should return null when neither cardName nor cardId is present', () => {
    expect(getCardNameFromMetadata({ variant: 'holofoil' })).toBeNull();
  });
});

describe('getCardIdFromMetadata', () => {
  it('should return null for undefined metadata', () => {
    expect(getCardIdFromMetadata(undefined)).toBeNull();
  });

  it('should return null for empty metadata', () => {
    expect(getCardIdFromMetadata({})).toBeNull();
  });

  it('should return cardId when present', () => {
    expect(getCardIdFromMetadata({ cardId: 'sv1-25', cardName: 'Pikachu' })).toBe('sv1-25');
  });

  it('should return null when cardId is missing', () => {
    expect(getCardIdFromMetadata({ cardName: 'Pikachu' })).toBeNull();
  });
});

describe('hasCardMetadata', () => {
  it('should return false for undefined metadata', () => {
    expect(hasCardMetadata(undefined)).toBe(false);
  });

  it('should return false for empty metadata', () => {
    expect(hasCardMetadata({})).toBe(false);
  });

  it('should return true when cardId is present', () => {
    expect(hasCardMetadata({ cardId: 'sv1-25' })).toBe(true);
  });

  it('should return false when cardId is not a string', () => {
    expect(hasCardMetadata({ cardId: 123 })).toBe(false);
  });

  it('should return false when only cardName is present', () => {
    expect(hasCardMetadata({ cardName: 'Pikachu' })).toBe(false);
  });
});

describe('formatVariantForDisplay', () => {
  it('should format normal variant', () => {
    expect(formatVariantForDisplay('normal')).toBe('Normal');
  });

  it('should format holofoil variant', () => {
    expect(formatVariantForDisplay('holofoil')).toBe('Holofoil');
  });

  it('should format reverseHolofoil variant', () => {
    expect(formatVariantForDisplay('reverseHolofoil')).toBe('Reverse Holofoil');
  });

  it('should format 1stEditionHolofoil variant', () => {
    expect(formatVariantForDisplay('1stEditionHolofoil')).toBe('1st Edition Holofoil');
  });

  it('should format 1stEditionNormal variant', () => {
    expect(formatVariantForDisplay('1stEditionNormal')).toBe('1st Edition Normal');
  });

  it('should handle unknown variants with camelCase conversion', () => {
    expect(formatVariantForDisplay('someNewVariant')).toBe('Some New Variant');
  });
});

describe('buildCardDisplayLabel', () => {
  it('should return "Unknown card" for undefined metadata', () => {
    expect(buildCardDisplayLabel(undefined)).toBe('Unknown card');
  });

  it('should return "Unknown card" for empty metadata', () => {
    expect(buildCardDisplayLabel({})).toBe('Unknown card');
  });

  it('should return card name only for normal variant with quantity 1', () => {
    expect(buildCardDisplayLabel({ cardName: 'Pikachu', variant: 'normal', quantity: 1 })).toBe(
      'Pikachu'
    );
  });

  it('should include variant for non-normal variants', () => {
    expect(buildCardDisplayLabel({ cardName: 'Charizard', variant: 'holofoil', quantity: 1 })).toBe(
      'Charizard (Holofoil)'
    );
  });

  it('should include quantity when greater than 1', () => {
    expect(buildCardDisplayLabel({ cardName: 'Bulbasaur', variant: 'normal', quantity: 3 })).toBe(
      'Bulbasaur x3'
    );
  });

  it('should include both variant and quantity', () => {
    expect(
      buildCardDisplayLabel({ cardName: 'Mewtwo', variant: 'reverseHolofoil', quantity: 2 })
    ).toBe('Mewtwo (Reverse Holofoil) x2');
  });

  it('should use cardId as fallback when cardName is missing', () => {
    expect(buildCardDisplayLabel({ cardId: 'sv1-25', variant: 'holofoil' })).toBe(
      'sv1-25 (Holofoil)'
    );
  });

  it('should handle missing variant (defaults to not showing it)', () => {
    expect(buildCardDisplayLabel({ cardName: 'Squirtle' })).toBe('Squirtle');
  });

  it('should handle missing quantity (defaults to not showing it)', () => {
    expect(buildCardDisplayLabel({ cardName: 'Charmander', variant: 'holofoil' })).toBe(
      'Charmander (Holofoil)'
    );
  });
});

describe('formatActivityLogForDisplay', () => {
  const createLog = (
    action: 'card_added' | 'card_removed' | 'achievement_earned',
    metadata?: Record<string, unknown>
  ): ActivityLog => ({
    profileId: 'profile1',
    action,
    metadata,
    _creationTime: Date.now(),
  });

  describe('card_added action', () => {
    it('should format card_added with name and variant', () => {
      const log = createLog('card_added', {
        cardName: 'Pikachu',
        variant: 'holofoil',
        quantity: 1,
      });
      expect(formatActivityLogForDisplay(log)).toBe('Added card: Pikachu (Holofoil)');
    });

    it('should format card_added with quantity', () => {
      const log = createLog('card_added', {
        cardName: 'Bulbasaur',
        variant: 'normal',
        quantity: 3,
      });
      expect(formatActivityLogForDisplay(log)).toBe('Added card: Bulbasaur x3');
    });

    it('should handle missing metadata', () => {
      const log = createLog('card_added', undefined);
      expect(formatActivityLogForDisplay(log)).toBe('Added card: Unknown card');
    });
  });

  describe('card_removed action', () => {
    it('should format card_removed with name', () => {
      const log = createLog('card_removed', { cardName: 'Charizard', cardId: 'sv1-100' });
      expect(formatActivityLogForDisplay(log)).toBe('Removed card: Charizard');
    });

    it('should format card_removed with variant', () => {
      const log = createLog('card_removed', { cardName: 'Mewtwo', variant: 'holofoil' });
      expect(formatActivityLogForDisplay(log)).toBe('Removed card: Mewtwo (Holofoil)');
    });

    it('should format card_removed with multiple variants removed', () => {
      const log = createLog('card_removed', { cardName: 'Squirtle', variantsRemoved: 3 });
      expect(formatActivityLogForDisplay(log)).toBe('Removed card: Squirtle (3 variants)');
    });

    it('should handle missing metadata', () => {
      const log = createLog('card_removed', undefined);
      expect(formatActivityLogForDisplay(log)).toBe('Removed card: Unknown');
    });
  });

  describe('achievement_earned action', () => {
    it('should format achievement_earned with key', () => {
      const log = createLog('achievement_earned', {
        achievementKey: 'sv1_100',
        achievementType: 'set_completion',
      });
      expect(formatActivityLogForDisplay(log)).toBe('Earned achievement: sv1_100');
    });

    it('should handle missing metadata', () => {
      const log = createLog('achievement_earned', undefined);
      expect(formatActivityLogForDisplay(log)).toBe('Earned achievement: Unknown achievement');
    });
  });
});

// ============================================================================
// PAGINATION UTILITIES TESTS
// ============================================================================

describe('Pagination Constants', () => {
  it('should have correct default page size', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(50);
  });

  it('should have correct max page size', () => {
    expect(MAX_PAGE_SIZE).toBe(100);
  });

  it('should have correct min page size', () => {
    expect(MIN_PAGE_SIZE).toBe(1);
  });
});

describe('clampPageSize', () => {
  it('should return default page size for undefined', () => {
    expect(clampPageSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('should clamp to min page size', () => {
    expect(clampPageSize(0)).toBe(MIN_PAGE_SIZE);
    expect(clampPageSize(-5)).toBe(MIN_PAGE_SIZE);
  });

  it('should clamp to max page size', () => {
    expect(clampPageSize(150)).toBe(MAX_PAGE_SIZE);
    expect(clampPageSize(1000)).toBe(MAX_PAGE_SIZE);
  });

  it('should return valid page sizes unchanged', () => {
    expect(clampPageSize(1)).toBe(1);
    expect(clampPageSize(50)).toBe(50);
    expect(clampPageSize(100)).toBe(100);
    expect(clampPageSize(25)).toBe(25);
  });
});

describe('isValidPageSize', () => {
  it('should return true for valid page sizes', () => {
    expect(isValidPageSize(1)).toBe(true);
    expect(isValidPageSize(50)).toBe(true);
    expect(isValidPageSize(100)).toBe(true);
  });

  it('should return false for page sizes below min', () => {
    expect(isValidPageSize(0)).toBe(false);
    expect(isValidPageSize(-1)).toBe(false);
  });

  it('should return false for page sizes above max', () => {
    expect(isValidPageSize(101)).toBe(false);
    expect(isValidPageSize(1000)).toBe(false);
  });

  it('should return false for non-integer values', () => {
    expect(isValidPageSize(10.5)).toBe(false);
    expect(isValidPageSize(50.1)).toBe(false);
  });
});

describe('isValidCursor', () => {
  it('should return true for undefined cursor', () => {
    expect(isValidCursor(undefined)).toBe(true);
  });

  it('should return true for positive timestamps', () => {
    expect(isValidCursor(1000)).toBe(true);
    expect(isValidCursor(Date.now())).toBe(true);
  });

  it('should return false for zero or negative values', () => {
    expect(isValidCursor(0)).toBe(false);
    expect(isValidCursor(-1000)).toBe(false);
  });

  it('should return false for non-finite values', () => {
    expect(isValidCursor(Infinity)).toBe(false);
    expect(isValidCursor(NaN)).toBe(false);
  });
});

describe('filterByCursor', () => {
  const createLogWithTime = (time: number): { _creationTime: number } => ({
    _creationTime: time,
  });

  it('should return all logs when cursor is undefined', () => {
    const logs = [createLogWithTime(1000), createLogWithTime(2000), createLogWithTime(3000)];
    expect(filterByCursor(logs, undefined)).toEqual(logs);
  });

  it('should filter logs older than cursor', () => {
    const logs = [createLogWithTime(1000), createLogWithTime(2000), createLogWithTime(3000)];
    const result = filterByCursor(logs, 2500);
    expect(result).toEqual([createLogWithTime(1000), createLogWithTime(2000)]);
  });

  it('should return empty array when all logs are newer than cursor', () => {
    const logs = [createLogWithTime(3000), createLogWithTime(4000)];
    const result = filterByCursor(logs, 2000);
    expect(result).toEqual([]);
  });

  it('should exclude logs with exact cursor timestamp', () => {
    const logs = [createLogWithTime(1000), createLogWithTime(2000)];
    const result = filterByCursor(logs, 2000);
    expect(result).toEqual([createLogWithTime(1000)]);
  });
});

describe('getNextCursor', () => {
  const createLogWithTime = (time: number): { _creationTime: number } => ({
    _creationTime: time,
  });

  it('should return undefined when hasMore is false', () => {
    const logs = [createLogWithTime(1000)];
    expect(getNextCursor(logs, false)).toBeUndefined();
  });

  it('should return undefined for empty logs', () => {
    expect(getNextCursor([], true)).toBeUndefined();
  });

  it('should return last log timestamp when hasMore is true', () => {
    const logs = [createLogWithTime(3000), createLogWithTime(2000), createLogWithTime(1000)];
    expect(getNextCursor(logs, true)).toBe(1000);
  });
});

describe('buildPaginatedResult', () => {
  const createLogWithTime = (time: number): { _creationTime: number } => ({
    _creationTime: time,
  });

  it('should build correct result for first page with more data', () => {
    const logs = [
      createLogWithTime(5000),
      createLogWithTime(4000),
      createLogWithTime(3000),
      createLogWithTime(2000),
      createLogWithTime(1000),
    ];
    const result = buildPaginatedResult(logs, undefined, 3);

    expect(result.logs.length).toBe(3);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe(3000);
    expect(result.pageSize).toBe(3);
    expect(result.totalFetched).toBe(3);
  });

  it('should build correct result for last page', () => {
    const logs = [createLogWithTime(2000), createLogWithTime(1000)];
    const result = buildPaginatedResult(logs, undefined, 5);

    expect(result.logs.length).toBe(2);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
    expect(result.totalFetched).toBe(2);
  });

  it('should apply cursor correctly', () => {
    const logs = [
      createLogWithTime(5000),
      createLogWithTime(4000),
      createLogWithTime(3000),
      createLogWithTime(2000),
      createLogWithTime(1000),
    ];
    const result = buildPaginatedResult(logs, 4000, 2);

    expect(result.logs.length).toBe(2);
    expect(result.logs[0]._creationTime).toBe(3000);
    expect(result.logs[1]._creationTime).toBe(2000);
    expect(result.hasMore).toBe(true);
  });

  it('should handle empty logs', () => {
    const result = buildPaginatedResult([], undefined, 10);

    expect(result.logs).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
    expect(result.totalFetched).toBe(0);
  });
});

describe('hasMorePages', () => {
  it('should return true when hasMore and nextCursor exist', () => {
    const result: PaginatedResult<ActivityLog> = {
      logs: [],
      hasMore: true,
      nextCursor: 1000,
      pageSize: 50,
      totalFetched: 50,
    };
    expect(hasMorePages(result)).toBe(true);
  });

  it('should return false when hasMore is false', () => {
    const result: PaginatedResult<ActivityLog> = {
      logs: [],
      hasMore: false,
      nextCursor: 1000,
      pageSize: 50,
      totalFetched: 50,
    };
    expect(hasMorePages(result)).toBe(false);
  });

  it('should return false when nextCursor is undefined', () => {
    const result: PaginatedResult<ActivityLog> = {
      logs: [],
      hasMore: true,
      nextCursor: undefined,
      pageSize: 50,
      totalFetched: 50,
    };
    expect(hasMorePages(result)).toBe(false);
  });
});

describe('getPageInfoString', () => {
  it('should return "No activity found" for empty result', () => {
    const result: PaginatedResult<ActivityLog> = {
      logs: [],
      hasMore: false,
      nextCursor: undefined,
      pageSize: 50,
      totalFetched: 0,
    };
    expect(getPageInfoString(result, 1)).toBe('No activity found');
  });

  it('should show page info with more available', () => {
    const result: PaginatedResult<ActivityLog> = {
      logs: [],
      hasMore: true,
      nextCursor: 1000,
      pageSize: 50,
      totalFetched: 50,
    };
    expect(getPageInfoString(result, 1)).toBe('Page 1: 50 items (more available)');
  });

  it('should show page info at end', () => {
    const result: PaginatedResult<ActivityLog> = {
      logs: [],
      hasMore: false,
      nextCursor: undefined,
      pageSize: 50,
      totalFetched: 25,
    };
    expect(getPageInfoString(result, 3)).toBe('Page 3: 25 items (end)');
  });
});

describe('estimateTotalPages', () => {
  it('should calculate correct page count', () => {
    expect(estimateTotalPages(100, 50)).toBe(2);
    expect(estimateTotalPages(150, 50)).toBe(3);
    expect(estimateTotalPages(51, 50)).toBe(2);
  });

  it('should return at least 1 page', () => {
    expect(estimateTotalPages(0, 50)).toBe(1);
  });

  it('should handle single page', () => {
    expect(estimateTotalPages(25, 50)).toBe(1);
  });
});

describe('mergePaginatedResults', () => {
  const createLogWithTime = (time: number): { _creationTime: number; id: string } => ({
    _creationTime: time,
    id: `log-${time}`,
  });

  it('should return empty result for empty array', () => {
    const result = mergePaginatedResults([]);
    expect(result.logs).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
    expect(result.totalFetched).toBe(0);
  });

  it('should merge multiple results correctly', () => {
    const result1: PaginatedResult<{ _creationTime: number; id: string }> = {
      logs: [createLogWithTime(5000), createLogWithTime(4000)],
      hasMore: true,
      nextCursor: 4000,
      pageSize: 2,
      totalFetched: 2,
    };
    const result2: PaginatedResult<{ _creationTime: number; id: string }> = {
      logs: [createLogWithTime(3000), createLogWithTime(2000)],
      hasMore: false,
      nextCursor: undefined,
      pageSize: 2,
      totalFetched: 2,
    };

    const merged = mergePaginatedResults([result1, result2]);
    expect(merged.logs.length).toBe(4);
    expect(merged.logs[0]._creationTime).toBe(5000);
    expect(merged.logs[3]._creationTime).toBe(2000);
    expect(merged.hasMore).toBe(false); // Uses last result
    expect(merged.totalFetched).toBe(4);
  });

  it('should deduplicate logs with same timestamp', () => {
    const result1: PaginatedResult<{ _creationTime: number; id: string }> = {
      logs: [createLogWithTime(3000), createLogWithTime(2000)],
      hasMore: true,
      nextCursor: 2000,
      pageSize: 2,
      totalFetched: 2,
    };
    const result2: PaginatedResult<{ _creationTime: number; id: string }> = {
      logs: [createLogWithTime(2000), createLogWithTime(1000)], // 2000 is duplicate
      hasMore: false,
      nextCursor: undefined,
      pageSize: 2,
      totalFetched: 2,
    };

    const merged = mergePaginatedResults([result1, result2]);
    expect(merged.logs.length).toBe(3); // 3000, 2000, 1000 (deduplicated)
  });

  it('should sort logs by creation time descending', () => {
    const result1: PaginatedResult<{ _creationTime: number; id: string }> = {
      logs: [createLogWithTime(2000)],
      hasMore: true,
      nextCursor: 2000,
      pageSize: 1,
      totalFetched: 1,
    };
    const result2: PaginatedResult<{ _creationTime: number; id: string }> = {
      logs: [createLogWithTime(5000)],
      hasMore: false,
      nextCursor: undefined,
      pageSize: 1,
      totalFetched: 1,
    };

    const merged = mergePaginatedResults([result1, result2]);
    expect(merged.logs[0]._creationTime).toBe(5000);
    expect(merged.logs[1]._creationTime).toBe(2000);
  });
});

// ============================================================================
// PAGINATION INTEGRATION TESTS
// ============================================================================

describe('Pagination Integration', () => {
  it('should support iterating through multiple pages', () => {
    // Simulate 7 logs
    const allLogs = [
      { _creationTime: 7000 },
      { _creationTime: 6000 },
      { _creationTime: 5000 },
      { _creationTime: 4000 },
      { _creationTime: 3000 },
      { _creationTime: 2000 },
      { _creationTime: 1000 },
    ];

    // First page
    const page1 = buildPaginatedResult(allLogs, undefined, 3);
    expect(page1.logs.length).toBe(3);
    expect(page1.hasMore).toBe(true);
    expect(page1.logs[0]._creationTime).toBe(7000);
    expect(page1.logs[2]._creationTime).toBe(5000);

    // Second page
    const page2 = buildPaginatedResult(allLogs, page1.nextCursor, 3);
    expect(page2.logs.length).toBe(3);
    expect(page2.hasMore).toBe(true);
    expect(page2.logs[0]._creationTime).toBe(4000);
    expect(page2.logs[2]._creationTime).toBe(2000);

    // Third page (last)
    const page3 = buildPaginatedResult(allLogs, page2.nextCursor, 3);
    expect(page3.logs.length).toBe(1);
    expect(page3.hasMore).toBe(false);
    expect(page3.logs[0]._creationTime).toBe(1000);
  });

  it('should handle page size larger than available data', () => {
    const logs = [{ _creationTime: 2000 }, { _creationTime: 1000 }];

    const result = buildPaginatedResult(logs, undefined, 100);
    expect(result.logs.length).toBe(2);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
  });

  it('should handle cursor pointing to non-existent data', () => {
    const logs = [{ _creationTime: 5000 }, { _creationTime: 4000 }];

    // Cursor at 3000 means we want logs older than 3000, but all our logs are newer
    const result = buildPaginatedResult(logs, 3000, 10);
    expect(result.logs.length).toBe(0);
    expect(result.hasMore).toBe(false);
  });
});

// ============================================================================
// TRADE LOGGED FORMATTING TESTS (TRADE-004)
// ============================================================================

describe('formatActionForDisplay - trade actions', () => {
  it('should format trade_logged action', () => {
    expect(formatActionForDisplay('trade_logged')).toBe('Logged trade');
  });

  it('should format trade_completed action', () => {
    expect(formatActionForDisplay('trade_completed')).toBe('Completed trade');
  });
});

describe('countActionsByType - trade actions', () => {
  it('should count trade_logged and trade_completed actions', () => {
    const logs: ActivityLog[] = [
      { profileId: 'p1', action: 'card_added', _creationTime: 1000 },
      { profileId: 'p1', action: 'trade_logged', _creationTime: 2000 },
      { profileId: 'p1', action: 'trade_logged', _creationTime: 3000 },
      { profileId: 'p1', action: 'trade_completed', _creationTime: 4000 },
    ];

    const counts = countActionsByType(logs);
    expect(counts.card_added).toBe(1);
    expect(counts.trade_logged).toBe(2);
    expect(counts.trade_completed).toBe(1);
  });
});

describe('formatTradeLoggedForDisplay', () => {
  it('should return default text for undefined metadata', () => {
    expect(formatTradeLoggedForDisplay(undefined)).toBe('Logged trade');
  });

  it('should return default text for empty metadata', () => {
    const metadata: TradeLoggedMetadata = {
      cardsGiven: [],
      cardsReceived: [],
      totalCardsGiven: 0,
      totalCardsReceived: 0,
    };
    expect(formatTradeLoggedForDisplay(metadata)).toBe('Logged trade');
  });

  it('should format trade with cards given and received', () => {
    const metadata: TradeLoggedMetadata = {
      cardsGiven: [{ cardId: 'card1', cardName: 'Pikachu', quantity: 1, variant: 'normal' }],
      cardsReceived: [{ cardId: 'card2', cardName: 'Charizard', quantity: 1, variant: 'holofoil' }],
      totalCardsGiven: 1,
      totalCardsReceived: 1,
    };
    expect(formatTradeLoggedForDisplay(metadata)).toBe('Traded Pikachu for Charizard');
  });

  it('should format trade with multiple cards given and received', () => {
    const metadata: TradeLoggedMetadata = {
      cardsGiven: [
        { cardId: 'card1', cardName: 'Pikachu', quantity: 2, variant: 'normal' },
        { cardId: 'card2', cardName: 'Bulbasaur', quantity: 1, variant: 'normal' },
      ],
      cardsReceived: [{ cardId: 'card3', cardName: 'Charizard', quantity: 1, variant: 'holofoil' }],
      totalCardsGiven: 3,
      totalCardsReceived: 1,
    };
    expect(formatTradeLoggedForDisplay(metadata)).toBe(
      'Traded 2x Pikachu, Bulbasaur for Charizard'
    );
  });

  it('should format trade with only cards given', () => {
    const metadata: TradeLoggedMetadata = {
      cardsGiven: [{ cardId: 'card1', cardName: 'Pikachu', quantity: 1, variant: 'normal' }],
      cardsReceived: [],
      totalCardsGiven: 1,
      totalCardsReceived: 0,
    };
    expect(formatTradeLoggedForDisplay(metadata)).toBe('Gave away Pikachu');
  });

  it('should format trade with only cards received', () => {
    const metadata: TradeLoggedMetadata = {
      cardsGiven: [],
      cardsReceived: [{ cardId: 'card1', cardName: 'Mewtwo', quantity: 1, variant: 'holofoil' }],
      totalCardsGiven: 0,
      totalCardsReceived: 1,
    };
    expect(formatTradeLoggedForDisplay(metadata)).toBe('Received Mewtwo');
  });

  it('should include trading partner if specified', () => {
    const metadata: TradeLoggedMetadata = {
      cardsGiven: [{ cardId: 'card1', cardName: 'Pikachu', quantity: 1, variant: 'normal' }],
      cardsReceived: [{ cardId: 'card2', cardName: 'Charizard', quantity: 1, variant: 'holofoil' }],
      tradingPartner: 'my brother',
      totalCardsGiven: 1,
      totalCardsReceived: 1,
    };
    expect(formatTradeLoggedForDisplay(metadata)).toBe(
      'Traded Pikachu for Charizard with my brother'
    );
  });

  it('should format quantities greater than 1', () => {
    const metadata: TradeLoggedMetadata = {
      cardsGiven: [{ cardId: 'card1', cardName: 'Pikachu', quantity: 3, variant: 'normal' }],
      cardsReceived: [{ cardId: 'card2', cardName: 'Charizard', quantity: 2, variant: 'holofoil' }],
      totalCardsGiven: 3,
      totalCardsReceived: 2,
    };
    expect(formatTradeLoggedForDisplay(metadata)).toBe('Traded 3x Pikachu for 2x Charizard');
  });
});

describe('getTradeSummaryFromMetadata', () => {
  it('should return null for undefined metadata', () => {
    expect(getTradeSummaryFromMetadata(undefined)).toBeNull();
  });

  it('should return pre-formatted tradeSummary if present', () => {
    const metadata = {
      tradeSummary: 'Custom trade summary',
      cardsGiven: [],
      cardsReceived: [],
    };
    expect(getTradeSummaryFromMetadata(metadata)).toBe('Custom trade summary');
  });

  it('should return null for metadata without trade data', () => {
    const metadata = { cardName: 'Pikachu' };
    expect(getTradeSummaryFromMetadata(metadata)).toBeNull();
  });

  it('should build summary from cards if tradeSummary is missing', () => {
    const metadata: TradeLoggedMetadata = {
      cardsGiven: [{ cardId: 'card1', cardName: 'Pikachu', quantity: 1, variant: 'normal' }],
      cardsReceived: [{ cardId: 'card2', cardName: 'Charizard', quantity: 1, variant: 'holofoil' }],
      totalCardsGiven: 1,
      totalCardsReceived: 1,
    };
    expect(getTradeSummaryFromMetadata(metadata as unknown as Record<string, unknown>)).toBe(
      'Traded Pikachu for Charizard'
    );
  });
});

describe('formatActivityLogForDisplay - trade_logged action', () => {
  const createTradeLog = (metadata?: TradeLoggedMetadata): ActivityLog => ({
    profileId: 'profile1',
    action: 'trade_logged',
    metadata: metadata as unknown as Record<string, unknown>,
    _creationTime: Date.now(),
  });

  it('should use tradeSummary from metadata if present', () => {
    const log = createTradeLog({
      cardsGiven: [{ cardId: 'c1', cardName: 'Pikachu', quantity: 1, variant: 'normal' }],
      cardsReceived: [{ cardId: 'c2', cardName: 'Charizard', quantity: 1, variant: 'holofoil' }],
      tradeSummary: 'Traded Pikachu for Charizard with my friend',
      totalCardsGiven: 1,
      totalCardsReceived: 1,
    });
    expect(formatActivityLogForDisplay(log)).toBe('Traded Pikachu for Charizard with my friend');
  });

  it('should build summary from cards if tradeSummary is missing', () => {
    const log = createTradeLog({
      cardsGiven: [{ cardId: 'c1', cardName: 'Pikachu', quantity: 1, variant: 'normal' }],
      cardsReceived: [{ cardId: 'c2', cardName: 'Charizard', quantity: 1, variant: 'holofoil' }],
      totalCardsGiven: 1,
      totalCardsReceived: 1,
    });
    expect(formatActivityLogForDisplay(log)).toBe('Traded Pikachu for Charizard');
  });

  it('should handle trade_logged with undefined metadata', () => {
    const log: ActivityLog = {
      profileId: 'profile1',
      action: 'trade_logged',
      _creationTime: Date.now(),
    };
    expect(formatActivityLogForDisplay(log)).toBe('Logged trade');
  });
});

describe('formatActivityLogForDisplay - trade_completed action', () => {
  it('should format trade_completed action', () => {
    const log: ActivityLog = {
      profileId: 'profile1',
      action: 'trade_completed',
      _creationTime: Date.now(),
    };
    expect(formatActivityLogForDisplay(log)).toBe('Completed trade');
  });
});
