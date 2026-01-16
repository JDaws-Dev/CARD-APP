'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface SleepSchedule {
  enabled: boolean;
  startHour: number; // 0-23 (e.g., 20 = 8 PM)
  startMinute: number; // 0-59
  endHour: number; // 0-23 (e.g., 7 = 7 AM)
  endMinute: number; // 0-59
}

interface SleepModeState {
  schedule: SleepSchedule;
  isCurrentlySleepTime: boolean;
  parentPin: string | null; // Optional PIN to exit sleep mode
}

interface SleepModeContextType {
  state: SleepModeState;
  isEnabled: boolean;
  isSleepTime: boolean;
  schedule: SleepSchedule;
  isInitialized: boolean;

  // Actions
  enable: () => void;
  disable: () => void;
  toggle: () => void;
  setSchedule: (schedule: Partial<SleepSchedule>) => void;
  setParentPin: (pin: string | null) => void;
  checkPinAndExit: (pin: string) => boolean;
}

// ============================================================================
// DEFAULTS & STORAGE
// ============================================================================

const STORAGE_KEY = 'carddex-sleep-mode';

const DEFAULT_SCHEDULE: SleepSchedule = {
  enabled: false,
  startHour: 20, // 8 PM
  startMinute: 0,
  endHour: 7, // 7 AM
  endMinute: 0,
};

const DEFAULT_STATE: SleepModeState = {
  schedule: DEFAULT_SCHEDULE,
  isCurrentlySleepTime: false,
  parentPin: null,
};

function loadSleepModeState(): SleepModeState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        schedule: { ...DEFAULT_SCHEDULE, ...parsed.schedule },
      };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_STATE;
}

function saveSleepModeState(state: SleepModeState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function isWithinSleepTime(schedule: SleepSchedule): boolean {
  if (!schedule.enabled) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = schedule.startHour * 60 + schedule.startMinute;
  const endMinutes = schedule.endHour * 60 + schedule.endMinute;

  // Handle overnight schedules (e.g., 8 PM to 7 AM)
  if (startMinutes > endMinutes) {
    // Sleep time spans midnight
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    // Sleep time is within the same day
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

// ============================================================================
// CONTEXT
// ============================================================================

const SleepModeContext = createContext<SleepModeContextType | null>(null);

// ============================================================================
// HOOK
// ============================================================================

export function useSleepMode() {
  const context = useContext(SleepModeContext);
  if (!context) {
    return {
      state: DEFAULT_STATE,
      isEnabled: false,
      isSleepTime: false,
      schedule: DEFAULT_SCHEDULE,
      isInitialized: false,
      enable: () => {},
      disable: () => {},
      toggle: () => {},
      setSchedule: () => {},
      setParentPin: () => {},
      checkPinAndExit: () => false,
    };
  }
  return context;
}

export { formatTime };

// ============================================================================
// PROVIDER
// ============================================================================

interface SleepModeProviderProps {
  children: ReactNode;
}

export function SleepModeProvider({ children }: SleepModeProviderProps) {
  const [state, setState] = useState<SleepModeState>(DEFAULT_STATE);
  const [isInitialized, setIsInitialized] = useState(false);
  const [temporaryExit, setTemporaryExit] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const savedState = loadSleepModeState();
    setState({
      ...savedState,
      isCurrentlySleepTime: isWithinSleepTime(savedState.schedule),
    });
    setIsInitialized(true);
  }, []);

  // Check sleep time every minute
  useEffect(() => {
    if (!isInitialized) return;

    const checkSleepTime = () => {
      setState((prev) => ({
        ...prev,
        isCurrentlySleepTime: isWithinSleepTime(prev.schedule),
      }));
    };

    // Check immediately and then every minute
    checkSleepTime();
    const interval = setInterval(checkSleepTime, 60000);

    return () => clearInterval(interval);
  }, [isInitialized, state.schedule]);

  // Persist state changes
  useEffect(() => {
    if (!isInitialized) return;
    saveSleepModeState(state);
  }, [state, isInitialized]);

  const enable = useCallback(() => {
    setState((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, enabled: true },
    }));
    setTemporaryExit(false);
  }, []);

  const disable = useCallback(() => {
    setState((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, enabled: false },
    }));
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, enabled: !prev.schedule.enabled },
    }));
  }, []);

  const setSchedule = useCallback((newSchedule: Partial<SleepSchedule>) => {
    setState((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, ...newSchedule },
    }));
  }, []);

  const setParentPin = useCallback((pin: string | null) => {
    setState((prev) => ({
      ...prev,
      parentPin: pin,
    }));
  }, []);

  const checkPinAndExit = useCallback(
    (pin: string): boolean => {
      if (state.parentPin && pin === state.parentPin) {
        setTemporaryExit(true);
        return true;
      }
      return false;
    },
    [state.parentPin]
  );

  // Determine if sleep mode is currently active
  const isSleepTime = state.isCurrentlySleepTime && !temporaryExit;

  return (
    <SleepModeContext.Provider
      value={{
        state,
        isEnabled: state.schedule.enabled,
        isSleepTime,
        schedule: state.schedule,
        isInitialized,
        enable,
        disable,
        toggle,
        setSchedule,
        setParentPin,
        checkPinAndExit,
      }}
    >
      {children}
    </SleepModeContext.Provider>
  );
}
