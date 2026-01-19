'use client';

import { useState, useCallback } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CollectionChat } from './CollectionChat';
import { cn } from '@/lib/utils';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';

interface ChatButtonProps {
  /** Additional className for the button */
  className?: string;
}

export function ChatButton({ className }: ChatButtonProps) {
  const { primaryGame } = useGameSelector();
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
      {/* Positioned above MobileBottomNav (h-20 = 80px) on mobile, normal position on desktop */}
      <button
        onClick={handleOpen}
        className={cn(
          'fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-game-gradient text-white shadow-lg shadow-game transition hover:scale-105 hover:shadow-xl focus-game',
          'md:h-16 md:w-16 lg:bottom-6',
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
              // Mobile: full-width panel above MobileBottomNav (h-20 = 80px + 16px padding = 96px)
              'inset-x-4 bottom-24 max-h-[70vh]',
              // Desktop: fixed size panel in bottom-right (no bottom nav)
              'lg:inset-auto lg:bottom-6 lg:right-6 lg:h-[500px] lg:w-[380px] lg:max-h-none'
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Collection Chat"
          >
            <CollectionChat
              gameSlug={primaryGame.id}
              onClose={handleClose}
              className="h-full"
            />
          </div>
        </>
      )}
    </>
  );
}
