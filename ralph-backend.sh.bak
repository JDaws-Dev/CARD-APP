#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Ralph Wickham Technique - Backend Task Runner for CardDex
# =============================================================================
# Usage: ./ralph-backend.sh [max_iterations]
#
# This script automates backend development by having Claude:
# 1. Read tasks-backend.md and pick ONE incomplete task
# 2. Implement the change
# 3. Run tests and linters
# 4. Commit the changes
# 5. Update tasks-backend.md with progress
# 6. Repeat until done or max iterations reached
# =============================================================================

MAX_ITERATIONS=${1:-10}
TASK_FILE="tasks-backend.md"
COMPLETE_FLAG="ralph_backend_complete"

echo "=========================================="
echo "Ralph Backend Task Runner"
echo "Max iterations: $MAX_ITERATIONS"
echo "Task file: $TASK_FILE"
echo "=========================================="

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo ""
  echo ">>> Iteration $i of $MAX_ITERATIONS"
  echo "-------------------------------------------"

  # Exit if completion flag exists
  if [[ -f "$COMPLETE_FLAG" ]]; then
    echo "All backend tasks complete (found $COMPLETE_FLAG). Exiting."
    exit 0
  fi

  # Check if task file exists
  if [[ ! -f "$TASK_FILE" ]]; then
    echo "Error: $TASK_FILE not found!"
    exit 1
  fi

  # The prompt for Claude
  AGENT_PROMPT=$(cat <<'PROMPT'
Read tasks-backend.md carefully. Choose ONE suitable incomplete task (marked with `- [ ]`).

Your job:
1. Implement the backend change in the repository
2. Include tests where practical
3. Run the test suite - do NOT stop until tests pass
4. Run linters/formatters (ESLint, Prettier)
5. Commit the changes with a descriptive message
6. Update tasks-backend.md:
   - Mark the completed task with `- [x]`
   - Add a Progress entry at the bottom with timestamp and description

Important:
- Focus on ONE task only
- Write clean, production-quality TypeScript code
- Follow existing code patterns and conventions in convex/ directory
- If you cannot complete a task, document why in Progress and move to the next
- Skip tasks that require external configuration (API keys, etc.) and note it in Progress

If there are NO remaining incomplete tasks, create a file named `ralph_backend_complete` and exit.
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
echo "Review tasks-backend.md to see progress"
echo "=========================================="
exit 0
