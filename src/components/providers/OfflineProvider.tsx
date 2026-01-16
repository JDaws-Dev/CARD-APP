'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

// ============================================================================
// OFFLINE STATUS TYPES
// ============================================================================

/**
 * Sync status for the application
 * - synced: All data is synced with server
 * - syncing: Currently syncing data
 * - pending: Has pending changes to sync
 */
export type SyncStatus = 'synced' | 'syncing' | 'pending';

/**
 * Connection status
 * - online: Connected to the internet
 * - offline: No internet connection
 */
export type ConnectionStatus = 'online' | 'offline';

// localStorage key for last sync time
const LAST_SYNC_KEY = 'carddex_last_sync';

// ============================================================================
// CONTEXT
// ============================================================================

interface OfflineContextType {
  /** Whether the browser is online */
  isOnline: boolean;
  /** Connection status (online/offline) */
  connectionStatus: ConnectionStatus;
  /** Sync status (synced/syncing/pending) */
  syncStatus: SyncStatus;
  /** Last successful sync time (null if never synced) */
  lastSyncTime: Date | null;
  /** Whether viewing cached data */
  isViewingCached: boolean;
  /** Whether the context is initialized */
  isInitialized: boolean;
  /** Manually trigger a sync indicator */
  setSyncing: (syncing: boolean) => void;
  /** Update sync time to now */
  updateSyncTime: () => void;
  /** Whether status has changed recently (for notifications) */
  statusChangedRecently: boolean;
  /** Previous connection status (for detecting changes) */
  previousStatus: ConnectionStatus | null;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access offline status and sync state
 */
export function useOfflineStatus() {
  const context = useContext(OfflineContext);
  if (!context) {
    // Return default values when used outside provider
    return {
      isOnline: true,
      connectionStatus: 'online' as ConnectionStatus,
      syncStatus: 'synced' as SyncStatus,
      lastSyncTime: null,
      isViewingCached: false,
      isInitialized: false,
      setSyncing: () => {},
      updateSyncTime: () => {},
      statusChangedRecently: false,
      previousStatus: null,
    };
  }
  return context;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the current online status from the browser
 */
function getBrowserOnlineStatus(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Load last sync time from localStorage
 */
function loadLastSyncTime(): Date | null {
  if (typeof localStorage === 'undefined') return null;

  try {
    const saved = localStorage.getItem(LAST_SYNC_KEY);
    if (saved) {
      const parsed = new Date(saved);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  } catch {
    // localStorage might not be available
  }

  return null;
}

/**
 * Save sync time to localStorage
 */
function saveSyncTime(time: Date) {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(LAST_SYNC_KEY, time.toISOString());
  } catch {
    // localStorage might not be available
  }
}

/**
 * Format the last sync time for display
 */
export function formatLastSyncTime(date: Date | null): string {
  if (!date) return 'Never synced';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Get a user-friendly status message
 */
export function getStatusMessage(
  connectionStatus: ConnectionStatus,
  syncStatus: SyncStatus
): string {
  if (connectionStatus === 'offline') {
    return 'You are offline. Viewing cached data.';
  }

  switch (syncStatus) {
    case 'syncing':
      return 'Syncing your data...';
    case 'pending':
      return 'Changes pending sync';
    case 'synced':
    default:
      return 'All data synced';
  }
}

// ============================================================================
// PROVIDER
// ============================================================================

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [statusChangedRecently, setStatusChangedRecently] = useState(false);
  const [previousStatus, setPreviousStatus] = useState<ConnectionStatus | null>(null);

  // Initialize from browser state and localStorage
  useEffect(() => {
    const online = getBrowserOnlineStatus();
    setIsOnline(online);
    setLastSyncTime(loadLastSyncTime());
    setIsInitialized(true);
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setPreviousStatus(isOnline ? 'online' : 'offline');
      setIsOnline(true);
      setStatusChangedRecently(true);
      // Clear the "recently changed" flag after 5 seconds
      setTimeout(() => setStatusChangedRecently(false), 5000);
    };

    const handleOffline = () => {
      setPreviousStatus(isOnline ? 'online' : 'offline');
      setIsOnline(false);
      setStatusChangedRecently(true);
      // Clear the "recently changed" flag after 5 seconds
      setTimeout(() => setStatusChangedRecently(false), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  const setSyncing = useCallback((syncing: boolean) => {
    setSyncStatus(syncing ? 'syncing' : 'synced');
    if (!syncing) {
      // Update sync time when syncing completes
      const now = new Date();
      setLastSyncTime(now);
      saveSyncTime(now);
    }
  }, []);

  const updateSyncTime = useCallback(() => {
    const now = new Date();
    setLastSyncTime(now);
    saveSyncTime(now);
  }, []);

  const connectionStatus: ConnectionStatus = isOnline ? 'online' : 'offline';
  const isViewingCached = !isOnline;

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        connectionStatus,
        syncStatus,
        lastSyncTime,
        isViewingCached,
        isInitialized,
        setSyncing,
        updateSyncTime,
        statusChangedRecently,
        previousStatus,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

// ============================================================================
// EXPORTS FOR TESTING
// ============================================================================

export { getBrowserOnlineStatus, loadLastSyncTime, saveSyncTime, LAST_SYNC_KEY };
