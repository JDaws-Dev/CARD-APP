'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  MoonIcon,
  ClockIcon,
  LockClosedIcon,
  TrashIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { formatTime, hashPin } from '@/components/providers/SleepModeProvider';

// ============================================================================
// TYPES
// ============================================================================

interface ChildProfile {
  id: Id<'profiles'>;
  displayName: string;
  profileType?: 'parent' | 'child';
}

interface SleepSchedule {
  enabled: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

// ============================================================================
// PROFILE SELECTOR COMPONENT
// ============================================================================

interface ProfileSelectorProps {
  profiles: ChildProfile[];
  selectedProfileId: Id<'profiles'> | null;
  onSelectProfile: (profileId: Id<'profiles'>) => void;
}

function ProfileSelector({ profiles, selectedProfileId, onSelectProfile }: ProfileSelectorProps) {
  const childProfiles = profiles.filter((p) => p.profileType === 'child');

  if (childProfiles.length === 0) {
    return (
      <div className="rounded-lg bg-gray-100 p-4 text-center text-sm text-gray-600 dark:bg-slate-700/50 dark:text-slate-400">
        No child profiles found. Add a child profile to configure their sleep schedule.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
        Select a child to configure their sleep schedule:
      </p>
      <div className="flex flex-wrap gap-2">
        {childProfiles.map((profile) => (
          <button
            key={profile.id}
            type="button"
            onClick={() => onSelectProfile(profile.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              selectedProfileId === profile.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <UserCircleIcon className="h-5 w-5" />
            {profile.displayName}
            {selectedProfileId === profile.id && (
              <CheckIcon className="h-4 w-4" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SleepModeSettings() {
  const PROFILE_ID_KEY = 'kidcollect_profile_id';

  // Get current user's profile to access family profiles
  const currentUserProfile = useQuery(api.profiles.getCurrentUserProfile, {});
  const availableProfiles = useMemo(
    () => currentUserProfile?.availableProfiles ?? [],
    [currentUserProfile?.availableProfiles]
  );

  // Get current profile ID from localStorage
  const [currentProfileId, setCurrentProfileId] = useState<Id<'profiles'> | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<Id<'profiles'> | null>(null);

  // Initialize profile IDs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem(PROFILE_ID_KEY);
      if (savedId) {
        setCurrentProfileId(savedId as Id<'profiles'>);
      }
    }
  }, []);

  // Auto-select first child if parent is viewing and no child selected
  useEffect(() => {
    const currentProfile = availableProfiles.find((p) => p.id === currentProfileId);
    const childProfiles = availableProfiles.filter((p) => p.profileType === 'child');

    if (currentProfile?.profileType === 'parent' && !selectedChildId && childProfiles.length > 0) {
      setSelectedChildId(childProfiles[0].id);
    } else if (currentProfile?.profileType === 'child' && !selectedChildId) {
      // If current user is a child, show their own settings
      setSelectedChildId(currentProfileId);
    }
  }, [availableProfiles, currentProfileId, selectedChildId]);

  // Determine which profile to show settings for
  const targetProfileId = selectedChildId;
  const currentProfile = availableProfiles.find((p) => p.id === currentProfileId);
  const isParent = currentProfile?.profileType === 'parent';

  // Query settings for the target profile
  const profileSettings = useQuery(
    api.profileSettings.getProfileSettings,
    targetProfileId ? { profileId: targetProfileId } : 'skip'
  );

  // Mutations
  const updateSleepSchedule = useMutation(api.profileSettings.updateSleepSchedule);
  const toggleSleepModeMutation = useMutation(api.profileSettings.toggleSleepMode);
  const setSleepPinMutation = useMutation(api.profileSettings.setSleepPin);
  const removeSleepPinMutation = useMutation(api.profileSettings.removeSleepPin);

  // Local state for PIN management
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Build schedule from Convex data
  const schedule: SleepSchedule = profileSettings?.sleepSchedule ?? {
    enabled: false,
    startHour: 20,
    startMinute: 0,
    endHour: 7,
    endMinute: 0,
  };
  const isEnabled = schedule.enabled;
  const sleepPinSet = profileSettings?.sleepPinSet ?? false;

  const handleToggle = async () => {
    if (!targetProfileId) return;
    await toggleSleepModeMutation({
      profileId: targetProfileId,
      updatedBy: currentProfileId ?? undefined,
    });
  };

  const handleTimeChange = async (
    field: 'startHour' | 'startMinute' | 'endHour' | 'endMinute',
    value: string
  ) => {
    if (!targetProfileId) return;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      await updateSleepSchedule({
        profileId: targetProfileId,
        [field]: numValue,
        updatedBy: currentProfileId ?? undefined,
      });
    }
  };

  const handlePinSave = async () => {
    if (!targetProfileId) return;
    if (newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    const pinHash = await hashPin(newPin);
    await setSleepPinMutation({
      profileId: targetProfileId,
      pinHash,
      updatedBy: currentProfileId ?? undefined,
    });
    setNewPin('');
    setConfirmPin('');
    setPinError('');
    setShowPinSetup(false);
  };

  const handlePinRemove = async () => {
    if (!targetProfileId) return;
    await removeSleepPinMutation({
      profileId: targetProfileId,
      updatedBy: currentProfileId ?? undefined,
    });
  };

  // Generate hour options
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  // Get the name of the child being configured
  const targetProfile = availableProfiles.find((p) => p.id === targetProfileId);
  const targetName = targetProfile?.displayName ?? 'child';

  // Loading state
  if (!currentUserProfile || (targetProfileId && profileSettings === undefined)) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-16 rounded-lg bg-gray-200 dark:bg-slate-700" />
        <div className="h-48 rounded-lg bg-gray-200 dark:bg-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile selector (only shown to parents with multiple children) */}
      {isParent && availableProfiles.filter((p) => p.profileType === 'child').length > 0 && (
        <ProfileSelector
          profiles={availableProfiles as ChildProfile[]}
          selectedProfileId={selectedChildId}
          onSelectProfile={setSelectedChildId}
        />
      )}

      {!targetProfileId ? (
        <div className="rounded-lg bg-gray-100 p-4 text-center text-sm text-gray-600 dark:bg-slate-700/50 dark:text-slate-400">
          Select a child profile to configure their sleep schedule.
        </div>
      ) : (
        <>
          {/* Current profile indicator */}
          {isParent && targetProfile && (
            <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-700/50 dark:bg-indigo-900/20">
              <UserCircleIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                Configuring sleep settings for <strong>{targetName}</strong>
              </span>
            </div>
          )}

          {/* Enable toggle */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                <MoonIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Sleep Mode</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Show calming bedtime screen during quiet hours
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              role="switch"
              aria-checked={isEnabled}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                isEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Schedule settings */}
          {isEnabled && (
            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-600 dark:bg-slate-700/50">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                <ClockIcon className="h-4 w-4" />
                Schedule for {targetName}
              </div>

              {/* Start time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-600 dark:text-slate-400">
                    Bedtime
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={schedule.startHour}
                      onChange={(e) => handleTimeChange('startHour', e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                      {hours.map((h) => (
                        <option key={h} value={h}>
                          {formatTime(h, 0).split(':')[0]} {h >= 12 ? 'PM' : 'AM'}
                        </option>
                      ))}
                    </select>
                    <select
                      value={schedule.startMinute}
                      onChange={(e) => handleTimeChange('startMinute', e.target.value)}
                      className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                      {minutes.map((m) => (
                        <option key={m} value={m}>
                          :{m.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
                    {formatTime(schedule.startHour, schedule.startMinute)}
                  </p>
                </div>

                {/* End time */}
                <div>
                  <label className="mb-1 block text-sm text-gray-600 dark:text-slate-400">
                    Wake time
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={schedule.endHour}
                      onChange={(e) => handleTimeChange('endHour', e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                      {hours.map((h) => (
                        <option key={h} value={h}>
                          {formatTime(h, 0).split(':')[0]} {h >= 12 ? 'PM' : 'AM'}
                        </option>
                      ))}
                    </select>
                    <select
                      value={schedule.endMinute}
                      onChange={(e) => handleTimeChange('endMinute', e.target.value)}
                      className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                      {minutes.map((m) => (
                        <option key={m} value={m}>
                          :{m.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
                    {formatTime(schedule.endHour, schedule.endMinute)}
                  </p>
                </div>
              </div>

              {/* Parent PIN */}
              <div className="border-t border-gray-200 pt-4 dark:border-slate-600">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                  <LockClosedIcon className="h-4 w-4" />
                  Parent PIN (Optional)
                </div>
                <p className="mb-3 mt-1 text-sm text-gray-600 dark:text-slate-400">
                  Set a PIN to allow parents to temporarily exit sleep mode for {targetName}
                </p>

                {sleepPinSet ? (
                  <div className="flex items-center justify-between rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                    <div className="flex items-center gap-2">
                      <LockClosedIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-700 dark:text-green-300">
                        PIN is set for {targetName}
                      </span>
                    </div>
                    <button
                      onClick={handlePinRemove}
                      className="flex items-center gap-1 text-sm text-red-600 transition-colors hover:text-red-700 dark:text-red-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                ) : showPinSetup ? (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm text-gray-600 dark:text-slate-400">
                        New PIN (4-6 digits)
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={newPin}
                        onChange={(e) => {
                          setNewPin(e.target.value.replace(/\D/g, ''));
                          setPinError('');
                        }}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        placeholder="Enter PIN"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-gray-600 dark:text-slate-400">
                        Confirm PIN
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={confirmPin}
                        onChange={(e) => {
                          setConfirmPin(e.target.value.replace(/\D/g, ''));
                          setPinError('');
                        }}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        placeholder="Confirm PIN"
                      />
                    </div>
                    {pinError && <p className="text-sm text-red-600 dark:text-red-400">{pinError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={handlePinSave}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                      >
                        Save PIN
                      </button>
                      <button
                        onClick={() => {
                          setShowPinSetup(false);
                          setNewPin('');
                          setConfirmPin('');
                          setPinError('');
                        }}
                        className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-slate-600 dark:text-slate-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPinSetup(true)}
                    className="rounded-lg bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300"
                  >
                    Set Parent PIN
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
