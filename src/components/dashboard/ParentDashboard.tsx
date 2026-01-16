'use client';

import { useState, createContext, useContext } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserGroupIcon,
  Square3Stack3DIcon,
  SparklesIcon,
  TrophyIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
  StarIcon,
  FireIcon,
  HeartIcon,
  ChartBarIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';
import { FamilyCollectionGoal } from '@/components/family/FamilyCollectionGoal';
import { FamilyLeaderboard } from '@/components/family/FamilyLeaderboard';
import { TradeSuggestionEngine } from '@/components/family/TradeSuggestionEngine';

// Context for pricing visibility
const PricingVisibilityContext = createContext<boolean>(true);

function usePricingVisibility() {
  return useContext(PricingVisibilityContext);
}

// Profile card skeleton for loading state
function ProfileCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      {/* Header skeleton */}
      <div className="mb-4 flex items-center gap-3 sm:mb-6 sm:gap-4">
        <Skeleton className="h-12 w-12 rounded-full sm:h-16 sm:w-16" />
        <div className="flex-1">
          <Skeleton className="mb-2 h-5 w-24 sm:h-6 sm:w-32" />
          <Skeleton className="h-4 w-20 sm:w-24" />
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-gray-50 p-3 sm:p-4">
            <Skeleton className="mx-auto mb-2 h-4 w-4 sm:h-5 sm:w-5" />
            <Skeleton className="mx-auto mb-1 h-5 w-10 sm:h-6 sm:w-12" />
            <Skeleton className="mx-auto h-3 w-12 sm:w-16" />
          </div>
        ))}
      </div>

      {/* Recent activity skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        {[1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-32 flex-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Child profile card component
interface ChildProfileCardProps {
  profileId: Id<'profiles'>;
  displayName: string;
  avatarUrl?: string;
}

function ChildProfileCard({ profileId, displayName, avatarUrl }: ChildProfileCardProps) {
  // Get pricing visibility from context
  const showPricing = usePricingVisibility();

  // Fetch collection stats for this profile
  const stats = useQuery(api.collections.getCollectionStats, { profileId });
  const collectionValue = useQuery(api.collections.getCollectionValue, { profileId });
  const recentActivity = useQuery(api.activityLogs.getRecentActivity, {
    profileId,
    limit: 3,
  });
  const achievements = useQuery(api.achievements.getAchievements, { profileId });

  // Generate avatar initials
  const initials = displayName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Random gradient for avatar based on name
  const avatarGradients = [
    'from-kid-primary to-purple-500',
    'from-pink-500 to-rose-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-blue-400 to-indigo-500',
  ];
  const gradientIndex =
    displayName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    avatarGradients.length;
  const avatarGradient = avatarGradients[gradientIndex];

  // Loading state
  if (
    stats === undefined ||
    collectionValue === undefined ||
    recentActivity === undefined ||
    achievements === undefined
  ) {
    return <ProfileCardSkeleton />;
  }

  // Format relative time for activity
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get activity icon
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'card_added':
        return <Square3Stack3DIcon className="h-4 w-4 text-emerald-500" />;
      case 'card_removed':
        return <Square3Stack3DIcon className="h-4 w-4 text-orange-500" />;
      case 'achievement_earned':
        return <TrophyIcon className="h-4 w-4 text-amber-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="group rounded-2xl bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg sm:p-6">
      {/* Profile header */}
      <div className="mb-4 flex items-center gap-3 sm:mb-6 sm:gap-4">
        {/* Avatar */}
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={64}
            height={64}
            className="h-12 w-12 rounded-full border-4 border-white object-cover shadow-md sm:h-16 sm:w-16"
          />
        ) : (
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br shadow-md sm:h-16 sm:w-16',
              avatarGradient
            )}
          >
            <span className="text-lg font-bold text-white sm:text-xl">{initials}</span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-gray-800 sm:text-xl">{displayName}</h3>
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-gray-500 sm:text-sm">
              {achievements.length} badge{achievements.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* View collection link */}
        <Link
          href={`/collection?profile=${profileId}`}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all group-hover:bg-kid-primary group-hover:text-white sm:h-10 sm:w-10"
        >
          <ArrowRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-4">
        {/* Total cards */}
        <div className="rounded-xl bg-gradient-to-br from-kid-primary/10 to-purple-100 p-3 text-center sm:p-4">
          <Square3Stack3DIcon className="mx-auto mb-1 h-4 w-4 text-kid-primary sm:h-5 sm:w-5" />
          <div className="text-xl font-bold text-gray-800 sm:text-2xl">{stats.totalCards}</div>
          <div className="text-xs text-gray-500">Total Cards</div>
        </div>

        {/* Unique cards */}
        <div className="rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 p-3 text-center sm:p-4">
          <SparklesIcon className="mx-auto mb-1 h-4 w-4 text-pink-500 sm:h-5 sm:w-5" />
          <div className="text-xl font-bold text-gray-800 sm:text-2xl">{stats.uniqueCards}</div>
          <div className="text-xs text-gray-500">Unique Cards</div>
        </div>

        {/* Sets started */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 p-3 text-center sm:p-4">
          <ChartBarIcon className="mx-auto mb-1 h-4 w-4 text-emerald-500 sm:h-5 sm:w-5" />
          <div className="text-xl font-bold text-gray-800 sm:text-2xl">{stats.setsStarted}</div>
          <div className="text-xs text-gray-500">Sets Started</div>
        </div>

        {/* Collection value */}
        <div className="rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 p-3 text-center sm:p-4">
          <CurrencyDollarIcon className="mx-auto mb-1 h-4 w-4 text-amber-500 sm:h-5 sm:w-5" />
          {showPricing ? (
            <>
              <div className="text-xl font-bold text-gray-800 sm:text-2xl">
                ${collectionValue.totalValue.toFixed(0)}
              </div>
              <div className="text-xs text-gray-500">Est. Value</div>
            </>
          ) : (
            <>
              <div className="text-xl font-bold text-gray-400 sm:text-2xl">---</div>
              <div className="text-xs text-gray-400">Hidden</div>
            </>
          )}
        </div>
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            <ClockIcon className="h-3 w-3" />
            Recent Activity
          </div>
          <div className="space-y-2">
            {recentActivity.slice(0, 2).map((activity) => (
              <div
                key={activity._id}
                className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"
              >
                {getActivityIcon(activity.action)}
                <span className="flex-1 truncate text-sm text-gray-600">
                  {activity.action === 'card_added' && 'Added a card'}
                  {activity.action === 'card_removed' && 'Removed a card'}
                  {activity.action === 'achievement_earned' && 'Earned a badge'}
                </span>
                <span className="text-xs text-gray-400">
                  {formatRelativeTime(activity._creationTime)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for no activity */}
      {recentActivity.length === 0 && (
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <ClockIcon className="mx-auto mb-2 h-6 w-6 text-gray-300" />
          <p className="text-sm text-gray-400">No recent activity</p>
        </div>
      )}
    </div>
  );
}

// Parent dashboard skeleton
export function ParentDashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats header skeleton */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="mx-auto mb-2 h-12 w-12 rounded-full" />
              <Skeleton className="mx-auto mb-1 h-8 w-16" />
              <Skeleton className="mx-auto h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Profile cards skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <ProfileCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Pricing toggle component
interface PricingToggleProps {
  showPricing: boolean;
  onToggle: () => void;
}

function PricingToggle({ showPricing, onToggle }: PricingToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
        showPricing
          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      )}
      aria-label={showPricing ? 'Hide prices' : 'Show prices'}
      title={showPricing ? 'Hide TCGPlayer prices' : 'Show TCGPlayer prices'}
    >
      {showPricing ? (
        <>
          <EyeIcon className="h-4 w-4" />
          <span>Prices Visible</span>
        </>
      ) : (
        <>
          <EyeSlashIcon className="h-4 w-4" />
          <span>Prices Hidden</span>
        </>
      )}
    </button>
  );
}

// Main parent dashboard component
interface ParentDashboardProps {
  familyId: Id<'families'>;
}

export function ParentDashboard({ familyId }: ParentDashboardProps) {
  // State for pricing visibility toggle
  const [showPricing, setShowPricing] = useState(true);

  // Fetch family data
  const family = useQuery(api.profiles.getFamily, { familyId });
  const profiles = useQuery(api.profiles.getProfilesByFamily, { familyId });

  // Loading state or no family found
  if (family === undefined || family === null || profiles === undefined) {
    return <ParentDashboardSkeleton />;
  }

  // Calculate family-wide stats
  const totalProfiles = profiles.length;

  return (
    <PricingVisibilityContext.Provider value={showPricing}>
      <div className="space-y-4 sm:space-y-8">
        {/* Family overview header */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-100 via-purple-50 to-pink-100 p-4 sm:p-6">
          <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-8 md:gap-12">
            {/* Total profiles */}
            <div className="text-center">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg sm:mb-2 sm:h-14 sm:w-14">
                <UserGroupIcon className="h-5 w-5 text-white sm:h-7 sm:w-7" />
              </div>
              <div className="text-2xl font-bold text-gray-800 sm:text-3xl">{totalProfiles}</div>
              <div className="text-xs text-gray-500 sm:text-sm">
                Collector{totalProfiles !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden h-16 w-px bg-gray-200/50 sm:block" />

            {/* Subscription tier */}
            <div className="text-center">
              <div
                className={cn(
                  'mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full shadow-lg sm:mb-2 sm:h-14 sm:w-14',
                  family.subscriptionTier === 'family'
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                    : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                )}
              >
                {family.subscriptionTier === 'family' ? (
                  <StarIcon className="h-5 w-5 text-white sm:h-7 sm:w-7" />
                ) : (
                  <HeartIcon className="h-5 w-5 text-white sm:h-7 sm:w-7" />
                )}
              </div>
              <div className="text-lg font-bold capitalize text-gray-800 sm:text-xl">
                {family.subscriptionTier}
              </div>
              <div className="text-xs text-gray-500 sm:text-sm">Plan</div>
            </div>

            {/* Divider */}
            <div className="hidden h-16 w-px bg-gray-200/50 sm:block" />

            {/* Profile slots */}
            <div className="text-center">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 shadow-lg sm:mb-2 sm:h-14 sm:w-14">
                <FireIcon className="h-5 w-5 text-white sm:h-7 sm:w-7" />
              </div>
              <div className="text-2xl font-bold text-gray-800 sm:text-3xl">
                {family.subscriptionTier === 'family' ? 5 - totalProfiles : 1 - totalProfiles}
              </div>
              <div className="text-xs text-gray-500 sm:text-sm">Slots</div>
            </div>
          </div>
        </div>

        {/* Family Collection Goal */}
        <FamilyCollectionGoal familyId={familyId} goalTarget={500} />

        {/* Family Leaderboard */}
        <FamilyLeaderboard familyId={familyId} />

        {/* Trade Suggestion Engine */}
        <TradeSuggestionEngine familyId={familyId} maxSuggestions={10} />

        {/* Pricing toggle control */}
        <div className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="h-5 w-5 flex-shrink-0 text-amber-500" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-800 sm:text-base">TCGPlayer Prices</div>
              <div className="text-xs text-gray-500 sm:text-sm">
                {showPricing
                  ? 'Estimated card values are visible'
                  : 'Prices are hidden from display'}
              </div>
            </div>
          </div>
          <PricingToggle showPricing={showPricing} onToggle={() => setShowPricing(!showPricing)} />
        </div>

        {/* Profile cards grid */}
        {profiles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => (
              <ChildProfileCard
                key={profile._id}
                profileId={profile._id}
                displayName={profile.displayName}
                avatarUrl={profile.avatarUrl}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <UserGroupIcon className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-gray-800">No Collectors Yet</h3>
            <p className="mb-6 text-gray-500">
              Add profiles for your kids to start tracking their Pokemon card collections!
            </p>
            <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-kid-primary to-purple-500 px-6 py-3 font-semibold text-white shadow-md transition hover:shadow-lg">
              <UserGroupIcon className="h-5 w-5" />
              Add First Collector
            </button>
          </div>
        )}
      </div>
    </PricingVisibilityContext.Provider>
  );
}
