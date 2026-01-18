import { describe, it, expect } from 'vitest';
import {
  // Types
  type GameSlug,
  type ProfileGame,
  // Constants
  GAME_SLUGS,
  DEFAULT_GAME,
  GAME_DISPLAY_NAMES,
  GAME_COLORS,
  GAME_RELEASE_ORDER,
  // Validation
  isValidGameSlug,
  validateGameSlugs,
  isProfileGameActive,
  // Filtering and Querying
  filterActiveGames,
  filterInactiveGames,
  getEnabledSlugs,
  getDisabledSlugs,
  isGameEnabled,
  findProfileGame,
  getUntrackedGames,
  getAvailableGames,
  // Sorting
  sortByEnabledDate,
  sortByReleaseOrder,
  sortByDisplayName,
  sortSlugsByReleaseOrder,
  // Statistics
  calculateProfileGameStats,
  countEnabledGames,
  countDisabledGames,
  hasAnyGamesEnabled,
  hasAllGamesEnabled,
  // Display Helpers
  getGameDisplayName,
  getGameColor,
  getGameReleaseOrder,
  getGameInfo,
  getAllGameInfo,
  getAllGameInfoSorted,
  formatEnabledGamesForDisplay,
  formatEnabledDate,
  formatEnabledDateRelative,
  // Change Detection
  compareGameSelections,
  hasSelectionChanged,
  getSelectionChangeSummary,
  // Enrichment
  enrichProfileGamesWithInfo,
  createProfileGameMap,
  // Onboarding
  getRecommendedGamesForOnboarding,
  getMinGamesMessage,
  validateOnboardingSelection,
} from '../profileGames';

// =============================================================================
// TEST HELPERS
// =============================================================================

function createProfileGame(
  gameSlug: GameSlug,
  enabledAt: number,
  isActive: boolean = true
): ProfileGame {
  return {
    profileId: 'test-profile-id',
    gameSlug,
    enabledAt,
    isActive,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('Profile Games Utility Functions', () => {
  // ===========================================================================
  // CONSTANTS
  // ===========================================================================

  describe('Constants', () => {
    describe('GAME_SLUGS', () => {
      it('should contain exactly 4 games', () => {
        expect(GAME_SLUGS).toHaveLength(4);
      });

      it('should contain all expected game slugs', () => {
        expect(GAME_SLUGS).toContain('pokemon');
        expect(GAME_SLUGS).toContain('yugioh');
        expect(GAME_SLUGS).toContain('onepiece');
        expect(GAME_SLUGS).toContain('lorcana');
      });

      it('should have unique slugs', () => {
        const uniqueSlugs = new Set(GAME_SLUGS);
        expect(uniqueSlugs.size).toBe(GAME_SLUGS.length);
      });
    });

    describe('DEFAULT_GAME', () => {
      it('should be pokemon', () => {
        expect(DEFAULT_GAME).toBe('pokemon');
      });

      it('should be a valid game slug', () => {
        expect(GAME_SLUGS).toContain(DEFAULT_GAME);
      });
    });

    describe('GAME_DISPLAY_NAMES', () => {
      it('should have entries for all games', () => {
        for (const slug of GAME_SLUGS) {
          expect(GAME_DISPLAY_NAMES[slug]).toBeDefined();
          expect(typeof GAME_DISPLAY_NAMES[slug]).toBe('string');
          expect(GAME_DISPLAY_NAMES[slug].length).toBeGreaterThan(0);
        }
      });

      it('should have correct names', () => {
        expect(GAME_DISPLAY_NAMES.pokemon).toBe('Pokémon TCG');
        expect(GAME_DISPLAY_NAMES.yugioh).toBe('Yu-Gi-Oh!');
        expect(GAME_DISPLAY_NAMES.onepiece).toBe('One Piece TCG');
        expect(GAME_DISPLAY_NAMES.lorcana).toBe('Disney Lorcana');
      });
    });

    describe('GAME_COLORS', () => {
      it('should have entries for all games', () => {
        for (const slug of GAME_SLUGS) {
          expect(GAME_COLORS[slug]).toBeDefined();
          expect(typeof GAME_COLORS[slug]).toBe('string');
        }
      });

      it('should have valid hex colors', () => {
        const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
        for (const slug of GAME_SLUGS) {
          expect(GAME_COLORS[slug]).toMatch(hexColorRegex);
        }
      });
    });

    describe('GAME_RELEASE_ORDER', () => {
      it('should have entries for all games', () => {
        for (const slug of GAME_SLUGS) {
          expect(GAME_RELEASE_ORDER[slug]).toBeDefined();
          expect(typeof GAME_RELEASE_ORDER[slug]).toBe('number');
        }
      });

      it('should have unique release orders', () => {
        const orders = Object.values(GAME_RELEASE_ORDER);
        const uniqueOrders = new Set(orders);
        expect(uniqueOrders.size).toBe(orders.length);
      });

      it('should have pokemon as first', () => {
        expect(GAME_RELEASE_ORDER.pokemon).toBe(1);
      });
    });
  });

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  describe('Validation', () => {
    describe('isValidGameSlug', () => {
      it('should return true for valid slugs', () => {
        expect(isValidGameSlug('pokemon')).toBe(true);
        expect(isValidGameSlug('yugioh')).toBe(true);
        expect(isValidGameSlug('onepiece')).toBe(true);
        expect(isValidGameSlug('lorcana')).toBe(true);
      });

      it('should return false for invalid slugs', () => {
        expect(isValidGameSlug('invalid')).toBe(false);
        expect(isValidGameSlug('')).toBe(false);
        expect(isValidGameSlug('Pokemon')).toBe(false);
        expect(isValidGameSlug('POKEMON')).toBe(false);
        expect(isValidGameSlug('magic')).toBe(false);
        expect(isValidGameSlug('mtg')).toBe(false);
        expect(isValidGameSlug('digimon')).toBe(false);
        expect(isValidGameSlug('dragonball')).toBe(false);
      });
    });

    describe('validateGameSlugs', () => {
      it('should separate valid and invalid slugs', () => {
        const result = validateGameSlugs(['pokemon', 'invalid', 'lorcana', 'fake']);
        expect(result.valid).toEqual(['pokemon', 'lorcana']);
        expect(result.invalid).toEqual(['invalid', 'fake']);
      });

      it('should return all valid when all are valid', () => {
        const result = validateGameSlugs(['pokemon', 'yugioh']);
        expect(result.valid).toEqual(['pokemon', 'yugioh']);
        expect(result.invalid).toEqual([]);
      });

      it('should return all invalid when none are valid', () => {
        const result = validateGameSlugs(['invalid1', 'invalid2']);
        expect(result.valid).toEqual([]);
        expect(result.invalid).toEqual(['invalid1', 'invalid2']);
      });

      it('should handle empty array', () => {
        const result = validateGameSlugs([]);
        expect(result.valid).toEqual([]);
        expect(result.invalid).toEqual([]);
      });
    });

    describe('isProfileGameActive', () => {
      it('should return true when isActive is true', () => {
        const pg = createProfileGame('pokemon', Date.now(), true);
        expect(isProfileGameActive(pg)).toBe(true);
      });

      it('should return true when isActive is undefined (default)', () => {
        const pg: ProfileGame = {
          profileId: 'test',
          gameSlug: 'pokemon',
          enabledAt: Date.now(),
        };
        expect(isProfileGameActive(pg)).toBe(true);
      });

      it('should return false when isActive is false', () => {
        const pg = createProfileGame('pokemon', Date.now(), false);
        expect(isProfileGameActive(pg)).toBe(false);
      });
    });
  });

  // ===========================================================================
  // FILTERING AND QUERYING
  // ===========================================================================

  describe('Filtering and Querying', () => {
    const now = Date.now();
    const sampleGames: ProfileGame[] = [
      createProfileGame('pokemon', now - 3000, true),
      createProfileGame('yugioh', now - 2000, false),
      createProfileGame('lorcana', now - 1000, true),
    ];

    describe('filterActiveGames', () => {
      it('should return only active games', () => {
        const result = filterActiveGames(sampleGames);
        expect(result).toHaveLength(2);
        expect(result.map((pg) => pg.gameSlug)).toEqual(['pokemon', 'lorcana']);
      });

      it('should return empty array when no active games', () => {
        const inactiveGames = sampleGames.map((pg) => ({ ...pg, isActive: false }));
        expect(filterActiveGames(inactiveGames)).toEqual([]);
      });

      it('should return all when all active', () => {
        const activeGames = sampleGames.map((pg) => ({ ...pg, isActive: true }));
        expect(filterActiveGames(activeGames)).toHaveLength(3);
      });
    });

    describe('filterInactiveGames', () => {
      it('should return only inactive games', () => {
        const result = filterInactiveGames(sampleGames);
        expect(result).toHaveLength(1);
        expect(result[0].gameSlug).toBe('yugioh');
      });
    });

    describe('getEnabledSlugs', () => {
      it('should return slugs of active games', () => {
        const result = getEnabledSlugs(sampleGames);
        expect(result).toEqual(['pokemon', 'lorcana']);
      });
    });

    describe('getDisabledSlugs', () => {
      it('should return slugs of inactive games', () => {
        const result = getDisabledSlugs(sampleGames);
        expect(result).toEqual(['yugioh']);
      });
    });

    describe('isGameEnabled', () => {
      it('should return true for enabled game', () => {
        expect(isGameEnabled(sampleGames, 'pokemon')).toBe(true);
      });

      it('should return false for disabled game', () => {
        expect(isGameEnabled(sampleGames, 'yugioh')).toBe(false);
      });

      it('should return false for untracked game', () => {
        expect(isGameEnabled(sampleGames, 'onepiece')).toBe(false);
      });
    });

    describe('findProfileGame', () => {
      it('should find existing game', () => {
        const result = findProfileGame(sampleGames, 'pokemon');
        expect(result).toBeDefined();
        expect(result?.gameSlug).toBe('pokemon');
      });

      it('should return undefined for non-existent game', () => {
        expect(findProfileGame(sampleGames, 'onepiece')).toBeUndefined();
      });
    });

    describe('getUntrackedGames', () => {
      it('should return games not in profile', () => {
        const result = getUntrackedGames(sampleGames);
        expect(result).toContain('onepiece');
        expect(result).not.toContain('pokemon');
        expect(result).not.toContain('yugioh');
        expect(result).not.toContain('lorcana');
      });
    });

    describe('getAvailableGames', () => {
      it('should return games not currently active', () => {
        const result = getAvailableGames(sampleGames);
        expect(result).toContain('yugioh'); // disabled counts as available
        expect(result).toContain('onepiece');
        expect(result).not.toContain('pokemon');
        expect(result).not.toContain('lorcana');
      });
    });
  });

  // ===========================================================================
  // SORTING
  // ===========================================================================

  describe('Sorting', () => {
    const now = Date.now();
    const sampleGames: ProfileGame[] = [
      createProfileGame('lorcana', now - 1000), // enabled 1 sec ago
      createProfileGame('pokemon', now - 3000), // enabled 3 secs ago
      createProfileGame('yugioh', now - 2000), // enabled 2 secs ago
    ];

    describe('sortByEnabledDate', () => {
      it('should sort by enabled date ascending by default', () => {
        const result = sortByEnabledDate(sampleGames);
        expect(result.map((pg) => pg.gameSlug)).toEqual(['pokemon', 'yugioh', 'lorcana']);
      });

      it('should sort descending when specified', () => {
        const result = sortByEnabledDate(sampleGames, false);
        expect(result.map((pg) => pg.gameSlug)).toEqual(['lorcana', 'yugioh', 'pokemon']);
      });

      it('should not mutate original array', () => {
        const original = [...sampleGames];
        sortByEnabledDate(sampleGames);
        expect(sampleGames).toEqual(original);
      });
    });

    describe('sortByReleaseOrder', () => {
      it('should sort by release order ascending', () => {
        const result = sortByReleaseOrder(sampleGames);
        expect(result.map((pg) => pg.gameSlug)).toEqual(['pokemon', 'yugioh', 'lorcana']);
      });

      it('should sort descending when specified', () => {
        const result = sortByReleaseOrder(sampleGames, false);
        expect(result.map((pg) => pg.gameSlug)).toEqual(['lorcana', 'yugioh', 'pokemon']);
      });

      it('should not mutate original array', () => {
        const original = [...sampleGames];
        sortByReleaseOrder(sampleGames);
        expect(sampleGames).toEqual(original);
      });
    });

    describe('sortByDisplayName', () => {
      it('should sort alphabetically by display name', () => {
        const result = sortByDisplayName(sampleGames);
        // Disney Lorcana, Pokémon TCG, Yu-Gi-Oh!
        expect(result.map((pg) => pg.gameSlug)).toEqual(['lorcana', 'pokemon', 'yugioh']);
      });

      it('should not mutate original array', () => {
        const original = [...sampleGames];
        sortByDisplayName(sampleGames);
        expect(sampleGames).toEqual(original);
      });
    });

    describe('sortSlugsByReleaseOrder', () => {
      it('should sort slugs by release order', () => {
        const slugs: GameSlug[] = ['lorcana', 'pokemon', 'yugioh'];
        const result = sortSlugsByReleaseOrder(slugs);
        expect(result).toEqual(['pokemon', 'yugioh', 'lorcana']);
      });
    });
  });

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  describe('Statistics', () => {
    const now = Date.now();
    const sampleGames: ProfileGame[] = [
      createProfileGame('pokemon', now - 3000, true),
      createProfileGame('yugioh', now - 2000, false),
      createProfileGame('lorcana', now - 1000, true),
    ];

    describe('calculateProfileGameStats', () => {
      it('should calculate correct stats', () => {
        const stats = calculateProfileGameStats(sampleGames);
        expect(stats.totalEnabled).toBe(2);
        expect(stats.totalDisabled).toBe(1);
        expect(stats.enabledGames).toEqual(['pokemon', 'lorcana']);
        expect(stats.disabledGames).toEqual(['yugioh']);
        expect(stats.firstGameEnabled?.slug).toBe('pokemon');
        expect(stats.lastGameEnabled?.slug).toBe('lorcana');
      });

      it('should handle empty array', () => {
        const stats = calculateProfileGameStats([]);
        expect(stats.totalEnabled).toBe(0);
        expect(stats.totalDisabled).toBe(0);
        expect(stats.firstGameEnabled).toBeNull();
        expect(stats.lastGameEnabled).toBeNull();
      });
    });

    describe('countEnabledGames', () => {
      it('should count enabled games', () => {
        expect(countEnabledGames(sampleGames)).toBe(2);
      });
    });

    describe('countDisabledGames', () => {
      it('should count disabled games', () => {
        expect(countDisabledGames(sampleGames)).toBe(1);
      });
    });

    describe('hasAnyGamesEnabled', () => {
      it('should return true when games are enabled', () => {
        expect(hasAnyGamesEnabled(sampleGames)).toBe(true);
      });

      it('should return false when no games enabled', () => {
        const noActive = sampleGames.map((pg) => ({ ...pg, isActive: false }));
        expect(hasAnyGamesEnabled(noActive)).toBe(false);
      });
    });

    describe('hasAllGamesEnabled', () => {
      it('should return false when not all games enabled', () => {
        expect(hasAllGamesEnabled(sampleGames)).toBe(false);
      });

      it('should return true when all games enabled', () => {
        const allGames = GAME_SLUGS.map((slug) => createProfileGame(slug, Date.now()));
        expect(hasAllGamesEnabled(allGames)).toBe(true);
      });
    });
  });

  // ===========================================================================
  // DISPLAY HELPERS
  // ===========================================================================

  describe('Display Helpers', () => {
    describe('getGameDisplayName', () => {
      it('should return correct display name', () => {
        expect(getGameDisplayName('pokemon')).toBe('Pok\u00e9mon TCG');
        expect(getGameDisplayName('yugioh')).toBe('Yu-Gi-Oh!');
      });
    });

    describe('getGameColor', () => {
      it('should return correct color', () => {
        expect(getGameColor('pokemon')).toBe('#FFCB05');
      });
    });

    describe('getGameReleaseOrder', () => {
      it('should return correct order', () => {
        expect(getGameReleaseOrder('pokemon')).toBe(1);
        expect(getGameReleaseOrder('lorcana')).toBe(4);
      });
    });

    describe('getGameInfo', () => {
      it('should return full game info', () => {
        const info = getGameInfo('pokemon');
        expect(info.slug).toBe('pokemon');
        expect(info.displayName).toBe('Pok\u00e9mon TCG');
        expect(info.primaryColor).toBe('#FFCB05');
      });
    });

    describe('getAllGameInfo', () => {
      it('should return info for all games', () => {
        const allInfo = getAllGameInfo();
        expect(allInfo).toHaveLength(4);
        expect(allInfo[0].slug).toBeDefined();
      });
    });

    describe('getAllGameInfoSorted', () => {
      it('should return games sorted by release order', () => {
        const sorted = getAllGameInfoSorted();
        expect(sorted[0].slug).toBe('pokemon');
        expect(sorted[3].slug).toBe('lorcana');
      });
    });

    describe('formatEnabledGamesForDisplay', () => {
      it('should format enabled games', () => {
        const games = [
          createProfileGame('pokemon', Date.now()),
          createProfileGame('lorcana', Date.now()),
        ];
        expect(formatEnabledGamesForDisplay(games)).toBe('Pokémon TCG, Disney Lorcana');
      });

      it('should handle empty list', () => {
        expect(formatEnabledGamesForDisplay([])).toBe('No games selected');
      });

      it('should truncate when over maxDisplay', () => {
        const games = [
          createProfileGame('pokemon', Date.now()),
          createProfileGame('yugioh', Date.now()),
          createProfileGame('onepiece', Date.now()),
          createProfileGame('lorcana', Date.now()),
        ];
        expect(formatEnabledGamesForDisplay(games, 2)).toContain('+2 more');
      });
    });

    describe('formatEnabledDate', () => {
      it('should format date correctly', () => {
        // Use a specific UTC timestamp to avoid timezone issues
        const date = new Date('2026-01-15T12:00:00Z').getTime();
        const formatted = formatEnabledDate(date);
        expect(formatted).toContain('Jan');
        expect(formatted).toContain('2026');
        // Just check it has a day number (15 or 14 depending on timezone)
        expect(formatted).toMatch(/\d{1,2}/);
      });
    });

    describe('formatEnabledDateRelative', () => {
      it('should return "Just now" for recent timestamps', () => {
        expect(formatEnabledDateRelative(Date.now())).toBe('Just now');
      });

      it('should return minutes ago', () => {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        expect(formatEnabledDateRelative(fiveMinutesAgo)).toBe('5 minutes ago');
      });

      it('should return hours ago', () => {
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
        expect(formatEnabledDateRelative(twoHoursAgo)).toBe('2 hours ago');
      });

      it('should return days ago', () => {
        const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
        expect(formatEnabledDateRelative(threeDaysAgo)).toBe('3 days ago');
      });

      it('should return absolute date for old timestamps', () => {
        const twoMonthsAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
        expect(formatEnabledDateRelative(twoMonthsAgo)).toContain('2025');
      });
    });
  });

  // ===========================================================================
  // CHANGE DETECTION
  // ===========================================================================

  describe('Change Detection', () => {
    describe('compareGameSelections', () => {
      it('should detect added games', () => {
        const result = compareGameSelections(['pokemon'], ['pokemon', 'lorcana']);
        expect(result.added).toEqual(['lorcana']);
        expect(result.removed).toEqual([]);
        expect(result.unchanged).toEqual(['pokemon']);
      });

      it('should detect removed games', () => {
        const result = compareGameSelections(['pokemon', 'lorcana'], ['pokemon']);
        expect(result.added).toEqual([]);
        expect(result.removed).toEqual(['lorcana']);
        expect(result.unchanged).toEqual(['pokemon']);
      });

      it('should handle no changes', () => {
        const result = compareGameSelections(['pokemon', 'lorcana'], ['pokemon', 'lorcana']);
        expect(result.added).toEqual([]);
        expect(result.removed).toEqual([]);
        expect(result.unchanged).toEqual(['pokemon', 'lorcana']);
      });

      it('should handle complete replacement', () => {
        const result = compareGameSelections(['pokemon'], ['lorcana']);
        expect(result.added).toEqual(['lorcana']);
        expect(result.removed).toEqual(['pokemon']);
        expect(result.unchanged).toEqual([]);
      });
    });

    describe('hasSelectionChanged', () => {
      it('should return true when changes exist', () => {
        expect(hasSelectionChanged(['pokemon'], ['pokemon', 'lorcana'])).toBe(true);
      });

      it('should return false when no changes', () => {
        expect(hasSelectionChanged(['pokemon', 'lorcana'], ['lorcana', 'pokemon'])).toBe(false);
      });
    });

    describe('getSelectionChangeSummary', () => {
      it('should summarize changes', () => {
        const summary = getSelectionChangeSummary(['pokemon'], ['pokemon', 'lorcana']);
        expect(summary).toContain('Added');
        expect(summary).toContain('Disney Lorcana');
      });

      it('should return "No changes" when unchanged', () => {
        expect(getSelectionChangeSummary(['pokemon'], ['pokemon'])).toBe('No changes');
      });
    });
  });

  // ===========================================================================
  // ENRICHMENT
  // ===========================================================================

  describe('Enrichment', () => {
    describe('enrichProfileGamesWithInfo', () => {
      it('should add game info to profile games', () => {
        const games = [createProfileGame('pokemon', Date.now())];
        const enriched = enrichProfileGamesWithInfo(games);
        expect(enriched[0].gameInfo).toBeDefined();
        expect(enriched[0].gameInfo?.displayName).toBe('Pok\u00e9mon TCG');
      });
    });

    describe('createProfileGameMap', () => {
      it('should create map by slug', () => {
        const games = [
          createProfileGame('pokemon', Date.now()),
          createProfileGame('lorcana', Date.now()),
        ];
        const map = createProfileGameMap(games);
        expect(map.get('pokemon')).toBeDefined();
        expect(map.get('lorcana')).toBeDefined();
        expect(map.get('yugioh')).toBeUndefined();
      });
    });
  });

  // ===========================================================================
  // ONBOARDING
  // ===========================================================================

  describe('Onboarding', () => {
    describe('getRecommendedGamesForOnboarding', () => {
      it('should return all games', () => {
        const recommended = getRecommendedGamesForOnboarding();
        expect(recommended).toHaveLength(4);
      });

      it('should have pokemon first', () => {
        expect(getRecommendedGamesForOnboarding()[0]).toBe('pokemon');
      });
    });

    describe('getMinGamesMessage', () => {
      it('should return a message', () => {
        expect(getMinGamesMessage()).toContain('at least one game');
      });
    });

    describe('validateOnboardingSelection', () => {
      it('should be valid with one game', () => {
        expect(validateOnboardingSelection(['pokemon']).valid).toBe(true);
      });

      it('should be invalid with empty selection', () => {
        const result = validateOnboardingSelection([]);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should be invalid with invalid slugs', () => {
        const result = validateOnboardingSelection(['invalid' as GameSlug]);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid');
      });
    });
  });

  // ===========================================================================
  // INTEGRATION SCENARIOS
  // ===========================================================================

  describe('Integration Scenarios', () => {
    describe('New User Onboarding Flow', () => {
      it('should handle typical onboarding flow', () => {
        // User starts with no games
        const initialGames: ProfileGame[] = [];
        expect(hasAnyGamesEnabled(initialGames)).toBe(false);

        // User sees recommended games
        const recommended = getRecommendedGamesForOnboarding();
        expect(recommended[0]).toBe('pokemon');

        // User selects Pokemon and Lorcana
        const selection: GameSlug[] = ['pokemon', 'lorcana'];
        const validation = validateOnboardingSelection(selection);
        expect(validation.valid).toBe(true);

        // After enabling
        const afterOnboarding = selection.map((slug, i) => createProfileGame(slug, Date.now() + i));
        expect(countEnabledGames(afterOnboarding)).toBe(2);
        expect(formatEnabledGamesForDisplay(afterOnboarding)).toContain('Pokémon');
      });
    });

    describe('Adding a New Game', () => {
      it('should handle adding a new game', () => {
        const now = Date.now();
        const currentGames = [createProfileGame('pokemon', now - 10000)];

        // Check available games
        const available = getAvailableGames(currentGames);
        expect(available).toContain('lorcana');
        expect(available).not.toContain('pokemon');

        // Detect change
        const newSelection: GameSlug[] = ['pokemon', 'lorcana'];
        const changes = compareGameSelections(getEnabledSlugs(currentGames), newSelection);
        expect(changes.added).toEqual(['lorcana']);
        expect(hasSelectionChanged(getEnabledSlugs(currentGames), newSelection)).toBe(true);
      });
    });

    describe('Disabling a Game', () => {
      it('should handle disabling a game', () => {
        const now = Date.now();
        const currentGames = [
          createProfileGame('pokemon', now - 20000),
          createProfileGame('lorcana', now - 10000),
        ];

        expect(countEnabledGames(currentGames)).toBe(2);

        // Disable Lorcana
        const afterDisable = [currentGames[0], { ...currentGames[1], isActive: false }];

        expect(countEnabledGames(afterDisable)).toBe(1);
        expect(countDisabledGames(afterDisable)).toBe(1);
        expect(isGameEnabled(afterDisable, 'lorcana')).toBe(false);
        expect(isGameEnabled(afterDisable, 'pokemon')).toBe(true);
      });
    });

    describe('Viewing Game Stats', () => {
      it('should provide complete statistics', () => {
        const now = Date.now();
        const games = [
          createProfileGame('pokemon', now - 30000),
          createProfileGame('yugioh', now - 20000, false),
          createProfileGame('onepiece', now - 10000),
          createProfileGame('lorcana', now - 5000),
        ];

        const stats = calculateProfileGameStats(games);

        expect(stats.totalEnabled).toBe(3);
        expect(stats.totalDisabled).toBe(1);
        expect(stats.firstGameEnabled?.slug).toBe('pokemon');
        expect(stats.lastGameEnabled?.slug).toBe('lorcana');
        expect(stats.disabledGames).toEqual(['yugioh']);
      });
    });
  });
});
