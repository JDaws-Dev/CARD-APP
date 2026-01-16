# KidCollect Development Tasks

## Phase 1: Foundation (Weeks 1-2)

- [ ] Initialize project with Next.js 14, TypeScript, and Tailwind CSS
- [ ] Set up PostgreSQL database with Prisma ORM
- [ ] Create database schema (families, profiles, collection_cards, wishlist_cards, achievements, wishlist_shares)
- [ ] Implement authentication system with email/password (Supabase Auth or Auth0)
- [ ] Create parent account registration flow with email verification
- [ ] Build child profile creation (up to 4 per family)
- [ ] Integrate Pokemon TCG API with caching layer
- [ ] Create API abstraction for card data fetching

## Phase 2: Core Collection (Weeks 3-4)

- [ ] Build set browser page with grid view of all Scarlet & Violet sets
- [ ] Create card grid component with large, tap-friendly images
- [ ] Implement tap-to-add functionality for marking cards as owned
- [ ] Add visual feedback (checkmark, highlight) for owned cards
- [ ] Build quantity tracking with +/- controls for duplicates
- [ ] Create "My Collection" view aggregating all owned cards
- [ ] Add progress bar component showing X of Y cards collected
- [ ] Implement set completion percentage display
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

<!-- The agent will append progress entries here -->
