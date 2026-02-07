# Step 07c - Remove Email Confirmation UX

## Objective
Remove email-confirmation UX/code paths now that Supabase email confirmation is disabled, while keeping the existing Supabase Auth cutover behavior unchanged.

## Scope and outcomes
- Verified there is no `app/(auth)/check-email.tsx` route in the current tree.
- Verified `register` and `login` keep post-success navigation to `/(tabs)/words`.
- Removed remaining active docs text that referenced email-confirmation behavior.
- Kept Supabase auth integration approach unchanged (`session restore`, `signIn`, `signUp`, `signOut`).
- Kept web SSR storage fix in `src/services/supabase.ts` intact.

## Files changed
- `docs/codex/step-07-supabase-auth-cutover.md`
- `docs/codex/step-07c-remove-email-confirmation-ux.md` (new)
- `docs/codex/_last_run_summary.md`

## Verification commands
- `npx tsc -p tsconfig.json --noEmit` (pass)
- `npx jest src/hooks/__tests__/useAuth.test.tsx --runInBand` (pass)

## `git status -sb`
```bash
## supabase
 M README.md
 M app/(auth)/login.tsx
 M app/(auth)/register.tsx
 M app/_layout.tsx
 M app/index.tsx
 M components/HeaderHelpButton.tsx
 M jest.setup.ts
 M package-lock.json
 M package.json
 M src/hooks/__tests__/useAssociations.test.tsx
 M src/hooks/__tests__/useAuth.test.tsx
 M src/hooks/__tests__/useWords.test.tsx
 M src/hooks/useAuth.tsx
?? docs/codex/step-07-supabase-auth-cutover.md
?? docs/codex/step-07b-supabase-web-storage.md
?? docs/codex/step-07c-remove-email-confirmation-ux.md
?? src/services/supabase.ts
```

## `git diff --stat`
```bash
 README.md                                    |  14 ++-
 app/(auth)/login.tsx                         |   4 +-
 app/(auth)/register.tsx                      |   4 +-
 app/_layout.tsx                              |   8 +-
 app/index.tsx                                |   4 +-
 components/HeaderHelpButton.tsx              |   6 +-
 jest.setup.ts                                |   3 +
 package-lock.json                            | 139 +++++++++++++++++++++
 package.json                                 |   2 +
 src/hooks/__tests__/useAssociations.test.tsx |  12 +-
 src/hooks/__tests__/useAuth.test.tsx         | 174 +++++++++++++++++++++------
 src/hooks/__tests__/useWords.test.tsx        |  10 +-
 src/hooks/useAuth.tsx                        | 126 +++++++++++--------
 13 files changed, 394 insertions(+), 112 deletions(-)
```

## Focused diff excerpts

### `app/(auth)/register.tsx`
```diff
diff --git a/app/(auth)/register.tsx b/app/(auth)/register.tsx
index d99a63c..47bdde8 100644
--- a/app/(auth)/register.tsx
+++ b/app/(auth)/register.tsx
@@ -11,7 +11,7 @@ import { spacing } from "@/src/ui/theme";
 
 export default function RegisterScreen() {
   const router = useRouter();
-  const { register } = useAuth();
+  const { signUp } = useAuth();
@@ -42,7 +42,7 @@ export default function RegisterScreen() {
     try {
       setLoading(true);
       setError(null);
-      await register(email, password);
+      await signUp(email, password);
       router.replace("/(tabs)/words");
     } catch (err) {
       setError((err as Error).message || "שגיאה בהרשמה");
```

### Deleted file
- No file was deleted in this step because `app/(auth)/check-email.tsx` does not exist in the current repository state.
- Existence check output:

```bash
missing
```

## Notes
- `README.md` contains no email-confirmation/deep-link/redirect-URL instructions at this point, so no README edits were required in this step.
- The only active doc reference to email confirmation was removed from `docs/codex/step-07-supabase-auth-cutover.md` notes.
