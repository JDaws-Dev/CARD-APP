'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { SearchResults } from '@/components/search/SearchResults';
import type { PokemonCard } from '@/lib/pokemon-tcg';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<PokemonCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Search when debounced query changes
  useEffect(() => {
    const searchCards = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=30`
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to search');
        }

        const cards = await response.json();
        setResults(cards);
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'Failed to search cards');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchCards();
  }, [debouncedQuery]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Home
          </Link>

          <h1 className="text-3xl font-bold text-gray-800">Search Cards</h1>
          <p className="text-gray-500">Find any Pokemon card by name</p>
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for Pokemon (e.g., Pikachu, Charizard)"
              className="w-full rounded-xl border-2 border-gray-200 bg-white py-4 pl-12 pr-12 text-lg shadow-sm transition focus:border-kid-primary focus:outline-none focus:ring-2 focus:ring-kid-primary/20"
              autoFocus
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          {query.length > 0 && query.length < 2 && (
            <p className="mt-2 text-sm text-gray-500">Type at least 2 characters to search</p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 rounded-xl bg-red-50 p-4 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Results */}
        {hasSearched ? (
          <SearchResults cards={results} isLoading={isLoading} />
        ) : (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="mb-4 text-6xl">🔍</div>
            <h2 className="mb-2 text-xl font-bold text-gray-800">Search for Pokemon Cards</h2>
            <p className="mb-4 text-gray-500">
              Enter a Pokemon name to find cards across all sets.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Pikachu', 'Charizard', 'Mewtwo', 'Eevee'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="rounded-full bg-kid-primary/10 px-4 py-2 text-sm font-medium text-kid-primary transition hover:bg-kid-primary/20"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
