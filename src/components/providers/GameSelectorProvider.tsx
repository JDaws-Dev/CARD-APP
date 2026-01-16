'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import {
  type GameId,
  type SelectedGames,
  type GameInfo,
  DEFAULT_SELECTED_GAMES,
  loadSelectedGames,
  saveSelectedGames,
  getGameInfo,
  getAllGames,
  isValidGameId,
  hasCompletedGameOnboarding,
  markGameOnboardingComplete,
  resetGameOnboarding,
} from '@/lib/gameSelector';

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface GameSelectorContextType {
  /** Currently selected games configuration */
  selectedGames: SelectedGames;
  /** Whether user has completed game selection onboarding */
  hasCompletedOnboarding: boolean;
  /** Whether the context is still initializing from localStorage */
  isLoading: boolean;
  /** Primary game info (convenience accessor) */
  primaryGame: GameInfo;
  /** All enabled games info (convenience accessor) */
  enabledGames: GameInfo[];
  /** Set the primary game */
  setPrimaryGame: (gameId: GameId) => void;
  /** Toggle a game on/off in the enabled list */
  toggleGame: (gameId: GameId) => void;
  /** Enable a specific game */
  enableGame: (gameId: GameId) => void;
  /** Disable a specific game */
  disableGame: (gameId: GameId) => void;
  /** Set multiple games at once (used in onboarding) */
  setSelectedGames: (games: SelectedGames) => void;
  /** Check if a game is enabled */
  isGameEnabled: (gameId: GameId) => boolean;
  /** Mark onboarding as complete */
  completeOnboarding: () => void;
  /** Reset all game selection state */
  resetSelection: () => void;
}

const GameSelectorContext = createContext<GameSelectorContextType | null>(null);

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access game selection state and actions.
 * Returns safe defaults when used outside the provider.
 */
export function useGameSelector(): GameSelectorContextType {
  const context = useContext(GameSelectorContext);
  if (!context) {
    // Return default values when used outside provider
    const defaultPrimary = getGameInfo(DEFAULT_SELECTED_GAMES.primary);
    return {
      selectedGames: DEFAULT_SELECTED_GAMES,
      hasCompletedOnboarding: false,
      isLoading: false,
      primaryGame: defaultPrimary!,
      enabledGames: [defaultPrimary!],
      setPrimaryGame: () => {},
      toggleGame: () => {},
      enableGame: () => {},
      disableGame: () => {},
      setSelectedGames: () => {},
      isGameEnabled: (gameId) => gameId === 'pokemon',
      completeOnboarding: () => {},
      resetSelection: () => {},
    };
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface GameSelectorProviderProps {
  children: ReactNode;
}

export function GameSelectorProvider({ children }: GameSelectorProviderProps) {
  const [selectedGames, setSelectedGamesState] = useState<SelectedGames>(DEFAULT_SELECTED_GAMES);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved state from localStorage on mount
  useEffect(() => {
    try {
      const savedGames = loadSelectedGames();
      if (savedGames) {
        setSelectedGamesState(savedGames);
      }
      setHasCompletedOnboarding(hasCompletedGameOnboarding());
    } catch {
      // localStorage might not be available
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (isLoading) return;
    try {
      saveSelectedGames(selectedGames);
    } catch {
      // localStorage might not be available
    }
  }, [selectedGames, isLoading]);

  // Derived state: primary game info
  const primaryGame = getGameInfo(selectedGames.primary) ?? getAllGames()[0];

  // Derived state: enabled games info
  const enabledGames = selectedGames.enabled
    .map((id) => getGameInfo(id))
    .filter((g): g is GameInfo => g !== null);

  // Set primary game
  const setPrimaryGame = useCallback((gameId: GameId) => {
    if (!isValidGameId(gameId)) return;
    setSelectedGamesState((prev) => {
      // Ensure primary is also in enabled list
      const enabled = prev.enabled.includes(gameId) ? prev.enabled : [gameId, ...prev.enabled];
      return { primary: gameId, enabled };
    });
  }, []);

  // Toggle a game on/off
  const toggleGame = useCallback((gameId: GameId) => {
    if (!isValidGameId(gameId)) return;
    setSelectedGamesState((prev) => {
      const isEnabled = prev.enabled.includes(gameId);
      if (isEnabled) {
        // Don't allow disabling the only enabled game
        if (prev.enabled.length <= 1) return prev;
        // Don't allow disabling the primary game without switching primary
        if (prev.primary === gameId) {
          const newPrimary = prev.enabled.find((id) => id !== gameId) ?? prev.primary;
          return {
            primary: newPrimary,
            enabled: prev.enabled.filter((id) => id !== gameId),
          };
        }
        return {
          ...prev,
          enabled: prev.enabled.filter((id) => id !== gameId),
        };
      } else {
        return {
          ...prev,
          enabled: [...prev.enabled, gameId],
        };
      }
    });
  }, []);

  // Enable a specific game
  const enableGame = useCallback((gameId: GameId) => {
    if (!isValidGameId(gameId)) return;
    setSelectedGamesState((prev) => {
      if (prev.enabled.includes(gameId)) return prev;
      return {
        ...prev,
        enabled: [...prev.enabled, gameId],
      };
    });
  }, []);

  // Disable a specific game
  const disableGame = useCallback((gameId: GameId) => {
    if (!isValidGameId(gameId)) return;
    setSelectedGamesState((prev) => {
      // Don't allow disabling the only enabled game
      if (prev.enabled.length <= 1 && prev.enabled.includes(gameId)) return prev;
      // Handle primary game switching
      const newEnabled = prev.enabled.filter((id) => id !== gameId);
      const newPrimary = prev.primary === gameId ? newEnabled[0] : prev.primary;
      return {
        primary: newPrimary,
        enabled: newEnabled,
      };
    });
  }, []);

  // Set selected games directly (used in onboarding)
  const setSelectedGames = useCallback((games: SelectedGames) => {
    // Validate the games
    if (!isValidGameId(games.primary)) return;
    if (!games.enabled.every((id) => isValidGameId(id))) return;
    if (games.enabled.length === 0) return;

    // Ensure primary is in enabled
    const enabled = games.enabled.includes(games.primary)
      ? games.enabled
      : [games.primary, ...games.enabled];

    setSelectedGamesState({ primary: games.primary, enabled });
  }, []);

  // Check if a game is enabled
  const isGameEnabled = useCallback(
    (gameId: GameId): boolean => {
      return selectedGames.enabled.includes(gameId);
    },
    [selectedGames.enabled]
  );

  // Mark onboarding as complete
  const completeOnboarding = useCallback(() => {
    markGameOnboardingComplete();
    setHasCompletedOnboarding(true);
  }, []);

  // Reset all game selection state
  const resetSelection = useCallback(() => {
    resetGameOnboarding();
    setSelectedGamesState(DEFAULT_SELECTED_GAMES);
    setHasCompletedOnboarding(false);
  }, []);

  return (
    <GameSelectorContext.Provider
      value={{
        selectedGames,
        hasCompletedOnboarding,
        isLoading,
        primaryGame,
        enabledGames,
        setPrimaryGame,
        toggleGame,
        enableGame,
        disableGame,
        setSelectedGames,
        isGameEnabled,
        completeOnboarding,
        resetSelection,
      }}
    >
      {children}
    </GameSelectorContext.Provider>
  );
}
