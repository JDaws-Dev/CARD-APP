import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// ============================================================================
// MILESTONE DEFINITIONS
// ============================================================================

/**
 * Collection milestone thresholds for celebration triggers.
 * These are the thresholds specified in the task: first 10, 50, 100, 500 cards.
 */
export const COLLECTION_MILESTONE_THRESHOLDS = [
  { key: 'milestone_10', threshold: 10, name: 'Getting Started' },
  { key: 'milestone_50', threshold: 50, name: 'Rising Collector' },
  { key: 'milestone_100', threshold: 100, name: 'Century Club' },
  { key: 'milestone_500', threshold: 500, name: 'Master Collector' },
] as const;

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all celebrated milestones for a profile.
 * Returns milestones that have already been shown to the user.
 */
export const getCelebratedMilestones = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('collectionMilestones')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();
  },
});

/**
 * Check if a specific milestone has been celebrated.
 */
export const hasCelebratedMilestone = query({
  args: {
    profileId: v.id('profiles'),
    milestoneKey: v.string(),
  },
  handler: async (ctx, args) => {
    const milestone = await ctx.db
      .query('collectionMilestones')
      .withIndex('by_profile_and_key', (q) =>
        q.eq('profileId', args.profileId).eq('milestoneKey', args.milestoneKey)
      )
      .first();

    return !!milestone;
  },
});

/**
 * Get milestone progress for a profile.
 * Returns current card count, milestones reached, next milestone, and celebration data.
 */
export const getMilestoneProgress = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get unique card count
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Count unique cardIds (ignoring variants)
    const uniqueCardIds = new Set(collectionCards.map((c) => c.cardId));
    const currentCount = uniqueCardIds.size;

    // Get celebrated milestones
    const celebratedMilestones = await ctx.db
      .query('collectionMilestones')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const celebratedKeys = new Set(celebratedMilestones.map((m) => m.milestoneKey));

    // Build milestone progress
    const milestoneProgress = COLLECTION_MILESTONE_THRESHOLDS.map((milestone) => {
      const reached = currentCount >= milestone.threshold;
      const celebrated = celebratedKeys.has(milestone.key);
      const celebrationRecord = celebrated
        ? celebratedMilestones.find((m) => m.milestoneKey === milestone.key)
        : null;

      return {
        key: milestone.key,
        name: milestone.name,
        threshold: milestone.threshold,
        reached,
        celebrated,
        celebratedAt: celebrationRecord?.celebratedAt ?? null,
        cardCountAtReach: celebrationRecord?.cardCountAtReach ?? null,
        progress: Math.min(100, Math.round((currentCount / milestone.threshold) * 100)),
        cardsNeeded: reached ? 0 : milestone.threshold - currentCount,
      };
    });

    // Find current milestone (highest reached)
    const currentMilestone = [...COLLECTION_MILESTONE_THRESHOLDS]
      .reverse()
      .find((m) => currentCount >= m.threshold);

    // Find next milestone
    const nextMilestone = COLLECTION_MILESTONE_THRESHOLDS.find((m) => currentCount < m.threshold);

    return {
      currentCount,
      milestones: milestoneProgress,
      currentMilestone: currentMilestone
        ? {
            key: currentMilestone.key,
            name: currentMilestone.name,
            threshold: currentMilestone.threshold,
          }
        : null,
      nextMilestone: nextMilestone
        ? {
            key: nextMilestone.key,
            name: nextMilestone.name,
            threshold: nextMilestone.threshold,
            cardsNeeded: nextMilestone.threshold - currentCount,
            percentProgress: Math.round((currentCount / nextMilestone.threshold) * 100),
          }
        : null,
      totalMilestonesReached: milestoneProgress.filter((m) => m.reached).length,
      totalMilestonesCelebrated: milestoneProgress.filter((m) => m.celebrated).length,
      totalMilestonesAvailable: COLLECTION_MILESTONE_THRESHOLDS.length,
    };
  },
});

/**
 * Check for uncelebrated milestones.
 * Returns milestones that have been reached but not yet celebrated (for UI celebration trigger).
 */
export const getUncelebratedMilestones = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get unique card count
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const uniqueCardIds = new Set(collectionCards.map((c) => c.cardId));
    const currentCount = uniqueCardIds.size;

    // Get celebrated milestones
    const celebratedMilestones = await ctx.db
      .query('collectionMilestones')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const celebratedKeys = new Set(celebratedMilestones.map((m) => m.milestoneKey));

    // Find milestones that are reached but not celebrated
    const uncelebrated = COLLECTION_MILESTONE_THRESHOLDS.filter(
      (milestone) => currentCount >= milestone.threshold && !celebratedKeys.has(milestone.key)
    ).map((milestone) => ({
      key: milestone.key,
      name: milestone.name,
      threshold: milestone.threshold,
    }));

    return {
      uncelebratedMilestones: uncelebrated,
      hasUncelebrated: uncelebrated.length > 0,
      currentCount,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Mark a milestone as celebrated.
 * Called by UI after showing the celebration animation.
 */
export const markMilestoneCelebrated = mutation({
  args: {
    profileId: v.id('profiles'),
    milestoneKey: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate milestone key
    const milestone = COLLECTION_MILESTONE_THRESHOLDS.find((m) => m.key === args.milestoneKey);
    if (!milestone) {
      return { success: false, error: 'Invalid milestone key' };
    }

    // Check if already celebrated
    const existing = await ctx.db
      .query('collectionMilestones')
      .withIndex('by_profile_and_key', (q) =>
        q.eq('profileId', args.profileId).eq('milestoneKey', args.milestoneKey)
      )
      .first();

    if (existing) {
      return { success: false, error: 'Milestone already celebrated', milestoneId: existing._id };
    }

    // Get current card count
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const uniqueCardIds = new Set(collectionCards.map((c) => c.cardId));
    const cardCount = uniqueCardIds.size;

    // Insert milestone celebration record
    const milestoneId = await ctx.db.insert('collectionMilestones', {
      profileId: args.profileId,
      milestoneKey: args.milestoneKey,
      threshold: milestone.threshold,
      cardCountAtReach: cardCount,
      celebratedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'achievement_earned',
      metadata: {
        type: 'collection_milestone',
        milestoneKey: args.milestoneKey,
        milestoneName: milestone.name,
        threshold: milestone.threshold,
        cardCount,
      },
    });

    return { success: true, milestoneId };
  },
});

/**
 * Check and return milestone data after adding cards.
 * Returns celebration data if a new milestone was reached.
 * This is the primary API for UI to check for celebrations.
 */
export const checkMilestoneAfterCardAdd = mutation({
  args: {
    profileId: v.id('profiles'),
    previousCount: v.number(),
  },
  handler: async (ctx, args) => {
    // Get current card count
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const uniqueCardIds = new Set(collectionCards.map((c) => c.cardId));
    const currentCount = uniqueCardIds.size;

    // Get celebrated milestones
    const celebratedMilestones = await ctx.db
      .query('collectionMilestones')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const celebratedKeys = new Set(celebratedMilestones.map((m) => m.milestoneKey));

    // Find milestones that were crossed with this card add
    const crossedMilestones = COLLECTION_MILESTONE_THRESHOLDS.filter(
      (milestone) =>
        currentCount >= milestone.threshold &&
        args.previousCount < milestone.threshold &&
        !celebratedKeys.has(milestone.key)
    );

    if (crossedMilestones.length === 0) {
      return {
        milestoneCrossed: false,
        milestone: null,
        celebrationData: null,
        currentCount,
        previousCount: args.previousCount,
      };
    }

    // Return the highest milestone crossed (most significant)
    const highestMilestone = crossedMilestones[crossedMilestones.length - 1];

    // Celebration data based on milestone level
    const confettiTypes: Record<string, string> = {
      milestone_10: 'basic',
      milestone_50: 'stars',
      milestone_100: 'fireworks',
      milestone_500: 'rainbow',
    };

    const celebrationMessages: Record<string, string> = {
      milestone_10: "You've collected 10 cards! Your collection is off to a great start!",
      milestone_50: "50 cards! You're becoming a real collector now!",
      milestone_100: "100 cards! Welcome to the Century Club! You're a dedicated collector!",
      milestone_500: "500 cards! Incredible! You're a true Pokemon Master Collector!",
    };

    const durations: Record<string, number> = {
      milestone_10: 2000,
      milestone_50: 3000,
      milestone_100: 4000,
      milestone_500: 5000,
    };

    return {
      milestoneCrossed: true,
      milestone: {
        key: highestMilestone.key,
        name: highestMilestone.name,
        threshold: highestMilestone.threshold,
      },
      celebrationData: {
        shouldCelebrate: true,
        message:
          celebrationMessages[highestMilestone.key] ??
          `You've reached ${highestMilestone.threshold} cards!`,
        confettiType: confettiTypes[highestMilestone.key] ?? 'basic',
        duration: durations[highestMilestone.key] ?? 3000,
        icon:
          highestMilestone.key === 'milestone_10'
            ? '🌟'
            : highestMilestone.key === 'milestone_50'
              ? '✨'
              : highestMilestone.key === 'milestone_100'
                ? '🎉'
                : '🏆',
      },
      allCrossedMilestones: crossedMilestones.map((m) => ({
        key: m.key,
        name: m.name,
        threshold: m.threshold,
      })),
      currentCount,
      previousCount: args.previousCount,
    };
  },
});

/**
 * Batch mark multiple milestones as celebrated.
 * Useful when catching up on missed celebrations.
 */
export const markMultipleMilestonesCelebrated = mutation({
  args: {
    profileId: v.id('profiles'),
    milestoneKeys: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Get current card count
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const uniqueCardIds = new Set(collectionCards.map((c) => c.cardId));
    const cardCount = uniqueCardIds.size;

    // Get already celebrated milestones
    const celebratedMilestones = await ctx.db
      .query('collectionMilestones')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const celebratedKeys = new Set(celebratedMilestones.map((m) => m.milestoneKey));

    const results: Array<{ key: string; success: boolean; error?: string }> = [];
    const now = Date.now();

    for (const milestoneKey of args.milestoneKeys) {
      // Validate milestone key
      const milestone = COLLECTION_MILESTONE_THRESHOLDS.find((m) => m.key === milestoneKey);
      if (!milestone) {
        results.push({ key: milestoneKey, success: false, error: 'Invalid milestone key' });
        continue;
      }

      // Skip if already celebrated
      if (celebratedKeys.has(milestoneKey)) {
        results.push({ key: milestoneKey, success: false, error: 'Already celebrated' });
        continue;
      }

      // Insert milestone celebration record
      await ctx.db.insert('collectionMilestones', {
        profileId: args.profileId,
        milestoneKey,
        threshold: milestone.threshold,
        cardCountAtReach: cardCount,
        celebratedAt: now,
      });

      results.push({ key: milestoneKey, success: true });
    }

    return {
      results,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
    };
  },
});

/**
 * Reset all milestones for a profile (for testing/development).
 */
export const resetMilestones = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const milestones = await ctx.db
      .query('collectionMilestones')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    for (const milestone of milestones) {
      await ctx.db.delete(milestone._id);
    }

    return { deletedCount: milestones.length };
  },
});
