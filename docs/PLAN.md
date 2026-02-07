# Documentation Plan

## Rules
- `docs/PLAN.md` is the single source of truth for doc-state and agent guidance; any conflict defaults to this file.
- Treat everything under `docs/_archive/` as historical context only; do not edit archived files or drive decisions from them.
- No new email-confirmation flows, deeplink UX, or AsyncStorage-to-Supabase migrations; we are starting fresh with the new backend.
- The Supabase database is the source of truth—local caches, AsyncStorage, or client-held secrets must defer to it.
- Seeds (including any association data) are executed server-side as part of deployments or maintenance scripts, not manually in dev envs.

## Current Phase Summary
1. Implement the Supabase schema + RLS for learning-state records and associations so the app always queries authoritative row-level policies.
2. Association support now focuses on server-controlled data; do **not** seed public associations yet—those will come later via a system seed.
