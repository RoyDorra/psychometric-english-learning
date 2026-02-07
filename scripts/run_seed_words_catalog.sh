#!/usr/bin/env bash
set -euo pipefail

if ! supabase status > /dev/null 2>&1; then
  echo "Local Supabase is not running. Start it with: supabase start" >&2
  exit 1
fi

set -a
eval "$(supabase status -o env)"
set +a

node scripts/dist/seed_words_catalog_to_supabase.js
