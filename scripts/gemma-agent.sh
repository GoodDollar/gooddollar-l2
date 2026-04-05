#!/bin/bash
# Gemma 4 Agent Runner — sends a prompt to local Gemma 4 GPU, executes shell commands from response
# Usage: ./gemma-agent.sh "system prompt" "task prompt"

GEMMA_URL="http://158.180.17.156:11434/v1/chat/completions"
MODEL="gemma4"
MAX_TOKENS=4096

SYSTEM_PROMPT="$1"
TASK_PROMPT="$2"

if [ -z "$TASK_PROMPT" ]; then
  echo "Usage: $0 'system prompt' 'task prompt'"
  exit 1
fi

# Setup environment
export PATH="/home/goodclaw/.foundry/bin:$PATH"
export MEMCLAW_API_KEY="mc_CeTq_4XU0zzktKpAclK7U7NptghKEjEP"
cd /home/goodclaw/gooddollar-l2

# Call Gemma 4
RESPONSE=$(curl -s "$GEMMA_URL" -H "Content-Type: application/json" -d "$(python3 -c "
import json
print(json.dumps({
    'model': '$MODEL',
    'messages': [
        {'role': 'system', 'content': '''$SYSTEM_PROMPT'''},
        {'role': 'user', 'content': '''$TASK_PROMPT'''}
    ],
    'max_tokens': $MAX_TOKENS,
    'temperature': 0.3
}))
")")

# Extract content
CONTENT=$(echo "$RESPONSE" | python3 -c "import json,sys; r=json.load(sys.stdin); print(r.get('choices',[{}])[0].get('message',{}).get('content','No response'))" 2>/dev/null)

echo "$CONTENT"
