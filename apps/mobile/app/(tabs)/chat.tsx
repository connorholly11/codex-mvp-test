import { logEvent } from "@purpose/analytics";
import {
  fetchChatHistory,
  parsePersonalInsightsReport,
  streamChatMessage,
  type ChatMessage,
  type PersonalInsightsReport,
} from "@purpose/api-client";
import { useNavigation } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { animateLayout } from "../../lib/animation";
import {
  hapticImpactLight,
  hapticImpactMedium,
  hapticNotificationError,
  hapticNotificationSuccess,
} from "../../lib/haptics";
import { supabase } from "../../lib/supabase";
import { useSessionStore } from "../../state/useSessionStore";
import { palette } from "../../theme";

type UiMessage = ChatMessage & { pending?: boolean };

export default function ChatScreen() {
  const navigation = useNavigation();
  const accessToken = useSessionStore((state) => state.accessToken);
  const displayName = useSessionStore((state) => state.displayName);
  const setProfile = useSessionStore((state) => state.setProfile);

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [report, setReport] = useState<PersonalInsightsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const streamAbortController = useRef<AbortController | null>(null);
  const hasHydrated = useRef(false);

  const handleSignOut = () => {
    hapticImpactLight();
    supabase.auth.signOut().catch((error) => {
      console.error("Failed to sign out", error);
      hapticNotificationError();
    });
  };

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutLabel}>Sign out</Text>
        </TouchableOpacity>
      ),
      title: "Chat with Fermi",
    });
  }, [handleSignOut, navigation]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    fetchChatHistory({ accessToken })
      .then((history) => {
        if (!active) {
          return;
        }

        animateLayout();
        setMessages(history.messages.map((message) => ({ ...message })));
        if (!hasHydrated.current && history.messages.length > 0) {
          hasHydrated.current = true;
          hapticImpactLight();
        }

        const parsedReport = history.report?.content
          ? parsePersonalInsightsReport(history.report.content)
          : null;
        setReport(parsedReport);

        setProfile({
          displayName: history.profile?.display_name ?? null,
          legalAcceptedAt: history.profile?.legal_acceptance_at ?? null,
          onboardingCompletedAt:
            history.profile?.onboarding_completed_at ?? null,
        });
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        hapticNotificationError();
        setError(
          err instanceof Error ? err.message : "Failed to load chat history.",
        );
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, setProfile]);

  useEffect(() => {
    return () => {
      streamAbortController.current?.abort();
    };
  }, []);

  const headerSubtitle = useMemo(() => {
    if (!displayName) {
      return "Prototype mobile chat";
    }
    return `Chatting as ${displayName}`;
  }, [displayName]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !accessToken || isSending) {
      return;
    }

    hapticImpactMedium();
    setInput("");
    setIsSending(true);
    setError(null);
    logEvent("chat_message_sent", { length: trimmed.length });

    streamAbortController.current?.abort();
    const controller = new AbortController();
    streamAbortController.current = controller;

    const tempUserId = `temp-user-${Date.now()}`;
    const tempAssistantId = `temp-assistant-${Date.now()}`;
    const now = new Date().toISOString();

    animateLayout();
    setMessages((prev) => [
      ...prev,
      {
        id: tempUserId,
        role: "user",
        content: trimmed,
        createdAt: now,
      },
      {
        id: tempAssistantId,
        role: "assistant",
        content: "",
        createdAt: now,
        pending: true,
      },
    ]);

    let accumulatedContent = "";

    try {
      await streamChatMessage(
        trimmed,
        {
          onAck: ({ userMessageId, createdAt }) => {
            animateLayout();
            setMessages((prev) =>
              prev.map((message) =>
                message.id === tempUserId
                  ? {
                      ...message,
                      id: userMessageId,
                      createdAt,
                    }
                  : message,
              ),
            );
          },
          onToken: (token) => {
            accumulatedContent += token;
            animateLayout();
            setMessages((prev) =>
              prev.map((message) =>
                message.id === tempAssistantId
                  ? {
                      ...message,
                      content: accumulatedContent,
                    }
                  : message,
              ),
            );
          },
          onFinal: ({ assistantMessageId, createdAt, metadata }) => {
            animateLayout();
            hapticNotificationSuccess();
            setMessages((prev) =>
              prev.map((message) =>
                message.id === tempAssistantId
                  ? {
                      ...message,
                      id: assistantMessageId,
                      createdAt: createdAt ?? message.createdAt,
                      metadata: metadata ?? undefined,
                      pending: false,
                      content:
                        accumulatedContent.length > 0
                          ? accumulatedContent.trim()
                          : message.content,
                    }
                  : message,
              ),
            );
            logEvent("chat_message_completed", {
              assistantMessageId,
              tokens: accumulatedContent.length,
            });
          },
          onDone: () => {
            setIsSending(false);
            streamAbortController.current = null;
          },
          onError: (streamError) => {
            console.error("Streaming error", streamError);
            setError(
              streamError instanceof Error
                ? streamError.message
                : "Chat stream interrupted.",
            );
            logEvent("chat_message_error", {
              message:
                streamError instanceof Error ? streamError.message : "unknown",
            });
            hapticNotificationError();
            animateLayout();
            setMessages((prev) =>
              prev.map((message) =>
                message.id === tempAssistantId
                  ? {
                      ...message,
                      pending: false,
                      content:
                        accumulatedContent.length > 0
                          ? accumulatedContent
                          : "I hit a snag replying. Try again in a moment.",
                    }
                  : message,
              ),
            );
          },
        },
        { accessToken, signal: controller.signal },
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return;
      }
      console.error("Failed to stream chat message", err);
      hapticNotificationError();
      setError(err instanceof Error ? err.message : "Unable to send message.");
      animateLayout();
      setMessages((prev) =>
        prev.map((message) =>
          message.id === tempAssistantId
            ? {
                ...message,
                pending: false,
                content:
                  accumulatedContent.length > 0
                    ? accumulatedContent
                    : "I had trouble responding. Please try again.",
              }
            : message,
        ),
      );
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={96}
      >
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>Chat with Fermi</Text>
          <Text style={styles.chatSubtitle}>{headerSubtitle}</Text>
        </View>
        {report ? <ReportCard report={report} /> : null}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={palette.accent} />
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatBubble message={item} />}
            contentContainerStyle={styles.listContent}
          />
        )}
        {error ? <Text style={styles.chatError}>{error}</Text> : null}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message to Fermi"
            placeholderTextColor="rgba(255,255,255,0.6)"
            multiline
            editable={!isSending && !isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (isSending || !input.trim()) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            activeOpacity={0.8}
            disabled={isSending || !input.trim()}
          >
            <Text style={styles.sendLabel}>
              {isSending ? "Sending..." : "Send"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === "user";
  return (
    <View
      style={[styles.messageRow, isUser ? styles.alignEnd : styles.alignStart]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          message.pending && styles.pendingBubble,
        ]}
      >
        <Text style={[styles.messageText, isUser && styles.userText]}>
          {message.content.trim() || "..."}
        </Text>
      </View>
    </View>
  );
}

function ReportCard({ report }: { report: PersonalInsightsReport }) {
  const topValue = report.summary.topValueLabel;
  const growthArea = report.summary.growthAreaLabel;
  const constraint = report.summary.constraint;

  return (
    <View style={styles.reportCard}>
      <Text style={styles.reportTitle}>Personal Insights</Text>
      {topValue ? (
        <Text style={styles.reportItem}>• North star value: {topValue}</Text>
      ) : null}
      {growthArea ? (
        <Text style={styles.reportItem}>• Growth edge: {growthArea}</Text>
      ) : null}
      {constraint ? (
        <Text style={styles.reportItem}>
          • Primary constraint: {constraint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.primaryBackground,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: palette.primaryBackground,
    gap: 12,
  },
  chatHeader: {
    gap: 4,
  },
  chatTitle: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: "700",
  },
  chatSubtitle: {
    color: palette.textMuted,
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: "row",
  },
  alignEnd: {
    justifyContent: "flex-end",
  },
  alignStart: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: palette.accent,
  },
  assistantBubble: {
    backgroundColor: palette.surfaceMuted,
  },
  pendingBubble: {
    opacity: 0.6,
  },
  messageText: {
    color: palette.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    fontWeight: "600",
    color: palette.textInverted,
  },
  composer: {
    borderRadius: 24,
    backgroundColor: palette.surface,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.borderMuted,
  },
  input: {
    minHeight: 44,
    color: palette.textPrimary,
    fontSize: 16,
  },
  sendButton: {
    alignSelf: "flex-end",
    backgroundColor: palette.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendLabel: {
    color: palette.textInverted,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chatError: {
    color: palette.error,
    textAlign: "center",
  },
  reportCard: {
    borderRadius: 20,
    backgroundColor: palette.surface,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: palette.borderMuted,
  },
  reportTitle: {
    color: palette.textPrimary,
    fontWeight: "600",
  },
  reportItem: {
    color: palette.textMuted,
    fontSize: 13,
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    backgroundColor: palette.surface,
  },
  signOutLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
});
