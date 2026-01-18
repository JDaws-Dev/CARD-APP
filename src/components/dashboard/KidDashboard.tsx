'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  Square3Stack3DIcon,
  TrophyIcon,
  HeartIcon,
  RocketLaunchIcon,
  SparklesIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  BookOpenIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { FireIcon, StarIcon, BoltIcon, TrophyIcon as TrophyIconSolid } from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';
import { ActivityFeed, ActivityFeedSkeleton } from '@/components/activity/ActivityFeed';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { LevelDisplay } from '@/components/gamification/LevelSystem';
import { MilestoneProgress } from '@/components/gamification/MilestoneCelebration';
import { StreakCalendar, StreakCalendarSkeleton } from '@/components/gamification/StreakCalendar';
import { CollectionSnapshotShare } from '@/components/collection/CollectionSnapshotShare';
import { cn } from '@/lib/utils';
import { FamilyCollectionGoal } from '@/components/family/FamilyCollectionGoal';
import { FamilyLeaderboard } from '@/components/family/FamilyLeaderboard';
import { WhatsNextCard } from '@/components/dashboard/WhatsNextCard';
import { RecentCardsPreview, RecentCardsPreviewSkeleton } from '@/components/dashboard/RecentCardsPreview';
import { FeaturedCardsPreview, FeaturedCardsPreviewSkeleton } from '@/components/dashboard/FeaturedCardsPreview';
import { getDisplayName } from '@/lib/displayName';
import { getGameInfo, type GameId } from '@/lib/gameSelector';
import { getGameIcon } from '@/components/icons/tcg';

// ============================================================================
// QUICK ACTION CARDS
// ============================================================================

interface QuickActionCardProps {
  href: string;
  icon: typeof Square3Stack3DIcon;
  title: string;
  description: string;
  gradient: string;
  iconGradient: string;
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  gradient,
  iconGradient,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex items-center gap-3 rounded-2xl p-4 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md sm:gap-4',
        gradient
      )}
    >
      {/* Larger touch-friendly icon container */}
      <div
        className={cn(
          'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md',
          iconGradient
        )}
      >
        <Icon className="h-7 w-7 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-gray-800 group-hover:text-gray-900">{title}</h3>
        {/* Hide description on very small screens to reduce text */}
        <p className="hidden text-sm text-gray-500 xs:block sm:block">{description}</p>
      </div>
      <ArrowRightIcon className="h-6 w-6 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-gray-600" />
    </Link>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  icon: typeof Square3Stack3DIcon;
  value: number | string;
  label: string;
  gradient: string;
  iconColor: string;
  animate?: boolean;
}

function StatCard({ icon: Icon, value, label, gradient, iconColor, animate }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-3 shadow-sm transition-all hover:shadow-md sm:p-4',
        gradient
      )}
      role="group"
      aria-label={`${label}: ${value}`}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '16px 16px',
        }}
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-2 sm:gap-3">
        {/* Slightly larger icon container for better touch */}
        <div
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl bg-white/60 shadow-sm sm:h-12 sm:w-12',
            animate && 'animate-pulse'
          )}
          aria-hidden="true"
        >
          <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', iconColor)} />
        </div>
        <div>
          <div className="text-xl font-bold text-gray-800 sm:text-2xl" aria-hidden="true">
            {value}
          </div>
          <div className="text-[10px] font-medium text-gray-500 sm:text-xs" aria-hidden="true">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BADGE PROGRESS PREVIEW
// ============================================================================

interface BadgeProgressPreviewProps {
  className?: string;
}

function BadgeProgressPreview({ className }: BadgeProgressPreviewProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  const achievements = useQuery(
    api.achievements.getAchievements,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  if (profileLoading || achievements === undefined) {
    return (
      <div className={cn('rounded-2xl bg-white p-4 shadow-sm', className)}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-12 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  // Get the 4 most recent earned badges
  const earnedBadges = achievements
    .filter((a) => a.earnedAt !== null)
    .sort((a, b) => (b.earnedAt ?? 0) - (a.earnedAt ?? 0))
    .slice(0, 4);

  const totalEarned = achievements.filter((a) => a.earnedAt !== null).length;
  const totalBadges = achievements.length;

  return (
    <div className={cn('rounded-2xl bg-white p-4 shadow-sm', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-gray-800">Badges</h3>
        </div>
        {/* Larger touch target for kid-friendly tapping */}
        <Link
          href="/badges"
          className="flex items-center gap-1.5 rounded-full bg-kid-primary/10 px-3 py-1.5 text-sm font-medium text-kid-primary transition-colors hover:bg-kid-primary/20"
        >
          View all
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {earnedBadges.length === 0 ? (
        <div className="py-4 text-center">
          <TrophyIcon className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">No badges yet</p>
          <p className="text-xs text-gray-400">Start collecting to earn badges!</p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex gap-2">
            {earnedBadges.map((badge, index) => (
              <div
                key={badge.achievementKey}
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br shadow-md',
                  index === 0
                    ? 'from-amber-400 to-orange-500'
                    : index === 1
                      ? 'from-indigo-400 to-purple-500'
                      : index === 2
                        ? 'from-emerald-400 to-teal-500'
                        : 'from-rose-400 to-pink-500'
                )}
                title={badge.achievementKey}
              >
                <StarIcon className="h-6 w-6 text-white" />
              </div>
            ))}
            {earnedBadges.length < 4 &&
              Array.from({ length: 4 - earnedBadges.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-gray-200 bg-gray-50"
                >
                  <StarIcon className="h-5 w-5 text-gray-300" />
                </div>
              ))}
          </div>
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{totalEarned}</span> of {totalBadges}{' '}
            badges earned
          </p>
        </>
      )}
    </div>
  );
}

// ============================================================================
// STREAK CALENDAR PREVIEW
// ============================================================================

interface StreakCalendarPreviewProps {
  className?: string;
}

function StreakCalendarPreview({ className }: StreakCalendarPreviewProps) {
  return (
    <div className={cn('rounded-2xl bg-white shadow-sm', className)}>
      {/* Header with link to full calendar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 p-4">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold text-gray-800">Activity Calendar</h3>
        </div>
        {/* Larger touch target for kid-friendly tapping */}
        <Link
          href="/streak"
          className="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-200"
        >
          View calendar
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
      {/* Compact calendar view */}
      <div className="p-4">
        <StreakCalendar days={14} showStats={false} showLegend={false} />
      </div>
    </div>
  );
}

// ============================================================================
// GAMIFICATION HERO SECTION
// ============================================================================

interface GamificationHeroProps {
  className?: string;
}

function GamificationHero({ className }: GamificationHeroProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  const streakProgress = useQuery(
    api.achievements.getStreakProgress,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  const achievements = useQuery(
    api.achievements.getAchievements,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  const milestoneProgress = useQuery(
    api.achievements.getMilestoneProgress,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  if (profileLoading || streakProgress === undefined || achievements === undefined || milestoneProgress === undefined) {
    return (
      <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
        <div className="animate-pulse rounded-3xl bg-gradient-to-br from-orange-100 to-amber-50 p-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-white/50" />
            <div className="flex-1">
              <div className="mb-2 h-10 w-28 rounded bg-white/50" />
              <div className="h-4 w-36 rounded bg-white/50" />
            </div>
          </div>
        </div>
        <div className="animate-pulse rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-50 p-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-white/50" />
            <div className="flex-1">
              <div className="mb-2 h-10 w-28 rounded bg-white/50" />
              <div className="h-4 w-36 rounded bg-white/50" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStreak = streakProgress.currentStreak ?? 0;
  const isHotStreak = currentStreak >= 7;
  const isOnFire = currentStreak >= 14;
  const isSuperStreak = currentStreak >= 30;

  // Get recent badges for celebration (within 48 hours for more visibility)
  const recentBadges = achievements
    .filter((a) => a.earnedAt !== null && Date.now() - (a.earnedAt ?? 0) < 48 * 60 * 60 * 1000)
    .sort((a, b) => (b.earnedAt ?? 0) - (a.earnedAt ?? 0));

  const hasRecentBadges = recentBadges.length > 0;

  // Calculate XP for display
  const totalXP = milestoneProgress.totalUniqueCards * 2;

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
      {/* Enhanced Streak Display - More prominent with larger elements */}
      <Link
        href="/streak"
        className={cn(
          'group relative overflow-hidden rounded-3xl p-6 shadow-xl transition-all hover:scale-[1.02] hover:shadow-2xl',
          'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500',
          isOnFire && 'animate-streak-glow'
        )}
      >
        {/* Animated background particles - always show some, more for hot streaks */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute left-4 top-4 h-3 w-3 animate-ping rounded-full bg-yellow-300/50" style={{ animationDelay: '0s' }} />
          <div className="absolute right-8 top-6 h-2 w-2 animate-ping rounded-full bg-orange-300/50" style={{ animationDelay: '0.3s' }} />
          <div className="absolute bottom-12 left-8 h-2.5 w-2.5 animate-ping rounded-full bg-pink-300/50" style={{ animationDelay: '0.6s' }} />
          <div className="absolute bottom-6 right-6 h-2 w-2 animate-ping rounded-full bg-yellow-300/50" style={{ animationDelay: '0.9s' }} />
          {isHotStreak && (
            <>
              <div className="absolute left-1/3 top-8 h-2 w-2 animate-ping rounded-full bg-red-300/40" style={{ animationDelay: '1.2s' }} />
              <div className="absolute bottom-10 right-1/4 h-2 w-2 animate-ping rounded-full bg-amber-300/40" style={{ animationDelay: '1.5s' }} />
            </>
          )}
        </div>

        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '20px 20px',
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-5">
          {/* Extra large animated fire icon with glow effect */}
          <div className={cn(
            'relative flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl shadow-xl backdrop-blur-sm',
            'bg-gradient-to-br from-yellow-400/30 to-orange-500/30',
            isOnFire && 'animate-level-pulse'
          )}>
            {/* Animated ring behind fire */}
            {isHotStreak && (
              <div className="absolute inset-0 animate-achievement-ring rounded-2xl bg-yellow-400/20" aria-hidden="true" />
            )}
            <FireIcon
              className={cn(
                'h-12 w-12 text-white',
                currentStreak > 0 ? 'animate-fire-dance' : 'drop-shadow-lg'
              )}
              aria-hidden="true"
            />
            {isOnFire && (
              <>
                <SparklesIcon
                  className="animate-sparkle absolute -right-2 -top-2 h-6 w-6 text-yellow-300 drop-shadow-lg"
                  aria-hidden="true"
                />
                <SparklesIcon
                  className="animate-sparkle absolute -bottom-1 -left-2 h-5 w-5 text-yellow-300 drop-shadow-lg"
                  style={{ animationDelay: '0.5s' }}
                  aria-hidden="true"
                />
                {isSuperStreak && (
                  <SparklesIcon
                    className="animate-sparkle absolute -top-1 left-1/2 h-4 w-4 -translate-x-1/2 text-amber-200 drop-shadow-lg"
                    style={{ animationDelay: '1s' }}
                    aria-hidden="true"
                  />
                )}
              </>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold text-white drop-shadow-lg">
                {currentStreak}
              </span>
              <span className="text-xl font-bold text-white/90">
                day{currentStreak !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="mt-1 text-base font-semibold text-white/90">
              {currentStreak === 0
                ? 'Start your streak today!'
                : currentStreak < 3
                  ? 'Keep it going!'
                  : currentStreak < 7
                    ? 'Great streak!'
                    : currentStreak < 14
                      ? 'Amazing streak!'
                      : currentStreak < 30
                        ? "You're on fire!"
                        : 'LEGENDARY!'}
            </p>
          </div>

          {/* Arrow indicator */}
          <ArrowRightIcon className="h-6 w-6 flex-shrink-0 text-white/70 transition-transform group-hover:translate-x-1 group-hover:text-white" />
        </div>

        {/* Next milestone hint - more prominent */}
        {streakProgress.nextBadge && (
          <div className="relative mt-4 flex items-center gap-3 rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400/30">
              <TrophyIconSolid className="h-5 w-5 text-yellow-300" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-white">
              <span className="font-bold">{streakProgress.nextBadge.daysNeeded}</span> more day{streakProgress.nextBadge.daysNeeded !== 1 ? 's' : ''} for{' '}
              <span className="font-bold text-yellow-200">{streakProgress.nextBadge.name}</span>
            </span>
          </div>
        )}
      </Link>

      {/* Enhanced Level/XP Display - More prominent with visual progress */}
      <div className={cn(
        'relative overflow-hidden rounded-3xl p-6 shadow-xl',
        'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
      )}>
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '20px 20px',
          }}
          aria-hidden="true"
        />

        {/* Animated sparkle particles for level */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <SparklesIcon className="animate-sparkle absolute left-6 top-6 h-4 w-4 text-white/30" style={{ animationDelay: '0s' }} />
          <SparklesIcon className="animate-sparkle absolute right-10 top-10 h-3 w-3 text-white/25" style={{ animationDelay: '0.7s' }} />
          <SparklesIcon className="animate-sparkle absolute bottom-16 left-10 h-4 w-4 text-white/30" style={{ animationDelay: '1.4s' }} />
        </div>

        <div className="relative">
          <LevelDisplay variant="full" className="!bg-transparent !p-0 !shadow-none" />
        </div>

        {/* XP Total display - more prominent */}
        <div className="relative mt-4 flex items-center justify-between rounded-xl bg-white/15 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-yellow-300" aria-hidden="true" />
            <span className="text-sm font-bold text-white">{totalXP} Total XP</span>
          </div>
          <span className="text-sm font-medium text-white/80">
            {milestoneProgress.totalUniqueCards} cards
          </span>
        </div>

        {/* Recent badges celebration - extended window and more prominent */}
        {hasRecentBadges && (
          <div className="relative mt-3 overflow-hidden rounded-xl bg-gradient-to-r from-amber-400/30 to-orange-500/30 px-4 py-3 backdrop-blur-sm">
            {/* Shine animation on badge celebration */}
            <div className="absolute inset-0 animate-badge-shine" aria-hidden="true" />
            <div className="relative flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
                {/* Pulsing ring */}
                <div className="absolute inset-0 animate-achievement-ring rounded-full bg-amber-400/40" aria-hidden="true" />
                <StarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {recentBadges.length === 1 ? 'New Badge!' : `${recentBadges.length} New Badges!`}
                </p>
                <p className="text-xs font-medium text-white/80">
                  {recentBadges[0].achievementKey}
                  {recentBadges.length > 1 && ` +${recentBadges.length - 1} more`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// KID DASHBOARD SKELETON
// ============================================================================

export function KidDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome header skeleton */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Skeleton className="mb-2 h-8 w-48 bg-white/20" />
            <Skeleton className="h-5 w-64 bg-white/20" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-24 rounded-full bg-white/20" />
            <Skeleton className="h-10 w-20 rounded-full bg-white/20" />
          </div>
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div>
                <Skeleton className="mb-1 h-7 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Featured cards skeleton */}
      <FeaturedCardsPreviewSkeleton />

      {/* Recent cards skeleton */}
      <RecentCardsPreviewSkeleton />

      {/* Quick actions skeleton */}
      <div>
        <Skeleton className="mb-3 h-6 w-28" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="mb-1 h-5 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress section skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm lg:col-span-2">
          <Skeleton className="mb-4 h-6 w-32" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <Skeleton className="mb-4 h-6 w-24" />
          <ActivityFeedSkeleton count={4} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KID DASHBOARD COMPONENT
// ============================================================================

interface KidDashboardProps {
  /** Game slug to filter stats by */
  gameSlug: string;
  /** Display name of the active game */
  gameName: string;
}

export function KidDashboard({ gameSlug, gameName }: KidDashboardProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  const stats = useQuery(
    api.collections.getCollectionStats,
    profileId ? { profileId: profileId as Id<'profiles'>, gameSlug: gameSlug as 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana' } : 'skip'
  );

  const streakProgress = useQuery(
    api.achievements.getStreakProgress,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  // Get profile name for greeting
  const profile = useQuery(
    api.profiles.getProfile,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  // Determine greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Get game icon component - updates when gameSlug changes
  // Must be called before early return to satisfy React hooks rules
  const GameIcon = useMemo(() => getGameIcon(gameSlug as GameId), [gameSlug]);

  // Get game info for theming
  const gameInfo = getGameInfo(gameSlug as GameId);

  // Loading state
  if (profileLoading || stats === undefined || streakProgress === undefined) {
    return <KidDashboardSkeleton />;
  }

  const profileName = getDisplayName(profile?.displayName);
  const currentStreak = streakProgress.currentStreak ?? 0;
  const isActiveToday = streakProgress.isActiveToday ?? false;

  return (
    <div className="space-y-6">
      {/* Welcome Header - uses game-specific gradient */}
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl p-6 text-white shadow-lg bg-gradient-to-r',
          gameInfo?.gradientFrom || 'from-indigo-500',
          gameInfo?.gradientTo || 'to-purple-500'
        )}
      >
        {/* Background decorations */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />
        <SparklesIcon
          className="absolute -right-4 -top-4 h-24 w-24 rotate-12 text-white/10"
          aria-hidden="true"
        />
        <SparklesIcon
          className="absolute -bottom-6 -left-6 h-20 w-20 -rotate-12 text-white/10"
          aria-hidden="true"
        />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Game Logo Badge */}
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm sm:h-16 sm:w-16">
              <GameIcon className="h-8 w-8 text-white drop-shadow sm:h-10 sm:w-10" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/70">{gameInfo?.shortName || gameName}</p>
              <h1 className="text-xl font-bold drop-shadow sm:text-2xl md:text-3xl">
                {greeting}, {profileName}!
              </h1>
              <p className="mt-1 text-sm text-white/80 sm:text-base">
                {stats.totalCards === 0
                  ? "Let's start your collection adventure!"
                  : isActiveToday
                    ? "Great job! You've added cards today!"
                    : 'Ready to add some cards?'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StreakCounter variant="compact" />
            <LevelDisplay variant="compact" />
          </div>
        </div>

        {/* Streak encouragement and share */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {currentStreak > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2">
              <FireIcon className="h-5 w-5 text-orange-300" aria-hidden="true" />
              <span className="text-sm">
                {currentStreak === 1
                  ? 'You started a streak! Come back tomorrow to keep it going!'
                  : currentStreak < 7
                    ? `${currentStreak} day streak! Keep it up!`
                    : currentStreak < 14
                      ? `Amazing ${currentStreak} day streak! You're on fire!`
                      : `Incredible ${currentStreak} day streak! You're a legend!`}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <CollectionSnapshotShare className="bg-white/20 hover:bg-white/30" />
          </div>
        </div>
      </div>

      {/* Gamification Hero - Prominent streak and level display */}
      <GamificationHero />

      {/* Stats Grid */}
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
        role="region"
        aria-label={`Collection stats: ${stats.totalCards} total cards, ${stats.uniqueCards} unique cards, ${stats.setsStarted} sets started, ${currentStreak} day streak`}
      >
        <StatCard
          icon={Square3Stack3DIcon}
          value={stats.totalCards}
          label="Total Cards"
          gradient="bg-gradient-to-br from-indigo-50 to-blue-50"
          iconColor="text-indigo-500"
        />
        <StatCard
          icon={SparklesIcon}
          value={stats.uniqueCards}
          label="Unique Cards"
          gradient="bg-gradient-to-br from-purple-50 to-pink-50"
          iconColor="text-purple-500"
        />
        <StatCard
          icon={RocketLaunchIcon}
          value={stats.setsStarted}
          label="Sets Started"
          gradient="bg-gradient-to-br from-emerald-50 to-teal-50"
          iconColor="text-emerald-500"
        />
        <StatCard
          icon={FireIcon}
          value={currentStreak}
          label="Day Streak"
          gradient="bg-gradient-to-br from-orange-50 to-amber-50"
          iconColor="text-orange-500"
          animate={currentStreak >= 7}
        />
      </div>

      {/* What's Next Card - Shows for new users */}
      <WhatsNextCard totalCards={stats.totalCards} setsStarted={stats.setsStarted} />

      {/* Featured Cards Spotlight - Only show if user has cards */}
      {stats.totalCards > 0 && <FeaturedCardsPreview count={3} gameSlug={gameSlug} />}

      {/* Recently Added Cards - Only show if user has cards */}
      {stats.totalCards > 0 && <RecentCardsPreview limit={10} gameSlug={gameSlug} />}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <BoltIcon className="h-5 w-5 text-kid-primary" />
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <QuickActionCard
            href="/sets"
            icon={PlusIcon}
            title="Add Cards"
            description="Browse sets and add new cards"
            gradient="bg-gradient-to-r from-emerald-50 to-teal-50"
            iconGradient="from-emerald-400 to-teal-500"
          />
          <QuickActionCard
            href="/collection"
            icon={Square3Stack3DIcon}
            title="My Collection"
            description="View all your collected cards"
            gradient="bg-gradient-to-r from-indigo-50 to-blue-50"
            iconGradient="from-indigo-400 to-blue-500"
          />
          <QuickActionCard
            href="/my-wishlist"
            icon={HeartIcon}
            title="Wishlist"
            description="Cards you want to get"
            gradient="bg-gradient-to-r from-rose-50 to-pink-50"
            iconGradient="from-rose-400 to-pink-500"
          />
          <QuickActionCard
            href="/search"
            icon={MagnifyingGlassIcon}
            title="Search Cards"
            description={`Find any ${gameName} card`}
            gradient="bg-gradient-to-r from-amber-50 to-orange-50"
            iconGradient="from-amber-400 to-orange-500"
          />
        </div>
      </div>

      {/* Progress and Activity Section */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Progress Cards */}
        <div className="space-y-4 lg:col-span-2">
          {/* Badge Progress - Moved higher for prominence */}
          <BadgeProgressPreview />

          {/* Milestone Progress */}
          <MilestoneProgress />

          {/* Family Collection Goal */}
          {profile?.familyId && (
            <FamilyCollectionGoal familyId={profile.familyId} goalTarget={500} variant="compact" />
          )}

          {/* Family Leaderboard */}
          {profile?.familyId && <FamilyLeaderboard familyId={profile.familyId} variant="compact" />}

          {/* Streak Calendar Preview */}
          <StreakCalendarPreview />
        </div>

        {/* Right: Activity Feed */}
        <div className="lg:col-span-1">
          <ActivityFeed limit={6} className="h-full" />
        </div>
      </div>

      {/* Learning Section */}
      <div className="rounded-2xl bg-gradient-to-r from-cyan-50 to-sky-50 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 shadow-md">
              <BookOpenIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Learn to Collect</h3>
              <p className="text-sm text-gray-500">Tips and guides for young collectors</p>
            </div>
          </div>
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-cyan-500 hover:to-sky-600"
          >
            Start Learning
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
