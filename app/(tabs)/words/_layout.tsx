import { Stack } from "expo-router";
import HeaderBackButton from "@/components/HeaderBackButton";
import HeaderHelpButton from "@/components/HeaderHelpButton";

export default function WordsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerBackButtonDisplayMode: "minimal",
        headerLeft: () => <HeaderBackButton />,
        headerRight: () => <HeaderHelpButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: "מילים" }} />
      <Stack.Screen name="[groupId]" options={{ title: "קבוצת מילים" }} />
      <Stack.Screen
        name="word/[wordId]/associations"
        options={{ title: "אסוציאציות" }}
      />
      <Stack.Screen name="word/[wordId]" options={{ title: "מילה" }} />
    </Stack>
  );
}
