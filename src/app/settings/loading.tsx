import { Cog6ToothIcon } from '@heroicons/react/24/outline';

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-700/50"
        >
          <div className="flex-1">
            <div className="mb-2 h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
            <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
          </div>
          <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-600" />
        </div>
      ))}
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-700">
              <Cog6ToothIcon className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                Settings
              </h1>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Customize your CardDex experience
              </p>
            </div>
          </div>
        </div>

        {/* Skeleton Sections */}
        <div className="space-y-6">
          {/* Display Settings Skeleton */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 h-6 w-24 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
            <div className="mb-4 h-4 w-56 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-slate-700/50"
                >
                  <div className="flex-1">
                    <div className="mb-2 h-5 w-28 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
                    <div className="h-4 w-44 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
                  </div>
                  <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-600" />
                </div>
              ))}
            </div>
          </section>

          {/* Accessibility Settings Skeleton */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
            <div className="mb-4 h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
            <SettingsSkeleton />
          </section>

          {/* Games Settings Skeleton */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 h-6 w-40 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
            <div className="mb-4 h-4 w-72 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-slate-600"
                />
              ))}
            </div>
          </section>

          {/* Notifications Skeleton */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
            <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
          </section>
        </div>
      </div>
    </main>
  );
}
