import { describe, it, expect } from 'vitest';
import {
  // Types
  TradeCard,
  TradeSide,
  TradeFairnessResult,
  FairnessRating,
  TradeRecommendation,
  CardDataMap,
  SimpleTradeInput,
  TradeSummary,
  // Constants
  FAIRNESS_THRESHOLDS,
  MIN_TRADE_VALUE_FOR_EVALUATION,
  DEFAULT_VARIANT,
  // Trade side calculation
  calculateTradeSide,
  buildTradeCards,
  // Fairness calculation
  getFairnessRating,
  isTradeFair,
  getTradeRecommendation,
  calculatePercentDifference,
  // Main evaluation
  evaluateTrade,
  evaluateTradeFromInputs,
  // Message generation
  getTradeMessage,
  getDetailedTradeMessage,
  getFairnessEmoji,
  getFairnessColor,
  getFairnessDisplayLabel,
  getRecommendationDisplayLabel,
  // Trade analysis
  getMostValuableTradeCard,
  calculateValueNeededForFairTrade,
  suggestBalancingCards,
  hasReliablePricing,
  getPricingWarning,
  // Summary
  createTradeSummary,
  formatValueDifference,
  // Helpers
  roundToCents,
  formatCurrency,
  isValidTrade,
  getTotalCardCount,
  hasCompletePricing,
} from '../tradingCalculator';

describe('Trading Calculator', () => {
  // ============================================================================
  // TEST DATA FACTORIES
  // ============================================================================

  const createTradeCard = (
    cardId: string,
    unitPrice: number | null,
    quantity = 1,
    name?: string
  ): TradeCard => ({
    cardId,
    name: name ?? cardId,
    quantity,
    unitPrice,
    variant: 'normal',
  });

  const createCardDataMap = (
    cards: Array<{ cardId: string; price: number; name?: string }>
  ): CardDataMap => {
    const map = new Map();
    for (const card of cards) {
      map.set(card.cardId, {
        price: card.price,
        name: card.name ?? card.cardId,
      });
    }
    return map;
  };

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  describe('Constants', () => {
    it('should have correct FAIRNESS_THRESHOLDS values', () => {
      expect(FAIRNESS_THRESHOLDS.FAIR).toBe(10);
      expect(FAIRNESS_THRESHOLDS.SLIGHT).toBe(25);
      expect(FAIRNESS_THRESHOLDS.UNFAIR).toBe(50);
    });

    it('should have thresholds in ascending order', () => {
      expect(FAIRNESS_THRESHOLDS.FAIR).toBeLessThan(FAIRNESS_THRESHOLDS.SLIGHT);
      expect(FAIRNESS_THRESHOLDS.SLIGHT).toBeLessThan(FAIRNESS_THRESHOLDS.UNFAIR);
    });

    it('should have reasonable MIN_TRADE_VALUE_FOR_EVALUATION', () => {
      expect(MIN_TRADE_VALUE_FOR_EVALUATION).toBe(0.5);
      expect(MIN_TRADE_VALUE_FOR_EVALUATION).toBeGreaterThan(0);
    });

    it('should have correct DEFAULT_VARIANT', () => {
      expect(DEFAULT_VARIANT).toBe('normal');
    });
  });

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  describe('roundToCents', () => {
    it('should round to 2 decimal places', () => {
      expect(roundToCents(1.234)).toBe(1.23);
      expect(roundToCents(1.235)).toBe(1.24);
      expect(roundToCents(1.999)).toBe(2);
    });

    it('should handle whole numbers', () => {
      expect(roundToCents(10)).toBe(10);
      expect(roundToCents(0)).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(roundToCents(-1.234)).toBe(-1.23);
      expect(roundToCents(-1.235)).toBe(-1.24);
    });
  });

  describe('formatCurrency', () => {
    it('should format as USD currency', () => {
      expect(formatCurrency(10)).toBe('$10.00');
      expect(formatCurrency(10.5)).toBe('$10.50');
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle small values', () => {
      expect(formatCurrency(0.01)).toBe('$0.01');
      expect(formatCurrency(0.99)).toBe('$0.99');
    });
  });

  describe('isValidTrade', () => {
    it('should return true for valid trades with cards on both sides', () => {
      const offering = [createTradeCard('sv1-1', 10)];
      const receiving = [createTradeCard('sv1-2', 10)];
      expect(isValidTrade(offering, receiving)).toBe(true);
    });

    it('should return false if offering is empty', () => {
      const receiving = [createTradeCard('sv1-2', 10)];
      expect(isValidTrade([], receiving)).toBe(false);
    });

    it('should return false if receiving is empty', () => {
      const offering = [createTradeCard('sv1-1', 10)];
      expect(isValidTrade(offering, [])).toBe(false);
    });

    it('should return false if both are empty', () => {
      expect(isValidTrade([], [])).toBe(false);
    });
  });

  // ============================================================================
  // TRADE SIDE CALCULATION
  // ============================================================================

  describe('calculateTradeSide', () => {
    it('should calculate total value correctly', () => {
      const cards = [createTradeCard('sv1-1', 10, 1), createTradeCard('sv1-2', 5, 2)];

      const side = calculateTradeSide(cards);

      expect(side.totalValue).toBe(20); // 10*1 + 5*2
    });

    it('should count valued and unvalued cards', () => {
      const cards = [
        createTradeCard('sv1-1', 10, 1),
        createTradeCard('sv1-2', null, 1),
        createTradeCard('sv1-3', 5, 1),
      ];

      const side = calculateTradeSide(cards);

      expect(side.valuedCardCount).toBe(2);
      expect(side.unvaluedCardCount).toBe(1);
    });

    it('should handle empty cards array', () => {
      const side = calculateTradeSide([]);

      expect(side.totalValue).toBe(0);
      expect(side.valuedCardCount).toBe(0);
      expect(side.unvaluedCardCount).toBe(0);
    });

    it('should treat zero price as unvalued', () => {
      const cards = [createTradeCard('sv1-1', 0, 1)];

      const side = calculateTradeSide(cards);

      expect(side.valuedCardCount).toBe(0);
      expect(side.unvaluedCardCount).toBe(1);
      expect(side.totalValue).toBe(0);
    });

    it('should include cards array in result', () => {
      const cards = [createTradeCard('sv1-1', 10, 1)];

      const side = calculateTradeSide(cards);

      expect(side.cards).toEqual(cards);
    });
  });

  describe('buildTradeCards', () => {
    it('should build trade cards from inputs and data map', () => {
      const inputs: SimpleTradeInput[] = [
        { cardId: 'sv1-1', quantity: 2 },
        { cardId: 'sv1-2', quantity: 1 },
      ];
      const cardDataMap = createCardDataMap([
        { cardId: 'sv1-1', price: 10, name: 'Pikachu' },
        { cardId: 'sv1-2', price: 5, name: 'Bulbasaur' },
      ]);

      const tradeCards = buildTradeCards(inputs, cardDataMap);

      expect(tradeCards).toHaveLength(2);
      expect(tradeCards[0].name).toBe('Pikachu');
      expect(tradeCards[0].unitPrice).toBe(10);
      expect(tradeCards[0].quantity).toBe(2);
      expect(tradeCards[1].name).toBe('Bulbasaur');
    });

    it('should fall back to cardId for missing card data', () => {
      const inputs: SimpleTradeInput[] = [{ cardId: 'unknown-1', quantity: 1 }];
      const cardDataMap = createCardDataMap([]);

      const tradeCards = buildTradeCards(inputs, cardDataMap);

      expect(tradeCards[0].name).toBe('unknown-1');
      expect(tradeCards[0].unitPrice).toBeNull();
    });

    it('should use default variant when not specified', () => {
      const inputs: SimpleTradeInput[] = [{ cardId: 'sv1-1', quantity: 1 }];
      const cardDataMap = createCardDataMap([{ cardId: 'sv1-1', price: 10 }]);

      const tradeCards = buildTradeCards(inputs, cardDataMap);

      expect(tradeCards[0].variant).toBe('normal');
    });

    it('should preserve specified variant', () => {
      const inputs: SimpleTradeInput[] = [{ cardId: 'sv1-1', quantity: 1, variant: 'holofoil' }];
      const cardDataMap = createCardDataMap([{ cardId: 'sv1-1', price: 10 }]);

      const tradeCards = buildTradeCards(inputs, cardDataMap);

      expect(tradeCards[0].variant).toBe('holofoil');
    });
  });

  describe('getTotalCardCount', () => {
    it('should sum quantities across all cards', () => {
      const side: TradeSide = {
        cards: [createTradeCard('sv1-1', 10, 2), createTradeCard('sv1-2', 5, 3)],
        totalValue: 35,
        valuedCardCount: 2,
        unvaluedCardCount: 0,
      };

      expect(getTotalCardCount(side)).toBe(5); // 2 + 3
    });

    it('should return 0 for empty cards', () => {
      const side: TradeSide = {
        cards: [],
        totalValue: 0,
        valuedCardCount: 0,
        unvaluedCardCount: 0,
      };

      expect(getTotalCardCount(side)).toBe(0);
    });
  });

  describe('hasCompletePricing', () => {
    it('should return true when all cards have pricing', () => {
      const side: TradeSide = {
        cards: [],
        totalValue: 20,
        valuedCardCount: 2,
        unvaluedCardCount: 0,
      };

      expect(hasCompletePricing(side)).toBe(true);
    });

    it('should return false when some cards are unpriced', () => {
      const side: TradeSide = {
        cards: [],
        totalValue: 10,
        valuedCardCount: 1,
        unvaluedCardCount: 1,
      };

      expect(hasCompletePricing(side)).toBe(false);
    });
  });

  // ============================================================================
  // FAIRNESS CALCULATION
  // ============================================================================

  describe('calculatePercentDifference', () => {
    it('should return 0 for equal values', () => {
      expect(calculatePercentDifference(10, 10)).toBe(0);
    });

    it('should return positive when receiving more', () => {
      // Receiving 20, offering 10
      // Average = 15, difference = 10
      // Percent = 10/15 * 100 = 66.67%
      const result = calculatePercentDifference(10, 20);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeCloseTo(66.67, 1);
    });

    it('should return negative when offering more', () => {
      // Offering 20, receiving 10
      // Average = 15, difference = -10
      // Percent = -10/15 * 100 = -66.67%
      const result = calculatePercentDifference(20, 10);
      expect(result).toBeLessThan(0);
      expect(result).toBeCloseTo(-66.67, 1);
    });

    it('should return 0 for very low values (below minimum threshold)', () => {
      // Total < MIN_TRADE_VALUE_FOR_EVALUATION * 2
      expect(calculatePercentDifference(0.1, 0.2)).toBe(0);
      expect(calculatePercentDifference(0.3, 0.4)).toBe(0);
    });

    it('should evaluate when above minimum threshold', () => {
      // Total = 1.0, which is >= MIN_TRADE_VALUE_FOR_EVALUATION * 2 (1.0)
      const result = calculatePercentDifference(0.5, 0.5);
      expect(result).toBe(0);
    });
  });

  describe('getFairnessRating', () => {
    it('should return "fair" for differences within FAIR threshold', () => {
      expect(getFairnessRating(0)).toBe('fair');
      expect(getFairnessRating(5)).toBe('fair');
      expect(getFairnessRating(-5)).toBe('fair');
      expect(getFairnessRating(10)).toBe('fair');
      expect(getFairnessRating(-10)).toBe('fair');
    });

    it('should return "slightly_unfair_for/against" for differences within SLIGHT threshold', () => {
      expect(getFairnessRating(15)).toBe('slightly_unfair_for');
      expect(getFairnessRating(-15)).toBe('slightly_unfair_against');
      expect(getFairnessRating(25)).toBe('slightly_unfair_for');
      expect(getFairnessRating(-25)).toBe('slightly_unfair_against');
    });

    it('should return "unfair_for/against" for differences within UNFAIR threshold', () => {
      expect(getFairnessRating(30)).toBe('unfair_for');
      expect(getFairnessRating(-30)).toBe('unfair_against');
      expect(getFairnessRating(50)).toBe('unfair_for');
      expect(getFairnessRating(-50)).toBe('unfair_against');
    });

    it('should return "very_unfair_for/against" for differences beyond UNFAIR threshold', () => {
      expect(getFairnessRating(60)).toBe('very_unfair_for');
      expect(getFairnessRating(-60)).toBe('very_unfair_against');
      expect(getFairnessRating(100)).toBe('very_unfair_for');
      expect(getFairnessRating(-100)).toBe('very_unfair_against');
    });
  });

  describe('isTradeFair', () => {
    it('should return true for fair trades', () => {
      expect(isTradeFair(0)).toBe(true);
      expect(isTradeFair(5)).toBe(true);
      expect(isTradeFair(-5)).toBe(true);
      expect(isTradeFair(10)).toBe(true);
    });

    it('should return false for unfair trades', () => {
      expect(isTradeFair(11)).toBe(false);
      expect(isTradeFair(-11)).toBe(false);
      expect(isTradeFair(50)).toBe(false);
    });
  });

  describe('getTradeRecommendation', () => {
    it('should recommend "accept" for fair trades', () => {
      expect(getTradeRecommendation('fair')).toBe('accept');
    });

    it('should recommend "accept" for trades in your favor', () => {
      expect(getTradeRecommendation('slightly_unfair_for')).toBe('accept');
      expect(getTradeRecommendation('unfair_for')).toBe('accept');
      expect(getTradeRecommendation('very_unfair_for')).toBe('accept');
    });

    it('should recommend "consider" for slightly unfair trades against you', () => {
      expect(getTradeRecommendation('slightly_unfair_against')).toBe('consider');
    });

    it('should recommend "negotiate" for unfair trades against you', () => {
      expect(getTradeRecommendation('unfair_against')).toBe('negotiate');
    });

    it('should recommend "decline" for very unfair trades against you', () => {
      expect(getTradeRecommendation('very_unfair_against')).toBe('decline');
    });
  });

  // ============================================================================
  // MAIN EVALUATION
  // ============================================================================

  describe('evaluateTrade', () => {
    it('should evaluate a fair trade', () => {
      const offering = [createTradeCard('sv1-1', 10, 1)];
      const receiving = [createTradeCard('sv1-2', 10, 1)];

      const result = evaluateTrade(offering, receiving);

      expect(result.isFair).toBe(true);
      expect(result.fairnessRating).toBe('fair');
      expect(result.valueDifference).toBe(0);
      expect(result.recommendation).toBe('accept');
    });

    it('should evaluate a trade in your favor', () => {
      const offering = [createTradeCard('sv1-1', 5, 1)];
      const receiving = [createTradeCard('sv1-2', 20, 1)];

      const result = evaluateTrade(offering, receiving);

      expect(result.isFair).toBe(false);
      expect(result.valueDifference).toBe(15);
      expect(result.fairnessRating).toContain('unfair_for');
    });

    it('should evaluate a trade against you', () => {
      const offering = [createTradeCard('sv1-1', 20, 1)];
      const receiving = [createTradeCard('sv1-2', 5, 1)];

      const result = evaluateTrade(offering, receiving);

      expect(result.isFair).toBe(false);
      expect(result.valueDifference).toBe(-15);
      expect(result.fairnessRating).toContain('unfair_against');
    });

    it('should handle multiple cards', () => {
      const offering = [createTradeCard('sv1-1', 5, 2), createTradeCard('sv1-2', 3, 1)];
      const receiving = [createTradeCard('sv1-3', 10, 1), createTradeCard('sv1-4', 2, 1)];

      const result = evaluateTrade(offering, receiving);

      expect(result.offeringSide.totalValue).toBe(13); // 5*2 + 3*1
      expect(result.receivingSide.totalValue).toBe(12); // 10*1 + 2*1
    });

    it('should handle unpriced cards', () => {
      const offering = [createTradeCard('sv1-1', 10, 1), createTradeCard('sv1-2', null, 1)];
      const receiving = [createTradeCard('sv1-3', 10, 1)];

      const result = evaluateTrade(offering, receiving);

      expect(result.offeringSide.unvaluedCardCount).toBe(1);
      expect(result.offeringSide.valuedCardCount).toBe(1);
    });

    it('should include message and detailed message', () => {
      const offering = [createTradeCard('sv1-1', 10, 1)];
      const receiving = [createTradeCard('sv1-2', 10, 1)];

      const result = evaluateTrade(offering, receiving);

      expect(result.message).toBeTruthy();
      expect(result.detailedMessage).toBeTruthy();
      expect(result.detailedMessage).toContain('$10.00');
    });
  });

  describe('evaluateTradeFromInputs', () => {
    it('should evaluate trade from simple inputs', () => {
      const offeringInputs: SimpleTradeInput[] = [{ cardId: 'sv1-1', quantity: 1 }];
      const receivingInputs: SimpleTradeInput[] = [{ cardId: 'sv1-2', quantity: 1 }];
      const cardDataMap = createCardDataMap([
        { cardId: 'sv1-1', price: 10 },
        { cardId: 'sv1-2', price: 10 },
      ]);

      const result = evaluateTradeFromInputs(offeringInputs, receivingInputs, cardDataMap);

      expect(result.isFair).toBe(true);
      expect(result.offeringSide.totalValue).toBe(10);
      expect(result.receivingSide.totalValue).toBe(10);
    });
  });

  // ============================================================================
  // MESSAGE GENERATION
  // ============================================================================

  describe('getTradeMessage', () => {
    it('should return appropriate messages for each rating', () => {
      expect(getTradeMessage('fair', 0)).toBe('This trade looks fair!');
      expect(getTradeMessage('slightly_unfair_for', 5)).toContain('more value');
      expect(getTradeMessage('slightly_unfair_against', -5)).toContain('giving away');
      expect(getTradeMessage('very_unfair_for', 50)).toContain('good deal');
      expect(getTradeMessage('very_unfair_against', -50)).toContain('Stop');
    });
  });

  describe('getDetailedTradeMessage', () => {
    it('should include value breakdown', () => {
      const offeringSide: TradeSide = {
        cards: [],
        totalValue: 10,
        valuedCardCount: 1,
        unvaluedCardCount: 0,
      };
      const receivingSide: TradeSide = {
        cards: [],
        totalValue: 15,
        valuedCardCount: 1,
        unvaluedCardCount: 0,
      };

      const message = getDetailedTradeMessage('unfair_for', offeringSide, receivingSide, 5);

      expect(message).toContain('$10.00');
      expect(message).toContain('$15.00');
      expect(message).toContain('$5.00');
    });

    it('should mention unpriced cards', () => {
      const offeringSide: TradeSide = {
        cards: [],
        totalValue: 10,
        valuedCardCount: 1,
        unvaluedCardCount: 1,
      };
      const receivingSide: TradeSide = {
        cards: [],
        totalValue: 10,
        valuedCardCount: 1,
        unvaluedCardCount: 1,
      };

      const message = getDetailedTradeMessage('fair', offeringSide, receivingSide, 0);

      expect(message).toContain("2 cards couldn't be priced");
    });
  });

  describe('getFairnessEmoji', () => {
    it('should return correct indicators', () => {
      expect(getFairnessEmoji('fair')).toBe('=');
      expect(getFairnessEmoji('slightly_unfair_for')).toBe('+');
      expect(getFairnessEmoji('slightly_unfair_against')).toBe('-');
      expect(getFairnessEmoji('unfair_for')).toBe('++');
      expect(getFairnessEmoji('unfair_against')).toBe('--');
      expect(getFairnessEmoji('very_unfair_for')).toBe('+++');
      expect(getFairnessEmoji('very_unfair_against')).toBe('---');
    });
  });

  describe('getFairnessColor', () => {
    it('should return green for fair trades', () => {
      expect(getFairnessColor('fair')).toBe('green');
    });

    it('should return blue for trades in your favor', () => {
      expect(getFairnessColor('slightly_unfair_for')).toBe('blue');
      expect(getFairnessColor('unfair_for')).toBe('blue');
      expect(getFairnessColor('very_unfair_for')).toBe('blue');
    });

    it('should return warning colors for trades against you', () => {
      expect(getFairnessColor('slightly_unfair_against')).toBe('yellow');
      expect(getFairnessColor('unfair_against')).toBe('orange');
      expect(getFairnessColor('very_unfair_against')).toBe('red');
    });
  });

  describe('getFairnessDisplayLabel', () => {
    it('should return human-readable labels', () => {
      expect(getFairnessDisplayLabel('fair')).toBe('Fair Trade');
      expect(getFairnessDisplayLabel('slightly_unfair_for')).toBe('Slightly In Your Favor');
      expect(getFairnessDisplayLabel('very_unfair_against')).toBe('Very Bad Deal');
    });
  });

  describe('getRecommendationDisplayLabel', () => {
    it('should return kid-friendly labels', () => {
      expect(getRecommendationDisplayLabel('accept')).toBe('Go for it!');
      expect(getRecommendationDisplayLabel('consider')).toBe('Think about it');
      expect(getRecommendationDisplayLabel('negotiate')).toBe('Ask for more');
      expect(getRecommendationDisplayLabel('decline')).toBe('Skip this trade');
    });
  });

  // ============================================================================
  // TRADE ANALYSIS
  // ============================================================================

  describe('getMostValuableTradeCard', () => {
    it('should return the most valuable card', () => {
      const side: TradeSide = {
        cards: [
          createTradeCard('sv1-1', 5, 1),
          createTradeCard('sv1-2', 20, 1),
          createTradeCard('sv1-3', 10, 1),
        ],
        totalValue: 35,
        valuedCardCount: 3,
        unvaluedCardCount: 0,
      };

      const mostValuable = getMostValuableTradeCard(side);

      expect(mostValuable?.cardId).toBe('sv1-2');
      expect(mostValuable?.unitPrice).toBe(20);
    });

    it('should consider quantity', () => {
      const side: TradeSide = {
        cards: [
          createTradeCard('sv1-1', 10, 3), // Total: 30
          createTradeCard('sv1-2', 25, 1), // Total: 25
        ],
        totalValue: 55,
        valuedCardCount: 2,
        unvaluedCardCount: 0,
      };

      const mostValuable = getMostValuableTradeCard(side);

      expect(mostValuable?.cardId).toBe('sv1-1');
    });

    it('should return null for empty side', () => {
      const side: TradeSide = {
        cards: [],
        totalValue: 0,
        valuedCardCount: 0,
        unvaluedCardCount: 0,
      };

      expect(getMostValuableTradeCard(side)).toBeNull();
    });

    it('should return null if no cards have pricing', () => {
      const side: TradeSide = {
        cards: [createTradeCard('sv1-1', null, 1)],
        totalValue: 0,
        valuedCardCount: 0,
        unvaluedCardCount: 1,
      };

      expect(getMostValuableTradeCard(side)).toBeNull();
    });
  });

  describe('calculateValueNeededForFairTrade', () => {
    it('should return 0 for already fair trades', () => {
      expect(calculateValueNeededForFairTrade(10, 10)).toBe(0);
      expect(calculateValueNeededForFairTrade(10, 11)).toBe(0); // Within 10%
    });

    it('should return 0 when trade is in your favor', () => {
      expect(calculateValueNeededForFairTrade(5, 20)).toBe(0);
    });

    it('should return value needed when trade is against you', () => {
      // Offering 20, receiving 10
      // Need to balance to within 10%
      const needed = calculateValueNeededForFairTrade(20, 10);
      expect(needed).toBeGreaterThan(0);
    });
  });

  describe('suggestBalancingCards', () => {
    it('should return empty array when trade is fair or in your favor', () => {
      const available = [createTradeCard('sv1-1', 10, 2)];

      expect(suggestBalancingCards(0, available)).toEqual([]);
      expect(suggestBalancingCards(5, available)).toEqual([]);
    });

    it('should suggest cards when trade is against you', () => {
      const available = [createTradeCard('sv1-1', 10, 2), createTradeCard('sv1-2', 5, 3)];

      const suggestions = suggestBalancingCards(-15, available);

      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should prioritize higher-value cards', () => {
      const available = [createTradeCard('sv1-1', 5, 5), createTradeCard('sv1-2', 15, 2)];

      const suggestions = suggestBalancingCards(-15, available);

      expect(suggestions[0].cardId).toBe('sv1-2');
    });

    it('should skip unpriced cards', () => {
      const available = [createTradeCard('sv1-1', null, 5), createTradeCard('sv1-2', 10, 2)];

      const suggestions = suggestBalancingCards(-15, available);

      expect(suggestions.every((c) => c.unitPrice !== null)).toBe(true);
    });
  });

  describe('hasReliablePricing', () => {
    it('should return true when >50% of cards are priced', () => {
      const result: TradeFairnessResult = {
        isFair: true,
        fairnessRating: 'fair',
        offeringSide: {
          cards: [createTradeCard('sv1-1', 5, 1), createTradeCard('sv1-2', 5, 1)],
          totalValue: 10,
          valuedCardCount: 2,
          unvaluedCardCount: 0,
        },
        receivingSide: {
          cards: [createTradeCard('sv1-3', 5, 1), createTradeCard('sv1-4', 5, 1)],
          totalValue: 10,
          valuedCardCount: 2,
          unvaluedCardCount: 0,
        },
        valueDifference: 0,
        valueDifferencePercent: 0,
        message: '',
        detailedMessage: '',
        recommendation: 'accept',
      };

      expect(hasReliablePricing(result)).toBe(true);
    });

    it('should return false when <=50% of cards are priced', () => {
      const result: TradeFairnessResult = {
        isFair: true,
        fairnessRating: 'fair',
        offeringSide: {
          cards: [createTradeCard('sv1-1', 10, 1), createTradeCard('sv1-2', null, 1)],
          totalValue: 10,
          valuedCardCount: 1,
          unvaluedCardCount: 1,
        },
        receivingSide: {
          cards: [createTradeCard('sv1-3', null, 1), createTradeCard('sv1-4', null, 1)],
          totalValue: 10,
          valuedCardCount: 0,
          unvaluedCardCount: 2,
        },
        valueDifference: 0,
        valueDifferencePercent: 0,
        message: '',
        detailedMessage: '',
        recommendation: 'accept',
      };

      expect(hasReliablePricing(result)).toBe(false);
    });

    it('should return false for empty trade', () => {
      const result: TradeFairnessResult = {
        isFair: true,
        fairnessRating: 'fair',
        offeringSide: {
          cards: [],
          totalValue: 0,
          valuedCardCount: 0,
          unvaluedCardCount: 0,
        },
        receivingSide: {
          cards: [],
          totalValue: 0,
          valuedCardCount: 0,
          unvaluedCardCount: 0,
        },
        valueDifference: 0,
        valueDifferencePercent: 0,
        message: '',
        detailedMessage: '',
        recommendation: 'accept',
      };

      expect(hasReliablePricing(result)).toBe(false);
    });
  });

  describe('getPricingWarning', () => {
    it('should return null when pricing is reliable', () => {
      const result: TradeFairnessResult = {
        isFair: true,
        fairnessRating: 'fair',
        offeringSide: {
          cards: [createTradeCard('sv1-1', 5, 1), createTradeCard('sv1-2', 5, 1)],
          totalValue: 10,
          valuedCardCount: 2,
          unvaluedCardCount: 0,
        },
        receivingSide: {
          cards: [createTradeCard('sv1-3', 5, 1), createTradeCard('sv1-4', 5, 1)],
          totalValue: 10,
          valuedCardCount: 2,
          unvaluedCardCount: 0,
        },
        valueDifference: 0,
        valueDifferencePercent: 0,
        message: '',
        detailedMessage: '',
        recommendation: 'accept',
      };

      expect(getPricingWarning(result)).toBeNull();
    });

    it('should return warning when pricing is unreliable', () => {
      const result: TradeFairnessResult = {
        isFair: true,
        fairnessRating: 'fair',
        offeringSide: {
          cards: [
            createTradeCard('sv1-1', 10, 1),
            createTradeCard('sv1-2', null, 1),
            createTradeCard('sv1-3', null, 1),
          ],
          totalValue: 10,
          valuedCardCount: 1,
          unvaluedCardCount: 2,
        },
        receivingSide: {
          cards: [createTradeCard('sv1-4', null, 1)],
          totalValue: 10,
          valuedCardCount: 0,
          unvaluedCardCount: 1,
        },
        valueDifference: 0,
        valueDifferencePercent: 0,
        message: '',
        detailedMessage: '',
        recommendation: 'accept',
      };

      const warning = getPricingWarning(result);

      expect(warning).toBeTruthy();
      expect(warning).toContain('3 cards');
    });
  });

  // ============================================================================
  // SUMMARY
  // ============================================================================

  describe('formatValueDifference', () => {
    it('should format positive differences with +', () => {
      expect(formatValueDifference(10)).toBe('+$10.00');
    });

    it('should format negative differences with -', () => {
      expect(formatValueDifference(-10)).toBe('-$10.00');
    });

    it('should format zero without sign', () => {
      expect(formatValueDifference(0)).toBe('$0.00');
    });
  });

  describe('createTradeSummary', () => {
    it('should create complete trade summary', () => {
      const offering = [createTradeCard('sv1-1', 10, 1)];
      const receiving = [createTradeCard('sv1-2', 10, 1)];
      const result = evaluateTrade(offering, receiving);

      const summary = createTradeSummary(result);

      expect(summary.fairnessRating).toBe('fair');
      expect(summary.fairnessLabel).toBe('Fair Trade');
      expect(summary.fairnessColor).toBe('green');
      expect(summary.recommendation).toBe('accept');
      expect(summary.recommendationLabel).toBe('Go for it!');
      expect(summary.offeringTotal).toBe('$10.00');
      expect(summary.receivingTotal).toBe('$10.00');
      expect(summary.isFair).toBe(true);
    });
  });

  // ============================================================================
  // INTEGRATION SCENARIOS
  // ============================================================================

  describe('Integration Scenarios', () => {
    it('Scenario: Kids trading Pikachu cards', () => {
      // Kid 1 offers a Pikachu ($5) for Kid 2's Charizard ($50)
      const offering = [createTradeCard('sv1-pikachu', 5, 1, 'Pikachu')];
      const receiving = [createTradeCard('sv1-charizard', 50, 1, 'Charizard')];

      const result = evaluateTrade(offering, receiving);
      const summary = createTradeSummary(result);

      expect(result.isFair).toBe(false);
      expect(result.fairnessRating).toBe('very_unfair_for');
      expect(summary.fairnessColor).toBe('blue'); // Good for you!
      expect(summary.recommendationLabel).toBe('Go for it!');
    });

    it('Scenario: Fair trade between siblings', () => {
      // Sibling 1 offers 3 commons ($2 each = $6) for a rare ($5.50)
      // Difference is $0.50, average is $5.75, percent diff = -8.7% (within 10%)
      const offering = [
        createTradeCard('sv1-1', 2, 1, 'Bulbasaur'),
        createTradeCard('sv1-2', 2, 1, 'Squirtle'),
        createTradeCard('sv1-3', 2, 1, 'Charmander'),
      ];
      const receiving = [createTradeCard('sv1-50', 5.5, 1, 'Rare Holo')];

      const result = evaluateTrade(offering, receiving);

      expect(result.isFair).toBe(true);
      expect(result.valueDifference).toBe(-0.5); // $6 - $5.50
    });

    it('Scenario: Trade with unpriced cards', () => {
      // More unpriced cards to trigger warning (>50% unpriced)
      const offering = [
        createTradeCard('sv1-1', 10, 1, 'Pikachu'),
        createTradeCard('promo-1', null, 1, 'Unknown Promo 1'),
        createTradeCard('promo-2', null, 1, 'Unknown Promo 2'),
      ];
      const receiving = [
        createTradeCard('sv1-2', 10, 1, 'Raichu'),
        createTradeCard('promo-3', null, 1, 'Unknown Promo 3'),
      ];

      const result = evaluateTrade(offering, receiving);
      const warning = getPricingWarning(result);

      // 3 unpriced out of 5 total = 60% unpriced (> 50% threshold)
      expect(result.offeringSide.unvaluedCardCount).toBe(2);
      expect(result.receivingSide.unvaluedCardCount).toBe(1);
      expect(warning).toBeTruthy();
      expect(warning).toContain("3 cards couldn't be priced");
    });

    it('Scenario: Large quantity trade', () => {
      // Trading 10 bulk cards ($0.20 each = $2.00) for 1 uncommon ($2)
      // Same value = fair trade
      const offering = [createTradeCard('sv1-common', 0.2, 10, 'Common Card')];
      const receiving = [createTradeCard('sv1-uncommon', 2, 1, 'Uncommon Card')];

      const result = evaluateTrade(offering, receiving);

      expect(result.offeringSide.totalValue).toBe(2);
      expect(result.receivingSide.totalValue).toBe(2);
      expect(result.isFair).toBe(true); // Same value = fair
    });

    it('Scenario: Parent checking if trade is fair for their kid', () => {
      // Kid wants to trade their Charizard VMAX ($100) for 5 common cards ($0.50 each)
      const kidsOffering = [createTradeCard('swsh-charizard', 100, 1, 'Charizard VMAX')];
      const kidsReceiving = [createTradeCard('sv1-common', 0.5, 5, 'Common Cards')];

      const result = evaluateTrade(kidsOffering, kidsReceiving);

      expect(result.isFair).toBe(false);
      expect(result.fairnessRating).toBe('very_unfair_against');
      expect(result.recommendation).toBe('decline');
      expect(result.message).toContain('Stop');
    });
  });
});
