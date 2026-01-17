import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FlippableCard, CardFlipModal, ZoomableCardModal } from '../FlippableCard';

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
        draggable={draggable}
        onError={onError}
        onLoad={onLoadingComplete}
        {...props}
      />
    );
  },
}));

// Mock CardBack component to verify it's used
vi.mock('@/components/ui/CardImage', () => ({
  CardBack: ({
    fill,
    sizes,
    className,
  }: {
    fill?: boolean;
    sizes?: string;
    className?: string;
  }) => (
    <img
      src="https://images.pokemontcg.io/cardback.png"
      alt="Card back"
      className={className}
      data-fill={fill}
      data-sizes={sizes}
      data-testid="card-back"
    />
  ),
}));

describe('FlippableCard', () => {
  const testProps = {
    frontImage: 'https://example.com/card.png',
    cardName: 'Test Pokemon Card',
  };

  it('renders the front image correctly', () => {
    render(<FlippableCard {...testProps} />);

    const frontImage = screen.getByAltText('Test Pokemon Card');
    expect(frontImage).toHaveAttribute('src', testProps.frontImage);
  });

  it('renders the CardBack component for the back of the card', () => {
    render(<FlippableCard {...testProps} />);

    const cardBack = screen.getByTestId('card-back');
    expect(cardBack).toBeInTheDocument();
    expect(cardBack).toHaveAttribute('src', 'https://images.pokemontcg.io/cardback.png');
  });

  it('has correct aria-label for accessibility', () => {
    render(<FlippableCard {...testProps} />);

    const cardButton = screen.getByRole('button');
    expect(cardButton).toHaveAttribute(
      'aria-label',
      'Test Pokemon Card, press F or tap to flip card. Currently showing front'
    );
  });

  it('calls onFlip when card is clicked', () => {
    const onFlip = vi.fn();
    render(<FlippableCard {...testProps} onFlip={onFlip} />);

    const cardButton = screen.getByRole('button');
    fireEvent.click(cardButton);

    expect(onFlip).toHaveBeenCalledWith(true);
  });

  it('flips when F key is pressed', () => {
    const onFlip = vi.fn();
    render(<FlippableCard {...testProps} onFlip={onFlip} />);

    const cardButton = screen.getByRole('button');
    fireEvent.keyDown(cardButton, { key: 'f' });

    expect(onFlip).toHaveBeenCalledWith(true);
  });

  it('does not flip when disableFlip is true', () => {
    const onFlip = vi.fn();
    render(<FlippableCard {...testProps} onFlip={onFlip} disableFlip />);

    const cardButton = screen.getByRole('button');
    fireEvent.click(cardButton);

    expect(onFlip).not.toHaveBeenCalled();
  });

  it('supports controlled flip state', () => {
    const { rerender } = render(<FlippableCard {...testProps} isFlipped={false} />);

    let cardButton = screen.getByRole('button');
    expect(cardButton).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Currently showing front')
    );

    rerender(<FlippableCard {...testProps} isFlipped={true} />);
    cardButton = screen.getByRole('button');
    expect(cardButton).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Currently showing back')
    );
  });

  it('renders children overlay on front of card', () => {
    render(
      <FlippableCard {...testProps}>
        <div data-testid="overlay">Overlay Content</div>
      </FlippableCard>
    );

    expect(screen.getByTestId('overlay')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<FlippableCard {...testProps} className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('CardFlipModal', () => {
  const testProps = {
    frontImage: 'https://example.com/card.png',
    cardName: 'Test Pokemon Card',
    isOpen: true,
    onClose: vi.fn(),
  };

  it('renders when isOpen is true', () => {
    render(<CardFlipModal {...testProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByAltText('Test Pokemon Card')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<CardFlipModal {...testProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<CardFlipModal {...testProps} onClose={onClose} />);

    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<CardFlipModal {...testProps} onClose={onClose} />);

    const closeButton = screen.getByLabelText('Close card viewer');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('has correct aria attributes for accessibility', () => {
    render(<CardFlipModal {...testProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Test Pokemon Card card viewer');
  });

  it('uses CardBack component for card back image', () => {
    render(<CardFlipModal {...testProps} />);

    expect(screen.getByTestId('card-back')).toBeInTheDocument();
  });

  it('shows flip instructions', () => {
    render(<CardFlipModal {...testProps} />);

    expect(screen.getByText(/Tap card or press/)).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
  });
});

describe('ZoomableCardModal', () => {
  const testProps = {
    frontImage: 'https://example.com/card.png',
    cardName: 'Test Pokemon Card',
    isOpen: true,
    onClose: vi.fn(),
  };

  it('renders when isOpen is true', () => {
    render(<ZoomableCardModal {...testProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ZoomableCardModal {...testProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has correct aria attributes for accessibility', () => {
    render(<ZoomableCardModal {...testProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Test Pokemon Card card viewer with zoom');
  });

  it('uses CardBack component for card back image', () => {
    render(<ZoomableCardModal {...testProps} />);

    expect(screen.getByTestId('card-back')).toBeInTheDocument();
  });

  it('shows zoom controls', () => {
    render(<ZoomableCardModal {...testProps} />);

    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset zoom')).toBeInTheDocument();
  });

  it('shows zoom percentage', () => {
    render(<ZoomableCardModal {...testProps} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ZoomableCardModal {...testProps} onClose={onClose} />);

    const closeButton = screen.getByLabelText('Close card viewer');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('zooms in when zoom in button is clicked', async () => {
    render(<ZoomableCardModal {...testProps} />);

    const zoomInButton = screen.getByLabelText('Zoom in');
    fireEvent.click(zoomInButton);

    await waitFor(() => {
      expect(screen.getByText('150%')).toBeInTheDocument();
    });
  });

  it('shows keyboard shortcuts', () => {
    render(<ZoomableCardModal {...testProps} />);

    // Keyboard shortcuts hint
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Esc')).toBeInTheDocument();
  });
});
