# Step 03 - AsyncStorage audit and ADR

## Objective
Audit the project for local DB/ORM layers and confirm AsyncStorage remains the only local cache/outbox, documenting the decision.

## package.json findings
```
cat package.json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^2.2.0",
    ... (no sqlite/realm/mmkv/watermelondb/rxdb/ORM/db deps)
  },
  "devDependencies": {
    "@types/react": "~19.1.0",
    "babel-plugin-module-resolver": "^5.0.2",
    "eslint": "^9.25.0",
    "eslint-config-expo": "~10.0.0",
    "typescript": "~5.9.2"
  }
}
```

## Search commands + outputs
```
rg -n "sqlite|expo-sqlite|watermelondb|realm|mmkv|rxdb|drizzle|prisma|knex|typeorm|mikro|pouchdb|lokijs|orm|migration|database" .
(outputs only word-list text/doc strings; no code imports)
```
```
git grep -n "sqlite|expo-sqlite|watermelondb|realm|mmkv|rxdb|drizzle|prisma|knex|typeorm|mikro|pouchdb|lokijs|orm|migration|database" .
(outputs only word-list text/doc strings; no code imports)
```

## Conclusion
- Local DB/ORM layer present: **No**. Only AsyncStorage is used for local persistence.
- No removals performed (none found / needed).

## Changes made
- None to code or deps in this step (docs already added earlier).

## Commands
```
git status -sb
## fixes-befor-db...origin/fixes-befor-db
 M docs/architecture/supabase-plan.md
?? docs/architecture/decisions/0002-asyncstorage-local-cache-outbox.md
?? docs/codex/step-03-asyncstorage-audit-and-adr.md
```
```
git diff --stat
 docs/architecture/supabase-plan.md | 5 +++++
 1 file changed, 5 insertions(+)
```
```
git diff
diff --git a/docs/architecture/supabase-plan.md b/docs/architecture/supabase-plan.md
index efc2771..64bcb71 100644
--- a/docs/architecture/supabase-plan.md
+++ b/docs/architecture/supabase-plan.md
@@ -9,6 +9,11 @@
 - Rationale: no extra user fields are required today; adding tables later is straightforward once a concrete need appears.
 - Guardrail: add a profiles table only when a feature requires fields not present in `auth.users` (e.g., display name, avatar, locale).
 
+## Local cache / outbox
+- Local cache/outbox uses `@react-native-async-storage/async-storage` for now (progress, associations, future outbox queue).
+- Supabase is the remote database and source of truth; AsyncStorage is just a local cache/outbox.
+- Revisit when: complex local querying/filtering is needed, AsyncStorage performance degrades with scale, or per-user data grows to tens of thousands of records.
+
 ## Near-term focus
 - Keep schema minimal while wiring feature-specific tables.
 - Revisit the profiles decision when new user-facing metadata is requested.
```
```
npx tsc -p tsconfig.json --noEmit
# exit 0
```

## Verification
- Typecheck passed: `npx tsc -p tsconfig.json --noEmit`.

## TODOs / Risks
- None. AsyncStorage stays as the local cache/outbox until revisit triggers occur.
