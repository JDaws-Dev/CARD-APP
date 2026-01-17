/**
 * Wishlist-related constants and utility functions
 * Used by both client-side code and Convex backend
 */

// Maximum number of priority (starred) items allowed per profile
export const MAX_PRIORITY_ITEMS = 5;

// Valid game slugs for multi-TCG wishlist support
export const VALID_GAME_SLUGS = [
  'pokemon',
  'yugioh',
  'mtg',
  'onepiece',
  'lorcana',
  'digimon',
  'dragonball',
] as const;

export type GameSlug = (typeof VALID_GAME_SLUGS)[number];

/**
 * Check if a user can add more priority items
 * @param currentPriorityCount - Number of items currently marked as priority
 * @returns Object with canAdd boolean and remaining slots
 */
export function canAddPriority(currentPriorityCount: number): {
  canAdd: boolean;
  remaining: number;
  max: number;
} {
  const remaining = Math.max(0, MAX_PRIORITY_ITEMS - currentPriorityCount);
  return {
    canAdd: currentPriorityCount < MAX_PRIORITY_ITEMS,
    remaining,
    max: MAX_PRIORITY_ITEMS,
  };
}

/**
 * Validate priority toggle operation
 * @param currentPriorityCount - Number of items currently marked as priority
 * @param isCurrentlyPriority - Whether the item being toggled is already a priority
 * @returns Object indicating if toggle is allowed and why not if not
 */
export function validatePriorityToggle(
  currentPriorityCount: number,
  isCurrentlyPriority: boolean
): {
  allowed: boolean;
  reason?: string;
} {
  // Always allow toggling OFF (removing priority)
  if (isCurrentlyPriority) {
    return { allowed: true };
  }

  // For toggling ON, check the limit
  if (currentPriorityCount >= MAX_PRIORITY_ITEMS) {
    return {
      allowed: false,
      reason: `Maximum of ${MAX_PRIORITY_ITEMS} priority items allowed`,
    };
  }

  return { allowed: true };
}

/**
 * Get the priority status summary for a profile's wishlist
 * @param priorityItemIds - Array of card IDs that are marked as priority
 * @returns Summary object with counts and status
 */
export function getPriorityStatus(priorityItemIds: string[]): {
  count: number;
  max: number;
  remaining: number;
  isFull: boolean;
  items: string[];
} {
  const count = priorityItemIds.length;
  const remaining = Math.max(0, MAX_PRIORITY_ITEMS - count);

  return {
    count,
    max: MAX_PRIORITY_ITEMS,
    remaining,
    isFull: count >= MAX_PRIORITY_ITEMS,
    items: priorityItemIds,
  };
}

/**
 * Check if a game slug is valid
 * @param slug - The game slug to validate
 * @returns true if valid, false otherwise
 */
export function isValidGameSlug(slug: string | undefined | null): slug is GameSlug {
  if (!slug) return false;
  return VALID_GAME_SLUGS.includes(slug as GameSlug);
}

/**
 * Wishlist item with optional game information
 */
export interface WishlistItem {
  cardId: string;
  isPriority: boolean;
  gameSlug?: GameSlug;
}

/**
 * Filter wishlist items by game
 * @param items - Array of wishlist items
 * @param gameSlug - Game to filter by, or undefined for all games
 * @returns Filtered array of wishlist items
 */
export function filterWishlistByGame(
  items: WishlistItem[],
  gameSlug: GameSlug | undefined
): WishlistItem[] {
  if (!gameSlug) {
    return items;
  }
  return items.filter((item) => item.gameSlug === gameSlug);
}

/**
 * Count wishlist items by game
 * @param items - Array of wishlist items
 * @returns Object mapping game slugs to item counts
 */
export function countWishlistByGame(
  items: WishlistItem[]
): Record<string, { total: number; priority: number }> {
  const counts: Record<string, { total: number; priority: number }> = {};

  for (const item of items) {
    const game = item.gameSlug ?? 'unknown';
    if (!counts[game]) {
      counts[game] = { total: 0, priority: 0 };
    }
    counts[game].total++;
    if (item.isPriority) {
      counts[game].priority++;
    }
  }

  return counts;
}

/**
 * Get summary statistics for a wishlist
 * @param items - Array of wishlist items
 * @returns Summary with total, priority count, and game breakdown
 */
export function getWishlistSummary(items: WishlistItem[]): {
  totalItems: number;
  priorityItems: number;
  byGame: Record<string, { total: number; priority: number }>;
  gamesWithItems: GameSlug[];
} {
  const byGame = countWishlistByGame(items);
  const gamesWithItems = Object.keys(byGame).filter((game) => isValidGameSlug(game)) as GameSlug[];

  return {
    totalItems: items.length,
    priorityItems: items.filter((i) => i.isPriority).length,
    byGame,
    gamesWithItems,
  };
}
