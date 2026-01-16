/**
 * Fair Trading Calculator - Price comparison logic for "Is this trade fair?" tool.
 * Helps kids evaluate whether a proposed trade is balanced in value.
 *
 * These pure utility functions implement the core trade evaluation logic
 * that can be tested without a Convex backend.
 */

// ============================================================================
// TYPES
// ============================================================================

/** A card involved in a trade with its value information */
export interface TradeCard {
  cardId: string;
  name: string;
  quantity: number;
  unitPrice: number | null; // null if no pricing data
  variant?: string;
  imageSmall?: string;
  rarity?: string;
}

/** One side of a trade (what's being offered or received) */
export interface TradeSide {
  cards: TradeCard[];
  totalValue: number;
  valuedCardCount: number;
  unvaluedCardCount: number;
}

/** The result of a trade fairness evaluation */
export interface TradeFairnessResult {
  isFair: boolean;
  fairnessRating: FairnessRating;
  offeringSide: TradeSide;
  receivingSide: TradeSide;
  valueDifference: number; // positive = receiving more value
  valueDifferencePercent: number;
  message: string;
  detailedMessage: string;
  recommendation: TradeRecommendation;
}

/** Rating for how fair a trade is */
export type FairnessRating =
  | 'very_unfair_against' // You're giving away much more
  | 'unfair_against' // You're giving away more
  | 'slightly_unfair_against' // Slightly against you
  | 'fair' // Balanced trade
  | 'slightly_unfair_for' // Slightly in your favor
  | 'unfair_for' // You're receiving more
  | 'very_unfair_for'; // You're receiving much more

/** Recommendation for the trade */
export type TradeRecommendation = 'accept' | 'consider' | 'negotiate' | 'decline';

/** Price map type for quick lookups */
export type PriceMap = Map<string, number>;

/** Card data for enrichment */
export interface CardData {
  price: number;
  name: string;
  imageSmall?: string;
  rarity?: string;
}

/** Card data map for lookups */
export type CardDataMap = Map<string, CardData>;

/** Simple trade input (just card IDs and quantities) */
export interface SimpleTradeInput {
  cardId: string;
  quantity: number;
  variant?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Fairness thresholds (as percentage difference).
 * A trade is "fair" if the value difference is within these bounds.
 */
export const FAIRNESS_THRESHOLDS = {
  /** Trade is perfectly fair within this percentage */
  FAIR: 10, // Within 10% difference
  /** Trade is slightly unfair within this percentage */
  SLIGHT: 25, // 10-25% difference
  /** Trade is unfair within this percentage */
  UNFAIR: 50, // 25-50% difference
  /** Beyond 50% is very unfair */
} as const;

/**
 * Minimum total trade value to evaluate fairness.
 * Below this, trades are considered fair by default (low-value trades).
 */
export const MIN_TRADE_VALUE_FOR_EVALUATION = 0.5; // $0.50

/**
 * Default variant for cards without specified variant.
 */
export const DEFAULT_VARIANT = 'normal';

// ============================================================================
// TRADE SIDE CALCULATION
// ============================================================================

/**
 * Calculates the total value and stats for one side of a trade.
 */
export function calculateTradeSide(cards: TradeCard[]): TradeSide {
  let totalValue = 0;
  let valuedCardCount = 0;
  let unvaluedCardCount = 0;

  for (const card of cards) {
    if (card.unitPrice !== null && card.unitPrice > 0) {
      totalValue += card.unitPrice * card.quantity;
      valuedCardCount++;
    } else {
      unvaluedCardCount++;
    }
  }

  return {
    cards,
    totalValue: roundToCents(totalValue),
    valuedCardCount,
    unvaluedCardCount,
  };
}

/**
 * Builds TradeCard objects from simple input using card data map.
 */
export function buildTradeCards(inputs: SimpleTradeInput[], cardDataMap: CardDataMap): TradeCard[] {
  return inputs.map((input) => {
    const cardData = cardDataMap.get(input.cardId);
    return {
      cardId: input.cardId,
      name: cardData?.name ?? input.cardId,
      quantity: input.quantity,
      unitPrice: cardData?.price ?? null,
      variant: input.variant ?? DEFAULT_VARIANT,
      imageSmall: cardData?.imageSmall,
      rarity: cardData?.rarity,
    };
  });
}

// ============================================================================
// FAIRNESS CALCULATION
// ============================================================================

/**
 * Calculates the fairness rating based on percentage difference.
 * Positive percentDiff means receiving more value.
 */
export function getFairnessRating(percentDiff: number): FairnessRating {
  const absDiff = Math.abs(percentDiff);

  if (absDiff <= FAIRNESS_THRESHOLDS.FAIR) {
    return 'fair';
  }

  if (absDiff <= FAIRNESS_THRESHOLDS.SLIGHT) {
    return percentDiff > 0 ? 'slightly_unfair_for' : 'slightly_unfair_against';
  }

  if (absDiff <= FAIRNESS_THRESHOLDS.UNFAIR) {
    return percentDiff > 0 ? 'unfair_for' : 'unfair_against';
  }

  return percentDiff > 0 ? 'very_unfair_for' : 'very_unfair_against';
}

/**
 * Determines if a trade is considered "fair" (within acceptable threshold).
 */
export function isTradeFair(percentDiff: number): boolean {
  return Math.abs(percentDiff) <= FAIRNESS_THRESHOLDS.FAIR;
}

/**
 * Gets a trade recommendation based on the fairness rating.
 */
export function getTradeRecommendation(rating: FairnessRating): TradeRecommendation {
  switch (rating) {
    case 'fair':
      return 'accept';
    case 'slightly_unfair_for':
      return 'accept'; // Still good for you
    case 'slightly_unfair_against':
      return 'consider'; // Think about it
    case 'unfair_for':
      return 'accept'; // Very good for you
    case 'unfair_against':
      return 'negotiate'; // Try to get more
    case 'very_unfair_for':
      return 'accept'; // Great deal for you
    case 'very_unfair_against':
      return 'decline'; // Bad deal
  }
}

/**
 * Calculates the percentage difference between two values.
 * Returns positive if receiving > offering.
 * Returns 0 if both values are 0 or below minimum threshold.
 */
export function calculatePercentDifference(offeringValue: number, receivingValue: number): number {
  // If both sides have no value or very low value, consider it "fair"
  const totalValue = offeringValue + receivingValue;
  if (totalValue < MIN_TRADE_VALUE_FOR_EVALUATION * 2) {
    return 0;
  }

  // Calculate difference relative to the average of both sides
  const averageValue = totalValue / 2;
  const difference = receivingValue - offeringValue;

  return roundToCents((difference / averageValue) * 100);
}

// ============================================================================
// MAIN EVALUATION FUNCTION
// ============================================================================

/**
 * Evaluates the fairness of a trade.
 *
 * @param offeringCards - Cards you are giving away
 * @param receivingCards - Cards you are receiving
 * @returns TradeFairnessResult with fairness rating and recommendations
 */
export function evaluateTrade(
  offeringCards: TradeCard[],
  receivingCards: TradeCard[]
): TradeFairnessResult {
  const offeringSide = calculateTradeSide(offeringCards);
  const receivingSide = calculateTradeSide(receivingCards);

  const valueDifference = roundToCents(receivingSide.totalValue - offeringSide.totalValue);
  const valueDifferencePercent = calculatePercentDifference(
    offeringSide.totalValue,
    receivingSide.totalValue
  );

  const fairnessRating = getFairnessRating(valueDifferencePercent);
  const isFair = isTradeFair(valueDifferencePercent);
  const recommendation = getTradeRecommendation(fairnessRating);

  const message = getTradeMessage(fairnessRating, valueDifference);
  const detailedMessage = getDetailedTradeMessage(
    fairnessRating,
    offeringSide,
    receivingSide,
    valueDifference
  );

  return {
    isFair,
    fairnessRating,
    offeringSide,
    receivingSide,
    valueDifference,
    valueDifferencePercent,
    message,
    detailedMessage,
    recommendation,
  };
}

/**
 * Convenience function to evaluate a trade from simple inputs.
 */
export function evaluateTradeFromInputs(
  offeringInputs: SimpleTradeInput[],
  receivingInputs: SimpleTradeInput[],
  cardDataMap: CardDataMap
): TradeFairnessResult {
  const offeringCards = buildTradeCards(offeringInputs, cardDataMap);
  const receivingCards = buildTradeCards(receivingInputs, cardDataMap);
  return evaluateTrade(offeringCards, receivingCards);
}

// ============================================================================
// MESSAGE GENERATION (KID-FRIENDLY)
// ============================================================================

/**
 * Gets a short, kid-friendly message about the trade fairness.
 */
export function getTradeMessage(rating: FairnessRating, valueDifference: number): string {
  switch (rating) {
    case 'fair':
      return 'This trade looks fair!';
    case 'slightly_unfair_for':
      return "Nice! You're getting a bit more value.";
    case 'slightly_unfair_against':
      return "Hmm, you're giving away a little more.";
    case 'unfair_for':
      return "Great deal! You're getting more value.";
    case 'unfair_against':
      return "Wait! You're giving away more than you're getting.";
    case 'very_unfair_for':
      return 'Wow! This is a really good deal for you!';
    case 'very_unfair_against':
      return "Stop! You're giving away a lot more than you're getting.";
  }
}

/**
 * Gets a detailed message with value breakdown.
 */
export function getDetailedTradeMessage(
  rating: FairnessRating,
  offeringSide: TradeSide,
  receivingSide: TradeSide,
  valueDifference: number
): string {
  const offering = formatCurrency(offeringSide.totalValue);
  const receiving = formatCurrency(receivingSide.totalValue);
  const diff = formatCurrency(Math.abs(valueDifference));

  let valueInfo = `You're giving ${offering} and getting ${receiving}.`;

  if (valueDifference > 0) {
    valueInfo += ` That's ${diff} more in value for you!`;
  } else if (valueDifference < 0) {
    valueInfo += ` That's ${diff} more value you're giving away.`;
  }

  // Add context about unpriced cards
  const totalUnpriced = offeringSide.unvaluedCardCount + receivingSide.unvaluedCardCount;
  if (totalUnpriced > 0) {
    valueInfo += ` (${totalUnpriced} card${totalUnpriced > 1 ? 's' : ''} couldn't be priced)`;
  }

  return valueInfo;
}

/**
 * Gets an emoji indicator for the fairness rating.
 */
export function getFairnessEmoji(rating: FairnessRating): string {
  switch (rating) {
    case 'fair':
      return '=';
    case 'slightly_unfair_for':
      return '+';
    case 'slightly_unfair_against':
      return '-';
    case 'unfair_for':
      return '++';
    case 'unfair_against':
      return '--';
    case 'very_unfair_for':
      return '+++';
    case 'very_unfair_against':
      return '---';
  }
}

/**
 * Gets a color indicator for UI display.
 */
export function getFairnessColor(rating: FairnessRating): string {
  switch (rating) {
    case 'fair':
      return 'green';
    case 'slightly_unfair_for':
    case 'unfair_for':
    case 'very_unfair_for':
      return 'blue'; // Good for you
    case 'slightly_unfair_against':
      return 'yellow'; // Caution
    case 'unfair_against':
      return 'orange'; // Warning
    case 'very_unfair_against':
      return 'red'; // Danger
  }
}

/**
 * Gets display label for fairness rating.
 */
export function getFairnessDisplayLabel(rating: FairnessRating): string {
  switch (rating) {
    case 'fair':
      return 'Fair Trade';
    case 'slightly_unfair_for':
      return 'Slightly In Your Favor';
    case 'slightly_unfair_against':
      return 'Slightly Against You';
    case 'unfair_for':
      return 'Good Deal For You';
    case 'unfair_against':
      return 'Bad Deal For You';
    case 'very_unfair_for':
      return 'Great Deal For You';
    case 'very_unfair_against':
      return 'Very Bad Deal';
  }
}

/**
 * Gets display label for trade recommendation.
 */
export function getRecommendationDisplayLabel(recommendation: TradeRecommendation): string {
  switch (recommendation) {
    case 'accept':
      return 'Go for it!';
    case 'consider':
      return 'Think about it';
    case 'negotiate':
      return 'Ask for more';
    case 'decline':
      return 'Skip this trade';
  }
}

// ============================================================================
// TRADE ANALYSIS UTILITIES
// ============================================================================

/**
 * Gets the most valuable card in a trade side.
 */
export function getMostValuableTradeCard(side: TradeSide): TradeCard | null {
  if (side.cards.length === 0) return null;

  const valuedCards = side.cards.filter((c) => c.unitPrice !== null && c.unitPrice > 0);
  if (valuedCards.length === 0) return null;

  return valuedCards.reduce((max, card) => {
    const maxValue = (max.unitPrice ?? 0) * max.quantity;
    const cardValue = (card.unitPrice ?? 0) * card.quantity;
    return cardValue > maxValue ? card : max;
  });
}

/**
 * Calculates what additional value is needed to make a trade fair.
 * Returns positive if you need to add more to your offering,
 * negative if the other side needs to add more.
 */
export function calculateValueNeededForFairTrade(
  offeringValue: number,
  receivingValue: number
): number {
  const difference = receivingValue - offeringValue;

  // Calculate the threshold amount based on average value
  const avgValue = (offeringValue + receivingValue) / 2;
  const fairnessBuffer = avgValue * (FAIRNESS_THRESHOLDS.FAIR / 100);

  if (Math.abs(difference) <= fairnessBuffer) {
    return 0; // Already fair
  }

  // Return the amount needed to bring it within the fair threshold
  if (difference > 0) {
    // You're getting more, trade is in your favor
    return 0; // No action needed from you
  } else {
    // You're giving more, need more from the other side
    return roundToCents(Math.abs(difference) - fairnessBuffer);
  }
}

/**
 * Suggests cards from a collection that could balance a trade.
 * Returns cards from the receiving side's available cards that
 * could be added to make the trade fairer.
 */
export function suggestBalancingCards(
  valueDifference: number,
  availableCards: TradeCard[]
): TradeCard[] {
  if (valueDifference >= 0) {
    return []; // Trade is already fair or in your favor
  }

  const needed = Math.abs(valueDifference);
  const pricedCards = availableCards
    .filter((c) => c.unitPrice !== null && c.unitPrice > 0)
    .sort((a, b) => (b.unitPrice ?? 0) - (a.unitPrice ?? 0)); // Sort by price descending

  const suggestions: TradeCard[] = [];
  let remaining = needed;

  for (const card of pricedCards) {
    if (remaining <= 0) break;

    // Find how many of this card would be helpful
    const cardValue = card.unitPrice!;
    const countNeeded = Math.min(card.quantity, Math.ceil(remaining / cardValue));

    if (countNeeded > 0) {
      suggestions.push({
        ...card,
        quantity: countNeeded,
      });
      remaining -= cardValue * countNeeded;
    }
  }

  return suggestions;
}

/**
 * Checks if a trade has enough pricing data for a reliable evaluation.
 */
export function hasReliablePricing(result: TradeFairnessResult): boolean {
  const totalCards = result.offeringSide.cards.length + result.receivingSide.cards.length;
  const unvaluedCards =
    result.offeringSide.unvaluedCardCount + result.receivingSide.unvaluedCardCount;

  if (totalCards === 0) return false;

  // Consider pricing reliable if at least 50% of cards are priced
  return unvaluedCards / totalCards <= 0.5;
}

/**
 * Gets a warning message if pricing data is incomplete.
 */
export function getPricingWarning(result: TradeFairnessResult): string | null {
  if (hasReliablePricing(result)) return null;

  const totalUnpriced =
    result.offeringSide.unvaluedCardCount + result.receivingSide.unvaluedCardCount;

  return `Heads up: ${totalUnpriced} card${totalUnpriced > 1 ? 's' : ''} couldn't be priced. The fairness estimate might not be complete.`;
}

// ============================================================================
// TRADE SUMMARY & FORMATTING
// ============================================================================

/**
 * Creates a complete trade summary for display.
 */
export interface TradeSummary {
  fairnessRating: FairnessRating;
  fairnessLabel: string;
  fairnessColor: string;
  recommendation: TradeRecommendation;
  recommendationLabel: string;
  message: string;
  detailedMessage: string;
  pricingWarning: string | null;
  offeringTotal: string;
  receivingTotal: string;
  valueDifference: string;
  isFair: boolean;
}

/**
 * Creates a formatted trade summary for UI display.
 */
export function createTradeSummary(result: TradeFairnessResult): TradeSummary {
  return {
    fairnessRating: result.fairnessRating,
    fairnessLabel: getFairnessDisplayLabel(result.fairnessRating),
    fairnessColor: getFairnessColor(result.fairnessRating),
    recommendation: result.recommendation,
    recommendationLabel: getRecommendationDisplayLabel(result.recommendation),
    message: result.message,
    detailedMessage: result.detailedMessage,
    pricingWarning: getPricingWarning(result),
    offeringTotal: formatCurrency(result.offeringSide.totalValue),
    receivingTotal: formatCurrency(result.receivingSide.totalValue),
    valueDifference: formatValueDifference(result.valueDifference),
    isFair: result.isFair,
  };
}

/**
 * Formats a value difference for display.
 */
export function formatValueDifference(difference: number): string {
  const formatted = formatCurrency(Math.abs(difference));
  if (difference > 0) {
    return `+${formatted}`;
  } else if (difference < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Rounds a value to cents (2 decimal places).
 */
export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Formats a currency value for display.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Validates that a trade has at least one card on each side.
 */
export function isValidTrade(offeringCards: TradeCard[], receivingCards: TradeCard[]): boolean {
  return offeringCards.length > 0 && receivingCards.length > 0;
}

/**
 * Gets the total card count for a trade side.
 */
export function getTotalCardCount(side: TradeSide): number {
  return side.cards.reduce((sum, card) => sum + card.quantity, 0);
}

/**
 * Checks if all cards in a trade side have pricing data.
 */
export function hasCompletePricing(side: TradeSide): boolean {
  return side.unvaluedCardCount === 0;
}
