import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Action type for consistent typing (matches schema.ts activityLogs.action)
const actionType = v.union(
  v.literal('card_added'),
  v.literal('card_removed'),
  v.literal('achievement_earned'),
  v.literal('trade_completed'),
  v.literal('trade_logged')
);

// Type for trade card entries in trade_logged metadata
interface TradeCardEntry {
  cardId: string;
  cardName: string;
  quantity: number;
  variant: string;
  setName?: string;
}

// Type for trade_logged metadata
interface TradeLoggedMetadata {
  cardsGiven: TradeCardEntry[];
  cardsReceived: TradeCardEntry[];
  tradingPartner?: string | null;
  totalCardsGiven: number;
  totalCardsReceived: number;
}

// Type for enriched trade_logged metadata with summary
interface EnrichedTradeLoggedMetadata extends TradeLoggedMetadata {
  tradeSummary: string;
}

/**
 * Helper function to enrich a trade_logged event with card names and create a summary.
 * Used by all activity queries that need to display trade events.
 */
function enrichTradeLogMetadata(
  metadata: TradeLoggedMetadata | undefined,
  cardNameMap: Map<string, string>
): EnrichedTradeLoggedMetadata | undefined {
  if (!metadata) return undefined;

  const enrichedCardsGiven = (metadata.cardsGiven ?? []).map((card) => ({
    ...card,
    cardName: card.cardName || cardNameMap.get(card.cardId) || card.cardId,
  }));
  const enrichedCardsReceived = (metadata.cardsReceived ?? []).map((card) => ({
    ...card,
    cardName: card.cardName || cardNameMap.get(card.cardId) || card.cardId,
  }));

  // Create a human-readable summary for timeline display
  const givenSummary =
    enrichedCardsGiven.length > 0
      ? enrichedCardsGiven
          .map((c) => (c.quantity > 1 ? `${c.quantity}x ${c.cardName}` : c.cardName))
          .join(', ')
      : null;
  const receivedSummary =
    enrichedCardsReceived.length > 0
      ? enrichedCardsReceived
          .map((c) => (c.quantity > 1 ? `${c.quantity}x ${c.cardName}` : c.cardName))
          .join(', ')
      : null;

  // Build formatted summary based on trade direction
  let tradeSummary = '';
  if (givenSummary && receivedSummary) {
    tradeSummary = `Traded ${givenSummary} for ${receivedSummary}`;
  } else if (givenSummary) {
    tradeSummary = `Gave away ${givenSummary}`;
  } else if (receivedSummary) {
    tradeSummary = `Received ${receivedSummary}`;
  }

  if (metadata.tradingPartner) {
    tradeSummary += ` with ${metadata.tradingPartner}`;
  }

  return {
    ...metadata,
    cardsGiven: enrichedCardsGiven,
    cardsReceived: enrichedCardsReceived,
    tradeSummary,
    totalCardsGiven:
      metadata.totalCardsGiven ?? enrichedCardsGiven.reduce((sum, c) => sum + c.quantity, 0),
    totalCardsReceived:
      metadata.totalCardsReceived ?? enrichedCardsReceived.reduce((sum, c) => sum + c.quantity, 0),
  };
}

/**
 * Helper to collect card IDs from trade logs that need name lookup.
 */
function collectTradeCardIds(
  metadata: TradeLoggedMetadata | undefined,
  cardIdsToLookup: Set<string>
): void {
  if (!metadata) return;
  for (const card of metadata.cardsGiven ?? []) {
    if (card.cardId && !card.cardName) {
      cardIdsToLookup.add(card.cardId);
    }
  }
  for (const card of metadata.cardsReceived ?? []) {
    if (card.cardId && !card.cardName) {
      cardIdsToLookup.add(card.cardId);
    }
  }
}

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
 *
 * Handles all action types including:
 * - card_added/card_removed: Single card operations with cardId/cardName
 * - trade_logged: Trade events with cardsGiven/cardsReceived arrays
 * - achievement_earned: Achievement events with achievementKey
 * - trade_completed: Legacy trade completion events
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
      } else if (log.action === 'trade_logged') {
        // For trade_logged events, check if any cards are missing names
        collectTradeCardIds(log.metadata as TradeLoggedMetadata | undefined, cardIdsToLookup);
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
      } else if (log.action === 'trade_logged') {
        // Enrich trade_logged events with card names and formatted summary
        const enrichedMetadata = enrichTradeLogMetadata(
          log.metadata as TradeLoggedMetadata | undefined,
          cardNameMap
        );
        if (enrichedMetadata) {
          return {
            ...log,
            metadata: enrichedMetadata,
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
      } else if (log.action === 'trade_logged') {
        collectTradeCardIds(log.metadata as TradeLoggedMetadata | undefined, cardIdsToLookup);
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
      } else if (log.action === 'trade_logged') {
        const tradeMetadata = enrichTradeLogMetadata(
          log.metadata as TradeLoggedMetadata | undefined,
          cardNameMap
        );
        if (tradeMetadata) {
          enrichedMetadata = tradeMetadata;
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
 * Includes timestamp field for database-level time filtering
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
      timestamp: Date.now(),
    });

    return logId;
  },
});

/**
 * Log a card addition with standard metadata structure
 * Includes timestamp field for database-level time filtering
 */
export const logCardAdded = mutation({
  args: {
    profileId: v.id('profiles'),
    cardId: v.string(),
    cardName: v.optional(v.string()),
    setName: v.optional(v.string()),
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
        setName: args.setName,
        variant: args.variant ?? 'normal',
        quantity: args.quantity ?? 1,
      },
      timestamp: Date.now(),
    });

    return logId;
  },
});

/**
 * Log a card removal with standard metadata structure
 * Includes timestamp field for database-level time filtering
 */
export const logCardRemoved = mutation({
  args: {
    profileId: v.id('profiles'),
    cardId: v.string(),
    cardName: v.optional(v.string()),
    setName: v.optional(v.string()),
    variant: v.optional(v.string()),
    variantsRemoved: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const metadata: Record<string, unknown> = {
      cardId: args.cardId,
      cardName: args.cardName ?? args.cardId,
    };

    if (args.setName) {
      metadata.setName = args.setName;
    }
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
      timestamp: Date.now(),
    });

    return logId;
  },
});

/**
 * Log an achievement being earned
 * Includes timestamp field for database-level time filtering
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
      timestamp: Date.now(),
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
// PAGINATED QUERIES - Cursor-based pagination for large activity histories
// ============================================================================

/**
 * Get paginated activity logs for a profile.
 * Uses cursor-based pagination instead of offset for efficient large data sets.
 *
 * @param profileId - The profile to fetch activity for
 * @param pageSize - Number of items per page (default 50, max 100)
 * @param cursor - Optional cursor (timestamp) from previous page to continue from
 * @returns Page of logs with cursor for next page and metadata
 */
export const getRecentActivityPaginated = query({
  args: {
    profileId: v.id('profiles'),
    pageSize: v.optional(v.number()),
    cursor: v.optional(v.number()), // Timestamp cursor - fetch items older than this
  },
  handler: async (ctx, args) => {
    // Clamp page size between 1 and 100
    const pageSize = Math.min(Math.max(args.pageSize ?? 50, 1), 100);

    // Build query with index
    let query = ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc');

    // If we have a cursor, we need to filter manually since Convex doesn't support
    // starting from a specific point in the index directly
    const logs = await query.take(pageSize * 10 + 1); // Fetch extra to find cursor position

    let filteredLogs = logs;
    if (args.cursor !== undefined) {
      // Filter to only include logs older than the cursor
      filteredLogs = logs.filter((log) => log._creationTime < args.cursor!);
    }

    // Take only the page size we need
    const pageLogs = filteredLogs.slice(0, pageSize);

    // Determine if there are more items
    const hasMore = filteredLogs.length > pageSize;

    // Get cursor for next page (timestamp of last item)
    const nextCursor =
      pageLogs.length > 0 ? pageLogs[pageLogs.length - 1]._creationTime : undefined;

    return {
      logs: pageLogs,
      nextCursor: hasMore ? nextCursor : undefined,
      hasMore,
      pageSize,
      totalFetched: pageLogs.length,
    };
  },
});

/**
 * Get paginated activity logs with card names enriched.
 * Combines pagination with card name enrichment for efficient display.
 */
export const getRecentActivityWithNamesPaginated = query({
  args: {
    profileId: v.id('profiles'),
    pageSize: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pageSize = Math.min(Math.max(args.pageSize ?? 50, 1), 100);

    let query = ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc');

    const logs = await query.take(pageSize * 10 + 1);

    let filteredLogs = logs;
    if (args.cursor !== undefined) {
      filteredLogs = logs.filter((log) => log._creationTime < args.cursor!);
    }

    const pageLogs = filteredLogs.slice(0, pageSize);
    const hasMore = filteredLogs.length > pageSize;
    const nextCursor =
      pageLogs.length > 0 ? pageLogs[pageLogs.length - 1]._creationTime : undefined;

    // Collect all unique cardIds that need name lookup
    const cardIdsToLookup = new Set<string>();
    for (const log of pageLogs) {
      if (log.action === 'card_added' || log.action === 'card_removed') {
        const metadata = log.metadata as { cardId?: string; cardName?: string } | undefined;
        if (metadata?.cardId && !metadata?.cardName) {
          cardIdsToLookup.add(metadata.cardId);
        }
      } else if (log.action === 'trade_logged') {
        collectTradeCardIds(log.metadata as TradeLoggedMetadata | undefined, cardIdsToLookup);
      }
    }

    // Fetch card names from cachedCards in parallel
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
    const enrichedLogs = pageLogs.map((log) => {
      if (log.action === 'card_added' || log.action === 'card_removed') {
        const metadata = log.metadata as
          | { cardId?: string; cardName?: string; [key: string]: unknown }
          | undefined;
        if (metadata?.cardId) {
          const cardName = metadata.cardName ?? cardNameMap.get(metadata.cardId) ?? metadata.cardId;
          return {
            ...log,
            metadata: {
              ...metadata,
              cardName,
            },
          };
        }
      } else if (log.action === 'trade_logged') {
        const enrichedMetadata = enrichTradeLogMetadata(
          log.metadata as TradeLoggedMetadata | undefined,
          cardNameMap
        );
        if (enrichedMetadata) {
          return {
            ...log,
            metadata: enrichedMetadata,
          };
        }
      }
      return log;
    });

    return {
      logs: enrichedLogs,
      nextCursor: hasMore ? nextCursor : undefined,
      hasMore,
      pageSize,
      totalFetched: enrichedLogs.length,
    };
  },
});

/**
 * Get paginated family activity with card names.
 * Efficiently fetches activity across all family profiles with pagination.
 */
export const getFamilyActivityPaginated = query({
  args: {
    familyId: v.id('families'),
    pageSize: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pageSize = Math.min(Math.max(args.pageSize ?? 50, 1), 100);

    // Get all profiles in the family
    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();

    const profileIds = new Set(profiles.map((p) => p._id));

    // For family activity, we need to scan globally since we can't query multiple profiles
    // Use a larger batch to ensure we get enough family-specific logs
    const batchSize = Math.max(pageSize * 10, 500);
    let allLogs = await ctx.db.query('activityLogs').order('desc').take(batchSize);

    // Filter to family profiles
    let familyLogs = allLogs.filter((log) => profileIds.has(log.profileId));

    // Apply cursor filter if provided
    if (args.cursor !== undefined) {
      familyLogs = familyLogs.filter((log) => log._creationTime < args.cursor!);
    }

    // Take only the page size we need
    const pageLogs = familyLogs.slice(0, pageSize);
    const hasMore = familyLogs.length > pageSize;
    const nextCursor =
      pageLogs.length > 0 ? pageLogs[pageLogs.length - 1]._creationTime : undefined;

    // Collect cardIds for name lookup
    const cardIdsToLookup = new Set<string>();
    for (const log of pageLogs) {
      if (log.action === 'card_added' || log.action === 'card_removed') {
        const metadata = log.metadata as { cardId?: string; cardName?: string } | undefined;
        if (metadata?.cardId && !metadata?.cardName) {
          cardIdsToLookup.add(metadata.cardId);
        }
      } else if (log.action === 'trade_logged') {
        collectTradeCardIds(log.metadata as TradeLoggedMetadata | undefined, cardIdsToLookup);
      }
    }

    // Fetch card names in parallel
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
    const enrichedLogs = pageLogs.map((log) => {
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
      } else if (log.action === 'trade_logged') {
        const tradeMetadata = enrichTradeLogMetadata(
          log.metadata as TradeLoggedMetadata | undefined,
          cardNameMap
        );
        if (tradeMetadata) {
          enrichedMetadata = tradeMetadata;
        }
      }

      return {
        ...log,
        metadata: enrichedMetadata,
        profileName: profile?.displayName ?? 'Unknown',
      };
    });

    return {
      logs: enrichedLogs,
      nextCursor: hasMore ? nextCursor : undefined,
      hasMore,
      pageSize,
      totalFetched: enrichedLogs.length,
      familyProfileCount: profiles.length,
    };
  },
});

/**
 * Get paginated activity by action type.
 * Uses compound index for efficient filtering and pagination.
 */
export const getActivityByTypePaginated = query({
  args: {
    profileId: v.id('profiles'),
    action: actionType,
    pageSize: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pageSize = Math.min(Math.max(args.pageSize ?? 50, 1), 100);

    // Use compound index for efficient profile + action filtering
    const logs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile_and_action', (q) =>
        q.eq('profileId', args.profileId).eq('action', args.action)
      )
      .order('desc')
      .take(pageSize * 10 + 1);

    let filteredLogs = logs;
    if (args.cursor !== undefined) {
      filteredLogs = logs.filter((log) => log._creationTime < args.cursor!);
    }

    const pageLogs = filteredLogs.slice(0, pageSize);
    const hasMore = filteredLogs.length > pageSize;
    const nextCursor =
      pageLogs.length > 0 ? pageLogs[pageLogs.length - 1]._creationTime : undefined;

    return {
      logs: pageLogs,
      nextCursor: hasMore ? nextCursor : undefined,
      hasMore,
      pageSize,
      totalFetched: pageLogs.length,
      action: args.action,
    };
  },
});

/**
 * Get paginated activity within a date range.
 * Useful for parent dashboard with time-bounded queries.
 */
export const getActivityByDateRangePaginated = query({
  args: {
    profileId: v.id('profiles'),
    startDate: v.number(), // Unix timestamp (inclusive)
    endDate: v.number(), // Unix timestamp (inclusive)
    pageSize: v.optional(v.number()),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pageSize = Math.min(Math.max(args.pageSize ?? 50, 1), 100);

    // Fetch logs for the profile
    const logs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .take(pageSize * 10 + 1);

    // Filter by date range and cursor
    let filteredLogs = logs.filter(
      (log) => log._creationTime >= args.startDate && log._creationTime <= args.endDate
    );

    if (args.cursor !== undefined) {
      filteredLogs = filteredLogs.filter((log) => log._creationTime < args.cursor!);
    }

    const pageLogs = filteredLogs.slice(0, pageSize);
    const hasMore = filteredLogs.length > pageSize;
    const nextCursor =
      pageLogs.length > 0 ? pageLogs[pageLogs.length - 1]._creationTime : undefined;

    return {
      logs: pageLogs,
      nextCursor: hasMore ? nextCursor : undefined,
      hasMore,
      pageSize,
      totalFetched: pageLogs.length,
      dateRange: {
        start: args.startDate,
        end: args.endDate,
      },
    };
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
