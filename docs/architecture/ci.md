# CI (GitHub Actions)

## What it runs
- Install dependencies: `npm ci`
- Typecheck: `npx tsc -p tsconfig.json --noEmit`
- Tests: `npm run test:ci`

## Local parity
Run the same commands locally:

```sh
npm ci
npx tsc -p tsconfig.json --noEmit
npm run test:ci
```

## Branch protection
Require the GitHub Actions check named **Test and Typecheck** on pull requests.
