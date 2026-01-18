'use client';

import { useEffect, type ReactNode, type CSSProperties } from 'react';
import { useGameSelector } from './GameSelectorProvider';
import { useDarkMode } from './DarkModeProvider';
import { getGameThemeStyles, type GameId } from '@/lib/gameSelector';

// ============================================================================
// TYPES
// ============================================================================

interface GameThemeProviderProps {
  children: ReactNode;
  /**
   * Override the game used for theming. If not provided, uses the primary game
   * from GameSelectorProvider context.
   */
  gameOverride?: GameId;
  /**
   * Apply theme to a wrapper div instead of document root.
   * Useful for scoping themes to specific sections.
   */
  scopedTheme?: boolean;
  /**
   * Additional class names for the wrapper (only used with scopedTheme).
   */
  className?: string;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to get the current game theme styles.
 * Returns CSS variable assignments based on the primary game and dark mode.
 */
export function useGameTheme(gameOverride?: GameId): {
  themeStyles: CSSProperties;
  gameId: GameId;
  isDark: boolean;
} {
  const { selectedGames, isLoading } = useGameSelector();
  const { isDark } = useDarkMode();

  // Use override if provided, otherwise use primary game
  const gameId = gameOverride ?? selectedGames.primary;
  const themeStyles = getGameThemeStyles(gameId, isDark) as unknown as CSSProperties;

  return {
    themeStyles: isLoading ? {} : themeStyles,
    gameId,
    isDark,
  };
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * GameThemeProvider - Applies per-game CSS variable theming
 *
 * This provider sets CSS custom properties on either:
 * 1. The document root (for global theming) - default
 * 2. A wrapper div (for scoped theming) - when scopedTheme=true
 *
 * The theme automatically updates when the user's primary game changes.
 *
 * Usage with global theming (in layout):
 * ```tsx
 * <GameThemeProvider>
 *   {children}
 * </GameThemeProvider>
 * ```
 *
 * Usage with scoped theming (for a specific section):
 * ```tsx
 * <GameThemeProvider scopedTheme gameOverride="yugioh">
 *   <div className="bg-game-accent text-game-text">
 *     Yu-Gi-Oh! themed section
 *   </div>
 * </GameThemeProvider>
 * ```
 *
 * CSS utility classes available:
 * - bg-game-primary, bg-game-secondary, bg-game-accent
 * - text-game-primary, text-game-secondary, text-game-text
 * - border-game-primary, border-game-secondary, border-game-border
 * - ring-game-primary, ring-game-secondary
 * - bg-game-gradient, bg-game-gradient-subtle
 * - shadow-game
 * - focus-game
 */
export function GameThemeProvider({
  children,
  gameOverride,
  scopedTheme = false,
  className = '',
}: GameThemeProviderProps) {
  const { themeStyles, gameId, isDark } = useGameTheme(gameOverride);

  // Apply to document root for global theming
  useEffect(() => {
    if (scopedTheme) return;

    // Apply CSS variables to the document root
    const root = document.documentElement;
    const styles = getGameThemeStyles(gameId, isDark);

    Object.entries(styles).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Set data-game attribute for CSS targeting
    root.setAttribute('data-game', gameId);

    // Cleanup function to reset variables when unmounting
    return () => {
      Object.keys(styles).forEach((property) => {
        root.style.removeProperty(property);
      });
      root.removeAttribute('data-game');
    };
  }, [gameId, isDark, scopedTheme]);

  // For scoped theming, wrap children in a styled div
  if (scopedTheme) {
    return (
      <div
        style={themeStyles}
        className={className}
        data-game-theme={gameId}
        data-testid="game-theme-scope"
      >
        {children}
      </div>
    );
  }

  // For global theming, just render children (CSS vars applied to :root)
  return <>{children}</>;
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

interface GameThemedProps {
  children: ReactNode;
  /** The game to theme this section for */
  game: GameId;
  /** Additional CSS classes */
  className?: string;
  /** HTML element to render as */
  as?: 'div' | 'section' | 'article' | 'aside' | 'main';
}

/**
 * GameThemed - Wrapper component for game-specific themed sections.
 *
 * Use this to create a scoped theme section for a specific game,
 * independent of the user's primary game selection.
 *
 * Example:
 * ```tsx
 * <GameThemed game="yugioh" className="p-4 rounded-lg">
 *   <h2 className="text-game-primary">Yu-Gi-Oh! Section</h2>
 *   <div className="bg-game-accent p-2">Themed content</div>
 * </GameThemed>
 * ```
 */
export function GameThemed({
  children,
  game,
  className = '',
  as: Component = 'div',
}: GameThemedProps) {
  const { isDark } = useDarkMode();
  const themeStyles = getGameThemeStyles(game, isDark) as unknown as CSSProperties;

  return (
    <Component
      style={themeStyles}
      className={className}
      data-game-theme={game}
      data-testid={`game-themed-${game}`}
    >
      {children}
    </Component>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

/**
 * Skeleton loader for game theme provider.
 * Shows a subtle shimmer while theme is loading.
 */
export function GameThemeSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="animate-pulse opacity-90" aria-hidden="true">
      {children}
    </div>
  );
}
