'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LearnToCollect } from '@/components/tutorials/LearnToCollect';
import {
  GradeLikeAProGame,
  GradeLikeAProButton,
} from '@/components/games/GradeLikeAProGame';
import {
  RarityGuessingGame,
  RarityGuessingButton,
} from '@/components/games/RarityGuessingGame';
import {
  SetSymbolMatchingGame,
  SetSymbolMatchingButton,
} from '@/components/games/SetSymbolMatchingGame';
import {
  PokemonTypeQuiz,
  PokemonTypeQuizButton,
} from '@/components/games/PokemonTypeQuiz';
import {
  PriceEstimationGame,
  PriceEstimationGameButton,
} from '@/components/games/PriceEstimationGame';
import {
  BookOpenIcon,
  SparklesIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  StarIcon,
  QuestionMarkCircleIcon,
  PuzzlePieceIcon,
  FireIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/solid';

export default function LearnPage() {
  const [isGradeGameOpen, setIsGradeGameOpen] = useState(false);
  const [isRarityGameOpen, setIsRarityGameOpen] = useState(false);
  const [isSetSymbolGameOpen, setIsSetSymbolGameOpen] = useState(false);
  const [isTypeQuizOpen, setIsTypeQuizOpen] = useState(false);
  const [isPriceGameOpen, setIsPriceGameOpen] = useState(false);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Featured Guide Banner - Card Condition Guide */}
      <div className="mb-8 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 shadow-md">
              <MagnifyingGlassIcon className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">Card Condition Guide</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <SparklesIcon className="h-3 w-3" aria-hidden="true" />
                  New
                </span>
              </div>
              <p className="text-gray-600">
                Learn to tell the difference between NM, LP, MP, HP, and DMG conditions. Understand
                card grading to protect your collection and make fair trades!
              </p>
            </div>
          </div>
          <Link
            href="/condition-guide"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-3 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
          >
            <BookOpenIcon className="h-5 w-5" aria-hidden="true" />
            View Guide
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Educational Mini-Game - Grade Like a Pro */}
      <div className="mb-8 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
              <AcademicCapIcon className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">Grade Like a Pro</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <StarIcon className="h-3 w-3" aria-hidden="true" />
                  Mini-Game
                </span>
              </div>
              <p className="text-gray-600">
                Test your card grading skills! Look at cards and guess their condition to earn XP.
                Perfect for learning what to look for when grading your own cards.
              </p>
            </div>
          </div>
          <GradeLikeAProButton onClick={() => setIsGradeGameOpen(true)} />
        </div>
      </div>

      {/* Grade Like a Pro Game Modal */}
      <GradeLikeAProGame isOpen={isGradeGameOpen} onClose={() => setIsGradeGameOpen(false)} />

      {/* Educational Mini-Game - Rarity Guessing */}
      <div className="mb-8 rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
              <QuestionMarkCircleIcon className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">Rarity Guessing Game</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <StarIcon className="h-3 w-3" aria-hidden="true" />
                  Mini-Game
                </span>
              </div>
              <p className="text-gray-600">
                Can you tell a Common from an Ultra Rare just by looking? Test your skills and learn
                what makes each rarity special!
              </p>
            </div>
          </div>
          <RarityGuessingButton onClick={() => setIsRarityGameOpen(true)} />
        </div>
      </div>

      {/* Rarity Guessing Game Modal */}
      <RarityGuessingGame isOpen={isRarityGameOpen} onClose={() => setIsRarityGameOpen(false)} />

      {/* Educational Mini-Game - Set Symbol Matching */}
      <div className="mb-8 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
              <PuzzlePieceIcon className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">Set Symbol Matching</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <StarIcon className="h-3 w-3" aria-hidden="true" />
                  Mini-Game
                </span>
              </div>
              <p className="text-gray-600">
                Learn to recognize Pokemon TCG set symbols! Match symbols to their set names and
                become a set identification expert.
              </p>
            </div>
          </div>
          <SetSymbolMatchingButton onClick={() => setIsSetSymbolGameOpen(true)} />
        </div>
      </div>

      {/* Set Symbol Matching Game Modal */}
      <SetSymbolMatchingGame
        isOpen={isSetSymbolGameOpen}
        onClose={() => setIsSetSymbolGameOpen(false)}
      />

      {/* Educational Mini-Game - Pokemon Type Quiz */}
      <div className="mb-8 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 shadow-md">
              <FireIcon className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">Pokemon Type Quiz</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <StarIcon className="h-3 w-3" aria-hidden="true" />
                  Mini-Game
                </span>
              </div>
              <p className="text-gray-600">
                Test your knowledge of Pokemon types! Look at cards and guess whether they&apos;re
                Fire, Water, Grass, or other types. Learn the energy types used in the TCG!
              </p>
            </div>
          </div>
          <PokemonTypeQuizButton onClick={() => setIsTypeQuizOpen(true)} />
        </div>
      </div>

      {/* Pokemon Type Quiz Modal */}
      <PokemonTypeQuiz isOpen={isTypeQuizOpen} onClose={() => setIsTypeQuizOpen(false)} />

      {/* Educational Mini-Game - Price Estimation */}
      <div className="mb-8 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
              <CurrencyDollarIcon className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">Price Estimation Game</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <StarIcon className="h-3 w-3" aria-hidden="true" />
                  Mini-Game
                </span>
              </div>
              <p className="text-gray-600">
                Learn card values by guessing if cards are worth more or less than a given price.
                Great for understanding what makes cards valuable!
              </p>
            </div>
          </div>
          <PriceEstimationGameButton onClick={() => setIsPriceGameOpen(true)} />
        </div>
      </div>

      {/* Price Estimation Game Modal */}
      <PriceEstimationGame isOpen={isPriceGameOpen} onClose={() => setIsPriceGameOpen(false)} />

      <LearnToCollect />
    </main>
  );
}
