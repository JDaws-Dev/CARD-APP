/**
 * Focus Mode Library
 *
 * Provides configuration and utilities for hiding gamification elements
 * for users who find them overwhelming or distracting.
 *
 * Focus mode hides:
 * - Streak counters
 * - Level/XP displays
 * - Achievement badges
 * - Milestone celebrations
 * - Collection celebrations
 * - Progress bars
 *
 * This mode is designed to be inclusive and help users focus on
 * the core collection functionality without gamification pressure.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Focus mode settings that can be individually toggled
 */
export interface FocusModeSettings {
  /** Hide streak counter in header */
  hideStreaks: boolean;
  /** Hide level/XP display in header */
  hideLevels: boolean;
  /** Hide achievement badges and notifications */
  hideAchievements: boolean;
  /** Hide milestone celebrations */
  hideMilestones: boolean;
  /** Hide collection completion celebrations */
  hideCompletionCelebrations: boolean;
  /** Hide progress bars */
  hideProgressBars: boolean;
}

/**
 * Preset levels for focus mode
 */
export type FocusModePreset = 'off' | 'minimal' | 'full';

// ============================================================================
// CONSTANTS
// ============================================================================

/** localStorage key for focus mode enabled state */
export const FOCUS_MODE_ENABLED_KEY = 'carddex_focus_mode_enabled';

/** localStorage key for focus mode settings */
export const FOCUS_MODE_SETTINGS_KEY = 'carddex_focus_mode_settings';

/** localStorage key for preset selection */
export const FOCUS_MODE_PRESET_KEY = 'carddex_focus_mode_preset';

/**
 * Default settings when focus mode is enabled (all gamification hidden)
 */
export const DEFAULT_FOCUS_MODE_SETTINGS: FocusModeSettings = {
  hideStreaks: true,
  hideLevels: true,
  hideAchievements: true,
  hideMilestones: true,
  hideCompletionCelebrations: true,
  hideProgressBars: true,
};

/**
 * Settings presets for different levels of focus mode
 */
export const FOCUS_MODE_PRESETS: Record<FocusModePreset, FocusModeSettings> = {
  off: {
    hideStreaks: false,
    hideLevels: false,
    hideAchievements: false,
    hideMilestones: false,
    hideCompletionCelebrations: false,
    hideProgressBars: false,
  },
  minimal: {
    hideStreaks: true,
    hideLevels: true,
    hideAchievements: false,
    hideMilestones: true,
    hideCompletionCelebrations: false,
    hideProgressBars: false,
  },
  full: {
    hideStreaks: true,
    hideLevels: true,
    hideAchievements: true,
    hideMilestones: true,
    hideCompletionCelebrations: true,
    hideProgressBars: true,
  },
};

/**
 * Information about each preset for display purposes
 */
export const FOCUS_MODE_PRESET_INFO: Record<
  FocusModePreset,
  {
    label: string;
    description: string;
    shortDescription: string;
  }
> = {
  off: {
    label: 'Off',
    description: 'All gamification features are visible',
    shortDescription: 'All features visible',
  },
  minimal: {
    label: 'Minimal',
    description: 'Hides header elements (streaks, levels) but keeps celebrations',
    shortDescription: 'Hide header stats',
  },
  full: {
    label: 'Full Focus',
    description: 'Hides all gamification - pure collection experience',
    shortDescription: 'Collection only',
  },
};

/**
 * Information about each individual setting for display purposes
 */
export const FOCUS_MODE_SETTING_INFO: Record<
  keyof FocusModeSettings,
  {
    label: string;
    description: string;
  }
> = {
  hideStreaks: {
    label: 'Hide Streaks',
    description: 'Hide daily streak counter from the header',
  },
  hideLevels: {
    label: 'Hide Levels',
    description: 'Hide level and XP progress from the header',
  },
  hideAchievements: {
    label: 'Hide Achievements',
    description: 'Hide achievement badges and unlock notifications',
  },
  hideMilestones: {
    label: 'Hide Milestones',
    description: 'Hide collection milestone celebrations',
  },
  hideCompletionCelebrations: {
    label: 'Hide Celebrations',
    description: 'Hide set completion confetti and celebrations',
  },
  hideProgressBars: {
    label: 'Hide Progress',
    description: 'Hide progress bars and XP indicators',
  },
};

/**
 * List of gamification elements that are hidden in focus mode
 * Used for display in the UI
 */
export const HIDDEN_GAMIFICATION_ELEMENTS = [
  'Streak counters',
  'Level & XP displays',
  'Achievement badges',
  'Milestone celebrations',
  'Completion confetti',
  'Progress bars',
] as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a preset matches the current settings
 */
export function getMatchingFocusModePreset(settings: FocusModeSettings): FocusModePreset | null {
  for (const [preset, presetSettings] of Object.entries(FOCUS_MODE_PRESETS)) {
    const allMatch = (Object.keys(presetSettings) as Array<keyof FocusModeSettings>).every(
      (key) => settings[key] === presetSettings[key]
    );
    if (allMatch) {
      return preset as FocusModePreset;
    }
  }
  return null;
}

/**
 * Get settings for a preset
 */
export function getFocusModePresetSettings(preset: FocusModePreset): FocusModeSettings {
  return { ...FOCUS_MODE_PRESETS[preset] };
}

/**
 * Get the label for a preset
 */
export function getFocusModePresetLabel(preset: FocusModePreset): string {
  return FOCUS_MODE_PRESET_INFO[preset]?.label ?? preset;
}

/**
 * Get the description for a preset
 */
export function getFocusModePresetDescription(preset: FocusModePreset): string {
  return FOCUS_MODE_PRESET_INFO[preset]?.description ?? '';
}

/**
 * Count how many settings are enabled (hidden)
 */
export function countHiddenSettings(settings: FocusModeSettings): number {
  return Object.values(settings).filter(Boolean).length;
}

/**
 * Get a summary of enabled settings for display
 */
export function getFocusModeSettingsSummary(settings: FocusModeSettings): string {
  const hidden = Object.entries(settings)
    .filter(([, value]) => value)
    .map(([key]) => FOCUS_MODE_SETTING_INFO[key as keyof FocusModeSettings]?.label ?? key);

  if (hidden.length === 0) {
    return 'All features visible';
  }
  if (hidden.length === Object.keys(settings).length) {
    return 'All gamification hidden';
  }
  if (hidden.length <= 2) {
    return hidden.join(' and ') + ' hidden';
  }
  return `${hidden.length} elements hidden`;
}

/**
 * Check if focus mode is effectively enabled (any settings are true)
 */
export function isFocusModeEffectivelyEnabled(settings: FocusModeSettings): boolean {
  return Object.values(settings).some(Boolean);
}

// ============================================================================
// PERSISTENCE FUNCTIONS
// ============================================================================

/**
 * Save focus mode enabled state to localStorage
 */
export function saveFocusModeEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(FOCUS_MODE_ENABLED_KEY, String(enabled));
  } catch {
    // localStorage might not be available
  }
}

/**
 * Load focus mode enabled state from localStorage
 */
export function loadFocusModeEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const saved = localStorage.getItem(FOCUS_MODE_ENABLED_KEY);
    return saved === 'true';
  } catch {
    return false;
  }
}

/**
 * Save focus mode settings to localStorage
 */
export function saveFocusModeSettings(settings: FocusModeSettings): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(FOCUS_MODE_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // localStorage might not be available
  }
}

/**
 * Load focus mode settings from localStorage
 */
export function loadFocusModeSettings(): FocusModeSettings {
  if (typeof localStorage === 'undefined') return { ...FOCUS_MODE_PRESETS.off };
  try {
    const saved = localStorage.getItem(FOCUS_MODE_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate and merge with defaults to handle missing keys
      return {
        hideStreaks:
          typeof parsed.hideStreaks === 'boolean'
            ? parsed.hideStreaks
            : FOCUS_MODE_PRESETS.off.hideStreaks,
        hideLevels:
          typeof parsed.hideLevels === 'boolean'
            ? parsed.hideLevels
            : FOCUS_MODE_PRESETS.off.hideLevels,
        hideAchievements:
          typeof parsed.hideAchievements === 'boolean'
            ? parsed.hideAchievements
            : FOCUS_MODE_PRESETS.off.hideAchievements,
        hideMilestones:
          typeof parsed.hideMilestones === 'boolean'
            ? parsed.hideMilestones
            : FOCUS_MODE_PRESETS.off.hideMilestones,
        hideCompletionCelebrations:
          typeof parsed.hideCompletionCelebrations === 'boolean'
            ? parsed.hideCompletionCelebrations
            : FOCUS_MODE_PRESETS.off.hideCompletionCelebrations,
        hideProgressBars:
          typeof parsed.hideProgressBars === 'boolean'
            ? parsed.hideProgressBars
            : FOCUS_MODE_PRESETS.off.hideProgressBars,
      };
    }
  } catch {
    // Invalid JSON or localStorage not available
  }
  return { ...FOCUS_MODE_PRESETS.off };
}

/**
 * Save selected preset to localStorage
 */
export function saveFocusModePreset(preset: FocusModePreset): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(FOCUS_MODE_PRESET_KEY, preset);
  } catch {
    // localStorage might not be available
  }
}

/**
 * Load selected preset from localStorage
 */
export function loadFocusModePreset(): FocusModePreset {
  if (typeof localStorage === 'undefined') return 'off';
  try {
    const saved = localStorage.getItem(FOCUS_MODE_PRESET_KEY);
    if (saved && ['off', 'minimal', 'full'].includes(saved)) {
      return saved as FocusModePreset;
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
 * CSS class to apply to document root when focus mode is enabled
 */
export const FOCUS_MODE_CSS_CLASS = 'focus-mode';

/**
 * CSS class for elements that should be hidden in focus mode
 */
export const FOCUS_MODE_HIDE_CLASS = 'hide-in-focus-mode';

/**
 * CSS class for elements that should only show in focus mode
 */
export const FOCUS_MODE_SHOW_CLASS = 'show-in-focus-mode';

/**
 * Apply focus mode classes to the document root
 */
export function applyFocusModeClasses(enabled: boolean): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (enabled) {
    root.classList.add(FOCUS_MODE_CSS_CLASS);
  } else {
    root.classList.remove(FOCUS_MODE_CSS_CLASS);
  }
}

/**
 * Check if focus mode CSS class is currently applied
 */
export function isFocusModeClassApplied(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains(FOCUS_MODE_CSS_CLASS);
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get the label for the focus mode toggle button
 */
export function getFocusModeLabel(enabled: boolean): string {
  return enabled ? 'Focus mode on' : 'Focus mode';
}

/**
 * Get the description for the current focus mode state
 */
export function getFocusModeDescription(enabled: boolean): string {
  return enabled ? 'Gamification elements are hidden' : 'Show all gamification features';
}

/**
 * Get the tooltip text for the focus mode toggle
 */
export function getFocusModeTooltip(enabled: boolean): string {
  return enabled
    ? 'Focus mode is on - gamification hidden'
    : 'Focus mode - hide gamification elements';
}

/**
 * Get the aria-label for the focus mode toggle button
 */
export function getFocusModeAriaLabel(enabled: boolean): string {
  return enabled
    ? 'Disable focus mode to show gamification elements'
    : 'Enable focus mode to hide gamification elements';
}
