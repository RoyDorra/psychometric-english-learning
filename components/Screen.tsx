import { PropsWithChildren } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, View } from "react-native";
import { colors, spacing } from "@/src/ui/theme";

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
      <View style={styles.background}>
        <View style={styles.blobA} />
        <View style={styles.blobB} />
        <View style={styles.blobC} />
      </View>
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
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  blobA: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#ede9fe",
    top: -80,
    left: -60,
    opacity: 0.8,
  },
  blobB: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#cffafe",
    bottom: -60,
    right: -40,
    opacity: 0.7,
  },
  blobC: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#fef9c3",
    top: 140,
    right: 40,
    opacity: 0.6,
  },
});
