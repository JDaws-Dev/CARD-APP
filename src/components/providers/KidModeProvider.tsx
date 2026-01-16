'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

// ============================================================================
// KID MODE CONFIGURATION
// ============================================================================

/**
 * Age groups for UI simplification
 * - young: Ages 6-8, simplified interface with larger touch targets, no prices
 * - older: Ages 9-11, intermediate features, optional prices
 * - full: Ages 12-14, all features enabled
 */
export type AgeGroup = 'young' | 'older' | 'full';

// Feature flags by age group
export interface FeatureFlags {
  showPricing: boolean;
  showRarityDetails: boolean;
  simplifiedLayout: boolean;
  largerTouchTargets: boolean;
  showAdvancedStats: boolean;
  showVariantSelector: boolean;
  showActivityFeed: boolean;
  animatedCelebrations: boolean;
  showExportOptions: boolean;
  reducedTextContent: boolean;
}

const FEATURES_BY_AGE: Record<AgeGroup, FeatureFlags> = {
  young: {
    showPricing: false,
    showRarityDetails: false,
    simplifiedLayout: true,
    largerTouchTargets: true,
    showAdvancedStats: false,
    showVariantSelector: false,
    showActivityFeed: false,
    animatedCelebrations: true,
    showExportOptions: false,
    reducedTextContent: true,
  },
  older: {
    showPricing: true,
    showRarityDetails: true,
    simplifiedLayout: false,
    largerTouchTargets: false,
    showAdvancedStats: true,
    showVariantSelector: true,
    showActivityFeed: true,
    animatedCelebrations: true,
    showExportOptions: true,
    reducedTextContent: false,
  },
  full: {
    showPricing: true,
    showRarityDetails: true,
    simplifiedLayout: false,
    largerTouchTargets: false,
    showAdvancedStats: true,
    showVariantSelector: true,
    showActivityFeed: true,
    animatedCelebrations: true,
    showExportOptions: true,
    reducedTextContent: false,
  },
};

// Age group display information
export const AGE_GROUP_INFO: Record<
  AgeGroup,
  {
    label: string;
    ageRange: string;
    description: string;
    shortLabel: string;
  }
> = {
  young: {
    label: 'Young Collector',
    ageRange: '6-8',
    description: 'Simplified interface with big buttons',
    shortLabel: 'Simple',
  },
  older: {
    label: 'Explorer',
    ageRange: '9-11',
    description: 'More features unlocked',
    shortLabel: 'Explorer',
  },
  full: {
    label: 'Advanced',
    ageRange: '12-14',
    description: 'All features available',
    shortLabel: 'Full',
  },
};

// localStorage keys
const KID_MODE_KEY = 'kidcollect_kid_mode';
const AGE_GROUP_KEY = 'kidcollect_age_group';

// ============================================================================
// CONTEXT
// ============================================================================

interface KidModeContextType {
  isKidMode: boolean;
  ageGroup: AgeGroup;
  features: FeatureFlags;
  setAgeGroup: (group: AgeGroup) => void;
  toggleKidMode: () => void;
  enableKidMode: () => void;
  disableKidMode: () => void;
}

const KidModeContext = createContext<KidModeContextType | null>(null);

// ============================================================================
// HOOK
// ============================================================================

export function useKidMode() {
  const context = useContext(KidModeContext);
  if (!context) {
    // Return default values when used outside provider
    return {
      isKidMode: false,
      ageGroup: 'full' as AgeGroup,
      features: FEATURES_BY_AGE.full,
      setAgeGroup: () => {},
      toggleKidMode: () => {},
      enableKidMode: () => {},
      disableKidMode: () => {},
    };
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

export function KidModeProvider({ children }: { children: ReactNode }) {
  const [isKidMode, setIsKidMode] = useState(false);
  const [ageGroup, setAgeGroupState] = useState<AgeGroup>('full');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved preferences from localStorage
  useEffect(() => {
    try {
      const savedKidMode = localStorage.getItem(KID_MODE_KEY);
      const savedAgeGroup = localStorage.getItem(AGE_GROUP_KEY);

      if (savedKidMode !== null) {
        setIsKidMode(savedKidMode === 'true');
      }
      if (savedAgeGroup !== null && ['young', 'older', 'full'].includes(savedAgeGroup)) {
        setAgeGroupState(savedAgeGroup as AgeGroup);
      }
    } catch {
      // localStorage might not be available in some contexts
    }
    setIsInitialized(true);
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(KID_MODE_KEY, String(isKidMode));
      localStorage.setItem(AGE_GROUP_KEY, ageGroup);
    } catch {
      // localStorage might not be available in some contexts
    }
  }, [isKidMode, ageGroup, isInitialized]);

  const setAgeGroup = useCallback((group: AgeGroup) => {
    setAgeGroupState(group);
    // Automatically enable kid mode when selecting young or older
    if (group === 'young' || group === 'older') {
      setIsKidMode(true);
    }
  }, []);

  const toggleKidMode = useCallback(() => {
    setIsKidMode((prev) => !prev);
  }, []);

  const enableKidMode = useCallback(() => {
    setIsKidMode(true);
  }, []);

  const disableKidMode = useCallback(() => {
    setIsKidMode(false);
    setAgeGroupState('full');
  }, []);

  // Get features based on current state
  const features = isKidMode ? FEATURES_BY_AGE[ageGroup] : FEATURES_BY_AGE.full;

  return (
    <KidModeContext.Provider
      value={{
        isKidMode,
        ageGroup,
        features,
        setAgeGroup,
        toggleKidMode,
        enableKidMode,
        disableKidMode,
      }}
    >
      {children}
    </KidModeContext.Provider>
  );
}
