'use client';

import { CollectionTimeline } from '@/components/collection/CollectionTimeline';
import { FirstCardCelebration } from '@/components/collection/FirstCardCelebration';
import { CollectionStatsGraph } from '@/components/collection/CollectionStatsGraph';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import Link from 'next/link';
import { ArrowLeftIcon, CalendarDaysIcon, SparklesIcon, HomeIcon } from '@heroicons/react/24/outline';
import { CollectionTimelineSkeleton } from '@/components/collection/CollectionTimeline';

export default function TimelinePage() {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  // Loading state
  if (profileLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <div className="mb-4 h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="mb-2 h-8 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
          </div>
          <CollectionTimelineSkeleton />
        </div>
      </main>
    );
  }

  // No profile - prompt to login
  if (!profileId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl bg-white p-12 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500">
              <CalendarDaysIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-800">Collection Timeline</h1>
            <p className="mb-6 text-gray-500">
              Sign in to see your collection journey through time.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-kid-primary to-purple-500 px-6 py-3 font-semibold text-white shadow-md transition hover:shadow-lg"
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
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/collection"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Collection
          </Link>

          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <CalendarDaysIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Collection Timeline</h1>
              <p className="flex items-center gap-1 text-gray-500">
                <SparklesIcon className="h-4 w-4" />
                Your collecting journey through time
              </p>
            </div>
          </div>
        </div>

        {/* First Card Celebration */}
        <div className="mb-6">
          <FirstCardCelebration />
        </div>

        {/* Collection Stats Graph */}
        <div className="mb-6">
          <CollectionStatsGraph />
        </div>

        {/* Timeline */}
        <CollectionTimeline />
      </div>
    </main>
  );
}
