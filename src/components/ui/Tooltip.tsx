'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  /** The content to show in the tooltip */
  content: React.ReactNode;
  /** The element that triggers the tooltip */
  children: React.ReactNode;
  /** Position of the tooltip relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Additional classes for the wrapper */
  className?: string;
  /** Delay before showing tooltip on hover (ms) */
  delay?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
}

/**
 * Simple tooltip component that works on hover (desktop) and tap (mobile)
 * Mobile-friendly: tap to toggle, tap outside to close
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  className,
  delay = 300,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close tooltip when clicking outside (mobile)
  useEffect(() => {
    if (!isVisible || !isMobile) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible, isMobile]);

  // Handle hover (desktop)
  const handleMouseEnter = useCallback(() => {
    if (disabled || isMobile) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [disabled, isMobile, delay]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!isMobile) {
      setIsVisible(false);
    }
  }, [isMobile]);

  // Handle tap (mobile) - long press to show
  const handleTouchStart = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 400); // Long press delay
  }, [disabled]);

  const handleTouchEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (disabled) {
    return <>{children}</>;
  }

  // Position classes for the tooltip
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Arrow position classes
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent',
    right:
      'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div
      ref={triggerRef}
      className={cn('relative inline-flex', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            'absolute z-50 max-w-xs rounded-lg bg-gray-800 px-3 py-2 text-sm text-white shadow-lg',
            'animate-in fade-in-0 zoom-in-95 duration-150',
            positionClasses[position]
          )}
        >
          {content}
          {/* Arrow */}
          <div className={cn('absolute border-4', arrowClasses[position])} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
