/**
 * Tests for Game Selector library
 */

import {
  getGameInfo,
  getGameInfoSafe,
  getAllGames,
  getGamesWithApiSupport,
  getGameCount,
  isValidGameId,
  getGamesByIds,
  getDefaultGame,
  getGameSelectorOnboarding,
  saveSelectedGames,
  loadSelectedGames,
  hasCompletedGameOnboarding,
  markGameOnboardingComplete,
  resetGameOnboarding,
  formatEnabledGames,
  getGameGradientClasses,
  getGameThemeClasses,
  GAMES,
  DEFAULT_SELECTED_GAMES,
  GAME_SELECTOR_ONBOARDING,
  type GameId,
  type SelectedGames,
} from '../gameSelector';

// ============================================================================
// MOCK LOCALSTORAGE
// ============================================================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
});

// ============================================================================
// BASIC LOOKUP TESTS
// ============================================================================

describe('Game Selector - Lookup Functions', () => {
  describe('getGameInfo', () => {
    it('should return game info by ID', () => {
      const game = getGameInfo('pokemon');
      expect(game).not.toBeNull();
      expect(game?.id).toBe('pokemon');
      expect(game?.name).toBe('Pokémon TCG');
    });

    it('should return null for unknown game ID', () => {
      const game = getGameInfo('unknown' as GameId);
      expect(game).toBeNull();
    });

    it('should return each supported game', () => {
      const gameIds: GameId[] = [
        'pokemon',
        'yugioh',
        'onepiece',
        'dragonball',
        'lorcana',
        'digimon',
        'mtg',
      ];
      for (const id of gameIds) {
        const game = getGameInfo(id);
        expect(game).not.toBeNull();
        expect(game?.id).toBe(id);
      }
    });
  });

  describe('getGameInfoSafe', () => {
    it('should return game info by ID', () => {
      const game = getGameInfoSafe('yugioh');
      expect(game.id).toBe('yugioh');
      expect(game.name).toBe('Yu-Gi-Oh!');
    });

    it('should return default game for unknown ID', () => {
      const game = getGameInfoSafe('unknown' as GameId);
      expect(game).toBe(GAMES[0]);
      expect(game.id).toBe('pokemon');
    });
  });

  describe('getAllGames', () => {
    it('should return all games', () => {
      const games = getAllGames();
      expect(games.length).toBe(7);
      expect(games).toBe(GAMES);
    });

    it('should include Pokemon', () => {
      const games = getAllGames();
      const pokemon = games.find((g) => g.id === 'pokemon');
      expect(pokemon).toBeDefined();
    });

    it('should include all 7 supported games', () => {
      const games = getAllGames();
      const expectedIds = [
        'pokemon',
        'yugioh',
        'onepiece',
        'dragonball',
        'lorcana',
        'digimon',
        'mtg',
      ];
      for (const id of expectedIds) {
        expect(games.some((g) => g.id === id)).toBe(true);
      }
    });
  });

  describe('getGamesWithApiSupport', () => {
    it('should return games with API support', () => {
      const games = getGamesWithApiSupport();
      expect(games.every((g) => g.hasApiSupport === true)).toBe(true);
    });

    it('should include at least one game', () => {
      const games = getGamesWithApiSupport();
      expect(games.length).toBeGreaterThan(0);
    });
  });

  describe('getGameCount', () => {
    it('should return correct count', () => {
      const count = getGameCount();
      expect(count).toBe(7);
      expect(count).toBe(GAMES.length);
    });
  });

  describe('isValidGameId', () => {
    it('should return true for valid game IDs', () => {
      expect(isValidGameId('pokemon')).toBe(true);
      expect(isValidGameId('yugioh')).toBe(true);
      expect(isValidGameId('mtg')).toBe(true);
    });

    it('should return false for invalid game IDs', () => {
      expect(isValidGameId('unknown')).toBe(false);
      expect(isValidGameId('')).toBe(false);
      expect(isValidGameId('POKEMON')).toBe(false); // case sensitive
    });
  });

  describe('getGamesByIds', () => {
    it('should return games by IDs in order', () => {
      const games = getGamesByIds(['mtg', 'pokemon', 'yugioh']);
      expect(games.length).toBe(3);
      expect(games[0].id).toBe('mtg');
      expect(games[1].id).toBe('pokemon');
      expect(games[2].id).toBe('yugioh');
    });

    it('should filter out invalid IDs', () => {
      const games = getGamesByIds(['pokemon', 'invalid' as GameId, 'yugioh']);
      expect(games.length).toBe(2);
      expect(games[0].id).toBe('pokemon');
      expect(games[1].id).toBe('yugioh');
    });

    it('should return empty array for no valid IDs', () => {
      const games = getGamesByIds(['invalid1' as GameId, 'invalid2' as GameId]);
      expect(games.length).toBe(0);
    });
  });

  describe('getDefaultGame', () => {
    it('should return Pokemon as default', () => {
      const game = getDefaultGame();
      expect(game.id).toBe('pokemon');
      expect(game).toBe(GAMES[0]);
    });
  });
});

// ============================================================================
// ONBOARDING CONTENT TESTS
// ============================================================================

describe('Game Selector - Onboarding Content', () => {
  describe('getGameSelectorOnboarding', () => {
    it('should return onboarding content', () => {
      const onboarding = getGameSelectorOnboarding();
      expect(onboarding).toBe(GAME_SELECTOR_ONBOARDING);
      expect(onboarding.id).toBe('game-selector');
    });

    it('should have a title', () => {
      const onboarding = getGameSelectorOnboarding();
      expect(onboarding.title).toBeTruthy();
      expect(onboarding.title).toBe('What do you collect?');
    });

    it('should have a description', () => {
      const onboarding = getGameSelectorOnboarding();
      expect(onboarding.description).toBeTruthy();
    });
  });

  describe('DEFAULT_SELECTED_GAMES', () => {
    it('should have Pokemon as primary', () => {
      expect(DEFAULT_SELECTED_GAMES.primary).toBe('pokemon');
    });

    it('should have Pokemon in enabled list', () => {
      expect(DEFAULT_SELECTED_GAMES.enabled).toContain('pokemon');
    });

    it('should have at least one enabled game', () => {
      expect(DEFAULT_SELECTED_GAMES.enabled.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// LOCALSTORAGE TESTS
// ============================================================================

describe('Game Selector - LocalStorage', () => {
  describe('saveSelectedGames / loadSelectedGames', () => {
    it('should save and load games', () => {
      const games: SelectedGames = {
        primary: 'yugioh',
        enabled: ['yugioh', 'pokemon'],
      };
      saveSelectedGames(games);
      const loaded = loadSelectedGames();
      expect(loaded).toEqual(games);
    });

    it('should return null when no saved games', () => {
      const loaded = loadSelectedGames();
      expect(loaded).toBeNull();
    });

    it('should handle invalid JSON', () => {
      localStorageMock.setItem('carddex-selected-games', 'invalid json');
      const loaded = loadSelectedGames();
      expect(loaded).toBeNull();
    });

    it('should validate primary game ID', () => {
      localStorageMock.setItem(
        'carddex-selected-games',
        JSON.stringify({ primary: 'invalid', enabled: ['pokemon'] })
      );
      const loaded = loadSelectedGames();
      expect(loaded).toBeNull();
    });

    it('should validate enabled game IDs', () => {
      localStorageMock.setItem(
        'carddex-selected-games',
        JSON.stringify({ primary: 'pokemon', enabled: ['invalid'] })
      );
      const loaded = loadSelectedGames();
      expect(loaded).toBeNull();
    });

    it('should ensure primary is in enabled list', () => {
      // Save games where primary is not in enabled
      localStorageMock.setItem(
        'carddex-selected-games',
        JSON.stringify({ primary: 'pokemon', enabled: ['yugioh'] })
      );
      const loaded = loadSelectedGames();
      expect(loaded?.enabled).toContain('pokemon');
    });
  });

  describe('hasCompletedGameOnboarding / markGameOnboardingComplete', () => {
    it('should return false initially', () => {
      expect(hasCompletedGameOnboarding()).toBe(false);
    });

    it('should return true after marking complete', () => {
      markGameOnboardingComplete();
      expect(hasCompletedGameOnboarding()).toBe(true);
    });
  });

  describe('resetGameOnboarding', () => {
    it('should reset onboarding state', () => {
      markGameOnboardingComplete();
      saveSelectedGames({ primary: 'yugioh', enabled: ['yugioh'] });

      resetGameOnboarding();

      expect(hasCompletedGameOnboarding()).toBe(false);
      expect(loadSelectedGames()).toBeNull();
    });
  });
});

// ============================================================================
// DISPLAY HELPERS TESTS
// ============================================================================

describe('Game Selector - Display Helpers', () => {
  describe('formatEnabledGames', () => {
    it('should format single game', () => {
      const result = formatEnabledGames({ primary: 'pokemon', enabled: ['pokemon'] });
      expect(result).toBe('Pokémon');
    });

    it('should format two games', () => {
      const result = formatEnabledGames({ primary: 'pokemon', enabled: ['pokemon', 'yugioh'] });
      expect(result).toBe('Pokémon & Yu-Gi-Oh!');
    });

    it('should format three+ games', () => {
      const result = formatEnabledGames({
        primary: 'pokemon',
        enabled: ['pokemon', 'yugioh', 'mtg'],
      });
      expect(result).toBe('Pokémon +2 more');
    });

    it('should handle empty enabled list', () => {
      const result = formatEnabledGames({ primary: 'pokemon', enabled: [] });
      expect(result).toBe('No games selected');
    });
  });

  describe('getGameGradientClasses', () => {
    it('should return gradient classes for valid game', () => {
      const classes = getGameGradientClasses('pokemon');
      expect(classes).toContain('from-');
      expect(classes).toContain('to-');
    });

    it('should return fallback for invalid game', () => {
      const classes = getGameGradientClasses('invalid' as GameId);
      expect(classes).toBe('from-gray-400 to-gray-500');
    });
  });

  describe('getGameThemeClasses', () => {
    it('should return theme classes for valid game', () => {
      const theme = getGameThemeClasses('pokemon');
      expect(theme.bg).toContain('bg-');
      expect(theme.border).toContain('border-');
      expect(theme.text).toContain('text-');
      expect(theme.primary).toContain('text-');
    });

    it('should return fallback for invalid game', () => {
      const theme = getGameThemeClasses('invalid' as GameId);
      expect(theme.bg).toBe('bg-gray-50');
      expect(theme.border).toBe('border-gray-300');
      expect(theme.text).toBe('text-gray-800');
      expect(theme.primary).toBe('text-gray-600');
    });
  });
});

// ============================================================================
// DATA VALIDATION TESTS
// ============================================================================

describe('Game Selector - Data Validation', () => {
  describe('GAMES data structure', () => {
    it('should have unique IDs', () => {
      const ids = GAMES.map((g) => g.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have required fields for each game', () => {
      for (const game of GAMES) {
        expect(game.id).toBeTruthy();
        expect(game.name).toBeTruthy();
        expect(game.shortName).toBeTruthy();
        expect(game.description).toBeTruthy();
        expect(game.tagline).toBeTruthy();
        expect(game.gradientFrom).toBeTruthy();
        expect(game.gradientTo).toBeTruthy();
        expect(game.primaryColor).toBeTruthy();
        expect(game.bgColor).toBeTruthy();
        expect(game.borderColor).toBeTruthy();
        expect(game.textColor).toBeTruthy();
        expect(game.iconName).toBeTruthy();
        expect(typeof game.hasApiSupport).toBe('boolean');
        expect(game.appealPoints.length).toBeGreaterThan(0);
      }
    });

    it('should have valid Tailwind classes', () => {
      for (const game of GAMES) {
        expect(game.gradientFrom).toMatch(/^from-/);
        expect(game.gradientTo).toMatch(/^to-/);
        expect(game.primaryColor).toMatch(/^text-/);
        expect(game.bgColor).toMatch(/^bg-/);
        expect(game.borderColor).toMatch(/^border-/);
        expect(game.textColor).toMatch(/^text-/);
      }
    });

    it('should have kid-friendly descriptions (no harsh language)', () => {
      const bannedWords = ['hate', 'stupid', 'dumb', 'kill', 'die', 'dead'];
      for (const game of GAMES) {
        const content = `${game.description} ${game.tagline}`.toLowerCase();
        for (const word of bannedWords) {
          expect(content.includes(word)).toBe(false);
        }
      }
    });
  });

  describe('GAME_SELECTOR_ONBOARDING data structure', () => {
    it('should have required fields', () => {
      expect(GAME_SELECTOR_ONBOARDING.id).toBeTruthy();
      expect(GAME_SELECTOR_ONBOARDING.title).toBeTruthy();
      expect(GAME_SELECTOR_ONBOARDING.subtitle).toBeTruthy();
      expect(GAME_SELECTOR_ONBOARDING.description).toBeTruthy();
      expect(GAME_SELECTOR_ONBOARDING.tip).toBeTruthy();
      expect(GAME_SELECTOR_ONBOARDING.gradientFrom).toBeTruthy();
      expect(GAME_SELECTOR_ONBOARDING.gradientTo).toBeTruthy();
    });

    it('should have valid gradient classes', () => {
      expect(GAME_SELECTOR_ONBOARDING.gradientFrom).toMatch(/^from-/);
      expect(GAME_SELECTOR_ONBOARDING.gradientTo).toMatch(/^to-/);
    });
  });
});
