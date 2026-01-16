'use client';

import { useEffect } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default function LearnError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Learn page error:', error);
  }, [error]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        {/* Error icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <ExclamationTriangleIcon className="h-10 w-10 text-red-500" aria-hidden="true" />
        </div>

        {/* Error message */}
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mb-6 max-w-md text-gray-600">
          We had trouble loading the tutorials. Please try again, or go back to the home page.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-kid-primary px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-kid-primary/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
          >
            <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
          >
            <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
