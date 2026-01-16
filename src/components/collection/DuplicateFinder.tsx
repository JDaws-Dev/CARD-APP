'use client';

import { useQuery } from 'convex/react';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  ArrowsRightLeftIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

interface Profile {
  _id: Id<'profiles'>;
  displayName: string;
  familyId: Id<'families'>;
  avatarUrl?: string;
}

interface CardData {
  id: string;
  name: string;
  images: {
    small: string;
    large: string;
  };
}

interface DuplicateFinderProps {
  className?: string;
}

/**
 * Skeleton loader for duplicate finder
 */
export function DuplicateFinderSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile selectors skeleton */}
      <div className="flex items-center justify-center gap-4">
        <Skeleton className="h-12 w-48 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-12 w-48 rounded-lg" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
            <Skeleton className="mx-auto mb-2 h-10 w-16" />
            <Skeleton className="mx-auto h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Cards grid skeleton */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <Skeleton className="mb-4 h-6 w-48" />
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-gray-50 p-1.5">
              <div className="aspect-[2.5/3.5]">
                <Skeleton className="h-full w-full rounded" />
              </div>
              <Skeleton className="mx-auto mt-1 h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Profile selector dropdown
 */
function ProfileSelector({
  profiles,
  selectedId,
  onSelect,
  label,
  excludeId,
}: {
  profiles: Profile[];
  selectedId: Id<'profiles'> | null;
  onSelect: (id: Id<'profiles'>) => void;
  label: string;
  excludeId?: Id<'profiles'> | null;
}) {
  const availableProfiles = profiles.filter((p) => p._id !== excludeId);
  const selectedProfile = profiles.find((p) => p._id === selectedId);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <select
        value={selectedId ?? ''}
        onChange={(e) => onSelect(e.target.value as Id<'profiles'>)}
        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-kid-primary focus:border-kid-primary focus:outline-none focus:ring-2 focus:ring-kid-primary/20"
      >
        <option value="" disabled>
          Select profile
        </option>
        {availableProfiles.map((profile) => (
          <option key={profile._id} value={profile._id}>
            {profile.displayName}
          </option>
        ))}
      </select>
      {selectedProfile && (
        <span className="text-sm font-semibold text-gray-800">{selectedProfile.displayName}</span>
      )}
    </div>
  );
}

/**
 * Stat card component
 */
function StatCard({
  value,
  label,
  colorClass,
  icon: Icon,
}: {
  value: number;
  label: string;
  colorClass: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex flex-col items-center gap-2">
        <div className={cn('flex items-center gap-2', colorClass)}>
          <Icon className="h-6 w-6" />
          <span className="text-3xl font-bold">{value}</span>
        </div>
        <span className="text-center text-sm text-gray-500">{label}</span>
      </div>
    </div>
  );
}

/**
 * Card display with ownership info
 */
function ComparisonCard({
  cardId,
  cardData,
  profile1Qty,
  profile2Qty,
  profile1Name,
  profile2Name,
}: {
  cardId: string;
  cardData: CardData | null;
  profile1Qty: number;
  profile2Qty: number;
  profile1Name: string;
  profile2Name: string;
}) {
  return (
    <div className="group relative rounded-lg bg-gray-50 p-1.5 transition hover:shadow-md">
      {/* Card Image */}
      <div className="relative aspect-[2.5/3.5] overflow-hidden rounded">
        {cardData ? (
          <Image
            src={cardData.images.small}
            alt={cardData.name}
            fill
            sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 12vw"
            className="object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-200">
            <span className="text-xs text-gray-400">Loading...</span>
          </div>
        )}

        {/* Ownership badges */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between p-1">
          {profile1Qty > 0 && (
            <div className="flex h-5 min-w-5 items-center justify-center rounded bg-kid-primary px-1 text-xs font-bold text-white shadow">
              x{profile1Qty}
            </div>
          )}
          {profile2Qty > 0 && (
            <div className="ml-auto flex h-5 min-w-5 items-center justify-center rounded bg-kid-secondary px-1 text-xs font-bold text-white shadow">
              x{profile2Qty}
            </div>
          )}
        </div>
      </div>

      {/* Card Name */}
      <p className="mt-1 truncate text-center text-xs font-medium text-gray-700">
        {cardData?.name ?? cardId}
      </p>

      {/* Tooltip on hover */}
      <div className="invisible absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
        <div className="whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-kid-primary" />
            <span>
              {profile1Name}: {profile1Qty}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-kid-secondary" />
            <span>
              {profile2Name}: {profile2Qty}
            </span>
          </div>
        </div>
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

/**
 * Section header component
 */
function SectionHeader({
  title,
  count,
  icon: Icon,
  colorClass,
}: {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className={cn('rounded-lg p-2', colorClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500">
          {count} card{count !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

/**
 * Duplicate finder component for comparing sibling collections
 */
export function DuplicateFinder({ className }: DuplicateFinderProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const [profile1Id, setProfile1Id] = useState<Id<'profiles'> | null>(null);
  const [profile2Id, setProfile2Id] = useState<Id<'profiles'> | null>(null);
  const [cardDataMap, setCardDataMap] = useState<Map<string, CardData>>(new Map());
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  // Get current profile to find familyId
  const currentProfile = useQuery(
    api.profiles.getProfile,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  // Get all profiles in the family
  const familyProfiles = useQuery(
    api.profiles.getProfilesByFamily,
    currentProfile?.familyId ? { familyId: currentProfile.familyId } : 'skip'
  );

  // Get comparison data
  const comparison = useQuery(
    api.collections.getCollectionComparison,
    profile1Id && profile2Id ? { profileId1: profile1Id, profileId2: profile2Id } : 'skip'
  );

  // Get duplicate cards
  const duplicates = useQuery(
    api.collections.findDuplicateCards,
    profile1Id && profile2Id ? { profileId1: profile1Id, profileId2: profile2Id } : 'skip'
  );

  // Get tradeable cards (profile1 has, profile2 doesn't)
  const tradeableToProfile2 = useQuery(
    api.collections.findTradeableCards,
    profile1Id && profile2Id ? { fromProfileId: profile1Id, toProfileId: profile2Id } : 'skip'
  );

  // Get tradeable cards (profile2 has, profile1 doesn't)
  const tradeableToProfile1 = useQuery(
    api.collections.findTradeableCards,
    profile1Id && profile2Id ? { fromProfileId: profile2Id, toProfileId: profile1Id } : 'skip'
  );

  // Set initial profiles when family profiles load
  useEffect(() => {
    if (familyProfiles && familyProfiles.length >= 2 && !profile1Id && !profile2Id) {
      setProfile1Id(familyProfiles[0]._id);
      setProfile2Id(familyProfiles[1]._id);
    }
  }, [familyProfiles, profile1Id, profile2Id]);

  // Collect all card IDs and fetch card data
  const fetchCardData = useCallback(async () => {
    const allCardIds = new Set<string>();

    // Add duplicate card IDs
    if (duplicates?.duplicates) {
      duplicates.duplicates.forEach((d) => allCardIds.add(d.cardId));
    }

    // Add tradeable card IDs
    if (tradeableToProfile2?.tradeableCards) {
      tradeableToProfile2.tradeableCards.forEach((c) => allCardIds.add(c.cardId));
    }
    if (tradeableToProfile1?.tradeableCards) {
      tradeableToProfile1.tradeableCards.forEach((c) => allCardIds.add(c.cardId));
    }

    if (allCardIds.size === 0) return;

    // Filter out cards we already have
    const newCardIds = [...allCardIds].filter((id) => !cardDataMap.has(id));
    if (newCardIds.length === 0) return;

    try {
      setIsLoadingCards(true);
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardIds: newCardIds }),
      });

      if (response.ok) {
        const cards: CardData[] = await response.json();
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
  }, [duplicates, tradeableToProfile1, tradeableToProfile2, cardDataMap]);

  useEffect(() => {
    fetchCardData();
  }, [fetchCardData]);

  // Get profile names
  const profile1 = familyProfiles?.find((p) => p._id === profile1Id);
  const profile2 = familyProfiles?.find((p) => p._id === profile2Id);
  const profile1Name = profile1?.displayName ?? 'Profile 1';
  const profile2Name = profile2?.displayName ?? 'Profile 2';

  // Loading state
  if (profileLoading || currentProfile === undefined || familyProfiles === undefined) {
    return (
      <div className={cn('', className)}>
        <DuplicateFinderSkeleton />
      </div>
    );
  }

  // Not enough profiles in family
  if (familyProfiles.length < 2) {
    return (
      <div className={cn('rounded-xl bg-white p-8 text-center shadow-sm', className)}>
        <UserGroupIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <h2 className="mb-2 text-xl font-bold text-gray-800">Need More Profiles</h2>
        <p className="text-gray-500">
          Add another family member profile to compare collections and find duplicates.
        </p>
      </div>
    );
  }

  // No profiles selected yet
  if (!profile1Id || !profile2Id) {
    return (
      <div className={cn('', className)}>
        <div className="mb-6 flex items-center justify-center gap-4">
          <ProfileSelector
            profiles={familyProfiles as Profile[]}
            selectedId={profile1Id}
            onSelect={setProfile1Id}
            label="First Collector"
            excludeId={profile2Id}
          />
          <ArrowsRightLeftIcon className="h-8 w-8 text-gray-400" />
          <ProfileSelector
            profiles={familyProfiles as Profile[]}
            selectedId={profile2Id}
            onSelect={setProfile2Id}
            label="Second Collector"
            excludeId={profile1Id}
          />
        </div>
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">Select two profiles to compare their collections</p>
        </div>
      </div>
    );
  }

  // Comparison data loading
  if (comparison === undefined || duplicates === undefined) {
    return (
      <div className={cn('', className)}>
        <DuplicateFinderSkeleton />
      </div>
    );
  }

  // Error state
  if ('error' in comparison) {
    return (
      <div className={cn('rounded-xl bg-white p-8 text-center shadow-sm', className)}>
        <ExclamationTriangleIcon className="mx-auto mb-4 h-16 w-16 text-amber-500" />
        <h2 className="mb-2 text-xl font-bold text-gray-800">Comparison Error</h2>
        <p className="text-gray-500">{comparison.error}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Profile Selectors */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <ProfileSelector
          profiles={familyProfiles as Profile[]}
          selectedId={profile1Id}
          onSelect={setProfile1Id}
          label="First Collector"
          excludeId={profile2Id}
        />
        <ArrowsRightLeftIcon className="h-8 w-8 text-gray-400" />
        <ProfileSelector
          profiles={familyProfiles as Profile[]}
          selectedId={profile2Id}
          onSelect={setProfile2Id}
          label="Second Collector"
          excludeId={profile1Id}
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          value={comparison.shared.count}
          label="Cards Both Own"
          colorClass="text-kid-success"
          icon={CheckCircleIcon}
        />
        <StatCard
          value={comparison.onlyInProfile1.count}
          label={`Only ${profile1Name} Has`}
          colorClass="text-kid-primary"
          icon={ArrowRightIcon}
        />
        <StatCard
          value={comparison.onlyInProfile2.count}
          label={`Only ${profile2Name} Has`}
          colorClass="text-kid-secondary"
          icon={ArrowLeftIcon}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 rounded-lg bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded bg-kid-primary" />
          <span className="text-sm text-gray-600">{profile1Name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded bg-kid-secondary" />
          <span className="text-sm text-gray-600">{profile2Name}</span>
        </div>
      </div>

      {/* Duplicate Cards Section */}
      {duplicates.duplicates && duplicates.duplicates.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <SectionHeader
            title="Duplicate Cards (Both Own)"
            count={duplicates.duplicates.length}
            icon={CheckCircleIcon}
            colorClass="bg-kid-success/10 text-kid-success"
          />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {duplicates.duplicates.slice(0, 24).map((dup) => (
              <ComparisonCard
                key={dup.cardId}
                cardId={dup.cardId}
                cardData={cardDataMap.get(dup.cardId) ?? null}
                profile1Qty={dup.profile1.quantity}
                profile2Qty={dup.profile2.quantity}
                profile1Name={profile1Name}
                profile2Name={profile2Name}
              />
            ))}
          </div>
          {duplicates.duplicates.length > 24 && (
            <p className="mt-4 text-center text-sm text-gray-500">
              + {duplicates.duplicates.length - 24} more duplicate cards
            </p>
          )}
        </div>
      )}

      {/* Cards Only Profile 1 Has */}
      {tradeableToProfile2?.tradeableCards && tradeableToProfile2.tradeableCards.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <SectionHeader
            title={`Cards Only ${profile1Name} Has`}
            count={tradeableToProfile2.tradeableCards.length}
            icon={ArrowRightIcon}
            colorClass="bg-kid-primary/10 text-kid-primary"
          />
          <p className="mb-4 text-sm text-gray-500">
            These cards could be traded to {profile2Name}
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {tradeableToProfile2.tradeableCards.slice(0, 16).map((card) => (
              <ComparisonCard
                key={card.cardId}
                cardId={card.cardId}
                cardData={cardDataMap.get(card.cardId) ?? null}
                profile1Qty={card.quantity}
                profile2Qty={0}
                profile1Name={profile1Name}
                profile2Name={profile2Name}
              />
            ))}
          </div>
          {tradeableToProfile2.tradeableCards.length > 16 && (
            <p className="mt-4 text-center text-sm text-gray-500">
              + {tradeableToProfile2.tradeableCards.length - 16} more unique cards
            </p>
          )}
        </div>
      )}

      {/* Cards Only Profile 2 Has */}
      {tradeableToProfile1?.tradeableCards && tradeableToProfile1.tradeableCards.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <SectionHeader
            title={`Cards Only ${profile2Name} Has`}
            count={tradeableToProfile1.tradeableCards.length}
            icon={ArrowLeftIcon}
            colorClass="bg-kid-secondary/10 text-kid-secondary"
          />
          <p className="mb-4 text-sm text-gray-500">
            These cards could be traded to {profile1Name}
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {tradeableToProfile1.tradeableCards.slice(0, 16).map((card) => (
              <ComparisonCard
                key={card.cardId}
                cardId={card.cardId}
                cardData={cardDataMap.get(card.cardId) ?? null}
                profile1Qty={0}
                profile2Qty={card.quantity}
                profile1Name={profile1Name}
                profile2Name={profile2Name}
              />
            ))}
          </div>
          {tradeableToProfile1.tradeableCards.length > 16 && (
            <p className="mt-4 text-center text-sm text-gray-500">
              + {tradeableToProfile1.tradeableCards.length - 16} more unique cards
            </p>
          )}
        </div>
      )}

      {/* Empty state when no cards to compare */}
      {(!duplicates.duplicates || duplicates.duplicates.length === 0) &&
        (!tradeableToProfile2?.tradeableCards || tradeableToProfile2.tradeableCards.length === 0) &&
        (!tradeableToProfile1?.tradeableCards ||
          tradeableToProfile1.tradeableCards.length === 0) && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <UserGroupIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h2 className="mb-2 text-xl font-bold text-gray-800">No Cards to Compare</h2>
            <p className="text-gray-500">
              Neither profile has cards in their collection yet. Start adding cards to see
              comparisons!
            </p>
          </div>
        )}

      {/* Loading indicator for card images */}
      {isLoadingCards && (
        <div className="text-center text-sm text-gray-500">Loading card images...</div>
      )}
    </div>
  );
}
