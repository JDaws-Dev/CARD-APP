import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/Skeleton';
import { StreakCalendarSkeleton } from '@/components/gamification/StreakCalendar';

export default function StreakLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-yellow-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="mb-4 h-4 w-32" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg">
                <CalendarDaysIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <Skeleton className="mb-2 h-8 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>

        {/* Info card skeleton */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-orange-100 to-amber-100 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="mb-2 h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-3/4" />
            </div>
          </div>
        </div>

        {/* Calendar skeleton */}
        <StreakCalendarSkeleton />

        {/* Tips section skeleton */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <Skeleton className="mt-1 h-1.5 w-1.5 rounded-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* CTA skeleton */}
        <div className="mt-6 flex justify-center">
          <Skeleton className="h-12 w-40 rounded-full" />
        </div>
      </div>
    </main>
  );
}
