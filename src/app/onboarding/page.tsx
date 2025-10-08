import { Metadata } from "next";
import { OnboardingRoot } from "@/features/onboarding/components/onboarding-root";

export const metadata: Metadata = {
  title: "Purpose Onboarding Prototype",
};

export default function OnboardingPage() {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-surface px-4 py-6 sm:rounded-3xl sm:px-8 sm:py-8 md:px-10">
      <OnboardingRoot />
    </div>
  );
}
