import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import StreakPage from '../page';

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

// Track auth state for tests
let mockIsAuthenticated = false;
let mockIsLoading = false;

// Track router push calls
const mockPush = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock convex/react
vi.mock('convex/react', () => ({
  useConvexAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsLoading,
  }),
}));

// Track profile state
let mockProfileId: string | null = null;
let mockProfileLoading = false;

// Mock useCurrentProfile hook
vi.mock('@/hooks/useCurrentProfile', () => ({
  useCurrentProfile: () => ({
    profileId: mockProfileId,
    isLoading: mockProfileLoading,
    profile: mockProfileId ? { id: mockProfileId, name: 'Test User' } : null,
    family: null,
    availableProfiles: [],
    user: null,
    isAuthenticated: mockIsAuthenticated,
    clearProfile: vi.fn(),
  }),
}));

// Mock gamification components
vi.mock('@/components/gamification/StreakCalendar', () => ({
  StreakCalendar: () => <div data-testid="streak-calendar">Streak Calendar</div>,
  StreakCalendarSkeleton: () => <div data-testid="streak-calendar-skeleton">Loading...</div>,
}));

vi.mock('@/components/gamification/StreakCounter', () => ({
  StreakCounter: () => <div data-testid="streak-counter">Streak Counter</div>,
}));

vi.mock('@/components/gamification/StreakMilestoneRewards', () => ({
  StreakMilestoneRewards: () => (
    <div data-testid="streak-milestone-rewards">Streak Milestone Rewards</div>
  ),
  StreakMilestoneRewardsSkeleton: () => (
    <div data-testid="streak-milestone-skeleton">Loading...</div>
  ),
}));

vi.mock('@/components/gamification/GraceDayStatus', () => ({
  GraceDayStatus: () => <div data-testid="grace-day-status">Grace Day Status</div>,
  GraceDayStatusSkeleton: () => <div data-testid="grace-day-skeleton">Loading...</div>,
  WeekendPauseStatus: () => <div data-testid="weekend-pause-status">Weekend Pause Status</div>,
  WeekendPauseStatusSkeleton: () => <div data-testid="weekend-pause-skeleton">Loading...</div>,
}));

vi.mock('@/components/gamification/StreakRepair', () => ({
  StreakRepairStatus: () => <div data-testid="streak-repair-status">Streak Repair Status</div>,
  StreakRepairSkeleton: () => <div data-testid="streak-repair-skeleton">Loading...</div>,
}));

vi.mock('@/components/gamification/DailyStampCollection', () => ({
  DailyStampCollection: () => (
    <div data-testid="daily-stamp-collection">Daily Stamp Collection</div>
  ),
  DailyStampCollectionSkeleton: () => <div data-testid="daily-stamp-skeleton">Loading...</div>,
}));

vi.mock('@/components/gamification/WeeklyChallenges', () => ({
  WeeklyChallenges: () => <div data-testid="weekly-challenges">Weekly Challenges</div>,
  WeeklyChallengesSkeleton: () => <div data-testid="weekly-challenges-skeleton">Loading...</div>,
}));

vi.mock('@/components/gamification/ComebackRewards', () => ({
  ComebackStatus: () => <div data-testid="comeback-status">Comeback Status</div>,
  ComebackStatusSkeleton: () => <div data-testid="comeback-skeleton">Loading...</div>,
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

describe('StreakPage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockIsAuthenticated = false;
    mockIsLoading = false;
    mockProfileId = null;
    mockProfileLoading = false;
    mockPush.mockClear();
    vi.clearAllMocks();
  });

  describe('Authentication Protection', () => {
    it('redirects unauthenticated users to /login', async () => {
      mockIsAuthenticated = false;
      mockIsLoading = false;

      render(<StreakPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('shows loading spinner while auth is loading', () => {
      mockIsLoading = true;

      render(<StreakPage />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('does not redirect while auth is loading', () => {
      mockIsLoading = true;

      render(<StreakPage />);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not redirect when authenticated', async () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockProfileId = 'test-profile-id';
      mockProfileLoading = false;

      render(<StreakPage />);

      // Wait a tick to ensure redirect effect has run
      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Loading States', () => {
    it('shows auth loading before profile loading', () => {
      mockIsLoading = true;
      mockProfileLoading = true;

      render(<StreakPage />);

      // Should show general loading spinner
      const loadingText = screen.getByText('Loading...');
      expect(loadingText).toBeInTheDocument();
    });

    it('shows profile loading skeleton only after auth is complete', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockProfileLoading = true;

      render(<StreakPage />);

      // Should show skeleton loading states for streak calendar
      expect(screen.getByTestId('streak-calendar-skeleton')).toBeInTheDocument();
    });
  });

  describe('Authenticated with Profile', () => {
    beforeEach(() => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockProfileLoading = false;
      mockProfileId = 'test-profile-id';
    });

    it('renders back link to dashboard', async () => {
      render(<StreakPage />);

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /Back to Dashboard/i });
        expect(backLink).toBeInTheDocument();
        expect(backLink).toHaveAttribute('href', '/dashboard');
      });
    });

    it('has proper page structure with main element', async () => {
      render(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('renders page title', async () => {
      render(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Activity Calendar/i })).toBeInTheDocument();
      });
    });

    it('renders streak calendar component', async () => {
      render(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByTestId('streak-calendar')).toBeInTheDocument();
      });
    });

    it('renders add cards link', async () => {
      render(<StreakPage />);

      await waitFor(() => {
        const addCardsLink = screen.getByRole('link', { name: /Add Cards Today/i });
        expect(addCardsLink).toBeInTheDocument();
        expect(addCardsLink).toHaveAttribute('href', '/sets');
      });
    });
  });

  describe('No Profile State', () => {
    beforeEach(() => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockProfileLoading = false;
      mockProfileId = null;
    });

    it('shows profile not found message when authenticated but no profile', async () => {
      render(<StreakPage />);

      await waitFor(() => {
        expect(screen.getByText(/Profile Not Found/i)).toBeInTheDocument();
      });
    });

    it('shows link to dashboard to complete profile setup', async () => {
      render(<StreakPage />);

      await waitFor(() => {
        const dashboardLink = screen.getByRole('link', { name: /Go to Dashboard/i });
        expect(dashboardLink).toBeInTheDocument();
        expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      });
    });
  });
});
