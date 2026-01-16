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
  type PackEffectsSettings,
  DEFAULT_PACK_EFFECTS_SETTINGS,
  loadPackEffectsSettings,
  savePackEffectsSettings,
  playPackOpenEffect,
  playCardRevealEffect,
  playRareRevealEffect,
  playPackCompleteEffect,
} from '@/lib/packEffects';
import { useLowStimulation } from './LowStimulationProvider';

// ============================================================================
// CONTEXT
// ============================================================================

interface PackEffectsContextType {
  /** Current settings */
  settings: PackEffectsSettings;
  /** Whether the context is initialized */
  isInitialized: boolean;
  /** Whether sounds are effectively enabled (considers low-stim mode) */
  soundEnabled: boolean;
  /** Whether haptics are effectively enabled */
  hapticsEnabled: boolean;

  // Settings actions
  /** Toggle sound effects */
  toggleSound: () => void;
  /** Toggle haptic feedback */
  toggleHaptics: () => void;
  /** Set sound volume */
  setVolume: (volume: number) => void;
  /** Update all settings */
  updateSettings: (settings: Partial<PackEffectsSettings>) => void;

  // Effect triggers
  /** Play pack opening effect */
  onPackOpen: () => void;
  /** Play card reveal effect */
  onCardReveal: (isRare?: boolean) => void;
  /** Play rare card reveal effect */
  onRareReveal: (isUltraRare?: boolean) => void;
  /** Play pack complete effect */
  onPackComplete: () => void;
}

const PackEffectsContext = createContext<PackEffectsContextType | null>(null);

// ============================================================================
// HOOK
// ============================================================================

export function usePackEffects() {
  const context = useContext(PackEffectsContext);
  if (!context) {
    return {
      settings: DEFAULT_PACK_EFFECTS_SETTINGS,
      isInitialized: false,
      soundEnabled: false,
      hapticsEnabled: false,
      toggleSound: () => {},
      toggleHaptics: () => {},
      setVolume: () => {},
      updateSettings: () => {},
      onPackOpen: () => {},
      onCardReveal: () => {},
      onRareReveal: () => {},
      onPackComplete: () => {},
    };
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface PackEffectsProviderProps {
  children: ReactNode;
}

export function PackEffectsProvider({ children }: PackEffectsProviderProps) {
  const [settings, setSettings] = useState<PackEffectsSettings>(DEFAULT_PACK_EFFECTS_SETTINGS);
  const [isInitialized, setIsInitialized] = useState(false);
  const { playSounds: lowStimAllowsSounds } = useLowStimulation();

  // Initialize from localStorage
  useEffect(() => {
    const savedSettings = loadPackEffectsSettings();
    setSettings(savedSettings);
    setIsInitialized(true);
  }, []);

  // Persist settings
  useEffect(() => {
    if (!isInitialized) return;
    savePackEffectsSettings(settings);
  }, [settings, isInitialized]);

  // Calculate effective states (respect low-stimulation mode)
  const soundEnabled = settings.soundEnabled && lowStimAllowsSounds;
  const hapticsEnabled = settings.hapticsEnabled;

  // Get effective settings for playing effects
  const getEffectiveSettings = useCallback((): PackEffectsSettings => ({
    soundEnabled,
    hapticsEnabled,
    soundVolume: settings.soundVolume,
  }), [soundEnabled, hapticsEnabled, settings.soundVolume]);

  // Settings actions
  const toggleSound = useCallback(() => {
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const toggleHaptics = useCallback(() => {
    setSettings((prev) => ({ ...prev, hapticsEnabled: !prev.hapticsEnabled }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setSettings((prev) => ({ ...prev, soundVolume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<PackEffectsSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Effect triggers
  const onPackOpen = useCallback(() => {
    playPackOpenEffect(getEffectiveSettings());
  }, [getEffectiveSettings]);

  const onCardReveal = useCallback((isRare: boolean = false) => {
    playCardRevealEffect(getEffectiveSettings(), isRare);
  }, [getEffectiveSettings]);

  const onRareReveal = useCallback((isUltraRare: boolean = false) => {
    playRareRevealEffect(getEffectiveSettings(), isUltraRare);
  }, [getEffectiveSettings]);

  const onPackComplete = useCallback(() => {
    playPackCompleteEffect(getEffectiveSettings());
  }, [getEffectiveSettings]);

  return (
    <PackEffectsContext.Provider
      value={{
        settings,
        isInitialized,
        soundEnabled,
        hapticsEnabled,
        toggleSound,
        toggleHaptics,
        setVolume,
        updateSettings,
        onPackOpen,
        onCardReveal,
        onRareReveal,
        onPackComplete,
      }}
    >
      {children}
    </PackEffectsContext.Provider>
  );
}
