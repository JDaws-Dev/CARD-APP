'use client';

import { cn } from '@/lib/utils';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import { type GameId, type GameInfo } from '@/lib/gameSelector';
import { GAME_ICONS, GenericTcgIcon } from '@/components/icons/tcg';
import { Squares2X2Icon } from '@heroicons/react/24/solid';

export type GameFilterValue = GameId | 'all';

interface GameFilterProps {
  value: GameFilterValue;
  onChange: (value: GameFilterValue) => void;
  /** Counts per game (optional) */
  setCounts?: Record<GameFilterValue, number>;
}

/**
 * GameFilter - Tabs for filtering sets by TCG game
 *
 * Shows [All] tab plus tabs for each enabled game from user preferences.
 * Each tab displays the game icon, short name, and optional count.
 * Only shows games that the user has enabled in their settings.
 */
export function GameFilter({ value, onChange, setCounts }: GameFilterProps) {
  const { enabledGames, isLoading } = useGameSelector();

  // Show skeleton during initial load
  if (isLoading) {
    return <GameFilterSkeleton />;
  }

  return (
    <div
      className="flex flex-wrap justify-center gap-2"
      role="tablist"
      aria-label="Filter by game"
    >
      {/* All Games Tab */}
      <GameFilterTab
        isSelected={value === 'all'}
        onClick={() => onChange('all')}
        label="All Games"
        icon={<Squares2X2Icon className="h-4 w-4" aria-hidden="true" />}
        count={setCounts?.['all']}
        gradientFrom="from-gray-500"
        gradientTo="to-gray-600"
      />

      {/* Individual Game Tabs - Only show enabled games */}
      {enabledGames.map((game) => {
        const IconComponent = GAME_ICONS[game.id] ?? GenericTcgIcon;
        return (
          <GameFilterTab
            key={game.id}
            isSelected={value === game.id}
            onClick={() => onChange(game.id)}
            label={game.shortName}
            icon={<IconComponent className="h-4 w-4" aria-hidden="true" />}
            count={setCounts?.[game.id]}
            gradientFrom={game.gradientFrom}
            gradientTo={game.gradientTo}
          />
        );
      })}
    </div>
  );
}

interface GameFilterTabProps {
  isSelected: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  count?: number;
  gradientFrom: string;
  gradientTo: string;
}

function GameFilterTab({
  isSelected,
  onClick,
  label,
  icon,
  count,
  gradientFrom,
  gradientTo,
}: GameFilterTabProps) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={isSelected}
      className={cn(
        'flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all sm:px-4',
        isSelected
          ? `bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white shadow-md`
          : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:shadow-md'
      )}
    >
      {/* Icon */}
      <span
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-full',
          isSelected ? 'bg-white/20' : 'bg-gray-100'
        )}
      >
        {icon}
      </span>

      {/* Label */}
      <span className="hidden sm:inline">{label}</span>

      {/* Count Badge */}
      {count !== undefined && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-xs',
            isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/**
 * Skeleton loader for GameFilter
 */
export function GameFilterSkeleton() {
  return (
    <div className="flex flex-wrap justify-center gap-2" aria-hidden="true">
      {/* All tab skeleton */}
      <div className="h-9 w-20 animate-pulse rounded-full bg-gray-200 sm:w-28" />
      {/* 2-3 game tab skeletons */}
      <div className="h-9 w-16 animate-pulse rounded-full bg-gray-200 sm:w-24" />
      <div className="h-9 w-16 animate-pulse rounded-full bg-gray-200 sm:w-24" />
    </div>
  );
}

/**
 * Get enabled games as GameInfo array.
 * Useful for filtering outside the component.
 */
export function useEnabledGames(): GameInfo[] {
  const { enabledGames } = useGameSelector();
  return enabledGames;
}
