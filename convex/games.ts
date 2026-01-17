/**
 * Games table queries and mutations
 *
 * Manages the supported trading card games configuration.
 * Each game has its own API adapter and display settings.
 */
import { v } from 'convex/values';
import { query, mutation } from './_generated/server';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Valid game slugs matching the schema definition
 */
export type GameSlug = 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana';

/**
 * Game configuration for seeding
 */
interface GameSeedData {
  slug: GameSlug;
  displayName: string;
  apiSource: string;
  primaryColor: string;
  secondaryColor?: string;
  isActive: boolean;
  releaseOrder: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default game configurations matching GAME_CONFIGS in src/lib/tcg-api.ts
 */
export const DEFAULT_GAMES: GameSeedData[] = [
  {
    slug: 'pokemon',
    displayName: 'Pokémon TCG',
    apiSource: 'pokemontcg.io',
    primaryColor: '#FFCB05',
    secondaryColor: '#3466AF',
    isActive: true,
    releaseOrder: 1,
  },
  {
    slug: 'yugioh',
    displayName: 'Yu-Gi-Oh!',
    apiSource: 'ygoprodeck.com',
    primaryColor: '#1D1D1D',
    secondaryColor: '#B8860B',
    isActive: true,
    releaseOrder: 2,
  },
  {
    slug: 'onepiece',
    displayName: 'One Piece TCG',
    apiSource: 'optcg-api',
    primaryColor: '#E74C3C',
    secondaryColor: '#3498DB',
    isActive: true,
    releaseOrder: 3,
  },
  {
    slug: 'lorcana',
    displayName: 'Disney Lorcana',
    apiSource: 'lorcast.com',
    primaryColor: '#1B1464',
    secondaryColor: '#F5A623',
    isActive: true,
    releaseOrder: 4,
  },
];

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get all games, optionally filtered by active status
 */
export const getAllGames = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db
        .query('games')
        .withIndex('by_active', (q) => q.eq('isActive', true))
        .collect();
    }
    return await ctx.db.query('games').collect();
  },
});

/**
 * Get all active games sorted by release order
 */
export const getActiveGamesSorted = query({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db
      .query('games')
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect();

    return games.sort((a, b) => a.releaseOrder - b.releaseOrder);
  },
});

/**
 * Get a single game by slug
 */
export const getGameBySlug = query({
  args: {
    slug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('games')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
  },
});

/**
 * Get game count (useful for checking if seeded)
 */
export const getGameCount = query({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db.query('games').collect();
    return games.length;
  },
});

/**
 * Check if games table has been seeded
 */
export const isSeeded = query({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db.query('games').collect();
    return games.length >= DEFAULT_GAMES.length;
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Seed the games table with default configurations
 * Skips games that already exist (idempotent)
 */
export const seedGames = mutation({
  args: {},
  handler: async (ctx) => {
    const results: { slug: string; action: 'created' | 'skipped' }[] = [];

    for (const game of DEFAULT_GAMES) {
      // Check if game already exists
      const existing = await ctx.db
        .query('games')
        .withIndex('by_slug', (q) => q.eq('slug', game.slug))
        .unique();

      if (existing) {
        results.push({ slug: game.slug, action: 'skipped' });
        continue;
      }

      // Create the game
      await ctx.db.insert('games', {
        slug: game.slug,
        displayName: game.displayName,
        apiSource: game.apiSource,
        primaryColor: game.primaryColor,
        secondaryColor: game.secondaryColor,
        isActive: game.isActive,
        releaseOrder: game.releaseOrder,
      });

      results.push({ slug: game.slug, action: 'created' });
    }

    return {
      results,
      totalCreated: results.filter((r) => r.action === 'created').length,
      totalSkipped: results.filter((r) => r.action === 'skipped').length,
    };
  },
});

/**
 * Update a game's active status
 */
export const setGameActive = mutation({
  args: {
    slug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query('games')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();

    if (!game) {
      throw new Error(`Game not found: ${args.slug}`);
    }

    await ctx.db.patch(game._id, { isActive: args.isActive });

    return {
      slug: args.slug,
      isActive: args.isActive,
    };
  },
});

/**
 * Update a game's display configuration
 */
export const updateGameConfig = mutation({
  args: {
    slug: v.union(
      v.literal('pokemon'),
      v.literal('yugioh'),
      v.literal('onepiece'),
      v.literal('lorcana')
    ),
    displayName: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    releaseOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query('games')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();

    if (!game) {
      throw new Error(`Game not found: ${args.slug}`);
    }

    const updates: Partial<{
      displayName: string;
      primaryColor: string;
      secondaryColor: string;
      releaseOrder: number;
    }> = {};

    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.primaryColor !== undefined) updates.primaryColor = args.primaryColor;
    if (args.secondaryColor !== undefined) updates.secondaryColor = args.secondaryColor;
    if (args.releaseOrder !== undefined) updates.releaseOrder = args.releaseOrder;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(game._id, updates);
    }

    return {
      slug: args.slug,
      updated: Object.keys(updates),
    };
  },
});

/**
 * Reset games table (for development/testing)
 * WARNING: This deletes all game records
 */
export const resetGames = mutation({
  args: {
    confirmReset: v.literal(true),
  },
  handler: async (ctx, _args) => {
    const games = await ctx.db.query('games').collect();
    let deleted = 0;

    for (const game of games) {
      await ctx.db.delete(game._id);
      deleted++;
    }

    return { deleted };
  },
});
