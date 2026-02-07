# Step 01 - Email to userId keying

## Objective
Replace email-based persistence keying with `userId = session.user.id`, keeping behavior the same and removing email as a storage partition key.

## Files changed
- src/storage/keys.ts
- src/repositories/wordRepo.ts
- src/repositories/associationRepo.ts
- src/hooks/useWords.tsx
- src/hooks/useAssociations.tsx
- src/domain/types.ts
- src/repositories/userRepo.ts
- src/hooks/useAuth.tsx

## Detailed change log
- src/storage/keys.ts
  - Switched storage keys for user-scoped data to per-userId keys (e.g. `@pel/statuses:${userId}`) to avoid email-based partitioning.
  - Snippet:
    ```ts
    STATUSES: (userId: string) => `@pel/statuses:${userId}`,
    ASSOCIATION_VOTES: (userId: string) => `@pel/associationVotes:${userId}`,
    ```
- src/repositories/wordRepo.ts
  - Updated all persistence functions to accept `userId` and read/write per-user keys directly.
  - Removed any email-keyed maps.
  - Snippet:
    ```ts
    const statuses = await getJson<StatusEntry>(STORAGE_KEYS.STATUSES(userId), {});
    await setJson(STORAGE_KEYS.STUDY_PREFS(userId), preferences);
    ```
- src/repositories/associationRepo.ts
  - Stored association votes per `userId` instead of a shared map keyed by email; signatures now take `userId`.
  - Snippet:
    ```ts
    const votesState = await getVotesState(userId);
    await saveVotesState(userId, updatedVotes);
    ```
- src/hooks/useWords.tsx
  - Swapped local persistence calls from `session.email` to `session.user.id` and renamed variables accordingly.
  - Snippet:
    ```ts
    const userId = session?.user.id;
    await setStatus(userId, wordId, status);
    ```
- src/hooks/useAssociations.tsx
  - Switched vote keying to `session.user.id` with a `"guest"` fallback for unauthenticated users.
  - Snippet:
    ```ts
    const userId = session?.user.id ?? "guest";
    const map = await getUserAssociationVotes(userId);
    ```
- src/domain/types.ts
  - Added `id` to `User` and embedded `user` object in `Session` to align with `session.user.id` usage.
  - Snippet:
    ```ts
    export type Session = { user: { id: string; email: string }; token: string };
    ```
- src/repositories/userRepo.ts
  - Generated a UUID for new users and embedded `user` in session payloads.
  - Snippet:
    ```ts
    const user: User = { id: await createUserId(), email: normalized, ... };
    const session: Session = { user: { id: user.id, email: user.email }, token: ... };
    ```
- src/hooks/useAuth.tsx
  - Adjusted session hydration to look up users via `existingSession.user.email` after session shape change.

## Commands run
```
rg -n "email|:\$\{?email\}?|userRepo|AsyncStorage|wordRepo|associationRepo|useAuth" .
```
```
git status -sb
## fixes-befor-db
 M src/domain/types.ts
 M src/hooks/useAssociations.tsx
 M src/hooks/useAuth.tsx
 M src/hooks/useWords.tsx
 M src/repositories/associationRepo.ts
 M src/repositories/userRepo.ts
 M src/repositories/wordRepo.ts
 M src/storage/keys.ts
?? docs/
```
```
git diff --stat
 src/domain/types.ts                 |  6 +++-
 src/hooks/useAssociations.tsx       | 14 ++++----
 src/hooks/useAuth.tsx               |  2 +-
 src/hooks/useWords.tsx              | 38 ++++++++++----------
 src/repositories/associationRepo.ts | 40 +++++++++------------
 src/repositories/userRepo.ts        | 26 +++++++++++---
 src/repositories/wordRepo.ts        | 71 +++++++++++++++----------------------
 src/storage/keys.ts                 | 10 +++---
 8 files changed, 104 insertions(+), 103 deletions(-)
```
```
git diff
diff --git a/src/domain/types.ts b/src/domain/types.ts
index da19f73..956e23b 100644
--- a/src/domain/types.ts
+++ b/src/domain/types.ts
@@ -27,13 +27,17 @@ export type Association = {
 };
 
 export type User = {
+  id: string;
   email: string;
   passwordHash: string;
   createdAt: string;
 };
 
 export type Session = {
-  email: string;
+  user: {
+    id: string;
+    email: string;
+  };
   token: string;
 };
 
diff --git a/src/hooks/useAssociations.tsx b/src/hooks/useAssociations.tsx
index 8059795..889d71b 100644
--- a/src/hooks/useAssociations.tsx
+++ b/src/hooks/useAssociations.tsx
@@ -38,7 +38,7 @@ export function AssociationsProvider({ children }: PropsWithChildren) {
   const [associations, setAssociations] = useState<Record<string, Association[]>>({});
   const [votes, setVotes] = useState<Record<string, 1 | -1>>({});
   const [syncing, setSyncing] = useState(false);
-  const voterId = session?.email ?? "guest";
+  const userId = session?.user.id ?? "guest";
 
   const load = useCallback(async () => {
     const map = await getAssociationIndex();
@@ -46,9 +46,9 @@ export function AssociationsProvider({ children }: PropsWithChildren) {
   }, []);
 
   const loadVotes = useCallback(async () => {
-    const map = await getUserAssociationVotes(voterId);
+    const map = await getUserAssociationVotes(userId);
     setVotes(map);
-  }, [voterId]);
+  }, [userId]);
 
   const refresh = useCallback(async () => {
     setSyncing(true);
@@ -79,24 +79,24 @@ export function AssociationsProvider({ children }: PropsWithChildren) {
     if (votes[associationId]) {
       return associations[wordId] ?? [];
     }
-    const list = await voteAssociation(wordId, associationId, delta, voterId);
+    const list = await voteAssociation(wordId, associationId, delta, userId);
     setAssociations((prev) => ({ ...prev, [wordId]: list }));
     setVotes((prev) => ({ ...prev, [associationId]: delta }));
     return list;
-  }, [associations, votes, voterId]);
+  }, [associations, votes, userId]);
 
   const unvote = useCallback(async (wordId: string, associationId: string) => {
     if (!votes[associationId]) {
       return associations[wordId] ?? [];
     }
-    const list = await removeAssociationVote(wordId, associationId, voterId);
+    const list = await removeAssociationVote(wordId, associationId, userId);
     setAssociations((prev) => ({ ...prev, [wordId]: list }));
     setVotes((prev) => {
       const { [associationId]: _, ...rest } = prev;
       return rest;
     });
     return list;
-  }, [associations, votes, voterId]);
+  }, [associations, votes, userId]);
 
   const remove = useCallback(async (wordId: string, associationId: string) => {
     const list = await removeLocalAssociation(wordId, associationId);
diff --git a/src/hooks/useAuth.tsx b/src/hooks/useAuth.tsx
index 0548cb2..3f01de6 100644
--- a/src/hooks/useAuth.tsx
+++ b/src/hooks/useAuth.tsx
@@ -30,7 +30,7 @@ export function AuthProvider({ children }: PropsWithChildren) {
       await bootstrap();
       const existingSession = await getSession();
       if (existingSession) {
-        const existingUser = await getUserByEmail(existingSession.email);
+        const existingUser = await getUserByEmail(existingSession.user.email);
         if (existingUser) {
           setSession(existingSession);
           setUser(existingUser);
diff --git a/src/hooks/useWords.tsx b/src/hooks/useWords.tsx
index 369af4a..57c919d 100644
--- a/src/hooks/useWords.tsx
+++ b/src/hooks/useWords.tsx
@@ -53,7 +53,7 @@ const WordContext = createContext<WordContextValue | undefined>(undefined);
 
 export function WordProvider({ children }: PropsWithChildren) {
   const { session } = useAuth();
-  const email = session?.email;
+  const userId = session?.user.id;
   const groups = useMemo(() => getGroups(), []);
 
   const [statuses, setStatuses] = useState<Record<string, WordStatus>>({});
@@ -71,7 +71,7 @@ export function WordProvider({ children }: PropsWithChildren) {
   useEffect(() => {
     let active = true;
     (async () => {
-      if (!email) {
+      if (!userId) {
         setStatuses({});
         setHelpSeen(false);
         setStudyPrefsState({
@@ -88,10 +88,10 @@ export function WordProvider({ children }: PropsWithChildren) {
       setLoading(true);
       const [loadedStatuses, helpPref, studyPrefs, reviewPrefs] =
         await Promise.all([
-          getStatuses(email),
-          getHelpPreference(email),
-          getStudyPreferences(email),
-          getReviewFilters(email),
+          getStatuses(userId),
+          getHelpPreference(userId),
+          getStudyPreferences(userId),
+          getReviewFilters(userId),
         ]);
       if (!active) return;
       setStatuses(loadedStatuses);
@@ -103,40 +103,40 @@ export function WordProvider({ children }: PropsWithChildren) {
     return () => {
       active = false;
     };
-  }, [email]);
+  }, [userId]);
 
   const updateStatus = useCallback(
     async (wordId: string, status: WordStatus) => {
-      if (!email) return;
+      if (!userId) return;
       setStatuses((prev) => ({ ...prev, [wordId]: status }));
-      await setStatus(email, wordId, status);
+      await setStatus(userId, wordId, status);
     },
-    [email],
+    [userId],
   );
 
   const updateStudyPreferences = useCallback(
     async (prefs: StudyPreferences) => {
-      if (!email) return;
+      if (!userId) return;
       setStudyPrefsState(prefs);
-      await setStudyPreferences(email, prefs);
+      await setStudyPreferences(userId, prefs);
     },
-    [email],
+    [userId],
   );
 
   const updateReviewFilters = useCallback(
     async (filters: ReviewFilters) => {
-      if (!email) return;
+      if (!userId) return;
       setReviewFiltersState(filters);
-      await setReviewFilters(email, filters);
+      await setReviewFilters(userId, filters);
     },
-    [email],
+    [userId],
   );
 
   const markHelpSeen = useCallback(async () => {
-    if (!email) return;
+    if (!userId) return;
     setHelpSeen(true);
-    await setHelpPreference(email, { seen: true });
-  }, [email]);
+    await setHelpPreference(userId, { seen: true });
+  }, [userId]);
 
   const value = useMemo(
     () => ({
diff --git a/src/repositories/associationRepo.ts b/src/repositories/associationRepo.ts
index 4d6a94c..3caa2ea 100644
--- a/src/repositories/associationRepo.ts
+++ b/src/repositories/associationRepo.ts
@@ -3,7 +3,7 @@ import { STORAGE_KEYS } from "../storage/keys";
 import { getJson, setJson } from "../storage/storage";
 
 type AssociationState = Record<string, Association[]>;
-type AssociationVotesState = Record<string, Record<string, 1 | -1>>;
+type AssociationVotesState = Record<string, 1 | -1>;
 
 function sortAssociations(list: Association[]) {
   return [...list].sort(
@@ -22,12 +22,12 @@ async function saveState(state: AssociationState) {
   await setJson(STORAGE_KEYS.ASSOCIATIONS, state);
 }
 
-async function getVotesState() {
-  return getJson<AssociationVotesState>(STORAGE_KEYS.ASSOCIATION_VOTES, {});
+async function getVotesState(userId: string) {
+  return getJson<AssociationVotesState>(STORAGE_KEYS.ASSOCIATION_VOTES(userId), {});
 }
 
-async function saveVotesState(state: AssociationVotesState) {
-  await setJson(STORAGE_KEYS.ASSOCIATION_VOTES, state);
+async function saveVotesState(userId: string, state: AssociationVotesState) {
+  await setJson(STORAGE_KEYS.ASSOCIATION_VOTES(userId), state);
 }
 
 export async function getAssociations(wordId: string) {
@@ -76,15 +76,13 @@ export async function voteAssociation(
   wordId: string,
   associationId: string,
   delta: 1 | -1,
-  voterId?: string
+  userId: string
 ) {
   const state = await getState();
   const list = state[wordId] ?? [];
-  const votesState = await getVotesState();
-  const voterKey = voterId ?? "guest";
-  const userVotes = votesState[voterKey] ?? {};
+  const votesState = await getVotesState(userId);
 
-  if (userVotes[associationId]) {
+  if (votesState[associationId]) {
     return sortAssociations(list);
   }
 
@@ -95,22 +93,20 @@ export async function voteAssociation(
   );
   state[wordId] = sortAssociations(updated);
   await saveState(state);
-  votesState[voterKey] = { ...userVotes, [associationId]: delta };
-  await saveVotesState(votesState);
+  const updatedVotes = { ...votesState, [associationId]: delta };
+  await saveVotesState(userId, updatedVotes);
   return state[wordId];
 }
 
 export async function removeAssociationVote(
   wordId: string,
   associationId: string,
-  voterId?: string
+  userId: string
 ) {
   const state = await getState();
   const list = state[wordId] ?? [];
-  const votesState = await getVotesState();
-  const voterKey = voterId ?? "guest";
-  const userVotes = votesState[voterKey] ?? {};
-  const previous = userVotes[associationId];
+  const votesState = await getVotesState(userId);
+  const previous = votesState[associationId];
 
   if (!previous) {
     return sortAssociations(list);
@@ -121,11 +117,10 @@ export async function removeAssociationVote(
       ? { ...association, localDeltaScore: (association.localDeltaScore ?? 0) - previous }
       : association
   );
-  const { [associationId]: _, ...rest } = userVotes;
-  votesState[voterKey] = rest;
+  const { [associationId]: _, ...rest } = votesState;
   state[wordId] = sortAssociations(updated);
   await saveState(state);
-  await saveVotesState(votesState);
+  await saveVotesState(userId, rest);
   return state[wordId];
 }
 
@@ -148,7 +143,6 @@ export async function getAssociationIndex() {
   return getState();
 }
 
-export async function getUserAssociationVotes(voterId: string) {
-  const state = await getVotesState();
-  return state[voterId] ?? {};
+export async function getUserAssociationVotes(userId: string) {
+  return getVotesState(userId);
 }
diff --git a/src/repositories/userRepo.ts b/src/repositories/userRepo.ts
index fc3406f..d079d4d 100644
--- a/src/repositories/userRepo.ts
+++ b/src/repositories/userRepo.ts
@@ -7,6 +7,20 @@ function normalizeEmail(email: string) {
   return email.trim().toLowerCase();
 }
 
+async function createUserId() {
+  const bytes = await Crypto.getRandomBytesAsync(16);
+  bytes[6] = (bytes[6] & 0x0f) | 0x40;
+  bytes[8] = (bytes[8] & 0x3f) | 0x80;
+  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
+  return [
+    hex.slice(0, 8),
+    hex.slice(8, 12),
+    hex.slice(12, 16),
+    hex.slice(16, 20),
+    hex.slice(20),
+  ].join("-");
+}
+
 async function hashPassword(password: string) {
   return Crypto.digestStringAsync(
     Crypto.CryptoDigestAlgorithm.SHA256,
@@ -36,6 +50,7 @@ export async function registerUser(email: string, password: string) {
   }
   const passwordHash = await hashPassword(password);
   const user: User = {
+    id: await createUserId(),
     email: normalized,
     passwordHash,
     createdAt: new Date().toISOString(),
@@ -43,7 +58,7 @@ export async function registerUser(email: string, password: string) {
   const users = await getUsers();
   users.push(user);
   await saveUsers(users);
-  const session = await createSession(normalized);
+  const session = await createSession(user);
   return { user, session };
 }
 
@@ -57,13 +72,16 @@ export async function loginUser(email: string, password: string) {
   if (passwordHash !== user.passwordHash) {
     throw new Error("סיסמה שגויה");
   }
-  const session = await createSession(normalized);
+  const session = await createSession(user);
   return { user, session };
 }
 
-async function createSession(email: string) {
+async function createSession(user: Pick<User, "id" | "email">) {
   const session: Session = {
-    email,
+    user: {
+      id: user.id,
+      email: user.email,
+    },
     token: `token-${Date.now()}`,
   };
   await setJson(STORAGE_KEYS.SESSION, session);
diff --git a/src/repositories/wordRepo.ts b/src/repositories/wordRepo.ts
index cd54ec4..3f44b47 100644
--- a/src/repositories/wordRepo.ts
+++ b/src/repositories/wordRepo.ts
@@ -14,10 +14,7 @@ import {
 import { STORAGE_KEYS } from "../storage/keys";
 import { getJson, setJson } from "../storage/storage";
 
-type StatusState = Record<string, Record<string, WordStatus>>;
-type HelpState = Record<string, HelpPreference>;
-type StudyState = Record<string, StudyPreferences>;
-type ReviewState = Record<string, ReviewFilters>;
+type StatusEntry = Record<string, WordStatus>;
 
 export const DEFAULT_CHUNK_SIZE = 7;
 
@@ -55,72 +52,60 @@ export function getWordById(wordId: string) {
   return WORD_BY_ID.get(wordId) ?? null;
 }
 
-export async function getStatuses(email: string) {
-  const all = await getJson<StatusState>(STORAGE_KEYS.STATUSES, {});
-  return clone(all[email] ?? {});
+export async function getStatuses(userId: string) {
+  const statuses = await getJson<StatusEntry>(STORAGE_KEYS.STATUSES(userId), {});
+  return clone(statuses);
 }
 
 export async function setStatus(
-  email: string,
+  userId: string,
   wordId: string,
   status: WordStatus,
 ) {
-  const all = await getJson<StatusState>(STORAGE_KEYS.STATUSES, {});
-  const existing = all[email] ?? {};
+  const key = STORAGE_KEYS.STATUSES(userId);
+  const existing = await getJson<StatusEntry>(key, {});
   existing[wordId] = status;
-  all[email] = existing;
-  await setJson(STORAGE_KEYS.STATUSES, all);
+  await setJson(key, existing);
   return clone(existing);
 }
 
-export async function getHelpPreference(email: string) {
-  const prefs = await getJson<HelpState>(STORAGE_KEYS.HELP, {});
-  return prefs[email] ?? { seen: false };
+export async function getHelpPreference(userId: string) {
+  return getJson<HelpPreference>(STORAGE_KEYS.HELP(userId), { seen: false });
 }
 
 export async function setHelpPreference(
-  email: string,
+  userId: string,
   preference: HelpPreference,
 ) {
-  const prefs = await getJson<HelpState>(STORAGE_KEYS.HELP, {});
-  prefs[email] = preference;
-  await setJson(STORAGE_KEYS.HELP, prefs);
+  await setJson(STORAGE_KEYS.HELP(userId), preference);
   return preference;
 }
 
-export async function getStudyPreferences(email: string) {
-  const prefs = await getJson<StudyState>(STORAGE_KEYS.STUDY_PREFS, {});
-  return (
-    prefs[email] ?? {
-      chunkSize: DEFAULT_CHUNK_SIZE,
-      statuses: DEFAULT_STUDY_STATUSES,
-    }
-  );
+export async function getStudyPreferences(userId: string) {
+  const fallback: StudyPreferences = {
+    chunkSize: DEFAULT_CHUNK_SIZE,
+    statuses: DEFAULT_STUDY_STATUSES,
+  };
+  return getJson<StudyPreferences>(STORAGE_KEYS.STUDY_PREFS(userId), fallback);
 }
 
 export async function setStudyPreferences(
-  email: string,
+  userId: string,
   preferences: StudyPreferences,
 ) {
-  const prefs = await getJson<StudyState>(STORAGE_KEYS.STUDY_PREFS, {});
-  prefs[email] = preferences;
-  await setJson(STORAGE_KEYS.STUDY_PREFS, prefs);
+  await setJson(STORAGE_KEYS.STUDY_PREFS(userId), preferences);
   return preferences;
 }
 
-export async function getReviewFilters(email: string) {
-  const prefs = await getJson<ReviewState>(STORAGE_KEYS.REVIEW_PREFS, {});
-  return (
-    prefs[email] ?? {
-      groups: GROUPS.map((g) => g.id),
-      statuses: DEFAULT_REVIEW_STATUSES,
-    }
-  );
+export async function getReviewFilters(userId: string) {
+  const fallback: ReviewFilters = {
+    groups: GROUPS.map((g) => g.id),
+    statuses: DEFAULT_REVIEW_STATUSES,
+  };
+  return getJson<ReviewFilters>(STORAGE_KEYS.REVIEW_PREFS(userId), fallback);
 }
 
-export async function setReviewFilters(email: string, filters: ReviewFilters) {
-  const prefs = await getJson<ReviewState>(STORAGE_KEYS.REVIEW_PREFS, {});
-  prefs[email] = filters;
-  await setJson(STORAGE_KEYS.REVIEW_PREFS, prefs);
+export async function setReviewFilters(userId: string, filters: ReviewFilters) {
+  await setJson(STORAGE_KEYS.REVIEW_PREFS(userId), filters);
   return filters;
 }
diff --git a/src/storage/keys.ts b/src/storage/keys.ts
index 477d51c..5880b73 100644
--- a/src/storage/keys.ts
+++ b/src/storage/keys.ts
@@ -1,11 +1,11 @@
 export const STORAGE_KEYS = {
   USERS: "@pel/users",
   SESSION: "@pel/session",
-  STATUSES: "@pel/statuses",
-  HELP: "@pel/help",
-  STUDY_PREFS: "@pel/studyPrefs",
-  REVIEW_PREFS: "@pel/reviewPrefs",
+  STATUSES: (userId: string) => `@pel/statuses:${userId}`,
+  HELP: (userId: string) => `@pel/help:${userId}`,
+  STUDY_PREFS: (userId: string) => `@pel/studyPrefs:${userId}`,
+  REVIEW_PREFS: (userId: string) => `@pel/reviewPrefs:${userId}`,
   ASSOCIATIONS: "@pel/associations",
-  ASSOCIATION_VOTES: "@pel/associationVotes",
+  ASSOCIATION_VOTES: (userId: string) => `@pel/associationVotes:${userId}`,
   LAST_SYNC: "@pel/lastSync",
 };
```
```
git grep "email"
app/(auth)/login.tsx:  const [email, setEmail] = useState("");
app/(auth)/login.tsx:  const emailError = validateEmail(email);
app/(auth)/login.tsx:  const isValid = !emailError && !passwordError;
app/(auth)/login.tsx:      await login(email, password);
app/(auth)/login.tsx:            value={email}
app/(auth)/login.tsx:            keyboardType="email-address"
app/(auth)/login.tsx:            autoComplete="email"
app/(auth)/login.tsx:            error={email ? emailError : null}
app/(auth)/register.tsx:  const [email, setEmail] = useState("");
app/(auth)/register.tsx:  const emailError = validateEmail(email);
app/(auth)/register.tsx:    !emailError &&
app/(auth)/register.tsx:      await register(email, password);
app/(auth)/register.tsx:            value={email}
app/(auth)/register.tsx:            keyboardType="email-address"
app/(auth)/register.tsx:            autoComplete="email"
app/(auth)/register.tsx:            error={email ? emailError : null}
src/domain/types.ts:  email: string;
src/domain/types.ts:    email: string;
src/hooks/useAuth.tsx:  login: (email: string, password: string) => Promise<void>;
src/hooks/useAuth.tsx:  register: (email: string, password: string) => Promise<void>;
src/hooks/useAuth.tsx:        const existingUser = await getUserByEmail(existingSession.user.email);
src/hooks/useAuth.tsx:  const login = async (email: string, password: string) => {
src/hooks/useAuth.tsx:      email,
src/hooks/useAuth.tsx:  const register = async (email: string, password: string) => {
src/hooks/useAuth.tsx:      email,
src/repositories/userRepo.ts:function normalizeEmail(email: string) {
src/repositories/userRepo.ts:  return email.trim().toLowerCase();
src/repositories/userRepo.ts:export async function getUserByEmail(email: string) {
src/repositories/userRepo.ts:  const normalized = normalizeEmail(email);
src/repositories/userRepo.ts:  return users.find((u) => normalizeEmail(u.email) === normalized) ?? null;
src/repositories/userRepo.ts:export async function registerUser(email: string, password: string) {
src/repositories/userRepo.ts:  const normalized = normalizeEmail(email);
src/repositories/userRepo.ts:    email: normalized,
src/repositories/userRepo.ts:export async function loginUser(email: string, password: string) {
src/repositories/userRepo.ts:  const normalized = normalizeEmail(email);
src/repositories/userRepo.ts:async function createSession(user: Pick<User, "id" | "email">) {
src/repositories/userRepo.ts:      email: user.email,
src/services/validation.ts:export function validateEmail(email: string): string | null {
src/services/validation.ts:  if (!email.trim()) return "אנא הזינו אימייל";
src/services/validation.ts:  if (!EMAIL_REGEX.test(email.trim())) return "אימייל לא תקין";
```
Remaining `email` hits are limited to auth inputs/validation, user lookup, and session user profile data — not persistence keys.

## Verification
- Not run (no `npm run typecheck` / `expo start` executed).

## TODOs / Risks
- Local AsyncStorage data for existing dev accounts will not carry over because per-userId keys replaced the old email-keyed maps.
