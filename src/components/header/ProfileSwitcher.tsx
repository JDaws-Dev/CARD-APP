'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronDownIcon, CheckIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

const PROFILE_ID_KEY = 'kidcollect_profile_id';

interface Profile {
  id: Id<'profiles'>;
  displayName: string;
  avatarUrl?: string;
  profileType?: 'parent' | 'child';
}

/**
 * ProfileSwitcher component for the header.
 * Shows the current profile and allows switching between family profiles.
 */
export function ProfileSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<Id<'profiles'> | null>(null);

  // Close handler - must be defined before any early returns
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Load saved profile ID from localStorage on mount
  useEffect(() => {
    const savedProfileId = localStorage.getItem(PROFILE_ID_KEY);
    if (savedProfileId) {
      setSelectedProfileId(savedProfileId as Id<'profiles'>);
    }
  }, []);

  // Close on escape key - must be defined before any early returns
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleClose]);

  // Query with the selected profile ID to get current profile and available profiles
  const userProfile = useQuery(
    api.profiles.getCurrentUserProfile,
    selectedProfileId ? { profileId: selectedProfileId } : {}
  );

  const currentProfile = userProfile?.profile;
  const availableProfiles = userProfile?.availableProfiles ?? [];

  // Don't show if only one profile or loading
  if (!userProfile || availableProfiles.length <= 1) {
    return null;
  }

  const handleProfileSelect = (profile: Profile) => {
    // Save to localStorage for persistence
    localStorage.setItem(PROFILE_ID_KEY, profile.id);
    setSelectedProfileId(profile.id);
    setIsOpen(false);
    // Trigger a page reload to refresh all data with the new profile
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-kid-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Switch profile"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="profile-switcher-menu"
      >
        {/* Avatar */}
        {currentProfile?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentProfile.avatarUrl}
            alt=""
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <UserCircleIcon className="h-6 w-6" aria-hidden="true" />
        )}

        {/* Name */}
        <span className="hidden sm:inline">{currentProfile?.displayName ?? 'Profile'}</span>

        {/* Dropdown arrow */}
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Dropdown menu */}
          <div
            id="profile-switcher-menu"
            className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800"
            role="listbox"
            aria-label="Select profile"
          >
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              Switch Profile
            </div>

            {availableProfiles.map((profile) => {
              const isSelected = profile.id === currentProfile?.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => handleProfileSelect(profile)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kid-primary dark:hover:bg-slate-700 ${
                    isSelected
                      ? 'bg-kid-primary/10 text-kid-primary'
                      : 'text-gray-700 dark:text-slate-200'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  {/* Avatar */}
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-600">
                      <UserCircleIcon className="h-5 w-5 text-gray-500 dark:text-slate-400" aria-hidden="true" />
                    </div>
                  )}

                  {/* Name and type */}
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{profile.displayName}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400">
                      {profile.profileType === 'parent' ? 'Parent' : 'Child'}
                    </div>
                  </div>

                  {/* Checkmark for selected */}
                  {isSelected && (
                    <CheckIcon className="h-5 w-5 flex-shrink-0 text-kid-primary" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
