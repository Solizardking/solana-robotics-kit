#!/usr/bin/env bash
# Push every secret in .env.local (or .env) to Vercel for production, preview,
# and development environments.
#
# Usage:
#   1) cp .env.example .env.local && fill in the values
#   2) vercel link        # one-time, attaches this dir to a Vercel project
#   3) ./scripts/vercel-env-setup.sh
#
# Re-running is safe: existing keys are removed before being re-added.

set -euo pipefail

ENV_FILE="${1:-.env.local}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "env file not found: $ENV_FILE" >&2
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "vercel CLI not installed. Run: pnpm add -g vercel" >&2
  exit 1
fi

KEYS=(
  GOOGLE_API_KEY
  SUPABASE_S3_ACCESS_KEY_ID
  VITE_REFERRAL_KEY
  OPENROUTER_API_KEY
  OPENAI_API_KEY
  OPENROUTER_MODELB
  PINECONE_API_KEY
  PINECONE_MCP
  HELIUS_RPC_URL
  NVIDIA_API_KEY
  SUPABASE_ANON_PUBLIC_KEY
  PINECONE_HOST
  HELIUS_API_KEY
  EXA_API_KEY
  ANTHROPIC_API_KEY
  SUPABASE_PROJECT_URL
  SERP_API_KEY
  SUPABASE_SERVICE_ROLE
  OPENROUTER_MODELC
  VITE_FRONTEND_FORGE_API_URL
  SUPABASE_S3_SECRET_KEY
  OPENROUTER_MODELA
  NEXT_PUBLIC_RPC_URL
  BAGS_API_KEY
  BIRDEYE_API_KEY
  GROK_MODEL
  VITE_JUP_SWAP_V1_API_KEY
  WALLET_CONNECT_PROJECT_ID
  RPC_URL
  NEXT_PUBLIC_REFERRAL_KEY
  FAL_API_KEY
  NEXT_PUBLIC_JUP_SWAP_V1_API_KEY
  ADMIN_WALLET
  XAI_API_KEY
  TOKEN_ADDRESS
  CLAWD_TOKEN_ADDRESS
  JUPITER_API_KEY
)

ENVS=(production preview development)

# shellcheck disable=SC2002
load_value() {
  local key="$1"
  # Take the LAST occurrence to allow overrides at the bottom of the file.
  grep -E "^${key}=" "$ENV_FILE" | tail -n1 | sed -E "s/^${key}=//" | sed -E 's/^"(.*)"$/\1/' | sed -E "s/^'(.*)'$/\1/"
}

for key in "${KEYS[@]}"; do
  value="$(load_value "$key" || true)"
  if [[ -z "$value" ]]; then
    echo "skip   $key (empty in $ENV_FILE)"
    continue
  fi

  for env in "${ENVS[@]}"; do
    vercel env rm "$key" "$env" -y >/dev/null 2>&1 || true
    printf '%s' "$value" | vercel env add "$key" "$env" >/dev/null
    echo "set    $key -> $env"
  done
done

echo
echo "Done. Trigger a redeploy with: vercel --prod"
