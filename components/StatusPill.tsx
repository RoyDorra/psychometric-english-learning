import { StyleSheet, Text, View } from "react-native";
import { getStatusColor, getStatusLabel } from "@/src/domain/status";
import { WordStatus } from "@/src/domain/types";
import { spacing, radius } from "@/src/ui/theme";

type Props = {
  status: WordStatus;
};

export default function StatusPill({ status }: Props) {
  const color = getStatusColor(status);
  return (
    <View style={[styles.pill, { backgroundColor: `${color}20`, borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{getStatusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: radius.s,
  },
  text: {
    writingDirection: "rtl",
    textAlign: "center",
    fontWeight: "600",
  },
});
