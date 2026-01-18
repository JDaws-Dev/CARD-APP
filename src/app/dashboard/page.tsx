'use client';

import { useConvexAuth } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { KidDashboard } from '@/components/dashboard/KidDashboard';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import { KidDashboardSkeleton } from '@/components/dashboard/KidDashboard';
import { ChatButton } from '@/components/ai/ChatButton';

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const { primaryGame } = useGameSelector();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading while checking auth or if redirecting
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-kid-primary border-t-transparent" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Loading profile data
  if (profileLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <KidDashboardSkeleton />
        </div>
      </main>
    );
  }

  // No profile yet - redirect to onboarding
  if (!profileId) {
    router.push('/onboarding');
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Dashboard */}
        <KidDashboard gameSlug={primaryGame.id} gameName={primaryGame.shortName} />
      </div>

      {/* Floating Chat Button */}
      <ChatButton gameSlug={primaryGame.id} />
    </main>
  );
}
