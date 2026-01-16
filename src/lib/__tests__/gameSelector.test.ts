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
  // CSS Variable theming functions
  getGameCssVariables,
  getGameThemeStyles,
  getGameCssVariableName,
  getGameColorStyle,
  GAME_CSS_VARIABLES,
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

// ============================================================================
// CSS VARIABLE THEMING TESTS
// ============================================================================

describe('Game Selector - CSS Variable Theming', () => {
  describe('GAME_CSS_VARIABLES', () => {
    it('should have CSS variables for all games', () => {
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
        expect(GAME_CSS_VARIABLES[id]).toBeDefined();
      }
    });

    it('should have all required color properties for each game', () => {
      for (const gameId of Object.keys(GAME_CSS_VARIABLES) as GameId[]) {
        const vars = GAME_CSS_VARIABLES[gameId];
        expect(vars.primary).toBeDefined();
        expect(vars.primaryRgb).toBeDefined();
        expect(vars.secondary).toBeDefined();
        expect(vars.secondaryRgb).toBeDefined();
        expect(vars.accent).toBeDefined();
        expect(vars.accentRgb).toBeDefined();
        expect(vars.text).toBeDefined();
        expect(vars.textRgb).toBeDefined();
        expect(vars.border).toBeDefined();
        expect(vars.borderRgb).toBeDefined();
      }
    });

    it('should have valid hex color format for primary colors', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      for (const gameId of Object.keys(GAME_CSS_VARIABLES) as GameId[]) {
        const vars = GAME_CSS_VARIABLES[gameId];
        expect(vars.primary).toMatch(hexColorRegex);
        expect(vars.secondary).toMatch(hexColorRegex);
        expect(vars.accent).toMatch(hexColorRegex);
        expect(vars.text).toMatch(hexColorRegex);
        expect(vars.border).toMatch(hexColorRegex);
      }
    });

    it('should have valid RGB format (comma-separated)', () => {
      const rgbRegex = /^\d{1,3}, \d{1,3}, \d{1,3}$/;
      for (const gameId of Object.keys(GAME_CSS_VARIABLES) as GameId[]) {
        const vars = GAME_CSS_VARIABLES[gameId];
        expect(vars.primaryRgb).toMatch(rgbRegex);
        expect(vars.secondaryRgb).toMatch(rgbRegex);
        expect(vars.accentRgb).toMatch(rgbRegex);
        expect(vars.textRgb).toMatch(rgbRegex);
        expect(vars.borderRgb).toMatch(rgbRegex);
      }
    });

    it('should have distinct colors for each game', () => {
      const primaryColors = new Set<string>();
      for (const gameId of Object.keys(GAME_CSS_VARIABLES) as GameId[]) {
        const primary = GAME_CSS_VARIABLES[gameId].primary;
        expect(primaryColors.has(primary)).toBe(false);
        primaryColors.add(primary);
      }
    });
  });

  describe('getGameCssVariables', () => {
    it('should return CSS variables for valid game', () => {
      const vars = getGameCssVariables('pokemon');
      expect(vars.primary).toBe('#eab308');
      expect(vars.secondary).toBe('#ef4444');
    });

    it('should return Pokemon fallback for invalid game', () => {
      const vars = getGameCssVariables('invalid' as GameId);
      expect(vars).toEqual(GAME_CSS_VARIABLES.pokemon);
    });

    it('should return distinct colors for different games', () => {
      const pokemonVars = getGameCssVariables('pokemon');
      const yugiohVars = getGameCssVariables('yugioh');
      expect(pokemonVars.primary).not.toBe(yugiohVars.primary);
    });

    it('should return Yu-Gi-Oh! purple theme', () => {
      const vars = getGameCssVariables('yugioh');
      expect(vars.primary).toBe('#8b5cf6');
    });

    it('should return One Piece red theme', () => {
      const vars = getGameCssVariables('onepiece');
      expect(vars.primary).toBe('#ef4444');
    });

    it('should return Dragon Ball orange theme', () => {
      const vars = getGameCssVariables('dragonball');
      expect(vars.primary).toBe('#f97316');
    });

    it('should return Lorcana blue theme', () => {
      const vars = getGameCssVariables('lorcana');
      expect(vars.primary).toBe('#3b82f6');
    });

    it('should return Digimon cyan theme', () => {
      const vars = getGameCssVariables('digimon');
      expect(vars.primary).toBe('#06b6d4');
    });

    it('should return MTG amber theme', () => {
      const vars = getGameCssVariables('mtg');
      expect(vars.primary).toBe('#d97706');
    });
  });

  describe('getGameThemeStyles', () => {
    it('should return CSS variable assignments as style object', () => {
      const styles = getGameThemeStyles('pokemon');
      expect(styles['--game-primary']).toBe('#eab308');
      expect(styles['--game-secondary']).toBe('#ef4444');
      expect(styles['--game-primary-rgb']).toBe('234, 179, 8');
    });

    it('should include all 10 CSS variable properties', () => {
      const styles = getGameThemeStyles('pokemon');
      const expectedProperties = [
        '--game-primary',
        '--game-primary-rgb',
        '--game-secondary',
        '--game-secondary-rgb',
        '--game-accent',
        '--game-accent-rgb',
        '--game-text',
        '--game-text-rgb',
        '--game-border',
        '--game-border-rgb',
      ];
      for (const prop of expectedProperties) {
        expect(styles[prop]).toBeDefined();
      }
    });

    it('should return different styles for different games', () => {
      const pokemonStyles = getGameThemeStyles('pokemon');
      const yugiohStyles = getGameThemeStyles('yugioh');
      expect(pokemonStyles['--game-primary']).not.toBe(yugiohStyles['--game-primary']);
    });

    it('should be usable as inline style object', () => {
      const styles = getGameThemeStyles('pokemon');
      // Style object should be a plain object
      expect(typeof styles).toBe('object');
      expect(Array.isArray(styles)).toBe(false);
      // Values should be strings
      expect(typeof styles['--game-primary']).toBe('string');
    });
  });

  describe('getGameCssVariableName', () => {
    it('should return correct variable name format', () => {
      expect(getGameCssVariableName('pokemon', 'primary')).toBe('--game-pokemon-primary');
      expect(getGameCssVariableName('yugioh', 'secondary')).toBe('--game-yugioh-secondary');
      expect(getGameCssVariableName('mtg', 'accent')).toBe('--game-mtg-accent');
    });

    it('should support all color types', () => {
      const colorTypes = ['primary', 'secondary', 'accent', 'text', 'border'] as const;
      for (const colorType of colorTypes) {
        const varName = getGameCssVariableName('pokemon', colorType);
        expect(varName).toBe(`--game-pokemon-${colorType}`);
      }
    });

    it('should work for all game IDs', () => {
      const gameIds: GameId[] = [
        'pokemon',
        'yugioh',
        'onepiece',
        'dragonball',
        'lorcana',
        'digimon',
        'mtg',
      ];
      for (const gameId of gameIds) {
        const varName = getGameCssVariableName(gameId, 'primary');
        expect(varName).toBe(`--game-${gameId}-primary`);
      }
    });
  });

  describe('getGameColorStyle', () => {
    it('should return style object with CSS variable reference', () => {
      const style = getGameColorStyle('pokemon', 'primary');
      expect(style.color).toBe('var(--game-pokemon-primary)');
    });

    it('should support custom CSS property', () => {
      const bgStyle = getGameColorStyle('yugioh', 'accent', 'backgroundColor');
      expect(bgStyle.backgroundColor).toBe('var(--game-yugioh-accent)');

      const borderStyle = getGameColorStyle('mtg', 'border', 'borderColor');
      expect(borderStyle.borderColor).toBe('var(--game-mtg-border)');
    });

    it('should default to color property', () => {
      const style = getGameColorStyle('lorcana', 'text');
      expect(style.color).toBeDefined();
      expect(Object.keys(style).length).toBe(1);
    });

    it('should work with all color types', () => {
      const colorTypes = ['primary', 'secondary', 'accent', 'text', 'border'] as const;
      for (const colorType of colorTypes) {
        const style = getGameColorStyle('digimon', colorType);
        expect(style.color).toBe(`var(--game-digimon-${colorType})`);
      }
    });
  });

  describe('CSS Variable Theming - Integration', () => {
    it('should have matching colors between static vars and dynamic styles', () => {
      for (const gameId of Object.keys(GAME_CSS_VARIABLES) as GameId[]) {
        const staticVars = GAME_CSS_VARIABLES[gameId];
        const dynamicStyles = getGameThemeStyles(gameId);

        // Dynamic theme styles should use values from static vars
        expect(dynamicStyles['--game-primary']).toBe(staticVars.primary);
        expect(dynamicStyles['--game-secondary']).toBe(staticVars.secondary);
        expect(dynamicStyles['--game-accent']).toBe(staticVars.accent);
      }
    });

    it('should provide complete theme coverage for each game', () => {
      for (const gameId of Object.keys(GAME_CSS_VARIABLES) as GameId[]) {
        const info = getGameInfo(gameId);
        const cssVars = getGameCssVariables(gameId);

        // Every game with info should have CSS variables
        expect(info).not.toBeNull();
        expect(cssVars).toBeDefined();
        expect(cssVars.primary).toBeTruthy();
      }
    });
  });
});
