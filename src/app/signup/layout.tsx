import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | CardDex',
  description:
    'Create a free CardDex account and start tracking your Pokemon, Yu-Gi-Oh, One Piece, and Lorcana trading card collections. Perfect for kids and families.',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
