'use client';

import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg">
            <SparklesIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Dashboard</h1>
            <p className="text-gray-500">Your collection at a glance</p>
          </div>
        </div>

        {/* Error state */}
        <div className="rounded-3xl bg-white p-12 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          </div>

          <h2 className="mb-2 text-xl font-bold text-gray-800">Something went wrong</h2>
          <p className="mb-6 text-gray-500">
            We couldn&apos;t load your dashboard. This might be a temporary issue.
          </p>

          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-kid-primary to-purple-500 px-6 py-3 font-semibold text-white shadow-md transition hover:shadow-lg"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Try Again
          </button>
        </div>
      </div>
    </main>
  );
}
