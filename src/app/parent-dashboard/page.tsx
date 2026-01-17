'use client';

import { useQuery, useMutation } from 'convex/react';
import { useEffect, useState } from 'react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import Link from 'next/link';
import { ShieldCheckIcon, ArrowLeftIcon, Cog6ToothIcon, PlusIcon } from '@heroicons/react/24/solid';
import { ParentDashboard, ParentDashboardSkeleton } from '@/components/dashboard/ParentDashboard';

const FAMILY_ID_KEY = 'kidcollect_family_id';

export default function ParentDashboardPage() {
  const [familyId, setFamilyId] = useState<Id<'families'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const getOrCreateDemoProfile = useMutation(api.profiles.getOrCreateDemoProfile);

  // Initialize family ID from stored profile
  useEffect(() => {
    async function initFamily() {
      try {
        // For demo purposes, we'll use the demo profile's family
        const profile = await getOrCreateDemoProfile();
        if (profile) {
          setFamilyId(profile.familyId);
        }
      } catch (error) {
        console.error('Failed to initialize family:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initFamily();
  }, [getOrCreateDemoProfile]);

  // Loading state
  if (isLoading || !familyId) {
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
              <button className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
                <Cog6ToothIcon className="h-5 w-5" />
                Settings
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-kid-primary to-purple-500 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:shadow-lg">
                <PlusIcon className="h-5 w-5" />
                Add Profile
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <ParentDashboard familyId={familyId} />
      </div>
    </main>
  );
}
