'use client';

import Link from 'next/link';
import { LearnToCollect } from '@/components/tutorials/LearnToCollect';
import {
  BookOpenIcon,
  SparklesIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/solid';

export default function LearnPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Featured Guide Banner - Card Condition Guide */}
      <div className="mb-8 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-md">
              <MagnifyingGlassIcon className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">Card Condition Guide</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <SparklesIcon className="h-3 w-3" aria-hidden="true" />
                  New
                </span>
              </div>
              <p className="text-gray-600">
                Learn to tell the difference between NM, LP, MP, HP, and DMG conditions. Understand
                card grading to protect your collection and make fair trades!
              </p>
            </div>
          </div>
          <Link
            href="/condition-guide"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-3 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            <BookOpenIcon className="h-5 w-5" aria-hidden="true" />
            View Guide
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <LearnToCollect />
    </main>
  );
}
