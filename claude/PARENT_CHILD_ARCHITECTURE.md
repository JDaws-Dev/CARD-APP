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

### 6.1 Determine Account Type for Existing Users

```typescript
// Migration logic
const hasParent = profiles.some(p => p.profileType === 'parent');
const hasChildren = profiles.some(p => p.profileType === 'child');

// If has parent + children, it's a family account
// If single profile or no parent, it's individual
const accountType = (hasParent && profiles.length > 1) ? 'family' : 'individual';
```

### 6.2 Existing User Handling

**For Individual Users:**
- Set `accountType = 'individual'`
- Hide family features permanently

**For Family Users:**
- Set `accountType = 'family'`
- Prompt to set up kid PINs on next parent login

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

## 12. Implementation Notes

### 12.1 Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| PIN validation | Server-side | Security - prevents hash exposure, enforces rate limits |
| Device authorization | Cookie-based | Persists across sessions, httpOnly for security |
| Session type storage | localStorage | Quick access, survives page refresh |
| Profile switching (parent) | No re-auth | UX convenience, parent already authenticated |
| Profile switching (kid) | PIN required | Prevents sibling data access |
| Kid logout | Return to login | No "logout" concept for kids - they just leave |

### 12.2 Session State Hook Design

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

### 12.3 Route Protection Strategy

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
