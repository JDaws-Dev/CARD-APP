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
 * Print status for a set (kid-friendly set filtering)
 */
export type PrintStatus = 'current' | 'limited' | 'out_of_print' | 'vintage';

/**
 * All valid print statuses
 */
export const PRINT_STATUSES: PrintStatus[] = ['current', 'limited', 'out_of_print', 'vintage'];

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
  // Kid-friendly set filtering fields (January 2026)
  isInPrint?: boolean;
  printStatus?: PrintStatus;
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
  skipped: number; // Sets skipped due to maxAgeMonths filtering
}

/**
 * Full game population result
 */
export interface GamePopulationResult {
  success: boolean;
  setsProcessed: number;
  setsSkipped: number; // Sets skipped due to maxAgeMonths filtering
  cardsProcessed: number;
  errors: string[];
}

/**
 * Options for populating sets
 */
export interface PopulateSetsOptions {
  gameSlug: GameSlug;
  maxAgeMonths?: number; // Only include sets released within the last N months
}

/**
 * Options for populating all game data
 */
export interface PopulateGameDataOptions {
  gameSlug: GameSlug;
  maxSets?: number; // Limit number of sets for testing
  maxAgeMonths?: number; // Only include sets released within the last N months
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
// SET AGE FILTERING
// =============================================================================

/**
 * Default recommended maxAgeMonths for kid-friendly set filtering
 * 24 months ensures sets are still "in print" and available at retail
 */
export const DEFAULT_MAX_AGE_MONTHS = 24;

/**
 * Common maxAgeMonths presets
 */
export const MAX_AGE_PRESETS = {
  /** Only current sets (last 6 months) */
  CURRENT: 6,
  /** Recent sets (last 12 months) */
  RECENT: 12,
  /** In-print sets (last 24 months) - recommended for kids */
  IN_PRINT: 24,
  /** Extended (last 36 months) */
  EXTENDED: 36,
  /** All sets (no filtering) */
  ALL: undefined as undefined,
} as const;

/**
 * Validate maxAgeMonths value
 * @param months - The maxAgeMonths value to validate
 * @returns true if valid (positive number or undefined/null for no filter)
 */
export function isValidMaxAgeMonths(months: number | null | undefined): boolean {
  if (months === null || months === undefined) {
    return true; // No filter is valid
  }
  return typeof months === 'number' && months > 0 && Number.isFinite(months);
}

/**
 * Calculate the cutoff date for filtering sets by age
 * @param maxAgeMonths - Maximum age in months for sets to include
 * @returns Date representing the cutoff, or null if no filtering
 */
export function calculateCutoffDate(maxAgeMonths: number | null | undefined): Date | null {
  if (maxAgeMonths === null || maxAgeMonths === undefined || maxAgeMonths <= 0) {
    return null;
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - maxAgeMonths, now.getDate());
}

/**
 * Format cutoff date for display
 * @param cutoffDate - The cutoff date to format
 * @returns Human-readable string like "January 2024"
 */
export function formatCutoffDate(cutoffDate: Date | null): string {
  if (cutoffDate === null) {
    return 'No filter (all sets)';
  }
  return cutoffDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });
}

/**
 * Get a human-readable description of maxAgeMonths filter
 * @param maxAgeMonths - The maxAgeMonths value
 * @returns Description like "Sets from the last 24 months"
 */
export function getMaxAgeDescription(maxAgeMonths: number | null | undefined): string {
  if (maxAgeMonths === null || maxAgeMonths === undefined) {
    return 'All sets (no age filter)';
  }
  if (maxAgeMonths === 1) {
    return 'Sets from the last month';
  }
  if (maxAgeMonths === 12) {
    return 'Sets from the last year';
  }
  if (maxAgeMonths === 24) {
    return 'Sets from the last 2 years (in-print)';
  }
  return `Sets from the last ${maxAgeMonths} months`;
}

/**
 * Check if a release date is within the age limit
 * @param releaseDate - The release date string (YYYY-MM-DD format)
 * @param maxAgeMonths - Maximum age in months
 * @returns true if within limit, false if filtered out
 */
export function isReleaseDateWithinLimit(
  releaseDate: string,
  maxAgeMonths: number | null | undefined
): boolean {
  const cutoffDate = calculateCutoffDate(maxAgeMonths);
  if (cutoffDate === null) {
    return true;
  }

  try {
    const releaseDateObj = new Date(releaseDate);
    if (isNaN(releaseDateObj.getTime())) {
      return true; // Invalid dates pass through
    }
    return releaseDateObj.getTime() >= cutoffDate.getTime();
  } catch {
    return true; // Errors pass through
  }
}

/**
 * Filter an array of sets by release date
 * @param sets - Array of sets with releaseDate field
 * @param maxAgeMonths - Maximum age in months
 * @returns Filtered array of sets
 */
export function filterSetsByAge<T extends { releaseDate: string }>(
  sets: T[],
  maxAgeMonths: number | null | undefined
): T[] {
  if (maxAgeMonths === null || maxAgeMonths === undefined) {
    return sets;
  }
  return sets.filter((set) => isReleaseDateWithinLimit(set.releaseDate, maxAgeMonths));
}

/**
 * Count how many sets would be filtered out
 * @param sets - Array of sets with releaseDate field
 * @param maxAgeMonths - Maximum age in months
 * @returns Object with included and excluded counts
 */
export function countFilteredSets<T extends { releaseDate: string }>(
  sets: T[],
  maxAgeMonths: number | null | undefined
): { included: number; excluded: number; total: number } {
  if (maxAgeMonths === null || maxAgeMonths === undefined) {
    return { included: sets.length, excluded: 0, total: sets.length };
  }

  let included = 0;
  let excluded = 0;

  for (const set of sets) {
    if (isReleaseDateWithinLimit(set.releaseDate, maxAgeMonths)) {
      included++;
    } else {
      excluded++;
    }
  }

  return { included, excluded, total: sets.length };
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

// =============================================================================
// PRINT STATUS UTILITIES (Kid-Friendly Set Filtering)
// =============================================================================

/**
 * Check if a print status string is valid
 */
export function isValidPrintStatus(status: string): status is PrintStatus {
  return PRINT_STATUSES.includes(status as PrintStatus);
}

/**
 * Get a human-readable label for a print status
 */
export function getPrintStatusLabel(status: PrintStatus): string {
  switch (status) {
    case 'current':
      return 'In Print';
    case 'limited':
      return 'Limited Availability';
    case 'out_of_print':
      return 'Out of Print';
    case 'vintage':
      return 'Vintage/Collector';
    default:
      return 'Unknown';
  }
}

/**
 * Get a description for a print status
 */
export function getPrintStatusDescription(status: PrintStatus): string {
  switch (status) {
    case 'current':
      return 'Currently in print and widely available at retail';
    case 'limited':
      return 'Limited availability, may be out of print soon';
    case 'out_of_print':
      return 'No longer in print at retail';
    case 'vintage':
      return 'Vintage or collector set (over 5 years old)';
    default:
      return 'Print status unknown';
  }
}

/**
 * Check if a set is considered "in print" based on its fields
 * Implements the same logic as the Convex getInPrintSets query
 */
export function isSetInPrint(set: CachedSet, maxAgeMonths: number = 24): boolean {
  // Explicitly marked as in print
  if (set.isInPrint === true) {
    return true;
  }

  // Explicitly marked as not in print
  if (set.isInPrint === false) {
    return false;
  }

  // Check print status
  if (set.printStatus === 'current' || set.printStatus === 'limited') {
    return true;
  }

  if (set.printStatus === 'out_of_print' || set.printStatus === 'vintage') {
    return false;
  }

  // Fallback: check release date
  const now = new Date();
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - maxAgeMonths, now.getDate());
  const releaseTime = new Date(set.releaseDate).getTime();

  return releaseTime >= cutoffDate.getTime();
}

/**
 * Filter an array of sets to only include in-print sets
 */
export function filterInPrintSets(sets: CachedSet[], maxAgeMonths: number = 24): CachedSet[] {
  return sets.filter((set) => isSetInPrint(set, maxAgeMonths));
}

/**
 * Get sets grouped by print status
 */
export function groupSetsByPrintStatus(
  sets: CachedSet[],
  maxAgeMonths: number = 24
): Record<'inPrint' | 'outOfPrint', CachedSet[]> {
  const inPrint: CachedSet[] = [];
  const outOfPrint: CachedSet[] = [];

  for (const set of sets) {
    if (isSetInPrint(set, maxAgeMonths)) {
      inPrint.push(set);
    } else {
      outOfPrint.push(set);
    }
  }

  return { inPrint, outOfPrint };
}

/**
 * Calculate the cutoff date for in-print sets (24 months ago by default)
 */
export function getInPrintCutoffDate(maxAgeMonths: number = 24): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - maxAgeMonths, now.getDate());
}

/**
 * Determine the print status for a set based on its release date
 * Useful for auto-assigning status to sets without explicit print status
 */
export function determinePrintStatusByDate(
  releaseDate: string,
  outOfPrintMonths: number = 24,
  vintageMonths: number = 60
): PrintStatus {
  const now = new Date();
  const releaseTime = new Date(releaseDate).getTime();

  const outOfPrintCutoff = new Date(
    now.getFullYear(),
    now.getMonth() - outOfPrintMonths,
    now.getDate()
  );
  const vintageCutoff = new Date(now.getFullYear(), now.getMonth() - vintageMonths, now.getDate());

  if (releaseTime < vintageCutoff.getTime()) {
    return 'vintage';
  }

  if (releaseTime < outOfPrintCutoff.getTime()) {
    return 'out_of_print';
  }

  return 'current';
}

/**
 * Get statistics about print status distribution for a set of sets
 */
export function getPrintStatusStats(
  sets: CachedSet[],
  maxAgeMonths: number = 24
): {
  total: number;
  inPrint: number;
  outOfPrint: number;
  byStatus: Record<PrintStatus | 'unknown', number>;
  percentInPrint: number;
} {
  const byStatus: Record<PrintStatus | 'unknown', number> = {
    current: 0,
    limited: 0,
    out_of_print: 0,
    vintage: 0,
    unknown: 0,
  };

  let inPrint = 0;
  let outOfPrint = 0;

  for (const set of sets) {
    if (set.printStatus) {
      byStatus[set.printStatus]++;
    } else {
      byStatus.unknown++;
    }

    if (isSetInPrint(set, maxAgeMonths)) {
      inPrint++;
    } else {
      outOfPrint++;
    }
  }

  return {
    total: sets.length,
    inPrint,
    outOfPrint,
    byStatus,
    percentInPrint: sets.length > 0 ? Math.round((inPrint / sets.length) * 100) : 0,
  };
}
