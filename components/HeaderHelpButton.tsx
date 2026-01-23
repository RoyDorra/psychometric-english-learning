import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing } from "../src/ui/theme";

export default function HeaderHelpButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push("/help")}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.text}>איך ללמוד?</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    color: colors.primary,
    fontWeight: "700",
    writingDirection: "rtl",
  },
});
