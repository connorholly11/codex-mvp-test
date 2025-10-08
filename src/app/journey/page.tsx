import { Metadata } from "next";
import { JourneyRoot } from "@/features/journey/components/journey-root";

export const metadata: Metadata = {
  title: "Purpose Journey Prototype",
};

export default function JourneyPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <JourneyRoot />
    </div>
  );
}
