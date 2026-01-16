'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import {
  GiftIcon,
  SparklesIcon,
  BoltIcon,
  HeartIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import {
  type ComebackReward,
  type ComebackState,
  checkComebackEligibility,
  loadComebackState,
  recordVisit,
  claimComebackReward,
  hasComebackBeenClaimedToday,
  getTierStyle,
  formatDaysAway,
  getComebackEncouragement,
  getComebackAriaLabel,
} from '@/lib/comebackRewards';

// ============================================================================
// CONTEXT
// ============================================================================

interface ComebackContextType {
  checkForComeback: () => void;
  state: ComebackState;
}

const ComebackContext = createContext<ComebackContextType | null>(null);

export function useComebackRewards() {
  return useContext(ComebackContext);
}

// ============================================================================
// CELEBRATION MODAL
// ============================================================================

interface ComebackCelebrationProps {
  reward: ComebackReward;
  daysAway: number;
  onClaim: () => void;
  onDismiss: () => void;
}

function ComebackCelebration({ reward, daysAway, onClaim, onDismiss }: ComebackCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const tierStyle = getTierStyle(reward.tier);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClaim = useCallback(() => {
    setIsClaimed(true);
    onClaim();

    // Auto-close after showing success
    setTimeout(() => {
      onDismiss();
    }, 1500);
  }, [onClaim, onDismiss]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    },
    [onDismiss]
  );

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      onClick={onDismiss}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-labelledby="comeback-title"
      aria-describedby="comeback-description"
      aria-modal="true"
    >
      {/* Animated background rings */}
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div
          className={cn(
            'absolute h-48 w-48 animate-ping rounded-full bg-gradient-to-r opacity-20',
            tierStyle.gradient
          )}
          style={{ animationDuration: '1.5s' }}
        />
        <div
          className={cn(
            'absolute h-64 w-64 animate-ping rounded-full bg-gradient-to-r opacity-10',
            tierStyle.gradient
          )}
          style={{ animationDuration: '2s', animationDelay: '0.2s' }}
        />
        <div
          className={cn(
            'absolute h-80 w-80 animate-ping rounded-full bg-gradient-to-r opacity-5',
            tierStyle.gradient
          )}
          style={{ animationDuration: '2.5s', animationDelay: '0.4s' }}
        />
      </div>

      {/* Modal content */}
      <div
        className={cn(
          'relative mx-4 max-w-sm transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all duration-500',
          isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-10 scale-90 opacity-0'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Sparkle decorations */}
        <SparklesIcon
          className="absolute -right-2 -top-2 h-8 w-8 animate-pulse text-yellow-400"
          aria-hidden="true"
        />
        <SparklesIcon
          className="absolute -left-2 top-6 h-6 w-6 animate-pulse text-pink-400"
          style={{ animationDelay: '0.3s' }}
          aria-hidden="true"
        />
        <SparklesIcon
          className="absolute -bottom-1 right-6 h-5 w-5 animate-pulse text-indigo-400"
          style={{ animationDelay: '0.6s' }}
          aria-hidden="true"
        />

        {/* Gift icon */}
        <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
          <div
            className={cn(
              'absolute inset-0 animate-pulse rounded-full bg-gradient-to-r blur-lg',
              tierStyle.gradient
            )}
            aria-hidden="true"
          />
          <div
            className={cn(
              'relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r shadow-lg',
              tierStyle.gradient,
              tierStyle.glow
            )}
          >
            {isClaimed ? (
              <CheckCircleIcon className="h-8 w-8 text-white" />
            ) : (
              <GiftIcon className="h-8 w-8 text-white" />
            )}
          </div>
        </div>

        {/* Badge */}
        <div className="mb-2 text-center">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider',
              tierStyle.badge.replace('bg-', 'bg-gradient-to-r from-').replace('/20', '-500/20 to-').replace(' text-', '-600/20 text-'),
              'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700'
            )}
          >
            <HeartIcon className="h-3 w-3" aria-hidden="true" />
            {isClaimed ? 'Claimed!' : `${formatDaysAway(daysAway)} away`}
          </span>
        </div>

        {/* Title */}
        <h2
          id="comeback-title"
          className="mb-2 text-center text-2xl font-bold text-gray-800"
        >
          {isClaimed ? 'Bonus Collected!' : reward.title}
        </h2>

        {/* Message */}
        <p id="comeback-description" className="mb-4 text-center text-gray-600">
          {isClaimed ? 'Enjoy your bonus XP!' : reward.message}
        </p>

        {/* XP Reward */}
        <div
          className={cn(
            'mx-auto mb-6 flex w-fit items-center gap-2 rounded-full bg-gradient-to-r px-6 py-3 shadow-lg',
            tierStyle.gradient
          )}
        >
          <BoltIcon className="h-6 w-6 text-yellow-300" aria-hidden="true" />
          <span className="text-2xl font-bold text-white">+{reward.bonusXP} XP</span>
        </div>

        {/* Claim button */}
        {!isClaimed && (
          <button
            onClick={handleClaim}
            className={cn(
              'w-full rounded-2xl bg-gradient-to-r py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]',
              tierStyle.gradient
            )}
            aria-label={getComebackAriaLabel(reward, daysAway)}
          >
            <span className="flex items-center justify-center gap-2">
              <SparklesIcon className="h-5 w-5" aria-hidden="true" />
              Claim Reward!
            </span>
          </button>
        )}

        {isClaimed && (
          <p className="text-center text-sm text-gray-500">
            Keep collecting to earn more rewards!
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PROVIDER
// ============================================================================

interface ComebackProviderProps {
  children: ReactNode;
}

export function ComebackProvider({ children }: ComebackProviderProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const [state, setState] = useState<ComebackState>(loadComebackState);
  const [showCelebration, setShowCelebration] = useState<{
    reward: ComebackReward;
    daysAway: number;
  } | null>(null);
  const [hasCheckedThisSession, setHasCheckedThisSession] = useState(false);

  // Check for comeback when user logs in
  useEffect(() => {
    if (profileLoading || !profileId || hasCheckedThisSession) return;

    const currentState = loadComebackState();
    setState(currentState);

    // Check if already claimed today
    if (hasComebackBeenClaimedToday(currentState)) {
      recordVisit();
      setHasCheckedThisSession(true);
      return;
    }

    // Check eligibility
    const eligibility = checkComebackEligibility(currentState.lastVisitDate);

    if (eligibility.eligible && eligibility.reward) {
      // Show comeback celebration
      setShowCelebration({
        reward: eligibility.reward,
        daysAway: eligibility.daysAway,
      });
    } else {
      // Just record the visit
      const newState = recordVisit();
      setState(newState);
    }

    setHasCheckedThisSession(true);
  }, [profileId, profileLoading, hasCheckedThisSession]);

  const handleClaim = useCallback(() => {
    if (!showCelebration) return;

    const newState = claimComebackReward(showCelebration.reward);
    setState(newState);
  }, [showCelebration]);

  const handleDismiss = useCallback(() => {
    setShowCelebration(null);
    // Record visit after dismissing (whether claimed or not)
    const newState = recordVisit();
    setState(newState);
  }, []);

  const checkForComeback = useCallback(() => {
    const currentState = loadComebackState();
    setState(currentState);
  }, []);

  return (
    <ComebackContext.Provider value={{ checkForComeback, state }}>
      {children}

      {/* Comeback celebration modal */}
      {showCelebration && (
        <ComebackCelebration
          reward={showCelebration.reward}
          daysAway={showCelebration.daysAway}
          onClaim={handleClaim}
          onDismiss={handleDismiss}
        />
      )}
    </ComebackContext.Provider>
  );
}

// ============================================================================
// COMPACT STATUS DISPLAY
// ============================================================================

interface ComebackStatusProps {
  className?: string;
}

export function ComebackStatus({ className }: ComebackStatusProps) {
  const context = useComebackRewards();

  if (!context || context.state.totalComebacksEarned === 0) {
    return null;
  }

  const { state } = context;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 p-4',
        className
      )}
      role="region"
      aria-label="Comeback rewards stats"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-amber-500">
        <GiftIcon className="h-5 w-5 text-white" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800">
          {getComebackEncouragement(state.totalComebacksEarned)}
        </p>
        <p className="text-xs text-gray-500">
          {state.totalComebacksEarned} comeback{state.totalComebacksEarned !== 1 ? 's' : ''} earned
          {' '}&bull;{' '}
          {state.totalBonusXPEarned} bonus XP
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

export function ComebackStatusSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 rounded-2xl bg-gray-100 p-4">
      <div className="h-10 w-10 rounded-full bg-gray-200" />
      <div className="flex-1">
        <div className="mb-2 h-4 w-32 rounded bg-gray-200" />
        <div className="h-3 w-24 rounded bg-gray-200" />
      </div>
    </div>
  );
}
