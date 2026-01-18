import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learn to Collect | CardDex',
  description:
    'Learn trading card collecting with fun tutorials and mini-games on CardDex. Perfect for new collectors to understand card basics, grading, and terminology.',
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
