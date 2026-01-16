'use client';

import { useState, useRef, useEffect } from 'react';
import { EyeIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import {
  useLowStimulation,
  type StimulationPreset,
} from '@/components/providers/LowStimulationProvider';
import { PRESET_INFO } from '@/lib/lowStimulationMode';

// Preset options for the dropdown
const PRESET_OPTIONS: Array<{
  preset: StimulationPreset;
  label: string;
  description: string;
}> = [
  {
    preset: 'standard',
    label: PRESET_INFO.standard.label,
    description: PRESET_INFO.standard.shortDescription,
  },
  {
    preset: 'moderate',
    label: PRESET_INFO.moderate.label,
    description: PRESET_INFO.moderate.shortDescription,
  },
  {
    preset: 'minimal',
    label: PRESET_INFO.minimal.label,
    description: PRESET_INFO.minimal.shortDescription,
  },
];

interface LowStimulationToggleProps {
  /** Compact mode shows just the icon */
  compact?: boolean;
}

/**
 * Low-stimulation mode toggle component.
 * Allows users to switch between standard, moderate, and minimal stimulation levels.
 */
export function LowStimulationToggle({ compact = false }: LowStimulationToggleProps) {
  const { isEnabled, preset, applyPreset, isInitialized } = useLowStimulation();
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
    return <LowStimulationToggleSkeleton compact={compact} />;
  }

  // Determine current preset display
  const currentPreset = preset || (isEnabled ? 'minimal' : 'standard');
  const currentOption = PRESET_OPTIONS.find((opt) => opt.preset === currentPreset) || PRESET_OPTIONS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 ${
          isEnabled
            ? 'bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/50 dark:text-teal-300 dark:hover:bg-teal-900/70'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
        } ${compact ? 'h-9 w-9' : 'gap-1.5 px-3 py-2'}`}
        aria-label="Calm mode settings"
        aria-expanded={dropdownOpen}
        aria-haspopup="listbox"
        aria-controls="low-stim-menu"
        title={isEnabled ? `Calm mode: ${currentOption.label}` : 'Calm mode: Off'}
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
          id="low-stim-menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
          role="listbox"
          aria-label="Select stimulation level"
        >
          {/* Header */}
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-900/50">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Calm Mode
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
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    isSelected
                      ? 'border-teal-600 bg-teal-600 dark:border-teal-400 dark:bg-teal-400'
                      : 'border-gray-300 dark:border-slate-500'
                  }`}
                >
                  {isSelected && <CheckIcon className="h-3 w-3 text-white dark:text-slate-900" aria-hidden="true" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{option.label}</div>
                  <div
                    className={`text-xs ${
                      isSelected
                        ? 'text-teal-600/70 dark:text-teal-400/70'
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
              Reduces animations and visual complexity
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loader for low-stimulation toggle
 */
export function LowStimulationToggleSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700 ${
        compact ? 'h-9 w-9' : 'h-9 w-24'
      }`}
      aria-hidden="true"
    />
  );
}
