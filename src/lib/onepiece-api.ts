/**
 * OPTCG API Client for One Piece Trading Card Game
 * Documentation: https://optcg-api.ryanmichaelhirst.us/docs
 *
 * Rate Limit: Not specified (use conservative 100ms between requests)
 * Authentication: None required (free public API)
 * Supported methods: GET only
 */

const API_BASE = 'https://optcg-api.ryanmichaelhirst.us/api/v1';

// Conservative rate limiting: 10 requests per second = 100ms minimum between requests
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
 * Fetch from OPTCG API with rate limiting
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
      throw new Error('OPTCG API rate limit exceeded. Please wait before making more requests.');
    }
    throw new Error(`OPTCG API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * One Piece card types
 */
export type OnePieceCardType = 'LEADER' | 'CHARACTER' | 'EVENT' | 'STAGE' | 'DON!!';

/**
 * One Piece card rarities
 */
export type OnePieceRarity = 'L' | 'C' | 'UC' | 'R' | 'SR' | 'SEC' | 'SP' | 'P';

/**
 * One Piece card colors
 */
export type OnePieceColor =
  | 'Red'
  | 'Green'
  | 'Blue'
  | 'Purple'
  | 'Black'
  | 'Yellow'
  | 'Red/Green'
  | 'Red/Blue'
  | 'Green/Blue'
  | 'Green/Yellow'
  | 'Blue/Purple'
  | 'Blue/Black'
  | 'Purple/Black'
  | 'Purple/Yellow'
  | 'Black/Yellow';

/**
 * One Piece card attributes (for characters)
 */
export type OnePieceAttribute = 'Slash' | 'Ranged' | 'Strike' | 'Wisdom' | 'Special';

/**
 * One Piece card object from API
 */
export interface OnePieceCard {
  id: string; // Unique identifier (e.g., "card_UgcXLq5r9RGYVPYtjvFhl")
  code: string; // Card code (e.g., "EB01-001", "OP01-001")
  rarity: OnePieceRarity;
  type: OnePieceCardType;
  name: string;
  cost: number | null;
  attribute: OnePieceAttribute | null;
  power: number | null;
  counter: number | null;
  color: OnePieceColor;
  class: string; // Slash-separated classes (e.g., "Straw Hat Crew/Supernovas")
  effect: string | null;
  set: string; // Set name (e.g., "Extra Booster: Memorial Collection")
  image: string; // URL to card image
  _tag: string; // Classification marker (usually "Card")
}

/**
 * API response for card list
 */
export interface OnePieceCardListResponse {
  data: OnePieceCard[];
  total: number;
  current_page: number;
  per_page: number;
  total_pages: number;
}

/**
 * API response for single card
 */
export interface OnePieceCardResponse {
  data: OnePieceCard;
}

/**
 * Set information extracted from cards
 */
export interface OnePieceSet {
  code: string; // Set code prefix (e.g., "OP01", "EB01", "ST01")
  name: string; // Full set name
  cardCount: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Rarity display names and sort order
 */
export const ONEPIECE_RARITIES: Record<OnePieceRarity, { name: string; sortOrder: number }> = {
  L: { name: 'Leader', sortOrder: 1 },
  C: { name: 'Common', sortOrder: 2 },
  UC: { name: 'Uncommon', sortOrder: 3 },
  R: { name: 'Rare', sortOrder: 4 },
  SR: { name: 'Super Rare', sortOrder: 5 },
  SEC: { name: 'Secret Rare', sortOrder: 6 },
  SP: { name: 'Special', sortOrder: 7 },
  P: { name: 'Promo', sortOrder: 8 },
};

/**
 * Color display info
 */
export const ONEPIECE_COLORS: Record<string, { name: string; hex: string }> = {
  Red: { name: 'Red', hex: '#E63946' },
  Green: { name: 'Green', hex: '#2A9D8F' },
  Blue: { name: 'Blue', hex: '#457B9D' },
  Purple: { name: 'Purple', hex: '#7B2CBF' },
  Black: { name: 'Black', hex: '#1D1D1D' },
  Yellow: { name: 'Yellow', hex: '#F4A261' },
};

/**
 * Card type display info
 */
export const ONEPIECE_CARD_TYPES: Record<OnePieceCardType, { name: string; description: string }> =
  {
    LEADER: { name: 'Leader', description: 'Deck leader card that determines deck color' },
    CHARACTER: { name: 'Character', description: 'Crew members that fight for you' },
    EVENT: { name: 'Event', description: 'One-time effect cards' },
    STAGE: { name: 'Stage', description: 'Persistent effect cards' },
    'DON!!': { name: 'DON!!', description: 'Energy cards used to play other cards' },
  };

/**
 * Attribute display info
 */
export const ONEPIECE_ATTRIBUTES: Record<OnePieceAttribute, { name: string; icon: string }> = {
  Slash: { name: 'Slash', icon: '⚔️' },
  Ranged: { name: 'Ranged', icon: '🎯' },
  Strike: { name: 'Strike', icon: '👊' },
  Wisdom: { name: 'Wisdom', icon: '📖' },
  Special: { name: 'Special', icon: '⭐' },
};

// =============================================================================
// FILTER OPTIONS
// =============================================================================

/**
 * Filter options for card search
 */
export interface OnePieceFilterOptions {
  search?: string; // Search term to filter cards by name
  color?: string; // Filter by color (red, blue, green, etc.)
  rarity?: OnePieceRarity; // Filter by rarity (C, UC, R, SR, SEC)
  type?: string; // Filter by type (Character, Event, Stage)
  set?: string; // Filter by set name
  cost?: number; // Filter by cost value
  class?: string; // Filter by class
  counter?: number; // Filter by counter value
  power?: number; // Filter by power value
  page?: number; // Page number (default: 1)
  perPage?: number; // Cards per page (default: 20)
}

/**
 * Build query string from filter options
 */
function buildQueryString(options: OnePieceFilterOptions): string {
  const params = new URLSearchParams();

  if (options.search) params.append('search', options.search);
  if (options.color) params.append('color', options.color);
  if (options.rarity) params.append('rarity', options.rarity);
  if (options.type) params.append('type', options.type);
  if (options.set) params.append('set', options.set);
  if (options.cost !== undefined) params.append('cost', String(options.cost));
  if (options.class) params.append('class', options.class);
  if (options.counter !== undefined) params.append('counter', String(options.counter));
  if (options.power !== undefined) params.append('power', String(options.power));

  // Pagination
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 20;
  params.append('page', String(page));
  params.append('per_page', String(perPage));

  return params.toString();
}

// =============================================================================
// CARD API FUNCTIONS
// =============================================================================

/**
 * Get cards with optional filters
 * Returns paginated results
 */
export async function getCards(
  options: OnePieceFilterOptions = {}
): Promise<OnePieceCardListResponse> {
  const queryString = buildQueryString(options);
  return fetchFromAPI<OnePieceCardListResponse>(`/cards?${queryString}`, {
    next: { revalidate: 86400 }, // Cache for 24 hours
  });
}

/**
 * Get all cards in a set (handles pagination automatically)
 * @param setName - The set name to filter by
 */
export async function getCardsInSet(setName: string): Promise<OnePieceCard[]> {
  const allCards: OnePieceCard[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await getCards({
      set: setName,
      page: currentPage,
      perPage: 100, // Max per page for efficiency
    });

    allCards.push(...response.data);

    if (currentPage >= response.total_pages) {
      hasMore = false;
    } else {
      currentPage++;
    }
  }

  return allCards;
}

/**
 * Get a single card by ID
 */
export async function getCardById(id: string): Promise<OnePieceCard | null> {
  try {
    const response = await fetchFromAPI<OnePieceCardResponse>(`/cards/${id}`, {
      next: { revalidate: 86400 },
    });
    return response.data;
  } catch {
    return null;
  }
}

/**
 * Get cards by their codes (e.g., "OP01-001")
 * Note: API doesn't support bulk lookup, so we search individually
 */
export async function getCardsByCode(codes: string[]): Promise<OnePieceCard[]> {
  if (codes.length === 0) return [];

  const results: OnePieceCard[] = [];

  for (const code of codes) {
    // Extract set prefix from code (e.g., "OP01" from "OP01-001")
    const response = await getCards({ search: code, perPage: 10 });
    const match = response.data.find((card) => card.code === code);
    if (match) {
      results.push(match);
    }
  }

  return results;
}

/**
 * Search cards by name
 */
export async function searchCards(query: string, limit = 20): Promise<OnePieceCard[]> {
  const response = await getCards({
    search: query,
    perPage: limit,
  });
  return response.data;
}

/**
 * Get cards by color
 */
export async function getCardsByColor(color: OnePieceColor): Promise<OnePieceCard[]> {
  const allCards: OnePieceCard[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await getCards({
      color: color,
      page: currentPage,
      perPage: 100,
    });

    allCards.push(...response.data);

    if (currentPage >= response.total_pages) {
      hasMore = false;
    } else {
      currentPage++;
    }
  }

  return allCards;
}

/**
 * Get cards by type
 */
export async function getCardsByType(type: OnePieceCardType): Promise<OnePieceCard[]> {
  const allCards: OnePieceCard[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await getCards({
      type: type,
      page: currentPage,
      perPage: 100,
    });

    allCards.push(...response.data);

    if (currentPage >= response.total_pages) {
      hasMore = false;
    } else {
      currentPage++;
    }
  }

  return allCards;
}

/**
 * Get cards by rarity
 */
export async function getCardsByRarity(rarity: OnePieceRarity): Promise<OnePieceCard[]> {
  const allCards: OnePieceCard[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await getCards({
      rarity: rarity,
      page: currentPage,
      perPage: 100,
    });

    allCards.push(...response.data);

    if (currentPage >= response.total_pages) {
      hasMore = false;
    } else {
      currentPage++;
    }
  }

  return allCards;
}

// =============================================================================
// SET FUNCTIONS
// =============================================================================

/**
 * Get all unique sets from the API
 * Note: API doesn't have a dedicated sets endpoint, so we extract from cards
 */
export async function getAllSets(): Promise<OnePieceSet[]> {
  // Fetch all cards to extract set information
  const allCards: OnePieceCard[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await getCards({
      page: currentPage,
      perPage: 100,
    });

    allCards.push(...response.data);

    if (currentPage >= response.total_pages) {
      hasMore = false;
    } else {
      currentPage++;
    }
  }

  // Group cards by set
  const setMap = new Map<string, { name: string; cardCount: number }>();

  for (const card of allCards) {
    const setCode = extractSetCode(card.code);
    const existing = setMap.get(setCode);

    if (existing) {
      existing.cardCount++;
    } else {
      setMap.set(setCode, {
        name: card.set,
        cardCount: 1,
      });
    }
  }

  // Convert to array and sort
  return Array.from(setMap.entries())
    .map(([code, data]) => ({
      code,
      name: data.name,
      cardCount: data.cardCount,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * Get set by code prefix
 */
export async function getSetByCode(setCode: string): Promise<OnePieceSet | null> {
  const sets = await getAllSets();
  return sets.find((s) => s.code.toLowerCase() === setCode.toLowerCase()) || null;
}

/**
 * Search sets by name
 */
export async function searchSets(query: string): Promise<OnePieceSet[]> {
  const sets = await getAllSets();
  const lowerQuery = query.toLowerCase();
  return sets.filter(
    (s) => s.name.toLowerCase().includes(lowerQuery) || s.code.toLowerCase().includes(lowerQuery)
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract set code from card code
 * e.g., "OP01-001" -> "OP01", "EB01-001" -> "EB01", "ST01-001" -> "ST01"
 */
export function extractSetCode(cardCode: string): string {
  const match = cardCode.match(/^([A-Z]+\d+)/i);
  return match ? match[1].toUpperCase() : cardCode;
}

/**
 * Extract card number from card code
 * e.g., "OP01-001" -> "001"
 */
export function extractCardNumber(cardCode: string): string {
  const parts = cardCode.split('-');
  return parts.length > 1 ? parts[1] : cardCode;
}

/**
 * Check if a card is a Leader card
 */
export function isLeaderCard(card: OnePieceCard): boolean {
  return card.type === 'LEADER';
}

/**
 * Check if a card is a Character card
 */
export function isCharacterCard(card: OnePieceCard): boolean {
  return card.type === 'CHARACTER';
}

/**
 * Check if a card is an Event card
 */
export function isEventCard(card: OnePieceCard): boolean {
  return card.type === 'EVENT';
}

/**
 * Check if a card is a Stage card
 */
export function isStageCard(card: OnePieceCard): boolean {
  return card.type === 'STAGE';
}

/**
 * Check if a card is a DON!! card
 */
export function isDonCard(card: OnePieceCard): boolean {
  return card.type === 'DON!!';
}

/**
 * Check if a card has a counter value
 */
export function hasCounter(card: OnePieceCard): boolean {
  return card.counter !== null && card.counter > 0;
}

/**
 * Check if a card has an effect
 */
export function hasEffect(card: OnePieceCard): boolean {
  return card.effect !== null && card.effect.length > 0;
}

/**
 * Check if a card is multi-color
 */
export function isMultiColor(card: OnePieceCard): boolean {
  return card.color.includes('/');
}

/**
 * Get individual colors from a card's color string
 */
export function getColorComponents(card: OnePieceCard): string[] {
  return card.color.split('/').map((c) => c.trim());
}

/**
 * Get all classes from a card's class string
 */
export function getCardClasses(card: OnePieceCard): string[] {
  if (!card.class) return [];
  return card.class.split('/').map((c) => c.trim());
}

/**
 * Get the primary image URL for a card
 */
export function getCardImage(card: OnePieceCard): string {
  return card.image;
}

/**
 * Get a unique identifier for a card in our system
 * Uses the card code (e.g., "OP01-001")
 */
export function getCardDexId(card: OnePieceCard): string {
  return `optcg-${card.code}`;
}

/**
 * Parse a CardDex ID back to a card code
 */
export function parseCardDexId(dexId: string): string | null {
  if (!dexId.startsWith('optcg-')) return null;
  return dexId.slice(6);
}

/**
 * Get rarity display name
 */
export function getRarityDisplayName(rarity: OnePieceRarity): string {
  return ONEPIECE_RARITIES[rarity]?.name || rarity;
}

/**
 * Get card type display name
 */
export function getTypeDisplayName(type: OnePieceCardType): string {
  return ONEPIECE_CARD_TYPES[type]?.name || type;
}

/**
 * Get attribute display name
 */
export function getAttributeDisplayName(attribute: OnePieceAttribute): string {
  return ONEPIECE_ATTRIBUTES[attribute]?.name || attribute;
}

/**
 * Get color display info
 */
export function getColorInfo(color: string): { name: string; hex: string } | null {
  // Handle multi-color cards
  if (color.includes('/')) {
    const primary = color.split('/')[0];
    return ONEPIECE_COLORS[primary] || null;
  }
  return ONEPIECE_COLORS[color] || null;
}

/**
 * Format power display (handles null)
 */
export function formatPower(power: number | null): string {
  return power !== null ? String(power) : '-';
}

/**
 * Format cost display (handles null)
 */
export function formatCost(cost: number | null): string {
  return cost !== null ? String(cost) : '-';
}

/**
 * Format counter display (handles null)
 */
export function formatCounter(counter: number | null): string {
  return counter !== null ? `+${counter}` : '-';
}

/**
 * Get a summary line for the card (for display)
 * e.g., "CHARACTER | Red | Cost: 3 | Power: 5000 | Counter: +1000"
 */
export function getCardSummary(card: OnePieceCard): string {
  const parts: string[] = [card.type];

  parts.push(card.color);

  if (card.cost !== null) {
    parts.push(`Cost: ${card.cost}`);
  }

  if (card.power !== null) {
    parts.push(`Power: ${card.power}`);
  }

  if (card.counter !== null) {
    parts.push(`Counter: +${card.counter}`);
  }

  return parts.join(' | ');
}

/**
 * Sort cards by set code and card number
 */
export function sortBySetAndNumber(cards: OnePieceCard[]): OnePieceCard[] {
  return [...cards].sort((a, b) => {
    const setCompare = extractSetCode(a.code).localeCompare(extractSetCode(b.code));
    if (setCompare !== 0) return setCompare;
    return extractCardNumber(a.code).localeCompare(extractCardNumber(b.code));
  });
}

/**
 * Sort cards by rarity (highest first)
 */
export function sortByRarity(cards: OnePieceCard[]): OnePieceCard[] {
  return [...cards].sort((a, b) => {
    const aOrder = ONEPIECE_RARITIES[a.rarity]?.sortOrder ?? 99;
    const bOrder = ONEPIECE_RARITIES[b.rarity]?.sortOrder ?? 99;
    return bOrder - aOrder; // Higher rarity first
  });
}

/**
 * Sort cards by power (highest first)
 */
export function sortByPower(cards: OnePieceCard[]): OnePieceCard[] {
  return [...cards].sort((a, b) => {
    const aPower = a.power ?? -1;
    const bPower = b.power ?? -1;
    return bPower - aPower;
  });
}

/**
 * Sort cards by cost (lowest first)
 */
export function sortByCost(cards: OnePieceCard[]): OnePieceCard[] {
  return [...cards].sort((a, b) => {
    const aCost = a.cost ?? 999;
    const bCost = b.cost ?? 999;
    return aCost - bCost;
  });
}

/**
 * Filter cards by color (handles multi-color)
 */
export function filterByColor(cards: OnePieceCard[], color: string): OnePieceCard[] {
  const lowerColor = color.toLowerCase();
  return cards.filter((card) => card.color.toLowerCase().includes(lowerColor));
}

/**
 * Filter cards by class
 */
export function filterByClass(cards: OnePieceCard[], className: string): OnePieceCard[] {
  const lowerClass = className.toLowerCase();
  return cards.filter((card) => card.class?.toLowerCase().includes(lowerClass));
}

/**
 * Get unique classes from a list of cards
 */
export function getUniqueClasses(cards: OnePieceCard[]): string[] {
  const classSet = new Set<string>();
  for (const card of cards) {
    for (const cls of getCardClasses(card)) {
      classSet.add(cls);
    }
  }
  return Array.from(classSet).sort();
}

/**
 * Get unique colors from a list of cards
 */
export function getUniqueColors(cards: OnePieceCard[]): string[] {
  const colorSet = new Set<string>();
  for (const card of cards) {
    // Add individual colors for multi-color cards
    for (const color of getColorComponents(card)) {
      colorSet.add(color);
    }
  }
  return Array.from(colorSet).sort();
}

/**
 * Calculate deck statistics
 */
export function calculateDeckStats(cards: OnePieceCard[]): {
  totalCards: number;
  leaders: number;
  characters: number;
  events: number;
  stages: number;
  avgCost: number;
  avgPower: number;
  colors: string[];
} {
  const leaders = cards.filter((c) => c.type === 'LEADER').length;
  const characters = cards.filter((c) => c.type === 'CHARACTER').length;
  const events = cards.filter((c) => c.type === 'EVENT').length;
  const stages = cards.filter((c) => c.type === 'STAGE').length;

  const costsCards = cards.filter((c) => c.cost !== null);
  const avgCost =
    costsCards.length > 0
      ? costsCards.reduce((sum, c) => sum + (c.cost || 0), 0) / costsCards.length
      : 0;

  const powerCards = cards.filter((c) => c.power !== null);
  const avgPower =
    powerCards.length > 0
      ? powerCards.reduce((sum, c) => sum + (c.power || 0), 0) / powerCards.length
      : 0;

  return {
    totalCards: cards.length,
    leaders,
    characters,
    events,
    stages,
    avgCost: Math.round(avgCost * 10) / 10,
    avgPower: Math.round(avgPower),
    colors: getUniqueColors(cards),
  };
}
