# Supabase Roadmap

## Current State (From Repo Scan)
What exists:
- Auth is local-only (`src/repositories/userRepo.ts`) using AsyncStorage + local password hashing.
- User data is local-only in AsyncStorage repositories:
  - Word statuses and preferences (`src/repositories/wordRepo.ts`)
  - Public/private associations + likes/saves (`src/repositories/associationRepo.ts`)
- Architecture is already layered (providers -> hooks -> repositories), which is good for backend swap.
- Decisions already documented: no `profiles` table yet, AsyncStorage remains local cache/outbox for now.

What is missing for production-grade Supabase:
- No Supabase auth wiring in app runtime.
- No tracked `supabase/` migration workflow in repo.
- No canonical phase gate from local-only to Supabase source of truth.
- No final RLS policy set for user-owned feature tables.

## Phase Plan

### Phase 1: Supabase Auth (replace local auth)
Scope:
- Replace local register/login/session store with Supabase Auth session flow.
- Keep current app routes/providers shape as much as possible.

Deliverables:
- Auth provider uses Supabase session + auth state listener.
- Deterministic mapping from `session.user.id` into existing hook/repo usage.
- Cutover/rollback notes in a dedicated step doc.

Exit criteria:
- Login/register/logout/session restore all work from Supabase Auth.
- No AsyncStorage-based password/user table dependency for auth.

### Phase 2: DB schema + RLS + migrations
Scope:
- Create minimal relational schema for current features only.
- Add RLS policies and indexes from day 1.

Minimal tables needed now:
1. `word_statuses`
- `user_id` (uuid, fk -> `auth.users.id`)
- `word_id` (text)
- `status` (text/check)
- `updated_at` (timestamptz)
- PK/unique: (`user_id`, `word_id`)

2. `user_study_preferences`
- `user_id` (uuid, pk, fk)
- `chunk_size` (int)
- `statuses` (text[])
- `updated_at`

3. `user_review_filters`
- `user_id` (uuid, pk, fk)
- `groups` (text[])
- `statuses` (text[])
- `updated_at`

4. `user_help_preferences`
- `user_id` (uuid, pk, fk)
- `seen` (boolean)
- `updated_at`

5. `public_associations`
- `id` (uuid, pk)
- `word_id` (text)
- `text_he` (text)
- `created_by_user_id` (uuid, fk)
- `like_count` (int default 0)
- `created_at`, `updated_at`

6. `private_associations`
- `id` (uuid, pk)
- `user_id` (uuid, fk)
- `word_id` (text)
- `text_he` (text)
- `created_at`, `updated_at`

7. `association_likes`
- `user_id` (uuid, fk)
- `association_id` (uuid, fk -> `public_associations.id`)
- `created_at`
- PK/unique: (`user_id`, `association_id`)

8. `association_saves`
- `user_id` (uuid, fk)
- `association_id` (uuid, fk -> `public_associations.id`)
- `created_at`
- PK/unique: (`user_id`, `association_id`)

RLS baseline:
- User-owned tables: only owner can select/insert/update/delete.
- `public_associations`: authenticated read; create/update/delete limited by owner policy.
- `association_likes` and `association_saves`: owner-only rows.

Exit criteria:
- Migration files exist in `supabase/migrations/`.
- SQL reviewed with Supabase skill rules (RLS + indexes + least privilege).
- Manual apply instructions validated in SQL Editor.

### Phase 3: Repository refactor to Supabase
Scope:
- Swap AsyncStorage-backed repositories to Supabase-backed repositories.
- Keep hooks/screens contracts stable where possible.

Deliverables:
- `userRepo`, `wordRepo`, `associationRepo` read/write via Supabase.
- Error handling surfaced to hooks/UI for network failures.
- Local cache remains optional and non-authoritative.

Exit criteria:
- Runtime behavior matches current UX for words, statuses, preferences, associations.
- Per-user data isolation verified against RLS.

### Phase 4: Optional local cache/outbox + sync strategy (only if needed)
Scope:
- Add local outbox/cache only when concrete pain appears.

Trigger conditions:
- Measurable offline requirements.
- AsyncStorage latency/data size issues.
- Need for retry/conflict handling in flaky network scenarios.

Exit criteria:
- Explicit ADR replacing current AsyncStorage-only guidance.
- Conflict rules and retry semantics documented before implementation.

## What NOT To Do Yet
- Do not add a `profiles` table unless a real feature requires extra user fields.
- Do not introduce ORM/local SQL layer preemptively.
- Do not build realtime subscriptions/offline sync engine before phase gates justify it.
- Do not expand schema to non-required entities (badges, social graph, audit logs) yet.
