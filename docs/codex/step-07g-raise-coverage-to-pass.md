# Step 07g - Raise Coverage to Pass

## Objective
Make `npm run check:full` pass without lowering Jest global coverage thresholds and without excluding files from coverage.

## What tests were added
- `src/services/__tests__/supabase.test.ts`
  - Covers `src/services/supabase.ts` storage selection and env guard branches:
    - web SSR (`window` absent) -> in-memory adapter
    - web browser (`window.localStorage`) -> localStorage adapter
    - native (`Platform.OS = ios`) -> AsyncStorage adapter
    - missing env/extra config -> throws expected configuration error
- `src/core/__tests__/bootstrap.test.ts`
  - Covers `src/core/bootstrap.ts` by asserting `bootstrap()` executes `ensureRTL()`.
- `src/hooks/__tests__/useAuth.test.tsx` (extended)
  - Added branch tests for:
    - `getSession` error path -> warns, clears user/session, sets `isLoading=false`
    - `signIn` / `signUp` / `signOut` error-throw paths
    - auth listener after unmount guard path
    - `useAuth` called outside provider throws

## Coverage before / after
Before (`npm run check:full` baseline):
```text
-----------------------|---------|----------|---------|---------|-------------------------------------------
File                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------|---------|----------|---------|---------|-------------------------------------------
All files              |   86.26 |    74.04 |   87.43 |   87.82 |
```

After (final `npm run check:full`):
```text
-----------------------|---------|----------|---------|---------|-------------------------------------------
File                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------|---------|----------|---------|---------|-------------------------------------------
All files              |   92.69 |    83.04 |   93.44 |   94.64 |
```

## Commands run and final pass lines
1. `npm run check:full` (baseline) -> failed on global thresholds (`86.26/74.04/87.43/87.82`).
2. Added tests listed above.
3. Validation runs:
   - `npx jest src/services/__tests__/supabase.test.ts src/core/__tests__/bootstrap.test.ts src/hooks/__tests__/useAuth.test.tsx --runInBand`
   - `npx tsc -p tsconfig.json --noEmit`
4. Final gate run:
   - `npm run check:full`

Final pass lines:
```text
PASS src/services/__tests__/supabase.test.ts
PASS src/core/__tests__/bootstrap.test.ts
PASS src/hooks/__tests__/useAuth.test.tsx
Test Suites: 19 passed, 19 total
Tests:       67 passed, 67 total
```

Lint/Typecheck status from final gate:
- `expo lint`: 0 errors, warnings only.
- `npx tsc -p tsconfig.json --noEmit`: pass.

## `git status -sb`
```bash
## supabase
 M README.md
 M app/(auth)/login.tsx
 M app/(auth)/register.tsx
 M app/_layout.tsx
 M app/index.tsx
 M components/HeaderHelpButton.tsx
 M components/__tests__/components.test.tsx
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
?? docs/codex/step-07e-email-confirmation-audit-and-git-summary.md
?? docs/codex/step-07g-raise-coverage-to-pass.md
?? src/core/__tests__/
?? src/services/__tests__/supabase.test.ts
?? src/services/supabase.ts
```

## `git diff --stat`
```bash
 README.md                                    |  14 +-
 app/(auth)/login.tsx                         |   4 +-
 app/(auth)/register.tsx                      |   4 +-
 app/_layout.tsx                              |   8 +-
 app/index.tsx                                |   4 +-
 components/HeaderHelpButton.tsx              |   6 +-
 components/__tests__/components.test.tsx     |   8 +-
 jest.setup.ts                                |   3 +
 package-lock.json                            | 139 +++++++++++++++
 package.json                                 |   2 +
 src/hooks/__tests__/useAssociations.test.tsx |  12 +-
 src/hooks/__tests__/useAuth.test.tsx         | 241 ++++++++++++++++++++++-----
 src/hooks/__tests__/useWords.test.tsx        |  10 +-
 src/hooks/useAuth.tsx                        | 126 ++++++++++----
 14 files changed, 465 insertions(+), 116 deletions(-)
```
