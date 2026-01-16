'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { TutorialExampleSet, TutorialCardExample } from '@/lib/tutorialExamples';
import {
  PhotoIcon,
  SparklesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';

// ============================================================================
// TYPES
// ============================================================================

interface CardData {
  id: string;
  name: string;
  images: {
    small: string;
    large: string;
  };
  rarity?: string;
  number: string;
  set: {
    name: string;
  };
}

interface TutorialExampleCardsProps {
  /** The example set to display */
  exampleSet: TutorialExampleSet;
  /** Optional: Show as compact carousel vs expanded grid */
  variant?: 'carousel' | 'grid';
  /** Optional: Max cards to show initially (for grid) */
  maxVisible?: number;
  /** Optional: Show educational note */
  showNote?: boolean;
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

function ExampleCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[2.5/3.5] w-full rounded-lg bg-gray-200" />
      <div className="mt-2 space-y-1">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
      </div>
    </div>
  );
}

// ============================================================================
// SINGLE CARD COMPONENT
// ============================================================================

interface ExampleCardProps {
  example: TutorialCardExample;
  cardData: CardData | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

function ExampleCard({
  example,
  cardData,
  isLoading,
  error,
  onRetry,
  size = 'md',
}: ExampleCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const sizeClasses = {
    sm: 'w-24 sm:w-28',
    md: 'w-28 sm:w-32 md:w-36',
    lg: 'w-32 sm:w-40 md:w-48',
  };

  if (isLoading) {
    return (
      <div className={cn(sizeClasses[size])}>
        <ExampleCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(sizeClasses[size], 'flex flex-col items-center')}>
        <div className="flex aspect-[2.5/3.5] w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="p-2 text-center">
            <ExclamationTriangleIcon className="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
            <p className="mt-1 text-xs text-gray-500">Failed to load</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 text-xs text-kid-primary hover:underline focus:outline-none focus:ring-2 focus:ring-kid-primary focus:ring-offset-1"
                aria-label="Retry loading card"
              >
                <ArrowPathIcon className="mr-0.5 inline h-3 w-3" aria-hidden="true" />
                Retry
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-center text-xs font-medium text-gray-700">{example.label}</p>
      </div>
    );
  }

  if (!cardData) {
    return (
      <div className={cn(sizeClasses[size], 'flex flex-col items-center')}>
        <div className="flex aspect-[2.5/3.5] w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
          <PhotoIcon className="h-8 w-8 text-gray-300" aria-hidden="true" />
        </div>
        <p className="mt-2 text-center text-xs font-medium text-gray-700">{example.label}</p>
      </div>
    );
  }

  return (
    <div className={cn(sizeClasses[size], 'group relative flex flex-col')}>
      {/* Card image with hover effect */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="relative aspect-[2.5/3.5] w-full overflow-hidden rounded-lg shadow-md transition-all duration-200 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
        aria-label={`${cardData.name} - ${example.label}. Click for details.`}
        aria-expanded={showDetails}
      >
        <Image
          src={cardData.images.small}
          alt={`${cardData.name} - ${example.label}`}
          fill
          sizes="(max-width: 640px) 112px, (max-width: 768px) 128px, 144px"
          className="object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />

        {/* Label badge */}
        <div className="absolute left-1 top-1 rounded-full bg-gradient-to-r from-kid-primary to-kid-secondary px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
          {example.label}
        </div>

        {/* Info icon indicator */}
        <div className="absolute bottom-1 right-1 rounded-full bg-white/90 p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          <InformationCircleIcon className="h-4 w-4 text-gray-600" aria-hidden="true" />
        </div>
      </button>

      {/* Card details below image */}
      <div className="mt-2 text-center">
        <p className="line-clamp-1 text-xs font-medium text-gray-800">{cardData.name}</p>
        <p className="text-[10px] text-gray-500">
          {cardData.set.name} · #{cardData.number}
        </p>
      </div>

      {/* Expanded details panel */}
      {showDetails && (
        <div className="absolute left-1/2 top-full z-10 mt-2 w-48 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="text-xs text-gray-700">{example.description}</p>
          {example.highlight && (
            <div className="mt-2 flex items-start gap-1.5 rounded-md bg-amber-50 p-2">
              <SparklesIcon
                className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-500"
                aria-hidden="true"
              />
              <p className="text-[10px] font-medium text-amber-800">{example.highlight}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowDetails(false)}
            className="mt-2 w-full rounded-md bg-gray-100 py-1 text-xs text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-kid-primary"
            aria-label="Close details"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CAROUSEL VARIANT
// ============================================================================

interface CarouselProps {
  examples: TutorialCardExample[];
  cardDataMap: Map<string, CardData>;
  isLoading: boolean;
  errors: Map<string, string>;
  onRetry: (cardId: string) => void;
}

function ExampleCarousel({ examples, cardDataMap, isLoading, errors, onRetry }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? examples.length - 1 : prev - 1));
  }, [examples.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === examples.length - 1 ? 0 : prev + 1));
  }, [examples.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevious, handleNext]);

  if (examples.length === 0) return null;

  const currentExample = examples[currentIndex];
  const cardData = cardDataMap.get(currentExample.cardId) ?? null;
  const error = errors.get(currentExample.cardId) ?? null;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-4">
        {/* Previous button */}
        <button
          type="button"
          onClick={handlePrevious}
          disabled={examples.length <= 1}
          className={cn(
            'rounded-full p-2 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
            examples.length > 1
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'cursor-not-allowed bg-gray-50 text-gray-300'
          )}
          aria-label="Previous card"
        >
          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Current card */}
        <ExampleCard
          example={currentExample}
          cardData={cardData}
          isLoading={isLoading}
          error={error}
          onRetry={() => onRetry(currentExample.cardId)}
          size="lg"
        />

        {/* Next button */}
        <button
          type="button"
          onClick={handleNext}
          disabled={examples.length <= 1}
          className={cn(
            'rounded-full p-2 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
            examples.length > 1
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'cursor-not-allowed bg-gray-50 text-gray-300'
          )}
          aria-label="Next card"
        >
          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Carousel indicators */}
      {examples.length > 1 && (
        <div className="mt-3 flex gap-1.5" role="tablist" aria-label="Card examples">
          {examples.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-1',
                index === currentIndex ? 'w-4 bg-kid-primary' : 'bg-gray-300 hover:bg-gray-400'
              )}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TutorialExampleCards({
  exampleSet,
  variant = 'grid',
  maxVisible = 6,
  showNote = true,
}: TutorialExampleCardsProps) {
  const [cardDataMap, setCardDataMap] = useState<Map<string, CardData>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  // Fetch card data from API
  const fetchCards = useCallback(async (cardIds: string[]) => {
    if (cardIds.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Fetch from our cards API
      const response = await fetch(`/api/cards?ids=${cardIds.join(',')}`);

      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }

      const data = await response.json();
      const cards = data.cards as CardData[];

      const newMap = new Map<string, CardData>();
      for (const card of cards) {
        newMap.set(card.id, card);
      }

      setCardDataMap(newMap);

      // Track any cards that weren't returned
      const newErrors = new Map<string, string>();
      for (const id of cardIds) {
        if (!newMap.has(id)) {
          newErrors.set(id, 'Card not found');
        }
      }
      setErrors(newErrors);
    } catch (err) {
      // Mark all cards as errored
      const newErrors = new Map<string, string>();
      for (const id of cardIds) {
        newErrors.set(id, 'Failed to load');
      }
      setErrors(newErrors);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch cards on mount
  useEffect(() => {
    const cardIds = exampleSet.cards.map((c) => c.cardId);
    fetchCards(cardIds);
  }, [exampleSet.cards, fetchCards]);

  // Retry handler for individual cards
  const handleRetry = useCallback(
    (cardId: string) => {
      setErrors((prev) => {
        const newErrors = new Map(prev);
        newErrors.delete(cardId);
        return newErrors;
      });
      fetchCards([cardId]);
    },
    [fetchCards]
  );

  const visibleExamples =
    variant === 'grid' ? exampleSet.cards.slice(0, maxVisible) : exampleSet.cards;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <PhotoIcon className="h-5 w-5 text-kid-primary" aria-hidden="true" />
        <h3 className="font-semibold text-gray-900">{exampleSet.title}</h3>
      </div>

      {/* Educational note */}
      {showNote && exampleSet.educationalNote && (
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-3">
          <div className="flex items-start gap-2">
            <SparklesIcon
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500"
              aria-hidden="true"
            />
            <p className="text-sm text-indigo-800">{exampleSet.educationalNote}</p>
          </div>
        </div>
      )}

      {/* Cards display */}
      {variant === 'carousel' ? (
        <ExampleCarousel
          examples={visibleExamples}
          cardDataMap={cardDataMap}
          isLoading={isLoading}
          errors={errors}
          onRetry={handleRetry}
        />
      ) : (
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {visibleExamples.map((example) => (
            <ExampleCard
              key={example.cardId}
              example={example}
              cardData={cardDataMap.get(example.cardId) ?? null}
              isLoading={isLoading}
              error={errors.get(example.cardId) ?? null}
              onRetry={() => handleRetry(example.cardId)}
              size="md"
            />
          ))}
        </div>
      )}

      {/* Show more indicator for grid */}
      {variant === 'grid' && exampleSet.cards.length > maxVisible && (
        <p className="text-center text-xs text-gray-500">
          +{exampleSet.cards.length - maxVisible} more examples
        </p>
      )}
    </div>
  );
}

// ============================================================================
// SKELETON EXPORT
// ============================================================================

export function TutorialExampleCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* Title skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded bg-gray-200" />
        <div className="h-5 w-32 rounded bg-gray-200" />
      </div>

      {/* Note skeleton */}
      <div className="h-16 rounded-xl bg-gray-100" />

      {/* Cards skeleton */}
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="w-28 sm:w-32 md:w-36">
            <ExampleCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}
