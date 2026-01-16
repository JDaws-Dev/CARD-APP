/**
 * Lorcast API Client for Disney Lorcana Trading Card Game
 * Documentation: https://lorcast.com/docs/api
 *
 * Rate Limit: 10 requests per second (50-100ms delay between requests)
 * Authentication: None required
 * Supported methods: GET only
 */

const API_BASE = 'https://api.lorcast.com/v0';

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
 * Fetch from Lorcast API with rate limiting
 */
async function fetchFromAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  await enforceRateLimit();

  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Lorcast API rate limit exceeded. Please wait before making more requests.');
    }
    throw new Error(`Lorcast API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Lorcana card inks (colors)
 */
export type LorcanaInk = 'Amber' | 'Amethyst' | 'Emerald' | 'Ruby' | 'Sapphire' | 'Steel';

/**
 * Lorcana card rarities
 */
export type LorcanaRarity =
  | 'Common'
  | 'Uncommon'
  | 'Rare'
  | 'Super_rare'
  | 'Legendary'
  | 'Enchanted'
  | 'Promo';

/**
 * Lorcana card types
 */
export type LorcanaCardType = 'Action' | 'Character' | 'Item' | 'Location' | 'Song';

/**
 * Lorcana card layout types
 */
export type LorcanaLayout = 'normal' | 'landscape';

/**
 * Image URIs for a card
 */
export interface LorcanaImageUris {
  small: string;
  normal: string;
  large: string;
}

/**
 * Price data for a card
 */
export interface LorcanaPrices {
  usd: string | null;
  usd_foil: string | null;
}

/**
 * Legality information
 */
export interface LorcanaLegalities {
  core: 'legal' | 'not_legal' | 'banned';
}

/**
 * Set information embedded in card
 */
export interface LorcanaCardSet {
  id: string;
  code: string;
  name: string;
}

/**
 * Lorcana Card object from Lorcast API
 */
export interface LorcanaCard {
  id: string; // Unique identifier
  name: string;
  version: string | null; // Card variant/edition
  layout: LorcanaLayout;
  released_at: string; // YYYY-MM-DD format
  image_uris: LorcanaImageUris;
  cost: number; // Ink cost to play
  inkwell: boolean; // Whether card can be inked
  ink: LorcanaInk | null;
  type: LorcanaCardType[];
  classifications: string[] | null; // Character classifications (Floodborn, Hero, etc.)
  text: string; // Abilities and rules text
  move_cost: number | null; // Character movement cost
  strength: number | null;
  willpower: number | null;
  lore: number | null;
  rarity: LorcanaRarity;
  illustrators: string[];
  collector_number: string;
  lang: string;
  flavor_text: string | null;
  tcgplayer_id: number | null;
  legalities: LorcanaLegalities;
  set: LorcanaCardSet;
  prices: LorcanaPrices;
}

/**
 * Lorcana Set object from Lorcast API
 */
export interface LorcanaSet {
  id: string; // format: set_ + UUID
  name: string;
  code: string;
  released_at: string; // ISO datetime
  prereleased_at: string; // ISO datetime
}

/**
 * API response for card list (search results)
 */
export interface LorcanaCardListResponse {
  results: LorcanaCard[];
}

/**
 * API response for set list
 */
export interface LorcanaSetListResponse {
  results: LorcanaSet[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Ink display names and colors
 */
export const LORCANA_INKS: Record<LorcanaInk, { name: string; hex: string }> = {
  Amber: { name: 'Amber', hex: '#F5A623' },
  Amethyst: { name: 'Amethyst', hex: '#9B59B6' },
  Emerald: { name: 'Emerald', hex: '#27AE60' },
  Ruby: { name: 'Ruby', hex: '#E74C3C' },
  Sapphire: { name: 'Sapphire', hex: '#3498DB' },
  Steel: { name: 'Steel', hex: '#7F8C8D' },
};

/**
 * Rarity display names and sort order
 */
export const LORCANA_RARITIES: Record<LorcanaRarity, { name: string; sortOrder: number }> = {
  Common: { name: 'Common', sortOrder: 1 },
  Uncommon: { name: 'Uncommon', sortOrder: 2 },
  Rare: { name: 'Rare', sortOrder: 3 },
  Super_rare: { name: 'Super Rare', sortOrder: 4 },
  Legendary: { name: 'Legendary', sortOrder: 5 },
  Enchanted: { name: 'Enchanted', sortOrder: 6 },
  Promo: { name: 'Promo', sortOrder: 7 },
};

/**
 * Card type display info
 */
export const LORCANA_CARD_TYPES: Record<LorcanaCardType, { name: string; description: string }> = {
  Action: { name: 'Action', description: 'One-time effect cards' },
  Character: { name: 'Character', description: 'Characters that quest and challenge' },
  Item: { name: 'Item', description: 'Persistent effect cards' },
  Location: { name: 'Location', description: 'Places that provide benefits' },
  Song: { name: 'Song', description: 'Actions that can be sung by characters' },
};

// =============================================================================
// FILTER OPTIONS
// =============================================================================

/**
 * Filter options for card search
 * Uses Lorcast search syntax: https://lorcast.com/docs/api/cards
 */
export interface LorcanaFilterOptions {
  name?: string; // Card name search
  ink?: LorcanaInk; // Filter by ink color
  rarity?: LorcanaRarity; // Filter by rarity
  type?: LorcanaCardType; // Filter by card type
  set?: string; // Filter by set code
  cost?: number; // Filter by ink cost
  costOperator?: '<' | '<=' | '=' | '>=' | '>'; // Cost comparison operator
  strength?: number; // Filter by strength
  willpower?: number; // Filter by willpower
  lore?: number; // Filter by lore value
  inkwell?: boolean; // Filter by inkwell status
  classification?: string; // Filter by classification
  text?: string; // Search in card text
  unique?: 'cards' | 'prints'; // Duplicate handling
}

/**
 * Build Lorcast search query string from filter options
 * Lorcast uses a Scryfall-like search syntax
 */
function buildSearchQuery(options: LorcanaFilterOptions): string {
  const queryParts: string[] = [];

  if (options.name) {
    queryParts.push(`name:${options.name}`);
  }

  if (options.ink) {
    queryParts.push(`ink:${options.ink.toLowerCase()}`);
  }

  if (options.rarity) {
    const rarityValue = options.rarity.toLowerCase().replace('_', '');
    queryParts.push(`rarity:${rarityValue}`);
  }

  if (options.type) {
    queryParts.push(`type:${options.type.toLowerCase()}`);
  }

  if (options.set) {
    queryParts.push(`set:${options.set}`);
  }

  if (options.cost !== undefined) {
    const operator = options.costOperator || '=';
    queryParts.push(`cost${operator}${options.cost}`);
  }

  if (options.strength !== undefined) {
    queryParts.push(`strength=${options.strength}`);
  }

  if (options.willpower !== undefined) {
    queryParts.push(`willpower=${options.willpower}`);
  }

  if (options.lore !== undefined) {
    queryParts.push(`lore=${options.lore}`);
  }

  if (options.inkwell !== undefined) {
    queryParts.push(`inkwell:${options.inkwell}`);
  }

  if (options.classification) {
    queryParts.push(`classification:${options.classification}`);
  }

  if (options.text) {
    queryParts.push(`text:${options.text}`);
  }

  return queryParts.join(' ');
}

// =============================================================================
// SET API FUNCTIONS
// =============================================================================

/**
 * Get all Lorcana sets
 * Returns sets sorted by release date (API default)
 */
export async function getAllSets(): Promise<LorcanaSet[]> {
  const response = await fetchFromAPI<LorcanaSetListResponse>('/sets', {
    next: { revalidate: 86400 }, // Cache for 24 hours
  });
  return response.results;
}

/**
 * Get a single set by code (e.g., "1", "D100")
 */
export async function getSetByCode(code: string): Promise<LorcanaSet> {
  return fetchFromAPI<LorcanaSet>(`/sets/${code}`, {
    next: { revalidate: 86400 },
  });
}

/**
 * Get a single set by ID (e.g., "set_7ecb0e0c71af496a9e0110e23824e0a5")
 */
export async function getSetById(id: string): Promise<LorcanaSet> {
  return fetchFromAPI<LorcanaSet>(`/sets/${id}`, {
    next: { revalidate: 86400 },
  });
}

/**
 * Search sets by name
 */
export async function searchSets(query: string): Promise<LorcanaSet[]> {
  const sets = await getAllSets();
  const lowerQuery = query.toLowerCase();
  return sets.filter(
    (s) => s.name.toLowerCase().includes(lowerQuery) || s.code.toLowerCase().includes(lowerQuery)
  );
}

// =============================================================================
// CARD API FUNCTIONS
// =============================================================================

/**
 * Get all cards in a set
 * @param setCodeOrId - The set code or ID
 */
export async function getCardsInSet(setCodeOrId: string): Promise<LorcanaCard[]> {
  const response = await fetchFromAPI<LorcanaCardListResponse>(`/sets/${setCodeOrId}/cards`, {
    next: { revalidate: 86400 },
  });
  return response.results;
}

/**
 * Get a single card by set code and collector number
 * @param setCode - The set code (e.g., "1", "D100")
 * @param collectorNumber - The collector number
 */
export async function getCardBySetAndNumber(
  setCode: string,
  collectorNumber: string
): Promise<LorcanaCard> {
  return fetchFromAPI<LorcanaCard>(`/cards/${setCode}/${collectorNumber}`, {
    next: { revalidate: 86400 },
  });
}

/**
 * Search cards using Lorcast search syntax
 * Note: Currently not paginated (API limitation)
 */
export async function searchCards(
  query: string,
  options: { unique?: 'cards' | 'prints' } = {}
): Promise<LorcanaCard[]> {
  const params = new URLSearchParams();
  params.append('q', query);
  if (options.unique) {
    params.append('unique', options.unique);
  }

  const response = await fetchFromAPI<LorcanaCardListResponse>(
    `/cards/search?${params.toString()}`,
    { cache: 'no-store' }
  );
  return response.results;
}

/**
 * Filter cards with multiple criteria
 */
export async function filterCards(options: LorcanaFilterOptions): Promise<LorcanaCard[]> {
  const query = buildSearchQuery(options);

  if (!query) {
    return [];
  }

  return searchCards(query, { unique: options.unique });
}

/**
 * Search cards by name
 */
export async function searchCardsByName(name: string, limit = 20): Promise<LorcanaCard[]> {
  const results = await searchCards(`name:${name}`);
  return results.slice(0, limit);
}

/**
 * Get cards by ink color
 */
export async function getCardsByInk(ink: LorcanaInk): Promise<LorcanaCard[]> {
  return searchCards(`ink:${ink.toLowerCase()}`);
}

/**
 * Get cards by type
 */
export async function getCardsByType(type: LorcanaCardType): Promise<LorcanaCard[]> {
  return searchCards(`type:${type.toLowerCase()}`);
}

/**
 * Get cards by rarity
 */
export async function getCardsByRarity(rarity: LorcanaRarity): Promise<LorcanaCard[]> {
  const rarityValue = rarity.toLowerCase().replace('_', '');
  return searchCards(`rarity:${rarityValue}`);
}

/**
 * Get cards by classification
 */
export async function getCardsByClassification(classification: string): Promise<LorcanaCard[]> {
  return searchCards(`classification:${classification}`);
}

/**
 * Get song cards
 */
export async function getSongCards(): Promise<LorcanaCard[]> {
  return searchCards('type:song');
}

/**
 * Get location cards
 */
export async function getLocationCards(): Promise<LorcanaCard[]> {
  return searchCards('type:location');
}

/**
 * Get cards that can be inked
 */
export async function getInkableCards(): Promise<LorcanaCard[]> {
  return searchCards('inkwell:true');
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a unique identifier for a card in our system
 * Format: "lorcana-{set_code}-{collector_number}" (e.g., "lorcana-1-42")
 */
export function getCardDexId(card: LorcanaCard): string {
  return `lorcana-${card.set.code}-${card.collector_number}`;
}

/**
 * Parse a CardDex ID back to set code and collector number
 */
export function parseCardDexId(dexId: string): { setCode: string; collectorNumber: string } | null {
  if (!dexId.startsWith('lorcana-')) return null;
  const parts = dexId.slice(8).split('-');
  if (parts.length < 2) return null;
  return {
    setCode: parts[0],
    collectorNumber: parts.slice(1).join('-'),
  };
}

/**
 * Get the primary image URL for a card
 */
export function getCardImage(card: LorcanaCard, size: keyof LorcanaImageUris = 'normal'): string {
  return card.image_uris[size];
}

/**
 * Check if a card is a character
 */
export function isCharacterCard(card: LorcanaCard): boolean {
  return card.type.includes('Character');
}

/**
 * Check if a card is an action
 */
export function isActionCard(card: LorcanaCard): boolean {
  return card.type.includes('Action');
}

/**
 * Check if a card is a song
 */
export function isSongCard(card: LorcanaCard): boolean {
  return card.type.includes('Song');
}

/**
 * Check if a card is an item
 */
export function isItemCard(card: LorcanaCard): boolean {
  return card.type.includes('Item');
}

/**
 * Check if a card is a location
 */
export function isLocationCard(card: LorcanaCard): boolean {
  return card.type.includes('Location');
}

/**
 * Check if a card has landscape layout (locations)
 */
export function isLandscapeCard(card: LorcanaCard): boolean {
  return card.layout === 'landscape';
}

/**
 * Check if a card is inkable
 */
export function isInkable(card: LorcanaCard): boolean {
  return card.inkwell;
}

/**
 * Check if a card is a Floodborn character
 */
export function isFloodborn(card: LorcanaCard): boolean {
  return card.classifications?.includes('Floodborn') ?? false;
}

/**
 * Check if a card has Shift ability (Floodborn cards)
 */
export function hasShift(card: LorcanaCard): boolean {
  return card.text.toLowerCase().includes('shift');
}

/**
 * Check if a card has Singer ability
 */
export function hasSinger(card: LorcanaCard): boolean {
  return card.text.toLowerCase().includes('singer');
}

/**
 * Check if a card is legal in core format
 */
export function isCoreLegal(card: LorcanaCard): boolean {
  return card.legalities.core === 'legal';
}

/**
 * Get rarity display name
 */
export function getRarityDisplayName(rarity: LorcanaRarity): string {
  return LORCANA_RARITIES[rarity]?.name || rarity;
}

/**
 * Get card type display name
 */
export function getTypeDisplayName(type: LorcanaCardType): string {
  return LORCANA_CARD_TYPES[type]?.name || type;
}

/**
 * Get ink display info
 */
export function getInkInfo(ink: LorcanaInk): { name: string; hex: string } {
  return LORCANA_INKS[ink];
}

/**
 * Parse the market price from a card's price data
 * Returns USD price as a number, or null if unavailable
 */
export function getMarketPrice(card: LorcanaCard, foil = false): number | null {
  const priceString = foil ? card.prices.usd_foil : card.prices.usd;
  if (!priceString) return null;
  const price = parseFloat(priceString);
  return isNaN(price) ? null : price;
}

/**
 * Format cost display
 */
export function formatCost(cost: number): string {
  return String(cost);
}

/**
 * Format strength display (handles null)
 */
export function formatStrength(strength: number | null): string {
  return strength !== null ? String(strength) : '-';
}

/**
 * Format willpower display (handles null)
 */
export function formatWillpower(willpower: number | null): string {
  return willpower !== null ? String(willpower) : '-';
}

/**
 * Format lore display (handles null)
 */
export function formatLore(lore: number | null): string {
  return lore !== null ? `◆${lore}` : '-';
}

/**
 * Get a summary line for the card (for display)
 * e.g., "Character | Amber | Cost: 3 | 2/3 | ◆2"
 */
export function getCardSummary(card: LorcanaCard): string {
  const parts: string[] = [card.type.join('/') || 'Card'];

  if (card.ink) {
    parts.push(card.ink);
  }

  parts.push(`Cost: ${card.cost}`);

  if (card.strength !== null || card.willpower !== null) {
    parts.push(`${formatStrength(card.strength)}/${formatWillpower(card.willpower)}`);
  }

  if (card.lore !== null) {
    parts.push(formatLore(card.lore));
  }

  return parts.join(' | ');
}

/**
 * Get card's full name with version
 * e.g., "Elsa - Snow Queen" or "Mickey Mouse - Brave Little Tailor"
 */
export function getFullCardName(card: LorcanaCard): string {
  if (card.version) {
    return `${card.name} - ${card.version}`;
  }
  return card.name;
}

/**
 * Sort cards by set code and collector number
 */
export function sortBySetAndNumber(cards: LorcanaCard[]): LorcanaCard[] {
  return [...cards].sort((a, b) => {
    const setCompare = a.set.code.localeCompare(b.set.code);
    if (setCompare !== 0) return setCompare;

    // Parse collector numbers as integers for proper numeric sorting
    const aNum = parseInt(a.collector_number, 10) || 0;
    const bNum = parseInt(b.collector_number, 10) || 0;
    return aNum - bNum;
  });
}

/**
 * Sort cards by rarity (highest first)
 */
export function sortByRarity(cards: LorcanaCard[]): LorcanaCard[] {
  return [...cards].sort((a, b) => {
    const aOrder = LORCANA_RARITIES[a.rarity]?.sortOrder ?? 99;
    const bOrder = LORCANA_RARITIES[b.rarity]?.sortOrder ?? 99;
    return bOrder - aOrder; // Higher rarity first
  });
}

/**
 * Sort cards by cost (lowest first)
 */
export function sortByCost(cards: LorcanaCard[]): LorcanaCard[] {
  return [...cards].sort((a, b) => a.cost - b.cost);
}

/**
 * Sort cards by strength (highest first)
 */
export function sortByStrength(cards: LorcanaCard[]): LorcanaCard[] {
  return [...cards].sort((a, b) => {
    const aStr = a.strength ?? -1;
    const bStr = b.strength ?? -1;
    return bStr - aStr;
  });
}

/**
 * Sort cards by lore value (highest first)
 */
export function sortByLore(cards: LorcanaCard[]): LorcanaCard[] {
  return [...cards].sort((a, b) => {
    const aLore = a.lore ?? -1;
    const bLore = b.lore ?? -1;
    return bLore - aLore;
  });
}

/**
 * Filter cards by ink (color)
 */
export function filterByInk(cards: LorcanaCard[], ink: LorcanaInk): LorcanaCard[] {
  return cards.filter((card) => card.ink === ink);
}

/**
 * Filter cards by classification
 */
export function filterByClassification(
  cards: LorcanaCard[],
  classification: string
): LorcanaCard[] {
  const lowerClass = classification.toLowerCase();
  return cards.filter((card) =>
    card.classifications?.some((c) => c.toLowerCase().includes(lowerClass))
  );
}

/**
 * Get unique inks from a list of cards
 */
export function getUniqueInks(cards: LorcanaCard[]): LorcanaInk[] {
  const inkSet = new Set<LorcanaInk>();
  for (const card of cards) {
    if (card.ink) {
      inkSet.add(card.ink);
    }
  }
  return Array.from(inkSet).sort();
}

/**
 * Get unique classifications from a list of cards
 */
export function getUniqueClassifications(cards: LorcanaCard[]): string[] {
  const classSet = new Set<string>();
  for (const card of cards) {
    if (card.classifications) {
      for (const c of card.classifications) {
        classSet.add(c);
      }
    }
  }
  return Array.from(classSet).sort();
}

/**
 * Calculate deck statistics
 */
export function calculateDeckStats(cards: LorcanaCard[]): {
  totalCards: number;
  characters: number;
  actions: number;
  songs: number;
  items: number;
  locations: number;
  avgCost: number;
  inkableCount: number;
  inks: LorcanaInk[];
} {
  const characters = cards.filter((c) => c.type.includes('Character')).length;
  const actions = cards.filter((c) => c.type.includes('Action')).length;
  const songs = cards.filter((c) => c.type.includes('Song')).length;
  const items = cards.filter((c) => c.type.includes('Item')).length;
  const locations = cards.filter((c) => c.type.includes('Location')).length;

  const totalCost = cards.reduce((sum, c) => sum + c.cost, 0);
  const avgCost = cards.length > 0 ? totalCost / cards.length : 0;

  const inkableCount = cards.filter((c) => c.inkwell).length;

  return {
    totalCards: cards.length,
    characters,
    actions,
    songs,
    items,
    locations,
    avgCost: Math.round(avgCost * 10) / 10,
    inkableCount,
    inks: getUniqueInks(cards),
  };
}
