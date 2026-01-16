/**
 * Performance utilities for optimizing database queries and batch operations.
 *
 * These utilities help reduce N+1 query problems and optimize batch lookups
 * by providing efficient grouping, chunking, and deduplication strategies.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of a batch lookup operation
 */
export interface BatchLookupResult<T> {
  found: Map<string, T>;
  missing: string[];
  hitRate: number;
}

/**
 * Card data for enrichment
 */
export interface CardEnrichmentData {
  cardId: string;
  name: string;
  imageSmall: string;
  setId: string;
  rarity?: string;
  types?: string[];
  priceMarket?: number;
}

/**
 * Set data for enrichment
 */
export interface SetEnrichmentData {
  setId: string;
  name: string;
  series: string;
  totalCards: number;
  logoUrl?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum batch size for parallel lookups to avoid overwhelming the database
 */
export const MAX_BATCH_SIZE = 100;

/**
 * Default chunk size for processing large arrays
 */
export const DEFAULT_CHUNK_SIZE = 50;

// ============================================================================
// DEDUPLICATION UTILITIES
// ============================================================================

/**
 * Extract unique values from an array
 */
export function getUniqueValues<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * Extract unique string values from an array of objects using a key extractor
 */
export function getUniqueKeys<T>(arr: T[], keyExtractor: (item: T) => string): string[] {
  const keys = arr.map(keyExtractor);
  return [...new Set(keys)];
}

/**
 * Extract unique values from nested arrays
 */
export function getUniqueFromNested<T, K>(arr: T[], nestedExtractor: (item: T) => K[]): K[] {
  const all = arr.flatMap(nestedExtractor);
  return [...new Set(all)];
}

// ============================================================================
// CHUNKING UTILITIES
// ============================================================================

/**
 * Split an array into chunks of a specified size
 */
export function chunkArray<T>(arr: T[], chunkSize: number = DEFAULT_CHUNK_SIZE): T[][] {
  if (chunkSize <= 0) {
    throw new Error('Chunk size must be positive');
  }

  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Process an array in chunks with a callback
 */
export async function processInChunks<T, R>(
  arr: T[],
  chunkSize: number,
  processor: (chunk: T[]) => Promise<R[]>
): Promise<R[]> {
  const chunks = chunkArray(arr, chunkSize);
  const results: R[] = [];

  for (const chunk of chunks) {
    const chunkResults = await processor(chunk);
    results.push(...chunkResults);
  }

  return results;
}

/**
 * Process an array in chunks with parallel execution per chunk
 */
export async function processInParallelChunks<T, R>(
  arr: T[],
  chunkSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const chunks = chunkArray(arr, chunkSize);
  const results: R[] = [];

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map(processor));
    results.push(...chunkResults);
  }

  return results;
}

// ============================================================================
// BATCH LOOKUP UTILITIES
// ============================================================================

/**
 * Create a lookup map from an array of items with a key extractor
 */
export function createLookupMap<T>(items: T[], keyExtractor: (item: T) => string): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    const key = keyExtractor(item);
    map.set(key, item);
  }
  return map;
}

/**
 * Create a lookup map that groups items by key
 */
export function createGroupedLookupMap<T>(
  items: T[],
  keyExtractor: (item: T) => string
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyExtractor(item);
    const existing = map.get(key) ?? [];
    existing.push(item);
    map.set(key, existing);
  }
  return map;
}

/**
 * Build a batch lookup result from found items
 */
export function buildBatchLookupResult<T>(
  requestedKeys: string[],
  foundItems: T[],
  keyExtractor: (item: T) => string
): BatchLookupResult<T> {
  const found = createLookupMap(foundItems, keyExtractor);
  const missing = requestedKeys.filter((key) => !found.has(key));
  const hitRate = requestedKeys.length > 0 ? found.size / requestedKeys.length : 1;

  return { found, missing, hitRate };
}

// ============================================================================
// CARD ENRICHMENT UTILITIES
// ============================================================================

/**
 * Extract cardIds from collection cards for batch lookup
 */
export function extractCardIdsForLookup(collectionCards: Array<{ cardId: string }>): string[] {
  return getUniqueKeys(collectionCards, (card) => card.cardId);
}

/**
 * Extract setIds from cardIds (format: "setId-number")
 */
export function extractSetIdsFromCardIds(cardIds: string[]): string[] {
  const setIds = cardIds.map((cardId) => {
    const dashIndex = cardId.lastIndexOf('-');
    return dashIndex > 0 ? cardId.substring(0, dashIndex) : cardId;
  });
  return getUniqueValues(setIds);
}

/**
 * Build card enrichment map from cached card data
 */
export function buildCardEnrichmentMap(
  cachedCards: Array<CardEnrichmentData | null>
): Map<string, CardEnrichmentData> {
  const map = new Map<string, CardEnrichmentData>();
  for (const card of cachedCards) {
    if (card) {
      map.set(card.cardId, card);
    }
  }
  return map;
}

/**
 * Build set enrichment map from cached set data
 */
export function buildSetEnrichmentMap(
  cachedSets: Array<SetEnrichmentData | null>
): Map<string, SetEnrichmentData> {
  const map = new Map<string, SetEnrichmentData>();
  for (const set of cachedSets) {
    if (set) {
      map.set(set.setId, set);
    }
  }
  return map;
}

/**
 * Enrich a card with cached data
 */
export function enrichCardWithCachedData<T extends { cardId: string }>(
  card: T,
  cardDataMap: Map<string, CardEnrichmentData>,
  defaults: { name: string; imageSmall: string; setId: string }
): T & { name: string; imageSmall: string; setId: string; rarity?: string; types?: string[] } {
  const cachedData = cardDataMap.get(card.cardId);
  return {
    ...card,
    name: cachedData?.name ?? defaults.name,
    imageSmall: cachedData?.imageSmall ?? defaults.imageSmall,
    setId: cachedData?.setId ?? defaults.setId,
    rarity: cachedData?.rarity,
    types: cachedData?.types,
  };
}

// ============================================================================
// COLLECTION AGGREGATION UTILITIES
// ============================================================================

/**
 * Group collection cards by cardId for aggregation
 */
export function groupCollectionByCardId<T extends { cardId: string; quantity: number }>(
  cards: T[]
): Map<string, { totalQuantity: number; items: T[] }> {
  const grouped = new Map<string, { totalQuantity: number; items: T[] }>();

  for (const card of cards) {
    const existing = grouped.get(card.cardId);
    if (existing) {
      existing.totalQuantity += card.quantity;
      existing.items.push(card);
    } else {
      grouped.set(card.cardId, {
        totalQuantity: card.quantity,
        items: [card],
      });
    }
  }

  return grouped;
}

/**
 * Group collection cards by setId for aggregation
 */
export function groupCollectionBySetId<T extends { cardId: string }>(cards: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const card of cards) {
    const dashIndex = card.cardId.lastIndexOf('-');
    const setId = dashIndex > 0 ? card.cardId.substring(0, dashIndex) : card.cardId;

    const existing = grouped.get(setId) ?? [];
    existing.push(card);
    grouped.set(setId, existing);
  }

  return grouped;
}

/**
 * Calculate collection statistics efficiently
 */
export function calculateCollectionStats<T extends { cardId: string; quantity: number }>(
  cards: T[]
): {
  totalQuantity: number;
  uniqueCards: number;
  uniqueSets: number;
  bySet: Map<string, number>;
} {
  let totalQuantity = 0;
  const uniqueCardIds = new Set<string>();
  const setCardCounts = new Map<string, number>();

  for (const card of cards) {
    totalQuantity += card.quantity;
    uniqueCardIds.add(card.cardId);

    const dashIndex = card.cardId.lastIndexOf('-');
    const setId = dashIndex > 0 ? card.cardId.substring(0, dashIndex) : card.cardId;
    setCardCounts.set(setId, (setCardCounts.get(setId) ?? 0) + 1);
  }

  return {
    totalQuantity,
    uniqueCards: uniqueCardIds.size,
    uniqueSets: setCardCounts.size,
    bySet: setCardCounts,
  };
}

// ============================================================================
// FILTER OPTIMIZATION UTILITIES
// ============================================================================

/**
 * Pre-filter collection before expensive enrichment
 * Returns cardIds that pass the filter
 */
export function preFilterByCardId(
  collectionCards: Array<{ cardId: string }>,
  filter: (cardId: string) => boolean
): Set<string> {
  const passing = new Set<string>();
  for (const card of collectionCards) {
    if (filter(card.cardId)) {
      passing.add(card.cardId);
    }
  }
  return passing;
}

/**
 * Filter by setId prefix efficiently
 */
export function filterBySetPrefix(cardId: string, setId: string): boolean {
  return cardId.startsWith(setId + '-');
}

/**
 * Create a set membership filter
 */
export function createSetMembershipFilter(setId: string): (cardId: string) => boolean {
  const prefix = setId + '-';
  return (cardId: string) => cardId.startsWith(prefix);
}

// ============================================================================
// RESULT PAGINATION UTILITIES
// ============================================================================

/**
 * Paginate an array of results
 */
export function paginateResults<T>(
  results: T[],
  page: number,
  pageSize: number
): {
  data: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
} {
  const totalItems = results.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const data = results.slice(startIndex, endIndex);

  return {
    data,
    page,
    pageSize,
    totalItems,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Apply cursor-based pagination
 */
export function applyCursorPagination<T>(
  results: T[],
  cursor: number | undefined,
  limit: number
): {
  data: T[];
  nextCursor: number | undefined;
  hasMore: boolean;
} {
  const startIndex = cursor ?? 0;
  const endIndex = Math.min(startIndex + limit, results.length);
  const data = results.slice(startIndex, endIndex);
  const hasMore = endIndex < results.length;

  return {
    data,
    nextCursor: hasMore ? endIndex : undefined,
    hasMore,
  };
}

// ============================================================================
// CACHE INVALIDATION HELPERS
// ============================================================================

/**
 * Calculate cache TTL based on data freshness requirements
 */
export function calculateCacheTTL(dataType: 'static' | 'semi-static' | 'dynamic'): number {
  switch (dataType) {
    case 'static':
      return 24 * 60 * 60 * 1000; // 24 hours
    case 'semi-static':
      return 60 * 60 * 1000; // 1 hour
    case 'dynamic':
      return 5 * 60 * 1000; // 5 minutes
    default:
      return 15 * 60 * 1000; // 15 minutes default
  }
}

/**
 * Check if cached data is stale
 */
export function isCacheStale(cachedAt: number, ttlMs: number): boolean {
  return Date.now() - cachedAt > ttlMs;
}

// ============================================================================
// QUERY OPTIMIZATION HELPERS
// ============================================================================

/**
 * Determine optimal batch size based on total items
 */
export function getOptimalBatchSize(totalItems: number): number {
  if (totalItems <= 10) return totalItems;
  if (totalItems <= 50) return 25;
  if (totalItems <= 200) return 50;
  return MAX_BATCH_SIZE;
}

/**
 * Estimate query complexity for logging/monitoring
 */
export function estimateQueryComplexity(params: {
  collectionSize: number;
  requiresEnrichment: boolean;
  filterCount: number;
  sortRequired: boolean;
}): 'low' | 'medium' | 'high' {
  let score = 0;

  if (params.collectionSize > 500) score += 2;
  else if (params.collectionSize > 100) score += 1;

  if (params.requiresEnrichment) score += 1;
  if (params.filterCount > 2) score += 1;
  if (params.sortRequired) score += 1;

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}
