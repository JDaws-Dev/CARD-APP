'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  XMarkIcon,
  UserPlusIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowUpCircleIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

interface AddProfileModalProps {
  familyId: Id<'families'>;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * AddProfileModal - Modal for adding a new child profile to the family
 * Validates profile limits based on subscription tier and ensures kid-safe display names
 */
export function AddProfileModal({ familyId, isOpen, onClose, onSuccess }: AddProfileModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if we can add a profile
  const canCreateCheck = useQuery(
    api.profiles.canCreateChildProfile,
    isOpen ? { familyId } : 'skip'
  );

  // Real-time name validation
  const nameValidation = useQuery(
    api.profiles.validateChildProfileName,
    isOpen && displayName.trim().length > 0 ? { familyId, displayName: displayName.trim() } : 'skip'
  );

  // Create profile mutation
  const createChildProfile = useMutation(api.profiles.createChildProfileValidated);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayName('');
      setError(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmedName = displayName.trim();
      if (!trimmedName) {
        setError('Please enter a display name');
        return;
      }

      setIsSubmitting(true);

      try {
        const result = await createChildProfile({
          familyId,
          displayName: trimmedName,
        });

        if (result.success) {
          setSuccessMessage(`Profile "${trimmedName}" created successfully!`);
          // Wait briefly to show success, then close
          setTimeout(() => {
            onSuccess?.();
            onClose();
          }, 1500);
        } else {
          // Handle validation errors from the mutation
          const errorMessages = result.errors.map((e) => e.message).join('. ');
          setError(errorMessages || 'Failed to create profile');
          setIsSubmitting(false);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create profile';
        setError(errorMessage);
        setIsSubmitting(false);
      }
    },
    [createChildProfile, displayName, familyId, onClose, onSuccess]
  );

  if (!isOpen) return null;

  // Loading state while checking permissions
  if (canCreateCheck === undefined) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-profile-title"
      >
        <div className="mx-4 max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
          </div>
        </div>
      </div>
    );
  }

  // Cannot add profile (limit reached)
  if (!canCreateCheck.allowed) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-profile-title"
      >
        <div
          className="relative mx-4 max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="text-center">
            {canCreateCheck.upgradeRequired ? (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100">
                  <ArrowUpCircleIcon className="h-8 w-8 text-amber-600" />
                </div>
                <h2 id="add-profile-title" className="mb-2 text-xl font-bold text-gray-800">
                  Upgrade for More Profiles
                </h2>
                <p className="mb-6 text-gray-600">{canCreateCheck.reason}</p>
                <button
                  onClick={onClose}
                  className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-amber-600 hover:to-orange-600"
                >
                  Got it
                </button>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                  <ExclamationCircleIcon className="h-8 w-8 text-red-500" />
                </div>
                <h2 id="add-profile-title" className="mb-2 text-xl font-bold text-gray-800">
                  Cannot Add Profile
                </h2>
                <p className="mb-6 text-gray-600">{canCreateCheck.reason}</p>
                <button
                  onClick={onClose}
                  className="rounded-lg bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (successMessage) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-profile-title"
      >
        <div className="relative mx-4 max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 id="add-profile-title" className="mb-2 text-xl font-bold text-gray-800">
              Profile Created!
            </h2>
            <p className="text-gray-600">{successMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  const isNameValid = nameValidation?.isValid ?? false;
  const nameErrors = nameValidation?.errors ?? [];
  const showNameError = displayName.trim().length > 0 && !isNameValid && nameErrors.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-profile-title"
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50"
          aria-label="Close modal"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100">
            <UserPlusIcon className="h-8 w-8 text-purple-600" />
          </div>
          <h2 id="add-profile-title" className="text-xl font-bold text-gray-800">
            Add Child Profile
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Create a new profile for your child to track their collection
          </p>
        </div>

        {/* Profile limit info */}
        {canCreateCheck.childProfilesRemaining !== undefined && (
          <div className="mb-4 rounded-lg bg-purple-50 px-3 py-2 text-center text-sm text-purple-700">
            {canCreateCheck.childProfilesRemaining === 1
              ? 'You can add 1 more child profile'
              : `You can add ${canCreateCheck.childProfilesRemaining} more child profiles`}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isSubmitting}
              placeholder="Enter child's name or nickname"
              maxLength={30}
              className={cn(
                'w-full rounded-lg border px-4 py-2.5 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-500',
                showNameError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-200 focus:border-purple-500 focus:ring-purple-200'
              )}
              aria-describedby={showNameError ? 'name-error' : undefined}
            />
            {/* Character count */}
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-gray-400">{displayName.length}/30 characters</span>
              {displayName.trim().length > 0 && isNameValid && (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircleIcon className="h-3 w-3" />
                  Valid name
                </span>
              )}
            </div>
            {/* Name validation errors */}
            {showNameError && (
              <p id="name-error" className="mt-1.5 text-sm text-red-600">
                {nameErrors[0]?.message}
              </p>
            )}
          </div>

          {/* General error */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || !displayName.trim() || showNameError}
            className={cn(
              'w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
              isSubmitting || !displayName.trim() || showNameError
                ? 'cursor-not-allowed bg-gray-300'
                : 'bg-gradient-to-r from-kid-primary to-purple-500 hover:from-purple-600 hover:to-purple-600'
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating...
              </span>
            ) : (
              'Create Profile'
            )}
          </button>

          {/* Cancel link */}
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="mt-3 w-full text-center text-sm text-gray-500 transition hover:text-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
