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
- [ ] Create collector milestone badge awarding (trigger on card count thresholds)
- [ ] Build type specialist badge logic (count cards by type, award at 10+)
- [ ] Add Pokemon fan badge logic (count specific Pokemon across sets)
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
