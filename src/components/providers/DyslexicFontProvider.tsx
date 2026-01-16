'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import {
  loadDyslexicFontEnabled,
  saveDyslexicFontEnabled,
  applyDyslexicFontClass,
} from '@/lib/dyslexicFont';

// ============================================================================
// CONTEXT
// ============================================================================

interface DyslexicFontContextType {
  /** Whether dyslexic font is enabled */
  isEnabled: boolean;
  /** Whether the context is initialized (hydration-safe) */
  isInitialized: boolean;

  // Actions
  /** Enable dyslexic font */
  enable: () => void;
  /** Disable dyslexic font */
  disable: () => void;
  /** Toggle dyslexic font */
  toggle: () => void;
  /** Set dyslexic font enabled state directly */
  setEnabled: (enabled: boolean) => void;
}

const DyslexicFontContext = createContext<DyslexicFontContextType | null>(null);

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access dyslexic font state and controls.
 * Returns default values when used outside the provider.
 */
export function useDyslexicFont() {
  const context = useContext(DyslexicFontContext);
  if (!context) {
    // Return default values when used outside provider
    return {
      isEnabled: false,
      isInitialized: false,
      enable: () => {},
      disable: () => {},
      toggle: () => {},
      setEnabled: () => {},
    };
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface DyslexicFontProviderProps {
  children: ReactNode;
}

/**
 * Provider component for dyslexic font state management.
 * Handles localStorage persistence and CSS class application.
 */
export function DyslexicFontProvider({ children }: DyslexicFontProviderProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const savedEnabled = loadDyslexicFontEnabled();
    setIsEnabled(savedEnabled);
    setIsInitialized(true);
  }, []);

  // Apply CSS class when enabled state changes
  useEffect(() => {
    if (!isInitialized) return;
    applyDyslexicFontClass(isEnabled);
  }, [isEnabled, isInitialized]);

  // Persist enabled state
  useEffect(() => {
    if (!isInitialized) return;
    saveDyslexicFontEnabled(isEnabled);
  }, [isEnabled, isInitialized]);

  const enable = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const disable = useCallback(() => {
    setIsEnabled(false);
  }, []);

  const toggle = useCallback(() => {
    setIsEnabled((prev) => !prev);
  }, []);

  const setEnabledDirect = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
  }, []);

  return (
    <DyslexicFontContext.Provider
      value={{
        isEnabled,
        isInitialized,
        enable,
        disable,
        toggle,
        setEnabled: setEnabledDirect,
      }}
    >
      {children}
    </DyslexicFontContext.Provider>
  );
}
