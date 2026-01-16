import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppHeader } from '../AppHeader';

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

// Mock @convex-dev/auth/react
const mockSignOut = vi.fn();
vi.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({
    signOut: mockSignOut,
  }),
}));

// Mock Convex useQuery - default returns null (child/no profile)
let mockCurrentUserProfile: {
  profile: { id: string; displayName: string; profileType: 'parent' | 'child' };
  family: { id: string; subscriptionTier: 'free' | 'family' };
  availableProfiles: { id: string; displayName: string; profileType: 'parent' | 'child' }[];
  user: { id: string; email: string; emailVerified: boolean };
} | null = null;

vi.mock('convex/react', () => ({
  useQuery: () => mockCurrentUserProfile,
}));

// Mock Convex API
vi.mock('../../../../convex/_generated/api', () => ({
  api: {
    profiles: {
      getCurrentUserProfile: 'getCurrentUserProfile',
    },
  },
}));

// Mock gamification components
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

// Helper to create mock profile data
function createMockParentProfile() {
  return {
    profile: {
      id: 'profile-1',
      displayName: 'Parent User',
      profileType: 'parent' as const,
    },
    family: {
      id: 'family-1',
      subscriptionTier: 'family' as const,
    },
    availableProfiles: [
      { id: 'profile-1', displayName: 'Parent User', profileType: 'parent' as const },
      { id: 'profile-2', displayName: 'Child User', profileType: 'child' as const },
    ],
    user: {
      id: 'user-1',
      email: 'parent@example.com',
      emailVerified: true,
    },
  };
}

function createMockChildProfile() {
  return {
    profile: {
      id: 'profile-2',
      displayName: 'Child User',
      profileType: 'child' as const,
    },
    family: {
      id: 'family-1',
      subscriptionTier: 'family' as const,
    },
    availableProfiles: [
      { id: 'profile-1', displayName: 'Parent User', profileType: 'parent' as const },
      { id: 'profile-2', displayName: 'Child User', profileType: 'child' as const },
    ],
    user: {
      id: 'user-1',
      email: 'parent@example.com',
      emailVerified: true,
    },
  };
}

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to null (no profile / child default behavior)
    mockCurrentUserProfile = null;
  });

  describe('Logo and Branding', () => {
    it('renders the CardDex logo', () => {
      render(<AppHeader />);

      expect(screen.getByText('CardDex')).toBeInTheDocument();
    });

    it('logo links to home page', () => {
      render(<AppHeader />);

      const homeLink = screen.getByLabelText('CardDex - Go to home page');
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('has proper accessibility label on logo', () => {
      render(<AppHeader />);

      expect(screen.getByLabelText('CardDex - Go to home page')).toBeInTheDocument();
    });
  });

  describe('App Navigation Links', () => {
    it('renders My Collection link', () => {
      render(<AppHeader />);

      expect(screen.getByRole('menuitem', { name: /My Collection/i })).toBeInTheDocument();
    });

    it('renders Browse Sets link', () => {
      render(<AppHeader />);

      expect(screen.getByRole('menuitem', { name: /Browse Sets/i })).toBeInTheDocument();
    });

    it('renders Badges link', () => {
      render(<AppHeader />);

      expect(screen.getByRole('menuitem', { name: /Badges/i })).toBeInTheDocument();
    });

    it('renders Wishlist link', () => {
      render(<AppHeader />);

      expect(screen.getByRole('menuitem', { name: /Wishlist/i })).toBeInTheDocument();
    });

    it('renders Search link', () => {
      render(<AppHeader />);

      expect(screen.getByRole('menuitem', { name: /Search/i })).toBeInTheDocument();
    });

    it('My Collection link has correct href', () => {
      render(<AppHeader />);

      const collectionLink = screen.getByRole('menuitem', { name: /My Collection/i });
      expect(collectionLink).toHaveAttribute('href', '/collection');
    });

    it('Browse Sets link has correct href', () => {
      render(<AppHeader />);

      const setsLink = screen.getByRole('menuitem', { name: /Browse Sets/i });
      expect(setsLink).toHaveAttribute('href', '/sets');
    });

    it('Badges link has correct href', () => {
      render(<AppHeader />);

      const badgesLink = screen.getByRole('menuitem', { name: /Badges/i });
      expect(badgesLink).toHaveAttribute('href', '/badges');
    });

    it('Wishlist link has correct href', () => {
      render(<AppHeader />);

      const wishlistLink = screen.getByRole('menuitem', { name: /Wishlist/i });
      expect(wishlistLink).toHaveAttribute('href', '/my-wishlist');
    });

    it('Search link has correct href', () => {
      render(<AppHeader />);

      const searchLink = screen.getByRole('menuitem', { name: /Search/i });
      expect(searchLink).toHaveAttribute('href', '/search');
    });

    it('does NOT render marketing links like Features or Pricing', () => {
      render(<AppHeader />);

      expect(screen.queryByText('Features')).not.toBeInTheDocument();
      expect(screen.queryByText('Pricing')).not.toBeInTheDocument();
    });

    it('does NOT render Login/Signup links', () => {
      render(<AppHeader />);

      expect(screen.queryByText('Log In')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
    });

    it('highlights current page link', () => {
      render(<AppHeader />);

      // /collection is the mocked current path
      const collectionLink = screen.getByRole('menuitem', { name: /My Collection/i });
      expect(collectionLink).toHaveAttribute('aria-current', 'page');
      expect(collectionLink).toHaveClass('bg-kid-primary/10', 'text-kid-primary');
    });
  });

  describe('Gamification Elements', () => {
    it('renders LevelDisplay component', () => {
      render(<AppHeader />);

      expect(screen.getByTestId('level-display')).toBeInTheDocument();
    });

    it('renders StreakCounter component', () => {
      render(<AppHeader />);

      expect(screen.getByTestId('streak-counter')).toBeInTheDocument();
    });

    it('renders KidModeToggle component', () => {
      render(<AppHeader />);

      expect(screen.getByTestId('kid-mode-toggle')).toBeInTheDocument();
    });
  });

  describe('Profile Menu', () => {
    it('renders profile menu button', () => {
      render(<AppHeader />);

      expect(screen.getByRole('button', { name: /Profile menu/i })).toBeInTheDocument();
    });

    it('profile menu is initially closed', () => {
      render(<AppHeader />);

      expect(screen.queryByRole('menu', { name: /Profile options/i })).not.toBeInTheDocument();
    });

    it('opens profile menu when button is clicked', () => {
      render(<AppHeader />);

      const profileButton = screen.getByRole('button', { name: /Profile menu/i });
      fireEvent.click(profileButton);

      expect(screen.getByRole('menu', { name: /Profile options/i })).toBeInTheDocument();
    });

    it('profile menu contains My Profile link', () => {
      render(<AppHeader />);

      const profileButton = screen.getByRole('button', { name: /Profile menu/i });
      fireEvent.click(profileButton);

      expect(screen.getByRole('menuitem', { name: /My Profile/i })).toBeInTheDocument();
    });

    it('profile menu contains Learn to Collect link', () => {
      render(<AppHeader />);

      const profileButton = screen.getByRole('button', { name: /Profile menu/i });
      fireEvent.click(profileButton);

      expect(screen.getByRole('menuitem', { name: /Learn to Collect/i })).toBeInTheDocument();
    });

    it('profile menu contains Sign Out button', () => {
      render(<AppHeader />);

      const profileButton = screen.getByRole('button', { name: /Profile menu/i });
      fireEvent.click(profileButton);

      expect(screen.getByRole('menuitem', { name: /Sign Out/i })).toBeInTheDocument();
    });

    it('calls signOut when Sign Out is clicked', () => {
      render(<AppHeader />);

      const profileButton = screen.getByRole('button', { name: /Profile menu/i });
      fireEvent.click(profileButton);

      const signOutButton = screen.getByRole('menuitem', { name: /Sign Out/i });
      fireEvent.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('closes profile menu when Sign Out is clicked', () => {
      render(<AppHeader />);

      const profileButton = screen.getByRole('button', { name: /Profile menu/i });
      fireEvent.click(profileButton);

      const signOutButton = screen.getByRole('menuitem', { name: /Sign Out/i });
      fireEvent.click(signOutButton);

      expect(screen.queryByRole('menu', { name: /Profile options/i })).not.toBeInTheDocument();
    });

    it('profile button has aria-expanded attribute', () => {
      render(<AppHeader />);

      const profileButton = screen.getByRole('button', { name: /Profile menu/i });
      expect(profileButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(profileButton);
      expect(profileButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('profile button has aria-haspopup attribute', () => {
      render(<AppHeader />);

      const profileButton = screen.getByRole('button', { name: /Profile menu/i });
      expect(profileButton).toHaveAttribute('aria-haspopup', 'true');
    });
  });

  describe('Mobile Menu', () => {
    it('renders mobile menu button', () => {
      render(<AppHeader />);

      expect(screen.getByRole('button', { name: /Open navigation menu/i })).toBeInTheDocument();
    });

    it('mobile menu is initially closed', () => {
      render(<AppHeader />);

      expect(
        screen.queryByRole('menu', { name: /Mobile app navigation/i })
      ).not.toBeInTheDocument();
    });

    it('opens mobile menu when hamburger button is clicked', () => {
      render(<AppHeader />);

      const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
      fireEvent.click(menuButton);

      expect(screen.getByRole('menu', { name: /Mobile app navigation/i })).toBeInTheDocument();
    });

    it('closes mobile menu when close button is clicked', () => {
      render(<AppHeader />);

      // Open menu
      const openButton = screen.getByRole('button', { name: /Open navigation menu/i });
      fireEvent.click(openButton);

      // Close menu
      const closeButton = screen.getByRole('button', { name: /Close navigation menu/i });
      fireEvent.click(closeButton);

      expect(
        screen.queryByRole('menu', { name: /Mobile app navigation/i })
      ).not.toBeInTheDocument();
    });

    it('mobile menu contains app navigation links', () => {
      render(<AppHeader />);

      // Open menu
      const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
      fireEvent.click(menuButton);

      // Check for app links in mobile menu (there will be 2 of each - desktop and mobile)
      const collectionLinks = screen.getAllByText('My Collection');
      const setsLinks = screen.getAllByText('Browse Sets');
      const badgesLinks = screen.getAllByText('Badges');
      const wishlistLinks = screen.getAllByText('Wishlist');
      const searchLinks = screen.getAllByText('Search');

      expect(collectionLinks.length).toBeGreaterThanOrEqual(2);
      expect(setsLinks.length).toBeGreaterThanOrEqual(2);
      expect(badgesLinks.length).toBeGreaterThanOrEqual(2);
      expect(wishlistLinks.length).toBeGreaterThanOrEqual(2);
      expect(searchLinks.length).toBeGreaterThanOrEqual(2);
    });

    it('mobile menu contains Sign Out button', () => {
      render(<AppHeader />);

      // Open menu
      const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
      fireEvent.click(menuButton);

      // Should have Sign Out button in mobile menu
      const signOutButtons = screen.getAllByRole('menuitem', { name: /Sign Out/i });
      expect(signOutButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('mobile menu calls signOut when Sign Out is clicked', () => {
      render(<AppHeader />);

      // Open menu
      const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
      fireEvent.click(menuButton);

      // Find and click Sign Out in mobile menu
      const signOutButtons = screen.getAllByRole('menuitem', { name: /Sign Out/i });
      fireEvent.click(signOutButtons[signOutButtons.length - 1]); // Click the mobile one

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('mobile menu does NOT contain marketing links', () => {
      render(<AppHeader />);

      // Open menu
      const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
      fireEvent.click(menuButton);

      expect(screen.queryByText('Features')).not.toBeInTheDocument();
      expect(screen.queryByText('Pricing')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('header has banner role', () => {
      render(<AppHeader />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('navigation has proper aria-label', () => {
      render(<AppHeader />);

      expect(screen.getByRole('navigation', { name: /App navigation/i })).toBeInTheDocument();
    });

    it('desktop navigation has menubar role', () => {
      render(<AppHeader />);

      expect(screen.getByRole('menubar')).toBeInTheDocument();
    });

    it('mobile menu button has aria-expanded attribute', () => {
      render(<AppHeader />);

      const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(menuButton);

      const closeButton = screen.getByRole('button', { name: /Close navigation menu/i });
      expect(closeButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('mobile menu button has aria-controls attribute', () => {
      render(<AppHeader />);

      const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
      expect(menuButton).toHaveAttribute('aria-controls', 'app-mobile-menu');
    });

    it('Heroicon icons are hidden from screen readers', () => {
      render(<AppHeader />);

      // Heroicons should have aria-hidden
      const icons = document.querySelectorAll('svg.h-4.w-4, svg.h-5.w-5');
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('nav links have icons for better recognition', () => {
      render(<AppHeader />);

      // Each nav link should have an icon (4x4 or 5x5)
      const navItems = screen.getAllByRole('menuitem');
      navItems.forEach((item) => {
        const icon = item.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('Styling', () => {
    it('header is sticky', () => {
      render(<AppHeader />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky', 'top-0');
    });

    it('header has backdrop blur', () => {
      render(<AppHeader />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('backdrop-blur-sm');
    });

    it('header has high z-index for stacking', () => {
      render(<AppHeader />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('z-50');
    });
  });

  describe('Parent Dashboard Access Control', () => {
    describe('when user is a parent', () => {
      beforeEach(() => {
        mockCurrentUserProfile = createMockParentProfile();
      });

      it('shows Parent Dashboard link in profile menu', () => {
        render(<AppHeader />);

        // Open profile menu
        const profileButton = screen.getByRole('button', { name: /Profile menu/i });
        fireEvent.click(profileButton);

        expect(screen.getByRole('menuitem', { name: /Parent Dashboard/i })).toBeInTheDocument();
      });

      it('Parent Dashboard link has correct href', () => {
        render(<AppHeader />);

        // Open profile menu
        const profileButton = screen.getByRole('button', { name: /Profile menu/i });
        fireEvent.click(profileButton);

        const dashboardLink = screen.getByRole('menuitem', { name: /Parent Dashboard/i });
        expect(dashboardLink).toHaveAttribute('href', '/parent-dashboard');
      });

      it('shows Parent Dashboard link in mobile menu', () => {
        render(<AppHeader />);

        // Open mobile menu
        const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
        fireEvent.click(menuButton);

        // Find Parent Dashboard in mobile menu (there will be one in desktop dropdown and one in mobile)
        const dashboardLinks = screen.getAllByText('Parent Dashboard');
        expect(dashboardLinks.length).toBeGreaterThanOrEqual(1);
      });

      it('closes profile menu when Parent Dashboard link is clicked', () => {
        render(<AppHeader />);

        // Open profile menu
        const profileButton = screen.getByRole('button', { name: /Profile menu/i });
        fireEvent.click(profileButton);

        // Click Parent Dashboard link
        const dashboardLink = screen.getByRole('menuitem', { name: /Parent Dashboard/i });
        fireEvent.click(dashboardLink);

        // Menu should be closed
        expect(screen.queryByRole('menu', { name: /Profile options/i })).not.toBeInTheDocument();
      });

      it('Parent Dashboard link has UserGroupIcon', () => {
        render(<AppHeader />);

        // Open profile menu
        const profileButton = screen.getByRole('button', { name: /Profile menu/i });
        fireEvent.click(profileButton);

        const dashboardLink = screen.getByRole('menuitem', { name: /Parent Dashboard/i });
        const icon = dashboardLink.querySelector('svg');
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });

    describe('when user is a child', () => {
      beforeEach(() => {
        mockCurrentUserProfile = createMockChildProfile();
      });

      it('does NOT show Parent Dashboard link in profile menu', () => {
        render(<AppHeader />);

        // Open profile menu
        const profileButton = screen.getByRole('button', { name: /Profile menu/i });
        fireEvent.click(profileButton);

        expect(screen.queryByText('Parent Dashboard')).not.toBeInTheDocument();
      });

      it('does NOT show Parent Dashboard link in mobile menu', () => {
        render(<AppHeader />);

        // Open mobile menu
        const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
        fireEvent.click(menuButton);

        expect(screen.queryByText('Parent Dashboard')).not.toBeInTheDocument();
      });
    });

    describe('when profile is not loaded (null)', () => {
      beforeEach(() => {
        mockCurrentUserProfile = null;
      });

      it('does NOT show Parent Dashboard link in profile menu', () => {
        render(<AppHeader />);

        // Open profile menu
        const profileButton = screen.getByRole('button', { name: /Profile menu/i });
        fireEvent.click(profileButton);

        expect(screen.queryByText('Parent Dashboard')).not.toBeInTheDocument();
      });

      it('does NOT show Parent Dashboard link in mobile menu', () => {
        render(<AppHeader />);

        // Open mobile menu
        const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
        fireEvent.click(menuButton);

        expect(screen.queryByText('Parent Dashboard')).not.toBeInTheDocument();
      });
    });
  });
});
