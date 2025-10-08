import { Metadata } from "next";
import { OnboardingRoot } from "@/features/onboarding/components/onboarding-root";

export const metadata: Metadata = {
  title: "Purpose Onboarding Prototype",
};

export default function OnboardingPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 rounded-3xl border border-border bg-surface p-10">
      <OnboardingRoot />
    </div>
  );
}
