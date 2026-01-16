'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MagnifyingGlassIcon, RocketLaunchIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { SeriesFilter, type SeriesFilterValue } from './SeriesFilter';
import { GameFilter, type GameFilterValue, useEnabledGames } from './GameFilter';
import type { PokemonSet, PokemonSeries } from '@/lib/pokemon-tcg';

interface SetsListProps {
  sets: PokemonSet[];
}

export function SetsList({ sets }: SetsListProps) {
  const [selectedSeries, setSelectedSeries] = useState<SeriesFilterValue>('all');
  const [selectedGame, setSelectedGame] = useState<GameFilterValue>('all');
  const enabledGames = useEnabledGames();

  // Filter sets based on selected game and series
  const filteredSets = useMemo(() => {
    let filtered = sets;

    // Apply game filter
    // Currently, all sets are Pokemon TCG sets from the API
    // When multi-TCG support is fully implemented, sets will have a gameId field
    // For now, we filter Pokemon sets when 'pokemon' is selected, hide all when other games selected
    if (selectedGame !== 'all') {
      if (selectedGame === 'pokemon') {
        // All current sets are Pokemon - keep them all
        filtered = filtered;
      } else {
        // Other TCG sets not yet available - filter to empty
        // This shows an appropriate "no sets" message for coming soon games
        filtered = [];
      }
    }

    // Apply series filter (only relevant for Pokemon sets)
    if (selectedSeries !== 'all' && selectedGame !== 'all' && selectedGame !== 'pokemon') {
      // Series filter doesn't apply to non-Pokemon games
      return filtered;
    }
    if (selectedSeries !== 'all') {
      filtered = filtered.filter((set) => set.series === selectedSeries);
    }

    return filtered;
  }, [sets, selectedSeries, selectedGame]);

  // Calculate counts for series filter
  const seriesCounts = useMemo(() => {
    // Only count Pokemon sets for series filter
    const setsToCount =
      selectedGame === 'all' || selectedGame === 'pokemon' ? sets : [];

    const counts: Record<SeriesFilterValue, number> = {
      all: setsToCount.length,
      'Scarlet & Violet': 0,
      'Sword & Shield': 0,
    };

    setsToCount.forEach((set) => {
      const series = set.series as PokemonSeries;
      if (series in counts) {
        counts[series]++;
      }
    });

    return counts;
  }, [sets, selectedGame]);

  // Calculate counts for game filter
  const gameCounts = useMemo(() => {
    const counts: Record<GameFilterValue, number> = {
      all: sets.length, // Total of all available sets
      pokemon: sets.length, // Currently all sets are Pokemon
      yugioh: 0, // Coming soon
      onepiece: 0, // Coming soon
      dragonball: 0, // Coming soon
      lorcana: 0, // Coming soon
      digimon: 0, // Coming soon
      mtg: 0, // Coming soon
    };
    return counts;
  }, [sets]);

  // Determine if series filter should be shown (only for Pokemon)
  const showSeriesFilter = selectedGame === 'all' || selectedGame === 'pokemon';

  return (
    <>
      {/* Game Filter Tabs - Only show if user has multiple games enabled */}
      {enabledGames.length > 1 && (
        <div className="mb-4 sm:mb-6">
          <GameFilter value={selectedGame} onChange={setSelectedGame} setCounts={gameCounts} />
        </div>
      )}

      {/* Series Filter Tabs - Only show for Pokemon sets */}
      {showSeriesFilter && (
        <div className="mb-6 sm:mb-8">
          <SeriesFilter
            value={selectedSeries}
            onChange={setSelectedSeries}
            setCounts={seriesCounts}
          />
        </div>
      )}

      {/* Sets Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {filteredSets.map((set) => (
          <Link
            key={set.id}
            href={`/sets/${set.id}`}
            className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 sm:p-6"
            aria-label={`${set.name} - ${set.total} cards, ${set.series} series`}
          >
            {/* Set Logo */}
            <div className="mb-3 flex h-20 items-center justify-center sm:mb-4 sm:h-24">
              {set.images?.logo ? (
                <Image
                  src={set.images.logo}
                  alt={set.name}
                  width={200}
                  height={80}
                  className="h-auto max-h-16 w-auto object-contain sm:max-h-20"
                />
              ) : (
                <div className="text-xl font-bold text-gray-500 sm:text-2xl">{set.name}</div>
              )}
            </div>

            {/* Set Info */}
            <div className="text-center">
              <h2 className="text-base font-semibold text-gray-800 group-hover:text-kid-primary sm:text-lg">
                {set.name}
              </h2>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">{set.series}</p>

              {/* Card Count */}
              <div className="mt-3 flex items-center justify-center gap-2 sm:mt-4">
                <span className="rounded-full bg-kid-primary/10 px-2.5 py-0.5 text-xs font-medium text-kid-primary sm:px-3 sm:py-1 sm:text-sm">
                  {set.total} cards
                </span>
                {set.images?.symbol && (
                  <Image
                    src={set.images.symbol}
                    alt=""
                    width={24}
                    height={24}
                    className="h-5 w-5 sm:h-6 sm:w-6"
                  />
                )}
              </div>

              {/* Release Date */}
              <p className="mt-2 text-xs text-gray-500 sm:mt-3">
                Released:{' '}
                {new Date(set.releaseDate).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-kid-primary/5 to-kid-secondary/5 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      {/* Empty State - Coming Soon for non-Pokemon games */}
      {filteredSets.length === 0 &&
        sets.length > 0 &&
        selectedGame !== 'all' &&
        selectedGame !== 'pokemon' && (
          <ComingSoonState
            gameName={enabledGames.find((g) => g.id === selectedGame)?.name ?? selectedGame}
          />
        )}

      {/* Empty State - Series filter with no results */}
      {filteredSets.length === 0 &&
        sets.length > 0 &&
        (selectedGame === 'all' || selectedGame === 'pokemon') && (
          <div className="rounded-2xl bg-white p-12 text-center shadow-md">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h2 className="mt-4 text-xl font-semibold text-gray-800">No sets found</h2>
            <p className="mt-2 text-gray-500">Try selecting a different series filter.</p>
          </div>
        )}

      {/* Error State - No sets at all */}
      {sets.length === 0 && (
        <div className="rounded-2xl bg-white p-12 text-center shadow-md">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-xl font-semibold text-gray-800">No sets found</h2>
          <p className="mt-2 text-gray-500">Unable to load Pokemon sets. Please try again later.</p>
        </div>
      )}
    </>
  );
}

/**
 * Coming Soon state for games that don't have sets yet
 */
function ComingSoonState({ gameName }: { gameName: string }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-8 text-center shadow-md sm:p-12">
      {/* Icon container with decorative elements */}
      <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-kid-primary/20 to-kid-secondary/20" />
        <RocketLaunchIcon className="h-10 w-10 text-kid-primary" aria-hidden="true" />
        {/* Decorative sparkles */}
        <SparklesIcon
          className="absolute -right-1 -top-1 h-5 w-5 text-yellow-500"
          aria-hidden="true"
        />
        <SparklesIcon
          className="absolute -bottom-1 -left-1 h-4 w-4 text-purple-500"
          aria-hidden="true"
        />
      </div>

      <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">{gameName} Coming Soon!</h2>

      <p className="mx-auto mt-3 max-w-md text-sm text-gray-600 sm:text-base">
        We&apos;re working hard to add {gameName} sets to CardDex. Check back soon to start
        tracking your collection!
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-kid-primary shadow-sm">
          Browse Pok&eacute;mon sets for now
        </div>
      </div>
    </div>
  );
}
