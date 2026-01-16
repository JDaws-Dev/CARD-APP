import { ConditionGuideSkeleton } from '@/components/guide/ConditionGuide';

export default function ConditionGuideLoading() {
  return (
    <main className="min-h-screen bg-gray-50 pb-16 pt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ConditionGuideSkeleton />
      </div>
    </main>
  );
}
