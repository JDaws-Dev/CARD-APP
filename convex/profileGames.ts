/**
 * Profile Games junction table queries and mutations
 *
 * Tracks which trading card games each profile has enabled for their collection.
 * Allows users to select which TCGs they want to collect.
 */
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Valid game slugs matching the schema definition
 */
export type GameSlug = 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana';

/**
 * Game slug validator for use in queries/mutations
 */
const gameSlugValidator = v.union(
  v.literal('pokemon'),
  v.literal('yugioh'),
  v.literal('onepiece'),
  v.literal('lorcana')
);

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get all games enabled for a profile (active only by default)
 */
export const getProfileGames = query({
  args: {
    profileId: v.id('profiles'),
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const profileGames = await ctx.db
      .query('profileGames')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Filter to active only unless includeInactive is true
    if (!args.includeInactive) {
      return profileGames.filter((pg) => pg.isActive !== false);
    }

    return profileGames;
  },
});

/**
 * Get enabled game slugs for a profile (simple list)
 */
export const getEnabledGameSlugs = query({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const profileGames = await ctx.db
      .query('profileGames')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Return only active game slugs
    return profileGames.filter((pg) => pg.isActive !== false).map((pg) => pg.gameSlug);
  },
});

/**
 * Check if a specific game is enabled for a profile
 */
export const isGameEnabled = query({
  args: {
    profileId: v.id('profiles'),
    gameSlug: gameSlugValidator,
  },
  handler: async (ctx, args) => {
    const profileGame = await ctx.db
      .query('profileGames')
      .withIndex('by_profile_and_game', (q) =>
        q.eq('profileId', args.profileId).eq('gameSlug', args.gameSlug)
      )
      .unique();

    if (!profileGame) {
      return { enabled: false, enabledAt: null };
    }

    return {
      enabled: profileGame.isActive !== false,
      enabledAt: profileGame.enabledAt,
    };
  },
});

/**
 * Get profiles that have enabled a specific game
 * Useful for finding users who collect a particular TCG
 */
export const getProfilesForGame = query({
  args: {
    gameSlug: gameSlugValidator,
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const profileGames = await ctx.db
      .query('profileGames')
      .withIndex('by_game', (q) => q.eq('gameSlug', args.gameSlug))
      .collect();

    // Filter by active status
    const filtered =
      args.activeOnly === false ? profileGames : profileGames.filter((pg) => pg.isActive !== false);

    return filtered.map((pg) => ({
      profileId: pg.profileId,
      enabledAt: pg.enabledAt,
    }));
  },
});

/**
 * Get game statistics for a profile
 */
export const getProfileGameStats = query({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const profileGames = await ctx.db
      .query('profileGames')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const activeGames = profileGames.filter((pg) => pg.isActive !== false);
    const inactiveGames = profileGames.filter((pg) => pg.isActive === false);

    // Find the first game enabled (oldest by enabledAt)
    const firstEnabled = activeGames.reduce<(typeof activeGames)[0] | null>(
      (first, pg) => (!first || pg.enabledAt < first.enabledAt ? pg : first),
      null
    );

    // Find the most recent game enabled (newest by enabledAt)
    const lastEnabled = activeGames.reduce<(typeof activeGames)[0] | null>(
      (last, pg) => (!last || pg.enabledAt > last.enabledAt ? pg : last),
      null
    );

    return {
      totalEnabled: activeGames.length,
      totalDisabled: inactiveGames.length,
      enabledGames: activeGames.map((pg) => pg.gameSlug),
      disabledGames: inactiveGames.map((pg) => pg.gameSlug),
      firstGameEnabled: firstEnabled
        ? { slug: firstEnabled.gameSlug, enabledAt: firstEnabled.enabledAt }
        : null,
      lastGameEnabled: lastEnabled
        ? { slug: lastEnabled.gameSlug, enabledAt: lastEnabled.enabledAt }
        : null,
    };
  },
});

/**
 * Get games with full game info for a profile
 * Joins with games table to get display names, colors, etc.
 */
export const getProfileGamesWithInfo = query({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const profileGames = await ctx.db
      .query('profileGames')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Get active profile games only
    const activeProfileGames = profileGames.filter((pg) => pg.isActive !== false);

    // Fetch game info for each enabled game
    const gamesWithInfo = await Promise.all(
      activeProfileGames.map(async (pg) => {
        const game = await ctx.db
          .query('games')
          .withIndex('by_slug', (q) => q.eq('slug', pg.gameSlug))
          .unique();

        return {
          profileGameId: pg._id,
          gameSlug: pg.gameSlug,
          enabledAt: pg.enabledAt,
          gameInfo: game
            ? {
                displayName: game.displayName,
                apiSource: game.apiSource,
                primaryColor: game.primaryColor,
                secondaryColor: game.secondaryColor,
                isActive: game.isActive,
              }
            : null,
        };
      })
    );

    return gamesWithInfo;
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Enable a game for a profile
 * If already enabled, returns existing record
 * If previously disabled, re-enables it
 */
export const enableGame = mutation({
  args: {
    profileId: v.id('profiles'),
    gameSlug: gameSlugValidator,
  },
  handler: async (ctx, args) => {
    // Check if already exists
    const existing = await ctx.db
      .query('profileGames')
      .withIndex('by_profile_and_game', (q) =>
        q.eq('profileId', args.profileId).eq('gameSlug', args.gameSlug)
      )
      .unique();

    if (existing) {
      // If already active, just return
      if (existing.isActive !== false) {
        return {
          profileGameId: existing._id,
          action: 'already_enabled' as const,
          gameSlug: args.gameSlug,
        };
      }

      // Re-enable the game
      await ctx.db.patch(existing._id, {
        isActive: true,
        enabledAt: Date.now(), // Update enabledAt to track re-enablement
      });

      return {
        profileGameId: existing._id,
        action: 're_enabled' as const,
        gameSlug: args.gameSlug,
      };
    }

    // Create new profile game entry
    const profileGameId = await ctx.db.insert('profileGames', {
      profileId: args.profileId,
      gameSlug: args.gameSlug,
      enabledAt: Date.now(),
      isActive: true,
    });

    return {
      profileGameId,
      action: 'enabled' as const,
      gameSlug: args.gameSlug,
    };
  },
});

/**
 * Disable a game for a profile (soft delete - keeps history)
 */
export const disableGame = mutation({
  args: {
    profileId: v.id('profiles'),
    gameSlug: gameSlugValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('profileGames')
      .withIndex('by_profile_and_game', (q) =>
        q.eq('profileId', args.profileId).eq('gameSlug', args.gameSlug)
      )
      .unique();

    if (!existing) {
      return {
        success: false,
        error: 'Game not enabled for this profile',
        gameSlug: args.gameSlug,
      };
    }

    if (existing.isActive === false) {
      return {
        success: true,
        action: 'already_disabled' as const,
        gameSlug: args.gameSlug,
      };
    }

    await ctx.db.patch(existing._id, { isActive: false });

    return {
      success: true,
      action: 'disabled' as const,
      gameSlug: args.gameSlug,
    };
  },
});

/**
 * Remove a game from a profile completely (hard delete)
 */
export const removeGame = mutation({
  args: {
    profileId: v.id('profiles'),
    gameSlug: gameSlugValidator,
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('profileGames')
      .withIndex('by_profile_and_game', (q) =>
        q.eq('profileId', args.profileId).eq('gameSlug', args.gameSlug)
      )
      .unique();

    if (!existing) {
      return {
        success: false,
        error: 'Game not found for this profile',
        gameSlug: args.gameSlug,
      };
    }

    await ctx.db.delete(existing._id);

    return {
      success: true,
      action: 'removed' as const,
      gameSlug: args.gameSlug,
    };
  },
});

/**
 * Enable multiple games at once for a profile
 * Useful for onboarding when user selects multiple TCGs
 */
export const enableMultipleGames = mutation({
  args: {
    profileId: v.id('profiles'),
    gameSlugs: v.array(gameSlugValidator),
  },
  handler: async (ctx, args) => {
    const results: {
      gameSlug: GameSlug;
      action: 'enabled' | 're_enabled' | 'already_enabled';
    }[] = [];

    for (const gameSlug of args.gameSlugs) {
      const existing = await ctx.db
        .query('profileGames')
        .withIndex('by_profile_and_game', (q) =>
          q.eq('profileId', args.profileId).eq('gameSlug', gameSlug)
        )
        .unique();

      if (existing) {
        if (existing.isActive !== false) {
          results.push({ gameSlug, action: 'already_enabled' });
        } else {
          await ctx.db.patch(existing._id, {
            isActive: true,
            enabledAt: Date.now(),
          });
          results.push({ gameSlug, action: 're_enabled' });
        }
      } else {
        await ctx.db.insert('profileGames', {
          profileId: args.profileId,
          gameSlug,
          enabledAt: Date.now(),
          isActive: true,
        });
        results.push({ gameSlug, action: 'enabled' });
      }
    }

    return {
      results,
      totalEnabled: results.filter((r) => r.action === 'enabled').length,
      totalReEnabled: results.filter((r) => r.action === 're_enabled').length,
      totalAlreadyEnabled: results.filter((r) => r.action === 'already_enabled').length,
    };
  },
});

/**
 * Set games for a profile (replaces current selection)
 * Useful for updating game preferences - disables games not in list
 */
export const setProfileGames = mutation({
  args: {
    profileId: v.id('profiles'),
    gameSlugs: v.array(gameSlugValidator),
  },
  handler: async (ctx, args) => {
    // Get current games
    const currentGames = await ctx.db
      .query('profileGames')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const currentSlugs = new Set(currentGames.map((pg) => pg.gameSlug));
    const desiredSlugs = new Set(args.gameSlugs);

    const enabled: GameSlug[] = [];
    const disabled: GameSlug[] = [];
    const unchanged: GameSlug[] = [];

    // Disable games not in desired list
    for (const pg of currentGames) {
      if (!desiredSlugs.has(pg.gameSlug)) {
        if (pg.isActive !== false) {
          await ctx.db.patch(pg._id, { isActive: false });
          disabled.push(pg.gameSlug);
        } else {
          // Already disabled, no change
        }
      } else {
        // In desired list
        if (pg.isActive === false) {
          await ctx.db.patch(pg._id, { isActive: true, enabledAt: Date.now() });
          enabled.push(pg.gameSlug);
        } else {
          unchanged.push(pg.gameSlug);
        }
      }
    }

    // Enable games not currently tracked
    for (const gameSlug of args.gameSlugs) {
      if (!currentSlugs.has(gameSlug)) {
        await ctx.db.insert('profileGames', {
          profileId: args.profileId,
          gameSlug,
          enabledAt: Date.now(),
          isActive: true,
        });
        enabled.push(gameSlug);
      }
    }

    return {
      enabled,
      disabled,
      unchanged,
      totalActive: args.gameSlugs.length,
    };
  },
});

/**
 * Initialize default games for a new profile
 * By default, enables Pokemon TCG only (most common use case)
 */
export const initializeDefaultGames = mutation({
  args: {
    profileId: v.id('profiles'),
    defaultGame: v.optional(gameSlugValidator),
  },
  handler: async (ctx, args) => {
    // Check if profile already has games
    const existing = await ctx.db
      .query('profileGames')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .first();

    if (existing) {
      return {
        action: 'skipped' as const,
        reason: 'Profile already has games configured',
      };
    }

    const defaultGameSlug: GameSlug = args.defaultGame ?? 'pokemon';

    const profileGameId = await ctx.db.insert('profileGames', {
      profileId: args.profileId,
      gameSlug: defaultGameSlug,
      enabledAt: Date.now(),
      isActive: true,
    });

    return {
      action: 'initialized' as const,
      profileGameId,
      gameSlug: defaultGameSlug,
    };
  },
});
