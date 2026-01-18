'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { useQuery, useConvexAuth } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import { CollectionView } from '@/components/collection/CollectionView';
import { ExportChecklistButton } from '@/components/collection/ExportChecklist';
import Link from 'next/link';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  Square3Stack3DIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { ScannerButton } from '@/components/ai/ScannerButton';
import { ChatButton } from '@/components/ai/ChatButton';
import { RecommendationsPanel } from '@/components/ai/RecommendationsPanel';
import { Skeleton, CollectionGroupSkeleton } from '@/components/ui/Skeleton';
import { ActivityFeed, ActivityFeedSkeleton } from '@/components/activity/ActivityFeed';
import { TrophyRoomSkeleton } from '@/components/virtual/VirtualTrophyRoom';
import { TradeLoggingModal, TradeHistory } from '@/components/trades';

// Lazy load VirtualTrophyRoom - it's not critical for initial page render
const VirtualTrophyRoom = lazy(() => import('@/components/virtual/VirtualTrophyRoom'));

export default function MyCollectionPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const { primaryGame } = useGameSelector();

  // Trade modal state
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  const collection = useQuery(
    api.collections.getCollection,
    profileId ? { profileId: profileId as Id<'profiles'>, gameSlug: primaryGame.id } : 'skip'
  );

  const stats = useQuery(
    api.collections.getCollectionStats,
    profileId ? { profileId: profileId as Id<'profiles'>, gameSlug: primaryGame.id } : 'skip'
  );

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading while checking auth or if redirecting
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-kid-primary border-t-transparent" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Loading state with skeleton screens
  if (profileLoading || collection === undefined || stats === undefined) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header skeleton */}
          <div className="mb-8">
            <Skeleton className="mb-4 h-4 w-24" />
            <Skeleton className="mb-2 h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>

          {/* Stats skeleton */}
          <div className="mb-6 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-white p-3 shadow-sm sm:p-6">
                <div className="text-center">
                  <Skeleton className="mx-auto mb-2 h-8 w-12 sm:h-10 sm:w-16" />
                  <Skeleton className="mx-auto h-3 w-14 sm:h-4 sm:w-20" />
                </div>
              </div>
            ))}
          </div>

          {/* Main content layout skeleton */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Collection skeleton */}
            <div className="space-y-8 lg:col-span-3">
              <CollectionGroupSkeleton />
              <CollectionGroupSkeleton />
            </div>

            {/* Activity feed skeleton */}
            <div className="rounded-xl bg-white p-4 shadow-sm lg:col-span-1">
              <div className="mb-4 flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-32" />
              </div>
              <ActivityFeedSkeleton count={5} />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header - simplified */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">My Collection</h1>
              <p className="text-sm text-gray-500 sm:text-base">
                All your collected {primaryGame.shortName} cards in one place
              </p>
            </div>
            {/* Primary actions - Scanner is most important */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ScannerButton variant="primary" label="Scan Card" />
              {/* Trade button - visible on all sizes */}
              <button
                onClick={() => setIsTradeModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                title="Log a Trade"
              >
                <ArrowsRightLeftIcon className="h-5 w-5" />
                <span>Log Trade</span>
              </button>
              {/* Secondary actions hidden on mobile, shown on desktop */}
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/timeline"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                  title="Collection Timeline"
                >
                  <CalendarDaysIcon className="h-5 w-5" />
                  <span className="hidden md:inline">Timeline</span>
                </Link>
                <ExportChecklistButton collection={collection} stats={stats} />
              </div>
            </div>
          </div>
        </div>

        {/* Virtual Trophy Room - lazy loaded with Suspense */}
        <div className="mb-6 sm:mb-8">
          <Suspense fallback={<TrophyRoomSkeleton />}>
            <VirtualTrophyRoom />
          </Suspense>
        </div>

        {/* Stats Overview */}
        <div className="mb-6 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-4">
          <div className="rounded-xl bg-white p-3 shadow-sm sm:p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-kid-primary sm:text-4xl">
                {stats.totalCards}
              </div>
              <div className="text-xs text-gray-500 sm:text-sm">Total Cards</div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm sm:p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-kid-secondary sm:text-4xl">
                {stats.uniqueCards}
              </div>
              <div className="text-xs text-gray-500 sm:text-sm">Unique Cards</div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm sm:p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-kid-success sm:text-4xl">
                {stats.setsStarted}
              </div>
              <div className="text-xs text-gray-500 sm:text-sm">Sets Started</div>
            </div>
          </div>
        </div>

        {/* Main content with sidebar layout */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-4">
          {/* Collection Content */}
          <div className="lg:col-span-3">
            {collection.length === 0 ? (
              <div className="rounded-xl bg-white p-12 text-center shadow-sm">
                <div className="mb-4 flex justify-center">
                  <Square3Stack3DIcon className="h-16 w-16 text-gray-300" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-800">No cards yet!</h2>
                <p className="mb-6 text-gray-500">
                  Start building your collection by browsing sets and tapping on cards you own.
                </p>
                <Link
                  href="/sets"
                  className="inline-flex items-center gap-2 rounded-full bg-kid-primary px-6 py-3 font-semibold text-white transition hover:bg-kid-primary/90"
                >
                  Browse Sets
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <CollectionView collection={collection} />
            )}
          </div>

          {/* Sidebar: Recommendations + Trade History + Activity Feed */}
          <div className="lg:col-span-1">
            <div className="space-y-4 lg:sticky lg:top-4">
              {/* AI Recommendations */}
              <RecommendationsPanel limit={4} />
              {/* Trade History */}
              <TradeHistory limit={5} />
              {/* Activity Feed */}
              <ActivityFeed limit={10} />
            </div>
          </div>
        </div>
      </div>

      {/* Trade Logging Modal */}
      <TradeLoggingModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
      />

      {/* Floating Chat Button */}
      <ChatButton />
    </main>
  );
}
