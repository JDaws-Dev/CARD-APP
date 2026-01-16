import { TrophyIcon } from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';

export default function BadgesLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="mb-4 h-4 w-24" />
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
              <TrophyIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <Skeleton className="mb-2 h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>

        {/* Trophy case skeleton */}
        <div className="space-y-8">
          {/* Stats header skeleton */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-center gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton className="mx-auto mb-2 h-12 w-12 rounded-full" />
                  <Skeleton className="mx-auto mb-1 h-8 w-16" />
                  <Skeleton className="mx-auto h-4 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* Category sections skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl bg-gray-50 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div>
                    <Skeleton className="mb-2 h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <Skeleton className="h-8 w-16 rounded-full" />
              </div>
              <Skeleton className="mb-6 h-2 w-full rounded-full" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex flex-col items-center rounded-2xl bg-white p-4">
                    <Skeleton className="mb-3 h-16 w-16 rounded-full" />
                    <Skeleton className="mb-1 h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
