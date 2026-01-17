import { v } from 'convex/values';
import { internalMutation, internalQuery } from '../_generated/server';

/**
 * Trade Advisor Helper Functions
 *
 * Internal queries and mutations used by the trade advisor action.
 * Separated from tradeAdvisor.ts because internal functions cannot
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
// VERIFICATION QUERIES
// ============================================================================

/**
 * Verify that both profiles belong to the same family
 */
export const verifyFamilyProfiles = internalQuery({
  args: {
    profileIdA: v.id('profiles'),
    profileIdB: v.id('profiles'),
    familyId: v.id('families'),
  },
  handler: async (ctx, args) => {
    const profileA = await ctx.db.get(args.profileIdA);
    const profileB = await ctx.db.get(args.profileIdB);

    if (!profileA || !profileB) {
      return {
        valid: false,
        profileAName: '',
        profileBName: '',
      };
    }

    // Check if both profiles belong to the specified family
    const valid =
      profileA.familyId === args.familyId &&
      profileB.familyId === args.familyId &&
      args.profileIdA !== args.profileIdB; // Can't trade with yourself

    return {
      valid,
      profileAName: profileA.displayName,
      profileBName: profileB.displayName,
    };
  },
});

// ============================================================================
// TRADE ANALYSIS QUERIES
// ============================================================================

/**
 * Analyze trade opportunities between two profiles
 * Returns duplicates, wishlist matches, and tradeable cards
 */
export const analyzeTradeOpportunities = internalQuery({
  args: {
    profileIdA: v.id('profiles'),
    profileIdB: v.id('profiles'),
    gameSlug: gameSlugValidator,
  },
  handler: async (ctx, args) => {
    // Get profile display names
    const profileA = await ctx.db.get(args.profileIdA);
    const profileB = await ctx.db.get(args.profileIdB);

    const profileAName = profileA?.displayName || 'Collector A';
    const profileBName = profileB?.displayName || 'Collector B';

    // Get collections for both profiles
    const collectionA = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileIdA))
      .collect();

    const collectionB = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileIdB))
      .collect();

    // Get wishlists for both profiles
    const wishlistA = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileIdA))
      .collect();

    const wishlistB = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileIdB))
      .collect();

    // Build sets for quick lookup
    const collectionAMap = new Map<string, number>();
    const collectionBMap = new Map<string, number>();
    const wishlistASet = new Set<string>();
    const wishlistBSet = new Set<string>();

    for (const card of collectionA) {
      collectionAMap.set(card.cardId, card.quantity);
    }

    for (const card of collectionB) {
      collectionBMap.set(card.cardId, card.quantity);
    }

    for (const card of wishlistA) {
      wishlistASet.add(card.cardId);
    }

    for (const card of wishlistB) {
      wishlistBSet.add(card.cardId);
    }

    // Find duplicates (cards with quantity > 1)
    const duplicatesA = collectionA.filter((c) => c.quantity > 1);
    const duplicatesB = collectionB.filter((c) => c.quantity > 1);

    // Find wishlist matches (A has what B wants, B has what A wants)
    let wishlistMatchesForA = 0;
    let wishlistMatchesForB = 0;

    for (const cardId of wishlistASet) {
      if (collectionBMap.has(cardId)) {
        wishlistMatchesForA++;
      }
    }

    for (const cardId of wishlistBSet) {
      if (collectionAMap.has(cardId)) {
        wishlistMatchesForB++;
      }
    }

    // Analyze favorite types for both profiles
    const typeCountA: Record<string, number> = {};
    const typeCountB: Record<string, number> = {};

    // Get cached card details for type analysis
    const allCardIds = new Set([
      ...collectionA.map((c) => c.cardId),
      ...collectionB.map((c) => c.cardId),
    ]);

    const cachedCardsMap = new Map<
      string,
      {
        cardId: string;
        name: string;
        setId: string;
        rarity?: string;
        imageSmall: string;
        types: string[];
        priceMarket?: number;
        gameSlug: string;
      }
    >();

    // Batch fetch cached cards
    const cardIdArray = Array.from(allCardIds);
    const cachedCardsPromises = cardIdArray.map((cardId) =>
      ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
        .first()
    );
    const cachedCards = await Promise.all(cachedCardsPromises);

    for (let i = 0; i < cardIdArray.length; i++) {
      const cached = cachedCards[i];
      if (cached && cached.gameSlug === args.gameSlug) {
        cachedCardsMap.set(cardIdArray[i], {
          cardId: cached.cardId,
          name: cached.name,
          setId: cached.setId,
          rarity: cached.rarity ?? undefined,
          imageSmall: cached.imageSmall,
          types: cached.types,
          priceMarket: cached.priceMarket ?? undefined,
          gameSlug: cached.gameSlug,
        });
      }
    }

    // Count types for each profile
    for (const card of collectionA) {
      const cached = cachedCardsMap.get(card.cardId);
      if (cached) {
        for (const type of cached.types) {
          typeCountA[type] = (typeCountA[type] || 0) + card.quantity;
        }
      }
    }

    for (const card of collectionB) {
      const cached = cachedCardsMap.get(card.cardId);
      if (cached) {
        for (const type of cached.types) {
          typeCountB[type] = (typeCountB[type] || 0) + card.quantity;
        }
      }
    }

    // Get top 5 favorite types for each profile
    const favoriteTypesA = Object.entries(typeCountA)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type]) => type);

    const favoriteTypesB = Object.entries(typeCountB)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type]) => type);

    // Build tradeable cards list
    // A card is tradeable if:
    // 1. Owner has duplicates (quantity > 1), OR
    // 2. The other person has it on their wishlist

    interface TradeableCard {
      cardId: string;
      name: string;
      setId: string;
      setName: string;
      rarity: string | undefined;
      imageSmall: string;
      marketPrice: number | null;
      types: string[];
      ownerProfileId: string;
      ownerName: string;
      wantedByName: string | null;
    }

    const tradeableCards: TradeableCard[] = [];

    // Get set names for cards
    const setIds = new Set<string>();
    for (const card of cachedCardsMap.values()) {
      setIds.add(card.setId);
    }

    const setNameMap = new Map<string, string>();
    for (const setId of setIds) {
      const cachedSet = await ctx.db
        .query('cachedSets')
        .withIndex('by_set_id', (q) => q.eq('setId', setId))
        .first();
      if (cachedSet) {
        setNameMap.set(setId, cachedSet.name);
      }
    }

    // Profile A's tradeable cards
    for (const card of collectionA) {
      const cached = cachedCardsMap.get(card.cardId);
      if (!cached) continue;

      const hasDuplicate = card.quantity > 1;
      const wantedByB = wishlistBSet.has(card.cardId);

      if (hasDuplicate || wantedByB) {
        tradeableCards.push({
          cardId: card.cardId,
          name: cached.name,
          setId: cached.setId,
          setName: setNameMap.get(cached.setId) || cached.setId,
          rarity: cached.rarity,
          imageSmall: cached.imageSmall,
          marketPrice: cached.priceMarket ?? null,
          types: cached.types,
          ownerProfileId: args.profileIdA,
          ownerName: profileAName,
          wantedByName: wantedByB ? profileBName : null,
        });
      }
    }

    // Profile B's tradeable cards
    for (const card of collectionB) {
      const cached = cachedCardsMap.get(card.cardId);
      if (!cached) continue;

      const hasDuplicate = card.quantity > 1;
      const wantedByA = wishlistASet.has(card.cardId);

      if (hasDuplicate || wantedByA) {
        tradeableCards.push({
          cardId: card.cardId,
          name: cached.name,
          setId: cached.setId,
          setName: setNameMap.get(cached.setId) || cached.setId,
          rarity: cached.rarity,
          imageSmall: cached.imageSmall,
          marketPrice: cached.priceMarket ?? null,
          types: cached.types,
          ownerProfileId: args.profileIdB,
          ownerName: profileBName,
          wantedByName: wantedByA ? profileAName : null,
        });
      }
    }

    // Sort tradeable cards by:
    // 1. Wishlist matches first (most desirable trades)
    // 2. Then by price (higher value first)
    tradeableCards.sort((a, b) => {
      // Wishlist matches are more valuable for trade suggestions
      const aWishlistScore = a.wantedByName ? 100 : 0;
      const bWishlistScore = b.wantedByName ? 100 : 0;

      if (aWishlistScore !== bWishlistScore) {
        return bWishlistScore - aWishlistScore;
      }

      // Then by price
      return (b.marketPrice || 0) - (a.marketPrice || 0);
    });

    return {
      profileADuplicates: duplicatesA.length,
      profileAWishlistMatches: wishlistMatchesForA,
      profileAFavoriteTypes: favoriteTypesA,
      profileBDuplicates: duplicatesB.length,
      profileBWishlistMatches: wishlistMatchesForB,
      profileBFavoriteTypes: favoriteTypesB,
      tradeableCards,
    };
  },
});

// ============================================================================
// INTERNAL MUTATIONS
// ============================================================================

/**
 * Log trade advisor usage for cost tracking
 */
export const logTradeAdvisorUsage = internalMutation({
  args: {
    profileId: v.id('profiles'),
    familyId: v.id('families'),
    gameSlug: gameSlugValidator,
    suggestionCount: v.number(),
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
      featureType: 'trade_advisor',
      model: args.model,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      estimatedCost,
      gameSlug: args.gameSlug,
      metadata: {
        suggestionCount: args.suggestionCount,
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
          .eq('featureType', 'trade_advisor')
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
        featureType: 'trade_advisor',
        windowType: 'daily',
        windowStart,
        count: 1,
      });
    }
  },
});
