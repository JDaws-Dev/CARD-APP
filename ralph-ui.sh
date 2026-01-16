#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Ralph UI - Fast Mode Task Runner for CardDex
# =============================================================================
# Usage: ./ralph-ui.sh [max_iterations]
# Backup: ralph-ui.sh.bak
# =============================================================================

MAX_ITERATIONS=${1:-10}
TASK_FILE="tasks-ui.md"
COMPLETE_FLAG="ralph_ui_complete"

echo "=========================================="
echo "Ralph UI Task Runner (Fast Mode)"
echo "Max iterations: $MAX_ITERATIONS"
echo "=========================================="

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo ""
  echo ">>> Iteration $i of $MAX_ITERATIONS"

  [[ -f "$COMPLETE_FLAG" ]] && echo "All UI tasks complete." && exit 0
  [[ ! -f "$TASK_FILE" ]] && echo "Error: $TASK_FILE not found!" && exit 1

  AGENT_PROMPT=$(cat <<'PROMPT'
Read tasks-ui.md. Pick ONE incomplete task (- [ ]) from the highest priority section.

EFFICIENCY RULES - FOLLOW THESE:
- Be concise. No explanations unless asked.
- Skip tests unless the task specifically requires them.
- Don't read files you don't need to edit.
- Make changes directly. Don't narrate what you're about to do.
- Parallelize file reads when possible.

Do:
1. Implement the UI change
2. Run: npm run lint:fix
3. Commit with descriptive message
4. Update tasks-ui.md: mark [x], add Progress entry with date

Code rules:
- Use Heroicons, not emojis
- Follow existing patterns in the codebase
- Write clean React/Next.js code

If NO incomplete tasks remain, create file `ralph_ui_complete` and exit.
PROMPT
)

  echo "$AGENT_PROMPT" | claude --dangerously-skip-permissions --print

  echo ">>> Completed iteration $i"
  sleep 1
done

echo ""
echo "Reached max iterations ($MAX_ITERATIONS)"
echo "Review tasks-ui.md for progress"
exit 0
