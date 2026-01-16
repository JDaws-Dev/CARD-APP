'use client';

import { useState, useMemo } from 'react';
import {
  CurrencyDollarIcon,
  SparklesIcon,
  CalendarDaysIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface SavingsGoalCalculatorProps {
  /** Target card price (e.g., 50 for a $50 card) */
  targetPrice: number;
  /** Card name to display */
  cardName?: string;
  /** Callback when calculator is closed */
  onClose?: () => void;
  /** Optional className for container */
  className?: string;
}

interface SavingsResult {
  weeks: number;
  months: number;
  targetDate: Date;
  totalSaved: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WEEKLY_AMOUNTS = [1, 2, 3, 5, 10, 15, 20];
const DEFAULT_WEEKLY_AMOUNT = 5;

// Piggy bank fill levels (percentage thresholds)
const PIGGY_LEVELS = [0, 10, 25, 50, 75, 90, 100];

// ============================================================================
// PIGGY BANK COMPONENT
// ============================================================================

function PiggyBank({ fillPercent }: { fillPercent: number }) {
  // Determine the fill color based on progress
  const getFillColor = () => {
    if (fillPercent >= 100) return '#22c55e'; // green-500
    if (fillPercent >= 75) return '#84cc16'; // lime-500
    if (fillPercent >= 50) return '#eab308'; // yellow-500
    if (fillPercent >= 25) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  const clampedPercent = Math.min(100, Math.max(0, fillPercent));

  return (
    <div className="relative h-32 w-40">
      {/* Piggy bank SVG */}
      <svg viewBox="0 0 100 80" className="h-full w-full">
        {/* Background piggy shape */}
        <ellipse cx="50" cy="50" rx="35" ry="25" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="2" />
        {/* Fill level */}
        <defs>
          <clipPath id="piggyClip">
            <ellipse cx="50" cy="50" rx="33" ry="23" />
          </clipPath>
        </defs>
        <rect
          x="15"
          y={75 - clampedPercent * 0.5}
          width="70"
          height={clampedPercent * 0.5}
          fill={getFillColor()}
          clipPath="url(#piggyClip)"
          className="transition-all duration-700 ease-out"
        />
        {/* Snout */}
        <ellipse cx="85" cy="50" rx="8" ry="6" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="2" />
        <circle cx="83" cy="48" r="1.5" fill="#db2777" />
        <circle cx="87" cy="48" r="1.5" fill="#db2777" />
        {/* Ears */}
        <ellipse cx="30" cy="30" rx="8" ry="10" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="2" />
        <ellipse cx="60" cy="28" rx="8" ry="10" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="2" />
        {/* Eye */}
        <circle cx="70" cy="45" r="4" fill="white" stroke="#f9a8d4" strokeWidth="1" />
        <circle cx="71" cy="44" r="2" fill="#1f2937" />
        {/* Coin slot */}
        <rect x="40" y="22" width="15" height="4" rx="2" fill="#f9a8d4" />
        {/* Legs */}
        <rect x="25" y="70" width="8" height="8" rx="2" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="1" />
        <rect x="40" y="70" width="8" height="8" rx="2" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="1" />
        <rect x="55" y="70" width="8" height="8" rx="2" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="1" />
        <rect x="70" y="70" width="8" height="8" rx="2" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="1" />
        {/* Tail */}
        <path d="M15 45 Q5 45 8 35" fill="none" stroke="#f9a8d4" strokeWidth="3" strokeLinecap="round" />
      </svg>
      {/* Percentage label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-pink-700">{Math.round(clampedPercent)}%</span>
      </div>
    </div>
  );
}

// ============================================================================
// PROGRESS MILESTONE COMPONENT
// ============================================================================

function ProgressMilestones({ currentPercent }: { currentPercent: number }) {
  const milestones = [
    { percent: 25, label: 'Quarter way!' },
    { percent: 50, label: 'Halfway there!' },
    { percent: 75, label: 'Almost there!' },
    { percent: 100, label: 'Goal reached!' },
  ];

  return (
    <div className="mt-4 flex justify-between px-2">
      {milestones.map((milestone) => (
        <div
          key={milestone.percent}
          className={cn(
            'flex flex-col items-center transition-all duration-300',
            currentPercent >= milestone.percent ? 'opacity-100' : 'opacity-40'
          )}
        >
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300',
              currentPercent >= milestone.percent
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-400'
            )}
          >
            {currentPercent >= milestone.percent ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <span className="text-xs font-bold">{milestone.percent}</span>
            )}
          </div>
          <span className="mt-1 text-xs text-gray-500">{milestone.percent}%</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SavingsGoalCalculator({
  targetPrice,
  cardName = 'this card',
  onClose,
  className,
}: SavingsGoalCalculatorProps) {
  const [weeklyAmount, setWeeklyAmount] = useState(DEFAULT_WEEKLY_AMOUNT);
  const [showAllAmounts, setShowAllAmounts] = useState(false);

  // Calculate savings timeline
  const result = useMemo((): SavingsResult => {
    const weeks = Math.ceil(targetPrice / weeklyAmount);
    const months = weeks / 4.33; // Average weeks per month
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + weeks * 7);

    return {
      weeks,
      months,
      targetDate,
      totalSaved: weeks * weeklyAmount,
    };
  }, [targetPrice, weeklyAmount]);

  // Calculate progress preview (simulated weekly progress)
  const weeklyProgress = useMemo(() => {
    const progress: number[] = [];
    let current = 0;
    for (let i = 1; i <= result.weeks && i <= 12; i++) {
      current += weeklyAmount;
      progress.push(Math.min(100, (current / targetPrice) * 100));
    }
    return progress;
  }, [targetPrice, weeklyAmount, result.weeks]);

  // Format date nicely
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 p-6 shadow-lg',
        className
      )}
    >
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-gray-400 transition hover:bg-white/50 hover:text-gray-600"
          aria-label="Close savings calculator"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}

      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 shadow-md">
          <CurrencyDollarIcon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Savings Goal Calculator</h3>
        <p className="text-sm text-gray-500">
          Want {cardName}? Let&apos;s see how long it takes to save!
        </p>
      </div>

      {/* Target price display */}
      <div className="mb-6 rounded-xl bg-white/70 p-4 text-center shadow-sm">
        <p className="text-sm text-gray-500">Target Price</p>
        <p className="text-3xl font-bold text-pink-600">${targetPrice.toFixed(2)}</p>
      </div>

      {/* Weekly amount selector */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          How much can you save each week?
        </label>
        <div className="flex flex-wrap gap-2">
          {(showAllAmounts ? WEEKLY_AMOUNTS : WEEKLY_AMOUNTS.slice(0, 4)).map((amount) => (
            <button
              key={amount}
              onClick={() => setWeeklyAmount(amount)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                weeklyAmount === amount
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-pink-100'
              )}
            >
              ${amount}/week
            </button>
          ))}
          <button
            onClick={() => setShowAllAmounts(!showAllAmounts)}
            className="flex items-center gap-1 rounded-full bg-white px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100"
          >
            {showAllAmounts ? (
              <>
                Less <ChevronUpIcon className="h-4 w-4" />
              </>
            ) : (
              <>
                More <ChevronDownIcon className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Piggy bank visualization */}
      <div className="mb-6 flex justify-center">
        <PiggyBank fillPercent={(weeklyAmount / targetPrice) * 100 * Math.min(result.weeks, 4)} />
      </div>

      {/* Results */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/70 p-4 text-center shadow-sm">
          <div className="mb-1 flex items-center justify-center gap-1 text-blue-500">
            <CalendarDaysIcon className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{result.weeks}</p>
          <p className="text-xs text-gray-500">weeks to save</p>
        </div>
        <div className="rounded-xl bg-white/70 p-4 text-center shadow-sm">
          <div className="mb-1 flex items-center justify-center gap-1 text-purple-500">
            <ClockIcon className="h-5 w-5" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{result.months.toFixed(1)}</p>
          <p className="text-xs text-gray-500">months</p>
        </div>
      </div>

      {/* Target date */}
      <div className="mb-4 rounded-xl bg-gradient-to-r from-green-100 to-emerald-100 p-4 text-center">
        <div className="mb-1 flex items-center justify-center gap-2">
          <SparklesIcon className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-green-700">You could have it by</span>
        </div>
        <p className="text-xl font-bold text-green-800">{formatDate(result.targetDate)}</p>
      </div>

      {/* Progress milestones preview */}
      <div className="rounded-xl bg-white/50 p-4">
        <p className="mb-2 text-center text-sm font-medium text-gray-600">Your savings journey</p>
        <ProgressMilestones currentPercent={0} />
        <div className="mt-4">
          <div className="h-3 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-1000"
              style={{ width: '0%' }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>$0</span>
            <span>${(targetPrice / 2).toFixed(0)}</span>
            <span>${targetPrice.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Motivational tip */}
      <div className="mt-4 rounded-lg bg-amber-50 p-3 text-center">
        <p className="text-sm text-amber-700">
          <SparklesIcon className="mr-1 inline h-4 w-4" />
          Tip: Try saving a little extra when you can to reach your goal faster!
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT BUTTON VERSION (for card details)
// ============================================================================

interface SavingsGoalButtonProps {
  targetPrice: number;
  cardName?: string;
  className?: string;
}

export function SavingsGoalButton({ targetPrice, cardName, className }: SavingsGoalButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (targetPrice <= 0) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 px-3 py-1.5 text-sm font-medium text-pink-700 transition hover:from-pink-200 hover:to-rose-200',
          className
        )}
      >
        <CurrencyDollarIcon className="h-4 w-4" />
        How long to save?
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <SavingsGoalCalculator
              targetPrice={targetPrice}
              cardName={cardName}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
