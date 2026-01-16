/**
 * Set Completion Celebration Utilities
 *
 * This module provides utilities for detecting and celebrating set completion milestones.
 * When a user collects all cards in a Pokemon TCG set, a big celebration is triggered.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SetCompletionInfo {
  setId: string;
  setName: string;
  totalCards: number;
  ownedCards: number;
  setSymbolUrl?: string;
  setLogoUrl?: string;
}

export interface SetCompletionProgress {
  percentComplete: number;
  cardsNeeded: number;
  isComplete: boolean;
}

export interface SetCompletionCheckResult {
  wasComplete: boolean;
  isNowComplete: boolean;
  justCompleted: boolean;
}

// ============================================================================
// SET COMPLETION DETECTION
// ============================================================================

/**
 * Calculate completion progress for a set
 */
export function getSetCompletionProgress(
  ownedCards: number,
  totalCards: number
): SetCompletionProgress {
  if (totalCards <= 0) {
    return {
      percentComplete: 0,
      cardsNeeded: 0,
      isComplete: false,
    };
  }

  const percentComplete = Math.round((ownedCards / totalCards) * 100);
  const cardsNeeded = Math.max(0, totalCards - ownedCards);
  const isComplete = ownedCards >= totalCards;

  return {
    percentComplete: Math.min(percentComplete, 100),
    cardsNeeded,
    isComplete,
  };
}

/**
 * Check if a set was just completed (crossed the 100% threshold)
 */
export function checkSetJustCompleted(
  previousOwnedCount: number,
  currentOwnedCount: number,
  totalCards: number
): SetCompletionCheckResult {
  if (totalCards <= 0) {
    return {
      wasComplete: false,
      isNowComplete: false,
      justCompleted: false,
    };
  }

  const wasComplete = previousOwnedCount >= totalCards;
  const isNowComplete = currentOwnedCount >= totalCards;
  const justCompleted = !wasComplete && isNowComplete;

  return {
    wasComplete,
    isNowComplete,
    justCompleted,
  };
}

/**
 * Determine if a set completion celebration should be shown
 * Returns true only if the set was just completed (not if it was already complete)
 */
export function shouldCelebrateSetCompletion(
  previousOwnedCount: number | null,
  currentOwnedCount: number,
  totalCards: number
): boolean {
  // Don't celebrate if we don't have a valid previous count
  if (previousOwnedCount === null) {
    return false;
  }

  // Don't celebrate if total is 0 or negative
  if (totalCards <= 0) {
    return false;
  }

  // Don't celebrate if count went down
  if (currentOwnedCount < previousOwnedCount) {
    return false;
  }

  // Check if we just crossed the 100% threshold
  const result = checkSetJustCompleted(previousOwnedCount, currentOwnedCount, totalCards);
  return result.justCompleted;
}

// ============================================================================
// SET PROGRESS FORMATTING
// ============================================================================

/**
 * Format a user-friendly progress message
 */
export function formatSetProgress(ownedCards: number, totalCards: number): string {
  const progress = getSetCompletionProgress(ownedCards, totalCards);

  if (progress.isComplete) {
    return 'Set Complete!';
  }

  if (progress.cardsNeeded === 1) {
    return '1 card to go!';
  }

  return `${progress.cardsNeeded} cards to go`;
}

/**
 * Get a title/label based on completion percentage
 */
export function getSetCompletionTitle(percentComplete: number): string {
  if (percentComplete >= 100) {
    return 'Set Champion';
  }
  if (percentComplete >= 75) {
    return 'Set Master';
  }
  if (percentComplete >= 50) {
    return 'Set Adventurer';
  }
  if (percentComplete >= 25) {
    return 'Set Explorer';
  }
  return 'Getting Started';
}

/**
 * Get a gradient class name based on completion percentage
 */
export function getSetCompletionGradient(percentComplete: number): string {
  if (percentComplete >= 100) {
    return 'from-amber-400 via-yellow-300 to-orange-400';
  }
  if (percentComplete >= 75) {
    return 'from-purple-400 to-indigo-500';
  }
  if (percentComplete >= 50) {
    return 'from-blue-400 to-cyan-500';
  }
  if (percentComplete >= 25) {
    return 'from-emerald-400 to-teal-500';
  }
  return 'from-gray-400 to-gray-500';
}

// ============================================================================
// SET COMPLETION INFO BUILDERS
// ============================================================================

/**
 * Create a SetCompletionInfo object from set data
 */
export function createSetCompletionInfo(
  setId: string,
  setName: string,
  totalCards: number,
  setSymbolUrl?: string,
  setLogoUrl?: string
): SetCompletionInfo {
  return {
    setId,
    setName,
    totalCards,
    ownedCards: 0,
    setSymbolUrl,
    setLogoUrl,
  };
}

/**
 * Update the owned cards count in a SetCompletionInfo object
 */
export function updateSetCompletionInfo(
  info: SetCompletionInfo,
  ownedCards: number
): SetCompletionInfo {
  return {
    ...info,
    ownedCards,
  };
}

// ============================================================================
// CELEBRATION DATA
// ============================================================================

export interface CelebrationData {
  shouldCelebrate: boolean;
  setInfo: SetCompletionInfo | null;
  confettiCount: number;
  celebrationMessage: string;
  celebrationDuration: number;
}

/**
 * Create celebration data for a completed set
 */
export function createSetCelebrationData(setInfo: SetCompletionInfo | null): CelebrationData {
  if (!setInfo) {
    return {
      shouldCelebrate: false,
      setInfo: null,
      confettiCount: 0,
      celebrationMessage: '',
      celebrationDuration: 0,
    };
  }

  return {
    shouldCelebrate: true,
    setInfo,
    confettiCount: 200, // Big celebration!
    celebrationMessage: `You collected every card in ${setInfo.setName}!`,
    celebrationDuration: 5000, // 5 seconds for set completion
  };
}

/**
 * Get a motivational message based on set progress
 */
export function getSetMotivationalMessage(percentComplete: number, cardsNeeded: number): string {
  if (percentComplete >= 100) {
    return "Amazing! You've completed this set!";
  }
  if (percentComplete >= 90) {
    return `So close! Only ${cardsNeeded} more card${cardsNeeded === 1 ? '' : 's'} to go!`;
  }
  if (percentComplete >= 75) {
    return "You're almost there! Keep collecting!";
  }
  if (percentComplete >= 50) {
    return 'Halfway there! Great progress!';
  }
  if (percentComplete >= 25) {
    return 'Nice start! Keep adding cards!';
  }
  return 'Start your collection journey!';
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate set completion info
 */
export function isValidSetCompletionInfo(info: SetCompletionInfo): boolean {
  return (
    typeof info.setId === 'string' &&
    info.setId.length > 0 &&
    typeof info.setName === 'string' &&
    info.setName.length > 0 &&
    typeof info.totalCards === 'number' &&
    info.totalCards > 0 &&
    typeof info.ownedCards === 'number' &&
    info.ownedCards >= 0
  );
}

/**
 * Check if owned count is valid relative to total
 */
export function isValidOwnedCount(ownedCards: number, totalCards: number): boolean {
  return ownedCards >= 0 && ownedCards <= totalCards * 2; // Allow some buffer for duplicates
}
