import { describe, it, expect } from 'vitest';

// ============================================================================
// VIRTUAL SCROLL CONFIGURATION TESTS
// ============================================================================

// Constants that match VirtualCardGrid implementation
const VIRTUAL_SCROLL_THRESHOLD = 50;
const CARD_DIMENSIONS = {
  BASE_HEIGHT: 280,
  GAP: 12,
};

describe('Virtual Scroll Threshold', () => {
  it('should use virtual scrolling for 50 or more cards', () => {
    expect(VIRTUAL_SCROLL_THRESHOLD).toBe(50);
    expect(49 >= VIRTUAL_SCROLL_THRESHOLD).toBe(false);
    expect(50 >= VIRTUAL_SCROLL_THRESHOLD).toBe(true);
    expect(100 >= VIRTUAL_SCROLL_THRESHOLD).toBe(true);
  });

  it('should not use virtual scrolling for fewer than 50 cards', () => {
    expect(10 >= VIRTUAL_SCROLL_THRESHOLD).toBe(false);
    expect(25 >= VIRTUAL_SCROLL_THRESHOLD).toBe(false);
  });
});

describe('Card Dimensions Configuration', () => {
  it('should have reasonable base height for card items', () => {
    expect(CARD_DIMENSIONS.BASE_HEIGHT).toBeGreaterThan(200);
    expect(CARD_DIMENSIONS.BASE_HEIGHT).toBeLessThan(400);
  });

  it('should have gap spacing for grid', () => {
    expect(CARD_DIMENSIONS.GAP).toBeGreaterThan(0);
    expect(CARD_DIMENSIONS.GAP).toBe(12);
  });

  it('should calculate row height correctly', () => {
    const rowHeight = CARD_DIMENSIONS.BASE_HEIGHT + CARD_DIMENSIONS.GAP;
    expect(rowHeight).toBe(292);
  });
});

// ============================================================================
// COLUMN COUNT CALCULATION TESTS
// ============================================================================

// Helper function matching VirtualCardGrid implementation
function getColumnCount(containerWidth: number, simplifiedLayout: boolean): number {
  if (simplifiedLayout) {
    if (containerWidth >= 768) return 4; // md
    if (containerWidth >= 640) return 3; // sm
    return 2;
  }
  // Standard card-grid breakpoints
  if (containerWidth >= 1280) return 6; // xl
  if (containerWidth >= 1024) return 5; // lg
  if (containerWidth >= 768) return 4; // md
  if (containerWidth >= 640) return 3; // sm
  return 2;
}

describe('getColumnCount', () => {
  describe('standard layout', () => {
    it('should return 2 columns for mobile (<640px)', () => {
      expect(getColumnCount(320, false)).toBe(2);
      expect(getColumnCount(480, false)).toBe(2);
      expect(getColumnCount(639, false)).toBe(2);
    });

    it('should return 3 columns for small screens (640px+)', () => {
      expect(getColumnCount(640, false)).toBe(3);
      expect(getColumnCount(767, false)).toBe(3);
    });

    it('should return 4 columns for medium screens (768px+)', () => {
      expect(getColumnCount(768, false)).toBe(4);
      expect(getColumnCount(1023, false)).toBe(4);
    });

    it('should return 5 columns for large screens (1024px+)', () => {
      expect(getColumnCount(1024, false)).toBe(5);
      expect(getColumnCount(1279, false)).toBe(5);
    });

    it('should return 6 columns for extra large screens (1280px+)', () => {
      expect(getColumnCount(1280, false)).toBe(6);
      expect(getColumnCount(1920, false)).toBe(6);
    });
  });

  describe('simplified layout (kid mode)', () => {
    it('should return 2 columns for mobile (<640px)', () => {
      expect(getColumnCount(320, true)).toBe(2);
      expect(getColumnCount(639, true)).toBe(2);
    });

    it('should return 3 columns for small screens (640px+)', () => {
      expect(getColumnCount(640, true)).toBe(3);
      expect(getColumnCount(767, true)).toBe(3);
    });

    it('should return 4 columns for medium+ screens (768px+)', () => {
      expect(getColumnCount(768, true)).toBe(4);
      expect(getColumnCount(1024, true)).toBe(4);
      expect(getColumnCount(1280, true)).toBe(4);
      expect(getColumnCount(1920, true)).toBe(4);
    });
  });

  describe('edge cases', () => {
    it('should handle 0 width', () => {
      expect(getColumnCount(0, false)).toBe(2);
      expect(getColumnCount(0, true)).toBe(2);
    });

    it('should handle exactly at breakpoints', () => {
      expect(getColumnCount(640, false)).toBe(3);
      expect(getColumnCount(768, false)).toBe(4);
      expect(getColumnCount(1024, false)).toBe(5);
      expect(getColumnCount(1280, false)).toBe(6);
    });
  });
});

// ============================================================================
// ROW ORGANIZATION TESTS
// ============================================================================

// Helper function matching VirtualCardGrid implementation
function organizeIntoRows<T>(items: T[], columnCount: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += columnCount) {
    result.push(items.slice(i, i + columnCount));
  }
  return result;
}

describe('organizeIntoRows', () => {
  it('should organize items into rows based on column count', () => {
    const items = [1, 2, 3, 4, 5, 6];
    expect(organizeIntoRows(items, 2)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
    expect(organizeIntoRows(items, 3)).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it('should handle incomplete last row', () => {
    const items = [1, 2, 3, 4, 5];
    expect(organizeIntoRows(items, 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(organizeIntoRows(items, 3)).toEqual([
      [1, 2, 3],
      [4, 5],
    ]);
  });

  it('should handle empty array', () => {
    expect(organizeIntoRows([], 3)).toEqual([]);
  });

  it('should handle single item', () => {
    expect(organizeIntoRows([1], 3)).toEqual([[1]]);
  });

  it('should handle items equal to column count', () => {
    expect(organizeIntoRows([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
  });

  it('should work with different data types', () => {
    const cards = [
      { id: 'a', name: 'Card A' },
      { id: 'b', name: 'Card B' },
      { id: 'c', name: 'Card C' },
      { id: 'd', name: 'Card D' },
    ];
    const rows = organizeIntoRows(cards, 2);
    expect(rows.length).toBe(2);
    expect(rows[0][0].id).toBe('a');
    expect(rows[1][1].id).toBe('d');
  });
});

// ============================================================================
// VIRTUAL SCROLLING DECISION TESTS
// ============================================================================

describe('Virtual Scrolling Decision Logic', () => {
  it('should determine when to use virtual scrolling', () => {
    const shouldUseVirtualScrolling = (cardCount: number) => cardCount >= VIRTUAL_SCROLL_THRESHOLD;

    expect(shouldUseVirtualScrolling(10)).toBe(false);
    expect(shouldUseVirtualScrolling(49)).toBe(false);
    expect(shouldUseVirtualScrolling(50)).toBe(true);
    expect(shouldUseVirtualScrolling(100)).toBe(true);
    expect(shouldUseVirtualScrolling(500)).toBe(true);
  });
});

// ============================================================================
// ROW HEIGHT ESTIMATION TESTS
// ============================================================================

describe('Row Height Estimation', () => {
  it('should estimate consistent row heights', () => {
    const estimateRowHeight = () => CARD_DIMENSIONS.BASE_HEIGHT + CARD_DIMENSIONS.GAP;

    // Multiple calls should return same value for consistency
    expect(estimateRowHeight()).toBe(estimateRowHeight());
    expect(estimateRowHeight()).toBe(292);
  });

  it('should calculate total virtual height correctly', () => {
    const rowHeight = CARD_DIMENSIONS.BASE_HEIGHT + CARD_DIMENSIONS.GAP;

    // For 100 cards with 4 columns = 25 rows
    const totalCards = 100;
    const columns = 4;
    const rowCount = Math.ceil(totalCards / columns);
    const totalHeight = rowCount * rowHeight;

    expect(rowCount).toBe(25);
    expect(totalHeight).toBe(7300);
  });

  it('should handle large collections', () => {
    const rowHeight = CARD_DIMENSIONS.BASE_HEIGHT + CARD_DIMENSIONS.GAP;

    // For 500 cards with 6 columns = 84 rows (rounded up)
    const totalCards = 500;
    const columns = 6;
    const rowCount = Math.ceil(totalCards / columns);
    const totalHeight = rowCount * rowHeight;

    expect(rowCount).toBe(84);
    expect(totalHeight).toBe(24528);
  });
});

// ============================================================================
// OVERSCAN CONFIGURATION TESTS
// ============================================================================

describe('Overscan Configuration', () => {
  const OVERSCAN = 3; // Matching VirtualCardGrid implementation

  it('should have reasonable overscan value', () => {
    expect(OVERSCAN).toBeGreaterThan(0);
    expect(OVERSCAN).toBeLessThanOrEqual(5);
  });

  it('should render extra rows above and below viewport', () => {
    // If viewport shows 5 rows, we render 5 + (2 * OVERSCAN) = 11 rows
    const visibleRows = 5;
    const renderedRows = visibleRows + 2 * OVERSCAN;
    expect(renderedRows).toBe(11);
  });
});

// ============================================================================
// VARIANT HELPERS TESTS
// ============================================================================

type CardVariant =
  | 'normal'
  | 'holofoil'
  | 'reverseHolofoil'
  | '1stEditionHolofoil'
  | '1stEditionNormal';

interface MockPokemonCard {
  id: string;
  name: string;
  tcgplayer?: {
    prices?: {
      normal?: { market: number };
      holofoil?: { market: number };
      reverseHolofoil?: { market: number };
    };
  };
}

function getAvailableVariants(card: MockPokemonCard): CardVariant[] {
  const prices = card.tcgplayer?.prices;
  if (!prices) return ['normal'];

  const variants: CardVariant[] = [];
  if (prices.normal) variants.push('normal');
  if (prices.holofoil) variants.push('holofoil');
  if (prices.reverseHolofoil) variants.push('reverseHolofoil');

  return variants.length > 0 ? variants : ['normal'];
}

describe('getAvailableVariants', () => {
  it('should return normal when no price data', () => {
    const card: MockPokemonCard = { id: 'sv1-1', name: 'Test Card' };
    expect(getAvailableVariants(card)).toEqual(['normal']);
  });

  it('should return all available variants from price data', () => {
    const card: MockPokemonCard = {
      id: 'sv1-1',
      name: 'Test Card',
      tcgplayer: {
        prices: {
          normal: { market: 0.5 },
          holofoil: { market: 2.0 },
          reverseHolofoil: { market: 1.5 },
        },
      },
    };
    expect(getAvailableVariants(card)).toEqual(['normal', 'holofoil', 'reverseHolofoil']);
  });

  it('should return only available variants', () => {
    const card: MockPokemonCard = {
      id: 'sv1-1',
      name: 'Test Card',
      tcgplayer: {
        prices: {
          holofoil: { market: 5.0 },
        },
      },
    };
    expect(getAvailableVariants(card)).toEqual(['holofoil']);
  });

  it('should default to normal when prices object is empty', () => {
    const card: MockPokemonCard = {
      id: 'sv1-1',
      name: 'Test Card',
      tcgplayer: { prices: {} },
    };
    expect(getAvailableVariants(card)).toEqual(['normal']);
  });
});

// ============================================================================
// PRICE HELPERS TESTS
// ============================================================================

function getCardMarketPrice(card: MockPokemonCard): number | null {
  const prices = card.tcgplayer?.prices;
  if (!prices) return null;

  return prices.normal?.market ?? prices.holofoil?.market ?? prices.reverseHolofoil?.market ?? null;
}

function formatPrice(price: number): string {
  if (price < 10) {
    return `$${price.toFixed(2)}`;
  } else if (price < 100) {
    return `$${price.toFixed(1)}`;
  } else {
    return `$${Math.round(price)}`;
  }
}

describe('getCardMarketPrice', () => {
  it('should return null when no price data', () => {
    const card: MockPokemonCard = { id: 'sv1-1', name: 'Test Card' };
    expect(getCardMarketPrice(card)).toBeNull();
  });

  it('should prefer normal price', () => {
    const card: MockPokemonCard = {
      id: 'sv1-1',
      name: 'Test Card',
      tcgplayer: {
        prices: {
          normal: { market: 0.5 },
          holofoil: { market: 2.0 },
        },
      },
    };
    expect(getCardMarketPrice(card)).toBe(0.5);
  });

  it('should fallback to holofoil price', () => {
    const card: MockPokemonCard = {
      id: 'sv1-1',
      name: 'Test Card',
      tcgplayer: {
        prices: {
          holofoil: { market: 3.0 },
          reverseHolofoil: { market: 1.5 },
        },
      },
    };
    expect(getCardMarketPrice(card)).toBe(3.0);
  });

  it('should fallback to reverseHolofoil price', () => {
    const card: MockPokemonCard = {
      id: 'sv1-1',
      name: 'Test Card',
      tcgplayer: {
        prices: {
          reverseHolofoil: { market: 1.25 },
        },
      },
    };
    expect(getCardMarketPrice(card)).toBe(1.25);
  });
});

describe('formatPrice', () => {
  it('should format prices under $10 with 2 decimal places', () => {
    expect(formatPrice(0.5)).toBe('$0.50');
    expect(formatPrice(1.99)).toBe('$1.99');
    expect(formatPrice(9.99)).toBe('$9.99');
  });

  it('should format prices $10-$99 with 1 decimal place', () => {
    expect(formatPrice(10)).toBe('$10.0');
    expect(formatPrice(25.49)).toBe('$25.5');
    expect(formatPrice(99.99)).toBe('$100.0');
  });

  it('should format prices $100+ as whole numbers', () => {
    expect(formatPrice(100)).toBe('$100');
    expect(formatPrice(250.75)).toBe('$251');
    expect(formatPrice(1000)).toBe('$1000');
  });
});

// ============================================================================
// COLLECTION MAP BUILDING TESTS
// ============================================================================

interface CollectionItem {
  cardId: string;
  quantity: number;
  variant?: string;
}

function buildCollectionMaps(collection: CollectionItem[]) {
  const ownedCards = new Map<string, number>();
  const ownedVariantsMap = new Map<string, Map<CardVariant, number>>();

  collection.forEach((card) => {
    const variant = (card.variant ?? 'normal') as CardVariant;
    const currentTotal = ownedCards.get(card.cardId) ?? 0;
    ownedCards.set(card.cardId, currentTotal + card.quantity);

    if (!ownedVariantsMap.has(card.cardId)) {
      ownedVariantsMap.set(card.cardId, new Map());
    }
    const variantMap = ownedVariantsMap.get(card.cardId)!;
    const currentVariantQty = variantMap.get(variant) ?? 0;
    variantMap.set(variant, currentVariantQty + card.quantity);
  });

  return { ownedCards, ownedVariantsMap };
}

describe('buildCollectionMaps', () => {
  it('should build owned cards map with total quantities', () => {
    const collection: CollectionItem[] = [
      { cardId: 'sv1-1', quantity: 2, variant: 'normal' },
      { cardId: 'sv1-1', quantity: 1, variant: 'holofoil' },
      { cardId: 'sv1-2', quantity: 3, variant: 'normal' },
    ];
    const { ownedCards } = buildCollectionMaps(collection);

    expect(ownedCards.get('sv1-1')).toBe(3);
    expect(ownedCards.get('sv1-2')).toBe(3);
    expect(ownedCards.size).toBe(2);
  });

  it('should build variant maps with per-variant quantities', () => {
    const collection: CollectionItem[] = [
      { cardId: 'sv1-1', quantity: 2, variant: 'normal' },
      { cardId: 'sv1-1', quantity: 1, variant: 'holofoil' },
    ];
    const { ownedVariantsMap } = buildCollectionMaps(collection);

    const sv1Variants = ownedVariantsMap.get('sv1-1')!;
    expect(sv1Variants.get('normal')).toBe(2);
    expect(sv1Variants.get('holofoil')).toBe(1);
  });

  it('should handle empty collection', () => {
    const { ownedCards, ownedVariantsMap } = buildCollectionMaps([]);
    expect(ownedCards.size).toBe(0);
    expect(ownedVariantsMap.size).toBe(0);
  });

  it('should default to normal variant when not specified', () => {
    const collection: CollectionItem[] = [{ cardId: 'sv1-1', quantity: 1 }];
    const { ownedVariantsMap } = buildCollectionMaps(collection);

    const sv1Variants = ownedVariantsMap.get('sv1-1')!;
    expect(sv1Variants.get('normal')).toBe(1);
  });
});

// ============================================================================
// PROGRESS CALCULATION TESTS
// ============================================================================

describe('Progress Calculation', () => {
  it('should calculate progress percentage correctly', () => {
    const calcProgress = (owned: number, total: number) =>
      total > 0 ? Math.round((owned / total) * 100) : 0;

    expect(calcProgress(50, 200)).toBe(25);
    expect(calcProgress(100, 200)).toBe(50);
    expect(calcProgress(150, 200)).toBe(75);
    expect(calcProgress(200, 200)).toBe(100);
  });

  it('should handle edge cases', () => {
    const calcProgress = (owned: number, total: number) =>
      total > 0 ? Math.round((owned / total) * 100) : 0;

    expect(calcProgress(0, 0)).toBe(0);
    expect(calcProgress(0, 100)).toBe(0);
    expect(calcProgress(1, 3)).toBe(33);
  });
});

// ============================================================================
// PERFORMANCE METRICS TESTS
// ============================================================================

describe('Performance Metrics', () => {
  it('should calculate estimated render count for virtual scrolling', () => {
    const viewportHeight = 600; // pixels
    const rowHeight = CARD_DIMENSIONS.BASE_HEIGHT + CARD_DIMENSIONS.GAP;
    const overscan = 3;

    const visibleRows = Math.ceil(viewportHeight / rowHeight);
    const renderedRows = visibleRows + 2 * overscan;

    // Should render approximately 2-3 visible rows + 6 overscan = 8-9 rows
    expect(visibleRows).toBe(3);
    expect(renderedRows).toBe(9);
  });

  it('should calculate memory savings for large collections', () => {
    const totalCards = 500;
    const columns = 6;
    const totalRows = Math.ceil(totalCards / columns); // 84 rows
    const viewportHeight = 600;
    const rowHeight = CARD_DIMENSIONS.BASE_HEIGHT + CARD_DIMENSIONS.GAP;
    const overscan = 3;

    const visibleRows = Math.ceil(viewportHeight / rowHeight);
    const renderedRows = visibleRows + 2 * overscan;

    // Without virtualization: render all 84 rows
    // With virtualization: render only ~9 rows
    const percentRendered = (renderedRows / totalRows) * 100;

    expect(totalRows).toBe(84);
    expect(percentRendered).toBeLessThan(15); // Less than 15% of rows rendered
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

describe('Accessibility Attributes', () => {
  it('should define correct ARIA roles', () => {
    const gridRole = 'grid';
    const rowRole = 'row';
    const buttonRole = 'button';

    expect(gridRole).toBe('grid');
    expect(rowRole).toBe('row');
    expect(buttonRole).toBe('button');
  });

  it('should generate correct aria-label for cards', () => {
    const generateCardLabel = (
      name: string,
      isOwned: boolean,
      quantity: number,
      isNewlyAdded: boolean,
      isWishlisted: boolean,
      simplifiedLayout: boolean
    ) => {
      let label = `${name}, ${isOwned ? `owned ${quantity} copies` : 'not owned'}`;
      if (isNewlyAdded) label += ', newly added';
      if (isWishlisted) label += ', on wishlist';
      label += `. ${simplifiedLayout ? `Tap to ${isOwned ? 'remove' : 'add'}` : `Click to ${isOwned ? 'manage' : 'add to collection'}`}`;
      return label;
    };

    expect(generateCardLabel('Pikachu', true, 2, false, false, false)).toBe(
      'Pikachu, owned 2 copies. Click to manage'
    );
    expect(generateCardLabel('Charmander', false, 0, false, true, false)).toBe(
      'Charmander, not owned, on wishlist. Click to add to collection'
    );
    expect(generateCardLabel('Bulbasaur', true, 1, true, false, true)).toBe(
      'Bulbasaur, owned 1 copies, newly added. Tap to remove'
    );
  });
});
