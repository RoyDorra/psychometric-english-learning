import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Word, WordStatus } from "../src/domain/types";
import { rowDirection } from "../src/ui/rtl";
import { colors, radius, spacing } from "../src/ui/theme";
import AppText from "./AppText";
import EnglishText from "./EnglishText";

type Props = {
  word: Word;
  status?: WordStatus;
  onPress: () => void;
};

export default function WordRow({ word, status, onPress }: Props) {
  const indicatorColor = status
    ? {
        UNMARKED: "#9ca3af",
        DONT_KNOW: "#ef4444",
        PARTIAL: "#facc15",
        KNOW: "#22c55e",
      }[status]
    : colors.border;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={[styles.indicator, { backgroundColor: indicatorColor }]} />
      <View style={styles.texts}>
        <EnglishText style={styles.english}>{word.english}</EnglishText>
        <AppText style={styles.hebrew}>
          {word.hebrewTranslations.join(" / ")}
        </AppText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: rowDirection,
    alignItems: "center",
    gap: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  indicator: {
    width: 10,
    height: "100%",
    borderRadius: radius.s,
  },
  texts: {
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
});
