import { CollectionTimelineSkeleton } from '@/components/collection/CollectionTimeline';

export default function TimelineLoading() {
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
