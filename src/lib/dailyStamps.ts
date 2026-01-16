/**
 * Daily Stamp Collection System
 *
 * Non-consecutive stamp system: collect 5 stamps in a week for a reward.
 * Unlike streaks, stamps don't need to be consecutive - any 5 days in a week counts.
 * Resets weekly on Sunday.
 */

import {
  StarIcon,
  SparklesIcon,
  GiftIcon,
  TrophyIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';
import type { ComponentType } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface StampDay {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Whether stamp was collected on this day */
  collected: boolean;
  /** Day of week (0 = Sunday, 6 = Saturday) */
  dayOfWeek: number;
  /** Day name abbreviation */
  dayName: string;
}

export interface WeeklyStampProgress {
  /** Current week's stamps */
  stamps: StampDay[];
  /** Number of stamps collected this week */
  collectedCount: number;
  /** Target stamps needed for reward */
  targetCount: number;
  /** Whether reward has been earned this week */
  rewardEarned: boolean;
  /** Week start date (Sunday) */
  weekStart: string;
  /** Week end date (Saturday) */
  weekEnd: string;
  /** Days remaining to collect stamps */
  daysRemaining: number;
  /** Stamps still needed for reward */
  stampsNeeded: number;
  /** Whether it's still possible to earn reward this week */
  canStillEarnReward: boolean;
}

export interface StampReward {
  id: string;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  gradient: string;
  xpBonus: number;
  type: 'xp' | 'badge' | 'avatar_item';
}

export interface StampState {
  /** History of collected stamps by date */
  collectedDates: string[];
  /** Weeks where reward was claimed */
  rewardClaimedWeeks: string[];
  /** Total stamps ever collected */
  totalStampsCollected: number;
  /** Total weekly rewards earned */
  totalRewardsEarned: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** LocalStorage key for stamp state */
export const STAMP_STORAGE_KEY = 'carddex-daily-stamps';

/** Number of stamps needed per week for reward */
export const STAMPS_REQUIRED = 5;

/** Days in a week */
export const DAYS_IN_WEEK = 7;

/** Day name abbreviations */
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Day name full */
export const DAY_NAMES_FULL = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** Default stamp state */
export const DEFAULT_STAMP_STATE: StampState = {
  collectedDates: [],
  rewardClaimedWeeks: [],
  totalStampsCollected: 0,
  totalRewardsEarned: 0,
};

/** Weekly reward for collecting 5 stamps */
export const WEEKLY_STAMP_REWARD: StampReward = {
  id: 'weekly_stamp_reward',
  name: 'Weekly Collector',
  description: 'Earned by collecting 5 stamps this week!',
  icon: GiftIcon,
  gradient: 'from-amber-400 via-yellow-400 to-orange-400',
  xpBonus: 25,
  type: 'xp',
};

/** Milestone rewards for total stamps */
export const STAMP_MILESTONES: Array<{
  stamps: number;
  name: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  gradient: string;
}> = [
  {
    stamps: 10,
    name: 'Stamp Starter',
    description: 'Collected 10 stamps!',
    icon: StarIcon,
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    stamps: 25,
    name: 'Stamp Collector',
    description: 'Collected 25 stamps!',
    icon: SparklesIcon,
    gradient: 'from-blue-400 to-indigo-500',
  },
  {
    stamps: 50,
    name: 'Stamp Expert',
    description: 'Collected 50 stamps!',
    icon: TrophyIcon,
    gradient: 'from-purple-400 to-pink-500',
  },
  {
    stamps: 100,
    name: 'Stamp Master',
    description: 'Collected 100 stamps!',
    icon: CheckBadgeIcon,
    gradient: 'from-amber-400 to-orange-500',
  },
];

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
 * Get the start of the current week (Sunday) as YYYY-MM-DD
 */
export function getWeekStart(date?: Date): string {
  const d = date ? new Date(date) : new Date();
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  return d.toISOString().split('T')[0];
}

/**
 * Get the end of the current week (Saturday) as YYYY-MM-DD
 */
export function getWeekEnd(date?: Date): string {
  const d = date ? new Date(date) : new Date();
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  return d.toISOString().split('T')[0];
}

/**
 * Get all dates in the current week
 */
export function getWeekDates(startDate?: Date): string[] {
  const weekStart = new Date(getWeekStart(startDate));
  const dates: string[] = [];
  for (let i = 0; i < DAYS_IN_WEEK; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

/**
 * Get the day of week (0-6) for a date string
 */
export function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00').getDay();
}

/**
 * Check if a date is in the current week
 */
export function isInCurrentWeek(dateStr: string): boolean {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  return dateStr >= weekStart && dateStr <= weekEnd;
}

/**
 * Check if a date is today
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getToday();
}

/**
 * Check if a date is in the past
 */
export function isPastDate(dateStr: string): boolean {
  return dateStr < getToday();
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(dateStr: string): boolean {
  return dateStr > getToday();
}

/**
 * Get days remaining in the current week
 */
export function getDaysRemainingInWeek(): number {
  const today = new Date();
  const dayOfWeek = today.getDay();
  return 6 - dayOfWeek; // Days until Saturday
}

// ============================================================================
// STAMP LOGIC
// ============================================================================

/**
 * Build weekly stamp progress from collected dates
 */
export function buildWeeklyProgress(
  collectedDates: string[],
  rewardClaimedWeeks: string[]
): WeeklyStampProgress {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  const weekDates = getWeekDates();
  const today = getToday();
  const todayDayOfWeek = getDayOfWeek(today);

  // Build stamp days
  const stamps: StampDay[] = weekDates.map((date, index) => ({
    date,
    collected: collectedDates.includes(date),
    dayOfWeek: index,
    dayName: DAY_NAMES[index],
  }));

  const collectedCount = stamps.filter((s) => s.collected).length;
  const rewardEarned = collectedCount >= STAMPS_REQUIRED;
  const daysRemaining = DAYS_IN_WEEK - 1 - todayDayOfWeek;
  const stampsNeeded = Math.max(0, STAMPS_REQUIRED - collectedCount);

  // Check if we've already collected today's stamp
  const todayCollected = collectedDates.includes(today);
  // Potential stamps = collected + remaining days (if haven't collected today, +1)
  const potentialStamps = collectedCount + daysRemaining + (todayCollected ? 0 : 1);
  const canStillEarnReward = potentialStamps >= STAMPS_REQUIRED;

  return {
    stamps,
    collectedCount,
    targetCount: STAMPS_REQUIRED,
    rewardEarned,
    weekStart,
    weekEnd,
    daysRemaining,
    stampsNeeded,
    canStillEarnReward,
  };
}

/**
 * Check if stamp can be collected today
 */
export function canCollectStampToday(collectedDates: string[]): boolean {
  const today = getToday();
  return !collectedDates.includes(today);
}

/**
 * Collect today's stamp
 */
export function collectStamp(state: StampState): StampState {
  const today = getToday();
  if (state.collectedDates.includes(today)) {
    return state; // Already collected
  }

  return {
    ...state,
    collectedDates: [...state.collectedDates, today],
    totalStampsCollected: state.totalStampsCollected + 1,
  };
}

/**
 * Check if weekly reward can be claimed
 */
export function canClaimWeeklyReward(state: StampState): boolean {
  const weekStart = getWeekStart();
  const progress = buildWeeklyProgress(state.collectedDates, state.rewardClaimedWeeks);

  return progress.rewardEarned && !state.rewardClaimedWeeks.includes(weekStart);
}

/**
 * Claim weekly reward
 */
export function claimWeeklyReward(state: StampState): StampState {
  const weekStart = getWeekStart();
  if (!canClaimWeeklyReward(state)) {
    return state;
  }

  return {
    ...state,
    rewardClaimedWeeks: [...state.rewardClaimedWeeks, weekStart],
    totalRewardsEarned: state.totalRewardsEarned + 1,
  };
}

/**
 * Check if a stamp milestone has been reached
 */
export function getReachedMilestones(totalStamps: number): typeof STAMP_MILESTONES {
  return STAMP_MILESTONES.filter((m) => totalStamps >= m.stamps);
}

/**
 * Get the next stamp milestone
 */
export function getNextMilestone(
  totalStamps: number
): (typeof STAMP_MILESTONES)[0] | null {
  return STAMP_MILESTONES.find((m) => totalStamps < m.stamps) ?? null;
}

/**
 * Get progress to next milestone
 */
export function getMilestoneProgress(totalStamps: number): {
  current: number;
  target: number;
  percentage: number;
  milestone: (typeof STAMP_MILESTONES)[0] | null;
} {
  const nextMilestone = getNextMilestone(totalStamps);
  if (!nextMilestone) {
    return {
      current: totalStamps,
      target: totalStamps,
      percentage: 100,
      milestone: null,
    };
  }

  const reached = getReachedMilestones(totalStamps);
  const previousTarget = reached.length > 0 ? reached[reached.length - 1].stamps : 0;
  const current = totalStamps - previousTarget;
  const target = nextMilestone.stamps - previousTarget;

  return {
    current,
    target,
    percentage: Math.round((current / target) * 100),
    milestone: nextMilestone,
  };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Format stamp progress message
 */
export function formatStampProgress(progress: WeeklyStampProgress): string {
  if (progress.rewardEarned) {
    return 'Reward earned! 🎉';
  }
  if (progress.stampsNeeded === 1) {
    return '1 more stamp for your reward!';
  }
  return `${progress.stampsNeeded} more stamps for your reward`;
}

/**
 * Get encouragement message based on progress
 */
export function getEncouragementMessage(progress: WeeklyStampProgress): string {
  const { collectedCount, daysRemaining, canStillEarnReward, rewardEarned } = progress;

  if (rewardEarned) {
    return 'Amazing work this week!';
  }

  if (!canStillEarnReward) {
    return "No worries! There's always next week.";
  }

  if (collectedCount === 0) {
    return 'Start collecting stamps today!';
  }

  if (collectedCount === 4) {
    return "You're so close! One more to go!";
  }

  if (daysRemaining <= 2 && collectedCount >= 3) {
    return "Great progress! You've got this!";
  }

  return 'Keep collecting!';
}

/**
 * Get color class for stamp state
 */
export function getStampColorClass(stamp: StampDay, todayStr: string): string {
  if (stamp.collected) {
    return 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-200';
  }
  if (stamp.date === todayStr) {
    return 'bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 border-2 border-emerald-400 border-dashed';
  }
  if (stamp.date < todayStr) {
    return 'bg-gray-100 text-gray-400';
  }
  return 'bg-gray-50 text-gray-500 border border-gray-200';
}

/**
 * Format total stamps collected message
 */
export function formatTotalStamps(total: number): string {
  if (total === 0) return 'No stamps yet';
  if (total === 1) return '1 stamp collected';
  return `${total} stamps collected`;
}

/**
 * Format total rewards message
 */
export function formatTotalRewards(total: number): string {
  if (total === 0) return 'No weekly rewards yet';
  if (total === 1) return '1 weekly reward earned';
  return `${total} weekly rewards earned`;
}

// ============================================================================
// LOCAL STORAGE
// ============================================================================

/**
 * Save stamp state to localStorage
 */
export function saveStampState(state: StampState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STAMP_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Load stamp state from localStorage
 */
export function loadStampState(): StampState {
  if (typeof window === 'undefined') return DEFAULT_STAMP_STATE;
  try {
    const stored = localStorage.getItem(STAMP_STORAGE_KEY);
    if (!stored) return DEFAULT_STAMP_STATE;
    const parsed = JSON.parse(stored) as StampState;
    // Validate shape
    if (
      !Array.isArray(parsed.collectedDates) ||
      !Array.isArray(parsed.rewardClaimedWeeks)
    ) {
      return DEFAULT_STAMP_STATE;
    }
    return {
      ...DEFAULT_STAMP_STATE,
      ...parsed,
    };
  } catch {
    return DEFAULT_STAMP_STATE;
  }
}

/**
 * Clear stamp state from localStorage
 */
export function clearStampState(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STAMP_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clean up old stamp data (older than 8 weeks)
 */
export function cleanupOldStampData(state: StampState): StampState {
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  const cutoffDate = eightWeeksAgo.toISOString().split('T')[0];

  return {
    ...state,
    collectedDates: state.collectedDates.filter((d) => d >= cutoffDate),
    rewardClaimedWeeks: state.rewardClaimedWeeks.filter((w) => w >= cutoffDate),
  };
}
