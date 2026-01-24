import { useRouter } from "expo-router";
import { useEffect } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import AppText from "@/components/AppText";
import BuddyCard from "@/components/BuddyCard";
import PrimaryButton from "@/components/PrimaryButton";
import Screen from "@/components/Screen";
import { wordsGroup } from "@/src/navigation/routes";
import { useWords } from "@/src/hooks/useWords";
import { colors, radius, spacing } from "@/src/ui/theme";

export default function WordsHomeScreen() {
  const router = useRouter();
  const { groups, helpSeen, markHelpSeen, loading, getWordsForGroup, statuses } = useWords();

  useEffect(() => {
    if (!loading && !helpSeen) {
      router.push("/help");
      markHelpSeen();
    }
  }, [helpSeen, loading, markHelpSeen, router]);

  return (
    <Screen withPadding>
      <View style={styles.headerRow}>
        <AppText style={styles.title}>קבוצות מילים</AppText>
      </View>
      <View style={{ marginBottom: spacing.m }}>
        <BuddyCard
          known={groups.reduce((acc, group) => {
            const list = getWordsForGroup(group.id);
            return acc + list.filter((w) => statuses[w.id] === "KNOW").length;
          }, 0)}
          total={groups.reduce((acc, group) => acc + getWordsForGroup(group.id).length, 0)}
        />
      </View>
      <FlatList
        data={groups}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ gap: spacing.m }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(wordsGroup(item.id))} style={styles.card}>
            <AppText style={styles.cardTitle}>{item.name}</AppText>
            <AppText style={styles.cardSubtitle}>כניסה לקבוצה</AppText>
          </TouchableOpacity>
        )}
      />
      <PrimaryButton title="עבור ללמידה" onPress={() => router.push("/(tabs)/study")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.m,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.l,
    borderRadius: radius.m,
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
