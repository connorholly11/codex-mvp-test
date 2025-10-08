import { Metadata } from "next";
import { AnalyticsInspector } from "@/features/debug/components/analytics-inspector";

export const metadata: Metadata = {
  title: "Analytics Inspector",
};

export default function AnalyticsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <AnalyticsInspector />
    </div>
  );
}
