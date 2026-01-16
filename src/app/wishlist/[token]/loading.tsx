import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Skeleton loader for wishlist cards
 */
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
    </div>
  );
}

/**
 * Loading state for the public wishlist page
 */
export default function WishlistLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-pink-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header skeleton */}
        <div className="mb-8 text-center">
          <Skeleton className="mx-auto mb-4 h-16 w-16 rounded-full" />
          <Skeleton className="mx-auto mb-2 h-8 w-64" />
          <Skeleton className="mx-auto h-4 w-48" />
        </div>

        {/* Stats skeleton */}
        <div className="mx-auto mb-8 flex max-w-md justify-center gap-8 rounded-xl bg-white p-4 shadow-sm">
          {[1, 2].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="mx-auto mb-2 h-10 w-12" />
              <Skeleton className="mx-auto h-4 w-16" />
            </div>
          ))}
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
