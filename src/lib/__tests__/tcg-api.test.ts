/**
 * Tests for Game-Agnostic TCG API Abstraction
 */

import { describe, expect, it } from 'vitest';
import {
  GAME_CONFIGS,
  GAME_SLUGS,
  ACTIVE_GAMES,
  isValidGameSlug,
  getGameConfig,
  getGameConfigSafe,
  parseDexId,
  createDexId,
  getGameDisplayName,
  getGamePrimaryColor,
  getActiveGames,
  getGameFromDexId,
  type GameSlug,
  type UnifiedCard,
  type UnifiedSet,
} from '../tcg-api';

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe('TCG API Constants', () => {
  describe('GAME_CONFIGS', () => {
    it('should have configuration for all 4 supported games', () => {
      expect(Object.keys(GAME_CONFIGS)).toHaveLength(4);
    });

    it('should have valid config structure for each game', () => {
      for (const [slug, config] of Object.entries(GAME_CONFIGS)) {
        expect(config.slug).toBe(slug);
        expect(config.displayName).toBeDefined();
        expect(typeof config.displayName).toBe('string');
        expect(config.apiSource).toBeDefined();
        expect(typeof config.primaryColor).toBe('string');
        expect(config.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(typeof config.secondaryColor).toBe('string');
        expect(config.secondaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(typeof config.releaseOrder).toBe('number');
        expect(typeof config.isActive).toBe('boolean');
      }
    });

    it('should have unique release orders', () => {
      const releaseOrders = Object.values(GAME_CONFIGS).map((c) => c.releaseOrder);
      const uniqueOrders = new Set(releaseOrders);
      expect(uniqueOrders.size).toBe(releaseOrders.length);
    });

    it('should have Pokemon TCG as release order 1', () => {
      expect(GAME_CONFIGS.pokemon.releaseOrder).toBe(1);
    });

    it('should include all expected games', () => {
      expect(GAME_CONFIGS.pokemon).toBeDefined();
      expect(GAME_CONFIGS.yugioh).toBeDefined();
      expect(GAME_CONFIGS.onepiece).toBeDefined();
      expect(GAME_CONFIGS.lorcana).toBeDefined();
    });
  });

  describe('GAME_SLUGS', () => {
    it('should contain all 4 game slugs', () => {
      expect(GAME_SLUGS).toHaveLength(4);
    });

    it('should contain expected slugs', () => {
      expect(GAME_SLUGS).toContain('pokemon');
      expect(GAME_SLUGS).toContain('yugioh');
      expect(GAME_SLUGS).toContain('onepiece');
      expect(GAME_SLUGS).toContain('lorcana');
    });
  });

  describe('ACTIVE_GAMES', () => {
    it('should contain all active games', () => {
      const activeCount = Object.values(GAME_CONFIGS).filter((c) => c.isActive).length;
      expect(ACTIVE_GAMES).toHaveLength(activeCount);
    });

    it('should be sorted by release order', () => {
      for (let i = 1; i < ACTIVE_GAMES.length; i++) {
        const prev = GAME_CONFIGS[ACTIVE_GAMES[i - 1]];
        const curr = GAME_CONFIGS[ACTIVE_GAMES[i]];
        expect(prev.releaseOrder).toBeLessThan(curr.releaseOrder);
      }
    });
  });
});

// =============================================================================
// VALIDATION HELPERS TESTS
// =============================================================================

describe('Validation Helpers', () => {
  describe('isValidGameSlug', () => {
    it('should return true for valid game slugs', () => {
      expect(isValidGameSlug('pokemon')).toBe(true);
      expect(isValidGameSlug('yugioh')).toBe(true);
      expect(isValidGameSlug('onepiece')).toBe(true);
      expect(isValidGameSlug('lorcana')).toBe(true);
    });

    it('should return false for invalid game slugs', () => {
      expect(isValidGameSlug('invalid')).toBe(false);
      expect(isValidGameSlug('')).toBe(false);
      expect(isValidGameSlug('POKEMON')).toBe(false); // Case sensitive
      expect(isValidGameSlug('Pokemon')).toBe(false);
      expect(isValidGameSlug('magic')).toBe(false);
      expect(isValidGameSlug('ygo')).toBe(false);
      expect(isValidGameSlug('mtg')).toBe(false);
      expect(isValidGameSlug('digimon')).toBe(false);
      expect(isValidGameSlug('dragonball')).toBe(false);
    });
  });

  describe('getGameConfig', () => {
    it('should return config for valid game slugs', () => {
      const config = getGameConfig('pokemon');
      expect(config.slug).toBe('pokemon');
      expect(config.displayName).toBe('Pokémon TCG');
    });

    it('should throw for invalid game slugs', () => {
      expect(() => getGameConfig('invalid' as GameSlug)).toThrow('Invalid game slug: invalid');
    });
  });

  describe('getGameConfigSafe', () => {
    it('should return config for valid game slugs', () => {
      const config = getGameConfigSafe('pokemon');
      expect(config).not.toBeNull();
      expect(config?.slug).toBe('pokemon');
    });

    it('should return null for invalid game slugs', () => {
      expect(getGameConfigSafe('invalid')).toBeNull();
      expect(getGameConfigSafe('')).toBeNull();
    });
  });
});

// =============================================================================
// DEX ID UTILITIES TESTS
// =============================================================================

describe('DexId Utilities', () => {
  describe('parseDexId', () => {
    it('should parse valid Pokemon dexId', () => {
      const result = parseDexId('pokemon-sv1-1');
      expect(result).toEqual({ game: 'pokemon', cardId: 'sv1-1' });
    });

    it('should parse valid Yu-Gi-Oh! dexId', () => {
      const result = parseDexId('yugioh-46986414');
      expect(result).toEqual({ game: 'yugioh', cardId: '46986414' });
    });

    it('should parse valid One Piece dexId', () => {
      const result = parseDexId('onepiece-OP01-001');
      expect(result).toEqual({ game: 'onepiece', cardId: 'OP01-001' });
    });

    it('should parse valid Lorcana dexId', () => {
      const result = parseDexId('lorcana-1-42');
      expect(result).toEqual({ game: 'lorcana', cardId: '1-42' });
    });

    it('should return null for invalid dexId without hyphen', () => {
      expect(parseDexId('pokemonsv11')).toBeNull();
    });

    it('should return null for invalid game in dexId', () => {
      expect(parseDexId('invalid-card-1')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseDexId('')).toBeNull();
    });

    it('should handle dexId with multiple hyphens', () => {
      const result = parseDexId('pokemon-swsh12pt5-GG01');
      expect(result).toEqual({ game: 'pokemon', cardId: 'swsh12pt5-GG01' });
    });
  });

  describe('createDexId', () => {
    it('should create valid dexId for Pokemon', () => {
      expect(createDexId('pokemon', 'sv1-1')).toBe('pokemon-sv1-1');
    });

    it('should create valid dexId for Yu-Gi-Oh!', () => {
      expect(createDexId('yugioh', '46986414')).toBe('yugioh-46986414');
    });

    it('should create valid dexId for One Piece', () => {
      expect(createDexId('onepiece', 'OP01-001')).toBe('onepiece-OP01-001');
    });

    it('should create valid dexId for Lorcana', () => {
      expect(createDexId('lorcana', '1-42')).toBe('lorcana-1-42');
    });
  });

  describe('parseDexId and createDexId roundtrip', () => {
    it('should roundtrip correctly for all games', () => {
      const testCases: Array<{ game: GameSlug; cardId: string }> = [
        { game: 'pokemon', cardId: 'sv1-1' },
        { game: 'yugioh', cardId: '46986414' },
        { game: 'onepiece', cardId: 'OP01-001' },
        { game: 'lorcana', cardId: '1-42' },
      ];

      for (const { game, cardId } of testCases) {
        const dexId = createDexId(game, cardId);
        const parsed = parseDexId(dexId);
        expect(parsed).toEqual({ game, cardId });
      }
    });
  });
});

// =============================================================================
// DISPLAY HELPERS TESTS
// =============================================================================

describe('Display Helpers', () => {
  describe('getGameDisplayName', () => {
    it('should return display names for all games', () => {
      expect(getGameDisplayName('pokemon')).toBe('Pokémon TCG');
      expect(getGameDisplayName('yugioh')).toBe('Yu-Gi-Oh!');
      expect(getGameDisplayName('onepiece')).toBe('One Piece TCG');
      expect(getGameDisplayName('lorcana')).toBe('Disney Lorcana');
    });

    it('should return slug for invalid game (fallback)', () => {
      expect(getGameDisplayName('invalid' as GameSlug)).toBe('invalid');
    });
  });

  describe('getGamePrimaryColor', () => {
    it('should return hex color for all games', () => {
      expect(getGamePrimaryColor('pokemon')).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(getGamePrimaryColor('yugioh')).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(getGamePrimaryColor('onepiece')).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(getGamePrimaryColor('lorcana')).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should return Pokemon yellow', () => {
      expect(getGamePrimaryColor('pokemon')).toBe('#FFCB05');
    });
  });

  describe('getActiveGames', () => {
    it('should return array of game configs', () => {
      const games = getActiveGames();
      expect(Array.isArray(games)).toBe(true);
      expect(games.length).toBeGreaterThan(0);
    });

    it('should return games in release order', () => {
      const games = getActiveGames();
      for (let i = 1; i < games.length; i++) {
        expect(games[i - 1].releaseOrder).toBeLessThan(games[i].releaseOrder);
      }
    });

    it('should have Pokemon first', () => {
      const games = getActiveGames();
      expect(games[0].slug).toBe('pokemon');
    });
  });

  describe('getGameFromDexId', () => {
    it('should return game config for valid dexId', () => {
      const config = getGameFromDexId('pokemon-sv1-1');
      expect(config).not.toBeNull();
      expect(config?.slug).toBe('pokemon');
    });

    it('should return null for invalid dexId', () => {
      expect(getGameFromDexId('invalid-card')).toBeNull();
      expect(getGameFromDexId('')).toBeNull();
      expect(getGameFromDexId('cardonly')).toBeNull();
    });
  });
});

// =============================================================================
// UNIFIED TYPE TESTS
// =============================================================================

describe('Unified Types', () => {
  describe('UnifiedCard interface', () => {
    it('should have required properties', () => {
      const mockCard: UnifiedCard = {
        id: 'sv1-1',
        dexId: 'pokemon-sv1-1',
        game: 'pokemon',
        name: 'Pikachu',
        imageSmall: 'https://example.com/small.jpg',
        imageLarge: 'https://example.com/large.jpg',
        setId: 'sv1',
        setName: 'Scarlet & Violet',
        collectorNumber: '1',
        rarity: 'Common',
        type: 'Pokémon',
        priceNormal: 0.5,
        priceFoil: 1.0,
        originalData: {},
      };

      expect(mockCard.id).toBe('sv1-1');
      expect(mockCard.dexId).toBe('pokemon-sv1-1');
      expect(mockCard.game).toBe('pokemon');
      expect(mockCard.name).toBe('Pikachu');
    });

    it('should allow null for optional fields', () => {
      const mockCard: UnifiedCard = {
        id: 'sv1-1',
        dexId: 'pokemon-sv1-1',
        game: 'pokemon',
        name: 'Pikachu',
        imageSmall: null,
        imageLarge: null,
        setId: 'sv1',
        setName: 'Scarlet & Violet',
        collectorNumber: '1',
        rarity: null,
        type: 'Pokémon',
        priceNormal: null,
        priceFoil: null,
        originalData: {},
      };

      expect(mockCard.imageSmall).toBeNull();
      expect(mockCard.rarity).toBeNull();
      expect(mockCard.priceNormal).toBeNull();
    });
  });

  describe('UnifiedSet interface', () => {
    it('should have required properties', () => {
      const mockSet: UnifiedSet = {
        id: 'sv1',
        dexId: 'pokemon-sv1',
        game: 'pokemon',
        name: 'Scarlet & Violet',
        code: 'sv1',
        cardCount: 198,
        releaseDate: '2023-03-31',
        iconUrl: 'https://example.com/icon.png',
        originalData: {},
      };

      expect(mockSet.id).toBe('sv1');
      expect(mockSet.dexId).toBe('pokemon-sv1');
      expect(mockSet.game).toBe('pokemon');
      expect(mockSet.cardCount).toBe(198);
    });

    it('should allow null for optional fields', () => {
      const mockSet: UnifiedSet = {
        id: 'sv1',
        dexId: 'pokemon-sv1',
        game: 'pokemon',
        name: 'Scarlet & Violet',
        code: 'sv1',
        cardCount: 198,
        releaseDate: null,
        iconUrl: null,
        originalData: {},
      };

      expect(mockSet.releaseDate).toBeNull();
      expect(mockSet.iconUrl).toBeNull();
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Integration Scenarios', () => {
  describe('Multi-game card collection', () => {
    it('should support creating dexIds for cards from multiple games', () => {
      const cards = [
        { game: 'pokemon' as GameSlug, cardId: 'sv1-25' }, // Pikachu
        { game: 'yugioh' as GameSlug, cardId: '46986414' }, // Dark Magician
        { game: 'onepiece' as GameSlug, cardId: 'OP01-001' }, // Luffy
        { game: 'lorcana' as GameSlug, cardId: '1-42' }, // Elsa
      ];

      const dexIds = cards.map((c) => createDexId(c.game, c.cardId));

      expect(dexIds).toHaveLength(4);
      expect(dexIds).toContain('pokemon-sv1-25');
      expect(dexIds).toContain('yugioh-46986414');
      expect(dexIds).toContain('onepiece-OP01-001');
      expect(dexIds).toContain('lorcana-1-42');
    });

    it('should parse mixed collection dexIds back to game/cardId pairs', () => {
      const dexIds = [
        'pokemon-sv1-25',
        'yugioh-46986414',
        'onepiece-OP01-001',
        'lorcana-1-42',
      ];

      const parsed = dexIds.map(parseDexId);

      expect(parsed).toHaveLength(4);
      expect(parsed.every((p) => p !== null)).toBe(true);
      expect(parsed.map((p) => p?.game)).toEqual([
        'pokemon',
        'yugioh',
        'onepiece',
        'lorcana',
      ]);
    });
  });

  describe('Game filtering', () => {
    it('should filter dexIds by game', () => {
      const dexIds = ['pokemon-sv1-1', 'pokemon-sv1-2', 'yugioh-123', 'lorcana-1-42', 'pokemon-sv2-1'];

      const pokemonCards = dexIds.filter((id) => {
        const parsed = parseDexId(id);
        return parsed?.game === 'pokemon';
      });

      expect(pokemonCards).toHaveLength(3);
      expect(pokemonCards).toContain('pokemon-sv1-1');
      expect(pokemonCards).toContain('pokemon-sv1-2');
      expect(pokemonCards).toContain('pokemon-sv2-1');
    });
  });

  describe('Game display information', () => {
    it('should provide consistent display info for UI', () => {
      const games = getActiveGames();

      for (const game of games) {
        expect(game.displayName.length).toBeGreaterThan(0);
        expect(game.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(game.secondaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(game.apiSource.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error handling', () => {
    it('should handle invalid inputs gracefully', () => {
      // parseDexId returns null for invalid input
      expect(parseDexId('')).toBeNull();
      expect(parseDexId('no-hyphen-invalid-game')).toBeNull();
      expect(parseDexId('x')).toBeNull();

      // getGameConfigSafe returns null for invalid input
      expect(getGameConfigSafe('')).toBeNull();
      expect(getGameConfigSafe('notreal')).toBeNull();

      // isValidGameSlug returns false for invalid input
      expect(isValidGameSlug('')).toBe(false);
      expect(isValidGameSlug('notreal')).toBe(false);
    });
  });
});

// =============================================================================
// GAME CONFIG DETAILS TESTS
// =============================================================================

describe('Game Configuration Details', () => {
  describe('Pokemon TCG config', () => {
    it('should have correct Pokemon config', () => {
      const config = GAME_CONFIGS.pokemon;
      expect(config.displayName).toBe('Pokémon TCG');
      expect(config.apiSource).toBe('pokemontcg.io');
      expect(config.isActive).toBe(true);
    });
  });

  describe('Yu-Gi-Oh! config', () => {
    it('should have correct Yu-Gi-Oh! config', () => {
      const config = GAME_CONFIGS.yugioh;
      expect(config.displayName).toBe('Yu-Gi-Oh!');
      expect(config.apiSource).toBe('ygoprodeck.com');
      expect(config.isActive).toBe(true);
    });
  });

  describe('One Piece config', () => {
    it('should have correct One Piece config', () => {
      const config = GAME_CONFIGS.onepiece;
      expect(config.displayName).toBe('One Piece TCG');
      expect(config.apiSource).toBe('optcg-api');
      expect(config.isActive).toBe(true);
    });
  });

  describe('Lorcana config', () => {
    it('should have correct Lorcana config', () => {
      const config = GAME_CONFIGS.lorcana;
      expect(config.displayName).toBe('Disney Lorcana');
      expect(config.apiSource).toBe('lorcast.com');
      expect(config.isActive).toBe(true);
    });
  });
});
