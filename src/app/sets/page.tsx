import { getAllSupportedSets } from '@/lib/pokemon-tcg';
import { SetsList, SetStructureButton } from '@/components/sets';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';

export const metadata = {
  title: 'Pokemon Sets - KidCollect',
  description: 'Browse all Pokemon card sets from Scarlet & Violet and Sword & Shield eras',
};

export default async function SetsPage() {
  const sets = await getAllSupportedSets();

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
              Back to Home
            </Link>
          </div>
          <h1 className="bg-gradient-to-r from-kid-primary to-kid-secondary bg-clip-text text-4xl font-bold text-transparent">
            Pokemon Sets
          </h1>
          <p className="mt-2 text-gray-600">Choose a set to start tracking your collection!</p>

          {/* Set Structure Intro Button */}
          <div className="mt-4">
            <SetStructureButton />
          </div>
        </div>

        {/* Sets List with Series Filter */}
        <SetsList sets={sets} />
      </div>
    </main>
  );
}
