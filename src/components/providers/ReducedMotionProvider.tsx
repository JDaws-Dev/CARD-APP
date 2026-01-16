'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import {
  type ReducedMotionMode,
  loadReducedMotionMode,
  saveReducedMotionMode,
  getSystemPrefersReducedMotion,
  addSystemMotionListener,
  applyReducedMotionClass,
  shouldReduceMotion,
} from '@/lib/reducedMotion';

// ============================================================================
// CONTEXT
// ============================================================================

interface ReducedMotionContextType {
  /** Current motion mode setting */
  mode: ReducedMotionMode;
  /** Whether the system prefers reduced motion */
  systemPrefersReduced: boolean;
  /** Whether motion is currently reduced (resolved from mode and system preference) */
  isReduced: boolean;
  /** Whether the context is initialized (hydration-safe) */
  isInitialized: boolean;

  // Actions
  /** Set the motion mode */
  setMode: (mode: ReducedMotionMode) => void;
  /** Cycle through motion modes (system -> always -> never -> system) */
  cycleMode: () => void;
}

const ReducedMotionContext = createContext<ReducedMotionContextType | null>(null);

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access reduced motion state and controls.
 * Returns default values when used outside the provider.
 */
export function useReducedMotion() {
  const context = useContext(ReducedMotionContext);
  if (!context) {
    // Return default values when used outside provider
    return {
      mode: 'system' as ReducedMotionMode,
      systemPrefersReduced: false,
      isReduced: false,
      isInitialized: false,
      setMode: () => {},
      cycleMode: () => {},
    };
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface ReducedMotionProviderProps {
  children: ReactNode;
}

/**
 * Provider component for reduced motion state management.
 * Handles localStorage persistence, system preference detection, and CSS class application.
 */
export function ReducedMotionProvider({ children }: ReducedMotionProviderProps) {
  const [mode, setModeState] = useState<ReducedMotionMode>('system');
  const [systemPrefersReduced, setSystemPrefersReduced] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage and detect system preference
  useEffect(() => {
    const savedMode = loadReducedMotionMode();
    const systemPreference = getSystemPrefersReducedMotion();

    setModeState(savedMode);
    setSystemPrefersReduced(systemPreference);
    setIsInitialized(true);

    // Listen for system preference changes
    const cleanup = addSystemMotionListener((prefersReduced) => {
      setSystemPrefersReduced(prefersReduced);
    });

    return cleanup;
  }, []);

  // Compute whether motion should be reduced
  const isReduced = shouldReduceMotion(mode, systemPrefersReduced);

  // Apply CSS class when reduced state changes
  useEffect(() => {
    if (!isInitialized) return;
    applyReducedMotionClass(isReduced);
  }, [isReduced, isInitialized]);

  // Persist mode
  useEffect(() => {
    if (!isInitialized) return;
    saveReducedMotionMode(mode);
  }, [mode, isInitialized]);

  const setMode = useCallback((newMode: ReducedMotionMode) => {
    setModeState(newMode);
  }, []);

  const cycleMode = useCallback(() => {
    setModeState((prev) => {
      if (prev === 'system') return 'always';
      if (prev === 'always') return 'never';
      return 'system';
    });
  }, []);

  return (
    <ReducedMotionContext.Provider
      value={{
        mode,
        systemPrefersReduced,
        isReduced,
        isInitialized,
        setMode,
        cycleMode,
      }}
    >
      {children}
    </ReducedMotionContext.Provider>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { ReducedMotionMode };
