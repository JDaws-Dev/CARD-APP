'use client';

import { useState } from 'react';
import { QuestionMarkCircleIcon, CheckIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

/**
 * Help legend explaining what the heart, star, and other icons mean
 */
export function IconLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
        aria-label="Show icon help"
      >
        <QuestionMarkCircleIcon className="h-4 w-4" />
        <span>Help</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Popup */}
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl bg-white p-4 shadow-xl">
            <h4 className="mb-3 font-semibold text-gray-800">Icon Guide</h4>

            <div className="space-y-3">
              {/* Wishlist */}
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-rose-500 text-white">
                  <HeartIconSolid className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Wishlist</p>
                  <p className="text-xs text-gray-500">Cards you want to get. Share with family!</p>
                </div>
              </div>

              {/* Priority */}
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-400 text-white">
                  <StarIconSolid className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Priority (max 5)</p>
                  <p className="text-xs text-gray-500">
                    Your MOST wanted cards! Tap star after adding to wishlist.
                  </p>
                </div>
              </div>

              {/* Owned */}
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                  <CheckIcon className="h-4 w-4" strokeWidth={3} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Owned</p>
                  <p className="text-xs text-gray-500">
                    Cards in your collection. Tap card to add/remove.
                  </p>
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-start gap-3">
                <div className="flex h-6 min-w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500 px-1 text-xs font-bold text-white">
                  x3
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Quantity</p>
                  <p className="text-xs text-gray-500">
                    How many copies you have. Hover card to adjust.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
            >
              Got it!
            </button>
          </div>
        </>
      )}
    </div>
  );
}
