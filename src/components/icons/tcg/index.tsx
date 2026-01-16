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
 * Dragon Ball Icon - Stylized Dragon Ball with Star
 */
export function DragonBallIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {/* Outer ball */}
      <circle cx="12" cy="12" r="10" />
      {/* Inner glow */}
      <circle cx="12" cy="12" r="8" fillOpacity="0.3" />
      {/* Four-point star */}
      <path d="M12 6l1.5 4.5L18 12l-4.5 1.5L12 18l-1.5-4.5L6 12l4.5-1.5L12 6z" fillOpacity="0.8" />
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
 * Digimon Icon - Stylized Digivice/Digital Monster
 */
export function DigimonIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {/* Digivice outer shape */}
      <path d="M7 4h10c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      {/* Screen */}
      <rect x="8" y="6" width="8" height="6" rx="1" fillOpacity="0.4" />
      {/* Button row */}
      <circle cx="9" cy="16" r="1.5" fillOpacity="0.6" />
      <circle cx="15" cy="16" r="1.5" fillOpacity="0.6" />
      {/* Digital pattern on screen */}
      <path d="M10 8h4M9 10h2M13 10h2" stroke="currentColor" strokeWidth="0.5" fill="none" />
    </svg>
  );
}

/**
 * Magic: The Gathering Icon - Stylized Planeswalker Symbol/Mana
 */
export function MtgIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {/* Pentagon/planeswalker shape */}
      <path d="M12 2l8.09 5.87-3.09 9.5H7l-3.09-9.5L12 2z" />
      {/* Inner pentagon */}
      <path d="M12 6l4.85 3.53-1.85 5.7H9l-1.85-5.7L12 6z" fillOpacity="0.4" />
      {/* Center point */}
      <circle cx="12" cy="11" r="2" fillOpacity="0.7" />
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
 */
export const GAME_ICONS = {
  pokemon: PokemonIcon,
  yugioh: YugiohIcon,
  onepiece: OnePieceIcon,
  dragonball: DragonBallIcon,
  lorcana: LorcanaIcon,
  digimon: DigimonIcon,
  mtg: MtgIcon,
} as const;

/**
 * Get icon component for a game by ID
 */
export function getGameIcon(
  gameId: keyof typeof GAME_ICONS
): (typeof GAME_ICONS)[keyof typeof GAME_ICONS] {
  return GAME_ICONS[gameId] ?? GenericTcgIcon;
}
