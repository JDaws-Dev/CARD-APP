/**
 * Pure utility functions for collection milestone tracking and celebration.
 * This module handles detecting when users reach collection milestones
 * (first 10, 50, 100, 500 cards) and provides celebration data for the UI.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface MilestoneDefinition {
  threshold: number;
  key: string;
  name: string;
  description: string;
  celebrationMessage: string;
  icon: string;
  confettiType: 'basic' | 'stars' | 'fireworks' | 'rainbow';
}

export interface MilestoneReachedData {
  milestone: MilestoneDefinition;
  previousCount: number;
  newCount: number;
  reachedAt: number;
  isFirstTime: boolean;
}

export interface MilestoneProgress {
  currentCount: number;
  currentMilestone: MilestoneDefinition | null;
  nextMilestone: MilestoneDefinition | null;
  cardsToNextMilestone: number;
  percentToNextMilestone: number;
  allMilestones: Array<MilestoneDefinition & { reached: boolean; reachedAt?: number }>;
}

export interface CelebrationData {
  shouldCelebrate: boolean;
  milestone: MilestoneDefinition | null;
  message: string;
  confettiType: 'basic' | 'stars' | 'fireworks' | 'rainbow' | null;
  duration: number; // milliseconds
}

// ============================================================================
// MILESTONE DEFINITIONS
// ============================================================================

/**
 * Collection milestone definitions with celebration data.
 * Thresholds: 10, 50, 100, 500 cards (as specified in the task)
 */
export const COLLECTION_MILESTONES: readonly MilestoneDefinition[] = [
  {
    threshold: 10,
    key: 'milestone_10',
    name: 'Getting Started',
    description: 'Collected your first 10 cards',
    celebrationMessage: "You've collected 10 cards! Your collection is off to a great start!",
    icon: '🌟',
    confettiType: 'basic',
  },
  {
    threshold: 50,
    key: 'milestone_50',
    name: 'Rising Collector',
    description: 'Collected 50 cards',
    celebrationMessage: "50 cards! You're becoming a real collector now!",
    icon: '✨',
    confettiType: 'stars',
  },
  {
    threshold: 100,
    key: 'milestone_100',
    name: 'Century Club',
    description: 'Collected 100 cards',
    celebrationMessage: "100 cards! Welcome to the Century Club! You're a dedicated collector!",
    icon: '🎉',
    confettiType: 'fireworks',
  },
  {
    threshold: 500,
    key: 'milestone_500',
    name: 'Master Collector',
    description: 'Collected 500 cards',
    celebrationMessage: "500 cards! Incredible! You're a true Pokemon Master Collector!",
    icon: '🏆',
    confettiType: 'rainbow',
  },
] as const;

// ============================================================================
// MILESTONE DETECTION
// ============================================================================

/**
 * Checks if a milestone was just reached by comparing previous and new card counts.
 * Returns the milestone that was crossed, if any.
 */
export function checkMilestoneReached(
  previousCount: number,
  newCount: number
): MilestoneDefinition | null {
  // Must be adding cards, not removing
  if (newCount <= previousCount) {
    return null;
  }

  // Find the highest milestone that was crossed
  // (new count >= threshold AND previous count < threshold)
  let crossedMilestone: MilestoneDefinition | null = null;

  for (const milestone of COLLECTION_MILESTONES) {
    if (newCount >= milestone.threshold && previousCount < milestone.threshold) {
      crossedMilestone = milestone;
    }
  }

  return crossedMilestone;
}

/**
 * Gets all milestones that were crossed in a single operation.
 * Useful when adding multiple cards at once.
 */
export function getAllMilestonesCrossed(
  previousCount: number,
  newCount: number
): MilestoneDefinition[] {
  if (newCount <= previousCount) {
    return [];
  }

  return COLLECTION_MILESTONES.filter(
    (milestone) => newCount >= milestone.threshold && previousCount < milestone.threshold
  );
}

/**
 * Creates milestone reached data with all necessary information for the UI.
 */
export function createMilestoneReachedData(
  previousCount: number,
  newCount: number,
  alreadyCelebrated: string[] = []
): MilestoneReachedData | null {
  const milestone = checkMilestoneReached(previousCount, newCount);
  if (!milestone) {
    return null;
  }

  return {
    milestone,
    previousCount,
    newCount,
    reachedAt: Date.now(),
    isFirstTime: !alreadyCelebrated.includes(milestone.key),
  };
}

// ============================================================================
// MILESTONE PROGRESS
// ============================================================================

/**
 * Gets the current milestone for a given card count.
 * Returns the highest milestone reached.
 */
export function getCurrentMilestone(cardCount: number): MilestoneDefinition | null {
  let currentMilestone: MilestoneDefinition | null = null;

  for (const milestone of COLLECTION_MILESTONES) {
    if (cardCount >= milestone.threshold) {
      currentMilestone = milestone;
    }
  }

  return currentMilestone;
}

/**
 * Gets the next milestone to reach for a given card count.
 * Returns null if all milestones are reached.
 */
export function getNextMilestone(cardCount: number): MilestoneDefinition | null {
  for (const milestone of COLLECTION_MILESTONES) {
    if (cardCount < milestone.threshold) {
      return milestone;
    }
  }
  return null;
}

/**
 * Gets a milestone by its key.
 */
export function getMilestoneByKey(key: string): MilestoneDefinition | null {
  return COLLECTION_MILESTONES.find((m) => m.key === key) ?? null;
}

/**
 * Gets a milestone by its threshold.
 */
export function getMilestoneByThreshold(threshold: number): MilestoneDefinition | null {
  return COLLECTION_MILESTONES.find((m) => m.threshold === threshold) ?? null;
}

/**
 * Calculates cards needed to reach the next milestone.
 */
export function cardsToNextMilestone(cardCount: number): number {
  const next = getNextMilestone(cardCount);
  if (!next) {
    return 0;
  }
  return next.threshold - cardCount;
}

/**
 * Calculates percentage progress toward the next milestone.
 */
export function percentToNextMilestone(cardCount: number): number {
  const next = getNextMilestone(cardCount);
  if (!next) {
    return 100;
  }

  const current = getCurrentMilestone(cardCount);
  const startThreshold = current?.threshold ?? 0;
  const range = next.threshold - startThreshold;

  if (range <= 0) {
    return 100;
  }

  const progress = cardCount - startThreshold;
  return Math.round((progress / range) * 100);
}

/**
 * Gets complete milestone progress information for the UI.
 */
export function getMilestoneProgress(
  cardCount: number,
  celebratedMilestones: Array<{ key: string; reachedAt: number }> = []
): MilestoneProgress {
  const celebratedMap = new Map(celebratedMilestones.map((m) => [m.key, m.reachedAt]));

  return {
    currentCount: cardCount,
    currentMilestone: getCurrentMilestone(cardCount),
    nextMilestone: getNextMilestone(cardCount),
    cardsToNextMilestone: cardsToNextMilestone(cardCount),
    percentToNextMilestone: percentToNextMilestone(cardCount),
    allMilestones: COLLECTION_MILESTONES.map((milestone) => ({
      ...milestone,
      reached: cardCount >= milestone.threshold,
      reachedAt: celebratedMap.get(milestone.key),
    })),
  };
}

// ============================================================================
// CELEBRATION DATA
// ============================================================================

/**
 * Creates celebration data for the UI when a milestone is reached.
 */
export function createCelebrationData(
  milestoneReached: MilestoneDefinition | null
): CelebrationData {
  if (!milestoneReached) {
    return {
      shouldCelebrate: false,
      milestone: null,
      message: '',
      confettiType: null,
      duration: 0,
    };
  }

  // Higher milestones get longer celebration durations
  const durationByConfetti: Record<string, number> = {
    basic: 2000,
    stars: 3000,
    fireworks: 4000,
    rainbow: 5000,
  };

  return {
    shouldCelebrate: true,
    milestone: milestoneReached,
    message: milestoneReached.celebrationMessage,
    confettiType: milestoneReached.confettiType,
    duration: durationByConfetti[milestoneReached.confettiType] ?? 3000,
  };
}

/**
 * Gets celebration message based on how many cards were just added.
 * Provides context-aware messages.
 */
export function getCelebrationMessage(
  milestone: MilestoneDefinition,
  cardsJustAdded: number
): string {
  if (cardsJustAdded > 1) {
    return `${milestone.celebrationMessage} You added ${cardsJustAdded} cards at once!`;
  }
  return milestone.celebrationMessage;
}

// ============================================================================
// MILESTONE VALIDATION
// ============================================================================

/**
 * Validates that a milestone key is valid.
 */
export function isValidMilestoneKey(key: string): boolean {
  return COLLECTION_MILESTONES.some((m) => m.key === key);
}

/**
 * Gets all milestone thresholds.
 */
export function getMilestoneThresholds(): number[] {
  return COLLECTION_MILESTONES.map((m) => m.threshold);
}

/**
 * Gets all milestone keys.
 */
export function getMilestoneKeys(): string[] {
  return COLLECTION_MILESTONES.map((m) => m.key);
}

// ============================================================================
// MILESTONE TRACKING HELPERS
// ============================================================================

/**
 * Determines which milestones have been reached for a given card count.
 */
export function getReachedMilestones(cardCount: number): MilestoneDefinition[] {
  return COLLECTION_MILESTONES.filter((m) => cardCount >= m.threshold);
}

/**
 * Determines which milestones have NOT been reached for a given card count.
 */
export function getUnreachedMilestones(cardCount: number): MilestoneDefinition[] {
  return COLLECTION_MILESTONES.filter((m) => cardCount < m.threshold);
}

/**
 * Checks if all milestones have been reached.
 */
export function hasReachedAllMilestones(cardCount: number): boolean {
  const lastMilestone = COLLECTION_MILESTONES[COLLECTION_MILESTONES.length - 1];
  return cardCount >= lastMilestone.threshold;
}

/**
 * Gets the number of milestones reached.
 */
export function countReachedMilestones(cardCount: number): number {
  return getReachedMilestones(cardCount).length;
}

/**
 * Gets the total number of milestones available.
 */
export function getTotalMilestones(): number {
  return COLLECTION_MILESTONES.length;
}

// ============================================================================
// UI HELPER FUNCTIONS
// ============================================================================

/**
 * Formats milestone progress as a display string.
 */
export function formatMilestoneProgress(cardCount: number): string {
  const next = getNextMilestone(cardCount);
  if (!next) {
    return 'All milestones reached!';
  }
  const cardsNeeded = cardsToNextMilestone(cardCount);
  if (cardsNeeded === 1) {
    return `1 more card to ${next.name}`;
  }
  return `${cardsNeeded} more cards to ${next.name}`;
}

/**
 * Gets the icon for the current progress level.
 */
export function getCurrentProgressIcon(cardCount: number): string {
  const current = getCurrentMilestone(cardCount);
  return current?.icon ?? '🃏';
}

/**
 * Gets motivational message based on progress.
 */
export function getMotivationalMessage(cardCount: number): string {
  const next = getNextMilestone(cardCount);
  if (!next) {
    return "You've reached every milestone! Amazing collection!";
  }

  const percent = percentToNextMilestone(cardCount);

  if (percent >= 90) {
    return `Almost there! Just a few more cards to ${next.name}!`;
  }
  if (percent >= 75) {
    return `Great progress! ${next.name} is within reach!`;
  }
  if (percent >= 50) {
    return `Halfway to ${next.name}! Keep collecting!`;
  }
  if (percent >= 25) {
    return `Good start toward ${next.name}!`;
  }
  return `Every card brings you closer to ${next.name}!`;
}

/**
 * Creates a summary of milestone achievements for display.
 */
export function getMilestoneSummary(cardCount: number): {
  reached: number;
  total: number;
  progressText: string;
  icon: string;
} {
  return {
    reached: countReachedMilestones(cardCount),
    total: getTotalMilestones(),
    progressText: formatMilestoneProgress(cardCount),
    icon: getCurrentProgressIcon(cardCount),
  };
}
