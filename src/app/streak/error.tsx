'use client';

import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function StreakError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-yellow-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg">
              <CalendarDaysIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Activity Calendar</h1>
              <p className="text-gray-500">Track your daily collecting activity</p>
            </div>
          </div>
        </div>

        {/* Error state */}
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          </div>

          <h2 className="mb-2 text-xl font-bold text-gray-800">Something went wrong</h2>
          <p className="mb-6 text-gray-500">
            We couldn&apos;t load your activity calendar. This might be a temporary issue.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 px-6 py-3 font-semibold text-white transition hover:shadow-lg"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Try Again
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-200"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
