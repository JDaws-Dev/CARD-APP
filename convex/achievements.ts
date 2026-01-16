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

// Check and award milestone achievements based on total cards
export const checkMilestoneAchievements = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get total unique cards
    const cards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const totalCards = cards.length;
    const awarded: string[] = [];

    // Check each milestone
    const milestones = [
      { key: 'first_catch', threshold: 1 },
      { key: 'starter_collector', threshold: 10 },
      { key: 'rising_trainer', threshold: 50 },
      { key: 'pokemon_trainer', threshold: 100 },
      { key: 'elite_collector', threshold: 250 },
      { key: 'pokemon_master', threshold: 500 },
      { key: 'legendary_collector', threshold: 1000 },
    ];

    for (const milestone of milestones) {
      if (totalCards >= milestone.threshold) {
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
