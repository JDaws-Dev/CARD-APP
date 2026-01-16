import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// QUERIES
// ============================================================================

export const getWishlist = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("wishlistCards")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();
  },
});

export const isOnWishlist = query({
  args: { profileId: v.id("profiles"), cardId: v.string() },
  handler: async (ctx, args) => {
    const card = await ctx.db
      .query("wishlistCards")
      .withIndex("by_profile_and_card", (q) =>
        q.eq("profileId", args.profileId).eq("cardId", args.cardId)
      )
      .first();

    return card ? { onWishlist: true, isPriority: card.isPriority } : { onWishlist: false, isPriority: false };
  },
});

export const getWishlistByToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    // Find the share link
    const share = await ctx.db
      .query("wishlistShares")
      .withIndex("by_token", (q) => q.eq("shareToken", args.shareToken))
      .first();

    if (!share) {
      return null;
    }

    // Check if expired
    if (share.expiresAt && share.expiresAt < Date.now()) {
      return null;
    }

    // Get the profile info
    const profile = await ctx.db.get(share.profileId);
    if (!profile) {
      return null;
    }

    // Get the wishlist
    const wishlist = await ctx.db
      .query("wishlistCards")
      .withIndex("by_profile", (q) => q.eq("profileId", share.profileId))
      .collect();

    return {
      profileName: profile.displayName,
      wishlist,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

export const addToWishlist = mutation({
  args: {
    profileId: v.id("profiles"),
    cardId: v.string(),
    isPriority: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if already on wishlist
    const existing = await ctx.db
      .query("wishlistCards")
      .withIndex("by_profile_and_card", (q) =>
        q.eq("profileId", args.profileId).eq("cardId", args.cardId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("wishlistCards", {
      profileId: args.profileId,
      cardId: args.cardId,
      isPriority: args.isPriority ?? false,
    });
  },
});

export const removeFromWishlist = mutation({
  args: {
    profileId: v.id("profiles"),
    cardId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("wishlistCards")
      .withIndex("by_profile_and_card", (q) =>
        q.eq("profileId", args.profileId).eq("cardId", args.cardId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const togglePriority = mutation({
  args: {
    profileId: v.id("profiles"),
    cardId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("wishlistCards")
      .withIndex("by_profile_and_card", (q) =>
        q.eq("profileId", args.profileId).eq("cardId", args.cardId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { isPriority: !existing.isPriority });
    }
  },
});

export const createShareLink = mutation({
  args: {
    profileId: v.id("profiles"),
    expiresInDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Generate a random token
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let token = "";
    for (let i = 0; i < 12; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const expiresAt = args.expiresInDays
      ? Date.now() + args.expiresInDays * 24 * 60 * 60 * 1000
      : undefined;

    await ctx.db.insert("wishlistShares", {
      profileId: args.profileId,
      shareToken: token,
      expiresAt,
    });

    return token;
  },
});
