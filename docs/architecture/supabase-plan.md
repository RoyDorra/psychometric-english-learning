# Supabase Plan

## Current scope
- Use `auth.users` for authentication and stable user IDs.
- Store feature data in dedicated tables keyed by `user_id` (to be defined per feature when needed).

## No profiles table (yet)
- We are intentionally **not** creating a `profiles` table at this stage.
- Rationale: no extra user fields are required today; adding tables later is straightforward once a concrete need appears.
- Guardrail: add a profiles table only when a feature requires fields not present in `auth.users` (e.g., display name, avatar, locale).

## Near-term focus
- Keep schema minimal while wiring feature-specific tables.
- Revisit the profiles decision when new user-facing metadata is requested.
