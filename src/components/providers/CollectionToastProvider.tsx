'use client';

import {
  useState,
  useCallback,
  createContext,
  useContext,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface CollectionToast {
  id: number;
  cardName: string;
  quantity: number;
}

interface CollectionToastContextType {
  showCollectionToast: (cardName: string, quantity?: number) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const CollectionToastContext = createContext<CollectionToastContextType | null>(null);

export function useCollectionToast() {
  const context = useContext(CollectionToastContext);
  if (!context) {
    // Return a no-op version when used outside provider
    return {
      showCollectionToast: () => {},
    };
  }
  return context;
}

// ============================================================================
// TOAST COMPONENT
// ============================================================================

function CollectionToastNotification({
  toast,
  onComplete,
}: {
  toast: CollectionToast;
  onComplete: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    // Start exit animation after 3 seconds
    const hideTimer = setTimeout(() => {
      setIsExiting(true);
    }, 3000);

    // Remove from DOM after exit animation completes
    const removeTimer = setTimeout(() => {
      onComplete();
    }, 3300);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-white shadow-lg transition-all duration-300',
        isVisible && !isExiting
          ? 'translate-y-0 scale-100 opacity-100'
          : isExiting
            ? '-translate-y-2 scale-95 opacity-0'
            : 'translate-y-4 scale-75 opacity-0'
      )}
      role="alert"
      aria-live="polite"
    >
      <CheckCircleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
      <span className="text-sm font-medium">
        Added {toast.quantity > 1 ? `${toast.quantity}x ` : ''}&ldquo;{toast.cardName}&rdquo; to
        collection
      </span>
      <button
        onClick={onComplete}
        className="ml-1 rounded p-1 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Dismiss notification"
      >
        <XMarkIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

// ============================================================================
// PROVIDER
// ============================================================================

export function CollectionToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<CollectionToast[]>([]);
  const toastIdRef = useRef(0);

  const showCollectionToast = useCallback((cardName: string, quantity: number = 1) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, cardName, quantity }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <CollectionToastContext.Provider value={{ showCollectionToast }}>
      {children}

      {/* Toast Container */}
      <div
        className="pointer-events-none fixed bottom-32 left-1/2 z-50 flex -translate-x-1/2 flex-col-reverse gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <CollectionToastNotification toast={toast} onComplete={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </CollectionToastContext.Provider>
  );
}
