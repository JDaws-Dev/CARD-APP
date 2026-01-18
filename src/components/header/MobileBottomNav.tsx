'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Square3Stack3DIcon,
  TrophyIcon,
  MagnifyingGlassIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

/**
 * Mobile bottom navigation bar for the main app screens.
 *
 * Design principles:
 * - Large tap targets (min 44x44px) for kids ages 6-14
 * - Fixed to bottom of screen for easy thumb access
 * - Clear indication of the currently active page
 * - Only visible on mobile (hidden on lg: and above)
 * - Dashboard is prominently accessible (most requested feature)
 * - Search is prominent for quick card lookup
 */

interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Bottom nav items - the 5 most important destinations for kids
// Dashboard: stats, progress, achievements - kids want to see this often
// Collection: their cards
// Sets: browse and discover
// Search: find specific cards quickly
// Badges: achievements and rewards
const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', shortLabel: 'Home', icon: HomeIcon },
  { href: '/collection', label: 'My Collection', shortLabel: 'Collection', icon: Square3Stack3DIcon },
  { href: '/sets', label: 'Browse Sets', shortLabel: 'Sets', icon: Square3Stack3DIcon },
  { href: '/search', label: 'Search Cards', shortLabel: 'Search', icon: MagnifyingGlassIcon },
  { href: '/badges', label: 'Badges', shortLabel: 'Badges', icon: TrophyIcon },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 lg:hidden"
      role="navigation"
      aria-label="Main mobile navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex h-20 max-w-md items-center justify-around px-2">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className={cn(
                // Base styles - large tap target for kids (min 56x56 > 44x44 requirement)
                'group relative flex flex-col items-center justify-center',
                'min-h-[56px] min-w-[56px] rounded-xl px-2 py-1',
                'transition-all duration-150 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-primary focus-visible:ring-offset-2',
                // Active state - highlighted with game gradient
                isActive && 'bg-game-gradient text-white shadow-lg',
                // Inactive state
                !isActive && [
                  'text-gray-500 hover:bg-gray-100 active:bg-gray-200',
                  'dark:text-slate-400 dark:hover:bg-slate-800 dark:active:bg-slate-700',
                ]
              )}
            >
              {/* Icon container */}
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-transform',
                  isActive && 'text-white',
                  !isActive && 'text-gray-600 group-hover:text-game-primary dark:text-slate-400'
                )}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>

              {/* Label */}
              <span
                className={cn(
                  'mt-0.5 text-[10px] font-semibold leading-tight',
                  isActive ? 'text-white' : 'text-gray-600 dark:text-slate-400'
                )}
              >
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
