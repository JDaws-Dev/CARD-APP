# KidCollect Backend Tasks

## Coding Guidelines

**READ THESE BEFORE STARTING ANY TASK:**

1. **File Focus** - Only modify files in `convex/`, `src/app/api/`, `src/lib/`, and test files. Do NOT modify UI components or pages.

2. **Testing Required** - Every backend change must include tests. Run `npm test` before marking complete.

3. **Type Safety** - Use TypeScript strictly. No `any` types.

4. **Convex Patterns** - Follow existing patterns in `convex/` for mutations and queries.

---

## Backend Tasks

### HIGH PRIORITY - Authentication & Pricing

- [x] Fix activity log to show card names instead of IDs (store cardName in metadata when logging)
- [ ] Implement authentication system with Convex Auth (email/password login)
- [ ] Create parent account registration flow with email verification
- [ ] Build child profile creation (up to 4 per family) with validation
- [ ] Implement parent PIN protection logic (store hashed PIN, verify on access)
- [ ] Create collection value calculation query (sum tcgplayer.prices for all owned cards)
- [ ] Add "most valuable cards" query (return top N cards by market price)

### Card Variants

- [ ] Add card variant tracking to Convex schema (variant field: "normal" | "holofoil" | "reverseHolofoil")
- [ ] Update collection mutations to handle variant parameter
- [ ] Create query to get collection grouped by card+variant

### Achievement System

- [x] Implement set completion badge awarding logic (check on card add, award at 25/50/75/100%)
- [x] Create collector milestone badge awarding (trigger on card count thresholds)
- [x] Build type specialist badge logic (count cards by type, award at 10+)
- [x] Add Pokemon fan badge logic (count specific Pokemon across sets)
- [ ] Implement streak tracking system (track daily activity, award streak badges)
- [ ] Add badge earned date tracking to schema and mutations

### Wishlist & Sharing

- [ ] Create wishlist mutations (add/remove card from wishlist)
- [x] Add priority starring logic (max 5 starred items per profile)
- [ ] Build shareable wishlist link generation (create unique share tokens)
- [ ] Create public wishlist query (fetch by share token, no auth required)

### Family Features

- [x] Create activity log mutations (log card additions with timestamps)
- [x] Build duplicate finder query (compare two profiles, find matching cardIds)
- [ ] Add pricing data fetching from TCGPlayer API

### Testing & Performance

- [x] Write unit tests for achievement awarding logic
- [ ] Write integration tests for collection CRUD operations
- [ ] Implement offline collection caching strategy (service worker setup)
- [ ] Performance optimization (index Convex queries, optimize batch fetches)

---

## Progress

### 2026-01-15: Add priority starring logic (max 5 starred items per profile)
- Added `MAX_PRIORITY_ITEMS = 5` constant to `convex/wishlist.ts`
- Updated `togglePriority` mutation to enforce max 5 limit when toggling ON priority
- Updated `addToWishlist` mutation to check limit when adding with `isPriority: true`
- Added `getPriorityCount` query for UI to display current/remaining slots
- Created `src/lib/wishlist.ts` with pure utility functions (`canAddPriority`, `validatePriorityToggle`, `getPriorityStatus`)
- Added 21 tests in `src/lib/__tests__/wishlist.test.ts`
- All 111 tests pass, linter clean

### 2026-01-15: Create activity log mutations (log card additions with timestamps)
- Created `convex/activityLogs.ts` with full query/mutation support:
  - `getRecentActivity`: Get paginated activity for a profile (newest first)
  - `getActivityByDateRange`: Filter activity by date range
  - `getFamilyActivity`: Get activity across all family profiles (for parent dashboard)
  - `getDailyActivityDates`: Get dates with card_added activity (for streak calculation)
  - `getActivityStats`: Summary stats (total actions, counts by type, first/last activity)
  - `logActivity`: Generic mutation to log any action
  - `logCardAdded`, `logCardRemoved`, `logAchievementEarned`: Typed convenience mutations
  - `clearOldLogs`: Maintenance mutation for cleanup
- Created `src/lib/activityLogs.ts` with utility functions:
  - Date utilities: `timestampToDateString`, `getTodayDateString`, `getYesterdayDateString`, `areConsecutiveDays`, `getStartOfDay`, `getEndOfDay`
  - Streak calculation: `calculateStreak` (returns currentStreak, longestStreak, isActiveToday)
  - Activity summarization: `summarizeActivityByDate`, `getCardAddDates`, `filterLogsByDateRange`, `getLastActivityOfType`, `countActionsByType`
  - Formatting: `formatActionForDisplay`, `formatRelativeTime`
- Added 41 tests in `src/lib/__tests__/activityLogs.test.ts`
- All 152 tests pass, linter clean

### 2026-01-15: Build duplicate finder query (compare two profiles, find matching cardIds)
- Added `findDuplicateCards` query to `convex/collections.ts`:
  - Takes two profileIds and returns cards that exist in both collections
  - Includes quantity and variant breakdown for each profile
  - Validates against comparing a profile with itself
- Added `findTradeableCards` query:
  - Returns cards that fromProfile has but toProfile doesn't
  - Useful for trading suggestions between family members
- Added `getCollectionComparison` query:
  - Returns summary comparison with shared cards, unique cards per profile
  - Includes total quantities and card counts
- Created `src/lib/duplicates.ts` with pure utility functions:
  - `groupCardsByCardId`, `aggregateVariants`: Group and aggregate card data
  - `findDuplicates`, `findTradeableCards`: Core comparison logic
  - `compareCollections`, `getUniqueCardIds`, `getTotalQuantity`: Collection utilities
  - `calculateOverlapPercentage`: Calculate collection similarity
  - `findExcessCards`: Find cards with quantity > 1 (for trade suggestions)
  - `getVariantSummary`: Summarize variant distribution
- Added 35 tests in `src/lib/__tests__/duplicates.test.ts`
- All 190 tests pass, linter clean

### 2026-01-15: Fix activity log to show card names instead of IDs
- Added `getRecentActivityWithNames` query to `convex/activityLogs.ts`:
  - Enriches activity logs with card names from `cachedCards` table
  - Only performs lookups when cardName is missing from metadata
  - Falls back to cardId if card not found in cache
- Added `getFamilyActivityWithNames` query:
  - Same enrichment logic for family-wide activity logs
  - Includes profile names and card names in results
- Created card name extraction utilities in `src/lib/activityLogs.ts`:
  - `getCardNameFromMetadata`: Extract card name with fallback to cardId
  - `getCardIdFromMetadata`: Extract card ID from metadata
  - `hasCardMetadata`: Check if log has card information
  - `buildCardDisplayLabel`: Build display label with variant/quantity
  - `formatVariantForDisplay`: Format variant names (e.g., "reverseHolofoil" → "Reverse Holofoil")
  - `formatActivityLogForDisplay`: Format complete activity log for display
- Added 42 tests in `src/lib/__tests__/activityLogs.test.ts`
- All 279 tests pass, linter clean

### 2026-01-15: Write unit tests for achievement awarding logic
- Created `src/lib/achievements.ts` with pure utility functions for:
  - Milestone badge checking (`checkMilestoneAchievements`, `getHighestMilestone`, `getNextMilestone`)
  - Set completion badge checking (`calculateSetCompletion`, `checkSetCompletionAchievements`, `createSetBadgeKey`, `parseSetBadgeKey`)
  - Type specialist badge checking (`checkTypeSpecialistAchievements`, `getTypeSpecialistKey`, `getTypesWithBadges`)
  - Streak badge checking (`checkStreakAchievements`, `getHighestStreakBadge`)
  - Pokemon fan badge checking (`checkPokemonFanAchievements`)
  - Display utilities (`formatEarnedDate`, `formatEarnedDateRelative`, `sortAchievementsByDate`, `groupAchievementsByCategory`, `countAchievementsByCategory`, `getTotalBadgesForCategory`)
- Exported threshold constants for all achievement types (milestones, set completion, streaks, type specialists, pokemon fans)
- Added 94 tests in `src/lib/__tests__/achievements.test.ts` covering:
  - Achievement constants validation
  - Milestone achievement logic (all thresholds, progress tracking)
  - Set completion achievement logic (percentage calculation, badge awarding)
  - Type specialist achievement logic (threshold checking, nearby badges)
  - Streak achievement logic (day counting, badge awarding)
  - Pokemon fan achievement logic
  - Display utilities (date formatting, sorting, grouping)
  - Integration scenarios (new user journey, set completion journey, streak building)
- All 373 tests pass, linter clean

### 2026-01-15: Implement set completion badge awarding logic
- Added `checkSetCompletionAchievements` mutation to `convex/achievements.ts`:
  - Takes profileId and setId, checks collection completion percentage
  - Awards badges at 25% (set_explorer), 50% (set_adventurer), 75% (set_master), 100% (set_champion)
  - Creates set-specific badge keys (e.g., "sv1_set_explorer")
  - Logs achievement_earned activity with set details
  - Returns awarded badges, completion stats, and set info
- Added `checkAllSetCompletionAchievements` mutation:
  - Batch checks all sets a profile has cards in
  - Returns results per set with newly awarded badges
- Added `getSetCompletionProgress` query:
  - Returns completion percentage, earned badges, and next badge info for UI
- Added utility functions in `src/lib/achievements.ts`:
  - `getSetCompletionBadgesToAward`: Determine which badges to award for a set
  - `getCurrentSetCompletionTier`: Get highest badge tier reached
  - `getNextSetCompletionTier`: Get next badge to earn with percentage needed
  - `cardsNeededForPercentage`: Calculate cards needed to reach a target %
  - `getSetCompletionSummary`: Full progress summary for UI display
  - `isSetComplete`: Check if set is 100% complete
  - `getAllEarnedBadgeKeysForCompletion`: Get all badge keys earned at a completion level
- Added 40 tests in `src/lib/__tests__/achievements.test.ts` for new utilities
- All 413 tests pass, linter clean

### 2026-01-16: Create collector milestone badge awarding (trigger on card count thresholds)
- Enhanced `checkMilestoneAchievements` mutation in `convex/achievements.ts`:
  - Now logs `achievement_earned` activity with badge name, type, and metadata
  - Counts unique cardIds (ignoring variants) for accurate milestone tracking
  - Returns richer response: awarded badges, total unique cards, next milestone info
  - Awards badges at thresholds: 1 (first_catch), 10 (starter_collector), 50 (rising_trainer), 100 (pokemon_trainer), 250 (elite_collector), 500 (pokemon_master), 1000 (legendary_collector)
- Added `getMilestoneProgress` query for UI display:
  - Returns all 7 milestone badges with earned status and progress %
  - Shows current and next milestone with cards needed
  - Calculates percent progress toward next milestone
  - Returns total milestones earned vs available
- Added milestone badge utilities to `src/lib/achievements.ts`:
  - `MILESTONE_BADGE_DEFINITIONS`: Badge keys, names, and thresholds constant
  - `getMilestoneBadgesToAward`: Determine badges to award (excludes already earned)
  - `getMilestoneProgressSummary`: Full progress summary for UI
  - `getMilestoneBadgeDefinition`: Get single badge definition by key
  - `getCurrentMilestoneTitle`: Get friendly name for current level (e.g., "Rising Trainer")
  - `cardsNeededForMilestone`, `getMilestonePercentProgress`: Progress helpers
  - `hasMilestoneBeenReached`, `getAllEarnedMilestoneKeys`, `countEarnedMilestones`
- Added 49 tests in `src/lib/__tests__/achievements.test.ts` covering:
  - MILESTONE_BADGE_DEFINITIONS constant validation
  - getMilestoneBadgesToAward logic (all thresholds, exclusions)
  - getMilestoneProgressSummary (progress tracking, boundary conditions)
  - All individual utility functions
  - Progressive badge collection journey integration test
- All 462 tests pass, linter clean

### 2026-01-16: Build type specialist badge logic (count cards by type, award at 10+)
- Added `checkTypeSpecialistAchievements` mutation to `convex/achievements.ts`:
  - Counts unique cards by Pokemon type from `cachedCards` table
  - Awards badges at 10+ cards threshold for each of 11 types (Fire, Water, Grass, Lightning, Psychic, Fighting, Darkness, Metal, Dragon, Fairy, Colorless)
  - Logs `achievement_earned` activity with badge name, type, count, and threshold
  - Returns awarded badges, type counts, progress for all types, and nearby badges
- Added `getTypeSpecialistProgress` query for UI display:
  - Shows progress for all 11 Pokemon types with earned status and earnedAt timestamp
  - Sorts by progress (earned first, then closest to earning)
  - Identifies nearby badges (types with 1-9 cards) sorted by remaining count
  - Returns summary stats: totalTypeBadgesEarned, totalTypeBadgesAvailable
- Added type specialist badge utilities to `src/lib/achievements.ts`:
  - `TYPE_SPECIALIST_BADGE_DEFINITIONS`: Badge types, keys, and names constant
  - `getTypeSpecialistBadgesToAward`: Determine badges to award (excludes already earned)
  - `getTypeSpecialistProgressSummary`: Full progress summary for UI
  - `getTypeSpecialistBadgeDefinition`, `getTypeSpecialistBadgeForType`: Get single badge definition
  - `cardsNeededForTypeSpecialist`, `getTypeSpecialistPercentProgress`: Progress helpers
  - `hasTypeSpecialistBeenEarned`, `getAllEarnedTypeSpecialistKeys`, `countEarnedTypeSpecialistBadges`
  - `countCardsByType`: Count cards by type from card data (handles multi-type cards)
  - `getNearbyTypeSpecialistBadges`: Get types closest to earning badge
  - `getDominantType`, `getTypeDistribution`: Collection analysis utilities
- Added 75 tests in `src/lib/__tests__/achievements.test.ts` covering:
  - TYPE_SPECIALIST_BADGE_DEFINITIONS constant validation
  - getTypeSpecialistBadgesToAward logic (all thresholds, exclusions)
  - getTypeSpecialistProgressSummary (progress tracking, sorting, nearby badges)
  - All individual utility functions
  - countCardsByType with multi-type cards
  - Progressive badge collection journey integration test
- All 538 tests pass, linter clean

### 2026-01-16: Add Pokemon fan badge logic (count specific Pokemon across sets)
- Added `checkPokemonFanAchievements` mutation to `convex/achievements.ts`:
  - Counts unique cards by Pokemon name from `cachedCards` table
  - Awards badges for specific Pokemon: Pikachu Fan (5+), Eevee Fan (5+), Charizard Fan (3+), Mewtwo Fan (3+), Legendary Fan (10+)
  - Matches card names with variants (V, VMAX, ex, GX, VSTAR, etc.)
  - Eevee badge counts all 9 Eeveelutions (Eevee, Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon, Sylveon)
  - Legendary badge covers 90+ legendary/mythical Pokemon across all generations
  - Logs `achievement_earned` activity with badge name, pokemon, count, and threshold
  - Returns awarded badges, pokemon counts, progress for all categories, and nearby badges
- Added `getPokemonFanProgress` query for UI display:
  - Shows progress for all 5 Pokemon categories with earned status and earnedAt timestamp
  - Sorts by progress (earned first, then closest to earning)
  - Identifies nearby badges (Pokemon with cards but not yet earned) sorted by remaining count
  - Returns summary stats: totalPokemonFanBadgesEarned, totalPokemonFanBadgesAvailable
- Added Pokemon fan badge utilities to `src/lib/achievements.ts`:
  - `POKEMON_FAN_BADGE_DEFINITIONS`: Pokemon categories, keys, names, and thresholds constant
  - `EEVEELUTIONS`: List of Eevee and all 8 evolutions
  - `LEGENDARY_POKEMON`: List of 90+ legendary/mythical Pokemon from Gen 1-9
  - `matchesPokemonName`: Check if card name matches a target Pokemon (handles variants)
  - `isEeveelution`, `isLegendaryPokemon`: Category checking helpers
  - `countPokemonByCategory`: Count cards by Pokemon category from card names
  - `getPokemonFanBadgesToAward`: Determine badges to award (excludes already earned)
  - `getPokemonFanProgressSummary`: Full progress summary for UI
  - `getPokemonFanBadgeDefinition`, `getPokemonFanBadgeForPokemon`: Get single badge definition
  - `cardsNeededForPokemonFan`, `getPokemonFanPercentProgress`: Progress helpers
  - `hasPokemonFanBeenEarned`, `getAllEarnedPokemonFanKeys`, `countEarnedPokemonFanBadges`
  - `getNearbyPokemonFanBadges`: Get Pokemon closest to earning badge
  - `getPokemonWithFanBadges`: Get all Pokemon categories with badges
- Added 92 tests in `src/lib/__tests__/achievements.test.ts` covering:
  - POKEMON_FAN_BADGE_DEFINITIONS, EEVEELUTIONS, LEGENDARY_POKEMON constant validation
  - matchesPokemonName logic (exact match, variants, case insensitivity)
  - isEeveelution, isLegendaryPokemon helper functions
  - countPokemonByCategory (all categories, overlapping counts for Mewtwo/Legendary)
  - getPokemonFanBadgesToAward logic (all thresholds, exclusions)
  - getPokemonFanProgressSummary (progress tracking, sorting, nearby badges)
  - All individual utility functions
  - Progressive badge collection journey integration test
  - Mewtwo/Legendary overlap handling test
- All 630 tests pass, linter clean
