import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import {
  getToday,
  getDateDaysAgo,
  getDayOfWeek,
  getDayOfMonth,
  isWeekend,
  isNextDay,
  getDaysBetween,
  generateDateRange,
  identifyGraceDays,
  findLongestGap,
  findStreakStartDate,
  getStreakDays,
  buildCalendarDay,
  buildStreakCalendar,
  getDayStatusClass,
  getMonthName,
  getDayAbbreviation,
  formatActivitySummary,
  getStreakMessage,
  type CalendarDay,
  type StreakCalendarData,
} from '../streakCalendar';

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

describe('getDateDaysAgo', () => {
  test('returns a valid YYYY-MM-DD format', () => {
    const date = getDateDaysAgo(5);
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('returns 0 days ago as today', () => {
    const today = getToday();
    const daysAgo = getDateDaysAgo(0);
    expect(daysAgo).toBe(today);
  });

  test('returns correct date for 7 days ago', () => {
    const sevenDaysAgo = getDateDaysAgo(7);
    const expected = new Date();
    expected.setDate(expected.getDate() - 7);
    expect(sevenDaysAgo).toBe(expected.toISOString().split('T')[0]);
  });
});

describe('getDayOfWeek', () => {
  test('returns 0 for Sunday', () => {
    // 2024-01-07 is a Sunday
    expect(getDayOfWeek('2024-01-07')).toBe(0);
  });

  test('returns 6 for Saturday', () => {
    // 2024-01-06 is a Saturday
    expect(getDayOfWeek('2024-01-06')).toBe(6);
  });

  test('returns values 0-6', () => {
    // Jan 7-13, 2024 (Sun-Sat)
    const dates = [
      '2024-01-07',
      '2024-01-08',
      '2024-01-09',
      '2024-01-10',
      '2024-01-11',
      '2024-01-12',
      '2024-01-13',
    ];
    for (const date of dates) {
      const dayOfWeek = getDayOfWeek(date);
      expect(dayOfWeek).toBeGreaterThanOrEqual(0);
      expect(dayOfWeek).toBeLessThanOrEqual(6);
    }
  });
});

describe('getDayOfMonth', () => {
  test('returns correct day of month', () => {
    expect(getDayOfMonth('2024-01-15')).toBe(15);
    expect(getDayOfMonth('2024-02-28')).toBe(28);
    expect(getDayOfMonth('2024-12-01')).toBe(1);
  });
});

describe('isWeekend', () => {
  test('returns true for Saturday', () => {
    expect(isWeekend('2024-01-06')).toBe(true); // Saturday
  });

  test('returns true for Sunday', () => {
    expect(isWeekend('2024-01-07')).toBe(true); // Sunday
  });

  test('returns false for weekdays', () => {
    expect(isWeekend('2024-01-08')).toBe(false); // Monday
    expect(isWeekend('2024-01-10')).toBe(false); // Wednesday
    expect(isWeekend('2024-01-12')).toBe(false); // Friday
  });
});

describe('isNextDay', () => {
  test('returns true for consecutive days', () => {
    expect(isNextDay('2024-01-02', '2024-01-01')).toBe(true);
    expect(isNextDay('2024-02-01', '2024-01-31')).toBe(true);
  });

  test('returns false for same day', () => {
    expect(isNextDay('2024-01-01', '2024-01-01')).toBe(false);
  });

  test('returns false for non-consecutive days', () => {
    expect(isNextDay('2024-01-03', '2024-01-01')).toBe(false);
    expect(isNextDay('2024-01-01', '2024-01-02')).toBe(false);
  });
});

describe('getDaysBetween', () => {
  test('returns 0 for same day', () => {
    expect(getDaysBetween('2024-01-01', '2024-01-01')).toBe(0);
  });

  test('returns correct number of days', () => {
    expect(getDaysBetween('2024-01-01', '2024-01-08')).toBe(7);
    expect(getDaysBetween('2024-01-08', '2024-01-01')).toBe(7);
  });

  test('handles month boundaries', () => {
    expect(getDaysBetween('2024-01-28', '2024-02-04')).toBe(7);
  });
});

describe('generateDateRange', () => {
  test('returns correct number of dates', () => {
    expect(generateDateRange(7)).toHaveLength(7);
    expect(generateDateRange(30)).toHaveLength(30);
    expect(generateDateRange(1)).toHaveLength(1);
  });

  test('ends with today', () => {
    const dates = generateDateRange(7);
    const today = getToday();
    expect(dates[dates.length - 1]).toBe(today);
  });

  test('dates are in ascending order', () => {
    const dates = generateDateRange(10);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] > dates[i - 1]).toBe(true);
    }
  });

  test('dates are consecutive', () => {
    const dates = generateDateRange(10);
    for (let i = 1; i < dates.length; i++) {
      expect(isNextDay(dates[i], dates[i - 1])).toBe(true);
    }
  });
});

// ============================================================================
// STREAK ANALYSIS
// ============================================================================

describe('identifyGraceDays', () => {
  test('returns empty array when no grace days', () => {
    const activity = ['2024-01-01', '2024-01-02', '2024-01-03'];
    const range = ['2024-01-01', '2024-01-02', '2024-01-03'];
    expect(identifyGraceDays(activity, range)).toEqual([]);
  });

  test('identifies single grace day between active days', () => {
    const activity = ['2024-01-01', '2024-01-03'];
    const range = ['2024-01-01', '2024-01-02', '2024-01-03'];
    expect(identifyGraceDays(activity, range)).toEqual(['2024-01-02']);
  });

  test('does not identify multiple consecutive missed days as grace days', () => {
    const activity = ['2024-01-01', '2024-01-04'];
    const range = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04'];
    // 01-02 and 01-03 are not grace days because they're not surrounded by active days
    expect(identifyGraceDays(activity, range)).toEqual([]);
  });

  test('identifies multiple grace days when each is surrounded by active days', () => {
    const activity = ['2024-01-01', '2024-01-03', '2024-01-05'];
    const range = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'];
    expect(identifyGraceDays(activity, range)).toEqual(['2024-01-02', '2024-01-04']);
  });

  test('returns empty array when no activity', () => {
    const range = ['2024-01-01', '2024-01-02', '2024-01-03'];
    expect(identifyGraceDays([], range)).toEqual([]);
  });
});

describe('findLongestGap', () => {
  test('returns range length when no activity', () => {
    const range = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'];
    expect(findLongestGap([], range)).toBe(5);
  });

  test('returns 0 when all days are active', () => {
    const range = ['2024-01-01', '2024-01-02', '2024-01-03'];
    const activity = ['2024-01-01', '2024-01-02', '2024-01-03'];
    expect(findLongestGap(activity, range)).toBe(0);
  });

  test('calculates correct gap', () => {
    const range = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'];
    const activity = ['2024-01-01', '2024-01-05'];
    expect(findLongestGap(activity, range)).toBe(3);
  });

  test('finds longest gap among multiple gaps', () => {
    const range = [
      '2024-01-01',
      '2024-01-02',
      '2024-01-03',
      '2024-01-04',
      '2024-01-05',
      '2024-01-06',
      '2024-01-07',
    ];
    const activity = ['2024-01-01', '2024-01-03', '2024-01-07']; // gaps of 1 and 3
    expect(findLongestGap(activity, range)).toBe(3);
  });
});

describe('findStreakStartDate', () => {
  // Use mock for today to make tests deterministic
  const mockToday = '2024-01-15';
  const mockYesterday = '2024-01-14';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockToday + 'T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns null for empty activity', () => {
    expect(findStreakStartDate([])).toBeNull();
  });

  test('returns null when last activity is not today or yesterday', () => {
    const activity = ['2024-01-10', '2024-01-11'];
    expect(findStreakStartDate(activity)).toBeNull();
  });

  test('returns single day for one-day streak', () => {
    const activity = [mockToday];
    expect(findStreakStartDate(activity)).toBe(mockToday);
  });

  test('returns start date for consecutive days', () => {
    const activity = ['2024-01-12', '2024-01-13', '2024-01-14', mockToday];
    expect(findStreakStartDate(activity)).toBe('2024-01-12');
  });

  test('works when streak started yesterday', () => {
    const activity = ['2024-01-12', '2024-01-13', mockYesterday];
    expect(findStreakStartDate(activity)).toBe('2024-01-12');
  });
});

describe('getStreakDays', () => {
  const mockToday = '2024-01-15';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockToday + 'T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns empty set for empty activity', () => {
    expect(getStreakDays([]).size).toBe(0);
  });

  test('returns set of consecutive days', () => {
    const activity = ['2024-01-13', '2024-01-14', mockToday];
    const streakDays = getStreakDays(activity);
    expect(streakDays.size).toBe(3);
    expect(streakDays.has('2024-01-13')).toBe(true);
    expect(streakDays.has('2024-01-14')).toBe(true);
    expect(streakDays.has(mockToday)).toBe(true);
  });

  test('stops at gap in streak', () => {
    const activity = ['2024-01-10', '2024-01-11', '2024-01-13', '2024-01-14', mockToday];
    const streakDays = getStreakDays(activity);
    expect(streakDays.size).toBe(3);
    expect(streakDays.has('2024-01-10')).toBe(false);
    expect(streakDays.has('2024-01-11')).toBe(false);
    expect(streakDays.has('2024-01-13')).toBe(true);
  });
});

// ============================================================================
// CALENDAR BUILDING
// ============================================================================

describe('buildCalendarDay', () => {
  test('builds correct day object', () => {
    const today = '2024-01-15';
    const activityDates = new Set(['2024-01-15']);
    const graceDays = new Set<string>();
    const streakDays = new Set(['2024-01-15']);

    const day = buildCalendarDay('2024-01-15', activityDates, graceDays, streakDays, today);

    expect(day.date).toBe('2024-01-15');
    expect(day.isToday).toBe(true);
    expect(day.hasActivity).toBe(true);
    expect(day.isGraceDay).toBe(false);
    expect(day.isPartOfStreak).toBe(true);
  });

  test('marks future days correctly', () => {
    const today = '2024-01-15';
    const day = buildCalendarDay('2024-01-20', new Set(), new Set(), new Set(), today);
    expect(day.isFuture).toBe(true);
  });

  test('marks grace days correctly', () => {
    const today = '2024-01-15';
    const graceDays = new Set(['2024-01-14']);
    const day = buildCalendarDay('2024-01-14', new Set(), graceDays, new Set(), today);
    expect(day.isGraceDay).toBe(true);
  });
});

describe('buildStreakCalendar', () => {
  const mockToday = '2024-01-15';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockToday + 'T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('builds calendar with correct totalDays', () => {
    const calendar = buildStreakCalendar([], 30);
    expect(calendar.totalDays).toBe(30);
  });

  test('calculates active days correctly', () => {
    const activity = ['2024-01-10', '2024-01-11', '2024-01-12'];
    const calendar = buildStreakCalendar(activity, 30);
    expect(calendar.activeDays).toBe(3);
  });

  test('calculates grace days correctly', () => {
    const activity = ['2024-01-10', '2024-01-12', '2024-01-14']; // 01-11 and 01-13 are grace days
    const calendar = buildStreakCalendar(activity, 30);
    expect(calendar.graceDaysUsed).toBe(2);
  });

  test('calculates current streak correctly', () => {
    const activity = ['2024-01-13', '2024-01-14', mockToday];
    const calendar = buildStreakCalendar(activity, 30);
    expect(calendar.currentStreakDays).toBe(3);
  });

  test('organizes days into weeks', () => {
    const calendar = buildStreakCalendar([], 30);
    expect(calendar.weeks.length).toBeGreaterThan(0);

    // Each week should have days array
    for (const week of calendar.weeks) {
      expect(Array.isArray(week.days)).toBe(true);
      expect(week.days.length).toBeGreaterThan(0);
      expect(week.days.length).toBeLessThanOrEqual(7);
    }
  });

  test('includes streak start date when streak is active', () => {
    const activity = ['2024-01-13', '2024-01-14', mockToday];
    const calendar = buildStreakCalendar(activity, 30);
    expect(calendar.streakStartDate).toBe('2024-01-13');
  });

  test('returns null streak start date when no active streak', () => {
    const activity = ['2024-01-05', '2024-01-06'];
    const calendar = buildStreakCalendar(activity, 30);
    expect(calendar.streakStartDate).toBeNull();
  });
});

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

describe('getDayStatusClass', () => {
  test('returns "future" for future days', () => {
    const day: CalendarDay = {
      date: '2024-01-20',
      dayOfWeek: 6,
      dayOfMonth: 20,
      isToday: false,
      isFuture: true,
      hasActivity: false,
      isGraceDay: false,
      isWeekend: true,
      isPartOfStreak: false,
    };
    expect(getDayStatusClass(day)).toBe('future');
  });

  test('returns "today-active" for today with activity', () => {
    const day: CalendarDay = {
      date: '2024-01-15',
      dayOfWeek: 1,
      dayOfMonth: 15,
      isToday: true,
      isFuture: false,
      hasActivity: true,
      isGraceDay: false,
      isWeekend: false,
      isPartOfStreak: true,
    };
    expect(getDayStatusClass(day)).toBe('today-active');
  });

  test('returns "today" for today without activity', () => {
    const day: CalendarDay = {
      date: '2024-01-15',
      dayOfWeek: 1,
      dayOfMonth: 15,
      isToday: true,
      isFuture: false,
      hasActivity: false,
      isGraceDay: false,
      isWeekend: false,
      isPartOfStreak: false,
    };
    expect(getDayStatusClass(day)).toBe('today');
  });

  test('returns "active-streak" for active day part of streak', () => {
    const day: CalendarDay = {
      date: '2024-01-14',
      dayOfWeek: 0,
      dayOfMonth: 14,
      isToday: false,
      isFuture: false,
      hasActivity: true,
      isGraceDay: false,
      isWeekend: true,
      isPartOfStreak: true,
    };
    expect(getDayStatusClass(day)).toBe('active-streak');
  });

  test('returns "active" for active day not part of current streak', () => {
    const day: CalendarDay = {
      date: '2024-01-05',
      dayOfWeek: 5,
      dayOfMonth: 5,
      isToday: false,
      isFuture: false,
      hasActivity: true,
      isGraceDay: false,
      isWeekend: false,
      isPartOfStreak: false,
    };
    expect(getDayStatusClass(day)).toBe('active');
  });

  test('returns "grace" for grace days', () => {
    const day: CalendarDay = {
      date: '2024-01-10',
      dayOfWeek: 3,
      dayOfMonth: 10,
      isToday: false,
      isFuture: false,
      hasActivity: false,
      isGraceDay: true,
      isWeekend: false,
      isPartOfStreak: false,
    };
    expect(getDayStatusClass(day)).toBe('grace');
  });

  test('returns "inactive" for inactive days', () => {
    const day: CalendarDay = {
      date: '2024-01-08',
      dayOfWeek: 1,
      dayOfMonth: 8,
      isToday: false,
      isFuture: false,
      hasActivity: false,
      isGraceDay: false,
      isWeekend: false,
      isPartOfStreak: false,
    };
    expect(getDayStatusClass(day)).toBe('inactive');
  });
});

describe('getMonthName', () => {
  test('returns correct month abbreviations', () => {
    expect(getMonthName('2024-01-15')).toBe('Jan');
    expect(getMonthName('2024-06-15')).toBe('Jun');
    expect(getMonthName('2024-12-25')).toBe('Dec');
  });
});

describe('getDayAbbreviation', () => {
  test('returns correct day abbreviations', () => {
    expect(getDayAbbreviation(0)).toBe('S'); // Sunday
    expect(getDayAbbreviation(1)).toBe('M'); // Monday
    expect(getDayAbbreviation(2)).toBe('T'); // Tuesday
    expect(getDayAbbreviation(3)).toBe('W'); // Wednesday
    expect(getDayAbbreviation(4)).toBe('T'); // Thursday
    expect(getDayAbbreviation(5)).toBe('F'); // Friday
    expect(getDayAbbreviation(6)).toBe('S'); // Saturday
  });
});

describe('formatActivitySummary', () => {
  test('formats summary correctly', () => {
    const data: StreakCalendarData = {
      weeks: [],
      totalDays: 30,
      activeDays: 15,
      graceDaysUsed: 2,
      longestGap: 3,
      streakStartDate: null,
      currentStreakDays: 0,
    };
    expect(formatActivitySummary(data)).toBe('15 of 30 days (50%)');
  });

  test('handles zero total days', () => {
    const data: StreakCalendarData = {
      weeks: [],
      totalDays: 0,
      activeDays: 0,
      graceDaysUsed: 0,
      longestGap: 0,
      streakStartDate: null,
      currentStreakDays: 0,
    };
    expect(formatActivitySummary(data)).toBe('0 of 0 days (0%)');
  });

  test('rounds percentage correctly', () => {
    const data: StreakCalendarData = {
      weeks: [],
      totalDays: 30,
      activeDays: 10,
      graceDaysUsed: 0,
      longestGap: 0,
      streakStartDate: null,
      currentStreakDays: 0,
    };
    expect(formatActivitySummary(data)).toBe('10 of 30 days (33%)');
  });
});

describe('getStreakMessage', () => {
  test('returns start message for no activity', () => {
    const data: StreakCalendarData = {
      weeks: [],
      totalDays: 30,
      activeDays: 0,
      graceDaysUsed: 0,
      longestGap: 30,
      streakStartDate: null,
      currentStreakDays: 0,
    };
    expect(getStreakMessage(data)).toBe('Start your streak today!');
  });

  test('returns restart message for broken streak', () => {
    const data: StreakCalendarData = {
      weeks: [],
      totalDays: 30,
      activeDays: 5,
      graceDaysUsed: 0,
      longestGap: 10,
      streakStartDate: null,
      currentStreakDays: 0,
    };
    expect(getStreakMessage(data)).toBe('Your streak ended. Start a new one today!');
  });

  test('returns building message for 1-2 day streak', () => {
    const data: StreakCalendarData = {
      weeks: [],
      totalDays: 30,
      activeDays: 2,
      graceDaysUsed: 0,
      longestGap: 0,
      streakStartDate: '2024-01-14',
      currentStreakDays: 2,
    };
    expect(getStreakMessage(data)).toBe('Building momentum!');
  });

  test('returns great start message for 3-6 day streak', () => {
    const data: StreakCalendarData = {
      weeks: [],
      totalDays: 30,
      activeDays: 5,
      graceDaysUsed: 0,
      longestGap: 0,
      streakStartDate: '2024-01-11',
      currentStreakDays: 5,
    };
    expect(getStreakMessage(data)).toBe('Great start! Keep it up!');
  });

  test('returns week message for 7-13 day streak', () => {
    const data: StreakCalendarData = {
      weeks: [],
      totalDays: 30,
      activeDays: 10,
      graceDaysUsed: 0,
      longestGap: 0,
      streakStartDate: '2024-01-06',
      currentStreakDays: 10,
    };
    expect(getStreakMessage(data)).toBe('Amazing week streak!');
  });

  test('returns dedication message for 14-29 day streak', () => {
    const data: StreakCalendarData = {
      weeks: [],
      totalDays: 30,
      activeDays: 20,
      graceDaysUsed: 0,
      longestGap: 0,
      streakStartDate: '2023-12-26',
      currentStreakDays: 20,
    };
    expect(getStreakMessage(data)).toBe('Incredible dedication!');
  });

  test('returns legendary message for 30+ day streak', () => {
    const data: StreakCalendarData = {
      weeks: [],
      totalDays: 30,
      activeDays: 30,
      graceDaysUsed: 0,
      longestGap: 0,
      streakStartDate: '2023-12-16',
      currentStreakDays: 30,
    };
    expect(getStreakMessage(data)).toBe('Legendary! A full month streak!');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration: Full calendar building', () => {
  const mockToday = '2024-01-15';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockToday + 'T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('builds complete calendar for 30 days', () => {
    const activity = [
      '2024-01-01',
      '2024-01-02',
      '2024-01-03', // early activity
      '2024-01-10',
      '2024-01-12', // gap creates grace day on 01-11
      '2024-01-13',
      '2024-01-14',
      mockToday, // current streak
    ];

    const calendar = buildStreakCalendar(activity, 30);

    expect(calendar.totalDays).toBe(30);
    expect(calendar.activeDays).toBe(8);
    expect(calendar.graceDaysUsed).toBe(1); // 01-11
    expect(calendar.currentStreakDays).toBe(4); // 01-12, 01-13, 01-14, today
    expect(calendar.streakStartDate).toBe('2024-01-12');
  });

  test('all days have required properties', () => {
    const calendar = buildStreakCalendar(['2024-01-10', mockToday], 30);

    for (const week of calendar.weeks) {
      for (const day of week.days) {
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('dayOfWeek');
        expect(day).toHaveProperty('dayOfMonth');
        expect(day).toHaveProperty('isToday');
        expect(day).toHaveProperty('isFuture');
        expect(day).toHaveProperty('hasActivity');
        expect(day).toHaveProperty('isGraceDay');
        expect(day).toHaveProperty('isWeekend');
        expect(day).toHaveProperty('isPartOfStreak');
      }
    }
  });

  test('today is marked correctly in calendar', () => {
    const calendar = buildStreakCalendar([mockToday], 30);

    let foundToday = false;
    for (const week of calendar.weeks) {
      for (const day of week.days) {
        if (day.date === mockToday) {
          expect(day.isToday).toBe(true);
          expect(day.hasActivity).toBe(true);
          foundToday = true;
        } else {
          expect(day.isToday).toBe(false);
        }
      }
    }
    expect(foundToday).toBe(true);
  });
});

describe('Integration: No activity scenario', () => {
  const mockToday = '2024-01-15';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockToday + 'T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('handles empty activity gracefully', () => {
    const calendar = buildStreakCalendar([], 30);

    expect(calendar.activeDays).toBe(0);
    expect(calendar.graceDaysUsed).toBe(0);
    expect(calendar.currentStreakDays).toBe(0);
    expect(calendar.streakStartDate).toBeNull();
    expect(calendar.longestGap).toBe(30);

    const message = getStreakMessage(calendar);
    expect(message).toBe('Start your streak today!');
  });
});

describe('Integration: Perfect streak scenario', () => {
  const mockToday = '2024-01-15';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(mockToday + 'T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('handles 30-day perfect streak', () => {
    // Generate 30 consecutive days ending today
    const dates = generateDateRange(30);
    const calendar = buildStreakCalendar(dates, 30);

    expect(calendar.activeDays).toBe(30);
    expect(calendar.graceDaysUsed).toBe(0);
    expect(calendar.currentStreakDays).toBe(30);
    expect(calendar.longestGap).toBe(0);

    const message = getStreakMessage(calendar);
    expect(message).toBe('Legendary! A full month streak!');
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge cases', () => {
  test('handles single day calendar', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00'));

    const calendar = buildStreakCalendar(['2024-01-15'], 1);
    expect(calendar.totalDays).toBe(1);
    expect(calendar.activeDays).toBe(1);
    expect(calendar.weeks.length).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  test('activity dates outside range are ignored', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00'));

    // Activity from 2 months ago - outside 30 day range
    const calendar = buildStreakCalendar(['2023-11-01', '2023-11-02'], 30);
    expect(calendar.activeDays).toBe(0);

    vi.useRealTimers();
  });

  test('duplicate activity dates are handled', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00'));

    const activity = ['2024-01-10', '2024-01-10', '2024-01-10'];
    const calendar = buildStreakCalendar(activity, 30);
    expect(calendar.activeDays).toBe(1);

    vi.useRealTimers();
  });

  test('unsorted activity dates are handled', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00'));

    const activity = ['2024-01-15', '2024-01-10', '2024-01-12', '2024-01-08'];
    const calendar = buildStreakCalendar(activity, 30);
    expect(calendar.activeDays).toBe(4);

    vi.useRealTimers();
  });
});
