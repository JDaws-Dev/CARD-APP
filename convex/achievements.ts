import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// ============================================================================
// ACHIEVEMENT TYPE DEFINITIONS
// ============================================================================

export type AchievementCategory =
  | 'set_completion'
  | 'collector_milestone'
  | 'type_specialist'
  | 'pokemon_fan'
  | 'streak';

export interface BadgeDefinition {
  type: AchievementCategory;
  name: string;
  description: string;
  threshold: number;
  icon: string;
  color: string;
}

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

export const ACHIEVEMENT_DEFINITIONS: Record<string, BadgeDefinition> = {
  // Set Completion Badges
  set_explorer: {
    type: 'set_completion',
    name: 'Set Explorer',
    description: 'Collect 25% of a set',
    threshold: 25,
    icon: '🗺️',
    color: '#78C850', // Green
  },
  set_adventurer: {
    type: 'set_completion',
    name: 'Set Adventurer',
    description: 'Collect 50% of a set',
    threshold: 50,
    icon: '🎒',
    color: '#6890F0', // Blue
  },
  set_master: {
    type: 'set_completion',
    name: 'Set Master',
    description: 'Collect 75% of a set',
    threshold: 75,
    icon: '🏅',
    color: '#A040A0', // Purple
  },
  set_champion: {
    type: 'set_completion',
    name: 'Set Champion',
    description: 'Complete a set 100%',
    threshold: 100,
    icon: '🏆',
    color: '#F8D030', // Gold
  },

  // Collector Milestone Badges
  first_catch: {
    type: 'collector_milestone',
    name: 'First Catch',
    description: 'Add your first card',
    threshold: 1,
    icon: '🎯',
    color: '#A8A878', // Normal gray
  },
  starter_collector: {
    type: 'collector_milestone',
    name: 'Starter Collector',
    description: 'Collect 10 cards',
    threshold: 10,
    icon: '⭐',
    color: '#78C850', // Green
  },
  rising_trainer: {
    type: 'collector_milestone',
    name: 'Rising Trainer',
    description: 'Collect 50 cards',
    threshold: 50,
    icon: '🌟',
    color: '#6890F0', // Blue
  },
  pokemon_trainer: {
    type: 'collector_milestone',
    name: 'Pokemon Trainer',
    description: 'Collect 100 cards',
    threshold: 100,
    icon: '💫',
    color: '#A040A0', // Purple
  },
  elite_collector: {
    type: 'collector_milestone',
    name: 'Elite Collector',
    description: 'Collect 250 cards',
    threshold: 250,
    icon: '🎖️',
    color: '#F08030', // Orange
  },
  pokemon_master: {
    type: 'collector_milestone',
    name: 'Pokemon Master',
    description: 'Collect 500 cards',
    threshold: 500,
    icon: '👑',
    color: '#F8D030', // Gold
  },
  legendary_collector: {
    type: 'collector_milestone',
    name: 'Legendary Collector',
    description: 'Collect 1000 cards',
    threshold: 1000,
    icon: '🌈',
    color: '#7038F8', // Dragon purple
  },

  // Type Specialist Badges
  fire_trainer: {
    type: 'type_specialist',
    name: 'Fire Trainer',
    description: 'Collect 10+ Fire-type cards',
    threshold: 10,
    icon: '🔥',
    color: '#F08030', // Fire orange
  },
  water_trainer: {
    type: 'type_specialist',
    name: 'Water Trainer',
    description: 'Collect 10+ Water-type cards',
    threshold: 10,
    icon: '💧',
    color: '#6890F0', // Water blue
  },
  grass_trainer: {
    type: 'type_specialist',
    name: 'Grass Trainer',
    description: 'Collect 10+ Grass-type cards',
    threshold: 10,
    icon: '🌿',
    color: '#78C850', // Grass green
  },
  electric_trainer: {
    type: 'type_specialist',
    name: 'Electric Trainer',
    description: 'Collect 10+ Electric-type cards',
    threshold: 10,
    icon: '⚡',
    color: '#F8D030', // Electric yellow
  },
  psychic_trainer: {
    type: 'type_specialist',
    name: 'Psychic Trainer',
    description: 'Collect 10+ Psychic-type cards',
    threshold: 10,
    icon: '🔮',
    color: '#F85888', // Psychic pink
  },
  fighting_trainer: {
    type: 'type_specialist',
    name: 'Fighting Trainer',
    description: 'Collect 10+ Fighting-type cards',
    threshold: 10,
    icon: '🥊',
    color: '#C03028', // Fighting red
  },
  darkness_trainer: {
    type: 'type_specialist',
    name: 'Darkness Trainer',
    description: 'Collect 10+ Darkness-type cards',
    threshold: 10,
    icon: '🌑',
    color: '#705848', // Dark brown
  },
  metal_trainer: {
    type: 'type_specialist',
    name: 'Metal Trainer',
    description: 'Collect 10+ Metal-type cards',
    threshold: 10,
    icon: '⚙️',
    color: '#B8B8D0', // Steel gray
  },
  dragon_trainer: {
    type: 'type_specialist',
    name: 'Dragon Trainer',
    description: 'Collect 10+ Dragon-type cards',
    threshold: 10,
    icon: '🐉',
    color: '#7038F8', // Dragon purple
  },
  fairy_trainer: {
    type: 'type_specialist',
    name: 'Fairy Trainer',
    description: 'Collect 10+ Fairy-type cards',
    threshold: 10,
    icon: '🧚',
    color: '#EE99AC', // Fairy pink
  },
  colorless_trainer: {
    type: 'type_specialist',
    name: 'Colorless Trainer',
    description: 'Collect 10+ Colorless-type cards',
    threshold: 10,
    icon: '⚪',
    color: '#A8A878', // Normal gray
  },

  // Pokemon Fan Badges
  pikachu_fan: {
    type: 'pokemon_fan',
    name: 'Pikachu Fan',
    description: 'Collect 5+ Pikachu cards',
    threshold: 5,
    icon: '⚡',
    color: '#F8D030', // Electric yellow
  },
  eevee_fan: {
    type: 'pokemon_fan',
    name: 'Eevee Fan',
    description: 'Collect 5+ Eevee/Eeveelution cards',
    threshold: 5,
    icon: '🦊',
    color: '#A8A878', // Normal gray
  },
  charizard_fan: {
    type: 'pokemon_fan',
    name: 'Charizard Fan',
    description: 'Collect 3+ Charizard cards',
    threshold: 3,
    icon: '🔥',
    color: '#F08030', // Fire orange
  },
  mewtwo_fan: {
    type: 'pokemon_fan',
    name: 'Mewtwo Fan',
    description: 'Collect 3+ Mewtwo cards',
    threshold: 3,
    icon: '🔮',
    color: '#F85888', // Psychic pink
  },
  legendary_fan: {
    type: 'pokemon_fan',
    name: 'Legendary Fan',
    description: 'Collect 10+ Legendary Pokemon cards',
    threshold: 10,
    icon: '✨',
    color: '#7038F8', // Dragon purple
  },

  // Streak Badges
  streak_3: {
    type: 'streak',
    name: '3-Day Streak',
    description: 'Add cards 3 days in a row',
    threshold: 3,
    icon: '🔥',
    color: '#F08030', // Orange
  },
  streak_7: {
    type: 'streak',
    name: 'Week Warrior',
    description: 'Add cards 7 days in a row',
    threshold: 7,
    icon: '📅',
    color: '#6890F0', // Blue
  },
  streak_14: {
    type: 'streak',
    name: 'Dedicated Collector',
    description: 'Add cards 14 days in a row',
    threshold: 14,
    icon: '💪',
    color: '#A040A0', // Purple
  },
  streak_30: {
    type: 'streak',
    name: 'Monthly Master',
    description: 'Add cards 30 days in a row',
    threshold: 30,
    icon: '🏆',
    color: '#F8D030', // Gold
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all badge definitions for a specific category
 */
export function getBadgesByCategory(category: AchievementCategory): BadgeDefinition[] {
  return Object.values(ACHIEVEMENT_DEFINITIONS).filter((badge) => badge.type === category);
}

/**
 * Get a specific badge definition by key
 */
export function getBadgeDefinition(key: string): BadgeDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS[key];
}

/**
 * Get all badge keys for a specific category
 */
export function getBadgeKeysByCategory(category: AchievementCategory): string[] {
  return Object.entries(ACHIEVEMENT_DEFINITIONS)
    .filter(([, badge]) => badge.type === category)
    .map(([key]) => key);
}

/**
 * Get the milestone badges sorted by threshold
 */
export function getMilestoneBadges(): Array<{ key: string } & BadgeDefinition> {
  return Object.entries(ACHIEVEMENT_DEFINITIONS)
    .filter(([, badge]) => badge.type === 'collector_milestone')
    .map(([key, badge]) => ({ key, ...badge }))
    .sort((a, b) => a.threshold - b.threshold);
}

/**
 * Get the set completion badges sorted by threshold
 */
export function getSetCompletionBadges(): Array<{ key: string } & BadgeDefinition> {
  return Object.entries(ACHIEVEMENT_DEFINITIONS)
    .filter(([, badge]) => badge.type === 'set_completion')
    .map(([key, badge]) => ({ key, ...badge }))
    .sort((a, b) => a.threshold - b.threshold);
}

/**
 * Get the type specialist badge key for a given Pokemon card type
 */
export function getTypeSpecialistKey(pokemonType: string): string | undefined {
  const typeMap: Record<string, string> = {
    Fire: 'fire_trainer',
    Water: 'water_trainer',
    Grass: 'grass_trainer',
    Lightning: 'electric_trainer',
    Psychic: 'psychic_trainer',
    Fighting: 'fighting_trainer',
    Darkness: 'darkness_trainer',
    Metal: 'metal_trainer',
    Dragon: 'dragon_trainer',
    Fairy: 'fairy_trainer',
    Colorless: 'colorless_trainer',
  };
  return typeMap[pokemonType];
}

/**
 * Get all Pokemon types that have associated badges
 */
export function getTypesWithBadges(): string[] {
  return [
    'Fire',
    'Water',
    'Grass',
    'Lightning',
    'Psychic',
    'Fighting',
    'Darkness',
    'Metal',
    'Dragon',
    'Fairy',
    'Colorless',
  ];
}

// ============================================================================
// QUERIES
// ============================================================================

export const getAchievements = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();
  },
});

export const hasAchievement = query({
  args: { profileId: v.id('profiles'), achievementKey: v.string() },
  handler: async (ctx, args) => {
    const achievement = await ctx.db
      .query('achievements')
      .withIndex('by_profile_and_key', (q) =>
        q.eq('profileId', args.profileId).eq('achievementKey', args.achievementKey)
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
    profileId: v.id('profiles'),
    achievementType: v.union(
      v.literal('set_completion'),
      v.literal('collector_milestone'),
      v.literal('type_specialist'),
      v.literal('pokemon_fan'),
      v.literal('streak')
    ),
    achievementKey: v.string(),
    achievementData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if already earned
    const existing = await ctx.db
      .query('achievements')
      .withIndex('by_profile_and_key', (q) =>
        q.eq('profileId', args.profileId).eq('achievementKey', args.achievementKey)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Award the achievement
    const achievementId = await ctx.db.insert('achievements', {
      profileId: args.profileId,
      achievementType: args.achievementType,
      achievementKey: args.achievementKey,
      achievementData: args.achievementData,
      earnedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert('activityLogs', {
      profileId: args.profileId,
      action: 'achievement_earned',
      metadata: { achievementKey: args.achievementKey },
    });

    return achievementId;
  },
});

// Milestone badge thresholds
const MILESTONE_BADGES = [
  { key: 'first_catch', threshold: 1, name: 'First Catch' },
  { key: 'starter_collector', threshold: 10, name: 'Starter Collector' },
  { key: 'rising_trainer', threshold: 50, name: 'Rising Trainer' },
  { key: 'pokemon_trainer', threshold: 100, name: 'Pokemon Trainer' },
  { key: 'elite_collector', threshold: 250, name: 'Elite Collector' },
  { key: 'pokemon_master', threshold: 500, name: 'Pokemon Master' },
  { key: 'legendary_collector', threshold: 1000, name: 'Legendary Collector' },
] as const;

// Check and award milestone achievements based on total cards
export const checkMilestoneAchievements = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get total unique cards (count unique cardIds, regardless of variant)
    const cards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Count unique cardIds
    const uniqueCardIds = new Set(cards.map((c) => c.cardId));
    const totalUniqueCards = uniqueCardIds.size;

    const awarded: string[] = [];

    // Check each milestone
    for (const milestone of MILESTONE_BADGES) {
      if (totalUniqueCards >= milestone.threshold) {
        const existing = await ctx.db
          .query('achievements')
          .withIndex('by_profile_and_key', (q) =>
            q.eq('profileId', args.profileId).eq('achievementKey', milestone.key)
          )
          .first();

        if (!existing) {
          await ctx.db.insert('achievements', {
            profileId: args.profileId,
            achievementType: 'collector_milestone',
            achievementKey: milestone.key,
            achievementData: { totalCards: totalUniqueCards, threshold: milestone.threshold },
            earnedAt: Date.now(),
          });

          // Log activity for achievement earned
          await ctx.db.insert('activityLogs', {
            profileId: args.profileId,
            action: 'achievement_earned',
            metadata: {
              achievementKey: milestone.key,
              achievementName: milestone.name,
              achievementType: 'collector_milestone',
              totalCards: totalUniqueCards,
              threshold: milestone.threshold,
            },
          });

          awarded.push(milestone.key);
        }
      }
    }

    // Calculate next milestone for return value
    const nextMilestone = MILESTONE_BADGES.find((m) => totalUniqueCards < m.threshold);

    return {
      awarded,
      totalUniqueCards,
      nextMilestone: nextMilestone
        ? {
            key: nextMilestone.key,
            name: nextMilestone.name,
            threshold: nextMilestone.threshold,
            cardsNeeded: nextMilestone.threshold - totalUniqueCards,
          }
        : null,
    };
  },
});

// Query to get milestone progress for a profile (for UI display)
export const getMilestoneProgress = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get total unique cards
    const cards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Count unique cardIds
    const uniqueCardIds = new Set(cards.map((c) => c.cardId));
    const totalUniqueCards = uniqueCardIds.size;

    // Get earned milestone achievements
    const earnedMilestones = await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .filter((q) => q.eq(q.field('achievementType'), 'collector_milestone'))
      .collect();

    const earnedKeys = new Set(earnedMilestones.map((a) => a.achievementKey));

    // Build milestone progress list
    const milestoneProgress = MILESTONE_BADGES.map((milestone) => {
      const earned = earnedKeys.has(milestone.key);
      const earnedAchievement = earned
        ? earnedMilestones.find((a) => a.achievementKey === milestone.key)
        : null;

      return {
        key: milestone.key,
        name: milestone.name,
        threshold: milestone.threshold,
        earned,
        earnedAt: earnedAchievement?.earnedAt ?? null,
        progress: Math.min(100, Math.round((totalUniqueCards / milestone.threshold) * 100)),
        cardsNeeded: earned ? 0 : Math.max(0, milestone.threshold - totalUniqueCards),
      };
    });

    // Find current and next milestone
    const currentMilestone = [...MILESTONE_BADGES]
      .reverse()
      .find((m) => totalUniqueCards >= m.threshold);
    const nextMilestone = MILESTONE_BADGES.find((m) => totalUniqueCards < m.threshold);

    return {
      totalUniqueCards,
      milestones: milestoneProgress,
      currentMilestone: currentMilestone
        ? { key: currentMilestone.key, name: currentMilestone.name, threshold: currentMilestone.threshold }
        : null,
      nextMilestone: nextMilestone
        ? {
            key: nextMilestone.key,
            name: nextMilestone.name,
            threshold: nextMilestone.threshold,
            cardsNeeded: nextMilestone.threshold - totalUniqueCards,
            percentProgress: Math.round((totalUniqueCards / nextMilestone.threshold) * 100),
          }
        : null,
      totalMilestonesEarned: earnedMilestones.length,
      totalMilestonesAvailable: MILESTONE_BADGES.length,
    };
  },
});

// Set completion badge thresholds (25%, 50%, 75%, 100%)
const SET_COMPLETION_BADGES = [
  { key: 'set_explorer', threshold: 25 },
  { key: 'set_adventurer', threshold: 50 },
  { key: 'set_master', threshold: 75 },
  { key: 'set_champion', threshold: 100 },
] as const;

// Check and award set completion badges for a specific set
export const checkSetCompletionAchievements = mutation({
  args: {
    profileId: v.id('profiles'),
    setId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the set info to know total cards
    const cachedSet = await ctx.db
      .query('cachedSets')
      .withIndex('by_set_id', (q) => q.eq('setId', args.setId))
      .first();

    if (!cachedSet) {
      return { awarded: [], error: 'Set not found', setId: args.setId };
    }

    const totalCardsInSet = cachedSet.totalCards;
    if (totalCardsInSet <= 0) {
      return { awarded: [], error: 'Set has no cards', setId: args.setId };
    }

    // Get owned cards for this set (cardId format is "setId-number")
    const ownedCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Filter to cards from this set and get unique cardIds
    const setPrefix = args.setId + '-';
    const uniqueCardIds = new Set<string>();
    for (const card of ownedCards) {
      if (card.cardId.startsWith(setPrefix)) {
        uniqueCardIds.add(card.cardId);
      }
    }
    const cardsOwnedInSet = uniqueCardIds.size;

    // Calculate completion percentage
    const completionPercentage = Math.round((cardsOwnedInSet / totalCardsInSet) * 100);

    const awarded: string[] = [];

    // Check each completion level
    for (const badge of SET_COMPLETION_BADGES) {
      if (completionPercentage >= badge.threshold) {
        // Create set-specific achievement key (e.g., "sv1_set_explorer")
        const achievementKey = `${args.setId}_${badge.key}`;

        // Check if already earned
        const existing = await ctx.db
          .query('achievements')
          .withIndex('by_profile_and_key', (q) =>
            q.eq('profileId', args.profileId).eq('achievementKey', achievementKey)
          )
          .first();

        if (!existing) {
          await ctx.db.insert('achievements', {
            profileId: args.profileId,
            achievementType: 'set_completion',
            achievementKey,
            achievementData: {
              setId: args.setId,
              setName: cachedSet.name,
              cardsOwned: cardsOwnedInSet,
              totalCards: totalCardsInSet,
              completionPercentage,
              badgeLevel: badge.key,
            },
            earnedAt: Date.now(),
          });

          // Log activity
          await ctx.db.insert('activityLogs', {
            profileId: args.profileId,
            action: 'achievement_earned',
            metadata: {
              achievementKey,
              setId: args.setId,
              setName: cachedSet.name,
              badgeLevel: badge.key,
              completionPercentage,
            },
          });

          awarded.push(achievementKey);
        }
      }
    }

    return {
      awarded,
      setId: args.setId,
      setName: cachedSet.name,
      cardsOwned: cardsOwnedInSet,
      totalCards: totalCardsInSet,
      completionPercentage,
    };
  },
});

// Check set completion for all sets a profile has cards in
export const checkAllSetCompletionAchievements = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    const ownedCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Group cards by set (extract setId from cardId format "setId-number")
    const cardsBySet = new Map<string, Set<string>>();
    for (const card of ownedCards) {
      const setId = card.cardId.split('-')[0];
      if (!cardsBySet.has(setId)) {
        cardsBySet.set(setId, new Set());
      }
      cardsBySet.get(setId)!.add(card.cardId);
    }

    const results: Array<{
      setId: string;
      setName: string;
      awarded: string[];
      completionPercentage: number;
    }> = [];
    const allAwarded: string[] = [];

    // Check each set
    for (const [setId, cardIds] of cardsBySet) {
      // Get set info
      const cachedSet = await ctx.db
        .query('cachedSets')
        .withIndex('by_set_id', (q) => q.eq('setId', setId))
        .first();

      if (!cachedSet || cachedSet.totalCards <= 0) {
        continue;
      }

      const cardsOwnedInSet = cardIds.size;
      const completionPercentage = Math.round((cardsOwnedInSet / cachedSet.totalCards) * 100);
      const awarded: string[] = [];

      // Check each completion level
      for (const badge of SET_COMPLETION_BADGES) {
        if (completionPercentage >= badge.threshold) {
          const achievementKey = `${setId}_${badge.key}`;

          // Check if already earned
          const existing = await ctx.db
            .query('achievements')
            .withIndex('by_profile_and_key', (q) =>
              q.eq('profileId', args.profileId).eq('achievementKey', achievementKey)
            )
            .first();

          if (!existing) {
            await ctx.db.insert('achievements', {
              profileId: args.profileId,
              achievementType: 'set_completion',
              achievementKey,
              achievementData: {
                setId,
                setName: cachedSet.name,
                cardsOwned: cardsOwnedInSet,
                totalCards: cachedSet.totalCards,
                completionPercentage,
                badgeLevel: badge.key,
              },
              earnedAt: Date.now(),
            });

            // Log activity
            await ctx.db.insert('activityLogs', {
              profileId: args.profileId,
              action: 'achievement_earned',
              metadata: {
                achievementKey,
                setId,
                setName: cachedSet.name,
                badgeLevel: badge.key,
                completionPercentage,
              },
            });

            awarded.push(achievementKey);
            allAwarded.push(achievementKey);
          }
        }
      }

      results.push({
        setId,
        setName: cachedSet.name,
        awarded,
        completionPercentage,
      });
    }

    return {
      results,
      totalAwarded: allAwarded,
      setsChecked: results.length,
    };
  },
});

// ============================================================================
// TYPE SPECIALIST ACHIEVEMENTS
// ============================================================================

// Type specialist badges - one for each Pokemon card type at 10+ cards threshold
const TYPE_SPECIALIST_BADGES = [
  { type: 'Fire', key: 'fire_trainer', name: 'Fire Trainer' },
  { type: 'Water', key: 'water_trainer', name: 'Water Trainer' },
  { type: 'Grass', key: 'grass_trainer', name: 'Grass Trainer' },
  { type: 'Lightning', key: 'electric_trainer', name: 'Electric Trainer' },
  { type: 'Psychic', key: 'psychic_trainer', name: 'Psychic Trainer' },
  { type: 'Fighting', key: 'fighting_trainer', name: 'Fighting Trainer' },
  { type: 'Darkness', key: 'darkness_trainer', name: 'Darkness Trainer' },
  { type: 'Metal', key: 'metal_trainer', name: 'Metal Trainer' },
  { type: 'Dragon', key: 'dragon_trainer', name: 'Dragon Trainer' },
  { type: 'Fairy', key: 'fairy_trainer', name: 'Fairy Trainer' },
  { type: 'Colorless', key: 'colorless_trainer', name: 'Colorless Trainer' },
] as const;

const TYPE_SPECIALIST_THRESHOLD = 10;

// Check and award type specialist badges based on cards by type
export const checkTypeSpecialistAchievements = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Get unique cardIds (we count unique cards, not quantities)
    const uniqueCardIds = new Set<string>();
    for (const card of collectionCards) {
      uniqueCardIds.add(card.cardId);
    }

    // Fetch cached card data to get types for each card
    const typeCounts: Record<string, number> = {};
    for (const cardId of uniqueCardIds) {
      const cachedCard = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
        .first();

      if (cachedCard && cachedCard.types) {
        // A card can have multiple types, count each
        for (const type of cachedCard.types) {
          typeCounts[type] = (typeCounts[type] ?? 0) + 1;
        }
      }
    }

    const awarded: string[] = [];

    // Check each type specialist badge
    for (const badge of TYPE_SPECIALIST_BADGES) {
      const count = typeCounts[badge.type] ?? 0;

      if (count >= TYPE_SPECIALIST_THRESHOLD) {
        // Check if already earned
        const existing = await ctx.db
          .query('achievements')
          .withIndex('by_profile_and_key', (q) =>
            q.eq('profileId', args.profileId).eq('achievementKey', badge.key)
          )
          .first();

        if (!existing) {
          await ctx.db.insert('achievements', {
            profileId: args.profileId,
            achievementType: 'type_specialist',
            achievementKey: badge.key,
            achievementData: {
              type: badge.type,
              count,
              threshold: TYPE_SPECIALIST_THRESHOLD,
            },
            earnedAt: Date.now(),
          });

          // Log activity for achievement earned
          await ctx.db.insert('activityLogs', {
            profileId: args.profileId,
            action: 'achievement_earned',
            metadata: {
              achievementKey: badge.key,
              achievementName: badge.name,
              achievementType: 'type_specialist',
              pokemonType: badge.type,
              count,
              threshold: TYPE_SPECIALIST_THRESHOLD,
            },
          });

          awarded.push(badge.key);
        }
      }
    }

    // Calculate progress for all types (for nearby badges)
    const typeProgress = TYPE_SPECIALIST_BADGES.map((badge) => {
      const count = typeCounts[badge.type] ?? 0;
      return {
        type: badge.type,
        key: badge.key,
        name: badge.name,
        count,
        threshold: TYPE_SPECIALIST_THRESHOLD,
        earned: count >= TYPE_SPECIALIST_THRESHOLD,
        remaining: Math.max(0, TYPE_SPECIALIST_THRESHOLD - count),
        progress: Math.min(100, Math.round((count / TYPE_SPECIALIST_THRESHOLD) * 100)),
      };
    });

    // Find types that are close to earning (1-9 cards)
    const nearbyBadges = typeProgress
      .filter((t) => t.count > 0 && t.count < TYPE_SPECIALIST_THRESHOLD)
      .sort((a, b) => a.remaining - b.remaining);

    return {
      awarded,
      typeCounts,
      typeProgress,
      nearbyBadges,
      totalTypeBadgesEarned: typeProgress.filter((t) => t.earned).length,
      totalTypeBadgesAvailable: TYPE_SPECIALIST_BADGES.length,
    };
  },
});

// Query to get type specialist progress for a profile (for UI display)
export const getTypeSpecialistProgress = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Get unique cardIds
    const uniqueCardIds = new Set<string>();
    for (const card of collectionCards) {
      uniqueCardIds.add(card.cardId);
    }

    // Fetch cached card data to get types
    const typeCounts: Record<string, number> = {};
    for (const cardId of uniqueCardIds) {
      const cachedCard = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
        .first();

      if (cachedCard && cachedCard.types) {
        for (const type of cachedCard.types) {
          typeCounts[type] = (typeCounts[type] ?? 0) + 1;
        }
      }
    }

    // Get earned type specialist achievements
    const earnedAchievements = await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .filter((q) => q.eq(q.field('achievementType'), 'type_specialist'))
      .collect();

    const earnedKeys = new Set(earnedAchievements.map((a) => a.achievementKey));

    // Build progress for each type
    const typeProgress = TYPE_SPECIALIST_BADGES.map((badge) => {
      const count = typeCounts[badge.type] ?? 0;
      const earned = earnedKeys.has(badge.key);
      const earnedAchievement = earned
        ? earnedAchievements.find((a) => a.achievementKey === badge.key)
        : null;

      return {
        type: badge.type,
        key: badge.key,
        name: badge.name,
        count,
        threshold: TYPE_SPECIALIST_THRESHOLD,
        earned,
        earnedAt: earnedAchievement?.earnedAt ?? null,
        remaining: earned ? 0 : Math.max(0, TYPE_SPECIALIST_THRESHOLD - count),
        progress: Math.min(100, Math.round((count / TYPE_SPECIALIST_THRESHOLD) * 100)),
      };
    });

    // Sort by progress descending (closest to earning first), then alphabetically
    const sortedByProgress = [...typeProgress].sort((a, b) => {
      if (a.earned && !b.earned) return -1;
      if (!a.earned && b.earned) return 1;
      if (b.progress !== a.progress) return b.progress - a.progress;
      return a.type.localeCompare(b.type);
    });

    // Find nearby badges (types with 1-9 cards)
    const nearbyBadges = typeProgress
      .filter((t) => t.count > 0 && !t.earned)
      .sort((a, b) => a.remaining - b.remaining);

    return {
      typeCounts,
      typeProgress: sortedByProgress,
      nearbyBadges,
      earnedBadges: typeProgress.filter((t) => t.earned),
      totalTypeBadgesEarned: typeProgress.filter((t) => t.earned).length,
      totalTypeBadgesAvailable: TYPE_SPECIALIST_BADGES.length,
    };
  },
});

// ============================================================================
// POKEMON FAN ACHIEVEMENTS
// ============================================================================

// Pokemon fan badge definitions with specific Pokemon names and thresholds
const POKEMON_FAN_BADGES = [
  { pokemon: 'Pikachu', key: 'pikachu_fan', name: 'Pikachu Fan', threshold: 5 },
  { pokemon: 'Eevee', key: 'eevee_fan', name: 'Eevee Fan', threshold: 5, includeEevolutions: true },
  { pokemon: 'Charizard', key: 'charizard_fan', name: 'Charizard Fan', threshold: 3 },
  { pokemon: 'Mewtwo', key: 'mewtwo_fan', name: 'Mewtwo Fan', threshold: 3 },
  { pokemon: 'Legendary', key: 'legendary_fan', name: 'Legendary Fan', threshold: 10, isCategory: true },
] as const;

// Eeveelutions for the Eevee fan badge
const EEVEELUTIONS = [
  'Eevee',
  'Vaporeon',
  'Jolteon',
  'Flareon',
  'Espeon',
  'Umbreon',
  'Leafeon',
  'Glaceon',
  'Sylveon',
];

// Legendary Pokemon list (common legendaries and mythicals)
const LEGENDARY_POKEMON = [
  // Gen 1
  'Articuno', 'Zapdos', 'Moltres', 'Mewtwo', 'Mew',
  // Gen 2
  'Raikou', 'Entei', 'Suicune', 'Lugia', 'Ho-Oh', 'Celebi',
  // Gen 3
  'Regirock', 'Regice', 'Registeel', 'Latias', 'Latios', 'Kyogre', 'Groudon', 'Rayquaza', 'Jirachi', 'Deoxys',
  // Gen 4
  'Uxie', 'Mesprit', 'Azelf', 'Dialga', 'Palkia', 'Heatran', 'Regigigas', 'Giratina', 'Cresselia', 'Phione', 'Manaphy', 'Darkrai', 'Shaymin', 'Arceus',
  // Gen 5
  'Victini', 'Cobalion', 'Terrakion', 'Virizion', 'Tornadus', 'Thundurus', 'Reshiram', 'Zekrom', 'Landorus', 'Kyurem', 'Keldeo', 'Meloetta', 'Genesect',
  // Gen 6
  'Xerneas', 'Yveltal', 'Zygarde', 'Diancie', 'Hoopa', 'Volcanion',
  // Gen 7
  'Tapu Koko', 'Tapu Lele', 'Tapu Bulu', 'Tapu Fini', 'Cosmog', 'Cosmoem', 'Solgaleo', 'Lunala', 'Nihilego', 'Buzzwole', 'Pheromosa', 'Xurkitree', 'Celesteela', 'Kartana', 'Guzzlord', 'Necrozma', 'Magearna', 'Marshadow', 'Poipole', 'Naganadel', 'Stakataka', 'Blacephalon', 'Zeraora',
  // Gen 8
  'Zacian', 'Zamazenta', 'Eternatus', 'Kubfu', 'Urshifu', 'Zarude', 'Regieleki', 'Regidrago', 'Glastrier', 'Spectrier', 'Calyrex',
  // Gen 9
  'Koraidon', 'Miraidon', 'Wo-Chien', 'Chien-Pao', 'Ting-Lu', 'Chi-Yu', 'Ogerpon', 'Terapagos', 'Pecharunt',
];

/**
 * Helper to check if a card name matches a Pokemon for badge purposes
 */
function matchesPokemonName(cardName: string, targetPokemon: string): boolean {
  // Normalize both names for comparison
  const normalizedCard = cardName.toLowerCase();
  const normalizedTarget = targetPokemon.toLowerCase();

  // Card name should start with the Pokemon name
  // This handles "Pikachu", "Pikachu V", "Pikachu VMAX", "Pikachu ex", etc.
  return (
    normalizedCard === normalizedTarget ||
    normalizedCard.startsWith(normalizedTarget + ' ')
  );
}

/**
 * Helper to check if a card is an Eeveelution (Eevee or any of its evolutions)
 */
function isEeveelution(cardName: string): boolean {
  return EEVEELUTIONS.some((eeveelution) => matchesPokemonName(cardName, eeveelution));
}

/**
 * Helper to check if a card is a Legendary Pokemon
 */
function isLegendaryPokemon(cardName: string): boolean {
  return LEGENDARY_POKEMON.some((legendary) => matchesPokemonName(cardName, legendary));
}

// Check and award Pokemon fan badges based on specific Pokemon counts
export const checkPokemonFanAchievements = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Get unique cardIds
    const uniqueCardIds = new Set<string>();
    for (const card of collectionCards) {
      uniqueCardIds.add(card.cardId);
    }

    // Fetch cached card data to get names
    const pokemonCounts: Record<string, number> = {
      Pikachu: 0,
      Eevee: 0, // Includes all eeveelutions
      Charizard: 0,
      Mewtwo: 0,
      Legendary: 0,
    };

    for (const cardId of uniqueCardIds) {
      const cachedCard = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
        .first();

      if (cachedCard) {
        const cardName = cachedCard.name;

        // Check each category
        if (matchesPokemonName(cardName, 'Pikachu')) {
          pokemonCounts.Pikachu++;
        }
        if (isEeveelution(cardName)) {
          pokemonCounts.Eevee++;
        }
        if (matchesPokemonName(cardName, 'Charizard')) {
          pokemonCounts.Charizard++;
        }
        if (matchesPokemonName(cardName, 'Mewtwo')) {
          pokemonCounts.Mewtwo++;
        }
        if (isLegendaryPokemon(cardName)) {
          pokemonCounts.Legendary++;
        }
      }
    }

    const awarded: string[] = [];

    // Check each Pokemon fan badge
    for (const badge of POKEMON_FAN_BADGES) {
      const count = pokemonCounts[badge.pokemon] ?? 0;

      if (count >= badge.threshold) {
        // Check if already earned
        const existing = await ctx.db
          .query('achievements')
          .withIndex('by_profile_and_key', (q) =>
            q.eq('profileId', args.profileId).eq('achievementKey', badge.key)
          )
          .first();

        if (!existing) {
          await ctx.db.insert('achievements', {
            profileId: args.profileId,
            achievementType: 'pokemon_fan',
            achievementKey: badge.key,
            achievementData: {
              pokemon: badge.pokemon,
              count,
              threshold: badge.threshold,
            },
            earnedAt: Date.now(),
          });

          // Log activity for achievement earned
          await ctx.db.insert('activityLogs', {
            profileId: args.profileId,
            action: 'achievement_earned',
            metadata: {
              achievementKey: badge.key,
              achievementName: badge.name,
              achievementType: 'pokemon_fan',
              pokemon: badge.pokemon,
              count,
              threshold: badge.threshold,
            },
          });

          awarded.push(badge.key);
        }
      }
    }

    // Calculate progress for all Pokemon (for nearby badges)
    const pokemonProgress = POKEMON_FAN_BADGES.map((badge) => {
      const count = pokemonCounts[badge.pokemon] ?? 0;
      return {
        pokemon: badge.pokemon,
        key: badge.key,
        name: badge.name,
        count,
        threshold: badge.threshold,
        earned: count >= badge.threshold,
        remaining: Math.max(0, badge.threshold - count),
        progress: Math.min(100, Math.round((count / badge.threshold) * 100)),
      };
    });

    // Find Pokemon that are close to earning badge (at least 1 card)
    const nearbyBadges = pokemonProgress
      .filter((p) => p.count > 0 && !p.earned)
      .sort((a, b) => a.remaining - b.remaining);

    return {
      awarded,
      pokemonCounts,
      pokemonProgress,
      nearbyBadges,
      totalPokemonFanBadgesEarned: pokemonProgress.filter((p) => p.earned).length,
      totalPokemonFanBadgesAvailable: POKEMON_FAN_BADGES.length,
    };
  },
});

// Query to get Pokemon fan progress for a profile (for UI display)
export const getPokemonFanProgress = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get all cards in the collection
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Get unique cardIds
    const uniqueCardIds = new Set<string>();
    for (const card of collectionCards) {
      uniqueCardIds.add(card.cardId);
    }

    // Fetch cached card data to get names
    const pokemonCounts: Record<string, number> = {
      Pikachu: 0,
      Eevee: 0,
      Charizard: 0,
      Mewtwo: 0,
      Legendary: 0,
    };

    for (const cardId of uniqueCardIds) {
      const cachedCard = await ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
        .first();

      if (cachedCard) {
        const cardName = cachedCard.name;

        if (matchesPokemonName(cardName, 'Pikachu')) {
          pokemonCounts.Pikachu++;
        }
        if (isEeveelution(cardName)) {
          pokemonCounts.Eevee++;
        }
        if (matchesPokemonName(cardName, 'Charizard')) {
          pokemonCounts.Charizard++;
        }
        if (matchesPokemonName(cardName, 'Mewtwo')) {
          pokemonCounts.Mewtwo++;
        }
        if (isLegendaryPokemon(cardName)) {
          pokemonCounts.Legendary++;
        }
      }
    }

    // Get earned Pokemon fan achievements
    const earnedAchievements = await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .filter((q) => q.eq(q.field('achievementType'), 'pokemon_fan'))
      .collect();

    const earnedKeys = new Set(earnedAchievements.map((a) => a.achievementKey));

    // Build progress for each Pokemon
    const pokemonProgress = POKEMON_FAN_BADGES.map((badge) => {
      const count = pokemonCounts[badge.pokemon] ?? 0;
      const earned = earnedKeys.has(badge.key);
      const earnedAchievement = earned
        ? earnedAchievements.find((a) => a.achievementKey === badge.key)
        : null;

      return {
        pokemon: badge.pokemon,
        key: badge.key,
        name: badge.name,
        count,
        threshold: badge.threshold,
        earned,
        earnedAt: earnedAchievement?.earnedAt ?? null,
        remaining: earned ? 0 : Math.max(0, badge.threshold - count),
        progress: Math.min(100, Math.round((count / badge.threshold) * 100)),
      };
    });

    // Sort by progress descending (closest to earning first)
    const sortedByProgress = [...pokemonProgress].sort((a, b) => {
      if (a.earned && !b.earned) return -1;
      if (!a.earned && b.earned) return 1;
      if (b.progress !== a.progress) return b.progress - a.progress;
      return a.pokemon.localeCompare(b.pokemon);
    });

    // Find nearby badges (Pokemon with at least 1 card but not earned)
    const nearbyBadges = pokemonProgress
      .filter((p) => p.count > 0 && !p.earned)
      .sort((a, b) => a.remaining - b.remaining);

    return {
      pokemonCounts,
      pokemonProgress: sortedByProgress,
      nearbyBadges,
      earnedBadges: pokemonProgress.filter((p) => p.earned),
      totalPokemonFanBadgesEarned: pokemonProgress.filter((p) => p.earned).length,
      totalPokemonFanBadgesAvailable: POKEMON_FAN_BADGES.length,
    };
  },
});

// Query to get set completion progress for a profile
export const getSetCompletionProgress = query({
  args: {
    profileId: v.id('profiles'),
    setId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the set info
    const cachedSet = await ctx.db
      .query('cachedSets')
      .withIndex('by_set_id', (q) => q.eq('setId', args.setId))
      .first();

    if (!cachedSet) {
      return null;
    }

    // Get owned cards for this set
    const ownedCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Filter to cards from this set
    const setPrefix = args.setId + '-';
    const uniqueCardIds = new Set<string>();
    for (const card of ownedCards) {
      if (card.cardId.startsWith(setPrefix)) {
        uniqueCardIds.add(card.cardId);
      }
    }

    const cardsOwned = uniqueCardIds.size;
    const totalCards = cachedSet.totalCards;
    const completionPercentage = totalCards > 0 ? Math.round((cardsOwned / totalCards) * 100) : 0;

    // Get earned badges for this set
    const earnedAchievements = await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .filter((q) => q.eq(q.field('achievementType'), 'set_completion'))
      .collect();

    const earnedBadges = earnedAchievements
      .filter((a) => a.achievementKey.startsWith(args.setId + '_'))
      .map((a) => {
        const badgeKey = a.achievementKey.substring(args.setId.length + 1);
        return {
          key: a.achievementKey,
          badgeKey,
          earnedAt: a.earnedAt,
        };
      });

    // Find next badge to earn
    const nextBadge = SET_COMPLETION_BADGES.find((badge) => completionPercentage < badge.threshold);

    return {
      setId: args.setId,
      setName: cachedSet.name,
      cardsOwned,
      totalCards,
      completionPercentage,
      earnedBadges,
      nextBadge: nextBadge
        ? {
            key: nextBadge.key,
            threshold: nextBadge.threshold,
            cardsNeeded: Math.ceil((nextBadge.threshold / 100) * totalCards) - cardsOwned,
          }
        : null,
    };
  },
});
