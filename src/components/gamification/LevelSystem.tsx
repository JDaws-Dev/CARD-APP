'use client';

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { Id } from '../../../convex/_generated/dataModel';
import { SparklesIcon, BoltIcon, TrophyIcon } from '@heroicons/react/24/solid';
import { ChevronUpIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// ============================================================================
// LEVEL SYSTEM CONFIGURATION
// ============================================================================

// XP thresholds for each level (cumulative XP required)
const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: 'Beginner Collector' },
  { level: 2, xp: 10, title: 'Card Finder' },
  { level: 3, xp: 25, title: 'Card Hunter' },
  { level: 4, xp: 50, title: 'Rising Trainer' },
  { level: 5, xp: 100, title: 'Skilled Collector' },
  { level: 6, xp: 175, title: 'Expert Trainer' },
  { level: 7, xp: 275, title: 'Card Master' },
  { level: 8, xp: 400, title: 'Elite Collector' },
  { level: 9, xp: 575, title: 'Champion' },
  { level: 10, xp: 800, title: 'Legendary Master' },
] as const;

// XP values for different actions
const XP_VALUES = {
  unique_card: 2, // XP per unique card collected
};

// Level tier colors
const LEVEL_TIERS = [
  { minLevel: 1, maxLevel: 2, gradient: 'from-gray-400 to-gray-500', glow: 'shadow-gray-400/30' },
  {
    minLevel: 3,
    maxLevel: 4,
    gradient: 'from-green-400 to-emerald-500',
    glow: 'shadow-emerald-400/40',
  },
  {
    minLevel: 5,
    maxLevel: 6,
    gradient: 'from-blue-400 to-indigo-500',
    glow: 'shadow-indigo-400/40',
  },
  {
    minLevel: 7,
    maxLevel: 8,
    gradient: 'from-purple-400 to-pink-500',
    glow: 'shadow-purple-400/40',
  },
  {
    minLevel: 9,
    maxLevel: 10,
    gradient: 'from-amber-400 to-yellow-500',
    glow: 'shadow-amber-400/50',
  },
];

function getLevelTier(level: number) {
  return (
    LEVEL_TIERS.find((tier) => level >= tier.minLevel && level <= tier.maxLevel) || LEVEL_TIERS[0]
  );
}

function getLevelFromXP(totalXP: number): {
  level: number;
  title: string;
  currentXP: number;
  xpForNextLevel: number;
  progress: number;
  isMaxLevel: boolean;
} {
  let currentLevel: (typeof LEVEL_THRESHOLDS)[number] = LEVEL_THRESHOLDS[0];
  let nextLevel: (typeof LEVEL_THRESHOLDS)[number] = LEVEL_THRESHOLDS[1];

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i].xp) {
      currentLevel = LEVEL_THRESHOLDS[i];
      nextLevel = LEVEL_THRESHOLDS[i + 1] || LEVEL_THRESHOLDS[i];
      break;
    }
  }

  const isMaxLevel = currentLevel.level === LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].level;
  const xpInCurrentLevel = totalXP - currentLevel.xp;
  const xpNeededForNext = nextLevel.xp - currentLevel.xp;
  const progress = isMaxLevel ? 100 : Math.min(100, (xpInCurrentLevel / xpNeededForNext) * 100);

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    currentXP: xpInCurrentLevel,
    xpForNextLevel: xpNeededForNext,
    progress,
    isMaxLevel,
  };
}

// ============================================================================
// XP GAIN NOTIFICATION COMPONENT
// ============================================================================

interface XPNotification {
  id: number;
  amount: number;
  reason: string;
}

function XPGainNotification({
  notification,
  onComplete,
}: {
  notification: XPNotification;
  onComplete: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    const hideTimer = setTimeout(() => {
      setIsExiting(true);
    }, 2000);

    const removeTimer = setTimeout(() => {
      onComplete();
    }, 2300);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-white shadow-lg transition-all duration-300',
        isVisible && !isExiting
          ? 'translate-y-0 scale-100 opacity-100'
          : isExiting
            ? '-translate-y-2 scale-95 opacity-0'
            : 'translate-y-4 scale-75 opacity-0'
      )}
      role="status"
      aria-live="polite"
    >
      <BoltIcon className="h-4 w-4 animate-pulse text-yellow-300" aria-hidden="true" />
      <span className="text-sm font-bold">+{notification.amount} XP</span>
      <span className="text-xs text-white/80">{notification.reason}</span>
    </div>
  );
}

// ============================================================================
// LEVEL UP CELEBRATION COMPONENT
// ============================================================================

function LevelUpCelebration({
  newLevel,
  title,
  onClose,
}: {
  newLevel: number;
  title: string;
  onClose: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const tier = getLevelTier(newLevel);

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
      aria-labelledby="level-up-title"
      aria-modal="true"
    >
      {/* Animated background rings */}
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div
          className={cn(
            'absolute h-48 w-48 animate-ping rounded-full bg-gradient-to-r opacity-20',
            tier.gradient
          )}
          style={{ animationDuration: '1.5s' }}
        />
        <div
          className={cn(
            'absolute h-64 w-64 animate-ping rounded-full bg-gradient-to-r opacity-10',
            tier.gradient
          )}
          style={{ animationDuration: '2s', animationDelay: '0.2s' }}
        />
      </div>

      {/* Level up card */}
      <div
        className={cn(
          'relative transform rounded-3xl bg-white p-8 shadow-2xl transition-all duration-500',
          isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-10 scale-50 opacity-0'
        )}
      >
        {/* Sparkle decorations */}
        <SparklesIcon
          className="absolute -right-3 -top-3 h-8 w-8 animate-pulse text-yellow-400"
          aria-hidden="true"
        />
        <SparklesIcon
          className="absolute -left-3 -top-4 h-6 w-6 animate-pulse text-pink-400"
          style={{ animationDelay: '0.3s' }}
          aria-hidden="true"
        />
        <SparklesIcon
          className="absolute -bottom-2 -right-4 h-5 w-5 animate-pulse text-indigo-400"
          style={{ animationDelay: '0.6s' }}
          aria-hidden="true"
        />

        {/* Level badge */}
        <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center">
          <div
            className={cn(
              'absolute inset-0 animate-pulse rounded-full bg-gradient-to-r blur-lg',
              tier.gradient
            )}
            aria-hidden="true"
          />
          <div
            className={cn(
              'relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r shadow-lg',
              tier.gradient
            )}
          >
            <span className="text-3xl font-bold text-white drop-shadow">{newLevel}</span>
          </div>
        </div>

        {/* Level up text */}
        <div className="mb-2 text-center">
          <div className="inline-flex animate-bounce items-center gap-1.5">
            <ChevronUpIcon className="h-5 w-5 text-kid-primary" aria-hidden="true" />
            <span className="bg-gradient-to-r from-kid-primary to-kid-secondary bg-clip-text text-sm font-bold uppercase tracking-wider text-transparent">
              Level Up!
            </span>
            <ChevronUpIcon className="h-5 w-5 text-kid-primary" aria-hidden="true" />
          </div>
        </div>

        {/* Title */}
        <h2 id="level-up-title" className="mb-1 text-center text-2xl font-bold text-gray-800">
          Level {newLevel}
        </h2>
        <p className="text-center text-gray-600">{title}</p>

        {/* Tap to dismiss */}
        <p className="mt-4 text-center text-xs text-gray-400">Tap anywhere to continue</p>
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL DISPLAY COMPONENT
// ============================================================================

interface LevelDisplayProps {
  variant?: 'compact' | 'full';
  className?: string;
}

function LevelDisplaySkeleton({ variant = 'compact' }: { variant?: 'compact' | 'full' }) {
  if (variant === 'full') {
    return (
      <div className="animate-pulse rounded-2xl bg-gray-100 p-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="mb-2 h-4 w-24 rounded bg-gray-200" />
            <div className="h-3 w-32 rounded bg-gray-200" />
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex animate-pulse items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
      <div className="h-6 w-6 rounded-full bg-gray-200" />
      <div className="h-4 w-16 rounded bg-gray-200" />
    </div>
  );
}

export function LevelDisplay({ variant = 'compact', className }: LevelDisplayProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  const milestoneProgress = useQuery(
    api.achievements.getMilestoneProgress,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  // Calculate XP from unique cards (each unique card = 2 XP as base)
  const totalXP = milestoneProgress
    ? milestoneProgress.totalUniqueCards * XP_VALUES.unique_card
    : 0;
  const levelInfo = getLevelFromXP(totalXP);
  const tier = getLevelTier(levelInfo.level);

  // Loading state
  if (profileLoading || milestoneProgress === undefined) {
    return <LevelDisplaySkeleton variant={variant} />;
  }

  if (variant === 'full') {
    return (
      <div
        className={cn(
          'group relative overflow-hidden rounded-2xl bg-gradient-to-r p-4 shadow-lg transition-transform hover:scale-[1.02]',
          tier.gradient,
          className
        )}
        role="region"
        aria-label={`Level ${levelInfo.level}: ${levelInfo.title}`}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '20px 20px',
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-4">
          {/* Level badge */}
          <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center">
            <div className="absolute inset-0 animate-pulse rounded-full bg-white/20 blur-md" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/30 shadow-inner">
              <span className="text-2xl font-bold text-white drop-shadow">{levelInfo.level}</span>
            </div>
          </div>

          {/* Level info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white drop-shadow">{levelInfo.title}</h3>
              {levelInfo.isMaxLevel && (
                <TrophyIcon
                  className="h-5 w-5 text-yellow-300"
                  aria-label="Maximum level reached"
                />
              )}
            </div>
            <p className="text-sm text-white/80">
              {levelInfo.isMaxLevel
                ? 'Maximum level reached!'
                : `${levelInfo.currentXP}/${levelInfo.xpForNextLevel} XP to Level ${levelInfo.level + 1}`}
            </p>

            {/* XP Progress bar */}
            {!levelInfo.isMaxLevel && (
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${levelInfo.progress}%` }}
                  role="progressbar"
                  aria-valuenow={levelInfo.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="XP progress to next level"
                />
              </div>
            )}
          </div>
        </div>

        {/* Total XP display */}
        <div className="mt-3 flex items-center justify-between text-sm text-white/70">
          <span className="flex items-center gap-1">
            <BoltIcon className="h-4 w-4" aria-hidden="true" />
            {totalXP} Total XP
          </span>
          <span>{milestoneProgress.totalUniqueCards} cards collected</span>
        </div>
      </div>
    );
  }

  // Compact variant (for header)
  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 rounded-full bg-gradient-to-r px-3 py-1.5 shadow-md transition-all hover:shadow-lg',
        tier.gradient,
        tier.glow,
        className
      )}
      role="status"
      aria-label={`Level ${levelInfo.level}: ${levelInfo.title}, ${totalXP} XP`}
    >
      {/* Level number */}
      <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/30">
        <span className="text-xs font-bold text-white drop-shadow">{levelInfo.level}</span>
      </div>

      {/* XP bar mini */}
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-white drop-shadow">Lv.{levelInfo.level}</span>
        <div className="h-1 w-12 overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${levelInfo.progress}%` }}
            role="progressbar"
            aria-valuenow={levelInfo.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Tooltip on hover */}
      <div className="pointer-events-none absolute -bottom-16 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800 px-3 py-2 text-center text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        <div className="font-semibold">{levelInfo.title}</div>
        <div className="mt-0.5 text-gray-300">
          {levelInfo.isMaxLevel
            ? 'Max Level!'
            : `${levelInfo.xpForNextLevel - levelInfo.currentXP} XP to next level`}
        </div>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-800" />
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL UP PROVIDER CONTEXT
// ============================================================================

interface LevelUpContextType {
  showXPGain: (amount: number, reason?: string) => void;
  totalXP: number;
  levelInfo: ReturnType<typeof getLevelFromXP>;
}

const LevelUpContext = createContext<LevelUpContextType | null>(null);

export function useLevelUp() {
  const context = useContext(LevelUpContext);
  if (!context) {
    // Return a no-op version when used outside provider
    return {
      showXPGain: () => {},
      totalXP: 0,
      levelInfo: getLevelFromXP(0),
    };
  }
  return context;
}

export function LevelUpProvider({ children }: { children: ReactNode }) {
  const { profileId } = useCurrentProfile();
  const [notifications, setNotifications] = useState<XPNotification[]>([]);
  const [levelUpDisplay, setLevelUpDisplay] = useState<{
    level: number;
    title: string;
  } | null>(null);
  const notificationIdRef = useRef(0);
  const previousLevelRef = useRef<number | null>(null);

  const milestoneProgress = useQuery(
    api.achievements.getMilestoneProgress,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  const totalXP = milestoneProgress
    ? milestoneProgress.totalUniqueCards * XP_VALUES.unique_card
    : 0;
  const levelInfo = getLevelFromXP(totalXP);

  // Check for level up
  useEffect(() => {
    if (previousLevelRef.current !== null && levelInfo.level > previousLevelRef.current) {
      // Level up occurred!
      setLevelUpDisplay({
        level: levelInfo.level,
        title: levelInfo.title,
      });
    }
    previousLevelRef.current = levelInfo.level;
  }, [levelInfo.level, levelInfo.title]);

  const showXPGain = useCallback((amount: number, reason: string = 'Card added') => {
    const id = ++notificationIdRef.current;
    setNotifications((prev) => [...prev, { id, amount, reason }]);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <LevelUpContext.Provider value={{ showXPGain, totalXP, levelInfo }}>
      {children}

      {/* XP Gain Notifications */}
      <div
        className="pointer-events-none fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 flex-col-reverse gap-2"
        aria-live="polite"
      >
        {notifications.map((notification) => (
          <XPGainNotification
            key={notification.id}
            notification={notification}
            onComplete={() => removeNotification(notification.id)}
          />
        ))}
      </div>

      {/* Level Up Celebration */}
      {levelUpDisplay && (
        <LevelUpCelebration
          newLevel={levelUpDisplay.level}
          title={levelUpDisplay.title}
          onClose={() => setLevelUpDisplay(null)}
        />
      )}
    </LevelUpContext.Provider>
  );
}
