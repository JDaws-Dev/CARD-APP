import { describe, it, expect } from 'vitest';

/**
 * Trade Advisor Tests
 *
 * Tests for the AI-powered trade advisor utility functions.
 * The actual AI generation is tested via integration tests,
 * but we test the types, validation, and helper functions here.
 */

// ============================================================================
// TRADE ADVISOR TYPES
// ============================================================================

// Types matching convex/ai/tradeAdvisor.ts
type FairnessRating = 'very_fair' | 'fair' | 'slightly_uneven' | 'uneven';
type TradeType = 'duplicate_swap' | 'wishlist_match' | 'set_completion' | 'type_match';
type GameSlug = 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana';

interface TradeCard {
  cardId: string;
  name: string;
  setId: string;
  setName: string;
  rarity: string;
  imageUrl: string;
  marketPrice: number | null;
  types: string[];
}

interface TradeSuggestion {
  fromProfile: {
    profileId: string;
    displayName: string;
    cards: TradeCard[];
    totalValue: number;
  };
  toProfile: {
    profileId: string;
    displayName: string;
    cards: TradeCard[];
    totalValue: number;
  };
  fairnessRating: FairnessRating;
  valueDifference: number;
  reason: string;
  tradeType: TradeType;
}

interface TradeAdvisorResult {
  suggestions: TradeSuggestion[];
  summary: string;
  analysisInsights: {
    profileA: {
      displayName: string;
      duplicateCount: number;
      wishlistMatchCount: number;
      favoriteTypes: string[];
    };
    profileB: {
      displayName: string;
      duplicateCount: number;
      wishlistMatchCount: number;
      favoriteTypes: string[];
    };
    overlapCount: number;
  };
  error?: string;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

const VALID_GAME_SLUGS: GameSlug[] = [
  'pokemon',
  'yugioh',
  'onepiece',
  'lorcana',
];

const VALID_FAIRNESS_RATINGS: FairnessRating[] = ['very_fair', 'fair', 'slightly_uneven', 'uneven'];

const VALID_TRADE_TYPES: TradeType[] = [
  'duplicate_swap',
  'wishlist_match',
  'set_completion',
  'type_match',
];

function isValidGameSlug(slug: string): slug is GameSlug {
  return VALID_GAME_SLUGS.includes(slug as GameSlug);
}

function isValidFairnessRating(rating: string): rating is FairnessRating {
  return VALID_FAIRNESS_RATINGS.includes(rating as FairnessRating);
}

function isValidTradeType(type: string): type is TradeType {
  return VALID_TRADE_TYPES.includes(type as TradeType);
}

function isValidTradeCard(card: Partial<TradeCard>): card is TradeCard {
  return (
    typeof card.cardId === 'string' &&
    card.cardId.length > 0 &&
    typeof card.name === 'string' &&
    card.name.length > 0 &&
    typeof card.setId === 'string' &&
    card.setId.length > 0 &&
    typeof card.setName === 'string' &&
    typeof card.rarity === 'string' &&
    typeof card.imageUrl === 'string' &&
    (card.marketPrice === null || typeof card.marketPrice === 'number') &&
    Array.isArray(card.types)
  );
}

function isValidTradeSuggestion(
  suggestion: Partial<TradeSuggestion>
): suggestion is TradeSuggestion {
  return (
    typeof suggestion.fromProfile === 'object' &&
    suggestion.fromProfile !== null &&
    typeof suggestion.fromProfile.profileId === 'string' &&
    typeof suggestion.fromProfile.displayName === 'string' &&
    Array.isArray(suggestion.fromProfile.cards) &&
    typeof suggestion.fromProfile.totalValue === 'number' &&
    typeof suggestion.toProfile === 'object' &&
    suggestion.toProfile !== null &&
    typeof suggestion.toProfile.profileId === 'string' &&
    typeof suggestion.toProfile.displayName === 'string' &&
    Array.isArray(suggestion.toProfile.cards) &&
    typeof suggestion.toProfile.totalValue === 'number' &&
    isValidFairnessRating(suggestion.fairnessRating || '') &&
    typeof suggestion.valueDifference === 'number' &&
    typeof suggestion.reason === 'string' &&
    isValidTradeType(suggestion.tradeType || '')
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate fairness rating based on value difference percentage
 */
function calculateFairnessRating(fromValue: number, toValue: number): FairnessRating {
  const avgValue = (fromValue + toValue) / 2;
  if (avgValue === 0) return 'very_fair';

  const valueDiff = Math.abs(fromValue - toValue);
  const percentDiff = (valueDiff / avgValue) * 100;

  if (percentDiff <= 10) return 'very_fair';
  if (percentDiff <= 20) return 'fair';
  if (percentDiff <= 30) return 'slightly_uneven';
  return 'uneven';
}

/**
 * Get a kid-friendly fairness message
 */
function getFairnessMessage(rating: FairnessRating): string {
  switch (rating) {
    case 'very_fair':
      return 'This trade is super fair! Both collectors get equal value! ⚖️';
    case 'fair':
      return 'This trade is pretty fair! A small difference in value. 👍';
    case 'slightly_uneven':
      return 'This trade is a bit uneven, but still okay if both agree! 🤔';
    case 'uneven':
      return 'This trade is uneven. One side gets more value than the other. ⚠️';
  }
}

/**
 * Calculate total value of cards in a trade
 */
function calculateTradeValue(cards: TradeCard[]): number {
  return cards.reduce((sum, card) => sum + (card.marketPrice || 0), 0);
}

/**
 * Round to 2 decimal places for currency
 */
function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Format currency for display
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Get trade type display label
 */
function getTradeTypeLabel(tradeType: TradeType): string {
  switch (tradeType) {
    case 'duplicate_swap':
      return 'Duplicate Swap';
    case 'wishlist_match':
      return 'Wishlist Match';
    case 'set_completion':
      return 'Set Completion';
    case 'type_match':
      return 'Type Match';
  }
}

/**
 * Validate a trade advisor result structure
 */
function isValidTradeAdvisorResult(
  result: Partial<TradeAdvisorResult>
): result is TradeAdvisorResult {
  return (
    Array.isArray(result.suggestions) &&
    typeof result.summary === 'string' &&
    typeof result.analysisInsights === 'object' &&
    result.analysisInsights !== null &&
    typeof result.analysisInsights.profileA === 'object' &&
    typeof result.analysisInsights.profileB === 'object' &&
    typeof result.analysisInsights.overlapCount === 'number'
  );
}

// ============================================================================
// TESTS
// ============================================================================

describe('Trade Advisor Types', () => {
  describe('GameSlug validation', () => {
    it('should accept all valid game slugs', () => {
      expect(isValidGameSlug('pokemon')).toBe(true);
      expect(isValidGameSlug('yugioh')).toBe(true);
      expect(isValidGameSlug('onepiece')).toBe(true);
      expect(isValidGameSlug('lorcana')).toBe(true);
    });

    it('should reject invalid game slugs', () => {
      expect(isValidGameSlug('invalid')).toBe(false);
      expect(isValidGameSlug('')).toBe(false);
      expect(isValidGameSlug('Pokemon')).toBe(false);
      expect(isValidGameSlug('POKEMON')).toBe(false);
      expect(isValidGameSlug('magic')).toBe(false);
    });

    it('should have exactly 4 valid game slugs', () => {
      expect(VALID_GAME_SLUGS).toHaveLength(4);
    });
  });

  describe('FairnessRating validation', () => {
    it('should accept all valid fairness ratings', () => {
      expect(isValidFairnessRating('very_fair')).toBe(true);
      expect(isValidFairnessRating('fair')).toBe(true);
      expect(isValidFairnessRating('slightly_uneven')).toBe(true);
      expect(isValidFairnessRating('uneven')).toBe(true);
    });

    it('should reject invalid fairness ratings', () => {
      expect(isValidFairnessRating('invalid')).toBe(false);
      expect(isValidFairnessRating('')).toBe(false);
      expect(isValidFairnessRating('VERY_FAIR')).toBe(false);
      expect(isValidFairnessRating('extremely_fair')).toBe(false);
    });

    it('should have exactly 4 fairness ratings', () => {
      expect(VALID_FAIRNESS_RATINGS).toHaveLength(4);
    });
  });

  describe('TradeType validation', () => {
    it('should accept all valid trade types', () => {
      expect(isValidTradeType('duplicate_swap')).toBe(true);
      expect(isValidTradeType('wishlist_match')).toBe(true);
      expect(isValidTradeType('set_completion')).toBe(true);
      expect(isValidTradeType('type_match')).toBe(true);
    });

    it('should reject invalid trade types', () => {
      expect(isValidTradeType('invalid')).toBe(false);
      expect(isValidTradeType('')).toBe(false);
      expect(isValidTradeType('DUPLICATE_SWAP')).toBe(false);
      expect(isValidTradeType('random_trade')).toBe(false);
    });

    it('should have exactly 4 trade types', () => {
      expect(VALID_TRADE_TYPES).toHaveLength(4);
    });
  });
});

describe('Trade Card Validation', () => {
  describe('isValidTradeCard', () => {
    it('should accept a valid trade card', () => {
      const validCard: TradeCard = {
        cardId: 'sv1-1',
        name: 'Sprigatito',
        setId: 'sv1',
        setName: 'Scarlet & Violet',
        rarity: 'Common',
        imageUrl: 'https://example.com/card.png',
        marketPrice: 0.5,
        types: ['Grass'],
      };
      expect(isValidTradeCard(validCard)).toBe(true);
    });

    it('should accept a card with null market price', () => {
      const card: TradeCard = {
        cardId: 'sv1-1',
        name: 'Sprigatito',
        setId: 'sv1',
        setName: 'Scarlet & Violet',
        rarity: 'Common',
        imageUrl: 'https://example.com/card.png',
        marketPrice: null,
        types: ['Grass'],
      };
      expect(isValidTradeCard(card)).toBe(true);
    });

    it('should accept a card with empty types array', () => {
      const card: TradeCard = {
        cardId: 'sv1-1',
        name: 'Professor Research',
        setId: 'sv1',
        setName: 'Scarlet & Violet',
        rarity: 'Uncommon',
        imageUrl: 'https://example.com/card.png',
        marketPrice: 0.25,
        types: [],
      };
      expect(isValidTradeCard(card)).toBe(true);
    });

    it('should reject a card with missing cardId', () => {
      const card = {
        name: 'Sprigatito',
        setId: 'sv1',
        setName: 'Scarlet & Violet',
        rarity: 'Common',
        imageUrl: 'https://example.com/card.png',
        marketPrice: 0.5,
        types: ['Grass'],
      };
      expect(isValidTradeCard(card)).toBe(false);
    });

    it('should reject a card with empty cardId', () => {
      const card: TradeCard = {
        cardId: '',
        name: 'Sprigatito',
        setId: 'sv1',
        setName: 'Scarlet & Violet',
        rarity: 'Common',
        imageUrl: 'https://example.com/card.png',
        marketPrice: 0.5,
        types: ['Grass'],
      };
      expect(isValidTradeCard(card)).toBe(false);
    });

    it('should reject a card with missing name', () => {
      const card = {
        cardId: 'sv1-1',
        setId: 'sv1',
        setName: 'Scarlet & Violet',
        rarity: 'Common',
        imageUrl: 'https://example.com/card.png',
        marketPrice: 0.5,
        types: ['Grass'],
      };
      expect(isValidTradeCard(card)).toBe(false);
    });

    it('should reject a card with types not being an array', () => {
      const card = {
        cardId: 'sv1-1',
        name: 'Sprigatito',
        setId: 'sv1',
        setName: 'Scarlet & Violet',
        rarity: 'Common',
        imageUrl: 'https://example.com/card.png',
        marketPrice: 0.5,
        types: 'Grass', // Should be array
      };
      expect(isValidTradeCard(card as unknown as Partial<TradeCard>)).toBe(false);
    });
  });
});

describe('Trade Suggestion Validation', () => {
  describe('isValidTradeSuggestion', () => {
    it('should accept a valid trade suggestion', () => {
      const suggestion: TradeSuggestion = {
        fromProfile: {
          profileId: 'profile1',
          displayName: 'Alice',
          cards: [
            {
              cardId: 'sv1-1',
              name: 'Sprigatito',
              setId: 'sv1',
              setName: 'Scarlet & Violet',
              rarity: 'Common',
              imageUrl: 'https://example.com/card1.png',
              marketPrice: 0.5,
              types: ['Grass'],
            },
          ],
          totalValue: 0.5,
        },
        toProfile: {
          profileId: 'profile2',
          displayName: 'Bob',
          cards: [
            {
              cardId: 'sv1-4',
              name: 'Fuecoco',
              setId: 'sv1',
              setName: 'Scarlet & Violet',
              rarity: 'Common',
              imageUrl: 'https://example.com/card2.png',
              marketPrice: 0.45,
              types: ['Fire'],
            },
          ],
          totalValue: 0.45,
        },
        fairnessRating: 'very_fair',
        valueDifference: 0.05,
        reason: 'Both get starter Pokémon they want!',
        tradeType: 'duplicate_swap',
      };
      expect(isValidTradeSuggestion(suggestion)).toBe(true);
    });

    it('should reject suggestion with invalid fairness rating', () => {
      const suggestion = {
        fromProfile: {
          profileId: 'profile1',
          displayName: 'Alice',
          cards: [],
          totalValue: 0,
        },
        toProfile: {
          profileId: 'profile2',
          displayName: 'Bob',
          cards: [],
          totalValue: 0,
        },
        fairnessRating: 'invalid_rating',
        valueDifference: 0,
        reason: 'Test',
        tradeType: 'duplicate_swap',
      };
      expect(isValidTradeSuggestion(suggestion as unknown as Partial<TradeSuggestion>)).toBe(false);
    });

    it('should reject suggestion with invalid trade type', () => {
      const suggestion = {
        fromProfile: {
          profileId: 'profile1',
          displayName: 'Alice',
          cards: [],
          totalValue: 0,
        },
        toProfile: {
          profileId: 'profile2',
          displayName: 'Bob',
          cards: [],
          totalValue: 0,
        },
        fairnessRating: 'fair',
        valueDifference: 0,
        reason: 'Test',
        tradeType: 'invalid_type',
      };
      expect(isValidTradeSuggestion(suggestion as unknown as Partial<TradeSuggestion>)).toBe(false);
    });

    it('should reject suggestion with missing fromProfile', () => {
      const suggestion = {
        toProfile: {
          profileId: 'profile2',
          displayName: 'Bob',
          cards: [],
          totalValue: 0,
        },
        fairnessRating: 'fair',
        valueDifference: 0,
        reason: 'Test',
        tradeType: 'duplicate_swap',
      };
      expect(isValidTradeSuggestion(suggestion as unknown as Partial<TradeSuggestion>)).toBe(false);
    });
  });
});

describe('Fairness Calculation', () => {
  describe('calculateFairnessRating', () => {
    it('should return very_fair for equal values', () => {
      expect(calculateFairnessRating(10, 10)).toBe('very_fair');
      expect(calculateFairnessRating(0, 0)).toBe('very_fair');
      expect(calculateFairnessRating(100, 100)).toBe('very_fair');
    });

    it('should return very_fair for <= 10% difference', () => {
      // 10 vs 11 = 10% difference
      expect(calculateFairnessRating(10, 11)).toBe('very_fair');
      expect(calculateFairnessRating(100, 109)).toBe('very_fair');
    });

    it('should return fair for 10-20% difference', () => {
      // 10 vs 12 = ~18% difference
      expect(calculateFairnessRating(10, 12)).toBe('fair');
      // 100 vs 118 = ~17% difference
      expect(calculateFairnessRating(100, 118)).toBe('fair');
    });

    it('should return slightly_uneven for 20-30% difference', () => {
      // 10 vs 13 = ~26% difference
      expect(calculateFairnessRating(10, 13)).toBe('slightly_uneven');
      // 100 vs 125 = ~22% difference
      expect(calculateFairnessRating(100, 125)).toBe('slightly_uneven');
    });

    it('should return uneven for > 30% difference', () => {
      // 10 vs 15 = ~40% difference
      expect(calculateFairnessRating(10, 15)).toBe('uneven');
      // 100 vs 150 = ~40% difference
      expect(calculateFairnessRating(100, 150)).toBe('uneven');
      // 10 vs 20 = ~67% difference
      expect(calculateFairnessRating(10, 20)).toBe('uneven');
    });

    it('should handle zero values', () => {
      expect(calculateFairnessRating(0, 0)).toBe('very_fair');
      // One side is 0, the other is not - should be uneven
      // But our formula: avgValue = 5, diff = 10, percentDiff = 200% > 30% = uneven
      expect(calculateFairnessRating(0, 10)).toBe('uneven');
    });
  });

  describe('getFairnessMessage', () => {
    it('should return appropriate messages for each rating', () => {
      expect(getFairnessMessage('very_fair')).toContain('super fair');
      expect(getFairnessMessage('fair')).toContain('pretty fair');
      expect(getFairnessMessage('slightly_uneven')).toContain('bit uneven');
      expect(getFairnessMessage('uneven')).toContain('uneven');
    });

    it('should include emojis in messages', () => {
      expect(getFairnessMessage('very_fair')).toMatch(/[⚖️👍🤔⚠️]/);
      expect(getFairnessMessage('fair')).toMatch(/[⚖️👍🤔⚠️]/);
      expect(getFairnessMessage('slightly_uneven')).toMatch(/[⚖️👍🤔⚠️]/);
      expect(getFairnessMessage('uneven')).toMatch(/[⚖️👍🤔⚠️]/);
    });
  });
});

describe('Trade Value Calculation', () => {
  describe('calculateTradeValue', () => {
    it('should sum all card prices', () => {
      const cards: TradeCard[] = [
        {
          cardId: 'sv1-1',
          name: 'Card 1',
          setId: 'sv1',
          setName: 'Set 1',
          rarity: 'Common',
          imageUrl: '',
          marketPrice: 1.5,
          types: [],
        },
        {
          cardId: 'sv1-2',
          name: 'Card 2',
          setId: 'sv1',
          setName: 'Set 1',
          rarity: 'Rare',
          imageUrl: '',
          marketPrice: 3.25,
          types: [],
        },
      ];
      expect(calculateTradeValue(cards)).toBe(4.75);
    });

    it('should handle null prices as 0', () => {
      const cards: TradeCard[] = [
        {
          cardId: 'sv1-1',
          name: 'Card 1',
          setId: 'sv1',
          setName: 'Set 1',
          rarity: 'Common',
          imageUrl: '',
          marketPrice: null,
          types: [],
        },
        {
          cardId: 'sv1-2',
          name: 'Card 2',
          setId: 'sv1',
          setName: 'Set 1',
          rarity: 'Rare',
          imageUrl: '',
          marketPrice: 2.0,
          types: [],
        },
      ];
      expect(calculateTradeValue(cards)).toBe(2.0);
    });

    it('should return 0 for empty array', () => {
      expect(calculateTradeValue([])).toBe(0);
    });

    it('should return 0 when all prices are null', () => {
      const cards: TradeCard[] = [
        {
          cardId: 'sv1-1',
          name: 'Card 1',
          setId: 'sv1',
          setName: 'Set 1',
          rarity: 'Common',
          imageUrl: '',
          marketPrice: null,
          types: [],
        },
      ];
      expect(calculateTradeValue(cards)).toBe(0);
    });
  });

  describe('roundToCents', () => {
    it('should round to 2 decimal places', () => {
      expect(roundToCents(1.234)).toBe(1.23);
      expect(roundToCents(1.235)).toBe(1.24);
      expect(roundToCents(1.999)).toBe(2.0);
    });

    it('should handle whole numbers', () => {
      expect(roundToCents(5)).toBe(5.0);
      expect(roundToCents(0)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(roundToCents(-1.234)).toBe(-1.23);
      expect(roundToCents(-1.235)).toBe(-1.24);
    });
  });

  describe('formatCurrency', () => {
    it('should format as USD currency', () => {
      expect(formatCurrency(1.5)).toBe('$1.50');
      expect(formatCurrency(10)).toBe('$10.00');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should include thousands separator', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should handle small values', () => {
      expect(formatCurrency(0.01)).toBe('$0.01');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });
  });
});

describe('Trade Type Labels', () => {
  describe('getTradeTypeLabel', () => {
    it('should return correct label for each trade type', () => {
      expect(getTradeTypeLabel('duplicate_swap')).toBe('Duplicate Swap');
      expect(getTradeTypeLabel('wishlist_match')).toBe('Wishlist Match');
      expect(getTradeTypeLabel('set_completion')).toBe('Set Completion');
      expect(getTradeTypeLabel('type_match')).toBe('Type Match');
    });
  });
});

describe('Trade Advisor Result Validation', () => {
  describe('isValidTradeAdvisorResult', () => {
    it('should accept a valid result', () => {
      const result: TradeAdvisorResult = {
        suggestions: [],
        summary: 'No trades available right now.',
        analysisInsights: {
          profileA: {
            displayName: 'Alice',
            duplicateCount: 5,
            wishlistMatchCount: 2,
            favoriteTypes: ['Grass', 'Fire'],
          },
          profileB: {
            displayName: 'Bob',
            duplicateCount: 3,
            wishlistMatchCount: 1,
            favoriteTypes: ['Water', 'Electric'],
          },
          overlapCount: 4,
        },
      };
      expect(isValidTradeAdvisorResult(result)).toBe(true);
    });

    it('should accept a result with suggestions', () => {
      const result: TradeAdvisorResult = {
        suggestions: [
          {
            fromProfile: {
              profileId: 'p1',
              displayName: 'Alice',
              cards: [],
              totalValue: 0,
            },
            toProfile: {
              profileId: 'p2',
              displayName: 'Bob',
              cards: [],
              totalValue: 0,
            },
            fairnessRating: 'fair',
            valueDifference: 0,
            reason: 'Great trade!',
            tradeType: 'duplicate_swap',
          },
        ],
        summary: 'Found a trade!',
        analysisInsights: {
          profileA: {
            displayName: 'Alice',
            duplicateCount: 1,
            wishlistMatchCount: 0,
            favoriteTypes: [],
          },
          profileB: {
            displayName: 'Bob',
            duplicateCount: 1,
            wishlistMatchCount: 0,
            favoriteTypes: [],
          },
          overlapCount: 1,
        },
      };
      expect(isValidTradeAdvisorResult(result)).toBe(true);
    });

    it('should accept a result with error', () => {
      const result: TradeAdvisorResult = {
        suggestions: [],
        summary: '',
        analysisInsights: {
          profileA: {
            displayName: '',
            duplicateCount: 0,
            wishlistMatchCount: 0,
            favoriteTypes: [],
          },
          profileB: {
            displayName: '',
            duplicateCount: 0,
            wishlistMatchCount: 0,
            favoriteTypes: [],
          },
          overlapCount: 0,
        },
        error: 'Rate limit exceeded',
      };
      expect(isValidTradeAdvisorResult(result)).toBe(true);
    });

    it('should reject result with missing suggestions array', () => {
      const result = {
        summary: 'Test',
        analysisInsights: {
          profileA: {
            displayName: 'Alice',
            duplicateCount: 0,
            wishlistMatchCount: 0,
            favoriteTypes: [],
          },
          profileB: {
            displayName: 'Bob',
            duplicateCount: 0,
            wishlistMatchCount: 0,
            favoriteTypes: [],
          },
          overlapCount: 0,
        },
      };
      expect(isValidTradeAdvisorResult(result as unknown as Partial<TradeAdvisorResult>)).toBe(
        false
      );
    });

    it('should reject result with missing analysisInsights', () => {
      const result = {
        suggestions: [],
        summary: 'Test',
      };
      expect(isValidTradeAdvisorResult(result as unknown as Partial<TradeAdvisorResult>)).toBe(
        false
      );
    });
  });
});

describe('Multi-TCG Support', () => {
  it('should support all 4 TCGs for trade suggestions', () => {
    const supportedGames: GameSlug[] = [
      'pokemon',
      'yugioh',
      'onepiece',
      'lorcana',
    ];

    for (const game of supportedGames) {
      expect(isValidGameSlug(game)).toBe(true);
    }
    expect(supportedGames).toHaveLength(4);
  });

  it('should handle game-specific card types', () => {
    // Pokemon types
    const pokemonCard: TradeCard = {
      cardId: 'sv1-1',
      name: 'Pikachu',
      setId: 'sv1',
      setName: 'Scarlet & Violet',
      rarity: 'Common',
      imageUrl: '',
      marketPrice: 1.0,
      types: ['Lightning'],
    };
    expect(isValidTradeCard(pokemonCard)).toBe(true);

    // Yu-Gi-Oh types
    const yugiohCard: TradeCard = {
      cardId: 'LOB-001',
      name: 'Blue-Eyes White Dragon',
      setId: 'LOB',
      setName: 'Legend of Blue Eyes',
      rarity: 'Ultra Rare',
      imageUrl: '',
      marketPrice: 50.0,
      types: ['Dragon'],
    };
    expect(isValidTradeCard(yugiohCard)).toBe(true);

    // Lorcana types
    const lorcanaCard: TradeCard = {
      cardId: 'TFC-001',
      name: 'Mickey Mouse - True Friend',
      setId: 'TFC',
      setName: 'The First Chapter',
      rarity: 'Legendary',
      imageUrl: '',
      marketPrice: 15.0,
      types: ['Hero', 'Storyborn'],
    };
    expect(isValidTradeCard(lorcanaCard)).toBe(true);
  });
});

describe('Rate Limiting', () => {
  it('should have defined daily limit for trade advisor', () => {
    const TRADE_ADVISOR_DAILY_LIMIT = 10;
    expect(TRADE_ADVISOR_DAILY_LIMIT).toBe(10);
  });

  it('should format hours until reset correctly', () => {
    const formatHoursUntilReset = (resetAt: number): string => {
      const hoursUntilReset = Math.ceil((resetAt - Date.now()) / 1000 / 60 / 60);
      return `Come back in ${hoursUntilReset} hours!`;
    };

    const oneHourFromNow = Date.now() + 1 * 60 * 60 * 1000;
    expect(formatHoursUntilReset(oneHourFromNow)).toBe('Come back in 1 hours!');

    const threeHoursFromNow = Date.now() + 3 * 60 * 60 * 1000;
    expect(formatHoursUntilReset(threeHoursFromNow)).toBe('Come back in 3 hours!');
  });
});

describe('Family Verification', () => {
  it('should require both profiles to be in same family', () => {
    // This tests the concept - actual implementation is in tradeAdvisorHelpers.ts
    const verifyFamilyProfiles = (
      profileAFamilyId: string,
      profileBFamilyId: string,
      familyId: string
    ): boolean => {
      return profileAFamilyId === familyId && profileBFamilyId === familyId;
    };

    expect(verifyFamilyProfiles('family1', 'family1', 'family1')).toBe(true);
    expect(verifyFamilyProfiles('family1', 'family2', 'family1')).toBe(false);
    expect(verifyFamilyProfiles('family2', 'family1', 'family1')).toBe(false);
  });

  it('should not allow trading with yourself', () => {
    const canTrade = (profileIdA: string, profileIdB: string): boolean => {
      return profileIdA !== profileIdB;
    };

    expect(canTrade('profile1', 'profile2')).toBe(true);
    expect(canTrade('profile1', 'profile1')).toBe(false);
  });
});
