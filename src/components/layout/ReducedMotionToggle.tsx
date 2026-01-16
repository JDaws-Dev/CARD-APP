'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { CheckIcon, PauseIcon } from '@heroicons/react/24/solid';
import {
  useReducedMotion,
  type ReducedMotionMode,
} from '@/components/providers/ReducedMotionProvider';
import {
  MOTION_MODE_INFO,
  MOTION_MODE_OPTIONS,
  getEffectiveMotionDescription,
} from '@/lib/reducedMotion';

interface ReducedMotionToggleProps {
  /** Compact mode shows just the icon */
  compact?: boolean;
}

/**
 * Reduced motion toggle component.
 * Allows users to manually control motion reduction independent of system settings.
 */
export function ReducedMotionToggle({ compact = false }: ReducedMotionToggleProps) {
  const { mode, systemPrefersReduced, isReduced, isInitialized, setMode } = useReducedMotion();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [dropdownOpen]);

  // Don't render until initialized to avoid hydration mismatch
  if (!isInitialized) {
    return <ReducedMotionToggleSkeleton compact={compact} />;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 ${
          isReduced
            ? 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900/50 dark:text-cyan-300 dark:hover:bg-cyan-900/70'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
        } ${compact ? 'h-9 w-9' : 'gap-1.5 px-3 py-2'}`}
        aria-label="Motion settings"
        aria-expanded={dropdownOpen}
        aria-haspopup="listbox"
        aria-controls="reduced-motion-menu"
        title={getEffectiveMotionDescription(mode, systemPrefersReduced)}
      >
        <PauseIcon className="h-5 w-5" aria-hidden="true" />
        {!compact && (
          <>
            <span className="text-sm font-medium">{isReduced ? 'Reduced' : 'Motion'}</span>
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div
          id="reduced-motion-menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
          role="listbox"
          aria-label="Select motion preference"
        >
          {/* Header */}
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-900/50">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Reduced Motion
            </div>
          </div>

          {/* Options */}
          {MOTION_MODE_OPTIONS.map((option) => {
            const isSelected = mode === option;
            const optionInfo = MOTION_MODE_INFO[option];

            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setMode(option);
                  setDropdownOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kid-primary ${
                  isSelected
                    ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    isSelected
                      ? 'border-cyan-600 bg-cyan-600 dark:border-cyan-400 dark:bg-cyan-400'
                      : 'border-gray-300 dark:border-slate-500'
                  }`}
                >
                  {isSelected && (
                    <CheckIcon
                      className="h-3 w-3 text-white dark:text-slate-900"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{optionInfo.label}</div>
                  <div
                    className={`text-xs ${
                      isSelected
                        ? 'text-cyan-600/70 dark:text-cyan-400/70'
                        : 'text-gray-500 dark:text-slate-400'
                    }`}
                  >
                    {optionInfo.description}
                  </div>
                </div>
              </button>
            );
          })}

          {/* System preference indicator */}
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-900/50">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              System setting:{' '}
              <span className={systemPrefersReduced ? 'text-cyan-600 dark:text-cyan-400' : ''}>
                {systemPrefersReduced ? 'Reduce motion' : 'Normal motion'}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loader for reduced motion toggle
 */
export function ReducedMotionToggleSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700 ${
        compact ? 'h-9 w-9' : 'h-9 w-24'
      }`}
      aria-hidden="true"
    />
  );
}
