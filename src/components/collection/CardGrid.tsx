'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { cn } from '@/lib/utils';
import type { PokemonCard } from '@/lib/pokemon-tcg';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  HeartIcon,
  StarIcon as StarIconOutline,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  TrophyIcon,
  StarIcon as StarIconSolid,
  CurrencyDollarIcon,
  SparklesIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import { MapIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { CardGridSkeleton, StatsBarSkeleton } from '@/components/ui/Skeleton';

// Variant type definition
type CardVariant =
  | 'normal'
  | 'holofoil'
  | 'reverseHolofoil'
  | '1stEditionHolofoil'
  | '1stEditionNormal';

// Variant display configuration
const VARIANT_CONFIG: Record<
  CardVariant,
  {
    label: string;
    shortLabel: string;
    gradient: string;
    icon?: React.ComponentType<{ className?: string }>;
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
    icon: SparklesIcon,
  },
  reverseHolofoil: {
    label: 'Reverse Holo',
    shortLabel: 'R',
    gradient: 'from-cyan-400 to-blue-500',
    icon: SparklesIcon,
  },
  '1stEditionHolofoil': {
    label: '1st Ed. Holo',
    shortLabel: '1H',
    gradient: 'from-amber-400 to-yellow-500',
    icon: SparklesIcon,
  },
  '1stEditionNormal': {
    label: '1st Edition',
    shortLabel: '1N',
    gradient: 'from-amber-400 to-orange-500',
  },
};

// Get available variants from a card's tcgplayer prices
function getAvailableVariants(card: PokemonCard): CardVariant[] {
  const prices = card.tcgplayer?.prices;
  if (!prices) return ['normal']; // Default to normal if no price data

  const variants: CardVariant[] = [];
  if (prices.normal) variants.push('normal');
  if (prices.holofoil) variants.push('holofoil');
  if (prices.reverseHolofoil) variants.push('reverseHolofoil');

  // If no variants found, default to normal
  return variants.length > 0 ? variants : ['normal'];
}

// Get price for a specific variant
function getVariantPrice(card: PokemonCard, variant: CardVariant): number | null {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;

  switch (variant) {
    case 'normal':
      return prices.normal?.market ?? null;
    case 'holofoil':
      return prices.holofoil?.market ?? null;
    case 'reverseHolofoil':
      return prices.reverseHolofoil?.market ?? null;
    default:
      return null;
  }
}

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
    return `$${price.toFixed(1)}`;
  } else {
    return `$${Math.round(price)}`;
  }
}

// Custom card icon for loading state
function CardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="44" height="60" rx="4" className="fill-current" />
      <rect x="8" y="10" width="32" height="6" rx="2" className="fill-white/40" />
      <rect x="8" y="20" width="24" height="4" rx="1" className="fill-white/30" />
      <circle cx="24" cy="40" r="10" className="fill-white/20" />
    </svg>
  );
}

// Crown icon for Set Champion
function CrownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M2.5 19h19v3h-19v-3zM22.07 7.63l-3.07 7.37h-14l-3.07-7.37 4.07 2.37 6-6 6 6 4.07-2.37z" />
    </svg>
  );
}

// Variant selector popup component
interface VariantSelectorProps {
  card: PokemonCard;
  ownedVariants: Map<CardVariant, number>;
  setName?: string;
  onAddVariant: (cardId: string, cardName: string, variant: CardVariant) => Promise<void>;
  onRemoveVariant: (cardId: string, cardName: string, variant: CardVariant) => Promise<void>;
  onClose: () => void;
  position: { top: number; left: number };
}

function VariantSelector({
  card,
  ownedVariants,
  setName,
  onAddVariant,
  onRemoveVariant,
  onClose,
  position,
}: VariantSelectorProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const availableVariants = getAvailableVariants(card);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const totalOwned = Array.from(ownedVariants.values()).reduce((sum, qty) => sum + qty, 0);

  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-64 rounded-xl bg-white p-3 shadow-2xl ring-1 ring-black/5"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, 8px)',
      }}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-gray-800">{card.name}</h4>
          <p className="text-xs text-gray-500">
            #{card.number} {setName && `· ${setName}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Total owned indicator */}
      {totalOwned > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-kid-success/10 px-3 py-2">
          <CheckCircleIcon className="h-4 w-4 text-kid-success" />
          <span className="text-xs font-medium text-kid-success">{totalOwned} total owned</span>
        </div>
      )}

      {/* Variant list */}
      <div className="space-y-2">
        {availableVariants.map((variant) => {
          const config = VARIANT_CONFIG[variant];
          const quantity = ownedVariants.get(variant) ?? 0;
          const price = getVariantPrice(card, variant);
          const Icon = config.icon;

          return (
            <div
              key={variant}
              className={cn(
                'flex items-center justify-between rounded-lg border-2 p-2 transition-colors',
                quantity > 0 ? 'border-kid-success bg-kid-success/5' : 'border-gray-100 bg-gray-50'
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-white',
                    `${config.gradient}`
                  )}
                >
                  {Icon ? (
                    <Icon className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-bold">{config.shortLabel}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">{config.label}</p>
                  {price !== null && <p className="text-xs text-gray-500">${price.toFixed(2)}</p>}
                </div>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onRemoveVariant(card.id, card.name, variant)}
                  disabled={quantity === 0}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                    quantity > 0
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'cursor-not-allowed bg-gray-50 text-gray-300'
                  )}
                  aria-label={`Remove ${config.label}`}
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="min-w-[1.5rem] text-center text-sm font-semibold text-gray-800">
                  {quantity}
                </span>
                <button
                  onClick={() => onAddVariant(card.id, card.name, variant)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-kid-primary text-white transition-colors hover:bg-kid-primary/90"
                  aria-label={`Add ${config.label}`}
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Only 1 variant message */}
      {availableVariants.length === 1 && (
        <p className="mt-2 text-center text-xs text-gray-400">
          Only one variant available for this card
        </p>
      )}
    </div>
  );
}

interface CardGridProps {
  cards: PokemonCard[];
  setId: string;
  setName?: string;
}

export function CardGrid({ cards, setId, setName }: CardGridProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  // State for variant selector popup
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [selectorPosition, setSelectorPosition] = useState<{ top: number; left: number } | null>(
    null
  );

  // Convex queries and mutations
  const collection = useQuery(
    api.collections.getCollectionBySet,
    profileId ? { profileId: profileId as Id<'profiles'>, setId } : 'skip'
  );
  const wishlist = useQuery(
    api.wishlist.getWishlist,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );
  const addCard = useMutation(api.collections.addCard);
  const removeCard = useMutation(api.collections.removeCard);
  const addToWishlist = useMutation(api.wishlist.addToWishlist);
  const removeFromWishlist = useMutation(api.wishlist.removeFromWishlist);
  const togglePriority = useMutation(api.wishlist.togglePriority);
  const priorityCount = useQuery(
    api.wishlist.getPriorityCount,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  // Build a map of owned cards for quick lookup (cardId -> total quantity)
  // Also build a map of owned variants per card (cardId -> Map<variant, quantity>)
  const { ownedCards, ownedVariantsMap } = useMemo(() => {
    const cards = new Map<string, number>();
    const variants = new Map<string, Map<CardVariant, number>>();

    if (collection) {
      collection.forEach((card) => {
        const variant = (card.variant ?? 'normal') as CardVariant;
        const currentTotal = cards.get(card.cardId) ?? 0;
        cards.set(card.cardId, currentTotal + card.quantity);

        // Track per-variant quantities
        if (!variants.has(card.cardId)) {
          variants.set(card.cardId, new Map());
        }
        const variantMap = variants.get(card.cardId)!;
        const currentVariantQty = variantMap.get(variant) ?? 0;
        variantMap.set(variant, currentVariantQty + card.quantity);
      });
    }

    return { ownedCards: cards, ownedVariantsMap: variants };
  }, [collection]);

  // Build a map of wishlisted card IDs to their priority status for quick lookup
  const wishlistedCards = useMemo(() => {
    const map = new Map<string, boolean>();
    if (wishlist) {
      wishlist.forEach((item) => {
        map.set(item.cardId, item.isPriority ?? false);
      });
    }
    return map;
  }, [wishlist]);

  // Open variant selector when clicking on a card
  const handleCardClick = useCallback(
    (card: PokemonCard, event: React.MouseEvent) => {
      if (!profileId) return;

      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const availableVariants = getAvailableVariants(card);

      // If only one variant and card is not owned, add it directly
      if (availableVariants.length === 1 && !ownedCards.has(card.id)) {
        addCard({
          profileId: profileId as Id<'profiles'>,
          cardId: card.id,
          cardName: card.name,
          setName,
          variant: availableVariants[0],
        });
        return;
      }

      // Show variant selector for multi-variant cards or owned cards
      setSelectorPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
      setSelectedCard(card);
    },
    [profileId, ownedCards, addCard, setName]
  );

  // Add variant handler
  const handleAddVariant = useCallback(
    async (cardId: string, cardName: string, variant: CardVariant) => {
      if (!profileId) return;
      await addCard({
        profileId: profileId as Id<'profiles'>,
        cardId,
        cardName,
        setName,
        variant,
      });
    },
    [profileId, addCard, setName]
  );

  // Remove variant handler
  const handleRemoveVariant = useCallback(
    async (cardId: string, cardName: string, variant: CardVariant) => {
      if (!profileId) return;
      const currentQty = ownedVariantsMap.get(cardId)?.get(variant) ?? 0;
      if (currentQty <= 0) return;

      await removeCard({
        profileId: profileId as Id<'profiles'>,
        cardId,
        cardName,
        setName,
        variant,
      });
    },
    [profileId, removeCard, setName, ownedVariantsMap]
  );

  // Close variant selector
  const handleCloseSelector = useCallback(() => {
    setSelectedCard(null);
    setSelectorPosition(null);
  }, []);

  const handleToggleWishlist = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profileId) return;

    if (wishlistedCards.has(cardId)) {
      await removeFromWishlist({ profileId: profileId as Id<'profiles'>, cardId });
    } else {
      await addToWishlist({ profileId: profileId as Id<'profiles'>, cardId });
    }
  };

  const handleTogglePriority = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profileId) return;

    await togglePriority({ profileId: profileId as Id<'profiles'>, cardId });
  };

  const ownedCount = ownedCards.size;
  const totalCount = cards.length;
  const progressPercent = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  // Loading state with skeleton screens
  if (profileLoading || collection === undefined) {
    return (
      <div>
        <StatsBarSkeleton />
        <CardGridSkeleton count={cards.length > 0 ? Math.min(cards.length, 20) : 20} />
      </div>
    );
  }

  return (
    <div>
      {/* Stats Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-kid-primary">{ownedCount}</div>
            <div className="text-xs text-gray-500">Owned</div>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{totalCount - ownedCount}</div>
            <div className="text-xs text-gray-500">Needed</div>
          </div>
          <div className="h-8 w-px bg-gray-200" />
          <div className="text-center">
            <div className="text-2xl font-bold text-kid-secondary">{progressPercent}%</div>
            <div className="text-xs text-gray-500">Complete</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Priority Stars Indicator */}
          {priorityCount && priorityCount.count > 0 && (
            <div className="flex items-center gap-1.5" title="Priority wishlist items">
              <div className="flex items-center">
                {Array.from({ length: priorityCount.max }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-4 w-4',
                      i < priorityCount.count ? 'text-amber-400' : 'text-gray-200'
                    )}
                  >
                    {i < priorityCount.count ? (
                      <StarIconSolid className="h-4 w-4" />
                    ) : (
                      <StarIconOutline className="h-4 w-4" />
                    )}
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-500">Priority</span>
            </div>
          )}

          {/* Progress indicator */}
          {progressPercent >= 25 && (
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm">
                {progressPercent >= 100 ? (
                  <CrownIcon className="h-5 w-5" />
                ) : progressPercent >= 75 ? (
                  <TrophyIcon className="h-5 w-5" />
                ) : progressPercent >= 50 ? (
                  <MapIcon className="h-5 w-5" />
                ) : (
                  <GlobeAltIcon className="h-5 w-5" />
                )}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {progressPercent >= 100
                  ? 'Set Champion!'
                  : progressPercent >= 75
                    ? 'Set Master'
                    : progressPercent >= 50
                      ? 'Set Adventurer'
                      : 'Set Explorer'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Card Grid */}
      <div className="card-grid">
        {cards.map((card) => {
          const isOwned = ownedCards.has(card.id);
          const quantity = ownedCards.get(card.id) || 0;
          const isWishlisted = wishlistedCards.has(card.id);
          const isPriority = wishlistedCards.get(card.id) ?? false;
          const canAddPriority = (priorityCount?.remaining ?? 0) > 0;
          const marketPrice = getCardMarketPrice(card);

          return (
            <div
              key={card.id}
              className={cn(
                'group relative cursor-pointer rounded-xl bg-white p-2 shadow-sm transition-all',
                isOwned
                  ? 'ring-2 ring-kid-success ring-offset-2'
                  : 'opacity-60 hover:opacity-100 hover:shadow-md'
              )}
              onClick={(e) => handleCardClick(card, e)}
            >
              {/* Card Image */}
              <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg">
                <Image
                  src={card.images.small}
                  alt={card.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-contain"
                />

                {/* Owned Checkmark */}
                {isOwned && (
                  <div className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-kid-success text-white shadow-md">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}

                {/* Quantity Badge */}
                {quantity > 1 && (
                  <div className="absolute left-1 top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-kid-primary px-1 text-xs font-bold text-white shadow-md">
                    x{quantity}
                  </div>
                )}

                {/* Wishlist Heart Button */}
                <button
                  className={cn(
                    'absolute bottom-1 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all',
                    isWishlisted ? 'right-9' : 'right-1',
                    isWishlisted
                      ? 'bg-rose-500 text-white'
                      : 'bg-white/90 text-gray-400 opacity-0 hover:bg-white hover:text-rose-500 group-hover:opacity-100'
                  )}
                  onClick={(e) => handleToggleWishlist(card.id, e)}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {isWishlisted ? (
                    <HeartIconSolid className="h-4 w-4" />
                  ) : (
                    <HeartIcon className="h-4 w-4" />
                  )}
                </button>

                {/* Priority Star Button - Only show when wishlisted */}
                {isWishlisted && (
                  <button
                    className={cn(
                      'absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all',
                      isPriority
                        ? 'bg-amber-400 text-white'
                        : canAddPriority
                          ? 'bg-white/90 text-gray-400 hover:bg-amber-100 hover:text-amber-500'
                          : 'cursor-not-allowed bg-gray-100 text-gray-300'
                    )}
                    onClick={(e) => handleTogglePriority(card.id, e)}
                    disabled={!isPriority && !canAddPriority}
                    aria-label={isPriority ? 'Remove from priority' : 'Mark as priority'}
                    title={
                      isPriority
                        ? 'Remove from priority'
                        : canAddPriority
                          ? 'Mark as priority'
                          : `Max ${priorityCount?.max ?? 5} priority items`
                    }
                  >
                    {isPriority ? (
                      <StarIconSolid className="h-4 w-4" />
                    ) : (
                      <StarIconOutline className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Card Info */}
              <div className="mt-2 text-center">
                <p className="truncate text-xs font-medium text-gray-800">{card.name}</p>
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-xs text-gray-400">#{card.number}</span>
                  {marketPrice !== null && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold',
                        marketPrice >= 10
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white'
                          : 'bg-emerald-100 text-emerald-700'
                      )}
                      title={`TCGPlayer market price: $${marketPrice.toFixed(2)}`}
                    >
                      <CurrencyDollarIcon className="h-3 w-3" />
                      {formatPrice(marketPrice).replace('$', '')}
                    </span>
                  )}
                </div>
              </div>

              {/* Owned Variants Indicator - Show which variants are owned */}
              {isOwned && (
                <div className="mt-1 flex items-center justify-center gap-1">
                  {(() => {
                    const cardVariants = ownedVariantsMap.get(card.id);
                    if (!cardVariants) return null;
                    return Array.from(cardVariants.entries()).map(([variant, qty]) => {
                      const config = VARIANT_CONFIG[variant];
                      return (
                        <span
                          key={variant}
                          className={cn(
                            'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium text-white',
                            `bg-gradient-to-r ${config.gradient}`
                          )}
                          title={`${config.label} x${qty}`}
                        >
                          {config.shortLabel}
                          {qty > 1 && <span className="text-white/80">x{qty}</span>}
                        </span>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Variant Selector Popup */}
      {selectedCard && selectorPosition && (
        <VariantSelector
          card={selectedCard}
          ownedVariants={ownedVariantsMap.get(selectedCard.id) ?? new Map()}
          setName={setName}
          onAddVariant={handleAddVariant}
          onRemoveVariant={handleRemoveVariant}
          onClose={handleCloseSelector}
          position={selectorPosition}
        />
      )}
    </div>
  );
}
