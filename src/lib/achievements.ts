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

// ============================================================================
// SET COMPLETION BADGE UTILITIES
// ============================================================================

export interface SetCompletionBadgeResult {
  badgesToAward: string[];
  allBadges: Array<{
    key: string;
    fullKey: string;
    threshold: number;
    earned: boolean;
    cardsNeeded: number;
  }>;
}

/**
 * Determines which set completion badges should be awarded for a specific set.
 * Returns badge keys that should be newly awarded (excludes already earned).
 * Badge keys are formatted as "setId_badge_key" (e.g., "sv1_set_explorer").
 */
export function getSetCompletionBadgesToAward(
  setId: string,
  cardsOwned: number,
  totalCards: number,
  alreadyEarned: string[] = []
): SetCompletionBadgeResult {
  const completionPercentage = calculateSetCompletion(cardsOwned, totalCards);
  const earnedSet = new Set(alreadyEarned);
  const badgesToAward: string[] = [];
  const allBadges: SetCompletionBadgeResult['allBadges'] = [];

  for (const badge of SET_COMPLETION_THRESHOLDS) {
    const fullKey = createSetBadgeKey(setId, badge.key);
    const earned = completionPercentage >= badge.threshold;
    const shouldAward = earned && !earnedSet.has(fullKey);

    if (shouldAward) {
      badgesToAward.push(fullKey);
    }

    const cardsNeededForThreshold = Math.ceil((badge.threshold / 100) * totalCards);
    allBadges.push({
      key: badge.key,
      fullKey,
      threshold: badge.threshold,
      earned,
      cardsNeeded: earned ? 0 : cardsNeededForThreshold - cardsOwned,
    });
  }

  return { badgesToAward, allBadges };
}

/**
 * Gets the current set completion tier (highest badge level reached).
 * Returns null if no badge tier reached yet.
 */
export function getCurrentSetCompletionTier(
  completionPercentage: number
): { key: string; threshold: number } | null {
  let currentTier: { key: string; threshold: number } | null = null;

  for (const badge of SET_COMPLETION_THRESHOLDS) {
    if (completionPercentage >= badge.threshold) {
      currentTier = { key: badge.key, threshold: badge.threshold };
    }
  }

  return currentTier;
}

/**
 * Gets the next set completion tier to achieve.
 * Returns null if all tiers achieved (100% completion).
 */
export function getNextSetCompletionTier(
  completionPercentage: number
): { key: string; threshold: number; percentageNeeded: number } | null {
  const nextTier = SET_COMPLETION_THRESHOLDS.find(
    (badge) => completionPercentage < badge.threshold
  );

  if (!nextTier) return null;

  return {
    key: nextTier.key,
    threshold: nextTier.threshold,
    percentageNeeded: nextTier.threshold - completionPercentage,
  };
}

/**
 * Calculates how many more cards are needed to reach a specific percentage.
 */
export function cardsNeededForPercentage(
  targetPercentage: number,
  cardsOwned: number,
  totalCards: number
): number {
  if (totalCards <= 0) return 0;
  const cardsNeeded = Math.ceil((targetPercentage / 100) * totalCards);
  return Math.max(0, cardsNeeded - cardsOwned);
}

/**
 * Gets set completion summary with all badge progress.
 */
export interface SetCompletionSummary {
  setId: string;
  cardsOwned: number;
  totalCards: number;
  completionPercentage: number;
  currentTier: { key: string; threshold: number } | null;
  nextTier: { key: string; threshold: number; cardsNeeded: number } | null;
  earnedBadgeKeys: string[];
  allBadgeProgress: Array<{
    key: string;
    fullKey: string;
    threshold: number;
    earned: boolean;
    cardsNeeded: number;
  }>;
}

export function getSetCompletionSummary(
  setId: string,
  cardsOwned: number,
  totalCards: number,
  earnedBadgeKeys: string[] = []
): SetCompletionSummary {
  const completionPercentage = calculateSetCompletion(cardsOwned, totalCards);
  const currentTier = getCurrentSetCompletionTier(completionPercentage);
  const nextTierInfo = getNextSetCompletionTier(completionPercentage);

  const { allBadges } = getSetCompletionBadgesToAward(
    setId,
    cardsOwned,
    totalCards,
    earnedBadgeKeys
  );

  return {
    setId,
    cardsOwned,
    totalCards,
    completionPercentage,
    currentTier,
    nextTier: nextTierInfo
      ? {
          key: nextTierInfo.key,
          threshold: nextTierInfo.threshold,
          cardsNeeded: cardsNeededForPercentage(nextTierInfo.threshold, cardsOwned, totalCards),
        }
      : null,
    earnedBadgeKeys: allBadges.filter((b) => b.earned).map((b) => b.fullKey),
    allBadgeProgress: allBadges,
  };
}

/**
 * Checks if a set is fully completed (100%).
 */
export function isSetComplete(cardsOwned: number, totalCards: number): boolean {
  return totalCards > 0 && cardsOwned >= totalCards;
}

/**
 * Gets list of all set badge keys that would be earned at a given completion level.
 */
export function getAllEarnedBadgeKeysForCompletion(
  setId: string,
  completionPercentage: number
): string[] {
  const earnedKeys: string[] = [];

  for (const badge of SET_COMPLETION_THRESHOLDS) {
    if (completionPercentage >= badge.threshold) {
      earnedKeys.push(createSetBadgeKey(setId, badge.key));
    }
  }

  return earnedKeys;
}

// ============================================================================
// MILESTONE BADGE UTILITIES
// ============================================================================

export interface MilestoneProgress {
  key: string;
  name: string;
  threshold: number;
  earned: boolean;
  progress: number;
  cardsNeeded: number;
}

export interface MilestoneProgressSummary {
  totalUniqueCards: number;
  milestones: MilestoneProgress[];
  currentMilestone: { key: string; name: string; threshold: number } | null;
  nextMilestone: {
    key: string;
    name: string;
    threshold: number;
    cardsNeeded: number;
    percentProgress: number;
  } | null;
  totalMilestonesEarned: number;
  totalMilestonesAvailable: number;
}

/**
 * Milestone badge definitions with names for display
 */
export const MILESTONE_BADGE_DEFINITIONS = [
  { key: 'first_catch', threshold: 1, name: 'First Card' },
  { key: 'starter_collector', threshold: 10, name: 'Starter Collector' },
  { key: 'rising_trainer', threshold: 50, name: 'Rising Collector' },
  { key: 'pokemon_trainer', threshold: 100, name: 'Card Champion' },
  { key: 'elite_collector', threshold: 250, name: 'Elite Collector' },
  { key: 'pokemon_master', threshold: 500, name: 'Grand Champion' },
  { key: 'legendary_collector', threshold: 1000, name: 'Legendary Collector' },
] as const;

/**
 * Determines which milestone badges should be awarded based on card count.
 * Returns badge keys to award (new badges only, excludes already earned).
 */
export function getMilestoneBadgesToAward(
  totalUniqueCards: number,
  alreadyEarned: string[] = []
): string[] {
  const earnedSet = new Set(alreadyEarned);
  const badgesToAward: string[] = [];

  for (const milestone of MILESTONE_BADGE_DEFINITIONS) {
    if (totalUniqueCards >= milestone.threshold && !earnedSet.has(milestone.key)) {
      badgesToAward.push(milestone.key);
    }
  }

  return badgesToAward;
}

/**
 * Gets milestone progress summary for display.
 * Takes total unique cards and list of already earned badge keys.
 */
export function getMilestoneProgressSummary(
  totalUniqueCards: number,
  earnedBadgeKeys: string[] = []
): MilestoneProgressSummary {
  const earnedSet = new Set(earnedBadgeKeys);

  const milestones: MilestoneProgress[] = MILESTONE_BADGE_DEFINITIONS.map((milestone) => {
    const earned = earnedSet.has(milestone.key);
    return {
      key: milestone.key,
      name: milestone.name,
      threshold: milestone.threshold,
      earned,
      progress: Math.min(100, Math.round((totalUniqueCards / milestone.threshold) * 100)),
      cardsNeeded: earned ? 0 : Math.max(0, milestone.threshold - totalUniqueCards),
    };
  });

  // Find current milestone (highest earned)
  const currentMilestone = [...MILESTONE_BADGE_DEFINITIONS]
    .reverse()
    .find((m) => totalUniqueCards >= m.threshold);

  // Find next milestone
  const nextMilestone = MILESTONE_BADGE_DEFINITIONS.find((m) => totalUniqueCards < m.threshold);

  return {
    totalUniqueCards,
    milestones,
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
    totalMilestonesEarned: earnedBadgeKeys.filter((k) =>
      MILESTONE_BADGE_DEFINITIONS.some((m) => m.key === k)
    ).length,
    totalMilestonesAvailable: MILESTONE_BADGE_DEFINITIONS.length,
  };
}

/**
 * Gets the milestone badge definition for a given key.
 */
export function getMilestoneBadgeDefinition(
  key: string
): { key: string; name: string; threshold: number } | null {
  const milestone = MILESTONE_BADGE_DEFINITIONS.find((m) => m.key === key);
  return milestone ? { key: milestone.key, name: milestone.name, threshold: milestone.threshold } : null;
}

/**
 * Gets the current milestone title based on card count.
 * Returns a friendly name like "Rising Trainer" for display.
 */
export function getCurrentMilestoneTitle(totalUniqueCards: number): string {
  const currentMilestone = [...MILESTONE_BADGE_DEFINITIONS]
    .reverse()
    .find((m) => totalUniqueCards >= m.threshold);
  return currentMilestone?.name ?? 'New Collector';
}

/**
 * Calculates how many more cards are needed to reach a specific milestone.
 */
export function cardsNeededForMilestone(totalUniqueCards: number, milestoneKey: string): number {
  const milestone = MILESTONE_BADGE_DEFINITIONS.find((m) => m.key === milestoneKey);
  if (!milestone) return 0;
  return Math.max(0, milestone.threshold - totalUniqueCards);
}

/**
 * Gets percentage progress toward a specific milestone.
 */
export function getMilestonePercentProgress(totalUniqueCards: number, milestoneKey: string): number {
  const milestone = MILESTONE_BADGE_DEFINITIONS.find((m) => m.key === milestoneKey);
  if (!milestone) return 0;
  return Math.min(100, Math.round((totalUniqueCards / milestone.threshold) * 100));
}

/**
 * Checks if a specific milestone has been reached.
 */
export function hasMilestoneBeenReached(totalUniqueCards: number, milestoneKey: string): boolean {
  const milestone = MILESTONE_BADGE_DEFINITIONS.find((m) => m.key === milestoneKey);
  if (!milestone) return false;
  return totalUniqueCards >= milestone.threshold;
}

/**
 * Gets all milestone keys that should be earned at a given card count.
 */
export function getAllEarnedMilestoneKeys(totalUniqueCards: number): string[] {
  return MILESTONE_BADGE_DEFINITIONS.filter((m) => totalUniqueCards >= m.threshold).map((m) => m.key);
}

/**
 * Gets the number of milestones earned at a given card count.
 */
export function countEarnedMilestones(totalUniqueCards: number): number {
  return MILESTONE_BADGE_DEFINITIONS.filter((m) => totalUniqueCards >= m.threshold).length;
}

// ============================================================================
// TYPE SPECIALIST BADGE UTILITIES
// ============================================================================

export interface TypeSpecialistProgress {
  type: string;
  key: string;
  name: string;
  count: number;
  threshold: number;
  earned: boolean;
  remaining: number;
  progress: number;
}

export interface TypeSpecialistProgressSummary {
  typeCounts: Record<string, number>;
  typeProgress: TypeSpecialistProgress[];
  nearbyBadges: TypeSpecialistProgress[];
  earnedBadges: TypeSpecialistProgress[];
  totalTypeBadgesEarned: number;
  totalTypeBadgesAvailable: number;
}

/**
 * Type specialist badge definitions with names for display
 */
export const TYPE_SPECIALIST_BADGE_DEFINITIONS = [
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

/**
 * Determines which type specialist badges should be awarded based on type counts.
 * Returns badge keys to award (new badges only, excludes already earned).
 */
export function getTypeSpecialistBadgesToAward(
  typeCounts: Record<string, number>,
  alreadyEarned: string[] = []
): string[] {
  const earnedSet = new Set(alreadyEarned);
  const badgesToAward: string[] = [];

  for (const badge of TYPE_SPECIALIST_BADGE_DEFINITIONS) {
    const count = typeCounts[badge.type] ?? 0;
    if (count >= TYPE_SPECIALIST_THRESHOLD && !earnedSet.has(badge.key)) {
      badgesToAward.push(badge.key);
    }
  }

  return badgesToAward;
}

/**
 * Gets type specialist progress summary for display.
 * Takes type counts and list of already earned badge keys.
 */
export function getTypeSpecialistProgressSummary(
  typeCounts: Record<string, number>,
  earnedBadgeKeys: string[] = []
): TypeSpecialistProgressSummary {
  const earnedSet = new Set(earnedBadgeKeys);

  const typeProgress: TypeSpecialistProgress[] = TYPE_SPECIALIST_BADGE_DEFINITIONS.map((badge) => {
    const count = typeCounts[badge.type] ?? 0;
    const earned = earnedSet.has(badge.key);
    return {
      type: badge.type,
      key: badge.key,
      name: badge.name,
      count,
      threshold: TYPE_SPECIALIST_THRESHOLD,
      earned,
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

  // Find earned badges
  const earnedBadges = typeProgress.filter((t) => t.earned);

  return {
    typeCounts,
    typeProgress: sortedByProgress,
    nearbyBadges,
    earnedBadges,
    totalTypeBadgesEarned: earnedBadges.length,
    totalTypeBadgesAvailable: TYPE_SPECIALIST_BADGE_DEFINITIONS.length,
  };
}

/**
 * Gets the type specialist badge definition for a given key.
 */
export function getTypeSpecialistBadgeDefinition(
  key: string
): { type: string; key: string; name: string } | null {
  const badge = TYPE_SPECIALIST_BADGE_DEFINITIONS.find((b) => b.key === key);
  return badge ? { type: badge.type, key: badge.key, name: badge.name } : null;
}

/**
 * Gets the type specialist badge definition for a given Pokemon type.
 */
export function getTypeSpecialistBadgeForType(
  pokemonType: string
): { type: string; key: string; name: string } | null {
  const badge = TYPE_SPECIALIST_BADGE_DEFINITIONS.find((b) => b.type === pokemonType);
  return badge ? { type: badge.type, key: badge.key, name: badge.name } : null;
}

/**
 * Calculates how many more cards of a type are needed to earn the badge.
 */
export function cardsNeededForTypeSpecialist(typeCount: number): number {
  return Math.max(0, TYPE_SPECIALIST_THRESHOLD - typeCount);
}

/**
 * Gets percentage progress toward a specific type specialist badge.
 */
export function getTypeSpecialistPercentProgress(typeCount: number): number {
  return Math.min(100, Math.round((typeCount / TYPE_SPECIALIST_THRESHOLD) * 100));
}

/**
 * Checks if a type specialist badge has been earned for a given count.
 */
export function hasTypeSpecialistBeenEarned(typeCount: number): boolean {
  return typeCount >= TYPE_SPECIALIST_THRESHOLD;
}

/**
 * Gets all type specialist badge keys that should be earned based on type counts.
 */
export function getAllEarnedTypeSpecialistKeys(typeCounts: Record<string, number>): string[] {
  return TYPE_SPECIALIST_BADGE_DEFINITIONS.filter(
    (badge) => (typeCounts[badge.type] ?? 0) >= TYPE_SPECIALIST_THRESHOLD
  ).map((badge) => badge.key);
}

/**
 * Gets the number of type specialist badges earned based on type counts.
 */
export function countEarnedTypeSpecialistBadges(typeCounts: Record<string, number>): number {
  return TYPE_SPECIALIST_BADGE_DEFINITIONS.filter(
    (badge) => (typeCounts[badge.type] ?? 0) >= TYPE_SPECIALIST_THRESHOLD
  ).length;
}

/**
 * Counts cards by type from a list of cards with type information.
 * Each card can have multiple types, and each type is counted.
 */
export function countCardsByType(cards: Array<{ types: string[] }>): Record<string, number> {
  const typeCounts: Record<string, number> = {};
  for (const card of cards) {
    for (const type of card.types) {
      typeCounts[type] = (typeCounts[type] ?? 0) + 1;
    }
  }
  return typeCounts;
}

/**
 * Gets the types that are closest to earning a badge (sorted by remaining count).
 */
export function getNearbyTypeSpecialistBadges(
  typeCounts: Record<string, number>,
  earnedBadgeKeys: string[] = []
): Array<{ type: string; key: string; name: string; count: number; remaining: number }> {
  const earnedSet = new Set(earnedBadgeKeys);

  return TYPE_SPECIALIST_BADGE_DEFINITIONS.filter((badge) => {
    const count = typeCounts[badge.type] ?? 0;
    return count > 0 && count < TYPE_SPECIALIST_THRESHOLD && !earnedSet.has(badge.key);
  })
    .map((badge) => {
      const count = typeCounts[badge.type] ?? 0;
      return {
        type: badge.type,
        key: badge.key,
        name: badge.name,
        count,
        remaining: TYPE_SPECIALIST_THRESHOLD - count,
      };
    })
    .sort((a, b) => a.remaining - b.remaining);
}

/**
 * Gets the dominant type (type with most cards) from type counts.
 */
export function getDominantType(typeCounts: Record<string, number>): string | null {
  let maxType: string | null = null;
  let maxCount = 0;

  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      maxType = type;
    }
  }

  return maxType;
}

/**
 * Gets the type distribution as percentages.
 */
export function getTypeDistribution(
  typeCounts: Record<string, number>
): Array<{ type: string; count: number; percentage: number }> {
  const totalCards = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);
  if (totalCards === 0) return [];

  return Object.entries(typeCounts)
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / totalCards) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

// ============================================================================
// POKEMON FAN BADGE UTILITIES
// ============================================================================

export interface PokemonFanProgress {
  pokemon: string;
  key: string;
  name: string;
  count: number;
  threshold: number;
  earned: boolean;
  remaining: number;
  progress: number;
}

export interface PokemonFanProgressSummary {
  pokemonCounts: Record<string, number>;
  pokemonProgress: PokemonFanProgress[];
  nearbyBadges: PokemonFanProgress[];
  earnedBadges: PokemonFanProgress[];
  totalPokemonFanBadgesEarned: number;
  totalPokemonFanBadgesAvailable: number;
}

/**
 * Pokemon fan badge definitions with names for display
 */
export const POKEMON_FAN_BADGE_DEFINITIONS = [
  { pokemon: 'Pikachu', key: 'pikachu_fan', name: 'Pikachu Fan', threshold: 5 },
  { pokemon: 'Eevee', key: 'eevee_fan', name: 'Eevee Fan', threshold: 5 },
  { pokemon: 'Charizard', key: 'charizard_fan', name: 'Charizard Fan', threshold: 3 },
  { pokemon: 'Mewtwo', key: 'mewtwo_fan', name: 'Mewtwo Fan', threshold: 3 },
  { pokemon: 'Legendary', key: 'legendary_fan', name: 'Legendary Fan', threshold: 10 },
] as const;

/**
 * Eeveelutions for the Eevee fan badge
 */
export const EEVEELUTIONS = [
  'Eevee',
  'Vaporeon',
  'Jolteon',
  'Flareon',
  'Espeon',
  'Umbreon',
  'Leafeon',
  'Glaceon',
  'Sylveon',
] as const;

/**
 * Legendary Pokemon list (common legendaries and mythicals)
 */
export const LEGENDARY_POKEMON = [
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
] as const;

/**
 * Checks if a card name matches a target Pokemon name.
 * Handles variations like "Pikachu V", "Pikachu VMAX", "Pikachu ex", etc.
 */
export function matchesPokemonName(cardName: string, targetPokemon: string): boolean {
  const normalizedCard = cardName.toLowerCase();
  const normalizedTarget = targetPokemon.toLowerCase();
  return (
    normalizedCard === normalizedTarget ||
    normalizedCard.startsWith(normalizedTarget + ' ')
  );
}

/**
 * Checks if a card name is an Eeveelution (Eevee or any of its evolutions).
 */
export function isEeveelution(cardName: string): boolean {
  return EEVEELUTIONS.some((eeveelution) => matchesPokemonName(cardName, eeveelution));
}

/**
 * Checks if a card name is a Legendary Pokemon.
 */
export function isLegendaryPokemon(cardName: string): boolean {
  return LEGENDARY_POKEMON.some((legendary) => matchesPokemonName(cardName, legendary));
}

/**
 * Counts Pokemon cards by category from a list of card names.
 * Returns counts for Pikachu, Eevee (including eeveelutions), Charizard, Mewtwo, and Legendary.
 */
export function countPokemonByCategory(cardNames: string[]): Record<string, number> {
  const counts: Record<string, number> = {
    Pikachu: 0,
    Eevee: 0,
    Charizard: 0,
    Mewtwo: 0,
    Legendary: 0,
  };

  for (const cardName of cardNames) {
    if (matchesPokemonName(cardName, 'Pikachu')) {
      counts.Pikachu++;
    }
    if (isEeveelution(cardName)) {
      counts.Eevee++;
    }
    if (matchesPokemonName(cardName, 'Charizard')) {
      counts.Charizard++;
    }
    if (matchesPokemonName(cardName, 'Mewtwo')) {
      counts.Mewtwo++;
    }
    if (isLegendaryPokemon(cardName)) {
      counts.Legendary++;
    }
  }

  return counts;
}

/**
 * Determines which Pokemon fan badges should be awarded based on counts.
 * Returns badge keys to award (new badges only, excludes already earned).
 */
export function getPokemonFanBadgesToAward(
  pokemonCounts: Record<string, number>,
  alreadyEarned: string[] = []
): string[] {
  const earnedSet = new Set(alreadyEarned);
  const badgesToAward: string[] = [];

  for (const badge of POKEMON_FAN_BADGE_DEFINITIONS) {
    const count = pokemonCounts[badge.pokemon] ?? 0;
    if (count >= badge.threshold && !earnedSet.has(badge.key)) {
      badgesToAward.push(badge.key);
    }
  }

  return badgesToAward;
}

/**
 * Gets Pokemon fan progress summary for display.
 * Takes Pokemon counts and list of already earned badge keys.
 */
export function getPokemonFanProgressSummary(
  pokemonCounts: Record<string, number>,
  earnedBadgeKeys: string[] = []
): PokemonFanProgressSummary {
  const earnedSet = new Set(earnedBadgeKeys);

  const pokemonProgress: PokemonFanProgress[] = POKEMON_FAN_BADGE_DEFINITIONS.map((badge) => {
    const count = pokemonCounts[badge.pokemon] ?? 0;
    const earned = earnedSet.has(badge.key);
    return {
      pokemon: badge.pokemon,
      key: badge.key,
      name: badge.name,
      count,
      threshold: badge.threshold,
      earned,
      remaining: earned ? 0 : Math.max(0, badge.threshold - count),
      progress: Math.min(100, Math.round((count / badge.threshold) * 100)),
    };
  });

  // Sort by progress descending (closest to earning first), then alphabetically
  const sortedByProgress = [...pokemonProgress].sort((a, b) => {
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    if (b.progress !== a.progress) return b.progress - a.progress;
    return a.pokemon.localeCompare(b.pokemon);
  });

  // Find nearby badges (pokemon with at least 1 card but not earned)
  const nearbyBadges = pokemonProgress
    .filter((p) => p.count > 0 && !p.earned)
    .sort((a, b) => a.remaining - b.remaining);

  // Find earned badges
  const earnedBadges = pokemonProgress.filter((p) => p.earned);

  return {
    pokemonCounts,
    pokemonProgress: sortedByProgress,
    nearbyBadges,
    earnedBadges,
    totalPokemonFanBadgesEarned: earnedBadges.length,
    totalPokemonFanBadgesAvailable: POKEMON_FAN_BADGE_DEFINITIONS.length,
  };
}

/**
 * Gets the Pokemon fan badge definition for a given key.
 */
export function getPokemonFanBadgeDefinition(
  key: string
): { pokemon: string; key: string; name: string; threshold: number } | null {
  const badge = POKEMON_FAN_BADGE_DEFINITIONS.find((b) => b.key === key);
  return badge
    ? { pokemon: badge.pokemon, key: badge.key, name: badge.name, threshold: badge.threshold }
    : null;
}

/**
 * Gets the Pokemon fan badge definition for a given Pokemon category.
 */
export function getPokemonFanBadgeForPokemon(
  pokemon: string
): { pokemon: string; key: string; name: string; threshold: number } | null {
  const badge = POKEMON_FAN_BADGE_DEFINITIONS.find((b) => b.pokemon === pokemon);
  return badge
    ? { pokemon: badge.pokemon, key: badge.key, name: badge.name, threshold: badge.threshold }
    : null;
}

/**
 * Calculates how many more cards of a Pokemon are needed to earn the badge.
 */
export function cardsNeededForPokemonFan(pokemonCount: number, pokemonCategory: string): number {
  const badge = POKEMON_FAN_BADGE_DEFINITIONS.find((b) => b.pokemon === pokemonCategory);
  if (!badge) return 0;
  return Math.max(0, badge.threshold - pokemonCount);
}

/**
 * Gets percentage progress toward a specific Pokemon fan badge.
 */
export function getPokemonFanPercentProgress(pokemonCount: number, pokemonCategory: string): number {
  const badge = POKEMON_FAN_BADGE_DEFINITIONS.find((b) => b.pokemon === pokemonCategory);
  if (!badge) return 0;
  return Math.min(100, Math.round((pokemonCount / badge.threshold) * 100));
}

/**
 * Checks if a Pokemon fan badge has been earned for a given count and category.
 */
export function hasPokemonFanBeenEarned(pokemonCount: number, pokemonCategory: string): boolean {
  const badge = POKEMON_FAN_BADGE_DEFINITIONS.find((b) => b.pokemon === pokemonCategory);
  if (!badge) return false;
  return pokemonCount >= badge.threshold;
}

/**
 * Gets all Pokemon fan badge keys that should be earned based on counts.
 */
export function getAllEarnedPokemonFanKeys(pokemonCounts: Record<string, number>): string[] {
  return POKEMON_FAN_BADGE_DEFINITIONS.filter(
    (badge) => (pokemonCounts[badge.pokemon] ?? 0) >= badge.threshold
  ).map((badge) => badge.key);
}

/**
 * Gets the number of Pokemon fan badges earned based on counts.
 */
export function countEarnedPokemonFanBadges(pokemonCounts: Record<string, number>): number {
  return POKEMON_FAN_BADGE_DEFINITIONS.filter(
    (badge) => (pokemonCounts[badge.pokemon] ?? 0) >= badge.threshold
  ).length;
}

/**
 * Gets the Pokemon that are closest to earning a badge (sorted by remaining count).
 */
export function getNearbyPokemonFanBadges(
  pokemonCounts: Record<string, number>,
  earnedBadgeKeys: string[] = []
): Array<{ pokemon: string; key: string; name: string; count: number; remaining: number }> {
  const earnedSet = new Set(earnedBadgeKeys);

  return POKEMON_FAN_BADGE_DEFINITIONS.filter((badge) => {
    const count = pokemonCounts[badge.pokemon] ?? 0;
    return count > 0 && count < badge.threshold && !earnedSet.has(badge.key);
  })
    .map((badge) => {
      const count = pokemonCounts[badge.pokemon] ?? 0;
      return {
        pokemon: badge.pokemon,
        key: badge.key,
        name: badge.name,
        count,
        remaining: badge.threshold - count,
      };
    })
    .sort((a, b) => a.remaining - b.remaining);
}

/**
 * Gets all Pokemon categories that have associated fan badges.
 */
export function getPokemonWithFanBadges(): string[] {
  return POKEMON_FAN_BADGE_DEFINITIONS.map((b) => b.pokemon);
}

// ============================================================================
// STREAK BADGE UTILITIES
// ============================================================================

export interface StreakProgress {
  key: string;
  name: string;
  threshold: number;
  earned: boolean;
  daysNeeded: number;
  progress: number;
}

export interface StreakProgressSummary {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  lastActiveDate: string | null;
  streakBadges: StreakProgress[];
  currentBadge: { key: string; name: string; threshold: number } | null;
  nextBadge: {
    key: string;
    name: string;
    threshold: number;
    daysNeeded: number;
    percentProgress: number;
  } | null;
  totalStreakBadgesEarned: number;
  totalStreakBadgesAvailable: number;
}

/**
 * Streak badge definitions with names for display
 */
export const STREAK_BADGE_DEFINITIONS = [
  { key: 'streak_3', threshold: 3, name: '3-Day Streak' },
  { key: 'streak_7', threshold: 7, name: 'Week Warrior' },
  { key: 'streak_14', threshold: 14, name: 'Dedicated Collector' },
  { key: 'streak_30', threshold: 30, name: 'Monthly Master' },
] as const;

/**
 * Determines which streak badges should be awarded based on current streak.
 * Returns badge keys to award (new badges only, excludes already earned).
 */
export function getStreakBadgesToAward(
  currentStreak: number,
  alreadyEarned: string[] = []
): string[] {
  const earnedSet = new Set(alreadyEarned);
  const badgesToAward: string[] = [];

  for (const badge of STREAK_BADGE_DEFINITIONS) {
    if (currentStreak >= badge.threshold && !earnedSet.has(badge.key)) {
      badgesToAward.push(badge.key);
    }
  }

  return badgesToAward;
}

/**
 * Gets streak progress summary for display.
 * Takes current streak, longest streak, and list of already earned badge keys.
 */
export function getStreakProgressSummary(
  currentStreak: number,
  longestStreak: number,
  isActiveToday: boolean,
  lastActiveDate: string | null,
  earnedBadgeKeys: string[] = []
): StreakProgressSummary {
  const earnedSet = new Set(earnedBadgeKeys);

  const streakBadges: StreakProgress[] = STREAK_BADGE_DEFINITIONS.map((badge) => {
    const earned = earnedSet.has(badge.key);
    return {
      key: badge.key,
      name: badge.name,
      threshold: badge.threshold,
      earned,
      daysNeeded: earned ? 0 : Math.max(0, badge.threshold - currentStreak),
      progress: Math.min(100, Math.round((currentStreak / badge.threshold) * 100)),
    };
  });

  // Find current badge (highest earned based on current streak)
  const currentBadge = [...STREAK_BADGE_DEFINITIONS]
    .reverse()
    .find((b) => currentStreak >= b.threshold);

  // Find next badge
  const nextBadge = STREAK_BADGE_DEFINITIONS.find((b) => currentStreak < b.threshold);

  return {
    currentStreak,
    longestStreak,
    isActiveToday,
    lastActiveDate,
    streakBadges,
    currentBadge: currentBadge
      ? { key: currentBadge.key, name: currentBadge.name, threshold: currentBadge.threshold }
      : null,
    nextBadge: nextBadge
      ? {
          key: nextBadge.key,
          name: nextBadge.name,
          threshold: nextBadge.threshold,
          daysNeeded: nextBadge.threshold - currentStreak,
          percentProgress: Math.round((currentStreak / nextBadge.threshold) * 100),
        }
      : null,
    totalStreakBadgesEarned: earnedBadgeKeys.filter((k) =>
      STREAK_BADGE_DEFINITIONS.some((b) => b.key === k)
    ).length,
    totalStreakBadgesAvailable: STREAK_BADGE_DEFINITIONS.length,
  };
}

/**
 * Gets the streak badge definition for a given key.
 */
export function getStreakBadgeDefinition(
  key: string
): { key: string; name: string; threshold: number } | null {
  const badge = STREAK_BADGE_DEFINITIONS.find((b) => b.key === key);
  return badge ? { key: badge.key, name: badge.name, threshold: badge.threshold } : null;
}

/**
 * Gets the current streak badge title based on streak count.
 * Returns a friendly name like "Week Warrior" for display.
 */
export function getCurrentStreakTitle(currentStreak: number): string {
  const currentBadge = [...STREAK_BADGE_DEFINITIONS]
    .reverse()
    .find((b) => currentStreak >= b.threshold);
  return currentBadge?.name ?? 'No Streak';
}

/**
 * Calculates how many more days are needed to reach a specific streak badge.
 */
export function daysNeededForStreakBadge(currentStreak: number, badgeKey: string): number {
  const badge = STREAK_BADGE_DEFINITIONS.find((b) => b.key === badgeKey);
  if (!badge) return 0;
  return Math.max(0, badge.threshold - currentStreak);
}

/**
 * Gets percentage progress toward a specific streak badge.
 */
export function getStreakPercentProgress(currentStreak: number, badgeKey: string): number {
  const badge = STREAK_BADGE_DEFINITIONS.find((b) => b.key === badgeKey);
  if (!badge) return 0;
  return Math.min(100, Math.round((currentStreak / badge.threshold) * 100));
}

/**
 * Checks if a specific streak badge has been earned.
 */
export function hasStreakBadgeBeenEarned(currentStreak: number, badgeKey: string): boolean {
  const badge = STREAK_BADGE_DEFINITIONS.find((b) => b.key === badgeKey);
  if (!badge) return false;
  return currentStreak >= badge.threshold;
}

/**
 * Gets all streak badge keys that should be earned at a given streak count.
 */
export function getAllEarnedStreakKeys(currentStreak: number): string[] {
  return STREAK_BADGE_DEFINITIONS.filter((b) => currentStreak >= b.threshold).map((b) => b.key);
}

/**
 * Gets the number of streak badges earned at a given streak count.
 */
export function countEarnedStreakBadges(currentStreak: number): number {
  return STREAK_BADGE_DEFINITIONS.filter((b) => currentStreak >= b.threshold).length;
}

/**
 * Gets the next streak badge to earn.
 */
export function getNextStreakBadge(
  currentStreak: number
): { key: string; name: string; threshold: number; daysNeeded: number } | null {
  const nextBadge = STREAK_BADGE_DEFINITIONS.find((b) => currentStreak < b.threshold);
  if (!nextBadge) return null;

  return {
    key: nextBadge.key,
    name: nextBadge.name,
    threshold: nextBadge.threshold,
    daysNeeded: nextBadge.threshold - currentStreak,
  };
}

/**
 * Gets all streak badge thresholds.
 */
export function getStreakBadgeThresholds(): number[] {
  return STREAK_BADGE_DEFINITIONS.map((b) => b.threshold);
}

/**
 * Checks if a streak is currently active (today or yesterday).
 */
export function isStreakActive(lastActiveDate: string | null): boolean {
  if (!lastActiveDate) return false;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return lastActiveDate === today || lastActiveDate === yesterday;
}

/**
 * Gets streak status message based on current state.
 */
export function getStreakStatusMessage(
  currentStreak: number,
  isActiveToday: boolean
): string {
  if (currentStreak === 0) {
    return 'Start your streak by adding a card today!';
  }

  if (isActiveToday) {
    if (currentStreak === 1) {
      return 'Great start! Come back tomorrow to continue your streak.';
    }
    return `${currentStreak}-day streak! Come back tomorrow to keep it going.`;
  }

  // Active yesterday but not today
  if (currentStreak === 1) {
    return 'Add a card today to continue your streak!';
  }
  return `${currentStreak}-day streak at risk! Add a card today to keep it going.`;
}

/**
 * Formats a streak count for display (e.g., "7 days", "1 day").
 */
export function formatStreakCount(days: number): string {
  if (days === 0) return 'No streak';
  if (days === 1) return '1 day';
  return `${days} days`;
}

// ============================================================================
// DATE TRACKING UTILITIES
// ============================================================================

export interface AchievementWithDate extends EarnedAchievement {
  formattedDate: string;
  relativeDate: string;
}

export interface AchievementTimeline {
  date: string;
  formattedDate: string;
  achievements: EarnedAchievement[];
  count: number;
}

export interface EarnedDateInfo {
  earnedAt: number;
  formattedDate: string;
  relativeDate: string;
  daysSinceEarned: number;
  isToday: boolean;
  isThisWeek: boolean;
  isThisMonth: boolean;
}

/**
 * Gets detailed earned date information for an achievement.
 */
export function getEarnedDateInfo(earnedAt: number): EarnedDateInfo {
  const now = Date.now();
  const diff = now - earnedAt;
  const daysSinceEarned = Math.floor(diff / (24 * 60 * 60 * 1000));

  const earnedDate = new Date(earnedAt);
  const today = new Date();

  // Check if earned today
  const isToday =
    earnedDate.getFullYear() === today.getFullYear() &&
    earnedDate.getMonth() === today.getMonth() &&
    earnedDate.getDate() === today.getDate();

  // Check if earned this week (within last 7 days)
  const isThisWeek = daysSinceEarned < 7;

  // Check if earned this month
  const isThisMonth =
    earnedDate.getFullYear() === today.getFullYear() &&
    earnedDate.getMonth() === today.getMonth();

  return {
    earnedAt,
    formattedDate: formatEarnedDate(earnedAt),
    relativeDate: formatEarnedDateRelative(earnedAt),
    daysSinceEarned,
    isToday,
    isThisWeek,
    isThisMonth,
  };
}

/**
 * Enriches achievements with date information.
 */
export function enrichAchievementsWithDates(
  achievements: EarnedAchievement[]
): AchievementWithDate[] {
  return achievements.map((achievement) => ({
    ...achievement,
    formattedDate: formatEarnedDate(achievement.earnedAt),
    relativeDate: formatEarnedDateRelative(achievement.earnedAt),
  }));
}

/**
 * Groups achievements by the date they were earned.
 * Returns an array of date groups sorted by date descending (newest first).
 */
export function groupAchievementsByDate(
  achievements: EarnedAchievement[]
): AchievementTimeline[] {
  // Group by date string (YYYY-MM-DD)
  const byDate = new Map<string, EarnedAchievement[]>();

  for (const achievement of achievements) {
    const dateStr = new Date(achievement.earnedAt).toISOString().split('T')[0];
    if (!byDate.has(dateStr)) {
      byDate.set(dateStr, []);
    }
    byDate.get(dateStr)!.push(achievement);
  }

  // Convert to array and sort by date descending
  const timeline: AchievementTimeline[] = Array.from(byDate.entries())
    .map(([date, dateAchievements]) => ({
      date,
      formattedDate: formatEarnedDate(dateAchievements[0].earnedAt),
      achievements: dateAchievements.sort((a, b) => b.earnedAt - a.earnedAt),
      count: dateAchievements.length,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return timeline;
}

/**
 * Gets achievements earned within a specific date range.
 */
export function filterAchievementsByDateRange(
  achievements: EarnedAchievement[],
  startDate: Date,
  endDate: Date
): EarnedAchievement[] {
  const startTs = startDate.getTime();
  const endTs = endDate.getTime();

  return achievements.filter(
    (a) => a.earnedAt >= startTs && a.earnedAt <= endTs
  );
}

/**
 * Gets achievements earned in the last N days.
 */
export function getRecentAchievements(
  achievements: EarnedAchievement[],
  days: number
): EarnedAchievement[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return achievements
    .filter((a) => a.earnedAt >= cutoff)
    .sort((a, b) => b.earnedAt - a.earnedAt);
}

/**
 * Gets the most recently earned achievement.
 */
export function getMostRecentAchievement(
  achievements: EarnedAchievement[]
): EarnedAchievement | null {
  if (achievements.length === 0) return null;

  return achievements.reduce((most, current) =>
    current.earnedAt > most.earnedAt ? current : most
  );
}

/**
 * Gets the first (oldest) earned achievement.
 */
export function getFirstEarnedAchievement(
  achievements: EarnedAchievement[]
): EarnedAchievement | null {
  if (achievements.length === 0) return null;

  return achievements.reduce((first, current) =>
    current.earnedAt < first.earnedAt ? current : first
  );
}

/**
 * Gets achievements earned today.
 */
export function getAchievementsEarnedToday(
  achievements: EarnedAchievement[]
): EarnedAchievement[] {
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;

  return achievements.filter(
    (a) => a.earnedAt >= startOfDay && a.earnedAt <= endOfDay
  );
}

/**
 * Gets achievements earned this week (last 7 days).
 */
export function getAchievementsEarnedThisWeek(
  achievements: EarnedAchievement[]
): EarnedAchievement[] {
  return getRecentAchievements(achievements, 7);
}

/**
 * Gets achievements earned this month.
 */
export function getAchievementsEarnedThisMonth(
  achievements: EarnedAchievement[]
): EarnedAchievement[] {
  const today = new Date();
  const startOfMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  ).getTime();

  return achievements
    .filter((a) => a.earnedAt >= startOfMonth)
    .sort((a, b) => b.earnedAt - a.earnedAt);
}

/**
 * Calculates the average time between achievements (in days).
 * Returns null if there are fewer than 2 achievements.
 */
export function getAverageTimeBetweenAchievements(
  achievements: EarnedAchievement[]
): number | null {
  if (achievements.length < 2) return null;

  const sorted = [...achievements].sort((a, b) => a.earnedAt - b.earnedAt);
  let totalDiff = 0;

  for (let i = 1; i < sorted.length; i++) {
    totalDiff += sorted[i].earnedAt - sorted[i - 1].earnedAt;
  }

  const avgMs = totalDiff / (sorted.length - 1);
  return Math.round(avgMs / (24 * 60 * 60 * 1000) * 10) / 10; // Round to 1 decimal
}

/**
 * Gets achievement earning statistics.
 */
export interface AchievementDateStats {
  totalAchievements: number;
  firstEarnedDate: string | null;
  mostRecentDate: string | null;
  achievementsToday: number;
  achievementsThisWeek: number;
  achievementsThisMonth: number;
  averageDaysBetween: number | null;
  uniqueDaysWithAchievements: number;
}

export function getAchievementDateStats(
  achievements: EarnedAchievement[]
): AchievementDateStats {
  const first = getFirstEarnedAchievement(achievements);
  const mostRecent = getMostRecentAchievement(achievements);
  const today = getAchievementsEarnedToday(achievements);
  const thisWeek = getAchievementsEarnedThisWeek(achievements);
  const thisMonth = getAchievementsEarnedThisMonth(achievements);
  const avgDays = getAverageTimeBetweenAchievements(achievements);

  // Count unique days
  const uniqueDays = new Set<string>();
  for (const a of achievements) {
    const dateStr = new Date(a.earnedAt).toISOString().split('T')[0];
    uniqueDays.add(dateStr);
  }

  return {
    totalAchievements: achievements.length,
    firstEarnedDate: first ? formatEarnedDate(first.earnedAt) : null,
    mostRecentDate: mostRecent ? formatEarnedDate(mostRecent.earnedAt) : null,
    achievementsToday: today.length,
    achievementsThisWeek: thisWeek.length,
    achievementsThisMonth: thisMonth.length,
    averageDaysBetween: avgDays,
    uniqueDaysWithAchievements: uniqueDays.size,
  };
}

/**
 * Formats a date range for display (e.g., "Jan 1 - Jan 15, 2026").
 */
export function formatDateRange(startTs: number, endTs: number): string {
  const start = new Date(startTs);
  const end = new Date(endTs);

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    // Same month: "Jan 1-15, 2026"
    return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}-${end.getDate()}, ${end.getFullYear()}`;
  } else if (sameYear) {
    // Same year: "Jan 1 - Feb 15, 2026"
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${end.getFullYear()}`;
  } else {
    // Different years: "Dec 1, 2025 - Jan 15, 2026"
    return `${formatEarnedDate(startTs)} - ${formatEarnedDate(endTs)}`;
  }
}

/**
 * Gets the date string (YYYY-MM-DD) from a timestamp.
 */
export function getDateString(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

/**
 * Checks if two timestamps are on the same day.
 */
export function isSameDay(ts1: number, ts2: number): boolean {
  return getDateString(ts1) === getDateString(ts2);
}

/**
 * Gets the number of days since an achievement was earned.
 */
export function getDaysSinceEarned(earnedAt: number): number {
  const diff = Date.now() - earnedAt;
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

/**
 * Checks if an achievement was earned recently (within specified days).
 */
export function wasEarnedRecently(earnedAt: number, withinDays: number): boolean {
  return getDaysSinceEarned(earnedAt) <= withinDays;
}
