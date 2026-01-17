# PRODUCT REQUIREMENTS DOCUMENT

# KidCollect
## The Family-Friendly Pokemon Collection Companion

**Version:** 1.0
**Date:** January 2026
**Status:** CONFIDENTIAL

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Target Users](#target-users)
4. [Product Vision](#product-vision)
5. [Key Differentiators](#key-differentiators)
6. [MVP Features](#mvp-features-version-10)
7. [User Stories](#user-stories)
8. [Technical Requirements](#technical-requirements)
9. [Monetization Strategy](#monetization-strategy)
10. [Success Metrics](#success-metrics)
11. [Risks and Mitigations](#risks-and-mitigations)
12. [Development Timeline](#development-timeline)
13. [Conclusion](#conclusion)

---

## Executive Summary

KidCollect is a mobile and web application designed specifically for children ages 6-14 and their families to track, organize, and celebrate their Pokemon card collections. Unlike existing collector apps that target adult investors with complex interfaces and financial metrics, KidCollect emphasizes discovery, achievement, and learning—turning card collecting into an engaging, educational experience.

The Pokemon TCG market exceeds $6.5 billion globally, growing 7-11% annually. Despite this, no dedicated app exists for the hobby's largest demographic: kids. Parents seeking to help children organize collections find only adult-oriented tools with investment terminology, intrusive ads, and interfaces designed for serious collectors.

KidCollect addresses this gap with a freemium model targeting family subscriptions at $4.99/month. Conservative projections estimate 50,000 active users within 18 months, generating $150K+ ARR with minimal operational costs.

---

## Problem Statement

### The Market Gap

Every existing Pokemon card collection app is designed for adult collectors. Research across Reddit, app store reviews, and collector forums reveals consistent complaints from parents:

| Problem | Impact |
|---------|--------|
| **Inappropriate interfaces** | Investment-focused features, portfolio valuations, and financial terminology confuse children and distract from the joy of collecting |
| **Intrusive advertising** | Free tiers bombard users with full-screen ads every 15 seconds (Pokellector), making apps frustrating for young users |
| **No parental controls** | Parents cannot monitor what children add, set limits, or guide the collecting experience |
| **Complexity over simplicity** | Scanner-first interfaces, variant tracking, and condition grading overwhelm beginners |
| **No educational content** | Apps track cards but don't teach organization, care, or the hobby itself |

> *"Parents constantly ask me for an app to recommend for their kids. I tell them about Collectr, but it's really not designed for children. There's nothing out there for them."*
> — TCG Store Manager, Research Interview

### Why This Matters Now

- **Pokemon TCG is experiencing sustained growth:** New sets release quarterly, maintaining engagement. The Scarlet & Violet era has introduced millions of new collectors.
- **Kids drive household purchases:** A child engaged in collecting influences $200-500+ annually in family TCG spending.
- **Official app discontinued:** The Pokemon TCG Card Dex app was sunset in September 2023, leaving no first-party solution.
- **Parents value screen time quality:** Apps that combine entertainment with learning command premium pricing in the family app market.

---

## Target Users

### Primary: Children (Ages 6-14)

Young collectors who are building their first collections and want to organize, track, and show off their cards.

**Characteristics:**
- Own between 50-500 cards, typically across 2-5 recent sets
- Care about completing sets, finding favorite Pokemon, and showing friends
- Limited patience for complex interfaces; need immediate gratification
- May or may not play the actual TCG competitively
- Respond strongly to achievements, badges, and visual progress indicators

**Jobs to be Done:**
- Know what cards I have without digging through binders
- See how close I am to completing a set
- Find out which cards I still need
- Show my collection to friends and family
- Feel proud of what I've collected

### Secondary: Parents

Adults (typically 30-45) who purchase cards for their children and want to support the hobby without getting deeply involved themselves.

**Characteristics:**
- May have collected Pokemon cards themselves in the late 1990s (nostalgia connection)
- Want to bond with children over a shared interest
- Concerned about appropriate content and screen time quality
- Budget-conscious but willing to pay for educational/enriching apps
- Appreciate visibility into children's activities

**Jobs to be Done:**
- Know what cards my child already owns before buying more
- Help my child stay organized without doing all the work
- Ensure screen time is appropriate and enriching
- Avoid duplicate card purchases
- Support my child's hobby without becoming an expert myself

---

## Product Vision

### Vision Statement

> KidCollect transforms Pokemon card collecting from a scattered pile of cards into an organized, rewarding journey that kids are proud to share and parents are happy to support.

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Joy over value** | We celebrate the excitement of collecting, not the financial worth of cards. No price displays, no portfolio values, no investment language. |
| **Simplicity over features** | A 7-year-old should be able to use the app without help. Every feature must pass the "can a kid figure this out in 10 seconds?" test. |
| **Progress over perfection** | Emphasis on what kids HAVE collected, not what's missing. Every session should feel like progress. |
| **Family first** | Features that bring families together, not isolate children on screens. Sharing, collaboration, and parental involvement are encouraged. |
| **Learning embedded** | Teach collecting fundamentals (organization, card care, set structure) without feeling like homework. |

---

## Key Differentiators

### Competitive Landscape

| Feature | KidCollect | Pokellector | Collectr | TCG Hub |
|---------|------------|-------------|----------|---------|
| **Designed for kids (ages 6-14)** | Yes | No | No | No |
| **Ad-free experience** | Yes (Premium) | No (ads every 15s) | Limited | Limited |
| **Achievement/badge system** | Yes | No | No | No |
| **Parental dashboard** | Yes | No | No | No |
| **Multiple child profiles** | Yes | No | No | No |
| **Shareable wishlist** | Yes | No | Partial | Partial |
| **Price/investment focus** | No (hidden from kids) | Yes | Yes | Yes |
| **Duplicate finder for siblings** | Yes | No | No | No |
| **COPPA compliant by design** | Yes | Unknown | Unknown | Unknown |
| **Card scanning** | Phase 2 | Yes | Yes | Yes |

### Why KidCollect Wins

1. **Kid-First UX**: Large tap targets, colorful progress bars, celebration animations. Competitors optimize for data density; we optimize for delight.

2. **Family Accounts**: One subscription covers multiple children. Competitors require separate accounts per user with no family management.

3. **Achievement System**: Gamification that rewards collecting milestones. Competitors track cards but don't celebrate progress.

4. **No Financial Anxiety**: Kids see fun stats ("You have 3 Pikachu cards!"), not market values. Parents can optionally view pricing data in their dashboard.

5. **Wishlist Sharing**: Grandma can see exactly what cards to buy for birthdays. Competitors bury wishlist features or don't offer them.

---

## MVP Features (Version 1.0)

### 1. Collection Tracking

**Core functionality:** Add cards to your collection by browsing sets and tapping cards you own.

| Feature | Description |
|---------|-------------|
| Set browser | Visual grid of all cards in a set with owned cards highlighted. Large, tap-friendly card images. |
| Progress indicators | "42 of 198 collected" with progress bar. Percentage completion shown prominently. |
| "My Collection" view | See all owned cards across all sets in one scrollable gallery. |
| Quantity tracking | Support for multiple copies ("I have 3 of these!") with simple +/- controls. |

### 2. Achievement System

| Achievement Type | Examples |
|------------------|----------|
| Set completion badges | Earn a badge when completing 25%, 50%, 75%, and 100% of any set |
| Collector milestones | "First 10 cards!" "First 100 cards!" "First complete set!" |
| Pokemon-themed badges | "Pikachu Fan" (own 5+ Pikachu cards), "Dragon Trainer" (own 10+ Dragon types) |
| Streak rewards | Add cards 3 days in a row, 7 days in a row, etc. |
| Trophy case | Dedicated screen showing all earned achievements with dates earned |

### 3. Wishlist

| Feature | Description |
|---------|-------------|
| Want list | Mark cards as "wanted" to create a shareable wishlist |
| Shareable link | Generate a link parents/grandparents can view to see what cards to buy |
| Priority marking | Star favorite wanted cards to indicate high priority |

### 4. Family Features

| Feature | Description |
|---------|-------------|
| Parent dashboard | Separate parent login that shows collection overview, recent activity, and optional pricing data |
| Multiple child profiles | Support 2-4 child profiles per family subscription |
| Duplicate finder | Shows cards owned by multiple children ("Sarah and Jake both have this Charizard—trade opportunity!") |
| Export/print | Generate printable checklist PDFs for sets in progress |

### 5. Data Scope (MVP)

**Sets Included:** English-language Scarlet & Violet era sets (12 main sets + special sets)

| Set Name | Release Date | Card Count |
|----------|--------------|------------|
| Scarlet & Violet (Base) | March 2023 | 198 |
| Paldea Evolved | June 2023 | 193 |
| Obsidian Flames | August 2023 | 197 |
| 151 | September 2023 | 207 |
| Paradox Rift | November 2023 | 182 |
| Paldean Fates | January 2024 | 245 |
| Temporal Forces | March 2024 | 218 |
| Twilight Masquerade | May 2024 | 167 |
| Shrouding Flames | August 2024 | 175 |
| Stellar Crown | September 2024 | 175 |
| Surging Sparks | November 2024 | 191 |
| Prismatic Evolutions | January 2025 | 180 |

**Card Variants:** Regular, reverse holo, and full art variants. No graded cards, no 1st editions, no Japanese cards.

**Rationale:** Focused scope reduces complexity for kids and development effort. Covers 90%+ of what new collectors own. Expand based on user demand.

---

## Future Features (Post-MVP)

### Version 1.1: Scanner & Social

- **Optional card scanner:** Camera-based card recognition for faster entry. Positioned as "advanced mode" for experienced users.
- **Friend collections:** Add friends (with parental approval) and see their collections. Enable trade planning.
- **Collection sharing:** Public profile page (optional) showing collection stats and achievements.

### Version 1.2: Education & Expansion

- **"Learn to Collect" tutorials:** Interactive guides teaching card organization, binder setup, and card care.
- **Expanded sets:** Add Sword & Shield era sets based on user requests.
- **Pokedex integration:** Link cards to Pokemon information (type, evolution, Pokedex entry).

### Version 2.0: Platform & Engagement

- **Trading assistant:** Calculate fair trades between friends based on card rarity.
- **Pack opening simulator:** Fun mini-game simulating pack openings with cards from their wishlist.
- **Pokemon League integration:** Features for organized play participants (deck tracking, event badges).

---

## User Stories

### Child User Stories

#### Epic: Collection Management

| ID | User Story | Acceptance Criteria | Priority |
|----|------------|---------------------|----------|
| C-01 | As a kid, I want to see all the cards in a set so I can find the ones I have | - Grid view shows all cards with clear images<br>- Cards are large enough to tap easily on mobile<br>- Set name and total card count displayed at top | Must Have |
| C-02 | As a kid, I want to tap a card to add it to my collection so I don't have to type anything | - Single tap marks card as owned<br>- Visual feedback (checkmark, color change) confirms addition<br>- Celebration animation plays for first card in a set | Must Have |
| C-03 | As a kid, I want to see how many cards I have in a set so I know my progress | - Progress bar shows X of Y cards collected<br>- Percentage displayed prominently<br>- Progress bar fills with color as collection grows | Must Have |
| C-04 | As a kid, I want to add multiple copies of the same card so I can track my duplicates | - Plus/minus buttons to adjust quantity<br>- Quantity badge shows on owned cards<br>- Duplicate count shown in collection view | Must Have |
| C-05 | As a kid, I want to see all my cards in one place so I can browse my whole collection | - "My Collection" view aggregates all owned cards<br>- Can filter by set, type, or Pokemon<br>- Shows total collection count | Must Have |
| C-06 | As a kid, I want to search for a specific Pokemon so I can find it quickly | - Search bar accepts Pokemon names<br>- Results show all cards featuring that Pokemon<br>- Autocomplete suggests names as I type | Should Have |

#### Epic: Achievements

| ID | User Story | Acceptance Criteria | Priority |
|----|------------|---------------------|----------|
| C-07 | As a kid, I want to earn badges when I collect more cards so I feel rewarded | - Badges awarded at 25%, 50%, 75%, 100% set completion<br>- Pop-up celebration when badge earned<br>- Badge appears in trophy case immediately | Must Have |
| C-08 | As a kid, I want to see all my badges in one place so I can show my friends | - Trophy case screen shows all earned badges<br>- Badges display date earned<br>- Unearned badges shown as locked/grayed out | Must Have |
| C-09 | As a kid, I want to earn special badges for collecting my favorite Pokemon so I feel like a specialist | - Theme badges (e.g., "Dragon Trainer") unlock at thresholds<br>- Badge shows relevant Pokemon imagery<br>- Progress toward next badge visible | Should Have |
| C-10 | As a kid, I want to earn streak rewards so I'm motivated to use the app regularly | - Streak counter tracks consecutive days with activity<br>- Special badge at 3, 7, 14, 30 day streaks<br>- Streak resets if no cards added for 48 hours | Should Have |

#### Epic: Wishlist

| ID | User Story | Acceptance Criteria | Priority |
|----|------------|---------------------|----------|
| C-11 | As a kid, I want to mark cards I want so I remember what to look for | - "Add to Wishlist" button on unowned cards<br>- Wishlist icon appears on wanted cards<br>- Dedicated wishlist view shows all wanted cards | Must Have |
| C-12 | As a kid, I want to star my most-wanted cards so people know what's most important | - Star button on wishlist items<br>- Starred items appear at top of wishlist<br>- Maximum 5 starred items to encourage prioritization | Should Have |
| C-13 | As a kid, I want to share my wishlist with my family so they know what to get me | - "Share Wishlist" button generates link<br>- Link works without requiring login to view<br>- Shared view shows card images and names | Must Have |

### Parent User Stories

#### Epic: Account Management

| ID | User Story | Acceptance Criteria | Priority |
|----|------------|---------------------|----------|
| P-01 | As a parent, I want to create an account for my family so we can use the app together | - Email/password registration with verification<br>- Option to add child profiles during onboarding<br>- Clear terms of service and privacy policy | Must Have |
| P-02 | As a parent, I want to add multiple child profiles so each kid has their own collection | - Add up to 4 child profiles per family<br>- Each profile has unique name and avatar<br>- Easy switching between profiles | Must Have |
| P-03 | As a parent, I want to set a PIN for the parent dashboard so kids can't access it | - 4-digit PIN required for parent dashboard<br>- PIN set during account creation<br>- "Forgot PIN" recovery via email | Should Have |

#### Epic: Oversight & Participation

| ID | User Story | Acceptance Criteria | Priority |
|----|------------|---------------------|----------|
| P-04 | As a parent, I want to see what cards my child owns so I can avoid buying duplicates | - Parent dashboard shows each child's collection stats<br>- Can browse full collection per child<br>- Search for specific cards across all children | Must Have |
| P-05 | As a parent, I want to see recent activity so I know my child is using the app | - Activity feed shows cards added with timestamps<br>- Shows achievements earned<br>- Summarizes activity by day/week | Should Have |
| P-06 | As a parent, I want to see which cards both my kids own so I can encourage trading | - "Duplicate Finder" compares collections<br>- Shows cards owned by multiple children<br>- Suggests "Trade Opportunity" for duplicates | Should Have |
| P-07 | As a parent, I want to optionally see card values so I understand the collection's worth | - Toggle to show/hide pricing in parent dashboard<br>- Pricing hidden by default<br>- Values pulled from TCGPlayer market data | Could Have |
| P-08 | As a parent, I want to print a checklist so my child can take it to the card shop | - "Export Checklist" for any set<br>- PDF shows owned vs. needed cards<br>- Includes set name, child name, date | Should Have |

#### Epic: Wishlist Access

| ID | User Story | Acceptance Criteria | Priority |
|----|------------|---------------------|----------|
| P-09 | As a parent, I want to view my child's wishlist so I know what cards they want | - Wishlist visible in parent dashboard<br>- Shows starred (priority) items first<br>- Can view by child profile | Must Have |
| P-10 | As a parent, I want to share my child's wishlist with grandparents so they can buy gifts | - "Share" button on wishlist view<br>- Generates unique, non-guessable URL<br>- Shared link viewable without app/login | Must Have |

---

## Technical Requirements

### Platform & Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend (Web)** | React + TypeScript | Industry standard, large talent pool, excellent tooling |
| **Frontend (Mobile)** | React Native | Share code with web, single codebase for iOS/Android |
| **Styling** | Tailwind CSS | Rapid development, consistent design system |
| **Backend** | Node.js + Express | JavaScript throughout stack, fast development |
| **Database** | PostgreSQL | Reliable, scalable, excellent for relational data |
| **Hosting** | Vercel (frontend) + Railway (backend) | Cost-effective at low scale, easy deployment |
| **Authentication** | Auth0 or Supabase Auth | Handles COPPA compliance, social login, family accounts |
| **Image CDN** | Pokemon TCG API CDN | No image hosting costs, already optimized |

### Data Sources

**Primary: Pokemon TCG API (pokemontcg.io)**

| Aspect | Details |
|--------|---------|
| Free tier | 20,000 requests/day (sufficient for MVP) |
| Data available | Comprehensive English card database with high-resolution images |
| Pricing data | Includes TCGPlayer market prices (for optional parent view) |
| Reliability | Well-documented, actively maintained, reliable uptime |

**Caching Strategy:**
- Cache card data locally; sets don't change after release
- Only sync new sets quarterly (on release)
- Store user collections in PostgreSQL, not dependent on API

**Image Hosting:**
- Use API-provided image URLs (CDN-hosted)
- No additional storage costs
- Images already optimized for web/mobile

### Performance Requirements

| Metric | Target |
|--------|--------|
| Page load time | < 2 seconds on 4G mobile connection |
| Card grid rendering | Smooth scrolling through 200+ cards |
| Offline support | View owned collection without internet |
| Sync conflict resolution | Last-write-wins with manual override option |
| Uptime | 99.5% availability |

### Privacy & Safety (COPPA Compliance)

| Requirement | Implementation |
|-------------|----------------|
| Parental consent | Parent email required to create child account; email verification mandatory |
| Data minimization | No collection of unnecessary personal information from children |
| No direct messaging | No communication features between users (safety first) |
| No location data | Location services never requested or collected |
| Data deletion | One-click data deletion available to parents |
| Privacy policy | Written in plain language, accessible from all screens |
| Age gating | Birthdate collection to verify age; under-13 requires parent account |

---

## Monetization Strategy

### Pricing Model: Freemium

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Track up to 3 sets, basic achievements, single profile, ads between sessions |
| **Family** | $4.99/month | Unlimited sets, all achievements, 4 child profiles, parent dashboard, wishlist sharing, ad-free, printable checklists |
| **Family Annual** | $39.99/year | All Family features, 2 months free (33% savings) |

### Revenue Projections (Conservative)

| Timeframe | Free Users | Paid Subscribers | Conversion Rate | MRR | ARR |
|-----------|------------|------------------|-----------------|-----|-----|
| Month 6 | 5,000 | 250 | 5% | $1,250 | $15,000 |
| Month 12 | 20,000 | 1,200 | 6% | $6,000 | $72,000 |
| Month 18 | 50,000 | 3,500 | 7% | $17,500 | $210,000 |

### Secondary Revenue Streams

| Stream | Details | Estimated Revenue |
|--------|---------|-------------------|
| TCGPlayer affiliate | 3.5% commission on purchases via wishlist "Buy" buttons | $500-2,000/month at scale |
| Premium badge packs | One-time purchase for exclusive achievements | $1-3 per purchase |
| Special themes | Seasonal UI themes (holiday, Pokemon themed) | $0.99-1.99 per theme |

---

## Success Metrics

### Primary KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Monthly Active Users (MAU) | 50,000 by Month 18 | Unique users with 1+ session/month |
| Paid Conversion Rate | 7%+ | Paid subscribers / Total registered users |
| Monthly Recurring Revenue | $17,500 by Month 18 | Sum of all active subscriptions |
| User Retention (Day 30) | 40%+ | Users active on Day 30 / Users who signed up 30 days ago |
| App Store Rating | 4.5+ stars | Average across iOS and Android |

### Engagement Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Cards added per session | 5+ | Indicates active collecting behavior |
| Sessions per week | 3+ | Shows habitual usage |
| Achievements earned (first month) | 5+ | Validates gamification effectiveness |
| Wishlist shares per month | 1+ per paid user | Indicates viral potential and family engagement |
| Family profiles created | 2+ per family account | Higher = stickier subscriptions |
| Set completion rate | 10%+ complete at least one set | Shows deep engagement |

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Pokemon Company IP concerns** | Medium | High | Use official API (implicitly permitted), don't use official logos, consult IP attorney before launch |
| **Pokemon TCG API deprecation** | Low | High | Cache all card data locally, maintain backup data source, build abstraction layer for easy API swap |
| **Low conversion rate** | Medium | Medium | A/B test pricing and feature gates, interview churned users, ensure free tier is useful but limited |
| **COPPA compliance issues** | Low | Critical | Consult legal expert, implement conservative data practices, regular compliance audits |
| **Competitor launches kid-focused app** | Medium | Medium | Move fast, build community, focus on features competitors ignore (achievements, family accounts) |
| **Card scanner accuracy issues (v1.1)** | Medium | Low | Position scanner as "beta" feature, always allow manual correction, use proven ML models |
| **Scaling costs exceed revenue** | Low | Medium | Serverless architecture scales with usage, aggressive caching reduces API costs |

---

## Development Timeline

### Phase 1: MVP Development (Weeks 1-10)

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1-2 | Technical foundation | Database schema, API integration, authentication system, project scaffolding |
| 3-4 | Core collection tracking | Set browser, card grid, tap-to-add functionality, My Collection view |
| 5-6 | Achievement system | Badge logic, milestone tracking, trophy case UI, celebration animations |
| 7-8 | Family features | Parent dashboard, multi-profile support, wishlist with sharing |
| 9-10 | Polish & testing | Bug fixes, performance optimization, accessibility review, soft launch prep |

### Phase 2: Soft Launch (Weeks 11-14)

| Week | Focus | Activities |
|------|-------|------------|
| 11 | Limited release | Launch to friends, family, small Reddit communities (r/pokemontcg, r/pkmntcgcollections) |
| 12-13 | Feedback collection | User interviews, analytics review, bug triage |
| 14 | Iteration | UX improvements based on real usage data, critical bug fixes |

### Phase 3: Public Launch (Week 15+)

| Week | Focus | Activities |
|------|-------|------------|
| 15 | Public launch | Marketing push across Pokemon communities, Facebook groups, TikTok |
| 16-20 | Growth & iteration | Feature iterations based on user feedback, conversion optimization |
| 21+ | Version 1.1 planning | Scanner feature development, social features scoping |

---

## Appendix A: Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   React Web     │  │  React Native   │                   │
│  │   (Vercel)      │  │  (iOS/Android)  │                   │
│  └────────┬────────┘  └────────┬────────┘                   │
│           │                    │                             │
│           └──────────┬─────────┘                             │
│                      │                                       │
└──────────────────────┼───────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────┼───────────────────────────────────────┐
│                      ▼                                       │
│  ┌─────────────────────────────────────┐                    │
│  │         API Gateway (Express)        │                    │
│  │         - Authentication             │                    │
│  │         - Rate Limiting              │                    │
│  │         - Request Validation         │                    │
│  └──────────────────┬──────────────────┘                    │
│                     │                                        │
│  ┌──────────────────┼──────────────────┐                    │
│  │                  ▼                  │                    │
│  │  ┌────────────────────────────┐     │                    │
│  │  │      Business Logic        │     │                    │
│  │  │  - Collection Service      │     │                    │
│  │  │  - Achievement Service     │     │                    │
│  │  │  - Family Service          │     │                    │
│  │  │  - Wishlist Service        │     │                    │
│  │  └─────────────┬──────────────┘     │                    │
│  │                │                    │                    │
│  └────────────────┼────────────────────┘                    │
│                   │                                          │
│    ┌──────────────┴──────────────┐                          │
│    ▼                             ▼                          │
│  ┌──────────────┐     ┌──────────────────┐                  │
│  │  PostgreSQL  │     │  Pokemon TCG API │                  │
│  │  - Users     │     │  (External)      │                  │
│  │  - Cards     │     │  - Card Data     │                  │
│  │  - Profiles  │     │  - Images        │                  │
│  │  - Wishlist  │     │  - Pricing       │                  │
│  └──────────────┘     └──────────────────┘                  │
│                                                              │
│                      BACKEND (Railway)                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Appendix B: Database Schema (Simplified)

```sql
-- Family accounts
CREATE TABLE families (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(20) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    parent_pin_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Child profiles within a family
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    family_id UUID REFERENCES families(id),
    display_name VARCHAR(50) NOT NULL,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Cards in a profile's collection
CREATE TABLE collection_cards (
    id UUID PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id),
    card_id VARCHAR(50) NOT NULL, -- Pokemon TCG API card ID
    quantity INTEGER DEFAULT 1,
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(profile_id, card_id)
);

-- Wishlist items
CREATE TABLE wishlist_cards (
    id UUID PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id),
    card_id VARCHAR(50) NOT NULL,
    is_priority BOOLEAN DEFAULT FALSE,
    added_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(profile_id, card_id)
);

-- Earned achievements
CREATE TABLE achievements (
    id UUID PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id),
    achievement_type VARCHAR(50) NOT NULL,
    achievement_data JSONB, -- Flexible data (e.g., which set completed)
    earned_at TIMESTAMP DEFAULT NOW()
);

-- Shareable wishlist links
CREATE TABLE wishlist_shares (
    id UUID PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id),
    share_token VARCHAR(32) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);
```

---

## Appendix C: Achievement Definitions

### Set Completion Badges

| Badge | Trigger | Icon Theme |
|-------|---------|------------|
| Set Explorer | 25% of any set | Compass |
| Set Adventurer | 50% of any set | Map |
| Set Master | 75% of any set | Trophy |
| Set Champion | 100% of any set | Crown |

### Collector Milestones

| Badge | Trigger | Icon Theme |
|-------|---------|------------|
| First Catch | Add first card | Poke Ball |
| Starter Collector | 10 total cards | Great Ball |
| Rising Trainer | 50 total cards | Ultra Ball |
| Pokemon Trainer | 100 total cards | Master Ball |
| Elite Collector | 250 total cards | Star |
| Pokemon Master | 500 total cards | Diamond |
| Legendary Collector | 1000 total cards | Crown |

### Type Specialist Badges

| Badge | Trigger |
|-------|---------|
| Fire Trainer | Own 10+ Fire-type Pokemon cards |
| Water Trainer | Own 10+ Water-type Pokemon cards |
| Grass Trainer | Own 10+ Grass-type Pokemon cards |
| Electric Trainer | Own 10+ Electric-type Pokemon cards |
| Dragon Trainer | Own 10+ Dragon-type Pokemon cards |
| Psychic Trainer | Own 10+ Psychic-type Pokemon cards |

### Pokemon Fan Badges

| Badge | Trigger |
|-------|---------|
| Pikachu Fan | Own 5+ cards featuring Pikachu |
| Eevee Fan | Own 5+ cards featuring Eevee or Eeveelutions |
| Charizard Fan | Own 3+ cards featuring Charizard |
| Legendary Fan | Own 5+ cards featuring Legendary Pokemon |

### Streak Badges

| Badge | Trigger |
|-------|---------|
| 3-Day Streak | Add cards 3 days in a row |
| Week Warrior | Add cards 7 days in a row |
| Dedicated Collector | Add cards 14 days in a row |
| Monthly Master | Add cards 30 days in a row |

---

## January 2026 Site Evaluation & Multi-TCG Pivot

### Product Evolution: KidCollect → CardDex

The product has evolved from Pokemon-only to **multi-TCG support** covering 7 trading card games. The app is now branded as **CardDex** internally.

### Supported TCGs

| Game | Kid-Friendly | Audience Fit | API Status | Priority |
|------|--------------|--------------|------------|----------|
| **Pokemon TCG** | ✅ Yes | Ages 6-14, perfect fit | ✅ Working | HIGH |
| **Yu-Gi-Oh!** | ✅ Yes | Ages 8-16, anime fans | ✅ Working | HIGH |
| **Disney Lorcana** | ✅ Yes | Ages 6-12, Disney fans | ✅ Working | HIGH |
| **One Piece** | ✅ Yes | Ages 10-16, anime fans | ✅ Working | MEDIUM |
| **Digimon** | ✅ Yes | Ages 8-14, nostalgia + new fans | ✅ Working | MEDIUM |
| **Dragon Ball Fusion World** | ✅ Yes | Ages 8-16, anime fans | ⚠️ API Limit | MEDIUM |
| **Magic: The Gathering** | ❌ No | Ages 13+, complex rules | ✅ Working | LOW (consider removing) |

**Recommendation:** Consider removing or hiding MTG for the kid-focused product. Its complexity and older target audience don't align with the 6-14 age range.

### Site Evaluation Findings (January 17, 2026)

#### CRITICAL ISSUES (Must Fix Before Launch)

| Issue | Impact | Fix Required |
|-------|--------|--------------|
| **No /signup page exists** | Users clicking "Sign Up" get 404 | Create /signup page or redirect to /login |
| **Game picker not working site-wide** | Only /sets uses game picker; rest is Pokemon-only | Update all pages to use selected game |
| **Landing page says "Pokemon" only** | Misrepresents multi-TCG product | Update copy to feature all supported games |
| **Parent dashboard uses demo data** | Security risk, creates test data | Use authenticated user data only |

#### HIGH PRIORITY ISSUES

| Issue | Impact | Fix Required |
|-------|--------|--------------|
| Login page copy says "Pokemon" | Inconsistent with multi-TCG | Update to "trading card collection" |
| Individual set page (/sets/[setId]) hardcoded | Can only view Pokemon sets | Make game-aware |
| Search page hardcoded to Pokemon | Search only finds Pokemon cards | Make game-aware |
| Browse page hardcoded to Pokemon | Browse only shows Pokemon | Make game-aware |
| Collection page hardcoded to Pokemon | Collection only tracks Pokemon | Make game-aware |
| All API routes hardcoded | Backend only serves Pokemon data | Make game-aware |
| No role-based access control | Anyone can access parent dashboard | Add proper auth checks |

#### MEDIUM PRIORITY ISSUES

| Issue | Impact | Fix Required |
|-------|--------|--------------|
| Missing /about page | No product info for parents | Create informational page |
| Missing /help or FAQ page | No self-service support | Create help content |
| Missing legal pages | Compliance gaps | Add Terms, Privacy, Contact |
| Dashboard vs Collection confusion | Unclear page purposes | Consolidate or clarify naming |
| No profile switching UI | Multi-child feature incomplete | Add profile switcher |

### Pages Requiring Multi-TCG Updates

These pages currently import from `pokemon-tcg.ts` and need to be updated to use the game picker:

1. `/sets/[setId]/page.tsx` - Individual set view
2. `/browse/page.tsx` - Card browsing
3. `/search/page.tsx` - Card search
4. `/my-wishlist/page.tsx` - Wishlist
5. `/wishlist/[token]/page.tsx` - Public wishlist
6. `/collection/page.tsx` - Collection view (verify)
7. `/api/sets/route.ts` - Sets API
8. `/api/search/route.ts` - Search API
9. `/api/cards/route.ts` - Cards API
10. `/api/filter/route.ts` - Filter API

### Landing Page Updates Required

1. **Hero section**: Change "Track Your Pokemon Cards" → "Track Your Trading Card Collection"
2. **Add Games section**: Feature all 6-7 supported TCGs with logos
3. **Features section**: Update to mention multi-game support
4. **Pricing section**: Change "500+ Pokemon sets" → "500+ sets across 7 games"
5. **How it Works**: Remove Pokemon-specific language

### Authentication Flow Fixes

1. Create `/signup` page that redirects to `/login?mode=signup` OR
2. Create dedicated signup page with family-first registration flow
3. Update `/login` page copy to be game-agnostic
4. Add email verification for COPPA compliance
5. Add parental consent step

### Settings Permissions Model (January 2026 Evaluation)

**CRITICAL ISSUE:** All settings are currently accessible by anyone. Kids can disable Sleep Mode and remove the Parent PIN, defeating parental controls entirely.

#### Parent-Only Settings (Require PIN or Parent Account)

| Setting | Why Parent-Only |
|---------|-----------------|
| **Kid Mode Toggle** | Parent decides appropriate complexity level for child's age |
| **Sleep Mode On/Off** | Parent controls screen time limits, kid shouldn't disable |
| **Sleep Mode Schedule** | Parent sets appropriate bedtime/wake times |
| **Parent PIN Management** | CRITICAL: Kid can currently remove PIN entirely |
| **Game Selection** | Parent may want to restrict certain TCGs (e.g., MTG for younger kids) |
| **Profile Management** | Adding/removing child profiles |
| **Account Settings** | Email, password, subscription |
| **Data Export/Delete** | GDPR/COPPA compliance actions |

#### Kid-Accessible Settings (Personal Preference & Accessibility)

| Setting | Why Kid-Accessible |
|---------|-------------------|
| **Dark Mode** | Personal comfort preference, no safety concern |
| **Low-Stimulation Mode** | Accessibility need - some kids need calmer UI |
| **Dyslexic-Friendly Font** | Accessibility need - kid knows if they need it |
| **High Contrast** | Accessibility need - visual comfort |
| **Reduced Motion** | Accessibility need - sensory sensitivity |
| **Focus Mode** | Kid may want to hide gamification elements (optional distraction reduction) |

#### Implementation Requirements

1. **Settings Page Restructure:**
   - Create two sections: "My Settings" (kid-accessible) and "Family Controls" (parent-locked)
   - Family Controls section requires Parent PIN to view/modify
   - Show lock icon on parent-only settings when viewing as kid

2. **Parent PIN Protection:**
   - Move PIN verification to access Family Controls section
   - Once PIN verified, parent can modify all settings
   - PIN should have timeout (re-verify after 5 minutes of inactivity)
   - Setting/removing PIN should require current PIN (if set)

3. **Profile-Aware Settings:**
   - Store kid-accessible settings per profile (each kid can have their own dark mode preference)
   - Store parent settings at family/account level (sleep schedule applies to all kids)

4. **Visual Indicators:**
   - Add "Parent Only" badge to protected settings
   - Show friendly message to kids: "Ask a grown-up to change this setting"
   - Add lock icon with tooltip explaining why setting is protected

### Comprehensive Site Evaluation (January 17, 2026 - Round 2)

This evaluation covers performance, broken images, UX organization, and functionality status.

#### Performance Analysis: My Collection Page

The `/collection` page is slow to load due to multiple issues:

| Issue | Severity | Impact | Location |
|-------|----------|--------|----------|
| **Duplicate queries** | CRITICAL | +1-2s load | `page.tsx` calls both `getCollection` AND `getCollectionStats` separately |
| **4 separate queries in VirtualCardGrid** | CRITICAL | +500ms-1s | Collection, wishlist, newly added cards, priority count all fetched independently |
| **getNewlyAddedCards collects ALL logs** | HIGH | +500ms-2s for active users | Fetches entire activity log history, filters in JavaScript |
| **CollectionView grouping not memoized** | HIGH | +300-800ms re-renders | Set grouping logic recalculates on every render |
| **ActivityFeed not memoized** | HIGH | +200-500ms | Re-renders on every parent update |
| **Missing image lazy loading** | MEDIUM | CLS issues | No `loading="lazy"` on card images |
| **VirtualTrophyRoom not lazy loaded** | LOW | +100-300ms | Loads immediately even though optional |

**Recommended Fixes (in order):**
1. Merge `getCollection` + `getCollectionStats` into single Convex query
2. Consolidate VirtualCardGrid's 4 queries into one batch query
3. Add `useMemo` to CollectionView grouping logic
4. Add `React.memo()` to ActivityFeed
5. Add `loading="lazy"` to all card images
6. Add database-level filtering to `getNewlyAddedCards` query
7. Lazy load VirtualTrophyRoom with `React.lazy()`

**Estimated improvement: 2-4 seconds faster initial load for large collections**

#### Broken Images Analysis

| Severity | Issue | Impact | Files Affected |
|----------|-------|--------|----------------|
| 🔴 HIGH | Card back image URL has no error handler | Card flip breaks everywhere | `FlippableCard.tsx` |
| 🔴 HIGH | 40+ hardcoded game card URLs | Games break if API changes | `PriceEstimationGame.tsx`, `PokemonTypeQuiz.tsx`, `GradeLikeAProGame.tsx`, `RarityGuessingGame.tsx` |
| 🔴 HIGH | 12+ hardcoded set symbol URLs | SetSymbolMatchingGame breaks | `SetSymbolMatchingGame.tsx` |
| 🟡 MEDIUM | 6+ card image components without `onError` | Silent failures | `CardGrid.tsx`, `DigitalBinder.tsx`, `PackOpeningSimulator.tsx`, `CollectionView.tsx` |
| 🟡 MEDIUM | No `/public` folder with fallback images | No graceful degradation | Project root |

**Recommended Fixes:**
1. Add `onError` handlers to ALL Image components with fallback placeholder
2. Create `/public/fallback-card.png` for image load failures
3. Extract hardcoded game URLs to a configuration file
4. Add image load error monitoring/tracking
5. Add retry logic for failed images

#### UX & Organization Evaluation

**Overall UX Score: 7.7/10**

| Area | Score | Notes |
|------|-------|-------|
| Navigation Structure | 8.5/10 | Excellent auth-aware header switching, good mobile UX |
| Page Organization | 7.0/10 | Confusion between Dashboard vs Collection purpose |
| Component Consistency | 7.5/10 | Good patterns but styling inconsistencies in back links, page headers |
| Mobile Responsiveness | 8.5/10 | Excellent, some height testing needed on small devices |
| Accessibility | 8.0/10 | Good ARIA, focus management, keyboard navigation |

**Key UX Issues:**

1. **Post-Onboarding Flow Confusion**
   - After onboarding, users land on `/dashboard` which requires profile selection
   - Should redirect to `/collection` (the actual main feature)
   - Location: `/onboarding/page.tsx` line 14

2. **Dashboard vs Collection Confusion**
   - Users unclear which page is the "main" feature
   - Consider making Dashboard the overview hub, Collection the detail view
   - Or consolidate into single page

3. **Missing Back Navigation**
   - `/learn` page has no back link
   - `/condition-guide` isolated with no breadcrumb
   - Back link styling inconsistent (gap-1.5 vs gap-2, font-medium vs normal)

4. **Missing Footer Navigation**
   - App pages have no footer
   - No links to Help, About, Privacy, Terms, Contact

5. **Parent Dashboard Discoverability**
   - Only in profile dropdown, no visual indicator
   - Parents may not find family features

**Recommended Component Standardization:**
- Create `<BackLink />` component for consistent back navigation
- Create `<PageHeader />` component with title, description, icon
- Create `<AppFooter />` for all authenticated pages

#### Functionality Status Report

**CRITICAL - NOT WORKING:**
| Feature | Issue | Impact |
|---------|-------|--------|
| **Signup Route** | `/signup` doesn't exist | 6 links point to 404 |

Users clicking any "Sign Up" button get a 404 error. This is the primary conversion path.

**FULLY WORKING:**
| Feature | Status | Notes |
|---------|--------|-------|
| Login page | ✅ | Has signup toggle built-in |
| Kid Dashboard | ✅ | Full feature set, gamification, activity |
| Parent Dashboard | ✅ | Family overview, leaderboard, goals |
| Sets Browsing | ✅ | Game-aware (after recent update) |
| Set Detail View | ✅ | Card grid, rarity filter, Just Pulled mode |
| Collection Management | ✅ | CRUD, variants, virtual scrolling |
| Wishlist | ✅ | Add/remove, priority, sharing, budget alternatives |
| Badge System | ✅ | 37 badges across 5 categories |
| Streak System | ✅ | Calendar, milestones, grace days |
| API Routes | ✅ | /api/cards, /api/search, /api/filter, /api/sets |
| Gamification | ✅ | Levels, milestones, celebrations |
| Search | ✅ | Works for Pokemon (needs multi-TCG) |
| Profile | ✅ | Avatar customization |
| Settings | ✅ | All toggles work (needs permission model) |

**PARTIAL - Needs Multi-TCG Update:**
| Page | Current State | Fix Needed |
|------|---------------|------------|
| `/sets/[setId]` | Pokemon-only | Use game parameter |
| `/browse` | Pokemon-only | Use game selector |
| `/search` | Pokemon-only | Search within selected game |
| `/my-wishlist` | Pokemon-only | Show cards from selected game |
| `/collection` | Pokemon-only | Filter by selected game |
| All API routes | Pokemon-only | Accept game parameter |

---

## Conclusion

CardDex (formerly KidCollect) addresses a clear market gap with a focused, achievable product. The combination of an underserved audience (kids and families), free data infrastructure (Pokemon TCG API), and proven monetization model (freemium family subscriptions) creates a compelling opportunity.

**Key Success Factors:**
1. **Simple, delightful UX** that a 7-year-old can navigate without help
2. **Achievement system** that makes collecting feel rewarding
3. **Family features** that help parents participate without becoming experts
4. **COPPA compliance** that builds trust with parents
5. **Focused MVP scope** that enables rapid development and iteration

The MVP can be built in 10-12 weeks, validated with real users, and scaled based on traction. The path forward is clear: Build a simple, delightful experience that makes kids proud of their collections and gives parents confidence in their screen time.

Everything else follows from that.

---

*Document created: January 2026*
*Last updated: January 2026*
*Author: PRD Creator Assistant*

---

## References

- [Pokemon TCG API Documentation](https://pokemontcg.io)
- [JustInBasil's Pokemon TCG Resources](https://www.justinbasil.com)
- [Pokellector](https://www.pokellector.com)
- [Screen Rant - Pokemon TCG Scarlet & Violet Sets](https://screenrant.com/pokemon-tcg-scarlet-violet-sets-list/)
