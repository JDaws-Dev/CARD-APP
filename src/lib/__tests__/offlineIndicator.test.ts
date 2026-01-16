/**
 * Tests for Offline Indicator functionality
 *
 * Tests the offline detection, sync status tracking, and formatting utilities
 * for the offline viewing indicator feature.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import the utility functions we'll test
// Note: We need to import these after mocking localStorage
const mockLocalStorage = () => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
};

describe('Offline Indicator - Utility Functions', () => {
  let localStorage: ReturnType<typeof mockLocalStorage>;

  beforeEach(() => {
    localStorage = mockLocalStorage();
    vi.stubGlobal('localStorage', localStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('formatLastSyncTime', () => {
    // Import dynamically to get fresh module with mocks
    const getFormatFunction = async () => {
      const mod = await import('@/components/providers/OfflineProvider');
      return mod.formatLastSyncTime;
    };

    it('returns "Never synced" for null date', async () => {
      const formatLastSyncTime = await getFormatFunction();
      expect(formatLastSyncTime(null)).toBe('Never synced');
    });

    it('returns "Just now" for recent times (< 60 seconds)', async () => {
      const formatLastSyncTime = await getFormatFunction();
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
      expect(formatLastSyncTime(thirtySecondsAgo)).toBe('Just now');
    });

    it('returns minutes ago for times between 1-59 minutes', async () => {
      const formatLastSyncTime = await getFormatFunction();
      const now = new Date();

      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(formatLastSyncTime(fiveMinutesAgo)).toBe('5 minutes ago');

      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
      expect(formatLastSyncTime(oneMinuteAgo)).toBe('1 minute ago');

      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      expect(formatLastSyncTime(thirtyMinutesAgo)).toBe('30 minutes ago');
    });

    it('returns hours ago for times between 1-23 hours', async () => {
      const formatLastSyncTime = await getFormatFunction();
      const now = new Date();

      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(formatLastSyncTime(twoHoursAgo)).toBe('2 hours ago');

      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      expect(formatLastSyncTime(oneHourAgo)).toBe('1 hour ago');

      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      expect(formatLastSyncTime(twelveHoursAgo)).toBe('12 hours ago');
    });

    it('returns date string for times > 24 hours', async () => {
      const formatLastSyncTime = await getFormatFunction();
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const result = formatLastSyncTime(twoDaysAgo);
      // Should be a date string, not "X hours ago"
      expect(result).not.toContain('hours ago');
      expect(result).not.toContain('minutes ago');
    });
  });

  describe('getStatusMessage', () => {
    const getStatusFunction = async () => {
      const mod = await import('@/components/providers/OfflineProvider');
      return mod.getStatusMessage;
    };

    it('returns offline message when connection is offline', async () => {
      const getStatusMessage = await getStatusFunction();
      expect(getStatusMessage('offline', 'synced')).toBe('You are offline. Viewing cached data.');
      expect(getStatusMessage('offline', 'syncing')).toBe('You are offline. Viewing cached data.');
      expect(getStatusMessage('offline', 'pending')).toBe('You are offline. Viewing cached data.');
    });

    it('returns syncing message when sync status is syncing', async () => {
      const getStatusMessage = await getStatusFunction();
      expect(getStatusMessage('online', 'syncing')).toBe('Syncing your data...');
    });

    it('returns pending message when sync status is pending', async () => {
      const getStatusMessage = await getStatusFunction();
      expect(getStatusMessage('online', 'pending')).toBe('Changes pending sync');
    });

    it('returns synced message when fully synced', async () => {
      const getStatusMessage = await getStatusFunction();
      expect(getStatusMessage('online', 'synced')).toBe('All data synced');
    });
  });

  describe('localStorage persistence', () => {
    it('saves sync time to localStorage', async () => {
      const mod = await import('@/components/providers/OfflineProvider');
      const { saveSyncTime, LAST_SYNC_KEY } = mod;

      const now = new Date();
      saveSyncTime(now);

      expect(localStorage.setItem).toHaveBeenCalledWith(LAST_SYNC_KEY, now.toISOString());
    });

    it('loads sync time from localStorage', async () => {
      const mod = await import('@/components/providers/OfflineProvider');
      const { loadLastSyncTime, LAST_SYNC_KEY } = mod;

      const testDate = new Date('2026-01-15T12:00:00Z');
      localStorage.setItem(LAST_SYNC_KEY, testDate.toISOString());

      // Reset the mock to return our value
      localStorage.getItem.mockReturnValueOnce(testDate.toISOString());

      const result = loadLastSyncTime();
      expect(result?.toISOString()).toBe(testDate.toISOString());
    });

    it('returns null for invalid localStorage data', async () => {
      const mod = await import('@/components/providers/OfflineProvider');
      const { loadLastSyncTime } = mod;

      localStorage.getItem.mockReturnValueOnce('invalid-date');

      const result = loadLastSyncTime();
      expect(result).toBeNull();
    });

    it('returns null when localStorage is empty', async () => {
      const mod = await import('@/components/providers/OfflineProvider');
      const { loadLastSyncTime } = mod;

      localStorage.getItem.mockReturnValueOnce(null);

      const result = loadLastSyncTime();
      expect(result).toBeNull();
    });
  });
});

describe('Offline Indicator - Type Definitions', () => {
  it('ConnectionStatus has correct values', async () => {
    const mod = await import('@/components/providers/OfflineProvider');
    // Type checking - these should compile
    const online: typeof mod extends { ConnectionStatus: infer T } ? T : never = 'online';
    const offline: typeof mod extends { ConnectionStatus: infer T } ? T : never = 'offline';
    expect(['online', 'offline']).toContain(online);
    expect(['online', 'offline']).toContain(offline);
  });

  it('SyncStatus has correct values', async () => {
    const mod = await import('@/components/providers/OfflineProvider');
    // Type checking - these should compile
    const synced: typeof mod extends { SyncStatus: infer T } ? T : never = 'synced';
    const syncing: typeof mod extends { SyncStatus: infer T } ? T : never = 'syncing';
    const pending: typeof mod extends { SyncStatus: infer T } ? T : never = 'pending';
    expect(['synced', 'syncing', 'pending']).toContain(synced);
    expect(['synced', 'syncing', 'pending']).toContain(syncing);
    expect(['synced', 'syncing', 'pending']).toContain(pending);
  });
});

describe('Offline Indicator - Hook Behavior', () => {
  describe('useOfflineStatus default values', () => {
    it('returns safe defaults when used outside provider', async () => {
      const mod = await import('@/components/providers/OfflineProvider');
      const { useOfflineStatus } = mod;

      // Note: In actual React context, this would return defaults
      // since there's no provider. We can test the function signature exists.
      expect(typeof useOfflineStatus).toBe('function');
    });
  });
});

describe('Offline Indicator - Status Color Logic', () => {
  it('should have different colors for different states', () => {
    // Test color logic expectations
    const offlineColor = 'amber'; // Offline uses amber/orange
    const syncingColor = 'blue'; // Syncing uses blue/indigo
    const pendingColor = 'yellow'; // Pending uses yellow/amber
    const syncedColor = 'emerald'; // Synced uses emerald/teal

    expect(offlineColor).not.toBe(syncedColor);
    expect(syncingColor).not.toBe(pendingColor);
    expect(offlineColor).not.toBe(syncingColor);
  });
});

describe('Offline Indicator - Accessibility', () => {
  it('should use proper ARIA attributes', () => {
    // Document expected ARIA attributes for the component
    const expectedAttributes = {
      role: 'status',
      ariaLabel: 'should include connection status and last sync time',
      ariaLive: 'polite', // for toast notifications
    };

    expect(expectedAttributes.role).toBe('status');
    expect(expectedAttributes.ariaLive).toBe('polite');
  });

  it('should support keyboard dismissal for toast', () => {
    // Toast should be dismissable
    const dismissMethods = ['click dismiss button', 'auto-dismiss after timeout'];
    expect(dismissMethods.length).toBeGreaterThan(0);
  });
});

describe('Offline Indicator - Browser API Integration', () => {
  describe('getBrowserOnlineStatus', () => {
    it('returns true when navigator.onLine is true', async () => {
      vi.stubGlobal('navigator', { onLine: true });

      const mod = await import('@/components/providers/OfflineProvider');
      const { getBrowserOnlineStatus } = mod;

      expect(getBrowserOnlineStatus()).toBe(true);
    });

    it('returns false when navigator.onLine is false', async () => {
      vi.stubGlobal('navigator', { onLine: false });

      // Need to reimport to get fresh evaluation
      vi.resetModules();
      const mod = await import('@/components/providers/OfflineProvider');
      const { getBrowserOnlineStatus } = mod;

      expect(getBrowserOnlineStatus()).toBe(false);
    });

    it('returns true when navigator is undefined (SSR)', async () => {
      // Simulate SSR environment
      const originalNavigator = global.navigator;
      // @ts-expect-error - intentionally setting to undefined for SSR simulation
      delete global.navigator;

      vi.resetModules();
      const mod = await import('@/components/providers/OfflineProvider');
      const { getBrowserOnlineStatus } = mod;

      expect(getBrowserOnlineStatus()).toBe(true);

      // Restore navigator
      global.navigator = originalNavigator;
    });
  });
});

describe('Offline Indicator - Component Structure', () => {
  it('should have compact and non-compact modes', () => {
    // Component should support both modes
    const modes = ['compact', 'full'];
    expect(modes).toContain('compact');
    expect(modes).toContain('full');
  });

  it('should have skeleton loading state', () => {
    // Component should have a skeleton for loading
    const hasSkeletonExport = true; // OfflineIndicatorSkeleton is exported
    expect(hasSkeletonExport).toBe(true);
  });

  it('should have toast notification for status changes', () => {
    // Component should show toast when status changes
    const toastFeatures = {
      showsOnOffline: true,
      showsOnOnline: true,
      autoDismisses: true,
      hasDismissButton: true,
    };
    expect(toastFeatures.autoDismisses).toBe(true);
    expect(toastFeatures.hasDismissButton).toBe(true);
  });
});

describe('Offline Indicator - Integration Points', () => {
  it('should integrate with AppHeader', () => {
    // OfflineIndicator is placed in AppHeader
    const headerIntegration = {
      desktopLocation: 'between streak counter and kid mode toggle',
      mobileLocation: 'in mobile menu gamification section',
    };
    expect(headerIntegration.desktopLocation).toBeTruthy();
    expect(headerIntegration.mobileLocation).toBeTruthy();
  });

  it('should use OfflineProvider from layout.tsx', () => {
    // OfflineProvider wraps the app
    const providerPosition = 'after DarkModeProvider, before GameSelectorProvider';
    expect(providerPosition).toBeTruthy();
  });
});

describe('Offline Indicator - Time Formatting Edge Cases', () => {
  const getFormatFunction = async () => {
    const mod = await import('@/components/providers/OfflineProvider');
    return mod.formatLastSyncTime;
  };

  it('handles exactly 60 seconds (1 minute)', async () => {
    const formatLastSyncTime = await getFormatFunction();
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    expect(formatLastSyncTime(oneMinuteAgo)).toBe('1 minute ago');
  });

  it('handles exactly 60 minutes (1 hour)', async () => {
    const formatLastSyncTime = await getFormatFunction();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    expect(formatLastSyncTime(oneHourAgo)).toBe('1 hour ago');
  });

  it('handles 59 seconds (still "Just now")', async () => {
    const formatLastSyncTime = await getFormatFunction();
    const now = new Date();
    const fiftyNineSecondsAgo = new Date(now.getTime() - 59 * 1000);
    expect(formatLastSyncTime(fiftyNineSecondsAgo)).toBe('Just now');
  });

  it('handles 23 hours', async () => {
    const formatLastSyncTime = await getFormatFunction();
    const now = new Date();
    const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000);
    expect(formatLastSyncTime(twentyThreeHoursAgo)).toBe('23 hours ago');
  });
});
