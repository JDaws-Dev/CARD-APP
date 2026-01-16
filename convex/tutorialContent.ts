import { v } from 'convex/values';
import { query } from './_generated/server';

// ============================================================================
// TUTORIAL CONTENT DEFINITIONS
// ============================================================================

/**
 * "Learn to Collect" tutorial content for new Pokemon TCG collectors.
 * Each tutorial lesson teaches kids an important collecting concept
 * with kid-friendly explanations, tips, and fun facts.
 *
 * Tutorials are designed for kids ages 6-12 and cover:
 * - Getting started with collecting
 * - Understanding card types and rarities
 * - Proper card care and organization
 * - Building a collection strategy
 * - Trading basics and etiquette
 */

export interface TutorialStep {
  /** Step number within the lesson */
  stepNumber: number;
  /** Title for this step */
  title: string;
  /** Main content/explanation */
  content: string;
  /** Example card ID to display (optional) */
  exampleCardId?: string;
  /** Example card description (used when image not available) */
  exampleDescription?: string;
  /** Image URL for visual aid (optional) */
  imageUrl?: string;
  /** Image alt text for accessibility */
  imageAlt?: string;
}

export interface TutorialLesson {
  /** Unique identifier for the lesson */
  id: string;
  /** Display title */
  title: string;
  /** Short description shown in lesson list */
  description: string;
  /** Icon emoji for the lesson */
  icon: string;
  /** Lesson category */
  category: 'basics' | 'cards' | 'care' | 'organization' | 'trading' | 'advanced';
  /** Sort order within category */
  sortOrder: number;
  /** Estimated reading time in minutes */
  estimatedMinutes: number;
  /** Steps within this lesson */
  steps: TutorialStep[];
  /** Fun fact to show at the end */
  funFact: string;
  /** Key takeaway/summary */
  keyTakeaway: string;
  /** Achievement badge key earned upon completion (optional) */
  completionBadge?: string;
}

/**
 * Complete tutorial lessons for "Learn to Collect" feature.
 * Lessons are organized by category and sorted by recommended order.
 */
export const TUTORIAL_LESSONS: readonly TutorialLesson[] = [
  // ============================================================================
  // BASICS - Getting Started
  // ============================================================================
  {
    id: 'what-is-collecting',
    title: 'What is Card Collecting?',
    description: 'Learn what it means to be a Pokemon card collector!',
    icon: '🌟',
    category: 'basics',
    sortOrder: 1,
    estimatedMinutes: 3,
    steps: [
      {
        stepNumber: 1,
        title: 'Welcome, Collector!',
        content:
          "Collecting Pokemon cards is a fun hobby where you gather cards featuring your favorite Pokemon, trainers, and items. It's like building your own Pokemon world, one card at a time!",
        imageAlt: 'A collection of colorful Pokemon cards spread out',
      },
      {
        stepNumber: 2,
        title: 'Why People Collect',
        content:
          "People collect for different reasons: to catch their favorite Pokemon, to find beautiful artwork, to complete sets, or to trade with friends. There's no wrong way to collect!",
      },
      {
        stepNumber: 3,
        title: 'Your Collection Journey',
        content:
          'Every collector starts with just one card. As you add more cards, your collection grows into something special and unique to you. This app helps you keep track of everything!',
      },
    ],
    funFact:
      "The first Pokemon cards were released in Japan in 1996 - that's before many of your parents even knew what Pokemon was!",
    keyTakeaway: 'Collecting is about having fun and building something you love.',
    completionBadge: 'tutorial_welcome',
  },
  {
    id: 'getting-cards',
    title: 'How to Get Cards',
    description: 'Discover all the ways to add cards to your collection!',
    icon: '📦',
    category: 'basics',
    sortOrder: 2,
    estimatedMinutes: 4,
    steps: [
      {
        stepNumber: 1,
        title: 'Booster Packs',
        content:
          "Booster packs are small sealed packs with about 10 random cards inside. Opening packs is exciting because you never know what you'll get! Each pack has a chance to contain rare cards.",
        imageAlt: 'A sealed Pokemon booster pack',
      },
      {
        stepNumber: 2,
        title: 'Theme Decks & Starter Sets',
        content:
          "These are pre-made sets of cards that come ready to play. They're great for beginners because they include everything you need to start playing and collecting!",
      },
      {
        stepNumber: 3,
        title: 'Special Products',
        content:
          "Elite Trainer Boxes, tins, and collection boxes often include booster packs plus exclusive promo cards you can't find anywhere else!",
      },
      {
        stepNumber: 4,
        title: 'Trading with Friends',
        content:
          "Trading is one of the best ways to get cards you want! We'll cover trading tips in another lesson. Always be fair and have fun!",
      },
    ],
    funFact:
      'A standard booster pack has 10 cards: 6 commons, 3 uncommons, and 1 rare (or better)!',
    keyTakeaway: 'There are many ways to grow your collection - find what works best for you!',
  },
  // ============================================================================
  // CARDS - Understanding Your Cards
  // ============================================================================
  {
    id: 'card-types',
    title: 'Types of Cards',
    description: 'Learn about Pokemon, Trainer, and Energy cards!',
    icon: '🃏',
    category: 'cards',
    sortOrder: 1,
    estimatedMinutes: 5,
    steps: [
      {
        stepNumber: 1,
        title: 'Pokemon Cards',
        content:
          "Pokemon cards show the creatures you'll battle with! Each Pokemon card has HP (health), attacks, weaknesses, and sometimes special abilities. There are Basic Pokemon and evolved Pokemon like Stage 1 and Stage 2.",
        exampleDescription: 'A Pikachu card showing HP, attacks, and lightning type symbol',
        imageAlt: 'Example of a Pokemon card layout',
      },
      {
        stepNumber: 2,
        title: 'Trainer Cards',
        content:
          'Trainer cards help you during battles! There are three kinds: Items (use anytime), Supporters (one per turn), and Stadiums (stay in play). Look for the "Trainer" label at the top of the card.',
        imageAlt: 'Example of different Trainer card types',
      },
      {
        stepNumber: 3,
        title: 'Energy Cards',
        content:
          "Energy cards power your Pokemon's attacks! Match the energy symbols on the card to the attack cost. Basic Energy cards can be found in every pack and are important for playing!",
        imageAlt: 'Different types of Energy cards',
      },
      {
        stepNumber: 4,
        title: 'Special Pokemon',
        content:
          'Some Pokemon have special designations like EX, GX, V, VMAX, VSTAR, or ex (lowercase). These are powerful and usually more rare! They often have higher HP and stronger attacks.',
        imageAlt: 'Example of special Pokemon variants',
      },
    ],
    funFact: 'There are 18 different Pokemon types, from Fire and Water to Dragon and Fairy!',
    keyTakeaway: 'Pokemon, Trainers, and Energy work together - learn to recognize each type!',
    completionBadge: 'tutorial_card_expert',
  },
  {
    id: 'understanding-rarity',
    title: 'Understanding Rarity',
    description: 'Find out what makes some cards special and rare!',
    icon: '⭐',
    category: 'cards',
    sortOrder: 2,
    estimatedMinutes: 4,
    steps: [
      {
        stepNumber: 1,
        title: 'Rarity Symbols',
        content:
          'Look at the bottom of your card for a small symbol. A circle (●) means Common, a diamond (◆) means Uncommon, and a star (★) means Rare. These symbols tell you how hard a card is to find!',
        imageAlt: 'Close-up of rarity symbols on cards',
      },
      {
        stepNumber: 2,
        title: 'Common & Uncommon',
        content:
          "Common and Uncommon cards are found in almost every pack. Don't skip them - they're important for completing sets and often have cool Pokemon on them!",
      },
      {
        stepNumber: 3,
        title: 'Rare & Ultra Rare',
        content:
          'Rare cards have a star symbol and might be holographic (shiny!). Ultra Rare cards include EX, GX, V, and VMAX Pokemon. These are exciting to pull from packs!',
      },
      {
        stepNumber: 4,
        title: 'Secret Rare',
        content:
          'The rarest cards are "Secret Rares" - they have card numbers higher than the set total (like 201/195). These include rainbow cards, gold cards, and special art versions!',
      },
    ],
    funFact:
      "Some Secret Rare cards can be worth hundreds of dollars because they're so hard to find!",
    keyTakeaway: 'Check the symbol at the bottom of every card to know its rarity!',
  },
  {
    id: 'reading-cards',
    title: 'How to Read a Card',
    description: 'Learn what all the numbers and symbols on a card mean!',
    icon: '📖',
    category: 'cards',
    sortOrder: 3,
    estimatedMinutes: 5,
    steps: [
      {
        stepNumber: 1,
        title: 'The Top of the Card',
        content:
          "At the top you'll find the Pokemon's name and HP (Hit Points). The higher the HP, the harder the Pokemon is to knock out! You'll also see the Pokemon's type symbol.",
        imageAlt: 'Top section of a Pokemon card highlighted',
      },
      {
        stepNumber: 2,
        title: 'Attacks & Abilities',
        content:
          "In the middle, you'll see attacks and sometimes Abilities. Each attack shows: Energy cost (symbols on the left), attack name, and damage (number on the right). Abilities are special powers that don't need Energy!",
        imageAlt: 'Attack section of a Pokemon card highlighted',
      },
      {
        stepNumber: 3,
        title: 'Weakness & Resistance',
        content:
          'At the bottom, Weakness shows which type does extra damage to this Pokemon. Resistance means a type does less damage. Retreat Cost shows how much Energy to switch Pokemon!',
        imageAlt: 'Bottom section of a Pokemon card highlighted',
      },
      {
        stepNumber: 4,
        title: 'Set Info & Card Number',
        content:
          "At the very bottom, you'll find the card number (like 25/198), set symbol, and rarity. The card number helps you know which cards you need to complete a set!",
        imageAlt: 'Card number and set information highlighted',
      },
    ],
    funFact:
      'The set symbol is like a secret code that tells you which expansion the card is from!',
    keyTakeaway: 'Every part of the card tells you something important - take time to explore!',
  },
  // ============================================================================
  // CARE - Taking Care of Your Cards
  // ============================================================================
  {
    id: 'card-handling',
    title: 'Handling Cards Safely',
    description: 'Learn how to touch and hold cards without damaging them!',
    icon: '🤲',
    category: 'care',
    sortOrder: 1,
    estimatedMinutes: 3,
    steps: [
      {
        stepNumber: 1,
        title: 'Clean Hands First',
        content:
          "Always wash and dry your hands before handling cards! Oils, dirt, and food can damage cards and leave marks that won't come off.",
      },
      {
        stepNumber: 2,
        title: 'Hold Cards by the Edges',
        content:
          'Try to hold cards by their edges, not the front or back. Touching the surface can leave fingerprints or scratches, especially on holographic cards.',
        imageAlt: 'Proper way to hold a card by the edges',
      },
      {
        stepNumber: 3,
        title: 'Use a Clean Surface',
        content:
          'When looking at cards, place them on a clean, flat surface. Avoid rough surfaces that could scratch them, and keep food and drinks away!',
      },
    ],
    funFact: 'Professional card graders use cotton gloves when handling valuable cards!',
    keyTakeaway: 'Clean hands + edge holding = happy cards!',
    completionBadge: 'tutorial_card_care',
  },
  {
    id: 'card-storage',
    title: 'Storing Your Cards',
    description: 'Discover the best ways to keep your cards safe!',
    icon: '📁',
    category: 'care',
    sortOrder: 2,
    estimatedMinutes: 4,
    steps: [
      {
        stepNumber: 1,
        title: 'Card Sleeves',
        content:
          "Penny sleeves are thin plastic sleeves that protect your cards from scratches and dirt. Put your cards in sleeves to keep them safe! They're cheap and easy to find.",
        imageAlt: 'A card being placed in a penny sleeve',
      },
      {
        stepNumber: 2,
        title: 'Top Loaders',
        content:
          'For your special cards, use top loaders - rigid plastic holders that prevent bending. Put the sleeved card inside the top loader for double protection!',
        imageAlt: 'A sleeved card in a top loader',
      },
      {
        stepNumber: 3,
        title: 'Binders',
        content:
          'Card binders with 9-pocket pages are great for organizing and displaying your collection. You can flip through pages like a book! Use side-loading pages to prevent cards falling out.',
        imageAlt: 'Pokemon card binder with organized cards',
      },
      {
        stepNumber: 4,
        title: 'Storage Boxes',
        content:
          'For large collections, cardboard or plastic storage boxes hold hundreds of cards. Label them by set or type to find cards easily!',
        imageAlt: 'Card storage box with dividers',
      },
    ],
    funFact:
      'A top loader and penny sleeve together costs less than a dollar but can protect a card worth hundreds!',
    keyTakeaway: 'Sleeves for all cards, top loaders for special ones, binders for display!',
  },
  {
    id: 'keeping-cards-safe',
    title: 'Protecting Your Collection',
    description: 'Tips to keep your cards in great condition for years!',
    icon: '🛡️',
    category: 'care',
    sortOrder: 3,
    estimatedMinutes: 3,
    steps: [
      {
        stepNumber: 1,
        title: 'Avoid Sunlight',
        content:
          'Keep your cards away from direct sunlight! UV rays can fade the colors over time. Store binders in a closet or drawer, not on a sunny windowsill.',
      },
      {
        stepNumber: 2,
        title: 'Control Temperature',
        content:
          'Extreme heat or cold can warp cards. Keep them at room temperature - not in a hot car or cold garage. Your bedroom is usually perfect!',
      },
      {
        stepNumber: 3,
        title: 'Watch Out for Water',
        content:
          "Water is a card's worst enemy! Never store cards in basements that might flood. If a card gets wet, it's very hard to fix the damage.",
      },
    ],
    funFact:
      'Some collectors store their most valuable cards in fireproof safes or bank safety deposit boxes!',
    keyTakeaway: 'Keep cards cool, dry, and out of direct sunlight for the best protection!',
  },
  // ============================================================================
  // ORGANIZATION - Building Your Collection
  // ============================================================================
  {
    id: 'organizing-collection',
    title: 'Organizing Your Cards',
    description: 'Learn different ways to sort and organize your collection!',
    icon: '📊',
    category: 'organization',
    sortOrder: 1,
    estimatedMinutes: 4,
    steps: [
      {
        stepNumber: 1,
        title: 'By Set',
        content:
          'Organizing by set means keeping all cards from the same expansion together. This makes it easy to see which cards you need to complete a set! Use the set symbol to identify sets.',
        imageAlt: 'Cards organized by set in a binder',
      },
      {
        stepNumber: 2,
        title: 'By Pokemon Number',
        content:
          'You can organize by Pokedex number - Bulbasaur (#1) to the newest Pokemon. This is great for collectors who want to "catch \'em all" across all sets!',
      },
      {
        stepNumber: 3,
        title: 'By Type',
        content:
          'Fire cards together, Water cards together, and so on! This works great if you have a favorite type or want to build themed binder pages.',
      },
      {
        stepNumber: 4,
        title: 'By Value or Rarity',
        content:
          'Keep your most valuable or rare cards in a special binder with better protection. Common cards can go in storage boxes. This helps you protect what matters most!',
      },
    ],
    funFact:
      'There\'s no "right" way to organize - some collectors have different binders for different methods!',
    keyTakeaway: 'Pick a system that makes YOU happy and helps you find cards easily!',
    completionBadge: 'tutorial_organizer',
  },
  {
    id: 'tracking-collection',
    title: 'Tracking Your Collection',
    description: 'Use CardDex to keep track of every card you own!',
    icon: '📱',
    category: 'organization',
    sortOrder: 2,
    estimatedMinutes: 3,
    steps: [
      {
        stepNumber: 1,
        title: 'Why Track Your Cards?',
        content:
          "Tracking your collection helps you know exactly what you have, avoid buying duplicates, and see which cards you still need. Plus, it's fun to watch your collection grow!",
      },
      {
        stepNumber: 2,
        title: 'Adding Cards to CardDex',
        content:
          "When you get a new card, add it to your collection in the app. You can search by name, set, or card number. Don't forget to mark if it's a special variant like holofoil!",
      },
      {
        stepNumber: 3,
        title: 'Checking Your Progress',
        content:
          "Your dashboard shows how many cards you have, which sets you're collecting, and how close you are to completing them. Earn badges as you reach collecting milestones!",
      },
    ],
    funFact:
      'Before apps like this, collectors had to use paper checklists or spreadsheets to track their cards!',
    keyTakeaway: 'Add cards as you get them to keep your collection accurate and up to date!',
  },
  // ============================================================================
  // TRADING - Trading with Friends
  // ============================================================================
  {
    id: 'trading-basics',
    title: 'Trading Basics',
    description: 'Learn how to trade cards fairly with friends!',
    icon: '🤝',
    category: 'trading',
    sortOrder: 1,
    estimatedMinutes: 4,
    steps: [
      {
        stepNumber: 1,
        title: 'What is Trading?',
        content:
          "Trading means swapping cards with someone else. You give them a card they want, and they give you a card you want. It's a great way to get cards for your collection!",
      },
      {
        stepNumber: 2,
        title: 'Finding Trade Partners',
        content:
          'Friends at school, family members, or people at local game stores can be trade partners. Always trade with people you trust, and never trade alone with strangers.',
      },
      {
        stepNumber: 3,
        title: 'Fair Trading',
        content:
          "A fair trade is when both people are happy! Compare rarity and condition. A common card usually isn't worth the same as a rare holo. Ask a parent or experienced collector if you're unsure.",
      },
      {
        stepNumber: 4,
        title: 'Use Your Wishlist',
        content:
          'Add cards you want to your wishlist in CardDex. When trading, you can show your wishlist to see if your friend has something you need!',
      },
    ],
    funFact: 'Trading has been part of Pokemon cards since the very beginning in 1996!',
    keyTakeaway: 'Good trades make both people happy - always be fair and honest!',
    completionBadge: 'tutorial_trader',
  },
  {
    id: 'trading-etiquette',
    title: 'Trading Etiquette',
    description: 'Be a great trade partner with these polite trading tips!',
    icon: '✨',
    category: 'trading',
    sortOrder: 2,
    estimatedMinutes: 3,
    steps: [
      {
        stepNumber: 1,
        title: 'Be Honest About Condition',
        content:
          "Always tell your trade partner about any damage on your card. Point out scratches, bent corners, or whitening. Hiding damage isn't fair and ruins trust!",
      },
      {
        stepNumber: 2,
        title: "It's OK to Say No",
        content:
          "You don't have to accept every trade offer. If you don't want to trade a card, politely say \"No thank you.\" Never feel pressured into a trade you don't want!",
      },
      {
        stepNumber: 3,
        title: 'No Take-Backs',
        content:
          "Once both people agree and the cards are exchanged, the trade is done. Make sure you're happy before you trade! It's not nice to ask for your card back later.",
      },
    ],
    funFact:
      'Some of the most valuable Pokemon cards today were once traded between kids at school!',
    keyTakeaway: 'Being honest and respectful makes trading fun for everyone!',
  },
  // ============================================================================
  // ADVANCED - Growing Your Collection
  // ============================================================================
  {
    id: 'set-completion',
    title: 'Completing Sets',
    description: 'Learn strategies for completing entire Pokemon sets!',
    icon: '🏆',
    category: 'advanced',
    sortOrder: 1,
    estimatedMinutes: 4,
    steps: [
      {
        stepNumber: 1,
        title: 'Pick Your Set',
        content:
          'Start with one set to complete rather than collecting randomly. Newer sets are usually easier to find. Check how many cards are in the set before you start!',
      },
      {
        stepNumber: 2,
        title: 'Track Your Progress',
        content:
          "Use CardDex to see which cards you have and which you need. Focus on getting the commons and uncommons first - they're easiest to find or trade for.",
      },
      {
        stepNumber: 3,
        title: 'The Last Few Cards',
        content:
          'The hardest part is getting those last few rare cards. Be patient! Check your duplicate pile - you might have cards to trade. Ask family if they want to help with your wishlist.',
      },
      {
        stepNumber: 4,
        title: 'Celebrate Your Success!',
        content:
          "When you complete a set, take a moment to celebrate! You've accomplished something special. Maybe display your completed set in a special binder!",
      },
    ],
    funFact:
      'Some sets have over 200 cards including secret rares - completing them is a real achievement!',
    keyTakeaway: 'Set goals, track progress, and celebrate when you reach them!',
    completionBadge: 'tutorial_completionist',
  },
  {
    id: 'building-value',
    title: 'Building a Valuable Collection',
    description: 'Tips for collectors who want to build long-term value!',
    icon: '💎',
    category: 'advanced',
    sortOrder: 2,
    estimatedMinutes: 4,
    steps: [
      {
        stepNumber: 1,
        title: 'Condition Matters Most',
        content:
          "The better condition your cards are in, the more they're worth. A Near Mint card can be worth much more than the same card in Heavily Played condition!",
      },
      {
        stepNumber: 2,
        title: 'Protect From Day One',
        content:
          'Put cards in sleeves as soon as you pull them from packs. The longer you wait, the more chances for damage. Even a small scratch reduces value!',
      },
      {
        stepNumber: 3,
        title: 'What Becomes Valuable',
        content:
          'Popular Pokemon (Pikachu, Charizard), special arts, and secret rares tend to hold value best. But nobody can predict the future - collect what you love first!',
      },
      {
        stepNumber: 4,
        title: 'Patience is Key',
        content:
          "Card values change over time. A card might not be worth much now but could become valuable later. Don't sell cards you love just for quick money!",
      },
    ],
    funFact:
      'A mint condition 1999 Charizard sold for over $400,000! Those collectors never imagined their cards would be worth so much.',
    keyTakeaway: 'The best collection is one you love - value is just a bonus!',
  },
] as const;

// ============================================================================
// TUTORIAL CATEGORIES
// ============================================================================

export interface TutorialCategory {
  /** Category ID matching TutorialLesson.category */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Icon emoji */
  icon: string;
  /** Display sort order */
  sortOrder: number;
}

/**
 * Tutorial categories for organizing lessons.
 */
export const TUTORIAL_CATEGORIES: readonly TutorialCategory[] = [
  {
    id: 'basics',
    name: 'Getting Started',
    description: 'The fundamentals of Pokemon card collecting',
    icon: '🌟',
    sortOrder: 1,
  },
  {
    id: 'cards',
    name: 'Understanding Cards',
    description: 'Learn what makes each card special',
    icon: '🃏',
    sortOrder: 2,
  },
  {
    id: 'care',
    name: 'Card Care',
    description: 'Keep your cards in great condition',
    icon: '🤲',
    sortOrder: 3,
  },
  {
    id: 'organization',
    name: 'Organization',
    description: 'Sort, track, and display your collection',
    icon: '📊',
    sortOrder: 4,
  },
  {
    id: 'trading',
    name: 'Trading',
    description: 'Trade cards fairly with friends',
    icon: '🤝',
    sortOrder: 5,
  },
  {
    id: 'advanced',
    name: 'Advanced Collecting',
    description: 'Level up your collecting skills',
    icon: '💎',
    sortOrder: 6,
  },
] as const;

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all tutorial categories.
 * Returns categories sorted by recommended learning order.
 */
export const getAllCategories = query({
  args: {},
  handler: async () => {
    const sortedCategories = [...TUTORIAL_CATEGORIES].sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      categories: sortedCategories,
      count: sortedCategories.length,
    };
  },
});

/**
 * Get a single tutorial category by ID.
 */
export const getCategoryById = query({
  args: { categoryId: v.string() },
  handler: async (ctx, args) => {
    const category = TUTORIAL_CATEGORIES.find((c) => c.id === args.categoryId);
    return category ?? null;
  },
});

/**
 * Get all tutorial lessons.
 * Returns lessons sorted by category and then by sortOrder within category.
 */
export const getAllLessons = query({
  args: {},
  handler: async () => {
    const sortedLessons = [...TUTORIAL_LESSONS].sort((a, b) => {
      const catA = TUTORIAL_CATEGORIES.find((c) => c.id === a.category);
      const catB = TUTORIAL_CATEGORIES.find((c) => c.id === b.category);
      const catSortA = catA?.sortOrder ?? 999;
      const catSortB = catB?.sortOrder ?? 999;

      if (catSortA !== catSortB) {
        return catSortA - catSortB;
      }
      return a.sortOrder - b.sortOrder;
    });

    return {
      lessons: sortedLessons,
      count: sortedLessons.length,
      totalMinutes: sortedLessons.reduce((sum, l) => sum + l.estimatedMinutes, 0),
    };
  },
});

/**
 * Get a single tutorial lesson by ID.
 */
export const getLessonById = query({
  args: { lessonId: v.string() },
  handler: async (ctx, args) => {
    const lesson = TUTORIAL_LESSONS.find((l) => l.id === args.lessonId);
    if (!lesson) {
      return null;
    }

    const category = TUTORIAL_CATEGORIES.find((c) => c.id === lesson.category);

    return {
      lesson,
      category: category ?? null,
      stepCount: lesson.steps.length,
    };
  },
});

/**
 * Get lessons by category.
 * Returns lessons for a specific category sorted by sortOrder.
 */
export const getLessonsByCategory = query({
  args: { categoryId: v.string() },
  handler: async (ctx, args) => {
    const category = TUTORIAL_CATEGORIES.find((c) => c.id === args.categoryId);
    if (!category) {
      return {
        found: false,
        category: null,
        lessons: [],
        count: 0,
      };
    }

    const lessons = TUTORIAL_LESSONS.filter((l) => l.category === args.categoryId).sort(
      (a, b) => a.sortOrder - b.sortOrder
    );

    return {
      found: true,
      category,
      lessons,
      count: lessons.length,
      totalMinutes: lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0),
    };
  },
});

/**
 * Get a specific step from a lesson.
 * Returns the step content with navigation info.
 */
export const getLessonStep = query({
  args: {
    lessonId: v.string(),
    stepNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const lesson = TUTORIAL_LESSONS.find((l) => l.id === args.lessonId);
    if (!lesson) {
      return {
        found: false,
        lesson: null,
        step: null,
        navigation: null,
      };
    }

    const step = lesson.steps.find((s) => s.stepNumber === args.stepNumber);
    if (!step) {
      return {
        found: false,
        lesson: { id: lesson.id, title: lesson.title },
        step: null,
        navigation: null,
      };
    }

    return {
      found: true,
      lesson: { id: lesson.id, title: lesson.title, icon: lesson.icon },
      step,
      navigation: {
        totalSteps: lesson.steps.length,
        currentStep: args.stepNumber,
        hasPrevious: args.stepNumber > 1,
        hasNext: args.stepNumber < lesson.steps.length,
        isLastStep: args.stepNumber === lesson.steps.length,
      },
    };
  },
});

/**
 * Get tutorial overview for displaying on the main tutorial page.
 * Returns categories with their lessons for the full table of contents.
 */
export const getTutorialOverview = query({
  args: {},
  handler: async () => {
    const categoriesWithLessons = TUTORIAL_CATEGORIES.map((category) => {
      const lessons = TUTORIAL_LESSONS.filter((l) => l.category === category.id).sort(
        (a, b) => a.sortOrder - b.sortOrder
      );

      return {
        ...category,
        lessons: lessons.map((l) => ({
          id: l.id,
          title: l.title,
          description: l.description,
          icon: l.icon,
          estimatedMinutes: l.estimatedMinutes,
          stepCount: l.steps.length,
          completionBadge: l.completionBadge,
        })),
        lessonCount: lessons.length,
        totalMinutes: lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0),
      };
    }).sort((a, b) => a.sortOrder - b.sortOrder);

    const totalLessons = TUTORIAL_LESSONS.length;
    const totalMinutes = TUTORIAL_LESSONS.reduce((sum, l) => sum + l.estimatedMinutes, 0);
    const totalSteps = TUTORIAL_LESSONS.reduce((sum, l) => sum + l.steps.length, 0);

    return {
      categories: categoriesWithLessons,
      summary: {
        categoryCount: TUTORIAL_CATEGORIES.length,
        lessonCount: totalLessons,
        totalMinutes,
        totalSteps,
      },
    };
  },
});

/**
 * Get lessons that award completion badges.
 * Returns lessons that give badges when completed.
 */
export const getLessonsWithBadges = query({
  args: {},
  handler: async () => {
    const lessonsWithBadges = TUTORIAL_LESSONS.filter((l) => l.completionBadge).map((l) => ({
      lessonId: l.id,
      title: l.title,
      icon: l.icon,
      badgeKey: l.completionBadge,
      category: l.category,
    }));

    return {
      lessons: lessonsWithBadges,
      count: lessonsWithBadges.length,
    };
  },
});

/**
 * Search tutorials by keyword.
 * Searches lesson titles, descriptions, and step content.
 */
export const searchTutorials = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const term = args.searchTerm.toLowerCase().trim();
    if (!term) {
      return {
        results: [],
        count: 0,
      };
    }

    const results: Array<{
      lessonId: string;
      lessonTitle: string;
      lessonIcon: string;
      category: string;
      matchType: 'title' | 'description' | 'content' | 'funFact';
      matchText: string;
    }> = [];

    for (const lesson of TUTORIAL_LESSONS) {
      // Check lesson title
      if (lesson.title.toLowerCase().includes(term)) {
        results.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonIcon: lesson.icon,
          category: lesson.category,
          matchType: 'title',
          matchText: lesson.title,
        });
        continue;
      }

      // Check lesson description
      if (lesson.description.toLowerCase().includes(term)) {
        results.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonIcon: lesson.icon,
          category: lesson.category,
          matchType: 'description',
          matchText: lesson.description,
        });
        continue;
      }

      // Check step content
      for (const step of lesson.steps) {
        if (step.content.toLowerCase().includes(term) || step.title.toLowerCase().includes(term)) {
          results.push({
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            lessonIcon: lesson.icon,
            category: lesson.category,
            matchType: 'content',
            matchText: step.title,
          });
          break; // Only include lesson once
        }
      }

      // Check fun fact
      if (
        lesson.funFact.toLowerCase().includes(term) &&
        !results.some((r) => r.lessonId === lesson.id)
      ) {
        results.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonIcon: lesson.icon,
          category: lesson.category,
          matchType: 'funFact',
          matchText: lesson.funFact,
        });
      }
    }

    return {
      results,
      count: results.length,
    };
  },
});

/**
 * Get recommended next lesson based on completed lessons.
 * For new users, returns the first lesson.
 */
export const getRecommendedLesson = query({
  args: { completedLessonIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const completedSet = new Set(args.completedLessonIds);

    // Sort lessons by recommended order (category sort, then lesson sort)
    const sortedLessons = [...TUTORIAL_LESSONS].sort((a, b) => {
      const catA = TUTORIAL_CATEGORIES.find((c) => c.id === a.category);
      const catB = TUTORIAL_CATEGORIES.find((c) => c.id === b.category);
      const catSortA = catA?.sortOrder ?? 999;
      const catSortB = catB?.sortOrder ?? 999;

      if (catSortA !== catSortB) {
        return catSortA - catSortB;
      }
      return a.sortOrder - b.sortOrder;
    });

    // Find first incomplete lesson
    const nextLesson = sortedLessons.find((l) => !completedSet.has(l.id));

    if (!nextLesson) {
      // All lessons completed!
      return {
        allComplete: true,
        recommendation: null,
        completedCount: args.completedLessonIds.length,
        totalLessons: TUTORIAL_LESSONS.length,
      };
    }

    const category = TUTORIAL_CATEGORIES.find((c) => c.id === nextLesson.category);

    return {
      allComplete: false,
      recommendation: {
        lesson: nextLesson,
        category: category ?? null,
        reason:
          completedSet.size === 0
            ? 'Start your learning journey!'
            : `Continue with ${category?.name ?? 'the next topic'}`,
      },
      completedCount: args.completedLessonIds.length,
      totalLessons: TUTORIAL_LESSONS.length,
    };
  },
});
