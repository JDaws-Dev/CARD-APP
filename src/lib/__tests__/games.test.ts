/**
 * Tests for games table utility functions
 */
import { describe, it, expect } from 'vitest';

// Import types and constants from tcg-api for validation
import {
  GAME_CONFIGS,
  GAME_SLUGS,
  ACTIVE_GAMES,
  isValidGameSlug,
  getGameConfig,
  getGameConfigSafe,
  getGameDisplayName,
  getGamePrimaryColor,
  getActiveGames,
  type GameSlug,
} from '../tcg-api';

describe('Games Schema Validation', () => {
  describe('GAME_SLUGS constant', () => {
    it('should have exactly 7 supported games', () => {
      expect(GAME_SLUGS).toHaveLength(7);
    });

    it('should include all expected game slugs', () => {
      const expectedSlugs: GameSlug[] = [
        'pokemon',
        'yugioh',
        'mtg',
        'onepiece',
        'lorcana',
        'digimon',
        'dragonball',
      ];
      expect(GAME_SLUGS).toEqual(expect.arrayContaining(expectedSlugs));
    });

    it('should have unique game slugs', () => {
      const uniqueSlugs = new Set(GAME_SLUGS);
      expect(uniqueSlugs.size).toBe(GAME_SLUGS.length);
    });
  });

  describe('GAME_CONFIGS constant', () => {
    it('should have config for each game slug', () => {
      for (const slug of GAME_SLUGS) {
        expect(GAME_CONFIGS[slug]).toBeDefined();
        expect(GAME_CONFIGS[slug].slug).toBe(slug);
      }
    });

    it('should have required fields for each game', () => {
      for (const slug of GAME_SLUGS) {
        const config = GAME_CONFIGS[slug];
        expect(config.displayName).toBeTruthy();
        expect(config.apiSource).toBeTruthy();
        expect(config.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(config.secondaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(typeof config.isActive).toBe('boolean');
        expect(typeof config.releaseOrder).toBe('number');
      }
    });

    it('should have unique release orders', () => {
      const releaseOrders = Object.values(GAME_CONFIGS).map((c) => c.releaseOrder);
      const uniqueOrders = new Set(releaseOrders);
      expect(uniqueOrders.size).toBe(releaseOrders.length);
    });

    it('should have release orders from 1 to 7', () => {
      const releaseOrders = Object.values(GAME_CONFIGS)
        .map((c) => c.releaseOrder)
        .sort((a, b) => a - b);
      expect(releaseOrders).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('should have valid hex colors', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      for (const slug of GAME_SLUGS) {
        const config = GAME_CONFIGS[slug];
        expect(config.primaryColor).toMatch(hexColorRegex);
        expect(config.secondaryColor).toMatch(hexColorRegex);
      }
    });
  });

  describe('ACTIVE_GAMES constant', () => {
    it('should be sorted by release order', () => {
      for (let i = 0; i < ACTIVE_GAMES.length - 1; i++) {
        const currentOrder = GAME_CONFIGS[ACTIVE_GAMES[i]].releaseOrder;
        const nextOrder = GAME_CONFIGS[ACTIVE_GAMES[i + 1]].releaseOrder;
        expect(currentOrder).toBeLessThan(nextOrder);
      }
    });

    it('should only include active games', () => {
      for (const slug of ACTIVE_GAMES) {
        expect(GAME_CONFIGS[slug].isActive).toBe(true);
      }
    });
  });
});

describe('Game Validation Functions', () => {
  describe('isValidGameSlug', () => {
    it('should return true for valid game slugs', () => {
      expect(isValidGameSlug('pokemon')).toBe(true);
      expect(isValidGameSlug('yugioh')).toBe(true);
      expect(isValidGameSlug('mtg')).toBe(true);
      expect(isValidGameSlug('onepiece')).toBe(true);
      expect(isValidGameSlug('lorcana')).toBe(true);
      expect(isValidGameSlug('digimon')).toBe(true);
      expect(isValidGameSlug('dragonball')).toBe(true);
    });

    it('should return false for invalid game slugs', () => {
      expect(isValidGameSlug('invalid')).toBe(false);
      expect(isValidGameSlug('')).toBe(false);
      expect(isValidGameSlug('Pokemon')).toBe(false); // Case sensitive
      expect(isValidGameSlug('POKEMON')).toBe(false);
      expect(isValidGameSlug('magic')).toBe(false);
      expect(isValidGameSlug('one-piece')).toBe(false);
    });
  });

  describe('getGameConfig', () => {
    it('should return config for valid slugs', () => {
      const config = getGameConfig('pokemon');
      expect(config.slug).toBe('pokemon');
      expect(config.displayName).toBe('Pokémon TCG');
      expect(config.apiSource).toBe('pokemontcg.io');
    });

    it('should throw for invalid slugs', () => {
      expect(() => getGameConfig('invalid' as GameSlug)).toThrow('Invalid game slug: invalid');
    });
  });

  describe('getGameConfigSafe', () => {
    it('should return config for valid slugs', () => {
      const config = getGameConfigSafe('pokemon');
      expect(config).not.toBeNull();
      expect(config?.slug).toBe('pokemon');
    });

    it('should return null for invalid slugs', () => {
      expect(getGameConfigSafe('invalid')).toBeNull();
      expect(getGameConfigSafe('')).toBeNull();
    });
  });
});

describe('Game Display Helpers', () => {
  describe('getGameDisplayName', () => {
    it('should return correct display names', () => {
      expect(getGameDisplayName('pokemon')).toBe('Pokémon TCG');
      expect(getGameDisplayName('yugioh')).toBe('Yu-Gi-Oh!');
      expect(getGameDisplayName('mtg')).toBe('Magic: The Gathering');
      expect(getGameDisplayName('onepiece')).toBe('One Piece TCG');
      expect(getGameDisplayName('lorcana')).toBe('Disney Lorcana');
      expect(getGameDisplayName('digimon')).toBe('Digimon TCG');
      expect(getGameDisplayName('dragonball')).toBe('Dragon Ball Fusion World');
    });
  });

  describe('getGamePrimaryColor', () => {
    it('should return correct primary colors', () => {
      expect(getGamePrimaryColor('pokemon')).toBe('#FFCB05');
      expect(getGamePrimaryColor('yugioh')).toBe('#1D1D1D');
      expect(getGamePrimaryColor('mtg')).toBe('#000000');
      expect(getGamePrimaryColor('onepiece')).toBe('#E74C3C');
      expect(getGamePrimaryColor('lorcana')).toBe('#1B1464');
      expect(getGamePrimaryColor('digimon')).toBe('#FF6600');
      expect(getGamePrimaryColor('dragonball')).toBe('#FF8C00');
    });
  });

  describe('getActiveGames', () => {
    it('should return array of game configs', () => {
      const activeGames = getActiveGames();
      expect(Array.isArray(activeGames)).toBe(true);
      expect(activeGames.length).toBeGreaterThan(0);
    });

    it('should return configs sorted by release order', () => {
      const activeGames = getActiveGames();
      for (let i = 0; i < activeGames.length - 1; i++) {
        expect(activeGames[i].releaseOrder).toBeLessThan(activeGames[i + 1].releaseOrder);
      }
    });

    it('should include all active games', () => {
      const activeGames = getActiveGames();
      const activeSlugs = activeGames.map((g) => g.slug);

      for (const slug of GAME_SLUGS) {
        if (GAME_CONFIGS[slug].isActive) {
          expect(activeSlugs).toContain(slug);
        }
      }
    });
  });
});

describe('Game-specific Configuration', () => {
  describe('Pokemon TCG', () => {
    it('should have correct configuration', () => {
      const config = GAME_CONFIGS.pokemon;
      expect(config.displayName).toBe('Pokémon TCG');
      expect(config.apiSource).toBe('pokemontcg.io');
      expect(config.primaryColor).toBe('#FFCB05'); // Pokemon yellow
      expect(config.secondaryColor).toBe('#3466AF'); // Pokemon blue
      expect(config.releaseOrder).toBe(1);
      expect(config.isActive).toBe(true);
    });
  });

  describe('Yu-Gi-Oh!', () => {
    it('should have correct configuration', () => {
      const config = GAME_CONFIGS.yugioh;
      expect(config.displayName).toBe('Yu-Gi-Oh!');
      expect(config.apiSource).toBe('ygoprodeck.com');
      expect(config.primaryColor).toBe('#1D1D1D'); // Dark
      expect(config.secondaryColor).toBe('#B8860B'); // Gold
      expect(config.releaseOrder).toBe(2);
      expect(config.isActive).toBe(true);
    });
  });

  describe('Magic: The Gathering', () => {
    it('should have correct configuration', () => {
      const config = GAME_CONFIGS.mtg;
      expect(config.displayName).toBe('Magic: The Gathering');
      expect(config.apiSource).toBe('scryfall.com');
      expect(config.primaryColor).toBe('#000000'); // Black
      expect(config.releaseOrder).toBe(3);
      expect(config.isActive).toBe(true);
    });
  });

  describe('One Piece TCG', () => {
    it('should have correct configuration', () => {
      const config = GAME_CONFIGS.onepiece;
      expect(config.displayName).toBe('One Piece TCG');
      expect(config.apiSource).toBe('optcg-api');
      expect(config.primaryColor).toBe('#E74C3C'); // Red
      expect(config.secondaryColor).toBe('#3498DB'); // Blue
      expect(config.releaseOrder).toBe(4);
      expect(config.isActive).toBe(true);
    });
  });

  describe('Disney Lorcana', () => {
    it('should have correct configuration', () => {
      const config = GAME_CONFIGS.lorcana;
      expect(config.displayName).toBe('Disney Lorcana');
      expect(config.apiSource).toBe('lorcast.com');
      expect(config.primaryColor).toBe('#1B1464'); // Deep purple
      expect(config.secondaryColor).toBe('#F5A623'); // Gold
      expect(config.releaseOrder).toBe(5);
      expect(config.isActive).toBe(true);
    });
  });

  describe('Digimon TCG', () => {
    it('should have correct configuration', () => {
      const config = GAME_CONFIGS.digimon;
      expect(config.displayName).toBe('Digimon TCG');
      expect(config.apiSource).toBe('digimoncard.io');
      expect(config.primaryColor).toBe('#FF6600'); // Orange
      expect(config.secondaryColor).toBe('#0066FF'); // Blue
      expect(config.releaseOrder).toBe(6);
      expect(config.isActive).toBe(true);
    });
  });

  describe('Dragon Ball Fusion World', () => {
    it('should have correct configuration', () => {
      const config = GAME_CONFIGS.dragonball;
      expect(config.displayName).toBe('Dragon Ball Fusion World');
      expect(config.apiSource).toBe('apitcg.com');
      expect(config.primaryColor).toBe('#FF8C00'); // Orange
      expect(config.secondaryColor).toBe('#4169E1'); // Royal blue
      expect(config.releaseOrder).toBe(7);
      expect(config.isActive).toBe(true);
    });
  });
});

describe('Integration Scenarios', () => {
  describe('Game selection flow', () => {
    it('should support getting all active games for a selector', () => {
      const activeGames = getActiveGames();

      // Simulate UI game selector options
      const options = activeGames.map((game) => ({
        value: game.slug,
        label: game.displayName,
        color: game.primaryColor,
      }));

      expect(options.length).toBe(7);
      expect(options[0].value).toBe('pokemon'); // First by release order
      expect(options[0].label).toBe('Pokémon TCG');
    });
  });

  describe('Game theming', () => {
    it('should provide colors for dynamic theming', () => {
      const game = 'pokemon' as const;
      const config = getGameConfig(game);

      // Simulate CSS variable assignment
      const cssVars = {
        '--game-primary': config.primaryColor,
        '--game-secondary': config.secondaryColor,
      };

      expect(cssVars['--game-primary']).toBe('#FFCB05');
      expect(cssVars['--game-secondary']).toBe('#3466AF');
    });
  });

  describe('Game validation in collection operations', () => {
    it('should validate game slug before collection operations', () => {
      const validSlug = 'pokemon';
      const invalidSlug = 'fake-game';

      expect(isValidGameSlug(validSlug)).toBe(true);
      expect(isValidGameSlug(invalidSlug)).toBe(false);

      if (isValidGameSlug(validSlug)) {
        const config = getGameConfig(validSlug);
        expect(config).toBeDefined();
      }
    });
  });
});
