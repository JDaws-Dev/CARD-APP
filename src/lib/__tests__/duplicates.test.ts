import { describe, it, expect } from 'vitest';
import {
  CollectionCard,
  groupCardsByCardId,
  aggregateVariants,
  findDuplicates,
  findTradeableCards,
  compareCollections,
  getUniqueCardIds,
  getTotalQuantity,
  calculateOverlapPercentage,
  findExcessCards,
  getVariantSummary,
} from '../duplicates';

describe('Duplicate Finder Utilities', () => {
  // Test data factories
  const createCard = (
    cardId: string,
    quantity = 1,
    variant?: string | null
  ): CollectionCard => ({
    cardId,
    quantity,
    variant,
  });

  describe('groupCardsByCardId', () => {
    it('should group cards by cardId', () => {
      const cards = [
        createCard('sv1-1', 2, 'normal'),
        createCard('sv1-1', 1, 'holofoil'),
        createCard('sv1-2', 3, 'normal'),
      ];

      const grouped = groupCardsByCardId(cards);

      expect(grouped.size).toBe(2);
      expect(grouped.get('sv1-1')).toHaveLength(2);
      expect(grouped.get('sv1-2')).toHaveLength(1);
    });

    it('should handle cards without variant (defaults to normal)', () => {
      const cards = [
        createCard('sv1-1', 2),
        createCard('sv1-1', 1, null),
      ];

      const grouped = groupCardsByCardId(cards);
      const entries = grouped.get('sv1-1');

      expect(entries).toHaveLength(2);
      expect(entries?.every((e) => e.variant === 'normal')).toBe(true);
    });

    it('should return empty map for empty array', () => {
      const grouped = groupCardsByCardId([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe('aggregateVariants', () => {
    it('should aggregate quantities by variant', () => {
      const variants = [
        { quantity: 2, variant: 'normal' },
        { quantity: 1, variant: 'holofoil' },
        { quantity: 3, variant: 'normal' },
      ];

      const result = aggregateVariants(variants);

      expect(result.quantity).toBe(6);
      expect(result.variants.normal).toBe(5);
      expect(result.variants.holofoil).toBe(1);
    });

    it('should handle single variant', () => {
      const variants = [{ quantity: 5, variant: 'normal' }];

      const result = aggregateVariants(variants);

      expect(result.quantity).toBe(5);
      expect(result.variants.normal).toBe(5);
    });

    it('should return zero for empty array', () => {
      const result = aggregateVariants([]);

      expect(result.quantity).toBe(0);
      expect(Object.keys(result.variants)).toHaveLength(0);
    });
  });

  describe('findDuplicates', () => {
    it('should find cards that exist in both collections', () => {
      const profile1Cards = [
        createCard('sv1-1', 2, 'normal'),
        createCard('sv1-2', 1, 'holofoil'),
        createCard('sv1-3', 3, 'normal'),
      ];
      const profile2Cards = [
        createCard('sv1-1', 1, 'holofoil'),
        createCard('sv1-3', 2, 'normal'),
        createCard('sv1-4', 1, 'normal'),
      ];

      const duplicates = findDuplicates(profile1Cards, profile2Cards);

      expect(duplicates).toHaveLength(2);
      expect(duplicates.map((d) => d.cardId).sort()).toEqual(['sv1-1', 'sv1-3']);
    });

    it('should include variant details for each profile', () => {
      const profile1Cards = [
        createCard('sv1-1', 2, 'normal'),
        createCard('sv1-1', 1, 'holofoil'),
      ];
      const profile2Cards = [createCard('sv1-1', 3, 'reverseHolofoil')];

      const duplicates = findDuplicates(profile1Cards, profile2Cards);

      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].cardId).toBe('sv1-1');
      expect(duplicates[0].profile1.quantity).toBe(3);
      expect(duplicates[0].profile1.variants.normal).toBe(2);
      expect(duplicates[0].profile1.variants.holofoil).toBe(1);
      expect(duplicates[0].profile2.quantity).toBe(3);
      expect(duplicates[0].profile2.variants.reverseHolofoil).toBe(3);
    });

    it('should return empty array when no duplicates', () => {
      const profile1Cards = [createCard('sv1-1', 1)];
      const profile2Cards = [createCard('sv1-2', 1)];

      const duplicates = findDuplicates(profile1Cards, profile2Cards);

      expect(duplicates).toHaveLength(0);
    });

    it('should handle empty collections', () => {
      expect(findDuplicates([], [])).toHaveLength(0);
      expect(findDuplicates([createCard('sv1-1')], [])).toHaveLength(0);
      expect(findDuplicates([], [createCard('sv1-1')])).toHaveLength(0);
    });
  });

  describe('findTradeableCards', () => {
    it('should find cards only in fromCollection', () => {
      const fromCollection = [
        createCard('sv1-1', 2, 'normal'),
        createCard('sv1-2', 1, 'holofoil'),
      ];
      const toCollection = [createCard('sv1-1', 1, 'normal')];

      const tradeable = findTradeableCards(fromCollection, toCollection);

      expect(tradeable).toHaveLength(1);
      expect(tradeable[0].cardId).toBe('sv1-2');
      expect(tradeable[0].quantity).toBe(1);
      expect(tradeable[0].variants.holofoil).toBe(1);
    });

    it('should aggregate variants for tradeable cards', () => {
      const fromCollection = [
        createCard('sv1-1', 2, 'normal'),
        createCard('sv1-1', 1, 'holofoil'),
      ];
      const toCollection: CollectionCard[] = [];

      const tradeable = findTradeableCards(fromCollection, toCollection);

      expect(tradeable).toHaveLength(1);
      expect(tradeable[0].quantity).toBe(3);
      expect(tradeable[0].variants.normal).toBe(2);
      expect(tradeable[0].variants.holofoil).toBe(1);
    });

    it('should return empty array when fromCollection is empty', () => {
      const tradeable = findTradeableCards([], [createCard('sv1-1')]);
      expect(tradeable).toHaveLength(0);
    });

    it('should return all cards when toCollection is empty', () => {
      const fromCollection = [
        createCard('sv1-1', 2),
        createCard('sv1-2', 1),
      ];

      const tradeable = findTradeableCards(fromCollection, []);

      expect(tradeable).toHaveLength(2);
    });
  });

  describe('compareCollections', () => {
    it('should correctly categorize cards', () => {
      const profile1Cards = [
        createCard('sv1-1', 1),
        createCard('sv1-2', 1),
        createCard('sv1-3', 1),
      ];
      const profile2Cards = [
        createCard('sv1-2', 1),
        createCard('sv1-3', 1),
        createCard('sv1-4', 1),
      ];

      const result = compareCollections(profile1Cards, profile2Cards);

      expect(result.sharedCardIds.sort()).toEqual(['sv1-2', 'sv1-3']);
      expect(result.onlyInProfile1).toEqual(['sv1-1']);
      expect(result.onlyInProfile2).toEqual(['sv1-4']);
    });

    it('should handle no overlap', () => {
      const profile1Cards = [createCard('sv1-1', 1)];
      const profile2Cards = [createCard('sv1-2', 1)];

      const result = compareCollections(profile1Cards, profile2Cards);

      expect(result.sharedCardIds).toHaveLength(0);
      expect(result.onlyInProfile1).toEqual(['sv1-1']);
      expect(result.onlyInProfile2).toEqual(['sv1-2']);
    });

    it('should handle complete overlap', () => {
      const profile1Cards = [createCard('sv1-1', 1), createCard('sv1-2', 1)];
      const profile2Cards = [createCard('sv1-1', 2), createCard('sv1-2', 3)];

      const result = compareCollections(profile1Cards, profile2Cards);

      expect(result.sharedCardIds.sort()).toEqual(['sv1-1', 'sv1-2']);
      expect(result.onlyInProfile1).toHaveLength(0);
      expect(result.onlyInProfile2).toHaveLength(0);
    });

    it('should handle empty collections', () => {
      expect(compareCollections([], []).sharedCardIds).toHaveLength(0);
      expect(compareCollections([createCard('sv1-1')], []).onlyInProfile1).toHaveLength(1);
      expect(compareCollections([], [createCard('sv1-1')]).onlyInProfile2).toHaveLength(1);
    });
  });

  describe('getUniqueCardIds', () => {
    it('should return unique card IDs', () => {
      const cards = [
        createCard('sv1-1', 1),
        createCard('sv1-1', 2, 'holofoil'),
        createCard('sv1-2', 1),
      ];

      const uniqueIds = getUniqueCardIds(cards);

      expect(uniqueIds.sort()).toEqual(['sv1-1', 'sv1-2']);
    });

    it('should return empty array for empty collection', () => {
      expect(getUniqueCardIds([])).toHaveLength(0);
    });
  });

  describe('getTotalQuantity', () => {
    it('should sum all quantities', () => {
      const cards = [
        createCard('sv1-1', 2),
        createCard('sv1-2', 3),
        createCard('sv1-3', 5),
      ];

      expect(getTotalQuantity(cards)).toBe(10);
    });

    it('should return 0 for empty collection', () => {
      expect(getTotalQuantity([])).toBe(0);
    });
  });

  describe('calculateOverlapPercentage', () => {
    it('should return correct percentage', () => {
      const profile1Cards = [
        createCard('sv1-1', 1),
        createCard('sv1-2', 1),
        createCard('sv1-3', 1),
        createCard('sv1-4', 1),
      ];
      const profile2Cards = [createCard('sv1-1', 1), createCard('sv1-2', 1)];

      // 2 out of 4 = 50%
      expect(calculateOverlapPercentage(profile1Cards, profile2Cards)).toBe(0.5);
    });

    it('should return 0 for empty profile1', () => {
      expect(calculateOverlapPercentage([], [createCard('sv1-1')])).toBe(0);
    });

    it('should return 0 for no overlap', () => {
      const profile1Cards = [createCard('sv1-1', 1)];
      const profile2Cards = [createCard('sv1-2', 1)];

      expect(calculateOverlapPercentage(profile1Cards, profile2Cards)).toBe(0);
    });

    it('should return 1 for complete overlap', () => {
      const profile1Cards = [createCard('sv1-1', 1), createCard('sv1-2', 1)];
      const profile2Cards = [
        createCard('sv1-1', 1),
        createCard('sv1-2', 1),
        createCard('sv1-3', 1),
      ];

      expect(calculateOverlapPercentage(profile1Cards, profile2Cards)).toBe(1);
    });
  });

  describe('findExcessCards', () => {
    it('should find cards with quantity > 1', () => {
      const cards = [
        createCard('sv1-1', 3, 'normal'),
        createCard('sv1-2', 1, 'normal'),
        createCard('sv1-3', 5, 'holofoil'),
      ];

      const excess = findExcessCards(cards);

      expect(excess).toHaveLength(2);
      expect(excess.find((e) => e.cardId === 'sv1-1')?.quantity).toBe(2); // 3-1=2
      expect(excess.find((e) => e.cardId === 'sv1-3')?.quantity).toBe(4); // 5-1=4
    });

    it('should aggregate multiple variants of same card', () => {
      const cards = [
        createCard('sv1-1', 2, 'normal'),
        createCard('sv1-1', 2, 'holofoil'),
      ];

      const excess = findExcessCards(cards);

      expect(excess).toHaveLength(1);
      expect(excess[0].quantity).toBe(3); // 4-1=3 total excess
    });

    it('should not include cards with only 1 copy', () => {
      const cards = [createCard('sv1-1', 1)];

      const excess = findExcessCards(cards);

      expect(excess).toHaveLength(0);
    });

    it('should return empty array for empty collection', () => {
      expect(findExcessCards([])).toHaveLength(0);
    });
  });

  describe('getVariantSummary', () => {
    it('should summarize variants correctly', () => {
      const cards = [
        createCard('sv1-1', 2, 'normal'),
        createCard('sv1-2', 1, 'normal'),
        createCard('sv1-3', 3, 'holofoil'),
        createCard('sv1-4', 1, 'reverseHolofoil'),
      ];

      const summary = getVariantSummary(cards);

      expect(summary.normal).toEqual({ count: 2, totalQuantity: 3 });
      expect(summary.holofoil).toEqual({ count: 1, totalQuantity: 3 });
      expect(summary.reverseHolofoil).toEqual({ count: 1, totalQuantity: 1 });
    });

    it('should treat null/undefined variants as normal', () => {
      const cards = [
        createCard('sv1-1', 2),
        createCard('sv1-2', 1, null),
      ];

      const summary = getVariantSummary(cards);

      expect(summary.normal).toEqual({ count: 2, totalQuantity: 3 });
    });

    it('should return empty object for empty collection', () => {
      const summary = getVariantSummary([]);
      expect(Object.keys(summary)).toHaveLength(0);
    });
  });
});

describe('Integration Scenarios', () => {
  const createCard = (
    cardId: string,
    quantity = 1,
    variant?: string | null
  ): CollectionCard => ({
    cardId,
    quantity,
    variant,
  });

  describe('Family Trading Scenario', () => {
    it('should find trade opportunities between siblings', () => {
      // Sibling 1 has cards A, B, C (with extras of A and B)
      const sibling1 = [
        createCard('sv1-1', 3, 'normal'), // Has 2 extras
        createCard('sv1-2', 2, 'holofoil'), // Has 1 extra
        createCard('sv1-3', 1, 'normal'), // No extras
      ];

      // Sibling 2 has cards B, C, D
      const sibling2 = [
        createCard('sv1-2', 1, 'normal'),
        createCard('sv1-3', 1, 'reverseHolofoil'),
        createCard('sv1-4', 1, 'normal'),
      ];

      // Find what sibling 1 can trade to sibling 2
      const tradeable = findTradeableCards(sibling1, sibling2);
      expect(tradeable).toHaveLength(1);
      expect(tradeable[0].cardId).toBe('sv1-1'); // Only card A is tradeable

      // Find duplicates they both have
      const duplicates = findDuplicates(sibling1, sibling2);
      expect(duplicates).toHaveLength(2); // Cards B and C

      // Find excess cards sibling 1 has
      const excess = findExcessCards(sibling1);
      expect(excess).toHaveLength(2); // Cards A and B have extras
    });
  });

  describe('Collection Progress Comparison', () => {
    it('should calculate meaningful overlap metrics', () => {
      const collector1 = [
        createCard('sv1-1', 1),
        createCard('sv1-2', 1),
        createCard('sv1-3', 1),
        createCard('sv1-4', 1),
        createCard('sv1-5', 1),
      ];

      const collector2 = [
        createCard('sv1-1', 1),
        createCard('sv1-2', 1),
        createCard('sv1-6', 1),
        createCard('sv1-7', 1),
      ];

      const comparison = compareCollections(collector1, collector2);
      expect(comparison.sharedCardIds.sort()).toEqual(['sv1-1', 'sv1-2']);
      expect(comparison.onlyInProfile1.sort()).toEqual(['sv1-3', 'sv1-4', 'sv1-5']);
      expect(comparison.onlyInProfile2.sort()).toEqual(['sv1-6', 'sv1-7']);

      // 40% of collector1's cards are also in collector2
      const overlap = calculateOverlapPercentage(collector1, collector2);
      expect(overlap).toBe(0.4);

      // 50% of collector2's cards are in collector1
      const reverseOverlap = calculateOverlapPercentage(collector2, collector1);
      expect(reverseOverlap).toBe(0.5);
    });
  });
});
