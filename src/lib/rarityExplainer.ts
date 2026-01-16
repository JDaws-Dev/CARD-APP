/**
 * Rarity Explainer - Educational content and utilities for understanding card rarities
 * Provides kid-friendly explanations, matching logic, and display helpers for each rarity tier.
 *
 * This module contains pure utility functions that complement the Convex queries
 * in convex/rarityDefinitions.ts. Use these functions for client-side operations.
 */

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
// RARITY DEFINITIONS CONSTANT
// ============================================================================

/**
 * Comprehensive rarity information for educational tooltips.
 * Sorted from most common (sortOrder 1) to most rare (sortOrder 6).
 */
export const RARITY_EXPLAINERS: readonly RarityInfo[] = [
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
// CORE LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get rarity info by ID.
 */
export function getRarityInfo(rarityId: string): RarityInfo | null {
  return RARITY_EXPLAINERS.find((r) => r.id === rarityId) ?? null;
}

/**
 * Get rarity info by display name or raw rarity string from the API.
 * Handles various formats from Pokemon TCG API.
 */
export function getRarityInfoByName(rarityName: string): RarityInfo | null {
  if (!rarityName) return null;

  const normalizedName = rarityName.toLowerCase().trim();

  // Direct match on name or shortName
  const directMatch = RARITY_EXPLAINERS.find(
    (r) => r.name.toLowerCase() === normalizedName || r.shortName.toLowerCase() === normalizedName
  );
  if (directMatch) return directMatch;

  // Check exact apiMatches
  for (const rarity of RARITY_EXPLAINERS) {
    if (rarity.apiMatches.some((match) => match.toLowerCase() === normalizedName)) {
      return rarity;
    }
  }

  // Fallback to keyword matching
  return matchRarityByKeywords(normalizedName);
}

/**
 * Get all rarity explainers.
 */
export function getAllRarityInfo(): readonly RarityInfo[] {
  return RARITY_EXPLAINERS;
}

/**
 * Get rarity by sort order.
 */
export function getRarityBySortOrder(sortOrder: number): RarityInfo | null {
  return RARITY_EXPLAINERS.find((r) => r.sortOrder === sortOrder) ?? null;
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
 * Get a kid-friendly explanation of rarity tiers.
 */
export function getRarityExplanation(): string {
  return `Pokémon cards come in different rarities, shown by a symbol at the bottom of the card:
• ● Common - Found in almost every pack
• ◆ Uncommon - A bit harder to find
• ★ Rare - Special cards with a star symbol
• ★★ Ultra Rare - Powerful EX, GX, V, and VMAX cards
• ★★★ Secret Rare - The rarest cards with amazing artwork
• PROMO - Special cards from events and products`;
}

/**
 * Get fun facts about a rarity tier.
 */
export function getRarityFunFacts(rarityId: string): string[] {
  const facts: Record<string, string[]> = {
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
  };

  return facts[rarityId] ?? ['This is a special type of card!'];
}

/**
 * Get collecting advice for a specific rarity.
 */
export function getCollectingAdvice(rarityId: string): string {
  const advice: Record<string, string> = {
    common: 'Sort your commons by type or set to find them easily when building decks.',
    uncommon: 'Keep an eye out for uncommons with useful Abilities - they can be deck staples!',
    rare: 'Store rare holos in penny sleeves or toploaders to prevent scratches.',
    'ultra-rare':
      'Consider double-sleeving your Ultra Rares: penny sleeve first, then deck sleeve.',
    'secret-rare':
      'Secret Rares are best stored in toploaders or magnetic cases for maximum protection.',
    promo: 'Track which events and products have promos you want - some are very limited edition!',
  };

  return advice[rarityId] ?? 'Keep your cards organized and protected!';
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
