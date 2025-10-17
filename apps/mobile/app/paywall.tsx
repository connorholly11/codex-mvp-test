import { Stack } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { animateLayout } from "../lib/animation";
import {
  hapticImpactLight,
  hapticImpactMedium,
  hapticNotificationError,
  hapticNotificationSuccess,
} from "../lib/haptics";
import { useSubscriptionStore } from "../state/useSubscriptionStore";
import { palette } from "../theme";

export default function PaywallScreen() {
  const status = useSubscriptionStore((state) => state.status);
  const trialEndsAt = useSubscriptionStore((state) => state.trialEndsAt);
  const markActive = useSubscriptionStore((state) => state.markActive);
  const reset = useSubscriptionStore((state) => state.reset);
  const refresh = useSubscriptionStore((state) => state.refresh);

  const description = useMemo(() => {
    if (status === "trialing" && trialEndsAt) {
      return `Your 7-day trial ends on ${new Date(trialEndsAt).toLocaleDateString()}. Upgrade to keep chatting without interruption.`;
    }
    if (status === "expired") {
      return "Your trial has ended. Activate a subscription to continue accessing chat, quests, and reports.";
    }
    return "Subscribe to Purpose to unlock the full mobile experience.";
  }, [status, trialEndsAt]);

  const handleMarkActive = async () => {
    hapticImpactMedium();
    try {
      await markActive();
      animateLayout();
      hapticNotificationSuccess();
    } catch (error) {
      console.error("Failed to activate subscription", error);
      hapticNotificationError();
    }
  };

  const handleRefresh = async () => {
    hapticImpactLight();
    try {
      await refresh();
      animateLayout();
      hapticNotificationSuccess();
    } catch (error) {
      console.error("Failed to refresh subscription", error);
      hapticNotificationError();
    }
  };

  const handleReset = async () => {
    hapticImpactLight();
    try {
      await reset();
      animateLayout();
      hapticNotificationSuccess();
    } catch (error) {
      console.error("Failed to reset subscription", error);
      hapticNotificationError();
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Purpose Access" }} />
      <Text style={styles.title}>Unlock Purpose Mobile</Text>
      <Text style={styles.subtitle}>{description}</Text>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleMarkActive}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryLabel}>
            Activate subscription (sandbox)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleRefresh}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryLabel}>Refresh status</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleReset} style={styles.secondaryButton}>
          <Text style={styles.secondaryLabel}>Reset trial state</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.footer}>
        RevenueCat integration will wire these controls to real entitlements.
        This screen simulates paywall decisions during development.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.primaryBackground,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: palette.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.textMuted,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: palette.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryLabel: {
    color: palette.textInverted,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.borderMuted,
  },
  secondaryLabel: {
    color: palette.textPrimary,
    fontWeight: "600",
  },
  footer: {
    marginTop: "auto",
    fontSize: 12,
    color: palette.textMuted,
  },
});
