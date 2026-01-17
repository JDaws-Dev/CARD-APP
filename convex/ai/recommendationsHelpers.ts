import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';

/**
 * Recommendations Helper Functions
 *
 * Internal queries and mutations used by the recommendations action.
 * Separated from recommendations.ts because internal functions cannot
 * be in a 'use node' file.
 */

// ============================================================================
// GAME SLUG TYPE
// ============================================================================

const gameSlugValidator = v.union(
  v.literal('pokemon'),
  v.literal('yugioh'),
  v.literal('mtg'),
  v.literal('onepiece'),
  v.literal('lorcana'),
  v.literal('digimon'),
  v.literal('dragonball')
);

// ============================================================================
// COLLECTION ANALYSIS QUERIES
// ============================================================================

/**
 * Analyze collection patterns to understand user preferences
 */
export const analyzeCollectionPatterns = internalQuery({
  args: {
    profileId: v.id('profiles'),
    gameSlug: gameSlugValidator,
  },
  handler: async (ctx, args) => {
    // Get all collection cards for this profile
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    if (collectionCards.length === 0) {
      return {
        totalCards: 0,
        favoriteTypes: [],
        activeSets: [],
        collectionStyle: 'new collector',
        recentTypes: [],
      };
    }

    // Get cached card details
    const cardIds = collectionCards.map((c) => c.cardId);
    const cachedCardsPromises = cardIds.map((cardId) =>
      ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
        .first()
    );
    const cachedCards = await Promise.all(cachedCardsPromises);

    // Filter by game and build analysis
    const typeCount: Record<string, number> = {};
    const setCount: Record<string, { name: string; owned: number; total: number }> = {};
    const rarityCount: Record<string, number> = {};

    for (let i = 0; i < collectionCards.length; i++) {
      const card = collectionCards[i];
      const cachedCard = cachedCards[i];

      if (!cachedCard || cachedCard.gameSlug !== args.gameSlug) continue;

      const quantity = card.quantity;

      // Count types
      for (const type of cachedCard.types || []) {
        typeCount[type] = (typeCount[type] || 0) + quantity;
      }

      // Count by set
      if (!setCount[cachedCard.setId]) {
        setCount[cachedCard.setId] = { name: cachedCard.setId, owned: 0, total: 0 };
      }
      setCount[cachedCard.setId].owned += 1; // Count unique cards, not quantity

      // Count rarities
      const rarity = cachedCard.rarity || 'Common';
      rarityCount[rarity] = (rarityCount[rarity] || 0) + quantity;
    }

    // Get set totals from cachedSets
    const setIds = Object.keys(setCount);
    for (const setId of setIds) {
      const cachedSet = await ctx.db
        .query('cachedSets')
        .withIndex('by_set_id', (q) => q.eq('setId', setId))
        .first();

      if (cachedSet) {
        setCount[setId].name = cachedSet.name;
        setCount[setId].total = cachedSet.totalCards;
      }
    }

    // Sort types by count
    const sortedTypes = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);

    // Sort sets by completion percentage
    const sortedSets = Object.entries(setCount)
      .map(([setId, data]) => ({
        setId,
        name: data.name,
        owned: data.owned,
        total: data.total || 1,
      }))
      .filter((s) => s.total > 0)
      .sort((a, b) => b.owned / b.total - a.owned / a.total);

    // Determine collection style based on patterns
    let collectionStyle = 'casual collector';
    const topSetCompletion = sortedSets[0] ? sortedSets[0].owned / sortedSets[0].total : 0;
    const typeVariety = sortedTypes.length;

    if (topSetCompletion > 0.5) {
      collectionStyle = 'set completionist';
    } else if (typeVariety <= 3 && sortedTypes.length > 0) {
      collectionStyle = 'type specialist';
    } else if (rarityCount['Ultra Rare'] || rarityCount['Secret Rare']) {
      collectionStyle = 'rare hunter';
    }

    // Get recent card additions to understand recent preferences
    const recentActivity = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile_and_action', (q) =>
        q.eq('profileId', args.profileId).eq('action', 'card_added')
      )
      .order('desc')
      .take(10);

    const recentCardIds = recentActivity
      .map((a) => (a.metadata as { cardId?: string })?.cardId)
      .filter((id): id is string => !!id);

    const recentTypesSet = new Set<string>();
    for (const cardId of recentCardIds) {
      const card = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
        .first();
      if (card) {
        for (const type of card.types || []) {
          recentTypesSet.add(type);
        }
      }
    }

    return {
      totalCards: collectionCards.length,
      favoriteTypes: sortedTypes.slice(0, 5),
      activeSets: sortedSets.slice(0, 5),
      collectionStyle,
      recentTypes: Array.from(recentTypesSet).slice(0, 3),
    };
  },
});

/**
 * Get candidate cards for recommendations
 * Returns cards the user doesn't own that match their preferences
 */
export const getCandidateCards = internalQuery({
  args: {
    profileId: v.id('profiles'),
    gameSlug: gameSlugValidator,
    favoriteTypes: v.array(v.string()),
    activeSets: v.array(
      v.object({
        setId: v.string(),
        name: v.string(),
        owned: v.number(),
        total: v.number(),
      })
    ),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all card IDs the user already owns
    const ownedCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const ownedCardIds = new Set(ownedCards.map((c) => c.cardId));

    // Get cards from active sets that the user doesn't own
    const candidates: Array<{
      cardId: string;
      name: string;
      setId: string;
      setName: string;
      rarity: string | undefined;
      types: string[];
      imageSmall: string;
    }> = [];

    // First, get cards from sets the user is actively collecting
    const activeSetIds = args.activeSets.map((s) => s.setId);
    for (const setId of activeSetIds) {
      const setCards = await ctx.db
        .query('cachedCards')
        .withIndex('by_game_and_set', (q) => q.eq('gameSlug', args.gameSlug).eq('setId', setId))
        .take(100);

      for (const card of setCards) {
        if (!ownedCardIds.has(card.cardId)) {
          const setData = args.activeSets.find((s) => s.setId === setId);
          candidates.push({
            cardId: card.cardId,
            name: card.name,
            setId: card.setId,
            setName: setData?.name || card.setId,
            rarity: card.rarity,
            types: card.types,
            imageSmall: card.imageSmall,
          });
        }
      }

      if (candidates.length >= args.limit) break;
    }

    // If we need more candidates, get cards matching favorite types from other sets
    if (candidates.length < args.limit && args.favoriteTypes.length > 0) {
      const gameCards = await ctx.db
        .query('cachedCards')
        .withIndex('by_game', (q) => q.eq('gameSlug', args.gameSlug))
        .take(500);

      for (const card of gameCards) {
        if (ownedCardIds.has(card.cardId)) continue;
        if (candidates.some((c) => c.cardId === card.cardId)) continue;

        // Check if card has any favorite types
        const hasPreferredType = card.types.some((t) => args.favoriteTypes.includes(t));
        if (hasPreferredType) {
          const cachedSet = await ctx.db
            .query('cachedSets')
            .withIndex('by_set_id', (q) => q.eq('setId', card.setId))
            .first();

          candidates.push({
            cardId: card.cardId,
            name: card.name,
            setId: card.setId,
            setName: cachedSet?.name || card.setId,
            rarity: card.rarity,
            types: card.types,
            imageSmall: card.imageSmall,
          });

          if (candidates.length >= args.limit) break;
        }
      }
    }

    return candidates.slice(0, args.limit);
  },
});

/**
 * Get missing cards for set completion recommendations
 */
export const getMissingCardsForSets = internalQuery({
  args: {
    profileId: v.id('profiles'),
    gameSlug: gameSlugValidator,
    setId: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Get owned cards
    const ownedCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const ownedCardIds = new Set(ownedCards.map((c) => c.cardId));

    // Determine which sets to check
    interface SetProgress {
      setId: string;
      name: string;
      owned: number;
      total: number;
    }

    const setProgress: SetProgress[] = [];

    if (args.setId) {
      // Specific set requested
      const cachedSet = await ctx.db
        .query('cachedSets')
        .withIndex('by_set_id', (q) => q.eq('setId', args.setId))
        .first();

      if (cachedSet) {
        const ownedInSet = ownedCards.filter((c) => c.cardId.startsWith(args.setId + '-')).length;

        setProgress.push({
          setId: args.setId,
          name: cachedSet.name,
          owned: ownedInSet,
          total: cachedSet.totalCards,
        });
      }
    } else {
      // Get sets the user is actively working on (has at least 10% completion)
      const setOwnership: Record<string, number> = {};

      for (const card of ownedCards) {
        const cachedCard = await ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', card.cardId))
          .first();

        if (cachedCard && cachedCard.gameSlug === args.gameSlug) {
          setOwnership[cachedCard.setId] = (setOwnership[cachedCard.setId] || 0) + 1;
        }
      }

      // Get set details and calculate completion
      for (const [setId, owned] of Object.entries(setOwnership)) {
        const cachedSet = await ctx.db
          .query('cachedSets')
          .withIndex('by_set_id', (q) => q.eq('setId', setId))
          .first();

        if (cachedSet && cachedSet.totalCards > 0) {
          const completionRate = owned / cachedSet.totalCards;
          // Only include sets with 10-90% completion (not too early, not complete)
          if (completionRate >= 0.1 && completionRate < 0.9) {
            setProgress.push({
              setId,
              name: cachedSet.name,
              owned,
              total: cachedSet.totalCards,
            });
          }
        }
      }

      // Sort by completion percentage (highest first)
      setProgress.sort((a, b) => b.owned / b.total - a.owned / a.total);
    }

    // Get missing cards from these sets
    const missingCards: Array<{
      cardId: string;
      name: string;
      setId: string;
      setName: string;
      rarity: string | undefined;
      imageSmall: string;
      setProgress: { owned: number; total: number };
    }> = [];

    for (const set of setProgress.slice(0, 3)) {
      const setCards = await ctx.db
        .query('cachedCards')
        .withIndex('by_game_and_set', (q) => q.eq('gameSlug', args.gameSlug).eq('setId', set.setId))
        .collect();

      for (const card of setCards) {
        if (!ownedCardIds.has(card.cardId)) {
          missingCards.push({
            cardId: card.cardId,
            name: card.name,
            setId: card.setId,
            setName: set.name,
            rarity: card.rarity,
            imageSmall: card.imageSmall,
            setProgress: { owned: set.owned, total: set.total },
          });

          if (missingCards.length >= args.limit) break;
        }
      }

      if (missingCards.length >= args.limit) break;
    }

    // Sort missing cards by rarity (common first for easier acquisition)
    const rarityOrder: Record<string, number> = {
      Common: 1,
      Uncommon: 2,
      Rare: 3,
      'Rare Holo': 4,
      'Ultra Rare': 5,
      'Secret Rare': 6,
    };

    missingCards.sort((a, b) => {
      const aOrder = rarityOrder[a.rarity || 'Common'] || 0;
      const bOrder = rarityOrder[b.rarity || 'Common'] || 0;
      return aOrder - bOrder;
    });

    return {
      cards: missingCards.slice(0, args.limit),
      activeSets: setProgress,
    };
  },
});

// ============================================================================
// INTERNAL MUTATIONS
// ============================================================================

/**
 * Log recommendation generation for usage tracking
 */
export const logRecommendationGeneration = internalMutation({
  args: {
    profileId: v.id('profiles'),
    familyId: v.id('families'),
    gameSlug: gameSlugValidator,
    recommendationCount: v.number(),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const estimatedCost =
      args.model === 'rule_based'
        ? 0
        : (args.inputTokens * 0.00015 + args.outputTokens * 0.0006) / 1000;

    // Log usage
    await ctx.db.insert('aiUsageLogs', {
      profileId: args.profileId,
      familyId: args.familyId,
      featureType: 'recommendation',
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      estimatedCost,
      gameSlug: args.gameSlug,
      metadata: {
        recommendationCount: args.recommendationCount,
      },
      timestamp: now,
    });

    // Increment rate limit (daily)
    const windowStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate()
    ).getTime();

    const existingRecord = await ctx.db
      .query('aiRateLimits')
      .withIndex('by_profile_feature_window', (q) =>
        q
          .eq('profileId', args.profileId)
          .eq('featureType', 'recommendation')
          .eq('windowType', 'daily')
          .eq('windowStart', windowStart)
      )
      .first();

    if (existingRecord) {
      await ctx.db.patch(existingRecord._id, {
        count: existingRecord.count + 1,
      });
    } else {
      await ctx.db.insert('aiRateLimits', {
        profileId: args.profileId,
        featureType: 'recommendation',
        windowType: 'daily',
        windowStart,
        count: 1,
      });
    }
  },
});
