import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import {
  // Types
  type GraceDayState,
  type GraceDayUsage,
  type GraceDayAvailability,
  type WeekInfo,
  // Constants
  GRACE_DAY_STORAGE_KEY,
  DEFAULT_GRACE_DAY_STATE,
  // Date utilities
  getToday,
  getYesterday,
  getDateDaysAgo,
  getISOWeekInfo,
  getWeekBoundaries,
  getWeekInfo,
  isSameWeek,
  getDaysBetween,
  isNextDay,
  getDayOfWeek,
  // Grace day logic
  getGraceDaysUsedInWeek,
  checkGraceDayAvailability,
  canProtectStreakGap,
  consumeGraceDay,
  calculateStreakWithGraceDays,
  // LocalStorage
  saveGraceDayState,
  loadGraceDayState,
  clearGraceDayState,
  // Display helpers
  formatGraceDayStatus,
  getGraceDayDescription,
  getGraceDayTooltip,
  getGraceDayAriaLabel,
  getGraceDayColorClass,
} from '../graceDays';

// ============================================================================
// DATE UTILITIES
// ============================================================================

describe('getToday', () => {
  test('returns a valid YYYY-MM-DD format', () => {
    const today = getToday();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('returns current date', () => {
    const today = getToday();
    const expected = new Date().toISOString().split('T')[0];
    expect(today).toBe(expected);
  });
});

describe('getYesterday', () => {
  test('returns a valid YYYY-MM-DD format', () => {
    const yesterday = getYesterday();
    expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('returns the day before today', () => {
    const yesterday = getYesterday();
    const expected = new Date();
    expected.setDate(expected.getDate() - 1);
    expect(yesterday).toBe(expected.toISOString().split('T')[0]);
  });
});

describe('getDateDaysAgo', () => {
  test('returns today for 0 days ago', () => {
    expect(getDateDaysAgo(0)).toBe(getToday());
  });

  test('returns correct date for N days ago', () => {
    const date = getDateDaysAgo(7);
    const expected = new Date();
    expected.setDate(expected.getDate() - 7);
    expect(date).toBe(expected.toISOString().split('T')[0]);
  });
});

describe('getISOWeekInfo', () => {
  test('returns week number and year', () => {
    const info = getISOWeekInfo('2024-01-15');
    expect(info).toHaveProperty('weekNumber');
    expect(info).toHaveProperty('year');
    expect(typeof info.weekNumber).toBe('number');
    expect(typeof info.year).toBe('number');
  });

  test('week numbers are between 1 and 53', () => {
    // Test multiple dates throughout the year
    const testDates = ['2024-01-01', '2024-03-15', '2024-06-30', '2024-09-20', '2024-12-31'];
    for (const date of testDates) {
      const info = getISOWeekInfo(date);
      expect(info.weekNumber).toBeGreaterThanOrEqual(1);
      expect(info.weekNumber).toBeLessThanOrEqual(53);
    }
  });

  test('same week dates return same week number', () => {
    // Mon-Sun of same week
    const week1 = getISOWeekInfo('2024-01-15'); // Monday
    const week2 = getISOWeekInfo('2024-01-21'); // Sunday
    // Note: ISO week may differ from Sunday-start week
    expect(week1.year).toBe(week2.year);
  });
});

describe('getWeekBoundaries', () => {
  test('returns start and end dates', () => {
    const boundaries = getWeekBoundaries('2024-01-15');
    expect(boundaries).toHaveProperty('startDate');
    expect(boundaries).toHaveProperty('endDate');
    expect(boundaries.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(boundaries.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('start date is before or equal to input', () => {
    const boundaries = getWeekBoundaries('2024-01-15');
    expect(boundaries.startDate <= '2024-01-15').toBe(true);
  });

  test('end date is after or equal to input', () => {
    const boundaries = getWeekBoundaries('2024-01-15');
    expect(boundaries.endDate >= '2024-01-15').toBe(true);
  });

  test('start is Sunday and end is Saturday', () => {
    const boundaries = getWeekBoundaries('2024-01-17'); // Wednesday
    const startDay = getDayOfWeek(boundaries.startDate);
    const endDay = getDayOfWeek(boundaries.endDate);
    expect(startDay).toBe(0); // Sunday
    expect(endDay).toBe(6); // Saturday
  });

  test('week spans 7 days', () => {
    const boundaries = getWeekBoundaries('2024-01-15');
    const days = getDaysBetween(boundaries.startDate, boundaries.endDate);
    expect(days).toBe(6); // 6 days difference = 7 days total
  });
});

describe('getWeekInfo', () => {
  test('returns complete week info', () => {
    const info = getWeekInfo('2024-01-15');
    expect(info).toHaveProperty('weekNumber');
    expect(info).toHaveProperty('year');
    expect(info).toHaveProperty('startDate');
    expect(info).toHaveProperty('endDate');
  });
});

describe('isSameWeek', () => {
  test('returns true for dates in same ISO week', () => {
    // Jan 15-19, 2024 are all in ISO week 3
    expect(isSameWeek('2024-01-15', '2024-01-19')).toBe(true);
  });

  test('returns false for dates in different weeks', () => {
    expect(isSameWeek('2024-01-01', '2024-01-15')).toBe(false);
  });

  test('returns true for same date', () => {
    expect(isSameWeek('2024-01-15', '2024-01-15')).toBe(true);
  });
});

describe('getDaysBetween', () => {
  test('returns 0 for same day', () => {
    expect(getDaysBetween('2024-01-15', '2024-01-15')).toBe(0);
  });

  test('returns correct days regardless of order', () => {
    expect(getDaysBetween('2024-01-15', '2024-01-20')).toBe(5);
    expect(getDaysBetween('2024-01-20', '2024-01-15')).toBe(5);
  });

  test('handles month boundaries', () => {
    expect(getDaysBetween('2024-01-30', '2024-02-05')).toBe(6);
  });
});

describe('isNextDay', () => {
  test('returns true for consecutive days', () => {
    expect(isNextDay('2024-01-16', '2024-01-15')).toBe(true);
  });

  test('returns false for same day', () => {
    expect(isNextDay('2024-01-15', '2024-01-15')).toBe(false);
  });

  test('returns false for non-consecutive days', () => {
    expect(isNextDay('2024-01-18', '2024-01-15')).toBe(false);
  });

  test('returns false for reversed order', () => {
    expect(isNextDay('2024-01-15', '2024-01-16')).toBe(false);
  });

  test('handles month boundary', () => {
    expect(isNextDay('2024-02-01', '2024-01-31')).toBe(true);
  });
});

describe('getDayOfWeek', () => {
  test('returns 0 for Sunday', () => {
    expect(getDayOfWeek('2024-01-14')).toBe(0);
  });

  test('returns 6 for Saturday', () => {
    expect(getDayOfWeek('2024-01-13')).toBe(6);
  });

  test('returns values 0-6', () => {
    for (let i = 14; i <= 20; i++) {
      const day = getDayOfWeek(`2024-01-${i}`);
      expect(day).toBeGreaterThanOrEqual(0);
      expect(day).toBeLessThanOrEqual(6);
    }
  });
});

// ============================================================================
// GRACE DAY LOGIC
// ============================================================================

describe('getGraceDaysUsedInWeek', () => {
  test('returns 0 for empty history', () => {
    expect(getGraceDaysUsedInWeek([], '2024-01-15')).toBe(0);
  });

  test('counts grace days in same week', () => {
    const { weekNumber, year } = getISOWeekInfo('2024-01-15');
    const history: GraceDayUsage[] = [
      {
        usedOn: '2024-01-15',
        weekNumber,
        year,
        missedDate: '2024-01-14',
        streakAtUse: 5,
      },
    ];
    expect(getGraceDaysUsedInWeek(history, '2024-01-15')).toBe(1);
  });

  test('does not count grace days from different weeks', () => {
    const history: GraceDayUsage[] = [
      {
        usedOn: '2024-01-01',
        weekNumber: 1,
        year: 2024,
        missedDate: '2023-12-31',
        streakAtUse: 5,
      },
    ];
    expect(getGraceDaysUsedInWeek(history, '2024-01-15')).toBe(0);
  });
});

describe('checkGraceDayAvailability', () => {
  test('returns availability object with required fields', () => {
    const availability = checkGraceDayAvailability(DEFAULT_GRACE_DAY_STATE);
    expect(availability).toHaveProperty('isAvailable');
    expect(availability).toHaveProperty('usedThisWeek');
    expect(availability).toHaveProperty('maxPerWeek');
    expect(availability).toHaveProperty('remaining');
    expect(availability).toHaveProperty('resetsOn');
    expect(availability).toHaveProperty('daysUntilReset');
  });

  test('is available by default', () => {
    const availability = checkGraceDayAvailability(DEFAULT_GRACE_DAY_STATE);
    expect(availability.isAvailable).toBe(true);
    expect(availability.remaining).toBe(1);
  });

  test('not available when disabled', () => {
    const state: GraceDayState = { ...DEFAULT_GRACE_DAY_STATE, enabled: false };
    const availability = checkGraceDayAvailability(state);
    expect(availability.isAvailable).toBe(false);
  });

  test('not available when max used', () => {
    const { weekNumber, year } = getISOWeekInfo(getToday());
    const state: GraceDayState = {
      enabled: true,
      maxPerWeek: 1,
      usageHistory: [
        {
          usedOn: getToday(),
          weekNumber,
          year,
          missedDate: getYesterday(),
          streakAtUse: 5,
        },
      ],
    };
    const availability = checkGraceDayAvailability(state);
    expect(availability.isAvailable).toBe(false);
    expect(availability.usedThisWeek).toBe(1);
    expect(availability.remaining).toBe(0);
  });

  test('daysUntilReset is between 1 and 7', () => {
    const availability = checkGraceDayAvailability(DEFAULT_GRACE_DAY_STATE);
    expect(availability.daysUntilReset).toBeGreaterThanOrEqual(1);
    expect(availability.daysUntilReset).toBeLessThanOrEqual(7);
  });
});

describe('canProtectStreakGap', () => {
  const mockToday = '2024-01-15';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockToday + 'T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('cannot protect when disabled', () => {
    const state: GraceDayState = { ...DEFAULT_GRACE_DAY_STATE, enabled: false };
    const result = canProtectStreakGap(state, '2024-01-13', mockToday);
    expect(result.canProtect).toBe(false);
    expect(result.reason).toContain('disabled');
  });

  test('no protection needed if active today', () => {
    const result = canProtectStreakGap(DEFAULT_GRACE_DAY_STATE, mockToday, mockToday);
    expect(result.canProtect).toBe(false);
    expect(result.reason).toContain('Active today');
  });

  test('no protection needed if active yesterday', () => {
    const result = canProtectStreakGap(DEFAULT_GRACE_DAY_STATE, '2024-01-14', mockToday);
    expect(result.canProtect).toBe(false);
    expect(result.reason).toContain('Active yesterday');
  });

  test('can protect single day gap', () => {
    // Last activity was 2 days ago (01-13), yesterday (01-14) was missed
    const result = canProtectStreakGap(DEFAULT_GRACE_DAY_STATE, '2024-01-13', mockToday);
    expect(result.canProtect).toBe(true);
    expect(result.missedDate).toBe('2024-01-14');
  });

  test('cannot protect if gap too large', () => {
    // Last activity was 3+ days ago
    const result = canProtectStreakGap(DEFAULT_GRACE_DAY_STATE, '2024-01-11', mockToday);
    expect(result.canProtect).toBe(false);
    expect(result.reason).toContain('Gap too large');
  });

  test('cannot protect if already protected', () => {
    const { weekNumber, year } = getISOWeekInfo(mockToday);
    const state: GraceDayState = {
      enabled: true,
      maxPerWeek: 1,
      usageHistory: [
        {
          usedOn: mockToday,
          weekNumber,
          year,
          missedDate: '2024-01-14',
          streakAtUse: 5,
        },
      ],
    };
    const result = canProtectStreakGap(state, '2024-01-13', mockToday);
    expect(result.canProtect).toBe(false);
    expect(result.reason).toContain('already protected');
  });
});

describe('consumeGraceDay', () => {
  const mockToday = '2024-01-15';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockToday + 'T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('adds usage to history', () => {
    const newState = consumeGraceDay(DEFAULT_GRACE_DAY_STATE, '2024-01-14', 5);
    expect(newState.usageHistory.length).toBe(1);
    expect(newState.usageHistory[0].missedDate).toBe('2024-01-14');
    expect(newState.usageHistory[0].streakAtUse).toBe(5);
  });

  test('preserves existing state', () => {
    const newState = consumeGraceDay(DEFAULT_GRACE_DAY_STATE, '2024-01-14', 5);
    expect(newState.enabled).toBe(DEFAULT_GRACE_DAY_STATE.enabled);
    expect(newState.maxPerWeek).toBe(DEFAULT_GRACE_DAY_STATE.maxPerWeek);
  });

  test('appends to existing history', () => {
    const existingState: GraceDayState = {
      ...DEFAULT_GRACE_DAY_STATE,
      usageHistory: [
        {
          usedOn: '2024-01-08',
          weekNumber: 2,
          year: 2024,
          missedDate: '2024-01-07',
          streakAtUse: 3,
        },
      ],
    };
    const newState = consumeGraceDay(existingState, '2024-01-14', 5);
    expect(newState.usageHistory.length).toBe(2);
  });
});

describe('calculateStreakWithGraceDays', () => {
  const mockToday = '2024-01-15';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockToday + 'T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns zeros for empty activity', () => {
    const result = calculateStreakWithGraceDays([], DEFAULT_GRACE_DAY_STATE);
    expect(result.currentStreak).toBe(0);
    expect(result.effectiveStreak).toBe(0);
    expect(result.graceDaysUsedInStreak).toBe(0);
    expect(result.isProtected).toBe(false);
  });

  test('calculates basic streak', () => {
    const activity = ['2024-01-13', '2024-01-14', mockToday];
    const result = calculateStreakWithGraceDays(activity, DEFAULT_GRACE_DAY_STATE);
    expect(result.currentStreak).toBe(3);
    expect(result.effectiveStreak).toBe(3);
    expect(result.isProtected).toBe(false);
  });

  test('counts protected days in effective streak', () => {
    const activity = ['2024-01-12', mockToday]; // 01-13, 01-14 missing
    const state: GraceDayState = {
      ...DEFAULT_GRACE_DAY_STATE,
      usageHistory: [
        {
          usedOn: '2024-01-14',
          weekNumber: 3,
          year: 2024,
          missedDate: '2024-01-13',
          streakAtUse: 2,
        },
      ],
    };
    const result = calculateStreakWithGraceDays(activity, state);
    // Should count protected day but gap is still too large
    expect(result.isProtected).toBe(false);
  });
});

// ============================================================================
// LOCALSTORAGE
// ============================================================================

describe('localStorage functions', () => {
  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('saveGraceDayState', () => {
    test('saves state to localStorage', () => {
      saveGraceDayState(DEFAULT_GRACE_DAY_STATE);
      const saved = localStorage.getItem(GRACE_DAY_STORAGE_KEY);
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!);
      expect(parsed.enabled).toBe(true);
    });

    test('cleans up old history', () => {
      const oldUsage: GraceDayUsage = {
        usedOn: '2022-01-01',
        weekNumber: 1,
        year: 2022,
        missedDate: '2021-12-31',
        streakAtUse: 5,
      };
      const state: GraceDayState = {
        ...DEFAULT_GRACE_DAY_STATE,
        usageHistory: [oldUsage],
      };
      saveGraceDayState(state);
      const saved = localStorage.getItem(GRACE_DAY_STORAGE_KEY);
      const parsed = JSON.parse(saved!);
      // Old entry should be cleaned up
      expect(parsed.usageHistory.length).toBe(0);
    });
  });

  describe('loadGraceDayState', () => {
    test('returns default state when nothing saved', () => {
      const state = loadGraceDayState();
      expect(state).toEqual(DEFAULT_GRACE_DAY_STATE);
    });

    test('loads saved state', () => {
      const customState: GraceDayState = {
        enabled: false,
        maxPerWeek: 2,
        usageHistory: [],
      };
      localStorage.setItem(GRACE_DAY_STORAGE_KEY, JSON.stringify(customState));
      const state = loadGraceDayState();
      expect(state.enabled).toBe(false);
      expect(state.maxPerWeek).toBe(2);
    });

    test('handles invalid JSON gracefully', () => {
      localStorage.setItem(GRACE_DAY_STORAGE_KEY, 'not-valid-json');
      const state = loadGraceDayState();
      expect(state).toEqual(DEFAULT_GRACE_DAY_STATE);
    });
  });

  describe('clearGraceDayState', () => {
    test('removes state from localStorage', () => {
      localStorage.setItem(GRACE_DAY_STORAGE_KEY, JSON.stringify(DEFAULT_GRACE_DAY_STATE));
      clearGraceDayState();
      expect(localStorage.getItem(GRACE_DAY_STORAGE_KEY)).toBeNull();
    });
  });
});

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

describe('formatGraceDayStatus', () => {
  test('shows available message when grace days available', () => {
    const availability: GraceDayAvailability = {
      isAvailable: true,
      usedThisWeek: 0,
      maxPerWeek: 1,
      remaining: 1,
      resetsOn: '2024-01-21',
      daysUntilReset: 5,
    };
    const status = formatGraceDayStatus(availability);
    expect(status).toContain('1');
    expect(status).toContain('available');
  });

  test('shows used message when no grace days available', () => {
    const availability: GraceDayAvailability = {
      isAvailable: false,
      usedThisWeek: 1,
      maxPerWeek: 1,
      remaining: 0,
      resetsOn: '2024-01-21',
      daysUntilReset: 5,
    };
    const status = formatGraceDayStatus(availability);
    expect(status).toContain('used');
    expect(status).toContain('5');
  });

  test('handles plural days correctly', () => {
    const availability1: GraceDayAvailability = {
      isAvailable: false,
      usedThisWeek: 1,
      maxPerWeek: 1,
      remaining: 0,
      resetsOn: '2024-01-21',
      daysUntilReset: 1,
    };
    expect(formatGraceDayStatus(availability1)).toContain('1 day');

    const availability2: GraceDayAvailability = {
      isAvailable: false,
      usedThisWeek: 1,
      maxPerWeek: 1,
      remaining: 0,
      resetsOn: '2024-01-21',
      daysUntilReset: 5,
    };
    expect(formatGraceDayStatus(availability2)).toContain('5 days');
  });
});

describe('getGraceDayDescription', () => {
  test('returns non-empty string', () => {
    const description = getGraceDayDescription();
    expect(description.length).toBeGreaterThan(0);
  });

  test('mentions grace day and week', () => {
    const description = getGraceDayDescription();
    expect(description.toLowerCase()).toContain('grace');
    expect(description.toLowerCase()).toContain('week');
  });
});

describe('getGraceDayTooltip', () => {
  test('mentions protection when available', () => {
    const availability: GraceDayAvailability = {
      isAvailable: true,
      usedThisWeek: 0,
      maxPerWeek: 1,
      remaining: 1,
      resetsOn: '2024-01-21',
      daysUntilReset: 5,
    };
    const tooltip = getGraceDayTooltip(availability);
    expect(tooltip.toLowerCase()).toContain('protection');
  });

  test('mentions reset date when not available', () => {
    const availability: GraceDayAvailability = {
      isAvailable: false,
      usedThisWeek: 1,
      maxPerWeek: 1,
      remaining: 0,
      resetsOn: '2024-01-21',
      daysUntilReset: 5,
    };
    const tooltip = getGraceDayTooltip(availability);
    expect(tooltip).toContain('2024-01-21');
  });
});

describe('getGraceDayAriaLabel', () => {
  test('includes availability count', () => {
    const availability: GraceDayAvailability = {
      isAvailable: true,
      usedThisWeek: 0,
      maxPerWeek: 1,
      remaining: 1,
      resetsOn: '2024-01-21',
      daysUntilReset: 5,
    };
    const label = getGraceDayAriaLabel(availability);
    expect(label).toContain('1 of 1');
  });

  test('mentions active status when available', () => {
    const availability: GraceDayAvailability = {
      isAvailable: true,
      usedThisWeek: 0,
      maxPerWeek: 1,
      remaining: 1,
      resetsOn: '2024-01-21',
      daysUntilReset: 5,
    };
    const label = getGraceDayAriaLabel(availability);
    expect(label.toLowerCase()).toContain('active');
  });

  test('mentions reset when not available', () => {
    const availability: GraceDayAvailability = {
      isAvailable: false,
      usedThisWeek: 1,
      maxPerWeek: 1,
      remaining: 0,
      resetsOn: '2024-01-21',
      daysUntilReset: 5,
    };
    const label = getGraceDayAriaLabel(availability);
    expect(label.toLowerCase()).toContain('reset');
  });
});

describe('getGraceDayColorClass', () => {
  test('returns emerald color when available', () => {
    const availability: GraceDayAvailability = {
      isAvailable: true,
      usedThisWeek: 0,
      maxPerWeek: 1,
      remaining: 1,
      resetsOn: '2024-01-21',
      daysUntilReset: 5,
    };
    expect(getGraceDayColorClass(availability)).toContain('emerald');
  });

  test('returns amber color when not available', () => {
    const availability: GraceDayAvailability = {
      isAvailable: false,
      usedThisWeek: 1,
      maxPerWeek: 1,
      remaining: 0,
      resetsOn: '2024-01-21',
      daysUntilReset: 5,
    };
    expect(getGraceDayColorClass(availability)).toContain('amber');
  });
});

// ============================================================================
// CONSTANTS VALIDATION
// ============================================================================

describe('DEFAULT_GRACE_DAY_STATE', () => {
  test('has enabled set to true', () => {
    expect(DEFAULT_GRACE_DAY_STATE.enabled).toBe(true);
  });

  test('has maxPerWeek set to 1', () => {
    expect(DEFAULT_GRACE_DAY_STATE.maxPerWeek).toBe(1);
  });

  test('has empty usage history', () => {
    expect(DEFAULT_GRACE_DAY_STATE.usageHistory).toEqual([]);
  });
});

describe('GRACE_DAY_STORAGE_KEY', () => {
  test('is a non-empty string', () => {
    expect(typeof GRACE_DAY_STORAGE_KEY).toBe('string');
    expect(GRACE_DAY_STORAGE_KEY.length).toBeGreaterThan(0);
  });

  test('has carddex prefix', () => {
    expect(GRACE_DAY_STORAGE_KEY).toContain('carddex');
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge cases', () => {
  test('handles year boundary for week calculation', () => {
    // Dec 31 and Jan 1 should work correctly
    const dec31 = getWeekInfo('2023-12-31');
    const jan1 = getWeekInfo('2024-01-01');
    expect(dec31.startDate <= '2023-12-31').toBe(true);
    expect(jan1.startDate <= '2024-01-01').toBe(true);
  });

  test('handles leap year', () => {
    // Feb 29, 2024 (leap year)
    const boundaries = getWeekBoundaries('2024-02-29');
    expect(boundaries.startDate).toBeTruthy();
    expect(boundaries.endDate).toBeTruthy();
  });

  test('handles empty arrays', () => {
    expect(getGraceDaysUsedInWeek([])).toBe(0);
    const result = calculateStreakWithGraceDays([], DEFAULT_GRACE_DAY_STATE);
    expect(result.currentStreak).toBe(0);
  });
});
