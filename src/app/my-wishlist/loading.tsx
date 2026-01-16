import { Skeleton } from '@/components/ui/Skeleton';

function WishlistCardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="mt-3 space-y-2">
        <Skeleton className="mx-auto h-4 w-3/4" />
        <Skeleton className="mx-auto h-3 w-1/2" />
      </div>
      <div className="mt-3 flex justify-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

export default function MyWishlistLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-pink-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header skeleton */}
        <div className="mb-8">
          <Skeleton className="mb-4 h-4 w-24" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full sm:h-16 sm:w-16" />
            <div>
              <Skeleton className="mb-2 h-8 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="mx-auto mb-8 flex max-w-lg justify-center gap-4 rounded-xl bg-white p-4 shadow-sm sm:gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="mx-auto mb-2 h-10 w-12" />
              <Skeleton className="mx-auto h-4 w-16" />
            </div>
          ))}
        </div>

        {/* Share link skeleton */}
        <div className="mx-auto mb-8 max-w-lg rounded-xl bg-gradient-to-r from-rose-100 to-pink-100 p-4 shadow-sm">
          <Skeleton className="mx-auto mb-3 h-5 w-32" />
          <Skeleton className="mx-auto h-12 w-full rounded-full" />
        </div>

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <WishlistCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
