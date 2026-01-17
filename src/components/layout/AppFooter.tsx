'use client';

import Link from 'next/link';
import {
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

const footerLinks = [
  { href: '/help', label: 'Help', icon: QuestionMarkCircleIcon },
  { href: '/privacy', label: 'Privacy Policy', icon: ShieldCheckIcon },
  { href: '/terms', label: 'Terms of Service', icon: DocumentTextIcon },
  { href: '/contact', label: 'Contact', icon: EnvelopeIcon },
];

/**
 * AppFooter component for authenticated pages.
 * Displays Help, Privacy Policy, Terms of Service, and Contact links.
 */
export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900"
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Footer Links */}
          <nav
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6"
            aria-label="Footer navigation"
          >
            {footerLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-kid-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:text-kid-primary"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Copyright */}
          <p className="text-center text-xs text-gray-400 dark:text-slate-500">
            &copy; {currentYear} CardDex. All rights reserved.
          </p>
        </div>

        {/* Disclaimer */}
        <p className="mt-4 text-center text-xs text-gray-400 dark:text-slate-500">
          CardDex is not affiliated with, endorsed by, or sponsored by The Pok&eacute;mon Company,
          Nintendo, Konami, Ravensburger, Bandai, or Wizards of the Coast.
        </p>
      </div>
    </footer>
  );
}
