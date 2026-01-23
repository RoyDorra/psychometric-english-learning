import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import AppText from "../../../../components/AppText";
import EnglishText from "../../../../components/EnglishText";
import PrimaryButton from "../../../../components/PrimaryButton";
import Screen from "../../../../components/Screen";
import StatusSelector from "../../../../components/StatusSelector";
import { WordStatus } from "../../../../src/domain/types";
import { useWords } from "../../../../src/hooks/useWords";
import { colors, radius, spacing } from "../../../../src/ui/theme";

function parseStatuses(raw?: string): WordStatus[] {
  if (!raw) return [];
  return raw.split(",").filter(Boolean) as WordStatus[];
}

export default function StudyPagerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId: string; chunkSize?: string; statuses?: string }>();
  const groupId = Number(params.groupId);
  const chunkSize = Math.max(1, Number(params.chunkSize) || 7);
  const selectedStatuses = parseStatuses(params.statuses);
  const { getWordsForGroup, statuses, updateStatus } = useWords();

  const filteredWords = useMemo(() => {
    const list = getWordsForGroup(groupId);
    if (!selectedStatuses.length) return list;
    return list.filter((word) =>
      selectedStatuses.includes(statuses[word.id] ?? "UNMARKED")
    );
  }, [groupId, getWordsForGroup, selectedStatuses, statuses]);

  const chunks = useMemo(() => {
    const arr: typeof filteredWords[] = [];
    for (let i = 0; i < filteredWords.length; i += chunkSize) {
      arr.push(filteredWords.slice(i, i + chunkSize));
    }
    return arr;
  }, [filteredWords, chunkSize]);

  const [page, setPage] = useState(0);
  const pageWords = chunks[page] ?? [];

  const next = () => setPage((p) => Math.min(chunks.length - 1, p + 1));
  const prev = () => setPage((p) => Math.max(0, p - 1));

  return (
    <Screen withPadding>
      <View style={styles.header}>
        <AppText style={styles.title}>קבוצה {groupId}</AppText>
        <AppText style={styles.subtitle}>
          עמוד {chunks.length ? page + 1 : 0} מתוך {chunks.length}
        </AppText>
      </View>

      <View style={styles.navRow}>
        <PrimaryButton title="הקודם" onPress={prev} disabled={page === 0} />
        <PrimaryButton
          title="הבא"
          onPress={next}
          disabled={page >= chunks.length - 1}
        />
      </View>

      {pageWords.length === 0 ? (
        <AppText style={{ color: colors.muted }}>
          אין מילים בעמוד זה לפי הסינון הנבחר.
        </AppText>
      ) : (
        <View style={{ gap: spacing.m }}>
          {pageWords.map((word) => {
            const status = statuses[word.id] ?? "UNMARKED";
            return (
              <View key={word.id} style={styles.card}>
                <EnglishText style={styles.english}>{word.english}</EnglishText>
                <AppText style={styles.hebrew}>
                  {word.hebrewTranslations.join(" / ")}
                </AppText>
                <StatusSelector
                  value={status}
                  onChange={(next) => updateStatus(word.id, next)}
                  compact
                />
                <TouchableOpacity
                  style={styles.assocBtn}
                  onPress={() => router.push(`/(tabs)/words/${word.id}.associations`)}
                >
                  <AppText style={styles.assocText}>אסוציאציות</AppText>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
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
  subtitle: {
    color: colors.muted,
  },
  navRow: {
    flexDirection: "row",
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.s,
  },
  english: {
    fontSize: 18,
    fontWeight: "700",
  },
  hebrew: {
    color: colors.muted,
  },
  assocBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assocText: {
    color: colors.primary,
    fontWeight: "700",
  },
});
