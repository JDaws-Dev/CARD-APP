'use client';

import { useEffect, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

const PROFILE_ID_KEY = 'kidcollect_profile_id';

export function useCurrentProfile() {
  const [profileId, setProfileId] = useState<Id<'profiles'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const getOrCreateDemoProfile = useMutation(api.profiles.getOrCreateDemoProfile);

  useEffect(() => {
    async function initProfile() {
      try {
        // Check localStorage for existing profile ID
        const storedId = localStorage.getItem(PROFILE_ID_KEY);

        if (storedId) {
          // Use stored profile ID
          setProfileId(storedId as Id<'profiles'>);
        } else {
          // Create a new demo profile
          const profile = await getOrCreateDemoProfile();
          if (profile) {
            localStorage.setItem(PROFILE_ID_KEY, profile._id);
            setProfileId(profile._id);
          }
        }
      } catch (error) {
        console.error('Failed to initialize profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initProfile();
  }, [getOrCreateDemoProfile]);

  const clearProfile = () => {
    localStorage.removeItem(PROFILE_ID_KEY);
    setProfileId(null);
  };

  return {
    profileId,
    isLoading,
    clearProfile,
  };
}
