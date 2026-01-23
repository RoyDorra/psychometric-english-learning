import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { ltrTextBase, rowDirection, rtlTextBase } from "../src/ui/rtl";
import { colors, radius, spacing } from "../src/ui/theme";
import AppText from "./AppText";

type Props = {
  label: string;
  error?: string | null;
  secureTextEntry?: boolean;
  textDirection?: "ltr" | "rtl";
} & TextInputProps;

export default function TextField({
  label,
  error,
  secureTextEntry,
  textDirection = "rtl",
  ...rest
}: Props) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const showToggle = secureTextEntry;
  const directionStyles = textDirection === "rtl" ? rtlTextBase : ltrTextBase;

  return (
    <View style={styles.container}>
      <AppText style={styles.label}>{label}</AppText>
      <View style={styles.inputRow}>
        <TextInput
          {...rest}
          style={[
            styles.input,
            showToggle && styles.inputWithToggle,
            directionStyles,
          ]}
          secureTextEntry={hidden}
          placeholderTextColor={colors.muted}
        />
        {showToggle && (
          <TouchableOpacity
            onPress={() => setHidden((v) => !v)}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>{hidden ? "הצג" : "הסתר"}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: rowDirection,
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.m,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    fontSize: 16,
  },
  inputWithToggle: {
    paddingStart: spacing.xl + spacing.s,
  },
  toggle: {
    position: "absolute",
    start: spacing.s,
    padding: spacing.s,
  },
  toggleText: {
    color: colors.primary,
    fontWeight: "700",
    writingDirection: "rtl",
  },
  error: {
    color: colors.danger,
    writingDirection: "rtl",
    textAlign: "right",
  },
});
