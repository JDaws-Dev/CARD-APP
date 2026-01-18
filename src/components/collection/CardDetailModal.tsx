'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { CardStoryModal } from '@/components/ai/CardStoryModal';
import { CardImage } from '@/components/ui/CardImage';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import { useHidePrices } from '@/hooks/useHidePrices';
import type { PokemonCard } from '@/lib/pokemon-tcg';
import {
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  SparklesIcon,
  TrashIcon,
  HeartIcon,
  MinusIcon,
  PlusIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/solid';
import { TradeLoggingModal } from '@/components/trades/TradeLoggingModal';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  getVariantConfig,
  type CardVariant,
} from '@/components/ui/VariantBadge';

// Game-specific label mapping for the "types" field
// Different TCGs use different terminology for what's stored in the types array
const TYPES_LABEL_BY_GAME: Record<string, string> = {
  pokemon: 'Energy',
  yugioh: 'Attribute',
  onepiece: 'Color',
  lorcana: 'Ink',
};

// Get available variants from a card's availableVariants field or tcgplayer prices
function getAvailableVariants(card: PokemonCard): CardVariant[] {
  // First check availableVariants field (from cachedCards)
  if (card.availableVariants && card.availableVariants.length > 0) {
    return card.availableVariants as CardVariant[];
  }

  // Fallback to tcgplayer prices (for Pokemon direct API calls)
  const prices = card.tcgplayer?.prices;
  if (!prices) return ['normal'];

  const variants: CardVariant[] = [];
  if (prices.normal) variants.push('normal');
  if (prices.holofoil) variants.push('holofoil');
  if (prices.reverseHolofoil) variants.push('reverseHolofoil');

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

interface CardWithQuantity extends PokemonCard {
  quantity: number;
  collectionId: string;
  ownedVariants?: Record<string, number>; // variant -> quantity
}

interface CardDetailModalProps {
  card: CardWithQuantity | null;
  isOpen: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  // Quick action callbacks
  onRemoveCard?: (cardId: string) => void;
  onAddToWishlist?: (cardId: string) => void;
  onEditQuantity?: (cardId: string, newQuantity: number) => void;
  // New: variant-specific callbacks
  onAddVariant?: (cardId: string, variant: CardVariant) => void;
  onRemoveVariant?: (cardId: string, variant: CardVariant) => void;
  isOnWishlist?: boolean;
  isRemoving?: boolean;
  isAddingToWishlist?: boolean;
  // Buy button support
  buyUrl?: string | null;
}

export function CardDetailModal({
  card,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  onRemoveCard,
  onAddToWishlist,
  onEditQuantity,
  onAddVariant,
  onRemoveVariant,
  isOnWishlist = false,
  isRemoving = false,
  isAddingToWishlist = false,
  buyUrl,
}: CardDetailModalProps) {
  // Get game context
  const { primaryGame } = useGameSelector();

  // Get hide prices setting
  const { hidePrices } = useHidePrices();

  // State for CardStoryModal
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  // State for TradeLoggingModal (Trade Away feature)
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  // State for selected variant tab
  const [selectedVariant, setSelectedVariant] = useState<CardVariant | null>(null);

  // Touch/swipe handling refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50; // Minimum swipe distance in pixels
  const SWIPE_ANGLE_THRESHOLD = 30; // Max vertical deviation in degrees

  // Get available variants for this card
  const availableVariants = card ? getAvailableVariants(card) : [];

  // Reset selected variant when card changes
  useEffect(() => {
    if (card && availableVariants.length > 0) {
      // Default to first owned variant, or first available
      const ownedVariants = Object.keys(card.ownedVariants || {});
      const firstOwned = availableVariants.find(v => ownedVariants.includes(v));
      setSelectedVariant(firstOwned || availableVariants[0]);
    }
  }, [card?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  // Handle touch end for swipe navigation
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      // Check if it's a horizontal swipe (not too much vertical movement)
      const angle = Math.abs(Math.atan2(deltaY, deltaX) * (180 / Math.PI));
      const isHorizontalSwipe = angle < SWIPE_ANGLE_THRESHOLD || angle > (180 - SWIPE_ANGLE_THRESHOLD);

      if (isHorizontalSwipe && Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX > 0 && hasPrevious && onPrevious) {
          // Swipe right -> previous card
          onPrevious();
        } else if (deltaX < 0 && hasNext && onNext) {
          // Swipe left -> next card
          onNext();
        }
      }

      // Reset touch state
      touchStartX.current = null;
      touchStartY.current = null;
    },
    [hasPrevious, hasNext, onPrevious, onNext]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrevious && onPrevious) {
            e.preventDefault();
            onPrevious();
          }
          break;
        case 'ArrowRight':
          if (hasNext && onNext) {
            e.preventDefault();
            onNext();
          }
          break;
      }
    },
    [isOpen, onClose, onPrevious, onNext, hasPrevious, hasNext]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !card) return null;

  // Get the high-res image (large or fall back to small)
  const largeImage = card.images.large || card.images.small;

  // Get current variant info
  const currentVariantQty = selectedVariant ? (card.ownedVariants?.[selectedVariant] ?? 0) : 0;
  const currentVariantPrice = selectedVariant ? getVariantPrice(card, selectedVariant) : null;
  const currentVariantConfig = selectedVariant ? getVariantConfig(selectedVariant) : null;

  // Calculate total owned across all variants
  const totalOwned = Object.values(card.ownedVariants || {}).reduce((sum, qty) => sum + qty, 0);

  // Handle variant quantity changes
  const handleAddVariantQty = () => {
    if (!selectedVariant) return;
    if (onAddVariant) {
      onAddVariant(card.id, selectedVariant);
    } else if (onEditQuantity) {
      // Fallback to old method if new callbacks not provided
      onEditQuantity(card.id, card.quantity + 1);
    }
  };

  const handleRemoveVariantQty = () => {
    if (!selectedVariant || currentVariantQty <= 0) return;
    if (onRemoveVariant) {
      onRemoveVariant(card.id, selectedVariant);
    } else if (onEditQuantity && card.quantity > 1) {
      // Fallback to old method if new callbacks not provided
      onEditQuantity(card.id, card.quantity - 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={`${card.name} card details`}
    >
      {/* Navigation arrows - outside modal content */}
      {hasPrevious && onPrevious && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 sm:left-4 sm:p-3"
          aria-label="Previous card"
        >
          <ArrowLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}

      {hasNext && onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 sm:right-4 sm:p-3"
          aria-label="Next card"
        >
          <ArrowRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}

      {/* Modal content */}
      <div
        className="relative mx-2 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl sm:mx-4 md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Close modal"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Left: Card Image */}
        <div className="relative flex-shrink-0 p-4 pb-0 md:p-6 md:pb-6">
          <div className="relative mx-auto aspect-[2.5/3.5] w-48 overflow-hidden rounded-xl shadow-2xl sm:w-64 md:w-72">
            <CardImage
              key={card.id}
              src={largeImage}
              alt={card.name}
              fill
              sizes="(max-width: 768px) 256px, 288px"
              priority
            />
          </div>

          {/* Total quantity badge */}
          {totalOwned > 0 && (
            <div className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-kid-success text-lg font-bold text-white shadow-lg sm:right-4 sm:top-4">
              x{totalOwned}
            </div>
          )}
        </div>

        {/* Right: Card details - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pt-2 text-white md:p-6">
          {/* Card name and set */}
          <h2 className="mb-1 pr-8 text-xl font-bold sm:text-2xl">{card.name}</h2>
          <Link
            href={`/sets/${card.set.id}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
          >
            <span>{card.set.name}</span>
            <span className="text-white/50">#{card.number}</span>
          </Link>

          {/* Variant Selector Tabs */}
          {availableVariants.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-white/50">
                Variants
              </div>
              <div className="flex flex-wrap gap-2">
                {availableVariants.map((variant) => {
                  const config = getVariantConfig(variant);
                  const qty = card.ownedVariants?.[variant] ?? 0;
                  const isSelected = selectedVariant === variant;
                  const isOwned = qty > 0;
                  const Icon = config.icon;

                  return (
                    <button
                      key={variant}
                      onClick={() => setSelectedVariant(variant)}
                      className={cn(
                        'relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                        isSelected
                          ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg ring-2 ring-white/30`
                          : isOwned
                            ? 'bg-white/15 text-white hover:bg-white/25'
                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                      )}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span>{config.label}</span>
                      {isOwned && (
                        <span className={cn(
                          'ml-1 rounded-full px-1.5 py-0.5 text-xs font-bold',
                          isSelected ? 'bg-white/25' : 'bg-kid-success/80'
                        )}>
                          x{qty}
                        </span>
                      )}
                      {isOwned && (
                        <CheckCircleIcon
                          className="absolute -right-1 -top-1 h-4 w-4 text-kid-success"
                          aria-label="Owned"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Variant Details */}
          {selectedVariant && currentVariantConfig && (
            <div className="mb-4 rounded-xl bg-white/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-white',
                    currentVariantConfig.gradient
                  )}>
                    {currentVariantConfig.icon ? (
                      <currentVariantConfig.icon className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">{currentVariantConfig.shortLabel}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{currentVariantConfig.label}</div>
                    {!hidePrices && currentVariantPrice !== null && (
                      <div className="flex items-center gap-1 text-sm text-emerald-400">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        <span>${currentVariantPrice.toFixed(2)} market</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Per-variant quantity controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveVariantQty();
                    }}
                    disabled={currentVariantQty <= 0}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Remove one ${currentVariantConfig.label}`}
                  >
                    <MinusIcon className="h-5 w-5" />
                  </button>
                  <span className="min-w-[2.5rem] text-center text-xl font-bold">
                    {currentVariantQty}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddVariantQty();
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-kid-success text-white shadow-md transition hover:bg-kid-success/90"
                    aria-label={`Add one ${currentVariantConfig.label}`}
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Status indicator */}
              <div className={cn(
                'mt-3 flex items-center gap-2 rounded-lg px-3 py-2',
                currentVariantQty > 0 ? 'bg-kid-success/20' : 'bg-white/5'
              )}>
                {currentVariantQty > 0 ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5 text-kid-success" />
                    <span className="text-sm font-medium text-kid-success">
                      You own {currentVariantQty} {currentVariantConfig.label} cop{currentVariantQty === 1 ? 'y' : 'ies'}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-white/50">
                    You don&apos;t own this variant yet
                  </span>
                )}
              </div>
            </div>
          )}

          {/* All Prices Summary - hidden when hidePrices is enabled */}
          {!hidePrices && card.tcgplayer?.prices && (
            <div className="mb-4 rounded-xl bg-white/5 p-3">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-white/50">
                Market Prices
              </div>
              <div className="flex flex-wrap gap-2">
                {card.tcgplayer.prices.normal?.market && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/30 px-2.5 py-1 text-sm">
                    <span className="text-white/70">Normal:</span>
                    <span className="font-medium text-emerald-400">
                      ${card.tcgplayer.prices.normal.market.toFixed(2)}
                    </span>
                  </span>
                )}
                {card.tcgplayer.prices.holofoil?.market && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/30 px-2.5 py-1 text-sm">
                    <span className="text-white/70">Holo:</span>
                    <span className="font-medium text-purple-300">
                      ${card.tcgplayer.prices.holofoil.market.toFixed(2)}
                    </span>
                  </span>
                )}
                {card.tcgplayer.prices.reverseHolofoil?.market && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/30 px-2.5 py-1 text-sm">
                    <span className="text-white/70">Reverse:</span>
                    <span className="font-medium text-cyan-300">
                      ${card.tcgplayer.prices.reverseHolofoil.market.toFixed(2)}
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Card metadata */}
          <div className="mb-4 space-y-2">
            {card.rarity && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/50">Rarity:</span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-sm font-medium">
                  {card.rarity}
                </span>
              </div>
            )}

            {card.supertype && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/50">Type:</span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-sm font-medium">
                  {card.supertype}
                </span>
              </div>
            )}

            {card.types && card.types.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/50">
                  {TYPES_LABEL_BY_GAME[primaryGame.id] || 'Type'}:
                </span>
                <div className="flex gap-1">
                  {card.types.map((type) => (
                    <span
                      key={type}
                      className="rounded-full bg-white/10 px-2.5 py-0.5 text-sm font-medium"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-3 border-t border-white/10 pt-4">
            <span className="text-xs font-medium uppercase tracking-wide text-white/50">Quick Actions</span>
            <div className="flex flex-wrap gap-2">
              {/* View in Set */}
              <Link
                href={`/sets/${card.set.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-kid-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-kid-primary/80"
              >
                View in Set
                <ArrowRightIcon className="h-4 w-4" />
              </Link>

              {/* Tell me about this card - AI Story */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsStoryModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:from-purple-600 hover:to-indigo-600"
                aria-label="Tell me about this card"
              >
                <SparklesIcon className="h-4 w-4" />
                Tell me about this card!
              </button>

              {/* Trade Away - only show if user owns the selected variant */}
              {selectedVariant && currentVariantQty > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTradeModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-medium text-white transition hover:from-amber-600 hover:to-orange-600"
                  aria-label="Trade this card away"
                >
                  <ArrowsRightLeftIcon className="h-4 w-4" />
                  Trade Away
                </button>
              )}

              {/* Buy This Card - only show if buyUrl is available */}
              {buyUrl && (
                <a
                  href={buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-medium text-white transition hover:from-emerald-600 hover:to-teal-600"
                  aria-label="Buy this card on TCGPlayer"
                >
                  <ShoppingCartIcon className="h-4 w-4" />
                  Buy This Card
                </a>
              )}

              {/* Add to Wishlist */}
              {onAddToWishlist && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToWishlist(card.id);
                  }}
                  disabled={isAddingToWishlist || isOnWishlist}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    isOnWishlist
                      ? 'cursor-default bg-rose-500/30 text-rose-300'
                      : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                  } disabled:opacity-50`}
                  aria-label={isOnWishlist ? 'Already on wishlist' : 'Add to wishlist'}
                >
                  <HeartIcon className={`h-4 w-4 ${isOnWishlist ? 'fill-current' : ''}`} />
                  {isAddingToWishlist
                    ? 'Adding...'
                    : isOnWishlist
                      ? 'On Wishlist'
                      : 'Add to Wishlist'}
                </button>
              )}

              {/* Remove Card */}
              {onRemoveCard && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCard(card.id);
                  }}
                  disabled={isRemoving}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/30 disabled:opacity-50"
                  aria-label="Remove card from collection"
                >
                  <TrashIcon className="h-4 w-4" />
                  {isRemoving ? 'Removing...' : 'Remove All'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-xs text-white/50">
        <span className="hidden sm:inline">Use arrow keys to navigate, ESC to close</span>
        <span className="sm:hidden">Swipe to navigate, tap outside to close</span>
      </div>

      {/* Card Story Modal */}
      <CardStoryModal
        card={card}
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        gameSlug={primaryGame.id as 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana'}
      />

      {/* Trade Logging Modal (Trade Away feature) */}
      <TradeLoggingModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        prefilledGiveCard={
          selectedVariant
            ? {
                cardId: card.id,
                cardName: card.name,
                setName: card.set.name,
                imageSmall: card.images.small || '',
                variant: selectedVariant,
                maxQuantity: currentVariantQty,
              }
            : undefined
        }
      />
    </div>
  );
}
