'use client';

import { create } from 'zustand';
import type { ChatMessage } from '@purpose/api-client';

type UiChatMessage = ChatMessage & { pending?: boolean };

type ChatStoreState = {
  sessionId: string | null;
  messages: UiChatMessage[];
  setSessionId: (sessionId: string | null) => void;
  setMessages: (messages: UiChatMessage[]) => void;
  appendMessage: (message: UiChatMessage) => void;
  updateMessage: (id: string, patch: Partial<UiChatMessage>) => void;
  clear: () => void;
};

export const useChatStore = create<ChatStoreState>((set) => ({
  sessionId: null,
  messages: [],
  setSessionId: (sessionId) => set({ sessionId }),
  setMessages: (messages) => set({ messages }),
  appendMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, patch) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, ...patch } : message,
      ),
    })),
  clear: () => set({ messages: [] }),
}));
