'use client';

import { useState, useRef, useCallback } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { cn } from '@/lib/utils';
import {
  CameraIcon,
  XMarkIcon,
  ArrowPathIcon,
  SparklesIcon,
  ExclamationCircleIcon,
  PhotoIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import type { Id } from '../../../convex/_generated/dataModel';

type GameSlug = 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana';

// Types matching the backend ConditionGradingResult
interface ConditionArea {
  rating: 'perfect' | 'good' | 'fair' | 'poor';
  description: string;
}

interface CenteringArea {
  rating: 'well-centered' | 'slightly-off' | 'off-center';
  description: string;
}

interface ConditionDetails {
  corners: ConditionArea;
  edges: ConditionArea;
  surface: ConditionArea;
  centering: CenteringArea;
}

interface ConditionGradingResult {
  grade: 'NM' | 'LP' | 'MP' | 'HP' | 'DMG';
  gradeName: string;
  confidence: 'high' | 'medium' | 'low';
  overallSummary: string;
  details: ConditionDetails;
  issuesFound: string[];
  careTip: string;
  funFact: string;
  wouldImproveGrade: string | null;
  error?: string;
}

interface ConditionGraderProps {
  /** The game context for grading */
  gameSlug?: GameSlug;
  /** Optional card name for context */
  cardName?: string;
  /** Callback when grading is complete */
  onGradingComplete?: (result: ConditionGradingResult) => void;
  /** Callback when the grader is closed */
  onClose?: () => void;
  /** Additional className for the container */
  className?: string;
}

type GraderState = 'upload' | 'preview' | 'grading' | 'result';

// Grade color mapping
const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  NM: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
  LP: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' },
  MP: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
  HP: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' },
  DMG: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' },
};

// Rating color mapping
const RATING_COLORS: Record<string, string> = {
  perfect: 'text-green-600',
  good: 'text-blue-600',
  fair: 'text-yellow-600',
  poor: 'text-red-600',
  'well-centered': 'text-green-600',
  'slightly-off': 'text-yellow-600',
  'off-center': 'text-red-600',
};

// Rating emoji mapping
const RATING_EMOJIS: Record<string, string> = {
  perfect: '✨',
  good: '👍',
  fair: '👌',
  poor: '⚠️',
  'well-centered': '🎯',
  'slightly-off': '↔️',
  'off-center': '↗️',
};

export function ConditionGrader({
  gameSlug = 'pokemon',
  cardName,
  onGradingComplete,
  onClose,
  className,
}: ConditionGraderProps) {
  const { profileId, family } = useCurrentProfile();
  const gradeCondition = useAction(api.ai.conditionGrader.gradeCardCondition);

  const [state, setState] = useState<GraderState>('upload');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [gradingResult, setGradingResult] = useState<ConditionGradingResult | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCapturedImage(result);
      setState('preview');
    };
    reader.readAsDataURL(file);

    // Reset the input so the same file can be selected again
    event.target.value = '';
  }, []);

  // Trigger file input click
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Reset to upload state
  const resetGrader = useCallback(() => {
    setCapturedImage(null);
    setGradingResult(null);
    setState('upload');
  }, []);

  // Grade the uploaded card
  const gradeCard = useCallback(async () => {
    if (!capturedImage) return;

    if (!profileId) {
      setGradingResult({
        grade: 'LP',
        gradeName: 'Lightly Played',
        confidence: 'low',
        overallSummary: 'Please sign in to grade cards!',
        details: {
          corners: { rating: 'good', description: 'Sign in required' },
          edges: { rating: 'good', description: 'Sign in required' },
          surface: { rating: 'good', description: 'Sign in required' },
          centering: { rating: 'well-centered', description: 'Sign in required' },
        },
        issuesFound: [],
        careTip: 'Sign in to use the condition grader!',
        funFact: 'The condition grader uses AI to analyze your cards.',
        wouldImproveGrade: null,
        error: 'Please sign in to grade cards!',
      });
      setState('result');
      return;
    }

    if (!family?.id) {
      setGradingResult({
        grade: 'LP',
        gradeName: 'Lightly Played',
        confidence: 'low',
        overallSummary: 'Please set up your family account!',
        details: {
          corners: { rating: 'good', description: 'Family setup required' },
          edges: { rating: 'good', description: 'Family setup required' },
          surface: { rating: 'good', description: 'Family setup required' },
          centering: { rating: 'well-centered', description: 'Family setup required' },
        },
        issuesFound: [],
        careTip: 'Set up your family account to use all features!',
        funFact: 'Family accounts let everyone track their cards.',
        wouldImproveGrade: null,
        error: 'Please set up your family account!',
      });
      setState('result');
      return;
    }

    setState('grading');

    try {
      // Extract base64 data and determine image type
      const [header, base64Data] = capturedImage.split(',');
      const imageTypeMatch = header.match(/image\/(jpeg|png|webp|gif)/);
      const imageType = (imageTypeMatch?.[1] || 'jpeg') as 'jpeg' | 'png' | 'webp' | 'gif';

      const result = await gradeCondition({
        profileId: profileId as Id<'profiles'>,
        familyId: family.id as Id<'families'>,
        imageBase64: base64Data,
        imageType,
        gameSlug,
        cardName,
      });

      setGradingResult(result);
      setState('result');

      if (onGradingComplete) {
        onGradingComplete(result);
      }
    } catch (err) {
      console.error('Grading error:', err);
      setGradingResult({
        grade: 'LP',
        gradeName: 'Lightly Played',
        confidence: 'low',
        overallSummary: 'Something went wrong while grading. Please try again!',
        details: {
          corners: { rating: 'good', description: 'Error occurred' },
          edges: { rating: 'good', description: 'Error occurred' },
          surface: { rating: 'good', description: 'Error occurred' },
          centering: { rating: 'well-centered', description: 'Error occurred' },
        },
        issuesFound: [],
        careTip: 'Try taking a clearer photo with better lighting!',
        funFact: 'Good photos help AI grade cards more accurately.',
        wouldImproveGrade: null,
        error: 'Something went wrong. Please try again!',
      });
      setState('result');
    }
  }, [capturedImage, profileId, family?.id, gradeCondition, gameSlug, cardName, onGradingComplete]);

  // Handle close
  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Render grading tutorial overlay
  const renderTutorial = () => (
    <div className="absolute inset-0 z-10 overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-kid-primary to-kid-secondary px-4 py-3">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="h-5 w-5 text-white" />
          <h2 className="font-semibold text-white">Card Grading Guide</h2>
        </div>
        <button
          onClick={() => setShowTutorial(false)}
          className="rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
          aria-label="Close tutorial"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="space-y-6 p-4">
        {/* Grade explanations */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900">Understanding Card Grades</h3>

          <div className={cn('rounded-lg border-l-4 p-3', GRADE_COLORS.NM.border, GRADE_COLORS.NM.bg)}>
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <span className={cn('font-bold', GRADE_COLORS.NM.text)}>NM - Near Mint</span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              Almost perfect! Looks like it just came out of a pack. No visible wear.
            </p>
          </div>

          <div className={cn('rounded-lg border-l-4 p-3', GRADE_COLORS.LP.border, GRADE_COLORS.LP.bg)}>
            <div className="flex items-center gap-2">
              <span className="text-lg">👍</span>
              <span className={cn('font-bold', GRADE_COLORS.LP.text)}>LP - Lightly Played</span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              Very good condition with only tiny signs of wear you&apos;d barely notice.
            </p>
          </div>

          <div className={cn('rounded-lg border-l-4 p-3', GRADE_COLORS.MP.border, GRADE_COLORS.MP.bg)}>
            <div className="flex items-center gap-2">
              <span className="text-lg">👌</span>
              <span className={cn('font-bold', GRADE_COLORS.MP.text)}>MP - Moderately Played</span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              Noticeable wear but the card is still in good shape overall.
            </p>
          </div>

          <div className={cn('rounded-lg border-l-4 p-3', GRADE_COLORS.HP.border, GRADE_COLORS.HP.bg)}>
            <div className="flex items-center gap-2">
              <span className="text-lg">🎮</span>
              <span className={cn('font-bold', GRADE_COLORS.HP.text)}>HP - Heavily Played</span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              Well-loved card with lots of signs it&apos;s been played a lot.
            </p>
          </div>

          <div className={cn('rounded-lg border-l-4 p-3', GRADE_COLORS.DMG.border, GRADE_COLORS.DMG.bg)}>
            <div className="flex items-center gap-2">
              <span className="text-lg">💔</span>
              <span className={cn('font-bold', GRADE_COLORS.DMG.text)}>DMG - Damaged</span>
            </div>
            <p className="mt-1 text-sm text-gray-700">
              Major damage like tears, water damage, or heavy creases.
            </p>
          </div>
        </div>

        {/* What to look for */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900">What the AI Looks For</h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-3">
              <h4 className="font-semibold text-gray-800">🔲 Corners</h4>
              <p className="mt-1 text-sm text-gray-600">
                Sharp corners = better grade. Look for bends, softness, or damage.
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <h4 className="font-semibold text-gray-800">📏 Edges</h4>
              <p className="mt-1 text-sm text-gray-600">
                Check for whitening, nicks, or wear along the card edges.
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <h4 className="font-semibold text-gray-800">✨ Surface</h4>
              <p className="mt-1 text-sm text-gray-600">
                Scratches, scuffs, or print lines can lower a grade.
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <h4 className="font-semibold text-gray-800">🎯 Centering</h4>
              <p className="mt-1 text-sm text-gray-600">
                The card art should be centered within the borders.
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-lg bg-yellow-50 p-4">
          <h3 className="mb-2 font-bold text-yellow-800">💡 Photo Tips</h3>
          <ul className="space-y-1 text-sm text-yellow-700">
            <li>• Use good lighting - natural light works best</li>
            <li>• Take the photo straight-on, not at an angle</li>
            <li>• Make sure the whole card is visible</li>
            <li>• Remove the card from sleeves for accurate grading</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Render upload state
  const renderUploadState = () => (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-kid-primary/20 to-kid-secondary/20">
        <PhotoIcon className="h-12 w-12 text-kid-primary" />
      </div>

      <h3 className="mb-2 text-xl font-bold text-gray-900">Grade Your Card&apos;s Condition</h3>
      <p className="mb-6 text-center text-gray-600">
        Upload a photo of your card and the AI will analyze its condition!
      </p>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={openFilePicker}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-kid-primary py-3 font-semibold text-white shadow-lg transition hover:bg-kid-primary/90"
        >
          <CameraIcon className="h-5 w-5" />
          Choose Photo
        </button>

        <button
          onClick={() => setShowTutorial(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-medium text-gray-700 transition hover:bg-gray-200"
        >
          <AcademicCapIcon className="h-5 w-5" />
          Learn About Grading
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Select card image"
      />
    </div>
  );

  // Render preview state
  const renderPreviewState = () => (
    <div className="flex flex-1 flex-col">
      {/* Image preview */}
      <div className="relative aspect-[3/4] w-full bg-black">
        {capturedImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capturedImage}
            alt="Card to grade"
            className="h-full w-full object-contain"
          />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 bg-gray-100 p-4">
        <button
          onClick={resetGrader}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-200 py-3 font-semibold text-gray-700 transition hover:bg-gray-300"
        >
          <ArrowPathIcon className="h-5 w-5" />
          Change Photo
        </button>
        <button
          onClick={gradeCard}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-kid-primary py-3 font-semibold text-white shadow-lg transition hover:bg-kid-primary/90"
        >
          <SparklesIcon className="h-5 w-5" />
          Grade Card
        </button>
      </div>
    </div>
  );

  // Render grading state
  const renderGradingState = () => (
    <div className="flex flex-1 flex-col">
      {/* Image preview (dimmed) */}
      <div className="relative aspect-[3/4] w-full bg-black">
        {capturedImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capturedImage}
            alt="Card being graded"
            className="h-full w-full object-contain opacity-50"
          />
        )}

        {/* Grading overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
          {/* Animated grading icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping">
              <div className="h-20 w-20 rounded-full bg-yellow-400/20" />
            </div>
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
              <AcademicCapIcon className="h-10 w-10 animate-pulse text-white" />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4 w-48 overflow-hidden rounded-full bg-white/20">
            <div className="h-2 animate-progress rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-[length:200%_100%]" />
          </div>

          <p className="text-lg font-medium text-white">Analyzing condition...</p>
          <p className="mt-1 text-sm text-white/70">Checking corners, edges, surface & centering</p>
        </div>
      </div>
    </div>
  );

  // Render result state
  const renderResultState = () => {
    if (!gradingResult) return null;

    const gradeColors = GRADE_COLORS[gradingResult.grade] || GRADE_COLORS.LP;
    const hasError = !!gradingResult.error;

    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {/* Grade Header */}
          <div className={cn('p-6 text-center', gradeColors.bg)}>
            {hasError ? (
              <div className="flex flex-col items-center">
                <ExclamationCircleIcon className="mb-2 h-12 w-12 text-orange-500" />
                <p className="text-gray-700">{gradingResult.error}</p>
              </div>
            ) : (
              <>
                <div className={cn('mb-2 inline-block rounded-full px-4 py-1 text-2xl font-bold', gradeColors.text)}>
                  {gradingResult.grade}
                </div>
                <h3 className={cn('text-xl font-bold', gradeColors.text)}>
                  {gradingResult.gradeName}
                </h3>
                <p className="mt-2 text-gray-700">{gradingResult.overallSummary}</p>
                {gradingResult.confidence && (
                  <span className="mt-2 inline-block rounded-full bg-white/50 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {gradingResult.confidence} confidence
                  </span>
                )}
              </>
            )}
          </div>

          {/* Detailed breakdown */}
          {!hasError && (
            <div className="space-y-4 p-4">
              {/* Condition details */}
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                  <InformationCircleIcon className="h-5 w-5 text-kid-primary" />
                  Condition Breakdown
                </h4>

                <div className="space-y-3">
                  {/* Corners */}
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{RATING_EMOJIS[gradingResult.details.corners.rating]}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">Corners</span>
                        <span className={cn('text-sm font-medium capitalize', RATING_COLORS[gradingResult.details.corners.rating])}>
                          {gradingResult.details.corners.rating}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{gradingResult.details.corners.description}</p>
                    </div>
                  </div>

                  {/* Edges */}
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{RATING_EMOJIS[gradingResult.details.edges.rating]}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">Edges</span>
                        <span className={cn('text-sm font-medium capitalize', RATING_COLORS[gradingResult.details.edges.rating])}>
                          {gradingResult.details.edges.rating}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{gradingResult.details.edges.description}</p>
                    </div>
                  </div>

                  {/* Surface */}
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{RATING_EMOJIS[gradingResult.details.surface.rating]}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">Surface</span>
                        <span className={cn('text-sm font-medium capitalize', RATING_COLORS[gradingResult.details.surface.rating])}>
                          {gradingResult.details.surface.rating}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{gradingResult.details.surface.description}</p>
                    </div>
                  </div>

                  {/* Centering */}
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{RATING_EMOJIS[gradingResult.details.centering.rating]}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">Centering</span>
                        <span className={cn('text-sm font-medium capitalize', RATING_COLORS[gradingResult.details.centering.rating])}>
                          {gradingResult.details.centering.rating.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{gradingResult.details.centering.description}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Issues found */}
              {gradingResult.issuesFound.length > 0 && (
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-gray-900">
                    <ExclamationCircleIcon className="h-5 w-5 text-orange-500" />
                    Issues Found
                  </h4>
                  <ul className="space-y-1">
                    {gradingResult.issuesFound.map((issue, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-orange-500">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* How to improve */}
              {gradingResult.wouldImproveGrade && (
                <div className="rounded-xl bg-green-50 p-4">
                  <h4 className="mb-1 flex items-center gap-2 font-semibold text-green-800">
                    <CheckCircleIcon className="h-5 w-5" />
                    To Get a Better Grade
                  </h4>
                  <p className="text-sm text-green-700">{gradingResult.wouldImproveGrade}</p>
                </div>
              )}

              {/* Care tip */}
              <div className="rounded-xl bg-blue-50 p-4">
                <h4 className="mb-1 flex items-center gap-2 font-semibold text-blue-800">
                  <SparklesIcon className="h-5 w-5" />
                  Care Tip
                </h4>
                <p className="text-sm text-blue-700">{gradingResult.careTip}</p>
              </div>

              {/* Fun fact */}
              <div className="rounded-xl bg-yellow-50 p-4">
                <h4 className="mb-1 flex items-center gap-2 font-semibold text-yellow-800">
                  <AcademicCapIcon className="h-5 w-5" />
                  Did You Know?
                </h4>
                <p className="text-sm text-yellow-700">{gradingResult.funFact}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 border-t bg-white p-4">
          <button
            onClick={resetGrader}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-kid-primary py-3 font-semibold text-white shadow-lg transition hover:bg-kid-primary/90"
          >
            <CameraIcon className="h-5 w-5" />
            Grade Another Card
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-2xl bg-white',
        className
      )}
      role="region"
      aria-label="Card Condition Grader"
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-kid-primary to-kid-secondary px-4 py-3">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="h-5 w-5 text-white" />
          <h2 className="font-semibold text-white">Condition Grader</h2>
        </div>
        <button
          onClick={handleClose}
          className="rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
          aria-label="Close grader"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {state === 'upload' && renderUploadState()}
        {state === 'preview' && renderPreviewState()}
        {state === 'grading' && renderGradingState()}
        {state === 'result' && renderResultState()}
      </div>

      {/* Tutorial overlay */}
      {showTutorial && renderTutorial()}
    </div>
  );
}
