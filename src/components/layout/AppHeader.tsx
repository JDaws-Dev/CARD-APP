'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  Square3Stack3DIcon,
  TrophyIcon,
  HeartIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  SparklesIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { hasParentAccess } from '@/lib/profiles';
import { DarkModeToggle } from './DarkModeToggle';
import { KidModeToggle } from './KidModeToggle';
import { GameSwitcher } from '@/components/header/GameSwitcher';
import { ProfileSwitcher } from '@/components/header/ProfileSwitcher';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';

/**
 * Modern CardDex logo with layered card stack effect.
 * Features gradient fill, shine effects, and animated sparkle accent.
 * Colors dynamically change with the selected game theme.
 */
function CardDexLogo({ className }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full drop-shadow-lg"
      >
        {/* Back card - subtle shadow layer */}
        <rect
          x="4"
          y="2"
          width="24"
          height="32"
          rx="4"
          style={{ fill: 'rgba(var(--game-secondary-rgb), 0.3)' }}
          className="transition-all duration-500"
        />
        {/* Middle card */}
        <rect
          x="9"
          y="5"
          width="24"
          height="32"
          rx="4"
          style={{ fill: 'rgba(var(--game-secondary-rgb), 0.55)' }}
          className="transition-all duration-500"
        />
        {/* Front card - gradient from primary to secondary */}
        <defs>
          <linearGradient id="cardLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'var(--game-primary)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--game-secondary)' }} />
          </linearGradient>
        </defs>
        <rect
          x="14"
          y="8"
          width="24"
          height="32"
          rx="4"
          fill="url(#cardLogoGradient)"
          className="transition-all duration-500"
        />
        {/* Card shine/glare effects */}
        <rect x="18" y="13" width="16" height="2.5" rx="1.25" className="fill-white/60" />
        <rect x="18" y="18" width="10" height="1.5" rx="0.75" className="fill-white/35" />
        {/* Corner highlight */}
        <circle cx="33" cy="35" r="3.5" className="fill-white/45" />
      </svg>
      {/* Animated sparkle accent */}
      <SparklesIcon className="absolute -right-0.5 -top-0.5 h-4 w-4 animate-pulse text-game-primary drop-shadow" />
    </div>
  );
}

// App navigation links for logged-in users
// Desktop header shows these navigation items
const appNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/collection', label: 'My Collection', icon: Square3Stack3DIcon },
  { href: '/sets', label: 'Browse Sets', icon: Square3Stack3DIcon },
  { href: '/badges', label: 'Badges', icon: TrophyIcon },
  { href: '/my-wishlist', label: 'Wishlist', icon: HeartIcon },
  { href: '/search', label: 'Search', icon: MagnifyingGlassIcon },
];

/**
 * AppHeader component for logged-in users.
 * Modern, sleek header with glass-morphism effect and game theming.
 * Features: Logo with game branding, main nav, game switcher, settings, and profile.
 */
export function AppHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false);
  const { signOut } = useAuthActions();
  const { primaryGame } = useGameSelector();

  // Fetch current user's profile to check if they're a parent
  const currentUserProfile = useQuery(api.profiles.getCurrentUserProfile, {});
  const isParent = hasParentAccess(currentUserProfile);

  const handleSignOut = () => {
    setProfileMenuOpen(false);
    signOut();
  };

  // Close mobile menu, profile menu, and quick settings on Escape key press
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setMobileMenuOpen(false);
      setProfileMenuOpen(false);
      setQuickSettingsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleEscapeKey]);

  return (
    <header
      className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/90 backdrop-blur-xl transition-all duration-300 dark:border-slate-700/50 dark:bg-slate-900/90"
      role="banner"
    >
      {/* Sleek gradient accent line at the top - game themed */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-game-gradient shadow-sm" />

      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
        aria-label="App navigation"
      >
        {/* Logo with game branding - prominent and sleek */}
        <Link
          href="/dashboard"
          className="group flex items-center gap-2.5 rounded-2xl px-2 py-1.5 transition-all duration-300 hover:bg-game-gradient-subtle focus-visible:outline-none focus-visible:ring-2 focus-game sm:gap-3"
          aria-label="CardDex - Go to dashboard"
        >
          <CardDexLogo
            className="h-10 w-10 transition-transform duration-300 group-hover:scale-110 sm:h-11 sm:w-11"
            aria-hidden="true"
          />
          <div className="flex flex-col">
            <span className="text-game-gradient text-xl font-black tracking-tight transition-all duration-300 sm:text-2xl">
              CardDex
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-game-text/80 transition-colors duration-300 sm:text-[11px]">
              {primaryGame?.shortName || 'TCG'} Collection
            </span>
          </div>
        </Link>

        {/* Desktop Navigation - sleek pill-style nav */}
        <div className="hidden items-center gap-0.5 rounded-2xl bg-gray-100/80 p-1 dark:bg-slate-800/80 lg:flex" role="menubar">
          {appNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-primary focus-visible:ring-offset-2 ${
                  isActive
                    ? 'bg-white text-game-primary shadow-sm dark:bg-slate-700 dark:text-game-primary'
                    : 'text-gray-600 hover:bg-white/50 hover:text-game-primary dark:text-slate-300 dark:hover:bg-slate-700/50'
                }`}
                aria-current={isActive ? 'page' : undefined}
                role="menuitem"
              >
                <Icon className={`h-4 w-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} aria-hidden="true" />
                <span className="hidden xl:inline">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right side: Profile Switcher, Game Switcher, Quick Settings popover, Profile Menu */}
        <div className="hidden items-center gap-1.5 lg:flex">
          {/* Profile Switcher - only shows for families with multiple profiles */}
          <ProfileSwitcher />

          {/* Game Switcher - prominent and colorful */}
          <GameSwitcher />

          {/* Divider */}
          <div className="mx-1 h-6 w-px bg-gray-200/60 dark:bg-slate-600/60" aria-hidden="true" />

          {/* Quick Settings popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setQuickSettingsOpen(!quickSettingsOpen)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-game-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-primary focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:bg-slate-800 ${
                pathname === '/settings' || quickSettingsOpen
                  ? 'bg-game-gradient-subtle text-game-primary'
                  : ''
              }`}
              aria-label="Quick settings"
              aria-expanded={quickSettingsOpen}
              aria-haspopup="true"
              aria-controls="quick-settings-menu"
              title="Quick settings"
            >
              <Cog6ToothIcon className={`h-5 w-5 transition-transform duration-300 ${quickSettingsOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
            </button>

            {quickSettingsOpen && (
              <>
                {/* Backdrop to close menu when clicking outside */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setQuickSettingsOpen(false)}
                  aria-hidden="true"
                />
                <div
                  id="quick-settings-menu"
                  className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800/95"
                  role="dialog"
                  aria-label="Quick settings"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      Quick Settings
                    </span>
                    <SparklesIcon className="h-4 w-4 text-game-primary" />
                  </div>

                  {/* Dark Mode toggle */}
                  <div className="mb-2 flex items-center justify-between rounded-xl bg-gray-50/80 px-3 py-2.5 dark:bg-slate-700/50">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                      Dark Mode
                    </span>
                    <DarkModeToggle />
                  </div>

                  {/* Kid Mode toggle */}
                  <div className="mb-3 flex items-center justify-between rounded-xl bg-gray-50/80 px-3 py-2.5 dark:bg-slate-700/50">
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                      Kid Mode
                    </span>
                    <KidModeToggle />
                  </div>

                  {/* Link to all settings */}
                  <Link
                    href="/settings"
                    onClick={() => setQuickSettingsOpen(false)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-game-gradient px-3 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-105 focus-game"
                  >
                    All Settings
                    <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Profile Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-game-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-primary focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:bg-slate-800 ${
                profileMenuOpen ? 'bg-game-gradient-subtle text-game-primary' : ''
              }`}
              aria-label="Profile menu"
              aria-expanded={profileMenuOpen}
              aria-haspopup="true"
              aria-controls="profile-menu"
            >
              <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Profile</span>
            </button>

            {profileMenuOpen && (
              <>
                {/* Backdrop to close menu when clicking outside */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setProfileMenuOpen(false)}
                  aria-hidden="true"
                />
                <div
                  id="profile-menu"
                  className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 py-1.5 shadow-xl backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-800/95"
                  role="menu"
                  aria-label="Profile options"
                >
                  <Link
                    href="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-game-primary dark:text-slate-200 dark:hover:bg-slate-700/50 ${
                      pathname === '/profile' ? 'bg-game-gradient-subtle text-game-primary' : ''
                    }`}
                    role="menuitem"
                  >
                    <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
                    My Profile
                  </Link>
                  <Link
                    href="/learn"
                    onClick={() => setProfileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-game-primary dark:text-slate-200 dark:hover:bg-slate-700/50 ${
                      pathname === '/learn' ? 'bg-game-gradient-subtle text-game-primary' : ''
                    }`}
                    role="menuitem"
                  >
                    <Square3Stack3DIcon className="h-4 w-4" aria-hidden="true" />
                    Learn to Collect
                  </Link>
                  {isParent && (
                    <Link
                      href="/parent-dashboard"
                      onClick={() => setProfileMenuOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-game-primary dark:text-slate-200 dark:hover:bg-slate-700/50 ${
                        pathname === '/parent-dashboard' ? 'bg-game-gradient-subtle text-game-primary' : ''
                      }`}
                      role="menuitem"
                    >
                      <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
                      <span className="flex flex-col">
                        <span>Parent Dashboard</span>
                        <span className="text-[10px] font-normal text-purple-600 dark:text-purple-400">
                          Parent features
                        </span>
                      </span>
                    </Link>
                  )}
                  <Link
                    href="/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-game-primary dark:text-slate-200 dark:hover:bg-slate-700/50 ${
                      pathname === '/settings' ? 'bg-game-gradient-subtle text-game-primary' : ''
                    }`}
                    role="menuitem"
                  >
                    <Cog6ToothIcon className="h-4 w-4" aria-hidden="true" />
                    Settings
                  </Link>
                  <div
                    className="my-1.5 border-t border-gray-100/80 dark:border-slate-700/80"
                    aria-hidden="true"
                  />
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-600 transition-all duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-game-primary dark:text-slate-300 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    role="menuitem"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-primary focus-visible:ring-offset-2 lg:hidden ${
            mobileMenuOpen
              ? 'bg-game-gradient text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="app-mobile-menu"
        >
          {mobileMenuOpen ? (
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Bars3Icon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </nav>

      {/* Mobile Menu - sleek slide-down design */}
      {mobileMenuOpen && (
        <div
          id="app-mobile-menu"
          className="border-t border-game-border/20 bg-white/95 backdrop-blur-lg dark:border-slate-700/50 dark:bg-slate-900/95 lg:hidden"
          role="menu"
          aria-label="Mobile app navigation"
        >
          {/* Navigation links */}
          <div className="px-3 py-3">
            <div className="grid grid-cols-5 gap-1 rounded-2xl bg-gray-100/80 p-1 dark:bg-slate-800/80">
              {appNavLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-primary ${
                      isActive
                        ? 'bg-white text-game-primary shadow-sm dark:bg-slate-700'
                        : 'text-gray-600 hover:bg-white/50 dark:text-slate-300 dark:hover:bg-slate-700/50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    role="menuitem"
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''}`} aria-hidden="true" />
                    <span className="text-[10px] font-medium leading-tight">{link.label.split(' ').pop()}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile Profile Switcher - for families with multiple profiles */}
          <div className="border-t border-gray-100/60 px-4 py-3 dark:border-slate-700/60">
            <div className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              <SparklesIcon className="h-3 w-3" />
              Switch Profile
            </div>
            <ProfileSwitcher />
          </div>

          {/* Mobile Game Switcher */}
          <div className="border-t border-gray-100/60 px-4 py-3 dark:border-slate-700/60">
            <div className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              <SparklesIcon className="h-3 w-3" />
              Active Game
            </div>
            <GameSwitcher />
          </div>

          {/* Mobile profile links */}
          <div className="border-t border-gray-100/60 px-4 py-3 dark:border-slate-700/60">
            <div className="space-y-1">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-primary ${
                  pathname === '/profile'
                    ? 'bg-game-gradient-subtle text-game-primary'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800/50'
                }`}
                role="menuitem"
              >
                <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
                My Profile
              </Link>
              <Link
                href="/learn"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-primary ${
                  pathname === '/learn'
                    ? 'bg-game-gradient-subtle text-game-primary'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800/50'
                }`}
                role="menuitem"
              >
                <Square3Stack3DIcon className="h-5 w-5" aria-hidden="true" />
                Learn to Collect
              </Link>
              {isParent && (
                <Link
                  href="/parent-dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-primary ${
                    pathname === '/parent-dashboard'
                      ? 'bg-game-gradient-subtle text-game-primary'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800/50'
                  }`}
                  role="menuitem"
                >
                  <UserGroupIcon className="h-5 w-5" aria-hidden="true" />
                  <span className="flex flex-col">
                    <span>Parent Dashboard</span>
                    <span className="text-[10px] font-normal text-purple-600 dark:text-purple-400">
                      Parent features
                    </span>
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Quick Settings */}
          <div className="border-t border-gray-100/60 px-4 py-3 dark:border-slate-700/60">
            <div className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              <Cog6ToothIcon className="h-3 w-3" />
              Quick Settings
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-gray-50/80 px-3 py-2.5 dark:bg-slate-800/50">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                  Dark Mode
                </span>
                <DarkModeToggle />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-gray-50/80 px-3 py-2.5 dark:bg-slate-800/50">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                  Kid Mode
                </span>
                <KidModeToggle />
              </div>
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-primary ${
                  pathname === '/settings'
                    ? 'bg-game-gradient-subtle text-game-primary'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-800/50'
                }`}
                role="menuitem"
              >
                <Cog6ToothIcon className="h-5 w-5" aria-hidden="true" />
                All Settings
              </Link>
            </div>
          </div>

          {/* Sign out button */}
          <div className="border-t border-gray-100/60 px-4 py-4 dark:border-slate-700/60">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                signOut();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200/80 px-4 py-3 text-sm font-medium text-gray-600 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-game-primary dark:border-slate-600/80 dark:text-slate-300 dark:hover:border-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              role="menuitem"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
