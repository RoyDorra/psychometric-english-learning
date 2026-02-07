# ADR 0002: AsyncStorage as local cache/outbox (no local DB yet)

## Implementation status (current repo)
- Supabase Auth is active in runtime.
- Feature data repositories are still AsyncStorage-backed today.
- This ADR defines the local-cache strategy during the Supabase data cutover phase.

## Context
- Word catalog is static/local in the app bundle.
- Per-user data (progress, associations, future outbox items) is relatively small today.
- Supabase will serve as the remote source of truth for dynamic data.
- We want to keep the offline layer simple while we bring Supabase online.

## Decision
- Use `@react-native-async-storage/async-storage` as the local cache/outbox store for now.
- Supabase tables will be the remote source of truth.
- Do **not** introduce SQLite/ORM/local-DB layers at this stage.

## Consequences
- Faster iteration and simpler sync logic; fewer moving parts to debug.
- Limitations: slower lookups for very large datasets; limited local querying/joining; no indexes.

## Revisit triggers
- Need complex local querying/sorting/filtering across many records.
- Noticeable performance issues with AsyncStorage (startup latency, large payload writes/reads).
- Data volume grows materially (e.g., tens of thousands of per-user records).
- Offline features require local indexing/search capabilities.

## Guardrail
- Do not add a local DB/ORM until a new ADR supersedes this decision based on concrete needs.
