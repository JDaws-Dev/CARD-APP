'use client';

import Link from 'next/link';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function CollectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" aria-hidden="true" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-gray-900">Collection Error</h1>
          <p className="mb-6 max-w-md text-gray-600">
            Something went wrong loading your collection. Please try again.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-kid-primary to-kid-secondary px-6 py-3 font-medium text-white shadow-md transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
            >
              <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
            >
              <HomeIcon className="h-5 w-5" aria-hidden="true" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
