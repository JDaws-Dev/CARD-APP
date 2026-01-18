'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  BookOpenIcon,
  LockClosedIcon,
  SparklesIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  MapIcon,
  StarIcon,
  TrophyIcon,
  FireIcon,
  BoltIcon,
  RocketLaunchIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

// ============================================================================
// CHAPTER DEFINITIONS
// ============================================================================

interface ChapterDefinition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  unlockRequirement: number;
  icon: typeof BookOpenIcon;
  gradient: string;
  bgPattern: string;
  storyText: string;
}

const CHAPTERS: ChapterDefinition[] = [
  {
    id: 'ch1_beginning',
    title: 'The Beginning',
    subtitle: 'Chapter 1',
    description: 'Every great journey starts with a single step...',
    unlockRequirement: 1,
    icon: SparklesIcon,
    gradient: 'from-emerald-400 to-teal-500',
    bgPattern: 'from-emerald-50 to-teal-50',
    storyText:
      "You've taken your first step into the world of trading card collecting! Like the greatest collectors before you, your adventure begins with a single card. This humble start marks the beginning of what could become a legendary collection. Keep going, young collector - destiny awaits!",
  },
  {
    id: 'ch2_rookie',
    title: 'The Rookie Collector',
    subtitle: 'Chapter 2',
    description: 'Building the foundations of greatness',
    unlockRequirement: 10,
    icon: StarIcon,
    gradient: 'from-blue-400 to-indigo-500',
    bgPattern: 'from-blue-50 to-indigo-50',
    storyText:
      "With 10 cards now in your possession, you've proven that you're serious about this journey. Other collectors are starting to notice your growing collection. The local card shop has begun to recognize you as a regular. Your binder is filling up nicely, and each card tells a story of discovery.",
  },
  {
    id: 'ch3_rising',
    title: 'Rising Through the Ranks',
    subtitle: 'Chapter 3',
    description: 'Your reputation begins to grow',
    unlockRequirement: 25,
    icon: BoltIcon,
    gradient: 'from-purple-400 to-pink-500',
    bgPattern: 'from-purple-50 to-pink-50',
    storyText:
      "25 cards! Word of your collection is spreading through the community. Fellow collectors seek you out at local events, eager to trade and share stories. You've developed an eye for rare cards and learned to spot the difference between conditions. Your journey has truly begun in earnest.",
  },
  {
    id: 'ch4_trainer',
    title: 'The True Trainer',
    subtitle: 'Chapter 4',
    description: 'Earning your place among collectors',
    unlockRequirement: 50,
    icon: TrophyIcon,
    gradient: 'from-amber-400 to-orange-500',
    bgPattern: 'from-amber-50 to-orange-50',
    storyText:
      "Half a hundred cards now call your collection home! You've earned the respect of veteran collectors. Your knowledge of sets, rarities, and card values has grown tremendously. Perhaps you've completed your first set or pulled your first ultra-rare. The thrill of the hunt drives you forward!",
  },
  {
    id: 'ch5_elite',
    title: 'Elite Collector',
    subtitle: 'Chapter 5',
    description: 'Standing among the dedicated',
    unlockRequirement: 100,
    icon: FireIcon,
    gradient: 'from-orange-400 to-red-500',
    bgPattern: 'from-orange-50 to-red-50',
    storyText:
      "100 cards! You've achieved what many collectors only dream of. Your collection spans multiple sets and features cards from every rarity tier. Local shop owners know you by name, and your opinion on cards carries weight. You're not just collecting anymore - you're curating a piece of trading card history.",
  },
  {
    id: 'ch6_master',
    title: 'Master of the Cards',
    subtitle: 'Chapter 6',
    description: 'A collection worthy of legends',
    unlockRequirement: 250,
    icon: RocketLaunchIcon,
    gradient: 'from-pink-400 to-rose-500',
    bgPattern: 'from-pink-50 to-rose-50',
    storyText:
      "250 cards in your collection marks you as a true Master. Your binders are filled with memories - each card a chapter in your personal collecting story. You've weathered market fluctuations, hunted chase cards, and built something truly special. Any card game publisher would be impressed!",
  },
  {
    id: 'ch7_legend',
    title: 'The Legendary Collector',
    subtitle: 'Chapter 7',
    description: 'Your name echoes through history',
    unlockRequirement: 500,
    icon: GlobeAltIcon,
    gradient: 'from-violet-400 to-purple-600',
    bgPattern: 'from-violet-50 to-purple-50',
    storyText:
      "500 cards! Your collection has transcended hobby and become art. Collectors from far and wide speak of your dedication. You've completed multiple sets, own cards from every era, and your knowledge is encyclopedic. You are no longer just playing the game - you ARE the game. Legendary status achieved!",
  },
];

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function CollectorsJourneyStorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CHAPTER CARD COMPONENT
// ============================================================================

interface ChapterCardProps {
  chapter: ChapterDefinition;
  isUnlocked: boolean;
  isSelected: boolean;
  cardCount: number;
  onSelect: () => void;
}

function ChapterCard({
  chapter,
  isUnlocked,
  isSelected,
  cardCount,
  onSelect,
}: ChapterCardProps) {
  const Icon = chapter.icon;
  const progress = Math.min(100, (cardCount / chapter.unlockRequirement) * 100);

  return (
    <button
      onClick={onSelect}
      disabled={!isUnlocked}
      className={cn(
        'group relative w-full overflow-hidden rounded-xl p-4 text-left transition-all',
        isUnlocked
          ? 'cursor-pointer bg-white shadow-sm hover:shadow-md'
          : 'cursor-not-allowed bg-gray-100',
        isSelected && isUnlocked && 'ring-2 ring-indigo-500 ring-offset-2'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl',
            isUnlocked
              ? `bg-gradient-to-br ${chapter.gradient}`
              : 'bg-gray-300'
          )}
        >
          {isUnlocked ? (
            <Icon className="h-6 w-6 text-white" />
          ) : (
            <LockClosedIcon className="h-5 w-5 text-gray-500" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-xs font-semibold uppercase tracking-wider',
                isUnlocked ? 'text-indigo-600' : 'text-gray-400'
              )}
            >
              {chapter.subtitle}
            </span>
            {isUnlocked && (
              <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
            )}
          </div>
          <h3
            className={cn(
              'mt-0.5 font-bold',
              isUnlocked ? 'text-gray-900' : 'text-gray-400'
            )}
          >
            {chapter.title}
          </h3>
          <p
            className={cn(
              'mt-0.5 text-sm',
              isUnlocked ? 'text-gray-600' : 'text-gray-400'
            )}
          >
            {isUnlocked
              ? chapter.description
              : `Unlocks at ${chapter.unlockRequirement} cards`}
          </p>

          {/* Progress bar for locked chapters */}
          {!isUnlocked && (
            <div className="mt-2">
              <div className="mb-1 flex justify-between text-xs text-gray-400">
                <span>
                  {cardCount} / {chapter.unlockRequirement} cards
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-gray-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Arrow */}
        {isUnlocked && (
          <ChevronRightIcon
            className={cn(
              'h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1',
              isSelected && 'text-indigo-500'
            )}
          />
        )}
      </div>
    </button>
  );
}

// ============================================================================
// STORY READER COMPONENT
// ============================================================================

interface StoryReaderProps {
  chapter: ChapterDefinition;
  onClose: () => void;
}

function StoryReader({ chapter, onClose }: StoryReaderProps) {
  const Icon = chapter.icon;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 shadow-lg',
        chapter.bgPattern
      )}
    >
      {/* Decorative background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="mb-4 flex items-center gap-4">
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg',
              chapter.gradient
            )}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              {chapter.subtitle}
            </p>
            <h2
              className={cn(
                'bg-gradient-to-r bg-clip-text text-2xl font-extrabold text-transparent',
                chapter.gradient
              )}
            >
              {chapter.title}
            </h2>
          </div>
        </div>

        {/* Story text */}
        <div className="rounded-xl bg-white/80 p-5 shadow-inner backdrop-blur-sm">
          <BookOpenIcon className="mb-3 h-8 w-8 text-gray-400" />
          <p className="leading-relaxed text-gray-700">{chapter.storyText}</p>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className={cn(
            'mt-4 w-full rounded-xl bg-gradient-to-r py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg',
            chapter.gradient
          )}
        >
          Continue Your Journey
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CollectorsJourneyStoryProps {
  className?: string;
}

export function CollectorsJourneyStory({ className }: CollectorsJourneyStoryProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const [selectedChapter, setSelectedChapter] = useState<ChapterDefinition | null>(null);

  const milestoneProgress = useQuery(
    api.achievements.getMilestoneProgress,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  if (profileLoading || milestoneProgress === undefined) {
    return <CollectorsJourneyStorySkeleton />;
  }

  const cardCount = milestoneProgress.totalUniqueCards;
  const unlockedChapters = CHAPTERS.filter((ch) => cardCount >= ch.unlockRequirement);
  const nextChapter = CHAPTERS.find((ch) => cardCount < ch.unlockRequirement);

  // Calculate overall journey progress
  const maxCards = CHAPTERS[CHAPTERS.length - 1].unlockRequirement;
  const overallProgress = Math.min(100, (cardCount / maxCards) * 100);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Journey Header */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <MapIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Your Collector&apos;s Journey</h2>
            <p className="text-sm text-white/80">
              {unlockedChapters.length} of {CHAPTERS.length} chapters unlocked
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{cardCount}</p>
            <p className="text-xs text-white/80">cards collected</p>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-white/80">
            <span>Journey Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Story Reader (if chapter selected) */}
      {selectedChapter && (
        <StoryReader
          chapter={selectedChapter}
          onClose={() => setSelectedChapter(null)}
        />
      )}

      {/* Chapter List */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 font-semibold text-gray-700">
          <BookOpenIcon className="h-5 w-5 text-indigo-500" />
          Story Chapters
        </h3>

        {CHAPTERS.map((chapter) => {
          const isUnlocked = cardCount >= chapter.unlockRequirement;
          return (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              isUnlocked={isUnlocked}
              isSelected={selectedChapter?.id === chapter.id}
              cardCount={cardCount}
              onSelect={() => isUnlocked && setSelectedChapter(chapter)}
            />
          );
        })}
      </div>

      {/* Next Chapter Hint */}
      {nextChapter && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center">
          <SparklesIcon className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="font-medium text-gray-600">
            Collect {nextChapter.unlockRequirement - cardCount} more card
            {nextChapter.unlockRequirement - cardCount !== 1 ? 's' : ''} to unlock
          </p>
          <p className="text-sm text-gray-500">{nextChapter.title}</p>
        </div>
      )}
    </div>
  );
}
