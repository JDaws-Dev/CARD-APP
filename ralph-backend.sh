#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Ralph Backend - Fast Mode Task Runner for CardDex
# =============================================================================
# Usage: ./ralph-backend.sh [max_iterations]
# Backup: ralph-backend.sh.bak
# =============================================================================

MAX_ITERATIONS=${1:-10}
TASK_FILE="tasks-backend.md"
COMPLETE_FLAG="ralph_backend_complete"

echo "=========================================="
echo "Ralph Backend Task Runner (Fast Mode)"
echo "Max iterations: $MAX_ITERATIONS"
echo "=========================================="

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo ""
  echo ">>> Iteration $i of $MAX_ITERATIONS"

  [[ -f "$COMPLETE_FLAG" ]] && echo "All backend tasks complete." && exit 0
  [[ ! -f "$TASK_FILE" ]] && echo "Error: $TASK_FILE not found!" && exit 1

  AGENT_PROMPT=$(cat <<'PROMPT'
Read tasks-backend.md. Pick ONE incomplete task (- [ ]).

EFFICIENCY RULES - FOLLOW THESE:
- Be concise. No explanations unless asked.
- Skip tests unless the task specifically requires them.
- Don't read files you don't need to edit.
- Make changes directly. Don't narrate what you're about to do.
- Parallelize file reads when possible.

Do:
1. Implement the backend change
2. Run: npm run lint:fix
3. Commit with descriptive message
4. Update tasks-backend.md: mark [x], add Progress entry with date

Code rules:
- Follow existing patterns in convex/ directory
- Write clean TypeScript code
- Skip tasks requiring external API keys - note in Progress

If NO incomplete tasks remain, create file `ralph_backend_complete` and exit.
PROMPT
)

  echo "$AGENT_PROMPT" | claude --dangerously-skip-permissions --print

  echo ">>> Completed iteration $i"
  sleep 1
done

echo ""
echo "Reached max iterations ($MAX_ITERATIONS)"
echo "Review tasks-backend.md for progress"
exit 0
