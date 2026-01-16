import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '../page';

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

describe('Landing Page', () => {
  describe('CTA Links - Auth Flow', () => {
    it('hero "Start Collecting Free" button links to signup', () => {
      render(<Home />);

      const startButtons = screen.getAllByText('Start Collecting Free');
      // Hero button is first
      const heroButton = startButtons[0].closest('a');
      expect(heroButton).toHaveAttribute('href', '/signup');
    });

    it('hero "Log In" button links to login page', () => {
      render(<Home />);

      const loginButton = screen.getByRole('link', { name: 'Log In' });
      expect(loginButton).toHaveAttribute('href', '/login');
    });

    it('"Start Your Wishlist" button links to signup', () => {
      render(<Home />);

      const wishlistButton = screen.getByRole('link', { name: /Start Your Wishlist/i });
      expect(wishlistButton).toHaveAttribute('href', '/signup');
    });

    it('Free plan "Get Started Free" button links to signup', () => {
      render(<Home />);

      const freeButtons = screen.getAllByRole('link', { name: /Get Started Free/i });
      // The Free plan button
      freeButtons.forEach((button) => {
        expect(button).toHaveAttribute('href', '/signup');
      });
    });

    it('Family plan "Start Family Plan" button links to signup', () => {
      render(<Home />);

      const familyButton = screen.getByRole('link', { name: /Start Family Plan/i });
      expect(familyButton).toHaveAttribute('href', '/signup');
    });

    it('final CTA "Get Started Now" button links to signup', () => {
      render(<Home />);

      const ctaButton = screen.getByRole('link', { name: /Get Started Now/i });
      expect(ctaButton).toHaveAttribute('href', '/signup');
    });
  });

  describe('No App Links for Unauthenticated Visitors', () => {
    it('does NOT have CTAs linking directly to /sets', () => {
      render(<Home />);

      const allLinks = screen.getAllByRole('link');
      const setsLinks = allLinks.filter(
        (link) =>
          link.getAttribute('href') === '/sets' || link.getAttribute('href')?.startsWith('/sets/')
      );

      expect(setsLinks).toHaveLength(0);
    });

    it('does NOT have CTAs linking directly to /collection', () => {
      render(<Home />);

      const allLinks = screen.getAllByRole('link');
      const collectionLinks = allLinks.filter(
        (link) =>
          link.getAttribute('href') === '/collection' ||
          link.getAttribute('href')?.startsWith('/collection/')
      );

      expect(collectionLinks).toHaveLength(0);
    });

    it('all primary CTAs link to signup', () => {
      render(<Home />);

      const signupCTAs = [
        'Start Collecting Free',
        'Start Your Wishlist',
        'Get Started Free',
        'Start Family Plan',
        'Get Started Now',
      ];

      signupCTAs.forEach((ctaText) => {
        const links = screen.getAllByRole('link', { name: new RegExp(ctaText, 'i') });
        links.forEach((link) => {
          expect(link).toHaveAttribute('href', '/signup');
        });
      });
    });
  });

  describe('Landing Page Sections', () => {
    it('renders the hero section with main tagline', () => {
      render(<Home />);

      expect(screen.getByText(/All your cards\. One app\./i)).toBeInTheDocument();
    });

    it('renders the "How It Works" section', () => {
      render(<Home />);

      expect(screen.getByText('How It Works')).toBeInTheDocument();
      expect(screen.getByText('Pick Your Sets')).toBeInTheDocument();
      expect(screen.getByText('Tap Cards You Own')).toBeInTheDocument();
      expect(screen.getByText('Earn Badges & Share')).toBeInTheDocument();
    });

    it('renders the features section with anchor id', () => {
      render(<Home />);

      const featuresSection = document.getElementById('features');
      expect(featuresSection).toBeInTheDocument();
    });

    it('renders the pricing section with anchor id', () => {
      render(<Home />);

      const pricingSection = document.getElementById('pricing');
      expect(pricingSection).toBeInTheDocument();
    });

    it('renders Free vs Family plan comparison', () => {
      render(<Home />);

      expect(screen.getByText('Free Forever')).toBeInTheDocument();
      expect(screen.getByText('Family Plan')).toBeInTheDocument();
      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.getByText('$4.99')).toBeInTheDocument();
    });

    it('renders testimonials section', () => {
      render(<Home />);

      expect(screen.getByText(/What Families Say/i)).toBeInTheDocument();
      expect(screen.getByText('Sarah M.')).toBeInTheDocument();
      expect(screen.getByText('Jake, age 9')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('hero buttons have appropriate roles', () => {
      render(<Home />);

      const startButton = screen.getAllByRole('link', { name: /Start Collecting Free/i })[0];
      const loginButton = screen.getByRole('link', { name: 'Log In' });

      expect(startButton).toBeInTheDocument();
      expect(loginButton).toBeInTheDocument();
    });

    it('decorative elements are hidden from screen readers', () => {
      render(<Home />);

      // Floating cards and stars should have aria-hidden
      const decorativeElements = document.querySelectorAll('[aria-hidden="true"]');
      expect(decorativeElements.length).toBeGreaterThan(0);
    });

    it('footer has contentinfo role', () => {
      render(<Home />);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });
});
