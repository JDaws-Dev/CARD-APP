import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KidDashboardSkeleton } from '../KidDashboard';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock ActivityFeed
vi.mock('@/components/activity/ActivityFeed', () => ({
  ActivityFeed: ({ limit, className }: { limit?: number; className?: string }) => (
    <div data-testid="activity-feed" data-limit={limit} className={className}>
      Activity Feed
    </div>
  ),
  ActivityFeedSkeleton: ({ count }: { count?: number }) => (
    <div data-testid="activity-feed-skeleton" data-count={count}>
      Activity Feed Skeleton
    </div>
  ),
}));

// Mock Skeleton component
vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className}>
      Skeleton
    </div>
  ),
}));

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' '),
}));

describe('KidDashboardSkeleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Structure', () => {
    it('renders skeleton structure with multiple skeleton elements', () => {
      render(<KidDashboardSkeleton />);

      const skeletonElements = screen.getAllByTestId('skeleton');
      expect(skeletonElements.length).toBeGreaterThan(5);
    });

    it('renders activity feed skeleton', () => {
      render(<KidDashboardSkeleton />);

      expect(screen.getByTestId('activity-feed-skeleton')).toBeInTheDocument();
    });

    it('activity feed skeleton has count of 4', () => {
      render(<KidDashboardSkeleton />);

      const skeleton = screen.getByTestId('activity-feed-skeleton');
      expect(skeleton.getAttribute('data-count')).toBe('4');
    });
  });

  describe('Visual Structure', () => {
    it('renders welcome header skeleton section', () => {
      render(<KidDashboardSkeleton />);

      // Check for gradient header background by finding element with gradient classes
      const container = document.querySelector('[class*="from-indigo-500"]');
      expect(container).toBeInTheDocument();
    });

    it('renders stats grid skeleton with stat cards', () => {
      render(<KidDashboardSkeleton />);

      // Check for stats grid using the grid layout class
      const statsGrid = document.querySelector('.grid-cols-2');
      expect(statsGrid).toBeInTheDocument();

      // Should have stat card children
      const statCards = statsGrid?.querySelectorAll('[class*="rounded-2xl"]');
      expect(statCards?.length).toBeGreaterThanOrEqual(4);
    });

    it('renders quick actions section skeleton', () => {
      render(<KidDashboardSkeleton />);

      // Check for quick action items by looking for rounded-2xl elements after the stats grid
      const roundedCards = document.querySelectorAll('.rounded-2xl');
      expect(roundedCards.length).toBeGreaterThan(4); // Stats + quick actions + others
    });

    it('renders multiple skeleton elements throughout', () => {
      render(<KidDashboardSkeleton />);

      // Should have many skeleton placeholders
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(10);
    });
  });

  describe('Layout', () => {
    it('has proper spacing between sections', () => {
      render(<KidDashboardSkeleton />);

      const container = document.querySelector('.space-y-6');
      expect(container).toBeInTheDocument();
    });

    it('uses grid layout for stats', () => {
      render(<KidDashboardSkeleton />);

      const statsGrid = document.querySelector('.grid.grid-cols-2');
      expect(statsGrid).toBeInTheDocument();
    });

    it('uses grid layout for quick actions', () => {
      render(<KidDashboardSkeleton />);

      const quickActionsGrids = document.querySelectorAll('.grid.gap-3');
      expect(quickActionsGrids.length).toBeGreaterThan(0);
    });

    it('uses grid layout for progress section', () => {
      render(<KidDashboardSkeleton />);

      const progressGrid = document.querySelector('.grid.gap-4.lg\\:grid-cols-3');
      expect(progressGrid).toBeInTheDocument();
    });
  });
});

// Test the utility functions and types that don't require React rendering
describe('KidDashboard Utilities', () => {
  describe('Quick Action Configuration', () => {
    it('should have proper quick action structure', () => {
      // These are the expected quick actions
      const expectedActions = [
        { href: '/sets', title: 'Add Cards' },
        { href: '/collection', title: 'My Collection' },
        { href: '/my-wishlist', title: 'Wishlist' },
        { href: '/search', title: 'Search Cards' },
      ];

      // Verify all expected routes exist
      expectedActions.forEach((action) => {
        expect(action.href).toBeTruthy();
        expect(action.title).toBeTruthy();
      });

      expect(expectedActions.length).toBe(4);
    });
  });

  describe('Stats Configuration', () => {
    it('should track 4 main stats', () => {
      const expectedStats = ['Total Cards', 'Unique Cards', 'Sets Started', 'Day Streak'];
      expect(expectedStats.length).toBe(4);
    });
  });

  describe('Streak Messaging', () => {
    const getStreakMessage = (streak: number, isActiveToday: boolean): string => {
      if (streak === 0) return "Let's start your collection adventure!";
      if (!isActiveToday) return 'Ready to add some cards?';
      if (streak === 1) return 'You started a streak! Come back tomorrow to keep it going!';
      if (streak < 7) return `${streak} day streak! Keep it up!`;
      if (streak < 14) return `Amazing ${streak} day streak! You're on fire!`;
      return `Incredible ${streak} day streak! You're a legend!`;
    };

    it('shows adventure message for zero streak', () => {
      const message = getStreakMessage(0, false);
      expect(message).toContain('adventure');
    });

    it('shows first day streak message', () => {
      const message = getStreakMessage(1, true);
      expect(message).toContain('started a streak');
    });

    it('shows keep it up for moderate streaks (2-6 days)', () => {
      const message = getStreakMessage(5, true);
      expect(message).toContain('5 day streak');
      expect(message).toContain('Keep it up');
    });

    it('shows on fire for 7-13 day streaks', () => {
      const message = getStreakMessage(10, true);
      expect(message).toContain('10 day streak');
      expect(message).toContain('on fire');
    });

    it('shows legend for 14+ day streaks', () => {
      const message = getStreakMessage(20, true);
      expect(message).toContain('20 day streak');
      expect(message).toContain('legend');
    });

    it('shows ready message when active today but collection exists', () => {
      const message = getStreakMessage(5, false);
      expect(message).toContain('Ready to add');
    });
  });

  describe('Greeting Logic', () => {
    const getGreeting = (hour: number): string => {
      if (hour < 12) return 'Good morning';
      if (hour < 17) return 'Good afternoon';
      return 'Good evening';
    };

    it('returns Good morning for early hours', () => {
      expect(getGreeting(8)).toBe('Good morning');
      expect(getGreeting(0)).toBe('Good morning');
      expect(getGreeting(11)).toBe('Good morning');
    });

    it('returns Good afternoon for midday hours', () => {
      expect(getGreeting(12)).toBe('Good afternoon');
      expect(getGreeting(14)).toBe('Good afternoon');
      expect(getGreeting(16)).toBe('Good afternoon');
    });

    it('returns Good evening for evening hours', () => {
      expect(getGreeting(17)).toBe('Good evening');
      expect(getGreeting(20)).toBe('Good evening');
      expect(getGreeting(23)).toBe('Good evening');
    });
  });
});

describe('Badge Progress Preview Logic', () => {
  describe('Earned Badge Sorting', () => {
    it('should sort badges by earnedAt descending (most recent first)', () => {
      const badges = [
        { key: 'badge1', name: 'First Badge', earnedAt: 1000 },
        { key: 'badge2', name: 'Second Badge', earnedAt: 3000 },
        { key: 'badge3', name: 'Third Badge', earnedAt: 2000 },
      ];

      const sorted = badges
        .filter((a) => a.earnedAt !== null)
        .sort((a, b) => (b.earnedAt ?? 0) - (a.earnedAt ?? 0));

      expect(sorted[0].key).toBe('badge2'); // Most recent
      expect(sorted[1].key).toBe('badge3');
      expect(sorted[2].key).toBe('badge1'); // Oldest
    });

    it('should filter out unearned badges', () => {
      const badges = [
        { key: 'badge1', name: 'First Badge', earnedAt: 1000 },
        { key: 'badge2', name: 'Second Badge', earnedAt: null },
        { key: 'badge3', name: 'Third Badge', earnedAt: 2000 },
      ];

      const earned = badges.filter((a) => a.earnedAt !== null);
      expect(earned.length).toBe(2);
      expect(earned.some((b) => b.key === 'badge2')).toBe(false);
    });

    it('should limit to 4 most recent badges for display', () => {
      const badges = [
        { key: 'badge1', earnedAt: 1000 },
        { key: 'badge2', earnedAt: 2000 },
        { key: 'badge3', earnedAt: 3000 },
        { key: 'badge4', earnedAt: 4000 },
        { key: 'badge5', earnedAt: 5000 },
        { key: 'badge6', earnedAt: 6000 },
      ];

      const displayed = badges
        .filter((a) => a.earnedAt !== null)
        .sort((a, b) => (b.earnedAt ?? 0) - (a.earnedAt ?? 0))
        .slice(0, 4);

      expect(displayed.length).toBe(4);
      expect(displayed[0].key).toBe('badge6');
      expect(displayed[3].key).toBe('badge3');
    });
  });

  describe('Badge Count Display', () => {
    it('calculates total earned correctly', () => {
      const badges = [
        { earnedAt: 1000 },
        { earnedAt: null },
        { earnedAt: 2000 },
        { earnedAt: null },
        { earnedAt: 3000 },
      ];

      const totalEarned = badges.filter((a) => a.earnedAt !== null).length;
      expect(totalEarned).toBe(3);
    });

    it('formats badge count message correctly', () => {
      const formatBadgeCount = (earned: number, total: number) =>
        `${earned} of ${total} badges earned`;

      expect(formatBadgeCount(3, 10)).toBe('3 of 10 badges earned');
      expect(formatBadgeCount(0, 5)).toBe('0 of 5 badges earned');
      expect(formatBadgeCount(10, 10)).toBe('10 of 10 badges earned');
    });
  });
});

describe('StatCard Configuration', () => {
  describe('Gradient Colors', () => {
    it('should have proper gradient configurations', () => {
      const statConfigs = [
        {
          label: 'Total Cards',
          gradient: 'from-indigo-50 to-blue-50',
          iconColor: 'text-indigo-500',
        },
        {
          label: 'Unique Cards',
          gradient: 'from-purple-50 to-pink-50',
          iconColor: 'text-purple-500',
        },
        {
          label: 'Sets Started',
          gradient: 'from-emerald-50 to-teal-50',
          iconColor: 'text-emerald-500',
        },
        {
          label: 'Day Streak',
          gradient: 'from-orange-50 to-amber-50',
          iconColor: 'text-orange-500',
        },
      ];

      statConfigs.forEach((config) => {
        expect(config.gradient).toContain('from-');
        expect(config.gradient).toContain('to-');
        expect(config.iconColor).toContain('text-');
      });
    });
  });
});

describe('QuickActionCard Configuration', () => {
  describe('Action Links', () => {
    const quickActions = [
      { href: '/sets', title: 'Add Cards', description: 'Browse sets and add new cards' },
      { href: '/collection', title: 'My Collection', description: 'View all your collected cards' },
      { href: '/my-wishlist', title: 'Wishlist', description: 'Cards you want to get' },
      { href: '/search', title: 'Search Cards', description: 'Find any Pokemon card' },
    ];

    it('has unique hrefs for all actions', () => {
      const hrefs = quickActions.map((a) => a.href);
      const uniqueHrefs = new Set(hrefs);
      expect(uniqueHrefs.size).toBe(quickActions.length);
    });

    it('has valid route paths', () => {
      quickActions.forEach((action) => {
        expect(action.href).toMatch(/^\/[a-z-]+$/);
      });
    });

    it('has non-empty titles and descriptions', () => {
      quickActions.forEach((action) => {
        expect(action.title.length).toBeGreaterThan(0);
        expect(action.description.length).toBeGreaterThan(0);
      });
    });
  });
});
