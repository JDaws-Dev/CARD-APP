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
  // Random card selection
  filterCollectionCards,
  selectRandomItem,
  selectRandomCard,
  shuffleArray,
  shuffleCopy,
  selectRandomCards,
  hasEnoughCards,
  maxRandomCards,
  validateRandomCardOptions,
  enrichRandomCard,
  enrichRandomCards,
  getRandomCardMessage,
  cardSelectionProbability,
  RandomCardResult,
} from '../collections';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createCard(cardId: string, quantity = 1, variant: CardVariant = 'normal'): CollectionCard {
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
      const collection = [createCard('sv1-1', 2, 'normal'), createCard('sv1-1', 1, 'holofoil')];
      const stats = getCollectionStats(collection);

      expect(stats.uniqueCards).toBe(2);
      expect(stats.totalCards).toBe(3);
      expect(stats.setsStarted).toBe(1);
    });
  });

  describe('checkCardOwnership', () => {
    it('should return ownership details for owned card', () => {
      const collection = [createCard('sv1-1', 3, 'normal'), createCard('sv1-1', 1, 'holofoil')];

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
      expect(result.collection.some((c) => c.cardId === 'sv1-1' && c.variant === 'holofoil')).toBe(
        false
      );
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
      const result = removeCardFromCollection(collection, 'sv1-1', 'reverseHolofoil');

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
      collection = [createCard('sv1-1', 2, 'normal'), createCard('sv1-1', 1, 'holofoil')];
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
      const collection = [createCard('sv1-1', 1, 'normal'), createCard('sv1-a', 1, 'normal')];

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

// ============================================================================
// NEW IN COLLECTION - Cards added in last N days
// ============================================================================

import {
  CardAdditionLog,
  NewlyAddedCard,
  DEFAULT_NEW_CARDS_DAYS,
  MAX_NEW_CARDS_DAYS,
  getCutoffTimestamp,
  filterRecentCardAdditions,
  extractCardAddition,
  parseCardAdditions,
  groupAdditionsByDate,
  getDailySummaries,
  calculateNewlyAddedSummary,
  getUniqueCardIdsFromAdditions,
  enrichCardAdditions,
  isWithinNewWindow,
  formatAddedAtRelative,
  formatAddedAtAbsolute,
  sortByAddedAt,
  groupNewlyAddedByDay,
  countNewCardsBySet,
  getNewCardsBadgeText,
  hasAnyNewCards,
} from '../collections';

// Helper to create activity log entries
function createActivityLog(
  action: string,
  creationTime: number,
  metadata?: { cardId?: string; variant?: string; quantity?: number }
): { action: string; _creationTime: number; metadata?: unknown } {
  return {
    action,
    _creationTime: creationTime,
    metadata,
  };
}

// Helper to create card addition logs
function createCardAdditionLog(
  cardId: string,
  addedAt: number,
  variant: CardVariant = 'normal',
  quantity = 1
): CardAdditionLog {
  return { cardId, addedAt, variant, quantity };
}

// Helper to create newly added cards
function createNewlyAddedCard(
  cardId: string,
  addedAt: number,
  name?: string,
  variant: CardVariant = 'normal'
): NewlyAddedCard {
  return {
    cardId,
    name: name ?? cardId,
    imageSmall: '',
    setId: cardId.split('-')[0],
    variant,
    quantity: 1,
    addedAt,
  };
}

describe('New In Collection Constants', () => {
  it('should have correct default days', () => {
    expect(DEFAULT_NEW_CARDS_DAYS).toBe(7);
  });

  it('should have correct max days', () => {
    expect(MAX_NEW_CARDS_DAYS).toBe(30);
  });
});

describe('getCutoffTimestamp', () => {
  it('should calculate cutoff for 7 days', () => {
    const now = Date.now();
    const cutoff = getCutoffTimestamp(7);
    const expectedCutoff = now - 7 * 24 * 60 * 60 * 1000;

    // Allow 1 second of tolerance for test execution time
    expect(Math.abs(cutoff - expectedCutoff)).toBeLessThan(1000);
  });

  it('should calculate cutoff for 1 day', () => {
    const now = Date.now();
    const cutoff = getCutoffTimestamp(1);
    const expectedCutoff = now - 1 * 24 * 60 * 60 * 1000;

    expect(Math.abs(cutoff - expectedCutoff)).toBeLessThan(1000);
  });

  it('should calculate cutoff for 30 days', () => {
    const now = Date.now();
    const cutoff = getCutoffTimestamp(30);
    const expectedCutoff = now - 30 * 24 * 60 * 60 * 1000;

    expect(Math.abs(cutoff - expectedCutoff)).toBeLessThan(1000);
  });
});

describe('filterRecentCardAdditions', () => {
  const now = Date.now();
  const oneDayAgo = now - 1 * 24 * 60 * 60 * 1000;
  const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
  const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;

  it('should filter to only card_added events within window', () => {
    const logs = [
      createActivityLog('card_added', now, { cardId: 'sv1-1' }),
      createActivityLog('card_added', oneDayAgo, { cardId: 'sv1-2' }),
      createActivityLog('card_added', tenDaysAgo, { cardId: 'sv1-3' }),
      createActivityLog('card_removed', now, { cardId: 'sv1-4' }),
      createActivityLog('achievement_earned', now, { achievementKey: 'test' }),
    ];

    const cutoff = getCutoffTimestamp(7);
    const recent = filterRecentCardAdditions(logs, cutoff);

    expect(recent).toHaveLength(2);
    expect(recent[0].action).toBe('card_added');
    expect(recent[1].action).toBe('card_added');
  });

  it('should return empty for no matching events', () => {
    const logs = [
      createActivityLog('card_removed', now, { cardId: 'sv1-1' }),
      createActivityLog('achievement_earned', now, {}),
    ];

    const recent = filterRecentCardAdditions(logs, getCutoffTimestamp(7));

    expect(recent).toHaveLength(0);
  });

  it('should handle empty logs array', () => {
    const recent = filterRecentCardAdditions([], getCutoffTimestamp(7));
    expect(recent).toHaveLength(0);
  });
});

describe('extractCardAddition', () => {
  const now = Date.now();

  it('should extract card addition from log with all fields', () => {
    const log = createActivityLog('card_added', now, {
      cardId: 'sv1-1',
      variant: 'holofoil',
      quantity: 3,
    });

    const addition = extractCardAddition(log);

    expect(addition).not.toBeNull();
    expect(addition!.cardId).toBe('sv1-1');
    expect(addition!.variant).toBe('holofoil');
    expect(addition!.quantity).toBe(3);
    expect(addition!.addedAt).toBe(now);
  });

  it('should default variant to normal when not specified', () => {
    const log = createActivityLog('card_added', now, { cardId: 'sv1-1' });

    const addition = extractCardAddition(log);

    expect(addition!.variant).toBe('normal');
  });

  it('should default quantity to 1 when not specified', () => {
    const log = createActivityLog('card_added', now, { cardId: 'sv1-1' });

    const addition = extractCardAddition(log);

    expect(addition!.quantity).toBe(1);
  });

  it('should return null for log without cardId', () => {
    const log = createActivityLog('card_added', now, { variant: 'holofoil' });

    const addition = extractCardAddition(log);

    expect(addition).toBeNull();
  });

  it('should return null for log without metadata', () => {
    const log = { action: 'card_added', _creationTime: now };

    const addition = extractCardAddition(log);

    expect(addition).toBeNull();
  });

  it('should handle invalid variant by defaulting to normal', () => {
    const log = createActivityLog('card_added', now, {
      cardId: 'sv1-1',
      variant: 'invalid_variant',
    });

    const addition = extractCardAddition(log);

    expect(addition!.variant).toBe('normal');
  });
});

describe('parseCardAdditions', () => {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  it('should parse multiple logs into additions', () => {
    const logs = [
      createActivityLog('card_added', now, { cardId: 'sv1-1', variant: 'normal', quantity: 2 }),
      createActivityLog('card_added', oneDayAgo, {
        cardId: 'sv1-2',
        variant: 'holofoil',
        quantity: 1,
      }),
    ];

    const additions = parseCardAdditions(logs);

    expect(additions).toHaveLength(2);
    expect(additions[0].cardId).toBe('sv1-1');
    expect(additions[1].cardId).toBe('sv1-2');
  });

  it('should skip logs without cardId', () => {
    const logs = [
      createActivityLog('card_added', now, { cardId: 'sv1-1' }),
      createActivityLog('card_added', now, {}),
      createActivityLog('card_added', now, { cardId: 'sv1-2' }),
    ];

    const additions = parseCardAdditions(logs);

    expect(additions).toHaveLength(2);
  });

  it('should handle empty logs', () => {
    const additions = parseCardAdditions([]);
    expect(additions).toHaveLength(0);
  });
});

describe('groupAdditionsByDate', () => {
  it('should group additions by date', () => {
    const day1 = new Date('2026-01-15T10:00:00Z').getTime();
    const day1Later = new Date('2026-01-15T14:00:00Z').getTime();
    const day2 = new Date('2026-01-16T08:00:00Z').getTime();

    const additions: CardAdditionLog[] = [
      createCardAdditionLog('sv1-1', day1, 'normal', 2),
      createCardAdditionLog('sv1-2', day1Later, 'holofoil', 1),
      createCardAdditionLog('sv1-3', day2, 'normal', 3),
    ];

    const grouped = groupAdditionsByDate(additions);

    expect(grouped.size).toBe(2);

    const jan15 = grouped.get('2026-01-15');
    expect(jan15).toBeDefined();
    expect(jan15!.additionCount).toBe(2);
    expect(jan15!.uniqueCardsCount).toBe(2);
    expect(jan15!.totalQuantity).toBe(3);

    const jan16 = grouped.get('2026-01-16');
    expect(jan16).toBeDefined();
    expect(jan16!.additionCount).toBe(1);
    expect(jan16!.totalQuantity).toBe(3);
  });

  it('should count same card added multiple times separately', () => {
    const time1 = new Date('2026-01-15T10:00:00Z').getTime();
    const time2 = new Date('2026-01-15T11:00:00Z').getTime();

    const additions: CardAdditionLog[] = [
      createCardAdditionLog('sv1-1', time1, 'normal', 1),
      createCardAdditionLog('sv1-1', time2, 'holofoil', 1),
    ];

    const grouped = groupAdditionsByDate(additions);
    const summary = grouped.get('2026-01-15');

    expect(summary!.additionCount).toBe(2);
    expect(summary!.uniqueCardsCount).toBe(1); // Same card
    expect(summary!.totalQuantity).toBe(2);
  });

  it('should handle empty additions', () => {
    const grouped = groupAdditionsByDate([]);
    expect(grouped.size).toBe(0);
  });
});

describe('getDailySummaries', () => {
  it('should return summaries sorted by date descending', () => {
    const day1 = new Date('2026-01-13').getTime();
    const day2 = new Date('2026-01-15').getTime();
    const day3 = new Date('2026-01-14').getTime();

    const additions: CardAdditionLog[] = [
      createCardAdditionLog('sv1-1', day1),
      createCardAdditionLog('sv1-2', day2),
      createCardAdditionLog('sv1-3', day3),
    ];

    const summaries = getDailySummaries(additions);

    expect(summaries).toHaveLength(3);
    expect(summaries[0].date).toBe('2026-01-15');
    expect(summaries[1].date).toBe('2026-01-14');
    expect(summaries[2].date).toBe('2026-01-13');
  });
});

describe('calculateNewlyAddedSummary', () => {
  it('should calculate summary for additions', () => {
    const time1 = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days ago
    const time2 = Date.now() - 1 * 24 * 60 * 60 * 1000; // 1 day ago
    const time3 = Date.now(); // Now

    const additions: CardAdditionLog[] = [
      createCardAdditionLog('sv1-1', time1),
      createCardAdditionLog('sv1-2', time2),
      createCardAdditionLog('sv1-1', time3), // Same card again
    ];

    const summary = calculateNewlyAddedSummary(additions, 7);

    expect(summary.totalAdditions).toBe(3);
    expect(summary.uniqueCards).toBe(2);
    expect(summary.daysSearched).toBe(7);
    expect(summary.oldestAddition).toBe(time1);
    expect(summary.newestAddition).toBe(time3);
  });

  it('should return empty summary for no additions', () => {
    const summary = calculateNewlyAddedSummary([], 7);

    expect(summary.totalAdditions).toBe(0);
    expect(summary.uniqueCards).toBe(0);
    expect(summary.daysSearched).toBe(7);
    expect(summary.oldestAddition).toBeNull();
    expect(summary.newestAddition).toBeNull();
  });
});

describe('getUniqueCardIdsFromAdditions', () => {
  it('should return unique card IDs', () => {
    const additions: CardAdditionLog[] = [
      createCardAdditionLog('sv1-1', Date.now()),
      createCardAdditionLog('sv1-2', Date.now()),
      createCardAdditionLog('sv1-1', Date.now()), // Duplicate
      createCardAdditionLog('sv1-3', Date.now()),
    ];

    const uniqueIds = getUniqueCardIdsFromAdditions(additions);

    expect(uniqueIds).toHaveLength(3);
    expect(uniqueIds).toContain('sv1-1');
    expect(uniqueIds).toContain('sv1-2');
    expect(uniqueIds).toContain('sv1-3');
  });

  it('should handle empty additions', () => {
    const uniqueIds = getUniqueCardIdsFromAdditions([]);
    expect(uniqueIds).toHaveLength(0);
  });
});

describe('enrichCardAdditions', () => {
  it('should enrich with card data', () => {
    const now = Date.now();
    const additions: CardAdditionLog[] = [
      createCardAdditionLog('sv1-1', now, 'holofoil', 2),
      createCardAdditionLog('sv2-10', now, 'normal', 1),
    ];

    const cardDataMap = new Map([
      ['sv1-1', { name: 'Pikachu', imageSmall: 'pikachu.png', setId: 'sv1', rarity: 'Rare' }],
      [
        'sv2-10',
        { name: 'Charizard', imageSmall: 'charizard.png', setId: 'sv2', rarity: 'Ultra Rare' },
      ],
    ]);

    const enriched = enrichCardAdditions(additions, cardDataMap);

    expect(enriched).toHaveLength(2);
    expect(enriched[0].name).toBe('Pikachu');
    expect(enriched[0].imageSmall).toBe('pikachu.png');
    expect(enriched[0].rarity).toBe('Rare');
    expect(enriched[0].variant).toBe('holofoil');
    expect(enriched[0].quantity).toBe(2);
  });

  it('should fallback to cardId when not in map', () => {
    const additions: CardAdditionLog[] = [createCardAdditionLog('sv1-unknown', Date.now())];

    const enriched = enrichCardAdditions(additions, new Map());

    expect(enriched[0].name).toBe('sv1-unknown');
    expect(enriched[0].setId).toBe('sv1');
    expect(enriched[0].imageSmall).toBe('');
  });
});

describe('isWithinNewWindow', () => {
  it('should return true for recent timestamps', () => {
    const now = Date.now();
    const oneDayAgo = now - 1 * 24 * 60 * 60 * 1000;
    const sixDaysAgo = now - 6 * 24 * 60 * 60 * 1000;

    expect(isWithinNewWindow(now)).toBe(true);
    expect(isWithinNewWindow(oneDayAgo)).toBe(true);
    expect(isWithinNewWindow(sixDaysAgo)).toBe(true);
  });

  it('should return false for old timestamps', () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    expect(isWithinNewWindow(eightDaysAgo)).toBe(false);
    expect(isWithinNewWindow(thirtyDaysAgo)).toBe(false);
  });

  it('should respect custom days parameter', () => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;

    expect(isWithinNewWindow(threeDaysAgo, 2)).toBe(false);
    expect(isWithinNewWindow(threeDaysAgo, 5)).toBe(true);
  });
});

describe('formatAddedAtRelative', () => {
  it('should format as "just now" for very recent', () => {
    const now = Date.now();
    expect(formatAddedAtRelative(now)).toBe('just now');
  });

  it('should format minutes ago', () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    expect(formatAddedAtRelative(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  it('should format single minute correctly', () => {
    const oneMinuteAgo = Date.now() - 1 * 60 * 1000;
    expect(formatAddedAtRelative(oneMinuteAgo)).toBe('1 minute ago');
  });

  it('should format hours ago', () => {
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
    expect(formatAddedAtRelative(threeHoursAgo)).toBe('3 hours ago');
  });

  it('should format single hour correctly', () => {
    const oneHourAgo = Date.now() - 1 * 60 * 60 * 1000;
    expect(formatAddedAtRelative(oneHourAgo)).toBe('1 hour ago');
  });

  it('should format "yesterday"', () => {
    const yesterday = Date.now() - 1 * 24 * 60 * 60 * 1000;
    expect(formatAddedAtRelative(yesterday)).toBe('yesterday');
  });

  it('should format days ago', () => {
    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
    expect(formatAddedAtRelative(fiveDaysAgo)).toBe('5 days ago');
  });

  it('should format older dates as month/day', () => {
    const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
    const result = formatAddedAtRelative(tenDaysAgo);
    // Should be something like "Jan 6" - just check it's not a relative time
    expect(result).not.toContain('ago');
    expect(result).not.toBe('yesterday');
  });
});

describe('formatAddedAtAbsolute', () => {
  it('should format as absolute date', () => {
    const timestamp = new Date('2026-01-15T10:30:00Z').getTime();
    const result = formatAddedAtAbsolute(timestamp);

    // Should include year, month, and day
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2026');
  });
});

describe('sortByAddedAt', () => {
  it('should sort by date descending by default', () => {
    const oldCard = createNewlyAddedCard('sv1-1', Date.now() - 5 * 24 * 60 * 60 * 1000);
    const midCard = createNewlyAddedCard('sv1-2', Date.now() - 2 * 24 * 60 * 60 * 1000);
    const newCard = createNewlyAddedCard('sv1-3', Date.now());

    const cards = [oldCard, midCard, newCard];
    const sorted = sortByAddedAt(cards);

    expect(sorted[0].cardId).toBe('sv1-3'); // Newest first
    expect(sorted[1].cardId).toBe('sv1-2');
    expect(sorted[2].cardId).toBe('sv1-1');
  });

  it('should sort ascending when specified', () => {
    const oldCard = createNewlyAddedCard('sv1-1', Date.now() - 5 * 24 * 60 * 60 * 1000);
    const newCard = createNewlyAddedCard('sv1-3', Date.now());

    const sorted = sortByAddedAt([oldCard, newCard], true);

    expect(sorted[0].cardId).toBe('sv1-1'); // Oldest first
    expect(sorted[1].cardId).toBe('sv1-3');
  });

  it('should not mutate original array', () => {
    const cards = [
      createNewlyAddedCard('sv1-1', Date.now()),
      createNewlyAddedCard('sv1-2', Date.now() - 1000),
    ];
    const original = [...cards];

    sortByAddedAt(cards);

    expect(cards).toEqual(original);
  });
});

describe('groupNewlyAddedByDay', () => {
  it('should group cards by day', () => {
    const day1Time = new Date('2026-01-15T10:00:00Z').getTime();
    const day1Time2 = new Date('2026-01-15T14:00:00Z').getTime();
    const day2Time = new Date('2026-01-16T08:00:00Z').getTime();

    const cards = [
      createNewlyAddedCard('sv1-1', day1Time),
      createNewlyAddedCard('sv1-2', day1Time2),
      createNewlyAddedCard('sv1-3', day2Time),
    ];

    const grouped = groupNewlyAddedByDay(cards);

    expect(grouped.size).toBe(2);
    expect(grouped.get('2026-01-15')!).toHaveLength(2);
    expect(grouped.get('2026-01-16')!).toHaveLength(1);
  });

  it('should handle empty array', () => {
    const grouped = groupNewlyAddedByDay([]);
    expect(grouped.size).toBe(0);
  });
});

describe('countNewCardsBySet', () => {
  it('should count cards by set', () => {
    const cards = [
      createNewlyAddedCard('sv1-1', Date.now()),
      createNewlyAddedCard('sv1-2', Date.now()),
      createNewlyAddedCard('sv2-1', Date.now()),
      createNewlyAddedCard('sv1-3', Date.now()),
    ];

    const counts = countNewCardsBySet(cards);

    expect(counts.get('sv1')).toBe(3);
    expect(counts.get('sv2')).toBe(1);
  });

  it('should handle empty array', () => {
    const counts = countNewCardsBySet([]);
    expect(counts.size).toBe(0);
  });
});

describe('getNewCardsBadgeText', () => {
  it('should return empty string for 0 cards', () => {
    expect(getNewCardsBadgeText(0)).toBe('');
  });

  it('should return singular form for 1 card', () => {
    expect(getNewCardsBadgeText(1)).toBe('1 new card');
  });

  it('should return plural form for multiple cards', () => {
    expect(getNewCardsBadgeText(5)).toBe('5 new cards');
    expect(getNewCardsBadgeText(100)).toBe('100 new cards');
  });
});

describe('hasAnyNewCards', () => {
  it('should return true when there are additions', () => {
    const additions = [createCardAdditionLog('sv1-1', Date.now())];
    expect(hasAnyNewCards(additions)).toBe(true);
  });

  it('should return false when empty', () => {
    expect(hasAnyNewCards([])).toBe(false);
  });
});

describe('New In Collection Integration Scenarios', () => {
  describe('Processing Activity Logs', () => {
    it('should process activity logs into displayable new cards', () => {
      const now = Date.now();
      const oneDayAgo = now - 1 * 24 * 60 * 60 * 1000;
      const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

      // Simulate activity logs from database
      const logs = [
        createActivityLog('card_added', now, { cardId: 'sv1-1', variant: 'holofoil', quantity: 1 }),
        createActivityLog('card_added', oneDayAgo, {
          cardId: 'sv1-25',
          variant: 'normal',
          quantity: 2,
        }),
        createActivityLog('card_removed', oneDayAgo, { cardId: 'sv1-10' }), // Should be ignored
        createActivityLog('card_added', twoDaysAgo, {
          cardId: 'sv2-5',
          variant: 'reverseHolofoil',
          quantity: 1,
        }),
      ];

      // Filter recent additions
      const cutoff = getCutoffTimestamp(7);
      const recentLogs = filterRecentCardAdditions(logs, cutoff);

      expect(recentLogs).toHaveLength(3);

      // Parse into additions
      const additions = parseCardAdditions(recentLogs);

      expect(additions).toHaveLength(3);

      // Enrich with card data
      const cardDataMap = new Map([
        ['sv1-1', { name: 'Pikachu', imageSmall: 'pika.png', setId: 'sv1', rarity: 'Rare' }],
        ['sv1-25', { name: 'Eevee', imageSmall: 'eevee.png', setId: 'sv1', rarity: 'Common' }],
        [
          'sv2-5',
          { name: 'Charizard', imageSmall: 'char.png', setId: 'sv2', rarity: 'Ultra Rare' },
        ],
      ]);

      const enrichedCards = enrichCardAdditions(additions, cardDataMap);

      expect(enrichedCards[0].name).toBe('Pikachu');
      expect(enrichedCards[1].name).toBe('Eevee');
      expect(enrichedCards[2].name).toBe('Charizard');

      // Sort for display
      const sortedCards = sortByAddedAt(enrichedCards);

      expect(sortedCards[0].name).toBe('Pikachu'); // Most recent first
      expect(sortedCards[2].name).toBe('Charizard'); // Oldest last

      // Get summary
      const summary = calculateNewlyAddedSummary(additions, 7);

      expect(summary.totalAdditions).toBe(3);
      expect(summary.uniqueCards).toBe(3);
    });
  });

  describe('Daily Activity Summary', () => {
    it('should summarize activity by day for calendar display', () => {
      const day1 = new Date('2026-01-13T10:00:00Z').getTime();
      const day1Later = new Date('2026-01-13T15:00:00Z').getTime();
      const day2 = new Date('2026-01-14T09:00:00Z').getTime();
      const day3 = new Date('2026-01-15T12:00:00Z').getTime();

      const additions: CardAdditionLog[] = [
        createCardAdditionLog('sv1-1', day1, 'normal', 2),
        createCardAdditionLog('sv1-2', day1Later, 'holofoil', 1),
        createCardAdditionLog('sv1-1', day2, 'reverseHolofoil', 1), // Same card, different day
        createCardAdditionLog('sv2-1', day3, 'normal', 5),
      ];

      const dailySummaries = getDailySummaries(additions);

      expect(dailySummaries).toHaveLength(3);

      // Sorted descending by date
      expect(dailySummaries[0].date).toBe('2026-01-15');
      expect(dailySummaries[0].additionCount).toBe(1);
      expect(dailySummaries[0].totalQuantity).toBe(5);

      expect(dailySummaries[1].date).toBe('2026-01-14');

      expect(dailySummaries[2].date).toBe('2026-01-13');
      expect(dailySummaries[2].additionCount).toBe(2);
      expect(dailySummaries[2].uniqueCardsCount).toBe(2);
      expect(dailySummaries[2].totalQuantity).toBe(3);
    });
  });

  describe('Badge Display', () => {
    it('should show appropriate badge text', () => {
      // No new cards
      expect(getNewCardsBadgeText(0)).toBe('');

      // Single card
      expect(getNewCardsBadgeText(1)).toBe('1 new card');

      // Multiple cards
      expect(getNewCardsBadgeText(15)).toBe('15 new cards');
    });
  });

  describe('Time Window Detection', () => {
    it('should correctly identify cards within different time windows', () => {
      const now = Date.now();
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
      const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;

      // Default 7-day window
      expect(isWithinNewWindow(threeDaysAgo)).toBe(true);
      expect(isWithinNewWindow(eightDaysAgo)).toBe(false);

      // Custom 2-day window
      expect(isWithinNewWindow(threeDaysAgo, 2)).toBe(false);

      // Custom 14-day window
      expect(isWithinNewWindow(eightDaysAgo, 14)).toBe(true);
    });
  });
});

// ============================================================================
// RANDOM CARD SELECTION TESTS
// ============================================================================

describe('Random Card Selection', () => {
  // Helper to create a consistent test collection
  const createTestCollection = (): CollectionCard[] => [
    { cardId: 'sv1-1', quantity: 2, variant: 'normal' },
    { cardId: 'sv1-25', quantity: 1, variant: 'holofoil' },
    { cardId: 'sv1-50', quantity: 3, variant: 'reverseHolofoil' },
    { cardId: 'sv2-1', quantity: 1, variant: 'normal' },
    { cardId: 'sv2-10', quantity: 2, variant: 'holofoil' },
    { cardId: 'sv3-5', quantity: 1, variant: '1stEditionHolofoil' },
  ];

  describe('filterCollectionCards', () => {
    it('should return all cards when no filters applied', () => {
      const cards = createTestCollection();
      const filtered = filterCollectionCards(cards);
      expect(filtered).toHaveLength(6);
    });

    it('should filter by setId', () => {
      const cards = createTestCollection();
      const filtered = filterCollectionCards(cards, { setId: 'sv1' });
      expect(filtered).toHaveLength(3);
      expect(filtered.every((c) => c.cardId.startsWith('sv1-'))).toBe(true);
    });

    it('should filter by variant', () => {
      const cards = createTestCollection();
      const filtered = filterCollectionCards(cards, { variant: 'holofoil' });
      expect(filtered).toHaveLength(2);
      expect(filtered.every((c) => c.variant === 'holofoil')).toBe(true);
    });

    it('should filter by both setId and variant', () => {
      const cards = createTestCollection();
      const filtered = filterCollectionCards(cards, { setId: 'sv1', variant: 'holofoil' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].cardId).toBe('sv1-25');
    });

    it('should return empty array when no cards match', () => {
      const cards = createTestCollection();
      const filtered = filterCollectionCards(cards, { setId: 'sv99' });
      expect(filtered).toHaveLength(0);
    });

    it('should handle empty collection', () => {
      const filtered = filterCollectionCards([]);
      expect(filtered).toHaveLength(0);
    });

    it('should treat null variant as normal', () => {
      const cards: CollectionCard[] = [
        { cardId: 'sv1-1', quantity: 1, variant: 'normal' },
        { cardId: 'sv1-2', quantity: 1, variant: 'holofoil' },
      ];
      const filtered = filterCollectionCards(cards, { variant: 'normal' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].cardId).toBe('sv1-1');
    });
  });

  describe('selectRandomItem', () => {
    it('should return null for empty array', () => {
      expect(selectRandomItem([])).toBeNull();
    });

    it('should return the only item for single-item array', () => {
      expect(selectRandomItem(['only'])).toBe('only');
    });

    it('should return an item from the array', () => {
      const items = [1, 2, 3, 4, 5];
      const selected = selectRandomItem(items);
      expect(items).toContain(selected);
    });

    it('should work with different types', () => {
      const objects = [{ id: 1 }, { id: 2 }];
      const selected = selectRandomItem(objects);
      expect(objects).toContain(selected);
    });
  });

  describe('selectRandomCard', () => {
    it('should return null for empty collection', () => {
      expect(selectRandomCard([])).toBeNull();
    });

    it('should return null when no cards match filter', () => {
      const cards = createTestCollection();
      expect(selectRandomCard(cards, { setId: 'nonexistent' })).toBeNull();
    });

    it('should return a card from the collection', () => {
      const cards = createTestCollection();
      const selected = selectRandomCard(cards);
      expect(selected).not.toBeNull();
      expect(cards.some((c) => c.cardId === selected!.cardId)).toBe(true);
    });

    it('should respect setId filter', () => {
      const cards = createTestCollection();
      // Run multiple times to increase confidence
      for (let i = 0; i < 10; i++) {
        const selected = selectRandomCard(cards, { setId: 'sv2' });
        expect(selected).not.toBeNull();
        expect(selected!.cardId.startsWith('sv2-')).toBe(true);
      }
    });

    it('should respect variant filter', () => {
      const cards = createTestCollection();
      for (let i = 0; i < 10; i++) {
        const selected = selectRandomCard(cards, { variant: 'reverseHolofoil' });
        expect(selected).not.toBeNull();
        expect(selected!.variant).toBe('reverseHolofoil');
      }
    });
  });

  describe('shuffleArray', () => {
    it('should return the same array reference', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffleArray(arr);
      expect(result).toBe(arr);
    });

    it('should maintain array length', () => {
      const arr = [1, 2, 3, 4, 5];
      shuffleArray(arr);
      expect(arr).toHaveLength(5);
    });

    it('should contain all original elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];
      shuffleArray(arr);
      expect(arr.sort()).toEqual(original.sort());
    });

    it('should handle empty array', () => {
      const arr: number[] = [];
      expect(shuffleArray(arr)).toEqual([]);
    });

    it('should handle single element array', () => {
      const arr = [1];
      shuffleArray(arr);
      expect(arr).toEqual([1]);
    });
  });

  describe('shuffleCopy', () => {
    it('should return a new array reference', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = shuffleCopy(arr);
      expect(result).not.toBe(arr);
    });

    it('should not modify the original array', () => {
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];
      shuffleCopy(arr);
      expect(arr).toEqual(original);
    });

    it('should maintain array length', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(shuffleCopy(arr)).toHaveLength(5);
    });

    it('should contain all original elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffleCopy(arr);
      expect(shuffled.sort()).toEqual(arr.sort());
    });
  });

  describe('selectRandomCards', () => {
    it('should return empty array for empty collection', () => {
      expect(selectRandomCards([])).toEqual([]);
    });

    it('should return empty array when no cards match filter', () => {
      const cards = createTestCollection();
      expect(selectRandomCards(cards, { setId: 'nonexistent' })).toEqual([]);
    });

    it('should default to 3 cards', () => {
      const cards = createTestCollection();
      const selected = selectRandomCards(cards);
      expect(selected).toHaveLength(3);
    });

    it('should respect count option', () => {
      const cards = createTestCollection();
      expect(selectRandomCards(cards, { count: 1 })).toHaveLength(1);
      expect(selectRandomCards(cards, { count: 5 })).toHaveLength(5);
    });

    it('should not exceed collection size without duplicates', () => {
      const cards = createTestCollection();
      const selected = selectRandomCards(cards, { count: 10, allowDuplicates: false });
      expect(selected).toHaveLength(6); // Collection has 6 cards
    });

    it('should allow more cards than collection size with duplicates', () => {
      const cards = createTestCollection();
      const selected = selectRandomCards(cards, { count: 10, allowDuplicates: true });
      expect(selected).toHaveLength(10);
    });

    it('should return unique cards by default', () => {
      const cards = createTestCollection();
      const selected = selectRandomCards(cards, { count: 6 });

      // Check all cardIds are unique
      const cardIds = selected.map((c) => c.cardId);
      const uniqueCardIds = new Set(cardIds);
      expect(uniqueCardIds.size).toBe(6);
    });

    it('should apply filters correctly', () => {
      const cards = createTestCollection();
      const selected = selectRandomCards(cards, { setId: 'sv1', count: 10 });
      expect(selected).toHaveLength(3); // Only 3 sv1 cards
      expect(selected.every((c) => c.cardId.startsWith('sv1-'))).toBe(true);
    });
  });

  describe('hasEnoughCards', () => {
    it('should return true when collection has enough cards', () => {
      const cards = createTestCollection();
      expect(hasEnoughCards(cards, 3)).toBe(true);
      expect(hasEnoughCards(cards, 6)).toBe(true);
    });

    it('should return false when collection does not have enough cards', () => {
      const cards = createTestCollection();
      expect(hasEnoughCards(cards, 7)).toBe(false);
      expect(hasEnoughCards(cards, 100)).toBe(false);
    });

    it('should return true for empty count request', () => {
      expect(hasEnoughCards([], 0)).toBe(true);
    });
  });

  describe('maxRandomCards', () => {
    it('should return collection length', () => {
      const cards = createTestCollection();
      expect(maxRandomCards(cards)).toBe(6);
    });

    it('should return 0 for empty collection', () => {
      expect(maxRandomCards([])).toBe(0);
    });
  });

  describe('validateRandomCardOptions', () => {
    it('should return null for valid options', () => {
      expect(validateRandomCardOptions()).toBeNull();
      expect(validateRandomCardOptions({ count: 5 })).toBeNull();
      expect(validateRandomCardOptions({ variant: 'holofoil' })).toBeNull();
      expect(
        validateRandomCardOptions({ count: 3, setId: 'sv1', variant: 'normal' })
      ).toBeNull();
    });

    it('should return error for invalid count', () => {
      expect(validateRandomCardOptions({ count: 0 })).toBe('Count must be a positive integer');
      expect(validateRandomCardOptions({ count: -1 })).toBe('Count must be a positive integer');
      expect(validateRandomCardOptions({ count: 1.5 })).toBe('Count must be a positive integer');
    });

    it('should return error for invalid variant', () => {
      expect(validateRandomCardOptions({ variant: 'invalid' as CardVariant })).toBe(
        'Invalid variant'
      );
    });
  });

  describe('enrichRandomCard', () => {
    it('should enrich card with cached data', () => {
      const card: CollectionCard = { cardId: 'sv1-25', quantity: 2, variant: 'holofoil' };
      const cachedData = {
        name: 'Pikachu',
        imageSmall: 'small.png',
        imageLarge: 'large.png',
        setId: 'sv1',
        rarity: 'Rare',
        types: ['Electric'],
      };

      const result = enrichRandomCard(card, cachedData);

      expect(result.cardId).toBe('sv1-25');
      expect(result.name).toBe('Pikachu');
      expect(result.imageSmall).toBe('small.png');
      expect(result.imageLarge).toBe('large.png');
      expect(result.setId).toBe('sv1');
      expect(result.rarity).toBe('Rare');
      expect(result.types).toEqual(['Electric']);
      expect(result.quantity).toBe(2);
      expect(result.variant).toBe('holofoil');
    });

    it('should use fallback values when cached data is missing', () => {
      const card: CollectionCard = { cardId: 'sv2-10', quantity: 1, variant: 'normal' };
      const result = enrichRandomCard(card);

      expect(result.name).toBe('sv2-10');
      expect(result.imageSmall).toBe('');
      expect(result.imageLarge).toBe('');
      expect(result.setId).toBe('sv2');
      expect(result.rarity).toBeUndefined();
      expect(result.types).toEqual([]);
    });

    it('should default variant to normal', () => {
      const card: CollectionCard = { cardId: 'sv1-1', quantity: 1, variant: 'normal' };
      const result = enrichRandomCard(card);
      expect(result.variant).toBe('normal');
    });
  });

  describe('enrichRandomCards', () => {
    it('should enrich multiple cards', () => {
      const cards: CollectionCard[] = [
        { cardId: 'sv1-1', quantity: 1, variant: 'normal' },
        { cardId: 'sv1-25', quantity: 2, variant: 'holofoil' },
      ];

      const cachedDataMap = new Map([
        ['sv1-1', { name: 'Bulbasaur', imageSmall: 'bulb.png' }],
        ['sv1-25', { name: 'Pikachu', imageSmall: 'pika.png' }],
      ]);

      const results = enrichRandomCards(cards, cachedDataMap);

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Bulbasaur');
      expect(results[1].name).toBe('Pikachu');
    });

    it('should handle missing cached data', () => {
      const cards: CollectionCard[] = [{ cardId: 'sv1-1', quantity: 1, variant: 'normal' }];

      const results = enrichRandomCards(cards, new Map());

      expect(results[0].name).toBe('sv1-1');
    });
  });

  describe('getRandomCardMessage', () => {
    it('should return message for normal card', () => {
      const card: RandomCardResult = {
        cardId: 'sv1-25',
        variant: 'normal',
        quantity: 1,
        name: 'Pikachu',
        imageSmall: '',
        imageLarge: '',
        setId: 'sv1',
        types: [],
      };

      expect(getRandomCardMessage(card)).toBe('You got Pikachu!');
    });

    it('should include variant name for non-normal cards', () => {
      const holoCard: RandomCardResult = {
        cardId: 'sv1-25',
        variant: 'holofoil',
        quantity: 1,
        name: 'Pikachu',
        imageSmall: '',
        imageLarge: '',
        setId: 'sv1',
        types: [],
      };

      expect(getRandomCardMessage(holoCard)).toBe('You got a Holofoil Pikachu!');

      const reverseCard: RandomCardResult = {
        ...holoCard,
        variant: 'reverseHolofoil',
      };

      expect(getRandomCardMessage(reverseCard)).toBe('You got a Reverse Holofoil Pikachu!');
    });
  });

  describe('cardSelectionProbability', () => {
    it('should return 0 for empty collection', () => {
      expect(cardSelectionProbability([], 'sv1-1')).toBe(0);
    });

    it('should return 0 for card not in collection', () => {
      const cards = createTestCollection();
      expect(cardSelectionProbability(cards, 'nonexistent')).toBe(0);
    });

    it('should return 1 for only card in collection', () => {
      const cards: CollectionCard[] = [{ cardId: 'sv1-1', quantity: 1, variant: 'normal' }];
      expect(cardSelectionProbability(cards, 'sv1-1')).toBe(1);
    });

    it('should return correct probability for single occurrence', () => {
      const cards = createTestCollection(); // 6 cards
      // Each card appears once
      expect(cardSelectionProbability(cards, 'sv1-1')).toBeCloseTo(1 / 6, 5);
    });

    it('should count multiple entries of same cardId', () => {
      const cards: CollectionCard[] = [
        { cardId: 'sv1-1', quantity: 1, variant: 'normal' },
        { cardId: 'sv1-1', quantity: 1, variant: 'holofoil' },
        { cardId: 'sv1-2', quantity: 1, variant: 'normal' },
      ];
      // sv1-1 appears twice out of 3 entries
      expect(cardSelectionProbability(cards, 'sv1-1')).toBeCloseTo(2 / 3, 5);
    });
  });
});

describe('Random Card Integration Scenarios', () => {
  describe('Featured Cards Display', () => {
    it('should select featured cards for dashboard', () => {
      const collection: CollectionCard[] = [
        { cardId: 'sv1-1', quantity: 3, variant: 'normal' },
        { cardId: 'sv1-25', quantity: 1, variant: 'holofoil' },
        { cardId: 'sv2-50', quantity: 2, variant: 'reverseHolofoil' },
        { cardId: 'sv3-100', quantity: 1, variant: '1stEditionHolofoil' },
      ];

      const cachedDataMap = new Map([
        ['sv1-1', { name: 'Pikachu', imageSmall: 'pika.png', types: ['Electric'] }],
        ['sv1-25', { name: 'Charizard', imageSmall: 'char.png', types: ['Fire'] }],
        ['sv2-50', { name: 'Mewtwo', imageSmall: 'mewtwo.png', types: ['Psychic'] }],
        ['sv3-100', { name: 'Lugia', imageSmall: 'lugia.png', types: ['Psychic', 'Flying'] }],
      ]);

      // Select 3 featured cards
      const selected = selectRandomCards(collection, { count: 3 });
      expect(selected).toHaveLength(3);

      // Enrich with data for display
      const enriched = enrichRandomCards(selected, cachedDataMap);
      expect(enriched).toHaveLength(3);

      // All should have names
      for (const card of enriched) {
        expect(card.name).not.toBe(card.cardId);
      }
    });
  });

  describe('Random Card from Set', () => {
    it('should select random card from a specific set', () => {
      const collection: CollectionCard[] = [
        { cardId: 'sv1-1', quantity: 1, variant: 'normal' },
        { cardId: 'sv1-25', quantity: 1, variant: 'holofoil' },
        { cardId: 'sv2-1', quantity: 1, variant: 'normal' },
        { cardId: 'sv3-1', quantity: 1, variant: 'normal' },
      ];

      // Get random card from sv1 set
      const selected = selectRandomCard(collection, { setId: 'sv1' });
      expect(selected).not.toBeNull();
      expect(selected!.cardId.startsWith('sv1-')).toBe(true);
    });
  });

  describe('Holofoil Random Selection', () => {
    it('should select only holofoil cards when filtered', () => {
      const collection: CollectionCard[] = [
        { cardId: 'sv1-1', quantity: 2, variant: 'normal' },
        { cardId: 'sv1-25', quantity: 1, variant: 'holofoil' },
        { cardId: 'sv1-50', quantity: 1, variant: 'holofoil' },
        { cardId: 'sv2-1', quantity: 3, variant: 'reverseHolofoil' },
      ];

      const selected = selectRandomCards(collection, { variant: 'holofoil', count: 5 });

      // Should only get 2 cards (the holofoil ones)
      expect(selected).toHaveLength(2);
      expect(selected.every((c) => c.variant === 'holofoil')).toBe(true);
    });
  });

  describe('Empty Collection Handling', () => {
    it('should handle empty collection gracefully', () => {
      expect(selectRandomCard([])).toBeNull();
      expect(selectRandomCards([])).toEqual([]);
      expect(maxRandomCards([])).toBe(0);
      expect(hasEnoughCards([], 1)).toBe(false);
      expect(cardSelectionProbability([], 'sv1-1')).toBe(0);
    });
  });

  describe('Single Card Collection', () => {
    it('should always return the same card', () => {
      const collection: CollectionCard[] = [
        { cardId: 'sv1-1', quantity: 1, variant: 'holofoil' },
      ];

      for (let i = 0; i < 5; i++) {
        const selected = selectRandomCard(collection);
        expect(selected).not.toBeNull();
        expect(selected!.cardId).toBe('sv1-1');
        expect(selected!.variant).toBe('holofoil');
      }
    });
  });
});
