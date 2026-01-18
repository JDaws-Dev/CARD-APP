/**
 * Display Name Utility Functions
 *
 * Provides robust display name handling with fallbacks for cases where
 * the database display name might be an email prefix instead of a real name.
 */

import { loadOnboardingProgress } from './onboardingFlow';

/**
 * Checks if a display name looks like an email prefix (e.g., "jedaws" from "jedaws@email.com").
 * Also detects names derived from emails by OAuth providers (e.g., "JE Dawes" from "jedawes@...").
 * Returns true if it looks like an email-derived name that should be replaced.
 */
export function looksLikeEmailPrefix(name: string | undefined | null): boolean {
  if (!name) return true;
  const trimmed = name.trim();
  if (!trimmed) return true;

  // If it's less than 2 chars, it's probably not a real name
  if (trimmed.length < 2) return true;

  // Check for common email-like patterns:
  // - Contains numbers mixed with letters (like "john123")
  // - Looks like it could be the part before @ in an email
  const hasNumbersAndLetters = /[a-z]/i.test(trimmed) && /\d/.test(trimmed);
  const hasNoSpaces = !trimmed.includes(' ');
  const isAllLowercase = trimmed === trimmed.toLowerCase();

  // If it has numbers mixed with letters and no spaces, likely an email prefix
  if (hasNoSpaces && isAllLowercase && hasNumbersAndLetters) {
    return true;
  }

  // Check for OAuth-derived name patterns like "JE Dawes" from "jedawes@email.com"
  // Pattern: 1-3 uppercase letters/initials followed by a capitalized surname
  // This catches names like "JE Dawes", "J Smith", "AB Jones"
  const initialsPattern = /^[A-Z]{1,3}\s+[A-Z][a-z]+$/;
  if (initialsPattern.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Get the best display name to show, with fallbacks:
 * 1. Database displayName (if it doesn't look like an email prefix)
 * 2. Profile name from onboarding localStorage
 * 3. Generic "Collector" fallback
 */
export function getDisplayName(dbDisplayName: string | undefined | null): string {
  // If the database name looks valid, use it
  if (dbDisplayName && !looksLikeEmailPrefix(dbDisplayName)) {
    return dbDisplayName;
  }

  // Try to get the name from onboarding progress (localStorage)
  try {
    const onboardingProgress = loadOnboardingProgress();
    if (onboardingProgress?.profileName && onboardingProgress.profileName.trim()) {
      return onboardingProgress.profileName.trim();
    }
  } catch {
    // localStorage might not be available (SSR)
  }

  // If database name exists but looks like email, still use it as last resort
  // before the generic fallback (user might have intentionally used lowercase name)
  if (dbDisplayName && dbDisplayName.trim()) {
    return dbDisplayName;
  }

  // Final fallback
  return 'Collector';
}
