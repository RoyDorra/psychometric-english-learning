import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { PanResponder, StyleSheet, TouchableOpacity, View } from "react-native";
import AppText from "../../../components/AppText";
import EnglishText from "../../../components/EnglishText";
import PrimaryButton from "../../../components/PrimaryButton";
import Screen from "../../../components/Screen";
import StatusSelector from "../../../components/StatusSelector";
import { DEFAULT_REVIEW_STATUSES } from "../../../src/domain/status";
import { WordStatus } from "../../../src/domain/types";
import { useAssociations } from "../../../src/hooks/useAssociations";
import { useReviewPlayer } from "../../../src/hooks/useReviewPlayer";
import { useWords } from "../../../src/hooks/useWords";
import { rowDirection } from "../../../src/ui/rtl";
import { colors, radius, spacing } from "../../../src/ui/theme";

function parseGroups(raw?: string) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((g) => Number(g))
    .filter(Boolean);
}

function parseStatuses(raw?: string): WordStatus[] {
  if (!raw) return [];
  return raw.split(",").filter(Boolean) as WordStatus[];
}

export default function ReviewPlayerScreen() {
  const params = useLocalSearchParams<{ groups?: string; statuses?: string }>();
  const router = useRouter();
  const { getWordsForGroup, statuses, updateStatus, groups } = useWords();
  const [showTranslation, setShowTranslation] = useState(false);
  const { refresh } = useAssociations();

  const filterGroups = useMemo(
    () => parseGroups(params.groups),
    [params.groups]
  );
  const rawFilterStatuses = useMemo(
    () => parseStatuses(params.statuses),
    [params.statuses]
  );
  const filterStatuses = useMemo(
    () => (rawFilterStatuses.length ? rawFilterStatuses : DEFAULT_REVIEW_STATUSES),
    [rawFilterStatuses]
  );

  const targetGroups = useMemo(
    () => (filterGroups.length ? filterGroups : groups.map((g) => g.id)),
    [filterGroups, groups]
  );

  const words = useMemo(
    () => targetGroups.flatMap((id) => getWordsForGroup(id)),
    [targetGroups, getWordsForGroup]
  );

  const { current, next, prev, total, list, resetIndex } = useReviewPlayer({
    words,
    statuses,
    filters: {
      groups: filterGroups,
      statuses: filterStatuses,
    },
  });

  const filterGroupsKey = useMemo(() => filterGroups.join(","), [filterGroups]);
  const filterStatusesKey = useMemo(
    () => filterStatuses.join(","),
    [filterStatuses]
  );

  useEffect(() => {
    resetIndex();
  }, [filterGroupsKey, filterStatusesKey, resetIndex]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 20,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -30) {
            next();
            setShowTranslation(false);
          } else if (gesture.dx > 30) {
            prev();
            setShowTranslation(false);
          }
        },
      }),
    [next, prev]
  );

  const currentStatus = current ? statuses[current.id] ?? "UNMARKED" : "UNMARKED";

  return (
    <Screen withPadding>
      <View style={styles.topRow}>
        <AppText style={styles.title}>שינון</AppText>
        <AppText style={styles.counter}>
          {current ? list.indexOf(current) + 1 : 0} / {total}
        </AppText>
      </View>

      {!current ? (
        <AppText style={{ color: colors.muted }}>
          אין מילים תואמות לסינון. חזרו אחורה ובחרו מסנן אחר.
        </AppText>
      ) : (
        <View style={styles.cardWrapper} {...panResponder.panHandlers}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => setShowTranslation((v) => !v)}
          >
            <EnglishText style={styles.english}>{current.english}</EnglishText>
            {showTranslation ? (
              <AppText style={styles.translation}>
                {current.hebrewTranslations.join(" / ")}
              </AppText>
            ) : (
              <AppText style={styles.hint}>הקישו כדי להציג תרגום</AppText>
            )}
          </TouchableOpacity>
        </View>
      )}

      {current ? (
        <View style={{ gap: spacing.m }}>
          <StatusSelector
            value={currentStatus}
            onChange={(nextStatus) => updateStatus(current.id, nextStatus)}
          />

          <View style={styles.navRow}>
            <PrimaryButton title="הקודם" onPress={() => { prev(); setShowTranslation(false); }} />
            <PrimaryButton title="הבא" onPress={() => { next(); setShowTranslation(false); }} />
          </View>

          <PrimaryButton
            title="אסוציאציות"
            onPress={() => {
              refresh();
              router.push(`/(tabs)/words/${current.id}.associations`);
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: rowDirection,
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.m,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  counter: {
    color: colors.muted,
  },
  cardWrapper: {
    marginBottom: spacing.l,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.l,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  english: {
    fontSize: 26,
    fontWeight: "800",
  },
  translation: {
    fontSize: 20,
    marginTop: spacing.s,
  },
  hint: {
    color: colors.muted,
  },
  navRow: {
    flexDirection: rowDirection,
    gap: spacing.s,
  },
});
