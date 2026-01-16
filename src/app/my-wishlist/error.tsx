'use client';

import { ExclamationTriangleIcon, ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function MyWishlistError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-rose-50 to-pink-50 p-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
          <ExclamationTriangleIcon className="h-8 w-8 text-rose-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800">Something went wrong</h1>
        <p className="mb-6 text-gray-500">
          We couldn&apos;t load your wishlist. This might be a temporary issue.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-kid-primary px-6 py-3 font-semibold text-white transition hover:bg-kid-primary/90"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Try Again
          </button>
          <Link
            href="/collection"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 px-6 py-3 font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Collection
          </Link>
        </div>
      </div>
    </main>
  );
}
