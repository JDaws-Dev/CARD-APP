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
      <div className="mb-8">
        <SeriesFilter value={selectedSeries} onChange={setSelectedSeries} setCounts={setCounts} />
      </div>

      {/* Sets Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSets.map((set) => (
          <Link
            key={set.id}
            href={`/sets/${set.id}`}
            className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            {/* Set Logo */}
            <div className="mb-4 flex h-24 items-center justify-center">
              {set.images?.logo ? (
                <Image
                  src={set.images.logo}
                  alt={set.name}
                  width={200}
                  height={80}
                  className="h-auto max-h-20 w-auto object-contain"
                />
              ) : (
                <div className="text-2xl font-bold text-gray-400">{set.name}</div>
              )}
            </div>

            {/* Set Info */}
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-800 group-hover:text-kid-primary">
                {set.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">{set.series}</p>

              {/* Card Count */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="rounded-full bg-kid-primary/10 px-3 py-1 text-sm font-medium text-kid-primary">
                  {set.total} cards
                </span>
                {set.images?.symbol && (
                  <Image
                    src={set.images.symbol}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6"
                  />
                )}
              </div>

              {/* Release Date */}
              <p className="mt-3 text-xs text-gray-400">
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
