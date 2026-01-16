/**
 * Onboarding Flow Content - Configuration for new user onboarding
 * Provides step definitions, content, and utilities for the onboarding experience.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Onboarding step identifiers
 */
export type OnboardingStepId = 'welcome' | 'games' | 'profile' | 'first-cards' | 'complete';

/**
 * Individual onboarding step configuration
 */
export interface OnboardingStep {
  /** Unique step identifier */
  id: OnboardingStepId;
  /** Step number (1-indexed) */
  number: number;
  /** Step title */
  title: string;
  /** Step subtitle/description */
  subtitle: string;
  /** Icon name for the step (from Heroicons) */
  iconName: string;
  /** Gradient start color class */
  gradientFrom: string;
  /** Gradient end color class */
  gradientTo: string;
  /** Whether this step can be skipped */
  skippable: boolean;
  /** Tip text to show (optional) */
  tip?: string;
}

/**
 * User's onboarding progress
 */
export interface OnboardingProgress {
  /** Currently active step */
  currentStep: OnboardingStepId;
  /** Steps that have been completed */
  completedSteps: OnboardingStepId[];
  /** Whether the user has completed the entire flow */
  isComplete: boolean;
  /** Profile name entered during onboarding */
  profileName?: string;
  /** Profile type selected */
  profileType?: 'parent' | 'child';
  /** Timestamp when onboarding started */
  startedAt: number;
  /** Timestamp when onboarding completed */
  completedAt?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ONBOARDING_STORAGE_KEY = 'carddex-onboarding-progress';

export const TOTAL_STEPS = 4;

// ============================================================================
// STEP DEFINITIONS
// ============================================================================

/**
 * All onboarding steps in order
 */
export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: 'welcome',
    number: 1,
    title: 'Welcome to CardDex!',
    subtitle: "Let's get you set up to track your card collection",
    iconName: 'RocketLaunchIcon',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-purple-500',
    skippable: false,
    tip: 'This will only take a minute!',
  },
  {
    id: 'games',
    number: 2,
    title: 'What do you collect?',
    subtitle: 'Pick the card games you want to track',
    iconName: 'Square3Stack3DIcon',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-500',
    skippable: false,
    tip: 'You can add more games later in settings!',
  },
  {
    id: 'profile',
    number: 3,
    title: 'Create your profile',
    subtitle: 'Tell us a bit about yourself',
    iconName: 'UserCircleIcon',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-500',
    skippable: false,
    tip: 'Your name will appear on your collection and badges!',
  },
  {
    id: 'first-cards',
    number: 4,
    title: 'Add your first cards',
    subtitle: "Let's add some cards to your collection",
    iconName: 'SparklesIcon',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-rose-500',
    skippable: true,
    tip: "Don't worry, you can skip this and add cards later!",
  },
];

/**
 * Completion step (shown after all steps)
 */
export const COMPLETION_STEP: OnboardingStep = {
  id: 'complete',
  number: 5,
  title: "You're all set!",
  subtitle: 'Your collection awaits',
  iconName: 'TrophyIcon',
  gradientFrom: 'from-yellow-400',
  gradientTo: 'to-amber-500',
  skippable: false,
};

// ============================================================================
// STEP LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get a specific step by ID
 */
export function getStepById(stepId: OnboardingStepId): OnboardingStep | null {
  if (stepId === 'complete') return COMPLETION_STEP;
  return ONBOARDING_STEPS.find((step) => step.id === stepId) ?? null;
}

/**
 * Get a step by its number (1-indexed)
 */
export function getStepByNumber(number: number): OnboardingStep | null {
  if (number === TOTAL_STEPS + 1) return COMPLETION_STEP;
  return ONBOARDING_STEPS.find((step) => step.number === number) ?? null;
}

/**
 * Get the next step after the current one
 */
export function getNextStep(currentStepId: OnboardingStepId): OnboardingStep | null {
  if (currentStepId === 'complete') return null;
  const currentStep = getStepById(currentStepId);
  if (!currentStep) return null;
  return getStepByNumber(currentStep.number + 1);
}

/**
 * Get the previous step before the current one
 */
export function getPreviousStep(currentStepId: OnboardingStepId): OnboardingStep | null {
  if (currentStepId === 'complete') {
    return ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1];
  }
  const currentStep = getStepById(currentStepId);
  if (!currentStep || currentStep.number <= 1) return null;
  return getStepByNumber(currentStep.number - 1);
}

/**
 * Check if a step is the first step
 */
export function isFirstStep(stepId: OnboardingStepId): boolean {
  return stepId === 'welcome';
}

/**
 * Check if a step is the last content step (before completion)
 */
export function isLastContentStep(stepId: OnboardingStepId): boolean {
  return stepId === 'first-cards';
}

/**
 * Check if the step is the completion step
 */
export function isCompletionStep(stepId: OnboardingStepId): boolean {
  return stepId === 'complete';
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Create initial onboarding progress
 */
export function createInitialProgress(): OnboardingProgress {
  return {
    currentStep: 'welcome',
    completedSteps: [],
    isComplete: false,
    startedAt: Date.now(),
  };
}

/**
 * Mark a step as completed and move to the next
 */
export function completeStep(
  progress: OnboardingProgress,
  stepId: OnboardingStepId
): OnboardingProgress {
  if (progress.completedSteps.includes(stepId)) {
    // Already completed, just move to next step
    const nextStep = getNextStep(stepId);
    return {
      ...progress,
      currentStep: nextStep?.id ?? 'complete',
      isComplete: nextStep === null || nextStep.id === 'complete',
      completedAt: nextStep === null || nextStep.id === 'complete' ? Date.now() : undefined,
    };
  }

  const nextStep = getNextStep(stepId);
  return {
    ...progress,
    currentStep: nextStep?.id ?? 'complete',
    completedSteps: [...progress.completedSteps, stepId],
    isComplete: nextStep === null || nextStep.id === 'complete',
    completedAt: nextStep === null || nextStep.id === 'complete' ? Date.now() : undefined,
  };
}

/**
 * Skip to a specific step (for back navigation)
 */
export function goToStep(
  progress: OnboardingProgress,
  stepId: OnboardingStepId
): OnboardingProgress {
  return {
    ...progress,
    currentStep: stepId,
  };
}

/**
 * Calculate progress percentage (0-100)
 */
export function getProgressPercentage(progress: OnboardingProgress): number {
  if (progress.isComplete) return 100;
  const completedCount = progress.completedSteps.length;
  return Math.round((completedCount / TOTAL_STEPS) * 100);
}

/**
 * Check if a step has been completed
 */
export function isStepCompleted(progress: OnboardingProgress, stepId: OnboardingStepId): boolean {
  return progress.completedSteps.includes(stepId);
}

/**
 * Update the profile name in progress
 */
export function setProfileName(progress: OnboardingProgress, name: string): OnboardingProgress {
  return {
    ...progress,
    profileName: name,
  };
}

/**
 * Update the profile type in progress
 */
export function setProfileType(
  progress: OnboardingProgress,
  type: 'parent' | 'child'
): OnboardingProgress {
  return {
    ...progress,
    profileType: type,
  };
}

// ============================================================================
// LOCAL STORAGE
// ============================================================================

/**
 * Save onboarding progress to localStorage
 */
export function saveOnboardingProgress(progress: OnboardingProgress): void {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage might not be available
  }
}

/**
 * Load onboarding progress from localStorage
 */
export function loadOnboardingProgress(): OnboardingProgress | null {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    // Validate structure
    if (
      typeof parsed === 'object' &&
      typeof parsed.currentStep === 'string' &&
      Array.isArray(parsed.completedSteps) &&
      typeof parsed.isComplete === 'boolean'
    ) {
      return parsed as OnboardingProgress;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear onboarding progress from localStorage
 */
export function clearOnboardingProgress(): void {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch {
    // localStorage might not be available
  }
}

/**
 * Check if the user has completed onboarding
 */
export function hasCompletedOnboarding(): boolean {
  const progress = loadOnboardingProgress();
  return progress?.isComplete ?? false;
}

/**
 * Mark onboarding as complete in localStorage
 */
export function markOnboardingComplete(): void {
  const progress = loadOnboardingProgress() ?? createInitialProgress();
  progress.isComplete = true;
  progress.completedAt = Date.now();
  progress.completedSteps = ONBOARDING_STEPS.map((s) => s.id);
  saveOnboardingProgress(progress);
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get user-friendly step label
 */
export function getStepLabel(stepId: OnboardingStepId): string {
  const step = getStepById(stepId);
  return step?.title ?? 'Unknown Step';
}

/**
 * Get progress text (e.g., "Step 2 of 4")
 */
export function getProgressText(stepId: OnboardingStepId): string {
  const step = getStepById(stepId);
  if (!step || stepId === 'complete') return 'Complete!';
  return `Step ${step.number} of ${TOTAL_STEPS}`;
}

/**
 * Format the time spent in onboarding
 */
export function formatOnboardingTime(progress: OnboardingProgress): string {
  const endTime = progress.completedAt ?? Date.now();
  const durationMs = endTime - progress.startedAt;
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes < 1) return 'Less than a minute';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}

/**
 * Get a welcoming message based on profile type
 */
export function getWelcomeMessage(profileType?: 'parent' | 'child'): string {
  if (profileType === 'parent') {
    return "Great! You can manage your family's collections and see what everyone is collecting.";
  }
  return 'Awesome! Get ready to track your cards, earn badges, and share wishlists!';
}

/**
 * Get quick stats for first cards step
 */
export function getFirstCardsStats(): { sets: string; cards: string; badges: string } {
  return {
    sets: '500+',
    cards: '20,000+',
    badges: '50+',
  };
}
