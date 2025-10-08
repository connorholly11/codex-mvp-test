import { Metadata } from "next";
import { PersonalInsightsViewer } from "@/features/reports/components/personal-insights-viewer";

export const metadata: Metadata = {
  title: "Personal Insights Report",
};

export default function PersonalInsightsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <PersonalInsightsViewer />
    </div>
  );
}
