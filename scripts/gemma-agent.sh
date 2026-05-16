#!/bin/bash
# Gemma Agent Runner — sends a prompt to a configured OpenAI-compatible endpoint.
# Usage: ./gemma-agent.sh "system prompt" "task prompt"

GEMMA_URL="${GEMMA_URL:-http://158.180.17.156:11434/v1/chat/completions}"
MODEL="${GEMMA_MODEL:-gemma4}"
MAX_TOKENS="${MAX_TOKENS:-4096}"

SYSTEM_PROMPT="$1"
TASK_PROMPT="$2"

if [ -z "$TASK_PROMPT" ]; then
  echo "Usage: $0 'system prompt' 'task prompt'"
  exit 1
fi

export PATH="${HOME}/.foundry/bin:$PATH"
cd "$(dirname "$0")/.."

RESPONSE=$(curl -s "$GEMMA_URL" -H "Content-Type: application/json" -d "$(python3 -c "
import json, os
print(json.dumps({
    'model': os.environ.get('GEMMA_MODEL', '$MODEL'),
    'messages': [
        {'role': 'system', 'content': '''$SYSTEM_PROMPT'''},
        {'role': 'user', 'content': '''$TASK_PROMPT'''}
    ],
    'max_tokens': int(os.environ.get('MAX_TOKENS', '$MAX_TOKENS')),
    'temperature': 0.3
}))
")")

echo "$RESPONSE" | python3 -c "import json,sys; r=json.load(sys.stdin); print(r.get('choices',[{}])[0].get('message',{}).get('content','No response'))" 2>/dev/null
