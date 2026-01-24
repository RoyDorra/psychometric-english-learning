import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "@/src/ui/theme";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarStyle: { flexDirection: "row-reverse" },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#94a3b8",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
          headerShown: false,
          title: "",
        }}
      />
      <Tabs.Screen
        name="words"
        options={{
          title: "מילים",
          tabBarLabel: "מילים",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: "למידה",
          tabBarLabel: "למידה",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: "שינון",
          tabBarLabel: "שינון",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flash" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
