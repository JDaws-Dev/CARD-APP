import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MyCollectionPage from '../page';

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
  useQuery: () => mockCollectionData,
}));

// Track profile state
let mockProfileId: string | null = null;
let mockProfileLoading = false;

// Track collection data
let mockCollectionData: unknown[] | undefined = undefined;

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

// Mock CollectionView and other components
vi.mock('@/components/collection/CollectionView', () => ({
  CollectionView: () => <div data-testid="collection-view">Collection View</div>,
}));

vi.mock('@/components/collection/ExportChecklist', () => ({
  ExportChecklistButton: () => <button data-testid="export-button">Export</button>,
}));

vi.mock('@/components/collection/CollectionSnapshotShare', () => ({
  CollectionSnapshotShare: () => <button data-testid="share-button">Share</button>,
}));

vi.mock('@/components/virtual/VirtualTrophyRoom', () => ({
  default: () => <div data-testid="trophy-room">Trophy Room</div>,
}));

vi.mock('@/components/activity/ActivityFeed', () => ({
  ActivityFeed: () => <div data-testid="activity-feed">Activity Feed</div>,
  ActivityFeedSkeleton: () => <div data-testid="activity-feed-skeleton">Loading...</div>,
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
  CollectionGroupSkeleton: () => <div data-testid="collection-skeleton">Loading...</div>,
}));

vi.mock('@/components/virtual/VirtualTrophyRoom', () => ({
  default: () => <div data-testid="trophy-room">Trophy Room</div>,
  TrophyRoomSkeleton: () => <div data-testid="trophy-room-skeleton">Loading...</div>,
}));

describe('MyCollectionPage', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockIsAuthenticated = false;
    mockIsLoading = false;
    mockProfileId = null;
    mockProfileLoading = false;
    mockCollectionData = undefined;
    mockPush.mockClear();
    vi.clearAllMocks();
  });

  describe('Authentication Protection', () => {
    it('redirects unauthenticated users to /login', async () => {
      mockIsAuthenticated = false;
      mockIsLoading = false;

      render(<MyCollectionPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('shows loading spinner while auth is loading', () => {
      mockIsLoading = true;

      render(<MyCollectionPage />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('does not redirect while auth is loading', () => {
      mockIsLoading = true;

      render(<MyCollectionPage />);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('does not redirect when authenticated', async () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockProfileId = 'test-profile-id';
      mockProfileLoading = false;
      mockCollectionData = [];

      render(<MyCollectionPage />);

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

      render(<MyCollectionPage />);

      // Should show general loading spinner, not skeleton
      const loadingText = screen.getByText('Loading...');
      expect(loadingText).toBeInTheDocument();
    });

    it('shows profile loading skeleton only after auth is complete', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockProfileLoading = true;

      render(<MyCollectionPage />);

      // Should show skeleton loading states
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });
  });

  describe('Authenticated with Profile', () => {
    beforeEach(() => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockProfileLoading = false;
      mockProfileId = 'test-profile-id';
      mockCollectionData = [{ id: 'card-1', cardId: 'test-card' }];
    });

    it('renders back link to home', async () => {
      render(<MyCollectionPage />);

      await waitFor(() => {
        const backLink = screen.getByRole('link', { name: /Back to Home/i });
        expect(backLink).toBeInTheDocument();
        expect(backLink).toHaveAttribute('href', '/');
      });
    });

    it('has proper page structure with main element', async () => {
      render(<MyCollectionPage />);

      await waitFor(() => {
        expect(screen.getByRole('main')).toBeInTheDocument();
      });
    });

    it('renders page title', async () => {
      render(<MyCollectionPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /My Collection/i })).toBeInTheDocument();
      });
    });
  });

  describe('Empty Collection State', () => {
    beforeEach(() => {
      mockIsAuthenticated = true;
      mockIsLoading = false;
      mockProfileLoading = false;
      mockProfileId = 'test-profile-id';
      mockCollectionData = [];
    });

    it('shows empty state when collection is empty', async () => {
      render(<MyCollectionPage />);

      await waitFor(() => {
        expect(screen.getByText(/No cards yet!/i)).toBeInTheDocument();
      });
    });

    it('shows browse sets link in empty state', async () => {
      render(<MyCollectionPage />);

      await waitFor(() => {
        const browseLink = screen.getByRole('link', { name: /Browse Sets/i });
        expect(browseLink).toBeInTheDocument();
        expect(browseLink).toHaveAttribute('href', '/sets');
      });
    });
  });
});
