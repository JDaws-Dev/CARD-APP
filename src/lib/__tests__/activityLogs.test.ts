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
  type ActivityLog,
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
