'use client';

import Link from 'next/link';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { UserPlusIcon } from '@heroicons/react/24/solid';
import { useState, useCallback, useEffect } from 'react';
import { DarkModeToggle } from '@/components/layout/DarkModeToggle';

/**
 * Modern CardDex logo with layered card stack effect.
 * Uses kid-friendly purple/indigo colors for the marketing header.
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
        <rect x="4" y="2" width="24" height="32" rx="4" className="fill-indigo-300/50" />
        {/* Middle card */}
        <rect x="9" y="5" width="24" height="32" rx="4" className="fill-purple-400/70" />
        {/* Front card - gradient */}
        <defs>
          <linearGradient id="marketingCardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="[stop-color:var(--tw-gradient-from,theme(colors.kid-primary))]" />
            <stop offset="100%" className="[stop-color:var(--tw-gradient-to,theme(colors.kid-secondary))]" />
          </linearGradient>
        </defs>
        <rect x="14" y="8" width="24" height="32" rx="4" className="fill-kid-primary" />
        {/* Card shine effects */}
        <rect x="18" y="13" width="16" height="2.5" rx="1.25" className="fill-white/60" />
        <rect x="18" y="18" width="10" height="1.5" rx="0.75" className="fill-white/35" />
        {/* Corner highlight */}
        <circle cx="33" cy="35" r="3.5" className="fill-white/45" />
      </svg>
      {/* Animated sparkle accent */}
      <SparklesIcon className="absolute -right-0.5 -top-0.5 h-4 w-4 animate-pulse text-kid-primary drop-shadow" />
    </div>
  );
}

// Marketing navigation links - anchor links to landing page sections
const marketingLinks = [
  { href: '#features', label: 'Features' },
  { href: '#pricing', label: 'Pricing' },
];

/**
 * MarketingHeader component for the landing page.
 * Shows only Logo, Features, Pricing links, Login, and Sign Up.
 * No app navigation (Browse Sets, My Collection, etc.)
 */
export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAnchorClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Only handle anchor links
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.slice(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
      setMobileMenuOpen(false);
    }
  }, []);

  // Close mobile menu on Escape key press
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setMobileMenuOpen(false);
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
      className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-xl transition-all duration-300 dark:border-slate-700/50 dark:bg-slate-900/80"
      role="banner"
    >
      {/* Subtle gradient accent line at the top */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-kid-primary via-purple-500 to-kid-secondary opacity-80" />

      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8"
        aria-label="Marketing navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-xl px-2 py-1 transition-all duration-200 hover:bg-kid-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 sm:gap-2.5"
          aria-label="CardDex - Go to home page"
        >
          <CardDexLogo className="h-9 w-9 transition-transform duration-200 group-hover:scale-105 sm:h-10 sm:w-10" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="bg-gradient-to-r from-kid-primary to-kid-secondary bg-clip-text text-lg font-extrabold tracking-tight text-transparent transition-all duration-300 sm:text-xl">
              CardDex
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400 sm:block">
              Card Collection Tracker
            </span>
          </div>
        </Link>

        {/* Desktop Navigation - Marketing links only */}
        <div className="hidden items-center gap-1 rounded-2xl bg-gray-100/80 px-1 py-1 dark:bg-slate-800/80 md:flex" role="menubar">
          {marketingLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleAnchorClick(e, link.href)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-white/60 hover:text-kid-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-kid-primary"
              role="menuitem"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Auth Buttons - Desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <DarkModeToggle compact />
          <div className="mx-1 h-6 w-px bg-gray-200/60 dark:bg-slate-600/60" aria-hidden="true" />
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
            Log In
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-kid-primary to-kid-secondary px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
          >
            <UserPlusIcon className="h-4 w-4" aria-hidden="true" />
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 md:hidden ${
            mobileMenuOpen
              ? 'bg-gradient-to-r from-kid-primary to-kid-secondary text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="marketing-mobile-menu"
        >
          {mobileMenuOpen ? (
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Bars3Icon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          id="marketing-mobile-menu"
          className="border-t border-gray-100/60 bg-white/95 backdrop-blur-lg dark:border-slate-700/60 dark:bg-slate-900/95 md:hidden"
          role="menu"
          aria-label="Mobile marketing navigation"
        >
          <div className="px-4 py-3">
            <div className="flex gap-1 rounded-2xl bg-gray-100/80 p-1 dark:bg-slate-800/80">
              {marketingLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  className="flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-white/60 hover:text-kid-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary dark:text-slate-200 dark:hover:bg-slate-700/60"
                  role="menuitem"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-100/60 px-4 py-4 dark:border-slate-700/60">
            {/* Dark mode toggle for mobile */}
            <div className="mb-4 flex items-center justify-between rounded-xl bg-gray-50/80 px-4 py-2.5 dark:bg-slate-800/50">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Dark Mode</span>
              <DarkModeToggle />
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200/80 px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 dark:border-slate-600/80 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
                Log In
              </Link>
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-kid-primary to-kid-secondary px-4 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <UserPlusIcon className="h-4 w-4" aria-hidden="true" />
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
