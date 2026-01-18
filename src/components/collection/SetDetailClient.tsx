'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { PokemonCard, PokemonSet } from '@/lib/pokemon-tcg';
import { VirtualCardGrid } from './VirtualCardGrid';
import {
  RarityFilter,
  getRarityCategory,
  RARITY_CATEGORIES,
  type RarityCategoryId,
} from '@/components/filter/RarityFilter';
import {
  CardTypeFilter,
  getCardTypeCategory,
  getCardTypesForGame,
  type CardTypeCategoryId,
} from '@/components/filter/CardTypeFilter';
import type { GameId } from '@/lib/gameSelector';
import { ChevronDownIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  getSetCompletionProgress,
  getSetCompletionProgressWithMode,
  type VariantCompletionData,
  type CompletionMode,
} from '@/lib/setCompletion';
import { useHidePrices } from '@/hooks/useHidePrices';

// Collection filter options for Have/Need/All toggle
type CollectionFilter = 'all' | 'have' | 'need';

// Sort options for the set detail view
type SortOption = 'number' | 'type' | 'owned' | 'wanted' | 'recentlyAdded' | 'price';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'number', label: 'Card Number' },
  { value: 'type', label: 'Card Type' },
  { value: 'owned', label: 'Owned First' },
  { value: 'wanted', label: 'Wanted First' },
  { value: 'recentlyAdded', label: 'Recently Added' },
  { value: 'price', label: 'Price (High to Low)' },
];

// Card type sort order (for grouping/sorting by supertype)
// Includes types from all 4 supported games: Pokemon, Yu-Gi-Oh!, One Piece, Lorcana
const TYPE_SORT_ORDER: Record<string, number> = {
  // Pokemon
  'Pokémon': 1,
  'Pokemon': 1,
  'Trainer': 2,
  'Energy': 3,
  // Yu-Gi-Oh! (frameType values)
  'Monster': 1,
  'normal': 1,
  'effect': 1,
  'ritual': 1,
  'fusion': 1,
  'synchro': 1,
  'xyz': 1,
  'link': 1,
  'Spell': 2,
  'spell': 2,
  'Trap': 3,
  'trap': 3,
  // One Piece
  'LEADER': 1,
  'Leader': 1,
  'CHARACTER': 2,
  'Character': 2,
  'EVENT': 3,
  'Event': 3,
  'STAGE': 4,
  'Stage': 4,
  'DON!!': 5,
  // Lorcana (card types can be combined like "Character/Song")
  'Action': 2,
  'Item': 3,
  'Song': 4,
  'Location': 5,
};

// Helper function to get the best market price from a card's TCGPlayer prices
function getCardMarketPrice(card: PokemonCard): number | null {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;

  return (
    prices.normal?.market ?? prices.holofoil?.market ?? prices.reverseHolofoil?.market ?? null
  );
}

// Helper to parse card number for numeric sorting
function parseCardNumber(number: string): number {
  // Handle formats like "1", "001", "TG01", "SWSH001", etc.
  const match = number.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

interface SetDetailClientProps {
  set: PokemonSet;
  cards: PokemonCard[];
  gameSlug?: GameId;
}

export function SetDetailClient({ set, cards, gameSlug = 'pokemon' }: SetDetailClientProps) {
  const [selectedRarity, setSelectedRarity] = useState<RarityCategoryId | null>(null);
  const [selectedType, setSelectedType] = useState<CardTypeCategoryId | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('number');
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all');

  const { profileId } = useCurrentProfile();
  const { hidePrices } = useHidePrices();

  // Filter out price sort option when hidePrices is enabled
  const availableSortOptions = useMemo(() => {
    if (hidePrices) {
      return SORT_OPTIONS.filter((option) => option.value !== 'price');
    }
    return SORT_OPTIONS;
  }, [hidePrices]);

  // Reset sort to 'number' if current sort is 'price' and prices are hidden
  useEffect(() => {
    if (hidePrices && sortBy === 'price') {
      setSortBy('number');
    }
  }, [hidePrices, sortBy]);

  // Get collection data for this set
  const collection = useQuery(
    api.collections.getCollectionBySet,
    profileId ? { profileId: profileId as Id<'profiles'>, setId: set.id } : 'skip'
  );

  // Get wishlist data
  const wishlist = useQuery(
    api.wishlist.getWishlist,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  // Get recently added cards
  const newlyAddedCardsData = useQuery(
    api.collections.getNewlyAddedCards,
    profileId ? { profileId: profileId as Id<'profiles'>, days: 7 } : 'skip'
  );

  // Get variant-aware completion setting
  const variantCompletionSetting = useQuery(
    api.profileSettings.getVariantAwareCompletion,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );
  const setVariantAwareCompletion = useMutation(api.profileSettings.setVariantAwareCompletion);

  const completionMode: CompletionMode =
    variantCompletionSetting?.variantAwareCompletion ? 'variants' : 'unique';

  // Toggle handler for completion mode
  const handleToggleCompletionMode = async () => {
    if (!profileId) return;
    const newValue = !variantCompletionSetting?.variantAwareCompletion;
    await setVariantAwareCompletion({
      profileId: profileId as Id<'profiles'>,
      variantAwareCompletion: newValue,
    });
  };

  // Build lookup maps for sorting
  const { ownedCardIds, wishlistCardIds, recentlyAddedCardIds, recentlyAddedTimes } = useMemo(() => {
    const owned = new Set<string>();
    const wishlisted = new Set<string>();
    const recent = new Set<string>();
    const recentTimes = new Map<string, number>();

    if (collection) {
      collection.forEach((item) => owned.add(item.cardId));
    }

    if (wishlist) {
      wishlist.forEach((item) => wishlisted.add(item.cardId));
    }

    if (newlyAddedCardsData?.cards) {
      newlyAddedCardsData.cards.forEach((item) => {
        recent.add(item.cardId);
        recentTimes.set(item.cardId, item.addedAt);
      });
    }

    return {
      ownedCardIds: owned,
      wishlistCardIds: wishlisted,
      recentlyAddedCardIds: recent,
      recentlyAddedTimes: recentTimes,
    };
  }, [collection, wishlist, newlyAddedCardsData]);

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

  // Calculate card type counts for the filter badges
  const typeCounts = useMemo(() => {
    const counts = new Map<CardTypeCategoryId, number>();
    const categories = getCardTypesForGame(gameSlug);

    // Initialize all categories with 0
    categories.forEach((cat) => counts.set(cat.id, 0));

    // Count cards per category
    cards.forEach((card) => {
      const category = getCardTypeCategory(card.supertype, gameSlug);
      if (category) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    });

    return counts;
  }, [cards, gameSlug]);

  // Calculate collection filter counts (Have/Need)
  const collectionCounts = useMemo(() => {
    const haveCount = cards.filter((card) => ownedCardIds.has(card.id)).length;
    const needCount = cards.length - haveCount;
    return { have: haveCount, need: needCount, all: cards.length };
  }, [cards, ownedCardIds]);

  // Build variant data for variant-aware completion
  const variantData = useMemo<VariantCompletionData>(() => {
    const availableVariantsPerCard = new Map<string, number>();
    const ownedVariantsPerCard = new Map<string, string[]>();

    // Count available variants per card (from card data)
    cards.forEach((card) => {
      // Cards may have availableVariants from the cache, or default to 1 (normal only)
      const cardWithVariants = card as PokemonCard & { availableVariants?: string[] };
      const variantCount = cardWithVariants.availableVariants?.length || 1;
      availableVariantsPerCard.set(card.id, variantCount);
    });

    // Count owned variants per card (from collection)
    if (collection) {
      collection.forEach((item) => {
        const variant = (item as { cardId: string; variant?: string }).variant || 'normal';
        const existing = ownedVariantsPerCard.get(item.cardId) || [];
        if (!existing.includes(variant)) {
          existing.push(variant);
          ownedVariantsPerCard.set(item.cardId, existing);
        }
      });
    }

    return {
      totalUniqueCards: cards.length,
      availableVariantsPerCard,
      ownedVariantsPerCard,
    };
  }, [cards, collection]);

  // Calculate completion progress based on mode
  const completionProgress = useMemo(() => {
    const ownedUniqueCards = cards.filter((card) => ownedCardIds.has(card.id)).length;
    return getSetCompletionProgressWithMode(
      completionMode,
      ownedUniqueCards,
      cards.length,
      variantData
    );
  }, [completionMode, cards, ownedCardIds, variantData]);

  // Filter and sort cards
  const filteredAndSortedCards = useMemo(() => {
    // First apply collection filter (Have/Need/All)
    let result = cards;
    if (collectionFilter === 'have') {
      result = cards.filter((card) => ownedCardIds.has(card.id));
    } else if (collectionFilter === 'need') {
      result = cards.filter((card) => !ownedCardIds.has(card.id));
    }

    // Then filter by rarity
    if (selectedRarity) {
      result = result.filter((card) => {
        const category = getRarityCategory(card.rarity);
        return category === selectedRarity;
      });
    }

    // Then filter by card type
    if (selectedType) {
      result = result.filter((card) => {
        const category = getCardTypeCategory(card.supertype, gameSlug);
        return category === selectedType;
      });
    }

    // Then sort
    const sorted = [...result];

    switch (sortBy) {
      case 'number':
        sorted.sort((a, b) => parseCardNumber(a.number) - parseCardNumber(b.number));
        break;

      case 'type':
        sorted.sort((a, b) => {
          const typeA = TYPE_SORT_ORDER[a.supertype] ?? 99;
          const typeB = TYPE_SORT_ORDER[b.supertype] ?? 99;
          if (typeA !== typeB) return typeA - typeB;
          // Secondary sort by card number within type
          return parseCardNumber(a.number) - parseCardNumber(b.number);
        });
        break;

      case 'owned':
        sorted.sort((a, b) => {
          const aOwned = ownedCardIds.has(a.id) ? 0 : 1;
          const bOwned = ownedCardIds.has(b.id) ? 0 : 1;
          if (aOwned !== bOwned) return aOwned - bOwned;
          // Secondary sort by card number
          return parseCardNumber(a.number) - parseCardNumber(b.number);
        });
        break;

      case 'wanted':
        // Wanted = on wishlist but not owned
        sorted.sort((a, b) => {
          const aWanted = wishlistCardIds.has(a.id) && !ownedCardIds.has(a.id) ? 0 : 1;
          const bWanted = wishlistCardIds.has(b.id) && !ownedCardIds.has(b.id) ? 0 : 1;
          if (aWanted !== bWanted) return aWanted - bWanted;
          // Secondary: wishlisted (even if owned) comes next
          const aWishlisted = wishlistCardIds.has(a.id) ? 0 : 1;
          const bWishlisted = wishlistCardIds.has(b.id) ? 0 : 1;
          if (aWishlisted !== bWishlisted) return aWishlisted - bWishlisted;
          return parseCardNumber(a.number) - parseCardNumber(b.number);
        });
        break;

      case 'recentlyAdded':
        sorted.sort((a, b) => {
          const aTime = recentlyAddedTimes.get(a.id) ?? 0;
          const bTime = recentlyAddedTimes.get(b.id) ?? 0;
          // More recent first (higher timestamp)
          if (aTime !== bTime) return bTime - aTime;
          // Non-recent cards sorted by card number
          return parseCardNumber(a.number) - parseCardNumber(b.number);
        });
        break;

      case 'price':
        sorted.sort((a, b) => {
          const priceA = getCardMarketPrice(a);
          const priceB = getCardMarketPrice(b);
          // Cards with price come first, sorted high to low
          if (priceA === null && priceB === null) {
            return parseCardNumber(a.number) - parseCardNumber(b.number);
          }
          if (priceA === null) return 1;
          if (priceB === null) return -1;
          return priceB - priceA;
        });
        break;
    }

    return sorted;
  }, [cards, collectionFilter, selectedRarity, selectedType, sortBy, ownedCardIds, wishlistCardIds, recentlyAddedTimes, gameSlug]);

  return (
    <div className="space-y-6">
      {/* Filter and Sort Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-4">
        {/* Top row on mobile: Show cards + Sort by */}
        <div className="flex items-end justify-between gap-2 sm:contents">
          {/* Collection Filter Toggle (Have/Need/All) */}
          <div className="flex-shrink-0">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Show cards
            </label>
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
              {(['all', 'have', 'need'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setCollectionFilter(filter)}
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded-md transition-all sm:px-3 sm:py-1.5 sm:text-sm',
                    collectionFilter === filter
                      ? 'bg-kid-primary text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  {filter === 'all' && `All (${collectionCounts.all})`}
                  {filter === 'have' && `Have (${collectionCounts.have})`}
                  {filter === 'need' && `Need (${collectionCounts.need})`}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="flex-shrink-0">
            <label htmlFor="sort-select" className="mb-1 block text-xs font-medium text-gray-500">
              Sort by
            </label>
            <div className="relative">
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={cn(
                  'appearance-none rounded-lg border border-gray-200 bg-white py-1 pl-2 pr-7 text-xs font-medium text-gray-700 shadow-sm transition sm:py-2 sm:pl-3 sm:pr-10 sm:text-sm',
                  'hover:border-gray-300 focus:border-kid-primary focus:outline-none focus:ring-2 focus:ring-kid-primary/20'
                )}
              >
                {availableSortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400 sm:right-3 sm:h-4 sm:w-4" />
            </div>
          </div>
        </div>

        {/* Rarity Filter - full width on mobile, flex-1 on desktop */}
        <div className="w-full min-w-0 sm:flex-1">
          <RarityFilter
            selectedRarity={selectedRarity}
            onRarityChange={setSelectedRarity}
            rarityCounts={rarityCounts}
          />
        </div>

        {/* Card Type Filter - full width on mobile, flex-1 on desktop */}
        <div className="w-full min-w-0 sm:flex-1">
          <CardTypeFilter
            gameId={gameSlug}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            typeCounts={typeCounts}
          />
        </div>
      </div>

      {/* Set Completion Progress */}
      <div className="rounded-xl bg-white p-4 shadow-md dark:bg-slate-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                {completionMode === 'variants' ? 'Master Set Progress' : 'Set Progress'}
              </span>
              <span className="text-sm font-bold text-kid-primary">
                {completionProgress.percentComplete}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  completionProgress.isComplete
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400'
                    : 'bg-gradient-to-r from-kid-primary to-kid-secondary'
                )}
                style={{ width: `${completionProgress.percentComplete}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              {completionProgress.isComplete
                ? completionMode === 'variants'
                  ? 'Master set complete! You have every variant!'
                  : 'Set complete! You have every card!'
                : `${completionProgress.cardsNeeded} ${completionMode === 'variants' ? 'variants' : 'cards'} needed`}
            </p>
          </div>
          {/* Completion Mode Toggle */}
          <button
            onClick={handleToggleCompletionMode}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all',
              completionMode === 'variants'
                ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 hover:from-amber-100 hover:to-yellow-100'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
            )}
            title={
              completionMode === 'variants'
                ? 'Currently counting all variants (Master Set mode). Click to switch to unique cards only.'
                : 'Currently counting unique cards only. Click to switch to Master Set mode (all variants).'
            }
          >
            <SparklesIcon
              className={cn(
                'h-4 w-4',
                completionMode === 'variants' ? 'text-amber-500' : 'text-gray-400'
              )}
            />
            <span className="hidden sm:inline">
              {completionMode === 'variants' ? 'Master Set' : 'Unique Cards'}
            </span>
          </button>
        </div>
      </div>

      {/* Filtered Card Count Indicator */}
      {(selectedRarity || selectedType || collectionFilter !== 'all') && (
        <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-kid-primary">{filteredAndSortedCards.length}</span>{' '}
            of <span className="font-semibold">{cards.length}</span> cards
            {collectionFilter !== 'all' && (
              <>
                {' '}
                ({collectionFilter === 'have' ? 'owned' : 'needed'})
              </>
            )}
            {selectedType && (
              <>
                {' '}
                &middot;{' '}
                <span className="font-semibold">
                  {getCardTypesForGame(gameSlug).find((c) => c.id === selectedType)?.label}
                </span>
              </>
            )}
            {selectedRarity && (
              <>
                {' '}
                &middot;{' '}
                <span className="font-semibold">
                  {RARITY_CATEGORIES.find((c) => c.id === selectedRarity)?.label}
                </span>
              </>
            )}
          </p>
        </div>
      )}

      {/* Card Grid with Virtual Scrolling */}
      <VirtualCardGrid cards={filteredAndSortedCards} setId={set.id} setName={set.name} />
    </div>
  );
}
