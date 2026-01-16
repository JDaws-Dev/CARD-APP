/**
 * Wishlist-related constants and utility functions
 * Used by both client-side code and Convex backend
 */

// Maximum number of priority (starred) items allowed per profile
export const MAX_PRIORITY_ITEMS = 5;

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
