'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  ArrowLeftIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { DarkModeToggle } from '@/components/layout/DarkModeToggle';
import { KidModeToggle } from '@/components/layout/KidModeToggle';
import { LowStimulationToggle } from '@/components/layout/LowStimulationToggle';
import { DyslexicFontToggle } from '@/components/layout/DyslexicFontToggle';
import { HighContrastToggle } from '@/components/layout/HighContrastToggle';
import { ReducedMotionToggle } from '@/components/layout/ReducedMotionToggle';
import { FocusModeToggle } from '@/components/layout/FocusModeToggle';
import { GameSettingsToggle } from '@/components/settings/GameSettingsToggle';
import { SleepModeSettings } from '@/components/settings/SleepModeSettings';
import { PinProtectionWrapper } from '@/components/settings/PinProtectionWrapper';

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();

  // Get current user profile to access familyId
  const currentUserProfile = useQuery(api.profiles.getCurrentUserProfile, {});
  const familyId = currentUserProfile?.family?.id;

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading while checking auth or if redirecting
  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-400 border-t-transparent" />
          <p className="text-gray-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-kid-primary dark:text-slate-400 dark:hover:text-kid-primary"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-700">
              <Cog6ToothIcon className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                Settings
              </h1>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Customize your CardDex experience
              </p>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* MY SETTINGS - Kid-accessible preferences */}
        {/* ================================================================== */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-kid-primary to-kid-secondary">
              <Cog6ToothIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                My Settings
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Personalize your CardDex experience
              </p>
            </div>
          </div>

          {/* Display Settings */}
          <section
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            aria-labelledby="display-settings-heading"
          >
            <h3
              id="display-settings-heading"
              className="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
            >
              Display
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-slate-400">
              Adjust how the app looks and feels.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-700/50">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Switch between light, dark, or system theme
                  </p>
                </div>
                <DarkModeToggle />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-700/50">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Kid Mode</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Adjust interface complexity by age group
                  </p>
                </div>
                <KidModeToggle />
              </div>
            </div>
          </section>

          {/* Accessibility Settings */}
          <section
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            aria-labelledby="accessibility-settings-heading"
          >
            <h3
              id="accessibility-settings-heading"
              className="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
            >
              Accessibility
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-slate-400">
              Options to make the app more comfortable for everyone.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-700/50">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Low-Stimulation Mode</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Reduce animations and visual distractions
                  </p>
                </div>
                <LowStimulationToggle />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-700/50">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Dyslexic-Friendly Font
                  </p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Use OpenDyslexic font for easier reading
                  </p>
                </div>
                <DyslexicFontToggle />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-700/50">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">High Contrast</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Increase contrast for better visibility
                  </p>
                </div>
                <HighContrastToggle />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-700/50">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Reduced Motion</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Minimize animations and movement
                  </p>
                </div>
                <ReducedMotionToggle />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-700/50">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Focus Mode</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Hide gamification elements like streaks and levels
                  </p>
                </div>
                <FocusModeToggle />
              </div>
            </div>
          </section>

          {/* Notifications Settings (placeholder for future) */}
          <section
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            aria-labelledby="notifications-settings-heading"
          >
            <h3
              id="notifications-settings-heading"
              className="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
            >
              Notifications
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Notification preferences coming soon.
            </p>
          </section>
        </div>

        {/* ================================================================== */}
        {/* FAMILY CONTROLS - Parent-only settings (PIN protected) */}
        {/* ================================================================== */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
              <ShieldCheckIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Family Controls
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Parent-managed settings for healthy app usage
              </p>
            </div>
          </div>

          <PinProtectionWrapper familyId={familyId}>
            {/* Games Settings - Parent controlled */}
            <section
              className="rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-sm dark:border-amber-700/50 dark:bg-slate-800"
              aria-labelledby="games-settings-heading"
            >
              <h3
                id="games-settings-heading"
                className="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
              >
                Games You Collect
              </h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-slate-400">
                Choose which trading card games to show in your collection.
              </p>
              <GameSettingsToggle />
            </section>

            {/* Sleep Mode Settings - Parent controlled */}
            <section
              className="mt-6 rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-sm dark:border-amber-700/50 dark:bg-slate-800"
              aria-labelledby="family-settings-heading"
            >
              <h3
                id="family-settings-heading"
                className="mb-4 text-lg font-semibold text-gray-900 dark:text-white"
              >
                Sleep Mode
              </h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-slate-400">
                Set quiet hours to encourage healthy screen time habits.
              </p>
              <SleepModeSettings />
            </section>
          </PinProtectionWrapper>
        </div>
      </div>
    </main>
  );
}
