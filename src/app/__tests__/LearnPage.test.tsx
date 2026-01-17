import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LearnPage from '../learn/page';

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

// Mock the game components to avoid complex dependencies
vi.mock('@/components/games/GradeLikeAProGame', () => ({
  GradeLikeAProButton: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick}>Play Grade Game</button>
  ),
  GradeLikeAProGame: () => <div data-testid="grade-game-modal">Grade Game Modal</div>,
  GradeLikeAProGameSkeleton: () => <div>Loading Grade Game...</div>,
}));

vi.mock('@/components/games/RarityGuessingGame', () => ({
  RarityGuessingButton: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick}>Play Rarity Game</button>
  ),
  RarityGuessingGame: () => <div data-testid="rarity-game-modal">Rarity Game Modal</div>,
}));

vi.mock('@/components/games/SetSymbolMatchingGame', () => ({
  SetSymbolMatchingButton: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick}>Play Symbol Game</button>
  ),
  SetSymbolMatchingGame: () => <div data-testid="symbol-game-modal">Symbol Game Modal</div>,
}));

vi.mock('@/components/games/PokemonTypeQuiz', () => ({
  PokemonTypeQuizButton: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick}>Play Type Quiz</button>
  ),
  PokemonTypeQuiz: () => <div data-testid="type-quiz-modal">Type Quiz Modal</div>,
}));

vi.mock('@/components/games/PriceEstimationGame', () => ({
  PriceEstimationGameButton: ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick}>Play Price Game</button>
  ),
  PriceEstimationGame: () => <div data-testid="price-game-modal">Price Game Modal</div>,
}));

vi.mock('@/components/tutorials/LearnToCollect', () => ({
  LearnToCollect: () => <div data-testid="learn-to-collect">Learn To Collect Content</div>,
}));

describe('Learn Page', () => {
  describe('Back Navigation', () => {
    it('renders a back link to dashboard', () => {
      render(<LearnPage />);

      const backLink = screen.getByRole('link', { name: /Back to Dashboard/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/dashboard');
    });

    it('back link has ArrowLeftIcon', () => {
      render(<LearnPage />);

      const backLink = screen.getByRole('link', { name: /Back to Dashboard/i });
      // Check that the link contains an SVG (the ArrowLeftIcon)
      const svg = backLink.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('back link has proper styling classes for hover state', () => {
      render(<LearnPage />);

      const backLink = screen.getByRole('link', { name: /Back to Dashboard/i });
      expect(backLink.className).toContain('hover:text-kid-primary');
    });
  });

  describe('Page Header', () => {
    it('renders the page title', () => {
      render(<LearnPage />);

      expect(screen.getByRole('heading', { name: /Learn to Collect/i })).toBeInTheDocument();
    });

    it('renders the page subtitle', () => {
      render(<LearnPage />);

      expect(
        screen.getByText(/Guides and mini-games to become a card expert/i)
      ).toBeInTheDocument();
    });

    it('renders the header icon', () => {
      render(<LearnPage />);

      // The header has an icon container with specific gradient classes
      const iconContainer = document.querySelector('.from-purple-500.to-indigo-600');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Page Content', () => {
    it('renders the Card Condition Guide section', () => {
      render(<LearnPage />);

      expect(screen.getByRole('heading', { name: /Card Condition Guide/i })).toBeInTheDocument();
    });

    it('renders link to condition guide', () => {
      render(<LearnPage />);

      const guideLink = screen.getByRole('link', { name: /View Guide/i });
      expect(guideLink).toHaveAttribute('href', '/condition-guide');
    });

    it('renders all mini-game sections', () => {
      render(<LearnPage />);

      expect(screen.getByRole('heading', { name: /Grade Like a Pro/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Rarity Guessing Game/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Set Symbol Matching/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Pokemon Type Quiz/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Price Estimation Game/i })).toBeInTheDocument();
    });

    it('renders the LearnToCollect component', () => {
      render(<LearnPage />);

      expect(screen.getByTestId('learn-to-collect')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has a main landmark', () => {
      render(<LearnPage />);

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('decorative icons are hidden from screen readers', () => {
      render(<LearnPage />);

      // Check that icons have aria-hidden
      const hiddenIcons = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });

    it('back link icon is decorative', () => {
      render(<LearnPage />);

      const backLink = screen.getByRole('link', { name: /Back to Dashboard/i });
      const icon = backLink.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
