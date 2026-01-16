import { v } from 'convex/values';
import { query } from './_generated/server';

// Card variant type for consistent typing
const cardVariant = v.union(
  v.literal('normal'),
  v.literal('holofoil'),
  v.literal('reverseHolofoil'),
  v.literal('1stEditionHolofoil'),
  v.literal('1stEditionNormal')
);

// Trade card input validator
const tradeCardInput = v.object({
  cardId: v.string(),
  quantity: v.number(),
  variant: v.optional(cardVariant),
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Evaluates the fairness of a proposed trade.
 * Takes card IDs and quantities for both sides and returns a fairness analysis.
 *
 * @param offeringCards - Cards you are giving away
 * @param receivingCards - Cards you are receiving
 * @returns Trade fairness result with ratings, values, and recommendations
 */
export const evaluateTrade = query({
  args: {
    offeringCards: v.array(tradeCardInput),
    receivingCards: v.array(tradeCardInput),
  },
  handler: async (ctx, args) => {
    // Collect all unique card IDs for price lookup
    const allCardIds = new Set([
      ...args.offeringCards.map((c) => c.cardId),
      ...args.receivingCards.map((c) => c.cardId),
    ]);

    // Fetch card data from cache
    const cardDataPromises = Array.from(allCardIds).map((cardId) =>
      ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
        .first()
    );

    const cachedCards = await Promise.all(cardDataPromises);

    // Build card data map for lookups
    const cardDataMap = new Map<
      string,
      {
        price: number;
        name: string;
        imageSmall: string;
        rarity?: string;
      }
    >();

    for (const card of cachedCards) {
      if (card && card.priceMarket !== undefined && card.priceMarket !== null) {
        cardDataMap.set(card.cardId, {
          price: card.priceMarket,
          name: card.name,
          imageSmall: card.imageSmall,
          rarity: card.rarity ?? undefined,
        });
      } else if (card) {
        // Include card without price
        cardDataMap.set(card.cardId, {
          price: 0,
          name: card.name,
          imageSmall: card.imageSmall,
          rarity: card.rarity ?? undefined,
        });
      }
    }

    // Build trade cards with price data
    const offeringTradeCards = args.offeringCards.map((input) => {
      const cardData = cardDataMap.get(input.cardId);
      return {
        cardId: input.cardId,
        name: cardData?.name ?? input.cardId,
        quantity: input.quantity,
        unitPrice: cardData?.price && cardData.price > 0 ? cardData.price : null,
        variant: input.variant ?? 'normal',
        imageSmall: cardData?.imageSmall,
        rarity: cardData?.rarity,
      };
    });

    const receivingTradeCards = args.receivingCards.map((input) => {
      const cardData = cardDataMap.get(input.cardId);
      return {
        cardId: input.cardId,
        name: cardData?.name ?? input.cardId,
        quantity: input.quantity,
        unitPrice: cardData?.price && cardData.price > 0 ? cardData.price : null,
        variant: input.variant ?? 'normal',
        imageSmall: cardData?.imageSmall,
        rarity: cardData?.rarity,
      };
    });

    // Calculate trade sides
    const offeringSide = calculateTradeSide(offeringTradeCards);
    const receivingSide = calculateTradeSide(receivingTradeCards);

    const valueDifference = roundToCents(receivingSide.totalValue - offeringSide.totalValue);
    const valueDifferencePercent = calculatePercentDifference(
      offeringSide.totalValue,
      receivingSide.totalValue
    );

    const fairnessRating = getFairnessRating(valueDifferencePercent);
    const isFair = isTradeFair(valueDifferencePercent);
    const recommendation = getTradeRecommendation(fairnessRating);

    const message = getTradeMessage(fairnessRating);
    const detailedMessage = getDetailedTradeMessage(offeringSide, receivingSide, valueDifference);

    // Check pricing reliability
    const totalCards = offeringTradeCards.length + receivingTradeCards.length;
    const totalUnpriced = offeringSide.unvaluedCardCount + receivingSide.unvaluedCardCount;
    const hasReliablePricing = totalCards > 0 && totalUnpriced / totalCards <= 0.5;

    let pricingWarning: string | null = null;
    if (!hasReliablePricing && totalUnpriced > 0) {
      pricingWarning = `Heads up: ${totalUnpriced} card${totalUnpriced > 1 ? 's' : ''} couldn't be priced. The fairness estimate might not be complete.`;
    }

    return {
      isFair,
      fairnessRating,
      offeringSide: {
        cards: offeringTradeCards,
        totalValue: offeringSide.totalValue,
        valuedCardCount: offeringSide.valuedCardCount,
        unvaluedCardCount: offeringSide.unvaluedCardCount,
      },
      receivingSide: {
        cards: receivingTradeCards,
        totalValue: receivingSide.totalValue,
        valuedCardCount: receivingSide.valuedCardCount,
        unvaluedCardCount: receivingSide.unvaluedCardCount,
      },
      valueDifference,
      valueDifferencePercent,
      message,
      detailedMessage,
      recommendation,
      pricingWarning,
      summary: {
        fairnessLabel: getFairnessDisplayLabel(fairnessRating),
        fairnessColor: getFairnessColor(fairnessRating),
        recommendationLabel: getRecommendationDisplayLabel(recommendation),
        offeringTotal: formatCurrency(offeringSide.totalValue),
        receivingTotal: formatCurrency(receivingSide.totalValue),
        valueDifferenceFormatted: formatValueDifference(valueDifference),
      },
    };
  },
});

/**
 * Gets card pricing data for a list of cards.
 * Useful for building trade UI before evaluation.
 */
export const getCardPrices = query({
  args: {
    cardIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const cardDataPromises = args.cardIds.map((cardId) =>
      ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
        .first()
    );

    const cachedCards = await Promise.all(cardDataPromises);

    return cachedCards.map((card, index) => ({
      cardId: args.cardIds[index],
      name: card?.name ?? args.cardIds[index],
      imageSmall: card?.imageSmall ?? null,
      priceMarket: card?.priceMarket ?? null,
      rarity: card?.rarity ?? null,
      hasPricing:
        card?.priceMarket !== undefined && card?.priceMarket !== null && card.priceMarket > 0,
    }));
  },
});

/**
 * Quick check if a trade is fair (lightweight version).
 * Returns just the fairness boolean and rating without full card details.
 */
export const isTradeBalanced = query({
  args: {
    offeringCards: v.array(tradeCardInput),
    receivingCards: v.array(tradeCardInput),
  },
  handler: async (ctx, args) => {
    // Collect all unique card IDs
    const allCardIds = new Set([
      ...args.offeringCards.map((c) => c.cardId),
      ...args.receivingCards.map((c) => c.cardId),
    ]);

    // Fetch prices
    const pricePromises = Array.from(allCardIds).map((cardId) =>
      ctx.db
        .query('cachedCards')
        .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
        .first()
    );

    const cachedCards = await Promise.all(pricePromises);

    const priceMap = new Map<string, number>();
    for (const card of cachedCards) {
      if (card?.priceMarket && card.priceMarket > 0) {
        priceMap.set(card.cardId, card.priceMarket);
      }
    }

    // Calculate values
    let offeringValue = 0;
    let receivingValue = 0;

    for (const card of args.offeringCards) {
      const price = priceMap.get(card.cardId);
      if (price) {
        offeringValue += price * card.quantity;
      }
    }

    for (const card of args.receivingCards) {
      const price = priceMap.get(card.cardId);
      if (price) {
        receivingValue += price * card.quantity;
      }
    }

    const percentDiff = calculatePercentDifference(offeringValue, receivingValue);
    const rating = getFairnessRating(percentDiff);
    const fair = isTradeFair(percentDiff);

    return {
      isFair: fair,
      fairnessRating: rating,
      offeringValue: roundToCents(offeringValue),
      receivingValue: roundToCents(receivingValue),
      valueDifference: roundToCents(receivingValue - offeringValue),
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS (duplicated from src/lib/tradingCalculator.ts for Convex)
// ============================================================================

interface TradeCard {
  cardId: string;
  name: string;
  quantity: number;
  unitPrice: number | null;
  variant?: string;
  imageSmall?: string;
  rarity?: string;
}

interface TradeSide {
  totalValue: number;
  valuedCardCount: number;
  unvaluedCardCount: number;
}

type FairnessRating =
  | 'very_unfair_against'
  | 'unfair_against'
  | 'slightly_unfair_against'
  | 'fair'
  | 'slightly_unfair_for'
  | 'unfair_for'
  | 'very_unfair_for';

type TradeRecommendation = 'accept' | 'consider' | 'negotiate' | 'decline';

const FAIRNESS_THRESHOLDS = {
  FAIR: 10,
  SLIGHT: 25,
  UNFAIR: 50,
} as const;

const MIN_TRADE_VALUE_FOR_EVALUATION = 0.5;

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function calculateTradeSide(cards: TradeCard[]): TradeSide {
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
    totalValue: roundToCents(totalValue),
    valuedCardCount,
    unvaluedCardCount,
  };
}

function calculatePercentDifference(offeringValue: number, receivingValue: number): number {
  const totalValue = offeringValue + receivingValue;
  if (totalValue < MIN_TRADE_VALUE_FOR_EVALUATION * 2) {
    return 0;
  }

  const averageValue = totalValue / 2;
  const difference = receivingValue - offeringValue;

  return roundToCents((difference / averageValue) * 100);
}

function getFairnessRating(percentDiff: number): FairnessRating {
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

function isTradeFair(percentDiff: number): boolean {
  return Math.abs(percentDiff) <= FAIRNESS_THRESHOLDS.FAIR;
}

function getTradeRecommendation(rating: FairnessRating): TradeRecommendation {
  switch (rating) {
    case 'fair':
      return 'accept';
    case 'slightly_unfair_for':
      return 'accept';
    case 'slightly_unfair_against':
      return 'consider';
    case 'unfair_for':
      return 'accept';
    case 'unfair_against':
      return 'negotiate';
    case 'very_unfair_for':
      return 'accept';
    case 'very_unfair_against':
      return 'decline';
  }
}

function getTradeMessage(rating: FairnessRating): string {
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

function getDetailedTradeMessage(
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

  const totalUnpriced = offeringSide.unvaluedCardCount + receivingSide.unvaluedCardCount;
  if (totalUnpriced > 0) {
    valueInfo += ` (${totalUnpriced} card${totalUnpriced > 1 ? 's' : ''} couldn't be priced)`;
  }

  return valueInfo;
}

function getFairnessDisplayLabel(rating: FairnessRating): string {
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

function getFairnessColor(rating: FairnessRating): string {
  switch (rating) {
    case 'fair':
      return 'green';
    case 'slightly_unfair_for':
    case 'unfair_for':
    case 'very_unfair_for':
      return 'blue';
    case 'slightly_unfair_against':
      return 'yellow';
    case 'unfair_against':
      return 'orange';
    case 'very_unfair_against':
      return 'red';
  }
}

function getRecommendationDisplayLabel(recommendation: TradeRecommendation): string {
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatValueDifference(difference: number): string {
  const formatted = formatCurrency(Math.abs(difference));
  if (difference > 0) {
    return `+${formatted}`;
  } else if (difference < 0) {
    return `-${formatted}`;
  }
  return formatted;
}
