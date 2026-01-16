'use client';

import { useEffect } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default function ConditionGuideError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Condition guide error:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-500" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Oops! Something went wrong</h1>
        <p className="mb-6 text-gray-600">
          We couldn&apos;t load the condition guide. Don&apos;t worry - this happens sometimes!
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-kid-primary to-kid-secondary px-6 py-3 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
          >
            <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
            Try Again
          </button>
          <Link
            href="/learn"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
          >
            <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
            Back to Learn
          </Link>
        </div>
      </div>
    </main>
  );
}
