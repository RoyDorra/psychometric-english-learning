import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/src/hooks/useAuth";
import { AssociationsProvider } from "@/src/hooks/useAssociations";
import { WordProvider } from "@/src/hooks/useWords";
import HeaderHelpButton from "@/components/HeaderHelpButton";
import { colors } from "@/src/ui/theme";

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const inAuthGroup = segments[0] === "(auth)";

  useEffect(() => {
    if (isLoading) return;
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)/words");
    }
  }, [session, inAuthGroup, isLoading, router, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="help" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen
        name="word/[wordId]"
        options={{
          title: "מילה",
          headerShown: true,
          headerTitleAlign: "center",
          headerBackButtonDisplayMode: "minimal",
          headerRight: () => <HeaderHelpButton />,
        }}
      />
      <Stack.Screen
        name="word/[wordId]/associations"
        options={{
          title: "אסוציאציות",
          headerShown: true,
          headerTitleAlign: "center",
          headerBackButtonDisplayMode: "minimal",
          headerRight: () => <HeaderHelpButton />,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <WordProvider>
            <AssociationsProvider>
              <RootLayoutNav />
            </AssociationsProvider>
          </WordProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
