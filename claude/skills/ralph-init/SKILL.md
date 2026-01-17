---
name: ralph-init
description: Initialize Ralph Wiggum autonomous loop with Beads issue tracking
allowed-tools: "Read,Write,Bash(bd:*),Bash(chmod:*),Bash(mkdir:*),Bash(git:*),Bash(which:*),Bash(npm:*),Glob,Grep"
---

# Ralph Init Skill

Initialize the Ralph Wiggum autonomous development loop in any project. This skill creates all necessary files for running an autonomous issue-processing loop powered by Claude Code and Beads.

## What This Creates

When invoked, create these files in the current project:

```
project-root/
├── .ralph/
│   ├── PROMPT.md           # 11-step workflow prompt template
│   ├── AGENT.md            # Project-specific agent instructions
│   ├── progress.txt        # Progress tracking log (empty)
│   └── ralph.log           # Loop execution log (empty)
├── ralph.sh                # Executable loop runner script
└── .beads/                 # Created by bd init (if not exists)
```

## Pre-flight Checks (Run These First)

Before creating files, verify the environment:

### 1. Check Beads CLI

```bash
which bd
```

**If not found**, tell the user:
```
Beads CLI not found. Install it with: npm i -g beads
Then run /ralph-init again.
```
Stop here if beads is not installed.

### 2. Check Git Repository

```bash
git rev-parse --git-dir 2>/dev/null
```

**If not a git repo**, suggest:
```
This directory is not a git repository. Initialize with: git init
```
You can proceed, but warn the user that git is recommended.

### 3. Check Beads Initialization

Look for `.beads/` directory in the project root.

**If not found**, run:
```bash
bd init
```

This creates the `.beads/` directory with project configuration.

## Stack Detection

Detect the project type to customize AGENT.md with appropriate commands:

| Detection | Stack | Dev Command | Build Command | Test Command |
|-----------|-------|-------------|---------------|--------------|
| `package.json` with `"next"` in dependencies | Next.js | `npm run dev` | `npm run build` | `npm run test` |
| `package.json` with `"vite"` in dependencies | Vite | `npm run dev` | `npm run build` | `npm run test` |
| `package.json` with `"react"` (no next/vite) | React | `npm start` | `npm run build` | `npm run test` |
| `package.json` exists (generic) | Node.js | `npm run dev` | `npm run build` | `npm test` |
| `Cargo.toml` exists | Rust | `cargo run` | `cargo build --release` | `cargo test` |
| `pyproject.toml` or `setup.py` exists | Python | `python main.py` | N/A | `pytest` |
| `go.mod` exists | Go | `go run .` | `go build` | `go test ./...` |
| None of the above | Generic | N/A | N/A | N/A |

## File Templates

### Create: `.ralph/PROMPT.md`

Create this file with the exact content below:

~~~markdown
# Ralph Loop - Issue Processing Iteration

## CRITICAL: ONE ISSUE ONLY

**You MUST complete exactly ONE issue, then STOP.**

Do NOT:
- Work on multiple issues
- Start a second issue after completing one
- Try to be "efficient" by doing more
- Run `bd ready` again after closing an issue

The loop will restart you for the next issue. Your job is ONE issue per iteration.

---

## Current Scope

{{SCOPE_DESCRIPTION}}

**Filter command:** `{{READY_CMD}}`
{{EPIC_CONTEXT}}

---

## STEP 1: Fetch Your Issue (MANDATORY FIRST STEP)

Run the ready command to get your next issue:
```bash
{{READY_CMD}}
```

Select the **top issue** from the list.

**IF AND ONLY IF the list is empty** (no issues returned), output this exact line on its own and stop:

RALPH_SIGNAL::SCOPE_COMPLETE

**OTHERWISE** (if there ARE issues), continue to the next step. **NEVER output the signal after completing work - the loop handles iteration.**

**IMMEDIATELY** mark it in progress:
```bash
bd update <issue-id> --status in_progress
```

Do NOT proceed to any other step until you have marked the issue in progress.

**EPIC HANDLING:**
- If an **epic** (type: epic) appears in the ready list, **DO NOT work on the epic directly**
- Instead: Read the epic with `bd show <epic-id>` to understand context
- Then: Look at its children (shown at bottom of `bd show` output)
- Pick the first OPEN child issue (type: task, bug, or feature) and mark THAT as in_progress instead
- Epics are containers for organizing work - the real work is in the child issues

---

## STEP 2: Understand the Issue (READ ALL FIELDS)

Read the full issue details:
```bash
bd show <issue-id>
```

**IMPORTANT: Beads issues have multiple fields. Read and understand ALL of them:**

| Field | Purpose |
|-------|---------|
| **DESCRIPTION** | Overview of what needs to be done, background context, deliverables |
| **DESIGN** | Technical approach, implementation details, structure/architecture |
| **ACCEPTANCE CRITERIA** | Checkable criteria that MUST all be `[x]` before closing |
| **NOTES** | Additional context, implementation notes from previous work |

Also check for comments - the `bd show` output includes a Comments section at the bottom. Comments may contain:
- Design references and mockups
- Additional requirements not in the main description
- Clarifications from the issue creator
- Links to spec files or images

**Do NOT skip the comments section.** If there are comments, read them carefully.

**Before proceeding, ensure you understand:**
- What is the goal? (from DESCRIPTION)
- How should it be built? (from DESIGN)
- What defines "done"? (from ACCEPTANCE CRITERIA)
- Any additional context? (from NOTES and comments)

---

## STEP 3: Evaluate Issue Size (MANDATORY)

After reading the issue, evaluate its scope before starting work:

### 1. Analyze Scope

List the files that will likely need changes and count distinct logical changes:

```bash
# Think through:
# - Which files need to be modified?
# - How many separate, distinct changes are required?
# - Are there multiple independent concerns?
```

### 2. Assign Size

| Size | Files | Distinct Changes | Action |
|------|-------|------------------|--------|
| **S** | 1-2 | 1-2 | Work directly |
| **M** | 3-5 | 2-4 | Work directly |
| **L** | 6-10 | 5-8 | **Decompose first** |
| **XL** | 10+ | 8+ | **Must decompose** |

### 3. If Size is L or XL: Decompose

**STOP** - Do not start coding. Decompose into smaller sub-issues first:

```bash
# Create sub-issues linked to parent
bd create --title "Sub-task 1: <specific piece>" --type task --parent <issue-id>
bd create --title "Sub-task 2: <specific piece>" --type task --parent <issue-id>
# ... continue for each logical piece
```

**Decomposition Rules:**
- Each sub-issue should be S or M sized
- Each sub-issue should be independently testable
- Each sub-issue should be independently committable
- Use `--blocked-by` if sub-issues have dependencies
- First sub-issue should be the foundation others build on

After decomposing:
1. Update parent issue notes explaining the decomposition
2. Mark the parent issue as `blocked` (it's now just a container)
3. Start work on the first sub-issue

### 4. If Size is S or M: Proceed

Continue to the next step.

---

## STEP 4: Research

Before implementing, verify the work actually needs doing:
- Check if the problem still exists
- Check if someone else already did the work
- Check if the approach makes sense

If the issue is no longer relevant, close it with a note explaining why.

---

## STEP 5: Implement

Do the actual work. Follow project patterns and conventions.

**Keep commits atomic.** Commit related changes together with the issue ID:
```bash
git add <files>
git commit -m "<type>(<scope>): <description>

Refs: <issue-id>"
```

---

## STEP 6: Validate

Verify your implementation works:
- Run relevant tests if available
- Check for lint/type errors
- Manually verify if needed
- For UI changes, test in browser

If validation fails, fix the issues before proceeding.

---

## STEP 7: Check Acceptance Criteria (MANDATORY)

**You MUST verify and check off EACH criterion before closing. This is NOT optional.**

1. Run `bd show <issue-id>` to see the acceptance criteria
2. Go through EACH criterion one by one:
   - Did you actually do this? Verify it.
   - If YES: Mark it `[x]`
   - If NO: Go back and do it. Do not proceed.

3. Update the issue with ALL criteria checked:

```bash
bd update <issue-id> --acceptance "## Acceptance Criteria

- [x] First criterion - VERIFIED: <how you verified it>
- [x] Second criterion - VERIFIED: <how you verified it>
- [x] Third criterion - VERIFIED: <how you verified it>
..."
```

**CRITICAL: If ANY criterion shows `[ ]` (unchecked), you are NOT DONE. Go back and complete it.**

**CRITICAL: You must actually RUN the `bd update --acceptance` command to check things off.**

---

## STEP 8: Handle Discoveries

During your work, you may discover bugs, missing functionality, or follow-up tasks.

**DO NOT get blocked by these.** File new issues:
```bash
bd create --title "<title>" --type <bug|task|feature> --priority P2{{PARENT_FLAG}}
```

Add any relevant context to the new issue description.

---

## STEP 9: Add Implementation Notes

Before closing, add notes documenting what you did:
```bash
bd update <issue-id> --notes "## Implementation Summary

- What was done
- Key decisions made
- Any caveats or limitations
- Files modified"
```

---

## STEP 10: Final Check Before Close

Before running `bd close`:

1. Run `bd show <issue-id>` one more time
2. Confirm ALL acceptance criteria show `[x]`
3. If ANY show `[ ]`, STOP and go complete them
4. Only proceed if everything is checked

---

## STEP 11: Close the Issue

Once everything is validated:

1. Close the issue: `bd close <issue-id>`
2. Append to progress log:
   ```bash
   cat >> .ralph/progress.txt << 'EOF'
   ## <issue-id> - <issue-title>
   **Status:** Completed
   **Changes:** <brief summary of what was implemented>
   **Files:** <list of key files created/modified>
   **Commit:** <commit hash>
   ---
   EOF
   ```
3. Run `git add -A`
4. Run `git commit` referencing the issue ID

Then check if the parent epic (if any) is now complete:
- If issue had a parent epic, check `bd show <parent-epic-id>`
- If ALL children are closed, close the epic too

---

## COMPLETION - STOP HERE

After closing the issue:

1. **STOP IMMEDIATELY** - Do not start another issue
2. **Do not run `bd ready` again** - The loop handles this
3. **Do not "peek" at what's next** - Just stop

The loop will restart you for the next issue automatically.

**DO NOT output any completion signal here.** The signal is ONLY for Step 1 when the list is empty.

If you completed an issue successfully, just stop. The loop will restart you.

**YOUR ITERATION IS DONE. STOP NOW.**

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `{{READY_CMD}}` | List issues ready to work (scoped) |
| `bd show <id>` | View issue details |
| `bd update <id> --status in_progress` | Claim an issue |
| `bd update <id> --acceptance "<text>"` | Update acceptance criteria |
| `bd update <id> --notes "<text>"` | Add implementation notes |
| `bd create --title "..." --type task{{PARENT_FLAG}}` | Create new issue |
| `bd close <id>` | Close completed issue |

---

## Critical Rules Summary

1. **ONE ISSUE, THEN STOP** - This is the most important rule
2. **Mark in progress FIRST** - Before any other work
3. **Read ALL fields** - Description, Design, Acceptance Criteria, Notes, Comments
4. **All acceptance criteria must be `[x]`** - Every single one
5. **File issues for discoveries** - Don't get blocked, create new issues
6. **Commit with issue ID** - Include the beads ID in commit message
7. **Progress over perfection** - A closed issue with notes beats a stuck issue

---

Now begin with Step 1. Complete ONE issue, then STOP.
~~~

### Create: `.ralph/AGENT.md`

Create this file, customizing the stack-specific sections based on detected project type:

~~~markdown
# Agent Instructions - {{PROJECT_NAME}}

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

## Project Stack

{{STACK_DESCRIPTION}}

## Quality Gates (MANDATORY)

**ALWAYS run quality checks before committing:**

{{QUALITY_COMMANDS}}

## Running the Project

{{RUN_COMMANDS}}

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
(Document key directories and files here as you learn them)
```

## Code Patterns

(Document patterns and conventions as you discover them)

## Learnings

(Add discoveries here as you work on issues)
~~~

**Stack-specific replacements:**

**For Next.js:**
```
{{STACK_DESCRIPTION}} =
- **Framework**: Next.js (React)
- **Styling**: [detect: Tailwind, CSS Modules, styled-components, etc.]
- **Testing**: [detect: Jest, Vitest, Playwright, etc.]

{{QUALITY_COMMANDS}} =
```bash
npm run build     # Build - must pass
npm run lint      # Lint check
npm run test      # Run tests
```

{{RUN_COMMANDS}} =
```bash
npm run dev       # Start development server (usually http://localhost:3000)
npm run build     # Production build
npm run start     # Start production server
```
```

**For Vite:**
```
{{STACK_DESCRIPTION}} =
- **Build Tool**: Vite
- **Framework**: [detect: React, Vue, Svelte, Vanilla]
- **Testing**: Vitest

{{QUALITY_COMMANDS}} =
```bash
npm run build     # Build - must pass
npm run lint      # Lint check (if configured)
npm run test      # Run tests
```

{{RUN_COMMANDS}} =
```bash
npm run dev       # Start dev server (usually http://localhost:5173)
npm run build     # Production build
npm run preview   # Preview production build
```
```

**For Python:**
```
{{STACK_DESCRIPTION}} =
- **Language**: Python
- **Package Manager**: [detect: pip, poetry, uv]
- **Testing**: pytest

{{QUALITY_COMMANDS}} =
```bash
pytest            # Run tests
ruff check .      # Lint (if ruff installed)
mypy .            # Type check (if mypy installed)
```

{{RUN_COMMANDS}} =
```bash
python main.py    # Run main script (adjust as needed)
```
```

**For Rust:**
```
{{STACK_DESCRIPTION}} =
- **Language**: Rust
- **Build**: Cargo

{{QUALITY_COMMANDS}} =
```bash
cargo build       # Build - must pass
cargo test        # Run tests
cargo clippy      # Lint
cargo fmt --check # Format check
```

{{RUN_COMMANDS}} =
```bash
cargo run         # Run in debug mode
cargo run --release  # Run in release mode
```
```

**For Go:**
```
{{STACK_DESCRIPTION}} =
- **Language**: Go

{{QUALITY_COMMANDS}} =
```bash
go build ./...    # Build - must pass
go test ./...     # Run tests
go vet ./...      # Static analysis
```

{{RUN_COMMANDS}} =
```bash
go run .          # Run the project
```
```

**For Generic/Unknown:**
```
{{STACK_DESCRIPTION}} =
- (Describe the project stack here)

{{QUALITY_COMMANDS}} =
```bash
# Add your quality check commands here
```

{{RUN_COMMANDS}} =
```bash
# Add your run commands here
```
```

### Create: `ralph.sh`

Create this file at the project root (not in .ralph/) and make it executable:

~~~bash
#!/bin/bash
#
# Ralph Wiggum Loop - Autonomous Issue Processing
# "I'm helping!" - Ralph Wiggum
#
# This script automates working through Beads issues by piping a templated
# prompt to Claude Code in a loop. Each iteration handles exactly one issue.
#
# Usage:
#   ./ralph.sh --epic <epic-id>     Work on issues in a specific epic
#   ./ralph.sh --type <type>        Work on issues of a specific type (task, bug, feature)
#   ./ralph.sh --label <label>      Work on issues with a specific label
#   ./ralph.sh --priority <n>       Work on issues with priority <= n
#   ./ralph.sh --all                Work on all open issues
#   ./ralph.sh --max <n>            Set max iterations (default: 50)
#   ./ralph.sh --help               Show this help message
#
# Multiple filters can be combined:
#   ./ralph.sh --epic beads-abc --type task --max 20

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RALPH_DIR="$PROJECT_ROOT/.ralph"
PROMPT_TEMPLATE="$RALPH_DIR/PROMPT.md"
GENERATED_PROMPT="$RALPH_DIR/generated_prompt.md"
LOG_FILE="$RALPH_DIR/ralph.log"
PROGRESS_FILE="$RALPH_DIR/progress.txt"
OUTPUT_FILE="$RALPH_DIR/output.tmp"
MAX_ITERATIONS=50

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Scope variables
EPIC_ID=""
ISSUE_TYPE=""
LABEL=""
PRIORITY=""
SCOPE_ALL=false

# Logging function with timestamp
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" >> "$LOG_FILE"
    echo -e "${BLUE}[$timestamp]${NC} $1"
}

# Error handling
error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    exit 1
}

# Show help
show_help() {
    cat << 'EOF'
Ralph Wiggum Loop - Autonomous Issue Processing

Usage:
  ./ralph.sh [OPTIONS]

Options:
  --epic <id>       Work on issues in a specific epic (uses --parent filter)
  --type <type>     Work on issues of a specific type (task, bug, feature)
  --label <label>   Work on issues with a specific label
  --priority <n>    Work on issues with priority <= n (0=critical, 4=backlog)
  --all             Work on all open issues (use with caution!)
  --max <n>         Set maximum iterations (default: 50)
  --help            Show this help message

Examples:
  ./ralph.sh --epic project-abc123 --max 20
  ./ralph.sh --type bug
  ./ralph.sh --label frontend --type task
  ./ralph.sh --priority 1 --max 30
  ./ralph.sh --all --max 100

Notes:
  - At least one scope filter is required (--epic, --type, --label, --priority, or --all)
  - Multiple filters can be combined to narrow the scope
  - The loop stops when: all issues complete, max iterations reached, or completion signal detected
EOF
    exit 0
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --epic|-e)
                EPIC_ID="$2"
                shift 2
                ;;
            --type|-t)
                ISSUE_TYPE="$2"
                shift 2
                ;;
            --label|-l)
                LABEL="$2"
                shift 2
                ;;
            --priority|-p)
                PRIORITY="$2"
                shift 2
                ;;
            --all|-a)
                SCOPE_ALL=true
                shift
                ;;
            --max|-m)
                MAX_ITERATIONS="$2"
                shift 2
                ;;
            --help|-h)
                show_help
                ;;
            *)
                error "Unknown option: $1. Use --help for usage."
                ;;
        esac
    done
}

# Validate that at least one scope is specified
validate_scope() {
    if [[ -z "$EPIC_ID" && -z "$ISSUE_TYPE" && -z "$LABEL" && -z "$PRIORITY" && "$SCOPE_ALL" == false ]]; then
        error "No scope specified. Use --epic, --type, --label, --priority, or --all. Use --help for usage."
    fi
}

# Validate epic exists if specified
validate_epic() {
    if [[ -n "$EPIC_ID" ]]; then
        if ! bd show "$EPIC_ID" &>/dev/null; then
            error "Epic '$EPIC_ID' not found. Check the ID and try again."
        fi
        log "Validated epic: $EPIC_ID"
    fi
}

# Build the bd ready command with filters
build_ready_cmd() {
    local cmd="bd ready"

    if [[ -n "$EPIC_ID" ]]; then
        cmd="$cmd --parent $EPIC_ID"
    fi

    if [[ -n "$ISSUE_TYPE" ]]; then
        cmd="$cmd --type $ISSUE_TYPE"
    fi

    if [[ -n "$LABEL" ]]; then
        cmd="$cmd --label $LABEL"
    fi

    if [[ -n "$PRIORITY" ]]; then
        cmd="$cmd --priority $PRIORITY"
    fi

    echo "$cmd"
}

# Build human-readable scope description
build_scope_description() {
    local parts=()

    if [[ -n "$EPIC_ID" ]]; then
        parts+=("epic **$EPIC_ID**")
    fi

    if [[ -n "$ISSUE_TYPE" ]]; then
        parts+=("type=**$ISSUE_TYPE**")
    fi

    if [[ -n "$LABEL" ]]; then
        parts+=("label=**$LABEL**")
    fi

    if [[ -n "$PRIORITY" ]]; then
        parts+=("priority<=**$PRIORITY**")
    fi

    if [[ "$SCOPE_ALL" == true ]]; then
        parts+=("**all open issues**")
    fi

    local IFS=", "
    echo "Working on: ${parts[*]}"
}

# Get epic context if working on an epic
get_epic_context() {
    if [[ -n "$EPIC_ID" ]]; then
        echo "\\n**Epic:** \`$EPIC_ID\`\\nWhen creating new issues, always link them to this epic with \`--parent $EPIC_ID\`"
    else
        echo ""
    fi
}

# Get parent flag for issue creation
get_parent_flag() {
    if [[ -n "$EPIC_ID" ]]; then
        echo " --parent $EPIC_ID"
    else
        echo ""
    fi
}

# Import issues from INBOX.md (for remote issue creation via phone)
import_inbox() {
    local inbox_file="$PROJECT_ROOT/INBOX.md"
    local inbox_hash_file="$RALPH_DIR/.inbox_imported_hash"

    # Pull latest changes to get any INBOX.md updates
    log "Checking for remote updates..."
    git pull --rebase 2>/dev/null || true

    if [[ ! -f "$inbox_file" ]]; then
        return 0
    fi

    # Check if there are any issues (## headers)
    if ! grep -q "^## " "$inbox_file"; then
        return 0
    fi

    # Calculate hash of current inbox content to detect duplicates
    local current_hash=$(grep "^## " "$inbox_file" | md5sum | cut -d' ' -f1)

    # Check if we already imported this exact content
    if [[ -f "$inbox_hash_file" ]] && [[ "$(cat "$inbox_hash_file")" == "$current_hash" ]]; then
        log "Inbox content already imported (hash match). Attempting to clear again..."
    else
        log "Found new issues in INBOX.md, importing..."

        # Import the issues
        if ! bd create -f "$inbox_file" 2>&1; then
            log "Warning: Failed to import issues from INBOX.md"
            return 1
        fi

        log "Successfully imported issues from INBOX.md"
        echo "$current_hash" > "$inbox_hash_file"
    fi

    # Reset INBOX.md to just the header
    cat > "$inbox_file" << 'INBOX_HEADER'
# Issue Inbox

Add issues here from your phone. Ralph will import them automatically.

**Format:** Use `## Issue Title` followed by a description.

---

<!-- Add issues below this line -->

INBOX_HEADER

    # Commit and push the cleared inbox
    git add "$inbox_file"
    git commit -m "chore: Clear imported issues from INBOX.md" 2>/dev/null || true

    if git push 2>/dev/null; then
        log "Cleared and pushed INBOX.md"
        rm -f "$inbox_hash_file"
    else
        log "Warning: Push failed. Will retry next iteration."
    fi
}

# Count remaining issues
count_remaining() {
    local ready_cmd="$1"
    local count
    count=$($ready_cmd 2>/dev/null | grep -c '^\s*[0-9]\+\. \[' || true)
    echo "${count:-0}"
}

# Generate prompt from template
generate_prompt() {
    local ready_cmd="$1"
    local scope_desc="$2"
    local epic_context="$3"
    local parent_flag="$4"

    if [[ ! -f "$PROMPT_TEMPLATE" ]]; then
        error "Prompt template not found: $PROMPT_TEMPLATE"
    fi

    # Read template and substitute placeholders
    sed -e "s|{{READY_CMD}}|$ready_cmd|g" \
        -e "s|{{SCOPE_DESCRIPTION}}|$scope_desc|g" \
        -e "s|{{PARENT_FLAG}}|$parent_flag|g" \
        -e "s|{{EPIC_CONTEXT}}|$epic_context|g" \
        "$PROMPT_TEMPLATE" | sed 's/\\n/\
/g' > "$GENERATED_PROMPT"
}

# Cleanup on exit
cleanup() {
    echo ""
    log "Ralph loop interrupted. Cleaning up..."
    rm -f "$OUTPUT_FILE" "$GENERATED_PROMPT"
    # Show final stats
    echo ""
    echo -e "${YELLOW}=== Final Status ===${NC}"
    bd stats 2>/dev/null || true
    echo ""
    if [[ -f "$PROGRESS_FILE" ]]; then
        local completed=$(grep -c "^## " "$PROGRESS_FILE" 2>/dev/null || echo "0")
        echo -e "${GREEN}Issues completed this session: $completed${NC}"
    fi
}

trap cleanup SIGINT SIGTERM

# Main loop
main() {
    parse_args "$@"
    validate_scope
    validate_epic

    local ready_cmd=$(build_ready_cmd)
    local scope_desc=$(build_scope_description)
    local epic_context=$(get_epic_context)
    local parent_flag=$(get_parent_flag)

    # Initialize log
    log "=========================================="
    log "Ralph Wiggum Loop Starting"
    log "Scope: $scope_desc"
    log "Ready command: $ready_cmd"
    log "Max iterations: $MAX_ITERATIONS"
    log "=========================================="

    # Initialize progress file for this session
    echo "" >> "$PROGRESS_FILE"
    echo "# Ralph Session $(date '+%Y-%m-%d %H:%M:%S')" >> "$PROGRESS_FILE"
    echo "# Scope: $scope_desc" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"

    # Print startup banner
    echo ""
    echo -e "${GREEN}==========================================${NC}"
    echo -e "${GREEN}Ralph Wiggum Loop${NC}"
    echo -e "${GREEN}\"I'm helping!\"${NC}"
    echo -e "${GREEN}==========================================${NC}"
    echo "Scope: $scope_desc"
    echo "Filter: $ready_cmd"
    echo "Max iterations: $MAX_ITERATIONS"
    echo "Progress file: $PROGRESS_FILE"
    echo "Press Ctrl+C to stop"
    echo ""

    local iteration=0

    while [[ $iteration -lt $MAX_ITERATIONS ]]; do
        ((iteration++))

        echo ""
        echo -e "${YELLOW}==========================================${NC}"
        echo -e "${YELLOW}ITERATION $iteration of $MAX_ITERATIONS${NC}"
        echo -e "${YELLOW}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
        echo -e "${YELLOW}==========================================${NC}"

        # Check for new issues from INBOX.md
        import_inbox

        # Check remaining issues
        local remaining=$(count_remaining "$ready_cmd")
        log "Iteration $iteration: $remaining issues remaining"

        if [[ "$remaining" -eq 0 ]]; then
            echo ""
            echo -e "${GREEN}==========================================${NC}"
            echo -e "${GREEN}ALL ISSUES IN SCOPE COMPLETE!${NC}"
            echo -e "${GREEN}==========================================${NC}"
            log "All issues complete. Exiting loop."
            break
        fi

        # Show next ready issues
        echo ""
        echo -e "${BLUE}Next ready issues:${NC}"
        $ready_cmd 2>/dev/null | head -5
        echo ""

        # Generate the prompt
        generate_prompt "$ready_cmd" "$scope_desc" "$epic_context" "$parent_flag"

        log "Running Claude for iteration $iteration..."

        # Run Claude with retry logic for transient errors
        local max_retries=3
        local retry_count=0
        local claude_success=false

        while [[ $retry_count -lt $max_retries ]]; do
            # Run claude and capture output
            if cat "$GENERATED_PROMPT" | claude --dangerously-skip-permissions 2>&1 | tee "$OUTPUT_FILE"; then
                log "Claude iteration $iteration completed"
                claude_success=true
                break
            else
                retry_count=$((retry_count + 1))
                if [[ $retry_count -lt $max_retries ]]; then
                    local backoff=$((retry_count * 5))
                    log "Claude failed. Retry $retry_count/$max_retries in ${backoff}s..."
                    sleep "$backoff"
                else
                    log "Claude iteration $iteration failed after $max_retries retries"
                fi
            fi
        done

        # If Claude completely failed, skip to next iteration
        if [[ "$claude_success" == false ]]; then
            log "Skipping to next iteration due to Claude failure"
            rm -f "$OUTPUT_FILE"
            sleep 5
            continue
        fi

        # Check for completion signal (must be exact match on its own line)
        if grep -q "^RALPH_SIGNAL::SCOPE_COMPLETE$" "$OUTPUT_FILE" 2>/dev/null; then
            echo ""
            echo -e "${GREEN}==========================================${NC}"
            echo -e "${GREEN}SCOPE COMPLETE SIGNAL DETECTED!${NC}"
            echo -e "${GREEN}==========================================${NC}"
            log "Completion signal detected. Exiting loop."
            rm -f "$OUTPUT_FILE"
            break
        fi

        rm -f "$OUTPUT_FILE"

        # Brief pause between iterations
        log "Pausing before next iteration..."
        sleep 2
    done

    if [[ $iteration -ge $MAX_ITERATIONS ]]; then
        echo ""
        echo -e "${YELLOW}==========================================${NC}"
        echo -e "${YELLOW}MAX ITERATIONS ($MAX_ITERATIONS) REACHED${NC}"
        echo -e "${YELLOW}==========================================${NC}"
        log "Max iterations reached. Stopping loop."
    fi

    # Final summary
    echo ""
    echo -e "${BLUE}=== Final Summary ===${NC}"
    bd stats 2>/dev/null || true
    echo ""
    if [[ -f "$PROGRESS_FILE" ]]; then
        local completed=$(grep -c "^## " "$PROGRESS_FILE" 2>/dev/null || echo "0")
        echo -e "${GREEN}Issues completed this session: $completed${NC}"
    fi
    log "Ralph loop finished after $iteration iterations"
}

# Run main
main "$@"
~~~

After creating `ralph.sh`, make it executable:
```bash
chmod +x ralph.sh
```

### Create: `.ralph/progress.txt`

Create an empty file:
```bash
touch .ralph/progress.txt
```

### Create: `.ralph/ralph.log`

Create an empty file:
```bash
touch .ralph/ralph.log
```

## Execution Steps

When the user runs `/ralph-init`:

1. **Run pre-flight checks** (beads installed, git repo, beads initialized)
2. **Detect project stack** by examining package.json, Cargo.toml, etc.
3. **Create `.ralph/` directory** if it doesn't exist
4. **Create `.ralph/PROMPT.md`** with the template above (verbatim)
5. **Create `.ralph/AGENT.md`** with stack-specific customizations
6. **Create `ralph.sh`** at project root
7. **Make `ralph.sh` executable** with `chmod +x ralph.sh`
8. **Create empty `.ralph/progress.txt`** and `.ralph/ralph.log`
9. **Run `bd init`** if `.beads/` doesn't exist

## Post-Init Message

After creating all files, display:

```
Ralph Wiggum initialized successfully!

Created:
  .ralph/PROMPT.md     - Issue processing workflow
  .ralph/AGENT.md      - Project-specific instructions (customize this!)
  .ralph/progress.txt  - Progress tracking
  ralph.sh             - Loop runner (executable)

Quick start:
  1. Create some issues:  bd create --title "My first task" --type task
  2. Run the loop:        ./ralph.sh --all --max 5

Tips:
  - Edit .ralph/AGENT.md to add project-specific commands and patterns
  - Use --epic <id> to work on a specific epic's issues
  - Use --type bug to focus on bugs only
  - Check .ralph/progress.txt for completed work history
```
