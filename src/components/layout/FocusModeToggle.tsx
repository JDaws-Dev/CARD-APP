'use client';

import { useState, useRef, useEffect } from 'react';
import { EyeSlashIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useFocusMode, type FocusModePreset } from '@/components/providers/FocusModeProvider';
import { FOCUS_MODE_PRESET_INFO } from '@/lib/focusMode';

// Preset options for the dropdown
const PRESET_OPTIONS: Array<{
  preset: FocusModePreset;
  label: string;
  description: string;
}> = [
  {
    preset: 'off',
    label: FOCUS_MODE_PRESET_INFO.off.label,
    description: FOCUS_MODE_PRESET_INFO.off.shortDescription,
  },
  {
    preset: 'minimal',
    label: FOCUS_MODE_PRESET_INFO.minimal.label,
    description: FOCUS_MODE_PRESET_INFO.minimal.shortDescription,
  },
  {
    preset: 'full',
    label: FOCUS_MODE_PRESET_INFO.full.label,
    description: FOCUS_MODE_PRESET_INFO.full.shortDescription,
  },
];

interface FocusModeToggleProps {
  /** Compact mode shows just the icon */
  compact?: boolean;
}

/**
 * Focus mode toggle component.
 * Allows users to switch between off, minimal, and full focus modes.
 * Hides gamification elements when enabled.
 */
export function FocusModeToggle({ compact = false }: FocusModeToggleProps) {
  const { isEnabled, preset, applyPreset, isInitialized } = useFocusMode();
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
    return <FocusModeToggleSkeleton compact={compact} />;
  }

  // Determine current preset display
  const currentPreset = preset || (isEnabled ? 'full' : 'off');
  const currentOption =
    PRESET_OPTIONS.find((opt) => opt.preset === currentPreset) || PRESET_OPTIONS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 ${
          isEnabled
            ? 'bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/50 dark:text-violet-300 dark:hover:bg-violet-900/70'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
        } ${compact ? 'h-9 w-9' : 'gap-1.5 px-3 py-2'}`}
        aria-label="Focus mode settings"
        aria-expanded={dropdownOpen}
        aria-haspopup="listbox"
        aria-controls="focus-mode-menu"
        title={isEnabled ? `Focus mode: ${currentOption.label}` : 'Focus mode: Off'}
      >
        <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
        {!compact && (
          <>
            <span className="text-sm font-medium">{isEnabled ? currentOption.label : 'Focus'}</span>
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
          id="focus-mode-menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
          role="listbox"
          aria-label="Select focus mode level"
        >
          {/* Header */}
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-900/50">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Focus Mode
            </div>
          </div>

          {/* Options */}
          {PRESET_OPTIONS.map((option) => {
            const isSelected = currentPreset === option.preset;

            return (
              <button
                key={option.preset}
                type="button"
                onClick={() => {
                  applyPreset(option.preset);
                  setDropdownOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kid-primary ${
                  isSelected
                    ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    isSelected
                      ? 'border-violet-600 bg-violet-600 dark:border-violet-400 dark:bg-violet-400'
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
                        ? 'text-violet-600/70 dark:text-violet-400/70'
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
              Hide gamification elements like streaks and levels
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loader for focus mode toggle
 */
export function FocusModeToggleSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700 ${
        compact ? 'h-9 w-9' : 'h-9 w-24'
      }`}
      aria-hidden="true"
    />
  );
}
