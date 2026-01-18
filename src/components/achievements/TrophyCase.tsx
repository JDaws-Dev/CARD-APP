'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import {
  TrophyIcon,
  StarIcon,
  FireIcon,
  CheckBadgeIcon,
  LockClosedIcon,
  SparklesIcon,
  BoltIcon,
  HeartIcon,
  MapIcon,
  RocketLaunchIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  getAllGameAchievements,
  getGameMilestoneProgress,
  getCrossGameProgress,
  GAME_MILESTONE_THRESHOLDS,
  CROSS_GAME_ACHIEVEMENTS,
  type GameAchievementDefinition,
  type GameAchievementProgress,
} from '@/lib/gameAchievements';
import { GAMES, getGameInfo, type GameId } from '@/lib/gameSelector';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';
import {
  PokemonIcon,
  YugiohIcon,
  OnePieceIcon,
  LorcanaIcon,
} from '@/components/icons/tcg';

// Badge category definitions
const BADGE_CATEGORIES = [
  {
    id: 'collector_milestone',
    name: 'Collector Milestones',
    description: 'Earn badges for growing your collection',
    icon: TrophyIcon,
    gradient: 'from-amber-500 to-orange-500',
    bgGradient: 'from-amber-50 to-orange-50',
  },
  {
    id: 'type_specialist',
    name: 'Type Specialists',
    description: 'Collect 10+ cards of a single type',
    icon: FireIcon,
    gradient: 'from-red-500 to-pink-500',
    bgGradient: 'from-red-50 to-pink-50',
  },
  {
    id: 'pokemon_fan',
    name: 'Pokemon Fans',
    description: 'Show your love for specific Pokemon',
    icon: HeartIcon,
    gradient: 'from-pink-500 to-rose-500',
    bgGradient: 'from-pink-50 to-rose-50',
  },
  {
    id: 'set_completion',
    name: 'Set Completion',
    description: 'Complete sets to earn badges',
    icon: MapIcon,
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50',
  },
  {
    id: 'streak',
    name: 'Streaks',
    description: 'Add cards consistently to build streaks',
    icon: BoltIcon,
    gradient: 'from-purple-500 to-indigo-500',
    bgGradient: 'from-purple-50 to-indigo-50',
  },
];

// Badge definitions with SVG icons (matching convex/achievements.ts)
const BADGE_DEFINITIONS: Record<
  string,
  {
    name: string;
    description: string;
    threshold: number;
    color: string;
    icon: typeof TrophyIcon;
    tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  }
> = {
  // Collector Milestones
  first_catch: {
    name: 'First Catch',
    description: 'Add your first card',
    threshold: 1,
    color: '#A8A878',
    icon: StarIcon,
    tier: 'bronze',
  },
  starter_collector: {
    name: 'Starter Collector',
    description: 'Collect 10 cards',
    threshold: 10,
    color: '#78C850',
    icon: StarIcon,
    tier: 'bronze',
  },
  rising_trainer: {
    name: 'Rising Trainer',
    description: 'Collect 50 cards',
    threshold: 50,
    color: '#6890F0',
    icon: StarIcon,
    tier: 'silver',
  },
  pokemon_trainer: {
    name: 'Pokemon Trainer',
    description: 'Collect 100 cards',
    threshold: 100,
    color: '#A040A0',
    icon: RocketLaunchIcon,
    tier: 'silver',
  },
  elite_collector: {
    name: 'Elite Collector',
    description: 'Collect 250 cards',
    threshold: 250,
    color: '#F08030',
    icon: ShieldCheckIcon,
    tier: 'gold',
  },
  pokemon_master: {
    name: 'Pokemon Master',
    description: 'Collect 500 cards',
    threshold: 500,
    color: '#F8D030',
    icon: TrophyIcon,
    tier: 'gold',
  },
  legendary_collector: {
    name: 'Legendary Collector',
    description: 'Collect 1000 cards',
    threshold: 1000,
    color: '#7038F8',
    icon: SparklesIcon,
    tier: 'platinum',
  },

  // Type Specialist Badges
  fire_trainer: {
    name: 'Fire Trainer',
    description: 'Collect 10+ Fire-type cards',
    threshold: 10,
    color: '#F08030',
    icon: FireIcon,
  },
  water_trainer: {
    name: 'Water Trainer',
    description: 'Collect 10+ Water-type cards',
    threshold: 10,
    color: '#6890F0',
    icon: CheckBadgeIcon,
  },
  grass_trainer: {
    name: 'Grass Trainer',
    description: 'Collect 10+ Grass-type cards',
    threshold: 10,
    color: '#78C850',
    icon: CheckBadgeIcon,
  },
  electric_trainer: {
    name: 'Electric Trainer',
    description: 'Collect 10+ Electric-type cards',
    threshold: 10,
    color: '#F8D030',
    icon: BoltIcon,
  },
  psychic_trainer: {
    name: 'Psychic Trainer',
    description: 'Collect 10+ Psychic-type cards',
    threshold: 10,
    color: '#F85888',
    icon: SparklesIcon,
  },
  fighting_trainer: {
    name: 'Fighting Trainer',
    description: 'Collect 10+ Fighting-type cards',
    threshold: 10,
    color: '#C03028',
    icon: ShieldCheckIcon,
  },
  darkness_trainer: {
    name: 'Darkness Trainer',
    description: 'Collect 10+ Darkness-type cards',
    threshold: 10,
    color: '#705848',
    icon: CheckBadgeIcon,
  },
  metal_trainer: {
    name: 'Metal Trainer',
    description: 'Collect 10+ Metal-type cards',
    threshold: 10,
    color: '#B8B8D0',
    icon: ShieldCheckIcon,
  },
  dragon_trainer: {
    name: 'Dragon Trainer',
    description: 'Collect 10+ Dragon-type cards',
    threshold: 10,
    color: '#7038F8',
    icon: SparklesIcon,
  },
  fairy_trainer: {
    name: 'Fairy Trainer',
    description: 'Collect 10+ Fairy-type cards',
    threshold: 10,
    color: '#EE99AC',
    icon: HeartIcon,
  },
  colorless_trainer: {
    name: 'Colorless Trainer',
    description: 'Collect 10+ Colorless-type cards',
    threshold: 10,
    color: '#A8A878',
    icon: CheckBadgeIcon,
  },

  // Pokemon Fan Badges
  pikachu_fan: {
    name: 'Pikachu Fan',
    description: 'Collect 5+ Pikachu cards',
    threshold: 5,
    color: '#F8D030',
    icon: BoltIcon,
  },
  eevee_fan: {
    name: 'Eevee Fan',
    description: 'Collect 5+ Eevee/Eeveelution cards',
    threshold: 5,
    color: '#A8A878',
    icon: HeartIcon,
  },
  charizard_fan: {
    name: 'Charizard Fan',
    description: 'Collect 3+ Charizard cards',
    threshold: 3,
    color: '#F08030',
    icon: FireIcon,
  },
  mewtwo_fan: {
    name: 'Mewtwo Fan',
    description: 'Collect 3+ Mewtwo cards',
    threshold: 3,
    color: '#F85888',
    icon: SparklesIcon,
  },
  legendary_fan: {
    name: 'Legendary Fan',
    description: 'Collect 10+ Legendary Pokemon cards',
    threshold: 10,
    color: '#7038F8',
    icon: StarIcon,
  },

  // Streak Badges
  streak_3: {
    name: '3-Day Streak',
    description: 'Add cards 3 days in a row',
    threshold: 3,
    color: '#F08030',
    icon: FireIcon,
    tier: 'bronze',
  },
  streak_7: {
    name: 'Week Warrior',
    description: 'Add cards 7 days in a row',
    threshold: 7,
    color: '#6890F0',
    icon: BoltIcon,
    tier: 'silver',
  },
  streak_14: {
    name: 'Dedicated Collector',
    description: 'Add cards 14 days in a row',
    threshold: 14,
    color: '#A040A0',
    icon: ShieldCheckIcon,
    tier: 'gold',
  },
  streak_30: {
    name: 'Monthly Master',
    description: 'Add cards 30 days in a row',
    threshold: 30,
    color: '#F8D030',
    icon: TrophyIcon,
    tier: 'platinum',
  },

  // Set Completion Badges (generic - shown in category)
  set_explorer: {
    name: 'Set Explorer',
    description: 'Collect 25% of a set',
    threshold: 25,
    color: '#78C850',
    icon: MapIcon,
    tier: 'bronze',
  },
  set_adventurer: {
    name: 'Set Adventurer',
    description: 'Collect 50% of a set',
    threshold: 50,
    color: '#6890F0',
    icon: MapIcon,
    tier: 'silver',
  },
  set_master: {
    name: 'Set Master',
    description: 'Collect 75% of a set',
    threshold: 75,
    color: '#A040A0',
    icon: TrophyIcon,
    tier: 'gold',
  },
  set_champion: {
    name: 'Set Champion',
    description: 'Complete a set 100%',
    threshold: 100,
    color: '#F8D030',
    icon: TrophyIcon,
    tier: 'platinum',
  },
};

// Get badges for a category
function getBadgeKeysForCategory(categoryId: string): string[] {
  switch (categoryId) {
    case 'collector_milestone':
      return [
        'first_catch',
        'starter_collector',
        'rising_trainer',
        'pokemon_trainer',
        'elite_collector',
        'pokemon_master',
        'legendary_collector',
      ];
    case 'type_specialist':
      return [
        'fire_trainer',
        'water_trainer',
        'grass_trainer',
        'electric_trainer',
        'psychic_trainer',
        'fighting_trainer',
        'darkness_trainer',
        'metal_trainer',
        'dragon_trainer',
        'fairy_trainer',
        'colorless_trainer',
      ];
    case 'pokemon_fan':
      return ['pikachu_fan', 'eevee_fan', 'charizard_fan', 'mewtwo_fan', 'legendary_fan'];
    case 'streak':
      return ['streak_3', 'streak_7', 'streak_14', 'streak_30'];
    case 'set_completion':
      return ['set_explorer', 'set_adventurer', 'set_master', 'set_champion'];
    default:
      return [];
  }
}

// Get tier gradient
function getTierGradient(tier?: 'bronze' | 'silver' | 'gold' | 'platinum'): string {
  switch (tier) {
    case 'platinum':
      return 'from-purple-400 via-indigo-300 to-purple-500';
    case 'gold':
      return 'from-amber-400 via-yellow-300 to-amber-500';
    case 'silver':
      return 'from-gray-300 via-white to-gray-400';
    case 'bronze':
      return 'from-orange-400 via-orange-300 to-orange-500';
    default:
      return 'from-kid-primary via-purple-400 to-kid-secondary';
  }
}

// Format relative date
function formatRelativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Single badge card component
interface BadgeCardProps {
  badgeKey: string;
  earned: boolean;
  earnedAt?: number | null;
  progress?: number;
  current?: number;
  threshold?: number;
}

function BadgeCard({
  badgeKey,
  earned,
  earnedAt,
  progress = 0,
  current = 0,
  threshold,
}: BadgeCardProps) {
  const badge = BADGE_DEFINITIONS[badgeKey];
  if (!badge) return null;

  const Icon = badge.icon;
  const badgeThreshold = threshold ?? badge.threshold;
  const earnedDateFormatted = earnedAt ? formatRelativeDate(earnedAt) : null;

  // Generate accessible label for the badge
  const ariaLabel = earned
    ? `${badge.name} badge, ${badge.tier ? `${badge.tier} tier, ` : ''}earned${earnedDateFormatted ? ` ${earnedDateFormatted}` : ''}. ${badge.description}`
    : `${badge.name} badge, locked. ${badge.description}${progress > 0 ? `. Progress: ${Math.round(progress)}%, ${current} of ${badgeThreshold}` : ''}`;

  return (
    <div
      className={cn(
        'group relative flex flex-col items-center rounded-2xl p-4 transition-all duration-300',
        earned
          ? 'bg-white shadow-md hover:-translate-y-1 hover:shadow-lg'
          : 'bg-gray-100/50 opacity-70 hover:opacity-90'
      )}
      aria-label={ariaLabel}
      role="article"
    >
      {/* Badge icon container */}
      <div className="relative mb-3" aria-hidden="true">
        {/* Glow effect for earned badges */}
        {earned && (
          <div
            className={cn(
              'absolute inset-0 rounded-full bg-gradient-to-br opacity-50 blur-md transition-opacity group-hover:opacity-75',
              getTierGradient(badge.tier)
            )}
            style={{ transform: 'scale(1.3)' }}
          />
        )}

        {/* Badge circle */}
        <div
          className={cn(
            'relative flex h-16 w-16 items-center justify-center rounded-full',
            earned ? 'bg-gradient-to-br shadow-lg' : 'bg-gray-200'
          )}
          style={
            earned
              ? {
                  backgroundImage: `linear-gradient(135deg, ${badge.color}ee, ${badge.color}88)`,
                }
              : undefined
          }
        >
          {earned ? (
            <Icon className="h-8 w-8 text-white drop-shadow-sm" />
          ) : (
            <LockClosedIcon className="h-6 w-6 text-gray-400" />
          )}
        </div>

        {/* Tier indicator */}
        {badge.tier && earned && (
          <div
            className={cn(
              'absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br text-[10px] font-bold text-white shadow-sm',
              getTierGradient(badge.tier)
            )}
          >
            {badge.tier === 'platinum' && <SparklesIcon className="h-3 w-3" />}
            {badge.tier === 'gold' && <TrophyIcon className="h-3 w-3" />}
            {badge.tier === 'silver' && <StarIcon className="h-3 w-3" />}
            {badge.tier === 'bronze' && <CheckBadgeIcon className="h-3 w-3" />}
          </div>
        )}
      </div>

      {/* Badge name */}
      <h4
        className={cn(
          'mb-1 text-center text-sm font-semibold',
          earned ? 'text-gray-800' : 'text-gray-500'
        )}
        aria-hidden="true"
      >
        {badge.name}
      </h4>

      {/* Description or earned date */}
      {earned && earnedAt ? (
        <p className="text-center text-xs text-gray-500" aria-hidden="true">
          {earnedDateFormatted}
        </p>
      ) : (
        <p className="text-center text-xs text-gray-500" aria-hidden="true">
          {badge.description}
        </p>
      )}

      {/* Progress bar for unearned badges */}
      {!earned && progress > 0 && (
        <div className="mt-2 w-full" aria-hidden="true">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(progress)}% complete`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-kid-primary to-kid-secondary transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-center text-[10px] text-gray-500">
            {current}/{badgeThreshold}
          </p>
        </div>
      )}
    </div>
  );
}

// Category section component
interface CategorySectionProps {
  category: (typeof BADGE_CATEGORIES)[0];
  earnedBadges: Set<string>;
  achievements: Array<{ achievementKey: string; earnedAt: number }>;
  milestoneProgress?: {
    milestones: Array<{ key: string; progress: number; cardsNeeded: number; earned: boolean }>;
    totalUniqueCards: number;
  };
  typeProgress?: {
    typeProgress: Array<{ key: string; progress: number; count: number; earned: boolean }>;
  };
  pokemonProgress?: {
    pokemonProgress: Array<{
      key: string;
      progress: number;
      count: number;
      threshold: number;
      earned: boolean;
    }>;
  };
}

function CategorySection({
  category,
  earnedBadges,
  achievements,
  milestoneProgress,
  typeProgress,
  pokemonProgress,
}: CategorySectionProps) {
  const Icon = category.icon;
  const badgeKeys = getBadgeKeysForCategory(category.id);
  const earnedCount = badgeKeys.filter((key) => earnedBadges.has(key)).length;

  // Get progress data based on category
  const getProgressForBadge = (
    key: string
  ): { progress: number; current: number; threshold?: number } => {
    if (category.id === 'collector_milestone' && milestoneProgress) {
      const milestone = milestoneProgress.milestones.find((m) => m.key === key);
      if (milestone) {
        return {
          progress: milestone.progress,
          current: milestoneProgress.totalUniqueCards,
          threshold: BADGE_DEFINITIONS[key]?.threshold,
        };
      }
    }
    if (category.id === 'type_specialist' && typeProgress) {
      const type = typeProgress.typeProgress.find((t) => t.key === key);
      if (type) {
        return { progress: type.progress, current: type.count, threshold: 10 };
      }
    }
    if (category.id === 'pokemon_fan' && pokemonProgress) {
      const pokemon = pokemonProgress.pokemonProgress.find((p) => p.key === key);
      if (pokemon) {
        return { progress: pokemon.progress, current: pokemon.count, threshold: pokemon.threshold };
      }
    }
    return { progress: 0, current: 0 };
  };

  const progressPercent = Math.round((earnedCount / badgeKeys.length) * 100);

  return (
    <section
      className={cn('rounded-3xl bg-gradient-to-br p-6', category.bgGradient)}
      aria-labelledby={`category-${category.id}-heading`}
    >
      {/* Category header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br',
              category.gradient
            )}
            aria-hidden="true"
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 id={`category-${category.id}-heading`} className="text-lg font-bold text-gray-800">
              {category.name}
            </h3>
            <p className="text-sm text-gray-500">{category.description}</p>
          </div>
        </div>
        <div
          className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 shadow-sm"
          role="status"
          aria-label={`${earnedCount} of ${badgeKeys.length} badges earned in ${category.name}`}
        >
          <TrophyIcon className="h-4 w-4 text-amber-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-700">
            {earnedCount}/{badgeKeys.length}
          </span>
        </div>
      </div>

      {/* Category progress bar */}
      <div className="mb-6">
        <div
          className="h-2 overflow-hidden rounded-full bg-white/50"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${category.name} progress: ${progressPercent}% complete`}
        >
          <div
            className={cn(
              'h-full rounded-full bg-gradient-to-r transition-all duration-500',
              category.gradient
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Badges grid */}
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        role="list"
        aria-label={`${category.name} badges`}
      >
        {badgeKeys.map((key) => {
          const earned = earnedBadges.has(key);
          const achievement = achievements.find((a) => a.achievementKey === key);
          const progressData = getProgressForBadge(key);

          return (
            <div key={key} role="listitem">
              <BadgeCard
                badgeKey={key}
                earned={earned}
                earnedAt={achievement?.earnedAt}
                progress={progressData.progress}
                current={progressData.current}
                threshold={progressData.threshold}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Game icon component map
// Note: Only 4 games are currently supported: Pokemon, Yu-Gi-Oh!, One Piece, and Disney Lorcana
const GAME_ICONS: Record<GameId, React.ComponentType<{ className?: string }>> = {
  pokemon: PokemonIcon,
  yugioh: YugiohIcon,
  onepiece: OnePieceIcon,
  lorcana: LorcanaIcon,
};

// Game-specific badge card component
interface GameBadgeCardProps {
  achievement: GameAchievementDefinition;
  progress: GameAchievementProgress;
  earnedAt?: number | null;
}

function GameBadgeCard({ achievement, progress, earnedAt }: GameBadgeCardProps) {
  const gameInfo = achievement.gameId ? getGameInfo(achievement.gameId) : null;
  const Icon = achievement.gameId ? GAME_ICONS[achievement.gameId] : GlobeAltIcon;

  return (
    <div
      className={cn(
        'group relative flex flex-col items-center rounded-2xl p-4 transition-all duration-300',
        progress.earned
          ? 'bg-white shadow-md hover:-translate-y-1 hover:shadow-lg'
          : 'bg-gray-100/50 opacity-70 hover:opacity-90'
      )}
    >
      {/* Badge icon container */}
      <div className="relative mb-3">
        {/* Glow effect for earned badges */}
        {progress.earned && (
          <div
            className={cn(
              'absolute inset-0 rounded-full bg-gradient-to-br opacity-50 blur-md transition-opacity group-hover:opacity-75',
              getTierGradient(achievement.tier)
            )}
            style={{ transform: 'scale(1.3)' }}
          />
        )}

        {/* Badge circle */}
        <div
          className={cn(
            'relative flex h-16 w-16 items-center justify-center rounded-full',
            progress.earned ? 'bg-gradient-to-br shadow-lg' : 'bg-gray-200'
          )}
          style={
            progress.earned
              ? {
                  backgroundImage: `linear-gradient(135deg, ${achievement.color}ee, ${achievement.color}88)`,
                }
              : undefined
          }
        >
          {progress.earned ? (
            <Icon className="h-8 w-8 text-white drop-shadow-sm" />
          ) : (
            <LockClosedIcon className="h-6 w-6 text-gray-400" />
          )}
        </div>

        {/* Tier indicator */}
        {achievement.tier && progress.earned && (
          <div
            className={cn(
              'absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br text-[10px] font-bold text-white shadow-sm',
              getTierGradient(achievement.tier)
            )}
          >
            {achievement.tier === 'platinum' && <SparklesIcon className="h-3 w-3" />}
            {achievement.tier === 'gold' && <TrophyIcon className="h-3 w-3" />}
            {achievement.tier === 'silver' && <StarIcon className="h-3 w-3" />}
            {achievement.tier === 'bronze' && <CheckBadgeIcon className="h-3 w-3" />}
          </div>
        )}
      </div>

      {/* Badge name */}
      <h4
        className={cn(
          'mb-1 text-center text-sm font-semibold',
          progress.earned ? 'text-gray-800' : 'text-gray-500'
        )}
      >
        {achievement.name}
      </h4>

      {/* Description or earned date */}
      {progress.earned && earnedAt ? (
        <p className="text-center text-xs text-gray-500">{formatRelativeDate(earnedAt)}</p>
      ) : (
        <p className="text-center text-xs text-gray-500">{achievement.description}</p>
      )}

      {/* Progress bar for unearned badges */}
      {!progress.earned && progress.progress > 0 && (
        <div className="mt-2 w-full">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-valuenow={progress.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(progress.progress)}% complete`}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(progress.progress, 100)}%`,
                background: `linear-gradient(90deg, ${achievement.color}dd, ${achievement.color}99)`,
              }}
            />
          </div>
          <p className="mt-1 text-center text-[10px] text-gray-500">
            {progress.current}/{progress.threshold}
          </p>
        </div>
      )}
    </div>
  );
}

// Game-specific achievements section
interface GameAchievementsSectionProps {
  gameId: GameId;
  cardCount: number;
  earnedKeys: Set<string>;
  achievements: Array<{ achievementKey: string; earnedAt: number }>;
}

function GameAchievementsSection({
  gameId,
  cardCount,
  earnedKeys,
  achievements,
}: GameAchievementsSectionProps) {
  const gameInfo = getGameInfo(gameId);
  if (!gameInfo) return null;

  const Icon = GAME_ICONS[gameId];
  const progressList = getGameMilestoneProgress(gameId, cardCount, Array.from(earnedKeys));
  const allGameAchievements = getAllGameAchievements().filter((a) => a.gameId === gameId);
  const earnedCount = progressList.filter((p) => p.earned).length;

  return (
    <div
      className={cn('rounded-3xl bg-gradient-to-br p-6', gameInfo.bgColor)}
      style={{
        backgroundImage: `linear-gradient(135deg, ${gameInfo.bgColor.replace('bg-', '')}50, white)`,
      }}
    >
      {/* Section header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br',
              gameInfo.gradientFrom,
              gameInfo.gradientTo
            )}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{gameInfo.name} Badges</h3>
            <p className="text-sm text-gray-500">Collect {gameInfo.shortName} cards to unlock</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 shadow-sm">
          <TrophyIcon className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-gray-700">
            {earnedCount}/{allGameAchievements.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2 overflow-hidden rounded-full bg-white/50">
          <div
            className={cn(
              'h-full rounded-full bg-gradient-to-r transition-all duration-500',
              gameInfo.gradientFrom,
              gameInfo.gradientTo
            )}
            style={{ width: `${(earnedCount / allGameAchievements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Badges grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {progressList.map((progress) => {
          const achievement = allGameAchievements.find((a) => a.key === progress.key);
          if (!achievement) return null;

          const achievementData = achievements.find((a) => a.achievementKey === progress.key);

          return (
            <GameBadgeCard
              key={progress.key}
              achievement={achievement}
              progress={progress}
              earnedAt={achievementData?.earnedAt}
            />
          );
        })}
      </div>
    </div>
  );
}

// Cross-game achievements section
interface CrossGameAchievementsSectionProps {
  gamesWithCards: GameId[];
  earnedKeys: Set<string>;
  achievements: Array<{ achievementKey: string; earnedAt: number }>;
}

function CrossGameAchievementsSection({
  gamesWithCards,
  earnedKeys,
  achievements,
}: CrossGameAchievementsSectionProps) {
  const progressList = getCrossGameProgress(gamesWithCards, Array.from(earnedKeys));
  const allCrossGameAchievements = getAllGameAchievements().filter(
    (a) => a.category === 'cross_game'
  );
  const earnedCount = progressList.filter((p) => p.earned).length;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      {/* Section header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
            <GlobeAltIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Multi-Collector Badges</h3>
            <p className="text-sm text-gray-500">Collect cards across multiple TCG games</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 shadow-sm">
          <TrophyIcon className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-gray-700">
            {earnedCount}/{allCrossGameAchievements.length}
          </span>
        </div>
      </div>

      {/* Games with cards indicator */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-500">Games with cards:</span>
        {gamesWithCards.map((gameId) => {
          const gameInfo = getGameInfo(gameId);
          const GameIcon = GAME_ICONS[gameId];
          return (
            <div
              key={gameId}
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-1',
                gameInfo?.bgColor,
                gameInfo?.borderColor,
                'border'
              )}
              title={gameInfo?.name}
            >
              <GameIcon className="h-4 w-4" />
              <span className="text-xs font-medium">{gameInfo?.shortName}</span>
            </div>
          );
        })}
        {gamesWithCards.length === 0 && (
          <span className="text-sm italic text-gray-400">None yet</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2 overflow-hidden rounded-full bg-white/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
            style={{ width: `${(earnedCount / allCrossGameAchievements.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Badges grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {progressList.map((progress) => {
          const achievement = allCrossGameAchievements.find((a) => a.key === progress.key);
          if (!achievement) return null;

          const achievementData = achievements.find((a) => a.achievementKey === progress.key);

          return (
            <GameBadgeCard
              key={progress.key}
              achievement={achievement}
              progress={progress}
              earnedAt={achievementData?.earnedAt}
            />
          );
        })}
      </div>
    </div>
  );
}

// Skeleton for loading state
export function TrophyCaseSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats header skeleton */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="mx-auto mb-2 h-12 w-12 rounded-full" />
              <Skeleton className="mx-auto mb-1 h-8 w-16" />
              <Skeleton className="mx-auto h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Category sections skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-3xl bg-gray-50 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div>
                <Skeleton className="mb-2 h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
          <Skeleton className="mb-6 h-2 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex flex-col items-center rounded-2xl bg-white p-4">
                <Skeleton className="mb-3 h-16 w-16 rounded-full" />
                <Skeleton className="mb-1 h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Main Trophy Case component
interface TrophyCaseProps {
  profileId: Id<'profiles'>;
  gameSlug?: GameId;
}

export function TrophyCase({ profileId, gameSlug }: TrophyCaseProps) {
  // Fetch all achievement data, filtered by game if specified
  const achievements = useQuery(api.achievements.getAchievements, { profileId, gameSlug });
  const milestoneProgress = useQuery(api.achievements.getMilestoneProgress, { profileId });
  const typeProgress = useQuery(api.achievements.getTypeSpecialistProgress, { profileId });
  const pokemonProgress = useQuery(api.achievements.getPokemonFanProgress, { profileId });

  // Loading state
  if (
    achievements === undefined ||
    milestoneProgress === undefined ||
    typeProgress === undefined ||
    pokemonProgress === undefined
  ) {
    return <TrophyCaseSkeleton />;
  }

  // Build set of earned badge keys
  const earnedBadges = new Set<string>();

  // Add earned badges
  achievements.forEach((a) => {
    // For set completion badges, extract the base badge key
    if (a.achievementType === 'set_completion') {
      // Parse "setId_badge_key" format
      const parts = a.achievementKey.split('_');
      if (parts.length >= 2) {
        const baseBadgeKey = parts.slice(1).join('_');
        earnedBadges.add(baseBadgeKey);
      }
    } else {
      earnedBadges.add(a.achievementKey);
    }
  });

  // Calculate total stats
  const totalBadges = BADGE_CATEGORIES.reduce(
    (sum, cat) => sum + getBadgeKeysForCategory(cat.id).length,
    0
  );
  const totalEarned = earnedBadges.size;
  const completionPercent = Math.round((totalEarned / totalBadges) * 100);

  // Most recent achievement
  const recentAchievement = [...achievements].sort((a, b) => b.earnedAt - a.earnedAt)[0];

  return (
    <div className="space-y-8" role="region" aria-label="Trophy case">
      {/* Stats header */}
      <div
        className="rounded-2xl bg-gradient-to-r from-kid-primary/10 via-purple-50 to-kid-secondary/10 p-6"
        role="status"
        aria-label={`Badge progress: ${totalEarned} of ${totalBadges} badges earned, ${completionPercent}% complete`}
      >
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {/* Total badges */}
          <div className="text-center">
            <div
              className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg"
              aria-hidden="true"
            >
              <TrophyIcon className="h-7 w-7 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-800" aria-hidden="true">
              {totalEarned}
            </div>
            <div className="text-sm text-gray-500" aria-hidden="true">
              Badges Earned
            </div>
          </div>

          {/* Divider */}
          <div className="hidden h-16 w-px bg-gray-200 sm:block" aria-hidden="true" />

          {/* Completion percentage */}
          <div className="text-center">
            <div
              className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg"
              aria-hidden="true"
            >
              <CheckBadgeIcon className="h-7 w-7 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-800" aria-hidden="true">
              {completionPercent}%
            </div>
            <div className="text-sm text-gray-500" aria-hidden="true">
              Complete
            </div>
          </div>

          {/* Divider */}
          <div className="hidden h-16 w-px bg-gray-200 sm:block" aria-hidden="true" />

          {/* Remaining badges */}
          <div className="text-center">
            <div
              className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 shadow-lg"
              aria-hidden="true"
            >
              <StarIcon className="h-7 w-7 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-800" aria-hidden="true">
              {totalBadges - totalEarned}
            </div>
            <div className="text-sm text-gray-500" aria-hidden="true">
              To Unlock
            </div>
          </div>
        </div>

        {/* Recent achievement banner */}
        {recentAchievement && BADGE_DEFINITIONS[recentAchievement.achievementKey] && (
          <div
            className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-white/50 px-4 py-3"
            role="status"
            aria-label={`Most recent badge: ${BADGE_DEFINITIONS[recentAchievement.achievementKey]?.name}, earned ${formatRelativeDate(recentAchievement.earnedAt)}`}
          >
            <SparklesIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />
            <span className="text-sm text-gray-600">
              Most recent:{' '}
              <span className="font-semibold text-gray-800">
                {BADGE_DEFINITIONS[recentAchievement.achievementKey]?.name}
              </span>
            </span>
            <span className="text-xs text-gray-500">
              {formatRelativeDate(recentAchievement.earnedAt)}
            </span>
          </div>
        )}
      </div>

      {/* Category sections */}
      {BADGE_CATEGORIES.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          earnedBadges={earnedBadges}
          achievements={achievements.map((a) => ({
            achievementKey: a.achievementKey,
            earnedAt: a.earnedAt,
          }))}
          milestoneProgress={category.id === 'collector_milestone' ? milestoneProgress : undefined}
          typeProgress={category.id === 'type_specialist' ? typeProgress : undefined}
          pokemonProgress={category.id === 'pokemon_fan' ? pokemonProgress : undefined}
        />
      ))}

      {/* Game-specific achievements section */}
      <GameSpecificAchievementsWrapper
        profileId={profileId}
        achievements={achievements.map((a) => ({
          achievementKey: a.achievementKey,
          earnedAt: a.earnedAt,
        }))}
      />
    </div>
  );
}

// Wrapper component for game-specific achievements that uses game selector context
interface GameSpecificAchievementsWrapperProps {
  profileId: Id<'profiles'>;
  achievements: Array<{ achievementKey: string; earnedAt: number }>;
}

function GameSpecificAchievementsWrapper({
  profileId,
  achievements,
}: GameSpecificAchievementsWrapperProps) {
  const { enabledGames, isLoading } = useGameSelector();

  // For now, use placeholder card counts (in production, this would come from the backend)
  // Since the app currently only supports Pokemon API, we use milestone progress as a proxy
  const milestoneProgress = useQuery(api.achievements.getMilestoneProgress, { profileId });

  if (isLoading || milestoneProgress === undefined) {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl bg-gray-50 p-6">
          <Skeleton className="mb-4 h-12 w-64" />
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center rounded-2xl bg-white p-4">
                <Skeleton className="mb-3 h-16 w-16 rounded-full" />
                <Skeleton className="mb-1 h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Build earned keys set for game-specific achievements
  const earnedGameAchievementKeys = new Set(achievements.map((a) => a.achievementKey));

  // Calculate card counts per game (for now, only Pokemon has real data)
  // Only includes the 4 supported games: pokemon, yugioh, onepiece, lorcana
  const cardCountsByGame: Record<GameId, number> = {
    pokemon: milestoneProgress?.totalUniqueCards ?? 0,
    yugioh: 0,
    onepiece: 0,
    lorcana: 0,
  };

  // Determine which games have cards
  const gamesWithCards = (Object.keys(cardCountsByGame) as GameId[]).filter(
    (gameId) => cardCountsByGame[gameId] > 0
  );

  return (
    <div className="space-y-8">
      {/* Section divider with title */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-700">
          <GlobeAltIcon className="h-5 w-5 text-indigo-500" />
          Game-Specific Badges
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      </div>

      {/* Game-specific sections for enabled games */}
      {enabledGames.map((game) => (
        <GameAchievementsSection
          key={game.id}
          gameId={game.id}
          cardCount={cardCountsByGame[game.id]}
          earnedKeys={earnedGameAchievementKeys}
          achievements={achievements}
        />
      ))}

      {/* Cross-game achievements */}
      <CrossGameAchievementsSection
        gamesWithCards={gamesWithCards}
        earnedKeys={earnedGameAchievementKeys}
        achievements={achievements}
      />
    </div>
  );
}
