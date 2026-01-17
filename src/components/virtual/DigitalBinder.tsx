'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/components/providers/ReducedMotionProvider';
import type { PokemonCard } from '@/lib/pokemon-tcg';
import {
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  SparklesIcon,
  SwatchIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/solid';
import {
  FireIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

// Binder cover themes based on Pokemon types and starters
const BINDER_THEMES = [
  { id: 'classic', name: 'Classic', gradient: 'from-slate-800 via-slate-700 to-slate-900', accent: 'bg-slate-600', icon: BookOpenIcon },
  { id: 'fire', name: 'Fire Type', gradient: 'from-red-600 via-orange-500 to-red-700', accent: 'bg-orange-400', icon: FireIcon },
  { id: 'water', name: 'Water Type', gradient: 'from-blue-600 via-cyan-500 to-blue-700', accent: 'bg-cyan-400', icon: SparklesIcon },
  { id: 'grass', name: 'Grass Type', gradient: 'from-green-600 via-emerald-500 to-green-700', accent: 'bg-emerald-400', icon: SparklesIcon },
  { id: 'electric', name: 'Electric Type', gradient: 'from-yellow-500 via-amber-400 to-yellow-600', accent: 'bg-amber-300', icon: BoltIcon },
  { id: 'psychic', name: 'Psychic Type', gradient: 'from-purple-600 via-pink-500 to-purple-700', accent: 'bg-pink-400', icon: SparklesIcon },
  { id: 'dragon', name: 'Dragon Type', gradient: 'from-indigo-700 via-violet-600 to-indigo-800', accent: 'bg-violet-400', icon: SparklesIcon },
  { id: 'charmander', name: 'Charmander', gradient: 'from-orange-500 via-red-400 to-orange-600', accent: 'bg-red-300', icon: FireIcon },
  { id: 'squirtle', name: 'Squirtle', gradient: 'from-sky-500 via-blue-400 to-sky-600', accent: 'bg-blue-300', icon: SparklesIcon },
  { id: 'bulbasaur', name: 'Bulbasaur', gradient: 'from-teal-500 via-green-400 to-teal-600', accent: 'bg-green-300', icon: SparklesIcon },
  { id: 'pikachu', name: 'Pikachu', gradient: 'from-yellow-400 via-amber-300 to-yellow-500', accent: 'bg-amber-200', icon: BoltIcon },
  { id: 'eevee', name: 'Eevee', gradient: 'from-amber-600 via-yellow-500 to-amber-700', accent: 'bg-yellow-400', icon: SparklesIcon },
] as const;

const CARDS_PER_PAGE = 9; // 3x3 grid per page

interface CardWithQuantity extends PokemonCard {
  quantity: number;
}

interface DigitalBinderProps {
  cards: CardWithQuantity[];
  isOpen: boolean;
  onClose: () => void;
}

type BinderTheme = (typeof BINDER_THEMES)[number];

export function DigitalBinder({ cards, isOpen, onClose }: DigitalBinderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<BinderTheme>(BINDER_THEMES[0]);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right' | null>(null);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const reducedMotion = useReducedMotion();

  // Split cards into pages (2 pages visible at once - left and right)
  const pages = useMemo(() => {
    const result: CardWithQuantity[][] = [];
    for (let i = 0; i < cards.length; i += CARDS_PER_PAGE) {
      result.push(cards.slice(i, i + CARDS_PER_PAGE));
    }
    // Ensure even number of pages for spreads
    if (result.length % 2 !== 0) {
      result.push([]);
    }
    return result;
  }, [cards]);

  const totalSpreads = Math.ceil(pages.length / 2);
  const currentSpread = Math.floor(currentPage / 2);

  const goToNextPage = useCallback(() => {
    if (currentSpread >= totalSpreads - 1 || isFlipping) return;

    setFlipDirection('right');
    setIsFlipping(true);

    const duration = reducedMotion ? 0 : 600;
    setTimeout(() => {
      setCurrentPage((prev) => Math.min(prev + 2, pages.length - 2));
      setIsFlipping(false);
      setFlipDirection(null);
    }, duration);
  }, [currentSpread, totalSpreads, isFlipping, reducedMotion, pages.length]);

  const goToPrevPage = useCallback(() => {
    if (currentSpread <= 0 || isFlipping) return;

    setFlipDirection('left');
    setIsFlipping(true);

    const duration = reducedMotion ? 0 : 600;
    setTimeout(() => {
      setCurrentPage((prev) => Math.max(prev - 2, 0));
      setIsFlipping(false);
      setFlipDirection(null);
    }, duration);
  }, [currentSpread, isFlipping, reducedMotion]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') goToNextPage();
    if (e.key === 'ArrowLeft') goToPrevPage();
    if (e.key === 'Escape') onClose();
  }, [goToNextPage, goToPrevPage, onClose]);

  if (!isOpen) return null;

  const leftPageIndex = currentPage;
  const rightPageIndex = currentPage + 1;
  const leftPage = pages[leftPageIndex] || [];
  const rightPage = pages[rightPageIndex] || [];

  const ThemeIcon = selectedTheme.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Digital card binder"
      tabIndex={-1}
    >
      {/* Theme selector panel */}
      {showThemeSelector && (
        <div
          className="absolute right-4 top-4 z-60 w-64 rounded-xl bg-white p-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Binder Theme</h3>
            <button
              onClick={() => setShowThemeSelector(false)}
              className="rounded-full p-1 hover:bg-gray-100"
              aria-label="Close theme selector"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BINDER_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  setSelectedTheme(theme);
                  setShowThemeSelector(false);
                }}
                className={cn(
                  'relative flex h-16 flex-col items-center justify-center rounded-lg bg-gradient-to-br p-2 transition-all hover:scale-105',
                  theme.gradient,
                  selectedTheme.id === theme.id && 'ring-2 ring-white ring-offset-2'
                )}
                aria-label={theme.name}
                aria-pressed={selectedTheme.id === theme.id}
              >
                <theme.icon className="h-5 w-5 text-white/80" />
                <span className="mt-1 text-[10px] font-medium text-white/90">{theme.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Binder container */}
      <div
        className="relative flex max-h-[90vh] max-w-6xl"
        onClick={(e) => e.stopPropagation()}
        style={{ perspective: '2000px' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -right-3 -top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-100"
          aria-label="Close binder"
        >
          <XMarkIcon className="h-6 w-6 text-gray-700" />
        </button>

        {/* Theme selector button */}
        <button
          onClick={() => setShowThemeSelector(!showThemeSelector)}
          className="absolute -left-3 -top-3 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-100"
          aria-label="Change binder theme"
          aria-expanded={showThemeSelector}
        >
          <SwatchIcon className="h-6 w-6 text-gray-700" />
        </button>

        {/* Binder spine */}
        <div
          className={cn(
            'absolute left-1/2 top-0 h-full w-8 -translate-x-1/2 rounded bg-gradient-to-b shadow-inner',
            selectedTheme.gradient
          )}
          style={{ zIndex: 5 }}
        >
          {/* Rings */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="absolute left-1/2 h-3 w-6 -translate-x-1/2 rounded-full border-2 border-gray-400 bg-gray-300"
              style={{ top: `${15 + i * 15}%` }}
            />
          ))}
        </div>

        {/* Left page */}
        <div
          className={cn(
            'relative h-[70vh] w-[45vw] max-w-xl origin-right rounded-l-lg bg-gradient-to-br p-1 shadow-xl',
            selectedTheme.gradient
          )}
        >
          <div className="flex h-full flex-col rounded-l-md bg-white p-4">
            {/* Page header with icon */}
            <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex items-center gap-2">
                <ThemeIcon className={cn('h-5 w-5', selectedTheme.id === 'classic' ? 'text-gray-600' : 'text-gray-500')} />
                <span className="text-sm font-medium text-gray-500">Page {leftPageIndex + 1}</span>
              </div>
              <span className="text-xs text-gray-400">{cards.length} cards</span>
            </div>

            {/* Card grid */}
            <div className="grid flex-1 grid-cols-3 gap-2">
              {leftPage.map((card, idx) => (
                <div
                  key={`${card.id}-${idx}`}
                  className="group relative aspect-[2.5/3.5] overflow-hidden rounded-lg bg-gray-100 shadow-sm transition-all hover:shadow-md"
                >
                  <Image
                    src={card.images.small}
                    alt={card.name}
                    fill
                    sizes="15vw"
                    className="object-contain p-1"
                  />
                  {card.quantity > 1 && (
                    <div className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-kid-primary px-1 text-xs font-bold text-white shadow">
                      x{card.quantity}
                    </div>
                  )}
                </div>
              ))}
              {/* Empty slots */}
              {Array.from({ length: CARDS_PER_PAGE - leftPage.length }).map((_, idx) => (
                <div
                  key={`empty-left-${idx}`}
                  className="aspect-[2.5/3.5] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50"
                />
              ))}
            </div>
          </div>

          {/* Page turn overlay for animation */}
          {isFlipping && flipDirection === 'left' && !reducedMotion && (
            <div
              className={cn(
                'absolute inset-0 origin-right rounded-l-lg bg-gradient-to-br shadow-xl',
                selectedTheme.gradient,
                'animate-page-turn-left'
              )}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="h-full rounded-l-md bg-white" />
            </div>
          )}
        </div>

        {/* Right page */}
        <div
          className={cn(
            'relative h-[70vh] w-[45vw] max-w-xl origin-left rounded-r-lg bg-gradient-to-br p-1 shadow-xl',
            selectedTheme.gradient
          )}
        >
          <div className="flex h-full flex-col rounded-r-md bg-white p-4">
            {/* Page header */}
            <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="text-sm font-medium text-gray-500">Page {rightPageIndex + 1}</span>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span>{currentSpread + 1} of {totalSpreads}</span>
              </div>
            </div>

            {/* Card grid */}
            <div className="grid flex-1 grid-cols-3 gap-2">
              {rightPage.map((card, idx) => (
                <div
                  key={`${card.id}-${idx}`}
                  className="group relative aspect-[2.5/3.5] overflow-hidden rounded-lg bg-gray-100 shadow-sm transition-all hover:shadow-md"
                >
                  <Image
                    src={card.images.small}
                    alt={card.name}
                    fill
                    sizes="15vw"
                    className="object-contain p-1"
                  />
                  {card.quantity > 1 && (
                    <div className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-kid-primary px-1 text-xs font-bold text-white shadow">
                      x{card.quantity}
                    </div>
                  )}
                </div>
              ))}
              {/* Empty slots */}
              {Array.from({ length: CARDS_PER_PAGE - rightPage.length }).map((_, idx) => (
                <div
                  key={`empty-right-${idx}`}
                  className="aspect-[2.5/3.5] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50"
                />
              ))}
            </div>
          </div>

          {/* Page turn overlay for animation */}
          {isFlipping && flipDirection === 'right' && !reducedMotion && (
            <div
              className={cn(
                'absolute inset-0 origin-left rounded-r-lg bg-gradient-to-br shadow-xl',
                selectedTheme.gradient,
                'animate-page-turn-right'
              )}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="h-full rounded-r-md bg-white" />
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <button
          onClick={goToPrevPage}
          disabled={currentSpread <= 0 || isFlipping}
          className={cn(
            'absolute left-0 top-1/2 -translate-x-14 -translate-y-1/2 rounded-full bg-white p-3 shadow-lg transition-all hover:bg-gray-100',
            (currentSpread <= 0 || isFlipping) && 'cursor-not-allowed opacity-40'
          )}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
        </button>

        <button
          onClick={goToNextPage}
          disabled={currentSpread >= totalSpreads - 1 || isFlipping}
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 rounded-full bg-white p-3 shadow-lg transition-all hover:bg-gray-100',
            (currentSpread >= totalSpreads - 1 || isFlipping) && 'cursor-not-allowed opacity-40'
          )}
          aria-label="Next page"
        >
          <ChevronRightIcon className="h-6 w-6 text-gray-700" />
        </button>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4 text-sm text-white/60">
        <span className="flex items-center gap-1">
          <ArrowLeftIcon className="h-4 w-4" />
          <ArrowRightIcon className="h-4 w-4" />
          Navigate
        </span>
        <span>ESC to close</span>
      </div>
    </div>
  );
}

// Button to open the binder from collection view
interface DigitalBinderButtonProps {
  onClick: () => void;
}

export function DigitalBinderButton({ onClick }: DigitalBinderButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-4 py-2 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
      aria-label="Open digital binder view"
    >
      <BookOpenIcon className="h-5 w-5" />
      <span>View in Binder</span>
    </button>
  );
}
