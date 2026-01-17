/**
 * Profile utility functions for the CardDex app.
 * Pure functions that can be tested independently of Convex.
 */

// ============================================================================
// TYPES
// ============================================================================

export type ProfileType = 'parent' | 'child';

export interface Profile {
  _id: string;
  familyId: string;
  displayName: string;
  avatarUrl?: string;
  profileType: ProfileType;
}

export interface ProfileValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const VALID_PROFILE_TYPES: ProfileType[] = ['parent', 'child'];
export const MAX_PROFILES_PER_FAMILY = 4;
export const MAX_PARENTS_PER_FAMILY = 1;
export const MIN_DISPLAY_NAME_LENGTH = 1;
export const MAX_DISPLAY_NAME_LENGTH = 50;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if a value is a valid profile type.
 */
export function isValidProfileType(value: unknown): value is ProfileType {
  return VALID_PROFILE_TYPES.includes(value as ProfileType);
}

/**
 * Check if a display name is valid.
 */
export function isValidDisplayName(displayName: string): boolean {
  if (typeof displayName !== 'string') return false;
  const trimmed = displayName.trim();
  return trimmed.length >= MIN_DISPLAY_NAME_LENGTH && trimmed.length <= MAX_DISPLAY_NAME_LENGTH;
}

/**
 * Validate profile creation input.
 */
export function validateProfileInput(input: {
  displayName: string;
  profileType: unknown;
}): ProfileValidationResult {
  const errors: string[] = [];

  if (!isValidDisplayName(input.displayName)) {
    errors.push(
      `Display name must be between ${MIN_DISPLAY_NAME_LENGTH} and ${MAX_DISPLAY_NAME_LENGTH} characters`
    );
  }

  if (!isValidProfileType(input.profileType)) {
    errors.push('Profile type must be "parent" or "child"');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// FAMILY PROFILE LOGIC
// ============================================================================

/**
 * Check if a family can add another profile.
 */
export function canAddProfile(existingProfileCount: number): boolean {
  return existingProfileCount < MAX_PROFILES_PER_FAMILY;
}

/**
 * Check if a family can add a parent profile.
 */
export function canAddParentProfile(existingProfiles: Profile[]): boolean {
  if (existingProfiles.length >= MAX_PROFILES_PER_FAMILY) {
    return false;
  }
  const parentCount = existingProfiles.filter((p) => p.profileType === 'parent').length;
  return parentCount < MAX_PARENTS_PER_FAMILY;
}

/**
 * Check if a family can add a child profile.
 */
export function canAddChildProfile(existingProfiles: Profile[]): boolean {
  return existingProfiles.length < MAX_PROFILES_PER_FAMILY;
}

/**
 * Get the number of remaining profile slots.
 */
export function getRemainingProfileSlots(existingProfileCount: number): number {
  return Math.max(0, MAX_PROFILES_PER_FAMILY - existingProfileCount);
}

/**
 * Get count of profiles by type.
 */
export function countProfilesByType(profiles: Profile[]): {
  parent: number;
  child: number;
} {
  return {
    parent: profiles.filter((p) => p.profileType === 'parent').length,
    child: profiles.filter((p) => p.profileType === 'child').length,
  };
}

/**
 * Find the parent profile in a list of profiles.
 */
export function findParentProfile(profiles: Profile[]): Profile | undefined {
  return profiles.find((p) => p.profileType === 'parent');
}

/**
 * Get all child profiles from a list of profiles.
 */
export function getChildProfiles(profiles: Profile[]): Profile[] {
  return profiles.filter((p) => p.profileType === 'child');
}

/**
 * Check if a profile is a parent.
 */
export function isParentProfile(profile: Profile): boolean {
  return profile.profileType === 'parent';
}

/**
 * Check if a profile is a child.
 */
export function isChildProfile(profile: Profile): boolean {
  return profile.profileType === 'child';
}

// ============================================================================
// PROFILE TYPE CHANGE VALIDATION
// ============================================================================

/**
 * Check if a profile type change is allowed.
 */
export function canChangeProfileType(
  currentProfile: Profile,
  newType: ProfileType,
  allFamilyProfiles: Profile[]
): { allowed: boolean; reason?: string } {
  // No change needed
  if (currentProfile.profileType === newType) {
    return { allowed: true };
  }

  // Changing to parent
  if (newType === 'parent') {
    const existingParent = allFamilyProfiles.find(
      (p) => p.profileType === 'parent' && p._id !== currentProfile._id
    );
    if (existingParent) {
      return {
        allowed: false,
        reason: 'Only one parent profile allowed per family',
      };
    }
  }

  return { allowed: true };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get a display label for a profile type.
 */
export function getProfileTypeLabel(profileType: ProfileType): string {
  return profileType === 'parent' ? 'Parent' : 'Child';
}

/**
 * Get a profile's display string (name with type).
 */
export function formatProfileDisplay(profile: Profile): string {
  const typeLabel = getProfileTypeLabel(profile.profileType);
  return `${profile.displayName} (${typeLabel})`;
}

/**
 * Get available profile types that can be created.
 */
export function getAvailableProfileTypes(existingProfiles: Profile[]): ProfileType[] {
  const available: ProfileType[] = [];

  if (canAddParentProfile(existingProfiles)) {
    available.push('parent');
  }
  if (canAddChildProfile(existingProfiles)) {
    available.push('child');
  }

  return available;
}

// ============================================================================
// PROFILE SORTING
// ============================================================================

/**
 * Sort profiles with parent first, then children alphabetically.
 */
export function sortProfiles(profiles: Profile[]): Profile[] {
  return [...profiles].sort((a, b) => {
    // Parent always comes first
    if (a.profileType === 'parent' && b.profileType !== 'parent') return -1;
    if (b.profileType === 'parent' && a.profileType !== 'parent') return 1;

    // Then sort by display name
    return a.displayName.localeCompare(b.displayName);
  });
}

/**
 * Sort profiles by display name only.
 */
export function sortProfilesByName(profiles: Profile[]): Profile[] {
  return [...profiles].sort((a, b) => a.displayName.localeCompare(b.displayName));
}

// ============================================================================
// CURRENT USER PROFILE TYPES
// ============================================================================

export type SubscriptionTier = 'free' | 'family';

export interface FamilyInfo {
  id: string;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: number;
}

export interface UserInfo {
  id: string;
  email: string;
  emailVerified: boolean;
}

export interface ProfileSummary {
  id: string;
  displayName: string;
  avatarUrl?: string;
  profileType?: ProfileType;
}

export interface CurrentUserProfileResult {
  profile: ProfileSummary;
  family: FamilyInfo;
  availableProfiles: ProfileSummary[];
  user: UserInfo;
}

// ============================================================================
// CURRENT USER PROFILE HELPERS
// ============================================================================

/**
 * Check if the user has a parent profile.
 * Accepts a looser type to work with Convex query results where profileType may be undefined.
 */
export function hasParentAccess(
  result: { profile: { profileType?: string | null } } | null | undefined
): boolean {
  if (!result) return false;
  return result.profile.profileType === 'parent';
}

/**
 * Check if the user is viewing as a child profile.
 */
export function isChildView(result: CurrentUserProfileResult | null): boolean {
  if (!result) return false;
  return result.profile.profileType === 'child';
}

/**
 * Get the dashboard route based on profile type.
 */
export function getDashboardRoute(result: CurrentUserProfileResult | null): string {
  if (!result) return '/login';
  return result.profile.profileType === 'parent' ? '/parent-dashboard' : '/kid-dashboard';
}

/**
 * Check if the user has multiple profiles available.
 */
export function canSwitchProfiles(result: CurrentUserProfileResult | null): boolean {
  if (!result) return false;
  return result.availableProfiles.length > 1;
}

/**
 * Get profiles the user can switch to (excluding current).
 */
export function getOtherProfiles(result: CurrentUserProfileResult | null): ProfileSummary[] {
  if (!result) return [];
  return result.availableProfiles.filter((p) => p.id !== result.profile.id);
}

/**
 * Check if the subscription is active (not expired).
 */
export function isSubscriptionActive(result: CurrentUserProfileResult | null): boolean {
  if (!result) return false;
  if (result.family.subscriptionTier === 'free') return true;
  if (!result.family.subscriptionExpiresAt) return true;
  return result.family.subscriptionExpiresAt > Date.now();
}

/**
 * Check if the user has a family (paid) subscription.
 */
export function hasFamilySubscription(result: CurrentUserProfileResult | null): boolean {
  if (!result) return false;
  return result.family.subscriptionTier === 'family' && isSubscriptionActive(result);
}

/**
 * Get the number of days until subscription expires.
 * Returns null for free tier or if no expiration.
 */
export function getDaysUntilExpiration(result: CurrentUserProfileResult | null): number | null {
  if (!result) return null;
  if (result.family.subscriptionTier === 'free') return null;
  if (!result.family.subscriptionExpiresAt) return null;

  const msUntilExpiration = result.family.subscriptionExpiresAt - Date.now();
  if (msUntilExpiration <= 0) return 0;

  return Math.ceil(msUntilExpiration / (1000 * 60 * 60 * 24));
}

/**
 * Get the appropriate greeting for the current profile.
 */
export function getProfileGreeting(result: CurrentUserProfileResult | null): string {
  if (!result) return 'Welcome!';
  return `Hi, ${result.profile.displayName}!`;
}

/**
 * Check if the user's email is verified.
 */
export function isEmailVerified(result: CurrentUserProfileResult | null): boolean {
  if (!result) return false;
  return result.user.emailVerified;
}

/**
 * Find a specific profile by ID from available profiles.
 */
export function findProfileById(
  result: CurrentUserProfileResult | null,
  profileId: string
): ProfileSummary | undefined {
  if (!result) return undefined;
  return result.availableProfiles.find((p) => p.id === profileId);
}

/**
 * Get the parent profile if it exists.
 */
export function getParentProfileFromResult(
  result: CurrentUserProfileResult | null
): ProfileSummary | undefined {
  if (!result) return undefined;
  return result.availableProfiles.find((p) => p.profileType === 'parent');
}

/**
 * Get all child profiles from the result.
 */
export function getChildProfilesFromResult(
  result: CurrentUserProfileResult | null
): ProfileSummary[] {
  if (!result) return [];
  return result.availableProfiles.filter((p) => p.profileType === 'child');
}

/**
 * Check if the current profile can access parent-only features.
 */
export function canAccessParentFeatures(result: CurrentUserProfileResult | null): boolean {
  return hasParentAccess(result);
}

/**
 * Get subscription status message.
 */
export function getSubscriptionStatusMessage(result: CurrentUserProfileResult | null): string {
  if (!result) return '';

  if (result.family.subscriptionTier === 'free') {
    return 'Free Plan';
  }

  if (!result.family.subscriptionExpiresAt) {
    return 'Family Plan';
  }

  const daysLeft = getDaysUntilExpiration(result);
  if (daysLeft === null) return 'Family Plan';
  if (daysLeft === 0) return 'Subscription Expired';
  if (daysLeft <= 7) return `Family Plan - Expires in ${daysLeft} days`;

  return 'Family Plan';
}

/**
 * Determine the header style based on profile type.
 */
export function getHeaderStyle(
  result: CurrentUserProfileResult | null
): 'parent' | 'child' | 'guest' {
  if (!result) return 'guest';
  return result.profile.profileType === 'parent' ? 'parent' : 'child';
}

/**
 * Check if the result indicates the user needs to complete onboarding.
 */
export function needsOnboarding(result: CurrentUserProfileResult | null): boolean {
  if (!result) return true;
  // User needs onboarding if they have no profiles or email not verified
  return result.availableProfiles.length === 0 || !result.user.emailVerified;
}

// ============================================================================
// PROFILE ACCESS VALIDATION TYPES & HELPERS
// ============================================================================

/**
 * Error reasons for profile access validation.
 */
export type ProfileAccessErrorReason =
  | 'NOT_AUTHENTICATED'
  | 'NO_EMAIL'
  | 'PROFILE_NOT_FOUND'
  | 'FAMILY_NOT_FOUND'
  | 'NOT_OWNER';

/**
 * Error reasons for family access validation.
 */
export type FamilyAccessErrorReason =
  | 'NOT_AUTHENTICATED'
  | 'NO_EMAIL'
  | 'FAMILY_NOT_FOUND'
  | 'NOT_OWNER';

/**
 * Result type for secure profile query.
 */
export interface SecureProfileResult {
  authorized: boolean;
  error: ProfileAccessErrorReason | null;
  message: string | null;
  profile: Profile | null;
}

/**
 * Result type for secure family query.
 */
export interface SecureFamilyResult {
  authorized: boolean;
  error: FamilyAccessErrorReason | null;
  message: string | null;
  family: FamilyInfo | null;
}

/**
 * Result type for secure profiles list query.
 */
export interface SecureProfilesListResult {
  authorized: boolean;
  error: FamilyAccessErrorReason | null;
  message: string | null;
  profiles: Profile[];
}

/**
 * Result type for profile access validation query.
 */
export interface ProfileAccessValidationResult {
  hasAccess: boolean;
  reason: ProfileAccessErrorReason | null;
  message: string | null;
  familyId?: string;
}

/**
 * Result type for family access validation query.
 */
export interface FamilyAccessValidationResult {
  hasAccess: boolean;
  reason: FamilyAccessErrorReason | null;
  message: string | null;
}

/**
 * Check if a secure query result indicates the user is not authenticated.
 */
export function isNotAuthenticated(result: { error?: string | null } | null | undefined): boolean {
  if (!result) return true;
  return result.error === 'NOT_AUTHENTICATED';
}

/**
 * Check if a secure query result indicates unauthorized access.
 */
export function isUnauthorizedAccess(
  result: { authorized?: boolean; error?: string | null } | null | undefined
): boolean {
  if (!result) return true;
  if ('authorized' in result) return !result.authorized;
  return result.error === 'NOT_OWNER';
}

/**
 * Check if a secure query result indicates the profile was not found.
 */
export function isProfileNotFound(result: { error?: string | null } | null | undefined): boolean {
  if (!result) return false;
  return result.error === 'PROFILE_NOT_FOUND';
}

/**
 * Check if a secure query result indicates the family was not found.
 */
export function isFamilyNotFound(result: { error?: string | null } | null | undefined): boolean {
  if (!result) return false;
  return result.error === 'FAMILY_NOT_FOUND';
}

/**
 * Get a user-friendly error message for a profile access error.
 */
export function getProfileAccessErrorMessage(
  reason: ProfileAccessErrorReason | null | undefined
): string {
  switch (reason) {
    case 'NOT_AUTHENTICATED':
      return 'Please sign in to continue';
    case 'NO_EMAIL':
      return 'Your account has no email address associated';
    case 'PROFILE_NOT_FOUND':
      return 'Profile not found';
    case 'FAMILY_NOT_FOUND':
      return 'Family account not found';
    case 'NOT_OWNER':
      return 'You do not have permission to access this profile';
    default:
      return 'An error occurred';
  }
}

/**
 * Get a user-friendly error message for a family access error.
 */
export function getFamilyAccessErrorMessage(
  reason: FamilyAccessErrorReason | null | undefined
): string {
  switch (reason) {
    case 'NOT_AUTHENTICATED':
      return 'Please sign in to continue';
    case 'NO_EMAIL':
      return 'Your account has no email address associated';
    case 'FAMILY_NOT_FOUND':
      return 'Family account not found';
    case 'NOT_OWNER':
      return 'You do not have permission to access this family';
    default:
      return 'An error occurred';
  }
}

/**
 * Determine what action to take based on profile access error.
 */
export function getProfileAccessAction(
  reason: ProfileAccessErrorReason | null | undefined
): 'redirect_login' | 'redirect_home' | 'show_error' | 'none' {
  switch (reason) {
    case 'NOT_AUTHENTICATED':
      return 'redirect_login';
    case 'NOT_OWNER':
      return 'redirect_home';
    case 'NO_EMAIL':
    case 'PROFILE_NOT_FOUND':
    case 'FAMILY_NOT_FOUND':
      return 'show_error';
    default:
      return 'none';
  }
}

/**
 * Check if a result from a secure mutation indicates success.
 */
export function isSecureMutationSuccess(result: { success?: boolean } | null | undefined): boolean {
  if (!result) return false;
  return result.success === true;
}

/**
 * Extract validation errors from a secure mutation result.
 */
export function getSecureMutationErrors(
  result: { errors?: Array<{ field: string; code: string; message: string }> } | null | undefined
): Array<{ field: string; code: string; message: string }> {
  if (!result || !result.errors) return [];
  return result.errors;
}

/**
 * Get validation error messages as a flat array of strings.
 */
export function getSecureMutationErrorMessages(
  result: { errors?: Array<{ message: string }> } | null | undefined
): string[] {
  if (!result || !result.errors) return [];
  return result.errors.map((e) => e.message);
}

/**
 * Check if a secure mutation failed due to authentication.
 */
export function isSecureMutationAuthError(
  result: { error?: string | null } | null | undefined
): boolean {
  if (!result) return false;
  return result.error === 'NOT_AUTHENTICATED' || result.error === 'NO_EMAIL';
}

/**
 * Check if a secure mutation failed due to ownership validation.
 */
export function isSecureMutationOwnershipError(
  result: { error?: string | null } | null | undefined
): boolean {
  if (!result) return false;
  return result.error === 'NOT_OWNER';
}
