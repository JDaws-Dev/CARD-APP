'use client';

import { useConvexAuth } from 'convex/react';
import { MarketingHeader } from './MarketingHeader';
import { AppHeader } from './AppHeader';

/**
 * Header skeleton shown while authentication state is loading.
 * Matches the basic structure of both headers to prevent layout shift.
 */
function HeaderSkeleton() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm"
      role="banner"
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
        aria-label="Loading navigation"
      >
        {/* Logo skeleton */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200 sm:h-10 sm:w-10" />
          <div className="h-5 w-20 animate-pulse rounded bg-gray-200 sm:h-6 sm:w-24" />
        </div>

        {/* Desktop nav skeleton */}
        <div className="hidden items-center gap-4 md:flex">
          <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-14 animate-pulse rounded bg-gray-200" />
        </div>

        {/* Auth buttons skeleton */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-200" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
        </div>

        {/* Mobile menu button skeleton */}
        <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200 md:hidden" />
      </nav>
    </header>
  );
}

/**
 * Auth-aware header component that shows the appropriate header based on authentication state.
 * - Shows MarketingHeader when user is not logged in (landing page experience)
 * - Shows AppHeader when user is logged in (app experience with navigation)
 * - Shows HeaderSkeleton while authentication state is loading
 */
export function AuthAwareHeader() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Show skeleton while loading to prevent layout shift
  if (isLoading) {
    return <HeaderSkeleton />;
  }

  // Show AppHeader for authenticated users
  if (isAuthenticated) {
    return <AppHeader />;
  }

  // Show MarketingHeader for unauthenticated visitors
  return <MarketingHeader />;
}
