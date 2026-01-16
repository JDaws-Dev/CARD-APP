/**
 * Streak Calendar Utility Functions
 *
 * Pure functions for building a visual streak calendar showing
 * activity over the past 30 days with markers for active days
 * and grace days.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CalendarDay {
  date: string; // YYYY-MM-DD format
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  dayOfMonth: number;
  isToday: boolean;
  isFuture: boolean;
  hasActivity: boolean;
  isGraceDay: boolean;
  isWeekend: boolean;
  isPartOfStreak: boolean;
}

export interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}

export interface StreakCalendarData {
  weeks: CalendarWeek[];
  totalDays: number;
  activeDays: number;
  graceDaysUsed: number;
  longestGap: number;
  streakStartDate: string | null;
  currentStreakDays: number;
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date N days ago as YYYY-MM-DD string
 */
export function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Get the day of week for a date (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getDay();
}

/**
 * Get the day of month for a date
 */
export function getDayOfMonth(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getDate();
}

/**
 * Check if a day is a weekend (Saturday or Sunday)
 */
export function isWeekend(dateStr: string): boolean {
  const day = getDayOfWeek(dateStr);
  return day === 0 || day === 6;
}

/**
 * Check if date1 is the day after date2
 */
export function isNextDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1 + 'T00:00:00');
  const d2 = new Date(date2 + 'T00:00:00');
  const diffMs = d1.getTime() - d2.getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);
  return diffDays === 1;
}

/**
 * Get number of days between two dates
 */
export function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00');
  const d2 = new Date(date2 + 'T00:00:00');
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Generate an array of dates for the past N days (including today)
 */
export function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}

// ============================================================================
// STREAK ANALYSIS
// ============================================================================

/**
 * Identify grace days in a streak (single missed days that didn't break the streak)
 * A grace day is a day with no activity that is between two active days
 */
export function identifyGraceDays(activityDates: string[], dateRange: string[]): string[] {
  const activitySet = new Set(activityDates);
  const graceDays: string[] = [];

  for (let i = 1; i < dateRange.length - 1; i++) {
    const prevDate = dateRange[i - 1];
    const currentDate = dateRange[i];
    const nextDate = dateRange[i + 1];

    // A grace day is a day with no activity surrounded by active days
    if (!activitySet.has(currentDate) && activitySet.has(prevDate) && activitySet.has(nextDate)) {
      graceDays.push(currentDate);
    }
  }

  return graceDays;
}

/**
 * Find the longest gap (consecutive days without activity)
 */
export function findLongestGap(activityDates: string[], dateRange: string[]): number {
  if (activityDates.length === 0) return dateRange.length;

  const activitySet = new Set(activityDates);
  let maxGap = 0;
  let currentGap = 0;

  for (const date of dateRange) {
    if (activitySet.has(date)) {
      maxGap = Math.max(maxGap, currentGap);
      currentGap = 0;
    } else {
      currentGap++;
    }
  }

  // Check final gap
  maxGap = Math.max(maxGap, currentGap);

  return maxGap;
}

/**
 * Find the start date of the current streak
 */
export function findStreakStartDate(activityDates: string[]): string | null {
  if (activityDates.length === 0) return null;

  // Sort dates descending (most recent first)
  const sortedDates = [...activityDates].sort((a, b) => b.localeCompare(a));
  const today = getToday();
  const yesterday = getDateDaysAgo(1);

  // Current streak only counts if active today or yesterday
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return null;
  }

  // Walk backwards finding consecutive days
  let streakStart = sortedDates[0];

  for (let i = 1; i < sortedDates.length; i++) {
    if (isNextDay(sortedDates[i - 1], sortedDates[i])) {
      streakStart = sortedDates[i];
    } else {
      break;
    }
  }

  return streakStart;
}

/**
 * Determine which days are part of the current streak
 */
export function getStreakDays(activityDates: string[]): Set<string> {
  const streakStart = findStreakStartDate(activityDates);
  if (!streakStart) return new Set();

  const sortedDates = [...activityDates].sort((a, b) => b.localeCompare(a));
  const streakDays = new Set<string>();

  // Add consecutive days starting from most recent
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      streakDays.add(sortedDates[i]);
    } else if (isNextDay(sortedDates[i - 1], sortedDates[i])) {
      streakDays.add(sortedDates[i]);
    } else {
      break;
    }
  }

  return streakDays;
}

// ============================================================================
// CALENDAR BUILDING
// ============================================================================

/**
 * Build a single CalendarDay object
 */
export function buildCalendarDay(
  dateStr: string,
  activityDates: Set<string>,
  graceDays: Set<string>,
  streakDays: Set<string>,
  today: string
): CalendarDay {
  return {
    date: dateStr,
    dayOfWeek: getDayOfWeek(dateStr),
    dayOfMonth: getDayOfMonth(dateStr),
    isToday: dateStr === today,
    isFuture: dateStr > today,
    hasActivity: activityDates.has(dateStr),
    isGraceDay: graceDays.has(dateStr),
    isWeekend: isWeekend(dateStr),
    isPartOfStreak: streakDays.has(dateStr),
  };
}

/**
 * Build the full streak calendar data structure
 */
export function buildStreakCalendar(
  activityDates: string[],
  days: number = 30
): StreakCalendarData {
  const dateRange = generateDateRange(days);
  const today = getToday();
  const activitySet = new Set(activityDates.filter((d) => dateRange.includes(d)));
  const graceDaysList = identifyGraceDays(activityDates, dateRange);
  const graceDaysSet = new Set(graceDaysList);
  const streakDays = getStreakDays(activityDates);

  // Build calendar days
  const calendarDays: CalendarDay[] = dateRange.map((dateStr) =>
    buildCalendarDay(dateStr, activitySet, graceDaysSet, streakDays, today)
  );

  // Group into weeks (starting from Sunday)
  const weeks: CalendarWeek[] = [];
  let currentWeek: CalendarDay[] = [];
  let weekNumber = 0;

  for (const day of calendarDays) {
    currentWeek.push(day);

    // Start new week after Saturday or at end
    if (day.dayOfWeek === 6) {
      weeks.push({ weekNumber, days: currentWeek });
      currentWeek = [];
      weekNumber++;
    }
  }

  // Push remaining days as final partial week
  if (currentWeek.length > 0) {
    weeks.push({ weekNumber, days: currentWeek });
  }

  // Calculate stats
  const activeDays = calendarDays.filter((d) => d.hasActivity).length;
  const longestGap = findLongestGap(activityDates, dateRange);
  const streakStartDate = findStreakStartDate(activityDates);
  const currentStreakDays = streakDays.size;

  return {
    weeks,
    totalDays: days,
    activeDays,
    graceDaysUsed: graceDaysList.length,
    longestGap,
    streakStartDate,
    currentStreakDays,
  };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get CSS class suffix based on day state
 */
export function getDayStatusClass(day: CalendarDay): string {
  if (day.isFuture) return 'future';
  if (day.isToday && day.hasActivity) return 'today-active';
  if (day.isToday) return 'today';
  if (day.hasActivity && day.isPartOfStreak) return 'active-streak';
  if (day.hasActivity) return 'active';
  if (day.isGraceDay) return 'grace';
  return 'inactive';
}

/**
 * Get the month name for a date
 */
export function getMonthName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short' });
}

/**
 * Get abbreviated day name (S, M, T, W, T, F, S)
 */
export function getDayAbbreviation(dayOfWeek: number): string {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return days[dayOfWeek];
}

/**
 * Format activity summary for display
 */
export function formatActivitySummary(data: StreakCalendarData): string {
  const percentage = data.totalDays > 0 ? Math.round((data.activeDays / data.totalDays) * 100) : 0;
  return `${data.activeDays} of ${data.totalDays} days (${percentage}%)`;
}

/**
 * Get encouraging message based on streak status
 */
export function getStreakMessage(data: StreakCalendarData): string {
  if (data.currentStreakDays === 0) {
    if (data.activeDays === 0) {
      return 'Start your streak today!';
    }
    return 'Your streak ended. Start a new one today!';
  }

  if (data.currentStreakDays >= 30) {
    return 'Legendary! A full month streak!';
  }
  if (data.currentStreakDays >= 14) {
    return 'Incredible dedication!';
  }
  if (data.currentStreakDays >= 7) {
    return 'Amazing week streak!';
  }
  if (data.currentStreakDays >= 3) {
    return 'Great start! Keep it up!';
  }

  return 'Building momentum!';
}
