/**
 * Game Selector Content - Configuration for supported TCG games
 * Provides game metadata, display information, and selection utilities
 * for the multi-game onboarding experience.
 *
 * This module defines all supported trading card games and provides
 * lookup functions for game information.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Supported TCG game identifiers
 * Note: Only 4 games are currently supported: Pokemon, Yu-Gi-Oh!, One Piece, and Disney Lorcana
 */
export type GameId = 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana';

/**
 * Game information for display and theming
 */
export interface GameInfo {
  /** Unique game identifier */
  id: GameId;
  /** Display name */
  name: string;
  /** Short name for compact displays */
  shortName: string;
  /** Game description for onboarding */
  description: string;
  /** Kid-friendly tagline */
  tagline: string;
  /** CSS gradient start color class */
  gradientFrom: string;
  /** CSS gradient end color class */
  gradientTo: string;
  /** Primary color class for accents */
  primaryColor: string;
  /** Background color class (lighter) */
  bgColor: string;
  /** Border color class */
  borderColor: string;
  /** Text color class */
  textColor: string;
  /** Icon name from Heroicons (placeholder until custom logos) */
  iconName: string;
  /** Whether API integration is available */
  hasApiSupport: boolean;
  /** Popular appeal points for kids */
  appealPoints: string[];
}

/**
 * User's selected games configuration
 */
export interface SelectedGames {
  /** Primary game (shown first, used as default) */
  primary: GameId;
  /** Additional enabled games */
  enabled: GameId[];
}

// ============================================================================
// GAME DEFINITIONS
// ============================================================================

/**
 * All supported TCG games with their metadata.
 * Order determines display order in the selector.
 */
export const GAMES: readonly GameInfo[] = [
  {
    id: 'pokemon',
    name: 'Pokémon TCG',
    shortName: 'Pokémon',
    description:
      'Collect cards featuring your favorite Pokémon! Build decks, complete sets, and catch rare cards.',
    tagline: 'Gotta collect them all!',
    gradientFrom: 'from-yellow-400',
    gradientTo: 'to-red-500',
    primaryColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    textColor: 'text-yellow-800',
    iconName: 'SparklesIcon',
    hasApiSupport: true,
    appealPoints: [
      'Pikachu, Charizard & more!',
      'Beautiful holographic cards',
      'Hundreds of sets to explore',
    ],
  },
  {
    id: 'yugioh',
    name: 'Yu-Gi-Oh!',
    shortName: 'Yu-Gi-Oh!',
    description:
      "It's time to duel! Collect powerful monsters, spells, and traps from the legendary card game.",
    tagline: "It's time to duel!",
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-indigo-600',
    primaryColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-800',
    iconName: 'BoltIcon',
    hasApiSupport: true,
    appealPoints: ['Dark Magician & Blue-Eyes', 'Epic monster battles', 'Classic anime cards'],
  },
  {
    id: 'onepiece',
    name: 'One Piece Card Game',
    shortName: 'One Piece',
    description:
      "Set sail with Luffy and the Straw Hat crew! Collect cards from the world's most popular manga.",
    tagline: 'Set sail for adventure!',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-orange-500',
    primaryColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    textColor: 'text-red-800',
    iconName: 'FireIcon',
    hasApiSupport: true,
    appealPoints: ['Luffy & the Straw Hats', 'Brand new card game', 'Amazing anime artwork'],
  },
  {
    id: 'lorcana',
    name: 'Disney Lorcana',
    shortName: 'Lorcana',
    description:
      'Enter the magical world of Disney! Collect enchanted cards featuring beloved Disney characters.',
    tagline: 'Magic awaits!',
    gradientFrom: 'from-blue-400',
    gradientTo: 'to-cyan-500',
    primaryColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-800',
    iconName: 'SparklesIcon',
    hasApiSupport: true,
    appealPoints: ['Mickey, Elsa & friends', 'Stunning Disney artwork', 'Magical ink colors'],
  },
] as const;

/**
 * Default selected games for new users.
 */
export const DEFAULT_SELECTED_GAMES: SelectedGames = {
  primary: 'pokemon',
  enabled: ['pokemon'],
};

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get game info by ID.
 */
export function getGameInfo(gameId: GameId): GameInfo | null {
  return GAMES.find((g) => g.id === gameId) ?? null;
}

/**
 * Get game info by ID, with fallback to Pokemon.
 */
export function getGameInfoSafe(gameId: GameId): GameInfo {
  return GAMES.find((g) => g.id === gameId) ?? GAMES[0];
}

/**
 * Get all games.
 */
export function getAllGames(): readonly GameInfo[] {
  return GAMES;
}

/**
 * Get games with API support.
 */
export function getGamesWithApiSupport(): GameInfo[] {
  return GAMES.filter((g) => g.hasApiSupport);
}

/**
 * Get game count.
 */
export function getGameCount(): number {
  return GAMES.length;
}

/**
 * Check if a game ID is valid.
 */
export function isValidGameId(id: string): id is GameId {
  return GAMES.some((g) => g.id === id);
}

/**
 * Get games by IDs (preserves order of input IDs).
 */
export function getGamesByIds(ids: GameId[]): GameInfo[] {
  return ids.map((id) => getGameInfo(id)).filter((g): g is GameInfo => g !== null);
}

/**
 * Get the default game (Pokemon).
 */
export function getDefaultGame(): GameInfo {
  return GAMES[0];
}

// ============================================================================
// ONBOARDING CONTENT
// ============================================================================

/**
 * Onboarding content for the game selector.
 */
export const GAME_SELECTOR_ONBOARDING = {
  id: 'game-selector',
  title: 'What do you collect?',
  subtitle: "Pick the card games you're into!",
  description:
    'Choose the trading card games you want to track. You can always add or remove games later in settings. Pick at least one to get started!',
  tip: "Don't see your favorite? More games coming soon!",
  gradientFrom: 'from-indigo-500',
  gradientTo: 'to-purple-500',
} as const;

/**
 * Get onboarding content.
 */
export function getGameSelectorOnboarding(): typeof GAME_SELECTOR_ONBOARDING {
  return GAME_SELECTOR_ONBOARDING;
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

const STORAGE_KEY = 'carddex-selected-games';
const ONBOARDING_COMPLETE_KEY = 'carddex-game-onboarding-complete';

/**
 * Save selected games to localStorage.
 */
export function saveSelectedGames(games: SelectedGames): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Load selected games from localStorage.
 */
export function loadSelectedGames(): SelectedGames | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as SelectedGames;

    // Validate the loaded data
    if (!parsed.primary || !isValidGameId(parsed.primary)) return null;
    if (!Array.isArray(parsed.enabled)) return null;
    if (!parsed.enabled.every((id) => isValidGameId(id))) return null;

    // Ensure primary is in enabled list
    if (!parsed.enabled.includes(parsed.primary)) {
      parsed.enabled = [parsed.primary, ...parsed.enabled];
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Check if game onboarding has been completed.
 */
export function hasCompletedGameOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark game onboarding as complete.
 */
export function markGameOnboardingComplete(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
  } catch {
    // Ignore storage errors
  }
}

/**
 * Reset game onboarding completion status.
 */
export function resetGameOnboarding(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get a formatted string of enabled games.
 */
export function formatEnabledGames(games: SelectedGames): string {
  if (games.enabled.length === 0) return 'No games selected';
  if (games.enabled.length === 1) {
    const game = getGameInfo(games.enabled[0]);
    return game?.shortName ?? 'Unknown';
  }
  if (games.enabled.length === 2) {
    const names = games.enabled.map((id) => getGameInfo(id)?.shortName ?? 'Unknown');
    return names.join(' & ');
  }
  // 3+ games
  const primaryGame = getGameInfo(games.primary);
  return `${primaryGame?.shortName ?? 'Unknown'} +${games.enabled.length - 1} more`;
}

/**
 * Get CSS classes for a game's gradient background.
 */
export function getGameGradientClasses(gameId: GameId): string {
  const game = getGameInfo(gameId);
  if (!game) return 'from-gray-400 to-gray-500';
  return `${game.gradientFrom} ${game.gradientTo}`;
}

/**
 * Get CSS classes for a game's theme (background, border, text).
 */
export function getGameThemeClasses(gameId: GameId): {
  bg: string;
  border: string;
  text: string;
  primary: string;
} {
  const game = getGameInfo(gameId);
  if (!game) {
    return {
      bg: 'bg-gray-50',
      border: 'border-gray-300',
      text: 'text-gray-800',
      primary: 'text-gray-600',
    };
  }
  return {
    bg: game.bgColor,
    border: game.borderColor,
    text: game.textColor,
    primary: game.primaryColor,
  };
}

// ============================================================================
// CSS VARIABLE THEMING
// ============================================================================

/**
 * CSS variable values for each game's theme.
 * These map to the CSS custom properties defined in globals.css.
 */
export interface GameCssVariables {
  /** Primary color (hex) */
  primary: string;
  /** Primary color RGB values for alpha support */
  primaryRgb: string;
  /** Secondary color (hex) */
  secondary: string;
  /** Secondary color RGB values */
  secondaryRgb: string;
  /** Accent/background color (hex) */
  accent: string;
  /** Accent color RGB values */
  accentRgb: string;
  /** Text color (hex) */
  text: string;
  /** Text color RGB values */
  textRgb: string;
  /** Border color (hex) */
  border: string;
  /** Border color RGB values */
  borderRgb: string;
}

/**
 * CSS variable values for all supported games.
 * Colors are chosen to be vibrant but accessible for kids.
 */
export const GAME_CSS_VARIABLES: Record<GameId, GameCssVariables> = {
  pokemon: {
    primary: '#eab308', // Yellow-500
    primaryRgb: '234, 179, 8',
    secondary: '#ef4444', // Red-500
    secondaryRgb: '239, 68, 68',
    accent: '#fef3c7', // Amber-100
    accentRgb: '254, 243, 199',
    text: '#92400e', // Amber-800
    textRgb: '146, 64, 14',
    border: '#fcd34d', // Yellow-300
    borderRgb: '252, 211, 77',
  },
  yugioh: {
    primary: '#8b5cf6', // Violet-500
    primaryRgb: '139, 92, 246',
    secondary: '#4f46e5', // Indigo-600
    secondaryRgb: '79, 70, 229',
    accent: '#ede9fe', // Violet-100
    accentRgb: '237, 233, 254',
    text: '#5b21b6', // Violet-800
    textRgb: '91, 33, 182',
    border: '#a78bfa', // Violet-400
    borderRgb: '167, 139, 250',
  },
  onepiece: {
    primary: '#ef4444', // Red-500
    primaryRgb: '239, 68, 68',
    secondary: '#f97316', // Orange-500
    secondaryRgb: '249, 115, 22',
    accent: '#fef2f2', // Red-50
    accentRgb: '254, 242, 242',
    text: '#991b1b', // Red-800
    textRgb: '153, 27, 27',
    border: '#fca5a5', // Red-300
    borderRgb: '252, 165, 165',
  },
  lorcana: {
    primary: '#3b82f6', // Blue-500
    primaryRgb: '59, 130, 246',
    secondary: '#06b6d4', // Cyan-500
    secondaryRgb: '6, 182, 212',
    accent: '#eff6ff', // Blue-50
    accentRgb: '239, 246, 255',
    text: '#1e40af', // Blue-800
    textRgb: '30, 64, 175',
    border: '#93c5fd', // Blue-300
    borderRgb: '147, 197, 253',
  },
};

/**
 * Get CSS variables for a specific game.
 */
export function getGameCssVariables(gameId: GameId): GameCssVariables {
  return GAME_CSS_VARIABLES[gameId] ?? GAME_CSS_VARIABLES.pokemon;
}

/**
 * Generate CSS variable assignments as a style object.
 * Use this to set inline styles on a container element to theme its children.
 */
export function getGameThemeStyles(gameId: GameId): Record<string, string> {
  const vars = getGameCssVariables(gameId);
  return {
    '--game-primary': vars.primary,
    '--game-primary-rgb': vars.primaryRgb,
    '--game-secondary': vars.secondary,
    '--game-secondary-rgb': vars.secondaryRgb,
    '--game-accent': vars.accent,
    '--game-accent-rgb': vars.accentRgb,
    '--game-text': vars.text,
    '--game-text-rgb': vars.textRgb,
    '--game-border': vars.border,
    '--game-border-rgb': vars.borderRgb,
  };
}

/**
 * Get the CSS variable name for a game-specific color.
 * Useful for referencing static per-game colors in multi-game displays.
 */
export function getGameCssVariableName(
  gameId: GameId,
  colorType: 'primary' | 'secondary' | 'accent' | 'text' | 'border'
): string {
  return `--game-${gameId}-${colorType}`;
}

/**
 * Get inline style using a game-specific CSS variable.
 */
export function getGameColorStyle(
  gameId: GameId,
  colorType: 'primary' | 'secondary' | 'accent' | 'text' | 'border',
  cssProperty: string = 'color'
): Record<string, string> {
  return {
    [cssProperty]: `var(${getGameCssVariableName(gameId, colorType)})`,
  };
}
