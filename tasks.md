# KidCollect Development Tasks

## Coding Guidelines

**READ THESE BEFORE STARTING ANY TASK:**

1. **No Emojis in UI** - Use SVG icons instead of emojis for a professional look. Create or use existing SVG components in `src/components/icons/`. Emojis look unprofessional and render inconsistently across devices.

2. **Icon Library** - Use Heroicons (already available via `@heroicons/react`) or create custom SVGs. Example:

   ```tsx
   import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/solid';
   ```

3. **Replace existing emojis** - When working on a file that contains emojis (🎴, 🔍, ✅, etc.), replace them with appropriate SVG icons.

4. **Kid-friendly but professional** - The app is for kids but should look polished. Use color and animation instead of emojis to convey fun.

---

## Phase 0: Code Cleanup

- [ ] Replace all emojis with SVG icons across the codebase (search for emoji patterns in tsx files)

## Phase 1: Foundation (Weeks 1-2)

- [x] Initialize project with Next.js 14, TypeScript, and Tailwind CSS
- [x] Set up Convex database backend
- [x] Create database schema (families, profiles, collection_cards, wishlist_cards, achievements, wishlist_shares)
- [x] Create Convex functions for collections, wishlist, profiles, achievements
- [ ] Implement authentication system with Convex Auth
- [ ] Create parent account registration flow with email verification
- [ ] Build child profile creation (up to 4 per family)
- [x] Integrate Pokemon TCG API with caching layer
- [x] Create API abstraction for card data fetching

## Phase 2: Core Collection (Weeks 3-4)

- [x] Build set browser page with grid view of all Scarlet & Violet sets
- [x] Create card grid component with large, tap-friendly images
- [x] Implement tap-to-add functionality for marking cards as owned
- [x] Add visual feedback (checkmark, highlight) for owned cards
- [x] Build quantity tracking with +/- controls for duplicates
- [x] Add progress bar component showing X of Y cards collected
- [x] Implement set completion percentage display
- [x] Connect card tracking to Convex backend (persist data)
- [x] Create "My Collection" view aggregating all owned cards
- [x] Add search functionality for finding Pokemon by name
- [x] Create filter system (by set, type, Pokemon)
- [x] Expand set support to include Sword & Shield era (update pokemon-tcg.ts to fetch both series)
- [ ] Add series filter UI to sets page (tabs or toggle: "Scarlet & Violet", "Sword & Shield", "All Sets")
- [ ] Add card variant tracking (normal, holofoil, reverse holo) - update Convex schema to store variant type per card entry
- [ ] Update CardGrid UI to show variant selector when adding cards (icons/badges for Normal, Holo, Reverse Holo)
- [ ] Display owned variants on card (e.g., "Normal x2, Reverse x1") with distinct visual indicators

## Phase 3: Achievement System (Weeks 5-6)

- [x] Design achievement data model and badge definitions
- [ ] Implement set completion badges (25%, 50%, 75%, 100%)
- [ ] Create collector milestone badges (10, 50, 100, 250, 500, 1000 cards)
- [ ] Build type specialist badges (Fire, Water, Grass, etc. at 10+ cards)
- [ ] Add Pokemon fan badges (Pikachu Fan, Charizard Fan, etc.)
- [ ] Implement streak tracking system (3, 7, 14, 30 day streaks)
- [ ] Create celebration animations for badge unlocks
- [ ] Build Trophy Case UI showing all earned/locked badges
- [ ] Add badge earned date tracking

## Phase 4: Family Features (Weeks 7-8)

- [ ] Build parent dashboard with collection overview per child
- [ ] Add activity feed showing recent cards added with timestamps
- [ ] Implement parent PIN protection for dashboard access
- [ ] Create wishlist feature - mark cards as wanted
- [ ] Add priority starring for wishlist items (max 5)
- [ ] Build shareable wishlist link generation
- [ ] Create public wishlist view (no login required)
- [ ] Implement duplicate finder comparing sibling collections
- [ ] Add export/print checklist PDF generation
- [ ] Create optional pricing toggle for parent dashboard (TCGPlayer data)

## Phase 5: Polish & Testing (Weeks 9-10)

- [ ] Add responsive design for mobile-first experience
- [ ] Implement offline collection viewing (service worker/PWA)
- [ ] Optimize card grid scrolling performance
- [ ] Add loading states and skeleton screens
- [ ] Implement error handling and user-friendly error messages
- [ ] Write unit tests for achievement logic
- [ ] Write integration tests for collection CRUD operations
- [ ] Write E2E tests for critical user flows
- [ ] Accessibility audit and fixes (WCAG 2.1 AA)
- [ ] Performance optimization (< 2s page load on 4G)

## Phase 6: Launch Prep

- [ ] Set up production environment (Vercel + Railway)
- [ ] Configure environment variables and secrets
- [ ] Set up error monitoring (Sentry)
- [ ] Set up analytics (Plausible or PostHog)
- [ ] Write COPPA-compliant privacy policy
- [ ] Write terms of service
- [ ] Create onboarding flow for new users
- [ ] Build subscription/payment integration (Stripe)
- [ ] Implement free tier limitations (3 sets max)

---

## Progress

### 2026-01-15 - Initial Project Setup

**Completed tasks:**

- Initialized Next.js 14 project with TypeScript, Tailwind CSS, and App Router
- Created comprehensive Prisma schema with all required models (families, profiles, collection_cards, wishlist_cards, achievements, activity_logs, cached_sets, cached_cards)
- Set up Pokemon TCG API integration with typed client (`src/lib/pokemon-tcg.ts`)
- Created API abstraction layer with caching support
- Configured ESLint, Prettier, and Vitest for code quality and testing
- Set up Zustand store for client-side collection state management
- Created landing page with kid-friendly UI
- Initialized git repository with initial commit

**Files created:**

- `package.json` - Dependencies and scripts
- `prisma/schema.prisma` - Database schema
- `src/app/` - Next.js App Router pages
- `src/lib/` - Utilities and API clients
- `src/store/` - Zustand state management
- `src/types/` - TypeScript type definitions
- `tasks.md` - Task tracking for Ralph automation
- `ralph.sh` - Automated task runner script

**Next steps:** Implement authentication system with Supabase Auth

### 2026-01-15 - Switched to Convex

**Completed tasks:**

- Migrated from Prisma/PostgreSQL to Convex backend
- Created Convex schema with all tables
- Implemented Convex functions: collections.ts, wishlist.ts, profiles.ts, achievements.ts
- Set up ConvexClientProvider for Next.js
- Deployed to Convex cloud (pokemon-project)

**Files created/modified:**

- `convex/schema.ts` - Database schema
- `convex/collections.ts` - Card collection mutations/queries
- `convex/wishlist.ts` - Wishlist management
- `convex/profiles.ts` - Family and profile CRUD
- `convex/achievements.ts` - Badge definitions and awarding
- `src/components/providers/ConvexClientProvider.tsx` - React provider

**Next steps:** Build set browser page with grid view

### 2026-01-15 - My Collection View

**Completed tasks:**

- Created "My Collection" page at `/collection` aggregating all owned cards
- Built CollectionView component that fetches and displays cards grouped by set
- Added API route `/api/cards` for batch fetching cards by ID from Pokemon TCG API
- Implemented `getCardsByIds` utility with batching support (50 cards per request)
- Added collection stats display (total cards, unique cards, sets started)
- Wrote unit tests for API route and utility function (9 tests passing)
- Added "My Collection" link to home page navigation

**Files created:**

- `src/app/collection/page.tsx` - My Collection page
- `src/components/collection/CollectionView.tsx` - Collection display component
- `src/app/api/cards/route.ts` - API route for batch card fetching
- `src/app/api/cards/__tests__/route.test.ts` - API route tests
- `src/lib/__tests__/pokemon-tcg.test.ts` - Pokemon TCG utility tests

**Next steps:** Add search functionality for finding Pokemon by name

### 2026-01-15 - Search Functionality

**Completed tasks:**

- Created search API endpoint (`/api/search`) with query validation
- Built SearchResults component with collection integration (add/remove cards from search results)
- Created search page (`/search`) with debounced input, loading states, and quick suggestions
- Added search link to home page navigation
- Implemented comprehensive test suite for search API (10 tests passing)
- All 19 tests passing, ESLint and Prettier checks passing

**Files created:**

- `src/app/api/search/route.ts` - Search API endpoint
- `src/app/api/search/__tests__/route.test.ts` - API route tests
- `src/app/search/page.tsx` - Search page with input and results
- `src/components/search/SearchResults.tsx` - Search results display component

**Next steps:** Create filter system (by set, type, Pokemon)

### 2026-01-15 - Filter System

**Completed tasks:**

- Created filter API endpoint (`/api/filter`) with validation for set, type, and name filters
- Created sets API endpoint (`/api/sets`) for fetching Scarlet & Violet sets
- Built FilterPanel component with name input, set dropdown, and type selection buttons
- Built FilterChips component to display active filters with clear buttons
- Created browse page (`/browse`) with filter panel sidebar and results grid
- Added `filterCards` function and `POKEMON_TYPES` constant to pokemon-tcg library
- Added "Browse & Filter" link to home page navigation
- Implemented comprehensive test suite for filter API (14 tests passing)
- All 33 tests passing, ESLint and Prettier checks passing

**Files created:**

- `src/app/api/filter/route.ts` - Filter API endpoint
- `src/app/api/filter/__tests__/route.test.ts` - Filter API tests (14 tests)
- `src/app/api/sets/route.ts` - Sets API endpoint
- `src/app/browse/page.tsx` - Browse & filter page
- `src/components/filter/FilterPanel.tsx` - Filter panel component
- `src/components/filter/FilterChips.tsx` - Active filter chips component
- `src/components/filter/index.ts` - Component exports

**Next steps:** Design achievement data model and badge definitions

### 2026-01-15 - Achievement Data Model and Badge Definitions

**Completed tasks:**

- Enhanced ACHIEVEMENT_DEFINITIONS in `convex/achievements.ts` with icons and colors
- Added 5 new type specialist badges (Fighting, Darkness, Metal, Fairy, Colorless)
- Added 2 new Pokemon fan badges (Mewtwo Fan, Legendary Fan)
- Created helper functions: getBadgesByCategory, getBadgeDefinition, getTypeSpecialistKey, etc.
- Created `src/lib/badges.ts` for client-side badge operations with full type definitions
- Added progress calculation helpers: calculateMilestoneProgress, calculateSetCompletionProgress
- Comprehensive test suite with 34 tests for badge definitions and helpers
- All 67 tests passing, ESLint and Prettier checks passing

**Files created/modified:**

- `convex/achievements.ts` - Enhanced badge definitions with icons/colors and helper functions
- `src/lib/badges.ts` - Client-side badge definitions and utilities
- `src/lib/__tests__/badges.test.ts` - Comprehensive badge tests (34 tests)

**Badge Categories Defined:**

- Set Completion: 4 badges (25%, 50%, 75%, 100%)
- Collector Milestones: 7 badges (1, 10, 50, 100, 250, 500, 1000 cards)
- Type Specialists: 11 badges (Fire, Water, Grass, Lightning, Psychic, Fighting, Darkness, Metal, Dragon, Fairy, Colorless)
- Pokemon Fans: 5 badges (Pikachu, Eevee, Charizard, Mewtwo, Legendary)
- Streaks: 4 badges (3, 7, 14, 30 days)

**Next steps:** Implement set completion badges (25%, 50%, 75%, 100%)

### 2026-01-15 - Sword & Shield Era Set Support

**Completed tasks:**

- Added `POKEMON_SERIES` constant with Scarlet & Violet and Sword & Shield series
- Created `getSetsBySeries()` generic function for fetching sets by series name
- Added `getSwordShieldSets()` function for Sword & Shield era sets
- Created `getAllSupportedSets()` function that fetches both series and sorts by release date
- Updated `/api/sets` endpoint to support `?series=` query parameter
- API returns all sets by default (sorted newest first), can filter by "Scarlet & Violet" or "Sword & Shield"
- Added 9 new tests for series functionality in pokemon-tcg.ts
- Added 8 new tests for sets API endpoint
- All 84 tests passing, ESLint and Prettier checks passing

**Files created/modified:**

- `src/lib/pokemon-tcg.ts` - Added series constants and multi-series fetch functions
- `src/lib/__tests__/pokemon-tcg.test.ts` - Added 9 tests for series functionality
- `src/app/api/sets/route.ts` - Updated to support series filtering
- `src/app/api/sets/__tests__/route.test.ts` - New test file (8 tests)

**Next steps:** Add series filter UI to sets page
