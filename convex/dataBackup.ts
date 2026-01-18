import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// ============================================================================
// DATA BACKUP & EXPORT
// Provides data export/import functionality for collection backup
// Since Convex is a cloud database, data is already persisted and synced.
// This module adds explicit export for user peace of mind and portability.
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

/**
 * Export format version for backwards compatibility
 */
const EXPORT_VERSION = '1.0.0';

/**
 * Exported collection card format
 */
interface ExportedCard {
  cardId: string;
  quantity: number;
  variant?: string;
}

/**
 * Exported wishlist card format
 */
interface ExportedWishlistCard {
  cardId: string;
  isPriority: boolean;
}

/**
 * Exported achievement format
 */
interface ExportedAchievement {
  achievementType: string;
  achievementKey: string;
  earnedAt: number;
}

/**
 * Exported activity log format
 */
interface ExportedActivityLog {
  action: string;
  metadata: Record<string, unknown> | null;
  timestamp: number;
}

/**
 * Complete profile export format
 */
interface ProfileExport {
  version: string;
  exportedAt: number;
  profile: {
    displayName: string;
    profileType?: string;
    xp?: number;
    level?: number;
  };
  collection: ExportedCard[];
  wishlist: ExportedWishlistCard[];
  achievements: ExportedAchievement[];
  activityLogs: ExportedActivityLog[];
  stats: {
    totalCards: number;
    uniqueCards: number;
    totalAchievements: number;
    wishlistCount: number;
  };
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Export all data for a profile as a JSON-serializable object.
 * This can be used for:
 * - User-initiated backup download
 * - Data portability (GDPR compliance)
 * - Migration to another system
 */
export const exportProfileData = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args): Promise<ProfileExport | null> => {
    // Get profile
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return null;
    }

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

    // Get achievements
    const achievements = await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Get activity logs (last 1000 for reasonable export size)
    const activityLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .take(1000);

    // Calculate stats
    const uniqueCardIds = new Set(collectionCards.map((c) => c.cardId));
    const totalCards = collectionCards.reduce((sum, c) => sum + c.quantity, 0);

    return {
      version: EXPORT_VERSION,
      exportedAt: Date.now(),
      profile: {
        displayName: profile.displayName,
        profileType: profile.profileType,
        xp: profile.xp,
        level: profile.level,
      },
      collection: collectionCards.map((c) => ({
        cardId: c.cardId,
        quantity: c.quantity,
        variant: c.variant,
      })),
      wishlist: wishlistCards.map((c) => ({
        cardId: c.cardId,
        isPriority: c.isPriority,
      })),
      achievements: achievements.map((a) => ({
        achievementType: a.achievementType,
        achievementKey: a.achievementKey,
        earnedAt: a.earnedAt,
      })),
      activityLogs: activityLogs.map((l) => ({
        action: l.action,
        metadata: l.metadata as Record<string, unknown> | null,
        timestamp: l._creationTime,
      })),
      stats: {
        totalCards,
        uniqueCards: uniqueCardIds.size,
        totalAchievements: achievements.length,
        wishlistCount: wishlistCards.length,
      },
    };
  },
});

/**
 * Get a summary of what data is available for export.
 * Useful for showing users what will be included in their backup.
 */
export const getExportSummary = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return null;
    }

    // Count collections
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Count wishlist
    const wishlistCards = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Count achievements
    const achievements = await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Count activity logs
    const activityLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const uniqueCardIds = new Set(collectionCards.map((c) => c.cardId));
    const totalQuantity = collectionCards.reduce((sum, c) => sum + c.quantity, 0);

    return {
      profileName: profile.displayName,
      collection: {
        uniqueCards: uniqueCardIds.size,
        totalQuantity,
        variants: collectionCards.filter((c) => c.variant && c.variant !== 'normal').length,
      },
      wishlist: {
        total: wishlistCards.length,
        priority: wishlistCards.filter((c) => c.isPriority).length,
      },
      achievements: {
        total: achievements.length,
      },
      activityLogs: {
        total: activityLogs.length,
        willExport: Math.min(activityLogs.length, 1000),
      },
      lastActivity:
        activityLogs.length > 0 ? Math.max(...activityLogs.map((l) => l._creationTime)) : null,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Import collection data from an export.
 * This is a merge operation - it adds cards that don't exist
 * and updates quantities for cards that do.
 *
 * Options:
 * - mergeMode: 'add' adds to existing, 'replace' replaces existing
 * - importWishlist: whether to import wishlist data
 * - importAchievements: whether to import achievements (usually false to avoid duplicates)
 */
export const importCollectionData = mutation({
  args: {
    profileId: v.id('profiles'),
    data: v.object({
      version: v.string(),
      collection: v.array(
        v.object({
          cardId: v.string(),
          quantity: v.number(),
          variant: v.optional(v.string()), // Supports all game variants
        })
      ),
      wishlist: v.optional(
        v.array(
          v.object({
            cardId: v.string(),
            isPriority: v.boolean(),
          })
        )
      ),
    }),
    options: v.optional(
      v.object({
        mergeMode: v.optional(v.union(v.literal('add'), v.literal('replace'))),
        importWishlist: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const mergeMode = args.options?.mergeMode ?? 'add';
    const importWishlist = args.options?.importWishlist ?? false;

    const results = {
      cardsImported: 0,
      cardsUpdated: 0,
      cardsSkipped: 0,
      wishlistImported: 0,
      errors: [] as string[],
    };

    // Import collection cards
    for (const card of args.data.collection) {
      try {
        // Validate card data
        if (!card.cardId || card.quantity < 1) {
          results.cardsSkipped++;
          continue;
        }

        // Check if card already exists in collection
        const existing = await ctx.db
          .query('collectionCards')
          .withIndex('by_profile_card_variant', (q) =>
            q
              .eq('profileId', args.profileId)
              .eq('cardId', card.cardId)
              .eq('variant', card.variant ?? 'normal')
          )
          .first();

        if (existing) {
          if (mergeMode === 'add') {
            // Add to existing quantity
            await ctx.db.patch(existing._id, {
              quantity: existing.quantity + card.quantity,
            });
            results.cardsUpdated++;
          } else {
            // Replace existing quantity
            await ctx.db.patch(existing._id, {
              quantity: card.quantity,
            });
            results.cardsUpdated++;
          }
        } else {
          // Insert new card
          await ctx.db.insert('collectionCards', {
            profileId: args.profileId,
            cardId: card.cardId,
            quantity: card.quantity,
            variant: card.variant ?? 'normal',
          });
          results.cardsImported++;
        }
      } catch (error) {
        results.errors.push(
          `Failed to import card ${card.cardId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Import wishlist if requested
    if (importWishlist && args.data.wishlist) {
      for (const wishlistCard of args.data.wishlist) {
        try {
          if (!wishlistCard.cardId) {
            continue;
          }

          // Check if already in wishlist
          const existing = await ctx.db
            .query('wishlistCards')
            .withIndex('by_profile_and_card', (q) =>
              q.eq('profileId', args.profileId).eq('cardId', wishlistCard.cardId)
            )
            .first();

          if (!existing) {
            await ctx.db.insert('wishlistCards', {
              profileId: args.profileId,
              cardId: wishlistCard.cardId,
              isPriority: wishlistCard.isPriority,
            });
            results.wishlistImported++;
          }
        } catch (error) {
          results.errors.push(
            `Failed to import wishlist card ${wishlistCard.cardId}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    }

    // Log the import activity
    await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'achievement_earned', // Using existing action type for tracking
      metadata: {
        eventType: 'data_import',
        cardsImported: results.cardsImported,
        cardsUpdated: results.cardsUpdated,
        wishlistImported: results.wishlistImported,
        timestamp: Date.now(),
      },
    });

    return results;
  },
});

/**
 * Clear all collection data for a profile.
 * This is a destructive operation - use with caution.
 * Requires confirmation by passing the profile's display name.
 */
export const clearCollectionData = mutation({
  args: {
    profileId: v.id('profiles'),
    confirmationName: v.string(),
    clearWishlist: v.optional(v.boolean()),
    clearAchievements: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Verify confirmation
    if (profile.displayName.toLowerCase() !== args.confirmationName.toLowerCase()) {
      throw new Error('Profile name confirmation does not match');
    }

    let cardsDeleted = 0;
    let wishlistDeleted = 0;
    let achievementsDeleted = 0;

    // Delete collection cards
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    for (const card of collectionCards) {
      await ctx.db.delete(card._id);
      cardsDeleted++;
    }

    // Optionally delete wishlist
    if (args.clearWishlist) {
      const wishlistCards = await ctx.db
        .query('wishlistCards')
        .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
        .collect();

      for (const card of wishlistCards) {
        await ctx.db.delete(card._id);
        wishlistDeleted++;
      }
    }

    // Optionally delete achievements
    if (args.clearAchievements) {
      const achievements = await ctx.db
        .query('achievements')
        .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
        .collect();

      for (const achievement of achievements) {
        await ctx.db.delete(achievement._id);
        achievementsDeleted++;
      }
    }

    // Log the clear activity
    await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'achievement_earned',
      metadata: {
        eventType: 'data_cleared',
        cardsDeleted,
        wishlistDeleted,
        achievementsDeleted,
        timestamp: Date.now(),
      },
    });

    return {
      success: true,
      cardsDeleted,
      wishlistDeleted,
      achievementsDeleted,
    };
  },
});

/**
 * Get the last backup/export timestamp for a profile.
 * Useful for showing users when they last backed up their data.
 */
export const getLastBackupInfo = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return null;
    }

    // Look for export events in activity logs
    const exportEvents = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .collect();

    const lastExport = exportEvents.find((log) => {
      const metadata = log.metadata as { eventType?: string } | undefined;
      return metadata?.eventType === 'data_export';
    });

    const lastImport = exportEvents.find((log) => {
      const metadata = log.metadata as { eventType?: string } | undefined;
      return metadata?.eventType === 'data_import';
    });

    return {
      lastExport: lastExport?._creationTime ?? null,
      lastImport: lastImport?._creationTime ?? null,
      profileCreated: profile._creationTime,
    };
  },
});

/**
 * Log that an export was performed.
 * Call this when the user downloads their backup.
 */
export const logExport = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'achievement_earned',
      metadata: {
        eventType: 'data_export',
        timestamp: Date.now(),
      },
    });

    return { success: true };
  },
});
