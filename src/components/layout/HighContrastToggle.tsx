'use client';

import { useState, useRef, useEffect } from 'react';
import { EyeIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import {
  useHighContrast,
  type HighContrastLevel,
} from '@/components/providers/HighContrastProvider';
import { CONTRAST_LEVEL_INFO, CONTRAST_LEVEL_OPTIONS } from '@/lib/highContrastMode';

// Level options for the dropdown
const LEVEL_OPTIONS: Array<{
  level: HighContrastLevel;
  label: string;
  description: string;
}> = CONTRAST_LEVEL_OPTIONS.map((level) => ({
  level,
  label: CONTRAST_LEVEL_INFO[level].label,
  description: CONTRAST_LEVEL_INFO[level].shortDescription,
}));

interface HighContrastToggleProps {
  /** Compact mode shows just the icon button */
  compact?: boolean;
}

/**
 * High-contrast mode toggle component.
 * Allows users to switch between standard, medium, and high contrast levels.
 */
export function HighContrastToggle({ compact = false }: HighContrastToggleProps) {
  const { level, isEnabled, setLevel, isInitialized } = useHighContrast();
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
    return <HighContrastToggleSkeleton compact={compact} />;
  }

  // Find current level option
  const currentOption = LEVEL_OPTIONS.find((opt) => opt.level === level) || LEVEL_OPTIONS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 ${
          isEnabled
            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900/70'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
        } ${compact ? 'h-9 w-9' : 'gap-1.5 px-3 py-2'}`}
        aria-label="High contrast mode settings"
        aria-expanded={dropdownOpen}
        aria-haspopup="listbox"
        aria-controls="high-contrast-menu"
        title={isEnabled ? `High contrast: ${currentOption.label}` : 'High contrast mode: Off'}
      >
        <EyeIcon className="h-5 w-5" aria-hidden="true" />
        {!compact && (
          <>
            <span className="text-sm font-medium">
              {isEnabled ? currentOption.label : 'Standard'}
            </span>
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
          id="high-contrast-menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
          role="listbox"
          aria-label="Select contrast level"
        >
          {/* Header */}
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-900/50">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Contrast Level
            </div>
          </div>

          {/* Options */}
          {LEVEL_OPTIONS.map((option) => {
            const isSelected = level === option.level;

            return (
              <button
                key={option.level}
                type="button"
                onClick={() => {
                  setLevel(option.level);
                  setDropdownOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kid-primary ${
                  isSelected
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    isSelected
                      ? 'border-amber-600 bg-amber-600 dark:border-amber-400 dark:bg-amber-400'
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
                  <div className="text-sm font-medium">{option.label}</div>
                  <div
                    className={`text-xs ${
                      isSelected
                        ? 'text-amber-600/70 dark:text-amber-400/70'
                        : 'text-gray-500 dark:text-slate-400'
                    }`}
                  >
                    {option.description}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Info footer */}
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-900/50">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Increases contrast for better visibility
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loader for high-contrast toggle
 */
export function HighContrastToggleSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700 ${
        compact ? 'h-9 w-9' : 'h-9 w-28'
      }`}
      aria-hidden="true"
    />
  );
}
