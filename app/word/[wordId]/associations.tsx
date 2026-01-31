import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import AppText from "@/components/AppText";
import EnglishText from "@/components/EnglishText";
import PrimaryButton from "@/components/PrimaryButton";
import Screen from "@/components/Screen";
import TextField from "@/components/TextField";
import { PrivateAssociation, PublicAssociationView } from "@/src/domain/types";
import { useAssociations } from "@/src/hooks/useAssociations";
import { useWords } from "@/src/hooks/useWords";
import { colors, radius, spacing } from "@/src/ui/theme";

type TabKey = "saved" | "public" | "private";
type AddMode = "public" | "private";

export default function WordAssociationsScreen() {
  const params = useLocalSearchParams<{ wordId?: string | string[] }>();
  const wordId = Array.isArray(params.wordId) ? params.wordId[0] : params.wordId;
  const { getWord } = useWords();
  const {
    publicList,
    savedList,
    privateList,
    addPublic,
    addPrivate,
    toggleLike,
    toggleSave,
    deletePrivate,
    refresh,
    loading,
  } = useAssociations(wordId);
  const [text, setText] = useState("");
  const [addMode, setAddMode] = useState<AddMode>("public");
  const [activeTab, setActiveTab] = useState<TabKey>("public");
  const [submitting, setSubmitting] = useState(false);

  const word = wordId ? getWord(wordId) : null;
  const canSubmit = Boolean(text.trim()) && !submitting && Boolean(wordId);

  const isPrivateTab = activeTab === "private";
  const publicData = useMemo(
    () => (activeTab === "saved" ? savedList : publicList),
    [activeTab, publicList, savedList],
  );

  const handleAdd = async () => {
    if (!wordId || !text.trim()) return;
    setSubmitting(true);
    try {
      if (addMode === "public") {
        await addPublic(wordId, text);
        setActiveTab("public");
      } else {
        await addPrivate(wordId, text);
        setActiveTab("private");
      }
      setText("");
    } finally {
      setSubmitting(false);
    }
  };

  const renderPublicAssociation = ({ item }: { item: PublicAssociationView }) => {
    const liked = item.isLikedByMe;
    const saved = item.isSavedByMe;
    const isSavedTab = activeTab === "saved";
    const saveLabel = isSavedTab ? "הסר" : saved ? "✔︎ נשמר" : "+ שמור";
    return (
      <View style={styles.card}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <AppText style={styles.associationText}>{item.textHe}</AppText>
          {!isSavedTab && saved ? (
            <AppText style={styles.savedBadge}>נשמר</AppText>
          ) : null}
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              liked && styles.iconButtonActive,
            ]}
            onPress={() => wordId && toggleLike(wordId, item.id)}
          >
            <AppText style={styles.iconLabel}>👍 {item.likeCount}</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iconButton,
              saved && styles.iconButtonSaved,
            ]}
            onPress={() => wordId && toggleSave(wordId, item.id)}
          >
            <AppText style={styles.iconLabel}>{saveLabel}</AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPrivateAssociation = ({ item }: { item: PrivateAssociation }) => {
    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <AppText style={styles.associationText}>{item.textHe}</AppText>
        </View>
        <TouchableOpacity
          style={[styles.iconButton, styles.deleteButton]}
          onPress={() => wordId && deletePrivate(wordId, item.id)}
        >
          <AppText style={[styles.iconLabel, styles.deleteText]}>מחק</AppText>
        </TouchableOpacity>
      </View>
    );
  };

  if (!wordId || !word) {
    return (
      <Screen withPadding>
        <AppText>המילה לא נמצאה</AppText>
      </Screen>
    );
  }

  const publicEmptyText =
    activeTab === "saved"
      ? "עדיין לא שמרתם אסוציאציות למילה הזאת."
      : "עדיין אין אסוציאציות ציבוריות. הוסיפו את הראשונה!";
  const privateEmptyText = "עדיין אין אסוציאציות פרטיות. הוסיפו אחת!";

  const listHeader = (
    <View style={{ gap: spacing.l, marginBottom: spacing.m }}>
      <View style={styles.headerCard}>
        <AppText style={styles.title}>אסוציאציות עבור</AppText>
        <EnglishText style={styles.english}>{word.en}</EnglishText>
        <AppText style={styles.hebrew}>{word.he.join(" / ")}</AppText>
      </View>

      <View style={styles.addCard}>
        <TextField
          label="הוסיפו אסוציאציה"
          value={text}
          onChangeText={setText}
          placeholder="רמז קצר שיעזור לזכור"
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <View style={styles.modeRow}>
          <AppText style={styles.modeLabel}>שיוך:</AppText>
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                addMode === "public" && styles.modeButtonActive,
              ]}
              onPress={() => setAddMode("public")}
            >
              <AppText
                style={[
                  styles.modeText,
                  addMode === "public" && styles.modeTextActive,
                ]}
              >
                ציבורי
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                addMode === "private" && styles.modeButtonActive,
              ]}
              onPress={() => setAddMode("private")}
            >
              <AppText
                style={[
                  styles.modeText,
                  addMode === "private" && styles.modeTextActive,
                ]}
              >
                פרטי
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
        <PrimaryButton
          title="הוסף"
          onPress={handleAdd}
          disabled={!canSubmit}
          loading={submitting}
        />
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "saved" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("saved")}
        >
          <AppText
            style={[
              styles.tabText,
              activeTab === "saved" && styles.tabTextActive,
            ]}
          >
            שמור
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "public" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("public")}
        >
          <AppText
            style={[
              styles.tabText,
              activeTab === "public" && styles.tabTextActive,
            ]}
          >
            כללי
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "private" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("private")}
        >
          <AppText
            style={[
              styles.tabText,
              activeTab === "private" && styles.tabTextActive,
            ]}
          >
            פרטי
          </AppText>
        </TouchableOpacity>
      </View>

      {loading ? (
        <AppText style={{ color: colors.muted }}>טוען...</AppText>
      ) : null}
    </View>
  );

  return (
    <Screen withPadding>
      {isPrivateTab ? (
        <FlatList<PrivateAssociation>
          data={privateList}
          keyExtractor={(item) => item.id}
          renderItem={renderPrivateAssociation}
          contentContainerStyle={{ gap: spacing.s, paddingBottom: spacing.xl }}
          style={{ flex: 1 }}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <AppText style={{ color: colors.muted }}>
              {privateEmptyText}
            </AppText>
          }
          refreshing={loading}
          onRefresh={() => refresh(wordId)}
        />
      ) : (
        <FlatList<PublicAssociationView>
          data={publicData}
          keyExtractor={(item) => item.id}
          renderItem={renderPublicAssociation}
          contentContainerStyle={{ gap: spacing.s, paddingBottom: spacing.xl }}
          style={{ flex: 1 }}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <AppText style={{ color: colors.muted }}>
              {publicEmptyText}
            </AppText>
          }
          refreshing={loading}
          onRefresh={() => refresh(wordId)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    gap: spacing.xs,
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addCard: {
    gap: spacing.s,
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  english: {
    fontSize: 18,
    fontWeight: "700",
  },
  hebrew: {
    color: colors.muted,
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s,
  },
  modeLabel: {
    color: colors.muted,
  },
  modeToggle: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  modeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.m,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: "#e0f2fe",
  },
  modeText: {
    fontWeight: "700",
  },
  modeTextActive: {
    color: colors.primary,
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.s,
  },
  tabButtonActive: {
    backgroundColor: "#e0f2fe",
  },
  tabText: {
    fontWeight: "700",
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  associationText: {
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "column",
    gap: spacing.xs,
    alignItems: "flex-start",
  },
  iconButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.m,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconButtonActive: {
    borderColor: "#16a34a",
    backgroundColor: "#dcfce7",
  },
  iconButtonSaved: {
    borderColor: colors.primary,
    backgroundColor: "#e0f2fe",
  },
  iconLabel: {
    fontWeight: "700",
  },
  savedBadge: {
    backgroundColor: "#e0f2fe",
    color: colors.primary,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    borderRadius: radius.s,
    fontWeight: "700",
  },
  deleteButton: {
    borderColor: colors.danger,
    backgroundColor: "#fee2e2",
  },
  deleteText: {
    color: colors.danger,
  },
});
