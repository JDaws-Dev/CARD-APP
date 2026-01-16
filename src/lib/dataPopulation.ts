/**
 * Data Population Client Utilities
 *
 * Client-side utilities and types for data population.
 * The actual population logic lives in convex/dataPopulation.ts,
 * but these utilities provide validation, normalization, and helper functions
 * that can be used both on the client and in tests.
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Valid game slugs for data population
 */
export type GameSlug =
  | 'pokemon'
  | 'yugioh'
  | 'mtg'
  | 'onepiece'
  | 'lorcana'
  | 'digimon'
  | 'dragonball';

/**
 * All supported game slugs
 */
export const GAME_SLUGS: GameSlug[] = [
  'pokemon',
  'yugioh',
  'mtg',
  'onepiece',
  'lorcana',
  'digimon',
  'dragonball',
];

/**
 * Rate limits per game (milliseconds between requests)
 */
export const RATE_LIMITS: Record<GameSlug, number> = {
  pokemon: 100,
  yugioh: 50,
  mtg: 100,
  onepiece: 100,
  lorcana: 100,
  digimon: 700,
  dragonball: 100,
};

/**
 * API endpoint configurations
 */
export const API_CONFIGS: Record<GameSlug, { baseUrl: string; setsEndpoint: string }> = {
  pokemon: {
    baseUrl: 'https://api.pokemontcg.io/v2',
    setsEndpoint: '/sets',
  },
  yugioh: {
    baseUrl: 'https://db.ygoprodeck.com/api/v7',
    setsEndpoint: '/cardsets.php',
  },
  mtg: {
    baseUrl: 'https://api.scryfall.com',
    setsEndpoint: '/sets',
  },
  onepiece: {
    baseUrl: 'https://optcg-api.ryanmichaelhirst.us/api/v1',
    setsEndpoint: '/sets',
  },
  lorcana: {
    baseUrl: 'https://api.lorcast.com/v0',
    setsEndpoint: '/sets',
  },
  digimon: {
    baseUrl: 'https://digimoncard.io/api-public',
    setsEndpoint: '/getAllCards.php',
  },
  dragonball: {
    baseUrl: 'https://www.apitcg.com/api/v1/dbfw',
    setsEndpoint: '/sets',
  },
};

/**
 * Cached set data structure (mirrors Convex schema)
 */
export interface CachedSet {
  setId: string;
  gameSlug: GameSlug;
  name: string;
  series: string;
  releaseDate: string;
  totalCards: number;
  logoUrl?: string;
  symbolUrl?: string;
}

/**
 * Cached card data structure (mirrors Convex schema)
 */
export interface CachedCard {
  cardId: string;
  gameSlug: GameSlug;
  setId: string;
  name: string;
  number: string;
  supertype: string;
  subtypes: string[];
  types: string[];
  rarity?: string;
  imageSmall: string;
  imageLarge: string;
  tcgPlayerUrl?: string;
  priceMarket?: number;
}

/**
 * Population result from an action
 */
export interface PopulationResult {
  success: boolean;
  count: number;
  errors: string[];
}

/**
 * Full game population result
 */
export interface GamePopulationResult {
  success: boolean;
  setsProcessed: number;
  cardsProcessed: number;
  errors: string[];
}

/**
 * Population status for a game
 */
export interface PopulationStatus {
  setCount: number;
  cardCount: number;
  lastUpdated: number | null;
}

/**
 * All games population status
 */
export interface AllGamesStatus {
  totalSets: number;
  totalCards: number;
  byGame: Record<GameSlug, PopulationStatus>;
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Check if a string is a valid game slug
 */
export function isValidGameSlug(slug: string): slug is GameSlug {
  return GAME_SLUGS.includes(slug as GameSlug);
}

/**
 * Check if a set ID is valid
 */
export function isValidSetId(setId: string): boolean {
  return typeof setId === 'string' && setId.length > 0 && setId.length <= 100;
}

/**
 * Check if a card ID is valid
 */
export function isValidCardId(cardId: string): boolean {
  return typeof cardId === 'string' && cardId.length >= 2 && cardId.length <= 200;
}

/**
 * Validate a set object
 */
export function validateSet(set: Partial<CachedSet>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!set.setId || !isValidSetId(set.setId)) {
    errors.push('Invalid or missing setId');
  }

  if (!set.gameSlug || !isValidGameSlug(set.gameSlug)) {
    errors.push('Invalid or missing gameSlug');
  }

  if (!set.name || typeof set.name !== 'string' || set.name.length === 0) {
    errors.push('Invalid or missing name');
  }

  if (!set.series || typeof set.series !== 'string') {
    errors.push('Invalid or missing series');
  }

  if (!set.releaseDate || typeof set.releaseDate !== 'string') {
    errors.push('Invalid or missing releaseDate');
  }

  if (typeof set.totalCards !== 'number' || set.totalCards < 0) {
    errors.push('Invalid totalCards');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate a card object
 */
export function validateCard(card: Partial<CachedCard>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!card.cardId || !isValidCardId(card.cardId)) {
    errors.push('Invalid or missing cardId');
  }

  if (!card.gameSlug || !isValidGameSlug(card.gameSlug)) {
    errors.push('Invalid or missing gameSlug');
  }

  if (!card.setId || !isValidSetId(card.setId)) {
    errors.push('Invalid or missing setId');
  }

  if (!card.name || typeof card.name !== 'string' || card.name.length === 0) {
    errors.push('Invalid or missing name');
  }

  if (!card.number || typeof card.number !== 'string') {
    errors.push('Invalid or missing number');
  }

  if (!card.supertype || typeof card.supertype !== 'string') {
    errors.push('Invalid or missing supertype');
  }

  if (!Array.isArray(card.subtypes)) {
    errors.push('Invalid subtypes - must be an array');
  }

  if (!Array.isArray(card.types)) {
    errors.push('Invalid types - must be an array');
  }

  if (typeof card.imageSmall !== 'string') {
    errors.push('Invalid imageSmall');
  }

  if (typeof card.imageLarge !== 'string') {
    errors.push('Invalid imageLarge');
  }

  return { isValid: errors.length === 0, errors };
}

// =============================================================================
// NORMALIZATION FUNCTIONS
// =============================================================================

/**
 * Normalize a set object to ensure all fields have valid values
 */
export function normalizeSet(set: Partial<CachedSet>, gameSlug: GameSlug): CachedSet {
  return {
    setId: set.setId || 'unknown',
    gameSlug,
    name: set.name || 'Unknown Set',
    series: set.series || 'Unknown',
    releaseDate: set.releaseDate || '1990-01-01',
    totalCards: typeof set.totalCards === 'number' && set.totalCards >= 0 ? set.totalCards : 0,
    logoUrl: set.logoUrl,
    symbolUrl: set.symbolUrl,
  };
}

/**
 * Normalize a card object to ensure all fields have valid values
 */
export function normalizeCard(card: Partial<CachedCard>, gameSlug: GameSlug): CachedCard {
  return {
    cardId: card.cardId || 'unknown',
    gameSlug,
    setId: card.setId || 'unknown',
    name: card.name || 'Unknown Card',
    number: card.number || '0',
    supertype: card.supertype || 'Unknown',
    subtypes: Array.isArray(card.subtypes) ? card.subtypes : [],
    types: Array.isArray(card.types) ? card.types : [],
    rarity: card.rarity,
    imageSmall: card.imageSmall || '',
    imageLarge: card.imageLarge || '',
    tcgPlayerUrl: card.tcgPlayerUrl,
    priceMarket:
      typeof card.priceMarket === 'number' && card.priceMarket > 0 ? card.priceMarket : undefined,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the rate limit delay for a game in milliseconds
 */
export function getRateLimitDelay(gameSlug: GameSlug): number {
  return RATE_LIMITS[gameSlug] || 100;
}

/**
 * Get the API base URL for a game
 */
export function getApiBaseUrl(gameSlug: GameSlug): string {
  return API_CONFIGS[gameSlug]?.baseUrl || '';
}

/**
 * Get the sets endpoint for a game
 */
export function getSetsEndpoint(gameSlug: GameSlug): string {
  const config = API_CONFIGS[gameSlug];
  return config ? `${config.baseUrl}${config.setsEndpoint}` : '';
}

/**
 * Format a game slug for display
 */
export function formatGameName(gameSlug: GameSlug): string {
  const names: Record<GameSlug, string> = {
    pokemon: 'Pokémon TCG',
    yugioh: 'Yu-Gi-Oh!',
    mtg: 'Magic: The Gathering',
    onepiece: 'One Piece TCG',
    lorcana: 'Disney Lorcana',
    digimon: 'Digimon TCG',
    dragonball: 'Dragon Ball Fusion World',
  };
  return names[gameSlug] || gameSlug;
}

/**
 * Check if a game has population support
 */
export function hasPopulationSupport(gameSlug: GameSlug): boolean {
  const supported: GameSlug[] = ['pokemon', 'yugioh', 'mtg', 'lorcana'];
  return supported.includes(gameSlug);
}

/**
 * Get games with full population support
 */
export function getSupportedGames(): GameSlug[] {
  return ['pokemon', 'yugioh', 'mtg', 'lorcana'];
}

/**
 * Calculate estimated population time for a game (rough estimate)
 */
export function estimatePopulationTime(
  setCount: number,
  avgCardsPerSet: number,
  gameSlug: GameSlug
): number {
  const delay = getRateLimitDelay(gameSlug);
  // Time = (sets * delay) + (sets * avgCards * delay)
  const setsTime = setCount * delay;
  const cardsTime = setCount * avgCardsPerSet * delay;
  return setsTime + cardsTime;
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return 'less than a second';
  }

  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
}

/**
 * Get population status summary
 */
export function getStatusSummary(status: PopulationStatus): string {
  if (status.setCount === 0 && status.cardCount === 0) {
    return 'Not populated';
  }

  if (status.cardCount === 0) {
    return `${status.setCount} sets (no cards)`;
  }

  const avgCards = Math.round(status.cardCount / status.setCount);
  return `${status.setCount} sets, ${status.cardCount.toLocaleString()} cards (~${avgCards} per set)`;
}

/**
 * Check if a game needs population (no data or outdated)
 */
export function needsPopulation(
  status: PopulationStatus,
  maxAgeMs: number = 7 * 24 * 60 * 60 * 1000 // 7 days
): boolean {
  // No data at all
  if (status.setCount === 0) {
    return true;
  }

  // Has sets but no cards
  if (status.cardCount === 0) {
    return true;
  }

  // Data is too old
  if (status.lastUpdated) {
    const age = Date.now() - status.lastUpdated;
    return age > maxAgeMs;
  }

  return false;
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

/**
 * Split an array into batches of a given size
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 100;
  return Math.min(100, Math.round((current / total) * 100));
}
