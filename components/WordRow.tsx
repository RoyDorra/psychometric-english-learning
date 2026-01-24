import { getStatusColor } from "@/src/domain/status";
import { Word, WordStatus } from "@/src/domain/types";
import { colors, radius, spacing } from "@/src/ui/theme";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import AppText from "./AppText";
import EnglishText from "./EnglishText";

type Props = {
  word: Word;
  status?: WordStatus;
  onPress: () => void;
  onStatusChange: (status: WordStatus) => void;
};

const STATUS_BUTTONS: WordStatus[] = ["DONT_KNOW", "PARTIAL", "KNOW"];

export default function WordRow({
  word,
  status,
  onPress,
  onStatusChange,
}: Props) {
  const currentStatus = status ?? "UNMARKED";
  const indicatorColor = getStatusColor(currentStatus);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
      <View style={styles.content}>
        <EnglishText style={styles.english}>{word.english}</EnglishText>
        <AppText style={styles.hebrew}>
          {word.hebrewTranslations.join(" / ")}
        </AppText>
        <View style={styles.statusButtonsRow}>
          {STATUS_BUTTONS.map((value) => {
            const active = currentStatus === value;
              const activeColor =
              value === "PARTIAL" ? "#f59e0b" : getStatusColor(value);
            return (
              <TouchableOpacity
                key={value}
                onPress={() => onStatusChange(active ? "UNMARKED" : value)}
                hitSlop={8}
                style={[
                  styles.statusButton,
                  {
                    backgroundColor: active
                      ? activeColor
                      : `${getStatusColor(value)}25`,
                  },
                  active
                    ? styles.statusButtonActive
                    : styles.statusButtonInactive,
                ]}
              />
            );
          })}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#1e1b4b",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  indicator: {
    width: 8,
    height: "100%",
    borderRadius: radius.s,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  english: {
    fontSize: 18,
    fontWeight: "700",
  },
  hebrew: {
    color: colors.muted,
  },
  statusButtonsRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: spacing.xs,
  },
  statusButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
  },
  statusButtonInactive: {
    opacity: 0.5,
    borderColor: `${colors.border}`,
  },
  statusButtonActive: {
    opacity: 1,
    borderColor: "transparent",
  },
});
