/**
 * Avatar Items Definitions and Utilities
 *
 * This module defines all unlockable avatar customization items (hats, frames, badges)
 * and provides utilities for checking unlock requirements based on achievements.
 */

import type { ComponentType } from 'react';
import {
  StarIcon,
  TrophyIcon,
  FireIcon,
  BoltIcon,
  SparklesIcon,
  HeartIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  GlobeAltIcon,
  SunIcon,
  MoonIcon,
  CloudIcon,
} from '@heroicons/react/24/solid';

// ============================================================================
// TYPES
// ============================================================================

export type AvatarItemCategory = 'hat' | 'frame' | 'badge';

export type AvatarItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AvatarItem {
  id: string;
  name: string;
  description: string;
  category: AvatarItemCategory;
  rarity: AvatarItemRarity;
  icon: ComponentType<{ className?: string }>;
  // Gradient used for the item display
  gradient: string;
  // Achievement key(s) required to unlock this item
  unlockRequirement: {
    type: 'achievement' | 'milestone' | 'level' | 'streak';
    // For achievement type: the achievement key
    // For milestone type: the card count
    // For level type: the level number
    // For streak type: the streak days
    value: string | number;
  };
  // Optional secondary color for frames
  secondaryColor?: string;
}

export interface EquippedAvatar {
  hatId: string | null;
  frameId: string | null;
  badgeId: string | null;
}

// ============================================================================
// RARITY DEFINITIONS
// ============================================================================

export const RARITY_CONFIG: Record<
  AvatarItemRarity,
  { label: string; gradient: string; textColor: string; bgColor: string }
> = {
  common: {
    label: 'Common',
    gradient: 'from-gray-400 to-gray-500',
    textColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  uncommon: {
    label: 'Uncommon',
    gradient: 'from-emerald-400 to-green-500',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  rare: {
    label: 'Rare',
    gradient: 'from-blue-400 to-indigo-500',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  epic: {
    label: 'Epic',
    gradient: 'from-purple-400 to-violet-500',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  legendary: {
    label: 'Legendary',
    gradient: 'from-amber-400 via-yellow-300 to-orange-500',
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
};

// ============================================================================
// AVATAR ITEMS DEFINITIONS
// ============================================================================

// --- HATS ---
export const HAT_ITEMS: AvatarItem[] = [
  {
    id: 'hat_starter',
    name: 'Starter Cap',
    description: 'Your first hat! Earned by adding your first card.',
    category: 'hat',
    rarity: 'common',
    icon: StarIcon,
    gradient: 'from-gray-400 to-gray-500',
    unlockRequirement: { type: 'achievement', value: 'first_catch' },
  },
  {
    id: 'hat_collector',
    name: 'Collector Cap',
    description: 'A stylish cap for dedicated collectors.',
    category: 'hat',
    rarity: 'uncommon',
    icon: SparklesIcon,
    gradient: 'from-emerald-400 to-teal-500',
    unlockRequirement: { type: 'milestone', value: 50 },
  },
  {
    id: 'hat_trainer',
    name: 'Trainer Hat',
    description: 'The classic trainer look.',
    category: 'hat',
    rarity: 'rare',
    icon: RocketLaunchIcon,
    gradient: 'from-blue-400 to-indigo-500',
    unlockRequirement: { type: 'achievement', value: 'pokemon_trainer' },
  },
  {
    id: 'hat_fire',
    name: 'Flame Crown',
    description: 'For masters of Fire-type Pokemon.',
    category: 'hat',
    rarity: 'rare',
    icon: FireIcon,
    gradient: 'from-orange-400 to-red-500',
    unlockRequirement: { type: 'achievement', value: 'fire_trainer' },
  },
  {
    id: 'hat_electric',
    name: 'Thunder Crown',
    description: 'Crackles with Electric-type energy.',
    category: 'hat',
    rarity: 'rare',
    icon: BoltIcon,
    gradient: 'from-yellow-400 to-amber-500',
    unlockRequirement: { type: 'achievement', value: 'electric_trainer' },
  },
  {
    id: 'hat_elite',
    name: 'Elite Helm',
    description: 'Reserved for elite collectors with 250+ cards.',
    category: 'hat',
    rarity: 'epic',
    icon: ShieldCheckIcon,
    gradient: 'from-purple-400 to-violet-500',
    unlockRequirement: { type: 'achievement', value: 'elite_collector' },
  },
  {
    id: 'hat_master',
    name: 'Master Crown',
    description: 'The ultimate headwear for Pokemon Masters.',
    category: 'hat',
    rarity: 'legendary',
    icon: TrophyIcon,
    gradient: 'from-amber-400 via-yellow-300 to-orange-500',
    unlockRequirement: { type: 'achievement', value: 'pokemon_master' },
  },
  {
    id: 'hat_legendary',
    name: 'Legendary Crown',
    description: 'Only for those who achieve legendary status.',
    category: 'hat',
    rarity: 'legendary',
    icon: SparklesIcon,
    gradient: 'from-purple-500 via-pink-400 to-rose-500',
    unlockRequirement: { type: 'achievement', value: 'legendary_collector' },
  },
];

// --- FRAMES ---
export const FRAME_ITEMS: AvatarItem[] = [
  {
    id: 'frame_basic',
    name: 'Basic Frame',
    description: 'A simple frame to start your journey.',
    category: 'frame',
    rarity: 'common',
    icon: GlobeAltIcon,
    gradient: 'from-gray-300 to-gray-400',
    unlockRequirement: { type: 'milestone', value: 10 },
  },
  {
    id: 'frame_grass',
    name: 'Grass Frame',
    description: 'Adorned with leafy decorations.',
    category: 'frame',
    rarity: 'uncommon',
    icon: HeartIcon,
    gradient: 'from-green-400 to-emerald-500',
    unlockRequirement: { type: 'achievement', value: 'grass_trainer' },
    secondaryColor: '#22c55e',
  },
  {
    id: 'frame_water',
    name: 'Water Frame',
    description: 'Flows with aquatic energy.',
    category: 'frame',
    rarity: 'uncommon',
    icon: CloudIcon,
    gradient: 'from-blue-400 to-cyan-500',
    unlockRequirement: { type: 'achievement', value: 'water_trainer' },
    secondaryColor: '#0ea5e9',
  },
  {
    id: 'frame_psychic',
    name: 'Psychic Frame',
    description: 'Glows with mysterious power.',
    category: 'frame',
    rarity: 'rare',
    icon: SparklesIcon,
    gradient: 'from-pink-400 to-purple-500',
    unlockRequirement: { type: 'achievement', value: 'psychic_trainer' },
    secondaryColor: '#d946ef',
  },
  {
    id: 'frame_dragon',
    name: 'Dragon Frame',
    description: 'Scales of the mighty dragons.',
    category: 'frame',
    rarity: 'epic',
    icon: FireIcon,
    gradient: 'from-purple-500 to-indigo-600',
    unlockRequirement: { type: 'achievement', value: 'dragon_trainer' },
    secondaryColor: '#7c3aed',
  },
  {
    id: 'frame_streak_bronze',
    name: 'Bronze Streak Frame',
    description: 'Earned through consistent collecting.',
    category: 'frame',
    rarity: 'uncommon',
    icon: FireIcon,
    gradient: 'from-orange-400 via-orange-300 to-orange-500',
    unlockRequirement: { type: 'achievement', value: 'streak_3' },
    secondaryColor: '#f97316',
  },
  {
    id: 'frame_streak_silver',
    name: 'Silver Streak Frame',
    description: 'A week of dedication rewarded.',
    category: 'frame',
    rarity: 'rare',
    icon: BoltIcon,
    gradient: 'from-gray-300 via-white to-gray-400',
    unlockRequirement: { type: 'achievement', value: 'streak_7' },
    secondaryColor: '#9ca3af',
  },
  {
    id: 'frame_streak_gold',
    name: 'Gold Streak Frame',
    description: 'Two weeks of pure dedication.',
    category: 'frame',
    rarity: 'epic',
    icon: ShieldCheckIcon,
    gradient: 'from-amber-400 via-yellow-300 to-amber-500',
    unlockRequirement: { type: 'achievement', value: 'streak_14' },
    secondaryColor: '#f59e0b',
  },
  {
    id: 'frame_streak_platinum',
    name: 'Platinum Streak Frame',
    description: 'A month of legendary commitment.',
    category: 'frame',
    rarity: 'legendary',
    icon: TrophyIcon,
    gradient: 'from-purple-400 via-indigo-300 to-purple-500',
    unlockRequirement: { type: 'achievement', value: 'streak_30' },
    secondaryColor: '#a855f7',
  },
];

// --- BADGES ---
export const BADGE_ITEMS: AvatarItem[] = [
  {
    id: 'badge_newbie',
    name: 'Newbie Badge',
    description: 'Welcome to the world of collecting!',
    category: 'badge',
    rarity: 'common',
    icon: StarIcon,
    gradient: 'from-gray-400 to-gray-500',
    unlockRequirement: { type: 'milestone', value: 1 },
  },
  {
    id: 'badge_pikachu',
    name: 'Pikachu Fan Badge',
    description: 'Shows your love for Pikachu!',
    category: 'badge',
    rarity: 'rare',
    icon: BoltIcon,
    gradient: 'from-yellow-400 to-amber-500',
    unlockRequirement: { type: 'achievement', value: 'pikachu_fan' },
  },
  {
    id: 'badge_eevee',
    name: 'Eevee Fan Badge',
    description: 'Celebrating all Eeveelutions!',
    category: 'badge',
    rarity: 'rare',
    icon: HeartIcon,
    gradient: 'from-amber-300 to-orange-400',
    unlockRequirement: { type: 'achievement', value: 'eevee_fan' },
  },
  {
    id: 'badge_charizard',
    name: 'Charizard Fan Badge',
    description: 'The iconic fire-breathing dragon!',
    category: 'badge',
    rarity: 'epic',
    icon: FireIcon,
    gradient: 'from-orange-500 to-red-600',
    unlockRequirement: { type: 'achievement', value: 'charizard_fan' },
  },
  {
    id: 'badge_mewtwo',
    name: 'Mewtwo Fan Badge',
    description: 'The legendary psychic powerhouse.',
    category: 'badge',
    rarity: 'epic',
    icon: SparklesIcon,
    gradient: 'from-purple-400 to-pink-500',
    unlockRequirement: { type: 'achievement', value: 'mewtwo_fan' },
  },
  {
    id: 'badge_legendary_fan',
    name: 'Legendary Collector Badge',
    description: 'A true fan of legendary Pokemon.',
    category: 'badge',
    rarity: 'legendary',
    icon: StarIcon,
    gradient: 'from-indigo-500 via-purple-400 to-pink-500',
    unlockRequirement: { type: 'achievement', value: 'legendary_fan' },
  },
  {
    id: 'badge_set_explorer',
    name: 'Set Explorer Badge',
    description: 'Explored 25% of a set.',
    category: 'badge',
    rarity: 'uncommon',
    icon: GlobeAltIcon,
    gradient: 'from-emerald-400 to-teal-500',
    unlockRequirement: { type: 'achievement', value: 'set_explorer' },
  },
  {
    id: 'badge_set_master',
    name: 'Set Master Badge',
    description: 'Mastered 75% of a set.',
    category: 'badge',
    rarity: 'epic',
    icon: TrophyIcon,
    gradient: 'from-purple-500 to-violet-600',
    unlockRequirement: { type: 'achievement', value: 'set_master' },
  },
  {
    id: 'badge_set_champion',
    name: 'Set Champion Badge',
    description: 'Completed an entire set!',
    category: 'badge',
    rarity: 'legendary',
    icon: TrophyIcon,
    gradient: 'from-amber-400 via-yellow-300 to-orange-500',
    unlockRequirement: { type: 'achievement', value: 'set_champion' },
  },
  {
    id: 'badge_sun',
    name: 'Day Collector Badge',
    description: 'Active during the day.',
    category: 'badge',
    rarity: 'common',
    icon: SunIcon,
    gradient: 'from-yellow-300 to-orange-400',
    unlockRequirement: { type: 'streak', value: 3 },
  },
  {
    id: 'badge_moon',
    name: 'Night Collector Badge',
    description: 'Dedicated collector, day or night.',
    category: 'badge',
    rarity: 'uncommon',
    icon: MoonIcon,
    gradient: 'from-indigo-400 to-purple-500',
    unlockRequirement: { type: 'streak', value: 7 },
  },
];

// Combined list of all items
export const ALL_AVATAR_ITEMS: AvatarItem[] = [...HAT_ITEMS, ...FRAME_ITEMS, ...BADGE_ITEMS];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all avatar items by category
 */
export function getItemsByCategory(category: AvatarItemCategory): AvatarItem[] {
  return ALL_AVATAR_ITEMS.filter((item) => item.category === category);
}

/**
 * Get a single avatar item by ID
 */
export function getItemById(itemId: string): AvatarItem | undefined {
  return ALL_AVATAR_ITEMS.find((item) => item.id === itemId);
}

/**
 * Check if a specific item is unlocked based on achievements
 */
export function isItemUnlocked(
  item: AvatarItem,
  earnedAchievements: Set<string>,
  totalUniqueCards: number,
  currentStreak: number
): boolean {
  const { type, value } = item.unlockRequirement;

  switch (type) {
    case 'achievement':
      return earnedAchievements.has(value as string);
    case 'milestone':
      return totalUniqueCards >= (value as number);
    case 'streak':
      return currentStreak >= (value as number);
    case 'level':
      // Level is calculated from unique cards (2 XP per card, level thresholds)
      const xp = totalUniqueCards * 2;
      const levelThresholds = [0, 10, 25, 50, 100, 175, 275, 400, 575, 800];
      let currentLevel = 1;
      for (let i = levelThresholds.length - 1; i >= 0; i--) {
        if (xp >= levelThresholds[i]) {
          currentLevel = i + 1;
          break;
        }
      }
      return currentLevel >= (value as number);
    default:
      return false;
  }
}

/**
 * Get all unlocked items for a user
 */
export function getUnlockedItems(
  earnedAchievements: Set<string>,
  totalUniqueCards: number,
  currentStreak: number
): AvatarItem[] {
  return ALL_AVATAR_ITEMS.filter((item) =>
    isItemUnlocked(item, earnedAchievements, totalUniqueCards, currentStreak)
  );
}

/**
 * Get all locked items for a user
 */
export function getLockedItems(
  earnedAchievements: Set<string>,
  totalUniqueCards: number,
  currentStreak: number
): AvatarItem[] {
  return ALL_AVATAR_ITEMS.filter(
    (item) => !isItemUnlocked(item, earnedAchievements, totalUniqueCards, currentStreak)
  );
}

/**
 * Get unlock progress for a locked item (0-100 percentage)
 */
export function getUnlockProgress(
  item: AvatarItem,
  earnedAchievements: Set<string>,
  totalUniqueCards: number,
  currentStreak: number
): { progress: number; current: number; required: number | string } {
  const { type, value } = item.unlockRequirement;

  switch (type) {
    case 'achievement':
      // Achievement progress is either 0% or 100%
      const isEarned = earnedAchievements.has(value as string);
      return {
        progress: isEarned ? 100 : 0,
        current: isEarned ? 1 : 0,
        required: value as string,
      };
    case 'milestone':
      const milestoneRequired = value as number;
      const milestoneProgress = Math.min(100, (totalUniqueCards / milestoneRequired) * 100);
      return {
        progress: milestoneProgress,
        current: totalUniqueCards,
        required: milestoneRequired,
      };
    case 'streak':
      const streakRequired = value as number;
      const streakProgress = Math.min(100, (currentStreak / streakRequired) * 100);
      return {
        progress: streakProgress,
        current: currentStreak,
        required: streakRequired,
      };
    case 'level':
      const levelRequired = value as number;
      const xp = totalUniqueCards * 2;
      const levelThresholds = [0, 10, 25, 50, 100, 175, 275, 400, 575, 800];
      let currentLevel = 1;
      for (let i = levelThresholds.length - 1; i >= 0; i--) {
        if (xp >= levelThresholds[i]) {
          currentLevel = i + 1;
          break;
        }
      }
      const levelProgress = Math.min(100, (currentLevel / levelRequired) * 100);
      return {
        progress: levelProgress,
        current: currentLevel,
        required: levelRequired,
      };
    default:
      return { progress: 0, current: 0, required: 0 };
  }
}

/**
 * Get the display name for an unlock requirement
 */
export function getUnlockRequirementDisplay(item: AvatarItem): string {
  const { type, value } = item.unlockRequirement;

  switch (type) {
    case 'achievement':
      // Map achievement keys to friendly names
      const achievementNames: Record<string, string> = {
        first_catch: 'Add your first card',
        starter_collector: 'Collect 10 cards',
        rising_trainer: 'Collect 50 cards',
        pokemon_trainer: 'Collect 100 cards',
        elite_collector: 'Collect 250 cards',
        pokemon_master: 'Collect 500 cards',
        legendary_collector: 'Collect 1000 cards',
        fire_trainer: 'Collect 10+ Fire-type cards',
        water_trainer: 'Collect 10+ Water-type cards',
        grass_trainer: 'Collect 10+ Grass-type cards',
        electric_trainer: 'Collect 10+ Electric-type cards',
        psychic_trainer: 'Collect 10+ Psychic-type cards',
        dragon_trainer: 'Collect 10+ Dragon-type cards',
        pikachu_fan: 'Collect 5+ Pikachu cards',
        eevee_fan: 'Collect 5+ Eevee cards',
        charizard_fan: 'Collect 3+ Charizard cards',
        mewtwo_fan: 'Collect 3+ Mewtwo cards',
        legendary_fan: 'Collect 10+ Legendary Pokemon',
        streak_3: 'Maintain a 3-day streak',
        streak_7: 'Maintain a 7-day streak',
        streak_14: 'Maintain a 14-day streak',
        streak_30: 'Maintain a 30-day streak',
        set_explorer: 'Complete 25% of any set',
        set_adventurer: 'Complete 50% of any set',
        set_master: 'Complete 75% of any set',
        set_champion: 'Complete 100% of any set',
      };
      return achievementNames[value as string] || `Earn the ${value} achievement`;
    case 'milestone':
      return `Collect ${value} unique cards`;
    case 'streak':
      return `Maintain a ${value}-day streak`;
    case 'level':
      return `Reach level ${value}`;
    default:
      return 'Unknown requirement';
  }
}

/**
 * Get the category display name
 */
export function getCategoryDisplayName(category: AvatarItemCategory): string {
  const names: Record<AvatarItemCategory, string> = {
    hat: 'Hats',
    frame: 'Frames',
    badge: 'Badges',
  };
  return names[category];
}

/**
 * Get the category icon component
 */
export function getCategoryIcon(
  category: AvatarItemCategory
): ComponentType<{ className?: string }> {
  const icons: Record<AvatarItemCategory, ComponentType<{ className?: string }>> = {
    hat: SparklesIcon,
    frame: GlobeAltIcon,
    badge: TrophyIcon,
  };
  return icons[category];
}

/**
 * Default equipped avatar (nothing equipped)
 */
export const DEFAULT_EQUIPPED_AVATAR: EquippedAvatar = {
  hatId: null,
  frameId: null,
  badgeId: null,
};
