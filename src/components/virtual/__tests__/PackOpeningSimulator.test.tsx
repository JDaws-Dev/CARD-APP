import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock next/image since we use CardImage which wraps it
vi.mock('next/image', () => ({
  default: function MockImage({
    src,
    alt,
    onError,
    onLoadingComplete,
    className,
    fill,
    sizes,
    priority,
    draggable,
    ...props
  }: {
    src: string;
    alt: string;
    onError?: () => void;
    onLoadingComplete?: () => void;
    className?: string;
    fill?: boolean;
    sizes?: string;
    priority?: boolean;
    draggable?: boolean;
  }) {
    return (
      <img
        src={src}
        alt={alt}
        data-fill={fill}
        data-priority={priority}
        data-sizes={sizes}
        draggable={draggable}
        onError={onError}
        onLoad={onLoadingComplete}
        className={className}
        {...props}
      />
    );
  },
}));

// Mock convex
vi.mock('convex/react', () => ({
  useQuery: vi.fn(() => null),
}));

// Mock providers
vi.mock('@/components/providers/ReducedMotionProvider', () => ({
  useReducedMotion: () => ({ isReduced: false }),
}));

vi.mock('@/components/providers/PackEffectsProvider', () => ({
  usePackEffects: () => ({
    soundEnabled: false,
    hapticsEnabled: false,
    toggleSound: vi.fn(),
    toggleHaptics: vi.fn(),
    onPackOpen: vi.fn(),
    onCardReveal: vi.fn(),
    onPackComplete: vi.fn(),
  }),
}));

vi.mock('@/hooks/useCurrentProfile', () => ({
  useCurrentProfile: () => ({ profileId: 'test-profile-id', isLoading: false }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() =>
    JSON.stringify({
      packsUsed: 0,
      lastResetDate: new Date().toDateString(),
    })
  ),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Import after mocks
import { PackOpeningSimulator } from '../PackOpeningSimulator';
import { useQuery } from 'convex/react';

describe('PackOpeningSimulator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify({
        packsUsed: 0,
        lastResetDate: new Date().toDateString(),
      })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<PackOpeningSimulator isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the sealed pack view when open', () => {
    render(<PackOpeningSimulator isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Virtual Pack Opening')).toBeInTheDocument();
    expect(screen.getByText('Virtual Pack')).toBeInTheDocument();
    expect(screen.getByText('Tap to open!')).toBeInTheDocument();
  });

  it('displays packs remaining count', () => {
    render(<PackOpeningSimulator isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/2 packs remaining today/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<PackOpeningSimulator isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByLabelText('Close pack opening');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<PackOpeningSimulator isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('Card image error handling', () => {
    it('uses CardImage component which handles image errors gracefully', async () => {
      const mockCards = [
        {
          cardId: 'test-1',
          name: 'Pikachu',
          imageSmall: 'https://images.pokemontcg.io/xy1/42.png',
          rarity: 'Common',
        },
      ];

      // Mock useQuery to return cards when in opening state
      const useQueryMock = useQuery as ReturnType<typeof vi.fn>;
      useQueryMock.mockReturnValue(mockCards);

      render(<PackOpeningSimulator isOpen={true} onClose={vi.fn()} />);

      // Open a pack
      const packButton = screen.getByLabelText('Open a virtual pack');
      fireEvent.click(packButton);

      // Wait for card to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Tap to reveal card')).toBeInTheDocument();
      });

      // Click to reveal
      const cardButton = screen.getByLabelText('Tap to reveal card');
      fireEvent.click(cardButton);

      // The image should be rendered with error handling from CardImage
      await waitFor(() => {
        const img = screen.getByAltText('Pikachu');
        expect(img).toBeInTheDocument();
      });

      // Simulate an error on the image
      const img = screen.getByAltText('Pikachu');
      fireEvent.error(img);

      // After error, CardImage should show fallback (alt text changes to indicate unavailable)
      await waitFor(() => {
        const fallbackImg = screen.getByRole('img', { name: /Pikachu/ });
        expect(fallbackImg).toBeInTheDocument();
      });
    });

    it('displays card name in fallback div when no imageSmall is provided', async () => {
      const mockCards = [
        {
          cardId: 'test-2',
          name: 'Charizard',
          imageSmall: '', // No image URL
          rarity: 'Rare Holo',
        },
      ];

      const useQueryMock = useQuery as ReturnType<typeof vi.fn>;
      useQueryMock.mockReturnValue(mockCards);

      render(<PackOpeningSimulator isOpen={true} onClose={vi.fn()} />);

      // Open a pack
      const packButton = screen.getByLabelText('Open a virtual pack');
      fireEvent.click(packButton);

      // Wait for card to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Tap to reveal card')).toBeInTheDocument();
      });

      // Click to reveal
      const cardButton = screen.getByLabelText('Tap to reveal card');
      fireEvent.click(cardButton);

      // Should show the card name in the fallback div
      await waitFor(() => {
        expect(screen.getByText('Charizard')).toBeInTheDocument();
      });
    });
  });
});
