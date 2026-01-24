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
    </Stack>
  );
}
