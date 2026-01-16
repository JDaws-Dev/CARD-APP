'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error page for route segment errors in the app directory.
 * Provides user-friendly messaging and recovery options.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-purple-50 p-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
          <ExclamationTriangleIcon className="h-10 w-10 text-amber-600" />
        </div>

        <h1 className="mb-3 text-2xl font-bold text-gray-800">Oops! Something went wrong</h1>

        <p className="mb-6 text-gray-500">
          We ran into a problem loading this page. Don&apos;t worry, your collection is safe!
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-kid-primary px-6 py-3 font-semibold text-white transition hover:bg-kid-primary/90"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <HomeIcon className="h-5 w-5" />
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
