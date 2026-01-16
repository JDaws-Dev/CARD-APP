'use client';

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import {
  type LowStimulationSettings,
  type StimulationPreset,
  DEFAULT_LOW_STIM_SETTINGS,
  STIMULATION_PRESETS,
  loadLowStimEnabled,
  saveLowStimEnabled,
  loadLowStimSettings,
  saveLowStimSettings,
  loadLowStimPreset,
  saveLowStimPreset,
  applyLowStimClasses,
  getMatchingPreset,
  shouldShowAnimations,
  shouldShowDecorations,
  shouldPlaySounds,
} from '@/lib/lowStimulationMode';

// ============================================================================
// CONTEXT
// ============================================================================

interface LowStimulationContextType {
  /** Whether low-stimulation mode is enabled */
  isEnabled: boolean;
  /** Current settings */
  settings: LowStimulationSettings;
  /** Current preset (if settings match a preset, otherwise null) */
  preset: StimulationPreset | null;
  /** Whether the context is initialized */
  isInitialized: boolean;

  // Actions
  /** Enable low-stimulation mode */
  enable: () => void;
  /** Disable low-stimulation mode */
  disable: () => void;
  /** Toggle low-stimulation mode */
  toggle: () => void;
  /** Apply a preset */
  applyPreset: (preset: StimulationPreset) => void;
  /** Update a single setting */
  updateSetting: <K extends keyof LowStimulationSettings>(
    key: K,
    value: LowStimulationSettings[K]
  ) => void;
  /** Update all settings at once */
  updateSettings: (settings: Partial<LowStimulationSettings>) => void;

  // Convenience checks
  /** Whether animations should be shown */
  showAnimations: boolean;
  /** Whether decorations should be shown */
  showDecorations: boolean;
  /** Whether sounds should be played */
  playSounds: boolean;
}

const LowStimulationContext = createContext<LowStimulationContextType | null>(null);

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access low-stimulation mode state and controls
 */
export function useLowStimulation() {
  const context = useContext(LowStimulationContext);
  if (!context) {
    // Return default values when used outside provider
    return {
      isEnabled: false,
      settings: DEFAULT_LOW_STIM_SETTINGS,
      preset: 'standard' as StimulationPreset,
      isInitialized: false,
      enable: () => {},
      disable: () => {},
      toggle: () => {},
      applyPreset: () => {},
      updateSetting: () => {},
      updateSettings: () => {},
      showAnimations: true,
      showDecorations: true,
      playSounds: true,
    };
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface LowStimulationProviderProps {
  children: ReactNode;
}

export function LowStimulationProvider({ children }: LowStimulationProviderProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [settings, setSettings] = useState<LowStimulationSettings>(DEFAULT_LOW_STIM_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const savedEnabled = loadLowStimEnabled();
    const savedSettings = loadLowStimSettings();
    const savedPreset = loadLowStimPreset();

    // If there's a saved preset that's not standard, apply those settings
    if (savedPreset !== 'standard') {
      setSettings(STIMULATION_PRESETS[savedPreset]);
      setIsEnabled(true);
    } else {
      setSettings(savedSettings);
      setIsEnabled(savedEnabled);
    }

    setIsInitialized(true);
  }, []);

  // Apply CSS classes when enabled state or settings change
  useEffect(() => {
    if (!isInitialized) return;
    applyLowStimClasses(isEnabled, settings);
  }, [isEnabled, settings, isInitialized]);

  // Persist enabled state
  useEffect(() => {
    if (!isInitialized) return;
    saveLowStimEnabled(isEnabled);
  }, [isEnabled, isInitialized]);

  // Persist settings
  useEffect(() => {
    if (!isInitialized) return;
    saveLowStimSettings(settings);

    // Also save the preset if settings match one
    const matchingPreset = getMatchingPreset(settings);
    if (matchingPreset) {
      saveLowStimPreset(matchingPreset);
    }
  }, [settings, isInitialized]);

  const enable = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const disable = useCallback(() => {
    setIsEnabled(false);
  }, []);

  const toggle = useCallback(() => {
    setIsEnabled((prev) => !prev);
  }, []);

  const applyPreset = useCallback((preset: StimulationPreset) => {
    const presetSettings = STIMULATION_PRESETS[preset];
    setSettings({ ...presetSettings });
    saveLowStimPreset(preset);

    // Automatically enable/disable based on preset
    if (preset === 'standard') {
      setIsEnabled(false);
    } else {
      setIsEnabled(true);
    }
  }, []);

  const updateSetting = useCallback(
    <K extends keyof LowStimulationSettings>(key: K, value: LowStimulationSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateSettings = useCallback((newSettings: Partial<LowStimulationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Compute derived values
  const preset = getMatchingPreset(settings);
  const showAnimations = shouldShowAnimations(isEnabled, settings);
  const showDecorations = shouldShowDecorations(isEnabled, settings);
  const playSounds = shouldPlaySounds(isEnabled, settings);

  return (
    <LowStimulationContext.Provider
      value={{
        isEnabled,
        settings,
        preset,
        isInitialized,
        enable,
        disable,
        toggle,
        applyPreset,
        updateSetting,
        updateSettings,
        showAnimations,
        showDecorations,
        playSounds,
      }}
    >
      {children}
    </LowStimulationContext.Provider>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { LowStimulationSettings, StimulationPreset };
