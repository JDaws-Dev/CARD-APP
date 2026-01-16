'use client';

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  FireIcon,
  CalendarDaysIcon,
  SparklesIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/solid';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  buildStreakCalendar,
  getDayAbbreviation,
  getDayStatusClass,
  getMonthName,
  formatActivitySummary,
  getStreakMessage,
  type CalendarDay,
  type StreakCalendarData,
} from '@/lib/streakCalendar';
import { useGraceDay } from '@/components/providers/GraceDayProvider';
import { formatGraceDayStatus, getGraceDayTooltip } from '@/lib/graceDays';

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function StreakCalendarSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-6 w-40" />
      </div>

      {/* Stats row */}
      <div className="mb-4 flex gap-4">
        <Skeleton className="h-16 w-24 rounded-xl" />
        <Skeleton className="h-16 w-24 rounded-xl" />
        <Skeleton className="h-16 w-24 rounded-xl" />
      </div>

      {/* Day labels */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="mx-auto h-4 w-4" />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {[...Array(5)].map((_, week) => (
          <div key={week} className="grid grid-cols-7 gap-1">
            {[...Array(7)].map((_, day) => (
              <Skeleton key={day} className="mx-auto h-8 w-8 rounded-lg sm:h-10 sm:w-10" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// DAY CELL COMPONENT
// ============================================================================

interface DayCellProps {
  day: CalendarDay;
}

function DayCell({ day }: DayCellProps) {
  const statusClass = getDayStatusClass(day);

  const baseClasses =
    'relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-all';

  const statusStyles: Record<string, string> = {
    future: 'bg-gray-50 text-gray-300 cursor-default',
    today: 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-400 ring-offset-1',
    'today-active':
      'bg-gradient-to-br from-emerald-400 to-green-500 text-white ring-2 ring-emerald-400 ring-offset-1 shadow-md',
    'active-streak':
      'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-sm hover:shadow-md',
    active: 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-sm hover:shadow-md',
    grace: 'bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-600 border border-indigo-200',
    inactive: 'bg-gray-100 text-gray-400 hover:bg-gray-150',
  };

  // Build tooltip text
  const tooltipParts: string[] = [];
  if (day.isToday) tooltipParts.push('Today');
  if (day.hasActivity) tooltipParts.push('Active');
  if (day.isGraceDay) tooltipParts.push('Grace day');
  if (day.isPartOfStreak) tooltipParts.push('Part of streak');
  const tooltip = tooltipParts.length > 0 ? tooltipParts.join(' - ') : 'No activity';

  return (
    <div
      className={cn(baseClasses, statusStyles[statusClass])}
      title={tooltip}
      aria-label={`${day.date}: ${tooltip}`}
      role="gridcell"
    >
      {day.dayOfMonth}

      {/* Activity indicator dot for streak days */}
      {day.hasActivity && day.isPartOfStreak && !day.isToday && (
        <FireIcon
          className="absolute -right-0.5 -top-0.5 h-3 w-3 text-orange-300 drop-shadow sm:h-3.5 sm:w-3.5"
          aria-hidden="true"
        />
      )}

      {/* Grace day shield indicator */}
      {day.isGraceDay && (
        <ShieldCheckIcon
          className="absolute -right-0.5 -top-0.5 h-3 w-3 text-indigo-400 sm:h-3.5 sm:w-3.5"
          aria-hidden="true"
        />
      )}

      {/* Today sparkle */}
      {day.isToday && day.hasActivity && (
        <SparklesIcon
          className="absolute -right-1 -top-1 h-3 w-3 animate-pulse text-yellow-300 sm:h-4 sm:w-4"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

// ============================================================================
// STATS BAR COMPONENT
// ============================================================================

interface StatsBarProps {
  data: StreakCalendarData;
}

function StatsBar({ data }: StatsBarProps) {
  const { availability, isEnabled } = useGraceDay();

  return (
    <div
      className="mb-4 grid grid-cols-4 gap-2 sm:gap-4"
      role="group"
      aria-label="Streak statistics"
    >
      {/* Current streak */}
      <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 p-2 sm:p-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <FireIcon className="h-4 w-4 text-orange-500 sm:h-5 sm:w-5" aria-hidden="true" />
          <span className="text-lg font-bold text-gray-800 sm:text-xl">
            {data.currentStreakDays}
          </span>
        </div>
        <div className="mt-0.5 text-[10px] font-medium text-gray-500 sm:text-xs">
          Current streak
        </div>
      </div>

      {/* Active days */}
      <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-2 sm:p-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <CheckCircleIcon className="h-4 w-4 text-emerald-500 sm:h-5 sm:w-5" aria-hidden="true" />
          <span className="text-lg font-bold text-gray-800 sm:text-xl">{data.activeDays}</span>
        </div>
        <div className="mt-0.5 text-[10px] font-medium text-gray-500 sm:text-xs">Active days</div>
      </div>

      {/* Grace days used */}
      <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 p-2 sm:p-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ShieldCheckIcon className="h-4 w-4 text-indigo-500 sm:h-5 sm:w-5" aria-hidden="true" />
          <span className="text-lg font-bold text-gray-800 sm:text-xl">{data.graceDaysUsed}</span>
        </div>
        <div className="mt-0.5 text-[10px] font-medium text-gray-500 sm:text-xs">Grace days</div>
      </div>

      {/* Grace day protection status */}
      <div
        className={cn(
          'rounded-xl p-2 sm:p-3',
          isEnabled && availability.isAvailable
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50'
            : 'bg-gradient-to-br from-amber-50 to-yellow-50'
        )}
        title={getGraceDayTooltip(availability)}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isEnabled && availability.isAvailable ? (
            <ShieldCheckIcon
              className="h-4 w-4 text-emerald-500 sm:h-5 sm:w-5"
              aria-hidden="true"
            />
          ) : (
            <ShieldExclamationIcon
              className="h-4 w-4 text-amber-500 sm:h-5 sm:w-5"
              aria-hidden="true"
            />
          )}
          <span className="text-lg font-bold text-gray-800 sm:text-xl">
            {isEnabled ? availability.remaining : 0}
          </span>
        </div>
        <div className="mt-0.5 text-[10px] font-medium text-gray-500 sm:text-xs">
          {isEnabled ? 'Available' : 'Disabled'}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LEGEND COMPONENT
// ============================================================================

function CalendarLegend() {
  return (
    <div
      className="mt-4 flex flex-wrap justify-center gap-3 text-xs sm:gap-4 sm:text-sm"
      role="group"
      aria-label="Calendar legend"
    >
      <div className="flex items-center gap-1.5">
        <div
          className="h-3 w-3 rounded bg-gradient-to-br from-orange-400 to-amber-500 sm:h-4 sm:w-4"
          aria-hidden="true"
        />
        <span className="text-gray-600">Streak day</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div
          className="h-3 w-3 rounded bg-gradient-to-br from-emerald-400 to-green-500 sm:h-4 sm:w-4"
          aria-hidden="true"
        />
        <span className="text-gray-600">Active</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div
          className="h-3 w-3 rounded border border-indigo-200 bg-gradient-to-br from-blue-100 to-indigo-100 sm:h-4 sm:w-4"
          aria-hidden="true"
        />
        <span className="text-gray-600">Grace day</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded bg-gray-100 sm:h-4 sm:w-4" aria-hidden="true" />
        <span className="text-gray-600">Inactive</span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface StreakCalendarProps {
  days?: number;
  showStats?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function StreakCalendar({
  days = 30,
  showStats = true,
  showLegend = true,
  className,
}: StreakCalendarProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  const streakProgress = useQuery(
    api.achievements.getStreakProgress,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  // Build calendar data from activity dates
  const calendarData = useMemo<StreakCalendarData | null>(() => {
    if (!streakProgress) return null;
    return buildStreakCalendar(streakProgress.activityDates, days);
  }, [streakProgress, days]);

  // Get month markers for the date range (must be before early return for hooks rules)
  const monthMarkers = useMemo(() => {
    if (!calendarData) return [];
    const markers: { month: string; position: number }[] = [];
    let lastMonth = '';

    calendarData.weeks.forEach((week, weekIndex) => {
      week.days.forEach((day) => {
        const month = getMonthName(day.date);
        if (month !== lastMonth) {
          markers.push({ month, position: weekIndex });
          lastMonth = month;
        }
      });
    });

    return markers;
  }, [calendarData]);

  // Loading state
  if (profileLoading || streakProgress === undefined || calendarData === null) {
    return <StreakCalendarSkeleton />;
  }

  const activitySummary = formatActivitySummary(calendarData);
  const streakMessage = getStreakMessage(calendarData);

  return (
    <div
      className={cn('rounded-2xl bg-white p-4 shadow-sm sm:p-6', className)}
      role="region"
      aria-label="Streak calendar"
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-indigo-500" aria-hidden="true" />
          <h3 className="text-base font-semibold text-gray-800 sm:text-lg">Activity Calendar</h3>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 sm:px-3">
          <ChartBarIcon className="h-3.5 w-3.5 text-indigo-500 sm:h-4 sm:w-4" aria-hidden="true" />
          <span className="text-xs font-medium text-indigo-600 sm:text-sm">{activitySummary}</span>
        </div>
      </div>

      {/* Streak message */}
      <div className="mb-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2">
        <FireIcon className="h-4 w-4 text-orange-500 sm:h-5 sm:w-5" aria-hidden="true" />
        <span className="text-sm font-medium text-gray-700">{streakMessage}</span>
      </div>

      {/* Stats bar */}
      {showStats && <StatsBar data={calendarData} />}

      {/* Month markers */}
      {monthMarkers.length > 1 && (
        <div className="mb-2 flex gap-2 text-xs font-medium text-gray-500">
          {monthMarkers.map((marker, i) => (
            <span
              key={i}
              className="rounded bg-gray-100 px-2 py-0.5"
              style={{ marginLeft: i === 0 ? 0 : 'auto' }}
            >
              {marker.month}
            </span>
          ))}
        </div>
      )}

      {/* Day of week labels */}
      <div className="mb-2 grid grid-cols-7 gap-1" role="row" aria-label="Days of week">
        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
          <div
            key={dayIndex}
            className="text-center text-[10px] font-medium text-gray-400 sm:text-xs"
            role="columnheader"
          >
            {getDayAbbreviation(dayIndex)}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1" role="grid" aria-label={`Past ${days} days activity`}>
        {calendarData.weeks.map((week) => (
          <div key={week.weekNumber} className="grid grid-cols-7 gap-1" role="row">
            {/* Add empty cells for partial first week */}
            {week.weekNumber === 0 &&
              week.days.length < 7 &&
              [...Array(7 - week.days.length)].map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                  role="gridcell"
                  aria-hidden="true"
                />
              ))}
            {week.days.map((day) => (
              <DayCell key={day.date} day={day} />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      {showLegend && <CalendarLegend />}
    </div>
  );
}
