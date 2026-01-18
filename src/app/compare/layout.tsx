import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Cards | CardDex',
  description:
    'Compare multiple trading cards side by side on CardDex. Analyze stats, rarity, value, and market prices to decide which cards to add to your collection.',
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
