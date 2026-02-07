# Step 07b - Supabase Web Storage (SSR-safe)

## Objective
Make Supabase Auth initialization SSR-safe on Expo Web so server-side render does not crash (`window is not defined`), while keeping native behavior unchanged (AsyncStorage persistence on iOS/Android).

## Scope
- Changed only the Supabase client initialization layer.
- No runtime auth flow changes in `useAuth`.

## Files changed
- `src/services/supabase.ts`
- `docs/codex/step-07b-supabase-web-storage.md` (new)
- `docs/codex/_last_run_summary.md`

## Implementation summary
- Added a Promise-based storage adapter interface.
- Added three adapters:
  - Native: AsyncStorage (loaded lazily via `require` to avoid SSR-side import crash).
  - Web client: `window.localStorage` wrapper.
  - SSR fallback: in-memory `Map` adapter.
- Selected storage with:
  - `Platform.OS === "web"` + browser runtime (`window.localStorage`) -> localStorage adapter.
  - `Platform.OS === "web"` + SSR (`window` missing) -> memory adapter.
  - Non-web -> AsyncStorage adapter.
- Kept Supabase auth options unchanged:
  - `persistSession: true`
  - `autoRefreshToken: true`
  - `detectSessionInUrl: false`

## Validation
- `npx tsc -p tsconfig.json --noEmit` -> pass
- `npx jest src/hooks/__tests__/useAuth.test.tsx --runInBand` -> pass

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

## Focused diff excerpt: `src/services/supabase.ts`
```diff
diff --git a/src/services/supabase.ts b/src/services/supabase.ts
new file mode 100644
--- /dev/null
+++ b/src/services/supabase.ts
@@ -0,0 +1,94 @@
+import "react-native-url-polyfill/auto";
+import Constants from "expo-constants";
+import { createClient } from "@supabase/supabase-js";
+import { Platform } from "react-native";
+
+type StorageAdapter = {
+  getItem: (key: string) => Promise<string | null>;
+  setItem: (key: string, value: string) => Promise<void>;
+  removeItem: (key: string) => Promise<void>;
+};
+
+function createMemoryStorageAdapter(): StorageAdapter {
+  const memory = new Map<string, string>();
+  return {
+    getItem: async (key: string) => memory.get(key) ?? null,
+    setItem: async (key: string, value: string) => {
+      memory.set(key, value);
+    },
+    removeItem: async (key: string) => {
+      memory.delete(key);
+    },
+  };
+}
+
+function createNativeAsyncStorageAdapter(): StorageAdapter {
+  const AsyncStorage = require("@react-native-async-storage/async-storage")
+    .default as StorageAdapter;
+  return {
+    getItem: AsyncStorage.getItem.bind(AsyncStorage),
+    setItem: AsyncStorage.setItem.bind(AsyncStorage),
+    removeItem: AsyncStorage.removeItem.bind(AsyncStorage),
+  };
+}
+
+function resolveAuthStorage(): StorageAdapter {
+  if (Platform.OS === "web") {
+    if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
+      return createWebLocalStorageAdapter();
+    }
+    return createMemoryStorageAdapter();
+  }
+  return createNativeAsyncStorageAdapter();
+}
+
+export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
+  auth: {
+    storage: resolveAuthStorage(),
+    persistSession: true,
+    autoRefreshToken: true,
+    detectSessionInUrl: false,
+  },
+});
```

## Notes
- Because `src/services/supabase.ts` is currently untracked in this branch state, the focused excerpt is shown using a null-base diff (`/dev/null` -> file).
- Native auth persistence remains AsyncStorage-backed.
- Web SSR now avoids accessing `window` and uses in-memory storage safely until client hydration.
