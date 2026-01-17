'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import {
  WrenchScrewdriverIcon,
  BoltIcon,
  ClockIcon,
  FireIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  type StreakRepairState,
  type StreakRepairAvailability,
  DEFAULT_REPAIR_STATE,
  DEFAULT_REPAIR_CONFIG,
  loadStreakRepairState,
  saveStreakRepairState,
  checkRepairAvailability,
  executeRepair,
  clearPendingRepair,
  getRepairCostBreakdown,
  getStreakRepairDescription,
  getStreakRepairTooltip,
  getStreakRepairAriaLabel,
  formatTimeRemaining,
  formatRepairCost,
  getRepairUrgency,
} from '@/lib/streakRepair';

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function StreakRepairSkeleton() {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="mb-1 h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}

// ============================================================================
// REPAIR SUCCESS MODAL
// ============================================================================

interface RepairSuccessModalProps {
  streakRestored: number;
  xpSpent: number;
  onClose: () => void;
}

function RepairSuccessModal({ streakRestored, xpSpent, onClose }: RepairSuccessModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      onClose();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-500',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      onClick={onClose}
      role="dialog"
      aria-labelledby="repair-success-title"
      aria-modal="true"
    >
      {/* Animated background rings */}
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div
          className="absolute h-48 w-48 animate-ping rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 opacity-20"
          style={{ animationDuration: '1.5s' }}
        />
        <div
          className="absolute h-64 w-64 animate-ping rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 opacity-10"
          style={{ animationDuration: '2s', animationDelay: '0.2s' }}
        />
      </div>

      {/* Success card */}
      <div
        className={cn(
          'relative transform rounded-3xl bg-white p-8 shadow-2xl transition-all duration-500',
          isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-10 scale-50 opacity-0'
        )}
      >
        {/* Sparkle decorations */}
        <SparklesIcon
          className="absolute -right-3 -top-3 h-8 w-8 animate-pulse text-purple-400"
          aria-hidden="true"
        />
        <SparklesIcon
          className="absolute -left-3 -top-4 h-6 w-6 animate-pulse text-indigo-400"
          style={{ animationDelay: '0.3s' }}
          aria-hidden="true"
        />

        {/* Success badge */}
        <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 opacity-20" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 opacity-30" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 shadow-lg">
            <WrenchScrewdriverIcon className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
        </div>

        {/* Text content */}
        <div className="text-center">
          <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
            <CheckCircleIcon className="h-3 w-3" aria-hidden="true" />
            Streak Repaired!
          </span>
          <h2 id="repair-success-title" className="mb-2 text-2xl font-bold text-gray-800">
            {streakRestored}-Day Streak Restored
          </h2>
          <p className="flex items-center justify-center gap-2 text-gray-500">
            <BoltIcon className="h-4 w-4 text-purple-500" aria-hidden="true" />
            <span>-{xpSpent} XP spent</span>
          </p>

          {/* Fire animation */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <FireIcon className="h-8 w-8 animate-pulse text-orange-500" aria-hidden="true" />
            <span className="text-lg font-bold text-orange-600">{streakRestored} days</span>
            <FireIcon className="h-8 w-8 animate-pulse text-orange-500" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STREAK REPAIR STATUS CARD
// ============================================================================

interface StreakRepairStatusProps {
  /** Whether to show the repair button */
  showRepairButton?: boolean;
  /** Additional class name */
  className?: string;
}

export function StreakRepairStatus({ showRepairButton = true, className }: StreakRepairStatusProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const [state, setState] = useState<StreakRepairState>(DEFAULT_REPAIR_STATE);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastRepair, setLastRepair] = useState<{ streak: number; xp: number } | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);

  // Get user's XP (unique cards * 2)
  const collection = useQuery(
    api.collections.getCollection,
    profileId ? { profileId } : 'skip'
  );

  const currentXP = useMemo(() => {
    if (!collection) return 0;
    // Count unique cards (2 XP per unique card)
    const uniqueCards = new Set(collection.map((c) => c.cardId)).size;
    return uniqueCards * 2;
  }, [collection]);

  // Initialize from localStorage
  useEffect(() => {
    const savedState = loadStreakRepairState();
    setState(savedState);
    setIsInitialized(true);
  }, []);

  // Persist state changes
  useEffect(() => {
    if (!isInitialized) return;
    saveStreakRepairState(state);
  }, [state, isInitialized]);

  // Calculate availability
  const availability = useMemo(
    () => checkRepairAvailability(state, currentXP, DEFAULT_REPAIR_CONFIG),
    [state, currentXP]
  );

  // Cost breakdown
  const costBreakdown = useMemo(
    () =>
      getRepairCostBreakdown(
        state.missedDays.length,
        state.brokenStreakCount,
        DEFAULT_REPAIR_CONFIG
      ),
    [state.missedDays.length, state.brokenStreakCount]
  );

  const urgency = getRepairUrgency(availability.hoursRemaining);

  const handleRepair = useCallback(() => {
    if (!availability.isAvailable || isRepairing) return;

    setIsRepairing(true);

    // Execute repair
    const { newState } = executeRepair(state, availability.xpCost, DEFAULT_REPAIR_CONFIG);
    setState(newState);

    // Show success modal
    setLastRepair({
      streak: availability.streakToRestore,
      xp: availability.xpCost,
    });
    setShowSuccessModal(true);
    setIsRepairing(false);
  }, [availability, state, isRepairing]);

  const handleDismiss = useCallback(() => {
    setState((prev) => clearPendingRepair(prev));
  }, []);

  const handleCloseSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    setLastRepair(null);
  }, []);

  // Loading state
  if (profileLoading || !isInitialized) {
    return <StreakRepairSkeleton />;
  }

  // No repair opportunity
  if (!state.lastStreakBreak || state.brokenStreakCount === 0) {
    return null;
  }

  // Window expired
  if (availability.hoursRemaining <= 0) {
    return null;
  }

  const description = getStreakRepairDescription();
  const tooltip = getStreakRepairTooltip(availability);
  const ariaLabel = getStreakRepairAriaLabel(availability);

  const urgencyStyles = {
    none: '',
    low: 'ring-1 ring-purple-100',
    medium: 'ring-1 ring-amber-200',
    high: 'ring-2 ring-amber-300 animate-pulse',
    critical: 'ring-2 ring-red-400 animate-pulse',
  };

  return (
    <>
      <div
        className={cn(
          'rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 p-4 shadow-sm',
          urgencyStyles[urgency],
          className
        )}
        role="region"
        aria-label="Streak repair opportunity"
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors',
              availability.isAvailable
                ? 'bg-gradient-to-br from-purple-400 to-indigo-500'
                : 'bg-gray-200'
            )}
          >
            <WrenchScrewdriverIcon
              className={cn('h-5 w-5', availability.isAvailable ? 'text-white' : 'text-gray-400')}
              aria-hidden="true"
            />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-800">Repair Your Streak</h4>
              {urgency === 'critical' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  <ExclamationTriangleIcon className="h-3 w-3" aria-hidden="true" />
                  Urgent
                </span>
              )}
              {urgency === 'high' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <ClockIcon className="h-3 w-3" aria-hidden="true" />
                  Expiring Soon
                </span>
              )}
            </div>

            <p className="mt-0.5 text-sm text-gray-600">
              Restore your <span className="font-semibold">{availability.streakToRestore}-day</span>{' '}
              streak
            </p>

            {/* Time remaining */}
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{formatTimeRemaining(availability.hoursRemaining)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              aria-label="Dismiss repair opportunity"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="mt-3 rounded-lg bg-white/60 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Repair {availability.daysToRepair} missed day
              {availability.daysToRepair !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1 font-semibold text-purple-600">
              <BoltIcon className="h-4 w-4" aria-hidden="true" />
              {formatRepairCost(availability.xpCost)}
            </span>
          </div>

          {/* Cost details */}
          {costBreakdown.streakBonus > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              Base: {costBreakdown.baseCost} XP + Streak bonus: {costBreakdown.streakBonus} XP
            </div>
          )}

          {/* XP available */}
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-gray-500">Your XP:</span>
            <span
              className={cn('font-medium', availability.isAvailable ? 'text-green-600' : 'text-red-500')}
            >
              {currentXP} XP
            </span>
          </div>
        </div>

        {/* Repair button */}
        {showRepairButton && (
          <button
            onClick={handleRepair}
            disabled={!availability.isAvailable || isRepairing}
            className={cn(
              'mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              availability.isAvailable
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md hover:shadow-lg focus-visible:ring-purple-500'
                : 'cursor-not-allowed bg-gray-100 text-gray-400'
            )}
            aria-label={ariaLabel}
            title={tooltip}
          >
            {isRepairing ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>Repairing...</span>
              </>
            ) : availability.isAvailable ? (
              <>
                <WrenchScrewdriverIcon className="h-5 w-5" aria-hidden="true" />
                <span>Repair for {availability.xpCost} XP</span>
              </>
            ) : (
              <>
                <BoltIcon className="h-5 w-5" aria-hidden="true" />
                <span>Need {availability.xpCost - currentXP} more XP</span>
              </>
            )}
          </button>
        )}

        {/* Info box */}
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-purple-50/50 p-2.5">
          <InformationCircleIcon
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400"
            aria-hidden="true"
          />
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      </div>

      {/* Success modal */}
      {showSuccessModal && lastRepair && (
        <RepairSuccessModal
          streakRestored={lastRepair.streak}
          xpSpent={lastRepair.xp}
          onClose={handleCloseSuccessModal}
        />
      )}
    </>
  );
}

// ============================================================================
// COMPACT REPAIR INDICATOR
// ============================================================================

interface StreakRepairIndicatorProps {
  className?: string;
}

export function StreakRepairIndicator({ className }: StreakRepairIndicatorProps) {
  const [state, setState] = useState<StreakRepairState>(DEFAULT_REPAIR_STATE);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const savedState = loadStreakRepairState();
    setState(savedState);
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return <Skeleton className={cn('h-6 w-6 rounded-full', className)} />;
  }

  // No repair opportunity
  if (!state.lastStreakBreak || state.brokenStreakCount === 0) {
    return null;
  }

  const availability = checkRepairAvailability(state, Infinity, DEFAULT_REPAIR_CONFIG);

  if (availability.hoursRemaining <= 0) {
    return null;
  }

  const urgency = getRepairUrgency(availability.hoursRemaining);

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        urgency === 'critical' || urgency === 'high' ? 'animate-pulse' : '',
        className
      )}
      title={`Repair ${availability.streakToRestore}-day streak available - ${formatTimeRemaining(availability.hoursRemaining)}`}
      aria-label={`Streak repair available for ${availability.streakToRestore}-day streak`}
      role="status"
    >
      <WrenchScrewdriverIcon
        className={cn(
          'h-5 w-5',
          urgency === 'critical'
            ? 'text-red-500'
            : urgency === 'high'
              ? 'text-amber-500'
              : 'text-purple-500'
        )}
        aria-hidden="true"
      />
      {/* Badge */}
      <span
        className={cn(
          'absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[10px] font-bold text-white',
          urgency === 'critical'
            ? 'bg-red-500'
            : urgency === 'high'
              ? 'bg-amber-500'
              : 'bg-purple-500'
        )}
        aria-hidden="true"
      >
        !
      </span>
    </div>
  );
}
