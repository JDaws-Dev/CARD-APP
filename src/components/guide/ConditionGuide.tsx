'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  getAllConditionGrades,
  getConditionInfo,
  getConditionFunFacts,
  getCardCareAdvice,
  type ConditionInfo,
} from '@/lib/conditionGuide';
import {
  SparklesIcon,
  HandThumbUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  BookOpenIcon,
  LightBulbIcon,
  ArrowRightIcon,
  StarIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  EyeIcon,
  ArrowsRightLeftIcon,
  CheckIcon,
} from '@heroicons/react/24/solid';

// ============================================================================
// ICON MAPPING - Map condition IDs to Heroicons
// ============================================================================

const CONDITION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  nm: SparklesIcon,
  lp: HandThumbUpIcon,
  mp: CheckCircleIcon,
  hp: ExclamationTriangleIcon,
  dmg: XCircleIcon,
};

function getConditionIcon(conditionId: string): React.ComponentType<{ className?: string }> {
  return CONDITION_ICONS[conditionId] || CheckCircleIcon;
}

// Gradient colors for each condition
const CONDITION_GRADIENTS: Record<string, { from: string; to: string; bg: string }> = {
  nm: {
    from: 'from-emerald-500',
    to: 'to-green-500',
    bg: 'bg-emerald-50',
  },
  lp: {
    from: 'from-blue-500',
    to: 'to-cyan-500',
    bg: 'bg-blue-50',
  },
  mp: {
    from: 'from-amber-500',
    to: 'to-yellow-500',
    bg: 'bg-amber-50',
  },
  hp: {
    from: 'from-orange-500',
    to: 'to-red-500',
    bg: 'bg-orange-50',
  },
  dmg: {
    from: 'from-red-500',
    to: 'to-rose-600',
    bg: 'bg-red-50',
  },
};

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function ConditionGuideSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-gray-200" />
        <div className="mx-auto h-8 w-64 rounded bg-gray-200" />
        <div className="mx-auto h-4 w-96 rounded bg-gray-200" />
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-48 rounded-2xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CONDITION CARD COMPONENT - Visual representation of each condition
// ============================================================================

interface ConditionCardProps {
  condition: ConditionInfo;
  isSelected: boolean;
  onSelect: (conditionId: string) => void;
}

function ConditionCard({ condition, isSelected, onSelect }: ConditionCardProps) {
  const IconComponent = getConditionIcon(condition.id);
  const colors = CONDITION_GRADIENTS[condition.id] || CONDITION_GRADIENTS.mp;

  return (
    <button
      type="button"
      onClick={() => onSelect(condition.id)}
      className={cn(
        'group relative w-full rounded-2xl border-2 p-5 text-left transition-all duration-200',
        'hover:-translate-y-1 hover:shadow-lg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
        isSelected
          ? 'border-kid-primary shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300'
      )}
      aria-label={`Learn about ${condition.name} condition`}
      aria-pressed={isSelected}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -right-2 -top-2 rounded-full bg-kid-primary p-1.5 shadow-md">
          <CheckIcon className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
      )}

      {/* Gradient header accent */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1.5 rounded-t-2xl bg-gradient-to-r',
          colors.from,
          colors.to
        )}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="space-y-3 pt-2">
        {/* Icon and title */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-md',
              colors.from,
              colors.to
            )}
          >
            <IconComponent className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{condition.name}</h3>
            <p className="text-sm font-medium text-gray-500">{condition.shortName}</p>
          </div>
        </div>

        {/* Short description */}
        <p className="line-clamp-2 text-sm text-gray-600">{condition.description}</p>

        {/* Value indicator */}
        <div className="flex items-center gap-2 text-xs">
          <CurrencyDollarIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
          <span className="font-medium text-gray-500">
            ~{condition.approximateValuePercent}% of NM value
          </span>
        </div>

        {/* Trade status badge */}
        <div
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            condition.tradeAcceptable
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-red-100 text-red-700'
          )}
        >
          {condition.tradeAcceptable ? (
            <>
              <CheckCircleIcon className="h-3 w-3" aria-hidden="true" />
              Trade OK
            </>
          ) : (
            <>
              <XCircleIcon className="h-3 w-3" aria-hidden="true" />
              Not for trade
            </>
          )}
        </div>
      </div>

      {/* Arrow indicator */}
      <ArrowRightIcon
        className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-kid-primary"
        aria-hidden="true"
      />
    </button>
  );
}

// ============================================================================
// CONDITION DETAIL VIEW - Detailed information when a condition is selected
// ============================================================================

interface ConditionDetailViewProps {
  condition: ConditionInfo;
  onBack: () => void;
}

function ConditionDetailView({ condition, onBack }: ConditionDetailViewProps) {
  const IconComponent = getConditionIcon(condition.id);
  const colors = CONDITION_GRADIENTS[condition.id] || CONDITION_GRADIENTS.mp;
  const funFacts = getConditionFunFacts(condition.id);
  const careAdvice = getCardCareAdvice(condition.id);

  return (
    <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600',
          'transition-colors hover:bg-gray-100 hover:text-gray-900',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2'
        )}
        aria-label="Back to condition list"
      >
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Back to conditions
      </button>

      {/* Header */}
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg',
            colors.from,
            colors.to
          )}
        >
          <IconComponent className="h-10 w-10 text-white" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{condition.name}</h2>
          <p className="text-lg text-gray-500">({condition.shortName})</p>
        </div>
      </div>

      {/* Description */}
      <div className={cn('rounded-2xl border p-6', colors.bg, 'border-gray-200')}>
        <p className="text-lg leading-relaxed text-gray-700">{condition.description}</p>
      </div>

      {/* What to look for section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <MagnifyingGlassIcon className="h-6 w-6 text-indigo-500" aria-hidden="true" />
          <h3 className="text-xl font-bold text-gray-900">What to Look For</h3>
        </div>
        <ul className="space-y-3">
          {condition.whatToLookFor.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <EyeIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              <span className="text-gray-600">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Damage examples section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" aria-hidden="true" />
          <h3 className="text-xl font-bold text-gray-900">Example Damage</h3>
        </div>
        <ul className="space-y-2">
          {condition.damageExamples.map((example, index) => (
            <li key={index} className="flex items-start gap-3">
              <ArrowsRightLeftIcon
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
              <span className="text-gray-600">{example}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Value impact section */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <CurrencyDollarIcon className="h-6 w-6 text-emerald-500" aria-hidden="true" />
          <h3 className="text-xl font-bold text-gray-900">Value Impact</h3>
        </div>
        <p className="mb-3 text-gray-700">{condition.valueImpact}</p>
        <div className="flex items-center gap-3 rounded-xl bg-white/50 p-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600">
              {condition.approximateValuePercent}%
            </p>
            <p className="text-sm text-gray-500">of NM value</p>
          </div>
          <div className="flex-1">
            <div className="h-3 w-full rounded-full bg-gray-200">
              <div
                className={cn('h-full rounded-full bg-gradient-to-r', colors.from, colors.to)}
                style={{ width: `${condition.approximateValuePercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trade status section */}
      <div
        className={cn(
          'rounded-2xl border p-6',
          condition.tradeAcceptable
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-red-200 bg-red-50'
        )}
      >
        <div className="mb-3 flex items-center gap-3">
          <ArrowsRightLeftIcon
            className={cn(
              'h-6 w-6',
              condition.tradeAcceptable ? 'text-emerald-500' : 'text-red-500'
            )}
            aria-hidden="true"
          />
          <h3 className="text-xl font-bold text-gray-900">Trading Status</h3>
        </div>
        <p className="text-gray-700">
          {condition.tradeAcceptable
            ? 'Cards in this condition are generally acceptable for trading with other collectors!'
            : 'Cards in this condition are usually not accepted for trading. Most collectors prefer NM, LP, or MP cards.'}
        </p>
      </div>

      {/* Fun facts section */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <StarIcon className="h-6 w-6 text-amber-500" aria-hidden="true" />
          <h3 className="text-xl font-bold text-gray-900">Fun Facts</h3>
        </div>
        <ul className="space-y-3">
          {funFacts.map((fact, index) => (
            <li key={index} className="flex items-start gap-3">
              <SparklesIcon
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400"
                aria-hidden="true"
              />
              <span className="text-gray-700">{fact}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Care advice section */}
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <ShieldCheckIcon className="h-6 w-6 text-indigo-500" aria-hidden="true" />
          <h3 className="text-xl font-bold text-gray-900">Card Care Tip</h3>
        </div>
        <div className="flex items-start gap-3">
          <LightBulbIcon
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-500"
            aria-hidden="true"
          />
          <p className="text-gray-700">{careAdvice}</p>
        </div>
      </div>

      {/* Collector tip */}
      <div className="rounded-2xl border border-purple-200 bg-purple-50 p-6">
        <div className="mb-3 flex items-center gap-3">
          <LightBulbIcon className="h-6 w-6 text-purple-500" aria-hidden="true" />
          <h3 className="text-xl font-bold text-gray-900">Collector Tip</h3>
        </div>
        <p className="text-gray-700">{condition.collectorTip}</p>
      </div>
    </div>
  );
}

// ============================================================================
// VISUAL COMPARISON SECTION
// ============================================================================

function VisualComparisonSection() {
  const conditions = getAllConditionGrades();

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
        <EyeIcon className="h-5 w-5 text-indigo-500" aria-hidden="true" />
        Quick Visual Comparison
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] rounded-xl border border-gray-200 bg-white">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Condition</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Corners & Edges
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Surface</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Value</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Trade?</th>
            </tr>
          </thead>
          <tbody>
            {conditions.map((condition) => {
              const IconComponent = getConditionIcon(condition.id);
              const colors = CONDITION_GRADIENTS[condition.id] || CONDITION_GRADIENTS.mp;
              return (
                <tr key={condition.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br',
                          colors.from,
                          colors.to
                        )}
                      >
                        <IconComponent className="h-4 w-4 text-white" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{condition.shortName}</p>
                        <p className="text-xs text-gray-500">{condition.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {condition.id === 'nm' && 'Perfect, sharp'}
                    {condition.id === 'lp' && 'Very slight wear'}
                    {condition.id === 'mp' && 'Noticeable wear'}
                    {condition.id === 'hp' && 'Heavy wear'}
                    {condition.id === 'dmg' && 'Major damage'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {condition.id === 'nm' && 'Clean, no scratches'}
                    {condition.id === 'lp' && 'Minor marks'}
                    {condition.id === 'mp' && 'Visible scratches'}
                    {condition.id === 'hp' && 'Heavy scratches'}
                    {condition.id === 'dmg' && 'Tears, water damage'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-1 text-sm font-bold',
                        colors.bg,
                        condition.id === 'nm' && 'text-emerald-700',
                        condition.id === 'lp' && 'text-blue-700',
                        condition.id === 'mp' && 'text-amber-700',
                        condition.id === 'hp' && 'text-orange-700',
                        condition.id === 'dmg' && 'text-red-700'
                      )}
                    >
                      {condition.approximateValuePercent}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {condition.tradeAcceptable ? (
                      <CheckCircleIcon
                        className="mx-auto h-5 w-5 text-emerald-500"
                        aria-label="Yes"
                      />
                    ) : (
                      <XCircleIcon className="mx-auto h-5 w-5 text-red-500" aria-label="No" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConditionGuide() {
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const conditions = getAllConditionGrades();

  const handleSelectCondition = useCallback((conditionId: string) => {
    setSelectedCondition(conditionId);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedCondition(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedCondition) {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCondition, handleBack]);

  // If a condition is selected, show the detail view
  if (selectedCondition) {
    const condition = getConditionInfo(selectedCondition);
    if (condition) {
      return (
        <div className="mx-auto max-w-3xl">
          <ConditionDetailView condition={condition} onBack={handleBack} />
        </div>
      );
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-kid-primary to-kid-secondary">
          <BookOpenIcon className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Card Condition Guide</h1>
        <p className="mx-auto max-w-2xl text-gray-600">
          Learn how to tell the difference between Near Mint, Lightly Played, and other card
          conditions. Understanding condition helps you grade your own cards and make fair trades!
        </p>
      </div>

      {/* Quick intro tip */}
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100">
            <LightBulbIcon className="h-5 w-5 text-indigo-500" aria-hidden="true" />
          </div>
          <div>
            <h2 className="mb-1 font-bold text-indigo-900">Pro Tip</h2>
            <p className="text-sm text-indigo-700">
              Always check your cards under good lighting! Look at the corners, edges, and surface
              from different angles to spot any wear or damage.
            </p>
          </div>
        </div>
      </div>

      {/* Visual comparison table */}
      <VisualComparisonSection />

      {/* Condition cards grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Tap a condition to learn more</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {conditions.map((condition) => (
            <ConditionCard
              key={condition.id}
              condition={condition}
              isSelected={selectedCondition === condition.id}
              onSelect={handleSelectCondition}
            />
          ))}
        </div>
      </div>

      {/* Understanding grading summary */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-6">
        <div className="mb-4 flex items-center gap-3">
          <StarIcon className="h-6 w-6 text-amber-500" aria-hidden="true" />
          <h2 className="text-xl font-bold text-gray-900">Remember!</h2>
        </div>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <CheckCircleIcon
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500"
              aria-hidden="true"
            />
            <span className="text-gray-700">
              <strong>Near Mint (NM)</strong> cards look almost perfect - like they just came from a
              pack!
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircleIcon
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500"
              aria-hidden="true"
            />
            <span className="text-gray-700">
              <strong>Lightly Played (LP)</strong> cards have tiny wear that&apos;s hard to see
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircleIcon
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
              aria-hidden="true"
            />
            <span className="text-gray-700">
              <strong>Moderately Played (MP)</strong> cards have wear you can see easily
            </span>
          </li>
          <li className="flex items-start gap-3">
            <ExclamationTriangleIcon
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500"
              aria-hidden="true"
            />
            <span className="text-gray-700">
              <strong>Heavily Played (HP)</strong> cards have lots of wear like creases or heavy
              scratches
            </span>
          </li>
          <li className="flex items-start gap-3">
            <XCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" aria-hidden="true" />
            <span className="text-gray-700">
              <strong>Damaged (DMG)</strong> cards have major issues like tears or water damage
            </span>
          </li>
        </ul>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-gray-400">
        Press Escape to go back when viewing a condition
      </p>
    </div>
  );
}

// ============================================================================
// MODAL VERSION
// ============================================================================

interface ConditionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConditionGuideModal({ isOpen, onClose }: ConditionGuideModalProps) {
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const conditions = getAllConditionGrades();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCondition(null);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedCondition) {
          setSelectedCondition(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedCondition, onClose]);

  if (!isOpen) return null;

  const selectedInfo = selectedCondition ? getConditionInfo(selectedCondition) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Card Condition Guide"
    >
      <div className="relative mx-4 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-gray-50 p-6 shadow-2xl sm:p-8">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary'
          )}
          aria-label="Close guide"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>

        {selectedInfo ? (
          <ConditionDetailView condition={selectedInfo} onBack={() => setSelectedCondition(null)} />
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-3 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-kid-primary to-kid-secondary">
                <BookOpenIcon className="h-7 w-7 text-white" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Card Condition Guide</h1>
              <p className="text-gray-600">
                Learn how to grade your cards and understand condition differences
              </p>
            </div>

            {/* Quick comparison */}
            <VisualComparisonSection />

            {/* Condition cards */}
            <div className="space-y-3">
              <h2 className="font-bold text-gray-900">Tap for details</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {conditions.map((condition) => (
                  <ConditionCard
                    key={condition.id}
                    condition={condition}
                    isSelected={false}
                    onSelect={setSelectedCondition}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Keyboard hint */}
        <p className="mt-4 text-center text-xs text-gray-400">
          Press Escape to {selectedCondition ? 'go back' : 'close'}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// BUTTON TO OPEN GUIDE
// ============================================================================

interface ConditionGuideButtonProps {
  onClick: () => void;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function ConditionGuideButton({
  onClick,
  className,
  variant = 'secondary',
}: ConditionGuideButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
        variant === 'primary' &&
          'bg-gradient-to-r from-kid-primary to-kid-secondary text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg',
        variant === 'secondary' &&
          'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50',
        className
      )}
      aria-label="Open card condition guide"
    >
      <BookOpenIcon className="h-5 w-5" aria-hidden="true" />
      Condition Guide
    </button>
  );
}
