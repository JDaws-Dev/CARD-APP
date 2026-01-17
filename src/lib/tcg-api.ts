/**
 * Game-Agnostic TCG API Abstraction
 *
 * This module provides a unified interface for fetching card data from multiple
 * trading card game APIs. It routes requests to the appropriate game-specific
 * adapter based on the game slug.
 *
 * Supported Games:
 * - pokemon: Pokemon TCG (pokemontcg.io)
 * - yugioh: Yu-Gi-Oh! (ygoprodeck.com)
 * - onepiece: One Piece TCG (optcg-api)
 * - lorcana: Disney Lorcana (lorcast.com)
 */

// Import game-specific adapters
import * as pokemonApi from './pokemon-tcg';
import * as yugiohApi from './yugioh-api';
import * as onepieceApi from './onepiece-api';
import * as lorcanaApi from './lorcana-api';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Supported game slugs
 */
export type GameSlug = 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana';

/**
 * Game configuration
 */
export interface GameConfig {
  slug: GameSlug;
  displayName: string;
  apiSource: string;
  primaryColor: string;
  secondaryColor: string;
  releaseOrder: number;
  isActive: boolean;
}

/**
 * Unified card interface that normalizes data across all games
 */
export interface UnifiedCard {
  // Core identifiers
  id: string; // Unique card ID within the game (e.g., "sv1-1", "BT1-001")
  dexId: string; // Global unique ID prefixed with game (e.g., "pokemon-sv1-1")
  game: GameSlug;

  // Display info
  name: string;
  imageSmall: string | null;
  imageLarge: string | null;

  // Set info
  setId: string;
  setName: string;
  collectorNumber: string;

  // Card properties
  rarity: string | null;
  type: string; // Card type (Pokemon, Monster, Character, etc.)

  // Pricing (USD)
  priceNormal: number | null;
  priceFoil: number | null;

  // Original data for game-specific features
  originalData: unknown;
}

/**
 * Unified set interface
 */
export interface UnifiedSet {
  id: string; // Set ID within the game
  dexId: string; // Global unique ID prefixed with game
  game: GameSlug;
  name: string;
  code: string;
  cardCount: number;
  releaseDate: string | null;
  iconUrl: string | null;
  originalData: unknown;
}

/**
 * Search options for cards
 */
export interface CardSearchOptions {
  name?: string;
  setId?: string;
  rarity?: string;
  type?: string;
  limit?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Game configurations with display info and API sources
 */
export const GAME_CONFIGS: Record<GameSlug, GameConfig> = {
  pokemon: {
    slug: 'pokemon',
    displayName: 'Pokémon TCG',
    apiSource: 'pokemontcg.io',
    primaryColor: '#FFCB05',
    secondaryColor: '#3466AF',
    releaseOrder: 1,
    isActive: true,
  },
  yugioh: {
    slug: 'yugioh',
    displayName: 'Yu-Gi-Oh!',
    apiSource: 'ygoprodeck.com',
    primaryColor: '#1D1D1D',
    secondaryColor: '#B8860B',
    releaseOrder: 2,
    isActive: true,
  },
  onepiece: {
    slug: 'onepiece',
    displayName: 'One Piece TCG',
    apiSource: 'optcg-api',
    primaryColor: '#E74C3C',
    secondaryColor: '#3498DB',
    releaseOrder: 3,
    isActive: true,
  },
  lorcana: {
    slug: 'lorcana',
    displayName: 'Disney Lorcana',
    apiSource: 'lorcast.com',
    primaryColor: '#1B1464',
    secondaryColor: '#F5A623',
    releaseOrder: 4,
    isActive: true,
  },
};

/**
 * All supported game slugs
 */
export const GAME_SLUGS: GameSlug[] = ['pokemon', 'yugioh', 'onepiece', 'lorcana'];

/**
 * Active games sorted by release order
 */
export const ACTIVE_GAMES: GameSlug[] = GAME_SLUGS.filter(
  (slug) => GAME_CONFIGS[slug].isActive
).sort((a, b) => GAME_CONFIGS[a].releaseOrder - GAME_CONFIGS[b].releaseOrder);

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Check if a string is a valid game slug
 */
export function isValidGameSlug(slug: string): slug is GameSlug {
  return GAME_SLUGS.includes(slug as GameSlug);
}

/**
 * Get game config by slug (throws if invalid)
 */
export function getGameConfig(slug: GameSlug): GameConfig {
  const config = GAME_CONFIGS[slug];
  if (!config) {
    throw new Error(`Invalid game slug: ${slug}`);
  }
  return config;
}

/**
 * Get game config by slug (returns null if invalid)
 */
export function getGameConfigSafe(slug: string): GameConfig | null {
  if (!isValidGameSlug(slug)) return null;
  return GAME_CONFIGS[slug];
}

// =============================================================================
// CARD NORMALIZATION FUNCTIONS
// =============================================================================

/**
 * Convert Pokemon card to unified format
 */
function normalizePokemonCard(card: pokemonApi.PokemonCard): UnifiedCard {
  return {
    id: card.id,
    dexId: `pokemon-${card.id}`,
    game: 'pokemon',
    name: card.name,
    imageSmall: card.images.small,
    imageLarge: card.images.large,
    setId: card.set.id,
    setName: card.set.name,
    collectorNumber: card.number,
    rarity: card.rarity || null,
    type: card.supertype,
    priceNormal: card.tcgplayer?.prices?.normal?.market ?? null,
    priceFoil: card.tcgplayer?.prices?.holofoil?.market ?? null,
    originalData: card,
  };
}

/**
 * Convert Yu-Gi-Oh! card to unified format
 */
function normalizeYugiohCard(card: yugiohApi.YuGiOhCard): UnifiedCard {
  const image = yugiohApi.getCardImage(card, 'small');
  const imageLarge = yugiohApi.getCardImage(card, 'full');
  const price = yugiohApi.getTCGPlayerPrice(card);

  // Yu-Gi-Oh! cards can appear in multiple sets, use first set if available
  const firstSet = card.card_sets?.[0];

  return {
    id: String(card.id),
    dexId: `yugioh-${card.id}`,
    game: 'yugioh',
    name: card.name,
    imageSmall: image,
    imageLarge: imageLarge,
    setId: firstSet?.set_code ?? '',
    setName: firstSet?.set_name ?? '',
    collectorNumber: firstSet?.set_code ?? String(card.id),
    rarity: firstSet?.set_rarity ?? null,
    type: card.type,
    priceNormal: price,
    priceFoil: null, // Yu-Gi-Oh! doesn't have standard foil pricing
    originalData: card,
  };
}

/**
 * Convert One Piece card to unified format
 */
function normalizeOnepieceCard(card: onepieceApi.OnePieceCard): UnifiedCard {
  const setCode = onepieceApi.extractSetCode(card.code);
  const cardNumber = onepieceApi.extractCardNumber(card.code);

  return {
    id: card.code,
    dexId: onepieceApi.getCardDexId(card),
    game: 'onepiece',
    name: card.name,
    imageSmall: card.image,
    imageLarge: card.image,
    setId: setCode,
    setName: card.set,
    collectorNumber: cardNumber,
    rarity: card.rarity,
    type: card.type,
    priceNormal: null, // OPTCG API doesn't provide pricing
    priceFoil: null,
    originalData: card,
  };
}

/**
 * Convert Lorcana card to unified format
 */
function normalizeLorcanaCard(card: lorcanaApi.LorcanaCard): UnifiedCard {
  const priceNormal = lorcanaApi.getMarketPrice(card, false);
  const priceFoil = lorcanaApi.getMarketPrice(card, true);

  return {
    id: `${card.set.code}-${card.collector_number}`,
    dexId: lorcanaApi.getCardDexId(card),
    game: 'lorcana',
    name: lorcanaApi.getFullCardName(card),
    imageSmall: lorcanaApi.getCardImage(card, 'small'),
    imageLarge: lorcanaApi.getCardImage(card, 'large'),
    setId: card.set.code,
    setName: card.set.name,
    collectorNumber: card.collector_number,
    rarity: card.rarity,
    type: card.type.join('/'),
    priceNormal: priceNormal,
    priceFoil: priceFoil,
    originalData: card,
  };
}

// =============================================================================
// SET NORMALIZATION FUNCTIONS
// =============================================================================

/**
 * Convert Pokemon set to unified format
 */
function normalizePokemonSet(set: pokemonApi.PokemonSet): UnifiedSet {
  return {
    id: set.id,
    dexId: `pokemon-${set.id}`,
    game: 'pokemon',
    name: set.name,
    code: set.id,
    cardCount: set.total,
    releaseDate: set.releaseDate,
    iconUrl: set.images.symbol,
    originalData: set,
  };
}

/**
 * Convert Yu-Gi-Oh! set to unified format
 */
function normalizeYugiohSet(set: yugiohApi.YuGiOhSet): UnifiedSet {
  return {
    id: set.set_code,
    dexId: `yugioh-${set.set_code}`,
    game: 'yugioh',
    name: set.set_name,
    code: set.set_code,
    cardCount: set.num_of_cards,
    releaseDate: set.tcg_date,
    iconUrl: set.set_image ?? null,
    originalData: set,
  };
}

/**
 * Convert One Piece set to unified format
 */
function normalizeOnepieceSet(set: onepieceApi.OnePieceSet): UnifiedSet {
  return {
    id: set.code,
    dexId: `onepiece-${set.code}`,
    game: 'onepiece',
    name: set.name,
    code: set.code,
    cardCount: set.cardCount,
    releaseDate: null, // OPTCG API doesn't provide release dates for sets
    iconUrl: null,
    originalData: set,
  };
}

/**
 * Convert Lorcana set to unified format
 */
function normalizeLorcanaSet(set: lorcanaApi.LorcanaSet): UnifiedSet {
  return {
    id: set.code,
    dexId: `lorcana-${set.code}`,
    game: 'lorcana',
    name: set.name,
    code: set.code,
    cardCount: 0, // Lorcast doesn't include card count in set response
    releaseDate: set.released_at,
    iconUrl: null,
    originalData: set,
  };
}

// =============================================================================
// UNIFIED API FUNCTIONS
// =============================================================================

/**
 * Get all sets for a game
 */
export async function getSets(game: GameSlug): Promise<UnifiedSet[]> {
  switch (game) {
    case 'pokemon': {
      const sets = await pokemonApi.getAllSupportedSets();
      return sets.map(normalizePokemonSet);
    }
    case 'yugioh': {
      const sets = await yugiohApi.getAllSets();
      return sets.map(normalizeYugiohSet);
    }
    case 'onepiece': {
      const sets = await onepieceApi.getAllSets();
      return sets.map(normalizeOnepieceSet);
    }
    case 'lorcana': {
      const sets = await lorcanaApi.getAllSets();
      return sets.map(normalizeLorcanaSet);
    }
    default:
      throw new Error(`Unsupported game: ${game}`);
  }
}

/**
 * Get a single set by ID
 */
export async function getSet(game: GameSlug, setId: string): Promise<UnifiedSet | null> {
  switch (game) {
    case 'pokemon': {
      try {
        const set = await pokemonApi.getSet(setId);
        return normalizePokemonSet(set);
      } catch {
        return null;
      }
    }
    case 'yugioh': {
      const set = await yugiohApi.getSetByCode(setId);
      return set ? normalizeYugiohSet(set) : null;
    }
    case 'onepiece': {
      const set = await onepieceApi.getSetByCode(setId);
      return set ? normalizeOnepieceSet(set) : null;
    }
    case 'lorcana': {
      try {
        const set = await lorcanaApi.getSetByCode(setId);
        return normalizeLorcanaSet(set);
      } catch {
        return null;
      }
    }
    default:
      throw new Error(`Unsupported game: ${game}`);
  }
}

/**
 * Get all cards in a set
 */
export async function getCardsInSet(game: GameSlug, setId: string): Promise<UnifiedCard[]> {
  switch (game) {
    case 'pokemon': {
      const cards = await pokemonApi.getCardsInSet(setId);
      return cards.map(normalizePokemonCard);
    }
    case 'yugioh': {
      const cards = await yugiohApi.getCardsInSet(setId);
      return cards.map(normalizeYugiohCard);
    }
    case 'onepiece': {
      const cards = await onepieceApi.getCardsInSet(setId);
      return cards.map(normalizeOnepieceCard);
    }
    case 'lorcana': {
      const cards = await lorcanaApi.getCardsInSet(setId);
      return cards.map(normalizeLorcanaCard);
    }
    default:
      throw new Error(`Unsupported game: ${game}`);
  }
}

/**
 * Get a single card by ID
 */
export async function getCard(game: GameSlug, cardId: string): Promise<UnifiedCard | null> {
  switch (game) {
    case 'pokemon': {
      try {
        const card = await pokemonApi.getCard(cardId);
        return normalizePokemonCard(card);
      } catch {
        return null;
      }
    }
    case 'yugioh': {
      const card = await yugiohApi.getCardById(parseInt(cardId, 10));
      return card ? normalizeYugiohCard(card) : null;
    }
    case 'onepiece': {
      const card = await onepieceApi.getCardById(cardId);
      return card ? normalizeOnepieceCard(card) : null;
    }
    case 'lorcana': {
      // Lorcana uses set code and collector number
      const parsed = lorcanaApi.parseCardDexId(`lorcana-${cardId}`);
      if (!parsed) return null;
      try {
        const card = await lorcanaApi.getCardBySetAndNumber(parsed.setCode, parsed.collectorNumber);
        return normalizeLorcanaCard(card);
      } catch {
        return null;
      }
    }
    default:
      throw new Error(`Unsupported game: ${game}`);
  }
}

/**
 * Search cards by name
 */
export async function searchCards(
  game: GameSlug,
  query: string,
  limit = 20
): Promise<UnifiedCard[]> {
  switch (game) {
    case 'pokemon': {
      const cards = await pokemonApi.searchCards(query, limit);
      return cards.map(normalizePokemonCard);
    }
    case 'yugioh': {
      const cards = await yugiohApi.searchCards(query, limit);
      return cards.map(normalizeYugiohCard);
    }
    case 'onepiece': {
      const cards = await onepieceApi.searchCards(query, limit);
      return cards.map(normalizeOnepieceCard);
    }
    case 'lorcana': {
      const cards = await lorcanaApi.searchCardsByName(query, limit);
      return cards.map(normalizeLorcanaCard);
    }
    default:
      throw new Error(`Unsupported game: ${game}`);
  }
}

/**
 * Get multiple cards by IDs
 */
export async function getCardsByIds(game: GameSlug, cardIds: string[]): Promise<UnifiedCard[]> {
  if (cardIds.length === 0) return [];

  switch (game) {
    case 'pokemon': {
      const cards = await pokemonApi.getCardsByIds(cardIds);
      return cards.map(normalizePokemonCard);
    }
    case 'yugioh': {
      const numericIds = cardIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));
      const cards = await yugiohApi.getCardsByIds(numericIds);
      return cards.map(normalizeYugiohCard);
    }
    case 'onepiece': {
      const cards = await onepieceApi.getCardsByCode(cardIds);
      return cards.map(normalizeOnepieceCard);
    }
    case 'lorcana': {
      // Lorcana requires set+number, batch fetch not supported efficiently
      const results: UnifiedCard[] = [];
      for (const cardId of cardIds) {
        const card = await getCard(game, cardId);
        if (card) results.push(card);
      }
      return results;
    }
    default:
      throw new Error(`Unsupported game: ${game}`);
  }
}

// =============================================================================
// DEX ID UTILITIES
// =============================================================================

/**
 * Parse a dexId to extract game and card ID
 */
export function parseDexId(dexId: string): { game: GameSlug; cardId: string } | null {
  const parts = dexId.split('-');
  if (parts.length < 2) return null;

  const gameStr = parts[0];
  if (!isValidGameSlug(gameStr)) return null;

  const cardId = parts.slice(1).join('-');
  return { game: gameStr, cardId };
}

/**
 * Create a dexId from game and card ID
 */
export function createDexId(game: GameSlug, cardId: string): string {
  return `${game}-${cardId}`;
}

/**
 * Get a card by its global dexId
 */
export async function getCardByDexId(dexId: string): Promise<UnifiedCard | null> {
  const parsed = parseDexId(dexId);
  if (!parsed) return null;

  return getCard(parsed.game, parsed.cardId);
}

/**
 * Get a set by its global dexId
 */
export async function getSetByDexId(dexId: string): Promise<UnifiedSet | null> {
  const parts = dexId.split('-');
  if (parts.length < 2) return null;

  const gameStr = parts[0];
  if (!isValidGameSlug(gameStr)) return null;

  const setId = parts.slice(1).join('-');
  return getSet(gameStr, setId);
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Get display name for a game
 */
export function getGameDisplayName(game: GameSlug): string {
  return GAME_CONFIGS[game]?.displayName ?? game;
}

/**
 * Get primary color for a game
 */
export function getGamePrimaryColor(game: GameSlug): string {
  return GAME_CONFIGS[game]?.primaryColor ?? '#000000';
}

/**
 * Get all active games sorted by release order
 */
export function getActiveGames(): GameConfig[] {
  return ACTIVE_GAMES.map((slug) => GAME_CONFIGS[slug]);
}

/**
 * Get game config from a dexId
 */
export function getGameFromDexId(dexId: string): GameConfig | null {
  const parsed = parseDexId(dexId);
  if (!parsed) return null;
  return GAME_CONFIGS[parsed.game] ?? null;
}
