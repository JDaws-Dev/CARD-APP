import { Skeleton } from '@/components/ui/Skeleton';

export default function ParentDashboardLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="mb-4 h-4 w-24" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div>
              <Skeleton className="mb-2 h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>

        {/* Stats header skeleton */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="mx-auto mb-2 h-14 w-14 rounded-full" />
                <Skeleton className="mx-auto mb-1 h-8 w-16" />
                <Skeleton className="mx-auto h-4 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Profile cards skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-white p-6 shadow-sm">
              {/* Header */}
              <div className="mb-6 flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="mb-2 h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              {/* Stats grid */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="rounded-xl bg-gray-50 p-4">
                    <Skeleton className="mx-auto mb-2 h-5 w-5" />
                    <Skeleton className="mx-auto mb-1 h-6 w-12" />
                    <Skeleton className="mx-auto h-3 w-16" />
                  </div>
                ))}
              </div>

              {/* Recent activity */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                {[1, 2].map((j) => (
                  <div key={j} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-3 w-32 flex-1" />
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
