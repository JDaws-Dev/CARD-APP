'use client';

import { useState, useRef, useEffect } from 'react';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import { getAllGames, type GameId } from '@/lib/gameSelector';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import {
  PokemonIcon,
  YugiohIcon,
  OnePieceIcon,
  DragonBallIcon,
  LorcanaIcon,
  DigimonIcon,
  MtgIcon,
  GenericTcgIcon,
} from '@/components/icons/tcg';

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  pokemon: PokemonIcon,
  yugioh: YugiohIcon,
  onepiece: OnePieceIcon,
  dragonball: DragonBallIcon,
  lorcana: LorcanaIcon,
  digimon: DigimonIcon,
  mtg: MtgIcon,
};

function getIconComponent(gameId: string): React.ComponentType<{ className?: string }> {
  return ICON_COMPONENTS[gameId] ?? GenericTcgIcon;
}

export function GameSwitcher() {
  const { primaryGame, setPrimaryGame, isLoading } = useGameSelector();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allGames = getAllGames();
  const PrimaryIcon = getIconComponent(primaryGame.id);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition-all',
          'bg-gradient-to-r shadow-md hover:shadow-lg text-white',
          primaryGame.gradientFrom,
          primaryGame.gradientTo,
        )}
      >
        <PrimaryIcon className="h-5 w-5" />
        <span className="hidden sm:inline">{primaryGame.name}</span>
        <ChevronDownIcon
          className={cn(
            'h-4 w-4 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/5">
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Switch Game
            </p>
            {allGames.map((game) => {
              const GameIcon = getIconComponent(game.id);
              const isActive = game.id === primaryGame.id;
              return (
                <button
                  key={game.id}
                  onClick={() => {
                    setPrimaryGame(game.id as GameId);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg',
                      game.bgColor
                    )}
                  >
                    <GameIcon className={cn('h-5 w-5', game.primaryColor)} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{game.name}</div>
                  </div>
                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
