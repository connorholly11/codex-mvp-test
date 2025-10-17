import { logEvent } from "@purpose/analytics";
import {
  fetchChatHistory,
  parsePersonalInsightsReport,
} from "@purpose/api-client";
import { Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { animateLayout } from "../../lib/animation";
import { hapticImpactLight, hapticNotificationError } from "../../lib/haptics";
import { useQuestsStore } from "../../state/useQuestsStore";
import { useSessionStore } from "../../state/useSessionStore";
import { palette } from "../../theme";

export default function JourneyScreen() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const initializeQuests = useQuestsStore((state) => state.initialize);
  const questResponses = useQuestsStore((state) => state.responses);
  const questsLoading = useQuestsStore((state) => state.isLoading);
  const questsError = useQuestsStore((state) => state.error);

  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [reportSummary, setReportSummary] = useState<{
    topValue: string | null;
    constraint: string | null;
  }>({
    topValue: null,
    constraint: null,
  });

  useEffect(() => {
    logEvent("journey_viewed");
  }, []);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    initializeQuests(accessToken).catch((error) => {
      console.error("Failed to initialize quests", error);
      hapticNotificationError();
    });
  }, [accessToken, initializeQuests]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    setIsLoadingChat(true);
    setChatError(null);
    fetchChatHistory({ accessToken })
      .then((history) => {
        animateLayout();
        const messages = history.messages ?? [];
        setUserMessageCount(
          messages.filter((message) => message.role === "user").length,
        );
        const parsed = history.report?.content
          ? parsePersonalInsightsReport(history.report.content)
          : null;
        setReportSummary({
          topValue: parsed?.summary.topValueLabel ?? null,
          constraint: parsed?.summary.constraint ?? null,
        });
        if (parsed) {
          hapticImpactLight();
        }
      })
      .catch((error) => {
        console.error("Failed to fetch chat history for journey", error);
        hapticNotificationError();
        setChatError(
          error instanceof Error
            ? error.message
            : "Unable to load chat insights.",
        );
      })
      .finally(() => {
        setIsLoadingChat(false);
      });
  }, [accessToken]);

  const questsCompleted = questResponses.length;

  const achievements = useMemo(
    () => [
      {
        title: "Quests completed",
        value: questsCompleted,
        description:
          questsCompleted > 0
            ? "Keep the cadence going."
            : "Daily quests await.",
      },
      {
        title: "Chat exchanges",
        value: userMessageCount,
        description:
          userMessageCount > 0
            ? "Fermi is learning your patterns."
            : "Say hi to Fermi in chat.",
      },
      {
        title: "Primary constraint",
        value: reportSummary.constraint ? "Captured" : "Not yet",
        description:
          reportSummary.constraint ??
          "Name the pattern slowing you down to sharpen coaching.",
      },
    ],
    [questsCompleted, reportSummary.constraint, userMessageCount],
  );

  const isLoading = questsLoading || isLoadingChat;
  const error = questsError ?? chatError;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Your journey" }} />
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={palette.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Journey overview</Text>
            <Text style={styles.sectionTitle}>
              Track how Purpose evolves with you
            </Text>
            <Text style={styles.sectionBody}>
              We track momentum across quests, chats, and insights so you can
              see progress at a glance.
            </Text>
          </View>
          <View style={styles.metricsGrid}>
            {achievements.map((achievement) => (
              <View key={achievement.title} style={styles.metricCard}>
                <Text style={styles.metricLabel}>{achievement.title}</Text>
                <Text style={styles.metricValue}>{achievement.value}</Text>
                <Text style={styles.metricDescription}>
                  {achievement.description}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Insights archive</Text>
            <Text style={styles.sectionTitle}>Reports generated so far</Text>
            <Text style={styles.sectionBody}>
              Visit the Reports tab to read your Personal Insights in full. New
              summaries will appear here as we ship them.
            </Text>
            <View style={styles.reportCard}>
              <Text style={styles.reportTitle}>Personal Insights Report</Text>
              <Text style={styles.reportSummary}>
                {reportSummary.topValue
                  ? `North-star value: ${reportSummary.topValue}`
                  : "Generated after your onboarding assessment."}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.primaryBackground,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorText: {
    color: palette.error,
    fontSize: 14,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    color: palette.textMuted,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: palette.textPrimary,
  },
  sectionBody: {
    fontSize: 14,
    color: palette.textMuted,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    flexBasis: "48%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    backgroundColor: palette.surface,
    padding: 16,
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.textMuted,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    color: palette.textPrimary,
  },
  metricDescription: {
    fontSize: 13,
    color: palette.textMuted,
  },
  reportCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    backgroundColor: palette.surface,
    gap: 6,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.textPrimary,
  },
  reportSummary: {
    fontSize: 13,
    color: palette.textMuted,
  },
});
