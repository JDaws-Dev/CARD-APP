import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ParentDashboardPage from '../page';

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

// Track parent access state
let mockParentAccess:
  | {
      hasAccess: boolean;
      reason?: string;
      message?: string;
      family?: { id: string };
    }
  | undefined = undefined;

// Mock convex/react
vi.mock('convex/react', () => ({
  useConvexAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsLoading,
  }),
  useQuery: (queryFn: unknown, args: unknown) => {
    // Skip query when not authenticated
    if (args === 'skip') return undefined;
    return mockParentAccess;
  },
}));

// Mock ParentDashboard components
vi.mock('@/components/dashboard/ParentDashboard', () => ({
  ParentDashboard: ({ familyId }: { familyId: string }) => (
    <div data-testid="parent-dashboard" data-family-id={familyId}>
      Parent Dashboard
    </div>
  ),
  ParentDashboardSkeleton: () => <div data-testid="parent-dashboard-skeleton">Loading...</div>,
}));

// Mock AddProfileModal
vi.mock('@/components/dashboard/AddProfileModal', () => ({
  AddProfileModal: ({
    isOpen,
    onClose,
    familyId,
  }: {
    isOpen: boolean;
    onClose: () => void;
    familyId: string;
  }) =>
    isOpen ? (
      <div data-testid="add-profile-modal" data-family-id={familyId}>
        Add Profile Modal
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

describe('ParentDashboardPage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockIsAuthenticated = false;
    mockIsLoading = false;
    mockParentAccess = undefined;
    mockPush.mockClear();
    vi.clearAllMocks();
  });

  describe('Authentication Protection', () => {
    it('redirects unauthenticated users to /login', async () => {
      mockIsAuthenticated = false;
      mockIsLoading = false;

      render(<ParentDashboardPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('shows loading spinner while auth is loading', () => {
      mockIsLoading = true;

      render(<ParentDashboardPage />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('does not redirect while auth is loading', () => {
      mockIsLoading = true;

      render(<ParentDashboardPage />);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not redirect when authenticated', async () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockParentAccess = {
        hasAccess: true,
        family: { id: 'test-family-id' },
      };

      render(<ParentDashboardPage />);

      // Wait a tick to ensure redirect effect has run
      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Parent Access Check', () => {
    beforeEach(() => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
    });

    it('shows skeleton while parent access is loading', () => {
      mockParentAccess = undefined;

      render(<ParentDashboardPage />);

      expect(screen.getByTestId('parent-dashboard-skeleton')).toBeInTheDocument();
    });

    it('shows access denied for non-parent users', () => {
      mockParentAccess = {
        hasAccess: false,
        reason: 'NOT_PARENT',
        message: 'This feature is only available to parent accounts.',
      };

      render(<ParentDashboardPage />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(
        screen.getByText('This feature is only available to parent accounts.')
      ).toBeInTheDocument();
    });

    it('shows create family CTA for NO_FAMILY reason', () => {
      mockParentAccess = {
        hasAccess: false,
        reason: 'NO_FAMILY',
        message: 'You need to create a family account first.',
      };

      render(<ParentDashboardPage />);

      const createFamilyLink = screen.getByRole('link', { name: /Create Family Account/i });
      expect(createFamilyLink).toBeInTheDocument();
      expect(createFamilyLink).toHaveAttribute('href', '/onboarding');
    });

    it('shows back to home link on access denied', () => {
      mockParentAccess = {
        hasAccess: false,
        reason: 'NOT_PARENT',
        message: 'Access denied.',
      };

      render(<ParentDashboardPage />);

      const backLink = screen.getByRole('link', { name: /Back to Home/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });
  });

  describe('Authenticated with Parent Access', () => {
    beforeEach(() => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockParentAccess = {
        hasAccess: true,
        family: { id: 'test-family-id' },
      };
    });

    it('renders ParentDashboard when authenticated with parent access', () => {
      render(<ParentDashboardPage />);

      expect(screen.getByTestId('parent-dashboard')).toBeInTheDocument();
    });

    it('passes family ID to ParentDashboard', () => {
      render(<ParentDashboardPage />);

      const dashboard = screen.getByTestId('parent-dashboard');
      expect(dashboard).toHaveAttribute('data-family-id', 'test-family-id');
    });

    it('renders page header with title', () => {
      render(<ParentDashboardPage />);

      // Use heading role to find the h1 specifically
      expect(screen.getByRole('heading', { name: /Parent Dashboard/i })).toBeInTheDocument();
    });

    it('renders page header with description', () => {
      render(<ParentDashboardPage />);

      expect(screen.getByText("Manage your family's trading card collections")).toBeInTheDocument();
    });

    it('renders back link to home', () => {
      render(<ParentDashboardPage />);

      const backLinks = screen.getAllByRole('link', { name: /Back to Home/i });
      expect(backLinks.length).toBeGreaterThan(0);
      expect(backLinks[0]).toHaveAttribute('href', '/');
    });

    it('renders Settings button', () => {
      render(<ParentDashboardPage />);

      const settingsLink = screen.getByRole('link', { name: /Settings/i });
      expect(settingsLink).toBeInTheDocument();
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('renders Add Profile button', () => {
      render(<ParentDashboardPage />);

      expect(screen.getByRole('button', { name: /Add Profile/i })).toBeInTheDocument();
    });

    it('has proper page structure with main element', () => {
      render(<ParentDashboardPage />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows auth loading before parent access check', () => {
      mockIsLoading = true;
      mockParentAccess = undefined;

      render(<ParentDashboardPage />);

      // Should show general loading spinner, not dashboard skeleton
      const loadingText = screen.getByText('Loading...');
      expect(loadingText).toBeInTheDocument();
      // The loading spinner should be the centered one, not the skeleton
      expect(screen.queryByTestId('parent-dashboard-skeleton')).not.toBeInTheDocument();
    });

    it('shows parent access loading skeleton only after auth is complete', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockParentAccess = undefined;

      render(<ParentDashboardPage />);

      expect(screen.getByTestId('parent-dashboard-skeleton')).toBeInTheDocument();
    });
  });
});
