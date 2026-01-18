import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In | CardDex',
  description:
    'Log in to your CardDex account to manage your Pokemon, Yu-Gi-Oh, One Piece, and Lorcana card collections. Track progress and connect with your family.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
