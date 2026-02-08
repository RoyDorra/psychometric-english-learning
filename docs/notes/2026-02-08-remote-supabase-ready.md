# Remote Supabase Ready - 2026-02-08

## Overview
- Project ref: `abuykyhfqqcgmcrlbhmr`
- Remote URL: `https://abuykyhfqqcgmcrlbhmr.supabase.co`
- Branch: `supabase`
- App runtime config is public-only (`EXPO_PUBLIC_*`).

## What Broke
- Expo Web/Android bundling failed with `SyntaxError` on `.env.supabase.local` (`Missing semicolon`).
- Root cause: Metro included a dotenv secrets file in the JS module graph and tried to parse it as JavaScript.
- A first attempt to use `metro-config/.../exclusionList` also failed because that subpath is not exported by the installed `metro-config` package version.
- Supabase CLI database introspection also hit pooler circuit-breaker errors after repeated temp-role auth attempts without DB password.

## What Changed
- `metro.config.js` now imports only `expo/metro-config`.
- Added a resolver block rule to prevent bundling `.env` and `.env.*` files:
  - `/[\\/]\.env(\..*)?$/`
- Kept secret files local-only and ignored in `.gitignore`:
  - `secrets.supabase.local`
  - `secrets.supabase.cli.local`
  - `secrets.supabase.db.local`
- Ensured Supabase local CLI state stays untracked:
  - `supabase/.branches/`
  - `supabase/.temp/`
- CLI verification now uses `SUPABASE_DB_PASSWORD` to avoid temp-role auth failures.

## Local Runbook
### 1) Link and migrations
```bash
set -a; source secrets.supabase.cli.local; source secrets.supabase.db.local; set +a
supabase link --project-ref abuykyhfqqcgmcrlbhmr
supabase db push --dry-run --yes
supabase db push --yes
supabase migration list
```

### 2) Seed `words_catalog`
```bash
npm run supabase:seed:words-catalog:build
set -a; source secrets.supabase.local; set +a
node scripts/dist/seed_words_catalog_to_supabase.js
```

### 3) Start Expo
```bash
npx expo start -c
```

## Verification SQL (Supabase SQL Editor)
```sql
select count(*) as total_rows
from public.words_catalog;

select group_no, count(*) as group_rows
from public.words_catalog
group by 1
order by 1;
```

```sql
select
  to_regclass('public.words_catalog') as words_catalog,
  to_regclass('public.user_learning_state') as user_learning_state,
  to_regclass('public.public_associations') as public_associations,
  to_regclass('public.private_associations') as private_associations,
  to_regclass('public.public_association_likes') as public_association_likes,
  to_regclass('public.public_association_saves') as public_association_saves;
```

```sql
select c.relname, c.relrowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'words_catalog',
    'user_learning_state',
    'public_associations',
    'private_associations',
    'public_association_likes',
    'public_association_saves'
  )
order by c.relname;
```

```sql
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select trigger_name, event_object_table, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;
```

## Expected Checks
- `words_catalog` total rows: `4520`
- Group distribution (1..10): `451,453,452,451,451,453,453,452,452,452`
- RLS enabled on:
  - `user_learning_state`, `public_associations`, `private_associations`, `public_association_likes`, `public_association_saves`
- RLS disabled on:
  - `words_catalog`
- Policies: `16`
- Triggers: `5`

## Security Notes
- Never commit secrets.
- Keep these local-only files ignored and untracked:
  - `.env.local`
  - `secrets.supabase.local`
  - `secrets.supabase.cli.local`
  - `secrets.supabase.db.local`
- App runtime must never import secrets files; scripts source them in shell only.
