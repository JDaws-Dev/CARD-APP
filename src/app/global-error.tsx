'use client';

import { useEffect } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error page for root layout errors.
 * Must include its own html/body tags since it replaces the entire page.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-purple-50 p-8">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
            </div>

            <h1 className="mb-3 text-2xl font-bold text-gray-800">Something went wrong</h1>

            <p className="mb-6 text-gray-500">
              We encountered an unexpected error. Please try refreshing the page.
            </p>

            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Try Again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
