import { useEffect, useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  fetchChatHistory,
  sendChatMessage,
  type ChatMessage,
  type PersonalInsightsReport,
} from '@purpose/api-client';
import { supabase } from '../lib/supabase';
import { useSessionStore } from '../state/useSessionStore';

const PRIMARY_BG = '#070609';
const SURFACE = '#15161E';
const ACCENT = '#5d1bed';

export default function ScreenRouter() {
  const status = useSessionStore((state) => state.status);

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.safeAreaCentered}>
        <ActivityIndicator color={ACCENT} size="large" />
      </SafeAreaView>
    );
  }

  if (status === 'unauthenticated') {
    return <AuthScreen />;
  }

  return <ChatScreen />;
}

function AuthScreen() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [stage, setStage] = useState<'collect-email' | 'verify'>('collect-email');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendLink = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Enter your email to continue.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          shouldCreateUser: true,
        },
      });
      setStage('verify');
      setStatusMessage('Check your email for a 6-digit code and enter it below.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedToken = token.trim();
    if (!trimmedToken) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: trimmedToken,
        type: 'email',
      });
      setStatusMessage('Signed in successfully. Loading chat…');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaCentered}>
      <Stack.Screen options={{ title: 'Sign in to Purpose' }} />
      <View style={styles.authCard}>
        <Text style={styles.authTitle}>Access Purpose</Text>
        <Text style={styles.authSubtitle}>
          Enter your email to receive a one-time code. No passwords—just compassionate coaching.
        </Text>
        <TextInput
          style={styles.authInput}
          placeholder="you@example.com"
          placeholderTextColor="rgba(255,255,255,0.5)"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          editable={!isSubmitting}
        />
        {stage === 'verify' ? (
          <TextInput
            style={styles.authInput}
            placeholder="6-digit code"
            placeholderTextColor="rgba(255,255,255,0.5)"
            keyboardType="number-pad"
            autoCapitalize="none"
            autoCorrect={false}
            value={token}
            onChangeText={setToken}
            maxLength={6}
            editable={!isSubmitting}
          />
        ) : null}
        {statusMessage ? <Text style={styles.authStatus}>{statusMessage}</Text> : null}
        {error ? <Text style={styles.authError}>{error}</Text> : null}
        <TouchableOpacity
          style={styles.authButton}
          onPress={stage === 'collect-email' ? handleSendLink : handleVerify}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Text style={styles.authButtonLabel}>
            {isSubmitting
              ? 'Working…'
              : stage === 'collect-email'
                ? 'Send magic code'
                : 'Verify and continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

type UiMessage = ChatMessage & { pending?: boolean };

function ChatScreen() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const displayName = useSessionStore((state) => state.displayName);
  const setDisplayName = useSessionStore((state) => state.setDisplayName);

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [report, setReport] = useState<PersonalInsightsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setError(null);

    fetchChatHistory({ accessToken })
      .then((history) => {
        if (!isActive) return;
        setMessages(history.messages.map((message) => ({ ...message })));
        const content = history.report?.content as PersonalInsightsReport | undefined;
        setReport(content ?? null);
        if (history.profile?.display_name) {
          setDisplayName(history.profile.display_name);
        }
      })
      .catch((err) => {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : 'Failed to load chat history.');
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [accessToken, setDisplayName]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !accessToken || isSending) {
      return;
    }

    setInput('');
    setIsSending(true);
    const now = new Date().toISOString();
    const tempUserId = `temp-user-${Date.now()}`;
    const tempAssistantId = `temp-assistant-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: tempUserId,
        role: 'user',
        content: trimmed,
        createdAt: now,
      },
      {
        id: tempAssistantId,
        role: 'assistant',
        content: '…',
        createdAt: now,
        pending: true,
      },
    ]);

    try {
      const response = await sendChatMessage(trimmed, { accessToken });
      setMessages((prev) =>
        prev.map((message) => {
          if (message.id === tempUserId) {
            return {
              ...message,
              id: response.userMessage.id,
              createdAt: response.userMessage.createdAt,
            };
          }
          if (message.id === tempAssistantId) {
            return {
              ...message,
              id: response.assistantMessage.id,
              createdAt: response.assistantMessage.createdAt,
              content: response.assistantMessage.content,
              metadata: response.assistantMessage.metadata ?? undefined,
              pending: false,
            };
          }
          return message;
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
      setMessages((prev) =>
        prev.map((message) =>
          message.id === tempAssistantId
            ? {
                ...message,
                pending: false,
                content: 'I hit a snag replying. Try again in a moment.',
              }
            : message,
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  const headerSubtitle = useMemo(() => {
    if (!displayName) {
      return 'Prototype mobile chat';
    }
    return `Chatting as ${displayName}`;
  }, [displayName]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: 'Chat with Fermi',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => supabase.auth.signOut()}
              style={styles.signOutButton}
            >
              <Text style={styles.signOutLabel}>Sign out</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={96}
      >
        <View style={styles.chatHeader}>
          <Text style={styles.chatTitle}>Chat with Fermi</Text>
          <Text style={styles.chatSubtitle}>{headerSubtitle}</Text>
        </View>
        {report ? <ReportCard report={report} /> : null}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={ACCENT} />
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
            style={[styles.sendButton, (isSending || !input.trim()) && styles.sendButtonDisabled]}
            onPress={handleSend}
            activeOpacity={0.8}
            disabled={isSending || !input.trim()}
          >
            <Text style={styles.sendLabel}>{isSending ? 'Sending…' : 'Send'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.messageRow, isUser ? styles.alignEnd : styles.alignStart]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          message.pending && styles.pendingBubble,
        ]}
      >
        <Text style={[styles.messageText, isUser && styles.userText]}>{message.content}</Text>
      </View>
    </View>
  );
}

function ReportCard({ report }: { report: PersonalInsightsReport }) {
  const summary = report.summary;
  const topValue = summary?.topValueLabel;
  const growthArea = summary?.growthAreaLabel;
  const constraint = summary?.constraint;

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
        <Text style={styles.reportItem}>• Primary constraint: {constraint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PRIMARY_BG,
  },
  safeAreaCentered: {
    flex: 1,
    backgroundColor: PRIMARY_BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PRIMARY_BG,
    gap: 12,
  },
  chatHeader: {
    gap: 4,
  },
  chatTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  chatSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 16,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
  },
  alignEnd: {
    justifyContent: 'flex-end',
  },
  alignStart: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: ACCENT,
  },
  assistantBubble: {
    backgroundColor: SURFACE,
  },
  pendingBubble: {
    opacity: 0.6,
  },
  messageText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    fontWeight: '600',
  },
  composer: {
    borderRadius: 24,
    backgroundColor: SURFACE,
    padding: 12,
    gap: 12,
  },
  input: {
    minHeight: 44,
    color: '#fff',
    fontSize: 16,
  },
  sendButton: {
    alignSelf: 'flex-end',
    backgroundColor: ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatError: {
    color: '#f87171',
    textAlign: 'center',
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  signOutLabel: {
    color: '#fff',
    fontSize: 12,
  },
  reportCard: {
    borderRadius: 20,
    backgroundColor: SURFACE,
    padding: 16,
    gap: 6,
  },
  reportTitle: {
    color: '#fff',
    fontWeight: '600',
  },
  reportItem: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  authCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: SURFACE,
    padding: 24,
    borderRadius: 24,
    gap: 16,
  },
  authTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  authSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  authInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  authStatus: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  authError: {
    color: '#f87171',
    fontSize: 12,
  },
  authButton: {
    backgroundColor: ACCENT,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  authButtonLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
