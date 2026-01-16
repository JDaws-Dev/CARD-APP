/**
 * Pure utility functions for achievement awarding logic.
 * These functions are decoupled from Convex for testability.
 */

// ============================================================================
// TYPES
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

export interface EarnedAchievement {
  achievementKey: string;
  achievementType: AchievementCategory;
  earnedAt: number;
}

export interface MilestoneCheckResult {
  earnedBadges: string[];
  nextMilestone: { key: string; threshold: number; remaining: number } | null;
  progress: {
    current: number;
    nextTarget: number | null;
    percentToNext: number;
  };
}

export interface SetCompletionResult {
  earnedBadges: string[];
  completionPercentage: number;
  cardsOwned: number;
  totalCards: number;
  nextBadge: { key: string; threshold: number; cardsNeeded: number } | null;
}

export interface TypeSpecialistResult {
  earnedBadges: string[];
  typeCounts: Record<string, number>;
  nearbyBadges: Array<{ type: string; badgeKey: string; count: number; remaining: number }>;
}

export interface StreakCheckResult {
  earnedBadges: string[];
  currentStreak: number;
  nextBadge: { key: string; threshold: number; daysNeeded: number } | null;
}

// ============================================================================
// MILESTONE THRESHOLDS
// ============================================================================

export const MILESTONE_THRESHOLDS = [
  { key: 'first_catch', threshold: 1 },
  { key: 'starter_collector', threshold: 10 },
  { key: 'rising_trainer', threshold: 50 },
  { key: 'pokemon_trainer', threshold: 100 },
  { key: 'elite_collector', threshold: 250 },
  { key: 'pokemon_master', threshold: 500 },
  { key: 'legendary_collector', threshold: 1000 },
] as const;

export const SET_COMPLETION_THRESHOLDS = [
  { key: 'set_explorer', threshold: 25 },
  { key: 'set_adventurer', threshold: 50 },
  { key: 'set_master', threshold: 75 },
  { key: 'set_champion', threshold: 100 },
] as const;

export const STREAK_THRESHOLDS = [
  { key: 'streak_3', threshold: 3 },
  { key: 'streak_7', threshold: 7 },
  { key: 'streak_14', threshold: 14 },
  { key: 'streak_30', threshold: 30 },
] as const;

export const TYPE_SPECIALIST_THRESHOLD = 10;

export const TYPE_TO_BADGE_KEY: Record<string, string> = {
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

export const POKEMON_FAN_THRESHOLDS: Record<string, { key: string; threshold: number }> = {
  Pikachu: { key: 'pikachu_fan', threshold: 5 },
  Eevee: { key: 'eevee_fan', threshold: 5 },
  Charizard: { key: 'charizard_fan', threshold: 3 },
  Mewtwo: { key: 'mewtwo_fan', threshold: 3 },
};

// ============================================================================
// MILESTONE CHECKING
// ============================================================================

/**
 * Determines which milestone badges should be awarded based on card count.
 * Returns only NEW badges (excludes already earned ones).
 */
export function checkMilestoneAchievements(
  totalCards: number,
  alreadyEarned: string[] = []
): MilestoneCheckResult {
  const earnedSet = new Set(alreadyEarned);
  const earnedBadges: string[] = [];

  for (const milestone of MILESTONE_THRESHOLDS) {
    if (totalCards >= milestone.threshold && !earnedSet.has(milestone.key)) {
      earnedBadges.push(milestone.key);
    }
  }

  // Find the next milestone
  const nextMilestone = MILESTONE_THRESHOLDS.find(
    (m) => totalCards < m.threshold
  );

  return {
    earnedBadges,
    nextMilestone: nextMilestone
      ? {
          key: nextMilestone.key,
          threshold: nextMilestone.threshold,
          remaining: nextMilestone.threshold - totalCards,
        }
      : null,
    progress: {
      current: totalCards,
      nextTarget: nextMilestone?.threshold ?? null,
      percentToNext: nextMilestone
        ? Math.round((totalCards / nextMilestone.threshold) * 100)
        : 100,
    },
  };
}

/**
 * Gets the highest earned milestone badge key.
 */
export function getHighestMilestone(totalCards: number): string | null {
  let highest: string | null = null;
  for (const milestone of MILESTONE_THRESHOLDS) {
    if (totalCards >= milestone.threshold) {
      highest = milestone.key;
    }
  }
  return highest;
}

/**
 * Gets the next milestone to achieve.
 */
export function getNextMilestone(
  totalCards: number
): { key: string; threshold: number; remaining: number } | null {
  const next = MILESTONE_THRESHOLDS.find((m) => totalCards < m.threshold);
  if (!next) return null;
  return {
    key: next.key,
    threshold: next.threshold,
    remaining: next.threshold - totalCards,
  };
}

// ============================================================================
// SET COMPLETION CHECKING
// ============================================================================

/**
 * Calculates set completion percentage.
 */
export function calculateSetCompletion(cardsOwned: number, totalCards: number): number {
  if (totalCards <= 0) return 0;
  return Math.round((cardsOwned / totalCards) * 100);
}

/**
 * Determines which set completion badges should be awarded.
 * Returns only NEW badges (excludes already earned ones).
 */
export function checkSetCompletionAchievements(
  cardsOwned: number,
  totalCards: number,
  alreadyEarned: string[] = []
): SetCompletionResult {
  const completion = calculateSetCompletion(cardsOwned, totalCards);
  const earnedSet = new Set(alreadyEarned);
  const earnedBadges: string[] = [];

  for (const badge of SET_COMPLETION_THRESHOLDS) {
    if (completion >= badge.threshold && !earnedSet.has(badge.key)) {
      earnedBadges.push(badge.key);
    }
  }

  // Find next badge
  const nextBadge = SET_COMPLETION_THRESHOLDS.find(
    (b) => completion < b.threshold
  );

  return {
    earnedBadges,
    completionPercentage: completion,
    cardsOwned,
    totalCards,
    nextBadge: nextBadge
      ? {
          key: nextBadge.key,
          threshold: nextBadge.threshold,
          cardsNeeded: Math.ceil((nextBadge.threshold / 100) * totalCards) - cardsOwned,
        }
      : null,
  };
}

/**
 * Creates a set-specific badge key (e.g., "sv1_set_explorer").
 */
export function createSetBadgeKey(setId: string, badgeKey: string): string {
  return `${setId}_${badgeKey}`;
}

/**
 * Parses a set badge key into its components.
 */
export function parseSetBadgeKey(key: string): { setId: string; badgeKey: string } | null {
  const lastUnderscore = key.lastIndexOf('_');
  if (lastUnderscore === -1) return null;

  // Check if the suffix is a valid set badge key
  const possibleBadgeKey = key.substring(lastUnderscore + 1);
  const validKeys = SET_COMPLETION_THRESHOLDS.map(t => t.key.split('_').pop());

  // For set badges like "sv1_set_explorer", we need to find the badge key part
  for (const threshold of SET_COMPLETION_THRESHOLDS) {
    if (key.endsWith(`_${threshold.key}`)) {
      return {
        setId: key.substring(0, key.length - threshold.key.length - 1),
        badgeKey: threshold.key,
      };
    }
  }

  return null;
}

// ============================================================================
// TYPE SPECIALIST CHECKING
// ============================================================================

/**
 * Determines which type specialist badges should be awarded.
 * typeCounts is a map of Pokemon type -> count of cards owned.
 */
export function checkTypeSpecialistAchievements(
  typeCounts: Record<string, number>,
  alreadyEarned: string[] = []
): TypeSpecialistResult {
  const earnedSet = new Set(alreadyEarned);
  const earnedBadges: string[] = [];
  const nearbyBadges: Array<{
    type: string;
    badgeKey: string;
    count: number;
    remaining: number;
  }> = [];

  for (const [type, badgeKey] of Object.entries(TYPE_TO_BADGE_KEY)) {
    const count = typeCounts[type] ?? 0;

    if (count >= TYPE_SPECIALIST_THRESHOLD && !earnedSet.has(badgeKey)) {
      earnedBadges.push(badgeKey);
    } else if (count > 0 && count < TYPE_SPECIALIST_THRESHOLD) {
      nearbyBadges.push({
        type,
        badgeKey,
        count,
        remaining: TYPE_SPECIALIST_THRESHOLD - count,
      });
    }
  }

  // Sort nearby badges by how close they are to completion
  nearbyBadges.sort((a, b) => a.remaining - b.remaining);

  return {
    earnedBadges,
    typeCounts,
    nearbyBadges,
  };
}

/**
 * Gets the badge key for a Pokemon type.
 */
export function getTypeSpecialistKey(pokemonType: string): string | undefined {
  return TYPE_TO_BADGE_KEY[pokemonType];
}

/**
 * Gets all Pokemon types that have associated badges.
 */
export function getTypesWithBadges(): string[] {
  return Object.keys(TYPE_TO_BADGE_KEY);
}

// ============================================================================
// STREAK CHECKING
// ============================================================================

/**
 * Determines which streak badges should be awarded based on current streak.
 */
export function checkStreakAchievements(
  currentStreak: number,
  alreadyEarned: string[] = []
): StreakCheckResult {
  const earnedSet = new Set(alreadyEarned);
  const earnedBadges: string[] = [];

  for (const streak of STREAK_THRESHOLDS) {
    if (currentStreak >= streak.threshold && !earnedSet.has(streak.key)) {
      earnedBadges.push(streak.key);
    }
  }

  // Find next badge
  const nextBadge = STREAK_THRESHOLDS.find((s) => currentStreak < s.threshold);

  return {
    earnedBadges,
    currentStreak,
    nextBadge: nextBadge
      ? {
          key: nextBadge.key,
          threshold: nextBadge.threshold,
          daysNeeded: nextBadge.threshold - currentStreak,
        }
      : null,
  };
}

/**
 * Gets the highest earned streak badge.
 */
export function getHighestStreakBadge(currentStreak: number): string | null {
  let highest: string | null = null;
  for (const streak of STREAK_THRESHOLDS) {
    if (currentStreak >= streak.threshold) {
      highest = streak.key;
    }
  }
  return highest;
}

// ============================================================================
// POKEMON FAN CHECKING
// ============================================================================

/**
 * Determines which Pokemon fan badges should be awarded.
 * pokemonCounts is a map of Pokemon name -> count of cards owned.
 */
export function checkPokemonFanAchievements(
  pokemonCounts: Record<string, number>,
  alreadyEarned: string[] = []
): { earnedBadges: string[]; progress: Record<string, { count: number; threshold: number; earned: boolean }> } {
  const earnedSet = new Set(alreadyEarned);
  const earnedBadges: string[] = [];
  const progress: Record<string, { count: number; threshold: number; earned: boolean }> = {};

  for (const [pokemon, { key, threshold }] of Object.entries(POKEMON_FAN_THRESHOLDS)) {
    const count = pokemonCounts[pokemon] ?? 0;
    const earned = count >= threshold && !earnedSet.has(key);

    if (earned) {
      earnedBadges.push(key);
    }

    progress[pokemon] = {
      count,
      threshold,
      earned: count >= threshold,
    };
  }

  return {
    earnedBadges,
    progress,
  };
}

// ============================================================================
// BADGE DISPLAY UTILITIES
// ============================================================================

/**
 * Formats the earned date for display.
 */
export function formatEarnedDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats the earned date as a relative string (e.g., "2 days ago").
 */
export function formatEarnedDateRelative(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    return formatEarnedDate(timestamp);
  } else if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  } else if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  } else if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Sorts achievements by earned date (newest first).
 */
export function sortAchievementsByDate(
  achievements: EarnedAchievement[]
): EarnedAchievement[] {
  return [...achievements].sort((a, b) => b.earnedAt - a.earnedAt);
}

/**
 * Groups achievements by category.
 */
export function groupAchievementsByCategory(
  achievements: EarnedAchievement[]
): Record<AchievementCategory, EarnedAchievement[]> {
  const grouped: Record<AchievementCategory, EarnedAchievement[]> = {
    set_completion: [],
    collector_milestone: [],
    type_specialist: [],
    pokemon_fan: [],
    streak: [],
  };

  for (const achievement of achievements) {
    grouped[achievement.achievementType].push(achievement);
  }

  return grouped;
}

/**
 * Counts achievements by category.
 */
export function countAchievementsByCategory(
  achievements: EarnedAchievement[]
): Record<AchievementCategory, number> {
  const counts: Record<AchievementCategory, number> = {
    set_completion: 0,
    collector_milestone: 0,
    type_specialist: 0,
    pokemon_fan: 0,
    streak: 0,
  };

  for (const achievement of achievements) {
    counts[achievement.achievementType]++;
  }

  return counts;
}

/**
 * Gets the total number of possible badges for a category.
 */
export function getTotalBadgesForCategory(category: AchievementCategory): number {
  switch (category) {
    case 'collector_milestone':
      return MILESTONE_THRESHOLDS.length;
    case 'set_completion':
      // This is per-set, so we can't give a fixed number
      return SET_COMPLETION_THRESHOLDS.length;
    case 'type_specialist':
      return Object.keys(TYPE_TO_BADGE_KEY).length;
    case 'streak':
      return STREAK_THRESHOLDS.length;
    case 'pokemon_fan':
      return Object.keys(POKEMON_FAN_THRESHOLDS).length;
    default:
      return 0;
  }
}
