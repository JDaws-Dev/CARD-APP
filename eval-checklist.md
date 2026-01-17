# CardDex Site Evaluation Checklist

> **Purpose:** Standardized testing protocol to catch UX issues, auth state bugs, and inconsistencies before launch.

## Pre-Eval Setup

- [ ] Clear browser cookies/localStorage OR use incognito window for logged-out testing
- [ ] Have test credentials ready for logged-in testing
- [ ] Note the deployment URL being tested
- [ ] Record date/time of evaluation

---

## 1. Auth State Matrix Testing

### 1.1 Logged-OUT State (Visitor Experience)

| Page                | Expected Behavior                          | Header Should Be | Status | Notes |
| ------------------- | ------------------------------------------ | ---------------- | ------ | ----- |
| `/` (landing)       | Show marketing content                     | MarketingHeader  |        |       |
| `/login`            | Show login form                            | MarketingHeader  |        |       |
| `/signup`           | Show signup form                           | MarketingHeader  |        |       |
| `/dashboard`        | Redirect to `/login`                       | N/A              |        |       |
| `/sets`             | Redirect to `/login` OR show public browse | ?                |        |       |
| `/collection`       | Redirect to `/login`                       | N/A              |        |       |
| `/my-wishlist`      | Redirect to `/login`                       | N/A              |        |       |
| `/badges`           | Redirect to `/login`                       | N/A              |        |       |
| `/settings`         | Redirect to `/login`                       | N/A              |        |       |
| `/parent-dashboard` | Redirect to `/login`                       | N/A              |        |       |
| `/streak`           | Redirect to `/login`                       | N/A              |        |       |
| `/learn`            | Redirect to `/login`                       | N/A              |        |       |

### 1.2 Logged-IN State (User Experience)

| Page                | Expected Behavior                 | Header Should Be | Status | Notes |
| ------------------- | --------------------------------- | ---------------- | ------ | ----- |
| `/` (landing)       | Redirect to `/dashboard`          | N/A (redirect)   |        |       |
| `/login`            | Redirect to `/dashboard`          | N/A (redirect)   |        |       |
| `/signup`           | Redirect to `/dashboard`          | N/A (redirect)   |        |       |
| `/dashboard`        | Show kid dashboard                | AppHeader        |        |       |
| `/sets`             | Show sets browser                 | AppHeader        |        |       |
| `/sets/[setId]`     | Show set detail                   | AppHeader        |        |       |
| `/collection`       | Show my collection                | AppHeader        |        |       |
| `/my-wishlist`      | Show wishlist                     | AppHeader        |        |       |
| `/badges`           | Show badge collection             | AppHeader        |        |       |
| `/settings`         | Show settings                     | AppHeader        |        |       |
| `/parent-dashboard` | Show parent dashboard (if parent) | AppHeader        |        |       |
| `/streak`           | Show streak tracker               | AppHeader        |        |       |
| `/learn`            | Show learning games               | AppHeader        |        |       |

---

## 2. User Journey Testing

### 2.1 New Visitor → Signup Journey

Steps to test:

1. [ ] Land on `/` - see marketing page with MarketingHeader
2. [ ] Click "Start Collecting Free" or "Sign Up"
3. [ ] Arrive at `/signup` - form loads correctly
4. [ ] Fill out signup form (email, password, display name)
5. [ ] Submit - should show email verification or proceed to onboarding
6. [ ] Complete onboarding (if applicable)
7. [ ] Arrive at `/dashboard` with AppHeader

## **Issues Found:**

### 2.2 Returning User → Login Journey

Steps to test:

1. [ ] Land on `/` - see marketing page
2. [ ] Click "Log In"
3. [ ] Arrive at `/login` - form loads correctly
4. [ ] Enter credentials, submit
5. [ ] Redirect to `/dashboard` with AppHeader
6. [ ] All nav links work (Collection, Sets, Badges, Wishlist, etc.)

## **Issues Found:**

### 2.3 Already Logged-In User Journey

Steps to test:

1. [ ] Open site while already authenticated
2. [ ] Should NOT see landing page - redirect to `/dashboard`
3. [ ] Navigate through app - all pages show AppHeader
4. [ ] Logout - return to landing page with MarketingHeader

## **Issues Found:**

---

## 3. Header/Navigation Consistency

### 3.1 MarketingHeader (Logged-Out) Should Have:

- [ ] CardDex logo (links to `/`)
- [ ] "Features" link (or anchor)
- [ ] "Pricing" link (or anchor)
- [ ] "Log In" button → `/login`
- [ ] "Sign Up" / "Start Free" button → `/signup`
- [ ] NO app navigation (Collection, Sets, Badges, etc.)
- [ ] NO game picker dropdown
- [ ] NO profile menu

### 3.2 AppHeader (Logged-In) Should Have:

- [ ] CardDex logo (links to `/dashboard`)
- [ ] My Collection link
- [ ] Browse Sets link
- [ ] Badges link
- [ ] Wishlist link
- [ ] Search link/icon
- [ ] Game picker dropdown (Pokemon TCG, etc.)
- [ ] Profile menu with user options
- [ ] NO marketing links (Features, Pricing)

---

## 4. Visual Consistency Checks

### 4.1 Branding

- [ ] Logo consistent across all pages
- [ ] Brand colors used correctly (kid-primary, kid-secondary)
- [ ] No references to "Pokemon" in generic areas (should say "Trading Cards")
- [ ] Favicon loads correctly

### 4.2 Layout

- [ ] Header doesn't overlap content
- [ ] Footer present on appropriate pages
- [ ] No layout shift during auth loading
- [ ] Mobile responsive (test at 375px width)

### 4.3 Dark Mode

- [ ] Toggle works
- [ ] All pages render correctly in dark mode
- [ ] No unreadable text or missing backgrounds

---

## 5. Error States & Edge Cases

- [ ] Invalid login credentials - shows error message
- [ ] Signup with existing email - shows appropriate error
- [ ] Navigate to non-existent page - shows 404
- [ ] Navigate to set that doesn't exist - handles gracefully
- [ ] Session expires mid-use - redirects to login appropriately
- [ ] Slow network - loading states appear

---

## 6. Multi-TCG Consistency

- [ ] Game picker appears on appropriate pages
- [ ] Switching games updates content (not just UI)
- [ ] All 7 games listed in picker
- [ ] No hardcoded "Pokemon" text in game-agnostic areas

---

## Eval Summary Template

**Date:**
**Evaluator:**
**URL Tested:**
**Browser:**

### Critical Issues (Blocks Launch)

1.

### High Priority Issues

1.

### Medium Priority Issues

1.

### Low Priority (Polish)

1.

### Already Tracked in Tasks

- Issue X → tasks-ui.md line Y
- Issue Z → tasks-backend.md line W

---

## Completed Evaluations

### Eval #1: January 17, 2026 (7:00 AM)

**Date:** January 17, 2026
**Evaluator:** Claude (via screenshot review)
**URL Tested:** https://card-app-jade.vercel.app
**Browser:** Chrome (from user screenshot)

#### Auth State Matrix Results

| Page            | Logged-OUT               | Logged-IN                             | Status   |
| --------------- | ------------------------ | ------------------------------------- | -------- |
| `/` (landing)   | Shows MarketingHeader ✅ | Shows AppHeader on marketing page ❌  | **FAIL** |
| `/login`        | Shows login form ✅      | Still accessible (should redirect) ❌ | **FAIL** |
| `/signup`       | Shows signup form ✅     | Still accessible (should redirect) ❌ | **FAIL** |
| `/dashboard`    | Not tested               | Shows AppHeader ✅                    | Partial  |
| Protected pages | Not tested               | Not tested                            | Unknown  |

#### Critical Issues Found

1. **Logged-in users see AppHeader on landing page** - When authenticated, visiting `/` shows the full app navigation (My Collection, Browse Sets, Badges, Wishlist, Search, Game Picker) overlaid on marketing content. Should redirect to `/dashboard`.

2. **No redirect from `/login` when authenticated** - Logged-in users can still access the login page instead of being redirected to dashboard.

3. **No redirect from `/signup` when authenticated** - Same issue as login page.

4. **Hardcoded "Pokemon" text on landing page** - Multiple references to "Pokemon" that should say "Trading Cards" for multi-TCG support:
   - Line 185: "Browse through all Pokemon card sets"
   - Line 236: "CardDex makes tracking your Pokemon cards fun"
   - Line 564: "Pokemon Sets" in stats
   - Line 628, 703: "All 500+ Pokemon sets" in pricing
   - Line 779, 1004: "Pokemon card collection" in testimonials/CTA

#### Tasks Added/Updated

- Added 10 new auth protection tasks to tasks-ui.md under "Auth State Issues (January 17, 2026)"
- Existing landing page content tasks already track the Pokemon → Trading Cards changes (lines 217-226)
- Updated redirect task for logged-in users on landing page with CRITICAL label

#### Recommendations

1. Create a shared `useAuthRedirect` hook that redirects authenticated users away from marketing/auth pages
2. Create a shared `useRequireAuth` hook that redirects unauthenticated users to login from protected pages
3. Consider middleware-based auth protection for better UX (no flash of wrong content)
