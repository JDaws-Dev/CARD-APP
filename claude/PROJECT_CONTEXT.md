# CardDex Project Context

This file helps Claude maintain context across sessions and after compaction.

## Beads Issue Tracking

**IMPORTANT: There are TWO beads databases:**

1. **Local project beads**: `.beads/` in project root
   - Command: `bd list` (default)
   - Used for: project-specific issues created during development

2. **Global planning beads**: `~/.beads-planning/.beads/`
   - Command: `BEADS_DIR=~/.beads-planning/.beads bd list`
   - Used for: main task backlog, Ralph autonomous loop
   - **This is where the 36+ tasks live**

### Quick Commands

```bash
# Check global beads (main backlog)
BEADS_DIR=~/.beads-planning/.beads bd ready
BEADS_DIR=~/.beads-planning/.beads bd stats
BEADS_DIR=~/.beads-planning/.beads bd list --status open

# Create task in global beads
BEADS_DIR=~/.beads-planning/.beads bd create --title "..." --type task --priority 1

# Check local beads
bd ready
bd stats
```

## Ralph Autonomous Loop

Ralph processes issues automatically using the beads task system.

```bash
# Start Ralph with global beads
BEADS_DIR=~/.beads-planning/.beads ./ralph.sh --all --max 100

# Check if Ralph is running
ps aux | grep ralph.sh | grep -v grep

# Check Ralph progress
tail -20 .ralph/ralph.log
tail -50 .ralph/progress.txt
```

## Dev Server

```bash
# Start dev server (use port 3001 if 3000 is taken by Beads UI)
npm run dev -- -p 3001

# Clear cache if MIME type errors occur
rm -rf .next && npm run dev -- -p 3001
```

## Key Architecture Notes

- **Game Selector**: `useGameSelector()` hook provides `primaryGame` context
- **Mobile Bottom Nav**: `MobileBottomNav` component (not `MobileGameBar`)
- **Auth-aware wrapper**: `AuthAwareMobileGameBar` shows nav only for authenticated users
- **Game theming**: CSS variables like `bg-game-gradient`, `text-game-primary`

## Current P0 Tasks (as of session)

Check with: `BEADS_DIR=~/.beads-planning/.beads bd list --priority 0`

## Files Modified by Ralph

Ralph commits changes with issue IDs. Check recent commits:
```bash
git log --oneline -20
```
