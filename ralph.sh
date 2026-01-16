#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Ralph Wickham Technique - Automated Task Runner for KidCollect
# =============================================================================
# Usage: ./ralph.sh [max_iterations]
#
# This script automates development by having Claude:
# 1. Read tasks.md and pick ONE incomplete task
# 2. Implement the change
# 3. Run tests and linters
# 4. Commit the changes
# 5. Update tasks.md with progress
# 6. Repeat until done or max iterations reached
# =============================================================================

MAX_ITERATIONS=${1:-10}
TASK_FILE="tasks.md"
COMPLETE_FLAG="ralph_complete"

echo "=========================================="
echo "Ralph Wickham Task Runner"
echo "Max iterations: $MAX_ITERATIONS"
echo "Task file: $TASK_FILE"
echo "=========================================="

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo ""
  echo ">>> Iteration $i of $MAX_ITERATIONS"
  echo "-------------------------------------------"

  # Exit if completion flag exists
  if [[ -f "$COMPLETE_FLAG" ]]; then
    echo "All tasks complete (found $COMPLETE_FLAG). Exiting."
    exit 0
  fi

  # Check if task file exists
  if [[ ! -f "$TASK_FILE" ]]; then
    echo "Error: $TASK_FILE not found!"
    exit 1
  fi

  # The prompt for Claude
  AGENT_PROMPT=$(cat <<'PROMPT'
Read tasks.md carefully. Choose ONE suitable incomplete task (marked with `- [ ]`).

Your job:
1. Implement the change in the repository
2. Include tests where practical
3. Run the test suite - do NOT stop until tests pass
4. Run linters/formatters (ESLint, Prettier)
5. Commit the changes with a descriptive message
6. Update tasks.md:
   - Mark the completed task with `- [x]`
   - Add a Progress entry at the bottom with timestamp and description

Important:
- Focus on ONE task only
- Write clean, production-quality code
- Follow existing code patterns and conventions
- If you cannot complete a task, document why in Progress and move to the next

If there are NO remaining incomplete tasks, create a file named `ralph_complete` and exit.
PROMPT
)

  # Run Claude with the prompt
  # Adjust flags based on your Claude CLI setup:
  # --dangerously-skip-permissions : Skip permission prompts (use with caution)
  # --print : Print the conversation
  # --verbose : More detailed output
  echo "$AGENT_PROMPT" | claude --print

  # Optional: Run verification steps after Claude finishes
  # Uncomment and adjust based on your project setup

  # # Install dependencies if package.json changed
  # if git diff --name-only HEAD~1 | grep -q "package.json"; then
  #   echo ">>> Installing dependencies..."
  #   npm install
  # fi

  # # Run tests
  # echo ">>> Running tests..."
  # npm test || true

  # # Run linters
  # echo ">>> Running linters..."
  # npm run lint:fix || true
  # npm run format || true

  # # Safety commit if agent missed anything
  # if [[ -n "$(git status --porcelain)" ]]; then
  #   echo ">>> Committing remaining changes..."
  #   git add -A
  #   git commit -m "Ralph: cleanup after iteration $i"
  # fi

  echo ""
  echo ">>> Completed iteration $i"
  echo "-------------------------------------------"

  # Small pause between iterations (optional)
  sleep 2
done

echo ""
echo "=========================================="
echo "Reached maximum iterations ($MAX_ITERATIONS)"
echo "Review tasks.md to see progress"
echo "=========================================="
exit 0
