import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import AppText from "@/components/AppText";
import Screen from "@/components/Screen";
import WordRow from "@/components/WordRow";
import { wordDetails } from "@/src/navigation/routes";
import { useWords } from "@/src/hooks/useWords";
import { spacing } from "@/src/ui/theme";

export default function GroupWordsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { groupId } = useLocalSearchParams<{ groupId?: string | string[] }>();
  const { getWordsForGroup, groups, statuses, updateStatus } = useWords();

  const resolvedGroupId = Array.isArray(groupId) ? groupId[0] : groupId;
  const group = groups.find((item) => item.id === resolvedGroupId);
  const groupName = group?.name ?? "קבוצת מילים";
  const words = resolvedGroupId ? getWordsForGroup(resolvedGroupId) : [];

  useEffect(() => {
    navigation.setOptions({ title: groupName });
  }, [groupName, navigation]);

  return (
    <Screen withPadding>
      <View style={styles.header}>
        <AppText style={styles.title}>{groupName}</AppText>
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
            onPress={() => router.push(wordDetails(item.id))}
            onStatusChange={(next) => updateStatus(item.id, next)}
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
