'use client';

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

const PROFILE_ID_KEY = 'kidcollect_profile_id';

export function useCurrentProfile() {
  // Use authenticated user profile query
  const userProfile = useQuery(api.profiles.getCurrentUserProfile, {});

  // Derive profile ID from authenticated user data
  const profileId: Id<'profiles'> | null = userProfile?.profile?.id ?? null;

  // Loading is when the query is still fetching (undefined)
  const isLoading = userProfile === undefined;

  // Clear profile selection from localStorage (for switching profiles)
  const clearProfile = () => {
    localStorage.removeItem(PROFILE_ID_KEY);
  };

  return {
    profileId,
    isLoading,
    clearProfile,
    // Additional data available from the authenticated query
    profile: userProfile?.profile ?? null,
    family: userProfile?.family ?? null,
    availableProfiles: userProfile?.availableProfiles ?? [],
    user: userProfile?.user ?? null,
    isAuthenticated: !!userProfile,
  };
}
