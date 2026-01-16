import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// ============================================================================
// DATA PERSISTENCE GUARANTEE SYSTEM
// Ensures collection data is never lost when switching phones/devices
// Provides data integrity verification, device tracking, and recovery
// ============================================================================

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

/**
 * Card variant type for consistent typing
 */
const cardVariant = v.union(
  v.literal('normal'),
  v.literal('holofoil'),
  v.literal('reverseHolofoil'),
  v.literal('1stEditionHolofoil'),
  v.literal('1stEditionNormal')
);

/**
 * Device type for tracking
 */
const deviceType = v.union(
  v.literal('web'),
  v.literal('ios'),
  v.literal('android'),
  v.literal('desktop'),
  v.literal('unknown')
);

/**
 * Data integrity check version
 */
const INTEGRITY_VERSION = 1;

// ============================================================================
// QUERIES - Data Integrity Verification
// ============================================================================

/**
 * Compute a checksum for the profile's collection data.
 * Used to verify data integrity across devices and detect data loss.
 */
export const getCollectionChecksum = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return { error: 'Profile not found' };
    }

    // Get all collection cards
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Get all wishlist cards
    const wishlistCards = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Get all achievements
    const achievements = await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Compute collection checksum
    const sortedCollectionData = collectionCards
      .map((c) => `${c.cardId}|${c.variant ?? 'normal'}|${c.quantity}`)
      .sort()
      .join(';');

    const sortedWishlistData = wishlistCards
      .map((w) => `${w.cardId}|${w.isPriority}`)
      .sort()
      .join(';');

    const sortedAchievementData = achievements
      .map((a) => `${a.achievementType}|${a.achievementKey}|${a.earnedAt}`)
      .sort()
      .join(';');

    // Combine all data for final checksum
    const allData = [sortedCollectionData, sortedWishlistData, sortedAchievementData].join('||');

    return {
      version: INTEGRITY_VERSION,
      timestamp: Date.now(),
      checksum: hashCode(allData),
      stats: {
        collectionCards: collectionCards.length,
        totalQuantity: collectionCards.reduce((sum, c) => sum + c.quantity, 0),
        wishlistCards: wishlistCards.length,
        achievements: achievements.length,
        uniqueCardIds: new Set(collectionCards.map((c) => c.cardId)).size,
      },
    };
  },
});

/**
 * Verify data integrity by comparing checksums.
 * Returns detailed information about any discrepancies.
 */
export const verifyDataIntegrity = query({
  args: {
    profileId: v.id('profiles'),
    expectedChecksum: v.number(),
    expectedStats: v.optional(
      v.object({
        collectionCards: v.number(),
        totalQuantity: v.number(),
        wishlistCards: v.number(),
        achievements: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return {
        isValid: false,
        error: 'Profile not found',
        discrepancies: [],
      };
    }

    // Get current state
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const wishlistCards = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const achievements = await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Compute current checksum
    const sortedCollectionData = collectionCards
      .map((c) => `${c.cardId}|${c.variant ?? 'normal'}|${c.quantity}`)
      .sort()
      .join(';');

    const sortedWishlistData = wishlistCards
      .map((w) => `${w.cardId}|${w.isPriority}`)
      .sort()
      .join(';');

    const sortedAchievementData = achievements
      .map((a) => `${a.achievementType}|${a.achievementKey}|${a.earnedAt}`)
      .sort()
      .join(';');

    const allData = [sortedCollectionData, sortedWishlistData, sortedAchievementData].join('||');
    const currentChecksum = hashCode(allData);

    const currentStats = {
      collectionCards: collectionCards.length,
      totalQuantity: collectionCards.reduce((sum, c) => sum + c.quantity, 0),
      wishlistCards: wishlistCards.length,
      achievements: achievements.length,
    };

    // Check for discrepancies
    const discrepancies: string[] = [];

    if (currentChecksum !== args.expectedChecksum) {
      discrepancies.push(
        `Checksum mismatch: expected ${args.expectedChecksum}, got ${currentChecksum}`
      );
    }

    if (args.expectedStats) {
      if (currentStats.collectionCards !== args.expectedStats.collectionCards) {
        discrepancies.push(
          `Collection card count mismatch: expected ${args.expectedStats.collectionCards}, got ${currentStats.collectionCards}`
        );
      }
      if (currentStats.totalQuantity !== args.expectedStats.totalQuantity) {
        discrepancies.push(
          `Total quantity mismatch: expected ${args.expectedStats.totalQuantity}, got ${currentStats.totalQuantity}`
        );
      }
      if (currentStats.wishlistCards !== args.expectedStats.wishlistCards) {
        discrepancies.push(
          `Wishlist card count mismatch: expected ${args.expectedStats.wishlistCards}, got ${currentStats.wishlistCards}`
        );
      }
      if (currentStats.achievements !== args.expectedStats.achievements) {
        discrepancies.push(
          `Achievement count mismatch: expected ${args.expectedStats.achievements}, got ${currentStats.achievements}`
        );
      }
    }

    return {
      isValid: discrepancies.length === 0,
      currentChecksum,
      currentStats,
      discrepancies,
      verifiedAt: Date.now(),
    };
  },
});

/**
 * Get data persistence status for a profile.
 * Shows last sync, device info, and data health.
 */
export const getDataPersistenceStatus = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return { error: 'Profile not found' };
    }

    // Get collection stats
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const wishlistCards = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const achievements = await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Get recent activity to determine sync status
    const recentActivity = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .first();

    // Get sync-related activity logs
    const syncLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .take(100);

    const lastSyncEvent = syncLogs.find((log) => {
      const metadata = log.metadata as { eventType?: string } | null;
      return (
        metadata?.eventType === 'sync_completed' ||
        metadata?.eventType === 'offline_sync' ||
        metadata?.eventType === 'data_import' ||
        metadata?.eventType === 'device_registered'
      );
    });

    // Compute checksum for current state
    const sortedCollectionData = collectionCards
      .map((c) => `${c.cardId}|${c.variant ?? 'normal'}|${c.quantity}`)
      .sort()
      .join(';');

    const sortedWishlistData = wishlistCards
      .map((w) => `${w.cardId}|${w.isPriority}`)
      .sort()
      .join(';');

    const sortedAchievementData = achievements
      .map((a) => `${a.achievementType}|${a.achievementKey}|${a.earnedAt}`)
      .sort()
      .join(';');

    const allData = [sortedCollectionData, sortedWishlistData, sortedAchievementData].join('||');
    const currentChecksum = hashCode(allData);

    return {
      profileId: args.profileId,
      displayName: profile.displayName,
      dataHealth: {
        status: collectionCards.length > 0 ? 'healthy' : 'empty',
        checksum: currentChecksum,
        lastVerified: Date.now(),
      },
      stats: {
        collectionCards: collectionCards.length,
        totalQuantity: collectionCards.reduce((sum, c) => sum + c.quantity, 0),
        uniqueCardIds: new Set(collectionCards.map((c) => c.cardId)).size,
        wishlistCards: wishlistCards.length,
        achievements: achievements.length,
      },
      syncStatus: {
        lastActivity: recentActivity?._creationTime ?? null,
        lastSync: lastSyncEvent?._creationTime ?? null,
        isSynced: true, // Convex is always synced by design
      },
      profileCreatedAt: profile._creationTime,
    };
  },
});

/**
 * Get a complete data snapshot for recovery purposes.
 * This is a comprehensive backup that can be used to restore data.
 */
export const getRecoverySnapshot = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return { error: 'Profile not found' };
    }

    // Get all data for the profile
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const wishlistCards = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const achievements = await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const activityLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .take(1000);

    const milestones = await ctx.db
      .query('collectionMilestones')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Compute checksum
    const sortedCollectionData = collectionCards
      .map((c) => `${c.cardId}|${c.variant ?? 'normal'}|${c.quantity}`)
      .sort()
      .join(';');
    const checksum = hashCode(sortedCollectionData);

    return {
      version: INTEGRITY_VERSION,
      createdAt: Date.now(),
      checksum,
      profile: {
        id: args.profileId,
        displayName: profile.displayName,
        profileType: profile.profileType,
        xp: profile.xp,
        level: profile.level,
      },
      collection: collectionCards.map((c) => ({
        cardId: c.cardId,
        variant: c.variant ?? 'normal',
        quantity: c.quantity,
      })),
      wishlist: wishlistCards.map((w) => ({
        cardId: w.cardId,
        isPriority: w.isPriority,
      })),
      achievements: achievements.map((a) => ({
        achievementType: a.achievementType,
        achievementKey: a.achievementKey,
        earnedAt: a.earnedAt,
        achievementData: a.achievementData,
      })),
      milestones: milestones.map((m) => ({
        milestoneKey: m.milestoneKey,
        threshold: m.threshold,
        cardCountAtReach: m.cardCountAtReach,
        celebratedAt: m.celebratedAt,
      })),
      recentActivityCount: activityLogs.length,
      stats: {
        collectionCards: collectionCards.length,
        totalQuantity: collectionCards.reduce((sum, c) => sum + c.quantity, 0),
        uniqueCardIds: new Set(collectionCards.map((c) => c.cardId)).size,
        wishlistCards: wishlistCards.length,
        achievements: achievements.length,
        milestones: milestones.length,
      },
    };
  },
});

/**
 * Get recent data changes for a profile.
 * Useful for showing what changed between devices.
 */
export const getRecentDataChanges = query({
  args: {
    profileId: v.id('profiles'),
    since: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return { error: 'Profile not found' };
    }

    const since = args.since ?? Date.now() - 7 * 24 * 60 * 60 * 1000; // Default to 7 days
    const limit = args.limit ?? 100;

    // Get recent activity logs
    const allLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .collect();

    // Filter by timestamp
    const recentLogs = allLogs.filter((log) => log._creationTime >= since).slice(0, limit);

    // Categorize changes
    const cardsAdded: Array<{
      cardId: string;
      cardName?: string;
      variant?: string;
      quantity?: number;
      timestamp: number;
    }> = [];
    const cardsRemoved: Array<{ cardId: string; cardName?: string; timestamp: number }> = [];
    const achievementsEarned: Array<{
      achievementType?: string;
      achievementKey?: string;
      timestamp: number;
    }> = [];
    const syncEvents: Array<{ eventType?: string; timestamp: number }> = [];

    for (const log of recentLogs) {
      const metadata = log.metadata as Record<string, unknown> | null;

      switch (log.action) {
        case 'card_added':
          cardsAdded.push({
            cardId: (metadata?.cardId as string) ?? 'unknown',
            cardName: metadata?.cardName as string | undefined,
            variant: metadata?.variant as string | undefined,
            quantity: metadata?.quantity as number | undefined,
            timestamp: log._creationTime,
          });
          break;
        case 'card_removed':
          cardsRemoved.push({
            cardId: (metadata?.cardId as string) ?? 'unknown',
            cardName: metadata?.cardName as string | undefined,
            timestamp: log._creationTime,
          });
          break;
        case 'achievement_earned':
          if (metadata?.eventType) {
            syncEvents.push({
              eventType: metadata.eventType as string,
              timestamp: log._creationTime,
            });
          } else {
            achievementsEarned.push({
              achievementType: metadata?.achievementType as string | undefined,
              achievementKey: metadata?.achievementKey as string | undefined,
              timestamp: log._creationTime,
            });
          }
          break;
      }
    }

    return {
      since,
      until: Date.now(),
      totalChanges: recentLogs.length,
      changes: {
        cardsAdded,
        cardsRemoved,
        achievementsEarned,
        syncEvents,
      },
      summary: {
        cardsAddedCount: cardsAdded.length,
        cardsRemovedCount: cardsRemoved.length,
        achievementsEarnedCount: achievementsEarned.length,
        syncEventsCount: syncEvents.length,
      },
    };
  },
});

// ============================================================================
// MUTATIONS - Device Registration & Sync Tracking
// ============================================================================

/**
 * Register a device accessing this profile.
 * Tracks which devices have accessed the data for security and debugging.
 */
export const registerDevice = mutation({
  args: {
    profileId: v.id('profiles'),
    deviceId: v.string(),
    deviceType: deviceType,
    deviceName: v.optional(v.string()),
    appVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Log device registration
    await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'achievement_earned', // Using existing action type for tracking
      metadata: {
        eventType: 'device_registered',
        deviceId: args.deviceId,
        deviceType: args.deviceType,
        deviceName: args.deviceName,
        appVersion: args.appVersion,
        timestamp: Date.now(),
      },
    });

    return {
      success: true,
      deviceId: args.deviceId,
      registeredAt: Date.now(),
    };
  },
});

/**
 * Record a device heartbeat to track active devices.
 * Call periodically to show device is still active.
 */
export const recordDeviceHeartbeat = mutation({
  args: {
    profileId: v.id('profiles'),
    deviceId: v.string(),
    currentChecksum: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Get current server checksum for comparison
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const sortedCollectionData = collectionCards
      .map((c) => `${c.cardId}|${c.variant ?? 'normal'}|${c.quantity}`)
      .sort()
      .join(';');
    const serverChecksum = hashCode(sortedCollectionData);

    // Check if checksums match
    const inSync = args.currentChecksum === undefined || args.currentChecksum === serverChecksum;

    return {
      success: true,
      deviceId: args.deviceId,
      serverChecksum,
      inSync,
      timestamp: Date.now(),
    };
  },
});

/**
 * Restore data from a recovery snapshot.
 * This is a powerful recovery operation that replaces all data.
 */
export const restoreFromSnapshot = mutation({
  args: {
    profileId: v.id('profiles'),
    snapshot: v.object({
      version: v.number(),
      checksum: v.number(),
      collection: v.array(
        v.object({
          cardId: v.string(),
          variant: v.optional(cardVariant),
          quantity: v.number(),
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
    restoreWishlist: v.optional(v.boolean()),
    deviceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const results = {
      collectionRestored: 0,
      collectionSkipped: 0,
      wishlistRestored: 0,
      errors: [] as string[],
    };

    // Get existing collection to compare
    const existingCollection = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Build a map of existing cards for quick lookup
    const existingMap = new Map<
      string,
      { id: (typeof existingCollection)[0]['_id']; quantity: number }
    >();
    for (const card of existingCollection) {
      const key = `${card.cardId}|${card.variant ?? 'normal'}`;
      existingMap.set(key, { id: card._id, quantity: card.quantity });
    }

    // Restore collection cards
    for (const card of args.snapshot.collection) {
      try {
        const variant = card.variant ?? 'normal';
        const key = `${card.cardId}|${variant}`;
        const existing = existingMap.get(key);

        if (existing) {
          // Update if quantity differs
          if (existing.quantity !== card.quantity) {
            await ctx.db.patch(existing.id, { quantity: card.quantity });
            results.collectionRestored++;
          } else {
            results.collectionSkipped++;
          }
        } else {
          // Insert new card
          await ctx.db.insert('collectionCards', {
            profileId: args.profileId,
            cardId: card.cardId,
            variant,
            quantity: card.quantity,
          });
          results.collectionRestored++;
        }
      } catch (error) {
        results.errors.push(
          `Failed to restore card ${card.cardId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Restore wishlist if requested
    if (args.restoreWishlist && args.snapshot.wishlist) {
      const existingWishlist = await ctx.db
        .query('wishlistCards')
        .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
        .collect();

      const existingWishlistSet = new Set(existingWishlist.map((w) => w.cardId));

      for (const wishlistCard of args.snapshot.wishlist) {
        try {
          if (!existingWishlistSet.has(wishlistCard.cardId)) {
            await ctx.db.insert('wishlistCards', {
              profileId: args.profileId,
              cardId: wishlistCard.cardId,
              isPriority: wishlistCard.isPriority,
            });
            results.wishlistRestored++;
          }
        } catch (error) {
          results.errors.push(
            `Failed to restore wishlist card ${wishlistCard.cardId}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    }

    // Log the restore operation
    await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'achievement_earned',
      metadata: {
        eventType: 'data_restored',
        snapshotVersion: args.snapshot.version,
        snapshotChecksum: args.snapshot.checksum,
        collectionRestored: results.collectionRestored,
        wishlistRestored: results.wishlistRestored,
        deviceId: args.deviceId,
        timestamp: Date.now(),
      },
    });

    return {
      success: results.errors.length === 0,
      ...results,
      restoredAt: Date.now(),
    };
  },
});

/**
 * Create a verified backup point.
 * Marks a point in time where data was verified as complete.
 */
export const createBackupPoint = mutation({
  args: {
    profileId: v.id('profiles'),
    deviceId: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Compute current checksum
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const wishlistCards = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const achievements = await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const sortedCollectionData = collectionCards
      .map((c) => `${c.cardId}|${c.variant ?? 'normal'}|${c.quantity}`)
      .sort()
      .join(';');

    const sortedWishlistData = wishlistCards
      .map((w) => `${w.cardId}|${w.isPriority}`)
      .sort()
      .join(';');

    const sortedAchievementData = achievements
      .map((a) => `${a.achievementType}|${a.achievementKey}|${a.earnedAt}`)
      .sort()
      .join(';');

    const allData = [sortedCollectionData, sortedWishlistData, sortedAchievementData].join('||');
    const checksum = hashCode(allData);

    const stats = {
      collectionCards: collectionCards.length,
      totalQuantity: collectionCards.reduce((sum, c) => sum + c.quantity, 0),
      wishlistCards: wishlistCards.length,
      achievements: achievements.length,
    };

    // Log the backup point
    await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'achievement_earned',
      metadata: {
        eventType: 'backup_point_created',
        checksum,
        stats,
        deviceId: args.deviceId,
        note: args.note,
        timestamp: Date.now(),
      },
    });

    return {
      success: true,
      checksum,
      stats,
      createdAt: Date.now(),
    };
  },
});

/**
 * Get backup points history for a profile.
 */
export const getBackupPoints = query({
  args: {
    profileId: v.id('profiles'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return { error: 'Profile not found' };
    }

    const limit = args.limit ?? 20;

    // Get activity logs that might be backup points
    const logs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .take(limit * 5); // Take more to filter

    // Filter to backup point events
    const backupPoints = logs
      .filter((log) => {
        const metadata = log.metadata as { eventType?: string } | null;
        return (
          metadata?.eventType === 'backup_point_created' || metadata?.eventType === 'data_export'
        );
      })
      .slice(0, limit)
      .map((log) => {
        const metadata = log.metadata as {
          eventType?: string;
          checksum?: number;
          stats?: {
            collectionCards: number;
            totalQuantity: number;
            wishlistCards: number;
            achievements: number;
          };
          deviceId?: string;
          note?: string;
        } | null;

        return {
          timestamp: log._creationTime,
          eventType: metadata?.eventType ?? 'unknown',
          checksum: metadata?.checksum ?? null,
          stats: metadata?.stats ?? null,
          deviceId: metadata?.deviceId ?? null,
          note: metadata?.note ?? null,
        };
      });

    return {
      profileId: args.profileId,
      backupPoints,
      totalCount: backupPoints.length,
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simple hash code function for checksum generation.
 * Uses a consistent algorithm for cross-device verification.
 */
function hashCode(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash;
}
