# Step 07 - Supabase Auth Cutover

## Objective
Implement Supabase Auth in React Native for sign up, sign in, sign out, and session restore; remove runtime dependency on local-only auth (`userRepo` password hashing/session) while keeping the rest of app behavior unchanged.

## Files changed
- `package.json`
- `package-lock.json`
- `src/services/supabase.ts` (new)
- `src/hooks/useAuth.tsx`
- `app/(auth)/login.tsx`
- `app/(auth)/register.tsx`
- `app/_layout.tsx`
- `app/index.tsx`
- `components/HeaderHelpButton.tsx`
- `src/hooks/__tests__/useAuth.test.tsx`
- `src/hooks/__tests__/useWords.test.tsx`
- `src/hooks/__tests__/useAssociations.test.tsx`
- `jest.setup.ts`
- `README.md`
- `docs/codex/step-07-supabase-auth-cutover.md` (new)
- `docs/codex/_last_run_summary.md`

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

## Focused diff excerpts for key files

### `src/services/supabase.ts`
```ts
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
```

### `src/hooks/useAuth.tsx`
```diff
-import { Session, User } from "../domain/types";
-import { getSession, getUserById, loginUser, logoutUser, registerUser } from "../repositories/userRepo";
+import { Session, User } from "@supabase/supabase-js";
+import { supabase } from "../services/supabase";
 
 type AuthContextValue = {
-  initializing: boolean;
-  login: (email: string, password: string) => Promise<void>;
-  register: (email: string, password: string) => Promise<void>;
-  logout: () => Promise<void>;
+  isLoading: boolean;
+  signIn: (email: string, password: string) => Promise<void>;
+  signUp: (email: string, password: string) => Promise<void>;
+  signOut: () => Promise<void>;
 };
 
+const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
+  setSession(nextSession);
+  setUser(nextSession?.user ?? null);
+});
+
+const { data, error } = await supabase.auth.getSession();
+setSession(data.session ?? null);
+setUser(data.session?.user ?? null);
+
+const signIn = async (email: string, password: string) => {
+  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
+  if (error) throw error;
+  setSession(data.session ?? null);
+  setUser(data.user ?? data.session?.user ?? null);
+};
```

### `app/(auth)/login.tsx` and `app/(auth)/register.tsx`
```diff
-const { login } = useAuth();
-await login(email, password);
+const { signIn } = useAuth();
+await signIn(email, password);

-const { register } = useAuth();
-await register(email, password);
+const { signUp } = useAuth();
+await signUp(email, password);
```

### `app/_layout.tsx`, `app/index.tsx`, `components/HeaderHelpButton.tsx`
```diff
-const { session, initializing } = useAuth();
+const { session, isLoading } = useAuth();

-if (initializing) return;
+if (isLoading) return;

-const { logout } = useAuth();
-await logout();
+const { signOut } = useAuth();
+await signOut();
```

### `README.md`
```diff
+2. Configure Supabase Auth (required for login/register)
+
+   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
+   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
+
+   Optional fallback: expo.extra.supabaseUrl / expo.extra.supabaseAnonKey
+   Do not commit real keys to git.
```

## Notes / TODOs
- DB schema work was intentionally not implemented in this step.
- `src/repositories/userRepo.ts` still exists for now, but runtime auth no longer imports/references it.
- Validation run:
  - `npx tsc -p tsconfig.json --noEmit` (pass)
  - `npm run lint` (pass)
  - `npx jest src/hooks/__tests__/useAuth.test.tsx src/hooks/__tests__/useWords.test.tsx src/hooks/__tests__/useAssociations.test.tsx --runInBand` (pass)
