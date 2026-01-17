import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  // Constants
  GAME_SLUGS,
  RATE_LIMITS,
  API_CONFIGS,
  PRINT_STATUSES,
  // Types
  type GameSlug,
  type CachedSet,
  type CachedCard,
  type PopulationStatus,
  type PrintStatus,
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
  // Print status utilities
  isValidPrintStatus,
  getPrintStatusLabel,
  getPrintStatusDescription,
  isSetInPrint,
  filterInPrintSets,
  groupSetsByPrintStatus,
  getInPrintCutoffDate,
  determinePrintStatusByDate,
  getPrintStatusStats,
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

// =============================================================================
// PRINT STATUS TESTS (Kid-Friendly Set Filtering)
// =============================================================================

describe('Print Status Constants', () => {
  it('should have all 4 print statuses defined', () => {
    expect(PRINT_STATUSES).toHaveLength(4);
    expect(PRINT_STATUSES).toContain('current');
    expect(PRINT_STATUSES).toContain('limited');
    expect(PRINT_STATUSES).toContain('out_of_print');
    expect(PRINT_STATUSES).toContain('vintage');
  });
});

describe('isValidPrintStatus', () => {
  it('should return true for valid print statuses', () => {
    expect(isValidPrintStatus('current')).toBe(true);
    expect(isValidPrintStatus('limited')).toBe(true);
    expect(isValidPrintStatus('out_of_print')).toBe(true);
    expect(isValidPrintStatus('vintage')).toBe(true);
  });

  it('should return false for invalid print statuses', () => {
    expect(isValidPrintStatus('')).toBe(false);
    expect(isValidPrintStatus('in_print')).toBe(false);
    expect(isValidPrintStatus('CURRENT')).toBe(false);
    expect(isValidPrintStatus('available')).toBe(false);
    expect(isValidPrintStatus('unknown')).toBe(false);
  });
});

describe('getPrintStatusLabel', () => {
  it('should return correct labels for each status', () => {
    expect(getPrintStatusLabel('current')).toBe('In Print');
    expect(getPrintStatusLabel('limited')).toBe('Limited Availability');
    expect(getPrintStatusLabel('out_of_print')).toBe('Out of Print');
    expect(getPrintStatusLabel('vintage')).toBe('Vintage/Collector');
  });

  it('should return Unknown for invalid status', () => {
    expect(getPrintStatusLabel('invalid' as PrintStatus)).toBe('Unknown');
  });
});

describe('getPrintStatusDescription', () => {
  it('should return correct descriptions for each status', () => {
    expect(getPrintStatusDescription('current')).toContain('widely available at retail');
    expect(getPrintStatusDescription('limited')).toContain('Limited availability');
    expect(getPrintStatusDescription('out_of_print')).toContain('No longer in print');
    expect(getPrintStatusDescription('vintage')).toContain('over 5 years old');
  });

  it('should return unknown message for invalid status', () => {
    expect(getPrintStatusDescription('invalid' as PrintStatus)).toBe('Print status unknown');
  });
});

describe('isSetInPrint', () => {
  const createSet = (overrides: Partial<CachedSet>): CachedSet => ({
    setId: 'sv1',
    gameSlug: 'pokemon',
    name: 'Test Set',
    series: 'Test',
    releaseDate: '2024-01-01',
    totalCards: 100,
    ...overrides,
  });

  describe('explicit isInPrint flag', () => {
    it('should return true when isInPrint is true', () => {
      const set = createSet({ isInPrint: true });
      expect(isSetInPrint(set)).toBe(true);
    });

    it('should return false when isInPrint is false', () => {
      const set = createSet({ isInPrint: false });
      expect(isSetInPrint(set)).toBe(false);
    });
  });

  describe('printStatus field', () => {
    it('should return true for current status', () => {
      const set = createSet({ printStatus: 'current' });
      expect(isSetInPrint(set)).toBe(true);
    });

    it('should return true for limited status', () => {
      const set = createSet({ printStatus: 'limited' });
      expect(isSetInPrint(set)).toBe(true);
    });

    it('should return false for out_of_print status', () => {
      const set = createSet({ printStatus: 'out_of_print' });
      expect(isSetInPrint(set)).toBe(false);
    });

    it('should return false for vintage status', () => {
      const set = createSet({ printStatus: 'vintage' });
      expect(isSetInPrint(set)).toBe(false);
    });
  });

  describe('release date fallback', () => {
    beforeEach(() => {
      // Mock current date to 2026-01-17
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-17'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return true for recent sets without status', () => {
      const set = createSet({ releaseDate: '2025-01-01' }); // 12 months old
      expect(isSetInPrint(set)).toBe(true);
    });

    it('should return true for sets exactly 24 months old', () => {
      const set = createSet({ releaseDate: '2024-01-17' }); // Exactly 24 months
      expect(isSetInPrint(set)).toBe(true);
    });

    it('should return false for sets older than 24 months', () => {
      const set = createSet({ releaseDate: '2023-01-01' }); // 36+ months old
      expect(isSetInPrint(set)).toBe(false);
    });

    it('should respect custom maxAgeMonths parameter', () => {
      const set = createSet({ releaseDate: '2025-07-01' }); // 6 months old
      expect(isSetInPrint(set, 12)).toBe(true);
      expect(isSetInPrint(set, 3)).toBe(false);
    });
  });
});

describe('filterInPrintSets', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-17'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createSets = (): CachedSet[] => [
    {
      setId: 's1',
      gameSlug: 'pokemon',
      name: 'Set 1',
      series: 'Test',
      releaseDate: '2025-06-01',
      totalCards: 100,
      isInPrint: true,
    },
    {
      setId: 's2',
      gameSlug: 'pokemon',
      name: 'Set 2',
      series: 'Test',
      releaseDate: '2020-01-01',
      totalCards: 100,
      isInPrint: false,
    },
    {
      setId: 's3',
      gameSlug: 'pokemon',
      name: 'Set 3',
      series: 'Test',
      releaseDate: '2025-01-01',
      totalCards: 100,
      printStatus: 'current',
    },
    {
      setId: 's4',
      gameSlug: 'pokemon',
      name: 'Set 4',
      series: 'Test',
      releaseDate: '2018-01-01',
      totalCards: 100,
      printStatus: 'vintage',
    },
    {
      setId: 's5',
      gameSlug: 'pokemon',
      name: 'Set 5',
      series: 'Test',
      releaseDate: '2025-09-01',
      totalCards: 100,
    }, // Recent, no status
    {
      setId: 's6',
      gameSlug: 'pokemon',
      name: 'Set 6',
      series: 'Test',
      releaseDate: '2020-01-01',
      totalCards: 100,
    }, // Old, no status
  ];

  it('should filter to only in-print sets', () => {
    const sets = createSets();
    const inPrint = filterInPrintSets(sets);

    // s1 (isInPrint: true), s3 (printStatus: current), s5 (recent release, no status)
    expect(inPrint).toHaveLength(3);
    expect(inPrint.map((s) => s.setId)).toContain('s1'); // isInPrint: true
    expect(inPrint.map((s) => s.setId)).toContain('s3'); // printStatus: current
    expect(inPrint.map((s) => s.setId)).toContain('s5'); // recent, no status
    expect(inPrint.map((s) => s.setId)).not.toContain('s2'); // isInPrint: false
    expect(inPrint.map((s) => s.setId)).not.toContain('s4'); // printStatus: vintage
    expect(inPrint.map((s) => s.setId)).not.toContain('s6'); // old, no status
  });

  it('should return empty array for empty input', () => {
    expect(filterInPrintSets([])).toEqual([]);
  });
});

describe('groupSetsByPrintStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-17'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should group sets into inPrint and outOfPrint', () => {
    const sets: CachedSet[] = [
      {
        setId: 's1',
        gameSlug: 'pokemon',
        name: 'Set 1',
        series: 'Test',
        releaseDate: '2025-06-01',
        totalCards: 100,
        isInPrint: true,
      },
      {
        setId: 's2',
        gameSlug: 'pokemon',
        name: 'Set 2',
        series: 'Test',
        releaseDate: '2020-01-01',
        totalCards: 100,
        printStatus: 'out_of_print',
      },
      {
        setId: 's3',
        gameSlug: 'pokemon',
        name: 'Set 3',
        series: 'Test',
        releaseDate: '2025-01-01',
        totalCards: 100,
      },
    ];

    const grouped = groupSetsByPrintStatus(sets);

    expect(grouped.inPrint).toHaveLength(2);
    expect(grouped.outOfPrint).toHaveLength(1);
    expect(grouped.inPrint.map((s) => s.setId)).toContain('s1');
    expect(grouped.inPrint.map((s) => s.setId)).toContain('s3');
    expect(grouped.outOfPrint.map((s) => s.setId)).toContain('s2');
  });

  it('should handle empty arrays', () => {
    const grouped = groupSetsByPrintStatus([]);
    expect(grouped.inPrint).toEqual([]);
    expect(grouped.outOfPrint).toEqual([]);
  });
});

describe('getInPrintCutoffDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-17'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return date 24 months ago by default', () => {
    const cutoff = getInPrintCutoffDate();
    expect(cutoff.getFullYear()).toBe(2024);
    expect(cutoff.getMonth()).toBe(0); // January
    // Note: exact day may vary slightly due to how Date handles month overflow
    expect(cutoff.getDate()).toBeGreaterThanOrEqual(16);
    expect(cutoff.getDate()).toBeLessThanOrEqual(18);
  });

  it('should respect custom maxAgeMonths', () => {
    const cutoff12 = getInPrintCutoffDate(12);
    expect(cutoff12.getFullYear()).toBe(2025);
    expect(cutoff12.getMonth()).toBe(0); // January

    const cutoff6 = getInPrintCutoffDate(6);
    expect(cutoff6.getFullYear()).toBe(2025);
    expect(cutoff6.getMonth()).toBe(6); // July
  });
});

describe('determinePrintStatusByDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-17'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return current for recent releases', () => {
    expect(determinePrintStatusByDate('2025-01-01')).toBe('current');
    expect(determinePrintStatusByDate('2024-06-01')).toBe('current');
  });

  it('should return out_of_print for sets 2-5 years old', () => {
    expect(determinePrintStatusByDate('2023-01-01')).toBe('out_of_print');
    expect(determinePrintStatusByDate('2022-01-01')).toBe('out_of_print');
  });

  it('should return vintage for sets over 5 years old', () => {
    expect(determinePrintStatusByDate('2020-01-01')).toBe('vintage');
    expect(determinePrintStatusByDate('2015-01-01')).toBe('vintage');
  });

  it('should respect custom month thresholds', () => {
    // With 12 months out_of_print threshold
    expect(determinePrintStatusByDate('2024-06-01', 12, 60)).toBe('out_of_print');

    // With 36 months vintage threshold
    expect(determinePrintStatusByDate('2022-06-01', 24, 36)).toBe('vintage');
  });
});

describe('getPrintStatusStats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-17'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should calculate correct statistics', () => {
    const sets: CachedSet[] = [
      {
        setId: 's1',
        gameSlug: 'pokemon',
        name: 'Set 1',
        series: 'Test',
        releaseDate: '2025-06-01',
        totalCards: 100,
        printStatus: 'current',
      },
      {
        setId: 's2',
        gameSlug: 'pokemon',
        name: 'Set 2',
        series: 'Test',
        releaseDate: '2020-01-01',
        totalCards: 100,
        printStatus: 'out_of_print',
      },
      {
        setId: 's3',
        gameSlug: 'pokemon',
        name: 'Set 3',
        series: 'Test',
        releaseDate: '2025-01-01',
        totalCards: 100,
        printStatus: 'limited',
      },
      {
        setId: 's4',
        gameSlug: 'pokemon',
        name: 'Set 4',
        series: 'Test',
        releaseDate: '2018-01-01',
        totalCards: 100,
        printStatus: 'vintage',
      },
      {
        setId: 's5',
        gameSlug: 'pokemon',
        name: 'Set 5',
        series: 'Test',
        releaseDate: '2025-09-01',
        totalCards: 100,
      }, // No status
    ];

    const stats = getPrintStatusStats(sets);

    expect(stats.total).toBe(5);
    expect(stats.inPrint).toBe(3); // s1, s3, s5
    expect(stats.outOfPrint).toBe(2); // s2, s4
    expect(stats.byStatus.current).toBe(1);
    expect(stats.byStatus.limited).toBe(1);
    expect(stats.byStatus.out_of_print).toBe(1);
    expect(stats.byStatus.vintage).toBe(1);
    expect(stats.byStatus.unknown).toBe(1);
    expect(stats.percentInPrint).toBe(60);
  });

  it('should handle empty array', () => {
    const stats = getPrintStatusStats([]);

    expect(stats.total).toBe(0);
    expect(stats.inPrint).toBe(0);
    expect(stats.outOfPrint).toBe(0);
    expect(stats.percentInPrint).toBe(0);
  });

  it('should handle all in-print sets', () => {
    const sets: CachedSet[] = [
      {
        setId: 's1',
        gameSlug: 'pokemon',
        name: 'Set 1',
        series: 'Test',
        releaseDate: '2025-06-01',
        totalCards: 100,
        isInPrint: true,
      },
      {
        setId: 's2',
        gameSlug: 'pokemon',
        name: 'Set 2',
        series: 'Test',
        releaseDate: '2025-01-01',
        totalCards: 100,
        isInPrint: true,
      },
    ];

    const stats = getPrintStatusStats(sets);

    expect(stats.percentInPrint).toBe(100);
    expect(stats.inPrint).toBe(2);
    expect(stats.outOfPrint).toBe(0);
  });
});

describe('CachedSet with print status fields', () => {
  it('should validate set with print status fields', () => {
    const set: CachedSet = {
      setId: 'sv1',
      gameSlug: 'pokemon',
      name: 'Scarlet & Violet',
      series: 'Scarlet & Violet',
      releaseDate: '2023-03-31',
      totalCards: 198,
      isInPrint: true,
      printStatus: 'current',
    };

    const result = validateSet(set);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should normalize set without changing print status fields', () => {
    const set: Partial<CachedSet> = {
      setId: 'sv1',
      name: 'Scarlet & Violet',
      series: 'SV',
      releaseDate: '2023-03-31',
      totalCards: 198,
      isInPrint: true,
      printStatus: 'current',
    };

    const normalized = normalizeSet(set, 'pokemon');
    // Print status fields are not touched by normalizeSet (optional fields)
    expect(normalized.setId).toBe('sv1');
    expect(normalized.gameSlug).toBe('pokemon');
  });
});
