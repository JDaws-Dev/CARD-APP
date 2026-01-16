'use client';

import { useState, useMemo } from 'react';
import type { PokemonCard, PokemonSet } from '@/lib/pokemon-tcg';
import { CardGrid } from './CardGrid';
import {
  RarityFilter,
  getRarityCategory,
  RARITY_CATEGORIES,
  type RarityCategoryId,
} from '@/components/filter/RarityFilter';

interface SetDetailClientProps {
  set: PokemonSet;
  cards: PokemonCard[];
}

export function SetDetailClient({ set, cards }: SetDetailClientProps) {
  const [selectedRarity, setSelectedRarity] = useState<RarityCategoryId | null>(null);

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

      {/* Card Grid */}
      <CardGrid cards={filteredCards} setId={set.id} setName={set.name} />
    </div>
  );
}
