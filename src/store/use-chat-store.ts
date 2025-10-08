'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  pending?: boolean;
  metadata?: Record<string, unknown>;
};

type ChatStoreState = {
  messages: ChatMessage[];
  appendMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  clear: () => void;
};

const STORE_KEY = 'purpose-chat-history-v1';

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set) => ({
      messages: [],
      appendMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      updateMessage: (id, patch) =>
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === id ? { ...message, ...patch } : message,
          ),
        })),
      clear: () => set({ messages: [] }),
    }),
    {
      name: STORE_KEY,
      version: 1,
    },
  ),
);
