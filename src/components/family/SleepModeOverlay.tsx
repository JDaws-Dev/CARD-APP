'use client';

import { useState } from 'react';
import { MoonIcon, SunIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import { useSleepMode, formatTime } from '@/components/providers/SleepModeProvider';

export function SleepModeOverlay() {
  const { isSleepTime, schedule, checkPinAndExit, state } = useSleepMode();
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);

  if (!isSleepTime) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkPinAndExit(pinInput)) {
      setPinInput('');
      setPinError(false);
      setShowPinInput(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950">
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 animate-pulse rounded-full bg-white/60"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-md px-6 text-center">
        {/* Moon icon */}
        <div className="mx-auto mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-yellow-200 to-yellow-400 shadow-lg shadow-yellow-400/30">
          <MoonIcon className="h-20 w-20 text-yellow-600" />
        </div>

        {/* Message */}
        <h1 className="mb-4 text-4xl font-bold text-white">Time for Bed!</h1>
        <p className="mb-2 text-xl text-purple-200">
          Your cards will be here tomorrow.
        </p>
        <p className="mb-8 text-lg text-purple-300/80">
          Sleep well, little collector!
        </p>

        {/* Schedule info */}
        <div className="mb-8 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 text-purple-200">
            <MoonIcon className="h-5 w-5" />
            <span>Sleep time:</span>
            <span className="font-semibold text-white">
              {formatTime(schedule.startHour, schedule.startMinute)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2 text-purple-200">
            <SunIcon className="h-5 w-5 text-yellow-400" />
            <span>Wake time:</span>
            <span className="font-semibold text-white">
              {formatTime(schedule.endHour, schedule.endMinute)}
            </span>
          </div>
        </div>

        {/* Parent unlock */}
        {state.parentPin && (
          <div className="mt-8">
            {!showPinInput ? (
              <button
                onClick={() => setShowPinInput(true)}
                className="inline-flex items-center gap-2 text-sm text-purple-300/60 transition-colors hover:text-purple-200"
              >
                <LockClosedIcon className="h-4 w-4" />
                Parent unlock
              </button>
            ) : (
              <form onSubmit={handlePinSubmit} className="mx-auto max-w-xs">
                <label className="mb-2 block text-sm text-purple-200">
                  Enter parent PIN
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value.replace(/\D/g, ''));
                      setPinError(false);
                    }}
                    className={`flex-1 rounded-lg border-2 bg-white/10 px-4 py-2 text-center text-lg tracking-widest text-white placeholder-purple-300/50 backdrop-blur-sm transition-colors focus:outline-none ${
                      pinError
                        ? 'border-red-400 focus:border-red-400'
                        : 'border-purple-400/30 focus:border-purple-400'
                    }`}
                    placeholder="••••"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-500"
                  >
                    Unlock
                  </button>
                </div>
                {pinError && (
                  <p className="mt-2 text-sm text-red-400">Incorrect PIN</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowPinInput(false);
                    setPinError(false);
                    setPinInput('');
                  }}
                  className="mt-3 text-sm text-purple-300/60 transition-colors hover:text-purple-200"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}

        {/* Decorative clouds */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2">
          <div className="flex gap-4 opacity-20">
            <div className="h-16 w-32 rounded-full bg-white blur-xl" />
            <div className="h-20 w-40 rounded-full bg-white blur-xl" />
            <div className="h-16 w-32 rounded-full bg-white blur-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
