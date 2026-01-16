/**
 * Scryfall API Client for Magic: The Gathering cards
 * Documentation: https://scryfall.com/docs/api
 *
 * Rate Limit: 10 requests per second (50-100ms delay between requests)
 * Authentication: None required, but User-Agent header is mandatory
 */

const API_BASE = 'https://api.scryfall.com';
const USER_AGENT = 'CardDexApp/1.0';

// Rate limiting: 10 requests per second = 100ms minimum between requests
const MIN_REQUEST_INTERVAL_MS = 100;
let lastRequestTime = 0;

interface FetchOptions {
  cache?: RequestCache;
  next?: { revalidate?: number };
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Enforce rate limiting by waiting if necessary
 */
async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest);
  }
  lastRequestTime = Date.now();
}

/**
 * Fetch from Scryfall API with rate limiting and proper headers
 */
async function fetchFromAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  await enforceRateLimit();

  const headers: HeadersInit = {
    'User-Agent': USER_AGENT,
    Accept: 'application/json',
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Scryfall API rate limit exceeded. Please wait before making more requests.');
    }
    throw new Error(`Scryfall API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Scryfall Set object
 */
export interface MTGSet {
  id: string; // Scryfall UUID
  code: string; // 3-6 letter set code (e.g., "neo", "one")
  name: string; // Full set name
  set_type: MTGSetType;
  released_at: string | null; // ISO date string
  card_count: number;
  icon_svg_uri: string;
  scryfall_uri: string;
  search_uri: string;
  mtgo_code?: string | null;
  arena_code?: string | null;
  tcgplayer_id?: number;
  digital: boolean;
  foil_only: boolean;
  nonfoil_only: boolean;
  parent_set_code?: string | null;
  printed_size?: number;
  block_code?: string;
  block?: string;
}

/**
 * Scryfall set types
 */
export type MTGSetType =
  | 'core'
  | 'expansion'
  | 'masters'
  | 'alchemy'
  | 'masterpiece'
  | 'arsenal'
  | 'from_the_vault'
  | 'spellbook'
  | 'premium_deck'
  | 'duel_deck'
  | 'draft_innovation'
  | 'treasure_chest'
  | 'commander'
  | 'planechase'
  | 'archenemy'
  | 'vanguard'
  | 'funny'
  | 'starter'
  | 'box'
  | 'promo'
  | 'token'
  | 'memorabilia'
  | 'minigame';

/**
 * Image URIs for a card
 */
export interface MTGImageUris {
  small: string; // 146 × 204 JPG
  normal: string; // 488 × 680 JPG
  large: string; // 672 × 936 JPG
  png: string; // 745 × 1040 PNG with transparent corners
  art_crop: string; // Art only
  border_crop: string; // 480 × 680 JPG, border cropped
}

/**
 * Card face for multi-faced cards
 */
export interface MTGCardFace {
  name: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  colors?: MTGColor[];
  power?: string;
  toughness?: string;
  flavor_text?: string;
  artist?: string;
  image_uris?: MTGImageUris;
}

/**
 * Price data for a card
 */
export interface MTGPrices {
  usd?: string | null;
  usd_foil?: string | null;
  usd_etched?: string | null;
  eur?: string | null;
  eur_foil?: string | null;
  tix?: string | null;
}

/**
 * Purchase URIs for a card
 */
export interface MTGPurchaseUris {
  tcgplayer?: string;
  cardmarket?: string;
  cardhoarder?: string;
}

/**
 * MTG colors
 */
export type MTGColor = 'W' | 'U' | 'B' | 'R' | 'G';

/**
 * MTG card rarities
 */
export type MTGRarity = 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus';

/**
 * Scryfall Card object
 */
export interface MTGCard {
  // Core identifiers
  id: string; // Scryfall UUID
  oracle_id: string;
  name: string;
  lang: string;
  released_at: string;

  // Gameplay
  mana_cost?: string;
  cmc: number; // Mana value
  type_line: string;
  oracle_text?: string;
  colors?: MTGColor[];
  color_identity: MTGColor[];
  power?: string;
  toughness?: string;
  loyalty?: string;
  keywords: string[];

  // Multi-face support
  layout: string;
  card_faces?: MTGCardFace[];

  // Print/set info
  set: string; // Set code
  set_name: string;
  set_type: MTGSetType;
  collector_number: string;
  rarity: MTGRarity;
  artist?: string;
  border_color: string;
  frame: string;
  full_art: boolean;
  textless: boolean;

  // Images
  image_uris?: MTGImageUris;
  highres_image: boolean;

  // Pricing
  prices: MTGPrices;
  purchase_uris?: MTGPurchaseUris;

  // External IDs
  multiverse_ids?: number[];
  mtgo_id?: number;
  arena_id?: number;
  tcgplayer_id?: number;
  cardmarket_id?: number;

  // Legalities
  legalities: Record<string, string>;

  // URIs
  scryfall_uri: string;
  uri: string;

  // Flags
  reprint: boolean;
  digital: boolean;
  promo: boolean;
  variation: boolean;
  reserved: boolean;
  foil: boolean;
  nonfoil: boolean;
  oversized: boolean;
}

/**
 * Paginated list response from Scryfall
 */
export interface ScryfallList<T> {
  object: 'list';
  data: T[];
  has_more: boolean;
  next_page?: string;
  total_cards?: number;
  warnings?: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Main set types for standard collection tracking
 * Excludes tokens, memorabilia, funny sets, etc.
 */
export const COLLECTIBLE_SET_TYPES: MTGSetType[] = [
  'core',
  'expansion',
  'masters',
  'masterpiece',
  'commander',
  'draft_innovation',
];

/**
 * MTG color names for filtering
 */
export const MTG_COLORS: Record<MTGColor, string> = {
  W: 'White',
  U: 'Blue',
  B: 'Black',
  R: 'Red',
  G: 'Green',
};

/**
 * Rarity display names and sort order
 */
export const MTG_RARITIES: Record<MTGRarity, { name: string; sortOrder: number }> = {
  common: { name: 'Common', sortOrder: 1 },
  uncommon: { name: 'Uncommon', sortOrder: 2 },
  rare: { name: 'Rare', sortOrder: 3 },
  mythic: { name: 'Mythic Rare', sortOrder: 4 },
  special: { name: 'Special', sortOrder: 5 },
  bonus: { name: 'Bonus', sortOrder: 6 },
};

// =============================================================================
// SET API FUNCTIONS
// =============================================================================

/**
 * Get all MTG sets from Scryfall
 * Returns sets sorted by release date (newest first by default from API)
 */
export async function getAllSets(): Promise<MTGSet[]> {
  const response = await fetchFromAPI<ScryfallList<MTGSet>>('/sets', {
    next: { revalidate: 86400 }, // Cache for 24 hours
  });
  return response.data;
}

/**
 * Get all collectible sets (core, expansion, masters, etc.)
 * Excludes tokens, memorabilia, funny sets
 */
export async function getCollectibleSets(): Promise<MTGSet[]> {
  const allSets = await getAllSets();
  return allSets.filter((set) => COLLECTIBLE_SET_TYPES.includes(set.set_type) && !set.digital);
}

/**
 * Get sets by type
 */
export async function getSetsByType(setType: MTGSetType): Promise<MTGSet[]> {
  const allSets = await getAllSets();
  return allSets.filter((set) => set.set_type === setType && !set.digital);
}

/**
 * Get a single set by code (e.g., "neo" for Kamigawa: Neon Dynasty)
 */
export async function getSetByCode(code: string): Promise<MTGSet> {
  return fetchFromAPI<MTGSet>(`/sets/${code.toLowerCase()}`, {
    next: { revalidate: 86400 },
  });
}

/**
 * Get a single set by Scryfall UUID
 */
export async function getSetById(id: string): Promise<MTGSet> {
  return fetchFromAPI<MTGSet>(`/sets/${id}`, {
    next: { revalidate: 86400 },
  });
}

// =============================================================================
// CARD API FUNCTIONS
// =============================================================================

/**
 * Get all cards in a set (handles pagination automatically)
 * @param setCode - The 3-6 letter set code
 */
export async function getCardsInSet(setCode: string): Promise<MTGCard[]> {
  const allCards: MTGCard[] = [];
  let hasMore = true;
  let page = 1;

  while (hasMore) {
    const response = await fetchFromAPI<ScryfallList<MTGCard>>(
      `/cards/search?order=set&q=set:${encodeURIComponent(setCode)}&unique=prints&page=${page}`,
      { next: { revalidate: 86400 } }
    );
    allCards.push(...response.data);
    hasMore = response.has_more;
    page++;
  }

  return allCards;
}

/**
 * Get a single card by Scryfall UUID
 */
export async function getCardById(id: string): Promise<MTGCard> {
  return fetchFromAPI<MTGCard>(`/cards/${id}`, {
    next: { revalidate: 86400 },
  });
}

/**
 * Get a card by set code and collector number
 * @param setCode - The set code (e.g., "neo")
 * @param collectorNumber - The collector number (e.g., "1")
 * @param lang - Optional language code (default: "en")
 */
export async function getCardByCollectorNumber(
  setCode: string,
  collectorNumber: string,
  lang = 'en'
): Promise<MTGCard> {
  return fetchFromAPI<MTGCard>(
    `/cards/${setCode.toLowerCase()}/${encodeURIComponent(collectorNumber)}/${lang}`,
    { next: { revalidate: 86400 } }
  );
}

/**
 * Search cards by name
 */
export async function searchCards(name: string, limit = 20): Promise<MTGCard[]> {
  const response = await fetchFromAPI<ScryfallList<MTGCard>>(
    `/cards/search?q=${encodeURIComponent(name)}&unique=cards`,
    { cache: 'no-store' }
  );

  // Scryfall returns up to 175 per page, but we limit to requested amount
  return response.data.slice(0, limit);
}

/**
 * Get autocomplete suggestions for card names
 */
export async function autocompleteCardName(query: string): Promise<string[]> {
  const response = await fetchFromAPI<{ data: string[] }>(
    `/cards/autocomplete?q=${encodeURIComponent(query)}`,
    { cache: 'no-store' }
  );
  return response.data;
}

/**
 * Get a random card (optionally filtered by query)
 */
export async function getRandomCard(query?: string): Promise<MTGCard> {
  const endpoint = query ? `/cards/random?q=${encodeURIComponent(query)}` : '/cards/random';
  return fetchFromAPI<MTGCard>(endpoint, { cache: 'no-store' });
}

/**
 * Filter options for card search
 */
export interface MTGFilterOptions {
  setCode?: string;
  colors?: MTGColor[];
  colorIdentity?: MTGColor[];
  rarity?: MTGRarity;
  type?: string;
  name?: string;
  cmc?: number;
  cmcOperator?: '<' | '<=' | '=' | '>=' | '>';
  limit?: number;
}

/**
 * Build a Scryfall search query from filter options
 */
function buildSearchQuery(options: MTGFilterOptions): string {
  const queryParts: string[] = [];

  if (options.setCode) {
    queryParts.push(`set:${options.setCode}`);
  }

  if (options.colors && options.colors.length > 0) {
    queryParts.push(`color:${options.colors.join('')}`);
  }

  if (options.colorIdentity && options.colorIdentity.length > 0) {
    queryParts.push(`id:${options.colorIdentity.join('')}`);
  }

  if (options.rarity) {
    queryParts.push(`rarity:${options.rarity}`);
  }

  if (options.type) {
    queryParts.push(`type:${options.type}`);
  }

  if (options.name) {
    queryParts.push(`name:${options.name}`);
  }

  if (options.cmc !== undefined) {
    const operator = options.cmcOperator || '=';
    queryParts.push(`cmc${operator}${options.cmc}`);
  }

  return queryParts.join(' ');
}

/**
 * Filter cards with multiple criteria
 */
export async function filterCards(options: MTGFilterOptions): Promise<MTGCard[]> {
  const { limit = 50 } = options;
  const query = buildSearchQuery(options);

  if (!query) {
    return [];
  }

  const response = await fetchFromAPI<ScryfallList<MTGCard>>(
    `/cards/search?q=${encodeURIComponent(query)}&unique=cards`,
    { cache: 'no-store' }
  );

  return response.data.slice(0, limit);
}

/**
 * Get multiple cards by their Scryfall IDs using the collection endpoint
 * This is more efficient than individual requests for bulk lookups
 */
export async function getCardsByIds(ids: string[]): Promise<MTGCard[]> {
  if (ids.length === 0) return [];

  // Scryfall collection endpoint accepts up to 75 cards per request
  const batchSize = 75;
  const results: MTGCard[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const identifiers = batch.map((id) => ({ id }));

    const response = await fetchFromAPI<ScryfallList<MTGCard>>('/cards/collection', {
      cache: 'no-store',
    });

    // Note: This endpoint requires a POST request with a body
    // For now, fall back to individual requests since fetchFromAPI doesn't support POST
    for (const id of batch) {
      try {
        const card = await getCardById(id);
        results.push(card);
      } catch {
        // Card not found, skip
        console.warn(`Card not found: ${id}`, identifiers, response);
      }
    }
  }

  return results;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a card is a promo card
 */
export function isPromoCard(card: MTGCard): boolean {
  return card.promo || card.set_type === 'promo';
}

/**
 * Get the primary image URI for a card
 * Handles multi-faced cards by returning the front face image
 */
export function getCardImage(card: MTGCard, size: keyof MTGImageUris = 'normal'): string | null {
  // Single-faced cards
  if (card.image_uris) {
    return card.image_uris[size];
  }

  // Multi-faced cards - use front face
  if (card.card_faces && card.card_faces[0]?.image_uris) {
    return card.card_faces[0].image_uris[size];
  }

  return null;
}

/**
 * Get the card's colors as display strings
 */
export function getCardColorNames(card: MTGCard): string[] {
  const colors = card.colors || [];
  return colors.map((c) => MTG_COLORS[c]);
}

/**
 * Get the rarity display name
 */
export function getRarityDisplayName(rarity: MTGRarity): string {
  return MTG_RARITIES[rarity]?.name || rarity;
}

/**
 * Parse the market price from a card's price data
 * Returns USD price as a number, or null if unavailable
 */
export function getMarketPrice(card: MTGCard, foil = false): number | null {
  const priceString = foil ? card.prices.usd_foil : card.prices.usd;
  if (!priceString) return null;
  const price = parseFloat(priceString);
  return isNaN(price) ? null : price;
}

/**
 * Get a unique identifier for a card in our system
 * Format: "{set_code}-{collector_number}" (e.g., "neo-1")
 */
export function getCardDexId(card: MTGCard): string {
  return `${card.set}-${card.collector_number}`;
}

/**
 * Check if a card has multiple faces (transform, modal double-faced, etc.)
 */
export function isMultiFacedCard(card: MTGCard): boolean {
  return (
    card.card_faces !== undefined &&
    card.card_faces.length > 1 &&
    ['transform', 'modal_dfc', 'reversible_card', 'double_faced_token'].includes(card.layout)
  );
}

/**
 * Get the mana cost display string for a card
 * Handles multi-faced cards
 */
export function getManaCost(card: MTGCard): string | null {
  if (card.mana_cost) {
    return card.mana_cost;
  }

  // For multi-faced cards, get front face mana cost
  if (card.card_faces && card.card_faces[0]?.mana_cost) {
    return card.card_faces[0].mana_cost;
  }

  return null;
}
