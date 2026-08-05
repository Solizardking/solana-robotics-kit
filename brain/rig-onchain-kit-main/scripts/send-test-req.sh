#!/bin/bash

API_BASE_URL="${API_BASE_URL:-http://localhost:${PORT:-6969}}"

curl -X POST "${API_BASE_URL}/v1/stream" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${PRIVY_AUTH_TOKEN:?set PRIVY_AUTH_TOKEN}" \
  -d '{
    "prompt": "What is the wallet address of your yours?",
    "chat_history": [],
    "chain": "evm"
  }'
