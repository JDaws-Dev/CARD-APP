'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  GiftIcon,
  HeartIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';

// ============================================================================
// TYPES
// ============================================================================

interface WishlistCard {
  cardId: string;
  isPriority: boolean;
  _id: Id<'wishlistCards'>;
  _creationTime: number;
  profileId: Id<'profiles'>;
}

interface CachedCard {
  cardId: string;
  name?: string;
  imageSmall?: string;
  priceMarket?: number;
  rarity?: string;
  setId?: string;
}

interface ProfileWishlistData {
  profileId: Id<'profiles'>;
  displayName: string;
  wishlist: WishlistCard[];
  isLoading: boolean;
}

// ============================================================================
// SKELETON
// ============================================================================

export function SharedWishlistViewerSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="mb-1 h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-gray-50 p-4">
            <Skeleton className="mb-3 h-5 w-32" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-24 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// WISHLIST CARD ITEM
// ============================================================================

interface WishlistCardItemProps {
  cardId: string;
  isPriority: boolean;
}

function WishlistCardItem({ cardId, isPriority }: WishlistCardItemProps) {
  // Fetch card data from cache
  const cachedCards = useQuery(api.collections.batchGetCardData, {
    cardIds: [cardId],
  });

  const cardData = cachedCards?.cards?.[cardId] as CachedCard | undefined;
  const isLoading = cachedCards === undefined;

  if (isLoading) {
    return <Skeleton className="h-32 rounded-lg" />;
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border-2 bg-white p-2 transition-all hover:shadow-md',
        isPriority ? 'border-amber-300 bg-amber-50/50' : 'border-gray-100'
      )}
    >
      {/* Priority badge */}
      {isPriority && (
        <div className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 shadow-sm">
          <StarIcon className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Card image */}
      <div className="relative mb-2 aspect-[2.5/3.5] w-full overflow-hidden rounded bg-gray-100">
        {cardData?.imageSmall ? (
          <Image
            src={cardData.imageSmall}
            alt={cardData.name || cardId}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBagIcon className="h-8 w-8 text-gray-300" />
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="space-y-1">
        <p className="line-clamp-2 text-xs font-medium text-gray-700">
          {cardData?.name || cardId}
        </p>
        {cardData?.priceMarket && (
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            <CurrencyDollarIcon className="h-3 w-3" />
            <span>${cardData.priceMarket.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PROFILE WISHLIST COLLECTOR
// ============================================================================

interface ProfileWishlistCollectorProps {
  profileId: Id<'profiles'>;
  displayName: string;
  onData: (data: ProfileWishlistData) => void;
}

function ProfileWishlistCollector({
  profileId,
  displayName,
  onData,
}: ProfileWishlistCollectorProps) {
  const wishlist = useQuery(api.wishlist.getWishlist, { profileId });

  useEffect(() => {
    onData({
      profileId,
      displayName,
      wishlist: wishlist ?? [],
      isLoading: wishlist === undefined,
    });
  }, [wishlist, profileId, displayName, onData]);

  return null;
}

// ============================================================================
// PROFILE WISHLIST SECTION
// ============================================================================

interface ProfileWishlistSectionProps {
  data: ProfileWishlistData;
  isExpanded: boolean;
  onToggle: () => void;
  showPricing?: boolean;
}

function ProfileWishlistSection({
  data,
  isExpanded,
  onToggle,
}: ProfileWishlistSectionProps) {
  const priorityCards = data.wishlist.filter((c) => c.isPriority);
  const regularCards = data.wishlist.filter((c) => !c.isPriority);
  const totalCards = data.wishlist.length;

  // Avatar gradient based on name
  const avatarGradients = [
    'from-kid-primary to-purple-500',
    'from-pink-500 to-rose-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-blue-400 to-indigo-500',
  ];
  const gradientIndex =
    data.displayName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    avatarGradients.length;
  const avatarGradient = avatarGradients[gradientIndex];

  const initials = data.displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (data.isLoading) {
    return (
      <div className="rounded-xl bg-gray-50 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    );
  }

  if (totalCards === 0) {
    return (
      <div className="rounded-xl bg-gray-50 p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white',
              avatarGradient
            )}
          >
            {initials}
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-700">{data.displayName}</p>
            <p className="text-sm text-gray-400">No items on wishlist</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
      >
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-sm',
            avatarGradient
          )}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-800">{data.displayName}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{totalCards} item{totalCards !== 1 ? 's' : ''}</span>
            {priorityCards.length > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1 text-amber-600">
                  <StarIcon className="h-3 w-3" />
                  {priorityCards.length} priority
                </span>
              </>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4">
          {/* Priority items */}
          {priorityCards.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-700">
                <StarIcon className="h-4 w-4" />
                <span>Priority Items</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {priorityCards.map((card) => (
                  <WishlistCardItem
                    key={card._id}
                    cardId={card.cardId}
                    isPriority={card.isPriority}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular items */}
          {regularCards.length > 0 && (
            <div>
              {priorityCards.length > 0 && (
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500">
                  <HeartIcon className="h-4 w-4" />
                  <span>Other Items</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {regularCards.map((card) => (
                  <WishlistCardItem
                    key={card._id}
                    cardId={card.cardId}
                    isPriority={card.isPriority}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SharedWishlistViewerProps {
  familyId: Id<'families'>;
  className?: string;
}

export function SharedWishlistViewer({ familyId, className }: SharedWishlistViewerProps) {
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set());
  const [wishlistData, setWishlistData] = useState<Map<string, ProfileWishlistData>>(
    new Map()
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch family profiles
  const profiles = useQuery(api.profiles.getProfilesByFamily, { familyId });

  // Stable callback for wishlist data updates
  const handleWishlistData = useCallback((data: ProfileWishlistData) => {
    setWishlistData((prev) => {
      const existing = prev.get(data.profileId);
      if (
        existing &&
        existing.wishlist.length === data.wishlist.length &&
        existing.isLoading === data.isLoading
      ) {
        return prev;
      }
      const newMap = new Map(prev);
      newMap.set(data.profileId, data);
      return newMap;
    });
  }, []);

  // Toggle profile expansion
  const toggleProfile = (profileId: string) => {
    setExpandedProfiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(profileId)) {
        newSet.delete(profileId);
      } else {
        newSet.add(profileId);
      }
      return newSet;
    });
  };

  // Expand all profiles by default when data loads
  useEffect(() => {
    if (profiles && expandedProfiles.size === 0) {
      const allIds = new Set(profiles.map((p) => p._id));
      setExpandedProfiles(allIds);
    }
  }, [profiles, expandedProfiles.size]);

  // Loading state
  if (profiles === undefined) {
    return <SharedWishlistViewerSkeleton />;
  }

  // Calculate totals
  const allWishlists = Array.from(wishlistData.values());
  const totalItems = allWishlists.reduce((sum, d) => sum + d.wishlist.length, 0);
  const totalPriority = allWishlists.reduce(
    (sum, d) => sum + d.wishlist.filter((c) => c.isPriority).length,
    0
  );
  const profilesWithWishlists = allWishlists.filter((d) => d.wishlist.length > 0).length;

  // Render collectors for profiles without data
  const collectors = profiles
    .filter((p) => !wishlistData.has(p._id))
    .map((profile) => (
      <ProfileWishlistCollector
        key={profile._id}
        profileId={profile._id}
        displayName={profile.displayName}
        onData={handleWishlistData}
      />
    ));

  // Filter profiles by search (searches card names in wishlist)
  const filteredProfiles = profiles.filter((profile) => {
    if (!searchQuery.trim()) return true;
    const data = wishlistData.get(profile._id);
    if (!data) return true; // Show while loading
    // For now, just filter by profile name since we don't have card names cached at this level
    return profile.displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={cn('rounded-2xl bg-white p-4 shadow-sm sm:p-6', className)}>
      {collectors}

      {/* Header */}
      <div className="mb-4 flex items-center gap-3 sm:mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 shadow-md">
          <GiftIcon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800">Family Wishlists</h3>
          <p className="text-sm text-gray-500">
            View all children&apos;s wishlists for gift planning
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 p-3 text-center">
          <HeartIcon className="mx-auto mb-1 h-5 w-5 text-pink-500" />
          <div className="text-xl font-bold text-gray-800">{totalItems}</div>
          <div className="text-xs text-gray-500">Total Items</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-3 text-center">
          <StarIcon className="mx-auto mb-1 h-5 w-5 text-amber-500" />
          <div className="text-xl font-bold text-gray-800">{totalPriority}</div>
          <div className="text-xs text-gray-500">Priority</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 p-3 text-center">
          <UserCircleIcon className="mx-auto mb-1 h-5 w-5 text-purple-500" />
          <div className="text-xl font-bold text-gray-800">{profilesWithWishlists}</div>
          <div className="text-xs text-gray-500">With Lists</div>
        </div>
      </div>

      {/* Search */}
      {profiles.length > 1 && (
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-700 placeholder-gray-400 transition focus:border-pink-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-100"
          />
        </div>
      )}

      {/* Profile wishlists */}
      {profiles.length === 0 ? (
        <div className="rounded-xl bg-gray-50 p-8 text-center">
          <UserCircleIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="font-medium text-gray-600">No profiles in family</p>
          <p className="text-sm text-gray-400">Add collector profiles to see wishlists</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="rounded-xl bg-gray-50 p-8 text-center">
          <MagnifyingGlassIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="font-medium text-gray-600">No matches found</p>
          <p className="text-sm text-gray-400">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProfiles.map((profile) => {
            const data = wishlistData.get(profile._id);
            return (
              <ProfileWishlistSection
                key={profile._id}
                data={
                  data ?? {
                    profileId: profile._id,
                    displayName: profile.displayName,
                    wishlist: [],
                    isLoading: true,
                  }
                }
                isExpanded={expandedProfiles.has(profile._id)}
                onToggle={() => toggleProfile(profile._id)}
              />
            );
          })}
        </div>
      )}

      {/* Gift planning tip */}
      {totalItems > 0 && (
        <div className="mt-4 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 p-3 text-center">
          <p className="text-sm text-pink-700">
            <SparklesIcon className="mb-0.5 mr-1 inline h-4 w-4" />
            Tip: Priority items are what your collectors want most!
          </p>
        </div>
      )}
    </div>
  );
}
