import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  GameSelectorOnboarding,
  GameSelectorOnboardingSkeleton,
  GameSelectorOnboardingModal,
} from '../GameSelectorOnboarding';

// ============================================================================
// MOCKS
// ============================================================================

// Mock game selector library with ONLY 4 supported games
vi.mock('@/lib/gameSelector', () => ({
  getAllGames: () => [
    {
      id: 'pokemon',
      name: 'Pokémon TCG',
      shortName: 'Pokémon',
      tagline: 'Gotta collect them all!',
      gradientFrom: 'from-yellow-400',
      gradientTo: 'to-red-500',
      primaryColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      textColor: 'text-yellow-800',
    },
    {
      id: 'yugioh',
      name: 'Yu-Gi-Oh!',
      shortName: 'Yu-Gi-Oh!',
      tagline: "It's time to duel!",
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-indigo-600',
      primaryColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      textColor: 'text-purple-800',
    },
    {
      id: 'onepiece',
      name: 'One Piece Card Game',
      shortName: 'One Piece',
      tagline: 'Set sail for adventure!',
      gradientFrom: 'from-red-500',
      gradientTo: 'to-orange-500',
      primaryColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      textColor: 'text-red-800',
    },
    {
      id: 'lorcana',
      name: 'Disney Lorcana',
      shortName: 'Lorcana',
      tagline: 'Magic awaits!',
      gradientFrom: 'from-blue-400',
      gradientTo: 'to-cyan-500',
      primaryColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-800',
    },
  ],
  getGameSelectorOnboarding: () => ({
    id: 'game-selector',
    title: 'What do you collect?',
    subtitle: "Pick the card games you're into!",
    description: 'Choose the trading card games you want to track.',
    tip: 'Pick your favorites from 4 popular TCGs!',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-purple-500',
  }),
  DEFAULT_SELECTED_GAMES: {
    primary: 'pokemon',
    enabled: ['pokemon'],
  },
}));

// Mock TCG icons - only supported games
vi.mock('@/components/icons/tcg', () => ({
  PokemonIcon: ({ className }: { className?: string }) => (
    <svg data-testid="pokemon-icon" className={className} />
  ),
  YugiohIcon: ({ className }: { className?: string }) => (
    <svg data-testid="yugioh-icon" className={className} />
  ),
  OnePieceIcon: ({ className }: { className?: string }) => (
    <svg data-testid="onepiece-icon" className={className} />
  ),
  LorcanaIcon: ({ className }: { className?: string }) => (
    <svg data-testid="lorcana-icon" className={className} />
  ),
  GenericTcgIcon: ({ className }: { className?: string }) => (
    <svg data-testid="generic-icon" className={className} />
  ),
}));

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// SKELETON TESTS
// ============================================================================

describe('GameSelectorOnboardingSkeleton', () => {
  it('should render skeleton structure', () => {
    const { container } = render(<GameSelectorOnboardingSkeleton />);

    // Should have animated skeleton
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render exactly 4 game card skeletons (supported games only)', () => {
    const { container } = render(<GameSelectorOnboardingSkeleton />);
    const skeletonCards = container.querySelectorAll('.grid > div');
    expect(skeletonCards.length).toBe(4);
  });

  it('should NOT render 7 skeletons (unsupported games removed)', () => {
    const { container } = render(<GameSelectorOnboardingSkeleton />);
    const skeletonCards = container.querySelectorAll('.grid > div');
    expect(skeletonCards.length).not.toBe(7);
  });

  it('should render header skeleton', () => {
    const { container } = render(<GameSelectorOnboardingSkeleton />);
    const headerSkeleton = container.querySelector('.mx-auto.h-16.w-16.rounded-full');
    expect(headerSkeleton).toBeInTheDocument();
  });

  it('should render continue button skeleton', () => {
    const { container } = render(<GameSelectorOnboardingSkeleton />);
    const buttonSkeleton = container.querySelector('.mx-auto.h-14.w-64.rounded-xl');
    expect(buttonSkeleton).toBeInTheDocument();
  });
});

// ============================================================================
// MAIN COMPONENT TESTS
// ============================================================================

describe('GameSelectorOnboarding', () => {
  describe('Supported Games Only', () => {
    it('should render only 4 supported games', () => {
      render(<GameSelectorOnboarding />);

      // Should show 4 supported games
      expect(screen.getByText('Pokémon')).toBeInTheDocument();
      expect(screen.getByText('Yu-Gi-Oh!')).toBeInTheDocument();
      expect(screen.getByText('One Piece')).toBeInTheDocument();
      expect(screen.getByText('Lorcana')).toBeInTheDocument();
    });

    it('should NOT render unsupported games (Digimon, Dragon Ball, MTG)', () => {
      render(<GameSelectorOnboarding />);

      // Should NOT show unsupported games
      expect(screen.queryByText('Digimon')).not.toBeInTheDocument();
      expect(screen.queryByText('Dragon Ball')).not.toBeInTheDocument();
      expect(screen.queryByText('Magic')).not.toBeInTheDocument();
      expect(screen.queryByText('MTG')).not.toBeInTheDocument();
      expect(screen.queryByText('Magic: The Gathering')).not.toBeInTheDocument();
    });

    it('should show correct count "X of 4 selected"', () => {
      render(<GameSelectorOnboarding />);

      // Default is pokemon selected, so should show "1 of 4 selected"
      expect(screen.getByText('1 of 4 selected')).toBeInTheDocument();
    });

    it('should show all 4 game icons', () => {
      render(<GameSelectorOnboarding />);

      expect(screen.getByTestId('pokemon-icon')).toBeInTheDocument();
      expect(screen.getByTestId('yugioh-icon')).toBeInTheDocument();
      expect(screen.getByTestId('onepiece-icon')).toBeInTheDocument();
      expect(screen.getByTestId('lorcana-icon')).toBeInTheDocument();
    });

    it('should NOT render unsupported game icons', () => {
      render(<GameSelectorOnboarding />);

      expect(screen.queryByTestId('digimon-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('dragonball-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mtg-icon')).not.toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('should render the header with title', () => {
      render(<GameSelectorOnboarding />);

      expect(screen.getByText('What do you collect?')).toBeInTheDocument();
      expect(screen.getByText("Pick the card games you're into!")).toBeInTheDocument();
    });

    it('should render tip section', () => {
      render(<GameSelectorOnboarding />);

      expect(screen.getByText('Tip')).toBeInTheDocument();
      expect(screen.getByText(/Tap the star to set your main game/)).toBeInTheDocument();
    });

    it('should render continue button', () => {
      render(<GameSelectorOnboarding />);

      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });
  });

  describe('Game Selection', () => {
    it('should allow toggling games on/off', () => {
      render(<GameSelectorOnboarding />);

      // Yu-Gi-Oh! should start unselected - use full game name from aria-label
      const yugiohButton = screen.getByRole('button', { name: /Select Yu-Gi-Oh!/i });
      expect(yugiohButton).toHaveAttribute('aria-pressed', 'false');

      // Click to select
      fireEvent.click(yugiohButton);

      // Should now be pressed/selected
      expect(yugiohButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should not allow deselecting the only selected game', () => {
      render(<GameSelectorOnboarding />);

      // Pokemon starts as the only selected game - use full game name from aria-label
      const pokemonButton = screen.getByRole('button', { name: /Deselect Pokémon TCG/i });
      expect(pokemonButton).toHaveAttribute('aria-pressed', 'true');

      // Click to deselect - should not work since it's the only one
      fireEvent.click(pokemonButton);

      // Should still be selected (can't deselect last game)
      expect(pokemonButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should allow setting primary game', () => {
      render(<GameSelectorOnboarding />);

      // First select Yu-Gi-Oh! so it becomes eligible for primary - use full game name
      const yugiohToggle = screen.getByRole('button', { name: /Select Yu-Gi-Oh!/i });
      fireEvent.click(yugiohToggle);

      // Now "Set as primary" button should appear for Yu-Gi-Oh! (aria-label uses "primary game" not "main")
      const setMainButton = screen.getByRole('button', { name: /Set Yu-Gi-Oh! as primary game/i });
      expect(setMainButton).toBeInTheDocument();

      fireEvent.click(setMainButton);

      // Yu-Gi-Oh! should now show as "Main game" (display text is "Main game" even though aria uses "primary")
      expect(screen.getByText('Main game')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should render back button when showBackButton is true and onBack is provided', () => {
      const onBack = vi.fn();
      render(<GameSelectorOnboarding showBackButton={true} onBack={onBack} />);

      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    });

    it('should call onBack when back button is clicked', () => {
      const onBack = vi.fn();
      render(<GameSelectorOnboarding showBackButton={true} onBack={onBack} />);

      fireEvent.click(screen.getByRole('button', { name: 'Back' }));
      expect(onBack).toHaveBeenCalled();
    });

    it('should not render back button when showBackButton is false', () => {
      const onBack = vi.fn();
      render(<GameSelectorOnboarding showBackButton={false} onBack={onBack} />);

      expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    });
  });

  describe('Continue Button State', () => {
    it('should show "Continue" when at least one game is selected', () => {
      render(<GameSelectorOnboarding />);

      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeEnabled();
      expect(continueButton).toHaveTextContent('Continue');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible game toggle buttons', () => {
      render(<GameSelectorOnboarding />);

      // All games should have accessible toggle buttons - use full game names
      expect(screen.getByRole('button', { name: /Deselect Pokémon TCG/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Select Yu-Gi-Oh!/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Select One Piece Card Game/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Select Disney Lorcana/i })).toBeInTheDocument();
    });

    it('should have keyboard hint', () => {
      render(<GameSelectorOnboarding />);

      expect(screen.getByText('Press Enter to continue')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// MODAL COMPONENT TESTS
// ============================================================================

describe('GameSelectorOnboardingModal', () => {
  it('should not render when isOpen is false', () => {
    render(<GameSelectorOnboardingModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByText('What do you collect?')).not.toBeInTheDocument();
  });

  it('should render only 4 supported games when open', () => {
    render(<GameSelectorOnboardingModal isOpen={true} onClose={vi.fn()} />);

    // Should show 4 supported games
    expect(screen.getByText('Pokémon')).toBeInTheDocument();
    expect(screen.getByText('Yu-Gi-Oh!')).toBeInTheDocument();
    expect(screen.getByText('One Piece')).toBeInTheDocument();
    expect(screen.getByText('Lorcana')).toBeInTheDocument();

    // Should NOT show unsupported games
    expect(screen.queryByText('Digimon')).not.toBeInTheDocument();
    expect(screen.queryByText('Dragon Ball')).not.toBeInTheDocument();
    expect(screen.queryByText('Magic')).not.toBeInTheDocument();
  });

  it('should show "X of 4 selected" counter', () => {
    render(<GameSelectorOnboardingModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('1 of 4 selected')).toBeInTheDocument();
  });

  it('should have close button', () => {
    render(<GameSelectorOnboardingModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<GameSelectorOnboardingModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
