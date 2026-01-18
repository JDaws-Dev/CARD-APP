'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import { getAllGames, type GameId } from '@/lib/gameSelector';
import { ChevronDownIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import {
  PokemonIcon,
  YugiohIcon,
  OnePieceIcon,
  LorcanaIcon,
  GenericTcgIcon,
} from '@/components/icons/tcg';

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
 * Full-screen mobile game picker modal.
 * Large, colorful game tiles that are easy for kids to tap.
 * Minimum 44x44px tap targets for accessibility.
 */
function MobileGamePicker({
  isOpen,
  onClose,
  currentGameId,
  onSelectGame,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentGameId: GameId;
  onSelectGame: (gameId: GameId) => void;
}) {
  const allGames = getAllGames();
  const [animatingGameId, setAnimatingGameId] = useState<GameId | null>(null);

  // Handle escape key to close
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleSelect = useCallback(
    (gameId: GameId) => {
      if (gameId === currentGameId) {
        onClose();
        return;
      }
      // Show selection animation
      setAnimatingGameId(gameId);
      // Delay to show visual feedback
      setTimeout(() => {
        onSelectGame(gameId);
        setAnimatingGameId(null);
        onClose();
      }, 200);
    },
    [currentGameId, onSelectGame, onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"
      role="dialog"
      aria-modal="true"
      aria-label="Choose your game"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">Pick Your Game!</h2>
          <p className="text-sm text-white/70">Tap to switch</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:bg-white/30"
          aria-label="Close game picker"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Game Grid - optimized for thumb reach */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8 sm:px-6">
        <div className="grid w-full max-w-lg grid-cols-2 gap-4 sm:gap-5">
          {allGames.map((game) => {
            const GameIcon = getIconComponent(game.id);
            const isActive = game.id === currentGameId;
            const isAnimating = game.id === animatingGameId;

            return (
              <button
                key={game.id}
                onClick={() => handleSelect(game.id)}
                className={cn(
                  'group relative flex min-h-[140px] flex-col items-center justify-center gap-3 rounded-2xl p-4 transition-all duration-200 sm:min-h-[160px] sm:gap-4 sm:p-5',
                  'bg-gradient-to-br shadow-lg',
                  game.gradientFrom,
                  game.gradientTo,
                  isActive && 'ring-4 ring-white ring-offset-2 ring-offset-transparent',
                  isAnimating && 'scale-95',
                  !isActive && 'hover:scale-[1.02] active:scale-95'
                )}
                aria-pressed={isActive}
                aria-label={`Switch to ${game.name}${isActive ? ' (currently selected)' : ''}`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md sm:right-3 sm:top-3 sm:h-8 sm:w-8">
                    <CheckIcon className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
                  </div>
                )}

                {/* Game Icon - large for easy recognition */}
                <div
                  className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-transform sm:h-20 sm:w-20',
                    'group-hover:scale-105 group-active:scale-95'
                  )}
                >
                  <GameIcon className="h-10 w-10 text-white sm:h-12 sm:w-12" />
                </div>

                {/* Game Name */}
                <div className="text-center">
                  <div className="text-base font-bold text-white drop-shadow-sm sm:text-lg">
                    {game.shortName}
                  </div>
                  <div className="mt-0.5 text-xs text-white/80 sm:text-sm">{game.tagline}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom hint */}
      <div className="pb-6 text-center sm:pb-8">
        <p className="text-sm text-white/50">Swipe down or tap X to close</p>
      </div>
    </div>
  );
}

/**
 * Desktop dropdown game picker.
 * Compact dropdown for larger screens.
 */
function DesktopGamePicker({
  isOpen,
  onClose,
  currentGameId,
  onSelectGame,
  dropdownRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentGameId: GameId;
  onSelectGame: (gameId: GameId) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}) {
  const allGames = getAllGames();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, dropdownRef]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-slate-800 dark:ring-slate-700">
      <div className="p-2">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
          Switch Game
        </p>
        {allGames.map((game) => {
          const GameIcon = getIconComponent(game.id);
          const isActive = game.id === currentGameId;
          return (
            <button
              key={game.id}
              onClick={() => {
                onSelectGame(game.id);
                onClose();
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                isActive
                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 dark:from-indigo-900/50 dark:to-purple-900/50 dark:text-indigo-300'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <div
                className={cn('flex h-8 w-8 items-center justify-center rounded-lg', game.bgColor)}
              >
                <GameIcon className={cn('h-5 w-5', game.primaryColor)} />
              </div>
              <div className="flex-1">
                <div className="font-medium">{game.name}</div>
              </div>
              {isActive && <div className="h-2 w-2 rounded-full bg-indigo-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GameSwitcher() {
  const { primaryGame, setPrimaryGame, isLoading } = useGameSelector();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const PrimaryIcon = getIconComponent(primaryGame.id);

  // Detect mobile screen size
  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClose = useCallback(() => setIsOpen(false), []);
  const handleSelectGame = useCallback(
    (gameId: GameId) => {
      setPrimaryGame(gameId);
    },
    [setPrimaryGame]
  );

  if (isLoading) {
    return (
      <div className="h-11 w-11 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700 md:w-32" />
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button - larger on mobile for thumb-friendly tapping */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-lg font-medium transition-all',
          'bg-gradient-to-r text-white shadow-md hover:shadow-lg active:scale-95',
          // Mobile: larger touch target (min 44x44px)
          'h-11 min-w-[44px] justify-center px-3 md:h-auto md:min-w-0 md:px-3 md:py-2',
          primaryGame.gradientFrom,
          primaryGame.gradientTo
        )}
        aria-label={`Current game: ${primaryGame.name}. Tap to switch games.`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <PrimaryIcon className="h-5 w-5 md:h-5 md:w-5" />
        <span className="hidden md:inline">{primaryGame.name}</span>
        <ChevronDownIcon
          className={cn('hidden h-4 w-4 transition-transform md:block', isOpen && 'rotate-180')}
        />
      </button>

      {/* Mobile: Full-screen modal */}
      {isMobile && (
        <MobileGamePicker
          isOpen={isOpen}
          onClose={handleClose}
          currentGameId={primaryGame.id}
          onSelectGame={handleSelectGame}
        />
      )}

      {/* Desktop: Dropdown */}
      {!isMobile && (
        <DesktopGamePicker
          isOpen={isOpen}
          onClose={handleClose}
          currentGameId={primaryGame.id}
          onSelectGame={handleSelectGame}
          dropdownRef={dropdownRef}
        />
      )}
    </div>
  );
}
