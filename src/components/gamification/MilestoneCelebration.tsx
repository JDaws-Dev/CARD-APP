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
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  TrophyIcon,
  SparklesIcon,
  StarIcon,
  FireIcon,
  BoltIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

// ============================================================================
// MILESTONE DEFINITIONS
// ============================================================================

interface MilestoneDefinition {
  key: string;
  threshold: number;
  title: string;
  subtitle: string;
  icon: typeof TrophyIcon;
  gradient: string;
  glowColor: string;
  confettiCount: number;
}

const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  {
    key: 'first_catch',
    threshold: 1,
    title: 'First Catch!',
    subtitle: 'Your collection has begun!',
    icon: StarIcon,
    gradient: 'from-emerald-400 to-teal-500',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    confettiCount: 30,
  },
  {
    key: 'starter_collector',
    threshold: 10,
    title: 'Starter Collector!',
    subtitle: 'Your first 10 cards!',
    icon: SparklesIcon,
    gradient: 'from-blue-400 to-indigo-500',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    confettiCount: 50,
  },
  {
    key: 'rising_trainer',
    threshold: 50,
    title: 'Rising Trainer!',
    subtitle: '50 cards and counting!',
    icon: BoltIcon,
    gradient: 'from-purple-400 to-pink-500',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    confettiCount: 70,
  },
  {
    key: 'pokemon_trainer',
    threshold: 100,
    title: 'Pokemon Trainer!',
    subtitle: 'An amazing 100 cards!',
    icon: TrophyIcon,
    gradient: 'from-amber-400 to-orange-500',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    confettiCount: 100,
  },
  {
    key: 'elite_collector',
    threshold: 250,
    title: 'Elite Collector!',
    subtitle: 'An incredible 250 cards!',
    icon: FireIcon,
    gradient: 'from-orange-400 to-red-500',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    confettiCount: 120,
  },
  {
    key: 'pokemon_master',
    threshold: 500,
    title: 'Pokemon Master!',
    subtitle: 'A legendary 500 cards!',
    icon: RocketLaunchIcon,
    gradient: 'from-yellow-400 via-amber-400 to-orange-500',
    glowColor: 'rgba(251, 191, 36, 0.6)',
    confettiCount: 150,
  },
  {
    key: 'legendary_collector',
    threshold: 1000,
    title: 'Legendary Collector!',
    subtitle: 'An epic 1000 cards!',
    icon: TrophyIcon,
    gradient: 'from-purple-500 via-pink-500 to-rose-500',
    glowColor: 'rgba(236, 72, 153, 0.6)',
    confettiCount: 200,
  },
];

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
    const speed = 10 + Math.random() * 15;

    particles.push({
      id: i,
      x: 50,
      y: 50,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * 360,
      scale: 0.6 + Math.random() * 0.8,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed - 8,
      rotationSpeed: (Math.random() - 0.5) * 25,
      delay: Math.random() * 150,
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
    const gravity = 0.35;
    const friction = 0.98;

    const timeout = setTimeout(() => {
      const animate = () => {
        velocityY += gravity;
        velocityX *= friction;
        velocityY *= friction;
        x += velocityX;
        y += velocityY;
        rotation += particle.rotationSpeed;
        opacity -= 0.012;

        if (opacity > 0 && y < 150) {
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
    const size = 14 * particle.scale;

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

function MilestoneConfetti({ particleCount }: { particleCount: number }) {
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
// MILESTONE CELEBRATION MODAL
// ============================================================================

interface MilestoneCelebrationModalProps {
  milestone: MilestoneDefinition;
  cardCount: number;
  onClose: () => void;
}

function MilestoneCelebrationModal({
  milestone,
  cardCount,
  onClose,
}: MilestoneCelebrationModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const Icon = milestone.icon;

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 400);
    }, 4500);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <>
      <MilestoneConfetti particleCount={milestone.confettiCount} />

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
        aria-labelledby="milestone-title"
        aria-modal="true"
      >
        {/* Animated background rings */}
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <div
            className={cn(
              'absolute h-56 w-56 animate-ping rounded-full bg-gradient-to-r opacity-20',
              milestone.gradient
            )}
            style={{ animationDuration: '1.5s' }}
          />
          <div
            className={cn(
              'absolute h-72 w-72 animate-ping rounded-full bg-gradient-to-r opacity-15',
              milestone.gradient
            )}
            style={{ animationDuration: '2s', animationDelay: '0.2s' }}
          />
          <div
            className={cn(
              'absolute h-96 w-96 animate-ping rounded-full bg-gradient-to-r opacity-10',
              milestone.gradient
            )}
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
            boxShadow: `0 0 60px ${milestone.glowColor}, 0 0 120px ${milestone.glowColor}`,
          }}
        >
          {/* Sparkle decorations */}
          <SparklesIcon
            className="absolute -right-4 -top-4 h-10 w-10 animate-pulse text-yellow-400"
            aria-hidden="true"
          />
          <SparklesIcon
            className="absolute -left-4 -top-6 h-8 w-8 animate-pulse text-pink-400"
            style={{ animationDelay: '0.3s' }}
            aria-hidden="true"
          />
          <SparklesIcon
            className="absolute -bottom-3 -right-5 h-7 w-7 animate-pulse text-indigo-400"
            style={{ animationDelay: '0.6s' }}
            aria-hidden="true"
          />
          <SparklesIcon
            className="absolute -bottom-4 left-2 h-9 w-9 animate-pulse text-emerald-400"
            style={{ animationDelay: '0.9s' }}
            aria-hidden="true"
          />
          <StarIcon
            className="absolute -right-2 top-1/3 h-6 w-6 animate-bounce text-amber-400"
            style={{ animationDelay: '0.2s' }}
            aria-hidden="true"
          />
          <StarIcon
            className="absolute -left-3 top-1/2 h-5 w-5 animate-bounce text-cyan-400"
            style={{ animationDelay: '0.5s' }}
            aria-hidden="true"
          />

          {/* Milestone icon with glow */}
          <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
            <div
              className={cn(
                'absolute inset-0 animate-pulse rounded-full bg-gradient-to-r blur-xl',
                milestone.gradient
              )}
              aria-hidden="true"
            />
            <div
              className={cn(
                'relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br shadow-xl sm:h-28 sm:w-28',
                milestone.gradient
              )}
            >
              <Icon className="h-12 w-12 text-white drop-shadow-lg sm:h-14 sm:w-14" />
            </div>
          </div>

          {/* Milestone badge */}
          <div className="mb-3 text-center">
            <div className="inline-flex animate-bounce items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg">
              <TrophyIcon className="h-4 w-4" aria-hidden="true" />
              Milestone Reached!
              <TrophyIcon className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>

          {/* Title */}
          <h2
            id="milestone-title"
            className={cn(
              'mb-2 bg-gradient-to-r bg-clip-text text-center text-3xl font-extrabold text-transparent sm:text-4xl',
              milestone.gradient
            )}
          >
            {milestone.title}
          </h2>

          {/* Subtitle */}
          <p className="mb-4 text-center text-lg text-gray-600">{milestone.subtitle}</p>

          {/* Card count display */}
          <div className="mx-auto mb-4 flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-6 py-3">
            <span className="text-3xl font-black text-gray-800 sm:text-4xl">{cardCount}</span>
            <span className="text-lg text-gray-500">cards collected!</span>
          </div>

          {/* Tap to dismiss hint */}
          <p className="text-center text-sm text-gray-400">Tap anywhere to continue</p>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// MILESTONE PROVIDER CONTEXT
// ============================================================================

interface MilestoneContextType {
  checkForMilestone: () => void;
}

const MilestoneContext = createContext<MilestoneContextType | null>(null);

export function useMilestoneCelebration() {
  const context = useContext(MilestoneContext);
  if (!context) {
    return { checkForMilestone: () => {} };
  }
  return context;
}

interface MilestoneProviderProps {
  children: ReactNode;
}

export function MilestoneProvider({ children }: MilestoneProviderProps) {
  const { profileId } = useCurrentProfile();
  const [celebrationMilestone, setCelebrationMilestone] = useState<{
    milestone: MilestoneDefinition;
    cardCount: number;
  } | null>(null);
  const previousCardCountRef = useRef<number | null>(null);
  const celebratedMilestonesRef = useRef<Set<string>>(new Set());

  const milestoneProgress = useQuery(
    api.achievements.getMilestoneProgress,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  const checkMilestoneAchievements = useMutation(api.achievements.checkMilestoneAchievements);

  const checkForMilestone = useCallback(async () => {
    if (!profileId || milestoneProgress === undefined) return;

    try {
      const result = await checkMilestoneAchievements({
        profileId: profileId as Id<'profiles'>,
      });

      // If any new milestones were awarded, show celebration for the highest one
      if (result.awarded && result.awarded.length > 0) {
        // Find the highest threshold milestone that was just awarded
        const awardedMilestones = result.awarded
          .map((key: string) => MILESTONE_DEFINITIONS.find((m) => m.key === key))
          .filter(Boolean) as MilestoneDefinition[];

        if (awardedMilestones.length > 0) {
          const highestMilestone = awardedMilestones.reduce((highest, current) =>
            current.threshold > highest.threshold ? current : highest
          );

          // Only celebrate if we haven't already celebrated this milestone in this session
          if (!celebratedMilestonesRef.current.has(highestMilestone.key)) {
            celebratedMilestonesRef.current.add(highestMilestone.key);
            setCelebrationMilestone({
              milestone: highestMilestone,
              cardCount: result.totalUniqueCards,
            });
          }
        }
      }
    } catch {
      // Silently fail - milestone check is not critical
    }
  }, [profileId, milestoneProgress, checkMilestoneAchievements]);

  // Watch for card count changes and trigger celebrations
  useEffect(() => {
    if (milestoneProgress === undefined) return;

    const currentCount = milestoneProgress.totalUniqueCards;

    // Only check for milestones when card count increases
    if (previousCardCountRef.current !== null && currentCount > previousCardCountRef.current) {
      // Check if we crossed any milestone threshold
      for (const milestone of MILESTONE_DEFINITIONS) {
        if (
          previousCardCountRef.current < milestone.threshold &&
          currentCount >= milestone.threshold &&
          !celebratedMilestonesRef.current.has(milestone.key)
        ) {
          celebratedMilestonesRef.current.add(milestone.key);
          setCelebrationMilestone({
            milestone,
            cardCount: currentCount,
          });
          break; // Only show one celebration at a time
        }
      }
    }

    previousCardCountRef.current = currentCount;
  }, [milestoneProgress]);

  const handleCloseCelebration = useCallback(() => {
    setCelebrationMilestone(null);
  }, []);

  return (
    <MilestoneContext.Provider value={{ checkForMilestone }}>
      {children}

      {/* Milestone Celebration Modal */}
      {celebrationMilestone && (
        <MilestoneCelebrationModal
          milestone={celebrationMilestone.milestone}
          cardCount={celebrationMilestone.cardCount}
          onClose={handleCloseCelebration}
        />
      )}
    </MilestoneContext.Provider>
  );
}

// ============================================================================
// MILESTONE PROGRESS DISPLAY COMPONENT
// ============================================================================

interface MilestoneProgressProps {
  className?: string;
}

export function MilestoneProgress({ className }: MilestoneProgressProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();

  const milestoneProgress = useQuery(
    api.achievements.getMilestoneProgress,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  if (profileLoading || milestoneProgress === undefined) {
    return (
      <div className={cn('animate-pulse rounded-xl bg-gray-100 p-4', className)}>
        <div className="mb-3 h-4 w-32 rounded bg-gray-200" />
        <div className="h-2 w-full rounded-full bg-gray-200" />
      </div>
    );
  }

  const nextMilestone = milestoneProgress.nextMilestone;

  if (!nextMilestone) {
    // All milestones completed!
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 p-4 text-white',
          className
        )}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '16px 16px',
          }}
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <TrophyIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold">Legendary Collector!</p>
            <p className="text-sm text-white/80">All milestones completed!</p>
          </div>
        </div>
      </div>
    );
  }

  const milestoneDefinition = MILESTONE_DEFINITIONS.find((m) => m.key === nextMilestone.key);
  const Icon = milestoneDefinition?.icon ?? TrophyIcon;
  const progress = nextMilestone.percentProgress;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-4',
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br',
              milestoneDefinition?.gradient ?? 'from-gray-400 to-gray-500'
            )}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Next: {nextMilestone.name}</p>
            <p className="text-xs text-gray-500">
              {nextMilestone.cardsNeeded} more card{nextMilestone.cardsNeeded !== 1 ? 's' : ''} to
              go
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-800">{progress}%</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-500',
            milestoneDefinition?.gradient ?? 'from-gray-400 to-gray-500'
          )}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress to ${nextMilestone.name}`}
        />
      </div>
    </div>
  );
}
