# Codex Runbook

This file is the canonical workflow for Codex runs in this repository.

## Purpose
- Keep each run auditable.
- Keep Supabase migration work incremental.
- Prevent runtime drift by making every step explicit and reviewable.

## Required Output Per Run
Each Codex run MUST produce both files:
1. `docs/codex/step-XX-<topic>.md`
2. `docs/codex/_last_run_summary.md`

The step file is the full record. The `_last_run_summary.md` file is the skim summary for reviewers.

## Standard Step File Sections
Each step file should include:
- Objective
- Skill Rules Applied
- Files changed
- Commands + outputs (`git status -sb`, `git diff --stat`, and focused diff excerpts)
- Notes / TODOs discovered

## Recommended Execution Order
Follow this order when replaying the existing step docs:
1. `docs/codex/step-tests-setup.md`
2. `docs/codex/step-tests-hardening.md`
3. `docs/codex/step-ci-github-actions.md`
4. `docs/codex/step-pre-supabase-remove-reset-ui.md`
5. `docs/codex/step-01-email-to-userId.md`
6. `docs/codex/step-01b-fix-auth-crash.md`
7. `docs/codex/step-02-no-profiles.md`
8. `docs/codex/step-03-asyncstorage-audit-and-adr.md`
9. `docs/codex/step-04a-associations-v2-local.md`
10. `docs/codex/step-04a1-saved-tab-remove-label.md`
11. `docs/codex/step-05-supabase-associations-schema.md`
12. `docs/codex/step-06-supabase-foundation-and-order.md`

## Checklist (Current)
- [ ] Phase 1 ready: Supabase Auth cutover spec and rollback plan approved.
- [ ] Phase 2 ready: minimal schema + RLS migration files authored and reviewed.
- [ ] Phase 3 ready: repositories switched to Supabase-backed implementations.
- [ ] Phase 4 decision: local cache/outbox strategy confirmed (only if needed).
- [ ] CI updated to run SQL lint/migration checks when migrations are added.

Next step: `docs/architecture/supabase-roadmap.md` -> Phase 1 (Auth) design review, then create `docs/codex/step-07-supabase-auth-plan.md`.

## How We Use Skills
Future Supabase steps must apply installed skill rules, not ad-hoc patterns.

Primary installed skills in this repo:
- React Native best practices: `.agents/skills/react-native-best-practices/SKILL.md`
- Supabase Postgres best practices: `.agents/skills/supabase-postgres-best-practices/SKILL.md`
- Testing best practices: `.agents/skills/testing-best-practices/SKILL.md`

Practical rule:
- Auth/session/repository/database work: apply Supabase Postgres skill first.
- React Native runtime/performance changes: apply React Native skill.
- Test additions/changes: apply Testing skill.
