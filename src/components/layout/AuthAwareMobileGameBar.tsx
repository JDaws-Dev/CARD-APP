'use client';

import { useConvexAuth } from 'convex/react';
import { MobileGameBar } from '@/components/header/MobileGameBar';

/**
 * Auth-aware mobile game bar component that shows the mobile game switcher
 * only for authenticated users on mobile devices.
 *
 * - Shows MobileGameBar when user is logged in (app experience)
 * - Shows nothing when user is not logged in (marketing pages don't need game switching)
 * - Shows nothing while authentication state is loading (prevents flash)
 */
export function AuthAwareMobileGameBar() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Don't show game bar while loading or for unauthenticated users
  if (isLoading || !isAuthenticated) {
    return null;
  }

  // Show MobileGameBar for authenticated users
  return <MobileGameBar />;
}
