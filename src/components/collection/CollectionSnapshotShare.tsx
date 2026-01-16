'use client';

import { useState, useRef, useCallback } from 'react';
import {
  ShareIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  SparklesIcon,
  Square3Stack3DIcon,
  TrophyIcon,
  FireIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Skeleton } from '@/components/ui/Skeleton';

interface CollectionSnapshotShareProps {
  className?: string;
}

type ThemeOption = 'purple' | 'blue' | 'green' | 'sunset';

const themes: Record<ThemeOption, { gradient: string; accent: string; name: string }> = {
  purple: {
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    accent: '#a78bfa',
    name: 'Galaxy',
  },
  blue: {
    gradient: 'linear-gradient(135deg, #2563eb 0%, #0891b2 100%)',
    accent: '#38bdf8',
    name: 'Ocean',
  },
  green: {
    gradient: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
    accent: '#34d399',
    name: 'Forest',
  },
  sunset: {
    gradient: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
    accent: '#fb923c',
    name: 'Sunset',
  },
};

export function CollectionSnapshotShare({ className }: CollectionSnapshotShareProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-indigo-600 hover:to-purple-600 ${className || ''}`}
        aria-label="Share collection snapshot"
      >
        <ShareIcon className="h-5 w-5" />
        Share Snapshot
      </button>

      {isModalOpen && <SnapshotModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}

interface SnapshotModalProps {
  onClose: () => void;
}

function SnapshotModal({ onClose }: SnapshotModalProps) {
  const { profileId, isLoading: profileLoading } = useCurrentProfile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('purple');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  const stats = useQuery(
    api.collections.getCollectionStats,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  const streakProgress = useQuery(
    api.achievements.getStreakProgress,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  const achievements = useQuery(
    api.achievements.getAchievements,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  const profile = useQuery(
    api.profiles.getProfile,
    profileId ? { profileId: profileId as Id<'profiles'> } : 'skip'
  );

  const isLoading = profileLoading || !stats || !streakProgress || !achievements || !profile;

  const earnedBadges = achievements?.filter((a) => a.earnedAt !== null).length ?? 0;
  const totalBadges = achievements?.length ?? 0;
  const currentStreak = streakProgress?.currentStreak ?? 0;

  const generateSnapshot = useCallback(() => {
    if (!canvasRef.current || isLoading) return;

    setIsGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const theme = themes[selectedTheme];

    // Set canvas size (1080x1080 for Instagram-friendly square)
    canvas.width = 1080;
    canvas.height = 1080;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (selectedTheme === 'purple') {
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
    } else if (selectedTheme === 'blue') {
      gradient.addColorStop(0, '#2563eb');
      gradient.addColorStop(1, '#0891b2');
    } else if (selectedTheme === 'green') {
      gradient.addColorStop(0, '#059669');
      gradient.addColorStop(1, '#0d9488');
    } else {
      gradient.addColorStop(0, '#f97316');
      gradient.addColorStop(1, '#ec4899');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle pattern overlay
    ctx.globalAlpha = 0.05;
    for (let x = 0; x < canvas.width; x += 30) {
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Add decorative sparkles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    const sparklePositions = [
      { x: 100, y: 150, size: 60 },
      { x: 950, y: 200, size: 80 },
      { x: 150, y: 900, size: 50 },
      { x: 900, y: 850, size: 70 },
    ];
    sparklePositions.forEach(({ x, y, size }) => {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size * 0.3, y - size * 0.3);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x + size * 0.3, y + size * 0.3);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size * 0.3, y + size * 0.3);
      ctx.lineTo(x - size, y);
      ctx.lineTo(x - size * 0.3, y - size * 0.3);
      ctx.closePath();
      ctx.fill();
    });

    // Main content card
    const cardX = 80;
    const cardY = 200;
    const cardWidth = 920;
    const cardHeight = 600;
    const cardRadius = 40;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
    ctx.fill();

    // Add card shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Profile name header
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 56px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    const displayName = profile?.displayName ?? 'Collector';
    ctx.fillText(`${displayName}'s Collection`, canvas.width / 2, cardY + 90);

    // Stats grid
    const statsY = cardY + 160;
    const statBoxWidth = 200;
    const statBoxHeight = 160;
    const statSpacing = 20;
    const totalStatsWidth = statBoxWidth * 4 + statSpacing * 3;
    const startX = (canvas.width - totalStatsWidth) / 2;

    const statsData = [
      { label: 'Total Cards', value: stats?.totalCards ?? 0, color: '#6366f1' },
      { label: 'Unique Cards', value: stats?.uniqueCards ?? 0, color: '#a855f7' },
      { label: 'Day Streak', value: currentStreak, color: '#f97316' },
      { label: 'Badges', value: `${earnedBadges}/${totalBadges}`, color: '#eab308' },
    ];

    statsData.forEach((stat, index) => {
      const x = startX + index * (statBoxWidth + statSpacing);

      // Stat box background
      ctx.fillStyle = stat.color + '15';
      ctx.beginPath();
      ctx.roundRect(x, statsY, statBoxWidth, statBoxHeight, 20);
      ctx.fill();

      // Stat value
      ctx.fillStyle = stat.color;
      ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(stat.value), x + statBoxWidth / 2, statsY + 75);

      // Stat label
      ctx.fillStyle = '#6b7280';
      ctx.font = '24px system-ui, -apple-system, sans-serif';
      ctx.fillText(stat.label, x + statBoxWidth / 2, statsY + 120);
    });

    // Sets started section
    const setsY = statsY + statBoxHeight + 50;
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${stats?.setsStarted ?? 0} Sets Started`, canvas.width / 2, setsY);

    // Progress bar
    const progressY = setsY + 40;
    const progressWidth = 600;
    const progressHeight = 20;
    const progressX = (canvas.width - progressWidth) / 2;

    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.roundRect(progressX, progressY, progressWidth, progressHeight, 10);
    ctx.fill();

    // Fill based on a sensible percentage (cap at 100 cards = 100%)
    const progressPercent = Math.min((stats?.totalCards ?? 0) / 100, 1);
    const fillGradient = ctx.createLinearGradient(
      progressX,
      0,
      progressX + progressWidth * progressPercent,
      0
    );
    if (selectedTheme === 'purple') {
      fillGradient.addColorStop(0, '#667eea');
      fillGradient.addColorStop(1, '#764ba2');
    } else if (selectedTheme === 'blue') {
      fillGradient.addColorStop(0, '#2563eb');
      fillGradient.addColorStop(1, '#0891b2');
    } else if (selectedTheme === 'green') {
      fillGradient.addColorStop(0, '#059669');
      fillGradient.addColorStop(1, '#0d9488');
    } else {
      fillGradient.addColorStop(0, '#f97316');
      fillGradient.addColorStop(1, '#ec4899');
    }
    ctx.fillStyle = fillGradient;
    ctx.beginPath();
    ctx.roundRect(progressX, progressY, progressWidth * progressPercent, progressHeight, 10);
    ctx.fill();

    // CardDex branding at top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 40px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CardDex', canvas.width / 2, 100);

    // Tagline
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '24px system-ui, -apple-system, sans-serif';
    ctx.fillText('All your cards. One app.', canvas.width / 2, 145);

    // Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '28px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Track your collection at carddex.app', canvas.width / 2, 920);

    // Date
    const date = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '22px system-ui, -apple-system, sans-serif';
    ctx.fillText(date, canvas.width / 2, 970);

    setIsGenerating(false);
    setDownloadReady(true);
  }, [isLoading, selectedTheme, stats, profile, earnedBadges, totalBadges, currentStreak]);

  // Generate snapshot when modal opens or theme changes
  useState(() => {
    if (!isLoading) {
      setTimeout(generateSnapshot, 100);
    }
  });

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `carddex-collection-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleCopyToClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current?.toBlob(resolve, 'image/png')
      );
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Clipboard API not supported, fallback to download
      handleDownload();
    }
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvasRef.current?.toBlob(resolve, 'image/png')
      );
      if (blob && navigator.share) {
        const file = new File([blob], 'carddex-collection.png', { type: 'image/png' });
        await navigator.share({
          title: 'My CardDex Collection',
          text: 'Check out my card collection!',
          files: [file],
        });
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  // Close on escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useState(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="snapshot-modal-title"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
              <ShareIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 id="snapshot-modal-title" className="text-lg font-bold text-gray-800">
                Share Collection Snapshot
              </h2>
              <p className="text-sm text-gray-500">Create a shareable image of your collection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Theme selector */}
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <p className="mb-2 text-sm font-medium text-gray-700">Choose a theme:</p>
          <div className="flex gap-2">
            {(Object.keys(themes) as ThemeOption[]).map((themeKey) => (
              <button
                key={themeKey}
                onClick={() => {
                  setSelectedTheme(themeKey);
                  setDownloadReady(false);
                  setTimeout(generateSnapshot, 50);
                }}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  selectedTheme === themeKey
                    ? 'ring-2 ring-offset-2'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  background: themes[themeKey].gradient,
                  color: 'white',
                  ...(selectedTheme === themeKey && {
                    ringColor: themes[themeKey].accent,
                  }),
                }}
              >
                {themes[themeKey].name}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex aspect-square items-center justify-center rounded-xl bg-gray-100">
              <div className="text-center">
                <Skeleton className="mx-auto mb-4 h-12 w-12 rounded-full" />
                <Skeleton className="mx-auto h-4 w-32" />
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl shadow-lg">
              <canvas
                ref={canvasRef}
                className="h-auto w-full"
                style={{ maxHeight: '500px', objectFit: 'contain' }}
              />
              {isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
              )}
            </div>
          )}

          {/* Stats preview */}
          {!isLoading && (
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-lg bg-indigo-50 p-2">
                <Square3Stack3DIcon className="mx-auto h-5 w-5 text-indigo-500" />
                <p className="text-lg font-bold text-gray-800">{stats?.totalCards}</p>
                <p className="text-xs text-gray-500">Cards</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-2">
                <SparklesIcon className="mx-auto h-5 w-5 text-purple-500" />
                <p className="text-lg font-bold text-gray-800">{stats?.uniqueCards}</p>
                <p className="text-xs text-gray-500">Unique</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-2">
                <FireIcon className="mx-auto h-5 w-5 text-orange-500" />
                <p className="text-lg font-bold text-gray-800">{currentStreak}</p>
                <p className="text-xs text-gray-500">Streak</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2">
                <TrophyIcon className="mx-auto h-5 w-5 text-amber-500" />
                <p className="text-lg font-bold text-gray-800">{earnedBadges}</p>
                <p className="text-xs text-gray-500">Badges</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 p-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleCopyToClipboard}
              disabled={!downloadReady || isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="h-5 w-5" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              disabled={!downloadReady || isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Download
            </button>
            <button
              onClick={handleShare}
              disabled={!downloadReady || isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-indigo-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShareIcon className="h-5 w-5" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
