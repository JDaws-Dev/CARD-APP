/**
 * DigimonCard.io API Client for Digimon TCG cards
 * Documentation: https://digimoncard.io/index.php/api-documentation
 *
 * Rate Limit: 15 requests per 10 seconds (667ms minimum between requests to be safe)
 * Authentication: None required
 * CORS: Supported
 */

const API_BASE = 'https://digimoncard.io/index.php/api-public';

// Rate limiting: 15 requests per 10 seconds = ~667ms minimum between requests (conservative)
const MIN_REQUEST_INTERVAL_MS = 700;
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
 * Fetch from DigimonCard.io API with rate limiting
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
      throw new Error(
        'DigimonCard.io API rate limit exceeded. You are blocked for 1 hour. Please wait before making more requests.'
      );
    }
    if (response.status === 400) {
      // API returns 400 when no cards found
      return [] as T;
    }
    throw new Error(`DigimonCard.io API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Digimon card colors
 */
export type DigimonColor =
  | 'Red'
  | 'Blue'
  | 'Yellow'
  | 'Green'
  | 'Purple'
  | 'Black'
  | 'White'
  | 'Colorless';

/**
 * Digimon card types
 */
export type DigimonCardType = 'Digimon' | 'Option' | 'Tamer' | 'Digi-Egg';

/**
 * Digimon card attributes
 */
export type DigimonAttribute = 'Vaccine' | 'Virus' | 'Data' | 'Free' | 'Variable' | 'Unknown';

/**
 * Digimon rarity codes
 */
export type DigimonRarity = 'C' | 'U' | 'R' | 'SR' | 'SEC' | 'P';

/**
 * Digimon card stages
 */
export type DigimonStage =
  | 'Digi-Egg'
  | 'In-Training'
  | 'Rookie'
  | 'Champion'
  | 'Ultimate'
  | 'Mega'
  | 'Armor'
  | 'Hybrid'
  | 'Unknown';

/**
 * Digimon series/format
 */
export type DigimonSeries = 'Digimon Card Game' | 'Digi-Battle' | 'Collectible';

/**
 * Card object from search API
 */
export interface DigimonCard {
  name: string;
  type: DigimonCardType;
  id: string; // Card number (e.g., "BT1-001")
  level: number | null;
  play_cost: number | null;
  evolution_cost: number | null;
  evolution_color: string | null;
  evolution_level: number | null;
  color: DigimonColor;
  color2: DigimonColor | null; // For dual-color cards
  digi_type: string | null; // Digimon type (e.g., "Dragon", "Wizard")
  digi_type2: string | null;
  form: string | null;
  dp: number | null; // Digimon Power
  attribute: DigimonAttribute | null;
  rarity: DigimonRarity;
  stage: DigimonStage | null;
  main_effect: string | null;
  source_effect: string | null;
  alt_effect: string | null;
  series: DigimonSeries;
  pretty_url: string;
  date_added: string;
  tcgplayer_name: string | null;
  tcgplayer_id: number | null;
  set_name: string[];
}

/**
 * Simplified card object from getAllCards API
 */
export interface DigimonCardBasic {
  name: string;
  cardnumber: string;
}

/**
 * Set information (constructed from card data)
 */
export interface DigimonSet {
  name: string;
  code: string;
  cardCount?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Color display names and hex codes
 */
export const DIGIMON_COLORS: Record<DigimonColor, { name: string; hex: string }> = {
  Red: { name: 'Red', hex: '#E53935' },
  Blue: { name: 'Blue', hex: '#1E88E5' },
  Yellow: { name: 'Yellow', hex: '#FDD835' },
  Green: { name: 'Green', hex: '#43A047' },
  Purple: { name: 'Purple', hex: '#8E24AA' },
  Black: { name: 'Black', hex: '#212121' },
  White: { name: 'White', hex: '#F5F5F5' },
  Colorless: { name: 'Colorless', hex: '#9E9E9E' },
};

/**
 * Card type display info
 */
export const DIGIMON_CARD_TYPES: Record<DigimonCardType, { name: string; description: string }> = {
  Digimon: { name: 'Digimon', description: 'Digital monsters that battle' },
  Option: { name: 'Option', description: 'One-time effect cards' },
  Tamer: { name: 'Tamer', description: 'Partner cards that provide ongoing effects' },
  'Digi-Egg': { name: 'Digi-Egg', description: 'Starting cards for Digivolution' },
};

/**
 * Rarity display names and sort order
 */
export const DIGIMON_RARITIES: Record<DigimonRarity, { name: string; sortOrder: number }> = {
  C: { name: 'Common', sortOrder: 1 },
  U: { name: 'Uncommon', sortOrder: 2 },
  R: { name: 'Rare', sortOrder: 3 },
  SR: { name: 'Super Rare', sortOrder: 4 },
  SEC: { name: 'Secret Rare', sortOrder: 5 },
  P: { name: 'Promo', sortOrder: 6 },
};

/**
 * Attribute display names
 */
export const DIGIMON_ATTRIBUTES: Record<DigimonAttribute, string> = {
  Vaccine: 'Vaccine',
  Virus: 'Virus',
  Data: 'Data',
  Free: 'Free',
  Variable: 'Variable',
  Unknown: 'Unknown',
};

/**
 * Stage display names and sort order (evolution chain)
 */
export const DIGIMON_STAGES: Record<DigimonStage, { name: string; sortOrder: number }> = {
  'Digi-Egg': { name: 'Digi-Egg', sortOrder: 0 },
  'In-Training': { name: 'In-Training', sortOrder: 1 },
  Rookie: { name: 'Rookie', sortOrder: 2 },
  Champion: { name: 'Champion', sortOrder: 3 },
  Ultimate: { name: 'Ultimate', sortOrder: 4 },
  Mega: { name: 'Mega', sortOrder: 5 },
  Armor: { name: 'Armor', sortOrder: 3.5 }, // Between Champion and Ultimate
  Hybrid: { name: 'Hybrid', sortOrder: 3.5 },
  Unknown: { name: 'Unknown', sortOrder: 99 },
};

// =============================================================================
// FILTER OPTIONS
// =============================================================================

/**
 * Filter options for card search
 */
export interface DigimonFilterOptions {
  name?: string; // Card name (supports exclude with -)
  desc?: string; // Description/effect text search
  color?: DigimonColor;
  type?: DigimonCardType;
  attribute?: DigimonAttribute;
  card?: string; // Card number (comma-separated for multiple)
  pack?: string; // Pack/set name
  sort?:
    | 'name'
    | 'power'
    | 'code'
    | 'color'
    | 'random'
    | 'level'
    | 'playcost'
    | 'type'
    | 'new'
    | 'views';
  sortdirection?: 'asc' | 'desc';
  series?: DigimonSeries;
  digitype?: string; // Digimon type (Dragon, Wizard, etc.)
  evocost?: number; // Evolution cost
  evocolor?: DigimonColor; // Evolution color
  level?: number;
  playcost?: number;
  dp?: number;
  stage?: DigimonStage;
  artist?: string;
  limit?: number;
}

/**
 * Build query string from filter options
 */
function buildQueryString(options: DigimonFilterOptions): string {
  const params = new URLSearchParams();

  if (options.name) params.append('n', options.name);
  if (options.desc) params.append('desc', options.desc);
  if (options.color) params.append('color', options.color);
  if (options.type) params.append('type', options.type);
  if (options.attribute) params.append('attribute', options.attribute);
  if (options.card) params.append('card', options.card);
  if (options.pack) params.append('pack', options.pack);
  if (options.sort) params.append('sort', options.sort);
  if (options.sortdirection) params.append('sortdirection', options.sortdirection);
  if (options.series) params.append('series', options.series);
  if (options.digitype) params.append('digitype', options.digitype);
  if (options.evocost !== undefined) params.append('evocost', String(options.evocost));
  if (options.evocolor) params.append('evocolor', options.evocolor);
  if (options.level !== undefined) params.append('level', String(options.level));
  if (options.playcost !== undefined) params.append('playcost', String(options.playcost));
  if (options.dp !== undefined) params.append('dp', String(options.dp));
  if (options.stage) params.append('stage', options.stage);
  if (options.artist) params.append('artist', options.artist);
  if (options.limit !== undefined) params.append('limit', String(options.limit));

  return params.toString();
}

// =============================================================================
// CARD API FUNCTIONS
// =============================================================================

/**
 * Search cards with filter criteria
 * @param options Filter options for the search
 * @returns Array of matching cards
 */
export async function searchCards(options: DigimonFilterOptions = {}): Promise<DigimonCard[]> {
  const queryString = buildQueryString(options);
  if (!queryString) {
    // API requires at least one parameter
    return [];
  }

  const endpoint = `/search?${queryString}`;

  try {
    const response = await fetchFromAPI<DigimonCard[]>(endpoint, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });
    return response || [];
  } catch (error) {
    if (error instanceof Error && error.message.includes('400')) {
      return [];
    }
    throw error;
  }
}

/**
 * Get all cards in the Digimon Card Game series
 * Note: This returns simplified card objects (name and card number only)
 * @param sort Sort field
 * @param sortdirection Sort direction
 */
export async function getAllCardsBasic(
  sort: 'name' | 'random' | 'card_number' = 'name',
  sortdirection: 'asc' | 'desc' = 'asc'
): Promise<DigimonCardBasic[]> {
  const params = new URLSearchParams({
    series: 'Digimon Card Game',
    sort,
    sortdirection,
  });

  const response = await fetchFromAPI<DigimonCardBasic[]>(`/getAllCards?${params.toString()}`, {
    next: { revalidate: 86400 },
  });
  return response || [];
}

/**
 * Get a single card by card number (e.g., "BT1-001")
 */
export async function getCardByNumber(cardNumber: string): Promise<DigimonCard | null> {
  const cards = await searchCards({ card: cardNumber });
  return cards[0] || null;
}

/**
 * Get multiple cards by card numbers
 */
export async function getCardsByNumbers(cardNumbers: string[]): Promise<DigimonCard[]> {
  if (cardNumbers.length === 0) return [];

  // API supports comma-separated card numbers
  // Batch in groups of 50 to avoid URL length issues
  const batchSize = 50;
  const results: DigimonCard[] = [];

  for (let i = 0; i < cardNumbers.length; i += batchSize) {
    const batch = cardNumbers.slice(i, i + batchSize);
    const cards = await searchCards({ card: batch.join(',') });
    results.push(...cards);
  }

  return results;
}

/**
 * Search cards by name (fuzzy match)
 */
export async function searchCardsByName(name: string, limit = 20): Promise<DigimonCard[]> {
  return searchCards({ name, limit, sort: 'name', sortdirection: 'asc' });
}

/**
 * Get cards in a specific set/pack
 */
export async function getCardsInSet(setName: string): Promise<DigimonCard[]> {
  return searchCards({ pack: setName, sort: 'code', sortdirection: 'asc' });
}

/**
 * Get cards by color
 */
export async function getCardsByColor(color: DigimonColor): Promise<DigimonCard[]> {
  return searchCards({ color, sort: 'name', sortdirection: 'asc' });
}

/**
 * Get cards by type
 */
export async function getCardsByType(type: DigimonCardType): Promise<DigimonCard[]> {
  return searchCards({ type, sort: 'name', sortdirection: 'asc' });
}

/**
 * Get cards by Digimon type (e.g., "Dragon", "Wizard")
 */
export async function getCardsByDigimonType(digitype: string): Promise<DigimonCard[]> {
  return searchCards({ digitype, sort: 'name', sortdirection: 'asc' });
}

/**
 * Get cards by attribute
 */
export async function getCardsByAttribute(attribute: DigimonAttribute): Promise<DigimonCard[]> {
  return searchCards({ attribute, sort: 'name', sortdirection: 'asc' });
}

/**
 * Get cards by level
 */
export async function getCardsByLevel(level: number): Promise<DigimonCard[]> {
  return searchCards({ level, sort: 'name', sortdirection: 'asc' });
}

/**
 * Get cards by stage
 */
export async function getCardsByStage(stage: DigimonStage): Promise<DigimonCard[]> {
  return searchCards({ stage, sort: 'name', sortdirection: 'asc' });
}

/**
 * Get a random card
 */
export async function getRandomCard(): Promise<DigimonCard | null> {
  const cards = await searchCards({ sort: 'random', limit: 1 });
  return cards[0] || null;
}

// =============================================================================
// SET FUNCTIONS (Derived from card data)
// =============================================================================

/**
 * Get unique sets from a list of cards
 */
export function extractSetsFromCards(cards: DigimonCard[]): DigimonSet[] {
  const setMap = new Map<string, { name: string; count: number }>();

  for (const card of cards) {
    if (card.set_name) {
      for (const setName of card.set_name) {
        const existing = setMap.get(setName);
        if (existing) {
          existing.count++;
        } else {
          // Extract set code from card number (e.g., "BT1" from "BT1-001")
          const code = extractSetCode(card.id);
          setMap.set(setName, { name: setName, count: 1 });
        }
      }
    }
  }

  return Array.from(setMap.entries()).map(([name, data]) => ({
    name,
    code: name, // Use name as code since API doesn't provide separate codes
    cardCount: data.count,
  }));
}

/**
 * Search for sets by name
 * Note: DigimonCard.io doesn't have a sets endpoint, so we search cards and extract sets
 */
export async function searchSets(query: string): Promise<DigimonSet[]> {
  // Search for cards in packs matching the query
  const cards = await searchCards({ pack: query });
  return extractSetsFromCards(cards);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract set code from card number (e.g., "BT1" from "BT1-001")
 * Only matches valid card ID format: letters+optional digits followed by hyphen
 */
export function extractSetCode(cardNumber: string): string {
  // Must have a hyphen to be a valid card ID format
  if (!cardNumber.includes('-')) return '';
  const match = cardNumber.match(/^([A-Z]+\d*)-/i);
  return match ? match[1].toUpperCase() : '';
}

/**
 * Extract card number within set (e.g., "001" from "BT1-001")
 */
export function extractCardNumber(cardNumber: string): string {
  const match = cardNumber.match(/-(\d+)$/);
  return match ? match[1] : cardNumber;
}

/**
 * Get a unique identifier for a card in our system
 * Format: "digimon-{card_id}" (e.g., "digimon-BT1-001")
 */
export function getCardDexId(card: DigimonCard): string {
  return `digimon-${card.id}`;
}

/**
 * Parse a CardDex ID back to card number
 */
export function parseCardDexId(dexId: string): string | null {
  if (!dexId.startsWith('digimon-')) return null;
  return dexId.slice(8);
}

/**
 * Get the card image URL
 * DigimonCard.io uses a predictable URL pattern
 */
export function getCardImage(card: DigimonCard, size: 'small' | 'large' = 'large'): string {
  // DigimonCard.io image URL pattern
  const encodedName = encodeURIComponent(card.name.replace(/ /g, '_'));
  if (size === 'small') {
    return `https://images.digimoncard.io/images/cards/${card.id}.png`;
  }
  return `https://images.digimoncard.io/images/cards/${card.id}.png`;
}

/**
 * Check if a card is a Digimon
 */
export function isDigimonCard(card: DigimonCard): boolean {
  return card.type === 'Digimon';
}

/**
 * Check if a card is an Option card
 */
export function isOptionCard(card: DigimonCard): boolean {
  return card.type === 'Option';
}

/**
 * Check if a card is a Tamer
 */
export function isTamerCard(card: DigimonCard): boolean {
  return card.type === 'Tamer';
}

/**
 * Check if a card is a Digi-Egg
 */
export function isDigiEggCard(card: DigimonCard): boolean {
  return card.type === 'Digi-Egg';
}

/**
 * Check if a card is dual-color
 */
export function isDualColor(card: DigimonCard): boolean {
  return card.color2 !== null;
}

/**
 * Get both colors for a card (returns array with 1 or 2 colors)
 */
export function getCardColors(card: DigimonCard): DigimonColor[] {
  const colors: DigimonColor[] = [card.color];
  if (card.color2) {
    colors.push(card.color2);
  }
  return colors;
}

/**
 * Check if a card has an evolution cost (can be evolved into)
 */
export function hasEvolutionCost(card: DigimonCard): boolean {
  return card.evolution_cost !== null && card.evolution_cost > 0;
}

/**
 * Get all Digimon types for a card
 */
export function getDigimonTypes(card: DigimonCard): string[] {
  const types: string[] = [];
  if (card.digi_type) types.push(card.digi_type);
  if (card.digi_type2) types.push(card.digi_type2);
  return types;
}

/**
 * Get color display info
 */
export function getColorInfo(color: DigimonColor): { name: string; hex: string } {
  return DIGIMON_COLORS[color] || { name: color, hex: '#9E9E9E' };
}

/**
 * Get rarity display name
 */
export function getRarityDisplayName(rarity: DigimonRarity): string {
  return DIGIMON_RARITIES[rarity]?.name || rarity;
}

/**
 * Get card type display name
 */
export function getTypeDisplayName(type: DigimonCardType): string {
  return DIGIMON_CARD_TYPES[type]?.name || type;
}

/**
 * Get attribute display name
 */
export function getAttributeDisplayName(attribute: DigimonAttribute | null): string {
  if (!attribute) return '-';
  return DIGIMON_ATTRIBUTES[attribute] || attribute;
}

/**
 * Get stage display name
 */
export function getStageDisplayName(stage: DigimonStage | null): string {
  if (!stage) return '-';
  return DIGIMON_STAGES[stage]?.name || stage;
}

/**
 * Format play cost for display
 */
export function formatPlayCost(cost: number | null): string {
  return cost !== null ? String(cost) : '-';
}

/**
 * Format evolution cost for display
 */
export function formatEvolutionCost(cost: number | null): string {
  return cost !== null ? String(cost) : '-';
}

/**
 * Format DP (Digimon Power) for display
 */
export function formatDP(dp: number | null): string {
  if (dp === null) return '-';
  return dp >= 1000 ? `${(dp / 1000).toFixed(0)}K` : String(dp);
}

/**
 * Format level for display
 */
export function formatLevel(level: number | null): string {
  return level !== null ? `Lv.${level}` : '-';
}

/**
 * Get a summary line for the card (for display)
 * e.g., "Digimon | Red | Lv.4 | DP: 5000 | Cost: 4"
 */
export function getCardSummary(card: DigimonCard): string {
  const parts: string[] = [card.type];

  parts.push(card.color);
  if (card.color2) {
    parts[parts.length - 1] += `/${card.color2}`;
  }

  if (card.level !== null) {
    parts.push(formatLevel(card.level));
  }

  if (card.dp !== null) {
    parts.push(`DP: ${formatDP(card.dp)}`);
  }

  if (card.play_cost !== null) {
    parts.push(`Cost: ${card.play_cost}`);
  }

  return parts.join(' | ');
}

/**
 * Get card's effect text (combined main and source effects)
 */
export function getFullEffectText(card: DigimonCard): string {
  const effects: string[] = [];

  if (card.main_effect) {
    effects.push(card.main_effect);
  }

  if (card.source_effect) {
    effects.push(`[Inherited Effect] ${card.source_effect}`);
  }

  if (card.alt_effect) {
    effects.push(`[Alt Effect] ${card.alt_effect}`);
  }

  return effects.join('\n\n');
}

/**
 * Sort cards by card number (set code then number)
 */
export function sortByCardNumber(cards: DigimonCard[]): DigimonCard[] {
  return [...cards].sort((a, b) => {
    const aCode = extractSetCode(a.id);
    const bCode = extractSetCode(b.id);
    const codeCompare = aCode.localeCompare(bCode);
    if (codeCompare !== 0) return codeCompare;

    const aNum = parseInt(extractCardNumber(a.id), 10) || 0;
    const bNum = parseInt(extractCardNumber(b.id), 10) || 0;
    return aNum - bNum;
  });
}

/**
 * Sort cards by rarity (highest first)
 */
export function sortByRarity(cards: DigimonCard[]): DigimonCard[] {
  return [...cards].sort((a, b) => {
    const aOrder = DIGIMON_RARITIES[a.rarity]?.sortOrder ?? 99;
    const bOrder = DIGIMON_RARITIES[b.rarity]?.sortOrder ?? 99;
    return bOrder - aOrder; // Higher rarity first
  });
}

/**
 * Sort cards by level (lowest first)
 */
export function sortByLevel(cards: DigimonCard[]): DigimonCard[] {
  return [...cards].sort((a, b) => {
    const aLevel = a.level ?? 99;
    const bLevel = b.level ?? 99;
    return aLevel - bLevel;
  });
}

/**
 * Sort cards by DP (highest first)
 */
export function sortByDP(cards: DigimonCard[]): DigimonCard[] {
  return [...cards].sort((a, b) => {
    const aDP = a.dp ?? -1;
    const bDP = b.dp ?? -1;
    return bDP - aDP;
  });
}

/**
 * Sort cards by play cost (lowest first)
 */
export function sortByPlayCost(cards: DigimonCard[]): DigimonCard[] {
  return [...cards].sort((a, b) => {
    const aCost = a.play_cost ?? 99;
    const bCost = b.play_cost ?? 99;
    return aCost - bCost;
  });
}

/**
 * Sort cards by stage (evolution order)
 */
export function sortByStage(cards: DigimonCard[]): DigimonCard[] {
  return [...cards].sort((a, b) => {
    const aOrder = a.stage ? (DIGIMON_STAGES[a.stage]?.sortOrder ?? 99) : 99;
    const bOrder = b.stage ? (DIGIMON_STAGES[b.stage]?.sortOrder ?? 99) : 99;
    return aOrder - bOrder;
  });
}

/**
 * Filter cards by color
 */
export function filterByColor(cards: DigimonCard[], color: DigimonColor): DigimonCard[] {
  return cards.filter((card) => card.color === color || card.color2 === color);
}

/**
 * Filter cards by Digimon type
 */
export function filterByDigimonType(cards: DigimonCard[], digitype: string): DigimonCard[] {
  const lowerType = digitype.toLowerCase();
  return cards.filter(
    (card) =>
      card.digi_type?.toLowerCase().includes(lowerType) ||
      card.digi_type2?.toLowerCase().includes(lowerType)
  );
}

/**
 * Get unique colors from a list of cards
 */
export function getUniqueColors(cards: DigimonCard[]): DigimonColor[] {
  const colorSet = new Set<DigimonColor>();
  for (const card of cards) {
    colorSet.add(card.color);
    if (card.color2) {
      colorSet.add(card.color2);
    }
  }
  return Array.from(colorSet).sort();
}

/**
 * Get unique Digimon types from a list of cards
 */
export function getUniqueDigimonTypes(cards: DigimonCard[]): string[] {
  const typeSet = new Set<string>();
  for (const card of cards) {
    if (card.digi_type) typeSet.add(card.digi_type);
    if (card.digi_type2) typeSet.add(card.digi_type2);
  }
  return Array.from(typeSet).sort();
}

/**
 * Calculate deck statistics
 */
export function calculateDeckStats(cards: DigimonCard[]): {
  totalCards: number;
  digimon: number;
  options: number;
  tamers: number;
  digiEggs: number;
  avgPlayCost: number;
  avgDP: number;
  colors: DigimonColor[];
  levelDistribution: Record<number, number>;
} {
  const digimon = cards.filter((c) => c.type === 'Digimon');
  const options = cards.filter((c) => c.type === 'Option');
  const tamers = cards.filter((c) => c.type === 'Tamer');
  const digiEggs = cards.filter((c) => c.type === 'Digi-Egg');

  const cardsWithCost = cards.filter((c) => c.play_cost !== null);
  const totalCost = cardsWithCost.reduce((sum, c) => sum + (c.play_cost ?? 0), 0);
  const avgPlayCost = cardsWithCost.length > 0 ? totalCost / cardsWithCost.length : 0;

  const cardsWithDP = cards.filter((c) => c.dp !== null);
  const totalDP = cardsWithDP.reduce((sum, c) => sum + (c.dp ?? 0), 0);
  const avgDP = cardsWithDP.length > 0 ? totalDP / cardsWithDP.length : 0;

  const levelDistribution: Record<number, number> = {};
  for (const card of cards) {
    if (card.level !== null) {
      levelDistribution[card.level] = (levelDistribution[card.level] || 0) + 1;
    }
  }

  return {
    totalCards: cards.length,
    digimon: digimon.length,
    options: options.length,
    tamers: tamers.length,
    digiEggs: digiEggs.length,
    avgPlayCost: Math.round(avgPlayCost * 10) / 10,
    avgDP: Math.round(avgDP),
    colors: getUniqueColors(cards),
    levelDistribution,
  };
}

/**
 * Check if a card can evolve from another card
 * (Simplified check based on level and color)
 */
export function canEvolveFrom(card: DigimonCard, sourceCard: DigimonCard): boolean {
  if (!card.evolution_level || !card.evolution_color) return false;
  if (sourceCard.level !== card.evolution_level) return false;

  const evoColors = card.evolution_color.split('/').map((c) => c.trim().toLowerCase());
  const sourceColors = getCardColors(sourceCard).map((c) => c.toLowerCase());

  return evoColors.some((color) => sourceColors.includes(color));
}

/**
 * Get evolution chain requirements for a card
 */
export function getEvolutionRequirements(card: DigimonCard): {
  level: number | null;
  cost: number | null;
  colors: string[];
} | null {
  if (!hasEvolutionCost(card)) return null;

  return {
    level: card.evolution_level,
    cost: card.evolution_cost,
    colors: card.evolution_color ? card.evolution_color.split('/').map((c) => c.trim()) : [],
  };
}

/**
 * Get TCGPlayer URL for a card (if available)
 */
export function getTCGPlayerUrl(card: DigimonCard): string | null {
  if (!card.tcgplayer_id) return null;
  return `https://www.tcgplayer.com/product/${card.tcgplayer_id}`;
}

/**
 * Get DigimonCard.io URL for a card
 */
export function getDigimonCardIoUrl(card: DigimonCard): string {
  return `https://digimoncard.io/${card.pretty_url}`;
}
