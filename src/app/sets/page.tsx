'use client';

import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import { GAMES } from '@/lib/gameSelector';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  AvailabilityFilter,
  type AvailabilityFilterValue,
  isSetAvailable,
} from '@/components/sets/AvailabilityFilter';

type GameSlug = 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana';

function SetsPageContent() {
  const searchParams = useSearchParams();
  const { primaryGame, isLoading: gameLoading } = useGameSelector();
  const [sampleCards, setSampleCards] = useState<Record<string, string>>({});
  // Default to 'available' for simpler browsing (shows recent/purchasable sets)
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilterValue>('available');

  // Use game from URL params if provided, otherwise fall back to the user's primary game
  const gameSlug = (searchParams.get('game') || primaryGame?.id) as GameSlug | undefined;
  const game = GAMES.find((g) => g.id === gameSlug);

  const sets = useQuery(
    api.dataPopulation.getSetsByGame,
    gameSlug ? { gameSlug } : 'skip'
  );

  // Determine which sets need sample card images
  const setIdsNeedingSampleCards = useMemo(() => {
    if (!sets || !gameSlug) return [];
    // For Yu-Gi-Oh!, One Piece, and Lorcana - get sample cards for all sets
    // For Pokemon, only for sets without logos
    if (gameSlug === 'pokemon') {
      return sets.filter((s) => !s.logoUrl).map((s) => s.setId);
    }
    return sets.map((s) => s.setId);
  }, [sets, gameSlug]);

  // Fetch sample cards for the first few sets that need them
  // We use getCachedCardsInSet for the first set to get a sample card
  const firstSetNeedingSample = setIdsNeedingSampleCards[0];
  const firstSetCards = useQuery(
    api.dataPopulation.getCachedCardsInSet,
    gameSlug && firstSetNeedingSample
      ? { gameSlug, setId: firstSetNeedingSample }
      : 'skip'
  );

  // Use filterCardsByGame to get cards for multiple sets at once
  const allCards = useQuery(
    api.dataPopulation.filterCardsByGame,
    gameSlug && setIdsNeedingSampleCards.length > 0
      ? { gameSlug, limit: 500 }
      : 'skip'
  );

  // Build sample cards map from allCards
  useEffect(() => {
    if (!allCards?.cards || !setIdsNeedingSampleCards.length) return;

    const newSampleCards: Record<string, string> = {};
    const neededSets = new Set(setIdsNeedingSampleCards);

    for (const card of allCards.cards) {
      if (neededSets.has(card.setId) && card.imageSmall && !newSampleCards[card.setId]) {
        newSampleCards[card.setId] = card.imageSmall;
      }
    }

    setSampleCards(newSampleCards);
  }, [allCards, setIdsNeedingSampleCards]);

  const isLoading = gameLoading || sets === undefined;

  // Filter sets based on availability filter
  const filteredSets = useMemo(() => {
    if (!sets || !gameSlug) return [];
    if (availabilityFilter === 'all') return sets;
    // Filter to only available (recently released) sets
    return sets.filter((set) => isSetAvailable(set.releaseDate, gameSlug));
  }, [sets, gameSlug, availabilityFilter]);

  // Calculate counts for availability filter
  const availabilityCounts = useMemo(() => {
    if (!sets || !gameSlug) return { available: 0, all: 0 };
    const availableCount = sets.filter((set) => isSetAvailable(set.releaseDate, gameSlug)).length;
    return { available: availableCount, all: sets.length };
  }, [sets, gameSlug]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 px-4 py-8 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
              Back to Home
            </Link>
          </div>
          <h1
            className={cn(
              'bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent',
              game?.gradientFrom || 'from-indigo-500',
              game?.gradientTo || 'to-purple-500'
            )}
          >
            {game?.name || 'Card'} Sets
          </h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">
            Choose a set to start tracking your collection!
          </p>
        </div>

        {/* Availability Filter */}
        {!isLoading && sets && sets.length > 0 && (
          <div className="mb-6 flex justify-center">
            <AvailabilityFilter
              value={availabilityFilter}
              onChange={setAvailabilityFilter}
              counts={availabilityCounts}
            />
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-white p-4 shadow-md dark:bg-slate-800">
                <div className="mb-3 h-20 rounded-lg bg-gray-200 dark:bg-slate-700" />
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="mt-2 h-3 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!sets || sets.length === 0) && (
          <div className="rounded-xl bg-white p-8 text-center shadow-md dark:bg-slate-800">
            <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
              No sets found for {game?.name}
            </p>
            <p className="mt-2 text-gray-500 dark:text-slate-400">
              The data for this game may still be loading. Check back soon!
            </p>
          </div>
        )}

        {/* Sets grid */}
        {!isLoading && sets && sets.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredSets.map((set) => {
              // Determine which image to show:
              // 1. Pokemon with logo -> use logo
              // 2. Any game with sample card -> use sample card
              // 3. Fallback -> gradient with first letter
              const useLogo = set.logoUrl && gameSlug === 'pokemon';
              const sampleCardUrl = sampleCards[set.setId];

              return (
                <Link
                  key={set._id}
                  href={`/sets/${set.setId}?game=${gameSlug}`}
                  className={cn(
                    'group rounded-xl bg-white p-4 shadow-md transition-all hover:shadow-lg hover:scale-[1.02]',
                    'dark:bg-slate-800 dark:hover:bg-slate-750'
                  )}
                >
                  {/* Set logo/image */}
                  <div className="relative mb-3 flex h-20 items-center justify-center overflow-hidden rounded-lg">
                    {useLogo ? (
                      <Image
                        src={set.logoUrl!}
                        alt={set.name}
                        width={120}
                        height={80}
                        className="max-h-full w-auto object-contain"
                      />
                    ) : sampleCardUrl ? (
                      <Image
                        src={sampleCardUrl}
                        alt={set.name}
                        width={80}
                        height={112}
                        className="h-full w-auto object-contain"
                      />
                    ) : (
                      <div
                        className={cn(
                          'flex h-full w-full items-center justify-center text-2xl font-bold text-white bg-gradient-to-br',
                          game?.gradientFrom || 'from-indigo-500',
                          game?.gradientTo || 'to-purple-500'
                        )}
                      >
                        {set.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Set info */}
                  <h3 className="line-clamp-2 text-sm font-semibold text-gray-800 dark:text-white">
                    {set.name}
                  </h3>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                    <span>{set.totalCards} cards</span>
                    {set.releaseDate && (
                      <span>{new Date(set.releaseDate).getFullYear()}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty state when availability filter shows no results */}
        {!isLoading && sets && sets.length > 0 && filteredSets.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center shadow-md dark:bg-slate-800">
            <p className="text-lg font-medium text-gray-700 dark:text-slate-300">
              No available sets found
            </p>
            <p className="mt-2 text-gray-500 dark:text-slate-400">
              Try switching to &quot;All Sets&quot; to see older and out-of-print sets.
            </p>
            <button
              onClick={() => setAvailabilityFilter('all')}
              className="mt-4 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
            >
              Show All Sets
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 px-4 py-8 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
          </div>
          <div className="mx-auto h-10 w-48 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
          <div className="mx-auto mt-2 h-5 w-64 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-white p-4 shadow-md dark:bg-slate-800">
              <div className="mb-3 h-20 rounded-lg bg-gray-200 dark:bg-slate-700" />
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-slate-700" />
              <div className="mt-2 h-3 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function SetsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SetsPageContent />
    </Suspense>
  );
}
