# Agent Instructions - CardDex

This file captures learnings about how to build, test, and run the project.
Update this when you discover better ways to work with the codebase.

## Task Management with Beads

```bash
bd ready                                    # Find unblocked issues to work on
bd show <issue-id>                          # View issue details and acceptance criteria
bd update <issue-id> --status in_progress   # Claim issue
bd close <issue-id>                         # Mark complete when done
bd create --title "..." --type bug --priority P2  # Report new bugs
```

**Note:** Issues are stored in `~/.beads-planning`. Run commands from project root.

## Project Stack

- **Framework**: Next.js 14 (App Router)
- **Backend**: Convex (serverless functions + real-time database)
- **Auth**: Convex Auth (@convex-dev/auth)
- **Styling**: Tailwind CSS
- **Icons**: Heroicons (@heroicons/react)
- **Testing**: Vitest
- **APIs**: Pokemon TCG SDK, TCGPlayer prices

## Quality Gates (MANDATORY)

**ALWAYS run quality checks before committing:**

```bash
npm run build     # Build - must pass (includes TypeScript check)
npm run lint      # Lint check
npm run test:run  # Run tests
```

## Running the Project

```bash
npm run dev       # Start both Next.js + Convex dev servers
npm run build     # Production build
npm run start     # Start production server
```

Runs on http://localhost:3000

## Issue Sizing & Decomposition

Before starting work on any issue, evaluate its size:

| Size | Files | Distinct Changes | Action |
|------|-------|------------------|--------|
| S | 1-2 | 1-2 | Work directly |
| M | 3-5 | 2-4 | Work directly |
| L | 6-10 | 5-8 | Decompose first |
| XL | 10+ | 8+ | Must decompose |

### Decomposition Rules

- Each sub-issue should be S or M sized
- Each sub-issue should be independently testable
- Each sub-issue should result in one focused commit
- Use `--blocked-by` when order matters
- Parent issue becomes a container (mark as blocked)

## File Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth-protected routes
│   ├── dashboard/         # Main dashboard
│   ├── collection/        # User's card collection
│   ├── sets/              # Browse sets, set detail pages
│   └── parent-dashboard/  # Parent account features
├── components/
│   ├── layout/            # AppHeader, AppFooter, etc.
│   ├── ui/                # Reusable UI components
│   ├── dashboard/         # Dashboard-specific components
│   └── auth/              # Auth components
├── hooks/                 # Custom React hooks
│   └── useCurrentProfile.ts  # Profile data access
├── lib/                   # Utilities and helpers
│   └── profiles.ts        # Profile utility functions
└── convex/                # Convex backend (DO NOT MODIFY without explicit request)
    ├── profiles.ts        # Profile queries/mutations
    ├── cards.ts           # Card data
    └── achievements.ts    # Achievement system
```

## Code Patterns

### Profile Access
```typescript
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
const { profile, availableProfiles, canSwitchProfiles } = useCurrentProfile();
```

### Convex Queries
```typescript
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
const data = useQuery(api.profiles.getCurrentUserProfile);
```

### Icons (use Heroicons, NOT emojis)
```typescript
import { SparklesIcon, StarIcon } from '@heroicons/react/24/solid';
```

### Styling
- Use Tailwind CSS classes
- Kid-friendly colors: `kid-primary`, `kid-secondary` (custom theme)
- No emojis in UI - use SVG icons instead

## Learnings

- Profile switching uses `availableProfiles` from `useCurrentProfile()` hook
- Parent vs child determined by `profile.profileType === 'parent'`
- Settings permissions need PIN protection for Family Controls
- Issues route to `~/.beads-planning` by default
