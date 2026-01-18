import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Streak | CardDex',
  description:
    'Track your daily collection streak and build consistency on CardDex. Earn bonus rewards, badges, and XP for maintaining your collecting habits each day.',
};

export default function StreakLayout({ children }: { children: React.ReactNode }) {
  return children;
}
