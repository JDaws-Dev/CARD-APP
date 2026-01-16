'use client';

import Link from 'next/link';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { TrophyCase, TrophyCaseSkeleton } from '@/components/achievements/TrophyCase';
import type { Id } from '../../../convex/_generated/dataModel';
import { TrophyIcon } from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';

export default function BadgesPage() {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  // Loading state
  if (profileLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
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

          <TrophyCaseSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/collection"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Collection
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
              <TrophyIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Trophy Case</h1>
              <p className="text-gray-500">View all your badges and track your progress</p>
            </div>
          </div>
        </div>

        {/* Trophy Case */}
        {profileId && <TrophyCase profileId={profileId as Id<'profiles'>} />}
      </div>
    </main>
  );
}
