import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarketingHeader } from '../MarketingHeader';

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

describe('MarketingHeader', () => {
  beforeEach(() => {
    // Reset any DOM modifications
    document.body.innerHTML = '';
  });

  describe('Logo and Branding', () => {
    it('renders the CardDex logo', () => {
      render(<MarketingHeader />);

      expect(screen.getByText('CardDex')).toBeInTheDocument();
    });

    it('logo links to home page', () => {
      render(<MarketingHeader />);

      const homeLink = screen.getByLabelText('CardDex - Go to home page');
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('has proper accessibility label on logo', () => {
      render(<MarketingHeader />);

      expect(screen.getByLabelText('CardDex - Go to home page')).toBeInTheDocument();
    });
  });

  describe('Marketing Navigation Links', () => {
    it('renders Features link', () => {
      render(<MarketingHeader />);

      expect(screen.getByRole('menuitem', { name: 'Features' })).toBeInTheDocument();
    });

    it('renders Pricing link', () => {
      render(<MarketingHeader />);

      expect(screen.getByRole('menuitem', { name: 'Pricing' })).toBeInTheDocument();
    });

    it('Features link has correct href', () => {
      render(<MarketingHeader />);

      const featuresLink = screen.getByRole('menuitem', { name: 'Features' });
      expect(featuresLink).toHaveAttribute('href', '#features');
    });

    it('Pricing link has correct href', () => {
      render(<MarketingHeader />);

      const pricingLink = screen.getByRole('menuitem', { name: 'Pricing' });
      expect(pricingLink).toHaveAttribute('href', '#pricing');
    });

    it('does NOT render app navigation links like Browse Sets', () => {
      render(<MarketingHeader />);

      expect(screen.queryByText('Browse Sets')).not.toBeInTheDocument();
      expect(screen.queryByText('My Collection')).not.toBeInTheDocument();
      expect(screen.queryByText('My Wishlist')).not.toBeInTheDocument();
      expect(screen.queryByText('Badges')).not.toBeInTheDocument();
      expect(screen.queryByText('Parent Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Auth Buttons', () => {
    it('renders Log In button', () => {
      render(<MarketingHeader />);

      expect(screen.getByRole('link', { name: /Log In/i })).toBeInTheDocument();
    });

    it('renders Sign Up button', () => {
      render(<MarketingHeader />);

      expect(screen.getByRole('link', { name: /Sign Up/i })).toBeInTheDocument();
    });

    it('Log In button links to /login', () => {
      render(<MarketingHeader />);

      const loginLink = screen.getByRole('link', { name: /Log In/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('Sign Up button links to /signup', () => {
      render(<MarketingHeader />);

      const signupLink = screen.getByRole('link', { name: /Sign Up/i });
      expect(signupLink).toHaveAttribute('href', '/signup');
    });
  });

  describe('Mobile Menu', () => {
    it('renders mobile menu button', () => {
      render(<MarketingHeader />);

      expect(screen.getByRole('button', { name: /Open navigation menu/i })).toBeInTheDocument();
    });

    it('mobile menu is initially closed', () => {
      render(<MarketingHeader />);

      expect(
        screen.queryByRole('menu', { name: /Mobile marketing navigation/i })
      ).not.toBeInTheDocument();
    });

    it('opens mobile menu when hamburger button is clicked', () => {
      render(<MarketingHeader />);

      const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
      fireEvent.click(menuButton);

      expect(
        screen.getByRole('menu', { name: /Mobile marketing navigation/i })
      ).toBeInTheDocument();
    });

    it('closes mobile menu when close button is clicked', () => {
      render(<MarketingHeader />);

      // Open menu
      const openButton = screen.getByRole('button', { name: /Open navigation menu/i });
      fireEvent.click(openButton);

      // Close menu
      const closeButton = screen.getByRole('button', { name: /Close navigation menu/i });
      fireEvent.click(closeButton);

      expect(
        screen.queryByRole('menu', { name: /Mobile marketing navigation/i })
      ).not.toBeInTheDocument();
    });

    it('mobile menu contains marketing links', () => {
      render(<MarketingHeader />);

      // Open menu
      const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
      fireEvent.click(menuButton);

      // Check for marketing links in mobile menu (there will be 2 of each - desktop and mobile)
      const featuresLinks = screen.getAllByText('Features');
      const pricingLinks = screen.getAllByText('Pricing');

      expect(featuresLinks.length).toBeGreaterThanOrEqual(2);
      expect(pricingLinks.length).toBeGreaterThanOrEqual(2);
    });

    it('mobile menu contains auth buttons', () => {
      render(<MarketingHeader />);

      // Open menu
      const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
      fireEvent.click(menuButton);

      // Should have multiple Log In and Sign Up links (desktop + mobile)
      const loginLinks = screen.getAllByRole('link', { name: /Log In/i });
      const signupLinks = screen.getAllByRole('link', { name: /Sign Up/i });

      expect(loginLinks.length).toBeGreaterThanOrEqual(2);
      expect(signupLinks.length).toBeGreaterThanOrEqual(1);
    });

    it('mobile menu does NOT contain app navigation links', () => {
      render(<MarketingHeader />);

      // Open menu
      const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
      fireEvent.click(menuButton);

      expect(screen.queryByText('Browse Sets')).not.toBeInTheDocument();
      expect(screen.queryByText('My Collection')).not.toBeInTheDocument();
      expect(screen.queryByText('My Wishlist')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('header has banner role', () => {
      render(<MarketingHeader />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('navigation has proper aria-label', () => {
      render(<MarketingHeader />);

      expect(screen.getByRole('navigation', { name: /Marketing navigation/i })).toBeInTheDocument();
    });

    it('desktop navigation has menubar role', () => {
      render(<MarketingHeader />);

      expect(screen.getByRole('menubar')).toBeInTheDocument();
    });

    it('mobile menu button has aria-expanded attribute', () => {
      render(<MarketingHeader />);

      const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(menuButton);

      const closeButton = screen.getByRole('button', { name: /Close navigation menu/i });
      expect(closeButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('mobile menu button has aria-controls attribute', () => {
      render(<MarketingHeader />);

      const menuButton = screen.getByRole('button', { name: /Open navigation menu/i });
      expect(menuButton).toHaveAttribute('aria-controls', 'marketing-mobile-menu');
    });

    it('Heroicon icons are hidden from screen readers', () => {
      render(<MarketingHeader />);

      // Heroicons in the auth buttons should have aria-hidden
      // The logo icon is decorative but doesn't need aria-hidden since the link has an aria-label
      const arrowIcon = document.querySelector('svg.h-4.w-4');
      if (arrowIcon) {
        expect(arrowIcon).toHaveAttribute('aria-hidden', 'true');
      }
    });
  });

  describe('Smooth Scrolling', () => {
    it('calls scrollIntoView when anchor link is clicked', () => {
      // Create a mock target element
      const mockElement = document.createElement('section');
      mockElement.id = 'features';
      document.body.appendChild(mockElement);

      const scrollIntoViewMock = vi.fn();
      mockElement.scrollIntoView = scrollIntoViewMock;

      render(<MarketingHeader />);

      const featuresLink = screen.getByRole('menuitem', { name: 'Features' });
      fireEvent.click(featuresLink);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('does not scroll if target element does not exist', () => {
      render(<MarketingHeader />);

      // Should not throw an error
      const featuresLink = screen.getByRole('menuitem', { name: 'Features' });
      expect(() => fireEvent.click(featuresLink)).not.toThrow();
    });
  });

  describe('Styling', () => {
    it('header is sticky', () => {
      render(<MarketingHeader />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky', 'top-0');
    });

    it('header has backdrop blur', () => {
      render(<MarketingHeader />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('backdrop-blur-sm');
    });

    it('header has high z-index for stacking', () => {
      render(<MarketingHeader />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('z-50');
    });
  });
});
