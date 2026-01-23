import { PropsWithChildren } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, View } from "react-native";
import { colors, spacing } from "../src/ui/theme";

type Props = PropsWithChildren<{
  scrollable?: boolean;
  withPadding?: boolean;
}>;

export default function Screen({
  children,
  scrollable = false,
  withPadding = true,
}: Props) {
  const content = (
    <View
      style={[
        styles.body,
        withPadding && styles.padding,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {scrollable ? (
        <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    writingDirection: "rtl",
  },
  padding: {
    padding: spacing.l,
    gap: spacing.m,
  },
  scroll: {
    paddingBottom: spacing.xl,
  },
});
