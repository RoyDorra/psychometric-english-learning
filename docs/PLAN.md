# Documentation Plan

## Rules
- `docs/PLAN.md` is the single source of truth for doc-state and agent guidance; any conflict defaults to this file.
- Treat everything under `docs/_archive/` as historical context only; do not edit archived files or drive decisions from them.
- No new email-confirmation flows, deeplink UX, or AsyncStorage-to-Supabase migrations; we are starting fresh with the new backend.
- Current runtime split: Supabase Auth is active, while learning-state and association feature data are still stored in AsyncStorage repositories.
- Target architecture: the Supabase database becomes source of truth for dynamic feature data; local caches/AsyncStorage must defer to server state after cutover.
- Seeds (including any association data) are executed server-side as part of deployments or maintenance scripts, not manually in dev envs.

## Current Phase Summary
1. Implement Supabase schema + RLS for learning-state records and associations (no migration SQL is committed yet).
2. Refactor `wordRepo` and `associationRepo` from AsyncStorage to Supabase-backed reads/writes while keeping hook/screen contracts stable.
3. Keep association seeding as a future server-controlled step; do **not** introduce manual/dev seeding flows in the app runtime.
