/**
 * Pure utility functions for collection value calculations.
 * These functions implement the core logic for calculating
 * collection values that can be tested without a Convex backend.
 */

import { CardVariant, CollectionCard, extractSetId } from './collections';

// ============================================================================
// TYPES
// ============================================================================

/** Card with price data for value calculations */
export interface PricedCard {
  cardId: string;
  name: string;
  imageSmall: string;
  priceMarket: number | null | undefined;
  setId?: string;
  rarity?: string;
}

/** Collection card with quantity and variant info */
export interface CollectionCardWithVariant {
  cardId: string;
  quantity: number;
  variant?: CardVariant | string;
}

/** Result of collection value calculation */
export interface CollectionValueResult {
  totalValue: number;
  valuedCardsCount: number;
  unvaluedCardsCount: number;
  totalCardsCount: number;
}

/** Card with calculated value for display */
export interface ValuedCard {
  cardId: string;
  name: string;
  imageSmall: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  setId?: string;
  rarity?: string;
}

/** Set value breakdown */
export interface SetValue {
  setId: string;
  setName: string;
  totalValue: number;
  cardCount: number;
  valuedCardCount: number;
}

/** Price map type for quick lookups */
export type PriceMap = Map<string, number>;

/** Card data map for enrichment */
export type CardDataMap = Map<
  string,
  {
    price: number;
    name: string;
    imageSmall: string;
    setId?: string;
    rarity?: string;
  }
>;

// ============================================================================
// CONSTANTS
// ============================================================================

/** Minimum price threshold - prices below this are considered "no price" */
export const MIN_PRICE_THRESHOLD = 0;

/** Maximum number of "most valuable" cards to return by default */
export const DEFAULT_TOP_CARDS_LIMIT = 10;

// ============================================================================
// PRICE VALIDATION
// ============================================================================

/**
 * Checks if a price value is valid (numeric and positive).
 */
export function isValidPrice(price: unknown): price is number {
  return typeof price === 'number' && !isNaN(price) && price > MIN_PRICE_THRESHOLD;
}

/**
 * Safely parses a price, returning null if invalid.
 */
export function parsePrice(price: unknown): number | null {
  if (isValidPrice(price)) {
    return price;
  }
  if (typeof price === 'string') {
    const parsed = parseFloat(price);
    if (!isNaN(parsed) && parsed > MIN_PRICE_THRESHOLD) {
      return parsed;
    }
  }
  return null;
}

/**
 * Rounds a value to cents (2 decimal places).
 */
export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

// ============================================================================
// PRICE MAP BUILDING
// ============================================================================

/**
 * Builds a price map from an array of priced cards.
 * Only includes cards with valid prices > 0.
 */
export function buildPriceMap(pricedCards: PricedCard[]): PriceMap {
  const priceMap = new Map<string, number>();

  for (const card of pricedCards) {
    const price = parsePrice(card.priceMarket);
    if (price !== null) {
      priceMap.set(card.cardId, price);
    }
  }

  return priceMap;
}

/**
 * Builds a card data map for enrichment (includes price, name, image).
 */
export function buildCardDataMap(pricedCards: PricedCard[]): CardDataMap {
  const cardDataMap = new Map<
    string,
    {
      price: number;
      name: string;
      imageSmall: string;
      setId?: string;
      rarity?: string;
    }
  >();

  for (const card of pricedCards) {
    const price = parsePrice(card.priceMarket);
    if (price !== null) {
      cardDataMap.set(card.cardId, {
        price,
        name: card.name,
        imageSmall: card.imageSmall,
        setId: card.setId,
        rarity: card.rarity,
      });
    }
  }

  return cardDataMap;
}

// ============================================================================
// VALUE CALCULATION
// ============================================================================

/**
 * Calculates the total value of a collection.
 */
export function calculateCollectionValue(
  collectionCards: CollectionCardWithVariant[],
  priceMap: PriceMap
): CollectionValueResult {
  if (collectionCards.length === 0) {
    return {
      totalValue: 0,
      valuedCardsCount: 0,
      unvaluedCardsCount: 0,
      totalCardsCount: 0,
    };
  }

  let totalValue = 0;
  let valuedCardsCount = 0;
  let unvaluedCardsCount = 0;

  for (const card of collectionCards) {
    const price = priceMap.get(card.cardId);
    if (price !== undefined) {
      totalValue += price * card.quantity;
      valuedCardsCount++;
    } else {
      unvaluedCardsCount++;
    }
  }

  return {
    totalValue: roundToCents(totalValue),
    valuedCardsCount,
    unvaluedCardsCount,
    totalCardsCount: collectionCards.length,
  };
}

/**
 * Calculates the value of a single card (unit price * quantity).
 */
export function calculateCardValue(
  cardId: string,
  quantity: number,
  priceMap: PriceMap
): number | null {
  const price = priceMap.get(cardId);
  if (price === undefined) {
    return null;
  }
  return roundToCents(price * quantity);
}

/**
 * Gets the unit price for a card, or null if not available.
 */
export function getUnitPrice(cardId: string, priceMap: PriceMap): number | null {
  const price = priceMap.get(cardId);
  return price !== undefined ? price : null;
}

// ============================================================================
// MOST VALUABLE CARDS
// ============================================================================

/**
 * Gets the most valuable cards from a collection.
 * Returns cards sorted by total value (price * quantity) descending.
 */
export function getMostValuableCards(
  collectionCards: CollectionCardWithVariant[],
  cardDataMap: CardDataMap,
  limit: number = DEFAULT_TOP_CARDS_LIMIT
): ValuedCard[] {
  const valuedCards: ValuedCard[] = [];

  for (const card of collectionCards) {
    const cardData = cardDataMap.get(card.cardId);
    if (cardData) {
      valuedCards.push({
        cardId: card.cardId,
        name: cardData.name,
        imageSmall: cardData.imageSmall,
        variant: (card.variant as string) ?? 'normal',
        quantity: card.quantity,
        unitPrice: cardData.price,
        totalValue: roundToCents(cardData.price * card.quantity),
        setId: cardData.setId,
        rarity: cardData.rarity,
      });
    }
  }

  // Sort by total value descending
  valuedCards.sort((a, b) => b.totalValue - a.totalValue);

  return valuedCards.slice(0, limit);
}

/**
 * Gets the single most valuable card in a collection.
 */
export function getMostValuableCard(
  collectionCards: CollectionCardWithVariant[],
  cardDataMap: CardDataMap
): ValuedCard | null {
  const topCards = getMostValuableCards(collectionCards, cardDataMap, 1);
  return topCards.length > 0 ? topCards[0] : null;
}

/**
 * Filters collection to only cards with pricing data.
 */
export function filterCardsWithPricing(
  collectionCards: CollectionCardWithVariant[],
  priceMap: PriceMap
): CollectionCardWithVariant[] {
  return collectionCards.filter((card) => priceMap.has(card.cardId));
}

/**
 * Filters collection to cards without pricing data.
 */
export function filterCardsWithoutPricing(
  collectionCards: CollectionCardWithVariant[],
  priceMap: PriceMap
): CollectionCardWithVariant[] {
  return collectionCards.filter((card) => !priceMap.has(card.cardId));
}

// ============================================================================
// VALUE BY SET
// ============================================================================

/**
 * Groups collection cards by their set ID.
 */
export function groupCollectionBySet(
  collectionCards: CollectionCardWithVariant[]
): Map<string, CollectionCardWithVariant[]> {
  const bySet = new Map<string, CollectionCardWithVariant[]>();

  for (const card of collectionCards) {
    const setId = extractSetId(card.cardId);
    const existing = bySet.get(setId) ?? [];
    existing.push(card);
    bySet.set(setId, existing);
  }

  return bySet;
}

/**
 * Calculates value breakdown by set.
 */
export function calculateValueBySet(
  collectionCards: CollectionCardWithVariant[],
  priceMap: PriceMap,
  setNameMap: Map<string, string> = new Map()
): SetValue[] {
  const bySet = groupCollectionBySet(collectionCards);
  const setValues: SetValue[] = [];

  for (const [setId, cards] of bySet) {
    let totalValue = 0;
    let valuedCardCount = 0;

    for (const card of cards) {
      const price = priceMap.get(card.cardId);
      if (price !== undefined) {
        totalValue += price * card.quantity;
        valuedCardCount++;
      }
    }

    setValues.push({
      setId,
      setName: setNameMap.get(setId) ?? setId,
      totalValue: roundToCents(totalValue),
      cardCount: cards.length,
      valuedCardCount,
    });
  }

  // Sort by value descending
  setValues.sort((a, b) => b.totalValue - a.totalValue);

  return setValues;
}

/**
 * Gets the most valuable set in a collection.
 */
export function getMostValuableSet(
  collectionCards: CollectionCardWithVariant[],
  priceMap: PriceMap,
  setNameMap: Map<string, string> = new Map()
): SetValue | null {
  const setValues = calculateValueBySet(collectionCards, priceMap, setNameMap);
  return setValues.length > 0 ? setValues[0] : null;
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Calculates the average value per card in a collection.
 */
export function calculateAverageCardValue(
  collectionCards: CollectionCardWithVariant[],
  priceMap: PriceMap
): number | null {
  const result = calculateCollectionValue(collectionCards, priceMap);
  if (result.valuedCardsCount === 0) {
    return null;
  }
  return roundToCents(result.totalValue / result.valuedCardsCount);
}

/**
 * Calculates the median value of cards in a collection.
 */
export function calculateMedianCardValue(
  collectionCards: CollectionCardWithVariant[],
  priceMap: PriceMap
): number | null {
  const values: number[] = [];

  for (const card of collectionCards) {
    const price = priceMap.get(card.cardId);
    if (price !== undefined) {
      // Add the price once per quantity
      for (let i = 0; i < card.quantity; i++) {
        values.push(price);
      }
    }
  }

  if (values.length === 0) {
    return null;
  }

  values.sort((a, b) => a - b);

  const mid = Math.floor(values.length / 2);
  if (values.length % 2 === 0) {
    return roundToCents((values[mid - 1] + values[mid]) / 2);
  }
  return roundToCents(values[mid]);
}

/**
 * Calculates what percentage of the collection has pricing data.
 */
export function calculatePricingCoverage(
  collectionCards: CollectionCardWithVariant[],
  priceMap: PriceMap
): number {
  if (collectionCards.length === 0) {
    return 0;
  }

  const valuedCount = collectionCards.filter((c) => priceMap.has(c.cardId)).length;
  return roundToCents((valuedCount / collectionCards.length) * 100);
}

/**
 * Gets the price range (min and max) of valued cards.
 */
export function getPriceRange(
  collectionCards: CollectionCardWithVariant[],
  priceMap: PriceMap
): { min: number; max: number } | null {
  const prices: number[] = [];

  for (const card of collectionCards) {
    const price = priceMap.get(card.cardId);
    if (price !== undefined) {
      prices.push(price);
    }
  }

  if (prices.length === 0) {
    return null;
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

// ============================================================================
// VALUE THRESHOLDS
// ============================================================================

/**
 * Price tier thresholds for categorizing cards.
 */
export const PRICE_TIERS = {
  BULK: 0.5, // Below $0.50
  COMMON: 2, // $0.50 - $2.00
  VALUABLE: 10, // $2.00 - $10.00
  CHASE: 50, // $10.00 - $50.00
  // Above $50 is "premium"
} as const;

/** Price tier names */
export type PriceTier = 'bulk' | 'common' | 'valuable' | 'chase' | 'premium';

/**
 * Gets the price tier for a given price.
 */
export function getPriceTier(price: number): PriceTier {
  if (price < PRICE_TIERS.BULK) return 'bulk';
  if (price < PRICE_TIERS.COMMON) return 'common';
  if (price < PRICE_TIERS.VALUABLE) return 'valuable';
  if (price < PRICE_TIERS.CHASE) return 'chase';
  return 'premium';
}

/**
 * Gets display name for a price tier.
 */
export function getPriceTierDisplayName(tier: PriceTier): string {
  switch (tier) {
    case 'bulk':
      return 'Bulk';
    case 'common':
      return 'Common Value';
    case 'valuable':
      return 'Valuable';
    case 'chase':
      return 'Chase Card';
    case 'premium':
      return 'Premium';
  }
}

/**
 * Counts cards by price tier.
 */
export function countByPriceTier(
  collectionCards: CollectionCardWithVariant[],
  priceMap: PriceMap
): Record<PriceTier, number> {
  const counts: Record<PriceTier, number> = {
    bulk: 0,
    common: 0,
    valuable: 0,
    chase: 0,
    premium: 0,
  };

  for (const card of collectionCards) {
    const price = priceMap.get(card.cardId);
    if (price !== undefined) {
      const tier = getPriceTier(price);
      counts[tier] += card.quantity;
    }
  }

  return counts;
}

/**
 * Gets cards above a certain value threshold.
 */
export function getCardsAboveValue(
  collectionCards: CollectionCardWithVariant[],
  priceMap: PriceMap,
  threshold: number
): CollectionCardWithVariant[] {
  return collectionCards.filter((card) => {
    const price = priceMap.get(card.cardId);
    return price !== undefined && price >= threshold;
  });
}

/**
 * Gets cards below a certain value threshold.
 */
export function getCardsBelowValue(
  collectionCards: CollectionCardWithVariant[],
  priceMap: PriceMap,
  threshold: number
): CollectionCardWithVariant[] {
  return collectionCards.filter((card) => {
    const price = priceMap.get(card.cardId);
    return price !== undefined && price < threshold;
  });
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Formats a currency value for display.
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a collection value summary for display.
 */
export function formatValueSummary(result: CollectionValueResult): string {
  const valueStr = formatCurrency(result.totalValue);
  const coverage = roundToCents((result.valuedCardsCount / result.totalCardsCount) * 100);

  if (result.totalCardsCount === 0) {
    return 'No cards in collection';
  }

  if (result.valuedCardsCount === 0) {
    return `${result.totalCardsCount} cards (no pricing data)`;
  }

  return `${valueStr} (${result.valuedCardsCount}/${result.totalCardsCount} cards priced, ${coverage}% coverage)`;
}

/**
 * Gets a descriptive message for collection value.
 */
export function getValueMessage(totalValue: number): string {
  if (totalValue === 0) {
    return 'Start collecting to build value!';
  }
  if (totalValue < 10) {
    return "You're getting started!";
  }
  if (totalValue < 50) {
    return 'Nice collection building up!';
  }
  if (totalValue < 100) {
    return 'Impressive collection value!';
  }
  if (totalValue < 500) {
    return 'Serious collector status!';
  }
  if (totalValue < 1000) {
    return 'Amazing collection!';
  }
  return 'Legendary collection value!';
}

/**
 * Formats the most valuable card for display.
 */
export function formatMostValuableCard(card: ValuedCard | null): string {
  if (!card) {
    return 'No valued cards found';
  }
  return `${card.name} - ${formatCurrency(card.totalValue)} (${card.quantity}x @ ${formatCurrency(card.unitPrice)})`;
}
