'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import {
  ArrowPathIcon,
  XMarkIcon,
  SparklesIcon,
  Square3Stack3DIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import type { PokemonCard } from '@/lib/pokemon-tcg';
import { RarityBadge } from '@/components/ui/RarityTooltip';

interface CollectionCard {
  _id: string;
  cardId: string;
  quantity: number;
}

interface RandomCardButtonProps {
  collection: CollectionCard[];
  cardData: Map<string, PokemonCard>;
  className?: string;
}

/**
 * RandomCardButton - Shows a random card from the collection
 * Fun feature for kids to browse their collection in a playful way
 */
export function RandomCardButton({ collection, cardData, className }: RandomCardButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // Get all cards with their data
  const cardsWithData = useMemo(() => {
    return collection
      .map((item) => cardData.get(item.cardId))
      .filter((card): card is PokemonCard => card !== undefined);
  }, [collection, cardData]);

  // Pick a random card
  const pickRandomCard = useCallback(() => {
    if (cardsWithData.length === 0) return;

    setIsShuffling(true);
    setIsRevealed(false);

    // Shuffle animation duration
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * cardsWithData.length);
      setSelectedCard(cardsWithData[randomIndex]);
      setIsShuffling(false);

      // Card reveal animation
      setTimeout(() => {
        setIsRevealed(true);
      }, 100);
    }, 800);
  }, [cardsWithData]);

  // Open modal and pick a card
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    pickRandomCard();
  }, [pickRandomCard]);

  // Close modal
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSelectedCard(null);
    setIsRevealed(false);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  // Don't render if no cards
  if (cardsWithData.length === 0) {
    return null;
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-purple-600 hover:to-pink-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
          className
        )}
        aria-label="Show a random card from your collection"
      >
        <SparklesIcon className="h-5 w-5" aria-hidden="true" />
        Random Card
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="random-card-title"
        >
          {/* Modal Content */}
          <div
            className="relative mx-4 max-w-md rounded-3xl bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              aria-label="Close random card modal"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Header */}
            <div className="mb-4 text-center">
              <h2 id="random-card-title" className="text-xl font-bold text-gray-800">
                Random Card
              </h2>
              <p className="text-sm text-gray-500">
                {cardsWithData.length} cards in your collection
              </p>
            </div>

            {/* Card Display Area */}
            <div className="relative mx-auto mb-6 flex h-80 w-56 items-center justify-center">
              {/* Shuffling Animation */}
              {isShuffling && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Animated card stack */}
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute h-full w-full animate-spin rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg"
                      style={{
                        animationDuration: `${0.5 + i * 0.1}s`,
                        animationTimingFunction: 'ease-in-out',
                        transform: `rotate(${i * 15}deg) scale(${1 - i * 0.05})`,
                        opacity: 1 - i * 0.15,
                      }}
                    >
                      <div className="flex h-full items-center justify-center">
                        <Square3Stack3DIcon className="h-12 w-12 text-white/50" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Card Reveal */}
              {!isShuffling && selectedCard && (
                <div
                  className={cn(
                    'relative h-full w-full transform transition-all duration-500',
                    isRevealed ? 'scale-100 opacity-100' : 'rotate-y-180 scale-75 opacity-0'
                  )}
                >
                  {/* Card glow effect */}
                  <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 opacity-50 blur-md" />

                  {/* Card image */}
                  <div className="relative h-full w-full overflow-hidden rounded-xl shadow-xl">
                    <Image
                      src={selectedCard.images.large || selectedCard.images.small}
                      alt={selectedCard.name}
                      fill
                      sizes="224px"
                      className="object-contain"
                      priority
                    />
                  </div>

                  {/* Sparkle decorations */}
                  {isRevealed && (
                    <>
                      <SparklesIcon
                        className="absolute -left-4 -top-4 h-8 w-8 animate-pulse text-amber-400"
                        aria-hidden="true"
                      />
                      <SparklesIcon
                        className="absolute -bottom-4 -right-4 h-6 w-6 animate-pulse text-pink-400"
                        style={{ animationDelay: '0.3s' }}
                        aria-hidden="true"
                      />
                      <SparklesIcon
                        className="absolute -right-2 top-1/2 h-5 w-5 animate-pulse text-purple-400"
                        style={{ animationDelay: '0.6s' }}
                        aria-hidden="true"
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Card Info */}
            {!isShuffling && selectedCard && isRevealed && (
              <div className="mb-6 text-center">
                <h3 className="text-lg font-bold text-gray-800">{selectedCard.name}</h3>
                <p className="text-sm text-gray-500">
                  {selectedCard.set.name} · #{selectedCard.number}
                </p>
                {selectedCard.rarity && (
                  <div className="mt-2">
                    <RarityBadge rarity={selectedCard.rarity} size="md" showTooltip={true} />
                  </div>
                )}
              </div>
            )}

            {/* Shuffle Again Button */}
            <div className="text-center">
              <button
                onClick={pickRandomCard}
                disabled={isShuffling}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
                  isShuffling
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:from-purple-600 hover:to-pink-600 hover:shadow-xl active:scale-95'
                )}
                aria-label="Shuffle and show another random card"
              >
                <ArrowPathIcon
                  className={cn('h-5 w-5', isShuffling && 'animate-spin')}
                  aria-hidden="true"
                />
                {isShuffling ? 'Shuffling...' : 'Shuffle Again'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
