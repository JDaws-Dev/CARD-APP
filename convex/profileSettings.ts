/**
 * Profile Settings queries and mutations
 *
 * Manages per-profile settings like sleep schedules.
 * Allows different settings for each child profile.
 */
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Sleep schedule configuration
 */
export interface SleepSchedule {
  enabled: boolean;
  startHour: number; // 0-23
  startMinute: number; // 0-59
  endHour: number; // 0-23
  endMinute: number; // 0-59
}

/**
 * Default sleep schedule values
 */
const DEFAULT_SLEEP_SCHEDULE: SleepSchedule = {
  enabled: false,
  startHour: 20, // 8 PM
  startMinute: 0,
  endHour: 7, // 7 AM
  endMinute: 0,
};

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get settings for a specific profile
 * Returns default values if no settings exist
 */
export const getProfileSettings = query({
  args: {
    profileId: v.id('profiles'),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query('profileSettings')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .unique();

    if (!settings) {
      // Return default settings if none exist
      return {
        profileId: args.profileId,
        sleepSchedule: DEFAULT_SLEEP_SCHEDULE,
        sleepPinSet: false,
        exists: false,
      };
    }

    return {
      profileId: args.profileId,
      sleepSchedule: {
        enabled: settings.sleepEnabled ?? false,
        startHour: settings.sleepStartHour ?? DEFAULT_SLEEP_SCHEDULE.startHour,
        startMinute: settings.sleepStartMinute ?? DEFAULT_SLEEP_SCHEDULE.startMinute,
        endHour: settings.sleepEndHour ?? DEFAULT_SLEEP_SCHEDULE.endHour,
        endMinute: settings.sleepEndMinute ?? DEFAULT_SLEEP_SCHEDULE.endMinute,
      },
      sleepPinSet: !!settings.sleepPinHash,
      exists: true,
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy,
    };
  },
});

/**
 * Get sleep settings for multiple profiles (useful for parent view)
 */
export const getChildrenSleepSettings = query({
  args: {
    profileIds: v.array(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.profileIds.map(async (profileId) => {
        const settings = await ctx.db
          .query('profileSettings')
          .withIndex('by_profile', (q) => q.eq('profileId', profileId))
          .unique();

        // Get profile info
        const profile = await ctx.db.get(profileId);

        return {
          profileId,
          profileName: profile?.displayName ?? 'Unknown',
          profileType: profile?.profileType,
          sleepSchedule: settings
            ? {
                enabled: settings.sleepEnabled ?? false,
                startHour: settings.sleepStartHour ?? DEFAULT_SLEEP_SCHEDULE.startHour,
                startMinute: settings.sleepStartMinute ?? DEFAULT_SLEEP_SCHEDULE.startMinute,
                endHour: settings.sleepEndHour ?? DEFAULT_SLEEP_SCHEDULE.endHour,
                endMinute: settings.sleepEndMinute ?? DEFAULT_SLEEP_SCHEDULE.endMinute,
              }
            : DEFAULT_SLEEP_SCHEDULE,
          sleepPinSet: settings ? !!settings.sleepPinHash : false,
        };
      })
    );

    return results;
  },
});

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Update sleep schedule for a profile
 */
export const updateSleepSchedule = mutation({
  args: {
    profileId: v.id('profiles'),
    enabled: v.optional(v.boolean()),
    startHour: v.optional(v.number()),
    startMinute: v.optional(v.number()),
    endHour: v.optional(v.number()),
    endMinute: v.optional(v.number()),
    updatedBy: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('profileSettings')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .unique();

    const updateData: {
      sleepEnabled?: boolean;
      sleepStartHour?: number;
      sleepStartMinute?: number;
      sleepEndHour?: number;
      sleepEndMinute?: number;
      updatedAt: number;
      updatedBy?: typeof args.updatedBy;
    } = {
      updatedAt: Date.now(),
    };

    if (args.enabled !== undefined) updateData.sleepEnabled = args.enabled;
    if (args.startHour !== undefined) updateData.sleepStartHour = args.startHour;
    if (args.startMinute !== undefined) updateData.sleepStartMinute = args.startMinute;
    if (args.endHour !== undefined) updateData.sleepEndHour = args.endHour;
    if (args.endMinute !== undefined) updateData.sleepEndMinute = args.endMinute;
    if (args.updatedBy !== undefined) updateData.updatedBy = args.updatedBy;

    if (existing) {
      await ctx.db.patch(existing._id, updateData);
      return {
        action: 'updated' as const,
        profileId: args.profileId,
      };
    }

    // Create new settings record
    await ctx.db.insert('profileSettings', {
      profileId: args.profileId,
      sleepEnabled: args.enabled ?? false,
      sleepStartHour: args.startHour ?? DEFAULT_SLEEP_SCHEDULE.startHour,
      sleepStartMinute: args.startMinute ?? DEFAULT_SLEEP_SCHEDULE.startMinute,
      sleepEndHour: args.endHour ?? DEFAULT_SLEEP_SCHEDULE.endHour,
      sleepEndMinute: args.endMinute ?? DEFAULT_SLEEP_SCHEDULE.endMinute,
      updatedAt: Date.now(),
      updatedBy: args.updatedBy,
    });

    return {
      action: 'created' as const,
      profileId: args.profileId,
    };
  },
});

/**
 * Set sleep PIN for a profile (stored as hash)
 * PIN is used to temporarily exit sleep mode
 */
export const setSleepPin = mutation({
  args: {
    profileId: v.id('profiles'),
    pinHash: v.string(),
    updatedBy: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('profileSettings')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        sleepPinHash: args.pinHash,
        updatedAt: Date.now(),
        updatedBy: args.updatedBy,
      });
      return { action: 'updated' as const };
    }

    // Create new settings record with PIN
    await ctx.db.insert('profileSettings', {
      profileId: args.profileId,
      sleepPinHash: args.pinHash,
      updatedAt: Date.now(),
      updatedBy: args.updatedBy,
    });

    return { action: 'created' as const };
  },
});

/**
 * Remove sleep PIN for a profile
 */
export const removeSleepPin = mutation({
  args: {
    profileId: v.id('profiles'),
    updatedBy: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('profileSettings')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .unique();

    if (!existing) {
      return { action: 'no_settings' as const };
    }

    await ctx.db.patch(existing._id, {
      sleepPinHash: undefined,
      updatedAt: Date.now(),
      updatedBy: args.updatedBy,
    });

    return { action: 'removed' as const };
  },
});

/**
 * Verify sleep PIN for a profile
 * Returns true if PIN matches, false otherwise
 */
export const verifySleepPin = query({
  args: {
    profileId: v.id('profiles'),
    pinHash: v.string(),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query('profileSettings')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .unique();

    if (!settings || !settings.sleepPinHash) {
      return { valid: false, reason: 'no_pin_set' as const };
    }

    // Compare hashes (PIN should be hashed client-side before sending)
    if (settings.sleepPinHash === args.pinHash) {
      return { valid: true };
    }

    return { valid: false, reason: 'incorrect_pin' as const };
  },
});

/**
 * Toggle sleep mode enabled/disabled for a profile
 */
export const toggleSleepMode = mutation({
  args: {
    profileId: v.id('profiles'),
    updatedBy: v.optional(v.id('profiles')),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('profileSettings')
      .withIndex('by_profile', (q) => q.eq('profileId', args.profileId))
      .unique();

    if (existing) {
      const newEnabled = !existing.sleepEnabled;
      await ctx.db.patch(existing._id, {
        sleepEnabled: newEnabled,
        updatedAt: Date.now(),
        updatedBy: args.updatedBy,
      });
      return { enabled: newEnabled };
    }

    // Create new settings record with sleep enabled
    await ctx.db.insert('profileSettings', {
      profileId: args.profileId,
      sleepEnabled: true,
      sleepStartHour: DEFAULT_SLEEP_SCHEDULE.startHour,
      sleepStartMinute: DEFAULT_SLEEP_SCHEDULE.startMinute,
      sleepEndHour: DEFAULT_SLEEP_SCHEDULE.endHour,
      sleepEndMinute: DEFAULT_SLEEP_SCHEDULE.endMinute,
      updatedAt: Date.now(),
      updatedBy: args.updatedBy,
    });

    return { enabled: true };
  },
});
