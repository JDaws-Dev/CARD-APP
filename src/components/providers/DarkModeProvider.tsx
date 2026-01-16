'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

// ============================================================================
// DARK MODE CONFIGURATION
// ============================================================================

/**
 * Theme modes for the application
 * - light: Light theme (white backgrounds)
 * - dark: Dark theme (dark backgrounds)
 * - system: Follow system preference
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * The actual resolved theme (light or dark)
 */
export type ResolvedTheme = 'light' | 'dark';

// localStorage key for theme preference
const THEME_MODE_KEY = 'carddex_theme_mode';

// ============================================================================
// CONTEXT
// ============================================================================

interface DarkModeContextType {
  /** Current theme mode setting (light, dark, or system) */
  themeMode: ThemeMode;
  /** The actual resolved theme being displayed */
  resolvedTheme: ResolvedTheme;
  /** Whether dark mode is currently active */
  isDark: boolean;
  /** Set the theme mode */
  setThemeMode: (mode: ThemeMode) => void;
  /** Toggle between light and dark (ignores system) */
  toggleDarkMode: () => void;
  /** Whether the context is initialized */
  isInitialized: boolean;
}

const DarkModeContext = createContext<DarkModeContextType | null>(null);

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access dark mode state and controls
 */
export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (!context) {
    // Return default values when used outside provider
    return {
      themeMode: 'system' as ThemeMode,
      resolvedTheme: 'light' as ResolvedTheme,
      isDark: false,
      setThemeMode: () => {},
      toggleDarkMode: () => {},
      isInitialized: false,
    };
  }
  return context;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the system's preferred color scheme
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolve the theme based on mode and system preference
 */
function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
}

/**
 * Apply the theme to the document
 */
function applyTheme(theme: ResolvedTheme) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

/**
 * Load saved theme from localStorage
 */
function loadSavedTheme(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'system';

  try {
    const saved = localStorage.getItem(THEME_MODE_KEY);
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      return saved as ThemeMode;
    }
  } catch {
    // localStorage might not be available
  }

  return 'system';
}

/**
 * Save theme to localStorage
 */
function saveTheme(mode: ThemeMode) {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(THEME_MODE_KEY, mode);
  } catch {
    // localStorage might not be available
  }
}

// ============================================================================
// PROVIDER
// ============================================================================

interface DarkModeProviderProps {
  children: ReactNode;
  /** Default theme mode (defaults to 'system') */
  defaultMode?: ThemeMode;
}

export function DarkModeProvider({ children, defaultMode = 'system' }: DarkModeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(defaultMode);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    const savedMode = loadSavedTheme();
    setThemeModeState(savedMode);

    const resolved = resolveTheme(savedMode);
    setResolvedTheme(resolved);
    applyTheme(resolved);

    setIsInitialized(true);
  }, []);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (themeMode === 'system') {
        const resolved = getSystemTheme();
        setResolvedTheme(resolved);
        applyTheme(resolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Update resolved theme when mode changes
  useEffect(() => {
    if (!isInitialized) return;

    const resolved = resolveTheme(themeMode);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    saveTheme(themeMode);
  }, [themeMode, isInitialized]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setThemeModeState((current) => {
      // If currently in system mode, switch to the opposite of resolved
      if (current === 'system') {
        return resolvedTheme === 'dark' ? 'light' : 'dark';
      }
      // Otherwise toggle between light and dark
      return current === 'dark' ? 'light' : 'dark';
    });
  }, [resolvedTheme]);

  const isDark = resolvedTheme === 'dark';

  return (
    <DarkModeContext.Provider
      value={{
        themeMode,
        resolvedTheme,
        isDark,
        setThemeMode,
        toggleDarkMode,
        isInitialized,
      }}
    >
      {children}
    </DarkModeContext.Provider>
  );
}

// ============================================================================
// EXPORTS FOR TESTING
// ============================================================================

export { getSystemTheme, resolveTheme, applyTheme, loadSavedTheme, saveTheme };
