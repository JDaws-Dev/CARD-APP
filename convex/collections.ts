import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Card variant type for consistent typing across queries and mutations
const cardVariant = v.union(
  v.literal('normal'),
  v.literal('holofoil'),
  v.literal('reverseHolofoil'),
  v.literal('1stEditionHolofoil'),
  v.literal('1stEditionNormal')
);

// ============================================================================
// QUERIES
// ============================================================================

export const getCollection = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();
  },
});

export const getCollectionBySet = query({
  args: { profileId: v.id('profiles'), setId: v.string() },
  handler: async (ctx, args) => {
    const allCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Filter by set (cardId format is "setId-number")
    return allCards.filter((card) => card.cardId.startsWith(args.setId + '-'));
  },
});

export const getCollectionStats = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

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

    if (existing) {
      // Update quantity for this variant
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + quantity,
      });
      return existing._id;
    }

    // Create new card entry with variant
    const cardEntryId = await ctx.db.insert('collectionCards', {
      profileId: args.profileId,
      cardId: args.cardId,
      variant,
      quantity,
    });

    // Log activity with card name and set name for display
    await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'card_added',
      metadata: { cardId: args.cardId, cardName: args.cardName ?? args.cardId, setName: args.setName, variant, quantity },
    });

    return cardEntryId;
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

        // Log activity
        await ctx.db.insert('activityLogs', {
          profileId: args.profileId,
          action: 'card_removed',
          metadata: { cardId: args.cardId, cardName, setName: args.setName, variant: args.variant },
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
        // Log activity
        await ctx.db.insert('activityLogs', {
          profileId: args.profileId,
          action: 'card_removed',
          metadata: { cardId: args.cardId, cardName, setName: args.setName, variantsRemoved: allVariants.length },
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
  },
  handler: async (ctx, args) => {
    // Prevent comparing a profile with itself
    if (args.profileId1 === args.profileId2) {
      return { duplicates: [], totalDuplicates: 0, error: 'Cannot compare a profile with itself' };
    }

    // Get all cards for both profiles
    const [profile1Cards, profile2Cards] = await Promise.all([
      ctx.db
        .query('collectionCards')
        .withIndex('by_profile', (q) => q.eq('profileId', args.profileId1))
        .collect(),
      ctx.db
        .query('collectionCards')
        .withIndex('by_profile', (q) => q.eq('profileId', args.profileId2))
        .collect(),
    ]);

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
  },
  handler: async (ctx, args) => {
    // Prevent comparing a profile with itself
    if (args.fromProfileId === args.toProfileId) {
      return { tradeableCards: [], totalTradeable: 0, error: 'Cannot compare a profile with itself' };
    }

    // Get all cards for both profiles
    const [fromProfileCards, toProfileCards] = await Promise.all([
      ctx.db
        .query('collectionCards')
        .withIndex('by_profile', (q) => q.eq('profileId', args.fromProfileId))
        .collect(),
      ctx.db
        .query('collectionCards')
        .withIndex('by_profile', (q) => q.eq('profileId', args.toProfileId))
        .collect(),
    ]);

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

    // Build a price and name map
    const cardDataMap = new Map<string, { price: number; name: string; imageSmall: string }>();
    for (const cachedCard of cachedCards) {
      if (cachedCard && typeof cachedCard.priceMarket === 'number' && cachedCard.priceMarket > 0) {
        cardDataMap.set(cachedCard.cardId, {
          price: cachedCard.priceMarket,
          name: cachedCard.name,
          imageSmall: cachedCard.imageSmall,
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
// COLLECTION COMPARISON
// ============================================================================

/**
 * Get a summary of collection overlap between two profiles.
 */
export const getCollectionComparison = query({
  args: {
    profileId1: v.id('profiles'),
    profileId2: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    // Prevent comparing a profile with itself
    if (args.profileId1 === args.profileId2) {
      return { error: 'Cannot compare a profile with itself' };
    }

    // Get all cards for both profiles
    const [profile1Cards, profile2Cards] = await Promise.all([
      ctx.db
        .query('collectionCards')
        .withIndex('by_profile', (q) => q.eq('profileId', args.profileId1))
        .collect(),
      ctx.db
        .query('collectionCards')
        .withIndex('by_profile', (q) => q.eq('profileId', args.profileId2))
        .collect(),
    ]);

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
