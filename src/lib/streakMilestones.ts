/**
 * Streak Milestones Definitions and Utilities
 *
 * This module defines streak milestone thresholds and rewards for daily activity streaks.
 * Milestones at 7, 14, 30, 60, and 100 days unlock special avatar items and badges.
 */

import type { ComponentType } from 'react';
import {
  FireIcon,
  BoltIcon,
  SparklesIcon,
  TrophyIcon,
  StarIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/solid';

// ============================================================================
// TYPES
// ============================================================================

export interface StreakMilestone {
  days: number;
  name: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  gradient: string;
  glowColor: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  // IDs of avatar items unlocked at this milestone
  unlockedItemIds: string[];
}

export interface StreakMilestoneProgress {
  currentStreak: number;
  achievedMilestones: StreakMilestone[];
  nextMilestone: StreakMilestone | null;
  daysToNextMilestone: number;
  progressPercentage: number;
  highestAchievedMilestone: StreakMilestone | null;
}

// ============================================================================
// MILESTONE DEFINITIONS
// ============================================================================

/**
 * Streak milestone thresholds with rewards
 * 7, 14, 30, 60, 100 day milestones
 */
export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    days: 7,
    name: 'Week Warrior',
    title: 'One Week Streak!',
    description: 'You collected cards every day for a full week!',
    icon: FireIcon,
    gradient: 'from-orange-400 to-amber-500',
    glowColor: 'shadow-orange-400/50',
    tier: 'bronze',
    unlockedItemIds: ['frame_streak_silver', 'badge_moon'],
  },
  {
    days: 14,
    name: 'Fortnight Champion',
    title: 'Two Week Streak!',
    description: 'Two weeks of dedication! Your collection is growing fast.',
    icon: BoltIcon,
    gradient: 'from-amber-400 to-yellow-500',
    glowColor: 'shadow-yellow-400/50',
    tier: 'silver',
    unlockedItemIds: ['frame_streak_gold'],
  },
  {
    days: 30,
    name: 'Monthly Master',
    title: 'One Month Streak!',
    description: 'A full month of collecting! You are a true dedicated collector.',
    icon: TrophyIcon,
    gradient: 'from-yellow-400 via-amber-300 to-orange-400',
    glowColor: 'shadow-amber-400/50',
    tier: 'gold',
    unlockedItemIds: ['frame_streak_platinum', 'badge_streak_30'],
  },
  {
    days: 60,
    name: 'Season Collector',
    title: 'Two Month Streak!',
    description: 'Sixty days of dedication! Your consistency is legendary.',
    icon: StarIcon,
    gradient: 'from-purple-400 to-pink-500',
    glowColor: 'shadow-purple-400/50',
    tier: 'platinum',
    unlockedItemIds: ['frame_streak_diamond', 'badge_streak_60', 'hat_streak_master'],
  },
  {
    days: 100,
    name: 'Legendary Collector',
    title: '100 Day Streak!',
    description: 'One hundred days! You have achieved legendary collector status!',
    icon: RocketLaunchIcon,
    gradient: 'from-indigo-500 via-purple-400 to-pink-500',
    glowColor: 'shadow-indigo-400/50',
    tier: 'diamond',
    unlockedItemIds: ['frame_streak_legendary', 'badge_streak_100', 'hat_streak_legend'],
  },
];

/**
 * Tier configuration for visual styling
 */
export const TIER_CONFIG: Record<
  StreakMilestone['tier'],
  { label: string; bgColor: string; textColor: string; borderColor: string }
> = {
  bronze: {
    label: 'Bronze',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
  },
  silver: {
    label: 'Silver',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
  },
  gold: {
    label: 'Gold',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300',
  },
  platinum: {
    label: 'Platinum',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
  },
  diamond: {
    label: 'Diamond',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-300',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a streak milestone by days
 */
export function getMilestoneByDays(days: number): StreakMilestone | undefined {
  return STREAK_MILESTONES.find((m) => m.days === days);
}

/**
 * Get all milestones achieved for a given streak
 */
export function getAchievedMilestones(currentStreak: number): StreakMilestone[] {
  return STREAK_MILESTONES.filter((m) => currentStreak >= m.days);
}

/**
 * Get the next milestone to achieve
 */
export function getNextMilestone(currentStreak: number): StreakMilestone | null {
  const next = STREAK_MILESTONES.find((m) => currentStreak < m.days);
  return next || null;
}

/**
 * Get the highest achieved milestone
 */
export function getHighestMilestone(currentStreak: number): StreakMilestone | null {
  const achieved = getAchievedMilestones(currentStreak);
  return achieved.length > 0 ? achieved[achieved.length - 1] : null;
}

/**
 * Calculate days remaining to next milestone
 */
export function getDaysToNextMilestone(currentStreak: number): number {
  const next = getNextMilestone(currentStreak);
  if (!next) return 0;
  return next.days - currentStreak;
}

/**
 * Calculate progress percentage toward next milestone
 */
export function getMilestoneProgressPercentage(currentStreak: number): number {
  const next = getNextMilestone(currentStreak);
  if (!next) return 100; // All milestones achieved

  const previous = getHighestMilestone(currentStreak);
  const previousDays = previous ? previous.days : 0;
  const rangeTotal = next.days - previousDays;
  const progress = currentStreak - previousDays;

  return Math.min(100, Math.round((progress / rangeTotal) * 100));
}

/**
 * Get full streak milestone progress info
 */
export function getStreakMilestoneProgress(currentStreak: number): StreakMilestoneProgress {
  return {
    currentStreak,
    achievedMilestones: getAchievedMilestones(currentStreak),
    nextMilestone: getNextMilestone(currentStreak),
    daysToNextMilestone: getDaysToNextMilestone(currentStreak),
    progressPercentage: getMilestoneProgressPercentage(currentStreak),
    highestAchievedMilestone: getHighestMilestone(currentStreak),
  };
}

/**
 * Check if a specific milestone was just achieved (streak equals milestone days exactly)
 */
export function justAchievedMilestone(
  currentStreak: number,
  previousStreak: number
): StreakMilestone | null {
  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak >= milestone.days && previousStreak < milestone.days) {
      return milestone;
    }
  }
  return null;
}

/**
 * Get all avatar item IDs unlocked by achieved milestones
 */
export function getUnlockedItemIds(currentStreak: number): string[] {
  const achieved = getAchievedMilestones(currentStreak);
  return achieved.flatMap((m) => m.unlockedItemIds);
}

/**
 * Get display text for milestone tier
 */
export function getMilestoneTierLabel(tier: StreakMilestone['tier']): string {
  return TIER_CONFIG[tier].label;
}

/**
 * Get encouraging message based on progress
 */
export function getMilestoneEncouragement(currentStreak: number): string {
  const next = getNextMilestone(currentStreak);
  const daysRemaining = getDaysToNextMilestone(currentStreak);

  if (!next) {
    return 'You have achieved all streak milestones! Legendary!';
  }

  if (daysRemaining === 1) {
    return `Just 1 more day to earn ${next.name}!`;
  }

  if (daysRemaining <= 3) {
    return `Almost there! ${daysRemaining} days to ${next.name}!`;
  }

  if (daysRemaining <= 7) {
    return `Getting close! ${daysRemaining} days to ${next.name}.`;
  }

  const progress = getMilestoneProgressPercentage(currentStreak);
  if (progress >= 50) {
    return `Halfway to ${next.name}! Keep it up!`;
  }

  return `${daysRemaining} days to unlock ${next.name}. You can do it!`;
}

/**
 * Format milestone days for display
 */
export function formatMilestoneDays(days: number): string {
  if (days === 7) return '1 week';
  if (days === 14) return '2 weeks';
  if (days === 30) return '1 month';
  if (days === 60) return '2 months';
  if (days === 100) return '100 days';
  return `${days} days`;
}

/**
 * Get milestone index (1-5) for display
 */
export function getMilestoneIndex(milestone: StreakMilestone): number {
  return STREAK_MILESTONES.indexOf(milestone) + 1;
}

/**
 * Get total number of milestones
 */
export function getTotalMilestones(): number {
  return STREAK_MILESTONES.length;
}

/**
 * Check if all milestones are achieved
 */
export function hasAchievedAllMilestones(currentStreak: number): boolean {
  return getAchievedMilestones(currentStreak).length === STREAK_MILESTONES.length;
}
