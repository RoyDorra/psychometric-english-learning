# ARCHIVED: Not canonical. Kept for historical context only.
# Step 05 - Supabase Associations Schema

## Objective
Create the initial Supabase Postgres schema for public/liked/saved/private associations with RLS, triggers, and minimal RPCs.

## Skill Rules Applied (supabase-postgres-best-practices)
- security-rls-basics.md — "Enable Row Level Security for Multi-Tenant Data"
- security-privileges.md — "Apply Principle of Least Privilege"
- schema-foreign-key-indexes.md — "Index Foreign Key Columns"
- query-missing-indexes.md — "Add Indexes on WHERE and JOIN Columns"
- query-composite-indexes.md — "Create Composite Indexes for Multi-Column Queries"

## Files Changed
- supabase/migrations/0001_associations.sql
- docs/architecture/supabase-associations-schema.md
- docs/codex/step-05-supabase-associations-schema.md

## Apply Migration
- If Supabase CLI is configured:
  - `supabase migration up`
- Otherwise: run `supabase/migrations/0001_associations.sql` in the Supabase SQL editor.

## Git Diff --stat
- (No output. `git diff --stat` is empty because the changes are new/untracked files; `docs/codex/` is gitignored.)
