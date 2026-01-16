/**
 * Weekly Challenges System
 *
 * Themed weekly challenges like "Add 3 water-type cards this week"
 * with rewards for completion.
 */

import {
  FireIcon,
  SparklesIcon,
  BoltIcon,
  TrophyIcon,
  StarIcon,
  GlobeAltIcon,
  HeartIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/solid';
import type { ComponentType } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type ChallengeType =
  | 'type_collection' // Collect cards of a specific Pokemon type
  | 'rarity_collection' // Collect cards of a specific rarity
  | 'set_progress' // Make progress in any set
  | 'unique_cards' // Add unique cards to collection
  | 'total_cards' // Add any cards (including duplicates)
  | 'variant_collection'; // Collect specific variants (holo, reverse, etc.)

export type PokemonType =
  | 'fire'
  | 'water'
  | 'grass'
  | 'lightning'
  | 'psychic'
  | 'fighting'
  | 'darkness'
  | 'metal'
  | 'dragon'
  | 'fairy'
  | 'colorless';

export type CardRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'ultra_rare'
  | 'secret_rare';

export type CardVariant = 'normal' | 'holofoil' | 'reverseHolofoil';

export interface ChallengeDefinition {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  target: number;
  icon: ComponentType<{ className?: string }>;
  gradient: string;
  bgGradient: string;
  xpReward: number;
  /** For type_collection challenges */
  pokemonType?: PokemonType;
  /** For rarity_collection challenges */
  rarity?: CardRarity;
  /** For variant_collection challenges */
  variant?: CardVariant;
}

export interface ActiveChallenge {
  definition: ChallengeDefinition;
  progress: number;
  completed: boolean;
  weekStart: string;
}

export interface WeeklyChallengeState {
  /** Current week's active challenges */
  activeChallenges: ActiveChallenge[];
  /** Week start date for current challenges */
  currentWeekStart: string;
  /** Completed challenge IDs by week (weekStart -> challengeIds[]) */
  completedByWeek: Record<string, string[]>;
  /** Total challenges completed all-time */
  totalCompleted: number;
  /** Total XP earned from challenges */
  totalXpEarned: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const WEEKLY_CHALLENGES_STORAGE_KEY = 'carddex-weekly-challenges';

/** Number of active challenges per week */
export const CHALLENGES_PER_WEEK = 3;

/** Pokemon type display info */
export const POKEMON_TYPE_INFO: Record<
  PokemonType,
  { name: string; gradient: string; icon: ComponentType<{ className?: string }> }
> = {
  fire: { name: 'Fire', gradient: 'from-orange-400 to-red-500', icon: FireIcon },
  water: { name: 'Water', gradient: 'from-blue-400 to-cyan-500', icon: GlobeAltIcon },
  grass: { name: 'Grass', gradient: 'from-green-400 to-emerald-500', icon: SparklesIcon },
  lightning: { name: 'Lightning', gradient: 'from-yellow-400 to-amber-500', icon: BoltIcon },
  psychic: { name: 'Psychic', gradient: 'from-purple-400 to-pink-500', icon: SparklesIcon },
  fighting: { name: 'Fighting', gradient: 'from-orange-500 to-red-600', icon: ShieldCheckIcon },
  darkness: { name: 'Darkness', gradient: 'from-gray-600 to-slate-800', icon: SparklesIcon },
  metal: { name: 'Metal', gradient: 'from-gray-400 to-slate-500', icon: ShieldCheckIcon },
  dragon: { name: 'Dragon', gradient: 'from-indigo-500 to-purple-600', icon: FireIcon },
  fairy: { name: 'Fairy', gradient: 'from-pink-400 to-rose-500', icon: HeartIcon },
  colorless: { name: 'Colorless', gradient: 'from-gray-300 to-slate-400', icon: StarIcon },
};

/** Rarity display info */
export const RARITY_INFO: Record<
  CardRarity,
  { name: string; gradient: string }
> = {
  common: { name: 'Common', gradient: 'from-gray-400 to-slate-500' },
  uncommon: { name: 'Uncommon', gradient: 'from-green-400 to-emerald-500' },
  rare: { name: 'Rare', gradient: 'from-blue-400 to-indigo-500' },
  ultra_rare: { name: 'Ultra Rare', gradient: 'from-purple-400 to-pink-500' },
  secret_rare: { name: 'Secret Rare', gradient: 'from-amber-400 to-orange-500' },
};

/** Variant display info */
export const VARIANT_INFO: Record<
  CardVariant,
  { name: string; gradient: string }
> = {
  normal: { name: 'Normal', gradient: 'from-gray-400 to-slate-500' },
  holofoil: { name: 'Holofoil', gradient: 'from-purple-400 to-pink-500' },
  reverseHolofoil: { name: 'Reverse Holo', gradient: 'from-blue-400 to-cyan-500' },
};

/** All possible challenge templates */
export const CHALLENGE_TEMPLATES: ChallengeDefinition[] = [
  // Type collection challenges
  {
    id: 'fire_collector',
    name: 'Fire Collector',
    description: 'Add 3 Fire-type cards this week',
    type: 'type_collection',
    target: 3,
    pokemonType: 'fire',
    icon: FireIcon,
    gradient: 'from-orange-400 to-red-500',
    bgGradient: 'from-orange-50 to-red-50',
    xpReward: 15,
  },
  {
    id: 'water_collector',
    name: 'Water Collector',
    description: 'Add 3 Water-type cards this week',
    type: 'type_collection',
    target: 3,
    pokemonType: 'water',
    icon: GlobeAltIcon,
    gradient: 'from-blue-400 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50',
    xpReward: 15,
  },
  {
    id: 'grass_collector',
    name: 'Grass Collector',
    description: 'Add 3 Grass-type cards this week',
    type: 'type_collection',
    target: 3,
    pokemonType: 'grass',
    icon: SparklesIcon,
    gradient: 'from-green-400 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-50',
    xpReward: 15,
  },
  {
    id: 'lightning_collector',
    name: 'Lightning Collector',
    description: 'Add 3 Lightning-type cards this week',
    type: 'type_collection',
    target: 3,
    pokemonType: 'lightning',
    icon: BoltIcon,
    gradient: 'from-yellow-400 to-amber-500',
    bgGradient: 'from-yellow-50 to-amber-50',
    xpReward: 15,
  },
  {
    id: 'psychic_collector',
    name: 'Psychic Collector',
    description: 'Add 3 Psychic-type cards this week',
    type: 'type_collection',
    target: 3,
    pokemonType: 'psychic',
    icon: SparklesIcon,
    gradient: 'from-purple-400 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50',
    xpReward: 15,
  },
  {
    id: 'fighting_collector',
    name: 'Fighting Collector',
    description: 'Add 3 Fighting-type cards this week',
    type: 'type_collection',
    target: 3,
    pokemonType: 'fighting',
    icon: ShieldCheckIcon,
    gradient: 'from-orange-500 to-red-600',
    bgGradient: 'from-orange-50 to-red-50',
    xpReward: 15,
  },
  {
    id: 'dragon_collector',
    name: 'Dragon Collector',
    description: 'Add 2 Dragon-type cards this week',
    type: 'type_collection',
    target: 2,
    pokemonType: 'dragon',
    icon: FireIcon,
    gradient: 'from-indigo-500 to-purple-600',
    bgGradient: 'from-indigo-50 to-purple-50',
    xpReward: 20,
  },
  // Rarity challenges
  {
    id: 'rare_hunter',
    name: 'Rare Hunter',
    description: 'Add 2 Rare or higher cards this week',
    type: 'rarity_collection',
    target: 2,
    rarity: 'rare',
    icon: StarIcon,
    gradient: 'from-blue-400 to-indigo-500',
    bgGradient: 'from-blue-50 to-indigo-50',
    xpReward: 20,
  },
  {
    id: 'ultra_seeker',
    name: 'Ultra Seeker',
    description: 'Add 1 Ultra Rare card this week',
    type: 'rarity_collection',
    target: 1,
    rarity: 'ultra_rare',
    icon: TrophyIcon,
    gradient: 'from-purple-400 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50',
    xpReward: 30,
  },
  // General collection challenges
  {
    id: 'set_explorer',
    name: 'Set Explorer',
    description: 'Add cards from 3 different sets this week',
    type: 'set_progress',
    target: 3,
    icon: GlobeAltIcon,
    gradient: 'from-teal-400 to-emerald-500',
    bgGradient: 'from-teal-50 to-emerald-50',
    xpReward: 20,
  },
  {
    id: 'variety_collector',
    name: 'Variety Collector',
    description: 'Add 5 unique cards this week',
    type: 'unique_cards',
    target: 5,
    icon: SparklesIcon,
    gradient: 'from-indigo-400 to-violet-500',
    bgGradient: 'from-indigo-50 to-violet-50',
    xpReward: 15,
  },
  {
    id: 'card_enthusiast',
    name: 'Card Enthusiast',
    description: 'Add 10 cards this week (any cards count!)',
    type: 'total_cards',
    target: 10,
    icon: RocketLaunchIcon,
    gradient: 'from-rose-400 to-pink-500',
    bgGradient: 'from-rose-50 to-pink-50',
    xpReward: 15,
  },
  // Variant challenges
  {
    id: 'holo_hunter',
    name: 'Holo Hunter',
    description: 'Add 2 Holofoil cards this week',
    type: 'variant_collection',
    target: 2,
    variant: 'holofoil',
    icon: SparklesIcon,
    gradient: 'from-purple-400 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50',
    xpReward: 20,
  },
  {
    id: 'reverse_collector',
    name: 'Reverse Collector',
    description: 'Add 2 Reverse Holo cards this week',
    type: 'variant_collection',
    target: 2,
    variant: 'reverseHolofoil',
    icon: SparklesIcon,
    gradient: 'from-blue-400 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50',
    xpReward: 20,
  },
];

/** Default empty state */
export const DEFAULT_CHALLENGE_STATE: WeeklyChallengeState = {
  activeChallenges: [],
  currentWeekStart: '',
  completedByWeek: {},
  totalCompleted: 0,
  totalXpEarned: 0,
};

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Get the start of the current week (Sunday) as YYYY-MM-DD
 */
export function getWeekStart(date?: Date): string {
  const d = date ? new Date(date) : new Date();
  const day = d.getDay(); // 0 = Sunday
  d.setDate(d.getDate() - day);
  return d.toISOString().split('T')[0];
}

/**
 * Get the end of the current week (Saturday) as YYYY-MM-DD
 */
export function getWeekEnd(date?: Date): string {
  const d = date ? new Date(date) : new Date();
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  return d.toISOString().split('T')[0];
}

/**
 * Get days remaining in the current week
 */
export function getDaysRemainingInWeek(): number {
  const today = new Date();
  const dayOfWeek = today.getDay();
  return 6 - dayOfWeek; // Days until Saturday
}

/**
 * Check if we're in a new week compared to stored week
 */
export function isNewWeek(storedWeekStart: string): boolean {
  const currentWeekStart = getWeekStart();
  return currentWeekStart !== storedWeekStart;
}

// ============================================================================
// CHALLENGE SELECTION
// ============================================================================

/**
 * Seeded random number generator for consistent weekly challenges
 */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/**
 * Generate a seed from a week start date
 */
function weekSeed(weekStart: string): number {
  let hash = 0;
  for (let i = 0; i < weekStart.length; i++) {
    const char = weekStart.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Select challenges for a given week (deterministic based on week)
 */
export function selectWeeklyChallenges(weekStart: string): ChallengeDefinition[] {
  const random = seededRandom(weekSeed(weekStart));
  const shuffled = [...CHALLENGE_TEMPLATES].sort(() => random() - 0.5);

  // Ensure variety - try to get different challenge types
  const selected: ChallengeDefinition[] = [];
  const usedTypes = new Set<ChallengeType>();

  for (const challenge of shuffled) {
    if (selected.length >= CHALLENGES_PER_WEEK) break;

    // Prefer different types, but allow duplicates if needed
    if (!usedTypes.has(challenge.type) || selected.length >= CHALLENGES_PER_WEEK - 1) {
      selected.push(challenge);
      usedTypes.add(challenge.type);
    }
  }

  // Fill remaining slots if needed
  while (selected.length < CHALLENGES_PER_WEEK) {
    const remaining = shuffled.filter((c) => !selected.includes(c));
    if (remaining.length > 0) {
      selected.push(remaining[0]);
    } else {
      break;
    }
  }

  return selected.slice(0, CHALLENGES_PER_WEEK);
}

/**
 * Initialize active challenges for a week
 */
export function initializeWeeklyChallenges(weekStart: string): ActiveChallenge[] {
  const definitions = selectWeeklyChallenges(weekStart);
  return definitions.map((def) => ({
    definition: def,
    progress: 0,
    completed: false,
    weekStart,
  }));
}

// ============================================================================
// CHALLENGE PROGRESS
// ============================================================================

/**
 * Check if a card matches a challenge requirement
 */
export function cardMatchesChallenge(
  challenge: ChallengeDefinition,
  card: {
    types?: string[];
    rarity?: string;
    variant?: string;
    setId?: string;
  }
): boolean {
  switch (challenge.type) {
    case 'type_collection':
      if (!challenge.pokemonType || !card.types) return false;
      return card.types.some(
        (t) => t.toLowerCase() === challenge.pokemonType?.toLowerCase()
      );

    case 'rarity_collection':
      if (!challenge.rarity || !card.rarity) return false;
      const rarityLower = card.rarity.toLowerCase();
      // For "rare or higher" type challenges
      if (challenge.rarity === 'rare') {
        return (
          rarityLower.includes('rare') ||
          rarityLower.includes('ultra') ||
          rarityLower.includes('secret')
        );
      }
      if (challenge.rarity === 'ultra_rare') {
        return (
          rarityLower.includes('ultra') ||
          rarityLower.includes('v ') ||
          rarityLower.includes('vmax') ||
          rarityLower.includes('vstar') ||
          rarityLower.includes('ex') ||
          rarityLower.includes('gx')
        );
      }
      return rarityLower.includes(challenge.rarity.replace('_', ' '));

    case 'variant_collection':
      if (!challenge.variant || !card.variant) return false;
      return card.variant.toLowerCase() === challenge.variant.toLowerCase();

    case 'set_progress':
    case 'unique_cards':
    case 'total_cards':
      return true; // These track different metrics

    default:
      return false;
  }
}

/**
 * Update challenge progress based on added cards
 */
export function updateChallengeProgress(
  challenges: ActiveChallenge[],
  addedCards: Array<{
    types?: string[];
    rarity?: string;
    variant?: string;
    setId?: string;
    isUnique?: boolean;
  }>,
  uniqueSetsThisWeek?: Set<string>
): ActiveChallenge[] {
  return challenges.map((challenge) => {
    if (challenge.completed) return challenge;

    let newProgress = challenge.progress;

    switch (challenge.definition.type) {
      case 'type_collection':
      case 'rarity_collection':
      case 'variant_collection':
        // Count cards matching the criteria
        for (const card of addedCards) {
          if (cardMatchesChallenge(challenge.definition, card)) {
            newProgress++;
          }
        }
        break;

      case 'set_progress':
        // Count unique sets
        if (uniqueSetsThisWeek) {
          newProgress = uniqueSetsThisWeek.size;
        }
        break;

      case 'unique_cards':
        // Count unique cards added
        newProgress += addedCards.filter((c) => c.isUnique).length;
        break;

      case 'total_cards':
        // Count all cards added
        newProgress += addedCards.length;
        break;
    }

    const completed = newProgress >= challenge.definition.target;

    return {
      ...challenge,
      progress: Math.min(newProgress, challenge.definition.target),
      completed,
    };
  });
}

/**
 * Calculate total XP reward for completed challenges
 */
export function calculateChallengeRewards(challenges: ActiveChallenge[]): number {
  return challenges
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + c.definition.xpReward, 0);
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Check and refresh challenges if it's a new week
 */
export function refreshChallengesIfNeeded(
  state: WeeklyChallengeState
): WeeklyChallengeState {
  const currentWeekStart = getWeekStart();

  if (state.currentWeekStart !== currentWeekStart) {
    // New week - generate new challenges
    return {
      ...state,
      activeChallenges: initializeWeeklyChallenges(currentWeekStart),
      currentWeekStart,
    };
  }

  return state;
}

/**
 * Mark completed challenges and update stats
 */
export function processCompletedChallenges(
  state: WeeklyChallengeState
): WeeklyChallengeState {
  const newlyCompleted = state.activeChallenges.filter(
    (c) =>
      c.completed &&
      !state.completedByWeek[state.currentWeekStart]?.includes(c.definition.id)
  );

  if (newlyCompleted.length === 0) return state;

  const xpEarned = newlyCompleted.reduce(
    (sum, c) => sum + c.definition.xpReward,
    0
  );

  const existingCompleted =
    state.completedByWeek[state.currentWeekStart] || [];

  return {
    ...state,
    completedByWeek: {
      ...state.completedByWeek,
      [state.currentWeekStart]: [
        ...existingCompleted,
        ...newlyCompleted.map((c) => c.definition.id),
      ],
    },
    totalCompleted: state.totalCompleted + newlyCompleted.length,
    totalXpEarned: state.totalXpEarned + xpEarned,
  };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get progress percentage for a challenge
 */
export function getChallengeProgressPercent(challenge: ActiveChallenge): number {
  return Math.round(
    (challenge.progress / challenge.definition.target) * 100
  );
}

/**
 * Format progress text
 */
export function formatChallengeProgress(challenge: ActiveChallenge): string {
  return `${challenge.progress}/${challenge.definition.target}`;
}

/**
 * Get encouragement message based on challenge progress
 */
export function getChallengeEncouragement(challenge: ActiveChallenge): string {
  const percent = getChallengeProgressPercent(challenge);

  if (challenge.completed) return 'Complete!';
  if (percent === 0) return 'Get started!';
  if (percent < 50) return 'Keep going!';
  if (percent < 100) return 'Almost there!';
  return '';
}

/**
 * Format total completed text
 */
export function formatTotalChallengesCompleted(total: number): string {
  if (total === 0) return 'No challenges completed yet';
  if (total === 1) return '1 challenge completed';
  return `${total} challenges completed`;
}

/**
 * Get challenge type display name
 */
export function getChallengeTypeName(type: ChallengeType): string {
  switch (type) {
    case 'type_collection':
      return 'Type Collection';
    case 'rarity_collection':
      return 'Rarity Hunt';
    case 'set_progress':
      return 'Set Explorer';
    case 'unique_cards':
      return 'Variety';
    case 'total_cards':
      return 'Collection';
    case 'variant_collection':
      return 'Variant Hunt';
    default:
      return 'Challenge';
  }
}

// ============================================================================
// LOCAL STORAGE
// ============================================================================

/**
 * Save challenge state to localStorage
 */
export function saveChallengeState(state: WeeklyChallengeState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WEEKLY_CHALLENGES_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

/**
 * Load challenge state from localStorage
 */
export function loadChallengeState(): WeeklyChallengeState {
  if (typeof window === 'undefined') return DEFAULT_CHALLENGE_STATE;
  try {
    const stored = localStorage.getItem(WEEKLY_CHALLENGES_STORAGE_KEY);
    if (!stored) return DEFAULT_CHALLENGE_STATE;
    const parsed = JSON.parse(stored) as WeeklyChallengeState;

    // Validate shape
    if (!Array.isArray(parsed.activeChallenges)) {
      return DEFAULT_CHALLENGE_STATE;
    }

    return {
      ...DEFAULT_CHALLENGE_STATE,
      ...parsed,
    };
  } catch {
    return DEFAULT_CHALLENGE_STATE;
  }
}

/**
 * Clear challenge state from localStorage
 */
export function clearChallengeState(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(WEEKLY_CHALLENGES_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clean up old challenge data (older than 8 weeks)
 */
export function cleanupOldChallengeData(
  state: WeeklyChallengeState
): WeeklyChallengeState {
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  const cutoffDate = eightWeeksAgo.toISOString().split('T')[0];

  const cleanedCompletedByWeek: Record<string, string[]> = {};
  for (const [week, challenges] of Object.entries(state.completedByWeek)) {
    if (week >= cutoffDate) {
      cleanedCompletedByWeek[week] = challenges;
    }
  }

  return {
    ...state,
    completedByWeek: cleanedCompletedByWeek,
  };
}
