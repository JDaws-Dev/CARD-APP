'use client';

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useCurrentProfile } from './useCurrentProfile';

/**
 * Hook to check if prices should be hidden for the current profile.
 *
 * This is a parent-controlled setting that hides card prices throughout
 * the app for child profiles when enabled.
 *
 * @returns {Object} An object containing:
 *   - hidePrices: boolean - Whether prices should be hidden
 *   - isLoading: boolean - Whether the setting is still loading
 */
export function useHidePrices() {
  const { profileId, isLoading: isProfileLoading } = useCurrentProfile();

  const profileSettings = useQuery(
    api.profileSettings.getProfileSettings,
    profileId ? { profileId } : 'skip'
  );

  // Loading if profile is loading or settings are loading
  const isLoading = isProfileLoading || (profileId !== null && profileSettings === undefined);

  return {
    hidePrices: profileSettings?.hidePrices ?? false,
    isLoading,
  };
}
