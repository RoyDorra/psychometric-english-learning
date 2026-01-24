import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Association } from "@/src/domain/types";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import AppText from "@/components/AppText";
import EnglishText from "@/components/EnglishText";
import PrimaryButton from "@/components/PrimaryButton";
import Screen from "@/components/Screen";
import TextField from "@/components/TextField";
import { useAssociations } from "@/src/hooks/useAssociations";
import { useWords } from "@/src/hooks/useWords";
import { colors, radius, spacing } from "@/src/ui/theme";

export default function WordAssociationsScreen() {
  const params = useLocalSearchParams<{ wordId?: string | string[] }>();
  const wordId = Array.isArray(params.wordId) ? params.wordId[0] : params.wordId;
  const { getWord } = useWords();
  const { list, add, vote, remove, syncing, refresh } = useAssociations(wordId);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const word = wordId ? getWord(wordId) : null;
  const canSave = text.trim().length > 0 && !saving;
  const sortedList = useMemo(() => {
    return [...list].sort(
      (a, b) =>
        b.baseScore + (b.localDeltaScore ?? 0) -
        (a.baseScore + (a.localDeltaScore ?? 0))
    );
  }, [list]);

  const handleAdd = async () => {
    if (!wordId || !text.trim()) return;
    setSaving(true);
    await add(wordId, text.trim());
    setText("");
    setSelectedId(null);
    setSaving(false);
  };

  const handleSelectAssociation = (itemId: string, value: string) => {
    setSelectedId((prev) => (prev === itemId ? null : itemId));
    setText(value);
  };

  const handleTextChange = (value: string) => {
    setText(value);
    if (selectedId) {
      setSelectedId(null);
    }
  };

  const renderAssociation = ({ item }: { item: Association }) => {
    const score = item.baseScore + (item.localDeltaScore ?? 0);
    const isSelected = selectedId === item.id;
    return (
      <View style={styles.association}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <AppText style={styles.associationText}>{item.textHe}</AppText>
          <View style={styles.metaRow}>
            <AppText style={styles.score}>ציון: {score}</AppText>
            {item.source === "local" ? (
              <AppText style={styles.badge}>מקומי</AppText>
            ) : null}
          </View>
        </View>
        <View style={styles.voteRow}>
          <TouchableOpacity
            onPress={() => vote(item.wordId, item.id, 1)}
            style={[styles.voteBtn, styles.voteUp]}
            hitSlop={6}
          >
            <AppText style={styles.voteText}>מועיל</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => vote(item.wordId, item.id, -1)}
            style={[styles.voteBtn, styles.voteDown]}
            hitSlop={6}
          >
            <AppText style={styles.voteText}>לא מועיל</AppText>
          </TouchableOpacity>
        </View>
        <View style={styles.manageRow}>
          <TouchableOpacity
            onPress={() => handleSelectAssociation(item.id, item.textHe)}
            style={[
              styles.manageBtn,
              isSelected && styles.manageBtnActive,
            ]}
          >
            <AppText
              style={[
                styles.manageText,
                isSelected && styles.manageTextActive,
              ]}
            >
              {isSelected ? "נבחר" : "בחר"}
            </AppText>
          </TouchableOpacity>
          {item.source === "local" ? (
            <TouchableOpacity
              onPress={async () => {
                if (!wordId) return;
                await remove(wordId, item.id);
                if (selectedId === item.id) {
                  setSelectedId(null);
                }
              }}
              style={[styles.manageBtn, styles.deleteBtn]}
            >
              <AppText style={[styles.manageText, styles.deleteText]}>
                מחק
              </AppText>
            </TouchableOpacity>
          ) : null}
        </View>
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

  return (
    <Screen withPadding>
      <FlatList
        data={sortedList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.s, paddingBottom: spacing.xl }}
        style={{ flex: 1 }}
        ListHeaderComponent={
          <View style={{ gap: spacing.l, marginBottom: spacing.m }}>
            <View style={styles.headerCard}>
              <AppText style={styles.title}>אסוציאציות עבור</AppText>
              <EnglishText style={styles.english}>{word.english}</EnglishText>
              <AppText style={styles.hebrew}>
                {word.hebrewTranslations.join(" / ")}
              </AppText>
            </View>

            <View style={styles.addCard}>
              <TextField
                label="הוסיפו אסוציאציה"
                value={text}
                onChangeText={handleTextChange}
                placeholder="רמז קצר שיעזור לזכור"
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
              <AppText style={styles.helper}>
                כתבו מילה, תמונה מנטלית או קישור אישי שמקל לזכור את המילה.
              </AppText>
              <PrimaryButton
                title="שמור אסוציאציה"
                onPress={handleAdd}
                disabled={!canSave}
                loading={saving}
              />
            </View>

            <View style={styles.listHeader}>
              <AppText style={styles.subtitle}>האסוציאציות שלי</AppText>
              <TouchableOpacity onPress={refresh} disabled={syncing}>
                <AppText style={styles.refreshText}>
                  {syncing ? "מסנכרן..." : "רענן"}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <AppText style={{ color: colors.muted }}>
            עדיין אין אסוציאציות. הוסיפו את הראשונה!
          </AppText>
        }
        renderItem={renderAssociation}
      />
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
  helper: {
    color: colors.muted,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  refreshText: {
    color: colors.primary,
    fontWeight: "700",
  },
  association: {
    flexDirection: "row",
    gap: spacing.m,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  associationText: {
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.s,
    alignItems: "center",
  },
  score: {
    color: colors.muted,
  },
  badge: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    borderRadius: radius.s,
    color: colors.primary,
    fontWeight: "700",
  },
  voteRow: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.xs,
  },
  voteBtn: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  voteUp: {
    borderColor: "#bbf7d0",
    backgroundColor: "#f0fdf4",
  },
  voteDown: {
    borderColor: "#fee2e2",
    backgroundColor: "#fef2f2",
  },
  voteText: {
    fontSize: 12,
    fontWeight: "700",
  },
  manageRow: {
    flexDirection: "column",
    gap: spacing.xs,
    alignItems: "flex-start",
  },
  manageBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.s,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  manageBtnActive: {
    borderColor: colors.primary,
    backgroundColor: "#e0f2fe",
  },
  manageText: {
    fontSize: 12,
    fontWeight: "700",
  },
  manageTextActive: {
    color: colors.primary,
  },
  deleteBtn: {
    borderColor: colors.danger,
    backgroundColor: "#fee2e2",
  },
  deleteText: {
    color: colors.danger,
  },
});
