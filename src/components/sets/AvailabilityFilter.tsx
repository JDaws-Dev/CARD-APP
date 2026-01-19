'use client';

import { cn } from '@/lib/utils';
import { ShoppingBagIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

export type AvailabilityFilterValue = 'available' | 'all';

interface AvailabilityFilterProps {
  value: AvailabilityFilterValue;
  onChange: (value: AvailabilityFilterValue) => void;
  counts?: { available: number; all: number };
}

const FILTER_OPTIONS: {
  value: AvailabilityFilterValue;
  label: string;
  shortLabel: string;
  icon: typeof ShoppingBagIcon;
  description: string;
}[] = [
  {
    value: 'available',
    label: 'Available Sets',
    shortLabel: 'Available',
    icon: ShoppingBagIcon,
    description: 'Recently released sets you can still buy',
  },
  {
    value: 'all',
    label: 'All Sets',
    shortLabel: 'All',
    icon: ArchiveBoxIcon,
    description: 'Every set ever released',
  },
];

/**
 * AvailabilityFilter - Toggle between showing only available sets or all sets
 *
 * "Available" sets are those released within the last 2-3 years (still in print).
 * This helps casual/new collectors focus on sets they can actually purchase.
 */
export function AvailabilityFilter({ value, onChange, counts }: AvailabilityFilterProps) {
  return (
    <div
      className="flex items-center justify-center gap-1 rounded-full bg-gray-100 p-1 dark:bg-slate-700"
      role="tablist"
      aria-label="Filter by availability"
    >
      {FILTER_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        const count = counts?.[option.value];
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            role="tab"
            aria-selected={isSelected}
            title={option.description}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all sm:px-4 sm:py-2',
              isSelected
                ? 'bg-white text-gray-800 shadow-sm dark:bg-slate-600 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sm:hidden">{option.shortLabel}</span>
            {count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs',
                  isSelected
                    ? 'bg-gray-100 text-gray-600 dark:bg-slate-500 dark:text-slate-200'
                    : 'bg-gray-200 text-gray-500 dark:bg-slate-600 dark:text-slate-400'
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Determine if a set is "available" (still in print) based on release date.
 *
 * Uses different cutoff dates per game:
 * - Pokemon: Sets typically stay in print ~2 years
 * - Yu-Gi-Oh: Core sets available longer (~3 years)
 * - One Piece: Newer TCG with high demand, sets stay available ~4 years
 *              (includes main boosters OP01+ and reprints via PRB sets)
 * - Lorcana: Newest TCG (started 2023), all sets likely still available
 *
 * @param releaseDate - The set's release date string
 * @param gameSlug - The game identifier
 * @returns true if the set is likely still available for purchase
 */
export function isSetAvailable(
  releaseDate: string | null | undefined,
  gameSlug: string
): boolean {
  if (!releaseDate) {
    // If no release date, assume it's available (better UX than hiding)
    return true;
  }

  const release = new Date(releaseDate);
  const now = new Date();
  const yearsDiff = (now.getTime() - release.getTime()) / (1000 * 60 * 60 * 24 * 365);

  // Different availability windows per game
  switch (gameSlug) {
    case 'pokemon':
      // Pokemon sets stay in print ~2 years
      return yearsDiff <= 2;
    case 'yugioh':
      // Yu-Gi-Oh core sets available longer
      return yearsDiff <= 3;
    case 'onepiece':
      // One Piece TCG has high demand, sets stay available longer (~4 years)
      // This includes all main boosters (OP01+) and reprints via PRB sets
      return yearsDiff <= 4;
    case 'lorcana':
      // Lorcana started in 2023, all sets likely still available
      return yearsDiff <= 3;
    default:
      // Default: 2 years
      return yearsDiff <= 2;
  }
}
