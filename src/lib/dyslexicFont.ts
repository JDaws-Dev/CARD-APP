/**
 * Dyslexic Font Library
 *
 * Provides configuration and utilities for an OpenDyslexic font option
 * to improve readability for users with dyslexia.
 *
 * OpenDyslexic is a free font designed to increase readability for readers
 * with dyslexia. The letters have weighted bottoms to indicate direction
 * and prevent confusion between similar letters.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Font style options for the dyslexic-friendly font
 */
export type DyslexicFontStyle = 'normal' | 'bold' | 'italic';

// ============================================================================
// CONSTANTS
// ============================================================================

/** localStorage key for dyslexic font enabled state */
export const DYSLEXIC_FONT_ENABLED_KEY = 'carddex_dyslexic_font_enabled';

/** CSS class applied to the root element when dyslexic font is enabled */
export const DYSLEXIC_FONT_CLASS = 'dyslexic-font';

/**
 * Information about the OpenDyslexic font for display purposes
 */
export const DYSLEXIC_FONT_INFO = {
  name: 'OpenDyslexic',
  description:
    'A font designed to increase readability for readers with dyslexia. Letters have weighted bottoms to help with recognition.',
  shortDescription: 'Easier to read font',
  benefits: [
    'Weighted bottoms help indicate direction',
    'Unique letter shapes reduce confusion',
    'Increased spacing for better clarity',
    'Designed by experts for readability',
  ],
  source: 'https://opendyslexic.org/',
};

// ============================================================================
// PERSISTENCE FUNCTIONS
// ============================================================================

/**
 * Save dyslexic font enabled state to localStorage
 */
export function saveDyslexicFontEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(DYSLEXIC_FONT_ENABLED_KEY, String(enabled));
  } catch {
    // localStorage might not be available
  }
}

/**
 * Load dyslexic font enabled state from localStorage
 */
export function loadDyslexicFontEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const saved = localStorage.getItem(DYSLEXIC_FONT_ENABLED_KEY);
    return saved === 'true';
  } catch {
    return false;
  }
}

// ============================================================================
// CSS CLASS HELPERS
// ============================================================================

/**
 * Apply dyslexic font class to the document root
 */
export function applyDyslexicFontClass(enabled: boolean): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (enabled) {
    root.classList.add(DYSLEXIC_FONT_CLASS);
  } else {
    root.classList.remove(DYSLEXIC_FONT_CLASS);
  }
}

/**
 * Check if dyslexic font class is currently applied
 */
export function isDyslexicFontApplied(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains(DYSLEXIC_FONT_CLASS);
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get the display label for the font toggle
 */
export function getDyslexicFontLabel(enabled: boolean): string {
  return enabled ? 'OpenDyslexic On' : 'Standard Font';
}

/**
 * Get a user-friendly description of the current state
 */
export function getDyslexicFontDescription(enabled: boolean): string {
  return enabled ? 'Using OpenDyslexic font for easier reading' : 'Using standard system font';
}

/**
 * Get the toggle button tooltip text
 */
export function getDyslexicFontTooltip(enabled: boolean): string {
  return enabled
    ? 'Click to switch back to standard font'
    : 'Click to enable dyslexia-friendly font';
}
