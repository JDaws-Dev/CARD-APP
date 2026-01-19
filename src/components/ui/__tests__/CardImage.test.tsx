import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CardImage, CardBack, CARD_BACK_URL } from '../CardImage';

// Mock next/image since it's not available in test environment
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
        onError={onError}
        onLoad={onLoadingComplete}
        {...props}
      />
    );
  },
}));

describe('CardImage', () => {
  const testSrc = 'https://example.com/card.png';
  const testAlt = 'Test Card';

  it('renders with the correct src and alt', () => {
    render(<CardImage src={testSrc} alt={testAlt} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', testSrc);
    expect(img).toHaveAttribute('alt', testAlt);
  });

  it('renders in fill mode when specified', () => {
    render(<CardImage src={testSrc} alt={testAlt} fill />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('data-fill', 'true');
  });

  it('renders with fixed dimensions when not using fill', () => {
    render(<CardImage src={testSrc} alt={testAlt} width={100} height={140} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '100');
    expect(img).toHaveAttribute('height', '140');
  });

  it('uses default dimensions when not specified', () => {
    render(<CardImage src={testSrc} alt={testAlt} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '250');
    expect(img).toHaveAttribute('height', '350');
  });

  it('switches to fallback image on error', async () => {
    render(<CardImage src={testSrc} alt={testAlt} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', testSrc);

    // Trigger error
    fireEvent.error(img);

    await waitFor(() => {
      const updatedImg = screen.getByRole('img');
      expect(updatedImg).toHaveAttribute('alt', `${testAlt} (image unavailable)`);
      // Source should be the fallback data URL
      expect(updatedImg.getAttribute('src')).toContain('data:image/svg+xml');
    });
  });

  it('uses custom fallback when provided', async () => {
    const customFallback = 'https://example.com/fallback.png';
    render(<CardImage src={testSrc} alt={testAlt} fallbackSrc={customFallback} />);

    const img = screen.getByRole('img');
    fireEvent.error(img);

    await waitFor(() => {
      expect(screen.getByRole('img')).toHaveAttribute('src', customFallback);
    });
  });

  it('calls onError callback when image fails', async () => {
    const onError = vi.fn();
    render(<CardImage src={testSrc} alt={testAlt} onError={onError} />);

    fireEvent.error(screen.getByRole('img'));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onLoad callback when image loads', async () => {
    const onLoad = vi.fn();
    render(<CardImage src={testSrc} alt={testAlt} onLoad={onLoad} />);

    fireEvent.load(screen.getByRole('img'));

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call onLoad when image has error', async () => {
    const onLoad = vi.fn();
    render(<CardImage src={testSrc} alt={testAlt} onLoad={onLoad} />);

    const img = screen.getByRole('img');
    fireEvent.error(img);
    fireEvent.load(img);

    await waitFor(() => {
      // onLoad should not be called after an error
      expect(onLoad).not.toHaveBeenCalled();
    });
  });

  it('applies custom className', () => {
    render(<CardImage src={testSrc} alt={testAlt} className="custom-class" />);

    const img = screen.getByRole('img');
    expect(img).toHaveClass('custom-class');
  });

  it('sets draggable attribute correctly', () => {
    const { rerender } = render(<CardImage src={testSrc} alt={testAlt} draggable={false} />);
    expect(screen.getByRole('img')).toHaveAttribute('draggable', 'false');

    rerender(<CardImage src={testSrc} alt={testAlt} draggable={true} />);
    expect(screen.getByRole('img')).toHaveAttribute('draggable', 'true');
  });

  it('updates image when src prop changes (navigation between cards)', async () => {
    const firstSrc = 'https://example.com/card1.png';
    const secondSrc = 'https://example.com/card2.png';

    const { rerender } = render(<CardImage src={firstSrc} alt="First Card" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', firstSrc);

    // Simulate navigating to a different card
    rerender(<CardImage src={secondSrc} alt="Second Card" />);

    await waitFor(() => {
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', secondSrc);
      expect(img).toHaveAttribute('alt', 'Second Card');
    });
  });

  it('resets error state when src prop changes to new value', async () => {
    const firstSrc = 'https://example.com/card1.png';
    const secondSrc = 'https://example.com/card2.png';

    const { rerender } = render(<CardImage src={firstSrc} alt="First Card" />);

    // Trigger error on first card
    fireEvent.error(screen.getByRole('img'));

    await waitFor(() => {
      // Image should now be showing fallback
      expect(screen.getByRole('img').getAttribute('src')).toContain('data:image/svg+xml');
    });

    // Navigate to a different card
    rerender(<CardImage src={secondSrc} alt="Second Card" />);

    await waitFor(() => {
      // Error state should be reset and new image should load
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', secondSrc);
      expect(img).toHaveAttribute('alt', 'Second Card');
    });
  });

  it('immediately shows fallback for empty src string', () => {
    render(<CardImage src="" alt="Empty Card" />);

    const img = screen.getByRole('img');
    // Should immediately use fallback, not empty string
    expect(img.getAttribute('src')).toContain('data:image/svg+xml');
    // Should mark as unavailable
    expect(img).toHaveAttribute('alt', 'Empty Card (image unavailable)');
  });

  it('immediately shows fallback for whitespace-only src string', () => {
    render(<CardImage src="   " alt="Whitespace Card" />);

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toContain('data:image/svg+xml');
    expect(img).toHaveAttribute('alt', 'Whitespace Card (image unavailable)');
  });

  it('transitions from valid src to empty src correctly', async () => {
    const validSrc = 'https://example.com/card.png';
    const { rerender } = render(<CardImage src={validSrc} alt="Card" />);

    expect(screen.getByRole('img')).toHaveAttribute('src', validSrc);

    // Rerender with empty src
    rerender(<CardImage src="" alt="Card" />);

    await waitFor(() => {
      const img = screen.getByRole('img');
      expect(img.getAttribute('src')).toContain('data:image/svg+xml');
      expect(img).toHaveAttribute('alt', 'Card (image unavailable)');
    });
  });

  it('transitions from empty src to valid src correctly', async () => {
    const validSrc = 'https://example.com/card.png';
    const { rerender } = render(<CardImage src="" alt="Card" />);

    // Should start with fallback
    expect(screen.getByRole('img').getAttribute('src')).toContain('data:image/svg+xml');

    // Rerender with valid src
    rerender(<CardImage src={validSrc} alt="Card" />);

    await waitFor(() => {
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', validSrc);
      expect(img).toHaveAttribute('alt', 'Card');
    });
  });
});

describe('CardBack', () => {
  it('renders the card back image', () => {
    render(<CardBack />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', CARD_BACK_URL);
    expect(img).toHaveAttribute('alt', 'Card back');
  });

  it('renders in fill mode when specified', () => {
    render(<CardBack fill />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('data-fill', 'true');
  });

  it('renders with fixed dimensions when specified', () => {
    render(<CardBack width={100} height={140} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '100');
    expect(img).toHaveAttribute('height', '140');
  });

  it('applies custom className', () => {
    render(<CardBack className="custom-back-class" />);

    const img = screen.getByRole('img');
    expect(img).toHaveClass('custom-back-class');
  });
});

describe('CARD_BACK_URL', () => {
  it('exports the correct Pokemon card back URL', () => {
    expect(CARD_BACK_URL).toBe('https://images.pokemontcg.io/cardback.png');
  });
});
