import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  VALID_PROFILE_TYPES,
  MAX_PROFILES_PER_FAMILY,
  MAX_PARENTS_PER_FAMILY,
  MIN_DISPLAY_NAME_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  isValidProfileType,
  isValidDisplayName,
  validateProfileInput,
  canAddProfile,
  canAddParentProfile,
  canAddChildProfile,
  getRemainingProfileSlots,
  countProfilesByType,
  findParentProfile,
  getChildProfiles,
  isParentProfile,
  isChildProfile,
  canChangeProfileType,
  getProfileTypeLabel,
  formatProfileDisplay,
  getAvailableProfileTypes,
  sortProfiles,
  sortProfilesByName,
  Profile,
  CurrentUserProfileResult,
  hasParentAccess,
  isChildView,
  getDashboardRoute,
  canSwitchProfiles,
  getOtherProfiles,
  isSubscriptionActive,
  hasFamilySubscription,
  getDaysUntilExpiration,
  getProfileGreeting,
  isEmailVerified,
  findProfileById,
  getParentProfileFromResult,
  getChildProfilesFromResult,
  canAccessParentFeatures,
  getSubscriptionStatusMessage,
  getHeaderStyle,
  needsOnboarding,
  // Profile access validation imports
  isNotAuthenticated,
  isUnauthorizedAccess,
  isProfileNotFound,
  isFamilyNotFound,
  getProfileAccessErrorMessage,
  getFamilyAccessErrorMessage,
  getProfileAccessAction,
  isSecureMutationSuccess,
  getSecureMutationErrors,
  getSecureMutationErrorMessages,
  isSecureMutationAuthError,
  isSecureMutationOwnershipError,
} from '../profiles';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    _id: 'profile_' + Math.random().toString(36).slice(2),
    familyId: 'family_default',
    displayName: 'Test User',
    profileType: 'child',
    ...overrides,
  };
}

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Profile Constants', () => {
  it('should have correct valid profile types', () => {
    expect(VALID_PROFILE_TYPES).toEqual(['parent', 'child']);
  });

  it('should have MAX_PROFILES_PER_FAMILY = 4', () => {
    expect(MAX_PROFILES_PER_FAMILY).toBe(4);
  });

  it('should have MAX_PARENTS_PER_FAMILY = 1', () => {
    expect(MAX_PARENTS_PER_FAMILY).toBe(1);
  });

  it('should have reasonable display name length limits', () => {
    expect(MIN_DISPLAY_NAME_LENGTH).toBe(1);
    expect(MAX_DISPLAY_NAME_LENGTH).toBe(50);
  });
});

// ============================================================================
// VALIDATION FUNCTION TESTS
// ============================================================================

describe('isValidProfileType', () => {
  it('should return true for "parent"', () => {
    expect(isValidProfileType('parent')).toBe(true);
  });

  it('should return true for "child"', () => {
    expect(isValidProfileType('child')).toBe(true);
  });

  it('should return false for invalid strings', () => {
    expect(isValidProfileType('admin')).toBe(false);
    expect(isValidProfileType('PARENT')).toBe(false);
    expect(isValidProfileType('Child')).toBe(false);
    expect(isValidProfileType('')).toBe(false);
  });

  it('should return false for non-strings', () => {
    expect(isValidProfileType(null)).toBe(false);
    expect(isValidProfileType(undefined)).toBe(false);
    expect(isValidProfileType(123)).toBe(false);
    expect(isValidProfileType({})).toBe(false);
    expect(isValidProfileType([])).toBe(false);
  });
});

describe('isValidDisplayName', () => {
  it('should accept valid display names', () => {
    expect(isValidDisplayName('A')).toBe(true);
    expect(isValidDisplayName('John')).toBe(true);
    expect(isValidDisplayName('Alice Smith')).toBe(true);
    expect(isValidDisplayName('  Trimmed  ')).toBe(true); // Trimmed length is valid
  });

  it('should reject empty names', () => {
    expect(isValidDisplayName('')).toBe(false);
    expect(isValidDisplayName('   ')).toBe(false);
  });

  it('should reject names that are too long', () => {
    const tooLong = 'A'.repeat(51);
    expect(isValidDisplayName(tooLong)).toBe(false);
  });

  it('should accept names at max length', () => {
    const maxLength = 'A'.repeat(50);
    expect(isValidDisplayName(maxLength)).toBe(true);
  });
});

describe('validateProfileInput', () => {
  it('should validate correct input', () => {
    const result = validateProfileInput({
      displayName: 'Alice',
      profileType: 'child',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate parent profile type', () => {
    const result = validateProfileInput({
      displayName: 'Parent User',
      profileType: 'parent',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid display name', () => {
    const result = validateProfileInput({
      displayName: '',
      profileType: 'child',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      `Display name must be between ${MIN_DISPLAY_NAME_LENGTH} and ${MAX_DISPLAY_NAME_LENGTH} characters`
    );
  });

  it('should reject invalid profile type', () => {
    const result = validateProfileInput({
      displayName: 'Valid Name',
      profileType: 'invalid',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Profile type must be "parent" or "child"');
  });

  it('should collect multiple errors', () => {
    const result = validateProfileInput({
      displayName: '',
      profileType: 'invalid',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});

// ============================================================================
// FAMILY PROFILE LOGIC TESTS
// ============================================================================

describe('canAddProfile', () => {
  it('should return true when under limit', () => {
    expect(canAddProfile(0)).toBe(true);
    expect(canAddProfile(1)).toBe(true);
    expect(canAddProfile(2)).toBe(true);
    expect(canAddProfile(3)).toBe(true);
  });

  it('should return false when at limit', () => {
    expect(canAddProfile(4)).toBe(false);
  });

  it('should return false when over limit', () => {
    expect(canAddProfile(5)).toBe(false);
    expect(canAddProfile(10)).toBe(false);
  });
});

describe('canAddParentProfile', () => {
  it('should return true when no profiles exist', () => {
    expect(canAddParentProfile([])).toBe(true);
  });

  it('should return true when only child profiles exist', () => {
    const profiles = [
      createProfile({ profileType: 'child' }),
      createProfile({ profileType: 'child' }),
    ];
    expect(canAddParentProfile(profiles)).toBe(true);
  });

  it('should return false when parent already exists', () => {
    const profiles = [createProfile({ profileType: 'parent' })];
    expect(canAddParentProfile(profiles)).toBe(false);
  });

  it('should return false when at profile limit', () => {
    const profiles = [
      createProfile({ profileType: 'child' }),
      createProfile({ profileType: 'child' }),
      createProfile({ profileType: 'child' }),
      createProfile({ profileType: 'child' }),
    ];
    expect(canAddParentProfile(profiles)).toBe(false);
  });
});

describe('canAddChildProfile', () => {
  it('should return true when under limit', () => {
    expect(canAddChildProfile([])).toBe(true);
    expect(canAddChildProfile([createProfile()])).toBe(true);
  });

  it('should return false when at limit', () => {
    const profiles = Array.from({ length: 4 }, () => createProfile());
    expect(canAddChildProfile(profiles)).toBe(false);
  });
});

describe('getRemainingProfileSlots', () => {
  it('should return correct remaining slots', () => {
    expect(getRemainingProfileSlots(0)).toBe(4);
    expect(getRemainingProfileSlots(1)).toBe(3);
    expect(getRemainingProfileSlots(2)).toBe(2);
    expect(getRemainingProfileSlots(3)).toBe(1);
    expect(getRemainingProfileSlots(4)).toBe(0);
  });

  it('should never return negative', () => {
    expect(getRemainingProfileSlots(5)).toBe(0);
    expect(getRemainingProfileSlots(100)).toBe(0);
  });
});

describe('countProfilesByType', () => {
  it('should return zeros for empty array', () => {
    expect(countProfilesByType([])).toEqual({ parent: 0, child: 0 });
  });

  it('should count profiles correctly', () => {
    const profiles = [
      createProfile({ profileType: 'parent' }),
      createProfile({ profileType: 'child' }),
      createProfile({ profileType: 'child' }),
    ];
    expect(countProfilesByType(profiles)).toEqual({ parent: 1, child: 2 });
  });

  it('should handle all children', () => {
    const profiles = [
      createProfile({ profileType: 'child' }),
      createProfile({ profileType: 'child' }),
    ];
    expect(countProfilesByType(profiles)).toEqual({ parent: 0, child: 2 });
  });
});

describe('findParentProfile', () => {
  it('should return undefined for empty array', () => {
    expect(findParentProfile([])).toBeUndefined();
  });

  it('should return undefined when no parent exists', () => {
    const profiles = [
      createProfile({ profileType: 'child' }),
      createProfile({ profileType: 'child' }),
    ];
    expect(findParentProfile(profiles)).toBeUndefined();
  });

  it('should find the parent profile', () => {
    const parent = createProfile({ profileType: 'parent', displayName: 'Dad' });
    const profiles = [
      createProfile({ profileType: 'child' }),
      parent,
      createProfile({ profileType: 'child' }),
    ];
    expect(findParentProfile(profiles)).toBe(parent);
  });
});

describe('getChildProfiles', () => {
  it('should return empty array when no children', () => {
    const profiles = [createProfile({ profileType: 'parent' })];
    expect(getChildProfiles(profiles)).toEqual([]);
  });

  it('should return all child profiles', () => {
    const child1 = createProfile({ profileType: 'child', displayName: 'Kid1' });
    const child2 = createProfile({ profileType: 'child', displayName: 'Kid2' });
    const profiles = [child1, createProfile({ profileType: 'parent' }), child2];
    expect(getChildProfiles(profiles)).toEqual([child1, child2]);
  });
});

describe('isParentProfile', () => {
  it('should return true for parent profile', () => {
    const profile = createProfile({ profileType: 'parent' });
    expect(isParentProfile(profile)).toBe(true);
  });

  it('should return false for child profile', () => {
    const profile = createProfile({ profileType: 'child' });
    expect(isParentProfile(profile)).toBe(false);
  });
});

describe('isChildProfile', () => {
  it('should return true for child profile', () => {
    const profile = createProfile({ profileType: 'child' });
    expect(isChildProfile(profile)).toBe(true);
  });

  it('should return false for parent profile', () => {
    const profile = createProfile({ profileType: 'parent' });
    expect(isChildProfile(profile)).toBe(false);
  });
});

// ============================================================================
// PROFILE TYPE CHANGE VALIDATION TESTS
// ============================================================================

describe('canChangeProfileType', () => {
  it('should allow no change (same type)', () => {
    const profile = createProfile({ profileType: 'child' });
    const result = canChangeProfileType(profile, 'child', [profile]);
    expect(result.allowed).toBe(true);
  });

  it('should allow child to parent when no parent exists', () => {
    const profile = createProfile({ profileType: 'child', _id: 'profile1' });
    const result = canChangeProfileType(profile, 'parent', [profile]);
    expect(result.allowed).toBe(true);
  });

  it('should reject child to parent when parent exists', () => {
    const child = createProfile({ profileType: 'child', _id: 'profile1' });
    const parent = createProfile({ profileType: 'parent', _id: 'profile2' });
    const result = canChangeProfileType(child, 'parent', [child, parent]);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Only one parent profile allowed per family');
  });

  it('should allow parent to child', () => {
    const parent = createProfile({ profileType: 'parent' });
    const result = canChangeProfileType(parent, 'child', [parent]);
    expect(result.allowed).toBe(true);
  });
});

// ============================================================================
// DISPLAY HELPER TESTS
// ============================================================================

describe('getProfileTypeLabel', () => {
  it('should return "Parent" for parent type', () => {
    expect(getProfileTypeLabel('parent')).toBe('Parent');
  });

  it('should return "Child" for child type', () => {
    expect(getProfileTypeLabel('child')).toBe('Child');
  });
});

describe('formatProfileDisplay', () => {
  it('should format parent profile', () => {
    const profile = createProfile({
      displayName: 'John',
      profileType: 'parent',
    });
    expect(formatProfileDisplay(profile)).toBe('John (Parent)');
  });

  it('should format child profile', () => {
    const profile = createProfile({
      displayName: 'Alice',
      profileType: 'child',
    });
    expect(formatProfileDisplay(profile)).toBe('Alice (Child)');
  });
});

describe('getAvailableProfileTypes', () => {
  it('should return both types when no profiles exist', () => {
    expect(getAvailableProfileTypes([])).toEqual(['parent', 'child']);
  });

  it('should return only child when parent exists', () => {
    const profiles = [createProfile({ profileType: 'parent' })];
    expect(getAvailableProfileTypes(profiles)).toEqual(['child']);
  });

  it('should return only child when parent exists with other children', () => {
    const profiles = [
      createProfile({ profileType: 'parent' }),
      createProfile({ profileType: 'child' }),
    ];
    expect(getAvailableProfileTypes(profiles)).toEqual(['child']);
  });

  it('should return empty array when at profile limit', () => {
    const profiles = Array.from({ length: 4 }, () => createProfile({ profileType: 'child' }));
    expect(getAvailableProfileTypes(profiles)).toEqual([]);
  });
});

// ============================================================================
// SORTING TESTS
// ============================================================================

describe('sortProfiles', () => {
  it('should return empty array for empty input', () => {
    expect(sortProfiles([])).toEqual([]);
  });

  it('should put parent first', () => {
    const child = createProfile({ displayName: 'Alice', profileType: 'child' });
    const parent = createProfile({ displayName: 'Zack', profileType: 'parent' });
    const profiles = [child, parent];
    const sorted = sortProfiles(profiles);
    expect(sorted[0]).toBe(parent);
    expect(sorted[1]).toBe(child);
  });

  it('should sort children alphabetically after parent', () => {
    const parent = createProfile({ displayName: 'Parent', profileType: 'parent' });
    const charlie = createProfile({ displayName: 'Charlie', profileType: 'child' });
    const alice = createProfile({ displayName: 'Alice', profileType: 'child' });
    const bob = createProfile({ displayName: 'Bob', profileType: 'child' });

    const sorted = sortProfiles([charlie, parent, alice, bob]);

    expect(sorted[0]).toBe(parent);
    expect(sorted[1]).toBe(alice);
    expect(sorted[2]).toBe(bob);
    expect(sorted[3]).toBe(charlie);
  });

  it('should not mutate original array', () => {
    const profiles = [
      createProfile({ displayName: 'Zack', profileType: 'child' }),
      createProfile({ displayName: 'Alice', profileType: 'parent' }),
    ];
    const original = [...profiles];
    sortProfiles(profiles);
    expect(profiles).toEqual(original);
  });
});

describe('sortProfilesByName', () => {
  it('should sort alphabetically regardless of type', () => {
    const zack = createProfile({ displayName: 'Zack', profileType: 'parent' });
    const alice = createProfile({ displayName: 'Alice', profileType: 'child' });
    const bob = createProfile({ displayName: 'Bob', profileType: 'child' });

    const sorted = sortProfilesByName([zack, alice, bob]);

    expect(sorted[0]).toBe(alice);
    expect(sorted[1]).toBe(bob);
    expect(sorted[2]).toBe(zack);
  });

  it('should not mutate original array', () => {
    const profiles = [
      createProfile({ displayName: 'Zack' }),
      createProfile({ displayName: 'Alice' }),
    ];
    const original = [...profiles];
    sortProfilesByName(profiles);
    expect(profiles).toEqual(original);
  });
});

// ============================================================================
// INTEGRATION SCENARIOS
// ============================================================================

describe('Integration: Family Setup Flow', () => {
  it('should handle complete family setup', () => {
    const profiles: Profile[] = [];

    // Step 1: Create parent profile
    expect(canAddParentProfile(profiles)).toBe(true);
    const parent = createProfile({
      displayName: 'Mom',
      profileType: 'parent',
    });
    profiles.push(parent);

    // Step 2: Parent exists, can't add another
    expect(canAddParentProfile(profiles)).toBe(false);
    expect(canAddChildProfile(profiles)).toBe(true);

    // Step 3: Add children
    for (let i = 1; i <= 3; i++) {
      expect(canAddChildProfile(profiles)).toBe(true);
      profiles.push(
        createProfile({
          displayName: `Child ${i}`,
          profileType: 'child',
        })
      );
    }

    // Step 4: At limit
    expect(canAddProfile(profiles.length)).toBe(false);
    expect(getRemainingProfileSlots(profiles.length)).toBe(0);
    expect(getAvailableProfileTypes(profiles)).toEqual([]);

    // Step 5: Verify counts
    const counts = countProfilesByType(profiles);
    expect(counts.parent).toBe(1);
    expect(counts.child).toBe(3);

    // Step 6: Find parent
    expect(findParentProfile(profiles)).toBe(parent);
    expect(getChildProfiles(profiles)).toHaveLength(3);
  });

  it('should handle child-only family', () => {
    const profiles: Profile[] = [];

    // Add 4 child profiles
    for (let i = 1; i <= 4; i++) {
      profiles.push(
        createProfile({
          displayName: `Child ${i}`,
          profileType: 'child',
        })
      );
    }

    // No parent exists
    expect(findParentProfile(profiles)).toBeUndefined();

    // Can't add more profiles (at limit)
    expect(canAddParentProfile(profiles)).toBe(false);
    expect(canAddChildProfile(profiles)).toBe(false);

    // Verify
    const counts = countProfilesByType(profiles);
    expect(counts.parent).toBe(0);
    expect(counts.child).toBe(4);
  });
});

describe('Integration: Profile Type Change Scenarios', () => {
  it('should allow promoting child to parent when no parent exists', () => {
    const child1 = createProfile({ _id: 'p1', displayName: 'Child1', profileType: 'child' });
    const child2 = createProfile({ _id: 'p2', displayName: 'Child2', profileType: 'child' });
    const profiles = [child1, child2];

    const result = canChangeProfileType(child1, 'parent', profiles);
    expect(result.allowed).toBe(true);
  });

  it('should reject promoting child when parent exists', () => {
    const parent = createProfile({ _id: 'p1', displayName: 'Parent', profileType: 'parent' });
    const child = createProfile({ _id: 'p2', displayName: 'Child', profileType: 'child' });
    const profiles = [parent, child];

    const result = canChangeProfileType(child, 'parent', profiles);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Only one parent');
  });

  it('should allow demoting parent to child', () => {
    const parent = createProfile({ _id: 'p1', displayName: 'Parent', profileType: 'parent' });
    const child = createProfile({ _id: 'p2', displayName: 'Child', profileType: 'child' });
    const profiles = [parent, child];

    const result = canChangeProfileType(parent, 'child', profiles);
    expect(result.allowed).toBe(true);
  });
});

// ============================================================================
// CURRENT USER PROFILE RESULT HELPERS
// ============================================================================

function createCurrentUserProfileResult(
  overrides: Partial<CurrentUserProfileResult> = {}
): CurrentUserProfileResult {
  return {
    profile: {
      id: 'profile_123',
      displayName: 'Test User',
      profileType: 'child',
    },
    family: {
      id: 'family_123',
      subscriptionTier: 'free',
    },
    availableProfiles: [
      {
        id: 'profile_123',
        displayName: 'Test User',
        profileType: 'child',
      },
    ],
    user: {
      id: 'user_123',
      email: 'test@example.com',
      emailVerified: true,
    },
    ...overrides,
  };
}

function createParentResult(): CurrentUserProfileResult {
  return createCurrentUserProfileResult({
    profile: {
      id: 'profile_parent',
      displayName: 'Parent User',
      profileType: 'parent',
    },
    availableProfiles: [
      {
        id: 'profile_parent',
        displayName: 'Parent User',
        profileType: 'parent',
      },
      {
        id: 'profile_child1',
        displayName: 'Child One',
        profileType: 'child',
      },
      {
        id: 'profile_child2',
        displayName: 'Child Two',
        profileType: 'child',
      },
    ],
  });
}

function createChildResult(): CurrentUserProfileResult {
  return createCurrentUserProfileResult({
    profile: {
      id: 'profile_child1',
      displayName: 'Child One',
      profileType: 'child',
    },
    availableProfiles: [
      {
        id: 'profile_parent',
        displayName: 'Parent User',
        profileType: 'parent',
      },
      {
        id: 'profile_child1',
        displayName: 'Child One',
        profileType: 'child',
      },
    ],
  });
}

// ============================================================================
// CURRENT USER PROFILE HELPER TESTS
// ============================================================================

describe('hasParentAccess', () => {
  it('should return false for null', () => {
    expect(hasParentAccess(null)).toBe(false);
  });

  it('should return true for parent profile', () => {
    expect(hasParentAccess(createParentResult())).toBe(true);
  });

  it('should return false for child profile', () => {
    expect(hasParentAccess(createChildResult())).toBe(false);
  });
});

describe('isChildView', () => {
  it('should return false for null', () => {
    expect(isChildView(null)).toBe(false);
  });

  it('should return false for parent profile', () => {
    expect(isChildView(createParentResult())).toBe(false);
  });

  it('should return true for child profile', () => {
    expect(isChildView(createChildResult())).toBe(true);
  });
});

describe('getDashboardRoute', () => {
  it('should return /login for null', () => {
    expect(getDashboardRoute(null)).toBe('/login');
  });

  it('should return /parent-dashboard for parent profile', () => {
    expect(getDashboardRoute(createParentResult())).toBe('/parent-dashboard');
  });

  it('should return /kid-dashboard for child profile', () => {
    expect(getDashboardRoute(createChildResult())).toBe('/kid-dashboard');
  });
});

describe('canSwitchProfiles', () => {
  it('should return false for null', () => {
    expect(canSwitchProfiles(null)).toBe(false);
  });

  it('should return false for single profile', () => {
    expect(canSwitchProfiles(createCurrentUserProfileResult())).toBe(false);
  });

  it('should return true for multiple profiles', () => {
    expect(canSwitchProfiles(createParentResult())).toBe(true);
    expect(canSwitchProfiles(createChildResult())).toBe(true);
  });
});

describe('getOtherProfiles', () => {
  it('should return empty array for null', () => {
    expect(getOtherProfiles(null)).toEqual([]);
  });

  it('should return empty array for single profile', () => {
    expect(getOtherProfiles(createCurrentUserProfileResult())).toEqual([]);
  });

  it('should return other profiles excluding current', () => {
    const result = createParentResult();
    const others = getOtherProfiles(result);
    expect(others).toHaveLength(2);
    expect(others.find((p) => p.id === result.profile.id)).toBeUndefined();
  });
});

describe('isSubscriptionActive', () => {
  it('should return false for null', () => {
    expect(isSubscriptionActive(null)).toBe(false);
  });

  it('should return true for free tier', () => {
    expect(isSubscriptionActive(createCurrentUserProfileResult())).toBe(true);
  });

  it('should return true for family tier without expiration', () => {
    const result = createCurrentUserProfileResult({
      family: {
        id: 'family_123',
        subscriptionTier: 'family',
      },
    });
    expect(isSubscriptionActive(result)).toBe(true);
  });

  it('should return true for family tier with future expiration', () => {
    const result = createCurrentUserProfileResult({
      family: {
        id: 'family_123',
        subscriptionTier: 'family',
        subscriptionExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      },
    });
    expect(isSubscriptionActive(result)).toBe(true);
  });

  it('should return false for expired family tier', () => {
    const result = createCurrentUserProfileResult({
      family: {
        id: 'family_123',
        subscriptionTier: 'family',
        subscriptionExpiresAt: Date.now() - 1000, // expired
      },
    });
    expect(isSubscriptionActive(result)).toBe(false);
  });
});

describe('hasFamilySubscription', () => {
  it('should return false for null', () => {
    expect(hasFamilySubscription(null)).toBe(false);
  });

  it('should return false for free tier', () => {
    expect(hasFamilySubscription(createCurrentUserProfileResult())).toBe(false);
  });

  it('should return true for active family subscription', () => {
    const result = createCurrentUserProfileResult({
      family: {
        id: 'family_123',
        subscriptionTier: 'family',
        subscriptionExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      },
    });
    expect(hasFamilySubscription(result)).toBe(true);
  });

  it('should return false for expired family subscription', () => {
    const result = createCurrentUserProfileResult({
      family: {
        id: 'family_123',
        subscriptionTier: 'family',
        subscriptionExpiresAt: Date.now() - 1000,
      },
    });
    expect(hasFamilySubscription(result)).toBe(false);
  });
});

describe('getDaysUntilExpiration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null for null', () => {
    expect(getDaysUntilExpiration(null)).toBe(null);
  });

  it('should return null for free tier', () => {
    expect(getDaysUntilExpiration(createCurrentUserProfileResult())).toBe(null);
  });

  it('should return null for family tier without expiration', () => {
    const result = createCurrentUserProfileResult({
      family: {
        id: 'family_123',
        subscriptionTier: 'family',
      },
    });
    expect(getDaysUntilExpiration(result)).toBe(null);
  });

  it('should return 0 for expired subscription', () => {
    const result = createCurrentUserProfileResult({
      family: {
        id: 'family_123',
        subscriptionTier: 'family',
        subscriptionExpiresAt: Date.now() - 1000,
      },
    });
    expect(getDaysUntilExpiration(result)).toBe(0);
  });

  it('should return correct days for future expiration', () => {
    const result = createCurrentUserProfileResult({
      family: {
        id: 'family_123',
        subscriptionTier: 'family',
        subscriptionExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    });
    expect(getDaysUntilExpiration(result)).toBe(7);
  });

  it('should ceil partial days', () => {
    const result = createCurrentUserProfileResult({
      family: {
        id: 'family_123',
        subscriptionTier: 'family',
        subscriptionExpiresAt: Date.now() + 1.5 * 24 * 60 * 60 * 1000, // 1.5 days
      },
    });
    expect(getDaysUntilExpiration(result)).toBe(2);
  });
});

describe('getProfileGreeting', () => {
  it('should return generic greeting for null', () => {
    expect(getProfileGreeting(null)).toBe('Welcome!');
  });

  it('should return personalized greeting', () => {
    const result = createCurrentUserProfileResult({
      profile: {
        id: 'profile_123',
        displayName: 'Alice',
        profileType: 'child',
      },
    });
    expect(getProfileGreeting(result)).toBe('Hi, Alice!');
  });
});

describe('isEmailVerified', () => {
  it('should return false for null', () => {
    expect(isEmailVerified(null)).toBe(false);
  });

  it('should return true for verified email', () => {
    expect(isEmailVerified(createCurrentUserProfileResult())).toBe(true);
  });

  it('should return false for unverified email', () => {
    const result = createCurrentUserProfileResult({
      user: {
        id: 'user_123',
        email: 'test@example.com',
        emailVerified: false,
      },
    });
    expect(isEmailVerified(result)).toBe(false);
  });
});

describe('findProfileById', () => {
  it('should return undefined for null', () => {
    expect(findProfileById(null, 'any_id')).toBeUndefined();
  });

  it('should find profile by id', () => {
    const result = createParentResult();
    const found = findProfileById(result, 'profile_child1');
    expect(found).toBeDefined();
    expect(found?.displayName).toBe('Child One');
  });

  it('should return undefined for non-existent id', () => {
    const result = createParentResult();
    expect(findProfileById(result, 'non_existent')).toBeUndefined();
  });
});

describe('getParentProfileFromResult', () => {
  it('should return undefined for null', () => {
    expect(getParentProfileFromResult(null)).toBeUndefined();
  });

  it('should find parent profile', () => {
    const result = createParentResult();
    const parent = getParentProfileFromResult(result);
    expect(parent).toBeDefined();
    expect(parent?.profileType).toBe('parent');
  });

  it('should return undefined when no parent exists', () => {
    const result = createCurrentUserProfileResult();
    expect(getParentProfileFromResult(result)).toBeUndefined();
  });
});

describe('getChildProfilesFromResult', () => {
  it('should return empty array for null', () => {
    expect(getChildProfilesFromResult(null)).toEqual([]);
  });

  it('should return all child profiles', () => {
    const result = createParentResult();
    const children = getChildProfilesFromResult(result);
    expect(children).toHaveLength(2);
    expect(children.every((c) => c.profileType === 'child')).toBe(true);
  });

  it('should return empty array when only parent exists', () => {
    const result = createCurrentUserProfileResult({
      availableProfiles: [
        {
          id: 'profile_parent',
          displayName: 'Parent',
          profileType: 'parent',
        },
      ],
    });
    expect(getChildProfilesFromResult(result)).toEqual([]);
  });
});

describe('canAccessParentFeatures', () => {
  it('should return false for null', () => {
    expect(canAccessParentFeatures(null)).toBe(false);
  });

  it('should return true for parent profile', () => {
    expect(canAccessParentFeatures(createParentResult())).toBe(true);
  });

  it('should return false for child profile', () => {
    expect(canAccessParentFeatures(createChildResult())).toBe(false);
  });
});

describe('getSubscriptionStatusMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return empty string for null', () => {
    expect(getSubscriptionStatusMessage(null)).toBe('');
  });

  it("should return 'Free Plan' for free tier", () => {
    expect(getSubscriptionStatusMessage(createCurrentUserProfileResult())).toBe('Free Plan');
  });

  it("should return 'Family Plan' for family tier without expiration", () => {
    const result = createCurrentUserProfileResult({
      family: {
        id: 'family_123',
        subscriptionTier: 'family',
      },
    });
    expect(getSubscriptionStatusMessage(result)).toBe('Family Plan');
  });

  it("should return 'Family Plan' for family tier with distant expiration", () => {
    const result = createCurrentUserProfileResult({
      family: {
        id: 'family_123',
        subscriptionTier: 'family',
        subscriptionExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      },
    });
    expect(getSubscriptionStatusMessage(result)).toBe('Family Plan');
  });

  it('should show expiration warning for family tier expiring soon', () => {
    const result = createCurrentUserProfileResult({
      family: {
        id: 'family_123',
        subscriptionTier: 'family',
        subscriptionExpiresAt: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5 days
      },
    });
    expect(getSubscriptionStatusMessage(result)).toBe('Family Plan - Expires in 5 days');
  });

  it('should show expired for past expiration', () => {
    const result = createCurrentUserProfileResult({
      family: {
        id: 'family_123',
        subscriptionTier: 'family',
        subscriptionExpiresAt: Date.now() - 1000,
      },
    });
    expect(getSubscriptionStatusMessage(result)).toBe('Subscription Expired');
  });
});

describe('getHeaderStyle', () => {
  it("should return 'guest' for null", () => {
    expect(getHeaderStyle(null)).toBe('guest');
  });

  it("should return 'parent' for parent profile", () => {
    expect(getHeaderStyle(createParentResult())).toBe('parent');
  });

  it("should return 'child' for child profile", () => {
    expect(getHeaderStyle(createChildResult())).toBe('child');
  });
});

describe('needsOnboarding', () => {
  it('should return true for null', () => {
    expect(needsOnboarding(null)).toBe(true);
  });

  it('should return false for verified user with profiles', () => {
    expect(needsOnboarding(createCurrentUserProfileResult())).toBe(false);
  });

  it('should return true for unverified email', () => {
    const result = createCurrentUserProfileResult({
      user: {
        id: 'user_123',
        email: 'test@example.com',
        emailVerified: false,
      },
    });
    expect(needsOnboarding(result)).toBe(true);
  });

  it('should return true for no profiles', () => {
    const result = createCurrentUserProfileResult({
      availableProfiles: [],
    });
    expect(needsOnboarding(result)).toBe(true);
  });
});

// ============================================================================
// INTEGRATION: CURRENT USER PROFILE FLOW
// ============================================================================

describe('Integration: Current User Profile Flow', () => {
  it('should handle parent user viewing dashboard', () => {
    const result = createParentResult();

    // Parent can access parent features
    expect(hasParentAccess(result)).toBe(true);
    expect(canAccessParentFeatures(result)).toBe(true);
    expect(isChildView(result)).toBe(false);

    // Correct dashboard
    expect(getDashboardRoute(result)).toBe('/parent-dashboard');
    expect(getHeaderStyle(result)).toBe('parent');

    // Can switch to children
    expect(canSwitchProfiles(result)).toBe(true);
    const others = getOtherProfiles(result);
    expect(others).toHaveLength(2);
    expect(others.every((p) => p.profileType === 'child')).toBe(true);

    // Greeting
    expect(getProfileGreeting(result)).toBe('Hi, Parent User!');
  });

  it('should handle child user viewing dashboard', () => {
    const result = createChildResult();

    // Child cannot access parent features
    expect(hasParentAccess(result)).toBe(false);
    expect(canAccessParentFeatures(result)).toBe(false);
    expect(isChildView(result)).toBe(true);

    // Correct dashboard
    expect(getDashboardRoute(result)).toBe('/kid-dashboard');
    expect(getHeaderStyle(result)).toBe('child');

    // Can switch to parent
    expect(canSwitchProfiles(result)).toBe(true);
    const parent = getParentProfileFromResult(result);
    expect(parent).toBeDefined();
    expect(parent?.profileType).toBe('parent');

    // Greeting
    expect(getProfileGreeting(result)).toBe('Hi, Child One!');
  });

  it('should handle unauthenticated user', () => {
    const result = null;

    expect(hasParentAccess(result)).toBe(false);
    expect(isChildView(result)).toBe(false);
    expect(getDashboardRoute(result)).toBe('/login');
    expect(getHeaderStyle(result)).toBe('guest');
    expect(canSwitchProfiles(result)).toBe(false);
    expect(getProfileGreeting(result)).toBe('Welcome!');
    expect(needsOnboarding(result)).toBe(true);
  });

  it('should handle subscription status for different tiers', () => {
    // Free user
    const freeUser = createCurrentUserProfileResult();
    expect(hasFamilySubscription(freeUser)).toBe(false);
    expect(getSubscriptionStatusMessage(freeUser)).toBe('Free Plan');

    // Family user with active subscription
    const familyUser = createCurrentUserProfileResult({
      family: {
        id: 'family_123',
        subscriptionTier: 'family',
        subscriptionExpiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days
      },
    });
    expect(hasFamilySubscription(familyUser)).toBe(true);
    expect(isSubscriptionActive(familyUser)).toBe(true);
    expect(getSubscriptionStatusMessage(familyUser)).toBe('Family Plan');
  });
});

// ============================================================================
// PROFILE ACCESS VALIDATION HELPER TESTS
// ============================================================================

describe('isNotAuthenticated', () => {
  it('should return true for null', () => {
    expect(isNotAuthenticated(null)).toBe(true);
  });

  it('should return true for undefined', () => {
    expect(isNotAuthenticated(undefined)).toBe(true);
  });

  it('should return true for NOT_AUTHENTICATED error', () => {
    expect(isNotAuthenticated({ error: 'NOT_AUTHENTICATED' })).toBe(true);
  });

  it('should return false for other errors', () => {
    expect(isNotAuthenticated({ error: 'NOT_OWNER' })).toBe(false);
    expect(isNotAuthenticated({ error: 'PROFILE_NOT_FOUND' })).toBe(false);
    expect(isNotAuthenticated({ error: null })).toBe(false);
  });
});

describe('isUnauthorizedAccess', () => {
  it('should return true for null', () => {
    expect(isUnauthorizedAccess(null)).toBe(true);
  });

  it('should return true for undefined', () => {
    expect(isUnauthorizedAccess(undefined)).toBe(true);
  });

  it('should return true for authorized: false', () => {
    expect(isUnauthorizedAccess({ authorized: false })).toBe(true);
  });

  it('should return false for authorized: true', () => {
    expect(isUnauthorizedAccess({ authorized: true })).toBe(false);
  });

  it('should return true for NOT_OWNER error when no authorized field', () => {
    expect(isUnauthorizedAccess({ error: 'NOT_OWNER' })).toBe(true);
  });

  it('should return false for other errors when no authorized field', () => {
    expect(isUnauthorizedAccess({ error: 'PROFILE_NOT_FOUND' })).toBe(false);
  });
});

describe('isProfileNotFound', () => {
  it('should return false for null', () => {
    expect(isProfileNotFound(null)).toBe(false);
  });

  it('should return true for PROFILE_NOT_FOUND error', () => {
    expect(isProfileNotFound({ error: 'PROFILE_NOT_FOUND' })).toBe(true);
  });

  it('should return false for other errors', () => {
    expect(isProfileNotFound({ error: 'NOT_OWNER' })).toBe(false);
    expect(isProfileNotFound({ error: null })).toBe(false);
  });
});

describe('isFamilyNotFound', () => {
  it('should return false for null', () => {
    expect(isFamilyNotFound(null)).toBe(false);
  });

  it('should return true for FAMILY_NOT_FOUND error', () => {
    expect(isFamilyNotFound({ error: 'FAMILY_NOT_FOUND' })).toBe(true);
  });

  it('should return false for other errors', () => {
    expect(isFamilyNotFound({ error: 'NOT_OWNER' })).toBe(false);
    expect(isFamilyNotFound({ error: null })).toBe(false);
  });
});

describe('getProfileAccessErrorMessage', () => {
  it('should return appropriate message for NOT_AUTHENTICATED', () => {
    expect(getProfileAccessErrorMessage('NOT_AUTHENTICATED')).toBe('Please sign in to continue');
  });

  it('should return appropriate message for NO_EMAIL', () => {
    expect(getProfileAccessErrorMessage('NO_EMAIL')).toBe(
      'Your account has no email address associated'
    );
  });

  it('should return appropriate message for PROFILE_NOT_FOUND', () => {
    expect(getProfileAccessErrorMessage('PROFILE_NOT_FOUND')).toBe('Profile not found');
  });

  it('should return appropriate message for FAMILY_NOT_FOUND', () => {
    expect(getProfileAccessErrorMessage('FAMILY_NOT_FOUND')).toBe('Family account not found');
  });

  it('should return appropriate message for NOT_OWNER', () => {
    expect(getProfileAccessErrorMessage('NOT_OWNER')).toBe(
      'You do not have permission to access this profile'
    );
  });

  it('should return default message for null/undefined', () => {
    expect(getProfileAccessErrorMessage(null)).toBe('An error occurred');
    expect(getProfileAccessErrorMessage(undefined)).toBe('An error occurred');
  });
});

describe('getFamilyAccessErrorMessage', () => {
  it('should return appropriate message for NOT_AUTHENTICATED', () => {
    expect(getFamilyAccessErrorMessage('NOT_AUTHENTICATED')).toBe('Please sign in to continue');
  });

  it('should return appropriate message for NO_EMAIL', () => {
    expect(getFamilyAccessErrorMessage('NO_EMAIL')).toBe(
      'Your account has no email address associated'
    );
  });

  it('should return appropriate message for FAMILY_NOT_FOUND', () => {
    expect(getFamilyAccessErrorMessage('FAMILY_NOT_FOUND')).toBe('Family account not found');
  });

  it('should return appropriate message for NOT_OWNER', () => {
    expect(getFamilyAccessErrorMessage('NOT_OWNER')).toBe(
      'You do not have permission to access this family'
    );
  });

  it('should return default message for null/undefined', () => {
    expect(getFamilyAccessErrorMessage(null)).toBe('An error occurred');
    expect(getFamilyAccessErrorMessage(undefined)).toBe('An error occurred');
  });
});

describe('getProfileAccessAction', () => {
  it('should return redirect_login for NOT_AUTHENTICATED', () => {
    expect(getProfileAccessAction('NOT_AUTHENTICATED')).toBe('redirect_login');
  });

  it('should return redirect_home for NOT_OWNER', () => {
    expect(getProfileAccessAction('NOT_OWNER')).toBe('redirect_home');
  });

  it('should return show_error for NO_EMAIL', () => {
    expect(getProfileAccessAction('NO_EMAIL')).toBe('show_error');
  });

  it('should return show_error for PROFILE_NOT_FOUND', () => {
    expect(getProfileAccessAction('PROFILE_NOT_FOUND')).toBe('show_error');
  });

  it('should return show_error for FAMILY_NOT_FOUND', () => {
    expect(getProfileAccessAction('FAMILY_NOT_FOUND')).toBe('show_error');
  });

  it('should return none for null/undefined', () => {
    expect(getProfileAccessAction(null)).toBe('none');
    expect(getProfileAccessAction(undefined)).toBe('none');
  });
});

describe('isSecureMutationSuccess', () => {
  it('should return false for null', () => {
    expect(isSecureMutationSuccess(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isSecureMutationSuccess(undefined)).toBe(false);
  });

  it('should return true for success: true', () => {
    expect(isSecureMutationSuccess({ success: true })).toBe(true);
  });

  it('should return false for success: false', () => {
    expect(isSecureMutationSuccess({ success: false })).toBe(false);
  });

  it('should return false when success is undefined', () => {
    expect(isSecureMutationSuccess({})).toBe(false);
  });
});

describe('getSecureMutationErrors', () => {
  it('should return empty array for null', () => {
    expect(getSecureMutationErrors(null)).toEqual([]);
  });

  it('should return empty array for undefined errors', () => {
    expect(getSecureMutationErrors({})).toEqual([]);
  });

  it('should return errors array', () => {
    const errors = [
      { field: 'displayName', code: 'TOO_SHORT', message: 'Name too short' },
      { field: 'avatarUrl', code: 'INVALID_URL', message: 'Invalid URL' },
    ];
    expect(getSecureMutationErrors({ errors })).toEqual(errors);
  });
});

describe('getSecureMutationErrorMessages', () => {
  it('should return empty array for null', () => {
    expect(getSecureMutationErrorMessages(null)).toEqual([]);
  });

  it('should return empty array for undefined errors', () => {
    expect(getSecureMutationErrorMessages({})).toEqual([]);
  });

  it('should return message strings', () => {
    const errors = [
      { field: 'displayName', code: 'TOO_SHORT', message: 'Name too short' },
      { field: 'avatarUrl', code: 'INVALID_URL', message: 'Invalid URL' },
    ];
    expect(getSecureMutationErrorMessages({ errors })).toEqual(['Name too short', 'Invalid URL']);
  });
});

describe('isSecureMutationAuthError', () => {
  it('should return false for null', () => {
    expect(isSecureMutationAuthError(null)).toBe(false);
  });

  it('should return true for NOT_AUTHENTICATED', () => {
    expect(isSecureMutationAuthError({ error: 'NOT_AUTHENTICATED' })).toBe(true);
  });

  it('should return true for NO_EMAIL', () => {
    expect(isSecureMutationAuthError({ error: 'NO_EMAIL' })).toBe(true);
  });

  it('should return false for other errors', () => {
    expect(isSecureMutationAuthError({ error: 'NOT_OWNER' })).toBe(false);
    expect(isSecureMutationAuthError({ error: 'VALIDATION_ERROR' })).toBe(false);
    expect(isSecureMutationAuthError({ error: null })).toBe(false);
  });
});

describe('isSecureMutationOwnershipError', () => {
  it('should return false for null', () => {
    expect(isSecureMutationOwnershipError(null)).toBe(false);
  });

  it('should return true for NOT_OWNER', () => {
    expect(isSecureMutationOwnershipError({ error: 'NOT_OWNER' })).toBe(true);
  });

  it('should return false for other errors', () => {
    expect(isSecureMutationOwnershipError({ error: 'NOT_AUTHENTICATED' })).toBe(false);
    expect(isSecureMutationOwnershipError({ error: 'VALIDATION_ERROR' })).toBe(false);
    expect(isSecureMutationOwnershipError({ error: null })).toBe(false);
  });
});

// ============================================================================
// INTEGRATION: PROFILE ACCESS VALIDATION FLOW
// ============================================================================

describe('Integration: Profile Access Validation Flow', () => {
  it('should handle unauthorized access response correctly', () => {
    const unauthorizedResult = {
      authorized: false,
      error: 'NOT_OWNER' as const,
      message: 'You do not have permission to access this profile',
      profile: null,
    };

    // Detection
    expect(isUnauthorizedAccess(unauthorizedResult)).toBe(true);
    expect(isNotAuthenticated(unauthorizedResult)).toBe(false);
    expect(isProfileNotFound(unauthorizedResult)).toBe(false);

    // Action
    expect(getProfileAccessAction(unauthorizedResult.error)).toBe('redirect_home');

    // Error message
    expect(getProfileAccessErrorMessage(unauthorizedResult.error)).toBe(
      'You do not have permission to access this profile'
    );
  });

  it('should handle not authenticated response correctly', () => {
    const notAuthResult = {
      authorized: false,
      error: 'NOT_AUTHENTICATED' as const,
      message: 'You must be signed in to access this profile',
      profile: null,
    };

    // Detection
    expect(isNotAuthenticated(notAuthResult)).toBe(true);
    expect(isUnauthorizedAccess(notAuthResult)).toBe(true);

    // Action
    expect(getProfileAccessAction(notAuthResult.error)).toBe('redirect_login');

    // Error message
    expect(getProfileAccessErrorMessage(notAuthResult.error)).toBe('Please sign in to continue');
  });

  it('should handle profile not found response correctly', () => {
    const notFoundResult = {
      authorized: false,
      error: 'PROFILE_NOT_FOUND' as const,
      message: 'Profile not found',
      profile: null,
    };

    // Detection
    expect(isProfileNotFound(notFoundResult)).toBe(true);
    expect(isNotAuthenticated(notFoundResult)).toBe(false);

    // Action
    expect(getProfileAccessAction(notFoundResult.error)).toBe('show_error');

    // Error message
    expect(getProfileAccessErrorMessage(notFoundResult.error)).toBe('Profile not found');
  });

  it('should handle secure mutation validation errors correctly', () => {
    const validationResult = {
      success: false,
      error: 'VALIDATION_ERROR' as const,
      message: 'Validation failed',
      errors: [
        { field: 'displayName', code: 'TOO_SHORT', message: 'Display name too short' },
        { field: 'displayName', code: 'INAPPROPRIATE_CONTENT', message: 'Name contains bad words' },
      ],
    };

    // Detection
    expect(isSecureMutationSuccess(validationResult)).toBe(false);
    expect(isSecureMutationAuthError(validationResult)).toBe(false);
    expect(isSecureMutationOwnershipError(validationResult)).toBe(false);

    // Errors
    const errors = getSecureMutationErrors(validationResult);
    expect(errors).toHaveLength(2);

    const messages = getSecureMutationErrorMessages(validationResult);
    expect(messages).toContain('Display name too short');
    expect(messages).toContain('Name contains bad words');
  });

  it('should handle secure mutation success correctly', () => {
    const successResult = {
      success: true,
      error: null,
      message: 'Profile updated successfully',
    };

    // Detection
    expect(isSecureMutationSuccess(successResult)).toBe(true);
    expect(isSecureMutationAuthError(successResult)).toBe(false);
    expect(isSecureMutationOwnershipError(successResult)).toBe(false);

    // No errors
    expect(getSecureMutationErrors(successResult)).toEqual([]);
    expect(getSecureMutationErrorMessages(successResult)).toEqual([]);
  });

  it('should handle secure mutation auth error correctly', () => {
    const authErrorResult = {
      success: false,
      error: 'NOT_AUTHENTICATED' as const,
      message: 'You must be signed in',
    };

    // Detection
    expect(isSecureMutationSuccess(authErrorResult)).toBe(false);
    expect(isSecureMutationAuthError(authErrorResult)).toBe(true);
    expect(isSecureMutationOwnershipError(authErrorResult)).toBe(false);

    // Action
    expect(getProfileAccessAction(authErrorResult.error)).toBe('redirect_login');
  });

  it('should handle secure mutation ownership error correctly', () => {
    const ownershipErrorResult = {
      success: false,
      error: 'NOT_OWNER' as const,
      message: 'You do not have permission',
    };

    // Detection
    expect(isSecureMutationSuccess(ownershipErrorResult)).toBe(false);
    expect(isSecureMutationAuthError(ownershipErrorResult)).toBe(false);
    expect(isSecureMutationOwnershipError(ownershipErrorResult)).toBe(true);

    // Action
    expect(getProfileAccessAction(ownershipErrorResult.error)).toBe('redirect_home');
  });
});

// ============================================================================
// PROFILE BATCH UTILITIES TESTS
// ============================================================================

import {
  MAX_PROFILE_BATCH_SIZE,
  BatchProfileResult,
  buildProfileLookupMapFromResult,
  buildProfileLookupMap,
  getProfileName,
  getProfileFromMap,
  extractUniqueProfileIds,
  hasMissingProfiles,
  wasBatchTruncated,
  enrichWithProfileNames,
  chunkProfileIds,
  mergeBatchResults,
} from '../profiles';

describe('Profile Batch Constants', () => {
  it('should have MAX_PROFILE_BATCH_SIZE = 100', () => {
    expect(MAX_PROFILE_BATCH_SIZE).toBe(100);
  });
});

describe('buildProfileLookupMapFromResult', () => {
  it('should return empty map for null result', () => {
    const map = buildProfileLookupMapFromResult(null);
    expect(map.size).toBe(0);
  });

  it('should build map from batch result', () => {
    const result: BatchProfileResult = {
      profiles: {
        profile_1: {
          id: 'profile_1',
          familyId: 'family_1',
          displayName: 'Alice',
          avatarUrl: undefined,
          profileType: 'parent',
          xp: 100,
          level: 5,
        },
        profile_2: {
          id: 'profile_2',
          familyId: 'family_1',
          displayName: 'Bob',
          avatarUrl: 'https://example.com/bob.png',
          profileType: 'child',
          xp: 50,
          level: 2,
        },
      },
      stats: {
        requested: 2,
        unique: 2,
        found: 2,
        missing: 0,
        truncated: false,
      },
    };

    const map = buildProfileLookupMapFromResult(result);

    expect(map.size).toBe(2);
    expect(map.get('profile_1')).toEqual({
      id: 'profile_1',
      displayName: 'Alice',
      avatarUrl: undefined,
      profileType: 'parent',
    });
    expect(map.get('profile_2')).toEqual({
      id: 'profile_2',
      displayName: 'Bob',
      avatarUrl: 'https://example.com/bob.png',
      profileType: 'child',
    });
  });

  it('should handle empty profiles object', () => {
    const result: BatchProfileResult = {
      profiles: {},
      stats: {
        requested: 0,
        unique: 0,
        found: 0,
        missing: 0,
        truncated: false,
      },
    };

    const map = buildProfileLookupMapFromResult(result);
    expect(map.size).toBe(0);
  });
});

describe('buildProfileLookupMap', () => {
  it('should build map from profile array', () => {
    const profiles = [
      { _id: 'p1', displayName: 'Alice', profileType: 'parent' as const },
      { _id: 'p2', displayName: 'Bob', avatarUrl: 'url', profileType: 'child' as const },
    ];

    const map = buildProfileLookupMap(profiles);

    expect(map.size).toBe(2);
    expect(map.get('p1')).toEqual({
      id: 'p1',
      displayName: 'Alice',
      avatarUrl: undefined,
      profileType: 'parent',
    });
    expect(map.get('p2')).toEqual({
      id: 'p2',
      displayName: 'Bob',
      avatarUrl: 'url',
      profileType: 'child',
    });
  });

  it('should handle empty array', () => {
    const map = buildProfileLookupMap([]);
    expect(map.size).toBe(0);
  });
});

describe('getProfileName', () => {
  const testMap = new Map([
    [
      'p1',
      { id: 'p1', displayName: 'Alice', avatarUrl: undefined, profileType: 'parent' as const },
    ],
    ['p2', { id: 'p2', displayName: 'Bob', avatarUrl: undefined, profileType: 'child' as const }],
  ]);

  it('should return profile name for valid ID', () => {
    expect(getProfileName(testMap, 'p1')).toBe('Alice');
    expect(getProfileName(testMap, 'p2')).toBe('Bob');
  });

  it('should return Unknown for missing ID', () => {
    expect(getProfileName(testMap, 'nonexistent')).toBe('Unknown');
  });

  it('should return Unknown for empty map', () => {
    expect(getProfileName(new Map(), 'any')).toBe('Unknown');
  });
});

describe('getProfileFromMap', () => {
  const testMap = new Map([
    [
      'p1',
      { id: 'p1', displayName: 'Alice', avatarUrl: undefined, profileType: 'parent' as const },
    ],
  ]);

  it('should return profile for valid ID', () => {
    const profile = getProfileFromMap(testMap, 'p1');
    expect(profile).toEqual({
      id: 'p1',
      displayName: 'Alice',
      avatarUrl: undefined,
      profileType: 'parent',
    });
  });

  it('should return undefined for missing ID', () => {
    expect(getProfileFromMap(testMap, 'nonexistent')).toBeUndefined();
  });
});

describe('extractUniqueProfileIds', () => {
  it('should extract unique profile IDs', () => {
    const items = [
      { profileId: 'p1', data: 'a' },
      { profileId: 'p2', data: 'b' },
      { profileId: 'p1', data: 'c' },
      { profileId: 'p3', data: 'd' },
      { profileId: 'p2', data: 'e' },
    ];

    const ids = extractUniqueProfileIds(items);
    expect(ids).toHaveLength(3);
    expect(ids).toContain('p1');
    expect(ids).toContain('p2');
    expect(ids).toContain('p3');
  });

  it('should return empty array for empty input', () => {
    expect(extractUniqueProfileIds([])).toEqual([]);
  });

  it('should handle single item', () => {
    expect(extractUniqueProfileIds([{ profileId: 'p1' }])).toEqual(['p1']);
  });
});

describe('hasMissingProfiles', () => {
  it('should return true for null result', () => {
    expect(hasMissingProfiles(null)).toBe(true);
  });

  it('should return false when no profiles missing', () => {
    const result: BatchProfileResult = {
      profiles: {},
      stats: { requested: 2, unique: 2, found: 2, missing: 0, truncated: false },
    };
    expect(hasMissingProfiles(result)).toBe(false);
  });

  it('should return true when profiles are missing', () => {
    const result: BatchProfileResult = {
      profiles: {},
      stats: { requested: 3, unique: 3, found: 2, missing: 1, truncated: false },
    };
    expect(hasMissingProfiles(result)).toBe(true);
  });
});

describe('wasBatchTruncated', () => {
  it('should return false for null result', () => {
    expect(wasBatchTruncated(null)).toBe(false);
  });

  it('should return false when not truncated', () => {
    const result: BatchProfileResult = {
      profiles: {},
      stats: { requested: 50, unique: 50, found: 50, missing: 0, truncated: false },
    };
    expect(wasBatchTruncated(result)).toBe(false);
  });

  it('should return true when truncated', () => {
    const result: BatchProfileResult = {
      profiles: {},
      stats: { requested: 150, unique: 100, found: 100, missing: 0, truncated: true },
    };
    expect(wasBatchTruncated(result)).toBe(true);
  });
});

describe('enrichWithProfileNames', () => {
  const testMap = new Map([
    [
      'p1',
      { id: 'p1', displayName: 'Alice', avatarUrl: undefined, profileType: 'parent' as const },
    ],
    ['p2', { id: 'p2', displayName: 'Bob', avatarUrl: undefined, profileType: 'child' as const }],
  ]);

  it('should add profile names to items', () => {
    const items = [
      { profileId: 'p1', action: 'add' },
      { profileId: 'p2', action: 'remove' },
    ];

    const enriched = enrichWithProfileNames(items, testMap);

    expect(enriched).toHaveLength(2);
    expect(enriched[0]).toEqual({ profileId: 'p1', action: 'add', profileName: 'Alice' });
    expect(enriched[1]).toEqual({ profileId: 'p2', action: 'remove', profileName: 'Bob' });
  });

  it('should use Unknown for missing profiles', () => {
    const items = [{ profileId: 'nonexistent', action: 'test' }];

    const enriched = enrichWithProfileNames(items, testMap);

    expect(enriched[0].profileName).toBe('Unknown');
  });

  it('should handle empty items array', () => {
    expect(enrichWithProfileNames([], testMap)).toEqual([]);
  });
});

describe('chunkProfileIds', () => {
  it('should chunk array into batches', () => {
    const ids = ['p1', 'p2', 'p3', 'p4', 'p5'];
    const chunks = chunkProfileIds(ids, 2);

    expect(chunks).toEqual([['p1', 'p2'], ['p3', 'p4'], ['p5']]);
  });

  it('should return single chunk when under batch size', () => {
    const ids = ['p1', 'p2', 'p3'];
    const chunks = chunkProfileIds(ids, 5);

    expect(chunks).toEqual([['p1', 'p2', 'p3']]);
  });

  it('should return empty array for empty input', () => {
    expect(chunkProfileIds([])).toEqual([]);
  });

  it('should use MAX_PROFILE_BATCH_SIZE as default', () => {
    const ids = Array.from({ length: 150 }, (_, i) => `p${i}`);
    const chunks = chunkProfileIds(ids);

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(100);
    expect(chunks[1]).toHaveLength(50);
  });
});

describe('mergeBatchResults', () => {
  it('should merge multiple batch results', () => {
    const result1: BatchProfileResult = {
      profiles: {
        p1: {
          id: 'p1',
          familyId: 'f1',
          displayName: 'Alice',
          avatarUrl: undefined,
          profileType: 'parent',
          xp: 100,
          level: 5,
        },
      },
      stats: { requested: 1, unique: 1, found: 1, missing: 0, truncated: false },
    };

    const result2: BatchProfileResult = {
      profiles: {
        p2: {
          id: 'p2',
          familyId: 'f1',
          displayName: 'Bob',
          avatarUrl: undefined,
          profileType: 'child',
          xp: 50,
          level: 2,
        },
      },
      stats: { requested: 1, unique: 1, found: 1, missing: 0, truncated: false },
    };

    const merged = mergeBatchResults([result1, result2]);

    expect(merged.size).toBe(2);
    expect(merged.get('p1')?.displayName).toBe('Alice');
    expect(merged.get('p2')?.displayName).toBe('Bob');
  });

  it('should handle null results in array', () => {
    const result1: BatchProfileResult = {
      profiles: {
        p1: {
          id: 'p1',
          familyId: 'f1',
          displayName: 'Alice',
          avatarUrl: undefined,
          profileType: 'parent',
          xp: 100,
          level: 5,
        },
      },
      stats: { requested: 1, unique: 1, found: 1, missing: 0, truncated: false },
    };

    const merged = mergeBatchResults([result1, null, null]);

    expect(merged.size).toBe(1);
    expect(merged.get('p1')?.displayName).toBe('Alice');
  });

  it('should return empty map for all null results', () => {
    const merged = mergeBatchResults([null, null]);
    expect(merged.size).toBe(0);
  });

  it('should return empty map for empty array', () => {
    const merged = mergeBatchResults([]);
    expect(merged.size).toBe(0);
  });

  it('should overwrite duplicate IDs with later values', () => {
    const result1: BatchProfileResult = {
      profiles: {
        p1: {
          id: 'p1',
          familyId: 'f1',
          displayName: 'Alice v1',
          avatarUrl: undefined,
          profileType: 'parent',
          xp: 100,
          level: 5,
        },
      },
      stats: { requested: 1, unique: 1, found: 1, missing: 0, truncated: false },
    };

    const result2: BatchProfileResult = {
      profiles: {
        p1: {
          id: 'p1',
          familyId: 'f1',
          displayName: 'Alice v2',
          avatarUrl: undefined,
          profileType: 'parent',
          xp: 200,
          level: 10,
        },
      },
      stats: { requested: 1, unique: 1, found: 1, missing: 0, truncated: false },
    };

    const merged = mergeBatchResults([result1, result2]);

    expect(merged.size).toBe(1);
    expect(merged.get('p1')?.displayName).toBe('Alice v2');
  });
});
