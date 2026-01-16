import { Skeleton } from '@/components/ui/Skeleton';
import { DuplicateFinderSkeleton } from '@/components/collection/DuplicateFinder';

export default function CompareLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="mb-4 h-4 w-32" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="mb-2 h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
        </div>

        {/* Duplicate finder skeleton */}
        <DuplicateFinderSkeleton />
      </div>
    </main>
  );
}
