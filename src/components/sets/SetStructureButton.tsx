'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SetStructureIntroModal } from '@/components/onboarding/SetStructureIntro';
import { hasCompletedSetIntro } from '@/lib/setStructureContent';
import { BookOpenIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface SetStructureButtonProps {
  className?: string;
}

/**
 * Button that opens the Set Structure Intro onboarding modal.
 * Shows a "New" badge if the user hasn't completed the intro yet.
 */
export function SetStructureButton({ className }: SetStructureButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(true);

  // Check completion status on mount
  useEffect(() => {
    setHasCompleted(hasCompletedSetIntro());
  }, []);

  const handleComplete = () => {
    setHasCompleted(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={cn(
          'group relative inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2 font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
          hasCompleted
            ? 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
            : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100',
          className
        )}
        aria-label="Learn how Pokemon sets work"
      >
        <BookOpenIcon className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">How Sets Work</span>
        <span className="sm:hidden">Sets Guide</span>

        {/* "New" badge for users who haven't completed */}
        {!hasCompleted && (
          <span className="absolute -right-1 -top-1 flex items-center gap-0.5 rounded-full bg-gradient-to-r from-kid-primary to-kid-secondary px-2 py-0.5 text-xs font-bold text-white shadow-md">
            <SparklesIcon className="h-3 w-3" aria-hidden="true" />
            New
          </span>
        )}
      </button>

      <SetStructureIntroModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={handleComplete}
      />
    </>
  );
}
