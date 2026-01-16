'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import {
  type HighContrastLevel,
  loadHighContrastLevel,
  saveHighContrastLevel,
  applyHighContrastClasses,
  isHighContrastEnabled,
} from '@/lib/highContrastMode';

// ============================================================================
// CONTEXT
// ============================================================================

interface HighContrastContextType {
  /** Current contrast level */
  level: HighContrastLevel;
  /** Whether high-contrast mode is enabled (any level other than off) */
  isEnabled: boolean;
  /** Whether the context is initialized (hydration-safe) */
  isInitialized: boolean;

  // Actions
  /** Set the contrast level */
  setLevel: (level: HighContrastLevel) => void;
  /** Enable high-contrast mode (defaults to medium) */
  enable: () => void;
  /** Disable high-contrast mode */
  disable: () => void;
  /** Toggle high-contrast mode on/off */
  toggle: () => void;
  /** Cycle through contrast levels (off -> medium -> high -> off) */
  cycleLevel: () => void;
}

const HighContrastContext = createContext<HighContrastContextType | null>(null);

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access high-contrast mode state and controls.
 * Returns default values when used outside the provider.
 */
export function useHighContrast() {
  const context = useContext(HighContrastContext);
  if (!context) {
    // Return default values when used outside provider
    return {
      level: 'off' as HighContrastLevel,
      isEnabled: false,
      isInitialized: false,
      setLevel: () => {},
      enable: () => {},
      disable: () => {},
      toggle: () => {},
      cycleLevel: () => {},
    };
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface HighContrastProviderProps {
  children: ReactNode;
}

/**
 * Provider component for high-contrast mode state management.
 * Handles localStorage persistence and CSS class application.
 */
export function HighContrastProvider({ children }: HighContrastProviderProps) {
  const [level, setLevelState] = useState<HighContrastLevel>('off');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const savedLevel = loadHighContrastLevel();
    setLevelState(savedLevel);
    setIsInitialized(true);
  }, []);

  // Apply CSS classes when level changes
  useEffect(() => {
    if (!isInitialized) return;
    applyHighContrastClasses(level);
  }, [level, isInitialized]);

  // Persist level
  useEffect(() => {
    if (!isInitialized) return;
    saveHighContrastLevel(level);
  }, [level, isInitialized]);

  const setLevel = useCallback((newLevel: HighContrastLevel) => {
    setLevelState(newLevel);
  }, []);

  const enable = useCallback(() => {
    setLevelState('medium');
  }, []);

  const disable = useCallback(() => {
    setLevelState('off');
  }, []);

  const toggle = useCallback(() => {
    setLevelState((prev) => (prev === 'off' ? 'medium' : 'off'));
  }, []);

  const cycleLevel = useCallback(() => {
    setLevelState((prev) => {
      if (prev === 'off') return 'medium';
      if (prev === 'medium') return 'high';
      return 'off';
    });
  }, []);

  const isEnabled = isHighContrastEnabled(level);

  return (
    <HighContrastContext.Provider
      value={{
        level,
        isEnabled,
        isInitialized,
        setLevel,
        enable,
        disable,
        toggle,
        cycleLevel,
      }}
    >
      {children}
    </HighContrastContext.Provider>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { HighContrastLevel };
