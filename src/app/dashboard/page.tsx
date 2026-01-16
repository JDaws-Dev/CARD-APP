'use client';

import { KidDashboard } from '@/components/dashboard/KidDashboard';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import Link from 'next/link';
import { ArrowLeftIcon, HomeIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { KidDashboardSkeleton } from '@/components/dashboard/KidDashboard';

export default function DashboardPage() {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  // Loading state
  if (profileLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <KidDashboardSkeleton />
        </div>
      </main>
    );
  }

  // No profile selected - prompt to login
  if (!profileId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-white p-12 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500">
              <SparklesIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-800">Welcome to CardDex!</h1>
            <p className="mb-6 text-gray-500">
              Sign in to access your dashboard and start tracking your collection.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-kid-primary to-purple-500 px-6 py-3 font-semibold text-white shadow-md transition hover:shadow-lg"
              >
                Sign In
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                <HomeIcon className="h-5 w-5" />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Dashboard */}
        <KidDashboard />
      </div>
    </main>
  );
}
