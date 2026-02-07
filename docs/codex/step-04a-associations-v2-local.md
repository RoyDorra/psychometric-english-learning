# Objective
- Deliver Associations v2 locally with public/saved/private lists, likes/saves, and offline AsyncStorage emulation while removing the old remote sync placeholder.

# Old behavior vs new behavior
- Old: Single associations list with remote/local sources, vote/unvote on a score, and a manual sync stub to example.com.
- New: Separate public and private association domains stored locally; likes and saves per user; saved/public/private tabs in UI; sorted by likes/newest; private items user-only; no remote sync placeholder.

# Files changed
- app/word/[wordId]/associations.tsx
- src/core/bootstrap.ts
- src/domain/types.ts
- src/hooks/useAssociations.tsx
- src/repositories/associationRepo.ts
- src/storage/keys.ts
- src/utils/uuid.ts
- (deleted) src/services/sync.ts
- docs/codex/step-04a-associations-v2-local.md

# Commands + outputs
## git status -sb
```
## refactore-asociations-before-db
 M app/word/[wordId]/associations.tsx
 M src/core/bootstrap.ts
 M src/domain/types.ts
 M src/hooks/useAssociations.tsx
 M src/repositories/associationRepo.ts
 D src/services/sync.ts
 M src/storage/keys.ts
?? src/utils/
```

## git diff --stat
```
 app/word/[wordId]/associations.tsx  | 470 ++++++++++++++++++++++--------------
 src/core/bootstrap.ts               |  18 --
 src/domain/types.ts                 |  24 +-
 src/hooks/useAssociations.tsx       | 272 +++++++++++++--------
 src/repositories/associationRepo.ts | 287 +++++++++++++---------
 src/services/sync.ts                |  29 ---
 src/storage/keys.ts                 |   7 +-
 7 files changed, 672 insertions(+), 435 deletions(-)
```

## git diff
```
diff --git a/app/word/[wordId]/associations.tsx b/app/word/[wordId]/associations.tsx
index fc3594a..a05d0e7 100644
--- a/app/word/[wordId]/associations.tsx
+++ b/app/word/[wordId]/associations.tsx
@@ -1,120 +1,120 @@
 import { useLocalSearchParams } from "expo-router";
 import { useMemo, useState } from "react";
-import { Association } from "@/src/domain/types";
-import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
+import {
+  FlatList,
+  StyleSheet,
+  TouchableOpacity,
+  View,
+} from "react-native";
 import AppText from "@/components/AppText";
 import EnglishText from "@/components/EnglishText";
 import PrimaryButton from "@/components/PrimaryButton";
 import Screen from "@/components/Screen";
 import TextField from "@/components/TextField";
+import { PrivateAssociation, PublicAssociationView } from "@/src/domain/types";
 import { useAssociations } from "@/src/hooks/useAssociations";
 import { useWords } from "@/src/hooks/useWords";
 import { colors, radius, spacing } from "@/src/ui/theme";
 
+type TabKey = "saved" | "public" | "private";
+type AddMode = "public" | "private";
+
 export default function WordAssociationsScreen() {
   const params = useLocalSearchParams<{ wordId?: string | string[] }>();
-  const wordId = Array.isArray(params.wordId)
-    ? params.wordId[0]
-    : params.wordId;
+  const wordId = Array.isArray(params.wordId) ? params.wordId[0] : params.wordId;
   const { getWord } = useWords();
-  const { list, add, vote, unvote, remove, syncing, refresh, hasVoted } =
-    useAssociations(wordId);
+  const {
+    publicList,
+    savedList,
+    privateList,
+    addPublic,
+    addPrivate,
+    toggleLike,
+    toggleSave,
+    deletePrivate,
+    refresh,
+    loading,
+  } = useAssociations(wordId);
   const [text, setText] = useState("");
-  const [saving, setSaving] = useState(false);
-  const [selectedId, setSelectedId] = useState<string | null>(null);
+  const [addMode, setAddMode] = useState<AddMode>("public");
+  const [activeTab, setActiveTab] = useState<TabKey>("public");
+  const [submitting, setSubmitting] = useState(false);
 
   const word = wordId ? getWord(wordId) : null;
-  const canSave = text.trim().length > 0 && !saving;
-  const sortedList = useMemo(() => {
-    return [...list].sort(
-      (a, b) =>
-        b.baseScore +
-        (b.localDeltaScore ?? 0) -
-        (a.baseScore + (a.localDeltaScore ?? 0)),
-    );
-  }, [list]);
+  const canSubmit = Boolean(text.trim()) && !submitting && Boolean(wordId);
+
+  const isPrivateTab = activeTab === "private";
+  const publicData = useMemo(
+    () => (activeTab === "saved" ? savedList : publicList),
+    [activeTab, publicList, savedList],
+  );
 
   const handleAdd = async () => {
     if (!wordId || !text.trim()) return;
-    setSaving(true);
-    await add(wordId, text.trim());
-    setText("");
-    setSelectedId(null);
-    setSaving(false);
-  };
-
-  const handleSelectAssociation = (itemId: string, value: string) => {
-    setSelectedId((prev) => (prev === itemId ? null : itemId));
-    setText(value);
-  };
-
-  const handleTextChange = (value: string) => {
-    setText(value);
-    if (selectedId) {
-      setSelectedId(null);
+    setSubmitting(true);
+    try {
+      if (addMode === "public") {
+        await addPublic(wordId, text);
+        setActiveTab("public");
+      } else {
+        await addPrivate(wordId, text);
+        setActiveTab("private");
+      }
+      setText("");
+    } finally {
+      setSubmitting(false);
     }
   };
 
-  const renderAssociation = ({ item }: { item: Association }) => {
-    const score = item.baseScore + (item.localDeltaScore ?? 0);
-    const isSelected = selectedId === item.id;
-    const voted = hasVoted(item.id);
+  const renderPublicAssociation = ({ item }: { item: PublicAssociationView }) => {
+    const liked = item.isLikedByMe;
+    const saved = item.isSavedByMe;
     return (
-      <View style={styles.association}>
+      <View style={styles.card}>
         <View style={{ flex: 1, gap: spacing.xs }}>
           <AppText style={styles.associationText}>{item.textHe}</AppText>
-          <View style={styles.metaRow}>
-            <AppText style={styles.score}>ציון: {score}</AppText>
-            {item.source === "local" ? (
-              <AppText style={styles.badge}>מקומי</AppText>
-            ) : null}
-          </View>
+          {saved ? <AppText style={styles.savedBadge}>נשמר</AppText> : null}
         </View>
-        <View style={styles.voteRow}>
+        <View style={styles.actionsRow}>
           <TouchableOpacity
-            onPress={() =>
-              voted
-                ? unvote(item.wordId, item.id)
-                : vote(item.wordId, item.id, 1)
-            }
-            style={[styles.voteBtn, voted && styles.voteActive]}
-            hitSlop={8}
+            style={[
+              styles.iconButton,
+              liked && styles.iconButtonActive,
+            ]}
+            onPress={() => wordId && toggleLike(wordId, item.id)}
           >
-            <AppText style={styles.voteEmoji}>👍</AppText>
+            <AppText style={styles.iconLabel}>👍 {item.likeCount}</AppText>
           </TouchableOpacity>
-        </View>
-        <View style={styles.manageRow}>
           <TouchableOpacity
-            onPress={() => handleSelectAssociation(item.id, item.textHe)}
-            style={[styles.manageBtn, isSelected && styles.manageBtnActive]}
+            style={[
+              styles.iconButton,
+              saved && styles.iconButtonSaved,
+            ]}
+            onPress={() => wordId && toggleSave(wordId, item.id)}
           >
-            <AppText
-              style={[styles.manageText, isSelected && styles.manageTextActive]}
-            >
-              {isSelected ? "נבחר" : "בחר"}
-            </AppText>
+            <AppText style={styles.iconLabel}>{saved ? "✔︎ נשמר" : "+ שמור"}</AppText>
           </TouchableOpacity>
-          {item.source === "local" ? (
-            <TouchableOpacity
-              onPress={async () => {
-                if (!wordId) return;
-                await remove(wordId, item.id);
-                if (selectedId === item.id) {
-                  setSelectedId(null);
-                }
-              }}
-              style={[styles.manageBtn, styles.deleteBtn]}
-            >
-              <AppText style={[styles.manageText, styles.deleteText]}>
-                מחק
-              </AppText>
-            </TouchableOpacity>
-          ) : null}
         </View>
       </View>
     );
   };
 
+  const renderPrivateAssociation = ({ item }: { item: PrivateAssociation }) => {
+    return (
+      <View style={styles.card}>
+        <View style={{ flex: 1 }}>
+          <AppText style={styles.associationText}>{item.textHe}</AppText>
+        </View>
+        <TouchableOpacity
+          style={[styles.iconButton, styles.deleteButton]}
+          onPress={() => wordId && deletePrivate(wordId, item.id)}
+        >
+          <AppText style={[styles.iconLabel, styles.deleteText]}>מחק</AppText>
+        </TouchableOpacity>
+      </View>
+    );
+  };
+
   if (!wordId || !word) {
     return (
       <Screen withPadding>
@@ -123,58 +123,166 @@ export default function WordAssociationsScreen() {
     );
   }
 
-  return (
-    <Screen withPadding>
-      <FlatList
-        data={sortedList}
-        keyExtractor={(item) => item.id}
-        contentContainerStyle={{ gap: spacing.s, paddingBottom: spacing.xl }}
-        style={{ flex: 1 }}
-        ListHeaderComponent={
-          <View style={{ gap: spacing.l, marginBottom: spacing.m }}>
-            <View style={styles.headerCard}>
-              <AppText style={styles.title}>אסוציאציות עבור</AppText>
-              <EnglishText style={styles.english}>{word.en}</EnglishText>
-              <AppText style={styles.hebrew}>{word.he.join(" / ")}</AppText>
-            </View>
+  const publicEmptyText =
+    activeTab === "saved"
+      ? "עדיין לא שמרתם אסוציאציות למילה הזאת."
+      : "עדיין אין אסוציאציות ציבוריות. הוסיפו את הראשונה!";
+  const privateEmptyText = "עדיין אין אסוציאציות פרטיות. הוסיפו אחת!";
 
-            <View style={styles.addCard}>
-              <TextField
-                label="הוסיפו אסוציאציה"
-                value={text}
-                onChangeText={handleTextChange}
-                placeholder="רמז קצר שיעזור לזכור"
-                returnKeyType="done"
-                onSubmitEditing={handleAdd}
-              />
-              <AppText style={styles.helper}>
-                כתבו מילה, תמונה מנטלית או קישור אישי שמקל לזכור את המילה.
-              </AppText>
-              <PrimaryButton
-                title="שמור אסוציאציה"
-                onPress={handleAdd}
-                disabled={!canSave}
-                loading={saving}
-              />
-            </View>
+  const listHeader = (
+    <View style={{ gap: spacing.l, marginBottom: spacing.m }}>
+      <View style={styles.headerCard}>
+        <AppText style={styles.title}>אסוציאציות עבור</AppText>
+        <EnglishText style={styles.english}>{word.en}</EnglishText>
+        <AppText style={styles.hebrew}>{word.he.join(" / ")}</AppText>
+      </View>
 
-            <View style={styles.listHeader}>
-              <AppText style={styles.subtitle}>האסוציאציות שלי</AppText>
-              <TouchableOpacity onPress={refresh} disabled={syncing}>
-                <AppText style={styles.refreshText}>
-                  {syncing ? "מסנכרן..." : "רענן"}
-                </AppText>
-              </TouchableOpacity>
-            </View>
+      <View style={styles.addCard}>
+        <TextField
+          label="הוסיפו אסוציאציה"
+          value={text}
+          onChangeText={setText}
+          placeholder="רמז קצר שיעזור לזכור"
+          returnKeyType="done"
+          onSubmitEditing={handleAdd}
+        />
+        <View style={styles.modeRow}>
+          <AppText style={styles.modeLabel}>שיוך:</AppText>
+          <View style={styles.modeToggle}>
+            <TouchableOpacity
+              style={[
+                styles.modeButton,
+                addMode === "public" && styles.modeButtonActive,
+              ]}
+              onPress={() => setAddMode("public")}
+            >
+              <AppText
+                style={[
+                  styles.modeText,
+                  addMode === "public" && styles.modeTextActive,
+                ]}
+              >
+                ציבורי
+              </AppText>
+            </TouchableOpacity>
+            <TouchableOpacity
+              style={[
+                styles.modeButton,
+                addMode === "private" && styles.modeButtonActive,
+              ]}
+              onPress={() => setAddMode("private")}
+            >
+              <AppText
+                style={[
+                  styles.modeText,
+                  addMode === "private" && styles.modeTextActive,
+                ]}
+              >
+                פרטי
+              </AppText>
+            </TouchableOpacity>
           </View>
-        }
-        ListEmptyComponent={
-          <AppText style={{ color: colors.muted }}>
-            עדיין אין אסוציאציות. הוסיפו את הראשונה!
+        </View>
+        <PrimaryButton
+          title="הוסף"
+          onPress={handleAdd}
+          disabled={!canSubmit}
+          loading={submitting}
+        />
+      </View>
+
+      <View style={styles.tabsRow}>
+        <TouchableOpacity
+          style={[
+            styles.tabButton,
+            activeTab === "saved" && styles.tabButtonActive,
+          ]}
+          onPress={() => setActiveTab("saved")}
+        >
+          <AppText
+            style={[
+              styles.tabText,
+              activeTab === "saved" && styles.tabTextActive,
+            ]}
+          >
+            שמור
+          </AppText>
+        </TouchableOpacity>
+        <TouchableOpacity
+          style={[
+            styles.tabButton,
+            activeTab === "public" && styles.tabButtonActive,
+          ]}
+          onPress={() => setActiveTab("public")}
+        >
+          <AppText
+            style={[
+              styles.tabText,
+              activeTab === "public" && styles.tabTextActive,
+            ]}
+          >
+            כללי
+          </AppText>
+        </TouchableOpacity>
+        <TouchableOpacity
+          style={[
+            styles.tabButton,
+            activeTab === "private" && styles.tabButtonActive,
+          ]}
+          onPress={() => setActiveTab("private")}
+        >
+          <AppText
+            style={[
+              styles.tabText,
+              activeTab === "private" && styles.tabTextActive,
+            ]}
+          >
+            פרטי
           </AppText>
-        }
-        renderItem={renderAssociation}
-      />
+        </TouchableOpacity>
+      </View>
+
+      {loading ? (
+        <AppText style={{ color: colors.muted }}>טוען...</AppText>
+      ) : null}
+    </View>
+  );
+
+  return (
+    <Screen withPadding>
+      {isPrivateTab ? (
+        <FlatList<PrivateAssociation>
+          data={privateList}
+          keyExtractor={(item) => item.id}
+          renderItem={renderPrivateAssociation}
+          contentContainerStyle={{ gap: spacing.s, paddingBottom: spacing.xl }}
+          style={{ flex: 1 }}
+          ListHeaderComponent={listHeader}
+          ListEmptyComponent={
+            <AppText style={{ color: colors.muted }}>
+              {privateEmptyText}
+            </AppText>
+          }
+          refreshing={loading}
+          onRefresh={() => refresh(wordId)}
+        />
+      ) : (
+        <FlatList<PublicAssociationView>
+          data={publicData}
+          keyExtractor={(item) => item.id}
+          renderItem={renderPublicAssociation}
+          contentContainerStyle={{ gap: spacing.s, paddingBottom: spacing.xl }}
+          style={{ flex: 1 }}
+          ListHeaderComponent={listHeader}
+          ListEmptyComponent={
+            <AppText style={{ color: colors.muted }}>
+              {publicEmptyText}
+            </AppText>
+          }
+          refreshing={loading}
+          onRefresh={() => refresh(wordId)}
+        />
+      )}
     </Screen>
   );
 }
@@ -207,98 +315,106 @@ const styles = StyleSheet.create({
   hebrew: {
     color: colors.muted,
   },
-  helper: {
+  modeRow: {
+    flexDirection: "row",
+    alignItems: "center",
+    gap: spacing.s,
+  },
+  modeLabel: {
     color: colors.muted,
   },
-  listHeader: {
+  modeToggle: {
     flexDirection: "row",
-    justifyContent: "space-between",
-    alignItems: "center",
+    gap: spacing.xs,
+  },
+  modeButton: {
+    paddingVertical: spacing.xs,
+    paddingHorizontal: spacing.m,
+    borderRadius: radius.s,
+    borderWidth: 1,
+    borderColor: colors.border,
+    backgroundColor: colors.surface,
   },
-  subtitle: {
-    fontSize: 16,
+  modeButtonActive: {
+    borderColor: colors.primary,
+    backgroundColor: "#e0f2fe",
+  },
+  modeText: {
     fontWeight: "700",
   },
-  refreshText: {
+  modeTextActive: {
     color: colors.primary,
-    fontWeight: "700",
   },
-  association: {
+  tabsRow: {
     flexDirection: "row",
-    gap: spacing.m,
-    padding: spacing.m,
     backgroundColor: colors.surface,
     borderRadius: radius.m,
     borderWidth: 1,
     borderColor: colors.border,
+    overflow: "hidden",
   },
-  associationText: {
-    fontWeight: "600",
-  },
-  metaRow: {
-    flexDirection: "row",
-    gap: spacing.s,
+  tabButton: {
+    flex: 1,
     alignItems: "center",
+    paddingVertical: spacing.s,
   },
-  score: {
+  tabButtonActive: {
+    backgroundColor: "#e0f2fe",
+  },
+  tabText: {
+    fontWeight: "700",
     color: colors.muted,
   },
-  badge: {
-    backgroundColor: "#e0f2fe",
-    paddingHorizontal: spacing.s,
-    paddingVertical: 2,
-    borderRadius: radius.s,
+  tabTextActive: {
     color: colors.primary,
-    fontWeight: "700",
   },
-  voteRow: {
-    flexDirection: "column",
-    justifyContent: "space-between",
+  card: {
+    flexDirection: "row",
     alignItems: "center",
-    gap: spacing.xs,
-  },
-  voteBtn: {
-    width: 34,
-    height: 34,
-    borderRadius: 17,
+    gap: spacing.s,
+    padding: spacing.m,
+    backgroundColor: colors.surface,
+    borderRadius: radius.m,
     borderWidth: 1,
     borderColor: colors.border,
-    backgroundColor: colors.surface,
-    alignItems: "center",
-    justifyContent: "center",
-  },
-  voteActive: {
-    borderColor: "#16a34a",
-    backgroundColor: "#dcfce7",
   },
-  voteEmoji: {
-    fontSize: 18,
+  associationText: {
+    fontWeight: "600",
   },
-  manageRow: {
+  actionsRow: {
     flexDirection: "column",
     gap: spacing.xs,
     alignItems: "flex-start",
   },
-  manageBtn: {
+  iconButton: {
     paddingVertical: spacing.xs,
-    paddingHorizontal: spacing.s,
+    paddingHorizontal: spacing.m,
     borderRadius: radius.s,
     borderWidth: 1,
     borderColor: colors.border,
     backgroundColor: colors.surface,
   },
-  manageBtnActive: {
+  iconButtonActive: {
+    borderColor: "#16a34a",
+    backgroundColor: "#dcfce7",
+  },
+  iconButtonSaved: {
     borderColor: colors.primary,
     backgroundColor: "#e0f2fe",
   },
-  manageText: {
-    fontSize: 12,
+  iconLabel: {
     fontWeight: "700",
   },
-  manageTextActive: {
+  savedBadge: {
+    backgroundColor: "#e0f2fe",
     color: colors.primary,
+    alignSelf: "flex-start",
+    paddingHorizontal: spacing.s,
+    paddingVertical: 2,
+    borderRadius: radius.s,
+    fontWeight: "700",
   },
-  deleteBtn: {
+  deleteButton: {
     borderColor: colors.danger,
     backgroundColor: "#fee2e2",
   },
diff --git a/src/core/bootstrap.ts b/src/core/bootstrap.ts
index d6916b1..cb6ed39 100644
--- a/src/core/bootstrap.ts
+++ b/src/core/bootstrap.ts
@@ -1,23 +1,5 @@
-import { STORAGE_KEYS } from "../storage/keys";
-import { getJson, setJson } from "../storage/storage";
 import { ensureRTL } from "../ui/rtl";
-import { canSync, fetchAssociationsIndex } from "../services/sync";
-import { upsertRemoteAssociations } from "../repositories/associationRepo";
 
 export async function bootstrap() {
   ensureRTL();
 }
-
-export async function syncAssociationsIfPossible() {
-  const connected = await canSync();
-  if (!connected) return false;
-  const remote = await fetchAssociationsIndex();
-  if (!remote) return false;
-  await upsertRemoteAssociations(remote);
-  await setJson(STORAGE_KEYS.LAST_SYNC, { lastSyncAt: new Date().toISOString() });
-  return true;
-}
-
-export async function getLastSync() {
-  return getJson<{ lastSyncAt?: string }>(STORAGE_KEYS.LAST_SYNC, {});
-}
diff --git a/src/domain/types.ts b/src/domain/types.ts
index a3def71..970100b 100644
--- a/src/domain/types.ts
+++ b/src/domain/types.ts
@@ -14,18 +14,32 @@ export type Group = {
   order: number;
 };
 
-export type AssociationSource = "remote" | "local";
+export type PublicAssociation = {
+  id: string;
+  wordId: string;
+  textHe: string;
+  createdByUserId: string;
+  createdAt: string;
+  updatedAt: string;
+  likeCount: number;
+};
 
-export type Association = {
+export type PrivateAssociation = {
   id: string;
   wordId: string;
   textHe: string;
-  baseScore: number;
-  localDeltaScore: number;
-  source: AssociationSource;
+  userId: string;
   createdAt: string;
+  updatedAt: string;
+};
+
+export type AssociationMeta = {
+  isLikedByMe: boolean;
+  isSavedByMe: boolean;
 };
 
+export type PublicAssociationView = PublicAssociation & AssociationMeta;
+
 export type User = {
   id: string;
   email: string;
diff --git a/src/hooks/useAssociations.tsx b/src/hooks/useAssociations.tsx
index 889d71b..af6cea1 100644
--- a/src/hooks/useAssociations.tsx
+++ b/src/hooks/useAssociations.tsx
@@ -1,127 +1,190 @@
 import {
   createContext,
   PropsWithChildren,
+  useCallback,
   useContext,
   useEffect,
   useMemo,
+  useRef,
   useState,
-  useCallback,
 } from "react";
 import {
-  addLocalAssociation,
-  getAssociationIndex,
-  getUserAssociationVotes,
-  removeAssociationVote,
-  removeLocalAssociation,
-  voteAssociation,
+  createPrivateAssociation,
+  createPublicAssociation,
+  deletePrivateAssociation,
+  listPrivateByWord,
+  listPublicByWord,
+  listSavedByWord,
+  toggleLike as toggleLikeRepo,
+  toggleSave as toggleSaveRepo,
 } from "../repositories/associationRepo";
-import { Association } from "../domain/types";
-import { syncAssociationsIfPossible } from "../core/bootstrap";
+import {
+  PrivateAssociation,
+  PublicAssociationView,
+} from "../domain/types";
 import { useAuth } from "./useAuth";
 
 type AssociationsContextValue = {
-  associations: Record<string, Association[]>;
-  votes: Record<string, 1 | -1>;
-  refresh: () => Promise<void>;
-  add: (wordId: string, text: string) => Promise<Association[]>;
-  vote: (wordId: string, associationId: string, delta: 1 | -1) => Promise<Association[]>;
-  unvote: (wordId: string, associationId: string) => Promise<Association[]>;
-  remove: (wordId: string, associationId: string) => Promise<Association[]>;
-  hasVoted: (associationId: string) => boolean;
-  syncing: boolean;
+  publicLists: Record<string, PublicAssociationView[]>;
+  savedLists: Record<string, PublicAssociationView[]>;
+  privateLists: Record<string, PrivateAssociation[]>;
+  loading: boolean;
+  refresh: (wordId?: string) => Promise<void>;
+  addPublic: (wordId: string, textHe: string) => Promise<void>;
+  addPrivate: (wordId: string, textHe: string) => Promise<void>;
+  toggleLike: (wordId: string, associationId: string) => Promise<void>;
+  toggleSave: (wordId: string, associationId: string) => Promise<void>;
+  deletePrivate: (wordId: string, associationId: string) => Promise<void>;
 };
 
-const AssociationsContext = createContext<AssociationsContextValue | undefined>(undefined);
+const AssociationsContext = createContext<AssociationsContextValue | undefined>(
+  undefined,
+);
 
 export function AssociationsProvider({ children }: PropsWithChildren) {
   const { session } = useAuth();
-  const [associations, setAssociations] = useState<Record<string, Association[]>>({});
-  const [votes, setVotes] = useState<Record<string, 1 | -1>>({});
-  const [syncing, setSyncing] = useState(false);
   const userId = session?.user.id ?? "guest";
+  const [publicLists, setPublicLists] = useState<
+    Record<string, PublicAssociationView[]>
+  >({});
+  const [savedLists, setSavedLists] = useState<
+    Record<string, PublicAssociationView[]>
+  >({});
+  const [privateLists, setPrivateLists] = useState<
+    Record<string, PrivateAssociation[]>
+  >({});
+  const [loading, setLoading] = useState(false);
+  const trackedWordIdsRef = useRef<Set<string>>(new Set());
 
-  const load = useCallback(async () => {
-    const map = await getAssociationIndex();
-    setAssociations(map);
-  }, []);
-
-  const loadVotes = useCallback(async () => {
-    const map = await getUserAssociationVotes(userId);
-    setVotes(map);
+  useEffect(() => {
+    setPublicLists({});
+    setSavedLists({});
+    setPrivateLists({});
+    trackedWordIdsRef.current = new Set();
   }, [userId]);
 
-  const refresh = useCallback(async () => {
-    setSyncing(true);
-    await syncAssociationsIfPossible();
-    await load();
-    await loadVotes();
-    setSyncing(false);
-  }, [load, loadVotes]);
+  const refresh = useCallback(
+    async (wordId?: string) => {
+      const targets = wordId
+        ? [wordId]
+        : Array.from(trackedWordIdsRef.current);
+
+      if (wordId) {
+        trackedWordIdsRef.current.add(wordId);
+      }
+
+      if (!targets.length) {
+        return;
+      }
+
+      setLoading(true);
+      try {
+        const results = await Promise.all(
+          targets.map(async (id) => {
+            const [publicList, savedList, privateList] = await Promise.all([
+              listPublicByWord(id, userId),
+              listSavedByWord(id, userId),
+              listPrivateByWord(id, userId),
+            ]);
+            return { id, publicList, savedList, privateList };
+          }),
+        );
+
+        setPublicLists((prev) => {
+          const next = { ...prev };
+          results.forEach(({ id, publicList }) => {
+            next[id] = publicList;
+          });
+          return next;
+        });
+
+        setSavedLists((prev) => {
+          const next = { ...prev };
+          results.forEach(({ id, savedList }) => {
+            next[id] = savedList;
+          });
+          return next;
+        });
+
+        setPrivateLists((prev) => {
+          const next = { ...prev };
+          results.forEach(({ id, privateList }) => {
+            next[id] = privateList;
+          });
+          return next;
+        });
+      } finally {
+        setLoading(false);
+      }
+    },
+    [userId],
+  );
 
-  useEffect(() => {
-    load();
-    loadVotes();
-  }, [load, loadVotes]);
+  const addPublic = useCallback(
+    async (wordId: string, textHe: string) => {
+      await createPublicAssociation(wordId, textHe.trim(), userId);
+      await refresh(wordId);
+    },
+    [refresh, userId],
+  );
 
-  useEffect(() => {
-    if (session) {
-      refresh();
-    }
-  }, [session, refresh]);
+  const addPrivate = useCallback(
+    async (wordId: string, textHe: string) => {
+      await createPrivateAssociation(wordId, textHe.trim(), userId);
+      await refresh(wordId);
+    },
+    [refresh, userId],
+  );
 
-  const add = useCallback(async (wordId: string, text: string) => {
-    const list = await addLocalAssociation(wordId, text.trim());
-    setAssociations((prev) => ({ ...prev, [wordId]: list }));
-    return list;
-  }, []);
+  const toggleLike = useCallback(
+    async (wordId: string, associationId: string) => {
+      await toggleLikeRepo(associationId, userId);
+      await refresh(wordId);
+    },
+    [refresh, userId],
+  );
 
-  const vote = useCallback(async (wordId: string, associationId: string, delta: 1 | -1) => {
-    if (votes[associationId]) {
-      return associations[wordId] ?? [];
-    }
-    const list = await voteAssociation(wordId, associationId, delta, userId);
-    setAssociations((prev) => ({ ...prev, [wordId]: list }));
-    setVotes((prev) => ({ ...prev, [associationId]: delta }));
-    return list;
-  }, [associations, votes, userId]);
-
-  const unvote = useCallback(async (wordId: string, associationId: string) => {
-    if (!votes[associationId]) {
-      return associations[wordId] ?? [];
-    }
-    const list = await removeAssociationVote(wordId, associationId, userId);
-    setAssociations((prev) => ({ ...prev, [wordId]: list }));
-    setVotes((prev) => {
-      const { [associationId]: _, ...rest } = prev;
-      return rest;
-    });
-    return list;
-  }, [associations, votes, userId]);
-
-  const remove = useCallback(async (wordId: string, associationId: string) => {
-    const list = await removeLocalAssociation(wordId, associationId);
-    setAssociations((prev) => ({ ...prev, [wordId]: list }));
-    return list;
-  }, []);
-
-  const hasVoted = useCallback(
-    (associationId: string) => Boolean(votes[associationId]),
-    [votes]
+  const toggleSave = useCallback(
+    async (wordId: string, associationId: string) => {
+      await toggleSaveRepo(associationId, userId);
+      await refresh(wordId);
+    },
+    [refresh, userId],
+  );
+
+  const deletePrivate = useCallback(
+    async (wordId: string, associationId: string) => {
+      await deletePrivateAssociation(associationId, wordId, userId);
+      await refresh(wordId);
+    },
+    [refresh, userId],
   );
 
   const value = useMemo(
     () => ({
-      associations,
-      votes,
+      publicLists,
+      savedLists,
+      privateLists,
+      loading,
       refresh,
-      add,
-      vote,
-      unvote,
-      remove,
-      hasVoted,
-      syncing,
+      addPublic,
+      addPrivate,
+      toggleLike,
+      toggleSave,
+      deletePrivate,
     }),
-    [associations, votes, syncing, refresh, add, vote, unvote, remove, hasVoted]
+    [
+      publicLists,
+      savedLists,
+      privateLists,
+      loading,
+      refresh,
+      addPublic,
+      addPrivate,
+      toggleLike,
+      toggleSave,
+      deletePrivate,
+    ],
   );
 
   return (
@@ -134,9 +197,28 @@ export function AssociationsProvider({ children }: PropsWithChildren) {
 export function useAssociations(wordId?: string) {
   const ctx = useContext(AssociationsContext);
   if (!ctx) throw new Error("useAssociations must be used within AssociationsProvider");
-  const list = wordId ? ctx.associations[wordId] ?? [] : [];
+  const refresh = ctx.refresh;
+
+  useEffect(() => {
+    if (wordId) {
+      refresh(wordId);
+    }
+  }, [refresh, wordId]);
+
+  const publicList = wordId ? ctx.publicLists[wordId] ?? [] : [];
+  const savedList = wordId ? ctx.savedLists[wordId] ?? [] : [];
+  const privateList = wordId ? ctx.privateLists[wordId] ?? [] : [];
+
   return {
-    ...ctx,
-    list,
+    publicList,
+    savedList,
+    privateList,
+    addPublic: ctx.addPublic,
+    addPrivate: ctx.addPrivate,
+    toggleLike: ctx.toggleLike,
+    toggleSave: ctx.toggleSave,
+    deletePrivate: ctx.deletePrivate,
+    refresh: ctx.refresh,
+    loading: ctx.loading,
   };
 }
diff --git a/src/repositories/associationRepo.ts b/src/repositories/associationRepo.ts
index 3caa2ea..c8200f2 100644
--- a/src/repositories/associationRepo.ts
+++ b/src/repositories/associationRepo.ts
@@ -1,148 +1,219 @@
-import { Association } from "../domain/types";
+import {
+  PrivateAssociation,
+  PublicAssociation,
+  PublicAssociationView,
+} from "../domain/types";
 import { STORAGE_KEYS } from "../storage/keys";
 import { getJson, setJson } from "../storage/storage";
+import { uuid } from "../utils/uuid";
 
-type AssociationState = Record<string, Association[]>;
-type AssociationVotesState = Record<string, 1 | -1>;
+type PrivateAssociationsState = Record<string, PrivateAssociation[]>;
+type AssociationFlagState = Record<string, boolean>;
 
-function sortAssociations(list: Association[]) {
-  return [...list].sort(
-    (a, b) =>
-      b.baseScore +
-      b.localDeltaScore -
-      (a.baseScore + a.localDeltaScore)
+const sortPublic = <T extends PublicAssociation>(list: T[]): T[] =>
+  [...list].sort((a, b) => {
+    if (b.likeCount !== a.likeCount) {
+      return b.likeCount - a.likeCount;
+    }
+    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
+  });
+
+async function getPublicState() {
+  return getJson<PublicAssociation[]>(STORAGE_KEYS.PUBLIC_ASSOCIATIONS, []);
+}
+
+async function savePublicState(state: PublicAssociation[]) {
+  await setJson(STORAGE_KEYS.PUBLIC_ASSOCIATIONS, state);
+}
+
+async function getPrivateState(userId: string) {
+  return getJson<PrivateAssociationsState>(
+    STORAGE_KEYS.PRIVATE_ASSOCIATIONS(userId),
+    {},
   );
 }
 
-async function getState() {
-  return getJson<AssociationState>(STORAGE_KEYS.ASSOCIATIONS, {});
+async function savePrivateState(userId: string, state: PrivateAssociationsState) {
+  await setJson(STORAGE_KEYS.PRIVATE_ASSOCIATIONS(userId), state);
 }
 
-async function saveState(state: AssociationState) {
-  await setJson(STORAGE_KEYS.ASSOCIATIONS, state);
+async function getLikesState(userId: string) {
+  return getJson<AssociationFlagState>(STORAGE_KEYS.ASSOCIATION_LIKES(userId), {});
 }
 
-async function getVotesState(userId: string) {
-  return getJson<AssociationVotesState>(STORAGE_KEYS.ASSOCIATION_VOTES(userId), {});
+async function saveLikesState(userId: string, state: AssociationFlagState) {
+  await setJson(STORAGE_KEYS.ASSOCIATION_LIKES(userId), state);
 }
 
-async function saveVotesState(userId: string, state: AssociationVotesState) {
-  await setJson(STORAGE_KEYS.ASSOCIATION_VOTES(userId), state);
+async function getSavesState(userId: string) {
+  return getJson<AssociationFlagState>(STORAGE_KEYS.ASSOCIATION_SAVES(userId), {});
 }
 
-export async function getAssociations(wordId: string) {
-  const state = await getState();
-  return sortAssociations(state[wordId] ?? []);
+async function saveSavesState(userId: string, state: AssociationFlagState) {
+  await setJson(STORAGE_KEYS.ASSOCIATION_SAVES(userId), state);
 }
 
-export async function upsertRemoteAssociations(map: AssociationState) {
-  const state = await getState();
-  Object.entries(map).forEach(([wordId, remoteList]) => {
-    const existing = state[wordId] ?? [];
-    const locals = existing.filter((a) => a.source === "local");
-    const mergedRemote = remoteList.map((remote) => {
-      const previous = existing.find((a) => a.id === remote.id);
-      return {
-        ...remote,
-        source: "remote" as const,
-        localDeltaScore: previous?.localDeltaScore ?? 0,
-      };
-    });
-    state[wordId] = sortAssociations([...mergedRemote, ...locals]);
-  });
-  await saveState(state);
-  return state;
+export async function listPublicByWord(
+  wordId: string,
+  userId: string,
+): Promise<PublicAssociationView[]> {
+  const [allPublic, likes, saves] = await Promise.all([
+    getPublicState(),
+    getLikesState(userId),
+    getSavesState(userId),
+  ]);
+
+  const views = allPublic
+    .filter((assoc) => assoc.wordId === wordId)
+    .map(
+      (assoc): PublicAssociationView => ({
+        ...assoc,
+        isLikedByMe: Boolean(likes[assoc.id]),
+        isSavedByMe: Boolean(saves[assoc.id]),
+      }),
+    );
+
+  return sortPublic(views);
+}
+
+export async function listSavedByWord(
+  wordId: string,
+  userId: string,
+): Promise<PublicAssociationView[]> {
+  const [allPublic, likes, saves] = await Promise.all([
+    getPublicState(),
+    getLikesState(userId),
+    getSavesState(userId),
+  ]);
+
+  const views = allPublic
+    .filter((assoc) => assoc.wordId === wordId && saves[assoc.id])
+    .map(
+      (assoc): PublicAssociationView => ({
+        ...assoc,
+        isLikedByMe: Boolean(likes[assoc.id]),
+        isSavedByMe: true,
+      }),
+    );
+
+  return sortPublic(views);
+}
+
+export async function listPrivateByWord(
+  wordId: string,
+  userId: string,
+): Promise<PrivateAssociation[]> {
+  const state = await getPrivateState(userId);
+  const list = state[wordId] ?? [];
+  return [...list].sort(
+    (a, b) =>
+      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
+  );
 }
 
-export async function addLocalAssociation(wordId: string, textHe: string) {
-  const state = await getState();
+export async function createPublicAssociation(
+  wordId: string,
+  textHe: string,
+  userId: string,
+): Promise<void> {
+  const list = await getPublicState();
   const now = new Date().toISOString();
-  const newAssociation: Association = {
-    id: `local-${Date.now()}`,
+  const newAssociation: PublicAssociation = {
+    id: uuid(),
     wordId,
     textHe,
-    baseScore: 0,
-    localDeltaScore: 0,
-    source: "local",
+    createdByUserId: userId,
     createdAt: now,
+    updatedAt: now,
+    likeCount: 0,
   };
-  const existing = state[wordId] ?? [];
-  state[wordId] = sortAssociations([newAssociation, ...existing]);
-  await saveState(state);
-  return state[wordId];
+  await savePublicState([newAssociation, ...list]);
 }
 
-export async function voteAssociation(
+export async function createPrivateAssociation(
   wordId: string,
-  associationId: string,
-  delta: 1 | -1,
-  userId: string
-) {
-  const state = await getState();
-  const list = state[wordId] ?? [];
-  const votesState = await getVotesState(userId);
-
-  if (votesState[associationId]) {
-    return sortAssociations(list);
-  }
-
-  const updated = list.map((association) =>
-    association.id === associationId
-      ? { ...association, localDeltaScore: (association.localDeltaScore ?? 0) + delta }
-      : association
-  );
-  state[wordId] = sortAssociations(updated);
-  await saveState(state);
-  const updatedVotes = { ...votesState, [associationId]: delta };
-  await saveVotesState(userId, updatedVotes);
-  return state[wordId];
+  textHe: string,
+  userId: string,
+): Promise<void> {
+  const state = await getPrivateState(userId);
+  const now = new Date().toISOString();
+  const next: PrivateAssociation = {
+    id: uuid(),
+    wordId,
+    textHe,
+    userId,
+    createdAt: now,
+    updatedAt: now,
+  };
+  const existing = state[wordId] ?? [];
+  state[wordId] = [next, ...existing];
+  await savePrivateState(userId, state);
 }
 
-export async function removeAssociationVote(
-  wordId: string,
-  associationId: string,
-  userId: string
-) {
-  const state = await getState();
-  const list = state[wordId] ?? [];
-  const votesState = await getVotesState(userId);
-  const previous = votesState[associationId];
-
-  if (!previous) {
-    return sortAssociations(list);
+export async function toggleLike(associationId: string, userId: string) {
+  const [publicList, likes] = await Promise.all([
+    getPublicState(),
+    getLikesState(userId),
+  ]);
+  const isLiked = Boolean(likes[associationId]);
+  const updatedLikes = { ...likes };
+  if (isLiked) {
+    delete updatedLikes[associationId];
+  } else {
+    updatedLikes[associationId] = true;
   }
 
-  const updated = list.map((association) =>
-    association.id === associationId
-      ? { ...association, localDeltaScore: (association.localDeltaScore ?? 0) - previous }
-      : association
+  const updatedPublic = publicList.map((assoc) =>
+    assoc.id === associationId
+      ? {
+          ...assoc,
+          likeCount: Math.max(0, assoc.likeCount + (isLiked ? -1 : 1)),
+          updatedAt: new Date().toISOString(),
+        }
+      : assoc,
   );
-  const { [associationId]: _, ...rest } = votesState;
-  state[wordId] = sortAssociations(updated);
-  await saveState(state);
-  await saveVotesState(userId, rest);
-  return state[wordId];
+
+  await Promise.all([
+    savePublicState(updatedPublic),
+    saveLikesState(userId, updatedLikes),
+  ]);
 }
 
-export async function removeLocalAssociation(wordId: string, associationId: string) {
-  const state = await getState();
-  const existing = state[wordId] ?? [];
-  const filtered = existing.filter(
-    (association) =>
-      association.id !== associationId || association.source !== "local"
-  );
-  if (filtered.length === existing.length) {
-    return existing;
+export async function toggleSave(associationId: string, userId: string) {
+  const saves = await getSavesState(userId);
+  const updated = { ...saves };
+  if (updated[associationId]) {
+    delete updated[associationId];
+  } else {
+    updated[associationId] = true;
   }
-  state[wordId] = sortAssociations(filtered);
-  await saveState(state);
-  return state[wordId];
+  await saveSavesState(userId, updated);
 }
 
-export async function getAssociationIndex() {
-  return getState();
+export async function deletePrivateAssociation(
+  associationId: string,
+  wordId: string,
+  userId: string,
+): Promise<void> {
+  const state = await getPrivateState(userId);
+  const existing = state[wordId] ?? [];
+  const filtered = existing.filter((assoc) => assoc.id !== associationId);
+  state[wordId] = filtered;
+  await savePrivateState(userId, state);
 }
 
-export async function getUserAssociationVotes(userId: string) {
-  return getVotesState(userId);
+export async function updatePrivateAssociation(
+  associationId: string,
+  wordId: string,
+  userId: string,
+  textHe: string,
+): Promise<void> {
+  const state = await getPrivateState(userId);
+  const existing = state[wordId] ?? [];
+  state[wordId] = existing.map((assoc) =>
+    assoc.id === associationId
+      ? { ...assoc, textHe, updatedAt: new Date().toISOString() }
+      : assoc,
+  );
+  await savePrivateState(userId, state);
 }
diff --git a/src/services/sync.ts b/src/services/sync.ts
deleted file mode 100644
index c5bc4b5..0000000
--- a/src/services/sync.ts
+++ /dev/null
@@ -1,29 +0,0 @@
-import * as Network from "expo-network";
-import { Association } from "../domain/types";
-
-const REMOTE_ASSOCIATIONS_URL =
-  "https://example.com/psychometric-associations.json";
-
-export type AssociationsIndex = Record<string, Association[]>;
-
-export async function canSync() {
-  try {
-    const state = await Network.getNetworkStateAsync();
-    return Boolean(state.isConnected && state.isInternetReachable !== false);
-  } catch (error) {
-    console.warn("network check failed", error);
-    return false;
-  }
-}
-
-export async function fetchAssociationsIndex(): Promise<AssociationsIndex | null> {
-  try {
-    const response = await fetch(REMOTE_ASSOCIATIONS_URL);
-    if (!response.ok) return null;
-    const payload = (await response.json()) as AssociationsIndex;
-    return payload;
-  } catch (error) {
-    console.warn("remote associations fetch failed", error);
-    return null;
-  }
-}
diff --git a/src/storage/keys.ts b/src/storage/keys.ts
index 5880b73..cf0307b 100644
--- a/src/storage/keys.ts
+++ b/src/storage/keys.ts
@@ -5,7 +5,8 @@ export const STORAGE_KEYS = {
   HELP: (userId: string) => `@pel/help:${userId}`,
   STUDY_PREFS: (userId: string) => `@pel/studyPrefs:${userId}`,
   REVIEW_PREFS: (userId: string) => `@pel/reviewPrefs:${userId}`,
-  ASSOCIATIONS: "@pel/associations",
-  ASSOCIATION_VOTES: (userId: string) => `@pel/associationVotes:${userId}`,
-  LAST_SYNC: "@pel/lastSync",
+  PUBLIC_ASSOCIATIONS: "@pel/publicAssociations",
+  PRIVATE_ASSOCIATIONS: (userId: string) => `@pel/privateAssociations:${userId}`,
+  ASSOCIATION_LIKES: (userId: string) => `@pel/associationLikes:${userId}`,
+  ASSOCIATION_SAVES: (userId: string) => `@pel/associationSaves:${userId}`,
 };
```

## npx tsc -p tsconfig.json --noEmit
```
No output (exit code 0)
```

# Manual test checklist
- add public association -> appears in All/Public
- like toggles count and reorders by likes
- save toggles and appears in Saved tab
- add private association -> appears only in Private tab
- delete private removes it

# Notes / TODOs for Supabase integration
- Replace AsyncStorage repositories with Supabase tables for public associations, likes, and saves; keep private associations scoped to user (secure).
- Handle migration of existing local associations/likes/saves to Supabase once connectivity exists.
- Add realtime or refetch hooks to keep All/Public sorted by live like counts.
- Add server-side guards to prevent negative like counts and ensure per-user save/like uniqueness.
