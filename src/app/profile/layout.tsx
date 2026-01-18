import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile | CardDex',
  description:
    'View and customize your CardDex profile. Update your avatar, display name, and see your collection statistics, earned badges, achievements, and level.',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
