import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack } from 'expo-router';

const INITIAL_MESSAGES = [
  {
    id: 'intro',
    role: 'assistant' as const,
    content: "Hey there, I'm Fermi. Ready to get a read on where you're at today?",
  },
];

type Message = (typeof INITIAL_MESSAGES)[number];

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content:
        "Thanks for sharing. Once the Anthropic integration is wired up, I'll respond with personalised coaching insights here.",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.alignEnd : styles.alignStart]}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser && styles.userText]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: 'Chat with Fermi' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={96}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message to Fermi"
            placeholderTextColor="rgba(255,255,255,0.6)"
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            activeOpacity={0.8}
          >
            <Text style={styles.sendLabel}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PRIMARY_BG = '#070609';
const SURFACE = '#15161E';
const ACCENT = '#5d1bed';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PRIMARY_BG,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PRIMARY_BG,
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
  messageText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
    fontWeight: '600',
  },
  composer: {
    marginTop: 12,
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
  sendLabel: {
    color: '#fff',
    fontWeight: '600',
  },
});
