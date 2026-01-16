'use client';

import Link from 'next/link';
import { DuplicateFinder } from '@/components/collection/DuplicateFinder';
import { ArrowsRightLeftIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ComparePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/collection"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Collection
          </Link>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-kid-primary/10 p-2">
              <ArrowsRightLeftIcon className="h-6 w-6 text-kid-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Compare Collections</h1>
              <p className="text-gray-500">
                Find duplicates and trade opportunities between family members
              </p>
            </div>
          </div>
        </div>

        {/* Duplicate Finder Component */}
        <DuplicateFinder />
      </div>
    </main>
  );
}
