'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  type StampState,
  type WeeklyStampProgress,
  DEFAULT_STAMP_STATE,
  loadStampState,
  saveStampState,
  buildWeeklyProgress,
  canCollectStampToday,
  collectStamp,
  canClaimWeeklyReward,
  claimWeeklyReward,
  cleanupOldStampData,
  getMilestoneProgress,
  WEEKLY_STAMP_REWARD,
} from '@/lib/dailyStamps';

// ============================================================================
// TYPES
// ============================================================================

interface DailyStampContextValue {
  /** Current stamp state */
  state: StampState;
  /** Weekly progress */
  weeklyProgress: WeeklyStampProgress;
  /** Whether stamp can be collected today */
  canCollectToday: boolean;
  /** Whether weekly reward can be claimed */
  canClaim: boolean;
  /** Collect today's stamp */
  collectTodayStamp: () => boolean;
  /** Claim the weekly reward */
  claimReward: () => boolean;
  /** Milestone progress */
  milestoneProgress: ReturnType<typeof getMilestoneProgress>;
  /** Weekly reward info */
  weeklyReward: typeof WEEKLY_STAMP_REWARD;
  /** Loading state */
  isLoading: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const DailyStampContext = createContext<DailyStampContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface DailyStampProviderProps {
  children: ReactNode;
}

export function DailyStampProvider({ children }: DailyStampProviderProps) {
  const [state, setState] = useState<StampState>(DEFAULT_STAMP_STATE);
  const [isLoading, setIsLoading] = useState(true);

  // Load state from localStorage on mount
  useEffect(() => {
    const loaded = loadStampState();
    const cleaned = cleanupOldStampData(loaded);
    setState(cleaned);
    if (cleaned !== loaded) {
      saveStampState(cleaned);
    }
    setIsLoading(false);
  }, []);

  // Compute derived state
  const weeklyProgress = useMemo(
    () => buildWeeklyProgress(state.collectedDates, state.rewardClaimedWeeks),
    [state.collectedDates, state.rewardClaimedWeeks]
  );

  const canCollectToday = useMemo(
    () => canCollectStampToday(state.collectedDates),
    [state.collectedDates]
  );

  const canClaim = useMemo(() => canClaimWeeklyReward(state), [state]);

  const milestoneProgress = useMemo(
    () => getMilestoneProgress(state.totalStampsCollected),
    [state.totalStampsCollected]
  );

  // Actions
  const collectTodayStamp = useCallback(() => {
    if (!canCollectToday) return false;
    const newState = collectStamp(state);
    setState(newState);
    saveStampState(newState);
    return true;
  }, [state, canCollectToday]);

  const claimReward = useCallback(() => {
    if (!canClaim) return false;
    const newState = claimWeeklyReward(state);
    setState(newState);
    saveStampState(newState);
    return true;
  }, [state, canClaim]);

  const value: DailyStampContextValue = useMemo(
    () => ({
      state,
      weeklyProgress,
      canCollectToday,
      canClaim,
      collectTodayStamp,
      claimReward,
      milestoneProgress,
      weeklyReward: WEEKLY_STAMP_REWARD,
      isLoading,
    }),
    [
      state,
      weeklyProgress,
      canCollectToday,
      canClaim,
      collectTodayStamp,
      claimReward,
      milestoneProgress,
      isLoading,
    ]
  );

  return (
    <DailyStampContext.Provider value={value}>{children}</DailyStampContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useDailyStamps(): DailyStampContextValue {
  const context = useContext(DailyStampContext);
  if (!context) {
    throw new Error('useDailyStamps must be used within a DailyStampProvider');
  }
  return context;
}
