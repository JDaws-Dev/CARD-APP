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
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { hasParentAccess } from '@/lib/profiles';

// Custom card stack icon for logo (shared across all headers)
function CardStackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back card */}
      <rect x="12" y="8" width="36" height="48" rx="4" className="fill-indigo-300" />
      {/* Middle card */}
      <rect x="16" y="12" width="36" height="48" rx="4" className="fill-purple-400" />
      {/* Front card */}
      <rect x="20" y="16" width="36" height="48" rx="4" className="fill-kid-primary" />
      {/* Card detail lines */}
      <rect x="26" y="24" width="24" height="4" rx="1" className="fill-white/60" />
      <rect x="26" y="32" width="18" height="3" rx="1" className="fill-white/40" />
      <circle cx="38" cy="48" r="8" className="fill-white/30" />
    </svg>
  );
}

// App navigation links for logged-in users
const appNavLinks = [
  { href: '/collection', label: 'My Collection', icon: Square3Stack3DIcon },
  { href: '/sets', label: 'Browse Sets', icon: Square3Stack3DIcon },
  { href: '/badges', label: 'Badges', icon: TrophyIcon },
  { href: '/my-wishlist', label: 'Wishlist', icon: HeartIcon },
  { href: '/search', label: 'Search', icon: MagnifyingGlassIcon },
];

/**
 * AppHeader component for logged-in users.
 * Simplified header with: Logo, main nav, settings gear icon, and profile menu.
 * Settings gear provides quick access to /settings page.
 * Does NOT show Login/Signup buttons - use MarketingHeader for that.
 */
export function AppHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { signOut } = useAuthActions();

  // Fetch current user's profile to check if they're a parent
  const currentUserProfile = useQuery(api.profiles.getCurrentUserProfile, {});
  const isParent = hasParentAccess(currentUserProfile);

  const handleSignOut = () => {
    setProfileMenuOpen(false);
    signOut();
  };

  return (
    <header
      className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95"
      role="banner"
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
        aria-label="App navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 sm:gap-2"
          aria-label="CardDex - Go to home page"
        >
          <CardStackIcon className="h-8 w-8 sm:h-10 sm:w-10" aria-hidden="true" />
          <span className="bg-gradient-to-r from-kid-primary to-kid-secondary bg-clip-text text-lg font-bold text-transparent sm:text-xl">
            CardDex
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 lg:flex" role="menubar">
          {appNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-kid-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 dark:hover:bg-slate-800 ${
                  isActive
                    ? 'bg-kid-primary/10 text-kid-primary'
                    : 'text-gray-600 dark:text-slate-300'
                }`}
                aria-current={isActive ? 'page' : undefined}
                role="menuitem"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side: Settings gear icon, Profile Menu */}
        <div className="hidden items-center gap-2 lg:flex">
          {/* Settings gear icon */}
          <Link
            href="/settings"
            className={`flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-kid-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-800 ${
              pathname === '/settings' ? 'bg-kid-primary/10 text-kid-primary' : ''
            }`}
            aria-label="Settings"
            title="Settings"
          >
            <Cog6ToothIcon className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div className="h-6 w-px bg-gray-200 dark:bg-slate-600" aria-hidden="true" />

          {/* Profile Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-kid-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-800"
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
                  className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
                  role="menu"
                  aria-label="Profile options"
                >
                  <Link
                    href="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kid-primary dark:text-slate-200 dark:hover:bg-slate-700 ${
                      pathname === '/profile' ? 'bg-kid-primary/10 text-kid-primary' : ''
                    }`}
                    role="menuitem"
                  >
                    <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
                    My Profile
                  </Link>
                  <Link
                    href="/learn"
                    onClick={() => setProfileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kid-primary dark:text-slate-200 dark:hover:bg-slate-700 ${
                      pathname === '/learn' ? 'bg-kid-primary/10 text-kid-primary' : ''
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
                      className={`flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kid-primary dark:text-slate-200 dark:hover:bg-slate-700 ${
                        pathname === '/parent-dashboard' ? 'bg-kid-primary/10 text-kid-primary' : ''
                      }`}
                      role="menuitem"
                    >
                      <UserGroupIcon className="h-4 w-4" aria-hidden="true" />
                      Parent Dashboard
                    </Link>
                  )}
                  <Link
                    href="/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kid-primary dark:text-slate-200 dark:hover:bg-slate-700 ${
                      pathname === '/settings' ? 'bg-kid-primary/10 text-kid-primary' : ''
                    }`}
                    role="menuitem"
                  >
                    <Cog6ToothIcon className="h-4 w-4" aria-hidden="true" />
                    Settings
                  </Link>
                  <div
                    className="my-1 border-t border-gray-100 dark:border-slate-700"
                    aria-hidden="true"
                  />
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-kid-primary dark:text-slate-200 dark:hover:bg-slate-700"
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
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="app-mobile-menu"
        >
          {mobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          id="app-mobile-menu"
          className="border-t border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900 lg:hidden"
          role="menu"
          aria-label="Mobile app navigation"
        >
          <div className="space-y-1 px-4 py-3">
            {appNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 ${
                    isActive
                      ? 'bg-kid-primary/10 text-kid-primary'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  role="menuitem"
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile profile links */}
          <div className="border-t border-gray-200 px-4 py-3 dark:border-slate-700">
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 ${
                pathname === '/profile'
                  ? 'bg-kid-primary/10 text-kid-primary'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
              role="menuitem"
            >
              <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
              My Profile
            </Link>
            <Link
              href="/learn"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 ${
                pathname === '/learn'
                  ? 'bg-kid-primary/10 text-kid-primary'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800'
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
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 ${
                  pathname === '/parent-dashboard'
                    ? 'bg-kid-primary/10 text-kid-primary'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
                role="menuitem"
              >
                <UserGroupIcon className="h-5 w-5" aria-hidden="true" />
                Parent Dashboard
              </Link>
            )}
          </div>

          {/* Mobile Settings link */}
          <div className="border-t border-gray-200 px-4 py-3 dark:border-slate-700">
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 ${
                pathname === '/settings'
                  ? 'bg-kid-primary/10 text-kid-primary'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
              role="menuitem"
            >
              <Cog6ToothIcon className="h-5 w-5" aria-hidden="true" />
              Settings
            </Link>
          </div>

          {/* Sign out button */}
          <div className="border-t border-gray-200 px-4 py-3 dark:border-slate-700">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                signOut();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
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
