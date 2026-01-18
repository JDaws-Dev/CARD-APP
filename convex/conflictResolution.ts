import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// ============================================================================
// CONFLICT RESOLUTION SYSTEM
// Handles sync conflicts when same account is used on multiple devices
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

/**
 * Card variant type - now supports all games (Pokemon, Yu-Gi-Oh, One Piece, Lorcana)
 */
const cardVariant = v.string();

/**
 * Conflict resolution strategy
 * - 'last_write_wins': Most recent change wins (default)
 * - 'keep_higher': Keep the higher quantity
 * - 'merge_add': Add quantities together (for additions on different devices)
 * - 'server_wins': Keep server state, discard client change
 * - 'client_wins': Use client state, overwrite server
 */
const resolutionStrategy = v.union(
  v.literal('last_write_wins'),
  v.literal('keep_higher'),
  v.literal('merge_add'),
  v.literal('server_wins'),
  v.literal('client_wins')
);

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get pending sync status for a profile.
 * Returns information about potential conflicts and sync state.
 */
export const getSyncStatus = query({
  args: {
    profileId: v.id('profiles'),
    lastKnownTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return { error: 'Profile not found' };
    }

    // Get most recent activity timestamp
    const latestActivity = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .first();

    // Get collection card count
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const uniqueCards = collectionCards.length;
    const totalQuantity = collectionCards.reduce((sum, c) => sum + c.quantity, 0);
    const latestServerTimestamp = latestActivity?._creationTime ?? 0;

    // Check if there are changes since lastKnownTimestamp
    const hasServerChanges =
      args.lastKnownTimestamp !== undefined && latestServerTimestamp > args.lastKnownTimestamp;

    return {
      profileId: args.profileId,
      serverTimestamp: latestServerTimestamp,
      lastKnownTimestamp: args.lastKnownTimestamp ?? null,
      hasServerChanges,
      collectionStats: {
        uniqueCards,
        totalQuantity,
      },
      syncState: hasServerChanges ? 'needs_sync' : 'synced',
    };
  },
});

/**
 * Compare client collection state with server state.
 * Returns a detailed diff showing what changed on each side.
 */
export const compareCollectionState = query({
  args: {
    profileId: v.id('profiles'),
    clientCards: v.array(
      v.object({
        cardId: v.string(),
        variant: v.optional(cardVariant),
        quantity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return { error: 'Profile not found' };
    }

    // Get server collection state
    const serverCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Build server state map (cardId|variant -> quantity)
    const serverMap = new Map<string, number>();
    for (const card of serverCards) {
      const key = `${card.cardId}|${card.variant ?? 'normal'}`;
      serverMap.set(key, card.quantity);
    }

    // Build client state map
    const clientMap = new Map<string, number>();
    for (const card of args.clientCards) {
      const key = `${card.cardId}|${card.variant ?? 'normal'}`;
      clientMap.set(key, card.quantity);
    }

    // Find differences
    const onlyOnServer: Array<{ cardId: string; variant: string; quantity: number }> = [];
    const onlyOnClient: Array<{ cardId: string; variant: string; quantity: number }> = [];
    const quantityDifferences: Array<{
      cardId: string;
      variant: string;
      serverQuantity: number;
      clientQuantity: number;
    }> = [];
    const inSync: Array<{ cardId: string; variant: string; quantity: number }> = [];

    // Check server cards against client
    for (const [key, serverQty] of serverMap) {
      const [cardId, variant] = key.split('|');
      const clientQty = clientMap.get(key);

      if (clientQty === undefined) {
        onlyOnServer.push({ cardId, variant, quantity: serverQty });
      } else if (clientQty !== serverQty) {
        quantityDifferences.push({
          cardId,
          variant,
          serverQuantity: serverQty,
          clientQuantity: clientQty,
        });
      } else {
        inSync.push({ cardId, variant, quantity: serverQty });
      }
    }

    // Check client cards not on server
    for (const [key, clientQty] of clientMap) {
      if (!serverMap.has(key)) {
        const [cardId, variant] = key.split('|');
        onlyOnClient.push({ cardId, variant, quantity: clientQty });
      }
    }

    const hasConflicts =
      onlyOnServer.length > 0 || onlyOnClient.length > 0 || quantityDifferences.length > 0;

    return {
      hasConflicts,
      summary: {
        totalServerCards: serverMap.size,
        totalClientCards: clientMap.size,
        inSyncCount: inSync.length,
        conflictCount: quantityDifferences.length,
        onlyOnServerCount: onlyOnServer.length,
        onlyOnClientCount: onlyOnClient.length,
      },
      conflicts: {
        onlyOnServer,
        onlyOnClient,
        quantityDifferences,
      },
      inSync,
    };
  },
});

/**
 * Get recent sync events for a profile.
 * Useful for showing sync history and debugging conflicts.
 */
export const getSyncHistory = query({
  args: {
    profileId: v.id('profiles'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return { error: 'Profile not found' };
    }

    const limit = args.limit ?? 50;

    // Get activity logs that might indicate sync events
    const logs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .take(limit * 2); // Take more to filter

    // Filter to sync-related events
    const syncEvents = logs
      .filter((log) => {
        const metadata = log.metadata as {
          eventType?: string;
          deviceId?: string;
          resolution?: string;
        } | null;
        return (
          metadata?.eventType === 'sync_conflict_resolved' ||
          metadata?.eventType === 'sync_completed' ||
          metadata?.eventType === 'offline_sync'
        );
      })
      .slice(0, limit)
      .map((log) => {
        const metadata = log.metadata as {
          eventType?: string;
          deviceId?: string;
          resolution?: string;
          cardsAffected?: number;
          conflictsResolved?: number;
        } | null;

        return {
          timestamp: log._creationTime,
          eventType: metadata?.eventType ?? 'unknown',
          deviceId: metadata?.deviceId ?? null,
          resolution: metadata?.resolution ?? null,
          cardsAffected: metadata?.cardsAffected ?? 0,
          conflictsResolved: metadata?.conflictsResolved ?? 0,
        };
      });

    return {
      profileId: args.profileId,
      events: syncEvents,
      totalEvents: syncEvents.length,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Add a card with conflict-aware handling.
 * Checks for existing card and applies resolution strategy if conflict detected.
 */
export const addCardWithConflictResolution = mutation({
  args: {
    profileId: v.id('profiles'),
    cardId: v.string(),
    cardName: v.optional(v.string()),
    setName: v.optional(v.string()),
    variant: v.optional(cardVariant),
    quantity: v.optional(v.number()),
    expectedServerQuantity: v.optional(v.number()),
    deviceId: v.optional(v.string()),
    strategy: v.optional(resolutionStrategy),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const quantity = args.quantity ?? 1;
    const variant = args.variant ?? 'normal';
    const strategy = args.strategy ?? 'last_write_wins';

    // Check if card with this specific variant already exists
    const existing = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile_card_variant', (q) =>
        q.eq('profileId', args.profileId).eq('cardId', args.cardId).eq('variant', variant)
      )
      .first();

    let conflictDetected = false;
    let conflictResolution: string | null = null;
    let finalQuantity = quantity;

    if (existing) {
      // Check for conflict: client expected different quantity
      const expectedQty = args.expectedServerQuantity ?? existing.quantity;
      if (
        args.expectedServerQuantity !== undefined &&
        existing.quantity !== args.expectedServerQuantity
      ) {
        conflictDetected = true;

        // Apply resolution strategy
        switch (strategy) {
          case 'last_write_wins':
            // Client's new quantity wins
            finalQuantity = existing.quantity + quantity;
            conflictResolution = 'last_write_wins';
            break;

          case 'keep_higher':
            // Keep whichever results in higher quantity
            const clientTotal = expectedQty + quantity;
            const serverCurrent = existing.quantity;
            finalQuantity = Math.max(clientTotal, serverCurrent + quantity);
            conflictResolution = 'keep_higher';
            break;

          case 'merge_add':
            // Add all changes together
            const serverChange = existing.quantity - expectedQty;
            finalQuantity = expectedQty + quantity + serverChange;
            conflictResolution = 'merge_add';
            break;

          case 'server_wins':
            // Keep server quantity, just add the new amount
            finalQuantity = existing.quantity + quantity;
            conflictResolution = 'server_wins';
            break;

          case 'client_wins':
            // Overwrite with client's expected + new
            finalQuantity = expectedQty + quantity;
            conflictResolution = 'client_wins';
            break;
        }
      } else {
        // No conflict, just add
        finalQuantity = existing.quantity + quantity;
      }

      // Update quantity
      await ctx.db.patch(existing._id, { quantity: finalQuantity });
    } else {
      // New card, no conflict possible
      await ctx.db.insert('collectionCards', {
        profileId: args.profileId,
        cardId: args.cardId,
        variant,
        quantity,
      });
      finalQuantity = quantity;
    }

    // Log activity
    await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'card_added',
      metadata: {
        cardId: args.cardId,
        cardName: args.cardName ?? args.cardId,
        setName: args.setName,
        variant,
        quantity,
        finalQuantity,
        conflictDetected,
        conflictResolution,
        deviceId: args.deviceId,
      },
    });

    // Log sync event if conflict was resolved
    if (conflictDetected) {
      await ctx.db.insert('activityLogs', {
        profileId: args.profileId,
        action: 'achievement_earned', // Using existing action type
        metadata: {
          eventType: 'sync_conflict_resolved',
          cardId: args.cardId,
          variant,
          resolution: conflictResolution,
          deviceId: args.deviceId,
          timestamp: Date.now(),
        },
      });
    }

    return {
      success: true,
      cardId: args.cardId,
      variant,
      finalQuantity,
      conflictDetected,
      conflictResolution,
    };
  },
});

/**
 * Update card quantity with conflict detection.
 */
export const updateQuantityWithConflictResolution = mutation({
  args: {
    profileId: v.id('profiles'),
    cardId: v.string(),
    variant: v.optional(cardVariant),
    newQuantity: v.number(),
    expectedServerQuantity: v.number(),
    deviceId: v.optional(v.string()),
    strategy: v.optional(resolutionStrategy),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const variant = args.variant ?? 'normal';
    const strategy = args.strategy ?? 'last_write_wins';

    const existing = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile_card_variant', (q) =>
        q.eq('profileId', args.profileId).eq('cardId', args.cardId).eq('variant', variant)
      )
      .first();

    if (!existing) {
      if (args.newQuantity > 0) {
        // Card doesn't exist, create it
        await ctx.db.insert('collectionCards', {
          profileId: args.profileId,
          cardId: args.cardId,
          variant,
          quantity: args.newQuantity,
        });

        return {
          success: true,
          cardId: args.cardId,
          variant,
          finalQuantity: args.newQuantity,
          conflictDetected: args.expectedServerQuantity !== 0,
          conflictResolution: args.expectedServerQuantity !== 0 ? 'created_new' : null,
        };
      }
      throw new Error('Card not found in collection');
    }

    // Check for conflict
    const conflictDetected = existing.quantity !== args.expectedServerQuantity;
    let finalQuantity = args.newQuantity;
    let conflictResolution: string | null = null;

    if (conflictDetected) {
      const clientDelta = args.newQuantity - args.expectedServerQuantity;
      const serverDelta = existing.quantity - args.expectedServerQuantity;

      switch (strategy) {
        case 'last_write_wins':
          finalQuantity = args.newQuantity;
          conflictResolution = 'last_write_wins';
          break;

        case 'keep_higher':
          finalQuantity = Math.max(args.newQuantity, existing.quantity);
          conflictResolution = 'keep_higher';
          break;

        case 'merge_add':
          // Apply both deltas to original expected
          finalQuantity = args.expectedServerQuantity + clientDelta + serverDelta;
          conflictResolution = 'merge_add';
          break;

        case 'server_wins':
          finalQuantity = existing.quantity;
          conflictResolution = 'server_wins';
          break;

        case 'client_wins':
          finalQuantity = args.newQuantity;
          conflictResolution = 'client_wins';
          break;
      }
    }

    // Ensure quantity doesn't go negative
    finalQuantity = Math.max(0, finalQuantity);

    if (finalQuantity <= 0) {
      // Delete the card
      await ctx.db.delete(existing._id);

      await ctx.db.insert('activityLogs', {
        profileId: args.profileId,
        action: 'card_removed',
        metadata: {
          cardId: args.cardId,
          variant,
          conflictDetected,
          conflictResolution,
          deviceId: args.deviceId,
        },
      });
    } else {
      // Update quantity
      await ctx.db.patch(existing._id, { quantity: finalQuantity });
    }

    // Log sync event if conflict was resolved
    if (conflictDetected) {
      await ctx.db.insert('activityLogs', {
        profileId: args.profileId,
        action: 'achievement_earned',
        metadata: {
          eventType: 'sync_conflict_resolved',
          cardId: args.cardId,
          variant,
          resolution: conflictResolution,
          expectedQuantity: args.expectedServerQuantity,
          serverQuantity: existing.quantity,
          requestedQuantity: args.newQuantity,
          finalQuantity,
          deviceId: args.deviceId,
          timestamp: Date.now(),
        },
      });
    }

    return {
      success: true,
      cardId: args.cardId,
      variant,
      previousQuantity: existing.quantity,
      finalQuantity,
      conflictDetected,
      conflictResolution,
    };
  },
});

/**
 * Bulk sync collection with conflict resolution.
 * Reconciles a full client collection state with server state.
 */
export const bulkSyncCollection = mutation({
  args: {
    profileId: v.id('profiles'),
    clientCards: v.array(
      v.object({
        cardId: v.string(),
        variant: v.optional(cardVariant),
        quantity: v.number(),
      })
    ),
    strategy: v.optional(resolutionStrategy),
    deviceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const strategy = args.strategy ?? 'last_write_wins';

    // Get server collection state
    const serverCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Build server state map
    const serverMap = new Map<string, { id: (typeof serverCards)[0]['_id']; quantity: number }>();
    for (const card of serverCards) {
      const key = `${card.cardId}|${card.variant ?? 'normal'}`;
      serverMap.set(key, { id: card._id, quantity: card.quantity });
    }

    const results = {
      cardsAdded: 0,
      cardsUpdated: 0,
      cardsRemoved: 0,
      conflictsResolved: 0,
      errors: [] as string[],
    };

    // Process client cards
    const processedKeys = new Set<string>();

    for (const clientCard of args.clientCards) {
      const variant = clientCard.variant ?? 'normal';
      const key = `${clientCard.cardId}|${variant}`;
      processedKeys.add(key);

      const serverEntry = serverMap.get(key);

      try {
        if (!serverEntry) {
          // Card only on client, add to server
          if (clientCard.quantity > 0) {
            await ctx.db.insert('collectionCards', {
              profileId: args.profileId,
              cardId: clientCard.cardId,
              variant,
              quantity: clientCard.quantity,
            });
            results.cardsAdded++;
          }
        } else if (serverEntry.quantity !== clientCard.quantity) {
          // Conflict: different quantities
          let finalQuantity = clientCard.quantity;

          switch (strategy) {
            case 'keep_higher':
              finalQuantity = Math.max(clientCard.quantity, serverEntry.quantity);
              break;
            case 'merge_add':
              // This doesn't make sense for full sync, use max instead
              finalQuantity = Math.max(clientCard.quantity, serverEntry.quantity);
              break;
            case 'server_wins':
              finalQuantity = serverEntry.quantity;
              break;
            case 'client_wins':
            case 'last_write_wins':
            default:
              finalQuantity = clientCard.quantity;
              break;
          }

          if (finalQuantity <= 0) {
            await ctx.db.delete(serverEntry.id);
            results.cardsRemoved++;
          } else if (finalQuantity !== serverEntry.quantity) {
            await ctx.db.patch(serverEntry.id, { quantity: finalQuantity });
            results.cardsUpdated++;
          }
          results.conflictsResolved++;
        }
        // If quantities match, nothing to do
      } catch (error) {
        results.errors.push(
          `Failed to sync ${clientCard.cardId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Handle cards only on server (not in client collection)
    // These might have been deleted on client while offline
    for (const [key, serverEntry] of serverMap) {
      if (!processedKeys.has(key)) {
        // Card exists on server but not in client sync
        // Based on strategy, we might delete it or keep it
        if (strategy === 'client_wins' || strategy === 'last_write_wins') {
          // Client doesn't have it, so remove from server
          await ctx.db.delete(serverEntry.id);
          results.cardsRemoved++;
          results.conflictsResolved++;
        }
        // For other strategies, keep server state
      }
    }

    // Log sync completion
    await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'achievement_earned',
      metadata: {
        eventType: 'sync_completed',
        cardsAdded: results.cardsAdded,
        cardsUpdated: results.cardsUpdated,
        cardsRemoved: results.cardsRemoved,
        conflictsResolved: results.conflictsResolved,
        strategy,
        deviceId: args.deviceId,
        timestamp: Date.now(),
      },
    });

    return {
      success: results.errors.length === 0,
      ...results,
    };
  },
});

/**
 * Mark offline changes as synced.
 * Call after successfully syncing offline changes to clear pending state.
 */
export const markOfflineSynced = mutation({
  args: {
    profileId: v.id('profiles'),
    deviceId: v.string(),
    changeCount: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Log the offline sync event
    await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'achievement_earned',
      metadata: {
        eventType: 'offline_sync',
        deviceId: args.deviceId,
        changeCount: args.changeCount,
        timestamp: Date.now(),
      },
    });

    return {
      success: true,
      deviceId: args.deviceId,
      changeCount: args.changeCount,
      syncedAt: Date.now(),
    };
  },
});

/**
 * Get the server's current collection snapshot.
 * Used by clients to initialize their local cache or verify sync state.
 */
export const getCollectionSnapshot = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return { error: 'Profile not found' };
    }

    const cards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const snapshotTimestamp = Date.now();

    // Create a checksum for quick comparison
    const sortedCards = [...cards].sort((a, b) => {
      const aKey = `${a.cardId}|${a.variant ?? 'normal'}`;
      const bKey = `${b.cardId}|${b.variant ?? 'normal'}`;
      return aKey.localeCompare(bKey);
    });

    // Simple checksum: concatenate all card states
    const checksumData = sortedCards
      .map((c) => `${c.cardId}|${c.variant ?? 'normal'}|${c.quantity}`)
      .join(';');
    const checksum = checksumData.length > 0 ? hashCode(checksumData) : 0;

    return {
      profileId: args.profileId,
      snapshotTimestamp,
      checksum,
      cards: cards.map((c) => ({
        cardId: c.cardId,
        variant: c.variant ?? 'normal',
        quantity: c.quantity,
      })),
      totalCards: cards.length,
      totalQuantity: cards.reduce((sum, c) => sum + c.quantity, 0),
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simple hash code function for checksum generation
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}
