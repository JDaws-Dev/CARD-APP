'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  LightBulbIcon,
  ArrowTrendingDownIcon,
  SparklesIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ChevronRightIcon,
  HeartIcon,
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { PokemonCard } from '@/lib/pokemon-tcg';

// ============================================================================
// TYPES
// ============================================================================

interface BudgetAlternativesProps {
  /** The expensive card to find alternatives for */
  card: PokemonCard;
  /** Callback when user wants to add an alternative to wishlist */
  onAddToWishlist?: (cardId: string) => void;
  /** Set of currently wishlisted card IDs */
  wishlistedCardIds?: Set<string>;
  /** Optional className for container */
  className?: string;
}

interface AlternativeCard extends PokemonCard {
  priceComparison: {
    savings: number;
    savingsPercent: number;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get the best available market price from a card's TCGPlayer prices
 */
function getCardMarketPrice(card: PokemonCard): number | null {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;

  return (
    prices.normal?.market ?? prices.holofoil?.market ?? prices.reverseHolofoil?.market ?? null
  );
}

/**
 * Format price as currency string
 */
function formatPrice(price: number): string {
  if (price >= 1000) {
    return `$${(price / 1000).toFixed(1)}k`;
  }
  if (price >= 100) {
    return `$${Math.round(price)}`;
  }
  return `$${price.toFixed(2)}`;
}

/**
 * Extract the base Pokemon name from a card name
 * e.g., "Charizard ex" -> "Charizard", "Pikachu V" -> "Pikachu"
 */
function getBasePokemonName(cardName: string): string {
  // Remove common suffixes like "ex", "V", "VMAX", "VSTAR", "GX", etc.
  const suffixes = [
    ' ex',
    ' EX',
    ' V',
    ' VMAX',
    ' VSTAR',
    ' GX',
    ' Tag Team',
    ' BREAK',
    ' Prism Star',
    "'s ",
    ' δ',
    ' LV.X',
  ];

  let baseName = cardName;
  for (const suffix of suffixes) {
    const index = baseName.indexOf(suffix);
    if (index > 0) {
      baseName = baseName.substring(0, index);
      break;
    }
  }

  return baseName.trim();
}

// ============================================================================
// ALTERNATIVE CARD COMPONENT
// ============================================================================

function AlternativeCardItem({
  card,
  originalPrice,
  onAddToWishlist,
  isWishlisted,
}: {
  card: AlternativeCard;
  originalPrice: number;
  onAddToWishlist?: (cardId: string) => void;
  isWishlisted: boolean;
}) {
  const price = getCardMarketPrice(card);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3 shadow-sm transition hover:bg-white/90">
      {/* Card Image */}
      <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg">
        <Image
          src={card.images.small}
          alt={card.name}
          fill
          sizes="56px"
          className="object-contain"
        />
      </div>

      {/* Card Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-800">{card.name}</p>
        <p className="truncate text-xs text-gray-500">{card.set.name}</p>
        <div className="mt-1 flex items-center gap-2">
          {price !== null && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              <CurrencyDollarIcon className="h-3 w-3" />
              {formatPrice(price)}
            </span>
          )}
          <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            <ArrowTrendingDownIcon className="h-3 w-3" />
            Save {formatPrice(card.priceComparison.savings)}
          </span>
        </div>
      </div>

      {/* Add to Wishlist Button */}
      {onAddToWishlist && (
        <button
          onClick={() => onAddToWishlist(card.id)}
          disabled={isWishlisted}
          className={cn(
            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition',
            isWishlisted
              ? 'bg-rose-100 text-rose-500'
              : 'bg-gray-100 text-gray-400 hover:bg-rose-100 hover:text-rose-500'
          )}
          aria-label={isWishlisted ? 'Already on wishlist' : `Add ${card.name} to wishlist`}
        >
          {isWishlisted ? (
            <HeartIcon className="h-5 w-5" />
          ) : (
            <HeartIconOutline className="h-5 w-5" />
          )}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BudgetAlternatives({
  card,
  onAddToWishlist,
  wishlistedCardIds = new Set(),
  className,
}: BudgetAlternativesProps) {
  const [alternatives, setAlternatives] = useState<AlternativeCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const originalPrice = getCardMarketPrice(card);

  // Only show for cards with a price above threshold
  const shouldShow = originalPrice !== null && originalPrice >= 5;

  // Search for alternatives when expanded
  useEffect(() => {
    if (!isExpanded || !shouldShow || !originalPrice) return;

    const fetchAlternatives = async () => {
      setIsLoading(true);
      try {
        const baseName = getBasePokemonName(card.name);
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(baseName)}&limit=30`
        );

        if (response.ok) {
          const searchResults: PokemonCard[] = await response.json();

          // Filter and process alternatives
          const processedAlternatives: AlternativeCard[] = searchResults
            .filter((result) => {
              // Exclude the same card
              if (result.id === card.id) return false;

              const price = getCardMarketPrice(result);
              // Must have a price and be cheaper
              if (price === null || price >= originalPrice) return false;
              // Must be at least 20% cheaper to be meaningful
              if (price > originalPrice * 0.8) return false;

              return true;
            })
            .map((result) => {
              const price = getCardMarketPrice(result)!;
              return {
                ...result,
                priceComparison: {
                  savings: originalPrice - price,
                  savingsPercent: Math.round(((originalPrice - price) / originalPrice) * 100),
                },
              };
            })
            // Sort by savings (highest first)
            .sort((a, b) => b.priceComparison.savings - a.priceComparison.savings)
            // Take top 5
            .slice(0, 5);

          setAlternatives(processedAlternatives);
        }
      } catch (err) {
        console.error('Failed to fetch alternatives:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlternatives();
  }, [isExpanded, shouldShow, card.id, card.name, originalPrice]);

  if (!shouldShow) return null;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-sm',
        className
      )}
    >
      {/* Header Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left transition hover:bg-white/30"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 shadow-md">
            <LightBulbIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Budget-Friendly Alternatives</h3>
            <p className="text-sm text-gray-500">Find similar cards that cost less</p>
          </div>
        </div>
        <ChevronRightIcon
          className={cn(
            'h-5 w-5 text-gray-400 transition-transform',
            isExpanded && 'rotate-90'
          )}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-white/50 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-gray-500">
              <SparklesIcon className="h-5 w-5 animate-pulse" />
              <span className="text-sm">Searching for alternatives...</span>
            </div>
          ) : alternatives.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Found {alternatives.length} cheaper version{alternatives.length !== 1 ? 's' : ''} of{' '}
                <span className="font-medium">{getBasePokemonName(card.name)}</span>:
              </p>
              {alternatives.map((alt) => (
                <AlternativeCardItem
                  key={alt.id}
                  card={alt}
                  originalPrice={originalPrice!}
                  onAddToWishlist={onAddToWishlist}
                  isWishlisted={wishlistedCardIds.has(alt.id)}
                />
              ))}
              <p className="mt-3 text-center text-xs text-gray-400">
                Same Pokemon, smaller price tag!
              </p>
            </div>
          ) : (
            <div className="py-6 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">
                No cheaper alternatives found for this card.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                This might already be a good value!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPACT INLINE VERSION (for wishlist cards)
// ============================================================================

interface BudgetAlternativesBadgeProps {
  card: PokemonCard;
  onClick?: () => void;
  className?: string;
}

export function BudgetAlternativesBadge({ card, onClick, className }: BudgetAlternativesBadgeProps) {
  const price = getCardMarketPrice(card);

  // Only show for expensive cards (>= $5)
  if (price === null || price < 5) return null;

  // Estimate potential savings based on price tier
  // Higher priced cards typically have more alternatives with bigger savings
  const estimatedSavings = price >= 50 ? 60 : price >= 20 ? 50 : price >= 10 ? 40 : 30;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
        'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md',
        'hover:from-emerald-500 hover:to-teal-600 hover:shadow-lg hover:scale-105',
        'animate-pulse hover:animate-none',
        className
      )}
      aria-label={`Find budget alternatives for ${card.name} - Save up to ${estimatedSavings}%`}
    >
      <ArrowTrendingDownIcon className="h-4 w-4" />
      <span>Save up to {estimatedSavings}%</span>
    </button>
  );
}
