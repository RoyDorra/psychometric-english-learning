import { Stack } from "expo-router";
import HeaderHelpButton from "@/components/HeaderHelpButton";

export default function WordsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerBackButtonDisplayMode: "minimal",
        headerRight: () => <HeaderHelpButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: "מילים" }} />
      <Stack.Screen name="[groupId]" options={{ title: "קבוצת מילים" }} />
      <Stack.Screen name="word/[wordId]" options={{ title: "מילה" }} />
      <Stack.Screen
        name="word/[wordId].associations"
        options={{ title: "אסוציאציות" }}
      />
    </Stack>
  );
}
