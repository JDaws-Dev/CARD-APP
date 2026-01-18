# Parent-Child Account Architecture Design Document

## Executive Summary

This document outlines a comprehensive architecture for implementing separate parent vs child login experiences in CardDex. The design supports three distinct user types: Individual Collectors (solo users), Parent Accounts (family managers), and Kid Login (PIN-based quick access for children).

---

## 1. Current State Analysis

### 1.1 Authentication System

**Current Implementation:**
- Uses Convex Auth with Password provider (`@convex-dev/auth`)
- Single authentication flow for all users via `AuthForm.tsx`
- Account type selection during signup: "family" or "individual"
- Post-auth redirect based on onboarding completion state

**Current Flow:**
1. User visits `/login`
2. Selects "Family Account" or "Individual Collector"
3. Enters email/password
4. Redirected to `/onboarding` or `/dashboard`

### 1.2 Data Model

**Core Tables:**

```typescript
// families - Account container (convex/schema.ts)
families: {
  email: string,                      // Unique per family, indexed
  subscriptionTier: 'free' | 'family',
  subscriptionExpiresAt?: number,
  parentPinHash?: string,             // PIN for protecting parent features from children
  tradeApprovalRequired?: boolean,
  tradeNotificationsEnabled?: boolean,
}

// profiles - Individual user profiles within a family (convex/schema.ts)
profiles: {
  familyId: Id<'families'>,           // Foreign key
  displayName: string,
  avatarUrl?: string,
  profileType?: 'parent' | 'child',
  xp?: number,                        // Gamification
  level?: number,
}
```

**User-Family-Profile Relationship:**
```
User (Convex Auth)          ← Built-in auth table
  └─ email
      └─ Family             ← One per email, email is unique
          └─ Profiles       ← Multiple (max 4), one parent max
              ├─ parent profile
              └─ child profiles
```

**Key Observations:**
1. `accountType` is captured at signup but NOT persisted in the database
2. The schema supports parent/child distinction via `profileType`
3. Parent PIN exists (`parentPinHash`) but is for protecting parent features, not for login
4. No mechanism for child-only PIN login exists
5. Maximum 4 profiles per family enforced in mutations
6. One parent profile maximum per family enforced

### 1.3 Profile Switching Mechanism

**Current Implementation** (`src/components/header/ProfileSwitcher.tsx`):

```typescript
const PROFILE_ID_KEY = 'kidcollect_profile_id';

// Profile switching stores ID in localStorage
const handleProfileSelect = (profile: Profile) => {
  localStorage.setItem(PROFILE_ID_KEY, profile.id);
  window.location.reload();  // Full page reload to refresh all queries
};
```

**How it works:**
1. User clicks profile in dropdown
2. Profile ID stored in `localStorage` with key `kidcollect_profile_id`
3. Page reloads to refresh all Convex queries with new profile context
4. `useCurrentProfile()` hook reads from localStorage on mount
5. All queries pass `profileId` to backend for data scoping

**Limitation:** Requires full page reload; no real-time profile switching.

### 1.4 Parent Dashboard Access Control

**Access Query** (`convex/profiles.ts:hasParentAccess`):

```typescript
export const hasParentAccess = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { hasAccess: false, reason: 'NOT_AUTHENTICATED' };

    const user = await ctx.db.get(userId);
    if (!user?.email) return { hasAccess: false, reason: 'NO_EMAIL' };

    const family = await ctx.db
      .query('families')
      .withIndex('by_email', q => q.eq('email', user.email.toLowerCase()))
      .first();
    if (!family) return { hasAccess: false, reason: 'NO_FAMILY' };

    const parentProfile = profiles.find(p => p.profileType === 'parent');
    if (!parentProfile) return { hasAccess: false, reason: 'NO_PARENT_PROFILE' };

    return { hasAccess: true, profile: parentProfile, family };
  }
});
```

**Dashboard Features** (`src/components/dashboard/ParentDashboard.tsx`):
- Child profile cards with stats
- `FamilyCollectionGoal` - Track family goals
- `FamilyLeaderboard` - Compare children's progress
- `TradeSuggestionEngine` - AI trade suggestions
- `SharedWishlistViewer` - View wishlists
- Add profile button, family settings access

### 1.5 Session Management

**Session Type:** Stateless JWT-based via Convex Auth

**Session Provider Setup** (`src/components/providers/ConvexClientProvider.tsx`):
```typescript
<ConvexProvider client={convex}>
  <ConvexAuthProvider client={convex}>
    {children}
  </ConvexAuthProvider>
</ConvexProvider>
```

**Key Auth Hooks:**
- `useConvexAuth()` - Check `isAuthenticated`, `isLoading`
- `useAuthActions()` - Access `signIn()`, `signOut()`
- `useQuery(api.profiles.getCurrentUserProfile)` - Get current user/profile data

**Session Storage:**
- Tokens managed automatically by `@convex-dev/auth/react`
- Persists across page reloads via browser storage
- No server-side session store; stateless JWT validation

### 1.6 Gaps in Current Architecture

1. **No Individual User Type Storage** - `accountType` is not persisted
2. **No Child PIN Login** - Children require full auth
3. **No Device-Based Sessions** - No remember device functionality
4. **No Quick-Switch Login** - Returning kids must go through parent auth
5. **Mixed UI** - Individual users see parent-related options

---

## 2. Proposed Data Model Changes

### 2.1 Schema Additions

```typescript
// Add to families table
families: {
  // ... existing fields ...
  accountType: v.union(
    v.literal('individual'),  // Solo collector, no family features
    v.literal('family')       // Parent + children
  ),
}

// New table: Child login PINs
childLoginPins: defineTable({
  profileId: v.id('profiles'),          // Which child profile
  familyId: v.id('families'),           // For family-level queries
  pinHash: v.string(),                  // PBKDF2 hashed 5-digit PIN
  pinHint: v.optional(v.string()),      // Optional hint (e.g., "My favorite Pokemon")
  failedAttempts: v.number(),           // Track failed attempts
  lastAttemptAt: v.optional(v.number()), // For lockout calculation
  lockedUntil: v.optional(v.number()),  // Lockout expiration
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_profile', ['profileId'])
  .index('by_family', ['familyId'])

// New table: Device sessions for quick login
deviceSessions: defineTable({
  familyId: v.id('families'),
  deviceToken: v.string(),              // Unique device identifier
  deviceName: v.string(),               // Friendly name
  lastActiveProfileId: v.optional(v.id('profiles')),
  authorizedAt: v.number(),             // When parent authorized this device
  authorizedBy: v.id('profiles'),       // Parent who authorized
  lastUsedAt: v.number(),
  expiresAt: v.number(),                // 30 days from last use
  isActive: v.boolean(),
})
  .index('by_family', ['familyId'])
  .index('by_device_token', ['deviceToken'])
```

---

## 3. Authentication Flows

### 3.1 Initial Login Screen Design

```
+------------------------------------------+
|              🃏 CardDex                   |
|                                          |
|  +----------------+  +----------------+  |
|  |                |  |                |  |
|  |    👤 Log In   |  |   🔢 Kid PIN   |  |
|  |  (Email/Pass)  |  |   (5 digits)   |  |
|  |                |  |                |  |
|  +----------------+  +----------------+  |
|                                          |
|  [ ] Remember this device                |
|                                          |
|  ─────────── or ───────────             |
|                                          |
|  +------------------------------------+  |
|  |   ✨ Create New Account           |  |
|  +------------------------------------+  |
+------------------------------------------+
```

### 3.2 Flow: Individual Collector

```
Login (email/pass)
    ↓
Check accountType == 'individual'
    ↓
Redirect to /dashboard (KidDashboard)
    ↓
- No profile switcher shown
- No parent dashboard link
- No family features in UI
```

### 3.3 Flow: Parent Account (Family)

```
Login (email/pass)
    ↓
Check accountType == 'family' && profileType == 'parent'
    ↓
Option 1: View Parent Dashboard
    - Manage family profiles
    - View all children's progress
    - Create/manage kid PINs

Option 2: Browse as Parent
    - Full app access
    - Can switch to any profile
```

### 3.4 Flow: Kid PIN Login

```
Enter 5-digit PIN
    ↓
Lookup PIN in childLoginPins
    ↓
Verify:
    - PIN matches hash
    - Not locked out
    - Device is authorized (if required)
    ↓
Create session for child profile
    ↓
Redirect to /dashboard (kid view)
    - No access to parent features
    - No profile switching without PIN
    - No logout button (requires parent)
```

### 3.5 Flow: Device Authorization

```
Parent logs in on new device
    ↓
Prompt: "Authorize this device for kid login?"
    ↓
If yes:
    - Generate device token
    - Store in deviceSessions
    - Kids can use PIN on this device

If no:
    - Kids must use parent login
```

---

## 4. UI/UX Recommendations

### 4.1 Kid PIN Entry Component

- Large, colorful buttons (0-9)
- Friendly character/mascot
- Visual feedback (dots fill in)
- Profile avatar shown after 2 digits (helps kids remember their PIN)
- "I forgot my PIN" links to parent

### 4.2 Navigation Changes

**For Individual Accounts:**
```
Header: [Logo] [Collection] [Sets] [Search] [Profile ▼]
           (No "Parent Dashboard" link)
```

**For Parent Profile:**
```
Header: [Logo] [Collection] [Sets] [Search] [Switch Profile ▼] [👤 Parent ▼]
                                                                    └─ Parent Dashboard
                                                                    └─ Manage Kids
                                                                    └─ Log Out
```

**For Child Profile (PIN login):**
```
Header: [Logo] [Collection] [Sets] [Search] [👤 {Name}]
                                                └─ Switch Kid (requires other kid's PIN)
                                                └─ Get Parent (returns to login)
```

---

## 5. Security Considerations

### 5.1 PIN Security

- 5-digit PINs (10,000 combinations)
- PBKDF2 hashing with salt
- Rate limiting: 5 attempts, then 15-minute lockout
- Unique PINs per family (no two kids can have same PIN)
- No sequential PINs (12345, 11111)

### 5.2 Device Authorization

- Devices require parent authorization
- Token stored in secure httpOnly cookie
- 30-day expiration with activity-based renewal
- Parent can revoke any device remotely
- Maximum 5 authorized devices per family

### 5.3 Access Control Matrix

| Feature | Individual | Parent | Child (PIN) |
|---------|-----------|--------|-------------|
| View Collection | ✓ | ✓ | ✓ |
| Add Cards | ✓ | ✓ | ✓ |
| View Prices | ✓ | ✓ | Per family setting |
| Parent Dashboard | - | ✓ | - |
| Manage Profiles | - | ✓ | - |
| Change PIN | - | ✓ | - |
| Profile Switch | - | ✓ (free) | Requires PIN |
| Logout | ✓ | ✓ | - (returns to login) |
| Settings | ✓ | ✓ | Limited |

---

## 6. Migration Strategy

This section provides a comprehensive plan for migrating existing users to the new parent-child account architecture.

### 6.1 Migration Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MIGRATION OVERVIEW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CURRENT STATE                          TARGET STATE                         │
│  ─────────────────                      ────────────────                     │
│  • accountType NOT persisted            • accountType in families table      │
│  • No kid PIN login                     • childLoginPins table               │
│  • No device authorization              • deviceSessions table               │
│  • Single auth flow for all             • Dual auth (email/PIN)              │
│  • Mixed UI for all users               • Account-type-specific UI           │
│                                                                              │
│  MIGRATION APPROACH                                                          │
│  ──────────────────                                                          │
│  1. Additive schema changes (non-breaking)                                   │
│  2. One-time data migration script                                           │
│  3. Progressive feature rollout                                              │
│  4. Soft launch with monitoring                                              │
│  5. User communication at each phase                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Determine Account Type for Existing Users

The migration must infer `accountType` from existing data patterns:

```typescript
// Migration Classification Logic
interface MigrationClassification {
  familyId: Id<'families'>;
  currentProfiles: Profile[];
  inferredAccountType: 'individual' | 'family';
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

function classifyFamily(family: Family, profiles: Profile[]): MigrationClassification {
  const hasParentProfile = profiles.some(p => p.profileType === 'parent');
  const hasChildProfiles = profiles.some(p => p.profileType === 'child');
  const profileCount = profiles.length;

  // Case 1: Clear family pattern - parent + children
  if (hasParentProfile && hasChildProfiles) {
    return {
      familyId: family._id,
      currentProfiles: profiles,
      inferredAccountType: 'family',
      confidence: 'high',
      reason: 'Has parent profile with child profiles'
    };
  }

  // Case 2: Parent profile but no children yet (family in setup)
  if (hasParentProfile && profileCount === 1) {
    return {
      familyId: family._id,
      currentProfiles: profiles,
      inferredAccountType: 'family',
      confidence: 'medium',
      reason: 'Has parent profile, may add children later'
    };
  }

  // Case 3: Single profile, no parent type - individual collector
  if (profileCount === 1 && !hasParentProfile) {
    return {
      familyId: family._id,
      currentProfiles: profiles,
      inferredAccountType: 'individual',
      confidence: 'high',
      reason: 'Single profile without parent designation'
    };
  }

  // Case 4: Multiple profiles without clear parent (legacy data)
  if (profileCount > 1 && !hasParentProfile) {
    return {
      familyId: family._id,
      currentProfiles: profiles,
      inferredAccountType: 'family',
      confidence: 'low',
      reason: 'Multiple profiles but no parent - needs user confirmation'
    };
  }

  // Fallback
  return {
    familyId: family._id,
    currentProfiles: profiles,
    inferredAccountType: 'individual',
    confidence: 'low',
    reason: 'Could not determine - defaulting to individual'
  };
}
```

**Classification Decision Tree:**

```
                           ┌─────────────────────┐
                           │   Load all profiles  │
                           │   for this family    │
                           └──────────┬──────────┘
                                      │
                           ┌──────────▼──────────┐
                           │  Has profileType =   │
                           │     'parent'?        │
                           └──────────┬──────────┘
                                      │
                      ┌───────────────┴───────────────┐
                      ▼                               ▼
                    [YES]                           [NO]
                      │                               │
           ┌──────────▼──────────┐         ┌──────────▼──────────┐
           │  Has child profiles? │         │   Profile count?    │
           └──────────┬──────────┘         └──────────┬──────────┘
                      │                               │
           ┌──────────┴──────────┐         ┌──────────┴──────────┐
           ▼                     ▼         ▼                     ▼
         [YES]                 [NO]      [= 1]                 [> 1]
           │                     │         │                     │
           ▼                     ▼         ▼                     ▼
    ┌───────────────┐   ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │   FAMILY      │   │   FAMILY      │ │  INDIVIDUAL   │ │   FAMILY      │
    │  (high conf)  │   │ (medium conf) │ │  (high conf)  │ │  (low conf)   │
    │               │   │               │ │               │ │ needs confirm │
    └───────────────┘   └───────────────┘ └───────────────┘ └───────────────┘
```

### 6.3 Existing User Handling

#### 6.3.1 Individual Users

Users classified as `individual` will receive:

| Aspect | Handling |
|--------|----------|
| **Data Migration** | Set `families.accountType = 'individual'` |
| **UI Changes** | Hide profile switcher, parent dashboard, family features |
| **First Login** | Brief notification about "streamlined experience" |
| **No Action Required** | Experience continues unchanged with cleaner UI |

```typescript
// Individual migration script
async function migrateIndividualUser(familyId: Id<'families'>) {
  await ctx.db.patch(familyId, {
    accountType: 'individual'
  });

  // Set localStorage flags on next login via client
  // kidcollect_account_type = 'individual'
  // kidcollect_session_type = 'individual'
}
```

#### 6.3.2 Family Users

Users classified as `family` will receive:

| Aspect | Handling |
|--------|----------|
| **Data Migration** | Set `families.accountType = 'family'` |
| **New Feature Access** | Parent dashboard, kid PIN setup, device management |
| **First Login (Parent)** | Guided tour of new features + PIN setup wizard |
| **Child Profiles** | Exist but cannot use PIN login until parent sets PIN |
| **Optional** | Parent can skip PIN setup (reverts to current shared login) |

```typescript
// Family migration script
async function migrateFamilyUser(familyId: Id<'families'>) {
  await ctx.db.patch(familyId, {
    accountType: 'family'
  });

  // Flag for first-login experience
  await ctx.db.patch(familyId, {
    needsNewFeatureOnboarding: true
  });

  // Child profiles exist but NO childLoginPins entries yet
  // Parent must explicitly create PINs
}
```

#### 6.3.3 Low-Confidence Classifications

For users where `confidence === 'low'`:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FIRST LOGIN: CONFIRM ACCOUNT TYPE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   👋 Welcome back! We've added new features to CardDex.                     │
│                                                                              │
│   To give you the best experience, please confirm:                          │
│                                                                              │
│   ┌─────────────────────────────┐  ┌─────────────────────────────┐          │
│   │                             │  │                             │          │
│   │    👨‍👩‍👧‍👦 This is a Family    │  │       👤 Just Me            │          │
│   │        Account              │  │                             │          │
│   │                             │  │   I'm the only one using    │          │
│   │   Multiple people use       │  │   this account.             │          │
│   │   this account (parents     │  │                             │          │
│   │   and/or kids).             │  │   (Hides family features)   │          │
│   │                             │  │                             │          │
│   └─────────────────────────────┘  └─────────────────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Migration Script Design

#### 6.4.1 Pre-Migration Validation

```typescript
// Run BEFORE migration to identify issues
async function preMigrationValidation() {
  const results = {
    totalFamilies: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
    dataIssues: [] as string[],
    estimatedIndividual: 0,
    estimatedFamily: 0
  };

  const families = await ctx.db.query('families').collect();

  for (const family of families) {
    results.totalFamilies++;

    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', q => q.eq('familyId', family._id))
      .collect();

    // Check for data issues
    if (profiles.length === 0) {
      results.dataIssues.push(`Family ${family._id} has no profiles`);
    }

    const parentCount = profiles.filter(p => p.profileType === 'parent').length;
    if (parentCount > 1) {
      results.dataIssues.push(`Family ${family._id} has ${parentCount} parents`);
    }

    const classification = classifyFamily(family, profiles);

    if (classification.confidence === 'high') results.highConfidence++;
    if (classification.confidence === 'medium') results.mediumConfidence++;
    if (classification.confidence === 'low') results.lowConfidence++;

    if (classification.inferredAccountType === 'individual') {
      results.estimatedIndividual++;
    } else {
      results.estimatedFamily++;
    }
  }

  return results;
}
```

#### 6.4.2 Migration Execution

```typescript
// Main migration function - run in batches
async function executeMigration(options: {
  dryRun: boolean;
  batchSize: number;
  startAfter?: Id<'families'>;
}) {
  const { dryRun, batchSize, startAfter } = options;

  let query = ctx.db.query('families');
  if (startAfter) {
    query = query.filter(q => q.gt(q.field('_id'), startAfter));
  }

  const families = await query.take(batchSize);
  const results: MigrationResult[] = [];

  for (const family of families) {
    const profiles = await ctx.db
      .query('profiles')
      .withIndex('by_family', q => q.eq('familyId', family._id))
      .collect();

    const classification = classifyFamily(family, profiles);

    if (!dryRun) {
      await ctx.db.patch(family._id, {
        accountType: classification.inferredAccountType,
        migrationConfidence: classification.confidence,
        migratedAt: Date.now()
      });

      // Log for audit
      await ctx.db.insert('migrationLog', {
        familyId: family._id,
        fromState: 'legacy',
        toState: classification.inferredAccountType,
        confidence: classification.confidence,
        reason: classification.reason,
        timestamp: Date.now()
      });
    }

    results.push({
      familyId: family._id,
      classification,
      applied: !dryRun
    });
  }

  return {
    processed: results.length,
    lastProcessedId: families[families.length - 1]?._id,
    hasMore: families.length === batchSize,
    results
  };
}
```

### 6.5 Rollback Strategy

#### 6.5.1 Rollback Levels

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ROLLBACK CAPABILITIES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LEVEL 1: Feature Flag Rollback (Instant)                                   │
│  ─────────────────────────────────────────                                   │
│  • Disable kid PIN login via feature flag                                   │
│  • Disable new onboarding flows                                             │
│  • Revert to single login form                                              │
│  • Data remains migrated but features hidden                                │
│  • Recovery time: < 1 minute                                                │
│                                                                              │
│  LEVEL 2: UI Rollback (Deploy)                                              │
│  ─────────────────────────────                                               │
│  • Deploy previous UI version                                               │
│  • accountType field ignored in code                                        │
│  • All users see family features (current behavior)                         │
│  • Recovery time: ~10 minutes (deploy cycle)                                │
│                                                                              │
│  LEVEL 3: Data Rollback (Scripted)                                          │
│  ─────────────────────────────────                                           │
│  • Run reverse migration script                                             │
│  • Remove accountType values                                                │
│  • Delete childLoginPins entries                                            │
│  • Delete deviceSessions entries                                            │
│  • Recovery time: ~30 minutes                                               │
│                                                                              │
│  LEVEL 4: Full Restore (Last Resort)                                        │
│  ───────────────────────────────────                                         │
│  • Restore from pre-migration database backup                               │
│  • Loss of data created post-migration                                      │
│  • Recovery time: ~2 hours                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 6.5.2 Rollback Scripts

```typescript
// Level 1: Feature Flag Rollback
async function rollbackFeatureFlags() {
  await setFeatureFlag('kidPinLogin', false);
  await setFeatureFlag('accountTypeSeparation', false);
  await setFeatureFlag('deviceAuthorization', false);
  // Users will see old UI immediately on next page load
}

// Level 3: Data Rollback
async function rollbackMigrationData() {
  // Remove accountType from all families
  const families = await ctx.db.query('families').collect();
  for (const family of families) {
    await ctx.db.patch(family._id, {
      accountType: undefined,
      migrationConfidence: undefined,
      migratedAt: undefined,
      needsNewFeatureOnboarding: undefined
    });
  }

  // Delete new tables
  const pins = await ctx.db.query('childLoginPins').collect();
  for (const pin of pins) {
    await ctx.db.delete(pin._id);
  }

  const devices = await ctx.db.query('deviceSessions').collect();
  for (const device of devices) {
    await ctx.db.delete(device._id);
  }

  // Clear migration log
  const logs = await ctx.db.query('migrationLog').collect();
  for (const log of logs) {
    await ctx.db.delete(log._id);
  }
}
```

#### 6.5.3 Rollback Decision Matrix

| Issue | Severity | Rollback Level | Decision Maker |
|-------|----------|----------------|----------------|
| Kid PIN login broken | High | Level 1 | On-call engineer |
| Account type misclassified (<1%) | Low | None | Product team |
| Account type misclassified (>5%) | High | Level 3 | Engineering lead |
| Data corruption detected | Critical | Level 4 | Engineering lead + PM |
| Performance degradation (>50%) | High | Level 2 | On-call engineer |
| User complaints about UX | Medium | Level 1 | Product team |

### 6.6 User Communication Plan

#### 6.6.1 Communication Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     USER COMMUNICATION TIMELINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  T-2 WEEKS: Pre-Announcement                                                │
│  ────────────────────────────                                                │
│  • Blog post: "Exciting Updates Coming to CardDex"                          │
│  • In-app banner: "New features coming soon!"                               │
│  • Email to all registered users with preview                               │
│                                                                              │
│  T-1 WEEK: Feature Preview                                                  │
│  ─────────────────────────                                                   │
│  • Detailed feature documentation published                                 │
│  • FAQ page live                                                            │
│  • Beta opt-in for interested users                                         │
│                                                                              │
│  T-0: Launch Day                                                            │
│  ───────────────                                                             │
│  • Email announcement with what's new                                       │
│  • In-app guided tour for first login                                       │
│  • Support team briefed and ready                                           │
│                                                                              │
│  T+1 WEEK: Follow-up                                                        │
│  ──────────────────                                                          │
│  • "How to set up kid PINs" email to family accounts                        │
│  • Collect user feedback                                                    │
│  • Address common issues in FAQ                                             │
│                                                                              │
│  T+1 MONTH: Retrospective                                                   │
│  ────────────────────────                                                    │
│  • Analyze adoption metrics                                                 │
│  • Send follow-up to users who haven't set up PINs                          │
│  • Consider removing old UI code paths                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 6.6.2 Email Templates

**Pre-Announcement Email:**
```
Subject: 🎉 Big Updates Coming to CardDex!

Hi {display_name},

We're excited to announce new features coming to CardDex that will make
managing your collection even better!

Coming Soon:
• Separate experiences for parents and kids
• Quick PIN login for kids (no more typing passwords!)
• Device management for family tablets
• Cleaner, simpler UI based on how you use the app

We'll send you more details next week. In the meantime, keep collecting!

Happy collecting,
The CardDex Team
```

**Launch Day Email (Family Accounts):**
```
Subject: 🆕 Your CardDex is now even better for families!

Hi {display_name},

Great news! CardDex now has features designed specifically for families.

What's new for you:
✨ Kid PIN Login - Set up 5-digit PINs for your kids so they can log in
   without needing your password
🔒 Device Authorization - Approve trusted devices like family tablets
👨‍👩‍👧‍👦 Separate Views - Parents see management tools, kids see just their cards

Get started:
1. Log in to CardDex
2. Go to Parent Dashboard
3. Click "Set Up Kid PINs"

Your existing profiles and collections are exactly where you left them.

Need help? Check out our guide: [link]

Happy collecting,
The CardDex Team
```

**Launch Day Email (Individual Accounts):**
```
Subject: ✨ CardDex just got simpler!

Hi {display_name},

We've made some updates to CardDex to give you a cleaner experience.

What's changed:
• Streamlined navigation - no more family features you weren't using
• Faster performance - optimized for solo collectors
• Same great collection tracking you love

Your collection is exactly where you left it. Just log in and enjoy!

Happy collecting,
The CardDex Team
```

#### 6.6.3 In-App Notifications

**First Login After Migration (Family Account):**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   🎉 Welcome to the new CardDex!                                            │
│                                                                              │
│   We've added features just for families:                                   │
│                                                                              │
│   👶 Kid PIN Login     Kids can log in with a simple 5-digit PIN            │
│   📱 Device Control    Manage which devices kids can use                    │
│   🎯 Parent Dashboard  New hub for managing your family                     │
│                                                                              │
│         [Take a Quick Tour]        [Maybe Later]                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**First Login After Migration (Individual Account):**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   ✨ We've streamlined your experience!                                     │
│                                                                              │
│   CardDex is now optimized for solo collectors like you.                    │
│   We've removed clutter you weren't using.                                  │
│                                                                              │
│   Your collection? Exactly where you left it. 👍                            │
│                                                                              │
│                          [Got it!]                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.7 Migration Monitoring

#### 6.7.1 Key Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Migration script completion rate | 100% | <95% |
| Error rate during migration | <0.1% | >1% |
| Post-migration login success rate | >99% | <95% |
| Kid PIN setup rate (family accounts) | >30% (week 1) | <10% |
| User-reported classification errors | <1% | >5% |
| Support ticket increase | <20% | >50% |
| Performance impact (p95 latency) | <10% increase | >25% increase |

#### 6.7.2 Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MIGRATION MONITORING DASHBOARD                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Migration Progress                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%                    │
│  Families: 15,234 / 15,234                                                   │
│                                                                              │
│  Classification Breakdown                                                    │
│  ┌────────────┬─────────┬───────────────────────────────────┐              │
│  │ Type       │ Count   │                                   │              │
│  ├────────────┼─────────┼───────────────────────────────────┤              │
│  │ Individual │  8,432  │ ████████████████████              │              │
│  │ Family     │  6,802  │ ████████████████                  │              │
│  └────────────┴─────────┴───────────────────────────────────┘              │
│                                                                              │
│  Confidence Distribution                                                     │
│  ┌────────────┬─────────┬───────────────────────────────────┐              │
│  │ Level      │ Count   │                                   │              │
│  ├────────────┼─────────┼───────────────────────────────────┤              │
│  │ High       │ 14,521  │ ████████████████████████████████  │              │
│  │ Medium     │    482  │ █                                 │              │
│  │ Low        │    231  │                                   │              │
│  └────────────┴─────────┴───────────────────────────────────┘              │
│                                                                              │
│  Post-Migration Health                                                       │
│  • Login success rate:     99.7%  ✓                                         │
│  • Error rate:              0.02% ✓                                         │
│  • Support tickets (24h):   12    ✓                                         │
│  • Performance impact:      +3%   ✓                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.8 Migration Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MIGRATION TIMELINE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 1: Preparation                                                        │
│  ────────────────────                                                        │
│  Day 1-3:                                                                    │
│    • Deploy schema additions (non-breaking)                                 │
│    • Create migrationLog table                                              │
│    • Deploy feature flags (all OFF)                                         │
│    • Set up monitoring dashboard                                            │
│                                                                              │
│  PHASE 2: Dry Run                                                           │
│  ───────────────────                                                         │
│  Day 4-5:                                                                    │
│    • Run migration script in dry-run mode                                   │
│    • Analyze classification results                                         │
│    • Review low-confidence cases                                            │
│    • Adjust classification logic if needed                                  │
│    • Take database backup                                                   │
│                                                                              │
│  PHASE 3: Migration Execution                                               │
│  ──────────────────────────────                                              │
│  Day 6:                                                                      │
│    • Final database backup                                                  │
│    • Execute migration script (batched)                                     │
│    • Verify completion                                                      │
│    • Validate sample of migrated accounts                                   │
│                                                                              │
│  PHASE 4: Feature Rollout                                                   │
│  ─────────────────────────                                                   │
│  Day 7:                                                                      │
│    • Enable accountTypeSeparation flag (10% of users)                       │
│    • Monitor for issues                                                     │
│  Day 8:                                                                      │
│    • Increase to 50% if healthy                                             │
│  Day 9:                                                                      │
│    • Increase to 100%                                                       │
│    • Enable kidPinLogin flag (10%)                                          │
│  Day 10:                                                                     │
│    • Increase kidPinLogin to 50%                                            │
│  Day 11:                                                                     │
│    • Full rollout                                                           │
│                                                                              │
│  PHASE 5: Post-Migration                                                    │
│  ──────────────────────────                                                  │
│  Week 2-4:                                                                   │
│    • Monitor adoption metrics                                               │
│    • Address user-reported issues                                           │
│    • Follow-up communications                                               │
│    • Consider removing feature flags                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.9 Edge Cases and Special Handling

#### 6.9.1 Identified Edge Cases

| Edge Case | Handling |
|-----------|----------|
| **Family with 0 profiles** | Mark as data issue, assign `individual` by default |
| **Family with >1 parent** | Flag for manual review, use first parent for migration |
| **Child profile with no parent** | Classify as `family`, prompt user to designate parent |
| **Very old inactive accounts** | Migrate normally, no special treatment |
| **Accounts mid-onboarding** | Complete onboarding first, then apply migration |
| **Beta testers with mixed state** | Reset to clean migrated state |

#### 6.9.2 Data Integrity Checks

```typescript
// Post-migration validation
async function validateMigration() {
  const issues: ValidationIssue[] = [];

  const families = await ctx.db.query('families').collect();

  for (const family of families) {
    // Check accountType is set
    if (!family.accountType) {
      issues.push({
        familyId: family._id,
        issue: 'accountType not set',
        severity: 'high'
      });
    }

    // Check family accounts have at least one profile
    if (family.accountType === 'family') {
      const profiles = await ctx.db
        .query('profiles')
        .withIndex('by_family', q => q.eq('familyId', family._id))
        .collect();

      if (profiles.length === 0) {
        issues.push({
          familyId: family._id,
          issue: 'Family account with no profiles',
          severity: 'high'
        });
      }

      const parentProfiles = profiles.filter(p => p.profileType === 'parent');
      if (parentProfiles.length === 0) {
        issues.push({
          familyId: family._id,
          issue: 'Family account with no parent profile',
          severity: 'medium'
        });
      }
    }

    // Check individual accounts have exactly one profile
    if (family.accountType === 'individual') {
      const profiles = await ctx.db
        .query('profiles')
        .withIndex('by_family', q => q.eq('familyId', family._id))
        .collect();

      if (profiles.length !== 1) {
        issues.push({
          familyId: family._id,
          issue: `Individual account with ${profiles.length} profiles`,
          severity: 'medium'
        });
      }
    }
  }

  return issues;
}
```

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1-2)
1. Add `accountType` to families schema
2. Create `childLoginPins` table
3. Migrate existing families
4. Update AuthForm to persist accountType
5. Create PIN creation/validation utilities

### Phase 2: Kid PIN Login (Week 2-3)
1. Create KidPinEntry component
2. Create kid PIN verification endpoint
3. Update login page with dual mode
4. Create session management for PIN logins
5. Update navigation for kid sessions

### Phase 3: Parent Management (Week 3-4)
1. Add PIN management to parent dashboard
2. Create device authorization flow
3. Build login activity view
4. Add PIN reset functionality

### Phase 4: Device Sessions (Week 4-5)
1. Create deviceSessions table
2. Implement device token generation
3. Add "Remember this device" to parent login
4. Build device authorization prompt
5. Implement device-based quick login

### Phase 5: Polish & Testing (Week 5-6)
1. Accessibility audit
2. Security testing
3. Edge case handling
4. Mobile responsiveness
5. Animation/feedback polish

---

## 8. Key Files to Modify

1. **convex/schema.ts** - Add `accountType`, `childLoginPins`, `deviceSessions`
2. **src/components/auth/AuthForm.tsx** - Persist accountType, add PIN login mode
3. **convex/profiles.ts** - Add kid PIN management mutations
4. **src/hooks/useCurrentProfile.ts** - Support kid session state
5. **src/lib/pinProtection.ts** - Extend for 5-digit kid PINs
6. **src/app/parent-dashboard/page.tsx** - Add PIN/device management

---

## 9. New Components Needed

- `src/components/auth/KidPinEntry.tsx` - Large touch-friendly PIN pad
- `src/components/auth/LoginSelector.tsx` - Choose login method
- `src/components/parent/KidPinManager.tsx` - Create/manage kid PINs
- `src/components/parent/DeviceManager.tsx` - Manage authorized devices
- `src/components/parent/LoginActivity.tsx` - View login history

---

## 10. Beads Epic

This architecture is tracked in epic **CD-bhw**.

---

## 11. Authentication Flow Diagrams

This section provides detailed authentication flow diagrams for all user types.

### 11.1 Login Entry Point Decision Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ARRIVES AT /login                   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CHECK FOR EXISTING SESSION                    │
│           (localStorage/cookie for device token exists?)         │
└─────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
            [HAS SESSION]               [NO SESSION]
                    │                           │
                    ▼                           ▼
    ┌───────────────────────┐   ┌──────────────────────────────────┐
    │ Check session type:   │   │     DISPLAY LOGIN SELECTOR       │
    │ • JWT valid?          │   │                                  │
    │ • Device authorized?  │   │  ┌──────────┐  ┌──────────────┐  │
    │ • Profile active?     │   │  │ 👤 Login │  │ 🔢 Kid PIN   │  │
    └───────────────────────┘   │  │(Email/Pw)│  │ (5 digits)   │  │
             │                  │  └──────────┘  └──────────────┘  │
             ▼                  │                                  │
    ┌───────────────────┐       │  ┌──────────────────────────────┐│
    │ REDIRECT TO APP   │       │  │   ✨ Create New Account     ││
    │ (skip login)      │       │  └──────────────────────────────┘│
    └───────────────────┘       └──────────────────────────────────┘
```

### 11.2 Parent Login Flow (Email/Password)

```
┌─────────────────────────────────────────────────────────────────┐
│               PARENT CLICKS "Log In (Email/Pass)"                │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EMAIL/PASSWORD FORM                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Email:    [________________________]                      │   │
│  │ Password: [________________________]                      │   │
│  │                                                           │   │
│  │ [ ] Remember this device for kid login                    │   │
│  │                                                           │   │
│  │        [        Log In        ]                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONVEX AUTH VALIDATION                        │
│                                                                  │
│  1. Verify email exists in users table                          │
│  2. Validate password against stored hash                        │
│  3. Generate JWT session token                                   │
│  4. Store token in httpOnly cookie                              │
└─────────────────────────────────────────────────────────────────┘
                                  │
                          ┌───────┴───────┐
                          ▼               ▼
                    [SUCCESS]         [FAILURE]
                          │               │
                          │               ▼
                          │    ┌───────────────────────┐
                          │    │ DISPLAY ERROR         │
                          │    │ • Invalid credentials │
                          │    │ • Account locked      │
                          │    │ • Rate limited        │
                          │    └───────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOOKUP FAMILY & PROFILES                      │
│                                                                  │
│  1. Query families table by user email                          │
│  2. Load all profiles for this family                           │
│  3. Determine account type (individual vs family)               │
└─────────────────────────────────────────────────────────────────┘
                                  │
                          ┌───────┴───────┐
                          ▼               ▼
              [FAMILY ACCOUNT]    [INDIVIDUAL ACCOUNT]
                          │               │
                          ▼               │
┌────────────────────────────────┐        │
│ CHECK "Remember Device" BOX    │        │
│                                │        │
│ If checked:                    │        │
│ 1. Generate deviceToken        │        │
│ 2. Create deviceSessions row   │        │
│ 3. Store token in cookie       │        │
│ 4. Kids can now use PIN here   │        │
└────────────────────────────────┘        │
                          │               │
                          ▼               │
┌────────────────────────────────┐        │
│ STORE ACTIVE PROFILE           │        │
│                                │        │
│ localStorage:                  │        │
│ • kidcollect_profile_id        │        │
│ • kidcollect_session_type      │        │
│   = 'parent'                   │        │
└────────────────────────────────┘        │
                          │               │
                          └───────┬───────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CHECK ONBOARDING STATE                      │
│                                                                  │
│  • onboardingCompleted: true? → /dashboard                      │
│  • onboardingCompleted: false? → /onboarding                    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                          ┌───────┴───────┐
                          ▼               ▼
                  [ONBOARDED]     [NOT ONBOARDED]
                          │               │
                          ▼               ▼
              ┌───────────────┐  ┌───────────────────┐
              │ REDIRECT TO   │  │ REDIRECT TO       │
              │ /dashboard    │  │ /onboarding       │
              └───────────────┘  └───────────────────┘
```

### 11.3 Kid PIN Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  KID CLICKS "Kid PIN" BUTTON                     │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CHECK DEVICE AUTHORIZATION                     │
│                                                                  │
│  Query deviceSessions where:                                     │
│  • deviceToken matches cookie                                    │
│  • isActive = true                                              │
│  • expiresAt > now()                                            │
└─────────────────────────────────────────────────────────────────┘
                                  │
                          ┌───────┴───────┐
                          ▼               ▼
               [DEVICE AUTHORIZED]  [NOT AUTHORIZED]
                          │               │
                          │               ▼
                          │    ┌───────────────────────┐
                          │    │ SHOW MESSAGE:         │
                          │    │ "Ask a parent to log  │
                          │    │ in first to enable    │
                          │    │ kid PIN on this       │
                          │    │ device."              │
                          │    │                       │
                          │    │ [Back] [Parent Login] │
                          │    └───────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      KID PIN ENTRY UI                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │                    ⭐ Enter Your PIN ⭐                   │   │
│  │                                                           │   │
│  │                    ○ ○ ○ ○ ○                              │   │
│  │                   (dots fill as typed)                    │   │
│  │                                                           │   │
│  │        ┌───┐ ┌───┐ ┌───┐                                  │   │
│  │        │ 1 │ │ 2 │ │ 3 │                                  │   │
│  │        └───┘ └───┘ └───┘                                  │   │
│  │        ┌───┐ ┌───┐ ┌───┐                                  │   │
│  │        │ 4 │ │ 5 │ │ 6 │                                  │   │
│  │        └───┘ └───┘ └───┘                                  │   │
│  │        ┌───┐ ┌───┐ ┌───┐                                  │   │
│  │        │ 7 │ │ 8 │ │ 9 │                                  │   │
│  │        └───┘ └───┘ └───┘                                  │   │
│  │             ┌───┐ ┌───┐                                   │   │
│  │             │ 0 │ │ ⌫ │                                   │   │
│  │             └───┘ └───┘                                   │   │
│  │                                                           │   │
│  │            [Forgot PIN? Get Parent]                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  │ (after 5 digits entered)
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PIN VALIDATION                             │
│                                                                  │
│  Server-side (Convex mutation):                                  │
│                                                                  │
│  1. Get familyId from deviceSession.familyId                    │
│  2. Query childLoginPins for this family                        │
│  3. For each pin record:                                        │
│     a. Check if lockedUntil > now() → skip (locked)             │
│     b. Hash input PIN with record's salt                        │
│     c. Compare hash                                             │
│     d. If match → found profile!                                │
│                                                                  │
│  4. If no match found:                                          │
│     a. Increment failedAttempts on all family PINs              │
│     b. If failedAttempts >= 5:                                  │
│        Set lockedUntil = now() + 15 minutes                     │
│     c. Return error                                             │
└─────────────────────────────────────────────────────────────────┘
                                  │
                          ┌───────┴───────┐
                          ▼               ▼
                    [PIN VALID]      [PIN INVALID]
                          │               │
                          │               ▼
                          │    ┌──────────────────────────┐
                          │    │ SHOW ERROR:              │
                          │    │                          │
                          │    │ If locked:               │
                          │    │ "Too many tries! Wait    │
                          │    │ 15 minutes or get        │
                          │    │ parent help."            │
                          │    │                          │
                          │    │ If not locked:           │
                          │    │ "Oops! That PIN didn't   │
                          │    │ work. Try again!"        │
                          │    │ (X attempts remaining)   │
                          │    └──────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CREATE KID SESSION                            │
│                                                                  │
│  1. Reset failedAttempts to 0                                   │
│  2. Update lastUsedAt on deviceSession                          │
│  3. Generate limited-scope session token                        │
│  4. Store in localStorage:                                      │
│     • kidcollect_profile_id = profile._id                       │
│     • kidcollect_session_type = 'kid_pin'                       │
│     • kidcollect_family_id = family._id                         │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  REDIRECT TO /dashboard                          │
│                                                                  │
│  Kid session features:                                           │
│  • Full collection access (read/write)                          │
│  • No parent dashboard access                                    │
│  • No profile management                                        │
│  • "Switch Kid" requires another kid's PIN                      │
│  • "Get Parent" returns to login screen                         │
│  • No traditional "logout" - just "Get Parent"                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.4 Individual Collector Login Flow

```
┌─────────────────────────────────────────────────────────────────┐
│               INDIVIDUAL CLICKS "Log In"                         │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SAME EMAIL/PASSWORD FORM                         │
│           (identical to parent login form)                       │
│                                                                  │
│  Note: "Remember device" checkbox NOT shown for                 │
│  individual accounts (no kid PIN feature)                        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONVEX AUTH VALIDATION                        │
│                   (same as parent flow)                          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                          ┌───────┴───────┐
                          ▼               ▼
                    [SUCCESS]         [FAILURE]
                          │               │
                          │               ▼
                          │    ┌───────────────────────┐
                          │    │ DISPLAY ERROR         │
                          │    └───────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LOOKUP FAMILY                                 │
│                                                                  │
│  1. Query families by email                                     │
│  2. Check family.accountType                                    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              VERIFY accountType == 'individual'                  │
│                                                                  │
│  If accountType is 'family', this is NOT an individual          │
│  → Proceed with parent flow instead                             │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                INDIVIDUAL SESSION SETUP                          │
│                                                                  │
│  localStorage:                                                   │
│  • kidcollect_profile_id = single profile ID                    │
│  • kidcollect_session_type = 'individual'                       │
│  • kidcollect_account_type = 'individual'                       │
│                                                                  │
│  UI Flags:                                                       │
│  • hideProfileSwitcher = true                                   │
│  • hideParentDashboard = true                                   │
│  • hideFamilyFeatures = true                                    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  REDIRECT TO /dashboard                          │
│                                                                  │
│  Individual UI features:                                         │
│  • Personal collection only                                      │
│  • No profile switcher in header                                │
│  • No "Parent Dashboard" link                                   │
│  • No family leaderboard                                        │
│  • Standard "Log Out" button                                    │
│  • All personal settings available                              │
└─────────────────────────────────────────────────────────────────┘
```

### 11.5 Session Management Strategy

#### 11.5.1 Session Types

```
┌─────────────────────────────────────────────────────────────────┐
│                      SESSION TYPE HIERARCHY                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FULL SESSION (JWT-based)                                       │
│  ├── Type: 'parent' or 'individual'                             │
│  ├── Storage: httpOnly cookie + localStorage                    │
│  ├── Lifetime: 7 days (renewable)                               │
│  ├── Permissions: FULL                                          │
│  │   • All CRUD operations                                      │
│  │   • Profile management                                       │
│  │   • Family settings                                          │
│  │   • Device authorization                                     │
│  │   • Account settings                                         │
│  └── Logout: Clears all tokens                                  │
│                                                                  │
│  LIMITED SESSION (PIN-based)                                    │
│  ├── Type: 'kid_pin'                                            │
│  ├── Storage: localStorage only (no JWT)                        │
│  ├── Lifetime: Until "Get Parent" or browser close              │
│  ├── Permissions: LIMITED                                       │
│  │   • Collection CRUD (own profile only)                       │
│  │   • View own stats/achievements                              │
│  │   • NO profile management                                    │
│  │   • NO family settings                                       │
│  │   • NO device management                                     │
│  │   • NO account settings                                      │
│  └── Exit: "Get Parent" returns to login                        │
│                                                                  │
│  DEVICE AUTHORIZATION (cookie-based)                            │
│  ├── Type: deviceToken                                          │
│  ├── Storage: httpOnly cookie                                   │
│  ├── Lifetime: 30 days (renewed on use)                         │
│  ├── Purpose: Enable kid PIN login on device                    │
│  └── Revocation: Parent can revoke from any device              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 11.5.2 Session Storage Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER STORAGE LAYOUT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  COOKIES (httpOnly, Secure, SameSite=Strict)                    │
│  ├── convex_auth_token     JWT from Convex Auth                 │
│  └── carddex_device_token  Device authorization token           │
│                                                                  │
│  LOCALSTORAGE                                                    │
│  ├── kidcollect_profile_id      Current active profile ID       │
│  ├── kidcollect_session_type    'parent'|'individual'|'kid_pin' │
│  ├── kidcollect_family_id       Family ID for current session   │
│  └── kidcollect_account_type    'individual'|'family'           │
│                                                                  │
│  SESSION RESTORATION ON PAGE LOAD                                │
│  ├── 1. Check convex_auth_token cookie                          │
│  │      → If valid JWT, restore full session                    │
│  ├── 2. Check localStorage session_type                         │
│  │      → If 'kid_pin', verify device still authorized          │
│  └── 3. If no valid session, redirect to /login                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 11.5.3 Profile Switching Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROFILE SWITCH REQUEST                        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│               CHECK CURRENT SESSION TYPE                         │
└─────────────────────────────────────────────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
        [PARENT]           [KID_PIN]         [INDIVIDUAL]
              │                   │                   │
              ▼                   ▼                   ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │ FREE SWITCH     │ │ PIN REQUIRED    │ │ N/A             │
    │                 │ │                 │ │                 │
    │ Parent can      │ │ To switch to    │ │ Individual has  │
    │ switch to any   │ │ another kid,    │ │ only one        │
    │ profile without │ │ that kid must   │ │ profile.        │
    │ re-auth.        │ │ enter THEIR PIN │ │                 │
    │                 │ │                 │ │ No switcher     │
    │ Updates:        │ │ Prevents kids   │ │ shown in UI.    │
    │ localStorage    │ │ from accessing  │ │                 │
    │ profile_id      │ │ sibling data.   │ │                 │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
              │                   │
              ▼                   ▼
    ┌─────────────────┐ ┌─────────────────┐
    │ SELECT PROFILE  │ │ MINI PIN ENTRY  │
    │                 │ │                 │
    │ Dropdown shows  │ │ "Enter {Name}'s │
    │ all family      │ │ PIN to switch"  │
    │ profiles with   │ │                 │
    │ avatars.        │ │ ○ ○ ○ ○ ○       │
    │                 │ │                 │
    │ Instant switch  │ │ [Cancel][✓]    │
    │ on click.       │ │                 │
    └─────────────────┘ └─────────────────┘
```

#### 11.5.4 Session Timeout and Renewal

```
┌─────────────────────────────────────────────────────────────────┐
│                  SESSION LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FULL SESSION (Parent/Individual)                               │
│  ├── Initial lifetime: 7 days                                   │
│  ├── Renewal: On any authenticated API call                     │
│  ├── Max lifetime: 30 days (then must re-login)                 │
│  └── On expiry:                                                 │
│      1. Clear all auth tokens                                   │
│      2. Redirect to /login                                      │
│      3. Show "Session expired, please log in again"             │
│                                                                  │
│  KID PIN SESSION                                                 │
│  ├── No explicit timeout                                        │
│  ├── Ends when:                                                 │
│      • "Get Parent" clicked                                     │
│      • Browser/tab closed                                       │
│      • Device authorization revoked                             │
│      • Device token expires (30 days)                           │
│  └── On end:                                                    │
│      1. Clear localStorage profile_id                           │
│      2. Return to login selector                                │
│      3. Device token remains (can PIN login again)              │
│                                                                  │
│  DEVICE AUTHORIZATION                                           │
│  ├── Initial lifetime: 30 days                                  │
│  ├── Renewal: Extended 30 days on each PIN login                │
│  ├── Revocation: Parent can revoke from device manager          │
│  └── On expiry:                                                 │
│      1. Kid PIN login unavailable on this device                │
│      2. Parent must re-authorize                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 11.5.5 Shared Device Scenario

```
┌─────────────────────────────────────────────────────────────────┐
│                 SHARED DEVICE (Family iPad)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SETUP SCENARIO:                                                 │
│  1. Parent logs in on family iPad                               │
│  2. Checks "Remember this device for kid login"                 │
│  3. iPad now has deviceToken cookie                             │
│  4. Parent logs out or closes browser                           │
│                                                                  │
│  DAILY USE SCENARIO:                                             │
│  1. Kid opens CardDex on iPad                                   │
│  2. Sees login screen with "Kid PIN" option                     │
│  3. Enters their 5-digit PIN                                    │
│  4. PIN validated against family's childLoginPins               │
│  5. Kid gets their personal dashboard                           │
│  6. Sibling wants to use → clicks "Switch Kid"                  │
│  7. Sibling enters THEIR PIN                                    │
│  8. Sibling gets their personal dashboard                       │
│                                                                  │
│  PARENT OVERRIDE:                                                │
│  1. Parent can always use "Log In" with email/password          │
│  2. This gives full session with all permissions                │
│  3. Parent can then manage kids, change settings, etc.          │
│  4. Parent logging out does NOT affect device authorization     │
│                                                                  │
│  SECURITY:                                                       │
│  • Kids cannot access each other's data without PIN             │
│  • Kids cannot access parent dashboard                          │
│  • Kids cannot manage profiles or settings                      │
│  • Device token alone is not enough - PIN still required        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.6 PIN Validation Approach

#### 11.6.1 Server-Side PIN Validation (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│                  WHY SERVER-SIDE VALIDATION                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SECURITY BENEFITS:                                              │
│  ✓ PIN hashes never leave the server                            │
│  ✓ Rate limiting enforced server-side (can't bypass)            │
│  ✓ Lockout state stored in database (persistent across devices) │
│  ✓ Audit logging of all attempts                                │
│  ✓ Can update security rules without client update              │
│                                                                  │
│  TRADEOFFS:                                                      │
│  ✗ Requires network call for each attempt                       │
│  ✗ Won't work offline                                           │
│  ✗ Slightly slower feedback (network latency)                   │
│                                                                  │
│  DECISION: Server-side validation is required for security.     │
│  PIN attempts are infrequent enough that latency is acceptable. │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 11.6.2 PIN Hash Algorithm

```
┌─────────────────────────────────────────────────────────────────┐
│                    PIN HASHING PROCESS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ALGORITHM: PBKDF2-SHA256                                        │
│  ITERATIONS: 100,000                                             │
│  SALT: 16 random bytes (unique per PIN)                         │
│  OUTPUT: 32 bytes (256 bits)                                    │
│                                                                  │
│  STORAGE FORMAT:                                                 │
│  pinHash = base64(salt) + "." + base64(hash)                    │
│                                                                  │
│  EXAMPLE:                                                        │
│  Input PIN: "12345"                                              │
│  Salt: "a1b2c3d4e5f6g7h8" (random)                              │
│  Hash: PBKDF2("12345", salt, 100000)                            │
│  Stored: "YTFiMmMzZDRlNWY2ZzdoOA==.aGFzaGVkX3Bpbl92YWx1ZQ=="   │
│                                                                  │
│  VERIFICATION:                                                   │
│  1. Split stored value on "."                                   │
│  2. Decode salt from base64                                     │
│  3. Hash input PIN with same salt and iterations                │
│  4. Compare resulting hash to stored hash                       │
│  5. Use constant-time comparison to prevent timing attacks      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 11.6.3 Rate Limiting Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                   PIN RATE LIMITING                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ATTEMPT TRACKING:                                               │
│  • Tracked per-family (not per-profile)                         │
│  • Stored in childLoginPins.failedAttempts                      │
│  • Reset to 0 on successful login                               │
│                                                                  │
│  LOCKOUT RULES:                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ Attempts │ Action                                    │       │
│  ├──────────────────────────────────────────────────────┤       │
│  │ 1-4      │ Show remaining attempts                   │       │
│  │ 5        │ Lock for 15 minutes                       │       │
│  │ 6-9      │ Show remaining attempts after unlock      │       │
│  │ 10       │ Lock for 1 hour                           │       │
│  │ 11+      │ Lock for 1 hour, alert parent            │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
│  LOCKOUT NOTIFICATION:                                           │
│  After 10 failed attempts, send email to parent:                │
│  "Multiple failed PIN attempts detected on [device name].       │
│   If this wasn't you or your children, please check your        │
│   family's PIN settings."                                       │
│                                                                  │
│  BYPASS:                                                         │
│  • Parent can always log in with email/password                 │
│  • Parent can reset lockout from device manager                 │
│  • Parent can change/reset kid PINs                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.7 Account Creation Flows

#### 11.7.1 New Family Account

```
┌─────────────────────────────────────────────────────────────────┐
│                  CREATE FAMILY ACCOUNT                           │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ACCOUNT TYPE SELECTION                        │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │  👨‍👩‍👧‍👦 Family Account  │  │  👤 Just Me           │             │
│  │                      │  │                      │             │
│  │  Multiple profiles   │  │  Solo collector      │             │
│  │  Parent dashboard    │  │  Simple experience   │             │
│  │  Kid PIN login       │  │  No family features  │             │
│  └──────────────────────┘  └──────────────────────┘             │
│                                                                  │
│           ↓ (User selects Family Account)                       │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PARENT ACCOUNT CREATION                         │
│                                                                  │
│  Email:    [_______________________________]                     │
│  Password: [_______________________________]                     │
│  Confirm:  [_______________________________]                     │
│                                                                  │
│  [        Create Parent Account        ]                        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONVEX AUTH SIGNUP                            │
│                                                                  │
│  1. Create user in Convex Auth                                  │
│  2. Create family with accountType = 'family'                   │
│  3. Create parent profile (profileType = 'parent')              │
│  4. Generate JWT session                                        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  ONBOARDING: ADD CHILDREN                        │
│                                                                  │
│  "Who will be using CardDex?"                                   │
│                                                                  │
│  Your Profile: [Parent Name: ____________]                      │
│                                                                  │
│  Add Kids:                                                       │
│  ┌─────────────────────────────────────────────┐                │
│  │ 👦 [Child Name] [PIN: ○○○○○] [Avatar ▼]    │ [✕]            │
│  │ 👧 [Child Name] [PIN: ○○○○○] [Avatar ▼]    │ [✕]            │
│  │                                             │                │
│  │ [+ Add Another Kid]                         │                │
│  └─────────────────────────────────────────────┘                │
│                                                                  │
│  [Skip - I'll do this later]  [Continue →]                      │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CREATE CHILD PROFILES                         │
│                                                                  │
│  For each child:                                                 │
│  1. Create profile (profileType = 'child')                      │
│  2. Create childLoginPin record with hashed PIN                 │
│  3. Validate PIN rules (no sequential, unique in family)        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  REDIRECT TO PARENT DASHBOARD                    │
│                                                                  │
│  Show welcome message with:                                      │
│  • Quick start guide                                            │
│  • How kids can log in with PIN                                 │
│  • Device authorization prompt                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### 11.7.2 New Individual Account

```
┌─────────────────────────────────────────────────────────────────┐
│                CREATE INDIVIDUAL ACCOUNT                         │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ACCOUNT TYPE SELECTION                        │
│                                                                  │
│           (User selects "Just Me")                              │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  ACCOUNT CREATION FORM                           │
│                                                                  │
│  Display Name: [_______________________________]                 │
│  Email:        [_______________________________]                 │
│  Password:     [_______________________________]                 │
│  Confirm:      [_______________________________]                 │
│                                                                  │
│  [        Create Account        ]                               │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONVEX AUTH SIGNUP                            │
│                                                                  │
│  1. Create user in Convex Auth                                  │
│  2. Create family with accountType = 'individual'               │
│  3. Create single profile (NO profileType needed)               │
│  4. Generate JWT session                                        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│               SIMPLIFIED ONBOARDING                              │
│                                                                  │
│  • No child profile setup                                       │
│  • No PIN configuration                                         │
│  • Straight to collection setup                                 │
│  • Choose favorite card game(s)                                 │
│  • Optional avatar selection                                    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  REDIRECT TO DASHBOARD                           │
│                                                                  │
│  Individual UI:                                                  │
│  • No profile switcher                                          │
│  • No parent dashboard link                                     │
│  • No family features                                           │
│  • Clean, simple collector experience                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. UI/UX Wireframes for Login Experiences

This section provides detailed wireframes and UX descriptions for all login-related user interfaces.

### 12.1 Landing Page Wireframe

The landing page is the first screen users see when visiting CardDex. It must accommodate three distinct user journeys: returning users (parent/individual login), kids with PINs, and new users creating accounts.

#### 12.1.1 Desktop Landing Page

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🃏 CardDex                                           [Already have account?]│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                                                                              │
│                    ╔═══════════════════════════════════╗                     │
│                    ║                                   ║                     │
│                    ║    🎴 Welcome to CardDex! 🎴     ║                     │
│                    ║                                   ║                     │
│                    ║   The fun way to track your      ║                     │
│                    ║     trading card collection       ║                     │
│                    ║                                   ║                     │
│                    ╚═══════════════════════════════════╝                     │
│                                                                              │
│     ┌─────────────────────────────────────────────────────────────────┐     │
│     │                                                                 │     │
│     │                    How do you want to start?                    │     │
│     │                                                                 │     │
│     └─────────────────────────────────────────────────────────────────┘     │
│                                                                              │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐       │
│   │                   │  │                   │  │                   │       │
│   │   👨‍👩‍👧‍👦             │  │      👤           │  │      🔢           │       │
│   │                   │  │                   │  │                   │       │
│   │   I'm a Parent    │  │   I'm a Collector │  │   Kid Login       │       │
│   │                   │  │                   │  │                   │       │
│   │   Manage your     │  │   Track my own    │  │   Enter your      │       │
│   │   family's cards  │  │   collection      │  │   5-digit PIN     │       │
│   │                   │  │                   │  │                   │       │
│   └───────────────────┘  └───────────────────┘  └───────────────────┘       │
│                                                                              │
│                                                                              │
│   ─────────────────────── Already have an account? ───────────────────────  │
│                                                                              │
│                           [     Sign In     ]                               │
│                                                                              │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ 🎮 Pokemon  •  ⚔️ Yu-Gi-Oh  •  🏴‍☠️ One Piece  •  ✨ Lorcana        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 12.1.2 Mobile Landing Page

```
┌────────────────────────────────┐
│  🃏 CardDex            [Sign In]│
├────────────────────────────────┤
│                                │
│   ╔════════════════════════╗   │
│   ║                        ║   │
│   ║  🎴 Welcome to CardDex ║   │
│   ║                        ║   │
│   ║    Track your cards    ║   │
│   ║    the fun way!        ║   │
│   ║                        ║   │
│   ╚════════════════════════╝   │
│                                │
│   ┌────────────────────────┐   │
│   │                        │   │
│   │     👨‍👩‍👧‍👦 I'm a Parent    │   │
│   │                        │   │
│   │   Manage your family's │   │
│   │   card collections     │   │
│   │                        │   │
│   │   [   Get Started   ]  │   │
│   │                        │   │
│   └────────────────────────┘   │
│                                │
│   ┌────────────────────────┐   │
│   │                        │   │
│   │   👤 I'm a Collector   │   │
│   │                        │   │
│   │   Track my own cards   │   │
│   │                        │   │
│   │   [   Get Started   ]  │   │
│   │                        │   │
│   └────────────────────────┘   │
│                                │
│   ┌────────────────────────┐   │
│   │                        │   │
│   │   🔢 Kid Login (PIN)   │   │
│   │                        │   │
│   │   Already have a PIN?  │   │
│   │   Tap to enter it!     │   │
│   │                        │   │
│   │   [   Enter PIN   ]    │   │
│   │                        │   │
│   └────────────────────────┘   │
│                                │
└────────────────────────────────┘
```

#### 12.1.3 Landing Page UX Specifications

| Element | Behavior |
|---------|----------|
| **Parent Button** | Opens family account signup flow |
| **Collector Button** | Opens individual account signup flow |
| **Kid Login Button** | Opens PIN entry pad (if device authorized) or shows "Ask parent" message |
| **Sign In Link** | Opens email/password login form for returning users |
| **Card Game Icons** | Decorative, shows supported games |

**Visual Design Guidelines:**
- Friendly, colorful design appealing to all ages
- Large touch targets (minimum 48x48px) for kid-friendly interaction
- Clear visual hierarchy with the three main paths
- Card game icons provide context without overwhelming
- "Sign In" secondary to avoid confusion with signup paths

### 12.2 Parent Onboarding Flow

The parent onboarding flow guides new family account users through setting up their account, creating child profiles, and configuring PINs.

#### 12.2.1 Step 1: Account Creation

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🃏 CardDex                                    Step 1 of 4 ─────────○───────│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                      Create Your Parent Account                              │
│                                                                              │
│     ┌────────────────────────────────────────────────────────────────┐      │
│     │                                                                │      │
│     │   Your Name                                                    │      │
│     │   ┌────────────────────────────────────────────────────────┐  │      │
│     │   │ Sarah                                                  │  │      │
│     │   └────────────────────────────────────────────────────────┘  │      │
│     │                                                                │      │
│     │   Email Address                                                │      │
│     │   ┌────────────────────────────────────────────────────────┐  │      │
│     │   │ sarah@example.com                                      │  │      │
│     │   └────────────────────────────────────────────────────────┘  │      │
│     │                                                                │      │
│     │   Password                                                     │      │
│     │   ┌────────────────────────────────────────────────────────┐  │      │
│     │   │ ••••••••••••                                           │  │      │
│     │   └────────────────────────────────────────────────────────┘  │      │
│     │   ℹ️ At least 8 characters                                    │      │
│     │                                                                │      │
│     │   Confirm Password                                             │      │
│     │   ┌────────────────────────────────────────────────────────┐  │      │
│     │   │ ••••••••••••                                           │  │      │
│     │   └────────────────────────────────────────────────────────┘  │      │
│     │                                                                │      │
│     └────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│                      [          Continue          ]                         │
│                                                                              │
│                  Already have an account? [Sign in]                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 12.2.2 Step 2: Add Children

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🃏 CardDex                                    Step 2 of 4 ─────○────────────│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                        Who's in your family?                                 │
│                                                                              │
│     ┌────────────────────────────────────────────────────────────────┐      │
│     │                                                                │      │
│     │   Add your kids so they can track their own collections!      │      │
│     │                                                                │      │
│     │   ┌────────────────────────────────────────────────────────┐  │      │
│     │   │  🧒  │  Name: [Max                              ] [✕]  │  │      │
│     │   └────────────────────────────────────────────────────────┘  │      │
│     │                                                                │      │
│     │   ┌────────────────────────────────────────────────────────┐  │      │
│     │   │  👧  │  Name: [Emma                             ] [✕]  │  │      │
│     │   └────────────────────────────────────────────────────────┘  │      │
│     │                                                                │      │
│     │               [  ➕ Add Another Kid  ]                         │      │
│     │                                                                │      │
│     │   ─────────────────────────────────────────────────────────   │      │
│     │                                                                │      │
│     │   💡 You can add up to 3 kid profiles (4 total with you)     │      │
│     │                                                                │      │
│     └────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│              [  ← Back  ]              [  Continue  ]                       │
│                                                                              │
│                       [Skip - I'll do this later]                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 12.2.3 Step 3: Set Up PINs

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🃏 CardDex                                    Step 3 of 4 ───────────○──────│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                      Create PINs for Quick Login                             │
│                                                                              │
│     ┌────────────────────────────────────────────────────────────────┐      │
│     │                                                                │      │
│     │   Each kid gets their own 5-digit PIN to log in quickly!      │      │
│     │                                                                │      │
│     │   ┌────────────────────────────────────────────────────────┐  │      │
│     │   │                                                        │  │      │
│     │   │   🧒 Max's PIN                                         │  │      │
│     │   │                                                        │  │      │
│     │   │   ○ ○ ○ ○ ○                                            │  │      │
│     │   │   [1][2][3]                                            │  │      │
│     │   │   [4][5][6]                                            │  │      │
│     │   │   [7][8][9]                                            │  │      │
│     │   │      [0][⌫]                                            │  │      │
│     │   │                                                        │  │      │
│     │   │   ⚠️ Avoid easy PINs like 12345 or 11111               │  │      │
│     │   │                                                        │  │      │
│     │   └────────────────────────────────────────────────────────┘  │      │
│     │                                                                │      │
│     │   ┌────────────────────────────────────────────────────────┐  │      │
│     │   │   👧 Emma's PIN                                        │  │      │
│     │   │   ● ● ● ● ●  ✓ PIN set!                               │  │      │
│     │   │   [Change PIN]                                         │  │      │
│     │   └────────────────────────────────────────────────────────┘  │      │
│     │                                                                │      │
│     └────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│              [  ← Back  ]              [  Continue  ]                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 12.2.4 Step 4: Choose Avatars

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🃏 CardDex                                    Step 4 of 4 ────────────────○─│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                      Pick Your Avatars!                                      │
│                                                                              │
│     ┌────────────────────────────────────────────────────────────────┐      │
│     │                                                                │      │
│     │   🧒 Max                               👧 Emma                 │      │
│     │                                                                │      │
│     │   ┌───┬───┬───┬───┐                   ┌───┬───┬───┬───┐       │      │
│     │   │🦊│🐺│🦁│🐯│                   │🦊│🐺│🦁│🐯│       │      │
│     │   ├───┼───┼───┼───┤                   ├───┼───┼───┼───┤       │      │
│     │   │🐲│🦖│🐉│🐊│                   │🐲│🦖│🐉│🐊│       │      │
│     │   ├───┼───┼───┼───┤                   ├───┼───┼───┼───┤       │      │
│     │   │🌟│⚡│🔥│💎│                   │🌟│⚡│🔥│💎│       │      │
│     │   └───┴───┴───┴───┘                   └───┴───┴───┴───┘       │      │
│     │                                                                │      │
│     │   Selected: 🐲                        Selected: 🌟             │      │
│     │                                                                │      │
│     └────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│                      [     Finish Setup!     ]                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 12.2.5 Onboarding Complete

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🃏 CardDex                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                                                                              │
│                      🎉 You're all set up! 🎉                               │
│                                                                              │
│                                                                              │
│     ┌────────────────────────────────────────────────────────────────┐      │
│     │                                                                │      │
│     │              Your family is ready to collect!                  │      │
│     │                                                                │      │
│     │     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │      │
│     │     │             │  │             │  │             │         │      │
│     │     │     👤      │  │     🐲      │  │     🌟      │         │      │
│     │     │    Sarah    │  │     Max     │  │    Emma     │         │      │
│     │     │   (Parent)  │  │   PIN: ●●●●●│  │   PIN: ●●●●●│         │      │
│     │     │             │  │             │  │             │         │      │
│     │     └─────────────┘  └─────────────┘  └─────────────┘         │      │
│     │                                                                │      │
│     │   ─────────────────────────────────────────────────────────   │      │
│     │                                                                │      │
│     │   📱 Pro tip: On a shared device, check "Remember this        │      │
│     │      device" so kids can log in with just their PIN!          │      │
│     │                                                                │      │
│     └────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│                     [   Go to Parent Dashboard   ]                          │
│                                                                              │
│                  [Browse as myself]    [Switch to a kid]                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 12.3 Kid Login Experience

The kid login experience is designed to be simple, colorful, and touch-friendly for young users.

#### 12.3.1 Device Not Authorized State

When a kid tries to use PIN login on a device that hasn't been authorized by a parent:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🃏 CardDex                                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                                                                              │
│                                                                              │
│                         🔒 Oops!                                            │
│                                                                              │
│     ┌────────────────────────────────────────────────────────────────┐      │
│     │                                                                │      │
│     │                                                                │      │
│     │       This device isn't set up for kid login yet.             │      │
│     │                                                                │      │
│     │       Ask a parent to log in first and check                  │      │
│     │       "Remember this device" to enable PIN login!             │      │
│     │                                                                │      │
│     │                                                                │      │
│     │             🖼️ [Illustration: Parent with phone]               │      │
│     │                                                                │      │
│     │                                                                │      │
│     └────────────────────────────────────────────────────────────────┘      │
│                                                                              │
│                                                                              │
│              [  ← Back  ]        [  Parent Login  ]                         │
│                                                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 12.3.2 PIN Entry Screen (Device Authorized)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🃏 CardDex                                                          [← Back]│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                                                                              │
│                         ⭐ Enter Your PIN! ⭐                               │
│                                                                              │
│                                                                              │
│                     ╭─────────────────────────╮                              │
│                     │                         │                              │
│                     │     ○   ○   ○   ○   ○   │                              │
│                     │                         │                              │
│                     ╰─────────────────────────╯                              │
│                                                                              │
│                                                                              │
│                ┌───────┐  ┌───────┐  ┌───────┐                               │
│                │       │  │       │  │       │                               │
│                │   1   │  │   2   │  │   3   │                               │
│                │       │  │       │  │       │                               │
│                └───────┘  └───────┘  └───────┘                               │
│                                                                              │
│                ┌───────┐  ┌───────┐  ┌───────┐                               │
│                │       │  │       │  │       │                               │
│                │   4   │  │   5   │  │   6   │                               │
│                │       │  │       │  │       │                               │
│                └───────┘  └───────┘  └───────┘                               │
│                                                                              │
│                ┌───────┐  ┌───────┐  ┌───────┐                               │
│                │       │  │       │  │       │                               │
│                │   7   │  │   8   │  │   9   │                               │
│                │       │  │       │  │       │                               │
│                └───────┘  └───────┘  └───────┘                               │
│                                                                              │
│                          ┌───────┐  ┌───────┐                                │
│                          │       │  │       │                                │
│                          │   0   │  │   ⌫   │                                │
│                          │       │  │       │                                │
│                          └───────┘  └───────┘                                │
│                                                                              │
│                   [Forgot your PIN? Get a parent]                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 12.3.3 PIN Entry - Digits Entered

As the kid enters digits, dots fill in and after 2-3 digits, we show matching avatars:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🃏 CardDex                                                          [← Back]│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                                                                              │
│                         ⭐ Enter Your PIN! ⭐                               │
│                                                                              │
│                                                                              │
│                     ╭─────────────────────────╮                              │
│                     │                         │                              │
│                     │     ●   ●   ●   ○   ○   │                              │
│                     │                         │                              │
│                     │         🐲 Max?         │                              │
│                     │                         │                              │
│                     ╰─────────────────────────╯                              │
│                                                                              │
│                                                                              │
│                ┌───────┐  ┌───────┐  ┌───────┐                               │
│                │       │  │       │  │       │                               │
│                │   1   │  │   2   │  │   3   │                               │
│                ...                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 12.3.4 PIN Error States

**Wrong PIN:**
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                    ❌ Oops, try again!                     │
│                                                            │
│              ╭─────────────────────────╮                   │
│              │     ●   ●   ●   ●   ●   │    ← shake        │
│              │                         │      animation    │
│              │   That PIN didn't work  │                   │
│              │   4 tries left          │                   │
│              ╰─────────────────────────╯                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Locked Out:**
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                    ⏰ Take a break!                        │
│                                                            │
│              ╭─────────────────────────╮                   │
│              │                         │                   │
│              │   Too many tries!       │                   │
│              │                         │                   │
│              │   Wait 15 minutes or    │                   │
│              │   ask a parent for help │                   │
│              │                         │                   │
│              │   Time left: 14:32      │                   │
│              │                         │                   │
│              ╰─────────────────────────╯                   │
│                                                            │
│                 [Get a Parent]                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### 12.3.5 Successful Login Transition

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                                                              │
│                                                                              │
│                                                                              │
│                              🎉                                              │
│                                                                              │
│                          Welcome back,                                       │
│                                                                              │
│                             🐲                                               │
│                            Max!                                              │
│                                                                              │
│                                                                              │
│                    [loading indicator / sparkles]                           │
│                                                                              │
│                                                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

→ Auto-redirects to kid dashboard after 1.5 seconds
```

#### 12.3.6 Kid PIN Entry UX Specifications

| Element | Specification |
|---------|---------------|
| **Number buttons** | Minimum 64x64px, rounded corners, high contrast |
| **Touch feedback** | Button scales down on press, subtle haptic if available |
| **Dot animation** | Dots fill with bounce animation |
| **Avatar preview** | Shows after 2+ digits entered to help kid confirm |
| **Error animation** | Entire PIN display shakes left-right |
| **Lockout countdown** | Updates every second, large readable font |
| **Success animation** | Avatar grows, confetti burst, then redirect |

### 12.4 View Switching UX

Different mechanisms for switching between profiles based on session type.

#### 12.4.1 Parent View - Free Profile Switching

Parents can switch to any profile without re-authentication:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🃏 CardDex    [Collection]  [Sets]  [Search]          [Profile ▼]   [👤 ▼] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                           │                 │
│  Collection Dashboard                                     │   ┌───────────┐│
│                                                           │   │ Switch to:││
│  ...                                                      │   │           ││
│                                                           │   │ ┌───────┐ ││
│                                                           │   │ │  👤   │ ││
│                                                           │   │ │ Sarah │ ││
│                                                           │   │ │(You)  │✓││
│                                                           │   │ └───────┘ ││
│                                                           │   │           ││
│                                                           │   │ ┌───────┐ ││
│                                                           │   │ │  🐲   │ ││
│                                                           │   │ │  Max  │ ││
│                                                           │   │ └───────┘ ││
│                                                           │   │           ││
│                                                           │   │ ┌───────┐ ││
│                                                           │   │ │  🌟   │ ││
│                                                           │   │ │ Emma  │ ││
│                                                           │   │ └───────┘ ││
│                                                           │   │           ││
│                                                           │   │───────────││
│                                                           │   │[Parent    ││
│                                                           │   │ Dashboard]││
│                                                           │   └───────────┘│
│                                                           │                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Behavior:** Click any profile → instant switch, page refreshes with new profile's data.

#### 12.4.2 Kid View - PIN-Protected Switching

Kids can only switch to another kid by entering that kid's PIN:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🃏 CardDex    [Collection]  [Sets]  [Search]                        [🐲 ▼] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                           │                 │
│  Max's Collection                                         │   ┌───────────┐│
│                                                           │   │           ││
│  ...                                                      │   │ ┌───────┐ ││
│                                                           │   │ │  🐲   │ ││
│                                                           │   │ │  Max  │✓││
│                                                           │   │ │(You)  │ ││
│                                                           │   │ └───────┘ ││
│                                                           │   │           ││
│                                                           │   │ ┌───────┐ ││
│                                                           │   │ │  🌟   │ ││
│                                                           │   │ │ Emma  │ ││
│                                                           │   │ │ [PIN] │ ││
│                                                           │   │ └───────┘ ││
│                                                           │   │           ││
│                                                           │   │───────────││
│                                                           │   │[Get       ││
│                                                           │   │ Parent]   ││
│                                                           │   └───────────┘│
│                                                           │                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Clicking "Emma" with PIN indicator opens mini PIN dialog:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                         ╔═══════════════════════════════╗                   │
│                         ║                               ║                   │
│                         ║    🌟 Switch to Emma          ║                   │
│                         ║                               ║                   │
│                         ║    Enter Emma's PIN:          ║                   │
│                         ║                               ║                   │
│                         ║       ○   ○   ○   ○   ○       ║                   │
│                         ║                               ║                   │
│                         ║   [1][2][3]                   ║                   │
│                         ║   [4][5][6]                   ║                   │
│                         ║   [7][8][9]                   ║                   │
│                         ║      [0][⌫]                   ║                   │
│                         ║                               ║                   │
│                         ║    [Cancel]                   ║                   │
│                         ║                               ║                   │
│                         ╚═══════════════════════════════╝                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 12.4.3 "Get Parent" Action

When a kid clicks "Get Parent", show confirmation then return to login:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                         ╔═══════════════════════════════╗                   │
│                         ║                               ║                   │
│                         ║      👋 Get a Parent?         ║                   │
│                         ║                               ║                   │
│                         ║   This will end your session  ║                   │
│                         ║   and go to the login screen. ║                   │
│                         ║                               ║                   │
│                         ║   Your cards are saved!       ║                   │
│                         ║                               ║                   │
│                         ║  [Cancel]    [Yes, Get Parent]║                   │
│                         ║                               ║                   │
│                         ╚═══════════════════════════════╝                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### 12.4.4 Individual Collector View - No Switching

Individual collectors have no profile switcher:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🃏 CardDex    [Collection]  [Sets]  [Search]                        [👤 ▼] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                           │                 │
│  My Collection                                            │   ┌───────────┐│
│                                                           │   │           ││
│  ...                                                      │   │ ┌───────┐ ││
│                                                           │   │ │  👤   │ ││
│                                                           │   │ │ Mike  │ ││
│                                                           │   │ └───────┘ ││
│                                                           │   │           ││
│                                                           │   │───────────││
│                                                           │   │[Settings] ││
│                                                           │   │[Log Out]  ││
│                                                           │   └───────────┘│
│                                                           │                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Note:** No "Switch Profile" option, no "Parent Dashboard" link, clean simple menu.

#### 12.4.5 View Switching UX Summary Table

| Session Type | Profile Dropdown | Switch Mechanism | Exit Action |
|--------------|------------------|------------------|-------------|
| **Parent** | Shows all profiles | Click → instant switch | "Log Out" |
| **Kid (PIN)** | Shows own + siblings with PIN badges | Click sibling → PIN dialog | "Get Parent" |
| **Individual** | Shows only self | N/A - no switching | "Log Out" |

### 12.5 Navigation Differences by Account Type

#### 12.5.1 Parent Header (Family Account)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🃏 CardDex    [Collection]  [Sets]  [Search]  [🏠 Parent Dashboard]  [👤 ▼]│
└──────────────────────────────────────────────────────────────────────────────┘
```

Features:
- "Parent Dashboard" link visible
- Profile switcher shows all family profiles
- Full logout capability
- Access to family settings

#### 12.5.2 Kid Header (PIN Session)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🃏 CardDex    [Collection]  [Sets]  [Search]                    [🐲 Max ▼] │
└──────────────────────────────────────────────────────────────────────────────┘
```

Features:
- No "Parent Dashboard" link
- Profile dropdown shows siblings with PIN requirement
- "Get Parent" instead of "Log Out"
- Limited settings access

#### 12.5.3 Individual Header (Solo Account)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🃏 CardDex    [Collection]  [Sets]  [Search]                    [👤 Mike ▼]│
└──────────────────────────────────────────────────────────────────────────────┘
```

Features:
- No "Parent Dashboard" link
- No profile switcher (single profile only)
- Standard "Log Out" option
- Full personal settings access

---

## 13. Implementation Notes

### 13.1 Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PIN validation | Server-side | Security - prevents hash exposure, enforces rate limits |
| Device authorization | Cookie-based | Persists across sessions, httpOnly for security |
| Session type storage | localStorage | Quick access, survives page refresh |
| Profile switching (parent) | No re-auth | UX convenience, parent already authenticated |
| Profile switching (kid) | PIN required | Prevents sibling data access |
| Kid logout | Return to login | No "logout" concept for kids - they just leave |

### 13.2 Session State Hook Design

```typescript
// Proposed useSession() hook return type
interface SessionState {
  isAuthenticated: boolean;
  sessionType: 'parent' | 'individual' | 'kid_pin' | null;
  accountType: 'family' | 'individual' | null;
  currentProfile: Profile | null;
  family: Family | null;

  // Permissions derived from session type
  canAccessParentDashboard: boolean;
  canManageProfiles: boolean;
  canSwitchProfilesFreely: boolean;
  canManageDevices: boolean;
  canLogout: boolean; // false for kid_pin

  // Actions
  switchProfile: (profileId: string, pin?: string) => Promise<void>;
  returnToLogin: () => void;
}
```

### 13.3 Route Protection Strategy

```typescript
// Middleware-level route protection
const routeProtection = {
  '/parent-dashboard': {
    requires: 'parent',
    redirect: '/dashboard'
  },
  '/settings/family': {
    requires: 'parent',
    redirect: '/settings'
  },
  '/settings/devices': {
    requires: 'parent',
    redirect: '/settings'
  },
  '/profiles/manage': {
    requires: 'parent',
    redirect: '/dashboard'
  },
  '/dashboard': {
    requires: 'authenticated',
    redirect: '/login'
  },
};
```

---

## 14. Implementation Task Breakdown

This section provides concrete, actionable implementation tasks organized by phase with technical dependencies and effort estimates.

### 14.1 Task Dependency Graph

```
                                    ┌─────────────────────┐
                                    │  PHASE 1: FOUNDATION │
                                    └──────────┬──────────┘
                                               │
        ┌──────────────────────────────────────┼──────────────────────────────────────┐
        │                                      │                                      │
        ▼                                      ▼                                      ▼
┌───────────────┐                    ┌───────────────────┐                  ┌─────────────────┐
│ 1.1 Schema    │                    │ 1.2 PIN Utilities │                  │ 1.3 Migration   │
│    Changes    │                    │                   │                  │    Script       │
└───────┬───────┘                    └─────────┬─────────┘                  └────────┬────────┘
        │                                      │                                     │
        │                    ┌─────────────────┴─────────────────┐                   │
        │                    │                                   │                   │
        ▼                    ▼                                   ▼                   │
┌───────────────┐   ┌───────────────────┐              ┌─────────────────┐          │
│ 1.4 Update    │   │ 1.5 PIN Validation│              │ 1.6 Feature     │          │
│   AuthForm    │   │    Endpoints      │              │    Flags        │          │
└───────┬───────┘   └─────────┬─────────┘              └────────┬────────┘          │
        │                     │                                 │                    │
        └─────────────────────┼─────────────────────────────────┼────────────────────┘
                              │                                 │
                              ▼                                 ▼
                    ┌─────────────────────────────────────────────────┐
                    │              PHASE 2: KID PIN LOGIN             │
                    └─────────────────────────┬───────────────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        │                                     │                                     │
        ▼                                     ▼                                     ▼
┌───────────────────┐              ┌───────────────────┐              ┌───────────────────┐
│ 2.1 LoginSelector │              │ 2.2 KidPinEntry   │              │ 2.3 Session       │
│    Component      │              │    Component      │              │    Management     │
└─────────┬─────────┘              └─────────┬─────────┘              └─────────┬─────────┘
          │                                  │                                  │
          └──────────────────────────────────┼──────────────────────────────────┘
                                             │
                                             ▼
                              ┌───────────────────────────┐
                              │ 2.4 Navigation Updates    │
                              └─────────────┬─────────────┘
                                            │
                                            ▼
                    ┌─────────────────────────────────────────────────┐
                    │           PHASE 3: PARENT MANAGEMENT            │
                    └─────────────────────────┬───────────────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        │                                     │                                     │
        ▼                                     ▼                                     ▼
┌───────────────────┐              ┌───────────────────┐              ┌───────────────────┐
│ 3.1 KidPinManager │              │ 3.2 PIN Reset     │              │ 3.3 Parent        │
│    Component      │              │    Flow           │              │    Dashboard UI   │
└───────────────────┘              └───────────────────┘              └───────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────┐
                    │           PHASE 4: DEVICE SESSIONS              │
                    └─────────────────────────┬───────────────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        │                                     │                                     │
        ▼                                     ▼                                     ▼
┌───────────────────┐              ┌───────────────────┐              ┌───────────────────┐
│ 4.1 Device Token  │              │ 4.2 Device        │              │ 4.3 Device        │
│    Generation     │              │    Authorization  │              │    Manager UI     │
└───────────────────┘              └───────────────────┘              └───────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────┐
                    │           PHASE 5: POLISH & TESTING             │
                    └─────────────────────────────────────────────────┘
```

### 14.2 Phase 1: Foundation Tasks

| ID | Task | Files | Dependencies | Priority |
|----|------|-------|--------------|----------|
| **1.1** | **Schema Changes** | | | |
| 1.1.1 | Add `accountType` field to `families` table | `convex/schema.ts` | None | P0 |
| 1.1.2 | Create `childLoginPins` table with indexes | `convex/schema.ts` | None | P0 |
| 1.1.3 | Create `deviceSessions` table with indexes | `convex/schema.ts` | None | P0 |
| 1.1.4 | Add `migrationLog` table for auditing | `convex/schema.ts` | None | P1 |
| 1.1.5 | Add migration fields (`migrationConfidence`, `needsNewFeatureOnboarding`) | `convex/schema.ts` | 1.1.1 | P1 |
| **1.2** | **PIN Utilities** | | | |
| 1.2.1 | Create PBKDF2 PIN hashing function | `convex/lib/pinUtils.ts` (new) | None | P0 |
| 1.2.2 | Create PIN validation function | `convex/lib/pinUtils.ts` | 1.2.1 | P0 |
| 1.2.3 | Create PIN strength checker (reject weak PINs) | `convex/lib/pinUtils.ts` | 1.2.1 | P0 |
| 1.2.4 | Create rate limiting helpers | `convex/lib/pinUtils.ts` | None | P0 |
| **1.3** | **Migration Script** | | | |
| 1.3.1 | Create `classifyFamily()` function | `convex/migrations/parentChild.ts` (new) | 1.1.1 | P0 |
| 1.3.2 | Create `preMigrationValidation()` function | `convex/migrations/parentChild.ts` | 1.3.1 | P0 |
| 1.3.3 | Create `executeMigration()` function (batched) | `convex/migrations/parentChild.ts` | 1.3.1, 1.3.2 | P0 |
| 1.3.4 | Create `validateMigration()` post-check | `convex/migrations/parentChild.ts` | 1.3.3 | P0 |
| 1.3.5 | Create rollback scripts | `convex/migrations/parentChild.ts` | 1.3.3 | P1 |
| **1.4** | **AuthForm Updates** | | | |
| 1.4.1 | Persist `accountType` to family during signup | `src/components/auth/AuthForm.tsx`, `convex/families.ts` | 1.1.1 | P0 |
| 1.4.2 | Store `accountType` in localStorage after login | `src/components/auth/AuthForm.tsx` | 1.4.1 | P0 |
| 1.4.3 | Add signup flow branch for individual vs family | `src/components/auth/AuthForm.tsx` | 1.4.1 | P0 |
| **1.5** | **PIN Validation Endpoints** | | | |
| 1.5.1 | Create `createChildPin` mutation | `convex/childPins.ts` (new) | 1.1.2, 1.2.1 | P0 |
| 1.5.2 | Create `validateChildPin` query | `convex/childPins.ts` | 1.1.2, 1.2.2, 1.2.4 | P0 |
| 1.5.3 | Create `resetChildPin` mutation | `convex/childPins.ts` | 1.1.2, 1.2.1 | P0 |
| 1.5.4 | Create `deleteChildPin` mutation | `convex/childPins.ts` | 1.1.2 | P1 |
| **1.6** | **Feature Flags** | | | |
| 1.6.1 | Add `kidPinLogin` feature flag | `convex/featureFlags.ts` | None | P0 |
| 1.6.2 | Add `accountTypeSeparation` feature flag | `convex/featureFlags.ts` | None | P0 |
| 1.6.3 | Add `deviceAuthorization` feature flag | `convex/featureFlags.ts` | None | P0 |
| 1.6.4 | Create hook `useFeatureFlag()` for client usage | `src/hooks/useFeatureFlag.ts` (new) | 1.6.1-1.6.3 | P0 |

### 14.3 Phase 2: Kid PIN Login Tasks

| ID | Task | Files | Dependencies | Priority |
|----|------|-------|--------------|----------|
| **2.1** | **Login Selector Component** | | | |
| 2.1.1 | Create `LoginSelector.tsx` with email/PIN options | `src/components/auth/LoginSelector.tsx` (new) | 1.6.4 | P0 |
| 2.1.2 | Style login selector for mobile | `src/components/auth/LoginSelector.tsx` | 2.1.1 | P0 |
| 2.1.3 | Add animation transitions between modes | `src/components/auth/LoginSelector.tsx` | 2.1.1 | P2 |
| **2.2** | **Kid PIN Entry Component** | | | |
| 2.2.1 | Create `KidPinEntry.tsx` with numpad layout | `src/components/auth/KidPinEntry.tsx` (new) | None | P0 |
| 2.2.2 | Add visual feedback (dots filling, error shake) | `src/components/auth/KidPinEntry.tsx` | 2.2.1 | P0 |
| 2.2.3 | Add "Forgot PIN? Get Parent" link | `src/components/auth/KidPinEntry.tsx` | 2.2.1 | P0 |
| 2.2.4 | Integrate with `validateChildPin` endpoint | `src/components/auth/KidPinEntry.tsx` | 2.2.1, 1.5.2 | P0 |
| 2.2.5 | Handle lockout state display | `src/components/auth/KidPinEntry.tsx` | 2.2.4 | P0 |
| 2.2.6 | Make touch-friendly for tablets | `src/components/auth/KidPinEntry.tsx` | 2.2.1 | P0 |
| **2.3** | **Session Management** | | | |
| 2.3.1 | Create `SessionType` enum and context | `src/contexts/SessionContext.tsx` (new) | None | P0 |
| 2.3.2 | Update `useCurrentProfile()` to track session type | `src/hooks/useCurrentProfile.ts` | 2.3.1 | P0 |
| 2.3.3 | Create `useSession()` hook with permissions | `src/hooks/useSession.ts` (new) | 2.3.1, 2.3.2 | P0 |
| 2.3.4 | Store session type in localStorage | `src/hooks/useSession.ts` | 2.3.3 | P0 |
| 2.3.5 | Create kid session token generation (limited scope) | `convex/sessions.ts` (new) | 2.3.1 | P0 |
| **2.4** | **Navigation Updates** | | | |
| 2.4.1 | Conditionally hide "Parent Dashboard" link | `src/components/header/Header.tsx` | 2.3.3 | P0 |
| 2.4.2 | Update `ProfileSwitcher` for session-aware switching | `src/components/header/ProfileSwitcher.tsx` | 2.3.3 | P0 |
| 2.4.3 | Add "Get Parent" action for kid sessions | `src/components/header/ProfileSwitcher.tsx` | 2.4.2 | P0 |
| 2.4.4 | Hide profile switcher for individual accounts | `src/components/header/ProfileSwitcher.tsx` | 2.3.3 | P0 |
| 2.4.5 | Update mobile navigation drawer | `src/components/header/MobileNav.tsx` | 2.4.1-2.4.4 | P0 |

### 14.4 Phase 3: Parent Management Tasks

| ID | Task | Files | Dependencies | Priority |
|----|------|-------|--------------|----------|
| **3.1** | **Kid PIN Manager Component** | | | |
| 3.1.1 | Create `KidPinManager.tsx` parent component | `src/components/parent/KidPinManager.tsx` (new) | 1.5.1-1.5.4 | P0 |
| 3.1.2 | Create PIN setup wizard for each child | `src/components/parent/KidPinManager.tsx` | 3.1.1 | P0 |
| 3.1.3 | Display PIN status (set/not set) for each child | `src/components/parent/KidPinManager.tsx` | 3.1.1 | P0 |
| 3.1.4 | Add optional PIN hint editor | `src/components/parent/KidPinManager.tsx` | 3.1.1 | P1 |
| 3.1.5 | Add "Remove PIN" action | `src/components/parent/KidPinManager.tsx` | 3.1.1, 1.5.4 | P1 |
| **3.2** | **PIN Reset Flow** | | | |
| 3.2.1 | Create PIN reset modal component | `src/components/parent/PinResetModal.tsx` (new) | 1.5.3 | P0 |
| 3.2.2 | Require parent re-authentication for reset | `src/components/parent/PinResetModal.tsx` | 3.2.1 | P0 |
| 3.2.3 | Send notification when PIN is reset (optional) | `convex/notifications.ts` | 3.2.1 | P2 |
| **3.3** | **Parent Dashboard Integration** | | | |
| 3.3.1 | Add "Kid PINs" section to parent dashboard | `src/app/parent-dashboard/page.tsx` | 3.1.1 | P0 |
| 3.3.2 | Add setup prompt if no PINs configured | `src/app/parent-dashboard/page.tsx` | 3.3.1 | P0 |
| 3.3.3 | Add quick-action card for PIN management | `src/app/parent-dashboard/page.tsx` | 3.3.1 | P1 |
| **3.4** | **Login Activity (Future)** | | | |
| 3.4.1 | Create `loginActivity` table | `convex/schema.ts` | None | P2 |
| 3.4.2 | Log kid PIN logins | `convex/childPins.ts` | 3.4.1 | P2 |
| 3.4.3 | Create `LoginActivity.tsx` component | `src/components/parent/LoginActivity.tsx` (new) | 3.4.1, 3.4.2 | P2 |

### 14.5 Phase 4: Device Sessions Tasks

| ID | Task | Files | Dependencies | Priority |
|----|------|-------|--------------|----------|
| **4.1** | **Device Token Generation** | | | |
| 4.1.1 | Create secure device token generator | `convex/lib/deviceUtils.ts` (new) | None | P0 |
| 4.1.2 | Create `authorizeDevice` mutation | `convex/deviceSessions.ts` (new) | 1.1.3, 4.1.1 | P0 |
| 4.1.3 | Create `checkDeviceAuthorization` query | `convex/deviceSessions.ts` | 4.1.2 | P0 |
| 4.1.4 | Create `revokeDevice` mutation | `convex/deviceSessions.ts` | 4.1.2 | P0 |
| 4.1.5 | Create `listAuthorizedDevices` query | `convex/deviceSessions.ts` | 4.1.2 | P0 |
| **4.2** | **Device Authorization Flow** | | | |
| 4.2.1 | Add "Remember this device" checkbox to parent login | `src/components/auth/AuthForm.tsx` | 4.1.2 | P0 |
| 4.2.2 | Store device token in httpOnly cookie | `convex/deviceSessions.ts` | 4.2.1 | P0 |
| 4.2.3 | Create device authorization prompt component | `src/components/auth/DeviceAuthPrompt.tsx` (new) | 4.1.2 | P0 |
| 4.2.4 | Add device name capture (auto-detect + editable) | `src/components/auth/DeviceAuthPrompt.tsx` | 4.2.3 | P1 |
| **4.3** | **Device Manager UI** | | | |
| 4.3.1 | Create `DeviceManager.tsx` component | `src/components/parent/DeviceManager.tsx` (new) | 4.1.5 | P0 |
| 4.3.2 | Display list of authorized devices | `src/components/parent/DeviceManager.tsx` | 4.3.1 | P0 |
| 4.3.3 | Add "Revoke Access" action per device | `src/components/parent/DeviceManager.tsx` | 4.3.1, 4.1.4 | P0 |
| 4.3.4 | Show last used timestamp for each device | `src/components/parent/DeviceManager.tsx` | 4.3.1 | P1 |
| 4.3.5 | Add "Revoke All Devices" action | `src/components/parent/DeviceManager.tsx` | 4.3.1 | P1 |
| **4.4** | **Integration** | | | |
| 4.4.1 | Check device authorization before showing PIN entry | `src/components/auth/LoginSelector.tsx` | 4.1.3, 2.1.1 | P0 |
| 4.4.2 | Show "Get parent to authorize" message | `src/components/auth/KidPinEntry.tsx` | 4.4.1 | P0 |
| 4.4.3 | Update device `lastUsedAt` on successful PIN login | `convex/childPins.ts` | 4.1.2 | P0 |

### 14.6 Phase 5: Polish & Testing Tasks

| ID | Task | Files | Dependencies | Priority |
|----|------|-------|--------------|----------|
| **5.1** | **Accessibility** | | | |
| 5.1.1 | Add ARIA labels to PIN keypad | `src/components/auth/KidPinEntry.tsx` | 2.2.1 | P0 |
| 5.1.2 | Ensure keyboard navigation on PIN entry | `src/components/auth/KidPinEntry.tsx` | 2.2.1 | P0 |
| 5.1.3 | Add screen reader announcements for PIN state | `src/components/auth/KidPinEntry.tsx` | 2.2.1 | P0 |
| 5.1.4 | Test with VoiceOver/TalkBack | All auth components | 5.1.1-5.1.3 | P0 |
| **5.2** | **Security Testing** | | | |
| 5.2.1 | Penetration test PIN validation endpoint | `convex/childPins.ts` | 1.5.2 | P0 |
| 5.2.2 | Verify rate limiting under load | `convex/childPins.ts` | 1.2.4 | P0 |
| 5.2.3 | Test device token security | `convex/deviceSessions.ts` | 4.1.1 | P0 |
| 5.2.4 | Audit session permission boundaries | `src/hooks/useSession.ts` | 2.3.3 | P0 |
| 5.2.5 | Test route protection rules | All protected routes | 2.3.3 | P0 |
| **5.3** | **Edge Case Handling** | | | |
| 5.3.1 | Handle concurrent PIN changes | `convex/childPins.ts` | 1.5.1-1.5.3 | P0 |
| 5.3.2 | Handle device token expiration gracefully | `src/components/auth/LoginSelector.tsx` | 4.4.1 | P0 |
| 5.3.3 | Handle mid-session profile deletion | `src/hooks/useSession.ts` | 2.3.3 | P0 |
| 5.3.4 | Handle family downgrade (family → individual) | `convex/families.ts` | 1.4.1 | P1 |
| **5.4** | **Mobile Responsiveness** | | | |
| 5.4.1 | Test PIN keypad on various screen sizes | `src/components/auth/KidPinEntry.tsx` | 2.2.6 | P0 |
| 5.4.2 | Test login selector on mobile | `src/components/auth/LoginSelector.tsx` | 2.1.2 | P0 |
| 5.4.3 | Test device manager on mobile | `src/components/parent/DeviceManager.tsx` | 4.3.1 | P0 |
| **5.5** | **Animation & Polish** | | | |
| 5.5.1 | Add success animation on PIN entry | `src/components/auth/KidPinEntry.tsx` | 2.2.2 | P2 |
| 5.5.2 | Add profile avatar reveal during PIN entry | `src/components/auth/KidPinEntry.tsx` | 2.2.2 | P2 |
| 5.5.3 | Polish error state transitions | All auth components | All | P2 |

### 14.7 Technical Dependencies Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CRITICAL PATH DEPENDENCIES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MUST BE DONE FIRST (blocking everything):                                  │
│  ─────────────────────────────────────────                                   │
│  • 1.1.1 accountType field in schema                                        │
│  • 1.1.2 childLoginPins table                                               │
│  • 1.2.1 PIN hashing utilities                                              │
│                                                                              │
│  BLOCKS KID PIN LOGIN (Phase 2):                                            │
│  ─────────────────────────────────                                           │
│  • 1.5.1-1.5.2 PIN creation/validation endpoints                            │
│  • 1.6.1-1.6.4 Feature flags and client hooks                               │
│  • 2.3.1-2.3.4 Session management infrastructure                            │
│                                                                              │
│  BLOCKS DEVICE AUTHORIZATION (Phase 4):                                     │
│  ───────────────────────────────────────                                     │
│  • 1.1.3 deviceSessions table                                               │
│  • 4.1.1-4.1.3 Device token utilities                                       │
│  • Phase 2 completion (kid PIN login must work first)                       │
│                                                                              │
│  CAN BE PARALLELIZED:                                                       │
│  ────────────────────                                                        │
│  • 1.2.x PIN utilities (no external dependencies)                           │
│  • 1.6.x Feature flags (no external dependencies)                           │
│  • 2.1.x and 2.2.x can be built simultaneously                              │
│  • 3.1.x and 3.2.x can be built simultaneously after Phase 2                │
│  • 4.3.x Device manager UI can parallel 4.2.x authorization flow            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 15. Testing Strategy

### 15.1 Test Categories

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TESTING PYRAMID                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                              E2E Tests                                       │
│                            ┌─────────┐                                       │
│                           /   10%    \                                       │
│                          /  Critical  \                                      │
│                         /   Flows      \                                     │
│                        ───────────────────                                   │
│                       /                   \                                  │
│                      /  Integration Tests  \                                 │
│                     /        30%           \                                 │
│                    /   API & Component      \                                │
│                   ───────────────────────────                                │
│                  /                           \                               │
│                 /        Unit Tests          \                               │
│                /           60%               \                               │
│               /    Functions & Utilities     \                               │
│              ─────────────────────────────────                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 15.2 Unit Tests

| Category | Test Cases | Files to Test |
|----------|------------|---------------|
| **PIN Utilities** | | `convex/lib/pinUtils.ts` |
| | Hash generation is deterministic with same salt | |
| | Hash differs with different salts | |
| | Weak PINs (12345, 11111, 00000) are rejected | |
| | PIN validation passes for correct PIN | |
| | PIN validation fails for incorrect PIN | |
| | Rate limiter tracks attempts correctly | |
| | Lockout triggers after 5 failed attempts | |
| | Lockout expires after 15 minutes | |
| **Device Utilities** | | `convex/lib/deviceUtils.ts` |
| | Device tokens are unique | |
| | Device tokens are cryptographically secure | |
| | Token expiration calculation is correct | |
| **Migration Logic** | | `convex/migrations/parentChild.ts` |
| | Single profile without parent → individual (high) | |
| | Parent + children → family (high) | |
| | Single parent profile → family (medium) | |
| | Multiple profiles no parent → family (low) | |
| | Zero profiles → data issue flagged | |
| **Session Permissions** | | `src/hooks/useSession.ts` |
| | Parent session has all permissions | |
| | Kid session lacks parent dashboard access | |
| | Individual session has no profile switching | |

### 15.3 Integration Tests

| Category | Test Cases | Components/Endpoints |
|----------|------------|---------------------|
| **Authentication Flows** | | |
| | Parent can log in with email/password | `AuthForm` → `convex auth` |
| | Kid can log in with valid PIN | `KidPinEntry` → `validateChildPin` |
| | Invalid PIN shows error | `KidPinEntry` → `validateChildPin` |
| | Lockout triggers after 5 failures | `KidPinEntry` → `validateChildPin` |
| | Lockout prevents further attempts | `KidPinEntry` → `validateChildPin` |
| | Unauthorized device shows error | `LoginSelector` → `checkDeviceAuthorization` |
| **PIN Management** | | |
| | Parent can create PIN for child | `KidPinManager` → `createChildPin` |
| | Parent can reset child's PIN | `PinResetModal` → `resetChildPin` |
| | Parent can delete child's PIN | `KidPinManager` → `deleteChildPin` |
| | Duplicate PINs in family are rejected | `createChildPin` |
| **Device Management** | | |
| | Parent can authorize device | `AuthForm` → `authorizeDevice` |
| | Parent can revoke device | `DeviceManager` → `revokeDevice` |
| | Revoked device cannot PIN login | `LoginSelector` → `checkDeviceAuthorization` |
| **Navigation** | | |
| | Parent sees "Parent Dashboard" link | `Header` |
| | Kid does not see "Parent Dashboard" link | `Header` |
| | Individual does not see profile switcher | `ProfileSwitcher` |

### 15.4 End-to-End Tests

| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| **Happy Path: Family Setup** | | |
| 1 | Parent signs up as family account | Account created with `accountType: 'family'` |
| 2 | Parent creates child profile | Child profile exists |
| 3 | Parent sets PIN for child | PIN stored hashed in `childLoginPins` |
| 4 | Parent enables device | Device token stored |
| 5 | Child logs in with PIN | Child session active, sees their dashboard |
| 6 | Child cannot access parent dashboard | Redirected to `/dashboard` |
| **Happy Path: Individual Setup** | | |
| 1 | User signs up as individual | Account created with `accountType: 'individual'` |
| 2 | User logs in | Session active |
| 3 | User sees no family features | No profile switcher, no parent dashboard |
| **Error Path: PIN Lockout** | | |
| 1 | Kid enters wrong PIN 5 times | Lockout message displayed |
| 2 | Kid waits 15 minutes | Lockout expires |
| 3 | Kid enters correct PIN | Login succeeds |
| **Error Path: Unauthorized Device** | | |
| 1 | Kid tries PIN on new device | "Ask parent" message shown |
| 2 | Parent logs in, authorizes device | Device token stored |
| 3 | Kid tries PIN again | Login succeeds |

### 15.5 Security Tests

| Test | Validation |
|------|------------|
| **PIN Brute Force** | Rate limiting prevents >5 attempts in 15 min |
| **Session Scope** | Kid token cannot access `/api/parent/*` endpoints |
| **Device Token Theft** | Token is httpOnly, cannot be accessed by JS |
| **Replay Attack** | Expired device tokens are rejected |
| **Cross-Family PIN** | PIN from Family A cannot access Family B |
| **Privilege Escalation** | Kid cannot modify `sessionType` in localStorage to gain access |

### 15.6 Test Environment Setup

```typescript
// Test fixtures
const TEST_FAMILIES = {
  family: {
    email: 'parent@test.com',
    accountType: 'family',
    profiles: [
      { displayName: 'Parent', profileType: 'parent' },
      { displayName: 'Kid1', profileType: 'child' },
      { displayName: 'Kid2', profileType: 'child' }
    ]
  },
  individual: {
    email: 'solo@test.com',
    accountType: 'individual',
    profiles: [
      { displayName: 'Solo Collector', profileType: null }
    ]
  }
};

const TEST_PINS = {
  valid: '12357',  // Passes weak PIN check
  weak: '12345',   // Fails weak PIN check
  invalid: '00000' // Wrong PIN
};
```

### 15.7 Test Coverage Requirements

| Area | Minimum Coverage |
|------|------------------|
| `convex/lib/pinUtils.ts` | 95% |
| `convex/childPins.ts` | 90% |
| `convex/deviceSessions.ts` | 90% |
| `src/hooks/useSession.ts` | 85% |
| `src/components/auth/*` | 80% |
| Overall | 80% |

---

## 16. Deployment Checklist

### 16.1 Pre-Deployment

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Security tests completed
- [ ] Code review completed
- [ ] Database backup taken
- [ ] Feature flags configured (all OFF)
- [ ] Monitoring dashboard ready
- [ ] Rollback scripts tested in staging

### 16.2 Deployment Order

1. **Database migrations** (schema additions - non-breaking)
2. **Backend code** (new tables, endpoints, utilities)
3. **Feature flag configuration** (still OFF)
4. **Frontend code** (new components, hooks)
5. **Run data migration script**
6. **Enable feature flags** (graduated rollout)

### 16.3 Post-Deployment

- [ ] Monitor error rates for 1 hour
- [ ] Spot-check migrated accounts
- [ ] Verify feature flags working
- [ ] Test critical flows manually
- [ ] Enable alerts for anomalies
