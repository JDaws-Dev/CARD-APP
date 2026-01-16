#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Ralph TCG - Fast Mode Multi-TCG API Adapter Agent
# =============================================================================
# Usage: ./ralph-tcg.sh [max_iterations]
# Backup: ralph-tcg.sh.bak
# =============================================================================

MAX_ITERATIONS=${1:-10}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROGRESS_FILE="$SCRIPT_DIR/progress-tcg.txt"

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph TCG Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

echo "=========================================="
echo "Ralph TCG Task Runner (Fast Mode)"
echo "Max iterations: $MAX_ITERATIONS"
echo "=========================================="

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo ">>> Iteration $i of $MAX_ITERATIONS"

  AGENT_PROMPT=$(cat <<'PROMPT'
Read tasks-backend.md, find "Multi-TCG Architecture" section. Pick ONE incomplete task from that section only.

EFFICIENCY RULES - FOLLOW THESE:
- Be concise. No explanations unless asked.
- Skip tests unless the task specifically requires them.
- Don't read files you don't need to edit.
- Make changes directly. Don't narrate what you're about to do.
- Parallelize file reads when possible.

Do:
1. Implement the Multi-TCG feature
2. Run: npm run build (fix ANY errors before committing)
3. Run: npm run lint:fix
4. Commit with descriptive message
5. Update tasks-backend.md: mark [x], add Progress entry with date

Code rules:
- Follow patterns in src/lib/pokemon-tcg.ts for API adapters
- Include rate limiting based on API docs
- Use same caching patterns
- NEVER commit if build is broken

If NO incomplete Multi-TCG tasks remain, output <promise>COMPLETE</promise> and exit.
PROMPT
)

  OUTPUT=$(echo "$AGENT_PROMPT" | claude --dangerously-skip-permissions --print 2>&1 | tee /dev/stderr) || true

  echo "Iteration $i - $(date)" >> "$PROGRESS_FILE"

  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "Ralph TCG completed all Multi-TCG tasks!"
    echo "COMPLETED at iteration $i - $(date)" >> "$PROGRESS_FILE"
    exit 0
  fi

  sleep 1
done

echo ""
echo "Reached max iterations ($MAX_ITERATIONS)"
exit 0
