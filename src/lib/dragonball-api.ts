/**
 * ApiTCG Client for Dragon Ball Fusion World cards
 * Documentation: https://docs.apitcg.com
 *
 * Rate Limit: Not specified (use conservative 100ms between requests)
 * Authentication: API key required via x-api-key header
 * API Key: Optional - Sign up at https://apitcg.com/platform
 */

const API_BASE = 'https://apitcg.com/api/dragon-ball-fusion';
const API_KEY = process.env.DRAGONBALL_API_KEY;

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
 * Fetch from ApiTCG API with rate limiting
 */
async function fetchFromAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  await enforceRateLimit();

  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('ApiTCG rate limit exceeded. Please wait before making more requests.');
    }
    if (response.status === 401) {
      throw new Error(
        'ApiTCG authentication failed. Please check your API key at https://apitcg.com/platform'
      );
    }
    throw new Error(`ApiTCG API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Dragon Ball Fusion World card colors
 */
export type DragonBallColor = 'Red' | 'Blue' | 'Green' | 'Yellow' | 'Black' | 'Multi';

/**
 * Dragon Ball Fusion World card types
 */
export type DragonBallCardType = 'Leader' | 'Battle' | 'Extra' | 'Unison';

/**
 * Dragon Ball Fusion World rarities
 */
export type DragonBallRarity = 'C' | 'UC' | 'R' | 'SR' | 'SCR' | 'SPR' | 'PR';

/**
 * Card images from API
 */
export interface DragonBallCardImages {
  small: string;
  large: string;
}

/**
 * Set information for a card
 */
export interface DragonBallSetInfo {
  name: string;
}

/**
 * Dragon Ball Fusion World card from API
 */
export interface DragonBallCard {
  id: string; // Unique ID in API database
  code: string; // Card code (e.g., "FB01-001")
  rarity: DragonBallRarity;
  name: string;
  color: DragonBallColor;
  cardType: DragonBallCardType;
  cost: number | null; // Energy cost
  specifiedCost: string | null; // Specific cost requirements (e.g., "1 Red")
  power: number | null; // Battle power
  comboPower: number | null; // Combo power value
  features: string[]; // Card traits/features
  effect: string | null; // Card effect text
  images: DragonBallCardImages;
  set: DragonBallSetInfo;
  getIt: string | null; // How to obtain the card
}

/**
 * Paginated API response
 */
export interface DragonBallCardListResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: DragonBallCard[];
}

/**
 * Single card API response
 */
export interface DragonBallCardResponse {
  data: DragonBallCard;
}

/**
 * Set information extracted from cards
 */
export interface DragonBallSet {
  name: string;
  code: string;
  cardCount: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Rarity display names and sort order
 */
export const DRAGONBALL_RARITIES: Record<DragonBallRarity, { name: string; sortOrder: number }> = {
  C: { name: 'Common', sortOrder: 1 },
  UC: { name: 'Uncommon', sortOrder: 2 },
  R: { name: 'Rare', sortOrder: 3 },
  SR: { name: 'Super Rare', sortOrder: 4 },
  SCR: { name: 'Secret Rare', sortOrder: 5 },
  SPR: { name: 'Special Rare', sortOrder: 6 },
  PR: { name: 'Promo', sortOrder: 7 },
};

/**
 * Color display info with hex codes
 */
export const DRAGONBALL_COLORS: Record<DragonBallColor, { name: string; hex: string }> = {
  Red: { name: 'Red', hex: '#E53935' },
  Blue: { name: 'Blue', hex: '#1E88E5' },
  Green: { name: 'Green', hex: '#43A047' },
  Yellow: { name: 'Yellow', hex: '#FDD835' },
  Black: { name: 'Black', hex: '#212121' },
  Multi: { name: 'Multi', hex: '#9E9E9E' },
};

/**
 * Card type display info
 */
export const DRAGONBALL_CARD_TYPES: Record<
  DragonBallCardType,
  { name: string; description: string }
> = {
  Leader: { name: 'Leader', description: 'Your main fighter that starts in play' },
  Battle: { name: 'Battle', description: 'Cards you play to attack and defend' },
  Extra: { name: 'Extra', description: 'One-time effect cards' },
  Unison: { name: 'Unison', description: 'Support cards with special abilities' },
};

// =============================================================================
// FILTER OPTIONS
// =============================================================================

/**
 * Filter options for card search
 */
export interface DragonBallFilterOptions {
  id?: string;
  code?: string;
  rarity?: DragonBallRarity;
  name?: string;
  color?: DragonBallColor;
  cardType?: DragonBallCardType;
  cost?: number;
  specifiedCost?: string;
  power?: number;
  comboPower?: number;
  features?: string;
  effect?: string;
  getIt?: string;
  page?: number;
}

/**
 * Build query string from filter options
 */
function buildQueryString(options: DragonBallFilterOptions): string {
  const params = new URLSearchParams();

  // API uses property/value query format for most filters
  // We'll check the most commonly used filter and use that
  if (options.name) {
    params.append('name', options.name);
  }
  if (options.color) {
    params.append('color', options.color);
  }
  if (options.rarity) {
    params.append('rarity', options.rarity);
  }
  if (options.cardType) {
    params.append('cardType', options.cardType);
  }
  if (options.code) {
    params.append('code', options.code);
  }
  if (options.cost !== undefined) {
    params.append('cost', String(options.cost));
  }
  if (options.power !== undefined) {
    params.append('power', String(options.power));
  }
  if (options.comboPower !== undefined) {
    params.append('comboPower', String(options.comboPower));
  }
  if (options.features) {
    params.append('features', options.features);
  }
  if (options.effect) {
    params.append('effect', options.effect);
  }
  if (options.page !== undefined) {
    params.append('page', String(options.page));
  }

  return params.toString();
}

// =============================================================================
// CARD API FUNCTIONS
// =============================================================================

/**
 * Get cards with optional filters
 * Returns paginated results (25 cards per page)
 */
export async function getCards(
  options: DragonBallFilterOptions = {}
): Promise<DragonBallCardListResponse> {
  const queryString = buildQueryString(options);
  const endpoint = queryString ? `/cards?${queryString}` : '/cards';

  return fetchFromAPI<DragonBallCardListResponse>(endpoint, {
    next: { revalidate: 86400 }, // Cache for 24 hours
  });
}

/**
 * Get all cards (handles pagination automatically)
 */
export async function getAllCards(): Promise<DragonBallCard[]> {
  const allCards: DragonBallCard[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await getCards({ page: currentPage });
    allCards.push(...response.data);

    if (currentPage >= response.totalPages) {
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
export async function getCardById(id: string): Promise<DragonBallCard | null> {
  try {
    const response = await fetchFromAPI<DragonBallCardResponse>(`/cards/${id}`, {
      next: { revalidate: 86400 },
    });
    return response.data;
  } catch {
    return null;
  }
}

/**
 * Get cards by code prefix (e.g., "FB01-001")
 */
export async function getCardByCode(code: string): Promise<DragonBallCard | null> {
  const response = await getCards({ code });
  return response.data[0] || null;
}

/**
 * Get cards by codes
 */
export async function getCardsByCodes(codes: string[]): Promise<DragonBallCard[]> {
  if (codes.length === 0) return [];

  const results: DragonBallCard[] = [];
  for (const code of codes) {
    const card = await getCardByCode(code);
    if (card) {
      results.push(card);
    }
  }

  return results;
}

/**
 * Search cards by name
 */
export async function searchCards(query: string): Promise<DragonBallCard[]> {
  const response = await getCards({ name: query });
  return response.data;
}

/**
 * Get cards by color
 */
export async function getCardsByColor(color: DragonBallColor): Promise<DragonBallCard[]> {
  const allCards: DragonBallCard[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await getCards({ color, page: currentPage });
    allCards.push(...response.data);

    if (currentPage >= response.totalPages) {
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
export async function getCardsByType(cardType: DragonBallCardType): Promise<DragonBallCard[]> {
  const allCards: DragonBallCard[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await getCards({ cardType, page: currentPage });
    allCards.push(...response.data);

    if (currentPage >= response.totalPages) {
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
export async function getCardsByRarity(rarity: DragonBallRarity): Promise<DragonBallCard[]> {
  const allCards: DragonBallCard[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await getCards({ rarity, page: currentPage });
    allCards.push(...response.data);

    if (currentPage >= response.totalPages) {
      hasMore = false;
    } else {
      currentPage++;
    }
  }

  return allCards;
}

/**
 * Get cards by feature (trait)
 */
export async function getCardsByFeature(feature: string): Promise<DragonBallCard[]> {
  const response = await getCards({ features: feature });
  return response.data;
}

// =============================================================================
// SET FUNCTIONS
// =============================================================================

/**
 * Get all unique sets from the API
 * Note: Sets endpoint is under construction, so we extract from cards
 */
export async function getAllSets(): Promise<DragonBallSet[]> {
  const allCards = await getAllCards();

  // Group cards by set
  const setMap = new Map<string, { name: string; cardCount: number }>();

  for (const card of allCards) {
    const setCode = extractSetCode(card.code);
    const setName = card.set?.name || setCode;
    const existing = setMap.get(setCode);

    if (existing) {
      existing.cardCount++;
    } else {
      setMap.set(setCode, {
        name: setName,
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
export async function getSetByCode(setCode: string): Promise<DragonBallSet | null> {
  const sets = await getAllSets();
  return sets.find((s) => s.code.toLowerCase() === setCode.toLowerCase()) || null;
}

/**
 * Search sets by name
 */
export async function searchSets(query: string): Promise<DragonBallSet[]> {
  const sets = await getAllSets();
  const lowerQuery = query.toLowerCase();
  return sets.filter(
    (s) => s.name.toLowerCase().includes(lowerQuery) || s.code.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get cards in a specific set
 */
export async function getCardsInSet(setCode: string): Promise<DragonBallCard[]> {
  const allCards = await getAllCards();
  return allCards.filter((card) => extractSetCode(card.code) === setCode.toUpperCase());
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract set code from card code
 * e.g., "FB01-001" -> "FB01", "FB02-050" -> "FB02"
 */
export function extractSetCode(cardCode: string): string {
  const match = cardCode.match(/^([A-Z]+\d+)/i);
  return match ? match[1].toUpperCase() : cardCode;
}

/**
 * Extract card number from card code
 * e.g., "FB01-001" -> "001"
 */
export function extractCardNumber(cardCode: string): string {
  const parts = cardCode.split('-');
  return parts.length > 1 ? parts[1] : cardCode;
}

/**
 * Get a unique identifier for a card in our system
 * Format: "dragonball-{code}" (e.g., "dragonball-FB01-001")
 */
export function getCardDexId(card: DragonBallCard): string {
  return `dragonball-${card.code}`;
}

/**
 * Parse a CardDex ID back to card code
 */
export function parseCardDexId(dexId: string): string | null {
  if (!dexId.startsWith('dragonball-')) return null;
  return dexId.slice(11);
}

/**
 * Get the card image URL
 */
export function getCardImage(card: DragonBallCard, size: 'small' | 'large' = 'large'): string {
  return size === 'small' ? card.images.small : card.images.large;
}

/**
 * Check if a card is a Leader card
 */
export function isLeaderCard(card: DragonBallCard): boolean {
  return card.cardType === 'Leader';
}

/**
 * Check if a card is a Battle card
 */
export function isBattleCard(card: DragonBallCard): boolean {
  return card.cardType === 'Battle';
}

/**
 * Check if a card is an Extra card
 */
export function isExtraCard(card: DragonBallCard): boolean {
  return card.cardType === 'Extra';
}

/**
 * Check if a card is a Unison card
 */
export function isUnisonCard(card: DragonBallCard): boolean {
  return card.cardType === 'Unison';
}

/**
 * Check if a card is multi-color
 */
export function isMultiColor(card: DragonBallCard): boolean {
  return card.color === 'Multi';
}

/**
 * Check if a card has an effect
 */
export function hasEffect(card: DragonBallCard): boolean {
  return card.effect !== null && card.effect.length > 0;
}

/**
 * Check if a card has combo power
 */
export function hasComboPower(card: DragonBallCard): boolean {
  return card.comboPower !== null && card.comboPower > 0;
}

/**
 * Check if a card has features/traits
 */
export function hasFeatures(card: DragonBallCard): boolean {
  return card.features.length > 0;
}

/**
 * Get color display info
 */
export function getColorInfo(color: DragonBallColor): { name: string; hex: string } {
  return DRAGONBALL_COLORS[color] || { name: color, hex: '#9E9E9E' };
}

/**
 * Get rarity display name
 */
export function getRarityDisplayName(rarity: DragonBallRarity): string {
  return DRAGONBALL_RARITIES[rarity]?.name || rarity;
}

/**
 * Get card type display name
 */
export function getTypeDisplayName(cardType: DragonBallCardType): string {
  return DRAGONBALL_CARD_TYPES[cardType]?.name || cardType;
}

/**
 * Format cost display (handles null)
 */
export function formatCost(cost: number | null): string {
  return cost !== null ? String(cost) : '-';
}

/**
 * Format power display (handles null)
 */
export function formatPower(power: number | null): string {
  return power !== null ? String(power) : '-';
}

/**
 * Format combo power display (handles null)
 */
export function formatComboPower(comboPower: number | null): string {
  return comboPower !== null ? `+${comboPower}` : '-';
}

/**
 * Get a summary line for the card (for display)
 * e.g., "Battle | Red | Cost: 3 | Power: 15000 | Combo: +10000"
 */
export function getCardSummary(card: DragonBallCard): string {
  const parts: string[] = [card.cardType];

  parts.push(card.color);

  if (card.cost !== null) {
    parts.push(`Cost: ${card.cost}`);
  }

  if (card.power !== null) {
    parts.push(`Power: ${card.power}`);
  }

  if (card.comboPower !== null) {
    parts.push(`Combo: +${card.comboPower}`);
  }

  return parts.join(' | ');
}

/**
 * Sort cards by set code and card number
 */
export function sortBySetAndNumber(cards: DragonBallCard[]): DragonBallCard[] {
  return [...cards].sort((a, b) => {
    const setCompare = extractSetCode(a.code).localeCompare(extractSetCode(b.code));
    if (setCompare !== 0) return setCompare;
    return extractCardNumber(a.code).localeCompare(extractCardNumber(b.code));
  });
}

/**
 * Sort cards by rarity (highest first)
 */
export function sortByRarity(cards: DragonBallCard[]): DragonBallCard[] {
  return [...cards].sort((a, b) => {
    const aOrder = DRAGONBALL_RARITIES[a.rarity]?.sortOrder ?? 99;
    const bOrder = DRAGONBALL_RARITIES[b.rarity]?.sortOrder ?? 99;
    return bOrder - aOrder; // Higher rarity first
  });
}

/**
 * Sort cards by power (highest first)
 */
export function sortByPower(cards: DragonBallCard[]): DragonBallCard[] {
  return [...cards].sort((a, b) => {
    const aPower = a.power ?? -1;
    const bPower = b.power ?? -1;
    return bPower - aPower;
  });
}

/**
 * Sort cards by cost (lowest first)
 */
export function sortByCost(cards: DragonBallCard[]): DragonBallCard[] {
  return [...cards].sort((a, b) => {
    const aCost = a.cost ?? 999;
    const bCost = b.cost ?? 999;
    return aCost - bCost;
  });
}

/**
 * Filter cards by color
 */
export function filterByColor(cards: DragonBallCard[], color: DragonBallColor): DragonBallCard[] {
  return cards.filter((card) => card.color === color);
}

/**
 * Filter cards by feature (trait)
 */
export function filterByFeature(cards: DragonBallCard[], feature: string): DragonBallCard[] {
  const lowerFeature = feature.toLowerCase();
  return cards.filter((card) => card.features.some((f) => f.toLowerCase().includes(lowerFeature)));
}

/**
 * Get unique features from a list of cards
 */
export function getUniqueFeatures(cards: DragonBallCard[]): string[] {
  const featureSet = new Set<string>();
  for (const card of cards) {
    for (const feature of card.features) {
      featureSet.add(feature);
    }
  }
  return Array.from(featureSet).sort();
}

/**
 * Get unique colors from a list of cards
 */
export function getUniqueColors(cards: DragonBallCard[]): DragonBallColor[] {
  const colorSet = new Set<DragonBallColor>();
  for (const card of cards) {
    colorSet.add(card.color);
  }
  return Array.from(colorSet).sort();
}

/**
 * Calculate deck statistics
 */
export function calculateDeckStats(cards: DragonBallCard[]): {
  totalCards: number;
  leaders: number;
  battles: number;
  extras: number;
  unisons: number;
  avgCost: number;
  avgPower: number;
  colors: DragonBallColor[];
} {
  const leaders = cards.filter((c) => c.cardType === 'Leader').length;
  const battles = cards.filter((c) => c.cardType === 'Battle').length;
  const extras = cards.filter((c) => c.cardType === 'Extra').length;
  const unisons = cards.filter((c) => c.cardType === 'Unison').length;

  const costCards = cards.filter((c) => c.cost !== null);
  const avgCost =
    costCards.length > 0
      ? costCards.reduce((sum, c) => sum + (c.cost || 0), 0) / costCards.length
      : 0;

  const powerCards = cards.filter((c) => c.power !== null);
  const avgPower =
    powerCards.length > 0
      ? powerCards.reduce((sum, c) => sum + (c.power || 0), 0) / powerCards.length
      : 0;

  return {
    totalCards: cards.length,
    leaders,
    battles,
    extras,
    unisons,
    avgCost: Math.round(avgCost * 10) / 10,
    avgPower: Math.round(avgPower),
    colors: getUniqueColors(cards),
  };
}

/**
 * Extract sets from a list of cards
 */
export function extractSetsFromCards(cards: DragonBallCard[]): DragonBallSet[] {
  const setMap = new Map<string, { name: string; cardCount: number }>();

  for (const card of cards) {
    const setCode = extractSetCode(card.code);
    const setName = card.set?.name || setCode;
    const existing = setMap.get(setCode);

    if (existing) {
      existing.cardCount++;
    } else {
      setMap.set(setCode, {
        name: setName,
        cardCount: 1,
      });
    }
  }

  return Array.from(setMap.entries())
    .map(([code, data]) => ({
      code,
      name: data.name,
      cardCount: data.cardCount,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}
