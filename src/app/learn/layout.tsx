import type { Metadata } from 'next';
import { JsonLD } from '@/components/JsonLD';
import { generateFAQPageSchema, DEFAULT_CARDDEX_FAQS } from '@/lib/structured-data';

export const metadata: Metadata = {
  title: 'Learn to Collect | CardDex',
  description:
    'Learn trading card collecting with fun tutorials and mini-games on CardDex. Perfect for new collectors to understand card basics, grading, and terminology.',
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLD data={generateFAQPageSchema(DEFAULT_CARDDEX_FAQS)} />
      {children}
    </>
  );
}
