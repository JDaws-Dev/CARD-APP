import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CollectionCard,
  Achievement,
  ActivityLogEntry,
  // Collection stats
  calculateCollectionStats,
  extractSetId,
  // Badge stats
  calculateBadgeStats,
  // Streak calculation
  areConsecutiveDays,
  getTodayDateString,
  getYesterdayDateString,
  timestampToDateString,
  calculateStreak,
  extractActivityDates,
  // Activity formatting
  formatRelativeTime,
  getActivityIcon,
  formatActivityForDisplay,
  formatActivitiesForDisplay,
  // Dashboard stats
  calculateDashboardStats,
  // Streak helpers
  getStreakStatusMessage,
  isStreakAtRisk,
  formatStreakDisplay,
} from '../dashboardStats';

describe('Dashboard Stats Utilities', () => {
  // ============================================================================
  // COLLECTION STATS TESTS
  // ============================================================================

  describe('extractSetId', () => {
    it('should extract set ID from card ID', () => {
      expect(extractSetId('sv1-25')).toBe('sv1');
      expect(extractSetId('swsh12-100')).toBe('swsh12');
      expect(extractSetId('base1-4')).toBe('base1');
    });

    it('should handle card IDs without number', () => {
      expect(extractSetId('sv1')).toBe('sv1');
    });
  });

  describe('calculateCollectionStats', () => {
    it('should return zeros for empty collection', () => {
      const result = calculateCollectionStats([]);
      expect(result).toEqual({
        uniqueCards: 0,
        totalCards: 0,
        setsStarted: 0,
      });
    });

    it('should count unique cards correctly', () => {
      const cards: CollectionCard[] = [
        { cardId: 'sv1-1', quantity: 2 },
        { cardId: 'sv1-2', quantity: 1 },
        { cardId: 'sv1-1', quantity: 1 }, // Duplicate entry (different variant in real data)
      ];
      const result = calculateCollectionStats(cards);
      expect(result.uniqueCards).toBe(2);
    });

    it('should sum total quantity', () => {
      const cards: CollectionCard[] = [
        { cardId: 'sv1-1', quantity: 2 },
        { cardId: 'sv1-2', quantity: 3 },
        { cardId: 'sv2-1', quantity: 1 },
      ];
      const result = calculateCollectionStats(cards);
      expect(result.totalCards).toBe(6);
    });

    it('should count sets started', () => {
      const cards: CollectionCard[] = [
        { cardId: 'sv1-1', quantity: 1 },
        { cardId: 'sv1-2', quantity: 1 },
        { cardId: 'sv2-1', quantity: 1 },
        { cardId: 'swsh12-50', quantity: 1 },
      ];
      const result = calculateCollectionStats(cards);
      expect(result.setsStarted).toBe(3);
    });
  });

  // ============================================================================
  // BADGE STATS TESTS
  // ============================================================================

  describe('calculateBadgeStats', () => {
    it('should return zeros for no achievements', () => {
      const result = calculateBadgeStats([]);
      expect(result).toEqual({
        total: 0,
        recentlyEarned: 0,
      });
    });

    it('should count total achievements', () => {
      const achievements: Achievement[] = [
        { achievementKey: 'first_catch', earnedAt: Date.now() - 30 * 24 * 60 * 60 * 1000 },
        { achievementKey: 'starter_collector', earnedAt: Date.now() - 20 * 24 * 60 * 60 * 1000 },
        { achievementKey: 'rising_trainer', earnedAt: Date.now() - 2 * 24 * 60 * 60 * 1000 },
      ];
      const result = calculateBadgeStats(achievements);
      expect(result.total).toBe(3);
    });

    it('should count recently earned achievements (default 7 days)', () => {
      const now = Date.now();
      const achievements: Achievement[] = [
        { achievementKey: 'first_catch', earnedAt: now - 30 * 24 * 60 * 60 * 1000 },
        { achievementKey: 'starter_collector', earnedAt: now - 5 * 24 * 60 * 60 * 1000 },
        { achievementKey: 'rising_trainer', earnedAt: now - 2 * 24 * 60 * 60 * 1000 },
        { achievementKey: 'streak_3', earnedAt: now - 1 * 24 * 60 * 60 * 1000 },
      ];
      const result = calculateBadgeStats(achievements);
      expect(result.recentlyEarned).toBe(3);
    });

    it('should use custom recentDays parameter', () => {
      const now = Date.now();
      const achievements: Achievement[] = [
        { achievementKey: 'first_catch', earnedAt: now - 5 * 24 * 60 * 60 * 1000 },
        { achievementKey: 'starter_collector', earnedAt: now - 2 * 24 * 60 * 60 * 1000 },
      ];
      // With 3 days window, only the second one should count
      const result = calculateBadgeStats(achievements, 3);
      expect(result.recentlyEarned).toBe(1);
    });
  });

  // ============================================================================
  // STREAK CALCULATION TESTS
  // ============================================================================

  describe('areConsecutiveDays', () => {
    it('should return true for consecutive days', () => {
      expect(areConsecutiveDays('2026-01-15', '2026-01-16')).toBe(true);
      expect(areConsecutiveDays('2026-01-16', '2026-01-15')).toBe(true);
    });

    it('should return false for non-consecutive days', () => {
      expect(areConsecutiveDays('2026-01-15', '2026-01-17')).toBe(false);
      expect(areConsecutiveDays('2026-01-15', '2026-01-20')).toBe(false);
    });

    it('should return false for same day', () => {
      expect(areConsecutiveDays('2026-01-15', '2026-01-15')).toBe(false);
    });

    it('should handle month boundaries', () => {
      expect(areConsecutiveDays('2026-01-31', '2026-02-01')).toBe(true);
      expect(areConsecutiveDays('2026-02-28', '2026-03-01')).toBe(true);
    });

    it('should handle year boundaries', () => {
      expect(areConsecutiveDays('2025-12-31', '2026-01-01')).toBe(true);
    });
  });

  describe('timestampToDateString', () => {
    it('should convert timestamp to date string', () => {
      // Use a fixed timestamp to avoid timezone issues
      const timestamp = Date.UTC(2026, 0, 15, 12, 0, 0); // Jan 15, 2026 12:00 UTC
      expect(timestampToDateString(timestamp)).toBe('2026-01-15');
    });
  });

  describe('calculateStreak', () => {
    let originalDate: () => number;

    beforeEach(() => {
      // Mock Date.now to return a fixed date
      originalDate = Date.now;
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-16T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
      Date.now = originalDate;
    });

    it('should return zeros for empty dates', () => {
      const result = calculateStreak([]);
      expect(result).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        isActiveToday: false,
        lastActiveDate: null,
      });
    });

    it('should calculate streak for consecutive days ending today', () => {
      const dates = ['2026-01-14', '2026-01-15', '2026-01-16'];
      const result = calculateStreak(dates);
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
      expect(result.isActiveToday).toBe(true);
      expect(result.lastActiveDate).toBe('2026-01-16');
    });

    it('should calculate streak for consecutive days ending yesterday', () => {
      const dates = ['2026-01-13', '2026-01-14', '2026-01-15'];
      const result = calculateStreak(dates);
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
      expect(result.isActiveToday).toBe(false);
      expect(result.lastActiveDate).toBe('2026-01-15');
    });

    it('should reset streak if last activity was before yesterday', () => {
      const dates = ['2026-01-12', '2026-01-13', '2026-01-14'];
      const result = calculateStreak(dates);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(3);
    });

    it('should calculate longest streak separate from current streak', () => {
      // Had a 5-day streak in the past, currently on a 2-day streak
      const dates = [
        '2026-01-01',
        '2026-01-02',
        '2026-01-03',
        '2026-01-04',
        '2026-01-05', // 5-day streak
        '2026-01-15',
        '2026-01-16', // current 2-day streak
      ];
      const result = calculateStreak(dates);
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(5);
    });

    it('should handle single day activity', () => {
      const dates = ['2026-01-16'];
      const result = calculateStreak(dates);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.isActiveToday).toBe(true);
    });
  });

  describe('extractActivityDates', () => {
    it('should extract unique dates from logs', () => {
      const logs = [
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 15, 10, 0, 0) },
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 15, 14, 0, 0) },
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 16, 10, 0, 0) },
      ];
      const result = extractActivityDates(logs);
      expect(result).toEqual(['2026-01-15', '2026-01-16']);
    });

    it('should filter by action type', () => {
      const logs = [
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 15, 10, 0, 0) },
        { action: 'achievement_earned', timestamp: Date.UTC(2026, 0, 16, 10, 0, 0) },
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 17, 10, 0, 0) },
      ];
      const result = extractActivityDates(logs, 'card_added');
      expect(result).toEqual(['2026-01-15', '2026-01-17']);
    });

    it('should return sorted dates', () => {
      const logs = [
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 17, 10, 0, 0) },
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 15, 10, 0, 0) },
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 16, 10, 0, 0) },
      ];
      const result = extractActivityDates(logs);
      expect(result).toEqual(['2026-01-15', '2026-01-16', '2026-01-17']);
    });
  });

  // ============================================================================
  // ACTIVITY FORMATTING TESTS
  // ============================================================================

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-16T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format as "Just now" for recent timestamps', () => {
      const timestamp = Date.now() - 30 * 1000; // 30 seconds ago
      expect(formatRelativeTime(timestamp)).toBe('Just now');
    });

    it('should format minutes ago', () => {
      expect(formatRelativeTime(Date.now() - 60 * 1000)).toBe('1 min ago');
      expect(formatRelativeTime(Date.now() - 5 * 60 * 1000)).toBe('5 mins ago');
    });

    it('should format hours ago', () => {
      expect(formatRelativeTime(Date.now() - 60 * 60 * 1000)).toBe('1 hour ago');
      expect(formatRelativeTime(Date.now() - 3 * 60 * 60 * 1000)).toBe('3 hours ago');
    });

    it('should format days ago', () => {
      expect(formatRelativeTime(Date.now() - 24 * 60 * 60 * 1000)).toBe('1 day ago');
      expect(formatRelativeTime(Date.now() - 3 * 24 * 60 * 60 * 1000)).toBe('3 days ago');
    });
  });

  describe('getActivityIcon', () => {
    it('should return correct icons for action types', () => {
      expect(getActivityIcon('card_added')).toBe('➕');
      expect(getActivityIcon('card_removed')).toBe('➖');
      expect(getActivityIcon('achievement_earned')).toBe('🏆');
      expect(getActivityIcon('unknown_action')).toBe('📋');
    });
  });

  describe('formatActivityForDisplay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-16T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format card_added activity', () => {
      const log: ActivityLogEntry = {
        action: 'card_added',
        timestamp: Date.now() - 5 * 60 * 1000,
        metadata: { cardId: 'sv1-25', cardName: 'Pikachu' },
      };
      const result = formatActivityForDisplay(log);
      expect(result.displayText).toBe('Added Pikachu');
      expect(result.icon).toBe('➕');
      expect(result.action).toBe('card_added');
    });

    it('should use cardId when cardName is missing', () => {
      const log: ActivityLogEntry = {
        action: 'card_added',
        timestamp: Date.now(),
        metadata: { cardId: 'sv1-25' },
      };
      const result = formatActivityForDisplay(log);
      expect(result.displayText).toBe('Added sv1-25');
    });

    it('should use card name from map when not in metadata', () => {
      const log: ActivityLogEntry = {
        action: 'card_added',
        timestamp: Date.now(),
        metadata: { cardId: 'sv1-25' },
      };
      const cardNameMap = new Map([['sv1-25', 'Pikachu']]);
      const result = formatActivityForDisplay(log, cardNameMap);
      expect(result.displayText).toBe('Added Pikachu');
    });

    it('should format card_removed activity', () => {
      const log: ActivityLogEntry = {
        action: 'card_removed',
        timestamp: Date.now(),
        metadata: { cardId: 'sv1-25', cardName: 'Charizard' },
      };
      const result = formatActivityForDisplay(log);
      expect(result.displayText).toBe('Removed Charizard');
      expect(result.icon).toBe('➖');
    });

    it('should format achievement_earned activity', () => {
      const log: ActivityLogEntry = {
        action: 'achievement_earned',
        timestamp: Date.now(),
        metadata: { achievementKey: 'first_catch', achievementName: 'First Catch' },
      };
      const result = formatActivityForDisplay(log);
      expect(result.displayText).toBe('Earned First Catch');
      expect(result.icon).toBe('🏆');
    });

    it('should use achievementKey when achievementName is missing', () => {
      const log: ActivityLogEntry = {
        action: 'achievement_earned',
        timestamp: Date.now(),
        metadata: { achievementKey: 'streak_7' },
      };
      const result = formatActivityForDisplay(log);
      expect(result.displayText).toBe('Earned streak_7');
    });
  });

  describe('formatActivitiesForDisplay', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-16T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format multiple activities', () => {
      const logs: ActivityLogEntry[] = [
        { action: 'card_added', timestamp: Date.now(), metadata: { cardName: 'Pikachu' } },
        { action: 'achievement_earned', timestamp: Date.now(), metadata: { achievementName: 'First Catch' } },
      ];
      const result = formatActivitiesForDisplay(logs);
      expect(result).toHaveLength(2);
      expect(result[0].displayText).toBe('Added Pikachu');
      expect(result[1].displayText).toBe('Earned First Catch');
    });
  });

  // ============================================================================
  // DASHBOARD STATS TESTS
  // ============================================================================

  describe('calculateDashboardStats', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-16T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should calculate complete dashboard stats', () => {
      const collectionCards: CollectionCard[] = [
        { cardId: 'sv1-1', quantity: 2 },
        { cardId: 'sv1-25', quantity: 1 },
        { cardId: 'sv2-100', quantity: 3 },
      ];

      const achievements: Achievement[] = [
        { achievementKey: 'first_catch', earnedAt: Date.now() - 10 * 24 * 60 * 60 * 1000 },
        { achievementKey: 'starter_collector', earnedAt: Date.now() - 2 * 24 * 60 * 60 * 1000 },
      ];

      const activityLogs = [
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 14, 10, 0, 0) },
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 15, 10, 0, 0) },
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 16, 10, 0, 0) },
      ];

      const recentActivityLogs: ActivityLogEntry[] = [
        { action: 'card_added', timestamp: Date.now(), metadata: { cardName: 'Pikachu' } },
      ];

      const result = calculateDashboardStats(
        collectionCards,
        achievements,
        activityLogs,
        recentActivityLogs
      );

      expect(result.collection.uniqueCards).toBe(3);
      expect(result.collection.totalCards).toBe(6);
      expect(result.collection.setsStarted).toBe(2);
      expect(result.badges.total).toBe(2);
      expect(result.badges.recentlyEarned).toBe(1);
      expect(result.streak.currentStreak).toBe(3);
      expect(result.streak.isActiveToday).toBe(true);
      expect(result.recentActivity).toHaveLength(1);
      expect(result.recentActivity[0].displayText).toBe('Added Pikachu');
    });

    it('should handle empty data', () => {
      const result = calculateDashboardStats([], [], [], []);

      expect(result.collection.uniqueCards).toBe(0);
      expect(result.collection.totalCards).toBe(0);
      expect(result.collection.setsStarted).toBe(0);
      expect(result.badges.total).toBe(0);
      expect(result.badges.recentlyEarned).toBe(0);
      expect(result.streak.currentStreak).toBe(0);
      expect(result.streak.longestStreak).toBe(0);
      expect(result.recentActivity).toHaveLength(0);
    });
  });

  // ============================================================================
  // STREAK HELPER TESTS
  // ============================================================================

  describe('getStreakStatusMessage', () => {
    it('should show message for no streak with history', () => {
      const streak = {
        currentStreak: 0,
        longestStreak: 5,
        isActiveToday: false,
        lastActiveDate: '2026-01-10',
      };
      expect(getStreakStatusMessage(streak)).toBe('Start a new streak! Your best was 5 days.');
    });

    it('should show message for no streak without history', () => {
      const streak = {
        currentStreak: 0,
        longestStreak: 0,
        isActiveToday: false,
        lastActiveDate: null,
      };
      expect(getStreakStatusMessage(streak)).toBe('Add a card to start your streak!');
    });

    it('should show message for 1-day streak active today', () => {
      const streak = {
        currentStreak: 1,
        longestStreak: 1,
        isActiveToday: true,
        lastActiveDate: '2026-01-16',
      };
      expect(getStreakStatusMessage(streak)).toBe("You're on a roll! Keep it going tomorrow!");
    });

    it('should show message for multi-day streak active today', () => {
      const streak = {
        currentStreak: 5,
        longestStreak: 5,
        isActiveToday: true,
        lastActiveDate: '2026-01-16',
      };
      expect(getStreakStatusMessage(streak)).toBe('🔥 5 day streak! Keep it up!');
    });

    it('should show warning for streak at risk', () => {
      const streak = {
        currentStreak: 3,
        longestStreak: 5,
        isActiveToday: false,
        lastActiveDate: '2026-01-15',
      };
      expect(getStreakStatusMessage(streak)).toBe('⚠️ 3 day streak at risk! Add a card today!');
    });
  });

  describe('isStreakAtRisk', () => {
    it('should return true when streak exists but not active today', () => {
      const streak = {
        currentStreak: 3,
        longestStreak: 5,
        isActiveToday: false,
        lastActiveDate: '2026-01-15',
      };
      expect(isStreakAtRisk(streak)).toBe(true);
    });

    it('should return false when streak is active today', () => {
      const streak = {
        currentStreak: 3,
        longestStreak: 3,
        isActiveToday: true,
        lastActiveDate: '2026-01-16',
      };
      expect(isStreakAtRisk(streak)).toBe(false);
    });

    it('should return false when no streak', () => {
      const streak = {
        currentStreak: 0,
        longestStreak: 5,
        isActiveToday: false,
        lastActiveDate: '2026-01-10',
      };
      expect(isStreakAtRisk(streak)).toBe(false);
    });
  });

  describe('formatStreakDisplay', () => {
    it('should format no streak', () => {
      const streak = {
        currentStreak: 0,
        longestStreak: 0,
        isActiveToday: false,
        lastActiveDate: null,
      };
      expect(formatStreakDisplay(streak)).toBe('No streak');
    });

    it('should format 1 day streak', () => {
      const streak = {
        currentStreak: 1,
        longestStreak: 1,
        isActiveToday: true,
        lastActiveDate: '2026-01-16',
      };
      expect(formatStreakDisplay(streak)).toBe('1 day');
    });

    it('should format multi-day streak', () => {
      const streak = {
        currentStreak: 7,
        longestStreak: 7,
        isActiveToday: true,
        lastActiveDate: '2026-01-16',
      };
      expect(formatStreakDisplay(streak)).toBe('7 days');
    });
  });
});

// ============================================================================
// INTEGRATION SCENARIOS
// ============================================================================

describe('Dashboard Stats Integration Scenarios', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('New User Dashboard', () => {
    it('should show appropriate stats for a brand new user', () => {
      const result = calculateDashboardStats([], [], [], []);

      expect(result.collection.uniqueCards).toBe(0);
      expect(result.badges.total).toBe(0);
      expect(result.streak.currentStreak).toBe(0);
      expect(getStreakStatusMessage(result.streak)).toBe('Add a card to start your streak!');
      expect(formatStreakDisplay(result.streak)).toBe('No streak');
    });
  });

  describe('Active Collector Dashboard', () => {
    it('should show complete stats for an active collector', () => {
      const collectionCards: CollectionCard[] = Array.from({ length: 50 }, (_, i) => ({
        cardId: `sv${Math.floor(i / 10) + 1}-${(i % 10) + 1}`,
        quantity: Math.floor(Math.random() * 3) + 1,
      }));

      const achievements: Achievement[] = [
        { achievementKey: 'first_catch', earnedAt: Date.now() - 30 * 24 * 60 * 60 * 1000 },
        { achievementKey: 'starter_collector', earnedAt: Date.now() - 20 * 24 * 60 * 60 * 1000 },
        { achievementKey: 'rising_trainer', earnedAt: Date.now() - 3 * 24 * 60 * 60 * 1000 },
        { achievementKey: 'streak_3', earnedAt: Date.now() - 2 * 24 * 60 * 60 * 1000 },
      ];

      // 5-day streak ending today
      const activityLogs = [
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 12, 10, 0, 0) },
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 13, 10, 0, 0) },
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 14, 10, 0, 0) },
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 15, 10, 0, 0) },
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 16, 10, 0, 0) },
      ];

      const recentActivityLogs: ActivityLogEntry[] = [
        { action: 'card_added', timestamp: Date.now() - 1 * 60 * 60 * 1000, metadata: { cardName: 'Charizard' } },
        { action: 'achievement_earned', timestamp: Date.now() - 2 * 60 * 60 * 1000, metadata: { achievementName: 'Streak 3' } },
      ];

      const result = calculateDashboardStats(
        collectionCards,
        achievements,
        activityLogs,
        recentActivityLogs
      );

      expect(result.collection.uniqueCards).toBe(50);
      expect(result.collection.setsStarted).toBe(5);
      expect(result.badges.total).toBe(4);
      expect(result.badges.recentlyEarned).toBe(2);
      expect(result.streak.currentStreak).toBe(5);
      expect(result.streak.isActiveToday).toBe(true);
      expect(getStreakStatusMessage(result.streak)).toBe('🔥 5 day streak! Keep it up!');
    });
  });

  describe('Streak at Risk Scenario', () => {
    it('should show warning for collector who needs to add a card today', () => {
      const collectionCards: CollectionCard[] = [
        { cardId: 'sv1-1', quantity: 1 },
      ];

      const achievements: Achievement[] = [
        { achievementKey: 'first_catch', earnedAt: Date.now() - 5 * 24 * 60 * 60 * 1000 },
      ];

      // 4-day streak ending yesterday
      const activityLogs = [
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 12, 10, 0, 0) },
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 13, 10, 0, 0) },
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 14, 10, 0, 0) },
        { action: 'card_added', timestamp: Date.UTC(2026, 0, 15, 10, 0, 0) },
        // No activity today (2026-01-16)
      ];

      const result = calculateDashboardStats(collectionCards, achievements, activityLogs, []);

      expect(result.streak.currentStreak).toBe(4);
      expect(result.streak.isActiveToday).toBe(false);
      expect(isStreakAtRisk(result.streak)).toBe(true);
      expect(getStreakStatusMessage(result.streak)).toBe('⚠️ 4 day streak at risk! Add a card today!');
    });
  });
});
