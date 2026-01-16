/**
 * YGOPRODeck API Client for Yu-Gi-Oh! cards
 * Documentation: https://ygoprodeck.com/api-guide/
 *
 * Rate Limit: 20 requests per second (50ms minimum between requests)
 * Authentication: None required
 *
 * Important: Images should be downloaded and stored locally.
 * Hotlinking to images violates terms and results in IP blacklisting.
 */

const API_BASE = 'https://db.ygoprodeck.com/api/v7';

// Rate limiting: 20 requests per second = 50ms minimum between requests
const MIN_REQUEST_INTERVAL_MS = 50;
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
 * Fetch from YGOPRODeck API with rate limiting
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
        'YGOPRODeck API rate limit exceeded. You are blocked for 1 hour. Please wait before making more requests.'
      );
    }
    throw new Error(`YGOPRODeck API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Yu-Gi-Oh! card set
 */
export interface YuGiOhSet {
  set_name: string;
  set_code: string;
  num_of_cards: number;
  tcg_date: string | null; // ISO date string (YYYY-MM-DD) or null
  set_image?: string; // URL to set image (optional)
}

/**
 * Image URLs for a card
 */
export interface YuGiOhCardImage {
  id: number;
  image_url: string; // Full size image
  image_url_small: string; // Small thumbnail
  image_url_cropped: string; // Art only, cropped
}

/**
 * Card set information for a specific card
 */
export interface YuGiOhCardSet {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_rarity_code: string;
  set_price: string; // Price as string (e.g., "1.23")
}

/**
 * Price data for a card from multiple vendors
 */
export interface YuGiOhCardPrices {
  cardmarket_price: string;
  tcgplayer_price: string;
  ebay_price: string;
  amazon_price: string;
  coolstuffinc_price: string;
}

/**
 * Yu-Gi-Oh! monster card types
 */
export type YuGiOhMonsterType =
  | 'Normal Monster'
  | 'Effect Monster'
  | 'Flip Effect Monster'
  | 'Flip Tuner Effect Monster'
  | 'Gemini Monster'
  | 'Normal Tuner Monster'
  | 'Pendulum Effect Monster'
  | 'Pendulum Effect Ritual Monster'
  | 'Pendulum Flip Effect Monster'
  | 'Pendulum Normal Monster'
  | 'Pendulum Tuner Effect Monster'
  | 'Ritual Effect Monster'
  | 'Ritual Monster'
  | 'Spirit Monster'
  | 'Toon Monster'
  | 'Tuner Monster'
  | 'Union Effect Monster'
  | 'Fusion Monster'
  | 'Link Monster'
  | 'Pendulum Effect Fusion Monster'
  | 'Synchro Monster'
  | 'Synchro Pendulum Effect Monster'
  | 'Synchro Tuner Monster'
  | 'XYZ Monster'
  | 'XYZ Pendulum Effect Monster';

/**
 * Yu-Gi-Oh! spell/trap card types
 */
export type YuGiOhSpellTrapType = 'Spell Card' | 'Trap Card' | 'Skill Card' | 'Token';

/**
 * All Yu-Gi-Oh! card types
 */
export type YuGiOhCardType = YuGiOhMonsterType | YuGiOhSpellTrapType;

/**
 * Yu-Gi-Oh! card frame types
 */
export type YuGiOhFrameType =
  | 'normal'
  | 'effect'
  | 'ritual'
  | 'fusion'
  | 'synchro'
  | 'xyz'
  | 'link'
  | 'spell'
  | 'trap'
  | 'token'
  | 'skill';

/**
 * Monster attributes
 */
export type YuGiOhAttribute = 'DARK' | 'DIVINE' | 'EARTH' | 'FIRE' | 'LIGHT' | 'WATER' | 'WIND';

/**
 * Monster races (types in game terminology)
 */
export type YuGiOhRace =
  | 'Aqua'
  | 'Beast'
  | 'Beast-Warrior'
  | 'Creator-God'
  | 'Cyberse'
  | 'Dinosaur'
  | 'Divine-Beast'
  | 'Dragon'
  | 'Fairy'
  | 'Fiend'
  | 'Fish'
  | 'Illusion'
  | 'Insect'
  | 'Machine'
  | 'Plant'
  | 'Psychic'
  | 'Pyro'
  | 'Reptile'
  | 'Rock'
  | 'Sea Serpent'
  | 'Spellcaster'
  | 'Thunder'
  | 'Warrior'
  | 'Winged Beast'
  | 'Wyrm'
  | 'Zombie'
  // Spell/Trap races
  | 'Normal'
  | 'Field'
  | 'Equip'
  | 'Continuous'
  | 'Quick-Play'
  | 'Ritual'
  | 'Counter';

/**
 * Banlist status
 */
export type YuGiOhBanlistStatus = 'Banned' | 'Limited' | 'Semi-Limited' | 'Unlimited';

/**
 * Link markers for Link Monsters
 */
export type YuGiOhLinkMarker =
  | 'Top'
  | 'Bottom'
  | 'Left'
  | 'Right'
  | 'Top-Left'
  | 'Top-Right'
  | 'Bottom-Left'
  | 'Bottom-Right';

/**
 * Yu-Gi-Oh! card object
 */
export interface YuGiOhCard {
  // Core identifiers
  id: number; // Konami database ID (passcode)
  name: string;
  type: YuGiOhCardType;
  humanReadableCardType: string;
  frameType: YuGiOhFrameType;
  desc: string; // Card effect/flavor text

  // Monster-specific fields
  atk?: number;
  def?: number;
  level?: number;
  race: YuGiOhRace;
  attribute?: YuGiOhAttribute;

  // Pendulum monster fields
  scale?: number;

  // Link monster fields
  linkval?: number; // Link rating
  linkmarkers?: YuGiOhLinkMarker[];

  // Archetype
  archetype?: string;

  // Banlist info
  banlist_info?: {
    ban_tcg?: YuGiOhBanlistStatus;
    ban_ocg?: YuGiOhBanlistStatus;
    ban_goat?: YuGiOhBanlistStatus;
  };

  // Sets this card appears in
  card_sets?: YuGiOhCardSet[];

  // Images
  card_images: YuGiOhCardImage[];

  // Prices
  card_prices: YuGiOhCardPrices[];

  // External URL
  ygoprodeck_url: string;
}

/**
 * API response metadata
 */
export interface YuGiOhMeta {
  current_rows: number;
  total_rows: number;
  rows_remaining: number;
  total_pages: number;
  pages_remaining: number;
  next_page?: string;
  next_page_offset?: number;
}

/**
 * Card API response
 */
export interface YuGiOhCardResponse {
  data: YuGiOhCard[];
  meta?: YuGiOhMeta;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Monster attributes for filtering
 */
export const YUGIOH_ATTRIBUTES: Record<YuGiOhAttribute, string> = {
  DARK: 'Dark',
  DIVINE: 'Divine',
  EARTH: 'Earth',
  FIRE: 'Fire',
  LIGHT: 'Light',
  WATER: 'Water',
  WIND: 'Wind',
};

/**
 * Main monster races (types) for filtering
 */
export const YUGIOH_MONSTER_RACES: YuGiOhRace[] = [
  'Aqua',
  'Beast',
  'Beast-Warrior',
  'Creator-God',
  'Cyberse',
  'Dinosaur',
  'Divine-Beast',
  'Dragon',
  'Fairy',
  'Fiend',
  'Fish',
  'Illusion',
  'Insect',
  'Machine',
  'Plant',
  'Psychic',
  'Pyro',
  'Reptile',
  'Rock',
  'Sea Serpent',
  'Spellcaster',
  'Thunder',
  'Warrior',
  'Winged Beast',
  'Wyrm',
  'Zombie',
];

/**
 * Frame types for filtering (simplified card categories)
 */
export const YUGIOH_FRAME_TYPES: Record<YuGiOhFrameType, string> = {
  normal: 'Normal Monster',
  effect: 'Effect Monster',
  ritual: 'Ritual Monster',
  fusion: 'Fusion Monster',
  synchro: 'Synchro Monster',
  xyz: 'Xyz Monster',
  link: 'Link Monster',
  spell: 'Spell Card',
  trap: 'Trap Card',
  token: 'Token',
  skill: 'Skill Card',
};

/**
 * Rarity codes and display names
 */
export const YUGIOH_RARITIES: Record<string, { name: string; sortOrder: number }> = {
  C: { name: 'Common', sortOrder: 1 },
  R: { name: 'Rare', sortOrder: 2 },
  SR: { name: 'Super Rare', sortOrder: 3 },
  UR: { name: 'Ultra Rare', sortOrder: 4 },
  ScR: { name: 'Secret Rare', sortOrder: 5 },
  UScR: { name: 'Ultra Secret Rare', sortOrder: 6 },
  PScR: { name: 'Prismatic Secret Rare', sortOrder: 7 },
  GR: { name: 'Ghost Rare', sortOrder: 8 },
  CR: { name: "Collector's Rare", sortOrder: 9 },
  StR: { name: 'Starlight Rare', sortOrder: 10 },
  QCScR: { name: 'Quarter Century Secret Rare', sortOrder: 11 },
};

// =============================================================================
// SET API FUNCTIONS
// =============================================================================

/**
 * Get all Yu-Gi-Oh! card sets
 * Returns sets sorted by release date (newest first)
 */
export async function getAllSets(): Promise<YuGiOhSet[]> {
  const response = await fetchFromAPI<YuGiOhSet[]>('/cardsets.php', {
    next: { revalidate: 86400 }, // Cache for 24 hours
  });

  // Sort by release date (newest first), with null dates at the end
  return response.sort((a, b) => {
    if (!a.tcg_date && !b.tcg_date) return 0;
    if (!a.tcg_date) return 1;
    if (!b.tcg_date) return -1;
    return new Date(b.tcg_date).getTime() - new Date(a.tcg_date).getTime();
  });
}

/**
 * Get sets released within a date range
 */
export async function getSetsByDateRange(startDate: string, endDate: string): Promise<YuGiOhSet[]> {
  const allSets = await getAllSets();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return allSets.filter((set) => {
    if (!set.tcg_date) return false;
    const releaseTime = new Date(set.tcg_date).getTime();
    return releaseTime >= start && releaseTime <= end;
  });
}

/**
 * Get a single set by code
 */
export async function getSetByCode(setCode: string): Promise<YuGiOhSet | null> {
  const allSets = await getAllSets();
  return allSets.find((set) => set.set_code.toLowerCase() === setCode.toLowerCase()) || null;
}

/**
 * Search sets by name
 */
export async function searchSets(query: string): Promise<YuGiOhSet[]> {
  const allSets = await getAllSets();
  const lowerQuery = query.toLowerCase();
  return allSets.filter((set) => set.set_name.toLowerCase().includes(lowerQuery));
}

// =============================================================================
// CARD API FUNCTIONS
// =============================================================================

/**
 * Filter options for card search
 */
export interface YuGiOhFilterOptions {
  name?: string;
  fname?: string; // Fuzzy name search (contains)
  id?: number | number[];
  type?: YuGiOhCardType;
  atk?: number;
  def?: number;
  level?: number;
  race?: YuGiOhRace;
  attribute?: YuGiOhAttribute;
  link?: number;
  linkmarker?: YuGiOhLinkMarker | YuGiOhLinkMarker[];
  scale?: number;
  cardset?: string;
  archetype?: string;
  banlist?: 'tcg' | 'ocg' | 'goat';
  staple?: 'yes';
  format?: 'tcg' | 'ocg' | 'goat' | 'speed duel' | 'rush duel';
  sort?: 'atk' | 'def' | 'name' | 'type' | 'level' | 'id' | 'new';
  num?: number; // Results per page (max 30 recommended)
  offset?: number; // Pagination offset
}

/**
 * Build query string from filter options
 */
function buildQueryString(options: YuGiOhFilterOptions): string {
  const params = new URLSearchParams();

  if (options.name) params.append('name', options.name);
  if (options.fname) params.append('fname', options.fname);
  if (options.id) {
    if (Array.isArray(options.id)) {
      params.append('id', options.id.join(','));
    } else {
      params.append('id', String(options.id));
    }
  }
  if (options.type) params.append('type', options.type);
  if (options.atk !== undefined) params.append('atk', String(options.atk));
  if (options.def !== undefined) params.append('def', String(options.def));
  if (options.level !== undefined) params.append('level', String(options.level));
  if (options.race) params.append('race', options.race);
  if (options.attribute) params.append('attribute', options.attribute);
  if (options.link !== undefined) params.append('link', String(options.link));
  if (options.linkmarker) {
    if (Array.isArray(options.linkmarker)) {
      params.append('linkmarker', options.linkmarker.join(','));
    } else {
      params.append('linkmarker', options.linkmarker);
    }
  }
  if (options.scale !== undefined) params.append('scale', String(options.scale));
  if (options.cardset) params.append('cardset', options.cardset);
  if (options.archetype) params.append('archetype', options.archetype);
  if (options.banlist) params.append('banlist', options.banlist);
  if (options.staple) params.append('staple', options.staple);
  if (options.format) params.append('format', options.format);
  if (options.sort) params.append('sort', options.sort);
  if (options.num !== undefined) params.append('num', String(options.num));
  if (options.offset !== undefined) params.append('offset', String(options.offset));

  return params.toString();
}

/**
 * Get cards matching filter criteria
 */
export async function getCards(options: YuGiOhFilterOptions = {}): Promise<YuGiOhCard[]> {
  const queryString = buildQueryString(options);
  const endpoint = queryString ? `/cardinfo.php?${queryString}` : '/cardinfo.php';

  try {
    const response = await fetchFromAPI<YuGiOhCardResponse>(endpoint, {
      next: { revalidate: 172800 }, // Cache for 48 hours (API caches for 2 days)
    });
    return response.data;
  } catch (error) {
    // API returns error if no cards match
    if (error instanceof Error && error.message.includes('No card matching')) {
      return [];
    }
    throw error;
  }
}

/**
 * Get all cards in a set by set code
 */
export async function getCardsInSet(setCode: string): Promise<YuGiOhCard[]> {
  return getCards({ cardset: setCode });
}

/**
 * Get a single card by ID (Konami passcode)
 */
export async function getCardById(id: number): Promise<YuGiOhCard | null> {
  const cards = await getCards({ id });
  return cards[0] || null;
}

/**
 * Get multiple cards by IDs
 */
export async function getCardsByIds(ids: number[]): Promise<YuGiOhCard[]> {
  if (ids.length === 0) return [];

  // API supports comma-separated IDs
  // Batch in groups of 50 to avoid URL length issues
  const batchSize = 50;
  const results: YuGiOhCard[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const cards = await getCards({ id: batch });
    results.push(...cards);
  }

  return results;
}

/**
 * Get a single card by exact name
 */
export async function getCardByName(name: string): Promise<YuGiOhCard | null> {
  const cards = await getCards({ name });
  return cards[0] || null;
}

/**
 * Search cards by name (fuzzy match)
 */
export async function searchCards(query: string, limit = 20): Promise<YuGiOhCard[]> {
  const cards = await getCards({ fname: query, num: limit });
  return cards;
}

/**
 * Get cards by archetype
 */
export async function getCardsByArchetype(archetype: string): Promise<YuGiOhCard[]> {
  return getCards({ archetype });
}

/**
 * Get cards by type (monster type or spell/trap)
 */
export async function getCardsByType(type: YuGiOhCardType): Promise<YuGiOhCard[]> {
  return getCards({ type });
}

/**
 * Get cards by attribute
 */
export async function getCardsByAttribute(attribute: YuGiOhAttribute): Promise<YuGiOhCard[]> {
  return getCards({ attribute });
}

/**
 * Get cards by monster race (type in game terminology)
 */
export async function getCardsByRace(race: YuGiOhRace): Promise<YuGiOhCard[]> {
  return getCards({ race });
}

/**
 * Get a random card
 */
export async function getRandomCard(): Promise<YuGiOhCard> {
  const response = await fetchFromAPI<YuGiOhCardResponse>('/randomcard.php', {
    cache: 'no-store',
  });
  return response.data[0];
}

/**
 * Get all archetypes
 */
export async function getAllArchetypes(): Promise<string[]> {
  const response = await fetchFromAPI<{ archetype: string }[]>('/archetypes.php', {
    next: { revalidate: 86400 }, // Cache for 24 hours
  });
  return response.map((a) => a.archetype).sort();
}

/**
 * Get database version info for cache invalidation
 */
export async function getDatabaseVersion(): Promise<{
  database_version: string;
  last_update: string;
}> {
  const response = await fetchFromAPI<{ database_version: string; last_update: string }[]>(
    '/checkDBVer.php',
    { cache: 'no-store' }
  );
  return response[0];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a card is a monster card
 */
export function isMonsterCard(card: YuGiOhCard): boolean {
  return !['spell', 'trap', 'skill', 'token'].includes(card.frameType);
}

/**
 * Check if a card is a spell card
 */
export function isSpellCard(card: YuGiOhCard): boolean {
  return card.frameType === 'spell';
}

/**
 * Check if a card is a trap card
 */
export function isTrapCard(card: YuGiOhCard): boolean {
  return card.frameType === 'trap';
}

/**
 * Check if a card is an Extra Deck monster (Fusion, Synchro, Xyz, Link)
 */
export function isExtraDeckMonster(card: YuGiOhCard): boolean {
  return ['fusion', 'synchro', 'xyz', 'link'].includes(card.frameType);
}

/**
 * Check if a card is a Pendulum monster
 */
export function isPendulumMonster(card: YuGiOhCard): boolean {
  return card.type.toLowerCase().includes('pendulum');
}

/**
 * Get the primary image URL for a card
 */
export function getCardImage(
  card: YuGiOhCard,
  size: 'full' | 'small' | 'cropped' = 'full'
): string {
  const image = card.card_images[0];
  if (!image) return '';

  switch (size) {
    case 'small':
      return image.image_url_small;
    case 'cropped':
      return image.image_url_cropped;
    default:
      return image.image_url;
  }
}

/**
 * Get all image variants for a card (alternate artworks)
 */
export function getCardImageVariants(card: YuGiOhCard): YuGiOhCardImage[] {
  return card.card_images;
}

/**
 * Get the TCGPlayer price for a card (returns null if unavailable)
 */
export function getTCGPlayerPrice(card: YuGiOhCard): number | null {
  const prices = card.card_prices[0];
  if (!prices?.tcgplayer_price) return null;
  const price = parseFloat(prices.tcgplayer_price);
  return isNaN(price) || price === 0 ? null : price;
}

/**
 * Get the Cardmarket price for a card (returns null if unavailable)
 */
export function getCardmarketPrice(card: YuGiOhCard): number | null {
  const prices = card.card_prices[0];
  if (!prices?.cardmarket_price) return null;
  const price = parseFloat(prices.cardmarket_price);
  return isNaN(price) || price === 0 ? null : price;
}

/**
 * Get price from a specific set printing
 */
export function getSetPrice(card: YuGiOhCard, setCode: string): number | null {
  const cardSet = card.card_sets?.find((s) => s.set_code.toLowerCase() === setCode.toLowerCase());
  if (!cardSet?.set_price) return null;
  const price = parseFloat(cardSet.set_price);
  return isNaN(price) || price === 0 ? null : price;
}

/**
 * Get all set printings for a card
 */
export function getCardSets(card: YuGiOhCard): YuGiOhCardSet[] {
  return card.card_sets || [];
}

/**
 * Get the rarity display name from a rarity code
 */
export function getRarityDisplayName(rarityCode: string): string {
  return YUGIOH_RARITIES[rarityCode]?.name || rarityCode;
}

/**
 * Get a unique identifier for a card in our system
 * Uses the Konami passcode/ID
 */
export function getCardDexId(card: YuGiOhCard): string {
  return String(card.id);
}

/**
 * Get a unique identifier for a specific card printing
 * Format: "{id}-{set_code}" (e.g., "46986414-LOB-001")
 */
export function getCardPrintingId(card: YuGiOhCard, setCode: string): string {
  return `${card.id}-${setCode}`;
}

/**
 * Get the attribute display name
 */
export function getAttributeDisplayName(attribute: YuGiOhAttribute): string {
  return YUGIOH_ATTRIBUTES[attribute] || attribute;
}

/**
 * Get the frame type display name
 */
export function getFrameTypeDisplayName(frameType: YuGiOhFrameType): string {
  return YUGIOH_FRAME_TYPES[frameType] || frameType;
}

/**
 * Check if a card is banned in TCG
 */
export function isBannedTCG(card: YuGiOhCard): boolean {
  return card.banlist_info?.ban_tcg === 'Banned';
}

/**
 * Check if a card is limited in TCG
 */
export function isLimitedTCG(card: YuGiOhCard): boolean {
  return card.banlist_info?.ban_tcg === 'Limited';
}

/**
 * Check if a card is semi-limited in TCG
 */
export function isSemiLimitedTCG(card: YuGiOhCard): boolean {
  return card.banlist_info?.ban_tcg === 'Semi-Limited';
}

/**
 * Get the TCG banlist status for a card
 */
export function getTCGBanlistStatus(card: YuGiOhCard): YuGiOhBanlistStatus {
  return card.banlist_info?.ban_tcg || 'Unlimited';
}

/**
 * Get monster stats as a formatted string (ATK/DEF or ATK/LINK for Link monsters)
 */
export function getMonsterStats(card: YuGiOhCard): string | null {
  if (!isMonsterCard(card)) return null;

  if (card.frameType === 'link') {
    return `ATK/${card.atk ?? '?'} LINK-${card.linkval ?? '?'}`;
  }

  return `ATK/${card.atk ?? '?'} DEF/${card.def ?? '?'}`;
}

/**
 * Get monster level/rank/link as a formatted string
 */
export function getMonsterLevel(card: YuGiOhCard): string | null {
  if (!isMonsterCard(card)) return null;

  if (card.frameType === 'xyz') {
    return `Rank ${card.level ?? '?'}`;
  }

  if (card.frameType === 'link') {
    return `Link ${card.linkval ?? '?'}`;
  }

  return `Level ${card.level ?? '?'}`;
}

/**
 * Format card type line (similar to MTG type line)
 * e.g., "DARK Dragon/Synchro/Effect" or "Spell Card - Continuous"
 */
export function formatTypeLine(card: YuGiOhCard): string {
  if (isMonsterCard(card)) {
    const parts: string[] = [];
    if (card.attribute) parts.push(card.attribute);
    parts.push(card.race);
    // Extract monster type info from humanReadableCardType
    const typeInfo = card.humanReadableCardType.replace('Monster', '').trim();
    if (typeInfo) parts.push(typeInfo);
    return parts.join(' / ');
  }

  // Spell/Trap
  return `${card.frameType.charAt(0).toUpperCase() + card.frameType.slice(1)} Card - ${card.race}`;
}
