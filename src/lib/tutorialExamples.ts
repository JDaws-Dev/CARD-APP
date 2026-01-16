/**
 * Tutorial Card Examples - Curated card examples for educational tutorials
 * Provides real Pokemon card IDs that illustrate specific concepts like rarity symbols,
 * holo vs non-holo, card conditions, set symbols, and more.
 *
 * Card IDs are for the Pokemon TCG API (pokemontcg.io).
 * This module enables fetching actual card images to make tutorials more visual and engaging.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface TutorialCardExample {
  /** Card ID from Pokemon TCG API (e.g., "sv1-1") */
  cardId: string;
  /** What this card is demonstrating */
  label: string;
  /** Brief explanation of why this card is shown */
  description: string;
  /** Optional highlight - what to look for on the card */
  highlight?: string;
}

export interface TutorialExampleSet {
  /** Unique identifier for this example set */
  id: string;
  /** Title for the example section */
  title: string;
  /** Array of card examples */
  cards: TutorialCardExample[];
  /** Educational note to display with the examples */
  educationalNote?: string;
}

// ============================================================================
// CURATED CARD EXAMPLES
// ============================================================================

/**
 * Cards that demonstrate different rarity symbols and types.
 * Includes Common, Uncommon, Rare, Ultra Rare, and Secret Rare examples.
 */
export const RARITY_EXAMPLES: TutorialExampleSet = {
  id: 'rarity-examples',
  title: 'Card Rarities',
  educationalNote:
    'Look at the symbol at the bottom of each card next to the card number. The symbol tells you how rare the card is!',
  cards: [
    {
      cardId: 'sv1-95', // Tandemaus - Common
      label: 'Common',
      description: 'Common cards have a black circle (●) symbol',
      highlight: 'Look for the ● symbol near the card number',
    },
    {
      cardId: 'sv1-96', // Lechonk - Common
      label: 'Common',
      description: "Commons are the most frequent cards you'll pull",
      highlight: 'The ● circle means this is easy to find',
    },
    {
      cardId: 'sv1-122', // Cyclizar - Uncommon
      label: 'Uncommon',
      description: 'Uncommon cards have a black diamond (◆) symbol',
      highlight: 'The ◆ diamond means this is a bit harder to find',
    },
    {
      cardId: 'sv1-75', // Hawlucha - Uncommon
      label: 'Uncommon',
      description: 'You get about 3 uncommons in each pack',
      highlight: 'Notice the ◆ diamond symbol',
    },
    {
      cardId: 'sv1-84', // Lucario - Rare
      label: 'Rare',
      description: 'Rare cards have a black star (★) symbol',
      highlight: 'The ★ star means this card is special',
    },
    {
      cardId: 'sv1-123', // Squawkabilly - Rare
      label: 'Rare Holo',
      description: 'Rare Holos have a shiny, holographic pattern',
      highlight: 'Look for the ★ star and sparkly surface',
    },
  ],
};

/**
 * Cards comparing holo vs non-holo versions.
 */
export const HOLO_VS_NONHOLO_EXAMPLES: TutorialExampleSet = {
  id: 'holo-vs-nonholo',
  title: 'Holo vs Non-Holo',
  educationalNote:
    'Holographic cards have a shiny, reflective pattern on the artwork or background. They catch the light and sparkle!',
  cards: [
    {
      cardId: 'sv3-137', // Non-holo version
      label: 'Non-Holo',
      description: 'Regular card with no special shine or sparkle',
      highlight: 'The artwork is printed normally without shine',
    },
    {
      cardId: 'sv3-196', // Holo rare version
      label: 'Holographic',
      description: 'The same Pokemon but with a shiny holographic effect',
      highlight: 'Notice how the light reflects off this card differently',
    },
    {
      cardId: 'sv1-197', // Gyarados ex - Full Art
      label: 'Full Art Holo',
      description: 'The entire card artwork has the holographic effect',
      highlight: 'The holo pattern covers the whole card',
    },
  ],
};

/**
 * Cards showing set symbols and how to identify them.
 */
export const SET_SYMBOL_EXAMPLES: TutorialExampleSet = {
  id: 'set-symbols',
  title: 'Set Symbols',
  educationalNote:
    'Every card has a tiny symbol at the bottom that shows which set it belongs to. Cards from the same set share the same symbol!',
  cards: [
    {
      cardId: 'sv1-1', // Scarlet & Violet base set
      label: 'Scarlet & Violet',
      description: 'Look for the SV set symbol at the bottom',
      highlight: 'The set symbol is next to the card number (like "001/198")',
    },
    {
      cardId: 'sv3-1', // Obsidian Flames
      label: 'Obsidian Flames',
      description: 'Different set, different symbol!',
      highlight: 'This card has the Obsidian Flames symbol',
    },
    {
      cardId: 'swsh1-1', // Sword & Shield base set
      label: 'Sword & Shield',
      description: 'Older sets have their own unique symbols',
      highlight: 'The shield shape is the Sword & Shield symbol',
    },
  ],
};

/**
 * Cards showing card numbers and how sets are organized.
 */
export const CARD_NUMBER_EXAMPLES: TutorialExampleSet = {
  id: 'card-numbers',
  title: 'Card Numbers',
  educationalNote:
    'Every card has a number like "025/198" which tells you its position in the set and how many cards are in the set total.',
  cards: [
    {
      cardId: 'sv1-25', // Card #25
      label: 'Card #25',
      description: 'This is the 25th card in the set',
      highlight: 'The number before the slash is the card position',
    },
    {
      cardId: 'sv1-1', // Card #1
      label: 'Card #1',
      description: 'The first card in the set',
      highlight: 'Notice how sets usually start with Grass-type Pokemon',
    },
    {
      cardId: 'sv1-198', // Last regular card
      label: 'Card #198',
      description: 'This is the last numbered card in the set',
      highlight: 'The number after the slash shows the set has 198 cards',
    },
  ],
};

/**
 * Secret rare cards with numbers higher than set total.
 */
export const SECRET_RARE_EXAMPLES: TutorialExampleSet = {
  id: 'secret-rares',
  title: 'Secret Rares',
  educationalNote:
    'Secret Rare cards have a card number HIGHER than the set size! For example, a card numbered "205/198" is a secret rare.',
  cards: [
    {
      cardId: 'sv1-199', // First secret rare
      label: 'Secret Rare',
      description: 'Card #199 in a set of 198 - a secret rare!',
      highlight: 'Notice the number is higher than 198',
    },
    {
      cardId: 'sv1-254', // Gold secret rare
      label: 'Gold Card',
      description: 'Gold border cards are very rare secrets',
      highlight: 'The gold color makes these extra special',
    },
  ],
};

/**
 * Cards demonstrating different Ultra Rare types (ex, V, VMAX, etc.)
 */
export const ULTRA_RARE_EXAMPLES: TutorialExampleSet = {
  id: 'ultra-rares',
  title: 'Ultra Rare Types',
  educationalNote:
    'Ultra Rare cards feature special Pokemon like "ex", "V", "VMAX", and "VSTAR" with powerful attacks and beautiful artwork.',
  cards: [
    {
      cardId: 'sv1-76', // Koraidon ex
      label: 'Pokemon ex',
      description: 'Pokemon ex have powerful attacks but give up 2 prize cards',
      highlight: 'The "ex" in the name means extra powerful!',
    },
    {
      cardId: 'sv1-197', // Miraidon ex Full Art
      label: 'Full Art ex',
      description: 'Full Art cards show the Pokemon in beautiful detail',
      highlight: 'The artwork extends to the edges of the card',
    },
    {
      cardId: 'swsh1-139', // Zacian V
      label: 'Pokemon V',
      description: 'V cards are powerful but older style ultra rares',
      highlight: 'These were popular in Sword & Shield sets',
    },
  ],
};

/**
 * Cards showing different Pokemon types.
 */
export const TYPE_EXAMPLES: TutorialExampleSet = {
  id: 'pokemon-types',
  title: 'Pokemon Types',
  educationalNote:
    'Look at the energy symbol in the top right corner of Pokemon cards - it shows what type the Pokemon is!',
  cards: [
    {
      cardId: 'sv1-1', // Sprigatito - Grass
      label: 'Grass Type',
      description: 'Green leaf symbol = Grass type',
      highlight: 'The leaf energy symbol in the top right',
    },
    {
      cardId: 'sv1-27', // Fuecoco - Fire
      label: 'Fire Type',
      description: 'Orange flame symbol = Fire type',
      highlight: 'The flame energy symbol in the top right',
    },
    {
      cardId: 'sv1-47', // Quaxly - Water
      label: 'Water Type',
      description: 'Blue water drop symbol = Water type',
      highlight: 'The water drop energy symbol',
    },
    {
      cardId: 'sv1-61', // Luxio - Lightning
      label: 'Lightning Type',
      description: 'Yellow lightning bolt = Lightning type',
      highlight: 'The lightning bolt energy symbol',
    },
    {
      cardId: 'sv1-66', // Gardevoir - Psychic
      label: 'Psychic Type',
      description: 'Purple eye symbol = Psychic type',
      highlight: 'The eye-shaped energy symbol',
    },
    {
      cardId: 'sv1-79', // Primeape - Fighting
      label: 'Fighting Type',
      description: 'Orange fist symbol = Fighting type',
      highlight: 'The fist energy symbol',
    },
  ],
};

/**
 * Cards showing evolution chains.
 */
export const EVOLUTION_EXAMPLES: TutorialExampleSet = {
  id: 'evolutions',
  title: 'Evolution Chains',
  educationalNote:
    'Basic Pokemon can evolve into Stage 1, then Stage 2. Keep evolution families together when organizing!',
  cards: [
    {
      cardId: 'sv1-1', // Sprigatito - Basic
      label: 'Basic',
      description: 'This is a Basic Pokemon - the first form',
      highlight: 'The card type says "Basic" at the top',
    },
    {
      cardId: 'sv1-2', // Floragato - Stage 1
      label: 'Stage 1',
      description: 'Stage 1 evolves from a Basic Pokemon',
      highlight: 'See "Evolves from Sprigatito" in the top left',
    },
    {
      cardId: 'sv1-3', // Meowscarada - Stage 2
      label: 'Stage 2',
      description: 'Stage 2 is the final evolution',
      highlight: 'The card says "Stage 2" at the top',
    },
  ],
};

/**
 * Trainer cards showing different Trainer types.
 */
export const TRAINER_EXAMPLES: TutorialExampleSet = {
  id: 'trainer-types',
  title: 'Trainer Cards',
  educationalNote:
    'Trainer cards help you during battle! They include Items, Supporters, and Stadiums.',
  cards: [
    {
      cardId: 'sv1-180', // Nest Ball - Item
      label: 'Item',
      description: 'Items can be played multiple times per turn',
      highlight: 'The card type says "Item"',
    },
    {
      cardId: 'sv1-185', // Professor\'s Research - Supporter
      label: 'Supporter',
      description: 'You can only play one Supporter per turn',
      highlight: 'The card type says "Supporter"',
    },
    {
      cardId: 'sv1-188', // Artazon - Stadium
      label: 'Stadium',
      description: 'Stadiums stay in play and affect both players',
      highlight: 'The card type says "Stadium"',
    },
  ],
};

// ============================================================================
// STEP-SPECIFIC EXAMPLES
// ============================================================================

/**
 * Map of tutorial step IDs to their relevant card examples.
 * These provide visual context for specific tutorial steps.
 */
export const STEP_EXAMPLES: Record<string, TutorialExampleSet> = {
  // organizing-by-set guide
  'organizing-by-set:step-1': SET_SYMBOL_EXAMPLES,
  'organizing-by-set:step-3': CARD_NUMBER_EXAMPLES,

  // organizing-by-type guide
  'organizing-by-type:step-1': TYPE_EXAMPLES,
  'organizing-by-type:step-3': EVOLUTION_EXAMPLES,

  // card-condition guide
  'card-condition:step-1': {
    id: 'nm-examples',
    title: 'Near Mint Examples',
    educationalNote:
      'Near Mint cards look almost perfect - clean edges, sharp corners, no scratches.',
    cards: [
      {
        cardId: 'sv1-84',
        label: 'Near Mint',
        description: 'A perfect condition card with no visible wear',
        highlight: 'Notice the sharp corners and clean edges',
      },
    ],
  },

  // first-collection guide
  'first-collection:step-4': {
    id: 'tracking-examples',
    title: 'Cards to Track',
    educationalNote:
      'When you get new cards, add them to your collection right away so you know what you have!',
    cards: [
      {
        cardId: 'sv1-1',
        label: 'New Card',
        description: 'Mark this card as owned in your collection',
        highlight: 'Tap to add cards to your collection',
      },
      {
        cardId: 'sv1-197',
        label: 'Rare Pull!',
        description: 'Keep track of your rare pulls too!',
        highlight: "Don't forget to add your best cards",
      },
    ],
  },

  // binder-setup-basics guide
  'binder-setup-basics:step-3': CARD_NUMBER_EXAMPLES,
  'binder-setup-basics:step-5': {
    id: 'binder-protection',
    title: 'Cards to Protect',
    educationalNote:
      'Put your valuable cards in penny sleeves before putting them in the binder for extra protection!',
    cards: [
      {
        cardId: 'sv1-197',
        label: 'Valuable Card',
        description: 'This rare card needs a penny sleeve first',
        highlight: 'Ultra rares and holos deserve extra protection',
      },
    ],
  },

  // card-storage guide
  'card-storage:step-3': ULTRA_RARE_EXAMPLES,
};

// ============================================================================
// GUIDE-LEVEL EXAMPLES
// ============================================================================

/**
 * Map of guide IDs to comprehensive example sets shown at the guide level.
 * These provide an overview of concepts covered in the entire guide.
 */
export const GUIDE_EXAMPLES: Record<string, TutorialExampleSet[]> = {
  'organizing-by-set': [SET_SYMBOL_EXAMPLES, CARD_NUMBER_EXAMPLES, SECRET_RARE_EXAMPLES],
  'organizing-by-type': [TYPE_EXAMPLES, EVOLUTION_EXAMPLES],
  'card-condition': [RARITY_EXAMPLES], // Show different rarities for condition context
  'first-collection': [RARITY_EXAMPLES, TYPE_EXAMPLES],
  'binder-setup-basics': [CARD_NUMBER_EXAMPLES, SET_SYMBOL_EXAMPLES],
  'card-storage': [ULTRA_RARE_EXAMPLES, SECRET_RARE_EXAMPLES, HOLO_VS_NONHOLO_EXAMPLES],
  'card-handling': [HOLO_VS_NONHOLO_EXAMPLES],
};

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get example set for a specific tutorial step.
 * @param guideId - The guide ID (e.g., "organizing-by-set")
 * @param stepId - The step ID (e.g., "step-1")
 * @returns TutorialExampleSet or null if no examples for this step
 */
export function getStepExamples(guideId: string, stepId: string): TutorialExampleSet | null {
  const key = `${guideId}:${stepId}`;
  return STEP_EXAMPLES[key] ?? null;
}

/**
 * Get all example sets for a guide.
 * @param guideId - The guide ID
 * @returns Array of TutorialExampleSet or empty array
 */
export function getGuideExamples(guideId: string): TutorialExampleSet[] {
  return GUIDE_EXAMPLES[guideId] ?? [];
}

/**
 * Get all unique card IDs needed for a guide (for batch fetching).
 * @param guideId - The guide ID
 * @returns Array of unique card IDs
 */
export function getGuideCardIds(guideId: string): string[] {
  const cardIds = new Set<string>();

  // Add cards from guide-level examples
  const guideExamples = getGuideExamples(guideId);
  for (const exampleSet of guideExamples) {
    for (const card of exampleSet.cards) {
      cardIds.add(card.cardId);
    }
  }

  // Add cards from step-level examples
  for (const key of Object.keys(STEP_EXAMPLES)) {
    if (key.startsWith(`${guideId}:`)) {
      const exampleSet = STEP_EXAMPLES[key];
      for (const card of exampleSet.cards) {
        cardIds.add(card.cardId);
      }
    }
  }

  return Array.from(cardIds);
}

/**
 * Get card IDs for a specific step (for targeted fetching).
 * @param guideId - The guide ID
 * @param stepId - The step ID
 * @returns Array of card IDs for this step
 */
export function getStepCardIds(guideId: string, stepId: string): string[] {
  const examples = getStepExamples(guideId, stepId);
  if (!examples) return [];
  return examples.cards.map((c) => c.cardId);
}

/**
 * Get a specific example set by ID.
 */
export function getExampleSetById(id: string): TutorialExampleSet | null {
  // Check predefined sets
  const predefinedSets: TutorialExampleSet[] = [
    RARITY_EXAMPLES,
    HOLO_VS_NONHOLO_EXAMPLES,
    SET_SYMBOL_EXAMPLES,
    CARD_NUMBER_EXAMPLES,
    SECRET_RARE_EXAMPLES,
    ULTRA_RARE_EXAMPLES,
    TYPE_EXAMPLES,
    EVOLUTION_EXAMPLES,
    TRAINER_EXAMPLES,
  ];

  return predefinedSets.find((s) => s.id === id) ?? null;
}

/**
 * Get all predefined example sets.
 */
export function getAllExampleSets(): TutorialExampleSet[] {
  return [
    RARITY_EXAMPLES,
    HOLO_VS_NONHOLO_EXAMPLES,
    SET_SYMBOL_EXAMPLES,
    CARD_NUMBER_EXAMPLES,
    SECRET_RARE_EXAMPLES,
    ULTRA_RARE_EXAMPLES,
    TYPE_EXAMPLES,
    EVOLUTION_EXAMPLES,
    TRAINER_EXAMPLES,
  ];
}

/**
 * Check if a guide has any card examples.
 */
export function guideHasExamples(guideId: string): boolean {
  // Check guide-level examples
  if (GUIDE_EXAMPLES[guideId]?.length) return true;

  // Check step-level examples
  for (const key of Object.keys(STEP_EXAMPLES)) {
    if (key.startsWith(`${guideId}:`)) return true;
  }

  return false;
}

/**
 * Check if a specific step has card examples.
 */
export function stepHasExamples(guideId: string, stepId: string): boolean {
  return getStepExamples(guideId, stepId) !== null;
}
