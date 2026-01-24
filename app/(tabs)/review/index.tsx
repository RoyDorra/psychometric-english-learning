import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import AppText from "@/components/AppText";
import PrimaryButton from "@/components/PrimaryButton";
import Screen from "@/components/Screen";
import {
  DEFAULT_REVIEW_STATUSES,
  STATUS_LABELS,
} from "@/src/domain/status";
import { ReviewFilters, WordStatus } from "@/src/domain/types";
import { useWords } from "@/src/hooks/useWords";
import { colors, radius, spacing } from "@/src/ui/theme";

export default function ReviewFiltersScreen() {
  const router = useRouter();
  const { groups, reviewFilters, setReviewFilters } = useWords();

  const [localFilters, setLocalFilters] = useState<ReviewFilters>(reviewFilters);

  useEffect(() => {
    setLocalFilters(reviewFilters);
  }, [reviewFilters]);

  const toggleGroup = (id: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      groups: prev.groups.includes(id)
        ? prev.groups.filter((g) => g !== id)
        : [...prev.groups, id],
    }));
  };

  const toggleStatus = (status: WordStatus) => {
    setLocalFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  };

  const handleStart = async () => {
    const safeFilters: ReviewFilters = {
      groups: localFilters.groups.length ? localFilters.groups : groups.map((g) => g.id),
      statuses: localFilters.statuses.length ? localFilters.statuses : DEFAULT_REVIEW_STATUSES,
    };
    await setReviewFilters(safeFilters);
    router.push({
      pathname: "/(tabs)/review/player",
      params: {
        groups: safeFilters.groups.join(","),
        statuses: safeFilters.statuses.join(","),
      },
    });
  };

  return (
    <Screen withPadding>
      <AppText style={styles.title}>סינון לשינון</AppText>
      <View style={{ gap: spacing.s }}>
        <AppText style={styles.label}>קבוצות</AppText>
        <View style={styles.grid}>
          {groups.map((group) => {
            const active = localFilters.groups.includes(group.id);
            return (
              <TouchableOpacity
                key={group.id}
                onPress={() => toggleGroup(group.id)}
                style={[
                  styles.chip,
                  active && styles.chipActive,
                ]}
              >
                <AppText style={{ color: active ? "#fff" : colors.text }}>
                  {group.name}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ gap: spacing.s }}>
        <AppText style={styles.label}>סטטוסים</AppText>
        <View style={styles.grid}>
          {DEFAULT_REVIEW_STATUSES.map((status) => {
            const active = localFilters.statuses.includes(status);
            return (
              <TouchableOpacity
                key={status}
                onPress={() => toggleStatus(status)}
                style={[
                  styles.chip,
                  active && styles.chipActive,
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

      <PrimaryButton title="התחל" onPress={handleStart} />
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s,
  },
  chip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
