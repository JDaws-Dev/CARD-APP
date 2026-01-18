import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | CardDex',
  description:
    'CardDex Terms of Service - Read our terms and conditions for using our family-friendly trading card collection tracker app designed for kids and families.',
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
