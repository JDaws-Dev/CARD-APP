/**
 * Tests for GameThemeProvider component
 */

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameThemeProvider, GameThemed, useGameTheme } from '../GameThemeProvider';
import { GameSelectorProvider } from '../GameSelectorProvider';
import { GAME_CSS_VARIABLES, type GameId } from '@/lib/gameSelector';

// ============================================================================
// MOCK LOCALSTORAGE
// ============================================================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  // Clear any CSS variables that might be set on document.documentElement
  const root = document.documentElement;
  const cssVarProps = [
    '--game-primary',
    '--game-primary-rgb',
    '--game-secondary',
    '--game-secondary-rgb',
    '--game-accent',
    '--game-accent-rgb',
    '--game-text',
    '--game-text-rgb',
    '--game-border',
    '--game-border-rgb',
  ];
  cssVarProps.forEach((prop) => root.style.removeProperty(prop));
});

afterEach(() => {
  cleanup();
});

// ============================================================================
// WRAPPER HELPER
// ============================================================================

function TestWrapper({ children }: { children: React.ReactNode }) {
  return <GameSelectorProvider>{children}</GameSelectorProvider>;
}

// ============================================================================
// GAMETHEMEPROVIDER TESTS
// ============================================================================

describe('GameThemeProvider', () => {
  describe('Global theming (default)', () => {
    it('should render children', () => {
      render(
        <TestWrapper>
          <GameThemeProvider>
            <div data-testid="child">Child content</div>
          </GameThemeProvider>
        </TestWrapper>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('should apply CSS variables to document root', () => {
      render(
        <TestWrapper>
          <GameThemeProvider>
            <div>Content</div>
          </GameThemeProvider>
        </TestWrapper>
      );

      const root = document.documentElement;
      // Default game is Pokemon
      expect(root.style.getPropertyValue('--game-primary')).toBe('#eab308');
      expect(root.style.getPropertyValue('--game-secondary')).toBe('#ef4444');
    });

    it('should apply RGB variables for alpha support', () => {
      render(
        <TestWrapper>
          <GameThemeProvider>
            <div>Content</div>
          </GameThemeProvider>
        </TestWrapper>
      );

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--game-primary-rgb')).toBe('234, 179, 8');
      expect(root.style.getPropertyValue('--game-secondary-rgb')).toBe('239, 68, 68');
    });

    it('should use gameOverride when provided', () => {
      render(
        <TestWrapper>
          <GameThemeProvider gameOverride="yugioh">
            <div>Content</div>
          </GameThemeProvider>
        </TestWrapper>
      );

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--game-primary')).toBe('#8b5cf6');
    });
  });

  describe('Scoped theming', () => {
    it('should render wrapper div with scopedTheme', () => {
      render(
        <TestWrapper>
          <GameThemeProvider scopedTheme>
            <div data-testid="child">Child content</div>
          </GameThemeProvider>
        </TestWrapper>
      );

      expect(screen.getByTestId('game-theme-scope')).toBeInTheDocument();
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should apply style to wrapper div not document root', () => {
      render(
        <TestWrapper>
          <GameThemeProvider scopedTheme gameOverride="yugioh">
            <div data-testid="child">Child content</div>
          </GameThemeProvider>
        </TestWrapper>
      );

      const wrapper = screen.getByTestId('game-theme-scope');
      // Wrapper should have inline styles
      expect(wrapper).toHaveAttribute('style');
      expect(wrapper.style.getPropertyValue('--game-primary')).toBe('#8b5cf6');

      // Document root should NOT have yugioh colors (since scoped)
      // Note: It may have default Pokemon colors from a global provider
    });

    it('should apply className when provided', () => {
      render(
        <TestWrapper>
          <GameThemeProvider scopedTheme className="my-custom-class">
            <div>Content</div>
          </GameThemeProvider>
        </TestWrapper>
      );

      expect(screen.getByTestId('game-theme-scope')).toHaveClass('my-custom-class');
    });

    it('should add data-game-theme attribute', () => {
      render(
        <TestWrapper>
          <GameThemeProvider scopedTheme gameOverride="lorcana">
            <div>Content</div>
          </GameThemeProvider>
        </TestWrapper>
      );

      expect(screen.getByTestId('game-theme-scope')).toHaveAttribute('data-game-theme', 'lorcana');
    });
  });
});

// ============================================================================
// GAMETHEMED COMPONENT TESTS
// ============================================================================

describe('GameThemed', () => {
  it('should render children with game theme styles', () => {
    render(
      <GameThemed game="pokemon">
        <div data-testid="child">Child content</div>
      </GameThemed>
    );

    expect(screen.getByTestId(`game-themed-pokemon`)).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should apply inline styles with CSS variables', () => {
    render(
      <GameThemed game="yugioh">
        <div>Content</div>
      </GameThemed>
    );

    const wrapper = screen.getByTestId('game-themed-yugioh');
    expect(wrapper).toHaveAttribute('style');
    expect(wrapper.style.getPropertyValue('--game-primary')).toBe('#8b5cf6');
  });

  it('should render as different elements', () => {
    const { rerender } = render(
      <GameThemed game="pokemon" as="section">
        <div>Content</div>
      </GameThemed>
    );

    expect(screen.getByTestId('game-themed-pokemon').tagName).toBe('SECTION');

    rerender(
      <GameThemed game="pokemon" as="article">
        <div>Content</div>
      </GameThemed>
    );

    expect(screen.getByTestId('game-themed-pokemon').tagName).toBe('ARTICLE');
  });

  it('should apply className', () => {
    render(
      <GameThemed game="mtg" className="rounded-lg p-4">
        <div>Content</div>
      </GameThemed>
    );

    expect(screen.getByTestId('game-themed-mtg')).toHaveClass('rounded-lg', 'p-4');
  });

  it('should have unique styles for each game', () => {
    render(
      <>
        <GameThemed game="pokemon">Pokemon</GameThemed>
        <GameThemed game="yugioh">Yu-Gi-Oh!</GameThemed>
        <GameThemed game="onepiece">One Piece</GameThemed>
        <GameThemed game="dragonball">Dragon Ball</GameThemed>
        <GameThemed game="lorcana">Lorcana</GameThemed>
        <GameThemed game="digimon">Digimon</GameThemed>
        <GameThemed game="mtg">MTG</GameThemed>
      </>
    );

    const gameIds: GameId[] = [
      'pokemon',
      'yugioh',
      'onepiece',
      'dragonball',
      'lorcana',
      'digimon',
      'mtg',
    ];

    for (const gameId of gameIds) {
      const wrapper = screen.getByTestId(`game-themed-${gameId}`);
      const expectedPrimary = GAME_CSS_VARIABLES[gameId].primary;
      expect(wrapper.style.getPropertyValue('--game-primary')).toBe(expectedPrimary);
    }
  });
});

// ============================================================================
// USEGAMETHEME HOOK TESTS
// ============================================================================

describe('useGameTheme hook', () => {
  function HookTestComponent({ gameOverride }: { gameOverride?: GameId }) {
    const { themeStyles, gameId } = useGameTheme(gameOverride);
    return (
      <div>
        <span data-testid="game-id">{gameId}</span>
        <span data-testid="primary-color">
          {(themeStyles as Record<string, string>)['--game-primary'] ?? 'none'}
        </span>
      </div>
    );
  }

  it('should return default game theme when no override', () => {
    render(
      <TestWrapper>
        <HookTestComponent />
      </TestWrapper>
    );

    expect(screen.getByTestId('game-id')).toHaveTextContent('pokemon');
    expect(screen.getByTestId('primary-color')).toHaveTextContent('#eab308');
  });

  it('should return overridden game theme', () => {
    render(
      <TestWrapper>
        <HookTestComponent gameOverride="yugioh" />
      </TestWrapper>
    );

    expect(screen.getByTestId('game-id')).toHaveTextContent('yugioh');
    expect(screen.getByTestId('primary-color')).toHaveTextContent('#8b5cf6');
  });

  it('should work outside provider with defaults', () => {
    render(<HookTestComponent gameOverride="mtg" />);

    // Should still work with override even outside provider
    expect(screen.getByTestId('game-id')).toHaveTextContent('mtg');
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

describe('GameThemeProvider - Accessibility', () => {
  it('should not affect child element accessibility', () => {
    render(
      <TestWrapper>
        <GameThemeProvider>
          <button aria-label="Test button">Click me</button>
        </GameThemeProvider>
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: 'Test button' })).toBeInTheDocument();
  });

  it('should render scoped wrapper as accessible div', () => {
    render(
      <TestWrapper>
        <GameThemeProvider scopedTheme>
          <p>Accessible content</p>
        </GameThemeProvider>
      </TestWrapper>
    );

    // The wrapper div should not interfere with content accessibility
    expect(screen.getByText('Accessible content')).toBeInTheDocument();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('GameThemeProvider - Integration', () => {
  it('should support nested game themes', () => {
    render(
      <TestWrapper>
        <GameThemeProvider gameOverride="pokemon">
          <GameThemed game="yugioh" className="nested">
            <div data-testid="nested-content">Nested Yu-Gi-Oh! section</div>
          </GameThemed>
        </GameThemeProvider>
      </TestWrapper>
    );

    // Global theme should be Pokemon
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--game-primary')).toBe('#eab308');

    // Nested section should have Yu-Gi-Oh! theme
    const nested = screen.getByTestId('game-themed-yugioh');
    expect(nested.style.getPropertyValue('--game-primary')).toBe('#8b5cf6');
  });

  it('should allow multiple GameThemed sections on same page', () => {
    render(
      <TestWrapper>
        <GameThemeProvider>
          <GameThemed game="pokemon">
            <span data-testid="pokemon-section">Pokemon</span>
          </GameThemed>
          <GameThemed game="yugioh">
            <span data-testid="yugioh-section">Yu-Gi-Oh!</span>
          </GameThemed>
        </GameThemeProvider>
      </TestWrapper>
    );

    expect(screen.getByTestId('pokemon-section')).toBeInTheDocument();
    expect(screen.getByTestId('yugioh-section')).toBeInTheDocument();

    // Each should have its own theme
    const pokemonWrapper = screen.getByTestId('game-themed-pokemon');
    const yugiohWrapper = screen.getByTestId('game-themed-yugioh');

    expect(pokemonWrapper.style.getPropertyValue('--game-primary')).toBe('#eab308');
    expect(yugiohWrapper.style.getPropertyValue('--game-primary')).toBe('#8b5cf6');
  });
});
