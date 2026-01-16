import { getSet, getCardsInSet } from '@/lib/pokemon-tcg';
import Link from 'next/link';
import Image from 'next/image';
import { SetDetailClient } from '@/components/collection/SetDetailClient';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface SetDetailPageProps {
  params: { setId: string };
}

export async function generateMetadata({ params }: SetDetailPageProps) {
  const set = await getSet(params.setId);
  return {
    title: `${set.name} - KidCollect`,
    description: `Track your ${set.name} Pokemon card collection`,
  };
}

export default async function SetDetailPage({ params }: SetDetailPageProps) {
  const [set, cards] = await Promise.all([getSet(params.setId), getCardsInSet(params.setId)]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/sets"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Sets
          </Link>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* Set Logo */}
            {set.images?.logo && (
              <Image
                src={set.images.logo}
                alt={set.name}
                width={200}
                height={80}
                className="h-auto max-h-16 w-auto"
              />
            )}

            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-800">{set.name}</h1>
              <p className="text-gray-500">{set.series}</p>
            </div>

            {/* Set Symbol */}
            {set.images?.symbol && (
              <Image src={set.images.symbol} alt="" width={40} height={40} className="h-10 w-10" />
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-6 rounded-2xl bg-white p-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Collection Progress</span>
              <span className="text-lg font-bold text-kid-primary">0 / {set.total} cards</span>
            </div>
            <div className="progress-bar mt-2">
              <div className="progress-bar-fill" style={{ width: '0%' }} />
            </div>
            <p className="mt-2 text-center text-sm text-gray-500">
              Start tapping cards below to add them to your collection!
            </p>
          </div>
        </div>

        {/* Card Grid with Rarity Filter */}
        <SetDetailClient set={set} cards={cards} />
      </div>
    </main>
  );
}
