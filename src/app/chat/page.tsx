import { Metadata } from "next";
import { ChatRoot } from "@/features/chat/components/chat-root";

export const metadata: Metadata = {
  title: "Purpose Chat Prototype",
};

export default function ChatPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <ChatRoot />
    </div>
  );
}
