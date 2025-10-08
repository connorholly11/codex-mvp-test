import { Metadata } from "next";
import { QuestsRoot } from "@/features/quests/components/quests-root";

export const metadata: Metadata = {
  title: "Purpose Quests Prototype",
};

export default function QuestsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <QuestsRoot />
    </div>
  );
}
