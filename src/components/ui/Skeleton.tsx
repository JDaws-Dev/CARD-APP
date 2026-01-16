'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component with animated shimmer effect
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
        className
      )}
    />
  );
}

/**
 * Card skeleton - mimics the layout of a Pokemon card in the grid
 */
export function CardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-2 shadow-sm">
      {/* Card image placeholder */}
      <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-lg">
        <Skeleton className="h-full w-full" />
      </div>
      {/* Card name placeholder */}
      <div className="mt-2 flex flex-col items-center gap-1">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Card grid skeleton - shows multiple card placeholders
 */
export function CardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="card-grid">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Stats bar skeleton - mimics the collection stats bar
 */
export function StatsBarSkeleton() {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Stat blocks */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="text-center">
              <Skeleton className="mx-auto mb-1 h-8 w-12" />
              <Skeleton className="mx-auto h-3 w-10" />
            </div>
            {i < 3 && <div className="h-8 w-px bg-gray-200" />}
          </div>
        ))}
      </div>
      {/* Progress badge */}
      <Skeleton className="h-8 w-32 rounded-full" />
    </div>
  );
}

/**
 * Set card skeleton - mimics a set card in the sets list
 */
export function SetCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white p-6 shadow-md">
      {/* Set logo placeholder */}
      <div className="mb-4 flex h-24 items-center justify-center">
        <Skeleton className="h-16 w-40" />
      </div>
      {/* Set info */}
      <div className="text-center">
        <Skeleton className="mx-auto mb-2 h-6 w-3/4" />
        <Skeleton className="mx-auto mb-4 h-4 w-1/2" />
        {/* Card count badge */}
        <Skeleton className="mx-auto h-6 w-20 rounded-full" />
        {/* Release date */}
        <Skeleton className="mx-auto mt-3 h-3 w-24" />
      </div>
    </div>
  );
}

/**
 * Sets grid skeleton - shows multiple set card placeholders
 */
export function SetsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SetCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Collection group skeleton - mimics a set group in collection view
 */
export function CollectionGroupSkeleton() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      {/* Set header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      {/* Cards grid */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-gray-50 p-1.5">
            <div className="relative aspect-[2.5/3.5] overflow-hidden rounded">
              <Skeleton className="h-full w-full" />
            </div>
            <Skeleton className="mx-auto mt-1 h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Search results skeleton - mimics the search results layout
 */
export function SearchResultsSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-24" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Filter panel skeleton - mimics the browse page filter panel
 */
export function FilterPanelSkeleton() {
  return (
    <div className="space-y-6 rounded-xl bg-white p-4 shadow-sm">
      {/* Set filter */}
      <div>
        <Skeleton className="mb-2 h-4 w-16" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
      {/* Type filter */}
      <div>
        <Skeleton className="mb-2 h-4 w-20" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>
      </div>
      {/* Name filter */}
      <div>
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
