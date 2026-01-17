/**
 * Tests for game-specific achievements library.
 *
 * This test suite covers:
 * - Game mastery title definitions
 * - Game-specific milestone badges
 * - Cross-game achievements
 * - Achievement checking logic
 * - Progress calculation utilities
 */

import {
  GAME_MASTERY_TITLES,
  GAME_MILESTONE_THRESHOLDS,
  GAME_MILESTONE_NAMES,
  CROSS_GAME_ACHIEVEMENTS,
  getAllGameAchievements,
  getGameAchievements,
  getCrossGameAchievements,
  getGameAchievementDefinition,
  checkGameMilestoneAchievements,
  checkCrossGameAchievements,
  checkAllGameAchievements,
  getGameMilestoneProgress,
  getCrossGameProgress,
  getCurrentGameMasteryTitle,
  getNextGameMilestone,
  getGameMasteryTitleInfo,
  getGamesWithAchievements,
  getGameAchievementColor,
  getGameAchievementTierGradient,
  formatGameAchievement,
  getGameAchievementsSummary,
  type GameId,
} from '../gameAchievements';

describe('gameAchievements', () => {
  // ============================================================================
  // GAME MASTERY TITLES TESTS
  // ============================================================================

  describe('GAME_MASTERY_TITLES', () => {
    it('should have mastery titles for all 4 supported TCG games', () => {
      const gameIds: GameId[] = ['pokemon', 'yugioh', 'onepiece', 'lorcana'];

      for (const gameId of gameIds) {
        expect(GAME_MASTERY_TITLES[gameId]).toBeDefined();
        expect(GAME_MASTERY_TITLES[gameId].title).toBeTruthy();
        expect(GAME_MASTERY_TITLES[gameId].description).toBeTruthy();
        expect(GAME_MASTERY_TITLES[gameId].threshold).toBe(500);
        expect(GAME_MASTERY_TITLES[gameId].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('should have unique mastery titles for each game', () => {
      const titles = Object.values(GAME_MASTERY_TITLES).map((t) => t.title);
      const uniqueTitles = new Set(titles);
      expect(uniqueTitles.size).toBe(titles.length);
    });

    it('should have specific thematic titles for each game', () => {
      expect(GAME_MASTERY_TITLES.pokemon.title).toBe('Pokémon Master');
      expect(GAME_MASTERY_TITLES.yugioh.title).toBe('Duelist Champion');
      expect(GAME_MASTERY_TITLES.onepiece.title).toBe('Pirate King');
      expect(GAME_MASTERY_TITLES.lorcana.title).toBe('Lorekeeper');
    });
  });

  // ============================================================================
  // GAME MILESTONE THRESHOLDS TESTS
  // ============================================================================

  describe('GAME_MILESTONE_THRESHOLDS', () => {
    it('should have 6 milestone tiers', () => {
      expect(GAME_MILESTONE_THRESHOLDS).toHaveLength(6);
    });

    it('should have increasing thresholds', () => {
      for (let i = 1; i < GAME_MILESTONE_THRESHOLDS.length; i++) {
        expect(GAME_MILESTONE_THRESHOLDS[i].threshold).toBeGreaterThan(
          GAME_MILESTONE_THRESHOLDS[i - 1].threshold
        );
      }
    });

    it('should have standard milestone thresholds', () => {
      const thresholds = GAME_MILESTONE_THRESHOLDS.map((m) => m.threshold);
      expect(thresholds).toEqual([10, 50, 100, 250, 500, 1000]);
    });

    it('should have valid tier assignments', () => {
      const validTiers = ['bronze', 'silver', 'gold', 'platinum'];
      for (const milestone of GAME_MILESTONE_THRESHOLDS) {
        expect(validTiers).toContain(milestone.tier);
      }
    });
  });

  // ============================================================================
  // GAME MILESTONE NAMES TESTS
  // ============================================================================

  describe('GAME_MILESTONE_NAMES', () => {
    it('should have milestone names for all 4 supported games', () => {
      const gameIds: GameId[] = ['pokemon', 'yugioh', 'onepiece', 'lorcana'];

      for (const gameId of gameIds) {
        expect(GAME_MILESTONE_NAMES[gameId]).toBeDefined();
        expect(Object.keys(GAME_MILESTONE_NAMES[gameId])).toHaveLength(6);
      }
    });

    it('should have all milestone keys for each game', () => {
      const expectedKeys = ['novice', 'apprentice', 'collector', 'expert', 'master', 'legend'];

      for (const gameId of Object.keys(GAME_MILESTONE_NAMES) as GameId[]) {
        const gameKeys = Object.keys(GAME_MILESTONE_NAMES[gameId]);
        expect(gameKeys).toEqual(expect.arrayContaining(expectedKeys));
      }
    });

    it('should have name and description for each milestone', () => {
      for (const gameId of Object.keys(GAME_MILESTONE_NAMES) as GameId[]) {
        for (const milestoneKey of Object.keys(GAME_MILESTONE_NAMES[gameId])) {
          const milestone = GAME_MILESTONE_NAMES[gameId][milestoneKey];
          expect(milestone.name).toBeTruthy();
          expect(milestone.description).toBeTruthy();
        }
      }
    });

    it('should have game-specific themed names', () => {
      // Pokemon names should include "Pokémon"
      expect(GAME_MILESTONE_NAMES.pokemon.novice.name).toContain('Pokémon');

      // Yu-Gi-Oh! names should include "Duelist"
      expect(GAME_MILESTONE_NAMES.yugioh.novice.name).toContain('Duelist');

      // One Piece names should be pirate-themed
      expect(GAME_MILESTONE_NAMES.onepiece.novice.name).toBe('Cabin Boy');
      expect(GAME_MILESTONE_NAMES.onepiece.legend.name).toBe('Pirate King');

      // Lorcana names should be ink-themed
      expect(GAME_MILESTONE_NAMES.lorcana.novice.name).toBe('Ink Novice');
    });
  });

  // ============================================================================
  // CROSS-GAME ACHIEVEMENTS TESTS
  // ============================================================================

  describe('CROSS_GAME_ACHIEVEMENTS', () => {
    it('should have 3 cross-game achievement tiers', () => {
      // With 4 supported games, we have 3 tiers: 2, 3, and all (4)
      expect(CROSS_GAME_ACHIEVEMENTS).toHaveLength(3);
    });

    it('should have increasing thresholds', () => {
      const thresholds = CROSS_GAME_ACHIEVEMENTS.map((a) => a.threshold);
      expect(thresholds).toEqual([2, 3, 4]);
    });

    it('should have unique keys', () => {
      const keys = CROSS_GAME_ACHIEVEMENTS.map((a) => a.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should have valid tier assignments', () => {
      // With 4 games, we have 3 tiers: 2 (bronze), 3 (silver), all/4 (platinum)
      expect(CROSS_GAME_ACHIEVEMENTS[0].tier).toBe('bronze');
      expect(CROSS_GAME_ACHIEVEMENTS[1].tier).toBe('silver');
      expect(CROSS_GAME_ACHIEVEMENTS[2].tier).toBe('platinum');
    });

    it('should have valid hex color codes', () => {
      for (const achievement of CROSS_GAME_ACHIEVEMENTS) {
        expect(achievement.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  // ============================================================================
  // getAllGameAchievements TESTS
  // ============================================================================

  describe('getAllGameAchievements', () => {
    it('should return achievements for all games plus cross-game', () => {
      const achievements = getAllGameAchievements();

      // 4 games * 6 milestones = 24 game-specific + 3 cross-game = 27 total
      expect(achievements).toHaveLength(27);
    });

    it('should have valid structure for each achievement', () => {
      const achievements = getAllGameAchievements();

      for (const achievement of achievements) {
        expect(achievement.key).toBeTruthy();
        expect(achievement.category).toBeTruthy();
        expect(achievement.name).toBeTruthy();
        expect(achievement.description).toBeTruthy();
        expect(achievement.threshold).toBeGreaterThan(0);
        expect(achievement.color).toMatch(/^#[0-9A-Fa-f]{6}$|^text-/);
      }
    });

    it('should have unique keys across all achievements', () => {
      const achievements = getAllGameAchievements();
      const keys = achievements.map((a) => a.key);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });

  // ============================================================================
  // getGameAchievements TESTS
  // ============================================================================

  describe('getGameAchievements', () => {
    it('should return only achievements for the specified game', () => {
      const pokemonAchievements = getGameAchievements('pokemon');

      expect(pokemonAchievements).toHaveLength(6);
      for (const achievement of pokemonAchievements) {
        expect(achievement.gameId).toBe('pokemon');
      }
    });

    it('should return empty array for invalid game', () => {
      const achievements = getGameAchievements('invalid' as GameId);
      expect(achievements).toHaveLength(0);
    });
  });

  // ============================================================================
  // getCrossGameAchievements TESTS
  // ============================================================================

  describe('getCrossGameAchievements', () => {
    it('should return only cross-game achievements', () => {
      const crossGameAchievements = getCrossGameAchievements();

      // 3 cross-game achievements with 4 supported games
      expect(crossGameAchievements).toHaveLength(3);
      for (const achievement of crossGameAchievements) {
        expect(achievement.category).toBe('cross_game');
        expect(achievement.gameId).toBeNull();
      }
    });
  });

  // ============================================================================
  // getGameAchievementDefinition TESTS
  // ============================================================================

  describe('getGameAchievementDefinition', () => {
    it('should return achievement for valid key', () => {
      const achievement = getGameAchievementDefinition('pokemon_novice');

      expect(achievement).not.toBeNull();
      expect(achievement?.name).toBe('Pokémon Novice');
      expect(achievement?.gameId).toBe('pokemon');
    });

    it('should return null for invalid key', () => {
      const achievement = getGameAchievementDefinition('invalid_key');
      expect(achievement).toBeNull();
    });

    it('should return cross-game achievement for valid key', () => {
      const achievement = getGameAchievementDefinition('multi_collector_2');

      expect(achievement).not.toBeNull();
      expect(achievement?.name).toBe('Dual Collector');
      expect(achievement?.gameId).toBeNull();
    });
  });

  // ============================================================================
  // checkGameMilestoneAchievements TESTS
  // ============================================================================

  describe('checkGameMilestoneAchievements', () => {
    it('should return badges for reached thresholds', () => {
      const badges = checkGameMilestoneAchievements('pokemon', 55);

      expect(badges).toContain('pokemon_novice');
      expect(badges).toContain('pokemon_apprentice');
      expect(badges).not.toContain('pokemon_collector');
    });

    it('should exclude already earned badges', () => {
      const badges = checkGameMilestoneAchievements('pokemon', 55, ['pokemon_novice']);

      expect(badges).not.toContain('pokemon_novice');
      expect(badges).toContain('pokemon_apprentice');
    });

    it('should return empty array for 0 cards', () => {
      const badges = checkGameMilestoneAchievements('pokemon', 0);
      expect(badges).toHaveLength(0);
    });

    it('should return all badges for max card count', () => {
      const badges = checkGameMilestoneAchievements('yugioh', 1000);

      expect(badges).toContain('yugioh_novice');
      expect(badges).toContain('yugioh_apprentice');
      expect(badges).toContain('yugioh_collector');
      expect(badges).toContain('yugioh_expert');
      expect(badges).toContain('yugioh_master');
      expect(badges).toContain('yugioh_legend');
    });
  });

  // ============================================================================
  // checkCrossGameAchievements TESTS
  // ============================================================================

  describe('checkCrossGameAchievements', () => {
    it('should return Dual Collector for 2 games', () => {
      const badges = checkCrossGameAchievements(['pokemon', 'yugioh']);

      expect(badges).toContain('multi_collector_2');
      expect(badges).not.toContain('multi_collector_3');
    });

    it('should return multiple badges for 3 games', () => {
      const badges = checkCrossGameAchievements(['pokemon', 'yugioh', 'onepiece']);

      expect(badges).toContain('multi_collector_2');
      expect(badges).toContain('multi_collector_3');
      expect(badges).not.toContain('multi_collector_all');
    });

    it('should return all badges for all 4 supported games', () => {
      const badges = checkCrossGameAchievements([
        'pokemon',
        'yugioh',
        'onepiece',
        'lorcana',
      ]);

      expect(badges).toContain('multi_collector_2');
      expect(badges).toContain('multi_collector_3');
      expect(badges).toContain('multi_collector_all');
    });

    it('should exclude already earned badges', () => {
      const badges = checkCrossGameAchievements(['pokemon', 'yugioh'], ['multi_collector_2']);

      expect(badges).not.toContain('multi_collector_2');
    });

    it('should return empty array for 1 or fewer games', () => {
      expect(checkCrossGameAchievements(['pokemon'])).toHaveLength(0);
      expect(checkCrossGameAchievements([])).toHaveLength(0);
    });
  });

  // ============================================================================
  // checkAllGameAchievements TESTS
  // ============================================================================

  describe('checkAllGameAchievements', () => {
    it('should check both game milestones and cross-game achievements', () => {
      const badges = checkAllGameAchievements({
        pokemon: 100,
        yugioh: 50,
        onepiece: 0,
        lorcana: 0,
      });

      // Pokemon milestones
      expect(badges).toContain('pokemon_novice');
      expect(badges).toContain('pokemon_apprentice');
      expect(badges).toContain('pokemon_collector');

      // Yu-Gi-Oh milestones
      expect(badges).toContain('yugioh_novice');
      expect(badges).toContain('yugioh_apprentice');

      // Cross-game (2 games with cards)
      expect(badges).toContain('multi_collector_2');
    });
  });

  // ============================================================================
  // getGameMilestoneProgress TESTS
  // ============================================================================

  describe('getGameMilestoneProgress', () => {
    it('should return progress for all 6 milestones', () => {
      const progress = getGameMilestoneProgress('pokemon', 50);

      expect(progress).toHaveLength(6);
    });

    it('should calculate progress percentages correctly', () => {
      const progress = getGameMilestoneProgress('pokemon', 50);

      // novice: 50/10 = 100%
      expect(progress[0].progress).toBe(100);
      expect(progress[0].earned).toBe(false); // Not in earned list

      // apprentice: 50/50 = 100%
      expect(progress[1].progress).toBe(100);

      // collector: 50/100 = 50%
      expect(progress[2].progress).toBe(50);
    });

    it('should mark earned badges correctly', () => {
      const progress = getGameMilestoneProgress('pokemon', 50, [
        'pokemon_novice',
        'pokemon_apprentice',
      ]);

      expect(progress[0].earned).toBe(true);
      expect(progress[1].earned).toBe(true);
      expect(progress[2].earned).toBe(false);
    });
  });

  // ============================================================================
  // getCrossGameProgress TESTS
  // ============================================================================

  describe('getCrossGameProgress', () => {
    it('should return progress for all 3 cross-game achievements', () => {
      const progress = getCrossGameProgress(['pokemon', 'yugioh']);

      // 3 cross-game achievements with 4 supported games
      expect(progress).toHaveLength(3);
    });

    it('should calculate current count correctly', () => {
      const progress = getCrossGameProgress(['pokemon', 'yugioh', 'onepiece']);

      expect(progress[0].current).toBe(3);
      expect(progress[1].current).toBe(3);
    });

    it('should mark earned achievements correctly', () => {
      const progress = getCrossGameProgress(['pokemon', 'yugioh'], ['multi_collector_2']);

      expect(progress[0].earned).toBe(true);
    });
  });

  // ============================================================================
  // getCurrentGameMasteryTitle TESTS
  // ============================================================================

  describe('getCurrentGameMasteryTitle', () => {
    it('should return null for 0 cards', () => {
      const title = getCurrentGameMasteryTitle('pokemon', 0);
      expect(title).toBeNull();
    });

    it('should return appropriate title for card count', () => {
      expect(getCurrentGameMasteryTitle('pokemon', 10)).toBe('Pokémon Novice');
      expect(getCurrentGameMasteryTitle('pokemon', 50)).toBe('Pokémon Apprentice');
      expect(getCurrentGameMasteryTitle('pokemon', 100)).toBe('Pokémon Collector');
      expect(getCurrentGameMasteryTitle('pokemon', 500)).toBe('Pokémon Master');
      expect(getCurrentGameMasteryTitle('pokemon', 1000)).toBe('Pokémon Legend');
    });

    it('should return correct titles for different games', () => {
      expect(getCurrentGameMasteryTitle('yugioh', 500)).toBe('Duelist Champion');
      expect(getCurrentGameMasteryTitle('onepiece', 500)).toBe('Captain');
      expect(getCurrentGameMasteryTitle('lorcana', 500)).toBe('Lorekeeper');
    });
  });

  // ============================================================================
  // getNextGameMilestone TESTS
  // ============================================================================

  describe('getNextGameMilestone', () => {
    it('should return first milestone for 0 cards', () => {
      const next = getNextGameMilestone('pokemon', 0);

      expect(next).not.toBeNull();
      expect(next?.name).toBe('Pokémon Novice');
      expect(next?.threshold).toBe(10);
      expect(next?.cardsNeeded).toBe(10);
    });

    it('should return next milestone for partial progress', () => {
      const next = getNextGameMilestone('pokemon', 75);

      expect(next).not.toBeNull();
      expect(next?.name).toBe('Pokémon Collector');
      expect(next?.threshold).toBe(100);
      expect(next?.cardsNeeded).toBe(25);
    });

    it('should return null when all milestones achieved', () => {
      const next = getNextGameMilestone('pokemon', 1000);
      expect(next).toBeNull();
    });
  });

  // ============================================================================
  // getGameMasteryTitleInfo TESTS
  // ============================================================================

  describe('getGameMasteryTitleInfo', () => {
    it('should return mastery info for valid game', () => {
      const info = getGameMasteryTitleInfo('pokemon');

      expect(info.title).toBe('Pokémon Master');
      expect(info.threshold).toBe(500);
      expect(info.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  // ============================================================================
  // getGamesWithAchievements TESTS
  // ============================================================================

  describe('getGamesWithAchievements', () => {
    it('should return all 4 supported game IDs', () => {
      const games = getGamesWithAchievements();

      expect(games).toHaveLength(4);
      expect(games).toContain('pokemon');
      expect(games).toContain('yugioh');
      expect(games).toContain('onepiece');
      expect(games).toContain('lorcana');
    });
  });

  // ============================================================================
  // getGameAchievementColor TESTS
  // ============================================================================

  describe('getGameAchievementColor', () => {
    it('should return mastery color for game achievements', () => {
      const color = getGameAchievementColor('pokemon_master');
      expect(color).toBe(GAME_MASTERY_TITLES.pokemon.color);
    });

    it('should return achievement color for cross-game achievements', () => {
      const achievement = CROSS_GAME_ACHIEVEMENTS.find((a) => a.key === 'multi_collector_2');
      const color = getGameAchievementColor('multi_collector_2');
      expect(color).toBe(achievement?.color);
    });

    it('should return fallback for invalid key', () => {
      const color = getGameAchievementColor('invalid');
      expect(color).toBe('#6B7280');
    });
  });

  // ============================================================================
  // getGameAchievementTierGradient TESTS
  // ============================================================================

  describe('getGameAchievementTierGradient', () => {
    it('should return gradient for each tier', () => {
      const bronze = getGameAchievementTierGradient('bronze');
      expect(bronze.from).toBeTruthy();
      expect(bronze.to).toBeTruthy();

      const silver = getGameAchievementTierGradient('silver');
      expect(silver.from).toBeTruthy();

      const gold = getGameAchievementTierGradient('gold');
      expect(gold.from).toBeTruthy();

      const platinum = getGameAchievementTierGradient('platinum');
      expect(platinum.from).toBeTruthy();
    });

    it('should return default gradient for undefined tier', () => {
      const defaultGradient = getGameAchievementTierGradient(undefined);
      expect(defaultGradient.from).toBeTruthy();
      expect(defaultGradient.to).toBeTruthy();
    });
  });

  // ============================================================================
  // formatGameAchievement TESTS
  // ============================================================================

  describe('formatGameAchievement', () => {
    it('should format game-specific achievement', () => {
      const formatted = formatGameAchievement('pokemon_master');

      expect(formatted).not.toBeNull();
      expect(formatted?.name).toBe('Pokémon Master');
      expect(formatted?.gameId).toBe('pokemon');
      expect(formatted?.gameName).toBe('Pokémon TCG');
    });

    it('should format cross-game achievement', () => {
      const formatted = formatGameAchievement('multi_collector_all');

      expect(formatted).not.toBeNull();
      expect(formatted?.name).toBe('Ultimate Collector');
      expect(formatted?.gameId).toBeNull();
      expect(formatted?.gameName).toBeNull();
    });

    it('should return null for invalid key', () => {
      const formatted = formatGameAchievement('invalid');
      expect(formatted).toBeNull();
    });
  });

  // ============================================================================
  // getGameAchievementsSummary TESTS
  // ============================================================================

  describe('getGameAchievementsSummary', () => {
    it('should calculate summary correctly', () => {
      const summary = getGameAchievementsSummary(
        {
          pokemon: 100,
          yugioh: 0,
          onepiece: 0,
          lorcana: 0,
        },
        ['pokemon_novice', 'pokemon_apprentice', 'pokemon_collector']
      );

      expect(summary.totalEarned).toBe(3);
      // 4 games * 6 milestones + 3 cross-game = 27 total
      expect(summary.totalAvailable).toBe(27);
      expect(summary.byGame.pokemon.earned).toBe(3);
      expect(summary.byGame.pokemon.total).toBe(6);
      expect(summary.byGame.pokemon.currentTitle).toBe('Pokémon Collector');
    });

    it('should include cross-game stats', () => {
      const summary = getGameAchievementsSummary(
        {
          pokemon: 10,
          yugioh: 10,
          onepiece: 0,
          lorcana: 0,
        },
        ['multi_collector_2']
      );

      expect(summary.crossGame.earned).toBe(1);
      // 3 cross-game achievements with 4 supported games
      expect(summary.crossGame.total).toBe(3);
    });
  });
});
