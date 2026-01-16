import { describe, expect, test } from 'vitest';
import {
  getSetCompletionProgress,
  checkSetJustCompleted,
  shouldCelebrateSetCompletion,
  formatSetProgress,
  getSetCompletionTitle,
  getSetCompletionGradient,
  createSetCompletionInfo,
  updateSetCompletionInfo,
  createSetCelebrationData,
  getSetMotivationalMessage,
  isValidSetCompletionInfo,
  isValidOwnedCount,
  type SetCompletionInfo,
} from '../setCompletion';

// ============================================================================
// SET COMPLETION PROGRESS
// ============================================================================

describe('getSetCompletionProgress', () => {
  test('returns 0% progress for empty collection', () => {
    const result = getSetCompletionProgress(0, 100);
    expect(result.percentComplete).toBe(0);
    expect(result.cardsNeeded).toBe(100);
    expect(result.isComplete).toBe(false);
  });

  test('returns correct progress for partial collection', () => {
    const result = getSetCompletionProgress(25, 100);
    expect(result.percentComplete).toBe(25);
    expect(result.cardsNeeded).toBe(75);
    expect(result.isComplete).toBe(false);
  });

  test('returns 50% progress for halfway completion', () => {
    const result = getSetCompletionProgress(50, 100);
    expect(result.percentComplete).toBe(50);
    expect(result.cardsNeeded).toBe(50);
    expect(result.isComplete).toBe(false);
  });

  test('returns 100% progress for complete collection', () => {
    const result = getSetCompletionProgress(100, 100);
    expect(result.percentComplete).toBe(100);
    expect(result.cardsNeeded).toBe(0);
    expect(result.isComplete).toBe(true);
  });

  test('caps percentage at 100% even with more owned than total', () => {
    const result = getSetCompletionProgress(150, 100);
    expect(result.percentComplete).toBe(100);
    expect(result.cardsNeeded).toBe(0);
    expect(result.isComplete).toBe(true);
  });

  test('handles zero total cards gracefully', () => {
    const result = getSetCompletionProgress(10, 0);
    expect(result.percentComplete).toBe(0);
    expect(result.cardsNeeded).toBe(0);
    expect(result.isComplete).toBe(false);
  });

  test('handles negative total cards gracefully', () => {
    const result = getSetCompletionProgress(10, -5);
    expect(result.percentComplete).toBe(0);
    expect(result.cardsNeeded).toBe(0);
    expect(result.isComplete).toBe(false);
  });

  test('rounds percentage to whole number', () => {
    const result = getSetCompletionProgress(33, 100);
    expect(result.percentComplete).toBe(33);
    expect(result.cardsNeeded).toBe(67);
  });

  test('works with small sets', () => {
    const result = getSetCompletionProgress(3, 5);
    expect(result.percentComplete).toBe(60);
    expect(result.cardsNeeded).toBe(2);
    expect(result.isComplete).toBe(false);
  });
});

// ============================================================================
// SET COMPLETION DETECTION
// ============================================================================

describe('checkSetJustCompleted', () => {
  test('returns justCompleted true when crossing 100%', () => {
    const result = checkSetJustCompleted(99, 100, 100);
    expect(result.wasComplete).toBe(false);
    expect(result.isNowComplete).toBe(true);
    expect(result.justCompleted).toBe(true);
  });

  test('returns justCompleted false when already complete', () => {
    const result = checkSetJustCompleted(100, 101, 100);
    expect(result.wasComplete).toBe(true);
    expect(result.isNowComplete).toBe(true);
    expect(result.justCompleted).toBe(false);
  });

  test('returns justCompleted false when not yet complete', () => {
    const result = checkSetJustCompleted(50, 75, 100);
    expect(result.wasComplete).toBe(false);
    expect(result.isNowComplete).toBe(false);
    expect(result.justCompleted).toBe(false);
  });

  test('handles exact threshold crossing', () => {
    const result = checkSetJustCompleted(49, 50, 50);
    expect(result.justCompleted).toBe(true);
  });

  test('handles zero total cards', () => {
    const result = checkSetJustCompleted(0, 5, 0);
    expect(result.wasComplete).toBe(false);
    expect(result.isNowComplete).toBe(false);
    expect(result.justCompleted).toBe(false);
  });
});

describe('shouldCelebrateSetCompletion', () => {
  test('returns true when just completed', () => {
    expect(shouldCelebrateSetCompletion(99, 100, 100)).toBe(true);
  });

  test('returns false when already complete', () => {
    expect(shouldCelebrateSetCompletion(100, 101, 100)).toBe(false);
  });

  test('returns false when not complete', () => {
    expect(shouldCelebrateSetCompletion(50, 75, 100)).toBe(false);
  });

  test('returns false when previous count is null', () => {
    expect(shouldCelebrateSetCompletion(null, 100, 100)).toBe(false);
  });

  test('returns false when count goes down', () => {
    expect(shouldCelebrateSetCompletion(100, 99, 100)).toBe(false);
  });

  test('returns false for zero total cards', () => {
    expect(shouldCelebrateSetCompletion(0, 5, 0)).toBe(false);
  });

  test('returns false for negative total cards', () => {
    expect(shouldCelebrateSetCompletion(0, 5, -10)).toBe(false);
  });
});

// ============================================================================
// PROGRESS FORMATTING
// ============================================================================

describe('formatSetProgress', () => {
  test('returns completion message when complete', () => {
    expect(formatSetProgress(100, 100)).toBe('Set Complete!');
  });

  test('returns singular card message when 1 needed', () => {
    expect(formatSetProgress(99, 100)).toBe('1 card to go!');
  });

  test('returns plural card message when multiple needed', () => {
    expect(formatSetProgress(75, 100)).toBe('25 cards to go');
    expect(formatSetProgress(0, 100)).toBe('100 cards to go');
  });
});

describe('getSetCompletionTitle', () => {
  test('returns Set Champion at 100%', () => {
    expect(getSetCompletionTitle(100)).toBe('Set Champion');
  });

  test('returns Set Master at 75-99%', () => {
    expect(getSetCompletionTitle(75)).toBe('Set Master');
    expect(getSetCompletionTitle(99)).toBe('Set Master');
  });

  test('returns Set Adventurer at 50-74%', () => {
    expect(getSetCompletionTitle(50)).toBe('Set Adventurer');
    expect(getSetCompletionTitle(74)).toBe('Set Adventurer');
  });

  test('returns Set Explorer at 25-49%', () => {
    expect(getSetCompletionTitle(25)).toBe('Set Explorer');
    expect(getSetCompletionTitle(49)).toBe('Set Explorer');
  });

  test('returns Getting Started at 0-24%', () => {
    expect(getSetCompletionTitle(0)).toBe('Getting Started');
    expect(getSetCompletionTitle(24)).toBe('Getting Started');
  });
});

describe('getSetCompletionGradient', () => {
  test('returns amber/gold gradient at 100%', () => {
    const result = getSetCompletionGradient(100);
    expect(result).toContain('amber');
    expect(result).toContain('yellow');
  });

  test('returns purple gradient at 75%+', () => {
    const result = getSetCompletionGradient(75);
    expect(result).toContain('purple');
  });

  test('returns blue gradient at 50%+', () => {
    const result = getSetCompletionGradient(50);
    expect(result).toContain('blue');
  });

  test('returns emerald gradient at 25%+', () => {
    const result = getSetCompletionGradient(25);
    expect(result).toContain('emerald');
  });

  test('returns gray gradient at 0%', () => {
    const result = getSetCompletionGradient(0);
    expect(result).toContain('gray');
  });
});

// ============================================================================
// SET COMPLETION INFO BUILDERS
// ============================================================================

describe('createSetCompletionInfo', () => {
  test('creates basic info object', () => {
    const info = createSetCompletionInfo('sv1', 'Scarlet & Violet', 198);
    expect(info.setId).toBe('sv1');
    expect(info.setName).toBe('Scarlet & Violet');
    expect(info.totalCards).toBe(198);
    expect(info.ownedCards).toBe(0);
    expect(info.setSymbolUrl).toBeUndefined();
    expect(info.setLogoUrl).toBeUndefined();
  });

  test('includes optional URLs when provided', () => {
    const info = createSetCompletionInfo(
      'sv1',
      'Scarlet & Violet',
      198,
      'https://example.com/symbol.png',
      'https://example.com/logo.png'
    );
    expect(info.setSymbolUrl).toBe('https://example.com/symbol.png');
    expect(info.setLogoUrl).toBe('https://example.com/logo.png');
  });
});

describe('updateSetCompletionInfo', () => {
  test('updates owned cards count', () => {
    const info = createSetCompletionInfo('sv1', 'Scarlet & Violet', 198);
    const updated = updateSetCompletionInfo(info, 50);
    expect(updated.ownedCards).toBe(50);
    expect(updated.setId).toBe('sv1');
    expect(updated.setName).toBe('Scarlet & Violet');
    expect(updated.totalCards).toBe(198);
  });

  test('does not mutate original object', () => {
    const info = createSetCompletionInfo('sv1', 'Scarlet & Violet', 198);
    const updated = updateSetCompletionInfo(info, 50);
    expect(info.ownedCards).toBe(0);
    expect(updated.ownedCards).toBe(50);
  });
});

// ============================================================================
// CELEBRATION DATA
// ============================================================================

describe('createSetCelebrationData', () => {
  test('returns no celebration for null set info', () => {
    const data = createSetCelebrationData(null);
    expect(data.shouldCelebrate).toBe(false);
    expect(data.setInfo).toBeNull();
    expect(data.confettiCount).toBe(0);
    expect(data.celebrationMessage).toBe('');
  });

  test('returns celebration data for completed set', () => {
    const info: SetCompletionInfo = {
      setId: 'sv1',
      setName: 'Scarlet & Violet',
      totalCards: 198,
      ownedCards: 198,
    };
    const data = createSetCelebrationData(info);
    expect(data.shouldCelebrate).toBe(true);
    expect(data.setInfo).toBe(info);
    expect(data.confettiCount).toBe(200);
    expect(data.celebrationMessage).toContain('Scarlet & Violet');
    expect(data.celebrationDuration).toBe(5000);
  });
});

describe('getSetMotivationalMessage', () => {
  test('returns completion message at 100%', () => {
    const message = getSetMotivationalMessage(100, 0);
    expect(message).toContain('completed');
  });

  test('returns almost there message at 90%+', () => {
    const message = getSetMotivationalMessage(95, 5);
    expect(message).toContain('close');
    expect(message).toContain('5');
  });

  test('uses singular for 1 card needed', () => {
    const message = getSetMotivationalMessage(99, 1);
    expect(message).toContain('1 more card');
  });

  test('returns almost there message at 75%+', () => {
    const message = getSetMotivationalMessage(80, 20);
    expect(message).toContain('almost');
  });

  test('returns halfway message at 50%+', () => {
    const message = getSetMotivationalMessage(60, 40);
    expect(message).toContain('Halfway');
  });

  test('returns nice start message at 25%+', () => {
    const message = getSetMotivationalMessage(30, 70);
    expect(message).toContain('Nice');
  });

  test('returns start message at 0%', () => {
    const message = getSetMotivationalMessage(0, 100);
    expect(message).toContain('Start');
  });
});

// ============================================================================
// VALIDATION
// ============================================================================

describe('isValidSetCompletionInfo', () => {
  test('returns true for valid info', () => {
    const info: SetCompletionInfo = {
      setId: 'sv1',
      setName: 'Scarlet & Violet',
      totalCards: 198,
      ownedCards: 50,
    };
    expect(isValidSetCompletionInfo(info)).toBe(true);
  });

  test('returns false for empty setId', () => {
    const info: SetCompletionInfo = {
      setId: '',
      setName: 'Test Set',
      totalCards: 100,
      ownedCards: 0,
    };
    expect(isValidSetCompletionInfo(info)).toBe(false);
  });

  test('returns false for empty setName', () => {
    const info: SetCompletionInfo = {
      setId: 'test',
      setName: '',
      totalCards: 100,
      ownedCards: 0,
    };
    expect(isValidSetCompletionInfo(info)).toBe(false);
  });

  test('returns false for zero total cards', () => {
    const info: SetCompletionInfo = {
      setId: 'test',
      setName: 'Test Set',
      totalCards: 0,
      ownedCards: 0,
    };
    expect(isValidSetCompletionInfo(info)).toBe(false);
  });

  test('returns false for negative owned cards', () => {
    const info: SetCompletionInfo = {
      setId: 'test',
      setName: 'Test Set',
      totalCards: 100,
      ownedCards: -1,
    };
    expect(isValidSetCompletionInfo(info)).toBe(false);
  });
});

describe('isValidOwnedCount', () => {
  test('returns true for valid counts', () => {
    expect(isValidOwnedCount(0, 100)).toBe(true);
    expect(isValidOwnedCount(50, 100)).toBe(true);
    expect(isValidOwnedCount(100, 100)).toBe(true);
  });

  test('returns true for count slightly over total (duplicates)', () => {
    expect(isValidOwnedCount(150, 100)).toBe(true); // Within 2x buffer
  });

  test('returns false for negative count', () => {
    expect(isValidOwnedCount(-1, 100)).toBe(false);
  });

  test('returns false for count way over total', () => {
    expect(isValidOwnedCount(250, 100)).toBe(false); // Over 2x buffer
  });
});

// ============================================================================
// INTEGRATION SCENARIOS
// ============================================================================

describe('Integration: Set completion journey', () => {
  test('tracks progress from empty to complete', () => {
    const totalCards = 100;

    // Start empty
    let progress = getSetCompletionProgress(0, totalCards);
    expect(progress.isComplete).toBe(false);
    expect(getSetCompletionTitle(progress.percentComplete)).toBe('Getting Started');

    // Add some cards
    progress = getSetCompletionProgress(30, totalCards);
    expect(progress.isComplete).toBe(false);
    expect(getSetCompletionTitle(progress.percentComplete)).toBe('Set Explorer');

    // Halfway there
    progress = getSetCompletionProgress(50, totalCards);
    expect(getSetCompletionTitle(progress.percentComplete)).toBe('Set Adventurer');

    // Almost done
    progress = getSetCompletionProgress(80, totalCards);
    expect(getSetCompletionTitle(progress.percentComplete)).toBe('Set Master');

    // Check if we should celebrate (not yet)
    expect(shouldCelebrateSetCompletion(80, 99, totalCards)).toBe(false);

    // Complete!
    expect(shouldCelebrateSetCompletion(99, 100, totalCards)).toBe(true);
    progress = getSetCompletionProgress(100, totalCards);
    expect(progress.isComplete).toBe(true);
    expect(getSetCompletionTitle(progress.percentComplete)).toBe('Set Champion');
  });

  test('does not double-celebrate already completed set', () => {
    const totalCards = 100;

    // First completion - should celebrate
    expect(shouldCelebrateSetCompletion(99, 100, totalCards)).toBe(true);

    // Adding more cards after completion - should not celebrate again
    expect(shouldCelebrateSetCompletion(100, 101, totalCards)).toBe(false);
    expect(shouldCelebrateSetCompletion(101, 102, totalCards)).toBe(false);
  });
});

describe('Integration: Small set completion', () => {
  test('handles small sets correctly', () => {
    const totalCards = 5;

    // Progress through small set
    expect(getSetCompletionProgress(1, totalCards).percentComplete).toBe(20);
    expect(getSetCompletionProgress(2, totalCards).percentComplete).toBe(40);
    expect(getSetCompletionProgress(3, totalCards).percentComplete).toBe(60);
    expect(getSetCompletionProgress(4, totalCards).percentComplete).toBe(80);
    expect(getSetCompletionProgress(5, totalCards).percentComplete).toBe(100);

    // Celebration triggers correctly
    expect(shouldCelebrateSetCompletion(4, 5, totalCards)).toBe(true);
  });
});
