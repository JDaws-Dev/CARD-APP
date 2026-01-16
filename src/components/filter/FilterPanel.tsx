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
    <aside
      className="space-y-4 rounded-xl bg-white p-4 shadow-sm sm:space-y-6 sm:p-6"
      role="search"
      aria-label="Card filters"
    >
      {/* Header with Clear Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800" id="filter-heading">
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="rounded text-sm text-gray-500 hover:text-kid-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Name Filter */}
      <div>
        <label
          htmlFor="pokemon-name-filter"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Pokemon Name
        </label>
        <input
          id="pokemon-name-filter"
          type="text"
          value={nameFilter}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., Pikachu"
          className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm transition focus:border-kid-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-1"
          aria-describedby="name-filter-hint"
        />
        <span id="name-filter-hint" className="sr-only">
          Enter a Pokemon name to filter cards
        </span>
      </div>

      {/* Set Filter */}
      <div>
        <label htmlFor="set-filter" className="mb-2 block text-sm font-medium text-gray-700">
          Set
        </label>
        <select
          id="set-filter"
          value={selectedSetId || ''}
          onChange={(e) => onSetChange(e.target.value || null)}
          className="w-full rounded-lg border-2 border-gray-200 px-4 py-2 text-sm transition focus:border-kid-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-1"
          aria-label="Filter by card set"
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
      <fieldset>
        <legend className="mb-2 block text-sm font-medium text-gray-700">Type</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Pokemon type filters">
          {POKEMON_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onTypeChange(selectedType === type ? null : type)}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
                selectedType === type
                  ? 'bg-kid-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
              aria-pressed={selectedType === type}
              aria-label={`Filter by ${type} type${selectedType === type ? ', currently selected' : ''}`}
            >
              {type}
            </button>
          ))}
        </div>
      </fieldset>
    </aside>
  );
}
