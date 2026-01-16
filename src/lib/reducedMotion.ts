/**
 * Reduced Motion Library
 *
 * Provides a manual toggle for reduced motion that works independently of
 * the system's prefers-reduced-motion setting. This allows users who:
 * - Haven't set their system preference
 * - Want reduced motion only in this app
 * - Are using a shared device with different preferences
 *
 * The toggle works in addition to system preference - if either is enabled,
 * animations will be reduced.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Reduced motion mode options
 */
export type ReducedMotionMode = 'system' | 'always' | 'never';

// ============================================================================
// CONSTANTS
// ============================================================================

/** localStorage key for reduced motion mode */
export const REDUCED_MOTION_MODE_KEY = 'carddex_reduced_motion_mode';

/** CSS class applied to the root element when reduced motion is manually enabled */
export const REDUCED_MOTION_CLASS = 'reduce-motion';

/**
 * Information about the reduced motion mode for display purposes
 */
export const REDUCED_MOTION_INFO = {
  name: 'Reduced Motion',
  description:
    'Reduces or disables animations throughout the app for users who are sensitive to motion.',
  shortDescription: 'Disable animations',
  benefits: [
    'Prevents motion sickness from animations',
    'Reduces visual distractions',
    'Improves focus for some users',
    'Saves battery on mobile devices',
  ],
};

/**
 * Information about each motion mode for display purposes
 */
export const MOTION_MODE_INFO: Record<
  ReducedMotionMode,
  {
    label: string;
    description: string;
    shortDescription: string;
  }
> = {
  system: {
    label: 'System',
    description: "Follow your device's motion preference setting",
    shortDescription: 'Use device setting',
  },
  always: {
    label: 'Always Reduce',
    description: 'Always reduce motion regardless of system setting',
    shortDescription: 'Always reduced',
  },
  never: {
    label: 'Always Show',
    description: 'Always show animations regardless of system setting',
    shortDescription: 'Always show motion',
  },
};

/**
 * Available motion mode options for UI
 */
export const MOTION_MODE_OPTIONS: ReducedMotionMode[] = ['system', 'always', 'never'];

// ============================================================================
// SYSTEM PREFERENCE DETECTION
// ============================================================================

/**
 * Check if the system prefers reduced motion
 */
export function getSystemPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Add a listener for system motion preference changes
 * Returns a cleanup function
 */
export function addSystemMotionListener(callback: (prefersReduced: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (event: MediaQueryListEvent) => {
    callback(event.matches);
  };

  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}

// ============================================================================
// PERSISTENCE FUNCTIONS
// ============================================================================

/**
 * Save reduced motion mode to localStorage
 */
export function saveReducedMotionMode(mode: ReducedMotionMode): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(REDUCED_MOTION_MODE_KEY, mode);
  } catch {
    // localStorage might not be available
  }
}

/**
 * Load reduced motion mode from localStorage
 */
export function loadReducedMotionMode(): ReducedMotionMode {
  if (typeof localStorage === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem(REDUCED_MOTION_MODE_KEY);
    if (saved && MOTION_MODE_OPTIONS.includes(saved as ReducedMotionMode)) {
      return saved as ReducedMotionMode;
    }
  } catch {
    // localStorage might not be available
  }
  return 'system';
}

// ============================================================================
// MOTION STATE RESOLUTION
// ============================================================================

/**
 * Resolve whether motion should be reduced based on mode and system preference
 */
export function shouldReduceMotion(
  mode: ReducedMotionMode,
  systemPrefersReduced: boolean
): boolean {
  switch (mode) {
    case 'always':
      return true;
    case 'never':
      return false;
    case 'system':
    default:
      return systemPrefersReduced;
  }
}

/**
 * Get the effective motion state description
 */
export function getEffectiveMotionDescription(
  mode: ReducedMotionMode,
  systemPrefersReduced: boolean
): string {
  const isReduced = shouldReduceMotion(mode, systemPrefersReduced);

  if (mode === 'system') {
    return systemPrefersReduced
      ? 'Animations reduced (following system setting)'
      : 'Animations enabled (following system setting)';
  }
  if (mode === 'always') {
    return 'Animations always reduced';
  }
  if (mode === 'never') {
    return 'Animations always shown';
  }

  return isReduced ? 'Animations reduced' : 'Animations enabled';
}

// ============================================================================
// CSS CLASS HELPERS
// ============================================================================

/**
 * Get CSS classes to apply based on reduced motion state
 */
export function getReducedMotionClasses(shouldReduce: boolean): string[] {
  return shouldReduce ? [REDUCED_MOTION_CLASS] : [];
}

/**
 * Apply reduced motion class to the document root
 */
export function applyReducedMotionClass(shouldReduce: boolean): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (shouldReduce) {
    root.classList.add(REDUCED_MOTION_CLASS);
  } else {
    root.classList.remove(REDUCED_MOTION_CLASS);
  }
}

/**
 * Check if reduced motion class is currently applied
 */
export function isReducedMotionApplied(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains(REDUCED_MOTION_CLASS);
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get the display label for the current motion mode
 */
export function getReducedMotionLabel(mode: ReducedMotionMode): string {
  return MOTION_MODE_INFO[mode]?.label ?? 'System';
}

/**
 * Get a user-friendly description of the current state
 */
export function getReducedMotionDescription(mode: ReducedMotionMode): string {
  return MOTION_MODE_INFO[mode]?.description ?? '';
}

/**
 * Get the toggle button tooltip text
 */
export function getReducedMotionTooltip(
  mode: ReducedMotionMode,
  systemPrefersReduced: boolean
): string {
  const isReduced = shouldReduceMotion(mode, systemPrefersReduced);
  const modeLabel = MOTION_MODE_INFO[mode]?.shortDescription ?? 'System';

  if (isReduced) {
    return `Reduced motion: ${modeLabel}`;
  }
  return `Motion: ${modeLabel}`;
}

/**
 * Get a status indicator for the current motion state
 */
export function getMotionStatusIndicator(
  mode: ReducedMotionMode,
  systemPrefersReduced: boolean
): { icon: 'reduced' | 'enabled'; color: 'cyan' | 'gray' } {
  const isReduced = shouldReduceMotion(mode, systemPrefersReduced);
  return {
    icon: isReduced ? 'reduced' : 'enabled',
    color: isReduced ? 'cyan' : 'gray',
  };
}
