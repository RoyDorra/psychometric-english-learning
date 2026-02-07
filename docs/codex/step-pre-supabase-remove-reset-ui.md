# Remove Reset UI (pre-Supabase)

## Objective
Hide the local “reset user data” action from the Header help menu to avoid confusion before Supabase becomes the source of truth, while keeping storage utilities for future dev/internal use.

## Files changed
- components/HeaderHelpButton.tsx

## git status -sb
```
## dev...origin/dev
 M components/HeaderHelpButton.tsx
```

## git diff --stat
```
 components/HeaderHelpButton.tsx | 126 ++++++----------------------------------
 1 file changed, 17 insertions(+), 109 deletions(-)
```

## git diff
```
diff --git a/components/HeaderHelpButton.tsx b/components/HeaderHelpButton.tsx
index 0365fac..c9b853c 100644גג
--- a/components/HeaderHelpButton.tsx
+++ b/components/HeaderHelpButton.tsx
@@ -10,23 +10,21 @@ import {
 } from "react-native";
 import ModalSheet from "./ModalSheet";
 import { useAuth } from "@/src/hooks/useAuth";
-import { clearAppStorage } from "@/src/storage/clearAppStorage";
 import { colors, radius, spacing } from "@/src/ui/theme";
 
 export default function HeaderHelpButton() {
   const router = useRouter();
-  const { logout, user } = useAuth();
+  const { logout } = useAuth();
   const [visible, setVisible] = useState(false);
-  const [confirmReset, setConfirmReset] = useState(false);
-  const [loadingAction, setLoadingAction] = useState<"logout" | "reset" | null>(null);
+  const [loadingAction, setLoadingAction] = useState<"logout" | null>(null);
 
+  // TODO(supabase): Full account reset should be implemented via Supabase RPC/Edge Function; any local cache reset will live in dev-only tools.
   const actions = useMemo(
     () => [
       {
         label: "איך ללמוד?",
         onPress: async () => {
           setVisible(false);
-          setConfirmReset(false);
           router.push("/help");
         },
       },
@@ -34,42 +32,21 @@ export default function HeaderHelpButton() {
         label: "התנתק",
         onPress: async () => {
           setLoadingAction("logout");
-          setConfirmReset(false);
           await logout();
           setLoadingAction(null);
           setVisible(false);
           router.replace("/(auth)/login");
         },
       },
-      {
-        label: "איפוס נתונים מקומיים",
-        onPress: async () => {
-          setConfirmReset(true);
-        },
-      },
     ],
     [logout, router]
   );
 
-  const handleReset = async () => {
-    setLoadingAction("reset");
-    try {
-      await clearAppStorage(user?.id);
-      await logout();
-      router.replace("/(auth)/login");
-    } finally {
-      setLoadingAction(null);
-      setVisible(false);
-      setConfirmReset(false);
-    }
-  };
-
   return (
     <>
       <Pressable
         onPress={() => {
           setVisible(true);
-          setConfirmReset(false);
         }}
         style={({ pressed }) => [
           styles.button,
@@ -87,47 +64,21 @@ export default function HeaderHelpButton() {
       >
         <View style={styles.backdrop}>
           <ModalSheet>
-            {confirmReset ? (
-              <View style={styles.sheetContent}>
-                <Text style={styles.title}>איפוס נתונים?</Text>
-                <Text style={styles.subtitle}>
-                  פעולה זו תמחק משתמשים, סשן, סטטוסים ואסוציאציות מהמכשיר.
-                </Text>
-                <View style={styles.actionsRow}>
-                  <TouchableOpacity
-                    style={[styles.secondaryBtn]}
-                    onPress={() => setConfirmReset(false)}
-                  >
-                    <Text style={styles.secondaryText}>בטל</Text>
-                  </TouchableOpacity>
-                  <TouchableOpacity
-                    style={[styles.primaryBtn, styles.dangerBtn]}
-                    onPress={handleReset}
-                    disabled={loadingAction === "reset"}
-                  >
-                    <Text style={styles.primaryText}>
-                      {loadingAction === "reset" ? "מאפס..." : "כן, לאפס"}
-                    </Text>
-                  </TouchableOpacity>
-                </View>
-              </View>
-            ) : (
-              <View style={styles.sheetContent}>
-                {actions.map((action) => (
-                  <TouchableOpacity
-                    key={action.label}
-                    style={styles.menuItem}
-                    onPress={action.onPress}
-                    disabled={loadingAction === "logout"}
-                  >
-                    <Text style={styles.menuText}>{action.label}</Text>
-                  </TouchableOpacity>
-                ))}
-                <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
-                  <Text style={styles.closeText}>סגור</Text>
+            <View style={styles.sheetContent}>
+              {actions.map((action) => (
+                <TouchableOpacity
+                  key={action.label}
+                  style={styles.menuItem}
+                  onPress={action.onPress}
+                  disabled={loadingAction === "logout"}
+                >
+                  <Text style={styles.menuText}>{action.label}</Text>
                 </TouchableOpacity>
-              </View>
-            )}
+              ))}
+              <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
+                <Text style={styles.closeText}>סגור</Text>
+              </TouchableOpacity>
+            </View>
           </ModalSheet>
         </View>
       </Modal>
@@ -160,17 +111,6 @@ const styles = StyleSheet.create({
   sheetContent: {
     gap: spacing.m,
   },
-  title: {
-    fontSize: 18,
-    fontWeight: "700",
-    writingDirection: "rtl",
-    textAlign: "right",
-  },
-  subtitle: {
-    color: colors.muted,
-    writingDirection: "rtl",
-    textAlign: "right",
-  },
   menuItem: {
     paddingVertical: spacing.s,
   },
@@ -180,38 +120,6 @@ const styles = StyleSheet.create({
     writingDirection: "rtl",
     textAlign: "right",
   },
-  actionsRow: {
-    flexDirection: "row-reverse",
-    justifyContent: "flex-start",
-    gap: spacing.s,
-  },
-  primaryBtn: {
-    backgroundColor: colors.primary,
-    paddingHorizontal: spacing.l,
-    paddingVertical: spacing.s,
-    borderRadius: radius.s,
-  },
-  dangerBtn: {
-    backgroundColor: colors.danger,
-  },
-  primaryText: {
-    color: "#fff",
-    fontWeight: "700",
-    writingDirection: "rtl",
-  },
-  secondaryBtn: {
-    paddingHorizontal: spacing.l,
-    paddingVertical: spacing.s,
-    borderRadius: radius.s,
-    borderWidth: 1,
-    borderColor: colors.border,
-    backgroundColor: colors.surface,
-  },
-  secondaryText: {
-    color: colors.text,
-    fontWeight: "700",
-    writingDirection: "rtl",
-  },
   closeBtn: {
     alignSelf: "flex-start",
     paddingHorizontal: spacing.s,
```

## Manual test
- Not run (CLI-only). To verify: open header menu (help screen still opens), logout action returns to login, app boots normally.
