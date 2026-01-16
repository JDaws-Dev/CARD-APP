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

// ============================================================================
// KID DASHBOARD STATS
// ============================================================================

/**
 * Get dashboard stats for a kid profile.
 * Returns collection count, badge count, current streak, and recent activity.
 * This is designed for the kid dashboard to show at-a-glance stats.
 */
export const getKidDashboardStats = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    // Get profile info
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return null;
    }

    // Get collection stats
    const collectionCards = await ctx.db
      .query("collectionCards")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();

    const uniqueCardIds = new Set(collectionCards.map((c) => c.cardId));
    const totalCards = collectionCards.reduce((sum, c) => sum + c.quantity, 0);
    const uniqueCards = uniqueCardIds.size;
    const setsStarted = new Set(
      collectionCards.map((c) => c.cardId.split("-")[0])
    ).size;

    // Get badge/achievement count
    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();

    const badgeCount = achievements.length;

    // Calculate current streak from activity logs
    const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
    const activityLogs = await ctx.db
      .query("activityLogs")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();

    // Filter to card_added actions in the date range
    const recentCardAdds = activityLogs.filter(
      (log) => log._creationTime >= sixtyDaysAgo && log.action === "card_added"
    );

    // Extract unique dates (YYYY-MM-DD format)
    const uniqueDates = new Set<string>();
    for (const log of recentCardAdds) {
      const date = new Date(log._creationTime);
      const dateStr = date.toISOString().split("T")[0];
      uniqueDates.add(dateStr);
    }

    const activityDates = Array.from(uniqueDates).sort();
    const streakInfo = calculateStreakFromDates(activityDates);

    // Get recent activity (last 10 items)
    const recentActivity = activityLogs
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 10);

    // Enrich recent activity with card names
    const cardIdsToLookup = new Set<string>();
    for (const log of recentActivity) {
      if (log.action === "card_added" || log.action === "card_removed") {
        const metadata = log.metadata as
          | { cardId?: string; cardName?: string }
          | undefined;
        if (metadata?.cardId && !metadata?.cardName) {
          cardIdsToLookup.add(metadata.cardId);
        }
      }
    }

    const cardNameMap = new Map<string, string>();
    if (cardIdsToLookup.size > 0) {
      const cardLookups = await Promise.all(
        Array.from(cardIdsToLookup).map((cardId) =>
          ctx.db
            .query("cachedCards")
            .withIndex("by_card_id", (q) => q.eq("cardId", cardId))
            .first()
        )
      );

      for (const card of cardLookups) {
        if (card) {
          cardNameMap.set(card.cardId, card.name);
        }
      }
    }

    const enrichedRecentActivity = recentActivity.map((log) => {
      const metadata = log.metadata as
        | { cardId?: string; cardName?: string; [key: string]: unknown }
        | undefined;

      let displayText = "";
      let icon = "";

      if (log.action === "card_added") {
        const cardName =
          metadata?.cardName ?? cardNameMap.get(metadata?.cardId ?? "") ?? metadata?.cardId ?? "a card";
        displayText = `Added ${cardName}`;
        icon = "➕";
      } else if (log.action === "card_removed") {
        const cardName =
          metadata?.cardName ?? cardNameMap.get(metadata?.cardId ?? "") ?? metadata?.cardId ?? "a card";
        displayText = `Removed ${cardName}`;
        icon = "➖";
      } else if (log.action === "achievement_earned") {
        const achievementName =
          (metadata?.achievementName as string) ?? metadata?.achievementKey ?? "an achievement";
        displayText = `Earned ${achievementName}`;
        icon = "🏆";
      }

      return {
        id: log._id,
        action: log.action,
        displayText,
        icon,
        timestamp: log._creationTime,
        relativeTime: formatRelativeTime(log._creationTime),
      };
    });

    return {
      profile: {
        id: profile._id,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      },
      collection: {
        uniqueCards,
        totalCards,
        setsStarted,
      },
      badges: {
        total: badgeCount,
        recentlyEarned: achievements
          .filter((a) => a.earnedAt > Date.now() - 7 * 24 * 60 * 60 * 1000)
          .length,
      },
      streak: {
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
        isActiveToday: streakInfo.isActiveToday,
        lastActiveDate: streakInfo.lastActiveDate,
      },
      recentActivity: enrichedRecentActivity,
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate streak from activity dates.
 * Dates should be in YYYY-MM-DD format.
 */
function calculateStreakFromDates(activityDates: string[]): {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  lastActiveDate: string | null;
} {
  if (activityDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isActiveToday: false,
      lastActiveDate: null,
    };
  }

  // Sort dates in descending order (most recent first)
  const sortedDates = [...activityDates].sort((a, b) => b.localeCompare(a));
  const today = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterday = yesterdayDate.toISOString().split("T")[0];

  const isActiveToday = sortedDates[0] === today;
  const lastActiveDate = sortedDates[0];

  // Helper to check if two dates are consecutive
  function areConsecutive(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffMs = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = diffMs / (24 * 60 * 60 * 1000);
    return diffDays === 1;
  }

  // Calculate current streak (only if active today or yesterday)
  let currentStreak = 0;
  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      if (areConsecutive(sortedDates[i], sortedDates[i - 1])) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak (looking at all dates in ascending order)
  const ascendingDates = [...activityDates].sort();
  let longestStreak = ascendingDates.length > 0 ? 1 : 0;
  let currentRun = 1;

  for (let i = 1; i < ascendingDates.length; i++) {
    if (areConsecutive(ascendingDates[i - 1], ascendingDates[i])) {
      currentRun++;
      longestStreak = Math.max(longestStreak, currentRun);
    } else {
      currentRun = 1;
    }
  }

  return {
    currentStreak,
    longestStreak,
    isActiveToday,
    lastActiveDate,
  };
}

/**
 * Format a timestamp as a relative string (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  } else if (hours > 0) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  } else if (minutes > 0) {
    return minutes === 1 ? "1 min ago" : `${minutes} mins ago`;
  } else {
    return "Just now";
  }
}
