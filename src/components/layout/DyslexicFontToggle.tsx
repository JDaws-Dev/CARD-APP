'use client';

import { LanguageIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useDyslexicFont } from '@/components/providers/DyslexicFontProvider';
import { DYSLEXIC_FONT_INFO, getDyslexicFontTooltip } from '@/lib/dyslexicFont';

interface DyslexicFontToggleProps {
  /** Compact mode shows just the icon button */
  compact?: boolean;
}

/**
 * Dyslexic font toggle component.
 * Allows users to switch between standard font and OpenDyslexic for improved readability.
 */
export function DyslexicFontToggle({ compact = false }: DyslexicFontToggleProps) {
  const { isEnabled, toggle, isInitialized } = useDyslexicFont();

  // Don't render until initialized to avoid hydration mismatch
  if (!isInitialized) {
    return <DyslexicFontToggleSkeleton compact={compact} />;
  }

  const tooltip = getDyslexicFontTooltip(isEnabled);

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 ${
          isEnabled
            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900/70'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
        }`}
        aria-label={tooltip}
        aria-pressed={isEnabled}
        title={tooltip}
      >
        <LanguageIcon className="h-5 w-5" aria-hidden="true" />
        {isEnabled && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-purple-500 dark:bg-purple-400">
            <CheckIcon className="h-2 w-2 text-white dark:text-slate-900" aria-hidden="true" />
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 ${
        isEnabled
          ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900/70'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
      }`}
      aria-label={tooltip}
      aria-pressed={isEnabled}
      title={tooltip}
    >
      <LanguageIcon className="h-5 w-5" aria-hidden="true" />
      <span className="text-sm font-medium">
        {isEnabled ? DYSLEXIC_FONT_INFO.name : 'Standard Font'}
      </span>
      {isEnabled && (
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 dark:bg-purple-400">
          <CheckIcon className="h-2.5 w-2.5 text-white dark:text-slate-900" aria-hidden="true" />
        </span>
      )}
    </button>
  );
}

/**
 * Skeleton loader for dyslexic font toggle
 */
export function DyslexicFontToggleSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700 ${
        compact ? 'h-9 w-9' : 'h-9 w-32'
      }`}
      aria-hidden="true"
    />
  );
}
