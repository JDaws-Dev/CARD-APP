/**
 * Set Structure Content - Educational content for understanding Pokemon TCG sets
 * Provides kid-friendly explanations of how sets work, what a "master set" is,
 * and guides for understanding set structure and collection goals.
 *
 * This module contains structured onboarding content that helps new collectors
 * understand the organization of Pokemon TCG sets.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SetStructureStep {
  /** Unique step identifier */
  id: string;
  /** Step title */
  title: string;
  /** Detailed explanation */
  description: string;
  /** Short summary for quick reference */
  summary: string;
  /** Kid-friendly tip for this concept */
  tip: string;
  /** Icon name for visual representation */
  iconName: string;
}

export interface SetTypeInfo {
  /** Type identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of this set type */
  description: string;
  /** Examples of sets in this category */
  examples: string[];
  /** Approximate card count */
  cardCountRange: string;
  /** How often these are released */
  releaseFrequency: string;
  /** CSS gradient start color */
  gradientFrom: string;
  /** CSS gradient end color */
  gradientTo: string;
  /** Icon name for display */
  iconName: string;
}

export interface CollectionGoalInfo {
  /** Goal identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description of this goal type */
  description: string;
  /** What completing this goal means */
  completion: string;
  /** Difficulty level */
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  /** Kid-friendly advice */
  advice: string;
  /** Icon name for display */
  iconName: string;
}

export interface SetStructureOnboarding {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Short description */
  shortDescription: string;
  /** Full introduction text */
  fullDescription: string;
  /** Steps in this onboarding flow */
  steps: SetStructureStep[];
  /** Fun facts about sets */
  funFacts: string[];
  /** Gradient start color */
  gradientFrom: string;
  /** Gradient end color */
  gradientTo: string;
}

// ============================================================================
// SET STRUCTURE STEPS CONTENT
// ============================================================================

/**
 * Main onboarding flow for understanding set structure.
 */
export const SET_STRUCTURE_ONBOARDING: SetStructureOnboarding = {
  id: 'set-structure-intro',
  title: 'Understanding Pokemon Sets',
  shortDescription: 'Learn how Pokemon card sets work',
  fullDescription:
    'Pokemon cards are organized into sets - like chapters in a book! Each set has a theme, unique cards, and a set symbol. Understanding sets helps you organize your collection and set collecting goals.',
  gradientFrom: 'from-indigo-500',
  gradientTo: 'to-purple-500',
  steps: [
    {
      id: 'what-is-a-set',
      title: 'What is a Set?',
      description:
        'A Pokemon TCG set is a collection of cards released together with a shared theme. Each set has its own set symbol - a small icon printed on every card. Sets can have different numbers of cards, from small 30-card sets to large 200+ card sets!',
      summary: 'Sets are themed card collections with shared symbols',
      tip: "Look at the bottom right of any Pokemon card to find its set symbol - it's like a secret code that tells you where the card belongs!",
      iconName: 'RectangleStackIcon',
    },
    {
      id: 'set-symbols',
      title: 'Finding the Set Symbol',
      description:
        'Every card has a set symbol printed on it, usually near the card number. The symbol matches the set logo and helps you quickly identify which set a card belongs to. For example, Scarlet & Violet cards have a purple "SV" symbol!',
      summary: 'Set symbols identify which set a card belongs to',
      tip: 'When sorting cards, group them by set symbol first - this makes organizing super easy!',
      iconName: 'MagnifyingGlassIcon',
    },
    {
      id: 'card-numbers',
      title: 'Understanding Card Numbers',
      description:
        'Each card has a number like "25/198" - the first number (25) is that card\'s number, and the second (198) is the total regular cards in the set. Secret Rare cards have numbers HIGHER than the set total, like "205/198" - these are the rarest!',
      summary: 'Card numbers tell you the card position and set size',
      tip: 'If you see a card number bigger than the set total, you found a Secret Rare!',
      iconName: 'HashtagIcon',
    },
    {
      id: 'set-types',
      title: 'Types of Sets',
      description:
        'There are different types of sets: Main Sets (big expansions with 150-200+ cards), Mini Sets (smaller with 60-80 cards), Special Sets (like holidays or anniversaries), and Promo Sets (cards from events and products).',
      summary: 'Sets come in different sizes and types',
      tip: 'Main sets are released 4 times a year - perfect for setting seasonal collecting goals!',
      iconName: 'Squares2X2Icon',
    },
    {
      id: 'what-is-master-set',
      title: 'What is a Master Set?',
      description:
        'A "Master Set" means collecting EVERY version of EVERY card in a set - including all the holofoil variants, reverse holos, and secret rares. It\'s the ultimate collecting goal! Most collectors start with just getting one of each card (a "complete set").',
      summary: 'Master Set = every card AND every variant',
      tip: 'Start with a complete set goal first (one of each card) before trying for a master set!',
      iconName: 'TrophyIcon',
    },
    {
      id: 'collection-tracking',
      title: 'Tracking Your Progress',
      description:
        "Use CardDex to track which cards you own in each set. You can see your completion percentage, find which cards you're missing, and set goals for sets you want to complete. The app shows your progress as you add cards!",
      summary: 'Track progress and find missing cards',
      tip: 'Focus on completing sets you love most - chasing every set can be overwhelming!',
      iconName: 'ChartBarIcon',
    },
  ],
  funFacts: [
    'The first Pokemon set (Base Set) had only 102 cards in 1999!',
    'Scarlet & Violet sets can have over 250 cards including secret rares!',
    'Some special sets, like celebrations, mix old and new cards together.',
    'The set symbol is always printed in the same spot on every card from that set.',
    'Japan gets Pokemon sets before other countries, sometimes with different cards!',
  ],
};

// ============================================================================
// SET TYPES CONTENT
// ============================================================================

/**
 * Information about different types of Pokemon TCG sets.
 */
export const SET_TYPES: readonly SetTypeInfo[] = [
  {
    id: 'main-expansion',
    name: 'Main Expansion',
    description:
      'The big quarterly releases with lots of new Pokemon, trainers, and mechanics. These are the most popular sets with the biggest card pools.',
    examples: [
      'Scarlet & Violet',
      'Paldea Evolved',
      'Obsidian Flames',
      'Temporal Forces',
      'Shrouded Fable',
    ],
    cardCountRange: '150-200+ cards',
    releaseFrequency: '4 times per year',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-500',
    iconName: 'CubeIcon',
  },
  {
    id: 'mini-set',
    name: 'Mini Set',
    description:
      'Smaller sets that release between main expansions. They often focus on specific themes or Pokemon and are easier to complete.',
    examples: ['Pokemon GO', 'Crown Zenith', '151', 'Paldean Fates'],
    cardCountRange: '60-100 cards',
    releaseFrequency: '2-3 times per year',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-green-500',
    iconName: 'Square3Stack3DIcon',
  },
  {
    id: 'special-set',
    name: 'Special Set',
    description:
      'Unique sets for celebrations, anniversaries, or special events. These often have reprints of classic cards or exclusive artwork.',
    examples: ['Celebrations', 'Shining Fates', 'Hidden Fates', 'Pokemon 151'],
    cardCountRange: '30-70 cards',
    releaseFrequency: 'Special occasions',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-yellow-500',
    iconName: 'SparklesIcon',
  },
  {
    id: 'promo-set',
    name: 'Promo Cards',
    description:
      'Special cards you can only get from specific products, events, or promotions. These have a "PROMO" stamp instead of a regular set symbol.',
    examples: [
      'SV Black Star Promos',
      'SWSH Black Star Promos',
      "McDonald's Promos",
      'Build & Battle Promos',
    ],
    cardCountRange: 'Ongoing (50-200+)',
    releaseFrequency: 'Throughout the year',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-pink-500',
    iconName: 'StarIcon',
  },
] as const;

// ============================================================================
// COLLECTION GOALS CONTENT
// ============================================================================

/**
 * Different collection goals collectors can pursue.
 */
export const COLLECTION_GOALS: readonly CollectionGoalInfo[] = [
  {
    id: 'complete-set',
    name: 'Complete Set',
    description:
      'Collect one copy of every numbered card in a set (not including secret rares or variants).',
    completion: 'All cards from #1 to the set total',
    difficulty: 'medium',
    advice:
      'This is a great first goal! Focus on getting the main numbered cards before chasing rare variants.',
    iconName: 'CheckCircleIcon',
  },
  {
    id: 'reverse-holo-set',
    name: 'Reverse Holo Set',
    description:
      'Collect the reverse holofoil version of every common, uncommon, and rare card in a set.',
    completion: 'All reverse holo variants of eligible cards',
    difficulty: 'hard',
    advice: 'Reverse holos are found in most packs - save them up to build your set over time.',
    iconName: 'SparklesIcon',
  },
  {
    id: 'master-set',
    name: 'Master Set',
    description:
      'The ultimate goal: every card, every variant, every secret rare, every version that exists in the set.',
    completion: 'Every single card and variant, including secret rares',
    difficulty: 'expert',
    advice:
      'Master sets can be expensive and time-consuming. Only attempt for sets you truly love!',
    iconName: 'TrophyIcon',
  },
  {
    id: 'pokemon-focus',
    name: 'Pokemon Focus',
    description:
      'Collect every card featuring your favorite Pokemon across all sets - become the ultimate fan collector!',
    completion: "All cards featuring your chosen Pokemon (never truly 'complete'!)",
    difficulty: 'easy',
    advice:
      "Pick a Pokemon you love and hunt for all their cards. It's a fun way to build a unique collection!",
    iconName: 'HeartIcon',
  },
  {
    id: 'rarity-chase',
    name: 'Rarity Chase',
    description:
      'Focus on collecting ultra rares and secret rares from your favorite sets - the crown jewels!',
    completion: 'All cards above a certain rarity threshold',
    difficulty: 'hard',
    advice: 'Trading and buying singles is often more efficient than opening packs for rare cards.',
    iconName: 'FireIcon',
  },
] as const;

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get the main set structure onboarding content.
 */
export function getSetStructureOnboarding(): SetStructureOnboarding {
  return SET_STRUCTURE_ONBOARDING;
}

/**
 * Get a specific step from the onboarding flow.
 */
export function getOnboardingStep(stepId: string): SetStructureStep | null {
  return SET_STRUCTURE_ONBOARDING.steps.find((s) => s.id === stepId) ?? null;
}

/**
 * Get all onboarding steps.
 */
export function getAllOnboardingSteps(): readonly SetStructureStep[] {
  return SET_STRUCTURE_ONBOARDING.steps;
}

/**
 * Get set type info by ID.
 */
export function getSetTypeInfo(typeId: string): SetTypeInfo | null {
  return SET_TYPES.find((t) => t.id === typeId) ?? null;
}

/**
 * Get all set types.
 */
export function getAllSetTypes(): readonly SetTypeInfo[] {
  return SET_TYPES;
}

/**
 * Get collection goal info by ID.
 */
export function getCollectionGoalInfo(goalId: string): CollectionGoalInfo | null {
  return COLLECTION_GOALS.find((g) => g.id === goalId) ?? null;
}

/**
 * Get all collection goals.
 */
export function getAllCollectionGoals(): readonly CollectionGoalInfo[] {
  return COLLECTION_GOALS;
}

/**
 * Get collection goals by difficulty.
 */
export function getGoalsByDifficulty(
  difficulty: CollectionGoalInfo['difficulty']
): CollectionGoalInfo[] {
  return COLLECTION_GOALS.filter((g) => g.difficulty === difficulty);
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get difficulty display info.
 */
export function getDifficultyDisplayInfo(difficulty: CollectionGoalInfo['difficulty']): {
  label: string;
  colorClass: string;
  bgClass: string;
} {
  switch (difficulty) {
    case 'easy':
      return {
        label: 'Easy',
        colorClass: 'text-emerald-600',
        bgClass: 'bg-emerald-100',
      };
    case 'medium':
      return {
        label: 'Medium',
        colorClass: 'text-blue-600',
        bgClass: 'bg-blue-100',
      };
    case 'hard':
      return {
        label: 'Hard',
        colorClass: 'text-amber-600',
        bgClass: 'bg-amber-100',
      };
    case 'expert':
      return {
        label: 'Expert',
        colorClass: 'text-rose-600',
        bgClass: 'bg-rose-100',
      };
  }
}

/**
 * Get total step count.
 */
export function getTotalStepCount(): number {
  return SET_STRUCTURE_ONBOARDING.steps.length;
}

/**
 * Get a random fun fact about sets.
 */
export function getRandomSetFact(): string {
  const facts = SET_STRUCTURE_ONBOARDING.funFacts;
  return facts[Math.floor(Math.random() * facts.length)];
}

/**
 * Get all fun facts about sets.
 */
export function getAllSetFacts(): readonly string[] {
  return SET_STRUCTURE_ONBOARDING.funFacts;
}

// ============================================================================
// PROGRESS TRACKING HELPERS
// ============================================================================

const STORAGE_KEY = 'carddex-set-intro-completed';

/**
 * Check if the user has completed the set structure intro.
 */
export function hasCompletedSetIntro(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark the set structure intro as completed.
 */
export function markSetIntroComplete(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // Ignore storage errors
  }
}

/**
 * Reset the set structure intro completion status.
 */
export function resetSetIntroCompletion(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
