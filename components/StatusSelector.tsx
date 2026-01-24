import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  DEFAULT_REVIEW_STATUSES,
  getStatusColor,
  getStatusLabel,
} from "@/src/domain/status";
import { WordStatus } from "@/src/domain/types";
import { colors, radius, spacing } from "@/src/ui/theme";

type Props = {
  value: WordStatus;
  onChange: (status: WordStatus) => void;
  compact?: boolean;
};

export default function StatusSelector({ value, onChange, compact }: Props) {
  return (
    <View style={[styles.container, compact && styles.compact]}>
      {DEFAULT_REVIEW_STATUSES.map((status) => {
        const active = value === status;
        const backgroundColor = active ? getStatusColor(status) : colors.surface;
        const textColor = active ? "#fff" : colors.text;
        return (
          <TouchableOpacity
            key={status}
            onPress={() => onChange(status)}
            style={[
              styles.option,
              { backgroundColor },
              active && styles.active,
            ]}
          >
            <Text style={[styles.text, { color: textColor }]}>
              {getStatusLabel(status)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing.s,
    flexWrap: "wrap",
  },
  compact: {
    gap: spacing.xs,
  },
  option: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.s,
    borderWidth: 1,
    borderColor: colors.border,
  },
  active: {
    borderColor: "transparent",
  },
  text: {
    fontWeight: "600",
    writingDirection: "rtl",
  },
});
