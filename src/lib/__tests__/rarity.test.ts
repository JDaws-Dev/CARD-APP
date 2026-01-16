/**
 * Tests for rarity filtering and categorization utilities.
 */

import { describe, expect, it } from 'vitest';
import {
  // Types
  type CardWithRarity,
  type RarityTier,
  type RarityDistribution,

  // Constants
  POKEMON_RARITIES,
  POKEMON_RARITY_NAMES,
  RARITY_TIER_ORDER,

  // Lookup functions
  getRarityDefinition,
  getRarityTier,
  getRaritySortOrder,
  getRarityDisplayName,
  getRarityColor,
  isUltraRareOrHigher,
  isChaseRarity,
  isKnownRarity,

  // Filtering functions
  filterByRarity,
  filterByRarities,
  filterByRarityTier,
  filterUltraRareOrHigher,
  filterChaseCards,
  filterCardsWithRarity,
  filterCardsWithoutRarity,

  // Sorting functions
  sortByRarityAscending,
  sortByRarityDescending,
  sortBySetThenRarity,

  // Grouping & Counting functions
  groupByRarity,
  countByRarity,
  countByRarityTier,
  getUniqueRarities,
  getRarityDistribution,
  getCollectionRaritySummary,

  // Progress & Tracking functions
  calculateRarityCompletionPercent,
  getRarityTierCounts,
  hasRarity,
  hasRarityTier,

  // Display helper functions
  formatRarityDistribution,
  formatRarestCardsSummary,
  getAllRaritiesForDisplay,
  getRaritiesGroupedByTier,
  getRarityBadgeText,
  shouldHighlightRarity,

  // Validation functions
  normalizeRarity,
  validateRarityFilter,
} from '../rarity';

// ============================================================================
// TEST DATA
// ============================================================================

function createCard(cardId: string, rarity?: string): CardWithRarity {
  return {
    cardId,
    rarity,
    name: `Card ${cardId}`,
    setId: cardId.split('-')[0],
  };
}

function createTestCollection(): CardWithRarity[] {
  return [
    createCard('sv1-1', 'Common'),
    createCard('sv1-2', 'Common'),
    createCard('sv1-3', 'Common'),
    createCard('sv1-4', 'Uncommon'),
    createCard('sv1-5', 'Uncommon'),
    createCard('sv1-6', 'Rare'),
    createCard('sv1-7', 'Rare Holo'),
    createCard('sv1-8', 'Rare Holo V'),
    createCard('sv1-9', 'Rare Ultra'),
    createCard('sv1-10', 'Rare Secret'),
    createCard('sv2-1', 'Common'),
    createCard('sv2-2', 'Rare Rainbow'),
  ];
}

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('POKEMON_RARITIES', () => {
  it('should contain all standard Pokemon TCG rarities', () => {
    expect(POKEMON_RARITIES).toHaveProperty('Common');
    expect(POKEMON_RARITIES).toHaveProperty('Uncommon');
    expect(POKEMON_RARITIES).toHaveProperty('Rare');
    expect(POKEMON_RARITIES).toHaveProperty('Rare Holo');
    expect(POKEMON_RARITIES).toHaveProperty('Rare Ultra');
    expect(POKEMON_RARITIES).toHaveProperty('Rare Secret');
  });

  it('should have valid tiers for all rarities', () => {
    const validTiers: RarityTier[] = [
      'common',
      'uncommon',
      'rare',
      'ultra_rare',
      'secret',
      'unknown',
    ];
    for (const [name, def] of Object.entries(POKEMON_RARITIES)) {
      expect(validTiers).toContain(def.tier);
      expect(def.name).toBe(name);
      expect(def.displayName).toBeTruthy();
      expect(typeof def.sortOrder).toBe('number');
    }
  });

  it('should have unique sort orders', () => {
    const sortOrders = Object.values(POKEMON_RARITIES).map((def) => def.sortOrder);
    const uniqueSortOrders = new Set(sortOrders);
    expect(uniqueSortOrders.size).toBe(sortOrders.length);
  });
});

describe('POKEMON_RARITY_NAMES', () => {
  it('should match keys of POKEMON_RARITIES', () => {
    expect(POKEMON_RARITY_NAMES).toEqual(Object.keys(POKEMON_RARITIES));
  });
});

describe('RARITY_TIER_ORDER', () => {
  it('should contain all tiers in correct order', () => {
    expect(RARITY_TIER_ORDER).toEqual([
      'common',
      'uncommon',
      'rare',
      'ultra_rare',
      'secret',
      'unknown',
    ]);
  });
});

// ============================================================================
// LOOKUP FUNCTION TESTS
// ============================================================================

describe('getRarityDefinition', () => {
  it('should return definition for known rarities', () => {
    const def = getRarityDefinition('Common');
    expect(def).toBeDefined();
    expect(def?.tier).toBe('common');
    expect(def?.displayName).toBe('Common');
  });

  it('should return undefined for unknown rarities', () => {
    expect(getRarityDefinition('Unknown Rarity')).toBeUndefined();
  });
});

describe('getRarityTier', () => {
  it('should return correct tier for known rarities', () => {
    expect(getRarityTier('Common')).toBe('common');
    expect(getRarityTier('Uncommon')).toBe('uncommon');
    expect(getRarityTier('Rare')).toBe('rare');
    expect(getRarityTier('Rare Holo V')).toBe('ultra_rare');
    expect(getRarityTier('Rare Secret')).toBe('secret');
  });

  it('should return unknown for undefined rarity', () => {
    expect(getRarityTier(undefined)).toBe('unknown');
  });

  it('should return unknown for unrecognized rarity', () => {
    expect(getRarityTier('Made Up Rarity')).toBe('unknown');
  });
});

describe('getRaritySortOrder', () => {
  it('should return lower numbers for common rarities', () => {
    const commonOrder = getRaritySortOrder('Common');
    const uncommonOrder = getRaritySortOrder('Uncommon');
    const rareOrder = getRaritySortOrder('Rare');
    const secretOrder = getRaritySortOrder('Rare Secret');

    expect(commonOrder).toBeLessThan(uncommonOrder);
    expect(uncommonOrder).toBeLessThan(rareOrder);
    expect(rareOrder).toBeLessThan(secretOrder);
  });

  it('should return 999 for undefined rarity', () => {
    expect(getRaritySortOrder(undefined)).toBe(999);
  });

  it('should return 999 for unknown rarity', () => {
    expect(getRaritySortOrder('Made Up Rarity')).toBe(999);
  });
});

describe('getRarityDisplayName', () => {
  it('should return display name for known rarities', () => {
    expect(getRarityDisplayName('Common')).toBe('Common');
    expect(getRarityDisplayName('Rare Secret')).toBe('Secret Rare');
    expect(getRarityDisplayName('Rare Ultra')).toBe('Ultra Rare');
  });

  it('should return "Unknown" for undefined rarity', () => {
    expect(getRarityDisplayName(undefined)).toBe('Unknown');
  });

  it('should return original name for unrecognized rarity', () => {
    expect(getRarityDisplayName('Made Up Rarity')).toBe('Made Up Rarity');
  });
});

describe('getRarityColor', () => {
  it('should return color for known rarities', () => {
    const commonColor = getRarityColor('Common');
    expect(commonColor).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('should return default gray for undefined rarity', () => {
    expect(getRarityColor(undefined)).toBe('#6B7280');
  });

  it('should return default gray for unknown rarity', () => {
    expect(getRarityColor('Made Up Rarity')).toBe('#6B7280');
  });
});

describe('isUltraRareOrHigher', () => {
  it('should return true for ultra rare cards', () => {
    expect(isUltraRareOrHigher('Rare Holo V')).toBe(true);
    expect(isUltraRareOrHigher('Rare Holo VMAX')).toBe(true);
    expect(isUltraRareOrHigher('Rare Ultra')).toBe(true);
  });

  it('should return true for secret rare cards', () => {
    expect(isUltraRareOrHigher('Rare Secret')).toBe(true);
    expect(isUltraRareOrHigher('Rare Rainbow')).toBe(true);
  });

  it('should return false for common/uncommon/rare', () => {
    expect(isUltraRareOrHigher('Common')).toBe(false);
    expect(isUltraRareOrHigher('Uncommon')).toBe(false);
    expect(isUltraRareOrHigher('Rare')).toBe(false);
    expect(isUltraRareOrHigher('Rare Holo')).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isUltraRareOrHigher(undefined)).toBe(false);
  });
});

describe('isChaseRarity', () => {
  it('should return true for secret tier rarities', () => {
    expect(isChaseRarity('Rare Secret')).toBe(true);
    expect(isChaseRarity('Rare Rainbow')).toBe(true);
    expect(isChaseRarity('Hyper Rare')).toBe(true);
    expect(isChaseRarity('Special Illustration Rare')).toBe(true);
  });

  it('should return false for non-chase rarities', () => {
    expect(isChaseRarity('Common')).toBe(false);
    expect(isChaseRarity('Rare Ultra')).toBe(false);
    expect(isChaseRarity('Rare Holo V')).toBe(false);
  });
});

describe('isKnownRarity', () => {
  it('should return true for known rarities', () => {
    expect(isKnownRarity('Common')).toBe(true);
    expect(isKnownRarity('Rare Secret')).toBe(true);
    expect(isKnownRarity('Illustration Rare')).toBe(true);
  });

  it('should return false for unknown rarities', () => {
    expect(isKnownRarity('Made Up')).toBe(false);
    expect(isKnownRarity('')).toBe(false);
  });
});

// ============================================================================
// FILTERING FUNCTION TESTS
// ============================================================================

describe('filterByRarity', () => {
  it('should filter cards by exact rarity match', () => {
    const cards = createTestCollection();
    const commons = filterByRarity(cards, 'Common');

    expect(commons.length).toBe(4);
    expect(commons.every((c) => c.rarity === 'Common')).toBe(true);
  });

  it('should return empty array if no matches', () => {
    const cards = createTestCollection();
    const promos = filterByRarity(cards, 'Promo');

    expect(promos).toEqual([]);
  });
});

describe('filterByRarities', () => {
  it('should filter cards by multiple rarities', () => {
    const cards = createTestCollection();
    const filtered = filterByRarities(cards, ['Common', 'Uncommon']);

    expect(filtered.length).toBe(6);
    expect(filtered.every((c) => c.rarity === 'Common' || c.rarity === 'Uncommon')).toBe(true);
  });

  it('should return empty array if no rarities provided', () => {
    const cards = createTestCollection();
    const filtered = filterByRarities(cards, []);

    expect(filtered).toEqual([]);
  });
});

describe('filterByRarityTier', () => {
  it('should filter cards by tier', () => {
    const cards = createTestCollection();
    const ultraRares = filterByRarityTier(cards, 'ultra_rare');

    expect(ultraRares.length).toBe(2);
    expect(ultraRares.map((c) => c.rarity)).toContain('Rare Holo V');
    expect(ultraRares.map((c) => c.rarity)).toContain('Rare Ultra');
  });

  it('should filter secret tier cards', () => {
    const cards = createTestCollection();
    const secrets = filterByRarityTier(cards, 'secret');

    expect(secrets.length).toBe(2);
    expect(secrets.map((c) => c.rarity)).toContain('Rare Secret');
    expect(secrets.map((c) => c.rarity)).toContain('Rare Rainbow');
  });
});

describe('filterUltraRareOrHigher', () => {
  it('should return only ultra rare and secret rare cards', () => {
    const cards = createTestCollection();
    const highRarity = filterUltraRareOrHigher(cards);

    expect(highRarity.length).toBe(4);
    const rarities = highRarity.map((c) => c.rarity);
    expect(rarities).toContain('Rare Holo V');
    expect(rarities).toContain('Rare Ultra');
    expect(rarities).toContain('Rare Secret');
    expect(rarities).toContain('Rare Rainbow');
  });
});

describe('filterChaseCards', () => {
  it('should return only secret tier cards', () => {
    const cards = createTestCollection();
    const chase = filterChaseCards(cards);

    expect(chase.length).toBe(2);
    expect(chase.map((c) => c.rarity)).toContain('Rare Secret');
    expect(chase.map((c) => c.rarity)).toContain('Rare Rainbow');
  });
});

describe('filterCardsWithRarity', () => {
  it('should filter out cards without rarity', () => {
    const cards = [
      createCard('sv1-1', 'Common'),
      createCard('sv1-2', undefined),
      createCard('sv1-3', 'Rare'),
    ];

    const withRarity = filterCardsWithRarity(cards);
    expect(withRarity.length).toBe(2);
    expect(withRarity.every((c) => c.rarity !== undefined)).toBe(true);
  });
});

describe('filterCardsWithoutRarity', () => {
  it('should return only cards without rarity', () => {
    const cards = [
      createCard('sv1-1', 'Common'),
      createCard('sv1-2', undefined),
      createCard('sv1-3', 'Rare'),
    ];

    const withoutRarity = filterCardsWithoutRarity(cards);
    expect(withoutRarity.length).toBe(1);
    expect(withoutRarity[0].cardId).toBe('sv1-2');
  });
});

// ============================================================================
// SORTING FUNCTION TESTS
// ============================================================================

describe('sortByRarityAscending', () => {
  it('should sort cards from common to rare', () => {
    const cards = [
      createCard('sv1-1', 'Rare Secret'),
      createCard('sv1-2', 'Common'),
      createCard('sv1-3', 'Rare'),
    ];

    const sorted = sortByRarityAscending(cards);

    expect(sorted[0].rarity).toBe('Common');
    expect(sorted[1].rarity).toBe('Rare');
    expect(sorted[2].rarity).toBe('Rare Secret');
  });

  it('should not mutate original array', () => {
    const cards = [createCard('sv1-1', 'Rare'), createCard('sv1-2', 'Common')];
    const original = [...cards];
    sortByRarityAscending(cards);

    expect(cards).toEqual(original);
  });
});

describe('sortByRarityDescending', () => {
  it('should sort cards from rare to common', () => {
    const cards = [
      createCard('sv1-1', 'Common'),
      createCard('sv1-2', 'Rare Secret'),
      createCard('sv1-3', 'Rare'),
    ];

    const sorted = sortByRarityDescending(cards);

    expect(sorted[0].rarity).toBe('Rare Secret');
    expect(sorted[1].rarity).toBe('Rare');
    expect(sorted[2].rarity).toBe('Common');
  });
});

describe('sortBySetThenRarity', () => {
  it('should sort by set first, then by rarity', () => {
    const cards = [
      createCard('sv2-1', 'Common'),
      createCard('sv1-1', 'Rare'),
      createCard('sv1-2', 'Common'),
    ];

    const sorted = sortBySetThenRarity(cards);

    expect(sorted[0].cardId).toBe('sv1-2'); // sv1, Common
    expect(sorted[1].cardId).toBe('sv1-1'); // sv1, Rare
    expect(sorted[2].cardId).toBe('sv2-1'); // sv2, Common
  });

  it('should support descending rarity within set', () => {
    const cards = [createCard('sv1-1', 'Common'), createCard('sv1-2', 'Rare')];

    const sorted = sortBySetThenRarity(cards, false);

    expect(sorted[0].rarity).toBe('Rare');
    expect(sorted[1].rarity).toBe('Common');
  });
});

// ============================================================================
// GROUPING & COUNTING FUNCTION TESTS
// ============================================================================

describe('groupByRarity', () => {
  it('should group cards by rarity', () => {
    const cards = createTestCollection();
    const grouped = groupByRarity(cards);

    expect(grouped.get('Common')?.length).toBe(4);
    expect(grouped.get('Uncommon')?.length).toBe(2);
    expect(grouped.get('Rare')?.length).toBe(1);
  });

  it('should group cards without rarity as "Unknown"', () => {
    const cards = [createCard('sv1-1', 'Common'), createCard('sv1-2', undefined)];
    const grouped = groupByRarity(cards);

    expect(grouped.get('Unknown')?.length).toBe(1);
  });
});

describe('countByRarity', () => {
  it('should count cards by rarity', () => {
    const cards = createTestCollection();
    const counts = countByRarity(cards);

    expect(counts.get('Common')).toBe(4);
    expect(counts.get('Uncommon')).toBe(2);
    expect(counts.get('Rare')).toBe(1);
  });
});

describe('countByRarityTier', () => {
  it('should count cards by tier', () => {
    const cards = createTestCollection();
    const counts = countByRarityTier(cards);

    expect(counts.get('common')).toBe(4);
    expect(counts.get('uncommon')).toBe(2);
    expect(counts.get('rare')).toBe(2); // Rare + Rare Holo
    expect(counts.get('ultra_rare')).toBe(2);
    expect(counts.get('secret')).toBe(2);
  });
});

describe('getUniqueRarities', () => {
  it('should return unique rarities sorted by rarity order', () => {
    const cards = createTestCollection();
    const rarities = getUniqueRarities(cards);

    expect(rarities[0]).toBe('Common');
    expect(rarities).toContain('Uncommon');
    expect(rarities).toContain('Rare Secret');
    expect(rarities).toContain('Rare Rainbow');
  });

  it('should not include undefined rarities', () => {
    const cards = [createCard('sv1-1', 'Common'), createCard('sv1-2', undefined)];
    const rarities = getUniqueRarities(cards);

    expect(rarities).toEqual(['Common']);
  });
});

describe('getRarityDistribution', () => {
  it('should return distribution with counts and percentages', () => {
    const cards = [
      createCard('sv1-1', 'Common'),
      createCard('sv1-2', 'Common'),
      createCard('sv1-3', 'Rare'),
      createCard('sv1-4', 'Rare'),
    ];

    const distribution = getRarityDistribution(cards);

    expect(distribution.length).toBe(2);
    expect(distribution.find((d) => d.rarity === 'Common')?.count).toBe(2);
    expect(distribution.find((d) => d.rarity === 'Common')?.percentage).toBe(50);
  });

  it('should return empty array for empty collection', () => {
    expect(getRarityDistribution([])).toEqual([]);
  });
});

describe('getCollectionRaritySummary', () => {
  it('should return comprehensive summary', () => {
    const cards = createTestCollection();
    const summary = getCollectionRaritySummary(cards);

    expect(summary.totalCards).toBe(12);
    expect(summary.uniqueRarities).toBeGreaterThan(0);
    expect(summary.distribution.length).toBeGreaterThan(0);
    expect(summary.mostCommonRarity).toBe('Common');
    expect(summary.rarestCards).toBe(4); // Ultra rare + secret
  });

  it('should handle empty collection', () => {
    const summary = getCollectionRaritySummary([]);

    expect(summary.totalCards).toBe(0);
    expect(summary.uniqueRarities).toBe(0);
    expect(summary.mostCommonRarity).toBeNull();
    expect(summary.rarestCards).toBe(0);
  });
});

// ============================================================================
// PROGRESS & TRACKING FUNCTION TESTS
// ============================================================================

describe('calculateRarityCompletionPercent', () => {
  it('should calculate correct percentage', () => {
    expect(calculateRarityCompletionPercent(5, 10)).toBe(50);
    expect(calculateRarityCompletionPercent(3, 10)).toBe(30);
    expect(calculateRarityCompletionPercent(10, 10)).toBe(100);
  });

  it('should return 0 if total is 0', () => {
    expect(calculateRarityCompletionPercent(5, 0)).toBe(0);
  });

  it('should handle decimal percentages', () => {
    expect(calculateRarityCompletionPercent(1, 3)).toBeCloseTo(33.33, 1);
  });
});

describe('getRarityTierCounts', () => {
  it('should return counts for all tiers', () => {
    const cards = createTestCollection();
    const counts = getRarityTierCounts(cards);

    expect(counts.common).toBe(4);
    expect(counts.uncommon).toBe(2);
    expect(counts.rare).toBe(2);
    expect(counts.ultra_rare).toBe(2);
    expect(counts.secret).toBe(2);
    expect(counts.unknown).toBe(0);
  });
});

describe('hasRarity', () => {
  it('should return true if collection has rarity', () => {
    const cards = createTestCollection();

    expect(hasRarity(cards, 'Common')).toBe(true);
    expect(hasRarity(cards, 'Rare Secret')).toBe(true);
  });

  it('should return false if collection lacks rarity', () => {
    const cards = createTestCollection();

    expect(hasRarity(cards, 'Promo')).toBe(false);
  });
});

describe('hasRarityTier', () => {
  it('should return true if collection has tier', () => {
    const cards = createTestCollection();

    expect(hasRarityTier(cards, 'common')).toBe(true);
    expect(hasRarityTier(cards, 'secret')).toBe(true);
  });

  it('should return false if collection lacks tier', () => {
    const cards = [createCard('sv1-1', 'Common')];

    expect(hasRarityTier(cards, 'secret')).toBe(false);
  });
});

// ============================================================================
// DISPLAY HELPER FUNCTION TESTS
// ============================================================================

describe('formatRarityDistribution', () => {
  it('should format distribution as readable string', () => {
    const distribution: RarityDistribution[] = [
      { rarity: 'Common', count: 5, percentage: 50 },
      { rarity: 'Rare', count: 5, percentage: 50 },
    ];

    const formatted = formatRarityDistribution(distribution);

    expect(formatted).toContain('Common (50%)');
    expect(formatted).toContain('Rare (50%)');
  });
});

describe('formatRarestCardsSummary', () => {
  it('should format ultra rare and secret rare counts', () => {
    const cards = createTestCollection();
    const summary = formatRarestCardsSummary(cards);

    expect(summary).toContain('Ultra Rare');
    expect(summary).toContain('Secret Rare');
  });

  it('should return message for no rare cards', () => {
    const cards = [createCard('sv1-1', 'Common')];
    const summary = formatRarestCardsSummary(cards);

    expect(summary).toBe('No ultra-rare cards');
  });

  it('should use singular form for 1 card', () => {
    const cards = [createCard('sv1-1', 'Rare Secret')];
    const summary = formatRarestCardsSummary(cards);

    expect(summary).toBe('1 Secret Rare');
  });
});

describe('getAllRaritiesForDisplay', () => {
  it('should return all rarities sorted by sort order', () => {
    const rarities = getAllRaritiesForDisplay();

    expect(rarities.length).toBeGreaterThan(0);
    expect(rarities[0].value).toBe('Common');
    expect(rarities[0].label).toBe('Common');

    // Verify sort order
    for (let i = 1; i < rarities.length; i++) {
      const prevOrder = getRaritySortOrder(rarities[i - 1].value);
      const currOrder = getRaritySortOrder(rarities[i].value);
      expect(prevOrder).toBeLessThanOrEqual(currOrder);
    }
  });
});

describe('getRaritiesGroupedByTier', () => {
  it('should group rarities by tier', () => {
    const grouped = getRaritiesGroupedByTier();

    expect(grouped.common.length).toBeGreaterThan(0);
    expect(grouped.uncommon.length).toBeGreaterThan(0);
    expect(grouped.rare.length).toBeGreaterThan(0);
    expect(grouped.ultra_rare.length).toBeGreaterThan(0);
    expect(grouped.secret.length).toBeGreaterThan(0);
  });
});

describe('getRarityBadgeText', () => {
  it('should format badge text correctly', () => {
    expect(getRarityBadgeText(1, 'Common')).toBe('1 Common');
    expect(getRarityBadgeText(5, 'Rare')).toBe('5 Rares');
    expect(getRarityBadgeText(3, 'Rare Secret')).toBe('3 Secret Rares');
  });
});

describe('shouldHighlightRarity', () => {
  it('should highlight ultra rare and secret cards', () => {
    expect(shouldHighlightRarity('Rare Secret')).toBe(true);
    expect(shouldHighlightRarity('Rare Ultra')).toBe(true);
    expect(shouldHighlightRarity('Rare Holo V')).toBe(true);
  });

  it('should not highlight common cards', () => {
    expect(shouldHighlightRarity('Common')).toBe(false);
    expect(shouldHighlightRarity('Rare')).toBe(false);
    expect(shouldHighlightRarity(undefined)).toBe(false);
  });
});

// ============================================================================
// VALIDATION FUNCTION TESTS
// ============================================================================

describe('normalizeRarity', () => {
  it('should return exact match for known rarities', () => {
    expect(normalizeRarity('Common')).toBe('Common');
    expect(normalizeRarity('Rare Secret')).toBe('Rare Secret');
  });

  it('should normalize case variations', () => {
    expect(normalizeRarity('common')).toBe('Common');
    expect(normalizeRarity('COMMON')).toBe('Common');
    expect(normalizeRarity('RARE SECRET')).toBe('Rare Secret');
  });

  it('should return original for unknown rarities', () => {
    expect(normalizeRarity('Made Up')).toBe('Made Up');
  });
});

describe('validateRarityFilter', () => {
  it('should normalize and deduplicate rarities', () => {
    const input = ['Common', 'common', 'Rare', 'RARE'];
    const validated = validateRarityFilter(input);

    expect(validated.length).toBe(2);
    expect(validated).toContain('Common');
    expect(validated).toContain('Rare');
  });

  it('should preserve unknown rarities', () => {
    const input = ['Common', 'Unknown Rarity'];
    const validated = validateRarityFilter(input);

    expect(validated).toContain('Common');
    expect(validated).toContain('Unknown Rarity');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Rarity Integration: Collection Analysis', () => {
  it('should analyze a mixed collection correctly', () => {
    const cards = createTestCollection();

    // Get distribution
    const distribution = getRarityDistribution(cards);
    expect(distribution.length).toBeGreaterThan(0);

    // Get unique rarities
    const rarities = getUniqueRarities(cards);
    expect(rarities.length).toBe(distribution.length);

    // Filter ultra rares
    const ultraRares = filterUltraRareOrHigher(cards);
    expect(ultraRares.length).toBe(4);

    // Sort by rarity
    const sorted = sortByRarityDescending(cards);
    expect(isChaseRarity(sorted[0].rarity)).toBe(true);
  });
});

describe('Rarity Integration: Filter Workflow', () => {
  it('should support typical UI filter workflow', () => {
    const cards = createTestCollection();

    // 1. Get available rarities for dropdown
    const availableRarities = getUniqueRarities(cards);
    expect(availableRarities.length).toBeGreaterThan(0);

    // 2. User selects multiple rarities
    const selectedRarities = ['Common', 'Uncommon'];
    const validated = validateRarityFilter(selectedRarities);

    // 3. Filter cards
    const filtered = filterByRarities(cards, validated);
    expect(filtered.every((c) => selectedRarities.includes(c.rarity!))).toBe(true);

    // 4. Sort filtered results
    const sorted = sortByRarityAscending(filtered);
    expect(sorted[0].rarity).toBe('Common');
  });
});

describe('Rarity Integration: Display Formatting', () => {
  it('should format collection for display', () => {
    const cards = createTestCollection();

    // Get summary
    const summary = getCollectionRaritySummary(cards);

    // Format distribution
    const formattedDist = formatRarityDistribution(summary.distribution);
    expect(formattedDist).toBeTruthy();

    // Format rarest cards
    const rarestSummary = formatRarestCardsSummary(cards);
    expect(rarestSummary).toBeTruthy();

    // Get all for display
    const displayRarities = getAllRaritiesForDisplay();
    expect(displayRarities.length).toBeGreaterThan(0);
  });
});
