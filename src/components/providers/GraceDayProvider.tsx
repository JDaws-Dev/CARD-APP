'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import {
  type GraceDayState,
  type GraceDayAvailability,
  type GraceDayUsage,
  DEFAULT_GRACE_DAY_STATE,
  loadGraceDayState,
  saveGraceDayState,
  checkGraceDayAvailability,
  canProtectStreakGap,
  consumeGraceDay,
  getToday,
} from '@/lib/graceDays';

// ============================================================================
// CONTEXT
// ============================================================================

interface GraceDayContextType {
  /** Current grace day state */
  state: GraceDayState;
  /** Whether grace day protection is enabled */
  isEnabled: boolean;
  /** Whether the context is initialized */
  isInitialized: boolean;
  /** Current availability status */
  availability: GraceDayAvailability;
  /** History of grace day usage */
  usageHistory: GraceDayUsage[];

  // Actions
  /** Enable grace day protection */
  enable: () => void;
  /** Disable grace day protection */
  disable: () => void;
  /** Toggle grace day protection */
  toggle: () => void;
  /** Check if a streak gap can be protected */
  checkProtection: (lastActivityDate: string) => {
    canProtect: boolean;
    missedDate: string | null;
    reason: string;
  };
  /** Use a grace day to protect a streak */
  protectStreak: (missedDate: string, currentStreak: number) => void;
  /** Check if a specific date was protected */
  isDateProtected: (dateStr: string) => boolean;
}

const GraceDayContext = createContext<GraceDayContextType | null>(null);

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access grace day state and controls
 */
export function useGraceDay() {
  const context = useContext(GraceDayContext);
  if (!context) {
    // Return default values when used outside provider
    const defaultAvailability = checkGraceDayAvailability(DEFAULT_GRACE_DAY_STATE);
    return {
      state: DEFAULT_GRACE_DAY_STATE,
      isEnabled: true,
      isInitialized: false,
      availability: defaultAvailability,
      usageHistory: [],
      enable: () => {},
      disable: () => {},
      toggle: () => {},
      checkProtection: () => ({
        canProtect: false,
        missedDate: null,
        reason: 'Context not initialized',
      }),
      protectStreak: () => {},
      isDateProtected: () => false,
    };
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface GraceDayProviderProps {
  children: ReactNode;
}

export function GraceDayProvider({ children }: GraceDayProviderProps) {
  const [state, setState] = useState<GraceDayState>(DEFAULT_GRACE_DAY_STATE);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const savedState = loadGraceDayState();
    setState(savedState);
    setIsInitialized(true);
  }, []);

  // Persist state changes
  useEffect(() => {
    if (!isInitialized) return;
    saveGraceDayState(state);
  }, [state, isInitialized]);

  // Calculate availability
  const availability = checkGraceDayAvailability(state, getToday());

  const enable = useCallback(() => {
    setState((prev) => ({ ...prev, enabled: true }));
  }, []);

  const disable = useCallback(() => {
    setState((prev) => ({ ...prev, enabled: false }));
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const checkProtection = useCallback(
    (lastActivityDate: string) => {
      return canProtectStreakGap(state, lastActivityDate);
    },
    [state]
  );

  const protectStreak = useCallback((missedDate: string, currentStreak: number) => {
    setState((prev) => consumeGraceDay(prev, missedDate, currentStreak));
  }, []);

  const isDateProtected = useCallback(
    (dateStr: string) => {
      return state.usageHistory.some((usage) => usage.missedDate === dateStr);
    },
    [state.usageHistory]
  );

  return (
    <GraceDayContext.Provider
      value={{
        state,
        isEnabled: state.enabled,
        isInitialized,
        availability,
        usageHistory: state.usageHistory,
        enable,
        disable,
        toggle,
        checkProtection,
        protectStreak,
        isDateProtected,
      }}
    >
      {children}
    </GraceDayContext.Provider>
  );
}
