/**
 * Streak Repair with XP Utility Functions
 *
 * Allows users to spend accumulated XP to repair a recently broken streak.
 * This teaches consequence/value while providing a recovery mechanism.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface StreakRepairConfig {
  /** Base XP cost to repair 1 day of broken streak */
  baseCostPerDay: number;
  /** Maximum number of days that can be repaired */
  maxRepairDays: number;
  /** Time window in hours after streak breaks that repair is available */
  repairWindowHours: number;
  /** Multiplier applied based on streak length (longer streaks cost more) */
  streakLengthMultiplier: number;
}

export interface StreakRepairState {
  /** Whether streak repair is enabled */
  enabled: boolean;
  /** History of repairs made */
  repairHistory: StreakRepairUsage[];
  /** Timestamp of last streak break (ISO string) */
  lastStreakBreak: string | null;
  /** Streak count when it broke */
  brokenStreakCount: number;
  /** Days missed that can be repaired */
  missedDays: string[];
}

export interface StreakRepairUsage {
  /** Date the repair was made (ISO string) */
  repairedOn: string;
  /** The dates that were repaired */
  repairedDates: string[];
  /** XP spent on the repair */
  xpSpent: number;
  /** Streak count restored */
  streakRestored: number;
}

export interface StreakRepairAvailability {
  /** Whether repair is currently available */
  isAvailable: boolean;
  /** Reason why repair is/isn't available */
  reason: string;
  /** Number of days that can be repaired */
  daysToRepair: number;
  /** XP cost to repair */
  xpCost: number;
  /** Hours remaining in repair window */
  hoursRemaining: number;
  /** Current streak that would be restored */
  streakToRestore: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** LocalStorage key for streak repair state */
export const STREAK_REPAIR_STORAGE_KEY = 'carddex-streak-repair-state';

/** Default configuration */
export const DEFAULT_REPAIR_CONFIG: StreakRepairConfig = {
  baseCostPerDay: 10,
  maxRepairDays: 3,
  repairWindowHours: 48,
  streakLengthMultiplier: 0.5,
};

/** Default state */
export const DEFAULT_REPAIR_STATE: StreakRepairState = {
  enabled: true,
  repairHistory: [],
  lastStreakBreak: null,
  brokenStreakCount: 0,
  missedDays: [],
};

// ============================================================================
// XP CALCULATION
// ============================================================================

/**
 * Calculate XP cost to repair a broken streak
 *
 * Formula: (baseCostPerDay * daysToRepair) + (brokenStreakCount * streakLengthMultiplier * daysToRepair)
 *
 * This makes longer streaks more valuable/expensive to repair
 */
export function calculateRepairCost(
  daysToRepair: number,
  brokenStreakCount: number,
  config: StreakRepairConfig = DEFAULT_REPAIR_CONFIG
): number {
  if (daysToRepair <= 0) return 0;

  const cappedDays = Math.min(daysToRepair, config.maxRepairDays);
  const baseCost = config.baseCostPerDay * cappedDays;
  const streakBonus = Math.floor(brokenStreakCount * config.streakLengthMultiplier * cappedDays);

  return baseCost + streakBonus;
}

/**
 * Get cost breakdown for display
 */
export function getRepairCostBreakdown(
  daysToRepair: number,
  brokenStreakCount: number,
  config: StreakRepairConfig = DEFAULT_REPAIR_CONFIG
): {
  baseCost: number;
  streakBonus: number;
  totalCost: number;
  perDayCost: number;
} {
  const cappedDays = Math.min(daysToRepair, config.maxRepairDays);
  const baseCost = config.baseCostPerDay * cappedDays;
  const streakBonus = Math.floor(brokenStreakCount * config.streakLengthMultiplier * cappedDays);
  const totalCost = baseCost + streakBonus;

  return {
    baseCost,
    streakBonus,
    totalCost,
    perDayCost: cappedDays > 0 ? Math.ceil(totalCost / cappedDays) : 0,
  };
}

// ============================================================================
// REPAIR AVAILABILITY LOGIC
// ============================================================================

/**
 * Calculate hours remaining in repair window
 */
export function getHoursRemaining(
  lastStreakBreak: string | null,
  config: StreakRepairConfig = DEFAULT_REPAIR_CONFIG
): number {
  if (!lastStreakBreak) return 0;

  const breakTime = new Date(lastStreakBreak).getTime();
  const now = Date.now();
  const elapsed = (now - breakTime) / (1000 * 60 * 60); // hours
  const remaining = Math.max(0, config.repairWindowHours - elapsed);

  return Math.floor(remaining);
}

/**
 * Check if repair window has expired
 */
export function isRepairWindowExpired(
  lastStreakBreak: string | null,
  config: StreakRepairConfig = DEFAULT_REPAIR_CONFIG
): boolean {
  return getHoursRemaining(lastStreakBreak, config) <= 0;
}

/**
 * Check repair availability status
 */
export function checkRepairAvailability(
  state: StreakRepairState,
  currentXP: number,
  config: StreakRepairConfig = DEFAULT_REPAIR_CONFIG
): StreakRepairAvailability {
  // Not enabled
  if (!state.enabled) {
    return {
      isAvailable: false,
      reason: 'Streak repair is disabled',
      daysToRepair: 0,
      xpCost: 0,
      hoursRemaining: 0,
      streakToRestore: 0,
    };
  }

  // No broken streak
  if (!state.lastStreakBreak || state.brokenStreakCount === 0) {
    return {
      isAvailable: false,
      reason: 'No broken streak to repair',
      daysToRepair: 0,
      xpCost: 0,
      hoursRemaining: 0,
      streakToRestore: 0,
    };
  }

  // Check repair window
  const hoursRemaining = getHoursRemaining(state.lastStreakBreak, config);
  if (hoursRemaining <= 0) {
    return {
      isAvailable: false,
      reason: 'Repair window has expired',
      daysToRepair: 0,
      xpCost: 0,
      hoursRemaining: 0,
      streakToRestore: 0,
    };
  }

  // Calculate repair cost
  const daysToRepair = Math.min(state.missedDays.length, config.maxRepairDays);
  const xpCost = calculateRepairCost(daysToRepair, state.brokenStreakCount, config);

  // Check if user has enough XP
  if (currentXP < xpCost) {
    return {
      isAvailable: false,
      reason: `Not enough XP (need ${xpCost}, have ${currentXP})`,
      daysToRepair,
      xpCost,
      hoursRemaining,
      streakToRestore: state.brokenStreakCount,
    };
  }

  return {
    isAvailable: true,
    reason: `Repair available for ${xpCost} XP`,
    daysToRepair,
    xpCost,
    hoursRemaining,
    streakToRestore: state.brokenStreakCount,
  };
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Record a streak break for potential repair
 */
export function recordStreakBreak(
  state: StreakRepairState,
  brokenStreakCount: number,
  missedDays: string[]
): StreakRepairState {
  return {
    ...state,
    lastStreakBreak: new Date().toISOString(),
    brokenStreakCount,
    missedDays: missedDays.slice(0, DEFAULT_REPAIR_CONFIG.maxRepairDays),
  };
}

/**
 * Clear any pending repair opportunity
 */
export function clearPendingRepair(state: StreakRepairState): StreakRepairState {
  return {
    ...state,
    lastStreakBreak: null,
    brokenStreakCount: 0,
    missedDays: [],
  };
}

/**
 * Consume XP to repair streak
 */
export function executeRepair(
  state: StreakRepairState,
  xpCost: number,
  config: StreakRepairConfig = DEFAULT_REPAIR_CONFIG
): { newState: StreakRepairState; repairedDates: string[] } {
  const daysToRepair = Math.min(state.missedDays.length, config.maxRepairDays);
  const repairedDates = state.missedDays.slice(0, daysToRepair);

  const repair: StreakRepairUsage = {
    repairedOn: new Date().toISOString(),
    repairedDates,
    xpSpent: xpCost,
    streakRestored: state.brokenStreakCount,
  };

  // Clean up old history (keep last 10)
  const newHistory = [...state.repairHistory, repair].slice(-10);

  return {
    newState: {
      ...state,
      repairHistory: newHistory,
      lastStreakBreak: null,
      brokenStreakCount: 0,
      missedDays: [],
    },
    repairedDates,
  };
}

// ============================================================================
// LOCALSTORAGE PERSISTENCE
// ============================================================================

/**
 * Save streak repair state to localStorage
 */
export function saveStreakRepairState(state: StreakRepairState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STREAK_REPAIR_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save streak repair state:', error);
  }
}

/**
 * Load streak repair state from localStorage
 */
export function loadStreakRepairState(): StreakRepairState {
  if (typeof window === 'undefined') return DEFAULT_REPAIR_STATE;

  try {
    const saved = localStorage.getItem(STREAK_REPAIR_STORAGE_KEY);
    if (!saved) return DEFAULT_REPAIR_STATE;

    const parsed = JSON.parse(saved);

    // Validate structure
    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULT_REPAIR_STATE;
    }

    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      repairHistory: Array.isArray(parsed.repairHistory) ? parsed.repairHistory : [],
      lastStreakBreak:
        typeof parsed.lastStreakBreak === 'string' ? parsed.lastStreakBreak : null,
      brokenStreakCount:
        typeof parsed.brokenStreakCount === 'number' ? parsed.brokenStreakCount : 0,
      missedDays: Array.isArray(parsed.missedDays) ? parsed.missedDays : [],
    };
  } catch (error) {
    console.error('Failed to load streak repair state:', error);
    return DEFAULT_REPAIR_STATE;
  }
}

/**
 * Clear streak repair state from localStorage
 */
export function clearStreakRepairState(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STREAK_REPAIR_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear streak repair state:', error);
  }
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Format repair cost for display
 */
export function formatRepairCost(xpCost: number): string {
  return `${xpCost} XP`;
}

/**
 * Get user-friendly description of streak repair
 */
export function getStreakRepairDescription(): string {
  return 'Spend your earned XP to repair a recently broken streak. The cost depends on how long your streak was and how many days you missed.';
}

/**
 * Get tooltip text for streak repair
 */
export function getStreakRepairTooltip(availability: StreakRepairAvailability): string {
  if (availability.isAvailable) {
    return `Repair ${availability.daysToRepair} missed day${availability.daysToRepair !== 1 ? 's' : ''} and restore your ${availability.streakToRestore}-day streak for ${availability.xpCost} XP. ${availability.hoursRemaining} hours remaining.`;
  }
  return availability.reason;
}

/**
 * Get aria-label for streak repair button
 */
export function getStreakRepairAriaLabel(availability: StreakRepairAvailability): string {
  if (availability.isAvailable) {
    return `Repair streak: Spend ${availability.xpCost} XP to restore your ${availability.streakToRestore}-day streak. ${availability.hoursRemaining} hours remaining to repair.`;
  }
  return `Streak repair unavailable: ${availability.reason}`;
}

/**
 * Format hours remaining for display
 */
export function formatTimeRemaining(hours: number): string {
  if (hours <= 0) return 'Expired';
  if (hours < 1) return 'Less than 1 hour';
  if (hours === 1) return '1 hour left';
  if (hours < 24) return `${hours} hours left`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days === 1) {
    return remainingHours > 0 ? `1 day, ${remainingHours}h left` : '1 day left';
  }
  return `${days} days left`;
}

/**
 * Get color class based on repair availability
 */
export function getRepairColorClass(availability: StreakRepairAvailability): string {
  if (!availability.isAvailable) {
    return 'text-gray-400';
  }
  if (availability.hoursRemaining <= 6) {
    return 'text-red-500'; // Urgent
  }
  if (availability.hoursRemaining <= 12) {
    return 'text-amber-500'; // Warning
  }
  return 'text-purple-500'; // Normal
}

/**
 * Get urgency level for UI styling
 */
export function getRepairUrgency(
  hoursRemaining: number
): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  if (hoursRemaining <= 0) return 'none';
  if (hoursRemaining <= 3) return 'critical';
  if (hoursRemaining <= 6) return 'high';
  if (hoursRemaining <= 12) return 'medium';
  return 'low';
}
