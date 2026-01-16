/**
 * Low-Stimulation Mode Library
 *
 * Provides configuration and utilities for an autism-friendly mode with:
 * - Reduced animations
 * - Muted colors
 * - No sounds
 * - Simpler layouts
 *
 * This mode is designed to be inclusive and help users who may find
 * the standard interface overwhelming or distracting.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Low-stimulation mode settings that can be individually toggled
 */
export interface LowStimulationSettings {
  /** Disable all animations and transitions */
  reduceAnimations: boolean;
  /** Use muted, desaturated color palette */
  mutedColors: boolean;
  /** Disable all sound effects */
  disableSounds: boolean;
  /** Use simpler, less visually complex layouts */
  simplerLayouts: boolean;
  /** Hide decorative elements (sparkles, confetti, etc.) */
  hideDecorations: boolean;
  /** Reduce visual contrast for sensitive eyes */
  softerContrast: boolean;
}

/**
 * Preset levels for low-stimulation mode
 */
export type StimulationPreset = 'standard' | 'moderate' | 'minimal';

// ============================================================================
// CONSTANTS
// ============================================================================

/** localStorage key for low-stimulation mode enabled state */
export const LOW_STIM_ENABLED_KEY = 'carddex_low_stim_enabled';

/** localStorage key for low-stimulation mode settings */
export const LOW_STIM_SETTINGS_KEY = 'carddex_low_stim_settings';

/** localStorage key for preset selection */
export const LOW_STIM_PRESET_KEY = 'carddex_low_stim_preset';

/**
 * Default settings for low-stimulation mode (when enabled)
 * All features are active by default when the mode is turned on
 */
export const DEFAULT_LOW_STIM_SETTINGS: LowStimulationSettings = {
  reduceAnimations: true,
  mutedColors: true,
  disableSounds: true,
  simplerLayouts: true,
  hideDecorations: true,
  softerContrast: false,
};

/**
 * Settings presets for different levels of stimulation reduction
 */
export const STIMULATION_PRESETS: Record<StimulationPreset, LowStimulationSettings> = {
  standard: {
    reduceAnimations: false,
    mutedColors: false,
    disableSounds: false,
    simplerLayouts: false,
    hideDecorations: false,
    softerContrast: false,
  },
  moderate: {
    reduceAnimations: true,
    mutedColors: false,
    disableSounds: true,
    simplerLayouts: false,
    hideDecorations: true,
    softerContrast: false,
  },
  minimal: {
    reduceAnimations: true,
    mutedColors: true,
    disableSounds: true,
    simplerLayouts: true,
    hideDecorations: true,
    softerContrast: true,
  },
};

/**
 * Information about each preset for display purposes
 */
export const PRESET_INFO: Record<
  StimulationPreset,
  {
    label: string;
    description: string;
    shortDescription: string;
  }
> = {
  standard: {
    label: 'Standard',
    description: 'Full visual experience with all animations and effects',
    shortDescription: 'All effects enabled',
  },
  moderate: {
    label: 'Moderate',
    description: 'Reduced animations and decorations, but keeps colors',
    shortDescription: 'Less animations',
  },
  minimal: {
    label: 'Minimal',
    description: 'Calm mode with muted colors, no animations, simple layouts',
    shortDescription: 'Calm experience',
  },
};

/**
 * Information about each individual setting for display purposes
 */
export const SETTING_INFO: Record<
  keyof LowStimulationSettings,
  {
    label: string;
    description: string;
  }
> = {
  reduceAnimations: {
    label: 'Reduce Animations',
    description: 'Disable bouncing, spinning, and moving effects',
  },
  mutedColors: {
    label: 'Muted Colors',
    description: 'Use softer, less vibrant colors throughout the app',
  },
  disableSounds: {
    label: 'Disable Sounds',
    description: 'Turn off all sound effects and audio feedback',
  },
  simplerLayouts: {
    label: 'Simpler Layouts',
    description: 'Use cleaner layouts with less visual complexity',
  },
  hideDecorations: {
    label: 'Hide Decorations',
    description: 'Remove sparkles, confetti, and decorative elements',
  },
  softerContrast: {
    label: 'Softer Contrast',
    description: 'Reduce contrast for a gentler visual experience',
  },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a preset matches the current settings
 */
export function getMatchingPreset(settings: LowStimulationSettings): StimulationPreset | null {
  for (const [preset, presetSettings] of Object.entries(STIMULATION_PRESETS)) {
    const allMatch = (Object.keys(presetSettings) as Array<keyof LowStimulationSettings>).every(
      (key) => settings[key] === presetSettings[key]
    );
    if (allMatch) {
      return preset as StimulationPreset;
    }
  }
  return null;
}

/**
 * Get settings for a preset
 */
export function getPresetSettings(preset: StimulationPreset): LowStimulationSettings {
  return { ...STIMULATION_PRESETS[preset] };
}

/**
 * Get the label for a preset
 */
export function getPresetLabel(preset: StimulationPreset): string {
  return PRESET_INFO[preset]?.label ?? preset;
}

/**
 * Get the description for a preset
 */
export function getPresetDescription(preset: StimulationPreset): string {
  return PRESET_INFO[preset]?.description ?? '';
}

/**
 * Count how many settings are enabled
 */
export function countEnabledSettings(settings: LowStimulationSettings): number {
  return Object.values(settings).filter(Boolean).length;
}

/**
 * Get a summary of enabled settings for display
 */
export function getSettingsSummary(settings: LowStimulationSettings): string {
  const enabled = Object.entries(settings)
    .filter(([, value]) => value)
    .map(([key]) => SETTING_INFO[key as keyof LowStimulationSettings]?.label ?? key);

  if (enabled.length === 0) {
    return 'Standard mode';
  }
  if (enabled.length === Object.keys(settings).length) {
    return 'All calm settings enabled';
  }
  if (enabled.length <= 2) {
    return enabled.join(' and ');
  }
  return `${enabled.length} settings enabled`;
}

// ============================================================================
// PERSISTENCE FUNCTIONS
// ============================================================================

/**
 * Save low-stimulation mode enabled state to localStorage
 */
export function saveLowStimEnabled(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOW_STIM_ENABLED_KEY, String(enabled));
  } catch {
    // localStorage might not be available
  }
}

/**
 * Load low-stimulation mode enabled state from localStorage
 */
export function loadLowStimEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const saved = localStorage.getItem(LOW_STIM_ENABLED_KEY);
    return saved === 'true';
  } catch {
    return false;
  }
}

/**
 * Save low-stimulation mode settings to localStorage
 */
export function saveLowStimSettings(settings: LowStimulationSettings): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOW_STIM_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // localStorage might not be available
  }
}

/**
 * Load low-stimulation mode settings from localStorage
 */
export function loadLowStimSettings(): LowStimulationSettings {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_LOW_STIM_SETTINGS };
  try {
    const saved = localStorage.getItem(LOW_STIM_SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate and merge with defaults to handle missing keys
      return {
        reduceAnimations:
          typeof parsed.reduceAnimations === 'boolean'
            ? parsed.reduceAnimations
            : DEFAULT_LOW_STIM_SETTINGS.reduceAnimations,
        mutedColors:
          typeof parsed.mutedColors === 'boolean'
            ? parsed.mutedColors
            : DEFAULT_LOW_STIM_SETTINGS.mutedColors,
        disableSounds:
          typeof parsed.disableSounds === 'boolean'
            ? parsed.disableSounds
            : DEFAULT_LOW_STIM_SETTINGS.disableSounds,
        simplerLayouts:
          typeof parsed.simplerLayouts === 'boolean'
            ? parsed.simplerLayouts
            : DEFAULT_LOW_STIM_SETTINGS.simplerLayouts,
        hideDecorations:
          typeof parsed.hideDecorations === 'boolean'
            ? parsed.hideDecorations
            : DEFAULT_LOW_STIM_SETTINGS.hideDecorations,
        softerContrast:
          typeof parsed.softerContrast === 'boolean'
            ? parsed.softerContrast
            : DEFAULT_LOW_STIM_SETTINGS.softerContrast,
      };
    }
  } catch {
    // Invalid JSON or localStorage not available
  }
  return { ...DEFAULT_LOW_STIM_SETTINGS };
}

/**
 * Save selected preset to localStorage
 */
export function saveLowStimPreset(preset: StimulationPreset): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOW_STIM_PRESET_KEY, preset);
  } catch {
    // localStorage might not be available
  }
}

/**
 * Load selected preset from localStorage
 */
export function loadLowStimPreset(): StimulationPreset {
  if (typeof localStorage === 'undefined') return 'standard';
  try {
    const saved = localStorage.getItem(LOW_STIM_PRESET_KEY);
    if (saved && ['standard', 'moderate', 'minimal'].includes(saved)) {
      return saved as StimulationPreset;
    }
  } catch {
    // localStorage might not be available
  }
  return 'standard';
}

// ============================================================================
// CSS CLASS HELPERS
// ============================================================================

/**
 * Get CSS classes to apply based on low-stimulation settings
 */
export function getLowStimClasses(
  enabled: boolean,
  settings: LowStimulationSettings
): string[] {
  if (!enabled) return [];

  const classes: string[] = ['low-stim'];

  if (settings.reduceAnimations) {
    classes.push('low-stim-no-animations');
  }
  if (settings.mutedColors) {
    classes.push('low-stim-muted');
  }
  if (settings.simplerLayouts) {
    classes.push('low-stim-simple');
  }
  if (settings.hideDecorations) {
    classes.push('low-stim-no-decorations');
  }
  if (settings.softerContrast) {
    classes.push('low-stim-soft-contrast');
  }

  return classes;
}

/**
 * Apply low-stimulation classes to the document root
 */
export function applyLowStimClasses(enabled: boolean, settings: LowStimulationSettings): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Remove all low-stim classes first
  root.classList.remove(
    'low-stim',
    'low-stim-no-animations',
    'low-stim-muted',
    'low-stim-simple',
    'low-stim-no-decorations',
    'low-stim-soft-contrast'
  );

  // Add classes based on settings
  if (enabled) {
    const classes = getLowStimClasses(enabled, settings);
    classes.forEach((cls) => root.classList.add(cls));
  }
}

/**
 * Check if animations should be shown
 */
export function shouldShowAnimations(enabled: boolean, settings: LowStimulationSettings): boolean {
  return !enabled || !settings.reduceAnimations;
}

/**
 * Check if decorations (sparkles, confetti, etc.) should be shown
 */
export function shouldShowDecorations(enabled: boolean, settings: LowStimulationSettings): boolean {
  return !enabled || !settings.hideDecorations;
}

/**
 * Check if sounds should be played
 */
export function shouldPlaySounds(enabled: boolean, settings: LowStimulationSettings): boolean {
  return !enabled || !settings.disableSounds;
}
