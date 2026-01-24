import { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "@/src/ui/theme";

type Props = PropsWithChildren<{
  elevated?: boolean;
}>;

export default function ModalSheet({ children, elevated = true }: Props) {
  return (
    <View style={[styles.container, elevated && styles.elevated]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.l,
    borderTopRightRadius: radius.l,
    padding: spacing.l,
    gap: spacing.m,
  },
  elevated: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
});
