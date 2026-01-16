'use client';

import { ConditionGuide } from '@/components/guide/ConditionGuide';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default function ConditionGuidePage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-16 pt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/learn"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
          aria-label="Back to Learn to Collect"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back to Learn
        </Link>

        <ConditionGuide />
      </div>
    </main>
  );
}
