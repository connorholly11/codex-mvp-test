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

function isSameDay(dateString: string, now = new Date()) {
  const target = new Date(dateString);
  return (
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()
  );
}

type MomentumItem = { title: string; detail: string; complete: boolean };

type MomentumCardProps = {
  items: MomentumItem[];
  latestReflection: string | null;
};

export default function JourneyScreen() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const initializeQuests = useQuestsStore((state) => state.initialize);
  const questResponses = useQuestsStore((state) => state.responses);
  const questsLoading = useQuestsStore((state) => state.isLoading);
  const questsError = useQuestsStore((state) => state.error);

  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [hasChattedToday, setHasChattedToday] = useState(false);
  const [latestReflection, setLatestReflection] = useState<string | null>(null);
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
        const userMessages = messages.filter((message) => message.role === "user");
        setUserMessageCount(userMessages.length);
        setHasChattedToday(
          userMessages.some((message) => isSameDay(message.createdAt)),
        );

        const lastAssistant = [...messages]
          .reverse()
          .find((message) => message.role === "assistant");
        if (lastAssistant?.content) {
          const snippet = lastAssistant.content
            .split("\n")
            .map((line) => line.trim())
            .find((line) => line.length > 0);
          setLatestReflection(snippet ?? null);
        } else {
          setLatestReflection(null);
        }

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
  const questsCompletedToday = useMemo(
    () =>
      questResponses.filter((response) => isSameDay(response.completedAt)).length,
    [questResponses],
  );

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

  const momentumItems = useMemo<MomentumItem[]>(
    () => [
      {
        title: "Capture today’s quest",
        detail: questsCompletedToday > 0 ? "Logged for today" : "2 minutes",
        complete: questsCompletedToday > 0,
      },
      {
        title: "Check in with Fermi",
        detail: hasChattedToday ? "Already reflected today" : "Send one insight",
        complete: hasChattedToday,
      },
      {
        title: "Clarify your constraint",
        detail: reportSummary.constraint
          ? "Constraint is defined"
          : "Add it via your reflections",
        complete: Boolean(reportSummary.constraint),
      },
    ],
    [hasChattedToday, questsCompletedToday, reportSummary.constraint],
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
          <MomentumCard
            items={momentumItems}
            latestReflection={latestReflection}
          />
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

function MomentumCard({ items, latestReflection }: MomentumCardProps) {
  return (
    <View style={styles.momentumCard}>
      <Text style={styles.momentumLabel}>Daily momentum</Text>
      <Text style={styles.momentumTitle}>Keep your Purpose streak alive</Text>
      <View style={styles.momentumList}>
        {items.map((item) => (
          <View key={item.title} style={styles.momentumRow}>
            <View
              style={[
                styles.momentumStatus,
                item.complete && styles.momentumStatusComplete,
              ]}
            >
              <Text
                style={[
                  styles.momentumStatusLabel,
                  item.complete && styles.momentumStatusLabelComplete,
                ]}
              >
                {item.complete ? "Done" : "Next"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.momentumItemTitle}>{item.title}</Text>
              <Text style={styles.momentumItemDetail}>{item.detail}</Text>
            </View>
          </View>
        ))}
      </View>
      {latestReflection ? (
        <View style={styles.momentumReflection}>
          <Text style={styles.momentumReflectionLabel}>Latest reflection</Text>
          <Text style={styles.momentumReflectionCopy}>
            “{latestReflection.trim()}…”
          </Text>
        </View>
      ) : null}
    </View>
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
    lineHeight: 21,
    color: palette.textMuted,
  },
  momentumCard: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    gap: 16,
  },
  momentumLabel: {
    textTransform: "uppercase",
    fontSize: 11,
    letterSpacing: 1.2,
    color: palette.textMuted,
    fontWeight: "600",
  },
  momentumTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.textPrimary,
  },
  momentumList: {
    gap: 12,
  },
  momentumRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  momentumStatus: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    backgroundColor: palette.surfaceMuted,
  },
  momentumStatusComplete: {
    backgroundColor: palette.accentSoft,
    borderColor: palette.accentSoft,
  },
  momentumStatusLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.textMuted,
  },
  momentumStatusLabelComplete: {
    color: palette.accent,
  },
  momentumItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: palette.textPrimary,
  },
  momentumItemDetail: {
    fontSize: 13,
    color: palette.textMuted,
  },
  momentumReflection: {
    borderTopWidth: 1,
    borderTopColor: palette.borderMuted,
    paddingTop: 16,
    gap: 6,
  },
  momentumReflectionLabel: {
    fontSize: 12,
    color: palette.textMuted,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  momentumReflectionCopy: {
    fontSize: 14,
    color: palette.textSecondary,
    fontStyle: "italic",
    lineHeight: 20,
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
