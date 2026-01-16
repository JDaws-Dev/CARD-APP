'use client';

import { cn } from '@/lib/utils';
import { SparklesIcon, StarIcon, FireIcon, BoltIcon } from '@heroicons/react/24/solid';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Rarity categories with their display config
export const RARITY_CATEGORIES = [
  {
    id: 'common',
    label: 'Common',
    shortLabel: 'C',
    matches: ['Common'],
    gradient: 'from-gray-400 to-gray-500',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    icon: null,
  },
  {
    id: 'uncommon',
    label: 'Uncommon',
    shortLabel: 'U',
    matches: ['Uncommon'],
    gradient: 'from-green-400 to-emerald-500',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    icon: null,
  },
  {
    id: 'rare',
    label: 'Rare',
    shortLabel: 'R',
    matches: ['Rare', 'Rare Holo'],
    gradient: 'from-blue-400 to-indigo-500',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: StarIcon,
  },
  {
    id: 'ultra-rare',
    label: 'Ultra Rare',
    shortLabel: 'UR',
    matches: [
      'Rare Ultra',
      'Rare Holo EX',
      'Rare Holo GX',
      'Rare Holo V',
      'Rare Holo VMAX',
      'Rare Holo VSTAR',
      'Rare BREAK',
      'Rare Prime',
      'Rare ACE',
      'Double Rare',
      'Ultra Rare',
    ],
    gradient: 'from-purple-400 to-violet-500',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    icon: SparklesIcon,
  },
  {
    id: 'secret-rare',
    label: 'Secret Rare',
    shortLabel: 'SR',
    matches: [
      'Rare Secret',
      'Rare Rainbow',
      'Rare Shining',
      'Rare Shiny',
      'Rare Shiny GX',
      'LEGEND',
      'Amazing Rare',
      'Illustration Rare',
      'Special Illustration Rare',
      'Hyper Rare',
      'Trainer Gallery Rare Holo',
    ],
    gradient: 'from-amber-400 to-yellow-500',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    icon: FireIcon,
  },
  {
    id: 'promo',
    label: 'Promo',
    shortLabel: 'P',
    matches: ['Promo', 'Classic Collection'],
    gradient: 'from-rose-400 to-pink-500',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-700',
    icon: BoltIcon,
  },
] as const;

export type RarityCategoryId = (typeof RARITY_CATEGORIES)[number]['id'];

// Helper function to get the category for a given rarity string
export function getRarityCategory(rarity: string | undefined): RarityCategoryId | null {
  if (!rarity) return null;

  for (const category of RARITY_CATEGORIES) {
    if (category.matches.some((match) => rarity.includes(match) || match.includes(rarity))) {
      return category.id;
    }
  }
  return null;
}

interface RarityFilterProps {
  selectedRarity: RarityCategoryId | null;
  onRarityChange: (rarity: RarityCategoryId | null) => void;
  rarityCounts?: Map<RarityCategoryId, number>;
}

export function RarityFilter({ selectedRarity, onRarityChange, rarityCounts }: RarityFilterProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Filter by Rarity</h3>
        {selectedRarity && (
          <button
            onClick={() => onRarityChange(null)}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-1"
            aria-label="Clear rarity filter"
          >
            <XMarkIcon className="h-3 w-3" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Rarity filter options">
        {RARITY_CATEGORIES.map((category) => {
          const count = rarityCounts?.get(category.id) ?? 0;
          const isSelected = selectedRarity === category.id;
          const Icon = category.icon;

          return (
            <button
              key={category.id}
              onClick={() => onRarityChange(isSelected ? null : category.id)}
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
              {Icon && (
                <Icon
                  className={cn('h-4 w-4', isSelected ? 'text-white' : '')}
                  aria-hidden="true"
                />
              )}
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
        })}
      </div>
    </div>
  );
}
