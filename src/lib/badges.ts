/**
 * Badge definitions for the KidCollect achievement system
 * This module provides type definitions and helper functions for working with badges
 * on the client side. The source of truth for badge definitions is in convex/achievements.ts
 */

// ============================================================================
// TYPE DEFINITIONS
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

export interface EarnedBadge {
  key: string;
  definition: BadgeDefinition;
  earnedAt: Date;
  data?: Record<string, unknown>;
}

export interface BadgeProgress {
  key: string;
  definition: BadgeDefinition;
  current: number;
  percentage: number;
  isEarned: boolean;
  earnedAt?: Date;
}

// ============================================================================
// BADGE DEFINITIONS (mirrored from convex/achievements.ts for client-side use)
// ============================================================================

export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  // Set Completion Badges
  set_explorer: {
    type: 'set_completion',
    name: 'Set Explorer',
    description: 'Collect 25% of a set',
    threshold: 25,
    icon: '🗺️',
    color: '#78C850',
  },
  set_adventurer: {
    type: 'set_completion',
    name: 'Set Adventurer',
    description: 'Collect 50% of a set',
    threshold: 50,
    icon: '🎒',
    color: '#6890F0',
  },
  set_master: {
    type: 'set_completion',
    name: 'Set Master',
    description: 'Collect 75% of a set',
    threshold: 75,
    icon: '🏅',
    color: '#A040A0',
  },
  set_champion: {
    type: 'set_completion',
    name: 'Set Champion',
    description: 'Complete a set 100%',
    threshold: 100,
    icon: '🏆',
    color: '#F8D030',
  },

  // Collector Milestone Badges
  first_catch: {
    type: 'collector_milestone',
    name: 'First Catch',
    description: 'Add your first card',
    threshold: 1,
    icon: '🎯',
    color: '#A8A878',
  },
  starter_collector: {
    type: 'collector_milestone',
    name: 'Starter Collector',
    description: 'Collect 10 cards',
    threshold: 10,
    icon: '⭐',
    color: '#78C850',
  },
  rising_trainer: {
    type: 'collector_milestone',
    name: 'Rising Trainer',
    description: 'Collect 50 cards',
    threshold: 50,
    icon: '🌟',
    color: '#6890F0',
  },
  pokemon_trainer: {
    type: 'collector_milestone',
    name: 'Pokemon Trainer',
    description: 'Collect 100 cards',
    threshold: 100,
    icon: '💫',
    color: '#A040A0',
  },
  elite_collector: {
    type: 'collector_milestone',
    name: 'Elite Collector',
    description: 'Collect 250 cards',
    threshold: 250,
    icon: '🎖️',
    color: '#F08030',
  },
  pokemon_master: {
    type: 'collector_milestone',
    name: 'Pokemon Master',
    description: 'Collect 500 cards',
    threshold: 500,
    icon: '👑',
    color: '#F8D030',
  },
  legendary_collector: {
    type: 'collector_milestone',
    name: 'Legendary Collector',
    description: 'Collect 1000 cards',
    threshold: 1000,
    icon: '🌈',
    color: '#7038F8',
  },

  // Type Specialist Badges
  fire_trainer: {
    type: 'type_specialist',
    name: 'Fire Trainer',
    description: 'Collect 10+ Fire-type cards',
    threshold: 10,
    icon: '🔥',
    color: '#F08030',
  },
  water_trainer: {
    type: 'type_specialist',
    name: 'Water Trainer',
    description: 'Collect 10+ Water-type cards',
    threshold: 10,
    icon: '💧',
    color: '#6890F0',
  },
  grass_trainer: {
    type: 'type_specialist',
    name: 'Grass Trainer',
    description: 'Collect 10+ Grass-type cards',
    threshold: 10,
    icon: '🌿',
    color: '#78C850',
  },
  electric_trainer: {
    type: 'type_specialist',
    name: 'Electric Trainer',
    description: 'Collect 10+ Electric-type cards',
    threshold: 10,
    icon: '⚡',
    color: '#F8D030',
  },
  psychic_trainer: {
    type: 'type_specialist',
    name: 'Psychic Trainer',
    description: 'Collect 10+ Psychic-type cards',
    threshold: 10,
    icon: '🔮',
    color: '#F85888',
  },
  fighting_trainer: {
    type: 'type_specialist',
    name: 'Fighting Trainer',
    description: 'Collect 10+ Fighting-type cards',
    threshold: 10,
    icon: '🥊',
    color: '#C03028',
  },
  darkness_trainer: {
    type: 'type_specialist',
    name: 'Darkness Trainer',
    description: 'Collect 10+ Darkness-type cards',
    threshold: 10,
    icon: '🌑',
    color: '#705848',
  },
  metal_trainer: {
    type: 'type_specialist',
    name: 'Metal Trainer',
    description: 'Collect 10+ Metal-type cards',
    threshold: 10,
    icon: '⚙️',
    color: '#B8B8D0',
  },
  dragon_trainer: {
    type: 'type_specialist',
    name: 'Dragon Trainer',
    description: 'Collect 10+ Dragon-type cards',
    threshold: 10,
    icon: '🐉',
    color: '#7038F8',
  },
  fairy_trainer: {
    type: 'type_specialist',
    name: 'Fairy Trainer',
    description: 'Collect 10+ Fairy-type cards',
    threshold: 10,
    icon: '🧚',
    color: '#EE99AC',
  },
  colorless_trainer: {
    type: 'type_specialist',
    name: 'Colorless Trainer',
    description: 'Collect 10+ Colorless-type cards',
    threshold: 10,
    icon: '⚪',
    color: '#A8A878',
  },

  // Pokemon Fan Badges
  pikachu_fan: {
    type: 'pokemon_fan',
    name: 'Pikachu Fan',
    description: 'Collect 5+ Pikachu cards',
    threshold: 5,
    icon: '⚡',
    color: '#F8D030',
  },
  eevee_fan: {
    type: 'pokemon_fan',
    name: 'Eevee Fan',
    description: 'Collect 5+ Eevee/Eeveelution cards',
    threshold: 5,
    icon: '🦊',
    color: '#A8A878',
  },
  charizard_fan: {
    type: 'pokemon_fan',
    name: 'Charizard Fan',
    description: 'Collect 3+ Charizard cards',
    threshold: 3,
    icon: '🔥',
    color: '#F08030',
  },
  mewtwo_fan: {
    type: 'pokemon_fan',
    name: 'Mewtwo Fan',
    description: 'Collect 3+ Mewtwo cards',
    threshold: 3,
    icon: '🔮',
    color: '#F85888',
  },
  legendary_fan: {
    type: 'pokemon_fan',
    name: 'Legendary Fan',
    description: 'Collect 10+ Legendary Pokemon cards',
    threshold: 10,
    icon: '✨',
    color: '#7038F8',
  },

  // Streak Badges
  streak_3: {
    type: 'streak',
    name: '3-Day Streak',
    description: 'Add cards 3 days in a row',
    threshold: 3,
    icon: '🔥',
    color: '#F08030',
  },
  streak_7: {
    type: 'streak',
    name: 'Week Warrior',
    description: 'Add cards 7 days in a row',
    threshold: 7,
    icon: '📅',
    color: '#6890F0',
  },
  streak_14: {
    type: 'streak',
    name: 'Dedicated Collector',
    description: 'Add cards 14 days in a row',
    threshold: 14,
    icon: '💪',
    color: '#A040A0',
  },
  streak_30: {
    type: 'streak',
    name: 'Monthly Master',
    description: 'Add cards 30 days in a row',
    threshold: 30,
    icon: '🏆',
    color: '#F8D030',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a badge definition by its key
 */
export function getBadge(key: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS[key];
}

/**
 * Get all badges of a specific category
 */
export function getBadgesByCategory(category: AchievementCategory): BadgeDefinition[] {
  return Object.values(BADGE_DEFINITIONS).filter((badge) => badge.type === category);
}

/**
 * Get all badge keys
 */
export function getAllBadgeKeys(): string[] {
  return Object.keys(BADGE_DEFINITIONS);
}

/**
 * Get milestone badges sorted by threshold (ascending)
 */
export function getMilestoneBadges(): Array<{ key: string } & BadgeDefinition> {
  return Object.entries(BADGE_DEFINITIONS)
    .filter(([, badge]) => badge.type === 'collector_milestone')
    .map(([key, badge]) => ({ key, ...badge }))
    .sort((a, b) => a.threshold - b.threshold);
}

/**
 * Get set completion badges sorted by threshold (ascending)
 */
export function getSetCompletionBadges(): Array<{ key: string } & BadgeDefinition> {
  return Object.entries(BADGE_DEFINITIONS)
    .filter(([, badge]) => badge.type === 'set_completion')
    .map(([key, badge]) => ({ key, ...badge }))
    .sort((a, b) => a.threshold - b.threshold);
}

/**
 * Get streak badges sorted by threshold (ascending)
 */
export function getStreakBadges(): Array<{ key: string } & BadgeDefinition> {
  return Object.entries(BADGE_DEFINITIONS)
    .filter(([, badge]) => badge.type === 'streak')
    .map(([key, badge]) => ({ key, ...badge }))
    .sort((a, b) => a.threshold - b.threshold);
}

/**
 * Get all type specialist badges
 */
export function getTypeSpecialistBadges(): Array<{ key: string } & BadgeDefinition> {
  return Object.entries(BADGE_DEFINITIONS)
    .filter(([, badge]) => badge.type === 'type_specialist')
    .map(([key, badge]) => ({ key, ...badge }));
}

/**
 * Get all Pokemon fan badges
 */
export function getPokemonFanBadges(): Array<{ key: string } & BadgeDefinition> {
  return Object.entries(BADGE_DEFINITIONS)
    .filter(([, badge]) => badge.type === 'pokemon_fan')
    .map(([key, badge]) => ({ key, ...badge }));
}

/**
 * Map Pokemon card type to type specialist badge key
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
 * Calculate progress towards a milestone badge based on total cards
 */
export function calculateMilestoneProgress(totalCards: number): BadgeProgress[] {
  const milestones = getMilestoneBadges();
  return milestones.map((milestone) => ({
    key: milestone.key,
    definition: milestone,
    current: totalCards,
    percentage: Math.min(100, Math.round((totalCards / milestone.threshold) * 100)),
    isEarned: totalCards >= milestone.threshold,
  }));
}

/**
 * Calculate progress towards a set completion badge based on percentage
 */
export function calculateSetCompletionProgress(
  setPercentage: number,
  setId: string
): BadgeProgress[] {
  const setCompletionBadges = getSetCompletionBadges();
  return setCompletionBadges.map((badge) => ({
    key: `${badge.key}_${setId}`,
    definition: badge,
    current: setPercentage,
    percentage: Math.min(100, Math.round((setPercentage / badge.threshold) * 100)),
    isEarned: setPercentage >= badge.threshold,
  }));
}

/**
 * Get the next unearned milestone badge
 */
export function getNextMilestoneBadge(
  totalCards: number
): ({ key: string } & BadgeDefinition) | null {
  const milestones = getMilestoneBadges();
  return milestones.find((milestone) => totalCards < milestone.threshold) || null;
}

/**
 * Get the count of total badges available
 */
export function getTotalBadgeCount(): number {
  return Object.keys(BADGE_DEFINITIONS).length;
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: AchievementCategory): string {
  const names: Record<AchievementCategory, string> = {
    set_completion: 'Set Completion',
    collector_milestone: 'Collector Milestones',
    type_specialist: 'Type Specialists',
    pokemon_fan: 'Pokemon Fans',
    streak: 'Streaks',
  };
  return names[category];
}

/**
 * Get all categories
 */
export function getAllCategories(): AchievementCategory[] {
  return ['collector_milestone', 'set_completion', 'type_specialist', 'pokemon_fan', 'streak'];
}
