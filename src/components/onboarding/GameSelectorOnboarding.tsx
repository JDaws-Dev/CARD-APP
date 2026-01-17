'use client';

import { useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  type GameId,
  type GameInfo,
  type SelectedGames,
  getAllGames,
  getGameSelectorOnboarding,
  DEFAULT_SELECTED_GAMES,
} from '@/lib/gameSelector';
import {
  PokemonIcon,
  YugiohIcon,
  OnePieceIcon,
  LorcanaIcon,
  GenericTcgIcon,
} from '@/components/icons/tcg';
import {
  CheckIcon,
  StarIcon,
  SparklesIcon,
  XMarkIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
  LightBulbIcon,
} from '@heroicons/react/24/solid';

// ============================================================================
// GAME ICON COMPONENT LOOKUP
// ============================================================================

/**
 * Icon components for supported TCG games.
 * Only includes the 4 supported games: Pokemon, Yu-Gi-Oh!, One Piece, and Disney Lorcana.
 */
const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  pokemon: PokemonIcon,
  yugioh: YugiohIcon,
  onepiece: OnePieceIcon,
  lorcana: LorcanaIcon,
};

function getIconComponent(gameId: string): React.ComponentType<{ className?: string }> {
  return ICON_COMPONENTS[gameId] ?? GenericTcgIcon;
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function GameSelectorOnboardingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-gray-200" />
        <div className="mx-auto h-8 w-64 rounded bg-gray-200" />
        <div className="mx-auto h-4 w-80 rounded bg-gray-200" />
      </div>

      {/* Game grid skeleton - 4 supported games */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl bg-gray-200" />
        ))}
      </div>

      {/* Continue button skeleton */}
      <div className="mx-auto h-14 w-64 rounded-xl bg-gray-200" />
    </div>
  );
}

// ============================================================================
// GAME CARD COMPONENT
// ============================================================================

interface GameCardProps {
  game: GameInfo;
  isSelected: boolean;
  isPrimary: boolean;
  onToggle: () => void;
  onSetPrimary: () => void;
}

function GameCard({ game, isSelected, isPrimary, onToggle, onSetPrimary }: GameCardProps) {
  const IconComponent = getIconComponent(game.id);

  return (
    <div
      className={cn(
        'relative rounded-2xl border-2 p-4 transition-all duration-200',
        'hover:-translate-y-1 hover:shadow-lg',
        'focus-within:ring-2 focus-within:ring-kid-primary focus-within:ring-offset-2',
        isSelected
          ? cn('border-transparent shadow-md', game.bgColor)
          : 'border-gray-200 bg-white hover:border-gray-300'
      )}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <div
          className={cn(
            'absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full shadow-md',
            'bg-gradient-to-br',
            game.gradientFrom,
            game.gradientTo
          )}
        >
          <CheckIcon className="h-4 w-4 text-white" aria-hidden="true" />
        </div>
      )}

      {/* Primary star badge */}
      {isPrimary && (
        <div className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 shadow">
          <StarIcon className="h-3.5 w-3.5 text-yellow-900" aria-hidden="true" />
        </div>
      )}

      {/* Card content - clickable for toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left focus:outline-none"
        aria-pressed={isSelected}
        aria-label={`${isSelected ? 'Deselect' : 'Select'} ${game.name}`}
      >
        {/* Game icon */}
        <div
          className={cn(
            'mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm',
            game.gradientFrom,
            game.gradientTo
          )}
        >
          <IconComponent className="h-8 w-8 text-white" aria-hidden="true" />
        </div>

        {/* Game name */}
        <h3 className={cn('mb-1 text-center text-sm font-bold', game.textColor)}>
          {game.shortName}
        </h3>

        {/* Tagline */}
        <p className="text-center text-xs text-gray-500">{game.tagline}</p>
      </button>

      {/* Set as primary button - only shows when selected */}
      {isSelected && !isPrimary && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetPrimary();
          }}
          className={cn(
            'mt-3 w-full rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
            'border border-gray-200 bg-white hover:bg-gray-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary'
          )}
          aria-label={`Set ${game.name} as primary game`}
        >
          <StarIcon className="mr-1 inline-block h-3 w-3 text-gray-400" aria-hidden="true" />
          Set as main
        </button>
      )}

      {/* Primary indicator */}
      {isPrimary && (
        <div className="mt-3 rounded-lg bg-yellow-100 px-2 py-1.5 text-center text-xs font-medium text-yellow-800">
          <StarIcon className="mr-1 inline-block h-3 w-3" aria-hidden="true" />
          Main game
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPLETION CELEBRATION COMPONENT
// ============================================================================

interface CompletionCelebrationProps {
  selectedGames: SelectedGames;
  onContinue: () => void;
}

function CompletionCelebration({ selectedGames, onContinue }: CompletionCelebrationProps) {
  const games = getAllGames();
  const selectedCount = selectedGames.enabled.length;
  const primaryGame = games.find((g) => g.id === selectedGames.primary);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-500/90 to-purple-500/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Game selection complete"
    >
      <div className="mx-4 max-w-md space-y-6 text-center">
        {/* Celebration icon */}
        <div className="relative mx-auto">
          <div className="h-24 w-24 animate-pulse rounded-full bg-white/20 p-4">
            <RocketLaunchIcon className="h-full w-full text-white" aria-hidden="true" />
          </div>
          {/* Decorative sparkles */}
          <SparklesIcon
            className="absolute -left-4 -top-2 h-6 w-6 animate-bounce text-yellow-300"
            style={{ animationDelay: '0ms' }}
            aria-hidden="true"
          />
          <SparklesIcon
            className="absolute -right-3 top-1 h-5 w-5 animate-bounce text-cyan-300"
            style={{ animationDelay: '150ms' }}
            aria-hidden="true"
          />
          <StarIcon
            className="absolute -bottom-1 -left-2 h-4 w-4 animate-bounce text-yellow-400"
            style={{ animationDelay: '300ms' }}
            aria-hidden="true"
          />
          <StarIcon
            className="absolute -right-2 bottom-0 h-5 w-5 animate-bounce text-pink-300"
            style={{ animationDelay: '200ms' }}
            aria-hidden="true"
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white">You&apos;re All Set!</h2>
          <p className="text-lg text-white/90">
            {selectedCount === 1
              ? `Ready to collect ${primaryGame?.shortName} cards!`
              : `Tracking ${selectedCount} card games!`}
          </p>
          <p className="text-white/70">You can change your games anytime in settings.</p>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-indigo-600 shadow-lg transition-all',
            'hover:-translate-y-0.5 hover:bg-white hover:shadow-xl',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-500'
          )}
        >
          Start Collecting
          <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT - MODAL VERSION
// ============================================================================

interface GameSelectorOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (games: SelectedGames) => void;
  initialSelection?: SelectedGames;
}

export function GameSelectorOnboardingModal({
  isOpen,
  onClose,
  onComplete,
  initialSelection,
}: GameSelectorOnboardingModalProps) {
  const [selectedGames, setSelectedGames] = useState<SelectedGames>(
    initialSelection ?? DEFAULT_SELECTED_GAMES
  );
  const [showCelebration, setShowCelebration] = useState(false);

  const games = getAllGames();
  const onboarding = getGameSelectorOnboarding();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedGames(initialSelection ?? DEFAULT_SELECTED_GAMES);
      setShowCelebration(false);
    }
  }, [isOpen, initialSelection]);

  const toggleGame = useCallback((gameId: GameId) => {
    setSelectedGames((prev) => {
      const isCurrentlyEnabled = prev.enabled.includes(gameId);

      if (isCurrentlyEnabled) {
        // Don't allow deselecting the only game
        if (prev.enabled.length <= 1) return prev;

        // If removing the primary, set new primary
        const newEnabled = prev.enabled.filter((id) => id !== gameId);
        const newPrimary = prev.primary === gameId ? newEnabled[0] : prev.primary;
        return { primary: newPrimary, enabled: newEnabled };
      } else {
        // Add game
        return { ...prev, enabled: [...prev.enabled, gameId] };
      }
    });
  }, []);

  const setPrimary = useCallback((gameId: GameId) => {
    setSelectedGames((prev) => {
      // Ensure game is enabled
      const enabled = prev.enabled.includes(gameId) ? prev.enabled : [...prev.enabled, gameId];
      return { primary: gameId, enabled };
    });
  }, []);

  const handleContinue = useCallback(() => {
    if (selectedGames.enabled.length === 0) return;
    setShowCelebration(true);
  }, [selectedGames]);

  const handleComplete = useCallback(() => {
    setShowCelebration(false);
    onComplete?.(selectedGames);
    onClose();
  }, [selectedGames, onComplete, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showCelebration) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          handleComplete();
        }
        return;
      }
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && selectedGames.enabled.length > 0) {
        handleContinue();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showCelebration, handleComplete, handleContinue, onClose, selectedGames]);

  if (!isOpen) return null;

  if (showCelebration) {
    return <CompletionCelebration selectedGames={selectedGames} onContinue={handleComplete} />;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={onboarding.title}
    >
      <div className="relative mx-4 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-gray-50 p-6 shadow-2xl sm:p-8">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary'
          )}
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-3 text-center">
            <div
              className={cn(
                'mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br',
                onboarding.gradientFrom,
                onboarding.gradientTo
              )}
            >
              <RocketLaunchIcon className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{onboarding.title}</h1>
            <p className="text-gray-600">{onboarding.description}</p>
          </div>

          {/* Selection count */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="font-medium text-gray-600">
              {selectedGames.enabled.length} of {games.length} selected
            </span>
            {selectedGames.enabled.length > 0 && (
              <CheckCircleIcon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
            )}
          </div>

          {/* Game grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isSelected={selectedGames.enabled.includes(game.id)}
                isPrimary={selectedGames.primary === game.id}
                onToggle={() => toggleGame(game.id)}
                onSetPrimary={() => setPrimary(game.id)}
              />
            ))}
          </div>

          {/* Tip */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <LightBulbIcon
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
                aria-hidden="true"
              />
              <div>
                <p className="font-medium text-amber-800">Tip</p>
                <p className="text-sm text-amber-700">
                  Tap the star to set your main game. Your main game shows first in the app.
                  {onboarding.tip}
                </p>
              </div>
            </div>
          </div>

          {/* Continue button */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleContinue}
              disabled={selectedGames.enabled.length === 0}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
                selectedGames.enabled.length > 0
                  ? cn(
                      'bg-gradient-to-r hover:-translate-y-0.5 hover:shadow-xl',
                      onboarding.gradientFrom,
                      onboarding.gradientTo
                    )
                  : 'cursor-not-allowed bg-gray-300'
              )}
              aria-label="Continue to app"
            >
              {selectedGames.enabled.length === 0 ? (
                'Select at least one game'
              ) : (
                <>
                  Continue
                  <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
                </>
              )}
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-center text-xs text-gray-400">
            Press Enter to continue, Escape to close
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT - INLINE/PAGE VERSION
// ============================================================================

interface GameSelectorOnboardingProps {
  onComplete?: (games: SelectedGames) => void;
  onBack?: () => void;
  showBackButton?: boolean;
  initialSelection?: SelectedGames;
}

export function GameSelectorOnboarding({
  onComplete,
  onBack,
  showBackButton = true,
  initialSelection,
}: GameSelectorOnboardingProps) {
  const [selectedGames, setSelectedGames] = useState<SelectedGames>(
    initialSelection ?? DEFAULT_SELECTED_GAMES
  );
  const [showCelebration, setShowCelebration] = useState(false);

  const games = getAllGames();
  const onboarding = getGameSelectorOnboarding();

  const toggleGame = useCallback((gameId: GameId) => {
    setSelectedGames((prev) => {
      const isCurrentlyEnabled = prev.enabled.includes(gameId);

      if (isCurrentlyEnabled) {
        if (prev.enabled.length <= 1) return prev;
        const newEnabled = prev.enabled.filter((id) => id !== gameId);
        const newPrimary = prev.primary === gameId ? newEnabled[0] : prev.primary;
        return { primary: newPrimary, enabled: newEnabled };
      } else {
        return { ...prev, enabled: [...prev.enabled, gameId] };
      }
    });
  }, []);

  const setPrimary = useCallback((gameId: GameId) => {
    setSelectedGames((prev) => {
      const enabled = prev.enabled.includes(gameId) ? prev.enabled : [...prev.enabled, gameId];
      return { primary: gameId, enabled };
    });
  }, []);

  const handleContinue = useCallback(() => {
    if (selectedGames.enabled.length === 0) return;
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      onComplete?.(selectedGames);
    }, 2500);
  }, [selectedGames, onComplete]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showCelebration) return;
      if (e.key === 'Enter' && selectedGames.enabled.length > 0) {
        handleContinue();
      } else if (e.key === 'Escape' && onBack) {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCelebration, handleContinue, onBack, selectedGames]);

  if (showCelebration) {
    const primaryGame = games.find((g) => g.id === selectedGames.primary);
    return (
      <div className="space-y-6 text-center">
        <div className="relative mx-auto">
          <div
            className={cn(
              'mx-auto h-20 w-20 animate-pulse rounded-full bg-gradient-to-br p-4',
              onboarding.gradientFrom,
              onboarding.gradientTo
            )}
          >
            <RocketLaunchIcon className="h-full w-full text-white" aria-hidden="true" />
          </div>
          <SparklesIcon
            className="absolute -right-2 -top-1 h-6 w-6 animate-bounce text-yellow-400"
            aria-hidden="true"
          />
          <StarIcon
            className="absolute -left-1 top-2 h-5 w-5 animate-bounce text-amber-400"
            style={{ animationDelay: '100ms' }}
            aria-hidden="true"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">You&apos;re All Set!</h2>
        <p className="text-gray-600">
          {selectedGames.enabled.length === 1
            ? `Ready to collect ${primaryGame?.shortName} cards!`
            : `Tracking ${selectedGames.enabled.length} card games!`}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back button */}
      {showBackButton && onBack && (
        <button
          type="button"
          onClick={onBack}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600',
            'transition-colors hover:bg-gray-100 hover:text-gray-900',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2'
          )}
          aria-label="Back"
        >
          <ArrowRightIcon className="h-4 w-4 rotate-180" aria-hidden="true" />
          Back
        </button>
      )}

      {/* Header */}
      <div className="space-y-3 text-center">
        <div
          className={cn(
            'mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br',
            onboarding.gradientFrom,
            onboarding.gradientTo
          )}
        >
          <RocketLaunchIcon className="h-7 w-7 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{onboarding.title}</h1>
        <p className="text-gray-600">{onboarding.subtitle}</p>
      </div>

      {/* Selection count */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="font-medium text-gray-600">
          {selectedGames.enabled.length} of {games.length} selected
        </span>
        {selectedGames.enabled.length > 0 && (
          <CheckCircleIcon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
        )}
      </div>

      {/* Game grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            isSelected={selectedGames.enabled.includes(game.id)}
            isPrimary={selectedGames.primary === game.id}
            onToggle={() => toggleGame(game.id)}
            onSetPrimary={() => setPrimary(game.id)}
          />
        ))}
      </div>

      {/* Tip */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <LightBulbIcon
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium text-amber-800">Tip</p>
            <p className="text-sm text-amber-700">
              Tap the star to set your main game. Your main game shows first in the app.
            </p>
          </div>
        </div>
      </div>

      {/* Continue button */}
      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={handleContinue}
          disabled={selectedGames.enabled.length === 0}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
            selectedGames.enabled.length > 0
              ? cn(
                  'bg-gradient-to-r hover:-translate-y-0.5 hover:shadow-xl',
                  onboarding.gradientFrom,
                  onboarding.gradientTo
                )
              : 'cursor-not-allowed bg-gray-300'
          )}
          aria-label="Continue"
        >
          {selectedGames.enabled.length === 0 ? (
            'Select at least one game'
          ) : (
            <>
              Continue
              <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-gray-400">Press Enter to continue</p>
    </div>
  );
}
