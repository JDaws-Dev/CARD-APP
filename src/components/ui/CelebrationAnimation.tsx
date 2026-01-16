'use client';

import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { TrophyIcon, StarIcon, SparklesIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

// Confetti colors - kid-friendly bright palette
const CONFETTI_COLORS = [
  '#6366F1', // Indigo (kid-primary)
  '#EC4899', // Pink (kid-secondary)
  '#10B981', // Green (kid-success)
  '#F59E0B', // Amber (kid-warning)
  '#3B82F6', // Blue (kid-info)
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#14B8A6', // Teal
];

// Confetti shapes
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

interface BadgeInfo {
  name: string;
  description?: string;
  type?: 'gold' | 'silver' | 'bronze' | 'special';
  icon?: 'trophy' | 'star' | 'badge' | 'sparkle';
}

interface CelebrationState {
  isActive: boolean;
  badge?: BadgeInfo;
}

interface CelebrationContextType {
  celebrate: (badge?: BadgeInfo) => void;
  celebrateQuick: () => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

/**
 * Hook to trigger celebration animations
 */
export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
}

/**
 * Generate random confetti particles
 */
function generateConfetti(count: number): ConfettiParticle[] {
  const particles: ConfettiParticle[] = [];
  const shapes: ConfettiShape[] = ['circle', 'square', 'star', 'triangle'];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 8 + Math.random() * 12;

    particles.push({
      id: i,
      x: 50, // Start from center
      y: 50,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.8,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed - 5, // Slight upward bias
      rotationSpeed: (Math.random() - 0.5) * 20,
      delay: Math.random() * 100,
    });
  }

  return particles;
}

/**
 * Single confetti particle component
 */
function ConfettiParticle({ particle }: { particle: ConfettiParticle }) {
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
    const gravity = 0.3;
    const friction = 0.98;

    const timeout = setTimeout(() => {
      const animate = () => {
        velocityY += gravity;
        velocityX *= friction;
        velocityY *= friction;
        x += velocityX;
        y += velocityY;
        rotation += particle.rotationSpeed;
        opacity -= 0.015;

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
    const size = 12 * particle.scale;

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
    >
      {renderShape()}
    </div>
  );
}

/**
 * Confetti burst container
 */
function ConfettiBurst({ particleCount = 50 }: { particleCount?: number }) {
  const [particles] = useState(() => generateConfetti(particleCount));

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((particle) => (
        <ConfettiParticle key={particle.id} particle={particle} />
      ))}
    </div>
  );
}

/**
 * Badge display with glow and pulse animations
 */
function BadgeUnlockDisplay({ badge, onClose }: { badge: BadgeInfo; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true));

    // Auto-close after 3 seconds
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getBadgeGradient = () => {
    switch (badge.type) {
      case 'gold':
        return 'from-amber-400 via-yellow-300 to-amber-500';
      case 'silver':
        return 'from-gray-300 via-white to-gray-400';
      case 'bronze':
        return 'from-orange-400 via-orange-300 to-orange-500';
      case 'special':
        return 'from-purple-500 via-pink-400 to-indigo-500';
      default:
        return 'from-kid-primary via-purple-400 to-kid-secondary';
    }
  };

  const getBadgeIcon = () => {
    switch (badge.icon) {
      case 'trophy':
        return TrophyIcon;
      case 'star':
        return StarIcon;
      case 'sparkle':
        return SparklesIcon;
      case 'badge':
      default:
        return CheckBadgeIcon;
    }
  };

  const Icon = getBadgeIcon();

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-300',
        isVisible && !isExiting ? 'opacity-100' : 'opacity-0'
      )}
      onClick={() => {
        setIsExiting(true);
        setTimeout(onClose, 300);
      }}
    >
      {/* Radiating glow rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="absolute h-40 w-40 animate-ping rounded-full bg-kid-primary/20"
          style={{ animationDuration: '1.5s' }}
        />
        <div
          className="absolute h-56 w-56 animate-ping rounded-full bg-kid-secondary/10"
          style={{ animationDuration: '2s', animationDelay: '0.2s' }}
        />
        <div
          className="absolute h-72 w-72 animate-ping rounded-full bg-amber-400/10"
          style={{ animationDuration: '2.5s', animationDelay: '0.4s' }}
        />
      </div>

      {/* Badge card */}
      <div
        className={cn(
          'relative transform rounded-3xl bg-white p-8 shadow-2xl transition-all duration-500',
          isVisible && !isExiting
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-10 scale-50 opacity-0'
        )}
      >
        {/* Sparkle decorations */}
        <SparklesIcon className="absolute -right-2 -top-2 h-8 w-8 animate-pulse text-amber-400" />
        <SparklesIcon
          className="absolute -left-2 -top-4 h-6 w-6 animate-pulse text-pink-400"
          style={{ animationDelay: '0.3s' }}
        />
        <SparklesIcon
          className="absolute -bottom-2 -right-4 h-5 w-5 animate-pulse text-indigo-400"
          style={{ animationDelay: '0.6s' }}
        />
        <SparklesIcon
          className="absolute -bottom-3 left-2 h-7 w-7 animate-pulse text-emerald-400"
          style={{ animationDelay: '0.9s' }}
        />

        {/* Badge icon with glow */}
        <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center">
          {/* Glow effect */}
          <div
            className={cn(
              'absolute inset-0 animate-pulse rounded-full bg-gradient-to-br blur-lg',
              getBadgeGradient()
            )}
          />

          {/* Badge background */}
          <div
            className={cn(
              'relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br shadow-lg',
              getBadgeGradient()
            )}
          >
            <Icon className="h-10 w-10 text-white drop-shadow-md" />
          </div>
        </div>

        {/* Badge unlocked text */}
        <div className="mb-2 text-center">
          <span className="inline-block animate-bounce bg-gradient-to-r from-kid-primary to-kid-secondary bg-clip-text text-xs font-bold uppercase tracking-wider text-transparent">
            Badge Unlocked!
          </span>
        </div>

        {/* Badge name */}
        <h2 className="mb-2 text-center text-2xl font-bold text-gray-800">{badge.name}</h2>

        {/* Badge description */}
        {badge.description && (
          <p className="max-w-xs text-center text-sm text-gray-600">{badge.description}</p>
        )}

        {/* Tap to dismiss hint */}
        <p className="mt-4 text-center text-xs text-gray-400">Tap anywhere to continue</p>
      </div>
    </div>
  );
}

/**
 * Quick celebration effect (just confetti, no badge display)
 */
function QuickCelebration({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return <ConfettiBurst particleCount={30} />;
}

/**
 * Full celebration with badge display and confetti
 */
function FullCelebration({ badge, onComplete }: { badge: BadgeInfo; onComplete: () => void }) {
  const [showBadge, setShowBadge] = useState(true);

  return (
    <>
      <ConfettiBurst particleCount={60} />
      {showBadge && (
        <BadgeUnlockDisplay
          badge={badge}
          onClose={() => {
            setShowBadge(false);
            setTimeout(onComplete, 300);
          }}
        />
      )}
    </>
  );
}

/**
 * Celebration provider component
 * Wrap your app with this to enable celebration animations
 */
export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [celebration, setCelebration] = useState<CelebrationState>({ isActive: false });

  const celebrate = useCallback((badge?: BadgeInfo) => {
    setCelebration({
      isActive: true,
      badge: badge ?? {
        name: 'Achievement Unlocked!',
        description: 'You earned a new badge!',
        type: 'gold',
        icon: 'trophy',
      },
    });
  }, []);

  const celebrateQuick = useCallback(() => {
    setCelebration({ isActive: true });
  }, []);

  const handleComplete = useCallback(() => {
    setCelebration({ isActive: false });
  }, []);

  return (
    <CelebrationContext.Provider value={{ celebrate, celebrateQuick }}>
      {children}
      {celebration.isActive &&
        (celebration.badge ? (
          <FullCelebration badge={celebration.badge} onComplete={handleComplete} />
        ) : (
          <QuickCelebration onComplete={handleComplete} />
        ))}
    </CelebrationContext.Provider>
  );
}

/**
 * Standalone confetti button for testing
 */
export function CelebrationTrigger({ className }: { className?: string }) {
  const { celebrate } = useCelebration();

  return (
    <button
      onClick={() =>
        celebrate({
          name: 'Master Collector',
          description: 'Collected over 100 cards!',
          type: 'gold',
          icon: 'trophy',
        })
      }
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-kid-primary to-kid-secondary px-4 py-2 font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95',
        className
      )}
    >
      <SparklesIcon className="h-5 w-5" />
      Test Celebration
    </button>
  );
}

/**
 * Glow effect wrapper component
 * Adds an animated glow effect around its children
 */
export function GlowEffect({
  children,
  color = 'kid-primary',
  intensity = 'medium',
  className,
}: {
  children: ReactNode;
  color?: 'kid-primary' | 'kid-secondary' | 'amber' | 'emerald' | 'purple';
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}) {
  const colorMap = {
    'kid-primary': 'rgba(99, 102, 241, VAR)',
    'kid-secondary': 'rgba(236, 72, 153, VAR)',
    amber: 'rgba(245, 158, 11, VAR)',
    emerald: 'rgba(16, 185, 129, VAR)',
    purple: 'rgba(139, 92, 246, VAR)',
  };

  const intensityMap = {
    low: { opacity: 0.3, blur: 10, scale: 1.05 },
    medium: { opacity: 0.5, blur: 15, scale: 1.1 },
    high: { opacity: 0.7, blur: 20, scale: 1.15 },
  };

  const settings = intensityMap[intensity];
  const baseColor = colorMap[color].replace('VAR', String(settings.opacity));

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className="absolute inset-0 animate-pulse rounded-full blur-md"
        style={{
          background: baseColor,
          transform: `scale(${settings.scale})`,
          filter: `blur(${settings.blur}px)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/**
 * Shimmer effect for highlighting new achievements
 */
export function ShimmerEffect({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {children}
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent"
        style={{
          animation: 'shimmer 2s infinite',
        }}
      />
    </div>
  );
}
