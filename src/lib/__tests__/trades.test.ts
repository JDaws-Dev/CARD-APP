import { describe, it, expect } from 'vitest';
import {
  // Types
  TradeCardEntry,
  CollectionEntry,
  TradeSummary,
  // Constants
  DEFAULT_TRADE_VARIANT,
  MAX_TRADE_CARDS,
  MAX_CARD_QUANTITY,
  MAX_TRADING_PARTNER_LENGTH,
  // Validation functions
  validateTradeCard,
  validateTradingPartner,
  checkCardOwnership,
  validateTrade,
  findDuplicateTradeCards,
  normalizeTradeCards,
  // Collection update functions
  removeCardsFromCollection,
  addCardsToCollection,
  simulateTrade,
  // Summary functions
  calculateTotalQuantity,
  calculateUniqueCards,
  createTradeSummary,
  createTradeActivityMetadata,
  // Formatting functions
  formatTradeCard,
  formatVariant,
  formatTradeSummary,
  getTradeDescription,
  formatNetChange,
} from '../trades';
import type { CardVariant } from '../collections';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createTradeCard(
  cardId: string,
  quantity = 1,
  variant?: CardVariant,
  cardName?: string,
  setName?: string
): TradeCardEntry {
  return { cardId, quantity, variant, cardName, setName };
}

function createCollectionEntry(
  cardId: string,
  quantity = 1,
  variant: CardVariant = 'normal'
): CollectionEntry {
  return { cardId, quantity, variant };
}

function createSampleCollection(): CollectionEntry[] {
  return [
    createCollectionEntry('sv1-1', 3, 'normal'),
    createCollectionEntry('sv1-1', 1, 'holofoil'),
    createCollectionEntry('sv1-25', 2, 'reverseHolofoil'),
    createCollectionEntry('sv2-10', 1, 'normal'),
    createCollectionEntry('sv2-50', 4, 'holofoil'),
  ];
}

// ============================================================================
// CONSTANTS
// ============================================================================

describe('Trade Constants', () => {
  it('should have correct default trade variant', () => {
    expect(DEFAULT_TRADE_VARIANT).toBe('normal');
  });

  it('should have reasonable max trade cards limit', () => {
    expect(MAX_TRADE_CARDS).toBe(100);
    expect(MAX_TRADE_CARDS).toBeGreaterThan(0);
  });

  it('should have reasonable max card quantity', () => {
    expect(MAX_CARD_QUANTITY).toBe(99);
    expect(MAX_CARD_QUANTITY).toBeGreaterThan(0);
  });

  it('should have reasonable max trading partner name length', () => {
    expect(MAX_TRADING_PARTNER_LENGTH).toBe(100);
    expect(MAX_TRADING_PARTNER_LENGTH).toBeGreaterThan(10);
  });
});

// ============================================================================
// VALIDATION FUNCTIONS - validateTradeCard
// ============================================================================

describe('validateTradeCard', () => {
  describe('valid cards', () => {
    it('should validate a basic trade card', () => {
      const card = createTradeCard('sv1-1', 1, 'normal');
      const result = validateTradeCard(card);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate card with all optional fields', () => {
      const card = createTradeCard('sv1-1', 2, 'holofoil', 'Pikachu', 'Scarlet & Violet');
      const result = validateTradeCard(card);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate card without variant (defaults to normal)', () => {
      const card = createTradeCard('sv1-1', 1);
      const result = validateTradeCard(card);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate all variant types', () => {
      const variants: CardVariant[] = [
        'normal',
        'holofoil',
        'reverseHolofoil',
        '1stEditionHolofoil',
        '1stEditionNormal',
      ];

      for (const variant of variants) {
        const card = createTradeCard('sv1-1', 1, variant);
        const result = validateTradeCard(card);
        expect(result.valid).toBe(true);
      }
    });

    it('should validate various quantity values', () => {
      expect(validateTradeCard(createTradeCard('sv1-1', 1)).valid).toBe(true);
      expect(validateTradeCard(createTradeCard('sv1-1', 10)).valid).toBe(true);
      expect(validateTradeCard(createTradeCard('sv1-1', 50)).valid).toBe(true);
      expect(validateTradeCard(createTradeCard('sv1-1', MAX_CARD_QUANTITY)).valid).toBe(true);
    });
  });

  describe('invalid card ID', () => {
    it('should reject empty card ID', () => {
      const card = createTradeCard('', 1);
      const result = validateTradeCard(card);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Card ID is required');
    });

    it('should reject invalid card ID format (no dash)', () => {
      const card = createTradeCard('sv1', 1);
      const result = validateTradeCard(card);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid card ID format'))).toBe(true);
    });

    it('should reject invalid card ID format (ends with dash)', () => {
      const card = createTradeCard('sv1-', 1);
      const result = validateTradeCard(card);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid card ID format'))).toBe(true);
    });
  });

  describe('invalid quantity', () => {
    it('should reject zero quantity', () => {
      const card = createTradeCard('sv1-1', 0);
      const result = validateTradeCard(card);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid quantity'))).toBe(true);
    });

    it('should reject negative quantity', () => {
      const card = createTradeCard('sv1-1', -1);
      const result = validateTradeCard(card);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid quantity'))).toBe(true);
    });

    it('should reject decimal quantity', () => {
      const card = createTradeCard('sv1-1', 1.5);
      const result = validateTradeCard(card);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid quantity'))).toBe(true);
    });

    it('should reject quantity exceeding maximum', () => {
      const card = createTradeCard('sv1-1', MAX_CARD_QUANTITY + 1);
      const result = validateTradeCard(card);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('exceeds maximum'))).toBe(true);
    });
  });

  describe('invalid variant', () => {
    it('should reject invalid variant string', () => {
      const card = { cardId: 'sv1-1', quantity: 1, variant: 'invalid' as CardVariant };
      const result = validateTradeCard(card);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid variant'))).toBe(true);
    });
  });

  describe('null/undefined handling', () => {
    it('should reject null card', () => {
      // @ts-expect-error - testing invalid input
      const result = validateTradeCard(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Card entry is required');
    });

    it('should reject undefined card', () => {
      // @ts-expect-error - testing invalid input
      const result = validateTradeCard(undefined);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Card entry is required');
    });
  });
});

// ============================================================================
// VALIDATION FUNCTIONS - validateTradingPartner
// ============================================================================

describe('validateTradingPartner', () => {
  it('should accept valid trading partner name', () => {
    const result = validateTradingPartner('My brother');

    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('My brother');
    expect(result.error).toBeUndefined();
  });

  it('should trim whitespace from partner name', () => {
    const result = validateTradingPartner('  Friend at school  ');

    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('Friend at school');
  });

  it('should accept null partner (optional)', () => {
    const result = validateTradingPartner(null);

    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(null);
  });

  it('should accept undefined partner (optional)', () => {
    const result = validateTradingPartner(undefined);

    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(null);
  });

  it('should convert empty string to null', () => {
    const result = validateTradingPartner('');

    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(null);
  });

  it('should convert whitespace-only string to null', () => {
    const result = validateTradingPartner('   ');

    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(null);
  });

  it('should reject name exceeding max length', () => {
    const longName = 'A'.repeat(MAX_TRADING_PARTNER_LENGTH + 1);
    const result = validateTradingPartner(longName);

    expect(result.valid).toBe(false);
    expect(result.sanitized).toBe(null);
    expect(result.error).toContain('exceeds max length');
  });

  it('should accept name at exactly max length', () => {
    const maxName = 'A'.repeat(MAX_TRADING_PARTNER_LENGTH);
    const result = validateTradingPartner(maxName);

    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(maxName);
  });
});

// ============================================================================
// VALIDATION FUNCTIONS - checkCardOwnership
// ============================================================================

describe('checkCardOwnership', () => {
  const collection = createSampleCollection();

  describe('card exists with sufficient quantity', () => {
    it('should confirm ownership when card exists', () => {
      const result = checkCardOwnership('sv1-1', 1, 'normal', collection);

      expect(result.hasCard).toBe(true);
      expect(result.hasSufficientQuantity).toBe(true);
      expect(result.availableQuantity).toBe(3);
      expect(result.requestedQuantity).toBe(1);
      expect(result.error).toBeUndefined();
    });

    it('should confirm ownership for exact quantity match', () => {
      const result = checkCardOwnership('sv1-1', 3, 'normal', collection);

      expect(result.hasCard).toBe(true);
      expect(result.hasSufficientQuantity).toBe(true);
      expect(result.availableQuantity).toBe(3);
    });

    it('should check correct variant', () => {
      const result = checkCardOwnership('sv1-1', 1, 'holofoil', collection);

      expect(result.hasCard).toBe(true);
      expect(result.availableQuantity).toBe(1);
    });
  });

  describe('card exists with insufficient quantity', () => {
    it('should report insufficient quantity', () => {
      const result = checkCardOwnership('sv1-1', 5, 'normal', collection);

      expect(result.hasCard).toBe(true);
      expect(result.hasSufficientQuantity).toBe(false);
      expect(result.availableQuantity).toBe(3);
      expect(result.requestedQuantity).toBe(5);
      expect(result.error).toContain('Insufficient quantity');
    });
  });

  describe('card does not exist', () => {
    it('should report card not found', () => {
      const result = checkCardOwnership('sv3-999', 1, 'normal', collection);

      expect(result.hasCard).toBe(false);
      expect(result.hasSufficientQuantity).toBe(false);
      expect(result.availableQuantity).toBe(0);
      expect(result.error).toContain('not in collection');
    });

    it('should report wrong variant not found', () => {
      // sv1-1 exists in normal and holofoil, but not reverseHolofoil
      const result = checkCardOwnership('sv1-1', 1, 'reverseHolofoil', collection);

      expect(result.hasCard).toBe(false);
      expect(result.error).toContain('not in collection');
    });
  });

  describe('empty collection', () => {
    it('should report card not found in empty collection', () => {
      const result = checkCardOwnership('sv1-1', 1, 'normal', []);

      expect(result.hasCard).toBe(false);
      expect(result.error).toContain('not in collection');
    });
  });
});

// ============================================================================
// VALIDATION FUNCTIONS - validateTrade
// ============================================================================

describe('validateTrade', () => {
  const collection = createSampleCollection();

  describe('valid trades', () => {
    it('should validate a simple trade', () => {
      const cardsGiven = [createTradeCard('sv1-1', 1, 'normal')];
      const cardsReceived = [createTradeCard('sv3-1', 1, 'normal')];

      const result = validateTrade(cardsGiven, cardsReceived, collection);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate trade with multiple cards', () => {
      const cardsGiven = [
        createTradeCard('sv1-1', 2, 'normal'),
        createTradeCard('sv2-10', 1, 'normal'),
      ];
      const cardsReceived = [
        createTradeCard('sv3-1', 1, 'normal'),
        createTradeCard('sv3-2', 1, 'holofoil'),
      ];

      const result = validateTrade(cardsGiven, cardsReceived, collection);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate trade with trading partner', () => {
      const cardsGiven = [createTradeCard('sv1-1', 1, 'normal')];
      const cardsReceived = [createTradeCard('sv3-1', 1, 'normal')];

      const result = validateTrade(cardsGiven, cardsReceived, collection, 'My friend');

      expect(result.valid).toBe(true);
    });
  });

  describe('empty trade validation', () => {
    it('should reject completely empty trade', () => {
      const result = validateTrade([], [], collection);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Trade must include at least one card given or received');
    });

    it('should allow gift (only receiving)', () => {
      const cardsReceived = [createTradeCard('sv3-1', 1, 'normal')];
      const result = validateTrade([], cardsReceived, collection);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Trade is a gift (no cards given)');
    });

    it('should allow donation (only giving)', () => {
      const cardsGiven = [createTradeCard('sv1-1', 1, 'normal')];
      const result = validateTrade(cardsGiven, [], collection);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Trade is a donation (no cards received)');
    });
  });

  describe('ownership validation', () => {
    it('should reject giving card not in collection', () => {
      const cardsGiven = [createTradeCard('sv999-1', 1, 'normal')];
      const cardsReceived = [createTradeCard('sv3-1', 1, 'normal')];

      const result = validateTrade(cardsGiven, cardsReceived, collection);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('not in collection'))).toBe(true);
    });

    it('should reject giving more than owned', () => {
      const cardsGiven = [createTradeCard('sv1-1', 10, 'normal')]; // Only have 3
      const cardsReceived = [createTradeCard('sv3-1', 1, 'normal')];

      const result = validateTrade(cardsGiven, cardsReceived, collection);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Insufficient quantity'))).toBe(true);
    });

    it('should reject giving wrong variant', () => {
      const cardsGiven = [createTradeCard('sv1-1', 1, 'reverseHolofoil')]; // Have normal and holofoil, not reverseHolofoil
      const cardsReceived = [createTradeCard('sv3-1', 1, 'normal')];

      const result = validateTrade(cardsGiven, cardsReceived, collection);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('not in collection'))).toBe(true);
    });
  });

  describe('card validation in trade', () => {
    it('should reject invalid card in given', () => {
      const cardsGiven = [createTradeCard('invalid', 1, 'normal')];
      const cardsReceived = [createTradeCard('sv3-1', 1, 'normal')];

      const result = validateTrade(cardsGiven, cardsReceived, collection);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid card ID'))).toBe(true);
    });

    it('should reject invalid card in received', () => {
      const cardsGiven = [createTradeCard('sv1-1', 1, 'normal')];
      const cardsReceived = [createTradeCard('invalid', 1, 'normal')];

      const result = validateTrade(cardsGiven, cardsReceived, collection);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid card ID'))).toBe(true);
    });
  });

  describe('limits validation', () => {
    it('should reject too many cards given', () => {
      const cardsGiven = Array.from({ length: MAX_TRADE_CARDS + 1 }, (_, i) =>
        createTradeCard(`sv1-${i + 1}`, 1, 'normal')
      );
      const cardsReceived = [createTradeCard('sv3-1', 1, 'normal')];

      const result = validateTrade(cardsGiven, cardsReceived, collection);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Too many cards given'))).toBe(true);
    });

    it('should reject too many cards received', () => {
      const cardsGiven = [createTradeCard('sv1-1', 1, 'normal')];
      const cardsReceived = Array.from({ length: MAX_TRADE_CARDS + 1 }, (_, i) =>
        createTradeCard(`sv3-${i + 1}`, 1, 'normal')
      );

      const result = validateTrade(cardsGiven, cardsReceived, collection);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Too many cards received'))).toBe(true);
    });
  });
});

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

describe('findDuplicateTradeCards', () => {
  it('should return empty map when no duplicates', () => {
    const cards = [
      createTradeCard('sv1-1', 1, 'normal'),
      createTradeCard('sv1-2', 1, 'normal'),
      createTradeCard('sv1-3', 1, 'holofoil'),
    ];

    const duplicates = findDuplicateTradeCards(cards);

    expect(duplicates.size).toBe(0);
  });

  it('should detect duplicate card entries', () => {
    const cards = [
      createTradeCard('sv1-1', 1, 'normal'),
      createTradeCard('sv1-1', 2, 'normal'), // Duplicate!
      createTradeCard('sv1-2', 1, 'normal'),
    ];

    const duplicates = findDuplicateTradeCards(cards);

    expect(duplicates.size).toBe(1);
    expect(duplicates.has('sv1-1:normal')).toBe(true);
    expect(duplicates.get('sv1-1:normal')).toHaveLength(2);
  });

  it('should not consider different variants as duplicates', () => {
    const cards = [
      createTradeCard('sv1-1', 1, 'normal'),
      createTradeCard('sv1-1', 1, 'holofoil'),
      createTradeCard('sv1-1', 1, 'reverseHolofoil'),
    ];

    const duplicates = findDuplicateTradeCards(cards);

    expect(duplicates.size).toBe(0);
  });

  it('should treat undefined variant as normal', () => {
    const cards = [
      createTradeCard('sv1-1', 1), // No variant = normal
      createTradeCard('sv1-1', 1, 'normal'), // Explicit normal = duplicate!
    ];

    const duplicates = findDuplicateTradeCards(cards);

    expect(duplicates.size).toBe(1);
    expect(duplicates.has('sv1-1:normal')).toBe(true);
  });
});

describe('normalizeTradeCards', () => {
  it('should combine duplicate entries', () => {
    const cards = [createTradeCard('sv1-1', 1, 'normal'), createTradeCard('sv1-1', 2, 'normal')];

    const normalized = normalizeTradeCards(cards);

    expect(normalized).toHaveLength(1);
    expect(normalized[0].quantity).toBe(3);
  });

  it('should preserve different variants', () => {
    const cards = [createTradeCard('sv1-1', 1, 'normal'), createTradeCard('sv1-1', 2, 'holofoil')];

    const normalized = normalizeTradeCards(cards);

    expect(normalized).toHaveLength(2);
  });

  it('should keep first card metadata when combining', () => {
    const cards = [
      createTradeCard('sv1-1', 1, 'normal', 'First Name', 'First Set'),
      createTradeCard('sv1-1', 2, 'normal', 'Second Name', 'Second Set'),
    ];

    const normalized = normalizeTradeCards(cards);

    expect(normalized).toHaveLength(1);
    expect(normalized[0].cardName).toBe('First Name');
    expect(normalized[0].setName).toBe('First Set');
    expect(normalized[0].quantity).toBe(3);
  });

  it('should return empty array for empty input', () => {
    const normalized = normalizeTradeCards([]);
    expect(normalized).toHaveLength(0);
  });
});

// ============================================================================
// COLLECTION UPDATE FUNCTIONS
// ============================================================================

describe('removeCardsFromCollection', () => {
  it('should remove cards completely when quantity matches', () => {
    const collection = [createCollectionEntry('sv1-1', 2, 'normal')];
    const toRemove = [createTradeCard('sv1-1', 2, 'normal')];

    const result = removeCardsFromCollection(collection, toRemove);

    expect(result).toHaveLength(0);
  });

  it('should reduce quantity when removing partial amount', () => {
    const collection = [createCollectionEntry('sv1-1', 5, 'normal')];
    const toRemove = [createTradeCard('sv1-1', 2, 'normal')];

    const result = removeCardsFromCollection(collection, toRemove);

    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(3);
  });

  it('should not modify original collection', () => {
    const collection = [createCollectionEntry('sv1-1', 5, 'normal')];
    const toRemove = [createTradeCard('sv1-1', 2, 'normal')];

    removeCardsFromCollection(collection, toRemove);

    expect(collection[0].quantity).toBe(5); // Original unchanged
  });

  it('should only remove matching variant', () => {
    const collection = [
      createCollectionEntry('sv1-1', 3, 'normal'),
      createCollectionEntry('sv1-1', 2, 'holofoil'),
    ];
    const toRemove = [createTradeCard('sv1-1', 2, 'normal')];

    const result = removeCardsFromCollection(collection, toRemove);

    expect(result).toHaveLength(2);
    expect(result.find((c) => c.variant === 'normal')?.quantity).toBe(1);
    expect(result.find((c) => c.variant === 'holofoil')?.quantity).toBe(2);
  });

  it('should handle card not in collection (no-op)', () => {
    const collection = [createCollectionEntry('sv1-1', 3, 'normal')];
    const toRemove = [createTradeCard('sv1-999', 1, 'normal')];

    const result = removeCardsFromCollection(collection, toRemove);

    expect(result).toEqual(collection);
  });
});

describe('addCardsToCollection', () => {
  it('should add new card to collection', () => {
    const collection = [createCollectionEntry('sv1-1', 2, 'normal')];
    const toAdd = [createTradeCard('sv1-2', 1, 'normal')];

    const result = addCardsToCollection(collection, toAdd);

    expect(result).toHaveLength(2);
    expect(result.find((c) => c.cardId === 'sv1-2')?.quantity).toBe(1);
  });

  it('should increment quantity for existing card', () => {
    const collection = [createCollectionEntry('sv1-1', 2, 'normal')];
    const toAdd = [createTradeCard('sv1-1', 3, 'normal')];

    const result = addCardsToCollection(collection, toAdd);

    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(5);
  });

  it('should not modify original collection', () => {
    const collection = [createCollectionEntry('sv1-1', 2, 'normal')];
    const toAdd = [createTradeCard('sv1-1', 3, 'normal')];

    addCardsToCollection(collection, toAdd);

    expect(collection[0].quantity).toBe(2); // Original unchanged
  });

  it('should add as new entry for different variant', () => {
    const collection = [createCollectionEntry('sv1-1', 2, 'normal')];
    const toAdd = [createTradeCard('sv1-1', 1, 'holofoil')];

    const result = addCardsToCollection(collection, toAdd);

    expect(result).toHaveLength(2);
    expect(result.find((c) => c.variant === 'holofoil')?.quantity).toBe(1);
  });

  it('should default variant to normal if not specified', () => {
    const collection: CollectionEntry[] = [];
    const toAdd = [createTradeCard('sv1-1', 1)]; // No variant

    const result = addCardsToCollection(collection, toAdd);

    expect(result).toHaveLength(1);
    expect(result[0].variant).toBe('normal');
  });
});

describe('simulateTrade', () => {
  it('should execute complete trade', () => {
    const collection = [
      createCollectionEntry('sv1-1', 3, 'normal'),
      createCollectionEntry('sv1-2', 2, 'holofoil'),
    ];
    const cardsGiven = [createTradeCard('sv1-1', 2, 'normal')];
    const cardsReceived = [createTradeCard('sv1-3', 1, 'reverseHolofoil')];

    const result = simulateTrade(collection, cardsGiven, cardsReceived);

    expect(result).toHaveLength(3);
    expect(result.find((c) => c.cardId === 'sv1-1')?.quantity).toBe(1); // 3 - 2 = 1
    expect(result.find((c) => c.cardId === 'sv1-2')?.quantity).toBe(2); // Unchanged
    expect(result.find((c) => c.cardId === 'sv1-3')?.quantity).toBe(1); // New
  });

  it('should handle trading same card (swap variants)', () => {
    const collection = [createCollectionEntry('sv1-1', 2, 'normal')];
    const cardsGiven = [createTradeCard('sv1-1', 1, 'normal')];
    const cardsReceived = [createTradeCard('sv1-1', 1, 'holofoil')];

    const result = simulateTrade(collection, cardsGiven, cardsReceived);

    expect(result).toHaveLength(2);
    expect(result.find((c) => c.variant === 'normal')?.quantity).toBe(1);
    expect(result.find((c) => c.variant === 'holofoil')?.quantity).toBe(1);
  });

  it('should handle gift (only receiving)', () => {
    const collection = [createCollectionEntry('sv1-1', 1, 'normal')];
    const cardsGiven: TradeCardEntry[] = [];
    const cardsReceived = [createTradeCard('sv1-2', 1, 'normal')];

    const result = simulateTrade(collection, cardsGiven, cardsReceived);

    expect(result).toHaveLength(2);
  });

  it('should handle donation (only giving)', () => {
    const collection = [
      createCollectionEntry('sv1-1', 2, 'normal'),
      createCollectionEntry('sv1-2', 1, 'normal'),
    ];
    const cardsGiven = [createTradeCard('sv1-2', 1, 'normal')];
    const cardsReceived: TradeCardEntry[] = [];

    const result = simulateTrade(collection, cardsGiven, cardsReceived);

    expect(result).toHaveLength(1);
    expect(result[0].cardId).toBe('sv1-1');
  });
});

// ============================================================================
// SUMMARY FUNCTIONS
// ============================================================================

describe('calculateTotalQuantity', () => {
  it('should sum all quantities', () => {
    const cards = [
      createTradeCard('sv1-1', 2),
      createTradeCard('sv1-2', 3),
      createTradeCard('sv1-3', 5),
    ];

    expect(calculateTotalQuantity(cards)).toBe(10);
  });

  it('should return 0 for empty array', () => {
    expect(calculateTotalQuantity([])).toBe(0);
  });
});

describe('calculateUniqueCards', () => {
  it('should count unique card IDs', () => {
    const cards = [
      createTradeCard('sv1-1', 2, 'normal'),
      createTradeCard('sv1-1', 1, 'holofoil'), // Same cardId
      createTradeCard('sv1-2', 3, 'normal'),
    ];

    expect(calculateUniqueCards(cards)).toBe(2);
  });

  it('should return 0 for empty array', () => {
    expect(calculateUniqueCards([])).toBe(0);
  });
});

describe('createTradeSummary', () => {
  it('should create complete summary', () => {
    const cardsGiven = [
      createTradeCard('sv1-1', 2, 'normal'),
      createTradeCard('sv1-2', 1, 'holofoil'),
    ];
    const cardsReceived = [
      createTradeCard('sv1-3', 3, 'normal'),
      createTradeCard('sv1-3', 1, 'reverseHolofoil'),
    ];

    const summary = createTradeSummary(cardsGiven, cardsReceived, 'My brother');

    expect(summary.cardsGivenCount).toBe(3);
    expect(summary.cardsReceivedCount).toBe(4);
    expect(summary.uniqueCardsGiven).toBe(2);
    expect(summary.uniqueCardsReceived).toBe(1); // Same cardId, different variants
    expect(summary.tradingPartner).toBe('My brother');
    expect(summary.netCardChange).toBe(1); // 4 - 3
  });

  it('should handle null trading partner', () => {
    const summary = createTradeSummary([], [], null);
    expect(summary.tradingPartner).toBe(null);
  });

  it('should trim trading partner name', () => {
    const summary = createTradeSummary([], [], '  Friend  ');
    expect(summary.tradingPartner).toBe('Friend');
  });

  it('should handle empty string as null', () => {
    const summary = createTradeSummary([], [], '');
    expect(summary.tradingPartner).toBe(null);
  });
});

describe('createTradeActivityMetadata', () => {
  it('should create complete metadata', () => {
    const cardsGiven = [createTradeCard('sv1-1', 2, 'normal', 'Pikachu', 'Base Set')];
    const cardsReceived = [createTradeCard('sv1-2', 1, 'holofoil', 'Charizard')];

    const metadata = createTradeActivityMetadata(cardsGiven, cardsReceived, 'Sister');

    expect(metadata.cardsGiven).toHaveLength(1);
    expect(metadata.cardsGiven[0].cardName).toBe('Pikachu');
    expect(metadata.cardsGiven[0].setName).toBe('Base Set');
    expect(metadata.cardsReceived).toHaveLength(1);
    expect(metadata.cardsReceived[0].cardName).toBe('Charizard');
    expect(metadata.tradingPartner).toBe('Sister');
    expect(metadata.totalCardsGiven).toBe(2);
    expect(metadata.totalCardsReceived).toBe(1);
  });

  it('should use cardId as fallback for missing cardName', () => {
    const cardsGiven = [createTradeCard('sv1-1', 1, 'normal')];
    const metadata = createTradeActivityMetadata(cardsGiven, [], null);

    expect(metadata.cardsGiven[0].cardName).toBe('sv1-1');
  });

  it('should default variant to normal', () => {
    const cardsGiven = [createTradeCard('sv1-1', 1)];
    const metadata = createTradeActivityMetadata(cardsGiven, [], null);

    expect(metadata.cardsGiven[0].variant).toBe('normal');
  });
});

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

describe('formatTradeCard', () => {
  it('should format basic card', () => {
    const card = createTradeCard('sv1-1', 1, 'normal', 'Pikachu');
    expect(formatTradeCard(card)).toBe('Pikachu');
  });

  it('should include quantity for multiple', () => {
    const card = createTradeCard('sv1-1', 3, 'normal', 'Pikachu');
    expect(formatTradeCard(card)).toBe('Pikachu x3');
  });

  it('should include variant for non-normal', () => {
    const card = createTradeCard('sv1-1', 1, 'holofoil', 'Pikachu');
    expect(formatTradeCard(card)).toBe('Pikachu (Holofoil)');
  });

  it('should include both variant and quantity', () => {
    const card = createTradeCard('sv1-1', 2, 'reverseHolofoil', 'Pikachu');
    expect(formatTradeCard(card)).toBe('Pikachu (Reverse Holofoil) x2');
  });

  it('should use cardId when cardName missing', () => {
    const card = createTradeCard('sv1-1', 1, 'normal');
    expect(formatTradeCard(card)).toBe('sv1-1');
  });
});

describe('formatVariant', () => {
  it('should format all variants correctly', () => {
    expect(formatVariant('normal')).toBe('Normal');
    expect(formatVariant('holofoil')).toBe('Holofoil');
    expect(formatVariant('reverseHolofoil')).toBe('Reverse Holofoil');
    expect(formatVariant('1stEditionHolofoil')).toBe('1st Edition Holofoil');
    expect(formatVariant('1stEditionNormal')).toBe('1st Edition');
  });
});

describe('formatTradeSummary', () => {
  it('should format complete trade', () => {
    const summary: TradeSummary = {
      cardsGivenCount: 3,
      cardsReceivedCount: 2,
      uniqueCardsGiven: 2,
      uniqueCardsReceived: 1,
      tradingPartner: 'Brother',
      netCardChange: -1,
    };

    const formatted = formatTradeSummary(summary);

    expect(formatted).toContain('Gave 3 cards');
    expect(formatted).toContain('Received 2 cards');
    expect(formatted).toContain('with Brother');
  });

  it('should handle singular card', () => {
    const summary: TradeSummary = {
      cardsGivenCount: 1,
      cardsReceivedCount: 1,
      uniqueCardsGiven: 1,
      uniqueCardsReceived: 1,
      tradingPartner: null,
      netCardChange: 0,
    };

    const formatted = formatTradeSummary(summary);

    expect(formatted).toContain('Gave 1 card');
    expect(formatted).toContain('Received 1 card');
    expect(formatted).not.toContain('with');
  });

  it('should handle empty trade', () => {
    const summary: TradeSummary = {
      cardsGivenCount: 0,
      cardsReceivedCount: 0,
      uniqueCardsGiven: 0,
      uniqueCardsReceived: 0,
      tradingPartner: null,
      netCardChange: 0,
    };

    expect(formatTradeSummary(summary)).toBe('Empty trade');
  });
});

describe('getTradeDescription', () => {
  it('should describe empty trade', () => {
    const summary: TradeSummary = {
      cardsGivenCount: 0,
      cardsReceivedCount: 0,
      uniqueCardsGiven: 0,
      uniqueCardsReceived: 0,
      tradingPartner: null,
      netCardChange: 0,
    };

    expect(getTradeDescription(summary)).toBe('Empty trade');
  });

  it('should describe gift received', () => {
    const summary: TradeSummary = {
      cardsGivenCount: 0,
      cardsReceivedCount: 2,
      uniqueCardsGiven: 0,
      uniqueCardsReceived: 2,
      tradingPartner: null,
      netCardChange: 2,
    };

    expect(getTradeDescription(summary)).toBe('Gift received');
  });

  it('should describe donation made', () => {
    const summary: TradeSummary = {
      cardsGivenCount: 3,
      cardsReceivedCount: 0,
      uniqueCardsGiven: 2,
      uniqueCardsReceived: 0,
      tradingPartner: null,
      netCardChange: -3,
    };

    expect(getTradeDescription(summary)).toBe('Donation made');
  });

  it('should describe positive net trade', () => {
    const summary: TradeSummary = {
      cardsGivenCount: 2,
      cardsReceivedCount: 5,
      uniqueCardsGiven: 2,
      uniqueCardsReceived: 3,
      tradingPartner: null,
      netCardChange: 3,
    };

    expect(getTradeDescription(summary)).toBe('Trade (+3 cards)');
  });

  it('should describe negative net trade', () => {
    const summary: TradeSummary = {
      cardsGivenCount: 5,
      cardsReceivedCount: 2,
      uniqueCardsGiven: 3,
      uniqueCardsReceived: 2,
      tradingPartner: null,
      netCardChange: -3,
    };

    expect(getTradeDescription(summary)).toBe('Trade (-3 cards)');
  });

  it('should describe even trade', () => {
    const summary: TradeSummary = {
      cardsGivenCount: 3,
      cardsReceivedCount: 3,
      uniqueCardsGiven: 2,
      uniqueCardsReceived: 2,
      tradingPartner: null,
      netCardChange: 0,
    };

    expect(getTradeDescription(summary)).toBe('Even trade');
  });
});

describe('formatNetChange', () => {
  it('should format positive change', () => {
    expect(formatNetChange(1)).toBe('+1 card');
    expect(formatNetChange(5)).toBe('+5 cards');
  });

  it('should format negative change', () => {
    expect(formatNetChange(-1)).toBe('-1 card');
    expect(formatNetChange(-3)).toBe('-3 cards');
  });

  it('should format zero change', () => {
    expect(formatNetChange(0)).toBe('No change');
  });
});

// ============================================================================
// INTEGRATION SCENARIOS
// ============================================================================

describe('Integration: Trade Scenarios', () => {
  describe('Basic trade between friends', () => {
    it('should handle complete trade flow', () => {
      const collection = [
        createCollectionEntry('sv1-1', 3, 'normal'),
        createCollectionEntry('sv1-2', 2, 'holofoil'),
        createCollectionEntry('sv1-3', 1, 'reverseHolofoil'),
      ];

      const cardsGiven = [
        createTradeCard('sv1-1', 2, 'normal', 'Pikachu'),
        createTradeCard('sv1-3', 1, 'reverseHolofoil', 'Raichu'),
      ];

      const cardsReceived = [
        createTradeCard('sv2-1', 1, 'holofoil', 'Charizard'),
        createTradeCard('sv2-2', 2, 'normal', 'Venusaur'),
      ];

      // Validate trade
      const validation = validateTrade(cardsGiven, cardsReceived, collection, 'School friend');
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Simulate trade
      const newCollection = simulateTrade(collection, cardsGiven, cardsReceived);
      expect(newCollection).toHaveLength(4); // 1 original + 2 new - 1 removed

      // Verify collection changes
      expect(newCollection.find((c) => c.cardId === 'sv1-1')?.quantity).toBe(1);
      expect(newCollection.find((c) => c.cardId === 'sv1-3')).toBeUndefined(); // Removed
      expect(newCollection.find((c) => c.cardId === 'sv2-1')?.quantity).toBe(1);
      expect(newCollection.find((c) => c.cardId === 'sv2-2')?.quantity).toBe(2);

      // Create summary
      const summary = createTradeSummary(cardsGiven, cardsReceived, 'School friend');
      expect(summary.cardsGivenCount).toBe(3);
      expect(summary.cardsReceivedCount).toBe(3);
      expect(summary.netCardChange).toBe(0);
    });
  });

  describe('Family gift scenario', () => {
    it('should handle receiving cards as gift', () => {
      const collection = [createCollectionEntry('sv1-1', 1, 'normal')];

      const cardsGiven: TradeCardEntry[] = [];
      const cardsReceived = [
        createTradeCard('sv1-2', 1, 'holofoil', 'Birthday Gift'),
        createTradeCard('sv1-3', 1, 'normal', 'Another Gift'),
      ];

      const validation = validateTrade(cardsGiven, cardsReceived, collection, 'Grandma');
      expect(validation.valid).toBe(true);
      expect(validation.warnings).toContain('Trade is a gift (no cards given)');

      const newCollection = simulateTrade(collection, cardsGiven, cardsReceived);
      expect(newCollection).toHaveLength(3);

      const summary = createTradeSummary(cardsGiven, cardsReceived, 'Grandma');
      expect(summary.cardsGivenCount).toBe(0);
      expect(summary.cardsReceivedCount).toBe(2);
      expect(getTradeDescription(summary)).toBe('Gift received');
    });
  });

  describe('Donation scenario', () => {
    it('should handle giving cards away', () => {
      const collection = [
        createCollectionEntry('sv1-1', 5, 'normal'),
        createCollectionEntry('sv1-2', 3, 'holofoil'),
      ];

      const cardsGiven = [createTradeCard('sv1-1', 2, 'normal', 'Extras for friend')];
      const cardsReceived: TradeCardEntry[] = [];

      const validation = validateTrade(cardsGiven, cardsReceived, collection, 'Little brother');
      expect(validation.valid).toBe(true);
      expect(validation.warnings).toContain('Trade is a donation (no cards received)');

      const newCollection = simulateTrade(collection, cardsGiven, cardsReceived);
      expect(newCollection.find((c) => c.cardId === 'sv1-1')?.quantity).toBe(3);

      const summary = createTradeSummary(cardsGiven, cardsReceived, 'Little brother');
      expect(getTradeDescription(summary)).toBe('Donation made');
    });
  });

  describe('Invalid trade handling', () => {
    it('should catch all validation errors', () => {
      const collection = [createCollectionEntry('sv1-1', 1, 'normal')];

      const cardsGiven = [
        createTradeCard('sv1-1', 5, 'normal'), // Don't have enough
        createTradeCard('invalid', 1, 'normal'), // Invalid card ID
      ];
      const cardsReceived = [
        createTradeCard('sv2-1', 0, 'normal'), // Invalid quantity
      ];

      const validation = validateTrade(cardsGiven, cardsReceived, collection);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some((e) => e.includes('Insufficient'))).toBe(true);
      expect(validation.errors.some((e) => e.includes('Invalid card ID'))).toBe(true);
      expect(validation.errors.some((e) => e.includes('Invalid quantity'))).toBe(true);
    });
  });

  describe('Variant upgrade trade', () => {
    it('should handle trading normal for holofoil', () => {
      const collection = [createCollectionEntry('sv1-1', 2, 'normal')];

      const cardsGiven = [createTradeCard('sv1-1', 1, 'normal', 'My Pikachu')];
      const cardsReceived = [createTradeCard('sv1-1', 1, 'holofoil', 'Better Pikachu')];

      const validation = validateTrade(cardsGiven, cardsReceived, collection);
      expect(validation.valid).toBe(true);

      const newCollection = simulateTrade(collection, cardsGiven, cardsReceived);
      expect(newCollection).toHaveLength(2);
      expect(newCollection.find((c) => c.variant === 'normal')?.quantity).toBe(1);
      expect(newCollection.find((c) => c.variant === 'holofoil')?.quantity).toBe(1);
    });
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  describe('Empty collections', () => {
    it('should handle empty collection in validation', () => {
      const cardsGiven = [createTradeCard('sv1-1', 1, 'normal')];
      const cardsReceived = [createTradeCard('sv1-2', 1, 'normal')];

      const validation = validateTrade(cardsGiven, cardsReceived, []);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('not in collection'))).toBe(true);
    });

    it('should handle adding to empty collection', () => {
      const result = addCardsToCollection([], [createTradeCard('sv1-1', 1, 'normal')]);
      expect(result).toHaveLength(1);
    });
  });

  describe('Large quantities', () => {
    it('should handle max quantity', () => {
      const card = createTradeCard('sv1-1', MAX_CARD_QUANTITY, 'normal');
      const result = validateTradeCard(card);
      expect(result.valid).toBe(true);
    });

    it('should handle many cards in trade', () => {
      const cards = Array.from({ length: MAX_TRADE_CARDS }, (_, i) =>
        createTradeCard(`sv1-${i + 1}`, 1, 'normal')
      );

      const result = validateTrade([], cards, []);
      expect(result.errors.every((e) => !e.includes('Too many'))).toBe(true);
    });
  });

  describe('Special characters', () => {
    it('should handle special characters in trading partner name', () => {
      const result = validateTradingPartner("O'Brien & Sons");
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe("O'Brien & Sons");
    });
  });
});
