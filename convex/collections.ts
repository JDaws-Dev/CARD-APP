import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// QUERIES
// ============================================================================

export const getCollection = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("collectionCards")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();
  },
});

export const getCollectionBySet = query({
  args: { profileId: v.id("profiles"), setId: v.string() },
  handler: async (ctx, args) => {
    const allCards = await ctx.db
      .query("collectionCards")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();

    // Filter by set (cardId format is "setId-number")
    return allCards.filter((card) => card.cardId.startsWith(args.setId + "-"));
  },
});

export const getCollectionStats = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query("collectionCards")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();

    const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
    const uniqueCards = cards.length;

    // Count unique sets
    const sets = new Set(cards.map((card) => card.cardId.split("-")[0]));

    return {
      totalCards,
      uniqueCards,
      setsStarted: sets.size,
    };
  },
});

export const isCardOwned = query({
  args: { profileId: v.id("profiles"), cardId: v.string() },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("collectionCards")
      .withIndex("by_profile_and_card", (q) =>
        q.eq("profileId", args.profileId).eq("cardId", args.cardId)
      )
      .first();

    return card ? { owned: true, quantity: card.quantity } : { owned: false, quantity: 0 };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

export const addCard = mutation({
  args: {
    profileId: v.id("profiles"),
    cardId: v.string(),
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const quantity = args.quantity ?? 1;

    // Check if card already exists
    const existing = await ctx.db
      .query("collectionCards")
      .withIndex("by_profile_and_card", (q) =>
        q.eq("profileId", args.profileId).eq("cardId", args.cardId)
      )
      .first();

    if (existing) {
      // Update quantity
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + quantity,
      });
      return existing._id;
    }

    // Create new card entry
    const cardId = await ctx.db.insert("collectionCards", {
      profileId: args.profileId,
      cardId: args.cardId,
      quantity,
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      profileId: args.profileId,
      action: "card_added",
      metadata: { cardId: args.cardId, quantity },
    });

    return cardId;
  },
});

export const removeCard = mutation({
  args: {
    profileId: v.id("profiles"),
    cardId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("collectionCards")
      .withIndex("by_profile_and_card", (q) =>
        q.eq("profileId", args.profileId).eq("cardId", args.cardId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);

      // Log activity
      await ctx.db.insert("activityLogs", {
        profileId: args.profileId,
        action: "card_removed",
        metadata: { cardId: args.cardId },
      });
    }
  },
});

export const updateQuantity = mutation({
  args: {
    profileId: v.id("profiles"),
    cardId: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("collectionCards")
      .withIndex("by_profile_and_card", (q) =>
        q.eq("profileId", args.profileId).eq("cardId", args.cardId)
      )
      .first();

    if (!existing) {
      throw new Error("Card not found in collection");
    }

    if (args.quantity <= 0) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.patch(existing._id, { quantity: args.quantity });
    }
  },
});
