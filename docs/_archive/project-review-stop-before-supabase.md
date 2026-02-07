# ARCHIVED: Not canonical. Kept for historical context only.
# Pre-Supabase Project Review

## Architecture summary
- Expo Router with root stack: (auth), (tabs), help modal, and word detail/associations routes.
- Root layout wraps GestureHandlerRootView → SafeAreaProvider → AuthProvider → WordProvider → AssociationsProvider.
- AuthProvider bootstraps session from AsyncStorage; login/register/logout managed in `src/repositories/userRepo.ts`.
- WordProvider loads per-user statuses, study/review prefs, and help flag from AsyncStorage; word/group data is static in `src/data/words`.
- AssociationsProvider caches public (global) and private/liked/saved associations per user in AsyncStorage with on-demand refresh.
- Repository layer (`src/repositories`) centralizes storage keys and data shaping; storage helpers wrap AsyncStorage with JSON helpers and warnings.
- Domain models and status metadata live in `src/domain`; navigation helpers in `src/navigation/routes.ts` keep href construction consistent.
- UI kit components (`components/`) enforce RTL defaults and theme usage (AppText, Screen, PrimaryButton, StatusSelector, WordRow, etc.).
- Theme tokens (colors/spacing/radius) in `src/ui/theme.ts`; RTL enforcement via `src/ui/rtl.ts` invoked during bootstrap.
- Validation service handles email/password checks for auth forms.
- Word filtering/flow encapsulated in hooks (`useWords`, `useAssociations`, `useReviewPlayer`) rather than screens.
- Static word corpus assembled from `words_english_*.ts` through `src/data/words`.
- Storage key scoping per user via `src/storage/keys.ts`; `clearAppStorage` iterates shared and user-scoped keys.

## Best practices scorecard
| Area | Status | Notes |
| --- | --- | --- |
| Routing | Good | Clear groups/layouts; auth guard via `app/_layout.tsx`; typed route helpers. |
| Architecture | Good | Providers + repos cleanly layered; data flow through hooks. |
| UI reuse | Needs attention | Card and chip patterns repeated in 3–5 screens without a shared helper. |
| Styling | OK | Theme tokens exist; some inline hex duplicates instead of `colors.muted`. |
| Storage | OK | Per-user keys; reset path fixed, but error surfacing is minimal. |
| Error handling | Needs attention | Repos swallow errors with `console.warn`; no UI surfaced errors for data fetch/save. |
| Code health | OK | A few unused exports/files; otherwise typed and free of `any`. |

## Findings by priority
### P0 (must fix before Supabase)
- Reset menu left session alive and skipped user-scoped storage cleanup (components/HeaderHelpButton.tsx, src/storage/clearAppStorage.ts). Why: “איפוס נתונים מקומיים” previously only cleared global keys and did not logout, so stale in-memory session stayed and per-user data persisted. Simplest fix: pass `user.id` into `clearAppStorage` and call `logout` before redirect (applied in this pass).

### P1 (should fix soon)
- Review player assumes group IDs contain digits and converts them to numbers (src/hooks/useReviewPlayer.ts). Why: Supabase groups will likely use UUIDs/strings, breaking filtering and producing empty review queues. Simplest fix: store and compare group IDs consistently as strings (e.g., keep `filters.groups` as string IDs and compare to a `Set` of stringified `word.group` or map word group numbers back to group IDs from `GROUPS`/DB).
- Storage/repo errors are only logged (src/storage/storage.ts) and never surfaced to UI. Why: With Supabase/network calls, silent failures will leave screens stuck without feedback. Simplest fix: have repos return `{data, error}` or throw and catch in hooks to expose a small error banner/toast component.
- Study setup chunk fallback was 3 instead of 7 when input cleared (app/(tabs)/study/[groupId]/setup.tsx). Why: `Number(chunkSize) || DEFAULT_STUDY_STATUSES.length` defaulted to 3; user intent and copy say default 7. Simplest fix: default to `DEFAULT_CHUNK_SIZE` (applied).

### P2 (optional cleanup)
- Dead code: `getWords` (src/repositories/wordRepo.ts), `updatePrivateAssociation` (src/repositories/associationRepo.ts), `src/data/words.demo.ts` are unused. Why: Increases surface area and future merge conflicts. Simplest fix: remove or mark with `@deprecated`.
- Inline color duplicates (#475569) in multiple screens instead of `colors.muted` (e.g., app/(auth)/*.tsx, app/word/[wordId]/associations.tsx). Why: Theme drift risk; RTL/text contrast inconsistencies. Simplest fix: replace literals with theme token.
- AssociationsProvider defaults to `userId = "guest"` when no session (src/hooks/useAssociations.tsx). Why: If a screen renders before auth guard redirects, data could persist under a shared “guest” key. Simplest fix: skip refresh/actions until a real `session?.user.id` exists.

## Component reuse opportunities (3+ occurrences only)
- **Surface card container**: Same white background + border + radius + padding appears in group lists (app/(tabs)/words/index.tsx, app/(tabs)/study/index.tsx), association items (app/word/[wordId]/associations.tsx), and study pager cards. Small extraction: a `SurfaceCard` wrapper or shared `card` style in a `styles/shared.ts`.
- **Selectable chip/toggle**: Repeated bordered pills with active state in review filters chips, study status grid, and association tab/mode toggles. Small extraction: `SelectableChip` component supporting `active`, `size`, and `onPress` props to keep focus/spacing consistent.
- **Word header block**: English word + Hebrew translation rendered in word detail, association header, and study pager cards. Small extraction: `WordHeading` component receiving `{en, he, variant}` to unify typography and spacing.

## Supabase phase readiness
- What’s already good: Providers isolate app state from storage; per-user keys already scoped; typed domain models; navigation guard enforces auth; repositories already async-friendly signatures.
- What must change later: Replace userRepo/auth flow with Supabase auth and session listener; swap association and status repositories to Supabase tables (with optimistic/pessimistic strategies and error surfaces); make group/word IDs not depend on numeric patterns; add network-aware loading/error UI in hooks/screens; define sync/merge policy for local vs remote data before enabling offline support.
