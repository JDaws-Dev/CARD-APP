'use client';

import { useConvexAuth } from 'convex/react';
import { AppFooter } from './AppFooter';

/**
 * Auth-aware footer component that shows the footer only for authenticated users.
 * - Shows AppFooter when user is logged in (app experience)
 * - Shows nothing when user is not logged in (marketing pages have their own footers)
 * - Shows nothing while authentication state is loading
 */
export function AuthAwareFooter() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Don't show footer while loading or for unauthenticated users
  if (isLoading || !isAuthenticated) {
    return null;
  }

  // Show AppFooter for authenticated users
  return <AppFooter />;
}
