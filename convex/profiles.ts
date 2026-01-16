import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// QUERIES
// ============================================================================

export const getProfile = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.profileId);
  },
});

export const getProfilesByFamily = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();
  },
});

export const getFamily = query({
  args: { familyId: v.id("families") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.familyId);
  },
});

export const getFamilyByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("families")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

export const createFamily = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if family already exists
    const existing = await ctx.db
      .query("families")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existing) {
      throw new Error("A family with this email already exists");
    }

    return await ctx.db.insert("families", {
      email: args.email.toLowerCase(),
      subscriptionTier: "free",
    });
  },
});

export const createProfile = mutation({
  args: {
    familyId: v.id("families"),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check profile limit (max 4 per family)
    const existingProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    if (existingProfiles.length >= 4) {
      throw new Error("Maximum of 4 profiles per family");
    }

    return await ctx.db.insert("profiles", {
      familyId: args.familyId,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
    });
  },
});

export const updateProfile = mutation({
  args: {
    profileId: v.id("profiles"),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: { displayName?: string; avatarUrl?: string } = {};

    if (args.displayName !== undefined) {
      updates.displayName = args.displayName;
    }
    if (args.avatarUrl !== undefined) {
      updates.avatarUrl = args.avatarUrl;
    }

    await ctx.db.patch(args.profileId, updates);
  },
});

export const deleteProfile = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    // Delete all related data first
    const collections = await ctx.db
      .query("collectionCards")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();

    for (const card of collections) {
      await ctx.db.delete(card._id);
    }

    const wishlist = await ctx.db
      .query("wishlistCards")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();

    for (const card of wishlist) {
      await ctx.db.delete(card._id);
    }

    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();

    for (const achievement of achievements) {
      await ctx.db.delete(achievement._id);
    }

    const shares = await ctx.db
      .query("wishlistShares")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();

    for (const share of shares) {
      await ctx.db.delete(share._id);
    }

    // Finally delete the profile
    await ctx.db.delete(args.profileId);
  },
});

export const updateSubscription = mutation({
  args: {
    familyId: v.id("families"),
    tier: v.union(v.literal("free"), v.literal("family")),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.familyId, {
      subscriptionTier: args.tier,
      subscriptionExpiresAt: args.expiresAt,
    });
  },
});

/**
 * Get or create a demo profile for testing without authentication.
 * Uses a fixed demo email to ensure the same profile is returned.
 */
export const getOrCreateDemoProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const demoEmail = "demo@kidcollect.app";

    // Check if demo family exists
    let family = await ctx.db
      .query("families")
      .withIndex("by_email", (q) => q.eq("email", demoEmail))
      .first();

    // Create demo family if it doesn't exist
    if (!family) {
      const familyId = await ctx.db.insert("families", {
        email: demoEmail,
        subscriptionTier: "family", // Give demo user full access
      });
      family = await ctx.db.get(familyId);
    }

    if (!family) {
      throw new Error("Failed to create demo family");
    }

    // Check if demo profile exists
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_family", (q) => q.eq("familyId", family._id))
      .first();

    // Create demo profile if it doesn't exist
    if (!profile) {
      const profileId = await ctx.db.insert("profiles", {
        familyId: family._id,
        displayName: "Demo Collector",
        avatarUrl: undefined,
      });
      profile = await ctx.db.get(profileId);
    }

    return profile;
  },
});
