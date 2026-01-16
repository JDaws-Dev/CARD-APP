'use client';

import { createContext, useContext, useEffect, useCallback, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import type { LiveRegionPoliteness } from '@/lib/screenReaderUtils';

// ============================================================================
// TYPES
// ============================================================================

interface LiveRegionContextValue {
  /**
   * Announce a message to screen readers
   * @param message - The message to announce
   * @param politeness - 'polite' waits for pause, 'assertive' interrupts
   */
  announce: (message: string, politeness?: LiveRegionPoliteness) => void;

  /**
   * Clear the current announcement
   */
  clear: (politeness?: LiveRegionPoliteness) => void;
}

interface LiveRegionProviderProps {
  children: ReactNode;
}

// ============================================================================
// CONTEXT
// ============================================================================

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * LiveRegionProvider sets up screen reader live regions for the application.
 * It provides context for any component to announce dynamic content changes.
 *
 * Usage:
 * ```tsx
 * // In root layout
 * <LiveRegionProvider>
 *   <App />
 * </LiveRegionProvider>
 *
 * // In any component
 * const { announce } = useLiveRegion();
 * announce('Item added to collection');
 * ```
 */
export function LiveRegionProvider({ children }: LiveRegionProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const clearTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clear a specific region
  const clear = useCallback((politeness: LiveRegionPoliteness = 'polite') => {
    if (politeness === 'assertive') {
      setAssertiveMessage('');
    } else {
      setPoliteMessage('');
    }
  }, []);

  // Announce a message
  const announce = useCallback(
    (message: string, politeness: LiveRegionPoliteness = 'polite') => {
      // Clear any existing timeout for this politeness level
      const existingTimeout = clearTimeoutRef.current.get(politeness);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        clearTimeoutRef.current.delete(politeness);
      }

      // Set the message
      if (politeness === 'assertive') {
        setAssertiveMessage(message);
      } else {
        setPoliteMessage(message);
      }

      // Schedule clearing the message after 5 seconds
      const timeout = setTimeout(() => {
        clear(politeness);
        clearTimeoutRef.current.delete(politeness);
      }, 5000);
      clearTimeoutRef.current.set(politeness, timeout);
    },
    [clear]
  );

  // Cleanup on unmount
  useEffect(() => {
    const timeouts = clearTimeoutRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const value: LiveRegionContextValue = {
    announce,
    clear,
  };

  return (
    <LiveRegionContext.Provider value={value}>
      {children}
      {/* Polite live region - waits for pause before announcing */}
      <div
        id="sr-live-region-polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      {/* Assertive live region - interrupts to announce immediately */}
      <div
        id="sr-live-region-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </LiveRegionContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to access the live region announcement functions.
 * Must be used within a LiveRegionProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { announce } = useLiveRegion();
 *
 *   const handleAdd = () => {
 *     // ... add logic
 *     announce('Card added to collection');
 *   };
 *
 *   return <button onClick={handleAdd}>Add Card</button>;
 * }
 * ```
 */
export function useLiveRegion(): LiveRegionContextValue {
  const context = useContext(LiveRegionContext);

  if (!context) {
    // Return a no-op implementation if used outside provider
    // This prevents errors and allows components to work standalone
    return {
      announce: () => {},
      clear: () => {},
    };
  }

  return context;
}

// ============================================================================
// STANDALONE COMPONENT
// ============================================================================

interface LiveRegionProps {
  /**
   * The message to announce. Changes to this prop trigger announcements.
   */
  message: string;
  /**
   * Politeness level for the announcement
   */
  politeness?: LiveRegionPoliteness;
  /**
   * Whether the region should be visible or screen-reader only
   */
  visible?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Standalone LiveRegion component for local announcements.
 * Use this when you want a component to have its own live region
 * rather than using the global provider.
 *
 * @example
 * ```tsx
 * <LiveRegion
 *   message={`${count} items selected`}
 *   politeness="polite"
 * />
 * ```
 */
export function LiveRegion({
  message,
  politeness = 'polite',
  visible = false,
  className,
}: LiveRegionProps) {
  return (
    <div
      role={politeness === 'assertive' ? 'alert' : 'status'}
      aria-live={politeness}
      aria-atomic="true"
      className={visible ? className : 'sr-only'}
    >
      {message}
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface DynamicContentAnnouncerProps {
  /**
   * The value to watch for changes
   */
  value: string | number;
  /**
   * Function to generate the announcement message from the value
   */
  getMessage: (value: string | number) => string;
  /**
   * Politeness level for announcements
   */
  politeness?: LiveRegionPoliteness;
  /**
   * Whether to announce on initial render
   */
  announceOnMount?: boolean;
}

/**
 * Component that announces changes to a dynamic value.
 * Useful for stats, counters, and other values that change over time.
 *
 * @example
 * ```tsx
 * <DynamicContentAnnouncer
 *   value={cardCount}
 *   getMessage={(count) => `${count} cards in collection`}
 * />
 * ```
 */
export function DynamicContentAnnouncer({
  value,
  getMessage,
  politeness = 'polite',
  announceOnMount = false,
}: DynamicContentAnnouncerProps) {
  const { announce } = useLiveRegion();
  const previousValueRef = useRef<string | number | null>(announceOnMount ? null : value);

  useEffect(() => {
    // Only announce if value has changed
    if (previousValueRef.current !== value) {
      announce(getMessage(value), politeness);
      previousValueRef.current = value;
    }
  }, [value, getMessage, announce, politeness]);

  // This component renders nothing visible
  return null;
}
