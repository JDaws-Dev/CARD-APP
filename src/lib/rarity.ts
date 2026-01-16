/**
 * Pure utility functions for card rarity filtering and categorization.
 * These functions support efficient rarity-based filtering across all TCGs.
 */

// ============================================================================
// TYPES
// ============================================================================

/** Card with rarity information for filtering */
export interface CardWithRarity {
  cardId: string;
  rarity?: string;
  name?: string;
  setId?: string;
}

/** Rarity distribution summary */
export interface RarityDistribution {
  rarity: string;
  count: number;
  percentage: number;
}

/** Collection rarity summary */
export interface CollectionRaritySummary {
  totalCards: number;
  uniqueRarities: number;
  distribution: RarityDistribution[];
  mostCommonRarity: string | null;
  rarestCards: number; // Count of cards with ultra-rare+ rarity
}

/** Rarity tier for sorting/filtering */
export type RarityTier = 'common' | 'uncommon' | 'rare' | 'ultra_rare' | 'secret' | 'unknown';

/** Rarity definition with metadata */
export interface RarityDefinition {
  name: string;
  tier: RarityTier;
  displayName: string;
  sortOrder: number;
  color?: string;
}

// ============================================================================
// POKEMON TCG RARITIES
// ============================================================================

/**
 * Pokemon TCG rarity definitions ordered by value/rarity.
 * Based on the Pokemon TCG API rarity values.
 */
export const POKEMON_RARITIES: Record<string, RarityDefinition> = {
  Common: {
    name: 'Common',
    tier: 'common',
    displayName: 'Common',
    sortOrder: 1,
    color: '#9CA3AF',
  },
  Uncommon: {
    name: 'Uncommon',
    tier: 'uncommon',
    displayName: 'Uncommon',
    sortOrder: 2,
    color: '#10B981',
  },
  Rare: {
    name: 'Rare',
    tier: 'rare',
    displayName: 'Rare',
    sortOrder: 3,
    color: '#3B82F6',
  },
  'Rare Holo': {
    name: 'Rare Holo',
    tier: 'rare',
    displayName: 'Rare Holo',
    sortOrder: 4,
    color: '#3B82F6',
  },
  'Rare Holo EX': {
    name: 'Rare Holo EX',
    tier: 'ultra_rare',
    displayName: 'Rare Holo EX',
    sortOrder: 5,
    color: '#8B5CF6',
  },
  'Rare Holo GX': {
    name: 'Rare Holo GX',
    tier: 'ultra_rare',
    displayName: 'Rare Holo GX',
    sortOrder: 6,
    color: '#8B5CF6',
  },
  'Rare Holo V': {
    name: 'Rare Holo V',
    tier: 'ultra_rare',
    displayName: 'Rare Holo V',
    sortOrder: 7,
    color: '#8B5CF6',
  },
  'Rare Holo VMAX': {
    name: 'Rare Holo VMAX',
    tier: 'ultra_rare',
    displayName: 'Rare Holo VMAX',
    sortOrder: 8,
    color: '#EC4899',
  },
  'Rare Holo VSTAR': {
    name: 'Rare Holo VSTAR',
    tier: 'ultra_rare',
    displayName: 'Rare Holo VSTAR',
    sortOrder: 9,
    color: '#EC4899',
  },
  'Rare Ultra': {
    name: 'Rare Ultra',
    tier: 'ultra_rare',
    displayName: 'Ultra Rare',
    sortOrder: 10,
    color: '#EC4899',
  },
  'Rare Secret': {
    name: 'Rare Secret',
    tier: 'secret',
    displayName: 'Secret Rare',
    sortOrder: 11,
    color: '#F59E0B',
  },
  'Rare Rainbow': {
    name: 'Rare Rainbow',
    tier: 'secret',
    displayName: 'Rainbow Rare',
    sortOrder: 12,
    color: '#F59E0B',
  },
  'Rare Shining': {
    name: 'Rare Shining',
    tier: 'secret',
    displayName: 'Shining',
    sortOrder: 13,
    color: '#F59E0B',
  },
  'Amazing Rare': {
    name: 'Amazing Rare',
    tier: 'ultra_rare',
    displayName: 'Amazing Rare',
    sortOrder: 14,
    color: '#EC4899',
  },
  'Radiant Rare': {
    name: 'Radiant Rare',
    tier: 'ultra_rare',
    displayName: 'Radiant Rare',
    sortOrder: 15,
    color: '#EC4899',
  },
  'Double Rare': {
    name: 'Double Rare',
    tier: 'ultra_rare',
    displayName: 'Double Rare',
    sortOrder: 16,
    color: '#8B5CF6',
  },
  'Illustration Rare': {
    name: 'Illustration Rare',
    tier: 'ultra_rare',
    displayName: 'Illustration Rare',
    sortOrder: 17,
    color: '#EC4899',
  },
  'Special Illustration Rare': {
    name: 'Special Illustration Rare',
    tier: 'secret',
    displayName: 'Special Illustration Rare',
    sortOrder: 18,
    color: '#F59E0B',
  },
  'Hyper Rare': {
    name: 'Hyper Rare',
    tier: 'secret',
    displayName: 'Hyper Rare',
    sortOrder: 19,
    color: '#F59E0B',
  },
  'Shiny Rare': {
    name: 'Shiny Rare',
    tier: 'ultra_rare',
    displayName: 'Shiny Rare',
    sortOrder: 20,
    color: '#EC4899',
  },
  'Shiny Ultra Rare': {
    name: 'Shiny Ultra Rare',
    tier: 'secret',
    displayName: 'Shiny Ultra Rare',
    sortOrder: 21,
    color: '#F59E0B',
  },
  'ACE SPEC Rare': {
    name: 'ACE SPEC Rare',
    tier: 'ultra_rare',
    displayName: 'ACE SPEC',
    sortOrder: 22,
    color: '#8B5CF6',
  },
  Promo: {
    name: 'Promo',
    tier: 'rare',
    displayName: 'Promo',
    sortOrder: 23,
    color: '#6366F1',
  },
  Classic: {
    name: 'Classic',
    tier: 'rare',
    displayName: 'Classic',
    sortOrder: 24,
    color: '#6366F1',
  },
};

/**
 * All known Pokemon TCG rarity names.
 */
export const POKEMON_RARITY_NAMES: string[] = Object.keys(POKEMON_RARITIES);

/**
 * Rarity tiers in order from most common to most rare.
 */
export const RARITY_TIER_ORDER: RarityTier[] = [
  'common',
  'uncommon',
  'rare',
  'ultra_rare',
  'secret',
  'unknown',
];

// ============================================================================
// RARITY LOOKUP
// ============================================================================

/**
 * Gets the rarity definition for a given rarity name.
 * Returns undefined if the rarity is not in the known list.
 */
export function getRarityDefinition(rarity: string): RarityDefinition | undefined {
  return POKEMON_RARITIES[rarity];
}

/**
 * Gets the tier for a rarity name.
 * Returns 'unknown' if rarity is not recognized.
 */
export function getRarityTier(rarity: string | undefined): RarityTier {
  if (!rarity) return 'unknown';
  const definition = POKEMON_RARITIES[rarity];
  return definition?.tier ?? 'unknown';
}

/**
 * Gets the sort order for a rarity.
 * Higher numbers = more rare. Unknown rarities get a high sort order.
 */
export function getRaritySortOrder(rarity: string | undefined): number {
  if (!rarity) return 999;
  const definition = POKEMON_RARITIES[rarity];
  return definition?.sortOrder ?? 999;
}

/**
 * Gets the display name for a rarity.
 * Returns the original name if not found in definitions.
 */
export function getRarityDisplayName(rarity: string | undefined): string {
  if (!rarity) return 'Unknown';
  const definition = POKEMON_RARITIES[rarity];
  return definition?.displayName ?? rarity;
}

/**
 * Gets the color associated with a rarity for UI display.
 * Returns a default gray if not found.
 */
export function getRarityColor(rarity: string | undefined): string {
  if (!rarity) return '#6B7280';
  const definition = POKEMON_RARITIES[rarity];
  return definition?.color ?? '#6B7280';
}

/**
 * Checks if a rarity is considered "ultra rare" or higher.
 */
export function isUltraRareOrHigher(rarity: string | undefined): boolean {
  const tier = getRarityTier(rarity);
  return tier === 'ultra_rare' || tier === 'secret';
}

/**
 * Checks if a rarity is considered a "chase" card (secret rare tier).
 */
export function isChaseRarity(rarity: string | undefined): boolean {
  return getRarityTier(rarity) === 'secret';
}

/**
 * Checks if a rarity string is a known valid rarity.
 */
export function isKnownRarity(rarity: string): boolean {
  return rarity in POKEMON_RARITIES;
}

// ============================================================================
// FILTERING
// ============================================================================

/**
 * Filters cards by a specific rarity.
 */
export function filterByRarity<T extends CardWithRarity>(cards: T[], rarity: string): T[] {
  return cards.filter((card) => card.rarity === rarity);
}

/**
 * Filters cards by multiple rarities.
 */
export function filterByRarities<T extends CardWithRarity>(cards: T[], rarities: string[]): T[] {
  const raritySet = new Set(rarities);
  return cards.filter((card) => card.rarity && raritySet.has(card.rarity));
}

/**
 * Filters cards by rarity tier.
 */
export function filterByRarityTier<T extends CardWithRarity>(cards: T[], tier: RarityTier): T[] {
  return cards.filter((card) => getRarityTier(card.rarity) === tier);
}

/**
 * Filters cards to only include ultra rare or higher.
 */
export function filterUltraRareOrHigher<T extends CardWithRarity>(cards: T[]): T[] {
  return cards.filter((card) => isUltraRareOrHigher(card.rarity));
}

/**
 * Filters cards to only include chase/secret rarities.
 */
export function filterChaseCards<T extends CardWithRarity>(cards: T[]): T[] {
  return cards.filter((card) => isChaseRarity(card.rarity));
}

/**
 * Filters cards that have a rarity value (excludes cards with undefined/null rarity).
 */
export function filterCardsWithRarity<T extends CardWithRarity>(cards: T[]): T[] {
  return cards.filter((card) => card.rarity !== undefined && card.rarity !== null);
}

/**
 * Filters cards that don't have a rarity value.
 */
export function filterCardsWithoutRarity<T extends CardWithRarity>(cards: T[]): T[] {
  return cards.filter((card) => card.rarity === undefined || card.rarity === null);
}

// ============================================================================
// SORTING
// ============================================================================

/**
 * Sorts cards by rarity (most common first).
 */
export function sortByRarityAscending<T extends CardWithRarity>(cards: T[]): T[] {
  return [...cards].sort((a, b) => getRaritySortOrder(a.rarity) - getRaritySortOrder(b.rarity));
}

/**
 * Sorts cards by rarity (most rare first).
 */
export function sortByRarityDescending<T extends CardWithRarity>(cards: T[]): T[] {
  return [...cards].sort((a, b) => getRaritySortOrder(b.rarity) - getRaritySortOrder(a.rarity));
}

/**
 * Sorts cards by rarity within the same set.
 * Primary sort by set, secondary sort by rarity.
 */
export function sortBySetThenRarity<T extends CardWithRarity>(cards: T[], ascending = true): T[] {
  return [...cards].sort((a, b) => {
    const setCompare = (a.setId ?? '').localeCompare(b.setId ?? '');
    if (setCompare !== 0) return setCompare;

    const rarityDiff = getRaritySortOrder(a.rarity) - getRaritySortOrder(b.rarity);
    return ascending ? rarityDiff : -rarityDiff;
  });
}

// ============================================================================
// GROUPING & COUNTING
// ============================================================================

/**
 * Groups cards by rarity.
 */
export function groupByRarity<T extends CardWithRarity>(cards: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const card of cards) {
    const rarity = card.rarity ?? 'Unknown';
    const existing = grouped.get(rarity) ?? [];
    existing.push(card);
    grouped.set(rarity, existing);
  }

  return grouped;
}

/**
 * Counts cards by rarity.
 */
export function countByRarity(cards: CardWithRarity[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const card of cards) {
    const rarity = card.rarity ?? 'Unknown';
    counts.set(rarity, (counts.get(rarity) ?? 0) + 1);
  }

  return counts;
}

/**
 * Counts cards by rarity tier.
 */
export function countByRarityTier(cards: CardWithRarity[]): Map<RarityTier, number> {
  const counts = new Map<RarityTier, number>();

  for (const card of cards) {
    const tier = getRarityTier(card.rarity);
    counts.set(tier, (counts.get(tier) ?? 0) + 1);
  }

  return counts;
}

/**
 * Gets all unique rarities from a collection of cards.
 */
export function getUniqueRarities(cards: CardWithRarity[]): string[] {
  const rarities = new Set<string>();
  for (const card of cards) {
    if (card.rarity) {
      rarities.add(card.rarity);
    }
  }
  return Array.from(rarities).sort((a, b) => getRaritySortOrder(a) - getRaritySortOrder(b));
}

/**
 * Gets the rarity distribution of a collection.
 */
export function getRarityDistribution(cards: CardWithRarity[]): RarityDistribution[] {
  const total = cards.length;
  if (total === 0) return [];

  const counts = countByRarity(cards);
  const distribution: RarityDistribution[] = [];

  for (const [rarity, count] of counts) {
    distribution.push({
      rarity,
      count,
      percentage: Math.round((count / total) * 100 * 100) / 100,
    });
  }

  // Sort by rarity sort order
  return distribution.sort((a, b) => getRaritySortOrder(a.rarity) - getRaritySortOrder(b.rarity));
}

/**
 * Gets a comprehensive rarity summary for a collection.
 */
export function getCollectionRaritySummary(cards: CardWithRarity[]): CollectionRaritySummary {
  const distribution = getRarityDistribution(cards);
  const uniqueRarities = getUniqueRarities(cards);

  // Find most common rarity
  let mostCommonRarity: string | null = null;
  let maxCount = 0;
  for (const d of distribution) {
    if (d.count > maxCount) {
      maxCount = d.count;
      mostCommonRarity = d.rarity;
    }
  }

  // Count ultra rare+ cards
  const rarestCards = filterUltraRareOrHigher(cards).length;

  return {
    totalCards: cards.length,
    uniqueRarities: uniqueRarities.length,
    distribution,
    mostCommonRarity,
    rarestCards,
  };
}

// ============================================================================
// PROGRESS & TRACKING
// ============================================================================

/**
 * Calculates what percentage of a set's cards of a given rarity the user owns.
 * Requires the total cards in the set for that rarity.
 */
export function calculateRarityCompletionPercent(ownedCount: number, totalInSet: number): number {
  if (totalInSet === 0) return 0;
  return Math.round((ownedCount / totalInSet) * 100 * 100) / 100;
}

/**
 * Gets the count of each rarity tier in a collection.
 * Useful for achievement tracking.
 */
export function getRarityTierCounts(cards: CardWithRarity[]): Record<RarityTier, number> {
  const counts: Record<RarityTier, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    ultra_rare: 0,
    secret: 0,
    unknown: 0,
  };

  for (const card of cards) {
    const tier = getRarityTier(card.rarity);
    counts[tier]++;
  }

  return counts;
}

/**
 * Checks if a collection has at least one card of a specific rarity.
 */
export function hasRarity(cards: CardWithRarity[], rarity: string): boolean {
  return cards.some((card) => card.rarity === rarity);
}

/**
 * Checks if a collection has at least one card in a rarity tier.
 */
export function hasRarityTier(cards: CardWithRarity[], tier: RarityTier): boolean {
  return cards.some((card) => getRarityTier(card.rarity) === tier);
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Gets a formatted string for displaying rarity distribution.
 * Example: "Common (45%), Uncommon (30%), Rare (25%)"
 */
export function formatRarityDistribution(distribution: RarityDistribution[]): string {
  return distribution.map((d) => `${getRarityDisplayName(d.rarity)} (${d.percentage}%)`).join(', ');
}

/**
 * Gets a short summary of the rarest cards in a collection.
 * Example: "5 Ultra Rares, 2 Secret Rares"
 */
export function formatRarestCardsSummary(cards: CardWithRarity[]): string {
  const tierCounts = countByRarityTier(cards);
  const parts: string[] = [];

  const ultraRareCount = tierCounts.get('ultra_rare') ?? 0;
  const secretCount = tierCounts.get('secret') ?? 0;

  if (ultraRareCount > 0) {
    parts.push(`${ultraRareCount} Ultra Rare${ultraRareCount !== 1 ? 's' : ''}`);
  }
  if (secretCount > 0) {
    parts.push(`${secretCount} Secret Rare${secretCount !== 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return 'No ultra-rare cards';
  }

  return parts.join(', ');
}

/**
 * Gets all rarities sorted by sort order for dropdown/filter display.
 */
export function getAllRaritiesForDisplay(): Array<{ value: string; label: string }> {
  return Object.entries(POKEMON_RARITIES)
    .sort(([, a], [, b]) => a.sortOrder - b.sortOrder)
    .map(([name, def]) => ({
      value: name,
      label: def.displayName,
    }));
}

/**
 * Gets rarities grouped by tier for grouped dropdown display.
 */
export function getRaritiesGroupedByTier(): Record<
  RarityTier,
  Array<{ value: string; label: string }>
> {
  const grouped: Record<RarityTier, Array<{ value: string; label: string }>> = {
    common: [],
    uncommon: [],
    rare: [],
    ultra_rare: [],
    secret: [],
    unknown: [],
  };

  for (const [name, def] of Object.entries(POKEMON_RARITIES)) {
    grouped[def.tier].push({
      value: name,
      label: def.displayName,
    });
  }

  // Sort each group by sort order
  for (const tier of RARITY_TIER_ORDER) {
    grouped[tier].sort((a, b) => {
      const aOrder = POKEMON_RARITIES[a.value]?.sortOrder ?? 999;
      const bOrder = POKEMON_RARITIES[b.value]?.sortOrder ?? 999;
      return aOrder - bOrder;
    });
  }

  return grouped;
}

/**
 * Gets a badge text for rarity count display.
 * Example: "5 Rare", "12 Ultra Rares"
 */
export function getRarityBadgeText(count: number, rarity: string): string {
  const displayName = getRarityDisplayName(rarity);
  if (count === 1) {
    return `1 ${displayName}`;
  }
  return `${count} ${displayName}${count !== 1 ? 's' : ''}`;
}

/**
 * Returns true if the given rarity should be highlighted in the UI.
 * Generally highlights ultra rare and secret rare cards.
 */
export function shouldHighlightRarity(rarity: string | undefined): boolean {
  return isUltraRareOrHigher(rarity);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Normalizes a rarity string to match known rarities.
 * Handles common variations in casing or spacing.
 */
export function normalizeRarity(rarity: string): string {
  // First check for exact match
  if (rarity in POKEMON_RARITIES) {
    return rarity;
  }

  // Try case-insensitive match
  const lowerRarity = rarity.toLowerCase();
  for (const knownRarity of POKEMON_RARITY_NAMES) {
    if (knownRarity.toLowerCase() === lowerRarity) {
      return knownRarity;
    }
  }

  // Return original if no match found
  return rarity;
}

/**
 * Validates and normalizes a rarity filter array.
 * Removes invalid rarities and normalizes valid ones.
 */
export function validateRarityFilter(rarities: string[]): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const rarity of rarities) {
    const normalizedRarity = normalizeRarity(rarity);
    if (!seen.has(normalizedRarity)) {
      seen.add(normalizedRarity);
      normalized.push(normalizedRarity);
    }
  }

  return normalized;
}
