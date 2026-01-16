'use client';

import Link from 'next/link';
import { ExclamationTriangleIcon, ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';

export default function ParentDashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-800">Something went wrong</h1>
        <p className="mb-6 text-gray-500">
          We couldn&apos;t load the parent dashboard. This might be a temporary issue.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-kid-primary to-purple-500 px-6 py-3 font-medium text-white shadow-md transition hover:shadow-lg"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-200"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
