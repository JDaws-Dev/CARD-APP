'use client';

import { cn } from '@/lib/utils';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { GameId } from '@/lib/gameSelector';

// Card type categories per game
// Each game has different supertypes/card types
const GAME_CARD_TYPES: Record<GameId, CardTypeCategory[]> = {
  pokemon: [
    {
      id: 'pokemon',
      label: 'Pokémon',
      matches: ['Pokémon', 'Pokemon'],
      gradient: 'from-red-400 to-orange-500',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
    },
    {
      id: 'trainer',
      label: 'Trainer',
      matches: ['Trainer'],
      gradient: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
    },
    {
      id: 'energy',
      label: 'Energy',
      matches: ['Energy'],
      gradient: 'from-yellow-400 to-amber-500',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
    },
  ],
  yugioh: [
    {
      id: 'monster',
      label: 'Monster',
      matches: ['Monster', 'normal', 'effect', 'ritual', 'fusion', 'synchro', 'xyz', 'link', 'pendulum'],
      gradient: 'from-orange-400 to-yellow-500',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
    },
    {
      id: 'spell',
      label: 'Spell',
      matches: ['Spell', 'spell'],
      gradient: 'from-teal-400 to-green-500',
      bgColor: 'bg-teal-100',
      textColor: 'text-teal-700',
    },
    {
      id: 'trap',
      label: 'Trap',
      matches: ['Trap', 'trap'],
      gradient: 'from-pink-400 to-rose-500',
      bgColor: 'bg-pink-100',
      textColor: 'text-pink-700',
    },
  ],
  onepiece: [
    {
      id: 'leader',
      label: 'Leader',
      matches: ['LEADER', 'Leader'],
      gradient: 'from-yellow-400 to-amber-500',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
    },
    {
      id: 'character',
      label: 'Character',
      matches: ['CHARACTER', 'Character'],
      gradient: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
    },
    {
      id: 'event',
      label: 'Event',
      matches: ['EVENT', 'Event'],
      gradient: 'from-purple-400 to-violet-500',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
    },
    {
      id: 'stage',
      label: 'Stage',
      matches: ['STAGE', 'Stage'],
      gradient: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
    },
    {
      id: 'don',
      label: 'DON!!',
      matches: ['DON!!', 'DON'],
      gradient: 'from-red-400 to-rose-500',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
    },
  ],
  lorcana: [
    {
      id: 'character',
      label: 'Character',
      matches: ['Character'],
      gradient: 'from-amber-400 to-orange-500',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-700',
    },
    {
      id: 'action',
      label: 'Action',
      matches: ['Action'],
      gradient: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
    },
    {
      id: 'item',
      label: 'Item',
      matches: ['Item'],
      gradient: 'from-gray-400 to-slate-500',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
    },
    {
      id: 'song',
      label: 'Song',
      matches: ['Song'],
      gradient: 'from-pink-400 to-rose-500',
      bgColor: 'bg-pink-100',
      textColor: 'text-pink-700',
    },
    {
      id: 'location',
      label: 'Location',
      matches: ['Location'],
      gradient: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
    },
  ],
};

export interface CardTypeCategory {
  id: string;
  label: string;
  matches: string[];
  gradient: string;
  bgColor: string;
  textColor: string;
}

export type CardTypeCategoryId = string;

/**
 * Get the card type category for a given supertype/frameType string and game
 */
export function getCardTypeCategory(
  supertype: string | undefined,
  gameId: GameId
): CardTypeCategoryId | null {
  if (!supertype) return null;

  const categories = GAME_CARD_TYPES[gameId];
  if (!categories) return null;

  for (const category of categories) {
    if (category.matches.some((match) => supertype.toLowerCase().includes(match.toLowerCase()))) {
      return category.id;
    }
  }
  return null;
}

/**
 * Get the card type categories for a specific game
 */
export function getCardTypesForGame(gameId: GameId): CardTypeCategory[] {
  return GAME_CARD_TYPES[gameId] || [];
}

interface CardTypeFilterProps {
  gameId: GameId;
  selectedType: CardTypeCategoryId | null;
  onTypeChange: (type: CardTypeCategoryId | null) => void;
  typeCounts?: Map<CardTypeCategoryId, number>;
}

/**
 * Individual card type button
 */
function CardTypeButton({
  category,
  count,
  isSelected,
  onClick,
}: {
  category: CardTypeCategory;
  count: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={count === 0 && !isSelected}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
        isSelected
          ? `bg-gradient-to-r ${category.gradient} text-white shadow-md`
          : count > 0
            ? `${category.bgColor} ${category.textColor} hover:shadow-sm`
            : 'cursor-not-allowed bg-gray-50 text-gray-300'
      )}
      aria-pressed={isSelected}
      aria-label={`Filter by ${category.label}${count > 0 ? `, ${count} cards` : ''}`}
    >
      <span>{category.label}</span>
      {count > 0 && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-xs',
            isSelected ? 'bg-white/20 text-white' : 'bg-white/80 text-gray-600'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function CardTypeFilter({
  gameId,
  selectedType,
  onTypeChange,
  typeCounts,
}: CardTypeFilterProps) {
  const categories = getCardTypesForGame(gameId);

  // Don't render if no categories for this game
  if (categories.length === 0) return null;

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Filter by Card Type</h3>
        {selectedType && (
          <button
            onClick={() => onTypeChange(null)}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-1"
            aria-label="Clear card type filter"
          >
            <XMarkIcon className="h-3 w-3" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Card type filter options">
        {categories.map((category) => {
          const count = typeCounts?.get(category.id) ?? 0;
          const isSelected = selectedType === category.id;

          return (
            <CardTypeButton
              key={category.id}
              category={category}
              count={count}
              isSelected={isSelected}
              onClick={() => onTypeChange(isSelected ? null : category.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
