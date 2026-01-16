'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SeriesFilter, type SeriesFilterValue } from './SeriesFilter';
import type { PokemonSet, PokemonSeries } from '@/lib/pokemon-tcg';

interface SetsListProps {
  sets: PokemonSet[];
}

export function SetsList({ sets }: SetsListProps) {
  const [selectedSeries, setSelectedSeries] = useState<SeriesFilterValue>('all');

  // Filter sets based on selected series
  const filteredSets = useMemo(() => {
    if (selectedSeries === 'all') {
      return sets;
    }
    return sets.filter((set) => set.series === selectedSeries);
  }, [sets, selectedSeries]);

  // Calculate counts for each filter option
  const setCounts = useMemo(() => {
    const counts: Record<SeriesFilterValue, number> = {
      all: sets.length,
      'Scarlet & Violet': 0,
      'Sword & Shield': 0,
    };

    sets.forEach((set) => {
      const series = set.series as PokemonSeries;
      if (series in counts) {
        counts[series]++;
      }
    });

    return counts;
  }, [sets]);

  return (
    <>
      {/* Series Filter Tabs */}
      <div className="mb-6 sm:mb-8">
        <SeriesFilter value={selectedSeries} onChange={setSelectedSeries} setCounts={setCounts} />
      </div>

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

      {/* Empty State */}
      {filteredSets.length === 0 && sets.length > 0 && (
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
