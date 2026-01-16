import { SparklesIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/Skeleton';
import { ActivityFeedSkeleton } from '@/components/activity/ActivityFeed';

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Back link skeleton */}
        <Skeleton className="mb-6 h-4 w-24" />

        <div className="space-y-6">
          {/* Welcome header skeleton */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white shadow-lg">
            <SparklesIcon
              className="absolute -right-4 -top-4 h-24 w-24 rotate-12 text-white/10"
              aria-hidden="true"
            />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Skeleton className="mb-2 h-8 w-48 bg-white/20" />
                <Skeleton className="h-5 w-64 bg-white/20" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-24 rounded-full bg-white/20" />
                <Skeleton className="h-10 w-20 rounded-full bg-white/20" />
              </div>
            </div>
          </div>

          {/* Stats grid skeleton */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              'from-indigo-50 to-blue-50',
              'from-purple-50 to-pink-50',
              'from-emerald-50 to-teal-50',
              'from-orange-50 to-amber-50',
            ].map((gradient, i) => (
              <div key={i} className={`rounded-2xl bg-gradient-to-br p-4 shadow-sm ${gradient}`}>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl bg-white/60" />
                  <div>
                    <Skeleton className="mb-1 h-7 w-12 bg-gray-200" />
                    <Skeleton className="h-3 w-16 bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions skeleton */}
          <div>
            <Skeleton className="mb-3 h-6 w-28" />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                'from-emerald-50 to-teal-50',
                'from-indigo-50 to-blue-50',
                'from-rose-50 to-pink-50',
                'from-amber-50 to-orange-50',
              ].map((gradient, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 rounded-2xl bg-gradient-to-r p-4 shadow-sm ${gradient}`}
                >
                  <Skeleton className="h-12 w-12 rounded-xl bg-white/60" />
                  <div className="flex-1">
                    <Skeleton className="mb-1 h-5 w-24 bg-gray-200" />
                    <Skeleton className="h-4 w-32 bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress section skeleton */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {/* Level progress skeleton */}
              <div className="rounded-2xl bg-gradient-to-r from-gray-400 to-gray-500 p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-full bg-white/20" />
                  <div className="flex-1">
                    <Skeleton className="mb-2 h-5 w-24 bg-white/20" />
                    <Skeleton className="mb-2 h-4 w-40 bg-white/20" />
                    <Skeleton className="h-2 w-full rounded-full bg-white/20" />
                  </div>
                </div>
              </div>

              {/* Milestone progress skeleton */}
              <div className="rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="mb-1 h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>

              {/* Badge progress skeleton */}
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-12 rounded-full" />
                  ))}
                </div>
              </div>
            </div>

            {/* Activity feed skeleton */}
            <div className="rounded-xl bg-white p-4 shadow-sm lg:col-span-1">
              <div className="mb-4 flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-32" />
              </div>
              <ActivityFeedSkeleton count={4} />
            </div>
          </div>

          {/* Learning section skeleton */}
          <div className="rounded-2xl bg-gradient-to-r from-cyan-50 to-sky-50 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl bg-white/60" />
                <div>
                  <Skeleton className="mb-1 h-5 w-32 bg-gray-200" />
                  <Skeleton className="h-4 w-48 bg-gray-200" />
                </div>
              </div>
              <Skeleton className="h-10 w-32 rounded-full bg-white/60" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
