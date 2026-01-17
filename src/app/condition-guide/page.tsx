'use client';

import { ConditionGuide } from '@/components/guide/ConditionGuide';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default function ConditionGuidePage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-16 pt-24 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb navigation */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Learn', href: '/learn' },
            { label: 'Condition Guide' },
          ]}
          className="mb-6"
        />

        <ConditionGuide />
      </div>
    </main>
  );
}
