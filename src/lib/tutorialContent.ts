/**
 * Tutorial Content - Educational guides for young collectors
 * Provides kid-friendly interactive content for card organization, binder setup, and card care.
 *
 * This module contains structured tutorial data that can be used throughout the app
 * for educational features like the "Learn to Collect" tutorials.
 *
 * Supports multiple TCGs: Pokemon, Yu-Gi-Oh!, One Piece, and Disney Lorcana.
 */

import type { GameId } from './gameSelector';

// ============================================================================
// TYPES
// ============================================================================

export interface TutorialStep {
  /** Unique step identifier */
  id: string;
  /** Step title */
  title: string;
  /** Detailed description of this step */
  description: string;
  /** Short summary for quick reference */
  summary: string;
  /** Kid-friendly tip for this step */
  tip: string;
  /** Image or illustration key (for future use) */
  illustrationKey?: string;
}

export interface TutorialGuide {
  /** Unique guide identifier */
  id: string;
  /** Guide title */
  title: string;
  /** Short description for cards/lists */
  shortDescription: string;
  /** Full description for the guide intro */
  fullDescription: string;
  /** The category of this guide */
  category: 'organization' | 'storage' | 'care' | 'basics';
  /** Difficulty level for kids */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Estimated time to complete (e.g., "5 min") */
  estimatedTime: string;
  /** The steps in this guide */
  steps: TutorialStep[];
  /** Tips for the entire guide */
  tips: string[];
  /** Fun facts related to this topic */
  funFacts: string[];
  /** Badge ID earned upon completion (if any) */
  completionBadgeId?: string;
  /** Gradient colors for styling */
  gradientFrom: string;
  gradientTo: string;
  /** Icon color class */
  iconColorClass: string;
}

export interface TutorialCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
  guides: string[]; // guide IDs
}

// ============================================================================
// TUTORIAL GUIDES CONTENT
// ============================================================================

/**
 * Comprehensive tutorial guides for young collectors.
 */
export const TUTORIAL_GUIDES: readonly TutorialGuide[] = [
  // ---- CARD ORGANIZATION ----
  {
    id: 'organizing-by-set',
    title: 'Organizing by Set',
    shortDescription: 'Learn to sort your cards by their Pokemon set',
    fullDescription:
      "Every Pokemon card belongs to a set - like Scarlet & Violet or Sword & Shield. Organizing by set makes it easy to track your collection and see which cards you're missing!",
    category: 'organization',
    difficulty: 'beginner',
    estimatedTime: '5 min',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-500',
    iconColorClass: 'text-blue-500',
    steps: [
      {
        id: 'step-1',
        title: 'Find the Set Symbol',
        description:
          "Look at the bottom of your card. You'll see a small symbol - this is the set symbol! It tells you which set the card belongs to.",
        summary: 'Locate the set symbol on your card',
        tip: 'The set symbol is usually near the card number, like "151/165".',
      },
      {
        id: 'step-2',
        title: 'Group Cards Together',
        description:
          'Put all cards with the same set symbol in one pile. This creates groups of cards from the same set.',
        summary: 'Create piles for each set',
        tip: 'Use small containers or rubber bands to keep set piles separate.',
      },
      {
        id: 'step-3',
        title: 'Sort by Card Number',
        description:
          'Within each set, arrange cards from lowest to highest number. Card #1 goes first, then #2, #3, and so on!',
        summary: 'Arrange cards numerically within each set',
        tip: 'This makes it super easy to spot missing cards in your collection!',
      },
      {
        id: 'step-4',
        title: 'Store Your Sets',
        description:
          "Put each organized set into its own section of your binder, or in separate boxes. Label them so you know what's inside!",
        summary: 'Store each set separately with labels',
        tip: 'You can use colored tabs or dividers to mark where each set starts.',
      },
    ],
    tips: [
      "Start with your newest cards - they're usually easiest to identify!",
      'Keep a "To Sort" box for new cards until you have time to organize them.',
      'The set symbol on your card matches the logo on the booster pack it came from.',
    ],
    funFacts: [
      'The first Pokemon TCG set, Base Set, was released in 1999!',
      'Some special sets have over 200 cards to collect.',
      'Secret Rare cards have numbers higher than the set size, like "205/198".',
    ],
    completionBadgeId: 'organization-basics',
  },
  {
    id: 'organizing-by-type',
    title: 'Organizing by Type',
    shortDescription: 'Sort cards by Pokemon type like Fire, Water, or Electric',
    fullDescription:
      'Pokemon have different types, shown by their energy symbol. Organizing by type is a fun way to see all your Fire Pokemon together, or compare your Water collection!',
    category: 'organization',
    difficulty: 'beginner',
    estimatedTime: '5 min',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-red-500',
    iconColorClass: 'text-orange-500',
    steps: [
      {
        id: 'step-1',
        title: 'Identify the Type',
        description:
          "Look at the top right of your Pokemon card. You'll see an energy symbol - this shows the Pokemon's type! Fire types have a flame, Water types have a droplet.",
        summary: 'Find the energy type symbol',
        tip: 'Trainer and Energy cards have their own categories!',
      },
      {
        id: 'step-2',
        title: 'Create Type Piles',
        description:
          'Make separate piles for each type: Fire, Water, Grass, Electric, Psychic, Fighting, Dark, Steel, Dragon, Fairy, Colorless, and Trainer cards.',
        summary: 'Sort cards into type groups',
        tip: 'Colorless Pokemon can be any type in battle!',
      },
      {
        id: 'step-3',
        title: 'Arrange Within Types',
        description:
          'Inside each type pile, you can sort alphabetically by Pokemon name, or by evolution family (like all Charmander, Charmeleon, Charizard together).',
        summary: 'Organize cards within each type',
        tip: 'Keeping evolution lines together makes building decks easier!',
      },
    ],
    tips: [
      'Dragon-type Pokemon often need two different energy types to attack.',
      'Some Pokemon have changed types over the years as new sets come out.',
      'Dual-type cards show the main type - sort by that one!',
    ],
    funFacts: [
      'There are 11 different Pokemon types in the card game!',
      'Fairy-type was added in 2013 and removed in 2021, making those cards special.',
      'Charizard has been printed as both Fire-type and Dragon-type!',
    ],
  },

  // ---- BINDER SETUP ----
  {
    id: 'binder-setup-basics',
    title: 'Setting Up Your Binder',
    shortDescription: 'Create the perfect home for your card collection',
    fullDescription:
      'A binder is one of the best ways to store and display your cards! Learn how to set up your binder so your cards stay safe and look amazing.',
    category: 'storage',
    difficulty: 'beginner',
    estimatedTime: '10 min',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-violet-500',
    iconColorClass: 'text-purple-500',
    steps: [
      {
        id: 'step-1',
        title: 'Choose the Right Binder',
        description:
          'Get a binder with D-ring or O-ring design. D-rings are better because pages turn easier. Make sure it fits 9-pocket pages!',
        summary: 'Select a quality card binder',
        tip: 'Look for binders that say "Trading Card" or "Pokemon" on them.',
      },
      {
        id: 'step-2',
        title: 'Get Binder Pages',
        description:
          "Buy 9-pocket pages made for trading cards. Each page holds 18 cards (9 on each side). Make sure they're side-loading to keep cards secure!",
        summary: 'Add 9-pocket trading card pages',
        tip: 'Side-loading pages prevent cards from falling out when you flip pages.',
      },
      {
        id: 'step-3',
        title: 'Plan Your Layout',
        description:
          'Decide how you want to organize your binder. You could do one set per section, or group by favorite Pokemon, or by rarity!',
        summary: 'Decide on your organization system',
        tip: "Leave some empty pages at the end for new cards you'll get!",
      },
      {
        id: 'step-4',
        title: 'Add Dividers',
        description:
          'Use tab dividers or cardstock to separate sections in your binder. Label each section so you can find cards quickly!',
        summary: 'Create labeled sections',
        tip: 'You can make custom dividers with your favorite Pokemon on them!',
      },
      {
        id: 'step-5',
        title: 'Insert Your Cards',
        description:
          'Gently slide each card into a pocket. The card should fit snugly but not be bent. Put rare cards in penny sleeves first for extra protection!',
        summary: 'Carefully place cards in pockets',
        tip: 'Wash your hands before handling cards to keep them clean!',
      },
    ],
    tips: [
      "Don't overfill your binder - the rings should close easily.",
      'Store your binder standing up, not flat, to prevent page warping.',
      'Keep your binder away from direct sunlight to protect card colors.',
    ],
    funFacts: [
      'Professional collectors often have dozens of binders!',
      "Some rare cards are worth more than the binder they're stored in.",
      'The first Pokemon binders came out the same year as the original cards in 1999.',
    ],
    completionBadgeId: 'binder-master',
  },

  // ---- CARD CARE ----
  {
    id: 'card-handling',
    title: 'Handling Cards Safely',
    shortDescription: 'Learn how to touch and move cards without damage',
    fullDescription:
      'Your Pokemon cards can last forever if you handle them carefully! Learn the right way to pick up, hold, and move your cards.',
    category: 'care',
    difficulty: 'beginner',
    estimatedTime: '3 min',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-green-500',
    iconColorClass: 'text-emerald-500',
    steps: [
      {
        id: 'step-1',
        title: 'Clean Hands First',
        description:
          'Always wash and dry your hands before touching your cards. Oils from your skin can damage cards over time and make them look dirty.',
        summary: 'Wash and dry your hands',
        tip: 'Avoid touching the card face - hold cards by the edges instead!',
      },
      {
        id: 'step-2',
        title: 'Hold by the Edges',
        description:
          'Pick up cards by their edges, not the middle. This keeps fingerprints off the beautiful artwork and prevents bending.',
        summary: 'Grip cards on the sides',
        tip: "Imagine the card is a delicate cookie you don't want to break!",
      },
      {
        id: 'step-3',
        title: 'Use a Clean Surface',
        description:
          'When looking at or sorting cards, use a clean, flat surface. A playmat or clean table works great!',
        summary: 'Work on clean, flat surfaces',
        tip: 'A felt or cloth playmat is perfect - it protects cards and looks cool!',
      },
      {
        id: 'step-4',
        title: 'No Food or Drinks',
        description:
          'Keep snacks and drinks away from your cards. One spill can ruin your whole collection! Have a snack break, then come back to your cards.',
        summary: 'Keep food and drinks away',
        tip: "Chocolate and sticky fingers are a card's worst enemy!",
      },
    ],
    tips: [
      'If your hands are sweaty, wait until they dry before handling cards.',
      "Never bend or flex a card to see if it's real - this can damage it!",
      'When showing friends your cards, let them look while you hold the card.',
    ],
    funFacts: [
      'A mint condition Base Set Charizard sold for over $400,000!',
      'Cards are graded on condition from 1-10, with 10 being perfect.',
      "Even small scratches can lower a card's grade and value.",
    ],
    completionBadgeId: 'card-care-basics',
  },
  {
    id: 'card-storage',
    title: 'Storing Cards Properly',
    shortDescription: 'Keep your cards safe when not in use',
    fullDescription:
      "Even when you're not looking at your cards, they need protection! Learn about sleeves, toploaders, and storage boxes to keep your collection safe.",
    category: 'care',
    difficulty: 'intermediate',
    estimatedTime: '7 min',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-yellow-500',
    iconColorClass: 'text-amber-500',
    steps: [
      {
        id: 'step-1',
        title: 'Penny Sleeves',
        description:
          "These thin plastic sleeves are your first line of defense. They're cheap and protect cards from scratches and dust. Put valuable cards in penny sleeves!",
        summary: 'Use penny sleeves for basic protection',
        tip: "Penny sleeves cost about 1 cent each - that's why they're called penny sleeves!",
      },
      {
        id: 'step-2',
        title: 'Card Sleeves',
        description:
          'Thicker sleeves (like Dragon Shield or Ultra Pro) are perfect for cards you use in decks. They shuffle better and provide more protection.',
        summary: 'Use deck sleeves for cards you play with',
        tip: 'Match your sleeve color to your favorite Pokemon type!',
      },
      {
        id: 'step-3',
        title: 'Toploaders',
        description:
          'Hard plastic toploaders are like armor for your best cards! Put the card in a penny sleeve first, then into the toploader for maximum protection.',
        summary: 'Double-protect valuable cards with toploaders',
        tip: 'Toploaders are perfect for ultra rares and secret rares.',
      },
      {
        id: 'step-4',
        title: 'Storage Boxes',
        description:
          'Keep bulk cards (commons and uncommons) in cardboard storage boxes. You can fit hundreds of cards in one box!',
        summary: 'Use storage boxes for bulk cards',
        tip: 'Add dividers to your storage box to separate different sets.',
      },
      {
        id: 'step-5',
        title: 'Climate Control',
        description:
          'Store cards in a cool, dry place away from sunlight. Heat and humidity can warp cards, and sun can fade the colors!',
        summary: 'Keep cards in a cool, dry location',
        tip: 'Your closet is usually a great place - dark and temperature-controlled!',
      },
    ],
    tips: [
      'Never store cards in an attic or garage - temperature changes damage them.',
      'If you notice cards getting sticky, the humidity might be too high.',
      'For super valuable cards, consider getting them professionally graded.',
    ],
    funFacts: [
      'PSA, BGS, and CGC are the most popular card grading companies.',
      'A PSA 10 (gem mint) card can be worth 10x more than an ungraded one!',
      'Some collectors use temperature-controlled safes for their rarest cards.',
    ],
  },
  {
    id: 'card-condition',
    title: 'Understanding Card Condition',
    shortDescription: 'Learn what makes a card Near Mint vs Played',
    fullDescription:
      'Card condition matters! Learn the differences between Near Mint, Lightly Played, and other grades so you know what your cards are worth.',
    category: 'care',
    difficulty: 'intermediate',
    estimatedTime: '5 min',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-pink-500',
    iconColorClass: 'text-rose-500',
    steps: [
      {
        id: 'step-1',
        title: 'Near Mint (NM)',
        description:
          'A Near Mint card looks almost perfect! It might have very tiny imperfections only visible up close. This is the best condition for played cards.',
        summary: 'Nearly perfect condition',
        tip: 'Cards straight from a pack are usually Near Mint.',
      },
      {
        id: 'step-2',
        title: 'Lightly Played (LP)',
        description:
          'Lightly Played cards have minor wear - small scratches, light whitening on edges, or slight corner bends. Still very collectible!',
        summary: 'Minor visible wear',
        tip: 'Most cards from used decks become Lightly Played over time.',
      },
      {
        id: 'step-3',
        title: 'Moderately Played (MP)',
        description:
          'Moderately Played cards have noticeable wear - creases, edge wear, or scratches you can see easily. Good for playing, less for collecting.',
        summary: 'Clear signs of use',
        tip: 'These cards are often cheaper to buy if you just want to play!',
      },
      {
        id: 'step-4',
        title: 'Heavily Played (HP)',
        description:
          'Heavily Played cards have significant damage - large creases, missing pieces of edge, water damage, or heavy scratches. Still legal to play!',
        summary: 'Major damage visible',
        tip: 'HP cards can still be fun to have in a casual collection.',
      },
    ],
    tips: [
      'Check card edges for "whitening" - this is a common sign of wear.',
      'Hold cards at an angle under light to spot scratches on the surface.',
      'Centering matters too - is the border even on all sides?',
    ],
    funFacts: [
      'Professional graders look at centering, corners, edges, and surface.',
      "A tiny print line from the factory can lower a card's grade.",
      'Some "damaged" cards become famous - like error cards with misprints!',
    ],
  },

  // ---- BASICS ----
  {
    id: 'first-collection',
    title: 'Starting Your Collection',
    shortDescription: 'Tips for beginning collectors',
    fullDescription:
      "Just starting out? Awesome! Here's everything you need to know to begin your Pokemon card collecting journey.",
    category: 'basics',
    difficulty: 'beginner',
    estimatedTime: '5 min',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-purple-500',
    iconColorClass: 'text-indigo-500',
    steps: [
      {
        id: 'step-1',
        title: 'Pick Your Focus',
        description:
          'There are thousands of Pokemon cards! Start by collecting what YOU love - your favorite Pokemon, a specific set, or the coolest artwork.',
        summary: 'Choose what you want to collect',
        tip: "You don't have to collect everything - focus on what makes you happy!",
      },
      {
        id: 'step-2',
        title: 'Get Basic Supplies',
        description:
          "You'll need: a binder with 9-pocket pages, some penny sleeves for rare cards, and a storage box for extras. That's it to start!",
        summary: 'Gather essential supplies',
        tip: 'You can find all these supplies at most stores that sell cards.',
      },
      {
        id: 'step-3',
        title: 'Open Packs Carefully',
        description:
          'When opening new packs, be gentle! Tear along the top edge, not through the middle. Take cards out slowly to avoid bending.',
        summary: 'Open packs without damaging cards',
        tip: 'Save your pack wrappers if they have cool art!',
      },
      {
        id: 'step-4',
        title: 'Track Your Cards',
        description:
          'Use an app like CardDex to track what you have! It helps you see your progress and know which cards you still need.',
        summary: 'Use an app to track your collection',
        tip: 'Marking cards as "owned" right away prevents buying duplicates!',
      },
    ],
    tips: [
      "Don't spend all your money at once - collecting is a marathon, not a sprint!",
      'Trading with friends is a great way to grow your collection.',
      'Every collector started with just one card - your collection will grow!',
    ],
    funFacts: [
      'Over 30 billion Pokemon cards have been produced worldwide!',
      'The most expensive Pokemon card ever sold went for over $5 million.',
      'New Pokemon sets come out about 4 times per year.',
    ],
    completionBadgeId: 'first-steps',
  },
] as const;

// ============================================================================
// TUTORIAL CATEGORIES
// ============================================================================

export const TUTORIAL_CATEGORIES: readonly TutorialCategory[] = [
  {
    id: 'basics',
    name: 'Getting Started',
    description: 'Essential knowledge for new collectors',
    iconName: 'RocketLaunchIcon',
    guides: ['first-collection'],
  },
  {
    id: 'organization',
    name: 'Card Organization',
    description: 'Learn different ways to sort and organize your cards',
    iconName: 'RectangleStackIcon',
    guides: ['organizing-by-set', 'organizing-by-type'],
  },
  {
    id: 'storage',
    name: 'Binder & Storage',
    description: 'Set up the perfect home for your collection',
    iconName: 'ArchiveBoxIcon',
    guides: ['binder-setup-basics'],
  },
  {
    id: 'care',
    name: 'Card Care',
    description: 'Keep your cards safe and in great condition',
    iconName: 'ShieldCheckIcon',
    guides: ['card-handling', 'card-storage', 'card-condition'],
  },
] as const;

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get a tutorial guide by ID.
 */
export function getTutorialGuide(guideId: string): TutorialGuide | null {
  return TUTORIAL_GUIDES.find((g) => g.id === guideId) ?? null;
}

/**
 * Get all guides in a category.
 */
export function getGuidesByCategory(categoryId: string): TutorialGuide[] {
  const category = TUTORIAL_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return [];
  return category.guides
    .map((id) => getTutorialGuide(id))
    .filter((g): g is TutorialGuide => g !== null);
}

/**
 * Get a tutorial category by ID.
 */
export function getTutorialCategory(categoryId: string): TutorialCategory | null {
  return TUTORIAL_CATEGORIES.find((c) => c.id === categoryId) ?? null;
}

/**
 * Get all tutorial guides.
 */
export function getAllTutorialGuides(): readonly TutorialGuide[] {
  return TUTORIAL_GUIDES;
}

/**
 * Get all tutorial categories.
 */
export function getAllTutorialCategories(): readonly TutorialCategory[] {
  return TUTORIAL_CATEGORIES;
}

/**
 * Get guides by difficulty.
 */
export function getGuidesByDifficulty(difficulty: TutorialGuide['difficulty']): TutorialGuide[] {
  return TUTORIAL_GUIDES.filter((g) => g.difficulty === difficulty);
}

/**
 * Get the category for a guide.
 */
export function getCategoryForGuide(guideId: string): TutorialCategory | null {
  return TUTORIAL_CATEGORIES.find((c) => c.guides.includes(guideId)) ?? null;
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get a difficulty label with styling info.
 */
export function getDifficultyInfo(difficulty: TutorialGuide['difficulty']): {
  label: string;
  colorClass: string;
  bgClass: string;
} {
  switch (difficulty) {
    case 'beginner':
      return {
        label: 'Beginner',
        colorClass: 'text-emerald-600',
        bgClass: 'bg-emerald-100',
      };
    case 'intermediate':
      return {
        label: 'Intermediate',
        colorClass: 'text-amber-600',
        bgClass: 'bg-amber-100',
      };
    case 'advanced':
      return {
        label: 'Advanced',
        colorClass: 'text-rose-600',
        bgClass: 'bg-rose-100',
      };
  }
}

/**
 * Get total estimated time for a list of guides.
 */
export function getTotalEstimatedTime(guideIds: string[]): string {
  let totalMinutes = 0;
  for (const id of guideIds) {
    const guide = getTutorialGuide(id);
    if (guide) {
      const minutes = parseInt(guide.estimatedTime, 10);
      if (!isNaN(minutes)) {
        totalMinutes += minutes;
      }
    }
  }
  return `${totalMinutes} min`;
}

// ============================================================================
// EXTENDED TYPES FOR PROGRESS TRACKING
// ============================================================================

/** Progress tracking for a single guide */
export interface GuideProgress {
  guideId: string;
  completedSteps: string[];
  isComplete: boolean;
  startedAt?: number;
  completedAt?: number;
  lastStepViewed: string;
}

/** Overall tutorial progress */
export interface TutorialProgress {
  completedGuideIds: string[];
  guideProgress: Record<string, GuideProgress>;
  totalGuidesComplete: number;
  totalGuidesAvailable: number;
  percentComplete: number;
  totalTimeSpentMinutes: number;
  badgesEarned: string[];
}

/** Guide with enriched progress info */
export interface GuideWithProgress extends TutorialGuide {
  progress: {
    isComplete: boolean;
    stepsComplete: number;
    totalSteps: number;
    percentComplete: number;
    isStarted: boolean;
    lastStepViewed: string;
  };
}

/** Category progress summary */
export interface CategoryProgressSummary {
  categoryId: string;
  guidesComplete: number;
  guidesTotal: number;
  percentComplete: number;
  isComplete: boolean;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/** All valid category IDs */
export const VALID_CATEGORY_IDS = ['basics', 'organization', 'storage', 'care'] as const;
export type ValidCategoryId = (typeof VALID_CATEGORY_IDS)[number];

/**
 * Check if a string is a valid category ID.
 */
export function isValidCategoryId(id: string): id is ValidCategoryId {
  return VALID_CATEGORY_IDS.includes(id as ValidCategoryId);
}

/**
 * Check if a guide ID format is valid (lowercase with hyphens).
 */
export function isValidGuideIdFormat(guideId: string): boolean {
  if (!guideId || typeof guideId !== 'string') {
    return false;
  }
  return /^[a-z][a-z0-9-]*[a-z0-9]$/.test(guideId);
}

/**
 * Validate a guide object has required fields.
 */
export function isValidGuide(guide: unknown): guide is TutorialGuide {
  if (!guide || typeof guide !== 'object') {
    return false;
  }

  const g = guide as Record<string, unknown>;

  return (
    typeof g.id === 'string' &&
    typeof g.title === 'string' &&
    typeof g.shortDescription === 'string' &&
    typeof g.fullDescription === 'string' &&
    typeof g.category === 'string' &&
    typeof g.difficulty === 'string' &&
    typeof g.estimatedTime === 'string' &&
    Array.isArray(g.steps) &&
    Array.isArray(g.tips) &&
    Array.isArray(g.funFacts)
  );
}

/**
 * Validate a step object has required fields.
 */
export function isValidStep(step: unknown): step is TutorialStep {
  if (!step || typeof step !== 'object') {
    return false;
  }

  const s = step as Record<string, unknown>;

  return (
    typeof s.id === 'string' &&
    typeof s.title === 'string' &&
    typeof s.description === 'string' &&
    typeof s.summary === 'string' &&
    typeof s.tip === 'string'
  );
}

/**
 * Validate step ID exists within a guide.
 */
export function isValidStepId(guide: TutorialGuide, stepId: string): boolean {
  return guide.steps.some((s) => s.id === stepId);
}

// ============================================================================
// ADDITIONAL LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get a specific step from a guide.
 */
export function getStep(guide: TutorialGuide, stepId: string): TutorialStep | null {
  return guide.steps.find((s) => s.id === stepId) ?? null;
}

/**
 * Get the step index (1-based) for display.
 */
export function getStepIndex(guide: TutorialGuide, stepId: string): number {
  const index = guide.steps.findIndex((s) => s.id === stepId);
  return index === -1 ? 0 : index + 1;
}

/**
 * Get guides that have a completion badge.
 */
export function getGuidesWithBadges(): TutorialGuide[] {
  return TUTORIAL_GUIDES.filter((g) => g.completionBadgeId !== undefined);
}

/**
 * Get the badge ID for a guide, if it has one.
 */
export function getGuideBadgeId(guide: TutorialGuide): string | null {
  return guide.completionBadgeId ?? null;
}

/**
 * Check if a guide ID exists.
 */
export function guideExists(guideId: string): boolean {
  return TUTORIAL_GUIDES.some((g) => g.id === guideId);
}

/**
 * Check if a category ID exists.
 */
export function categoryExists(categoryId: string): boolean {
  return TUTORIAL_CATEGORIES.some((c) => c.id === categoryId);
}

// ============================================================================
// SORTING FUNCTIONS
// ============================================================================

/** Recommended category order for learning path */
export const CATEGORY_SORT_ORDER: Record<string, number> = {
  basics: 1,
  organization: 2,
  storage: 3,
  care: 4,
};

/**
 * Sort guides by category order (basics first, then organization, storage, care).
 */
export function sortGuidesByCategory(guides: readonly TutorialGuide[]): TutorialGuide[] {
  return [...guides].sort((a, b) => {
    const catSortA = CATEGORY_SORT_ORDER[a.category] ?? 999;
    const catSortB = CATEGORY_SORT_ORDER[b.category] ?? 999;
    return catSortA - catSortB;
  });
}

/**
 * Sort guides by estimated time (shortest first).
 */
export function sortGuidesByDuration(guides: readonly TutorialGuide[]): TutorialGuide[] {
  return [...guides].sort((a, b) => {
    const timeA = parseInt(a.estimatedTime, 10) || 0;
    const timeB = parseInt(b.estimatedTime, 10) || 0;
    return timeA - timeB;
  });
}

/**
 * Sort guides by step count (fewest first).
 */
export function sortGuidesByStepCount(guides: readonly TutorialGuide[]): TutorialGuide[] {
  return [...guides].sort((a, b) => a.steps.length - b.steps.length);
}

/**
 * Sort guides by difficulty (beginner first).
 */
export function sortGuidesByDifficulty(guides: readonly TutorialGuide[]): TutorialGuide[] {
  const difficultyOrder: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  };
  return [...guides].sort((a, b) => {
    return (difficultyOrder[a.difficulty] ?? 999) - (difficultyOrder[b.difficulty] ?? 999);
  });
}

/**
 * Sort categories by recommended order.
 */
export function sortCategories(categories: readonly TutorialCategory[]): TutorialCategory[] {
  return [...categories].sort((a, b) => {
    return (CATEGORY_SORT_ORDER[a.id] ?? 999) - (CATEGORY_SORT_ORDER[b.id] ?? 999);
  });
}

// ============================================================================
// FILTERING FUNCTIONS
// ============================================================================

/**
 * Filter guides by estimated time (max minutes).
 */
export function filterByMaxDuration(
  guides: readonly TutorialGuide[],
  maxMinutes: number
): TutorialGuide[] {
  return guides.filter((g) => {
    const minutes = parseInt(g.estimatedTime, 10);
    return !isNaN(minutes) && minutes <= maxMinutes;
  });
}

/**
 * Filter to incomplete guides only.
 */
export function filterIncompleteGuides(
  guides: readonly TutorialGuide[],
  completedGuideIds: readonly string[]
): TutorialGuide[] {
  const completedSet = new Set(completedGuideIds);
  return guides.filter((g) => !completedSet.has(g.id));
}

/**
 * Filter to completed guides only.
 */
export function filterCompletedGuides(
  guides: readonly TutorialGuide[],
  completedGuideIds: readonly string[]
): TutorialGuide[] {
  const completedSet = new Set(completedGuideIds);
  return guides.filter((g) => completedSet.has(g.id));
}

// ============================================================================
// PROGRESS TRACKING FUNCTIONS
// ============================================================================

/**
 * Calculate overall tutorial progress from completed guide IDs.
 */
export function calculateTutorialProgress(
  completedGuideIds: readonly string[],
  guideProgress?: Record<string, GuideProgress>
): TutorialProgress {
  const completedSet = new Set(completedGuideIds);
  const completedGuides = TUTORIAL_GUIDES.filter((g) => completedSet.has(g.id));

  let totalTimeSpentMinutes = 0;
  for (const guide of completedGuides) {
    const minutes = parseInt(guide.estimatedTime, 10);
    if (!isNaN(minutes)) {
      totalTimeSpentMinutes += minutes;
    }
  }

  const badgesEarned = completedGuides
    .filter((g) => g.completionBadgeId !== undefined)
    .map((g) => g.completionBadgeId!);

  return {
    completedGuideIds: [...completedGuideIds],
    guideProgress: guideProgress ?? {},
    totalGuidesComplete: completedGuideIds.length,
    totalGuidesAvailable: TUTORIAL_GUIDES.length,
    percentComplete:
      TUTORIAL_GUIDES.length > 0
        ? Math.round((completedGuideIds.length / TUTORIAL_GUIDES.length) * 100)
        : 0,
    totalTimeSpentMinutes,
    badgesEarned,
  };
}

/**
 * Calculate progress for a specific guide.
 */
export function calculateGuideProgress(
  guide: TutorialGuide,
  completedSteps: readonly string[],
  startedAt?: number,
  completedAt?: number
): GuideProgress {
  const totalSteps = guide.steps.length;
  const validCompletedSteps = completedSteps.filter((s) => isValidStepId(guide, s));

  return {
    guideId: guide.id,
    completedSteps: [...validCompletedSteps],
    isComplete: validCompletedSteps.length >= totalSteps,
    startedAt,
    completedAt,
    lastStepViewed: validCompletedSteps[validCompletedSteps.length - 1] ?? '',
  };
}

/**
 * Calculate progress for a category.
 */
export function calculateCategoryProgress(
  categoryId: string,
  completedGuideIds: readonly string[]
): CategoryProgressSummary {
  const categoryGuides = getGuidesByCategory(categoryId);
  const completedSet = new Set(completedGuideIds);
  const guidesComplete = categoryGuides.filter((g) => completedSet.has(g.id)).length;
  const guidesTotal = categoryGuides.length;

  return {
    categoryId,
    guidesComplete,
    guidesTotal,
    percentComplete: guidesTotal > 0 ? Math.round((guidesComplete / guidesTotal) * 100) : 0,
    isComplete: guidesComplete >= guidesTotal && guidesTotal > 0,
  };
}

/**
 * Enrich guides with progress information.
 */
export function enrichGuidesWithProgress(
  guides: readonly TutorialGuide[],
  completedGuideIds: readonly string[],
  guideProgress?: Record<string, GuideProgress>
): GuideWithProgress[] {
  const completedSet = new Set(completedGuideIds);

  return guides.map((guide) => {
    const progress = guideProgress?.[guide.id];
    const isComplete = completedSet.has(guide.id);
    const stepsComplete = progress?.completedSteps.length ?? (isComplete ? guide.steps.length : 0);

    return {
      ...guide,
      progress: {
        isComplete,
        stepsComplete,
        totalSteps: guide.steps.length,
        percentComplete:
          guide.steps.length > 0 ? Math.round((stepsComplete / guide.steps.length) * 100) : 0,
        isStarted: stepsComplete > 0 || isComplete,
        lastStepViewed: progress?.lastStepViewed ?? '',
      },
    };
  });
}

/**
 * Get the next recommended guide to complete.
 */
export function getNextRecommendedGuide(
  completedGuideIds: readonly string[]
): TutorialGuide | null {
  const sortedGuides = sortGuidesByCategory(TUTORIAL_GUIDES);
  const completedSet = new Set(completedGuideIds);

  return sortedGuides.find((g) => !completedSet.has(g.id)) ?? null;
}

/**
 * Check if all guides in a category are complete.
 */
export function isCategoryComplete(
  categoryId: string,
  completedGuideIds: readonly string[]
): boolean {
  const categoryGuides = getGuidesByCategory(categoryId);
  if (categoryGuides.length === 0) {
    return false;
  }

  const completedSet = new Set(completedGuideIds);
  return categoryGuides.every((g) => completedSet.has(g.id));
}

/**
 * Check if all tutorials are complete.
 */
export function areAllTutorialsComplete(completedGuideIds: readonly string[]): boolean {
  if (TUTORIAL_GUIDES.length === 0) {
    return false;
  }

  const completedSet = new Set(completedGuideIds);
  return TUTORIAL_GUIDES.every((g) => completedSet.has(g.id));
}

// ============================================================================
// NAVIGATION FUNCTIONS
// ============================================================================

/**
 * Get navigation info for a step within a guide.
 */
export function getStepNavigation(
  guide: TutorialGuide,
  currentStepId: string
): {
  totalSteps: number;
  currentStep: number;
  hasPrevious: boolean;
  hasNext: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  nextStepId: string | null;
  previousStepId: string | null;
} {
  const totalSteps = guide.steps.length;
  const currentIndex = guide.steps.findIndex((s) => s.id === currentStepId);

  if (currentIndex === -1) {
    return {
      totalSteps,
      currentStep: 0,
      hasPrevious: false,
      hasNext: false,
      isFirstStep: false,
      isLastStep: false,
      nextStepId: null,
      previousStepId: null,
    };
  }

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSteps - 1;

  return {
    totalSteps,
    currentStep: currentIndex + 1,
    hasPrevious: !isFirst,
    hasNext: !isLast,
    isFirstStep: isFirst,
    isLastStep: isLast,
    nextStepId: isLast ? null : guide.steps[currentIndex + 1].id,
    previousStepId: isFirst ? null : guide.steps[currentIndex - 1].id,
  };
}

/**
 * Get the next guide in the recommended order.
 */
export function getNextGuide(currentGuideId: string): TutorialGuide | null {
  const sortedGuides = sortGuidesByCategory(TUTORIAL_GUIDES);
  const currentIndex = sortedGuides.findIndex((g) => g.id === currentGuideId);

  if (currentIndex === -1 || currentIndex >= sortedGuides.length - 1) {
    return null;
  }

  return sortedGuides[currentIndex + 1];
}

/**
 * Get the previous guide in the recommended order.
 */
export function getPreviousGuide(currentGuideId: string): TutorialGuide | null {
  const sortedGuides = sortGuidesByCategory(TUTORIAL_GUIDES);
  const currentIndex = sortedGuides.findIndex((g) => g.id === currentGuideId);

  if (currentIndex <= 0) {
    return null;
  }

  return sortedGuides[currentIndex - 1];
}

// ============================================================================
// ADDITIONAL DISPLAY HELPERS
// ============================================================================

/**
 * Format estimated time for display (parse and format).
 */
export function formatEstimatedTime(estimatedTime: string): string {
  const minutes = parseInt(estimatedTime, 10);
  if (isNaN(minutes) || minutes < 1) {
    return 'Less than 1 min';
  }
  if (minutes === 1) {
    return '1 min';
  }
  return `${minutes} mins`;
}

/**
 * Format progress percentage for display.
 */
export function formatProgressPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

/**
 * Get a progress message based on completion status.
 */
export function getProgressMessage(
  completedCount: number,
  totalCount: number,
  isAllComplete: boolean
): string {
  if (isAllComplete) {
    return 'Congratulations! You completed all tutorials!';
  }
  if (completedCount === 0) {
    return 'Start your collecting journey!';
  }
  const remaining = totalCount - completedCount;
  if (remaining === 1) {
    return 'Just 1 guide left - you can do it!';
  }
  return `${remaining} guides remaining`;
}

/**
 * Get step indicator text (e.g., "Step 2 of 4").
 */
export function getStepIndicator(currentStep: number, totalSteps: number): string {
  return `Step ${currentStep} of ${totalSteps}`;
}

/**
 * Get a category display label with icon.
 */
export function getCategoryDisplayLabel(category: TutorialCategory): string {
  return category.name;
}

/**
 * Get a guide display label with gradient styling info.
 */
export function getGuideDisplayLabel(guide: TutorialGuide): string {
  return guide.title;
}

/**
 * Get completion badge display text.
 */
export function getBadgeEarnedMessage(badgeId: string): string {
  return `You earned the ${badgeId.replace(/-/g, ' ')} badge!`;
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

/**
 * Search guides by keyword (searches title, description, and step content).
 */
export function searchGuides(searchTerm: string): TutorialGuide[] {
  const term = searchTerm.toLowerCase().trim();
  if (!term) {
    return [];
  }

  return TUTORIAL_GUIDES.filter((guide) => {
    // Search title and descriptions
    if (
      guide.title.toLowerCase().includes(term) ||
      guide.shortDescription.toLowerCase().includes(term) ||
      guide.fullDescription.toLowerCase().includes(term)
    ) {
      return true;
    }

    // Search step content
    for (const step of guide.steps) {
      if (
        step.title.toLowerCase().includes(term) ||
        step.description.toLowerCase().includes(term) ||
        step.summary.toLowerCase().includes(term) ||
        step.tip.toLowerCase().includes(term)
      ) {
        return true;
      }
    }

    // Search tips and fun facts
    for (const tip of guide.tips) {
      if (tip.toLowerCase().includes(term)) {
        return true;
      }
    }
    for (const fact of guide.funFacts) {
      if (fact.toLowerCase().includes(term)) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Count total steps across all guides.
 */
export function countTotalSteps(): number {
  return TUTORIAL_GUIDES.reduce((sum, g) => sum + g.steps.length, 0);
}

/**
 * Calculate total estimated time across all guides (in minutes).
 */
export function calculateTotalTimeMinutes(): number {
  return TUTORIAL_GUIDES.reduce((sum, g) => {
    const minutes = parseInt(g.estimatedTime, 10);
    return sum + (isNaN(minutes) ? 0 : minutes);
  }, 0);
}

// ============================================================================
// CATEGORY HELPERS
// ============================================================================

/**
 * Get progress summary for all categories.
 */
export function getAllCategoryProgress(
  completedGuideIds: readonly string[]
): CategoryProgressSummary[] {
  return TUTORIAL_CATEGORIES.map((category) =>
    calculateCategoryProgress(category.id, completedGuideIds)
  );
}

/**
 * Get guide count per category.
 */
export function getGuideCountByCategory(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const category of TUTORIAL_CATEGORIES) {
    counts[category.id] = category.guides.length;
  }
  return counts;
}

/**
 * Get all guides grouped by category for overview display.
 */
export function getGuidesGroupedByCategory(): Array<{
  category: TutorialCategory;
  guides: TutorialGuide[];
  totalMinutes: number;
}> {
  return sortCategories(TUTORIAL_CATEGORIES).map((category) => {
    const guides = getGuidesByCategory(category.id);
    let totalMinutes = 0;
    for (const guide of guides) {
      const minutes = parseInt(guide.estimatedTime, 10);
      if (!isNaN(minutes)) {
        totalMinutes += minutes;
      }
    }
    return {
      category,
      guides,
      totalMinutes,
    };
  });
}

// ============================================================================
// GAME-SPECIFIC CARD TYPE CONTENT
// ============================================================================

/**
 * Information about a card type within a game.
 */
export interface CardTypeInfo {
  /** Card type identifier */
  id: string;
  /** Display name */
  name: string;
  /** Symbol or icon representation */
  symbol: string;
  /** Kid-friendly description */
  description: string;
  /** Examples of this card type */
  examples: string[];
  /** Fun fact about this card type */
  funFact: string;
  /** Color class for styling */
  colorClass: string;
}

/**
 * Set symbol/code information for a game.
 */
export interface SetSymbolInfo {
  /** Description of where to find set symbols */
  location: string;
  /** How set symbols work in this game */
  explanation: string;
  /** Examples of set codes */
  examples: string[];
  /** Tip for identifying sets */
  tip: string;
}

/**
 * Game-specific tutorial content.
 */
export interface GameTutorialContent {
  /** Game identifier */
  gameId: GameId;
  /** Display name */
  gameName: string;
  /** Card types in this game */
  cardTypes: CardTypeInfo[];
  /** Set symbol information */
  setSymbols: SetSymbolInfo;
  /** Fun facts about the game */
  funFacts: string[];
  /** Card number format explanation */
  cardNumberFormat: string;
  /** Quiz questions for this game */
  quizQuestions: QuizQuestion[];
}

/**
 * Quiz question for mini-games.
 */
export interface QuizQuestion {
  /** Question ID */
  id: string;
  /** The question text */
  question: string;
  /** Available answer options */
  options: string[];
  /** Index of the correct answer */
  correctIndex: number;
  /** Explanation for the correct answer */
  explanation: string;
  /** Difficulty level */
  difficulty: 'easy' | 'medium' | 'hard';
}

// ============================================================================
// POKEMON TUTORIAL CONTENT
// ============================================================================

export const POKEMON_TUTORIAL_CONTENT: GameTutorialContent = {
  gameId: 'pokemon',
  gameName: 'Pokémon TCG',
  cardTypes: [
    {
      id: 'pokemon',
      name: 'Pokémon Cards',
      symbol: '🐾',
      description:
        'The stars of the game! Pokémon cards show your creatures that battle and use attacks.',
      examples: ['Pikachu', 'Charizard', 'Mewtwo', 'Eevee'],
      funFact: 'There are over 900 different Pokémon, and most have multiple card versions!',
      colorClass: 'text-yellow-500',
    },
    {
      id: 'trainer',
      name: 'Trainer Cards',
      symbol: '🎒',
      description:
        'Trainer cards help you in battle! They include Items, Supporters, and Stadiums.',
      examples: ['Poké Ball', 'Professor', 'Rare Candy', 'Switch'],
      funFact: 'Supporter cards are based on characters from the Pokémon games and anime!',
      colorClass: 'text-blue-500',
    },
    {
      id: 'energy',
      name: 'Energy Cards',
      symbol: '⚡',
      description:
        "Energy cards power your Pokémon's attacks! Match the energy type to your Pokémon.",
      examples: ['Fire Energy', 'Water Energy', 'Lightning Energy', 'Psychic Energy'],
      funFact: 'There are 11 different basic Energy types in the Pokémon TCG!',
      colorClass: 'text-amber-500',
    },
  ],
  setSymbols: {
    location: 'Look at the bottom right of your card, near the card number.',
    explanation:
      "Every card has a set symbol that tells you which expansion it's from. The symbol matches the booster pack it came in!",
    examples: ['SVI (Scarlet & Violet)', 'PAF (Paldean Fates)', 'CRZ (Crown Zenith)'],
    tip: 'The set symbol usually appears next to the card number, like "025/198 SVI"',
  },
  funFacts: [
    'The Pokémon TCG launched in Japan in 1996 and came to the US in 1999!',
    'The first holographic Charizard from Base Set is one of the most valuable cards ever!',
    'Over 52 billion Pokémon cards have been produced worldwide!',
    'Some Secret Rare cards are numbered higher than the set size, like "215/198"!',
    'The Pokémon TCG is played in over 76 countries and 13 languages!',
  ],
  cardNumberFormat:
    'Pokémon cards show their number as "001/198" where the first number is the card and the second is the set size. Secret Rares go beyond the set size!',
  quizQuestions: [
    {
      id: 'pkmn-q1',
      question: 'What symbol shows a card is Common rarity?',
      options: ['Star ★', 'Diamond ◆', 'Circle ●', 'Square ■'],
      correctIndex: 2,
      explanation: 'Common cards have a circle ● symbol at the bottom of the card!',
      difficulty: 'easy',
    },
    {
      id: 'pkmn-q2',
      question: 'Which type of card powers your Pokémon attacks?',
      options: ['Trainer cards', 'Energy cards', 'Stadium cards', 'Item cards'],
      correctIndex: 1,
      explanation: 'Energy cards attach to Pokémon to power their attacks!',
      difficulty: 'easy',
    },
    {
      id: 'pkmn-q3',
      question: 'What does "151/165" on a card mean?',
      options: [
        'The card is worth $151',
        'Card #151 in a 165-card set',
        'The Pokémon has 151 HP',
        'Made in 1965',
      ],
      correctIndex: 1,
      explanation: 'This shows it\'s card number 151 in a set of 165 cards!',
      difficulty: 'medium',
    },
    {
      id: 'pkmn-q4',
      question: 'What makes a card "Secret Rare"?',
      options: [
        "It's hidden in the pack",
        'It has a secret code',
        "It's numbered higher than the set size",
        'Only found in secret locations',
      ],
      correctIndex: 2,
      explanation:
        'Secret Rares are numbered beyond the set size, like 201/198, making them extra special!',
      difficulty: 'medium',
    },
    {
      id: 'pkmn-q5',
      question: 'How many basic Energy types exist in the Pokémon TCG?',
      options: ['5', '8', '11', '18'],
      correctIndex: 2,
      explanation:
        'There are 11 basic Energy types: Fire, Water, Grass, Lightning, Psychic, Fighting, Darkness, Metal, Fairy, Dragon, and Colorless!',
      difficulty: 'hard',
    },
  ],
};

// ============================================================================
// YU-GI-OH! TUTORIAL CONTENT
// ============================================================================

export const YUGIOH_TUTORIAL_CONTENT: GameTutorialContent = {
  gameId: 'yugioh',
  gameName: 'Yu-Gi-Oh!',
  cardTypes: [
    {
      id: 'monster',
      name: 'Monster Cards',
      symbol: '👹',
      description:
        'Your main fighters! Monster cards have ATK and DEF stats and battle each other. They come in different colors based on their type.',
      examples: ['Blue-Eyes White Dragon', 'Dark Magician', 'Exodia', 'Red-Eyes B. Dragon'],
      funFact:
        'Normal Monsters (yellow cards) have flavor text instead of effects - they tell the monster\'s story!',
      colorClass: 'text-amber-600',
    },
    {
      id: 'spell',
      name: 'Spell Cards',
      symbol: '✨',
      description:
        'Green cards that create powerful magical effects! Some are quick-play (lightning bolt icon) and can be used during your opponent\'s turn.',
      examples: ['Pot of Greed', 'Monster Reborn', 'Dark Hole', 'Polymerization'],
      funFact:
        'Spell cards used to be called "Magic Cards" in early Yu-Gi-Oh! They changed the name in 2003.',
      colorClass: 'text-green-500',
    },
    {
      id: 'trap',
      name: 'Trap Cards',
      symbol: '🪤',
      description:
        "Purple cards you set face-down to surprise your opponent! They can't be activated the turn you set them.",
      examples: ['Mirror Force', 'Trap Hole', 'Magic Cylinder', 'Solemn Judgment'],
      funFact:
        "The most famous trap card, Mirror Force, destroys all your opponent's attacking monsters!",
      colorClass: 'text-purple-500',
    },
    {
      id: 'extra-deck',
      name: 'Extra Deck Cards',
      symbol: '🌟',
      description:
        'Special monsters kept in your Extra Deck! Includes Fusion (purple), Synchro (white), Xyz (black), and Link (blue) monsters.',
      examples: ['Blue-Eyes Ultimate Dragon', 'Stardust Dragon', 'Number 39: Utopia', 'Decode Talker'],
      funFact:
        'Your Extra Deck can hold up to 15 cards and you summon them using special methods!',
      colorClass: 'text-indigo-500',
    },
  ],
  setSymbols: {
    location: 'Look at the right side of the card, below the picture.',
    explanation:
      "Yu-Gi-Oh! uses set codes like 'LOB-001' where LOB is the set abbreviation and 001 is the card number.",
    examples: ['LOB (Legend of Blue Eyes)', 'DUEA (Duelist Alliance)', 'DUNE (Duelist Nexus)'],
    tip: 'The set code also shows the rarity with letters after the number, like LOB-001 (Common) vs LOB-E001 (European print)',
  },
  funFacts: [
    'Yu-Gi-Oh! started as a manga in 1996, and the card game launched in 1999!',
    'The Blue-Eyes White Dragon was inspired by a legend from Ancient Egypt in the story!',
    'In the original anime, Seto Kaiba tore up the 4th Blue-Eyes so no one else could use it!',
    'Tournament-legal Yu-Gi-Oh! decks must have exactly 40-60 cards in the Main Deck!',
    'The rarest Yu-Gi-Oh! card, Tyler the Great Warrior, was made for a Make-A-Wish child!',
  ],
  cardNumberFormat:
    'Yu-Gi-Oh! cards show set-number format like "LOB-001" where LOB is the set and 001 is the card number. Different editions have slightly different codes!',
  quizQuestions: [
    {
      id: 'ygo-q1',
      question: 'What color are Spell cards in Yu-Gi-Oh!?',
      options: ['Purple', 'Yellow', 'Green', 'Blue'],
      correctIndex: 2,
      explanation: 'Spell cards are always green! Traps are purple and most Monsters are yellow/orange.',
      difficulty: 'easy',
    },
    {
      id: 'ygo-q2',
      question: 'What color are Trap cards?',
      options: ['Green', 'Purple', 'Brown', 'White'],
      correctIndex: 1,
      explanation: 'Trap cards are purple! You set them face-down and activate them to surprise your opponent.',
      difficulty: 'easy',
    },
    {
      id: 'ygo-q3',
      question: 'What is an Ultra Rare card known for?',
      options: [
        'Green name text',
        'Gold foil name + holo art',
        'Black borders',
        'No artwork',
      ],
      correctIndex: 1,
      explanation:
        'Ultra Rares have a gold foil card name AND holographic artwork - double the shine!',
      difficulty: 'medium',
    },
    {
      id: 'ygo-q4',
      question: 'Where do Fusion, Synchro, and Xyz monsters go?',
      options: ['Main Deck', 'Side Deck', 'Extra Deck', 'Graveyard'],
      correctIndex: 2,
      explanation:
        'These special monsters live in the Extra Deck and are summoned using special methods!',
      difficulty: 'medium',
    },
    {
      id: 'ygo-q5',
      question: 'What makes a Starlight Rare special?',
      options: [
        'It glows in the dark',
        'Full-card rainbow foil with vertical sparkle',
        'It has no text',
        'Only in Japan',
      ],
      correctIndex: 1,
      explanation:
        'Starlight Rares have stunning full-card rainbow foil and are about 1 per sealed case - super rare!',
      difficulty: 'hard',
    },
  ],
};

// ============================================================================
// ONE PIECE TUTORIAL CONTENT
// ============================================================================

export const ONEPIECE_TUTORIAL_CONTENT: GameTutorialContent = {
  gameId: 'onepiece',
  gameName: 'One Piece Card Game',
  cardTypes: [
    {
      id: 'leader',
      name: 'Leader Cards',
      symbol: '👑',
      description:
        'The captain of your deck! Leaders have a red card back and special abilities that define your strategy.',
      examples: ['Monkey D. Luffy', 'Trafalgar Law', 'Kaido', 'Shanks'],
      funFact:
        'Your Leader determines which colors you can include in your deck! Choose wisely, captain!',
      colorClass: 'text-red-500',
    },
    {
      id: 'character',
      name: 'Character Cards',
      symbol: '🏴‍☠️',
      description:
        'Your crew members! Characters have Power (attack strength) and cost DON!! to play.',
      examples: ['Roronoa Zoro', 'Nami', 'Sanji', 'Portgas D. Ace'],
      funFact:
        'Character cards feature amazing artwork of your favorite pirates from the manga and anime!',
      colorClass: 'text-blue-500',
    },
    {
      id: 'event',
      name: 'Event Cards',
      symbol: '💥',
      description:
        "Action cards you play from your hand for one-time effects! They're like surprise moves.",
      examples: ['Gum-Gum Jet Pistol', 'Radical Beam', 'Overheat'],
      funFact:
        "Many Event cards are named after famous attacks from the One Piece series!",
      colorClass: 'text-amber-500',
    },
    {
      id: 'stage',
      name: 'Stage Cards',
      symbol: '🏝️',
      description:
        'Locations from the One Piece world that provide ongoing effects while in play!',
      examples: ['Thousand Sunny', 'Onigashima', 'Baratie', 'Whole Cake Island'],
      funFact:
        'Stage cards represent famous locations from Luffy\'s adventures across the Grand Line!',
      colorClass: 'text-green-500',
    },
    {
      id: 'don',
      name: 'DON!! Cards',
      symbol: '⚡',
      description:
        'Energy cards that power your plays! Add DON!! each turn and attach them to boost your characters.',
      examples: ['DON!! x10 (included in every starter deck)'],
      funFact:
        'DON!! stands for the sound effect "ドン" used in the manga for dramatic moments!',
      colorClass: 'text-yellow-500',
    },
  ],
  setSymbols: {
    location: 'Look at the bottom left of your card for the set ID and card number.',
    explanation:
      "One Piece cards use codes like 'OP01-001' where OP01 is the set and 001 is the card number.",
    examples: ['OP01 (Romance Dawn)', 'OP02 (Paramount War)', 'OP03 (Pillars of Strength)'],
    tip: 'The set number tells you which booster the card is from - OP01 was the first set!',
  },
  funFacts: [
    'The One Piece Card Game launched in 2022 and became instantly popular worldwide!',
    'One Piece is the best-selling manga of all time with over 500 million copies!',
    'Leader cards have red backs while all other cards have normal card backs!',
    'Manga Rare cards feature actual black-and-white manga artwork by Eiichiro Oda!',
    'The game features 5 colors: Red, Green, Blue, Purple, and Black - each with unique strategies!',
  ],
  cardNumberFormat:
    'One Piece cards show "OP01-001" format where OP01 is the set code and 001 is the card number. Special cards have different prefixes like "ST" for starter decks!',
  quizQuestions: [
    {
      id: 'op-q1',
      question: 'What makes Leader cards special?',
      options: [
        'They have blue backs',
        'They have red backs and lead your deck',
        'They cost no DON!!',
        'They can attack twice',
      ],
      correctIndex: 1,
      explanation:
        'Leader cards have distinctive red card backs and determine your deck\'s strategy!',
      difficulty: 'easy',
    },
    {
      id: 'op-q2',
      question: 'What are DON!! cards used for?',
      options: ['Blocking attacks', 'Powering your plays', 'Drawing cards', 'Healing'],
      correctIndex: 1,
      explanation:
        'DON!! cards are your energy! You add them each turn and spend them to play characters and events.',
      difficulty: 'easy',
    },
    {
      id: 'op-q3',
      question: 'How many DON!! cards come in a starter deck?',
      options: ['5', '8', '10', '15'],
      correctIndex: 2,
      explanation: 'Every starter deck includes exactly 10 DON!! cards for your DON!! deck!',
      difficulty: 'medium',
    },
    {
      id: 'op-q4',
      question: 'What is special about Manga Rare cards?',
      options: [
        'They have gold borders',
        'They feature black-and-white manga artwork',
        'They have no text',
        'They are only in Japanese',
      ],
      correctIndex: 1,
      explanation:
        'Manga Rare cards feature stunning black-and-white artwork from the original One Piece manga!',
      difficulty: 'medium',
    },
    {
      id: 'op-q5',
      question: 'How many main colors exist in One Piece Card Game?',
      options: ['3', '4', '5', '6'],
      correctIndex: 2,
      explanation:
        'There are 5 colors: Red (aggressive), Green (ramp), Blue (control), Purple (trash effects), and Black (cost reduction)!',
      difficulty: 'hard',
    },
  ],
};

// ============================================================================
// DISNEY LORCANA TUTORIAL CONTENT
// ============================================================================

export const LORCANA_TUTORIAL_CONTENT: GameTutorialContent = {
  gameId: 'lorcana',
  gameName: 'Disney Lorcana',
  cardTypes: [
    {
      id: 'character',
      name: 'Character Cards',
      symbol: '🏰',
      description:
        'Disney heroes and villains! Characters have Strength, Willpower, and special abilities.',
      examples: ['Mickey Mouse', 'Elsa', 'Stitch', 'Maleficent'],
      funFact:
        "Characters can 'Quest' to earn Lore - the first player to 20 Lore wins!",
      colorClass: 'text-blue-500',
    },
    {
      id: 'action',
      name: 'Action Cards',
      symbol: '✨',
      description:
        "One-time effect cards that create magical moments! Play them from your hand for instant effects.",
      examples: ['Be Prepared', 'Grab Your Sword', 'Develop Your Brain'],
      funFact:
        'Many Action cards are named after famous Disney song lyrics and movie quotes!',
      colorClass: 'text-purple-500',
    },
    {
      id: 'item',
      name: 'Item Cards',
      symbol: '🗡️',
      description:
        "Magical objects that stay in play and provide ongoing effects or can be used by characters!",
      examples: ["Maui's Fish Hook", 'Poison Apple', 'Lantern'],
      funFact:
        'Items are based on iconic objects from Disney films - you might recognize them!',
      colorClass: 'text-amber-500',
    },
    {
      id: 'song',
      name: 'Song Cards',
      symbol: '🎵',
      description:
        "Special Action cards! Characters can 'sing' Songs instead of you paying their ink cost.",
      examples: ['Let It Go', 'Be Our Guest', 'A Whole New World'],
      funFact:
        'If a character has enough Cost, they can sing a Song for free! The Cost must equal or exceed the Song\'s cost.',
      colorClass: 'text-pink-500',
    },
    {
      id: 'location',
      name: 'Location Cards',
      symbol: '🌍',
      description:
        'Magical Disney locations that provide special effects! Characters can move to locations.',
      examples: ['Arendelle', 'Motunui', 'Agrabah', 'Never Land'],
      funFact:
        'Location cards were added in the Ursula\'s Return set - bringing famous Disney places to life!',
      colorClass: 'text-green-500',
    },
  ],
  setSymbols: {
    location: 'Look at the bottom of your card for the set number and card number.',
    explanation:
      "Lorcana uses set numbers like '1/204' and a set symbol. Each set has a unique symbol!",
    examples: ['The First Chapter (castle)', 'Rise of the Floodborn (wave)', 'Into the Inklands (compass)'],
    tip: 'The set symbol appears next to the card number - each set has a unique shape!',
  },
  funFacts: [
    'Disney Lorcana launched in August 2023 and sold out everywhere almost instantly!',
    'The 6 ink colors are Amber, Amethyst, Emerald, Ruby, Sapphire, and Steel!',
    'Enchanted cards are the original ultra-rare cards with stunning full-art designs!',
    'You can only have 4 copies of any card (by name) in your deck of 60 cards!',
    'Characters with the same name can\'t be in play at the same time - choose wisely!',
  ],
  cardNumberFormat:
    'Lorcana cards show "1/204" format where 1 is the card number and 204 is the set size. Promo cards have a "P" prefix!',
  quizQuestions: [
    {
      id: 'lor-q1',
      question: 'How do you win a game of Lorcana?',
      options: [
        'Defeat all enemy characters',
        'Collect 20 Lore first',
        'Run out of cards last',
        'Have the most ink',
      ],
      correctIndex: 1,
      explanation:
        'The first player to collect 20 Lore wins! Characters earn Lore by Questing.',
      difficulty: 'easy',
    },
    {
      id: 'lor-q2',
      question: 'What makes Song cards special?',
      options: [
        'They make music',
        'Characters can sing them for free',
        'They never cost ink',
        'Only villains can use them',
      ],
      correctIndex: 1,
      explanation:
        'Characters with enough Cost can "sing" a Song card, playing it without spending ink!',
      difficulty: 'easy',
    },
    {
      id: 'lor-q3',
      question: 'How many ink colors are there in Lorcana?',
      options: ['4', '5', '6', '7'],
      correctIndex: 2,
      explanation:
        'There are 6 ink colors: Amber, Amethyst, Emerald, Ruby, Sapphire, and Steel!',
      difficulty: 'medium',
    },
    {
      id: 'lor-q4',
      question: 'What rarity has a rainbow hexagon symbol?',
      options: ['Super Rare', 'Legendary', 'Enchanted', 'Epic'],
      correctIndex: 2,
      explanation:
        'Enchanted cards have the rainbow hexagon symbol and feature stunning full-art designs!',
      difficulty: 'medium',
    },
    {
      id: 'lor-q5',
      question: 'What is unique about Iconic rarity cards?',
      options: [
        'Only 2 exist per set',
        'They have no artwork',
        'Only in starter decks',
        'They are always Mickey',
      ],
      correctIndex: 0,
      explanation:
        'Iconic cards are the rarest - only 2 different Iconic cards exist in each set!',
      difficulty: 'hard',
    },
  ],
};

// ============================================================================
// GAME TUTORIAL CONTENT REGISTRY
// ============================================================================

/**
 * Map of game IDs to their tutorial content.
 */
export const GAME_TUTORIAL_CONTENT: Record<GameId, GameTutorialContent> = {
  pokemon: POKEMON_TUTORIAL_CONTENT,
  yugioh: YUGIOH_TUTORIAL_CONTENT,
  onepiece: ONEPIECE_TUTORIAL_CONTENT,
  lorcana: LORCANA_TUTORIAL_CONTENT,
};

/**
 * Get tutorial content for a specific game.
 * @param gameId - The game to get content for
 */
export function getTutorialContentForGame(gameId: GameId): GameTutorialContent {
  return GAME_TUTORIAL_CONTENT[gameId] ?? POKEMON_TUTORIAL_CONTENT;
}

/**
 * Get card types for a specific game.
 * @param gameId - The game to get card types for
 */
export function getCardTypesForGame(gameId: GameId): CardTypeInfo[] {
  return getTutorialContentForGame(gameId).cardTypes;
}

/**
 * Get a specific card type by ID for a game.
 * @param gameId - The game to search in
 * @param cardTypeId - The card type ID to find
 */
export function getCardTypeInfo(gameId: GameId, cardTypeId: string): CardTypeInfo | null {
  const content = getTutorialContentForGame(gameId);
  return content.cardTypes.find((ct) => ct.id === cardTypeId) ?? null;
}

/**
 * Get set symbol information for a game.
 * @param gameId - The game to get set symbol info for
 */
export function getSetSymbolInfo(gameId: GameId): SetSymbolInfo {
  return getTutorialContentForGame(gameId).setSymbols;
}

/**
 * Get fun facts for a specific game.
 * @param gameId - The game to get fun facts for
 */
export function getGameFunFacts(gameId: GameId): string[] {
  return getTutorialContentForGame(gameId).funFacts;
}

/**
 * Get a random fun fact for a game.
 * @param gameId - The game to get a fun fact for
 */
export function getRandomFunFact(gameId: GameId): string {
  const facts = getGameFunFacts(gameId);
  return facts[Math.floor(Math.random() * facts.length)];
}

/**
 * Get card number format explanation for a game.
 * @param gameId - The game to get format for
 */
export function getCardNumberFormat(gameId: GameId): string {
  return getTutorialContentForGame(gameId).cardNumberFormat;
}

/**
 * Get quiz questions for a specific game.
 * @param gameId - The game to get questions for
 */
export function getQuizQuestionsForGame(gameId: GameId): QuizQuestion[] {
  return getTutorialContentForGame(gameId).quizQuestions;
}

/**
 * Get quiz questions filtered by difficulty.
 * @param gameId - The game to get questions for
 * @param difficulty - The difficulty level to filter by
 */
export function getQuizQuestionsByDifficulty(
  gameId: GameId,
  difficulty: QuizQuestion['difficulty']
): QuizQuestion[] {
  return getQuizQuestionsForGame(gameId).filter((q) => q.difficulty === difficulty);
}

/**
 * Get a random quiz question for a game.
 * @param gameId - The game to get a question for
 * @param difficulty - Optional difficulty filter
 */
export function getRandomQuizQuestion(
  gameId: GameId,
  difficulty?: QuizQuestion['difficulty']
): QuizQuestion | null {
  const questions = difficulty
    ? getQuizQuestionsByDifficulty(gameId, difficulty)
    : getQuizQuestionsForGame(gameId);
  if (questions.length === 0) return null;
  return questions[Math.floor(Math.random() * questions.length)];
}

/**
 * Get all quiz questions across all games.
 */
export function getAllQuizQuestions(): QuizQuestion[] {
  return Object.values(GAME_TUTORIAL_CONTENT).flatMap((content) => content.quizQuestions);
}

/**
 * Get the game name for display.
 * @param gameId - The game ID
 */
export function getGameDisplayName(gameId: GameId): string {
  return getTutorialContentForGame(gameId).gameName;
}
