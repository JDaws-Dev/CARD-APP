'use client';

import { cn } from '@/lib/utils';
import { SparklesIcon } from '@heroicons/react/24/solid';

interface ChatAvatarProps {
  /** Whether the assistant is currently typing */
  isTyping?: boolean;
  /** Size of the avatar */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

/**
 * ChatAvatar - A friendly, kid-appropriate avatar for the collection assistant.
 *
 * Features a smiling mascot face with game-aware theming and animated
 * typing indicator when the assistant is thinking.
 */
export function ChatAvatar({ isTyping = false, size = 'md', className }: ChatAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const innerSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        sizeClasses[size],
        className
      )}
      aria-label={isTyping ? 'Collection helper is typing' : 'Collection helper'}
      role="img"
    >
      {/* Main avatar circle with gradient */}
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-gradient-to-br from-kid-primary to-kid-secondary shadow-md',
          innerSizeClasses[size],
          isTyping && 'animate-pulse'
        )}
      >
        {/* Mascot face - simple friendly design */}
        <MascotFace size={size} isTyping={isTyping} />
      </div>

      {/* Sparkle decorations */}
      <SparklesIcon
        className={cn(
          'absolute -right-1 -top-1 text-kid-warning',
          size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5',
          isTyping && 'animate-sparkle'
        )}
      />

      {/* Typing indicator dots */}
      {isTyping && (
        <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
          <TypingDot delay={0} />
          <TypingDot delay={150} />
          <TypingDot delay={300} />
        </div>
      )}
    </div>
  );
}

/**
 * MascotFace - The inner face design of the avatar.
 * A simple, kid-friendly smiling face using CSS shapes.
 */
function MascotFace({ size, isTyping }: { size: 'sm' | 'md' | 'lg'; isTyping: boolean }) {
  const eyeSize = {
    sm: 'h-1 w-1',
    md: 'h-1.5 w-1.5',
    lg: 'h-2 w-2',
  };

  const eyeSpacing = {
    sm: 'gap-1.5',
    md: 'gap-2',
    lg: 'gap-2.5',
  };

  const smileSize = {
    sm: 'w-2 h-1',
    md: 'w-3 h-1.5',
    lg: 'w-4 h-2',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Eyes */}
      <div className={cn('flex', eyeSpacing[size])}>
        <div
          className={cn(
            'rounded-full bg-white',
            eyeSize[size],
            isTyping && 'animate-bounce'
          )}
          style={{ animationDelay: '0ms', animationDuration: '1s' }}
        />
        <div
          className={cn(
            'rounded-full bg-white',
            eyeSize[size],
            isTyping && 'animate-bounce'
          )}
          style={{ animationDelay: '100ms', animationDuration: '1s' }}
        />
      </div>

      {/* Smile - curved line */}
      <div
        className={cn(
          'mt-0.5 rounded-b-full border-b-2 border-white',
          smileSize[size]
        )}
      />
    </div>
  );
}

/**
 * TypingDot - Individual dot for the typing indicator animation.
 */
function TypingDot({ delay }: { delay: number }) {
  return (
    <div
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-kid-primary"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

/**
 * ChatTypingIndicator - A standalone typing indicator with avatar.
 * Use this to show the assistant is thinking/typing.
 */
export function ChatTypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-start gap-2', className)}>
      <ChatAvatar isTyping size="sm" />
      <div className="rounded-2xl bg-gray-100 px-4 py-3">
        <div className="flex items-center gap-1">
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
            style={{ animationDelay: '0ms' }}
          />
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
            style={{ animationDelay: '150ms' }}
          />
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}
