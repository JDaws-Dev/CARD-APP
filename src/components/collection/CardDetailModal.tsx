'use client';

import { useEffect, useCallback } from 'react';
import { CardImage } from '@/components/ui/CardImage';
import type { PokemonCard } from '@/lib/pokemon-tcg';
import {
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/solid';
import Link from 'next/link';

interface CardWithQuantity extends PokemonCard {
  quantity: number;
  collectionId: string;
}

interface CardDetailModalProps {
  card: CardWithQuantity | null;
  isOpen: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function CardDetailModal({
  card,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
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

          {/* View in set link */}
          <Link
            href={`/sets/${card.set.id}`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-kid-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-kid-primary/80"
          >
            View in Set
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-xs text-white/50">
        Use arrow keys to navigate, ESC to close
      </div>
    </div>
  );
}
