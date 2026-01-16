'use client';

import { useMemo } from 'react';
import { useGraceDay } from '@/components/providers/GraceDayProvider';
import { ShieldCheckIcon, ShieldExclamationIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  formatGraceDayStatus,
  getGraceDayTooltip,
  getGraceDayAriaLabel,
  getGraceDayDescription,
  getWeekInfo,
  getToday,
} from '@/lib/graceDays';

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function GraceDayStatusSkeleton() {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="mb-1 h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
}

// ============================================================================
// GRACE DAY INDICATOR (COMPACT)
// ============================================================================

interface GraceDayIndicatorProps {
  className?: string;
}

export function GraceDayIndicator({ className }: GraceDayIndicatorProps) {
  const { isInitialized, isEnabled, availability } = useGraceDay();

  if (!isInitialized) {
    return <Skeleton className={cn('h-6 w-6 rounded-full', className)} />;
  }

  if (!isEnabled) {
    return null;
  }

  const tooltip = getGraceDayTooltip(availability);
  const ariaLabel = getGraceDayAriaLabel(availability);

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        availability.isAvailable ? 'text-emerald-500' : 'text-amber-500',
        className
      )}
      title={tooltip}
      aria-label={ariaLabel}
      role="status"
    >
      {availability.isAvailable ? (
        <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
      ) : (
        <ShieldExclamationIcon className="h-5 w-5" aria-hidden="true" />
      )}
      {/* Availability count badge */}
      <span
        className={cn(
          'absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[10px] font-bold text-white',
          availability.isAvailable ? 'bg-emerald-500' : 'bg-amber-500'
        )}
        aria-hidden="true"
      >
        {availability.remaining}
      </span>
    </div>
  );
}

// ============================================================================
// GRACE DAY STATUS CARD
// ============================================================================

interface GraceDayStatusProps {
  /** Whether to show the toggle control */
  showToggle?: boolean;
  /** Additional class name */
  className?: string;
}

export function GraceDayStatus({ showToggle = true, className }: GraceDayStatusProps) {
  const { isInitialized, isEnabled, availability, toggle } = useGraceDay();

  // Get week info for display
  const weekInfo = useMemo(() => getWeekInfo(getToday()), []);

  if (!isInitialized) {
    return <GraceDayStatusSkeleton />;
  }

  const statusText = formatGraceDayStatus(availability);
  const tooltip = getGraceDayTooltip(availability);
  const description = getGraceDayDescription();

  return (
    <div
      className={cn(
        'rounded-xl bg-white p-4 shadow-sm',
        isEnabled ? 'ring-1 ring-emerald-100' : 'ring-1 ring-gray-100',
        className
      )}
      role="region"
      aria-label="Grace day protection status"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors',
            isEnabled && availability.isAvailable
              ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
              : isEnabled
                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                : 'bg-gray-200'
          )}
        >
          {isEnabled ? (
            availability.isAvailable ? (
              <ShieldCheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
            ) : (
              <ShieldExclamationIcon className="h-5 w-5 text-white" aria-hidden="true" />
            )
          ) : (
            <ShieldExclamationIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-800">Grace Day Protection</h4>
            {isEnabled && availability.isAvailable && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <SparklesIcon className="h-3 w-3" aria-hidden="true" />
                Active
              </span>
            )}
          </div>

          <p className="mt-0.5 text-sm text-gray-600" title={tooltip}>
            {isEnabled ? statusText : 'Protection disabled'}
          </p>

          {/* Week info */}
          {isEnabled && (
            <p className="mt-1 text-xs text-gray-400">
              Week {weekInfo.weekNumber} ({weekInfo.startDate.slice(5)} -{' '}
              {weekInfo.endDate.slice(5)})
            </p>
          )}
        </div>

        {/* Toggle */}
        {showToggle && (
          <button
            onClick={toggle}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              isEnabled
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 focus-visible:ring-emerald-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus-visible:ring-gray-500'
            )}
            aria-pressed={isEnabled}
            aria-label={isEnabled ? 'Disable grace day protection' : 'Enable grace day protection'}
          >
            {isEnabled ? 'On' : 'Off'}
          </button>
        )}
      </div>

      {/* Info box */}
      <div
        className={cn(
          'mt-3 flex items-start gap-2 rounded-lg p-2.5',
          isEnabled ? 'bg-emerald-50' : 'bg-gray-50'
        )}
      >
        <InformationCircleIcon
          className={cn(
            'mt-0.5 h-4 w-4 flex-shrink-0',
            isEnabled ? 'text-emerald-500' : 'text-gray-400'
          )}
          aria-hidden="true"
        />
        <p className="text-xs text-gray-600">{description}</p>
      </div>
    </div>
  );
}

// ============================================================================
// GRACE DAY USAGE HISTORY
// ============================================================================

interface GraceDayHistoryProps {
  /** Maximum items to show */
  limit?: number;
  /** Additional class name */
  className?: string;
}

export function GraceDayHistory({ limit = 5, className }: GraceDayHistoryProps) {
  const { isInitialized, usageHistory } = useGraceDay();

  if (!isInitialized) {
    return (
      <div className={cn('space-y-2', className)}>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Get recent usage, sorted by most recent first
  const recentUsage = [...usageHistory]
    .sort((a, b) => b.usedOn.localeCompare(a.usedOn))
    .slice(0, limit);

  if (recentUsage.length === 0) {
    return (
      <div className={cn('rounded-lg bg-gray-50 p-4 text-center', className)}>
        <ShieldCheckIcon className="mx-auto h-8 w-8 text-gray-300" aria-hidden="true" />
        <p className="mt-2 text-sm text-gray-500">No grace days used yet</p>
        <p className="text-xs text-gray-400">Your grace day history will appear here</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)} role="list" aria-label="Grace day usage history">
      {recentUsage.map((usage, index) => (
        <div
          key={`${usage.usedOn}-${usage.missedDate}`}
          className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
          role="listitem"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
            <ShieldCheckIcon className="h-4 w-4 text-indigo-500" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800">Protected {usage.missedDate}</p>
            <p className="text-xs text-gray-500">
              Week {usage.weekNumber} &middot; Streak was {usage.streakAtUse} days
            </p>
          </div>
          {index === 0 && (
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
              Latest
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
