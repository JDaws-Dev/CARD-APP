import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Collection | CardDex',
  description:
    'View and manage your complete trading card collection in CardDex. Track owned cards, organize by sets, and monitor your collecting progress over time.',
};

export default function CollectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
