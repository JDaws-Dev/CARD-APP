import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardDetailModal } from '../CardDetailModal';

// Mock the CardImage component
vi.mock('@/components/ui/CardImage', () => ({
  CardImage: ({
    src,
    alt,
    fill,
    sizes,
    priority,
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    sizes?: string;
    priority?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-testid="card-image"
      data-fill={fill}
      data-sizes={sizes}
      data-priority={priority}
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

const mockCard = {
  id: 'sv1-1',
  name: 'Pikachu',
  number: '25',
  supertype: 'Pokémon',
  rarity: 'Common',
  types: ['Lightning'],
  set: {
    id: 'sv1',
    name: 'Scarlet & Violet',
    images: { symbol: 'https://example.com/symbol.png' },
  },
  images: {
    small: 'https://example.com/pikachu-small.png',
    large: 'https://example.com/pikachu-large.png',
  },
  tcgplayer: {
    prices: {
      normal: { market: 1.5 },
      holofoil: { market: 5.99 },
      reverseHolofoil: { market: 3.25 },
    },
  },
  quantity: 2,
  collectionId: 'collection-1',
};

describe('CardDetailModal', () => {
  const defaultProps = {
    card: mockCard,
    isOpen: true,
    onClose: vi.fn(),
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    hasPrevious: true,
    hasNext: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset body overflow style
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      render(<CardDetailModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders nothing when card is null', () => {
      render(<CardDetailModal {...defaultProps} card={null} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders modal when isOpen is true and card is provided', () => {
      render(<CardDetailModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays card name in modal', () => {
      render(<CardDetailModal {...defaultProps} />);
      expect(screen.getByText('Pikachu')).toBeInTheDocument();
    });

    it('displays set name with link to set page', () => {
      render(<CardDetailModal {...defaultProps} />);
      const setLink = screen.getByText('Scarlet & Violet');
      expect(setLink.closest('a')).toHaveAttribute('href', '/sets/sv1');
    });

    it('displays card number', () => {
      render(<CardDetailModal {...defaultProps} />);
      expect(screen.getByText('#25')).toBeInTheDocument();
    });

    it('displays card rarity', () => {
      render(<CardDetailModal {...defaultProps} />);
      expect(screen.getByText('Common')).toBeInTheDocument();
    });

    it('displays card supertype', () => {
      render(<CardDetailModal {...defaultProps} />);
      expect(screen.getByText('Pokémon')).toBeInTheDocument();
    });

    it('displays card energy types', () => {
      render(<CardDetailModal {...defaultProps} />);
      expect(screen.getByText('Lightning')).toBeInTheDocument();
    });

    it('uses high-res (large) image when available', () => {
      render(<CardDetailModal {...defaultProps} />);
      const cardImage = screen.getByTestId('card-image');
      expect(cardImage).toHaveAttribute('src', 'https://example.com/pikachu-large.png');
    });

    it('falls back to small image when large is not available', () => {
      const cardWithoutLarge = {
        ...mockCard,
        images: { small: 'https://example.com/small.png' },
      };
      render(<CardDetailModal {...defaultProps} card={cardWithoutLarge} />);
      const cardImage = screen.getByTestId('card-image');
      expect(cardImage).toHaveAttribute('src', 'https://example.com/small.png');
    });

    it('displays quantity badge when quantity > 1', () => {
      render(<CardDetailModal {...defaultProps} />);
      expect(screen.getByText('x2')).toBeInTheDocument();
    });

    it('does not display quantity badge when quantity is 1', () => {
      const cardWithQuantity1 = { ...mockCard, quantity: 1 };
      render(<CardDetailModal {...defaultProps} card={cardWithQuantity1} />);
      expect(screen.queryByText('x1')).not.toBeInTheDocument();
    });

    it('displays market prices for all variants', () => {
      render(<CardDetailModal {...defaultProps} />);
      expect(screen.getByText('Normal: $1.50')).toBeInTheDocument();
      expect(screen.getByText('Holo: $5.99')).toBeInTheDocument();
      expect(screen.getByText('Reverse: $3.25')).toBeInTheDocument();
    });

    it('displays "View in Set" link', () => {
      render(<CardDetailModal {...defaultProps} />);
      const viewInSetLink = screen.getByText('View in Set');
      expect(viewInSetLink.closest('a')).toHaveAttribute('href', '/sets/sv1');
    });
  });

  describe('Navigation', () => {
    it('shows previous button when hasPrevious is true', () => {
      render(<CardDetailModal {...defaultProps} hasPrevious={true} />);
      expect(screen.getByRole('button', { name: /previous card/i })).toBeInTheDocument();
    });

    it('hides previous button when hasPrevious is false', () => {
      render(<CardDetailModal {...defaultProps} hasPrevious={false} />);
      expect(screen.queryByRole('button', { name: /previous card/i })).not.toBeInTheDocument();
    });

    it('shows next button when hasNext is true', () => {
      render(<CardDetailModal {...defaultProps} hasNext={true} />);
      expect(screen.getByRole('button', { name: /next card/i })).toBeInTheDocument();
    });

    it('hides next button when hasNext is false', () => {
      render(<CardDetailModal {...defaultProps} hasNext={false} />);
      expect(screen.queryByRole('button', { name: /next card/i })).not.toBeInTheDocument();
    });

    it('calls onPrevious when previous button is clicked', () => {
      render(<CardDetailModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /previous card/i }));
      expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
    });

    it('calls onNext when next button is clicked', () => {
      render(<CardDetailModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /next card/i }));
      expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
    });

    it('does not close modal when clicking previous/next buttons', () => {
      render(<CardDetailModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /previous card/i }));
      expect(defaultProps.onClose).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: /next card/i }));
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Closing modal', () => {
    it('calls onClose when close button is clicked', () => {
      render(<CardDetailModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking backdrop', () => {
      render(<CardDetailModal {...defaultProps} />);

      // Click the backdrop (the outermost dialog element)
      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when clicking modal content', () => {
      render(<CardDetailModal {...defaultProps} />);

      // Click on the card name (inside modal content)
      fireEvent.click(screen.getByText('Pikachu'));
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard navigation', () => {
    it('closes modal when ESC key is pressed', () => {
      render(<CardDetailModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onPrevious when left arrow is pressed and hasPrevious', () => {
      render(<CardDetailModal {...defaultProps} hasPrevious={true} />);

      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
    });

    it('does not call onPrevious when left arrow is pressed and no hasPrevious', () => {
      render(<CardDetailModal {...defaultProps} hasPrevious={false} />);

      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      expect(defaultProps.onPrevious).not.toHaveBeenCalled();
    });

    it('calls onNext when right arrow is pressed and hasNext', () => {
      render(<CardDetailModal {...defaultProps} hasNext={true} />);

      fireEvent.keyDown(document, { key: 'ArrowRight' });
      expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
    });

    it('does not call onNext when right arrow is pressed and no hasNext', () => {
      render(<CardDetailModal {...defaultProps} hasNext={false} />);

      fireEvent.keyDown(document, { key: 'ArrowRight' });
      expect(defaultProps.onNext).not.toHaveBeenCalled();
    });

    it('ignores keyboard events when modal is closed', () => {
      render(<CardDetailModal {...defaultProps} isOpen={false} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(defaultProps.onClose).not.toHaveBeenCalled();

      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      expect(defaultProps.onPrevious).not.toHaveBeenCalled();

      fireEvent.keyDown(document, { key: 'ArrowRight' });
      expect(defaultProps.onNext).not.toHaveBeenCalled();
    });
  });

  describe('Body scroll lock', () => {
    it('locks body scroll when modal opens', () => {
      render(<CardDetailModal {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('unlocks body scroll when modal closes', () => {
      const { rerender } = render(<CardDetailModal {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<CardDetailModal {...defaultProps} isOpen={false} />);
      expect(document.body.style.overflow).toBe('');
    });

    it('cleans up body scroll on unmount', () => {
      const { unmount } = render(<CardDetailModal {...defaultProps} isOpen={true} />);
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog role and aria attributes', () => {
      render(<CardDetailModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-label', 'Pikachu card details');
    });

    it('close button has accessible label', () => {
      render(<CardDetailModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
    });

    it('navigation buttons have accessible labels', () => {
      render(<CardDetailModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /previous card/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next card/i })).toBeInTheDocument();
    });

    it('displays keyboard hint for navigation', () => {
      render(<CardDetailModal {...defaultProps} />);
      expect(screen.getByText(/use arrow keys to navigate/i)).toBeInTheDocument();
      expect(screen.getByText(/esc to close/i)).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles card without rarity', () => {
      const cardWithoutRarity = { ...mockCard, rarity: undefined };
      render(<CardDetailModal {...defaultProps} card={cardWithoutRarity} />);
      expect(screen.queryByText('Rarity:')).not.toBeInTheDocument();
    });

    it('handles card without supertype', () => {
      const cardWithoutSupertype = { ...mockCard, supertype: undefined };
      render(<CardDetailModal {...defaultProps} card={cardWithoutSupertype} />);
      expect(screen.queryByText('Type:')).not.toBeInTheDocument();
    });

    it('handles card without types', () => {
      const cardWithoutTypes = { ...mockCard, types: [] };
      render(<CardDetailModal {...defaultProps} card={cardWithoutTypes} />);
      expect(screen.queryByText('Energy:')).not.toBeInTheDocument();
    });

    it('handles card without tcgplayer prices', () => {
      const cardWithoutPrices = { ...mockCard, tcgplayer: undefined };
      render(<CardDetailModal {...defaultProps} card={cardWithoutPrices} />);
      expect(screen.queryByText('Market Value:')).not.toBeInTheDocument();
    });

    it('handles card without set symbol image', () => {
      const cardWithoutSymbol = {
        ...mockCard,
        set: { id: 'sv1', name: 'Scarlet & Violet', images: {} },
      };
      render(<CardDetailModal {...defaultProps} card={cardWithoutSymbol} />);
      // Should still render set name link
      expect(screen.getByText('Scarlet & Violet')).toBeInTheDocument();
    });
  });
});
