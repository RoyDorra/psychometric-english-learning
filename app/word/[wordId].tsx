import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import AppText from "@/components/AppText";
import EnglishText from "@/components/EnglishText";
import PrimaryButton from "@/components/PrimaryButton";
import Screen from "@/components/Screen";
import StatusSelector from "@/components/StatusSelector";
import { wordAssociations } from "@/src/navigation/routes";
import { useWords } from "@/src/hooks/useWords";
import { radius, spacing } from "@/src/ui/theme";

export default function WordDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ wordId?: string | string[] }>();
  const wordId = Array.isArray(params.wordId) ? params.wordId[0] : params.wordId;
  const { getWord, statuses, updateStatus } = useWords();

  const word = wordId ? getWord(wordId) : null;
  const status = word ? statuses[word.id] ?? "UNMARKED" : "UNMARKED";

  if (!word) {
    return (
      <Screen withPadding>
        <AppText>המילה לא נמצאה</AppText>
      </Screen>
    );
  }

  return (
    <Screen withPadding>
      <View style={styles.card}>
        <EnglishText style={styles.english}>{word.english}</EnglishText>
        <View style={{ gap: spacing.xs }}>
          {word.hebrewTranslations.map((t) => (
            <AppText key={t} style={styles.translation}>
              {t}
            </AppText>
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.s }}>
        <AppText style={{ fontWeight: "700" }}>סיווג</AppText>
        <StatusSelector value={status} onChange={(next) => updateStatus(word.id, next)} />
      </View>

      <PrimaryButton
        title="אסוציאציות"
        onPress={() => router.push(wordAssociations(word.id))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.s,
    backgroundColor: "#fff",
    padding: spacing.l,
    borderRadius: radius.m,
  },
  english: {
    fontSize: 24,
    fontWeight: "800",
  },
  translation: {
    fontSize: 18,
  },
});
