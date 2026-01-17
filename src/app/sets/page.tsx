'use client';

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function SetsPage() {
  const { primaryGame, isLoading: gameLoading } = useGameSelector();

  const gameSlug = primaryGame?.id as 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana' | undefined;

  const sets = useQuery(
    api.dataPopulation.getSetsByGame,
    gameSlug ? { gameSlug } : 'skip'
  );

  // Get set IDs that need sample card images (no logoUrl or Yu-Gi-Oh!)
  const setIdsNeedingSampleCards = useMemo(() => {
    if (!sets || !gameSlug) return [];
    // For Yu-Gi-Oh!, One Piece, and Lorcana - get sample cards for all sets
    // For Pokemon, only for sets without logos
    if (gameSlug === 'pokemon') {
      return sets.filter((s) => !s.logoUrl).map((s) => s.setId);
    }
    return sets.map((s) => s.setId);
  }, [sets, gameSlug]);

  // Fetch sample card images for sets without logos
  const sampleCards = useQuery(
    api.dataPopulation.getSampleCardsBySet,
    gameSlug && setIdsNeedingSampleCards.length > 0
      ? { gameSlug, setIds: setIdsNeedingSampleCards }
      : 'skip'
  );

  const isLoading = gameLoading || sets === undefined;

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
              primaryGame?.gradientFrom || 'from-indigo-500',
              primaryGame?.gradientTo || 'to-purple-500'
            )}
          >
            {primaryGame?.name || 'Card'} Sets
          </h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">
            Choose a set to start tracking your collection!
          </p>
        </div>

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
              No sets found for {primaryGame?.name}
            </p>
            <p className="mt-2 text-gray-500 dark:text-slate-400">
              The data for this game may still be loading. Check back soon!
            </p>
          </div>
        )}

        {/* Sets grid */}
        {!isLoading && sets && sets.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {sets.map((set) => {
              // Determine which image to show:
              // 1. Pokemon with logo -> use logo
              // 2. Any game with sample card -> use sample card
              // 3. Fallback -> gradient with first letter
              const useLogo = set.logoUrl && primaryGame?.id === 'pokemon';
              const sampleCardUrl = sampleCards?.[set.setId];

              return (
                <Link
                  key={set._id}
                  href={`/sets/${set.setId}?game=${primaryGame?.id}`}
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
                          primaryGame?.gradientFrom || 'from-indigo-500',
                          primaryGame?.gradientTo || 'to-purple-500'
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
      </div>
    </main>
  );
}
