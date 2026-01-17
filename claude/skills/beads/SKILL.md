---
name: beads
description: |
  Manage issues, tickets, bugs, tasks, and features using Beads CLI (bd).
  Use when: creating issues, filing bugs, tracking tasks, updating tickets,
  working on issues, closing issues, or any issue/ticket/task management.
  Triggers: issue, ticket, bug, task, feature, epic, backlog, sprint,
  create issue, file bug, make ticket, work on, close issue, beads, bd.
---

# Beads Issue Management

You have expertise in Beads, a local-first issue tracking system. Whenever the user mentions issues, tickets, bugs, tasks, or any work tracking, you use Beads.

## Core Principle

**Every issue uses ALL fields properly.** Beads has structured fields - use them, don't dump everything in description.

## Beads Fields

| Field | Purpose | When to populate |
|-------|---------|------------------|
| **Title** | Short, actionable summary | Always (required) |
| **Description** | What needs to be done, background, deliverables | On creation |
| **Design** | Technical approach, architecture, implementation details | On creation if known |
| **Acceptance Criteria** | Checkable criteria (checklist format) | On creation (required) |
| **Notes** | Implementation summary, decisions made, learnings | After completion |
| **Type** | task, bug, feature, epic | On creation |
| **Priority** | P0 (critical) to P4 (backlog) | On creation |
| **Status** | open, in_progress, blocked, closed | Update as work progresses |

## Creating Issues

When creating an issue, ALWAYS:

1. **Use structured fields** - not everything in description
2. **Write acceptance criteria as a checklist** using the `--acceptance` flag
3. **Set appropriate type and priority**

**Note:** Issues are stored in `~/.beads-planning` (a centralized beads database). Use `--repo .` if you need to store issues in the local project's `.beads/` instead.

### Example: Creating a Well-Formed Issue

```bash
bd create \
  --title "Add user authentication to API" \
  --type feature \
  --priority P1 \
  --description "## Overview
Users need to authenticate before accessing protected endpoints.

## Background
Currently all endpoints are public. We need JWT-based auth.

## Deliverables
- Login endpoint
- Token validation middleware
- Protected route examples" \
  --design "## Technical Approach
- Use JWT tokens with 24h expiry
- Store refresh tokens in httpOnly cookies
- Middleware validates on each request

## Structure
- src/auth/jwt.ts - token generation/validation
- src/middleware/auth.ts - route protection
- src/routes/auth.ts - login/logout endpoints" \
  --acceptance "## Acceptance Criteria

- [ ] POST /auth/login accepts email/password and returns JWT
- [ ] JWT contains user ID and expiration
- [ ] Protected routes return 401 without valid token
- [ ] Refresh token flow works correctly
- [ ] Tests cover auth flows"
```

### Quick Issue Creation

For simpler issues:

```bash
bd create \
  --title "Fix navbar dropdown not closing on click outside" \
  --type bug \
  --priority P2 \
  --acceptance "- [ ] Dropdown closes when clicking outside
- [ ] Dropdown closes when pressing Escape
- [ ] Existing click behavior still works"
```

## Working on Issues

When the user asks to work on an issue or you determine it's time to start:

1. **Immediately mark it in_progress:**
   ```bash
   bd update <issue-id> --status in_progress
   ```

2. **Read all fields first:**
   ```bash
   bd show <issue-id>
   ```

3. **Understand before coding** - check Description, Design, Acceptance Criteria, and Notes

## Closing Issues

When the user says to close an issue, or work is complete:

1. **Verify all acceptance criteria are met** - check each one

2. **Update acceptance criteria to checked:**
   ```bash
   bd update <issue-id> --acceptance "## Acceptance Criteria

   - [x] First criterion - VERIFIED: <how verified>
   - [x] Second criterion - VERIFIED: <how verified>"
   ```

3. **Add implementation notes:**
   ```bash
   bd update <issue-id> --notes "## Implementation Summary

   ### What was done
   - Implemented X
   - Added Y
   - Fixed Z

   ### Key decisions
   - Chose approach A because...
   - Used library B for...

   ### Files modified
   - src/auth/jwt.ts (new)
   - src/middleware/auth.ts (new)
   - src/routes/index.ts (updated)

   ### Caveats
   - Rate limiting not included (separate issue)"
   ```

4. **Close the issue:**
   ```bash
   bd close <issue-id>
   ```

## Common Commands Reference

```bash
# List issues
bd list                      # All open issues
bd list --status closed      # Closed issues
bd ready                     # Unblocked issues ready to work

# View issue
bd show <issue-id>           # Full details

# Create issue
bd create --title "..." --type task --priority P2

# Update issue
bd update <issue-id> --status in_progress
bd update <issue-id> --acceptance "..."
bd update <issue-id> --notes "..."
bd update <issue-id> --priority P1

# Close issue
bd close <issue-id>

# Link issues
bd create --title "..." --parent <epic-id>        # Child of epic
bd create --title "..." --blocked-by <other-id>   # Blocked by another

# Search
bd search "keyword"
```

## Issue Types

| Type | Use for |
|------|---------|
| **task** | General work items, chores, improvements |
| **bug** | Something broken that needs fixing |
| **feature** | New functionality |
| **epic** | Container for related issues (don't work on directly) |

## Priority Levels

| Priority | Meaning |
|----------|---------|
| **P0** | Critical - drop everything |
| **P1** | High - do soon |
| **P2** | Medium - normal priority (default) |
| **P3** | Low - when time permits |
| **P4** | Backlog - someday/maybe |

## Workflow Summary

```
CREATE          START WORK        COMPLETE           CLOSE
   |                |                 |                |
   v                v                 v                v
[Title]         [in_progress]    [Check off AC]    [Add notes]
[Description]   [Read all        [Update with      [bd close]
[Design]         fields]          verification]
[Acceptance]
[Type/Priority]
```

## Anti-Patterns to Avoid

- Putting acceptance criteria inside description (use --acceptance)
- Forgetting to mark in_progress before starting work
- Closing without checking off acceptance criteria
- Closing without adding implementation notes
- Creating issues without acceptance criteria
- Vague acceptance criteria that can't be verified

## Epic Handling

Epics are containers, not work items:

1. Never work on an epic directly
2. Create child issues under the epic: `--parent <epic-id>`
3. Work on the children
4. Close epic when all children are closed
