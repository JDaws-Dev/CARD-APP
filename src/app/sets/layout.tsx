import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Sets | CardDex',
  description:
    'Browse all trading card sets for Pokemon, Yu-Gi-Oh, One Piece, and Lorcana. Find cards by set, view release dates, and track your collection with CardDex.',
};

export default function SetsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
