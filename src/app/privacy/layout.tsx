import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | CardDex',
  description:
    'CardDex Privacy Policy - Learn how we protect your data with COPPA-compliant practices designed for families and kids ages 6-14. Your privacy matters.',
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
