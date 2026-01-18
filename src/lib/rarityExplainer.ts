/**
 * Rarity Explainer - Educational content and utilities for understanding card rarities
 * Provides kid-friendly explanations, matching logic, and display helpers for each rarity tier.
 *
 * This module contains pure utility functions that complement the Convex queries
 * in convex/rarityDefinitions.ts. Use these functions for client-side operations.
 *
 * Supports multiple TCGs: Pokemon, Yu-Gi-Oh!, One Piece, and Disney Lorcana.
 */

import type { GameId } from './gameSelector';

// ============================================================================
// TYPES
// ============================================================================

export interface RarityInfo {
  /** Unique identifier for the rarity tier */
  id: string;
  /** Display name */
  name: string;
  /** Short abbreviation (C, U, R, etc.) */
  shortName: string;
  /** Symbol used on the card (circle, diamond, star, etc.) */
  symbol: string;
  /** Kid-friendly description of this rarity */
  description: string;
  /** Examples of cards in this rarity tier */
  examples: string[];
  /** How often these cards appear in packs (kid-friendly) */
  pullRate: string;
  /** Helpful collecting advice for kids */
  collectorTip: string;
  /** Sort order for rarity filtering (lower = more common) */
  sortOrder: number;
  /** CSS color class for UI display */
  colorClass: string;
  /** Emoji icon for UI */
  icon: string;
  /** API rarity values that map to this tier */
  apiMatches: string[];
}

export interface RarityTooltipData {
  title: string;
  description: string;
  tip: string;
  pullRate?: string;
  examples?: string[];
}

export interface RarityDistributionItem {
  rarity: RarityInfo;
  count: number;
  percentage: number;
}

export interface RarityStats {
  totalCards: number;
  distribution: RarityDistributionItem[];
  mostCommonRarity: RarityInfo | null;
  rarestCard: RarityInfo | null;
  averageRarity: number;
}

// ============================================================================
// POKEMON RARITY DEFINITIONS
// ============================================================================

/**
 * Pokemon TCG rarity information.
 * Sorted from most common (sortOrder 1) to most rare (sortOrder 6).
 */
export const POKEMON_RARITY_EXPLAINERS: readonly RarityInfo[] = [
  {
    id: 'common',
    name: 'Common',
    shortName: 'C',
    symbol: '●',
    description: 'The most frequently found cards in packs. Great for building your collection!',
    examples: ['Basic Pokémon', 'Trainer Items', 'Energy cards', 'Useful attack basics'],
    pullRate: 'Found in almost every pack (about 6-7 per pack)',
    collectorTip: 'Common cards are perfect for trading with friends!',
    sortOrder: 1,
    colorClass: 'text-gray-500',
    icon: '⚫',
    apiMatches: ['common'],
  },
  {
    id: 'uncommon',
    name: 'Uncommon',
    shortName: 'U',
    symbol: '◆',
    description:
      'A step up from common cards. These are a bit harder to find but still appear regularly.',
    examples: ['Stage 1 Pokémon', 'Supporter cards', 'Special Items', 'Evolution cards'],
    pullRate: 'Usually 2-3 per pack',
    collectorTip: 'Watch for uncommon cards with useful abilities for your deck!',
    sortOrder: 2,
    colorClass: 'text-green-600',
    icon: '💎',
    apiMatches: ['uncommon'],
  },
  {
    id: 'rare',
    name: 'Rare',
    shortName: 'R',
    symbol: '★',
    description:
      'Special cards with a star symbol. Holofoil rare cards have a shiny, sparkly look!',
    examples: ['Holographic cards', 'Stage 2 Pokémon', 'Powerful Trainers', 'Rare holo basics'],
    pullRate: 'About 1 per pack (regular) or 1 in 3 packs (holo)',
    collectorTip: 'Keep your rare holos in sleeves to protect them!',
    sortOrder: 3,
    colorClass: 'text-yellow-500',
    icon: '⭐',
    apiMatches: ['rare', 'rare holo', 'rare ace'],
  },
  {
    id: 'ultra-rare',
    name: 'Ultra Rare',
    shortName: 'UR',
    symbol: '★★',
    description:
      'Powerful and beautiful cards featuring special Pokémon like EX, GX, V, VMAX, and ex!',
    examples: [
      'Pokémon EX/GX',
      'Pokémon V/VMAX/VSTAR',
      'Full Art cards',
      'Pokémon ex',
      'Tera Pokémon ex',
    ],
    pullRate: 'About 1 in every 5-8 packs',
    collectorTip: 'Ultra rares are often valuable - consider double sleeving!',
    sortOrder: 4,
    colorClass: 'text-purple-500',
    icon: '🌟',
    apiMatches: [
      'rare ultra',
      'rare holo vmax',
      'rare holo vstar',
      'rare v',
      'rare vmax',
      'rare vstar',
      'rare holo v',
      'rare holo ex',
      'double rare',
      'ultra rare',
    ],
  },
  {
    id: 'secret-rare',
    name: 'Secret Rare',
    shortName: 'SR',
    symbol: '★★★',
    description:
      'The rarest cards in a set! Numbered higher than the set size with stunning artwork.',
    examples: [
      'Gold cards',
      'Rainbow rare cards',
      'Alt Art/Special Art cards',
      'Special Illustration Rare',
      'Hyper Rare',
    ],
    pullRate: 'Very rare - about 1 in 20+ packs',
    collectorTip: 'Secret rares are highly collectible and often worth the most!',
    sortOrder: 5,
    colorClass: 'text-orange-500',
    icon: '🏆',
    apiMatches: [
      'rare secret',
      'rare rainbow',
      'rare shiny gx',
      'rare shiny',
      'rare prism star',
      'special art rare',
      'illustration rare',
      'shiny rare',
      'hyper rare',
      'amazing rare',
      'ace spec rare',
    ],
  },
  {
    id: 'promo',
    name: 'Promo',
    shortName: 'P',
    symbol: 'PROMO',
    description:
      "Special cards given away at events, in boxes, or with products. Can't be found in regular packs!",
    examples: [
      'Event exclusives',
      'Box toppers',
      'Build & Battle promos',
      "McDonald's cards",
      'Championship promos',
    ],
    pullRate: "Only from special products or events - you can't pull these in regular packs!",
    collectorTip: 'Promo cards are great conversation starters and can be rare collectibles!',
    sortOrder: 6,
    colorClass: 'text-blue-500',
    icon: '🎁',
    apiMatches: ['promo', 'classic collection'],
  },
] as const;

// ============================================================================
// YU-GI-OH! RARITY DEFINITIONS
// ============================================================================

/**
 * Yu-Gi-Oh! TCG rarity information.
 * Covers standard rarities plus popular special rarities.
 */
export const YUGIOH_RARITY_EXPLAINERS: readonly RarityInfo[] = [
  {
    id: 'common',
    name: 'Common',
    shortName: 'C',
    symbol: 'C',
    description: 'Standard cards with no special features. Essential for building your collection!',
    examples: ['Basic monsters', 'Common spells', 'Trap cards', 'Useful deck staples'],
    pullRate: 'Found in almost every pack (about 5-6 per pack)',
    collectorTip: 'Commons are great for deck building and trading with friends!',
    sortOrder: 1,
    colorClass: 'text-gray-500',
    icon: '⚫',
    apiMatches: ['common', 'c'],
  },
  {
    id: 'rare',
    name: 'Rare',
    shortName: 'R',
    symbol: 'R',
    description: 'Cards with silver or black holofoil lettering on the card name.',
    examples: ['Effect monsters', 'Useful spells', 'Popular trap cards'],
    pullRate: 'About 1 per pack',
    collectorTip: 'Rares often have solid effects - keep ones you might use in decks!',
    sortOrder: 2,
    colorClass: 'text-slate-600',
    icon: '🔘',
    apiMatches: ['rare', 'r'],
  },
  {
    id: 'super-rare',
    name: 'Super Rare',
    shortName: 'SR',
    symbol: 'SR',
    description: 'Cards with holographic artwork but a non-foil card name. The art sparkles!',
    examples: ['Popular monsters', 'Key spell cards', 'Iconic trap cards'],
    pullRate: 'About 1 in every 4-5 packs',
    collectorTip: 'Super Rares look amazing - the holo art really catches the light!',
    sortOrder: 3,
    colorClass: 'text-blue-500',
    icon: '💎',
    apiMatches: ['super rare', 'sr', 'super'],
  },
  {
    id: 'ultra-rare',
    name: 'Ultra Rare',
    shortName: 'UR',
    symbol: 'UR',
    description: 'Cards with both holographic artwork AND gold foil card name. Double the shine!',
    examples: ['Boss monsters', 'Powerful spells', 'Game-changing traps', 'Archetype aces'],
    pullRate: 'About 1 in every 6-8 packs',
    collectorTip: 'Ultra Rares are highly collectible - the gold name makes them stand out!',
    sortOrder: 4,
    colorClass: 'text-yellow-500',
    icon: '⭐',
    apiMatches: ['ultra rare', 'ur', 'ultra'],
  },
  {
    id: 'secret-rare',
    name: 'Secret Rare',
    shortName: 'ScR',
    symbol: 'ScR',
    description: 'Premium cards with diagonal holographic foil on both the name AND artwork!',
    examples: ['Blue-Eyes White Dragon', 'Dark Magician', 'Chase cards', 'Set mascots'],
    pullRate: 'About 1 in every 12-15 packs',
    collectorTip: 'Secret Rares have that unique diagonal sparkle - very collectible!',
    sortOrder: 5,
    colorClass: 'text-purple-500',
    icon: '🌟',
    apiMatches: ['secret rare', 'scr', 'secret'],
  },
  {
    id: 'ultimate-rare',
    name: 'Ultimate Rare',
    shortName: 'UtR',
    symbol: 'UtR',
    description: 'Cards with raised, textured foil on the art, text box, and name. You can feel the embossing!',
    examples: ['Fan favorite monsters', 'Classic cards', 'Collector chase cards'],
    pullRate: 'Very rare - about 1 in every 20+ packs',
    collectorTip: 'Ultimate Rares have a 3D feel - handle with care, they\'re special!',
    sortOrder: 6,
    colorClass: 'text-orange-500',
    icon: '🏆',
    apiMatches: ['ultimate rare', 'utr', 'ultimate'],
  },
  {
    id: 'ghost-rare',
    name: 'Ghost Rare',
    shortName: 'GR',
    symbol: 'GR',
    description: 'Ultra-rare cards with ghostly, almost transparent 3D artwork. Magical and mysterious!',
    examples: ['Stardust Dragon', 'Rainbow Dragon', 'Set mascot monsters'],
    pullRate: 'Extremely rare - about 1 in every 2 boxes',
    collectorTip: 'Ghost Rares look different depending on the light - truly unique!',
    sortOrder: 7,
    colorClass: 'text-cyan-400',
    icon: '👻',
    apiMatches: ['ghost rare', 'gr', 'ghost'],
  },
  {
    id: 'starlight-rare',
    name: 'Starlight Rare',
    shortName: 'StR',
    symbol: 'StR',
    description: 'The rarest standard rarity! Full-card rainbow foil with vertical sparkle lines.',
    examples: ['Popular meta cards', 'Fan favorite monsters', 'High-demand reprints'],
    pullRate: 'Incredibly rare - about 1 per sealed case',
    collectorTip: 'Starlight Rares are the crown jewels - worth protecting in top loaders!',
    sortOrder: 8,
    colorClass: 'text-pink-500',
    icon: '✨',
    apiMatches: ['starlight rare', 'str', 'starlight'],
  },
] as const;

// ============================================================================
// ONE PIECE RARITY DEFINITIONS
// ============================================================================

/**
 * One Piece Card Game rarity information.
 * Includes standard rarities plus special card types.
 */
export const ONEPIECE_RARITY_EXPLAINERS: readonly RarityInfo[] = [
  {
    id: 'common',
    name: 'Common',
    shortName: 'C',
    symbol: 'C',
    description: 'Your everyday crew members! These cards form the backbone of any deck.',
    examples: ['Straw Hat crew', 'Marine soldiers', 'Basic characters', 'Events'],
    pullRate: 'Found in every pack (about 8 per pack)',
    collectorTip: 'Commons are perfect for building themed decks around your favorite crews!',
    sortOrder: 1,
    colorClass: 'text-gray-500',
    icon: '⚫',
    apiMatches: ['common', 'c'],
  },
  {
    id: 'uncommon',
    name: 'Uncommon',
    shortName: 'UC',
    symbol: 'UC',
    description: 'Slightly harder to find crew members with useful abilities.',
    examples: ['Supporting characters', 'Stage cards', 'Key events'],
    pullRate: 'About 3-4 per pack',
    collectorTip: 'Uncommons often have great synergy with your deck strategy!',
    sortOrder: 2,
    colorClass: 'text-green-600',
    icon: '💎',
    apiMatches: ['uncommon', 'uc'],
  },
  {
    id: 'rare',
    name: 'Rare',
    shortName: 'R',
    symbol: 'R',
    description: 'Powerful crew members with strong abilities. Features nice artwork!',
    examples: ['Key Straw Hats', 'Important villains', 'Powerful events'],
    pullRate: 'About 1-2 per pack',
    collectorTip: 'Rares are great for trading and building competitive decks!',
    sortOrder: 3,
    colorClass: 'text-yellow-500',
    icon: '⭐',
    apiMatches: ['rare', 'r'],
  },
  {
    id: 'super-rare',
    name: 'Super Rare',
    shortName: 'SR',
    symbol: 'SR',
    description: 'Highly sought-after cards with premium artwork and powerful effects!',
    examples: ['Luffy', 'Zoro', 'Ace', 'Key story moments'],
    pullRate: 'About 1 in every 4-6 packs',
    collectorTip: 'Super Rares are deck centerpieces - protect them in sleeves!',
    sortOrder: 4,
    colorClass: 'text-purple-500',
    icon: '🌟',
    apiMatches: ['super rare', 'sr'],
  },
  {
    id: 'leader',
    name: 'Leader',
    shortName: 'L',
    symbol: 'L',
    description: 'Special cards with red backs that lead your deck! Your strategy starts here.',
    examples: ['Monkey D. Luffy', 'Trafalgar Law', 'Eustass Kid', 'Kaido'],
    pullRate: 'About 1 per pack (guaranteed)',
    collectorTip: 'Leaders define your deck - collect different ones to try new strategies!',
    sortOrder: 5,
    colorClass: 'text-red-500',
    icon: '👑',
    apiMatches: ['leader', 'l'],
  },
  {
    id: 'secret-rare',
    name: 'Secret Rare',
    shortName: 'SEC',
    symbol: 'SEC',
    description: 'Premium cards with gold borders and textured finish. The ultimate chase cards!',
    examples: ['Gear 5 Luffy', 'Yamato', 'Roger', 'Whitebeard'],
    pullRate: 'Very rare - about 1 in every 24 packs (1 per box)',
    collectorTip: 'Secret Rares are grail cards - handle with care and consider grading!',
    sortOrder: 6,
    colorClass: 'text-orange-500',
    icon: '🏆',
    apiMatches: ['secret rare', 'sec', 'secret'],
  },
  {
    id: 'special',
    name: 'Special',
    shortName: 'SP',
    symbol: 'SP',
    description: 'Limited edition cards from promotional events and special products.',
    examples: ['Promo Luffy', 'Tournament rewards', 'Box toppers'],
    pullRate: "Only from special products - can't be found in regular packs!",
    collectorTip: 'SP cards are great collectibles and conversation starters!',
    sortOrder: 7,
    colorClass: 'text-blue-500',
    icon: '🎁',
    apiMatches: ['special', 'sp', 'promo'],
  },
  {
    id: 'alternate-art',
    name: 'Alternate Art',
    shortName: 'AA',
    symbol: 'AA',
    description: 'Stunning full-art cards with artwork that extends across the entire card!',
    examples: ['Full-art Luffy', 'Textured parallels', 'Extended art characters'],
    pullRate: 'About 1-3 per box (very rare)',
    collectorTip: 'Alternate Arts are highly collectible - the full art is breathtaking!',
    sortOrder: 8,
    colorClass: 'text-pink-500',
    icon: '🎨',
    apiMatches: ['alternate art', 'aa', 'alt art', 'parallel'],
  },
  {
    id: 'manga-rare',
    name: 'Manga Rare',
    shortName: 'MR',
    symbol: '★',
    description: 'The rarest cards featuring original black-and-white manga panel artwork!',
    examples: ['Iconic manga moments', 'Classic Oda artwork', 'Story highlights'],
    pullRate: 'Extremely rare - the ultimate chase cards',
    collectorTip: 'Manga Rares are grail cards for collectors - true treasures!',
    sortOrder: 9,
    colorClass: 'text-slate-800',
    icon: '📖',
    apiMatches: ['manga rare', 'mr', 'manga'],
  },
] as const;

// ============================================================================
// DISNEY LORCANA RARITY DEFINITIONS
// ============================================================================

/**
 * Disney Lorcana rarity information.
 * Includes the original six rarities plus the new Epic and Iconic (2025).
 */
export const LORCANA_RARITY_EXPLAINERS: readonly RarityInfo[] = [
  {
    id: 'common',
    name: 'Common',
    shortName: 'C',
    symbol: '●',
    description: 'Cards marked with a grey circle. The foundation of your Lorcana collection!',
    examples: ['Supporting characters', 'Basic actions', 'Common items'],
    pullRate: 'Found in every pack (about 6 per pack)',
    collectorTip: 'Commons are perfect for building themed Disney decks!',
    sortOrder: 1,
    colorClass: 'text-gray-500',
    icon: '⚫',
    apiMatches: ['common', 'c'],
  },
  {
    id: 'uncommon',
    name: 'Uncommon',
    shortName: 'U',
    symbol: '📖',
    description: 'Cards with a white book-like symbol. Slightly harder to find!',
    examples: ['Key supporting characters', 'Useful actions', 'Important items'],
    pullRate: 'About 3 per pack',
    collectorTip: 'Uncommons often have abilities that make your deck shine!',
    sortOrder: 2,
    colorClass: 'text-green-600',
    icon: '📖',
    apiMatches: ['uncommon', 'u', 'uc'],
  },
  {
    id: 'rare',
    name: 'Rare',
    shortName: 'R',
    symbol: '▲',
    description: 'Cards marked with a bronze triangle. Features great Disney artwork!',
    examples: ['Popular Disney characters', 'Powerful actions', 'Key songs'],
    pullRate: 'About 0-2 per pack',
    collectorTip: 'Rares look fantastic in a binder - start a page for each ink color!',
    sortOrder: 3,
    colorClass: 'text-amber-600',
    icon: '🔺',
    apiMatches: ['rare', 'r'],
  },
  {
    id: 'super-rare',
    name: 'Super Rare',
    shortName: 'SR',
    symbol: '◆',
    description: 'Cards with a silver diamond symbol. Premium cards with stunning art!',
    examples: ['Fan favorite characters', 'Powerful versions of beloved Disney icons'],
    pullRate: 'About 1 in every 4-6 packs',
    collectorTip: 'Super Rares are deck powerhouses - protect them in sleeves!',
    sortOrder: 4,
    colorClass: 'text-slate-400',
    icon: '💎',
    apiMatches: ['super rare', 'sr', 'super'],
  },
  {
    id: 'legendary',
    name: 'Legendary',
    shortName: 'L',
    symbol: '⬠',
    description: 'Cards marked with a gold pentagon. The heroes of your collection!',
    examples: ['Elsa', 'Mickey Mouse', 'Stitch', 'Iconic Disney moments'],
    pullRate: 'About 1 in every 8-12 packs',
    collectorTip: 'Legendary cards deserve top loaders - they\'re the stars!',
    sortOrder: 5,
    colorClass: 'text-yellow-500',
    icon: '⭐',
    apiMatches: ['legendary', 'l', 'leg'],
  },
  {
    id: 'epic',
    name: 'Epic',
    shortName: 'E',
    symbol: '⬡',
    description: 'New in 2025! Borderless frames with rainbow foil and stunning expanded artwork.',
    examples: ['Special character versions', 'Key story moments', 'Fan favorites'],
    pullRate: 'Rare - about 1 in every 12-15 packs',
    collectorTip: 'Epic cards have no borders - the art goes edge to edge!',
    sortOrder: 6,
    colorClass: 'text-purple-500',
    icon: '🌟',
    apiMatches: ['epic', 'e'],
  },
  {
    id: 'enchanted',
    name: 'Enchanted',
    shortName: 'EN',
    symbol: '⬢',
    description: 'Cards with a rainbow hexagon. Magical full-art cards with enchanting designs!',
    examples: ['Enchanted Elsa', 'Enchanted Mickey', 'Enchanted Stitch'],
    pullRate: 'Very rare - about 1 in every 48+ packs',
    collectorTip: 'Enchanted cards are true treasures - the most magical cards to collect!',
    sortOrder: 7,
    colorClass: 'text-pink-500',
    icon: '✨',
    apiMatches: ['enchanted', 'en', 'ench'],
  },
  {
    id: 'iconic',
    name: 'Iconic',
    shortName: 'IC',
    symbol: '★★',
    description: 'The rarest cards in Lorcana! Only 2 exist per set. Ultimate collector items!',
    examples: ['Iconic Mickey', 'Iconic Minnie', 'Ultimate chase cards'],
    pullRate: 'Extremely rare - about 0.1% pull rate',
    collectorTip: 'Iconic cards are the rarest of the rare - true grails for any collector!',
    sortOrder: 8,
    colorClass: 'text-orange-500',
    icon: '🏆',
    apiMatches: ['iconic', 'ic'],
  },
  {
    id: 'promo',
    name: 'Promo',
    shortName: 'P',
    symbol: 'PROMO',
    description: 'Special cards from events, starter decks, and promotional products.',
    examples: ['Starter deck exclusives', 'Event rewards', 'Special releases'],
    pullRate: "Only from special products - can't be found in regular packs!",
    collectorTip: 'Promos mark special moments in your collecting journey!',
    sortOrder: 9,
    colorClass: 'text-blue-500',
    icon: '🎁',
    apiMatches: ['promo', 'p'],
  },
] as const;

// ============================================================================
// GAME-SPECIFIC RARITY REGISTRY
// ============================================================================

/**
 * Map of game IDs to their rarity definitions.
 */
export const GAME_RARITY_EXPLAINERS: Record<GameId, readonly RarityInfo[]> = {
  pokemon: POKEMON_RARITY_EXPLAINERS,
  yugioh: YUGIOH_RARITY_EXPLAINERS,
  onepiece: ONEPIECE_RARITY_EXPLAINERS,
  lorcana: LORCANA_RARITY_EXPLAINERS,
};

/**
 * Default rarity explainers (Pokemon for backwards compatibility).
 */
export const RARITY_EXPLAINERS = POKEMON_RARITY_EXPLAINERS;

/**
 * Get rarity explainers for a specific game.
 */
export function getRarityExplainersForGame(gameId: GameId): readonly RarityInfo[] {
  return GAME_RARITY_EXPLAINERS[gameId] ?? POKEMON_RARITY_EXPLAINERS;
}

// ============================================================================
// CORE LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get rarity info by ID.
 * @param rarityId - The rarity ID to look up
 * @param gameId - Optional game ID (defaults to 'pokemon' for backwards compatibility)
 */
export function getRarityInfo(rarityId: string, gameId: GameId = 'pokemon'): RarityInfo | null {
  const explainers = getRarityExplainersForGame(gameId);
  return explainers.find((r) => r.id === rarityId) ?? null;
}

/**
 * Get rarity info by display name or raw rarity string from the API.
 * Handles various formats from TCG APIs.
 * @param rarityName - The rarity name or API string to look up
 * @param gameId - Optional game ID (defaults to 'pokemon' for backwards compatibility)
 */
export function getRarityInfoByName(rarityName: string, gameId: GameId = 'pokemon'): RarityInfo | null {
  if (!rarityName) return null;

  const normalizedName = rarityName.toLowerCase().trim();
  const explainers = getRarityExplainersForGame(gameId);

  // Direct match on name or shortName
  const directMatch = explainers.find(
    (r) => r.name.toLowerCase() === normalizedName || r.shortName.toLowerCase() === normalizedName
  );
  if (directMatch) return directMatch;

  // Check exact apiMatches
  for (const rarity of explainers) {
    if (rarity.apiMatches.some((match) => match.toLowerCase() === normalizedName)) {
      return rarity;
    }
  }

  // Fallback to keyword matching (Pokemon-specific, kept for backwards compatibility)
  if (gameId === 'pokemon') {
    return matchRarityByKeywords(normalizedName);
  }

  return null;
}

/**
 * Get all rarity explainers.
 * @param gameId - Optional game ID (defaults to 'pokemon' for backwards compatibility)
 */
export function getAllRarityInfo(gameId: GameId = 'pokemon'): readonly RarityInfo[] {
  return getRarityExplainersForGame(gameId);
}

/**
 * Get rarity by sort order.
 * @param sortOrder - The sort order to look up
 * @param gameId - Optional game ID (defaults to 'pokemon' for backwards compatibility)
 */
export function getRarityBySortOrder(sortOrder: number, gameId: GameId = 'pokemon'): RarityInfo | null {
  const explainers = getRarityExplainersForGame(gameId);
  return explainers.find((r) => r.sortOrder === sortOrder) ?? null;
}

// ============================================================================
// KEYWORD MATCHING
// ============================================================================

/**
 * Match rarity by keyword patterns in the API string.
 * Checks specific patterns before general ones.
 */
export function matchRarityByKeywords(normalizedString: string): RarityInfo | null {
  if (!normalizedString) return null;

  // Secret Rare keywords (check before ultra-rare since some overlap)
  // Note: "shiny" alone triggers secret-rare (e.g., "Rare Shiny", "Shiny Rare")
  if (
    normalizedString.includes('secret') ||
    normalizedString.includes('rainbow') ||
    normalizedString.includes('hyper') ||
    normalizedString.includes('amazing') ||
    normalizedString.includes('illustration rare') ||
    normalizedString.includes('special art') ||
    normalizedString.includes('shiny') ||
    normalizedString.includes('ace spec rare') ||
    normalizedString.includes('shining') ||
    normalizedString.includes('legend')
  ) {
    return getRarityInfo('secret-rare');
  }

  // Ultra Rare keywords
  // Note: ' v' at end of string or ' v ' in middle both match V cards
  if (
    normalizedString.includes('ultra') ||
    normalizedString.includes('vmax') ||
    normalizedString.includes('vstar') ||
    normalizedString.includes('double rare') ||
    normalizedString.includes(' ex') ||
    normalizedString.includes(' gx') ||
    normalizedString.includes(' v ') ||
    normalizedString.endsWith(' v')
  ) {
    return getRarityInfo('ultra-rare');
  }

  // Promo keywords
  if (normalizedString.includes('promo') || normalizedString.includes('classic collection')) {
    return getRarityInfo('promo');
  }

  // Rare keywords (check after ultra-rare)
  if (normalizedString.includes('rare') && !normalizedString.includes('ultra')) {
    return getRarityInfo('rare');
  }

  // Uncommon
  if (normalizedString.includes('uncommon')) {
    return getRarityInfo('uncommon');
  }

  // Common (check last, and make sure it's not uncommon)
  if (normalizedString.includes('common') && !normalizedString.includes('uncommon')) {
    return getRarityInfo('common');
  }

  return null;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if a rarity ID is valid.
 */
export function isValidRarityId(rarityId: string): boolean {
  return RARITY_EXPLAINERS.some((r) => r.id === rarityId);
}

/**
 * Get all valid rarity IDs.
 */
export function getValidRarityIds(): string[] {
  return RARITY_EXPLAINERS.map((r) => r.id);
}

/**
 * Get all rarity short names.
 */
export function getRarityShortNames(): string[] {
  return RARITY_EXPLAINERS.map((r) => r.shortName);
}

// ============================================================================
// COMPARISON & SORTING FUNCTIONS
// ============================================================================

/**
 * Compare two rarities by their sort order.
 * Returns negative if a is more common, positive if a is rarer, 0 if equal.
 */
export function compareRarities(rarityA: string | null, rarityB: string | null): number {
  const infoA = rarityA ? getRarityInfoByName(rarityA) : null;
  const infoB = rarityB ? getRarityInfoByName(rarityB) : null;

  const orderA = infoA?.sortOrder ?? 0;
  const orderB = infoB?.sortOrder ?? 0;

  return orderA - orderB;
}

/**
 * Get the sort value for a rarity string.
 * Higher values = rarer cards.
 */
export function getRaritySortValue(rarityString: string | null | undefined): number {
  if (!rarityString) return 0;
  const info = getRarityInfoByName(rarityString);
  return info?.sortOrder ?? 0;
}

/**
 * Check if rarityA is rarer than rarityB.
 */
export function isRarerThan(rarityA: string | null, rarityB: string | null): boolean {
  return compareRarities(rarityA, rarityB) > 0;
}

/**
 * Check if rarityA is more common than rarityB.
 */
export function isMoreCommonThan(rarityA: string | null, rarityB: string | null): boolean {
  return compareRarities(rarityA, rarityB) < 0;
}

/**
 * Sort an array of rarity strings from common to rare.
 */
export function sortRaritiesCommonFirst(rarities: string[]): string[] {
  return [...rarities].sort(compareRarities);
}

/**
 * Sort an array of rarity strings from rare to common.
 */
export function sortRaritiesRareFirst(rarities: string[]): string[] {
  return [...rarities].sort((a, b) => compareRarities(b, a));
}

// ============================================================================
// TOOLTIP & DISPLAY FUNCTIONS
// ============================================================================

/**
 * Get tooltip data for a rarity string.
 */
export function getRarityTooltipData(rarityString: string | null | undefined): RarityTooltipData {
  if (!rarityString) {
    return {
      title: 'Unknown Rarity',
      description: "This card's rarity is not available.",
      tip: '',
    };
  }

  const info = getRarityInfoByName(rarityString);

  if (!info) {
    return {
      title: rarityString,
      description: 'This is a special rarity type.',
      tip: 'Check online for more information about this rarity.',
    };
  }

  return {
    title: `${info.icon} ${info.name}`,
    description: info.description,
    tip: info.collectorTip,
    pullRate: info.pullRate,
    examples: info.examples,
  };
}

/**
 * Get the display label for a rarity.
 */
export function getRarityDisplayLabel(rarityString: string | null | undefined): string {
  if (!rarityString) return 'Unknown';
  const info = getRarityInfoByName(rarityString);
  return info ? `${info.icon} ${info.name}` : rarityString;
}

/**
 * Get the short display label for a rarity.
 */
export function getRarityShortLabel(rarityString: string | null | undefined): string {
  if (!rarityString) return '?';
  const info = getRarityInfoByName(rarityString);
  return info?.shortName ?? '?';
}

/**
 * Get the icon for a rarity.
 */
export function getRarityIcon(rarityString: string | null | undefined): string {
  if (!rarityString) return '❓';
  const info = getRarityInfoByName(rarityString);
  return info?.icon ?? '❓';
}

/**
 * Get the CSS color class for a rarity.
 */
export function getRarityColorClass(rarityString: string | null | undefined): string {
  if (!rarityString) return 'text-gray-400';
  const info = getRarityInfoByName(rarityString);
  return info?.colorClass ?? 'text-gray-400';
}

/**
 * Get the symbol for a rarity.
 */
export function getRaritySymbol(rarityString: string | null | undefined): string {
  if (!rarityString) return '?';
  const info = getRarityInfoByName(rarityString);
  return info?.symbol ?? '?';
}

// ============================================================================
// DISTRIBUTION & STATISTICS FUNCTIONS
// ============================================================================

/**
 * Calculate rarity distribution from an array of rarity strings.
 */
export function calculateRarityDistribution(rarityStrings: (string | null | undefined)[]): {
  distribution: RarityDistributionItem[];
  unknown: string[];
  totalCards: number;
} {
  const counts: Record<string, number> = {};
  const unknown: string[] = [];

  for (const rarityStr of rarityStrings) {
    if (!rarityStr) continue;

    const info = getRarityInfoByName(rarityStr);
    if (info) {
      counts[info.id] = (counts[info.id] ?? 0) + 1;
    } else {
      unknown.push(rarityStr);
    }
  }

  const totalKnown = Object.values(counts).reduce((sum, count) => sum + count, 0);

  const distribution: RarityDistributionItem[] = RARITY_EXPLAINERS.filter(
    (r) => (counts[r.id] ?? 0) > 0
  ).map((r) => ({
    rarity: r,
    count: counts[r.id] ?? 0,
    percentage: totalKnown > 0 ? Math.round(((counts[r.id] ?? 0) / totalKnown) * 100) : 0,
  }));

  return {
    distribution,
    unknown,
    totalCards: totalKnown + unknown.length,
  };
}

/**
 * Get comprehensive rarity statistics for a collection.
 */
export function getRarityStats(rarityStrings: (string | null | undefined)[]): RarityStats {
  const { distribution, totalCards } = calculateRarityDistribution(rarityStrings);

  // Find most common rarity
  const mostCommonItem = distribution.reduce<RarityDistributionItem | null>(
    (max, item) => (!max || item.count > max.count ? item : max),
    null
  );

  // Find rarest card (highest sortOrder with count > 0)
  const rarestItem = [...distribution].sort((a, b) => b.rarity.sortOrder - a.rarity.sortOrder)[0];

  // Calculate average rarity (weighted by count)
  let totalWeight = 0;
  let totalSortOrder = 0;
  for (const item of distribution) {
    totalWeight += item.count;
    totalSortOrder += item.rarity.sortOrder * item.count;
  }
  const averageRarity = totalWeight > 0 ? totalSortOrder / totalWeight : 0;

  return {
    totalCards,
    distribution,
    mostCommonRarity: mostCommonItem?.rarity ?? null,
    rarestCard: rarestItem?.rarity ?? null,
    averageRarity: Math.round(averageRarity * 100) / 100,
  };
}

/**
 * Get the percentage of rare and above cards in a collection.
 */
export function getRarePercentage(rarityStrings: (string | null | undefined)[]): number {
  const { distribution, totalCards } = calculateRarityDistribution(rarityStrings);
  if (totalCards === 0) return 0;

  const rareAndAbove = distribution
    .filter((item) => item.rarity.sortOrder >= 3) // rare and above
    .reduce((sum, item) => sum + item.count, 0);

  return Math.round((rareAndAbove / totalCards) * 100);
}

// ============================================================================
// EDUCATIONAL CONTENT HELPERS
// ============================================================================

/**
 * Game-specific rarity explanations.
 */
const RARITY_EXPLANATIONS: Record<GameId, string> = {
  pokemon: `Pokémon cards come in different rarities, shown by a symbol at the bottom of the card:
• ● Common - Found in almost every pack
• ◆ Uncommon - A bit harder to find
• ★ Rare - Special cards with a star symbol
• ★★ Ultra Rare - Powerful EX, GX, V, and VMAX cards
• ★★★ Secret Rare - The rarest cards with amazing artwork
• PROMO - Special cards from events and products`,

  yugioh: `Yu-Gi-Oh! cards have different rarities shown by the card name and artwork:
• C Common - Standard cards, no special features
• R Rare - Silver foil name lettering
• SR Super Rare - Holographic artwork
• UR Ultra Rare - Gold foil name + holographic art
• ScR Secret Rare - Diagonal sparkle on name and art
• UtR Ultimate Rare - Textured, embossed foil
• GR Ghost Rare - Transparent, ghostly artwork
• StR Starlight Rare - Full rainbow foil (ultra rare!)`,

  onepiece: `One Piece cards show their rarity in the bottom-right corner:
• C Common - Your everyday crew members
• UC Uncommon - Slightly harder to find
• R Rare - Powerful characters with nice art
• SR Super Rare - Premium cards with great effects
• L Leader - Special red-backed cards that lead your deck
• SEC Secret Rare - Gold borders, textured finish
• AA Alternate Art - Full-art cards with extended artwork
• ★ Manga Rare - Black & white manga panel art (rarest!)`,

  lorcana: `Lorcana cards show rarity with a shape symbol at the bottom:
• ● Common (circle) - Found in every pack
• 📖 Uncommon (book) - A bit harder to find
• ▲ Rare (triangle) - Bronze, great artwork
• ◆ Super Rare (diamond) - Silver, stunning cards
• ⬠ Legendary (pentagon) - Gold, the heroes!
• ⬡ Epic (hexagon) - Borderless rainbow foil
• ⬢ Enchanted (rainbow hex) - Magical full-art
• ★★ Iconic - The rarest cards (only 2 per set!)`,
};

/**
 * Get a kid-friendly explanation of rarity tiers.
 * @param gameId - Optional game ID (defaults to 'pokemon' for backwards compatibility)
 */
export function getRarityExplanation(gameId: GameId = 'pokemon'): string {
  return RARITY_EXPLANATIONS[gameId] ?? RARITY_EXPLANATIONS.pokemon;
}

/**
 * Game-specific fun facts about rarity tiers.
 */
const RARITY_FUN_FACTS: Record<GameId, Record<string, string[]>> = {
  pokemon: {
    common: [
      'Common cards make up about 50% of most sets!',
      'Many common cards have great abilities for decks.',
      'Collecting all commons in a set is a fun challenge!',
    ],
    uncommon: [
      'The diamond symbol has been used since the first Pokémon sets!',
      'Uncommon cards often have Stage 1 evolutions.',
      'Some uncommon cards become valuable over time.',
    ],
    rare: [
      'Holofoil rare cards reflect light in cool patterns!',
      'The first holographic card was Charizard from Base Set.',
      'Keeping rare holos in good condition increases their value.',
    ],
    'ultra-rare': [
      'Ultra Rares were first introduced with Pokémon-EX in 2012.',
      'VMAX cards feature Dynamax and Gigantamax Pokémon!',
      'Full Art Ultra Rares showcase the entire card artwork.',
    ],
    'secret-rare': [
      'Secret Rares are numbered higher than the set size (like 205/198).',
      'Rainbow Rares show Pokémon in beautiful multicolor art.',
      'Gold Secret Rares have shiny gold borders!',
    ],
    promo: [
      'Some promos are only available at Pokémon championships!',
      "McDonald's has released special promo cards in Happy Meals.",
      'Build & Battle box promos are great for getting started!',
    ],
  },
  yugioh: {
    common: [
      'Commons are essential for building competitive decks!',
      'Many tournament-winning cards started as commons.',
      'Sorting your commons makes deck building much easier!',
    ],
    rare: [
      'The silver name was the first "rare" indicator in Yu-Gi-Oh!',
      'Many classic cards like Dark Hole were originally Rares.',
      'Rares from early sets can be quite valuable!',
    ],
    'super-rare': [
      'Super Rares have holo art but normal-colored names.',
      'The holographic pattern catches light beautifully!',
      'Many iconic monsters have stunning Super Rare versions.',
    ],
    'ultra-rare': [
      'The gold foil name makes Ultra Rares easy to spot!',
      'Blue-Eyes White Dragon has many famous Ultra Rare prints.',
      'Ultra Rares are often the chase cards of a set.',
    ],
    'secret-rare': [
      'Secret Rares have a unique diagonal sparkle pattern!',
      'Dark Magician Girl Secret Rare is one of the most famous.',
      'The Secret Rare pattern was first introduced in 2003.',
    ],
    'ghost-rare': [
      'Ghost Rares look almost transparent when tilted!',
      'Stardust Dragon Ghost Rare is legendary among collectors.',
      'Only certain sets feature Ghost Rare cards.',
    ],
    'starlight-rare': [
      'Starlight Rares are about 1 per case - super rare!',
      'The full-card rainbow foil is absolutely stunning.',
      'Starlight Rares can be worth hundreds of dollars!',
    ],
  },
  onepiece: {
    common: [
      'Commons feature many beloved One Piece characters!',
      'Building a complete common set is a fun goal.',
      'Commons are perfect for learning the game!',
    ],
    rare: [
      'Rares often feature key story moments from the anime!',
      'Many Rares have beautiful full-color artwork.',
      'Some Rares become valuable as the meta changes!',
    ],
    'super-rare': [
      'Super Rares feature the most popular characters!',
      'The artwork quality on SRs is incredible.',
      'Many deck centerpieces are Super Rares.',
    ],
    leader: [
      'Leaders have red card backs - they\'re special!',
      'Your Leader determines your deck\'s color and strategy.',
      'Collecting all Leaders is a popular goal!',
    ],
    'secret-rare': [
      'Secret Rares have gold borders and texture!',
      'Gear 5 Luffy SEC is one of the most valuable cards.',
      'You\'ll find about 1 SEC per booster box.',
    ],
    'manga-rare': [
      'Manga Rares feature actual manga panel artwork!',
      'They\'re printed in black and white like the original manga.',
      'These are the ultimate chase cards for collectors!',
    ],
  },
  lorcana: {
    common: [
      'Commons feature many beloved Disney sidekicks!',
      'Building a complete common set by ink color is fun!',
      'Commons are perfect for learning Lorcana!',
    ],
    rare: [
      'The bronze triangle makes Rares easy to spot!',
      'Rare cards often have memorable Disney moments.',
      'Collecting Rares from each ink color is a great goal!',
    ],
    legendary: [
      'Legendary cards feature the biggest Disney stars!',
      'The gold pentagon symbol really stands out.',
      'Many powerful deck cards are Legendaries!',
    ],
    enchanted: [
      'Enchanted cards have stunning full-art designs!',
      'The rainbow hexagon symbol is magical.',
      'Enchanted cards are the original chase cards of Lorcana!',
    ],
    epic: [
      'Epic cards are new in 2025 - borderless frames!',
      'The rainbow foil treatment looks amazing.',
      'There are 18 Epic cards in each set!',
    ],
    iconic: [
      'Iconic cards are the rarest - only 2 per set!',
      'Mickey and Minnie were the first Iconic cards.',
      'Pull rate is about 0.1% - incredibly rare!',
    ],
  },
};

/**
 * Get fun facts about a rarity tier.
 * @param rarityId - The rarity ID to get facts for
 * @param gameId - Optional game ID (defaults to 'pokemon' for backwards compatibility)
 */
export function getRarityFunFacts(rarityId: string, gameId: GameId = 'pokemon'): string[] {
  const gameFacts = RARITY_FUN_FACTS[gameId] ?? RARITY_FUN_FACTS.pokemon;
  return gameFacts[rarityId] ?? ['This is a special type of card!'];
}

/**
 * Game-specific collecting advice.
 */
const COLLECTING_ADVICE: Record<GameId, Record<string, string>> = {
  pokemon: {
    common: 'Sort your commons by type or set to find them easily when building decks.',
    uncommon: 'Keep an eye out for uncommons with useful Abilities - they can be deck staples!',
    rare: 'Store rare holos in penny sleeves or toploaders to prevent scratches.',
    'ultra-rare': 'Consider double-sleeving your Ultra Rares: penny sleeve first, then deck sleeve.',
    'secret-rare': 'Secret Rares are best stored in toploaders or magnetic cases for maximum protection.',
    promo: 'Track which events and products have promos you want - some are very limited edition!',
  },
  yugioh: {
    common: 'Organize your commons by archetype to make deck building a breeze!',
    rare: 'Keep rares from classic sets - they can become valuable over time!',
    'super-rare': 'Super Rares look great in a binder organized by set.',
    'ultra-rare': 'Ultra Rares deserve penny sleeves at minimum - the gold name can scratch!',
    'secret-rare': 'Secret Rares are best in toploaders or one-touch magnetic cases.',
    'ghost-rare': 'Ghost Rares are fragile - consider professional grading for valuable ones!',
    'starlight-rare': 'Starlight Rares are investment-grade - protect them like treasures!',
  },
  onepiece: {
    common: 'Sort commons by crew/faction to easily find cards when deck building!',
    rare: 'Rares look great displayed by character or color.',
    'super-rare': 'Keep SRs sleeved - the artwork is worth protecting!',
    leader: 'Display your Leaders together - they make a great collection showcase!',
    'secret-rare': 'SECs deserve premium protection - magnetic cases recommended!',
    'alternate-art': 'Alternate Arts are stunning framed or in premium cases.',
    'manga-rare': 'Manga Rares are grail cards - consider professional grading!',
  },
  lorcana: {
    common: 'Organize commons by ink color for easy deck building!',
    rare: 'Start a binder page for each ink color\'s Rares.',
    'super-rare': 'Super Rares deserve at least penny sleeves for protection.',
    legendary: 'Legendary cards are deck centerpieces - keep them pristine!',
    enchanted: 'Enchanted cards are treasures - toploaders or magnetic cases recommended!',
    epic: 'The borderless Epic cards look amazing in premium display cases.',
    iconic: 'Iconic cards are ultra-rare - professional grading is worth considering!',
  },
};

/**
 * Get collecting advice for a specific rarity.
 * @param rarityId - The rarity ID to get advice for
 * @param gameId - Optional game ID (defaults to 'pokemon' for backwards compatibility)
 */
export function getCollectingAdvice(rarityId: string, gameId: GameId = 'pokemon'): string {
  const gameAdvice = COLLECTING_ADVICE[gameId] ?? COLLECTING_ADVICE.pokemon;
  return gameAdvice[rarityId] ?? 'Keep your cards organized and protected!';
}

/**
 * Check if a rarity is considered "chase" worthy (highly desirable).
 */
export function isChaseRarity(rarityString: string | null | undefined): boolean {
  if (!rarityString) return false;
  const info = getRarityInfoByName(rarityString);
  // Ultra Rare, Secret Rare, and some Promos are typically chase cards
  return info !== null && info.sortOrder >= 4;
}

/**
 * Get the rarity tier name (for grouping).
 */
export function getRarityTier(rarityString: string | null | undefined): string {
  if (!rarityString) return 'Unknown';
  const info = getRarityInfoByName(rarityString);
  return info?.name ?? 'Unknown';
}
