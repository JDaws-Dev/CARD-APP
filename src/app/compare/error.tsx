'use client';

import { ErrorFallback } from '@/components/ui/ErrorBoundary';

export default function CompareError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <ErrorFallback
          title="Couldn't load comparison"
          message={
            error.message ||
            'We had trouble loading the collection comparison. This might be a temporary issue.'
          }
          onReset={reset}
        />
      </div>
    </main>
  );
}
