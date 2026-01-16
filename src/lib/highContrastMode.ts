/**
 * High-Contrast Mode Library
 *
 * Provides configuration and utilities for enhanced contrast beyond standard
 * dark mode for users with vision accessibility needs.
 *
 * This mode offers:
 * - Increased text contrast with pure black/white colors
 * - Enhanced borders and visual separators
 * - Larger focus indicators
 * - Reduced subtle color variations
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * High-contrast mode intensity levels
 */
export type HighContrastLevel = 'off' | 'medium' | 'high';

// ============================================================================
// CONSTANTS
// ============================================================================

/** localStorage key for high-contrast mode enabled state */
export const HIGH_CONTRAST_ENABLED_KEY = 'carddex_high_contrast_enabled';

/** localStorage key for high-contrast level */
export const HIGH_CONTRAST_LEVEL_KEY = 'carddex_high_contrast_level';

/** CSS class applied to the root element when high-contrast is enabled */
export const HIGH_CONTRAST_CLASS = 'high-contrast';

/** CSS class for medium contrast level */
export const HIGH_CONTRAST_MEDIUM_CLASS = 'high-contrast-medium';

/** CSS class for high contrast level */
export const HIGH_CONTRAST_HIGH_CLASS = 'high-contrast-high';

/**
 * Information about the high-contrast mode for display purposes
 */
export const HIGH_CONTRAST_INFO = {
  name: 'High Contrast',
  description:
    'Enhanced contrast mode for users with vision accessibility needs. Provides clearer text and borders.',
  shortDescription: 'Enhanced visual contrast',
  benefits: [
    'Stronger text contrast for easier reading',
    'Clearer borders and visual separators',
    'Larger focus indicators for navigation',
    'Reduced subtle color variations',
  ],
};

/**
 * Information about each contrast level for display purposes
 */
export const CONTRAST_LEVEL_INFO: Record<
  HighContrastLevel,
  {
    label: string;
    description: string;
    shortDescription: string;
  }
> = {
  off: {
    label: 'Standard',
    description: 'Normal contrast levels',
    shortDescription: 'Default colors',
  },
  medium: {
    label: 'Medium Contrast',
    description: 'Moderately increased contrast for better visibility',
    shortDescription: 'Enhanced contrast',
  },
  high: {
    label: 'High Contrast',
    description: 'Maximum contrast with pure black/white text and strong borders',
    shortDescription: 'Maximum contrast',
  },
};

/**
 * Available contrast level options for UI
 */
export const CONTRAST_LEVEL_OPTIONS: HighContrastLevel[] = ['off', 'medium', 'high'];

// ============================================================================
// PERSISTENCE FUNCTIONS
// ============================================================================

/**
 * Save high-contrast mode enabled state to localStorage
 */
export function saveHighContrastEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(HIGH_CONTRAST_ENABLED_KEY, String(enabled));
  } catch {
    // localStorage might not be available
  }
}

/**
 * Load high-contrast mode enabled state from localStorage
 */
export function loadHighContrastEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const saved = localStorage.getItem(HIGH_CONTRAST_ENABLED_KEY);
    return saved === 'true';
  } catch {
    return false;
  }
}

/**
 * Save high-contrast level to localStorage
 */
export function saveHighContrastLevel(level: HighContrastLevel): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(HIGH_CONTRAST_LEVEL_KEY, level);
  } catch {
    // localStorage might not be available
  }
}

/**
 * Load high-contrast level from localStorage
 */
export function loadHighContrastLevel(): HighContrastLevel {
  if (typeof localStorage === 'undefined') return 'off';
  try {
    const saved = localStorage.getItem(HIGH_CONTRAST_LEVEL_KEY);
    if (saved && CONTRAST_LEVEL_OPTIONS.includes(saved as HighContrastLevel)) {
      return saved as HighContrastLevel;
    }
  } catch {
    // localStorage might not be available
  }
  return 'off';
}

// ============================================================================
// CSS CLASS HELPERS
// ============================================================================

/**
 * Get CSS classes to apply based on high-contrast level
 */
export function getHighContrastClasses(level: HighContrastLevel): string[] {
  if (level === 'off') return [];

  const classes: string[] = [HIGH_CONTRAST_CLASS];

  if (level === 'medium') {
    classes.push(HIGH_CONTRAST_MEDIUM_CLASS);
  } else if (level === 'high') {
    classes.push(HIGH_CONTRAST_HIGH_CLASS);
  }

  return classes;
}

/**
 * Apply high-contrast classes to the document root
 */
export function applyHighContrastClasses(level: HighContrastLevel): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Remove all high-contrast classes first
  root.classList.remove(HIGH_CONTRAST_CLASS, HIGH_CONTRAST_MEDIUM_CLASS, HIGH_CONTRAST_HIGH_CLASS);

  // Add classes based on level
  if (level !== 'off') {
    const classes = getHighContrastClasses(level);
    classes.forEach((cls) => root.classList.add(cls));
  }
}

/**
 * Check if high-contrast mode is currently applied
 */
export function isHighContrastApplied(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains(HIGH_CONTRAST_CLASS);
}

/**
 * Get the current high-contrast level from the document
 */
export function getCurrentHighContrastLevel(): HighContrastLevel {
  if (typeof document === 'undefined') return 'off';

  const root = document.documentElement;

  if (root.classList.contains(HIGH_CONTRAST_HIGH_CLASS)) {
    return 'high';
  }
  if (root.classList.contains(HIGH_CONTRAST_MEDIUM_CLASS)) {
    return 'medium';
  }
  return 'off';
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get the display label for the current contrast level
 */
export function getHighContrastLabel(level: HighContrastLevel): string {
  return CONTRAST_LEVEL_INFO[level]?.label ?? 'Standard';
}

/**
 * Get a user-friendly description of the current state
 */
export function getHighContrastDescription(level: HighContrastLevel): string {
  return CONTRAST_LEVEL_INFO[level]?.description ?? '';
}

/**
 * Get the toggle button tooltip text
 */
export function getHighContrastTooltip(level: HighContrastLevel): string {
  if (level === 'off') {
    return 'Enable high-contrast mode for better visibility';
  }
  return `High contrast: ${CONTRAST_LEVEL_INFO[level].shortDescription}`;
}

/**
 * Check if high-contrast mode is enabled (any level other than off)
 */
export function isHighContrastEnabled(level: HighContrastLevel): boolean {
  return level !== 'off';
}
