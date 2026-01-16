import { describe, expect, it } from 'vitest';
import {
  // Constants
  GAME_SLUGS,
  RATE_LIMITS,
  API_CONFIGS,
  // Types
  type GameSlug,
  type CachedSet,
  type CachedCard,
  type PopulationStatus,
  // Validation functions
  isValidGameSlug,
  isValidSetId,
  isValidCardId,
  validateSet,
  validateCard,
  // Normalization functions
  normalizeSet,
  normalizeCard,
  // Helper functions
  getRateLimitDelay,
  getApiBaseUrl,
  getSetsEndpoint,
  formatGameName,
  hasPopulationSupport,
  getSupportedGames,
  estimatePopulationTime,
  formatDuration,
  getStatusSummary,
  needsPopulation,
  // Batch processing
  batchArray,
  calculateProgress,
} from '../dataPopulation';

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe('Data Population Constants', () => {
  it('should have all 7 game slugs defined', () => {
    expect(GAME_SLUGS).toHaveLength(7);
    expect(GAME_SLUGS).toContain('pokemon');
    expect(GAME_SLUGS).toContain('yugioh');
    expect(GAME_SLUGS).toContain('mtg');
    expect(GAME_SLUGS).toContain('onepiece');
    expect(GAME_SLUGS).toContain('lorcana');
    expect(GAME_SLUGS).toContain('digimon');
    expect(GAME_SLUGS).toContain('dragonball');
  });

  it('should have rate limits for all games', () => {
    for (const game of GAME_SLUGS) {
      expect(RATE_LIMITS[game]).toBeDefined();
      expect(RATE_LIMITS[game]).toBeGreaterThan(0);
    }
  });

  it('should have digimon with the longest rate limit due to strict API', () => {
    expect(RATE_LIMITS.digimon).toBeGreaterThan(RATE_LIMITS.pokemon);
    expect(RATE_LIMITS.digimon).toBeGreaterThan(RATE_LIMITS.yugioh);
    expect(RATE_LIMITS.digimon).toBeGreaterThan(RATE_LIMITS.mtg);
  });

  it('should have API configs for all games', () => {
    for (const game of GAME_SLUGS) {
      expect(API_CONFIGS[game]).toBeDefined();
      expect(API_CONFIGS[game].baseUrl).toBeDefined();
      expect(API_CONFIGS[game].baseUrl).toMatch(/^https?:\/\//);
      expect(API_CONFIGS[game].setsEndpoint).toBeDefined();
    }
  });
});

// =============================================================================
// VALIDATION FUNCTION TESTS
// =============================================================================

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
    expect(isValidGameSlug('')).toBe(false);
    expect(isValidGameSlug('Pokemon')).toBe(false);
    expect(isValidGameSlug('POKEMON')).toBe(false);
    expect(isValidGameSlug('magic')).toBe(false);
    expect(isValidGameSlug('yu-gi-oh')).toBe(false);
    expect(isValidGameSlug('invalid')).toBe(false);
  });
});

describe('isValidSetId', () => {
  it('should return true for valid set IDs', () => {
    expect(isValidSetId('sv1')).toBe(true);
    expect(isValidSetId('base1')).toBe(true);
    expect(isValidSetId('LOB')).toBe(true);
    expect(isValidSetId('OP01')).toBe(true);
    expect(isValidSetId('TFC')).toBe(true);
  });

  it('should return false for invalid set IDs', () => {
    expect(isValidSetId('')).toBe(false);
    expect(isValidSetId('a'.repeat(101))).toBe(false);
    expect(isValidSetId(null as unknown as string)).toBe(false);
    expect(isValidSetId(undefined as unknown as string)).toBe(false);
    expect(isValidSetId(123 as unknown as string)).toBe(false);
  });
});

describe('isValidCardId', () => {
  it('should return true for valid card IDs', () => {
    expect(isValidCardId('sv1-1')).toBe(true);
    expect(isValidCardId('base1-4')).toBe(true);
    expect(isValidCardId('LOB-001')).toBe(true);
    expect(isValidCardId('89631139-LOB')).toBe(true);
    expect(isValidCardId('mkm-100')).toBe(true);
  });

  it('should return false for invalid card IDs', () => {
    expect(isValidCardId('')).toBe(false);
    expect(isValidCardId('a')).toBe(false);
    expect(isValidCardId('a'.repeat(201))).toBe(false);
    expect(isValidCardId(null as unknown as string)).toBe(false);
  });
});

describe('validateSet', () => {
  const validSet: CachedSet = {
    setId: 'sv1',
    gameSlug: 'pokemon',
    name: 'Scarlet & Violet',
    series: 'Scarlet & Violet',
    releaseDate: '2023-03-31',
    totalCards: 198,
    logoUrl: 'https://example.com/logo.png',
    symbolUrl: 'https://example.com/symbol.png',
  };

  it('should validate a correct set', () => {
    const result = validateSet(validSet);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a set without optional fields', () => {
    const minimalSet: CachedSet = {
      setId: 'sv1',
      gameSlug: 'pokemon',
      name: 'Test Set',
      series: 'Test',
      releaseDate: '2023-01-01',
      totalCards: 100,
    };
    const result = validateSet(minimalSet);
    expect(result.isValid).toBe(true);
  });

  it('should reject set with invalid setId', () => {
    const result = validateSet({ ...validSet, setId: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid or missing setId');
  });

  it('should reject set with invalid gameSlug', () => {
    const result = validateSet({ ...validSet, gameSlug: 'invalid' as GameSlug });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid or missing gameSlug');
  });

  it('should reject set with missing name', () => {
    const result = validateSet({ ...validSet, name: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid or missing name');
  });

  it('should reject set with negative totalCards', () => {
    const result = validateSet({ ...validSet, totalCards: -1 });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid totalCards');
  });
});

describe('validateCard', () => {
  const validCard: CachedCard = {
    cardId: 'sv1-1',
    gameSlug: 'pokemon',
    setId: 'sv1',
    name: 'Bulbasaur',
    number: '1',
    supertype: 'Pokémon',
    subtypes: ['Basic'],
    types: ['Grass'],
    rarity: 'Common',
    imageSmall: 'https://example.com/small.png',
    imageLarge: 'https://example.com/large.png',
    tcgPlayerUrl: 'https://tcgplayer.com/card/123',
    priceMarket: 0.5,
  };

  it('should validate a correct card', () => {
    const result = validateCard(validCard);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a card without optional fields', () => {
    const minimalCard: CachedCard = {
      cardId: 'sv1-1',
      gameSlug: 'pokemon',
      setId: 'sv1',
      name: 'Test Card',
      number: '1',
      supertype: 'Pokémon',
      subtypes: [],
      types: [],
      imageSmall: '',
      imageLarge: '',
    };
    const result = validateCard(minimalCard);
    expect(result.isValid).toBe(true);
  });

  it('should reject card with invalid cardId', () => {
    const result = validateCard({ ...validCard, cardId: 'a' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid or missing cardId');
  });

  it('should reject card with non-array subtypes', () => {
    const result = validateCard({ ...validCard, subtypes: 'Basic' as unknown as string[] });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid subtypes - must be an array');
  });

  it('should reject card with non-array types', () => {
    const result = validateCard({ ...validCard, types: 'Grass' as unknown as string[] });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid types - must be an array');
  });
});

// =============================================================================
// NORMALIZATION FUNCTION TESTS
// =============================================================================

describe('normalizeSet', () => {
  it('should normalize a complete set', () => {
    const set: Partial<CachedSet> = {
      setId: 'sv1',
      name: 'Scarlet & Violet',
      series: 'SV',
      releaseDate: '2023-03-31',
      totalCards: 198,
      logoUrl: 'https://example.com/logo.png',
    };

    const normalized = normalizeSet(set, 'pokemon');
    expect(normalized.setId).toBe('sv1');
    expect(normalized.gameSlug).toBe('pokemon');
    expect(normalized.name).toBe('Scarlet & Violet');
    expect(normalized.totalCards).toBe(198);
  });

  it('should provide defaults for missing fields', () => {
    const normalized = normalizeSet({}, 'yugioh');
    expect(normalized.setId).toBe('unknown');
    expect(normalized.gameSlug).toBe('yugioh');
    expect(normalized.name).toBe('Unknown Set');
    expect(normalized.series).toBe('Unknown');
    expect(normalized.releaseDate).toBe('1990-01-01');
    expect(normalized.totalCards).toBe(0);
  });

  it('should handle negative totalCards', () => {
    const normalized = normalizeSet({ totalCards: -5 }, 'mtg');
    expect(normalized.totalCards).toBe(0);
  });
});

describe('normalizeCard', () => {
  it('should normalize a complete card', () => {
    const card: Partial<CachedCard> = {
      cardId: 'sv1-1',
      setId: 'sv1',
      name: 'Bulbasaur',
      number: '1',
      supertype: 'Pokémon',
      subtypes: ['Basic'],
      types: ['Grass'],
      rarity: 'Common',
      imageSmall: 'https://example.com/small.png',
      imageLarge: 'https://example.com/large.png',
      priceMarket: 0.5,
    };

    const normalized = normalizeCard(card, 'pokemon');
    expect(normalized.cardId).toBe('sv1-1');
    expect(normalized.gameSlug).toBe('pokemon');
    expect(normalized.priceMarket).toBe(0.5);
  });

  it('should provide defaults for missing fields', () => {
    const normalized = normalizeCard({}, 'lorcana');
    expect(normalized.cardId).toBe('unknown');
    expect(normalized.gameSlug).toBe('lorcana');
    expect(normalized.name).toBe('Unknown Card');
    expect(normalized.subtypes).toEqual([]);
    expect(normalized.types).toEqual([]);
    expect(normalized.priceMarket).toBeUndefined();
  });

  it('should handle zero or negative price', () => {
    const normalized = normalizeCard({ priceMarket: 0 }, 'pokemon');
    expect(normalized.priceMarket).toBeUndefined();

    const normalized2 = normalizeCard({ priceMarket: -5 }, 'pokemon');
    expect(normalized2.priceMarket).toBeUndefined();
  });

  it('should handle non-array subtypes/types', () => {
    const normalized = normalizeCard(
      { subtypes: 'Basic' as unknown as string[], types: 'Grass' as unknown as string[] },
      'pokemon'
    );
    expect(normalized.subtypes).toEqual([]);
    expect(normalized.types).toEqual([]);
  });
});

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe('getRateLimitDelay', () => {
  it('should return correct delay for each game', () => {
    expect(getRateLimitDelay('pokemon')).toBe(100);
    expect(getRateLimitDelay('yugioh')).toBe(50);
    expect(getRateLimitDelay('digimon')).toBe(700);
  });
});

describe('getApiBaseUrl', () => {
  it('should return correct base URL for each game', () => {
    expect(getApiBaseUrl('pokemon')).toBe('https://api.pokemontcg.io/v2');
    expect(getApiBaseUrl('yugioh')).toBe('https://db.ygoprodeck.com/api/v7');
    expect(getApiBaseUrl('mtg')).toBe('https://api.scryfall.com');
  });
});

describe('getSetsEndpoint', () => {
  it('should return full sets endpoint URL', () => {
    expect(getSetsEndpoint('pokemon')).toBe('https://api.pokemontcg.io/v2/sets');
    expect(getSetsEndpoint('yugioh')).toBe('https://db.ygoprodeck.com/api/v7/cardsets.php');
    expect(getSetsEndpoint('mtg')).toBe('https://api.scryfall.com/sets');
  });
});

describe('formatGameName', () => {
  it('should return friendly display names', () => {
    expect(formatGameName('pokemon')).toBe('Pokémon TCG');
    expect(formatGameName('yugioh')).toBe('Yu-Gi-Oh!');
    expect(formatGameName('mtg')).toBe('Magic: The Gathering');
    expect(formatGameName('onepiece')).toBe('One Piece TCG');
    expect(formatGameName('lorcana')).toBe('Disney Lorcana');
    expect(formatGameName('digimon')).toBe('Digimon TCG');
    expect(formatGameName('dragonball')).toBe('Dragon Ball Fusion World');
  });
});

describe('hasPopulationSupport', () => {
  it('should return true for supported games', () => {
    expect(hasPopulationSupport('pokemon')).toBe(true);
    expect(hasPopulationSupport('yugioh')).toBe(true);
    expect(hasPopulationSupport('mtg')).toBe(true);
    expect(hasPopulationSupport('lorcana')).toBe(true);
  });

  it('should return false for unsupported games', () => {
    expect(hasPopulationSupport('onepiece')).toBe(false);
    expect(hasPopulationSupport('digimon')).toBe(false);
    expect(hasPopulationSupport('dragonball')).toBe(false);
  });
});

describe('getSupportedGames', () => {
  it('should return list of supported games', () => {
    const supported = getSupportedGames();
    expect(supported).toContain('pokemon');
    expect(supported).toContain('yugioh');
    expect(supported).toContain('mtg');
    expect(supported).toContain('lorcana');
    expect(supported).not.toContain('onepiece');
    expect(supported).not.toContain('digimon');
    expect(supported).not.toContain('dragonball');
  });
});

describe('estimatePopulationTime', () => {
  it('should estimate population time based on sets and cards', () => {
    // 10 sets, 100 avg cards, 100ms delay
    // Time = (10 * 100) + (10 * 100 * 100) = 1000 + 100000 = 101000ms
    const estimate = estimatePopulationTime(10, 100, 'pokemon');
    expect(estimate).toBe(101000);
  });

  it('should handle zero sets', () => {
    const estimate = estimatePopulationTime(0, 100, 'pokemon');
    expect(estimate).toBe(0);
  });

  it('should scale with rate limit', () => {
    const pokemonEstimate = estimatePopulationTime(10, 100, 'pokemon');
    const digimonEstimate = estimatePopulationTime(10, 100, 'digimon');
    expect(digimonEstimate).toBeGreaterThan(pokemonEstimate);
  });
});

describe('formatDuration', () => {
  it('should format sub-second durations', () => {
    expect(formatDuration(500)).toBe('less than a second');
    expect(formatDuration(0)).toBe('less than a second');
  });

  it('should format seconds', () => {
    expect(formatDuration(1000)).toBe('1 second');
    expect(formatDuration(5000)).toBe('5 seconds');
    expect(formatDuration(59000)).toBe('59 seconds');
  });

  it('should format minutes', () => {
    expect(formatDuration(60000)).toBe('1 minute');
    expect(formatDuration(120000)).toBe('2 minutes');
    expect(formatDuration(3540000)).toBe('59 minutes');
  });

  it('should format hours', () => {
    expect(formatDuration(3600000)).toBe('1 hour');
    expect(formatDuration(7200000)).toBe('2 hours');
    expect(formatDuration(5400000)).toBe('1 hour 30 minutes');
  });

  it('should format days', () => {
    expect(formatDuration(86400000)).toBe('1 day');
    expect(formatDuration(172800000)).toBe('2 days');
  });
});

describe('getStatusSummary', () => {
  it('should return "Not populated" for empty status', () => {
    const status: PopulationStatus = { setCount: 0, cardCount: 0, lastUpdated: null };
    expect(getStatusSummary(status)).toBe('Not populated');
  });

  it('should indicate sets without cards', () => {
    const status: PopulationStatus = { setCount: 10, cardCount: 0, lastUpdated: null };
    expect(getStatusSummary(status)).toBe('10 sets (no cards)');
  });

  it('should show full summary with average', () => {
    const status: PopulationStatus = { setCount: 10, cardCount: 1000, lastUpdated: Date.now() };
    const summary = getStatusSummary(status);
    expect(summary).toContain('10 sets');
    expect(summary).toContain('1,000 cards');
    expect(summary).toContain('~100 per set');
  });
});

describe('needsPopulation', () => {
  it('should return true for empty status', () => {
    const status: PopulationStatus = { setCount: 0, cardCount: 0, lastUpdated: null };
    expect(needsPopulation(status)).toBe(true);
  });

  it('should return true for sets without cards', () => {
    const status: PopulationStatus = { setCount: 10, cardCount: 0, lastUpdated: Date.now() };
    expect(needsPopulation(status)).toBe(true);
  });

  it('should return true for old data', () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const status: PopulationStatus = { setCount: 10, cardCount: 1000, lastUpdated: eightDaysAgo };
    expect(needsPopulation(status)).toBe(true);
  });

  it('should return false for recent data', () => {
    const status: PopulationStatus = { setCount: 10, cardCount: 1000, lastUpdated: Date.now() };
    expect(needsPopulation(status)).toBe(false);
  });

  it('should accept custom max age', () => {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    const status: PopulationStatus = { setCount: 10, cardCount: 1000, lastUpdated: twoDaysAgo };

    // With 1 day max age, should need population
    expect(needsPopulation(status, 24 * 60 * 60 * 1000)).toBe(true);

    // With 3 day max age, should not need population
    expect(needsPopulation(status, 3 * 24 * 60 * 60 * 1000)).toBe(false);
  });
});

// =============================================================================
// BATCH PROCESSING TESTS
// =============================================================================

describe('batchArray', () => {
  it('should split array into batches', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const batches = batchArray(array, 3);

    expect(batches).toHaveLength(4);
    expect(batches[0]).toEqual([1, 2, 3]);
    expect(batches[1]).toEqual([4, 5, 6]);
    expect(batches[2]).toEqual([7, 8, 9]);
    expect(batches[3]).toEqual([10]);
  });

  it('should handle empty array', () => {
    const batches = batchArray([], 10);
    expect(batches).toHaveLength(0);
  });

  it('should handle array smaller than batch size', () => {
    const batches = batchArray([1, 2, 3], 10);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toEqual([1, 2, 3]);
  });

  it('should handle exact batch size', () => {
    const batches = batchArray([1, 2, 3, 4, 5, 6], 3);
    expect(batches).toHaveLength(2);
    expect(batches[0]).toEqual([1, 2, 3]);
    expect(batches[1]).toEqual([4, 5, 6]);
  });
});

describe('calculateProgress', () => {
  it('should calculate correct percentage', () => {
    expect(calculateProgress(0, 100)).toBe(0);
    expect(calculateProgress(50, 100)).toBe(50);
    expect(calculateProgress(100, 100)).toBe(100);
  });

  it('should handle edge cases', () => {
    expect(calculateProgress(0, 0)).toBe(100); // Empty = complete
    expect(calculateProgress(150, 100)).toBe(100); // Cap at 100
  });

  it('should round to nearest integer', () => {
    expect(calculateProgress(33, 100)).toBe(33);
    expect(calculateProgress(1, 3)).toBe(33);
    expect(calculateProgress(2, 3)).toBe(67);
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Data Population Integration', () => {
  describe('Complete set validation and normalization workflow', () => {
    it('should validate and normalize a Pokemon set', () => {
      const rawSet = {
        setId: 'sv1',
        name: 'Scarlet & Violet',
        series: 'Scarlet & Violet',
        releaseDate: '2023-03-31',
        totalCards: 198,
      };

      // Validate
      const validation = validateSet({ ...rawSet, gameSlug: 'pokemon' });
      expect(validation.isValid).toBe(true);

      // Normalize
      const normalized = normalizeSet(rawSet, 'pokemon');
      expect(normalized.gameSlug).toBe('pokemon');
      expect(normalized.name).toBe('Scarlet & Violet');
    });
  });

  describe('Complete card validation and normalization workflow', () => {
    it('should validate and normalize a Yu-Gi-Oh card', () => {
      const rawCard = {
        cardId: '89631139-LOB',
        setId: 'LOB',
        name: 'Blue-Eyes White Dragon',
        number: 'LOB-001',
        supertype: 'normal',
        subtypes: ['Dragon'],
        types: ['LIGHT'],
        rarity: 'Ultra Rare',
        imageSmall: 'https://images.ygoprodeck.com/images/cards_small/89631139.jpg',
        imageLarge: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
        priceMarket: 25.99,
      };

      // Validate
      const validation = validateCard({ ...rawCard, gameSlug: 'yugioh' });
      expect(validation.isValid).toBe(true);

      // Normalize
      const normalized = normalizeCard(rawCard, 'yugioh');
      expect(normalized.gameSlug).toBe('yugioh');
      expect(normalized.priceMarket).toBe(25.99);
    });
  });

  describe('Population status workflow', () => {
    it('should correctly identify population needs', () => {
      // New game - needs population
      const newGameStatus: PopulationStatus = {
        setCount: 0,
        cardCount: 0,
        lastUpdated: null,
      };
      expect(needsPopulation(newGameStatus)).toBe(true);
      expect(getStatusSummary(newGameStatus)).toBe('Not populated');

      // Partial population - needs cards
      const partialStatus: PopulationStatus = {
        setCount: 150,
        cardCount: 0,
        lastUpdated: Date.now(),
      };
      expect(needsPopulation(partialStatus)).toBe(true);
      expect(getStatusSummary(partialStatus)).toContain('sets (no cards)');

      // Complete population
      const completeStatus: PopulationStatus = {
        setCount: 150,
        cardCount: 15000,
        lastUpdated: Date.now(),
      };
      expect(needsPopulation(completeStatus)).toBe(false);
      expect(getStatusSummary(completeStatus)).toContain('15,000 cards');
    });
  });
});
