import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WhatsNextCard, WhatsNextCardSkeleton } from '../WhatsNextCard';

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

// Mock cn utility
vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' '),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('WhatsNextCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Visibility Logic', () => {
    it('renders for new users with 0 cards', () => {
      render(<WhatsNextCard totalCards={0} setsStarted={0} />);

      expect(screen.getByRole('region', { name: /getting started guide/i })).toBeInTheDocument();
      expect(screen.getByText("What's Next?")).toBeInTheDocument();
    });

    it('renders for users with fewer than 10 cards', () => {
      render(<WhatsNextCard totalCards={5} setsStarted={1} />);

      expect(screen.getByRole('region', { name: /getting started guide/i })).toBeInTheDocument();
    });

    it('does not render for users with 10 or more cards', () => {
      render(<WhatsNextCard totalCards={10} setsStarted={2} />);

      expect(
        screen.queryByRole('region', { name: /getting started guide/i })
      ).not.toBeInTheDocument();
    });

    it('does not render for users with many cards', () => {
      render(<WhatsNextCard totalCards={100} setsStarted={5} />);

      expect(screen.queryByText("What's Next?")).not.toBeInTheDocument();
    });

    it('does not render when dismissed in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('true');

      render(<WhatsNextCard totalCards={0} setsStarted={0} />);

      expect(
        screen.queryByRole('region', { name: /getting started guide/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('shows Browse Sets step', () => {
      render(<WhatsNextCard totalCards={0} setsStarted={0} />);

      expect(screen.getByText('Browse Sets')).toBeInTheDocument();
      expect(screen.getByText(/find cards from your favorite sets/i)).toBeInTheDocument();
    });

    it('shows Learn to Collect step', () => {
      render(<WhatsNextCard totalCards={0} setsStarted={0} />);

      expect(screen.getByText('Learn to Collect')).toBeInTheDocument();
      expect(screen.getByText(/tips on card care/i)).toBeInTheDocument();
    });

    it('shows encouragement message for users with 0 cards', () => {
      render(<WhatsNextCard totalCards={0} setsStarted={0} />);

      expect(screen.getByText(/add your first card to start earning badges/i)).toBeInTheDocument();
    });

    it('does not show encouragement message for users with cards', () => {
      render(<WhatsNextCard totalCards={3} setsStarted={1} />);

      expect(
        screen.queryByText(/add your first card to start earning badges/i)
      ).not.toBeInTheDocument();
    });

    it('shows getting started subtitle for incomplete users', () => {
      render(<WhatsNextCard totalCards={0} setsStarted={0} />);

      expect(
        screen.getByText(/here's how to get started with your collection/i)
      ).toBeInTheDocument();
    });
  });

  describe('Step Completion', () => {
    it('marks Browse Sets as complete when user has started a set', () => {
      render(<WhatsNextCard totalCards={5} setsStarted={1} />);

      // The Browse Sets link should have the "(Done)" indicator
      const browseSetLink = screen.getByRole('link', { name: /browse sets.*completed/i });
      expect(browseSetLink).toBeInTheDocument();
    });

    it('does not mark Browse Sets as complete when no sets started', () => {
      render(<WhatsNextCard totalCards={0} setsStarted={0} />);

      // Should not have "(Done)" for Browse Sets
      const browseSetLink = screen.getByRole('link', { name: /browse sets/i });
      expect(browseSetLink).not.toHaveAccessibleName(/completed/i);
    });

    it('shows progress counter when steps are completed', () => {
      render(<WhatsNextCard totalCards={5} setsStarted={1} />);

      // Should show "1/2" progress
      expect(screen.getByText('1/2')).toBeInTheDocument();
    });

    it('does not show progress counter when no steps completed', () => {
      render(<WhatsNextCard totalCards={0} setsStarted={0} />);

      expect(screen.queryByText('0/2')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('links to /sets for Browse Sets', () => {
      render(<WhatsNextCard totalCards={0} setsStarted={0} />);

      const browseSetLink = screen.getByRole('link', { name: /browse sets/i });
      expect(browseSetLink).toHaveAttribute('href', '/sets');
    });

    it('links to /learn for Learn to Collect', () => {
      render(<WhatsNextCard totalCards={0} setsStarted={0} />);

      const learnLink = screen.getByRole('link', { name: /learn to collect/i });
      expect(learnLink).toHaveAttribute('href', '/learn');
    });
  });

  describe('Dismiss Functionality', () => {
    it('has a dismiss button', () => {
      render(<WhatsNextCard totalCards={0} setsStarted={0} />);

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('hides the card when dismiss button is clicked', () => {
      render(<WhatsNextCard totalCards={0} setsStarted={0} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      expect(
        screen.queryByRole('region', { name: /getting started guide/i })
      ).not.toBeInTheDocument();
    });

    it('saves dismissed state to localStorage', () => {
      render(<WhatsNextCard totalCards={0} setsStarted={0} />);

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);

      expect(localStorageMock.setItem).toHaveBeenCalledWith('carddex-whats-next-dismissed', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA region role and label', () => {
      render(<WhatsNextCard totalCards={0} setsStarted={0} />);

      expect(screen.getByRole('region', { name: /getting started guide/i })).toBeInTheDocument();
    });

    it('dismiss button has accessible label', () => {
      render(<WhatsNextCard totalCards={0} setsStarted={0} />);

      expect(
        screen.getByRole('button', { name: /dismiss getting started guide/i })
      ).toBeInTheDocument();
    });

    it('step links have accessible labels', () => {
      render(<WhatsNextCard totalCards={0} setsStarted={0} />);

      expect(screen.getByRole('link', { name: /browse sets/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /learn to collect/i })).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('accepts custom className', () => {
      render(<WhatsNextCard totalCards={0} setsStarted={0} className="custom-class" />);

      const card = screen.getByRole('region', { name: /getting started guide/i });
      expect(card).toHaveClass('custom-class');
    });
  });
});

describe('WhatsNextCardSkeleton', () => {
  it('renders skeleton structure', () => {
    render(<WhatsNextCardSkeleton />);

    // Should have multiple skeleton placeholder elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('accepts custom className', () => {
    const { container } = render(<WhatsNextCardSkeleton className="custom-class" />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('custom-class');
  });

  it('renders two step placeholders', () => {
    render(<WhatsNextCardSkeleton />);

    // Should have two step rows in the skeleton
    const stepRows = document.querySelectorAll('.rounded-xl.bg-gray-50');
    expect(stepRows.length).toBe(2);
  });
});
