'use client';

import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
            Settings Error
          </h1>
          <p className="mb-6 max-w-md text-gray-600 dark:text-slate-400">
            Something went wrong loading your settings. Please try again.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-kid-primary to-kid-secondary px-6 py-3 font-medium text-white shadow-md transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
          >
            <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
            Try Again
          </button>
        </div>
      </div>
    </main>
  );
}
