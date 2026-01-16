'use client';

import { cn } from '@/lib/utils';
import { POKEMON_SERIES, type PokemonSeries } from '@/lib/pokemon-tcg';

export type SeriesFilterValue = PokemonSeries | 'all';

interface SeriesFilterProps {
  value: SeriesFilterValue;
  onChange: (value: SeriesFilterValue) => void;
  setCounts?: Record<SeriesFilterValue, number>;
}

const FILTER_OPTIONS: { value: SeriesFilterValue; label: string }[] = [
  { value: 'all', label: 'All Sets' },
  ...POKEMON_SERIES.map((series) => ({ value: series, label: series })),
];

export function SeriesFilter({ value, onChange, setCounts }: SeriesFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {FILTER_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        const count = setCounts?.[option.value];

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
              isSelected
                ? 'bg-kid-primary text-white shadow-md'
                : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50 hover:shadow-md'
            )}
            aria-pressed={isSelected}
          >
            {option.label}
            {count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
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
