/**
 * Comeback Rewards System
 *
 * Detects when users return after an absence and provides
 * special welcome back celebrations with bonus XP rewards.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ComebackReward {
  id: string;
  daysAway: number;
  bonusXP: number;
  title: string;
  message: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface ComebackState {
  lastVisitDate: string | null;
  lastComebackClaimed: string | null;
  totalComebacksEarned: number;
  totalBonusXPEarned: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Comeback reward tiers based on days away
 */
export const COMEBACK_TIERS: ComebackReward[] = [
  {
    id: 'comeback_3',
    daysAway: 3,
    bonusXP: 5,
    title: 'Welcome Back!',
    message: "We missed you! Here's a little bonus to get you started again.",
    tier: 'bronze',
  },
  {
    id: 'comeback_7',
    daysAway: 7,
    bonusXP: 15,
    title: 'Great to See You!',
    message: "It's been a week - here's some bonus XP to celebrate your return!",
    tier: 'silver',
  },
  {
    id: 'comeback_14',
    daysAway: 14,
    bonusXP: 30,
    title: 'Long Time No See!',
    message: "Two weeks away? No problem! Here's a big bonus to welcome you back!",
    tier: 'gold',
  },
  {
    id: 'comeback_30',
    daysAway: 30,
    bonusXP: 50,
    title: "You're Back!",
    message: "A whole month! We're so happy to see you - enjoy this special reward!",
    tier: 'platinum',
  },
];

/**
 * Tier visual configurations
 */
export const TIER_STYLES = {
  bronze: {
    gradient: 'from-amber-600 to-orange-700',
    glow: 'shadow-amber-500/40',
    icon: 'text-amber-100',
    badge: 'bg-amber-500/20 text-amber-200',
  },
  silver: {
    gradient: 'from-slate-400 to-gray-500',
    glow: 'shadow-slate-400/40',
    icon: 'text-slate-100',
    badge: 'bg-slate-500/20 text-slate-200',
  },
  gold: {
    gradient: 'from-yellow-400 to-amber-500',
    glow: 'shadow-yellow-400/50',
    icon: 'text-yellow-100',
    badge: 'bg-yellow-500/20 text-yellow-200',
  },
  platinum: {
    gradient: 'from-purple-500 to-pink-600',
    glow: 'shadow-purple-500/50',
    icon: 'text-purple-100',
    badge: 'bg-purple-500/20 text-purple-200',
  },
};

// Minimum days away to trigger comeback reward
export const MIN_DAYS_AWAY = 3;

// localStorage key
const STORAGE_KEY = 'carddex_comeback_state';

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate days between two dates
 */
export function getDaysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00');
  const d2 = new Date(date2 + 'T00:00:00');
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

// ============================================================================
// COMEBACK DETECTION
// ============================================================================

/**
 * Check if user qualifies for a comeback reward
 */
export function checkComebackEligibility(lastVisitDate: string | null): {
  eligible: boolean;
  daysAway: number;
  reward: ComebackReward | null;
} {
  if (!lastVisitDate) {
    return { eligible: false, daysAway: 0, reward: null };
  }

  const today = getToday();
  const daysAway = getDaysBetween(lastVisitDate, today);

  if (daysAway < MIN_DAYS_AWAY) {
    return { eligible: false, daysAway, reward: null };
  }

  // Find the appropriate reward tier (highest applicable)
  const applicableTiers = COMEBACK_TIERS.filter((tier) => daysAway >= tier.daysAway);

  if (applicableTiers.length === 0) {
    return { eligible: false, daysAway, reward: null };
  }

  // Return the highest tier the user qualifies for
  const reward = applicableTiers[applicableTiers.length - 1];

  return { eligible: true, daysAway, reward };
}

/**
 * Get reward for specific days away
 */
export function getRewardForDaysAway(daysAway: number): ComebackReward | null {
  const applicableTiers = COMEBACK_TIERS.filter((tier) => daysAway >= tier.daysAway);
  return applicableTiers.length > 0 ? applicableTiers[applicableTiers.length - 1] : null;
}

/**
 * Get the tier style configuration
 */
export function getTierStyle(tier: ComebackReward['tier']) {
  return TIER_STYLES[tier];
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Load comeback state from localStorage
 */
export function loadComebackState(): ComebackState {
  if (typeof window === 'undefined') {
    return {
      lastVisitDate: null,
      lastComebackClaimed: null,
      totalComebacksEarned: 0,
      totalBonusXPEarned: 0,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        lastVisitDate: parsed.lastVisitDate ?? null,
        lastComebackClaimed: parsed.lastComebackClaimed ?? null,
        totalComebacksEarned: parsed.totalComebacksEarned ?? 0,
        totalBonusXPEarned: parsed.totalBonusXPEarned ?? 0,
      };
    }
  } catch {
    // Ignore parse errors
  }

  return {
    lastVisitDate: null,
    lastComebackClaimed: null,
    totalComebacksEarned: 0,
    totalBonusXPEarned: 0,
  };
}

/**
 * Save comeback state to localStorage
 */
export function saveComebackState(state: ComebackState): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Record a visit (updates last visit date)
 */
export function recordVisit(): ComebackState {
  const state = loadComebackState();
  const today = getToday();

  // Only update if it's a new day
  if (state.lastVisitDate !== today) {
    const newState = {
      ...state,
      lastVisitDate: today,
    };
    saveComebackState(newState);
    return newState;
  }

  return state;
}

/**
 * Claim a comeback reward
 */
export function claimComebackReward(reward: ComebackReward): ComebackState {
  const state = loadComebackState();
  const today = getToday();

  const newState: ComebackState = {
    lastVisitDate: today,
    lastComebackClaimed: today,
    totalComebacksEarned: state.totalComebacksEarned + 1,
    totalBonusXPEarned: state.totalBonusXPEarned + reward.bonusXP,
  };

  saveComebackState(newState);
  return newState;
}

/**
 * Check if a comeback has already been claimed today
 */
export function hasComebackBeenClaimedToday(state: ComebackState): boolean {
  const today = getToday();
  return state.lastComebackClaimed === today;
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Format days away for display
 */
export function formatDaysAway(days: number): string {
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days === 7) return '1 week';
  if (days < 14) return `${days} days`;
  if (days === 14) return '2 weeks';
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  if (days === 30) return '1 month';
  return `${days} days`;
}

/**
 * Get encouraging message based on user's comeback history
 */
export function getComebackEncouragement(totalComebacks: number): string {
  if (totalComebacks === 0) return "Great to have you!";
  if (totalComebacks === 1) return "Welcome back again!";
  if (totalComebacks < 5) return "You keep coming back - we love it!";
  if (totalComebacks < 10) return "A dedicated collector!";
  return "You're always welcome here!";
}

/**
 * Get ARIA label for comeback reward
 */
export function getComebackAriaLabel(reward: ComebackReward, daysAway: number): string {
  return `Welcome back! You were away for ${formatDaysAway(daysAway)}. Claim ${reward.bonusXP} bonus XP.`;
}
