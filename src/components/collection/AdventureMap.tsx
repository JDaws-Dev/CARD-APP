'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  MapIcon,
  LockClosedIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

// ============================================================================
// REGION DEFINITIONS
// ============================================================================

interface RegionDefinition {
  id: string;
  name: string;
  description: string;
  unlockType: string;
  unlockThreshold: number;
  gradient: string;
  bgColor: string;
  position: { x: number; y: number };
  connections: string[];
}

const REGIONS: RegionDefinition[] = [
  {
    id: 'kanto',
    name: 'Kanto',
    description: 'Where it all began - the original region',
    unlockType: 'Fire',
    unlockThreshold: 5,
    gradient: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-100',
    position: { x: 50, y: 75 },
    connections: ['johto'],
  },
  {
    id: 'johto',
    name: 'Johto',
    description: 'The land of legends and tradition',
    unlockType: 'Grass',
    unlockThreshold: 5,
    gradient: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-100',
    position: { x: 25, y: 60 },
    connections: ['kanto', 'hoenn'],
  },
  {
    id: 'hoenn',
    name: 'Hoenn',
    description: 'Tropical paradise with land and sea',
    unlockType: 'Water',
    unlockThreshold: 5,
    gradient: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-100',
    position: { x: 15, y: 35 },
    connections: ['johto', 'sinnoh'],
  },
  {
    id: 'sinnoh',
    name: 'Sinnoh',
    description: 'Ancient mysteries in snowy mountains',
    unlockType: 'Psychic',
    unlockThreshold: 5,
    gradient: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-100',
    position: { x: 35, y: 15 },
    connections: ['hoenn', 'unova'],
  },
  {
    id: 'unova',
    name: 'Unova',
    description: 'Modern metropolis of innovation',
    unlockType: 'Electric',
    unlockThreshold: 5,
    gradient: 'from-yellow-500 to-amber-500',
    bgColor: 'bg-yellow-100',
    position: { x: 60, y: 20 },
    connections: ['sinnoh', 'kalos'],
  },
  {
    id: 'kalos',
    name: 'Kalos',
    description: 'Elegant region of fashion and beauty',
    unlockType: 'Fairy',
    unlockThreshold: 5,
    gradient: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-100',
    position: { x: 80, y: 30 },
    connections: ['unova', 'alola'],
  },
  {
    id: 'alola',
    name: 'Alola',
    description: 'Island paradise under the sun',
    unlockType: 'Fighting',
    unlockThreshold: 5,
    gradient: 'from-orange-500 to-yellow-500',
    bgColor: 'bg-orange-100',
    position: { x: 85, y: 55 },
    connections: ['kalos', 'galar'],
  },
  {
    id: 'galar',
    name: 'Galar',
    description: 'Industrial kingdom of champions',
    unlockType: 'Metal',
    unlockThreshold: 5,
    gradient: 'from-slate-500 to-zinc-500',
    bgColor: 'bg-slate-100',
    position: { x: 70, y: 70 },
    connections: ['alola', 'paldea'],
  },
  {
    id: 'paldea',
    name: 'Paldea',
    description: 'Open world of adventure and discovery',
    unlockType: 'Dragon',
    unlockThreshold: 5,
    gradient: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-100',
    position: { x: 50, y: 45 },
    connections: ['galar', 'kanto'],
  },
];

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function AdventureMapSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}

// ============================================================================
// REGION NODE COMPONENT
// ============================================================================

interface RegionNodeProps {
  region: RegionDefinition;
  isUnlocked: boolean;
  progress: number;
  typeCount: number;
  isSelected: boolean;
  onSelect: () => void;
}

function RegionNode({
  region,
  isUnlocked,
  progress,
  typeCount,
  isSelected,
  onSelect,
}: RegionNodeProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'group absolute flex flex-col items-center transition-all duration-300',
        isUnlocked ? 'cursor-pointer' : 'cursor-default'
      )}
      style={{
        left: `${region.position.x}%`,
        top: `${region.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      aria-label={`${region.name} region${isUnlocked ? ' - unlocked' : ` - locked, ${progress}% progress`}`}
    >
      {/* Node circle */}
      <div
        className={cn(
          'relative flex h-12 w-12 items-center justify-center rounded-full border-3 shadow-lg transition-all sm:h-14 sm:w-14',
          isUnlocked
            ? `bg-gradient-to-br ${region.gradient} border-white`
            : 'border-gray-300 bg-gray-200',
          isSelected && isUnlocked && 'ring-4 ring-indigo-400 ring-offset-2',
          isUnlocked && 'group-hover:scale-110'
        )}
      >
        {isUnlocked ? (
          <CheckCircleIcon className="h-6 w-6 text-white sm:h-7 sm:w-7" />
        ) : (
          <LockClosedIcon className="h-5 w-5 text-gray-400 sm:h-6 sm:w-6" />
        )}

        {/* Progress ring for locked regions */}
        {!isUnlocked && progress > 0 && (
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 56 56"
            aria-hidden="true"
          >
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-indigo-200"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${(progress / 100) * 150.8} 150.8`}
              className="text-indigo-500"
            />
          </svg>
        )}
      </div>

      {/* Region name label */}
      <span
        className={cn(
          'mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold shadow-sm sm:text-sm',
          isUnlocked ? `bg-gradient-to-r ${region.gradient} text-white` : 'bg-gray-100 text-gray-500'
        )}
      >
        {region.name}
      </span>

      {/* Card count badge */}
      {typeCount > 0 && (
        <span
          className={cn(
            'mt-0.5 text-[10px] font-medium sm:text-xs',
            isUnlocked ? 'text-gray-600' : 'text-gray-400'
          )}
        >
          {typeCount}/{region.unlockThreshold} {region.unlockType}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// REGION DETAIL PANEL
// ============================================================================

interface RegionDetailProps {
  region: RegionDefinition;
  isUnlocked: boolean;
  typeCount: number;
  onClose: () => void;
}

function RegionDetail({ region, isUnlocked, typeCount, onClose }: RegionDetailProps) {
  const progress = Math.min(100, (typeCount / region.unlockThreshold) * 100);

  return (
    <div
      className={cn(
        'rounded-xl p-4 shadow-md',
        isUnlocked ? region.bgColor : 'bg-gray-100'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              isUnlocked ? `bg-gradient-to-br ${region.gradient}` : 'bg-gray-300'
            )}
          >
            {isUnlocked ? (
              <SparklesIcon className="h-5 w-5 text-white" />
            ) : (
              <LockClosedIcon className="h-5 w-5 text-gray-500" />
            )}
          </div>
          <div>
            <h3
              className={cn(
                'font-bold',
                isUnlocked ? 'text-gray-900' : 'text-gray-500'
              )}
            >
              {region.name}
            </h3>
            <p className="text-sm text-gray-600">{region.description}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Close region details"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Unlock requirement */}
      <div className="mt-3 rounded-lg bg-white/60 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {isUnlocked ? 'Unlocked with' : 'Unlock requirement'}
          </span>
          <span className="font-semibold">
            {typeCount}/{region.unlockThreshold} {region.unlockType} cards
          </span>
        </div>
        {!isUnlocked && (
          <div className="mt-2">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className={cn('h-full rounded-full bg-gradient-to-r transition-all', region.gradient)}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Collect {region.unlockThreshold - typeCount} more {region.unlockType} cards to unlock!
            </p>
          </div>
        )}
        {isUnlocked && (
          <div className="mt-2 flex items-center gap-1 text-emerald-600">
            <CheckCircleIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Region Explored!</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PATH CONNECTIONS
// ============================================================================

interface PathConnectionsProps {
  regions: RegionDefinition[];
  unlockedRegions: Set<string>;
}

function PathConnections({ regions, unlockedRegions }: PathConnectionsProps) {
  const connections: Array<{ from: RegionDefinition; to: RegionDefinition; bothUnlocked: boolean }> = [];
  const seen = new Set<string>();

  for (const region of regions) {
    for (const connId of region.connections) {
      const key = [region.id, connId].sort().join('-');
      if (!seen.has(key)) {
        seen.add(key);
        const toRegion = regions.find((r) => r.id === connId);
        if (toRegion) {
          connections.push({
            from: region,
            to: toRegion,
            bothUnlocked: unlockedRegions.has(region.id) && unlockedRegions.has(connId),
          });
        }
      }
    }
  }

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      {connections.map(({ from, to, bothUnlocked }) => (
        <line
          key={`${from.id}-${to.id}`}
          x1={`${from.position.x}%`}
          y1={`${from.position.y}%`}
          x2={`${to.position.x}%`}
          y2={`${to.position.y}%`}
          stroke={bothUnlocked ? 'url(#pathGradient)' : '#d1d5db'}
          strokeWidth={bothUnlocked ? 3 : 2}
          strokeDasharray={bothUnlocked ? undefined : '6 4'}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface AdventureMapProps {
  className?: string;
}

export function AdventureMap({ className }: AdventureMapProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const [selectedRegion, setSelectedRegion] = useState<RegionDefinition | null>(null);

  const typeProgress = useQuery(
    api.achievements.getTypeSpecialistProgress,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  if (profileLoading || typeProgress === undefined) {
    return <AdventureMapSkeleton />;
  }

  const typeCounts = typeProgress.typeCounts as Record<string, number>;

  // Calculate unlocked regions based on type counts
  const unlockedRegions = new Set<string>();
  for (const region of REGIONS) {
    const count = typeCounts[region.unlockType] ?? 0;
    if (count >= region.unlockThreshold) {
      unlockedRegions.add(region.id);
    }
  }

  const unlockedCount = unlockedRegions.size;
  const overallProgress = Math.round((unlockedCount / REGIONS.length) * 100);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <MapIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">Adventure Map</h2>
            <p className="text-sm text-white/80">
              {unlockedCount} of {REGIONS.length} regions unlocked
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{overallProgress}%</p>
            <p className="text-xs text-white/80">explored</p>
          </div>
        </div>
      </div>

      {/* Map visualization */}
      <div className="relative h-[400px] overflow-hidden rounded-xl bg-gradient-to-br from-sky-100 via-emerald-50 to-amber-50 shadow-inner sm:h-[450px]">
        {/* Decorative background pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #94a3b8 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
          aria-hidden="true"
        />

        {/* Path connections */}
        <PathConnections regions={REGIONS} unlockedRegions={unlockedRegions} />

        {/* Region nodes */}
        {REGIONS.map((region) => {
          const typeCount = typeCounts[region.unlockType] ?? 0;
          const isUnlocked = unlockedRegions.has(region.id);
          const progress = Math.min(100, (typeCount / region.unlockThreshold) * 100);

          return (
            <RegionNode
              key={region.id}
              region={region}
              isUnlocked={isUnlocked}
              progress={progress}
              typeCount={typeCount}
              isSelected={selectedRegion?.id === region.id}
              onSelect={() => setSelectedRegion(region)}
            />
          );
        })}
      </div>

      {/* Selected region detail */}
      {selectedRegion && (
        <RegionDetail
          region={selectedRegion}
          isUnlocked={unlockedRegions.has(selectedRegion.id)}
          typeCount={typeCounts[selectedRegion.unlockType] ?? 0}
          onClose={() => setSelectedRegion(null)}
        />
      )}

      {/* Hint for next region */}
      {unlockedCount < REGIONS.length && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-3 text-center">
          <p className="text-sm text-gray-600">
            Collect more cards by type to unlock new regions!
          </p>
        </div>
      )}
    </div>
  );
}
