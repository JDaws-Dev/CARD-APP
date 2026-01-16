import Link from 'next/link';
import { MagnifyingGlassIcon, HomeIcon } from '@heroicons/react/24/outline';

/**
 * Custom 404 page for the application.
 * Provides friendly messaging and navigation options.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-purple-50 p-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
          <MagnifyingGlassIcon className="h-10 w-10 text-kid-primary" />
        </div>

        <h1 className="mb-3 text-2xl font-bold text-gray-800">Page not found</h1>

        <p className="mb-6 text-gray-500">
          We couldn&apos;t find the page you&apos;re looking for. It might have been moved or
          doesn&apos;t exist.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-kid-primary px-6 py-3 font-semibold text-white transition hover:bg-kid-primary/90"
          >
            <HomeIcon className="h-5 w-5" />
            Go Home
          </Link>

          <Link
            href="/sets"
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Browse Sets
          </Link>
        </div>
      </div>
    </main>
  );
}
