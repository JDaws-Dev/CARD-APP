import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Cards | CardDex',
  description:
    'Browse and filter trading cards by set, type, rarity, and more. Discover new cards to add to your Pokemon, Yu-Gi-Oh, One Piece, or Lorcana collection.',
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
