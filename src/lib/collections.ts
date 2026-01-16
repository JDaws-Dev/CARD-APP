/**
 * Pure utility functions for collection CRUD operations.
 * These functions implement the core logic that can be tested
 * without a Convex backend.
 */

// ============================================================================
// TYPES
// ============================================================================

/** Card variant types matching the schema */
export type CardVariant =
  | 'normal'
  | 'holofoil'
  | 'reverseHolofoil'
  | '1stEditionHolofoil'
  | '1stEditionNormal';

/** Card entry in a collection */
export interface CollectionCard {
  cardId: string;
  quantity: number;
  variant: CardVariant;
}

/** Result of checking if a card is owned */
export interface CardOwnership {
  owned: boolean;
  quantity: number;
  variants: Record<string, number>;
}

/** Collection statistics */
export interface CollectionStats {
  totalCards: number;
  uniqueCards: number;
  setsStarted: number;
}

/** Grouped card entry with all variants */
export interface GroupedCard {
  cardId: string;
  totalQuantity: number;
  variants: Record<CardVariant, number>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default variant for cards without a specified variant */
export const DEFAULT_VARIANT: CardVariant = 'normal';

/** All valid card variants */
export const VALID_VARIANTS: CardVariant[] = [
  'normal',
  'holofoil',
  'reverseHolofoil',
  '1stEditionHolofoil',
  '1stEditionNormal',
];

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates if a string is a valid card variant.
 */
export function isValidVariant(variant: string): variant is CardVariant {
  return VALID_VARIANTS.includes(variant as CardVariant);
}

/**
 * Validates a card ID format (setId-number).
 */
export function isValidCardId(cardId: string): boolean {
  if (!cardId || typeof cardId !== 'string') {
    return false;
  }
  // Card ID should be in format "setId-number" (e.g., "sv1-1", "swsh12-123")
  const parts = cardId.split('-');
  return parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0;
}

/**
 * Validates a quantity value.
 */
export function isValidQuantity(quantity: number): boolean {
  return typeof quantity === 'number' && Number.isInteger(quantity) && quantity > 0;
}

/**
 * Extracts the set ID from a card ID.
 */
export function extractSetId(cardId: string): string {
  const dashIndex = cardId.indexOf('-');
  return dashIndex > 0 ? cardId.substring(0, dashIndex) : cardId;
}

/**
 * Extracts the card number from a card ID.
 */
export function extractCardNumber(cardId: string): string {
  const dashIndex = cardId.indexOf('-');
  return dashIndex > 0 ? cardId.substring(dashIndex + 1) : '';
}

// ============================================================================
// QUERY LOGIC
// ============================================================================

/**
 * Gets collection statistics from a list of collection cards.
 */
export function getCollectionStats(cards: CollectionCard[]): CollectionStats {
  const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);
  const uniqueCards = cards.length;

  // Count unique sets
  const sets = new Set(cards.map((card) => extractSetId(card.cardId)));

  return {
    totalCards,
    uniqueCards,
    setsStarted: sets.size,
  };
}

/**
 * Checks if a card is owned and returns ownership details.
 */
export function checkCardOwnership(cards: CollectionCard[], cardId: string): CardOwnership {
  // Filter cards matching the cardId
  const matchingCards = cards.filter((card) => card.cardId === cardId);

  if (matchingCards.length === 0) {
    return { owned: false, quantity: 0, variants: {} };
  }

  // Sum up total quantity across all variants
  const totalQuantity = matchingCards.reduce((sum, card) => sum + card.quantity, 0);

  // Build variants object with quantity per variant
  const variants: Record<string, number> = {};
  for (const card of matchingCards) {
    const variant = card.variant ?? DEFAULT_VARIANT;
    variants[variant] = (variants[variant] ?? 0) + card.quantity;
  }

  return { owned: true, quantity: totalQuantity, variants };
}

/**
 * Filters collection cards by set ID.
 */
export function filterBySet(cards: CollectionCard[], setId: string): CollectionCard[] {
  return cards.filter((card) => card.cardId.startsWith(setId + '-'));
}

/**
 * Groups collection cards by cardId, combining variants.
 */
export function groupCardsByCardId(cards: CollectionCard[]): GroupedCard[] {
  const grouped = new Map<string, GroupedCard>();

  for (const card of cards) {
    const existing = grouped.get(card.cardId);
    const variant = card.variant ?? DEFAULT_VARIANT;

    if (existing) {
      existing.totalQuantity += card.quantity;
      existing.variants[variant] = (existing.variants[variant] ?? 0) + card.quantity;
    } else {
      grouped.set(card.cardId, {
        cardId: card.cardId,
        totalQuantity: card.quantity,
        variants: { [variant]: card.quantity } as Record<CardVariant, number>,
      });
    }
  }

  return Array.from(grouped.values());
}

/**
 * Gets unique card IDs from a collection.
 */
export function getUniqueCardIds(cards: CollectionCard[]): string[] {
  return Array.from(new Set(cards.map((card) => card.cardId)));
}

/**
 * Counts cards by set.
 */
export function countCardsBySet(
  cards: CollectionCard[]
): Map<string, { count: number; quantity: number }> {
  const bySet = new Map<string, { count: number; quantity: number }>();

  for (const card of cards) {
    const setId = extractSetId(card.cardId);
    const existing = bySet.get(setId) ?? { count: 0, quantity: 0 };
    existing.count++;
    existing.quantity += card.quantity;
    bySet.set(setId, existing);
  }

  return bySet;
}

// ============================================================================
// MUTATION LOGIC
// ============================================================================

/**
 * Simulates adding a card to a collection.
 * Returns the updated collection.
 */
export function addCardToCollection(
  collection: CollectionCard[],
  cardId: string,
  quantity = 1,
  variant: CardVariant = DEFAULT_VARIANT
): { collection: CollectionCard[]; isNew: boolean } {
  // Check if card with this specific variant already exists
  const existingIndex = collection.findIndex(
    (card) => card.cardId === cardId && card.variant === variant
  );

  if (existingIndex !== -1) {
    // Update quantity for this variant
    const updated = [...collection];
    updated[existingIndex] = {
      ...updated[existingIndex],
      quantity: updated[existingIndex].quantity + quantity,
    };
    return { collection: updated, isNew: false };
  }

  // Create new card entry
  const newCard: CollectionCard = {
    cardId,
    quantity,
    variant,
  };

  return { collection: [...collection, newCard], isNew: true };
}

/**
 * Simulates removing a card from a collection.
 * If variant is specified, only removes that variant.
 * If variant is not specified, removes all variants of that card.
 */
export function removeCardFromCollection(
  collection: CollectionCard[],
  cardId: string,
  variant?: CardVariant
): { collection: CollectionCard[]; removed: number } {
  if (variant) {
    // Remove only the specific variant
    const existingIndex = collection.findIndex(
      (card) => card.cardId === cardId && card.variant === variant
    );

    if (existingIndex === -1) {
      return { collection, removed: 0 };
    }

    const updated = collection.filter((_, index) => index !== existingIndex);
    return { collection: updated, removed: 1 };
  }

  // Remove all variants of this card
  const originalLength = collection.length;
  const updated = collection.filter((card) => card.cardId !== cardId);
  return { collection: updated, removed: originalLength - updated.length };
}

/**
 * Updates the quantity of a card in a collection.
 * If quantity is 0 or less, removes the card.
 */
export function updateCardQuantity(
  collection: CollectionCard[],
  cardId: string,
  quantity: number,
  variant: CardVariant = DEFAULT_VARIANT
): { collection: CollectionCard[]; success: boolean; error?: string } {
  const existingIndex = collection.findIndex(
    (card) => card.cardId === cardId && card.variant === variant
  );

  if (existingIndex === -1) {
    return { collection, success: false, error: 'Card not found in collection' };
  }

  if (quantity <= 0) {
    // Remove the card
    const updated = collection.filter((_, index) => index !== existingIndex);
    return { collection: updated, success: true };
  }

  // Update quantity
  const updated = [...collection];
  updated[existingIndex] = {
    ...updated[existingIndex],
    quantity,
  };

  return { collection: updated, success: true };
}

/**
 * Decrements the quantity of a card by 1.
 * If quantity reaches 0, removes the card.
 */
export function decrementCardQuantity(
  collection: CollectionCard[],
  cardId: string,
  variant: CardVariant = DEFAULT_VARIANT
): { collection: CollectionCard[]; success: boolean; newQuantity: number } {
  const existingIndex = collection.findIndex(
    (card) => card.cardId === cardId && card.variant === variant
  );

  if (existingIndex === -1) {
    return { collection, success: false, newQuantity: 0 };
  }

  const currentQuantity = collection[existingIndex].quantity;

  if (currentQuantity <= 1) {
    // Remove the card
    const updated = collection.filter((_, index) => index !== existingIndex);
    return { collection: updated, success: true, newQuantity: 0 };
  }

  // Decrement quantity
  const updated = [...collection];
  updated[existingIndex] = {
    ...updated[existingIndex],
    quantity: currentQuantity - 1,
  };

  return { collection: updated, success: true, newQuantity: currentQuantity - 1 };
}

/**
 * Increments the quantity of a card by 1.
 * If card doesn't exist, adds it.
 */
export function incrementCardQuantity(
  collection: CollectionCard[],
  cardId: string,
  variant: CardVariant = DEFAULT_VARIANT
): { collection: CollectionCard[]; newQuantity: number } {
  const existingIndex = collection.findIndex(
    (card) => card.cardId === cardId && card.variant === variant
  );

  if (existingIndex === -1) {
    // Add new card with quantity 1
    const newCard: CollectionCard = {
      cardId,
      quantity: 1,
      variant,
    };
    return { collection: [...collection, newCard], newQuantity: 1 };
  }

  // Increment quantity
  const updated = [...collection];
  const newQuantity = updated[existingIndex].quantity + 1;
  updated[existingIndex] = {
    ...updated[existingIndex],
    quantity: newQuantity,
  };

  return { collection: updated, newQuantity };
}

// ============================================================================
// COLLECTION COMPARISON
// ============================================================================

/**
 * Finds cards that exist in both collections.
 */
export function findSharedCards(
  collection1: CollectionCard[],
  collection2: CollectionCard[]
): string[] {
  const cardIds1 = new Set(collection1.map((c) => c.cardId));
  const cardIds2 = new Set(collection2.map((c) => c.cardId));

  return Array.from(cardIds1).filter((id) => cardIds2.has(id));
}

/**
 * Finds cards unique to the first collection.
 */
export function findUniqueCards(
  collection1: CollectionCard[],
  collection2: CollectionCard[]
): string[] {
  const cardIds2 = new Set(collection2.map((c) => c.cardId));
  const cardIds1 = new Set(collection1.map((c) => c.cardId));

  return Array.from(cardIds1).filter((id) => !cardIds2.has(id));
}

/**
 * Merges two collections (for trading simulation).
 * Returns a new collection with combined quantities.
 */
export function mergeCollections(
  collection1: CollectionCard[],
  collection2: CollectionCard[]
): CollectionCard[] {
  const merged = new Map<string, CollectionCard>();

  // Process first collection
  for (const card of collection1) {
    const key = `${card.cardId}:${card.variant}`;
    merged.set(key, { ...card });
  }

  // Add second collection
  for (const card of collection2) {
    const key = `${card.cardId}:${card.variant}`;
    const existing = merged.get(key);

    if (existing) {
      existing.quantity += card.quantity;
    } else {
      merged.set(key, { ...card });
    }
  }

  return Array.from(merged.values());
}

// ============================================================================
// SORTING
// ============================================================================

/**
 * Sorts collection cards by card ID.
 */
export function sortByCardId(cards: CollectionCard[], ascending = true): CollectionCard[] {
  const sorted = [...cards].sort((a, b) => a.cardId.localeCompare(b.cardId));
  return ascending ? sorted : sorted.reverse();
}

/**
 * Sorts collection cards by quantity.
 */
export function sortByQuantity(cards: CollectionCard[], ascending = false): CollectionCard[] {
  const sorted = [...cards].sort((a, b) => a.quantity - b.quantity);
  return ascending ? sorted : sorted.reverse();
}

/**
 * Sorts collection cards by set ID, then by card number.
 */
export function sortBySetAndNumber(cards: CollectionCard[], ascending = true): CollectionCard[] {
  const sorted = [...cards].sort((a, b) => {
    const setA = extractSetId(a.cardId);
    const setB = extractSetId(b.cardId);

    if (setA !== setB) {
      return setA.localeCompare(setB);
    }

    // Parse card numbers as integers for numeric sorting
    const numA = parseInt(extractCardNumber(a.cardId), 10) || 0;
    const numB = parseInt(extractCardNumber(b.cardId), 10) || 0;

    return numA - numB;
  });

  return ascending ? sorted : sorted.reverse();
}

// ============================================================================
// VARIANT GROUPING
// ============================================================================

/** Card entry with enriched data */
export interface EnrichedCollectionCard {
  cardId: string;
  variant: CardVariant;
  quantity: number;
  name: string;
  imageSmall: string;
  setId: string;
}

/** Card grouped by cardId with variant breakdown */
export interface GroupedCardWithData {
  cardId: string;
  name: string;
  imageSmall: string;
  setId: string;
  totalQuantity: number;
  variants: Record<CardVariant, number>;
}

/** Summary of collection variant distribution */
export interface VariantSummary {
  totalEntries: number;
  totalQuantity: number;
  uniqueCards: number;
  variantBreakdown: Record<CardVariant, number>;
}

/** Display name for each variant */
export const VARIANT_DISPLAY_NAMES: Record<CardVariant, string> = {
  normal: 'Normal',
  holofoil: 'Holofoil',
  reverseHolofoil: 'Reverse Holofoil',
  '1stEditionHolofoil': '1st Edition Holofoil',
  '1stEditionNormal': '1st Edition Normal',
};

/**
 * Gets the display name for a variant.
 */
export function getVariantDisplayName(variant: CardVariant): string {
  return VARIANT_DISPLAY_NAMES[variant] ?? variant;
}

/**
 * Groups collection by (cardId, variant) pairs.
 * Each unique combination is a separate entry.
 */
export function groupCollectionByVariant(cards: CollectionCard[]): EnrichedCollectionCard[] {
  return cards.map((card) => ({
    cardId: card.cardId,
    variant: card.variant ?? DEFAULT_VARIANT,
    quantity: card.quantity,
    name: card.cardId, // Will be enriched by caller
    imageSmall: '',
    setId: extractSetId(card.cardId),
  }));
}

/**
 * Enriches collection cards with names from a name map.
 */
export function enrichWithNames(
  cards: EnrichedCollectionCard[],
  nameMap: Map<string, string>
): EnrichedCollectionCard[] {
  return cards.map((card) => ({
    ...card,
    name: nameMap.get(card.cardId) ?? card.cardId,
  }));
}

/**
 * Calculates variant summary from a collection.
 */
export function calculateVariantSummary(cards: CollectionCard[]): VariantSummary {
  const variantBreakdown: Record<CardVariant, number> = {
    normal: 0,
    holofoil: 0,
    reverseHolofoil: 0,
    '1stEditionHolofoil': 0,
    '1stEditionNormal': 0,
  };

  const uniqueCardIds = new Set<string>();
  let totalQuantity = 0;

  for (const card of cards) {
    const variant = card.variant ?? DEFAULT_VARIANT;
    variantBreakdown[variant] = (variantBreakdown[variant] ?? 0) + 1;
    uniqueCardIds.add(card.cardId);
    totalQuantity += card.quantity;
  }

  return {
    totalEntries: cards.length,
    totalQuantity,
    uniqueCards: uniqueCardIds.size,
    variantBreakdown,
  };
}

/**
 * Gets variants that have at least one card in the collection.
 */
export function getUsedVariants(cards: CollectionCard[]): CardVariant[] {
  const variants = new Set<CardVariant>();
  for (const card of cards) {
    variants.add(card.variant ?? DEFAULT_VARIANT);
  }
  return Array.from(variants).sort();
}

/**
 * Filters collection by variant type.
 */
export function filterByVariant(cards: CollectionCard[], variant: CardVariant): CollectionCard[] {
  return cards.filter((card) => (card.variant ?? DEFAULT_VARIANT) === variant);
}

/**
 * Sorts collection cards by variant, then by cardId.
 */
export function sortByVariant(cards: CollectionCard[], ascending = true): CollectionCard[] {
  const variantOrder: Record<CardVariant, number> = {
    normal: 0,
    holofoil: 1,
    reverseHolofoil: 2,
    '1stEditionHolofoil': 3,
    '1stEditionNormal': 4,
  };

  const sorted = [...cards].sort((a, b) => {
    const variantA = a.variant ?? DEFAULT_VARIANT;
    const variantB = b.variant ?? DEFAULT_VARIANT;

    const variantCompare = variantOrder[variantA] - variantOrder[variantB];
    if (variantCompare !== 0) {
      return variantCompare;
    }

    return a.cardId.localeCompare(b.cardId);
  });

  return ascending ? sorted : sorted.reverse();
}

/**
 * Sorts collection cards by cardId, then by variant.
 */
export function sortByCardIdThenVariant(
  cards: CollectionCard[],
  ascending = true
): CollectionCard[] {
  const variantOrder: Record<CardVariant, number> = {
    normal: 0,
    holofoil: 1,
    reverseHolofoil: 2,
    '1stEditionHolofoil': 3,
    '1stEditionNormal': 4,
  };

  const sorted = [...cards].sort((a, b) => {
    const cardCompare = a.cardId.localeCompare(b.cardId);
    if (cardCompare !== 0) {
      return cardCompare;
    }

    const variantA = a.variant ?? DEFAULT_VARIANT;
    const variantB = b.variant ?? DEFAULT_VARIANT;

    return variantOrder[variantA] - variantOrder[variantB];
  });

  return ascending ? sorted : sorted.reverse();
}

/**
 * Groups cards by cardId into an object that includes all variant data.
 * This is a more complete version of groupCardsByCardId that returns richer data.
 */
export function groupCardsByCardIdWithDetails(
  cards: CollectionCard[],
  cardNames?: Map<string, string>
): GroupedCardWithData[] {
  const grouped = new Map<string, GroupedCardWithData>();

  for (const card of cards) {
    const variant = card.variant ?? DEFAULT_VARIANT;
    const existing = grouped.get(card.cardId);

    if (existing) {
      existing.totalQuantity += card.quantity;
      existing.variants[variant] = (existing.variants[variant] ?? 0) + card.quantity;
    } else {
      grouped.set(card.cardId, {
        cardId: card.cardId,
        name: cardNames?.get(card.cardId) ?? card.cardId,
        imageSmall: '',
        setId: extractSetId(card.cardId),
        totalQuantity: card.quantity,
        variants: { [variant]: card.quantity } as Record<CardVariant, number>,
      });
    }
  }

  return Array.from(grouped.values());
}

/**
 * Gets the count of cards for a specific variant.
 */
export function countByVariant(cards: CollectionCard[]): Map<CardVariant, number> {
  const counts = new Map<CardVariant, number>();

  for (const card of cards) {
    const variant = card.variant ?? DEFAULT_VARIANT;
    counts.set(variant, (counts.get(variant) ?? 0) + 1);
  }

  return counts;
}

/**
 * Gets the total quantity of cards for a specific variant.
 */
export function quantityByVariant(cards: CollectionCard[]): Map<CardVariant, number> {
  const quantities = new Map<CardVariant, number>();

  for (const card of cards) {
    const variant = card.variant ?? DEFAULT_VARIANT;
    quantities.set(variant, (quantities.get(variant) ?? 0) + card.quantity);
  }

  return quantities;
}

/**
 * Checks if a collection has any cards of a specific variant.
 */
export function hasVariant(cards: CollectionCard[], variant: CardVariant): boolean {
  return cards.some((card) => (card.variant ?? DEFAULT_VARIANT) === variant);
}

/**
 * Gets all cards of a specific cardId across all variants.
 */
export function getAllVariantsOfCard(cards: CollectionCard[], cardId: string): CollectionCard[] {
  return cards.filter((card) => card.cardId === cardId);
}

/**
 * Gets the total quantity of a specific card across all variants.
 */
export function getTotalQuantityOfCard(cards: CollectionCard[], cardId: string): number {
  return cards
    .filter((card) => card.cardId === cardId)
    .reduce((sum, card) => sum + card.quantity, 0);
}

// ============================================================================
// NEW IN COLLECTION - Cards added in last N days
// ============================================================================

/** Activity log entry for card additions */
export interface CardAdditionLog {
  cardId: string;
  addedAt: number;
  variant: CardVariant;
  quantity: number;
}

/** Enriched card with addition date for "new in collection" display */
export interface NewlyAddedCard {
  cardId: string;
  name: string;
  imageSmall: string;
  setId: string;
  rarity?: string;
  variant: CardVariant;
  quantity: number;
  addedAt: number;
}

/** Summary of newly added cards */
export interface NewlyAddedSummary {
  totalAdditions: number;
  uniqueCards: number;
  daysSearched: number;
  oldestAddition: number | null;
  newestAddition: number | null;
}

/** Daily summary of card additions */
export interface DailyAdditionSummary {
  date: string;
  additionCount: number;
  uniqueCardsCount: number;
  totalQuantity: number;
}

/** Default number of days to search for new cards */
export const DEFAULT_NEW_CARDS_DAYS = 7;

/** Maximum number of days to search for new cards */
export const MAX_NEW_CARDS_DAYS = 30;

/**
 * Calculates a cutoff timestamp for filtering by days.
 */
export function getCutoffTimestamp(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

/**
 * Filters activity logs to only card_added events within a time window.
 */
export function filterRecentCardAdditions(
  logs: Array<{ action: string; _creationTime: number; metadata?: unknown }>,
  cutoffTimestamp: number
): Array<{ action: string; _creationTime: number; metadata?: unknown }> {
  return logs.filter((log) => log.action === 'card_added' && log._creationTime >= cutoffTimestamp);
}

/**
 * Extracts card addition data from activity log metadata.
 */
export function extractCardAddition(log: {
  _creationTime: number;
  metadata?: unknown;
}): CardAdditionLog | null {
  const metadata = log.metadata as {
    cardId?: string;
    variant?: string;
    quantity?: number;
  } | null;

  if (!metadata?.cardId) {
    return null;
  }

  const variant = metadata.variant ?? 'normal';
  return {
    cardId: metadata.cardId,
    addedAt: log._creationTime,
    variant: isValidVariant(variant) ? (variant as CardVariant) : DEFAULT_VARIANT,
    quantity: metadata.quantity ?? 1,
  };
}

/**
 * Parses activity logs into card additions.
 */
export function parseCardAdditions(
  logs: Array<{ _creationTime: number; metadata?: unknown }>
): CardAdditionLog[] {
  const additions: CardAdditionLog[] = [];

  for (const log of logs) {
    const addition = extractCardAddition(log);
    if (addition) {
      additions.push(addition);
    }
  }

  return additions;
}

/**
 * Groups card additions by date (YYYY-MM-DD format).
 */
export function groupAdditionsByDate(
  additions: CardAdditionLog[]
): Map<string, DailyAdditionSummary> {
  const byDate = new Map<
    string,
    { count: number; uniqueCards: Set<string>; totalQuantity: number }
  >();

  for (const addition of additions) {
    const date = new Date(addition.addedAt).toISOString().split('T')[0];
    const existing = byDate.get(date) ?? {
      count: 0,
      uniqueCards: new Set<string>(),
      totalQuantity: 0,
    };

    existing.count++;
    existing.uniqueCards.add(addition.cardId);
    existing.totalQuantity += addition.quantity;

    byDate.set(date, existing);
  }

  // Convert to DailyAdditionSummary
  const result = new Map<string, DailyAdditionSummary>();
  for (const [date, data] of Array.from(byDate)) {
    result.set(date, {
      date,
      additionCount: data.count,
      uniqueCardsCount: data.uniqueCards.size,
      totalQuantity: data.totalQuantity,
    });
  }

  return result;
}

/**
 * Gets daily summaries sorted by date descending.
 */
export function getDailySummaries(additions: CardAdditionLog[]): DailyAdditionSummary[] {
  const grouped = groupAdditionsByDate(additions);
  return Array.from(grouped.values()).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Calculates the summary stats for newly added cards.
 */
export function calculateNewlyAddedSummary(
  additions: CardAdditionLog[],
  days: number
): NewlyAddedSummary {
  if (additions.length === 0) {
    return {
      totalAdditions: 0,
      uniqueCards: 0,
      daysSearched: days,
      oldestAddition: null,
      newestAddition: null,
    };
  }

  const uniqueCardIds = new Set(additions.map((a) => a.cardId));
  const timestamps = additions.map((a) => a.addedAt);

  return {
    totalAdditions: additions.length,
    uniqueCards: uniqueCardIds.size,
    daysSearched: days,
    oldestAddition: Math.min(...timestamps),
    newestAddition: Math.max(...timestamps),
  };
}

/**
 * Gets unique card IDs from additions.
 */
export function getUniqueCardIdsFromAdditions(additions: CardAdditionLog[]): string[] {
  return Array.from(new Set(additions.map((a) => a.cardId)));
}

/**
 * Enriches card additions with card details.
 */
export function enrichCardAdditions(
  additions: CardAdditionLog[],
  cardDataMap: Map<string, { name: string; imageSmall: string; setId: string; rarity?: string }>
): NewlyAddedCard[] {
  return additions.map((addition) => {
    const cardData = cardDataMap.get(addition.cardId);
    return {
      cardId: addition.cardId,
      name: cardData?.name ?? addition.cardId,
      imageSmall: cardData?.imageSmall ?? '',
      setId: cardData?.setId ?? extractSetId(addition.cardId),
      rarity: cardData?.rarity,
      variant: addition.variant,
      quantity: addition.quantity,
      addedAt: addition.addedAt,
    };
  });
}

/**
 * Checks if a timestamp is within the "new" window.
 */
export function isWithinNewWindow(
  timestamp: number,
  days: number = DEFAULT_NEW_CARDS_DAYS
): boolean {
  return timestamp >= getCutoffTimestamp(days);
}

/**
 * Formats an "added at" timestamp for display.
 * Returns relative time for recent additions (today, yesterday, N days ago).
 */
export function formatAddedAtRelative(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (60 * 1000));
      if (diffMinutes === 0) {
        return 'just now';
      }
      return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  if (diffDays === 1) {
    return 'yesterday';
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  // Fallback to absolute date for older entries
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats an "added at" timestamp as an absolute date.
 */
export function formatAddedAtAbsolute(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Sorts newly added cards by addition date (newest first).
 */
export function sortByAddedAt(cards: NewlyAddedCard[], ascending = false): NewlyAddedCard[] {
  const sorted = [...cards].sort((a, b) => a.addedAt - b.addedAt);
  return ascending ? sorted : sorted.reverse();
}

/**
 * Groups newly added cards by the day they were added.
 */
export function groupNewlyAddedByDay(cards: NewlyAddedCard[]): Map<string, NewlyAddedCard[]> {
  const grouped = new Map<string, NewlyAddedCard[]>();

  for (const card of cards) {
    const date = new Date(card.addedAt).toISOString().split('T')[0];
    const existing = grouped.get(date) ?? [];
    existing.push(card);
    grouped.set(date, existing);
  }

  return grouped;
}

/**
 * Counts additions by set for the new cards.
 */
export function countNewCardsBySet(cards: NewlyAddedCard[]): Map<string, number> {
  const bySet = new Map<string, number>();

  for (const card of cards) {
    const count = bySet.get(card.setId) ?? 0;
    bySet.set(card.setId, count + 1);
  }

  return bySet;
}

/**
 * Gets a formatted badge message for new card count.
 */
export function getNewCardsBadgeText(count: number): string {
  if (count === 0) {
    return '';
  }
  if (count === 1) {
    return '1 new card';
  }
  return `${count} new cards`;
}

/**
 * Checks if there are any new cards in a collection based on additions.
 */
export function hasAnyNewCards(additions: CardAdditionLog[]): boolean {
  return additions.length > 0;
}

// ============================================================================
// RANDOM CARD SELECTION
// ============================================================================

/** Result of random card selection with card data */
export interface RandomCardResult {
  cardId: string;
  variant: CardVariant;
  quantity: number;
  name: string;
  imageSmall: string;
  imageLarge: string;
  setId: string;
  rarity?: string;
  types: string[];
}

/** Options for selecting random cards */
export interface RandomCardOptions {
  setId?: string;
  variant?: CardVariant;
  count?: number;
  allowDuplicates?: boolean;
}

/**
 * Filters collection cards by optional criteria.
 */
export function filterCollectionCards(
  cards: CollectionCard[],
  options?: { setId?: string; variant?: CardVariant }
): CollectionCard[] {
  let filtered = cards;

  if (options?.setId) {
    filtered = filtered.filter((card) => card.cardId.startsWith(options.setId + '-'));
  }

  if (options?.variant) {
    filtered = filtered.filter((card) => (card.variant ?? DEFAULT_VARIANT) === options.variant);
  }

  return filtered;
}

/**
 * Selects a random item from an array.
 * Returns null if array is empty.
 */
export function selectRandomItem<T>(items: T[]): T | null {
  if (items.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}

/**
 * Selects a random card from a collection.
 * Returns null if collection is empty or no cards match the filter.
 */
export function selectRandomCard(
  cards: CollectionCard[],
  options?: { setId?: string; variant?: CardVariant }
): CollectionCard | null {
  const filtered = filterCollectionCards(cards, options);
  return selectRandomItem(filtered);
}

/**
 * Performs Fisher-Yates shuffle on an array (in-place).
 * Returns the same array reference, now shuffled.
 */
export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Creates a shuffled copy of an array.
 * Does not modify the original array.
 */
export function shuffleCopy<T>(array: T[]): T[] {
  return shuffleArray([...array]);
}

/**
 * Selects multiple random cards from a collection.
 * By default, does not allow duplicates.
 */
export function selectRandomCards(
  cards: CollectionCard[],
  options?: RandomCardOptions
): CollectionCard[] {
  const count = options?.count ?? 3;
  const allowDuplicates = options?.allowDuplicates ?? false;

  const filtered = filterCollectionCards(cards, options);

  if (filtered.length === 0) {
    return [];
  }

  if (allowDuplicates) {
    // With duplicates: just pick randomly
    const selected: CollectionCard[] = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * filtered.length);
      selected.push(filtered[randomIndex]);
    }
    return selected;
  } else {
    // Without duplicates: shuffle and take first N
    const maxCards = Math.min(count, filtered.length);
    const shuffled = shuffleCopy(filtered);
    return shuffled.slice(0, maxCards);
  }
}

/**
 * Checks if a collection has enough cards to select N random cards.
 */
export function hasEnoughCards(cards: CollectionCard[], count: number): boolean {
  return cards.length >= count;
}

/**
 * Gets the maximum number of unique random cards that can be selected.
 */
export function maxRandomCards(cards: CollectionCard[]): number {
  return cards.length;
}

/**
 * Validates random card selection options.
 * Returns an error message if invalid, null if valid.
 */
export function validateRandomCardOptions(options?: RandomCardOptions): string | null {
  if (options?.count !== undefined) {
    if (!Number.isInteger(options.count) || options.count < 1) {
      return 'Count must be a positive integer';
    }
  }

  if (options?.variant !== undefined && !isValidVariant(options.variant)) {
    return 'Invalid variant';
  }

  return null;
}

/**
 * Creates an enriched random card result from collection card and cached data.
 */
export function enrichRandomCard(
  card: CollectionCard,
  cachedData?: {
    name?: string;
    imageSmall?: string;
    imageLarge?: string;
    setId?: string;
    rarity?: string;
    types?: string[];
  }
): RandomCardResult {
  return {
    cardId: card.cardId,
    variant: card.variant ?? DEFAULT_VARIANT,
    quantity: card.quantity,
    name: cachedData?.name ?? card.cardId,
    imageSmall: cachedData?.imageSmall ?? '',
    imageLarge: cachedData?.imageLarge ?? '',
    setId: cachedData?.setId ?? extractSetId(card.cardId),
    rarity: cachedData?.rarity,
    types: cachedData?.types ?? [],
  };
}

/**
 * Enriches multiple random cards with cached data.
 */
export function enrichRandomCards(
  cards: CollectionCard[],
  cachedDataMap: Map<
    string,
    {
      name?: string;
      imageSmall?: string;
      imageLarge?: string;
      setId?: string;
      rarity?: string;
      types?: string[];
    }
  >
): RandomCardResult[] {
  return cards.map((card) => enrichRandomCard(card, cachedDataMap.get(card.cardId)));
}

/**
 * Returns a fun message about a random card selection.
 * Useful for gamification features.
 */
export function getRandomCardMessage(card: RandomCardResult): string {
  const variantName = getVariantDisplayName(card.variant);
  if (card.variant !== 'normal') {
    return `You got a ${variantName} ${card.name}!`;
  }
  return `You got ${card.name}!`;
}

/**
 * Calculates the probability of selecting a specific card from a collection.
 * Returns a value between 0 and 1.
 */
export function cardSelectionProbability(cards: CollectionCard[], cardId: string): number {
  if (cards.length === 0) {
    return 0;
  }
  const matchingCards = cards.filter((c) => c.cardId === cardId);
  return matchingCards.length / cards.length;
}

/**
 * Checks if a random selection would include a specific card.
 * Simulates multiple random selections to calculate approximate probability.
 */
export function estimateInclusionProbability(
  cards: CollectionCard[],
  cardId: string,
  selectCount: number,
  simulations = 1000
): number {
  if (cards.length === 0 || selectCount <= 0) {
    return 0;
  }

  let inclusions = 0;
  for (let i = 0; i < simulations; i++) {
    const selected = selectRandomCards(cards, { count: selectCount });
    if (selected.some((c) => c.cardId === cardId)) {
      inclusions++;
    }
  }

  return inclusions / simulations;
}

// ============================================================================
// COLLECTION VALUE CALCULATION
// ============================================================================

/** Card with price data for value calculations */
export interface CardWithPrice {
  cardId: string;
  quantity: number;
  variant: CardVariant;
  price?: number;
}

/** Result of collection value calculation */
export interface CollectionValueResult {
  totalValue: number;
  valuedCardsCount: number;
  unvaluedCardsCount: number;
  totalCardsCount: number;
}

/** Card value entry for "most valuable" display */
export interface ValuedCardEntry {
  cardId: string;
  name: string;
  imageSmall: string;
  variant: CardVariant;
  quantity: number;
  unitPrice: number;
  totalValue: number;
}

/** Value breakdown by set */
export interface SetValueEntry {
  setId: string;
  setName: string;
  totalValue: number;
  cardCount: number;
}

/**
 * Checks if a price value is valid (positive number).
 */
export function isValidPrice(price: unknown): price is number {
  return typeof price === 'number' && price > 0 && isFinite(price);
}

/**
 * Rounds a value to cents (2 decimal places).
 */
export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculates the total value of cards with prices.
 * Multiplies unit price by quantity for each card.
 */
export function calculateTotalValue(cards: CardWithPrice[]): number {
  let total = 0;
  for (const card of cards) {
    if (isValidPrice(card.price)) {
      total += card.price * card.quantity;
    }
  }
  return roundToCents(total);
}

/**
 * Calculates collection value statistics.
 * Returns total value and counts of valued/unvalued cards.
 */
export function calculateCollectionValue(cards: CardWithPrice[]): CollectionValueResult {
  let totalValue = 0;
  let valuedCardsCount = 0;
  let unvaluedCardsCount = 0;

  for (const card of cards) {
    if (isValidPrice(card.price)) {
      totalValue += card.price * card.quantity;
      valuedCardsCount++;
    } else {
      unvaluedCardsCount++;
    }
  }

  return {
    totalValue: roundToCents(totalValue),
    valuedCardsCount,
    unvaluedCardsCount,
    totalCardsCount: cards.length,
  };
}

/**
 * Creates a CardWithPrice entry from a collection card and price map.
 */
export function addPriceToCard(card: CollectionCard, priceMap: Map<string, number>): CardWithPrice {
  return {
    cardId: card.cardId,
    quantity: card.quantity,
    variant: card.variant ?? DEFAULT_VARIANT,
    price: priceMap.get(card.cardId),
  };
}

/**
 * Adds prices to collection cards from a price map.
 */
export function addPricesToCollection(
  cards: CollectionCard[],
  priceMap: Map<string, number>
): CardWithPrice[] {
  return cards.map((card) => addPriceToCard(card, priceMap));
}

/**
 * Creates a ValuedCardEntry from a card with enriched data.
 */
export function createValuedCardEntry(
  card: CardWithPrice,
  cardData?: { name?: string; imageSmall?: string }
): ValuedCardEntry | null {
  if (!isValidPrice(card.price)) {
    return null;
  }

  return {
    cardId: card.cardId,
    name: cardData?.name ?? card.cardId,
    imageSmall: cardData?.imageSmall ?? '',
    variant: card.variant ?? DEFAULT_VARIANT,
    quantity: card.quantity,
    unitPrice: card.price,
    totalValue: roundToCents(card.price * card.quantity),
  };
}

/**
 * Gets the most valuable cards from a collection.
 * Returns cards sorted by total value (price × quantity) descending.
 */
export function getMostValuableCardsFromCollection(
  cards: CardWithPrice[],
  limit = 10,
  cardDataMap?: Map<string, { name?: string; imageSmall?: string }>
): ValuedCardEntry[] {
  const valuedCards: ValuedCardEntry[] = [];

  for (const card of cards) {
    const entry = createValuedCardEntry(card, cardDataMap?.get(card.cardId));
    if (entry) {
      valuedCards.push(entry);
    }
  }

  // Sort by total value descending
  valuedCards.sort((a, b) => b.totalValue - a.totalValue);

  return valuedCards.slice(0, limit);
}

/**
 * Gets the most valuable cards by unit price (single card value).
 * Useful for identifying high-value individual cards regardless of quantity.
 */
export function getMostValuableByUnitPrice(
  cards: CardWithPrice[],
  limit = 10,
  cardDataMap?: Map<string, { name?: string; imageSmall?: string }>
): ValuedCardEntry[] {
  const valuedCards: ValuedCardEntry[] = [];

  for (const card of cards) {
    const entry = createValuedCardEntry(card, cardDataMap?.get(card.cardId));
    if (entry) {
      valuedCards.push(entry);
    }
  }

  // Sort by unit price descending
  valuedCards.sort((a, b) => b.unitPrice - a.unitPrice);

  return valuedCards.slice(0, limit);
}

/**
 * Groups cards by set and calculates value per set.
 */
export function calculateValueBySet(
  cards: CardWithPrice[],
  setNameMap?: Map<string, string>
): SetValueEntry[] {
  // Group cards by set
  const cardsBySet = new Map<string, CardWithPrice[]>();
  for (const card of cards) {
    const setId = extractSetId(card.cardId);
    const existing = cardsBySet.get(setId) ?? [];
    existing.push(card);
    cardsBySet.set(setId, existing);
  }

  // Calculate value per set
  const setValues: SetValueEntry[] = [];
  for (const [setId, setCards] of cardsBySet) {
    let setValue = 0;
    for (const card of setCards) {
      if (isValidPrice(card.price)) {
        setValue += card.price * card.quantity;
      }
    }

    setValues.push({
      setId,
      setName: setNameMap?.get(setId) ?? setId,
      totalValue: roundToCents(setValue),
      cardCount: setCards.length,
    });
  }

  // Sort by value descending
  setValues.sort((a, b) => b.totalValue - a.totalValue);

  return setValues;
}

/**
 * Calculates the percentage of collection value that comes from a set.
 */
export function calculateSetValuePercentage(
  setValueEntry: SetValueEntry,
  totalCollectionValue: number
): number {
  if (totalCollectionValue <= 0) {
    return 0;
  }
  return roundToCents((setValueEntry.totalValue / totalCollectionValue) * 100);
}

/**
 * Gets the average card value in a collection.
 * Only counts cards with valid prices.
 */
export function calculateAverageCardValue(cards: CardWithPrice[]): number {
  let totalValue = 0;
  let count = 0;

  for (const card of cards) {
    if (isValidPrice(card.price)) {
      totalValue += card.price;
      count++;
    }
  }

  if (count === 0) {
    return 0;
  }

  return roundToCents(totalValue / count);
}

/**
 * Gets the median card value in a collection.
 * Only counts cards with valid prices.
 */
export function calculateMedianCardValue(cards: CardWithPrice[]): number {
  const prices = cards
    .filter((card) => isValidPrice(card.price))
    .map((card) => card.price as number)
    .sort((a, b) => a - b);

  if (prices.length === 0) {
    return 0;
  }

  const mid = Math.floor(prices.length / 2);
  if (prices.length % 2 === 0) {
    return roundToCents((prices[mid - 1] + prices[mid]) / 2);
  }
  return prices[mid];
}

/**
 * Formats a monetary value for display.
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
 * Formats a value change (positive or negative) for display.
 */
export function formatValueChange(change: number): string {
  const formatted = formatCurrency(Math.abs(change));
  if (change > 0) {
    return `+${formatted}`;
  } else if (change < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

/**
 * Calculates the value change between two totals.
 */
export function calculateValueChange(
  previousValue: number,
  currentValue: number
): { change: number; percentChange: number } {
  const change = currentValue - previousValue;
  const percentChange = previousValue > 0 ? (change / previousValue) * 100 : 0;
  return {
    change: roundToCents(change),
    percentChange: roundToCents(percentChange),
  };
}

/**
 * Gets cards above a certain value threshold.
 */
export function getCardsAboveValue(cards: CardWithPrice[], threshold: number): CardWithPrice[] {
  return cards.filter((card) => isValidPrice(card.price) && card.price >= threshold);
}

/**
 * Gets the count of "high value" cards (above a threshold).
 */
export function countHighValueCards(cards: CardWithPrice[], threshold = 10): number {
  return getCardsAboveValue(cards, threshold).length;
}

/**
 * Calculates what percentage of cards have pricing data.
 */
export function calculatePricedPercentage(result: CollectionValueResult): number {
  if (result.totalCardsCount === 0) {
    return 0;
  }
  return roundToCents((result.valuedCardsCount / result.totalCardsCount) * 100);
}

/**
 * Gets a summary message about collection value.
 */
export function getValueSummaryMessage(result: CollectionValueResult): string {
  const formatted = formatCurrency(result.totalValue);
  if (result.unvaluedCardsCount === 0) {
    return `Collection valued at ${formatted}`;
  }
  return `Collection valued at ${formatted} (${result.unvaluedCardsCount} cards without pricing)`;
}

/**
 * Checks if a collection has any valued cards.
 */
export function hasValuedCards(result: CollectionValueResult): boolean {
  return result.valuedCardsCount > 0;
}

/**
 * Gets the top N sets by value.
 */
export function getTopSetsByValue(setValues: SetValueEntry[], limit = 5): SetValueEntry[] {
  return setValues.slice(0, limit);
}

/**
 * Filters set values to only include sets above a minimum value.
 */
export function filterSetsByMinValue(
  setValues: SetValueEntry[],
  minValue: number
): SetValueEntry[] {
  return setValues.filter((set) => set.totalValue >= minValue);
}
