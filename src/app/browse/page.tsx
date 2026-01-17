'use client';

import { useState, useEffect, useCallback } from 'react';
import { FilterPanel, FilterChips } from '@/components/filter';
import { SearchResults } from '@/components/search/SearchResults';
import { FilterPanelSkeleton } from '@/components/ui/Skeleton';
import { InlineError } from '@/components/ui/ErrorBoundary';
import { FunnelIcon } from '@heroicons/react/24/outline';
import type { PokemonCard, PokemonSet } from '@/lib/pokemon-tcg';
import { BackLink } from '@/components/ui/BackLink';

export default function BrowsePage() {
  // Filter state
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState('');
  const [debouncedName, setDebouncedName] = useState('');

  // Data state
  const [sets, setSets] = useState<PokemonSet[]>([]);
  const [setsLoading, setSetsLoading] = useState(true);
  const [results, setResults] = useState<PokemonCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch sets on mount
  useEffect(() => {
    async function fetchSets() {
      setSetsLoading(true);
      try {
        const response = await fetch('/api/sets');
        if (response.ok) {
          const data = await response.json();
          setSets(data);
        }
      } catch (err) {
        console.error('Failed to fetch sets:', err);
      } finally {
        setSetsLoading(false);
      }
    }
    fetchSets();
  }, []);

  // Debounce name filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(nameFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [nameFilter]);

  // Fetch filtered results
  useEffect(() => {
    const fetchResults = async () => {
      // Need at least one filter to search
      const hasValidNameFilter = debouncedName.length >= 2;
      const hasAnyFilter = selectedSetId || selectedType || hasValidNameFilter;

      if (!hasAnyFilter) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const params = new URLSearchParams();
        if (selectedSetId) params.set('setId', selectedSetId);
        if (selectedType) params.set('type', selectedType);
        if (hasValidNameFilter) params.set('name', debouncedName.trim());
        params.set('limit', '100');

        const response = await fetch(`/api/filter?${params.toString()}`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to filter cards');
        }

        const cards = await response.json();
        setResults(cards);
      } catch (err) {
        console.error('Filter error:', err);
        setError(err instanceof Error ? err.message : 'Failed to filter cards');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [selectedSetId, selectedType, debouncedName]);

  // Get selected set name for display
  const selectedSetName = selectedSetId
    ? (sets.find((s) => s.id === selectedSetId)?.name ?? null)
    : null;

  // Clear handlers
  const handleClearAll = useCallback(() => {
    setSelectedSetId(null);
    setSelectedType(null);
    setNameFilter('');
  }, []);

  const handleClearSet = useCallback(() => setSelectedSetId(null), []);
  const handleClearType = useCallback(() => setSelectedType(null), []);
  const handleClearName = useCallback(() => setNameFilter(''), []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <BackLink href="/" withMargin>
            Back to Home
          </BackLink>

          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Browse Cards</h1>
          <p className="text-sm text-gray-500 sm:text-base">
            Filter cards by set, type, or Pokemon name
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:gap-8">
          {/* Filter Panel - Sidebar */}
          <div className="lg:w-72 lg:flex-shrink-0">
            {setsLoading ? (
              <FilterPanelSkeleton />
            ) : (
              <FilterPanel
                sets={sets}
                selectedSetId={selectedSetId}
                selectedType={selectedType}
                nameFilter={nameFilter}
                onSetChange={setSelectedSetId}
                onTypeChange={setSelectedType}
                onNameChange={setNameFilter}
                onClearAll={handleClearAll}
              />
            )}
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Active Filter Chips */}
            <div className="mb-4">
              <FilterChips
                selectedSetName={selectedSetName}
                selectedType={selectedType}
                nameFilter={debouncedName}
                onClearSet={handleClearSet}
                onClearType={handleClearType}
                onClearName={handleClearName}
              />
            </div>

            {/* Error State */}
            {error && (
              <div className="mb-4">
                <InlineError
                  message={error}
                  onRetry={() => {
                    setError(null);
                    setDebouncedName(nameFilter);
                  }}
                />
              </div>
            )}

            {/* Results or Placeholder */}
            {hasSearched ? (
              <SearchResults cards={results} isLoading={isLoading} />
            ) : (
              <div className="rounded-xl bg-white p-12 text-center shadow-sm">
                <div className="mb-4 flex justify-center">
                  <FunnelIcon className="h-16 w-16 text-kid-primary" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-800">Browse Pokemon Cards</h2>
                <p className="mb-6 text-gray-500">
                  Use the filters to find cards by set, type, or Pokemon name.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => setSelectedType('Fire')}
                    className="rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-200"
                  >
                    Fire Types
                  </button>
                  <button
                    onClick={() => setSelectedType('Water')}
                    className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-200"
                  >
                    Water Types
                  </button>
                  <button
                    onClick={() => setSelectedType('Grass')}
                    className="rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-600 transition hover:bg-green-200"
                  >
                    Grass Types
                  </button>
                  <button
                    onClick={() => setSelectedType('Lightning')}
                    className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-600 transition hover:bg-yellow-200"
                  >
                    Lightning Types
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
