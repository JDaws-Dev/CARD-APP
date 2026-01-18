/**
 * Configuration file for mini-game card URLs and challenge data.
 * This centralizes all hardcoded URLs from the mini-games for easier maintenance.
 */

// ============================================================================
// BASE URL CONFIGURATION
// ============================================================================

export const POKEMON_TCG_IMAGE_BASE_URL = 'https://images.pokemontcg.io';

/**
 * Builds a card image URL from set ID and card number
 */
export function buildCardImageUrl(setId: string, cardNumber: string | number): string {
  return `${POKEMON_TCG_IMAGE_BASE_URL}/${setId}/${cardNumber}.png`;
}

/**
 * Builds a set symbol URL from set ID
 */
export function buildSetSymbolUrl(setId: string): string {
  return `${POKEMON_TCG_IMAGE_BASE_URL}/${setId}/symbol.png`;
}

// ============================================================================
// GRADE LIKE A PRO GAME CHALLENGES
// ============================================================================

export interface GradingChallenge {
  id: string;
  imageUrl: string;
  correctCondition: string;
  hints: string[];
  explanation: string;
}

export const GRADING_CHALLENGES: GradingChallenge[] = [
  {
    id: '1',
    imageUrl: buildCardImageUrl('swsh1', 1),
    correctCondition: 'nm',
    hints: ['Look at the corners carefully', 'Check the edges for whitening'],
    explanation:
      'This card has sharp corners, no whitening on edges, and a clean surface - classic Near Mint!',
  },
  {
    id: '2',
    imageUrl: buildCardImageUrl('swsh1', 25),
    correctCondition: 'lp',
    hints: ['Notice the corner condition', 'Is there any slight wear?'],
    explanation:
      'This card shows tiny edge wear that is barely visible - typical Lightly Played condition.',
  },
  {
    id: '3',
    imageUrl: buildCardImageUrl('swsh1', 50),
    correctCondition: 'mp',
    hints: ['Check the edges', 'Look at the surface'],
    explanation:
      'Visible edge whitening and minor scratches on the surface make this Moderately Played.',
  },
  {
    id: '4',
    imageUrl: buildCardImageUrl('swsh1', 75),
    correctCondition: 'hp',
    hints: ['Are there any creases?', 'Check the corners closely'],
    explanation: 'Heavy corner wear and visible creasing indicate this card is Heavily Played.',
  },
  {
    id: '5',
    imageUrl: buildCardImageUrl('swsh1', 100),
    correctCondition: 'nm',
    hints: ['Fresh from the pack look?', 'Any damage at all?'],
    explanation: 'Perfect corners, pristine edges, flawless surface - this card is Near Mint!',
  },
  {
    id: '6',
    imageUrl: buildCardImageUrl('swsh1', 136),
    correctCondition: 'lp',
    hints: ['Inspect the holo surface', 'Barely noticeable wear'],
    explanation: 'Light surface scratches only visible under direct light - Lightly Played grade.',
  },
  {
    id: '7',
    imageUrl: buildCardImageUrl('swsh1', 150),
    correctCondition: 'mp',
    hints: ['Multiple signs of play', 'Check all edges'],
    explanation:
      'Edge wear on all sides with noticeable scratches - Moderately Played is accurate.',
  },
  {
    id: '8',
    imageUrl: buildCardImageUrl('swsh1', 175),
    correctCondition: 'nm',
    hints: ['Pack fresh quality', 'Examine every detail'],
    explanation: 'No flaws whatsoever - sharp corners, clean edges, perfect surface. Near Mint!',
  },
];

// ============================================================================
// RARITY GUESSING GAME CHALLENGES
// ============================================================================

export interface RarityChallenge {
  id: string;
  imageUrl: string;
  cardName: string;
  correctRarity: string;
  hints: string[];
  explanation: string;
}

export const RARITY_CHALLENGES: RarityChallenge[] = [
  {
    id: '1',
    imageUrl: buildCardImageUrl('swsh1', 1),
    cardName: 'Celebi V',
    correctRarity: 'Ultra Rare',
    hints: ['Look at the card style', 'V cards are special!'],
    explanation:
      'V cards like Celebi V are Ultra Rare! They have the big "V" in the name and special artwork.',
  },
  {
    id: '2',
    imageUrl: buildCardImageUrl('swsh1', 6),
    cardName: 'Caterpie',
    correctRarity: 'Common',
    hints: ['Basic Pokemon', 'Simple border design'],
    explanation:
      'Basic Pokemon like Caterpie with simple artwork and no special effects are usually Common.',
  },
  {
    id: '3',
    imageUrl: buildCardImageUrl('swsh1', 25),
    cardName: 'Cinderace',
    correctRarity: 'Rare Holo',
    hints: ['Stage 2 evolution', 'Notice the shiny effect'],
    explanation: 'Cinderace is a Rare Holo - a rare card with a holographic shine on the artwork!',
  },
  {
    id: '4',
    imageUrl: buildCardImageUrl('swsh1', 50),
    cardName: 'Galarian Sirfetchd',
    correctRarity: 'Rare',
    hints: ['Stage 1 evolution', 'No holographic effect'],
    explanation:
      "This is a Rare card - not common, but doesn't have the holographic shine of a Rare Holo.",
  },
  {
    id: '5',
    imageUrl: buildCardImageUrl('swsh1', 56),
    cardName: 'Lapras',
    correctRarity: 'Uncommon',
    hints: ['Basic Pokemon', 'Slightly better than common'],
    explanation:
      'Lapras here is Uncommon - more valuable than Common but not quite Rare. Look for the diamond symbol!',
  },
  {
    id: '6',
    imageUrl: buildCardImageUrl('swsh1', 136),
    cardName: 'Zacian V',
    correctRarity: 'Ultra Rare',
    hints: ['Legendary Pokemon V', 'Full art style'],
    explanation: 'Zacian V is an Ultra Rare! V Pokemon are always special and valuable.',
  },
  {
    id: '7',
    imageUrl: buildCardImageUrl('swsh1', 192),
    cardName: 'Marnie',
    correctRarity: 'Secret Rare',
    hints: ['Full art trainer', 'Special alternate art'],
    explanation:
      'Full art trainer cards with special artwork like this Marnie are Secret Rare - the rarest!',
  },
  {
    id: '8',
    imageUrl: buildCardImageUrl('swsh1', 95),
    cardName: 'Snorlax',
    correctRarity: 'Rare Holo',
    hints: ['Popular Pokemon', 'Holographic shine'],
    explanation:
      "Snorlax with holographic artwork is a Rare Holo - you can tell by the sparkle when you tilt it!",
  },
];

// ============================================================================
// PRICE ESTIMATION GAME CHALLENGES
// ============================================================================

export interface PriceChallenge {
  id: string;
  imageUrl: string;
  cardName: string;
  setName: string;
  actualPrice: number;
  askPrice: number;
  hints: string[];
  explanation: string;
}

export const PRICE_CHALLENGES: PriceChallenge[] = [
  {
    id: '1',
    imageUrl: buildCardImageUrl('swsh1', 25),
    cardName: 'Cinderace',
    setName: 'Sword & Shield Base',
    actualPrice: 0.85,
    askPrice: 2.0,
    hints: ['This is a regular rare card', 'Base set cards are widely available'],
    explanation: 'Regular rare cards from base sets typically sell for under $2. This Cinderace is worth about $0.85.',
  },
  {
    id: '2',
    imageUrl: buildCardImageUrl('swsh35', 73),
    cardName: 'Pikachu VMAX',
    setName: "Champion's Path",
    actualPrice: 8.50,
    askPrice: 5.0,
    hints: ['VMAX cards are usually valuable', 'Pikachu is a very popular Pokemon'],
    explanation: "Pikachu VMAX from Champion's Path is worth around $8.50. Pikachu cards and VMAX cards both hold value well!",
  },
  {
    id: '3',
    imageUrl: buildCardImageUrl('swsh45sv', 'SV122'),
    cardName: 'Charizard VMAX',
    setName: 'Shining Fates',
    actualPrice: 85.0,
    askPrice: 50.0,
    hints: ['Shiny Charizard cards are extremely sought after', 'This is from a special shiny vault set'],
    explanation: 'Shiny Charizard VMAX is one of the most valuable modern cards at around $85! Charizard cards are always in high demand.',
  },
  {
    id: '4',
    imageUrl: buildCardImageUrl('swsh1', 136),
    cardName: 'Marnie',
    setName: 'Sword & Shield Base',
    actualPrice: 3.50,
    askPrice: 5.0,
    hints: ['Trainer cards are usually less valuable than Pokemon', 'This is a regular rare version'],
    explanation: 'Regular rare trainer cards like Marnie are typically worth $2-5. The full art versions are worth much more!',
  },
  {
    id: '5',
    imageUrl: buildCardImageUrl('swsh4', 188),
    cardName: 'Pikachu V Full Art',
    setName: 'Vivid Voltage',
    actualPrice: 12.0,
    askPrice: 8.0,
    hints: ['Full art cards have special artwork', 'Pikachu is the most iconic Pokemon'],
    explanation: 'Pikachu V Full Art is worth about $12. Full art cards with popular Pokemon tend to hold their value.',
  },
  {
    id: '6',
    imageUrl: buildCardImageUrl('swsh1', 56),
    cardName: 'Lapras',
    setName: 'Sword & Shield Base',
    actualPrice: 0.25,
    askPrice: 1.0,
    hints: ['Common and uncommon cards have low value', 'Base set cards were printed in huge quantities'],
    explanation: 'Regular uncommon cards like this Lapras are only worth about $0.25. Most common cards are worth even less!',
  },
  {
    id: '7',
    imageUrl: buildCardImageUrl('swsh7', 215),
    cardName: 'Umbreon VMAX Alt Art',
    setName: 'Evolving Skies',
    actualPrice: 280.0,
    askPrice: 150.0,
    hints: ['Alternate art cards are the rarest', 'Umbreon is one of the most popular Eeveelutions'],
    explanation: 'Umbreon VMAX Alternate Art is worth around $280! Alt art cards from Evolving Skies are extremely valuable.',
  },
  {
    id: '8',
    imageUrl: buildCardImageUrl('swsh35', 50),
    cardName: 'Alcremie V',
    setName: "Champion's Path",
    actualPrice: 1.50,
    askPrice: 3.0,
    hints: ['Not all V cards are valuable', 'Lesser-known Pokemon hold less value'],
    explanation: "Alcremie V is only worth about $1.50. V cards of less popular Pokemon don't hold as much value.",
  },
  {
    id: '9',
    imageUrl: buildCardImageUrl('swsh9', 172),
    cardName: 'Arceus VSTAR Rainbow',
    setName: 'Brilliant Stars',
    actualPrice: 45.0,
    askPrice: 30.0,
    hints: ['Rainbow rare cards are very special', 'Arceus is a legendary Pokemon'],
    explanation: 'Arceus VSTAR Rainbow is worth about $45. Rainbow rares of popular Pokemon are always sought after!',
  },
  {
    id: '10',
    imageUrl: buildCardImageUrl('swsh1', 128),
    cardName: 'Copperajah',
    setName: 'Sword & Shield Base',
    actualPrice: 0.50,
    askPrice: 2.0,
    hints: ['Holo rare cards are a step above regular rares', 'Newer Pokemon are less popular with collectors'],
    explanation: "Copperajah holo is worth about $0.50. Even holo cards of less popular Pokemon aren't very valuable.",
  },
  {
    id: '11',
    imageUrl: buildCardImageUrl('swsh45', 107),
    cardName: 'Eevee',
    setName: 'Shiny Star V',
    actualPrice: 4.0,
    askPrice: 2.0,
    hints: ['Shiny Pokemon cards are more valuable', 'Eevee is beloved by collectors'],
    explanation: 'Shiny Eevee cards are worth around $4. Even common Pokemon are more valuable as shinies!',
  },
  {
    id: '12',
    imageUrl: buildCardImageUrl('swsh6', 166),
    cardName: 'Moltres V Full Art',
    setName: 'Chilling Reign',
    actualPrice: 7.0,
    askPrice: 10.0,
    hints: ['Legendary birds are popular', 'Full art V cards vary in value'],
    explanation: 'Moltres V Full Art is worth about $7. Not all legendary Pokemon hold premium value.',
  },
];

// ============================================================================
// POKEMON TYPE QUIZ CHALLENGES
// ============================================================================

export interface TypeQuizChallenge {
  id: string;
  imageUrl: string;
  pokemonName: string;
  correctType: string;
  secondaryType?: string;
  hints: string[];
  explanation: string;
}

export const TYPE_QUIZ_CHALLENGES: TypeQuizChallenge[] = [
  {
    id: '1',
    imageUrl: buildCardImageUrl('swsh1', 25),
    pokemonName: 'Cinderace',
    correctType: 'Fire',
    hints: ['This Pokemon evolves from Scorbunny', 'It has a flame on its feet'],
    explanation: 'Cinderace is a Fire-type Pokemon! It uses its powerful legs to kick flaming soccer balls at opponents.',
  },
  {
    id: '2',
    imageUrl: buildCardImageUrl('swsh1', 56),
    pokemonName: 'Lapras',
    correctType: 'Water',
    hints: ['Known as the Transport Pokemon', 'Lives in the ocean'],
    explanation: 'Lapras is a Water-type Pokemon! Its gentle nature makes it perfect for carrying people across the sea.',
  },
  {
    id: '3',
    imageUrl: buildCardImageUrl('swsh1', 11),
    pokemonName: 'Rillaboom',
    correctType: 'Grass',
    hints: ['Plays a drum made from a tree stump', 'Final evolution of Grookey'],
    explanation: 'Rillaboom is a Grass-type Pokemon! It uses its drum to control the roots of its tree and attack.',
  },
  {
    id: '4',
    imageUrl: buildCardImageUrl('swsh1', 67),
    pokemonName: 'Boltund',
    correctType: 'Electric',
    hints: ['Evolves from Yamper', 'Can run at incredible speeds'],
    explanation: 'Boltund is an Electric-type Pokemon! It generates electricity by running and stores it in its legs.',
  },
  {
    id: '5',
    imageUrl: buildCardImageUrl('swsh1', 83),
    pokemonName: 'Hatterene',
    correctType: 'Psychic',
    hints: ['Known as the Silent Pokemon', 'Has a witch-like appearance'],
    explanation: 'Hatterene is a Psychic-type Pokemon! It can sense emotions and attacks anything that emits hostility.',
  },
  {
    id: '6',
    imageUrl: buildCardImageUrl('swsh1', 99),
    pokemonName: 'Machamp',
    correctType: 'Fighting',
    hints: ['Has four powerful arms', 'Master of all martial arts'],
    explanation: 'Machamp is a Fighting-type Pokemon! With four arms, it can throw 500 punches per second.',
  },
  {
    id: '7',
    imageUrl: buildCardImageUrl('swsh1', 117),
    pokemonName: 'Grimmsnarl',
    correctType: 'Darkness',
    hints: ['Uses its hair like muscles', 'Has a mischievous nature'],
    explanation: 'Grimmsnarl is a Darkness-type Pokemon! It wraps its body in hair that it can control like extra limbs.',
  },
  {
    id: '8',
    imageUrl: buildCardImageUrl('swsh1', 128),
    pokemonName: 'Copperajah',
    correctType: 'Metal',
    hints: ['Based on an elephant', 'Its body is made of oxidized copper'],
    explanation: 'Copperajah is a Metal-type Pokemon! Its green color comes from oxidized copper like the Statue of Liberty.',
  },
  {
    id: '9',
    imageUrl: buildCardImageUrl('swsh1', 138),
    pokemonName: 'Duraludon',
    correctType: 'Dragon',
    hints: ['Looks like a skyscraper', 'Lives in caves and mountains'],
    explanation: 'Duraludon is a Dragon-type Pokemon! Its body is made of light but sturdy metal alloy.',
  },
  {
    id: '10',
    imageUrl: buildCardImageUrl('swsh1', 150),
    pokemonName: 'Indeedee',
    correctType: 'Colorless',
    hints: ['Works as a butler Pokemon', 'Has psychic powers but normal typing on this card'],
    explanation: 'This Indeedee card is Colorless type! In the TCG, some Pokemon have different types than in the video games.',
  },
  {
    id: '11',
    imageUrl: buildCardImageUrl('swsh1', 2),
    pokemonName: 'Celebi V',
    correctType: 'Grass',
    hints: ['A mythical Pokemon', 'Guardian of the forest'],
    explanation: 'Celebi V is a Grass-type Pokemon! This time-traveling Pokemon protects forests across time.',
  },
  {
    id: '12',
    imageUrl: buildCardImageUrl('swsh1', 41),
    pokemonName: 'Inteleon',
    correctType: 'Water',
    hints: ['Evolves from Sobble', 'A secret agent Pokemon'],
    explanation: 'Inteleon is a Water-type Pokemon! It uses water hidden in its fingers like a sniper.',
  },
];

// ============================================================================
// SET SYMBOL MATCHING GAME DATA
// ============================================================================

export interface SetSymbolData {
  id: string;
  symbolUrl: string;
  setName: string;
  setId: string;
  releaseYear: string;
  hint: string;
}

export const SET_SYMBOL_DATA: SetSymbolData[] = [
  {
    id: 'swsh1',
    symbolUrl: buildSetSymbolUrl('swsh1'),
    setName: 'Sword & Shield',
    setId: 'swsh1',
    releaseYear: '2020',
    hint: 'The first set of the Sword & Shield era!',
  },
  {
    id: 'swsh12pt5',
    symbolUrl: buildSetSymbolUrl('swsh12pt5'),
    setName: 'Crown Zenith',
    setId: 'swsh12pt5',
    releaseYear: '2023',
    hint: 'The final special set of the Sword & Shield era.',
  },
  {
    id: 'sv1',
    symbolUrl: buildSetSymbolUrl('sv1'),
    setName: 'Scarlet & Violet',
    setId: 'sv1',
    releaseYear: '2023',
    hint: 'The first set of the Scarlet & Violet era!',
  },
  {
    id: 'sv2',
    symbolUrl: buildSetSymbolUrl('sv2'),
    setName: 'Paldea Evolved',
    setId: 'sv2',
    releaseYear: '2023',
    hint: 'The second main set of Scarlet & Violet.',
  },
  {
    id: 'sv3',
    symbolUrl: buildSetSymbolUrl('sv3'),
    setName: 'Obsidian Flames',
    setId: 'sv3',
    releaseYear: '2023',
    hint: 'Features Charizard ex on the cover!',
  },
  {
    id: 'sv4',
    symbolUrl: buildSetSymbolUrl('sv4'),
    setName: 'Paradox Rift',
    setId: 'sv4',
    releaseYear: '2023',
    hint: 'Features ancient and future Pokemon!',
  },
  {
    id: 'sv5',
    symbolUrl: buildSetSymbolUrl('sv5'),
    setName: 'Temporal Forces',
    setId: 'sv5',
    releaseYear: '2024',
    hint: 'Features walking wake and iron leaves!',
  },
  {
    id: 'swsh9',
    symbolUrl: buildSetSymbolUrl('swsh9'),
    setName: 'Brilliant Stars',
    setId: 'swsh9',
    releaseYear: '2022',
    hint: 'Introduced the Trainer Gallery subset!',
  },
  {
    id: 'swsh10',
    symbolUrl: buildSetSymbolUrl('swsh10'),
    setName: 'Astral Radiance',
    setId: 'swsh10',
    releaseYear: '2022',
    hint: 'Features Dialga and Palkia origin forms!',
  },
  {
    id: 'swsh11',
    symbolUrl: buildSetSymbolUrl('swsh11'),
    setName: 'Lost Origin',
    setId: 'swsh11',
    releaseYear: '2022',
    hint: 'Brought back the Lost Zone mechanic!',
  },
  {
    id: 'swsh12',
    symbolUrl: buildSetSymbolUrl('swsh12'),
    setName: 'Silver Tempest',
    setId: 'swsh12',
    releaseYear: '2022',
    hint: 'Features Lugia VSTAR!',
  },
  {
    id: 'swsh7',
    symbolUrl: buildSetSymbolUrl('swsh7'),
    setName: 'Evolving Skies',
    setId: 'swsh7',
    releaseYear: '2021',
    hint: 'Famous for its Eeveelution alt arts!',
  },
];
