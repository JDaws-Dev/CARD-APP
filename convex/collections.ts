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
      metadata: {
        cardId: args.cardId,
        cardName: args.cardName ?? args.cardId,
        setName: args.setName,
        variant,
        quantity,
      },
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
          metadata: {
            cardId: args.cardId,
            cardName,
            setName: args.setName,
            variantsRemoved: allVariants.length,
          },
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
      return {
        tradeableCards: [],
        totalTradeable: 0,
        error: 'Cannot compare a profile with itself',
      };
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
// NEW IN COLLECTION - Cards added in last N days
// ============================================================================

/**
 * Get cards that were added to the collection in the last N days.
 * Uses activity logs to find card_added events and enriches with card details.
 */
export const getNewlyAddedCards = query({
  args: {
    profileId: v.id('profiles'),
    days: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 7;
    const limit = args.limit ?? 50;
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get activity logs for this profile
    const allLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .collect();

    // Filter to card_added events within the time window
    const recentCardAdds = allLogs.filter(
      (log) => log.action === 'card_added' && log._creationTime >= cutoffDate
    );

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
          addedAt: log._creationTime,
          variant: metadata.variant ?? 'normal',
          quantity: metadata.quantity ?? 1,
        });
      }
    }

    // Limit results
    const limitedAdditions = cardAdditions.slice(0, limit);

    // Get unique card IDs for enrichment
    const uniqueCardIds = [...new Set(limitedAdditions.map((a) => a.cardId))];

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
      { name: string; imageSmall: string; setId: string; rarity: string | undefined }
    >();
    for (const cachedCard of cachedCards) {
      if (cachedCard) {
        cardDataMap.set(cachedCard.cardId, {
          name: cachedCard.name,
          imageSmall: cachedCard.imageSmall,
          setId: cachedCard.setId,
          rarity: cachedCard.rarity,
        });
      }
    }

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

    // Get summary stats
    const totalNewCards = recentCardAdds.length;
    const uniqueNewCards = new Set(
      recentCardAdds
        .map((log) => (log.metadata as { cardId?: string } | undefined)?.cardId)
        .filter(Boolean)
    ).size;

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
 */
export const getNewlyAddedCardsSummary = query({
  args: {
    profileId: v.id('profiles'),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 7;
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get activity logs for this profile
    const allLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Filter to card_added events within the time window
    const recentCardAdds = allLogs.filter(
      (log) => log.action === 'card_added' && log._creationTime >= cutoffDate
    );

    // Group by date
    const byDate = new Map<
      string,
      { count: number; uniqueCards: Set<string>; totalQuantity: number }
    >();

    for (const log of recentCardAdds) {
      const date = new Date(log._creationTime).toISOString().split('T')[0];
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
 */
export const hasNewCards = query({
  args: {
    profileId: v.id('profiles'),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 7;
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get recent activity logs - just take first one to check
    const recentLog = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .first();

    if (!recentLog) {
      return { hasNew: false, count: 0 };
    }

    // If most recent activity is older than cutoff, no new cards
    if (recentLog._creationTime < cutoffDate) {
      return { hasNew: false, count: 0 };
    }

    // Need to count all card_added events in the window
    const allLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const recentCardAdds = allLogs.filter(
      (log) => log.action === 'card_added' && log._creationTime >= cutoffDate
    );

    return {
      hasNew: recentCardAdds.length > 0,
      count: recentCardAdds.length,
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
