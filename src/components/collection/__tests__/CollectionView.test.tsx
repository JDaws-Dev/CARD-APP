import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CollectionView } from '../CollectionView';

// Mock the CardImage component to verify it's being used
vi.mock('@/components/ui/CardImage', () => ({
  CardImage: ({
    src,
    alt,
    fill,
    sizes,
    loading,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    sizes?: string;
    loading?: 'lazy' | 'eager';
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-testid="card-image"
      data-fill={fill}
      data-sizes={sizes}
      data-loading={loading}
    />
  ),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock the DigitalBinder components
vi.mock('@/components/virtual/DigitalBinder', () => ({
  DigitalBinder: () => null,
  DigitalBinderButton: () => <button>Open Binder</button>,
}));

// Mock RandomCardButton
vi.mock('../RandomCardButton', () => ({
  RandomCardButton: () => <button>Random Card</button>,
}));

// Mock the fetch API
const mockCards = [
  {
    id: 'sv1-1',
    name: 'Pikachu',
    number: '1',
    set: { id: 'sv1', name: 'Scarlet & Violet' },
    images: { small: 'https://example.com/pikachu.png' },
    tcgplayer: { prices: { normal: { market: 1.5 } } },
  },
  {
    id: 'sv1-2',
    name: 'Charmander',
    number: '2',
    set: { id: 'sv1', name: 'Scarlet & Violet' },
    images: { small: 'https://example.com/charmander.png' },
    tcgplayer: { prices: { normal: { market: 2.0 } } },
  },
];

describe('CollectionView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockCards }),
    });
  });

  it('uses CardImage component for card images in the grid', async () => {
    const collection = [
      { _id: '1', cardId: 'sv1-1', quantity: 1 },
      { _id: '2', cardId: 'sv1-2', quantity: 2 },
    ];

    render(<CollectionView collection={collection} />);

    await waitFor(() => {
      const cardImages = screen.getAllByTestId('card-image');
      expect(cardImages.length).toBeGreaterThan(0);
    });
  });

  it('renders card images with fill mode', async () => {
    const collection = [{ _id: '1', cardId: 'sv1-1', quantity: 1 }];

    render(<CollectionView collection={collection} />);

    await waitFor(() => {
      const cardImages = screen.getAllByTestId('card-image');
      cardImages.forEach((img) => {
        expect(img).toHaveAttribute('data-fill', 'true');
      });
    });
  });

  it('shows empty state when collection is empty', async () => {
    render(<CollectionView collection={[]} />);

    // With an empty collection, no API call should be made
    // and no cards should be rendered
    await waitFor(() => {
      expect(screen.queryByTestId('card-image')).not.toBeInTheDocument();
    });
  });

  it('renders quantity badges for cards with quantity > 1', async () => {
    const collection = [
      { _id: '1', cardId: 'sv1-1', quantity: 1 },
      { _id: '2', cardId: 'sv1-2', quantity: 3 },
    ];

    render(<CollectionView collection={collection} />);

    await waitFor(() => {
      // Should show x3 badges for the card with quantity 3
      // (appears in both "Most Valuable Cards" section and the grid)
      const badges = screen.getAllByText('x3');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('uses lazy loading for card images to improve performance', async () => {
    const collection = [
      { _id: '1', cardId: 'sv1-1', quantity: 1 },
      { _id: '2', cardId: 'sv1-2', quantity: 2 },
    ];

    render(<CollectionView collection={collection} />);

    await waitFor(() => {
      const cardImages = screen.getAllByTestId('card-image');
      expect(cardImages.length).toBeGreaterThan(0);
      // All card images should use lazy loading for performance optimization
      cardImages.forEach((img) => {
        expect(img).toHaveAttribute('data-loading', 'lazy');
      });
    });
  });
});
