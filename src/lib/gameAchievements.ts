/**
 * Game-specific achievements for multi-TCG support.
 * Defines achievement categories and badges that are specific to each trading card game.
 *
 * This module provides:
 * - Game-specific master title achievements (e.g., "Pokémon Master" vs "Duelist Champion")
 * - Game-specific milestone badges
 * - Cross-game "Multi-Collector" badges for collecting across multiple TCGs
 */

import type { GameId } from './gameSelector';
import { GAMES, getGameInfo } from './gameSelector';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Achievement category for game-specific badges
 */
export type GameAchievementCategory =
  | 'game_mastery' // Game-specific master titles
  | 'game_milestone' // Game-specific card count milestones
  | 'cross_game'; // Badges for collecting across multiple games

/**
 * Game-specific achievement definition
 */
export interface GameAchievementDefinition {
  /** Unique key for this achievement */
  key: string;
  /** Achievement category */
  category: GameAchievementCategory;
  /** Display name */
  name: string;
  /** Description of how to earn */
  description: string;
  /** Card count threshold */
  threshold: number;
  /** Associated game (null for cross-game) */
  gameId: GameId | null;
  /** Badge color (hex) */
  color: string;
  /** Tier for tiered badges */
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

/**
 * Earned game achievement
 */
export interface EarnedGameAchievement {
  achievementKey: string;
  achievementCategory: GameAchievementCategory;
  gameId: GameId | null;
  earnedAt: number;
}

/**
 * Progress info for a game achievement
 */
export interface GameAchievementProgress {
  key: string;
  name: string;
  description: string;
  threshold: number;
  current: number;
  progress: number; // 0-100
  earned: boolean;
  gameId: GameId | null;
}

// ============================================================================
// GAME MASTERY TITLES
// ============================================================================

/**
 * Master titles for each TCG game.
 * These are the highest honor badges for each game.
 */
export const GAME_MASTERY_TITLES: Record<
  GameId,
  {
    title: string;
    description: string;
    threshold: number;
    color: string;
  }
> = {
  pokemon: {
    title: 'Pokémon Master',
    description: 'Collect 500 Pokémon cards to earn the ultimate trainer title',
    threshold: 500,
    color: '#F8D030', // Yellow/gold for Pokémon
  },
  yugioh: {
    title: 'Duelist Champion',
    description: 'Collect 500 Yu-Gi-Oh! cards to become the ultimate duelist',
    threshold: 500,
    color: '#8B5CF6', // Purple for Yu-Gi-Oh!
  },
  onepiece: {
    title: 'Pirate King',
    description: 'Collect 500 One Piece cards to claim the title of Pirate King',
    threshold: 500,
    color: '#EF4444', // Red for One Piece
  },
  dragonball: {
    title: 'Super Saiyan Master',
    description: 'Collect 500 Dragon Ball cards to achieve legendary status',
    threshold: 500,
    color: '#F97316', // Orange for Dragon Ball
  },
  lorcana: {
    title: 'Lorekeeper',
    description: 'Collect 500 Lorcana cards to master the magical inks',
    threshold: 500,
    color: '#3B82F6', // Blue for Lorcana
  },
  digimon: {
    title: 'Digimon Champion',
    description: 'Collect 500 Digimon cards to become a legendary tamer',
    threshold: 500,
    color: '#06B6D4', // Cyan for Digimon
  },
  mtg: {
    title: 'Planeswalker',
    description: 'Collect 500 Magic cards to transcend as a Planeswalker',
    threshold: 500,
    color: '#D97706', // Amber for MTG
  },
};

// ============================================================================
// GAME-SPECIFIC MILESTONES
// ============================================================================

/**
 * Milestone thresholds for game-specific badges.
 * Each game has its own set of milestone badges.
 */
export const GAME_MILESTONE_THRESHOLDS = [
  { key: 'novice', threshold: 10, tier: 'bronze' as const },
  { key: 'apprentice', threshold: 50, tier: 'bronze' as const },
  { key: 'collector', threshold: 100, tier: 'silver' as const },
  { key: 'expert', threshold: 250, tier: 'silver' as const },
  { key: 'master', threshold: 500, tier: 'gold' as const },
  { key: 'legend', threshold: 1000, tier: 'platinum' as const },
] as const;

/**
 * Game-specific milestone names and descriptions.
 * Each game has thematic names for their milestone badges.
 */
export const GAME_MILESTONE_NAMES: Record<
  GameId,
  Record<string, { name: string; description: string }>
> = {
  pokemon: {
    novice: { name: 'Pokémon Novice', description: 'Collect 10 Pokémon cards' },
    apprentice: { name: 'Pokémon Apprentice', description: 'Collect 50 Pokémon cards' },
    collector: { name: 'Pokémon Collector', description: 'Collect 100 Pokémon cards' },
    expert: { name: 'Pokémon Expert', description: 'Collect 250 Pokémon cards' },
    master: { name: 'Pokémon Master', description: 'Collect 500 Pokémon cards' },
    legend: { name: 'Pokémon Legend', description: 'Collect 1000 Pokémon cards' },
  },
  yugioh: {
    novice: { name: 'Duelist Novice', description: 'Collect 10 Yu-Gi-Oh! cards' },
    apprentice: { name: 'Duelist Apprentice', description: 'Collect 50 Yu-Gi-Oh! cards' },
    collector: { name: 'Duelist Collector', description: 'Collect 100 Yu-Gi-Oh! cards' },
    expert: { name: 'Duelist Expert', description: 'Collect 250 Yu-Gi-Oh! cards' },
    master: { name: 'Duelist Champion', description: 'Collect 500 Yu-Gi-Oh! cards' },
    legend: { name: 'Duelist Legend', description: 'Collect 1000 Yu-Gi-Oh! cards' },
  },
  onepiece: {
    novice: { name: 'Cabin Boy', description: 'Collect 10 One Piece cards' },
    apprentice: { name: 'Deckhand', description: 'Collect 50 One Piece cards' },
    collector: { name: 'Navigator', description: 'Collect 100 One Piece cards' },
    expert: { name: 'First Mate', description: 'Collect 250 One Piece cards' },
    master: { name: 'Captain', description: 'Collect 500 One Piece cards' },
    legend: { name: 'Pirate King', description: 'Collect 1000 One Piece cards' },
  },
  dragonball: {
    novice: { name: 'Martial Artist', description: 'Collect 10 Dragon Ball cards' },
    apprentice: { name: 'Z Fighter', description: 'Collect 50 Dragon Ball cards' },
    collector: { name: 'Saiyan Warrior', description: 'Collect 100 Dragon Ball cards' },
    expert: { name: 'Super Saiyan', description: 'Collect 250 Dragon Ball cards' },
    master: { name: 'Super Saiyan God', description: 'Collect 500 Dragon Ball cards' },
    legend: { name: 'Ultra Instinct', description: 'Collect 1000 Dragon Ball cards' },
  },
  lorcana: {
    novice: { name: 'Ink Novice', description: 'Collect 10 Lorcana cards' },
    apprentice: { name: 'Ink Apprentice', description: 'Collect 50 Lorcana cards' },
    collector: { name: 'Ink Collector', description: 'Collect 100 Lorcana cards' },
    expert: { name: 'Ink Master', description: 'Collect 250 Lorcana cards' },
    master: { name: 'Lorekeeper', description: 'Collect 500 Lorcana cards' },
    legend: { name: 'Illuminary', description: 'Collect 1000 Lorcana cards' },
  },
  digimon: {
    novice: { name: 'DigiDestined', description: 'Collect 10 Digimon cards' },
    apprentice: { name: 'Tamer Apprentice', description: 'Collect 50 Digimon cards' },
    collector: { name: 'Tamer Collector', description: 'Collect 100 Digimon cards' },
    expert: { name: 'Tamer Expert', description: 'Collect 250 Digimon cards' },
    master: { name: 'Digimon Champion', description: 'Collect 500 Digimon cards' },
    legend: { name: 'Mega Tamer', description: 'Collect 1000 Digimon cards' },
  },
  mtg: {
    novice: { name: 'Mage Novice', description: 'Collect 10 Magic cards' },
    apprentice: { name: 'Mage Apprentice', description: 'Collect 50 Magic cards' },
    collector: { name: 'Mage Collector', description: 'Collect 100 Magic cards' },
    expert: { name: 'Mage Expert', description: 'Collect 250 Magic cards' },
    master: { name: 'Planeswalker', description: 'Collect 500 Magic cards' },
    legend: { name: 'Archmage', description: 'Collect 1000 Magic cards' },
  },
};

// ============================================================================
// CROSS-GAME ACHIEVEMENTS
// ============================================================================

/**
 * Cross-game achievements for collecting across multiple TCGs.
 */
export const CROSS_GAME_ACHIEVEMENTS = [
  {
    key: 'multi_collector_2',
    name: 'Dual Collector',
    description: 'Collect cards from 2 different TCG games',
    threshold: 2,
    tier: 'bronze' as const,
    color: '#78C850',
  },
  {
    key: 'multi_collector_3',
    name: 'Tri-Collector',
    description: 'Collect cards from 3 different TCG games',
    threshold: 3,
    tier: 'silver' as const,
    color: '#6890F0',
  },
  {
    key: 'multi_collector_5',
    name: 'Multi-Master',
    description: 'Collect cards from 5 different TCG games',
    threshold: 5,
    tier: 'gold' as const,
    color: '#F8D030',
  },
  {
    key: 'multi_collector_all',
    name: 'Ultimate Collector',
    description: 'Collect cards from all 7 TCG games',
    threshold: 7,
    tier: 'platinum' as const,
    color: '#7038F8',
  },
] as const;

// ============================================================================
// BADGE DEFINITIONS
// ============================================================================

/**
 * Get all game achievement definitions.
 */
export function getAllGameAchievements(): GameAchievementDefinition[] {
  const achievements: GameAchievementDefinition[] = [];

  // Game-specific milestone badges
  for (const game of GAMES) {
    const gameNames = GAME_MILESTONE_NAMES[game.id];
    const gameInfo = getGameInfo(game.id);
    const masteryInfo = GAME_MASTERY_TITLES[game.id];

    for (const milestone of GAME_MILESTONE_THRESHOLDS) {
      const nameInfo = gameNames[milestone.key];
      achievements.push({
        key: `${game.id}_${milestone.key}`,
        category: milestone.key === 'master' ? 'game_mastery' : 'game_milestone',
        name: nameInfo.name,
        description: nameInfo.description,
        threshold: milestone.threshold,
        gameId: game.id,
        color:
          milestone.key === 'master' ? masteryInfo.color : (gameInfo?.primaryColor ?? '#6B7280'),
        tier: milestone.tier,
      });
    }
  }

  // Cross-game achievements
  for (const crossGame of CROSS_GAME_ACHIEVEMENTS) {
    achievements.push({
      key: crossGame.key,
      category: 'cross_game',
      name: crossGame.name,
      description: crossGame.description,
      threshold: crossGame.threshold,
      gameId: null,
      color: crossGame.color,
      tier: crossGame.tier,
    });
  }

  return achievements;
}

/**
 * Get achievement definitions for a specific game.
 */
export function getGameAchievements(gameId: GameId): GameAchievementDefinition[] {
  return getAllGameAchievements().filter((a) => a.gameId === gameId);
}

/**
 * Get cross-game achievement definitions.
 */
export function getCrossGameAchievements(): GameAchievementDefinition[] {
  return getAllGameAchievements().filter((a) => a.category === 'cross_game');
}

/**
 * Get achievement definition by key.
 */
export function getGameAchievementDefinition(key: string): GameAchievementDefinition | null {
  return getAllGameAchievements().find((a) => a.key === key) ?? null;
}

// ============================================================================
// ACHIEVEMENT CHECKING
// ============================================================================

/**
 * Check which game-specific milestones should be awarded.
 */
export function checkGameMilestoneAchievements(
  gameId: GameId,
  cardCount: number,
  alreadyEarned: string[] = []
): string[] {
  const earnedSet = new Set(alreadyEarned);
  const newBadges: string[] = [];

  for (const milestone of GAME_MILESTONE_THRESHOLDS) {
    const key = `${gameId}_${milestone.key}`;
    if (cardCount >= milestone.threshold && !earnedSet.has(key)) {
      newBadges.push(key);
    }
  }

  return newBadges;
}

/**
 * Check which cross-game achievements should be awarded.
 */
export function checkCrossGameAchievements(
  gamesWithCards: GameId[],
  alreadyEarned: string[] = []
): string[] {
  const earnedSet = new Set(alreadyEarned);
  const newBadges: string[] = [];
  const gameCount = gamesWithCards.length;

  for (const crossGame of CROSS_GAME_ACHIEVEMENTS) {
    if (gameCount >= crossGame.threshold && !earnedSet.has(crossGame.key)) {
      newBadges.push(crossGame.key);
    }
  }

  return newBadges;
}

/**
 * Check all game achievements based on card counts per game.
 */
export function checkAllGameAchievements(
  cardCountsByGame: Record<GameId, number>,
  alreadyEarned: string[] = []
): string[] {
  const newBadges: string[] = [];

  // Check game-specific milestones
  for (const gameId of Object.keys(cardCountsByGame) as GameId[]) {
    const count = cardCountsByGame[gameId];
    const earned = checkGameMilestoneAchievements(gameId, count, alreadyEarned);
    newBadges.push(...earned);
  }

  // Check cross-game achievements
  const gamesWithCards = (Object.keys(cardCountsByGame) as GameId[]).filter(
    (gameId) => cardCountsByGame[gameId] > 0
  );
  const crossGameEarned = checkCrossGameAchievements(gamesWithCards, alreadyEarned);
  newBadges.push(...crossGameEarned);

  return newBadges;
}

// ============================================================================
// PROGRESS UTILITIES
// ============================================================================

/**
 * Get progress for a specific game's milestones.
 */
export function getGameMilestoneProgress(
  gameId: GameId,
  cardCount: number,
  earnedKeys: string[] = []
): GameAchievementProgress[] {
  const earnedSet = new Set(earnedKeys);
  const gameNames = GAME_MILESTONE_NAMES[gameId];
  const masteryInfo = GAME_MASTERY_TITLES[gameId];
  const gameInfo = getGameInfo(gameId);

  return GAME_MILESTONE_THRESHOLDS.map((milestone) => {
    const key = `${gameId}_${milestone.key}`;
    const nameInfo = gameNames[milestone.key];
    const earned = earnedSet.has(key);

    return {
      key,
      name: nameInfo.name,
      description: nameInfo.description,
      threshold: milestone.threshold,
      current: cardCount,
      progress: Math.min(100, Math.round((cardCount / milestone.threshold) * 100)),
      earned,
      gameId,
    };
  });
}

/**
 * Get progress for cross-game achievements.
 */
export function getCrossGameProgress(
  gamesWithCards: GameId[],
  earnedKeys: string[] = []
): GameAchievementProgress[] {
  const earnedSet = new Set(earnedKeys);
  const gameCount = gamesWithCards.length;

  return CROSS_GAME_ACHIEVEMENTS.map((crossGame) => ({
    key: crossGame.key,
    name: crossGame.name,
    description: crossGame.description,
    threshold: crossGame.threshold,
    current: gameCount,
    progress: Math.min(100, Math.round((gameCount / crossGame.threshold) * 100)),
    earned: earnedSet.has(crossGame.key),
    gameId: null,
  }));
}

/**
 * Get the current mastery title for a game.
 */
export function getCurrentGameMasteryTitle(gameId: GameId, cardCount: number): string | null {
  let currentTitle: string | null = null;
  const gameNames = GAME_MILESTONE_NAMES[gameId];

  for (const milestone of GAME_MILESTONE_THRESHOLDS) {
    if (cardCount >= milestone.threshold) {
      currentTitle = gameNames[milestone.key].name;
    }
  }

  return currentTitle;
}

/**
 * Get the next mastery milestone for a game.
 */
export function getNextGameMilestone(
  gameId: GameId,
  cardCount: number
): { key: string; name: string; threshold: number; cardsNeeded: number } | null {
  const gameNames = GAME_MILESTONE_NAMES[gameId];

  for (const milestone of GAME_MILESTONE_THRESHOLDS) {
    if (cardCount < milestone.threshold) {
      const key = `${gameId}_${milestone.key}`;
      return {
        key,
        name: gameNames[milestone.key].name,
        threshold: milestone.threshold,
        cardsNeeded: milestone.threshold - cardCount,
      };
    }
  }

  return null;
}

// ============================================================================
// DISPLAY UTILITIES
// ============================================================================

/**
 * Get the mastery title display info for a game.
 */
export function getGameMasteryTitleInfo(gameId: GameId): {
  title: string;
  description: string;
  threshold: number;
  color: string;
} {
  return GAME_MASTERY_TITLES[gameId];
}

/**
 * Get all game IDs that have achievements.
 */
export function getGamesWithAchievements(): GameId[] {
  return GAMES.map((g) => g.id);
}

/**
 * Get the badge color for a game achievement.
 */
export function getGameAchievementColor(key: string): string {
  const achievement = getGameAchievementDefinition(key);
  if (!achievement) return '#6B7280';

  // For game-specific achievements, use the game's mastery color
  if (achievement.gameId) {
    return GAME_MASTERY_TITLES[achievement.gameId].color;
  }

  return achievement.color;
}

/**
 * Get tier gradient for a game achievement.
 */
export function getGameAchievementTierGradient(tier?: 'bronze' | 'silver' | 'gold' | 'platinum'): {
  from: string;
  via?: string;
  to: string;
} {
  switch (tier) {
    case 'platinum':
      return { from: '#A855F7', via: '#818CF8', to: '#8B5CF6' };
    case 'gold':
      return { from: '#F59E0B', via: '#FBBF24', to: '#F59E0B' };
    case 'silver':
      return { from: '#9CA3AF', via: '#F3F4F6', to: '#6B7280' };
    case 'bronze':
      return { from: '#F97316', via: '#FB923C', to: '#EA580C' };
    default:
      return { from: '#8B5CF6', to: '#EC4899' };
  }
}

/**
 * Format game achievement for display.
 */
export function formatGameAchievement(key: string): {
  name: string;
  description: string;
  gameId: GameId | null;
  gameName: string | null;
} | null {
  const achievement = getGameAchievementDefinition(key);
  if (!achievement) return null;

  const gameInfo = achievement.gameId ? getGameInfo(achievement.gameId) : null;

  return {
    name: achievement.name,
    description: achievement.description,
    gameId: achievement.gameId,
    gameName: gameInfo?.name ?? null,
  };
}

/**
 * Get summary of game achievements for all games.
 */
export function getGameAchievementsSummary(
  cardCountsByGame: Record<GameId, number>,
  earnedKeys: string[] = []
): {
  totalEarned: number;
  totalAvailable: number;
  percentComplete: number;
  byGame: Record<
    GameId,
    {
      earned: number;
      total: number;
      currentTitle: string | null;
    }
  >;
  crossGame: {
    earned: number;
    total: number;
  };
} {
  const earnedSet = new Set(earnedKeys);
  const allAchievements = getAllGameAchievements();

  // Calculate totals
  const totalAvailable = allAchievements.length;
  let totalEarned = 0;

  // Calculate per-game stats
  const byGame: Record<
    GameId,
    {
      earned: number;
      total: number;
      currentTitle: string | null;
    }
  > = {} as Record<GameId, { earned: number; total: number; currentTitle: string | null }>;

  for (const game of GAMES) {
    const gameAchievements = allAchievements.filter((a) => a.gameId === game.id);
    const earnedForGame = gameAchievements.filter((a) => earnedSet.has(a.key)).length;
    const cardCount = cardCountsByGame[game.id] ?? 0;

    byGame[game.id] = {
      earned: earnedForGame,
      total: gameAchievements.length,
      currentTitle: getCurrentGameMasteryTitle(game.id, cardCount),
    };

    totalEarned += earnedForGame;
  }

  // Calculate cross-game stats
  const crossGameAchievements = allAchievements.filter((a) => a.category === 'cross_game');
  const crossGameEarned = crossGameAchievements.filter((a) => earnedSet.has(a.key)).length;
  totalEarned += crossGameEarned;

  return {
    totalEarned,
    totalAvailable,
    percentComplete: Math.round((totalEarned / totalAvailable) * 100),
    byGame,
    crossGame: {
      earned: crossGameEarned,
      total: crossGameAchievements.length,
    },
  };
}
