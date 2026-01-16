import { describe, it, expect } from 'vitest';
import {
  // Deduplication utilities
  getUniqueValues,
  getUniqueKeys,
  getUniqueFromNested,
  // Chunking utilities
  chunkArray,
  processInChunks,
  processInParallelChunks,
  // Batch lookup utilities
  createLookupMap,
  createGroupedLookupMap,
  buildBatchLookupResult,
  // Card enrichment utilities
  extractCardIdsForLookup,
  extractSetIdsFromCardIds,
  buildCardEnrichmentMap,
  buildSetEnrichmentMap,
  enrichCardWithCachedData,
  // Collection aggregation utilities
  groupCollectionByCardId,
  groupCollectionBySetId,
  calculateCollectionStats,
  // Filter optimization utilities
  preFilterByCardId,
  filterBySetPrefix,
  createSetMembershipFilter,
  // Result pagination utilities
  paginateResults,
  applyCursorPagination,
  // Cache invalidation helpers
  calculateCacheTTL,
  isCacheStale,
  // Query optimization helpers
  getOptimalBatchSize,
  estimateQueryComplexity,
  // Constants
  MAX_BATCH_SIZE,
  DEFAULT_CHUNK_SIZE,
} from '../performance';

// ============================================================================
// CONSTANTS
// ============================================================================

describe('Performance Constants', () => {
  it('MAX_BATCH_SIZE should be 100', () => {
    expect(MAX_BATCH_SIZE).toBe(100);
  });

  it('DEFAULT_CHUNK_SIZE should be 50', () => {
    expect(DEFAULT_CHUNK_SIZE).toBe(50);
  });
});

// ============================================================================
// DEDUPLICATION UTILITIES
// ============================================================================

describe('getUniqueValues', () => {
  it('should return unique values from array of primitives', () => {
    expect(getUniqueValues([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
  });

  it('should handle empty array', () => {
    expect(getUniqueValues([])).toEqual([]);
  });

  it('should handle strings', () => {
    expect(getUniqueValues(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('should preserve order of first occurrence', () => {
    expect(getUniqueValues([3, 1, 2, 1, 3])).toEqual([3, 1, 2]);
  });
});

describe('getUniqueKeys', () => {
  it('should extract unique keys using extractor function', () => {
    const items = [
      { id: '1', name: 'a' },
      { id: '2', name: 'b' },
      { id: '1', name: 'c' },
    ];
    expect(getUniqueKeys(items, (i) => i.id)).toEqual(['1', '2']);
  });

  it('should handle empty array', () => {
    expect(getUniqueKeys([], (i: { id: string }) => i.id)).toEqual([]);
  });
});

describe('getUniqueFromNested', () => {
  it('should extract unique values from nested arrays', () => {
    const items = [{ tags: ['a', 'b'] }, { tags: ['b', 'c'] }, { tags: ['c', 'd'] }];
    expect(getUniqueFromNested(items, (i) => i.tags)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('should handle empty nested arrays', () => {
    const items = [{ tags: [] as string[] }, { tags: [] as string[] }];
    expect(getUniqueFromNested(items, (i) => i.tags)).toEqual([]);
  });
});

// ============================================================================
// CHUNKING UTILITIES
// ============================================================================

describe('chunkArray', () => {
  it('should split array into chunks of specified size', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('should handle array smaller than chunk size', () => {
    expect(chunkArray([1, 2], 5)).toEqual([[1, 2]]);
  });

  it('should handle empty array', () => {
    expect(chunkArray([], 3)).toEqual([]);
  });

  it('should handle array that divides evenly', () => {
    expect(chunkArray([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it('should use default chunk size', () => {
    const arr = Array.from({ length: 100 }, (_, i) => i);
    const chunks = chunkArray(arr);
    expect(chunks.length).toBe(2);
    expect(chunks[0].length).toBe(50);
    expect(chunks[1].length).toBe(50);
  });

  it('should throw error for non-positive chunk size', () => {
    expect(() => chunkArray([1, 2, 3], 0)).toThrow('Chunk size must be positive');
    expect(() => chunkArray([1, 2, 3], -1)).toThrow('Chunk size must be positive');
  });
});

describe('processInChunks', () => {
  it('should process array in chunks with async processor', async () => {
    const results = await processInChunks([1, 2, 3, 4, 5], 2, async (chunk) => {
      return chunk.map((n) => n * 2);
    });
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  it('should handle empty array', async () => {
    const results = await processInChunks([], 2, async () => []);
    expect(results).toEqual([]);
  });
});

describe('processInParallelChunks', () => {
  it('should process items in parallel within chunks', async () => {
    const results = await processInParallelChunks([1, 2, 3, 4, 5], 2, async (n) => {
      return n * 2;
    });
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  it('should handle empty array', async () => {
    const results = await processInParallelChunks([], 2, async (n: number) => n * 2);
    expect(results).toEqual([]);
  });
});

// ============================================================================
// BATCH LOOKUP UTILITIES
// ============================================================================

describe('createLookupMap', () => {
  it('should create map from items with key extractor', () => {
    const items = [
      { id: '1', name: 'a' },
      { id: '2', name: 'b' },
    ];
    const map = createLookupMap(items, (i) => i.id);
    expect(map.get('1')).toEqual({ id: '1', name: 'a' });
    expect(map.get('2')).toEqual({ id: '2', name: 'b' });
    expect(map.size).toBe(2);
  });

  it('should overwrite duplicate keys with last value', () => {
    const items = [
      { id: '1', name: 'a' },
      { id: '1', name: 'b' },
    ];
    const map = createLookupMap(items, (i) => i.id);
    expect(map.get('1')).toEqual({ id: '1', name: 'b' });
    expect(map.size).toBe(1);
  });

  it('should handle empty array', () => {
    const map = createLookupMap([], (i: { id: string }) => i.id);
    expect(map.size).toBe(0);
  });
});

describe('createGroupedLookupMap', () => {
  it('should group items by key', () => {
    const items = [
      { setId: 'sv1', cardId: 'sv1-1' },
      { setId: 'sv1', cardId: 'sv1-2' },
      { setId: 'sv2', cardId: 'sv2-1' },
    ];
    const map = createGroupedLookupMap(items, (i) => i.setId);
    expect(map.get('sv1')?.length).toBe(2);
    expect(map.get('sv2')?.length).toBe(1);
  });

  it('should handle empty array', () => {
    const map = createGroupedLookupMap([], (i: { id: string }) => i.id);
    expect(map.size).toBe(0);
  });
});

describe('buildBatchLookupResult', () => {
  it('should build result with found items and missing keys', () => {
    const requested = ['1', '2', '3'];
    const found = [
      { id: '1', name: 'a' },
      { id: '2', name: 'b' },
    ];
    const result = buildBatchLookupResult(requested, found, (i) => i.id);

    expect(result.found.size).toBe(2);
    expect(result.missing).toEqual(['3']);
    expect(result.hitRate).toBeCloseTo(0.667, 2);
  });

  it('should handle all found', () => {
    const requested = ['1', '2'];
    const found = [
      { id: '1', name: 'a' },
      { id: '2', name: 'b' },
    ];
    const result = buildBatchLookupResult(requested, found, (i) => i.id);

    expect(result.missing).toEqual([]);
    expect(result.hitRate).toBe(1);
  });

  it('should handle none found', () => {
    const requested = ['1', '2'];
    const found: Array<{ id: string; name: string }> = [];
    const result = buildBatchLookupResult(requested, found, (i) => i.id);

    expect(result.missing).toEqual(['1', '2']);
    expect(result.hitRate).toBe(0);
  });

  it('should handle empty request', () => {
    const result = buildBatchLookupResult([], [], (i: { id: string }) => i.id);
    expect(result.hitRate).toBe(1);
    expect(result.missing).toEqual([]);
  });
});

// ============================================================================
// CARD ENRICHMENT UTILITIES
// ============================================================================

describe('extractCardIdsForLookup', () => {
  it('should extract unique cardIds from collection', () => {
    const cards = [{ cardId: 'sv1-1' }, { cardId: 'sv1-2' }, { cardId: 'sv1-1' }];
    expect(extractCardIdsForLookup(cards)).toEqual(['sv1-1', 'sv1-2']);
  });

  it('should handle empty array', () => {
    expect(extractCardIdsForLookup([])).toEqual([]);
  });
});

describe('extractSetIdsFromCardIds', () => {
  it('should extract setIds from cardIds', () => {
    const cardIds = ['sv1-1', 'sv1-2', 'sv2-10', 'base1-5'];
    expect(extractSetIdsFromCardIds(cardIds)).toEqual(['sv1', 'sv2', 'base1']);
  });

  it('should handle cardIds without dash', () => {
    const cardIds = ['card1', 'sv1-1'];
    expect(extractSetIdsFromCardIds(cardIds)).toEqual(['card1', 'sv1']);
  });

  it('should handle cardIds with multiple dashes', () => {
    const cardIds = ['swsh12pt5gg-GG01'];
    expect(extractSetIdsFromCardIds(cardIds)).toEqual(['swsh12pt5gg']);
  });
});

describe('buildCardEnrichmentMap', () => {
  it('should build map from cached card data', () => {
    const cards = [
      { cardId: 'sv1-1', name: 'Pikachu', imageSmall: 'url1', setId: 'sv1' },
      { cardId: 'sv1-2', name: 'Charmander', imageSmall: 'url2', setId: 'sv1' },
      null,
    ];
    const map = buildCardEnrichmentMap(cards);
    expect(map.size).toBe(2);
    expect(map.get('sv1-1')?.name).toBe('Pikachu');
  });

  it('should handle all null values', () => {
    const cards = [null, null];
    const map = buildCardEnrichmentMap(cards);
    expect(map.size).toBe(0);
  });
});

describe('buildSetEnrichmentMap', () => {
  it('should build map from cached set data', () => {
    const sets = [
      { setId: 'sv1', name: 'Scarlet & Violet', series: 'Scarlet & Violet', totalCards: 198 },
      null,
    ];
    const map = buildSetEnrichmentMap(sets);
    expect(map.size).toBe(1);
    expect(map.get('sv1')?.name).toBe('Scarlet & Violet');
  });
});

describe('enrichCardWithCachedData', () => {
  it('should enrich card with cached data', () => {
    const card = { cardId: 'sv1-1', quantity: 2 };
    const cardDataMap = new Map([
      [
        'sv1-1',
        {
          cardId: 'sv1-1',
          name: 'Pikachu',
          imageSmall: 'url',
          setId: 'sv1',
          rarity: 'Common',
          types: ['Lightning'],
        },
      ],
    ]);
    const defaults = { name: 'Unknown', imageSmall: '', setId: 'unknown' };

    const enriched = enrichCardWithCachedData(card, cardDataMap, defaults);
    expect(enriched.name).toBe('Pikachu');
    expect(enriched.rarity).toBe('Common');
    expect(enriched.quantity).toBe(2);
  });

  it('should use defaults when card not in map', () => {
    const card = { cardId: 'sv1-999', quantity: 1 };
    const cardDataMap = new Map<
      string,
      {
        cardId: string;
        name: string;
        imageSmall: string;
        setId: string;
        rarity?: string;
        types?: string[];
      }
    >();
    const defaults = { name: 'Unknown', imageSmall: 'default.png', setId: 'sv1' };

    const enriched = enrichCardWithCachedData(card, cardDataMap, defaults);
    expect(enriched.name).toBe('Unknown');
    expect(enriched.imageSmall).toBe('default.png');
  });
});

// ============================================================================
// COLLECTION AGGREGATION UTILITIES
// ============================================================================

describe('groupCollectionByCardId', () => {
  it('should group cards by cardId with total quantity', () => {
    const cards = [
      { cardId: 'sv1-1', quantity: 2 },
      { cardId: 'sv1-1', quantity: 1 },
      { cardId: 'sv1-2', quantity: 3 },
    ];
    const grouped = groupCollectionByCardId(cards);

    expect(grouped.get('sv1-1')?.totalQuantity).toBe(3);
    expect(grouped.get('sv1-1')?.items.length).toBe(2);
    expect(grouped.get('sv1-2')?.totalQuantity).toBe(3);
  });

  it('should handle empty array', () => {
    const grouped = groupCollectionByCardId([]);
    expect(grouped.size).toBe(0);
  });
});

describe('groupCollectionBySetId', () => {
  it('should group cards by setId', () => {
    const cards = [{ cardId: 'sv1-1' }, { cardId: 'sv1-2' }, { cardId: 'sv2-1' }];
    const grouped = groupCollectionBySetId(cards);

    expect(grouped.get('sv1')?.length).toBe(2);
    expect(grouped.get('sv2')?.length).toBe(1);
  });

  it('should handle cardIds with multiple dashes', () => {
    const cards = [{ cardId: 'swsh12pt5gg-GG01' }];
    const grouped = groupCollectionBySetId(cards);
    expect(grouped.get('swsh12pt5gg')?.length).toBe(1);
  });
});

describe('calculateCollectionStats', () => {
  it('should calculate collection statistics', () => {
    const cards = [
      { cardId: 'sv1-1', quantity: 2 },
      { cardId: 'sv1-1', quantity: 1 },
      { cardId: 'sv1-2', quantity: 3 },
      { cardId: 'sv2-1', quantity: 1 },
    ];
    const stats = calculateCollectionStats(cards);

    expect(stats.totalQuantity).toBe(7);
    expect(stats.uniqueCards).toBe(3);
    expect(stats.uniqueSets).toBe(2);
    expect(stats.bySet.get('sv1')).toBe(3);
    expect(stats.bySet.get('sv2')).toBe(1);
  });

  it('should handle empty collection', () => {
    const stats = calculateCollectionStats([]);
    expect(stats.totalQuantity).toBe(0);
    expect(stats.uniqueCards).toBe(0);
    expect(stats.uniqueSets).toBe(0);
  });
});

// ============================================================================
// FILTER OPTIMIZATION UTILITIES
// ============================================================================

describe('preFilterByCardId', () => {
  it('should return cardIds that pass filter', () => {
    const cards = [{ cardId: 'sv1-1' }, { cardId: 'sv1-2' }, { cardId: 'sv2-1' }];
    const filter = (id: string) => id.startsWith('sv1');
    const passing = preFilterByCardId(cards, filter);

    expect(passing.size).toBe(2);
    expect(passing.has('sv1-1')).toBe(true);
    expect(passing.has('sv1-2')).toBe(true);
    expect(passing.has('sv2-1')).toBe(false);
  });
});

describe('filterBySetPrefix', () => {
  it('should return true if cardId starts with setId prefix', () => {
    expect(filterBySetPrefix('sv1-1', 'sv1')).toBe(true);
    expect(filterBySetPrefix('sv1-100', 'sv1')).toBe(true);
    expect(filterBySetPrefix('sv2-1', 'sv1')).toBe(false);
  });

  it('should not match partial set prefixes', () => {
    expect(filterBySetPrefix('sv10-1', 'sv1')).toBe(false);
  });
});

describe('createSetMembershipFilter', () => {
  it('should create a filter function for set membership', () => {
    const filter = createSetMembershipFilter('sv1');

    expect(filter('sv1-1')).toBe(true);
    expect(filter('sv1-100')).toBe(true);
    expect(filter('sv2-1')).toBe(false);
    expect(filter('sv10-1')).toBe(false);
  });
});

// ============================================================================
// RESULT PAGINATION UTILITIES
// ============================================================================

describe('paginateResults', () => {
  it('should paginate results correctly', () => {
    const results = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const page1 = paginateResults(results, 1, 3);

    expect(page1.data).toEqual([1, 2, 3]);
    expect(page1.page).toBe(1);
    expect(page1.pageSize).toBe(3);
    expect(page1.totalItems).toBe(10);
    expect(page1.totalPages).toBe(4);
    expect(page1.hasMore).toBe(true);
  });

  it('should handle last page', () => {
    const results = [1, 2, 3, 4, 5];
    const page2 = paginateResults(results, 2, 3);

    expect(page2.data).toEqual([4, 5]);
    expect(page2.hasMore).toBe(false);
  });

  it('should handle empty results', () => {
    const page = paginateResults([], 1, 10);
    expect(page.data).toEqual([]);
    expect(page.totalItems).toBe(0);
    expect(page.totalPages).toBe(0);
    expect(page.hasMore).toBe(false);
  });

  it('should handle page beyond results', () => {
    const results = [1, 2, 3];
    const page5 = paginateResults(results, 5, 10);

    expect(page5.data).toEqual([]);
    expect(page5.hasMore).toBe(false);
  });
});

describe('applyCursorPagination', () => {
  it('should apply cursor pagination', () => {
    const results = [1, 2, 3, 4, 5];
    const page = applyCursorPagination(results, undefined, 2);

    expect(page.data).toEqual([1, 2]);
    expect(page.nextCursor).toBe(2);
    expect(page.hasMore).toBe(true);
  });

  it('should continue from cursor', () => {
    const results = [1, 2, 3, 4, 5];
    const page = applyCursorPagination(results, 2, 2);

    expect(page.data).toEqual([3, 4]);
    expect(page.nextCursor).toBe(4);
    expect(page.hasMore).toBe(true);
  });

  it('should handle last page', () => {
    const results = [1, 2, 3, 4, 5];
    const page = applyCursorPagination(results, 4, 2);

    expect(page.data).toEqual([5]);
    expect(page.nextCursor).toBeUndefined();
    expect(page.hasMore).toBe(false);
  });

  it('should handle empty results', () => {
    const page = applyCursorPagination([], undefined, 10);
    expect(page.data).toEqual([]);
    expect(page.hasMore).toBe(false);
  });
});

// ============================================================================
// CACHE INVALIDATION HELPERS
// ============================================================================

describe('calculateCacheTTL', () => {
  it('should return 24 hours for static data', () => {
    expect(calculateCacheTTL('static')).toBe(24 * 60 * 60 * 1000);
  });

  it('should return 1 hour for semi-static data', () => {
    expect(calculateCacheTTL('semi-static')).toBe(60 * 60 * 1000);
  });

  it('should return 5 minutes for dynamic data', () => {
    expect(calculateCacheTTL('dynamic')).toBe(5 * 60 * 1000);
  });
});

describe('isCacheStale', () => {
  it('should return true if cache is stale', () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    expect(isCacheStale(oneHourAgo, 30 * 60 * 1000)).toBe(true);
  });

  it('should return false if cache is fresh', () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    expect(isCacheStale(fiveMinutesAgo, 30 * 60 * 1000)).toBe(false);
  });

  it('should handle exactly at TTL boundary', () => {
    const ttl = 60 * 1000;
    const justOverTTL = Date.now() - ttl - 1;
    expect(isCacheStale(justOverTTL, ttl)).toBe(true);
  });
});

// ============================================================================
// QUERY OPTIMIZATION HELPERS
// ============================================================================

describe('getOptimalBatchSize', () => {
  it('should return total items if 10 or less', () => {
    expect(getOptimalBatchSize(5)).toBe(5);
    expect(getOptimalBatchSize(10)).toBe(10);
  });

  it('should return 25 for 11-50 items', () => {
    expect(getOptimalBatchSize(11)).toBe(25);
    expect(getOptimalBatchSize(50)).toBe(25);
  });

  it('should return 50 for 51-200 items', () => {
    expect(getOptimalBatchSize(51)).toBe(50);
    expect(getOptimalBatchSize(200)).toBe(50);
  });

  it('should return MAX_BATCH_SIZE for more than 200 items', () => {
    expect(getOptimalBatchSize(201)).toBe(MAX_BATCH_SIZE);
    expect(getOptimalBatchSize(1000)).toBe(MAX_BATCH_SIZE);
  });
});

describe('estimateQueryComplexity', () => {
  it('should return low for simple queries', () => {
    const complexity = estimateQueryComplexity({
      collectionSize: 50,
      requiresEnrichment: false,
      filterCount: 1,
      sortRequired: false,
    });
    expect(complexity).toBe('low');
  });

  it('should return medium for moderate queries', () => {
    const complexity = estimateQueryComplexity({
      collectionSize: 200,
      requiresEnrichment: true,
      filterCount: 1,
      sortRequired: false,
    });
    expect(complexity).toBe('medium');
  });

  it('should return high for complex queries', () => {
    const complexity = estimateQueryComplexity({
      collectionSize: 1000,
      requiresEnrichment: true,
      filterCount: 3,
      sortRequired: true,
    });
    expect(complexity).toBe('high');
  });

  it('should factor in all parameters', () => {
    // Large collection + enrichment + many filters + sort = high
    expect(
      estimateQueryComplexity({
        collectionSize: 600,
        requiresEnrichment: true,
        filterCount: 5,
        sortRequired: true,
      })
    ).toBe('high');

    // Small collection with everything else = medium
    expect(
      estimateQueryComplexity({
        collectionSize: 50,
        requiresEnrichment: true,
        filterCount: 3,
        sortRequired: true,
      })
    ).toBe('medium');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration: Full collection processing pipeline', () => {
  it('should process a collection efficiently', () => {
    // Simulate a collection of 150 cards
    const collectionCards = Array.from({ length: 150 }, (_, i) => ({
      cardId: `sv${Math.floor(i / 50) + 1}-${(i % 50) + 1}`,
      quantity: Math.floor(Math.random() * 3) + 1,
    }));

    // Step 1: Calculate stats
    const stats = calculateCollectionStats(collectionCards);
    expect(stats.uniqueCards).toBe(150);
    expect(stats.uniqueSets).toBe(3);

    // Step 2: Extract unique cardIds for lookup
    const cardIds = extractCardIdsForLookup(collectionCards);
    expect(cardIds.length).toBe(150);

    // Step 3: Extract setIds
    const setIds = extractSetIdsFromCardIds(cardIds);
    expect(setIds).toEqual(['sv1', 'sv2', 'sv3']);

    // Step 4: Determine optimal batch size
    const batchSize = getOptimalBatchSize(cardIds.length);
    expect(batchSize).toBe(50);

    // Step 5: Chunk for processing
    const chunks = chunkArray(cardIds, batchSize);
    expect(chunks.length).toBe(3);

    // Step 6: Estimate complexity
    const complexity = estimateQueryComplexity({
      collectionSize: collectionCards.length,
      requiresEnrichment: true,
      filterCount: 1,
      sortRequired: true,
    });
    expect(complexity).toBe('medium');
  });
});

describe('Integration: Filtering and pagination pipeline', () => {
  it('should filter and paginate collection', () => {
    const cards = Array.from({ length: 100 }, (_, i) => ({
      cardId: `sv${i < 60 ? 1 : 2}-${(i % 60) + 1}`,
      quantity: 1,
    }));

    // Filter by set
    const setFilter = createSetMembershipFilter('sv1');
    const filtered = cards.filter((c) => setFilter(c.cardId));
    expect(filtered.length).toBe(60);

    // Paginate results
    const page1 = paginateResults(filtered, 1, 20);
    expect(page1.data.length).toBe(20);
    expect(page1.totalPages).toBe(3);
    expect(page1.hasMore).toBe(true);

    const page3 = paginateResults(filtered, 3, 20);
    expect(page3.data.length).toBe(20);
    expect(page3.hasMore).toBe(false);
  });
});
