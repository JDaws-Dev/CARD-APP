import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthAwareFooter } from '../AuthAwareFooter';

// Mock convex/react
vi.mock('convex/react', () => ({
  useConvexAuth: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { useConvexAuth } from 'convex/react';

describe('AuthAwareFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('renders nothing while authentication state is loading', () => {
      vi.mocked(useConvexAuth).mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      const { container } = render(<AuthAwareFooter />);

      // Should not render any visible content
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Unauthenticated State', () => {
    it('renders nothing when user is not authenticated', () => {
      vi.mocked(useConvexAuth).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      const { container } = render(<AuthAwareFooter />);

      // Should not render any visible content
      expect(container.firstChild).toBeNull();
    });

    it('does not show footer navigation when not authenticated', () => {
      vi.mocked(useConvexAuth).mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      render(<AuthAwareFooter />);

      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    it('renders AppFooter when user is authenticated', () => {
      vi.mocked(useConvexAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      render(<AuthAwareFooter />);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('shows footer navigation when authenticated', () => {
      vi.mocked(useConvexAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      render(<AuthAwareFooter />);

      expect(screen.getByRole('navigation', { name: /Footer navigation/i })).toBeInTheDocument();
    });

    it('shows all footer links when authenticated', () => {
      vi.mocked(useConvexAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      render(<AuthAwareFooter />);

      expect(screen.getByRole('link', { name: /Help/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Privacy Policy/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Terms of Service/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Contact/i })).toBeInTheDocument();
    });

    it('shows copyright text when authenticated', () => {
      vi.mocked(useConvexAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      render(<AuthAwareFooter />);

      expect(screen.getByText(/CardDex\. All rights reserved\./i)).toBeInTheDocument();
    });
  });
});
