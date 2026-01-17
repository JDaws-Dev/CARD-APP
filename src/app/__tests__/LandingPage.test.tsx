import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock convex/react auth hooks - default to unauthenticated
let mockAuthState = { isAuthenticated: false, isLoading: false };
vi.mock('convex/react', () => ({
  useConvexAuth: () => mockAuthState,
}));

beforeEach(() => {
  mockPush.mockClear();
  // Reset to default state before each test
  mockAuthState = { isAuthenticated: false, isLoading: false };
});

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

  describe('Trust Signals Section', () => {
    it('renders the trust signals section header', () => {
      render(<Home />);

      expect(screen.getByText('Safe & Trusted')).toBeInTheDocument();
      // Text is broken across elements, so search separately
      expect(screen.getByText(/Built With/)).toBeInTheDocument();
      expect(screen.getByText(/Your Family/)).toBeInTheDocument();
      expect(screen.getByText(/in Mind/)).toBeInTheDocument();
    });

    it('renders COPPA compliant badge', () => {
      render(<Home />);

      const coppaCard = screen.getByTestId('trust-signal-coppa');
      expect(coppaCard).toBeInTheDocument();
      expect(screen.getByText('COPPA Compliant')).toBeInTheDocument();
      expect(screen.getByText(/Children's Online Privacy Protection Act/i)).toBeInTheDocument();
      expect(screen.getByText('Verified compliant')).toBeInTheDocument();
    });

    it('renders No Ads Ever shield', () => {
      render(<Home />);

      const noAdsCard = screen.getByTestId('trust-signal-no-ads');
      expect(noAdsCard).toBeInTheDocument();
      expect(screen.getByText('No Ads Ever')).toBeInTheDocument();
      expect(screen.getByText(/will never show advertisements/i)).toBeInTheDocument();
      expect(screen.getByText('Ad-free forever')).toBeInTheDocument();
    });

    it('renders Cloud Backup badge', () => {
      render(<Home />);

      const cloudCard = screen.getByTestId('trust-signal-cloud-backup');
      expect(cloudCard).toBeInTheDocument();
      expect(screen.getByText('Cloud Backup')).toBeInTheDocument();
      expect(screen.getByText(/automatically saved to the cloud/i)).toBeInTheDocument();
      expect(screen.getByText('Auto-saved')).toBeInTheDocument();
    });

    it('renders additional trust indicators', () => {
      render(<Home />);

      expect(screen.getByText('Encrypted data')).toBeInTheDocument();
      expect(screen.getByText('Secure login')).toBeInTheDocument();
      expect(screen.getByText('Family-first design')).toBeInTheDocument();
    });

    it('trust signal cards have hover styling classes', () => {
      render(<Home />);

      const coppaCard = screen.getByTestId('trust-signal-coppa');
      const noAdsCard = screen.getByTestId('trust-signal-no-ads');
      const cloudCard = screen.getByTestId('trust-signal-cloud-backup');

      [coppaCard, noAdsCard, cloudCard].forEach((card) => {
        expect(card.className).toContain('hover:-translate-y-1');
        expect(card.className).toContain('hover:shadow-xl');
      });
    });

    it('trust signal cards have appropriate gradient backgrounds', () => {
      render(<Home />);

      const coppaCard = screen.getByTestId('trust-signal-coppa');
      const noAdsCard = screen.getByTestId('trust-signal-no-ads');
      const cloudCard = screen.getByTestId('trust-signal-cloud-backup');

      // COPPA - blue/indigo gradient
      expect(coppaCard.className).toContain('from-blue-50');
      expect(coppaCard.className).toContain('to-indigo-50');

      // No Ads - rose/pink gradient
      expect(noAdsCard.className).toContain('from-rose-50');
      expect(noAdsCard.className).toContain('to-pink-50');

      // Cloud Backup - emerald/teal gradient
      expect(cloudCard.className).toContain('from-emerald-50');
      expect(cloudCard.className).toContain('to-teal-50');
    });

    it('decorative elements in trust cards are hidden from screen readers', () => {
      render(<Home />);

      // Each trust signal card has decorative elements with aria-hidden
      // (icons, badges, and decorative circles)
      const trustCardsDecorative = document.querySelectorAll(
        '[data-testid^="trust-signal-"] [aria-hidden="true"]'
      );
      // Each card has multiple aria-hidden elements (icons and decorative circles)
      expect(trustCardsDecorative.length).toBeGreaterThanOrEqual(3);
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

  describe('Auth Redirect Behavior', () => {
    it('shows loading spinner when auth is loading', () => {
      // Set auth state to loading
      mockAuthState = { isAuthenticated: false, isLoading: true };

      render(<Home />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('redirects to dashboard when authenticated', () => {
      // Set auth state to authenticated
      mockAuthState = { isAuthenticated: true, isLoading: false };

      render(<Home />);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('shows landing page content when not authenticated', () => {
      render(<Home />);

      expect(screen.getByText(/All your cards\. One app\./i)).toBeInTheDocument();
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });
});
