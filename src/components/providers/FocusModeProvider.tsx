'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import {
  type FocusModeSettings,
  type FocusModePreset,
  FOCUS_MODE_PRESETS,
  loadFocusModeEnabled,
  saveFocusModeEnabled,
  loadFocusModeSettings,
  saveFocusModeSettings,
  loadFocusModePreset,
  saveFocusModePreset,
  applyFocusModeClasses,
  getMatchingFocusModePreset,
  isFocusModeEffectivelyEnabled,
} from '@/lib/focusMode';

// ============================================================================
// CONTEXT
// ============================================================================

interface FocusModeContextType {
  /** Whether focus mode is enabled */
  isEnabled: boolean;
  /** Current settings */
  settings: FocusModeSettings;
  /** Current preset (if settings match a preset, otherwise null) */
  preset: FocusModePreset | null;
  /** Whether the context is initialized */
  isInitialized: boolean;

  // Actions
  /** Enable focus mode */
  enable: () => void;
  /** Disable focus mode */
  disable: () => void;
  /** Toggle focus mode */
  toggle: () => void;
  /** Apply a preset */
  applyPreset: (preset: FocusModePreset) => void;
  /** Update a single setting */
  updateSetting: <K extends keyof FocusModeSettings>(key: K, value: FocusModeSettings[K]) => void;
  /** Update all settings at once */
  updateSettings: (settings: Partial<FocusModeSettings>) => void;

  // Convenience checks (true = element should be shown)
  /** Whether streaks should be shown */
  showStreaks: boolean;
  /** Whether levels should be shown */
  showLevels: boolean;
  /** Whether achievements should be shown */
  showAchievements: boolean;
  /** Whether milestones should be shown */
  showMilestones: boolean;
  /** Whether completion celebrations should be shown */
  showCompletionCelebrations: boolean;
  /** Whether progress bars should be shown */
  showProgressBars: boolean;
}

const FocusModeContext = createContext<FocusModeContextType | null>(null);

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access focus mode state and controls
 */
export function useFocusMode() {
  const context = useContext(FocusModeContext);
  if (!context) {
    // Return default values when used outside provider
    return {
      isEnabled: false,
      settings: FOCUS_MODE_PRESETS.off,
      preset: 'off' as FocusModePreset,
      isInitialized: false,
      enable: () => {},
      disable: () => {},
      toggle: () => {},
      applyPreset: () => {},
      updateSetting: () => {},
      updateSettings: () => {},
      showStreaks: true,
      showLevels: true,
      showAchievements: true,
      showMilestones: true,
      showCompletionCelebrations: true,
      showProgressBars: true,
    };
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface FocusModeProviderProps {
  children: ReactNode;
}

export function FocusModeProvider({ children }: FocusModeProviderProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [settings, setSettings] = useState<FocusModeSettings>(FOCUS_MODE_PRESETS.off);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const savedEnabled = loadFocusModeEnabled();
    const savedSettings = loadFocusModeSettings();
    const savedPreset = loadFocusModePreset();

    // If there's a saved preset that's not 'off', apply those settings
    if (savedPreset !== 'off') {
      setSettings(FOCUS_MODE_PRESETS[savedPreset]);
      setIsEnabled(true);
    } else {
      setSettings(savedSettings);
      setIsEnabled(savedEnabled);
    }

    setIsInitialized(true);
  }, []);

  // Apply CSS classes when enabled state changes
  useEffect(() => {
    if (!isInitialized) return;
    applyFocusModeClasses(isEnabled);
  }, [isEnabled, isInitialized]);

  // Persist enabled state
  useEffect(() => {
    if (!isInitialized) return;
    saveFocusModeEnabled(isEnabled);
  }, [isEnabled, isInitialized]);

  // Persist settings
  useEffect(() => {
    if (!isInitialized) return;
    saveFocusModeSettings(settings);

    // Also save the preset if settings match one
    const matchingPreset = getMatchingFocusModePreset(settings);
    if (matchingPreset) {
      saveFocusModePreset(matchingPreset);
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

  const applyPreset = useCallback((preset: FocusModePreset) => {
    const presetSettings = FOCUS_MODE_PRESETS[preset];
    setSettings({ ...presetSettings });
    saveFocusModePreset(preset);

    // Automatically enable/disable based on preset
    if (preset === 'off') {
      setIsEnabled(false);
    } else {
      setIsEnabled(true);
    }
  }, []);

  const updateSetting = useCallback(
    <K extends keyof FocusModeSettings>(key: K, value: FocusModeSettings[K]) => {
      setSettings((prev) => {
        const newSettings = { ...prev, [key]: value };
        // Auto-enable if any setting is true, auto-disable if all are false
        const effectivelyEnabled = isFocusModeEffectivelyEnabled(newSettings);
        setIsEnabled(effectivelyEnabled);
        return newSettings;
      });
    },
    []
  );

  const updateSettings = useCallback((newSettings: Partial<FocusModeSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      const effectivelyEnabled = isFocusModeEffectivelyEnabled(merged);
      setIsEnabled(effectivelyEnabled);
      return merged;
    });
  }, []);

  // Compute derived values (true = show, false = hide)
  const preset = getMatchingFocusModePreset(settings);
  const showStreaks = !isEnabled || !settings.hideStreaks;
  const showLevels = !isEnabled || !settings.hideLevels;
  const showAchievements = !isEnabled || !settings.hideAchievements;
  const showMilestones = !isEnabled || !settings.hideMilestones;
  const showCompletionCelebrations = !isEnabled || !settings.hideCompletionCelebrations;
  const showProgressBars = !isEnabled || !settings.hideProgressBars;

  return (
    <FocusModeContext.Provider
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
        showStreaks,
        showLevels,
        showAchievements,
        showMilestones,
        showCompletionCelebrations,
        showProgressBars,
      }}
    >
      {children}
    </FocusModeContext.Provider>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { FocusModeSettings, FocusModePreset };
