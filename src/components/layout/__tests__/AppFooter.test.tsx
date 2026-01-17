import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppFooter } from '../AppFooter';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('AppFooter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Structure and Layout', () => {
    it('renders the footer element', () => {
      render(<AppFooter />);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('has proper styling classes', () => {
      render(<AppFooter />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('border-t', 'border-gray-200', 'bg-white');
    });

    it('supports dark mode styling', () => {
      render(<AppFooter />);

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveClass('dark:border-slate-700', 'dark:bg-slate-900');
    });
  });

  describe('Footer Navigation Links', () => {
    it('renders Help link', () => {
      render(<AppFooter />);

      const helpLink = screen.getByRole('link', { name: /Help/i });
      expect(helpLink).toBeInTheDocument();
      expect(helpLink).toHaveAttribute('href', '/help');
    });

    it('renders Privacy Policy link', () => {
      render(<AppFooter />);

      const privacyLink = screen.getByRole('link', { name: /Privacy Policy/i });
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/privacy');
    });

    it('renders Terms of Service link', () => {
      render(<AppFooter />);

      const termsLink = screen.getByRole('link', { name: /Terms of Service/i });
      expect(termsLink).toBeInTheDocument();
      expect(termsLink).toHaveAttribute('href', '/terms');
    });

    it('renders Contact link', () => {
      render(<AppFooter />);

      const contactLink = screen.getByRole('link', { name: /Contact/i });
      expect(contactLink).toBeInTheDocument();
      expect(contactLink).toHaveAttribute('href', '/contact');
    });

    it('has footer navigation with proper aria-label', () => {
      render(<AppFooter />);

      expect(screen.getByRole('navigation', { name: /Footer navigation/i })).toBeInTheDocument();
    });
  });

  describe('Link Icons', () => {
    it('each link has an icon', () => {
      render(<AppFooter />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        const icon = link.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });

    it('icons are hidden from screen readers', () => {
      render(<AppFooter />);

      const icons = document.querySelectorAll('svg');
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Copyright', () => {
    it('displays copyright text', () => {
      render(<AppFooter />);

      expect(screen.getByText(/CardDex\. All rights reserved\./i)).toBeInTheDocument();
    });

    it('displays current year in copyright', () => {
      render(<AppFooter />);

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
    });
  });

  describe('Disclaimer', () => {
    it('displays trademark disclaimer', () => {
      render(<AppFooter />);

      expect(
        screen.getByText(/CardDex is not affiliated with, endorsed by, or sponsored by/i)
      ).toBeInTheDocument();
    });

    it('mentions major TCG companies in disclaimer', () => {
      render(<AppFooter />);

      const disclaimer = screen.getByText(/CardDex is not affiliated with/i);
      expect(disclaimer).toHaveTextContent(/Pok.mon Company/i);
      expect(disclaimer).toHaveTextContent(/Nintendo/i);
      expect(disclaimer).toHaveTextContent(/Konami/i);
    });
  });

  describe('Accessibility', () => {
    it('has contentinfo role on footer', () => {
      render(<AppFooter />);

      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('links have focus visible styles', () => {
      render(<AppFooter />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
      });
    });

    it('links have hover styles for interactivity feedback', () => {
      render(<AppFooter />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveClass('hover:text-kid-primary');
      });
    });
  });

  describe('Responsive Design', () => {
    it('uses flex layout that adapts to screen size', () => {
      render(<AppFooter />);

      const container = document.querySelector('.flex.flex-col');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('sm:flex-row', 'sm:justify-between');
    });

    it('navigation has flexible gap spacing', () => {
      render(<AppFooter />);

      const nav = screen.getByRole('navigation', { name: /Footer navigation/i });
      expect(nav).toHaveClass('gap-4', 'sm:gap-6');
    });
  });
});
