import { PropsWithChildren } from "react";
import { StyleSheet, Text, TextProps } from "react-native";
import { colors } from "../src/ui/theme";

type Props = PropsWithChildren<TextProps>;

export default function AppText({ children, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[styles.text, style]}
      allowFontScaling
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.text,
    writingDirection: "rtl",
    textAlign: "right",
    fontSize: 16,
  },
});
