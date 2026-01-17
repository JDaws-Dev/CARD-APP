import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { Id } from './_generated/dataModel';

// ============================================================================
// QUERIES
// ============================================================================

export const getProfile = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.profileId);
  },
});

export const getProfilesByFamily = query({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();
  },
});

export const getFamily = query({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.familyId);
  },
});

export const getFamilyByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('families')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase()))
      .first();
  },
});

/**
 * Batch fetch multiple profiles by their IDs.
 * Returns a map of profileId -> profile data for O(1) lookups.
 *
 * Use this for:
 * - Enriching activity logs with profile names
 * - Building leaderboards across profiles
 * - Any scenario where you need multiple profiles at once
 *
 * @param profileIds - Array of profile IDs to fetch (max 100)
 * @returns Object with profiles map and stats about found/missing profiles
 */
export const getProfilesByIds = query({
  args: {
    profileIds: v.array(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    // Limit to 100 profiles to prevent excessive memory usage
    const MAX_BATCH_SIZE = 100;
    const profileIds = args.profileIds.slice(0, MAX_BATCH_SIZE);

    // Deduplicate profile IDs
    const uniqueProfileIds = [...new Set(profileIds)];

    // Fetch all profiles in parallel using Promise.all
    const profilePromises = uniqueProfileIds.map((profileId) => ctx.db.get(profileId));

    const profileResults = await Promise.all(profilePromises);

    // Build result map and track stats
    const profiles: Record<
      string,
      {
        id: string;
        familyId: string;
        displayName: string;
        avatarUrl: string | undefined;
        profileType: 'parent' | 'child' | undefined;
        xp: number | undefined;
        level: number | undefined;
      }
    > = {};

    let foundCount = 0;
    let missingCount = 0;

    for (let i = 0; i < uniqueProfileIds.length; i++) {
      const profileId = uniqueProfileIds[i];
      const profile = profileResults[i];

      if (profile) {
        profiles[profileId] = {
          id: profileId,
          familyId: profile.familyId,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          profileType: profile.profileType,
          xp: profile.xp,
          level: profile.level,
        };
        foundCount++;
      } else {
        missingCount++;
      }
    }

    return {
      profiles,
      stats: {
        requested: args.profileIds.length,
        unique: uniqueProfileIds.length,
        found: foundCount,
        missing: missingCount,
        truncated: args.profileIds.length > MAX_BATCH_SIZE,
      },
    };
  },
});

/**
 * Helper type for profile lookup map (used internally).
 * Maps profile ID -> profile summary data.
 */
export type ProfileLookupMap = Record<
  string,
  {
    id: string;
    familyId: string;
    displayName: string;
    avatarUrl: string | undefined;
    profileType: 'parent' | 'child' | undefined;
  }
>;

/**
 * Build a profile lookup map from an array of profiles.
 * Converts O(n) find() operations to O(1) map lookups.
 *
 * @param profiles - Array of profile documents
 * @returns Map of profileId -> profile summary
 */
export function buildProfileLookupMap(
  profiles: Array<{
    _id: { toString(): string };
    familyId: { toString(): string };
    displayName: string;
    avatarUrl?: string;
    profileType?: 'parent' | 'child';
  }>
): ProfileLookupMap {
  const map: ProfileLookupMap = {};
  for (const profile of profiles) {
    const id = profile._id.toString();
    map[id] = {
      id,
      familyId: profile.familyId.toString(),
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      profileType: profile.profileType,
    };
  }
  return map;
}

// ============================================================================
// AUTHENTICATED USER QUERIES
// ============================================================================

/**
 * Get the current authenticated user's profile with type information.
 * Returns the profile data for header/dashboard routing based on role.
 *
 * If the user has multiple profiles (e.g., family account), you can optionally
 * specify which profile to return using the profileId parameter.
 *
 * Returns null if:
 * - User is not authenticated
 * - User's email has no associated family
 * - Family has no profiles
 */
export const getCurrentUserProfile = query({
  args: {
    profileId: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    // Get the user's email from the users table
    const user = await ctx.db.get(userId);
    if (!user || !user.email) {
      return null;
    }

    // Find the family associated with this email
    const family = await ctx.db
      .query('families')
      .withIndex('by_email', (q) => q.eq('email', user.email!.toLowerCase()))
      .first();

    if (!family) {
      return null;
    }

    // Get all profiles for this family
    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', family._id))
      .collect();

    if (profiles.length === 0) {
      return null;
    }

    // If a specific profile is requested, validate it belongs to this family
    let currentProfile;
    if (args.profileId) {
      currentProfile = profiles.find((p) => p._id === args.profileId);
      if (!currentProfile) {
        // Profile doesn't belong to this family
        return null;
      }
    } else {
      // Return the first profile (parent first if exists, otherwise first child)
      const parentProfile = profiles.find((p) => p.profileType === 'parent');
      currentProfile = parentProfile ?? profiles[0];
    }

    return {
      // Current profile info for routing
      profile: {
        id: currentProfile._id,
        displayName: currentProfile.displayName,
        avatarUrl: currentProfile.avatarUrl,
        profileType: currentProfile.profileType,
      },
      // Family info
      family: {
        id: family._id,
        subscriptionTier: family.subscriptionTier,
        subscriptionExpiresAt: family.subscriptionExpiresAt,
      },
      // All available profiles for profile switching
      availableProfiles: profiles.map((p) => ({
        id: p._id,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        profileType: p.profileType,
      })),
      // User authentication info
      user: {
        id: userId,
        email: user.email,
        emailVerified: !!user.emailVerificationTime,
      },
    };
  },
});

/**
 * Check if the current user is authenticated.
 * Lightweight query for auth state checks.
 */
export const isUserAuthenticated = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return {
      isAuthenticated: !!userId,
      userId: userId ?? null,
    };
  },
});

/**
 * Get all profiles available to the current authenticated user.
 * Useful for profile switching in the UI.
 */
export const getCurrentUserProfiles = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { profiles: [], family: null };
    }

    const user = await ctx.db.get(userId);
    if (!user || !user.email) {
      return { profiles: [], family: null };
    }

    const family = await ctx.db
      .query('families')
      .withIndex('by_email', (q) => q.eq('email', user.email!.toLowerCase()))
      .first();

    if (!family) {
      return { profiles: [], family: null };
    }

    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', family._id))
      .collect();

    // Sort: parent first, then children alphabetically
    const sortedProfiles = [...profiles].sort((a, b) => {
      if (a.profileType === 'parent' && b.profileType !== 'parent') return -1;
      if (b.profileType === 'parent' && a.profileType !== 'parent') return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    return {
      profiles: sortedProfiles.map((p) => ({
        id: p._id,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
        profileType: p.profileType,
      })),
      family: {
        id: family._id,
        subscriptionTier: family.subscriptionTier,
        subscriptionExpiresAt: family.subscriptionExpiresAt,
      },
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

export const createFamily = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if family already exists
    const existing = await ctx.db
      .query('families')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase()))
      .first();

    if (existing) {
      throw new Error('A family with this email already exists');
    }

    return await ctx.db.insert('families', {
      email: args.email.toLowerCase(),
      subscriptionTier: 'free',
    });
  },
});

export const createProfile = mutation({
  args: {
    familyId: v.id('families'),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    profileType: v.union(v.literal('parent'), v.literal('child')),
  },
  handler: async (ctx, args) => {
    // Check profile limit (max 4 per family)
    const existingProfiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();

    if (existingProfiles.length >= 4) {
      throw new Error('Maximum of 4 profiles per family');
    }

    // Validate: only one parent profile per family
    if (args.profileType === 'parent') {
      const existingParent = existingProfiles.find((p) => p.profileType === 'parent');
      if (existingParent) {
        throw new Error('Only one parent profile allowed per family');
      }
    }

    return await ctx.db.insert('profiles', {
      familyId: args.familyId,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      profileType: args.profileType,
    });
  },
});

export const updateProfile = mutation({
  args: {
    profileId: v.id('profiles'),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    profileType: v.optional(v.union(v.literal('parent'), v.literal('child'))),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const updates: {
      displayName?: string;
      avatarUrl?: string;
      profileType?: 'parent' | 'child';
    } = {};

    if (args.displayName !== undefined) {
      updates.displayName = args.displayName;
    }
    if (args.avatarUrl !== undefined) {
      updates.avatarUrl = args.avatarUrl;
    }
    if (args.profileType !== undefined) {
      // Validate: only one parent profile per family
      if (args.profileType === 'parent' && profile.profileType !== 'parent') {
        const existingProfiles = await ctx.db
          .query('profiles')
          .withIndex('by_family', (q) => q.eq('familyId', profile.familyId))
          .collect();

        const existingParent = existingProfiles.find(
          (p) => p.profileType === 'parent' && p._id !== args.profileId
        );
        if (existingParent) {
          throw new Error('Only one parent profile allowed per family');
        }
      }
      updates.profileType = args.profileType;
    }

    await ctx.db.patch(args.profileId, updates);
  },
});

export const deleteProfile = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Delete all related data first
    const collections = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    for (const card of collections) {
      await ctx.db.delete(card._id);
    }

    const wishlist = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    for (const card of wishlist) {
      await ctx.db.delete(card._id);
    }

    const achievements = await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    for (const achievement of achievements) {
      await ctx.db.delete(achievement._id);
    }

    const shares = await ctx.db
      .query('wishlistShares')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    for (const share of shares) {
      await ctx.db.delete(share._id);
    }

    // Finally delete the profile
    await ctx.db.delete(args.profileId);
  },
});

export const updateSubscription = mutation({
  args: {
    familyId: v.id('families'),
    tier: v.union(v.literal('free'), v.literal('family')),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.familyId, {
      subscriptionTier: args.tier,
      subscriptionExpiresAt: args.expiresAt,
    });
  },
});

// ============================================================================
// CHILD PROFILE CREATION WITH VALIDATION
// ============================================================================

/**
 * Display name validation constants
 */
const MIN_DISPLAY_NAME_LENGTH = 1;
const MAX_DISPLAY_NAME_LENGTH = 30;

/**
 * Profile limit constants
 */
const FREE_TIER_MAX_CHILD_PROFILES = 1;
const FAMILY_TIER_MAX_CHILD_PROFILES = 3;
const MAX_PARENT_PROFILES = 1;
const MAX_TOTAL_PROFILES = 4;

/**
 * Blocked words/phrases for display names (kid-safety)
 */
const BLOCKED_NAME_PATTERNS: RegExp[] = [
  /\b(ass|butt|crap|damn|hell|piss|poop|fart)\b/i,
  /\b(f+u+c+k|s+h+i+t|b+i+t+c+h)\b/i,
  /\b(hate|kill|die|dead)\b/i,
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Email addresses
];

/**
 * Allowed characters regex for display names
 */
const ALLOWED_NAME_CHARS_REGEX = /^[\p{L}\p{N}\s\-']+$/u;

interface ValidationError {
  field: string;
  code: string;
  message: string;
}

interface ProfileCountsInternal {
  parent: number;
  child: number;
  total: number;
}

/**
 * Validate display name
 */
function validateDisplayNameInternal(name: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const trimmed = name.trim();

  // Check empty/whitespace
  if (trimmed.length === 0) {
    errors.push({
      field: 'displayName',
      code: 'REQUIRED',
      message: 'Display name is required',
    });
    return errors;
  }

  // Check length
  if (trimmed.length < MIN_DISPLAY_NAME_LENGTH) {
    errors.push({
      field: 'displayName',
      code: 'TOO_SHORT',
      message: `Display name must be at least ${MIN_DISPLAY_NAME_LENGTH} character`,
    });
  }

  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    errors.push({
      field: 'displayName',
      code: 'TOO_LONG',
      message: `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or less`,
    });
  }

  // Check allowed characters
  if (!ALLOWED_NAME_CHARS_REGEX.test(trimmed)) {
    errors.push({
      field: 'displayName',
      code: 'INVALID_CHARS',
      message: 'Display name can only contain letters, numbers, spaces, hyphens, and apostrophes',
    });
  }

  // Check excessive spaces
  if (/\s{3,}/.test(name)) {
    errors.push({
      field: 'displayName',
      code: 'EXCESSIVE_SPACES',
      message: 'Display name cannot have more than 2 consecutive spaces',
    });
  }

  // Check blocked content
  if (BLOCKED_NAME_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    errors.push({
      field: 'displayName',
      code: 'INAPPROPRIATE_CONTENT',
      message: 'Display name contains inappropriate content',
    });
  }

  return errors;
}

/**
 * Validate avatar URL
 */
function validateAvatarUrlInternal(url: string | undefined): ValidationError[] {
  const errors: ValidationError[] = [];

  if (url === undefined || url === '') {
    return errors; // Avatar is optional
  }

  // Check URL format
  let isValid = false;
  try {
    const parsed = new URL(url);
    isValid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    isValid = url.startsWith('/'); // Allow relative paths
  }

  if (!isValid) {
    errors.push({
      field: 'avatarUrl',
      code: 'INVALID_URL',
      message: 'Avatar URL must be a valid URL or path',
    });
  }

  return errors;
}

/**
 * Count profiles by type
 */
function countProfilesInternal(
  profiles: Array<{ profileType?: 'parent' | 'child' }>
): ProfileCountsInternal {
  let parent = 0;
  let child = 0;

  for (const profile of profiles) {
    if (profile.profileType === 'parent') {
      parent++;
    } else {
      child++;
    }
  }

  return { parent, child, total: parent + child };
}

/**
 * Get max child profiles for tier
 */
function getMaxChildProfilesInternal(tier: 'free' | 'family'): number {
  return tier === 'family' ? FAMILY_TIER_MAX_CHILD_PROFILES : FREE_TIER_MAX_CHILD_PROFILES;
}

/**
 * Get max total profiles for tier
 */
function getMaxTotalProfilesInternal(tier: 'free' | 'family'): number {
  if (tier === 'family') {
    return MAX_TOTAL_PROFILES;
  }
  return MAX_PARENT_PROFILES + FREE_TIER_MAX_CHILD_PROFILES;
}

/**
 * Query to check if a child profile can be created
 */
export const canCreateChildProfile = query({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    const family = await ctx.db.get(args.familyId);
    if (!family) {
      return {
        allowed: false,
        reason: 'Family not found',
        upgradeRequired: false,
      };
    }

    // Get effective tier (falls back to free if expired)
    let effectiveTier: 'free' | 'family' = family.subscriptionTier;
    if (
      family.subscriptionTier === 'family' &&
      family.subscriptionExpiresAt &&
      family.subscriptionExpiresAt <= Date.now()
    ) {
      effectiveTier = 'free';
    }

    const existingProfiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();

    const counts = countProfilesInternal(existingProfiles);
    const maxChildProfiles = getMaxChildProfilesInternal(effectiveTier);
    const maxTotalProfiles = getMaxTotalProfilesInternal(effectiveTier);

    // Check total limit first
    if (counts.total >= maxTotalProfiles) {
      return {
        allowed: false,
        reason: `Maximum of ${maxTotalProfiles} profiles reached`,
        upgradeRequired: false,
        currentCounts: counts,
        limits: { maxChildProfiles, maxTotalProfiles },
      };
    }

    // Check child limit
    if (counts.child >= maxChildProfiles) {
      const canUpgrade = effectiveTier === 'free';
      return {
        allowed: false,
        reason: canUpgrade
          ? `Free plan is limited to ${maxChildProfiles} child profile. Upgrade to Family Plan for up to ${FAMILY_TIER_MAX_CHILD_PROFILES} child profiles.`
          : `Maximum of ${maxChildProfiles} child profiles reached`,
        upgradeRequired: canUpgrade,
        currentCounts: counts,
        limits: { maxChildProfiles, maxTotalProfiles },
      };
    }

    return {
      allowed: true,
      upgradeRequired: false,
      currentCounts: counts,
      limits: { maxChildProfiles, maxTotalProfiles },
      childProfilesRemaining: maxChildProfiles - counts.child,
    };
  },
});

/**
 * Query to validate a child profile display name
 */
export const validateChildProfileName = query({
  args: {
    familyId: v.id('families'),
    displayName: v.string(),
    excludeProfileId: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    const errors: ValidationError[] = [];

    // Validate display name format
    const nameErrors = validateDisplayNameInternal(args.displayName);
    errors.push(...nameErrors);

    // If format is valid, check uniqueness
    if (nameErrors.length === 0) {
      const existingProfiles = await ctx.db
        .query('profiles')
        .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
        .collect();

      const normalizedName = args.displayName.trim().toLowerCase();
      const isDuplicate = existingProfiles.some(
        (p) =>
          p.displayName.trim().toLowerCase() === normalizedName &&
          (!args.excludeProfileId || p._id !== args.excludeProfileId)
      );

      if (isDuplicate) {
        errors.push({
          field: 'displayName',
          code: 'DUPLICATE_NAME',
          message: 'A profile with this name already exists in your family',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedName: args.displayName.trim().replace(/\s+/g, ' '),
    };
  },
});

/**
 * Create a child profile with comprehensive validation.
 * Validates:
 * - Display name (length, characters, inappropriate content, uniqueness)
 * - Avatar URL (format)
 * - Profile limits (tier-based)
 */
export const createChildProfileValidated = mutation({
  args: {
    familyId: v.id('families'),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const errors: ValidationError[] = [];

    // Get family
    const family = await ctx.db.get(args.familyId);
    if (!family) {
      throw new Error('Family not found');
    }

    // Get effective tier
    let effectiveTier: 'free' | 'family' = family.subscriptionTier;
    if (
      family.subscriptionTier === 'family' &&
      family.subscriptionExpiresAt &&
      family.subscriptionExpiresAt <= Date.now()
    ) {
      effectiveTier = 'free';
    }

    // Validate display name
    const nameErrors = validateDisplayNameInternal(args.displayName);
    errors.push(...nameErrors);

    // Validate avatar URL
    const avatarErrors = validateAvatarUrlInternal(args.avatarUrl);
    errors.push(...avatarErrors);

    // Get existing profiles
    const existingProfiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();

    // Check name uniqueness (only if name is valid)
    if (nameErrors.length === 0) {
      const normalizedName = args.displayName.trim().toLowerCase();
      const isDuplicate = existingProfiles.some(
        (p) => p.displayName.trim().toLowerCase() === normalizedName
      );

      if (isDuplicate) {
        errors.push({
          field: 'displayName',
          code: 'DUPLICATE_NAME',
          message: 'A profile with this name already exists in your family',
        });
      }
    }

    // Check profile limits
    const counts = countProfilesInternal(existingProfiles);
    const maxChildProfiles = getMaxChildProfilesInternal(effectiveTier);
    const maxTotalProfiles = getMaxTotalProfilesInternal(effectiveTier);

    if (counts.total >= maxTotalProfiles) {
      errors.push({
        field: 'profile',
        code: 'LIMIT_REACHED',
        message: `Maximum of ${maxTotalProfiles} profiles reached`,
      });
    } else if (counts.child >= maxChildProfiles) {
      const canUpgrade = effectiveTier === 'free';
      errors.push({
        field: 'profile',
        code: canUpgrade ? 'UPGRADE_REQUIRED' : 'LIMIT_REACHED',
        message: canUpgrade
          ? `Free plan is limited to ${maxChildProfiles} child profile. Upgrade to Family Plan for up to ${FAMILY_TIER_MAX_CHILD_PROFILES} child profiles.`
          : `Maximum of ${maxChildProfiles} child profiles reached`,
      });
    }

    // If there are errors, return them without creating the profile
    if (errors.length > 0) {
      return {
        success: false,
        errors,
        profileId: null,
        upgradeRequired: errors.some((e) => e.code === 'UPGRADE_REQUIRED'),
      };
    }

    // Sanitize inputs
    const sanitizedName = args.displayName.trim().replace(/\s+/g, ' ');
    const sanitizedAvatarUrl = args.avatarUrl?.trim() || undefined;

    // Create the profile
    const profileId = await ctx.db.insert('profiles', {
      familyId: args.familyId,
      displayName: sanitizedName,
      avatarUrl: sanitizedAvatarUrl,
      profileType: 'child',
    });

    return {
      success: true,
      errors: [],
      profileId,
      upgradeRequired: false,
      childProfileCount: counts.child + 1,
      maxChildProfiles,
    };
  },
});

/**
 * Update a child profile with validation.
 */
export const updateChildProfileValidated = mutation({
  args: {
    profileId: v.id('profiles'),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const errors: ValidationError[] = [];

    // Get profile
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Validate display name if provided
    if (args.displayName !== undefined) {
      const nameErrors = validateDisplayNameInternal(args.displayName);
      errors.push(...nameErrors);

      // Check uniqueness (excluding current profile)
      if (nameErrors.length === 0) {
        const existingProfiles = await ctx.db
          .query('profiles')
          .withIndex('by_family', (q) => q.eq('familyId', profile.familyId))
          .collect();

        const normalizedName = args.displayName.trim().toLowerCase();
        const isDuplicate = existingProfiles.some(
          (p) => p.displayName.trim().toLowerCase() === normalizedName && p._id !== args.profileId
        );

        if (isDuplicate) {
          errors.push({
            field: 'displayName',
            code: 'DUPLICATE_NAME',
            message: 'A profile with this name already exists in your family',
          });
        }
      }
    }

    // Validate avatar URL if provided
    if (args.avatarUrl !== undefined) {
      const avatarErrors = validateAvatarUrlInternal(args.avatarUrl);
      errors.push(...avatarErrors);
    }

    // If there are errors, return them without updating
    if (errors.length > 0) {
      return {
        success: false,
        errors,
      };
    }

    // Build updates
    const updates: { displayName?: string; avatarUrl?: string } = {};

    if (args.displayName !== undefined) {
      updates.displayName = args.displayName.trim().replace(/\s+/g, ' ');
    }

    if (args.avatarUrl !== undefined) {
      updates.avatarUrl = args.avatarUrl.trim() || undefined;
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.profileId, updates);
    }

    return {
      success: true,
      errors: [],
    };
  },
});

/**
 * Get profile limits and remaining slots for a family
 */
export const getProfileLimits = query({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    const family = await ctx.db.get(args.familyId);
    if (!family) {
      return null;
    }

    // Get effective tier
    let effectiveTier: 'free' | 'family' = family.subscriptionTier;
    if (
      family.subscriptionTier === 'family' &&
      family.subscriptionExpiresAt &&
      family.subscriptionExpiresAt <= Date.now()
    ) {
      effectiveTier = 'free';
    }

    const existingProfiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();

    const counts = countProfilesInternal(existingProfiles);
    const maxChildProfiles = getMaxChildProfilesInternal(effectiveTier);
    const maxTotalProfiles = getMaxTotalProfilesInternal(effectiveTier);

    const childRemaining = Math.max(0, maxChildProfiles - counts.child);
    const totalRemaining = Math.max(0, maxTotalProfiles - counts.total);

    // Can add child if both limits allow
    const canAddChild = childRemaining > 0 && totalRemaining > 0;
    const canAddParent = counts.parent < MAX_PARENT_PROFILES && totalRemaining > 0;

    // Build message
    let message: string;
    if (childRemaining === 0) {
      if (effectiveTier === 'free') {
        message = "You've reached the child profile limit on the Free plan. Upgrade for more!";
      } else {
        message = "You've reached the maximum child profiles for your account.";
      }
    } else if (childRemaining === 1) {
      message = 'You can add 1 more child profile.';
    } else {
      message = `You can add ${childRemaining} more child profiles.`;
    }

    return {
      tier: effectiveTier,
      counts,
      limits: {
        maxChildProfiles,
        maxTotalProfiles,
        maxParentProfiles: MAX_PARENT_PROFILES,
      },
      remaining: {
        childProfiles: childRemaining,
        totalProfiles: totalRemaining,
      },
      canAddChild,
      canAddParent,
      message,
      profiles: existingProfiles.map((p) => ({
        id: p._id,
        displayName: p.displayName,
        profileType: p.profileType,
        avatarUrl: p.avatarUrl,
      })),
    };
  },
});

// ============================================================================
// KID DASHBOARD STATS
// ============================================================================

/**
 * Get dashboard stats for a kid profile.
 * Returns collection count, badge count, current streak, and recent activity.
 * This is designed for the kid dashboard to show at-a-glance stats.
 */
export const getKidDashboardStats = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    // Get profile info
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return null;
    }

    // Get collection stats
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const uniqueCardIds = new Set(collectionCards.map((c) => c.cardId));
    const totalCards = collectionCards.reduce((sum, c) => sum + c.quantity, 0);
    const uniqueCards = uniqueCardIds.size;
    const setsStarted = new Set(collectionCards.map((c) => c.cardId.split('-')[0])).size;

    // Get badge/achievement count
    const achievements = await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const badgeCount = achievements.length;

    // Calculate current streak from activity logs
    const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
    const activityLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Filter to card_added actions in the date range
    const recentCardAdds = activityLogs.filter(
      (log) => log._creationTime >= sixtyDaysAgo && log.action === 'card_added'
    );

    // Extract unique dates (YYYY-MM-DD format)
    const uniqueDates = new Set<string>();
    for (const log of recentCardAdds) {
      const date = new Date(log._creationTime);
      const dateStr = date.toISOString().split('T')[0];
      uniqueDates.add(dateStr);
    }

    const activityDates = Array.from(uniqueDates).sort();
    const streakInfo = calculateStreakFromDates(activityDates);

    // Get recent activity (last 10 items)
    const recentActivity = activityLogs
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 10);

    // Enrich recent activity with card names
    const cardIdsToLookup = new Set<string>();
    for (const log of recentActivity) {
      if (log.action === 'card_added' || log.action === 'card_removed') {
        const metadata = log.metadata as { cardId?: string; cardName?: string } | undefined;
        if (metadata?.cardId && !metadata?.cardName) {
          cardIdsToLookup.add(metadata.cardId);
        }
      }
    }

    const cardNameMap = new Map<string, string>();
    if (cardIdsToLookup.size > 0) {
      const cardLookups = await Promise.all(
        Array.from(cardIdsToLookup).map((cardId) =>
          ctx.db
            .query('cachedCards')
            .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
            .first()
        )
      );

      for (const card of cardLookups) {
        if (card) {
          cardNameMap.set(card.cardId, card.name);
        }
      }
    }

    const enrichedRecentActivity = recentActivity.map((log) => {
      const metadata = log.metadata as
        | { cardId?: string; cardName?: string; [key: string]: unknown }
        | undefined;

      let displayText = '';
      let icon = '';

      if (log.action === 'card_added') {
        const cardName =
          metadata?.cardName ??
          cardNameMap.get(metadata?.cardId ?? '') ??
          metadata?.cardId ??
          'a card';
        displayText = `Added ${cardName}`;
        icon = '➕';
      } else if (log.action === 'card_removed') {
        const cardName =
          metadata?.cardName ??
          cardNameMap.get(metadata?.cardId ?? '') ??
          metadata?.cardId ??
          'a card';
        displayText = `Removed ${cardName}`;
        icon = '➖';
      } else if (log.action === 'achievement_earned') {
        const achievementName =
          (metadata?.achievementName as string) ?? metadata?.achievementKey ?? 'an achievement';
        displayText = `Earned ${achievementName}`;
        icon = '🏆';
      }

      return {
        id: log._id,
        action: log.action,
        displayText,
        icon,
        timestamp: log._creationTime,
        relativeTime: formatRelativeTime(log._creationTime),
      };
    });

    return {
      profile: {
        id: profile._id,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        profileType: profile.profileType,
      },
      collection: {
        uniqueCards,
        totalCards,
        setsStarted,
      },
      badges: {
        total: badgeCount,
        recentlyEarned: achievements.filter(
          (a) => a.earnedAt > Date.now() - 7 * 24 * 60 * 60 * 1000
        ).length,
      },
      streak: {
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
        isActiveToday: streakInfo.isActiveToday,
        lastActiveDate: streakInfo.lastActiveDate,
      },
      recentActivity: enrichedRecentActivity,
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate streak from activity dates.
 * Dates should be in YYYY-MM-DD format.
 */
function calculateStreakFromDates(activityDates: string[]): {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
  lastActiveDate: string | null;
} {
  if (activityDates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      isActiveToday: false,
      lastActiveDate: null,
    };
  }

  // Sort dates in descending order (most recent first)
  const sortedDates = [...activityDates].sort((a, b) => b.localeCompare(a));
  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  const isActiveToday = sortedDates[0] === today;
  const lastActiveDate = sortedDates[0];

  // Helper to check if two dates are consecutive
  function areConsecutive(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffMs = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = diffMs / (24 * 60 * 60 * 1000);
    return diffDays === 1;
  }

  // Calculate current streak (only if active today or yesterday)
  let currentStreak = 0;
  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      if (areConsecutive(sortedDates[i], sortedDates[i - 1])) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak (looking at all dates in ascending order)
  const ascendingDates = [...activityDates].sort();
  let longestStreak = ascendingDates.length > 0 ? 1 : 0;
  let currentRun = 1;

  for (let i = 1; i < ascendingDates.length; i++) {
    if (areConsecutive(ascendingDates[i - 1], ascendingDates[i])) {
      currentRun++;
      longestStreak = Math.max(longestStreak, currentRun);
    } else {
      currentRun = 1;
    }
  }

  return {
    currentStreak,
    longestStreak,
    isActiveToday,
    lastActiveDate,
  };
}

/**
 * Format a timestamp as a relative string (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  } else if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  } else if (minutes > 0) {
    return minutes === 1 ? '1 min ago' : `${minutes} mins ago`;
  } else {
    return 'Just now';
  }
}

// ============================================================================
// PARENT ACCESS CONTROL
// ============================================================================

/**
 * Check if the current authenticated user has parent access in their family.
 * Returns detailed access information including the family and profile data.
 *
 * Use this to protect parent-only features like the parent dashboard.
 *
 * Returns:
 * - hasAccess: true if user is authenticated AND has a parent profile
 * - reason: explanation if access is denied
 * - profile/family: data if access is granted
 */
export const hasParentAccess = query({
  args: {},
  handler: async (ctx) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        hasAccess: false,
        reason: 'NOT_AUTHENTICATED',
        message: 'Please sign in to access this feature',
        profile: null,
        family: null,
      };
    }

    // Get the user's email from the users table
    const user = await ctx.db.get(userId);
    if (!user || !user.email) {
      return {
        hasAccess: false,
        reason: 'NO_EMAIL',
        message: 'User account has no email associated',
        profile: null,
        family: null,
      };
    }

    // Find the family associated with this email
    const family = await ctx.db
      .query('families')
      .withIndex('by_email', (q) => q.eq('email', user.email!.toLowerCase()))
      .first();

    if (!family) {
      return {
        hasAccess: false,
        reason: 'NO_FAMILY',
        message: 'No family account found for this user',
        profile: null,
        family: null,
      };
    }

    // Get all profiles for this family
    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', family._id))
      .collect();

    // Find the parent profile
    const parentProfile = profiles.find((p) => p.profileType === 'parent');

    if (!parentProfile) {
      return {
        hasAccess: false,
        reason: 'NO_PARENT_PROFILE',
        message: 'No parent profile exists for this family. Please create a parent profile first.',
        profile: null,
        family: {
          id: family._id,
          subscriptionTier: family.subscriptionTier,
        },
      };
    }

    // User has parent access
    return {
      hasAccess: true,
      reason: null,
      message: null,
      profile: {
        id: parentProfile._id,
        displayName: parentProfile.displayName,
        avatarUrl: parentProfile.avatarUrl,
        profileType: parentProfile.profileType,
      },
      family: {
        id: family._id,
        email: family.email,
        subscriptionTier: family.subscriptionTier,
        subscriptionExpiresAt: family.subscriptionExpiresAt,
      },
      userId,
      childProfiles: profiles
        .filter((p) => p.profileType === 'child')
        .map((p) => ({
          id: p._id,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
        })),
    };
  },
});

/**
 * Get comprehensive parent dashboard data.
 * This is a secure query that only returns data for authenticated parent users.
 *
 * Returns:
 * - Family and subscription info
 * - All child profiles with their collection stats
 * - Recent activity across all family profiles
 * - Achievement summaries per child
 * - Wishlist summaries per child
 *
 * If the user doesn't have parent access, returns null with error info.
 */
export const getParentDashboardData = query({
  args: {},
  handler: async (ctx) => {
    // First, verify parent access
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return {
        authorized: false,
        error: 'NOT_AUTHENTICATED',
        message: 'Please sign in to access the parent dashboard',
        data: null,
      };
    }

    const user = await ctx.db.get(userId);
    if (!user || !user.email) {
      return {
        authorized: false,
        error: 'NO_EMAIL',
        message: 'User account has no email associated',
        data: null,
      };
    }

    const family = await ctx.db
      .query('families')
      .withIndex('by_email', (q) => q.eq('email', user.email!.toLowerCase()))
      .first();

    if (!family) {
      return {
        authorized: false,
        error: 'NO_FAMILY',
        message: 'No family account found',
        data: null,
      };
    }

    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', family._id))
      .collect();

    const parentProfile = profiles.find((p) => p.profileType === 'parent');
    if (!parentProfile) {
      return {
        authorized: false,
        error: 'NO_PARENT_PROFILE',
        message: 'No parent profile found. Please create a parent profile first.',
        data: null,
      };
    }

    // User is authorized - gather dashboard data
    const childProfiles = profiles.filter((p) => p.profileType === 'child');

    // Gather stats for each child profile in parallel
    const childStatsPromises = childProfiles.map(async (child) => {
      // Get collection stats
      const collectionCards = await ctx.db
        .query('collectionCards')
        .withIndex('by_profile', (q) => q.eq('profileId', child._id))
        .collect();

      const uniqueCardIds = new Set(collectionCards.map((c) => c.cardId));
      const totalCards = collectionCards.reduce((sum, c) => sum + c.quantity, 0);
      const setsStarted = new Set(collectionCards.map((c) => c.cardId.split('-')[0])).size;

      // Get achievements
      const achievements = await ctx.db
        .query('achievements')
        .withIndex('by_profile', (q) => q.eq('profileId', child._id))
        .collect();

      // Get wishlist
      const wishlist = await ctx.db
        .query('wishlistCards')
        .withIndex('by_profile', (q) => q.eq('profileId', child._id))
        .collect();

      // Get recent activity (last 7 days)
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentActivity = await ctx.db
        .query('activityLogs')
        .withIndex('by_profile', (q) => q.eq('profileId', child._id))
        .collect();

      const recentActivityFiltered = recentActivity.filter(
        (log) => log._creationTime >= sevenDaysAgo
      );

      // Calculate activity by day
      const activityByDay = new Map<string, number>();
      for (const log of recentActivityFiltered) {
        const dateStr = new Date(log._creationTime).toISOString().split('T')[0];
        activityByDay.set(dateStr, (activityByDay.get(dateStr) || 0) + 1);
      }

      // Calculate streak
      const cardAddLogs = recentActivity.filter((log) => log.action === 'card_added');
      const activityDates = [
        ...new Set(
          cardAddLogs.map((log) => new Date(log._creationTime).toISOString().split('T')[0])
        ),
      ].sort();
      const streakInfo = calculateStreakFromDates(activityDates);

      return {
        profile: {
          id: child._id,
          displayName: child.displayName,
          avatarUrl: child.avatarUrl,
        },
        collection: {
          uniqueCards: uniqueCardIds.size,
          totalCards,
          setsStarted,
        },
        achievements: {
          total: achievements.length,
          recentlyEarned: achievements.filter((a) => a.earnedAt >= sevenDaysAgo).length,
          latestAchievement:
            achievements.length > 0
              ? achievements.sort((a, b) => b.earnedAt - a.earnedAt)[0]
              : null,
        },
        wishlist: {
          total: wishlist.length,
          priorityCount: wishlist.filter((w) => w.isPriority).length,
        },
        activity: {
          lastSevenDays: recentActivityFiltered.length,
          byDay: Object.fromEntries(activityByDay),
          cardsAddedRecently: recentActivityFiltered.filter((log) => log.action === 'card_added')
            .length,
        },
        streak: {
          currentStreak: streakInfo.currentStreak,
          longestStreak: streakInfo.longestStreak,
          isActiveToday: streakInfo.isActiveToday,
        },
      };
    });

    const childStats = await Promise.all(childStatsPromises);

    // Get family-wide recent activity (last 20 items)
    const allProfileIds = profiles.map((p) => p._id);
    const allActivityPromises = allProfileIds.map((profileId) =>
      ctx.db
        .query('activityLogs')
        .withIndex('by_profile', (q) => q.eq('profileId', profileId))
        .collect()
    );
    const allActivities = (await Promise.all(allActivityPromises)).flat();

    // Build profile lookup map for O(1) lookups instead of O(n) find()
    const profileLookupMap = new Map<string, string>();
    for (const profile of profiles) {
      profileLookupMap.set(profile._id.toString(), profile.displayName);
    }

    // Sort by time and take top 20
    const recentFamilyActivity = allActivities
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 20)
      .map((log) => {
        // O(1) lookup instead of O(n) find()
        const profileName = profileLookupMap.get(log.profileId.toString()) || 'Unknown';
        return {
          id: log._id,
          profileId: log.profileId,
          profileName,
          action: log.action,
          metadata: log.metadata,
          timestamp: log._creationTime,
          relativeTime: formatRelativeTime(log._creationTime),
        };
      });

    // Calculate family totals
    const familyTotals = {
      totalCards: childStats.reduce((sum, c) => sum + c.collection.totalCards, 0),
      uniqueCards: childStats.reduce((sum, c) => sum + c.collection.uniqueCards, 0),
      totalAchievements: childStats.reduce((sum, c) => sum + c.achievements.total, 0),
      totalWishlistItems: childStats.reduce((sum, c) => sum + c.wishlist.total, 0),
      childProfileCount: childStats.length,
    };

    // Get subscription status
    let subscriptionStatus: 'active' | 'expired' | 'free' = 'free';
    if (family.subscriptionTier === 'family') {
      if (family.subscriptionExpiresAt && family.subscriptionExpiresAt <= Date.now()) {
        subscriptionStatus = 'expired';
      } else {
        subscriptionStatus = 'active';
      }
    }

    return {
      authorized: true,
      error: null,
      message: null,
      data: {
        parent: {
          id: parentProfile._id,
          displayName: parentProfile.displayName,
          email: user.email,
        },
        family: {
          id: family._id,
          subscriptionTier: family.subscriptionTier,
          subscriptionExpiresAt: family.subscriptionExpiresAt,
          subscriptionStatus,
        },
        children: childStats,
        familyTotals,
        recentActivity: recentFamilyActivity,
        limits: {
          maxChildProfiles: getMaxChildProfilesInternal(
            subscriptionStatus === 'active' ? 'family' : 'free'
          ),
          maxTotalProfiles: getMaxTotalProfilesInternal(
            subscriptionStatus === 'active' ? 'family' : 'free'
          ),
          currentChildCount: childStats.length,
        },
      },
    };
  },
});

// ============================================================================
// PROFILE OWNERSHIP VALIDATION
// ============================================================================

/**
 * Validation result types for profile access checks.
 */
export type ProfileAccessResult =
  | {
      hasAccess: true;
      userId: string;
      userEmail: string;
      familyId: string;
      profileId: string;
    }
  | {
      hasAccess: false;
      reason:
        | 'NOT_AUTHENTICATED'
        | 'NO_EMAIL'
        | 'PROFILE_NOT_FOUND'
        | 'FAMILY_NOT_FOUND'
        | 'NOT_OWNER';
      message: string;
    };

export type FamilyAccessResult =
  | {
      hasAccess: true;
      userId: string;
      userEmail: string;
      familyId: string;
    }
  | {
      hasAccess: false;
      reason: 'NOT_AUTHENTICATED' | 'NO_EMAIL' | 'FAMILY_NOT_FOUND' | 'NOT_OWNER';
      message: string;
    };

/**
 * Validate that the current authenticated user owns a specific profile.
 *
 * Ownership is determined by:
 * 1. User is authenticated
 * 2. User has an email address
 * 3. Profile exists
 * 4. Profile's family email matches the user's email
 *
 * This is a helper function used by secure queries/mutations.
 */
async function validateProfileOwnership(
  ctx: Parameters<typeof getAuthUserId>[0] & { db: { get: (id: unknown) => Promise<unknown>; query: (table: string) => unknown } },
  profileId: string
): Promise<ProfileAccessResult> {
  // Get the authenticated user's ID
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return {
      hasAccess: false,
      reason: 'NOT_AUTHENTICATED',
      message: 'You must be signed in to access this profile',
    };
  }

  // Batch fetch: user and profile lookups are independent, run in parallel
  const [user, profile] = (await Promise.all([
    ctx.db.get(userId),
    ctx.db.get(profileId as unknown),
  ])) as [{ email?: string } | null, { familyId?: string } | null];

  // Validate user has email
  if (!user || !user.email) {
    return {
      hasAccess: false,
      reason: 'NO_EMAIL',
      message: 'Your account has no email address associated',
    };
  }

  // Validate profile exists
  if (!profile) {
    return {
      hasAccess: false,
      reason: 'PROFILE_NOT_FOUND',
      message: 'Profile not found',
    };
  }

  // Get the family (depends on profile.familyId, so must be sequential)
  const family = (await ctx.db.get(profile.familyId as unknown)) as { email?: string } | null;
  if (!family) {
    return {
      hasAccess: false,
      reason: 'FAMILY_NOT_FOUND',
      message: 'Family not found',
    };
  }

  // Check ownership: family email must match user email
  if (family.email?.toLowerCase() !== user.email.toLowerCase()) {
    return {
      hasAccess: false,
      reason: 'NOT_OWNER',
      message: 'You do not have permission to access this profile',
    };
  }

  return {
    hasAccess: true,
    userId: userId as string,
    userEmail: user.email,
    familyId: profile.familyId as string,
    profileId: profileId,
  };
}

/**
 * Validate that the current authenticated user owns a specific family.
 *
 * Ownership is determined by:
 * 1. User is authenticated
 * 2. User has an email address
 * 3. Family exists
 * 4. Family email matches the user's email
 *
 * This is a helper function used by secure queries/mutations.
 */
async function validateFamilyOwnership(
  ctx: Parameters<typeof getAuthUserId>[0] & { db: { get: (id: unknown) => Promise<unknown>; query: (table: string) => unknown } },
  familyId: string
): Promise<FamilyAccessResult> {
  // Get the authenticated user's ID
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return {
      hasAccess: false,
      reason: 'NOT_AUTHENTICATED',
      message: 'You must be signed in to access this family',
    };
  }

  // Batch fetch: user and family lookups are independent, run in parallel
  const [user, family] = (await Promise.all([
    ctx.db.get(userId),
    ctx.db.get(familyId as unknown),
  ])) as [{ email?: string } | null, { email?: string } | null];

  // Validate user has email
  if (!user || !user.email) {
    return {
      hasAccess: false,
      reason: 'NO_EMAIL',
      message: 'Your account has no email address associated',
    };
  }

  // Validate family exists
  if (!family) {
    return {
      hasAccess: false,
      reason: 'FAMILY_NOT_FOUND',
      message: 'Family not found',
    };
  }

  // Check ownership: family email must match user email
  if (family.email?.toLowerCase() !== user.email.toLowerCase()) {
    return {
      hasAccess: false,
      reason: 'NOT_OWNER',
      message: 'You do not have permission to access this family',
    };
  }

  return {
    hasAccess: true,
    userId: userId as string,
    userEmail: user.email,
    familyId: familyId,
  };
}

// ============================================================================
// SECURE PROFILE QUERIES (with ownership validation)
// ============================================================================

/**
 * Get a profile with ownership validation.
 * Only returns the profile if the authenticated user owns it (via family email).
 *
 * Use this instead of `getProfile` for user-facing features.
 */
export const getProfileSecure = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const access = await validateProfileOwnership(
      ctx as Parameters<typeof validateProfileOwnership>[0],
      args.profileId
    );

    if (!access.hasAccess) {
      return {
        authorized: false,
        error: access.reason,
        message: access.message,
        profile: null,
      };
    }

    const profile = await ctx.db.get(args.profileId);
    return {
      authorized: true,
      error: null,
      message: null,
      profile,
    };
  },
});

/**
 * Get all profiles in a family with ownership validation.
 * Only returns profiles if the authenticated user owns the family.
 *
 * Use this instead of `getProfilesByFamily` for user-facing features.
 */
export const getProfilesByFamilySecure = query({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    const access = await validateFamilyOwnership(
      ctx as Parameters<typeof validateFamilyOwnership>[0],
      args.familyId
    );

    if (!access.hasAccess) {
      return {
        authorized: false,
        error: access.reason,
        message: access.message,
        profiles: [],
      };
    }

    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();

    // Sort: parent first, then children alphabetically
    const sortedProfiles = [...profiles].sort((a, b) => {
      if (a.profileType === 'parent' && b.profileType !== 'parent') return -1;
      if (b.profileType === 'parent' && a.profileType !== 'parent') return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    return {
      authorized: true,
      error: null,
      message: null,
      profiles: sortedProfiles,
    };
  },
});

/**
 * Get family details with ownership validation.
 * Only returns the family if the authenticated user owns it.
 *
 * Use this instead of `getFamily` for user-facing features.
 */
export const getFamilySecure = query({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    const access = await validateFamilyOwnership(
      ctx as Parameters<typeof validateFamilyOwnership>[0],
      args.familyId
    );

    if (!access.hasAccess) {
      return {
        authorized: false,
        error: access.reason,
        message: access.message,
        family: null,
      };
    }

    const family = await ctx.db.get(args.familyId);
    return {
      authorized: true,
      error: null,
      message: null,
      family,
    };
  },
});

/**
 * Get kid dashboard stats with ownership validation.
 * Only returns stats if the authenticated user owns the profile.
 *
 * Use this instead of `getKidDashboardStats` for user-facing features.
 */
export const getKidDashboardStatsSecure = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const access = await validateProfileOwnership(
      ctx as Parameters<typeof validateProfileOwnership>[0],
      args.profileId
    );

    if (!access.hasAccess) {
      return {
        authorized: false,
        error: access.reason,
        message: access.message,
        data: null,
      };
    }

    // Re-use the existing stats logic (copied from getKidDashboardStats handler)
    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return {
        authorized: false,
        error: 'PROFILE_NOT_FOUND',
        message: 'Profile not found',
        data: null,
      };
    }

    // Get collection stats
    const collectionCards = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const uniqueCardIds = new Set(collectionCards.map((c) => c.cardId));
    const totalCards = collectionCards.reduce((sum, c) => sum + c.quantity, 0);
    const uniqueCards = uniqueCardIds.size;
    const setsStarted = new Set(collectionCards.map((c) => c.cardId.split('-')[0])).size;

    // Get badge/achievement count
    const achievements = await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    const badgeCount = achievements.length;

    // Calculate current streak from activity logs
    const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
    const activityLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    // Filter to card_added actions in the date range
    const recentCardAdds = activityLogs.filter(
      (log) => log._creationTime >= sixtyDaysAgo && log.action === 'card_added'
    );

    // Extract unique dates (YYYY-MM-DD format)
    const uniqueDates = new Set<string>();
    for (const log of recentCardAdds) {
      const date = new Date(log._creationTime);
      const dateStr = date.toISOString().split('T')[0];
      uniqueDates.add(dateStr);
    }

    const activityDates = Array.from(uniqueDates).sort();
    const streakInfo = calculateStreakFromDates(activityDates);

    // Get recent activity (last 10 items)
    const recentActivity = activityLogs
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 10);

    // Enrich recent activity with card names
    const cardIdsToLookup = new Set<string>();
    for (const log of recentActivity) {
      if (log.action === 'card_added' || log.action === 'card_removed') {
        const metadata = log.metadata as { cardId?: string; cardName?: string } | undefined;
        if (metadata?.cardId && !metadata?.cardName) {
          cardIdsToLookup.add(metadata.cardId);
        }
      }
    }

    const cardNameMap = new Map<string, string>();
    if (cardIdsToLookup.size > 0) {
      const cardLookups = await Promise.all(
        Array.from(cardIdsToLookup).map((cardId) =>
          ctx.db
            .query('cachedCards')
            .withIndex('by_card_id', (q) => q.eq('cardId', cardId))
            .first()
        )
      );

      for (const card of cardLookups) {
        if (card) {
          cardNameMap.set(card.cardId, card.name);
        }
      }
    }

    const enrichedRecentActivity = recentActivity.map((log) => {
      const metadata = log.metadata as
        | { cardId?: string; cardName?: string; [key: string]: unknown }
        | undefined;

      let displayText = '';
      let icon = '';

      if (log.action === 'card_added') {
        const cardName =
          metadata?.cardName ??
          cardNameMap.get(metadata?.cardId ?? '') ??
          metadata?.cardId ??
          'a card';
        displayText = `Added ${cardName}`;
        icon = '➕';
      } else if (log.action === 'card_removed') {
        const cardName =
          metadata?.cardName ??
          cardNameMap.get(metadata?.cardId ?? '') ??
          metadata?.cardId ??
          'a card';
        displayText = `Removed ${cardName}`;
        icon = '➖';
      } else if (log.action === 'achievement_earned') {
        const achievementName =
          (metadata?.achievementName as string) ?? metadata?.achievementKey ?? 'an achievement';
        displayText = `Earned ${achievementName}`;
        icon = '🏆';
      }

      return {
        id: log._id,
        action: log.action,
        displayText,
        icon,
        timestamp: log._creationTime,
        relativeTime: formatRelativeTime(log._creationTime),
      };
    });

    return {
      authorized: true,
      error: null,
      message: null,
      data: {
        profile: {
          id: profile._id,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          profileType: profile.profileType,
        },
        collection: {
          uniqueCards,
          totalCards,
          setsStarted,
        },
        badges: {
          total: badgeCount,
          recentlyEarned: achievements.filter(
            (a) => a.earnedAt > Date.now() - 7 * 24 * 60 * 60 * 1000
          ).length,
        },
        streak: {
          currentStreak: streakInfo.currentStreak,
          longestStreak: streakInfo.longestStreak,
          isActiveToday: streakInfo.isActiveToday,
          lastActiveDate: streakInfo.lastActiveDate,
        },
        recentActivity: enrichedRecentActivity,
      },
    };
  },
});

// ============================================================================
// SECURE PROFILE MUTATIONS (with ownership validation)
// ============================================================================

/**
 * Update a profile with ownership validation.
 * Only allows updates if the authenticated user owns the profile.
 *
 * Use this instead of `updateProfile` for user-facing features.
 */
export const updateProfileSecure = mutation({
  args: {
    profileId: v.id('profiles'),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const access = await validateProfileOwnership(
      ctx as Parameters<typeof validateProfileOwnership>[0],
      args.profileId
    );

    if (!access.hasAccess) {
      return {
        success: false,
        error: access.reason,
        message: access.message,
      };
    }

    const errors: ValidationError[] = [];

    // Validate display name if provided
    if (args.displayName !== undefined) {
      const nameErrors = validateDisplayNameInternal(args.displayName);
      errors.push(...nameErrors);

      // Check uniqueness within family
      if (nameErrors.length === 0) {
        const existingProfiles = await ctx.db
          .query('profiles')
          .withIndex('by_family', (q) => q.eq('familyId', access.familyId as Id<'families'>))
          .collect();

        const normalizedName = args.displayName.trim().toLowerCase();
        const isDuplicate = existingProfiles.some(
          (p) => p.displayName.trim().toLowerCase() === normalizedName && p._id !== args.profileId
        );

        if (isDuplicate) {
          errors.push({
            field: 'displayName',
            code: 'DUPLICATE_NAME',
            message: 'A profile with this name already exists in your family',
          });
        }
      }
    }

    // Validate avatar URL if provided
    if (args.avatarUrl !== undefined) {
      const avatarErrors = validateAvatarUrlInternal(args.avatarUrl);
      errors.push(...avatarErrors);
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors,
      };
    }

    // Build updates
    const updates: { displayName?: string; avatarUrl?: string } = {};

    if (args.displayName !== undefined) {
      updates.displayName = args.displayName.trim().replace(/\s+/g, ' ');
    }

    if (args.avatarUrl !== undefined) {
      updates.avatarUrl = args.avatarUrl.trim() || undefined;
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.profileId, updates);
    }

    return {
      success: true,
      error: null,
      message: 'Profile updated successfully',
    };
  },
});

/**
 * Delete a profile with ownership validation.
 * Only allows deletion if the authenticated user owns the profile.
 *
 * Note: Cannot delete the parent profile if it's the only profile remaining.
 *
 * Use this instead of `deleteProfile` for user-facing features.
 */
export const deleteProfileSecure = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const access = await validateProfileOwnership(
      ctx as Parameters<typeof validateProfileOwnership>[0],
      args.profileId
    );

    if (!access.hasAccess) {
      return {
        success: false,
        error: access.reason,
        message: access.message,
      };
    }

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      return {
        success: false,
        error: 'PROFILE_NOT_FOUND',
        message: 'Profile not found',
      };
    }

    // Check if this is the last profile in the family
    const familyProfiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', profile.familyId))
      .collect();

    if (familyProfiles.length === 1) {
      return {
        success: false,
        error: 'LAST_PROFILE',
        message: 'Cannot delete the last profile in the family',
      };
    }

    // Delete all related data first
    const collections = await ctx.db
      .query('collectionCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    for (const card of collections) {
      await ctx.db.delete(card._id);
    }

    const wishlist = await ctx.db
      .query('wishlistCards')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    for (const card of wishlist) {
      await ctx.db.delete(card._id);
    }

    const achievements = await ctx.db
      .query('achievements')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    for (const achievement of achievements) {
      await ctx.db.delete(achievement._id);
    }

    const shares = await ctx.db
      .query('wishlistShares')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    for (const share of shares) {
      await ctx.db.delete(share._id);
    }

    const activityLogs = await ctx.db
      .query('activityLogs')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    for (const log of activityLogs) {
      await ctx.db.delete(log._id);
    }

    const milestones = await ctx.db
      .query('collectionMilestones')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    for (const milestone of milestones) {
      await ctx.db.delete(milestone._id);
    }

    const profileGames = await ctx.db
      .query('profileGames')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .collect();

    for (const game of profileGames) {
      await ctx.db.delete(game._id);
    }

    // Finally delete the profile
    await ctx.db.delete(args.profileId);

    return {
      success: true,
      error: null,
      message: 'Profile deleted successfully',
    };
  },
});

/**
 * Create a profile with ownership validation.
 * Only allows creating profiles in families owned by the authenticated user.
 *
 * Use this instead of `createProfile` for user-facing features.
 */
export const createProfileSecure = mutation({
  args: {
    familyId: v.id('families'),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    profileType: v.union(v.literal('parent'), v.literal('child')),
  },
  handler: async (ctx, args) => {
    const access = await validateFamilyOwnership(
      ctx as Parameters<typeof validateFamilyOwnership>[0],
      args.familyId
    );

    if (!access.hasAccess) {
      return {
        success: false,
        error: access.reason,
        message: access.message,
        profileId: null,
      };
    }

    const errors: ValidationError[] = [];

    // Validate display name
    const nameErrors = validateDisplayNameInternal(args.displayName);
    errors.push(...nameErrors);

    // Validate avatar URL
    const avatarErrors = validateAvatarUrlInternal(args.avatarUrl);
    errors.push(...avatarErrors);

    // Get existing profiles
    const existingProfiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();

    // Check name uniqueness
    if (nameErrors.length === 0) {
      const normalizedName = args.displayName.trim().toLowerCase();
      const isDuplicate = existingProfiles.some(
        (p) => p.displayName.trim().toLowerCase() === normalizedName
      );

      if (isDuplicate) {
        errors.push({
          field: 'displayName',
          code: 'DUPLICATE_NAME',
          message: 'A profile with this name already exists in your family',
        });
      }
    }

    // Check profile limits
    if (existingProfiles.length >= MAX_TOTAL_PROFILES) {
      errors.push({
        field: 'profile',
        code: 'LIMIT_REACHED',
        message: `Maximum of ${MAX_TOTAL_PROFILES} profiles per family`,
      });
    }

    // Validate: only one parent profile per family
    if (args.profileType === 'parent') {
      const existingParent = existingProfiles.find((p) => p.profileType === 'parent');
      if (existingParent) {
        errors.push({
          field: 'profileType',
          code: 'PARENT_EXISTS',
          message: 'Only one parent profile allowed per family',
        });
      }
    }

    // Get family for tier-based limits
    const family = await ctx.db.get(args.familyId);
    if (family && args.profileType === 'child') {
      let effectiveTier: 'free' | 'family' = family.subscriptionTier;
      if (
        family.subscriptionTier === 'family' &&
        family.subscriptionExpiresAt &&
        family.subscriptionExpiresAt <= Date.now()
      ) {
        effectiveTier = 'free';
      }

      const counts = countProfilesInternal(existingProfiles);
      const maxChildProfiles = getMaxChildProfilesInternal(effectiveTier);

      if (counts.child >= maxChildProfiles) {
        const canUpgrade = effectiveTier === 'free';
        errors.push({
          field: 'profile',
          code: canUpgrade ? 'UPGRADE_REQUIRED' : 'LIMIT_REACHED',
          message: canUpgrade
            ? `Free plan is limited to ${maxChildProfiles} child profile. Upgrade to Family Plan for up to ${FAMILY_TIER_MAX_CHILD_PROFILES} child profiles.`
            : `Maximum of ${maxChildProfiles} child profiles reached`,
        });
      }
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors,
        profileId: null,
      };
    }

    // Sanitize inputs
    const sanitizedName = args.displayName.trim().replace(/\s+/g, ' ');
    const sanitizedAvatarUrl = args.avatarUrl?.trim() || undefined;

    // Create the profile
    const profileId = await ctx.db.insert('profiles', {
      familyId: args.familyId,
      displayName: sanitizedName,
      avatarUrl: sanitizedAvatarUrl,
      profileType: args.profileType,
    });

    return {
      success: true,
      error: null,
      message: 'Profile created successfully',
      profileId,
    };
  },
});

/**
 * Query to validate profile access without returning full profile data.
 * Useful for checking permissions before performing actions.
 */
export const validateProfileAccess = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const access = await validateProfileOwnership(
      ctx as Parameters<typeof validateProfileOwnership>[0],
      args.profileId
    );

    if (!access.hasAccess) {
      return {
        hasAccess: false,
        reason: access.reason,
        message: access.message,
      };
    }

    return {
      hasAccess: true,
      reason: null,
      message: null,
      familyId: access.familyId,
    };
  },
});

/**
 * Query to validate family access without returning full family data.
 * Useful for checking permissions before performing actions.
 */
export const validateFamilyAccess = query({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    const access = await validateFamilyOwnership(
      ctx as Parameters<typeof validateFamilyOwnership>[0],
      args.familyId
    );

    if (!access.hasAccess) {
      return {
        hasAccess: false,
        reason: access.reason,
        message: access.message,
      };
    }

    return {
      hasAccess: true,
      reason: null,
      message: null,
    };
  },
});
