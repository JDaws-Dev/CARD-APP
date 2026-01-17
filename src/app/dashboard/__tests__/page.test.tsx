import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '../page';

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

// Mock KidDashboard components
vi.mock('@/components/dashboard/KidDashboard', () => ({
  KidDashboard: () => <div data-testid="kid-dashboard">Kid Dashboard</div>,
  KidDashboardSkeleton: () => <div data-testid="kid-dashboard-skeleton">Loading...</div>,
}));

describe('DashboardPage', () => {
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

      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('shows loading spinner while auth is loading', () => {
      mockIsLoading = true;

      render(<DashboardPage />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('does not redirect while auth is loading', () => {
      mockIsLoading = true;

      render(<DashboardPage />);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not redirect when authenticated', async () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockProfileId = 'test-profile-id';

      render(<DashboardPage />);

      // Wait a tick to ensure redirect effect has run
      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Profile Loading', () => {
    it('shows skeleton while profile is loading', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockProfileLoading = true;

      render(<DashboardPage />);

      expect(screen.getByTestId('kid-dashboard-skeleton')).toBeInTheDocument();
    });

    it('redirects to onboarding when no profile exists', async () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockProfileLoading = false;
      mockProfileId = null;

      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding');
      });
    });
  });

  describe('Authenticated with Profile', () => {
    beforeEach(() => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockProfileLoading = false;
      mockProfileId = 'test-profile-id';
    });

    it('renders KidDashboard when authenticated with profile', () => {
      render(<DashboardPage />);

      expect(screen.getByTestId('kid-dashboard')).toBeInTheDocument();
    });

    it('renders back link to home', () => {
      render(<DashboardPage />);

      const backLink = screen.getByRole('link', { name: /Back to Home/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });

    it('has proper page structure with main element', () => {
      render(<DashboardPage />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows auth loading before profile loading', () => {
      mockIsLoading = true;
      mockProfileLoading = true;

      render(<DashboardPage />);

      // Should show general loading, not dashboard skeleton
      const loadingText = screen.getByText('Loading...');
      expect(loadingText).toBeInTheDocument();
      expect(screen.queryByTestId('kid-dashboard-skeleton')).not.toBeInTheDocument();
    });

    it('shows profile loading skeleton only after auth is complete', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockProfileLoading = true;

      render(<DashboardPage />);

      expect(screen.getByTestId('kid-dashboard-skeleton')).toBeInTheDocument();
    });
  });
});
