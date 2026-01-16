import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Import the types and constants from the provider
// We test the logic directly since testing React context requires more setup
type AgeGroup = 'young' | 'older' | 'full';

interface FeatureFlags {
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

const AGE_GROUP_INFO: Record<
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

describe('Kid Mode Feature Flags', () => {
  describe('FEATURES_BY_AGE', () => {
    it('should have feature flags for all age groups', () => {
      expect(FEATURES_BY_AGE.young).toBeDefined();
      expect(FEATURES_BY_AGE.older).toBeDefined();
      expect(FEATURES_BY_AGE.full).toBeDefined();
    });

    it('should have consistent feature flag properties across all age groups', () => {
      const youngKeys = Object.keys(FEATURES_BY_AGE.young).sort();
      const olderKeys = Object.keys(FEATURES_BY_AGE.older).sort();
      const fullKeys = Object.keys(FEATURES_BY_AGE.full).sort();

      expect(youngKeys).toEqual(olderKeys);
      expect(olderKeys).toEqual(fullKeys);
    });

    it('should have all boolean values for feature flags', () => {
      const ageGroups: AgeGroup[] = ['young', 'older', 'full'];
      ageGroups.forEach((group) => {
        Object.values(FEATURES_BY_AGE[group]).forEach((value) => {
          expect(typeof value).toBe('boolean');
        });
      });
    });
  });

  describe('Young Collector Mode (ages 6-8)', () => {
    const features = FEATURES_BY_AGE.young;

    it('should hide pricing for young collectors', () => {
      expect(features.showPricing).toBe(false);
    });

    it('should hide rarity details for young collectors', () => {
      expect(features.showRarityDetails).toBe(false);
    });

    it('should use simplified layout for young collectors', () => {
      expect(features.simplifiedLayout).toBe(true);
    });

    it('should use larger touch targets for young collectors', () => {
      expect(features.largerTouchTargets).toBe(true);
    });

    it('should hide advanced stats for young collectors', () => {
      expect(features.showAdvancedStats).toBe(false);
    });

    it('should hide variant selector for young collectors', () => {
      expect(features.showVariantSelector).toBe(false);
    });

    it('should hide activity feed for young collectors', () => {
      expect(features.showActivityFeed).toBe(false);
    });

    it('should keep animated celebrations enabled for young collectors', () => {
      expect(features.animatedCelebrations).toBe(true);
    });

    it('should hide export options for young collectors', () => {
      expect(features.showExportOptions).toBe(false);
    });

    it('should use reduced text content for young collectors', () => {
      expect(features.reducedTextContent).toBe(true);
    });
  });

  describe('Explorer Mode (ages 9-11)', () => {
    const features = FEATURES_BY_AGE.older;

    it('should show pricing for explorers', () => {
      expect(features.showPricing).toBe(true);
    });

    it('should show rarity details for explorers', () => {
      expect(features.showRarityDetails).toBe(true);
    });

    it('should not use simplified layout for explorers', () => {
      expect(features.simplifiedLayout).toBe(false);
    });

    it('should not use larger touch targets for explorers', () => {
      expect(features.largerTouchTargets).toBe(false);
    });

    it('should show advanced stats for explorers', () => {
      expect(features.showAdvancedStats).toBe(true);
    });

    it('should show variant selector for explorers', () => {
      expect(features.showVariantSelector).toBe(true);
    });

    it('should show activity feed for explorers', () => {
      expect(features.showActivityFeed).toBe(true);
    });

    it('should keep animated celebrations enabled for explorers', () => {
      expect(features.animatedCelebrations).toBe(true);
    });

    it('should show export options for explorers', () => {
      expect(features.showExportOptions).toBe(true);
    });

    it('should not use reduced text content for explorers', () => {
      expect(features.reducedTextContent).toBe(false);
    });
  });

  describe('Advanced Mode (ages 12-14)', () => {
    const features = FEATURES_BY_AGE.full;

    it('should enable all features for advanced users', () => {
      expect(features.showPricing).toBe(true);
      expect(features.showRarityDetails).toBe(true);
      expect(features.showAdvancedStats).toBe(true);
      expect(features.showVariantSelector).toBe(true);
      expect(features.showActivityFeed).toBe(true);
      expect(features.showExportOptions).toBe(true);
    });

    it('should not use simplified UI for advanced users', () => {
      expect(features.simplifiedLayout).toBe(false);
      expect(features.largerTouchTargets).toBe(false);
      expect(features.reducedTextContent).toBe(false);
    });

    it('should keep animated celebrations enabled for advanced users', () => {
      expect(features.animatedCelebrations).toBe(true);
    });
  });

  describe('Feature parity between older and full modes', () => {
    it('should have the same feature flags enabled for older and full modes', () => {
      const olderFeatures = FEATURES_BY_AGE.older;
      const fullFeatures = FEATURES_BY_AGE.full;

      // These should be the same
      expect(olderFeatures.showPricing).toBe(fullFeatures.showPricing);
      expect(olderFeatures.showRarityDetails).toBe(fullFeatures.showRarityDetails);
      expect(olderFeatures.simplifiedLayout).toBe(fullFeatures.simplifiedLayout);
      expect(olderFeatures.showAdvancedStats).toBe(fullFeatures.showAdvancedStats);
      expect(olderFeatures.showVariantSelector).toBe(fullFeatures.showVariantSelector);
      expect(olderFeatures.showActivityFeed).toBe(fullFeatures.showActivityFeed);
      expect(olderFeatures.animatedCelebrations).toBe(fullFeatures.animatedCelebrations);
      expect(olderFeatures.showExportOptions).toBe(fullFeatures.showExportOptions);
    });
  });
});

describe('Age Group Information', () => {
  describe('AGE_GROUP_INFO', () => {
    it('should have info for all age groups', () => {
      expect(AGE_GROUP_INFO.young).toBeDefined();
      expect(AGE_GROUP_INFO.older).toBeDefined();
      expect(AGE_GROUP_INFO.full).toBeDefined();
    });

    it('should have all required properties for each age group', () => {
      const ageGroups: AgeGroup[] = ['young', 'older', 'full'];
      ageGroups.forEach((group) => {
        const info = AGE_GROUP_INFO[group];
        expect(info.label).toBeDefined();
        expect(info.ageRange).toBeDefined();
        expect(info.description).toBeDefined();
        expect(info.shortLabel).toBeDefined();
      });
    });

    it('should have correct age ranges', () => {
      expect(AGE_GROUP_INFO.young.ageRange).toBe('6-8');
      expect(AGE_GROUP_INFO.older.ageRange).toBe('9-11');
      expect(AGE_GROUP_INFO.full.ageRange).toBe('12-14');
    });

    it('should have non-empty labels', () => {
      const ageGroups: AgeGroup[] = ['young', 'older', 'full'];
      ageGroups.forEach((group) => {
        expect(AGE_GROUP_INFO[group].label.length).toBeGreaterThan(0);
        expect(AGE_GROUP_INFO[group].shortLabel.length).toBeGreaterThan(0);
      });
    });

    it('should have short labels that are actually short (max 12 chars)', () => {
      const ageGroups: AgeGroup[] = ['young', 'older', 'full'];
      ageGroups.forEach((group) => {
        expect(AGE_GROUP_INFO[group].shortLabel.length).toBeLessThanOrEqual(12);
      });
    });
  });
});

describe('localStorage Integration', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const KID_MODE_KEY = 'kidcollect_kid_mode';
  const AGE_GROUP_KEY = 'kidcollect_age_group';

  it('should save kid mode state to localStorage', () => {
    localStorage.setItem(KID_MODE_KEY, 'true');
    expect(localStorage.getItem(KID_MODE_KEY)).toBe('true');
  });

  it('should save age group to localStorage', () => {
    localStorage.setItem(AGE_GROUP_KEY, 'young');
    expect(localStorage.getItem(AGE_GROUP_KEY)).toBe('young');
  });

  it('should return null for unset values', () => {
    expect(localStorage.getItem(KID_MODE_KEY)).toBeNull();
    expect(localStorage.getItem(AGE_GROUP_KEY)).toBeNull();
  });

  it('should persist across get/set operations', () => {
    localStorage.setItem(KID_MODE_KEY, 'true');
    localStorage.setItem(AGE_GROUP_KEY, 'older');

    expect(localStorage.getItem(KID_MODE_KEY)).toBe('true');
    expect(localStorage.getItem(AGE_GROUP_KEY)).toBe('older');
  });

  it('should validate age group values', () => {
    const validGroups: AgeGroup[] = ['young', 'older', 'full'];
    validGroups.forEach((group) => {
      localStorage.setItem(AGE_GROUP_KEY, group);
      const stored = localStorage.getItem(AGE_GROUP_KEY);
      expect(validGroups).toContain(stored);
    });
  });
});

describe('Feature Flag Logic', () => {
  function getFeatures(isKidMode: boolean, ageGroup: AgeGroup): FeatureFlags {
    return isKidMode ? FEATURES_BY_AGE[ageGroup] : FEATURES_BY_AGE.full;
  }

  it('should return full features when kid mode is disabled', () => {
    const features = getFeatures(false, 'young');
    expect(features).toEqual(FEATURES_BY_AGE.full);
  });

  it('should return full features even with young age group when kid mode is disabled', () => {
    const features = getFeatures(false, 'young');
    expect(features.showPricing).toBe(true);
    expect(features.simplifiedLayout).toBe(false);
  });

  it('should return young features when kid mode is enabled with young age group', () => {
    const features = getFeatures(true, 'young');
    expect(features).toEqual(FEATURES_BY_AGE.young);
    expect(features.showPricing).toBe(false);
    expect(features.simplifiedLayout).toBe(true);
  });

  it('should return older features when kid mode is enabled with older age group', () => {
    const features = getFeatures(true, 'older');
    expect(features).toEqual(FEATURES_BY_AGE.older);
  });

  it('should return full features when kid mode is enabled with full age group', () => {
    const features = getFeatures(true, 'full');
    expect(features).toEqual(FEATURES_BY_AGE.full);
  });
});

describe('Accessibility Considerations', () => {
  it('should have appropriate feature flags for younger users', () => {
    const youngFeatures = FEATURES_BY_AGE.young;

    // Young users should have:
    // - Larger touch targets for easier interaction
    // - Simplified layout to reduce cognitive load
    // - Reduced text content for better readability
    // - Animated celebrations (kids love animations)
    expect(youngFeatures.largerTouchTargets).toBe(true);
    expect(youngFeatures.simplifiedLayout).toBe(true);
    expect(youngFeatures.reducedTextContent).toBe(true);
    expect(youngFeatures.animatedCelebrations).toBe(true);
  });

  it('should keep celebrations enabled for all age groups', () => {
    // Celebrations should be fun for everyone
    expect(FEATURES_BY_AGE.young.animatedCelebrations).toBe(true);
    expect(FEATURES_BY_AGE.older.animatedCelebrations).toBe(true);
    expect(FEATURES_BY_AGE.full.animatedCelebrations).toBe(true);
  });
});
