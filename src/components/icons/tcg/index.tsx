/**
 * TCG Logo Icons - SVG icon components for each supported trading card game
 *
 * These icons are stylized representations (not official logos) designed to be
 * visually distinctive and kid-friendly. Each icon is a 24x24 SVG that accepts
 * standard className props for sizing and coloring.
 */

import { type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Pokemon TCG Icon - Stylized Pokeball
 */
export function PokemonIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {/* Pokeball top half */}
      <path d="M12 2C6.48 2 2 6.48 2 12h4c0-3.31 2.69-6 6-6s6 2.69 6 6h4c0-5.52-4.48-10-10-10z" />
      {/* Pokeball bottom half */}
      <path
        d="M12 22c5.52 0 10-4.48 10-10h-4c0 3.31-2.69 6-6 6s-6-2.69-6-6H2c0 5.52 4.48 10 10 10z"
        fillOpacity="0.6"
      />
      {/* Center button */}
      <circle cx="12" cy="12" r="3" />
      {/* Center ring */}
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

/**
 * Yu-Gi-Oh! Icon - Stylized Millennium Eye/Pyramid
 */
export function YugiohIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {/* Pyramid shape */}
      <path d="M12 2L3 20h18L12 2zm0 4l6 12H6l6-12z" />
      {/* Eye in center */}
      <ellipse cx="12" cy="13" rx="2.5" ry="1.5" />
      <circle cx="12" cy="13" r="0.8" fillOpacity="0.5" />
    </svg>
  );
}

/**
 * One Piece Icon - Stylized Straw Hat
 */
export function OnePieceIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {/* Hat brim */}
      <ellipse cx="12" cy="16" rx="10" ry="3" />
      {/* Hat dome */}
      <path d="M6 16c0-4 2.69-8 6-8s6 4 6 8" />
      {/* Hat band */}
      <rect x="6" y="13" width="12" height="2" fillOpacity="0.7" rx="0.5" />
    </svg>
  );
}


/**
 * Disney Lorcana Icon - Stylized Magic Ink Drop/Sparkle
 */
export function LorcanaIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {/* Ink drop shape */}
      <path d="M12 2C12 2 6 10 6 14c0 3.31 2.69 6 6 6s6-2.69 6-6c0-4-6-12-6-12z" />
      {/* Magic sparkle inside */}
      <path d="M12 10l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5z" fillOpacity="0.5" />
      {/* Small sparkle top */}
      <circle cx="14" cy="8" r="1" fillOpacity="0.6" />
    </svg>
  );
}



/**
 * Generic Card Game Icon - For future games or fallback
 */
export function GenericTcgIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {/* Card stack */}
      <rect x="6" y="4" width="12" height="16" rx="1.5" fillOpacity="0.3" />
      <rect x="5" y="5" width="12" height="16" rx="1.5" fillOpacity="0.5" />
      <rect x="4" y="6" width="12" height="16" rx="1.5" />
      {/* Card face design */}
      <circle cx="10" cy="14" r="3" fillOpacity="0.4" />
    </svg>
  );
}

/**
 * Map of game IDs to their icon components
 * Note: Only 4 games are currently supported: Pokemon, Yu-Gi-Oh!, One Piece, and Disney Lorcana
 */
export const GAME_ICONS = {
  pokemon: PokemonIcon,
  yugioh: YugiohIcon,
  onepiece: OnePieceIcon,
  lorcana: LorcanaIcon,
} as const;

/**
 * Map of game IDs to their display names for accessibility
 */
export const GAME_NAMES: Record<keyof typeof GAME_ICONS, string> = {
  pokemon: 'Pokémon',
  yugioh: 'Yu-Gi-Oh!',
  onepiece: 'One Piece',
  lorcana: 'Disney Lorcana',
};

/**
 * Get icon component for a game by ID
 */
export function getGameIcon(
  gameId: keyof typeof GAME_ICONS
): (typeof GAME_ICONS)[keyof typeof GAME_ICONS] {
  return GAME_ICONS[gameId] ?? GenericTcgIcon;
}

/**
 * Get the display name for a game by ID (for accessibility)
 */
export function getGameIconName(gameId: keyof typeof GAME_ICONS): string {
  return GAME_NAMES[gameId] ?? 'Card Game';
}
