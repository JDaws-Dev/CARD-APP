import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider';
import { KidModeProvider } from '@/components/providers/KidModeProvider';
import { GameSelectorProvider } from '@/components/providers/GameSelectorProvider';
import { GameThemeProvider } from '@/components/providers/GameThemeProvider';
import { DarkModeProvider } from '@/components/providers/DarkModeProvider';
import { OfflineProvider } from '@/components/providers/OfflineProvider';
import { CelebrationProvider } from '@/components/ui/CelebrationAnimation';
import { LevelUpProvider } from '@/components/gamification/LevelSystem';
import { MilestoneProvider } from '@/components/gamification/MilestoneCelebration';
import { SetCompletionProvider } from '@/components/gamification/SetCompletionCelebration';
import { AuthAwareHeader } from '@/components/layout/AuthAwareHeader';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'CardDex - Pokemon Card Collection Tracker',
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
        <ConvexClientProvider>
          <DarkModeProvider>
            <OfflineProvider>
              <GameSelectorProvider>
                <GameThemeProvider>
                  <KidModeProvider>
                    <CelebrationProvider>
                      <LevelUpProvider>
                        <MilestoneProvider>
                          <SetCompletionProvider>
                            {/* Skip link for keyboard navigation - visually hidden until focused */}
                            <a
                              href="#main-content"
                              className="absolute left-0 z-[100] -translate-y-full rounded bg-blue-600 px-4 py-2 text-white transition-transform focus:translate-y-0"
                            >
                              Skip to main content
                            </a>
                            <AuthAwareHeader />
                            <main id="main-content">{children}</main>
                          </SetCompletionProvider>
                        </MilestoneProvider>
                      </LevelUpProvider>
                    </CelebrationProvider>
                  </KidModeProvider>
                </GameThemeProvider>
              </GameSelectorProvider>
            </OfflineProvider>
          </DarkModeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
