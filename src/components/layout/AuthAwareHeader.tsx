'use client';

import { useConvexAuth } from 'convex/react';
import { MarketingHeader } from './MarketingHeader';
import { AppHeader } from './AppHeader';

/**
 * Header skeleton shown while authentication state is loading.
 * Matches the modern, sleek structure of both headers to prevent layout shift.
 */
function HeaderSkeleton() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80"
      role="banner"
    >
      {/* Subtle gradient accent line at the top */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 opacity-60" />

      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8"
        aria-label="Loading navigation"
      >
        {/* Logo skeleton */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 sm:h-10 sm:w-10" />
          <div className="flex flex-col gap-1">
            <div className="h-5 w-20 animate-pulse rounded-lg bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 sm:h-6 sm:w-24" />
            <div className="hidden h-2.5 w-16 animate-pulse rounded bg-gray-200 dark:bg-slate-700 sm:block" />
          </div>
        </div>

        {/* Desktop nav skeleton - pill container */}
        <div className="hidden items-center gap-1 rounded-2xl bg-gray-100/80 p-1 dark:bg-slate-800/80 lg:flex">
          <div className="h-8 w-10 animate-pulse rounded-xl bg-gray-200/80 dark:bg-slate-700/80" />
          <div className="h-8 w-10 animate-pulse rounded-xl bg-gray-200/80 dark:bg-slate-700/80" />
          <div className="h-8 w-10 animate-pulse rounded-xl bg-gray-200/80 dark:bg-slate-700/80" />
          <div className="h-8 w-10 animate-pulse rounded-xl bg-gray-200/80 dark:bg-slate-700/80" />
          <div className="h-8 w-10 animate-pulse rounded-xl bg-gray-200/80 dark:bg-slate-700/80" />
        </div>

        {/* Right side skeleton */}
        <div className="hidden items-center gap-1.5 lg:flex">
          <div className="h-9 w-28 animate-pulse rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600" />
          <div className="mx-1 h-6 w-px bg-gray-200/60 dark:bg-slate-600/60" />
          <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
          <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
        </div>

        {/* Mobile menu button skeleton */}
        <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700 lg:hidden" />
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
