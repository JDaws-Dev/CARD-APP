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
// families - Account container
families: {
  email: string,
  subscriptionTier: 'free' | 'family',
  parentPinHash?: string,  // PIN for protecting parent features from children
}

// profiles - Individual user profiles within a family
profiles: {
  familyId: Id<'families'>,
  displayName: string,
  profileType?: 'parent' | 'child',
}
```

**Key Observations:**
1. `accountType` is captured at signup but NOT persisted in the database
2. The schema supports parent/child distinction via `profileType`
3. Parent PIN exists (`parentPinHash`) but is for protecting parent features, not for login
4. No mechanism for child-only PIN login exists

### 1.3 Gaps in Current Architecture

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
