/**
 * Level System Utilities
 *
 * Pure functions for XP and level calculations.
 * The level system rewards users for:
 * - Adding cards to their collection
 * - Completing sets
 * - Daily logins/activity
 * - Earning achievements
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * XP required to reach each level.
 * Uses a curve where each level requires progressively more XP.
 * Level 1 = 0 XP (starting level)
 * Level 2 = 100 XP
 * Level 3 = 250 XP
 * etc.
 */
export const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0, title: 'Rookie Collector' },
  { level: 2, xpRequired: 100, title: 'Novice Collector' },
  { level: 3, xpRequired: 250, title: 'Apprentice Collector' },
  { level: 4, xpRequired: 500, title: 'Card Hunter' },
  { level: 5, xpRequired: 850, title: 'Rising Star' },
  { level: 6, xpRequired: 1300, title: 'Skilled Collector' },
  { level: 7, xpRequired: 1850, title: 'Expert Collector' },
  { level: 8, xpRequired: 2500, title: 'Master Collector' },
  { level: 9, xpRequired: 3300, title: 'Elite Collector' },
  { level: 10, xpRequired: 4200, title: 'Champion Collector' },
  { level: 11, xpRequired: 5200, title: 'Grand Master' },
  { level: 12, xpRequired: 6400, title: 'Card Scholar' },
  { level: 13, xpRequired: 7800, title: 'Legendary Collector' },
  { level: 14, xpRequired: 9400, title: 'Card Professor' },
  { level: 15, xpRequired: 11200, title: 'Collection Legend' },
] as const;

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

/**
 * XP rewards for various actions
 */
export const XP_REWARDS = {
  // Card actions
  ADD_CARD: 10, // Adding a new unique card
  ADD_CARD_DUPLICATE: 2, // Adding a duplicate card
  ADD_HOLOFOIL: 15, // Adding a holofoil card
  ADD_REVERSE_HOLOFOIL: 12, // Adding a reverse holofoil card
  ADD_FIRST_EDITION: 20, // Adding a 1st edition card

  // Set completion rewards
  SET_COMPLETION_25: 50, // 25% set completion
  SET_COMPLETION_50: 100, // 50% set completion
  SET_COMPLETION_75: 200, // 75% set completion
  SET_COMPLETION_100: 500, // 100% set completion

  // Daily activity
  DAILY_LOGIN: 5, // First activity of the day
  DAILY_LOGIN_STREAK_BONUS: 2, // Extra XP per day of streak (e.g., 7-day streak = +14)

  // Achievement rewards
  ACHIEVEMENT_EARNED: 25, // Earning any achievement
  ACHIEVEMENT_MILESTONE: 50, // Milestone achievements (first_catch, etc.)
  ACHIEVEMENT_STREAK: 30, // Streak achievements
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface LevelInfo {
  level: number;
  title: string;
  xpRequired: number;
}

export interface LevelProgress {
  currentLevel: number;
  currentTitle: string;
  totalXP: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  percentToNextLevel: number;
  isMaxLevel: boolean;
  nextLevel: LevelInfo | null;
}

export interface XPGain {
  action: keyof typeof XP_REWARDS;
  amount: number;
  description: string;
  timestamp?: number;
}

export interface LevelUpResult {
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
  newTitle: string;
  totalXP: number;
}

export type XPAction =
  | 'ADD_CARD'
  | 'ADD_CARD_DUPLICATE'
  | 'ADD_HOLOFOIL'
  | 'ADD_REVERSE_HOLOFOIL'
  | 'ADD_FIRST_EDITION'
  | 'SET_COMPLETION_25'
  | 'SET_COMPLETION_50'
  | 'SET_COMPLETION_75'
  | 'SET_COMPLETION_100'
  | 'DAILY_LOGIN'
  | 'DAILY_LOGIN_STREAK_BONUS'
  | 'ACHIEVEMENT_EARNED'
  | 'ACHIEVEMENT_MILESTONE'
  | 'ACHIEVEMENT_STREAK';

// ============================================================================
// LEVEL CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate the level for a given XP amount.
 * Returns the highest level where XP meets the threshold.
 */
export function calculateLevelFromXP(xp: number): number {
  if (xp < 0) return 1;

  let level = 1;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.xpRequired) {
      level = threshold.level;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Get the level info for a specific level.
 */
export function getLevelInfo(level: number): LevelInfo | null {
  const threshold = LEVEL_THRESHOLDS.find((t) => t.level === level);
  if (!threshold) return null;

  return {
    level: threshold.level,
    title: threshold.title,
    xpRequired: threshold.xpRequired,
  };
}

/**
 * Get the title for a specific level.
 */
export function getLevelTitle(level: number): string {
  const info = getLevelInfo(level);
  return info?.title ?? 'Unknown';
}

/**
 * Get the XP required to reach a specific level.
 */
export function getXPForLevel(level: number): number {
  const info = getLevelInfo(level);
  return info?.xpRequired ?? 0;
}

/**
 * Get the next level info (returns null if at max level).
 */
export function getNextLevelInfo(currentLevel: number): LevelInfo | null {
  const nextLevel = currentLevel + 1;
  if (nextLevel > MAX_LEVEL) return null;
  return getLevelInfo(nextLevel);
}

/**
 * Calculate XP progress within current level.
 */
export function getXPProgress(totalXP: number): {
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  percentToNextLevel: number;
} {
  const currentLevel = calculateLevelFromXP(totalXP);
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelInfo = getNextLevelInfo(currentLevel);

  if (!nextLevelInfo) {
    // At max level
    return {
      xpInCurrentLevel: totalXP - currentLevelXP,
      xpToNextLevel: 0,
      percentToNextLevel: 100,
    };
  }

  const xpInCurrentLevel = totalXP - currentLevelXP;
  const xpNeededForNextLevel = nextLevelInfo.xpRequired - currentLevelXP;
  const xpToNextLevel = nextLevelInfo.xpRequired - totalXP;
  const percentToNextLevel = Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100);

  return {
    xpInCurrentLevel,
    xpToNextLevel,
    percentToNextLevel: Math.min(100, Math.max(0, percentToNextLevel)),
  };
}

/**
 * Get complete level progress information.
 */
export function getLevelProgress(totalXP: number): LevelProgress {
  const currentLevel = calculateLevelFromXP(totalXP);
  const levelInfo = getLevelInfo(currentLevel);
  const nextLevelInfo = getNextLevelInfo(currentLevel);
  const progress = getXPProgress(totalXP);

  return {
    currentLevel,
    currentTitle: levelInfo?.title ?? 'Unknown',
    totalXP,
    xpInCurrentLevel: progress.xpInCurrentLevel,
    xpToNextLevel: progress.xpToNextLevel,
    percentToNextLevel: progress.percentToNextLevel,
    isMaxLevel: currentLevel >= MAX_LEVEL,
    nextLevel: nextLevelInfo,
  };
}

/**
 * Check if XP gain will result in a level up.
 */
export function willLevelUp(currentXP: number, xpGain: number): boolean {
  const currentLevel = calculateLevelFromXP(currentXP);
  const newLevel = calculateLevelFromXP(currentXP + xpGain);
  return newLevel > currentLevel;
}

/**
 * Calculate level up result from XP gain.
 */
export function calculateLevelUp(currentXP: number, xpGain: number): LevelUpResult | null {
  const previousLevel = calculateLevelFromXP(currentXP);
  const totalXP = currentXP + xpGain;
  const newLevel = calculateLevelFromXP(totalXP);

  if (newLevel <= previousLevel) {
    return null;
  }

  const newLevelInfo = getLevelInfo(newLevel);

  return {
    previousLevel,
    newLevel,
    levelsGained: newLevel - previousLevel,
    newTitle: newLevelInfo?.title ?? 'Unknown',
    totalXP,
  };
}

// ============================================================================
// XP CALCULATION FUNCTIONS
// ============================================================================

/**
 * Get the XP reward for an action.
 */
export function getXPReward(action: XPAction): number {
  return XP_REWARDS[action] ?? 0;
}

/**
 * Calculate XP for adding a card based on variant and whether it's a duplicate.
 */
export function calculateCardXP(variant: string | undefined, isDuplicate: boolean): number {
  if (isDuplicate) {
    return XP_REWARDS.ADD_CARD_DUPLICATE;
  }

  switch (variant) {
    case 'holofoil':
      return XP_REWARDS.ADD_HOLOFOIL;
    case 'reverseHolofoil':
      return XP_REWARDS.ADD_REVERSE_HOLOFOIL;
    case '1stEditionHolofoil':
    case '1stEditionNormal':
      return XP_REWARDS.ADD_FIRST_EDITION;
    default:
      return XP_REWARDS.ADD_CARD;
  }
}

/**
 * Calculate XP for set completion milestone.
 */
export function calculateSetCompletionXP(completionPercentage: number): number {
  if (completionPercentage >= 100) return XP_REWARDS.SET_COMPLETION_100;
  if (completionPercentage >= 75) return XP_REWARDS.SET_COMPLETION_75;
  if (completionPercentage >= 50) return XP_REWARDS.SET_COMPLETION_50;
  if (completionPercentage >= 25) return XP_REWARDS.SET_COMPLETION_25;
  return 0;
}

/**
 * Calculate daily login XP with optional streak bonus.
 */
export function calculateDailyLoginXP(streakDays: number): number {
  const baseXP = XP_REWARDS.DAILY_LOGIN;
  const streakBonus = Math.max(0, streakDays - 1) * XP_REWARDS.DAILY_LOGIN_STREAK_BONUS;
  return baseXP + streakBonus;
}

/**
 * Get XP reward description for display.
 */
export function getXPRewardDescription(action: XPAction, amount?: number): string {
  const xp = amount ?? getXPReward(action);
  const descriptions: Record<XPAction, string> = {
    ADD_CARD: 'Added a new card',
    ADD_CARD_DUPLICATE: 'Added a duplicate card',
    ADD_HOLOFOIL: 'Added a holofoil card',
    ADD_REVERSE_HOLOFOIL: 'Added a reverse holofoil card',
    ADD_FIRST_EDITION: 'Added a 1st edition card',
    SET_COMPLETION_25: 'Completed 25% of a set',
    SET_COMPLETION_50: 'Completed 50% of a set',
    SET_COMPLETION_75: 'Completed 75% of a set',
    SET_COMPLETION_100: 'Completed 100% of a set',
    DAILY_LOGIN: 'Daily activity bonus',
    DAILY_LOGIN_STREAK_BONUS: 'Streak bonus',
    ACHIEVEMENT_EARNED: 'Earned an achievement',
    ACHIEVEMENT_MILESTONE: 'Earned a milestone achievement',
    ACHIEVEMENT_STREAK: 'Earned a streak achievement',
  };

  return `${descriptions[action]} (+${xp} XP)`;
}

// ============================================================================
// VALIDATION & UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate that XP amount is non-negative.
 */
export function isValidXP(xp: number): boolean {
  return typeof xp === 'number' && !isNaN(xp) && xp >= 0;
}

/**
 * Validate that level is within valid range.
 */
export function isValidLevel(level: number): boolean {
  return typeof level === 'number' && !isNaN(level) && level >= 1 && level <= MAX_LEVEL;
}

/**
 * Get all level thresholds (for UI display).
 */
export function getAllLevelThresholds(): readonly LevelInfo[] {
  return LEVEL_THRESHOLDS.map((t) => ({
    level: t.level,
    title: t.title,
    xpRequired: t.xpRequired,
  }));
}

/**
 * Get levels earned between two XP amounts.
 */
export function getLevelsEarnedBetween(fromXP: number, toXP: number): LevelInfo[] {
  const fromLevel = calculateLevelFromXP(fromXP);
  const toLevel = calculateLevelFromXP(toXP);

  if (toLevel <= fromLevel) {
    return [];
  }

  const levelsEarned: LevelInfo[] = [];
  for (let level = fromLevel + 1; level <= toLevel; level++) {
    const info = getLevelInfo(level);
    if (info) {
      levelsEarned.push(info);
    }
  }

  return levelsEarned;
}

/**
 * Calculate XP needed to reach a target level from current XP.
 */
export function xpNeededForLevel(currentXP: number, targetLevel: number): number {
  const targetXP = getXPForLevel(targetLevel);
  return Math.max(0, targetXP - currentXP);
}

/**
 * Format XP for display (e.g., "1,234 XP").
 */
export function formatXP(xp: number): string {
  return `${xp.toLocaleString()} XP`;
}

/**
 * Format level for display (e.g., "Level 5").
 */
export function formatLevel(level: number): string {
  return `Level ${level}`;
}

/**
 * Get a motivational message based on progress.
 */
export function getLevelProgressMessage(progress: LevelProgress): string {
  if (progress.isMaxLevel) {
    return "You've reached the highest level! You're a true Collection Legend!";
  }

  if (progress.percentToNextLevel >= 90) {
    return "Almost there! You're so close to leveling up!";
  }

  if (progress.percentToNextLevel >= 50) {
    return 'Halfway to the next level! Keep collecting!';
  }

  if (progress.percentToNextLevel >= 25) {
    return 'Making great progress! Keep it up!';
  }

  return `${progress.xpToNextLevel} XP to reach ${progress.nextLevel?.title ?? 'the next level'}!`;
}

/**
 * Get XP history summary for stats display.
 */
export function summarizeXPGains(gains: XPGain[]): {
  totalXP: number;
  byAction: Record<string, { count: number; totalXP: number }>;
} {
  const byAction: Record<string, { count: number; totalXP: number }> = {};
  let totalXP = 0;

  for (const gain of gains) {
    totalXP += gain.amount;

    if (!byAction[gain.action]) {
      byAction[gain.action] = { count: 0, totalXP: 0 };
    }
    byAction[gain.action].count++;
    byAction[gain.action].totalXP += gain.amount;
  }

  return { totalXP, byAction };
}
