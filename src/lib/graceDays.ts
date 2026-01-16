/**
 * Grace Day Streak Protection Utility Functions
 *
 * Provides "1 grace day per week" protection that prevents streaks from breaking
 * when a user misses a single day. Grace days reset each week (Sunday = start of week).
 */

// ============================================================================
// TYPES
// ============================================================================

export interface GraceDayUsage {
  /** Date the grace day was used (YYYY-MM-DD) */
  usedOn: string;
  /** Week number (ISO week of year) when used */
  weekNumber: number;
  /** Year when used */
  year: number;
  /** The date that was "saved" by this grace day (the missed day) */
  missedDate: string;
  /** Streak count at time of use */
  streakAtUse: number;
}

export interface GraceDayState {
  /** Whether grace day protection is enabled */
  enabled: boolean;
  /** History of grace days used (for calendar display) */
  usageHistory: GraceDayUsage[];
  /** Maximum grace days per week */
  maxPerWeek: number;
  /** Whether weekend pause is enabled (streak doesn't require activity on weekends) */
  weekendPauseEnabled: boolean;
}

export interface WeekInfo {
  /** ISO week number (1-53) */
  weekNumber: number;
  /** Year */
  year: number;
  /** Start date of the week (Sunday) */
  startDate: string;
  /** End date of the week (Saturday) */
  endDate: string;
}

export interface GraceDayAvailability {
  /** Whether a grace day is available this week */
  isAvailable: boolean;
  /** Number of grace days used this week */
  usedThisWeek: number;
  /** Maximum allowed per week */
  maxPerWeek: number;
  /** Number remaining this week */
  remaining: number;
  /** When the grace day will reset (start of next week) */
  resetsOn: string;
  /** Days until reset */
  daysUntilReset: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** LocalStorage key for grace day state */
export const GRACE_DAY_STORAGE_KEY = 'carddex-grace-day-state';

/** Default state */
export const DEFAULT_GRACE_DAY_STATE: GraceDayState = {
  enabled: true,
  usageHistory: [],
  maxPerWeek: 1,
  weekendPauseEnabled: false,
};

// ============================================================================
// DATE & WEEK UTILITIES
// ============================================================================

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date as YYYY-MM-DD string
 */
export function getYesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
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
 * Get ISO week number and year for a date
 */
export function getISOWeekInfo(dateStr: string): { weekNumber: number; year: number } {
  const date = new Date(dateStr + 'T00:00:00');

  // Get the Thursday of the current week (ISO weeks are defined by Thursday)
  const thursday = new Date(date);
  thursday.setDate(date.getDate() - ((date.getDay() + 6) % 7) + 3);

  // Get the first Thursday of the year
  const firstThursday = new Date(thursday.getFullYear(), 0, 1);
  if (firstThursday.getDay() !== 4) {
    firstThursday.setMonth(0, 1 + ((4 - firstThursday.getDay() + 7) % 7));
  }

  // Calculate week number
  const weekNumber =
    1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));

  return {
    weekNumber,
    year: thursday.getFullYear(),
  };
}

/**
 * Get the start (Sunday) and end (Saturday) of the week containing a date
 */
export function getWeekBoundaries(dateStr: string): { startDate: string; endDate: string } {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay(); // 0 = Sunday

  // Calculate Sunday (start of week)
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - dayOfWeek);

  // Calculate Saturday (end of week)
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  return {
    startDate: sunday.toISOString().split('T')[0],
    endDate: saturday.toISOString().split('T')[0],
  };
}

/**
 * Get full week info for a date
 */
export function getWeekInfo(dateStr: string): WeekInfo {
  const { weekNumber, year } = getISOWeekInfo(dateStr);
  const { startDate, endDate } = getWeekBoundaries(dateStr);
  return { weekNumber, year, startDate, endDate };
}

/**
 * Check if two dates are in the same week
 */
export function isSameWeek(date1: string, date2: string): boolean {
  const week1 = getISOWeekInfo(date1);
  const week2 = getISOWeekInfo(date2);
  return week1.weekNumber === week2.weekNumber && week1.year === week2.year;
}

/**
 * Get the number of days between two dates
 */
export function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00');
  const d2 = new Date(date2 + 'T00:00:00');
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Check if date1 is exactly one day after date2
 */
export function isNextDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1 + 'T00:00:00');
  const d2 = new Date(date2 + 'T00:00:00');
  const diffMs = d1.getTime() - d2.getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);
  return diffDays === 1;
}

/**
 * Get the day of week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getDay();
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(dateStr: string): boolean {
  const dayOfWeek = getDayOfWeek(dateStr);
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
}

/**
 * Get weekend info for display
 */
export function getWeekendDayName(dateStr: string): string | null {
  const dayOfWeek = getDayOfWeek(dateStr);
  if (dayOfWeek === 0) return 'Sunday';
  if (dayOfWeek === 6) return 'Saturday';
  return null;
}

/**
 * Check if today is a weekend
 */
export function isTodayWeekend(): boolean {
  return isWeekend(getToday());
}

/**
 * Check if a date should be skipped due to weekend pause
 */
export function isWeekendPaused(dateStr: string, weekendPauseEnabled: boolean): boolean {
  return weekendPauseEnabled && isWeekend(dateStr);
}

// ============================================================================
// GRACE DAY LOGIC
// ============================================================================

/**
 * Count grace days used in a specific week
 */
export function getGraceDaysUsedInWeek(
  usageHistory: GraceDayUsage[],
  dateStr: string = getToday()
): number {
  const { weekNumber, year } = getISOWeekInfo(dateStr);
  return usageHistory.filter((usage) => usage.weekNumber === weekNumber && usage.year === year)
    .length;
}

/**
 * Check if a grace day is available for use
 */
export function checkGraceDayAvailability(
  state: GraceDayState,
  dateStr: string = getToday()
): GraceDayAvailability {
  const usedThisWeek = getGraceDaysUsedInWeek(state.usageHistory, dateStr);
  const remaining = Math.max(0, state.maxPerWeek - usedThisWeek);
  const isAvailable = state.enabled && remaining > 0;

  // Calculate when it resets (next Sunday)
  const { endDate } = getWeekBoundaries(dateStr);
  const saturday = new Date(endDate + 'T00:00:00');
  const nextSunday = new Date(saturday);
  nextSunday.setDate(saturday.getDate() + 1);
  const resetsOn = nextSunday.toISOString().split('T')[0];

  // Days until reset
  const today = new Date(dateStr + 'T00:00:00');
  const daysUntilReset = Math.ceil(
    (nextSunday.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );

  return {
    isAvailable,
    usedThisWeek,
    maxPerWeek: state.maxPerWeek,
    remaining,
    resetsOn,
    daysUntilReset,
  };
}

/**
 * Determine if a streak gap can be protected by a grace day
 *
 * A gap can be protected if:
 * 1. Grace days are enabled
 * 2. The gap is exactly 1 day (yesterday was missed)
 * 3. A grace day is available this week
 * 4. The missed day hasn't already been protected
 */
export function canProtectStreakGap(
  state: GraceDayState,
  lastActivityDate: string,
  checkDate: string = getToday()
): { canProtect: boolean; missedDate: string | null; reason: string } {
  // Check if enabled
  if (!state.enabled) {
    return {
      canProtect: false,
      missedDate: null,
      reason: 'Grace day protection is disabled',
    };
  }

  const today = new Date(checkDate + 'T00:00:00');
  const lastActive = new Date(lastActivityDate + 'T00:00:00');

  // Calculate gap
  const diffMs = today.getTime() - lastActive.getTime();
  const gapDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  // If activity was today or yesterday, no protection needed
  if (gapDays <= 1) {
    return {
      canProtect: false,
      missedDate: null,
      reason: gapDays === 0 ? 'Active today' : 'Active yesterday - streak continues',
    };
  }

  // If gap is exactly 2 days (missed yesterday), we can potentially protect
  if (gapDays === 2) {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const missedDate = yesterday.toISOString().split('T')[0];

    // Check if this date was already protected
    const alreadyProtected = state.usageHistory.some((usage) => usage.missedDate === missedDate);
    if (alreadyProtected) {
      return {
        canProtect: false,
        missedDate,
        reason: 'This day was already protected by a grace day',
      };
    }

    // Check availability
    const availability = checkGraceDayAvailability(state, checkDate);
    if (!availability.isAvailable) {
      return {
        canProtect: false,
        missedDate,
        reason: `No grace days remaining this week (${availability.usedThisWeek}/${availability.maxPerWeek} used)`,
      };
    }

    return {
      canProtect: true,
      missedDate,
      reason: 'Grace day available to protect missed day',
    };
  }

  // Gap is too large (3+ days) - grace days can only save a single missed day
  return {
    canProtect: false,
    missedDate: null,
    reason: `Gap too large (${gapDays - 1} days missed). Grace days only protect 1 missed day.`,
  };
}

/**
 * Consume a grace day to protect a streak
 */
export function consumeGraceDay(
  state: GraceDayState,
  missedDate: string,
  currentStreak: number
): GraceDayState {
  const today = getToday();
  const { weekNumber, year } = getISOWeekInfo(today);

  const newUsage: GraceDayUsage = {
    usedOn: today,
    weekNumber,
    year,
    missedDate,
    streakAtUse: currentStreak,
  };

  return {
    ...state,
    usageHistory: [...state.usageHistory, newUsage],
  };
}

/**
 * Calculate streak with grace day protection
 *
 * Returns the effective streak considering grace days used
 */
export function calculateStreakWithGraceDays(
  activityDates: string[],
  graceDayState: GraceDayState
): {
  currentStreak: number;
  effectiveStreak: number;
  graceDaysUsedInStreak: number;
  isProtected: boolean;
  protectedDates: string[];
} {
  if (activityDates.length === 0) {
    return {
      currentStreak: 0,
      effectiveStreak: 0,
      graceDaysUsedInStreak: 0,
      isProtected: false,
      protectedDates: [],
    };
  }

  // Sort dates descending (most recent first)
  const sortedDates = [...activityDates].sort((a, b) => b.localeCompare(a));
  const today = getToday();
  const yesterday = getYesterday();

  // Build a set of protected dates
  const protectedDateSet = new Set(graceDayState.usageHistory.map((u) => u.missedDate));

  // Start counting streak
  let effectiveStreak = 0;
  let graceDaysUsedInStreak = 0;
  const protectedDates: string[] = [];

  // Check if last activity qualifies for streak (today or yesterday)
  const mostRecentActivity = sortedDates[0];
  if (mostRecentActivity !== today && mostRecentActivity !== yesterday) {
    // Check if yesterday is protected and day before yesterday had activity
    if (protectedDateSet.has(yesterday)) {
      const dayBeforeYesterday = getDateDaysAgo(2);
      if (sortedDates.includes(dayBeforeYesterday)) {
        // Yesterday is protected, continue counting
      } else {
        return {
          currentStreak: 0,
          effectiveStreak: 0,
          graceDaysUsedInStreak: 0,
          isProtected: false,
          protectedDates: [],
        };
      }
    } else {
      return {
        currentStreak: 0,
        effectiveStreak: 0,
        graceDaysUsedInStreak: 0,
        isProtected: false,
        protectedDates: [],
      };
    }
  }

  // Walk through dates counting the streak
  let currentDateStr = today;
  const activitySet = new Set(sortedDates);

  while (true) {
    if (activitySet.has(currentDateStr)) {
      // Activity on this day - count it
      effectiveStreak++;
    } else if (protectedDateSet.has(currentDateStr)) {
      // Protected by grace day - count it but track
      effectiveStreak++;
      graceDaysUsedInStreak++;
      protectedDates.push(currentDateStr);
    } else if (currentDateStr === today) {
      // No activity today but might be continued from yesterday
      // Don't count, just move to yesterday
    } else {
      // Gap in streak with no protection - stop counting
      break;
    }

    // Move to previous day
    const currentDate = new Date(currentDateStr + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() - 1);
    currentDateStr = currentDate.toISOString().split('T')[0];

    // Safety limit - don't go back more than 365 days
    if (getDaysBetween(currentDateStr, today) > 365) {
      break;
    }
  }

  // Calculate actual streak without grace day protection
  const currentStreak = effectiveStreak - graceDaysUsedInStreak;

  return {
    currentStreak,
    effectiveStreak,
    graceDaysUsedInStreak,
    isProtected: graceDaysUsedInStreak > 0,
    protectedDates,
  };
}

// ============================================================================
// LOCALSTORAGE PERSISTENCE
// ============================================================================

/**
 * Save grace day state to localStorage
 */
export function saveGraceDayState(state: GraceDayState): void {
  if (typeof window === 'undefined') return;

  try {
    // Clean up old usage history (keep last 52 weeks / 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const cutoffYear = oneYearAgo.getFullYear();
    const cutoffWeek = getISOWeekInfo(oneYearAgo.toISOString().split('T')[0]).weekNumber;

    const cleanedHistory = state.usageHistory.filter((usage) => {
      if (usage.year > cutoffYear) return true;
      if (usage.year === cutoffYear && usage.weekNumber >= cutoffWeek) return true;
      return false;
    });

    const stateToSave = {
      ...state,
      usageHistory: cleanedHistory,
    };

    localStorage.setItem(GRACE_DAY_STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to save grace day state:', error);
  }
}

/**
 * Load grace day state from localStorage
 */
export function loadGraceDayState(): GraceDayState {
  if (typeof window === 'undefined') return DEFAULT_GRACE_DAY_STATE;

  try {
    const saved = localStorage.getItem(GRACE_DAY_STORAGE_KEY);
    if (!saved) return DEFAULT_GRACE_DAY_STATE;

    const parsed = JSON.parse(saved);

    // Validate structure
    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULT_GRACE_DAY_STATE;
    }

    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      usageHistory: Array.isArray(parsed.usageHistory) ? parsed.usageHistory : [],
      maxPerWeek: typeof parsed.maxPerWeek === 'number' ? parsed.maxPerWeek : 1,
      weekendPauseEnabled:
        typeof parsed.weekendPauseEnabled === 'boolean' ? parsed.weekendPauseEnabled : false,
    };
  } catch (error) {
    console.error('Failed to load grace day state:', error);
    return DEFAULT_GRACE_DAY_STATE;
  }
}

/**
 * Clear grace day state from localStorage
 */
export function clearGraceDayState(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(GRACE_DAY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear grace day state:', error);
  }
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Format grace day availability for display
 */
export function formatGraceDayStatus(availability: GraceDayAvailability): string {
  if (availability.isAvailable) {
    return `${availability.remaining} grace day${availability.remaining !== 1 ? 's' : ''} available`;
  }
  return `Grace day used this week (resets in ${availability.daysUntilReset} day${availability.daysUntilReset !== 1 ? 's' : ''})`;
}

/**
 * Get a user-friendly description of grace day protection
 */
export function getGraceDayDescription(): string {
  return 'You get 1 free "grace day" per week. If you miss a day, your streak will be protected automatically!';
}

/**
 * Get tooltip text for grace day indicator
 */
export function getGraceDayTooltip(availability: GraceDayAvailability): string {
  if (availability.isAvailable) {
    return `Grace day protection active: Miss 1 day without breaking your streak. Resets every Sunday.`;
  }
  return `Grace day already used this week. A new grace day will be available on ${availability.resetsOn}.`;
}

/**
 * Get aria-label for grace day status
 */
export function getGraceDayAriaLabel(availability: GraceDayAvailability): string {
  return `Grace day protection: ${availability.remaining} of ${availability.maxPerWeek} available this week. ${availability.isAvailable ? 'Protection is active.' : `Resets in ${availability.daysUntilReset} days.`}`;
}

/**
 * Get color class based on grace day availability
 */
export function getGraceDayColorClass(availability: GraceDayAvailability): string {
  if (availability.isAvailable) {
    return 'text-emerald-600';
  }
  return 'text-amber-600';
}

// ============================================================================
// WEEKEND PAUSE DISPLAY HELPERS
// ============================================================================

/**
 * Get description of weekend pause feature
 */
export function getWeekendPauseDescription(): string {
  return 'Pause your streak requirements on weekends. Saturday and Sunday won\'t count toward your streak, but won\'t break it either!';
}

/**
 * Get tooltip text for weekend pause toggle
 */
export function getWeekendPauseTooltip(enabled: boolean): string {
  if (enabled) {
    return 'Weekend pause is ON: Your streak is protected on Saturday and Sunday. You can still add cards, but missing these days won\'t break your streak.';
  }
  return 'Weekend pause is OFF: Weekends count toward your streak like any other day. Enable this to take weekends off without losing your streak!';
}

/**
 * Get aria-label for weekend pause status
 */
export function getWeekendPauseAriaLabel(enabled: boolean): string {
  return `Weekend pause: ${enabled ? 'Enabled - streak requirements are paused on weekends' : 'Disabled - weekends count toward streak'}`;
}

/**
 * Get status message for weekend pause
 */
export function getWeekendPauseStatus(enabled: boolean): string {
  const todayIsWeekend = isTodayWeekend();
  if (enabled) {
    if (todayIsWeekend) {
      const dayName = getWeekendDayName(getToday());
      return `Active today (${dayName}) - enjoy your break!`;
    }
    return 'Streak paused on weekends';
  }
  return 'Weekends count toward streak';
}
