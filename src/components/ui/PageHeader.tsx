'use client';

import { cn } from '@/lib/utils';
import type { ReactNode, ElementType } from 'react';

/** Gradient presets for common page themes */
export type GradientPreset =
  | 'default'
  | 'amber'
  | 'purple'
  | 'indigo'
  | 'orange'
  | 'emerald'
  | 'rose'
  | 'cyan'
  | 'slate';

const gradientClasses: Record<GradientPreset, string> = {
  default: 'from-kid-primary to-kid-secondary',
  amber: 'from-amber-400 to-orange-500',
  purple: 'from-purple-500 to-indigo-500',
  indigo: 'from-indigo-500 to-purple-600',
  orange: 'from-orange-400 to-amber-500',
  emerald: 'from-emerald-500 to-teal-500',
  rose: 'from-rose-500 to-pink-500',
  cyan: 'from-cyan-500 to-blue-500',
  slate: 'from-slate-500 to-slate-700',
};

interface PageHeaderProps {
  /** The page title */
  title: string;
  /** Optional description text below the title */
  description?: string;
  /** Optional Heroicon component to display in the gradient box */
  icon?: ElementType;
  /** Gradient preset for the icon background (default: 'default') */
  gradient?: GradientPreset;
  /** Custom gradient classes (overrides preset) */
  customGradient?: string;
  /** Optional content to render on the right side (e.g., action buttons) */
  actions?: ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
  /** Size variant for the header */
  size?: 'default' | 'compact';
}

/**
 * PageHeader - A reusable page header component with consistent styling.
 *
 * Provides a uniform layout for page headers across the application with:
 * - Optional icon in a gradient background
 * - Title and description
 * - Optional action area (right side)
 *
 * @example
 * // Basic usage with icon
 * <PageHeader
 *   title="Settings"
 *   description="Customize your CardDex experience"
 *   icon={Cog6ToothIcon}
 *   gradient="slate"
 * />
 *
 * @example
 * // With actions
 * <PageHeader
 *   title="My Collection"
 *   description="Browse your cards"
 *   icon={RectangleStackIcon}
 *   actions={<Button>Add Cards</Button>}
 * />
 *
 * @example
 * // Compact variant without icon
 * <PageHeader
 *   title="Search Results"
 *   description="Found 42 cards"
 *   size="compact"
 * />
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  gradient = 'default',
  customGradient,
  actions,
  className,
  size = 'default',
}: PageHeaderProps) {
  const gradientClass = customGradient || gradientClasses[gradient];
  const isCompact = size === 'compact';

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4',
        isCompact ? 'mb-4' : 'mb-8',
        className
      )}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {Icon && (
          <div
            className={cn(
              'flex items-center justify-center rounded-xl bg-gradient-to-br shadow-lg',
              gradientClass,
              isCompact ? 'h-10 w-10' : 'h-12 w-12 sm:h-14 sm:w-14'
            )}
            aria-hidden="true"
          >
            <Icon
              className={cn('text-white', isCompact ? 'h-5 w-5' : 'h-6 w-6 sm:h-7 sm:w-7')}
              aria-hidden="true"
            />
          </div>
        )}
        <div>
          <h1
            className={cn(
              'font-bold text-gray-900 dark:text-white',
              isCompact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
            )}
          >
            {title}
          </h1>
          {description && (
            <p
              className={cn(
                'text-gray-600 dark:text-slate-400',
                isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
              )}
            >
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * PageHeaderSkeleton - Loading skeleton for PageHeader
 *
 * @example
 * // With icon placeholder
 * <PageHeaderSkeleton showIcon />
 *
 * @example
 * // Without icon
 * <PageHeaderSkeleton />
 */
export function PageHeaderSkeleton({
  showIcon = true,
  showDescription = true,
  className,
}: {
  showIcon?: boolean;
  showDescription?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('mb-8 flex items-center gap-4', className)}>
      {showIcon && (
        <div className="h-12 w-12 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700 sm:h-14 sm:w-14" />
      )}
      <div>
        <div className="mb-2 h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
        {showDescription && (
          <div className="h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
        )}
      </div>
    </div>
  );
}
