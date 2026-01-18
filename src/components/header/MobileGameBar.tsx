'use client';

import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import { getAllGames, type GameId } from '@/lib/gameSelector';
import { cn } from '@/lib/utils';
import {
  PokemonIcon,
  YugiohIcon,
  OnePieceIcon,
  LorcanaIcon,
  GenericTcgIcon,
} from '@/components/icons/tcg';
import { useState, useCallback } from 'react';

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  pokemon: PokemonIcon,
  yugioh: YugiohIcon,
  onepiece: OnePieceIcon,
  lorcana: LorcanaIcon,
};

function getIconComponent(gameId: string): React.ComponentType<{ className?: string }> {
  return ICON_COMPONENTS[gameId] ?? GenericTcgIcon;
}

/**
 * MobileGameBar - A mobile-optimized bottom tab bar for switching between games.
 *
 * Design principles:
 * - Large tap targets (min 44x44px) for kids ages 6-14
 * - Prominent game icons with colorful, game-specific themes
 * - Clear indication of the currently selected game
 * - Visual feedback on tap (scale animation)
 * - Fixed to bottom of screen for easy thumb access
 * - Only visible on mobile (hidden on lg: and above)
 */
export function MobileGameBar() {
  const { primaryGame, setPrimaryGame, isLoading } = useGameSelector();
  const [tappedGame, setTappedGame] = useState<string | null>(null);

  const allGames = getAllGames();

  const handleGameTap = useCallback(
    (gameId: GameId) => {
      // Visual feedback - brief scale animation
      setTappedGame(gameId);
      setTimeout(() => setTappedGame(null), 150);

      // Switch game
      setPrimaryGame(gameId);
    },
    [setPrimaryGame]
  );

  if (isLoading) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex h-20 items-center justify-around border-t border-gray-200 bg-white/95 px-2 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 lg:hidden"
        role="tablist"
        aria-label="Game selector loading"
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex h-14 w-14 animate-pulse items-center justify-center rounded-xl bg-gray-200 dark:bg-slate-700"
          />
        ))}
      </div>
    );
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 lg:hidden"
      role="tablist"
      aria-label="Switch between games"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex h-20 max-w-md items-center justify-around px-2">
        {allGames.map((game) => {
          const GameIcon = getIconComponent(game.id);
          const isActive = game.id === primaryGame.id;
          const isTapped = tappedGame === game.id;

          return (
            <button
              key={game.id}
              onClick={() => handleGameTap(game.id as GameId)}
              role="tab"
              aria-selected={isActive}
              aria-label={`Switch to ${game.name}`}
              className={cn(
                // Base styles - large tap target for kids (min 56x56 > 44x44 requirement)
                'group relative flex flex-col items-center justify-center',
                'min-h-[56px] min-w-[56px] rounded-xl px-2 py-1',
                'transition-all duration-150 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                // Tap animation for visual feedback
                isTapped && 'scale-95',
                // Active state - highlighted with game gradient
                isActive && [
                  'bg-gradient-to-br shadow-lg',
                  game.gradientFrom,
                  game.gradientTo,
                ],
                // Inactive state
                !isActive && [
                  'text-gray-500 hover:bg-gray-100 active:bg-gray-200',
                  'dark:text-slate-400 dark:hover:bg-slate-800 dark:active:bg-slate-700',
                ],
                // Focus ring color based on game
                isActive ? 'focus-visible:ring-white/50' : 'focus-visible:ring-gray-400'
              )}
            >
              {/* Icon container */}
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-transform',
                  // Active: white icon
                  isActive && 'text-white',
                  // Inactive: use game primary color
                  !isActive && game.primaryColor
                )}
              >
                <GameIcon className="h-6 w-6" />
              </div>

              {/* Game name - always shown for clarity */}
              <span
                className={cn(
                  'mt-0.5 text-[10px] font-semibold leading-tight',
                  isActive ? 'text-white' : 'text-gray-600 dark:text-slate-400'
                )}
              >
                {game.shortName}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
