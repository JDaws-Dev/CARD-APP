import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { paginationOptsValidator } from 'convex/server';
import { api } from './_generated/api';

// Card variant type for consistent typing across queries and mutations
const cardVariant = v.union(
  v.literal('normal'),
  v.literal('holofoil'),
  v.literal('reverseHolofoil'),
  v.literal('1stEditionHolofoil'),
  v.literal('1stEditionNormal')
);

// Game slug type for multi-TCG filtering
const gameSlugValidator = v.union(
  v.literal('pokemon'),
  v.literal('yugioh'),
  v.literal('onepiece'),
  v.literal('lorcana')
);

// ============================================================================
// QUERIES
// ============================================================================

export const getCollection = query({
  args: {
    profileId: v.id('profiles'),
    gameSlug: v.optional(gameSlugValidator),
  },
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // If no game filter, return all cards
    if (!args.gameSlug) {
      return cards;
    }

    // Get unique card IDs to look up their game slugs
    const uniqueCardIds = [...new Set(cards.map((c) => c.cardId))];

    // Batch fetch card data to get game slugs
    const CHUNK_SIZE = 50;
    const cardGameMap = new Map<string, string>();

    for (let i = 0; i < uniqueCardIds.length; i += CHUNK_SIZE) {
      const chunk = uniqueCardIds.slice(i, i + CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunk.map((cardId) =>
          ctx.db
            .query('cachedCards')
            .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
            .first()
        )
      );

      for (const cachedCard of chunkResults) {
        if (cachedCard) {
          cardGameMap.set(cachedCard.cardId, cachedCard.gameSlug);
        }
      }
    }

    // Filter cards by game slug
    return cards.filter((card) => cardGameMap.get(card.cardId) === args.gameSlug);
  },
});

/**
 * Paginated query for large collections.
 * Returns 50 cards at a time with cursor-based pagination for efficient scrolling.
 *
 * Uses Convex's built-in pagination with cursors for stable, efficient pagination
 * that doesn't skip or duplicate items when the underlying data changes.
 *
 * @param profileId - The profile whose collection to fetch
 * @param paginationOpts - Convex pagination options (numItems, cursor)
 * @param enrichWithDetails - Whether to fetch card details from cache (default: false for performance)
 * @returns Paginated result with page of cards, continuation cursor, and isDone flag
 */
export const getCollectionPaginated = query({
  args: {
    profileId: v.id('profiles'),
    paginationOpts: paginationOptsValidator,
    enrichWithDetails: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Use Convex's built-in pagination for stable cursor-based results
    const result = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .paginate(args.paginationOpts);

    // If no enrichment requested, return raw pagination result
    if (!args.enrichWithDetails) {
      return {
        page: result.page,
        continueCursor: result.continueCursor,
        isDone: result.isDone,
      };
    }

    // Enrich with card details from cache
    const uniqueCardIds = [...new Set(result.page.map((c) => c.cardId))];

    // Batch fetch card data - use chunking for efficiency
    const CHUNK_SIZE = 50;
    const cardDataMap = new Map<
      string,
      {
        name: string;
        imageSmall: string;
        imageLarge: string;
        setId: string;
        rarity?: string;
        types: string[];
      }
    >();

    for (let i = 0; i < uniqueCardIds.length; i += CHUNK_SIZE) {
      const chunk = uniqueCardIds.slice(i, i + CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunk.map((cardId) =>
          ctx.db
            .query('cachedCards')
            .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
            .first()
        )
      );

      for (const card of chunkResults) {
        if (card) {
          cardDataMap.set(card.cardId, {
            name: card.name,
            imageSmall: card.imageSmall,
            imageLarge: card.imageLarge,
            setId: card.setId,
            rarity: card.rarity,
            types: card.types,
          });
        }
      }
    }

    // Enrich page with card details
    const enrichedPage = result.page.map((card) => {
      const cachedData = cardDataMap.get(card.cardId);
      return {
        _id: card._id,
        cardId: card.cardId,
        variant: card.variant ?? 'normal',
        quantity: card.quantity,
        name: cachedData?.name ?? card.cardId,
        imageSmall: cachedData?.imageSmall ?? '',
        imageLarge: cachedData?.imageLarge ?? '',
        setId: cachedData?.setId ?? card.cardId.split('-')[0],
        rarity: cachedData?.rarity,
        types: cachedData?.types ?? [],
      };
    });

    return {
      page: enrichedPage,
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

export const getCollectionBySet = query({
  args: {
    profileId: v.id('profiles'),
    setId: v.string(),
    gameSlug: v.optional(gameSlugValidator),
  },
  handler: async (ctx, args) => {
    // If gameSlug is provided, verify the set belongs to that game
    if (args.gameSlug) {
      const cachedSet = await ctx.db
        .query('cachedSets')
        .withIndex('by_set_id', (q) => q.eq('setId', args.setId))
        .first();

      // If set doesn't exist or belongs to a different game, return empty
      if (!cachedSet || cachedSet.gameSlug !== args.gameSlug) {
        return [];
      }
    }

    const allCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Filter by set (cardId format is "setId-number")
    return allCards.filter((card) => card.cardId.startsWith(args.setId + '-'));
  },
});

export const getCollectionStats = query({
  args: {
    profileId: v.id('profiles'),
    gameSlug: v.optional(gameSlugValidator),
  },
  handler: async (ctx, args) => {
    let cards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Filter by game if specified
    if (args.gameSlug) {
      const uniqueCardIds = [...new Set(cards.map((c) => c.cardId))];
      const CHUNK_SIZE = 50;
      const cardGameMap = new Map<string, string>();

      for (let i = 0; i < uniqueCardIds.length; i += CHUNK_SIZE) {
        const chunk = uniqueCardIds.slice(i, i + CHUNK_SIZE);
        const chunkResults = await Promise.all(
          chunk.map((cardId) =>
            ctx.db
              .query('cachedCards')
              .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
              .first()
          )
        );

        for (const cachedCard of chunkResults) {
          if (cachedCard) {
            cardGameMap.set(cachedCard.cardId, cachedCard.gameSlug);
          }
        }
      }

      cards = cards.filter((card) => cardGameMap.get(card.cardId) === args.gameSlug);
    }

    const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
    const uniqueCards = cards.length;

    // Count unique sets
    const sets = new Set(cards.map((card) => card.cardId.split('-')[0]));

    return {
      totalCards,
      uniqueCards,
      setsStarted: sets.size,
    };
  },
});

/**
 * Combined query that returns both collection data and calculated stats in a single call.
 * This eliminates the need to call getCollection and getCollectionStats separately,
 * reducing redundant database queries and improving page load performance.
 */
export const getCollectionWithStats = query({
  args: {
    profileId: v.id('profiles'),
    gameSlug: v.optional(gameSlugValidator),
  },
  handler: async (ctx, args) => {
    let cards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Filter by game if specified
    if (args.gameSlug) {
      const uniqueCardIds = [...new Set(cards.map((c) => c.cardId))];
      const CHUNK_SIZE = 50;
      const cardGameMap = new Map<string, string>();

      for (let i = 0; i < uniqueCardIds.length; i += CHUNK_SIZE) {
        const chunk = uniqueCardIds.slice(i, i + CHUNK_SIZE);
        const chunkResults = await Promise.all(
          chunk.map((cardId) =>
            ctx.db
              .query('cachedCards')
              .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
              .first()
          )
        );

        for (const cachedCard of chunkResults) {
          if (cachedCard) {
            cardGameMap.set(cachedCard.cardId, cachedCard.gameSlug);
          }
        }
      }

      cards = cards.filter((card) => cardGameMap.get(card.cardId) === args.gameSlug);
    }

    // Calculate stats in a single pass over the data
    let totalCards = 0;
    const sets = new Set<string>();
    const variantCounts: Record<string, number> = {};

    for (const card of cards) {
      totalCards += card.quantity;
      // Extract setId from cardId (format is "setId-number")
      const setId = card.cardId.split('-')[0];
      sets.add(setId);
      // Track variant distribution
      const variant = card.variant ?? 'normal';
      variantCounts[variant] = (variantCounts[variant] ?? 0) + 1;
    }

    return {
      cards,
      stats: {
        totalCards,
        uniqueCards: cards.length,
        setsStarted: sets.size,
        variantBreakdown: variantCounts,
      },
    };
  },
});

export const isCardOwned = query({
  args: { profileId: v.id('profiles'), cardId: v.string() },
  handler: async (ctx, args) => {
    // Get all variants of this card owned by the profile
    const cards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile_and_card', (q) =>
        q.eq('profileId', args.profileId).eq('cardId', args.cardId)
      )
      .collect();

    if (cards.length === 0) {
      return { owned: false, quantity: 0, variants: {} };
    }

    // Sum up total quantity across all variants
    const totalQuantity = cards.reduce((sum, card) => sum + card.quantity, 0);

    // Build variants object with quantity per variant
    const variants: Record<string, number> = {};
    for (const card of cards) {
      const variant = card.variant ?? 'normal'; // Default to 'normal' for legacy cards
      variants[variant] = (variants[variant] ?? 0) + card.quantity;
    }

    return { owned: true, quantity: totalQuantity, variants };
  },
});

// Get specific variant ownership info
export const getCardVariants = query({
  args: { profileId: v.id('profiles'), cardId: v.string() },
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile_and_card', (q) =>
        q.eq('profileId', args.profileId).eq('cardId', args.cardId)
      )
      .collect();

    // Return array of variant entries with their quantities
    return cards.map((card) => ({
      variant: card.variant ?? 'normal', // Default for legacy cards
      quantity: card.quantity,
      _id: card._id,
    }));
  },
});

/**
 * Get the entire collection grouped by unique (cardId, variant) pairs.
 * Returns enriched data including card names from the cache.
 * Useful for displaying a full collection view with variant breakdown.
 */
export const getCollectionGroupedByVariant = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    if (collectionCards.length === 0) {
      return {
        cards: [],
        summary: {
          totalEntries: 0,
          totalQuantity: 0,
          uniqueCards: 0,
          variantBreakdown: {} as Record<string, number>,
        },
      };
    }

    // Get unique card IDs to fetch card names
    const uniqueCardIds = Array.from(new Set(collectionCards.map((c) => c.cardId)));

    // Fetch card data from cache
    const cachedCards = await Promise.all(
      uniqueCardIds.map((cardId) =>
        ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
          .first()
      )
    );

    // Build a map for quick lookups
    const cardDataMap = new Map<string, { name: string; imageSmall: string; setId: string }>();
    for (const cachedCard of cachedCards) {
      if (cachedCard) {
        cardDataMap.set(cachedCard.cardId, {
          name: cachedCard.name,
          imageSmall: cachedCard.imageSmall,
          setId: cachedCard.setId,
        });
      }
    }

    // Build the grouped result
    const groupedCards: Array<{
      cardId: string;
      variant: string;
      quantity: number;
      name: string;
      imageSmall: string;
      setId: string;
    }> = [];

    // Track variant counts
    const variantCounts: Record<string, number> = {};

    for (const card of collectionCards) {
      const variant = card.variant ?? 'normal';
      const cardData = cardDataMap.get(card.cardId);

      groupedCards.push({
        cardId: card.cardId,
        variant,
        quantity: card.quantity,
        name: cardData?.name ?? card.cardId,
        imageSmall: cardData?.imageSmall ?? '',
        setId: cardData?.setId ?? card.cardId.split('-')[0],
      });

      // Count variants
      variantCounts[variant] = (variantCounts[variant] ?? 0) + 1;
    }

    // Sort by cardId then variant for consistent ordering
    groupedCards.sort((a, b) => {
      const cardCompare = a.cardId.localeCompare(b.cardId);
      if (cardCompare !== 0) return cardCompare;
      return a.variant.localeCompare(b.variant);
    });

    return {
      cards: groupedCards,
      summary: {
        totalEntries: collectionCards.length,
        totalQuantity: collectionCards.reduce((sum, c) => sum + c.quantity, 0),
        uniqueCards: uniqueCardIds.length,
        variantBreakdown: variantCounts,
      },
    };
  },
});

/**
 * Get collection grouped by card, with variants aggregated.
 * Returns each unique cardId with all its variants in a single object.
 */
export const getCollectionByCard = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    if (collectionCards.length === 0) {
      return [];
    }

    // Get unique card IDs
    const uniqueCardIds = Array.from(new Set(collectionCards.map((c) => c.cardId)));

    // Fetch card data from cache
    const cachedCards = await Promise.all(
      uniqueCardIds.map((cardId) =>
        ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
          .first()
      )
    );

    // Build a map for quick lookups
    const cardDataMap = new Map<string, { name: string; imageSmall: string; setId: string }>();
    for (const cachedCard of cachedCards) {
      if (cachedCard) {
        cardDataMap.set(cachedCard.cardId, {
          name: cachedCard.name,
          imageSmall: cachedCard.imageSmall,
          setId: cachedCard.setId,
        });
      }
    }

    // Group cards by cardId
    const groupedByCard = new Map<
      string,
      {
        cardId: string;
        name: string;
        imageSmall: string;
        setId: string;
        totalQuantity: number;
        variants: Record<string, number>;
      }
    >();

    for (const card of collectionCards) {
      const variant = card.variant ?? 'normal';
      const existing = groupedByCard.get(card.cardId);

      if (existing) {
        existing.totalQuantity += card.quantity;
        existing.variants[variant] = (existing.variants[variant] ?? 0) + card.quantity;
      } else {
        const cardData = cardDataMap.get(card.cardId);
        groupedByCard.set(card.cardId, {
          cardId: card.cardId,
          name: cardData?.name ?? card.cardId,
          imageSmall: cardData?.imageSmall ?? '',
          setId: cardData?.setId ?? card.cardId.split('-')[0],
          totalQuantity: card.quantity,
          variants: { [variant]: card.quantity },
        });
      }
    }

    // Sort by cardId
    const result = Array.from(groupedByCard.values()).sort((a, b) =>
      a.cardId.localeCompare(b.cardId)
    );

    return result;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

export const addCard = mutation({
  args: {
    profileId: v.id('profiles'),
    cardId: v.string(),
    cardName: v.optional(v.string()),
    setName: v.optional(v.string()),
    variant: v.optional(cardVariant),
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const quantity = args.quantity ?? 1;
    const variant = args.variant ?? 'normal';

    // Check if card with this specific variant already exists
    const existing = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile_card_variant', (q) =>
        q.eq('profileId', args.profileId).eq('cardId', args.cardId).eq('variant', variant)
      )
      .first();

    const isDuplicate = !!existing;
    let cardEntryId;

    if (existing) {
      // Update quantity for this variant
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + quantity,
      });
      cardEntryId = existing._id;
    } else {
      // Create new card entry with variant
      cardEntryId = await ctx.db.insert('collectionCards', {
        profileId: args.profileId,
        cardId: args.cardId,
        variant,
        quantity,
      });
    }

    // Log activity for ALL card additions (new and duplicates) for streak tracking
    // Include timestamp for database-level time filtering in queries
    await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'card_added',
      metadata: {
        cardId: args.cardId,
        cardName: args.cardName ?? args.cardId,
        setName: args.setName,
        variant,
        quantity,
        isDuplicate,
      },
      timestamp: Date.now(),
    });

    // ========================================================================
    // GAMIFICATION: Award XP and check achievements
    // ========================================================================

    // Award XP for adding the card
    const xpResult: {
      xpGained: number;
      newXP: number;
      leveledUp: boolean;
      previousLevel: number;
      newLevel: number;
      newTitle: string;
      action: string;
    } = await ctx.runMutation(api.levelSystem.awardCardXP, {
      profileId: args.profileId,
      cardId: args.cardId,
      variant,
      isDuplicate,
      cardName: args.cardName,
    });

    // Extract setId from cardId (format is "setId-number")
    const setId = args.cardId.split('-')[0];

    // Check all achievements (including set completion)
    const achievementResult: {
      awarded: Array<{ key: string; type: string; name: string }>;
      totalAwarded: number;
      totalUniqueCards: number;
      currentStreak: number;
      nextMilestone: { key: string; name: string; threshold: number; cardsNeeded: number } | null;
    } = await ctx.runMutation(api.achievements.checkAllAchievements, {
      profileId: args.profileId,
      setId,
    });

    return {
      cardEntryId,
      isDuplicate,
      gamification: {
        xpGained: xpResult.xpGained,
        newXP: xpResult.newXP,
        leveledUp: xpResult.leveledUp,
        previousLevel: xpResult.previousLevel,
        newLevel: xpResult.newLevel,
        newTitle: xpResult.newTitle,
        achievementsEarned: achievementResult.awarded,
      },
    };
  },
});

export const removeCard = mutation({
  args: {
    profileId: v.id('profiles'),
    cardId: v.string(),
    cardName: v.optional(v.string()),
    setName: v.optional(v.string()),
    variant: v.optional(cardVariant),
  },
  handler: async (ctx, args) => {
    const cardName = args.cardName ?? args.cardId;

    // If variant specified, remove only that variant
    if (args.variant) {
      const existing = await ctx.db
        .query('collectionCards')
        .withIndex('by_profile_card_variant', (q) =>
          q.eq('profileId', args.profileId).eq('cardId', args.cardId).eq('variant', args.variant!)
        )
        .first();

      if (existing) {
        await ctx.db.delete(existing._id);

        // Log activity with timestamp for database-level time filtering
        await ctx.db.insert('activityLogs', {
          profileId: args.profileId,
          action: 'card_removed',
          metadata: { cardId: args.cardId, cardName, setName: args.setName, variant: args.variant },
          timestamp: Date.now(),
        });
      }
    } else {
      // Remove all variants of this card
      const allVariants = await ctx.db
        .query('collectionCards')
        .withIndex('by_profile_and_card', (q) =>
          q.eq('profileId', args.profileId).eq('cardId', args.cardId)
        )
        .collect();

      for (const card of allVariants) {
        await ctx.db.delete(card._id);
      }

      if (allVariants.length > 0) {
        // Log activity with timestamp for database-level time filtering
        await ctx.db.insert('activityLogs', {
          profileId: args.profileId,
          action: 'card_removed',
          metadata: {
            cardId: args.cardId,
            cardName,
            setName: args.setName,
            variantsRemoved: allVariants.length,
          },
          timestamp: Date.now(),
        });
      }
    }
  },
});

export const updateQuantity = mutation({
  args: {
    profileId: v.id('profiles'),
    cardId: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile_and_card', (q) =>
        q.eq('profileId', args.profileId).eq('cardId', args.cardId)
      )
      .first();

    if (!existing) {
      throw new Error('Card not found in collection');
    }

    if (args.quantity <= 0) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.patch(existing._id, { quantity: args.quantity });
    }
  },
});

// ============================================================================
// DUPLICATE FINDER - Compare two profiles' collections
// ============================================================================

/**
 * Find cards that exist in both profiles' collections.
 * Useful for family features like trading suggestions or avoiding duplicate purchases.
 */
export const findDuplicateCards = query({
  args: {
    profileId1: v.id('profiles'),
    profileId2: v.id('profiles'),
    gameSlug: v.optional(gameSlugValidator),
  },
  handler: async (ctx, args) => {
    // Prevent comparing a profile with itself
    if (args.profileId1 === args.profileId2) {
      return { duplicates: [], totalDuplicates: 0, error: 'Cannot compare a profile with itself' };
    }

    // Get all cards for both profiles
    let [profile1Cards, profile2Cards] = await Promise.all([
      ctx.db
        .query('collectionCards')
        .withIndex('by_profile', (q) => q.eq('profileId', args.profileId1))
        .collect(),
      ctx.db
        .query('collectionCards')
        .withIndex('by_profile', (q) => q.eq('profileId', args.profileId2))
        .collect(),
    ]);

    // If gameSlug is specified, filter cards by game
    if (args.gameSlug) {
      const allCardIds = new Set([
        ...profile1Cards.map((c) => c.cardId),
        ...profile2Cards.map((c) => c.cardId),
      ]);

      // Batch fetch card data to get game slugs
      const CHUNK_SIZE = 50;
      const cardGameMap = new Map<string, string>();
      const uniqueCardIds = [...allCardIds];

      for (let i = 0; i < uniqueCardIds.length; i += CHUNK_SIZE) {
        const chunk = uniqueCardIds.slice(i, i + CHUNK_SIZE);
        const chunkResults = await Promise.all(
          chunk.map((cardId) =>
            ctx.db
              .query('cachedCards')
              .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
              .first()
          )
        );

        for (const cachedCard of chunkResults) {
          if (cachedCard) {
            cardGameMap.set(cachedCard.cardId, cachedCard.gameSlug);
          }
        }
      }

      // Filter cards by game slug
      profile1Cards = profile1Cards.filter((card) => cardGameMap.get(card.cardId) === args.gameSlug);
      profile2Cards = profile2Cards.filter((card) => cardGameMap.get(card.cardId) === args.gameSlug);
    }

    // Create a map of cardId -> card data for profile2 for O(1) lookups
    const profile2CardMap = new Map<string, { quantity: number; variant: string }[]>();
    for (const card of profile2Cards) {
      const variant = card.variant ?? 'normal';
      const existing = profile2CardMap.get(card.cardId) ?? [];
      existing.push({ quantity: card.quantity, variant });
      profile2CardMap.set(card.cardId, existing);
    }

    // Find matching cards
    const duplicates: Array<{
      cardId: string;
      profile1: { quantity: number; variants: Record<string, number> };
      profile2: { quantity: number; variants: Record<string, number> };
    }> = [];

    // Group profile1 cards by cardId
    const profile1ByCardId = new Map<string, { quantity: number; variant: string }[]>();
    for (const card of profile1Cards) {
      const variant = card.variant ?? 'normal';
      const existing = profile1ByCardId.get(card.cardId) ?? [];
      existing.push({ quantity: card.quantity, variant });
      profile1ByCardId.set(card.cardId, existing);
    }

    // Find cards that exist in both profiles
    for (const [cardId, profile1Variants] of profile1ByCardId) {
      const profile2Variants = profile2CardMap.get(cardId);
      if (profile2Variants) {
        // Card exists in both profiles
        const p1Variants: Record<string, number> = {};
        let p1TotalQty = 0;
        for (const v of profile1Variants) {
          p1Variants[v.variant] = (p1Variants[v.variant] ?? 0) + v.quantity;
          p1TotalQty += v.quantity;
        }

        const p2Variants: Record<string, number> = {};
        let p2TotalQty = 0;
        for (const v of profile2Variants) {
          p2Variants[v.variant] = (p2Variants[v.variant] ?? 0) + v.quantity;
          p2TotalQty += v.quantity;
        }

        duplicates.push({
          cardId,
          profile1: { quantity: p1TotalQty, variants: p1Variants },
          profile2: { quantity: p2TotalQty, variants: p2Variants },
        });
      }
    }

    return {
      duplicates,
      totalDuplicates: duplicates.length,
    };
  },
});

/**
 * Find cards unique to one profile that could be traded to another.
 * Returns cards that profile1 has but profile2 doesn't.
 */
export const findTradeableCards = query({
  args: {
    fromProfileId: v.id('profiles'),
    toProfileId: v.id('profiles'),
    gameSlug: v.optional(gameSlugValidator),
  },
  handler: async (ctx, args) => {
    // Prevent comparing a profile with itself
    if (args.fromProfileId === args.toProfileId) {
      return {
        tradeableCards: [],
        totalTradeable: 0,
        error: 'Cannot compare a profile with itself',
      };
    }

    // Get all cards for both profiles
    let [fromProfileCards, toProfileCards] = await Promise.all([
      ctx.db
        .query('collectionCards')
        .withIndex('by_profile', (q) => q.eq('profileId', args.fromProfileId))
        .collect(),
      ctx.db
        .query('collectionCards')
        .withIndex('by_profile', (q) => q.eq('profileId', args.toProfileId))
        .collect(),
    ]);

    // If gameSlug is specified, filter cards by game
    if (args.gameSlug) {
      const allCardIds = new Set([
        ...fromProfileCards.map((c) => c.cardId),
        ...toProfileCards.map((c) => c.cardId),
      ]);

      // Batch fetch card data to get game slugs
      const CHUNK_SIZE = 50;
      const cardGameMap = new Map<string, string>();
      const uniqueCardIds = [...allCardIds];

      for (let i = 0; i < uniqueCardIds.length; i += CHUNK_SIZE) {
        const chunk = uniqueCardIds.slice(i, i + CHUNK_SIZE);
        const chunkResults = await Promise.all(
          chunk.map((cardId) =>
            ctx.db
              .query('cachedCards')
              .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
              .first()
          )
        );

        for (const cachedCard of chunkResults) {
          if (cachedCard) {
            cardGameMap.set(cachedCard.cardId, cachedCard.gameSlug);
          }
        }
      }

      // Filter cards by game slug
      fromProfileCards = fromProfileCards.filter((card) => cardGameMap.get(card.cardId) === args.gameSlug);
      toProfileCards = toProfileCards.filter((card) => cardGameMap.get(card.cardId) === args.gameSlug);
    }

    // Create a set of cardIds that toProfile already has
    const toProfileCardIds = new Set(toProfileCards.map((card) => card.cardId));

    // Find cards that fromProfile has but toProfile doesn't
    const tradeableByCardId = new Map<
      string,
      { quantity: number; variants: Record<string, number> }
    >();

    for (const card of fromProfileCards) {
      if (!toProfileCardIds.has(card.cardId)) {
        const existing = tradeableByCardId.get(card.cardId) ?? { quantity: 0, variants: {} };
        const variant = card.variant ?? 'normal';
        existing.quantity += card.quantity;
        existing.variants[variant] = (existing.variants[variant] ?? 0) + card.quantity;
        tradeableByCardId.set(card.cardId, existing);
      }
    }

    const tradeableCards = Array.from(tradeableByCardId.entries()).map(([cardId, data]) => ({
      cardId,
      quantity: data.quantity,
      variants: data.variants,
    }));

    return {
      tradeableCards,
      totalTradeable: tradeableCards.length,
    };
  },
});

// ============================================================================
// RANDOM CARD - Get a random card from collection
// ============================================================================

/**
 * Get a random card from a profile's collection.
 * Optionally filter by set or variant.
 * Returns enriched card data including name and image.
 */
export const getRandomCard = query({
  args: {
    profileId: v.id('profiles'),
    setId: v.optional(v.string()),
    variant: v.optional(cardVariant),
  },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    let collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    if (collectionCards.length === 0) {
      return null;
    }

    // Filter by set if specified
    if (args.setId) {
      collectionCards = collectionCards.filter((card) => card.cardId.startsWith(args.setId + '-'));
    }

    // Filter by variant if specified
    if (args.variant) {
      collectionCards = collectionCards.filter(
        (card) => (card.variant ?? 'normal') === args.variant
      );
    }

    if (collectionCards.length === 0) {
      return null;
    }

    // Select a random card
    const randomIndex = Math.floor(Math.random() * collectionCards.length);
    const selectedCard = collectionCards[randomIndex];

    // Fetch card details from cache
    const cachedCard = await ctx.db
      .query('cachedCards')
      .withIndex('by_card_id', (q) => q.eq('cardId', selectedCard.cardId))
      .first();

    return {
      cardId: selectedCard.cardId,
      variant: selectedCard.variant ?? 'normal',
      quantity: selectedCard.quantity,
      name: cachedCard?.name ?? selectedCard.cardId,
      imageSmall: cachedCard?.imageSmall ?? '',
      imageLarge: cachedCard?.imageLarge ?? '',
      setId: cachedCard?.setId ?? selectedCard.cardId.split('-')[0],
      rarity: cachedCard?.rarity,
      types: cachedCard?.types ?? [],
    };
  },
});

/**
 * Get multiple random cards from a profile's collection.
 * Useful for "Featured Cards" or "Random Picks" display.
 */
export const getRandomCards = query({
  args: {
    profileId: v.id('profiles'),
    count: v.optional(v.number()),
    setId: v.optional(v.string()),
    variant: v.optional(cardVariant),
    allowDuplicates: v.optional(v.boolean()),
    gameSlug: v.optional(gameSlugValidator),
  },
  handler: async (ctx, args) => {
    const count = args.count ?? 3;
    const allowDuplicates = args.allowDuplicates ?? false;

    // Get all cards in the collection
    let collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    if (collectionCards.length === 0) {
      return [];
    }

    // Filter by game if specified - need to look up game slug for each card
    if (args.gameSlug) {
      const uniqueCardIds = [...new Set(collectionCards.map((c) => c.cardId))];
      const CHUNK_SIZE = 50;
      const cardGameMap = new Map<string, string>();

      for (let i = 0; i < uniqueCardIds.length; i += CHUNK_SIZE) {
        const chunk = uniqueCardIds.slice(i, i + CHUNK_SIZE);
        const chunkResults = await Promise.all(
          chunk.map((cardId) =>
            ctx.db
              .query('cachedCards')
              .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
              .first()
          )
        );

        for (const cachedCard of chunkResults) {
          if (cachedCard) {
            cardGameMap.set(cachedCard.cardId, cachedCard.gameSlug);
          }
        }
      }

      collectionCards = collectionCards.filter(
        (card) => cardGameMap.get(card.cardId) === args.gameSlug
      );
    }

    if (collectionCards.length === 0) {
      return [];
    }

    // Filter by set if specified
    if (args.setId) {
      collectionCards = collectionCards.filter((card) => card.cardId.startsWith(args.setId + '-'));
    }

    // Filter by variant if specified
    if (args.variant) {
      collectionCards = collectionCards.filter(
        (card) => (card.variant ?? 'normal') === args.variant
      );
    }

    if (collectionCards.length === 0) {
      return [];
    }

    // Determine how many cards to select
    const maxCards = allowDuplicates ? count : Math.min(count, collectionCards.length);
    const selectedCards: typeof collectionCards = [];

    if (allowDuplicates) {
      // With duplicates: just pick randomly
      for (let i = 0; i < maxCards; i++) {
        const randomIndex = Math.floor(Math.random() * collectionCards.length);
        selectedCards.push(collectionCards[randomIndex]);
      }
    } else {
      // Without duplicates: Fisher-Yates shuffle and take first N
      const shuffled = [...collectionCards];
      for (let i = shuffled.length - 1; i > 0 && selectedCards.length < maxCards; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      selectedCards.push(...shuffled.slice(0, maxCards));
    }

    // Get unique card IDs for enrichment
    const uniqueCardIds = [...new Set(selectedCards.map((c) => c.cardId))];

    // Fetch card details from cache
    const cachedCards = await Promise.all(
      uniqueCardIds.map((cardId) =>
        ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
          .first()
      )
    );

    // Build a map for quick lookups
    const cardDataMap = new Map<
      string,
      {
        name: string;
        imageSmall: string;
        imageLarge: string;
        setId: string;
        rarity?: string;
        types: string[];
      }
    >();
    for (const cachedCard of cachedCards) {
      if (cachedCard) {
        cardDataMap.set(cachedCard.cardId, {
          name: cachedCard.name,
          imageSmall: cachedCard.imageSmall,
          imageLarge: cachedCard.imageLarge,
          setId: cachedCard.setId,
          rarity: cachedCard.rarity,
          types: cachedCard.types,
        });
      }
    }

    // Enrich and return
    return selectedCards.map((card) => {
      const cardData = cardDataMap.get(card.cardId);
      return {
        cardId: card.cardId,
        variant: card.variant ?? 'normal',
        quantity: card.quantity,
        name: cardData?.name ?? card.cardId,
        imageSmall: cardData?.imageSmall ?? '',
        imageLarge: cardData?.imageLarge ?? '',
        setId: cardData?.setId ?? card.cardId.split('-')[0],
        rarity: cardData?.rarity,
        types: cardData?.types ?? [],
      };
    });
  },
});

// ============================================================================
// COLLECTION VALUE - Calculate total value of owned cards
// ============================================================================

/**
 * Calculate the total value of a profile's collection.
 * Uses cached card prices from the cachedCards table.
 * Only counts cards that have pricing data available.
 */
export const getCollectionValue = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    if (collectionCards.length === 0) {
      return {
        totalValue: 0,
        valuedCardsCount: 0,
        unvaluedCardsCount: 0,
        totalCardsCount: 0,
      };
    }

    // Get unique card IDs
    const uniqueCardIds = Array.from(new Set(collectionCards.map((c) => c.cardId)));

    // Fetch pricing data for all cards
    const cachedCards = await Promise.all(
      uniqueCardIds.map((cardId) =>
        ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
          .first()
      )
    );

    // Build a pricing map
    const priceMap = new Map<string, number>();
    for (const cachedCard of cachedCards) {
      if (cachedCard && typeof cachedCard.priceMarket === 'number' && cachedCard.priceMarket > 0) {
        priceMap.set(cachedCard.cardId, cachedCard.priceMarket);
      }
    }

    // Calculate total value
    let totalValue = 0;
    let valuedCardsCount = 0;
    let unvaluedCardsCount = 0;

    for (const card of collectionCards) {
      const price = priceMap.get(card.cardId);
      if (price !== undefined) {
        totalValue += price * card.quantity;
        valuedCardsCount++;
      } else {
        unvaluedCardsCount++;
      }
    }

    return {
      totalValue: Math.round(totalValue * 100) / 100, // Round to cents
      valuedCardsCount,
      unvaluedCardsCount,
      totalCardsCount: collectionCards.length,
    };
  },
});

/**
 * Get the most valuable cards in a profile's collection.
 * Returns top N cards sorted by market value descending.
 */
export const getMostValuableCards = query({
  args: {
    profileId: v.id('profiles'),
    gameSlug: gameSlugValidator,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get all cards in the collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    if (collectionCards.length === 0) {
      return [];
    }

    // Get unique card IDs
    const uniqueCardIds = Array.from(new Set(collectionCards.map((c) => c.cardId)));

    // Fetch card data for all cards
    const cachedCards = await Promise.all(
      uniqueCardIds.map((cardId) =>
        ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
          .first()
      )
    );

    // Build a price, name, and game slug map
    const cardDataMap = new Map<string, { price: number; name: string; imageSmall: string; gameSlug: string }>();
    for (const cachedCard of cachedCards) {
      if (cachedCard && typeof cachedCard.priceMarket === 'number' && cachedCard.priceMarket > 0) {
        cardDataMap.set(cachedCard.cardId, {
          price: cachedCard.priceMarket,
          name: cachedCard.name,
          imageSmall: cachedCard.imageSmall,
          gameSlug: cachedCard.gameSlug,
        });
      }
    }

    // Calculate value for each collection card
    const valuedCards: Array<{
      cardId: string;
      name: string;
      imageSmall: string;
      variant: string;
      quantity: number;
      unitPrice: number;
      totalValue: number;
    }> = [];

    for (const card of collectionCards) {
      const cardData = cardDataMap.get(card.cardId);
      if (cardData) {
        // Skip cards that don't match the game filter
        if (cardData.gameSlug !== args.gameSlug) {
          continue;
        }
        valuedCards.push({
          cardId: card.cardId,
          name: cardData.name,
          imageSmall: cardData.imageSmall,
          variant: card.variant ?? 'normal',
          quantity: card.quantity,
          unitPrice: cardData.price,
          totalValue: Math.round(cardData.price * card.quantity * 100) / 100,
        });
      }
    }

    // Sort by total value descending and return top N
    valuedCards.sort((a, b) => b.totalValue - a.totalValue);
    return valuedCards.slice(0, limit);
  },
});

/**
 * Get collection value breakdown by set.
 */
export const getCollectionValueBySet = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    if (collectionCards.length === 0) {
      return [];
    }

    // Group cards by set (extract setId from cardId format "setId-number")
    const cardsBySet = new Map<string, typeof collectionCards>();
    for (const card of collectionCards) {
      const setId = card.cardId.split('-')[0];
      const existing = cardsBySet.get(setId) ?? [];
      existing.push(card);
      cardsBySet.set(setId, existing);
    }

    // Get unique card IDs for pricing lookup
    const uniqueCardIds = Array.from(new Set(collectionCards.map((c) => c.cardId)));

    // Fetch pricing data
    const cachedCards = await Promise.all(
      uniqueCardIds.map((cardId) =>
        ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
          .first()
      )
    );

    // Build a price map
    const priceMap = new Map<string, number>();
    for (const cachedCard of cachedCards) {
      if (cachedCard && typeof cachedCard.priceMarket === 'number' && cachedCard.priceMarket > 0) {
        priceMap.set(cachedCard.cardId, cachedCard.priceMarket);
      }
    }

    // Get set names
    const setIds = [...cardsBySet.keys()];
    const cachedSets = await Promise.all(
      setIds.map((setId) =>
        ctx.db
          .query('cachedSets')
          .withIndex('by_set_id', (q) => q.eq('setId', setId))
          .first()
      )
    );

    const setNameMap = new Map<string, string>();
    for (const set of cachedSets) {
      if (set) {
        setNameMap.set(set.setId, set.name);
      }
    }

    // Calculate value per set
    const setValues: Array<{
      setId: string;
      setName: string;
      totalValue: number;
      cardCount: number;
    }> = [];

    for (const [setId, cards] of cardsBySet) {
      let setValue = 0;
      for (const card of cards) {
        const price = priceMap.get(card.cardId);
        if (price !== undefined) {
          setValue += price * card.quantity;
        }
      }

      setValues.push({
        setId,
        setName: setNameMap.get(setId) ?? setId,
        totalValue: Math.round(setValue * 100) / 100,
        cardCount: cards.length,
      });
    }

    // Sort by value descending
    setValues.sort((a, b) => b.totalValue - a.totalValue);
    return setValues;
  },
});

// ============================================================================
// NEW IN COLLECTION - Cards added in last N days
// ============================================================================

/**
 * Get cards that were added to the collection in the last N days.
 * Uses activity logs to find card_added events and enriches with card details.
 *
 * Performance optimization: Uses by_profile_action_time index with timestamp
 * range query for database-level filtering instead of JS filtering.
 * For logs without timestamp field (legacy), falls back to _creationTime filtering.
 */
export const getNewlyAddedCards = query({
  args: {
    profileId: v.id('profiles'),
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
    gameSlug: v.optional(gameSlugValidator),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 7;
    const limit = args.limit ?? 50;
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;

    // Use by_profile_action_time index with timestamp range query for database-level filtering
    // This filters at the database level instead of fetching all logs and filtering in JS
    const cardAddedLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile_action_time', (q) =>
        q.eq('profileId', args.profileId).eq('action', 'card_added').gte('timestamp', cutoffDate)
      )
      .order('desc')
      .collect();

    // For legacy logs without timestamp field, also query using the old index
    // and filter by _creationTime (this handles historical data)
    const legacyLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile_and_action', (q) =>
        q.eq('profileId', args.profileId).eq('action', 'card_added')
      )
      .order('desc')
      .collect();

    // Filter legacy logs by _creationTime and exclude those already in cardAddedLogs
    const logIds = new Set(cardAddedLogs.map((log) => log._id.toString()));
    const filteredLegacyLogs = legacyLogs.filter(
      (log) =>
        log._creationTime >= cutoffDate &&
        !log.timestamp && // Only include logs without timestamp (legacy)
        !logIds.has(log._id.toString())
    );

    // Combine and sort by time (newest first)
    const recentCardAdds = [...cardAddedLogs, ...filteredLegacyLogs].sort((a, b) => {
      const timeA = a.timestamp ?? a._creationTime;
      const timeB = b.timestamp ?? b._creationTime;
      return timeB - timeA;
    });

    // Get unique card IDs from the activity logs
    const cardAdditions: Array<{
      cardId: string;
      addedAt: number;
      variant: string;
      quantity: number;
    }> = [];

    for (const log of recentCardAdds) {
      const metadata = log.metadata as
        | {
            cardId?: string;
            variant?: string;
            quantity?: number;
          }
        | undefined;

      if (metadata?.cardId) {
        cardAdditions.push({
          cardId: metadata.cardId,
          addedAt: log.timestamp ?? log._creationTime,
          variant: metadata.variant ?? 'normal',
          quantity: metadata.quantity ?? 1,
        });
      }
    }

    // Get unique card IDs for enrichment and game filtering
    const allUniqueCardIds = [...new Set(cardAdditions.map((a) => a.cardId))];

    // Fetch card details from cache
    const cachedCards = await Promise.all(
      allUniqueCardIds.map((cardId) =>
        ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
          .first()
      )
    );

    // Build a map for quick lookups (include gameSlug for filtering)
    const cardDataMap = new Map<
      string,
      { name: string; imageSmall: string; setId: string; rarity: string | undefined; gameSlug: string }
    >();
    for (const cachedCard of cachedCards) {
      if (cachedCard) {
        cardDataMap.set(cachedCard.cardId, {
          name: cachedCard.name,
          imageSmall: cachedCard.imageSmall,
          setId: cachedCard.setId,
          rarity: cachedCard.rarity,
          gameSlug: cachedCard.gameSlug,
        });
      }
    }

    // Filter by game if specified
    let filteredAdditions = cardAdditions;
    if (args.gameSlug) {
      filteredAdditions = cardAdditions.filter((addition) => {
        const cardData = cardDataMap.get(addition.cardId);
        return cardData?.gameSlug === args.gameSlug;
      });
    }

    // Limit results
    const limitedAdditions = filteredAdditions.slice(0, limit);

    // Enrich card additions with details
    const enrichedCards = limitedAdditions.map((addition) => {
      const cardData = cardDataMap.get(addition.cardId);
      return {
        cardId: addition.cardId,
        name: cardData?.name ?? addition.cardId,
        imageSmall: cardData?.imageSmall ?? '',
        setId: cardData?.setId ?? addition.cardId.split('-')[0],
        rarity: cardData?.rarity,
        variant: addition.variant,
        quantity: addition.quantity,
        addedAt: addition.addedAt,
      };
    });

    // Get summary stats (from filtered data if game filter applied)
    const totalNewCards = filteredAdditions.length;
    const uniqueNewCards = new Set(filteredAdditions.map((a) => a.cardId)).size;

    return {
      cards: enrichedCards,
      summary: {
        totalAdditions: totalNewCards,
        uniqueCards: uniqueNewCards,
        daysSearched: days,
        oldestAddition:
          enrichedCards.length > 0 ? enrichedCards[enrichedCards.length - 1].addedAt : null,
        newestAddition: enrichedCards.length > 0 ? enrichedCards[0].addedAt : null,
      },
    };
  },
});

/**
 * Get a summary of cards added recently grouped by day.
 * Useful for showing activity trends and recent additions calendar.
 *
 * Performance optimization: Uses by_profile_action_time index with timestamp
 * range query for database-level filtering instead of JS filtering.
 */
export const getNewlyAddedCardsSummary = query({
  args: {
    profileId: v.id('profiles'),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 7;
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;

    // Use by_profile_action_time index with timestamp range query for database-level filtering
    const cardAddedLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile_action_time', (q) =>
        q.eq('profileId', args.profileId).eq('action', 'card_added').gte('timestamp', cutoffDate)
      )
      .order('desc')
      .collect();

    // For legacy logs without timestamp field, also query and filter by _creationTime
    const legacyLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile_and_action', (q) =>
        q.eq('profileId', args.profileId).eq('action', 'card_added')
      )
      .order('desc')
      .collect();

    // Filter legacy logs and exclude duplicates
    const logIds = new Set(cardAddedLogs.map((log) => log._id.toString()));
    const filteredLegacyLogs = legacyLogs.filter(
      (log) => log._creationTime >= cutoffDate && !log.timestamp && !logIds.has(log._id.toString())
    );

    // Combine results
    const recentCardAdds = [...cardAddedLogs, ...filteredLegacyLogs];

    // Group by date
    const byDate = new Map<
      string,
      { count: number; uniqueCards: Set<string>; totalQuantity: number }
    >();

    for (const log of recentCardAdds) {
      const logTime = log.timestamp ?? log._creationTime;
      const date = new Date(logTime).toISOString().split('T')[0];
      const metadata = log.metadata as
        | {
            cardId?: string;
            quantity?: number;
          }
        | undefined;

      const existing = byDate.get(date) ?? {
        count: 0,
        uniqueCards: new Set<string>(),
        totalQuantity: 0,
      };

      existing.count++;
      if (metadata?.cardId) {
        existing.uniqueCards.add(metadata.cardId);
      }
      existing.totalQuantity += metadata?.quantity ?? 1;

      byDate.set(date, existing);
    }

    // Convert to array sorted by date descending
    const dailySummary = Array.from(byDate.entries())
      .map(([date, data]) => ({
        date,
        additionCount: data.count,
        uniqueCardsCount: data.uniqueCards.size,
        totalQuantity: data.totalQuantity,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // Calculate totals
    const totalAdditions = recentCardAdds.length;
    const allCardIds = new Set<string>();
    let totalQuantity = 0;

    for (const log of recentCardAdds) {
      const metadata = log.metadata as
        | {
            cardId?: string;
            quantity?: number;
          }
        | undefined;
      if (metadata?.cardId) {
        allCardIds.add(metadata.cardId);
      }
      totalQuantity += metadata?.quantity ?? 1;
    }

    return {
      dailySummary,
      totals: {
        totalAdditions,
        uniqueCards: allCardIds.size,
        totalQuantity,
        daysWithActivity: dailySummary.length,
        daysSearched: days,
      },
    };
  },
});

/**
 * Check if a profile has any new cards in the last N days.
 * Lightweight query for showing "New!" badge in UI.
 *
 * Performance optimization: Uses by_profile_action_time index with timestamp
 * range query for database-level filtering instead of JS filtering.
 */
export const hasNewCards = query({
  args: {
    profileId: v.id('profiles'),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 7;
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;

    // Use by_profile_action_time index with timestamp range query for database-level filtering
    const recentLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile_action_time', (q) =>
        q.eq('profileId', args.profileId).eq('action', 'card_added').gte('timestamp', cutoffDate)
      )
      .collect();

    // For legacy logs without timestamp field, also query and filter by _creationTime
    const legacyLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile_and_action', (q) =>
        q.eq('profileId', args.profileId).eq('action', 'card_added')
      )
      .collect();

    // Filter legacy logs and exclude duplicates
    const logIds = new Set(recentLogs.map((log) => log._id.toString()));
    const filteredLegacyLogs = legacyLogs.filter(
      (log) => log._creationTime >= cutoffDate && !log.timestamp && !logIds.has(log._id.toString())
    );

    const totalCount = recentLogs.length + filteredLegacyLogs.length;

    return {
      hasNew: totalCount > 0,
      count: totalCount,
    };
  },
});

// ============================================================================
// COLLECTION COMPARISON
// ============================================================================

/**
 * Get a summary of collection overlap between two profiles.
 */
export const getCollectionComparison = query({
  args: {
    profileId1: v.id('profiles'),
    profileId2: v.id('profiles'),
    gameSlug: v.optional(gameSlugValidator),
  },
  handler: async (ctx, args) => {
    // Prevent comparing a profile with itself
    if (args.profileId1 === args.profileId2) {
      return { error: 'Cannot compare a profile with itself' };
    }

    // Get all cards for both profiles
    let [profile1Cards, profile2Cards] = await Promise.all([
      ctx.db
        .query('collectionCards')
        .withIndex('by_profile', (q) => q.eq('profileId', args.profileId1))
        .collect(),
      ctx.db
        .query('collectionCards')
        .withIndex('by_profile', (q) => q.eq('profileId', args.profileId2))
        .collect(),
    ]);

    // If gameSlug is specified, filter cards by game
    if (args.gameSlug) {
      const allCardIds = new Set([
        ...profile1Cards.map((c) => c.cardId),
        ...profile2Cards.map((c) => c.cardId),
      ]);

      // Batch fetch card data to get game slugs
      const CHUNK_SIZE = 50;
      const cardGameMap = new Map<string, string>();
      const uniqueCardIds = [...allCardIds];

      for (let i = 0; i < uniqueCardIds.length; i += CHUNK_SIZE) {
        const chunk = uniqueCardIds.slice(i, i + CHUNK_SIZE);
        const chunkResults = await Promise.all(
          chunk.map((cardId) =>
            ctx.db
              .query('cachedCards')
              .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
              .first()
          )
        );

        for (const cachedCard of chunkResults) {
          if (cachedCard) {
            cardGameMap.set(cachedCard.cardId, cachedCard.gameSlug);
          }
        }
      }

      // Filter cards by game slug
      profile1Cards = profile1Cards.filter((card) => cardGameMap.get(card.cardId) === args.gameSlug);
      profile2Cards = profile2Cards.filter((card) => cardGameMap.get(card.cardId) === args.gameSlug);
    }

    // Get unique cardIds for each profile
    const profile1CardIds = new Set(profile1Cards.map((c) => c.cardId));
    const profile2CardIds = new Set(profile2Cards.map((c) => c.cardId));

    // Calculate overlap
    const sharedCardIds = new Set([...profile1CardIds].filter((id) => profile2CardIds.has(id)));
    const onlyInProfile1 = new Set([...profile1CardIds].filter((id) => !profile2CardIds.has(id)));
    const onlyInProfile2 = new Set([...profile2CardIds].filter((id) => !profile1CardIds.has(id)));

    // Calculate total quantities
    const profile1TotalQty = profile1Cards.reduce((sum, c) => sum + c.quantity, 0);
    const profile2TotalQty = profile2Cards.reduce((sum, c) => sum + c.quantity, 0);

    return {
      profile1: {
        uniqueCards: profile1CardIds.size,
        totalQuantity: profile1TotalQty,
      },
      profile2: {
        uniqueCards: profile2CardIds.size,
        totalQuantity: profile2TotalQty,
      },
      shared: {
        count: sharedCardIds.size,
        cardIds: Array.from(sharedCardIds),
      },
      onlyInProfile1: {
        count: onlyInProfile1.size,
        cardIds: Array.from(onlyInProfile1),
      },
      onlyInProfile2: {
        count: onlyInProfile2.size,
        cardIds: Array.from(onlyInProfile2),
      },
    };
  },
});

// ============================================================================
// RARITY FILTERING - Filter collection by card rarity
// ============================================================================

/**
 * Get all cards in a collection filtered by rarity.
 * Uses the by_rarity index on cachedCards for efficient filtering.
 */
export const getCollectionByRarity = query({
  args: {
    profileId: v.id('profiles'),
    rarity: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    if (collectionCards.length === 0) {
      return { cards: [], totalCount: 0 };
    }

    // Get unique card IDs
    const uniqueCardIds = Array.from(new Set(collectionCards.map((c) => c.cardId)));

    // Fetch card data from cache
    const cachedCards = await Promise.all(
      uniqueCardIds.map((cardId) =>
        ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
          .first()
      )
    );

    // Build a map of cards that match the rarity
    const matchingCardIds = new Set<string>();
    const cardDataMap = new Map<
      string,
      { name: string; imageSmall: string; setId: string; rarity?: string; types: string[] }
    >();

    for (const cachedCard of cachedCards) {
      if (cachedCard) {
        cardDataMap.set(cachedCard.cardId, {
          name: cachedCard.name,
          imageSmall: cachedCard.imageSmall,
          setId: cachedCard.setId,
          rarity: cachedCard.rarity,
          types: cachedCard.types,
        });

        if (cachedCard.rarity === args.rarity) {
          matchingCardIds.add(cachedCard.cardId);
        }
      }
    }

    // Filter collection to only matching cards
    const filteredCards = collectionCards
      .filter((card) => matchingCardIds.has(card.cardId))
      .map((card) => {
        const cardData = cardDataMap.get(card.cardId);
        return {
          cardId: card.cardId,
          variant: card.variant ?? 'normal',
          quantity: card.quantity,
          name: cardData?.name ?? card.cardId,
          imageSmall: cardData?.imageSmall ?? '',
          setId: cardData?.setId ?? card.cardId.split('-')[0],
          rarity: cardData?.rarity,
          types: cardData?.types ?? [],
        };
      });

    return {
      cards: filteredCards,
      totalCount: filteredCards.length,
    };
  },
});

/**
 * Get collection cards filtered by multiple rarities.
 * Useful for filtering by rarity tier (e.g., all "ultra rare" cards).
 */
export const getCollectionByRarities = query({
  args: {
    profileId: v.id('profiles'),
    rarities: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    if (collectionCards.length === 0) {
      return { cards: [], totalCount: 0 };
    }

    // Get unique card IDs
    const uniqueCardIds = Array.from(new Set(collectionCards.map((c) => c.cardId)));

    // Fetch card data from cache
    const cachedCards = await Promise.all(
      uniqueCardIds.map((cardId) =>
        ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
          .first()
      )
    );

    // Build a map and filter by matching rarities
    const raritySet = new Set(args.rarities);
    const matchingCardIds = new Set<string>();
    const cardDataMap = new Map<
      string,
      { name: string; imageSmall: string; setId: string; rarity?: string; types: string[] }
    >();

    for (const cachedCard of cachedCards) {
      if (cachedCard) {
        cardDataMap.set(cachedCard.cardId, {
          name: cachedCard.name,
          imageSmall: cachedCard.imageSmall,
          setId: cachedCard.setId,
          rarity: cachedCard.rarity,
          types: cachedCard.types,
        });

        if (cachedCard.rarity && raritySet.has(cachedCard.rarity)) {
          matchingCardIds.add(cachedCard.cardId);
        }
      }
    }

    // Filter collection to only matching cards
    const filteredCards = collectionCards
      .filter((card) => matchingCardIds.has(card.cardId))
      .map((card) => {
        const cardData = cardDataMap.get(card.cardId);
        return {
          cardId: card.cardId,
          variant: card.variant ?? 'normal',
          quantity: card.quantity,
          name: cardData?.name ?? card.cardId,
          imageSmall: cardData?.imageSmall ?? '',
          setId: cardData?.setId ?? card.cardId.split('-')[0],
          rarity: cardData?.rarity,
          types: cardData?.types ?? [],
        };
      });

    return {
      cards: filteredCards,
      totalCount: filteredCards.length,
    };
  },
});

/**
 * Get the rarity distribution for a profile's collection.
 * Returns counts and percentages for each rarity.
 */
export const getCollectionRarityDistribution = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    if (collectionCards.length === 0) {
      return {
        distribution: [],
        totalCards: 0,
        uniqueRarities: 0,
        cardsWithRarity: 0,
        cardsWithoutRarity: 0,
      };
    }

    // Get unique card IDs
    const uniqueCardIds = Array.from(new Set(collectionCards.map((c) => c.cardId)));

    // Fetch card data from cache
    const cachedCards = await Promise.all(
      uniqueCardIds.map((cardId) =>
        ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
          .first()
      )
    );

    // Build rarity map
    const rarityMap = new Map<string, string | undefined>();
    for (const cachedCard of cachedCards) {
      if (cachedCard) {
        rarityMap.set(cachedCard.cardId, cachedCard.rarity);
      }
    }

    // Count cards by rarity
    const rarityCounts = new Map<string, number>();
    let cardsWithRarity = 0;
    let cardsWithoutRarity = 0;

    for (const card of collectionCards) {
      const rarity = rarityMap.get(card.cardId);
      if (rarity) {
        rarityCounts.set(rarity, (rarityCounts.get(rarity) ?? 0) + 1);
        cardsWithRarity++;
      } else {
        cardsWithoutRarity++;
      }
    }

    // Convert to distribution array
    const totalCards = collectionCards.length;
    const distribution = Array.from(rarityCounts.entries())
      .map(([rarity, count]) => ({
        rarity,
        count,
        percentage: Math.round((count / totalCards) * 100 * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      distribution,
      totalCards,
      uniqueRarities: distribution.length,
      cardsWithRarity,
      cardsWithoutRarity,
    };
  },
});

/**
 * Get all unique rarities present in a collection.
 * Useful for populating filter dropdowns.
 */
export const getCollectionRarities = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    if (collectionCards.length === 0) {
      return { rarities: [] };
    }

    // Get unique card IDs
    const uniqueCardIds = Array.from(new Set(collectionCards.map((c) => c.cardId)));

    // Fetch card data from cache
    const cachedCards = await Promise.all(
      uniqueCardIds.map((cardId) =>
        ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
          .first()
      )
    );

    // Collect unique rarities
    const rarities = new Set<string>();
    for (const cachedCard of cachedCards) {
      if (cachedCard?.rarity) {
        rarities.add(cachedCard.rarity);
      }
    }

    return {
      rarities: Array.from(rarities).sort(),
    };
  },
});

/**
 * Get cards in a specific set filtered by rarity.
 * Uses set_and_rarity index for efficient lookup.
 */
export const getSetCardsByRarity = query({
  args: {
    setId: v.string(),
    rarity: v.string(),
  },
  handler: async (ctx, args) => {
    // Use the set_and_rarity index for efficient filtering
    const cards = await ctx.db
      .query('cachedCards')
      .withIndex('by_set_and_rarity', (q) => q.eq('setId', args.setId).eq('rarity', args.rarity))
      .collect();

    return {
      cards: cards.map((card) => ({
        cardId: card.cardId,
        name: card.name,
        number: card.number,
        rarity: card.rarity,
        imageSmall: card.imageSmall,
        imageLarge: card.imageLarge,
        types: card.types,
      })),
      totalCount: cards.length,
    };
  },
});

/**
 * Get the rarity distribution for a specific set.
 */
export const getSetRarityDistribution = query({
  args: { setId: v.string() },
  handler: async (ctx, args) => {
    // Get all cards in the set
    const cards = await ctx.db
      .query('cachedCards')
      .withIndex('by_set', (q) => q.eq('setId', args.setId))
      .collect();

    if (cards.length === 0) {
      return {
        distribution: [],
        totalCards: 0,
        uniqueRarities: 0,
      };
    }

    // Count cards by rarity
    const rarityCounts = new Map<string, number>();
    for (const card of cards) {
      const rarity = card.rarity ?? 'Unknown';
      rarityCounts.set(rarity, (rarityCounts.get(rarity) ?? 0) + 1);
    }

    // Convert to distribution array
    const totalCards = cards.length;
    const distribution = Array.from(rarityCounts.entries())
      .map(([rarity, count]) => ({
        rarity,
        count,
        percentage: Math.round((count / totalCards) * 100 * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      distribution,
      totalCards,
      uniqueRarities: distribution.length,
    };
  },
});

/**
 * Combined batch query for VirtualCardGrid component.
 * Merges 4 separate queries into a single optimized query:
 * 1. getCollectionBySet - Cards owned in this set
 * 2. getWishlist - All wishlisted cards (filtered to this set)
 * 3. getNewlyAddedCards - Recently added cards (filtered to this set)
 * 4. getPriorityCount - Count of priority wishlist items
 *
 * This eliminates multiple round-trips and redundant data fetching.
 *
 * Performance optimization: Uses by_profile_action_time index with timestamp
 * range query for database-level filtering of activity logs.
 */
export const getSetViewData = query({
  args: {
    profileId: v.id('profiles'),
    setId: v.string(),
    newlyAddedDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.newlyAddedDays ?? 7;
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;
    const setPrefix = args.setId + '-';

    // Run all queries in parallel for maximum efficiency
    // Use by_profile_action_time index for activity logs to filter at database level
    const [allCollectionCards, allWishlistCards, cardAddedLogs, legacyCardAddedLogs] =
      await Promise.all([
        // Get all collection cards for this profile
        ctx.db
          .query('collectionCards')
          .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
          .collect(),
        // Get all wishlist cards for this profile
        ctx.db
          .query('wishlistCards')
          .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
          .collect(),
        // Get card_added activity logs with timestamp filtering (database-level)
        ctx.db
          .query('activityLogs')
          .withIndex('by_profile_action_time', (q) =>
            q
              .eq('profileId', args.profileId)
              .eq('action', 'card_added')
              .gte('timestamp', cutoffDate)
          )
          .order('desc')
          .collect(),
        // Get legacy card_added logs without timestamp field
        ctx.db
          .query('activityLogs')
          .withIndex('by_profile_and_action', (q) =>
            q.eq('profileId', args.profileId).eq('action', 'card_added')
          )
          .order('desc')
          .collect(),
      ]);

    // 1. Filter collection to cards in this set
    const collectionBySet = allCollectionCards.filter((card) => card.cardId.startsWith(setPrefix));

    // 2. Build wishlist map (cardId -> isPriority) for all wishlist items
    // Also filter to cards in this set for the response
    const wishlistMap = new Map<string, boolean>();
    let priorityCount = 0;

    for (const item of allWishlistCards) {
      wishlistMap.set(item.cardId, item.isPriority ?? false);
      if (item.isPriority) {
        priorityCount++;
      }
    }

    // Filter wishlist to cards in this set
    const wishlistBySet = allWishlistCards
      .filter((item) => item.cardId.startsWith(setPrefix))
      .map((item) => ({
        cardId: item.cardId,
        isPriority: item.isPriority ?? false,
      }));

    // 3. Build newly added card IDs from recent activity logs
    // Combine timestamp-indexed logs with filtered legacy logs
    const logIds = new Set(cardAddedLogs.map((log) => log._id.toString()));
    const filteredLegacyLogs = legacyCardAddedLogs.filter(
      (log) => log._creationTime >= cutoffDate && !log.timestamp && !logIds.has(log._id.toString())
    );
    const recentCardAdds = [...cardAddedLogs, ...filteredLegacyLogs];
    const newlyAddedCardIds = new Set<string>();

    for (const log of recentCardAdds) {
      const metadata = log.metadata as { cardId?: string } | undefined;
      if (metadata?.cardId && metadata.cardId.startsWith(setPrefix)) {
        newlyAddedCardIds.add(metadata.cardId);
      }
    }

    // 4. Priority count is already calculated above
    const maxPriorityItems = 5; // Matches MAX_PRIORITY_ITEMS from wishlist.ts

    return {
      // Collection data for this set
      collection: collectionBySet,

      // Wishlist data for this set
      wishlist: wishlistBySet,

      // Full wishlist map for quick lookups (includes cards from other sets)
      wishlistMap: Object.fromEntries(wishlistMap),

      // Newly added card IDs in this set
      newlyAddedCardIds: Array.from(newlyAddedCardIds),

      // Priority count info
      priorityCount: {
        count: priorityCount,
        max: maxPriorityItems,
        remaining: maxPriorityItems - priorityCount,
      },

      // Summary stats
      stats: {
        ownedInSet: collectionBySet.length,
        wishlistedInSet: wishlistBySet.length,
        newlyAddedInSet: newlyAddedCardIds.size,
      },
    };
  },
});

/**
 * Check collection progress for a specific rarity within a set.
 * Returns how many cards of that rarity the user owns vs total in set.
 */
export const getSetRarityProgress = query({
  args: {
    profileId: v.id('profiles'),
    setId: v.string(),
    rarity: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all cards of this rarity in the set
    const setCards = await ctx.db
      .query('cachedCards')
      .withIndex('by_set_and_rarity', (q) => q.eq('setId', args.setId).eq('rarity', args.rarity))
      .collect();

    const totalInSet = setCards.length;
    if (totalInSet === 0) {
      return {
        owned: 0,
        total: 0,
        percentage: 0,
        missing: [],
      };
    }

    // Get user's collection for this set
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Filter to cards in this set
    const ownedSetCards = collectionCards.filter((card) =>
      card.cardId.startsWith(args.setId + '-')
    );
    const ownedCardIds = new Set(ownedSetCards.map((c) => c.cardId));

    // Find which cards of this rarity are owned
    let owned = 0;
    const missing: Array<{ cardId: string; name: string; imageSmall: string }> = [];

    for (const card of setCards) {
      if (ownedCardIds.has(card.cardId)) {
        owned++;
      } else {
        missing.push({
          cardId: card.cardId,
          name: card.name,
          imageSmall: card.imageSmall,
        });
      }
    }

    return {
      owned,
      total: totalInSet,
      percentage: Math.round((owned / totalInSet) * 100 * 100) / 100,
      missing,
    };
  },
});

// ============================================================================
// OPTIMIZED BATCH QUERIES - High performance queries for large collections
// ============================================================================

/**
 * Batch fetch card data for multiple cardIds efficiently.
 * Uses chunked parallel fetching to avoid overwhelming the database.
 * Returns a map of cardId -> card data for O(1) lookups.
 */
export const batchGetCardData = query({
  args: {
    cardIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.cardIds.length === 0) {
      return { cards: {}, missing: [], hitRate: 1 };
    }

    // Deduplicate cardIds
    const uniqueCardIds = [...new Set(args.cardIds)];

    // Batch size optimization: process in chunks to avoid overwhelming DB
    const CHUNK_SIZE = 50;
    const chunks: string[][] = [];
    for (let i = 0; i < uniqueCardIds.length; i += CHUNK_SIZE) {
      chunks.push(uniqueCardIds.slice(i, i + CHUNK_SIZE));
    }

    // Fetch all chunks in parallel (within each chunk)
    const allResults: Array<{
      cardId: string;
      name: string;
      imageSmall: string;
      imageLarge: string;
      setId: string;
      rarity?: string;
      types: string[];
      priceMarket?: number;
    } | null> = [];

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map((cardId) =>
          ctx.db
            .query('cachedCards')
            .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
            .first()
        )
      );
      allResults.push(...chunkResults);
    }

    // Build result map
    const cards: Record<
      string,
      {
        name: string;
        imageSmall: string;
        imageLarge: string;
        setId: string;
        rarity?: string;
        types: string[];
        priceMarket?: number;
      }
    > = {};
    const missing: string[] = [];

    for (let i = 0; i < uniqueCardIds.length; i++) {
      const cardId = uniqueCardIds[i];
      const result = allResults[i];
      if (result) {
        cards[cardId] = {
          name: result.name,
          imageSmall: result.imageSmall,
          imageLarge: result.imageLarge,
          setId: result.setId,
          rarity: result.rarity,
          types: result.types,
          priceMarket: result.priceMarket,
        };
      } else {
        missing.push(cardId);
      }
    }

    return {
      cards,
      missing,
      hitRate: uniqueCardIds.length > 0 ? Object.keys(cards).length / uniqueCardIds.length : 1,
    };
  },
});

/**
 * Batch fetch set data for multiple setIds efficiently.
 */
export const batchGetSetData = query({
  args: {
    setIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.setIds.length === 0) {
      return { sets: {}, missing: [], hitRate: 1 };
    }

    // Deduplicate setIds
    const uniqueSetIds = [...new Set(args.setIds)];

    // Fetch all sets in parallel
    const results = await Promise.all(
      uniqueSetIds.map((setId) =>
        ctx.db
          .query('cachedSets')
          .withIndex('by_set_id', (q) => q.eq('setId', setId))
          .first()
      )
    );

    // Build result map
    const sets: Record<
      string,
      {
        name: string;
        series: string;
        totalCards: number;
        releaseDate: string;
        logoUrl?: string;
      }
    > = {};
    const missing: string[] = [];

    for (let i = 0; i < uniqueSetIds.length; i++) {
      const setId = uniqueSetIds[i];
      const result = results[i];
      if (result) {
        sets[setId] = {
          name: result.name,
          series: result.series,
          totalCards: result.totalCards,
          releaseDate: result.releaseDate,
          logoUrl: result.logoUrl,
        };
      } else {
        missing.push(setId);
      }
    }

    return {
      sets,
      missing,
      hitRate: uniqueSetIds.length > 0 ? Object.keys(sets).length / uniqueSetIds.length : 1,
    };
  },
});

/**
 * Get collection with enriched card data in a single optimized query.
 * This is the preferred way to get a collection with all card details.
 * Uses batch fetching and efficient grouping.
 */
export const getCollectionWithDetails = query({
  args: {
    profileId: v.id('profiles'),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    if (collectionCards.length === 0) {
      return {
        cards: [],
        total: 0,
        hasMore: false,
      };
    }

    // Apply pagination if requested
    const offset = args.offset ?? 0;
    const limit = args.limit ?? collectionCards.length;
    const paginatedCards = collectionCards.slice(offset, offset + limit);
    const hasMore = offset + limit < collectionCards.length;

    // Get unique card IDs from paginated results only
    const uniqueCardIds = [...new Set(paginatedCards.map((c) => c.cardId))];

    // Batch fetch card data - use chunking for large collections
    const CHUNK_SIZE = 50;
    const chunks: string[][] = [];
    for (let i = 0; i < uniqueCardIds.length; i += CHUNK_SIZE) {
      chunks.push(uniqueCardIds.slice(i, i + CHUNK_SIZE));
    }

    const cardDataMap = new Map<
      string,
      { name: string; imageSmall: string; setId: string; rarity?: string; types: string[] }
    >();

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map((cardId) =>
          ctx.db
            .query('cachedCards')
            .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
            .first()
        )
      );

      for (const card of chunkResults) {
        if (card) {
          cardDataMap.set(card.cardId, {
            name: card.name,
            imageSmall: card.imageSmall,
            setId: card.setId,
            rarity: card.rarity,
            types: card.types,
          });
        }
      }
    }

    // Enrich collection cards with cached data
    const enrichedCards = paginatedCards.map((card) => {
      const cachedData = cardDataMap.get(card.cardId);
      return {
        _id: card._id,
        cardId: card.cardId,
        variant: card.variant ?? 'normal',
        quantity: card.quantity,
        name: cachedData?.name ?? card.cardId,
        imageSmall: cachedData?.imageSmall ?? '',
        setId: cachedData?.setId ?? card.cardId.split('-')[0],
        rarity: cachedData?.rarity,
        types: cachedData?.types ?? [],
      };
    });

    return {
      cards: enrichedCards,
      total: collectionCards.length,
      hasMore,
    };
  },
});

/**
 * Get collection stats with set completion progress - optimized for dashboard display.
 * Returns aggregated stats without fetching individual card details.
 */
export const getCollectionDashboardStats = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    if (collectionCards.length === 0) {
      return {
        totalCards: 0,
        uniqueCards: 0,
        totalQuantity: 0,
        setsStarted: 0,
        setProgress: [],
      };
    }

    // Calculate stats in single pass
    let totalQuantity = 0;
    const uniqueCardIds = new Set<string>();
    const cardsBySet = new Map<string, Set<string>>();

    for (const card of collectionCards) {
      totalQuantity += card.quantity;
      uniqueCardIds.add(card.cardId);

      // Extract setId
      const dashIndex = card.cardId.lastIndexOf('-');
      const setId = dashIndex > 0 ? card.cardId.substring(0, dashIndex) : card.cardId;

      const setCards = cardsBySet.get(setId) ?? new Set<string>();
      setCards.add(card.cardId);
      cardsBySet.set(setId, setCards);
    }

    // Get set data for progress calculation
    const setIds = [...cardsBySet.keys()];
    const setDataResults = await Promise.all(
      setIds.map((setId) =>
        ctx.db
          .query('cachedSets')
          .withIndex('by_set_id', (q) => q.eq('setId', setId))
          .first()
      )
    );

    // Build set progress data
    const setProgress: Array<{
      setId: string;
      setName: string;
      owned: number;
      total: number;
      percentage: number;
    }> = [];

    for (let i = 0; i < setIds.length; i++) {
      const setId = setIds[i];
      const setData = setDataResults[i];
      const ownedCards = cardsBySet.get(setId)?.size ?? 0;
      const totalCards = setData?.totalCards ?? 0;

      setProgress.push({
        setId,
        setName: setData?.name ?? setId,
        owned: ownedCards,
        total: totalCards,
        percentage: totalCards > 0 ? Math.round((ownedCards / totalCards) * 100 * 100) / 100 : 0,
      });
    }

    // Sort by percentage descending
    setProgress.sort((a, b) => b.percentage - a.percentage);

    return {
      totalCards: collectionCards.length,
      uniqueCards: uniqueCardIds.size,
      totalQuantity,
      setsStarted: setIds.length,
      setProgress: setProgress.slice(0, 10), // Return top 10 sets
    };
  },
});

/**
 * Get cards by set with optimized batch enrichment.
 * Filters at the collection level before enrichment for better performance.
 */
export const getCollectionBySetOptimized = query({
  args: {
    profileId: v.id('profiles'),
    setId: v.string(),
    includeSetCompletion: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    const allCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Filter by set prefix efficiently
    const setPrefix = args.setId + '-';
    const setCards = allCards.filter((card) => card.cardId.startsWith(setPrefix));

    if (setCards.length === 0) {
      return {
        cards: [],
        totalInCollection: 0,
        setCompletion: args.includeSetCompletion
          ? { owned: 0, total: 0, percentage: 0, missing: [] }
          : undefined,
      };
    }

    // Batch fetch card data for this set's cards only
    const uniqueCardIds = [...new Set(setCards.map((c) => c.cardId))];
    const cardDataResults = await Promise.all(
      uniqueCardIds.map((cardId) =>
        ctx.db
          .query('cachedCards')
          .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
          .first()
      )
    );

    // Build lookup map
    const cardDataMap = new Map<
      string,
      { name: string; imageSmall: string; rarity?: string; types: string[]; number: string }
    >();
    for (const card of cardDataResults) {
      if (card) {
        cardDataMap.set(card.cardId, {
          name: card.name,
          imageSmall: card.imageSmall,
          rarity: card.rarity,
          types: card.types,
          number: card.number,
        });
      }
    }

    // Enrich collection cards
    const enrichedCards = setCards.map((card) => {
      const cachedData = cardDataMap.get(card.cardId);
      return {
        cardId: card.cardId,
        variant: card.variant ?? 'normal',
        quantity: card.quantity,
        name: cachedData?.name ?? card.cardId,
        imageSmall: cachedData?.imageSmall ?? '',
        rarity: cachedData?.rarity,
        types: cachedData?.types ?? [],
        number: cachedData?.number ?? '',
      };
    });

    // Sort by card number
    enrichedCards.sort((a, b) => {
      const numA = parseInt(a.number) || 0;
      const numB = parseInt(b.number) || 0;
      return numA - numB;
    });

    // Get set completion if requested
    let setCompletion:
      | { owned: number; total: number; percentage: number; missing: string[] }
      | undefined;

    if (args.includeSetCompletion) {
      // Get set info
      const setData = await ctx.db
        .query('cachedSets')
        .withIndex('by_set_id', (q) => q.eq('setId', args.setId))
        .first();

      // Get all cards in this set
      const allSetCards = await ctx.db
        .query('cachedCards')
        .withIndex('by_set', (q) => q.eq('setId', args.setId))
        .collect();

      const ownedCardIds = new Set(setCards.map((c) => c.cardId));
      const missingCards = allSetCards.filter((card) => !ownedCardIds.has(card.cardId));

      setCompletion = {
        owned: ownedCardIds.size,
        total: setData?.totalCards ?? allSetCards.length,
        percentage:
          (setData?.totalCards ?? allSetCards.length) > 0
            ? Math.round(
                (ownedCardIds.size / (setData?.totalCards ?? allSetCards.length)) * 100 * 100
              ) / 100
            : 0,
        missing: missingCards.map((c) => c.cardId).slice(0, 50), // Limit missing cards returned
      };
    }

    return {
      cards: enrichedCards,
      totalInCollection: setCards.length,
      setCompletion,
    };
  },
});
