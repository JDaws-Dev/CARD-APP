'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

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
  parentPin: string | null; // Local-only PIN for temporary exit
}

interface SleepModeContextType {
  state: SleepModeState;
  isEnabled: boolean;
  isSleepTime: boolean;
  schedule: SleepSchedule;
  isInitialized: boolean;
  isLoading: boolean;
  sleepPinSet: boolean; // Whether a PIN is set in the database

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

const LOCAL_STORAGE_KEY = 'carddex-sleep-mode';
const PROFILE_ID_KEY = 'kidcollect_profile_id';

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

// Load local-only state (PIN for temporary exit)
function loadLocalState(): { parentPin: string | null } {
  if (typeof window === 'undefined') return { parentPin: null };
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { parentPin: parsed.parentPin ?? null };
    }
  } catch {
    // Ignore parse errors
  }
  return { parentPin: null };
}

// Save local-only state
function saveLocalState(parentPin: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ parentPin }));
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

// Simple hash function for PIN (client-side)
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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
      isLoading: false,
      sleepPinSet: false,
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

export { formatTime, hashPin };

// ============================================================================
// PROVIDER
// ============================================================================

interface SleepModeProviderProps {
  children: ReactNode;
  profileId?: Id<'profiles'>;
}

export function SleepModeProvider({ children, profileId }: SleepModeProviderProps) {
  const [localParentPin, setLocalParentPin] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [temporaryExit, setTemporaryExit] = useState(false);
  const [currentProfileId, setCurrentProfileId] = useState<Id<'profiles'> | undefined>(profileId);

  // Query profile settings from Convex
  const profileSettings = useQuery(
    api.profileSettings.getProfileSettings,
    currentProfileId ? { profileId: currentProfileId } : 'skip'
  );

  // Mutations
  const updateSleepSchedule = useMutation(api.profileSettings.updateSleepSchedule);
  const toggleSleepModeMutation = useMutation(api.profileSettings.toggleSleepMode);
  const setSleepPinMutation = useMutation(api.profileSettings.setSleepPin);
  const removeSleepPinMutation = useMutation(api.profileSettings.removeSleepPin);

  // Load profile ID from localStorage if not provided
  useEffect(() => {
    if (!profileId && typeof window !== 'undefined') {
      const savedProfileId = localStorage.getItem(PROFILE_ID_KEY);
      if (savedProfileId) {
        setCurrentProfileId(savedProfileId as Id<'profiles'>);
      }
    }
  }, [profileId]);

  // Update currentProfileId when prop changes
  useEffect(() => {
    if (profileId) {
      setCurrentProfileId(profileId);
    }
  }, [profileId]);

  // Initialize local state (PIN)
  useEffect(() => {
    const localState = loadLocalState();
    setLocalParentPin(localState.parentPin);
    setIsInitialized(true);
  }, []);

  // Build schedule from Convex data or defaults
  const schedule: SleepSchedule = profileSettings
    ? profileSettings.sleepSchedule
    : DEFAULT_SCHEDULE;

  // Check sleep time every minute
  const [isCurrentlySleepTime, setIsCurrentlySleepTime] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    const checkSleepTime = () => {
      setIsCurrentlySleepTime(isWithinSleepTime(schedule));
    };

    // Check immediately and then every minute
    checkSleepTime();
    const interval = setInterval(checkSleepTime, 60000);

    return () => clearInterval(interval);
  }, [isInitialized, schedule]);

  // Persist local PIN changes
  useEffect(() => {
    if (!isInitialized) return;
    saveLocalState(localParentPin);
  }, [localParentPin, isInitialized]);

  const enable = useCallback(async () => {
    if (!currentProfileId) return;
    await updateSleepSchedule({ profileId: currentProfileId, enabled: true });
    setTemporaryExit(false);
  }, [currentProfileId, updateSleepSchedule]);

  const disable = useCallback(async () => {
    if (!currentProfileId) return;
    await updateSleepSchedule({ profileId: currentProfileId, enabled: false });
  }, [currentProfileId, updateSleepSchedule]);

  const toggle = useCallback(async () => {
    if (!currentProfileId) return;
    await toggleSleepModeMutation({ profileId: currentProfileId });
  }, [currentProfileId, toggleSleepModeMutation]);

  const setSchedule = useCallback(
    async (newSchedule: Partial<SleepSchedule>) => {
      if (!currentProfileId) return;
      await updateSleepSchedule({
        profileId: currentProfileId,
        enabled: newSchedule.enabled,
        startHour: newSchedule.startHour,
        startMinute: newSchedule.startMinute,
        endHour: newSchedule.endHour,
        endMinute: newSchedule.endMinute,
      });
    },
    [currentProfileId, updateSleepSchedule]
  );

  const setParentPin = useCallback(
    async (pin: string | null) => {
      // Store locally for temporary exit functionality
      setLocalParentPin(pin);

      // Also store hashed PIN in database for persistence
      if (!currentProfileId) return;

      if (pin) {
        const pinHash = await hashPin(pin);
        await setSleepPinMutation({ profileId: currentProfileId, pinHash });
      } else {
        await removeSleepPinMutation({ profileId: currentProfileId });
      }
    },
    [currentProfileId, setSleepPinMutation, removeSleepPinMutation]
  );

  const checkPinAndExit = useCallback(
    (pin: string): boolean => {
      if (localParentPin && pin === localParentPin) {
        setTemporaryExit(true);
        return true;
      }
      return false;
    },
    [localParentPin]
  );

  // Build state object
  const state: SleepModeState = {
    schedule,
    isCurrentlySleepTime,
    parentPin: localParentPin,
  };

  // Determine if sleep mode is currently active
  const isSleepTime = isCurrentlySleepTime && !temporaryExit;

  return (
    <SleepModeContext.Provider
      value={{
        state,
        isEnabled: schedule.enabled,
        isSleepTime,
        schedule,
        isInitialized,
        isLoading: profileSettings === undefined && currentProfileId !== undefined,
        sleepPinSet: profileSettings?.sleepPinSet ?? false,
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
