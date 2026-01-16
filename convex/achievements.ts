import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

export const ACHIEVEMENT_DEFINITIONS = {
  // Set Completion
  set_explorer: { type: "set_completion", name: "Set Explorer", description: "Collect 25% of a set", threshold: 25 },
  set_adventurer: { type: "set_completion", name: "Set Adventurer", description: "Collect 50% of a set", threshold: 50 },
  set_master: { type: "set_completion", name: "Set Master", description: "Collect 75% of a set", threshold: 75 },
  set_champion: { type: "set_completion", name: "Set Champion", description: "Complete a set 100%", threshold: 100 },

  // Collector Milestones
  first_catch: { type: "collector_milestone", name: "First Catch", description: "Add your first card", threshold: 1 },
  starter_collector: { type: "collector_milestone", name: "Starter Collector", description: "Collect 10 cards", threshold: 10 },
  rising_trainer: { type: "collector_milestone", name: "Rising Trainer", description: "Collect 50 cards", threshold: 50 },
  pokemon_trainer: { type: "collector_milestone", name: "Pokemon Trainer", description: "Collect 100 cards", threshold: 100 },
  elite_collector: { type: "collector_milestone", name: "Elite Collector", description: "Collect 250 cards", threshold: 250 },
  pokemon_master: { type: "collector_milestone", name: "Pokemon Master", description: "Collect 500 cards", threshold: 500 },
  legendary_collector: { type: "collector_milestone", name: "Legendary Collector", description: "Collect 1000 cards", threshold: 1000 },

  // Type Specialists
  fire_trainer: { type: "type_specialist", name: "Fire Trainer", description: "Collect 10+ Fire-type cards", threshold: 10 },
  water_trainer: { type: "type_specialist", name: "Water Trainer", description: "Collect 10+ Water-type cards", threshold: 10 },
  grass_trainer: { type: "type_specialist", name: "Grass Trainer", description: "Collect 10+ Grass-type cards", threshold: 10 },
  electric_trainer: { type: "type_specialist", name: "Electric Trainer", description: "Collect 10+ Electric-type cards", threshold: 10 },
  psychic_trainer: { type: "type_specialist", name: "Psychic Trainer", description: "Collect 10+ Psychic-type cards", threshold: 10 },
  dragon_trainer: { type: "type_specialist", name: "Dragon Trainer", description: "Collect 10+ Dragon-type cards", threshold: 10 },

  // Pokemon Fan
  pikachu_fan: { type: "pokemon_fan", name: "Pikachu Fan", description: "Collect 5+ Pikachu cards", threshold: 5 },
  eevee_fan: { type: "pokemon_fan", name: "Eevee Fan", description: "Collect 5+ Eevee/Eeveelution cards", threshold: 5 },
  charizard_fan: { type: "pokemon_fan", name: "Charizard Fan", description: "Collect 3+ Charizard cards", threshold: 3 },

  // Streaks
  streak_3: { type: "streak", name: "3-Day Streak", description: "Add cards 3 days in a row", threshold: 3 },
  streak_7: { type: "streak", name: "Week Warrior", description: "Add cards 7 days in a row", threshold: 7 },
  streak_14: { type: "streak", name: "Dedicated Collector", description: "Add cards 14 days in a row", threshold: 14 },
  streak_30: { type: "streak", name: "Monthly Master", description: "Add cards 30 days in a row", threshold: 30 },
} as const;

// ============================================================================
// QUERIES
// ============================================================================

export const getAchievements = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("achievements")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();
  },
});

export const hasAchievement = query({
  args: { profileId: v.id("profiles"), achievementKey: v.string() },
  handler: async (ctx, args) => {
    const achievement = await ctx.db
      .query("achievements")
      .withIndex("by_profile_and_key", (q) =>
        q.eq("profileId", args.profileId).eq("achievementKey", args.achievementKey)
      )
      .first();

    return !!achievement;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

export const awardAchievement = mutation({
  args: {
    profileId: v.id("profiles"),
    achievementType: v.union(
      v.literal("set_completion"),
      v.literal("collector_milestone"),
      v.literal("type_specialist"),
      v.literal("pokemon_fan"),
      v.literal("streak")
    ),
    achievementKey: v.string(),
    achievementData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if already earned
    const existing = await ctx.db
      .query("achievements")
      .withIndex("by_profile_and_key", (q) =>
        q.eq("profileId", args.profileId).eq("achievementKey", args.achievementKey)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Award the achievement
    const achievementId = await ctx.db.insert("achievements", {
      profileId: args.profileId,
      achievementType: args.achievementType,
      achievementKey: args.achievementKey,
      achievementData: args.achievementData,
      earnedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activityLogs", {
      profileId: args.profileId,
      action: "achievement_earned",
      metadata: { achievementKey: args.achievementKey },
    });

    return achievementId;
  },
});

// Check and award milestone achievements based on total cards
export const checkMilestoneAchievements = mutation({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    // Get total unique cards
    const cards = await ctx.db
      .query("collectionCards")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .collect();

    const totalCards = cards.length;
    const awarded: string[] = [];

    // Check each milestone
    const milestones = [
      { key: "first_catch", threshold: 1 },
      { key: "starter_collector", threshold: 10 },
      { key: "rising_trainer", threshold: 50 },
      { key: "pokemon_trainer", threshold: 100 },
      { key: "elite_collector", threshold: 250 },
      { key: "pokemon_master", threshold: 500 },
      { key: "legendary_collector", threshold: 1000 },
    ];

    for (const milestone of milestones) {
      if (totalCards >= milestone.threshold) {
        const existing = await ctx.db
          .query("achievements")
          .withIndex("by_profile_and_key", (q) =>
            q.eq("profileId", args.profileId).eq("achievementKey", milestone.key)
          )
          .first();

        if (!existing) {
          await ctx.db.insert("achievements", {
            profileId: args.profileId,
            achievementType: "collector_milestone",
            achievementKey: milestone.key,
            achievementData: { totalCards },
            earnedAt: Date.now(),
          });
          awarded.push(milestone.key);
        }
      }
    }

    return awarded;
  },
});
