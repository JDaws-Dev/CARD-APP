import { v } from 'convex/values';
import { internalQuery } from '../_generated/server';

/**
 * Internal queries for chatbot function calling
 *
 * These are separated from Node.js action files because queries
 * must run in the Convex runtime, not Node.js.
 */

/**
 * Get chat history for context
 */
export const getChatHistory = internalQuery({
  args: {
    profileId: v.id('profiles'),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query('aiChatHistory')
      .withIndex('by_profile_and_time', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .take(args.limit);

    // Return in chronological order
    return history.reverse();
  },
});

/**
 * Get collection statistics
 */
export const getCollectionStats = internalQuery({
  args: {
    profileId: v.id('profiles'),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
  },
  handler: async (ctx, args) => {
    // Get all collection cards for this profile
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Get cached card data for enrichment
    const cardIds = collectionCards.map((c) => c.cardId);
    const cachedCards = await Promise.all(
      cardIds.slice(0, 100).map(async (cardId) => {
        return await ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
          .first();
      })
    );

    // Build stats
    const byType: Record<string, number> = {};
    const byRarity: Record<string, number> = {};
    const bySet: Record<string, number> = {};

    let totalCards = 0;

    for (let i = 0; i < collectionCards.length; i++) {
      const card = collectionCards[i];
      const cachedCard = cachedCards[i];

      totalCards += card.quantity;

      if (cachedCard) {
        // Count by type
        for (const type of cachedCard.types || []) {
          byType[type] = (byType[type] || 0) + card.quantity;
        }

        // Count by rarity
        const rarity = cachedCard.rarity || 'Unknown';
        byRarity[rarity] = (byRarity[rarity] || 0) + card.quantity;

        // Count by set
        bySet[cachedCard.setId] = (bySet[cachedCard.setId] || 0) + card.quantity;
      }
    }

    // Get wishlist count
    const wishlistCards = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    return {
      totalCards,
      uniqueCards: collectionCards.length,
      byType,
      byRarity,
      topSets: Object.entries(bySet)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([setId, count]) => ({ setId, count })),
      wishlistCount: wishlistCards.length,
    };
  },
});

/**
 * Search collection
 */
export const searchCollection = internalQuery({
  args: {
    profileId: v.id('profiles'),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
    query: v.optional(v.string()),
    type: v.optional(v.string()),
    rarity: v.optional(v.string()),
    setId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get collection cards
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Get cached card data
    const results: Array<{
      cardId: string;
      name: string;
      type: string[];
      rarity: string;
      setId: string;
      quantity: number;
    }> = [];

    for (const card of collectionCards.slice(0, 50)) {
      const cachedCard = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', card.cardId))
        .first();

      if (!cachedCard) continue;

      // Apply filters
      if (args.query) {
        const queryLower = args.query.toLowerCase();
        if (!cachedCard.name.toLowerCase().includes(queryLower)) continue;
      }

      if (args.type) {
        const typeLower = args.type.toLowerCase();
        if (!cachedCard.types.some((t) => t.toLowerCase().includes(typeLower))) continue;
      }

      if (args.rarity) {
        const rarityLower = args.rarity.toLowerCase();
        if (!cachedCard.rarity?.toLowerCase().includes(rarityLower)) continue;
      }

      if (args.setId && cachedCard.setId !== args.setId) continue;

      results.push({
        cardId: card.cardId,
        name: cachedCard.name,
        type: cachedCard.types,
        rarity: cachedCard.rarity || 'Unknown',
        setId: cachedCard.setId,
        quantity: card.quantity,
      });
    }

    return {
      found: results.length,
      cards: results.slice(0, 10),
    };
  },
});

/**
 * Get rarest cards
 */
export const getRarestCards = internalQuery({
  args: {
    profileId: v.id('profiles'),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Rarity ranking (higher = rarer)
    const rarityRank: Record<string, number> = {
      'Illustration Rare': 100,
      'Special Art Rare': 95,
      'Hyper Rare': 90,
      'Secret Rare': 85,
      'Ultra Rare': 80,
      'Double Rare': 75,
      'Rare Holo': 70,
      'Rare Holo EX': 70,
      'Rare Holo GX': 70,
      'Rare Holo V': 70,
      'Rare Holo VMAX': 75,
      'Rare Holo VSTAR': 75,
      Rare: 50,
      Uncommon: 25,
      Common: 10,
    };

    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const cardsWithRarity: Array<{
      cardId: string;
      name: string;
      rarity: string;
      rarityScore: number;
    }> = [];

    for (const card of collectionCards) {
      const cachedCard = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', card.cardId))
        .first();

      if (cachedCard) {
        const rarity = cachedCard.rarity || 'Common';
        cardsWithRarity.push({
          cardId: card.cardId,
          name: cachedCard.name,
          rarity,
          rarityScore: rarityRank[rarity] || 0,
        });
      }
    }

    // Sort by rarity and return top N
    cardsWithRarity.sort((a, b) => b.rarityScore - a.rarityScore);

    return {
      rarestCards: cardsWithRarity.slice(0, args.limit),
    };
  },
});

/**
 * Get set completion progress
 */
export const getSetProgress = internalQuery({
  args: {
    profileId: v.id('profiles'),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
    setId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Group by set
    const cardsBySet: Record<string, Set<string>> = {};

    for (const card of collectionCards) {
      const cachedCard = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', card.cardId))
        .first();

      if (cachedCard) {
        if (!cardsBySet[cachedCard.setId]) {
          cardsBySet[cachedCard.setId] = new Set();
        }
        cardsBySet[cachedCard.setId].add(card.cardId);
      }
    }

    // Get set totals
    const setProgress: Array<{
      setId: string;
      setName: string;
      owned: number;
      total: number;
      percentage: number;
    }> = [];

    const setIds = args.setId ? [args.setId] : Object.keys(cardsBySet);

    for (const setId of setIds) {
      const cachedSet = await ctx.db
        .query('cachedSets')
        .withIndex('by_set_id', (q) => q.eq('setId', setId))
        .first();

      if (cachedSet) {
        const owned = cardsBySet[setId]?.size || 0;
        setProgress.push({
          setId,
          setName: cachedSet.name,
          owned,
          total: cachedSet.totalCards,
          percentage: Math.round((owned / cachedSet.totalCards) * 100),
        });
      }
    }

    // Sort by completion percentage
    setProgress.sort((a, b) => b.percentage - a.percentage);

    return {
      sets: setProgress.slice(0, 10),
      closestToCompletion: setProgress.filter((s) => s.percentage >= 50).slice(0, 3),
    };
  },
});

/**
 * Get wishlist
 */
export const getWishlist = internalQuery({
  args: {
    profileId: v.id('profiles'),
    gameSlug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
    priorityOnly: v.boolean(),
  },
  handler: async (ctx, args) => {
    const wishlistQuery = ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId));

    const wishlistCards = await wishlistQuery.collect();

    const filtered = args.priorityOnly ? wishlistCards.filter((w) => w.isPriority) : wishlistCards;

    const results: Array<{
      cardId: string;
      name: string;
      isPriority: boolean;
    }> = [];

    for (const wish of filtered.slice(0, 20)) {
      const cachedCard = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', wish.cardId))
        .first();

      results.push({
        cardId: wish.cardId,
        name: cachedCard?.name || 'Unknown Card',
        isPriority: wish.isPriority,
      });
    }

    return {
      totalWishlist: wishlistCards.length,
      priorityCount: wishlistCards.filter((w) => w.isPriority).length,
      cards: results,
    };
  },
});

/**
 * Get recently added cards
 */
export const getRecentlyAdded = internalQuery({
  args: {
    profileId: v.id('profiles'),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Get recent activity logs for card additions
    const recentActivity = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile_and_action', (q) =>
        q.eq('profileId', args.profileId).eq('action', 'card_added')
      )
      .order('desc')
      .take(args.limit);

    const results: Array<{
      cardId: string;
      name: string;
      addedAt: number;
    }> = [];

    for (const activity of recentActivity) {
      const cardId = (activity.metadata as { cardId?: string })?.cardId;
      if (!cardId) continue;

      const cachedCard = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
        .first();

      results.push({
        cardId,
        name: cachedCard?.name || 'Unknown Card',
        addedAt: activity.timestamp || activity._creationTime,
      });
    }

    return { recentCards: results };
  },
});
