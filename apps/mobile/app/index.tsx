import { Redirect } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useSessionStore } from "../state/useSessionStore";
import { palette } from "../theme";

export default function EntryPoint() {
  const status = useSessionStore((state) => state.status);
  const onboardingCompletedAt = useSessionStore(
    (state) => state.onboardingCompletedAt,
  );
  if (status === "loading") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.accent} size="large" />
      </View>
    );
  }

  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (!onboardingCompletedAt) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/chat" />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.primaryBackground,
  },
});
