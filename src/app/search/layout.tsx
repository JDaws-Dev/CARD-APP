import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Cards | CardDex',
  description:
    'Search for specific trading cards across Pokemon, Yu-Gi-Oh, One Piece, and Lorcana collections by name, number, set, or rarity in the CardDex database.',
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
