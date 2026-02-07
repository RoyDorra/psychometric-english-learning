# Step 02 - No profiles table (yet)

## Objective
Document the decision to avoid creating a Supabase `profiles` table for now and remove any assumptions about it.

## Files changed
- docs/architecture/decisions/0001-no-profiles-table-yet.md
- docs/architecture/supabase-plan.md
- docs/codex/step-02-no-profiles.md (this file)

## Search
Commands and outputs:
```
rg -n "profiles|profile|public\.profiles" .
# (no matches)
```
```
git grep -n "profiles|profile" .
# (no matches, exit 1)
```
Findings: No existing code/comments/docs referenced a profiles table.

## Changes made
- Added ADR `0001-no-profiles-table-yet.md` capturing context, decision, consequences, revisit triggers, and guardrail.
- Added `supabase-plan.md` with a "No profiles table (yet)" section and current Supabase scope.

## Commands run
```
git status -sb
## fixes-befor-db...origin/fixes-befor-db
?? docs/
```
```
git diff --stat
# (no tracked diffs; only new untracked docs)
```
```
git diff
# (no tracked diffs)
```
```
git grep -n "profiles|profile" .
# (no matches, exit 1)
```
```
npx tsc -p tsconfig.json --noEmit
# (passed, no output)
```

## Verification
- Type-check passed: `npx tsc -p tsconfig.json --noEmit`.
- No runtime changes made in this step.

## TODOs / Risks
- None for this decision; revisit only when a feature requires user metadata beyond `auth.users`.
