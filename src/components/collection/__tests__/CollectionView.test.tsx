import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

// Mock CardDetailModal to verify it's being rendered
const mockCardDetailModal = vi.fn();
vi.mock('../CardDetailModal', () => ({
  CardDetailModal: (props: {
    card: unknown;
    isOpen: boolean;
    onClose: () => void;
    onPrevious?: () => void;
    onNext?: () => void;
    hasPrevious?: boolean;
    hasNext?: boolean;
  }) => {
    mockCardDetailModal(props);
    if (!props.isOpen || !props.card) return null;
    return (
      <div data-testid="card-detail-modal" role="dialog" aria-modal="true">
        <button onClick={props.onClose} data-testid="close-modal-btn">
          Close
        </button>
        {props.hasPrevious && props.onPrevious && (
          <button onClick={props.onPrevious} data-testid="prev-card-btn">
            Previous
          </button>
        )}
        {props.hasNext && props.onNext && (
          <button onClick={props.onNext} data-testid="next-card-btn">
            Next
          </button>
        )}
        <span data-testid="modal-card-name">{(props.card as { name: string }).name}</span>
      </div>
    );
  },
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
      // Should show x3 badge for the card with quantity 3 in the grid
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

  describe('cardData Map memoization', () => {
    it('renders collection value based on card data', async () => {
      const collection = [
        { _id: '1', cardId: 'sv1-1', quantity: 1 },
        { _id: '2', cardId: 'sv1-2', quantity: 2 },
      ];

      render(<CollectionView collection={collection} />);

      // Wait for the data to load and calculate collection value
      await waitFor(() => {
        // Pikachu ($1.50 x 1) + Charmander ($2.00 x 2) = $5.50
        expect(screen.getByText('$5.50')).toBeInTheDocument();
      });
    });

    it('correctly groups cards by set using memoized data', async () => {
      const collection = [
        { _id: '1', cardId: 'sv1-1', quantity: 1 },
        { _id: '2', cardId: 'sv1-2', quantity: 2 },
      ];

      render(<CollectionView collection={collection} />);

      await waitFor(() => {
        // Should show set name with card count
        expect(screen.getByText('Scarlet & Violet')).toBeInTheDocument();
        // Should show the count of unique cards and total
        expect(screen.getByText('2 unique cards (3 total)')).toBeInTheDocument();
      });
    });

    it('displays collection value banner with total value', async () => {
      const collection = [
        { _id: '1', cardId: 'sv1-1', quantity: 1 },
        { _id: '2', cardId: 'sv1-2', quantity: 2 },
      ];

      render(<CollectionView collection={collection} />);

      await waitFor(() => {
        // Should show total collection value in the value banner
        // Pikachu ($1.50 x 1) + Charmander ($2.00 x 2) = $5.50
        expect(screen.getByText('$5.50')).toBeInTheDocument();
        // Should show cards priced count
        expect(screen.getByText(/2 cards priced/)).toBeInTheDocument();
      });
    });

    it('does not fetch when collection is empty', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      render(<CollectionView collection={[]} />);

      await waitFor(() => {
        expect(fetchSpy).not.toHaveBeenCalled();
      });
    });

    it('fetches card data only once for a given collection', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');

      const collection = [
        { _id: '1', cardId: 'sv1-1', quantity: 1 },
        { _id: '2', cardId: 'sv1-2', quantity: 2 },
      ];

      render(<CollectionView collection={collection} />);

      await waitFor(() => {
        expect(screen.getAllByTestId('card-image').length).toBeGreaterThan(0);
      });

      // Fetch should have been called exactly once
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Card click to view details', () => {
    beforeEach(() => {
      mockCardDetailModal.mockClear();
    });

    it('renders cards as clickable buttons with accessible labels', async () => {
      const collection = [
        { _id: '1', cardId: 'sv1-1', quantity: 1 },
        { _id: '2', cardId: 'sv1-2', quantity: 2 },
      ];

      render(<CollectionView collection={collection} />);

      await waitFor(() => {
        // Check that Pikachu card has an accessible label
        const pikachuButton = screen.getByRole('button', { name: /view pikachu details/i });
        expect(pikachuButton).toBeInTheDocument();

        // Check that Charmander card has an accessible label
        const charmanderButton = screen.getByRole('button', { name: /view charmander details/i });
        expect(charmanderButton).toBeInTheDocument();
      });
    });

    it('opens card detail modal when clicking a card', async () => {
      const collection = [
        { _id: '1', cardId: 'sv1-1', quantity: 1 },
        { _id: '2', cardId: 'sv1-2', quantity: 2 },
      ];

      render(<CollectionView collection={collection} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view pikachu details/i })).toBeInTheDocument();
      });

      // Click on Pikachu card
      const pikachuButton = screen.getByRole('button', { name: /view pikachu details/i });
      fireEvent.click(pikachuButton);

      // Modal should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('card-detail-modal')).toBeInTheDocument();
        expect(screen.getByTestId('modal-card-name')).toHaveTextContent('Pikachu');
      });
    });

    it('closes modal when close button is clicked', async () => {
      const collection = [{ _id: '1', cardId: 'sv1-1', quantity: 1 }];

      render(<CollectionView collection={collection} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view pikachu details/i })).toBeInTheDocument();
      });

      // Open modal
      fireEvent.click(screen.getByRole('button', { name: /view pikachu details/i }));

      await waitFor(() => {
        expect(screen.getByTestId('card-detail-modal')).toBeInTheDocument();
      });

      // Close modal
      fireEvent.click(screen.getByTestId('close-modal-btn'));

      await waitFor(() => {
        expect(screen.queryByTestId('card-detail-modal')).not.toBeInTheDocument();
      });
    });

    it('shows navigation buttons when multiple cards exist', async () => {
      const collection = [
        { _id: '1', cardId: 'sv1-1', quantity: 1 },
        { _id: '2', cardId: 'sv1-2', quantity: 2 },
      ];

      render(<CollectionView collection={collection} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view pikachu details/i })).toBeInTheDocument();
      });

      // Click on Pikachu (first card)
      fireEvent.click(screen.getByRole('button', { name: /view pikachu details/i }));

      await waitFor(() => {
        // First card should have "next" but not "previous"
        expect(screen.queryByTestId('prev-card-btn')).not.toBeInTheDocument();
        expect(screen.getByTestId('next-card-btn')).toBeInTheDocument();
      });
    });

    it('navigates to next card when clicking next button', async () => {
      const collection = [
        { _id: '1', cardId: 'sv1-1', quantity: 1 },
        { _id: '2', cardId: 'sv1-2', quantity: 2 },
      ];

      render(<CollectionView collection={collection} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view pikachu details/i })).toBeInTheDocument();
      });

      // Click on Pikachu (first card)
      fireEvent.click(screen.getByRole('button', { name: /view pikachu details/i }));

      await waitFor(() => {
        expect(screen.getByTestId('modal-card-name')).toHaveTextContent('Pikachu');
      });

      // Click next
      fireEvent.click(screen.getByTestId('next-card-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('modal-card-name')).toHaveTextContent('Charmander');
      });
    });

    it('navigates to previous card when clicking previous button', async () => {
      const collection = [
        { _id: '1', cardId: 'sv1-1', quantity: 1 },
        { _id: '2', cardId: 'sv1-2', quantity: 2 },
      ];

      render(<CollectionView collection={collection} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /view charmander details/i })
        ).toBeInTheDocument();
      });

      // Click on Charmander (second card)
      fireEvent.click(screen.getByRole('button', { name: /view charmander details/i }));

      await waitFor(() => {
        expect(screen.getByTestId('modal-card-name')).toHaveTextContent('Charmander');
        expect(screen.getByTestId('prev-card-btn')).toBeInTheDocument();
      });

      // Click previous
      fireEvent.click(screen.getByTestId('prev-card-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('modal-card-name')).toHaveTextContent('Pikachu');
      });
    });

    it('cards have visible magnifying glass icon on hover (via CSS)', async () => {
      const collection = [{ _id: '1', cardId: 'sv1-1', quantity: 1 }];

      render(<CollectionView collection={collection} />);

      await waitFor(() => {
        // The card button should exist
        const cardButton = screen.getByRole('button', { name: /view pikachu details/i });
        expect(cardButton).toBeInTheDocument();

        // The button should have group class for hover functionality
        expect(cardButton).toHaveClass('group');
      });
    });

    it('cards have focus ring styling for keyboard navigation', async () => {
      const collection = [{ _id: '1', cardId: 'sv1-1', quantity: 1 }];

      render(<CollectionView collection={collection} />);

      await waitFor(() => {
        const cardButton = screen.getByRole('button', { name: /view pikachu details/i });
        // Check that the card has focus styling classes
        expect(cardButton.className).toContain('focus:ring');
        expect(cardButton.className).toContain('focus:outline-none');
      });
    });
  });
});
