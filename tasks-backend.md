# KidCollect Backend Tasks

## Coding Guidelines

**READ THESE BEFORE STARTING ANY TASK:**

1. **File Focus** - Only modify files in `convex/`, `src/app/api/`, `src/lib/`, and test files. Do NOT modify UI components or pages.

2. **Testing Required** - Every backend change must include tests. Run `npm test` before marking complete.

3. **Type Safety** - Use TypeScript strictly. No `any` types.

4. **Convex Patterns** - Follow existing patterns in `convex/` for mutations and queries.

---

## Backend Tasks

### Authentication & Profiles

- [ ] Implement authentication system with Convex Auth
- [ ] Create parent account registration flow with email verification
- [ ] Build child profile creation (up to 4 per family) with validation
- [ ] Implement parent PIN protection logic (store hashed PIN, verify on access)

### Card Variants

- [ ] Add card variant tracking to Convex schema (variant field: "normal" | "holofoil" | "reverseHolofoil")
- [ ] Update collection mutations to handle variant parameter
- [ ] Create query to get collection grouped by card+variant

### Achievement System

- [ ] Implement set completion badge awarding logic (check on card add, award at 25/50/75/100%)
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

- [ ] Create activity log mutations (log card additions with timestamps)
- [ ] Build duplicate finder query (compare two profiles, find matching cardIds)
- [ ] Add pricing data fetching from TCGPlayer API

### Testing & Performance

- [ ] Write unit tests for achievement awarding logic
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
