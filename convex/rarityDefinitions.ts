import { v } from 'convex/values';
import { query } from './_generated/server';

// ============================================================================
// RARITY DEFINITIONS
// ============================================================================

/**
 * Comprehensive rarity definitions for Pokemon TCG cards.
 * Used for educational tooltips, filtering, and card sorting.
 *
 * Rarity categories are based on standard Pokemon TCG rarities:
 * - Common (circle symbol)
 * - Uncommon (diamond symbol)
 * - Rare (star symbol, includes holo variants)
 * - Ultra Rare (EX, GX, V, VMAX, VSTAR, ex)
 * - Secret Rare (numbered beyond set size, gold/rainbow/special art)
 * - Promo (promotional cards)
 */

export interface RarityDefinition {
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

/**
 * Complete rarity definitions with all necessary data for educational tooltips.
 * Sorted from most common (1) to most rare (6).
 */
export const RARITY_DEFINITIONS: readonly RarityDefinition[] = [
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
// QUERIES
// ============================================================================

/**
 * Get all rarity definitions.
 * Returns the complete list of rarity tiers with all educational content.
 */
export const getAllRarityDefinitions = query({
  args: {},
  handler: async () => {
    return {
      definitions: RARITY_DEFINITIONS,
      count: RARITY_DEFINITIONS.length,
    };
  },
});

/**
 * Get a single rarity definition by ID.
 * Returns null if the rarity ID is not found.
 */
export const getRarityById = query({
  args: { rarityId: v.string() },
  handler: async (ctx, args) => {
    const rarity = RARITY_DEFINITIONS.find((r) => r.id === args.rarityId);
    return rarity ?? null;
  },
});

/**
 * Get a rarity definition by matching an API rarity string.
 * Handles various rarity strings from Pokemon TCG API.
 */
export const getRarityByApiString = query({
  args: { apiRarityString: v.string() },
  handler: async (ctx, args) => {
    if (!args.apiRarityString) {
      return null;
    }

    const normalized = args.apiRarityString.toLowerCase().trim();

    // First try exact match in apiMatches
    for (const rarity of RARITY_DEFINITIONS) {
      if (rarity.apiMatches.some((match) => match.toLowerCase() === normalized)) {
        return rarity;
      }
    }

    // Fallback to keyword matching
    return matchRarityByKeywords(normalized);
  },
});

/**
 * Get tooltip data for a card's rarity.
 * Returns formatted data ready for display in a tooltip component.
 */
export const getRarityTooltip = query({
  args: { apiRarityString: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.apiRarityString) {
      return {
        found: false,
        rarity: null,
        tooltip: {
          title: 'Unknown Rarity',
          description: "This card's rarity is not available.",
          tip: '',
        },
      };
    }

    const normalized = args.apiRarityString.toLowerCase().trim();
    let rarity: RarityDefinition | null = null;

    // Try exact match first
    for (const r of RARITY_DEFINITIONS) {
      if (r.apiMatches.some((match) => match.toLowerCase() === normalized)) {
        rarity = r;
        break;
      }
    }

    // Fallback to keyword matching
    if (!rarity) {
      rarity = matchRarityByKeywords(normalized);
    }

    if (!rarity) {
      return {
        found: false,
        rarity: null,
        tooltip: {
          title: args.apiRarityString,
          description: 'This is a special rarity type.',
          tip: 'Check online for more information about this rarity.',
        },
      };
    }

    return {
      found: true,
      rarity,
      tooltip: {
        title: `${rarity.icon} ${rarity.name}`,
        description: rarity.description,
        tip: rarity.collectorTip,
        pullRate: rarity.pullRate,
        examples: rarity.examples,
      },
    };
  },
});

/**
 * Get rarity distribution summary for a set of cards.
 * Useful for displaying rarity breakdown in collection stats.
 */
export const getRarityDistribution = query({
  args: { rarityStrings: v.array(v.string()) },
  handler: async (ctx, args) => {
    const distribution: Record<string, number> = {};
    const unknown: string[] = [];

    for (const rarityStr of args.rarityStrings) {
      const rarity = matchRarityFromString(rarityStr);
      if (rarity) {
        distribution[rarity.id] = (distribution[rarity.id] ?? 0) + 1;
      } else {
        unknown.push(rarityStr);
      }
    }

    // Build distribution with full rarity info
    const distributionWithInfo = RARITY_DEFINITIONS.map((rarity) => ({
      ...rarity,
      count: distribution[rarity.id] ?? 0,
      percentage:
        args.rarityStrings.length > 0
          ? Math.round(((distribution[rarity.id] ?? 0) / args.rarityStrings.length) * 100)
          : 0,
    })).filter((r) => r.count > 0);

    return {
      distribution: distributionWithInfo,
      totalCards: args.rarityStrings.length,
      unknownRarities: unknown,
      unknownCount: unknown.length,
    };
  },
});

/**
 * Get rarity sort value for ordering cards.
 * Higher values = rarer cards (for sorting rare cards first).
 */
export const getRaritySortValue = query({
  args: { apiRarityString: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.apiRarityString) {
      return 0;
    }

    const rarity = matchRarityFromString(args.apiRarityString);
    return rarity?.sortOrder ?? 0;
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Match rarity by keyword patterns in the API string.
 */
function matchRarityByKeywords(normalizedString: string): RarityDefinition | null {
  // Order matters - check more specific patterns first

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
    return RARITY_DEFINITIONS.find((r) => r.id === 'secret-rare') ?? null;
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
    return RARITY_DEFINITIONS.find((r) => r.id === 'ultra-rare') ?? null;
  }

  // Promo keywords
  if (normalizedString.includes('promo') || normalizedString.includes('classic collection')) {
    return RARITY_DEFINITIONS.find((r) => r.id === 'promo') ?? null;
  }

  // Rare keywords (check after ultra-rare)
  if (normalizedString.includes('rare') && !normalizedString.includes('ultra')) {
    // Could be rare or double rare etc.
    return RARITY_DEFINITIONS.find((r) => r.id === 'rare') ?? null;
  }

  // Uncommon
  if (normalizedString.includes('uncommon')) {
    return RARITY_DEFINITIONS.find((r) => r.id === 'uncommon') ?? null;
  }

  // Common (check last, and make sure it's not uncommon)
  if (normalizedString.includes('common') && !normalizedString.includes('uncommon')) {
    return RARITY_DEFINITIONS.find((r) => r.id === 'common') ?? null;
  }

  return null;
}

/**
 * Match rarity from any string (exact or keyword).
 */
function matchRarityFromString(rarityString: string): RarityDefinition | null {
  if (!rarityString) {
    return null;
  }

  const normalized = rarityString.toLowerCase().trim();

  // Try exact match first
  for (const rarity of RARITY_DEFINITIONS) {
    if (rarity.apiMatches.some((match) => match.toLowerCase() === normalized)) {
      return rarity;
    }
  }

  // Fallback to keyword matching
  return matchRarityByKeywords(normalized);
}
