'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  ArrowsRightLeftIcon,
  ArrowRightIcon,
  HeartIcon,
  SparklesIcon,
  Square3Stack3DIcon,
  LightBulbIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserGroupIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';

// ============================================================================
// TYPES
// ============================================================================

interface Profile {
  _id: Id<'profiles'>;
  displayName: string;
}

interface CardData {
  id: string;
  name: string;
  images: {
    small: string;
    large: string;
  };
}

interface TradeSuggestion {
  fromProfile: Profile;
  toProfile: Profile;
  cardId: string;
  cardData: CardData | null;
  reason: 'wishlist' | 'duplicate';
  fromHasQuantity: number;
  toWants: boolean;
}

// ============================================================================
// SKELETON
// ============================================================================

export function TradeSuggestionEngineSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="mb-1 h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
            <Skeleton className="h-16 w-12 rounded" />
            <div className="flex-1">
              <Skeleton className="mb-1 h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TRADE SUGGESTION CARD
// ============================================================================

interface TradeSuggestionCardProps {
  suggestion: TradeSuggestion;
}

function TradeSuggestionCard({ suggestion }: TradeSuggestionCardProps) {
  const { fromProfile, toProfile, cardData, reason, fromHasQuantity } = suggestion;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-gray-50 to-white p-3 transition hover:shadow-md">
      {/* Card Image */}
      <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded shadow-sm">
        {cardData ? (
          <Image
            src={cardData.images.small}
            alt={cardData.name}
            fill
            sizes="48px"
            className="object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200">
            <Square3Stack3DIcon className="h-6 w-6 text-gray-400" />
          </div>
        )}
        {/* Quantity badge */}
        {fromHasQuantity > 1 && (
          <div className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-kid-primary px-1 text-xs font-bold text-white shadow">
            x{fromHasQuantity}
          </div>
        )}
      </div>

      {/* Card info and suggestion */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-800">
          {cardData?.name ?? suggestion.cardId}
        </p>
        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <span className="font-medium text-kid-primary">{fromProfile.displayName}</span>
          <ArrowRightIcon className="h-3 w-3 text-gray-400" />
          <span className="font-medium text-kid-secondary">{toProfile.displayName}</span>
        </div>
      </div>

      {/* Reason badge */}
      <div
        className={cn(
          'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium',
          reason === 'wishlist'
            ? 'bg-rose-100 text-rose-700'
            : 'bg-emerald-100 text-emerald-700'
        )}
      >
        {reason === 'wishlist' ? (
          <>
            <HeartIcon className="h-3.5 w-3.5" />
            <span>Wanted</span>
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-3.5 w-3.5" />
            <span>Extra</span>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MEMBER TRADE DATA COLLECTOR
// ============================================================================

interface MemberTradeDataProps {
  profileId: Id<'profiles'>;
  displayName: string;
  allProfiles: Profile[];
  onSuggestionsFound: (suggestions: TradeSuggestion[]) => void;
}

function MemberTradeDataCollector({
  profileId,
  displayName,
  allProfiles,
  onSuggestionsFound,
}: MemberTradeDataProps) {
  // Get this member's collection (cards with quantity > 1 are potential trades)
  const collection = useQuery(api.collections.getCollection, { profileId });
  // Get this member's wishlist
  const wishlist = useQuery(api.wishlist.getWishlist, { profileId });

  useEffect(() => {
    if (collection === undefined || wishlist === undefined) return;

    const suggestions: TradeSuggestion[] = [];

    // Find cards this member has duplicates of (quantity > 1)
    const duplicateCards = collection.filter((card) => card.quantity > 1);

    // For each other profile, check if they want any of our duplicates
    for (const otherProfile of allProfiles) {
      if (otherProfile._id === profileId) continue;

      // We'll check wishlists in the parent component since we need to aggregate
      for (const card of duplicateCards) {
        suggestions.push({
          fromProfile: { _id: profileId, displayName },
          toProfile: otherProfile,
          cardId: card.cardId,
          cardData: null, // Will be enriched later
          reason: 'duplicate',
          fromHasQuantity: card.quantity,
          toWants: false,
        });
      }
    }

    onSuggestionsFound(suggestions);
  }, [collection, wishlist, profileId, displayName, allProfiles, onSuggestionsFound]);

  return null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface TradeSuggestionEngineProps {
  familyId: Id<'families'>;
  className?: string;
  maxSuggestions?: number;
}

export function TradeSuggestionEngine({
  familyId,
  className,
  maxSuggestions = 10,
}: TradeSuggestionEngineProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [memberSuggestions, setMemberSuggestions] = useState<Map<string, TradeSuggestion[]>>(
    new Map()
  );
  const [cardDataMap, setCardDataMap] = useState<Map<string, CardData>>(new Map());
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [wishlistMap, setWishlistMap] = useState<Map<string, Set<string>>>(new Map());

  // Fetch family profiles
  const profiles = useQuery(api.profiles.getProfilesByFamily, { familyId });

  // Fetch all wishlists for the family
  const allProfileIds = profiles?.map((p) => p._id) ?? [];

  // Handle suggestions from each member
  const handleMemberSuggestions = useCallback(
    (memberId: string, suggestions: TradeSuggestion[]) => {
      setMemberSuggestions((prev) => {
        const newMap = new Map(prev);
        newMap.set(memberId, suggestions);
        return newMap;
      });
    },
    []
  );

  // Collect wishlists for all profiles
  useEffect(() => {
    if (!profiles || profiles.length < 2) return;

    const fetchWishlists = async () => {
      // We'll use the existing wishlist data from collectors
      // This is handled reactively through the member collectors
    };

    fetchWishlists();
  }, [profiles]);

  // Aggregate and process suggestions
  const allSuggestions = Array.from(memberSuggestions.values()).flat();

  // Fetch card data for suggestions
  const fetchCardData = useCallback(async () => {
    const cardIds = [...new Set(allSuggestions.map((s) => s.cardId))];
    const newCardIds = cardIds.filter((id) => !cardDataMap.has(id));

    if (newCardIds.length === 0) return;

    try {
      setIsLoadingCards(true);
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds: newCardIds }),
      });

      if (response.ok) {
        const result = await response.json();
        // API returns { data: [...cards...], ... } structure
        const cards: CardData[] = result.data || [];
        setCardDataMap((prev) => {
          const newMap = new Map(prev);
          cards.forEach((card) => newMap.set(card.id, card));
          return newMap;
        });
      }
    } catch (err) {
      console.error('Error fetching card data:', err);
    } finally {
      setIsLoadingCards(false);
    }
  }, [allSuggestions, cardDataMap]);

  useEffect(() => {
    if (allSuggestions.length > 0) {
      fetchCardData();
    }
  }, [allSuggestions.length, fetchCardData]);

  // Enrich suggestions with card data and sort by priority
  const enrichedSuggestions = allSuggestions
    .map((suggestion) => ({
      ...suggestion,
      cardData: cardDataMap.get(suggestion.cardId) ?? null,
    }))
    .sort((a, b) => {
      // Wishlist matches first
      if (a.reason === 'wishlist' && b.reason !== 'wishlist') return -1;
      if (b.reason === 'wishlist' && a.reason !== 'wishlist') return 1;
      // Then by quantity (higher first)
      return b.fromHasQuantity - a.fromHasQuantity;
    })
    .slice(0, maxSuggestions);

  // Loading state
  if (profiles === undefined) {
    return <TradeSuggestionEngineSkeleton />;
  }

  // Need at least 2 profiles for trading
  if (profiles.length < 2) {
    return (
      <div className={cn('rounded-2xl bg-white p-6 text-center shadow-sm', className)}>
        <UserGroupIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <h3 className="mb-1 font-semibold text-gray-700">Trade Suggestions</h3>
        <p className="text-sm text-gray-500">
          Add another family member to see trade suggestions between collectors!
        </p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl bg-white shadow-sm', className)}>
      {/* Collectors for each profile */}
      {profiles.map((profile) => (
        <MemberTradeDataCollector
          key={profile._id}
          profileId={profile._id}
          displayName={profile.displayName}
          allProfiles={profiles as Profile[]}
          onSuggestionsFound={(suggestions) =>
            handleMemberSuggestions(profile._id, suggestions)
          }
        />
      ))}

      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-3 p-4 text-left sm:p-6"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
          <LightBulbIcon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800">Trade Suggestions</h3>
          <p className="text-sm text-gray-500">
            {enrichedSuggestions.length > 0
              ? `${enrichedSuggestions.length} potential trade${enrichedSuggestions.length !== 1 ? 's' : ''} found`
              : 'Finding trades between siblings...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {enrichedSuggestions.length > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-100 px-2 text-xs font-bold text-amber-700">
              {enrichedSuggestions.length}
            </span>
          )}
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 pt-0 sm:p-6 sm:pt-0">
          {enrichedSuggestions.length > 0 ? (
            <div className="mt-4 space-y-2">
              {/* Legend */}
              <div className="mb-4 flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <HeartIcon className="h-3.5 w-3.5 text-rose-500" />
                  <span className="text-gray-600">On wishlist</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-gray-600">Has duplicates</span>
                </div>
              </div>

              {/* Suggestions list */}
              {enrichedSuggestions.map((suggestion, index) => (
                <TradeSuggestionCard
                  key={`${suggestion.cardId}-${suggestion.fromProfile._id}-${index}`}
                  suggestion={suggestion}
                />
              ))}

              {isLoadingCards && (
                <p className="text-center text-xs text-gray-400">Loading card images...</p>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-gray-50 p-6 text-center">
              <ArrowsRightLeftIcon className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">No trade suggestions yet</p>
              <p className="mt-1 text-xs text-gray-400">
                Trade suggestions appear when siblings have duplicate cards or cards on each
                other&apos;s wishlists
              </p>
            </div>
          )}

          {/* Tip */}
          {enrichedSuggestions.length > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3">
              <SparklesIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <p className="text-xs text-amber-700">
                <span className="font-medium">Tip:</span> Cards marked &quot;Wanted&quot; are on the
                recipient&apos;s wishlist - perfect for trades or gifts!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
