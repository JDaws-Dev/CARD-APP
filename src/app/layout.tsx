import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'KidCollect - Pokemon Card Collection Tracker',
  description:
    'The family-friendly way to track, organize, and celebrate your Pokemon card collection. Built for kids ages 6-14 and their families.',
  keywords: ['pokemon', 'cards', 'collection', 'tracker', 'kids', 'tcg', 'trading cards'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
