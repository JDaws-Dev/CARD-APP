'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import {
  LockClosedIcon,
  CheckIcon,
  SparklesIcon,
  XMarkIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  type AvatarItem,
  type AvatarItemCategory,
  type EquippedAvatar,
  ALL_AVATAR_ITEMS,
  HAT_ITEMS,
  FRAME_ITEMS,
  BADGE_ITEMS,
  RARITY_CONFIG,
  getItemById,
  isItemUnlocked,
  getUnlockProgress,
  getUnlockRequirementDisplay,
  getCategoryDisplayName,
  getCategoryIcon,
  DEFAULT_EQUIPPED_AVATAR,
} from '@/lib/avatarItems';

// ============================================================================
// LOCAL STORAGE KEY
// ============================================================================

const EQUIPPED_AVATAR_KEY = 'kidcollect_equipped_avatar';

// ============================================================================
// AVATAR PREVIEW COMPONENT
// ============================================================================

interface AvatarPreviewProps {
  displayName: string;
  equipped: EquippedAvatar;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export function AvatarPreview({
  displayName,
  equipped,
  size = 'md',
  showLabels = false,
}: AvatarPreviewProps) {
  const initials = displayName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Get equipped items
  const equippedHat = equipped.hatId ? getItemById(equipped.hatId) : null;
  const equippedFrame = equipped.frameId ? getItemById(equipped.frameId) : null;
  const equippedBadge = equipped.badgeId ? getItemById(equipped.badgeId) : null;

  // Size classes
  const sizeClasses = {
    sm: {
      container: 'h-16 w-16',
      avatar: 'h-12 w-12',
      text: 'text-sm',
      hat: 'h-6 w-6 -top-2',
      badge: 'h-5 w-5 -bottom-1 -right-1',
      frameWidth: '4px',
    },
    md: {
      container: 'h-24 w-24',
      avatar: 'h-20 w-20',
      text: 'text-xl',
      hat: 'h-8 w-8 -top-3',
      badge: 'h-7 w-7 -bottom-1 -right-1',
      frameWidth: '5px',
    },
    lg: {
      container: 'h-32 w-32',
      avatar: 'h-28 w-28',
      text: 'text-2xl',
      hat: 'h-10 w-10 -top-4',
      badge: 'h-9 w-9 -bottom-2 -right-2',
      frameWidth: '6px',
    },
  };

  const classes = sizeClasses[size];

  // Generate avatar gradient based on name
  const avatarGradients = [
    'from-kid-primary to-purple-500',
    'from-pink-500 to-rose-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-blue-400 to-indigo-500',
  ];
  const gradientIndex =
    displayName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    avatarGradients.length;
  const avatarGradient = avatarGradients[gradientIndex];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('relative', classes.container)}>
        {/* Frame (outer ring) */}
        {equippedFrame && (
          <div
            className={cn(
              'absolute inset-0 rounded-full bg-gradient-to-br',
              equippedFrame.gradient
            )}
            style={{
              padding: classes.frameWidth,
            }}
            aria-hidden="true"
          />
        )}

        {/* Avatar circle */}
        <div
          className={cn(
            'absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br shadow-md',
            classes.avatar,
            avatarGradient,
            equippedFrame ? 'border-2 border-white' : 'border-4 border-white'
          )}
        >
          <span className={cn('font-bold text-white', classes.text)}>{initials}</span>
        </div>

        {/* Hat (top decoration) */}
        {equippedHat && (
          <div
            className={cn(
              'absolute left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-br p-1 shadow-md',
              classes.hat,
              equippedHat.gradient
            )}
            aria-label={`Wearing ${equippedHat.name}`}
          >
            <equippedHat.icon className="h-full w-full text-white" />
          </div>
        )}

        {/* Badge (bottom-right) */}
        {equippedBadge && (
          <div
            className={cn(
              'absolute rounded-full bg-gradient-to-br p-1 shadow-md',
              classes.badge,
              equippedBadge.gradient
            )}
            aria-label={`Displaying ${equippedBadge.name}`}
          >
            <equippedBadge.icon className="h-full w-full text-white" />
          </div>
        )}
      </div>

      {/* Labels for equipped items */}
      {showLabels && (
        <div className="flex flex-wrap justify-center gap-1 text-xs">
          {equippedHat && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
              {equippedHat.name}
            </span>
          )}
          {equippedFrame && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
              {equippedFrame.name}
            </span>
          )}
          {equippedBadge && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
              {equippedBadge.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ITEM CARD COMPONENT
// ============================================================================

interface ItemCardProps {
  item: AvatarItem;
  isUnlocked: boolean;
  isEquipped: boolean;
  progress?: { progress: number; current: number; required: number | string };
  onSelect: () => void;
}

function ItemCard({ item, isUnlocked, isEquipped, progress, onSelect }: ItemCardProps) {
  const Icon = item.icon;
  const rarityConfig = RARITY_CONFIG[item.rarity];

  return (
    <button
      onClick={onSelect}
      disabled={!isUnlocked}
      className={cn(
        'group relative flex flex-col items-center rounded-2xl p-4 transition-all duration-300',
        isUnlocked
          ? 'cursor-pointer bg-white shadow-md hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2'
          : 'cursor-not-allowed bg-gray-100/50 opacity-70',
        isEquipped && 'ring-2 ring-kid-primary ring-offset-2'
      )}
      aria-label={
        isUnlocked
          ? `${isEquipped ? 'Unequip' : 'Equip'} ${item.name}`
          : `${item.name} - Locked: ${getUnlockRequirementDisplay(item)}`
      }
      aria-pressed={isEquipped}
    >
      {/* Equipped indicator */}
      {isEquipped && (
        <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-kid-primary text-white shadow-md">
          <CheckIcon className="h-4 w-4" />
        </div>
      )}

      {/* Item icon container */}
      <div className="relative mb-3">
        {/* Glow effect for unlocked items */}
        {isUnlocked && (
          <div
            className={cn(
              'absolute inset-0 rounded-full bg-gradient-to-br opacity-50 blur-md transition-opacity group-hover:opacity-75',
              item.gradient
            )}
            style={{ transform: 'scale(1.3)' }}
            aria-hidden="true"
          />
        )}

        {/* Item circle */}
        <div
          className={cn(
            'relative flex h-14 w-14 items-center justify-center rounded-full',
            isUnlocked ? 'bg-gradient-to-br shadow-lg' : 'bg-gray-200'
          )}
          style={
            isUnlocked
              ? undefined
              : {
                  background: 'linear-gradient(135deg, #e5e7eb, #d1d5db)',
                }
          }
        >
          <div
            className={cn(
              'absolute inset-0 rounded-full bg-gradient-to-br',
              isUnlocked && item.gradient
            )}
          />
          {isUnlocked ? (
            <Icon className="relative z-10 h-7 w-7 text-white drop-shadow-sm" />
          ) : (
            <LockClosedIcon className="h-6 w-6 text-gray-400" />
          )}
        </div>
      </div>

      {/* Item name */}
      <h4
        className={cn(
          'mb-1 text-center text-sm font-semibold',
          isUnlocked ? 'text-gray-800' : 'text-gray-500'
        )}
      >
        {item.name}
      </h4>

      {/* Rarity badge */}
      <span
        className={cn(
          'mb-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
          rarityConfig.bgColor,
          rarityConfig.textColor
        )}
      >
        {rarityConfig.label}
      </span>

      {/* Progress bar for locked items */}
      {!isUnlocked && progress && progress.progress > 0 && (
        <div className="mt-2 w-full">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-gray-200"
            role="progressbar"
            aria-valuenow={progress.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(progress.progress)}% progress towards unlocking ${item.name}`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-kid-primary to-kid-secondary transition-all duration-500"
              style={{ width: `${Math.min(progress.progress, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-center text-[10px] text-gray-500">
            {typeof progress.required === 'number'
              ? `${progress.current}/${progress.required}`
              : 'In progress'}
          </p>
        </div>
      )}

      {/* Unlock requirement tooltip for locked items */}
      {!isUnlocked && (
        <p className="mt-1 text-center text-[10px] text-gray-400">
          {getUnlockRequirementDisplay(item)}
        </p>
      )}
    </button>
  );
}

// ============================================================================
// CATEGORY TAB COMPONENT
// ============================================================================

interface CategoryTabProps {
  category: AvatarItemCategory;
  isActive: boolean;
  unlockedCount: number;
  totalCount: number;
  onClick: () => void;
}

function CategoryTab({ category, isActive, unlockedCount, totalCount, onClick }: CategoryTabProps) {
  const CategoryIcon = getCategoryIcon(category);

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2',
        isActive
          ? 'bg-gradient-to-r from-kid-primary to-purple-500 text-white shadow-md'
          : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800'
      )}
      aria-pressed={isActive}
      aria-label={`${getCategoryDisplayName(category)} - ${unlockedCount} of ${totalCount} unlocked`}
    >
      <CategoryIcon className="h-4 w-4" aria-hidden="true" />
      <span>{getCategoryDisplayName(category)}</span>
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-xs',
          isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
        )}
      >
        {unlockedCount}/{totalCount}
      </span>
    </button>
  );
}

// ============================================================================
// SKELETON LOADERS
// ============================================================================

export function AvatarCustomizerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Preview section skeleton */}
      <div className="rounded-2xl bg-gradient-to-r from-kid-primary/10 to-purple-50 p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="text-center sm:text-left">
            <Skeleton className="mb-2 h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex flex-wrap justify-center gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-xl" />
        ))}
      </div>

      {/* Items grid skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center rounded-2xl bg-white p-4 shadow-sm">
            <Skeleton className="mb-3 h-14 w-14 rounded-full" />
            <Skeleton className="mb-1 h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN AVATAR CUSTOMIZER COMPONENT
// ============================================================================

interface AvatarCustomizerProps {
  profileId: Id<'profiles'>;
}

export function AvatarCustomizer({ profileId }: AvatarCustomizerProps) {
  // State for active category
  const [activeCategory, setActiveCategory] = useState<AvatarItemCategory>('hat');

  // State for equipped items (loaded from localStorage)
  const [equipped, setEquipped] = useState<EquippedAvatar>(DEFAULT_EQUIPPED_AVATAR);

  // Load equipped items from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(EQUIPPED_AVATAR_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Record<string, EquippedAvatar>;
        const profileEquipped = parsed[profileId];
        if (profileEquipped) {
          setEquipped(profileEquipped);
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [profileId]);

  // Save equipped items to localStorage
  const saveEquipped = useCallback(
    (newEquipped: EquippedAvatar) => {
      setEquipped(newEquipped);
      try {
        const stored = localStorage.getItem(EQUIPPED_AVATAR_KEY);
        const parsed = stored ? (JSON.parse(stored) as Record<string, EquippedAvatar>) : {};
        parsed[profileId] = newEquipped;
        localStorage.setItem(EQUIPPED_AVATAR_KEY, JSON.stringify(parsed));
      } catch {
        // localStorage unavailable, ignore
      }
    },
    [profileId]
  );

  // Fetch profile data
  const profile = useQuery(api.profiles.getProfile, { profileId });

  // Fetch achievements for unlock checking
  const achievements = useQuery(api.achievements.getAchievements, { profileId });

  // Fetch collection stats for milestone checking
  const collectionStats = useQuery(api.collections.getCollectionStats, { profileId });

  // Fetch streak info from achievements (same query as StreakCounter uses)
  const streakProgress = useQuery(api.achievements.getStreakProgress, { profileId });

  // Build set of earned achievement keys
  const earnedAchievements = useMemo(() => {
    if (!achievements) return new Set<string>();
    const earned = new Set<string>();
    achievements.forEach((a) => {
      // For set completion badges, extract the base badge key
      if (a.achievementType === 'set_completion') {
        const parts = a.achievementKey.split('_');
        if (parts.length >= 2) {
          const baseBadgeKey = parts.slice(1).join('_');
          earned.add(baseBadgeKey);
        }
      } else {
        earned.add(a.achievementKey);
      }
    });
    return earned;
  }, [achievements]);

  // Get total unique cards and current streak
  const totalUniqueCards = collectionStats?.uniqueCards ?? 0;
  const currentStreak = streakProgress?.currentStreak ?? 0;

  // Get items for current category
  const categoryItems = useMemo(() => {
    switch (activeCategory) {
      case 'hat':
        return HAT_ITEMS;
      case 'frame':
        return FRAME_ITEMS;
      case 'badge':
        return BADGE_ITEMS;
      default:
        return [];
    }
  }, [activeCategory]);

  // Calculate unlocked counts for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<AvatarItemCategory, { unlocked: number; total: number }> = {
      hat: { unlocked: 0, total: HAT_ITEMS.length },
      frame: { unlocked: 0, total: FRAME_ITEMS.length },
      badge: { unlocked: 0, total: BADGE_ITEMS.length },
    };

    ALL_AVATAR_ITEMS.forEach((item) => {
      if (isItemUnlocked(item, earnedAchievements, totalUniqueCards, currentStreak)) {
        counts[item.category].unlocked++;
      }
    });

    return counts;
  }, [earnedAchievements, totalUniqueCards, currentStreak]);

  // Handle item selection (equip/unequip)
  const handleSelectItem = useCallback(
    (item: AvatarItem) => {
      const newEquipped = { ...equipped };

      switch (item.category) {
        case 'hat':
          newEquipped.hatId = equipped.hatId === item.id ? null : item.id;
          break;
        case 'frame':
          newEquipped.frameId = equipped.frameId === item.id ? null : item.id;
          break;
        case 'badge':
          newEquipped.badgeId = equipped.badgeId === item.id ? null : item.id;
          break;
      }

      saveEquipped(newEquipped);
    },
    [equipped, saveEquipped]
  );

  // Clear all equipped items
  const handleClearAll = useCallback(() => {
    saveEquipped(DEFAULT_EQUIPPED_AVATAR);
  }, [saveEquipped]);

  // Loading state
  if (
    profile === undefined ||
    achievements === undefined ||
    collectionStats === undefined ||
    streakProgress === undefined
  ) {
    return <AvatarCustomizerSkeleton />;
  }

  // Error state
  if (profile === null) {
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-center">
        <p className="text-red-600">Profile not found</p>
      </div>
    );
  }

  const displayName = profile.displayName;
  const hasEquippedItems = equipped.hatId || equipped.frameId || equipped.badgeId;

  return (
    <div className="space-y-6">
      {/* Preview section */}
      <div className="rounded-2xl bg-gradient-to-r from-kid-primary/10 via-purple-50 to-kid-secondary/10 p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          {/* Avatar preview */}
          <AvatarPreview displayName={displayName} equipped={equipped} size="lg" showLabels />

          {/* Info section */}
          <div className="text-center sm:text-left">
            <h2 className="mb-1 text-xl font-bold text-gray-800">{displayName}</h2>
            <p className="mb-3 text-sm text-gray-500">Customize your avatar with unlocked items</p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
              <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm shadow-sm">
                <SparklesIcon className="h-4 w-4 text-kid-primary" aria-hidden="true" />
                <span className="text-gray-600">
                  {categoryCounts.hat.unlocked +
                    categoryCounts.frame.unlocked +
                    categoryCounts.badge.unlocked}
                  <span className="text-gray-400">/{ALL_AVATAR_ITEMS.length}</span> unlocked
                </span>
              </div>
            </div>

            {/* Clear button */}
            {hasEquippedItems && (
              <button
                onClick={handleClearAll}
                className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-white hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kid-primary focus-visible:ring-offset-2"
                aria-label="Clear all equipped items"
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* How it works info */}
      <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-4">
        <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-blue-500" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-blue-800">How to unlock items</p>
          <p className="text-sm text-blue-600">
            Earn achievements, reach collection milestones, and maintain daily streaks to unlock new
            avatar items!
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <div
        className="flex flex-wrap justify-center gap-2"
        role="tablist"
        aria-label="Avatar item categories"
      >
        {(['hat', 'frame', 'badge'] as const).map((category) => (
          <CategoryTab
            key={category}
            category={category}
            isActive={activeCategory === category}
            unlockedCount={categoryCounts[category].unlocked}
            totalCount={categoryCounts[category].total}
            onClick={() => setActiveCategory(category)}
          />
        ))}
      </div>

      {/* Items grid */}
      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        role="tabpanel"
        aria-label={`${getCategoryDisplayName(activeCategory)} items`}
      >
        {categoryItems.map((item) => {
          const itemUnlocked = isItemUnlocked(
            item,
            earnedAchievements,
            totalUniqueCards,
            currentStreak
          );
          const isEquipped =
            (item.category === 'hat' && equipped.hatId === item.id) ||
            (item.category === 'frame' && equipped.frameId === item.id) ||
            (item.category === 'badge' && equipped.badgeId === item.id);
          const progress = !itemUnlocked
            ? getUnlockProgress(item, earnedAchievements, totalUniqueCards, currentStreak)
            : undefined;

          return (
            <ItemCard
              key={item.id}
              item={item}
              isUnlocked={itemUnlocked}
              isEquipped={isEquipped}
              progress={progress}
              onSelect={() => handleSelectItem(item)}
            />
          );
        })}
      </div>

      {/* Empty state for no items */}
      {categoryItems.length === 0 && (
        <div className="rounded-2xl bg-gray-50 p-12 text-center">
          <p className="text-gray-500">No items in this category yet</p>
        </div>
      )}
    </div>
  );
}
