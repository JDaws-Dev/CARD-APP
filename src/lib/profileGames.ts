/**
 * Profile Games utility functions
 *
 * Pure functions for managing which trading card games a profile has enabled.
 * Used by both client-side code and Convex backend.
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Valid game slugs
 */
export type GameSlug =
  | 'pokemon'
  | 'yugioh'
  | 'mtg'
  | 'onepiece'
  | 'lorcana'
  | 'digimon'
  | 'dragonball';

/**
 * Profile game entry (from database)
 */
export interface ProfileGame {
  profileId: string;
  gameSlug: GameSlug;
  enabledAt: number;
  isActive?: boolean;
}

/**
 * Game info for display
 */
export interface GameInfo {
  slug: GameSlug;
  displayName: string;
  primaryColor: string;
  secondaryColor?: string;
}

/**
 * Profile game with full game info
 */
export interface ProfileGameWithInfo extends ProfileGame {
  gameInfo?: GameInfo;
}

/**
 * Game selection action result
 */
export type GameAction = 'enabled' | 're_enabled' | 'already_enabled' | 'disabled' | 'removed';

/**
 * Game statistics for a profile
 */
export interface ProfileGameStats {
  totalEnabled: number;
  totalDisabled: number;
  enabledGames: GameSlug[];
  disabledGames: GameSlug[];
  firstGameEnabled: { slug: GameSlug; enabledAt: number } | null;
  lastGameEnabled: { slug: GameSlug; enabledAt: number } | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * All valid game slugs
 */
export const GAME_SLUGS: readonly GameSlug[] = [
  'pokemon',
  'yugioh',
  'mtg',
  'onepiece',
  'lorcana',
  'digimon',
  'dragonball',
] as const;

/**
 * Default game for new profiles
 */
export const DEFAULT_GAME: GameSlug = 'pokemon';

/**
 * Game display names
 */
export const GAME_DISPLAY_NAMES: Record<GameSlug, string> = {
  pokemon: 'Pok\u00e9mon TCG',
  yugioh: 'Yu-Gi-Oh!',
  mtg: 'Magic: The Gathering',
  onepiece: 'One Piece TCG',
  lorcana: 'Disney Lorcana',
  digimon: 'Digimon TCG',
  dragonball: 'Dragon Ball Fusion World',
};

/**
 * Game primary colors (for branding)
 */
export const GAME_COLORS: Record<GameSlug, string> = {
  pokemon: '#FFCB05',
  yugioh: '#1D1D1D',
  mtg: '#000000',
  onepiece: '#E74C3C',
  lorcana: '#1B1464',
  digimon: '#FF6600',
  dragonball: '#FF8C00',
};

/**
 * Game release order (for sorting)
 */
export const GAME_RELEASE_ORDER: Record<GameSlug, number> = {
  pokemon: 1,
  yugioh: 2,
  mtg: 3,
  onepiece: 4,
  lorcana: 5,
  digimon: 6,
  dragonball: 7,
};

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Check if a string is a valid game slug
 */
export function isValidGameSlug(slug: string): slug is GameSlug {
  return GAME_SLUGS.includes(slug as GameSlug);
}

/**
 * Validate an array of game slugs
 * Returns valid slugs and any invalid ones
 */
export function validateGameSlugs(slugs: string[]): {
  valid: GameSlug[];
  invalid: string[];
} {
  const valid: GameSlug[] = [];
  const invalid: string[] = [];

  for (const slug of slugs) {
    if (isValidGameSlug(slug)) {
      valid.push(slug);
    } else {
      invalid.push(slug);
    }
  }

  return { valid, invalid };
}

/**
 * Check if a profile game entry is active
 */
export function isProfileGameActive(profileGame: ProfileGame): boolean {
  return profileGame.isActive !== false;
}

// =============================================================================
// FILTERING AND QUERYING
// =============================================================================

/**
 * Filter profile games to only active ones
 */
export function filterActiveGames(profileGames: ProfileGame[]): ProfileGame[] {
  return profileGames.filter(isProfileGameActive);
}

/**
 * Filter profile games to only inactive ones
 */
export function filterInactiveGames(profileGames: ProfileGame[]): ProfileGame[] {
  return profileGames.filter((pg) => pg.isActive === false);
}

/**
 * Get enabled game slugs from profile games
 */
export function getEnabledSlugs(profileGames: ProfileGame[]): GameSlug[] {
  return filterActiveGames(profileGames).map((pg) => pg.gameSlug);
}

/**
 * Get disabled game slugs from profile games
 */
export function getDisabledSlugs(profileGames: ProfileGame[]): GameSlug[] {
  return filterInactiveGames(profileGames).map((pg) => pg.gameSlug);
}

/**
 * Check if a specific game is enabled
 */
export function isGameEnabled(profileGames: ProfileGame[], gameSlug: GameSlug): boolean {
  const game = profileGames.find((pg) => pg.gameSlug === gameSlug);
  return game ? isProfileGameActive(game) : false;
}

/**
 * Find a profile game by slug
 */
export function findProfileGame(
  profileGames: ProfileGame[],
  gameSlug: GameSlug
): ProfileGame | undefined {
  return profileGames.find((pg) => pg.gameSlug === gameSlug);
}

/**
 * Get games that are not yet tracked for a profile
 */
export function getUntrackedGames(profileGames: ProfileGame[]): GameSlug[] {
  const trackedSlugs = new Set(profileGames.map((pg) => pg.gameSlug));
  return GAME_SLUGS.filter((slug) => !trackedSlugs.has(slug));
}

/**
 * Get games that can be enabled (not currently active)
 */
export function getAvailableGames(profileGames: ProfileGame[]): GameSlug[] {
  const activeSlugs = new Set(getEnabledSlugs(profileGames));
  return GAME_SLUGS.filter((slug) => !activeSlugs.has(slug));
}

// =============================================================================
// SORTING
// =============================================================================

/**
 * Sort profile games by enabled date (oldest first)
 */
export function sortByEnabledDate(profileGames: ProfileGame[], ascending = true): ProfileGame[] {
  const sorted = [...profileGames].sort((a, b) => a.enabledAt - b.enabledAt);
  return ascending ? sorted : sorted.reverse();
}

/**
 * Sort profile games by release order (original TCG release)
 */
export function sortByReleaseOrder(profileGames: ProfileGame[], ascending = true): ProfileGame[] {
  const sorted = [...profileGames].sort(
    (a, b) => GAME_RELEASE_ORDER[a.gameSlug] - GAME_RELEASE_ORDER[b.gameSlug]
  );
  return ascending ? sorted : sorted.reverse();
}

/**
 * Sort profile games alphabetically by display name
 */
export function sortByDisplayName(profileGames: ProfileGame[], ascending = true): ProfileGame[] {
  const sorted = [...profileGames].sort((a, b) =>
    GAME_DISPLAY_NAMES[a.gameSlug].localeCompare(GAME_DISPLAY_NAMES[b.gameSlug])
  );
  return ascending ? sorted : sorted.reverse();
}

/**
 * Sort game slugs by release order
 */
export function sortSlugsByReleaseOrder(slugs: GameSlug[], ascending = true): GameSlug[] {
  const sorted = [...slugs].sort((a, b) => GAME_RELEASE_ORDER[a] - GAME_RELEASE_ORDER[b]);
  return ascending ? sorted : sorted.reverse();
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Calculate profile game statistics
 */
export function calculateProfileGameStats(profileGames: ProfileGame[]): ProfileGameStats {
  const activeGames = filterActiveGames(profileGames);
  const inactiveGames = filterInactiveGames(profileGames);

  // Find first and last enabled
  let firstEnabled: ProfileGame | null = null;
  let lastEnabled: ProfileGame | null = null;

  for (const pg of activeGames) {
    if (!firstEnabled || pg.enabledAt < firstEnabled.enabledAt) {
      firstEnabled = pg;
    }
    if (!lastEnabled || pg.enabledAt > lastEnabled.enabledAt) {
      lastEnabled = pg;
    }
  }

  return {
    totalEnabled: activeGames.length,
    totalDisabled: inactiveGames.length,
    enabledGames: activeGames.map((pg) => pg.gameSlug),
    disabledGames: inactiveGames.map((pg) => pg.gameSlug),
    firstGameEnabled: firstEnabled
      ? { slug: firstEnabled.gameSlug, enabledAt: firstEnabled.enabledAt }
      : null,
    lastGameEnabled: lastEnabled
      ? { slug: lastEnabled.gameSlug, enabledAt: lastEnabled.enabledAt }
      : null,
  };
}

/**
 * Count enabled games
 */
export function countEnabledGames(profileGames: ProfileGame[]): number {
  return filterActiveGames(profileGames).length;
}

/**
 * Count disabled games (previously enabled)
 */
export function countDisabledGames(profileGames: ProfileGame[]): number {
  return filterInactiveGames(profileGames).length;
}

/**
 * Check if profile has any games enabled
 */
export function hasAnyGamesEnabled(profileGames: ProfileGame[]): boolean {
  return countEnabledGames(profileGames) > 0;
}

/**
 * Check if profile has all games enabled
 */
export function hasAllGamesEnabled(profileGames: ProfileGame[]): boolean {
  return countEnabledGames(profileGames) === GAME_SLUGS.length;
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Get display name for a game slug
 */
export function getGameDisplayName(slug: GameSlug): string {
  return GAME_DISPLAY_NAMES[slug];
}

/**
 * Get primary color for a game slug
 */
export function getGameColor(slug: GameSlug): string {
  return GAME_COLORS[slug];
}

/**
 * Get release order for a game slug
 */
export function getGameReleaseOrder(slug: GameSlug): number {
  return GAME_RELEASE_ORDER[slug];
}

/**
 * Get full game info for a slug
 */
export function getGameInfo(slug: GameSlug): GameInfo {
  return {
    slug,
    displayName: GAME_DISPLAY_NAMES[slug],
    primaryColor: GAME_COLORS[slug],
  };
}

/**
 * Get game info for all games
 */
export function getAllGameInfo(): GameInfo[] {
  return GAME_SLUGS.map(getGameInfo);
}

/**
 * Get game info sorted by release order
 */
export function getAllGameInfoSorted(): GameInfo[] {
  return sortSlugsByReleaseOrder([...GAME_SLUGS]).map(getGameInfo);
}

/**
 * Format enabled games for display (comma-separated)
 */
export function formatEnabledGamesForDisplay(profileGames: ProfileGame[], maxDisplay = 3): string {
  const enabled = getEnabledSlugs(profileGames);
  const displayNames = enabled.map(getGameDisplayName);

  if (displayNames.length === 0) {
    return 'No games selected';
  }

  if (displayNames.length <= maxDisplay) {
    return displayNames.join(', ');
  }

  const shown = displayNames.slice(0, maxDisplay);
  const remaining = displayNames.length - maxDisplay;
  return `${shown.join(', ')} +${remaining} more`;
}

/**
 * Format enabled date for display
 */
export function formatEnabledDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format enabled date relative (e.g., "2 days ago")
 */
export function formatEnabledDateRelative(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) {
    return formatEnabledDate(timestamp);
  }
  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  return 'Just now';
}

// =============================================================================
// CHANGE DETECTION
// =============================================================================

/**
 * Compare two sets of games and find changes
 */
export function compareGameSelections(
  currentSlugs: GameSlug[],
  newSlugs: GameSlug[]
): {
  added: GameSlug[];
  removed: GameSlug[];
  unchanged: GameSlug[];
} {
  const currentSet = new Set(currentSlugs);
  const newSet = new Set(newSlugs);

  const added: GameSlug[] = [];
  const removed: GameSlug[] = [];
  const unchanged: GameSlug[] = [];

  // Find added and unchanged
  for (const slug of newSlugs) {
    if (currentSet.has(slug)) {
      unchanged.push(slug);
    } else {
      added.push(slug);
    }
  }

  // Find removed
  for (const slug of currentSlugs) {
    if (!newSet.has(slug)) {
      removed.push(slug);
    }
  }

  return { added, removed, unchanged };
}

/**
 * Check if game selections have changed
 */
export function hasSelectionChanged(currentSlugs: GameSlug[], newSlugs: GameSlug[]): boolean {
  const { added, removed } = compareGameSelections(currentSlugs, newSlugs);
  return added.length > 0 || removed.length > 0;
}

/**
 * Generate a summary of selection changes
 */
export function getSelectionChangeSummary(currentSlugs: GameSlug[], newSlugs: GameSlug[]): string {
  const { added, removed } = compareGameSelections(currentSlugs, newSlugs);

  if (added.length === 0 && removed.length === 0) {
    return 'No changes';
  }

  const parts: string[] = [];

  if (added.length > 0) {
    const names = added.map(getGameDisplayName).join(', ');
    parts.push(`Added: ${names}`);
  }

  if (removed.length > 0) {
    const names = removed.map(getGameDisplayName).join(', ');
    parts.push(`Removed: ${names}`);
  }

  return parts.join('; ');
}

// =============================================================================
// ENRICHMENT
// =============================================================================

/**
 * Enrich profile games with game info
 */
export function enrichProfileGamesWithInfo(profileGames: ProfileGame[]): ProfileGameWithInfo[] {
  return profileGames.map((pg) => ({
    ...pg,
    gameInfo: getGameInfo(pg.gameSlug),
  }));
}

/**
 * Create a lookup map of profile games by slug
 */
export function createProfileGameMap(profileGames: ProfileGame[]): Map<GameSlug, ProfileGame> {
  return new Map(profileGames.map((pg) => [pg.gameSlug, pg]));
}

// =============================================================================
// ONBOARDING HELPERS
// =============================================================================

/**
 * Get recommended games for new users
 * Returns games in order of popularity/accessibility
 */
export function getRecommendedGamesForOnboarding(): GameSlug[] {
  // Pokemon first as most accessible, then other popular TCGs
  return ['pokemon', 'yugioh', 'mtg', 'lorcana', 'onepiece', 'digimon', 'dragonball'];
}

/**
 * Get minimum games message
 */
export function getMinGamesMessage(): string {
  return 'Please select at least one game to collect';
}

/**
 * Validate onboarding selection
 */
export function validateOnboardingSelection(selectedSlugs: GameSlug[]): {
  valid: boolean;
  error?: string;
} {
  if (selectedSlugs.length === 0) {
    return { valid: false, error: getMinGamesMessage() };
  }

  // All selected slugs must be valid
  const invalidSlugs = selectedSlugs.filter((slug) => !isValidGameSlug(slug));
  if (invalidSlugs.length > 0) {
    return { valid: false, error: `Invalid games: ${invalidSlugs.join(', ')}` };
  }

  return { valid: true };
}
