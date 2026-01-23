import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, StyleSheet, View } from "react-native";
import AppText from "../../../components/AppText";
import Screen from "../../../components/Screen";
import WordRow from "../../../components/WordRow";
import { useWords } from "../../../src/hooks/useWords";
import { spacing } from "../../../src/ui/theme";

export default function GroupWordsScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { getWordsForGroup, statuses } = useWords();

  const id = Number(groupId);
  const words = getWordsForGroup(id);

  return (
    <Screen withPadding>
      <View style={styles.header}>
        <AppText style={styles.title}>קבוצה {id}</AppText>
        <AppText style={styles.subtitle}>
          {words.length} מילים
        </AppText>
      </View>
      <FlatList
        data={words}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.s }}
        renderItem={({ item }) => (
          <WordRow
            word={item}
            status={statuses[item.id]}
            onPress={() => router.push(`/(tabs)/words/${item.id}`)}
          />
        )}
      />
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
    color: "#475569",
  },
});
