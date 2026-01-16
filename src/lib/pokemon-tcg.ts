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
}

interface APIResponse<T> {
  data: T;
  page?: number;
  pageSize?: number;
  count?: number;
  totalCount?: number;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Get all Scarlet & Violet era sets
 */
export async function getScarletVioletSets(): Promise<PokemonSet[]> {
  // URL encode the query to handle special characters like &
  const query = encodeURIComponent('series:"Scarlet & Violet"');
  const response = await fetchFromAPI<APIResponse<PokemonSet[]>>(
    `/sets?q=${query}&orderBy=-releaseDate`,
    { next: { revalidate: 86400 } } // Cache for 24 hours
  );
  return response.data;
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
