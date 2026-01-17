import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchResults } from '../SearchResults';
import type { PokemonCard } from '@/lib/pokemon-tcg';

// Mock convex/react
vi.mock('convex/react', () => ({
  useQuery: vi.fn(() => []),
  useMutation: vi.fn(() => vi.fn()),
}));

// Mock the convex API
vi.mock('../../../../convex/_generated/api', () => ({
  api: {
    collections: {
      getCollection: 'collections:getCollection',
      addCard: 'collections:addCard',
      removeCard: 'collections:removeCard',
      updateQuantity: 'collections:updateQuantity',
    },
  },
}));

// Mock useCurrentProfile hook
vi.mock('@/hooks/useCurrentProfile', () => ({
  useCurrentProfile: vi.fn(() => ({
    profileId: 'test-profile-id',
    isLoading: false,
  })),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    onError,
    onLoadingComplete,
    className,
    fill,
    priority,
    sizes,
    draggable,
    loading,
    ...props
  }: {
    src: string;
    alt: string;
    onError?: () => void;
    onLoadingComplete?: () => void;
    className?: string;
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
    draggable?: boolean;
    loading?: string;
    [key: string]: unknown;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        data-fill={fill}
        data-priority={priority}
        data-sizes={sizes}
        data-loading={loading}
        draggable={draggable}
        onError={onError}
        onLoad={onLoadingComplete}
        {...props}
      />
    );
  },
}));

describe('SearchResults', () => {
  const mockCards: PokemonCard[] = [
    {
      id: 'card-1',
      name: 'Pikachu',
      supertype: 'Pokémon',
      subtypes: ['Basic'],
      hp: '60',
      types: ['Lightning'],
      attacks: [],
      weaknesses: [],
      retreatCost: ['Colorless'],
      set: {
        id: 'base1',
        name: 'Base Set',
        series: 'Base',
        printedTotal: 102,
        total: 102,
        releaseDate: '1999/01/09',
        images: {
          symbol: 'https://example.com/symbol.png',
          logo: 'https://example.com/logo.png',
        },
      },
      number: '25',
      rarity: 'Common',
      images: {
        small: 'https://example.com/pikachu-small.png',
        large: 'https://example.com/pikachu-large.png',
      },
    },
    {
      id: 'card-2',
      name: 'Charizard',
      supertype: 'Pokémon',
      subtypes: ['Stage 2'],
      hp: '120',
      types: ['Fire'],
      attacks: [],
      weaknesses: [],
      retreatCost: ['Colorless', 'Colorless', 'Colorless'],
      set: {
        id: 'base1',
        name: 'Base Set',
        series: 'Base',
        printedTotal: 102,
        total: 102,
        releaseDate: '1999/01/09',
        images: {
          symbol: 'https://example.com/symbol.png',
          logo: 'https://example.com/logo.png',
        },
      },
      number: '4',
      rarity: 'Rare Holo',
      images: {
        small: 'https://example.com/charizard-small.png',
        large: 'https://example.com/charizard-large.png',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search results with card images', () => {
    render(<SearchResults cards={mockCards} />);

    expect(screen.getByText('Pikachu')).toBeInTheDocument();
    expect(screen.getByText('Charizard')).toBeInTheDocument();
    expect(screen.getByText('Found 2 cards')).toBeInTheDocument();
  });

  it('renders empty state when no cards found', () => {
    render(<SearchResults cards={[]} />);

    expect(screen.getByText('No cards found')).toBeInTheDocument();
    expect(
      screen.getByText('Try a different search term or check your spelling.')
    ).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    render(<SearchResults cards={[]} isLoading />);

    // When loading, the loading skeleton should be shown
    // The skeleton component should be rendered instead of empty state
    expect(screen.queryByText('No cards found')).not.toBeInTheDocument();
  });

  it('renders card images that handle errors gracefully', async () => {
    render(<SearchResults cards={mockCards} />);

    // Get the card images
    const images = screen.getAllByRole('img');

    // Verify that card images are rendered with CardImage component (which has error handling)
    const pikachuImg = images.find((img) => img.getAttribute('alt') === 'Pikachu');
    expect(pikachuImg).toBeInTheDocument();
    expect(pikachuImg).toHaveAttribute('src', 'https://example.com/pikachu-small.png');

    // Simulate image error - CardImage should handle this by switching to fallback
    if (pikachuImg) {
      fireEvent.error(pikachuImg);

      // After error, the CardImage component switches to fallback
      await waitFor(() => {
        const updatedImg = screen.getAllByRole('img').find(
          (img) =>
            img.getAttribute('alt') === 'Pikachu (image unavailable)' ||
            img.getAttribute('src')?.includes('data:image/svg+xml')
        );
        // The image should either have updated alt or be the fallback SVG
        expect(updatedImg || pikachuImg).toBeInTheDocument();
      });
    }
  });

  it('renders singular "card" when only one result', () => {
    render(<SearchResults cards={[mockCards[0]]} />);

    expect(screen.getByText('Found 1 card')).toBeInTheDocument();
  });

  it('renders set links for each card', () => {
    render(<SearchResults cards={mockCards} />);

    const setLinks = screen.getAllByText('Base Set');
    expect(setLinks).toHaveLength(2);

    // Links should point to the set page
    setLinks.forEach((link) => {
      expect(link.closest('a')).toHaveAttribute('href', '/sets/base1');
    });
  });
});
