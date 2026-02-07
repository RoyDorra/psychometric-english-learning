# Supabase Workspace

This folder is the canonical place for Supabase schema and migration artifacts for this app.

## Structure
- `supabase/migrations/`: ordered SQL migration files.

## Migration Workflow (Current)
For now we apply migrations through the Supabase SQL Editor (manual apply).

1. Create a new migration file in `supabase/migrations/`.
2. Paste SQL into Supabase SQL Editor and run it on the target project.
3. Record apply details in the relevant Codex step doc.
4. Keep SQL idempotent when practical and avoid destructive changes without a rollback note.

## Naming Convention
Use one of these and stay consistent per branch:
- Timestamp (recommended for team ordering): `YYYYMMDDHHMMSS_<short_name>.sql`
- Sequential (acceptable for early phase): `0001_<short_name>.sql`

Examples:
- `20260207183000_init_feature_tables.sql`
- `0001_init_feature_tables.sql`

## Rules For This Step
- Scaffolding only: no schema SQL is added yet.
- First real migration will be introduced in a dedicated implementation step.
