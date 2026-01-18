'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import {
  Square3Stack3DIcon,
  TrophyIcon,
  HeartIcon,
  EllipsisHorizontalIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
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
 * - "More" menu provides access to secondary navigation items
 */

interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { href: '/collection', label: 'My Collection', shortLabel: 'Collection', icon: Square3Stack3DIcon },
  { href: '/sets', label: 'Browse Sets', shortLabel: 'Sets', icon: Square3Stack3DIcon },
  { href: '/badges', label: 'Badges', shortLabel: 'Badges', icon: TrophyIcon },
  { href: '/my-wishlist', label: 'Wishlist', shortLabel: 'Wishlist', icon: HeartIcon },
];

const moreMenuItems: NavItem[] = [
  { href: '/search', label: 'Search', shortLabel: 'Search', icon: MagnifyingGlassIcon },
  { href: '/profile', label: 'My Profile', shortLabel: 'Profile', icon: UserCircleIcon },
  { href: '/settings', label: 'Settings', shortLabel: 'Settings', icon: Cog6ToothIcon },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const { signOut } = useAuthActions();

  // Check if current page is in the "more" menu
  const isMorePageActive = moreMenuItems.some((item) => pathname === item.href);

  // Close menu on Escape key
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setMoreMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleEscapeKey]);

  // Close menu when route changes
  useEffect(() => {
    setMoreMenuOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    setMoreMenuOpen(false);
    signOut();
  };

  return (
    <>
      {/* More menu backdrop and panel */}
      {moreMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={() => setMoreMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Slide-up menu panel */}
          <div
            className="fixed bottom-20 left-0 right-0 z-40 mx-4 mb-2 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 shadow-2xl backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 lg:hidden"
            role="menu"
            aria-label="More navigation options"
            style={{ marginBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100/60 px-4 py-3 dark:border-slate-700/60">
              <span className="text-sm font-bold text-gray-900 dark:text-white">More</span>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Menu items */}
            <div className="p-2">
              {moreMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-primary',
                      isActive
                        ? 'bg-game-gradient-subtle text-game-primary'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800/50'
                    )}
                    role="menuitem"
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Divider */}
              <div className="my-2 border-t border-gray-100/60 dark:border-slate-700/60" aria-hidden="true" />

              {/* Sign out button */}
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition-all duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-primary dark:text-slate-300 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                role="menuitem"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 lg:hidden"
        role="navigation"
        aria-label="Main mobile navigation"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto flex h-20 max-w-md items-center justify-around px-2">
          {/* Main nav items */}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

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

          {/* More button */}
          <button
            type="button"
            onClick={() => setMoreMenuOpen(!moreMenuOpen)}
            aria-label="More navigation options"
            aria-expanded={moreMenuOpen}
            aria-haspopup="menu"
            className={cn(
              // Base styles - large tap target for kids (min 56x56 > 44x44 requirement)
              'group relative flex flex-col items-center justify-center',
              'min-h-[56px] min-w-[56px] rounded-xl px-2 py-1',
              'transition-all duration-150 ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-primary focus-visible:ring-offset-2',
              // Active state - if "more" menu is open or a "more" page is active
              (moreMenuOpen || isMorePageActive) && 'bg-game-gradient text-white shadow-lg',
              // Inactive state
              !(moreMenuOpen || isMorePageActive) && [
                'text-gray-500 hover:bg-gray-100 active:bg-gray-200',
                'dark:text-slate-400 dark:hover:bg-slate-800 dark:active:bg-slate-700',
              ]
            )}
          >
            {/* Icon container */}
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg transition-transform',
                (moreMenuOpen || isMorePageActive) && 'text-white',
                !(moreMenuOpen || isMorePageActive) && 'text-gray-600 group-hover:text-game-primary dark:text-slate-400'
              )}
            >
              <EllipsisHorizontalIcon className="h-6 w-6" aria-hidden="true" />
            </div>

            {/* Label */}
            <span
              className={cn(
                'mt-0.5 text-[10px] font-semibold leading-tight',
                (moreMenuOpen || isMorePageActive) ? 'text-white' : 'text-gray-600 dark:text-slate-400'
              )}
            >
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
