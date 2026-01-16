import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// ============================================================================
// LEVEL SYSTEM CONSTANTS (duplicated from src/lib for Convex runtime)
// ============================================================================

const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0, title: 'Rookie Collector' },
  { level: 2, xpRequired: 100, title: 'Novice Collector' },
  { level: 3, xpRequired: 250, title: 'Apprentice Collector' },
  { level: 4, xpRequired: 500, title: 'Card Hunter' },
  { level: 5, xpRequired: 850, title: 'Rising Trainer' },
  { level: 6, xpRequired: 1300, title: 'Skilled Collector' },
  { level: 7, xpRequired: 1850, title: 'Expert Collector' },
  { level: 8, xpRequired: 2500, title: 'Master Collector' },
  { level: 9, xpRequired: 3300, title: 'Elite Trainer' },
  { level: 10, xpRequired: 4200, title: 'Champion Collector' },
  { level: 11, xpRequired: 5200, title: 'Grand Master' },
  { level: 12, xpRequired: 6400, title: 'Pokemon Scholar' },
  { level: 13, xpRequired: 7800, title: 'Legendary Collector' },
  { level: 14, xpRequired: 9400, title: 'Pokemon Professor' },
  { level: 15, xpRequired: 11200, title: 'Collection Legend' },
] as const;

const MAX_LEVEL = LEVEL_THRESHOLDS.length;

const XP_REWARDS = {
  ADD_CARD: 10,
  ADD_CARD_DUPLICATE: 2,
  ADD_HOLOFOIL: 15,
  ADD_REVERSE_HOLOFOIL: 12,
  ADD_FIRST_EDITION: 20,
  SET_COMPLETION_25: 50,
  SET_COMPLETION_50: 100,
  SET_COMPLETION_75: 200,
  SET_COMPLETION_100: 500,
  DAILY_LOGIN: 5,
  DAILY_LOGIN_STREAK_BONUS: 2,
  ACHIEVEMENT_EARNED: 25,
  ACHIEVEMENT_MILESTONE: 50,
  ACHIEVEMENT_STREAK: 30,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateLevelFromXP(xp: number): number {
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

function getLevelInfo(level: number): { level: number; title: string; xpRequired: number } | null {
  const threshold = LEVEL_THRESHOLDS.find((t) => t.level === level);
  if (!threshold) return null;

  return {
    level: threshold.level,
    title: threshold.title,
    xpRequired: threshold.xpRequired,
  };
}

function getNextLevelInfo(
  currentLevel: number
): { level: number; title: string; xpRequired: number } | null {
  const nextLevel = currentLevel + 1;
  if (nextLevel > MAX_LEVEL) return null;
  return getLevelInfo(nextLevel);
}

function calculateCardXP(variant: string | undefined, isDuplicate: boolean): number {
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

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get the XP and level progress for a profile.
 */
export const getXPProgress = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return null;
    }

    const totalXP = profile.xp ?? 0;
    const currentLevel = calculateLevelFromXP(totalXP);
    const levelInfo = getLevelInfo(currentLevel);
    const nextLevelInfo = getNextLevelInfo(currentLevel);

    // Calculate progress within current level
    const currentLevelXP = levelInfo?.xpRequired ?? 0;
    let xpInCurrentLevel = totalXP - currentLevelXP;
    let xpToNextLevel = 0;
    let percentToNextLevel = 100;

    if (nextLevelInfo) {
      const xpNeededForNextLevel = nextLevelInfo.xpRequired - currentLevelXP;
      xpToNextLevel = nextLevelInfo.xpRequired - totalXP;
      percentToNextLevel = Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100);
      percentToNextLevel = Math.min(100, Math.max(0, percentToNextLevel));
    }

    return {
      profileId: args.profileId,
      totalXP,
      currentLevel,
      currentTitle: levelInfo?.title ?? 'Unknown',
      xpInCurrentLevel,
      xpToNextLevel,
      percentToNextLevel,
      isMaxLevel: currentLevel >= MAX_LEVEL,
      nextLevel: nextLevelInfo
        ? {
            level: nextLevelInfo.level,
            title: nextLevelInfo.title,
            xpRequired: nextLevelInfo.xpRequired,
          }
        : null,
    };
  },
});

/**
 * Get all level thresholds (for UI display).
 */
export const getLevelThresholds = query({
  args: {},
  handler: async () => {
    return LEVEL_THRESHOLDS.map((t) => ({
      level: t.level,
      title: t.title,
      xpRequired: t.xpRequired,
    }));
  },
});

/**
 * Get XP rewards configuration (for UI display).
 */
export const getXPRewards = query({
  args: {},
  handler: async () => {
    return XP_REWARDS;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Award XP to a profile for a specific action.
 * Returns the new XP total and any level up information.
 */
export const awardXP = mutation({
  args: {
    profileId: v.id('profiles'),
    xpAmount: v.number(),
    action: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    if (args.xpAmount <= 0) {
      throw new Error('XP amount must be positive');
    }

    const currentXP = profile.xp ?? 0;
    const currentLevel = calculateLevelFromXP(currentXP);

    const newXP = currentXP + args.xpAmount;
    const newLevel = calculateLevelFromXP(newXP);

    // Update profile with new XP and level
    await ctx.db.patch(args.profileId, {
      xp: newXP,
      level: newLevel,
    });

    // Log the XP gain activity
    await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'card_added', // Using card_added as generic activity type for now
      metadata: {
        xpGained: args.xpAmount,
        xpAction: args.action,
        totalXP: newXP,
        ...args.metadata,
      },
    });

    // Check for level up
    const leveledUp = newLevel > currentLevel;
    const newLevelInfo = getLevelInfo(newLevel);

    return {
      previousXP: currentXP,
      newXP,
      xpGained: args.xpAmount,
      previousLevel: currentLevel,
      newLevel,
      leveledUp,
      levelsGained: newLevel - currentLevel,
      newTitle: newLevelInfo?.title ?? 'Unknown',
      nextLevel: getNextLevelInfo(newLevel),
    };
  },
});

/**
 * Award XP for adding a card to collection.
 * Automatically calculates XP based on card variant and duplicate status.
 */
export const awardCardXP = mutation({
  args: {
    profileId: v.id('profiles'),
    cardId: v.string(),
    variant: v.optional(v.string()),
    isDuplicate: v.boolean(),
    cardName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Calculate XP based on card variant and duplicate status
    const xpAmount = calculateCardXP(args.variant, args.isDuplicate);

    const currentXP = profile.xp ?? 0;
    const currentLevel = calculateLevelFromXP(currentXP);

    const newXP = currentXP + xpAmount;
    const newLevel = calculateLevelFromXP(newXP);

    // Update profile
    await ctx.db.patch(args.profileId, {
      xp: newXP,
      level: newLevel,
    });

    const leveledUp = newLevel > currentLevel;
    const newLevelInfo = getLevelInfo(newLevel);

    return {
      xpGained: xpAmount,
      newXP,
      leveledUp,
      previousLevel: currentLevel,
      newLevel,
      newTitle: newLevelInfo?.title ?? 'Unknown',
      action: args.isDuplicate
        ? 'ADD_CARD_DUPLICATE'
        : args.variant === 'holofoil'
          ? 'ADD_HOLOFOIL'
          : args.variant === 'reverseHolofoil'
            ? 'ADD_REVERSE_HOLOFOIL'
            : args.variant === '1stEditionHolofoil' || args.variant === '1stEditionNormal'
              ? 'ADD_FIRST_EDITION'
              : 'ADD_CARD',
    };
  },
});

/**
 * Award XP for earning an achievement.
 */
export const awardAchievementXP = mutation({
  args: {
    profileId: v.id('profiles'),
    achievementType: v.union(
      v.literal('set_completion'),
      v.literal('collector_milestone'),
      v.literal('type_specialist'),
      v.literal('pokemon_fan'),
      v.literal('streak')
    ),
    achievementKey: v.string(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Determine XP based on achievement type
    let xpAmount: number;
    switch (args.achievementType) {
      case 'collector_milestone':
        xpAmount = XP_REWARDS.ACHIEVEMENT_MILESTONE;
        break;
      case 'streak':
        xpAmount = XP_REWARDS.ACHIEVEMENT_STREAK;
        break;
      default:
        xpAmount = XP_REWARDS.ACHIEVEMENT_EARNED;
    }

    const currentXP = profile.xp ?? 0;
    const currentLevel = calculateLevelFromXP(currentXP);

    const newXP = currentXP + xpAmount;
    const newLevel = calculateLevelFromXP(newXP);

    // Update profile
    await ctx.db.patch(args.profileId, {
      xp: newXP,
      level: newLevel,
    });

    const leveledUp = newLevel > currentLevel;
    const newLevelInfo = getLevelInfo(newLevel);

    return {
      xpGained: xpAmount,
      newXP,
      leveledUp,
      previousLevel: currentLevel,
      newLevel,
      newTitle: newLevelInfo?.title ?? 'Unknown',
    };
  },
});

/**
 * Award XP for set completion milestone.
 */
export const awardSetCompletionXP = mutation({
  args: {
    profileId: v.id('profiles'),
    setId: v.string(),
    completionPercentage: v.number(),
    previousPercentage: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Calculate XP for newly crossed milestone
    let xpAmount = 0;

    // Check which milestones were crossed
    if (args.completionPercentage >= 25 && args.previousPercentage < 25) {
      xpAmount += XP_REWARDS.SET_COMPLETION_25;
    }
    if (args.completionPercentage >= 50 && args.previousPercentage < 50) {
      xpAmount += XP_REWARDS.SET_COMPLETION_50;
    }
    if (args.completionPercentage >= 75 && args.previousPercentage < 75) {
      xpAmount += XP_REWARDS.SET_COMPLETION_75;
    }
    if (args.completionPercentage >= 100 && args.previousPercentage < 100) {
      xpAmount += XP_REWARDS.SET_COMPLETION_100;
    }

    if (xpAmount === 0) {
      return {
        xpGained: 0,
        newXP: profile.xp ?? 0,
        leveledUp: false,
        previousLevel: calculateLevelFromXP(profile.xp ?? 0),
        newLevel: calculateLevelFromXP(profile.xp ?? 0),
        newTitle: getLevelInfo(calculateLevelFromXP(profile.xp ?? 0))?.title ?? 'Unknown',
      };
    }

    const currentXP = profile.xp ?? 0;
    const currentLevel = calculateLevelFromXP(currentXP);

    const newXP = currentXP + xpAmount;
    const newLevel = calculateLevelFromXP(newXP);

    // Update profile
    await ctx.db.patch(args.profileId, {
      xp: newXP,
      level: newLevel,
    });

    const leveledUp = newLevel > currentLevel;
    const newLevelInfo = getLevelInfo(newLevel);

    return {
      xpGained: xpAmount,
      newXP,
      leveledUp,
      previousLevel: currentLevel,
      newLevel,
      newTitle: newLevelInfo?.title ?? 'Unknown',
      setId: args.setId,
      milestoneCrossed:
        args.completionPercentage >= 100
          ? 100
          : args.completionPercentage >= 75
            ? 75
            : args.completionPercentage >= 50
              ? 50
              : 25,
    };
  },
});

/**
 * Award daily login XP with streak bonus.
 */
export const awardDailyLoginXP = mutation({
  args: {
    profileId: v.id('profiles'),
    streakDays: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Calculate XP with streak bonus
    const baseXP = XP_REWARDS.DAILY_LOGIN;
    const streakBonus = Math.max(0, args.streakDays - 1) * XP_REWARDS.DAILY_LOGIN_STREAK_BONUS;
    const xpAmount = baseXP + streakBonus;

    const currentXP = profile.xp ?? 0;
    const currentLevel = calculateLevelFromXP(currentXP);

    const newXP = currentXP + xpAmount;
    const newLevel = calculateLevelFromXP(newXP);

    // Update profile
    await ctx.db.patch(args.profileId, {
      xp: newXP,
      level: newLevel,
    });

    const leveledUp = newLevel > currentLevel;
    const newLevelInfo = getLevelInfo(newLevel);

    return {
      xpGained: xpAmount,
      baseXP,
      streakBonus,
      newXP,
      leveledUp,
      previousLevel: currentLevel,
      newLevel,
      newTitle: newLevelInfo?.title ?? 'Unknown',
    };
  },
});

/**
 * Reset XP for a profile (for testing/admin purposes).
 */
export const resetXP = mutation({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    await ctx.db.patch(args.profileId, {
      xp: 0,
      level: 1,
    });

    return {
      previousXP: profile.xp ?? 0,
      previousLevel: profile.level ?? 1,
      newXP: 0,
      newLevel: 1,
    };
  },
});
