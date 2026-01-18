import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collection Timeline | CardDex',
  description:
    'View your collection activity timeline on CardDex. See when you added cards, earned badges, and reached collection milestones throughout your journey.',
};

export default function TimelineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
