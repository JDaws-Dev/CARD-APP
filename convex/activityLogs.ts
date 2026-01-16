import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Action type for consistent typing
const actionType = v.union(
  v.literal('card_added'),
  v.literal('card_removed'),
  v.literal('achievement_earned')
);

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get recent activity logs for a profile
 * Returns logs sorted by creation time (newest first)
 */
export const getRecentActivity = query({
  args: {
    profileId: v.id('profiles'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const logs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .take(limit);

    return logs;
  },
});

/**
 * Get recent activity logs with card names enriched from cachedCards.
 * This ensures that even legacy logs without cardName in metadata
 * will display proper card names instead of IDs.
 */
export const getRecentActivityWithNames = query({
  args: {
    profileId: v.id('profiles'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const logs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .take(limit);

    // Collect all unique cardIds that need name lookup
    const cardIdsToLookup = new Set<string>();
    for (const log of logs) {
      if (log.action === 'card_added' || log.action === 'card_removed') {
        const metadata = log.metadata as { cardId?: string; cardName?: string } | undefined;
        // Only look up if we have a cardId but no cardName in metadata
        if (metadata?.cardId && !metadata?.cardName) {
          cardIdsToLookup.add(metadata.cardId);
        }
      }
    }

    // Fetch card names from cachedCards
    const cardNameMap = new Map<string, string>();
    if (cardIdsToLookup.size > 0) {
      const cardLookups = await Promise.all(
        Array.from(cardIdsToLookup).map((cardId) =>
          ctx.db
            .query('cachedCards')
            .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
            .first()
        )
      );

      for (const card of cardLookups) {
        if (card) {
          cardNameMap.set(card.cardId, card.name);
        }
      }
    }

    // Enrich logs with card names
    return logs.map((log) => {
      if (log.action === 'card_added' || log.action === 'card_removed') {
        const metadata = log.metadata as
          | { cardId?: string; cardName?: string; [key: string]: unknown }
          | undefined;
        if (metadata?.cardId) {
          // If cardName is missing, look it up from our map
          const cardName = metadata.cardName ?? cardNameMap.get(metadata.cardId) ?? metadata.cardId;
          return {
            ...log,
            metadata: {
              ...metadata,
              cardName,
            },
          };
        }
      }
      return log;
    });
  },
});

/**
 * Get activity logs for a profile within a date range
 * Useful for parent dashboard and streak calculation
 */
export const getActivityByDateRange = query({
  args: {
    profileId: v.id('profiles'),
    startDate: v.number(), // Unix timestamp
    endDate: v.number(), // Unix timestamp
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Filter by date range using _creationTime
    return logs.filter(
      (log) => log._creationTime >= args.startDate && log._creationTime <= args.endDate
    );
  },
});

/**
 * Get activity logs for all profiles in a family (for parent dashboard)
 */
export const getFamilyActivity = query({
  args: {
    familyId: v.id('families'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    // Get all profiles in the family
    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();

    const profileIds = new Set(profiles.map((p) => p._id));

    // Get all activity logs and filter by family profiles
    // Note: In production, we might want a compound index for this
    const allLogs = await ctx.db
      .query('activityLogs')
      .order('desc')
      .take(limit * 4);

    const familyLogs = allLogs.filter((log) => profileIds.has(log.profileId)).slice(0, limit);

    // Enrich with profile names
    const enrichedLogs = familyLogs.map((log) => {
      const profile = profiles.find((p) => p._id === log.profileId);
      return {
        ...log,
        profileName: profile?.displayName ?? 'Unknown',
      };
    });

    return enrichedLogs;
  },
});

/**
 * Get activity logs for all profiles in a family with card names enriched.
 * This ensures legacy logs display card names instead of IDs.
 */
export const getFamilyActivityWithNames = query({
  args: {
    familyId: v.id('families'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    // Get all profiles in the family
    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();

    const profileIds = new Set(profiles.map((p) => p._id));

    // Get all activity logs and filter by family profiles
    const allLogs = await ctx.db
      .query('activityLogs')
      .order('desc')
      .take(limit * 4);

    const familyLogs = allLogs.filter((log) => profileIds.has(log.profileId)).slice(0, limit);

    // Collect all unique cardIds that need name lookup
    const cardIdsToLookup = new Set<string>();
    for (const log of familyLogs) {
      if (log.action === 'card_added' || log.action === 'card_removed') {
        const metadata = log.metadata as { cardId?: string; cardName?: string } | undefined;
        if (metadata?.cardId && !metadata?.cardName) {
          cardIdsToLookup.add(metadata.cardId);
        }
      }
    }

    // Fetch card names from cachedCards
    const cardNameMap = new Map<string, string>();
    if (cardIdsToLookup.size > 0) {
      const cardLookups = await Promise.all(
        Array.from(cardIdsToLookup).map((cardId) =>
          ctx.db
            .query('cachedCards')
            .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
            .first()
        )
      );

      for (const card of cardLookups) {
        if (card) {
          cardNameMap.set(card.cardId, card.name);
        }
      }
    }

    // Enrich with profile names and card names
    const enrichedLogs = familyLogs.map((log) => {
      const profile = profiles.find((p) => p._id === log.profileId);
      let enrichedMetadata = log.metadata;

      if (log.action === 'card_added' || log.action === 'card_removed') {
        const metadata = log.metadata as
          | { cardId?: string; cardName?: string; [key: string]: unknown }
          | undefined;
        if (metadata?.cardId) {
          const cardName = metadata.cardName ?? cardNameMap.get(metadata.cardId) ?? metadata.cardId;
          enrichedMetadata = {
            ...metadata,
            cardName,
          };
        }
      }

      return {
        ...log,
        metadata: enrichedMetadata,
        profileName: profile?.displayName ?? 'Unknown',
      };
    });

    return enrichedLogs;
  },
});

/**
 * Get daily activity summary for a profile (for streak tracking)
 * Returns array of dates (as YYYY-MM-DD strings) when activity occurred
 */
export const getDailyActivityDates = query({
  args: {
    profileId: v.id('profiles'),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysBack = args.daysBack ?? 30;
    const startDate = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    const logs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Filter to date range and only card_added actions (for streaks)
    const recentCardAdds = logs.filter(
      (log) => log._creationTime >= startDate && log.action === 'card_added'
    );

    // Extract unique dates (YYYY-MM-DD format in local timezone)
    const uniqueDates = new Set<string>();
    for (const log of recentCardAdds) {
      const date = new Date(log._creationTime);
      const dateStr = date.toISOString().split('T')[0];
      uniqueDates.add(dateStr);
    }

    return Array.from(uniqueDates).sort();
  },
});

/**
 * Get activity stats for a profile
 */
export const getActivityStats = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const cardsAdded = logs.filter((log) => log.action === 'card_added').length;
    const cardsRemoved = logs.filter((log) => log.action === 'card_removed').length;
    const achievementsEarned = logs.filter((log) => log.action === 'achievement_earned').length;

    // Calculate first and last activity dates
    const sortedLogs = [...logs].sort((a, b) => a._creationTime - b._creationTime);
    const firstActivity = sortedLogs[0]?._creationTime ?? null;
    const lastActivity = sortedLogs[sortedLogs.length - 1]?._creationTime ?? null;

    return {
      totalActions: logs.length,
      cardsAdded,
      cardsRemoved,
      achievementsEarned,
      firstActivity,
      lastActivity,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Log an activity action for a profile
 * This mutation can be called from other mutations or directly
 */
export const logActivity = mutation({
  args: {
    profileId: v.id('profiles'),
    action: actionType,
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: args.action,
      metadata: args.metadata,
    });

    return logId;
  },
});

/**
 * Log a card addition with standard metadata structure
 */
export const logCardAdded = mutation({
  args: {
    profileId: v.id('profiles'),
    cardId: v.string(),
    cardName: v.optional(v.string()),
    variant: v.optional(v.string()),
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'card_added',
      metadata: {
        cardId: args.cardId,
        cardName: args.cardName ?? args.cardId,
        variant: args.variant ?? 'normal',
        quantity: args.quantity ?? 1,
      },
    });

    return logId;
  },
});

/**
 * Log a card removal with standard metadata structure
 */
export const logCardRemoved = mutation({
  args: {
    profileId: v.id('profiles'),
    cardId: v.string(),
    cardName: v.optional(v.string()),
    variant: v.optional(v.string()),
    variantsRemoved: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const metadata: Record<string, unknown> = {
      cardId: args.cardId,
      cardName: args.cardName ?? args.cardId,
    };

    if (args.variant) {
      metadata.variant = args.variant;
    }
    if (args.variantsRemoved) {
      metadata.variantsRemoved = args.variantsRemoved;
    }

    const logId = await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'card_removed',
      metadata,
    });

    return logId;
  },
});

/**
 * Log an achievement being earned
 */
export const logAchievementEarned = mutation({
  args: {
    profileId: v.id('profiles'),
    achievementKey: v.string(),
    achievementType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'achievement_earned',
      metadata: {
        achievementKey: args.achievementKey,
        achievementType: args.achievementType,
      },
    });

    return logId;
  },
});

/**
 * Clear old activity logs (for maintenance/cleanup)
 * Only clears logs older than the specified number of days
 */
export const clearOldLogs = mutation({
  args: {
    profileId: v.id('profiles'),
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffDate = Date.now() - args.olderThanDays * 24 * 60 * 60 * 1000;

    const logs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const oldLogs = logs.filter((log) => log._creationTime < cutoffDate);

    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
    }

    return { deletedCount: oldLogs.length };
  },
});

// ============================================================================
// OPTIMIZED QUERIES - Using compound indexes for better performance
// ============================================================================

/**
 * Get card_added activity logs efficiently using the compound index.
 * Optimized for streak calculation and new cards display.
 */
export const getCardAddedActivity = query({
  args: {
    profileId: v.id('profiles'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    // Use the compound index for efficient filtering by action type
    const logs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile_and_action', (q) =>
        q.eq('profileId', args.profileId).eq('action', 'card_added')
      )
      .order('desc')
      .take(limit);

    return logs;
  },
});

/**
 * Get achievement_earned activity logs efficiently.
 * Useful for recent achievements display.
 */
export const getAchievementEarnedActivity = query({
  args: {
    profileId: v.id('profiles'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Use the compound index for efficient filtering by action type
    const logs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile_and_action', (q) =>
        q.eq('profileId', args.profileId).eq('action', 'achievement_earned')
      )
      .order('desc')
      .take(limit);

    return logs;
  },
});

/**
 * Get activity counts by action type - optimized for dashboard stats.
 */
export const getActivityCountsByType = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Fetch counts using the compound index for each action type
    const [cardAddedLogs, cardRemovedLogs, achievementLogs] = await Promise.all([
      ctx.db
        .query('activityLogs')
        .withIndex('by_profile_and_action', (q) =>
          q.eq('profileId', args.profileId).eq('action', 'card_added')
        )
        .collect(),
      ctx.db
        .query('activityLogs')
        .withIndex('by_profile_and_action', (q) =>
          q.eq('profileId', args.profileId).eq('action', 'card_removed')
        )
        .collect(),
      ctx.db
        .query('activityLogs')
        .withIndex('by_profile_and_action', (q) =>
          q.eq('profileId', args.profileId).eq('action', 'achievement_earned')
        )
        .collect(),
    ]);

    return {
      cardsAdded: cardAddedLogs.length,
      cardsRemoved: cardRemovedLogs.length,
      achievementsEarned: achievementLogs.length,
      totalActions: cardAddedLogs.length + cardRemovedLogs.length + achievementLogs.length,
    };
  },
});

/**
 * Get daily card addition dates for streak calculation - optimized version.
 * Uses the compound index to fetch only card_added events.
 */
export const getDailyCardAdditionDates = query({
  args: {
    profileId: v.id('profiles'),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysBack = args.daysBack ?? 60;
    const startDate = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    // Use compound index to get only card_added events
    const cardAddedLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile_and_action', (q) =>
        q.eq('profileId', args.profileId).eq('action', 'card_added')
      )
      .collect();

    // Filter to date range
    const recentLogs = cardAddedLogs.filter((log) => log._creationTime >= startDate);

    // Extract unique dates (YYYY-MM-DD format)
    const uniqueDates = new Set<string>();
    for (const log of recentLogs) {
      const date = new Date(log._creationTime);
      const dateStr = date.toISOString().split('T')[0];
      uniqueDates.add(dateStr);
    }

    return {
      dates: Array.from(uniqueDates).sort(),
      totalCardAdds: recentLogs.length,
      daysWithActivity: uniqueDates.size,
    };
  },
});
