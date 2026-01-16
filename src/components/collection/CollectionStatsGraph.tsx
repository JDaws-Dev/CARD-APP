'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface ActivityLog {
  _id: Id<'activityLogs'>;
  _creationTime: number;
  profileId: Id<'profiles'>;
  action: 'card_added' | 'card_removed' | 'achievement_earned';
  metadata?: {
    cardId?: string;
    cardName?: string;
    setName?: string;
    variant?: string;
    quantity?: number;
    price?: number;
  };
}

interface MonthData {
  monthKey: string;
  monthLabel: string;
  cardsAdded: number;
  cumulativeCards: number;
  estimatedValue: number;
  cumulativeValue: number;
}

type ViewMode = 'cards' | 'value' | 'growth';

/**
 * Format month label from a date (short format for graph)
 */
function formatMonthShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

/**
 * Get month key for grouping (YYYY-MM)
 */
function getMonthKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Skeleton loader for stats graph
 */
export function CollectionStatsGraphSkeleton() {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="mb-4 flex gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

/**
 * Simple bar chart component
 */
function BarChart({
  data,
  dataKey,
  color,
  maxValue,
  formatValue,
}: {
  data: MonthData[];
  dataKey: 'cardsAdded' | 'cumulativeCards' | 'cumulativeValue';
  color: string;
  maxValue: number;
  formatValue: (value: number) => string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        No data to display
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Tooltip */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div className="pointer-events-none absolute -top-12 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-gray-800 px-3 py-2 text-sm text-white shadow-lg">
          <div className="font-medium">{data[hoveredIndex].monthLabel}</div>
          <div className="text-gray-300">{formatValue(data[hoveredIndex][dataKey])}</div>
        </div>
      )}

      {/* Chart */}
      <div className="flex h-64 items-end gap-1">
        {data.map((month, index) => {
          const value = month[dataKey];
          const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;

          return (
            <div
              key={month.monthKey}
              className="group relative flex flex-1 flex-col items-center"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Bar */}
              <div className="relative w-full flex-1">
                <div
                  className={cn(
                    'absolute bottom-0 w-full rounded-t-sm transition-all duration-200',
                    hoveredIndex === index ? 'opacity-100' : 'opacity-80',
                    color
                  )}
                  style={{ height: `${Math.max(heightPercent, 2)}%` }}
                />
              </div>

              {/* X-axis label (show every other for readability) */}
              {(data.length <= 6 || index % Math.ceil(data.length / 6) === 0) && (
                <div className="mt-2 text-xs text-gray-500 whitespace-nowrap">
                  {month.monthLabel.split(' ')[0]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Y-axis indicator */}
      <div className="absolute -left-2 top-0 flex h-64 flex-col justify-between text-xs text-gray-400">
        <span>{formatValue(maxValue)}</span>
        <span>{formatValue(Math.round(maxValue / 2))}</span>
        <span>0</span>
      </div>
    </div>
  );
}

/**
 * Collection Stats Graph component showing collection growth over time
 */
export function CollectionStatsGraph() {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  // Fetch all card additions
  const activity = useQuery(
    api.activityLogs.getRecentActivityWithNames,
    profileId ? { profileId: profileId as Id<'profiles'>, limit: 1000 } : 'skip'
  );

  // Process activity data into monthly stats
  const monthlyData = useMemo(() => {
    if (!activity) return [];

    // Filter to only card_added events
    const cardAdditions = (activity as ActivityLog[]).filter((log) => log.action === 'card_added');

    if (cardAdditions.length === 0) return [];

    // Sort by date ascending for cumulative calculation
    const sorted = [...cardAdditions].sort((a, b) => a._creationTime - b._creationTime);

    // Get date range
    const firstDate = new Date(sorted[0]._creationTime);
    const lastDate = new Date(sorted[sorted.length - 1]._creationTime);

    // Generate all months in range
    const months: Map<string, { cards: number; value: number }> = new Map();
    const current = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    const end = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);

    while (current <= end) {
      const key = getMonthKey(current.getTime());
      months.set(key, { cards: 0, value: 0 });
      current.setMonth(current.getMonth() + 1);
    }

    // Count cards per month
    for (const log of sorted) {
      const monthKey = getMonthKey(log._creationTime);
      const existing = months.get(monthKey) ?? { cards: 0, value: 0 };
      const quantity = log.metadata?.quantity ?? 1;
      const price = log.metadata?.price ?? 0;
      months.set(monthKey, {
        cards: existing.cards + quantity,
        value: existing.value + price * quantity,
      });
    }

    // Convert to array with cumulative values
    const result: MonthData[] = [];
    let cumulativeCards = 0;
    let cumulativeValue = 0;

    const sortedKeys = Array.from(months.keys()).sort();
    for (const monthKey of sortedKeys) {
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month - 1, 1);
      const data = months.get(monthKey)!;

      cumulativeCards += data.cards;
      cumulativeValue += data.value;

      result.push({
        monthKey,
        monthLabel: formatMonthShort(date),
        cardsAdded: data.cards,
        cumulativeCards,
        estimatedValue: data.value,
        cumulativeValue,
      });
    }

    // Only show last 12 months if there's too much data
    if (result.length > 12) {
      return result.slice(-12);
    }

    return result;
  }, [activity]);

  // Calculate max values for scaling
  const maxCards = useMemo(
    () => Math.max(...monthlyData.map((d) => d.cumulativeCards), 1),
    [monthlyData]
  );
  const maxCardsPerMonth = useMemo(
    () => Math.max(...monthlyData.map((d) => d.cardsAdded), 1),
    [monthlyData]
  );
  const maxValue = useMemo(
    () => Math.max(...monthlyData.map((d) => d.cumulativeValue), 1),
    [monthlyData]
  );

  // Loading state
  if (profileLoading || activity === undefined) {
    return <CollectionStatsGraphSkeleton />;
  }

  // Empty state
  if (monthlyData.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <ChartBarIcon className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h3 className="mb-2 text-lg font-semibold text-gray-800">No Stats Yet</h3>
        <p className="text-sm text-gray-500">
          Add cards to your collection to see your growth over time!
        </p>
      </div>
    );
  }

  // Calculate summary stats
  const totalCards = monthlyData[monthlyData.length - 1]?.cumulativeCards ?? 0;
  const totalValue = monthlyData[monthlyData.length - 1]?.cumulativeValue ?? 0;
  const avgPerMonth = Math.round(totalCards / monthlyData.length);
  const growthRate =
    monthlyData.length >= 2
      ? Math.round(
          ((monthlyData[monthlyData.length - 1]?.cardsAdded ?? 0) /
            (monthlyData[monthlyData.length - 2]?.cardsAdded || 1) -
            1) *
            100
        )
      : 0;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
          <ChartBarIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Collection Stats Over Time</h3>
          <p className="text-sm text-gray-500">Track your collecting journey</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 p-3">
          <div className="flex items-center gap-2 text-indigo-600">
            <ChartBarIcon className="h-4 w-4" />
            <span className="text-xs font-medium">Total Cards</span>
          </div>
          <div className="mt-1 text-xl font-bold text-indigo-700">{totalCards}</div>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 p-3">
          <div className="flex items-center gap-2 text-emerald-600">
            <CurrencyDollarIcon className="h-4 w-4" />
            <span className="text-xs font-medium">Est. Value</span>
          </div>
          <div className="mt-1 text-xl font-bold text-emerald-700">
            ${totalValue.toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-3">
          <div className="flex items-center gap-2 text-purple-600">
            <CalendarIcon className="h-4 w-4" />
            <span className="text-xs font-medium">Avg/Month</span>
          </div>
          <div className="mt-1 text-xl font-bold text-purple-700">{avgPerMonth}</div>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 p-3">
          <div className="flex items-center gap-2 text-amber-600">
            <ArrowTrendingUpIcon className="h-4 w-4" />
            <span className="text-xs font-medium">Growth</span>
          </div>
          <div className="mt-1 text-xl font-bold text-amber-700">
            {growthRate >= 0 ? '+' : ''}
            {growthRate}%
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setViewMode('cards')}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
            viewMode === 'cards'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <ChartBarIcon className="h-4 w-4" />
          Cards Added
        </button>
        <button
          onClick={() => setViewMode('growth')}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
            viewMode === 'growth'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <ArrowTrendingUpIcon className="h-4 w-4" />
          Total Growth
        </button>
        <button
          onClick={() => setViewMode('value')}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
            viewMode === 'value'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <CurrencyDollarIcon className="h-4 w-4" />
          Value Over Time
        </button>
      </div>

      {/* Chart */}
      <div className="pl-8">
        {viewMode === 'cards' && (
          <BarChart
            data={monthlyData}
            dataKey="cardsAdded"
            color="bg-indigo-500"
            maxValue={maxCardsPerMonth}
            formatValue={(v) => `${v} cards`}
          />
        )}
        {viewMode === 'growth' && (
          <BarChart
            data={monthlyData}
            dataKey="cumulativeCards"
            color="bg-purple-500"
            maxValue={maxCards}
            formatValue={(v) => `${v} total`}
          />
        )}
        {viewMode === 'value' && (
          <BarChart
            data={monthlyData}
            dataKey="cumulativeValue"
            color="bg-emerald-500"
            maxValue={maxValue}
            formatValue={(v) => `$${v.toFixed(2)}`}
          />
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 text-center text-xs text-gray-400">
        {viewMode === 'cards' && 'Cards added each month'}
        {viewMode === 'growth' && 'Total collection size over time'}
        {viewMode === 'value' && 'Cumulative estimated value over time'}
        {monthlyData.length === 12 && ' (showing last 12 months)'}
      </div>
    </div>
  );
}
