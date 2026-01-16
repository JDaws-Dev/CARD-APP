'use client';

import { useState, useMemo } from 'react';
import type { PokemonCard, PokemonSet } from '@/lib/pokemon-tcg';
import { VirtualCardGrid } from './VirtualCardGrid';
import {
  RarityFilter,
  getRarityCategory,
  RARITY_CATEGORIES,
  type RarityCategoryId,
} from '@/components/filter/RarityFilter';
import { JustPulledMode } from './JustPulledMode';
import { BoltIcon } from '@heroicons/react/24/solid';

interface SetDetailClientProps {
  set: PokemonSet;
  cards: PokemonCard[];
}

export function SetDetailClient({ set, cards }: SetDetailClientProps) {
  const [selectedRarity, setSelectedRarity] = useState<RarityCategoryId | null>(null);
  const [isJustPulledMode, setIsJustPulledMode] = useState(false);

  // Calculate rarity counts for the filter badges
  const rarityCounts = useMemo(() => {
    const counts = new Map<RarityCategoryId, number>();

    // Initialize all categories with 0
    RARITY_CATEGORIES.forEach((cat) => counts.set(cat.id, 0));

    // Count cards per category
    cards.forEach((card) => {
      const category = getRarityCategory(card.rarity);
      if (category) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    });

    return counts;
  }, [cards]);

  // Filter cards based on selected rarity
  const filteredCards = useMemo(() => {
    if (!selectedRarity) return cards;

    return cards.filter((card) => {
      const category = getRarityCategory(card.rarity);
      return category === selectedRarity;
    });
  }, [cards, selectedRarity]);

  return (
    <div className="space-y-6">
      {/* Just Pulled Mode Button */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => setIsJustPulledMode(true)}
          className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:shadow-orange-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
          aria-label="Enter Just Pulled mode for quick card adding"
        >
          <BoltIcon
            className="h-5 w-5 transition-transform group-hover:scale-110"
            aria-hidden="true"
          />
          <span>Just Pulled</span>
        </button>
        <p className="hidden text-sm text-gray-500 sm:block">
          Opened a pack? Tap cards rapid-fire to add them!
        </p>
      </div>

      {/* Rarity Filter */}
      <RarityFilter
        selectedRarity={selectedRarity}
        onRarityChange={setSelectedRarity}
        rarityCounts={rarityCounts}
      />

      {/* Filtered Card Count Indicator */}
      {selectedRarity && (
        <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-kid-primary">{filteredCards.length}</span>{' '}
            of <span className="font-semibold">{cards.length}</span> cards
            {selectedRarity && (
              <>
                {' '}
                in{' '}
                <span className="font-semibold">
                  {RARITY_CATEGORIES.find((c) => c.id === selectedRarity)?.label}
                </span>
              </>
            )}
          </p>
        </div>
      )}

      {/* Card Grid with Virtual Scrolling */}
      <VirtualCardGrid cards={filteredCards} setId={set.id} setName={set.name} />

      {/* Just Pulled Mode Overlay */}
      {isJustPulledMode && (
        <JustPulledMode
          cards={cards}
          setId={set.id}
          setName={set.name}
          onClose={() => setIsJustPulledMode(false)}
        />
      )}
    </div>
  );
}
