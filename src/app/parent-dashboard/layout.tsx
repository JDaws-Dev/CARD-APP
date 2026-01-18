import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Parent Dashboard | CardDex',
  description:
    'Manage your family CardDex accounts. Oversee multiple collector profiles, set permissions, and track family collection progress, badges, and activity.',
};

export default function ParentDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
