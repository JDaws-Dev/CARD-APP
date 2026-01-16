/**
 * Japanese Promo Support
 *
 * Provides detection and categorization utilities for Japanese promotional Pokemon cards.
 * Japanese promos have distinct patterns from English promos and often have unique sources:
 * - Magazine promos (CoroCoro, V-Jump, etc.)
 * - Tournament/event promos
 * - Movie promos
 * - Store/retailer exclusives
 * - Pre-release/promotional campaign cards
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Japanese promo sources/categories
 */
export type JapanesePromoCategory =
  | 'magazine' // CoroCoro, V-Jump, etc.
  | 'tournament' // Pokemon World Championships, Gym events, etc.
  | 'movie' // Theatrical film promos
  | 'store' // Pokemon Center, 7-Eleven, etc.
  | 'campaign' // McDonald's, special campaigns
  | 'prerelease' // Japanese pre-release events
  | 'prize' // Competition prizes, lottery cards
  | 'other'; // Unknown or uncategorized

/**
 * Japanese promo source information
 */
export interface JapanesePromoSource {
  category: JapanesePromoCategory;
  source: string; // Specific source name
  displayName: string; // User-friendly display name
  description: string; // Brief description for tooltips
}

/**
 * Japanese promo detection result
 */
export interface JapanesePromoInfo {
  isJapanesePromo: boolean;
  category: JapanesePromoCategory | null;
  source: JapanesePromoSource | null;
  confidence: 'high' | 'medium' | 'low';
  detectionMethod: string; // How the promo was detected
}

/**
 * Card data interface (simplified for detection)
 */
export interface CardForPromoDetection {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  set?: {
    id: string;
    name: string;
  };
  nationalPokedexNumbers?: number[];
  regulationMark?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Japanese promo set ID patterns
 * These are set IDs that typically contain Japanese promos
 */
export const JAPANESE_PROMO_SET_PATTERNS = [
  // Specific Japanese promo sets
  /^svp$/i, // Scarlet & Violet promos (may include JP)
  /^swshp$/i, // Sword & Shield promos (may include JP)
  /^smp$/i, // Sun & Moon promos (may include JP)
  /^xyp$/i, // XY promos (may include JP)
  /^bwp$/i, // Black & White promos (may include JP)
  // Japanese-specific patterns
  /^.*-jp$/i, // Cards with -jp suffix
  /^jp-/i, // Cards with jp- prefix
  /^.*_jp$/i, // Cards with _jp suffix
] as const;

/**
 * Japanese promo card number patterns
 * Japanese promos often have specific numbering conventions
 */
export const JAPANESE_PROMO_NUMBER_PATTERNS: {
  pattern: RegExp;
  category: JapanesePromoCategory;
  source: string;
}[] = [
  // CoroCoro promos (numbered with /C prefix or suffix)
  { pattern: /^\d+\/C$/i, category: 'magazine', source: 'CoroCoro Comic' },
  { pattern: /^C\/\d+$/i, category: 'magazine', source: 'CoroCoro Comic' },
  { pattern: /^CORO\d+/i, category: 'magazine', source: 'CoroCoro Comic' },

  // V-Jump promos
  { pattern: /^VJ-?\d+/i, category: 'magazine', source: 'V-Jump' },
  { pattern: /^\d+\/VJ$/i, category: 'magazine', source: 'V-Jump' },

  // Monthly magazine promos
  { pattern: /^PMAG-?\d+/i, category: 'magazine', source: 'Pokemon Magazine' },

  // Movie promos (often have M prefix or movie year)
  { pattern: /^M\d{2}-/i, category: 'movie', source: 'Movie Promo' },
  { pattern: /^MOVIE\d+/i, category: 'movie', source: 'Movie Promo' },
  { pattern: /^\d{4}M-/i, category: 'movie', source: 'Movie Promo' },

  // Pokemon Center exclusives
  { pattern: /^PC-?\d+/i, category: 'store', source: 'Pokemon Center' },
  { pattern: /^PCTR-?\d+/i, category: 'store', source: 'Pokemon Center' },

  // 7-Eleven Japan promos
  { pattern: /^7-?\d+/i, category: 'store', source: '7-Eleven Japan' },
  { pattern: /^SEJ-?\d+/i, category: 'store', source: '7-Eleven Japan' },

  // Lawson promos
  { pattern: /^LAWSON-?\d+/i, category: 'store', source: 'Lawson' },
  { pattern: /^LS-?\d+/i, category: 'store', source: 'Lawson' },

  // Tournament/competition promos
  { pattern: /^WCS-?\d+/i, category: 'tournament', source: 'World Championships' },
  { pattern: /^JCS-?\d+/i, category: 'tournament', source: 'Japan Championships' },
  { pattern: /^GYM-?\d+/i, category: 'tournament', source: 'Gym Battle' },
  { pattern: /^CHAMP-?\d+/i, category: 'tournament', source: 'Champion Prize' },
  { pattern: /^LEAGUE-?\d+/i, category: 'tournament', source: 'Pokemon League' },

  // Campaign promos
  { pattern: /^MCD-?\d+/i, category: 'campaign', source: "McDonald's Japan" },
  { pattern: /^CAMP-?\d+/i, category: 'campaign', source: 'Campaign Promo' },

  // Pre-release promos
  { pattern: /^PR-?\d+/i, category: 'prerelease', source: 'Pre-release' },
  { pattern: /^PRERELEASE/i, category: 'prerelease', source: 'Pre-release' },

  // Prize cards
  { pattern: /^PRIZE-?\d+/i, category: 'prize', source: 'Prize Card' },
  { pattern: /^TROPHY-?\d+/i, category: 'prize', source: 'Trophy Card' },
  { pattern: /^ILLUS-?\d+/i, category: 'prize', source: 'Illustration Contest' },

  // Japanese number format (katakana/hiragana markers)
  { pattern: /^\d+-JP$/i, category: 'other', source: 'Japanese Release' },
  { pattern: /^JP-\d+$/i, category: 'other', source: 'Japanese Release' },
];

/**
 * Known Japanese promo sources with full details
 */
export const JAPANESE_PROMO_SOURCES: Record<string, JapanesePromoSource> = {
  corocoro: {
    category: 'magazine',
    source: 'corocoro',
    displayName: 'CoroCoro Comic',
    description: 'Monthly manga magazine promos, often featuring exclusive illustrations',
  },
  vjump: {
    category: 'magazine',
    source: 'vjump',
    displayName: 'V-Jump',
    description: 'Monthly gaming magazine promos',
  },
  pokemon_magazine: {
    category: 'magazine',
    source: 'pokemon_magazine',
    displayName: 'Pokemon Magazine',
    description: 'Official Pokemon magazine exclusive cards',
  },
  pokemon_center: {
    category: 'store',
    source: 'pokemon_center',
    displayName: 'Pokemon Center',
    description: 'Exclusive to Pokemon Center stores in Japan',
  },
  seven_eleven: {
    category: 'store',
    source: 'seven_eleven',
    displayName: '7-Eleven Japan',
    description: 'Convenience store exclusive promos',
  },
  lawson: {
    category: 'store',
    source: 'lawson',
    displayName: 'Lawson',
    description: 'Lawson convenience store exclusive promos',
  },
  movie: {
    category: 'movie',
    source: 'movie',
    displayName: 'Movie Promo',
    description: 'Distributed at theatrical Pokemon film releases',
  },
  world_championships: {
    category: 'tournament',
    source: 'world_championships',
    displayName: 'World Championships',
    description: 'Pokemon World Championships exclusive cards',
  },
  japan_championships: {
    category: 'tournament',
    source: 'japan_championships',
    displayName: 'Japan Championships',
    description: 'Japan National Championships exclusive cards',
  },
  gym_battle: {
    category: 'tournament',
    source: 'gym_battle',
    displayName: 'Gym Battle',
    description: 'Gym Battle event participation promos',
  },
  pokemon_league: {
    category: 'tournament',
    source: 'pokemon_league',
    displayName: 'Pokemon League',
    description: 'Pokemon League participation rewards',
  },
  mcdonalds: {
    category: 'campaign',
    source: 'mcdonalds',
    displayName: "McDonald's Japan",
    description: "McDonald's Happy Meal Japan exclusive promos",
  },
  prerelease: {
    category: 'prerelease',
    source: 'prerelease',
    displayName: 'Pre-release',
    description: 'Japanese pre-release event exclusive cards',
  },
  illustration_contest: {
    category: 'prize',
    source: 'illustration_contest',
    displayName: 'Illustration Contest',
    description: 'Illustration contest winner/prize cards',
  },
  trophy: {
    category: 'prize',
    source: 'trophy',
    displayName: 'Trophy Card',
    description: 'Tournament winner trophy cards',
  },
};

/**
 * Japanese promo category display information
 */
export const PROMO_CATEGORY_INFO: Record<
  JapanesePromoCategory,
  { displayName: string; icon: string; description: string }
> = {
  magazine: {
    displayName: 'Magazine Promo',
    icon: '📰',
    description: 'Cards distributed with Japanese magazines',
  },
  tournament: {
    displayName: 'Tournament Promo',
    icon: '🏆',
    description: 'Cards from tournaments and competitive events',
  },
  movie: {
    displayName: 'Movie Promo',
    icon: '🎬',
    description: 'Cards distributed at Japanese theatrical releases',
  },
  store: {
    displayName: 'Store Exclusive',
    icon: '🏪',
    description: 'Cards exclusive to specific Japanese retailers',
  },
  campaign: {
    displayName: 'Campaign Promo',
    icon: '🎁',
    description: 'Cards from promotional campaigns and partnerships',
  },
  prerelease: {
    displayName: 'Pre-release',
    icon: '⭐',
    description: 'Japanese pre-release event cards',
  },
  prize: {
    displayName: 'Prize Card',
    icon: '🥇',
    description: 'Competition prize and contest winner cards',
  },
  other: {
    displayName: 'Japanese Promo',
    icon: '🇯🇵',
    description: 'Other Japanese promotional cards',
  },
};

/**
 * Keywords that indicate a Japanese promo in card name or set name
 */
export const JAPANESE_PROMO_KEYWORDS = [
  'japan',
  'japanese',
  'jp promo',
  'corocoro',
  'v-jump',
  'vjump',
  'pokemon center',
  'pctr',
  'japanese exclusive',
  '7-eleven',
  'lawson',
  'mcdonalds japan',
  'world championships japan',
  'wcs japan',
  'japan championships',
  'jcs',
  'gym battle',
  'movie promo',
  'theatrical',
  'jp release',
] as const;

// =============================================================================
// DETECTION FUNCTIONS
// =============================================================================

/**
 * Detect if a card is a Japanese promo based on its number pattern
 */
export function detectByNumberPattern(cardNumber: string): {
  isMatch: boolean;
  category: JapanesePromoCategory | null;
  source: string | null;
} {
  if (!cardNumber) {
    return { isMatch: false, category: null, source: null };
  }

  for (const { pattern, category, source } of JAPANESE_PROMO_NUMBER_PATTERNS) {
    if (pattern.test(cardNumber)) {
      return { isMatch: true, category, source };
    }
  }

  return { isMatch: false, category: null, source: null };
}

/**
 * Detect if a card is a Japanese promo based on set ID
 */
export function detectBySetId(setId: string): boolean {
  if (!setId) return false;

  return JAPANESE_PROMO_SET_PATTERNS.some((pattern) => pattern.test(setId));
}

/**
 * Detect if a card is a Japanese promo based on keywords in name/set
 */
export function detectByKeywords(
  cardName: string,
  setName?: string
): { isMatch: boolean; matchedKeyword: string | null } {
  const searchText = `${cardName} ${setName || ''}`.toLowerCase();

  for (const keyword of JAPANESE_PROMO_KEYWORDS) {
    if (searchText.includes(keyword.toLowerCase())) {
      return { isMatch: true, matchedKeyword: keyword };
    }
  }

  return { isMatch: false, matchedKeyword: null };
}

/**
 * Check if a card number indicates a Japanese promo format
 * Japanese promos often use specific numbering conventions
 */
export function hasJapanesePromoNumberFormat(cardNumber: string): boolean {
  if (!cardNumber) return false;

  // Japanese promos often have specific patterns
  const japanesePatterns = [
    /^\d{3}\/[A-Z]+-[A-Z]$/, // Like 001/S-P format
    /^[A-Z]{2,}-[A-Z]?\d+$/i, // Like SM-P001, XY-P001 format (requires 2+ letters before dash)
    /^[A-Z]{3,}\d{2,3}$/i, // Like PROMO001 (requires 3+ letters)
    /^[A-Z]\/\d+$/i, // Like C/001
    /-JP$/i, // Ending with -JP
    /^JP-/i, // Starting with JP-
  ];

  return japanesePatterns.some((pattern) => pattern.test(cardNumber));
}

/**
 * Comprehensive Japanese promo detection
 * Uses multiple detection methods and returns confidence level
 */
export function detectJapanesePromo(card: CardForPromoDetection): JapanesePromoInfo {
  const detectionMethods: string[] = [];
  let category: JapanesePromoCategory | null = null;
  let source: JapanesePromoSource | null = null;
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // Method 1: Check card number pattern
  const numberResult = detectByNumberPattern(card.number);
  if (numberResult.isMatch) {
    detectionMethods.push('number_pattern');
    category = numberResult.category;
    if (numberResult.source && category) {
      const sourceKey = numberResult.source.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const detectedCategory = category; // TypeScript narrowing helper
      source =
        JAPANESE_PROMO_SOURCES[sourceKey] ||
        createSourceFromCategory(detectedCategory, numberResult.source);
    }
    confidence = 'high';
  }

  // Method 2: Check set ID
  if (card.set && detectBySetId(card.set.id)) {
    detectionMethods.push('set_id');
    if (!category) {
      category = 'other';
      confidence = 'medium';
    }
  }

  // Method 3: Check keywords
  const keywordResult = detectByKeywords(card.name, card.set?.name);
  if (keywordResult.isMatch) {
    detectionMethods.push('keyword');
    if (!category) {
      category = categorizeFromKeyword(keywordResult.matchedKeyword!);
      confidence = 'medium';
    }
  }

  // Method 4: Check number format
  if (hasJapanesePromoNumberFormat(card.number)) {
    detectionMethods.push('number_format');
    if (!category) {
      category = 'other';
      confidence = 'low';
    }
  }

  // Determine if it's a Japanese promo
  const isJapanesePromo = detectionMethods.length > 0;

  // If no source was determined but we have a category, create a generic source
  if (isJapanesePromo && !source && category) {
    source = createSourceFromCategory(category);
  }

  return {
    isJapanesePromo,
    category: isJapanesePromo ? category : null,
    source: isJapanesePromo ? source : null,
    confidence: isJapanesePromo ? confidence : 'low',
    detectionMethod: detectionMethods.length > 0 ? detectionMethods.join(', ') : 'none',
  };
}

// =============================================================================
// CATEGORIZATION HELPERS
// =============================================================================

/**
 * Create a source object from a category
 */
function createSourceFromCategory(
  category: JapanesePromoCategory,
  sourceName?: string
): JapanesePromoSource {
  const info = PROMO_CATEGORY_INFO[category];
  return {
    category,
    source: sourceName?.toLowerCase().replace(/[^a-z0-9]/g, '_') || category,
    displayName: sourceName || info.displayName,
    description: info.description,
  };
}

/**
 * Determine category from matched keyword
 */
function categorizeFromKeyword(keyword: string): JapanesePromoCategory {
  const keywordLower = keyword.toLowerCase();

  if (['corocoro', 'v-jump', 'vjump'].includes(keywordLower)) {
    return 'magazine';
  }
  if (['pokemon center', 'pctr', '7-eleven', 'lawson'].some((k) => keywordLower.includes(k))) {
    return 'store';
  }
  if (['movie', 'theatrical'].some((k) => keywordLower.includes(k))) {
    return 'movie';
  }
  if (
    ['championship', 'wcs', 'jcs', 'gym battle', 'tournament', 'world championships'].some((k) =>
      keywordLower.includes(k)
    )
  ) {
    return 'tournament';
  }
  if (['mcdonalds', 'campaign'].some((k) => keywordLower.includes(k))) {
    return 'campaign';
  }

  return 'other';
}

/**
 * Get the display name for a promo category
 */
export function getCategoryDisplayName(category: JapanesePromoCategory): string {
  return PROMO_CATEGORY_INFO[category]?.displayName || 'Japanese Promo';
}

/**
 * Get the icon for a promo category
 */
export function getCategoryIcon(category: JapanesePromoCategory): string {
  return PROMO_CATEGORY_INFO[category]?.icon || '🇯🇵';
}

/**
 * Get the description for a promo category
 */
export function getCategoryDescription(category: JapanesePromoCategory): string {
  return PROMO_CATEGORY_INFO[category]?.description || 'Japanese promotional card';
}

/**
 * Get the source info by source key
 */
export function getSourceInfo(sourceKey: string): JapanesePromoSource | null {
  return JAPANESE_PROMO_SOURCES[sourceKey] || null;
}

/**
 * Get all sources for a given category
 */
export function getSourcesForCategory(category: JapanesePromoCategory): JapanesePromoSource[] {
  return Object.values(JAPANESE_PROMO_SOURCES).filter((source) => source.category === category);
}

/**
 * Get all promo categories
 */
export function getAllCategories(): JapanesePromoCategory[] {
  return Object.keys(PROMO_CATEGORY_INFO) as JapanesePromoCategory[];
}

/**
 * Get all category info
 */
export function getAllCategoryInfo(): Array<{
  category: JapanesePromoCategory;
  displayName: string;
  icon: string;
  description: string;
}> {
  return getAllCategories().map((category) => ({
    category,
    ...PROMO_CATEGORY_INFO[category],
  }));
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Format Japanese promo info for display
 */
export function formatPromoForDisplay(info: JapanesePromoInfo): string {
  if (!info.isJapanesePromo) {
    return '';
  }

  if (info.source) {
    return info.source.displayName;
  }

  if (info.category) {
    return getCategoryDisplayName(info.category);
  }

  return 'Japanese Promo';
}

/**
 * Get a tooltip-friendly string for Japanese promo info
 */
export function getPromoTooltip(info: JapanesePromoInfo): string {
  if (!info.isJapanesePromo) {
    return '';
  }

  const lines: string[] = [];

  if (info.source) {
    lines.push(info.source.displayName);
    lines.push(info.source.description);
  } else if (info.category) {
    lines.push(getCategoryDisplayName(info.category));
    lines.push(getCategoryDescription(info.category));
  }

  if (info.confidence !== 'high') {
    lines.push(`(${info.confidence} confidence)`);
  }

  return lines.join('\n');
}

/**
 * Get a short label for a Japanese promo card
 */
export function getPromoLabel(info: JapanesePromoInfo): string {
  if (!info.isJapanesePromo) {
    return '';
  }

  // For high confidence, use specific source abbreviation
  if (info.confidence === 'high' && info.source) {
    const abbreviations: Record<string, string> = {
      corocoro: 'CC',
      corocoro_comic: 'CC',
      vjump: 'VJ',
      v_jump: 'VJ',
      pokemon_center: 'PC',
      seven_eleven: '7-11',
      '7_eleven_japan': '7-11',
      lawson: 'LS',
      movie: 'MOVIE',
      movie_promo: 'MOVIE',
      world_championships: 'WCS',
      japan_championships: 'JCS',
      gym_battle: 'GYM',
      pokemon_league: 'LEAGUE',
      mcdonalds: 'MCD',
      mcdonald_s_japan: 'MCD',
      prerelease: 'PR',
      pre_release: 'PR',
      illustration_contest: 'ILLUS',
      trophy: 'TROPHY',
      trophy_card: 'TROPHY',
      prize_card: 'PRIZE',
      champion_prize: 'CHAMP',
    };
    return abbreviations[info.source.source] || 'JP';
  }

  // For medium/low confidence, use category abbreviation
  const categoryAbbreviations: Record<JapanesePromoCategory, string> = {
    magazine: 'MAG',
    tournament: 'TOURN',
    movie: 'MOVIE',
    store: 'STORE',
    campaign: 'PROMO',
    prerelease: 'PR',
    prize: 'PRIZE',
    other: 'JP',
  };

  return categoryAbbreviations[info.category || 'other'];
}

/**
 * Check if a promo is collectible (valuable/sought-after)
 */
export function isCollectiblePromo(info: JapanesePromoInfo): boolean {
  if (!info.isJapanesePromo) {
    return false;
  }

  // Prize cards and tournament cards are generally more collectible
  const collectibleCategories: JapanesePromoCategory[] = ['prize', 'tournament', 'movie'];

  return info.category !== null && collectibleCategories.includes(info.category);
}

/**
 * Get the rarity tier for a Japanese promo
 * Returns a relative rarity based on source
 */
export function getPromoRarityTier(
  info: JapanesePromoInfo
): 'common' | 'uncommon' | 'rare' | 'ultra-rare' | null {
  if (!info.isJapanesePromo) {
    return null;
  }

  // Prize and trophy cards are ultra-rare
  if (info.category === 'prize') {
    return 'ultra-rare';
  }

  // Tournament exclusives are rare
  if (info.category === 'tournament') {
    return 'rare';
  }

  // Movie promos are uncommon (distributed widely at theaters)
  if (info.category === 'movie') {
    return 'uncommon';
  }

  // Store exclusives vary, default to uncommon
  if (info.category === 'store') {
    return 'uncommon';
  }

  // Magazine promos are common (large print runs)
  if (info.category === 'magazine') {
    return 'common';
  }

  // Campaign promos are common (promotional distribution)
  if (info.category === 'campaign') {
    return 'common';
  }

  return 'uncommon';
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

/**
 * Detect Japanese promos in a batch of cards
 */
export function detectJapanesePromosInBatch(
  cards: CardForPromoDetection[]
): Map<string, JapanesePromoInfo> {
  const results = new Map<string, JapanesePromoInfo>();

  for (const card of cards) {
    results.set(card.id, detectJapanesePromo(card));
  }

  return results;
}

/**
 * Filter cards to only Japanese promos
 */
export function filterJapanesePromos(cards: CardForPromoDetection[]): CardForPromoDetection[] {
  return cards.filter((card) => detectJapanesePromo(card).isJapanesePromo);
}

/**
 * Group cards by Japanese promo category
 */
export function groupByPromoCategory(
  cards: CardForPromoDetection[]
): Map<JapanesePromoCategory | 'non-promo', CardForPromoDetection[]> {
  const groups = new Map<JapanesePromoCategory | 'non-promo', CardForPromoDetection[]>();

  for (const card of cards) {
    const info = detectJapanesePromo(card);
    const key = info.isJapanesePromo ? info.category || 'other' : 'non-promo';

    const existing = groups.get(key) || [];
    existing.push(card);
    groups.set(key, existing);
  }

  return groups;
}

/**
 * Count Japanese promos by category
 */
export function countByCategory(
  cards: CardForPromoDetection[]
): Record<JapanesePromoCategory | 'non-promo', number> {
  const counts: Record<JapanesePromoCategory | 'non-promo', number> = {
    magazine: 0,
    tournament: 0,
    movie: 0,
    store: 0,
    campaign: 0,
    prerelease: 0,
    prize: 0,
    other: 0,
    'non-promo': 0,
  };

  for (const card of cards) {
    const info = detectJapanesePromo(card);
    if (info.isJapanesePromo) {
      counts[info.category || 'other']++;
    } else {
      counts['non-promo']++;
    }
  }

  return counts;
}

/**
 * Get statistics about Japanese promos in a collection
 */
export function getPromoStats(cards: CardForPromoDetection[]): {
  totalCards: number;
  japanesePromos: number;
  byCategory: Record<JapanesePromoCategory, number>;
  byConfidence: { high: number; medium: number; low: number };
  collectibleCount: number;
} {
  const stats = {
    totalCards: cards.length,
    japanesePromos: 0,
    byCategory: {
      magazine: 0,
      tournament: 0,
      movie: 0,
      store: 0,
      campaign: 0,
      prerelease: 0,
      prize: 0,
      other: 0,
    } as Record<JapanesePromoCategory, number>,
    byConfidence: { high: 0, medium: 0, low: 0 },
    collectibleCount: 0,
  };

  for (const card of cards) {
    const info = detectJapanesePromo(card);
    if (info.isJapanesePromo) {
      stats.japanesePromos++;
      if (info.category) {
        stats.byCategory[info.category]++;
      }
      stats.byConfidence[info.confidence]++;
      if (isCollectiblePromo(info)) {
        stats.collectibleCount++;
      }
    }
  }

  return stats;
}
