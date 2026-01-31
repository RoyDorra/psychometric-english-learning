# ADR 0001: No profiles table (yet)

## Context
- The app currently needs only authentication and a stable user ID (from `auth.users`).
- We have no additional user attributes (display name, avatar, settings) that require a separate table.
- Keeping schema minimal reduces migration churn and avoids premature modelling.

## Decision
- Do **not** create a `profiles` table at this stage. Rely solely on `auth.users` for identity.

## Consequences
- Identity and basic metadata stay in Supabase `auth.users` only.
- Any user-scoped app data will live in dedicated feature tables (e.g., progress, settings) keyed by `user_id`.
- Less schema surface area now; fewer migrations to maintain.

## When to revisit
- If we need additional user-facing fields not provided by `auth.users` (e.g., display_name, avatar, locale, notification preferences).
- If multiple services must join on shared user metadata beyond the auth schema.
- If auditing/ownership metadata needs richer profile attributes.

## Guardrail
- Do not add a `profiles` table unless a concrete feature requires extra user attributes beyond `auth.users`.
