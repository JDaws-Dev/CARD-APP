'use client';

import { cn } from '@/lib/utils';
import { POKEMON_TYPES } from '@/lib/pokemon-tcg';
import type { PokemonSet } from '@/lib/pokemon-tcg';

interface FilterPanelProps {
  sets: PokemonSet[];
  selectedSetId: string | null;
  selectedType: string | null;
  nameFilter: string;
  onSetChange: (setId: string | null) => void;
  onTypeChange: (type: string | null) => void;
  onNameChange: (name: string) => void;
  onClearAll: () => void;
}

export function FilterPanel({
  sets,
  selectedSetId,
  selectedType,
  nameFilter,
  onSetChange,
  onTypeChange,
  onNameChange,
  onClearAll,
}: FilterPanelProps) {
  const hasActiveFilters = selectedSetId || selectedType || nameFilter;

  return (
    <div className="space-y-6 rounded-xl bg-white p-6 shadow-sm">
      {/* Header with Clear Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        {hasActiveFilters && (
          <button onClick={onClearAll} className="text-sm text-gray-500 hover:text-kid-primary">
            Clear all
          </button>
        )}
      </div>

      {/* Name Filter */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Pokemon Name</label>
        <input
          type="text"
          value={nameFilter}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., Pikachu"
          className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm transition focus:border-kid-primary focus:outline-none"
        />
      </div>

      {/* Set Filter */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Set</label>
        <select
          value={selectedSetId || ''}
          onChange={(e) => onSetChange(e.target.value || null)}
          className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm transition focus:border-kid-primary focus:outline-none"
        >
          <option value="">All Sets</option>
          {sets.map((set) => (
            <option key={set.id} value={set.id}>
              {set.name}
            </option>
          ))}
        </select>
      </div>

      {/* Type Filter */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Type</label>
        <div className="flex flex-wrap gap-2">
          {POKEMON_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onTypeChange(selectedType === type ? null : type)}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium transition',
                selectedType === type
                  ? 'bg-kid-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
