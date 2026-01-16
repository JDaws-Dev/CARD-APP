'use client';

import { useState } from 'react';
import { MoonIcon, ClockIcon, LockClosedIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useSleepMode, formatTime } from '@/components/providers/SleepModeProvider';

export function SleepModeSettings() {
  const { isEnabled, schedule, toggle, setSchedule, setParentPin, state } = useSleepMode();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleTimeChange = (
    field: 'startHour' | 'startMinute' | 'endHour' | 'endMinute',
    value: string
  ) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setSchedule({ [field]: numValue });
    }
  };

  const handlePinSave = () => {
    if (newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    setParentPin(newPin);
    setNewPin('');
    setConfirmPin('');
    setPinError('');
    setShowPinSetup(false);
  };

  const handlePinRemove = () => {
    setParentPin(null);
  };

  // Generate hour options
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  return (
    <div className="space-y-4">
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
          onClick={toggle}
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
            Schedule
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
              Set a PIN to allow parents to temporarily exit sleep mode
            </p>

            {state.parentPin ? (
              <div className="flex items-center justify-between rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                <div className="flex items-center gap-2">
                  <LockClosedIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-700 dark:text-green-300">
                    PIN is set
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
    </div>
  );
}
