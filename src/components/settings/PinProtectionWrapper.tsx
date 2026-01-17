'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import {
  LockClosedIcon,
  LockOpenIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface PinProtectionWrapperProps {
  familyId: Id<'families'> | undefined;
  children: React.ReactNode;
}

/**
 * Wrapper component that protects Family Controls settings with PIN verification.
 * If a PIN is set, the children are hidden behind a PIN entry form.
 * If no PIN is set, prompts the parent to create one.
 */
export function PinProtectionWrapper({ familyId, children }: PinProtectionWrapperProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // PIN setup state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);

  // Check if PIN is set for this family
  const pinStatus = useQuery(
    api.pinProtection.getPinStatus,
    familyId ? { familyId } : 'skip'
  );

  // Mutation to verify PIN
  const verifyPin = useMutation(api.pinProtection.verifyParentPin);

  // Mutation to set PIN
  const setPin = useMutation(api.pinProtection.setParentPin);

  const handlePinSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!familyId || !pinInput) return;

      setIsVerifying(true);
      setError('');

      try {
        const result = await verifyPin({ familyId, pin: pinInput });
        if (result.success) {
          setIsUnlocked(true);
          setPinInput('');
        } else {
          setError(result.message || 'Incorrect PIN');
          setPinInput('');
        }
      } catch (err) {
        setError('Failed to verify PIN. Please try again.');
        setPinInput('');
      } finally {
        setIsVerifying(false);
      }
    },
    [familyId, pinInput, verifyPin]
  );

  const handleLock = useCallback(() => {
    setIsUnlocked(false);
    setPinInput('');
    setError('');
  }, []);

  const handlePinSetup = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!familyId || !newPin) return;

      // Validate PIN
      if (newPin.length < 4) {
        setError('PIN must be at least 4 digits');
        return;
      }

      if (newPin !== confirmPin) {
        setError('PINs do not match');
        return;
      }

      setIsSettingPin(true);
      setError('');

      try {
        await setPin({ familyId, newPin });
        setNewPin('');
        setConfirmPin('');
        setIsUnlocked(true);
      } catch (err) {
        setError('Failed to set PIN. Please try again.');
      } finally {
        setIsSettingPin(false);
      }
    },
    [familyId, newPin, confirmPin, setPin]
  );

  // Loading state
  if (pinStatus === undefined) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 rounded-lg bg-gray-200 dark:bg-slate-700" />
        <div className="h-48 rounded-lg bg-gray-200 dark:bg-slate-700" />
      </div>
    );
  }

  // No PIN is set - prompt parent to create one
  if (!pinStatus?.hasPinConfigured) {
    return (
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 dark:border-amber-600 dark:bg-amber-900/20">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
            <ShieldCheckIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Set Up Parent PIN
          </h3>
          <p className="mb-6 text-sm text-gray-600 dark:text-slate-400">
            Create a PIN to protect Family Controls from little fingers. You&apos;ll need this PIN to
            access or change these settings.
          </p>

          <form onSubmit={handlePinSetup} className="w-full max-w-xs">
            <div className="mb-4">
              <label htmlFor="new-pin-input" className="mb-1 block text-left text-sm text-gray-600 dark:text-slate-400">
                Create PIN (4-6 digits)
              </label>
              <input
                id="new-pin-input"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={newPin}
                onChange={(e) => {
                  setNewPin(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="Enter PIN"
                autoFocus
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-lg tracking-widest shadow-sm transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-amber-400"
                disabled={isSettingPin}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="confirm-pin-input" className="mb-1 block text-left text-sm text-gray-600 dark:text-slate-400">
                Confirm PIN
              </label>
              <input
                id="confirm-pin-input"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="Confirm PIN"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-lg tracking-widest shadow-sm transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-amber-400"
                disabled={isSettingPin}
              />
            </div>

            {error && (
              <div className="mb-4 flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400">
                <ExclamationCircleIcon className="h-4 w-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSettingPin || newPin.length < 4 || confirmPin.length < 4}
              className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 font-medium text-white shadow-sm transition-all hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSettingPin ? 'Setting Up...' : 'Set PIN & Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // PIN is set but not unlocked - show PIN entry
  if (!isUnlocked) {
    return (
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 dark:border-amber-600 dark:bg-amber-900/20">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
            <LockClosedIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Family Controls Locked
          </h3>
          <p className="mb-6 text-sm text-gray-600 dark:text-slate-400">
            Enter your Parent PIN to access these settings
          </p>

          <form onSubmit={handlePinSubmit} className="w-full max-w-xs">
            <div className="mb-4">
              <label htmlFor="pin-input" className="sr-only">
                Enter PIN
              </label>
              <input
                id="pin-input"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="Enter PIN"
                autoFocus
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-center text-lg tracking-widest shadow-sm transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-amber-400"
                disabled={isVerifying}
              />
            </div>

            {error && (
              <div className="mb-4 flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400">
                <ExclamationCircleIcon className="h-4 w-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || pinInput.length < 4}
              className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 font-medium text-white shadow-sm transition-all hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Unlock'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // PIN is set and unlocked - show children with lock button
  return (
    <div className="relative">
      {/* Lock button in corner */}
      <button
        onClick={handleLock}
        className="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-sm transition-colors hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-900"
        title="Lock Family Controls"
        aria-label="Lock Family Controls"
      >
        <LockOpenIcon className="h-4 w-4" />
      </button>

      {/* Unlocked indicator */}
      <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
        <LockOpenIcon className="h-4 w-4" />
        <span>Family Controls unlocked</span>
        <button
          onClick={handleLock}
          className="ml-2 rounded-md p-1 text-green-600 transition-colors hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
          aria-label="Lock"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {children}
    </div>
  );
}
