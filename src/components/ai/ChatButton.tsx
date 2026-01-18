'use client';

import { useState, useCallback } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CollectionChat } from './CollectionChat';
import { cn } from '@/lib/utils';

type GameSlug = 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana';

interface ChatButtonProps {
  /** The game context for the chat */
  gameSlug?: GameSlug;
  /** Additional className for the button */
  className?: string;
}

export function ChatButton({ gameSlug = 'pokemon', className }: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {/* Floating Chat Button - uses game theme colors */}
      <button
        onClick={handleOpen}
        className={cn(
          'fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-game-gradient text-white shadow-lg shadow-game transition hover:scale-105 hover:shadow-xl focus-game',
          'md:h-16 md:w-16',
          isOpen && 'hidden',
          className
        )}
        aria-label="Open collection chat"
      >
        <ChatBubbleLeftRightIcon className="h-7 w-7 md:h-8 md:w-8" />
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Chat Panel Container */}
          <div
            className={cn(
              'fixed z-50 overflow-hidden rounded-2xl shadow-2xl',
              // Mobile: full-width panel at bottom
              'inset-x-4 bottom-4 max-h-[80vh]',
              // Desktop: fixed size panel in bottom-right
              'md:inset-auto md:bottom-6 md:right-6 md:h-[500px] md:w-[380px]'
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Collection Chat"
          >
            <CollectionChat
              gameSlug={gameSlug}
              onClose={handleClose}
              className="h-full"
            />
          </div>
        </>
      )}
    </>
  );
}
