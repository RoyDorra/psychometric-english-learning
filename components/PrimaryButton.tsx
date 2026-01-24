import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import { colors, radius, spacing } from "@/src/ui/theme";

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
}: Props) {
  const isDisabled = disabled || loading;
  const containerStyle: ViewStyle[] = [styles.button];
  if (isDisabled) containerStyle.push(styles.disabled);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={containerStyle}
      >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.m,
    borderRadius: radius.m,
    alignItems: "center",
    shadowColor: "#1e1b4b",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  disabled: {
    backgroundColor: colors.primaryMuted,
    shadowOpacity: 0,
  },
  text: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    writingDirection: "rtl",
  },
});
