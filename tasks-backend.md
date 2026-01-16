# CardDex Backend Tasks

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
- [x] **Profile type field** - Add `profileType: "parent" | "child"` to profiles schema for role-based UI
- [x] **Get current user profile query** - Return profile with type for header/dashboard routing
- [x] **Kid dashboard stats query** - Return collection count, badge count, current streak, recent activity for dashboard
- [ ] Create collection value calculation query (sum tcgplayer.prices for all owned cards)
- [ ] Add "most valuable cards" query (return top N cards by market price)

### Card Variants

- [x] Add card variant tracking to Convex schema (variant field: "normal" | "holofoil" | "reverseHolofoil")
- [x] Update collection mutations to handle variant parameter
- [x] Create query to get collection grouped by card+variant

### Achievement System

- [x] Implement set completion badge awarding logic (check on card add, award at 25/50/75/100%)
- [x] Create collector milestone badge awarding (trigger on card count thresholds)
- [x] Build type specialist badge logic (count cards by type, award at 10+)
- [x] Add Pokemon fan badge logic (count specific Pokemon across sets)
- [x] Implement streak tracking system (track daily activity, award streak badges)
- [x] Add badge earned date tracking to schema and mutations

### Wishlist & Sharing

- [x] Create wishlist mutations (add/remove card from wishlist) - `addToWishlist`, `removeFromWishlist` in convex/wishlist.ts
- [x] Add priority starring logic (max 5 starred items per profile) - `togglePriority` with MAX_PRIORITY_ITEMS
- [x] Build shareable wishlist link generation (create unique share tokens) - `createShareLink` generates 12-char tokens
- [x] Create public wishlist query (fetch by share token, no auth required) - `getWishlistByToken` with expiry check

### Family Features

- [x] Create activity log mutations (log card additions with timestamps)
- [x] Build duplicate finder query (compare two profiles, find matching cardIds)
- [ ] Add pricing data fetching from TCGPlayer API

### Testing & Performance

- [x] Write unit tests for achievement awarding logic
- [x] Write integration tests for collection CRUD operations
- [ ] Implement offline collection caching strategy (service worker setup)
- [ ] Performance optimization (index Convex queries, optimize batch fetches)

### Data Persistence & Sync

- [ ] Cloud backup/sync system - Automatic backup to prevent collection loss (major competitor complaint)
- [ ] Data persistence guarantee - Never lose collection data when switching phones/devices
- [ ] Conflict resolution - Handle sync conflicts when same account used on multiple devices

### Multi-TCG Architecture

Add `games` table to Convex schema with fields: id, slug, display_name, api_source, primary_color, is_active, release_order

- [ ] Add `games` table to Convex schema (slug: pokemon/yugioh/onepiece/dragonball/lorcana/digimon/mtg, display_name, api_source, primary_color, is_active, release_order)
- [ ] Add `profile_games` junction table (profile_id, game_id, enabled_at) - Track which games each profile collects
- [ ] Add game_id field to cachedSets table - Link sets to games
- [ ] Add game_id field to cachedCards table - Link cards to games
- [ ] Create game-agnostic API abstraction in src/lib/tcg-api.ts - Unified fetch interface that routes to correct API based on game
- [ ] API adapter for YGOPRODeck (src/lib/yugioh-api.ts) - Yu-Gi-Oh! cards, 20 req/sec rate limit
- [ ] API adapter for OPTCG API (src/lib/onepiece-api.ts) - One Piece cards
- [ ] API adapter for ApiTCG (src/lib/dragonball-api.ts) - Dragon Ball Fusion World cards
- [ ] API adapter for Lorcast (src/lib/lorcana-api.ts) - Disney Lorcana cards, 10 req/sec rate limit
- [ ] API adapter for DigimonCard.io (src/lib/digimon-api.ts) - Digimon cards, 15 req/10sec rate limit
- [ ] API adapter for Scryfall (src/lib/mtg-api.ts) - Magic: The Gathering cards, 10 req/sec rate limit
- [ ] Evaluate unified APIs - Test if ApiTCG.com or JustTCG can replace multiple adapters

### Gamification Backend

- [x] Level-up system - Add XP field to profiles, XP tracking mutations, level calculation logic (XP for adding cards/completing sets/daily logins)
- [ ] Unlockable avatar items - Schema for avatar items (hats, frames, badges), earned items tracking, avatar customization queries
- [x] Collection milestones tracking - Detect first 10, 50, 100, 500 cards and return milestone data for celebrations

### Educational Content

- [ ] Tutorial content storage - Schema and queries for "Learn to Collect" tutorial content
- [x] Rarity definitions - Store rarity explanations with examples for tooltips
- [x] Card condition guide content - NM/LP/MP/HP definitions and example images

### Additional Features

- [ ] Japanese promo support - Proper detection and categorization of Japanese promos
- [x] "New in collection" tracking - Query for cards added in last 7 days
- [x] Random card query - Return random card from user's collection
- [ ] Rarity filter support - Add rarity indexing for efficient filtering
- [ ] Fair trading calculator - Price comparison logic for "Is this trade fair?" tool

### Launch Prep

- [ ] Free tier limitations - Enforce 3 sets max, 1 child profile for free tier
- [ ] Subscription validation - Check subscription status before premium features
- [ ] TCGPlayer affiliate link generation - Add affiliate tracking to wishlist share links
- [ ] Stripe subscription integration - Payment processing for Family tier ($4.99/mo or $39.99/yr)
- [ ] Set up production environment - Vercel deployment configuration
- [ ] Configure environment variables - Production secrets and API keys
- [ ] Set up error monitoring (Sentry) - Error tracking and alerting
- [ ] Set up analytics (Plausible or PostHog) - Usage tracking, kid-safe analytics
- [ ] Write E2E tests - Critical user flows (add card, create wishlist, share link)

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

### 2026-01-16: Implement streak tracking system (track daily activity, award streak badges)

- Added `checkStreakAchievements` mutation to `convex/achievements.ts`:
  - Calculates streak from card_added activity logs (last 60 days)
  - Awards badges at streak thresholds: streak_3 (3 days), streak_7 (7 days), streak_14 (14 days), streak_30 (30 days)
  - Uses `calculateStreakFromDates` helper to compute current streak, longest streak, isActiveToday
  - Logs `achievement_earned` activity with badge name, streak days, and threshold
  - Returns awarded badges, streak info, and next badge progress
- Added `getStreakProgress` query for UI display:
  - Returns current streak, longest streak, isActiveToday, lastActiveDate
  - Shows progress for all 4 streak badges with earned status and earnedAt timestamp
  - Includes current and next badge info with days needed
  - Returns activity dates array for calendar display
  - Returns summary stats: totalStreakBadgesEarned, totalStreakBadgesAvailable
- Added streak badge utilities to `src/lib/achievements.ts`:
  - `STREAK_BADGE_DEFINITIONS`: Badge keys, names, and thresholds constant
  - `getStreakBadgesToAward`: Determine badges to award (excludes already earned)
  - `getStreakProgressSummary`: Full progress summary for UI
  - `getStreakBadgeDefinition`: Get single badge definition by key
  - `getCurrentStreakTitle`: Get friendly name for current level (e.g., "Week Warrior")
  - `daysNeededForStreakBadge`, `getStreakPercentProgress`: Progress helpers
  - `hasStreakBadgeBeenEarned`, `getAllEarnedStreakKeys`, `countEarnedStreakBadges`
  - `getNextStreakBadge`, `getStreakBadgeThresholds`: Badge navigation helpers
  - `isStreakActive`: Check if streak is still active (today or yesterday)
  - `getStreakStatusMessage`: Get motivational message based on streak state
  - `formatStreakCount`: Format streak count for display ("7 days", "1 day")
- Added 82 tests in `src/lib/__tests__/achievements.test.ts` covering:
  - STREAK_BADGE_DEFINITIONS constant validation
  - getStreakBadgesToAward logic (all thresholds, exclusions)
  - getStreakProgressSummary (progress tracking, current/longest streak)
  - All individual utility functions
  - isStreakActive with today/yesterday/older dates
  - getStreakStatusMessage for various streak states
  - Streak building journey integration test
  - Edge cases: exactly at threshold, one below, very long streaks
- All 700 tests pass, linter clean

### 2026-01-16: Add badge earned date tracking to schema and mutations

- Added new Convex queries to `convex/achievements.ts`:
  - `getAchievementsWithDates`: Returns all achievements sorted by earnedAt (newest first) with enriched data
    - Includes formatted date (e.g., "Jan 15, 2026") and relative date (e.g., "2 days ago")
    - Includes badge info (name, description, icon, color) from ACHIEVEMENT_DEFINITIONS
    - Groups by category for summary stats
  - `getRecentlyEarnedAchievements`: Get achievements earned in last N days (configurable)
    - Supports limit and sinceDays parameters
    - Useful for notifications and celebration displays
  - `getAchievementEarnedDate`: Get the earned date for a specific achievement key
    - Returns null if not earned, or earnedAt with formatted/relative dates
  - `getAchievementTimeline`: Returns achievements grouped by date for history view
    - Groups by date string (YYYY-MM-DD), sorted newest first
    - Returns timeline array with date, formattedDate, achievements, and count
    - Includes firstEarnedDate and mostRecentDate summary
  - Added helper functions: `formatDateForDisplay`, `formatRelativeDate`, `groupByCategory`
- Added date tracking utilities to `src/lib/achievements.ts`:
  - Types: `AchievementWithDate`, `AchievementTimeline`, `EarnedDateInfo`, `AchievementDateStats`
  - `getEarnedDateInfo`: Get detailed info about earned date (isToday, isThisWeek, isThisMonth, daysSinceEarned)
  - `enrichAchievementsWithDates`: Add formatted and relative dates to achievement list
  - `groupAchievementsByDate`: Group achievements by date for timeline display
  - `filterAchievementsByDateRange`: Filter achievements within a date range
  - `getRecentAchievements`: Get achievements from last N days
  - `getMostRecentAchievement`, `getFirstEarnedAchievement`: Find oldest/newest
  - `getAchievementsEarnedToday`, `getAchievementsEarnedThisWeek`, `getAchievementsEarnedThisMonth`
  - `getAverageTimeBetweenAchievements`: Calculate avg days between badge earns
  - `getAchievementDateStats`: Comprehensive stats (total, first/most recent dates, counts by period)
  - `formatDateRange`: Format date ranges for display (handles same month, same year, different years)
  - `getDateString`, `isSameDay`, `getDaysSinceEarned`, `wasEarnedRecently`: Utility helpers
- Added 53 tests in `src/lib/__tests__/achievements.test.ts` covering:
  - getEarnedDateInfo with various time offsets (now, 1 hour, 1 day, 2 weeks, 1 month)
  - enrichAchievementsWithDates output
  - groupAchievementsByDate grouping and sorting
  - filterAchievementsByDateRange with various ranges
  - getRecentAchievements filtering and sorting
  - getMostRecentAchievement and getFirstEarnedAchievement edge cases
  - getAchievementsEarnedToday, getAchievementsEarnedThisWeek, getAchievementsEarnedThisMonth
  - getAverageTimeBetweenAchievements calculation
  - getAchievementDateStats comprehensive stats
  - formatDateRange for same month, same year, different year scenarios
  - getDateString, isSameDay, getDaysSinceEarned, wasEarnedRecently utilities
- All 737 tests pass, linter clean

### 2026-01-16: Write integration tests for collection CRUD operations

- Created `src/lib/collections.ts` with pure utility functions for:
  - Validation: `isValidVariant`, `isValidCardId`, `isValidQuantity`
  - Extraction: `extractSetId`, `extractCardNumber`
  - Query logic: `getCollectionStats`, `checkCardOwnership`, `filterBySet`, `groupCardsByCardId`, `getUniqueCardIds`, `countCardsBySet`
  - CRUD operations: `addCardToCollection`, `removeCardFromCollection`, `updateCardQuantity`, `decrementCardQuantity`, `incrementCardQuantity`
  - Collection comparison: `findSharedCards`, `findUniqueCards`, `mergeCollections`
  - Sorting: `sortByCardId`, `sortByQuantity`, `sortBySetAndNumber`
- Defined types: `CardVariant`, `CollectionCard`, `CardOwnership`, `CollectionStats`, `GroupedCard`
- Exported constants: `DEFAULT_VARIANT`, `VALID_VARIANTS`
- Added 69 integration tests in `src/lib/__tests__/collections.test.ts` covering:
  - Constants validation
  - All validation functions (isValidVariant, isValidCardId, isValidQuantity)
  - Card ID parsing (extractSetId, extractCardNumber)
  - Query functions (getCollectionStats, checkCardOwnership, filterBySet, groupCardsByCardId)
  - CRUD operations with full coverage:
    - CREATE: addCardToCollection (new card, duplicate, variants, quantity updates)
    - READ: checkCardOwnership, getUniqueCardIds, countCardsBySet
    - UPDATE: updateCardQuantity, incrementCardQuantity, decrementCardQuantity
    - DELETE: removeCardFromCollection (specific variant, all variants)
  - Collection comparison (findSharedCards, findUniqueCards, mergeCollections)
  - Sorting functions (by cardId, quantity, set+number)
  - Integration scenarios: collection building over time, trading between siblings, variant tracking, set completion tracking
  - Edge cases: large quantities, all variant types
- All 806 tests pass, linter clean

### 2026-01-16: Create query to get collection grouped by card+variant

- Added `getCollectionGroupedByVariant` query to `convex/collections.ts`:
  - Returns cards with enriched data (name, imageSmall, setId) from cachedCards table
  - Each unique (cardId, variant) pair is a separate entry
  - Includes summary with totalEntries, totalQuantity, uniqueCards, and variantBreakdown
  - Sorted by cardId then variant for consistent ordering
- Added `getCollectionByCard` query:
  - Groups cards by cardId with all variants aggregated in a single object
  - Returns totalQuantity and variants record for each unique card
  - Includes enriched name, imageSmall, setId from cache
- Added variant grouping utilities to `src/lib/collections.ts`:
  - Types: `EnrichedCollectionCard`, `GroupedCardWithData`, `VariantSummary`
  - `VARIANT_DISPLAY_NAMES` constant and `getVariantDisplayName` function
  - `groupCollectionByVariant`: Convert collection to enriched format
  - `enrichWithNames`: Add names from a name map to enriched cards
  - `calculateVariantSummary`: Get variant distribution stats
  - `getUsedVariants`: Get list of variants present in collection
  - `filterByVariant`: Filter collection to specific variant type
  - `sortByVariant`, `sortByCardIdThenVariant`: Sort with variant ordering
  - `groupCardsByCardIdWithDetails`: Group by cardId with full variant breakdown
  - `countByVariant`, `quantityByVariant`: Get counts/quantities by variant type
  - `hasVariant`: Check if variant exists in collection
  - `getAllVariantsOfCard`, `getTotalQuantityOfCard`: Get variant data for specific card
- Added 68 tests in `src/lib/__tests__/collections.test.ts` covering:
  - VARIANT_DISPLAY_NAMES constant validation
  - All variant grouping functions
  - Sorting by variant order
  - Integration scenarios: displaying collection by variant, filtering collection view, complete variant statistics
- All 843 tests pass, linter clean

### 2026-01-16: Add "New in collection" tracking query

- Added `getNewlyAddedCards` query to `convex/collections.ts`:
  - Returns cards added in the last N days (default 7) with enriched data
  - Includes card name, image, set, rarity, variant, quantity, addedAt timestamp
  - Joins activity logs with cachedCards for card details
  - Returns summary stats: totalAdditions, uniqueCards, daysSearched, oldest/newest addition
- Added `getNewlyAddedCardsSummary` query:
  - Returns daily summaries grouped by date for calendar/activity display
  - Includes additionCount, uniqueCardsCount, totalQuantity per day
  - Returns totals with daysWithActivity count
- Added `hasNewCards` query:
  - Lightweight query for showing "New!" badge in UI
  - Returns hasNew boolean and count of additions in time window
- Added utility functions to `src/lib/collections.ts`:
  - Types: `CardAdditionLog`, `NewlyAddedCard`, `NewlyAddedSummary`, `DailyAdditionSummary`
  - Constants: `DEFAULT_NEW_CARDS_DAYS` (7), `MAX_NEW_CARDS_DAYS` (30)
  - `getCutoffTimestamp`: Calculate cutoff for N days ago
  - `filterRecentCardAdditions`: Filter activity logs to card_added events within window
  - `extractCardAddition`, `parseCardAdditions`: Parse activity log metadata
  - `groupAdditionsByDate`, `getDailySummaries`: Group by date for calendar display
  - `calculateNewlyAddedSummary`: Get summary stats for additions
  - `getUniqueCardIdsFromAdditions`: Get unique card IDs
  - `enrichCardAdditions`: Add card details from cache lookup
  - `isWithinNewWindow`: Check if timestamp is within "new" window
  - `formatAddedAtRelative`, `formatAddedAtAbsolute`: Display formatting helpers
  - `sortByAddedAt`, `groupNewlyAddedByDay`, `countNewCardsBySet`: Sorting and grouping
  - `getNewCardsBadgeText`, `hasAnyNewCards`: UI display helpers
- Added 67 tests in `src/lib/__tests__/collections.test.ts` covering:
  - Constants validation (DEFAULT_NEW_CARDS_DAYS, MAX_NEW_CARDS_DAYS)
  - getCutoffTimestamp calculations for various day counts
  - filterRecentCardAdditions filtering logic with mixed log types
  - extractCardAddition parsing with defaults for missing fields
  - parseCardAdditions with logs missing cardId
  - groupAdditionsByDate grouping and counting (unique cards, total quantity)
  - getDailySummaries sorting by date descending
  - calculateNewlyAddedSummary stats (oldest/newest addition, unique cards)
  - getUniqueCardIdsFromAdditions deduplication
  - enrichCardAdditions with card data map and fallbacks
  - isWithinNewWindow with default and custom day parameters
  - formatAddedAtRelative (just now, minutes, hours, yesterday, days ago, absolute fallback)
  - formatAddedAtAbsolute date formatting
  - sortByAddedAt ascending/descending, non-mutating
  - groupNewlyAddedByDay grouping
  - countNewCardsBySet counting
  - getNewCardsBadgeText formatting (singular/plural)
  - hasAnyNewCards boolean check
  - Integration scenarios: processing activity logs, daily activity summary, badge display, time window detection
- All 898 tests pass, linter clean

### 2026-01-16: Add random card query for collection

- Added `getRandomCard` query to `convex/collections.ts`:
  - Returns a random card from the user's collection
  - Optionally filter by setId to get random card from specific set
  - Optionally filter by variant (normal, holofoil, reverseHolofoil, etc.)
  - Returns enriched data: cardId, variant, quantity, name, imageSmall, imageLarge, setId, rarity, types
- Added `getRandomCards` query for multiple random cards:
  - Returns N random cards (default 3) for "Featured Cards" or "Random Picks" display
  - Uses Fisher-Yates shuffle for efficient random selection
  - Supports allowDuplicates option (default false)
  - Respects setId and variant filters
- Added utility functions to `src/lib/collections.ts`:
  - Types: `RandomCardResult`, `RandomCardOptions`
  - `filterCollectionCards`: Filter by setId and/or variant
  - `selectRandomItem`: Generic function to select random item from array
  - `selectRandomCard`: Select single random card with filters
  - `shuffleArray`, `shuffleCopy`: Fisher-Yates shuffle implementations
  - `selectRandomCards`: Select multiple random cards
  - `hasEnoughCards`, `maxRandomCards`: Validation helpers
  - `validateRandomCardOptions`: Validate options before selection
  - `enrichRandomCard`, `enrichRandomCards`: Enrich with cached card data
  - `getRandomCardMessage`: Generate fun message for gamification (e.g., "You got a Holofoil Pikachu!")
  - `cardSelectionProbability`: Calculate probability of selecting specific card
  - `estimateInclusionProbability`: Monte Carlo simulation for inclusion probability
- Added 58 tests in `src/lib/__tests__/collections.test.ts` covering:
  - filterCollectionCards (all filters, empty collection, combined filters)
  - selectRandomItem (empty, single, multiple items)
  - selectRandomCard (with and without filters)
  - shuffleArray, shuffleCopy (mutation testing, element preservation)
  - selectRandomCards (count, duplicates, filters, uniqueness)
  - hasEnoughCards, maxRandomCards
  - validateRandomCardOptions (valid options, invalid count/variant)
  - enrichRandomCard, enrichRandomCards (with and without cached data)
  - getRandomCardMessage (normal vs special variants)
  - cardSelectionProbability (edge cases, multiple occurrences)
  - Integration scenarios: Featured Cards Display, Random Card from Set, Holofoil Random Selection, Empty Collection Handling, Single Card Collection
- All 956 tests pass, linter clean

### 2026-01-16: Add kid dashboard stats query

- Added `getKidDashboardStats` query to `convex/profiles.ts`:
  - Returns complete dashboard stats for a kid profile in a single query
  - Collection stats: uniqueCards, totalCards, setsStarted
  - Badge stats: total count, recentlyEarned (last 7 days)
  - Streak info: currentStreak, longestStreak, isActiveToday, lastActiveDate
  - Recent activity: last 10 actions with enriched display text, icons, and relative timestamps
  - Enriches activity logs with card names from cachedCards table
  - Includes profile info (displayName, avatarUrl)
- Added helper functions: `calculateStreakFromDates`, `formatRelativeTime`
- Created `src/lib/dashboardStats.ts` with pure utility functions:
  - Collection stats: `calculateCollectionStats`, `extractSetId`
  - Badge stats: `calculateBadgeStats` with configurable recentDays
  - Streak calculation: `areConsecutiveDays`, `calculateStreak`, `extractActivityDates`, `getTodayDateString`, `getYesterdayDateString`, `timestampToDateString`
  - Activity formatting: `formatRelativeTime`, `getActivityIcon`, `formatActivityForDisplay`, `formatActivitiesForDisplay`
  - Dashboard composition: `calculateDashboardStats`
  - Streak helpers: `getStreakStatusMessage`, `isStreakAtRisk`, `formatStreakDisplay`
- Exported types: `CollectionStats`, `BadgeStats`, `StreakInfo`, `ActivityLogEntry`, `EnrichedActivity`, `DashboardStats`, `CollectionCard`, `Achievement`
- Added 53 tests in `src/lib/__tests__/dashboardStats.test.ts` covering:
  - extractSetId parsing
  - calculateCollectionStats (empty, unique cards, totals, sets)
  - calculateBadgeStats (total, recentlyEarned, custom days)
  - areConsecutiveDays (consecutive, non-consecutive, boundaries)
  - calculateStreak (empty, today, yesterday, broken, longest vs current)
  - extractActivityDates (unique, filtered, sorted)
  - formatRelativeTime (just now, minutes, hours, days)
  - getActivityIcon (all action types)
  - formatActivityForDisplay (card_added, card_removed, achievement_earned, name lookups)
  - calculateDashboardStats integration
  - Streak helpers (status messages, at risk detection, display formatting)
  - Integration scenarios: New User, Active Collector, Streak at Risk
- All 959 tests pass, linter clean

### 2026-01-16: Profile type field and Get current user profile query

- Profile type field already existed in schema (`profileType: v.union(v.literal('parent'), v.literal('child'))` in `convex/schema.ts`)
- Added `getCurrentUserProfile` query to `convex/profiles.ts`:
  - Gets authenticated user via `getAuthUserId` from `@convex-dev/auth/server`
  - Looks up user's email, finds family by email, returns profiles
  - Returns profile with type for header/dashboard routing
  - Supports optional `profileId` parameter for profile selection
  - Returns: current profile, family info (with subscription tier), available profiles, and user auth info
- Added `isUserAuthenticated` query:
  - Lightweight query for checking auth state
  - Returns `isAuthenticated` boolean and `userId`
- Added `getCurrentUserProfiles` query:
  - Returns all profiles available to the authenticated user
  - Includes family subscription info
  - Profiles sorted: parent first, then children alphabetically
- Added helper functions to `src/lib/profiles.ts`:
  - Types: `SubscriptionTier`, `FamilyInfo`, `UserInfo`, `ProfileSummary`, `CurrentUserProfileResult`
  - Access checks: `hasParentAccess`, `isChildView`, `canAccessParentFeatures`
  - Routing: `getDashboardRoute`, `getHeaderStyle`
  - Profile switching: `canSwitchProfiles`, `getOtherProfiles`, `findProfileById`
  - Subscription helpers: `isSubscriptionActive`, `hasFamilySubscription`, `getDaysUntilExpiration`, `getSubscriptionStatusMessage`
  - Profile lookup: `getParentProfileFromResult`, `getChildProfilesFromResult`
  - Display helpers: `getProfileGreeting`, `isEmailVerified`, `needsOnboarding`
- Added 64 tests in `src/lib/__tests__/profiles.test.ts` covering:
  - All helper functions with null handling
  - Subscription expiration calculations
  - Profile switching logic
  - Dashboard routing by profile type
  - Integration scenarios for parent/child/guest flows
- All 1130 tests pass, linter clean

### 2026-01-16: Collection milestones tracking for celebrations

- Added `collectionMilestones` table to Convex schema:
  - Fields: profileId, milestoneKey, threshold, cardCountAtReach, celebratedAt
  - Indexes: by_profile, by_profile_and_key
- Created `convex/milestones.ts` with queries and mutations:
  - `getCelebratedMilestones`: Get all celebrated milestones for a profile
  - `hasCelebratedMilestone`: Check if specific milestone was celebrated
  - `getMilestoneProgress`: Get milestone progress with current count, milestones array, next milestone info
  - `getUncelebratedMilestones`: Find milestones reached but not yet celebrated (for UI trigger)
  - `markMilestoneCelebrated`: Mark a milestone as celebrated by UI (logs achievement_earned activity)
  - `checkMilestoneAfterCardAdd`: Check for milestone crossing after card add (returns celebration data with confetti type, message, icon, duration)
  - `markMultipleMilestonesCelebrated`: Batch mark multiple milestones for catch-up
  - `resetMilestones`: Reset milestones for testing/development
- Created `src/lib/milestones.ts` with pure utility functions:
  - Constants: `COLLECTION_MILESTONES` (10=Getting Started, 50=Rising Collector, 100=Century Club, 500=Master Collector)
  - Types: `MilestoneDefinition`, `MilestoneReachedData`, `MilestoneProgress`, `CelebrationData`
  - Detection: `checkMilestoneReached`, `getAllMilestonesCrossed`, `createMilestoneReachedData`
  - Progress: `getCurrentMilestone`, `getNextMilestone`, `getMilestoneByKey`, `getMilestoneByThreshold`
  - Progress helpers: `cardsToNextMilestone`, `percentToNextMilestone`, `getMilestoneProgress`
  - Celebration: `createCelebrationData`, `getCelebrationMessage`
  - Validation: `isValidMilestoneKey`, `getMilestoneThresholds`, `getMilestoneKeys`
  - Tracking: `getReachedMilestones`, `getUnreachedMilestones`, `hasReachedAllMilestones`, `countReachedMilestones`
  - UI helpers: `formatMilestoneProgress`, `getCurrentProgressIcon`, `getMotivationalMessage`, `getMilestoneSummary`
- Added 85 tests in `src/lib/__tests__/milestones.test.ts` covering:
  - COLLECTION_MILESTONES constant validation (length, thresholds, unique keys, sorted order)
  - checkMilestoneReached (no crossing, single crossing, multiple crossings, already past threshold)
  - getAllMilestonesCrossed (bulk card addition scenarios)
  - createMilestoneReachedData (isFirstTime tracking)
  - getCurrentMilestone and getNextMilestone boundary conditions
  - getMilestoneByKey and getMilestoneByThreshold lookups
  - cardsToNextMilestone and percentToNextMilestone calculations
  - getMilestoneProgress with celebrated milestones
  - createCelebrationData (confetti types, durations by milestone level)
  - getCelebrationMessage with context-aware messages
  - All validation and tracking helpers
  - UI helper functions
  - Integration scenarios: New collector journey, Bulk card addition, Master collector
- All 1237 tests pass, linter clean

### 2026-01-16: Level-up system with XP tracking

- Added `xp` and `level` fields to profiles schema in `convex/schema.ts`
- Created `convex/levelSystem.ts` with Convex queries and mutations:
  - `getXPProgress`: Get XP and level progress for a profile (current level, title, XP to next level, %)
  - `getLevelThresholds`: Get all 15 level thresholds for UI display
  - `getXPRewards`: Get XP rewards configuration for transparency
  - `awardXP`: Generic mutation to award XP for any action with level up detection
  - `awardCardXP`: Award XP for adding cards (10 XP normal, 15 holofoil, 20 1st edition, 2 duplicate)
  - `awardAchievementXP`: Award XP for earning achievements (25-50 XP based on type)
  - `awardSetCompletionXP`: Award XP for set milestones (50/100/200/500 XP for 25/50/75/100%)
  - `awardDailyLoginXP`: Award XP for daily activity with streak bonus (5 + 2 per streak day)
  - `resetXP`: Reset XP for testing/admin purposes
- Created `src/lib/levelSystem.ts` with pure utility functions:
  - Constants: `LEVEL_THRESHOLDS` (15 levels), `MAX_LEVEL`, `XP_REWARDS` (all action rewards)
  - Level progression: Rookie Collector (0 XP) → Collection Legend (11200 XP)
  - Level calculation: `calculateLevelFromXP`, `getLevelInfo`, `getLevelTitle`, `getXPForLevel`
  - Progress tracking: `getXPProgress`, `getLevelProgress`, `getNextLevelInfo`
  - Level up detection: `willLevelUp`, `calculateLevelUp`, `getLevelsEarnedBetween`
  - XP calculation: `getXPReward`, `calculateCardXP`, `calculateSetCompletionXP`, `calculateDailyLoginXP`
  - Validation: `isValidXP`, `isValidLevel`
  - Display helpers: `formatXP`, `formatLevel`, `getLevelProgressMessage`, `getXPRewardDescription`
  - Analytics: `summarizeXPGains`, `xpNeededForLevel`, `getAllLevelThresholds`
- Added 68 tests in `src/lib/__tests__/levelSystem.test.ts` covering:
  - LEVEL_THRESHOLDS constant validation (count, ascending, unique titles)
  - XP_REWARDS constant validation (positive values, rarity ordering)
  - calculateLevelFromXP (exact thresholds, between thresholds, boundaries, max level cap)
  - getLevelInfo, getLevelTitle, getXPForLevel, getNextLevelInfo
  - getXPProgress (progress within level, at boundary, max level)
  - getLevelProgress (complete progress info, max level indication)
  - willLevelUp and calculateLevelUp (single/multiple level ups)
  - All XP calculation functions with variant handling
  - All validation and utility functions
  - Integration scenarios: New User Journey, Max Level Achievement, Multiple Level Ups
- All 1349 tests pass, linter clean

### 2026-01-16: Rarity definitions with Convex queries for tooltips

- Created `convex/rarityDefinitions.ts` with Convex queries:
  - `getAllRarityDefinitions`: Get all 6 rarity tiers with educational content
  - `getRarityById`: Get single rarity by ID
  - `getRarityByApiString`: Match API rarity strings to rarity tiers
  - `getRarityTooltip`: Get formatted tooltip data for UI display
  - `getRarityDistribution`: Calculate rarity distribution for card collections
  - `getRaritySortValue`: Get sort value for ordering cards by rarity
- Defined 6 rarity tiers with kid-friendly content:
  - Common (C): Circle symbol, found in every pack
  - Uncommon (U): Diamond symbol, slightly harder to find
  - Rare (R): Star symbol, includes holo variants
  - Ultra Rare (UR): Double star, EX/GX/V/VMAX/ex cards
  - Secret Rare (SR): Triple star, gold/rainbow/alt art
  - Promo (P): Special cards from events/products
- Each rarity includes: id, name, shortName, symbol, description, examples, pullRate, collectorTip, sortOrder, colorClass, icon, apiMatches
- Expanded `src/lib/rarityExplainer.ts` with comprehensive utilities:
  - Core lookup: `getRarityInfo`, `getRarityInfoByName`, `getAllRarityInfo`, `getRarityBySortOrder`
  - Keyword matching: `matchRarityByKeywords` (handles V, VMAX, shiny, legend, etc.)
  - Validation: `isValidRarityId`, `getValidRarityIds`, `getRarityShortNames`
  - Comparison/sorting: `compareRarities`, `isRarerThan`, `isMoreCommonThan`, `sortRaritiesCommonFirst`, `sortRaritiesRareFirst`
  - Display helpers: `getRarityTooltipData`, `getRarityDisplayLabel`, `getRarityIcon`, `getRarityColorClass`, `getRaritySymbol`
  - Statistics: `calculateRarityDistribution`, `getRarityStats`, `getRarePercentage`
  - Educational: `getRarityExplanation`, `getRarityFunFacts`, `getCollectingAdvice`, `isChaseRarity`, `getRarityTier`
- Fixed API string matching for Pokemon TCG API rarities:
  - "Rare Holo V" → ultra-rare (endsWith ' v' pattern)
  - "Rare Shiny" → secret-rare (shiny keyword)
  - "Rare Shining" → secret-rare (shining keyword)
  - "LEGEND" → secret-rare (legend keyword)
- Added 107 tests in `src/lib/__tests__/rarityExplainer.test.ts` covering:
  - RARITY_EXPLAINERS constant validation (6 tiers, unique IDs, ascending sort orders)
  - All core lookup functions with edge cases
  - Keyword matching for all supported API rarity strings
  - Validation functions
  - Comparison and sorting functions (non-mutating, null handling)
  - All display helper functions
  - Distribution and statistics calculations
  - Educational content helpers
  - Integration scenarios: API rarity matching, collection analysis, tooltip display, card sorting
- All 1491 tests pass, linter clean

### 2026-01-16: Card condition guide content with Convex queries for tooltips

- Created `convex/conditionGuide.ts` with Convex queries:
  - `getAllConditionDefinitions`: Get all 5 condition grades (NM/LP/MP/HP/DMG)
  - `getConditionById`: Get single condition by ID
  - `getConditionByShortName`: Match by short name (NM, LP, etc.)
  - `getConditionTooltip`: Get formatted tooltip data for UI display
  - `getConditionComparison`: Compare two conditions for trade evaluation
  - `getGradingChecklist`: Get grading checklist for self-grading
  - `getTradeworthyConditions`: Get conditions acceptable for trading
  - `getConditionSortValue`: Get sort value for ordering cards by condition
- Defined 5 condition grades with kid-friendly content:
  - Near Mint (NM): Almost perfect, 100% value, trade acceptable
  - Lightly Played (LP): Tiny wear, 80% value, trade acceptable
  - Moderately Played (MP): Noticeable wear, 50% value, trade acceptable
  - Heavily Played (HP): Significant wear, 25% value, not trade acceptable
  - Damaged (DMG): Major damage, 10% value, not trade acceptable
- Each condition includes: id, name, shortName, description, whatToLookFor, valueImpact, collectorTip, sortOrder, colorClass, icon, approximateValuePercent, tradeAcceptable, damageExamples
- Created `src/lib/conditionGuide.ts` with comprehensive utilities:
  - Core lookup: `getConditionInfo`, `getConditionByShortName`, `getConditionByNameOrShortName`, `getAllConditionGrades`, `getConditionBySortOrder`
  - Validation: `isValidConditionId`, `isValidConditionShortName`, `getValidConditionIds`, `getValidConditionShortNames`
  - Comparison/sorting: `compareConditions`, `isBetterConditionThan`, `isWorseConditionThan`, `sortConditionsBestFirst`, `sortConditionsWorstFirst`
  - Display helpers: `getConditionTooltipData`, `getConditionDisplayLabel`, `getConditionShortLabel`, `getConditionIcon`, `getConditionColorClass`
  - Trade evaluation: `compareConditionsDetailed`, `getApproximateValuePercent`, `isTradeAcceptable`, `getTradeAcceptableConditions`, `getNonTradeAcceptableConditions`
  - Grading helpers: `getGradingGuidance`, `getNextBetterCondition`, `getNextWorseCondition`, `estimateConditionFromDamage`
  - Statistics: `calculateConditionDistribution`, `getConditionStats`, `getTradeablePercentage`
  - Educational: `getConditionExplanation`, `getConditionFunFacts`, `getCardCareAdvice`, `isCollectibleCondition`, `isPlayableCondition`, `getConditionTier`, `formatConditionWithIcon`
- Added 122 tests in `src/lib/__tests__/conditionGuide.test.ts` covering:
  - CONDITION_GRADES constant validation (5 grades, unique IDs, ascending sort orders, value percentages decrease)
  - All core lookup functions with edge cases
  - Validation functions
  - Comparison and sorting functions (non-mutating, null handling)
  - All display helper functions
  - Trade evaluation and condition comparison functions
  - Grading helpers and damage estimation
  - Distribution and statistics calculations
  - Educational content helpers
  - Integration scenarios: grading a new card, comparing cards for trade, collection condition analysis, card progression
- All 1706 tests pass, linter clean
