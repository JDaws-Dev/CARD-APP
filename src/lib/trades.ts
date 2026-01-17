/**
 * Pure utility functions for trade logging operations.
 * These functions implement the core logic that can be tested
 * without a Convex backend.
 */

import {
  CardVariant,
  CollectionCard,
  isValidCardId,
  isValidQuantity,
  isValidVariant,
} from './collections';

// ============================================================================
// TYPES
// ============================================================================

/** Card entry for a trade (given or received) */
export interface TradeCardEntry {
  cardId: string;
  quantity: number;
  variant?: CardVariant;
  cardName?: string;
  setName?: string;
}

/** Collection entry for looking up cards */
export interface CollectionEntry {
  cardId: string;
  quantity: number;
  variant: CardVariant;
}

/** Result of validating a trade card entry */
export interface TradeCardValidationResult {
  valid: boolean;
  errors: string[];
}

/** Result of validating card ownership for trade */
export interface OwnershipCheckResult {
  hasCard: boolean;
  hasSufficientQuantity: boolean;
  availableQuantity: number;
  requestedQuantity: number;
  cardId: string;
  variant: CardVariant;
  error?: string;
}

/** Result of validating an entire trade */
export interface TradeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  cardErrors: {
    cardsGiven: OwnershipCheckResult[];
    cardsReceived: TradeCardValidationResult[];
  };
}

/** Trade activity log metadata structure */
export interface TradeActivityMetadata {
  cardsGiven: Array<{
    cardId: string;
    cardName: string;
    quantity: number;
    variant: CardVariant;
    setName?: string;
  }>;
  cardsReceived: Array<{
    cardId: string;
    cardName: string;
    quantity: number;
    variant: CardVariant;
    setName?: string;
  }>;
  tradingPartner: string | null;
  totalCardsGiven: number;
  totalCardsReceived: number;
}

/** Summary of a trade operation */
export interface TradeSummary {
  cardsGivenCount: number;
  cardsReceivedCount: number;
  uniqueCardsGiven: number;
  uniqueCardsReceived: number;
  tradingPartner: string | null;
  netCardChange: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default variant for trade cards */
export const DEFAULT_TRADE_VARIANT: CardVariant = 'normal';

/** Maximum cards allowed in a single trade (to prevent abuse) */
export const MAX_TRADE_CARDS = 100;

/** Maximum quantity for a single card in a trade */
export const MAX_CARD_QUANTITY = 99;

/** Maximum length for trading partner name */
export const MAX_TRADING_PARTNER_LENGTH = 100;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates a single trade card entry.
 * Checks card ID format, quantity, and variant.
 */
export function validateTradeCard(card: TradeCardEntry): TradeCardValidationResult {
  const errors: string[] = [];

  if (!card) {
    return { valid: false, errors: ['Card entry is required'] };
  }

  // Validate card ID
  if (!card.cardId) {
    errors.push('Card ID is required');
  } else if (!isValidCardId(card.cardId)) {
    errors.push(`Invalid card ID format: ${card.cardId}`);
  }

  // Validate quantity
  if (card.quantity === undefined || card.quantity === null) {
    errors.push('Quantity is required');
  } else if (!isValidQuantity(card.quantity)) {
    errors.push(`Invalid quantity: ${card.quantity}. Must be a positive integer`);
  } else if (card.quantity > MAX_CARD_QUANTITY) {
    errors.push(`Quantity exceeds maximum: ${card.quantity}. Max is ${MAX_CARD_QUANTITY}`);
  }

  // Validate variant (optional, defaults to normal)
  if (card.variant !== undefined && !isValidVariant(card.variant)) {
    errors.push(`Invalid variant: ${card.variant}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a trading partner name.
 */
export function validateTradingPartner(partner: string | undefined | null): {
  valid: boolean;
  sanitized: string | null;
  error?: string;
} {
  if (!partner) {
    return { valid: true, sanitized: null };
  }

  const trimmed = partner.trim();
  if (trimmed.length === 0) {
    return { valid: true, sanitized: null };
  }

  if (trimmed.length > MAX_TRADING_PARTNER_LENGTH) {
    return {
      valid: false,
      sanitized: null,
      error: `Trading partner name exceeds max length of ${MAX_TRADING_PARTNER_LENGTH}`,
    };
  }

  return { valid: true, sanitized: trimmed };
}

/**
 * Checks if a card is available in the collection with sufficient quantity.
 * Used to validate cards being given in a trade.
 */
export function checkCardOwnership(
  cardId: string,
  quantity: number,
  variant: CardVariant,
  collection: CollectionEntry[]
): OwnershipCheckResult {
  // Find matching entry in collection
  const entry = collection.find((c) => c.cardId === cardId && c.variant === variant);

  if (!entry) {
    return {
      hasCard: false,
      hasSufficientQuantity: false,
      availableQuantity: 0,
      requestedQuantity: quantity,
      cardId,
      variant,
      error: `Card ${cardId} with variant ${variant} not in collection`,
    };
  }

  if (entry.quantity < quantity) {
    return {
      hasCard: true,
      hasSufficientQuantity: false,
      availableQuantity: entry.quantity,
      requestedQuantity: quantity,
      cardId,
      variant,
      error: `Insufficient quantity: have ${entry.quantity}, need ${quantity}`,
    };
  }

  return {
    hasCard: true,
    hasSufficientQuantity: true,
    availableQuantity: entry.quantity,
    requestedQuantity: quantity,
    cardId,
    variant,
  };
}

/**
 * Validates an entire trade before execution.
 * Checks both cards given and received, plus overall trade validity.
 */
export function validateTrade(
  cardsGiven: TradeCardEntry[],
  cardsReceived: TradeCardEntry[],
  collection: CollectionEntry[],
  tradingPartner?: string | null
): TradeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const givenOwnershipResults: OwnershipCheckResult[] = [];
  const receivedValidationResults: TradeCardValidationResult[] = [];

  // Check for empty trade
  if (cardsGiven.length === 0 && cardsReceived.length === 0) {
    errors.push('Trade must include at least one card given or received');
  }

  // Check for too many cards
  if (cardsGiven.length > MAX_TRADE_CARDS) {
    errors.push(`Too many cards given: ${cardsGiven.length}. Max is ${MAX_TRADE_CARDS}`);
  }
  if (cardsReceived.length > MAX_TRADE_CARDS) {
    errors.push(`Too many cards received: ${cardsReceived.length}. Max is ${MAX_TRADE_CARDS}`);
  }

  // Validate cards given
  for (const card of cardsGiven) {
    const validationResult = validateTradeCard(card);

    if (!validationResult.valid) {
      errors.push(...validationResult.errors);
      givenOwnershipResults.push({
        hasCard: false,
        hasSufficientQuantity: false,
        availableQuantity: 0,
        requestedQuantity: card.quantity ?? 0,
        cardId: card.cardId ?? 'unknown',
        variant: (card.variant ?? 'normal') as CardVariant,
        error: validationResult.errors.join(', '),
      });
    } else {
      // Check ownership
      const ownershipResult = checkCardOwnership(
        card.cardId,
        card.quantity,
        (card.variant ?? 'normal') as CardVariant,
        collection
      );
      givenOwnershipResults.push(ownershipResult);

      if (ownershipResult.error) {
        errors.push(ownershipResult.error);
      }
    }
  }

  // Validate cards received
  for (const card of cardsReceived) {
    const validationResult = validateTradeCard(card);
    receivedValidationResults.push(validationResult);

    if (!validationResult.valid) {
      errors.push(...validationResult.errors);
    }
  }

  // Validate trading partner
  const partnerValidation = validateTradingPartner(tradingPartner);
  if (!partnerValidation.valid && partnerValidation.error) {
    errors.push(partnerValidation.error);
  }

  // Add warnings for edge cases
  if (cardsGiven.length === 0 && cardsReceived.length > 0) {
    warnings.push('Trade is a gift (no cards given)');
  }
  if (cardsReceived.length === 0 && cardsGiven.length > 0) {
    warnings.push('Trade is a donation (no cards received)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    cardErrors: {
      cardsGiven: givenOwnershipResults,
      cardsReceived: receivedValidationResults,
    },
  };
}

/**
 * Checks for duplicate card entries in a trade (same cardId + variant).
 * Duplicates should be combined into a single entry with summed quantities.
 */
export function findDuplicateTradeCards(cards: TradeCardEntry[]): Map<string, TradeCardEntry[]> {
  const grouped = new Map<string, TradeCardEntry[]>();
  const duplicates = new Map<string, TradeCardEntry[]>();

  for (const card of cards) {
    const key = `${card.cardId}:${card.variant ?? 'normal'}`;
    const existing = grouped.get(key) ?? [];
    existing.push(card);
    grouped.set(key, existing);

    if (existing.length > 1) {
      duplicates.set(key, existing);
    }
  }

  return duplicates;
}

/**
 * Normalizes trade card entries by combining duplicates.
 */
export function normalizeTradeCards(cards: TradeCardEntry[]): TradeCardEntry[] {
  const combined = new Map<string, TradeCardEntry>();

  for (const card of cards) {
    const key = `${card.cardId}:${card.variant ?? 'normal'}`;
    const existing = combined.get(key);

    if (existing) {
      // Combine quantities, keep first card's metadata
      combined.set(key, {
        ...existing,
        quantity: existing.quantity + card.quantity,
      });
    } else {
      combined.set(key, {
        ...card,
        variant: (card.variant ?? 'normal') as CardVariant,
      });
    }
  }

  return Array.from(combined.values());
}

// ============================================================================
// COLLECTION UPDATE FUNCTIONS
// ============================================================================

/**
 * Simulates removing cards from a collection (for given cards).
 * Returns the updated collection.
 */
export function removeCardsFromCollection(
  collection: CollectionEntry[],
  cardsToRemove: TradeCardEntry[]
): CollectionEntry[] {
  const result = [...collection];

  for (const card of cardsToRemove) {
    const variant = (card.variant ?? 'normal') as CardVariant;
    const index = result.findIndex((c) => c.cardId === card.cardId && c.variant === variant);

    if (index !== -1) {
      const entry = result[index];
      if (entry.quantity > card.quantity) {
        // Reduce quantity
        result[index] = { ...entry, quantity: entry.quantity - card.quantity };
      } else {
        // Remove entirely
        result.splice(index, 1);
      }
    }
  }

  return result;
}

/**
 * Simulates adding cards to a collection (for received cards).
 * Returns the updated collection.
 */
export function addCardsToCollection(
  collection: CollectionEntry[],
  cardsToAdd: TradeCardEntry[]
): CollectionEntry[] {
  const result = [...collection];

  for (const card of cardsToAdd) {
    const variant = (card.variant ?? 'normal') as CardVariant;
    const index = result.findIndex((c) => c.cardId === card.cardId && c.variant === variant);

    if (index !== -1) {
      // Update existing entry
      const entry = result[index];
      result[index] = { ...entry, quantity: entry.quantity + card.quantity };
    } else {
      // Add new entry
      result.push({
        cardId: card.cardId,
        quantity: card.quantity,
        variant,
      });
    }
  }

  return result;
}

/**
 * Simulates executing a complete trade and returns the resulting collection.
 */
export function simulateTrade(
  collection: CollectionEntry[],
  cardsGiven: TradeCardEntry[],
  cardsReceived: TradeCardEntry[]
): CollectionEntry[] {
  let result = removeCardsFromCollection(collection, cardsGiven);
  result = addCardsToCollection(result, cardsReceived);
  return result;
}

// ============================================================================
// TRADE SUMMARY FUNCTIONS
// ============================================================================

/**
 * Calculates the total quantity of cards in a trade card array.
 */
export function calculateTotalQuantity(cards: TradeCardEntry[]): number {
  return cards.reduce((sum, card) => sum + card.quantity, 0);
}

/**
 * Calculates the number of unique cards in a trade card array.
 */
export function calculateUniqueCards(cards: TradeCardEntry[]): number {
  const uniqueIds = new Set(cards.map((c) => c.cardId));
  return uniqueIds.size;
}

/**
 * Creates a trade summary from trade parameters.
 */
export function createTradeSummary(
  cardsGiven: TradeCardEntry[],
  cardsReceived: TradeCardEntry[],
  tradingPartner?: string | null
): TradeSummary {
  const cardsGivenCount = calculateTotalQuantity(cardsGiven);
  const cardsReceivedCount = calculateTotalQuantity(cardsReceived);

  return {
    cardsGivenCount,
    cardsReceivedCount,
    uniqueCardsGiven: calculateUniqueCards(cardsGiven),
    uniqueCardsReceived: calculateUniqueCards(cardsReceived),
    tradingPartner: tradingPartner?.trim() || null,
    netCardChange: cardsReceivedCount - cardsGivenCount,
  };
}

/**
 * Creates trade activity metadata for logging.
 */
export function createTradeActivityMetadata(
  cardsGiven: TradeCardEntry[],
  cardsReceived: TradeCardEntry[],
  tradingPartner?: string | null
): TradeActivityMetadata {
  return {
    cardsGiven: cardsGiven.map((c) => ({
      cardId: c.cardId,
      cardName: c.cardName ?? c.cardId,
      quantity: c.quantity,
      variant: (c.variant ?? 'normal') as CardVariant,
      setName: c.setName,
    })),
    cardsReceived: cardsReceived.map((c) => ({
      cardId: c.cardId,
      cardName: c.cardName ?? c.cardId,
      quantity: c.quantity,
      variant: (c.variant ?? 'normal') as CardVariant,
      setName: c.setName,
    })),
    tradingPartner: tradingPartner?.trim() || null,
    totalCardsGiven: calculateTotalQuantity(cardsGiven),
    totalCardsReceived: calculateTotalQuantity(cardsReceived),
  };
}

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Formats a trade card for display.
 */
export function formatTradeCard(card: TradeCardEntry): string {
  const name = card.cardName ?? card.cardId;
  const variant =
    card.variant && card.variant !== 'normal' ? ` (${formatVariant(card.variant)})` : '';
  const quantity = card.quantity > 1 ? ` x${card.quantity}` : '';
  return `${name}${variant}${quantity}`;
}

/**
 * Formats a variant for display.
 */
export function formatVariant(variant: CardVariant): string {
  switch (variant) {
    case 'holofoil':
      return 'Holofoil';
    case 'reverseHolofoil':
      return 'Reverse Holofoil';
    case '1stEditionHolofoil':
      return '1st Edition Holofoil';
    case '1stEditionNormal':
      return '1st Edition';
    default:
      return 'Normal';
  }
}

/**
 * Formats a trade summary for display.
 */
export function formatTradeSummary(summary: TradeSummary): string {
  const parts: string[] = [];

  if (summary.cardsGivenCount > 0) {
    parts.push(`Gave ${summary.cardsGivenCount} card${summary.cardsGivenCount !== 1 ? 's' : ''}`);
  }
  if (summary.cardsReceivedCount > 0) {
    parts.push(
      `Received ${summary.cardsReceivedCount} card${summary.cardsReceivedCount !== 1 ? 's' : ''}`
    );
  }
  if (summary.tradingPartner) {
    parts.push(`with ${summary.tradingPartner}`);
  }

  return parts.join(', ') || 'Empty trade';
}

/**
 * Gets a trade description based on the summary.
 */
export function getTradeDescription(summary: TradeSummary): string {
  if (summary.cardsGivenCount === 0 && summary.cardsReceivedCount === 0) {
    return 'Empty trade';
  }
  if (summary.cardsGivenCount === 0) {
    return 'Gift received';
  }
  if (summary.cardsReceivedCount === 0) {
    return 'Donation made';
  }
  if (summary.netCardChange > 0) {
    return `Trade (+${summary.netCardChange} cards)`;
  }
  if (summary.netCardChange < 0) {
    return `Trade (${summary.netCardChange} cards)`;
  }
  return 'Even trade';
}

/**
 * Formats the net change from a trade.
 */
export function formatNetChange(netChange: number): string {
  if (netChange > 0) {
    return `+${netChange} card${netChange !== 1 ? 's' : ''}`;
  }
  if (netChange < 0) {
    return `${netChange} card${netChange !== -1 ? 's' : ''}`;
  }
  return 'No change';
}
