/**
 * Child profile creation and validation utilities for the CardDex app.
 * Pure functions for validating child profile data before creation.
 *
 * Validation rules:
 * - Display name: 1-30 characters, alphanumeric + spaces, no profanity
 * - Avatar URL: Optional, valid URL format if provided
 * - Family limits: Based on subscription tier (free: 1 child, family: 3 children, max total: 4)
 */

// ============================================================================
// TYPES
// ============================================================================

export type ProfileType = 'parent' | 'child';

export interface ProfileCreateInput {
  displayName: string;
  avatarUrl?: string;
  profileType: ProfileType;
}

export interface ChildProfileCreateInput {
  displayName: string;
  avatarUrl?: string;
}

export interface ExistingProfile {
  id: string;
  displayName: string;
  profileType?: ProfileType;
}

export interface ProfileCounts {
  parent: number;
  child: number;
  total: number;
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface CanCreateProfileResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired: boolean;
  currentCounts: ProfileCounts;
  limits: {
    maxChildProfiles: number;
    maxTotalProfiles: number;
  };
}

export interface CreateChildProfileResult {
  success: boolean;
  errors: ValidationError[];
  sanitizedInput?: ChildProfileCreateInput;
  canCreateResult?: CanCreateProfileResult;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Display name validation constants
 */
export const MIN_DISPLAY_NAME_LENGTH = 1;
export const MAX_DISPLAY_NAME_LENGTH = 30;

/**
 * Profile limit constants (duplicated from subscriptionLimits for independence)
 */
export const FREE_TIER_MAX_CHILD_PROFILES = 1;
export const FAMILY_TIER_MAX_CHILD_PROFILES = 3;
export const MAX_PARENT_PROFILES = 1;
export const MAX_TOTAL_PROFILES = 4;

/**
 * Blocked words/phrases for display names (kid-safety)
 * This is a simplified list - production would use a more comprehensive filter
 */
export const BLOCKED_NAME_PATTERNS: RegExp[] = [
  // Explicit content
  /\b(ass|butt|crap|damn|hell|piss|poop|fart)\b/i,
  // More severe profanity (kept short for testing)
  /\b(f+u+c+k|s+h+i+t|b+i+t+c+h)\b/i,
  // Hate speech indicators
  /\b(hate|kill|die|dead)\b/i,
  // Personal info patterns
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Email addresses
];

/**
 * Allowed characters regex for display names
 * Letters (including Unicode), numbers, spaces, hyphens, apostrophes
 */
export const ALLOWED_NAME_CHARS_REGEX = /^[\p{L}\p{N}\s\-']+$/u;

/**
 * Default avatar URLs for children (placeholder paths)
 */
export const DEFAULT_CHILD_AVATARS = [
  '/avatars/default/child-1.png',
  '/avatars/default/child-2.png',
  '/avatars/default/child-3.png',
  '/avatars/default/child-4.png',
];

// ============================================================================
// DISPLAY NAME VALIDATION
// ============================================================================

/**
 * Check if a display name meets length requirements.
 */
export function isDisplayNameLengthValid(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= MIN_DISPLAY_NAME_LENGTH && trimmed.length <= MAX_DISPLAY_NAME_LENGTH;
}

/**
 * Check if a display name contains only allowed characters.
 */
export function isDisplayNameCharsValid(name: string): boolean {
  return ALLOWED_NAME_CHARS_REGEX.test(name.trim());
}

/**
 * Check if a display name contains blocked words/patterns.
 */
export function containsBlockedContent(name: string): boolean {
  const trimmed = name.trim();
  return BLOCKED_NAME_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Check if a display name is just whitespace.
 */
export function isWhitespaceOnly(name: string): boolean {
  return name.trim().length === 0;
}

/**
 * Check if a display name has excessive consecutive spaces.
 */
export function hasExcessiveSpaces(name: string): boolean {
  return /\s{3,}/.test(name);
}

/**
 * Validate a display name comprehensively.
 */
export function validateDisplayName(name: string): ValidationResult {
  const errors: ValidationError[] = [];

  // Check for empty/whitespace
  if (isWhitespaceOnly(name)) {
    errors.push({
      field: 'displayName',
      code: 'REQUIRED',
      message: 'Display name is required',
    });
    return { isValid: false, errors };
  }

  // Check length
  if (!isDisplayNameLengthValid(name)) {
    if (name.trim().length < MIN_DISPLAY_NAME_LENGTH) {
      errors.push({
        field: 'displayName',
        code: 'TOO_SHORT',
        message: `Display name must be at least ${MIN_DISPLAY_NAME_LENGTH} character`,
      });
    } else {
      errors.push({
        field: 'displayName',
        code: 'TOO_LONG',
        message: `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or less`,
      });
    }
  }

  // Check allowed characters
  if (!isDisplayNameCharsValid(name)) {
    errors.push({
      field: 'displayName',
      code: 'INVALID_CHARS',
      message: 'Display name can only contain letters, numbers, spaces, hyphens, and apostrophes',
    });
  }

  // Check excessive spaces
  if (hasExcessiveSpaces(name)) {
    errors.push({
      field: 'displayName',
      code: 'EXCESSIVE_SPACES',
      message: 'Display name cannot have more than 2 consecutive spaces',
    });
  }

  // Check blocked content
  if (containsBlockedContent(name)) {
    errors.push({
      field: 'displayName',
      code: 'INAPPROPRIATE_CONTENT',
      message: 'Display name contains inappropriate content',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize a display name (trim whitespace, normalize spaces).
 */
export function sanitizeDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, ' '); // Collapse multiple spaces to single space
}

// ============================================================================
// AVATAR URL VALIDATION
// ============================================================================

/**
 * Check if a string is a valid URL format.
 */
export function isValidUrlFormat(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    // Also allow relative paths starting with /
    return url.startsWith('/');
  }
}

/**
 * Check if a URL is from an allowed domain (if we want to restrict).
 * For now, allows any valid URL or relative path.
 */
export function isAllowedAvatarUrl(url: string): boolean {
  if (url.startsWith('/')) {
    return true; // Allow relative paths
  }

  try {
    const parsed = new URL(url);
    // Could add domain whitelist here in production
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate an avatar URL.
 */
export function validateAvatarUrl(url: string | undefined): ValidationResult {
  const errors: ValidationError[] = [];

  // Avatar is optional
  if (url === undefined || url === '') {
    return { isValid: true, errors: [] };
  }

  // Check URL format
  if (!isValidUrlFormat(url)) {
    errors.push({
      field: 'avatarUrl',
      code: 'INVALID_URL',
      message: 'Avatar URL must be a valid URL or path',
    });
    return { isValid: false, errors };
  }

  // Check allowed URLs
  if (!isAllowedAvatarUrl(url)) {
    errors.push({
      field: 'avatarUrl',
      code: 'DISALLOWED_URL',
      message: 'Avatar URL is not allowed',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// PROFILE COUNT UTILITIES
// ============================================================================

/**
 * Count profiles by type from a list of existing profiles.
 */
export function countProfilesByType(profiles: ExistingProfile[]): ProfileCounts {
  let parent = 0;
  let child = 0;

  for (const profile of profiles) {
    if (profile.profileType === 'parent') {
      parent++;
    } else {
      // Default to child if no type or type is 'child'
      child++;
    }
  }

  return {
    parent,
    child,
    total: parent + child,
  };
}

/**
 * Check if a profile name is unique within the family.
 */
export function isDisplayNameUniqueInFamily(
  name: string,
  existingProfiles: ExistingProfile[],
  excludeProfileId?: string
): boolean {
  const normalizedName = name.trim().toLowerCase();

  for (const profile of existingProfiles) {
    if (excludeProfileId && profile.id === excludeProfileId) {
      continue;
    }
    if (profile.displayName.trim().toLowerCase() === normalizedName) {
      return false;
    }
  }

  return true;
}

/**
 * Get the maximum child profiles allowed for a tier.
 */
export function getMaxChildProfilesForTier(tier: 'free' | 'family'): number {
  return tier === 'family' ? FAMILY_TIER_MAX_CHILD_PROFILES : FREE_TIER_MAX_CHILD_PROFILES;
}

/**
 * Get maximum total profiles allowed for a tier.
 */
export function getMaxTotalProfilesForTier(tier: 'free' | 'family'): number {
  if (tier === 'family') {
    return MAX_TOTAL_PROFILES;
  }
  // Free tier: 1 parent + 1 child = 2
  return MAX_PARENT_PROFILES + FREE_TIER_MAX_CHILD_PROFILES;
}

// ============================================================================
// PROFILE CREATION VALIDATION
// ============================================================================

/**
 * Check if a family can create another child profile based on limits.
 */
export function canCreateChildProfile(
  tier: 'free' | 'family',
  existingProfiles: ExistingProfile[]
): CanCreateProfileResult {
  const counts = countProfilesByType(existingProfiles);
  const maxChildProfiles = getMaxChildProfilesForTier(tier);
  const maxTotalProfiles = getMaxTotalProfilesForTier(tier);

  // For free tier, check if upgrading would help
  // (i.e., they're at free tier limits but not at family tier limits)
  const familyTierMaxTotal = MAX_TOTAL_PROFILES;
  const familyTierMaxChild = FAMILY_TIER_MAX_CHILD_PROFILES;
  const couldUpgradeForMoreProfiles =
    tier === 'free' && counts.total < familyTierMaxTotal && counts.child < familyTierMaxChild;

  // Check child limit first (to determine if upgrade would help)
  if (counts.child >= maxChildProfiles) {
    const upgradeWouldHelp = tier === 'free' && counts.child < familyTierMaxChild;
    return {
      allowed: false,
      reason: upgradeWouldHelp
        ? `Free plan is limited to ${maxChildProfiles} child profile. Upgrade to Family Plan for up to ${FAMILY_TIER_MAX_CHILD_PROFILES} child profiles.`
        : `Maximum of ${maxChildProfiles} child profiles reached`,
      upgradeRequired: upgradeWouldHelp,
      currentCounts: counts,
      limits: { maxChildProfiles, maxTotalProfiles },
    };
  }

  // Check total limit
  if (counts.total >= maxTotalProfiles) {
    // If on free tier and upgrading would give more total slots
    const upgradeWouldHelp = tier === 'free' && counts.total < familyTierMaxTotal;
    return {
      allowed: false,
      reason: upgradeWouldHelp
        ? `Free plan is limited to ${maxTotalProfiles} profiles. Upgrade to Family Plan for up to ${familyTierMaxTotal} profiles.`
        : `Maximum of ${maxTotalProfiles} profiles reached`,
      upgradeRequired: upgradeWouldHelp,
      currentCounts: counts,
      limits: { maxChildProfiles, maxTotalProfiles },
    };
  }

  return {
    allowed: true,
    upgradeRequired: false,
    currentCounts: counts,
    limits: { maxChildProfiles, maxTotalProfiles },
  };
}

/**
 * Check if a family can create a parent profile.
 */
export function canCreateParentProfile(
  tier: 'free' | 'family',
  existingProfiles: ExistingProfile[]
): CanCreateProfileResult {
  const counts = countProfilesByType(existingProfiles);
  const maxChildProfiles = getMaxChildProfilesForTier(tier);
  const maxTotalProfiles = getMaxTotalProfilesForTier(tier);

  // Check if parent already exists
  if (counts.parent >= MAX_PARENT_PROFILES) {
    return {
      allowed: false,
      reason: 'Only one parent profile is allowed per family',
      upgradeRequired: false,
      currentCounts: counts,
      limits: { maxChildProfiles, maxTotalProfiles },
    };
  }

  // Check total limit
  if (counts.total >= maxTotalProfiles) {
    return {
      allowed: false,
      reason: `Maximum of ${maxTotalProfiles} profiles reached`,
      upgradeRequired: false,
      currentCounts: counts,
      limits: { maxChildProfiles, maxTotalProfiles },
    };
  }

  return {
    allowed: true,
    upgradeRequired: false,
    currentCounts: counts,
    limits: { maxChildProfiles, maxTotalProfiles },
  };
}

/**
 * Validate a child profile input comprehensively.
 */
export function validateChildProfileInput(
  input: ChildProfileCreateInput,
  tier: 'free' | 'family',
  existingProfiles: ExistingProfile[]
): CreateChildProfileResult {
  const errors: ValidationError[] = [];

  // Validate display name
  const nameResult = validateDisplayName(input.displayName);
  errors.push(...nameResult.errors);

  // Validate avatar URL if provided
  const avatarResult = validateAvatarUrl(input.avatarUrl);
  errors.push(...avatarResult.errors);

  // Check name uniqueness (only if name is otherwise valid)
  if (nameResult.isValid) {
    if (!isDisplayNameUniqueInFamily(input.displayName, existingProfiles)) {
      errors.push({
        field: 'displayName',
        code: 'DUPLICATE_NAME',
        message: 'A profile with this name already exists in your family',
      });
    }
  }

  // Check if can create profile based on limits
  const canCreateResult = canCreateChildProfile(tier, existingProfiles);
  if (!canCreateResult.allowed) {
    errors.push({
      field: 'profile',
      code: canCreateResult.upgradeRequired ? 'UPGRADE_REQUIRED' : 'LIMIT_REACHED',
      message: canCreateResult.reason || 'Cannot create more child profiles',
    });
  }

  // Create sanitized input
  const sanitizedInput: ChildProfileCreateInput = {
    displayName: sanitizeDisplayName(input.displayName),
    avatarUrl: input.avatarUrl?.trim() || undefined,
  };

  return {
    success: errors.length === 0,
    errors,
    sanitizedInput,
    canCreateResult,
  };
}

// ============================================================================
// PROFILE UPDATE VALIDATION
// ============================================================================

/**
 * Validate updates to a child profile.
 */
export function validateChildProfileUpdate(
  input: Partial<ChildProfileCreateInput>,
  existingProfiles: ExistingProfile[],
  currentProfileId: string
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate display name if provided
  if (input.displayName !== undefined) {
    const nameResult = validateDisplayName(input.displayName);
    errors.push(...nameResult.errors);

    // Check name uniqueness (excluding current profile)
    if (nameResult.isValid) {
      if (!isDisplayNameUniqueInFamily(input.displayName, existingProfiles, currentProfileId)) {
        errors.push({
          field: 'displayName',
          code: 'DUPLICATE_NAME',
          message: 'A profile with this name already exists in your family',
        });
      }
    }
  }

  // Validate avatar URL if provided
  if (input.avatarUrl !== undefined) {
    const avatarResult = validateAvatarUrl(input.avatarUrl);
    errors.push(...avatarResult.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get a user-friendly message about profile limits.
 */
export function getProfileLimitMessage(tier: 'free' | 'family', counts: ProfileCounts): string {
  const maxChild = getMaxChildProfilesForTier(tier);
  const remaining = Math.max(0, maxChild - counts.child);

  if (remaining === 0) {
    if (tier === 'free') {
      return "You've reached the child profile limit on the Free plan. Upgrade for more!";
    }
    return "You've reached the maximum child profiles for your account.";
  }

  if (remaining === 1) {
    return `You can add 1 more child profile.`;
  }

  return `You can add ${remaining} more child profiles.`;
}

/**
 * Format profile counts for display.
 */
export function formatProfileCounts(counts: ProfileCounts): string {
  const parts: string[] = [];

  if (counts.parent > 0) {
    parts.push(`${counts.parent} parent`);
  }

  if (counts.child > 0) {
    parts.push(`${counts.child} ${counts.child === 1 ? 'child' : 'children'}`);
  }

  if (parts.length === 0) {
    return 'No profiles';
  }

  return parts.join(', ');
}

/**
 * Get remaining profiles info for UI display.
 */
export function getRemainingProfilesInfo(
  tier: 'free' | 'family',
  existingProfiles: ExistingProfile[]
): {
  childRemaining: number;
  totalRemaining: number;
  canAddChild: boolean;
  canAddParent: boolean;
  message: string;
} {
  const counts = countProfilesByType(existingProfiles);
  const maxChild = getMaxChildProfilesForTier(tier);
  const maxTotal = getMaxTotalProfilesForTier(tier);

  const childRemaining = Math.max(0, maxChild - counts.child);
  const totalRemaining = Math.max(0, maxTotal - counts.total);

  // Can add child if both limits allow
  const canAddChild = childRemaining > 0 && totalRemaining > 0;

  // Can add parent if parent doesn't exist and total allows
  const canAddParent = counts.parent < MAX_PARENT_PROFILES && totalRemaining > 0;

  return {
    childRemaining,
    totalRemaining,
    canAddChild,
    canAddParent,
    message: getProfileLimitMessage(tier, counts),
  };
}

/**
 * Get a random default avatar for a new child profile.
 */
export function getRandomDefaultAvatar(): string {
  const index = Math.floor(Math.random() * DEFAULT_CHILD_AVATARS.length);
  return DEFAULT_CHILD_AVATARS[index];
}

/**
 * Get a default avatar by index (for predictable selection).
 */
export function getDefaultAvatarByIndex(index: number): string {
  const safeIndex = Math.abs(index) % DEFAULT_CHILD_AVATARS.length;
  return DEFAULT_CHILD_AVATARS[safeIndex];
}

// ============================================================================
// ERROR HELPERS
// ============================================================================

/**
 * Get a user-friendly error message for a validation error code.
 */
export function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    REQUIRED: 'This field is required',
    TOO_SHORT: 'Name is too short',
    TOO_LONG: 'Name is too long',
    INVALID_CHARS: 'Name contains invalid characters',
    EXCESSIVE_SPACES: 'Name has too many spaces',
    INAPPROPRIATE_CONTENT: 'Name contains inappropriate content',
    INVALID_URL: 'Invalid URL format',
    DISALLOWED_URL: 'URL is not allowed',
    DUPLICATE_NAME: 'This name is already taken',
    UPGRADE_REQUIRED: 'Please upgrade to add more profiles',
    LIMIT_REACHED: 'Profile limit reached',
  };

  return messages[code] || 'Validation error';
}

/**
 * Check if an error requires an upgrade to resolve.
 */
export function isUpgradeRequiredError(errors: ValidationError[]): boolean {
  return errors.some((e) => e.code === 'UPGRADE_REQUIRED');
}

/**
 * Get the first error message from a validation result.
 */
export function getFirstErrorMessage(result: ValidationResult): string | null {
  if (result.errors.length === 0) {
    return null;
  }
  return result.errors[0].message;
}

/**
 * Combine multiple validation results into one.
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors: ValidationError[] = [];

  for (const result of results) {
    allErrors.push(...result.errors);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}
