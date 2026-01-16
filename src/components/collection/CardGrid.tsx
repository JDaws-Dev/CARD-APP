'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { PokemonCard } from '@/lib/pokemon-tcg';

interface CardGridProps {
  cards: PokemonCard[];
  setId: string;
}

export function CardGrid({ cards, setId }: CardGridProps) {
  // Local state for demo - will be replaced with Convex
  const [ownedCards, setOwnedCards] = useState<Map<string, number>>(new Map());

  const toggleCard = (cardId: string) => {
    setOwnedCards((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(cardId)) {
        newMap.delete(cardId);
      } else {
        newMap.set(cardId, 1);
      }
      return newMap;
    });
  };

  const updateQuantity = (cardId: string, delta: number) => {
    setOwnedCards((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(cardId) || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        newMap.delete(cardId);
      } else {
        newMap.set(cardId, newQty);
      }
      return newMap;
    });
  };

  const ownedCount = ownedCards.size;
  const totalCount = cards.length;
  const progressPercent = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

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

        {/* Progress indicator */}
        {progressPercent >= 25 && (
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {progressPercent >= 100 ? '👑' : progressPercent >= 75 ? '🏆' : progressPercent >= 50 ? '🗺️' : '🧭'}
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

      {/* Card Grid */}
      <div className="card-grid">
        {cards.map((card) => {
          const isOwned = ownedCards.has(card.id);
          const quantity = ownedCards.get(card.id) || 0;

          return (
            <div
              key={card.id}
              className={cn(
                'group relative cursor-pointer rounded-xl bg-white p-2 shadow-sm transition-all',
                isOwned
                  ? 'ring-2 ring-kid-success ring-offset-2'
                  : 'opacity-60 hover:opacity-100 hover:shadow-md'
              )}
              onClick={() => toggleCard(card.id)}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Quantity Badge */}
                {quantity > 1 && (
                  <div className="absolute left-1 top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-kid-primary px-1 text-xs font-bold text-white shadow-md">
                    x{quantity}
                  </div>
                )}
              </div>

              {/* Card Info */}
              <div className="mt-2 text-center">
                <p className="truncate text-xs font-medium text-gray-800">{card.name}</p>
                <p className="text-xs text-gray-400">#{card.number}</p>
              </div>

              {/* Quantity Controls - Show on hover when owned */}
              {isOwned && (
                <div
                  className="absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/95 px-2 py-1 opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                    onClick={() => updateQuantity(card.id, -1)}
                  >
                    −
                  </button>
                  <span className="min-w-[1.5rem] text-center text-sm font-medium">{quantity}</span>
                  <button
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-kid-primary text-white hover:bg-kid-primary/90"
                    onClick={() => updateQuantity(card.id, 1)}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Celebration Toast */}
      {progressPercent > 0 && progressPercent % 25 === 0 && (
        <div className="fixed bottom-4 right-4 animate-celebrate rounded-xl bg-kid-primary p-4 text-white shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <span className="font-medium">
              {progressPercent}% Complete!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
