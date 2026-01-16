'use client';

import Link from 'next/link';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { AvatarCustomizer, AvatarCustomizerSkeleton } from '@/components/profile/AvatarCustomizer';
import { ArrowLeftIcon, UserCircleIcon, SparklesIcon } from '@heroicons/react/24/solid';

export default function ProfilePage() {
  const { profileId, isLoading } = useCurrentProfile();

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-12 pt-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/collection"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Back to Collection
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-kid-primary to-purple-500 shadow-lg">
              <UserCircleIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Profile & Avatar</h1>
              <p className="text-sm text-gray-500 sm:text-base">
                Customize your avatar with unlocked items
              </p>
            </div>
          </div>
        </div>

        {/* Avatar Customizer */}
        {isLoading ? (
          <AvatarCustomizerSkeleton />
        ) : profileId ? (
          <AvatarCustomizer profileId={profileId} />
        ) : (
          <div className="rounded-2xl bg-gray-50 p-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <SparklesIcon className="h-10 w-10 text-gray-300" aria-hidden="true" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-800">No Profile Found</h2>
            <p className="mb-6 text-gray-500">
              Please sign in or create a profile to customize your avatar.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-kid-primary to-purple-500 px-6 py-3 font-semibold text-white shadow-md transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
