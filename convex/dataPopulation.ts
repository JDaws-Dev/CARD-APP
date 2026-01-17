/**
 * Data Population Module
 *
 * Convex actions for fetching and caching TCG data from external APIs.
 * This enables the multi-TCG architecture by populating the cachedSets and cachedCards tables.
 *
 * Usage:
 * - Call populateGameData action with a game slug to fetch and cache all sets/cards
 * - Call populateSetsOnly action to fetch only sets (faster, for initial setup)
 * - Call populateSetCards action to fetch cards for a specific set
 * - Use getPopulationStatus query to check progress
 *
 * Rate Limiting:
 * Each game API has different rate limits, implemented via delays between requests.
 * The actions are designed to be resumable - they skip data that already exists.
 *
 * Important: This file uses direct HTTP fetch calls (not client-side API adapters)
 * because Convex actions run in Convex's runtime, not the browser/Next.js environment.
 */
import { v } from 'convex/values';
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from './_generated/server';
import { internal } from './_generated/api';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Game slug type matching schema
 */
type GameSlug = 'pokemon' | 'yugioh' | 'mtg' | 'onepiece' | 'lorcana' | 'digimon' | 'dragonball';

const gameSlugValidator = v.union(
  v.literal('pokemon'),
  v.literal('yugioh'),
  v.literal('mtg'),
  v.literal('onepiece'),
  v.literal('lorcana'),
  v.literal('digimon'),
  v.literal('dragonball')
);

/**
 * Rate limits per game (milliseconds between requests)
 */
const RATE_LIMITS: Record<GameSlug, number> = {
  pokemon: 100, // pokemontcg.io - generous (with API key: 1000 req/day)
  yugioh: 50, // ygoprodeck.com - 20 req/sec
  mtg: 100, // scryfall.com - 10 req/sec
  onepiece: 100, // optcg-api - conservative
  lorcana: 100, // lorcast.com - 10 req/sec
  digimon: 700, // digimoncard.io - 15 req/10sec
  dragonball: 100, // apitcg.com - conservative
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with error handling
 */
async function fetchJSON<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const defaultHeaders: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'KidCollect/1.0 (https://kidcollect.app)',
  };

  const response = await fetch(url, {
    headers: { ...defaultHeaders, ...headers },
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(`Rate limit exceeded. Please wait before retrying.`);
    }
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Calculate cutoff date for filtering sets by age
 * @param maxAgeMonths - Maximum age in months for sets to include (null means no filter)
 * @returns Date object representing the cutoff, or null if no filtering
 */
function getCutoffDate(maxAgeMonths: number | null | undefined): Date | null {
  if (maxAgeMonths === null || maxAgeMonths === undefined || maxAgeMonths <= 0) {
    return null;
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - maxAgeMonths, now.getDate());
}

/**
 * Check if a set's release date is within the allowed age range
 * @param releaseDate - The release date string (YYYY-MM-DD format)
 * @param cutoffDate - The cutoff date (sets released before this are excluded)
 * @returns true if the set should be included, false if it should be filtered out
 */
function isSetWithinAgeLimit(releaseDate: string, cutoffDate: Date | null): boolean {
  if (cutoffDate === null) {
    return true; // No filtering when cutoffDate is null
  }

  try {
    const releaseDateObj = new Date(releaseDate);
    // Invalid dates should be included (don't filter on bad data)
    if (isNaN(releaseDateObj.getTime())) {
      return true;
    }
    return releaseDateObj.getTime() >= cutoffDate.getTime();
  } catch {
    // If date parsing fails, include the set
    return true;
  }
}

// =============================================================================
// INTERNAL MUTATIONS - For data insertion
// =============================================================================

/**
 * Upsert a single set into cachedSets
 */
export const upsertCachedSet = internalMutation({
  args: {
    setId: v.string(),
    gameSlug: gameSlugValidator,
    name: v.string(),
    series: v.string(),
    releaseDate: v.string(),
    totalCards: v.number(),
    logoUrl: v.optional(v.string()),
    symbolUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if set already exists
    const existing = await ctx.db
      .query('cachedSets')
      .withIndex('by_set_id', (q) => q.eq('setId', args.setId))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        name: args.name,
        series: args.series,
        releaseDate: args.releaseDate,
        totalCards: args.totalCards,
        logoUrl: args.logoUrl,
        symbolUrl: args.symbolUrl,
      });
      return { action: 'updated', setId: args.setId };
    }

    // Insert new
    await ctx.db.insert('cachedSets', {
      setId: args.setId,
      gameSlug: args.gameSlug,
      name: args.name,
      series: args.series,
      releaseDate: args.releaseDate,
      totalCards: args.totalCards,
      logoUrl: args.logoUrl,
      symbolUrl: args.symbolUrl,
    });
    return { action: 'inserted', setId: args.setId };
  },
});

/**
 * Upsert a single card into cachedCards
 */
export const upsertCachedCard = internalMutation({
  args: {
    cardId: v.string(),
    gameSlug: gameSlugValidator,
    setId: v.string(),
    name: v.string(),
    number: v.string(),
    supertype: v.string(),
    subtypes: v.array(v.string()),
    types: v.array(v.string()),
    rarity: v.optional(v.string()),
    imageSmall: v.string(),
    imageLarge: v.string(),
    tcgPlayerUrl: v.optional(v.string()),
    priceMarket: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if card already exists
    const existing = await ctx.db
      .query('cachedCards')
      .withIndex('by_card_id', (q) => q.eq('cardId', args.cardId))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        name: args.name,
        number: args.number,
        supertype: args.supertype,
        subtypes: args.subtypes,
        types: args.types,
        rarity: args.rarity,
        imageSmall: args.imageSmall,
        imageLarge: args.imageLarge,
        tcgPlayerUrl: args.tcgPlayerUrl,
        priceMarket: args.priceMarket,
      });
      return { action: 'updated', cardId: args.cardId };
    }

    // Insert new
    await ctx.db.insert('cachedCards', {
      cardId: args.cardId,
      gameSlug: args.gameSlug,
      setId: args.setId,
      name: args.name,
      number: args.number,
      supertype: args.supertype,
      subtypes: args.subtypes,
      types: args.types,
      rarity: args.rarity,
      imageSmall: args.imageSmall,
      imageLarge: args.imageLarge,
      tcgPlayerUrl: args.tcgPlayerUrl,
      priceMarket: args.priceMarket,
    });
    return { action: 'inserted', cardId: args.cardId };
  },
});

/**
 * Batch upsert cards (more efficient for large datasets)
 */
export const batchUpsertCards = internalMutation({
  args: {
    cards: v.array(
      v.object({
        cardId: v.string(),
        gameSlug: gameSlugValidator,
        setId: v.string(),
        name: v.string(),
        number: v.string(),
        supertype: v.string(),
        subtypes: v.array(v.string()),
        types: v.array(v.string()),
        rarity: v.optional(v.string()),
        imageSmall: v.string(),
        imageLarge: v.string(),
        tcgPlayerUrl: v.optional(v.string()),
        priceMarket: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const card of args.cards) {
      const existing = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', card.cardId))
        .first();

      if (existing) {
        // Only update if data actually changed
        if (
          existing.name !== card.name ||
          existing.priceMarket !== card.priceMarket ||
          existing.imageSmall !== card.imageSmall
        ) {
          await ctx.db.patch(existing._id, {
            name: card.name,
            number: card.number,
            supertype: card.supertype,
            subtypes: card.subtypes,
            types: card.types,
            rarity: card.rarity,
            imageSmall: card.imageSmall,
            imageLarge: card.imageLarge,
            tcgPlayerUrl: card.tcgPlayerUrl,
            priceMarket: card.priceMarket,
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        await ctx.db.insert('cachedCards', card);
        inserted++;
      }
    }

    return { inserted, updated, skipped };
  },
});

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get population status for all games or a specific game
 */
export const getPopulationStatus = query({
  args: {
    gameSlug: v.optional(gameSlugValidator),
  },
  handler: async (ctx, args) => {
    const games: GameSlug[] = args.gameSlug
      ? [args.gameSlug]
      : ['pokemon', 'yugioh', 'mtg', 'onepiece', 'lorcana', 'digimon', 'dragonball'];

    const status: Record<
      string,
      { setCount: number; cardCount: number; lastUpdated: number | null }
    > = {};

    for (const game of games) {
      const sets = await ctx.db
        .query('cachedSets')
        .withIndex('by_game', (q) => q.eq('gameSlug', game))
        .collect();

      const cards = await ctx.db
        .query('cachedCards')
        .withIndex('by_game', (q) => q.eq('gameSlug', game))
        .collect();

      status[game] = {
        setCount: sets.length,
        cardCount: cards.length,
        lastUpdated: cards.length > 0 ? Math.max(...cards.map((c) => c._creationTime)) : null,
      };
    }

    if (args.gameSlug) {
      return status[args.gameSlug];
    }

    const allSets = Object.values(status).reduce((sum, s) => sum + s.setCount, 0);
    const allCards = Object.values(status).reduce((sum, s) => sum + s.cardCount, 0);

    return {
      totalSets: allSets,
      totalCards: allCards,
      byGame: status,
    };
  },
});

/**
 * Get cached sets for a game (internal)
 */
export const getCachedSets = internalQuery({
  args: {
    gameSlug: gameSlugValidator,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sets = await ctx.db
      .query('cachedSets')
      .withIndex('by_game', (q) => q.eq('gameSlug', args.gameSlug))
      .collect();

    // Sort by release date descending
    sets.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

    return args.limit ? sets.slice(0, args.limit) : sets;
  },
});

/**
 * Get cached sets by their IDs (public query)
 * Returns a map of setId -> set name for efficient lookup.
 *
 * @param setIds - Array of set IDs to look up (max 100)
 * @returns Object with setId keys and set name values
 */
export const getSetNamesByIds = query({
  args: {
    setIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Limit to prevent abuse
    const setIds = args.setIds.slice(0, 100);

    // Look up each set in parallel
    const setLookups = await Promise.all(
      setIds.map((setId) =>
        ctx.db
          .query('cachedSets')
          .withIndex('by_set_id', (q) => q.eq('setId', setId))
          .first()
      )
    );

    // Build a map of setId -> name
    const setNames: Record<string, string> = {};
    for (const set of setLookups) {
      if (set) {
        setNames[set.setId] = set.name;
      }
    }

    return setNames;
  },
});

/**
 * Get cached sets for a game (public query)
 * Supports optional cutoff date filtering for kid-friendly set display.
 *
 * @param gameSlug - The game to get sets for (required)
 * @param cutoffDate - Optional ISO date string (YYYY-MM-DD). Only return sets released on or after this date.
 * @param includeOutOfPrint - Whether to include out-of-print sets (default true for backwards compatibility)
 */
export const getSetsByGame = query({
  args: {
    gameSlug: gameSlugValidator,
    cutoffDate: v.optional(v.string()),
    includeOutOfPrint: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const sets = await ctx.db
      .query('cachedSets')
      .withIndex('by_game', (q) => q.eq('gameSlug', args.gameSlug))
      .collect();

    // Apply cutoff date filter if provided
    let filteredSets = sets;
    if (args.cutoffDate) {
      const cutoffTime = new Date(args.cutoffDate).getTime();
      filteredSets = filteredSets.filter((set) => {
        const releaseTime = new Date(set.releaseDate).getTime();
        return releaseTime >= cutoffTime;
      });
    }

    // Filter out-of-print sets if requested (default: include all)
    if (args.includeOutOfPrint === false) {
      filteredSets = filteredSets.filter(
        (set) =>
          set.isInPrint === true ||
          set.isInPrint === undefined || // Include sets without print status (backwards compatibility)
          (set.printStatus !== 'out_of_print' && set.printStatus !== 'vintage')
      );
    }

    // Sort by release date descending
    filteredSets.sort(
      (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );

    return filteredSets;
  },
});

/**
 * Print status validator for mutations
 */
const printStatusValidator = v.union(
  v.literal('current'),
  v.literal('limited'),
  v.literal('out_of_print'),
  v.literal('vintage')
);

/**
 * Get only in-print sets for a game (kid-friendly query)
 *
 * Returns sets that are currently available at retail, focusing on sets
 * kids can actually buy today. Uses isInPrint flag and printStatus field.
 *
 * Sets are considered "in print" if:
 * - isInPrint is explicitly true, OR
 * - printStatus is 'current' or 'limited', OR
 * - Released within the last 24 months (fallback for sets without print status)
 *
 * @param gameSlug - The game to get sets for (required)
 * @param maxAgeMonths - Maximum age in months for fallback (default 24)
 */
export const getInPrintSets = query({
  args: {
    gameSlug: gameSlugValidator,
    maxAgeMonths: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const maxAgeMonths = args.maxAgeMonths ?? 24;

    // Use the index to efficiently get sets by game and isInPrint
    // First try to get sets with isInPrint: true
    const inPrintSets = await ctx.db
      .query('cachedSets')
      .withIndex('by_game_and_print_status', (q) =>
        q.eq('gameSlug', args.gameSlug).eq('isInPrint', true)
      )
      .collect();

    // Also get all sets to find ones without explicit print status
    const allSets = await ctx.db
      .query('cachedSets')
      .withIndex('by_game', (q) => q.eq('gameSlug', args.gameSlug))
      .collect();

    // Calculate cutoff date for fallback
    const now = new Date();
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - maxAgeMonths, now.getDate());
    const cutoffTime = cutoffDate.getTime();

    // Build set of already-included IDs
    const includedSetIds = new Set(inPrintSets.map((s) => s.setId));

    // Add sets that qualify via other criteria
    const additionalSets = allSets.filter((set) => {
      // Skip if already included
      if (includedSetIds.has(set.setId)) {
        return false;
      }

      // Include if printStatus is current or limited
      if (set.printStatus === 'current' || set.printStatus === 'limited') {
        return true;
      }

      // Skip if explicitly out of print or vintage
      if (set.printStatus === 'out_of_print' || set.printStatus === 'vintage') {
        return false;
      }

      // Skip if isInPrint is explicitly false
      if (set.isInPrint === false) {
        return false;
      }

      // Fallback: include if released within maxAgeMonths
      if (set.isInPrint === undefined && set.printStatus === undefined) {
        const releaseTime = new Date(set.releaseDate).getTime();
        return releaseTime >= cutoffTime;
      }

      return false;
    });

    // Combine and sort
    const combinedSets = [...inPrintSets, ...additionalSets];
    combinedSets.sort(
      (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
    );

    return {
      sets: combinedSets,
      count: combinedSets.length,
      maxAgeMonths,
      cutoffDate: cutoffDate.toISOString().split('T')[0],
    };
  },
});

/**
 * Mark sets as out of print (admin mutation)
 *
 * Updates the isInPrint and printStatus fields for one or more sets.
 * Intended for admin use to maintain accurate set availability data.
 *
 * @param setIds - Array of set IDs to update
 * @param printStatus - New print status to set
 * @param isInPrint - Whether sets are in print (derived from printStatus if not provided)
 */
export const markOutOfPrintSets = internalMutation({
  args: {
    setIds: v.array(v.string()),
    printStatus: printStatusValidator,
    isInPrint: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Derive isInPrint from printStatus if not explicitly provided
    const isInPrint =
      args.isInPrint ?? (args.printStatus === 'current' || args.printStatus === 'limited');

    let updatedCount = 0;
    let notFoundCount = 0;
    const errors: string[] = [];

    for (const setId of args.setIds) {
      try {
        const set = await ctx.db
          .query('cachedSets')
          .withIndex('by_set_id', (q) => q.eq('setId', setId))
          .first();

        if (set) {
          await ctx.db.patch(set._id, {
            printStatus: args.printStatus,
            isInPrint,
          });
          updatedCount++;
        } else {
          notFoundCount++;
        }
      } catch (e) {
        errors.push(`Set ${setId}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      updatedCount,
      notFoundCount,
      requestedCount: args.setIds.length,
      printStatus: args.printStatus,
      isInPrint,
      errors,
    };
  },
});

/**
 * Update a single set's print status (admin mutation)
 *
 * @param setId - The set ID to update
 * @param printStatus - New print status
 * @param isInPrint - Optional explicit in-print flag
 */
export const updateSetPrintStatus = internalMutation({
  args: {
    setId: v.string(),
    printStatus: printStatusValidator,
    isInPrint: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const set = await ctx.db
      .query('cachedSets')
      .withIndex('by_set_id', (q) => q.eq('setId', args.setId))
      .first();

    if (!set) {
      return { success: false, error: 'Set not found' };
    }

    const isInPrint =
      args.isInPrint ?? (args.printStatus === 'current' || args.printStatus === 'limited');

    await ctx.db.patch(set._id, {
      printStatus: args.printStatus,
      isInPrint,
    });

    return {
      success: true,
      setId: args.setId,
      printStatus: args.printStatus,
      isInPrint,
    };
  },
});

/**
 * Automatically update print status based on release date (cron job helper)
 *
 * Marks sets as out of print if they are older than the specified threshold.
 * Intended to be called periodically to maintain accurate availability data.
 *
 * @param gameSlug - The game to update sets for
 * @param outOfPrintMonths - Sets older than this are marked out_of_print (default 24)
 * @param vintageMonths - Sets older than this are marked vintage (default 60 = 5 years)
 */
export const autoUpdatePrintStatus = internalMutation({
  args: {
    gameSlug: gameSlugValidator,
    outOfPrintMonths: v.optional(v.number()),
    vintageMonths: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const outOfPrintMonths = args.outOfPrintMonths ?? 24;
    const vintageMonths = args.vintageMonths ?? 60;

    const now = new Date();
    const outOfPrintCutoff = new Date(
      now.getFullYear(),
      now.getMonth() - outOfPrintMonths,
      now.getDate()
    );
    const vintageCutoff = new Date(
      now.getFullYear(),
      now.getMonth() - vintageMonths,
      now.getDate()
    );

    const sets = await ctx.db
      .query('cachedSets')
      .withIndex('by_game', (q) => q.eq('gameSlug', args.gameSlug))
      .collect();

    let updatedToVintage = 0;
    let updatedToOutOfPrint = 0;
    let updatedToCurrent = 0;
    let unchanged = 0;

    for (const set of sets) {
      const releaseTime = new Date(set.releaseDate).getTime();
      let newStatus: 'current' | 'limited' | 'out_of_print' | 'vintage' | undefined;
      let newIsInPrint: boolean | undefined;

      if (releaseTime < vintageCutoff.getTime()) {
        newStatus = 'vintage';
        newIsInPrint = false;
      } else if (releaseTime < outOfPrintCutoff.getTime()) {
        newStatus = 'out_of_print';
        newIsInPrint = false;
      } else {
        // Recent set - only update if not already marked
        if (set.printStatus === undefined) {
          newStatus = 'current';
          newIsInPrint = true;
        }
      }

      if (newStatus !== undefined && newStatus !== set.printStatus) {
        await ctx.db.patch(set._id, {
          printStatus: newStatus,
          isInPrint: newIsInPrint,
        });

        if (newStatus === 'vintage') updatedToVintage++;
        else if (newStatus === 'out_of_print') updatedToOutOfPrint++;
        else if (newStatus === 'current') updatedToCurrent++;
      } else {
        unchanged++;
      }
    }

    return {
      success: true,
      gameSlug: args.gameSlug,
      totalSets: sets.length,
      updatedToVintage,
      updatedToOutOfPrint,
      updatedToCurrent,
      unchanged,
      outOfPrintCutoff: outOfPrintCutoff.toISOString().split('T')[0],
      vintageCutoff: vintageCutoff.toISOString().split('T')[0],
    };
  },
});

/**
 * Internal query for getting cached sets (used by populateGameData)
 */
export const internalGetCachedSets = internalQuery({
  args: {
    gameSlug: gameSlugValidator,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sets = await ctx.db
      .query('cachedSets')
      .withIndex('by_game', (q) => q.eq('gameSlug', args.gameSlug))
      .collect();

    // Sort by release date descending
    sets.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

    return args.limit ? sets.slice(0, args.limit) : sets;
  },
});

/**
 * Get cached cards for a set
 */
export const getCachedCardsInSet = query({
  args: {
    gameSlug: gameSlugValidator,
    setId: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query('cachedCards')
      .withIndex('by_game_and_set', (q) => q.eq('gameSlug', args.gameSlug).eq('setId', args.setId))
      .collect();
  },
});

/**
 * Get all cached cards for a game (public query)
 * Supports optional pagination via limit/offset
 */
export const getCardsByGame = query({
  args: {
    gameSlug: gameSlugValidator,
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const allCards = await ctx.db
      .query('cachedCards')
      .withIndex('by_game', (q) => q.eq('gameSlug', args.gameSlug))
      .collect();

    const offset = args.offset ?? 0;
    const limit = args.limit ?? allCards.length;

    return allCards.slice(offset, offset + limit);
  },
});

/**
 * Search cached cards by name within a game (public query)
 * Case-insensitive partial match on card name
 */
export const searchCardsByGame = query({
  args: {
    gameSlug: gameSlugValidator,
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchLower = args.searchTerm.toLowerCase();
    const limit = args.limit ?? 50;

    const allCards = await ctx.db
      .query('cachedCards')
      .withIndex('by_game', (q) => q.eq('gameSlug', args.gameSlug))
      .collect();

    const matchingCards = allCards.filter((card) => card.name.toLowerCase().includes(searchLower));

    return matchingCards.slice(0, limit);
  },
});

/**
 * Filter cached cards by game with optional filters for setId, type, name, and rarity.
 * Supports case-insensitive partial matching for name and exact matching for other fields.
 *
 * @param gameSlug - The game to filter within (required)
 * @param setId - Optional set ID to filter by
 * @param type - Optional type/color to filter by (e.g., "Fire", "Water" for Pokemon; "Red", "Blue" for One Piece)
 * @param name - Optional partial name match (case-insensitive)
 * @param rarity - Optional rarity to filter by (e.g., "Rare Holo", "Common")
 * @param limit - Maximum number of results (default 50, max 500)
 * @param offset - Number of results to skip for pagination (default 0)
 * @returns Filtered cards array with metadata about the query
 */
export const filterCardsByGame = query({
  args: {
    gameSlug: gameSlugValidator,
    setId: v.optional(v.string()),
    type: v.optional(v.string()),
    name: v.optional(v.string()),
    rarity: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(1, args.limit ?? 50), 500);
    const offset = Math.max(0, args.offset ?? 0);

    // Start with game-filtered cards
    // If setId is provided, use the more specific by_game_and_set index
    let cards;
    const setIdFilter = args.setId;
    if (setIdFilter) {
      cards = await ctx.db
        .query('cachedCards')
        .withIndex('by_game_and_set', (q) =>
          q.eq('gameSlug', args.gameSlug).eq('setId', setIdFilter)
        )
        .collect();
    } else {
      cards = await ctx.db
        .query('cachedCards')
        .withIndex('by_game', (q) => q.eq('gameSlug', args.gameSlug))
        .collect();
    }

    // Apply additional filters
    let filteredCards = cards;

    // Filter by type (case-insensitive, checks if any type matches)
    if (args.type) {
      const typeLower = args.type.toLowerCase();
      filteredCards = filteredCards.filter((card) =>
        card.types.some((t) => t.toLowerCase() === typeLower)
      );
    }

    // Filter by name (case-insensitive partial match)
    if (args.name) {
      const nameLower = args.name.toLowerCase();
      filteredCards = filteredCards.filter((card) => card.name.toLowerCase().includes(nameLower));
    }

    // Filter by rarity (case-insensitive exact match)
    if (args.rarity) {
      const rarityLower = args.rarity.toLowerCase();
      filteredCards = filteredCards.filter(
        (card) => card.rarity && card.rarity.toLowerCase() === rarityLower
      );
    }

    // Get total count before pagination
    const totalCount = filteredCards.length;

    // Apply pagination
    const paginatedCards = filteredCards.slice(offset, offset + limit);

    return {
      cards: paginatedCards,
      totalCount,
      limit,
      offset,
      hasMore: offset + paginatedCards.length < totalCount,
      filters: {
        gameSlug: args.gameSlug,
        setId: args.setId,
        type: args.type,
        name: args.name,
        rarity: args.rarity,
      },
    };
  },
});

/**
 * Batch fetch multiple cards by their IDs in a single query.
 * Optimized for wishlist enrichment and collection display.
 *
 * Returns a map of cardId -> card data for efficient lookups.
 * Cards not found in cache are omitted from the result.
 *
 * @param cardIds - Array of card IDs to fetch (max 200 to prevent memory issues)
 * @returns Object with cards map and stats about found/missing cards
 */
export const getCardsByIds = query({
  args: {
    cardIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Limit to 200 cards to prevent excessive memory usage
    const MAX_BATCH_SIZE = 200;
    const cardIds = args.cardIds.slice(0, MAX_BATCH_SIZE);

    // Deduplicate card IDs
    const uniqueCardIds = [...new Set(cardIds)];

    // Fetch all cards in parallel using Promise.all
    const cardPromises = uniqueCardIds.map((cardId) =>
      ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
        .first()
    );

    const cardResults = await Promise.all(cardPromises);

    // Build result map and track stats
    const cards: Record<
      string,
      {
        cardId: string;
        gameSlug: string;
        setId: string;
        name: string;
        number: string;
        supertype: string;
        subtypes: string[];
        types: string[];
        rarity: string | undefined;
        imageSmall: string;
        imageLarge: string;
        tcgPlayerUrl: string | undefined;
        priceMarket: number | undefined;
      }
    > = {};

    let foundCount = 0;
    let missingCount = 0;

    for (let i = 0; i < uniqueCardIds.length; i++) {
      const cardId = uniqueCardIds[i];
      const card = cardResults[i];

      if (card) {
        cards[cardId] = {
          cardId: card.cardId,
          gameSlug: card.gameSlug,
          setId: card.setId,
          name: card.name,
          number: card.number,
          supertype: card.supertype,
          subtypes: card.subtypes,
          types: card.types,
          rarity: card.rarity,
          imageSmall: card.imageSmall,
          imageLarge: card.imageLarge,
          tcgPlayerUrl: card.tcgPlayerUrl,
          priceMarket: card.priceMarket,
        };
        foundCount++;
      } else {
        missingCount++;
      }
    }

    return {
      cards,
      stats: {
        requested: cardIds.length,
        unique: uniqueCardIds.length,
        found: foundCount,
        missing: missingCount,
        truncated: args.cardIds.length > MAX_BATCH_SIZE,
      },
    };
  },
});

// =============================================================================
// POKEMON API POPULATION
// =============================================================================

/**
 * Populate Pokemon sets from pokemontcg.io (internal)
 * @param maxAgeMonths - Optional filter to only include sets released within the last N months
 */
export const populatePokemonSets = internalAction({
  args: {
    maxAgeMonths: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; count: number; errors: string[]; skipped: number }> => {
    const errors: string[] = [];
    let count = 0;
    let skipped = 0;
    const cutoffDate = getCutoffDate(args.maxAgeMonths);

    try {
      interface PokemonSet {
        id: string;
        name: string;
        series: string;
        releaseDate: string;
        total: number;
        images: { logo?: string; symbol?: string };
      }

      const data = await fetchJSON<{ data: PokemonSet[] }>('https://api.pokemontcg.io/v2/sets');

      for (const set of data.data) {
        // Filter by release date if maxAgeMonths is specified
        const releaseDate = set.releaseDate || '1999-01-01';
        if (!isSetWithinAgeLimit(releaseDate, cutoffDate)) {
          skipped++;
          continue;
        }

        try {
          await ctx.runMutation(internal.dataPopulation.upsertCachedSet, {
            setId: set.id,
            gameSlug: 'pokemon',
            name: set.name,
            series: set.series || 'Unknown',
            releaseDate,
            totalCards: set.total || 0,
            logoUrl: set.images?.logo,
            symbolUrl: set.images?.symbol,
          });
          count++;
        } catch (e) {
          errors.push(`Set ${set.id}: ${e instanceof Error ? e.message : 'Unknown'}`);
        }
        await delay(RATE_LIMITS.pokemon);
      }

      return { success: errors.length === 0, count, errors, skipped };
    } catch (e) {
      return {
        success: false,
        count,
        errors: [...errors, e instanceof Error ? e.message : 'Unknown error'],
        skipped,
      };
    }
  },
});

/**
 * Populate Pokemon cards for a specific set
 */
export const populatePokemonSetCards = internalAction({
  args: {
    setId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; count: number; errors: string[] }> => {
    const errors: string[] = [];

    try {
      interface PokemonCard {
        id: string;
        name: string;
        number: string;
        supertype: string;
        subtypes?: string[];
        types?: string[];
        rarity?: string;
        images: { small: string; large: string };
        tcgplayer?: {
          url?: string;
          prices?: { normal?: { market?: number }; holofoil?: { market?: number } };
        };
        set: { id: string };
      }

      const data = await fetchJSON<{ data: PokemonCard[] }>(
        `https://api.pokemontcg.io/v2/cards?q=set.id:${args.setId}&pageSize=250`
      );

      const cards = data.data.map((card) => ({
        cardId: card.id,
        gameSlug: 'pokemon' as const,
        setId: card.set.id,
        name: card.name,
        number: card.number,
        supertype: card.supertype || 'Pokémon',
        subtypes: card.subtypes || [],
        types: card.types || [],
        rarity: card.rarity,
        imageSmall: card.images?.small || '',
        imageLarge: card.images?.large || '',
        tcgPlayerUrl: card.tcgplayer?.url,
        priceMarket:
          card.tcgplayer?.prices?.normal?.market ?? card.tcgplayer?.prices?.holofoil?.market,
      }));

      const result = await ctx.runMutation(internal.dataPopulation.batchUpsertCards, {
        cards,
      });

      return {
        success: true,
        count: result.inserted + result.updated,
        errors,
      };
    } catch (e) {
      return {
        success: false,
        count: 0,
        errors: [e instanceof Error ? e.message : 'Unknown error'],
      };
    }
  },
});

// =============================================================================
// YU-GI-OH! API POPULATION
// =============================================================================

/**
 * Populate Yu-Gi-Oh! sets from ygoprodeck.com
 * @param maxAgeMonths - Optional filter to only include sets released within the last N months
 */
export const populateYugiohSets = internalAction({
  args: {
    maxAgeMonths: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; count: number; errors: string[]; skipped: number }> => {
    const errors: string[] = [];
    let count = 0;
    let skipped = 0;
    const cutoffDate = getCutoffDate(args.maxAgeMonths);

    try {
      interface YugiohSet {
        set_code: string;
        set_name: string;
        num_of_cards: number;
        tcg_date: string | null;
        set_image?: string;
      }

      const data = await fetchJSON<YugiohSet[]>('https://db.ygoprodeck.com/api/v7/cardsets.php');

      for (const set of data) {
        // Filter by release date if maxAgeMonths is specified
        const releaseDate = set.tcg_date || '1999-01-01';
        if (!isSetWithinAgeLimit(releaseDate, cutoffDate)) {
          skipped++;
          continue;
        }

        try {
          await ctx.runMutation(internal.dataPopulation.upsertCachedSet, {
            setId: set.set_code,
            gameSlug: 'yugioh',
            name: set.set_name,
            series: 'Yu-Gi-Oh!',
            releaseDate,
            totalCards: set.num_of_cards || 0,
            logoUrl: set.set_image,
            symbolUrl: undefined,
          });
          count++;
        } catch (e) {
          errors.push(`Set ${set.set_code}: ${e instanceof Error ? e.message : 'Unknown'}`);
        }
        await delay(RATE_LIMITS.yugioh);
      }

      return { success: errors.length === 0, count, errors, skipped };
    } catch (e) {
      return {
        success: false,
        count,
        errors: [...errors, e instanceof Error ? e.message : 'Unknown error'],
        skipped,
      };
    }
  },
});

/**
 * Populate Yu-Gi-Oh! cards for a specific set
 */
export const populateYugiohSetCards = internalAction({
  args: {
    setId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; count: number; errors: string[] }> => {
    const errors: string[] = [];

    try {
      interface YugiohCard {
        id: number;
        name: string;
        type: string;
        frameType: string;
        race: string;
        attribute?: string;
        card_sets?: Array<{ set_code: string; set_rarity?: string }>;
        card_images?: Array<{ image_url: string; image_url_small: string }>;
        card_prices?: Array<{ tcgplayer_price?: string }>;
      }

      const data = await fetchJSON<{ data: YugiohCard[] }>(
        `https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${encodeURIComponent(args.setId)}`
      );

      const cards = data.data.map((card) => {
        const cardSet = card.card_sets?.find((s) => s.set_code === args.setId);
        const price = card.card_prices?.[0]?.tcgplayer_price;

        return {
          cardId: `${card.id}-${args.setId}`,
          gameSlug: 'yugioh' as const,
          setId: args.setId,
          name: card.name,
          number: cardSet?.set_code || String(card.id),
          supertype: card.frameType || 'Monster',
          subtypes: [card.race || 'Unknown'],
          types: card.attribute ? [card.attribute] : [],
          rarity: cardSet?.set_rarity,
          imageSmall: card.card_images?.[0]?.image_url_small || '',
          imageLarge: card.card_images?.[0]?.image_url || '',
          tcgPlayerUrl: undefined,
          priceMarket: price ? parseFloat(price) : undefined,
        };
      });

      const result = await ctx.runMutation(internal.dataPopulation.batchUpsertCards, {
        cards,
      });

      return {
        success: true,
        count: result.inserted + result.updated,
        errors,
      };
    } catch (e) {
      return {
        success: false,
        count: 0,
        errors: [e instanceof Error ? e.message : 'Unknown error'],
      };
    }
  },
});

// =============================================================================
// MTG API POPULATION
// =============================================================================

/**
 * Populate MTG sets from scryfall.com
 * @param collectibleOnly - If true, only include collectible set types (default true)
 * @param maxAgeMonths - Optional filter to only include sets released within the last N months
 */
export const populateMtgSets = internalAction({
  args: {
    collectibleOnly: v.optional(v.boolean()),
    maxAgeMonths: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; count: number; errors: string[]; skipped: number }> => {
    const errors: string[] = [];
    let count = 0;
    let skipped = 0;
    const cutoffDate = getCutoffDate(args.maxAgeMonths);

    try {
      interface MtgSet {
        code: string;
        name: string;
        set_type: string;
        block?: string;
        released_at?: string;
        card_count: number;
        icon_svg_uri?: string;
      }

      const data = await fetchJSON<{ data: MtgSet[] }>('https://api.scryfall.com/sets', {
        'User-Agent': 'KidCollect/1.0',
      });

      // Filter to collectible sets if requested
      const collectibleTypes = ['core', 'expansion', 'masters', 'draft_innovation', 'commander'];
      const sets =
        args.collectibleOnly !== false
          ? data.data.filter((s) => collectibleTypes.includes(s.set_type))
          : data.data;

      for (const set of sets) {
        // Filter by release date if maxAgeMonths is specified
        const releaseDate = set.released_at || '1993-08-05';
        if (!isSetWithinAgeLimit(releaseDate, cutoffDate)) {
          skipped++;
          continue;
        }

        try {
          await ctx.runMutation(internal.dataPopulation.upsertCachedSet, {
            setId: set.code,
            gameSlug: 'mtg',
            name: set.name,
            series: set.block || 'Standalone',
            releaseDate,
            totalCards: set.card_count || 0,
            logoUrl: set.icon_svg_uri,
            symbolUrl: set.icon_svg_uri,
          });
          count++;
        } catch (e) {
          errors.push(`Set ${set.code}: ${e instanceof Error ? e.message : 'Unknown'}`);
        }
        await delay(RATE_LIMITS.mtg);
      }

      return { success: errors.length === 0, count, errors, skipped };
    } catch (e) {
      return {
        success: false,
        count,
        errors: [...errors, e instanceof Error ? e.message : 'Unknown error'],
        skipped,
      };
    }
  },
});

/**
 * Populate MTG cards for a specific set (handles pagination)
 */
export const populateMtgSetCards = internalAction({
  args: {
    setId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; count: number; errors: string[] }> => {
    const errors: string[] = [];
    let totalCount = 0;

    try {
      interface MtgCard {
        id: string;
        name: string;
        collector_number: string;
        type_line: string;
        colors?: string[];
        rarity: string;
        set: string;
        image_uris?: { small?: string; large?: string };
        card_faces?: Array<{ image_uris?: { small?: string; large?: string } }>;
        purchase_uris?: { tcgplayer?: string };
        prices?: { usd?: string };
      }

      interface MtgResponse {
        data: MtgCard[];
        has_more: boolean;
        next_page?: string;
      }

      let page = `https://api.scryfall.com/cards/search?q=set:${args.setId}&unique=prints`;
      let hasMore = true;

      while (hasMore) {
        const data = await fetchJSON<MtgResponse>(page, {
          'User-Agent': 'KidCollect/1.0',
        });

        const cards = data.data.map((card) => ({
          cardId: `${card.set}-${card.collector_number}`,
          gameSlug: 'mtg' as const,
          setId: card.set,
          name: card.name,
          number: card.collector_number,
          supertype: card.type_line?.split(' — ')[0] || 'Unknown',
          subtypes: card.type_line?.split(' — ')[1]?.split(' ') || [],
          types: card.colors || [],
          rarity: card.rarity,
          imageSmall: card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small || '',
          imageLarge: card.image_uris?.large || card.card_faces?.[0]?.image_uris?.large || '',
          tcgPlayerUrl: card.purchase_uris?.tcgplayer,
          priceMarket: card.prices?.usd ? parseFloat(card.prices.usd) : undefined,
        }));

        const result = await ctx.runMutation(internal.dataPopulation.batchUpsertCards, {
          cards,
        });
        totalCount += result.inserted + result.updated;

        hasMore = data.has_more;
        if (hasMore && data.next_page) {
          page = data.next_page;
          await delay(RATE_LIMITS.mtg);
        }
      }

      return { success: true, count: totalCount, errors };
    } catch (e) {
      return {
        success: false,
        count: totalCount,
        errors: [e instanceof Error ? e.message : 'Unknown error'],
      };
    }
  },
});

// =============================================================================
// LORCANA API POPULATION
// =============================================================================

/**
 * Populate Lorcana sets from lorcast.com
 * @param maxAgeMonths - Optional filter to only include sets released within the last N months
 */
export const populateLorcanaSets = internalAction({
  args: {
    maxAgeMonths: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; count: number; errors: string[]; skipped: number }> => {
    const errors: string[] = [];
    let count = 0;
    let skipped = 0;
    const cutoffDate = getCutoffDate(args.maxAgeMonths);

    try {
      interface LorcanaSet {
        id: string;
        code: string;
        name: string;
        released_at?: string;
      }

      const data = await fetchJSON<{ results: LorcanaSet[] }>('https://api.lorcast.com/v0/sets');

      for (const set of data.results) {
        // Filter by release date if maxAgeMonths is specified
        const releaseDate = set.released_at || '2023-08-18';
        if (!isSetWithinAgeLimit(releaseDate, cutoffDate)) {
          skipped++;
          continue;
        }

        try {
          await ctx.runMutation(internal.dataPopulation.upsertCachedSet, {
            setId: set.code || set.id,
            gameSlug: 'lorcana',
            name: set.name,
            series: 'Disney Lorcana',
            releaseDate,
            totalCards: 0, // Lorcast doesn't include card count
            logoUrl: undefined,
            symbolUrl: undefined,
          });
          count++;
        } catch (e) {
          errors.push(`Set ${set.code}: ${e instanceof Error ? e.message : 'Unknown'}`);
        }
        await delay(RATE_LIMITS.lorcana);
      }

      return { success: errors.length === 0, count, errors, skipped };
    } catch (e) {
      return {
        success: false,
        count,
        errors: [...errors, e instanceof Error ? e.message : 'Unknown error'],
        skipped,
      };
    }
  },
});

/**
 * Populate Lorcana cards for a specific set
 */
export const populateLorcanaSetCards = internalAction({
  args: {
    setId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; count: number; errors: string[] }> => {
    const errors: string[] = [];

    try {
      interface LorcanaCard {
        id: string;
        name: string;
        subtitle?: string;
        collector_number: string;
        type?: string[];
        classifications?: string[];
        ink?: string;
        rarity?: string;
        set?: { code: string };
        image_uris?: { digital?: { small?: string; large?: string } };
        prices?: { usd?: string };
      }

      const data = await fetchJSON<{ results: LorcanaCard[] }>(
        `https://api.lorcast.com/v0/cards?set=${args.setId}`
      );

      const cards = data.results.map((card) => ({
        cardId: `${card.set?.code || args.setId}-${card.collector_number}`,
        gameSlug: 'lorcana' as const,
        setId: args.setId,
        name: card.name + (card.subtitle ? ` - ${card.subtitle}` : ''),
        number: card.collector_number,
        supertype: card.type?.join('/') || 'Character',
        subtypes: card.classifications || [],
        types: card.ink ? [card.ink] : [],
        rarity: card.rarity,
        imageSmall: card.image_uris?.digital?.small || '',
        imageLarge: card.image_uris?.digital?.large || '',
        tcgPlayerUrl: undefined,
        priceMarket: card.prices?.usd ? parseFloat(card.prices.usd) : undefined,
      }));

      const result = await ctx.runMutation(internal.dataPopulation.batchUpsertCards, {
        cards,
      });

      return {
        success: true,
        count: result.inserted + result.updated,
        errors,
      };
    } catch (e) {
      return {
        success: false,
        count: 0,
        errors: [e instanceof Error ? e.message : 'Unknown error'],
      };
    }
  },
});

// =============================================================================
// ONE PIECE API POPULATION
// =============================================================================

/**
 * Populate One Piece sets from optcg-api
 * Note: API doesn't have a sets endpoint, so we fetch all cards and extract unique sets
 * @param maxAgeMonths - Optional filter to only include sets released within the last N months
 *                       For One Piece, uses set number filtering (OP01 = 2022, OP10 = 2024)
 *                       since exact release dates aren't available from the API
 * @param minSetNumber - Alternative filter: only include sets with number >= this value (e.g., 10 for OP10+)
 */
export const populateOnePieceSets = internalAction({
  args: {
    maxAgeMonths: v.optional(v.number()),
    minSetNumber: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; count: number; errors: string[]; skipped: number }> => {
    const errors: string[] = [];
    let count = 0;
    let skipped = 0;
    const cutoffDate = getCutoffDate(args.maxAgeMonths);

    // Approximate release dates for One Piece sets (used for maxAgeMonths filtering)
    // OP01 = July 2022, subsequent sets roughly every 3-4 months
    const getApproximateReleaseDate = (setCode: string): string => {
      const match = setCode.match(/^OP(\d+)/i);
      if (!match) return '2022-07-22'; // Default to launch date
      const setNum = parseInt(match[1], 10);
      // OP01 = July 2022, each set ~3.5 months later
      const monthsFromLaunch = (setNum - 1) * 3.5;
      const launchDate = new Date(2022, 6, 22); // July 22, 2022
      const releaseDate = new Date(launchDate);
      releaseDate.setMonth(releaseDate.getMonth() + Math.floor(monthsFromLaunch));
      return releaseDate.toISOString().split('T')[0];
    };

    try {
      interface OnePieceCard {
        id: string;
        code: string;
        set: string;
      }

      interface OnePieceResponse {
        data: OnePieceCard[];
        total: number;
        current_page: number;
        total_pages: number;
      }

      // Fetch all cards to extract set information
      const allCards: OnePieceCard[] = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const data = await fetchJSON<OnePieceResponse>(
          `https://optcg-api.ryanmichaelhirst.us/api/v1/cards?page=${currentPage}&per_page=100`
        );
        allCards.push(...data.data);

        if (currentPage >= data.total_pages) {
          hasMore = false;
        } else {
          currentPage++;
          await delay(RATE_LIMITS.onepiece);
        }
      }

      // Extract unique sets from cards
      const setMap = new Map<string, { name: string; cardCount: number }>();

      for (const card of allCards) {
        // Extract set code from card code (e.g., "OP01" from "OP01-001")
        const match = card.code.match(/^([A-Z]+\d+)/i);
        const setCode = match ? match[1].toUpperCase() : card.code;

        const existing = setMap.get(setCode);
        if (existing) {
          existing.cardCount++;
        } else {
          setMap.set(setCode, {
            name: card.set || setCode,
            cardCount: 1,
          });
        }
      }

      // Insert sets (with filtering)
      for (const [setCode, data] of setMap.entries()) {
        // Filter by minSetNumber if specified
        if (args.minSetNumber !== undefined) {
          const match = setCode.match(/^OP(\d+)/i);
          if (match) {
            const setNum = parseInt(match[1], 10);
            if (setNum < args.minSetNumber) {
              skipped++;
              continue;
            }
          }
        }

        // Calculate approximate release date for this set
        const releaseDate = getApproximateReleaseDate(setCode);

        // Filter by release date if maxAgeMonths is specified
        if (!isSetWithinAgeLimit(releaseDate, cutoffDate)) {
          skipped++;
          continue;
        }

        try {
          await ctx.runMutation(internal.dataPopulation.upsertCachedSet, {
            setId: setCode,
            gameSlug: 'onepiece',
            name: data.name,
            series: 'One Piece TCG',
            releaseDate,
            totalCards: data.cardCount,
            logoUrl: undefined,
            symbolUrl: undefined,
          });
          count++;
        } catch (e) {
          errors.push(`Set ${setCode}: ${e instanceof Error ? e.message : 'Unknown'}`);
        }
        await delay(RATE_LIMITS.onepiece);
      }

      return { success: errors.length === 0, count, errors, skipped };
    } catch (e) {
      return {
        success: false,
        count,
        errors: [...errors, e instanceof Error ? e.message : 'Unknown error'],
        skipped,
      };
    }
  },
});

/**
 * Populate One Piece cards for a specific set
 */
export const populateOnePieceSetCards = internalAction({
  args: {
    setId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; count: number; errors: string[] }> => {
    const errors: string[] = [];

    try {
      interface OnePieceCard {
        id: string;
        code: string;
        rarity: string;
        type: string;
        name: string;
        cost: number | null;
        attribute: string | null;
        power: number | null;
        counter: number | null;
        color: string;
        class: string;
        effect: string | null;
        set: string;
        image: string;
      }

      interface OnePieceResponse {
        data: OnePieceCard[];
        total: number;
        current_page: number;
        total_pages: number;
      }

      // Fetch all cards and filter by set
      const allCards: OnePieceCard[] = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const data = await fetchJSON<OnePieceResponse>(
          `https://optcg-api.ryanmichaelhirst.us/api/v1/cards?page=${currentPage}&per_page=100`
        );

        // Filter cards matching the setId
        const setCards = data.data.filter((card) => {
          const match = card.code.match(/^([A-Z]+\d+)/i);
          const cardSetCode = match ? match[1].toUpperCase() : '';
          return cardSetCode === args.setId.toUpperCase();
        });

        allCards.push(...setCards);

        if (currentPage >= data.total_pages) {
          hasMore = false;
        } else {
          currentPage++;
          await delay(RATE_LIMITS.onepiece);
        }
      }

      const cards = allCards.map((card) => ({
        cardId: `optcg-${card.code}`,
        gameSlug: 'onepiece' as const,
        setId: args.setId.toUpperCase(),
        name: card.name,
        number: card.code,
        supertype: card.type || 'Character',
        subtypes: card.class ? card.class.split('/').map((c) => c.trim()) : [],
        types: card.color ? [card.color] : [],
        rarity: card.rarity,
        imageSmall: card.image || '',
        imageLarge: card.image || '',
        tcgPlayerUrl: undefined,
        priceMarket: undefined,
      }));

      if (cards.length > 0) {
        const result = await ctx.runMutation(internal.dataPopulation.batchUpsertCards, {
          cards,
        });

        return {
          success: true,
          count: result.inserted + result.updated,
          errors,
        };
      }

      return { success: true, count: 0, errors };
    } catch (e) {
      return {
        success: false,
        count: 0,
        errors: [e instanceof Error ? e.message : 'Unknown error'],
      };
    }
  },
});

// =============================================================================
// DIGIMON API POPULATION
// =============================================================================

/**
 * Populate Digimon sets from digimoncard.io
 * Note: API doesn't have a dedicated sets endpoint, so we search by pack name patterns
 * @param maxAgeMonths - Optional filter to only include sets released within the last N months
 *                       Uses approximate release dates based on set numbers
 * @param minSetNumber - Alternative filter: only include BT/EX sets >= this number
 */
export const populateDigimonSets = internalAction({
  args: {
    maxAgeMonths: v.optional(v.number()),
    minSetNumber: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; count: number; errors: string[]; skipped: number }> => {
    const errors: string[] = [];
    let count = 0;
    let skipped = 0;
    const cutoffDate = getCutoffDate(args.maxAgeMonths);

    // Approximate release dates for Digimon sets
    // BT01 = April 2020, BT sets roughly every 3 months
    // EX01 = December 2021, EX sets roughly every 6 months
    const getApproximateReleaseDate = (setCode: string): string => {
      const btMatch = setCode.match(/^BT(\d+)$/i);
      if (btMatch) {
        const setNum = parseInt(btMatch[1], 10);
        // BT01 = April 2020, each set ~3 months later
        const monthsFromLaunch = (setNum - 1) * 3;
        const launchDate = new Date(2020, 3, 24); // April 24, 2020
        const releaseDate = new Date(launchDate);
        releaseDate.setMonth(releaseDate.getMonth() + monthsFromLaunch);
        return releaseDate.toISOString().split('T')[0];
      }

      const exMatch = setCode.match(/^EX(\d+)$/i);
      if (exMatch) {
        const setNum = parseInt(exMatch[1], 10);
        // EX01 = December 2021, each set ~6 months later
        const monthsFromLaunch = (setNum - 1) * 6;
        const launchDate = new Date(2021, 11, 24); // December 24, 2021
        const releaseDate = new Date(launchDate);
        releaseDate.setMonth(releaseDate.getMonth() + monthsFromLaunch);
        return releaseDate.toISOString().split('T')[0];
      }

      // Starter decks and promos use launch date
      return '2020-04-24';
    };

    try {
      // Get all card numbers to extract unique sets
      const response = await fetchJSON<{ name: string; cardnumber: string }[]>(
        'https://digimoncard.io/index.php/api-public/getAllCards?series=Digimon%20Card%20Game&sort=card_number&sortdirection=asc'
      );

      // Extract unique set codes from card numbers
      const setMap = new Map<string, { name: string; cardCount: number }>();

      for (const card of response) {
        if (!card.cardnumber.includes('-')) continue;
        const match = card.cardnumber.match(/^([A-Z]+\d*)-/i);
        if (!match) continue;

        const setCode = match[1].toUpperCase();
        const existing = setMap.get(setCode);

        if (existing) {
          existing.cardCount++;
        } else {
          // Get set name from a card search
          setMap.set(setCode, {
            name: `Digimon ${setCode}`, // Will be updated later if possible
            cardCount: 1,
          });
        }
      }

      // Insert sets (with filtering)
      for (const [setCode, data] of setMap.entries()) {
        // Filter by minSetNumber if specified (applies to BT and EX sets)
        if (args.minSetNumber !== undefined) {
          const btMatch = setCode.match(/^BT(\d+)$/i);
          const exMatch = setCode.match(/^EX(\d+)$/i);
          if (btMatch) {
            const setNum = parseInt(btMatch[1], 10);
            if (setNum < args.minSetNumber) {
              skipped++;
              continue;
            }
          }
          if (exMatch) {
            const setNum = parseInt(exMatch[1], 10);
            if (setNum < args.minSetNumber) {
              skipped++;
              continue;
            }
          }
        }

        // Calculate approximate release date for this set
        const releaseDate = getApproximateReleaseDate(setCode);

        // Filter by release date if maxAgeMonths is specified
        if (!isSetWithinAgeLimit(releaseDate, cutoffDate)) {
          skipped++;
          continue;
        }

        try {
          await ctx.runMutation(internal.dataPopulation.upsertCachedSet, {
            setId: setCode,
            gameSlug: 'digimon',
            name: data.name,
            series: 'Digimon Card Game',
            releaseDate,
            totalCards: data.cardCount,
            logoUrl: undefined,
            symbolUrl: undefined,
          });
          count++;
        } catch (e) {
          errors.push(`Set ${setCode}: ${e instanceof Error ? e.message : 'Unknown'}`);
        }
        await delay(RATE_LIMITS.digimon);
      }

      return { success: errors.length === 0, count, errors, skipped };
    } catch (e) {
      return {
        success: false,
        count,
        errors: [...errors, e instanceof Error ? e.message : 'Unknown error'],
        skipped,
      };
    }
  },
});

/**
 * Populate Digimon cards for a specific set
 */
export const populateDigimonSetCards = internalAction({
  args: {
    setId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; count: number; errors: string[] }> => {
    const errors: string[] = [];

    try {
      interface DigimonCard {
        name: string;
        type: string;
        id: string;
        level: number | null;
        play_cost: number | null;
        color: string;
        color2: string | null;
        digi_type: string | null;
        digi_type2: string | null;
        dp: number | null;
        attribute: string | null;
        rarity: string;
        stage: string | null;
        main_effect: string | null;
        source_effect: string | null;
      }

      // Search for cards with the set prefix
      const data = await fetchJSON<DigimonCard[]>(
        `https://digimoncard.io/index.php/api-public/search?card=${args.setId}&sort=code&sortdirection=asc`
      );

      if (!data || data.length === 0) {
        return { success: true, count: 0, errors };
      }

      // Filter to only cards that actually start with the set code
      const filteredCards = data.filter((card) => {
        const match = card.id.match(/^([A-Z]+\d*)-/i);
        return match && match[1].toUpperCase() === args.setId.toUpperCase();
      });

      const cards = filteredCards.map((card) => ({
        cardId: `digimon-${card.id}`,
        gameSlug: 'digimon' as const,
        setId: args.setId.toUpperCase(),
        name: card.name,
        number: card.id,
        supertype: card.type || 'Digimon',
        subtypes: [card.stage, card.digi_type, card.digi_type2].filter((s): s is string => !!s),
        types: [card.color, card.color2].filter((c): c is string => !!c),
        rarity: card.rarity,
        imageSmall: `https://images.digimoncard.io/images/cards/${card.id}.png`,
        imageLarge: `https://images.digimoncard.io/images/cards/${card.id}.png`,
        tcgPlayerUrl: undefined,
        priceMarket: undefined,
      }));

      if (cards.length > 0) {
        const result = await ctx.runMutation(internal.dataPopulation.batchUpsertCards, {
          cards,
        });

        return {
          success: true,
          count: result.inserted + result.updated,
          errors,
        };
      }

      return { success: true, count: 0, errors };
    } catch (e) {
      return {
        success: false,
        count: 0,
        errors: [e instanceof Error ? e.message : 'Unknown error'],
      };
    }
  },
});

// =============================================================================
// DRAGON BALL FUSION WORLD API POPULATION
// =============================================================================

/**
 * Populate Dragon Ball Fusion World sets from apitcg.com
 * Note: Sets endpoint is under construction, so we extract from cards
 * @param maxAgeMonths - Optional filter to only include sets released within the last N months
 *                       Dragon Ball Fusion World launched Feb 2024, uses set number filtering
 * @param minSetNumber - Alternative filter: only include FB sets >= this number
 */
export const populateDragonBallSets = internalAction({
  args: {
    maxAgeMonths: v.optional(v.number()),
    minSetNumber: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; count: number; errors: string[]; skipped: number }> => {
    const errors: string[] = [];
    let count = 0;
    let skipped = 0;
    const cutoffDate = getCutoffDate(args.maxAgeMonths);

    // Approximate release dates for Dragon Ball Fusion World sets
    // FB01 = February 2024, subsequent sets roughly every 3 months
    const getApproximateReleaseDate = (setCode: string): string => {
      const match = setCode.match(/^FB(\d+)/i);
      if (!match) return '2024-02-16'; // Default to launch date
      const setNum = parseInt(match[1], 10);
      // FB01 = February 2024, each set ~3 months later
      const monthsFromLaunch = (setNum - 1) * 3;
      const launchDate = new Date(2024, 1, 16); // February 16, 2024
      const releaseDate = new Date(launchDate);
      releaseDate.setMonth(releaseDate.getMonth() + monthsFromLaunch);
      return releaseDate.toISOString().split('T')[0];
    };

    try {
      interface DragonBallCard {
        id: string;
        code: string;
        set: { name: string };
      }

      interface DragonBallResponse {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        data: DragonBallCard[];
      }

      // Fetch all cards to extract set information
      const allCards: DragonBallCard[] = [];
      let currentPage = 1;
      let hasMore = true;

      const apiKey = process.env.DRAGONBALL_API_KEY;
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'User-Agent': 'KidCollect/1.0 (https://kidcollect.app)',
      };
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      while (hasMore) {
        const response = await fetch(
          `https://apitcg.com/api/dragon-ball-fusion/cards?page=${currentPage}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data: DragonBallResponse = await response.json();
        allCards.push(...data.data);

        if (currentPage >= data.totalPages) {
          hasMore = false;
        } else {
          currentPage++;
          await delay(RATE_LIMITS.dragonball);
        }
      }

      // Extract unique sets from cards
      const setMap = new Map<string, { name: string; cardCount: number }>();

      for (const card of allCards) {
        // Extract set code from card code (e.g., "FB01" from "FB01-001")
        const match = card.code.match(/^([A-Z]+\d+)/i);
        const setCode = match ? match[1].toUpperCase() : card.code;

        const existing = setMap.get(setCode);
        if (existing) {
          existing.cardCount++;
        } else {
          setMap.set(setCode, {
            name: card.set?.name || setCode,
            cardCount: 1,
          });
        }
      }

      // Insert sets (with filtering)
      for (const [setCode, data] of setMap.entries()) {
        // Filter by minSetNumber if specified
        if (args.minSetNumber !== undefined) {
          const match = setCode.match(/^FB(\d+)/i);
          if (match) {
            const setNum = parseInt(match[1], 10);
            if (setNum < args.minSetNumber) {
              skipped++;
              continue;
            }
          }
        }

        // Calculate approximate release date for this set
        const releaseDate = getApproximateReleaseDate(setCode);

        // Filter by release date if maxAgeMonths is specified
        if (!isSetWithinAgeLimit(releaseDate, cutoffDate)) {
          skipped++;
          continue;
        }

        try {
          await ctx.runMutation(internal.dataPopulation.upsertCachedSet, {
            setId: setCode,
            gameSlug: 'dragonball',
            name: data.name,
            series: 'Dragon Ball Fusion World',
            releaseDate,
            totalCards: data.cardCount,
            logoUrl: undefined,
            symbolUrl: undefined,
          });
          count++;
        } catch (e) {
          errors.push(`Set ${setCode}: ${e instanceof Error ? e.message : 'Unknown'}`);
        }
        await delay(RATE_LIMITS.dragonball);
      }

      return { success: errors.length === 0, count, errors, skipped };
    } catch (e) {
      return {
        success: false,
        count,
        errors: [...errors, e instanceof Error ? e.message : 'Unknown error'],
        skipped,
      };
    }
  },
});

/**
 * Populate Dragon Ball Fusion World cards for a specific set
 */
export const populateDragonBallSetCards = internalAction({
  args: {
    setId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; count: number; errors: string[] }> => {
    const errors: string[] = [];

    try {
      interface DragonBallCard {
        id: string;
        code: string;
        rarity: string;
        name: string;
        color: string;
        cardType: string;
        cost: number | null;
        specifiedCost: string | null;
        power: number | null;
        comboPower: number | null;
        features: string[];
        effect: string | null;
        images: { small: string; large: string };
        set: { name: string };
      }

      interface DragonBallResponse {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        data: DragonBallCard[];
      }

      // Fetch all cards and filter by set
      const allCards: DragonBallCard[] = [];
      let currentPage = 1;
      let hasMore = true;

      const apiKey = process.env.DRAGONBALL_API_KEY;
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'User-Agent': 'KidCollect/1.0 (https://kidcollect.app)',
      };
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      while (hasMore) {
        const response = await fetch(
          `https://apitcg.com/api/dragon-ball-fusion/cards?page=${currentPage}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data: DragonBallResponse = await response.json();

        // Filter cards matching the setId
        const setCards = data.data.filter((card) => {
          const match = card.code.match(/^([A-Z]+\d+)/i);
          const cardSetCode = match ? match[1].toUpperCase() : '';
          return cardSetCode === args.setId.toUpperCase();
        });

        allCards.push(...setCards);

        if (currentPage >= data.totalPages) {
          hasMore = false;
        } else {
          currentPage++;
          await delay(RATE_LIMITS.dragonball);
        }
      }

      const cards = allCards.map((card) => ({
        cardId: `dragonball-${card.code}`,
        gameSlug: 'dragonball' as const,
        setId: args.setId.toUpperCase(),
        name: card.name,
        number: card.code,
        supertype: card.cardType || 'Battle',
        subtypes: card.features || [],
        types: card.color ? [card.color] : [],
        rarity: card.rarity,
        imageSmall: card.images?.small || '',
        imageLarge: card.images?.large || '',
        tcgPlayerUrl: undefined,
        priceMarket: undefined,
      }));

      if (cards.length > 0) {
        const result = await ctx.runMutation(internal.dataPopulation.batchUpsertCards, {
          cards,
        });

        return {
          success: true,
          count: result.inserted + result.updated,
          errors,
        };
      }

      return { success: true, count: 0, errors };
    } catch (e) {
      return {
        success: false,
        count: 0,
        errors: [e instanceof Error ? e.message : 'Unknown error'],
      };
    }
  },
});

// =============================================================================
// MAIN POPULATION ACTIONS
// =============================================================================

/**
 * Internal populate sets for any game (used by populateGameData)
 * @param gameSlug - The game to populate sets for
 * @param maxAgeMonths - Optional filter to only include sets released within the last N months
 */
export const internalPopulateSets = internalAction({
  args: {
    gameSlug: gameSlugValidator,
    maxAgeMonths: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; count: number; errors: string[]; skipped: number }> => {
    const maxAgeMonths = args.maxAgeMonths;
    switch (args.gameSlug) {
      case 'pokemon':
        return ctx.runAction(internal.dataPopulation.populatePokemonSets, { maxAgeMonths });
      case 'yugioh':
        return ctx.runAction(internal.dataPopulation.populateYugiohSets, { maxAgeMonths });
      case 'mtg':
        return ctx.runAction(internal.dataPopulation.populateMtgSets, {
          collectibleOnly: true,
          maxAgeMonths,
        });
      case 'lorcana':
        return ctx.runAction(internal.dataPopulation.populateLorcanaSets, { maxAgeMonths });
      case 'onepiece':
        return ctx.runAction(internal.dataPopulation.populateOnePieceSets, { maxAgeMonths });
      case 'digimon':
        return ctx.runAction(internal.dataPopulation.populateDigimonSets, { maxAgeMonths });
      case 'dragonball':
        return ctx.runAction(internal.dataPopulation.populateDragonBallSets, { maxAgeMonths });
    }
  },
});

/**
 * Populate sets for any game (public API)
 * @param gameSlug - The game to populate sets for
 * @param maxAgeMonths - Optional filter to only include sets released within the last N months
 */
export const populateSets = internalAction({
  args: {
    gameSlug: gameSlugValidator,
    maxAgeMonths: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; count: number; errors: string[]; skipped: number }> => {
    return ctx.runAction(internal.dataPopulation.internalPopulateSets, {
      gameSlug: args.gameSlug,
      maxAgeMonths: args.maxAgeMonths,
    });
  },
});

/**
 * Internal populate cards for a specific set (used by populateGameData)
 */
export const internalPopulateSetCards = internalAction({
  args: {
    gameSlug: gameSlugValidator,
    setId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; count: number; errors: string[] }> => {
    switch (args.gameSlug) {
      case 'pokemon':
        return ctx.runAction(internal.dataPopulation.populatePokemonSetCards, {
          setId: args.setId,
        });
      case 'yugioh':
        return ctx.runAction(internal.dataPopulation.populateYugiohSetCards, {
          setId: args.setId,
        });
      case 'mtg':
        return ctx.runAction(internal.dataPopulation.populateMtgSetCards, {
          setId: args.setId,
        });
      case 'lorcana':
        return ctx.runAction(internal.dataPopulation.populateLorcanaSetCards, {
          setId: args.setId,
        });
      case 'onepiece':
        return ctx.runAction(internal.dataPopulation.populateOnePieceSetCards, {
          setId: args.setId,
        });
      case 'digimon':
        return ctx.runAction(internal.dataPopulation.populateDigimonSetCards, {
          setId: args.setId,
        });
      case 'dragonball':
        return ctx.runAction(internal.dataPopulation.populateDragonBallSetCards, {
          setId: args.setId,
        });
    }
  },
});

/**
 * Populate cards for a specific set in any game (public API)
 */
export const populateSetCards = internalAction({
  args: {
    gameSlug: gameSlugValidator,
    setId: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; count: number; errors: string[] }> => {
    return ctx.runAction(internal.dataPopulation.internalPopulateSetCards, {
      gameSlug: args.gameSlug,
      setId: args.setId,
    });
  },
});

/**
 * Populate all data for a game (sets + cards for each set)
 * WARNING: This can take a long time and may hit rate limits for large games.
 * Consider using populateSets and populateSetCards separately for better control.
 * @param gameSlug - The game to populate
 * @param maxSets - Limit number of sets to process (for testing)
 * @param maxAgeMonths - Only include sets released within the last N months
 */
export const populateGameData = action({
  args: {
    gameSlug: gameSlugValidator,
    maxSets: v.optional(v.number()), // Limit for testing
    maxAgeMonths: v.optional(v.number()), // Only include recent sets
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    setsProcessed: number;
    setsSkipped: number;
    cardsProcessed: number;
    errors: string[];
  }> => {
    const errors: string[] = [];
    let cardsProcessed = 0;

    // First populate sets (with maxAgeMonths filtering)
    const setsResult = await ctx.runAction(internal.dataPopulation.internalPopulateSets, {
      gameSlug: args.gameSlug,
      maxAgeMonths: args.maxAgeMonths,
    });

    if (!setsResult.success && setsResult.count === 0) {
      return {
        success: false,
        setsProcessed: 0,
        setsSkipped: setsResult.skipped,
        cardsProcessed: 0,
        errors: setsResult.errors,
      };
    }
    errors.push(...setsResult.errors);

    // Get the sets we just populated
    const sets = await ctx.runQuery(internal.dataPopulation.internalGetCachedSets, {
      gameSlug: args.gameSlug,
      limit: args.maxSets,
    });

    // Populate cards for each set
    for (const set of sets) {
      try {
        const cardsResult = await ctx.runAction(internal.dataPopulation.internalPopulateSetCards, {
          gameSlug: args.gameSlug,
          setId: set.setId,
        });
        cardsProcessed += cardsResult.count;
        errors.push(...cardsResult.errors);
      } catch (e) {
        errors.push(`Set ${set.setId}: ${e instanceof Error ? e.message : 'Unknown'}`);
      }

      // Extra delay between sets
      await delay(RATE_LIMITS[args.gameSlug] * 2);
    }

    return {
      success: errors.length === 0,
      setsProcessed: setsResult.count,
      setsSkipped: setsResult.skipped,
      cardsProcessed,
      errors,
    };
  },
});

/**
 * Clear cached data for a game (for testing/re-population)
 */
export const clearGameCache = internalMutation({
  args: {
    gameSlug: gameSlugValidator,
    clearSets: v.optional(v.boolean()),
    clearCards: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let setsDeleted = 0;
    let cardsDeleted = 0;

    if (args.clearSets !== false) {
      const sets = await ctx.db
        .query('cachedSets')
        .withIndex('by_game', (q) => q.eq('gameSlug', args.gameSlug))
        .collect();

      for (const set of sets) {
        await ctx.db.delete(set._id);
        setsDeleted++;
      }
    }

    if (args.clearCards !== false) {
      const cards = await ctx.db
        .query('cachedCards')
        .withIndex('by_game', (q) => q.eq('gameSlug', args.gameSlug))
        .collect();

      for (const card of cards) {
        await ctx.db.delete(card._id);
        cardsDeleted++;
      }
    }

    return { setsDeleted, cardsDeleted };
  },
});
