# KidCollect Development Tasks

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
- [ ] Add search functionality for finding Pokemon by name
- [ ] Create filter system (by set, type, Pokemon)

## Phase 3: Achievement System (Weeks 5-6)

- [ ] Design achievement data model and badge definitions
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
