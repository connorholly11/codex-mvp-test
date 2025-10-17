import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { palette } from "../../theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.primaryBackground },
        headerTintColor: palette.textPrimary,
        headerTitleStyle: { fontWeight: "600" },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.borderMuted,
        },
      }}
    >
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="chatbubble-ellipses" size={size} />
          ),
          title: "Chat",
        }}
      />
      <Tabs.Screen
        name="quests"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="checkmark-circle" size={size} />
          ),
          title: "Quests",
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="trending-up" size={size} />
          ),
          title: "Journey",
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="document-text" size={size} />
          ),
          title: "Reports",
        }}
      />
    </Tabs>
  );
}
