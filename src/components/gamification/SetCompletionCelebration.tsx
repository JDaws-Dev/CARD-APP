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
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { TrophyIcon, SparklesIcon, StarIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

// ============================================================================
// CONFETTI COMPONENTS
// ============================================================================

const CONFETTI_COLORS = [
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#10B981', // Green
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#14B8A6', // Teal
  '#FBBF24', // Yellow
  '#A855F7', // Violet
];

type ConfettiShape = 'circle' | 'square' | 'star' | 'triangle';

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  shape: ConfettiShape;
  rotation: number;
  scale: number;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
  delay: number;
}

function generateConfetti(count: number): ConfettiParticle[] {
  const particles: ConfettiParticle[] = [];
  const shapes: ConfettiShape[] = ['circle', 'square', 'star', 'triangle'];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 12 + Math.random() * 18;

    particles.push({
      id: i,
      x: 50,
      y: 50,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * 360,
      scale: 0.7 + Math.random() * 1.0,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed - 10,
      rotationSpeed: (Math.random() - 0.5) * 30,
      delay: Math.random() * 200,
    });
  }

  return particles;
}

function ConfettiParticleComponent({ particle }: { particle: ConfettiParticle }) {
  const [position, setPosition] = useState({
    x: particle.x,
    y: particle.y,
    rotation: particle.rotation,
    opacity: 1,
  });

  useEffect(() => {
    let frame: number;
    let x = particle.x;
    let y = particle.y;
    let rotation = particle.rotation;
    let velocityX = particle.velocityX;
    let velocityY = particle.velocityY;
    let opacity = 1;
    const gravity = 0.4;
    const friction = 0.98;

    const timeout = setTimeout(() => {
      const animate = () => {
        velocityY += gravity;
        velocityX *= friction;
        velocityY *= friction;
        x += velocityX;
        y += velocityY;
        rotation += particle.rotationSpeed;
        opacity -= 0.01;

        if (opacity > 0 && y < 160) {
          setPosition({ x, y, rotation, opacity });
          frame = requestAnimationFrame(animate);
        }
      };

      frame = requestAnimationFrame(animate);
    }, particle.delay);

    return () => {
      clearTimeout(timeout);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [particle]);

  const renderShape = () => {
    const size = 16 * particle.scale;

    switch (particle.shape) {
      case 'circle':
        return (
          <div
            className="rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: particle.color,
            }}
          />
        );
      case 'square':
        return (
          <div
            className="rounded-sm"
            style={{
              width: size,
              height: size,
              backgroundColor: particle.color,
            }}
          />
        );
      case 'star':
        return (
          <StarIcon
            style={{
              width: size * 1.5,
              height: size * 1.5,
              color: particle.color,
            }}
          />
        );
      case 'triangle':
        return (
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${size / 2}px solid transparent`,
              borderRight: `${size / 2}px solid transparent`,
              borderBottom: `${size}px solid ${particle.color}`,
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) rotate(${position.rotation}deg)`,
        opacity: position.opacity,
        transition: 'none',
      }}
      aria-hidden="true"
    >
      {renderShape()}
    </div>
  );
}

function SetCompletionConfetti({ particleCount }: { particleCount: number }) {
  const [particles] = useState(() => generateConfetti(particleCount));

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {particles.map((particle) => (
        <ConfettiParticleComponent key={particle.id} particle={particle} />
      ))}
    </div>
  );
}

// ============================================================================
// SET COMPLETION CELEBRATION MODAL
// ============================================================================

interface SetCompletionInfo {
  setId: string;
  setName: string;
  totalCards: number;
  setSymbolUrl?: string;
  setLogoUrl?: string;
}

interface SetCompletionCelebrationModalProps {
  setInfo: SetCompletionInfo;
  onClose: () => void;
}

function SetCompletionCelebrationModal({ setInfo, onClose }: SetCompletionCelebrationModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 400);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <>
      <SetCompletionConfetti particleCount={200} />

      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md transition-opacity duration-500',
          isVisible && !isExiting ? 'opacity-100' : 'opacity-0'
        )}
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 400);
        }}
        role="dialog"
        aria-labelledby="set-completion-title"
        aria-modal="true"
      >
        {/* Animated background rings */}
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <div
            className="absolute h-64 w-64 animate-ping rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 opacity-20"
            style={{ animationDuration: '1.5s' }}
          />
          <div
            className="absolute h-80 w-80 animate-ping rounded-full bg-gradient-to-r from-yellow-300 to-amber-300 opacity-15"
            style={{ animationDuration: '2s', animationDelay: '0.2s' }}
          />
          <div
            className="absolute h-[28rem] w-[28rem] animate-ping rounded-full bg-gradient-to-r from-orange-300 to-yellow-300 opacity-10"
            style={{ animationDuration: '2.5s', animationDelay: '0.4s' }}
          />
        </div>

        {/* Main celebration card */}
        <div
          className={cn(
            'relative transform rounded-3xl bg-white p-8 shadow-2xl transition-all duration-500 sm:p-10',
            isVisible && !isExiting
              ? 'translate-y-0 scale-100 opacity-100'
              : 'translate-y-10 scale-50 opacity-0'
          )}
          style={{
            boxShadow: '0 0 80px rgba(251, 191, 36, 0.6), 0 0 160px rgba(251, 191, 36, 0.4)',
          }}
        >
          {/* Sparkle decorations */}
          <SparklesIcon
            className="absolute -right-4 -top-4 h-12 w-12 animate-pulse text-yellow-400"
            aria-hidden="true"
          />
          <SparklesIcon
            className="absolute -left-4 -top-6 h-10 w-10 animate-pulse text-amber-400"
            style={{ animationDelay: '0.3s' }}
            aria-hidden="true"
          />
          <SparklesIcon
            className="absolute -bottom-3 -right-5 h-9 w-9 animate-pulse text-orange-400"
            style={{ animationDelay: '0.6s' }}
            aria-hidden="true"
          />
          <SparklesIcon
            className="absolute -bottom-4 left-2 h-11 w-11 animate-pulse text-yellow-300"
            style={{ animationDelay: '0.9s' }}
            aria-hidden="true"
          />
          <StarIcon
            className="absolute -right-2 top-1/3 h-8 w-8 animate-bounce text-amber-400"
            style={{ animationDelay: '0.2s' }}
            aria-hidden="true"
          />
          <StarIcon
            className="absolute -left-3 top-1/2 h-7 w-7 animate-bounce text-yellow-400"
            style={{ animationDelay: '0.5s' }}
            aria-hidden="true"
          />

          {/* Trophy icon with glow */}
          <div className="relative mx-auto mb-6 flex h-32 w-32 items-center justify-center sm:h-36 sm:w-36">
            <div
              className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 blur-xl"
              aria-hidden="true"
            />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-400 shadow-xl sm:h-32 sm:w-32">
              <TrophyIcon className="h-14 w-14 text-white drop-shadow-lg sm:h-16 sm:w-16" />
            </div>
          </div>

          {/* Achievement badge */}
          <div className="mb-3 text-center">
            <div className="inline-flex animate-bounce items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg">
              <CheckBadgeIcon className="h-5 w-5" aria-hidden="true" />
              Set Complete!
              <CheckBadgeIcon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>

          {/* Title */}
          <h2
            id="set-completion-title"
            className="mb-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-center text-3xl font-extrabold text-transparent sm:text-4xl"
          >
            Set Champion!
          </h2>

          {/* Set name */}
          <p className="mb-4 text-center text-lg font-semibold text-gray-700">{setInfo.setName}</p>

          {/* Card count display */}
          <div className="mx-auto mb-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-3 ring-1 ring-amber-200">
            <span className="text-3xl font-black text-amber-600 sm:text-4xl">
              {setInfo.totalCards}/{setInfo.totalCards}
            </span>
            <span className="text-lg text-amber-700">cards!</span>
          </div>

          {/* Encouragement message */}
          <p className="mb-4 text-center text-sm text-gray-500">
            You collected every card in this set!
          </p>

          {/* Tap to dismiss hint */}
          <p className="text-center text-xs text-gray-400">Tap anywhere to continue</p>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// SET COMPLETION PROVIDER CONTEXT
// ============================================================================

interface SetCompletionContextType {
  celebrateSetCompletion: (setInfo: SetCompletionInfo) => void;
}

const SetCompletionContext = createContext<SetCompletionContextType | null>(null);

export function useSetCompletionCelebration() {
  const context = useContext(SetCompletionContext);
  if (!context) {
    return { celebrateSetCompletion: () => {} };
  }
  return context;
}

interface SetCompletionProviderProps {
  children: ReactNode;
}

export function SetCompletionProvider({ children }: SetCompletionProviderProps) {
  const [celebrationSetInfo, setCelebrationSetInfo] = useState<SetCompletionInfo | null>(null);
  const celebratedSetsRef = useRef<Set<string>>(new Set());

  const celebrateSetCompletion = useCallback((setInfo: SetCompletionInfo) => {
    // Only celebrate each set once per session
    if (celebratedSetsRef.current.has(setInfo.setId)) {
      return;
    }
    celebratedSetsRef.current.add(setInfo.setId);
    setCelebrationSetInfo(setInfo);
  }, []);

  const handleCloseCelebration = useCallback(() => {
    setCelebrationSetInfo(null);
  }, []);

  return (
    <SetCompletionContext.Provider value={{ celebrateSetCompletion }}>
      {children}

      {/* Set Completion Celebration Modal */}
      {celebrationSetInfo && (
        <SetCompletionCelebrationModal
          setInfo={celebrationSetInfo}
          onClose={handleCloseCelebration}
        />
      )}
    </SetCompletionContext.Provider>
  );
}

// ============================================================================
// HOOK FOR TRACKING SET COMPLETION
// ============================================================================

interface UseSetCompletionTrackerProps {
  profileId?: string | null;
  setId: string;
  setName: string;
  totalCardsInSet: number;
  ownedCount: number;
  setSymbolUrl?: string;
  setLogoUrl?: string;
}

/**
 * Hook to track set completion and trigger celebration when 100% is reached.
 * Also triggers achievement checks for set completion badges (25%, 50%, 75%, 100%).
 * Should be used in components that display set collection progress.
 */
export function useSetCompletionTracker({
  profileId,
  setId,
  setName,
  totalCardsInSet,
  ownedCount,
  setSymbolUrl,
  setLogoUrl,
}: UseSetCompletionTrackerProps) {
  const { celebrateSetCompletion } = useSetCompletionCelebration();
  const checkSetCompletionAchievements = useMutation(
    api.achievements.checkSetCompletionAchievements
  );
  const previousOwnedCountRef = useRef<number | null>(null);
  const hasCelebratedRef = useRef(false);

  useEffect(() => {
    // Don't celebrate if we haven't tracked any progress yet or if already celebrated
    if (previousOwnedCountRef.current === null) {
      previousOwnedCountRef.current = ownedCount;
      // If we start at 100%, don't immediately celebrate (they may have completed it earlier)
      if (ownedCount >= totalCardsInSet && totalCardsInSet > 0) {
        hasCelebratedRef.current = true;
      }
      return;
    }

    // Check if we just reached 100% completion
    const wasComplete = previousOwnedCountRef.current >= totalCardsInSet;
    const isNowComplete = ownedCount >= totalCardsInSet && totalCardsInSet > 0;

    if (!wasComplete && isNowComplete && !hasCelebratedRef.current) {
      hasCelebratedRef.current = true;
      celebrateSetCompletion({
        setId,
        setName,
        totalCards: totalCardsInSet,
        setSymbolUrl,
        setLogoUrl,
      });
    }

    // Check set completion achievements when owned count increases
    // This awards badges for 25%, 50%, 75%, 100% completion
    if (profileId && ownedCount > (previousOwnedCountRef.current ?? 0)) {
      checkSetCompletionAchievements({
        profileId: profileId as Id<'profiles'>,
        setId,
      }).catch(() => {
        // Silently fail - achievement check is not critical
      });
    }

    previousOwnedCountRef.current = ownedCount;
  }, [
    profileId,
    ownedCount,
    totalCardsInSet,
    setId,
    setName,
    setSymbolUrl,
    setLogoUrl,
    celebrateSetCompletion,
    checkSetCompletionAchievements,
  ]);
}
