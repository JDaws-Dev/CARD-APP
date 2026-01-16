/**
 * Unit tests for collectionValue.ts
 * Tests collection value calculation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  // Types
  PricedCard,
  CollectionCardWithVariant,
  CollectionValueResult,
  ValuedCard,
  SetValue,
  PriceMap,
  CardDataMap,
  PriceTier,
  // Constants
  MIN_PRICE_THRESHOLD,
  DEFAULT_TOP_CARDS_LIMIT,
  PRICE_TIERS,
  // Price validation
  isValidPrice,
  parsePrice,
  roundToCents,
  // Price map building
  buildPriceMap,
  buildCardDataMap,
  // Value calculation
  calculateCollectionValue,
  calculateCardValue,
  getUnitPrice,
  // Most valuable cards
  getMostValuableCards,
  getMostValuableCard,
  filterCardsWithPricing,
  filterCardsWithoutPricing,
  // Value by set
  groupCollectionBySet,
  calculateValueBySet,
  getMostValuableSet,
  // Statistics
  calculateAverageCardValue,
  calculateMedianCardValue,
  calculatePricingCoverage,
  getPriceRange,
  // Price tiers
  getPriceTier,
  getPriceTierDisplayName,
  countByPriceTier,
  getCardsAboveValue,
  getCardsBelowValue,
  // Display helpers
  formatCurrency,
  formatValueSummary,
  getValueMessage,
  formatMostValuableCard,
} from '../collectionValue';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createPricedCard(
  cardId: string,
  name: string,
  price: number | null,
  setId?: string
): PricedCard {
  return {
    cardId,
    name,
    imageSmall: `https://example.com/${cardId}.png`,
    priceMarket: price,
    setId: setId ?? cardId.split('-')[0],
  };
}

function createCollectionCard(
  cardId: string,
  quantity = 1,
  variant: string = 'normal'
): CollectionCardWithVariant {
  return { cardId, quantity, variant };
}

function createSamplePricedCards(): PricedCard[] {
  return [
    createPricedCard('sv1-1', 'Bulbasaur', 0.5),
    createPricedCard('sv1-25', 'Pikachu', 2.5),
    createPricedCard('sv1-50', 'Charizard ex', 45.0),
    createPricedCard('sv2-10', 'Squirtle', 0.25),
    createPricedCard('sv2-100', 'Mewtwo V', 15.0),
    createPricedCard('sv3-1', 'Eevee', null), // No price
  ];
}

function createSampleCollection(): CollectionCardWithVariant[] {
  return [
    createCollectionCard('sv1-1', 3, 'normal'),
    createCollectionCard('sv1-25', 2, 'holofoil'),
    createCollectionCard('sv1-50', 1, 'normal'),
    createCollectionCard('sv2-10', 5, 'normal'),
    createCollectionCard('sv2-100', 2, 'reverseHolofoil'),
    createCollectionCard('sv3-1', 4, 'normal'), // No price for this card
  ];
}

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Constants', () => {
  it('should have correct minimum price threshold', () => {
    expect(MIN_PRICE_THRESHOLD).toBe(0);
  });

  it('should have correct default top cards limit', () => {
    expect(DEFAULT_TOP_CARDS_LIMIT).toBe(10);
  });

  it('should have correct price tier thresholds', () => {
    expect(PRICE_TIERS.BULK).toBe(0.5);
    expect(PRICE_TIERS.COMMON).toBe(2);
    expect(PRICE_TIERS.VALUABLE).toBe(10);
    expect(PRICE_TIERS.CHASE).toBe(50);
  });
});

// ============================================================================
// PRICE VALIDATION TESTS
// ============================================================================

describe('Price Validation', () => {
  describe('isValidPrice', () => {
    it('should return true for positive numbers', () => {
      expect(isValidPrice(1)).toBe(true);
      expect(isValidPrice(0.01)).toBe(true);
      expect(isValidPrice(100.5)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(isValidPrice(0)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(isValidPrice(-1)).toBe(false);
      expect(isValidPrice(-0.01)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isValidPrice('1.00')).toBe(false);
      expect(isValidPrice(null)).toBe(false);
      expect(isValidPrice(undefined)).toBe(false);
      expect(isValidPrice(NaN)).toBe(false);
    });
  });

  describe('parsePrice', () => {
    it('should return number for valid numeric prices', () => {
      expect(parsePrice(1.5)).toBe(1.5);
      expect(parsePrice(100)).toBe(100);
    });

    it('should parse valid string prices', () => {
      expect(parsePrice('1.50')).toBe(1.5);
      expect(parsePrice('100')).toBe(100);
    });

    it('should return null for invalid prices', () => {
      expect(parsePrice(null)).toBeNull();
      expect(parsePrice(undefined)).toBeNull();
      expect(parsePrice('')).toBeNull();
      expect(parsePrice('invalid')).toBeNull();
      expect(parsePrice(0)).toBeNull();
      expect(parsePrice(-1)).toBeNull();
      expect(parsePrice('0')).toBeNull();
    });
  });

  describe('roundToCents', () => {
    it('should round to 2 decimal places', () => {
      expect(roundToCents(1.234)).toBe(1.23);
      expect(roundToCents(1.235)).toBe(1.24);
      expect(roundToCents(1.999)).toBe(2);
    });

    it('should handle whole numbers', () => {
      expect(roundToCents(100)).toBe(100);
    });
  });
});

// ============================================================================
// PRICE MAP BUILDING TESTS
// ============================================================================

describe('Price Map Building', () => {
  describe('buildPriceMap', () => {
    it('should build map from priced cards', () => {
      const pricedCards = createSamplePricedCards();
      const priceMap = buildPriceMap(pricedCards);

      expect(priceMap.get('sv1-1')).toBe(0.5);
      expect(priceMap.get('sv1-25')).toBe(2.5);
      expect(priceMap.get('sv1-50')).toBe(45.0);
    });

    it('should exclude cards with null/undefined prices', () => {
      const pricedCards = createSamplePricedCards();
      const priceMap = buildPriceMap(pricedCards);

      expect(priceMap.has('sv3-1')).toBe(false);
    });

    it('should return empty map for empty array', () => {
      const priceMap = buildPriceMap([]);
      expect(priceMap.size).toBe(0);
    });

    it('should exclude zero prices', () => {
      const cards = [createPricedCard('test-1', 'Test Card', 0)];
      const priceMap = buildPriceMap(cards);
      expect(priceMap.has('test-1')).toBe(false);
    });
  });

  describe('buildCardDataMap', () => {
    it('should build map with price and card data', () => {
      const pricedCards = createSamplePricedCards();
      const cardDataMap = buildCardDataMap(pricedCards);

      const charizard = cardDataMap.get('sv1-50');
      expect(charizard).toBeDefined();
      expect(charizard?.price).toBe(45.0);
      expect(charizard?.name).toBe('Charizard ex');
      expect(charizard?.imageSmall).toBe('https://example.com/sv1-50.png');
    });

    it('should exclude cards without valid prices', () => {
      const pricedCards = createSamplePricedCards();
      const cardDataMap = buildCardDataMap(pricedCards);

      expect(cardDataMap.has('sv3-1')).toBe(false);
    });
  });
});

// ============================================================================
// VALUE CALCULATION TESTS
// ============================================================================

describe('Value Calculation', () => {
  describe('calculateCollectionValue', () => {
    it('should calculate total value correctly', () => {
      const collection = createSampleCollection();
      const priceMap = buildPriceMap(createSamplePricedCards());

      const result = calculateCollectionValue(collection, priceMap);

      // sv1-1: 3 * 0.5 = 1.5
      // sv1-25: 2 * 2.5 = 5.0
      // sv1-50: 1 * 45.0 = 45.0
      // sv2-10: 5 * 0.25 = 1.25
      // sv2-100: 2 * 15.0 = 30.0
      // Total: 82.75
      expect(result.totalValue).toBe(82.75);
    });

    it('should count valued and unvalued cards', () => {
      const collection = createSampleCollection();
      const priceMap = buildPriceMap(createSamplePricedCards());

      const result = calculateCollectionValue(collection, priceMap);

      expect(result.valuedCardsCount).toBe(5); // 5 cards have prices
      expect(result.unvaluedCardsCount).toBe(1); // sv3-1 has no price
      expect(result.totalCardsCount).toBe(6);
    });

    it('should return zeros for empty collection', () => {
      const priceMap = buildPriceMap(createSamplePricedCards());
      const result = calculateCollectionValue([], priceMap);

      expect(result.totalValue).toBe(0);
      expect(result.valuedCardsCount).toBe(0);
      expect(result.unvaluedCardsCount).toBe(0);
      expect(result.totalCardsCount).toBe(0);
    });

    it('should return zeros when no prices available', () => {
      const collection = createSampleCollection();
      const emptyPriceMap = new Map<string, number>();

      const result = calculateCollectionValue(collection, emptyPriceMap);

      expect(result.totalValue).toBe(0);
      expect(result.valuedCardsCount).toBe(0);
      expect(result.unvaluedCardsCount).toBe(6);
    });
  });

  describe('calculateCardValue', () => {
    it('should calculate single card value', () => {
      const priceMap = buildPriceMap(createSamplePricedCards());

      expect(calculateCardValue('sv1-50', 2, priceMap)).toBe(90.0);
      expect(calculateCardValue('sv1-1', 4, priceMap)).toBe(2.0);
    });

    it('should return null for unpriced card', () => {
      const priceMap = buildPriceMap(createSamplePricedCards());
      expect(calculateCardValue('sv3-1', 1, priceMap)).toBeNull();
    });
  });

  describe('getUnitPrice', () => {
    it('should return unit price for priced card', () => {
      const priceMap = buildPriceMap(createSamplePricedCards());
      expect(getUnitPrice('sv1-50', priceMap)).toBe(45.0);
    });

    it('should return null for unpriced card', () => {
      const priceMap = buildPriceMap(createSamplePricedCards());
      expect(getUnitPrice('sv3-1', priceMap)).toBeNull();
    });
  });
});

// ============================================================================
// MOST VALUABLE CARDS TESTS
// ============================================================================

describe('Most Valuable Cards', () => {
  describe('getMostValuableCards', () => {
    it('should return cards sorted by total value descending', () => {
      const collection = createSampleCollection();
      const cardDataMap = buildCardDataMap(createSamplePricedCards());

      const topCards = getMostValuableCards(collection, cardDataMap, 5);

      expect(topCards[0].cardId).toBe('sv1-50'); // 45.0
      expect(topCards[1].cardId).toBe('sv2-100'); // 30.0
      expect(topCards[2].cardId).toBe('sv1-25'); // 5.0
    });

    it('should respect limit parameter', () => {
      const collection = createSampleCollection();
      const cardDataMap = buildCardDataMap(createSamplePricedCards());

      const topCards = getMostValuableCards(collection, cardDataMap, 2);

      expect(topCards).toHaveLength(2);
    });

    it('should exclude cards without prices', () => {
      const collection = createSampleCollection();
      const cardDataMap = buildCardDataMap(createSamplePricedCards());

      const topCards = getMostValuableCards(collection, cardDataMap);

      expect(topCards.find((c) => c.cardId === 'sv3-1')).toBeUndefined();
    });

    it('should include card details', () => {
      const collection = [createCollectionCard('sv1-50', 1)];
      const cardDataMap = buildCardDataMap(createSamplePricedCards());

      const topCards = getMostValuableCards(collection, cardDataMap);

      expect(topCards[0].name).toBe('Charizard ex');
      expect(topCards[0].unitPrice).toBe(45.0);
      expect(topCards[0].totalValue).toBe(45.0);
      expect(topCards[0].variant).toBe('normal');
    });
  });

  describe('getMostValuableCard', () => {
    it('should return the single most valuable card', () => {
      const collection = createSampleCollection();
      const cardDataMap = buildCardDataMap(createSamplePricedCards());

      const topCard = getMostValuableCard(collection, cardDataMap);

      expect(topCard).not.toBeNull();
      expect(topCard?.cardId).toBe('sv1-50');
    });

    it('should return null for empty collection', () => {
      const cardDataMap = buildCardDataMap(createSamplePricedCards());
      const topCard = getMostValuableCard([], cardDataMap);

      expect(topCard).toBeNull();
    });
  });

  describe('filterCardsWithPricing', () => {
    it('should filter to only cards with prices', () => {
      const collection = createSampleCollection();
      const priceMap = buildPriceMap(createSamplePricedCards());

      const filtered = filterCardsWithPricing(collection, priceMap);

      expect(filtered).toHaveLength(5);
      expect(filtered.find((c) => c.cardId === 'sv3-1')).toBeUndefined();
    });
  });

  describe('filterCardsWithoutPricing', () => {
    it('should filter to only cards without prices', () => {
      const collection = createSampleCollection();
      const priceMap = buildPriceMap(createSamplePricedCards());

      const filtered = filterCardsWithoutPricing(collection, priceMap);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].cardId).toBe('sv3-1');
    });
  });
});

// ============================================================================
// VALUE BY SET TESTS
// ============================================================================

describe('Value By Set', () => {
  describe('groupCollectionBySet', () => {
    it('should group cards by set ID', () => {
      const collection = createSampleCollection();
      const grouped = groupCollectionBySet(collection);

      expect(grouped.get('sv1')).toHaveLength(3);
      expect(grouped.get('sv2')).toHaveLength(2);
      expect(grouped.get('sv3')).toHaveLength(1);
    });

    it('should return empty map for empty collection', () => {
      const grouped = groupCollectionBySet([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe('calculateValueBySet', () => {
    it('should calculate value breakdown by set', () => {
      const collection = createSampleCollection();
      const priceMap = buildPriceMap(createSamplePricedCards());

      const setValues = calculateValueBySet(collection, priceMap);

      // sv1 total: 1.5 + 5.0 + 45.0 = 51.5
      const sv1 = setValues.find((s) => s.setId === 'sv1');
      expect(sv1?.totalValue).toBe(51.5);
      expect(sv1?.cardCount).toBe(3);

      // sv2 total: 1.25 + 30.0 = 31.25
      const sv2 = setValues.find((s) => s.setId === 'sv2');
      expect(sv2?.totalValue).toBe(31.25);
    });

    it('should sort by value descending', () => {
      const collection = createSampleCollection();
      const priceMap = buildPriceMap(createSamplePricedCards());

      const setValues = calculateValueBySet(collection, priceMap);

      expect(setValues[0].setId).toBe('sv1'); // Highest value
      expect(setValues[1].setId).toBe('sv2');
    });

    it('should use set names from map', () => {
      const collection = [createCollectionCard('sv1-1', 1)];
      const priceMap = buildPriceMap(createSamplePricedCards());
      const setNameMap = new Map([['sv1', 'Scarlet & Violet']]);

      const setValues = calculateValueBySet(collection, priceMap, setNameMap);

      expect(setValues[0].setName).toBe('Scarlet & Violet');
    });
  });

  describe('getMostValuableSet', () => {
    it('should return the most valuable set', () => {
      const collection = createSampleCollection();
      const priceMap = buildPriceMap(createSamplePricedCards());

      const topSet = getMostValuableSet(collection, priceMap);

      expect(topSet).not.toBeNull();
      expect(topSet?.setId).toBe('sv1');
    });

    it('should return null for empty collection', () => {
      const priceMap = buildPriceMap(createSamplePricedCards());
      const topSet = getMostValuableSet([], priceMap);

      expect(topSet).toBeNull();
    });
  });
});

// ============================================================================
// STATISTICS TESTS
// ============================================================================

describe('Statistics', () => {
  describe('calculateAverageCardValue', () => {
    it('should calculate average value of priced cards', () => {
      const collection = createSampleCollection();
      const priceMap = buildPriceMap(createSamplePricedCards());

      const avg = calculateAverageCardValue(collection, priceMap);

      // Total: 82.75, Valued cards: 5
      // Average: 82.75 / 5 = 16.55
      expect(avg).toBe(16.55);
    });

    it('should return null when no priced cards', () => {
      const collection = [createCollectionCard('sv3-1', 1)];
      const priceMap = buildPriceMap(createSamplePricedCards());

      const avg = calculateAverageCardValue(collection, priceMap);

      expect(avg).toBeNull();
    });
  });

  describe('calculateMedianCardValue', () => {
    it('should calculate median value (odd count)', () => {
      const collection = [
        createCollectionCard('sv1-1', 1), // 0.5
        createCollectionCard('sv1-25', 1), // 2.5
        createCollectionCard('sv1-50', 1), // 45.0
      ];
      const priceMap = buildPriceMap(createSamplePricedCards());

      const median = calculateMedianCardValue(collection, priceMap);

      expect(median).toBe(2.5);
    });

    it('should calculate median value (even count)', () => {
      const collection = [
        createCollectionCard('sv1-1', 1), // 0.5
        createCollectionCard('sv1-25', 1), // 2.5
        createCollectionCard('sv2-10', 1), // 0.25
        createCollectionCard('sv2-100', 1), // 15.0
      ];
      const priceMap = buildPriceMap(createSamplePricedCards());

      const median = calculateMedianCardValue(collection, priceMap);

      // Sorted: 0.25, 0.5, 2.5, 15.0
      // Median: (0.5 + 2.5) / 2 = 1.5
      expect(median).toBe(1.5);
    });

    it('should consider quantity in median', () => {
      const collection = [
        createCollectionCard('sv1-1', 3), // 0.5, 0.5, 0.5
        createCollectionCard('sv1-50', 1), // 45.0
      ];
      const priceMap = buildPriceMap(createSamplePricedCards());

      const median = calculateMedianCardValue(collection, priceMap);

      // Values: [0.5, 0.5, 0.5, 45.0]
      // Median: (0.5 + 0.5) / 2 = 0.5
      expect(median).toBe(0.5);
    });

    it('should return null for empty collection', () => {
      const priceMap = buildPriceMap(createSamplePricedCards());
      const median = calculateMedianCardValue([], priceMap);

      expect(median).toBeNull();
    });
  });

  describe('calculatePricingCoverage', () => {
    it('should calculate percentage of cards with prices', () => {
      const collection = createSampleCollection();
      const priceMap = buildPriceMap(createSamplePricedCards());

      const coverage = calculatePricingCoverage(collection, priceMap);

      // 5 out of 6 = 83.33%
      expect(coverage).toBe(83.33);
    });

    it('should return 0 for empty collection', () => {
      const priceMap = buildPriceMap(createSamplePricedCards());
      const coverage = calculatePricingCoverage([], priceMap);

      expect(coverage).toBe(0);
    });
  });

  describe('getPriceRange', () => {
    it('should return min and max prices', () => {
      const collection = createSampleCollection();
      const priceMap = buildPriceMap(createSamplePricedCards());

      const range = getPriceRange(collection, priceMap);

      expect(range?.min).toBe(0.25); // sv2-10
      expect(range?.max).toBe(45.0); // sv1-50
    });

    it('should return null for collection with no priced cards', () => {
      const collection = [createCollectionCard('sv3-1', 1)];
      const priceMap = buildPriceMap(createSamplePricedCards());

      const range = getPriceRange(collection, priceMap);

      expect(range).toBeNull();
    });
  });
});

// ============================================================================
// PRICE TIER TESTS
// ============================================================================

describe('Price Tiers', () => {
  describe('getPriceTier', () => {
    it('should categorize bulk cards', () => {
      expect(getPriceTier(0.1)).toBe('bulk');
      expect(getPriceTier(0.49)).toBe('bulk');
    });

    it('should categorize common cards', () => {
      expect(getPriceTier(0.5)).toBe('common');
      expect(getPriceTier(1.99)).toBe('common');
    });

    it('should categorize valuable cards', () => {
      expect(getPriceTier(2.0)).toBe('valuable');
      expect(getPriceTier(9.99)).toBe('valuable');
    });

    it('should categorize chase cards', () => {
      expect(getPriceTier(10.0)).toBe('chase');
      expect(getPriceTier(49.99)).toBe('chase');
    });

    it('should categorize premium cards', () => {
      expect(getPriceTier(50.0)).toBe('premium');
      expect(getPriceTier(500.0)).toBe('premium');
    });
  });

  describe('getPriceTierDisplayName', () => {
    it('should return display names for all tiers', () => {
      expect(getPriceTierDisplayName('bulk')).toBe('Bulk');
      expect(getPriceTierDisplayName('common')).toBe('Common Value');
      expect(getPriceTierDisplayName('valuable')).toBe('Valuable');
      expect(getPriceTierDisplayName('chase')).toBe('Chase Card');
      expect(getPriceTierDisplayName('premium')).toBe('Premium');
    });
  });

  describe('countByPriceTier', () => {
    it('should count cards by price tier', () => {
      const collection = createSampleCollection();
      const priceMap = buildPriceMap(createSamplePricedCards());

      const counts = countByPriceTier(collection, priceMap);

      expect(counts.bulk).toBe(5); // sv2-10 (5x 0.25)
      expect(counts.common).toBe(3); // sv1-1 (3x 0.5)
      expect(counts.valuable).toBe(2); // sv1-25 (2x 2.5)
      expect(counts.chase).toBe(3); // sv2-100 (2x 15.0) + sv1-50 (1x 45.0)
      expect(counts.premium).toBe(0);
    });
  });

  describe('getCardsAboveValue', () => {
    it('should filter cards above threshold', () => {
      const collection = createSampleCollection();
      const priceMap = buildPriceMap(createSamplePricedCards());

      const expensive = getCardsAboveValue(collection, priceMap, 10.0);

      expect(expensive).toHaveLength(2); // sv1-50 and sv2-100
    });
  });

  describe('getCardsBelowValue', () => {
    it('should filter cards below threshold', () => {
      const collection = createSampleCollection();
      const priceMap = buildPriceMap(createSamplePricedCards());

      const cheap = getCardsBelowValue(collection, priceMap, 1.0);

      expect(cheap).toHaveLength(2); // sv1-1 and sv2-10
    });
  });
});

// ============================================================================
// DISPLAY HELPER TESTS
// ============================================================================

describe('Display Helpers', () => {
  describe('formatCurrency', () => {
    it('should format values as USD', () => {
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(1.5)).toBe('$1.50');
      expect(formatCurrency(0.01)).toBe('$0.01');
    });

    it('should handle large values', () => {
      expect(formatCurrency(1000.99)).toBe('$1,000.99');
    });
  });

  describe('formatValueSummary', () => {
    it('should format summary with value and coverage', () => {
      const result: CollectionValueResult = {
        totalValue: 82.75,
        valuedCardsCount: 5,
        unvaluedCardsCount: 1,
        totalCardsCount: 6,
      };

      const summary = formatValueSummary(result);

      expect(summary).toContain('$82.75');
      expect(summary).toContain('5/6');
      expect(summary).toContain('83.33%');
    });

    it('should handle empty collection', () => {
      const result: CollectionValueResult = {
        totalValue: 0,
        valuedCardsCount: 0,
        unvaluedCardsCount: 0,
        totalCardsCount: 0,
      };

      const summary = formatValueSummary(result);

      expect(summary).toBe('No cards in collection');
    });

    it('should handle collection with no pricing data', () => {
      const result: CollectionValueResult = {
        totalValue: 0,
        valuedCardsCount: 0,
        unvaluedCardsCount: 5,
        totalCardsCount: 5,
      };

      const summary = formatValueSummary(result);

      expect(summary).toContain('5 cards');
      expect(summary).toContain('no pricing data');
    });
  });

  describe('getValueMessage', () => {
    it('should return appropriate messages for different values', () => {
      expect(getValueMessage(0)).toBe('Start collecting to build value!');
      expect(getValueMessage(5)).toBe("You're getting started!");
      expect(getValueMessage(25)).toBe('Nice collection building up!');
      expect(getValueMessage(75)).toBe('Impressive collection value!');
      expect(getValueMessage(250)).toBe('Serious collector status!');
      expect(getValueMessage(750)).toBe('Amazing collection!');
      expect(getValueMessage(5000)).toBe('Legendary collection value!');
    });
  });

  describe('formatMostValuableCard', () => {
    it('should format card details', () => {
      const card: ValuedCard = {
        cardId: 'sv1-50',
        name: 'Charizard ex',
        imageSmall: 'https://example.com/sv1-50.png',
        variant: 'holofoil',
        quantity: 2,
        unitPrice: 45.0,
        totalValue: 90.0,
      };

      const formatted = formatMostValuableCard(card);

      expect(formatted).toContain('Charizard ex');
      expect(formatted).toContain('$90.00');
      expect(formatted).toContain('2x');
      expect(formatted).toContain('$45.00');
    });

    it('should handle null card', () => {
      const formatted = formatMostValuableCard(null);
      expect(formatted).toBe('No valued cards found');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration: Collection Value Analysis', () => {
  it('should perform complete collection value analysis', () => {
    // Set up collection
    const collection = createSampleCollection();
    const pricedCards = createSamplePricedCards();

    // Build lookup maps
    const priceMap = buildPriceMap(pricedCards);
    const cardDataMap = buildCardDataMap(pricedCards);

    // Calculate total value
    const valueResult = calculateCollectionValue(collection, priceMap);
    expect(valueResult.totalValue).toBe(82.75);
    expect(valueResult.valuedCardsCount).toBe(5);

    // Get most valuable cards
    const topCards = getMostValuableCards(collection, cardDataMap, 3);
    expect(topCards[0].name).toBe('Charizard ex');
    expect(topCards[1].name).toBe('Mewtwo V');

    // Get value by set
    const setValues = calculateValueBySet(collection, priceMap);
    expect(setValues[0].setId).toBe('sv1');

    // Get statistics
    const avgValue = calculateAverageCardValue(collection, priceMap);
    const medianValue = calculateMedianCardValue(collection, priceMap);
    const coverage = calculatePricingCoverage(collection, priceMap);

    expect(avgValue).toBeGreaterThan(0);
    expect(medianValue).toBeGreaterThan(0);
    expect(coverage).toBeGreaterThan(80);

    // Format for display
    const summary = formatValueSummary(valueResult);
    expect(summary).toContain('$82.75');

    const message = getValueMessage(valueResult.totalValue);
    expect(message).toBe('Impressive collection value!');
  });

  it('should handle collection with no priced cards', () => {
    const collection = [createCollectionCard('unknown-1', 5), createCollectionCard('unknown-2', 3)];
    const priceMap = new Map<string, number>();
    const cardDataMap = new Map<string, { price: number; name: string; imageSmall: string }>();

    const valueResult = calculateCollectionValue(collection, priceMap);
    expect(valueResult.totalValue).toBe(0);
    expect(valueResult.unvaluedCardsCount).toBe(2);

    const topCards = getMostValuableCards(collection, cardDataMap);
    expect(topCards).toHaveLength(0);

    const avgValue = calculateAverageCardValue(collection, priceMap);
    expect(avgValue).toBeNull();

    const summary = formatValueSummary(valueResult);
    expect(summary).toContain('no pricing data');
  });

  it('should correctly calculate value for quantity > 1', () => {
    const collection = [createCollectionCard('sv1-50', 10, 'holofoil')]; // 10x Charizard ex
    const pricedCards = [createPricedCard('sv1-50', 'Charizard ex', 45.0)];

    const priceMap = buildPriceMap(pricedCards);
    const valueResult = calculateCollectionValue(collection, priceMap);

    expect(valueResult.totalValue).toBe(450.0);
  });
});

describe('Integration: Price Tier Analysis', () => {
  it('should analyze collection by price tiers', () => {
    const collection = [
      createCollectionCard('bulk-1', 10), // Bulk cards
      createCollectionCard('common-1', 5), // Common value
      createCollectionCard('valuable-1', 3), // Valuable
      createCollectionCard('chase-1', 2), // Chase cards
      createCollectionCard('premium-1', 1), // Premium
    ];

    const priceMap = new Map<string, number>([
      ['bulk-1', 0.1],
      ['common-1', 1.0],
      ['valuable-1', 5.0],
      ['chase-1', 25.0],
      ['premium-1', 100.0],
    ]);

    const tierCounts = countByPriceTier(collection, priceMap);

    expect(tierCounts.bulk).toBe(10);
    expect(tierCounts.common).toBe(5);
    expect(tierCounts.valuable).toBe(3);
    expect(tierCounts.chase).toBe(2);
    expect(tierCounts.premium).toBe(1);

    // Total value: (10*0.1) + (5*1) + (3*5) + (2*25) + (1*100) = 1 + 5 + 15 + 50 + 100 = 171
    const valueResult = calculateCollectionValue(collection, priceMap);
    expect(valueResult.totalValue).toBe(171);
  });
});
