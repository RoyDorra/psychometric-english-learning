import { useRouter } from "expo-router";
import { FlatList, StyleSheet, TouchableOpacity } from "react-native";
import AppText from "@/components/AppText";
import Screen from "@/components/Screen";
import { studySetup } from "@/src/navigation/routes";
import { useWords } from "@/src/hooks/useWords";
import { colors, radius, spacing } from "@/src/ui/theme";

export default function StudyHomeScreen() {
  const router = useRouter();
  const { groups } = useWords();

  return (
    <Screen withPadding>
      <AppText style={styles.title}>בחרו קבוצה ללמידה</AppText>
      <FlatList
        data={groups}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ gap: spacing.m }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(studySetup(item.id))} style={styles.card}>
            <AppText style={styles.cardTitle}>{item.name}</AppText>
            <AppText style={styles.cardSubtitle}>קבעו גודל מקבץ וסינון</AppText>
          </TouchableOpacity>
        )}
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: colors.muted,
  },
});
