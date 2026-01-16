'use client';

import { useState, useRef, useEffect } from 'react';
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useDarkMode, type ThemeMode } from '@/components/providers/DarkModeProvider';

// Theme mode options with icons and labels
const THEME_OPTIONS: Array<{
  mode: ThemeMode;
  label: string;
  shortLabel: string;
  description: string;
  Icon: typeof SunIcon;
}> = [
  {
    mode: 'light',
    label: 'Light',
    shortLabel: 'Light',
    description: 'Always use light theme',
    Icon: SunIcon,
  },
  {
    mode: 'dark',
    label: 'Dark',
    shortLabel: 'Dark',
    description: 'Always use dark theme',
    Icon: MoonIcon,
  },
  {
    mode: 'system',
    label: 'System',
    shortLabel: 'Auto',
    description: 'Match your device settings',
    Icon: ComputerDesktopIcon,
  },
];

/**
 * Get the icon for the current theme mode
 */
function getThemeIcon(themeMode: ThemeMode, isDark: boolean) {
  if (themeMode === 'system') {
    return ComputerDesktopIcon;
  }
  return isDark ? MoonIcon : SunIcon;
}

interface DarkModeToggleProps {
  /** Compact mode shows just the icon */
  compact?: boolean;
  /** Show dropdown menu for mode selection */
  showModeSelector?: boolean;
}

/**
 * Dark mode toggle component.
 * Shows the current theme mode with an icon.
 * Optionally displays a dropdown to select light/dark/system mode.
 */
export function DarkModeToggle({ compact = false, showModeSelector = true }: DarkModeToggleProps) {
  const { themeMode, isDark, setThemeMode, toggleDarkMode, isInitialized } = useDarkMode();
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
    return <DarkModeToggleSkeleton compact={compact} />;
  }

  const CurrentIcon = getThemeIcon(themeMode, isDark);
  const currentOption = THEME_OPTIONS.find((opt) => opt.mode === themeMode) || THEME_OPTIONS[2];

  // Simple toggle button (no dropdown)
  if (!showModeSelector) {
    return (
      <button
        type="button"
        onClick={toggleDarkMode}
        className={`flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 ${
          isDark
            ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } ${compact ? 'h-9 w-9' : 'gap-2 px-3 py-2'}`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Currently ${isDark ? 'dark' : 'light'} mode. Click to switch.`}
      >
        <CurrentIcon className="h-5 w-5" aria-hidden="true" />
        {!compact && <span className="text-sm font-medium">{isDark ? 'Dark' : 'Light'}</span>}
      </button>
    );
  }

  // Dropdown mode selector
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 ${
          isDark
            ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } ${compact ? 'h-9 w-9' : 'gap-1.5 px-3 py-2'}`}
        aria-label="Theme settings"
        aria-expanded={dropdownOpen}
        aria-haspopup="listbox"
        aria-controls="theme-menu"
      >
        <CurrentIcon className="h-5 w-5" aria-hidden="true" />
        {!compact && (
          <>
            <span className="text-sm font-medium">{currentOption.shortLabel}</span>
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
          id="theme-menu"
          className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
          role="listbox"
          aria-label="Select theme"
        >
          {THEME_OPTIONS.map((option) => {
            const isSelected = themeMode === option.mode;
            const Icon = option.Icon;

            return (
              <button
                key={option.mode}
                type="button"
                onClick={() => {
                  setThemeMode(option.mode);
                  setDropdownOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kid-primary ${
                  isSelected
                    ? 'bg-kid-primary/10 text-kid-primary dark:bg-kid-primary/20'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <Icon
                  className={`h-5 w-5 ${isSelected ? 'text-kid-primary' : ''}`}
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{option.label}</div>
                  <div
                    className={`text-xs ${isSelected ? 'text-kid-primary/70' : 'text-gray-500 dark:text-slate-400'}`}
                  >
                    {option.description}
                  </div>
                </div>
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-kid-primary" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loader for dark mode toggle
 */
export function DarkModeToggleSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700 ${
        compact ? 'h-9 w-9' : 'h-9 w-20'
      }`}
      aria-hidden="true"
    />
  );
}
