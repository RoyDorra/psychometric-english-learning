# GitHub Actions CI Setup

## Files changed
- `.github/workflows/ci.yml` (new)
- `docs/architecture/ci.md` (new)
- `docs/codex/step-ci-github-actions.md` (new)
- Test suite + helpers + config additions (see full diff stat below)

## Rationale
- Ensure PRs and pushes to `dev` automatically run install, typecheck, and tests so branch protection can require the check before merge.

## Workflow / job name (as shown in PR checks)
- Workflow: **CI**
- Job: **Test and Typecheck**

## Commands run
- `npm run test:ci`
- `npx tsc -p tsconfig.json --noEmit`

## Git diff --stat
```
.github/workflows/ci.yml                           |   30 +
__tests__/router/associations-router.test.tsx      |  156 ++
components/__tests__/components.test.tsx           |  147 ++
docs/architecture/ci.md                            |   18 +
docs/codex/step-ci-github-actions.md               |   51 +
docs/codex/step-tests-hardening.md                 |   47 +
docs/codex/step-tests-setup.md                     |   57 +
jest.config.js                                     |   44 +
jest.setup.ts                                      |   50 +
package-lock.json                                  | 2544 +++++++++++++++++++-
package.json                                       |    9 +
src/domain/__tests__/status.test.ts                |   20 +
src/hooks/__tests__/useAssociations.test.tsx       |  140 ++
src/hooks/__tests__/useAuth.test.tsx               |   86 +
src/hooks/__tests__/useReviewPlayer.test.ts        |   50 +
src/hooks/__tests__/useWords.test.tsx              |  106 +
src/navigation/__tests__/routes.test.ts            |   21 +
src/repositories/__tests__/associationRepo.test.ts |  143 ++
src/repositories/__tests__/userRepo.test.ts        |   60 +
src/repositories/__tests__/wordRepo.test.ts        |   75 +
src/services/__tests__/validation.test.ts          |   15 +
src/storage/__tests__/clearAppStorage.test.ts      |   38 +
src/storage/__tests__/keys.test.ts                 |   23 +
src/storage/__tests__/storage.test.ts              |   50 +
src/ui/__tests__/rtl.test.ts                       |   32 +
src/utils/__tests__/uuid.test.ts                   |   36 +
test/factories.ts                                  |   47 +
test/fakeStorage.ts                                |   63 +
test/render.tsx                                    |   42 +
```
