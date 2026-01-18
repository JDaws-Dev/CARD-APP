'use client';

import { useState, useCallback, memo } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import { CardImage } from '@/components/ui/CardImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  SparklesIcon,
  ArrowPathIcon,
  LightBulbIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

type GameSlug = 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana';

type RecommendationType =
  | 'set_completion'
  | 'type_based'
  | 'similar_cards'
  | 'diversify'
  | 'wishlist_similar';

interface CardRecommendation {
  cardId: string;
  name: string;
  setId: string;
  setName: string;
  rarity: string;
  imageUrl: string;
  reason: string;
  recommendationType: RecommendationType;
  matchScore: number;
}

interface RecommendationResult {
  recommendations: CardRecommendation[];
  summary: string;
  collectionInsights: {
    favoriteTypes: string[];
    activeSets: string[];
    collectionStyle: string;
  };
  error?: string;
}

interface RecommendationsPanelProps {
  /** Maximum number of recommendations to show */
  limit?: number;
  /** Whether to show the header */
  showHeader?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show as compact cards */
  compact?: boolean;
}

/**
 * Skeleton loader for recommendations panel
 */
export const RecommendationsPanelSkeleton = memo(function RecommendationsPanelSkeleton({
  count = 4,
}: {
  count?: number;
}) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[2.5/3.5] w-full rounded-lg" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * Get display info for recommendation type
 */
function getRecommendationTypeDisplay(type: RecommendationType) {
  switch (type) {
    case 'set_completion':
      return {
        label: 'Complete your set!',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
      };
    case 'type_based':
      return {
        label: 'Matches your style!',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      };
    case 'similar_cards':
      return {
        label: "You'll love this!",
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      };
    case 'diversify':
      return {
        label: 'Try something new!',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      };
    case 'wishlist_similar':
      return {
        label: 'Like your wishlist!',
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
      };
    default:
      return {
        label: 'Recommended',
        color: 'text-kid-primary',
        bgColor: 'bg-kid-primary/10',
      };
  }
}

/**
 * Single recommendation card component
 */
const RecommendationCard = memo(function RecommendationCard({
  recommendation,
  compact = false,
}: {
  recommendation: CardRecommendation;
  compact?: boolean;
}) {
  const typeDisplay = getRecommendationTypeDisplay(recommendation.recommendationType);

  return (
    <Link
      href={`/sets/${recommendation.setId}`}
      className={cn(
        'group relative flex flex-col rounded-xl bg-white shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
        compact ? 'p-2' : 'p-3'
      )}
      aria-label={`${recommendation.name} from ${recommendation.setName}, ${typeDisplay.label}`}
    >
      {/* Match score badge */}
      <div
        className={cn(
          'absolute -right-1 -top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-xs font-bold text-white shadow-sm',
          compact && 'h-5 w-5 text-[10px]'
        )}
        title={`${recommendation.matchScore}% match`}
      >
        {recommendation.matchScore}
      </div>

      {/* Card image */}
      <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg">
        <CardImage
          src={recommendation.imageUrl}
          alt={recommendation.name}
          fill
          sizes="(max-width: 640px) 25vw, 15vw"
          className="object-contain transition-transform group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Card info */}
      <div className={cn('mt-2 min-w-0', compact && 'mt-1')}>
        <p
          className={cn(
            'truncate font-medium text-gray-800',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {recommendation.name}
        </p>
        <p className={cn('truncate text-gray-500', compact ? 'text-[10px]' : 'text-xs')}>
          {recommendation.setName}
        </p>
        {!compact && (
          <div
            className={cn(
              'mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              typeDisplay.bgColor,
              typeDisplay.color
            )}
          >
            <SparklesIcon className="h-3 w-3" />
            {typeDisplay.label}
          </div>
        )}
      </div>
    </Link>
  );
});

/**
 * RecommendationsPanel - Shows AI-powered card recommendations based on user's collection
 *
 * Features:
 * - Personalized recommendations based on collection patterns
 * - Multiple recommendation types (set completion, type-based, similar cards, etc.)
 * - Kid-friendly explanations for each recommendation
 * - Match scores to show how well cards fit the collection
 */
export const RecommendationsPanel = memo(function RecommendationsPanel({
  limit = 4,
  showHeader = true,
  className,
  compact = false,
}: RecommendationsPanelProps) {
  const { profileId, family, isLoading: profileLoading } = useCurrentProfile();
  const { primaryGame } = useGameSelector();
  const getRecommendations = useAction(api.ai.recommendations.getRecommendations);

  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load recommendations
  const loadRecommendations = useCallback(async () => {
    if (!profileId || !family?.id || isLoading) return;

    setIsLoading(true);
    try {
      const response = await getRecommendations({
        profileId: profileId as Id<'profiles'>,
        familyId: family.id as Id<'families'>,
        gameSlug: primaryGame.id as GameSlug,
        limit,
      });
      setResult(response);
      setHasLoaded(true);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      setResult({
        recommendations: [],
        summary: 'Unable to load recommendations right now. Try again later!',
        collectionInsights: {
          favoriteTypes: [],
          activeSets: [],
          collectionStyle: '',
        },
        error: 'Failed to load recommendations',
      });
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [profileId, family?.id, isLoading, getRecommendations, primaryGame.id, limit]);

  // Refresh recommendations
  const handleRefresh = useCallback(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  // Profile loading state
  if (profileLoading) {
    return (
      <section className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>
        {showHeader && (
          <div className="mb-4 flex items-center gap-2">
            <LightBulbIcon className="h-5 w-5 text-kid-secondary" />
            <h3 className="font-semibold text-gray-800">Cards You Might Like</h3>
          </div>
        )}
        <RecommendationsPanelSkeleton count={limit} />
      </section>
    );
  }

  // Not logged in state
  if (!profileId) {
    return (
      <section className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>
        {showHeader && (
          <div className="mb-4 flex items-center gap-2">
            <LightBulbIcon className="h-5 w-5 text-kid-secondary" />
            <h3 className="font-semibold text-gray-800">Cards You Might Like</h3>
          </div>
        )}
        <div className="py-6 text-center">
          <LightBulbIcon className="mx-auto mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">Sign in to see personalized recommendations</p>
        </div>
      </section>
    );
  }

  // Initial state - not yet loaded
  if (!hasLoaded && !isLoading) {
    return (
      <section className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>
        {showHeader && (
          <div className="mb-4 flex items-center gap-2">
            <LightBulbIcon className="h-5 w-5 text-kid-secondary" />
            <h3 className="font-semibold text-gray-800">Cards You Might Like</h3>
          </div>
        )}
        <div className="py-6 text-center">
          <div className="mb-4">
            <SparklesIcon className="mx-auto h-12 w-12 text-kid-secondary/50" />
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Discover cards that match your collection style!
          </p>
          <button
            onClick={loadRecommendations}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-kid-primary to-kid-secondary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <SparklesIcon className="h-4 w-4" />
            Get Recommendations
          </button>
        </div>
      </section>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <section className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>
        {showHeader && (
          <div className="mb-4 flex items-center gap-2">
            <LightBulbIcon className="h-5 w-5 text-kid-secondary" />
            <h3 className="font-semibold text-gray-800">Cards You Might Like</h3>
          </div>
        )}
        <RecommendationsPanelSkeleton count={limit} />
      </section>
    );
  }

  // Error state
  if (result?.error && result.recommendations.length === 0) {
    return (
      <section className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>
        {showHeader && (
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LightBulbIcon className="h-5 w-5 text-kid-secondary" />
              <h3 className="font-semibold text-gray-800">Cards You Might Like</h3>
            </div>
          </div>
        )}
        <div className="py-6 text-center">
          <SparklesIcon className="mx-auto mb-2 h-10 w-10 text-gray-300" />
          <p className="mb-2 text-sm text-gray-600">{result.summary}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 inline-flex items-center gap-1 text-sm text-kid-primary hover:underline"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Try again
          </button>
        </div>
      </section>
    );
  }

  // Empty recommendations (need more cards)
  if (result && result.recommendations.length === 0) {
    return (
      <section className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>
        {showHeader && (
          <div className="mb-4 flex items-center gap-2">
            <LightBulbIcon className="h-5 w-5 text-kid-secondary" />
            <h3 className="font-semibold text-gray-800">Cards You Might Like</h3>
          </div>
        )}
        <div className="py-6 text-center">
          <SparklesIcon className="mx-auto mb-2 h-10 w-10 text-kid-secondary/50" />
          <p className="text-sm text-gray-600">{result.summary}</p>
          <Link
            href="/sets"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-kid-primary hover:underline"
          >
            Browse Sets
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  // Loaded with recommendations
  return (
    <section
      className={cn('rounded-xl bg-white p-4 shadow-sm', className)}
      aria-label={`Card recommendations, ${result?.recommendations.length ?? 0} cards`}
    >
      {showHeader && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LightBulbIcon className="h-5 w-5 text-kid-secondary" aria-hidden="true" />
            <h3 className="font-semibold text-gray-800" id="recommendations-heading">
              Cards You Might Like
            </h3>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Refresh recommendations"
          >
            <ArrowPathIcon className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      )}

      {/* Summary */}
      {result?.summary && (
        <p className="mb-4 text-sm text-gray-600" aria-live="polite">
          {result.summary}
        </p>
      )}

      {/* Recommendations grid */}
      <div
        className={cn(
          'grid gap-3',
          compact ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'
        )}
        role="list"
        aria-labelledby={showHeader ? 'recommendations-heading' : undefined}
      >
        {result?.recommendations.map((rec) => (
          <div key={rec.cardId} role="listitem">
            <RecommendationCard recommendation={rec} compact={compact} />
          </div>
        ))}
      </div>

      {/* Collection insights (for non-compact mode) */}
      {!compact && result?.collectionInsights && result.collectionInsights.favoriteTypes.length > 0 && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-500">Your Collection Style</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {result.collectionInsights.favoriteTypes.slice(0, 3).map((type) => (
              <span
                key={type}
                className="inline-flex items-center rounded-full bg-kid-primary/10 px-2 py-0.5 text-xs font-medium text-kid-primary"
              >
                {type}
              </span>
            ))}
            {result.collectionInsights.collectionStyle && (
              <span className="inline-flex items-center rounded-full bg-kid-secondary/10 px-2 py-0.5 text-xs font-medium text-kid-secondary">
                {result.collectionInsights.collectionStyle}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
});
