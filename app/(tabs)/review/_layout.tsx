import { Stack } from "expo-router";
import HeaderHelpButton from "@/components/HeaderHelpButton";

export default function ReviewLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerBackButtonDisplayMode: "minimal",
        headerRight: () => <HeaderHelpButton />,
      }}
    >
      <Stack.Screen name="index" options={{ title: "שינון" }} />
      <Stack.Screen name="player" options={{ title: "שינון" }} />
    </Stack>
  );
}
