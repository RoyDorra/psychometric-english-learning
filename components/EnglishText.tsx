import { PropsWithChildren } from "react";
import { StyleSheet, Text, TextProps } from "react-native";
import { colors } from "@/src/ui/theme";

type Props = PropsWithChildren<TextProps>;

export default function EnglishText({ children, style, ...rest }: Props) {
  const text =
    typeof children === "string"
      ? `\u2066${children}\u2069`
      : children;

  return (
    <Text
      {...rest}
      style={[styles.text, style]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.text,
    writingDirection: "ltr",
    textAlign: "left",
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 26,
  },
});
