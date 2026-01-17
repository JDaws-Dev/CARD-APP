# CardDex UI Tasks

> **See STATUS.md for overall project status**

## Current Focus: CRITICAL fixes first, then HIGH priority

```
Progress: ████████████░░░░░░░░░░░░░░░░  110/318 (35%)
Remaining: 208 tasks (42 are LOW priority - do after launch)
```

## Status Summary (Updated 2026-01-17 - Post Comprehensive Evaluation)

| Section                                   | Complete | Remaining |
| ----------------------------------------- | -------- | --------- |
| **HIGH - My Collection Page Card Details** | 0       | **14**    |
| **HIGH - Sets Page Card Viewing & Sorting** | 0      | **20**    |
| **CRITICAL - Site Evaluation Fixes**      | 7        | **1**     |
| **CRITICAL - Remove Unsupported Games**   | 0        | **7**     |
| **CRITICAL - Settings Permissions**       | 0        | **7**     |
| **CRITICAL - Landing Page Content**       | 0        | **10**    |
| **HIGH - Broken Images & Error Handling** | 0        | **10**    |
| **HIGH - Performance Optimization UI**    | 0        | **8**     |
| **HIGH - UX & Navigation Improvements**   | 0        | **15**    |
| **HIGH - Multi-TCG Master Toggle**        | 0        | **4**     |
| **Multi-TCG Pages Update**                | 1        | **6**     |
| **Landing Page Multi-TCG**                | 0        | **5**     |
| **NEW - SEO & Marketing**                 | 0        | **12**    |
| **NEW - Architecture Improvements**       | 0        | **13**    |
| **NEW - Security Hardening**              | 0        | **6**     |
| **NEW - Kid-Friendly Set Display**        | 0        | **15**    |
| **NEW - AI-Powered Features UI**          | 0        | **14**    |
| **NEW - Landing Page AI Features**        | 0        | **13**    |
| **NEW - Trade Logging UI**                | 0        | **12**    |
| **NEW - Parent Notification UI**          | 0        | **3**     |
| **LOW - Mobile UX Evaluation**            | 0        | **20**    |
| **LOW - Gamification Evaluation**         | 0        | **22**    |
| HIGH PRIORITY - Landing Page              | 9        | 0         |
| UI Tasks                                  | 20       | 0         |
| Core Features                             | 6        | 0         |
| Master Set Mode & Variant Tracking UI     | 0        | 16        |
| Gamification UI                           | 4        | 0         |
| Educational Features UI                   | 5        | 0         |
| Navigation & Dashboard                    | 7        | 0         |
| Multi-TCG Game Selector                   | 6        | 0         |
| Polish & UX                               | 7        | 0         |
| UI Cleanup & Settings                     | 6        | 0         |
| Forgiving Streak System                   | 5        | 0         |
| Virtual Experience Features               | 6        | 0         |
| Collection Timeline & Story               | 5        | 0         |
| Family & Social Features                  | 5        | 0         |
| Financial Literacy                        | 4        | 0         |
| Educational Mini-Games                    | 3        | 2         |
| Enhanced Accessibility                    | 6        | 0         |
| Engagement & Retention                    | 4        | 0         |
| **TOTAL**                                 | **110**  | **244**   |

### Priority Order for Remaining Tasks

1. **HIGH - My Collection Page Card Details** (14 tasks) - Click to see close-up, show owned variants, quick actions, card navigation
2. **HIGH - Sets Page Card Viewing & Sorting** (20 tasks) - **VARIANT BADGES NOT WORKING** - Debug why badges don't show, research Pokemon API variants, fix implementation
3. **CRITICAL - Site Evaluation Fixes** (1 task) - Profile switcher for families
4. **CRITICAL - Remove Unsupported Games** (7 tasks) - Remove Digimon, Dragon Ball, MTG from UI (only support Pokemon, One Piece, Lorcana, Yu-Gi-Oh!)
5. **CRITICAL - Settings Permissions** (7 tasks) - Parent vs kid settings access control
6. **CRITICAL - Landing Page Content** (10 tasks) - Specific text changes for multi-TCG (4 games only)
7. **CRITICAL - Kid-Friendly Set Display** (15 tasks) - Only show sets kids can actually buy
8. **HIGH - Security Hardening** (6 tasks) - CSP headers, external resource integrity
9. **HIGH - Broken Images & Error Handling** (10 tasks) - Add error handlers, fallback images
10. **HIGH - Performance Optimization UI** (8 tasks) - Memoization, lazy loading, faster collection page
11. **HIGH - UX & Navigation Improvements** (15 tasks) - Back links, breadcrumbs, footer, user flow, dashboard fixes
12. **HIGH - Multi-TCG Master Toggle** (4 tasks) - Game selector as master toggle for entire app experience
13. **Multi-TCG Pages Update** (6 tasks) - Make all pages use game picker instead of Pokemon-only
14. **MEDIUM - Architecture Improvements** (13 tasks) - Provider optimization, error boundaries, code splitting
15. **MEDIUM - SEO & Marketing** (12 tasks) - Meta tags, sitemap, structured data
16. **Landing Page Multi-TCG** (5 tasks) - Add game showcase section for 4 supported games
17. **Landing Page AI Features** (13 tasks) - AI Magic section, pricing updates, trust badges
18. **AI-Powered Features UI** (14 tasks) - Card scanner, chatbot, story modal, quiz components
19. **Trade Logging UI** (12 tasks) - Log trade modal, timeline display, entry points
20. **Educational Mini-Games** (2 tasks) - Set symbols, type quiz - Learning through play
21. **LOW - Mobile UX Evaluation** (20 tasks) - Touch targets, gestures, mobile layouts - Do AFTER core features work
22. **LOW - Gamification Evaluation** (22 tasks) - Review if gamification serves collectors or just engagement - Do AFTER launch
23. **MEDIUM - Master Set Mode & Variant Tracking** (16 tasks) - For completionist collectors who want to track all variants

---

## HIGH - My Collection Page Card Details (January 2026)

These features improve the card viewing experience on the My Collection page (`/collection`). Users should be able to see more details about their cards without navigating to the set page.

### Card Detail Modal for Collection

- [ ] **Click card to see close-up** - Clicking any card in My Collection should open a detail modal showing the enlarged card image
- [ ] **Show owned variants in modal** - Detail modal should display which variants the user owns (Normal x2, Holo x1, etc.)
- [ ] **High-res image in modal** - Use `imageLarge` from the API for the close-up view
- [ ] **Variant quantity display** - Show counts for each variant owned (e.g., "Normal: 2, Reverse Holo: 1")
- [ ] **Quick actions in modal** - Add buttons to: view in set, remove card, add to wishlist, edit quantity
- [ ] **Set name in modal** - Show which set the card belongs to with link to set page
- [ ] **Card metadata in modal** - Display rarity, card number, type, and market value
- [ ] **Swipe/arrow navigation** - Navigate between cards in collection without closing modal
- [ ] **Keyboard navigation** - Arrow keys to move between cards, ESC to close modal

### Collection Browse Experience

- [ ] **Variant badges on collection cards** - Show variant indicator badges (N, H, R, 1H, 1N) on each card thumbnail in collection view
- [ ] **Filter by variant type** - Filter collection to show only holos, only reverse holos, etc.
- [ ] **Sort collection by date added** - Option to sort cards by when they were added to collection
- [ ] **Sort collection by value** - Option to sort cards by market price
- [ ] **Grid size options** - Toggle between compact (more cards) and expanded (larger thumbnails) views

---

## HIGH - Sets Page Card Viewing & Sorting (January 2026)

These features improve the card viewing experience on the sets page (`/sets/[setId]`).

### Card Layout Fixes

- [ ] **Fix card spacing/overlap** - Cards are overlapping each other on the sets page; fix grid gap and card sizing

### Card Detail View Improvements

- [ ] **Enlarged card on add** - When adding a card, show enlarged card image that stays visible until user clicks away (not auto-dismiss)
- [ ] **Use high-res images** - Use `imageLarge` from the API instead of `imageSmall` for the enlarged card view
- [ ] **Magnifying glass icon** - Add magnifying glass icon in bottom-left corner of card thumbnails for quick close-up view
- [ ] **Card detail modal** - Create modal component that shows full card details with high-res image when magnifying glass is clicked

### Variant Indicator Badges (Visual at-a-glance tracking) - NEEDS INVESTIGATION

**STATUS: NOT WORKING** - Badges are not displaying on cards. Need to debug why.

Show which variants exist for each card and which ones the user owns. Badges appear on each card thumbnail for quick scanning while scrolling.

**Variant abbreviations:**
- **N** = Normal
- **H** = Holo/Holofoil
- **R** = Reverse Holo
- **1H** = 1st Edition Holo
- **1N** = 1st Edition Normal

#### Investigation Tasks (DO THESE FIRST)

- [ ] **DEBUG: Why badges not showing** - Check if `features.showVariantSelector` is false, or if `getAvailableVariants()` returns empty array. Add console.log to debug. Check VirtualCardGrid.tsx lines 889-919.
- [ ] **Research Pokemon TCG API variants** - Document what variant data the Pokemon TCG API actually provides:
  - Check `card.tcgplayer.prices` object structure
  - What price keys exist? (normal, holofoil, reverseHolofoil, 1stEditionHolofoil, 1stEditionNormal, etc.)
  - Do ALL cards have tcgplayer prices, or only some?
  - Are there cards with NO variants at all?
- [ ] **Verify getAvailableVariants() logic** - Currently at VirtualCardGrid.tsx line 84-96. Make sure it correctly extracts variants from `card.tcgplayer?.prices`
- [ ] **Check if variant badges are behind a feature flag** - Look for `showVariantSelector` in kid mode settings or feature flags

#### Implementation Tasks

- [ ] **Variant badge component** - Create small badge component that shows variant letter (N, H, R, 1H, 1N) with owned/unowned state
- [ ] **Badge styling: owned vs unowned** - Owned variants are lit up/colored, unowned variants are grayed out with lower opacity
- [ ] **Badge row on card thumbnail** - Add horizontal row of variant badges at bottom of each card thumbnail
- [ ] **Determine available variants per card** - Logic to determine which variants are possible for each card (not all cards have all variants)
- [ ] **Badge click to add variant** - Clicking a grayed-out badge adds that variant to collection
- [ ] **Badge click to view/remove variant** - Clicking a lit badge shows options to view details or remove from collection
- [ ] **Responsive badge sizing** - Badges should be readable but not overwhelming at different card sizes
- [ ] **Fallback for cards without price data** - If card has no tcgplayer prices, show just "N" badge as default

### Sorting Options for Sets Page

- [ ] **Sort by card type** - Add filter/sort for Pokemon card types: Pokemon, Trainer, Energy (for Pokemon TCG)
- [ ] **Sort by owned/wanted** - Filter to show only owned cards, only unowned cards, or all cards
- [ ] **Sort by recently added** - Sort cards by when they were added to collection (most recent first)
- [ ] **Sort by card number** - Sort cards by their collector number (default sort)
- [ ] **Sort by price** - Sort cards by market price (highest to lowest or vice versa)
- [ ] **Sort dropdown UI** - Add sort dropdown to sets page header with all sorting options
- [ ] **Remember sort preference** - Save user's sort preference in localStorage

---

## CRITICAL - Site Evaluation Fixes (January 2026)

These issues were identified during the January 17, 2026 site evaluation and MUST be fixed before launch.

- [x] Create `/signup` page - Either redirect to `/login?mode=signup` or create dedicated signup page with proper flow
- [x] Update `/login` page copy - Change "Track your Pokemon card collection" to "Track your trading card collection"
- [x] Update `/login` page styling - Match CardDex brand colors (use kid-primary/kid-secondary gradients instead of generic blue)
- [x] Add email verification UI - Show verification pending state and resend button after signup
- [x] Add parent vs kid account selection - During signup, ask if creating parent account (for family) or individual collector
- [x] Fix AuthForm styling - Replace blue-600 colors with CardDex brand gradients
- [x] Add password strength indicator - Visual indicator showing password requirements during signup
- [ ] Add profile switcher to header - Allow switching between child profiles for families (parent accounts)
- [x] **CRITICAL: Redirect logged-in users from `/` to `/dashboard`** - Currently logged-in users see landing page with AppHeader navbar overlaid on marketing content. Add auth check to `/page.tsx` and redirect authenticated users to `/dashboard`

### Auth State Issues (January 17, 2026 - Comprehensive Eval)

These issues relate to inconsistent behavior between logged-in and logged-out states.

- [x] **CRITICAL: `/login` should redirect to `/dashboard` if already authenticated** - Logged-in users can still access login page
- [x] **CRITICAL: `/signup` should redirect to `/dashboard` if already authenticated** - Logged-in users can still access signup page
- [x] Protect `/dashboard` route - Redirect to `/login` if not authenticated
- [x] Protect `/collection` route - Redirect to `/login` if not authenticated
- [x] Protect `/my-wishlist` route - Redirect to `/login` if not authenticated
- [x] Protect `/badges` route - Redirect to `/login` if not authenticated
- [x] Protect `/settings` route - Redirect to `/login` if not authenticated
- [x] Protect `/parent-dashboard` route - Redirect to `/login` if not authenticated (also check parent role)
- [x] Protect `/streak` route - Redirect to `/login` if not authenticated
- [x] Protect `/learn` route - Redirect to `/login` if not authenticated

## CRITICAL - Remove Unsupported Games (January 2026)

We are focusing on **only 4 kid-friendly TCGs** based on Q4 2025 market data. Remove all references to Digimon, Dragon Ball, and Magic: The Gathering from the UI.

**Supported games (KEEP):** Pokemon, One Piece, Disney Lorcana, Yu-Gi-Oh!
**Unsupported games (REMOVE):** Digimon, Dragon Ball, Magic: The Gathering

- [x] Update `GameFilter.tsx` - Remove `digimon`, `dragonball`, `mtg` from GAMES array and GAME_COLORS
- [x] Update `GameSwitcher.tsx` - Remove unsupported games from game selector dropdown
- [x] Update onboarding game selector - Only show 4 supported games in "What do you collect?" screen
- [x] Update settings game toggle - Remove unsupported games from game selection options
- [x] Remove unsupported game icons - Delete or hide `DigimonLogo.tsx`, `DragonBallLogo.tsx`, `MtgLogo.tsx` from `src/components/icons/tcg/` (VERIFIED: Icons don't exist - never created)
- [ ] Update any game-specific achievements - Remove Digimon, Dragon Ball, MTG themed badges if they exist
- [ ] Search codebase for hardcoded game lists - Find and update any other places that list all 7 games

---

## Multi-TCG Pages Update

These pages are currently hardcoded to Pokemon and need to use the game picker (`useGameSelector`).

### HIGH PRIORITY - Master Game Toggle

The game toggle should act as a **master toggle** for the entire app experience. When the user selects Pokemon, the entire app should show Pokemon content exclusively. When they switch to Yu-Gi-Oh, everything switches to Yu-Gi-Oh. This is not just filtering - it's a complete context switch.

- [ ] **Implement master game toggle** - When user selects a game, ALL pages respect that selection:
  - Dashboard shows only that game's stats, recent activity, achievements
  - Collection page filters to only show cards from selected game
  - Sets page shows only sets from selected game
  - Search filters to selected game by default
  - Wishlist shows only items from selected game
  - Achievements/badges show game-specific progress
  - UI theming updates to match selected game colors
- [ ] **Persist game selection** - Store selected game in user profile so it persists across sessions
- [ ] **Game switch indicator** - Clear visual indicator showing which game is currently active across all pages
- [ ] **Quick game switcher in header** - Allow switching games from anywhere without going to settings

### Page-Specific Updates

- [x] `/sets/page.tsx` - Sets listing (DONE - uses getSetsByGame from Convex)
- [ ] `/sets/[setId]/page.tsx` - Individual set view - Must use selected game to fetch correct set/cards
- [ ] `/browse/page.tsx` - Card browsing - Must filter by selected game
- [ ] `/search/page.tsx` - Card search - Must search within selected game
- [ ] `/my-wishlist/page.tsx` - Wishlist view - Must show cards from selected game
- [ ] `/wishlist/[token]/page.tsx` - Public wishlist - Must display correct game context
- [ ] `/collection/page.tsx` - Collection view - Must filter collection by selected game

## NEW - Code Review Fixes (January 17, 2026)

These specific issues were discovered during code review and need immediate attention.

### Parent Dashboard Fixes

- [x] Update `/parent-dashboard/page.tsx` line 75 - Change "Manage your family's Pokemon collections" to "Manage your family's trading card collections"
- [x] Fix "Settings" button in parent dashboard - Currently non-functional (lines 80-83), add onClick to navigate to /settings
- [x] Fix "Add Profile" button in parent dashboard - Currently non-functional (lines 84-87), implement add profile modal or navigate to onboarding

### Landing Page Hero Fixes

- [x] Update `/page.tsx` line 41 - Change `text-pokemon-yellow` to `text-kid-primary` on SparklesIcon (pokemon-yellow may not exist in Tailwind config)
- [x] Update `/page.tsx` line 51 - Change `text-pokemon-yellow` to `text-kid-primary` on FloatingStar default color
- [x] Update `/page.tsx` lines 102-104 - Change hero "Track Your Pokemon Cards" to "Track Your Trading Cards"

### Signup Page Polish

- [x] Update `/signup/page.tsx` line 40 - Change "Start tracking your trading card collection" to more exciting copy like "Start your collecting adventure!"

### App Footer (Critical for Professional Look)

- [x] Create `src/components/layout/AppFooter.tsx` - Footer component with Help, Privacy Policy, Terms of Service, Contact links
- [x] Add AppFooter to `src/app/layout.tsx` - Include footer on all authenticated pages
- [x] Create `/privacy` page stub - Placeholder privacy policy page
- [x] Create `/terms` page stub - Placeholder terms of service page

### Image Error Handling (Prevent Broken Images)

- [x] Create `src/components/ui/CardImage.tsx` - Reusable card image component with built-in onError handler and fallback
- [x] Create `/public/images/card-placeholder.svg` - Simple placeholder SVG for failed card images
- [x] Update CardGrid to use CardImage component - Replace raw img/Image with error-handled version
- [x] Update VirtualCardGrid to use CardImage component - Replace raw img/Image with error-handled version

---

## Landing Page Multi-TCG Updates

The landing page currently only mentions Pokemon. Update to feature the **4 supported kid-friendly TCGs**: Pokemon, One Piece, Disney Lorcana, and Yu-Gi-Oh!

**IMPORTANT:** We only support 4 games (not 6 or 7). Do NOT include Digimon, Dragon Ball, or Magic: The Gathering.

- [ ] Update hero section - Change "Track Your Pokemon Cards" to "Track Your Trading Card Collection" and mention multiple games
- [ ] Add "Supported Games" section - Feature grid showing ONLY: Pokemon, One Piece, Disney Lorcana, Yu-Gi-Oh! logos with brief taglines (NO Digimon, NO Dragon Ball, NO MTG)
- [ ] Update "How It Works" section - Remove Pokemon-specific language, make game-agnostic
- [ ] Update pricing section - Change "500+ Pokemon sets" to "500+ sets across 4 popular games"
- [ ] Update features section - Add "Multiple Games" as a key feature showing the 4 supported game icons

## NEW - Landing Page AI Features Section

Add dedicated AI features section to landing page to highlight the "Snap to Add", "Ask Your Collection", and "Card Stories" features. This is a key competitive differentiator.

### AI Magic Section (New section after "How It Works")

- [ ] Create "Powered by AI Magic" section header - SparklesIcon with gradient, headline "Powered by AI Magic ✨", subhead "CardDex uses smart technology to make collecting easier and more fun"
- [ ] Create "Snap to Add" feature card - CameraIcon, "Take a photo of any card and watch it get added to your collection instantly!", gradient from cyan to blue
- [ ] Create "Ask Your Collection" feature card - ChatBubbleLeftIcon, "Ask questions like 'How many fire types do I have?' or 'What's my rarest card?'", gradient from purple to indigo
- [ ] Create "Card Stories" feature card - BookOpenIcon, "Tap any card to hear cool facts and stories about your favorite characters!", gradient from amber to orange
- [ ] Add AI demo animation/visual - Animated mockup showing photo → card appearing, or chat conversation example

### Update Existing Sections for AI

- [ ] Update "How It Works" Step 2 - Add "or snap a photo" alternative to tap-to-add description
- [ ] Update social proof indicators - Add "AI-powered" or "Smart scanning" badge in hero section
- [ ] Add AI testimonial - Parent quote about photo scanning or collection chat feature

### Pricing Section AI Features

- [ ] Add AI features to Free tier - "5 card scans/day", "10 collection questions/day"
- [ ] Add AI features to Family tier - "20 card scans/day", "Unlimited questions", "Quiz Me!", "Fair Trade Helper"
- [ ] Add "AI Features" row to pricing comparison table

### Trust & Safety Section

- [ ] Add "Kid-Safe AI" trust badge - ShieldCheckIcon, "All AI responses are filtered for age-appropriate content"
- [ ] Add "No Personal Data" indicator - LockClosedIcon, "We never send your child's name or info to AI"
- [ ] Update trust signals section - Include AI safety messaging alongside COPPA, No Ads, Cloud Backup

## CRITICAL - Settings Permissions (January 2026)

The settings page currently allows ALL settings to be changed by anyone, including kids. This is a safety issue - kids can disable Sleep Mode, remove Parent PIN, etc. These tasks implement proper parent vs kid access control.

- [ ] Restructure settings page into "My Settings" and "Family Controls" sections - Visual separation of kid-accessible vs parent-only settings
- [ ] Add PIN protection to Family Controls section - Require Parent PIN to access/modify Sleep Mode, Parent PIN, Kid Mode, and Game Selection settings
- [ ] Add visual lock indicators - Show LockClosedIcon and "Parent Only" badge on protected settings when viewing without PIN
- [ ] Handle no-PIN-set state - When accessing Family Controls without a PIN configured, prompt parent to create one first
- [ ] Make settings profile-aware - Different settings may apply per child profile (e.g., different sleep schedules per kid)
- [ ] Add "unlock" button flow - Button to enter PIN that temporarily unlocks Family Controls for the session
- [ ] Protect Game Selection toggle - Moving game toggle to Family Controls since parents should control which games kids can access

## HIGH - Broken Images & Error Handling (January 2026)

Image components lack error handlers, causing silent failures when images don't load.

- [x] Add onError handler to FlippableCard card back image - Show placeholder when `https://images.pokemontcg.io/cardback.png` fails
- [ ] Add onError handlers to CardGrid card images - Display fallback placeholder on image load failure
- [x] Add onError handlers to DigitalBinder card images - Graceful degradation for binder view
- [x] Add onError handlers to PackOpeningSimulator - Don't break pack opening experience if image fails
- [x] Add onError handlers to CollectionView card images (2 Image components) - Show placeholder instead of broken image
- [x] Add onError handlers to SearchResults card images - Handle API image failures gracefully
- [x] Add onError handlers to JustPulledMode card images - Maintain celebration UX even with failed images
- [x] Create /public/fallback-card.png - Default placeholder image for all failed card image loads (DONE: public/images/card-placeholder.svg exists)
- [ ] Extract hardcoded game card URLs from mini-games - Move to config file (PriceEstimationGame, PokemonTypeQuiz, GradeLikeAProGame, RarityGuessingGame)
- [ ] Extract hardcoded set symbol URLs from SetSymbolMatchingGame - Move to config and add fallbacks

## HIGH - Performance Optimization UI (January 2026)

The My Collection page is slow to load. These UI-side optimizations will help.

- [x] Add React.memo() to ActivityFeed component - Prevent unnecessary re-renders
- [x] Add useMemo to CollectionView set grouping logic (lines 115-151) - Cache expensive grouping computation
- [x] Add loading="lazy" to CardGrid card images - Defer offscreen image loading
- [x] Add loading="lazy" to CollectionView card images - Defer offscreen image loading
- [x] Add loading="lazy" to VirtualCardGrid card images - Defer offscreen image loading
- [x] Lazy load VirtualTrophyRoom with React.lazy() - Don't load trophy room until needed
- [x] Increase VirtualCardGrid overscan on mobile - Change from 3 to 5 rows for smoother scrolling on slower devices
- [x] Memoize cardData Map in CollectionView - Prevent recreation on every render

## HIGH - UX & Navigation Improvements (January 2026)

Improve site organization, navigation, and user flow clarity.

- [x] Create BackLink component - Reusable consistent back navigation (src/components/ui/BackLink.tsx)
- [x] Create PageHeader component - Reusable page header with title, description, optional icon (src/components/ui/PageHeader.tsx)
- [x] Add back navigation to /learn page - Users can get stuck without way to return
- [x] Add breadcrumb to /condition-guide - Show "Home > Learn > Condition Guide"
- [x] Add breadcrumb to /sets/[setId] - Show "Home > Browse Sets > [Set Name]"
- [x] **FIX: Welcome message shows email instead of name** - Dashboard says "Good morning, jedaws!" using email prefix instead of user's actual name. Check KidDashboard.tsx and profile data - should use profile.name or displayName, not email
- [x] **FIX: Recent Activity missing set name** - Dashboard Recent Activity shows "Added Fearow" but not which set it's from. Should show "Added Fearow from 151" or similar. Check ActivityFeed component and ensure setName from metadata is displayed
- [ ] **FIX: Badges/Achievements not showing** - User earned badges but they don't appear in the badges section. Debug full achievement flow:
  1. Check if achievements are being tracked in Convex (query `achievements.getProfileAchievements`)
  2. Check if achievement_earned events are logged in activityLogs when cards are added
  3. Verify `/badges` page is reading from correct Convex query
  4. Check if achievement criteria (first card, 10 cards, set completion) triggers badge award
  5. Look at `src/lib/achievements.ts` for badge unlock logic
  6. Check `convex/achievements.ts` for mutation that creates achievement records
  7. Verify `VirtualTrophyRoom` component loads and displays badges correctly
- [x] Create AppFooter component - Footer for authenticated pages with Help, Privacy, Terms links (DONE: src/components/layout/AppFooter.tsx exists)
- [x] Add AppFooter to all app pages - Consistent footer across the app (DONE: Added to layout.tsx)
- [x] Add ESC key handler to mobile menu - Close menu on Escape key press
- [x] Fix onboarding redirect - Change /onboarding completion to redirect to /collection instead of /dashboard
- [x] Add "What's Next" card to Dashboard - Guide new users to Browse Sets, Learning Resources after onboarding
- [x] Standardize back link styling - Use consistent gap, font-weight, and hover colors across all pages
- [ ] Add parent features indicator - Badge on profile menu showing "Parent features available" when applicable
- [ ] Remove "Back to Home" link from dashboard - Dashboard IS home, the link is redundant (src/app/dashboard/page.tsx)

## CRITICAL - Landing Page Content Updates (January 2026)

Detailed landing page text changes to support multi-TCG while keeping Pokemon prominent.

**IMPORTANT:** We support ONLY 4 games: Pokemon, One Piece, Disney Lorcana, Yu-Gi-Oh!
Do NOT mention Digimon, Dragon Ball, or Magic: The Gathering anywhere.

- [ ] Line 103: Change "Pokemon Cards" to "Trading Cards" in main headline
- [x] Line 185: Change "Browse through all Pokemon card sets" to "Browse sets from Pokemon, Yu-Gi-Oh!, Lorcana, One Piece, and more"
- [ ] Line 236: Change "CardDex makes tracking your Pokemon cards fun" to "CardDex makes tracking your trading cards fun"
- [ ] Line 564: Change "Pokemon Sets" to "Trading Card Sets" in stats section
- [ ] Line 628: Change "All 500+ Pokemon sets" to "All 500+ sets across 4 games" (Free plan)
- [ ] Line 703: Change "All 500+ Pokemon sets" to "All 500+ sets across 4 games" (Family plan)
- [ ] Lines 524-544: Diversify wishlist example cards to include Yu-Gi-Oh! and Lorcana examples alongside Pokemon (NO Digimon, Dragon Ball, or MTG)
- [ ] Line 779: Change "organize their Pokemon card collections" to "organize their trading card collections"
- [ ] Line 1004: Change "take control of your Pokemon card collection" to "take control of your trading card collection"
- [ ] Add TCG disclaimer for other games in footer - Add disclaimers for Yu-Gi-Oh! (Konami), Disney Lorcana (Ravensburger), One Piece (Bandai) alongside Pokemon Company

---

## Coding Guidelines

**READ THESE BEFORE STARTING ANY TASK:**

1. **No Emojis in UI** - Use SVG icons instead of emojis for a professional look. Use Heroicons (`@heroicons/react`) or create custom SVGs.

2. **Icon Library** - Example:

   ```tsx
   import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/solid';
   ```

3. **Replace existing emojis** - When working on a file that contains emojis, replace them with appropriate SVG icons.

4. **Kid-friendly but professional** - Use color and animation instead of emojis to convey fun.

5. **File Focus** - Only modify files in `src/app/`, `src/components/`, and styling files. Do NOT modify `convex/` or API routes.

---

## HIGH PRIORITY - Landing Page & Card Values

- [x] Redesign home page as kid-focused marketing landing page (hero with excited kid imagery, colorful, fun animations)
- [x] Add "How it works" section: 1) Pick your sets 2) Tap cards you own 3) Earn badges & share wishlists
- [x] Create feature highlights section (achievements, family sharing, wishlist for gifts)
- [x] Add login/signup buttons to site header (sticky nav)
- [x] Create pricing section showing Free vs Family plan with kid-friendly icons
- [x] Add testimonials/social proof section (can be placeholder for now)
- [x] Display card market value on each card in CardGrid (show "$X.XX" badge from tcgplayer.prices)
- [x] Show total collection value on My Collection page ("Your collection is worth $XX!")
- [x] Add "Most Valuable Cards" section to collection page (top 5 by price)

## UI Tasks

- [x] Replace all emojis with SVG icons across the codebase (search for emoji patterns in tsx files)
- [x] Update CardGrid UI to show variant selector when adding cards (only show variants that exist based on tcgplayer.prices)
- [x] Display owned variants on card (e.g., "Normal x2, Reverse x1") with distinct visual indicators
- [x] Create celebration animations for badge unlocks (confetti, glow effects)
- [x] Build Trophy Case UI showing all earned/locked badges with progress indicators
- [x] Build parent dashboard UI with collection overview cards per child
- [x] Add activity feed component showing recent cards added with timestamps
- [x] Create wishlist UI - mark cards as wanted with heart icon
- [x] Build priority starring UI for wishlist items (max 5 stars)
- [x] Create public wishlist view page (read-only, shareable)
- [x] **My Wishlist page** (`/my-wishlist`) - Dedicated page to view all wishlisted cards, generate share link, manage priorities
- [x] **Export/print wishlist PDF** - Button to export wishlist as printable PDF (for sharing with family)
- [x] **Copy wishlist share link button** - Generate and copy shareable link from My Wishlist page
- [x] Build duplicate finder UI comparing sibling collections side-by-side
- [x] Create export/print checklist PDF button and preview
- [x] Add pricing toggle UI for parent dashboard (show/hide TCGPlayer prices)
- [x] Add responsive design for mobile-first experience (test all pages on mobile)
- [x] Add loading states and skeleton screens to all data-fetching components
- [x] Implement user-friendly error messages and error boundaries
- [x] Accessibility audit and fixes (WCAG 2.1 AA) - focus states, aria labels, color contrast

### Core Features

- [x] "Just Pulled" mode - Quick-add flow for pack openings (tap cards rapid-fire with minimal UI, full-screen card grid)
- [x] Random card button - Shows a random card from collection (fun for kids to browse)
- [x] Rarity filter UI - Filter collection by rarity (Common → Uncommon → Rare → Ultra Rare → Secret Rare)
- [x] "New in collection" badge - Cards added in last 7 days get sparkle/shimmer effect
- [x] Kid mode / age toggle - Simplified interface option for younger users (6-8) vs full features (12-14)
- [x] Japanese promo cards display - Show Japanese promos correctly

### Master Set Mode & Variant Tracking UI

For families with serious collectors who want to track complete "master sets" including all variants.

**Master Set Mode Toggle:**

- [ ] Add "Master Set Mode" toggle to Settings page under "Collector Preferences" section
- [ ] Show description: "Track every variant (Normal, Holo, Reverse Holo) separately for complete master set progress"
- [ ] Toggle should be per-profile (each family member can have different preference)

**Dual Progress Display in Stats Bar:**

- [ ] Update VirtualCardGrid stats bar to support dual progress mode
- [ ] Primary row: "172/172 cards" with percentage (always visible, big numbers)
- [ ] Secondary row: "280/344 variants" with percentage (smaller text, muted color)
- [ ] Only show secondary row when: Master Set Mode ON, or user has any variant tracking data
- [ ] Add info tooltip explaining "Cards = unique Pokemon, Variants = including Normal/Holo/Reverse versions"

**Variant Badges on All Cards:**

- [ ] Show N/H/R variant indicators on ALL cards in grid (not just owned)
- [ ] Unowned variants: muted/outline badge style (gray border, no fill)
- [ ] Owned variants: filled badge with quantity (e.g., "N×2", "R×1")
- [ ] Add hover tooltip: "Normal: 2 owned", "Reverse Holo: Not owned"
- [ ] Hide variant badges in simplified/kid mode to reduce visual clutter

**Missing Variants Filter:**

- [ ] Add VariantFilter component next to RarityFilter on set detail page
- [ ] Filter pill options: "All Variants", "Missing Normal", "Missing Reverse", "Missing Any", "Complete"
- [ ] When filter active, highlight the specific missing variant badge on each card
- [ ] Add card count badge to each filter option showing how many cards match

**Master Set Achievement Badges UI:**

- [ ] Add "Master Collector" badge category to Trophy Case
- [ ] Badge: "Set Master" - Complete all variants for any set (special crown icon)
- [ ] Badge: "Reverse Hunter" milestone badges (10/50/100/250 reverse holos collected)
- [ ] Badge: "Variant Completionist" - Own both Normal and Reverse for 50+ cards

### Gamification UI

- [x] Visible daily streak counter - Fire icon + "5 day streak!" prominently in header/nav
- [x] Level-up system UI - XP bar, level display, XP gain notifications when adding cards
- [x] Collection milestones celebrations - First 10, 50, 100, 500 cards with big celebration modals
- [x] Unlockable avatar items UI - Profile customization with earned hats, frames, badges

### Educational Features UI

- [x] "Learn to Collect" tutorials - Interactive guide screens for card organization, binder setup, card care
- [x] Add example cards and images to tutorials - Fetch real Pokemon card images to illustrate tutorial steps where relevant (e.g., show actual holo vs non-holo, rarity symbols, card conditions)
- [x] Rarity explainer tooltips - Hover/tap tooltips explaining what Common/Uncommon/Rare/Ultra Rare means
- [x] Set structure intro - Onboarding flow explaining how sets work, what a "master set" is
- [x] Card condition basics guide - Visual guide showing NM/LP/MP/HP differences (age-appropriate)

### Navigation & Dashboard Architecture

- [x] Create MarketingHeader component (src/components/layout/MarketingHeader.tsx) - For landing page: Logo, Features, Pricing links, Login, Sign Up only
- [x] Create AppHeader component (src/components/layout/AppHeader.tsx) - For logged-in users: Logo, My Collection, Browse Sets, Badges, Wishlist, Search, Profile menu
- [x] Auth-aware header switching - Show MarketingHeader when not logged in, AppHeader when logged in
- [x] Kid Dashboard page (/dashboard) - Post-login home: collection stats, recent activity, badge progress, streak counter, quick actions
- [x] Update Header to show "CardDex" instead of "KidCollect" - Rebrand to new name
- [x] Remove app nav links from landing page - Visitors shouldn't see Browse Sets, My Collection etc.
- [x] Parent Dashboard access - Only show Parent Dashboard link for parent accounts, not kid profiles

### Multi-TCG Game Selector

**NOTE:** We now only support 4 games: Pokemon, One Piece, Disney Lorcana, Yu-Gi-Oh!
The tasks below were completed with 7 games - see CRITICAL section for removal tasks.

- [x] Onboarding game selector - "What do you collect?" screen with TCG logos (needs update to 4 games)
- [x] Settings game toggle - Allow changing selected games anytime in profile settings (needs update to 4 games)
- [x] Sets page game filter - Tabs: [All] [Pokémon] [Yu-Gi-Oh!] [One Piece]... Only show enabled games
- [x] Per-game color theming - CSS variables for each game's primary color
- [x] Game-specific achievements - "Pokémon Master" vs "Duelist Champion" vs cross-game badges
- [x] Game logos/icons - SVG components for each TCG logo in src/components/icons/tcg/

### Polish & UX

- [x] Dark mode toggle - System preference detection + manual toggle
- [x] Offline viewing indicator - Show when viewing cached data, sync status
- [x] Update landing page with new tagline - "All your cards. One app."
- [x] Add trust signals to landing page - COPPA badge, "No ads ever" shield, "Cloud backup" icon
- [x] Set completion confetti - Big celebration when hitting 100% on a set
- [x] Optimize card grid scrolling performance - Virtual scrolling for large collections
- [x] Create onboarding flow - New user walkthrough: pick games, create profile, add first cards

### UI Cleanup & Settings Consolidation (HIGH PRIORITY)

- [x] Create dedicated Settings page (`/settings`) - Central hub for all user preferences and accessibility options
- [x] Move accessibility toggles from header to Settings page - Relocate Dark Mode, Low-Stimulation, Dyslexic Font, High Contrast, Reduced Motion, Focus Mode toggles
- [x] Simplify header - Keep only essential items: logo, main nav, single settings gear icon, profile menu
- [x] Add Settings link to profile dropdown menu - Quick access from anywhere in the app
- [x] Create Settings page sections - Organize into: Display (dark mode, kid mode), Accessibility (low-stim, dyslexic font, high contrast, reduced motion, focus mode), Games (TCG selection), Notifications
- [x] Add "quick settings" popover from gear icon - Allow fast access to most-used settings (dark mode, kid mode) without leaving current page

### Forgiving Streak System (Research-based)

- [x] Grace day streak protection - 1 "grace day" per week that doesn't break streak when missed
- [x] Weekend pause toggle - Optional setting to pause streak requirements on weekends
- [x] Streak repair with XP - Spend accumulated XP to repair a recently broken streak (teaches consequence/value)
- [x] Visual streak calendar - Show past 30 days with activity markers and grace days used
- [x] Streak milestone rewards - Special avatar items or badges at 7, 14, 30, 60, 100 day streaks

### Virtual Experience Features

- [x] Virtual Pack Opening Simulator - 2 free daily "packs" with realistic opening animations (random cards from user's collected sets, no purchases)
- [x] Pack opening haptics/sounds - Toggle-able whoosh and sparkle sounds, phone vibration for rare pulls
- [x] Virtual Trophy Room - 3D-style display shelves showing user's top 10 rarest/most valuable cards with glow effects
- [x] Digital binder view - Page-turn animations, customizable binder cover themes (Pokemon types, starter themes)
- [x] Card flip animation - Tap any card to see the back design with smooth 3D flip effect
- [x] Card zoom with pinch - Pinch to zoom on card artwork, pan around for detail viewing

### Collection Timeline & Story

- [x] Timeline View - Chronological view of when cards were added with month markers and "collection anniversaries"
- [x] First card celebration - Special permanent badge/display for user's very first card (nostalgia feature)
- [x] Collector's Journey Story Mode - Adventure narrative that unlocks chapters based on collection milestones
- [x] Adventure Map visualization - Visual map showing Pokemon regions unlocked based on sets/types collected
- [x] Collection stats over time - Graphs showing collection growth, cards per month, value over time

### Family & Social Features

- [x] Family Collection goals - Shared collection goal between parent and child accounts with combined progress bar
- [x] Sleep mode scheduling - Parent-controlled quiet hours where app shows calming "Time for bed!" screen
- [x] Trade suggestion engine - Suggest trades between siblings based on wishlists and duplicate cards
- [x] Family leaderboard - Opt-in friendly competition between family members (cards collected this week)
- [x] Shared wishlist viewing - Parents can view all children's wishlists in one place for gift planning

### Financial Literacy (Kid-Friendly)

- [x] Savings goals calculator - "Want this $50 card? Here's how long saving $5/week takes" with visual piggy bank progress
- [x] Wishlist total tracker - Show combined estimated value of all wishlisted items
- [x] Budget-friendly alternatives - Suggest similar but cheaper cards when viewing expensive wishlist items
- [x] "Is it worth it?" helper - Educational comparison showing what else you could buy for the same price

### Educational Mini-Games

- [x] "Grade Like a Pro" mini-game - Show card images, user guesses condition (NM/LP/MP/HP), earn XP for correct answers
- [x] Rarity guessing game - Show card artwork only, guess the rarity before reveal
- [x] Set symbol matching game - Match set symbols to set names for learning
- [x] Pokemon type quiz - Quick quiz on Pokemon types based on cards in collection
- [x] Price estimation game - Guess if card is worth more or less than $X (teaches value awareness)

### Enhanced Accessibility

- [x] Low-stimulation mode - Autism-friendly mode with reduced animations, muted colors, no sounds, simpler layouts
- [x] OpenDyslexic font option - Toggle dyslexia-friendly font throughout app
- [x] High-contrast mode - Enhanced contrast beyond standard dark mode for vision accessibility
- [x] Screen reader optimization - Enhanced ARIA descriptions, live regions for all dynamic content
- [x] Reduced motion beyond system - Manual toggle for reduced motion even if system preference isn't set
- [x] Focus mode - Hide all gamification elements for users who find them overwhelming

### Engagement & Retention

- [x] Daily stamp collection - Non-consecutive stamp system (collect 5 stamps in a week for reward, doesn't need to be consecutive)
- [x] Weekly challenges - "Add 3 water-type cards this week" with themed rewards
- [x] Comeback rewards - Special welcome back celebration and bonus XP for returning after absence
- [x] Collection snapshot sharing - Generate shareable image of collection stats/highlights for social media

### AI-Powered Features UI

UI components for AI features. Backend actions are in `convex/ai/`. These components provide the user interface for AI-powered card scanning, chat, stories, and quizzes.

#### Card Scanner UI

- [ ] AI-008: Build camera capture component (`src/components/ai/CardScanner.tsx`) - Camera preview with capture button, image preview, "Scan Card" action
- [ ] AI-011: Create "Snap to Add" UI flow with confirmation step - Show AI identification result, allow user to confirm/correct before adding to collection
- [ ] AI-012: Add scanner button to collection/set detail pages - Camera icon button that opens CardScanner modal

#### Collection Chatbot UI

- [ ] AI-016: Build chat UI component (`src/components/ai/CollectionChat.tsx`) - Chat bubble interface with message history, input field, send button
- [ ] AI-017: Create friendly assistant avatar and personality - Animated avatar for chatbot, typing indicator, themed to CardDex brand
- [ ] AI-020: Add chat button to dashboard/collection pages - Floating chat bubble or sidebar panel trigger

#### Card Storyteller UI

- [ ] AI-023: Create story display modal (`src/components/ai/CardStoryModal.tsx`) - Modal showing AI-generated story and fun facts about a card
- [ ] AI-024: Add "Tell me about this card!" button to card detail view - SparklesIcon button on cards that opens story modal
- [ ] AI-026: Add loading states and error handling - Skeleton loading for stories, friendly error messages if generation fails

#### AI Quiz UI

- [ ] AI-028: Build quiz UI component (`src/components/ai/AIQuiz.tsx`) - Multiple choice questions from user's collection, timer, score display
- [ ] AI-030: Add AI quiz to Learn page alongside existing mini-games - Quiz banner with SparklesIcon, "Quiz Me!" CTA

#### Advanced AI Features UI (P2)

- [ ] Create recommendations panel (`src/components/ai/RecommendationsPanel.tsx`) - "Cards you might like" section for collection/wishlist pages
- [ ] Create trade advisor UI (`src/components/ai/TradeAdvisor.tsx`) - Sibling trade suggestions in parent dashboard
- [ ] Create shopping assistant UI (`src/components/ai/ShoppingAssistant.tsx`) - Gift helper for parents with budget input and recommendations
- [ ] Create condition grader tutorial (`src/components/ai/ConditionGrader.tsx`) - Upload photo, see AI explanation of card condition

---

## LOW PRIORITY - Card Examples Across All 4 TCGs (Polish)

Replace Pokemon-only card examples with diverse examples from the **4 supported TCGs** throughout the landing page. These are visual polish tasks - do after core functionality is complete.

**IMPORTANT:** We only support 4 games: Pokemon, Yu-Gi-Oh!, Disney Lorcana, One Piece. Do NOT include Digimon, Dragon Ball, or MTG.

- [ ] Hero card showcase - Show 4 cards (one from each TCG) in a fan/spread layout: Charizard (Pokemon), Blue-Eyes White Dragon (Yu-Gi-Oh!), Elsa (Lorcana), Monkey D. Luffy (One Piece)
- [ ] Wishlist example section - Replace Pokemon-only wishlist with mixed TCG examples showing cards from all 4 games
- [ ] Collection preview mockup - Update any collection screenshots/mockups to show cards from multiple TCGs
- [ ] Testimonials section - If testimonials mention specific cards/games, diversify across 4 TCGs or make game-agnostic

---

## Progress

- **2026-01-17**: Completed Add "What's Next" card to Dashboard task - Created WhatsNextCard component (`src/components/dashboard/WhatsNextCard.tsx`) that guides new users after onboarding. Features: shows for users with fewer than 10 cards, displays two suggested next steps (Browse Sets and Learn to Collect), tracks completion status with visual indicators (Browse Sets marked done when user has started a set), dismissible with localStorage persistence, encouragement message for users with 0 cards, accessible with ARIA region role and dismiss button label, decorative background elements matching CardDex brand. Integrated into KidDashboard between Stats Grid and Quick Actions sections. Added 26 unit tests in `src/components/dashboard/__tests__/WhatsNextCard.test.tsx` covering visibility logic, content, step completion, navigation links, dismiss functionality, and accessibility. Uses Heroicons (RocketLaunchIcon, Square3Stack3DIcon, BookOpenIcon, XMarkIcon, ArrowRightIcon, SparklesIcon, CheckCircleIcon). Commit: 222ef60
- **2026-01-17**: Completed Memoize cardData Map in CollectionView task - Changed `cardData` from `useState<Map<string, PokemonCard>>` storing a Map directly to using `useMemo` that derives the Map from a `fetchedCards: PokemonCard[]` array state. This ensures the Map is only rebuilt when the fetched cards data actually changes, preventing unnecessary recreation on every render. Updated `src/components/collection/CollectionView.tsx` to store raw cards array in state and derive the Map via useMemo with `fetchedCards` as dependency. Added 5 unit tests in `src/components/collection/__tests__/CollectionView.test.tsx` covering: collection value calculation from memoized data, set grouping using memoized data, most valuable cards derived from Map, no fetch when collection is empty, and fetch called only once for a given collection. Commit: 8749922
- **2026-01-17**: Completed Protect /parent-dashboard route task - Added authentication protection to `/parent-dashboard` page to redirect unauthenticated users to `/login`. Updated `src/app/parent-dashboard/page.tsx` to use `useConvexAuth` hook for auth state checking, `useRouter` for navigation, and `useEffect` for redirect logic. Added loading spinner with indigo/purple gradient theme matching the page design. Parent role check via `hasParentAccess` query only runs after auth is confirmed (uses 'skip' argument when not authenticated). Removed NOT_AUTHENTICATED case from access denied UI since redirect now handles that case. Added 18 unit tests in `src/app/parent-dashboard/__tests__/page.test.tsx` covering authentication protection, parent access checks, component rendering, and loading states. Follows same pattern as other protected routes (`/dashboard`, `/collection`, `/my-wishlist`, `/badges`, `/settings`, `/streak`, `/learn`). Commit: e54baee
- **2026-01-17**: Completed Protect /learn route task - Added authentication protection to `/learn` page to redirect unauthenticated users to `/login`. Updated `src/app/learn/page.tsx` to use `useConvexAuth` hook for auth state checking, `useRouter` for navigation, and `useEffect` for redirect logic. Added loading spinner with purple/indigo gradient theme matching the page design. Updated `src/app/__tests__/LearnPage.test.tsx` to mock convex/react and next/navigation hooks to support new auth requirements. Follows same pattern as other protected routes (`/dashboard`, `/collection`, `/my-wishlist`, `/badges`, `/settings`, `/streak`). Commit: 153121c
- **2026-01-17**: Completed Protect /badges route task - Added authentication protection to `/badges` (Trophy Case) page to redirect unauthenticated users to `/login`. Updated `src/app/badges/page.tsx` to use `useConvexAuth` hook for auth state checking, `useRouter` for navigation, and `useEffect` for redirect logic. Added loading spinner with amber/orange gradient theme matching the page. Follows same pattern as other protected routes (`/dashboard`, `/collection`, `/my-wishlist`, `/streak`). Commit: 956a639
- **2026-01-17**: Completed Protect /my-wishlist route task - Added authentication protection to `/my-wishlist` page to redirect unauthenticated users to `/login`. Updated `src/app/my-wishlist/page.tsx` to use `useConvexAuth` hook for auth state checking, `useRouter` for navigation, and `useEffect` for redirect logic. Added loading spinner while auth state is being checked. Follows same pattern as other protected routes (`/dashboard`, `/collection`). Commit: 2601c71
- **2026-01-17**: Completed CRITICAL auth redirect fixes for login/signup pages - Updated both `/login/page.tsx` and `/signup/page.tsx` to redirect authenticated users appropriately. Both pages now check `hasCompletedOnboarding()` from onboardingFlow lib: if user has completed onboarding, redirect to `/dashboard`; if not, redirect to `/onboarding`. This ensures existing users visiting auth pages go to dashboard while new users who just signed up still go through onboarding. Commit: 3a11eec
- **2026-01-17**: Completed Create BackLink component - Created reusable BackLink component (src/components/ui/BackLink.tsx) for consistent back navigation across all pages. Features: ArrowLeftIcon from Heroicons, consistent text styling (text-sm, font-medium, text-gray-600), hover transition to kid-primary brand color, focus-visible ring styling for keyboard navigation, dark mode support (dark:text-slate-400), withMargin prop for optional mb-4 spacing, aria-label prop for custom accessibility labels, full TypeScript types with JSDoc documentation. Added 28 unit tests covering prop validation, styling, icon properties, usage patterns, and accessibility requirements. Uses cn() utility for class merging. Commit: 3205d6c
- **2026-01-17**: Completed Create /signup page - Created dedicated signup page at src/app/signup/page.tsx with CardDex branding, kid-primary/kid-secondary gradients, and signup-focused copy. Updated AuthForm component to accept defaultMode prop for controlling initial mode. Redirects authenticated users to /onboarding. Commit: f9b4f63
- **2026-01-17**: Completed Add parent vs kid account selection and Fix AuthForm styling - Added two-step signup flow to AuthForm component (src/components/auth/AuthForm.tsx). First step asks users to choose between Family Account (for parents managing kidsx27 collections) or Individual Collector (for solo collectors). Features: UserGroupIcon and UserIcon for visual distinction, CardDex brand gradients throughout, account type indicator with change button on credentials step, updated placeholder text based on selection, replaced all blue-600 colors with kid-primary/kid-secondary brand colors. Commit: f3485f1
- **2026-01-16**: Completed Price Estimation Game - Created PriceEstimationGame component (src/components/games/PriceEstimationGame.tsx) that teaches card value awareness. Features: 12 cards with varied prices from $0.25 to $280 (including Charizard, Umbreon alt art, commons), 5-round gameplay where players guess if card is worth more or less than a given price, hint system explaining value factors, XP rewards (20 per correct, 50 bonus for perfect), results screen with round summary showing actual prices. Added game banner to Learn page with CurrencyDollarIcon in emerald/teal gradient theme. Uses Heroicons (CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, StarIcon, LightBulbIcon, TrophyIcon, SparklesIcon, CheckIcon, XMarkIcon, ArrowPathIcon, PlayIcon, ChevronRightIcon, BoltIcon). Commit: 20d1fcf
- **2026-01-16**: Completed Pokemon Type Quiz - Created PokemonTypeQuiz component (src/components/games/PokemonTypeQuiz.tsx) for learning Pokemon TCG energy types. Features: 10 types (Fire, Water, Grass, Electric, Psychic, Fighting, Darkness, Metal, Dragon, Colorless), 12 Pokemon challenges from Sword & Shield base set, 5-round quiz with 4 type options per round, hint system, XP rewards (20 per correct, 50 bonus for perfect), results screen with round summary. Added game banner to Learn page with FireIcon in orange/red gradient theme. Uses Heroicons (FireIcon, StarIcon, LightBulbIcon, TrophyIcon, SparklesIcon, CheckIcon, XMarkIcon, ArrowPathIcon, PlayIcon, ChevronRightIcon, BoltIcon). Commit: 14758c8
- **2026-01-16**: Completed Set Symbol Matching Game - Created SetSymbolMatchingGame component (src/components/games/SetSymbolMatchingGame.tsx) for learning Pokemon TCG set symbols. Features: 12 popular sets from Sword & Shield and Scarlet & Violet eras, 5-round matching gameplay where players match symbols to set names from 4 options, hint system with set descriptions, XP rewards (20 per correct, 50 bonus for perfect), progress tracking, results screen with round summary. Added game banner to Learn page with PuzzlePieceIcon in blue/cyan gradient theme. Uses Heroicons (PuzzlePieceIcon, StarIcon, LightBulbIcon, TrophyIcon, SparklesIcon, CheckIcon, XMarkIcon, ArrowPathIcon, PlayIcon, ChevronRightIcon, BoltIcon). Commit: 8a3cc14
- **2026-01-16**: Completed Rarity Guessing Game - Integrated RarityGuessingGame component into Learn page. Game shows Pokemon card images and asks users to guess the rarity (Common, Uncommon, Rare, Rare Holo, Ultra Rare, Secret Rare). Features: intro screen with tips on identifying rarities, 5-round gameplay with hint system, instant feedback with explanations, progress tracking and XP rewards, results screen with round summary and play again option. Added game banner section to Learn page with QuestionMarkCircleIcon. Component at src/components/games/RarityGuessingGame.tsx. Uses Heroicons throughout. Commit: 779c7b3
- **2026-01-16**: Completed "Is it worth it?" helper - Created IsItWorthIt component (src/components/financial/IsItWorthIt.tsx) for educational price comparison. Features: shows what else the card's price could buy (movie tickets, pizza, video games, bowling, booster packs, ETBs, sleeves, binders, savings), quick stats showing equivalent booster packs and movie tickets, category filter (All/Fun/Collect/Save), thoughtful prompt encouraging kids to consider value, custom SVG icons for each comparison item, IsItWorthItButton compact modal trigger for cards >= $5. Integrated into wishlist cards alongside budget alternatives. Uses Heroicons (ScaleIcon, XMarkIcon, ShoppingCartIcon, SparklesIcon, LightBulbIcon, ChevronRightIcon, ArrowRightIcon). Commit: 6b4afc7
- **2026-01-16**: Completed Budget-friendly alternatives - Created BudgetAlternatives component (src/components/financial/BudgetAlternatives.tsx) that suggests similar but cheaper cards when viewing expensive wishlist items. Features: searches for cards with same base Pokemon name but lower price, shows savings amount and percentage, allows adding alternatives directly to wishlist, expandable panel with lightbulb icon, BudgetAlternativesBadge compact trigger shown on wishlist cards >= $5. Integrated into My Wishlist page (/my-wishlist) with modal display and wishlist state sync. Uses Heroicons (LightBulbIcon, ArrowTrendingDownIcon, SparklesIcon, XMarkIcon, CurrencyDollarIcon, ChevronRightIcon, HeartIcon). Commit: bda63d7
- **2026-01-16**: Completed Wishlist total tracker - Added "Est. Total Value" stat to My Wishlist page showing combined estimated market value of all wishlisted cards. Uses TCGPlayer prices (normal, holofoil, or reverseHolofoil market values). Features: loading skeleton during price fetch, formatPrice helper for compact display ($1.2k format for large values), CurrencyDollarIcon in emerald theme. Updated stats section layout to accommodate 4 stats with responsive flex-wrap. Commit: d95adcd
- **2026-01-16**: Completed Savings Goal Calculator - Created SavingsGoalCalculator component (src/components/financial/SavingsGoalCalculator.tsx) for kid-friendly financial literacy. Features: visual piggy bank SVG that fills based on progress with color-coded fill levels, weekly savings amount selector ($1-$20/week), timeline calculation showing weeks and months to reach goal, target date display, progress milestones visualization (25%, 50%, 75%, 100%), motivational tips section, SavingsGoalButton compact modal trigger for card details. Uses Heroicons (CurrencyDollarIcon, SparklesIcon, CalendarDaysIcon, ChevronUpIcon, ChevronDownIcon, CheckCircleIcon, ClockIcon, XMarkIcon). Commit: 626632d
- **2026-01-16**: Completed Grade Like a Pro mini-game - Created GradeLikeAProGame component (src/components/games/GradeLikeAProGame.tsx) for educational card condition grading practice. Features: intro screen explaining XP rewards (25 XP per correct, 50 bonus for perfect), 5-round gameplay showing Pokemon card images and asking user to guess condition (NM/LP/MP/HP), hint system with toggle button, instant feedback showing correct answer with explanation, progress bar and score tracking, results screen with performance summary and XP earned, play again functionality. Added prominent mini-game banner to Learn page with GradeLikeAProButton launcher. Uses Heroicons (AcademicCapIcon, StarIcon, BoltIcon, LightBulbIcon, CheckIcon, XMarkIcon, TrophyIcon, ChevronRightIcon, ArrowPathIcon, PlayIcon, SparklesIcon). Commit: 56e6704
- **2026-01-16**: Completed Adventure Map visualization - Created AdventureMap component (src/components/collection/AdventureMap.tsx) showing Pokemon regions unlocked based on card types collected. Features: 9 regions (Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar, Paldea) each requiring 5 cards of a specific type to unlock (Fire, Grass, Water, Psychic, Electric, Fairy, Fighting, Metal, Dragon), interactive map with positioned region nodes, SVG path connections between regions, progress rings on locked regions, region detail panel with unlock requirements, overall progress header. Uses Heroicons (MapIcon, LockClosedIcon, CheckCircleIcon, SparklesIcon). Commit: a1b7618
- **2026-01-16**: Completed Collector's Journey Story Mode - Created CollectorsJourneyStory component (src/components/collection/CollectorsJourneyStory.tsx) with adventure narrative that unlocks chapters based on collection milestones. Features: 7 story chapters (1 card to 500 cards), animated chapter cards with progress bars for locked chapters, immersive story reader modal with decorative background patterns, journey header with overall progress tracking, milestone-based unlock system using existing getMilestoneProgress query, gradient themes per chapter, skeleton loading state, next chapter hints. Uses Heroicons (BookOpenIcon, LockClosedIcon, SparklesIcon, CheckCircleIcon, ChevronRightIcon, MapIcon, StarIcon, TrophyIcon, FireIcon, BoltIcon, RocketLaunchIcon, GlobeAltIcon). Commit: 89e2e3e
- **2026-01-16**: Completed trade suggestion engine - Created TradeSuggestionEngine component (src/components/family/TradeSuggestionEngine.tsx) that suggests trades between siblings based on wishlists and duplicate cards. Features: collapsible panel in ParentDashboard, suggests cards where one sibling has duplicates (quantity > 1) that another sibling might want, visual badges for wishlist matches (rose "Wanted") vs extra cards (emerald "Extra"), card images with quantity badges, sorted by priority (wishlist first then by quantity), skeleton loading state, empty state messaging, responsive design. Added to ParentDashboard component. Uses Heroicons (LightBulbIcon, HeartIcon, CheckCircleIcon, ArrowsRightLeftIcon). Commit: 4f437c1
- **2026-01-15**: Completed loading states and skeleton screens - Created reusable Skeleton component library (src/components/ui/Skeleton.tsx) with animated shimmer effects. Added CardSkeleton, CardGridSkeleton, StatsBarSkeleton, SetCardSkeleton, CollectionGroupSkeleton, SearchResultsSkeleton, and FilterPanelSkeleton. Updated CardGrid, SearchResults, CollectionView, collection page, and browse page to use skeleton screens instead of basic loading spinners. Also replaced browse page emoji with FunnelIcon SVG. Commit: bd35695
- **2026-01-15**: Completed priority starring UI - Added star icon button next to heart on wishlisted cards. Star toggles priority status (max 5 items). Added priority count indicator in stats bar showing 5 stars visual. Disabled state when max reached. Also replaced progress indicator emojis with SVG icons (Crown, Trophy, Map, Compass) and loading state emoji with custom CardIcon SVG. Commit: 672daef
- **2026-01-15**: Completed wishlist UI - Added heart icon button to CardGrid component. Heart appears on hover, fills rose when wishlisted. Uses Heroicons and Convex mutations for toggle functionality. Commit: 7dfeddb
- **2026-01-15**: Completed error boundaries and user-friendly error messages - Created reusable ErrorBoundary component with ErrorFallback UI (src/components/ui/ErrorBoundary.tsx). Added InlineError for compact error display with retry buttons. Created error.tsx pages for /sets and /sets/[setId] routes with friendly messaging. Added global-error.tsx for root layout errors and not-found.tsx for 404 pages. Updated search and browse pages to use InlineError with retry functionality. Updated CollectionView to use ErrorFallback with proper retry logic. All error states use Heroicons (ExclamationTriangleIcon, ArrowPathIcon) and include recovery options. Commit: b6acecf
- **2026-01-15**: Completed activity feed component - Created ActivityFeed component (src/components/activity/ActivityFeed.tsx) displaying recent collection activity with timestamps. Features color-coded action types (green for card_added, orange for card_removed, amber for achievement_earned), relative time formatting ("2 hours ago", "Just now"), skeleton loading states via ActivityFeedSkeleton, and empty state messaging. Integrated as sticky sidebar on collection page with responsive 4-column grid layout. Uses Heroicons (PlusCircleIcon, MinusCircleIcon, TrophyIcon, ClockIcon). Commit: a082dc6
- **2026-01-15**: Completed public wishlist view page - Created read-only, shareable wishlist page at /wishlist/[token]. Features: fetches wishlist data via share token using Convex getWishlistByToken query, displays profile name with total wanted cards and priority count, shows priority (starred) items in separate "Most Wanted" section, fetches card images from Pokemon TCG API, copy link button with visual feedback, loading states with skeleton screens, error handling with friendly messaging and retry options, invalid/expired link handling with clear UX. Rose/pink gradient theme to distinguish from main app. Includes loading.tsx and error.tsx route files. Uses Heroicons (HeartIcon, StarIcon, GiftIcon, LinkIcon, CheckIcon). Commit: b0aade8
- **2026-01-15**: Completed duplicate finder UI - Created DuplicateFinder component (src/components/collection/DuplicateFinder.tsx) for comparing collections between family members side-by-side. Features: profile selector dropdowns to pick two profiles to compare, stats overview showing shared cards and unique cards per profile, visual display of duplicate cards both profiles own with quantity badges (indigo for profile1, pink for profile2), tradeable cards sections showing unique cards that could be traded, hover tooltips showing ownership details, loading skeletons via DuplicateFinderSkeleton, error handling. Added /compare page with loading.tsx and error.tsx. Updated collection page with "Compare Collections" button. Uses Heroicons (ArrowsRightLeftIcon, UserGroupIcon, CheckCircleIcon, ArrowRightIcon, ArrowLeftIcon, ExclamationTriangleIcon). Commit: 55105af
- **2026-01-15**: Completed card market value display - Added price badge to CardGrid showing TCGPlayer market value for each card. Features: getCardMarketPrice() helper extracts best price (prefers normal > holofoil > reverseHolofoil), formatPrice() handles smart decimal formatting, price badge displays next to card number with CurrencyDollarIcon, high-value cards ($10+) use amber/gold gradient styling, regular cards use emerald badge, tooltip shows full price on hover. Commit: f0fb1f9
- **2026-01-15**: Completed total collection value display - Added prominent value banner to CollectionView (src/components/collection/CollectionView.tsx) showing "Your collection is worth $XX!" message. Features: emerald-to-cyan gradient banner with CurrencyDollarIcon and SparklesIcon, calculates total value from all cards multiplied by quantity, shows count of priced cards, displays notice when some cards lack price data, includes loading skeleton state matching banner layout. Uses useMemo for efficient value calculation, reuses getCardMarketPrice() helper for consistency with card-level pricing. Commit: 9f17316
- **2026-01-15**: Completed Most Valuable Cards section - Added prominent "Most Valuable Cards" section to CollectionView showing top 5 highest-value cards. Features: rank badges with gradient styling (gold #1 with FireIcon, silver #2, bronze #3, gray #4-5), responsive grid layout (2 cols mobile, 5 cols desktop), card images with quantity badges, price display in emerald green, amber/orange gradient background with decorative elements, skeleton loading state. Uses TrophyIcon for section header. Sorts cards by TCGPlayer market price descending. Commit: 01f4068
- **2026-01-15**: Completed login/signup buttons in site header - Created Header component (src/components/layout/Header.tsx) with sticky navigation bar. Features: site logo with gradient branding, desktop nav links (Browse Sets, My Collection, Search, Browse) with active state highlighting, Login button with ArrowRightOnRectangleIcon, Sign Up button with UserPlusIcon and kid-primary gradient styling, mobile-responsive hamburger menu with full navigation and auth buttons, backdrop blur effect on scroll. Added Header to root layout. Adjusted home page to account for header height. Uses Heroicons throughout. Commit: b2c2f9a
- **2026-01-15**: Redesigned home page as kid-focused marketing landing page - Completely overhauled src/app/page.tsx with colorful, engaging design. Features: hero section with gradient background and animated decorative elements (FloatingCard and FloatingStar components with float/twinkle CSS animations), "Made for young collectors" badge, large headline with gradient text, prominent CTAs ("Start Collecting Free" with RocketLaunchIcon, "View My Collection"), social proof indicators (kid-safe, badges, wishlists). Added feature cards section with 3 colorful cards (Track Every Card, Earn Cool Badges, Share Wishlists) with hover effects and decorative circles. Added stats/trust section (500+ sets, 20,000+ cards, 100% free) with purple gradient background. Added final CTA section and simple footer with disclaimer. Added float and twinkle keyframe animations to globals.css. Uses Heroicons (SparklesIcon, StarIcon, HeartIcon, RocketLaunchIcon, etc.). Commit: 507b41a
- **2026-01-15**: Added "How it works" section to home page - Created three-step guide between hero and feature cards sections. Features: Step 1 "Pick Your Sets" with RectangleStackIcon, Step 2 "Tap Cards You Own" with HandRaisedIcon, Step 3 "Earn Badges & Share" with TrophyIcon and ShareIcon. Each step displayed in colorful gradient circle with numbered badge (1, 2, 3). Horizontal connecting line on desktop using gradient. Responsive grid layout (stacked on mobile, 3 columns on desktop). Uses kid-friendly color gradients (kid-primary, purple, kid-secondary, pink). Commit: 8b085c8
- **2026-01-16**: Added feature highlights section - Created comprehensive feature highlights section on home page showcasing three key features: (1) Achievement System with badge previews (Set Master, Card Hunter, Speed Collector), progress bar, and bullet points for set completion badges, milestone rewards, and rare card badges; (2) Family Sharing with profile cards showing multiple children's collections, duplicate finder preview ("12 cards to trade between siblings!"), and info on parent dashboard; (3) Wishlist for Gifts with interactive preview showing prioritized wishlist items with star ratings, shareable link CTA button. Each section uses alternating left/right layout on desktop, gradient backgrounds (amber/orange for achievements, indigo/purple for family, rose/pink for wishlist), decorative circles, and appropriate Heroicons (TrophyIcon, UserGroupIcon, GiftIcon, CheckBadgeIcon, BoltIcon, ArrowsRightLeftIcon, LockClosedIcon, CakeIcon, etc.). Commit: 6924737
- **2026-01-16**: Added pricing section - Created two-column pricing comparison between Free vs Family plan on home page. Free plan card ($0/mo): 1 profile, unlimited cards, badges, wishlist with green CheckIcon indicators; grayed XMarkIcon for unavailable features. Family plan card ($4.99/mo): up to 5 profiles, parent dashboard, sibling duplicate finder with pink CheckIcon indicators and "BEST VALUE" ribbon badge. Uses emerald/teal gradient header with CurrencyDollarIcon, kid-secondary gradient for Family plan. Added trust badges (Secure & Private with ShieldCheckIcon, Kid-Safe with HeartIcon, Cancel Anytime with BoltIcon). Rounded-3xl cards with hover effects and decorative circles. Commit: 48f3256
- **2026-01-16**: Added testimonials/social proof section - Created testimonials section on home page between pricing and final CTA. Features: 3 testimonial cards (2 parents, 1 kid) with 5-star ratings using StarIcon, gradient avatar initials, decorative quote marks and icon decorations (TrophyIcon, HeartIcon). Each card has distinct background (white, amber/orange gradient, pink/rose gradient) with hover lift effect. Added social proof stats bar below testimonials showing "10,000+ Happy collectors", "4.9/5 Average rating", "2,500+ Families using" with colored text and dividers. Uses ChatBubbleLeftRightIcon for section badge. Responsive 3-column grid on desktop, stacked on mobile. Commit: 6f8ea01
- **2026-01-16**: Added variant selector UI for cards - Implemented VariantSelector popup component in CardGrid that shows when clicking cards with multiple variants. Only displays variants that exist based on tcgplayer.prices data (normal, holofoil, reverseHolofoil). Each variant row shows label, gradient icon (SparklesIcon for holos), and market price. Plus/minus buttons for adding/removing each variant quantity. Shows total owned count indicator and per-variant quantity. Single-variant cards add directly without popup. Owned cards display variant badges below card info showing abbreviations (N=Normal, H=Holofoil, R=Reverse) with quantities. Uses Heroicons (XMarkIcon, PlusIcon, MinusIcon, SparklesIcon, CheckCircleIcon). Optimized with useMemo for collection map building. Commit: b8d428d
- **2026-01-16**: Created celebration animations for badge unlocks - Built comprehensive CelebrationAnimation component (src/components/ui/CelebrationAnimation.tsx) with confetti particles and badge unlock modal. Features: confetti burst with multi-colored particles in various shapes (circles, squares, stars, triangles) that animate outward with physics simulation; badge unlock display with radiating glow rings, sparkle decorations, and gradient backgrounds for gold/silver/bronze/special badge types; CelebrationProvider context wrapping the app for triggering celebrations anywhere; useCelebration hook providing celebrate() and celebrateQuick() functions; GlowEffect and ShimmerEffect reusable wrapper components. Enhanced ActivityFeed to auto-trigger celebration when new achievements appear. Achievement items in feed now have amber gradient background with animated glow pulse and shimmer overlay. Added shimmer, badge-entrance, and glow-pulse keyframe animations to globals.css. Uses Heroicons (TrophyIcon, StarIcon, SparklesIcon, CheckBadgeIcon). Commit: 740e717
- **2026-01-16**: Built Trophy Case UI - Created comprehensive TrophyCase component (src/components/achievements/TrophyCase.tsx) displaying all achievement categories with earned/locked badge states and progress indicators. Features: 5 badge categories (Collector Milestones, Type Specialists, Pokemon Fans, Set Completion, Streaks); badge cards with glow effects and tier indicators (bronze/silver/gold/platinum) for earned badges, locked state with LockClosedIcon for unearned; category progress bars and earned/total counters; stats header showing total badges earned, completion percentage, and most recent achievement; skeleton loading states. Added /badges page with loading.tsx and error.tsx route files; navigation link in header; "Trophy Case" button on collection page. Uses Heroicons throughout (TrophyIcon, StarIcon, FireIcon, HeartIcon, MapIcon, BoltIcon, LockClosedIcon, SparklesIcon, ShieldCheckIcon, RocketLaunchIcon, CheckBadgeIcon). Commit: 9953203
- **2026-01-16**: Built parent dashboard UI - Created comprehensive ParentDashboard component (src/components/dashboard/ParentDashboard.tsx) for family account management. Features: ChildProfileCard showing collection stats (total cards, unique cards, sets started, estimated value), recent activity feed with timestamps, gradient avatars with initials, link to view full collection. Family overview header displaying total collectors, subscription tier (free/family), and available profile slots. Dashboard page at /parent-dashboard with loading.tsx and error.tsx route files. Added Parent Dashboard link to site header navigation. Uses Heroicons (UserGroupIcon, Square3Stack3DIcon, TrophyIcon, SparklesIcon, ClockIcon, CurrencyDollarIcon, ChartBarIcon, StarIcon, FireIcon, HeartIcon, ArrowRightIcon, ShieldCheckIcon). Commit: 2e98298
- **2026-01-16**: Added card flip animation - Created FlippableCard component (src/components/collection/FlippableCard.tsx) with smooth 3D flip effect. Features: flip button appears on card hover/focus in CardGrid, opens CardFlipModal for full-screen viewing, shows official Pokemon card back design when flipped, smooth 500ms CSS transform animation with perspective, keyboard support (F key to flip), proper ARIA labels and focus management. Integrated into CardGrid with ArrowPathIcon flip button. Commit: 2285a68
- **2026-01-16**: Replaced all unicode characters and inline SVGs with Heroicons - Replaced unicode left arrows (←) with ArrowLeftIcon in all back navigation links across 7 pages (collection, search, compare, browse, badges, sets detail). Replaced unicode right arrows (→) with ArrowRightIcon in CTAs and "View Set" links. Replaced inline SVG checkmarks with CheckIcon in CardGrid, SearchResults, and IconLegend. Replaced inline SVG X marks with XMarkIcon in FilterChips and search input. Replaced inline SVG magnifying glass with MagnifyingGlassIcon. Replaced inline SVG plus/minus with PlusIcon/MinusIcon in quantity controls. All icons now use consistent Heroicons library for professional, accessible UI. Commit: fd6a67a
- **2026-01-16**: Added pricing toggle UI to parent dashboard - Enhanced ParentDashboard component (src/components/dashboard/ParentDashboard.tsx) with toggle to show/hide TCGPlayer prices. Features: PricingVisibilityContext to propagate toggle state to all ChildProfileCards; PricingToggle button component with EyeIcon/EyeSlashIcon and amber/gray styling based on state; toggle control card showing descriptive text for current visibility state; collection value display in ChildProfileCard shows "---" / "Hidden" when prices are hidden. Parents can now control visibility of estimated card values across the dashboard. Uses Heroicons (EyeIcon, EyeSlashIcon, CurrencyDollarIcon). Accessible aria-labels and tooltips on toggle button. Commit: 8a090c1
- **2026-01-16**: Completed accessibility audit and WCAG 2.1 AA fixes - Comprehensive accessibility improvements across all UI components. Added visible focus-visible ring styles for keyboard navigation in globals.css. Added skip link allowing screen readers to jump to main content. Added prefers-reduced-motion media query to disable animations for users who prefer reduced motion. Added proper aria-labels to all interactive elements including card buttons, wishlist/priority toggles, quantity controls, filter buttons. Added aria-pressed, aria-expanded, aria-controls attributes to toggle buttons and menus. Added role attributes for navigation ("banner", "menu", "menubar"), dialogs ("dialog"), and interactive regions ("search", "group", "list"). Added aria-live regions for dynamic content (quantity changes, filter chips). Improved color contrast by upgrading gray-400 to gray-500 for better WCAG compliance. Added keyboard support (Enter/Space) to card click interactions. Added aria-hidden to decorative icons and elements (floating cards, stars). Added proper form labeling with htmlFor/id pairs for inputs. Updated 10 files: globals.css, layout.tsx, page.tsx, Header.tsx, CardGrid.tsx, SearchResults.tsx, FilterPanel.tsx, FilterChips.tsx, TrophyCase.tsx, SetsList.tsx. Commit: 4aa8b81
- **2026-01-16**: Created export/print checklist PDF button and preview - Built ExportChecklistButton component (src/components/collection/ExportChecklist.tsx) with modal preview and print functionality. Features: Export Checklist button on collection page header using DocumentArrowDownIcon; modal dialog with print preview showing collection grouped by set; toggle options for showing quantities and checkboxes; proper print CSS @media rules in globals.css for clean PDF output with page breaks and margins; fetches card data when modal opens for standalone operation; loading states with skeleton screens; error handling with retry functionality; accessible with ARIA labels, role="dialog", and Escape key to close; Print/Save PDF button uses browser's native print dialog for PDF generation. Uses Heroicons throughout (DocumentArrowDownIcon, PrinterIcon, XMarkIcon, CheckIcon, Square3Stack3DIcon, ArrowPathIcon, ExclamationTriangleIcon, DocumentTextIcon). Commit: 12f2f25
- **2026-01-16**: Completed Collection stats over time - Created CollectionStatsGraph component (src/components/collection/CollectionStatsGraph.tsx) with interactive bar charts showing collection growth. Features: summary stats showing total cards, estimated value, avg cards per month, and month-over-month growth rate; three switchable view modes (Cards Added per month, Total Growth cumulative, Value Over Time cumulative); interactive bar chart with hover tooltips showing exact values; responsive design; skeleton loading state; empty state messaging. Shows last 12 months when data exceeds that. Added to timeline page above the main timeline. Uses Heroicons (ChartBarIcon, ArrowTrendingUpIcon, CurrencyDollarIcon, CalendarIcon). Commit: e9e0060
- **2026-01-16**: Added shared wishlist viewer for parents - Created SharedWishlistViewer component (src/components/family/SharedWishlistViewer.tsx) for viewing all children's wishlists in one place for gift planning. Features: summary stats (total items, priority items, profiles with wishlists), expandable sections per child profile with avatar and item counts, priority items highlighted with amber border and star badge, card images with prices from cached data, search filter by child name, responsive grid layout (2-5 columns), skeleton loading states, empty state messaging. Integrated into ParentDashboard below TradeSuggestionEngine. Uses Heroicons (GiftIcon, HeartIcon, StarIcon, UserCircleIcon, CurrencyDollarIcon, SparklesIcon, ShoppingBagIcon, MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon). Commit: 71d2710
- **2026-01-16**: Added random card button feature - Created RandomCardButton component (src/components/collection/RandomCardButton.tsx) that shows a random card from the user's collection. Features: purple/pink gradient button with SparklesIcon in CollectionView; modal with shuffle animation using animated card stack with spinning cards; card reveal with glow effect and sparkle decorations around the card; displays card name, set, number, and rarity badge; "Shuffle Again" button with ArrowPathIcon for endless browsing fun. Full accessibility support with ARIA labels, keyboard navigation (Escape to close), and focus-visible states. Uses Heroicons (SparklesIcon, ArrowPathIcon, XMarkIcon, Square3Stack3DIcon). Integrated into CollectionView component above the value banner. Commit: 201a243
- **2026-01-16**: Added responsive design for mobile-first experience - Comprehensive responsive improvements across 9 UI files. Header: reduced logo/text sizing on mobile (h-8/text-lg → h-10/text-xl at sm:). Collection page: 3-column stats grid on all screens with responsive padding (p-3 → p-6 at sm:), smaller text sizes (text-2xl → text-4xl at sm:). CardGrid: stats bar uses mobile grid layout that converts to flex at sm:, hidden dividers on mobile, responsive text sizing. FilterPanel: reduced padding/spacing on mobile. Browse page: responsive headings and layout gaps. SearchResults: smaller gaps (gap-2 → gap-4 at sm:) in card grid. SetsList: responsive card padding, logo sizing, and grid gaps. ParentDashboard: mobile-optimized family overview with 3-col grid, responsive profile cards with smaller avatars/text/padding on mobile, pricing toggle stacks vertically on mobile. Home page: responsive hero padding, smaller headings (text-3xl → text-5xl → text-6xl → text-7xl), smaller step circles (h-24 → h-32), and compact feature cards. All changes follow mobile-first pattern using sm: breakpoint. Commit: af7937e
- **2026-01-16**: Added My Wishlist page - Created dedicated /my-wishlist page (src/app/my-wishlist/page.tsx) for managing wishlisted cards. Features: view all wishlisted cards with images fetched from Pokemon TCG API; manage priority (most wanted) items with star toggle buttons; remove cards from wishlist with trash button; generate shareable link (30-day expiry) with copy button and visual feedback; stats showing total wanted cards, priority count (with max limit), and remaining stars. Includes rose/pink gradient theme, skeleton loading states, error handling with error.tsx route file. Added My Wishlist link to Header navigation and collection page header. Also completed "Copy wishlist share link button" task as part of this implementation since share link generation with copy functionality is built into the page. Uses Heroicons (HeartIcon, StarIcon, LinkIcon, CheckIcon, TrashIcon, GiftIcon, ArrowLeftIcon, ShareIcon, SparklesIcon). Commit: c2b90e2
- **2026-01-16**: Added sleep mode scheduling - Created SleepModeProvider (src/components/providers/SleepModeProvider.tsx) for parent-controlled quiet hours. Features: configurable bedtime and wake time (defaults 8 PM - 7 AM); calming overlay screen with moon/stars theme and "Time for Bed!" message (src/components/family/SleepModeOverlay.tsx); optional parent PIN to temporarily unlock during sleep hours; schedule persisted to localStorage; automatic time checking every minute. Added SleepModeSettings component (src/components/settings/SleepModeSettings.tsx) with schedule picker, PIN setup/removal, and enable toggle. Integrated into Settings page under new "Family Controls" section. Uses Heroicons (MoonIcon, SunIcon, LockClosedIcon, ClockIcon, TrashIcon). Commit: 3502ac0
- **2026-01-16**: Completed family leaderboard - Created FamilyLeaderboard component (src/components/family/FamilyLeaderboard.tsx) for friendly weekly competition between family members. Features: full and compact variants for ParentDashboard and KidDashboard; ranked list showing cards collected this week per family member; gold/silver/bronze rank badges for top 3 positions with TrophyIcon; handles rank ties; leader highlight with FireIcon and special styling; total cards this week counter; empty state messaging when no weekly activity; encouragement message about weekly Monday reset; collapsible panel in full variant. Uses Heroicons (TrophyIcon, ChartBarIcon, FireIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon, CalendarIcon). Requires 2+ family members to display. Commit: 11fd021
- **2026-01-16**: Added pinch-to-zoom card viewer - Created ZoomableCardModal component (src/components/collection/FlippableCard.tsx) with full zoom and pan functionality. Features: pinch-to-zoom on touch devices (1x-4x scale) using touch event handlers; mouse wheel zoom for desktop; drag-to-pan when zoomed in with grab/grabbing cursor feedback; on-screen zoom controls with MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, ArrowsPointingOutIcon for zoom in/out/reset; keyboard shortcuts (+/- for zoom, 0 for reset, Escape to close); card flip retained when at 1x zoom; percentage zoom indicator; dynamic instruction text that changes based on zoom state; smooth CSS transitions for scale and position. Uses Heroicons for controls. Commit: dc99c09
- **2026-01-16**: Added export/print wishlist PDF button - Created ExportWishlistButton component (src/components/wishlist/ExportWishlist.tsx) for exporting wishlist as printable PDF. Features: Export PDF button on My Wishlist page header using DocumentArrowDownIcon; modal dialog with print preview showing wishlist grouped by set; toggle options for showing most wanted items first and displaying star indicators for priority items; cards listed with name, number, and priority stars; proper print CSS support using existing globals.css print styles; rose/pink gradient theme matching wishlist styling; loading states with skeleton screens; error handling with retry functionality; accessible with ARIA labels, role="dialog", and Escape key to close; Print/Save PDF button uses browser's native print dialog for PDF generation. Uses Heroicons (DocumentArrowDownIcon, PrinterIcon, XMarkIcon, HeartIcon, StarIcon, GiftIcon, ArrowPathIcon, ExclamationTriangleIcon). Commit: 8d2d818
- **2026-01-16**: Added pack opening haptics and sounds - Created PackEffectsProvider (src/components/providers/PackEffectsProvider.tsx) and packEffects library (src/lib/packEffects.ts) for managing sound and haptic feedback during virtual pack opening. Features: toggle buttons in pack opening header for sound (SpeakerWaveIcon/SpeakerXMarkIcon) and haptics (DevicePhoneMobileIcon); synthesized audio effects using Web Audio API for pack tear, card whoosh, sparkle (rare), ultra sparkle (ultra rare), and completion fanfare; vibration patterns via Vibration API for light/medium/heavy/success feedback; settings persist to localStorage; respects low-stimulation mode when sounds disabled globally. Commit: 0aeba26
- **2026-01-16**: Added rarity filter UI to set detail page - Created RarityFilter component (src/components/filter/RarityFilter.tsx) for filtering cards by rarity category. Features: 6 rarity categories (Common, Uncommon, Rare, Ultra Rare, Secret Rare, Promo) with color-coded gradient buttons and icons (StarIcon, SparklesIcon, FireIcon, BoltIcon); card count badges showing number of cards per rarity in current set; disabled state for empty categories; clear filter button; filter indicator showing current selection and filtered card count. Created SetDetailClient wrapper component to manage filter state on the set detail page. Accessible with proper ARIA labels, aria-pressed states, and keyboard support. Commit: 3f390a6
- **2026-01-16**: Added "New in collection" badge with sparkle/shimmer effect - Cards added within the last 7 days now display a "NEW" badge with animated sparkle effects. Features: animated cyan/teal "NEW" badge with SparkleStarIcon SVG icons showing sparkle animation; pulsing glow effect (animate-new-card-glow) around newly added card containers; shimmer overlay that sweeps across the card image; uses existing getNewlyAddedCards Convex query to identify cards added in last 7 days via activity logs. Added new CSS animations in globals.css: sparkle, new-card-shimmer, sparkle-rotate, new-card-glow, and new-badge-shimmer gradient background. Updated CardGrid component (src/components/collection/CardGrid.tsx) to query newly added cards and display visual indicators. All animations respect prefers-reduced-motion for accessibility. Updated aria-label to include "newly added" state for screen readers. Commit: 98974fe
- **2026-01-16**: Added "Just Pulled" mode for rapid pack opening card entry - Created JustPulledMode component (src/components/collection/JustPulledMode.tsx) providing immersive full-screen overlay for quick card adding during pack openings. Features: dark gradient theme (slate/purple) for immersive experience; single-tap adds cards instantly without variant selector popup (uses smart default variant based on tcgplayer prices); animated card pop effect when adding cards (animate-just-pulled-pop keyframe); session stats showing total pulled and unique card counts; BoltIcon indicators on cards showing how many added this session; tip banner explaining tap-to-add functionality (auto-dismisses after 5 seconds); reset button to clear session counter; escape key or X button to exit mode; larger card grid (3-8 columns responsive) for easy tapping. Added BoltIcon "Just Pulled" button to SetDetailClient with helpful tooltip text. Accessibility: ARIA labels, focus-visible states, prefers-reduced-motion support. Uses Heroicons (BoltIcon, SparklesIcon, CheckIcon, XMarkIcon, ArrowPathIcon, InformationCircleIcon). Commit: 1eec567
- **2026-01-16**: Added visible daily streak counter to header/nav - Created StreakCounter component (src/components/gamification/StreakCounter.tsx) displaying user's daily activity streak prominently in navigation. Features: FireIcon with animated flame effect for active streaks; tiered color gradients based on streak length (1-2 orange, 3-6 orange-red, 7-13 red-pink, 14-29 pink-purple, 30+ purple-indigo); "Start streak" prompt for users without active streak; green dot indicator for activity today; SparklesIcon decorations for hot streaks (7+ days); animated glow effect for 14+ day streaks; tooltip showing next badge progress on hover; full variant available for larger displays with detailed badge progress; skeleton loading state during data fetch; accessible with ARIA labels and role="status". Added CSS animations in globals.css: streak-flame (subtle fire wiggle) and streak-glow (pulsing glow), both respect prefers-reduced-motion. Integrated into Header component for desktop (next to auth buttons with divider) and mobile menu (centered above auth section). Uses Heroicons (FireIcon, BoltIcon, SparklesIcon). Commit: c3eede7
- **2026-01-16**: Added Level-up system UI with XP bar and notifications - Created comprehensive LevelSystem component (src/components/gamification/LevelSystem.tsx) with multiple features: LevelDisplay component showing current level and XP progress bar in header (compact variant) with hover tooltip showing title and XP to next level; full variant for profile pages with gradient background, level badge, and total XP display. LevelUpProvider context wrapping app for global XP tracking and notifications. XPGainNotification component with animated toast showing "+2 XP" when adding new unique cards. LevelUpCelebration modal with animated background rings, sparkle decorations, and level badge when user levels up. 10 collector levels from "Beginner Collector" (Lv.1) to "Legendary Master" (Lv.10) with XP thresholds (0, 10, 25, 50, 100, 175, 275, 400, 575, 800). Level tier colors: gray (1-2), green (3-4), blue (5-6), purple (7-8), gold (9-10). XP calculated from unique cards collected (2 XP per unique card). Integrated XP notifications into CardGrid when adding new unique cards. Uses Heroicons (SparklesIcon, BoltIcon, TrophyIcon, ChevronUpIcon). Accessible with ARIA labels, role attributes, and aria-live regions. Commit: e605fab
- **2026-01-16**: Added Collection milestones celebrations with big celebration modals - Created MilestoneCelebration component (src/components/gamification/MilestoneCelebration.tsx) providing automatic celebration animations when users reach card collection milestones. Features: 7 milestone thresholds (1, 10, 50, 100, 250, 500, 1000 unique cards) with increasing confetti particle counts; MilestoneCelebrationModal with dramatic celebration UI including animated background rings, sparkle decorations, milestone-specific icons (StarIcon, SparklesIcon, BoltIcon, TrophyIcon, FireIcon, RocketLaunchIcon), gradient backgrounds matching milestone tier, glowing box shadows, "Milestone Reached!" badge, card count display; MilestoneConfetti component with physics-based particle animation using gravity and friction; MilestoneProvider context that automatically watches card count changes and triggers celebrations when crossing thresholds; MilestoneProgress component for displaying progress to next milestone with progress bar; useMilestoneCelebration hook for manual milestone checks. Each milestone has unique title, subtitle, and visual style (First Catch emerald, Starter Collector blue, Rising Trainer purple, Pokemon Trainer amber, Elite Collector orange-red, Pokemon Master gold, Legendary Collector pink-purple). Integrated into root layout.tsx via MilestoneProvider. Accessible with ARIA labels, role="dialog", aria-modal. All animations respect prefers-reduced-motion. Uses Heroicons throughout.
- **2026-01-16**: Added Kid mode / age toggle for simplified interface - Created KidModeProvider context (src/components/providers/KidModeProvider.tsx) managing age-based UI customization with three modes: Young Collector (ages 6-8), Explorer (ages 9-11), and Advanced (ages 12-14). Features: KidModeToggle dropdown component (src/components/layout/KidModeToggle.tsx) in Header with compact and full variants; age group icons (SparklesIcon, RocketLaunchIcon, AcademicCapIcon); color-coded badges (pink for young, indigo for explorer, emerald for full); feature flags controlling showPricing, showRarityDetails, simplifiedLayout, largerTouchTargets, showAdvancedStats, showVariantSelector, showActivityFeed, animatedCelebrations, showExportOptions, reducedTextContent; Young mode features larger touch targets, no pricing display, no variant selector (tap-to-toggle cards), simplified 2-4 column grid, larger text; localStorage persistence for user preference; CardGrid integration showing different behavior based on selected mode; useKidMode hook for accessing features throughout app. Accessible with ARIA labels, aria-expanded, aria-haspopup, role="listbox" for dropdown. Added 44 unit tests (src/lib/**tests**/kidMode.test.ts) covering feature flags, age group info, localStorage integration, and accessibility considerations. Uses Heroicons (SparklesIcon, RocketLaunchIcon, AcademicCapIcon, ChevronDownIcon, CheckIcon, Cog6ToothIcon). Commit: 87306df
- **2026-01-16**: Added promo cards display with distinctive badge - Created promo card detection and display system for Black Star Promos and other promotional cards. Features: isPromoCard() helper function detecting promo cards by rarity field ("Promo") or set ID (svp, swshp, smp, xyp, bwp, dpp, np, basep, hsp); getPromoSetLabel() function returning user-friendly labels like "SV Promo", "SWSH Promo", "SM Promo"; PROMO_SET_IDS constant array with all 9 known promo set identifiers; CardGrid now displays rose/pink gradient "Promo" badge with BoltIcon next to card number for promotional cards; badge tooltip shows specific promo set era (e.g., "SV Promo" for Scarlet & Violet promos); handles varying promo number formats (simple numbers for svp, "SWSH001" format for swshp, "SM01" for smp). Added 27 unit tests covering promo detection, set label generation, case-insensitivity, and edge cases. Uses Heroicons (BoltIcon). Note: Task was originally named "Japanese promo cards display" but the Pokemon TCG API used is English-focused and doesn't include actual Japanese cards - implemented promo card detection which covers promotional releases from all regions. Commit: e7e5b04
- **2026-01-16**: Added unlockable avatar items UI for profile customization - Created comprehensive avatar customization system (src/lib/avatarItems.ts) with 28 unlockable items: 8 hats (Starter Cap, Collector Cap, Trainer Hat, Flame Crown, Thunder Crown, Elite Helm, Master Crown, Legendary Crown), 9 frames (Basic, Grass, Water, Psychic, Dragon, Bronze/Silver/Gold/Platinum Streak frames), 11 badges (Newbie, Pikachu/Eevee/Charizard/Mewtwo/Legendary Fan, Set Explorer/Master/Champion, Sun/Moon Collector). Features: 5 rarity tiers (common, uncommon, rare, epic, legendary) with distinct gradients and colors; AvatarCustomizer component (src/components/profile/AvatarCustomizer.tsx) with tabbed category selection (Hats/Frames/Badges), item grid with unlock progress bars, equip/unequip on click; AvatarPreview component showing equipped items on avatar (hat on top, frame as border, badge on bottom-right); /profile page for avatar management with loading/error states; items unlock via achievements, milestones (card counts), or streak days; localStorage persistence per profile; unlock requirement display with friendly descriptions; full accessibility (ARIA labels, keyboard navigation, aria-pressed states). Added Profile link to header navigation. 44 unit tests covering all utility functions. Uses Heroicons (StarIcon, TrophyIcon, FireIcon, BoltIcon, SparklesIcon, HeartIcon, ShieldCheckIcon, RocketLaunchIcon, GlobeAltIcon, SunIcon, MoonIcon, CloudIcon, LockClosedIcon, CheckIcon, XMarkIcon, InformationCircleIcon). Commit: 70f3257
- **2026-01-16**: Added rarity explainer tooltips for educational card rarity info - Created comprehensive rarity explanation system to help young collectors understand card rarities. Core library (src/lib/rarityExplainer.ts) with RARITY_EXPLAINERS constant providing kid-friendly descriptions, pull rates ("Found in almost every pack" to "Very rare - about 1 in 20+ packs"), examples, and collector tips for all 6 rarity tiers (Common, Uncommon, Rare, Ultra Rare, Secret Rare, Promo). Helper functions getRarityInfo() and getRarityInfoByName() for looking up info by ID or API string. Created RarityTooltip component (src/components/ui/RarityTooltip.tsx) with hover/tap support for desktop/mobile, themed gradients per rarity, positioned tooltips with arrows, and RarityBadge standalone component with built-in tooltips. Enhanced RarityFilter component with "What do these mean?" help button that expands a guide panel showing all rarity categories with descriptions and pull rates. Individual filter buttons show tooltips on hover with rarity description and pull rate info. Updated RandomCardButton modal to use RarityBadge with educational tooltips when displaying card rarity. 24 unit tests covering rarity info retrieval, API string matching, structure validation. Uses Heroicons (InformationCircleIcon, StarIcon, SparklesIcon, LightBulbIcon, QuestionMarkCircleIcon, XMarkIcon). Commit: 22f8774
- **2026-01-16**: Added "Learn to Collect" interactive tutorials - Created comprehensive tutorial system (src/lib/tutorialContent.ts) with 7 kid-friendly guides across 4 categories: Getting Started (first-collection), Card Organization (organizing-by-set, organizing-by-type), Binder & Storage (binder-setup-basics), and Card Care (card-handling, card-storage, card-condition). Each guide has multiple steps with titles, descriptions, summaries, and tips. LearnToCollect component (src/components/tutorials/LearnToCollect.tsx) features: category-organized guide cards with difficulty badges (Beginner/Intermediate) and estimated times; GuideViewer for step-by-step interactive walkthrough with progress bar and step indicators; localStorage progress tracking for completed guides; animated celebration overlay when completing guides; keyboard navigation (arrow keys, Enter, Escape); overall progress bar showing completion across all tutorials; "Did You Know?" fun facts section. Added /learn page with loading and error states. Added "Learn" link to Header navigation. 35 unit tests covering tutorial content library functions, data structure validation, and content quality checks. Uses Heroicons (BookOpenIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, LightBulbIcon, RocketLaunchIcon, RectangleStackIcon, ArchiveBoxIcon, ShieldCheckIcon, SparklesIcon, StarIcon, XMarkIcon, CheckIcon, ArrowLeftIcon, ArrowRightIcon). Commit: f2a2001
- **2026-01-16**: Added set structure intro onboarding flow - Created comprehensive educational content about Pokemon TCG sets (src/lib/setStructureContent.ts) with 6-step onboarding flow covering: what a set is, finding set symbols, understanding card numbers, types of sets (main expansion, mini set, special set, promo), what a "master set" means, and collection tracking. SetStructureIntro component (src/components/onboarding/SetStructureIntro.tsx) provides both modal and inline versions with step-by-step progress tracking, animated celebrations on completion, and bonus sections explaining 4 set types and 5 collection goals with difficulty ratings (easy to expert). SetStructureButton component integrated into /sets page header with "New" badge for first-time users. Features: localStorage-based completion tracking, keyboard navigation (arrow keys, Enter, Escape), full ARIA accessibility, gradient styling per step. Includes 48 unit tests covering content library functions, data structure validation, and content quality. Uses Heroicons (BookOpenIcon, TrophyIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon, CheckCircleIcon, LightBulbIcon, ArrowRightIcon, MagnifyingGlassIcon, HashtagIcon, Squares2X2Icon, ChartBarIcon, CubeIcon, Square3Stack3DIcon, StarIcon, HeartIcon, FireIcon). Commit: 458e5ab
- **2026-01-16**: Added card condition basics guide - Created comprehensive kid-friendly card condition guide (src/components/guide/ConditionGuide.tsx) explaining NM/LP/MP/HP/DMG differences with visual representations. Features: ConditionCard components showing each condition with Heroicon indicators (SparklesIcon for NM, HandThumbUpIcon for LP, CheckCircleIcon for MP, ExclamationTriangleIcon for HP, XCircleIcon for DMG), color-coded gradients (emerald/blue/amber/orange/red), value percentage display (~100%/80%/50%/25%/10% of NM value), trade acceptability badges, detailed view with "What to Look For" checklist, damage examples, fun facts, and card care tips; VisualComparisonSection with table comparing corners/edges, surface condition, value, and trade status at a glance; ConditionGuideModal version for inline use; ConditionGuideButton component for triggering guide. Added /condition-guide page with loading.tsx and error.tsx route files. Integrated into /learn page with featured guide banner. Uses extensive content library (src/lib/conditionGuide.ts) with 122 existing tests covering condition info retrieval, comparison functions, grading guidance, statistics, and educational content. Uses Heroicons throughout (SparklesIcon, HandThumbUpIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, BookOpenIcon, MagnifyingGlassIcon, EyeIcon, CurrencyDollarIcon, ArrowsRightLeftIcon, StarIcon, ShieldCheckIcon, LightBulbIcon, ChevronLeftIcon, XMarkIcon, ArrowRightIcon). Commit: c2e63f3
- **2026-01-16**: Rebranded from KidCollect to CardDex - Updated all user-facing references from "KidCollect" to "CardDex" across the entire UI. Changes include: Header component logo text and aria-label; root layout page title metadata; sets pages metadata titles; wishlist pages (invalid link CTA and footer link); export checklist PDF footer attribution (including domain change to pokemon.carddex.app); landing page feature descriptions, testimonials section, and footer disclaimer. All 1661 tests pass. Commit: 13fe21f
- **2026-01-16**: Updated landing page with new tagline "All your cards. One app." - Added prominent tagline between the main heading and subheading in the hero section. Uses bold text with responsive sizing (text-xl on mobile, text-2xl on sm, text-3xl on md) in gray-800 color to stand out while maintaining visual hierarchy. All 1706 tests pass. Commit: 9fadc1b
- **2026-01-16**: Added example cards and images to tutorials - Created comprehensive tutorial card examples system to illustrate educational concepts with real Pokemon cards. New tutorialExamples.ts library with curated card examples for 9 concept categories: Rarity Examples (Common/Uncommon/Rare/Ultra Rare/Secret Rare), Holo vs Non-Holo comparison, Set Symbols, Card Numbers, Secret Rares, Ultra Rare types (ex/V/VMAX), Pokemon Types (Grass/Fire/Water/Lightning/Psychic/Fighting), Evolution Chains (Basic → Stage 1 → Stage 2), and Trainer Card types (Item/Supporter/Stadium). TutorialExampleCards component (src/components/tutorials/TutorialExampleCards.tsx) features: carousel and grid display variants; card images fetched from Pokemon TCG API via /api/cards; educational notes explaining what to look for; expandable card details with highlight tips; loading skeletons and error states with retry functionality; keyboard navigation in carousel mode; accessible with ARIA labels. Integrated step-specific examples into GuideViewer showing relevant cards during tutorial walkthroughs (e.g., set symbol examples when learning about organizing by set). Added "Cards" badge indicator on guide cards showing which tutorials have visual examples. 89 unit tests covering example set structure, card ID validity, lookup functions, and content quality. Uses Heroicons (PhotoIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon, InformationCircleIcon, ArrowPathIcon, ExclamationTriangleIcon). All 1905 tests pass. Commit: e39a136
- **2026-01-17**: Updated /login page copy - Changed "Track your Pokemon card collection" to "Track your trading card collection" to reflect multi-TCG support. Commit: c64b2e3
- **2026-01-16**: Created MarketingHeader component for landing page - Added MarketingHeader component (src/components/layout/MarketingHeader.tsx) for simplified landing page navigation. Features: Logo linking to home page; Features and Pricing anchor links with smooth scrolling to landing page sections; Login and Sign Up auth buttons; responsive mobile menu with hamburger toggle; excludes app navigation (Browse Sets, My Collection, etc.) per architecture requirements. Added id="features" and id="pricing" to landing page sections for anchor navigation. Full accessibility support with ARIA labels, roles, aria-expanded, aria-controls, and keyboard navigation. 30 unit tests covering logo/branding, marketing navigation links, auth buttons, mobile menu functionality, accessibility compliance, smooth scrolling behavior, and styling attributes. Uses Heroicons (ArrowRightOnRectangleIcon, UserPlusIcon, Bars3Icon, XMarkIcon). All 1935 tests pass. Commit: fcc976f
- **2026-01-16**: Created AppHeader component for logged-in users - Added AppHeader component (src/components/layout/AppHeader.tsx) for authenticated user navigation. Features: Logo linking to home page; app navigation links with icons (My Collection, Browse Sets, Badges, Wishlist, Search); gamification elements (LevelDisplay, StreakCounter, KidModeToggle); profile dropdown menu with My Profile, Learn to Collect links and Sign Out button; responsive mobile menu with hamburger toggle. Navigation links highlight current page with aria-current and visual styling. Full accessibility support with ARIA labels, roles, aria-expanded, aria-haspopup, aria-controls, and keyboard navigation. Does NOT include Login/Signup buttons (use MarketingHeader for unauthenticated users). 47 unit tests covering logo/branding, app navigation links, gamification elements, profile menu functionality, mobile menu, accessibility compliance, and styling attributes. Uses Heroicons (Square3Stack3DIcon, TrophyIcon, HeartIcon, MagnifyingGlassIcon, UserCircleIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon). All 1982 tests pass. Commit: f9b2d01
- **2026-01-16**: Added auth-aware header switching - Created AuthAwareHeader component (src/components/layout/AuthAwareHeader.tsx) that automatically shows the appropriate header based on user authentication state. Shows MarketingHeader (Features, Pricing, Login, Sign Up) when user is not logged in, AppHeader (My Collection, Browse Sets, Badges, Wishlist, Search, Profile) when user is logged in, and HeaderSkeleton with animated placeholders while auth state is loading to prevent layout shift. Updated root layout.tsx to use AuthAwareHeader instead of the generic Header component. 28 unit tests covering loading state skeleton rendering, unauthenticated state with marketing navigation, and authenticated state with app navigation. Uses useConvexAuth() hook from convex/react for auth state detection. All layout tests pass (105 tests across AuthAwareHeader, MarketingHeader, and AppHeader). Commit: 1c296b9
- **2026-01-16**: Completed Kid Dashboard page (/dashboard) - Post-login home showing collection stats, recent activity, badge progress, streak counter, and quick actions. Created KidDashboard component (src/components/dashboard/KidDashboard.tsx) with: personalized greeting based on time of day and profile name; stats grid showing total cards, unique cards, sets started, and day streak; quick action cards linking to sets, collection, wishlist, and search; badge progress preview showing 4 most recent earned badges with progress count; level display and milestone progress indicators; activity feed sidebar with recent collection activity; learning section with link to tutorials. Dashboard page (src/app/dashboard/page.tsx) includes: auth handling showing sign-in prompt for unauthenticated users; streak encouragement messages based on streak length; loading.tsx with matching skeleton layout; error.tsx with retry functionality. 31 unit tests covering skeleton structure, layout components, greeting logic, streak messaging, badge sorting, and quick action configuration. Uses Heroicons (Square3Stack3DIcon, TrophyIcon, HeartIcon, RocketLaunchIcon, SparklesIcon, ArrowRightIcon, MagnifyingGlassIcon, PlusIcon, BookOpenIcon, FireIcon, StarIcon, BoltIcon). All 2367 tests pass. Commit: 7b19a3e
- **2026-01-16**: Added Digital Binder view - Created DigitalBinder component (src/components/virtual/DigitalBinder.tsx) with page-turn animations and customizable binder cover themes. Features: 12 binder themes including Pokemon types (Fire, Water, Grass, Electric, Psychic, Dragon) and starter themes (Charmander, Squirtle, Bulbasaur, Pikachu, Eevee, Classic); 3D page-turn animations with CSS transforms; two-page spread view showing 9 cards per page (3x3 grid); binder spine with decorative rings; theme selector panel with color-coded preview buttons; keyboard navigation (arrow keys to flip pages, ESC to close); quantity badges on cards; empty card slots for incomplete pages; DigitalBinderButton integrated into CollectionView with amber/orange/red gradient styling. Added page-turn CSS animations in globals.css with reduced motion support. Accessible with ARIA labels, role="dialog", aria-modal, aria-pressed, keyboard handlers. Uses Heroicons (BookOpenIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon, SparklesIcon, SwatchIcon, ArrowLeftIcon, ArrowRightIcon, FireIcon, BoltIcon). Commit: bd5486a
- **2026-01-16**: Removed app nav links from landing page - All CTA buttons now route to /signup or /login instead of directly to app pages (/sets, /collection). Hero primary button "Start Collecting Free" → /signup; Hero secondary button renamed from "View My Collection" to "Log In" → /login; "Start Your Wishlist" → /signup; Free plan "Get Started Free" → /signup; Family plan "Start Family Plan" → /signup; Final CTA "Get Started Now" → /signup. This ensures unauthenticated visitors go through auth flow before accessing app features. Added 18 unit tests for landing page CTAs and structure (src/app/**tests**/LandingPage.test.tsx). All 2385 tests pass. Commit: 5a87862
- **2026-01-16**: Added Parent Dashboard access control - Parent Dashboard link now only appears for parent accounts, not child profiles. Updated AppHeader component (src/components/layout/AppHeader.tsx) to: fetch current user's profile using useQuery(api.profiles.getCurrentUserProfile); use hasParentAccess() utility from src/lib/profiles.ts to check if user is a parent; conditionally render Parent Dashboard link in both desktop profile dropdown menu and mobile navigation menu; uses UserGroupIcon from Heroicons. Updated AuthAwareHeader test to include useQuery mock. Added 10 new unit tests covering parent/child/null profile visibility scenarios (shows link for parents, hides for children, hides when profile not loaded). All 2497 tests pass. Commit: 6c33dfe
- **2026-01-16**: Added trust signals section to landing page - Created prominent trust signals section between testimonials and final CTA featuring three trust cards: (1) COPPA Compliant badge with ShieldExclamationIcon, blue/indigo gradient, and "Verified compliant" indicator; (2) "No Ads Ever" shield with NoSymbolIcon, rose/pink gradient, and "Ad-free forever" indicator; (3) Cloud Backup badge with CloudIcon, emerald/teal gradient, and "Auto-saved" indicator. Each card has large icon in gradient circle, kid-friendly description, and hover lift effect. Added additional trust indicators row showing "Encrypted data" (LockClosedIcon), "Secure login" (ShieldCheckIcon), and "Family-first design" (HeartIcon). Decorative elements use aria-hidden for accessibility. Added 8 unit tests covering section header, individual trust cards, trust indicators, hover styling, gradient backgrounds, and accessibility compliance. All 2505 tests pass. Commit: b362765
- **2026-01-17**: Updated CardGrid to use CardImage component - Replaced raw Next.js Image component with CardImage component (src/components/ui/CardImage.tsx) in CardGrid (src/components/collection/CardGrid.tsx). This provides automatic fallback to placeholder SVG when external card images fail to load, loading skeleton while images load, and consistent error handling across the card grid. Prevents broken image icons from appearing in the collection view. All tests pass (5440 tests), ESLint and Prettier clean. Commit: 90b9a94
- **2026-01-16**: Added onboarding game selector for multi-TCG support - Created "What do you collect?" onboarding screen (src/components/onboarding/GameSelectorOnboarding.tsx) with both modal and inline variants. Features: 7 supported TCG games (Pokémon, Yu-Gi-Oh!, One Piece, Dragon Ball, Lorcana, Digimon, MTG); custom SVG icons for each TCG in src/components/icons/tcg/ (stylized Pokeball, Millennium Eye, Straw Hat, Dragon Ball, Magic Ink Drop, Digivice, Planeswalker Symbol); GameSelectorProvider context (src/components/providers/GameSelectorProvider.tsx) for managing selected games state; game content library (src/lib/gameSelector.ts) with metadata, color theming, gradients, taglines, and appeal points; primary game designation with star indicator; localStorage persistence via saveSelectedGames/loadSelectedGames; celebration animation on completion showing selected game count; keyboard navigation (Enter to continue, Escape to close); ARIA labels and accessibility compliance; skeleton loading component. Each game card shows icon, name, tagline, and "Set as main" button when selected. 46 unit tests covering game lookup functions, localStorage persistence/validation, display formatting helpers, and data structure validation. All 2748 tests pass. Commit: 8efcc79
- **2026-01-16**: Added settings game toggle to profile page - Created GameSettingsToggle component (src/components/settings/GameSettingsToggle.tsx) allowing users to change their selected TCG games anytime in profile settings. Features: compact game card grid with toggle on/off by clicking; primary game indicator with yellow star badge; "Set main" button for selected non-primary games; current selection summary showing formatted enabled games list; auto-save behavior (changes persist immediately via GameSelectorProvider context); info note explaining auto-save and game visibility in Browse Sets; skeleton loading state (GameSettingsToggleSkeleton). Integrated into profile page (src/app/profile/page.tsx) as new "Games You Collect" section below avatar customizer; updated page title to "Profile & Settings". Accessible with ARIA labels (aria-pressed for toggle buttons, role="region" and role="group", title/aria-label for indicators). Uses Heroicons (Cog6ToothIcon, StarIcon, CheckIcon, InformationCircleIcon) and reuses TCG game icons (PokemonIcon, YugiohIcon, etc.). 25 unit tests covering skeleton structure, layout, game cards, toggle interactions, loading states, accessibility, and selection summary display. All 2889 tests pass.
- **2026-01-16**: Added Sets page game filter with tabs for enabled TCG games - Created GameFilter component (src/components/sets/GameFilter.tsx) to filter sets by trading card game on the Sets page. Features: [All Games] tab showing all sets across games; individual game tabs for each enabled game from user settings using GameSelectorProvider context; only shows filter when user has multiple games enabled; game-specific icons from TCG icon library (PokemonIcon, YugiohIcon, etc.) displayed in each tab; Squares2X2Icon for All Games tab; set counts per game showing number of available sets; "Coming Soon" state (ComingSoonState component) for games that don't have sets yet (e.g., Yu-Gi-Oh!, One Piece) with RocketLaunchIcon and SparklesIcon decorations; series filter conditionally shown only for Pokemon sets; GameFilterSkeleton loading component during initial state load; accessible with ARIA tablist/tab roles, aria-selected, and keyboard support. Updated SetsList component to integrate GameFilter above series filter; added game filtering logic showing Pokemon sets for pokemon/all, empty state for other games; renamed setCounts to seriesCounts and added gameCounts. Exported GameFilter and GameFilterSkeleton from index.ts. 17 unit tests covering rendering, selection state, interactions, set counts, loading state, and skeleton component. All 2907 tests pass. Commit: 7d6e0f5
- **2026-01-16**: Added per-game color theming with CSS custom properties - Implemented dynamic per-game color theming system using CSS variables. Added CSS custom properties in globals.css for 7 TCG games (Pokemon, Yu-Gi-Oh!, One Piece, Dragon Ball, Lorcana, Digimon, MTG) with primary, secondary, accent, text, and border colors plus RGB variants for alpha support. Created static per-game variables (--game-pokemon-primary, etc.) for multi-game displays alongside dynamic --game-\* variables. Added utility classes (bg-game-primary, text-game-text, border-game-border, bg-game-gradient, shadow-game, focus-game) in @layer utilities. Extended gameSelector.ts with GAME_CSS_VARIABLES constant and helper functions: getGameCssVariables() returns color values, getGameThemeStyles() returns CSS variable assignments, getGameCssVariableName() returns static variable names, getGameColorStyle() returns inline style objects. Created GameThemeProvider component (src/components/providers/GameThemeProvider.tsx) supporting global theming (applies to document root) and scoped theming (wrapper div with scopedTheme prop). Added GameThemed utility component for game-specific sections and useGameTheme hook. Integrated GameSelectorProvider and GameThemeProvider into root layout.tsx. 93 unit tests covering CSS variable structure, hex/RGB format validation, helper functions, provider behavior, hook usage, accessibility, and integration scenarios. All 3033 tests pass. Commit: e7f2757
- **2026-01-16**: Added game-specific achievements with per-TCG badges and cross-game rewards - Created comprehensive game-specific achievement system (src/lib/gameAchievements.ts) for multi-TCG support. Features: 6 milestone badges per TCG game (novice, apprentice, collector, expert, master, legend) with game-thematic names (e.g., "Duelist Champion" for Yu-Gi-Oh!, "Pirate King" for One Piece, "Super Saiyan Master" for Dragon Ball); unique mastery titles: Pokémon Master, Duelist Champion, Pirate King, Super Saiyan Master, Lorekeeper, Digimon Champion, Planeswalker; cross-game achievements (Dual Collector at 2 games, Tri-Collector at 3, Multi-Master at 5, Ultimate Collector at 7) encouraging collecting across multiple TCGs. Updated TrophyCase component (src/components/achievements/TrophyCase.tsx) with: new GameAchievementsSection for per-game badge display using TCG-specific icons (PokemonIcon, YugiohIcon, etc.); CrossGameAchievementsSection showing multi-game progress with game indicators; per-game color theming and progress bars; earned/locked badge states with tier indicators (bronze/silver/gold/platinum); GameSpecificAchievementsWrapper integrating with game selector context. 59 unit tests covering game mastery title definitions, milestone thresholds and thematic names, cross-game achievement logic, progress calculation utilities, and display formatting functions. All 3097 tests pass. Commit: f5e7667
- **2026-01-16**: Added dark mode toggle with system preference detection - Created comprehensive dark mode system with three theme modes: Light, Dark, and System (follows OS preference). DarkModeProvider context (src/components/providers/DarkModeProvider.tsx) manages theme state with localStorage persistence, system preference detection via matchMedia, and real-time system preference change listener when in system mode. DarkModeToggle component (src/components/layout/DarkModeToggle.tsx) features: compact icon-only mode and full dropdown mode with mode descriptions; SunIcon for light, MoonIcon for dark, ComputerDesktopIcon for system; skeleton loading state to prevent hydration mismatch. Configured Tailwind darkMode: 'class' strategy for .dark class toggling. Added dark theme CSS variables in globals.css for backgrounds (slate-900 tones), foreground colors, and all 7 TCG game color schemes adjusted for dark backgrounds. Integrated toggle into AppHeader (desktop and mobile) and MarketingHeader (desktop and mobile menu). Added dark mode styling throughout headers: border colors, background colors, text colors, hover states, dropdown menus, and mobile menus using dark: variants. 41 unit tests covering theme mode types, system preference detection, theme resolution, localStorage persistence, toggle behavior, CSS class application, accessibility, and hydration safety. Uses Heroicons (SunIcon, MoonIcon, ComputerDesktopIcon, ChevronDownIcon). All 3215 tests pass. Commit: 46edbe2
- **2026-01-16**: Added set completion confetti celebration - Created SetCompletionCelebration component (src/components/gamification/SetCompletionCelebration.tsx) providing big celebration when user collects all cards in a set (100% completion). Features: SetCompletionProvider context for managing celebration state globally with session-based deduplication; SetCompletionCelebrationModal with dramatic celebration UI including animated background rings, golden amber/yellow glow effects, sparkle decorations (SparklesIcon, StarIcon), and TrophyIcon with gradient; confetti burst with 200 multi-colored particles in various shapes (circles, squares, stars, triangles) using physics-based animation; "Set Champion!" badge with set name display and card count showing X/X; useSetCompletionTracker hook for auto-detecting set completion in CardGrid (triggers only when crossing 100% threshold, not on initial page load if already complete). Utility library (src/lib/setCompletion.ts) provides: getSetCompletionProgress() for calculating completion percentage, checkSetJustCompleted() for threshold detection, shouldCelebrateSetCompletion() for celebration logic, formatSetProgress() and getSetCompletionTitle() for user-friendly messaging ("Set Champion", "Set Master", "Set Adventurer", "Set Explorer"), getSetCompletionGradient() for tiered color schemes. Integrated SetCompletionProvider into root layout.tsx. 59 unit tests covering completion detection, progress formatting, celebration data creation, validation, and integration scenarios. Uses Heroicons (TrophyIcon, SparklesIcon, StarIcon, CheckBadgeIcon). All 3274 tests pass. Commit: a7a4905
- **2026-01-16**: Added offline viewing indicator with sync status display - Created OfflineProvider context (src/components/providers/OfflineProvider.tsx) tracking online/offline state via navigator.onLine API with real-time event listeners for online/offline events. OfflineIndicator component (src/components/layout/OfflineIndicator.tsx) shows connection status in header with color-coded badges: emerald for online/synced, amber for offline, blue for syncing, yellow for pending changes. Features: toast notifications when going offline/online with auto-dismiss after 4 seconds; last sync time tracking with relative formatting ("Just now", "5 minutes ago", "2 hours ago"); localStorage persistence for sync timestamps; OfflineStatusDetailed component for settings/status pages with expanded info display; OfflineIndicatorSkeleton for loading states. Indicator intelligently hides when fully online and synced to reduce visual clutter, only showing when offline or status recently changed. Full accessibility support with role="status", aria-labels, aria-live="polite" for toast notifications, and keyboard-dismissible toast. Dark mode support throughout with appropriate color adjustments. Integrated OfflineProvider into root layout.tsx after DarkModeProvider; integrated OfflineIndicator into AppHeader for both desktop and mobile views. 31 unit tests covering utility functions (formatLastSyncTime, getStatusMessage), localStorage persistence/retrieval, browser API integration, type definitions, accessibility attributes, and time formatting edge cases. Uses Heroicons (WifiIcon, SignalSlashIcon, ArrowPathIcon, CloudArrowUpIcon, CheckCircleIcon, ExclamationTriangleIcon). All 3461 tests pass. Commit: fbef0f3
- **2026-01-16**: Optimized card grid scrolling performance with virtual scrolling - Created VirtualCardGrid component (src/components/collection/VirtualCardGrid.tsx) using @tanstack/react-virtual for row-based virtualization. Features: automatically enables virtual scrolling for collections with 50+ cards (VIRTUAL_SCROLL_THRESHOLD); calculates responsive column count based on container width (2-6 columns depending on screen size); organizes cards into rows for efficient virtualization; estimates row heights for scroll position accuracy; uses overscan of 3 rows for smooth scrolling experience; shows "Optimized scrolling for X cards" indicator when virtualization is active; supports all existing CardGrid functionality (owned/wishlist/priority states, variant selector, XP notifications, set completion tracking). Container uses ResizeObserver for responsive column updates; 600px fixed height scroll container with rounded corners. Updated SetDetailClient to use VirtualCardGrid instead of CardGrid. Memory savings: for a 500-card collection with 6 columns (84 rows total), only ~9 rows are rendered at any time (<15% of total). 48 unit tests covering column count calculation, row organization, virtual scroll threshold logic, row height estimation, overscan configuration, variant helpers, price formatting, collection map building, progress calculation, and accessibility attributes. All 3551 tests pass. Commit: ab7c023
- **2026-01-16**: Created onboarding flow for new users - Built comprehensive multi-step onboarding flow (src/components/onboarding/OnboardingFlow.tsx) guiding new users through initial setup. Features: 4-step wizard (Welcome, Pick Games, Create Profile, Add First Cards) with progress bar and clickable step dots; Welcome step with feature highlights (badges, wishlists, sharing) and animated icons; Games step reuses existing GameSelectorOnboarding for TCG selection; Profile step with name input and parent/collector type selection with validation; First Cards step with quick-start instructions and stats preview (500+ sets, 20,000+ cards, 50+ badges); Completion step with celebration animation, next steps checklist, and navigation to dashboard or sets. OnboardingFlow library (src/lib/onboardingFlow.ts) provides: step definitions with icons, gradients, skippable flags; progress tracking functions (completeStep, goToStep, getProgressPercentage, isStepCompleted); localStorage persistence (save, load, clear, hasCompletedOnboarding, markOnboardingComplete); display helpers (getStepLabel, getProgressText, formatOnboardingTime, getWelcomeMessage, getFirstCardsStats). Keyboard navigation (Escape to go back), skip option for first-cards step, auto-redirect if already completed. Created /onboarding page with loading.tsx and error.tsx route files. 61 unit tests covering step lookup, progress tracking, localStorage persistence, and display helpers. All 3852 tests pass. Uses Heroicons (RocketLaunchIcon, Square3Stack3DIcon, UserCircleIcon, SparklesIcon, TrophyIcon, ArrowRightIcon, ArrowLeftIcon, CheckIcon, CheckCircleIcon, LightBulbIcon, StarIcon, HeartIcon, FireIcon, GiftIcon, MagnifyingGlassIcon). Commit: 74930d6
- **2026-01-16**: Added low-stimulation mode for autism-friendly accessibility - Created comprehensive calm/low-stimulation mode system with three preset levels (Standard, Moderate, Minimal). Features: LowStimulationProvider context (src/components/providers/LowStimulationProvider.tsx) managing mode state with localStorage persistence; LowStimulationToggle dropdown component (src/components/layout/LowStimulationToggle.tsx) in AppHeader with compact icon mode and dropdown preset selector; 6 individual settings (reduceAnimations, mutedColors, disableSounds, simplerLayouts, hideDecorations, softerContrast); CSS support (globals.css) with classes: .low-stim, .low-stim-no-animations (disables all animations/transitions), .low-stim-muted (desaturated color palette), .low-stim-simple (reduced shadows/rounded corners), .low-stim-no-decorations (hides sparkles/confetti), .low-stim-soft-contrast (softer text colors); utility classes (.hide-in-low-stim, .show-in-low-stim, .low-stim-decoration); presets: Standard (all effects), Moderate (no animations/decorations but keeps colors), Minimal (full calm experience with muted colors and soft contrast); integrated into AppHeader desktop and mobile views; convenience hooks (showAnimations, showDecorations, playSounds) for conditional rendering throughout app. Utility library (src/lib/lowStimulationMode.ts) provides settings types, presets, localStorage persistence functions, CSS class helpers. 65 unit tests covering constants, utility functions, persistence, CSS helpers, and accessibility considerations. Uses Heroicons (EyeIcon, ChevronDownIcon, CheckIcon). All tests pass. Commit: 08df376
- **2026-01-16**: Added OpenDyslexic font option for dyslexia-friendly accessibility - Created dyslexic-friendly font toggle system for improved readability. Features: DyslexicFontProvider context (src/components/providers/DyslexicFontProvider.tsx) managing font state with localStorage persistence; DyslexicFontToggle component (src/components/layout/DyslexicFontToggle.tsx) in AppHeader with compact icon mode using LanguageIcon; purple color theme to distinguish from other accessibility toggles; CSS support (globals.css) importing OpenDyslexic font from CDN with .dyslexic-font class applying font-family, letter-spacing (0.05em), word-spacing (0.1em), and line-height (1.6) adjustments; heading hierarchy preserved with adjusted spacing; code blocks excluded to maintain monospace; utility class .no-dyslexic-font for opting out specific elements. Utility library (src/lib/dyslexicFont.ts) provides DYSLEXIC_FONT_INFO constant with name, description, benefits, and source URL; persistence functions (saveDyslexicFontEnabled, loadDyslexicFontEnabled); CSS class helpers (applyDyslexicFontClass, isDyslexicFontApplied); display helpers for labels, descriptions, and tooltips. Integrated into AppHeader desktop and mobile views. 41 unit tests covering constants, persistence functions, CSS helpers, display helpers, and accessibility considerations. Uses Heroicons (LanguageIcon, CheckIcon). All 4344 tests pass. Commit: ab402c9
- **2026-01-16**: Added high-contrast mode for vision accessibility - Created enhanced contrast mode system beyond standard dark mode for users with vision accessibility needs. Features: HighContrastProvider context (src/components/providers/HighContrastProvider.tsx) managing contrast level state with localStorage persistence; HighContrastToggle dropdown component (src/components/layout/HighContrastToggle.tsx) in AppHeader with EyeIcon, amber color theme, and three contrast levels (Standard, Medium, High); CSS support (globals.css) with CSS custom properties for text, background, and border colors at each level; medium contrast level increases text contrast and border visibility with 3px focus indicators; high contrast level uses pure black/white text, maximum contrast borders, 4px focus outlines, underlined links, solid backgrounds, and forced 2px borders on all interactive elements; dark mode support for both contrast levels with appropriate color adjustments; utility classes (.hc-text-primary, .hc-border, .hc-bg-primary, .no-high-contrast) for component-level control. Utility library (src/lib/highContrastMode.ts) provides CONTRAST_LEVEL_INFO and CONTRAST_LEVEL_OPTIONS constants, persistence functions (saveHighContrastLevel, loadHighContrastLevel), CSS class helpers (getHighContrastClasses, applyHighContrastClasses, isHighContrastApplied, getCurrentHighContrastLevel), and display helpers (getHighContrastLabel, getHighContrastDescription, getHighContrastTooltip, isHighContrastEnabled). Integrated into AppHeader desktop and mobile views. 71 unit tests covering constants, persistence functions, CSS helpers, display helpers, and accessibility considerations. Uses Heroicons (EyeIcon, ChevronDownIcon, CheckIcon). Commit: e97f25a
- **2026-01-16**: Added manual reduced motion toggle for accessibility - Created ReducedMotionProvider context (src/components/providers/ReducedMotionProvider.tsx) with three motion modes: System (follows device preference), Always Reduce (manual override to always reduce), Never (manual override to always show motion). ReducedMotionToggle dropdown component (src/components/layout/ReducedMotionToggle.tsx) in AppHeader with PauseIcon, cyan color theme, and dropdown showing current system preference status. Features: detects system prefers-reduced-motion via matchMedia API with real-time listener; localStorage persistence via saveReducedMotionMode/loadReducedMotionMode; shouldReduceMotion() function resolves mode + system preference to determine effective state; CSS support (globals.css) with .reduce-motion class disabling all animations, transitions, and scroll behavior; utility classes (.hide-when-reduced-motion, .show-when-reduced-motion, .allow-motion) for conditional content; system preference indicator in dropdown footer shows current device setting. Utility library (src/lib/reducedMotion.ts) provides MOTION_MODE_INFO and MOTION_MODE_OPTIONS constants, system preference detection (getSystemPrefersReducedMotion, addSystemMotionListener), CSS class helpers (applyReducedMotionClass, isReducedMotionApplied), and display helpers (getReducedMotionLabel, getReducedMotionTooltip, getMotionStatusIndicator). Integrated into root layout.tsx and AppHeader (desktop and mobile). 67 unit tests covering constants, persistence, state resolution, CSS helpers, display helpers, accessibility, and integration scenarios. Uses Heroicons (PauseIcon, ChevronDownIcon, CheckIcon). Commit: 6a37b52
- **2026-01-16**: Added focus mode to hide gamification elements for accessibility - Created comprehensive focus mode system allowing users who find gamification elements overwhelming to hide them. FocusModeProvider context (src/components/providers/FocusModeProvider.tsx) manages focus mode state with localStorage persistence; three preset levels: Off (all features visible), Minimal (hides header stats like streaks/levels but keeps celebrations), Full Focus (hides all gamification for pure collection experience). FocusModeToggle dropdown component (src/components/layout/FocusModeToggle.tsx) in AppHeader with EyeSlashIcon, violet color theme, and dropdown preset selector. Features: 6 individual settings (hideStreaks, hideLevels, hideAchievements, hideMilestones, hideCompletionCelebrations, hideProgressBars); convenience checks (showStreaks, showLevels, showAchievements, etc.) for conditional rendering; CSS support (globals.css) with .focus-mode class and utility classes (.hide-in-focus-mode, .show-in-focus-mode, .gamification-streak, .gamification-level, etc.) for declarative hiding. Updated AppHeader to conditionally render LevelDisplay and StreakCounter based on focus mode state. Utility library (src/lib/focusMode.ts) provides types, preset definitions, HIDDEN_GAMIFICATION_ELEMENTS list, persistence functions (saveFocusModeEnabled, loadFocusModeEnabled, saveFocusModeSettings, loadFocusModeSettings, saveFocusModePreset, loadFocusModePreset), CSS class helpers (applyFocusModeClasses, isFocusModeClassApplied), and display helpers (getFocusModeLabel, getFocusModeDescription, getFocusModeTooltip, getFocusModeAriaLabel). Integrated FocusModeProvider into root layout.tsx. 61 unit tests covering constants, utility functions, persistence, CSS helpers, display helpers, accessibility considerations, and integration scenarios. Uses Heroicons (EyeSlashIcon, ChevronDownIcon, CheckIcon). Commit: a48156f
- **2026-01-16**: Added screen reader optimization with enhanced ARIA descriptions and live regions - Created comprehensive accessibility system for screen reader users. Core library (src/lib/screenReaderUtils.ts) provides ARIA label generators: generateCardAriaLabel() for card descriptions with ownership/wishlist/price/variant details, generateBadgeAriaLabel() for achievement badges with tier/progress info, generateStatAriaLabel() for collection statistics, generateActivityAriaLabel() for activity feed items; change description helpers: describeQuantityChange(), describeProgressUpdate(), describeStreakChange(); ARIA role constants (ARIA_ROLES) and state descriptions (STATE_DESCRIPTIONS). LiveRegionProvider context (src/components/accessibility/LiveRegion.tsx) provides global announcement system: useLiveRegion() hook with announce() function for polite/assertive announcements, LiveRegion standalone component for local announcements, DynamicContentAnnouncer for auto-announcing value changes. Enhanced components: ActivityFeed with aria-live announcements for new activities and achievement celebrations, article roles with aria-labels, aria-posinset/aria-setsize for feed items, time elements with datetime attributes; TrophyCase with role="region" and descriptive aria-labels for stats header, progress bars with role="progressbar" and aria-valuenow, CategorySection with aria-labelledby, badge grid with role="list"; CardGrid stats bar with role="region" and comprehensive collection progress labels; KidDashboard stats grid with descriptive aria-labels for each stat card. Integrated LiveRegionProvider into root layout.tsx. 38 unit tests covering all ARIA label generators, change description functions, and role/state constants. Uses semantic HTML elements (article, section, time). Commit: 7c20f98
- **2026-01-16**: Added streak milestone rewards with special badges and avatar items at 7, 14, 30, 60, 100 day streaks - Created comprehensive streak milestone reward system. Utility library (src/lib/streakMilestones.ts) defines 5 milestone thresholds (Week Warrior at 7 days, Fortnight Champion at 14 days, Monthly Master at 30 days, Season Collector at 60 days, Legendary Collector at 100 days) with tiered rewards (bronze → silver → gold → platinum → diamond). Each milestone unlocks special avatar items: frames (Silver, Gold, Platinum, Diamond, Legendary Streak frames), badges (Monthly Master, Season Collector, Legendary Streak badges), and hats (Streak Master Crown at 60 days, Legendary Streak Crown at 100 days). Functions for progress tracking: getStreakMilestoneProgress(), getAchievedMilestones(), getNextMilestone(), getMilestoneEncouragement(), formatMilestoneDays(). StreakMilestoneRewards component (src/components/gamification/StreakMilestoneRewards.tsx) displays milestone cards with progress indicators, achieved/locked states, tier badges, reward tooltips showing unlockable items, overall progress bar with milestone markers, encouragement messages, and next rewards preview section. Updated avatarItems.ts with new streak-based items: frame_streak_diamond, frame_streak_legendary, badge_streak_30, badge_streak_60, badge_streak_100, hat_streak_master, hat_streak_legend. Integrated into /streak page below the calendar with skeleton loading state. Updated tips section to mention all 5 milestone levels. 58 unit tests covering milestone definitions, progress calculations, achievement detection, item unlocks, display helpers, and integration scenarios. Uses Heroicons (FireIcon, TrophyIcon, SparklesIcon, LockClosedIcon, CheckCircleIcon, GiftIcon, StarIcon, BoltIcon, RocketLaunchIcon). Also marked Visual streak calendar task complete as it was already fully implemented with StreakCalendar component and /streak page.
- **2026-01-16**: Added grace day streak protection with 1 free missed day per week - Created comprehensive grace day protection system to make streaks more forgiving. Utility library (src/lib/graceDays.ts) provides: GraceDayState/GraceDayUsage/GraceDayAvailability types; week boundary calculation using ISO week standards (getISOWeekInfo, getWeekBoundaries, isSameWeek); checkGraceDayAvailability() for real-time availability status with reset countdown; canProtectStreakGap() to detect if a streak gap can be saved by grace day; consumeGraceDay() to use protection and track usage history; calculateStreakWithGraceDays() for streak calculation considering protected days; localStorage persistence with automatic cleanup of old history (>1 year). GraceDayProvider context (src/components/providers/GraceDayProvider.tsx) manages app-wide state with enable/disable/toggle actions, checkProtection/protectStreak/isDateProtected methods, and availability tracking. GraceDayStatus component (src/components/gamification/GraceDayStatus.tsx) displays status card with shield icons (emerald=available, amber=used), toggle control, week info with reset countdown, and info box explaining feature. GraceDayIndicator compact version for inline display. GraceDayHistory component shows usage history list. Updated StreakCalendar component to add 4th stat column showing grace day availability for current week. Updated /streak page with GraceDayStatus section below calendar, updated info card messaging, added tip about weekly Sunday reset. 75 unit tests covering date/week utilities, grace day logic, localStorage persistence, and display helpers. Uses Heroicons (ShieldCheckIcon, ShieldExclamationIcon, SparklesIcon, InformationCircleIcon). Commit: 7b14add
- **2026-01-16**: Added weekend pause toggle for streak system - Optional setting to pause streak requirements on Saturday and Sunday. Features: weekendPauseEnabled field added to GraceDayState; isWeekend(), isTodayWeekend(), isWeekendPaused(), getWeekendDayName() utility functions in graceDays.ts; WeekendPauseStatus component (src/components/gamification/GraceDayStatus.tsx) with toggle control, status display showing current state and active weekend indicator, indigo/purple gradient when enabled, amber/orange gradient when relaxing on weekend day; GraceDayProvider extended with isWeekendPauseEnabled, isWeekendPausedToday, enableWeekendPause/disableWeekendPause/toggleWeekendPause actions, and isDateWeekendPaused method; /streak page updated with side-by-side grid showing GraceDayStatus and WeekendPauseStatus; added tip about weekend pause feature. Uses Heroicons (CalendarIcon, SunIcon, SparklesIcon, InformationCircleIcon). Commit: 27a2ac7
- **2026-01-16**: Created dedicated Settings page (`/settings`) - Central hub for all user preferences and accessibility options. Features: Display section with Dark Mode and Kid Mode toggles; Accessibility section with Low-Stimulation Mode, Dyslexic-Friendly Font, High Contrast, Reduced Motion, and Focus Mode toggles; Games section with GameSettingsToggle for TCG selection; Notifications section (placeholder for future). Includes loading.tsx with skeleton screens matching page layout and error.tsx with retry functionality. Uses Heroicons (Cog6ToothIcon, ArrowLeftIcon, ExclamationTriangleIcon, ArrowPathIcon). Commit: 28fd212
- **2026-01-16**: Moved accessibility toggles from header to Settings page - Removed Low-Stimulation, Dyslexic Font, High Contrast, Reduced Motion, and Focus Mode toggles from AppHeader (both desktop and mobile views). Header now shows only essential items: logo, nav links, level display, streak counter, offline indicator, kid mode toggle, dark mode toggle, and profile menu. Accessibility options remain fully accessible via the dedicated Settings page. Commit: b1ef6c9
- **2026-01-16**: Simplified header to essential items only - Removed LevelDisplay, StreakCounter, OfflineIndicator, KidModeToggle, and DarkModeToggle from AppHeader. Added single settings gear icon (Cog6ToothIcon) linking to /settings page. Header now contains only: logo, main nav links (My Collection, Browse Sets, Badges, Wishlist, Search), settings gear icon, and profile dropdown menu. Mobile menu also simplified with Settings link instead of inline toggles. All removed features remain accessible via dedicated Settings page. Commit: 55c9475
- **2026-01-16**: Added Settings link to profile dropdown menu - Quick access to Settings page from anywhere in the app via profile dropdown. Link appears with Cog6ToothIcon after Learn to Collect and before Sign Out divider. Matches existing menu item styling with active state highlighting. Commit: 70b0a86
- **2026-01-17**: Lazy loaded VirtualTrophyRoom with React.lazy() - Updated src/app/collection/page.tsx to use dynamic import for VirtualTrophyRoom component. Wrapped in Suspense boundary with TrophyRoomSkeleton as fallback for smooth loading experience. Exported TrophyRoomSkeleton from VirtualTrophyRoom.tsx for use as Suspense fallback. This improves initial page load by deferring trophy room bundle until needed.
- **2026-01-17**: Added breadcrumb navigation to /condition-guide page - Created reusable Breadcrumb component (src/components/ui/Breadcrumb.tsx) for hierarchical navigation. Features: ordered list of breadcrumb items with ChevronRightIcon separators, HomeIcon option for first item, links for navigable items, aria-current="page" for current page indication, dark mode support. Updated /condition-guide/page.tsx to show "Home > Learn > Condition Guide" breadcrumb replacing the previous back link. Added comprehensive test suite (src/components/ui/__tests__/Breadcrumb.test.tsx) with 15 tests covering rendering, accessibility, styling, and edge cases. Commit: 951638d
- **2026-01-16**: Completed UI Cleanup & Settings section - Settings page sections already organized into Display (dark mode, kid mode), Accessibility (low-stim, dyslexic font, high contrast, reduced motion, focus mode), Games (TCG selection), and Notifications. Added quick settings popover from header gear icon with DarkModeToggle and KidModeToggle for fast access without leaving current page. Desktop shows popover on gear click; mobile menu includes Quick Settings section with same toggles. Commit: b835962
- **2026-01-16**: Added streak repair with XP - Created comprehensive streak repair system (src/lib/streakRepair.ts, src/components/gamification/StreakRepair.tsx) allowing users to spend accumulated XP to repair a recently broken streak. Features: 48-hour repair window after streak breaks; cost formula scales with streak length (base cost + streak bonus); cost breakdown display showing base cost and streak multiplier; urgency indicators (critical/high styling when time running low); StreakRepairStatus card with XP cost, time remaining, repair button; RepairSuccessModal with celebration animation when streak restored; StreakRepairIndicator compact version for inline display; localStorage persistence for repair state and history. Integrated into /streak page below calendar, updated info card and tips section to mention repair feature. Uses Heroicons (WrenchScrewdriverIcon, BoltIcon, ClockIcon, FireIcon, ExclamationTriangleIcon, CheckCircleIcon, SparklesIcon). Commit: cd9db31
- **2026-01-16**: Added daily stamp collection system - Created non-consecutive stamp system where users collect 5 stamps in any week for bonus XP reward. Features: dailyStamps.ts utility library with stamp tracking, week boundaries, and progress calculations; DailyStampProvider context for app-wide state management; DailyStampCollection component with weekly 7-day stamp grid, interactive collect-today cells with pulse animation, progress bar with smooth transitions, reward claim modal with celebration animation; stamp milestones at 10/25/50/100 total stamps with progress indicators; localStorage persistence with automatic cleanup of old data (>8 weeks); integrated into /streak page with skeleton loading states; added tip about daily stamps to tips section. Uses Heroicons (CalendarDaysIcon, GiftIcon, SparklesIcon, CheckCircleIcon, StarIcon, FireIcon, BoltIcon). Commit: fb6ee0d
- **2026-01-16**: Added weekly challenges system - Created themed weekly challenges like "Add 3 Water-type cards this week" with XP rewards. Features: weeklyChallenges.ts library with 14 challenge templates covering type collection (fire, water, grass, lightning, psychic, fighting, dragon), rarity hunts (rare, ultra rare), variant collection (holofoil, reverse holo), and general challenges (set explorer, variety collector, card enthusiast); deterministic weekly selection using seeded random based on week start date; WeeklyChallenges component with ChallengeCard displaying progress bars, status indicators, and claim buttons; reward modal with celebration animation; tracks all-time completed challenges and total XP earned; localStorage persistence with auto-cleanup of old data; integrated into /streak page below daily stamps with skeleton loading state; added tip about weekly challenges. Uses Heroicons (TrophyIcon, SparklesIcon, CheckCircleIcon, ClockIcon, GiftIcon, BoltIcon, FireIcon, GlobeAltIcon, StarIcon, ShieldCheckIcon, HeartIcon, RocketLaunchIcon). Commit: 266caa9
- **2026-01-16**: Added comeback rewards system - Special welcome back celebration with bonus XP for users returning after absence. Features: comebackRewards.ts utility library with 4 reward tiers (3 days = 5 XP, 7 days = 15 XP, 14 days = 30 XP, 30 days = 50 XP); ComebackProvider context that detects absence and shows celebration modal on return; ComebackCelebration modal with animated background rings, tier-specific gradients (bronze/silver/gold/platinum), gift icon, XP reward display, and claim button; ComebackStatus compact display showing total comebacks earned and bonus XP history; localStorage persistence with visit tracking and claim deduplication; integrated into /streak page with skeleton loading state; added tip about comeback rewards. Uses Heroicons (GiftIcon, SparklesIcon, BoltIcon, HeartIcon, XMarkIcon, CheckCircleIcon). Commit: 8358a8f
- **2026-01-16**: Added collection snapshot sharing for social media - Created CollectionSnapshotShare component (src/components/collection/CollectionSnapshotShare.tsx) generating shareable images of collection stats using HTML Canvas API. Features: 1080x1080px Instagram-friendly square format; 4 theme options (Galaxy purple, Ocean blue, Forest green, Sunset orange); displays profile name, total cards, unique cards, day streak, badges earned, sets started with progress bar; CardDex branding and tagline; date stamp; download as PNG, copy to clipboard, or share via Web Share API on mobile; modal preview with theme selector; integrated into Dashboard welcome header and Collection page header; skeleton loading state while data loads. Uses Heroicons (ShareIcon, XMarkIcon, ArrowDownTrayIcon, ClipboardDocumentIcon, CheckIcon, SparklesIcon, Square3Stack3DIcon, TrophyIcon, FireIcon, StarIcon). Commit: 0006c18
- **2026-01-17**: Added error boundary to /collection route - Created src/app/collection/error.tsx to prevent collection errors from crashing the app. Features: user-friendly error message with red warning icon (ExclamationTriangleIcon), "Try Again" retry button with gradient styling, "Go Home" link as fallback navigation (HomeIcon), matches indigo/purple gradient theme of collection page. Follows existing error boundary pattern from other routes (/settings, /sets, /badges). Commit: d7b12a6
- **2026-01-16**: Added virtual pack opening simulator - Created PackOpeningSimulator component (src/components/virtual/PackOpeningSimulator.tsx) with interactive pack opening experience. Features: 2 free daily packs that reset at midnight with localStorage persistence; sealed pack with holographic shimmer effect and lock overlay when exhausted; 10-card reveal grid with 3D flip animations; card back design with sparkle icon; rare card detection with amber glow effects and star badge; rares sorted to end of pack like real packs; auto-reveal all button; open another pack flow; empty collection state with guidance; respects reduced motion preferences; accessible with keyboard navigation and ARIA labels. Integrated into KidDashboard with PackOpeningButton showing remaining pack count. Uses Heroicons (SparklesIcon, XMarkIcon, GiftIcon, ArrowPathIcon, StarIcon, LockClosedIcon). Commit: fd44b9e
- **2026-01-16**: Added virtual trophy room - Created VirtualTrophyRoom component (src/components/virtual/VirtualTrophyRoom.tsx) displaying user's top 10 most valuable cards on 3D-style display shelves. Features: two-row trophy shelf layout (5 cards each) with wooden shelf effect; rank badges (gold #1, silver #2, bronze #3, indigo #4-10); rarity-based glow effects using RARITY_GLOW_COLORS mapping (yellow for Rare Holo, purple for Ultra Rare, rainbow for Rare Rainbow, etc.); hover animations with -translate-y-2 scale effect; shimmer overlay for holo cards; total collection value display with SparklesIcon header badge; empty state with placeholder message; empty slot placeholders with dashed border and StarIcon; skeleton loading state; respects reduced motion preferences with prefersReducedMotion check; accessible with meaningful image alt text. Integrated into My Collection page above stats overview. Uses getMostValuableCards Convex query for card data. Uses Heroicons (TrophyIcon, SparklesIcon, CurrencyDollarIcon, StarIcon, Square3Stack3DIcon). Commit: f531734
- **2026-01-16**: Added family collection goals - Created FamilyCollectionGoal component (src/components/family/FamilyCollectionGoal.tsx) showing shared collection goal between parent and child accounts with combined progress bar. Features: multi-colored segmented progress bar with each family member's contribution shown in different colors (indigo, pink, emerald, amber, purple); expandable member breakdown showing individual card counts and percentages; goal completion celebration with trophy icon and sparkle message; compact variant for kid dashboard and full variant for parent dashboard; default 500-card goal target; uses MemberStatsCollector pattern with useEffect to fetch each profile's stats independently; skeleton loading state. Integrated into KidDashboard progress section and ParentDashboard below family overview. Uses Heroicons (FlagIcon, UserGroupIcon, TrophyIcon, SparklesIcon, ChevronDownIcon, ChevronUpIcon). Commit: f6ac316
- **2026-01-16**: Added timeline view - Created CollectionTimeline component (src/components/collection/CollectionTimeline.tsx) showing chronological view of when cards were added with month markers and collection anniversaries. Features: cards grouped by month with expandable sections (shows first 8, expand to see all); month headers with CalendarDaysIcon and card count badges; collection anniversary detection highlighting months where user hit yearly milestones with CakeIcon and special amber ring styling; stats header showing total cards added, months active, and start date; individual card entries showing name, set, date, and variant badges; CollectionTimelineSkeleton loading state. Created /timeline page with loading.tsx and error.tsx routes; added Timeline button with CalendarDaysIcon to collection page header linking to new page. Uses Heroicons (CalendarDaysIcon, SparklesIcon, CakeIcon, ChevronDownIcon, ChevronUpIcon). Commit: aec239c
- **2026-01-16**: Added first card celebration - Created FirstCardCelebration component (src/components/collection/FirstCardCelebration.tsx) displaying special permanent badge for user's very first card (nostalgia feature). Features: amber/orange gradient card highlighting "Where It All Began"; shows first card name, set name, date added, and collection age; decorative sparkles and star accents; nostalgic message about collection journey; HeartIcon badge header with pulsing glow effect; compact version (FirstCardCelebrationCompact) for dashboard/sidebar use; skeleton loading state. Integrated at top of timeline page above CollectionTimeline. Uses Heroicons (SparklesIcon, StarIcon, CalendarDaysIcon, HeartIcon). Commit: f6737c9
- **2026-01-17**: Updated /login page styling - Replaced generic blue gradients with kid-primary/kid-secondary brand colors for background (from-kid-primary/10 to-kid-secondary/10), loading spinner (border-kid-primary), and logo text (gradient text from-kid-primary to-kid-secondary). Commit: 68cc8c4

- **2026-01-17**: Added email verification UI - Added verification pending state to AuthForm (src/components/auth/AuthForm.tsx) showing after signup. Features: envelope icon with brand gradient, check your email message with user's email address, spam folder reminder in amber alert box, resend verification email button with loading spinner and success confirmation, back to sign in button. Uses Heroicons (EnvelopeIcon, ArrowPathIcon, CheckCircleIcon). Commit: 6f36eec

- **2026-01-17**: Updated signup page tagline - Changed "Start tracking your trading card collection" to "Start your collecting adventure!" in src/app/signup/page.tsx for more exciting, kid-friendly copy. Commit: a4d921c

- **2026-01-17**: Increased VirtualCardGrid overscan on mobile - Changed overscan from static 3 rows to dynamic value based on viewport width (5 rows on mobile < 640px, 3 rows on desktop). This improves scrolling smoothness on slower mobile devices by pre-rendering more rows above and below the visible viewport. Commit: 3603a4d

- **2026-01-17**: Created CardImage component with error handling - Built reusable CardImage component (src/components/ui/CardImage.tsx) wrapping Next.js Image with automatic fallback to placeholder on load errors. Features: inline SVG placeholder as data URL (no external dependencies), loading skeleton state with PhotoIcon, support for fill and fixed dimension modes, CardBack component for flip animations, customizable fallback image, onError/onLoad callbacks. Created card-placeholder.svg (public/images/card-placeholder.svg) with card-shaped design and "Card not available" message. Added comprehensive test suite (16 tests) covering error handling, fallback behavior, callbacks, and prop handling. Commit: 1eba4f1

- **2026-01-17**: Updated parent dashboard text for multi-TCG support - Changed "Manage your family's Pokemon collections" to "Manage your family's trading card collections" in src/app/parent-dashboard/page.tsx line 75 to reflect that the app supports multiple trading card games. Commit: a506f8d

- **2026-01-17**: Fixed onboarding redirect to /collection - Updated OnboardingFlow completion to redirect users to /collection instead of /dashboard. After completing onboarding, users now see "View My Collection" button (previously "Go to Dashboard") which takes them directly to their collection page to start building their card collection. Changes in src/components/onboarding/OnboardingFlow.tsx: renamed handleGoToDashboard to handleGoToCollection, updated router.push from '/dashboard' to '/collection', renamed prop onGoToDashboard to onGoToCollection, updated button text. Commit: 9bf7f8c

- **2026-01-17**: Fixed Settings button in parent dashboard - Converted the non-functional Settings button (previously a plain button element) to a Next.js Link component that navigates to /settings. The button retains its original styling with Cog6ToothIcon and now properly routes users to the settings page when clicked. Changes in src/app/parent-dashboard/page.tsx. Commit: 75780af

- **2026-01-17**: Fixed Add Profile button in parent dashboard - Created AddProfileModal component (src/components/dashboard/AddProfileModal.tsx) with: real-time name validation using Convex queries (canCreateChildProfile, validateChildProfileName), profile limit checks based on subscription tier (free vs family), kid-safe content filtering for display names, loading/error/success states with appropriate icons, escape key handling and click-outside-to-close, accessible modal with proper ARIA attributes (role="dialog", aria-modal, aria-labelledby). Updated parent dashboard page to use useState for modal visibility, added onClick handler to Add Profile button, integrated AddProfileModal component. Uses Heroicons (XMarkIcon, UserPlusIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowUpCircleIcon). Commit: f5ec86d

- **2026-01-17**: Updated landing page hero for multi-TCG branding - Fixed Landing Page Hero section in src/app/page.tsx to use CardDex brand colors instead of Pokemon-specific styling. Changes: FloatingCard SparklesIcon color changed from text-pokemon-yellow to text-kid-primary (line 41); FloatingStar default color prop changed from text-pokemon-yellow to text-kid-primary (line 51); "Made for young collectors" badge SparklesIcon changed from text-pokemon-yellow to text-kid-primary (line 95); Hero headline changed from "Pokemon Cards" to "Trading Cards" (lines 102-104). These changes align the landing page with CardDex's multi-TCG identity. All 26 LandingPage tests pass. Commit: cbb9b46

- **2026-01-17**: Added onError handler to FlippableCard card back images - Updated FlippableCard component (src/components/collection/FlippableCard.tsx) to use the CardBack component from CardImage.tsx instead of raw Next.js Image components. This provides automatic error handling with fallback to placeholder when the Pokemon card back URL (https://images.pokemontcg.io/cardback.png) fails to load. Changes: imported CardBack from @/components/ui/CardImage, replaced Image components with CardBack in both FlippableCard and ZoomableCardModal. Added comprehensive test suite (25 tests) covering FlippableCard, CardFlipModal, and ZoomableCardModal components including: flip functionality, keyboard navigation (F key), accessibility (ARIA labels), controlled/uncontrolled modes, CardBack integration verification, zoom controls, and modal interactions. All FlippableCard tests pass. Commit: edb71fe

- **2026-01-17**: Updated VirtualCardGrid to use CardImage component - Replaced raw Next.js Image component with CardImage component in VirtualCardGrid (src/components/collection/VirtualCardGrid.tsx) for card image display. This provides automatic fallback to placeholder SVG when external card images fail to load, loading skeleton while images load, and consistent error handling across the virtual card grid. Prevents broken image icons from appearing when browsing large card sets with virtual scrolling. All tests pass (5730 tests), ESLint and Prettier clean. Commit: 53ff0a0

- **2026-01-17**: Added error handling to DigitalBinder card images - Replaced raw Next.js Image components with CardImage component in DigitalBinder (src/components/virtual/DigitalBinder.tsx) for both left and right page card grids. This provides automatic fallback to placeholder SVG when external card images fail to load, loading skeleton while images load, and consistent error handling across the digital binder view. Ensures graceful degradation when viewing collection in binder mode. All tests pass (5730 tests), ESLint and Prettier clean. Commit: 2e4b5b1

- **2026-01-17**: Added error handling to PackOpeningSimulator card images - Replaced raw Next.js Image component with CardImage component in PackOpeningSimulator (src/components/virtual/PackOpeningSimulator.tsx) for revealed card display. This provides automatic fallback to placeholder SVG when external card images fail to load, loading skeleton while images load, and consistent error handling. Ensures pack opening experience doesn't break when card images fail to load. Added comprehensive test suite (7 tests) covering component rendering, sealed pack view, packs remaining display, close functionality, and card image error handling. All tests pass, ESLint and Prettier clean. Commit: d1ed9e4

- **2026-01-17**: Added error handling to CollectionView card images - Replaced 2 raw Next.js Image components with CardImage component in CollectionView (src/components/collection/CollectionView.tsx) for both the "Most Valuable Cards" section and the main card grid. This provides automatic fallback to placeholder SVG when external card images fail to load, loading skeleton while images load, and consistent error handling across the collection view. Added comprehensive test suite (4 tests) covering CardImage usage verification, fill mode rendering, empty collection state, and quantity badge display. All tests pass, ESLint and Prettier clean. Commit: bcacd93

- **2026-01-17**: Added error handling to JustPulledMode card images - Replaced 2 raw Next.js Image components with CardImage component in JustPulledMode (src/components/collection/JustPulledMode.tsx) for both the AddedCard animation component and the main card grid. This provides automatic fallback to placeholder SVG when external card images fail to load, loading skeleton while images load, and consistent error handling. Maintains the celebration UX even when card images fail to load during pack opening sessions. ESLint and Prettier clean. Commit: 79ae338

- **2026-01-17**: Added React.memo() to ActivityFeed component - Wrapped ActivityFeed, ActivityItem, and ActivityFeedSkeleton components with React.memo to prevent unnecessary re-renders when parent components update but props haven't changed. This optimization improves performance on the dashboard and collection pages where the activity feed is displayed. Added test suite verifying memo wrapping. ESLint and Prettier clean. Commit: 49a586a

- **2026-01-17**: Lazy loaded GradeLikeAProGame with React.lazy() - Updated src/app/learn/page.tsx to use dynamic import for GradeLikeAProGame component. Wrapped in Suspense boundary with GradeLikeAProGameSkeleton as fallback for smooth loading experience. Added GradeLikeAProGameSkeleton component to GradeLikeAProGame.tsx that mimics the intro screen layout with shimmer placeholders. This improves initial page load by deferring game bundle until user clicks to open the game. Commit: e49178d

- **2026-01-17**: Added loading="lazy" to CardGrid card images - Added `loading` prop to CardImage component (src/components/ui/CardImage.tsx) with "lazy" as default value. Updated CardImage to pass loading prop to Next.js Image component (set to undefined when priority is true to let Next.js handle it). Explicitly passed `loading="lazy"` to CardImage in CardGrid (src/components/collection/CardGrid.tsx) to defer offscreen image loading for better initial page performance. This optimization reduces bandwidth and improves Time to Interactive by only loading card images when they enter the viewport. Commit: 9da4809
- **2026-01-17**: Added loading="lazy" to VirtualCardGrid card images - Explicitly set `loading="lazy"` on CardImage component in VirtualCardGrid (src/components/collection/VirtualCardGrid.tsx) to defer offscreen image loading for improved performance. While the CardImage component defaults to lazy loading, making it explicit improves code clarity and documents the intent. All 48 VirtualCardGrid tests pass, ESLint and Prettier clean. Commit: 380854f

- **2026-01-17**: Added loading="lazy" to CollectionView card images - Added explicit `loading="lazy"` prop to both CardImage components in CollectionView (src/components/collection/CollectionView.tsx) for the Most Valuable Cards section and main collection grid. Added test to verify lazy loading is applied for performance optimization. This defers loading of offscreen card images, improving initial page load time for collections with many cards. Commit: 1205700

- **2026-01-17**: Completed CRITICAL redirect for logged-in users from landing page to dashboard - Converted src/app/page.tsx from server component to client component to enable auth hooks. Added useConvexAuth and useRouter hooks to check authentication status and redirect authenticated users to /dashboard immediately. Shows loading spinner while checking auth state, returns null during redirect to prevent flash of landing content. Updated LandingPage.test.tsx with mocks for convex/react and next/navigation, added 3 new tests covering loading state, redirect behavior, and unauthenticated content display. All 29 landing page tests pass. ESLint and Prettier clean. Commit: f78b53c

- **2026-01-17**: Completed Create PageHeader component - Created reusable PageHeader component (src/components/ui/PageHeader.tsx) for consistent page header styling across the application. Features: title and optional description text, optional Heroicon with gradient background, 9 pre-built gradient presets (default, amber, purple, indigo, orange, emerald, rose, cyan, slate), customGradient prop for custom gradient classes, optional actions slot for buttons/controls on the right side, compact and default size variants, PageHeaderSkeleton for loading states, full accessibility support with proper ARIA attributes (aria-hidden on icons), responsive sizing for mobile and desktop (h-12/h-14 icon box, text-2xl/text-3xl title), dark mode support (dark:text-white, dark:text-slate-400). Added comprehensive test suite (23 tests) covering all props, gradient presets, size variants, skeleton component, and accessibility requirements. ESLint and Prettier clean. Commit: b1ba956

- **2026-01-17**: Created AppFooter component for authenticated pages - Added `src/components/layout/AppFooter.tsx` with navigation links to Help, Privacy Policy, Terms of Service, and Contact using Heroicons (QuestionMarkCircleIcon, ShieldCheckIcon, DocumentTextIcon, EnvelopeIcon). Features: full dark mode support, responsive layout (stacked on mobile, horizontal on desktop), proper accessibility with contentinfo role and aria-label on nav, copyright notice with dynamic year, and TCG company trademark disclaimer. Added comprehensive test suite (19 tests) covering structure, links, icons, accessibility, and responsive behavior. ESLint and Prettier clean. Commit: 0f2e7c6

- **2026-01-17**: Added AppFooter to layout.tsx for authenticated pages - Created AuthAwareFooter component (src/components/layout/AuthAwareFooter.tsx) following the same pattern as AuthAwareHeader. Uses useConvexAuth hook to conditionally render AppFooter only for authenticated users. Updated root layout.tsx to include AuthAwareFooter after main content, wrapped in a flex container with min-h-screen to ensure footer stays at bottom. Added comprehensive test suite (7 tests) covering loading state, unauthenticated state, and authenticated state behavior. ESLint and Prettier clean.

- **2026-01-17**: Created /privacy page stub - Added placeholder privacy policy page at src/app/privacy/page.tsx with kid-friendly, COPPA-focused content. Features: COPPA compliance section with emerald gradient highlighting family-focused design; Information We Collect section (account, profile, collection, usage data); How We Use Your Information section; "What We Don't Do" section in rose gradient (no selling data, no ads, no sharing, no sending children's info to AI); Data Retention & Deletion section; Contact section with email link. Uses Heroicons (ShieldCheckIcon, UserGroupIcon, LockClosedIcon, EyeSlashIcon, TrashIcon, EnvelopeIcon, ArrowLeftIcon). Full dark mode support and accessible focus states. Includes disclaimer noting this is a placeholder to be replaced with legal-reviewed policy. ESLint and Prettier clean. Commit: 24ee127

- **2026-01-17**: Added useMemo to CollectionView set grouping logic - Wrapped the expensive set grouping computation in useMemo to cache results and prevent recalculating grouping, sorting, and map creation on every render. Now only recalculates when collection or cardData changes. Also fixed CollectionView test mock to wrap card data in { data: mockCards } to match API response structure. All 5 CollectionView tests pass. ESLint and Prettier clean. Commit: 47d112d

- **2026-01-17**: Added ESC key handler to close mobile menus - Added keyboard accessibility to AppHeader and MarketingHeader by closing mobile menu on Escape key press. Also closes profile menu and quick settings popover in AppHeader when Escape is pressed. Uses useEffect with keydown listener and useCallback for stable handler reference. Added 4 tests covering ESC key behavior (3 for AppHeader: mobile menu, profile menu, quick settings; 1 for MarketingHeader: mobile menu). All new tests pass, ESLint and Prettier clean. Commit: d154bae

- **2026-01-17**: Added back navigation and page header to /learn page - Users could previously get stuck on the Learn page without a way to return. Added back link to dashboard at top of page following the same pattern as settings page (ArrowLeftIcon, consistent styling with hover:text-kid-primary, dark mode support). Added page header with AcademicCapIcon in purple/indigo gradient, "Learn to Collect" title, and "Guides and mini-games to become a card expert" subtitle. Added comprehensive test suite (13 tests) covering back navigation, page header, page content, and accessibility. All tests pass, ESLint and Prettier clean. Commit: d7302c2

- **2026-01-17**: Protected /dashboard route with auth redirect - Updated src/app/dashboard/page.tsx to redirect unauthenticated users to /login automatically. Uses useConvexAuth hook to check authentication state, redirects via useEffect when not authenticated. Also redirects users without a profile to /onboarding for initial setup. Shows loading spinner while checking auth status. Added comprehensive test suite (11 tests) covering authentication protection, profile loading states, and authenticated behavior. All dashboard tests pass, ESLint and Prettier clean. Commit: 2a2eae1

- **2026-01-17**: Protected /collection route with auth redirect - Updated src/app/collection/page.tsx to redirect unauthenticated users to /login automatically. Uses useConvexAuth hook to check authentication state, redirects via useEffect when not authenticated. Shows loading spinner while checking auth status. Added comprehensive test suite (11 tests) covering authentication protection, loading states, empty collection state, and authenticated behavior. All collection page tests pass, ESLint and Prettier clean. Commit: 65916f2

- **2026-01-17**: Protected /streak route with auth redirect - Updated src/app/streak/page.tsx to redirect unauthenticated users to /login automatically. Uses useConvexAuth hook to check authentication state, useRouter for navigation, and useEffect for redirect logic. Shows loading spinner with orange theme while checking auth status. Changed "No profile" state from sign-in prompt to "Profile Not Found" message directing to dashboard. Removed unused HomeIcon and ShieldCheckIcon imports. Added comprehensive test suite (13 tests) covering authentication protection, loading states, profile loading, authenticated behavior, and no-profile edge case. All streak page tests pass, ESLint and Prettier clean. Commit: 32515ea

- **2026-01-17**: Completed Protect /settings route task - Added authentication protection to `/settings` page to redirect unauthenticated users to `/login`. Updated `src/app/settings/page.tsx` to use `useConvexAuth` hook for auth state checking, `useRouter` for navigation, and `useEffect` for redirect logic. Added loading spinner with slate gradient theme matching the page styling. Follows same pattern as other protected routes (`/dashboard`, `/collection`, `/my-wishlist`, `/badges`, `/streak`). Commit: 97c3bff
- **2026-01-17**: Completed Add breadcrumb to /sets/[setId] task - Added breadcrumb navigation to set detail page showing "Home > Browse Sets > [Set Name]". Replaced the previous "Back to Sets" link with the reusable Breadcrumb component. Uses existing Breadcrumb component from src/components/ui/Breadcrumb.tsx with HomeIcon, proper navigation hierarchy, and current page indication. Commit: 5fcc42e
- **2026-01-17**: Completed Standardize back link styling task - Replaced inconsistent inline back link implementations with the reusable BackLink component across 10 pages for consistent styling, accessibility, and dark mode support. Pages updated: /learn, /my-wishlist, /badges, /profile, /timeline, /compare, /browse, /parent-dashboard (2 instances), /terms, /privacy. All back links now use consistent gap-1.5, text-sm font-medium styling, text-gray-600 with hover:text-kid-primary, dark mode support (dark:text-slate-400), and focus-visible accessibility states. BackLink tests pass (28 tests). ESLint clean. Commit: b0b6a4f
- **2026-01-17**: Completed Update settings game toggle task - Removed unsupported games (Digimon, Dragon Ball, MTG) from GameSettingsToggle component. Changes: removed unused imports for DigimonIcon, DragonBallIcon, MtgIcon from @/components/icons/tcg; removed dragonball, digimon, mtg entries from ICON_COMPONENTS mapping; updated skeleton to show 4 game card placeholders instead of 7; added comment documenting the 4 supported games (Pokemon, Yu-Gi-Oh!, One Piece, Disney Lorcana). Updated test file to reflect only 4 supported games: updated mock getAllGames to return only 4 games (replaced MTG with One Piece and Lorcana), updated mock icons to only include 4 supported games, changed skeleton test expectation from 7 to 4 cards, replaced MTG references in accessibility tests with One Piece and Lorcana. All 25 GameSettingsToggle tests pass. ESLint and Prettier clean.

---

## NEW - SEO & Marketing Tasks (January 17, 2026 Evaluation)

These tasks address critical SEO gaps identified during the comprehensive site evaluation.

### Meta Tags & Social Sharing

- [ ] Add unique meta descriptions to all pages - Each page needs descriptive 150-160 character meta description
- [ ] Add Open Graph tags to layout.tsx - og:title, og:description, og:image, og:url for social previews
- [ ] Add Twitter Card meta tags - twitter:card, twitter:title, twitter:description, twitter:image
- [ ] Create og:image social preview graphic - 1200x630px branded image for link shares
- [ ] Add page-specific title tags - Each page should have unique, descriptive title (e.g., "Browse Pokemon Sets | CardDex")
- [ ] Add canonical URL tags - Prevent duplicate content issues

### Sitemap & Robots

- [ ] Create public/sitemap.xml - List all public routes for search engine discovery
- [ ] Create public/robots.txt - Allow crawling of public pages, disallow /api and auth routes
- [ ] Add sitemap generation script - Auto-generate sitemap on build

### Structured Data

- [ ] Add JSON-LD SoftwareApplication schema to landing page - Rich results for app searches
- [ ] Add JSON-LD FAQPage schema to FAQ section - Rich results for FAQ searches
- [ ] Add JSON-LD BreadcrumbList schema to detail pages - Breadcrumb rich results

---

## NEW - Architecture Improvements (January 17, 2026 Evaluation)

### Provider Optimization

- [ ] Create ProviderComposer component - Reduce 20+ nested providers to single compose pattern
- [ ] Move non-essential providers to lazy load - Load gamification/celebration providers on demand
- [ ] Extract game-specific providers - Only load game providers when that game is selected

### Error Boundaries

- [x] Add error boundary to /collection route - Prevent collection errors from crashing app
- [ ] Add error boundary to /sets/[setId] route - Prevent set detail errors from crashing app
- [ ] Add error boundary to /dashboard route - Prevent dashboard errors from crashing app
- [ ] Create user-friendly error fallback UI - Show helpful message with retry button and home link

### Code Splitting

- [x] Lazy load GradeLikeAProGame - Use React.lazy() and Suspense
- [ ] Lazy load RarityGuessingGame - Use React.lazy() and Suspense
- [ ] Lazy load SetSymbolMatchingGame - Use React.lazy() and Suspense
- [ ] Lazy load PokemonTypeQuiz - Use React.lazy() and Suspense
- [ ] Lazy load PriceEstimationGame - Use React.lazy() and Suspense
- [ ] Create GameLoader component - Shared Suspense fallback for all mini-games

---

## NEW - Parent Notification System UI (Moved from tasks-backend.md)

These are UI components for the notification system. Backend schema and queries are already complete.

### In-App Notifications UI

- [ ] Build notification bell component for parent dashboard - Show unread count, dropdown list of recent notifications
- [ ] Create notification preferences UI - Toggle which notifications to receive (achievements, milestones, streaks, daily summaries)
- [ ] Add notification toast component - Pop-up notifications for real-time alerts

---

## NEW - Security Hardening (January 17, 2026 Evaluation)

### Content Security Policy

- [ ] Add CSP headers to next.config.js - Restrict script sources, prevent XSS
- [ ] Configure CSP for external images - Allow pokemon card API images
- [ ] Configure CSP for Convex - Allow Convex API calls

### External Resource Integrity

- [ ] Extract hardcoded Pokemon API URLs to config file - Centralize 50+ card image URLs
- [ ] Add retry logic for failed external images - Attempt reload before showing fallback
- [ ] Add monitoring for external image failures - Log/track broken image URLs

---

## NEW - Kid-Friendly Set Display (January 17, 2026 Evaluation)

These tasks ensure the UI only shows sets that kids can actually buy and collect.

### Set Availability Indicators

- [ ] Add availability badge to set cards - Show "In Print ✅", "Limited ⚠️", or "Vintage 📦" status
- [ ] Color-code set cards by availability - Green border for current, yellow for limited, gray for vintage
- [ ] Add "Where to Buy" tooltip for in-print sets - Links to Target, Walmart, GameStop, local shops

### Vintage Sets Section

- [ ] Create "Vintage Sets" collapsed section - Grayed out section at bottom of sets list
- [ ] Add "These sets are no longer in stores" message - Kid-friendly explanation
- [ ] Add "Ask a parent if you have cards from these!" prompt - Encourages family involvement
- [ ] Make vintage sets view-only - Can view cards but not track (or require parent unlock)

### MTG Removal from UI

- [x] Remove 'mtg' from `GAMES` array in gameSelector.ts (DONE - already removed)
- [x] Remove 'mtg' from `GAME_CONFIGS` in tcg-api.ts (DONE - already removed)
- [x] Update game count on landing page - Now says "4 trading card games" (DONE)
- [x] Remove MTG from game picker/selector UI (DONE - GameSwitcher.tsx updated)
- [x] Delete mtg-api.ts (or archive to /deprecated folder) (N/A - file doesn't exist)

### Set Filtering UI

- [ ] Add "Show all sets" toggle for parents - Hidden by default, reveals vintage sets
- [ ] Add set count showing "X sets available to collect" - Only count in-print sets
- [ ] Sort sets by availability then release date - Current sets first, then limited, then vintage

### Pokemon-Specific Updates

- [ ] Update POKEMON_SERIES constant - Add 'Mega Evolution' era, keep 'Scarlet & Violet'
- [ ] Filter out Sword & Shield sets by default - Too old for retail
- [ ] Add "Mega Evolution Era" badge to newest sets - Highlight what's hot

---

## Trade Logging UI

Simple UI for kids to log real-life trades. See PRD "Trade Logging System" section for complete specification.

### Log Trade Modal

- [ ] TRADE-UI-001: Create `src/components/trades/LogTradeModal.tsx` - Modal with two card pickers (gave/received), optional trading partner name input, and submit button
- [ ] TRADE-UI-002: Create `src/components/trades/CardPickerFromCollection.tsx` - Card picker that shows user's owned cards with quantity selector for "cards I gave"
- [ ] TRADE-UI-003: Create `src/components/trades/CardPickerSearch.tsx` - Card search/browse picker for "cards I received" (cards they don't own yet)
- [ ] TRADE-UI-004: Create `src/components/trades/TradeSummaryPreview.tsx` - Preview showing "Gave X → Got Y" before submitting

### Entry Points

- [ ] TRADE-UI-005: Add "Log a Trade" button to collection page header - Primary entry point for trade logging
- [ ] TRADE-UI-006: Add "Log a Trade" quick action to timeline page - Secondary entry point
- [ ] TRADE-UI-007: Add "I traded this card" option to card detail view - Context-specific entry when viewing owned card

### Trade in Timeline

- [ ] TRADE-UI-008: Create `src/components/collection/TradeTimelineEvent.tsx` - Trade-specific timeline entry showing cards given/received and trading partner
- [ ] TRADE-UI-009: Update `CollectionTimeline.tsx` to display `trade_logged` events - Render trade events with card thumbnails
- [ ] TRADE-UI-010: Add trade icon (ArrowsRightLeftIcon) for trade events in timeline

### Empty States & Feedback

- [ ] TRADE-UI-011: Add success toast after logging trade - "Trade logged! Your collection has been updated."
- [ ] TRADE-UI-012: Add validation feedback in modal - Show errors for empty trade, insufficient quantity, etc.

---

## LOW PRIORITY - Mobile UX Evaluation (January 17, 2026)

> ⏳ **Do AFTER core features are complete** - These are polish items, not launch blockers.

Comprehensive mobile-first evaluation to ensure the app works well on phones and tablets where kids primarily use it.

### Touch Target Audit

- [ ] Audit all buttons for minimum 44x44px touch targets - iOS Human Interface Guidelines requirement
- [ ] Check card grid tap targets on small screens (iPhone SE, small Androids) - Cards may be too small to tap accurately
- [ ] Test quantity +/- buttons on mobile - May be too close together
- [ ] Test wishlist star button size - Small icons hard to tap
- [ ] Test back/navigation buttons - Ensure thumb-reachable on large phones

### Gesture Support

- [ ] Evaluate swipe gestures for card browsing - Kids expect swipe-to-navigate
- [ ] Add pull-to-refresh on collection/wishlist pages - Standard mobile pattern
- [ ] Test pinch-to-zoom on card images - Kids want to see card details
- [ ] Evaluate swipe-to-delete/remove patterns - Easier than tap-hold-confirm

### Mobile Layout Issues

- [ ] Test all pages in portrait AND landscape orientation - Some pages may break
- [ ] Check for horizontal scroll issues on set grids - Content shouldn't overflow
- [ ] Test modal/popup sizing on small screens - May cover entire screen poorly
- [ ] Evaluate bottom navigation vs hamburger menu - Bottom nav better for kids
- [ ] Test keyboard behavior on search/input fields - Ensure content doesn't get hidden

### Performance on Mobile

- [ ] Test load times on 4G/LTE connection - Target <3 seconds
- [ ] Test on older devices (iPhone 8, budget Androids) - Kids often have hand-me-down phones
- [ ] Evaluate memory usage on card-heavy pages - May crash on low-RAM devices
- [ ] Test image loading on slow connections - Need progressive loading or placeholders

### Mobile-Specific Features

- [ ] Evaluate "Add to Home Screen" prompt - PWA installation flow
- [ ] Test offline mode on mobile - Collection should be viewable without internet
- [ ] Check notification permissions flow - Don't ask immediately on first load
- [ ] Test share functionality - Native share sheet vs custom modal

---

## LOW PRIORITY - Gamification Evaluation (January 17, 2026)

> ⏳ **Do AFTER launch** - Strategic review to ensure gamification serves collectors, not just engagement metrics. Not a launch blocker.

Critical evaluation of ALL gamification features to ensure they make sense for REAL collectors, not just engagement metrics.

### Pack Opening Simulator - NEEDS REVIEW

- [ ] **EVALUATE: Remove or repurpose Pack Opening Simulator** - Why would a real collector want to open fake digital packs? This doesn't help track a real collection.
- [ ] If keeping: Rename to "Pack Probability Calculator" - Show odds of pulling cards you need
- [ ] If keeping: Connect to wishlist - "Here's what you might get if you buy X pack"
- [ ] If keeping: Add educational angle - Teach kids about probability/statistics
- [ ] Alternative: Convert to "What's in this Set?" feature - Preview set contents before buying
- [ ] **DECISION NEEDED**: Does this feature add value or is it just empty gamification?

### Achievement System - Evaluate Value

- [ ] Review all 37 badges - Do they reward COLLECTING or just app engagement?
- [ ] Identify badges that encourage real collecting behavior (good):
  - Set completion badges ✅ (rewards actual collecting)
  - Type specialist badges ✅ (rewards themed collecting)
  - First card badges ✅ (celebrates real milestones)
- [ ] Identify badges that are just engagement hacks (questionable):
  - Streak badges ⚠️ (rewards daily login, not collecting)
  - "Add X cards in a session" ⚠️ (rewards data entry speed)
- [ ] Consider removing pure engagement badges - Focus on collection achievements

### Streak System - Evaluate Necessity

- [ ] **QUESTION**: Should streaks reset if kid doesn't ADD cards, or just if they don't OPEN the app?
- [ ] Current: Streak resets after 48 hours of no activity - Too punishing for casual collectors
- [ ] Consider: Only count days when cards are ADDED - Rewards actual collecting
- [ ] Consider: Remove streaks entirely - They may cause unhealthy app checking behavior
- [ ] If keeping: Add "grace days" for vacations/breaks - Already implemented, verify it works
- [ ] If keeping: Max streak reward at 30 days - Don't incentivize infinite streaking

### XP/Level System - Evaluate Purpose

- [ ] What does leveling up DO for the user? - If nothing, remove it
- [ ] XP for adding cards makes sense - Rewards collecting
- [ ] XP for daily login is engagement hacking - Remove or reduce
- [ ] Consider: Tie levels to unlocking avatar items - Tangible reward
- [ ] Consider: Remove levels if they don't unlock anything meaningful

### Celebration Animations - Evaluate Kid Experience

- [ ] Are celebrations too frequent? - May become annoying/dismissable
- [ ] Are celebrations too long? - Kids may want to get back to browsing
- [ ] Test with real kids (or parent feedback) - Do they like or skip celebrations?
- [ ] Consider: Add "Skip" button to all celebrations
- [ ] Consider: Reduce celebration frequency in Settings (Low-Stimulation Mode)

### Virtual Features - Evaluate Relevance

- [ ] **Digital Binder** - Good: Visualizes collection. Keep.
- [ ] **Trophy Room** - Good: Shows achievements. Keep.
- [ ] **Adventure Map** - Questionable: Does unlocking regions help track cards? Evaluate.
- [ ] **Collector's Journey Story** - Questionable: Is narrative content relevant to collecting? Evaluate.
- [ ] **Pack Opening Simulator** - Problematic: See above. Likely remove.

### Gamification Philosophy Check

- [ ] Create "Gamification Audit" document - List every gamified element
- [ ] For each element, answer: "Does this help kids COLLECT or just use the app?"
- [ ] Remove elements that don't serve the core mission
- [ ] Ensure gamification enhances, not replaces, the collecting experience

- **2026-01-17**: Completed Line 185 landing page multi-TCG update - Changed "Pick Your Sets" Step 1 description from "Browse through all Pokemon card sets and choose which ones you want to track" to "Browse sets from Pokemon, Yu-Gi-Oh!, Lorcana, and more to track your favorites" in `src/app/page.tsx`. This makes the landing page more inclusive of all supported TCGs instead of only mentioning Pokemon. Landing page tests pass (29 tests). ESLint and Prettier clean. Commit: 8b64aa8

- **2026-01-17**: Completed Line 141 Update GameFilter.tsx task - Removed unsupported games (digimon, dragonball, mtg) from `gameSelector.ts`. Updated GameId type from 7 games to 4 games (pokemon, yugioh, onepiece, lorcana). Removed game configurations from GAMES array and CSS variables from GAME_CSS_VARIABLES. Updated 5 test files to reflect the 4-game configuration: gameSelector.test.ts, games.test.ts, GameFilter.test.tsx, GameThemeProvider.test.tsx. All 160 game-related tests pass. ESLint and Prettier clean. Commit: ac8adcb

- **2026-01-17**: Completed Add onError handlers to SearchResults card images task - Replaced raw Next.js Image component with CardImage component (src/components/ui/CardImage.tsx) in SearchResults (src/components/search/SearchResults.tsx). This provides automatic fallback to placeholder SVG when external card images fail to load, loading skeleton while images load, and consistent error handling across search results. Created comprehensive test suite (src/components/search/__tests__/SearchResults.test.tsx) with 6 tests covering card rendering, empty state, loading state, error handling, and accessibility. All tests pass, ESLint and Prettier clean. Commit: c53aab3

- **2026-01-17**: Completed Update GameSwitcher.tsx task - Removed unsupported games (DragonBall, Digimon, MTG) from the game switcher dropdown component (src/components/header/GameSwitcher.tsx). Removed imports for DragonBallIcon, DigimonIcon, and MtgIcon. Updated ICON_COMPONENTS record to only include the 4 supported games: Pokemon, Yu-Gi-Oh!, One Piece, and Lorcana. The GenericTcgIcon fallback remains for any unknown game IDs. ESLint and Prettier clean, no test failures related to this change. Commit: 3d6b18a

- **2026-01-17**: Completed FIX: Welcome message shows email instead of name - Fixed KidDashboard.tsx welcome greeting to properly display profile name instead of email prefix. Created displayName utility library (src/lib/displayName.ts) with two helper functions: looksLikeEmailPrefix() detects email-like display names (lowercase with numbers like "john123"), getDisplayName() provides fallback chain: 1) database displayName if valid, 2) onboarding profile name from localStorage, 3) "Collector" fallback. Updated KidDashboard.tsx to import getDisplayName helper instead of using raw database value. Added 24 unit tests (src/lib/__tests__/displayName.test.ts) covering email prefix detection, fallback logic, onboarding integration, error handling, and priority order. All tests pass (55 tests for changed files), ESLint and Prettier clean.

- **2026-01-17**: Completed FIX: Recent Activity missing set name - Dashboard Recent Activity now shows which set cards were added from. Updated four Convex activity queries to enrich setName from cachedCards/cachedSets when metadata is missing: getRecentActivityWithNames, getRecentActivityWithNamesPaginated, getFamilyActivityWithNames, getFamilyActivityPaginated. The queries now: 1) collect cardIds needing enrichment (missing cardName OR setName), 2) fetch card info (name + setId) from cachedCards, 3) collect unique setIds, 4) fetch set names from cachedSets via by_set_id index, 5) enrich both cardName and setName in activity metadata. ActivityFeed UI already supported displaying setName via formatActivityDescription() - the fix was in the backend data enrichment. Handles legacy activity logs that were created before setName was passed to addCard mutation. TypeScript compiles clean, ESLint and Prettier clean.
- **2026-01-17**: Completed Update onboarding game selector task - Removed unsupported games (Digimon, Dragon Ball, MTG) from the onboarding game selector component (src/components/onboarding/GameSelectorOnboarding.tsx). Removed imports for DragonBallIcon, DigimonIcon, MtgIcon, and unused GAME_ICONS. Updated ICON_COMPONENTS record to only include the 4 supported games: Pokemon, Yu-Gi-Oh!, One Piece, and Lorcana. Updated skeleton to show 4 placeholder cards instead of 7. Added JSDoc comment documenting supported games. Created comprehensive test suite (src/components/onboarding/__tests__/GameSelectorOnboarding.test.tsx) with 27 tests covering: skeleton rendering (4 cards), supported games display, unsupported games exclusion, game selection/toggle, primary game setting, navigation, accessibility. All tests pass, ESLint and Prettier clean. Commit: 1f929ca
