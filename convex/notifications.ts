import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

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

// Notification type validator for consistent typing
const notificationType = v.union(
  v.literal('achievement_earned'),
  v.literal('milestone_reached'),
  v.literal('streak_update'),
  v.literal('collection_activity'),
  v.literal('wishlist_update'),
  v.literal('system')
);

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all notifications for a family
 * Returns notifications sorted by creation time (newest first)
 */
export const getNotifications = query({
  args: {
    familyId: v.id('families'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .order('desc')
      .take(limit);

    return notifications;
  },
});

/**
 * Get unread notifications for a family
 * Returns only unread notifications sorted by creation time (newest first)
 */
export const getUnreadNotifications = query({
  args: {
    familyId: v.id('families'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_family_and_read', (q) => q.eq('familyId', args.familyId).eq('isRead', false))
      .order('desc')
      .take(limit);

    return notifications;
  },
});

/**
 * Get the count of unread notifications for a family
 * Useful for notification bell badge
 */
export const getUnreadCount = query({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_family_and_read', (q) => q.eq('familyId', args.familyId).eq('isRead', false))
      .collect();

    return { count: notifications.length };
  },
});

/**
 * Get notifications by type for a family
 * Useful for filtering notification views
 */
export const getNotificationsByType = query({
  args: {
    familyId: v.id('families'),
    type: notificationType,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_family_and_type', (q) => q.eq('familyId', args.familyId).eq('type', args.type))
      .order('desc')
      .take(limit);

    return notifications;
  },
});

/**
 * Get notifications for a specific profile (child)
 * Useful for viewing activity related to one child
 */
export const getNotificationsByProfile = query({
  args: {
    profileId: v.id('profiles'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .order('desc')
      .take(limit);

    return notifications;
  },
});

/**
 * Get notification preferences for a family
 * Returns preferences or null if not set (defaults should be applied client-side)
 */
export const getNotificationPreferences = query({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query('notificationPreferences')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .first();

    // Return preferences or defaults
    if (!preferences) {
      return {
        familyId: args.familyId,
        achievementNotifications: true,
        milestoneNotifications: true,
        streakNotifications: true,
        dailySummary: false,
        weeklySummary: true,
        systemNotifications: true,
        quietHoursEnabled: false,
        quietHoursStart: undefined,
        quietHoursEnd: undefined,
        isDefault: true,
      };
    }

    return { ...preferences, isDefault: false };
  },
});

/**
 * Get paginated notifications for a family
 * Uses cursor-based pagination for efficient large data sets
 */
export const getNotificationsPaginated = query({
  args: {
    familyId: v.id('families'),
    pageSize: v.optional(v.number()),
    cursor: v.optional(v.number()), // Timestamp cursor - fetch items older than this
  },
  handler: async (ctx, args) => {
    const pageSize = Math.min(Math.max(args.pageSize ?? 20, 1), 100);

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .order('desc')
      .take(pageSize * 3 + 1);

    let filteredNotifications = notifications;
    if (args.cursor !== undefined) {
      filteredNotifications = notifications.filter((n) => n.createdAt < args.cursor!);
    }

    const pageNotifications = filteredNotifications.slice(0, pageSize);
    const hasMore = filteredNotifications.length > pageSize;
    const nextCursor =
      pageNotifications.length > 0
        ? pageNotifications[pageNotifications.length - 1].createdAt
        : undefined;

    return {
      notifications: pageNotifications,
      nextCursor: hasMore ? nextCursor : undefined,
      hasMore,
      pageSize,
      totalFetched: pageNotifications.length,
    };
  },
});

/**
 * Get notification summary stats for a family
 * Returns counts by type and read status
 */
export const getNotificationStats = query({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const totalCount = notifications.length;

    // Count by type
    const byType: Record<NotificationType, number> = {
      achievement_earned: 0,
      milestone_reached: 0,
      streak_update: 0,
      collection_activity: 0,
      wishlist_update: 0,
      system: 0,
    };

    for (const notification of notifications) {
      byType[notification.type as NotificationType]++;
    }

    // Recent activity (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentCount = notifications.filter((n) => n.createdAt >= sevenDaysAgo).length;

    return {
      totalCount,
      unreadCount,
      readCount: totalCount - unreadCount,
      recentCount,
      byType,
    };
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new notification
 * Should be called when relevant events occur (achievements, milestones, etc.)
 */
export const createNotification = mutation({
  args: {
    familyId: v.id('families'),
    profileId: v.optional(v.id('profiles')),
    type: notificationType,
    title: v.string(),
    message: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if family wants this type of notification
    const preferences = await ctx.db
      .query('notificationPreferences')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .first();

    // Map notification types to preference fields
    const typeToPreference: Record<NotificationType, keyof typeof preferences | null> = {
      achievement_earned: 'achievementNotifications',
      milestone_reached: 'milestoneNotifications',
      streak_update: 'streakNotifications',
      collection_activity: 'dailySummary',
      wishlist_update: null, // Always create wishlist notifications
      system: 'systemNotifications',
    };

    // Check if notification should be created based on preferences
    // Default to true if no preferences are set
    if (preferences) {
      const preferenceField = typeToPreference[args.type as NotificationType];
      if (preferenceField && preferences[preferenceField] === false) {
        // User has disabled this notification type
        return { created: false, reason: 'disabled_by_preferences' };
      }
    }

    const notificationId = await ctx.db.insert('notifications', {
      familyId: args.familyId,
      profileId: args.profileId,
      type: args.type,
      title: args.title,
      message: args.message,
      metadata: args.metadata,
      isRead: false,
      createdAt: Date.now(),
    });

    return { created: true, notificationId };
  },
});

/**
 * Mark a single notification as read
 */
export const markAsRead = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      return { success: false, error: 'Notification not found' };
    }

    if (notification.isRead) {
      return { success: true, alreadyRead: true };
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });

    return { success: true, alreadyRead: false };
  },
});

/**
 * Mark all notifications for a family as read
 */
export const markAllAsRead = mutation({
  args: { familyId: v.id('families') },
  handler: async (ctx, args) => {
    const unreadNotifications = await ctx.db
      .query('notifications')
      .withIndex('by_family_and_read', (q) => q.eq('familyId', args.familyId).eq('isRead', false))
      .collect();

    const now = Date.now();
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
        readAt: now,
      });
    }

    return { markedCount: unreadNotifications.length };
  },
});

/**
 * Delete a notification
 */
export const deleteNotification = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);

    if (!notification) {
      return { success: false, error: 'Notification not found' };
    }

    await ctx.db.delete(args.notificationId);

    return { success: true };
  },
});

/**
 * Delete all read notifications older than a certain number of days
 * Useful for cleanup/maintenance
 */
export const deleteOldNotifications = mutation({
  args: {
    familyId: v.id('families'),
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffDate = Date.now() - args.olderThanDays * 24 * 60 * 60 * 1000;

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_family', (q) => q.eq('familyId', args.familyId))
      .collect();

    // Only delete read notifications older than the cutoff
    const toDelete = notifications.filter((n) => n.isRead && n.createdAt < cutoffDate);

    for (const notification of toDelete) {
      await ctx.db.delete(notification._id);
    }

    return { deletedCount: toDelete.length };
  },
});

/**
 * Update notification preferences for a family
 */
export const updateNotificationPreferences = mutation({
  args: {
    familyId: v.id('families'),
    achievementNotifications: v.optional(v.boolean()),
    milestoneNotifications: v.optional(v.boolean()),
    streakNotifications: v.optional(v.boolean()),
    dailySummary: v.optional(v.boolean()),
    weeklySummary: v.optional(v.boolean()),
    systemNotifications: v.optional(v.boolean()),
    quietHoursEnabled: v.optional(v.boolean()),
    quietHoursStart: v.optional(v.string()),
    quietHoursEnd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { familyId, ...updates } = args;

    // Check if preferences already exist
    const existing = await ctx.db
      .query('notificationPreferences')
      .withIndex('by_family', (q) => q.eq('familyId', familyId))
      .first();

    if (existing) {
      // Update existing preferences
      const updateData: Record<string, unknown> = { updatedAt: Date.now() };

      // Only include fields that were provided
      if (updates.achievementNotifications !== undefined) {
        updateData.achievementNotifications = updates.achievementNotifications;
      }
      if (updates.milestoneNotifications !== undefined) {
        updateData.milestoneNotifications = updates.milestoneNotifications;
      }
      if (updates.streakNotifications !== undefined) {
        updateData.streakNotifications = updates.streakNotifications;
      }
      if (updates.dailySummary !== undefined) {
        updateData.dailySummary = updates.dailySummary;
      }
      if (updates.weeklySummary !== undefined) {
        updateData.weeklySummary = updates.weeklySummary;
      }
      if (updates.systemNotifications !== undefined) {
        updateData.systemNotifications = updates.systemNotifications;
      }
      if (updates.quietHoursEnabled !== undefined) {
        updateData.quietHoursEnabled = updates.quietHoursEnabled;
      }
      if (updates.quietHoursStart !== undefined) {
        updateData.quietHoursStart = updates.quietHoursStart;
      }
      if (updates.quietHoursEnd !== undefined) {
        updateData.quietHoursEnd = updates.quietHoursEnd;
      }

      await ctx.db.patch(existing._id, updateData);

      return { updated: true, created: false, preferencesId: existing._id };
    } else {
      // Create new preferences with defaults
      const preferencesId = await ctx.db.insert('notificationPreferences', {
        familyId,
        achievementNotifications: updates.achievementNotifications ?? true,
        milestoneNotifications: updates.milestoneNotifications ?? true,
        streakNotifications: updates.streakNotifications ?? true,
        dailySummary: updates.dailySummary ?? false,
        weeklySummary: updates.weeklySummary ?? true,
        systemNotifications: updates.systemNotifications ?? true,
        quietHoursEnabled: updates.quietHoursEnabled ?? false,
        quietHoursStart: updates.quietHoursStart,
        quietHoursEnd: updates.quietHoursEnd,
        updatedAt: Date.now(),
      });

      return { updated: false, created: true, preferencesId };
    }
  },
});

// ============================================================================
// HELPER MUTATIONS FOR COMMON NOTIFICATION SCENARIOS
// ============================================================================

/**
 * Create an achievement notification
 * Called when a child earns an achievement
 */
export const createAchievementNotification = mutation({
  args: {
    familyId: v.id('families'),
    profileId: v.id('profiles'),
    profileName: v.string(),
    achievementKey: v.string(),
    achievementName: v.string(),
    achievementType: v.string(),
  },
  handler: async (ctx, args) => {
    const title = `${args.profileName} earned a badge!`;
    const message = `${args.profileName} earned the "${args.achievementName}" badge. Great job collecting!`;

    return await ctx.db.insert('notifications', {
      familyId: args.familyId,
      profileId: args.profileId,
      type: 'achievement_earned',
      title,
      message,
      metadata: {
        achievementKey: args.achievementKey,
        achievementName: args.achievementName,
        achievementType: args.achievementType,
        profileName: args.profileName,
      },
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * Create a milestone notification
 * Called when a child reaches a collection milestone
 */
export const createMilestoneNotification = mutation({
  args: {
    familyId: v.id('families'),
    profileId: v.id('profiles'),
    profileName: v.string(),
    milestone: v.number(),
    cardCount: v.number(),
  },
  handler: async (ctx, args) => {
    const title = `${args.profileName} reached ${args.milestone} cards!`;
    const message = `${args.profileName}'s collection has grown to ${args.cardCount} cards. What an achievement!`;

    return await ctx.db.insert('notifications', {
      familyId: args.familyId,
      profileId: args.profileId,
      type: 'milestone_reached',
      title,
      message,
      metadata: {
        milestone: args.milestone,
        cardCount: args.cardCount,
        profileName: args.profileName,
      },
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * Create a streak notification
 * Called for streak updates (started, maintained, at risk)
 */
export const createStreakNotification = mutation({
  args: {
    familyId: v.id('families'),
    profileId: v.id('profiles'),
    profileName: v.string(),
    streakDays: v.number(),
    streakStatus: v.union(v.literal('started'), v.literal('maintained'), v.literal('at_risk')),
  },
  handler: async (ctx, args) => {
    let title: string;
    let message: string;

    switch (args.streakStatus) {
      case 'started':
        title = `${args.profileName} started a streak!`;
        message = `${args.profileName} has started collecting cards daily. Keep it up!`;
        break;
      case 'maintained':
        title = `${args.profileName} is on a ${args.streakDays}-day streak!`;
        message = `${args.profileName} has been collecting cards for ${args.streakDays} days in a row. Amazing dedication!`;
        break;
      case 'at_risk':
        title = `${args.profileName}'s streak is at risk!`;
        message = `${args.profileName} hasn't added cards today yet. Their ${args.streakDays}-day streak might end!`;
        break;
    }

    return await ctx.db.insert('notifications', {
      familyId: args.familyId,
      profileId: args.profileId,
      type: 'streak_update',
      title,
      message,
      metadata: {
        streakDays: args.streakDays,
        streakStatus: args.streakStatus,
        profileName: args.profileName,
      },
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

/**
 * Create a daily activity summary notification
 * Called by a scheduled job to summarize daily activity
 */
export const createDailyActivitySummary = mutation({
  args: {
    familyId: v.id('families'),
    cardsAddedToday: v.number(),
    achievementsEarned: v.number(),
    activeProfiles: v.array(v.string()), // Profile names that were active
  },
  handler: async (ctx, args) => {
    if (args.cardsAddedToday === 0 && args.achievementsEarned === 0) {
      // Don't create notification if no activity
      return { created: false, reason: 'no_activity' };
    }

    const profileList = args.activeProfiles.length > 0 ? args.activeProfiles.join(', ') : 'No one';

    const title = `Daily Activity Summary`;
    const message =
      `Today's activity: ${args.cardsAddedToday} cards added, ` +
      `${args.achievementsEarned} badges earned. ` +
      `Active collectors: ${profileList}.`;

    const notificationId = await ctx.db.insert('notifications', {
      familyId: args.familyId,
      type: 'collection_activity',
      title,
      message,
      metadata: {
        cardsAddedToday: args.cardsAddedToday,
        achievementsEarned: args.achievementsEarned,
        activeProfiles: args.activeProfiles,
        summaryDate: new Date().toISOString().split('T')[0],
      },
      isRead: false,
      createdAt: Date.now(),
    });

    return { created: true, notificationId };
  },
});

/**
 * Create a system notification
 * Used for app updates, tips, and announcements
 */
export const createSystemNotification = mutation({
  args: {
    familyId: v.id('families'),
    title: v.string(),
    message: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert('notifications', {
      familyId: args.familyId,
      type: 'system',
      title: args.title,
      message: args.message,
      metadata: args.metadata,
      isRead: false,
      createdAt: Date.now(),
    });

    return { notificationId };
  },
});
