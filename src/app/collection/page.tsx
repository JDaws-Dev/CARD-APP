'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { CollectionView } from '@/components/collection/CollectionView';
import Link from 'next/link';
import type { Id } from '../../../convex/_generated/dataModel';

export default function MyCollectionPage() {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  const collection = useQuery(
    api.collections.getCollection,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  const stats = useQuery(
    api.collections.getCollectionStats,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  // Loading state
  if (profileLoading || collection === undefined || stats === undefined) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 animate-bounce text-4xl">🎴</div>
              <p className="text-gray-500">Loading your collection...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Home
          </Link>

          <h1 className="text-3xl font-bold text-gray-800">My Collection</h1>
          <p className="text-gray-500">All your collected Pokemon cards in one place</p>
        </div>

        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="text-center">
              <div className="text-4xl font-bold text-kid-primary">{stats.totalCards}</div>
              <div className="text-sm text-gray-500">Total Cards</div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="text-center">
              <div className="text-4xl font-bold text-kid-secondary">{stats.uniqueCards}</div>
              <div className="text-sm text-gray-500">Unique Cards</div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="text-center">
              <div className="text-4xl font-bold text-kid-success">{stats.setsStarted}</div>
              <div className="text-sm text-gray-500">Sets Started</div>
            </div>
          </div>
        </div>

        {/* Collection Content */}
        {collection.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="mb-4 text-6xl">🃏</div>
            <h2 className="mb-2 text-xl font-bold text-gray-800">No cards yet!</h2>
            <p className="mb-6 text-gray-500">
              Start building your collection by browsing sets and tapping on cards you own.
            </p>
            <Link
              href="/sets"
              className="inline-flex items-center gap-2 rounded-full bg-kid-primary px-6 py-3 font-semibold text-white transition hover:bg-kid-primary/90"
            >
              Browse Sets →
            </Link>
          </div>
        ) : (
          <CollectionView collection={collection} />
        )}
      </div>
    </main>
  );
}
