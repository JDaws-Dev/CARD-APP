import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Card Condition Guide | CardDex',
  description:
    'Learn to grade trading card conditions with our CardDex guide. Understand NM, LP, MP, HP, and DMG ratings to evaluate and protect your cards like a pro.',
};

export default function ConditionGuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
