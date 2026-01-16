import { AvatarCustomizerSkeleton } from '@/components/profile/AvatarCustomizer';
import { ArrowLeftIcon, UserCircleIcon } from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-12 pt-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400">
            <ArrowLeftIcon className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-kid-primary to-purple-500 shadow-lg">
              <UserCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <Skeleton className="mb-2 h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>

        {/* Avatar Customizer skeleton */}
        <AvatarCustomizerSkeleton />
      </div>
    </main>
  );
}
