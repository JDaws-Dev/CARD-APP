'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { cn } from '@/lib/utils';
import {
  ArrowsRightLeftIcon,
  ArrowPathIcon,
  UserIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import type { Id } from '../../../convex/_generated/dataModel';

interface TradeHistoryProps {
  limit?: number;
  className?: string;
  showHeader?: boolean;
}

const VARIANT_LABELS: Record<string, string> = {
  normal: 'Normal',
  holofoil: 'Holo',
  reverseHolofoil: 'Rev Holo',
  '1stEditionHolofoil': '1st Ed Holo',
  '1stEditionNormal': '1st Edition',
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  }
}

export function TradeHistory({ limit = 10, className, showHeader = true }: TradeHistoryProps) {
  const { profileId } = useCurrentProfile();

  const tradeHistory = useQuery(
    api.trades.getTradeHistory,
    profileId ? { profileId: profileId as Id<'profiles'>, limit } : 'skip'
  );

  const tradeStats = useQuery(
    api.trades.getTradeStats,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  if (tradeHistory === undefined || tradeStats === undefined) {
    return (
      <div className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="h-6 w-6 animate-spin text-kid-primary" />
        </div>
      </div>
    );
  }

  if (tradeHistory.length === 0) {
    return (
      <div className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>
        {showHeader && (
          <div className="mb-4 flex items-center gap-2">
            <ArrowsRightLeftIcon className="h-5 w-5 text-kid-primary" />
            <h3 className="font-semibold text-gray-800">Trade History</h3>
          </div>
        )}
        <div className="rounded-lg bg-gray-50 p-6 text-center">
          <ArrowsRightLeftIcon className="mx-auto mb-2 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">No trades logged yet.</p>
          <p className="mt-1 text-xs text-gray-400">
            Log your first trade to see it here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl bg-white p-4 shadow-sm', className)}>
      {showHeader && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowsRightLeftIcon className="h-5 w-5 text-kid-primary" />
            <h3 className="font-semibold text-gray-800">Trade History</h3>
          </div>
          <span className="rounded-full bg-kid-primary/10 px-2 py-0.5 text-xs font-medium text-kid-primary">
            {tradeStats.totalTrades} {tradeStats.totalTrades === 1 ? 'trade' : 'trades'}
          </span>
        </div>
      )}

      {/* Stats summary */}
      {tradeStats.totalTrades > 0 && (
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3">
          <div className="text-center">
            <div className="text-lg font-bold text-red-500">{tradeStats.totalCardsGiven}</div>
            <div className="text-xs text-gray-500">Given</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-500">{tradeStats.totalCardsReceived}</div>
            <div className="text-xs text-gray-500">Received</div>
          </div>
          <div className="text-center">
            <div
              className={cn(
                'text-lg font-bold',
                tradeStats.netCardsChange >= 0 ? 'text-green-500' : 'text-red-500'
              )}
            >
              {tradeStats.netCardsChange >= 0 ? '+' : ''}
              {tradeStats.netCardsChange}
            </div>
            <div className="text-xs text-gray-500">Net</div>
          </div>
        </div>
      )}

      {/* Trade list */}
      <div className="space-y-3">
        {tradeHistory.map((trade) => (
          <div
            key={trade._id}
            className="rounded-lg border border-gray-100 bg-gray-50/50 p-3"
          >
            {/* Trade header */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ClockIcon className="h-3.5 w-3.5" />
                {formatDate(trade.timestamp)}
              </div>
              {trade.tradingPartner && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <UserIcon className="h-3.5 w-3.5" />
                  <span className="max-w-[100px] truncate">{trade.tradingPartner}</span>
                </div>
              )}
            </div>

            {/* Cards exchanged */}
            <div className="space-y-2">
              {/* Cards given */}
              {trade.cardsGiven.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600">
                      -
                    </span>
                    <span className="text-xs font-medium text-gray-600">Gave</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pl-5">
                    {trade.cardsGiven.slice(0, 3).map((card, idx) => (
                      <span
                        key={`${card.cardId}-${idx}`}
                        className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-700"
                        title={`${card.cardName} (${VARIANT_LABELS[card.variant] ?? card.variant}) x${card.quantity}`}
                      >
                        {card.cardName} x{card.quantity}
                      </span>
                    ))}
                    {trade.cardsGiven.length > 3 && (
                      <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600">
                        +{trade.cardsGiven.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Cards received */}
              {trade.cardsReceived.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-600">
                      +
                    </span>
                    <span className="text-xs font-medium text-gray-600">Received</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pl-5">
                    {trade.cardsReceived.slice(0, 3).map((card, idx) => (
                      <span
                        key={`${card.cardId}-${idx}`}
                        className="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-700"
                        title={`${card.cardName} (${VARIANT_LABELS[card.variant] ?? card.variant}) x${card.quantity}`}
                      >
                        {card.cardName} x{card.quantity}
                      </span>
                    ))}
                    {trade.cardsReceived.length > 3 && (
                      <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-600">
                        +{trade.cardsReceived.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Trade summary */}
            <div className="mt-2 flex items-center justify-end gap-2 text-xs">
              <span className="text-red-500">{trade.totalCardsGiven} out</span>
              <ArrowsRightLeftIcon className="h-3 w-3 text-gray-400" />
              <span className="text-green-500">{trade.totalCardsReceived} in</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
