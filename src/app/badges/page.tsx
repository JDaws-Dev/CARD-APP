'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConvexAuth } from 'convex/react';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { TrophyCase, TrophyCaseSkeleton } from '@/components/achievements/TrophyCase';
import type { Id } from '../../../convex/_generated/dataModel';
import { TrophyIcon } from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';
import { BackLink } from '@/components/ui/BackLink';

export default function BadgesPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading while checking auth or if redirecting
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Loading state for profile
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
          <BackLink href="/collection" withMargin>
            Back to Collection
          </BackLink>

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
