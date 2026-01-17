'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface BackLinkProps {
  /** The URL to navigate back to */
  href: string;
  /** The text to display (e.g., "Back to Dashboard") */
  children: React.ReactNode;
  /** Optional aria-label for accessibility (defaults to children text) */
  'aria-label'?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to add margin-bottom for spacing below the link */
  withMargin?: boolean;
}

/**
 * BackLink - A reusable back navigation component.
 *
 * Provides consistent styling and accessibility for back navigation links
 * across the application.
 *
 * @example
 * // Basic usage
 * <BackLink href="/dashboard">Back to Dashboard</BackLink>
 *
 * @example
 * // With margin below
 * <BackLink href="/collection" withMargin>Back to Collection</BackLink>
 *
 * @example
 * // With custom aria-label
 * <BackLink href="/learn" aria-label="Return to learning resources">
 *   Back to Learn
 * </BackLink>
 */
export function BackLink({
  href,
  children,
  'aria-label': ariaLabel,
  className,
  withMargin = false,
}: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition-colors',
        'hover:text-kid-primary focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-kid-primary focus-visible:ring-offset-2',
        'dark:text-slate-400 dark:hover:text-kid-primary',
        withMargin && 'mb-4',
        className
      )}
      aria-label={ariaLabel}
    >
      <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
      {children}
    </Link>
  );
}
