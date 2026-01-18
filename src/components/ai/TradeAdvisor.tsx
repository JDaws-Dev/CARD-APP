'use client';

import { useState, useCallback, memo } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import { useHidePrices } from '@/hooks/useHidePrices';
import { CardImage } from '@/components/ui/CardImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  ArrowsRightLeftIcon,
  ArrowPathIcon,
  SparklesIcon,
  ScaleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

type GameSlug = 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana';

type FairnessRating = 'very_fair' | 'fair' | 'slightly_uneven' | 'uneven';
type TradeType = 'duplicate_swap' | 'wishlist_match' | 'set_completion' | 'type_match';

interface TradeCard {
  cardId: string;
  name: string;
  setId: string;
  setName: string;
  rarity: string;
  imageUrl: string;
  marketPrice: number | null;
  types: string[];
}

interface TradeSuggestion {
  fromProfile: {
    profileId: string;
    displayName: string;
    cards: TradeCard[];
    totalValue: number;
  };
  toProfile: {
    profileId: string;
    displayName: string;
    cards: TradeCard[];
    totalValue: number;
  };
  fairnessRating: FairnessRating;
  valueDifference: number;
  reason: string;
  tradeType: TradeType;
}

interface TradeAdvisorResult {
  suggestions: TradeSuggestion[];
  summary: string;
  analysisInsights: {
    profileA: {
      displayName: string;
      duplicateCount: number;
      wishlistMatchCount: number;
      favoriteTypes: string[];
    };
    profileB: {
      displayName: string;
      duplicateCount: number;
      wishlistMatchCount: number;
      favoriteTypes: string[];
    };
    overlapCount: number;
  };
  error?: string;
}

interface TradeAdvisorProps {
  /** The family ID to get trade suggestions for */
  familyId: Id<'families'>;
  /** Maximum number of trade suggestions to show */
  maxSuggestions?: number;
  /** Whether to show the header */
  showHeader?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether to start expanded */
  defaultExpanded?: boolean;
}

/**
 * Skeleton loader for trade advisor
 */
export const TradeAdvisorSkeleton = memo(function TradeAdvisorSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-12 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-16 w-12 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * Get display info for fairness rating
 */
function getFairnessDisplay(rating: FairnessRating) {
  switch (rating) {
    case 'very_fair':
      return {
        label: 'Super Fair!',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        icon: CheckCircleIcon,
      };
    case 'fair':
      return {
        label: 'Fair Trade',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: CheckCircleIcon,
      };
    case 'slightly_uneven':
      return {
        label: 'Almost Even',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        icon: ScaleIcon,
      };
    case 'uneven':
      return {
        label: 'Uneven',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        icon: ExclamationTriangleIcon,
      };
    default:
      return {
        label: 'Trade',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        icon: ArrowsRightLeftIcon,
      };
  }
}

/**
 * Get display info for trade type
 */
function getTradeTypeDisplay(type: TradeType) {
  switch (type) {
    case 'duplicate_swap':
      return { label: 'Duplicate Swap', emoji: '🔄' };
    case 'wishlist_match':
      return { label: 'Wishlist Match', emoji: '💝' };
    case 'set_completion':
      return { label: 'Complete Sets', emoji: '🎯' };
    case 'type_match':
      return { label: 'Type Match', emoji: '✨' };
    default:
      return { label: 'Trade', emoji: '🤝' };
  }
}

/**
 * Single trade card display
 */
const TradeCardItem = memo(function TradeCardItem({
  card,
  showPrice = true,
}: {
  card: TradeCard;
  showPrice?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative aspect-[2.5/3.5] w-12 overflow-hidden rounded-lg shadow-sm sm:w-14">
        <CardImage
          src={card.imageUrl}
          alt={card.name}
          fill
          sizes="56px"
          className="object-contain"
          loading="lazy"
        />
      </div>
      <p className="mt-1 max-w-[56px] truncate text-center text-[10px] font-medium text-gray-700">
        {card.name}
      </p>
      {showPrice && card.marketPrice !== null && (
        <p className="text-[9px] text-gray-400">${card.marketPrice.toFixed(2)}</p>
      )}
    </div>
  );
});

/**
 * Single trade suggestion card
 */
const TradeSuggestionCard = memo(function TradeSuggestionCard({
  suggestion,
  hidePrices = false,
}: {
  suggestion: TradeSuggestion;
  hidePrices?: boolean;
}) {
  const fairnessDisplay = getFairnessDisplay(suggestion.fairnessRating);
  const tradeTypeDisplay = getTradeTypeDisplay(suggestion.tradeType);
  const FairnessIcon = fairnessDisplay.icon;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 transition-all hover:shadow-md sm:p-4">
      {/* Trade type and fairness badges */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-gray-500">
          {tradeTypeDisplay.emoji} {tradeTypeDisplay.label}
        </span>
        <div
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            fairnessDisplay.bgColor,
            fairnessDisplay.color
          )}
        >
          <FairnessIcon className="h-3 w-3" />
          {fairnessDisplay.label}
        </div>
      </div>

      {/* Trade visualization */}
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {/* From profile cards */}
        <div className="flex-1">
          <p className="mb-2 truncate text-center text-xs font-semibold text-kid-primary">
            {suggestion.fromProfile.displayName}
          </p>
          <div className="flex flex-wrap justify-center gap-1">
            {suggestion.fromProfile.cards.map((card) => (
              <TradeCardItem key={card.cardId} card={card} showPrice={!hidePrices} />
            ))}
          </div>
          {!hidePrices && (
            <p className="mt-1 text-center text-[10px] text-gray-400">
              ${suggestion.fromProfile.totalValue.toFixed(2)}
            </p>
          )}
        </div>

        {/* Trade arrow */}
        <div className="flex flex-col items-center">
          <ArrowsRightLeftIcon className="h-6 w-6 text-gray-300" />
          {!hidePrices && suggestion.valueDifference > 0 && (
            <span className="mt-1 text-[9px] text-gray-400">
              ${suggestion.valueDifference.toFixed(2)} diff
            </span>
          )}
        </div>

        {/* To profile cards */}
        <div className="flex-1">
          <p className="mb-2 truncate text-center text-xs font-semibold text-kid-secondary">
            {suggestion.toProfile.displayName}
          </p>
          <div className="flex flex-wrap justify-center gap-1">
            {suggestion.toProfile.cards.map((card) => (
              <TradeCardItem key={card.cardId} card={card} showPrice={!hidePrices} />
            ))}
          </div>
          {!hidePrices && (
            <p className="mt-1 text-center text-[10px] text-gray-400">
              ${suggestion.toProfile.totalValue.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {/* Reason */}
      <p className="mt-3 text-center text-xs text-gray-600">{suggestion.reason}</p>
    </div>
  );
});

/**
 * Profile selector for choosing which sibling to compare
 */
interface ProfileSelectorProps {
  profiles: Array<{ _id: Id<'profiles'>; displayName: string }>;
  selectedA: Id<'profiles'> | null;
  selectedB: Id<'profiles'> | null;
  onSelectA: (id: Id<'profiles'>) => void;
  onSelectB: (id: Id<'profiles'>) => void;
}

const ProfileSelector = memo(function ProfileSelector({
  profiles,
  selectedA,
  selectedB,
  onSelectA,
  onSelectB,
}: ProfileSelectorProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-gray-500">First Collector</label>
        <select
          value={selectedA ?? ''}
          onChange={(e) => onSelectA(e.target.value as Id<'profiles'>)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-kid-primary focus:outline-none focus:ring-1 focus:ring-kid-primary"
        >
          <option value="">Select...</option>
          {profiles.map((p) => (
            <option key={p._id} value={p._id} disabled={p._id === selectedB}>
              {p.displayName}
            </option>
          ))}
        </select>
      </div>

      <ArrowsRightLeftIcon className="mx-auto h-5 w-5 text-gray-300 sm:mt-5" />

      <div className="flex-1">
        <label className="mb-1 block text-xs font-medium text-gray-500">Second Collector</label>
        <select
          value={selectedB ?? ''}
          onChange={(e) => onSelectB(e.target.value as Id<'profiles'>)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-kid-secondary focus:outline-none focus:ring-1 focus:ring-kid-secondary"
        >
          <option value="">Select...</option>
          {profiles.map((p) => (
            <option key={p._id} value={p._id} disabled={p._id === selectedA}>
              {p.displayName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});

/**
 * TradeAdvisor - AI-powered trade suggestions between siblings
 *
 * Features:
 * - Analyzes collections to find fair trades between siblings
 * - Shows trade fairness ratings based on market values
 * - Provides kid-friendly explanations for each suggestion
 * - Supports multiple game types (Pokemon, Yu-Gi-Oh, etc.)
 */
export const TradeAdvisor = memo(function TradeAdvisor({
  familyId,
  maxSuggestions = 5,
  showHeader = true,
  className,
  defaultExpanded = true,
}: TradeAdvisorProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const { primaryGame } = useGameSelector();
  const { hidePrices } = useHidePrices();
  const getTradeSuggestions = useAction(api.ai.tradeAdvisor.getTradeSuggestions);

  // Fetch family profiles
  const profiles = useQuery(api.profiles.getProfilesByFamily, { familyId });

  const [result, setResult] = useState<TradeAdvisorResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedProfileA, setSelectedProfileA] = useState<Id<'profiles'> | null>(null);
  const [selectedProfileB, setSelectedProfileB] = useState<Id<'profiles'> | null>(null);

  // Auto-select first two profiles when available
  const autoSelectProfiles = useCallback(() => {
    if (profiles && profiles.length >= 2 && !selectedProfileA && !selectedProfileB) {
      setSelectedProfileA(profiles[0]._id);
      setSelectedProfileB(profiles[1]._id);
    }
  }, [profiles, selectedProfileA, selectedProfileB]);

  // Run auto-select when profiles load
  if (profiles && profiles.length >= 2 && !selectedProfileA && !selectedProfileB) {
    autoSelectProfiles();
  }

  // Load trade suggestions
  const loadSuggestions = useCallback(async () => {
    if (!selectedProfileA || !selectedProfileB || isLoading) return;

    setIsLoading(true);
    try {
      const response = await getTradeSuggestions({
        profileIdA: selectedProfileA,
        profileIdB: selectedProfileB,
        familyId,
        gameSlug: primaryGame.id as GameSlug,
        maxSuggestions,
      });
      setResult(response);
      setHasLoaded(true);
    } catch (error) {
      console.error('Failed to load trade suggestions:', error);
      setResult({
        suggestions: [],
        summary: 'Unable to load trade suggestions right now. Try again later!',
        analysisInsights: {
          profileA: {
            displayName: '',
            duplicateCount: 0,
            wishlistMatchCount: 0,
            favoriteTypes: [],
          },
          profileB: {
            displayName: '',
            duplicateCount: 0,
            wishlistMatchCount: 0,
            favoriteTypes: [],
          },
          overlapCount: 0,
        },
        error: 'Failed to load suggestions',
      });
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedProfileA,
    selectedProfileB,
    familyId,
    isLoading,
    getTradeSuggestions,
    primaryGame.id,
    maxSuggestions,
  ]);

  // Refresh suggestions
  const handleRefresh = useCallback(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  // Profile loading state
  if (profileLoading || profiles === undefined) {
    return (
      <section className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>
        {showHeader && (
          <div className="mb-4 flex items-center gap-2">
            <ArrowsRightLeftIcon className="h-5 w-5 text-kid-secondary" />
            <h3 className="font-semibold text-gray-800">Trade Advisor</h3>
          </div>
        )}
        <TradeAdvisorSkeleton />
      </section>
    );
  }

  // Not logged in state
  if (!profileId) {
    return (
      <section className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>
        {showHeader && (
          <div className="mb-4 flex items-center gap-2">
            <ArrowsRightLeftIcon className="h-5 w-5 text-kid-secondary" />
            <h3 className="font-semibold text-gray-800">Trade Advisor</h3>
          </div>
        )}
        <div className="py-6 text-center">
          <ArrowsRightLeftIcon className="mx-auto mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">Sign in to see trade suggestions</p>
        </div>
      </section>
    );
  }

  // Need at least 2 profiles for trading
  if (profiles.length < 2) {
    return (
      <section className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>
        {showHeader && (
          <div className="mb-4 flex items-center gap-2">
            <ArrowsRightLeftIcon className="h-5 w-5 text-kid-secondary" />
            <h3 className="font-semibold text-gray-800">Trade Advisor</h3>
          </div>
        )}
        <div className="py-6 text-center">
          <UserGroupIcon className="mx-auto mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-600">Need at least 2 collectors to suggest trades!</p>
          <p className="mt-1 text-xs text-gray-400">
            Add another family member to see AI-powered trade suggestions.
          </p>
        </div>
      </section>
    );
  }

  // Main render
  return (
    <section
      className={cn('rounded-xl bg-white shadow-sm', className)}
      aria-label="AI Trade Advisor"
    >
      {/* Collapsible header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-kid-primary to-purple-500 shadow-md">
          <SparklesIcon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800">AI Trade Advisor</h3>
          <p className="text-sm text-gray-500">
            {result?.suggestions.length
              ? `${result.suggestions.length} fair trade${result.suggestions.length !== 1 ? 's' : ''} found`
              : 'Get smart trade suggestions between siblings'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {result?.suggestions.length ? (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-kid-primary/10 px-2 text-xs font-bold text-kid-primary">
              {result.suggestions.length}
            </span>
          ) : null}
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4">
          {/* Profile selectors */}
          <ProfileSelector
            profiles={profiles}
            selectedA={selectedProfileA}
            selectedB={selectedProfileB}
            onSelectA={setSelectedProfileA}
            onSelectB={setSelectedProfileB}
          />

          {/* Initial state - not yet loaded */}
          {!hasLoaded && !isLoading && selectedProfileA && selectedProfileB && (
            <div className="py-6 text-center">
              <div className="mb-4">
                <SparklesIcon className="mx-auto h-12 w-12 text-kid-secondary/50" />
              </div>
              <p className="mb-4 text-sm text-gray-600">
                Find fair trades between{' '}
                {profiles.find((p) => p._id === selectedProfileA)?.displayName} and{' '}
                {profiles.find((p) => p._id === selectedProfileB)?.displayName}!
              </p>
              <button
                onClick={loadSuggestions}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-kid-primary to-kid-secondary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                <SparklesIcon className="h-4 w-4" />
                Get Trade Ideas
              </button>
            </div>
          )}

          {/* Loading state */}
          {isLoading && <TradeAdvisorSkeleton />}

          {/* Error state */}
          {result?.error && result.suggestions.length === 0 && !isLoading && (
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
          )}

          {/* No suggestions state */}
          {result && !result.error && result.suggestions.length === 0 && !isLoading && (
            <div className="py-6 text-center">
              <ArrowsRightLeftIcon className="mx-auto mb-2 h-10 w-10 text-kid-secondary/50" />
              <p className="text-sm text-gray-600">{result.summary}</p>
            </div>
          )}

          {/* Suggestions list */}
          {result && result.suggestions.length > 0 && !isLoading && (
            <div className="space-y-4">
              {/* Summary */}
              {result.summary && (
                <p className="text-center text-sm text-gray-600" aria-live="polite">
                  {result.summary}
                </p>
              )}

              {/* Trade suggestions */}
              <div className="space-y-3">
                {result.suggestions.map((suggestion, index) => (
                  <TradeSuggestionCard
                    key={`${suggestion.fromProfile.profileId}-${suggestion.toProfile.profileId}-${index}`}
                    suggestion={suggestion}
                    hidePrices={hidePrices}
                  />
                ))}
              </div>

              {/* Analysis insights */}
              {result.analysisInsights.overlapCount > 0 && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <p className="mb-2 text-xs font-medium text-gray-500">Collection Insights</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-medium text-kid-primary">
                        {result.analysisInsights.profileA.displayName}
                      </p>
                      <p className="text-gray-500">
                        {result.analysisInsights.profileA.duplicateCount} duplicates,{' '}
                        {result.analysisInsights.profileA.wishlistMatchCount} wishlist matches
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-kid-secondary">
                        {result.analysisInsights.profileB.displayName}
                      </p>
                      <p className="text-gray-500">
                        {result.analysisInsights.profileB.duplicateCount} duplicates,{' '}
                        {result.analysisInsights.profileB.wishlistMatchCount} wishlist matches
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Refresh button */}
              <div className="flex justify-center">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <ArrowPathIcon className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                  Get new suggestions
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
});
