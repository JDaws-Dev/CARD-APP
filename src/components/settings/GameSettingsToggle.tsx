'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { type GameId, type GameInfo, getAllGames, formatEnabledGames } from '@/lib/gameSelector';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import {
  PokemonIcon,
  YugiohIcon,
  OnePieceIcon,
  LorcanaIcon,
  GenericTcgIcon,
} from '@/components/icons/tcg';
import {
  CheckIcon,
  StarIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid';

// ============================================================================
// GAME ICON COMPONENT LOOKUP
// ============================================================================

/**
 * Icon components for supported games only.
 * We only support 4 games: Pokemon, Yu-Gi-Oh!, One Piece, and Disney Lorcana.
 */
const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  pokemon: PokemonIcon,
  yugioh: YugiohIcon,
  onepiece: OnePieceIcon,
  lorcana: LorcanaIcon,
};

function getIconComponent(gameId: string): React.ComponentType<{ className?: string }> {
  return ICON_COMPONENTS[gameId] ?? GenericTcgIcon;
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function GameSettingsToggleSkeleton() {
  return (
    <div className="animate-pulse space-y-4" role="status" aria-label="Loading game settings">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gray-200" />
        <div className="space-y-2">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="h-3 w-48 rounded bg-gray-200" />
        </div>
      </div>

      {/* Current selection skeleton */}
      <div className="h-10 w-full rounded-xl bg-gray-200" />

      {/* Game grid skeleton - 4 supported games */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT GAME CARD COMPONENT
// ============================================================================

interface CompactGameCardProps {
  game: GameInfo;
  isSelected: boolean;
  isPrimary: boolean;
  onToggle: () => void;
  onSetPrimary: () => void;
}

function CompactGameCard({
  game,
  isSelected,
  isPrimary,
  onToggle,
  onSetPrimary,
}: CompactGameCardProps) {
  const IconComponent = getIconComponent(game.id);

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 p-3 transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md',
        'focus-within:ring-2 focus-within:ring-kid-primary focus-within:ring-offset-2',
        isSelected
          ? cn('border-transparent shadow-sm', game.bgColor)
          : 'border-gray-200 bg-white hover:border-gray-300'
      )}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <div
          className={cn(
            'absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full shadow-sm',
            'bg-gradient-to-br',
            game.gradientFrom,
            game.gradientTo
          )}
          aria-hidden="true"
        >
          <CheckIcon className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Primary star badge */}
      {isPrimary && (
        <div
          className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 shadow-sm"
          title="Main game"
          aria-label="Main game"
        >
          <StarIcon className="h-3 w-3 text-yellow-900" />
        </div>
      )}

      {/* Card content - clickable for toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left focus:outline-none"
        aria-pressed={isSelected}
        aria-label={`${isSelected ? 'Disable' : 'Enable'} ${game.name}`}
      >
        {/* Game icon */}
        <div
          className={cn(
            'mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm',
            game.gradientFrom,
            game.gradientTo
          )}
        >
          <IconComponent className="h-6 w-6 text-white" aria-hidden="true" />
        </div>

        {/* Game name */}
        <h3 className={cn('text-center text-xs font-semibold', game.textColor)}>
          {game.shortName}
        </h3>
      </button>

      {/* Set as primary button - only shows when selected and not primary */}
      {isSelected && !isPrimary && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetPrimary();
          }}
          className={cn(
            'mt-2 w-full rounded-md px-1.5 py-1 text-[10px] font-medium transition-colors',
            'border border-gray-200 bg-white hover:bg-gray-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary'
          )}
          aria-label={`Set ${game.name} as main game`}
        >
          <StarIcon className="mr-0.5 inline-block h-2.5 w-2.5 text-gray-400" aria-hidden="true" />
          Set main
        </button>
      )}

      {/* Primary indicator */}
      {isPrimary && (
        <div className="mt-2 rounded-md bg-yellow-100 px-1.5 py-1 text-center text-[10px] font-medium text-yellow-800">
          <StarIcon className="mr-0.5 inline-block h-2.5 w-2.5" aria-hidden="true" />
          Main
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface GameSettingsToggleProps {
  className?: string;
}

export function GameSettingsToggle({ className }: GameSettingsToggleProps) {
  const { selectedGames, primaryGame, enabledGames, isLoading, toggleGame, setPrimaryGame } =
    useGameSelector();

  const games = getAllGames();

  const handleToggle = useCallback(
    (gameId: GameId) => {
      toggleGame(gameId);
    },
    [toggleGame]
  );

  const handleSetPrimary = useCallback(
    (gameId: GameId) => {
      setPrimaryGame(gameId);
    },
    [setPrimaryGame]
  );

  if (isLoading) {
    return <GameSettingsToggleSkeleton />;
  }

  return (
    <div className={cn('space-y-4', className)} role="region" aria-label="Game settings">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md">
          <Cog6ToothIcon className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Games You Collect</h2>
          <p className="text-sm text-gray-500">
            Toggle games on or off. Your main game shows first.
          </p>
        </div>
      </div>

      {/* Current selection summary */}
      <div
        className={cn(
          'rounded-xl border-2 px-4 py-3',
          primaryGame.borderColor,
          primaryGame.bgColor
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StarIcon className="h-4 w-4 text-yellow-500" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-700">Currently tracking:</span>
          </div>
          <span className={cn('font-semibold', primaryGame.textColor)}>
            {formatEnabledGames(selectedGames)}
          </span>
        </div>
      </div>

      {/* Game grid */}
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
        role="group"
        aria-label="Select games to collect"
      >
        {games.map((game) => (
          <CompactGameCard
            key={game.id}
            game={game}
            isSelected={selectedGames.enabled.includes(game.id)}
            isPrimary={selectedGames.primary === game.id}
            onToggle={() => handleToggle(game.id)}
            onSetPrimary={() => handleSetPrimary(game.id)}
          />
        ))}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <InformationCircleIcon
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400"
          aria-hidden="true"
        />
        <p className="text-xs text-gray-500">
          Changes save automatically. Enabled games appear in Browse Sets and your collection
          filters. You can always add or remove games anytime.
        </p>
      </div>
    </div>
  );
}
