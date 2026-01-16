'use client';

import { useState, useEffect } from 'react';
import {
  WifiIcon,
  SignalSlashIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  useOfflineStatus,
  formatLastSyncTime,
  getStatusMessage,
  type ConnectionStatus,
  type SyncStatus,
} from '@/components/providers/OfflineProvider';
import { cn } from '@/lib/utils';

// ============================================================================
// STATUS NOTIFICATION TOAST
// ============================================================================

interface StatusToastProps {
  isOnline: boolean;
  previousStatus: ConnectionStatus | null;
  visible: boolean;
  onDismiss: () => void;
}

function StatusToast({ isOnline, previousStatus, visible, onDismiss }: StatusToastProps) {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  // Only show toast when status actually changes (not on initial load)
  if (previousStatus === null) return null;

  const wentOffline = previousStatus === 'online' && !isOnline;
  const cameOnline = previousStatus === 'offline' && isOnline;

  // Don't show toast if no meaningful change
  if (!wentOffline && !cameOnline) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        visible ? 'opacity-100' : 'opacity-0'
      )}
      role="alert"
      aria-live="polite"
    >
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg',
          cameOnline
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
        )}
      >
        {cameOnline ? (
          <>
            <WifiIcon className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium">Back online! Syncing data...</span>
          </>
        ) : (
          <>
            <SignalSlashIcon className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium">You&apos;re offline. Viewing cached data.</span>
          </>
        )}
        <button
          onClick={onDismiss}
          className="ml-2 rounded p-1 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Dismiss notification"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function OfflineIndicatorSkeleton({ compact = true }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-full bg-gray-200 dark:bg-slate-700',
        compact ? 'h-8 w-8' : 'h-8 w-24'
      )}
      aria-hidden="true"
    />
  );
}

// ============================================================================
// SYNC STATUS ICON
// ============================================================================

function getSyncIcon(syncStatus: SyncStatus, isOnline: boolean) {
  if (!isOnline) {
    return SignalSlashIcon;
  }

  switch (syncStatus) {
    case 'syncing':
      return ArrowPathIcon;
    case 'pending':
      return CloudArrowUpIcon;
    case 'synced':
    default:
      return WifiIcon;
  }
}

function getStatusColor(
  connectionStatus: ConnectionStatus,
  syncStatus: SyncStatus
): { bg: string; icon: string; glow: string } {
  if (connectionStatus === 'offline') {
    return {
      bg: 'bg-gradient-to-r from-amber-400 to-orange-500',
      icon: 'text-white',
      glow: 'shadow-amber-400/50',
    };
  }

  switch (syncStatus) {
    case 'syncing':
      return {
        bg: 'bg-gradient-to-r from-blue-400 to-indigo-500',
        icon: 'text-white',
        glow: 'shadow-blue-400/50',
      };
    case 'pending':
      return {
        bg: 'bg-gradient-to-r from-yellow-400 to-amber-500',
        icon: 'text-white',
        glow: 'shadow-yellow-400/50',
      };
    case 'synced':
    default:
      return {
        bg: 'bg-gradient-to-r from-emerald-400 to-teal-500',
        icon: 'text-white',
        glow: 'shadow-emerald-400/50',
      };
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface OfflineIndicatorProps {
  /** Compact mode shows just the icon */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show tooltip on hover */
  showTooltip?: boolean;
}

/**
 * Offline indicator component.
 * Shows current connection status and sync state.
 * Displays a toast notification when status changes.
 */
export function OfflineIndicator({
  compact = true,
  className,
  showTooltip = true,
}: OfflineIndicatorProps) {
  const {
    isOnline,
    connectionStatus,
    syncStatus,
    lastSyncTime,
    isInitialized,
    statusChangedRecently,
    previousStatus,
  } = useOfflineStatus();

  const [showToast, setShowToast] = useState(false);

  // Show toast when status changes
  useEffect(() => {
    if (statusChangedRecently && previousStatus !== null) {
      setShowToast(true);
    }
  }, [statusChangedRecently, previousStatus]);

  // Don't render until initialized to avoid hydration mismatch
  if (!isInitialized) {
    return <OfflineIndicatorSkeleton compact={compact} />;
  }

  const Icon = getSyncIcon(syncStatus, isOnline);
  const colors = getStatusColor(connectionStatus, syncStatus);
  const statusMessage = getStatusMessage(connectionStatus, syncStatus);
  const lastSyncFormatted = formatLastSyncTime(lastSyncTime);

  // Only show indicator when offline or syncing (hide when fully online and synced to reduce clutter)
  const shouldShowIndicator = !isOnline || syncStatus !== 'synced';

  // Always show if status recently changed (so user sees the transition)
  const forceShow = statusChangedRecently;

  if (!shouldShowIndicator && !forceShow) {
    // Return an invisible placeholder to maintain layout
    return null;
  }

  return (
    <>
      {/* Status Toast */}
      <StatusToast
        isOnline={isOnline}
        previousStatus={previousStatus}
        visible={showToast}
        onDismiss={() => setShowToast(false)}
      />

      {/* Indicator Badge */}
      <div
        className={cn(
          'group relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-all',
          'shadow-md hover:shadow-lg',
          colors.bg,
          colors.glow,
          className
        )}
        role="status"
        aria-label={`${statusMessage}. Last synced: ${lastSyncFormatted}`}
      >
        {/* Icon */}
        <Icon
          className={cn('h-4 w-4', colors.icon, syncStatus === 'syncing' && 'animate-spin')}
          aria-hidden="true"
        />

        {/* Label (non-compact mode) */}
        {!compact && (
          <span className="text-xs font-medium text-white drop-shadow">
            {isOnline ? (syncStatus === 'syncing' ? 'Syncing' : 'Online') : 'Offline'}
          </span>
        )}

        {/* Active indicator dot */}
        {isOnline && syncStatus === 'synced' && (
          <div className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" aria-hidden="true" />
        )}

        {/* Tooltip on hover */}
        {showTooltip && (
          <div className="pointer-events-none absolute -bottom-16 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800 px-3 py-2 text-center text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-slate-700">
            <div className="font-medium">{statusMessage}</div>
            <div className="mt-1 text-gray-300 dark:text-slate-400">
              Last sync: {lastSyncFormatted}
            </div>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-800 dark:border-b-slate-700" />
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// DETAILED STATUS COMPONENT (for settings/status page)
// ============================================================================

/**
 * Detailed offline status display for settings or status pages
 */
export function OfflineStatusDetailed({ className }: { className?: string }) {
  const { isOnline, connectionStatus, syncStatus, lastSyncTime, isInitialized } =
    useOfflineStatus();

  if (!isInitialized) {
    return (
      <div className={cn('animate-pulse rounded-lg bg-gray-100 p-4 dark:bg-slate-800', className)}>
        <div className="h-6 w-32 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="mt-2 h-4 w-48 rounded bg-gray-200 dark:bg-slate-700" />
      </div>
    );
  }

  const statusMessage = getStatusMessage(connectionStatus, syncStatus);
  const lastSyncFormatted = formatLastSyncTime(lastSyncTime);
  const colors = getStatusColor(connectionStatus, syncStatus);

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        isOnline
          ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
          : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
        className
      )}
      role="status"
      aria-label={`Connection status: ${statusMessage}`}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', colors.bg)}>
          {isOnline ? (
            syncStatus === 'synced' ? (
              <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
            ) : (
              <ArrowPathIcon
                className={cn('h-5 w-5 text-white', syncStatus === 'syncing' && 'animate-spin')}
                aria-hidden="true"
              />
            )
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5 text-white" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1">
          <h3
            className={cn(
              'text-sm font-semibold',
              isOnline
                ? 'text-emerald-800 dark:text-emerald-200'
                : 'text-amber-800 dark:text-amber-200'
            )}
          >
            {isOnline ? 'Connected' : 'Offline Mode'}
          </h3>
          <p
            className={cn(
              'mt-0.5 text-sm',
              isOnline
                ? 'text-emerald-600 dark:text-emerald-300'
                : 'text-amber-600 dark:text-amber-300'
            )}
          >
            {statusMessage}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Last synced: {lastSyncFormatted}
          </p>
        </div>
      </div>
    </div>
  );
}

// Export skeleton for testing/loading states
export { OfflineIndicatorSkeleton };
