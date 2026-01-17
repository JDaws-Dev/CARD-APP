'use client';

import Link from 'next/link';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { Fragment } from 'react';

export interface BreadcrumbItem {
  /** The display text for this breadcrumb segment */
  label: string;
  /** The URL to navigate to (omit for current/last item) */
  href?: string;
}

interface BreadcrumbProps {
  /** Array of breadcrumb items from root to current page */
  items: BreadcrumbItem[];
  /** Whether to show a home icon as the first item (default: true) */
  showHomeIcon?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Breadcrumb - A navigation component showing the current page's location in the site hierarchy.
 *
 * Follows accessibility best practices with proper ARIA landmarks and semantic structure.
 *
 * @example
 * // Basic usage
 * <Breadcrumb
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Learn', href: '/learn' },
 *     { label: 'Condition Guide' }, // Current page (no href)
 *   ]}
 * />
 *
 * @example
 * // Without home icon
 * <Breadcrumb
 *   items={[
 *     { label: 'Browse Sets', href: '/sets' },
 *     { label: 'Scarlet & Violet' },
 *   ]}
 *   showHomeIcon={false}
 * />
 */
export function Breadcrumb({ items, showHomeIcon = true, className }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('mb-4 flex items-center text-sm', className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <Fragment key={item.label}>
              <li className="flex items-center">
                {item.href ? (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1.5 font-medium transition-colors',
                      'text-gray-500 hover:text-kid-primary',
                      'focus-visible:outline-none focus-visible:ring-2',
                      'focus-visible:rounded focus-visible:ring-kid-primary focus-visible:ring-offset-2',
                      'dark:text-slate-400 dark:hover:text-kid-primary'
                    )}
                  >
                    {isFirst && showHomeIcon && (
                      <HomeIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    )}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className={cn(
                      'flex items-center gap-1.5 font-medium',
                      isLast ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400'
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {isFirst && showHomeIcon && (
                      <HomeIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    )}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true">
                  <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-slate-500" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
