/**
 * Pokemon TCG API Client
 * Documentation: https://docs.pokemontcg.io/
 */

const API_BASE = 'https://api.pokemontcg.io/v2';
const API_KEY = process.env.POKEMON_TCG_API_KEY;

interface FetchOptions {
  cache?: RequestCache;
  next?: { revalidate?: number };
}

async function fetchFromAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (API_KEY) {
    headers['X-Api-Key'] = API_KEY;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Pokemon TCG API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// TYPES
// =============================================================================

export interface PokemonSet {
  id: string;
  name: string;
  series: string;
  printedTotal: number;
  total: number;
  releaseDate: string;
  updatedAt: string;
  images: {
    symbol: string;
    logo: string;
  };
}

export interface PokemonCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  types?: string[];
  number: string;
  rarity?: string;
  images: {
    small: string;
    large: string;
  };
  tcgplayer?: {
    url: string;
    prices?: {
      normal?: { market: number };
      holofoil?: { market: number };
      reverseHolofoil?: { market: number };
    };
  };
  set: {
    id: string;
    name: string;
  };
  /** Available card variants (e.g., 'normal', 'holofoil', 'reverseHolofoil') from cachedCards */
  availableVariants?: string[];
}

// =============================================================================
// PROMO CARD HELPERS
// =============================================================================

/**
 * Known promo set IDs (Black Star Promo sets)
 */
export const PROMO_SET_IDS = [
  'svp',
  'swshp',
  'smp',
  'xyp',
  'bwp',
  'dpp',
  'np',
  'basep',
  'hsp',
] as const;

/**
 * Check if a card is a promo card
 * Checks both rarity field and set ID for comprehensive detection
 */
export function isPromoCard(card: PokemonCard): boolean {
  // Check if rarity is explicitly "Promo"
  if (card.rarity?.toLowerCase() === 'promo') {
    return true;
  }
  // Check if card belongs to a known promo set
  if (PROMO_SET_IDS.includes(card.set.id as (typeof PROMO_SET_IDS)[number])) {
    return true;
  }
  return false;
}

/**
 * Get the promo set era/series name from a promo card
 * Returns a user-friendly label like "SV Promo", "SWSH Promo", etc.
 */
export function getPromoSetLabel(card: PokemonCard): string | null {
  if (!isPromoCard(card)) return null;

  const setIdToLabel: Record<string, string> = {
    svp: 'SV Promo',
    swshp: 'SWSH Promo',
    smp: 'SM Promo',
    xyp: 'XY Promo',
    bwp: 'BW Promo',
    dpp: 'DP Promo',
    np: 'Nintendo Promo',
    basep: 'Base Promo',
    hsp: 'HGSS Promo',
  };

  return setIdToLabel[card.set.id] || 'Promo';
}

interface APIResponse<T> {
  data: T;
  page?: number;
  pageSize?: number;
  count?: number;
  totalCount?: number;
}

// =============================================================================
// SERIES CONSTANTS
// =============================================================================

/**
 * Supported Pokemon TCG series
 */
export const POKEMON_SERIES = ['Scarlet & Violet', 'Sword & Shield'] as const;
export type PokemonSeries = (typeof POKEMON_SERIES)[number];

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get sets by series name
 */
export async function getSetsBySeries(series: PokemonSeries): Promise<PokemonSet[]> {
  const query = encodeURIComponent(`series:"${series}"`);
  const response = await fetchFromAPI<APIResponse<PokemonSet[]>>(
    `/sets?q=${query}&orderBy=-releaseDate`,
    { next: { revalidate: 86400 } } // Cache for 24 hours
  );
  return response.data;
}

/**
 * Get all Scarlet & Violet era sets
 */
export async function getScarletVioletSets(): Promise<PokemonSet[]> {
  return getSetsBySeries('Scarlet & Violet');
}

/**
 * Get all Sword & Shield era sets
 */
export async function getSwordShieldSets(): Promise<PokemonSet[]> {
  return getSetsBySeries('Sword & Shield');
}

/**
 * Get all supported sets (Scarlet & Violet + Sword & Shield)
 * Returns sets sorted by release date (newest first)
 */
export async function getAllSupportedSets(): Promise<PokemonSet[]> {
  const [svSets, swshSets] = await Promise.all([getScarletVioletSets(), getSwordShieldSets()]);

  // Combine and sort by release date (newest first)
  return [...svSets, ...swshSets].sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );
}

/**
 * Get a single set by ID
 */
export async function getSet(setId: string): Promise<PokemonSet> {
  const response = await fetchFromAPI<APIResponse<PokemonSet>>(`/sets/${setId}`, {
    next: { revalidate: 86400 },
  });
  return response.data;
}

/**
 * Get all cards in a set
 */
export async function getCardsInSet(setId: string): Promise<PokemonCard[]> {
  const response = await fetchFromAPI<APIResponse<PokemonCard[]>>(
    `/cards?q=set.id:${setId}&orderBy=number&pageSize=250`,
    { next: { revalidate: 86400 } }
  );
  return response.data;
}

/**
 * Get a single card by ID
 */
export async function getCard(cardId: string): Promise<PokemonCard> {
  const response = await fetchFromAPI<APIResponse<PokemonCard>>(`/cards/${cardId}`, {
    next: { revalidate: 86400 },
  });
  return response.data;
}

/**
 * Search cards by name
 */
export async function searchCards(name: string, limit = 20): Promise<PokemonCard[]> {
  const response = await fetchFromAPI<APIResponse<PokemonCard[]>>(
    `/cards?q=name:"${name}*"&pageSize=${limit}&orderBy=-set.releaseDate`,
    { cache: 'no-store' }
  );
  return response.data;
}

/**
 * Filter options for card search
 */
export interface FilterOptions {
  setId?: string;
  type?: string;
  name?: string;
  limit?: number;
}

/**
 * Available Pokemon types for filtering
 */
export const POKEMON_TYPES = [
  'Colorless',
  'Darkness',
  'Dragon',
  'Fairy',
  'Fighting',
  'Fire',
  'Grass',
  'Lightning',
  'Metal',
  'Psychic',
  'Water',
] as const;

export type PokemonType = (typeof POKEMON_TYPES)[number];

/**
 * Filter cards by set, type, and/or name
 */
export async function filterCards(options: FilterOptions): Promise<PokemonCard[]> {
  const { setId, type, name, limit = 50 } = options;

  // Build query parts
  const queryParts: string[] = [];

  if (setId) {
    queryParts.push(`set.id:${setId}`);
  }

  if (type) {
    queryParts.push(`types:${type}`);
  }

  if (name) {
    queryParts.push(`name:"${name}*"`);
  }

  // If no filters provided, return empty array
  if (queryParts.length === 0) {
    return [];
  }

  const query = queryParts.join(' ');
  const encodedQuery = encodeURIComponent(query);

  const response = await fetchFromAPI<APIResponse<PokemonCard[]>>(
    `/cards?q=${encodedQuery}&pageSize=${limit}&orderBy=-set.releaseDate,number`,
    { cache: 'no-store' }
  );

  return response.data;
}

/**
 * Get multiple cards by their IDs
 * Note: Pokemon TCG API supports OR queries with multiple card IDs
 */
export async function getCardsByIds(cardIds: string[]): Promise<PokemonCard[]> {
  if (cardIds.length === 0) return [];

  // API has a limit on query length, so batch in groups of 50
  const batchSize = 50;
  const batches: string[][] = [];

  for (let i = 0; i < cardIds.length; i += batchSize) {
    batches.push(cardIds.slice(i, i + batchSize));
  }

  const results: PokemonCard[] = [];

  for (const batch of batches) {
    // Build OR query: id:sv1-1 OR id:sv1-2 OR ...
    const query = batch.map((id) => `id:${id}`).join(' OR ');
    const encodedQuery = encodeURIComponent(query);

    const response = await fetchFromAPI<APIResponse<PokemonCard[]>>(
      `/cards?q=${encodedQuery}&pageSize=${batchSize}`,
      { cache: 'no-store' }
    );
    results.push(...response.data);
  }

  return results;
}
