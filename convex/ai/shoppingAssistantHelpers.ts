import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';

/**
 * Shopping Assistant Helper Functions
 *
 * Internal queries and mutations used by the shopping assistant action.
 * Separated from shoppingAssistant.ts because internal functions cannot
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
// ACCESS VERIFICATION
// ============================================================================

/**
 * Verify that a parent has access to view a child's profile
 */
export const verifyParentAccess = internalQuery({
  args: {
    parentProfileId: v.id('profiles'),
    childProfileId: v.id('profiles'),
    familyId: v.id('families'),
  },
  handler: async (ctx, args) => {
    const parentProfile = await ctx.db.get(args.parentProfileId);
    const childProfile = await ctx.db.get(args.childProfileId);

    if (!parentProfile || !childProfile) {
      return {
        valid: false,
        childDisplayName: '',
      };
    }

    // Both profiles must be in the same family
    const sameFamily =
      parentProfile.familyId === args.familyId && childProfile.familyId === args.familyId;

    // Parent must be a parent profile (if profileType is set)
    const isParent = !parentProfile.profileType || parentProfile.profileType === 'parent';

    // Can't shop for yourself
    const differentProfiles = args.parentProfileId !== args.childProfileId;

    return {
      valid: sameFamily && isParent && differentProfiles,
      childDisplayName: childProfile.displayName,
    };
  },
});

// ============================================================================
// COLLECTION AND WISHLIST ANALYSIS
// ============================================================================

/**
 * Analyze a child's collection and wishlist for gift suggestions
 */
export const analyzeForGifts = internalQuery({
  args: {
    profileId: v.id('profiles'),
    gameSlug: gameSlugValidator,
  },
  handler: async (ctx, args) => {
    // Get collection cards
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Get wishlist cards
    const wishlistCards = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Filter wishlist by game (if gameSlug is set on wishlist items)
    const filteredWishlist = wishlistCards.filter(
      (w) => !w.gameSlug || w.gameSlug === args.gameSlug
    );

    // Get cached card details for wishlist
    const wishlistDetails: Array<{
      cardId: string;
      name: string;
      setId: string;
      setName: string;
      rarity?: string;
      imageSmall: string;
      marketPrice?: number;
      isPriority: boolean;
      types: string[];
    }> = [];

    for (const wishlistCard of filteredWishlist) {
      const cachedCard = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', wishlistCard.cardId))
        .first();

      if (cachedCard && cachedCard.gameSlug === args.gameSlug) {
        const cachedSet = await ctx.db
          .query('cachedSets')
          .withIndex('by_set_id', (q) => q.eq('setId', cachedCard.setId))
          .first();

        wishlistDetails.push({
          cardId: cachedCard.cardId,
          name: cachedCard.name,
          setId: cachedCard.setId,
          setName: cachedSet?.name || cachedCard.setId,
          rarity: cachedCard.rarity ?? undefined,
          imageSmall: cachedCard.imageSmall,
          marketPrice: cachedCard.priceMarket ?? undefined,
          isPriority: wishlistCard.isPriority,
          types: cachedCard.types,
        });
      }
    }

    // Analyze collection for favorite types and active sets
    const typeCount: Record<string, number> = {};
    const setCount: Record<string, { name: string; owned: number; total: number }> = {};

    for (const card of collectionCards) {
      const cachedCard = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', card.cardId))
        .first();

      if (!cachedCard || cachedCard.gameSlug !== args.gameSlug) continue;

      // Count types
      for (const type of cachedCard.types || []) {
        typeCount[type] = (typeCount[type] || 0) + card.quantity;
      }

      // Count by set
      if (!setCount[cachedCard.setId]) {
        setCount[cachedCard.setId] = { name: cachedCard.setId, owned: 0, total: 0 };
      }
      setCount[cachedCard.setId].owned += 1;
    }

    // Get set totals
    for (const setId of Object.keys(setCount)) {
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
    const favoriteTypes = Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type]) => type);

    // Sort sets by completion percentage
    const activeSets = Object.entries(setCount)
      .map(([setId, data]) => ({
        setId,
        name: data.name,
        owned: data.owned,
        total: data.total || 1,
      }))
      .filter((s) => s.total > 0 && s.owned / s.total >= 0.1) // At least 10% started
      .sort((a, b) => b.owned / b.total - a.owned / a.total);

    // Determine collection style
    let collectionStyle = 'casual collector';
    const topSetCompletion = activeSets[0] ? activeSets[0].owned / activeSets[0].total : 0;
    if (topSetCompletion > 0.5) {
      collectionStyle = 'set completionist';
    } else if (favoriteTypes.length <= 3 && favoriteTypes.length > 0) {
      collectionStyle = 'type specialist';
    }

    return {
      totalCards: collectionCards.length,
      favoriteTypes,
      activeSets,
      collectionStyle,
      wishlistItems: wishlistDetails,
      priorityCount: wishlistDetails.filter((w) => w.isPriority).length,
    };
  },
});

/**
 * Get gift candidate cards
 * Returns wishlist items and set completion cards the child doesn't own
 */
export const getGiftCandidates = internalQuery({
  args: {
    profileId: v.id('profiles'),
    gameSlug: gameSlugValidator,
    budget: v.optional(v.number()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    // Get owned card IDs
    const ownedCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const ownedCardIds = new Set(ownedCards.map((c) => c.cardId));

    // Get wishlist cards
    const wishlistCards = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    interface Candidate {
      cardId: string;
      name: string;
      setId: string;
      setName: string;
      rarity?: string;
      imageSmall: string;
      marketPrice?: number;
      types: string[];
      category: string;
      setCompletionInfo?: {
        cardsOwned: number;
        totalCards: number;
        percentComplete: number;
        cardsNeeded: number;
      };
    }

    const candidates: Candidate[] = [];
    const addedCardIds = new Set<string>();

    // First, add priority wishlist items
    for (const wishlistCard of wishlistCards.filter((w) => w.isPriority)) {
      if (ownedCardIds.has(wishlistCard.cardId)) continue;
      if (addedCardIds.has(wishlistCard.cardId)) continue;

      const cachedCard = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', wishlistCard.cardId))
        .first();

      if (!cachedCard || cachedCard.gameSlug !== args.gameSlug) continue;

      // Check budget if specified
      if (args.budget && cachedCard.priceMarket && cachedCard.priceMarket > args.budget) {
        continue;
      }

      const cachedSet = await ctx.db
        .query('cachedSets')
        .withIndex('by_set_id', (q) => q.eq('setId', cachedCard.setId))
        .first();

      candidates.push({
        cardId: cachedCard.cardId,
        name: cachedCard.name,
        setId: cachedCard.setId,
        setName: cachedSet?.name || cachedCard.setId,
        rarity: cachedCard.rarity ?? undefined,
        imageSmall: cachedCard.imageSmall,
        marketPrice: cachedCard.priceMarket ?? undefined,
        types: cachedCard.types,
        category: 'wishlist_priority',
      });
      addedCardIds.add(cachedCard.cardId);

      if (candidates.length >= args.limit) break;
    }

    // Then add regular wishlist items
    for (const wishlistCard of wishlistCards.filter((w) => !w.isPriority)) {
      if (ownedCardIds.has(wishlistCard.cardId)) continue;
      if (addedCardIds.has(wishlistCard.cardId)) continue;

      const cachedCard = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', wishlistCard.cardId))
        .first();

      if (!cachedCard || cachedCard.gameSlug !== args.gameSlug) continue;

      if (args.budget && cachedCard.priceMarket && cachedCard.priceMarket > args.budget) {
        continue;
      }

      const cachedSet = await ctx.db
        .query('cachedSets')
        .withIndex('by_set_id', (q) => q.eq('setId', cachedCard.setId))
        .first();

      candidates.push({
        cardId: cachedCard.cardId,
        name: cachedCard.name,
        setId: cachedCard.setId,
        setName: cachedSet?.name || cachedCard.setId,
        rarity: cachedCard.rarity ?? undefined,
        imageSmall: cachedCard.imageSmall,
        marketPrice: cachedCard.priceMarket ?? undefined,
        types: cachedCard.types,
        category: 'wishlist',
      });
      addedCardIds.add(cachedCard.cardId);

      if (candidates.length >= args.limit) break;
    }

    // Add set completion candidates (cards from sets they're actively collecting)
    if (candidates.length < args.limit) {
      // Find sets the user is collecting
      const setOwnership: Record<string, { owned: number; total: number; name: string }> = {};

      for (const card of ownedCards) {
        const cachedCard = await ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', card.cardId))
          .first();

        if (cachedCard && cachedCard.gameSlug === args.gameSlug) {
          if (!setOwnership[cachedCard.setId]) {
            const cachedSet = await ctx.db
              .query('cachedSets')
              .withIndex('by_set_id', (q) => q.eq('setId', cachedCard.setId))
              .first();

            setOwnership[cachedCard.setId] = {
              owned: 0,
              total: cachedSet?.totalCards || 0,
              name: cachedSet?.name || cachedCard.setId,
            };
          }
          setOwnership[cachedCard.setId].owned++;
        }
      }

      // Get sets with 10-90% completion
      const activeSets = Object.entries(setOwnership)
        .filter(([, data]) => {
          const completion = data.total > 0 ? data.owned / data.total : 0;
          return completion >= 0.1 && completion < 0.9;
        })
        .sort((a, b) => b[1].owned / b[1].total - a[1].owned / a[1].total);

      // Get missing cards from active sets
      for (const [setId, setData] of activeSets.slice(0, 3)) {
        const setCards = await ctx.db
          .query('cachedCards')
          .withIndex('by_game_and_set', (q) => q.eq('gameSlug', args.gameSlug).eq('setId', setId))
          .take(50);

        for (const card of setCards) {
          if (ownedCardIds.has(card.cardId)) continue;
          if (addedCardIds.has(card.cardId)) continue;

          if (args.budget && card.priceMarket && card.priceMarket > args.budget) {
            continue;
          }

          const percentComplete = Math.round((setData.owned / setData.total) * 100);
          const cardsNeeded = setData.total - setData.owned;

          candidates.push({
            cardId: card.cardId,
            name: card.name,
            setId: card.setId,
            setName: setData.name,
            rarity: card.rarity ?? undefined,
            imageSmall: card.imageSmall,
            marketPrice: card.priceMarket ?? undefined,
            types: card.types,
            category: 'set_completion',
            setCompletionInfo: {
              cardsOwned: setData.owned,
              totalCards: setData.total,
              percentComplete,
              cardsNeeded,
            },
          });
          addedCardIds.add(card.cardId);

          if (candidates.length >= args.limit) break;
        }

        if (candidates.length >= args.limit) break;
      }
    }

    return candidates.slice(0, args.limit);
  },
});

/**
 * Get wishlist details for a profile
 */
export const getWishlistDetails = internalQuery({
  args: {
    profileId: v.id('profiles'),
    gameSlug: gameSlugValidator,
  },
  handler: async (ctx, args) => {
    const wishlistCards = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const details: Array<{
      cardId: string;
      name: string;
      setName: string;
      rarity?: string;
      imageSmall: string;
      marketPrice?: number;
      isPriority: boolean;
    }> = [];

    for (const wishlistCard of wishlistCards) {
      const cachedCard = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', wishlistCard.cardId))
        .first();

      if (!cachedCard) continue;

      // Filter by game if the wishlist item has a gameSlug set
      if (wishlistCard.gameSlug && wishlistCard.gameSlug !== args.gameSlug) continue;
      if (cachedCard.gameSlug !== args.gameSlug) continue;

      const cachedSet = await ctx.db
        .query('cachedSets')
        .withIndex('by_set_id', (q) => q.eq('setId', cachedCard.setId))
        .first();

      details.push({
        cardId: cachedCard.cardId,
        name: cachedCard.name,
        setName: cachedSet?.name || cachedCard.setId,
        rarity: cachedCard.rarity ?? undefined,
        imageSmall: cachedCard.imageSmall,
        marketPrice: cachedCard.priceMarket ?? undefined,
        isPriority: wishlistCard.isPriority,
      });
    }

    return details;
  },
});

// ============================================================================
// INTERNAL MUTATIONS
// ============================================================================

/**
 * Log shopping assistant usage for cost tracking
 */
export const logShoppingAssistantUsage = internalMutation({
  args: {
    profileId: v.id('profiles'),
    familyId: v.id('families'),
    gameSlug: gameSlugValidator,
    suggestionCount: v.number(),
    bundleCount: v.number(),
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
      featureType: 'shopping_assistant',
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      estimatedCost,
      gameSlug: args.gameSlug,
      metadata: {
        suggestionCount: args.suggestionCount,
        bundleCount: args.bundleCount,
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
          .eq('featureType', 'shopping_assistant')
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
        featureType: 'shopping_assistant',
        windowType: 'daily',
        windowStart,
        count: 1,
      });
    }
  },
});
