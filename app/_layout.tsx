import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import HeaderHelpButton from "../components/HeaderHelpButton";
import { AuthProvider, useAuth } from "../src/hooks/useAuth";
import { AssociationsProvider } from "../src/hooks/useAssociations";
import { WordProvider } from "../src/hooks/useWords";
import { colors } from "../src/ui/theme";

function RootLayoutNav() {
  const { session, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const inAuthGroup = segments[0] === "(auth)";

  useEffect(() => {
    if (initializing) return;
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)/words");
    }
  }, [session, inAuthGroup, initializing, router, segments]);

  if (initializing) {
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
        headerTitleAlign: "center",
        headerRight: () => <HeaderHelpButton />,
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="help"
        options={{ title: "איך ללמוד?", presentation: "modal" }}
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
