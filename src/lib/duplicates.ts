/**
 * Utility functions for comparing card collections between profiles.
 * Used for duplicate finding, trade suggestions, and collection overlap analysis.
 */

// Type definitions for collection card data
export interface CollectionCard {
  cardId: string;
  quantity: number;
  variant?: string | null;
}

export interface CardVariantInfo {
  quantity: number;
  variants: Record<string, number>;
}

export interface DuplicateCard {
  cardId: string;
  profile1: CardVariantInfo;
  profile2: CardVariantInfo;
}

export interface CollectionComparisonResult {
  sharedCardIds: string[];
  onlyInProfile1: string[];
  onlyInProfile2: string[];
}

export interface TradeableCard {
  cardId: string;
  quantity: number;
  variants: Record<string, number>;
}

// Default variant for cards without a specified variant
const DEFAULT_VARIANT = 'normal';

/**
 * Groups cards by cardId and aggregates quantities by variant.
 * Handles legacy cards without variant field.
 */
export function groupCardsByCardId(
  cards: CollectionCard[]
): Map<string, { quantity: number; variant: string }[]> {
  const grouped = new Map<string, { quantity: number; variant: string }[]>();

  for (const card of cards) {
    const variant = card.variant ?? DEFAULT_VARIANT;
    const existing = grouped.get(card.cardId) ?? [];
    existing.push({ quantity: card.quantity, variant });
    grouped.set(card.cardId, existing);
  }

  return grouped;
}

/**
 * Converts grouped variants into a CardVariantInfo object.
 */
export function aggregateVariants(
  variantEntries: { quantity: number; variant: string }[]
): CardVariantInfo {
  const variants: Record<string, number> = {};
  let totalQuantity = 0;

  for (const entry of variantEntries) {
    variants[entry.variant] = (variants[entry.variant] ?? 0) + entry.quantity;
    totalQuantity += entry.quantity;
  }

  return { quantity: totalQuantity, variants };
}

/**
 * Finds cards that exist in both collections (duplicates).
 * Pure function that works on pre-fetched card arrays.
 */
export function findDuplicates(
  profile1Cards: CollectionCard[],
  profile2Cards: CollectionCard[]
): DuplicateCard[] {
  const profile1Grouped = groupCardsByCardId(profile1Cards);
  const profile2Grouped = groupCardsByCardId(profile2Cards);

  const duplicates: DuplicateCard[] = [];

  for (const [cardId, p1Variants] of profile1Grouped) {
    const p2Variants = profile2Grouped.get(cardId);
    if (p2Variants) {
      duplicates.push({
        cardId,
        profile1: aggregateVariants(p1Variants),
        profile2: aggregateVariants(p2Variants),
      });
    }
  }

  return duplicates;
}

/**
 * Finds cards that are only in one collection (tradeable cards).
 * Returns cards that fromCollection has but toCollection doesn't.
 */
export function findTradeableCards(
  fromCollection: CollectionCard[],
  toCollection: CollectionCard[]
): TradeableCard[] {
  const fromGrouped = groupCardsByCardId(fromCollection);
  const toCardIds = new Set(toCollection.map((c) => c.cardId));

  const tradeable: TradeableCard[] = [];

  for (const [cardId, variants] of fromGrouped) {
    if (!toCardIds.has(cardId)) {
      const aggregated = aggregateVariants(variants);
      tradeable.push({
        cardId,
        quantity: aggregated.quantity,
        variants: aggregated.variants,
      });
    }
  }

  return tradeable;
}

/**
 * Compares two collections and returns shared and unique cards.
 */
export function compareCollections(
  profile1Cards: CollectionCard[],
  profile2Cards: CollectionCard[]
): CollectionComparisonResult {
  const profile1CardIds = new Set(profile1Cards.map((c) => c.cardId));
  const profile2CardIds = new Set(profile2Cards.map((c) => c.cardId));

  const sharedCardIds = [...profile1CardIds].filter((id) => profile2CardIds.has(id));
  const onlyInProfile1 = [...profile1CardIds].filter((id) => !profile2CardIds.has(id));
  const onlyInProfile2 = [...profile2CardIds].filter((id) => !profile1CardIds.has(id));

  return {
    sharedCardIds,
    onlyInProfile1,
    onlyInProfile2,
  };
}

/**
 * Gets unique card IDs from a collection.
 */
export function getUniqueCardIds(cards: CollectionCard[]): string[] {
  return [...new Set(cards.map((c) => c.cardId))];
}

/**
 * Calculates total quantity of cards in a collection.
 */
export function getTotalQuantity(cards: CollectionCard[]): number {
  return cards.reduce((sum, card) => sum + card.quantity, 0);
}

/**
 * Calculates the overlap percentage between two collections.
 * Returns a value between 0 and 1 representing how much of profile1's
 * collection is also in profile2's collection.
 */
export function calculateOverlapPercentage(
  profile1Cards: CollectionCard[],
  profile2Cards: CollectionCard[]
): number {
  if (profile1Cards.length === 0) {
    return 0;
  }

  const profile1CardIds = new Set(profile1Cards.map((c) => c.cardId));
  const profile2CardIds = new Set(profile2Cards.map((c) => c.cardId));

  const sharedCount = [...profile1CardIds].filter((id) => profile2CardIds.has(id)).length;

  return sharedCount / profile1CardIds.size;
}

/**
 * Finds cards that could potentially be traded (duplicates with quantity > 1).
 * Returns cards from the given collection that have multiple copies.
 */
export function findExcessCards(cards: CollectionCard[]): TradeableCard[] {
  const grouped = groupCardsByCardId(cards);
  const excessCards: TradeableCard[] = [];

  for (const [cardId, variants] of grouped) {
    const aggregated = aggregateVariants(variants);
    // Only include cards with quantity > 1 (at least one spare)
    if (aggregated.quantity > 1) {
      excessCards.push({
        cardId,
        quantity: aggregated.quantity - 1, // Keep one, trade the rest
        variants: Object.fromEntries(
          Object.entries(aggregated.variants).map(([v, q]) => [v, Math.max(0, q - 1)])
        ),
      });
    }
  }

  return excessCards;
}

/**
 * Gets a summary of variant distribution for a collection.
 */
export function getVariantSummary(
  cards: CollectionCard[]
): Record<string, { count: number; totalQuantity: number }> {
  const summary: Record<string, { count: number; totalQuantity: number }> = {};

  for (const card of cards) {
    const variant = card.variant ?? DEFAULT_VARIANT;
    if (!summary[variant]) {
      summary[variant] = { count: 0, totalQuantity: 0 };
    }
    summary[variant].count += 1;
    summary[variant].totalQuantity += card.quantity;
  }

  return summary;
}
