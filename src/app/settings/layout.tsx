import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | CardDex',
  description:
    'Manage your CardDex preferences including notifications, privacy settings, accessibility options, and account details. Customize your experience today.',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
