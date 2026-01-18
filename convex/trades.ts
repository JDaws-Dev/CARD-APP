import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Card variant type - now supports all games (Pokemon, Yu-Gi-Oh, One Piece, Lorcana)
const cardVariant = v.string();

// Trade card entry for cards being given or received
const tradeCardEntry = v.object({
  cardId: v.string(),
  quantity: v.number(),
  variant: v.optional(cardVariant),
  cardName: v.optional(v.string()),
  setName: v.optional(v.string()),
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Log a real-life trade by updating collection and creating activity log.
 *
 * This mutation handles the complete trade flow:
 * 1. Removes cards given away from the user's collection
 * 2. Adds cards received to the user's collection
 * 3. Logs a single 'trade_logged' activity event with trade details
 *
 * @param profileId - The profile executing the trade
 * @param cardsGiven - Array of cards given away in the trade
 * @param cardsReceived - Array of cards received in the trade
 * @param tradingPartner - Optional name/description of trading partner (e.g., "brother", "friend at school")
 */
export const logTrade = mutation({
  args: {
    profileId: v.id('profiles'),
    cardsGiven: v.array(tradeCardEntry),
    cardsReceived: v.array(tradeCardEntry),
    tradingPartner: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { profileId, cardsGiven, cardsReceived, tradingPartner } = args;

    // Validate that the trade is not empty
    if (cardsGiven.length === 0 && cardsReceived.length === 0) {
      throw new Error('Trade must include at least one card given or received');
    }

    // Process cards given (remove from collection)
    for (const card of cardsGiven) {
      const variant = card.variant ?? 'normal';
      const quantity = card.quantity;

      // Find the existing collection entry for this card/variant
      const existing = await ctx.db
        .query('collectionCards')
        .withIndex('by_profile_card_variant', (q) =>
          q.eq('profileId', profileId).eq('cardId', card.cardId).eq('variant', variant)
        )
        .first();

      if (!existing) {
        throw new Error(
          `Cannot give card ${card.cardName ?? card.cardId}: not in collection with variant ${variant}`
        );
      }

      if (existing.quantity < quantity) {
        throw new Error(
          `Cannot give ${quantity} of card ${card.cardName ?? card.cardId}: only have ${existing.quantity} in collection`
        );
      }

      // Update or remove the collection entry
      if (existing.quantity === quantity) {
        // Remove entirely
        await ctx.db.delete(existing._id);
      } else {
        // Reduce quantity
        await ctx.db.patch(existing._id, {
          quantity: existing.quantity - quantity,
        });
      }
    }

    // Process cards received (add to collection)
    for (const card of cardsReceived) {
      const variant = card.variant ?? 'normal';
      const quantity = card.quantity;

      // Check if card with this variant already exists
      const existing = await ctx.db
        .query('collectionCards')
        .withIndex('by_profile_card_variant', (q) =>
          q.eq('profileId', profileId).eq('cardId', card.cardId).eq('variant', variant)
        )
        .first();

      if (existing) {
        // Update quantity
        await ctx.db.patch(existing._id, {
          quantity: existing.quantity + quantity,
        });
      } else {
        // Create new collection entry
        await ctx.db.insert('collectionCards', {
          profileId,
          cardId: card.cardId,
          variant,
          quantity,
        });
      }
    }

    // Log the trade activity
    const activityLogId = await ctx.db.insert('activityLogs', {
      profileId,
      action: 'trade_logged',
      metadata: {
        cardsGiven: cardsGiven.map((c) => ({
          cardId: c.cardId,
          cardName: c.cardName ?? c.cardId,
          quantity: c.quantity,
          variant: c.variant ?? 'normal',
          setName: c.setName,
        })),
        cardsReceived: cardsReceived.map((c) => ({
          cardId: c.cardId,
          cardName: c.cardName ?? c.cardId,
          quantity: c.quantity,
          variant: c.variant ?? 'normal',
          setName: c.setName,
        })),
        tradingPartner: tradingPartner ?? null,
        totalCardsGiven: cardsGiven.reduce((sum, c) => sum + c.quantity, 0),
        totalCardsReceived: cardsReceived.reduce((sum, c) => sum + c.quantity, 0),
      },
      timestamp: Date.now(),
    });

    return {
      success: true,
      activityLogId,
      summary: {
        cardsGivenCount: cardsGiven.reduce((sum, c) => sum + c.quantity, 0),
        cardsReceivedCount: cardsReceived.reduce((sum, c) => sum + c.quantity, 0),
        tradingPartner: tradingPartner ?? null,
      },
    };
  },
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get trade history for a profile.
 * Returns all 'trade_logged' activity events sorted by date (newest first).
 */
export const getTradeHistory = query({
  args: {
    profileId: v.id('profiles'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Query activity logs for trade_logged events
    const tradeLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile_and_action', (q) =>
        q.eq('profileId', args.profileId).eq('action', 'trade_logged')
      )
      .order('desc')
      .take(limit);

    return tradeLogs.map((log) => {
      const metadata = log.metadata as {
        cardsGiven?: Array<{
          cardId: string;
          cardName: string;
          quantity: number;
          variant: string;
          setName?: string;
        }>;
        cardsReceived?: Array<{
          cardId: string;
          cardName: string;
          quantity: number;
          variant: string;
          setName?: string;
        }>;
        tradingPartner?: string | null;
        totalCardsGiven?: number;
        totalCardsReceived?: number;
      };

      return {
        _id: log._id,
        timestamp: log.timestamp ?? log._creationTime,
        cardsGiven: metadata?.cardsGiven ?? [],
        cardsReceived: metadata?.cardsReceived ?? [],
        tradingPartner: metadata?.tradingPartner ?? null,
        totalCardsGiven: metadata?.totalCardsGiven ?? 0,
        totalCardsReceived: metadata?.totalCardsReceived ?? 0,
      };
    });
  },
});

/**
 * Get trade statistics for a profile.
 */
export const getTradeStats = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Query all trade_logged events
    const tradeLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile_and_action', (q) =>
        q.eq('profileId', args.profileId).eq('action', 'trade_logged')
      )
      .collect();

    let totalCardsGiven = 0;
    let totalCardsReceived = 0;
    const tradingPartners = new Set<string>();

    for (const log of tradeLogs) {
      const metadata = log.metadata as {
        totalCardsGiven?: number;
        totalCardsReceived?: number;
        tradingPartner?: string | null;
      };

      totalCardsGiven += metadata?.totalCardsGiven ?? 0;
      totalCardsReceived += metadata?.totalCardsReceived ?? 0;

      if (metadata?.tradingPartner) {
        tradingPartners.add(metadata.tradingPartner);
      }
    }

    return {
      totalTrades: tradeLogs.length,
      totalCardsGiven,
      totalCardsReceived,
      netCardsChange: totalCardsReceived - totalCardsGiven,
      uniqueTradingPartners: tradingPartners.size,
    };
  },
});
