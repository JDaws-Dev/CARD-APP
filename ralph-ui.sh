#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Ralph Wickham Technique - UI Task Runner for CardDex
# =============================================================================
# Usage: ./ralph-ui.sh [max_iterations]
#
# This script automates UI development by having Claude:
# 1. Read tasks-ui.md and pick ONE incomplete task
# 2. Implement the change
# 3. Run tests and linters
# 4. Commit the changes
# 5. Update tasks-ui.md with progress
# 6. Repeat until done or max iterations reached
# =============================================================================

MAX_ITERATIONS=${1:-10}
TASK_FILE="tasks-ui.md"
COMPLETE_FLAG="ralph_ui_complete"

echo "=========================================="
echo "Ralph UI Task Runner"
echo "Max iterations: $MAX_ITERATIONS"
echo "Task file: $TASK_FILE"
echo "=========================================="

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo ""
  echo ">>> Iteration $i of $MAX_ITERATIONS"
  echo "-------------------------------------------"

  # Exit if completion flag exists
  if [[ -f "$COMPLETE_FLAG" ]]; then
    echo "All UI tasks complete (found $COMPLETE_FLAG). Exiting."
    exit 0
  fi

  # Check if task file exists
  if [[ ! -f "$TASK_FILE" ]]; then
    echo "Error: $TASK_FILE not found!"
    exit 1
  fi

  # The prompt for Claude
  AGENT_PROMPT=$(cat <<'PROMPT'
Read tasks-ui.md carefully. Choose ONE suitable incomplete task (marked with `- [ ]`).

Your job:
1. Implement the UI change in the repository
2. Include tests where practical
3. Run the test suite - do NOT stop until tests pass
4. Run linters/formatters (ESLint, Prettier)
5. Commit the changes with a descriptive message
6. Update tasks-ui.md:
   - Mark the completed task with `- [x]`
   - Add a Progress entry at the bottom with timestamp and description

Important:
- Focus on ONE task only
- Write clean, production-quality React/Next.js code
- Follow existing code patterns and conventions
- Use Heroicons instead of emojis (per coding guidelines in tasks.md)
- If you cannot complete a task, document why in Progress and move to the next

If there are NO remaining incomplete tasks, create a file named `ralph_ui_complete` and exit.
PROMPT
)

  # Run Claude with the prompt
  echo "$AGENT_PROMPT" | claude --print

  echo ""
  echo ">>> Completed iteration $i"
  echo "-------------------------------------------"

  # Small pause between iterations
  sleep 2
done

echo ""
echo "=========================================="
echo "Reached maximum iterations ($MAX_ITERATIONS)"
echo "Review tasks-ui.md to see progress"
echo "=========================================="
exit 0
