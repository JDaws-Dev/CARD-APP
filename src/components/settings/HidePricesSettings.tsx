'use client';

import { useState, useEffect, useMemo } from 'react';
import { CurrencyDollarIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

// ============================================================================
// TYPES
// ============================================================================

interface ChildProfile {
  id: Id<'profiles'>;
  displayName: string;
  profileType?: 'parent' | 'child';
}

// ============================================================================
// PROFILE SELECTOR COMPONENT
// ============================================================================

interface ProfileSelectorProps {
  profiles: ChildProfile[];
  selectedProfileId: Id<'profiles'> | null;
  onSelectProfile: (profileId: Id<'profiles'>) => void;
}

function ProfileSelector({ profiles, selectedProfileId, onSelectProfile }: ProfileSelectorProps) {
  const childProfiles = profiles.filter((p) => p.profileType === 'child');

  if (childProfiles.length === 0) {
    return (
      <div className="rounded-lg bg-gray-100 p-4 text-center text-sm text-gray-600 dark:bg-slate-700/50 dark:text-slate-400">
        No child profiles found. Add a child profile to configure their price visibility.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
        Select a child to configure their price visibility:
      </p>
      <div className="flex flex-wrap gap-2">
        {childProfiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => onSelectProfile(profile.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              selectedProfileId === profile.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <UserCircleIcon className="h-5 w-5" />
            {profile.displayName}
            {selectedProfileId === profile.id && <CheckIcon className="h-4 w-4" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HidePricesSettings() {
  const PROFILE_ID_KEY = 'kidcollect_profile_id';

  // Get current user's profile to access family profiles
  const currentUserProfile = useQuery(api.profiles.getCurrentUserProfile, {});
  const availableProfiles = useMemo(
    () => currentUserProfile?.availableProfiles ?? [],
    [currentUserProfile?.availableProfiles]
  );

  // Get current profile ID from localStorage
  const [currentProfileId, setCurrentProfileId] = useState<Id<'profiles'> | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<Id<'profiles'> | null>(null);

  // Initialize profile IDs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem(PROFILE_ID_KEY);
      if (savedId) {
        setCurrentProfileId(savedId as Id<'profiles'>);
      }
    }
  }, []);

  // Auto-select first child if parent is viewing and no child selected
  useEffect(() => {
    const currentProfile = availableProfiles.find((p) => p.id === currentProfileId);
    const childProfiles = availableProfiles.filter((p) => p.profileType === 'child');

    if (currentProfile?.profileType === 'parent' && !selectedChildId && childProfiles.length > 0) {
      setSelectedChildId(childProfiles[0].id);
    }
  }, [availableProfiles, currentProfileId, selectedChildId]);

  // Determine which profile to show settings for
  const targetProfileId = selectedChildId;
  const currentProfile = availableProfiles.find((p) => p.id === currentProfileId);
  const isParent = currentProfile?.profileType === 'parent';

  // Query settings for the target profile
  const profileSettings = useQuery(
    api.profileSettings.getProfileSettings,
    targetProfileId ? { profileId: targetProfileId } : 'skip'
  );

  // Mutation
  const setHidePricesMutation = useMutation(api.profileSettings.setHidePrices);

  const hidePrices = profileSettings?.hidePrices ?? false;

  const handleToggle = async () => {
    if (!targetProfileId || !currentProfileId) return;
    await setHidePricesMutation({
      targetProfileId,
      hidePrices: !hidePrices,
      callerProfileId: currentProfileId,
    });
  };

  // Get the name of the child being configured
  const targetProfile = availableProfiles.find((p) => p.id === targetProfileId);
  const targetName = targetProfile?.displayName ?? 'child';

  // Only show to parents
  if (!isParent) {
    return null;
  }

  // Loading state
  if (!currentUserProfile || (targetProfileId && profileSettings === undefined)) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-16 rounded-lg bg-gray-200 dark:bg-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile selector (only shown to parents with multiple children) */}
      {availableProfiles.filter((p) => p.profileType === 'child').length > 0 && (
        <ProfileSelector
          profiles={availableProfiles as ChildProfile[]}
          selectedProfileId={selectedChildId}
          onSelectProfile={setSelectedChildId}
        />
      )}

      {!targetProfileId ? (
        <div className="rounded-lg bg-gray-100 p-4 text-center text-sm text-gray-600 dark:bg-slate-700/50 dark:text-slate-400">
          Select a child profile to configure their price visibility.
        </div>
      ) : (
        <>
          {/* Current profile indicator */}
          {targetProfile && (
            <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-700/50 dark:bg-indigo-900/20">
              <UserCircleIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                Configuring price visibility for <strong>{targetName}</strong>
              </span>
            </div>
          )}

          {/* Hide Prices toggle */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                <CurrencyDollarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Hide Prices</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Hide card prices throughout the app for this profile
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              role="switch"
              aria-checked={hidePrices}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                hidePrices ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  hidePrices ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Info about what this hides */}
          {hidePrices && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-700/50 dark:bg-amber-900/20">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                When enabled, {targetName} won&apos;t see card prices, market values, or price-related
                information anywhere in the app.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
