'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Link from 'next/link';
import { ShieldCheckIcon, ArrowLeftIcon, Cog6ToothIcon, PlusIcon } from '@heroicons/react/24/solid';
import { ParentDashboard, ParentDashboardSkeleton } from '@/components/dashboard/ParentDashboard';
import { AddProfileModal } from '@/components/dashboard/AddProfileModal';

export default function ParentDashboardPage() {
  const [isAddProfileModalOpen, setIsAddProfileModalOpen] = useState(false);
  // Use authenticated parent access check
  const parentAccess = useQuery(api.profiles.hasParentAccess);

  // Loading state - still fetching access info
  if (parentAccess === undefined) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="mb-4 h-4 w-24 rounded bg-gray-200" />
            <div className="mb-2 h-8 w-64 rounded bg-gray-200" />
            <div className="h-4 w-48 rounded bg-gray-200" />
          </div>

          <ParentDashboardSkeleton />
        </div>
      </main>
    );
  }

  // Access denied - show appropriate message
  if (!parentAccess.hasAccess) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <ShieldCheckIcon className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-800">Access Denied</h1>
            <p className="text-gray-600">{parentAccess.message}</p>
          </div>

          {parentAccess.reason === 'NOT_AUTHENTICATED' && (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-kid-primary to-purple-500 px-6 py-3 text-sm font-medium text-white shadow-md transition hover:shadow-lg"
            >
              Sign In
            </Link>
          )}

          {parentAccess.reason === 'NO_FAMILY' && (
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-kid-primary to-purple-500 px-6 py-3 text-sm font-medium text-white shadow-md transition hover:shadow-lg"
            >
              Create Family Account
            </Link>
          )}

          <div className="mt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Extract family ID from the access check result
  const familyId = parentAccess.family!.id;

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Parent Dashboard</h1>
                <p className="text-gray-500">Manage your family&apos;s trading card collections</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <Cog6ToothIcon className="h-5 w-5" />
                Settings
              </Link>
              <button
                onClick={() => setIsAddProfileModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-kid-primary to-purple-500 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:shadow-lg"
              >
                <PlusIcon className="h-5 w-5" />
                Add Profile
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <ParentDashboard familyId={familyId} />

        {/* Add Profile Modal */}
        <AddProfileModal
          familyId={familyId}
          isOpen={isAddProfileModalOpen}
          onClose={() => setIsAddProfileModalOpen(false)}
        />
      </div>
    </main>
  );
}
