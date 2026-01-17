'use client';

import { useEffect, useCallback } from 'react';
import { CardImage } from '@/components/ui/CardImage';
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
} from '@heroicons/react/24/solid';
import Link from 'next/link';

// Variant type definition (matches CardGrid.tsx)
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
    textColor: string;
    icon?: React.ComponentType<{ className?: string }>;
  }
> = {
  normal: {
    label: 'Normal',
    shortLabel: 'N',
    gradient: 'from-gray-400 to-gray-500',
    textColor: 'text-gray-300',
  },
  holofoil: {
    label: 'Holofoil',
    shortLabel: 'H',
    gradient: 'from-purple-400 to-indigo-500',
    textColor: 'text-purple-300',
    icon: SparklesIcon,
  },
  reverseHolofoil: {
    label: 'Reverse Holo',
    shortLabel: 'R',
    gradient: 'from-cyan-400 to-blue-500',
    textColor: 'text-cyan-300',
    icon: SparklesIcon,
  },
  '1stEditionHolofoil': {
    label: '1st Ed. Holo',
    shortLabel: '1H',
    gradient: 'from-amber-400 to-yellow-500',
    textColor: 'text-amber-300',
    icon: SparklesIcon,
  },
  '1stEditionNormal': {
    label: '1st Edition',
    shortLabel: '1N',
    gradient: 'from-amber-400 to-orange-500',
    textColor: 'text-orange-300',
  },
};

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
  isOnWishlist?: boolean;
  isRemoving?: boolean;
  isAddingToWishlist?: boolean;
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
  isOnWishlist = false,
  isRemoving = false,
  isAddingToWishlist = false,
}: CardDetailModalProps) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
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
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Previous card"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
      )}

      {hasNext && onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-3 text-white transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Next card"
        >
          <ArrowRightIcon className="h-6 w-6" />
        </button>
      )}

      {/* Modal content */}
      <div
        className="relative mx-4 flex max-h-[90vh] max-w-4xl flex-col items-center gap-6 overflow-auto rounded-2xl bg-gradient-to-b from-gray-900 to-gray-800 p-6 shadow-2xl md:flex-row md:items-start"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Close modal"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Large card image */}
        <div className="relative w-full max-w-sm shrink-0">
          <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-xl shadow-2xl">
            <CardImage
              src={largeImage}
              alt={card.name}
              fill
              sizes="(max-width: 768px) 90vw, 400px"
              priority
            />
          </div>

          {/* Quantity badge */}
          {card.quantity > 1 && (
            <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-kid-primary text-lg font-bold text-white shadow-lg">
              x{card.quantity}
            </div>
          )}
        </div>

        {/* Card details */}
        <div className="w-full text-white">
          <h2 className="mb-2 text-2xl font-bold">{card.name}</h2>

          {/* Set info */}
          <Link
            href={`/sets/${card.set.id}`}
            className="mb-4 inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
          >
            {card.set.images?.symbol && (
              <img
                src={card.set.images.symbol}
                alt={card.set.name}
                className="h-5 w-5"
              />
            )}
            <span>{card.set.name}</span>
            <span className="text-white/50">#{card.number}</span>
          </Link>

          {/* Owned variants section */}
          {card.ownedVariants && Object.keys(card.ownedVariants).length > 0 && (
            <div className="mb-4 rounded-lg bg-white/10 p-3">
              <span className="text-sm text-white/50">You Own:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(card.ownedVariants).map(([variant, qty]) => {
                  const config = VARIANT_CONFIG[variant as CardVariant];
                  if (!config || qty <= 0) return null;
                  const Icon = config.icon;
                  return (
                    <span
                      key={variant}
                      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${config.gradient} px-3 py-1.5 text-sm font-medium text-white shadow-sm`}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span>{config.label}</span>
                      <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-bold">
                        x{qty}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Card metadata */}
          <div className="space-y-3">
            {card.rarity && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/50">Rarity:</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
                  {card.rarity}
                </span>
              </div>
            )}

            {card.supertype && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/50">Type:</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
                  {card.supertype}
                </span>
              </div>
            )}

            {card.types && card.types.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/50">Energy:</span>
                <div className="flex gap-1">
                  {card.types.map((type) => (
                    <span
                      key={type}
                      className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Market price */}
            {card.tcgplayer?.prices && (
              <div className="mt-4 rounded-lg bg-white/10 p-3">
                <span className="text-sm text-white/50">Market Value:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {card.tcgplayer.prices.normal?.market && (
                    <span className="rounded bg-emerald-500/20 px-2 py-1 text-sm text-emerald-300">
                      Normal: ${card.tcgplayer.prices.normal.market.toFixed(2)}
                    </span>
                  )}
                  {card.tcgplayer.prices.holofoil?.market && (
                    <span className="rounded bg-purple-500/20 px-2 py-1 text-sm text-purple-300">
                      Holo: ${card.tcgplayer.prices.holofoil.market.toFixed(2)}
                    </span>
                  )}
                  {card.tcgplayer.prices.reverseHolofoil?.market && (
                    <span className="rounded bg-cyan-500/20 px-2 py-1 text-sm text-cyan-300">
                      Reverse: ${card.tcgplayer.prices.reverseHolofoil.market.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 space-y-3">
            <span className="text-sm text-white/50">Quick Actions:</span>
            <div className="flex flex-wrap gap-2">
              {/* View in Set */}
              <Link
                href={`/sets/${card.set.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-kid-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-kid-primary/80"
              >
                View in Set
                <ArrowRightIcon className="h-4 w-4" />
              </Link>

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

              {/* Edit Quantity */}
              {onEditQuantity && (
                <div className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (card.quantity > 1) {
                        onEditQuantity(card.id, card.quantity - 1);
                      }
                    }}
                    disabled={card.quantity <= 1}
                    className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label="Decrease quantity"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-medium text-white">
                    x{card.quantity}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditQuantity(card.id, card.quantity + 1);
                    }}
                    className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
                    aria-label="Increase quantity"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
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
                  {isRemoving ? 'Removing...' : 'Remove'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-xs text-white/50">
        Use arrow keys to navigate, ESC to close
      </div>
    </div>
  );
}
