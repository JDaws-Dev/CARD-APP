'use client';

import { useConvexAuth } from 'convex/react';
import { MobileBottomNav } from '@/components/header/MobileBottomNav';

/**
 * Auth-aware mobile bottom navigation component that shows the main app navigation
 * only for authenticated users on mobile devices.
 *
 * - Shows MobileBottomNav when user is logged in (app experience with Collection, Sets, Badges, etc.)
 * - Shows nothing when user is not logged in (marketing pages don't need app navigation)
 * - Shows nothing while authentication state is loading (prevents flash)
 */
export function AuthAwareMobileGameBar() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  // Don't show bottom nav while loading or for unauthenticated users
  if (isLoading || !isAuthenticated) {
    return null;
  }

  // Show MobileBottomNav for authenticated users
  return <MobileBottomNav />;
}
