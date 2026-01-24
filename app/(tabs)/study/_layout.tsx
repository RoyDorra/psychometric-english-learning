import { Stack } from "expo-router";
import HeaderBackButton from "@/components/HeaderBackButton";
import HeaderHelpButton from "@/components/HeaderHelpButton";

export default function StudyLayout() {
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
      <Stack.Screen name="index" options={{ title: "למידה" }} />
      <Stack.Screen name="[groupId]/setup" options={{ title: "הגדרות למידה" }} />
      <Stack.Screen name="[groupId]/pager" options={{ title: "למידה" }} />
    </Stack>
  );
}
