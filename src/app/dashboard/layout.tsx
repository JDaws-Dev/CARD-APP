import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | CardDex',
  description:
    'View your CardDex dashboard with collection stats, recent activity, daily streaks, and personalized recommendations for your trading card collecting journey.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
