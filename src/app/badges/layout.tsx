import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trophy Case | CardDex',
  description:
    'View your earned badges and achievements in the CardDex trophy case. Celebrate your collection milestones, level-ups, and progress as a card collector.',
};

export default function BadgesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
