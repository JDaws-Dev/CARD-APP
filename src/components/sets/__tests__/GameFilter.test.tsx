import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameFilter, GameFilterSkeleton, type GameFilterValue } from '../GameFilter';

// Mock the GameSelectorProvider hook
const mockEnabledGames = [
  {
    id: 'pokemon',
    name: 'Pokémon TCG',
    shortName: 'Pokémon',
    gradientFrom: 'from-yellow-400',
    gradientTo: 'to-red-500',
  },
  {
    id: 'yugioh',
    name: 'Yu-Gi-Oh!',
    shortName: 'Yu-Gi-Oh!',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-indigo-600',
  },
];

let mockIsLoading = false;

vi.mock('@/components/providers/GameSelectorProvider', () => ({
  useGameSelector: () => ({
    enabledGames: mockEnabledGames,
    isLoading: mockIsLoading,
    selectedGames: { primary: 'pokemon', enabled: ['pokemon', 'yugioh'] },
  }),
}));

// Mock the TCG icons
vi.mock('@/components/icons/tcg', () => ({
  GAME_ICONS: {
    pokemon: function PokemonIcon(props: { className?: string }) {
      return <svg data-testid="pokemon-icon" {...props} />;
    },
    yugioh: function YugiohIcon(props: { className?: string }) {
      return <svg data-testid="yugioh-icon" {...props} />;
    },
  },
  GenericTcgIcon: function GenericTcgIcon(props: { className?: string }) {
    return <svg data-testid="generic-icon" {...props} />;
  },
}));

describe('GameFilter', () => {
  const defaultProps = {
    value: 'all' as GameFilterValue,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading = false;
  });

  describe('Rendering', () => {
    it('renders the All Games tab', () => {
      render(<GameFilter {...defaultProps} />);
      expect(screen.getByRole('tab', { name: /All Games/i })).toBeInTheDocument();
    });

    it('renders tabs for each enabled game', () => {
      render(<GameFilter {...defaultProps} />);
      // Should show Pokemon and Yu-Gi-Oh tabs based on mock
      expect(screen.getByRole('tab', { name: /Pokémon/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Yu-Gi-Oh!/i })).toBeInTheDocument();
    });

    it('renders the tablist container with correct aria-label', () => {
      render(<GameFilter {...defaultProps} />);
      expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', 'Filter by game');
    });

    it('renders game icons', () => {
      render(<GameFilter {...defaultProps} />);
      expect(screen.getByTestId('pokemon-icon')).toBeInTheDocument();
      expect(screen.getByTestId('yugioh-icon')).toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('marks the All tab as selected when value is all', () => {
      render(<GameFilter {...defaultProps} value="all" />);
      const allTab = screen.getByRole('tab', { name: /All Games/i });
      expect(allTab).toHaveAttribute('aria-selected', 'true');
    });

    it('marks a game tab as selected when that game is the value', () => {
      render(<GameFilter {...defaultProps} value="pokemon" />);
      const pokemonTab = screen.getByRole('tab', { name: /Pokémon/i });
      expect(pokemonTab).toHaveAttribute('aria-selected', 'true');

      const allTab = screen.getByRole('tab', { name: /All Games/i });
      expect(allTab).toHaveAttribute('aria-selected', 'false');
    });

    it('applies gradient styling to selected tab', () => {
      render(<GameFilter {...defaultProps} value="pokemon" />);
      const pokemonTab = screen.getByRole('tab', { name: /Pokémon/i });
      expect(pokemonTab).toHaveClass('text-white');
      expect(pokemonTab).toHaveClass('shadow-md');
    });

    it('applies default styling to non-selected tabs', () => {
      render(<GameFilter {...defaultProps} value="pokemon" />);
      const yugiohTab = screen.getByRole('tab', { name: /Yu-Gi-Oh!/i });
      expect(yugiohTab).toHaveClass('bg-white');
      expect(yugiohTab).toHaveClass('text-gray-600');
    });
  });

  describe('Interactions', () => {
    it('calls onChange with "all" when All tab is clicked', () => {
      const onChange = vi.fn();
      render(<GameFilter {...defaultProps} value="pokemon" onChange={onChange} />);

      fireEvent.click(screen.getByRole('tab', { name: /All Games/i }));
      expect(onChange).toHaveBeenCalledWith('all');
    });

    it('calls onChange with game id when a game tab is clicked', () => {
      const onChange = vi.fn();
      render(<GameFilter {...defaultProps} value="all" onChange={onChange} />);

      fireEvent.click(screen.getByRole('tab', { name: /Pokémon/i }));
      expect(onChange).toHaveBeenCalledWith('pokemon');
    });

    it('calls onChange with yugioh when Yu-Gi-Oh tab is clicked', () => {
      const onChange = vi.fn();
      render(<GameFilter {...defaultProps} value="all" onChange={onChange} />);

      fireEvent.click(screen.getByRole('tab', { name: /Yu-Gi-Oh!/i }));
      expect(onChange).toHaveBeenCalledWith('yugioh');
    });
  });

  describe('Set Counts', () => {
    it('displays count badges when setCounts prop is provided', () => {
      const setCounts: Record<GameFilterValue, number> = {
        all: 50,
        pokemon: 45,
        yugioh: 5,
        onepiece: 0,
        dragonball: 0,
        lorcana: 0,
        digimon: 0,
        mtg: 0,
      };

      render(<GameFilter {...defaultProps} setCounts={setCounts} />);

      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('does not display count badges when setCounts is not provided', () => {
      render(<GameFilter {...defaultProps} />);
      // The counts shouldn't be present
      expect(screen.queryByText('50')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('renders skeleton when loading', () => {
      mockIsLoading = true;
      const { container } = render(<GameFilter {...defaultProps} />);

      // Should show skeleton placeholders
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});

describe('GameFilterSkeleton', () => {
  it('renders skeleton placeholders', () => {
    const { container } = render(<GameFilterSkeleton />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(3); // All + 2 games
  });

  it('has aria-hidden attribute', () => {
    const { container } = render(<GameFilterSkeleton />);

    // The outer container should have aria-hidden
    const skeletonContainer = container.firstChild;
    expect(skeletonContainer).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies rounded-full styling to skeleton elements', () => {
    const { container } = render(<GameFilterSkeleton />);

    const skeletons = container.querySelectorAll('.rounded-full');
    expect(skeletons.length).toBe(3);
  });
});
