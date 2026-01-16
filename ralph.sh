#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Ralph - Fast Mode General Task Runner for CardDex
# =============================================================================
# Usage: ./ralph.sh [max_iterations]
# Backup: ralph.sh.bak
# =============================================================================

MAX_ITERATIONS=${1:-10}
TASK_FILE="tasks.md"
COMPLETE_FLAG="ralph_complete"

echo "=========================================="
echo "Ralph Task Runner (Fast Mode)"
echo "Max iterations: $MAX_ITERATIONS"
echo "=========================================="

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo ""
  echo ">>> Iteration $i of $MAX_ITERATIONS"

  [[ -f "$COMPLETE_FLAG" ]] && echo "All tasks complete." && exit 0
  [[ ! -f "$TASK_FILE" ]] && echo "Error: $TASK_FILE not found!" && exit 1

  AGENT_PROMPT=$(cat <<'PROMPT'
Read tasks.md. Pick ONE incomplete task (- [ ]).

EFFICIENCY RULES - FOLLOW THESE:
- Be concise. No explanations unless asked.
- Skip tests unless the task specifically requires them.
- Don't read files you don't need to edit.
- Make changes directly. Don't narrate what you're about to do.
- Parallelize file reads when possible.

Do:
1. Implement the change
2. Run: npm run lint:fix
3. Commit with descriptive message
4. Update tasks.md: mark [x], add Progress entry with date

Code rules:
- Follow existing patterns in the codebase
- Write clean, production-quality code
- If you cannot complete a task, note why in Progress and move on

If NO incomplete tasks remain, create file `ralph_complete` and exit.
PROMPT
)

  echo "$AGENT_PROMPT" | claude --dangerously-skip-permissions --print

  echo ">>> Completed iteration $i"
  sleep 1
done

echo ""
echo "Reached max iterations ($MAX_ITERATIONS)"
echo "Review tasks.md for progress"
exit 0
