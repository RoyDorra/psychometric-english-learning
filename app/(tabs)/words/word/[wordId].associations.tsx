import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import AppText from "@/components/AppText";
import PrimaryButton from "@/components/PrimaryButton";
import Screen from "@/components/Screen";
import TextField from "@/components/TextField";
import { useAssociations } from "@/src/hooks/useAssociations";
import { useWords } from "@/src/hooks/useWords";
import { colors, radius, spacing } from "@/src/ui/theme";

export default function WordAssociationsScreen() {
  const { wordId } = useLocalSearchParams<{ wordId: string }>();
  const { getWord } = useWords();
  const { list, add, vote, syncing } = useAssociations(wordId);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const word = wordId ? getWord(wordId) : null;

  const handleAdd = async () => {
    if (!wordId || !text.trim()) return;
    setSaving(true);
    await add(wordId, text.trim());
    setText("");
    setSaving(false);
  };

  return (
    <Screen withPadding>
      {word ? (
        <View style={styles.header}>
          <AppText style={styles.title}>אסוציאציות עבור</AppText>
          <AppText style={styles.english}>{word.english}</AppText>
        </View>
      ) : null}

      <View style={{ gap: spacing.s }}>
        <TextField
          label="הוסיפו אסוציאציה"
          value={text}
          onChangeText={setText}
          placeholder="כתבו בעברית"
        />
        <PrimaryButton
          title="שמור"
          onPress={handleAdd}
          disabled={!text.trim()}
          loading={saving}
        />
      </View>

      <View style={styles.listHeader}>
        <AppText style={styles.subtitle}>רשימה</AppText>
        {syncing ? <AppText style={{ color: colors.muted }}>מסנכרן...</AppText> : null}
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.s, paddingBottom: spacing.xl }}
        ListEmptyComponent={
          <AppText style={{ color: colors.muted }}>
            עדיין אין אסוציאציות. הוסיפו את הראשונה!
          </AppText>
        }
        renderItem={({ item }) => {
          const displayScore = item.baseScore + (item.localDeltaScore ?? 0);
          return (
            <View style={styles.association}>
              <View style={{ flex: 1, gap: spacing.xs }}>
                <AppText>{item.textHe}</AppText>
                <View style={styles.metaRow}>
                  <AppText style={styles.score}>ציון: {displayScore}</AppText>
                  {item.source === "local" ? (
                    <AppText style={styles.badge}>מקומי</AppText>
                  ) : null}
                </View>
              </View>
              <View style={styles.voteRow}>
                <TouchableOpacity
                  onPress={() => vote(item.wordId, item.id, 1)}
                  style={styles.voteBtn}
                >
                  <AppText>👍</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => vote(item.wordId, item.id, -1)}
                  style={styles.voteBtn}
                >
                  <AppText>👎</AppText>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.m,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  english: {
    fontSize: 16,
    color: colors.muted,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.l,
    marginBottom: spacing.s,
  },
  subtitle: {
    fontSize: 16,
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
  },
  voteBtn: {
    padding: spacing.s,
  },
});
