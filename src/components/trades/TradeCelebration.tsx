'use client';

import { useState, useEffect } from 'react';
import { SparklesIcon, StarIcon } from '@heroicons/react/24/solid';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { CardImage } from '@/components/ui/CardImage';

// ============================================================================
// CONFETTI COMPONENTS (adapted from SetCompletionCelebration)
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

function TradeConfetti({ particleCount }: { particleCount: number }) {
  const [particles] = useState(() => generateConfetti(particleCount));

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      {particles.map((particle) => (
        <ConfettiParticleComponent key={particle.id} particle={particle} />
      ))}
    </div>
  );
}

// ============================================================================
// CARD SWAP ANIMATION
// ============================================================================

interface CardInfo {
  imageSmall: string;
  cardName: string;
}

interface CardSwapAnimationProps {
  cardsGiven: CardInfo[];
  cardsReceived: CardInfo[];
}

function CardSwapAnimation({ cardsGiven, cardsReceived }: CardSwapAnimationProps) {
  const [phase, setPhase] = useState<'initial' | 'swap' | 'complete'>('initial');

  useEffect(() => {
    // Start swap animation after a brief delay
    const swapTimer = setTimeout(() => setPhase('swap'), 300);
    const completeTimer = setTimeout(() => setPhase('complete'), 1000);

    return () => {
      clearTimeout(swapTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  // Show first card from each side (or placeholder if empty)
  const givenCard = cardsGiven[0];
  const receivedCard = cardsReceived[0];

  return (
    <div className="relative mx-auto flex h-32 w-64 items-center justify-center">
      {/* Card going out (left side, moves right) */}
      {givenCard && (
        <div
          className={cn(
            'absolute left-4 transition-all duration-700 ease-out',
            phase === 'initial' && 'translate-x-0 opacity-100',
            phase === 'swap' && 'translate-x-12 scale-90 opacity-50',
            phase === 'complete' && 'translate-x-20 scale-75 opacity-0'
          )}
        >
          <div className="relative h-20 w-14 overflow-hidden rounded-lg shadow-lg ring-2 ring-red-400">
            <CardImage
              src={givenCard.imageSmall}
              alt={givenCard.cardName}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* Swap icon in center */}
      <div
        className={cn(
          'z-10 rounded-full bg-gradient-to-r from-kid-primary to-purple-500 p-3 shadow-lg transition-all duration-500',
          phase === 'swap' && 'scale-125 rotate-180',
          phase === 'complete' && 'scale-100 rotate-360'
        )}
      >
        <ArrowsRightLeftIcon className="h-6 w-6 text-white" />
      </div>

      {/* Card coming in (right side, moves left) */}
      {receivedCard && (
        <div
          className={cn(
            'absolute right-4 transition-all duration-700 ease-out',
            phase === 'initial' && 'translate-x-0 scale-75 opacity-0',
            phase === 'swap' && '-translate-x-12 scale-90 opacity-50',
            phase === 'complete' && '-translate-x-20 scale-100 opacity-100'
          )}
        >
          <div className="relative h-20 w-14 overflow-hidden rounded-lg shadow-lg ring-2 ring-green-400">
            <CardImage
              src={receivedCard.imageSmall}
              alt={receivedCard.cardName}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* Show sparkles when complete */}
      {phase === 'complete' && (
        <>
          <SparklesIcon
            className="absolute -right-2 -top-2 h-6 w-6 animate-pulse text-yellow-400"
            aria-hidden="true"
          />
          <SparklesIcon
            className="absolute -bottom-2 -left-2 h-5 w-5 animate-pulse text-amber-400"
            style={{ animationDelay: '0.2s' }}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}

// ============================================================================
// MAIN TRADE CELEBRATION COMPONENT
// ============================================================================

interface TradeCelebrationProps {
  cardsGivenCount: number;
  cardsReceivedCount: number;
  cardsGiven: CardInfo[];
  cardsReceived: CardInfo[];
  tradingPartner?: string;
  onContinue: () => void;
  onLogAnother: () => void;
}

export function TradeCelebration({
  cardsGivenCount,
  cardsReceivedCount,
  cardsGiven,
  cardsReceived,
  tradingPartner,
  onContinue,
  onLogAnother,
}: TradeCelebrationProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Delay content appearance for dramatic effect
    const timer = setTimeout(() => setShowContent(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Generate fun messages for kids
  const celebrationMessages = [
    'Awesome Trade!',
    'Great Swap!',
    'Nice Deal!',
    'Trade Complete!',
    'You Did It!',
  ];
  const randomMessage = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];

  return (
    <div className="relative overflow-hidden py-4">
      {/* Confetti overlay */}
      <TradeConfetti particleCount={100} />

      {/* Main celebration content */}
      <div
        className={cn(
          'relative z-20 transition-all duration-500',
          showContent ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        )}
      >
        {/* Sparkle decorations */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <SparklesIcon
            className="absolute right-4 top-0 h-8 w-8 animate-pulse text-yellow-400"
          />
          <SparklesIcon
            className="absolute left-4 top-4 h-6 w-6 animate-pulse text-amber-400"
            style={{ animationDelay: '0.3s' }}
          />
          <StarIcon
            className="absolute bottom-16 right-8 h-5 w-5 animate-bounce text-yellow-400"
            style={{ animationDelay: '0.5s' }}
          />
          <StarIcon
            className="absolute bottom-20 left-6 h-4 w-4 animate-bounce text-amber-400"
            style={{ animationDelay: '0.7s' }}
          />
        </div>

        {/* Card swap animation */}
        {(cardsGiven.length > 0 || cardsReceived.length > 0) && (
          <CardSwapAnimation cardsGiven={cardsGiven} cardsReceived={cardsReceived} />
        )}

        {/* Celebration title */}
        <h3 className="mt-6 bg-gradient-to-r from-kid-primary via-purple-500 to-pink-500 bg-clip-text text-center text-2xl font-bold text-transparent">
          {randomMessage}
        </h3>

        {/* Trade summary */}
        <div className="mt-4 flex justify-center gap-6">
          {cardsGivenCount > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-2">
              <span className="text-lg font-bold text-red-600">{cardsGivenCount}</span>
              <span className="text-sm text-red-600">
                card{cardsGivenCount !== 1 ? 's' : ''} out
              </span>
            </div>
          )}
          {cardsReceivedCount > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2">
              <span className="text-lg font-bold text-green-600">{cardsReceivedCount}</span>
              <span className="text-sm text-green-600">
                card{cardsReceivedCount !== 1 ? 's' : ''} in
              </span>
            </div>
          )}
        </div>

        {/* Trading partner */}
        {tradingPartner && (
          <p className="mt-2 text-center text-sm text-gray-500">
            Traded with <span className="font-medium text-gray-700">{tradingPartner}</span>
          </p>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex gap-3 px-4">
          <button
            onClick={onLogAnother}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-kid-primary to-purple-500 py-3 font-semibold text-white shadow-lg transition hover:from-kid-primary/90 hover:to-purple-500/90"
          >
            <ArrowsRightLeftIcon className="h-5 w-5" />
            Log Another
          </button>
          <button
            onClick={onContinue}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-200 py-3 font-semibold text-gray-700 transition hover:bg-gray-300"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
