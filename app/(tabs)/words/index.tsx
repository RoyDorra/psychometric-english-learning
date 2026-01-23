import { useRouter } from "expo-router";
import { useEffect } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import AppText from "../../../components/AppText";
import PrimaryButton from "../../../components/PrimaryButton";
import Screen from "../../../components/Screen";
import { useWords } from "../../../src/hooks/useWords";
import { rowDirection } from "../../../src/ui/rtl";
import { colors, radius, spacing } from "../../../src/ui/theme";

export default function WordsHomeScreen() {
  const router = useRouter();
  const { groups, helpSeen, markHelpSeen, loading } = useWords();

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
      <FlatList
        data={groups}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ gap: spacing.m }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(tabs)/words/${item.id}`)}
            style={styles.card}
          >
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
    flexDirection: rowDirection,
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
