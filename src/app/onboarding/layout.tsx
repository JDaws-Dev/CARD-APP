import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get Started | CardDex',
  description:
    'Set up your CardDex profile and start your collection journey. Pick your favorite trading card game, customize your avatar, and begin collecting today.',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
