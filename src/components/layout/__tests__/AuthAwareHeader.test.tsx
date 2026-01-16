import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthAwareHeader } from '../AuthAwareHeader';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/collection',
}));

// Track auth state for tests
let mockIsAuthenticated = false;
let mockIsLoading = false;

// Mock convex/react
vi.mock('convex/react', () => ({
  useConvexAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsLoading,
  }),
}));

// Mock @convex-dev/auth/react
vi.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({
    signOut: vi.fn(),
  }),
}));

// Mock gamification components (used by AppHeader)
vi.mock('@/components/gamification/StreakCounter', () => ({
  StreakCounter: () => <div data-testid="streak-counter">Streak Counter</div>,
}));

vi.mock('@/components/gamification/LevelSystem', () => ({
  LevelDisplay: () => <div data-testid="level-display">Level Display</div>,
}));

// Mock KidModeToggle
vi.mock('@/components/layout/KidModeToggle', () => ({
  KidModeToggle: () => <div data-testid="kid-mode-toggle">Kid Mode Toggle</div>,
}));

describe('AuthAwareHeader', () => {
  beforeEach(() => {
    // Reset auth state before each test
    mockIsAuthenticated = false;
    mockIsLoading = false;
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders skeleton while auth is loading', () => {
      mockIsLoading = true;

      render(<AuthAwareHeader />);

      // Should show loading navigation label
      expect(screen.getByRole('navigation', { name: /Loading navigation/i })).toBeInTheDocument();
    });

    it('skeleton has banner role', () => {
      mockIsLoading = true;

      render(<AuthAwareHeader />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('skeleton has sticky positioning', () => {
      mockIsLoading = true;

      render(<AuthAwareHeader />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky', 'top-0', 'z-50');
    });

    it('skeleton shows animated placeholder elements', () => {
      mockIsLoading = true;

      render(<AuthAwareHeader />);

      // Check for animate-pulse class on skeleton elements
      const pulsingElements = document.querySelectorAll('.animate-pulse');
      expect(pulsingElements.length).toBeGreaterThan(0);
    });

    it('skeleton does not render MarketingHeader or AppHeader', () => {
      mockIsLoading = true;

      render(<AuthAwareHeader />);

      // Neither marketing links nor app navigation should be present
      expect(screen.queryByText('Features')).not.toBeInTheDocument();
      expect(screen.queryByText('My Collection')).not.toBeInTheDocument();
      expect(screen.queryByText('Log In')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated State', () => {
    it('renders MarketingHeader when not authenticated', () => {
      mockIsAuthenticated = false;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      // MarketingHeader has "Marketing navigation" aria-label
      expect(screen.getByRole('navigation', { name: /Marketing navigation/i })).toBeInTheDocument();
    });

    it('shows Features link when not authenticated', () => {
      mockIsAuthenticated = false;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.getByRole('menuitem', { name: 'Features' })).toBeInTheDocument();
    });

    it('shows Pricing link when not authenticated', () => {
      mockIsAuthenticated = false;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.getByRole('menuitem', { name: 'Pricing' })).toBeInTheDocument();
    });

    it('shows Log In button when not authenticated', () => {
      mockIsAuthenticated = false;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.getByRole('link', { name: /Log In/i })).toBeInTheDocument();
    });

    it('shows Sign Up button when not authenticated', () => {
      mockIsAuthenticated = false;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.getByRole('link', { name: /Sign Up/i })).toBeInTheDocument();
    });

    it('does NOT show app navigation when not authenticated', () => {
      mockIsAuthenticated = false;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.queryByText('My Collection')).not.toBeInTheDocument();
      expect(screen.queryByText('Browse Sets')).not.toBeInTheDocument();
      expect(screen.queryByText('Badges')).not.toBeInTheDocument();
      expect(screen.queryByText('Wishlist')).not.toBeInTheDocument();
    });

    it('does NOT show Sign Out when not authenticated', () => {
      mockIsAuthenticated = false;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });

    it('does NOT show gamification elements when not authenticated', () => {
      mockIsAuthenticated = false;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.queryByTestId('streak-counter')).not.toBeInTheDocument();
      expect(screen.queryByTestId('level-display')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    it('renders AppHeader when authenticated', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      // AppHeader has "App navigation" aria-label
      expect(screen.getByRole('navigation', { name: /App navigation/i })).toBeInTheDocument();
    });

    it('shows My Collection link when authenticated', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.getByRole('menuitem', { name: /My Collection/i })).toBeInTheDocument();
    });

    it('shows Browse Sets link when authenticated', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.getByRole('menuitem', { name: /Browse Sets/i })).toBeInTheDocument();
    });

    it('shows Badges link when authenticated', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.getByRole('menuitem', { name: /Badges/i })).toBeInTheDocument();
    });

    it('shows Wishlist link when authenticated', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.getByRole('menuitem', { name: /Wishlist/i })).toBeInTheDocument();
    });

    it('shows Search link when authenticated', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.getByRole('menuitem', { name: /Search/i })).toBeInTheDocument();
    });

    it('shows gamification elements when authenticated', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.getByTestId('level-display')).toBeInTheDocument();
      expect(screen.getByTestId('streak-counter')).toBeInTheDocument();
      expect(screen.getByTestId('kid-mode-toggle')).toBeInTheDocument();
    });

    it('does NOT show Features link when authenticated', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.queryByText('Features')).not.toBeInTheDocument();
    });

    it('does NOT show Pricing link when authenticated', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.queryByText('Pricing')).not.toBeInTheDocument();
    });

    it('does NOT show Log In button when authenticated', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.queryByText('Log In')).not.toBeInTheDocument();
    });

    it('does NOT show Sign Up button when authenticated', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
    });

    it('shows profile menu button when authenticated', () => {
      mockIsAuthenticated = true;
      mockIsLoading = false;

      render(<AuthAwareHeader />);

      expect(screen.getByRole('button', { name: /Profile menu/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('always renders header with banner role', () => {
      mockIsLoading = false;
      mockIsAuthenticated = false;

      render(<AuthAwareHeader />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('skeleton is accessible during loading', () => {
      mockIsLoading = true;

      render(<AuthAwareHeader />);

      // Has navigation element with aria-label
      expect(screen.getByRole('navigation', { name: /Loading navigation/i })).toBeInTheDocument();
    });
  });

  describe('Visual Consistency', () => {
    it('skeleton matches header dimensions to prevent layout shift', () => {
      mockIsLoading = true;

      render(<AuthAwareHeader />);

      const header = screen.getByRole('banner');
      // Should have same visual properties as real headers
      expect(header).toHaveClass('sticky', 'top-0', 'z-50', 'border-b', 'backdrop-blur-sm');
    });
  });
});
