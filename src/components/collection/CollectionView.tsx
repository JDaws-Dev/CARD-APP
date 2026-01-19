'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import { CardImage } from '@/components/ui/CardImage';
import type { PokemonCard } from '@/lib/pokemon-tcg';
import type { Id } from '../../../convex/_generated/dataModel';
import { CollectionGroupSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { ErrorFallback } from '@/components/ui/ErrorBoundary';
import {
  CurrencyDollarIcon,
  SparklesIcon,
  ArrowRightIcon,
  MagnifyingGlassPlusIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
} from '@heroicons/react/24/solid';
import { DigitalBinder, DigitalBinderButton } from '@/components/virtual/DigitalBinder';
import { CardDetailModal } from './CardDetailModal';
import { VariantFilter, VARIANT_CATEGORIES, type VariantCategoryId } from '@/components/filter/VariantFilter';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useHidePrices } from '@/hooks/useHidePrices';
import { getCardPurchaseUrlWithAffiliate } from '@/lib/affiliateLinks';
import { useCollectionToast } from '@/components/providers/CollectionToastProvider';

// Sort options for the collection
type SortOption = 'set' | 'dateAdded' | 'value';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'set', label: 'By Set' },
  { value: 'dateAdded', label: 'Recently Added' },
  { value: 'value', label: 'By Value' },
];

// Grid size options for the collection
type GridSize = 'compact' | 'expanded';

const GRID_SIZE_CONFIG: Record<GridSize, { label: string; gridClasses: string; gap: string }> = {
  compact: {
    label: 'Compact',
    gridClasses: 'grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10',
    gap: 'gap-2',
  },
  expanded: {
    label: 'Expanded',
    gridClasses: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
    gap: 'gap-4',
  },
};

// Variant types and display configuration
type CardVariant =
  | 'normal'
  | 'holofoil'
  | 'reverseHolofoil'
  | '1stEditionHolofoil'
  | '1stEditionNormal';

const VARIANT_CONFIG: Record<
  CardVariant,
  {
    label: string;
    shortLabel: string;
    gradient: string;
  }
> = {
  normal: {
    label: 'Normal',
    shortLabel: 'N',
    gradient: 'from-gray-400 to-gray-500',
  },
  holofoil: {
    label: 'Holofoil',
    shortLabel: 'H',
    gradient: 'from-purple-400 to-indigo-500',
  },
  reverseHolofoil: {
    label: 'Reverse Holo',
    shortLabel: 'R',
    gradient: 'from-cyan-400 to-blue-500',
  },
  '1stEditionHolofoil': {
    label: '1st Ed. Holo',
    shortLabel: '1H',
    gradient: 'from-amber-400 to-yellow-500',
  },
  '1stEditionNormal': {
    label: '1st Edition',
    shortLabel: '1N',
    gradient: 'from-amber-400 to-orange-500',
  },
};

// Helper function to get the best market price from a card's TCGPlayer prices
function getCardMarketPrice(card: PokemonCard): number | null {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;

  // Return the first available market price, preferring normal > holofoil > reverseHolofoil
  const marketPrice =
    prices.normal?.market ?? prices.holofoil?.market ?? prices.reverseHolofoil?.market ?? null;

  return marketPrice;
}

// Format price as currency string
function formatPrice(price: number): string {
  if (price < 10) {
    return `$${price.toFixed(2)}`;
  } else if (price < 100) {
    return `$${price.toFixed(2)}`;
  } else {
    return `$${price.toFixed(0)}`;
  }
}

interface CollectionCard {
  _id: string;
  cardId: string;
  quantity: number;
  variant?: string;
  _creationTime?: number; // Convex creation timestamp for date sorting
}

interface CollectionViewProps {
  collection: CollectionCard[];
}

interface CardWithQuantity extends PokemonCard {
  quantity: number;
  collectionId: string; // Unique ID from the collection entry
  ownedVariants?: Record<string, number>; // variant -> quantity
  addedAt?: number; // Earliest creation time for this card (for date sorting)
}

interface SetGroup {
  setId: string;
  setName: string;
  cards: CardWithQuantity[];
}

export function CollectionView({ collection }: CollectionViewProps) {
  const [fetchedCards, setFetchedCards] = useState<PokemonCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isBinderOpen, setIsBinderOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardWithQuantity | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<VariantCategoryId | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('set');
  const [gridSize, setGridSize] = useState<GridSize>('compact');

  // Get current profile for mutations
  const { profileId } = useCurrentProfile();
  const { primaryGame } = useGameSelector();
  const { hidePrices } = useHidePrices();
  const { showCollectionToast } = useCollectionToast();

  // Filter out value sort option when hidePrices is enabled
  const availableSortOptions = useMemo(() => {
    if (hidePrices) {
      return SORT_OPTIONS.filter((option) => option.value !== 'value');
    }
    return SORT_OPTIONS;
  }, [hidePrices]);

  // Reset sort to 'set' if current sort is 'value' and prices are hidden
  useEffect(() => {
    if (hidePrices && sortBy === 'value') {
      setSortBy('set');
    }
  }, [hidePrices, sortBy]);

  // Mutations for quick actions
  const removeCardMutation = useMutation(api.collections.removeCard);
  const addToWishlistMutation = useMutation(api.wishlist.addToWishlist);
  const updateQuantityMutation = useMutation(api.collections.updateQuantity);
  const addCardMutation = useMutation(api.collections.addCard);

  // Check if selected card is on wishlist
  const wishlistStatus = useQuery(
    api.wishlist.isOnWishlist,
    selectedCard && profileId
      ? { profileId: profileId as Id<'profiles'>, cardId: selectedCard.id }
      : 'skip'
  );

  // Memoize cardData Map to prevent recreation on every render
  // Only rebuilds when fetchedCards array reference changes
  const cardData = useMemo(() => {
    const cardMap = new Map<string, PokemonCard>();
    fetchedCards.forEach((card) => cardMap.set(card.id, card));
    return cardMap;
  }, [fetchedCards]);

  // Fetch card data from Pokemon TCG API
  const fetchCards = useCallback(async () => {
    if (collection.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const cardIds = collection.map((c) => c.cardId);

      // Fetch cards from API
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch card data');
      }

      const json = await response.json();
      const cards: PokemonCard[] = json.data || [];

      // Store raw cards array - the Map is derived via useMemo
      setFetchedCards(cards);
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError("We couldn't load your card images. This might be a network issue.");
    } finally {
      setIsLoading(false);
    }
  }, [collection]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards, retryCount]);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  // Group cards by set - memoized to cache expensive grouping computation
  // First aggregate variants by cardId, then group by set
  const setGroups = useMemo(() => {
    const groups: SetGroup[] = [];
    const setMap = new Map<string, SetGroup>();

    // First pass: aggregate quantities and variants by cardId
    // Track the most recent creation time for date sorting
    const cardAggregates = new Map<
      string,
      { totalQuantity: number; variants: Record<string, number>; firstId: string; latestAddedAt: number }
    >();

    collection.forEach((item) => {
      const existing = cardAggregates.get(item.cardId);
      const variant = item.variant ?? 'normal';
      const creationTime = item._creationTime ?? 0;

      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.variants[variant] = (existing.variants[variant] ?? 0) + item.quantity;
        // Track the most recent addition time
        if (creationTime > existing.latestAddedAt) {
          existing.latestAddedAt = creationTime;
        }
      } else {
        cardAggregates.set(item.cardId, {
          totalQuantity: item.quantity,
          variants: { [variant]: item.quantity },
          firstId: item._id,
          latestAddedAt: creationTime,
        });
      }
    });

    // Second pass: create cards with aggregated data and group by set
    cardAggregates.forEach((aggregate, cardId) => {
      const card = cardData.get(cardId);
      if (card) {
        const setId = card.set.id;
        const setName = card.set.name;

        if (!setMap.has(setId)) {
          setMap.set(setId, {
            setId,
            setName,
            cards: [],
          });
        }

        setMap.get(setId)!.cards.push({
          ...card,
          quantity: aggregate.totalQuantity,
          collectionId: aggregate.firstId,
          ownedVariants: aggregate.variants,
          addedAt: aggregate.latestAddedAt,
        });
      }
    });

    // Convert map to array and sort by set name
    setMap.forEach((group) => {
      // Sort cards within set by number
      group.cards.sort((a, b) => {
        const numA = parseInt(a.number) || 0;
        const numB = parseInt(b.number) || 0;
        return numA - numB;
      });
      groups.push(group);
    });

    // Sort sets alphabetically
    groups.sort((a, b) => a.setName.localeCompare(b.setName));

    return groups;
  }, [collection, cardData]);

  // Calculate variant counts for the filter
  const variantCounts = useMemo(() => {
    const counts = new Map<VariantCategoryId, number>();

    // Initialize counts for all variants
    VARIANT_CATEGORIES.forEach(category => {
      counts.set(category.id, 0);
    });

    // Count unique cards per variant (not quantities)
    // A card with multiple of the same variant still counts as 1 for filter purposes
    const cardVariantSet = new Set<string>();

    collection.forEach((item) => {
      const variant = (item.variant ?? 'normal') as VariantCategoryId;
      const key = `${item.cardId}-${variant}`;

      // Only count each card-variant combination once
      if (!cardVariantSet.has(key) && counts.has(variant)) {
        cardVariantSet.add(key);
        counts.set(variant, (counts.get(variant) ?? 0) + 1);
      }
    });

    return counts;
  }, [collection]);

  // Filter and sort setGroups based on selected variant and sort option
  const filteredSetGroups = useMemo(() => {
    let groups = setGroups;

    // Apply variant filter if selected
    if (selectedVariant) {
      groups = groups
        .map(group => ({
          ...group,
          cards: group.cards.filter(card =>
            card.ownedVariants && card.ownedVariants[selectedVariant] !== undefined
          ),
        }))
        .filter(group => group.cards.length > 0);
    }

    // Apply sorting
    if (sortBy === 'dateAdded') {
      // For date-based sorting, flatten all cards into a single "Recently Added" group
      const allCards: CardWithQuantity[] = [];
      groups.forEach(group => {
        allCards.push(...group.cards);
      });

      // Sort by date added (newest first)
      allCards.sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0));

      // Return as a single group
      return [{
        setId: 'recently-added',
        setName: 'Recently Added',
        cards: allCards,
      }];
    }

    if (sortBy === 'value') {
      // For value-based sorting, flatten all cards into a single "By Value" group
      const allCards: CardWithQuantity[] = [];
      groups.forEach(group => {
        allCards.push(...group.cards);
      });

      // Sort by market price (highest first), cards without price go to the end
      allCards.sort((a, b) => {
        const priceA = getCardMarketPrice(a);
        const priceB = getCardMarketPrice(b);

        // Cards without price go to the end
        if (priceA === null && priceB === null) return 0;
        if (priceA === null) return 1;
        if (priceB === null) return -1;

        return priceB - priceA;
      });

      // Return as a single group
      return [{
        setId: 'by-value',
        setName: 'By Value',
        cards: allCards,
      }];
    }

    return groups;
  }, [setGroups, selectedVariant, sortBy]);

  // Calculate total collection value
  const collectionValue = useMemo(() => {
    let total = 0;
    let cardsWithPrice = 0;
    let cardsWithoutPrice = 0;

    collection.forEach((item) => {
      const card = cardData.get(item.cardId);
      if (card) {
        const price = getCardMarketPrice(card);
        if (price !== null) {
          total += price * item.quantity;
          cardsWithPrice++;
        } else {
          cardsWithoutPrice++;
        }
      }
    });

    return { total, cardsWithPrice, cardsWithoutPrice };
  }, [collection, cardData]);


  // All cards for binder view - aggregated by cardId with variant info
  const allCardsForBinder = useMemo(() => {
    // First aggregate variants by cardId
    const cardAggregates = new Map<
      string,
      { totalQuantity: number; variants: Record<string, number>; firstId: string }
    >();

    collection.forEach((item) => {
      const existing = cardAggregates.get(item.cardId);
      const variant = item.variant ?? 'normal';

      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.variants[variant] = (existing.variants[variant] ?? 0) + item.quantity;
      } else {
        cardAggregates.set(item.cardId, {
          totalQuantity: item.quantity,
          variants: { [variant]: item.quantity },
          firstId: item._id,
        });
      }
    });

    // Build card array with aggregated data
    const cards: CardWithQuantity[] = [];
    cardAggregates.forEach((aggregate, cardId) => {
      const card = cardData.get(cardId);
      if (card) {
        cards.push({
          ...card,
          quantity: aggregate.totalQuantity,
          collectionId: aggregate.firstId,
          ownedVariants: aggregate.variants,
        });
      }
    });
    return cards;
  }, [collection, cardData]);

  // Handle card click to open detail modal
  const handleCardClick = useCallback((card: CardWithQuantity) => {
    setSelectedCard(card);
    setIsDetailModalOpen(true);
  }, []);

  // Navigate to previous/next card in the collection
  const handlePreviousCard = useCallback(() => {
    if (!selectedCard || allCardsForBinder.length === 0) return;
    const currentIndex = allCardsForBinder.findIndex(
      (c) => c.collectionId === selectedCard.collectionId
    );
    if (currentIndex > 0) {
      setSelectedCard(allCardsForBinder[currentIndex - 1]);
    }
  }, [selectedCard, allCardsForBinder]);

  const handleNextCard = useCallback(() => {
    if (!selectedCard || allCardsForBinder.length === 0) return;
    const currentIndex = allCardsForBinder.findIndex(
      (c) => c.collectionId === selectedCard.collectionId
    );
    if (currentIndex < allCardsForBinder.length - 1) {
      setSelectedCard(allCardsForBinder[currentIndex + 1]);
    }
  }, [selectedCard, allCardsForBinder]);

  // Check if there are previous/next cards
  const selectedCardIndex = selectedCard
    ? allCardsForBinder.findIndex((c) => c.collectionId === selectedCard.collectionId)
    : -1;
  const hasPreviousCard = selectedCardIndex > 0;
  const hasNextCard = selectedCardIndex >= 0 && selectedCardIndex < allCardsForBinder.length - 1;

  // Quick action handlers
  const handleRemoveCard = useCallback(
    async (cardId: string) => {
      if (!profileId || !selectedCard) return;
      setIsRemoving(true);
      try {
        await removeCardMutation({
          profileId: profileId as Id<'profiles'>,
          cardId,
          cardName: selectedCard.name,
          setName: selectedCard.set.name,
        });
        // Close modal after successful removal
        setIsDetailModalOpen(false);
        setSelectedCard(null);
      } finally {
        setIsRemoving(false);
      }
    },
    [profileId, selectedCard, removeCardMutation]
  );

  const handleAddToWishlist = useCallback(
    async (cardId: string) => {
      if (!profileId) return;
      setIsAddingToWishlist(true);
      try {
        await addToWishlistMutation({
          profileId: profileId as Id<'profiles'>,
          cardId,
          gameSlug: primaryGame.id as 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana',
        });
      } finally {
        setIsAddingToWishlist(false);
      }
    },
    [profileId, addToWishlistMutation, primaryGame.id]
  );

  const handleEditQuantity = useCallback(
    async (cardId: string, newQuantity: number) => {
      if (!profileId || !selectedCard) return;
      try {
        await updateQuantityMutation({
          profileId: profileId as Id<'profiles'>,
          cardId,
          quantity: newQuantity,
        });
        // Update local state immediately for responsiveness
        setSelectedCard((prev) => (prev ? { ...prev, quantity: newQuantity } : null));
      } catch (err) {
        console.error('Failed to update quantity:', err);
      }
    },
    [profileId, selectedCard, updateQuantityMutation]
  );

  // Variant-specific add handler
  const handleAddVariant = useCallback(
    async (cardId: string, variant: string) => {
      if (!profileId || !selectedCard) return;
      try {
        await addCardMutation({
          profileId: profileId as Id<'profiles'>,
          cardId,
          cardName: selectedCard.name,
          setName: selectedCard.set.name,
          variant,
          quantity: 1,
        });
        // Show success toast with card name
        showCollectionToast(selectedCard.name, 1);
        // Update local state immediately
        setSelectedCard((prev) => {
          if (!prev) return null;
          const ownedVariants = { ...prev.ownedVariants };
          ownedVariants[variant] = (ownedVariants[variant] ?? 0) + 1;
          const newQuantity = Object.values(ownedVariants).reduce((sum, qty) => sum + qty, 0);
          return { ...prev, ownedVariants, quantity: newQuantity };
        });
      } catch (err) {
        console.error('Failed to add variant:', err);
      }
    },
    [profileId, selectedCard, addCardMutation, showCollectionToast]
  );

  // Variant-specific remove handler
  const handleRemoveVariant = useCallback(
    async (cardId: string, variant: string) => {
      if (!profileId || !selectedCard) return;
      try {
        await removeCardMutation({
          profileId: profileId as Id<'profiles'>,
          cardId,
          cardName: selectedCard.name,
          setName: selectedCard.set.name,
          variant,
        });
        // Update local state immediately
        setSelectedCard((prev) => {
          if (!prev) return null;
          const ownedVariants = { ...prev.ownedVariants };
          if (ownedVariants[variant] && ownedVariants[variant] > 0) {
            ownedVariants[variant] = ownedVariants[variant] - 1;
            if (ownedVariants[variant] === 0) {
              delete ownedVariants[variant];
            }
          }
          const newQuantity = Object.values(ownedVariants).reduce((sum, qty) => sum + qty, 0);
          return { ...prev, ownedVariants, quantity: newQuantity };
        });
      } catch (err) {
        console.error('Failed to remove variant:', err);
      }
    },
    [profileId, selectedCard, removeCardMutation]
  );

  if (isLoading) {
    // Show skeleton for estimated number of groups based on collection size
    const estimatedGroups = Math.min(Math.ceil(collection.length / 5), 3);
    return (
      <div className="space-y-6">
        {/* Value Banner Skeleton */}
        <div className="rounded-2xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div>
                <Skeleton className="mb-2 h-4 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>
        </div>

        {Array.from({ length: Math.max(estimatedGroups, 1) }).map((_, i) => (
          <CollectionGroupSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorFallback title="Couldn't load cards" message={error} onReset={handleRetry} />;
  }

  return (
    <div className="space-y-6">
      {/* Action buttons - Binder View (hidden on mobile) */}
      {cardData.size > 0 && (
        <div className="hidden flex-wrap items-center justify-end gap-3 md:flex">
          <DigitalBinderButton onClick={() => setIsBinderOpen(true)} />
        </div>
      )}

      {/* Digital Binder Modal */}
      <DigitalBinder
        cards={allCardsForBinder}
        isOpen={isBinderOpen}
        onClose={() => setIsBinderOpen(false)}
      />

      {/* Collection Controls - Sort, View, Filter */}
      {cardData.size > 0 && (
        <div className="rounded-xl bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            {/* Primary controls: Sort and Grid Size */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Sort Dropdown - most important, placed first */}
              <div className="relative flex-shrink-0">
                <label htmlFor="sort-select" className="sr-only">Sort by</label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2 pl-3 pr-9 text-sm font-medium text-gray-700 transition hover:border-kid-primary hover:bg-white focus:border-kid-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-kid-primary/20"
                >
                  {availableSortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Grid Size Toggle */}
              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setGridSize('compact')}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition ${
                    gridSize === 'compact'
                      ? 'bg-kid-primary text-white shadow-sm'
                      : 'text-gray-600 hover:bg-white'
                  }`}
                  aria-label="Compact view"
                  aria-pressed={gridSize === 'compact'}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">Compact</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGridSize('expanded')}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition ${
                    gridSize === 'expanded'
                      ? 'bg-kid-primary text-white shadow-sm'
                      : 'text-gray-600 hover:bg-white'
                  }`}
                  aria-label="Expanded view"
                  aria-pressed={gridSize === 'expanded'}
                >
                  <ViewColumnsIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Expanded</span>
                </button>
              </div>
            </div>

            {/* Variant Filter - secondary control */}
            <VariantFilter
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant}
              variantCounts={variantCounts}
            />
          </div>
        </div>
      )}

      {/* Collection Value Banner - hidden when hidePrices is enabled */}
      {collectionValue.total > 0 && !hidePrices && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white shadow-lg">
          {/* Decorative background elements */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/10" />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 shadow-inner">
                <CurrencyDollarIcon className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">Your collection is worth</p>
                <p className="text-3xl font-bold tracking-tight">
                  {formatPrice(collectionValue.total)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2">
              <SparklesIcon className="h-5 w-5" />
              <span className="text-sm font-medium">
                {collectionValue.cardsWithPrice} cards priced
              </span>
            </div>
          </div>

          {collectionValue.cardsWithoutPrice > 0 && (
            <p className="relative mt-3 text-xs text-white/70">
              {collectionValue.cardsWithoutPrice} card
              {collectionValue.cardsWithoutPrice !== 1 ? 's' : ''} without price data
            </p>
          )}
        </div>
      )}

      {filteredSetGroups.map((group) => (
        <div key={group.setId} className="rounded-xl bg-white p-6 shadow-sm">
          {/* Set Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              {group.setId === 'recently-added' ? (
                <h2 className="text-xl font-bold text-gray-800">
                  {group.setName}
                </h2>
              ) : (
                <Link
                  href={`/sets/${group.setId}`}
                  className="text-xl font-bold text-gray-800 hover:text-kid-primary"
                >
                  {group.setName}
                </Link>
              )}
              <p className="text-sm text-gray-500">
                {group.cards.length} unique card{group.cards.length !== 1 ? 's' : ''} (
                {group.cards.reduce((sum, c) => sum + c.quantity, 0)} total)
              </p>
            </div>
            {group.setId !== 'recently-added' && (
              <Link
                href={`/sets/${group.setId}`}
                className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200"
              >
                View Set
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* Cards Grid */}
          <div className={`grid ${GRID_SIZE_CONFIG[gridSize].gridClasses} ${GRID_SIZE_CONFIG[gridSize].gap}`}>
            {group.cards.map((card) => (
              <button
                key={card.collectionId}
                type="button"
                onClick={() => handleCardClick(card)}
                className="group relative rounded-lg bg-gray-50 p-1.5 text-left transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-kid-primary focus:ring-offset-2"
                aria-label={`View ${card.name} details`}
              >
                {/* Card Image */}
                <div className="relative aspect-[2.5/3.5] overflow-hidden rounded">
                  <CardImage
                    src={card.images.small}
                    alt={card.name}
                    fill
                    loading="lazy"
                    sizes="(max-width: 640px) 33vw, (max-width: 1024px) 16vw, 12vw"
                  />

                  {/* Quantity Badge */}
                  {card.quantity > 1 && (
                    <div className="absolute left-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-kid-primary px-1 text-xs font-bold text-white shadow">
                      x{card.quantity}
                    </div>
                  )}

                  {/* Magnifying glass overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                    <MagnifyingGlassPlusIcon className="h-8 w-8 text-white drop-shadow-lg" />
                  </div>
                </div>

                {/* Card Name */}
                <p className="mt-1 truncate text-center text-xs font-medium text-gray-700">
                  {card.name}
                </p>

                {/* Variant Badges */}
                {card.ownedVariants && Object.keys(card.ownedVariants).length > 0 && (
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-0.5">
                    {Object.entries(card.ownedVariants).map(([variant, qty]) => {
                      const config = VARIANT_CONFIG[variant as CardVariant];
                      if (!config) return null;
                      return (
                        <span
                          key={variant}
                          className={`inline-flex items-center gap-0.5 rounded-full px-1 py-0.5 text-[10px] font-medium text-white bg-gradient-to-r ${config.gradient}`}
                          title={`${config.label} x${qty}`}
                        >
                          {config.shortLabel}
                          {qty > 1 && <span className="text-white/80">x{qty}</span>}
                        </span>
                      );
                    })}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onPrevious={handlePreviousCard}
        onNext={handleNextCard}
        hasPrevious={hasPreviousCard}
        hasNext={hasNextCard}
        onRemoveCard={handleRemoveCard}
        onAddToWishlist={handleAddToWishlist}
        onEditQuantity={handleEditQuantity}
        onAddVariant={handleAddVariant}
        onRemoveVariant={handleRemoveVariant}
        isOnWishlist={wishlistStatus?.onWishlist ?? false}
        isRemoving={isRemoving}
        isAddingToWishlist={isAddingToWishlist}
        buyUrl={selectedCard ? getCardPurchaseUrlWithAffiliate(
          { name: selectedCard.name, tcgplayer: selectedCard.tcgplayer, set: selectedCard.set },
          primaryGame.id
        ).affiliateUrl : null}
      />
    </div>
  );
}
