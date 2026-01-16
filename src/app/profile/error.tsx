'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ExclamationTriangleIcon, ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Profile page error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-12 pt-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-red-50 p-8 text-center sm:p-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" aria-hidden="true" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="mb-6 text-gray-600">
            We had trouble loading your profile. Please try again.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full bg-kid-primary px-6 py-3 font-semibold text-white shadow-md transition hover:bg-kid-primary/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
            >
              <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
              Try Again
            </button>
            <Link
              href="/collection"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
            >
              <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
              Back to Collection
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
