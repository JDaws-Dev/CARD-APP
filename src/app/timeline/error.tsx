'use client';

import { CalendarDaysIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function TimelineError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white p-12 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <CalendarDaysIcon className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-800">Something went wrong</h1>
          <p className="mb-6 text-gray-500">
            We couldn&apos;t load your collection timeline. Please try again.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-kid-primary to-purple-500 px-6 py-3 font-semibold text-white shadow-md transition hover:shadow-lg"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Try Again
            </button>
            <Link
              href="/collection"
              className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-200"
            >
              Back to Collection
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
