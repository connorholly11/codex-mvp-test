import { logEvent } from "@purpose/analytics";
import {
  fetchChatHistory,
  parsePersonalInsightsReport,
  streamChatMessage,
  type AssistantMessageMetadata,
  type AssistantToolCall,
  type ChatMessage,
  type GetLocationToolCall,
  type Json,
  type PersonalInsightsReport,
  type ScheduleReminderToolCall,
  type StartTimerToolCall,
  type SaveNoteToolCall,
  type CreateIcsEventToolCall,
} from "@purpose/api-client";
import { useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { animateLayout } from "../../lib/animation";
import {
  hapticImpactLight,
  hapticImpactMedium,
  hapticNotificationError,
  hapticNotificationSuccess,
} from "../../lib/haptics";
import {
  executeTool,
  isSupportedTool,
  ToolExecutionError,
} from "../../lib/tools-adapter";
import {
  formatEventWindow,
  formatReminderTarget,
  formatTimerDuration,
} from "../../lib/time";
import { supabase } from "../../lib/supabase";
import { useSessionStore } from "../../state/useSessionStore";
import { palette } from "../../theme";

type ToolExecutionStatus = "confirmed" | "dismissed";

type UiMessage = ChatMessage & {
  pending?: boolean;
  localToolStatus?: ToolExecutionStatus;
};

type PendingTool = {
  messageId: string;
  tool: AssistantToolCall;
};

function getTimeOfDayGreeting(now: Date) {
  const hour = now.getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 17) {
    return "Good afternoon";
  }
  return "Good evening";
}

function buildHeroTitle(displayName: string | null) {
  const greeting = getTimeOfDayGreeting(new Date());
  if (!displayName) {
    return `${greeting}!`;
  }
  const name = displayName.split(" ")[0];
  return `${greeting}, ${name}`;
}

const ENCOURAGEMENTS = [
  "Tiny shifts lead to wild momentum.",
  "Every question is data Fermi can reuse.",
  "Clarity loves consistent curiosity.",
  "Capture what feels true right now.",
];

function pickEncouragement(displayName: string | null) {
  const base = displayName?.length ?? 0;
  const index = (base + new Date().getDate()) % ENCOURAGEMENTS.length;
  return ENCOURAGEMENTS[index];
}

function deriveToolStatus(
  metadata?: AssistantMessageMetadata | null,
): ToolExecutionStatus | null {
  const status = metadata?.tool_call?.result?.status;
  if (status === "confirmed" || status === "dismissed") {
    return status;
  }
  return null;
}

function parseIsoDate(value: string): Date | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function isScheduleReminderTool(tool: AssistantToolCall): tool is ScheduleReminderToolCall {
  return tool.name === "schedule_reminder" && tool.validation.valid === true;
}

function isGetLocationTool(tool: AssistantToolCall): tool is GetLocationToolCall {
  return tool.name === "get_location" && tool.validation.valid === true;
}

function isStartTimerTool(tool: AssistantToolCall): tool is StartTimerToolCall {
  return tool.name === "start_timer" && tool.validation.valid === true;
}

function isSaveNoteTool(tool: AssistantToolCall): tool is SaveNoteToolCall {
  return tool.name === "save_note" && tool.validation.valid === true;
}

function isCreateIcsEventTool(tool: AssistantToolCall): tool is CreateIcsEventToolCall {
  return tool.name === "create_ics_event" && tool.validation.valid === true;
}

type ToolCopy = {
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  highlight?: string;
  footnote?: string;
};

function truncate(text: string, limit = 140): string {
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit - 3)}...`;
}

function getToolCopy(tool: AssistantToolCall): ToolCopy {
  if (isScheduleReminderTool(tool)) {
    const reminderDate = parseIsoDate(tool.args.iso_datetime);
    const timeLabel = reminderDate
      ? formatReminderTarget(reminderDate)
      : tool.args.iso_datetime;

    return {
      title: "Schedule this reminder?",
      description:
        "Fermi will set a one-time reminder on your device for the time you confirm.",
      highlight: `Target time: ${timeLabel}`,
      primaryCta: "Schedule reminder",
      secondaryCta: "Not now",
      footnote: "Reminders stay on this device and never touch our servers.",
    };
  }

  if (isStartTimerTool(tool)) {
    const highlightParts = [
      `Duration: ${formatTimerDuration(tool.args.duration_seconds)}`,
      tool.args.label ? `Label: ${tool.args.label}` : null,
    ].filter(Boolean) as string[];

    return {
      title: "Start this timer?",
      description:
        "Fermi can keep a countdown in the background and ping you when time is up.",
      highlight: highlightParts.join("\n"),
      primaryCta: "Start timer",
      secondaryCta: "Cancel",
      footnote: "Timers rely on local notifications and respect your focus settings.",
    };
  }

  if (isGetLocationTool(tool)) {
    return {
      title: "Share your city?",
      description:
        "Fermi will pull your coarse city and region to tailor the guidance.",
      highlight: "No precise coordinates are stored—ever.",
      primaryCta: "Share city",
      secondaryCta: "Keep private",
      footnote: "You can revoke access later in system Settings.",
    };
  }

  if (isSaveNoteTool(tool)) {
    const lines: string[] = [];
    if (tool.args.title) {
      lines.push(`Title: ${tool.args.title}`);
    }
    lines.push(`Preview: ${truncate(tool.args.body)}`);

    return {
      title: "Save this note?",
      description:
        "The note stays private to you. We'll sync it later if you're online.",
      highlight: lines.join("\n"),
      primaryCta: "Save note",
      secondaryCta: "Skip",
      footnote: "You can revisit saved notes from your profile soon.",
    };
  }

  if (isCreateIcsEventTool(tool)) {
    const startDate = parseIsoDate(tool.args.start_iso);
    const eventWindow = startDate
      ? formatEventWindow(startDate, tool.args.duration_minutes)
      : `${tool.args.start_iso} (${tool.args.duration_minutes} min)`;

    return {
      title: "Create calendar file?",
      description:
        "Fermi will generate a downloadable .ics file so you can add it anywhere.",
      highlight: `Event: ${eventWindow}`,
      primaryCta: "Create .ics file",
      secondaryCta: "Maybe later",
      footnote: "You'll choose where to add the event once the share sheet opens.",
    };
  }

  return {
    title: "Run this action?",
    description: "Fermi has a suggestion ready for your device.",
    primaryCta: "Confirm",
    secondaryCta: "Not now",
  };
}

export default function ChatScreen() {
  const navigation = useNavigation();
  const accessToken = useSessionStore((state) => state.accessToken);
  const displayName = useSessionStore((state) => state.displayName);
  const userId = useSessionStore((state) => state.userId);
  const setProfile = useSessionStore((state) => state.setProfile);

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [report, setReport] = useState<PersonalInsightsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [pendingTool, setPendingTool] = useState<PendingTool | null>(null);
  const [handledTools, setHandledTools] = useState<Record<string, ToolExecutionStatus>>({});
  const toolSeenRef = useRef(new Set<string>());
  const [isExecutingTool, setIsExecutingTool] = useState(false);
  const [toolError, setToolError] = useState<string | null>(null);

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
        setChatSessionId(history.chatSessionId);

        const historyHandled: Record<string, ToolExecutionStatus> = {};
        history.messages.forEach((message) => {
          const status = deriveToolStatus(message.metadata);
          if (status) {
            historyHandled[message.id] = status;
            toolSeenRef.current.add(message.id);
          }
        });

        setHandledTools((current) => ({ ...current, ...historyHandled }));
        setMessages(
          history.messages.map((message) => ({
            ...message,
            localToolStatus: historyHandled[message.id],
          })),
        );
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
    if (isExecutingTool || pendingTool) {
      return;
    }

    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message.role !== "assistant") {
        continue;
      }
      const toolCandidate = message.metadata?.tool_call;
      if (!toolCandidate || toolCandidate.validation?.valid !== true) {
        continue;
      }
      if (!isSupportedTool(toolCandidate)) {
        continue;
      }
      if (deriveToolStatus(message.metadata)) {
        continue;
      }
      if (handledTools[message.id]) {
        continue;
      }
      if (toolSeenRef.current.has(message.id)) {
        continue;
      }

      toolSeenRef.current.add(message.id);
      animateLayout();
      setPendingTool({ messageId: message.id, tool: toolCandidate });
      setToolError(null);
      logEvent("chat_tool_proposed", { name: toolCandidate.name });
      break;
    }
  }, [handledTools, isExecutingTool, messages, pendingTool]);

  useEffect(() => {
    return () => {
      streamAbortController.current?.abort();
    };
  }, []);

  const heroTitle = useMemo(
    () => buildHeroTitle(displayName),
    [displayName],
  );
  const heroSubtitle = useMemo(
    () => pickEncouragement(displayName),
    [displayName],
  );
  const hasMessages = messages.length > 0;
  const isAssistantResponding = messages.some((message) => message.pending);

  const markToolStatus = useCallback(
    async (
      messageId: string,
      tool: AssistantToolCall,
      status: ToolExecutionStatus,
      context?: Record<string, unknown>,
    ) => {
      const timestamp = new Date().toISOString();
      let metadataForServer: AssistantMessageMetadata | null = null;

      animateLayout();

      setMessages((prev) =>
        prev.map((message) => {
          if (message.id !== messageId) {
            return message;
          }

          const nextMetadata: AssistantMessageMetadata = {
            ...(message.metadata ?? {}),
            tool_call: {
              ...tool,
              result: {
                status,
                timestamp,
                context,
              },
            },
          };

          metadataForServer = nextMetadata;

          return {
            ...message,
            metadata: nextMetadata,
            localToolStatus: status,
          };
        }),
      );

      setHandledTools((prev) => ({ ...prev, [messageId]: status }));

      if (!metadataForServer) {
        metadataForServer = {
          tool_call: {
            ...tool,
            result: {
              status,
              timestamp,
              context,
            },
          },
        };
      }

      if (!chatSessionId || !userId || !metadataForServer) {
        return;
      }

      const { data, error } = await supabase
        .from("chat_messages")
        .update({ metadata: metadataForServer as Json })
        .eq("id", messageId)
        .eq("session_id", chatSessionId)
        .select("metadata")
        .single();

      if (error) {
        console.warn("Failed to persist tool status", error);
        return;
      }

      if (data?.metadata) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId
              ? {
                  ...message,
                  metadata: (data.metadata as AssistantMessageMetadata) ?? null,
                }
              : message,
          ),
        );
      }
    },
    [chatSessionId, supabase, userId],
  );

  const persistToolConfirmation = useCallback(
    async (
      tool: AssistantToolCall,
      content: string,
      context?: Record<string, unknown>,
    ) => {
      const timestamp = new Date().toISOString();
      const metadata: AssistantMessageMetadata = {
        tool_call_confirmation: {
          name: tool.name,
          ...context,
        },
      };

      if (!chatSessionId || !userId) {
        animateLayout();
        setMessages((prev) => [
          ...prev,
          {
            id: `local-system-${Date.now()}`,
            role: "system",
            content,
            createdAt: timestamp,
            metadata,
          },
        ]);
        return;
      }

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          user_id: userId,
          session_id: chatSessionId,
          role: "system",
          content,
          metadata: metadata as Json,
        })
        .select("id, created_at, metadata")
        .single();

      if (error) {
        console.warn("Failed to persist tool confirmation", error);
        animateLayout();
        setMessages((prev) => [
          ...prev,
          {
            id: `local-system-${Date.now()}`,
            role: "system",
            content,
            createdAt: timestamp,
            metadata,
          },
        ]);
        return;
      }

      animateLayout();
      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          role: "system",
          content,
          createdAt: data.created_at,
          metadata: (data.metadata as AssistantMessageMetadata | null) ?? metadata,
        },
      ]);
    },
    [chatSessionId, supabase, userId],
  );

  const handleDismissTool = useCallback(async () => {
    if (!pendingTool) {
      return;
    }

    const { messageId, tool } = pendingTool;
    setPendingTool(null);
    setToolError(null);
    hapticImpactLight();
    await markToolStatus(messageId, tool, "dismissed", {
      reason: "user_dismissed",
    });
    logEvent("chat_tool_dismissed", { name: tool.name });
  }, [markToolStatus, pendingTool]);

  const handleConfirmTool = useCallback(async () => {
    if (!pendingTool) {
      return;
    }

    const { messageId, tool } = pendingTool;
    setIsExecutingTool(true);
    setToolError(null);

    try {
      const result = await executeTool(tool);

      await persistToolConfirmation(
        tool,
        result.confirmationText,
        result.metadataContext,
      );

      await markToolStatus(messageId, tool, "confirmed", result.metadataContext);

      logEvent("chat_tool_confirmed", {
        name: tool.name,
        ...(result.analyticsPayload ?? {}),
      });

      setPendingTool(null);
      setToolError(null);
      hapticNotificationSuccess();
    } catch (toolErr) {
      const executionError = toolErr instanceof ToolExecutionError ? toolErr : null;
      const message =
        executionError?.message ??
        (toolErr instanceof Error
          ? toolErr.message
          : "Unable to complete that action right now.");
      const code = executionError?.code ?? "unknown";

      if (executionError?.code === "validation_error") {
        await markToolStatus(messageId, tool, "dismissed", {
          reason: "invalid_tool_payload",
          message,
        });
        setPendingTool(null);
        setToolError(null);
      } else {
        if (tool.name === "get_location" && code === "permission_denied") {
          Alert.alert("Location permission needed", message);
        }
        if (
          (tool.name === "schedule_reminder" || tool.name === "start_timer") &&
          code === "permission_denied"
        ) {
          Alert.alert("Enable notifications", message);
        }
        if (tool.name === "create_ics_event" && code === "share_unavailable") {
          Alert.alert("Sharing unavailable", message);
        }

        setToolError(message);
      }

      logEvent("chat_tool_failed", {
        name: tool.name,
        code,
        message,
      });
      hapticNotificationError();
    } finally {
      setIsExecutingTool(false);
    }
  }, [markToolStatus, pendingTool, persistToolConfirmation]);

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
                      metadata: metadata ?? null,
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
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>
        </View>
        {report ? <ReportCard report={report} /> : null}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={palette.accent} />
          </View>
        ) : hasMessages ? (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatBubble message={item} />}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <EmptyState />
        )}
        {error ? <Text style={styles.chatError}>{error}</Text> : null}
        {pendingTool ? (
          <ToolCallCard
            tool={pendingTool.tool}
            isExecuting={isExecutingTool}
            error={toolError}
            onConfirm={handleConfirmTool}
            onDismiss={handleDismissTool}
          />
        ) : null}
        {isAssistantResponding ? <TypingIndicator /> : null}
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

type ToolCallCardProps = {
  tool: AssistantToolCall;
  isExecuting: boolean;
  error: string | null;
  onConfirm: () => void;
  onDismiss: () => void;
};

function ToolCallCard({ tool, isExecuting, error, onConfirm, onDismiss }: ToolCallCardProps) {
  const copy = useMemo(() => getToolCopy(tool), [tool]);

  return (
    <View style={styles.toolCard}>
      <Text style={styles.toolLabel}>Coach suggestion</Text>
      <Text style={styles.toolTitle}>{copy.title}</Text>
      <Text style={styles.toolDescription}>{copy.description}</Text>
      {copy.highlight ? (
        <Text style={styles.toolDetail}>{copy.highlight}</Text>
      ) : null}
      {error ? <Text style={styles.toolError}>{error}</Text> : null}
      {copy.footnote ? (
        <Text style={styles.toolFootnote}>{copy.footnote}</Text>
      ) : null}
      <View style={styles.toolActions}>
        <TouchableOpacity
          style={[styles.toolPrimaryButton, isExecuting && styles.toolButtonDisabled]}
          onPress={onConfirm}
          disabled={isExecuting}
          activeOpacity={0.85}
        >
          <Text style={styles.toolPrimaryLabel}>
            {isExecuting ? "Working..." : copy.primaryCta}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolSecondaryButton, isExecuting && styles.toolButtonDisabled]}
          onPress={onDismiss}
          disabled={isExecuting}
          activeOpacity={0.75}
        >
          <Text style={styles.toolSecondaryLabel}>{copy.secondaryCta}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingDot} />
      <View style={styles.typingDot} />
      <View style={styles.typingDot} />
      <Text style={styles.typingCopy}>Fermi is reflecting…</Text>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>Let’s start the conversation</Text>
      <Text style={styles.emptyBody}>
        Share something you’re navigating or ask “What pattern do you notice
        about me?” Fermi adapts with every message you send.
      </Text>
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
  heroCard: {
    borderRadius: 28,
    backgroundColor: palette.surfaceElevated,
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    gap: 6,
  },
  heroTitle: {
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: "700",
  },
  heroSubtitle: {
    color: palette.textSecondary,
    fontSize: 14,
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
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
    backgroundColor: palette.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: palette.borderMuted,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: palette.accent,
    opacity: 0.7,
  },
  typingCopy: {
    color: palette.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  emptyState: {
    borderRadius: 24,
    backgroundColor: palette.surface,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.textPrimary,
  },
  emptyBody: {
    fontSize: 14,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  toolCard: {
    borderRadius: 20,
    backgroundColor: palette.surfaceElevated,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    padding: 18,
    gap: 12,
  },
  toolLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: palette.accent,
  },
  toolTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.textPrimary,
  },
  toolDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary,
  },
  toolDetail: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.textPrimary,
    backgroundColor: palette.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: palette.borderMuted,
  },
  toolError: {
    fontSize: 13,
    color: palette.error,
  },
  toolFootnote: {
    fontSize: 12,
    lineHeight: 18,
    color: palette.textMuted,
  },
  toolActions: {
    flexDirection: "row",
    gap: 10,
  },
  toolPrimaryButton: {
    flex: 1,
    backgroundColor: palette.accent,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  toolPrimaryLabel: {
    color: palette.textInverted,
    fontWeight: "600",
  },
  toolSecondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.borderMuted,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: palette.surface,
  },
  toolSecondaryLabel: {
    color: palette.textPrimary,
    fontWeight: "600",
  },
  toolButtonDisabled: {
    opacity: 0.6,
  },
});
