# Step 06 - Supabase foundation and order

## Objective
Create a single canonical runbook and a clear Supabase productionization plan, then add Supabase migration folder scaffolding, without changing runtime behavior.

## Skill Rules Applied
- `supabase-postgres-best-practices`
  - `security-*`: plan Phase 2 around RLS-first user isolation.
  - `schema-*`: define minimal feature tables only, keyed to `auth.users`.
  - `query-*`: call out index/uniqueness needs in roadmap scope.

## Repo scan summary (what exists / what is missing)
### What exists
- Architecture docs exist for CI and key ADRs:
  - `docs/architecture/ci.md`
  - `docs/architecture/supabase-plan.md`
  - `docs/architecture/decisions/0001-no-profiles-table-yet.md`
  - `docs/architecture/decisions/0002-asyncstorage-local-cache-outbox.md`
- Codex historical step docs exist (`step-01` through `step-05`, test and CI steps).
- App/runtime is layered and local-first:
  - Auth local repo: `src/repositories/userRepo.ts`
  - Word statuses/preferences local repo: `src/repositories/wordRepo.ts`
  - Associations/likes/saves local repo: `src/repositories/associationRepo.ts`
  - Providers/hooks already isolate data access from screens.

### What is missing for production-grade Supabase
- No Supabase auth runtime integration yet.
- No tracked Supabase workspace (`supabase/`) existed before this step.
- No canonical codex runbook file with strict per-run outputs.
- No consolidated phase-gated roadmap from local-only to Supabase source-of-truth.
- Noted inconsistency: `docs/codex/step-05-supabase-associations-schema.md` references files that are not currently present in-tree (`supabase/migrations/0001_associations.sql`, `docs/architecture/supabase-associations-schema.md`).

## Files changed
- `docs/codex/README.md`
- `docs/architecture/supabase-roadmap.md`
- `supabase/README.md`
- `supabase/migrations/.gitkeep`
- `docs/codex/_last_run_summary.md`
- `docs/codex/step-06-supabase-foundation-and-order.md`

## Commands + outputs
### `git status -sb`
```bash
## supabase
?? docs/architecture/supabase-roadmap.md
?? supabase/
```

### `git diff --stat`
```bash
# (no output: all tracked diffs are currently new/untracked paths)
```

### Focused git diff excerpts
#### `docs/architecture/supabase-roadmap.md`
```diff
diff --git a/docs/architecture/supabase-roadmap.md b/docs/architecture/supabase-roadmap.md
new file mode 100644
--- /dev/null
+++ b/docs/architecture/supabase-roadmap.md
@@ -0,0 +1,132 @@
+# Supabase Roadmap
+
+## Current State (From Repo Scan)
+What exists:
+- Auth is local-only (`src/repositories/userRepo.ts`) using AsyncStorage + local password hashing.
+- User data is local-only in AsyncStorage repositories:
+  - Word statuses and preferences (`src/repositories/wordRepo.ts`)
+  - Public/private associations + likes/saves (`src/repositories/associationRepo.ts`)
+...
+### Phase 1: Supabase Auth (replace local auth)
+...
+### Phase 2: DB schema + RLS + migrations
+...
+## What NOT To Do Yet
+- Do not add a `profiles` table unless a real feature requires extra user fields.
+...
```

#### `supabase/README.md`
```diff
diff --git a/supabase/README.md b/supabase/README.md
new file mode 100644
--- /dev/null
+++ b/supabase/README.md
@@ -0,0 +1,27 @@
+# Supabase Workspace
+...
+## Migration Workflow (Current)
+For now we apply migrations through the Supabase SQL Editor (manual apply).
+...
+## Naming Convention
+- Timestamp (recommended for team ordering): `YYYYMMDDHHMMSS_<short_name>.sql`
+- Sequential (acceptable for early phase): `0001_<short_name>.sql`
+...
```

#### `supabase/migrations/.gitkeep`
```diff
diff --git a/supabase/migrations/.gitkeep b/supabase/migrations/.gitkeep
new file mode 100644
```

#### `docs/codex/README.md`
```diff
diff --git a/docs/codex/README.md b/docs/codex/README.md
new file mode 100644
--- /dev/null
+++ b/docs/codex/README.md
@@ -0,0 +1,60 @@
+# Codex Runbook
+...
+## Required Output Per Run
+Each Codex run MUST produce both files:
+1. `docs/codex/step-XX-<topic>.md`
+2. `docs/codex/_last_run_summary.md`
+...
+## Recommended Execution Order
+...
+## Checklist (Current)
+- [ ] Phase 1 ready: Supabase Auth cutover spec and rollback plan approved.
+...
+## How We Use Skills
+...
```

#### `docs/codex/_last_run_summary.md`
```diff
diff --git a/docs/codex/_last_run_summary.md b/docs/codex/_last_run_summary.md
new file mode 100644
--- /dev/null
+++ b/docs/codex/_last_run_summary.md
@@ -0,0 +1,15 @@
+# Last Run Summary
+...
+## Runtime impact
+- None. No files under `src/` or `app/` were changed.
```

#### `docs/codex/step-06-supabase-foundation-and-order.md`
```diff
diff --git a/docs/codex/step-06-supabase-foundation-and-order.md b/docs/codex/step-06-supabase-foundation-and-order.md
new file mode 100644
--- /dev/null
+++ b/docs/codex/step-06-supabase-foundation-and-order.md
@@ -0,0 +1,1 @@
+# Step 06 - Supabase foundation and order
```

## Notes / TODOs discovered
- `docs/codex/` is ignored by `.gitignore`, so newly created docs in this folder do not appear in `git status -sb` unless force-added.
- Existing `step-05` references missing schema artifacts; keep that as historical context and treat this step's roadmap/scaffolding as the new canonical baseline.
- No runtime code touched in `src/` or `app/`; this step is docs and folder structure only.
