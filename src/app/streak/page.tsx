'use client';

import Link from 'next/link';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { StreakCalendar, StreakCalendarSkeleton } from '@/components/gamification/StreakCalendar';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import {
  StreakMilestoneRewards,
  StreakMilestoneRewardsSkeleton,
} from '@/components/gamification/StreakMilestoneRewards';
import {
  GraceDayStatus,
  GraceDayStatusSkeleton,
  WeekendPauseStatus,
  WeekendPauseStatusSkeleton,
} from '@/components/gamification/GraceDayStatus';
import {
  StreakRepairStatus,
  StreakRepairSkeleton,
} from '@/components/gamification/StreakRepair';
import { FireIcon, SparklesIcon, HomeIcon } from '@heroicons/react/24/solid';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  BoltIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/Skeleton';

export default function StreakPage() {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  // Loading state
  if (profileLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-yellow-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Header skeleton */}
          <div className="mb-8">
            <Skeleton className="mb-4 h-4 w-24" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-xl" />
              <div>
                <Skeleton className="mb-2 h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>

          <StreakCalendarSkeleton />
          <div className="mt-6">
            <StreakRepairSkeleton />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <GraceDayStatusSkeleton />
            <WeekendPauseStatusSkeleton />
          </div>
          <div className="mt-6">
            <StreakMilestoneRewardsSkeleton />
          </div>
        </div>
      </main>
    );
  }

  // No profile - prompt to sign in
  if (!profileId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-yellow-50 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl bg-white p-12 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500">
              <FireIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-800">Track Your Streak!</h1>
            <p className="mb-6 text-gray-500">
              Sign in to view your activity calendar and keep your streak going.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 px-6 py-3 font-semibold text-white shadow-md transition hover:shadow-lg"
              >
                Sign In
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                <HomeIcon className="h-5 w-5" />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-yellow-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg">
                <CalendarDaysIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Activity Calendar</h1>
                <p className="text-gray-500">Track your daily collecting activity</p>
              </div>
            </div>

            {/* Current streak counter */}
            <StreakCounter variant="compact" />
          </div>
        </div>

        {/* Info card */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-orange-100 to-amber-100 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
              <BoltIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Build Your Streak!</h3>
              <p className="text-sm text-gray-600">
                Add at least one card every day to keep your streak going. You get 1 free
                &ldquo;grace day&rdquo; per week, and can even spend XP to repair a broken streak
                within 48 hours!
              </p>
            </div>
          </div>
        </div>

        {/* Streak Calendar */}
        <StreakCalendar days={30} showStats={true} showLegend={true} />

        {/* Streak Repair with XP */}
        <div className="mt-6">
          <StreakRepairStatus showRepairButton={true} />
        </div>

        {/* Grace Day & Weekend Pause Protection */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <GraceDayStatus showToggle={true} />
          <WeekendPauseStatus showToggle={true} />
        </div>

        {/* Streak Milestone Rewards */}
        <div className="mt-6">
          <StreakMilestoneRewards showRewardsPreview={true} />
        </div>

        {/* Tips section */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">
            <SparklesIcon className="h-5 w-5 text-amber-500" />
            Tips to Keep Your Streak
          </h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-400" />
              <span>Add at least one card every day to maintain your streak.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
              <span>
                Use &ldquo;Just Pulled&rdquo; mode when opening packs for quick card entry.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
              <span>Check your calendar daily to see your progress and stay motivated.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-400" />
              <span>
                Grace day protection gives you 1 free missed day per week - resets every Sunday!
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
              <span>
                Enable &ldquo;Weekend Pause&rdquo; to take Saturday and Sunday off without breaking
                your streak!
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
              <span>Earn special badges at 7, 14, 30, 60, and 100 day streak milestones!</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
              <span>
                Broke your streak? Spend XP to repair it within 48 hours - longer streaks cost more
                to fix!
              </span>
            </li>
          </ul>
        </div>

        {/* Quick action to add cards */}
        <div className="mt-6 text-center">
          <Link
            href="/sets"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 px-8 py-3 font-semibold text-white shadow-md transition hover:shadow-lg"
          >
            <FireIcon className="h-5 w-5" />
            Add Cards Today
          </Link>
        </div>
      </div>
    </main>
  );
}
