# CardDex Beads Issues Import

**Note:** Due to a routing bug in beads 0.48.0 (dev) that routes to `~/.beads-planning`, issues could not be persisted to the local database. This document serves as the issue import list from tasks-ui.md.

## Issue Summary

| Priority | Count | Description |
|----------|-------|-------------|
| P0 (CRITICAL) | 9 | Settings permissions, profile switcher, landing page multi-TCG |
| P1 (HIGH) | 35 | Collection modal, sets page, variant badges, game toggle, AI features |
| P2 (MEDIUM) | 25 | SEO, architecture, master set mode, AI components, trade logging |
| P3 (LOW) | 12 | Mobile UX evaluation, gamification review |
| **TOTAL** | **81** | |

---

## P0 - CRITICAL Issues

1. **Add profile switcher to header for families**
   - Allow switching between child profiles for parent accounts

2. **Restructure settings page - My Settings vs Family Controls**
   - Visual separation of kid-accessible vs parent-only settings

3. **Add PIN protection to Family Controls**
   - Require Parent PIN to access Sleep Mode, Parent PIN, Kid Mode, Game Selection

4. **Add visual lock indicators on protected settings**
   - Show LockClosedIcon and "Parent Only" badge on protected settings

5. **Handle no-PIN-set state for Family Controls**
   - Prompt parent to create PIN when accessing Family Controls without one

6. **Make settings profile-aware per child**
   - Different settings per child profile (e.g., sleep schedules)

7. **Add unlock button flow for Family Controls**
   - Button to enter PIN that temporarily unlocks Family Controls for session

8. **Protect Game Selection toggle in Family Controls**
   - Parents should control which games kids can access

9. **Update landing page for multi-TCG support**
   - Change Pokemon-specific text to support all 4 TCGs

---

## P1 - HIGH Issues

### My Collection Card Detail Modal
10. Show owned variants in modal
11. Quick actions in modal (view in set, remove, wishlist, edit qty)
12. Card metadata in modal (rarity, number, type, value)
13. Navigation (swipe/arrows, keyboard)

### Collection Browse Experience
14. Variant badges on collection cards
15. Filter by variant type
16. Sort by date added
17. Sort by value
18. Grid size options

### Sets Page
19. Fix card spacing/overlap (BUG)
20. Enlarged card on add stays visible
21. Magnifying glass for card close-up
22. Debug variant badges not showing (BUG)
23. Research Pokemon TCG API variants
24. Variant badge component
25. Badge click interactions
26. Sorting options

### Multi-TCG Master Toggle
27. Implement master game toggle for entire app
28. Persist game selection in user profile
29. Game switch indicator across all pages
30. Quick game switcher in header
31. Update page routes to use game selector

### Other HIGH Priority
32. Fix Badges/Achievements not showing (BUG)
33. Add onError handlers to CardGrid images
34. Extract hardcoded game card URLs to config
35. Add parent features indicator to profile menu
36. Remove redundant Back to Home link from dashboard

### Landing Page
37. Update hero section for multi-TCG
38. Add Supported Games section
39. Update How It Works for multi-TCG
40. Update pricing for multi-TCG
41. Add Multiple Games as key feature
42. AI Magic section
43. AI features in pricing tiers
44. Kid-Safe AI trust badges
45. Add CSP headers for security

---

## P2 - MEDIUM Issues

### SEO & Marketing
46. Add unique meta descriptions to all pages
47. Add Open Graph and Twitter Card tags
48. Create sitemap and robots.txt
49. Add JSON-LD structured data

### Architecture Improvements
50. Create ProviderComposer component
51. Add error boundaries to routes
52. Lazy load mini-games

### Master Set Mode
53. Master Set Mode toggle in Settings
54. Dual progress display in stats bar
55. Variant badges on all cards in grid
56. Variant filter component
57. Master Collector achievement badges

### AI Features UI
58. Card Scanner component
59. Collection Chat component
60. Card Story Modal
61. Quiz component for Learn page
62. Recommendations and Trade Advisor panels

### Other MEDIUM Priority
63. Hero card showcase with 4 TCGs
64. Parent Notification UI components
65. External image error handling
66. Kid-Friendly Set Display - Availability badges
67. Kid-Friendly Set Display - Vintage section
68. Kid-Friendly Set Display - Parent controls
69. Trade Logging - LogTradeModal component
70. Trade Logging - Entry points and timeline

---

## P3 - LOW Issues

### Mobile UX Evaluation
71. Audit touch targets (44x44px minimum)
72. Evaluate swipe gestures
73. Test orientation and layouts
74. Performance on older devices
75. PWA and offline support

### Gamification Evaluation
76. Pack Opening Simulator - evaluate remove/repurpose
77. Review all 37 badges
78. Streak system review
79. XP and Levels purpose review
80. Celebration frequency review
81. Virtual features audit
82. Gamification Audit Document

---

## Import Commands

Once beads routing is fixed, run these commands to import:

```bash
# CRITICAL (P0)
bd create "Add profile switcher to header for families" -p 0 -d "Allow switching between child profiles for parent accounts"
bd create "Restructure settings page - My Settings vs Family Controls" -p 0 -d "Visual separation of kid-accessible vs parent-only settings"
# ... etc
```

## Workaround

To work around the `~/.beads-planning` routing issue:
1. Delete `~/.beads-planning` directory
2. Remove or reinitialize beads
3. Or wait for a beads fix

The routing appears to be a hardcoded default in beads 0.48.0 multi-repo support.
