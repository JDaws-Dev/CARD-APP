/**
 * Screen Reader Utilities for Enhanced Accessibility
 *
 * This module provides utilities for improving screen reader support across the app,
 * including live region announcements, enhanced ARIA descriptions, and dynamic content helpers.
 */

// ============================================================================
// LIVE REGION ANNOUNCEMENT TYPES
// ============================================================================

/**
 * Politeness level for live region announcements
 * - polite: Waits for a pause in user activity before announcing
 * - assertive: Interrupts current speech to announce immediately
 */
export type LiveRegionPoliteness = 'polite' | 'assertive';

/**
 * Configuration for a live announcement
 */
export interface LiveAnnouncementConfig {
  message: string;
  politeness?: LiveRegionPoliteness;
  /** Clear the announcement after delay (ms). Default: 5000 */
  clearAfter?: number;
}

// ============================================================================
// LIVE REGION MANAGER
// ============================================================================

/**
 * Creates and manages a live region element for screen reader announcements.
 * This is useful for announcing dynamic content changes that don't have
 * their own ARIA live regions.
 */
class LiveRegionManager {
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;
  private clearTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Initialize live region elements in the DOM
   */
  initialize(): void {
    if (typeof document === 'undefined') return;

    // Create polite live region
    if (!this.politeRegion) {
      this.politeRegion = this.createLiveRegion('polite');
    }

    // Create assertive live region
    if (!this.assertiveRegion) {
      this.assertiveRegion = this.createLiveRegion('assertive');
    }
  }

  /**
   * Create a visually hidden live region element
   */
  private createLiveRegion(politeness: LiveRegionPoliteness): HTMLElement {
    const region = document.createElement('div');
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.setAttribute('role', 'status');
    region.id = `sr-live-region-${politeness}`;

    // Visually hidden but accessible to screen readers
    Object.assign(region.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });

    document.body.appendChild(region);
    return region;
  }

  /**
   * Announce a message to screen readers
   */
  announce(config: LiveAnnouncementConfig): void {
    if (typeof document === 'undefined') return;

    const { message, politeness = 'polite', clearAfter = 5000 } = config;
    const region = politeness === 'assertive' ? this.assertiveRegion : this.politeRegion;

    if (!region) {
      this.initialize();
      // Try again after initialization
      setTimeout(() => this.announce(config), 100);
      return;
    }

    // Clear any pending timeout for this region
    const timeoutKey = politeness;
    const existingTimeout = this.clearTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set the message
    region.textContent = message;

    // Schedule clearing the message
    if (clearAfter > 0) {
      const timeout = setTimeout(() => {
        if (region) {
          region.textContent = '';
        }
        this.clearTimeouts.delete(timeoutKey);
      }, clearAfter);
      this.clearTimeouts.set(timeoutKey, timeout);
    }
  }

  /**
   * Cleanup live regions when no longer needed
   */
  cleanup(): void {
    this.clearTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.clearTimeouts.clear();

    if (this.politeRegion) {
      this.politeRegion.remove();
      this.politeRegion = null;
    }
    if (this.assertiveRegion) {
      this.assertiveRegion.remove();
      this.assertiveRegion = null;
    }
  }
}

// Singleton instance
let liveRegionManager: LiveRegionManager | null = null;

/**
 * Get the live region manager instance
 */
export function getLiveRegionManager(): LiveRegionManager {
  if (!liveRegionManager) {
    liveRegionManager = new LiveRegionManager();
  }
  return liveRegionManager;
}

/**
 * Announce a message to screen readers
 * Convenience function that uses the singleton manager
 */
export function announceToScreenReader(
  message: string,
  politeness: LiveRegionPoliteness = 'polite'
): void {
  getLiveRegionManager().announce({ message, politeness });
}

// ============================================================================
// ARIA DESCRIPTION GENERATORS
// ============================================================================

/**
 * Generate an enhanced ARIA label for a card in the collection
 */
export interface CardAriaLabelOptions {
  cardName: string;
  cardNumber: string;
  setName?: string;
  rarity?: string;
  isOwned: boolean;
  ownedQuantity?: number;
  isWishlisted?: boolean;
  isPriority?: boolean;
  isNewlyAdded?: boolean;
  marketPrice?: number | null;
  variants?: Array<{ type: string; quantity: number }>;
}

export function generateCardAriaLabel(options: CardAriaLabelOptions): string {
  const {
    cardName,
    cardNumber,
    setName,
    rarity,
    isOwned,
    ownedQuantity = 0,
    isWishlisted = false,
    isPriority = false,
    isNewlyAdded = false,
    marketPrice,
    variants,
  } = options;

  const parts: string[] = [];

  // Card identification
  parts.push(`${cardName}, number ${cardNumber}`);
  if (setName) {
    parts.push(`from ${setName}`);
  }
  if (rarity) {
    parts.push(`${rarity} rarity`);
  }

  // Ownership status
  if (isOwned) {
    if (ownedQuantity > 1) {
      parts.push(`owned ${ownedQuantity} copies`);
    } else {
      parts.push('owned');
    }

    // Variant details if available
    if (variants && variants.length > 0) {
      const variantDesc = variants
        .map((v) => `${v.quantity} ${v.type}${v.quantity > 1 ? 's' : ''}`)
        .join(', ');
      parts.push(variantDesc);
    }
  } else {
    parts.push('not in collection');
  }

  // Special states
  if (isNewlyAdded) {
    parts.push('recently added');
  }
  if (isWishlisted) {
    parts.push(isPriority ? 'priority wishlist item' : 'on wishlist');
  }

  // Price if available
  if (marketPrice !== null && marketPrice !== undefined) {
    parts.push(`market value $${marketPrice.toFixed(2)}`);
  }

  return parts.join(', ');
}

/**
 * Generate an ARIA label for a badge/achievement
 */
export interface BadgeAriaLabelOptions {
  badgeName: string;
  description: string;
  isEarned: boolean;
  earnedDate?: string;
  progress?: number;
  progressCurrent?: number;
  progressTotal?: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export function generateBadgeAriaLabel(options: BadgeAriaLabelOptions): string {
  const {
    badgeName,
    description,
    isEarned,
    earnedDate,
    progress,
    progressCurrent,
    progressTotal,
    tier,
  } = options;

  const parts: string[] = [];

  // Badge name and tier
  if (tier) {
    parts.push(`${tier} tier badge: ${badgeName}`);
  } else {
    parts.push(`Badge: ${badgeName}`);
  }

  // Status
  if (isEarned) {
    parts.push('earned');
    if (earnedDate) {
      parts.push(`on ${earnedDate}`);
    }
  } else {
    parts.push('locked');
    // Progress information
    if (progress !== undefined && progressCurrent !== undefined && progressTotal !== undefined) {
      parts.push(`${Math.round(progress)}% complete, ${progressCurrent} of ${progressTotal}`);
    }
  }

  // Description
  parts.push(description);

  return parts.join('. ');
}

/**
 * Generate an ARIA label for a stat/counter display
 */
export interface StatAriaLabelOptions {
  label: string;
  value: number | string;
  context?: string;
  changeDescription?: string;
}

export function generateStatAriaLabel(options: StatAriaLabelOptions): string {
  const { label, value, context, changeDescription } = options;

  const parts: string[] = [];

  parts.push(`${label}: ${value}`);

  if (context) {
    parts.push(context);
  }

  if (changeDescription) {
    parts.push(changeDescription);
  }

  return parts.join('. ');
}

/**
 * Generate an ARIA label for activity feed items
 */
export interface ActivityAriaLabelOptions {
  actionType: 'card_added' | 'card_removed' | 'achievement_earned';
  cardName?: string;
  setName?: string;
  achievementName?: string;
  quantity?: number;
  timestamp: string;
}

export function generateActivityAriaLabel(options: ActivityAriaLabelOptions): string {
  const { actionType, cardName, setName, achievementName, quantity, timestamp } = options;

  switch (actionType) {
    case 'card_added': {
      let desc = `Added ${cardName || 'a card'}`;
      if (quantity && quantity > 1) {
        desc += ` (${quantity} copies)`;
      }
      if (setName) {
        desc += ` from ${setName}`;
      }
      return `${desc}, ${timestamp}`;
    }
    case 'card_removed': {
      let desc = `Removed ${cardName || 'a card'}`;
      if (setName) {
        desc += ` from ${setName}`;
      }
      return `${desc}, ${timestamp}`;
    }
    case 'achievement_earned':
      return `Earned achievement: ${achievementName || 'new badge'}, ${timestamp}`;
    default:
      return `Activity logged, ${timestamp}`;
  }
}

// ============================================================================
// DYNAMIC CONTENT CHANGE DESCRIPTIONS
// ============================================================================

/**
 * Generate a description for a quantity change
 */
export function describeQuantityChange(
  itemName: string,
  previousQuantity: number,
  newQuantity: number
): string {
  const diff = newQuantity - previousQuantity;

  if (diff > 0) {
    return `Added ${diff} ${itemName}${diff > 1 ? 's' : ''}. Total: ${newQuantity}`;
  } else if (diff < 0) {
    return `Removed ${Math.abs(diff)} ${itemName}${Math.abs(diff) > 1 ? 's' : ''}. Total: ${newQuantity}`;
  }
  return `${itemName} quantity unchanged at ${newQuantity}`;
}

/**
 * Generate a description for a progress update
 */
export function describeProgressUpdate(
  taskName: string,
  previousPercent: number,
  newPercent: number,
  current: number,
  total: number
): string {
  if (newPercent >= 100) {
    return `${taskName} complete! ${current} of ${total}`;
  }

  const diff = newPercent - previousPercent;
  if (diff > 0) {
    return `${taskName} progress increased to ${Math.round(newPercent)}%. ${current} of ${total}`;
  }
  return `${taskName} at ${Math.round(newPercent)}%. ${current} of ${total}`;
}

/**
 * Generate a description for streak changes
 */
export function describeStreakChange(
  previousStreak: number,
  newStreak: number,
  isActiveToday: boolean
): string {
  if (newStreak > previousStreak) {
    return `Streak increased to ${newStreak} days! ${isActiveToday ? 'Active today.' : ''}`;
  } else if (newStreak < previousStreak && previousStreak > 0) {
    return newStreak === 0
      ? 'Streak ended. Start a new streak by adding a card today!'
      : `Streak reset to ${newStreak} days.`;
  }
  return `${newStreak} day streak. ${isActiveToday ? 'Active today.' : 'Add a card to continue your streak.'}`;
}

// ============================================================================
// CONSTANTS FOR ARIA ROLES AND PROPERTIES
// ============================================================================

/**
 * Common ARIA role suggestions for different UI elements
 */
export const ARIA_ROLES = {
  // Live regions
  STATUS: 'status' as const,
  ALERT: 'alert' as const,
  LOG: 'log' as const,
  MARQUEE: 'marquee' as const,
  TIMER: 'timer' as const,

  // Structural
  REGION: 'region' as const,
  GROUP: 'group' as const,
  LIST: 'list' as const,
  LISTITEM: 'listitem' as const,

  // Interactive
  BUTTON: 'button' as const,
  CHECKBOX: 'checkbox' as const,
  PROGRESSBAR: 'progressbar' as const,
  SLIDER: 'slider' as const,
  TABLIST: 'tablist' as const,
  TAB: 'tab' as const,
  TABPANEL: 'tabpanel' as const,

  // Grid/Table
  GRID: 'grid' as const,
  GRIDCELL: 'gridcell' as const,
  ROW: 'row' as const,
  ROWGROUP: 'rowgroup' as const,
} as const;

/**
 * Common descriptions for UI states
 */
export const STATE_DESCRIPTIONS = {
  LOADING: 'Loading content, please wait',
  EMPTY: 'No items to display',
  ERROR: 'An error occurred',
  SUCCESS: 'Action completed successfully',
  PENDING: 'Action pending',
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Re-export LiveAnnouncementConfig with an alias for convenience
export type AnnouncementConfig = LiveAnnouncementConfig;
