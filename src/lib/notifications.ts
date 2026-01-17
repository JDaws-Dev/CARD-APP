/**
 * Notification utilities for parent dashboard
 *
 * This module provides client-side utilities for working with
 * the parent notification system.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Notification types for parent dashboard
 */
export type NotificationType =
  | 'achievement_earned'
  | 'milestone_reached'
  | 'streak_update'
  | 'collection_activity'
  | 'wishlist_update'
  | 'system';

/**
 * Notification object structure (matches Convex schema)
 */
export interface Notification {
  _id: string;
  _creationTime: number;
  familyId: string;
  profileId?: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: number;
  createdAt: number;
}

/**
 * Notification preferences structure
 */
export interface NotificationPreferences {
  familyId: string;
  achievementNotifications: boolean;
  milestoneNotifications: boolean;
  streakNotifications: boolean;
  dailySummary: boolean;
  weeklySummary: boolean;
  systemNotifications: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  updatedAt?: number;
  isDefault?: boolean;
}

/**
 * Paginated notifications result
 */
export interface PaginatedNotifications {
  notifications: Notification[];
  nextCursor?: number;
  hasMore: boolean;
  pageSize: number;
  totalFetched: number;
}

// ============================================================================
// NOTIFICATION TYPE UTILITIES
// ============================================================================

/**
 * Get display label for a notification type
 */
export function getNotificationTypeLabel(type: NotificationType): string {
  const labels: Record<NotificationType, string> = {
    achievement_earned: 'Achievement',
    milestone_reached: 'Milestone',
    streak_update: 'Streak',
    collection_activity: 'Activity',
    wishlist_update: 'Wishlist',
    system: 'System',
  };
  return labels[type] || 'Unknown';
}

/**
 * Get icon for a notification type (emoji)
 */
export function getNotificationTypeIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    achievement_earned: '🏆',
    milestone_reached: '🎯',
    streak_update: '🔥',
    collection_activity: '📊',
    wishlist_update: '⭐',
    system: 'ℹ️',
  };
  return icons[type] || '📌';
}

/**
 * Get color for a notification type (hex color)
 */
export function getNotificationTypeColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    achievement_earned: '#F8D030', // Gold
    milestone_reached: '#6890F0', // Blue
    streak_update: '#F08030', // Orange
    collection_activity: '#78C850', // Green
    wishlist_update: '#A040A0', // Purple
    system: '#A8A878', // Gray
  };
  return colors[type] || '#A8A878';
}

/**
 * All notification types
 */
export const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  'achievement_earned',
  'milestone_reached',
  'streak_update',
  'collection_activity',
  'wishlist_update',
  'system',
];

// ============================================================================
// DATE/TIME UTILITIES
// ============================================================================

/**
 * Format a timestamp for display (e.g., "Jan 15, 2026")
 */
export function formatNotificationDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a timestamp as a relative string (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return 'just now';
  } else if (minutes === 1) {
    return '1 minute ago';
  } else if (minutes < 60) {
    return `${minutes} minutes ago`;
  } else if (hours === 1) {
    return '1 hour ago';
  } else if (hours < 24) {
    return `${hours} hours ago`;
  } else if (days === 1) {
    return 'yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else if (days < 14) {
    return '1 week ago';
  } else if (days < 30) {
    return `${Math.floor(days / 7)} weeks ago`;
  } else if (days < 60) {
    return '1 month ago';
  } else {
    return formatNotificationDate(timestamp);
  }
}

/**
 * Format notification timestamp for display
 * Uses relative time for recent notifications, date for older ones
 */
export function formatNotificationTime(timestamp: number): string {
  const daysAgo = Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));

  if (daysAgo < 7) {
    return formatRelativeTime(timestamp);
  } else {
    return formatNotificationDate(timestamp);
  }
}

// ============================================================================
// NOTIFICATION FILTERING UTILITIES
// ============================================================================

/**
 * Filter notifications by type
 */
export function filterByType(
  notifications: Notification[],
  type: NotificationType
): Notification[] {
  return notifications.filter((n) => n.type === type);
}

/**
 * Filter notifications by read status
 */
export function filterByReadStatus(notifications: Notification[], isRead: boolean): Notification[] {
  return notifications.filter((n) => n.isRead === isRead);
}

/**
 * Filter notifications by profile (child)
 */
export function filterByProfile(notifications: Notification[], profileId: string): Notification[] {
  return notifications.filter((n) => n.profileId === profileId);
}

/**
 * Filter notifications by date range
 */
export function filterByDateRange(
  notifications: Notification[],
  startDate: number,
  endDate: number
): Notification[] {
  return notifications.filter((n) => n.createdAt >= startDate && n.createdAt <= endDate);
}

/**
 * Get notifications from the last N days
 */
export function getRecentNotifications(
  notifications: Notification[],
  days: number
): Notification[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return notifications.filter((n) => n.createdAt >= cutoff);
}

// ============================================================================
// NOTIFICATION STATISTICS
// ============================================================================

/**
 * Count unread notifications
 */
export function countUnread(notifications: Notification[]): number {
  return notifications.filter((n) => !n.isRead).length;
}

/**
 * Count notifications by type
 */
export function countByType(notifications: Notification[]): Record<NotificationType, number> {
  const counts: Record<NotificationType, number> = {
    achievement_earned: 0,
    milestone_reached: 0,
    streak_update: 0,
    collection_activity: 0,
    wishlist_update: 0,
    system: 0,
  };

  for (const notification of notifications) {
    counts[notification.type]++;
  }

  return counts;
}

/**
 * Group notifications by date (YYYY-MM-DD)
 */
export function groupByDate(notifications: Notification[]): Map<string, Notification[]> {
  const groups = new Map<string, Notification[]>();

  for (const notification of notifications) {
    const dateStr = new Date(notification.createdAt).toISOString().split('T')[0];
    const existing = groups.get(dateStr) || [];
    existing.push(notification);
    groups.set(dateStr, existing);
  }

  return groups;
}

/**
 * Group notifications by type
 */
export function groupByType(notifications: Notification[]): Map<NotificationType, Notification[]> {
  const groups = new Map<NotificationType, Notification[]>();

  for (const notification of notifications) {
    const existing = groups.get(notification.type) || [];
    existing.push(notification);
    groups.set(notification.type, existing);
  }

  return groups;
}

// ============================================================================
// QUIET HOURS UTILITIES
// ============================================================================

/**
 * Parse a time string (HH:MM) to minutes since midnight
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if the current time is within quiet hours
 */
export function isWithinQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quietHoursEnabled) {
    return false;
  }

  if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const startMinutes = parseTimeToMinutes(preferences.quietHoursStart);
  const endMinutes = parseTimeToMinutes(preferences.quietHoursEnd);

  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (startMinutes > endMinutes) {
    // Quiet hours span midnight
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    // Normal quiet hours (e.g., 12:00 to 14:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

/**
 * Check if a notification type is enabled in preferences
 */
export function isNotificationTypeEnabled(
  type: NotificationType,
  preferences: NotificationPreferences
): boolean {
  const typeToPreference: Record<NotificationType, keyof NotificationPreferences | null> = {
    achievement_earned: 'achievementNotifications',
    milestone_reached: 'milestoneNotifications',
    streak_update: 'streakNotifications',
    collection_activity: 'dailySummary',
    wishlist_update: null, // Always enabled
    system: 'systemNotifications',
  };

  const field = typeToPreference[type];
  if (field === null) {
    return true; // Always enabled
  }

  return preferences[field] === true;
}

// ============================================================================
// PAGINATION UTILITIES
// ============================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

/**
 * Clamp page size to valid range
 */
export function clampPageSize(pageSize?: number): number {
  if (pageSize === undefined) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.max(MIN_PAGE_SIZE, Math.min(MAX_PAGE_SIZE, pageSize));
}

/**
 * Check if a page size is valid
 */
export function isValidPageSize(pageSize: number): boolean {
  return Number.isInteger(pageSize) && pageSize >= MIN_PAGE_SIZE && pageSize <= MAX_PAGE_SIZE;
}

/**
 * Check if a cursor is valid
 */
export function isValidCursor(cursor?: number): boolean {
  if (cursor === undefined) {
    return true;
  }
  return Number.isFinite(cursor) && cursor > 0;
}

/**
 * Check if there are more pages
 */
export function hasMorePages(result: PaginatedNotifications): boolean {
  return result.hasMore && result.nextCursor !== undefined;
}

// ============================================================================
// NOTIFICATION DISPLAY UTILITIES
// ============================================================================

/**
 * Build a display string for notification stats
 */
export function buildNotificationStatsDisplay(unread: number, total: number): string {
  if (total === 0) {
    return 'No notifications';
  }

  if (unread === 0) {
    return `${total} notification${total === 1 ? '' : 's'} (all read)`;
  }

  return `${unread} unread of ${total} notification${total === 1 ? '' : 's'}`;
}

/**
 * Build notification badge text (for notification bell)
 */
export function buildBadgeText(unreadCount: number): string {
  if (unreadCount === 0) {
    return '';
  }

  if (unreadCount > 99) {
    return '99+';
  }

  return String(unreadCount);
}

/**
 * Sort notifications by created date (newest first)
 */
export function sortByNewest(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Sort notifications by created date (oldest first)
 */
export function sortByOldest(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Sort notifications by unread first, then by date
 */
export function sortUnreadFirst(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => {
    // Unread notifications first
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    // Then by date (newest first)
    return b.createdAt - a.createdAt;
  });
}

// ============================================================================
// DEFAULT PREFERENCES
// ============================================================================

/**
 * Get default notification preferences for a new family
 */
export function getDefaultPreferences(familyId: string): NotificationPreferences {
  return {
    familyId,
    achievementNotifications: true,
    milestoneNotifications: true,
    streakNotifications: true,
    dailySummary: false,
    weeklySummary: true,
    systemNotifications: true,
    quietHoursEnabled: false,
    isDefault: true,
  };
}
