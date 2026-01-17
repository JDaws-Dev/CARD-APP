import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  // Type utilities
  getNotificationTypeLabel,
  getNotificationTypeIcon,
  getNotificationTypeColor,
  ALL_NOTIFICATION_TYPES,
  // Date/time utilities
  formatNotificationDate,
  formatRelativeTime,
  formatNotificationTime,
  // Filtering utilities
  filterByType,
  filterByReadStatus,
  filterByProfile,
  filterByDateRange,
  getRecentNotifications,
  // Statistics
  countUnread,
  countByType,
  groupByDate,
  groupByType,
  // Quiet hours utilities
  parseTimeToMinutes,
  isWithinQuietHours,
  isNotificationTypeEnabled,
  // Pagination utilities
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
  clampPageSize,
  isValidPageSize,
  isValidCursor,
  hasMorePages,
  // Display utilities
  buildNotificationStatsDisplay,
  buildBadgeText,
  sortByNewest,
  sortByOldest,
  sortUnreadFirst,
  // Default preferences
  getDefaultPreferences,
  type Notification,
  type NotificationType,
  type NotificationPreferences,
  type PaginatedNotifications,
} from '../notifications';

// ============================================================================
// HELPER TO CREATE TEST NOTIFICATIONS
// ============================================================================

function createNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    _id: 'notification-1',
    _creationTime: Date.now(),
    familyId: 'family-1',
    type: 'achievement_earned',
    title: 'Test Notification',
    message: 'This is a test notification',
    isRead: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

// ============================================================================
// NOTIFICATION TYPE UTILITIES TESTS
// ============================================================================

describe('getNotificationTypeLabel', () => {
  it('should return correct label for achievement_earned', () => {
    expect(getNotificationTypeLabel('achievement_earned')).toBe('Achievement');
  });

  it('should return correct label for milestone_reached', () => {
    expect(getNotificationTypeLabel('milestone_reached')).toBe('Milestone');
  });

  it('should return correct label for streak_update', () => {
    expect(getNotificationTypeLabel('streak_update')).toBe('Streak');
  });

  it('should return correct label for collection_activity', () => {
    expect(getNotificationTypeLabel('collection_activity')).toBe('Activity');
  });

  it('should return correct label for wishlist_update', () => {
    expect(getNotificationTypeLabel('wishlist_update')).toBe('Wishlist');
  });

  it('should return correct label for system', () => {
    expect(getNotificationTypeLabel('system')).toBe('System');
  });
});

describe('getNotificationTypeIcon', () => {
  it('should return trophy emoji for achievement_earned', () => {
    expect(getNotificationTypeIcon('achievement_earned')).toBe('🏆');
  });

  it('should return target emoji for milestone_reached', () => {
    expect(getNotificationTypeIcon('milestone_reached')).toBe('🎯');
  });

  it('should return fire emoji for streak_update', () => {
    expect(getNotificationTypeIcon('streak_update')).toBe('🔥');
  });

  it('should return chart emoji for collection_activity', () => {
    expect(getNotificationTypeIcon('collection_activity')).toBe('📊');
  });

  it('should return star emoji for wishlist_update', () => {
    expect(getNotificationTypeIcon('wishlist_update')).toBe('⭐');
  });

  it('should return info emoji for system', () => {
    expect(getNotificationTypeIcon('system')).toBe('ℹ️');
  });
});

describe('getNotificationTypeColor', () => {
  it('should return gold for achievement_earned', () => {
    expect(getNotificationTypeColor('achievement_earned')).toBe('#F8D030');
  });

  it('should return blue for milestone_reached', () => {
    expect(getNotificationTypeColor('milestone_reached')).toBe('#6890F0');
  });

  it('should return orange for streak_update', () => {
    expect(getNotificationTypeColor('streak_update')).toBe('#F08030');
  });

  it('should return green for collection_activity', () => {
    expect(getNotificationTypeColor('collection_activity')).toBe('#78C850');
  });

  it('should return purple for wishlist_update', () => {
    expect(getNotificationTypeColor('wishlist_update')).toBe('#A040A0');
  });

  it('should return gray for system', () => {
    expect(getNotificationTypeColor('system')).toBe('#A8A878');
  });
});

describe('ALL_NOTIFICATION_TYPES', () => {
  it('should contain all 6 notification types', () => {
    expect(ALL_NOTIFICATION_TYPES).toHaveLength(6);
  });

  it('should include all expected types', () => {
    expect(ALL_NOTIFICATION_TYPES).toContain('achievement_earned');
    expect(ALL_NOTIFICATION_TYPES).toContain('milestone_reached');
    expect(ALL_NOTIFICATION_TYPES).toContain('streak_update');
    expect(ALL_NOTIFICATION_TYPES).toContain('collection_activity');
    expect(ALL_NOTIFICATION_TYPES).toContain('wishlist_update');
    expect(ALL_NOTIFICATION_TYPES).toContain('system');
  });
});

// ============================================================================
// DATE/TIME UTILITIES TESTS
// ============================================================================

describe('formatNotificationDate', () => {
  it('should format date as "Month Day, Year"', () => {
    const timestamp = Date.UTC(2026, 0, 15, 12, 0, 0);
    expect(formatNotificationDate(timestamp)).toBe('Jan 15, 2026');
  });

  it('should handle different months', () => {
    const timestamp = Date.UTC(2026, 11, 25, 12, 0, 0);
    expect(formatNotificationDate(timestamp)).toBe('Dec 25, 2026');
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "just now" for timestamps under 60 seconds', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 30 * 1000)).toBe('just now');
  });

  it('should return "1 minute ago" for 60 seconds', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 60 * 1000)).toBe('1 minute ago');
  });

  it('should return "X minutes ago" for multiple minutes', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 5 * 60 * 1000)).toBe('5 minutes ago');
  });

  it('should return "1 hour ago" for 60 minutes', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 60 * 60 * 1000)).toBe('1 hour ago');
  });

  it('should return "X hours ago" for multiple hours', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 3 * 60 * 60 * 1000)).toBe('3 hours ago');
  });

  it('should return "yesterday" for 24 hours', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 24 * 60 * 60 * 1000)).toBe('yesterday');
  });

  it('should return "X days ago" for multiple days', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 5 * 24 * 60 * 60 * 1000)).toBe('5 days ago');
  });

  it('should return "1 week ago" for 7 days', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 7 * 24 * 60 * 60 * 1000)).toBe('1 week ago');
  });

  it('should return "X weeks ago" for multiple weeks', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 21 * 24 * 60 * 60 * 1000)).toBe('3 weeks ago');
  });

  it('should return "1 month ago" for 30 days', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 30 * 24 * 60 * 60 * 1000)).toBe('1 month ago');
  });
});

describe('formatNotificationTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should use relative time for recent notifications', () => {
    const now = Date.now();
    expect(formatNotificationTime(now - 60 * 60 * 1000)).toBe('1 hour ago');
  });

  it('should use date format for older notifications', () => {
    const timestamp = Date.UTC(2026, 0, 1, 12, 0, 0);
    expect(formatNotificationTime(timestamp)).toBe('Jan 1, 2026');
  });
});

// ============================================================================
// FILTERING UTILITIES TESTS
// ============================================================================

describe('filterByType', () => {
  it('should filter notifications by type', () => {
    const notifications = [
      createNotification({ type: 'achievement_earned' }),
      createNotification({ type: 'milestone_reached' }),
      createNotification({ type: 'achievement_earned' }),
    ];

    const result = filterByType(notifications, 'achievement_earned');
    expect(result).toHaveLength(2);
    expect(result.every((n) => n.type === 'achievement_earned')).toBe(true);
  });

  it('should return empty array if no matches', () => {
    const notifications = [createNotification({ type: 'achievement_earned' })];

    const result = filterByType(notifications, 'system');
    expect(result).toHaveLength(0);
  });
});

describe('filterByReadStatus', () => {
  it('should filter unread notifications', () => {
    const notifications = [
      createNotification({ isRead: false }),
      createNotification({ isRead: true }),
      createNotification({ isRead: false }),
    ];

    const result = filterByReadStatus(notifications, false);
    expect(result).toHaveLength(2);
    expect(result.every((n) => !n.isRead)).toBe(true);
  });

  it('should filter read notifications', () => {
    const notifications = [
      createNotification({ isRead: false }),
      createNotification({ isRead: true }),
    ];

    const result = filterByReadStatus(notifications, true);
    expect(result).toHaveLength(1);
    expect(result[0].isRead).toBe(true);
  });
});

describe('filterByProfile', () => {
  it('should filter notifications by profile', () => {
    const notifications = [
      createNotification({ profileId: 'profile-1' }),
      createNotification({ profileId: 'profile-2' }),
      createNotification({ profileId: 'profile-1' }),
    ];

    const result = filterByProfile(notifications, 'profile-1');
    expect(result).toHaveLength(2);
    expect(result.every((n) => n.profileId === 'profile-1')).toBe(true);
  });
});

describe('filterByDateRange', () => {
  it('should filter notifications within date range', () => {
    const notifications = [
      createNotification({ createdAt: Date.UTC(2026, 0, 10) }),
      createNotification({ createdAt: Date.UTC(2026, 0, 15) }),
      createNotification({ createdAt: Date.UTC(2026, 0, 20) }),
    ];

    const start = Date.UTC(2026, 0, 12);
    const end = Date.UTC(2026, 0, 18);

    const result = filterByDateRange(notifications, start, end);
    expect(result).toHaveLength(1);
  });

  it('should include boundary dates', () => {
    const notifications = [createNotification({ createdAt: Date.UTC(2026, 0, 15, 12, 0, 0) })];

    const start = Date.UTC(2026, 0, 15, 0, 0, 0);
    const end = Date.UTC(2026, 0, 15, 23, 59, 59);

    const result = filterByDateRange(notifications, start, end);
    expect(result).toHaveLength(1);
  });
});

describe('getRecentNotifications', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return notifications from the last N days', () => {
    const now = Date.now();
    const notifications = [
      createNotification({ createdAt: now - 2 * 24 * 60 * 60 * 1000 }), // 2 days ago
      createNotification({ createdAt: now - 10 * 24 * 60 * 60 * 1000 }), // 10 days ago
    ];

    const result = getRecentNotifications(notifications, 7);
    expect(result).toHaveLength(1);
  });
});

// ============================================================================
// STATISTICS TESTS
// ============================================================================

describe('countUnread', () => {
  it('should return 0 for empty array', () => {
    expect(countUnread([])).toBe(0);
  });

  it('should count unread notifications', () => {
    const notifications = [
      createNotification({ isRead: false }),
      createNotification({ isRead: true }),
      createNotification({ isRead: false }),
    ];

    expect(countUnread(notifications)).toBe(2);
  });
});

describe('countByType', () => {
  it('should return zero counts for empty array', () => {
    const result = countByType([]);
    expect(result.achievement_earned).toBe(0);
    expect(result.milestone_reached).toBe(0);
    expect(result.streak_update).toBe(0);
    expect(result.collection_activity).toBe(0);
    expect(result.wishlist_update).toBe(0);
    expect(result.system).toBe(0);
  });

  it('should count notifications by type', () => {
    const notifications = [
      createNotification({ type: 'achievement_earned' }),
      createNotification({ type: 'achievement_earned' }),
      createNotification({ type: 'milestone_reached' }),
      createNotification({ type: 'system' }),
    ];

    const result = countByType(notifications);
    expect(result.achievement_earned).toBe(2);
    expect(result.milestone_reached).toBe(1);
    expect(result.system).toBe(1);
    expect(result.streak_update).toBe(0);
  });
});

describe('groupByDate', () => {
  it('should group notifications by date', () => {
    const notifications = [
      createNotification({ createdAt: Date.UTC(2026, 0, 15, 10, 0, 0) }),
      createNotification({ createdAt: Date.UTC(2026, 0, 15, 14, 0, 0) }),
      createNotification({ createdAt: Date.UTC(2026, 0, 14, 10, 0, 0) }),
    ];

    const result = groupByDate(notifications);
    expect(result.size).toBe(2);
    expect(result.get('2026-01-15')?.length).toBe(2);
    expect(result.get('2026-01-14')?.length).toBe(1);
  });
});

describe('groupByType', () => {
  it('should group notifications by type', () => {
    const notifications = [
      createNotification({ type: 'achievement_earned' }),
      createNotification({ type: 'achievement_earned' }),
      createNotification({ type: 'system' }),
    ];

    const result = groupByType(notifications);
    expect(result.size).toBe(2);
    expect(result.get('achievement_earned')?.length).toBe(2);
    expect(result.get('system')?.length).toBe(1);
  });
});

// ============================================================================
// QUIET HOURS UTILITIES TESTS
// ============================================================================

describe('parseTimeToMinutes', () => {
  it('should parse midnight correctly', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0);
  });

  it('should parse morning time correctly', () => {
    expect(parseTimeToMinutes('07:30')).toBe(7 * 60 + 30);
  });

  it('should parse noon correctly', () => {
    expect(parseTimeToMinutes('12:00')).toBe(12 * 60);
  });

  it('should parse evening time correctly', () => {
    expect(parseTimeToMinutes('22:00')).toBe(22 * 60);
  });
});

describe('isWithinQuietHours', () => {
  it('should return false when quiet hours are disabled', () => {
    const preferences: NotificationPreferences = {
      familyId: 'family-1',
      achievementNotifications: true,
      milestoneNotifications: true,
      streakNotifications: true,
      dailySummary: false,
      weeklySummary: true,
      systemNotifications: true,
      quietHoursEnabled: false,
    };

    expect(isWithinQuietHours(preferences)).toBe(false);
  });

  it('should return false when quiet hours times are not set', () => {
    const preferences: NotificationPreferences = {
      familyId: 'family-1',
      achievementNotifications: true,
      milestoneNotifications: true,
      streakNotifications: true,
      dailySummary: false,
      weeklySummary: true,
      systemNotifications: true,
      quietHoursEnabled: true,
    };

    expect(isWithinQuietHours(preferences)).toBe(false);
  });

  it('should check quiet hours based on current local time', () => {
    // This test verifies the function runs without error and returns a boolean
    // We can't easily mock local time in tests, so we just verify the logic works
    const now = new Date();
    const currentHour = now.getHours();

    // Set quiet hours to include the current hour
    const startHour = currentHour;
    const endHour = (currentHour + 2) % 24;

    const preferencesInQuietHours: NotificationPreferences = {
      familyId: 'family-1',
      achievementNotifications: true,
      milestoneNotifications: true,
      streakNotifications: true,
      dailySummary: false,
      weeklySummary: true,
      systemNotifications: true,
      quietHoursEnabled: true,
      quietHoursStart: `${String(startHour).padStart(2, '0')}:00`,
      quietHoursEnd: `${String(endHour).padStart(2, '0')}:00`,
    };

    // When current time is within quiet hours, should return true
    const result = isWithinQuietHours(preferencesInQuietHours);
    expect(typeof result).toBe('boolean');
    // Current hour is >= startHour, so we should be in quiet hours
    expect(result).toBe(true);
  });

  it('should return false when outside quiet hours', () => {
    const now = new Date();
    const currentHour = now.getHours();

    // Set quiet hours to be 4 hours before current time (safely in the past today)
    const startHour = (currentHour + 20) % 24; // 4 hours behind wrapping
    const endHour = (currentHour + 22) % 24; // 2 hours behind wrapping

    const preferencesOutsideQuietHours: NotificationPreferences = {
      familyId: 'family-1',
      achievementNotifications: true,
      milestoneNotifications: true,
      streakNotifications: true,
      dailySummary: false,
      weeklySummary: true,
      systemNotifications: true,
      quietHoursEnabled: true,
      quietHoursStart: `${String(startHour).padStart(2, '0')}:00`,
      quietHoursEnd: `${String(endHour).padStart(2, '0')}:00`,
    };

    // Current time is NOT within quiet hours range
    expect(isWithinQuietHours(preferencesOutsideQuietHours)).toBe(false);
  });

  it('should handle overnight quiet hours correctly', () => {
    // Test the overnight logic by checking with times that span midnight
    const now = new Date();
    const currentHour = now.getHours();

    // Create overnight quiet hours (22:00 to 07:00) that include current time if it's late night or early morning
    const isLateNightOrEarlyMorning = currentHour >= 22 || currentHour < 7;

    const overnightPreferences: NotificationPreferences = {
      familyId: 'family-1',
      achievementNotifications: true,
      milestoneNotifications: true,
      streakNotifications: true,
      dailySummary: false,
      weeklySummary: true,
      systemNotifications: true,
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
    };

    const result = isWithinQuietHours(overnightPreferences);
    expect(result).toBe(isLateNightOrEarlyMorning);
  });
});

describe('isNotificationTypeEnabled', () => {
  const basePreferences: NotificationPreferences = {
    familyId: 'family-1',
    achievementNotifications: true,
    milestoneNotifications: false,
    streakNotifications: true,
    dailySummary: false,
    weeklySummary: true,
    systemNotifications: true,
  };

  it('should return true for enabled notification types', () => {
    expect(isNotificationTypeEnabled('achievement_earned', basePreferences)).toBe(true);
    expect(isNotificationTypeEnabled('streak_update', basePreferences)).toBe(true);
    expect(isNotificationTypeEnabled('system', basePreferences)).toBe(true);
  });

  it('should return false for disabled notification types', () => {
    expect(isNotificationTypeEnabled('milestone_reached', basePreferences)).toBe(false);
    expect(isNotificationTypeEnabled('collection_activity', basePreferences)).toBe(false);
  });

  it('should always return true for wishlist_update', () => {
    expect(isNotificationTypeEnabled('wishlist_update', basePreferences)).toBe(true);
  });
});

// ============================================================================
// PAGINATION UTILITIES TESTS
// ============================================================================

describe('Pagination Constants', () => {
  it('should have correct default page size', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(20);
  });

  it('should have correct max page size', () => {
    expect(MAX_PAGE_SIZE).toBe(100);
  });

  it('should have correct min page size', () => {
    expect(MIN_PAGE_SIZE).toBe(1);
  });
});

describe('clampPageSize', () => {
  it('should return default page size for undefined', () => {
    expect(clampPageSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
  });

  it('should clamp to min page size', () => {
    expect(clampPageSize(0)).toBe(MIN_PAGE_SIZE);
    expect(clampPageSize(-5)).toBe(MIN_PAGE_SIZE);
  });

  it('should clamp to max page size', () => {
    expect(clampPageSize(150)).toBe(MAX_PAGE_SIZE);
    expect(clampPageSize(1000)).toBe(MAX_PAGE_SIZE);
  });

  it('should return valid page sizes unchanged', () => {
    expect(clampPageSize(1)).toBe(1);
    expect(clampPageSize(50)).toBe(50);
    expect(clampPageSize(100)).toBe(100);
    expect(clampPageSize(25)).toBe(25);
  });
});

describe('isValidPageSize', () => {
  it('should return true for valid page sizes', () => {
    expect(isValidPageSize(1)).toBe(true);
    expect(isValidPageSize(50)).toBe(true);
    expect(isValidPageSize(100)).toBe(true);
  });

  it('should return false for page sizes below min', () => {
    expect(isValidPageSize(0)).toBe(false);
    expect(isValidPageSize(-1)).toBe(false);
  });

  it('should return false for page sizes above max', () => {
    expect(isValidPageSize(101)).toBe(false);
    expect(isValidPageSize(1000)).toBe(false);
  });

  it('should return false for non-integer values', () => {
    expect(isValidPageSize(10.5)).toBe(false);
    expect(isValidPageSize(50.1)).toBe(false);
  });
});

describe('isValidCursor', () => {
  it('should return true for undefined cursor', () => {
    expect(isValidCursor(undefined)).toBe(true);
  });

  it('should return true for positive timestamps', () => {
    expect(isValidCursor(1000)).toBe(true);
    expect(isValidCursor(Date.now())).toBe(true);
  });

  it('should return false for zero or negative values', () => {
    expect(isValidCursor(0)).toBe(false);
    expect(isValidCursor(-1000)).toBe(false);
  });

  it('should return false for non-finite values', () => {
    expect(isValidCursor(Infinity)).toBe(false);
    expect(isValidCursor(NaN)).toBe(false);
  });
});

describe('hasMorePages', () => {
  it('should return true when hasMore and nextCursor exist', () => {
    const result: PaginatedNotifications = {
      notifications: [],
      hasMore: true,
      nextCursor: 1000,
      pageSize: 20,
      totalFetched: 20,
    };
    expect(hasMorePages(result)).toBe(true);
  });

  it('should return false when hasMore is false', () => {
    const result: PaginatedNotifications = {
      notifications: [],
      hasMore: false,
      nextCursor: 1000,
      pageSize: 20,
      totalFetched: 20,
    };
    expect(hasMorePages(result)).toBe(false);
  });

  it('should return false when nextCursor is undefined', () => {
    const result: PaginatedNotifications = {
      notifications: [],
      hasMore: true,
      nextCursor: undefined,
      pageSize: 20,
      totalFetched: 20,
    };
    expect(hasMorePages(result)).toBe(false);
  });
});

// ============================================================================
// DISPLAY UTILITIES TESTS
// ============================================================================

describe('buildNotificationStatsDisplay', () => {
  it('should return "No notifications" for zero total', () => {
    expect(buildNotificationStatsDisplay(0, 0)).toBe('No notifications');
  });

  it('should return "all read" when no unread', () => {
    expect(buildNotificationStatsDisplay(0, 5)).toBe('5 notifications (all read)');
  });

  it('should handle singular notification', () => {
    expect(buildNotificationStatsDisplay(0, 1)).toBe('1 notification (all read)');
  });

  it('should show unread count', () => {
    expect(buildNotificationStatsDisplay(3, 10)).toBe('3 unread of 10 notifications');
  });
});

describe('buildBadgeText', () => {
  it('should return empty string for zero', () => {
    expect(buildBadgeText(0)).toBe('');
  });

  it('should return number as string for normal counts', () => {
    expect(buildBadgeText(1)).toBe('1');
    expect(buildBadgeText(50)).toBe('50');
    expect(buildBadgeText(99)).toBe('99');
  });

  it('should return "99+" for counts over 99', () => {
    expect(buildBadgeText(100)).toBe('99+');
    expect(buildBadgeText(500)).toBe('99+');
  });
});

describe('sortByNewest', () => {
  it('should sort notifications newest first', () => {
    const notifications = [
      createNotification({ createdAt: 1000 }),
      createNotification({ createdAt: 3000 }),
      createNotification({ createdAt: 2000 }),
    ];

    const result = sortByNewest(notifications);
    expect(result[0].createdAt).toBe(3000);
    expect(result[1].createdAt).toBe(2000);
    expect(result[2].createdAt).toBe(1000);
  });

  it('should not mutate original array', () => {
    const notifications = [
      createNotification({ createdAt: 1000 }),
      createNotification({ createdAt: 3000 }),
    ];

    sortByNewest(notifications);
    expect(notifications[0].createdAt).toBe(1000);
  });
});

describe('sortByOldest', () => {
  it('should sort notifications oldest first', () => {
    const notifications = [
      createNotification({ createdAt: 3000 }),
      createNotification({ createdAt: 1000 }),
      createNotification({ createdAt: 2000 }),
    ];

    const result = sortByOldest(notifications);
    expect(result[0].createdAt).toBe(1000);
    expect(result[1].createdAt).toBe(2000);
    expect(result[2].createdAt).toBe(3000);
  });
});

describe('sortUnreadFirst', () => {
  it('should sort unread notifications first', () => {
    const notifications = [
      createNotification({ isRead: true, createdAt: 3000 }),
      createNotification({ isRead: false, createdAt: 1000 }),
      createNotification({ isRead: false, createdAt: 2000 }),
    ];

    const result = sortUnreadFirst(notifications);
    expect(result[0].isRead).toBe(false);
    expect(result[1].isRead).toBe(false);
    expect(result[2].isRead).toBe(true);
  });

  it('should sort by date within same read status', () => {
    const notifications = [
      createNotification({ isRead: false, createdAt: 1000 }),
      createNotification({ isRead: false, createdAt: 3000 }),
      createNotification({ isRead: false, createdAt: 2000 }),
    ];

    const result = sortUnreadFirst(notifications);
    expect(result[0].createdAt).toBe(3000);
    expect(result[1].createdAt).toBe(2000);
    expect(result[2].createdAt).toBe(1000);
  });
});

// ============================================================================
// DEFAULT PREFERENCES TESTS
// ============================================================================

describe('getDefaultPreferences', () => {
  it('should return default preferences for a family', () => {
    const preferences = getDefaultPreferences('family-123');

    expect(preferences.familyId).toBe('family-123');
    expect(preferences.achievementNotifications).toBe(true);
    expect(preferences.milestoneNotifications).toBe(true);
    expect(preferences.streakNotifications).toBe(true);
    expect(preferences.dailySummary).toBe(false);
    expect(preferences.weeklySummary).toBe(true);
    expect(preferences.systemNotifications).toBe(true);
    expect(preferences.quietHoursEnabled).toBe(false);
    expect(preferences.isDefault).toBe(true);
  });
});
