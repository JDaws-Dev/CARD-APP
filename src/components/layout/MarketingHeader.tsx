'use client';

import Link from 'next/link';
import { ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { UserPlusIcon } from '@heroicons/react/24/solid';
import { useState, useCallback } from 'react';

// Custom card stack icon for logo (shared with Header)
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

  return (
    <header
      className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm"
      role="banner"
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
        aria-label="Marketing navigation"
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

        {/* Desktop Navigation - Marketing links only */}
        <div className="hidden items-center gap-6 md:flex" role="menubar">
          {marketingLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleAnchorClick(e, link.href)}
              className="rounded-md px-2 py-1 text-sm font-medium text-gray-600 transition-colors hover:text-kid-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
              role="menuitem"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Auth Buttons - Desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
            Log In
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-1.5 rounded-lg bg-kid-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-kid-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
          >
            <UserPlusIcon className="h-4 w-4" aria-hidden="true" />
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="marketing-mobile-menu"
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
          id="marketing-mobile-menu"
          className="border-t border-gray-200 bg-white md:hidden"
          role="menu"
          aria-label="Mobile marketing navigation"
        >
          <div className="space-y-1 px-4 py-3">
            {marketingLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
                role="menuitem"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
                Log In
              </Link>
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 rounded-lg bg-kid-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-kid-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
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
