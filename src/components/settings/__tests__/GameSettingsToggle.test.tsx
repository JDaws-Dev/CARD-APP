import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameSettingsToggle, GameSettingsToggleSkeleton } from '../GameSettingsToggle';

// ============================================================================
// MOCKS
// ============================================================================

// Mock game selector provider
const mockToggleGame = vi.fn();
const mockSetPrimaryGame = vi.fn();
let mockIsLoading = false;
let mockSelectedGames = {
  primary: 'pokemon' as const,
  enabled: ['pokemon'] as const,
};

vi.mock('@/components/providers/GameSelectorProvider', () => ({
  useGameSelector: () => ({
    selectedGames: mockSelectedGames,
    primaryGame: {
      id: 'pokemon',
      shortName: 'Pokémon',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      textColor: 'text-yellow-800',
    },
    enabledGames: [{ id: 'pokemon', shortName: 'Pokémon' }],
    isLoading: mockIsLoading,
    toggleGame: mockToggleGame,
    setPrimaryGame: mockSetPrimaryGame,
  }),
}));

// Mock game selector library - only 4 supported games
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
  formatEnabledGames: (games: { primary: string; enabled: string[] }) => {
    if (games.enabled.length === 1) return 'Pokémon';
    if (games.enabled.length === 2) return 'Pokémon & Yu-Gi-Oh!';
    return `Pokémon +${games.enabled.length - 1} more`;
  },
}));

// Mock TCG icons - only 4 supported games
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
  mockToggleGame.mockReset();
  mockSetPrimaryGame.mockReset();
  mockIsLoading = false;
  mockSelectedGames = {
    primary: 'pokemon' as const,
    enabled: ['pokemon'] as const,
  };
});

// ============================================================================
// SKELETON TESTS
// ============================================================================

describe('GameSettingsToggleSkeleton', () => {
  it('should render skeleton structure', () => {
    render(<GameSettingsToggleSkeleton />);

    // Should have loading indicator for accessibility
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading game settings')).toBeInTheDocument();
  });

  it('should render skeleton with animate-pulse class', () => {
    const { container } = render(<GameSettingsToggleSkeleton />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render 4 game card skeletons', () => {
    const { container } = render(<GameSettingsToggleSkeleton />);
    const skeletonCards = container.querySelectorAll('.grid > div');
    expect(skeletonCards.length).toBe(4);
  });
});

// ============================================================================
// MAIN COMPONENT TESTS
// ============================================================================

describe('GameSettingsToggle', () => {
  describe('Layout and Structure', () => {
    it('should render the component with header', () => {
      render(<GameSettingsToggle />);

      expect(screen.getByText('Games You Collect')).toBeInTheDocument();
      expect(
        screen.getByText('Toggle games on or off. Your main game shows first.')
      ).toBeInTheDocument();
    });

    it('should render region with accessible label', () => {
      render(<GameSettingsToggle />);
      expect(screen.getByRole('region', { name: 'Game settings' })).toBeInTheDocument();
    });

    it('should render game grid with group role', () => {
      render(<GameSettingsToggle />);
      expect(screen.getByRole('group', { name: 'Select games to collect' })).toBeInTheDocument();
    });

    it('should render current selection summary', () => {
      render(<GameSettingsToggle />);
      expect(screen.getByText('Currently tracking:')).toBeInTheDocument();
      // The formatted summary appears in the border container with the tracking text
      const summaryContainer = screen
        .getByText('Currently tracking:')
        .closest('.rounded-xl.border-2');
      expect(summaryContainer).toHaveTextContent('Pokémon');
    });

    it('should render info note about auto-save', () => {
      render(<GameSettingsToggle />);
      expect(screen.getByText(/Changes save automatically/)).toBeInTheDocument();
    });
  });

  describe('Game Cards', () => {
    it('should render all game cards', () => {
      render(<GameSettingsToggle />);

      // Using the mocked 4 supported games
      expect(screen.getByLabelText('Disable Pokémon TCG')).toBeInTheDocument();
      expect(screen.getByLabelText('Enable Yu-Gi-Oh!')).toBeInTheDocument();
      expect(screen.getByLabelText('Enable One Piece Card Game')).toBeInTheDocument();
      expect(screen.getByLabelText('Enable Disney Lorcana')).toBeInTheDocument();
    });

    it('should show selected state for enabled games', () => {
      render(<GameSettingsToggle />);

      // Pokemon should be pressed (selected)
      const pokemonButton = screen.getByLabelText('Disable Pokémon TCG');
      expect(pokemonButton).toHaveAttribute('aria-pressed', 'true');

      // Yu-Gi-Oh should not be pressed
      const yugiohButton = screen.getByLabelText('Enable Yu-Gi-Oh!');
      expect(yugiohButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should show primary indicator for main game', () => {
      render(<GameSettingsToggle />);

      // Should have Main indicator for Pokemon
      expect(screen.getByText('Main')).toBeInTheDocument();
    });

    it('should show "Set main" button for selected non-primary games', () => {
      // Enable multiple games but pokemon is still primary
      mockSelectedGames = {
        primary: 'pokemon' as const,
        enabled: ['pokemon', 'yugioh'] as const,
      };

      render(<GameSettingsToggle />);

      // Should have "Set main" button for Yu-Gi-Oh
      expect(screen.getByLabelText('Set Yu-Gi-Oh! as main game')).toBeInTheDocument();
    });

    it('should NOT show "Set main" button for unselected games', () => {
      render(<GameSettingsToggle />);

      // Yu-Gi-Oh is not selected, so no "Set main" button
      expect(screen.queryByLabelText('Set Yu-Gi-Oh! as main game')).not.toBeInTheDocument();
    });
  });

  describe('Toggle Interactions', () => {
    it('should call toggleGame when clicking a game card', () => {
      render(<GameSettingsToggle />);

      // Click Yu-Gi-Oh to enable it
      fireEvent.click(screen.getByLabelText('Enable Yu-Gi-Oh!'));
      expect(mockToggleGame).toHaveBeenCalledWith('yugioh');
    });

    it('should call toggleGame when clicking selected game to disable', () => {
      render(<GameSettingsToggle />);

      // Click Pokemon to toggle (disable) it
      fireEvent.click(screen.getByLabelText('Disable Pokémon TCG'));
      expect(mockToggleGame).toHaveBeenCalledWith('pokemon');
    });

    it('should call setPrimaryGame when clicking "Set main" button', () => {
      // Enable multiple games
      mockSelectedGames = {
        primary: 'pokemon' as const,
        enabled: ['pokemon', 'yugioh'] as const,
      };

      render(<GameSettingsToggle />);

      // Click "Set main" for Yu-Gi-Oh
      fireEvent.click(screen.getByLabelText('Set Yu-Gi-Oh! as main game'));
      expect(mockSetPrimaryGame).toHaveBeenCalledWith('yugioh');
    });

    it('should not trigger toggle when clicking "Set main" button', () => {
      // Enable multiple games
      mockSelectedGames = {
        primary: 'pokemon' as const,
        enabled: ['pokemon', 'yugioh'] as const,
      };

      render(<GameSettingsToggle />);

      // Click "Set main" for Yu-Gi-Oh
      fireEvent.click(screen.getByLabelText('Set Yu-Gi-Oh! as main game'));

      // Should only call setPrimaryGame, not toggleGame
      expect(mockSetPrimaryGame).toHaveBeenCalledWith('yugioh');
      expect(mockToggleGame).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      mockIsLoading = true;

      render(<GameSettingsToggle />);

      // Should show skeleton
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByText('Games You Collect')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-pressed states on game buttons', () => {
      mockSelectedGames = {
        primary: 'pokemon' as const,
        enabled: ['pokemon', 'yugioh'] as const,
      };

      render(<GameSettingsToggle />);

      expect(screen.getByLabelText('Disable Pokémon TCG')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText('Disable Yu-Gi-Oh!')).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByLabelText('Enable One Piece Card Game')).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    });

    it('should have accessible labels for set main buttons', () => {
      mockSelectedGames = {
        primary: 'pokemon' as const,
        enabled: ['pokemon', 'yugioh', 'lorcana'] as const,
      };

      render(<GameSettingsToggle />);

      expect(screen.getByLabelText('Set Yu-Gi-Oh! as main game')).toBeInTheDocument();
      expect(screen.getByLabelText('Set Disney Lorcana as main game')).toBeInTheDocument();
    });

    it('should have title attribute on main game indicator', () => {
      render(<GameSettingsToggle />);

      // The star badge has a title
      expect(screen.getByTitle('Main game')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(<GameSettingsToggle className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should render with gradient header icon', () => {
      const { container } = render(<GameSettingsToggle />);

      // Header icon should have gradient styling
      const headerIcon = container.querySelector('.from-indigo-500.to-purple-500');
      expect(headerIcon).toBeInTheDocument();
    });
  });

  describe('Selection Summary Display', () => {
    it('should show formatted game list for single game', () => {
      render(<GameSettingsToggle />);
      // Find the summary section specifically
      const summarySection = screen.getByText('Currently tracking:').closest('div')?.parentElement;
      expect(summarySection).toHaveTextContent('Pokémon');
    });

    it('should show formatted game list for multiple games', () => {
      mockSelectedGames = {
        primary: 'pokemon' as const,
        enabled: ['pokemon', 'yugioh'] as const,
      };

      render(<GameSettingsToggle />);

      // formatEnabledGames mock returns "Pokémon & Yu-Gi-Oh!" for 2 games
      const summarySection = screen.getByText('Currently tracking:').closest('div')?.parentElement;
      expect(summarySection).toHaveTextContent('Pokémon & Yu-Gi-Oh!');
    });
  });
});
