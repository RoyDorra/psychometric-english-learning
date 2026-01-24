import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import AppText from "@/components/AppText";
import PrimaryButton from "@/components/PrimaryButton";
import Screen from "@/components/Screen";
import {
  DEFAULT_STUDY_STATUSES,
  STATUS_LABELS,
  STATUS_ORDER,
} from "@/src/domain/status";
import { WordStatus } from "@/src/domain/types";
import { useWords } from "@/src/hooks/useWords";
import { colors, radius, spacing } from "@/src/ui/theme";

export default function StudySetupScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { studyPreferences, setStudyPreferences } = useWords();
  const [chunkSize, setChunkSize] = useState(studyPreferences.chunkSize);
  const [statuses, setStatuses] = useState<WordStatus[]>(studyPreferences.statuses);

  useEffect(() => {
    setChunkSize(studyPreferences.chunkSize);
    setStatuses(studyPreferences.statuses);
  }, [studyPreferences]);

  const toggleStatus = (status: WordStatus) => {
    setStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleStart = async () => {
    const normalizedChunk = Math.max(1, Number(chunkSize) || DEFAULT_STUDY_STATUSES.length);
    await setStudyPreferences({
      chunkSize: normalizedChunk,
      statuses: statuses.length ? statuses : DEFAULT_STUDY_STATUSES,
    });
    router.push({
      pathname: "/(tabs)/study/[groupId]/pager",
      params: {
        groupId,
        chunkSize: String(normalizedChunk),
        statuses: (statuses.length ? statuses : DEFAULT_STUDY_STATUSES).join(","),
      },
    });
  };

  return (
    <Screen withPadding>
      <AppText style={styles.title}>הגדרות למידה</AppText>
      <View style={{ gap: spacing.s }}>
        <AppText style={styles.label}>גודל מקבץ (ברירת מחדל 7)</AppText>
        <TextInput
          value={String(chunkSize)}
          onChangeText={(text) => setChunkSize(Number(text) || 0)}
          keyboardType="numeric"
          style={styles.input}
        />
      </View>
      <View style={{ gap: spacing.s }}>
        <AppText style={styles.label}>סטטוסים לכלול</AppText>
        <View style={styles.statusGrid}>
          {STATUS_ORDER.map((status) => {
            const active = statuses.includes(status);
            return (
              <TouchableOpacity
                key={status}
                onPress={() => toggleStatus(status)}
                style={[
                  styles.statusOption,
                  active && styles.statusActive,
                ]}
              >
                <AppText style={{ color: active ? "#fff" : colors.text }}>
                  {STATUS_LABELS[status]}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <PrimaryButton
        title="התחל למידה"
        onPress={handleStart}
        disabled={!groupId}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: spacing.m,
  },
  label: {
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.m,
    padding: spacing.m,
    backgroundColor: colors.surface,
    writingDirection: "rtl",
    textAlign: "right",
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s,
  },
  statusOption: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
