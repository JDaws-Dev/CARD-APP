'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useKidMode, AGE_GROUP_INFO, type AgeGroup } from '@/components/providers/KidModeProvider';
import {
  SparklesIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  ChevronDownIcon,
  CheckIcon,
} from '@heroicons/react/24/solid';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

// Icon for each age group
const AGE_GROUP_ICONS: Record<AgeGroup, React.ComponentType<{ className?: string }>> = {
  young: SparklesIcon,
  older: RocketLaunchIcon,
  full: AcademicCapIcon,
};

// Colors for each age group
const AGE_GROUP_COLORS: Record<
  AgeGroup,
  { bg: string; text: string; gradient: string; ring: string }
> = {
  young: {
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    gradient: 'from-pink-400 to-rose-500',
    ring: 'ring-pink-400',
  },
  older: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    gradient: 'from-indigo-400 to-purple-500',
    ring: 'ring-indigo-400',
  },
  full: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    gradient: 'from-emerald-400 to-teal-500',
    ring: 'ring-emerald-400',
  },
};

interface KidModeToggleProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function KidModeToggle({ variant = 'compact', className }: KidModeToggleProps) {
  const { isKidMode, ageGroup, setAgeGroup, disableKidMode } = useKidMode();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const currentGroup = isKidMode ? ageGroup : 'full';
  const colors = AGE_GROUP_COLORS[currentGroup];
  const Icon = AGE_GROUP_ICONS[currentGroup];
  const info = AGE_GROUP_INFO[currentGroup];

  const handleSelectGroup = (group: AgeGroup) => {
    if (group === 'full') {
      disableKidMode();
    } else {
      setAgeGroup(group);
    }
    setIsOpen(false);
  };

  if (variant === 'full') {
    return (
      <div className={cn('relative', className)} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex w-full items-center justify-between gap-3 rounded-xl border-2 p-4 transition-all',
            isKidMode ? colors.bg : 'bg-gray-50',
            isKidMode ? `border-${colors.ring.replace('ring-', '')}` : 'border-gray-200',
            'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2'
          )}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={`Age mode selector, currently set to ${info.label}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-md',
                colors.gradient
              )}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="text-left">
              <div className={cn('font-semibold', colors.text)}>{info.label}</div>
              <div className="text-sm text-gray-500">
                Ages {info.ageRange} • {info.description}
              </div>
            </div>
          </div>
          <ChevronDownIcon
            className={cn('h-5 w-5 text-gray-400 transition-transform', isOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div
            className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl bg-white p-2 shadow-xl ring-1 ring-black/5"
            role="listbox"
            aria-label="Select age mode"
          >
            {(['young', 'older', 'full'] as AgeGroup[]).map((group) => {
              const groupColors = AGE_GROUP_COLORS[group];
              const GroupIcon = AGE_GROUP_ICONS[group];
              const groupInfo = AGE_GROUP_INFO[group];
              const isSelected = currentGroup === group;

              return (
                <button
                  key={group}
                  onClick={() => handleSelectGroup(group)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors',
                    isSelected ? groupColors.bg : 'hover:bg-gray-50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-1'
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white',
                      groupColors.gradient
                    )}
                  >
                    <GroupIcon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={cn('font-medium', groupColors.text)}>{groupInfo.label}</div>
                    <div className="text-xs text-gray-500">
                      Ages {groupInfo.ageRange} • {groupInfo.description}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckIcon className={cn('h-5 w-5', groupColors.text)} aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Compact variant (for header)
  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-all',
          isKidMode ? colors.bg : 'bg-gray-100',
          isKidMode ? colors.text : 'text-gray-600',
          'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Age mode: ${info.shortLabel}. Click to change.`}
        title={`${info.label} (Ages ${info.ageRange})`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-medium">{info.shortLabel}</span>
        <ChevronDownIcon
          className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl bg-white p-2 shadow-xl ring-1 ring-black/5"
          role="listbox"
          aria-label="Select age mode"
        >
          <div className="mb-2 flex items-center gap-2 border-b border-gray-100 px-3 pb-2">
            <Cog6ToothIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            <span className="text-xs font-medium text-gray-500">Interface Mode</span>
          </div>
          {(['young', 'older', 'full'] as AgeGroup[]).map((group) => {
            const groupColors = AGE_GROUP_COLORS[group];
            const GroupIcon = AGE_GROUP_ICONS[group];
            const groupInfo = AGE_GROUP_INFO[group];
            const isSelected = currentGroup === group;

            return (
              <button
                key={group}
                onClick={() => handleSelectGroup(group)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors',
                  isSelected ? groupColors.bg : 'hover:bg-gray-50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-1'
                )}
                role="option"
                aria-selected={isSelected}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white',
                    groupColors.gradient
                  )}
                >
                  <GroupIcon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={cn('text-sm font-medium', groupColors.text)}>
                    {groupInfo.shortLabel}
                  </div>
                  <div className="text-xs text-gray-400">Ages {groupInfo.ageRange}</div>
                </div>
                {isSelected && (
                  <CheckIcon className={cn('h-4 w-4', groupColors.text)} aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
