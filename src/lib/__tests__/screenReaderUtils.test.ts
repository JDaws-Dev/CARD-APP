/**
 * Tests for Screen Reader Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  generateCardAriaLabel,
  generateBadgeAriaLabel,
  generateStatAriaLabel,
  generateActivityAriaLabel,
  describeQuantityChange,
  describeProgressUpdate,
  describeStreakChange,
  ARIA_ROLES,
  STATE_DESCRIPTIONS,
  type CardAriaLabelOptions,
  type BadgeAriaLabelOptions,
  type StatAriaLabelOptions,
  type ActivityAriaLabelOptions,
} from '../screenReaderUtils';

// ============================================================================
// CARD ARIA LABEL TESTS
// ============================================================================

describe('generateCardAriaLabel', () => {
  it('generates basic label for unowned card', () => {
    const options: CardAriaLabelOptions = {
      cardName: 'Pikachu',
      cardNumber: '025',
      isOwned: false,
    };

    const label = generateCardAriaLabel(options);
    expect(label).toContain('Pikachu');
    expect(label).toContain('number 025');
    expect(label).toContain('not in collection');
  });

  it('generates label for owned card with quantity', () => {
    const options: CardAriaLabelOptions = {
      cardName: 'Charizard',
      cardNumber: '006',
      isOwned: true,
      ownedQuantity: 3,
    };

    const label = generateCardAriaLabel(options);
    expect(label).toContain('Charizard');
    expect(label).toContain('owned 3 copies');
  });

  it('includes set name when provided', () => {
    const options: CardAriaLabelOptions = {
      cardName: 'Bulbasaur',
      cardNumber: '001',
      setName: 'Base Set',
      isOwned: true,
      ownedQuantity: 1,
    };

    const label = generateCardAriaLabel(options);
    expect(label).toContain('from Base Set');
  });

  it('includes rarity when provided', () => {
    const options: CardAriaLabelOptions = {
      cardName: 'Mewtwo',
      cardNumber: '150',
      rarity: 'Ultra Rare',
      isOwned: false,
    };

    const label = generateCardAriaLabel(options);
    expect(label).toContain('Ultra Rare rarity');
  });

  it('indicates newly added cards', () => {
    const options: CardAriaLabelOptions = {
      cardName: 'Eevee',
      cardNumber: '133',
      isOwned: true,
      ownedQuantity: 1,
      isNewlyAdded: true,
    };

    const label = generateCardAriaLabel(options);
    expect(label).toContain('recently added');
  });

  it('indicates wishlist status', () => {
    const options: CardAriaLabelOptions = {
      cardName: 'Blastoise',
      cardNumber: '009',
      isOwned: false,
      isWishlisted: true,
    };

    const label = generateCardAriaLabel(options);
    expect(label).toContain('on wishlist');
  });

  it('indicates priority wishlist status', () => {
    const options: CardAriaLabelOptions = {
      cardName: 'Venusaur',
      cardNumber: '003',
      isOwned: false,
      isWishlisted: true,
      isPriority: true,
    };

    const label = generateCardAriaLabel(options);
    expect(label).toContain('priority wishlist item');
  });

  it('includes market price when available', () => {
    const options: CardAriaLabelOptions = {
      cardName: 'Mew',
      cardNumber: '151',
      isOwned: true,
      ownedQuantity: 1,
      marketPrice: 25.99,
    };

    const label = generateCardAriaLabel(options);
    expect(label).toContain('market value $25.99');
  });

  it('includes variant details when available', () => {
    const options: CardAriaLabelOptions = {
      cardName: 'Gengar',
      cardNumber: '094',
      isOwned: true,
      ownedQuantity: 3,
      variants: [
        { type: 'normal', quantity: 2 },
        { type: 'holofoil', quantity: 1 },
      ],
    };

    const label = generateCardAriaLabel(options);
    expect(label).toContain('2 normals');
    expect(label).toContain('1 holofoil');
  });
});

// ============================================================================
// BADGE ARIA LABEL TESTS
// ============================================================================

describe('generateBadgeAriaLabel', () => {
  it('generates label for earned badge', () => {
    const options: BadgeAriaLabelOptions = {
      badgeName: 'First Catch',
      description: 'Add your first card',
      isEarned: true,
    };

    const label = generateBadgeAriaLabel(options);
    expect(label).toContain('Badge: First Catch');
    expect(label).toContain('earned');
    expect(label).toContain('Add your first card');
  });

  it('generates label for locked badge', () => {
    const options: BadgeAriaLabelOptions = {
      badgeName: 'Pokemon Master',
      description: 'Collect 500 cards',
      isEarned: false,
    };

    const label = generateBadgeAriaLabel(options);
    expect(label).toContain('Badge: Pokemon Master');
    expect(label).toContain('locked');
  });

  it('includes tier information', () => {
    const options: BadgeAriaLabelOptions = {
      badgeName: 'Elite Collector',
      description: 'Collect 250 cards',
      isEarned: true,
      tier: 'gold',
    };

    const label = generateBadgeAriaLabel(options);
    expect(label).toContain('gold tier badge');
  });

  it('includes earned date when provided', () => {
    const options: BadgeAriaLabelOptions = {
      badgeName: 'Starter Collector',
      description: 'Collect 10 cards',
      isEarned: true,
      earnedDate: 'January 15, 2026',
    };

    const label = generateBadgeAriaLabel(options);
    expect(label).toContain('on January 15, 2026');
  });

  it('includes progress for locked badges', () => {
    const options: BadgeAriaLabelOptions = {
      badgeName: 'Rising Trainer',
      description: 'Collect 50 cards',
      isEarned: false,
      progress: 60,
      progressCurrent: 30,
      progressTotal: 50,
    };

    const label = generateBadgeAriaLabel(options);
    expect(label).toContain('60% complete');
    expect(label).toContain('30 of 50');
  });
});

// ============================================================================
// STAT ARIA LABEL TESTS
// ============================================================================

describe('generateStatAriaLabel', () => {
  it('generates basic stat label', () => {
    const options: StatAriaLabelOptions = {
      label: 'Total Cards',
      value: 150,
    };

    const label = generateStatAriaLabel(options);
    expect(label).toBe('Total Cards: 150');
  });

  it('includes context when provided', () => {
    const options: StatAriaLabelOptions = {
      label: 'Completion',
      value: '75%',
      context: 'of this set',
    };

    const label = generateStatAriaLabel(options);
    expect(label).toContain('Completion: 75%');
    expect(label).toContain('of this set');
  });

  it('includes change description when provided', () => {
    const options: StatAriaLabelOptions = {
      label: 'Owned',
      value: 25,
      changeDescription: 'increased by 5',
    };

    const label = generateStatAriaLabel(options);
    expect(label).toContain('increased by 5');
  });
});

// ============================================================================
// ACTIVITY ARIA LABEL TESTS
// ============================================================================

describe('generateActivityAriaLabel', () => {
  it('generates label for card added', () => {
    const options: ActivityAriaLabelOptions = {
      actionType: 'card_added',
      cardName: 'Pikachu',
      setName: 'Base Set',
      timestamp: '5 minutes ago',
    };

    const label = generateActivityAriaLabel(options);
    expect(label).toContain('Added Pikachu');
    expect(label).toContain('from Base Set');
    expect(label).toContain('5 minutes ago');
  });

  it('generates label for card removed', () => {
    const options: ActivityAriaLabelOptions = {
      actionType: 'card_removed',
      cardName: 'Charizard',
      timestamp: '2 hours ago',
    };

    const label = generateActivityAriaLabel(options);
    expect(label).toContain('Removed Charizard');
    expect(label).toContain('2 hours ago');
  });

  it('generates label for achievement earned', () => {
    const options: ActivityAriaLabelOptions = {
      actionType: 'achievement_earned',
      achievementName: 'First Catch',
      timestamp: 'Just now',
    };

    const label = generateActivityAriaLabel(options);
    expect(label).toContain('Earned achievement: First Catch');
    expect(label).toContain('Just now');
  });

  it('includes quantity for multiple cards', () => {
    const options: ActivityAriaLabelOptions = {
      actionType: 'card_added',
      cardName: 'Energy',
      quantity: 5,
      timestamp: '1 day ago',
    };

    const label = generateActivityAriaLabel(options);
    expect(label).toContain('(5 copies)');
  });

  it('handles missing card name gracefully', () => {
    const options: ActivityAriaLabelOptions = {
      actionType: 'card_added',
      timestamp: 'yesterday',
    };

    const label = generateActivityAriaLabel(options);
    expect(label).toContain('Added a card');
  });
});

// ============================================================================
// QUANTITY CHANGE DESCRIPTION TESTS
// ============================================================================

describe('describeQuantityChange', () => {
  it('describes adding items', () => {
    const desc = describeQuantityChange('card', 5, 8);
    expect(desc).toContain('Added 3 cards');
    expect(desc).toContain('Total: 8');
  });

  it('describes removing items', () => {
    const desc = describeQuantityChange('card', 10, 7);
    expect(desc).toContain('Removed 3 cards');
    expect(desc).toContain('Total: 7');
  });

  it('describes single item change correctly', () => {
    const desc = describeQuantityChange('card', 5, 6);
    expect(desc).toContain('Added 1 card');
    expect(desc).not.toContain('cards');
  });

  it('describes no change', () => {
    const desc = describeQuantityChange('card', 5, 5);
    expect(desc).toContain('unchanged at 5');
  });
});

// ============================================================================
// PROGRESS UPDATE DESCRIPTION TESTS
// ============================================================================

describe('describeProgressUpdate', () => {
  it('describes completed progress', () => {
    const desc = describeProgressUpdate('Set collection', 90, 100, 50, 50);
    expect(desc).toContain('complete');
    expect(desc).toContain('50 of 50');
  });

  it('describes progress increase', () => {
    const desc = describeProgressUpdate('Badge progress', 25, 50, 25, 50);
    expect(desc).toContain('progress increased to 50%');
    expect(desc).toContain('25 of 50');
  });

  it('describes current progress without increase', () => {
    const desc = describeProgressUpdate('Collection', 50, 50, 25, 50);
    expect(desc).toContain('at 50%');
  });
});

// ============================================================================
// STREAK CHANGE DESCRIPTION TESTS
// ============================================================================

describe('describeStreakChange', () => {
  it('describes streak increase', () => {
    const desc = describeStreakChange(5, 6, true);
    expect(desc).toContain('Streak increased to 6 days');
    expect(desc).toContain('Active today');
  });

  it('describes streak ended', () => {
    const desc = describeStreakChange(5, 0, false);
    expect(desc).toContain('Streak ended');
    expect(desc).toContain('Start a new streak');
  });

  it('describes streak reset', () => {
    const desc = describeStreakChange(10, 5, false);
    expect(desc).toContain('Streak reset to 5 days');
  });

  it('describes current streak', () => {
    const desc = describeStreakChange(7, 7, true);
    expect(desc).toContain('7 day streak');
    expect(desc).toContain('Active today');
  });

  it('prompts to continue streak when not active', () => {
    const desc = describeStreakChange(5, 5, false);
    expect(desc).toContain('Add a card to continue your streak');
  });
});

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('ARIA_ROLES', () => {
  it('contains expected live region roles', () => {
    expect(ARIA_ROLES.STATUS).toBe('status');
    expect(ARIA_ROLES.ALERT).toBe('alert');
    expect(ARIA_ROLES.LOG).toBe('log');
  });

  it('contains expected structural roles', () => {
    expect(ARIA_ROLES.REGION).toBe('region');
    expect(ARIA_ROLES.GROUP).toBe('group');
    expect(ARIA_ROLES.LIST).toBe('list');
    expect(ARIA_ROLES.LISTITEM).toBe('listitem');
  });

  it('contains expected interactive roles', () => {
    expect(ARIA_ROLES.BUTTON).toBe('button');
    expect(ARIA_ROLES.PROGRESSBAR).toBe('progressbar');
    expect(ARIA_ROLES.TABLIST).toBe('tablist');
    expect(ARIA_ROLES.TAB).toBe('tab');
  });
});

describe('STATE_DESCRIPTIONS', () => {
  it('contains expected state messages', () => {
    expect(STATE_DESCRIPTIONS.LOADING).toContain('Loading');
    expect(STATE_DESCRIPTIONS.EMPTY).toContain('No items');
    expect(STATE_DESCRIPTIONS.ERROR).toContain('error');
    expect(STATE_DESCRIPTIONS.SUCCESS).toContain('success');
  });
});
