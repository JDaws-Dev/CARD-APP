import { describe, it, expect, beforeEach } from 'vitest';
import {
  CardVariant,
  CollectionCard,
  DEFAULT_VARIANT,
  VALID_VARIANTS,
  isValidVariant,
  isValidCardId,
  isValidQuantity,
  extractSetId,
  extractCardNumber,
  getCollectionStats,
  checkCardOwnership,
  filterBySet,
  groupCardsByCardId,
  getUniqueCardIds,
  countCardsBySet,
  addCardToCollection,
  removeCardFromCollection,
  updateCardQuantity,
  decrementCardQuantity,
  incrementCardQuantity,
  findSharedCards,
  findUniqueCards,
  mergeCollections,
  sortByCardId,
  sortByQuantity,
  sortBySetAndNumber,
} from '../collections';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createCard(
  cardId: string,
  quantity = 1,
  variant: CardVariant = 'normal'
): CollectionCard {
  return { cardId, quantity, variant };
}

function createSampleCollection(): CollectionCard[] {
  return [
    createCard('sv1-1', 3, 'normal'),
    createCard('sv1-1', 1, 'holofoil'),
    createCard('sv1-25', 2, 'reverseHolofoil'),
    createCard('sv2-10', 1, 'normal'),
    createCard('sv2-50', 4, 'holofoil'),
    createCard('sv3-1', 1, '1stEditionHolofoil'),
  ];
}

// ============================================================================
// CONSTANTS
// ============================================================================

describe('Collection Constants', () => {
  it('should have correct default variant', () => {
    expect(DEFAULT_VARIANT).toBe('normal');
  });

  it('should have all valid variants', () => {
    expect(VALID_VARIANTS).toContain('normal');
    expect(VALID_VARIANTS).toContain('holofoil');
    expect(VALID_VARIANTS).toContain('reverseHolofoil');
    expect(VALID_VARIANTS).toContain('1stEditionHolofoil');
    expect(VALID_VARIANTS).toContain('1stEditionNormal');
    expect(VALID_VARIANTS).toHaveLength(5);
  });
});

// ============================================================================
// VALIDATION
// ============================================================================

describe('Validation Functions', () => {
  describe('isValidVariant', () => {
    it('should return true for valid variants', () => {
      expect(isValidVariant('normal')).toBe(true);
      expect(isValidVariant('holofoil')).toBe(true);
      expect(isValidVariant('reverseHolofoil')).toBe(true);
      expect(isValidVariant('1stEditionHolofoil')).toBe(true);
      expect(isValidVariant('1stEditionNormal')).toBe(true);
    });

    it('should return false for invalid variants', () => {
      expect(isValidVariant('invalid')).toBe(false);
      expect(isValidVariant('')).toBe(false);
      expect(isValidVariant('NORMAL')).toBe(false);
      expect(isValidVariant('holo')).toBe(false);
    });
  });

  describe('isValidCardId', () => {
    it('should return true for valid card IDs', () => {
      expect(isValidCardId('sv1-1')).toBe(true);
      expect(isValidCardId('sv1-123')).toBe(true);
      expect(isValidCardId('swsh12-45')).toBe(true);
      expect(isValidCardId('xy-1')).toBe(true);
      expect(isValidCardId('base1-1')).toBe(true);
    });

    it('should return false for invalid card IDs', () => {
      expect(isValidCardId('')).toBe(false);
      expect(isValidCardId('sv1')).toBe(false);
      expect(isValidCardId('-1')).toBe(false);
      expect(isValidCardId('sv1-')).toBe(false);
      // @ts-expect-error - testing invalid input
      expect(isValidCardId(null)).toBe(false);
      // @ts-expect-error - testing invalid input
      expect(isValidCardId(undefined)).toBe(false);
      // @ts-expect-error - testing invalid input
      expect(isValidCardId(123)).toBe(false);
    });
  });

  describe('isValidQuantity', () => {
    it('should return true for valid quantities', () => {
      expect(isValidQuantity(1)).toBe(true);
      expect(isValidQuantity(10)).toBe(true);
      expect(isValidQuantity(100)).toBe(true);
    });

    it('should return false for invalid quantities', () => {
      expect(isValidQuantity(0)).toBe(false);
      expect(isValidQuantity(-1)).toBe(false);
      expect(isValidQuantity(1.5)).toBe(false);
      expect(isValidQuantity(NaN)).toBe(false);
      // @ts-expect-error - testing invalid input
      expect(isValidQuantity('1')).toBe(false);
    });
  });

  describe('extractSetId', () => {
    it('should extract set ID from card ID', () => {
      expect(extractSetId('sv1-1')).toBe('sv1');
      expect(extractSetId('swsh12-123')).toBe('swsh12');
      expect(extractSetId('base1-45')).toBe('base1');
    });

    it('should handle edge cases', () => {
      expect(extractSetId('xy-promo-1')).toBe('xy');
      expect(extractSetId('invalidcardid')).toBe('invalidcardid');
    });
  });

  describe('extractCardNumber', () => {
    it('should extract card number from card ID', () => {
      expect(extractCardNumber('sv1-1')).toBe('1');
      expect(extractCardNumber('swsh12-123')).toBe('123');
      expect(extractCardNumber('base1-45')).toBe('45');
    });

    it('should handle edge cases', () => {
      expect(extractCardNumber('xy-promo-1')).toBe('promo-1');
      expect(extractCardNumber('invalidcardid')).toBe('');
    });
  });
});

// ============================================================================
// QUERY LOGIC
// ============================================================================

describe('Query Functions', () => {
  describe('getCollectionStats', () => {
    it('should return correct stats for a collection', () => {
      const collection = createSampleCollection();
      const stats = getCollectionStats(collection);

      expect(stats.uniqueCards).toBe(6);
      expect(stats.totalCards).toBe(12); // 3+1+2+1+4+1
      expect(stats.setsStarted).toBe(3); // sv1, sv2, sv3
    });

    it('should handle empty collection', () => {
      const stats = getCollectionStats([]);

      expect(stats.uniqueCards).toBe(0);
      expect(stats.totalCards).toBe(0);
      expect(stats.setsStarted).toBe(0);
    });

    it('should count same card with different variants as separate entries', () => {
      const collection = [
        createCard('sv1-1', 2, 'normal'),
        createCard('sv1-1', 1, 'holofoil'),
      ];
      const stats = getCollectionStats(collection);

      expect(stats.uniqueCards).toBe(2);
      expect(stats.totalCards).toBe(3);
      expect(stats.setsStarted).toBe(1);
    });
  });

  describe('checkCardOwnership', () => {
    it('should return ownership details for owned card', () => {
      const collection = [
        createCard('sv1-1', 3, 'normal'),
        createCard('sv1-1', 1, 'holofoil'),
      ];

      const result = checkCardOwnership(collection, 'sv1-1');

      expect(result.owned).toBe(true);
      expect(result.quantity).toBe(4);
      expect(result.variants).toEqual({ normal: 3, holofoil: 1 });
    });

    it('should return not owned for missing card', () => {
      const collection = [createCard('sv1-1', 1, 'normal')];

      const result = checkCardOwnership(collection, 'sv1-2');

      expect(result.owned).toBe(false);
      expect(result.quantity).toBe(0);
      expect(result.variants).toEqual({});
    });

    it('should handle empty collection', () => {
      const result = checkCardOwnership([], 'sv1-1');

      expect(result.owned).toBe(false);
      expect(result.quantity).toBe(0);
    });
  });

  describe('filterBySet', () => {
    it('should filter cards by set ID', () => {
      const collection = createSampleCollection();

      const sv1Cards = filterBySet(collection, 'sv1');
      expect(sv1Cards).toHaveLength(3);
      expect(sv1Cards.every((c) => c.cardId.startsWith('sv1-'))).toBe(true);

      const sv2Cards = filterBySet(collection, 'sv2');
      expect(sv2Cards).toHaveLength(2);
    });

    it('should return empty array for non-existent set', () => {
      const collection = createSampleCollection();
      const result = filterBySet(collection, 'sv99');
      expect(result).toHaveLength(0);
    });
  });

  describe('groupCardsByCardId', () => {
    it('should group cards by card ID', () => {
      const collection = [
        createCard('sv1-1', 2, 'normal'),
        createCard('sv1-1', 1, 'holofoil'),
        createCard('sv1-2', 3, 'normal'),
      ];

      const grouped = groupCardsByCardId(collection);

      expect(grouped).toHaveLength(2);

      const sv1_1 = grouped.find((g) => g.cardId === 'sv1-1');
      expect(sv1_1).toBeDefined();
      expect(sv1_1?.totalQuantity).toBe(3);
      expect(sv1_1?.variants.normal).toBe(2);
      expect(sv1_1?.variants.holofoil).toBe(1);

      const sv1_2 = grouped.find((g) => g.cardId === 'sv1-2');
      expect(sv1_2?.totalQuantity).toBe(3);
    });

    it('should handle empty collection', () => {
      expect(groupCardsByCardId([])).toHaveLength(0);
    });
  });

  describe('getUniqueCardIds', () => {
    it('should return unique card IDs', () => {
      const collection = [
        createCard('sv1-1', 2, 'normal'),
        createCard('sv1-1', 1, 'holofoil'),
        createCard('sv1-2', 1, 'normal'),
      ];

      const uniqueIds = getUniqueCardIds(collection);

      expect(uniqueIds).toHaveLength(2);
      expect(uniqueIds).toContain('sv1-1');
      expect(uniqueIds).toContain('sv1-2');
    });
  });

  describe('countCardsBySet', () => {
    it('should count cards by set', () => {
      const collection = createSampleCollection();
      const bySet = countCardsBySet(collection);

      expect(bySet.get('sv1')?.count).toBe(3);
      expect(bySet.get('sv1')?.quantity).toBe(6); // 3+1+2

      expect(bySet.get('sv2')?.count).toBe(2);
      expect(bySet.get('sv2')?.quantity).toBe(5); // 1+4

      expect(bySet.get('sv3')?.count).toBe(1);
      expect(bySet.get('sv3')?.quantity).toBe(1);
    });
  });
});

// ============================================================================
// MUTATION LOGIC (CRUD)
// ============================================================================

describe('Collection CRUD Operations', () => {
  let collection: CollectionCard[];

  beforeEach(() => {
    collection = [];
  });

  describe('addCardToCollection (CREATE)', () => {
    it('should add a new card to empty collection', () => {
      const result = addCardToCollection(collection, 'sv1-1', 1, 'normal');

      expect(result.isNew).toBe(true);
      expect(result.collection).toHaveLength(1);
      expect(result.collection[0]).toEqual({
        cardId: 'sv1-1',
        quantity: 1,
        variant: 'normal',
      });
    });

    it('should use default variant when not specified', () => {
      const result = addCardToCollection(collection, 'sv1-1', 1);

      expect(result.collection[0].variant).toBe('normal');
    });

    it('should increment quantity for existing card with same variant', () => {
      collection = [createCard('sv1-1', 2, 'normal')];
      const result = addCardToCollection(collection, 'sv1-1', 3, 'normal');

      expect(result.isNew).toBe(false);
      expect(result.collection).toHaveLength(1);
      expect(result.collection[0].quantity).toBe(5);
    });

    it('should add new entry for same card with different variant', () => {
      collection = [createCard('sv1-1', 2, 'normal')];
      const result = addCardToCollection(collection, 'sv1-1', 1, 'holofoil');

      expect(result.isNew).toBe(true);
      expect(result.collection).toHaveLength(2);
    });

    it('should add multiple different cards', () => {
      let result = addCardToCollection(collection, 'sv1-1', 1, 'normal');
      result = addCardToCollection(result.collection, 'sv1-2', 2, 'holofoil');
      result = addCardToCollection(result.collection, 'sv2-1', 1, 'reverseHolofoil');

      expect(result.collection).toHaveLength(3);
      expect(result.collection[0].cardId).toBe('sv1-1');
      expect(result.collection[1].cardId).toBe('sv1-2');
      expect(result.collection[2].cardId).toBe('sv2-1');
    });

    it('should handle adding card with quantity > 1', () => {
      const result = addCardToCollection(collection, 'sv1-1', 5, 'normal');

      expect(result.collection[0].quantity).toBe(5);
    });

    it('should not mutate the original collection', () => {
      collection = [createCard('sv1-1', 2, 'normal')];
      const original = [...collection];

      addCardToCollection(collection, 'sv1-1', 1, 'normal');

      expect(collection).toEqual(original);
    });
  });

  describe('removeCardFromCollection (DELETE)', () => {
    beforeEach(() => {
      collection = [
        createCard('sv1-1', 2, 'normal'),
        createCard('sv1-1', 1, 'holofoil'),
        createCard('sv1-2', 3, 'normal'),
      ];
    });

    it('should remove specific variant', () => {
      const result = removeCardFromCollection(collection, 'sv1-1', 'holofoil');

      expect(result.removed).toBe(1);
      expect(result.collection).toHaveLength(2);
      expect(
        result.collection.some(
          (c) => c.cardId === 'sv1-1' && c.variant === 'holofoil'
        )
      ).toBe(false);
    });

    it('should remove all variants when variant not specified', () => {
      const result = removeCardFromCollection(collection, 'sv1-1');

      expect(result.removed).toBe(2);
      expect(result.collection).toHaveLength(1);
      expect(result.collection[0].cardId).toBe('sv1-2');
    });

    it('should return 0 removed for non-existent card', () => {
      const result = removeCardFromCollection(collection, 'sv99-1');

      expect(result.removed).toBe(0);
      expect(result.collection).toHaveLength(3);
    });

    it('should return 0 removed for non-existent variant', () => {
      const result = removeCardFromCollection(
        collection,
        'sv1-1',
        'reverseHolofoil'
      );

      expect(result.removed).toBe(0);
    });

    it('should not mutate the original collection', () => {
      const original = [...collection];
      removeCardFromCollection(collection, 'sv1-1');
      expect(collection).toEqual(original);
    });
  });

  describe('updateCardQuantity (UPDATE)', () => {
    beforeEach(() => {
      collection = [
        createCard('sv1-1', 2, 'normal'),
        createCard('sv1-1', 1, 'holofoil'),
      ];
    });

    it('should update quantity for existing card', () => {
      const result = updateCardQuantity(collection, 'sv1-1', 5, 'normal');

      expect(result.success).toBe(true);
      expect(result.collection[0].quantity).toBe(5);
    });

    it('should remove card when quantity is 0', () => {
      const result = updateCardQuantity(collection, 'sv1-1', 0, 'normal');

      expect(result.success).toBe(true);
      expect(result.collection).toHaveLength(1);
      expect(result.collection[0].variant).toBe('holofoil');
    });

    it('should remove card when quantity is negative', () => {
      const result = updateCardQuantity(collection, 'sv1-1', -5, 'normal');

      expect(result.success).toBe(true);
      expect(result.collection).toHaveLength(1);
    });

    it('should return error for non-existent card', () => {
      const result = updateCardQuantity(collection, 'sv99-1', 5, 'normal');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Card not found in collection');
    });

    it('should use default variant when not specified', () => {
      const result = updateCardQuantity(collection, 'sv1-1', 10);

      expect(result.success).toBe(true);
      expect(result.collection[0].quantity).toBe(10);
    });

    it('should not mutate the original collection', () => {
      const original = [...collection];
      updateCardQuantity(collection, 'sv1-1', 10, 'normal');
      expect(collection).toEqual(original);
    });
  });

  describe('decrementCardQuantity', () => {
    it('should decrement quantity by 1', () => {
      collection = [createCard('sv1-1', 5, 'normal')];
      const result = decrementCardQuantity(collection, 'sv1-1', 'normal');

      expect(result.success).toBe(true);
      expect(result.newQuantity).toBe(4);
      expect(result.collection[0].quantity).toBe(4);
    });

    it('should remove card when quantity reaches 0', () => {
      collection = [createCard('sv1-1', 1, 'normal')];
      const result = decrementCardQuantity(collection, 'sv1-1', 'normal');

      expect(result.success).toBe(true);
      expect(result.newQuantity).toBe(0);
      expect(result.collection).toHaveLength(0);
    });

    it('should return false for non-existent card', () => {
      collection = [];
      const result = decrementCardQuantity(collection, 'sv1-1', 'normal');

      expect(result.success).toBe(false);
      expect(result.newQuantity).toBe(0);
    });
  });

  describe('incrementCardQuantity', () => {
    it('should increment quantity by 1', () => {
      collection = [createCard('sv1-1', 2, 'normal')];
      const result = incrementCardQuantity(collection, 'sv1-1', 'normal');

      expect(result.newQuantity).toBe(3);
      expect(result.collection[0].quantity).toBe(3);
    });

    it('should add card with quantity 1 if not exists', () => {
      collection = [];
      const result = incrementCardQuantity(collection, 'sv1-1', 'normal');

      expect(result.newQuantity).toBe(1);
      expect(result.collection).toHaveLength(1);
      expect(result.collection[0].cardId).toBe('sv1-1');
    });
  });
});

// ============================================================================
// COLLECTION COMPARISON
// ============================================================================

describe('Collection Comparison', () => {
  const collection1 = [
    createCard('sv1-1', 2, 'normal'),
    createCard('sv1-2', 1, 'holofoil'),
    createCard('sv1-3', 1, 'normal'),
  ];

  const collection2 = [
    createCard('sv1-1', 1, 'normal'),
    createCard('sv1-4', 2, 'normal'),
    createCard('sv1-5', 1, 'holofoil'),
  ];

  describe('findSharedCards', () => {
    it('should find cards in both collections', () => {
      const shared = findSharedCards(collection1, collection2);

      expect(shared).toHaveLength(1);
      expect(shared).toContain('sv1-1');
    });

    it('should return empty array when no shared cards', () => {
      const coll1 = [createCard('sv1-1', 1, 'normal')];
      const coll2 = [createCard('sv1-2', 1, 'normal')];

      expect(findSharedCards(coll1, coll2)).toHaveLength(0);
    });

    it('should handle empty collections', () => {
      expect(findSharedCards([], collection1)).toHaveLength(0);
      expect(findSharedCards(collection1, [])).toHaveLength(0);
    });
  });

  describe('findUniqueCards', () => {
    it('should find cards unique to first collection', () => {
      const unique = findUniqueCards(collection1, collection2);

      expect(unique).toHaveLength(2);
      expect(unique).toContain('sv1-2');
      expect(unique).toContain('sv1-3');
    });

    it('should return all cards when second collection is empty', () => {
      const unique = findUniqueCards(collection1, []);
      expect(unique).toHaveLength(3);
    });

    it('should return empty when first collection is empty', () => {
      const unique = findUniqueCards([], collection2);
      expect(unique).toHaveLength(0);
    });
  });

  describe('mergeCollections', () => {
    it('should combine quantities for same card and variant', () => {
      const coll1 = [createCard('sv1-1', 2, 'normal')];
      const coll2 = [createCard('sv1-1', 3, 'normal')];

      const merged = mergeCollections(coll1, coll2);

      expect(merged).toHaveLength(1);
      expect(merged[0].quantity).toBe(5);
    });

    it('should keep separate entries for different variants', () => {
      const coll1 = [createCard('sv1-1', 2, 'normal')];
      const coll2 = [createCard('sv1-1', 1, 'holofoil')];

      const merged = mergeCollections(coll1, coll2);

      expect(merged).toHaveLength(2);
    });

    it('should include all unique cards from both collections', () => {
      const merged = mergeCollections(collection1, collection2);

      const cardIds = merged.map((c) => c.cardId);
      expect(cardIds).toContain('sv1-1');
      expect(cardIds).toContain('sv1-2');
      expect(cardIds).toContain('sv1-3');
      expect(cardIds).toContain('sv1-4');
      expect(cardIds).toContain('sv1-5');
    });
  });
});

// ============================================================================
// SORTING
// ============================================================================

describe('Sorting Functions', () => {
  const unsortedCollection = [
    createCard('sv2-10', 1, 'normal'),
    createCard('sv1-5', 3, 'normal'),
    createCard('sv1-1', 2, 'normal'),
    createCard('sv3-100', 1, 'normal'),
  ];

  describe('sortByCardId', () => {
    it('should sort ascending by default', () => {
      const sorted = sortByCardId(unsortedCollection);

      expect(sorted[0].cardId).toBe('sv1-1');
      expect(sorted[1].cardId).toBe('sv1-5');
      expect(sorted[2].cardId).toBe('sv2-10');
      expect(sorted[3].cardId).toBe('sv3-100');
    });

    it('should sort descending when specified', () => {
      const sorted = sortByCardId(unsortedCollection, false);

      expect(sorted[0].cardId).toBe('sv3-100');
      expect(sorted[3].cardId).toBe('sv1-1');
    });

    it('should not mutate original array', () => {
      const original = [...unsortedCollection];
      sortByCardId(unsortedCollection);
      expect(unsortedCollection).toEqual(original);
    });
  });

  describe('sortByQuantity', () => {
    it('should sort descending by default', () => {
      const sorted = sortByQuantity(unsortedCollection);

      expect(sorted[0].quantity).toBe(3);
      expect(sorted[1].quantity).toBe(2);
    });

    it('should sort ascending when specified', () => {
      const sorted = sortByQuantity(unsortedCollection, true);

      expect(sorted[0].quantity).toBe(1);
      expect(sorted[sorted.length - 1].quantity).toBe(3);
    });
  });

  describe('sortBySetAndNumber', () => {
    it('should sort by set first, then by card number numerically', () => {
      const collection = [
        createCard('sv1-100', 1, 'normal'),
        createCard('sv2-5', 1, 'normal'),
        createCard('sv1-10', 1, 'normal'),
        createCard('sv1-2', 1, 'normal'),
      ];

      const sorted = sortBySetAndNumber(collection);

      expect(sorted[0].cardId).toBe('sv1-2');
      expect(sorted[1].cardId).toBe('sv1-10');
      expect(sorted[2].cardId).toBe('sv1-100');
      expect(sorted[3].cardId).toBe('sv2-5');
    });

    it('should handle non-numeric card numbers', () => {
      const collection = [
        createCard('sv1-1', 1, 'normal'),
        createCard('sv1-a', 1, 'normal'),
      ];

      // Should not throw
      const sorted = sortBySetAndNumber(collection);
      expect(sorted).toHaveLength(2);
    });
  });
});

// ============================================================================
// INTEGRATION SCENARIOS
// ============================================================================

describe('Integration Scenarios', () => {
  describe('Building a Collection Over Time', () => {
    it('should track collection growth correctly', () => {
      let collection: CollectionCard[] = [];

      // Day 1: Add some starter cards
      let result = addCardToCollection(collection, 'sv1-1', 1, 'normal');
      result = addCardToCollection(result.collection, 'sv1-2', 1, 'normal');
      result = addCardToCollection(result.collection, 'sv1-3', 1, 'holofoil');
      collection = result.collection;

      expect(getCollectionStats(collection)).toEqual({
        totalCards: 3,
        uniqueCards: 3,
        setsStarted: 1,
      });

      // Day 2: Get duplicates
      result = addCardToCollection(collection, 'sv1-1', 2, 'normal');
      collection = result.collection;

      expect(result.isNew).toBe(false);
      expect(getCollectionStats(collection).totalCards).toBe(5);

      // Day 3: Start a new set
      result = addCardToCollection(collection, 'sv2-1', 1, 'normal');
      collection = result.collection;

      expect(getCollectionStats(collection).setsStarted).toBe(2);

      // Day 4: Trade away a card
      const removeResult = removeCardFromCollection(collection, 'sv1-1', 'normal');
      collection = removeResult.collection;

      expect(removeResult.removed).toBe(1);
      expect(checkCardOwnership(collection, 'sv1-1').owned).toBe(false);
    });
  });

  describe('Trading Between Siblings', () => {
    it('should correctly identify tradeable cards', () => {
      const sibling1Collection = [
        createCard('sv1-1', 3, 'normal'), // Has extras
        createCard('sv1-2', 1, 'holofoil'),
        createCard('sv1-5', 2, 'normal'),
      ];

      const sibling2Collection = [
        createCard('sv1-1', 1, 'normal'),
        createCard('sv1-3', 2, 'reverseHolofoil'),
        createCard('sv1-4', 1, 'normal'),
      ];

      // What sibling1 has that sibling2 doesn't
      const tradeable = findUniqueCards(sibling1Collection, sibling2Collection);
      expect(tradeable).toContain('sv1-2');
      expect(tradeable).toContain('sv1-5');

      // What they share (no need to trade)
      const shared = findSharedCards(sibling1Collection, sibling2Collection);
      expect(shared).toContain('sv1-1');
    });
  });

  describe('Variant Tracking', () => {
    it('should track same card with multiple variants separately', () => {
      let collection: CollectionCard[] = [];

      // Add same card in different variants
      let result = addCardToCollection(collection, 'sv1-1', 1, 'normal');
      result = addCardToCollection(result.collection, 'sv1-1', 1, 'holofoil');
      result = addCardToCollection(result.collection, 'sv1-1', 1, 'reverseHolofoil');
      collection = result.collection;

      expect(collection).toHaveLength(3);

      const ownership = checkCardOwnership(collection, 'sv1-1');
      expect(ownership.quantity).toBe(3);
      expect(ownership.variants).toEqual({
        normal: 1,
        holofoil: 1,
        reverseHolofoil: 1,
      });

      // Remove only the holofoil
      const removeResult = removeCardFromCollection(collection, 'sv1-1', 'holofoil');
      collection = removeResult.collection;

      expect(removeResult.removed).toBe(1);
      expect(checkCardOwnership(collection, 'sv1-1').variants.holofoil).toBeUndefined();
      expect(checkCardOwnership(collection, 'sv1-1').variants.normal).toBe(1);
    });
  });

  describe('Set Completion Tracking', () => {
    it('should help track progress toward set completion', () => {
      const collection = [
        createCard('sv1-1', 1, 'normal'),
        createCard('sv1-5', 1, 'normal'),
        createCard('sv1-10', 1, 'holofoil'),
        createCard('sv1-10', 1, 'normal'),
        createCard('sv2-1', 1, 'normal'),
      ];

      const sv1Cards = filterBySet(collection, 'sv1');
      const uniqueSv1CardIds = getUniqueCardIds(sv1Cards);

      expect(uniqueSv1CardIds).toHaveLength(3); // sv1-1, sv1-5, sv1-10
      expect(uniqueSv1CardIds).toContain('sv1-1');
      expect(uniqueSv1CardIds).toContain('sv1-5');
      expect(uniqueSv1CardIds).toContain('sv1-10');

      const bySet = countCardsBySet(collection);
      expect(bySet.get('sv1')?.count).toBe(4); // 4 entries (different variants count)
      expect(bySet.get('sv1')?.quantity).toBe(4); // 4 total cards
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large quantities', () => {
      const result = addCardToCollection([], 'sv1-1', 1000, 'normal');
      expect(result.collection[0].quantity).toBe(1000);

      const updated = updateCardQuantity(result.collection, 'sv1-1', 999999);
      expect(updated.collection[0].quantity).toBe(999999);
    });

    it('should handle all variant types', () => {
      let collection: CollectionCard[] = [];

      for (const variant of VALID_VARIANTS) {
        const result = addCardToCollection(collection, 'sv1-1', 1, variant);
        collection = result.collection;
      }

      expect(collection).toHaveLength(5);
      const ownership = checkCardOwnership(collection, 'sv1-1');
      expect(ownership.quantity).toBe(5);
    });
  });
});

// ============================================================================
// VARIANT GROUPING
// ============================================================================

import {
  VARIANT_DISPLAY_NAMES,
  getVariantDisplayName,
  groupCollectionByVariant,
  enrichWithNames,
  calculateVariantSummary,
  getUsedVariants,
  filterByVariant,
  sortByVariant,
  sortByCardIdThenVariant,
  groupCardsByCardIdWithDetails,
  countByVariant,
  quantityByVariant,
  hasVariant,
  getAllVariantsOfCard,
  getTotalQuantityOfCard,
} from '../collections';

describe('Variant Grouping Functions', () => {
  const multiVariantCollection: CollectionCard[] = [
    createCard('sv1-1', 3, 'normal'),
    createCard('sv1-1', 1, 'holofoil'),
    createCard('sv1-1', 2, 'reverseHolofoil'),
    createCard('sv1-25', 2, 'normal'),
    createCard('sv1-25', 1, 'holofoil'),
    createCard('sv2-10', 5, '1stEditionHolofoil'),
    createCard('sv2-50', 1, '1stEditionNormal'),
  ];

  describe('VARIANT_DISPLAY_NAMES', () => {
    it('should have display names for all valid variants', () => {
      for (const variant of VALID_VARIANTS) {
        expect(VARIANT_DISPLAY_NAMES[variant]).toBeDefined();
        expect(typeof VARIANT_DISPLAY_NAMES[variant]).toBe('string');
      }
    });

    it('should have correct display names', () => {
      expect(VARIANT_DISPLAY_NAMES['normal']).toBe('Normal');
      expect(VARIANT_DISPLAY_NAMES['holofoil']).toBe('Holofoil');
      expect(VARIANT_DISPLAY_NAMES['reverseHolofoil']).toBe('Reverse Holofoil');
      expect(VARIANT_DISPLAY_NAMES['1stEditionHolofoil']).toBe('1st Edition Holofoil');
      expect(VARIANT_DISPLAY_NAMES['1stEditionNormal']).toBe('1st Edition Normal');
    });
  });

  describe('getVariantDisplayName', () => {
    it('should return display name for valid variants', () => {
      expect(getVariantDisplayName('normal')).toBe('Normal');
      expect(getVariantDisplayName('holofoil')).toBe('Holofoil');
      expect(getVariantDisplayName('reverseHolofoil')).toBe('Reverse Holofoil');
    });
  });

  describe('groupCollectionByVariant', () => {
    it('should create enriched cards from collection cards', () => {
      const cards = [createCard('sv1-1', 2, 'holofoil')];
      const grouped = groupCollectionByVariant(cards);

      expect(grouped).toHaveLength(1);
      expect(grouped[0].cardId).toBe('sv1-1');
      expect(grouped[0].variant).toBe('holofoil');
      expect(grouped[0].quantity).toBe(2);
      expect(grouped[0].setId).toBe('sv1');
    });

    it('should default to normal variant when undefined', () => {
      const cards: CollectionCard[] = [{ cardId: 'sv1-1', quantity: 1, variant: 'normal' }];
      const grouped = groupCollectionByVariant(cards);

      expect(grouped[0].variant).toBe('normal');
    });

    it('should handle empty collection', () => {
      const grouped = groupCollectionByVariant([]);
      expect(grouped).toHaveLength(0);
    });
  });

  describe('enrichWithNames', () => {
    it('should add names from name map', () => {
      const cards = groupCollectionByVariant([createCard('sv1-1', 1, 'normal')]);
      const nameMap = new Map([['sv1-1', 'Pikachu']]);

      const enriched = enrichWithNames(cards, nameMap);

      expect(enriched[0].name).toBe('Pikachu');
    });

    it('should fall back to cardId when name not found', () => {
      const cards = groupCollectionByVariant([createCard('sv1-1', 1, 'normal')]);
      const nameMap = new Map<string, string>();

      const enriched = enrichWithNames(cards, nameMap);

      expect(enriched[0].name).toBe('sv1-1');
    });
  });

  describe('calculateVariantSummary', () => {
    it('should calculate correct summary', () => {
      const summary = calculateVariantSummary(multiVariantCollection);

      expect(summary.totalEntries).toBe(7);
      expect(summary.totalQuantity).toBe(15);
      expect(summary.uniqueCards).toBe(4);
      expect(summary.variantBreakdown.normal).toBe(2);
      expect(summary.variantBreakdown.holofoil).toBe(2);
      expect(summary.variantBreakdown.reverseHolofoil).toBe(1);
      expect(summary.variantBreakdown['1stEditionHolofoil']).toBe(1);
      expect(summary.variantBreakdown['1stEditionNormal']).toBe(1);
    });

    it('should handle empty collection', () => {
      const summary = calculateVariantSummary([]);

      expect(summary.totalEntries).toBe(0);
      expect(summary.totalQuantity).toBe(0);
      expect(summary.uniqueCards).toBe(0);
    });

    it('should count all variants even when zero', () => {
      const cards = [createCard('sv1-1', 1, 'normal')];
      const summary = calculateVariantSummary(cards);

      expect(summary.variantBreakdown.holofoil).toBe(0);
      expect(summary.variantBreakdown.reverseHolofoil).toBe(0);
    });
  });

  describe('getUsedVariants', () => {
    it('should return only variants present in collection', () => {
      const used = getUsedVariants(multiVariantCollection);

      expect(used).toContain('normal');
      expect(used).toContain('holofoil');
      expect(used).toContain('reverseHolofoil');
      expect(used).toContain('1stEditionHolofoil');
      expect(used).toContain('1stEditionNormal');
      expect(used).toHaveLength(5);
    });

    it('should handle empty collection', () => {
      const used = getUsedVariants([]);
      expect(used).toHaveLength(0);
    });

    it('should return sorted array', () => {
      const used = getUsedVariants(multiVariantCollection);
      const sorted = [...used].sort();
      expect(used).toEqual(sorted);
    });
  });

  describe('filterByVariant', () => {
    it('should filter to single variant', () => {
      const holofoils = filterByVariant(multiVariantCollection, 'holofoil');

      expect(holofoils).toHaveLength(2);
      expect(holofoils.every((c) => c.variant === 'holofoil')).toBe(true);
    });

    it('should return empty for unused variant', () => {
      const cards = [createCard('sv1-1', 1, 'normal')];
      const holofoils = filterByVariant(cards, 'holofoil');

      expect(holofoils).toHaveLength(0);
    });
  });

  describe('sortByVariant', () => {
    it('should sort by variant order', () => {
      const sorted = sortByVariant(multiVariantCollection);

      // Normal should come first
      expect(sorted[0].variant).toBe('normal');
      expect(sorted[1].variant).toBe('normal');
      // Then holofoil
      expect(sorted[2].variant).toBe('holofoil');
      expect(sorted[3].variant).toBe('holofoil');
    });

    it('should sort descending when specified', () => {
      const sorted = sortByVariant(multiVariantCollection, false);

      // 1stEdition variants should come first in descending
      expect(sorted[0].variant).toBe('1stEditionNormal');
      expect(sorted[1].variant).toBe('1stEditionHolofoil');
    });

    it('should not mutate original array', () => {
      const original = [...multiVariantCollection];
      sortByVariant(multiVariantCollection);
      expect(multiVariantCollection).toEqual(original);
    });
  });

  describe('sortByCardIdThenVariant', () => {
    it('should sort by cardId first, then variant', () => {
      const sorted = sortByCardIdThenVariant(multiVariantCollection);

      expect(sorted[0].cardId).toBe('sv1-1');
      expect(sorted[0].variant).toBe('normal');
      expect(sorted[1].cardId).toBe('sv1-1');
      expect(sorted[1].variant).toBe('holofoil');
      expect(sorted[2].cardId).toBe('sv1-1');
      expect(sorted[2].variant).toBe('reverseHolofoil');
    });
  });

  describe('groupCardsByCardIdWithDetails', () => {
    it('should group cards by cardId with variants', () => {
      const grouped = groupCardsByCardIdWithDetails(multiVariantCollection);

      expect(grouped).toHaveLength(4); // 4 unique cardIds

      const sv1_1 = grouped.find((g) => g.cardId === 'sv1-1');
      expect(sv1_1).toBeDefined();
      expect(sv1_1!.totalQuantity).toBe(6);
      expect(sv1_1!.variants.normal).toBe(3);
      expect(sv1_1!.variants.holofoil).toBe(1);
      expect(sv1_1!.variants.reverseHolofoil).toBe(2);
    });

    it('should include card names when provided', () => {
      const nameMap = new Map([['sv1-1', 'Pikachu']]);
      const grouped = groupCardsByCardIdWithDetails(multiVariantCollection, nameMap);

      const sv1_1 = grouped.find((g) => g.cardId === 'sv1-1');
      expect(sv1_1!.name).toBe('Pikachu');
    });

    it('should extract setId correctly', () => {
      const grouped = groupCardsByCardIdWithDetails(multiVariantCollection);

      const sv1_1 = grouped.find((g) => g.cardId === 'sv1-1');
      expect(sv1_1!.setId).toBe('sv1');

      const sv2_10 = grouped.find((g) => g.cardId === 'sv2-10');
      expect(sv2_10!.setId).toBe('sv2');
    });
  });

  describe('countByVariant', () => {
    it('should count entries by variant', () => {
      const counts = countByVariant(multiVariantCollection);

      expect(counts.get('normal')).toBe(2);
      expect(counts.get('holofoil')).toBe(2);
      expect(counts.get('reverseHolofoil')).toBe(1);
      expect(counts.get('1stEditionHolofoil')).toBe(1);
      expect(counts.get('1stEditionNormal')).toBe(1);
    });

    it('should handle empty collection', () => {
      const counts = countByVariant([]);
      expect(counts.size).toBe(0);
    });
  });

  describe('quantityByVariant', () => {
    it('should sum quantities by variant', () => {
      const quantities = quantityByVariant(multiVariantCollection);

      expect(quantities.get('normal')).toBe(5); // 3 + 2
      expect(quantities.get('holofoil')).toBe(2); // 1 + 1
      expect(quantities.get('reverseHolofoil')).toBe(2);
      expect(quantities.get('1stEditionHolofoil')).toBe(5);
      expect(quantities.get('1stEditionNormal')).toBe(1);
    });
  });

  describe('hasVariant', () => {
    it('should return true when variant exists', () => {
      expect(hasVariant(multiVariantCollection, 'holofoil')).toBe(true);
      expect(hasVariant(multiVariantCollection, 'normal')).toBe(true);
      expect(hasVariant(multiVariantCollection, '1stEditionHolofoil')).toBe(true);
    });

    it('should return false when variant does not exist', () => {
      const cards = [createCard('sv1-1', 1, 'normal')];
      expect(hasVariant(cards, 'holofoil')).toBe(false);
    });

    it('should handle empty collection', () => {
      expect(hasVariant([], 'normal')).toBe(false);
    });
  });

  describe('getAllVariantsOfCard', () => {
    it('should return all variants of a specific card', () => {
      const sv1_1Variants = getAllVariantsOfCard(multiVariantCollection, 'sv1-1');

      expect(sv1_1Variants).toHaveLength(3);
      expect(sv1_1Variants.map((c) => c.variant)).toContain('normal');
      expect(sv1_1Variants.map((c) => c.variant)).toContain('holofoil');
      expect(sv1_1Variants.map((c) => c.variant)).toContain('reverseHolofoil');
    });

    it('should return empty for card not in collection', () => {
      const variants = getAllVariantsOfCard(multiVariantCollection, 'nonexistent');
      expect(variants).toHaveLength(0);
    });
  });

  describe('getTotalQuantityOfCard', () => {
    it('should sum quantity across all variants', () => {
      const total = getTotalQuantityOfCard(multiVariantCollection, 'sv1-1');
      expect(total).toBe(6); // 3 + 1 + 2
    });

    it('should return 0 for card not in collection', () => {
      const total = getTotalQuantityOfCard(multiVariantCollection, 'nonexistent');
      expect(total).toBe(0);
    });

    it('should handle single variant', () => {
      const total = getTotalQuantityOfCard(multiVariantCollection, 'sv2-10');
      expect(total).toBe(5);
    });
  });
});

describe('Variant Grouping Integration Scenarios', () => {
  describe('Displaying Collection by Variant', () => {
    it('should support grouping for display', () => {
      const collection: CollectionCard[] = [
        createCard('sv1-1', 5, 'normal'),
        createCard('sv1-1', 2, 'holofoil'),
        createCard('sv1-25', 1, 'normal'),
        createCard('sv2-10', 3, 'reverseHolofoil'),
      ];

      const grouped = groupCardsByCardIdWithDetails(collection);
      const summary = calculateVariantSummary(collection);

      // Should have 3 unique cards
      expect(grouped).toHaveLength(3);

      // sv1-1 should show both variants
      const sv1_1 = grouped.find((g) => g.cardId === 'sv1-1');
      expect(sv1_1!.totalQuantity).toBe(7);
      expect(sv1_1!.variants.normal).toBe(5);
      expect(sv1_1!.variants.holofoil).toBe(2);

      // Summary shows variant distribution
      expect(summary.variantBreakdown.normal).toBe(2);
      expect(summary.variantBreakdown.holofoil).toBe(1);
      expect(summary.variantBreakdown.reverseHolofoil).toBe(1);
    });
  });

  describe('Filtering Collection View', () => {
    it('should support filtering to specific variants', () => {
      const collection: CollectionCard[] = [
        createCard('sv1-1', 3, 'normal'),
        createCard('sv1-1', 1, 'holofoil'),
        createCard('sv1-25', 2, 'normal'),
        createCard('sv1-50', 1, 'holofoil'),
      ];

      // Filter to holofoils only
      const holofoils = filterByVariant(collection, 'holofoil');
      expect(holofoils).toHaveLength(2);
      expect(holofoils.every((c) => c.variant === 'holofoil')).toBe(true);

      // Get quantity of holofoils
      const quantities = quantityByVariant(holofoils);
      expect(quantities.get('holofoil')).toBe(2);
    });
  });

  describe('Collection Statistics', () => {
    it('should provide complete variant statistics', () => {
      const collection: CollectionCard[] = [
        createCard('sv1-1', 10, 'normal'),
        createCard('sv1-1', 5, 'holofoil'),
        createCard('sv1-1', 3, 'reverseHolofoil'),
        createCard('sv2-1', 2, 'normal'),
        createCard('sv2-1', 1, '1stEditionHolofoil'),
      ];

      const summary = calculateVariantSummary(collection);
      const usedVariants = getUsedVariants(collection);

      // Summary stats
      expect(summary.totalEntries).toBe(5);
      expect(summary.totalQuantity).toBe(21);
      expect(summary.uniqueCards).toBe(2);

      // Variant breakdown
      expect(summary.variantBreakdown.normal).toBe(2);
      expect(summary.variantBreakdown.holofoil).toBe(1);
      expect(summary.variantBreakdown.reverseHolofoil).toBe(1);
      expect(summary.variantBreakdown['1stEditionHolofoil']).toBe(1);

      // Used variants
      expect(usedVariants).toContain('normal');
      expect(usedVariants).toContain('holofoil');
      expect(usedVariants).toContain('reverseHolofoil');
      expect(usedVariants).toContain('1stEditionHolofoil');
      expect(usedVariants).not.toContain('1stEditionNormal'); // Not used
    });
  });
});
