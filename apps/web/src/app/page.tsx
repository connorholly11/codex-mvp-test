import { LandingHero } from "@/components/landing/landing-hero";

export default function Home() {
  return (
    <div className="flex flex-col gap-12">
      <LandingHero />

      <section className="grid gap-6 md:grid-cols-3">
        {PANELS.map((panel) => (
          <div
            key={panel.title}
            className="rounded-2xl border border-border bg-surface-muted p-6 text-sm text-muted shadow-sm"
          >
            <h2 className="mb-3 text-base font-semibold text-foreground">
              {panel.title}
            </h2>
            <p>{panel.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

const PANELS = [
  {
    title: "Supabase-backed foundation",
    body: "Onboarding progress, chat sessions, quests, and reports now persist to Supabase so web mirrors the production data model.",
  },
  {
    title: "Anthropic coaching",
    body: "Fermi runs on Claude 3.5 Sonnet with a configurable system prompt for compassionate, direct guidance.",
  },
  {
    title: "Web + iOS parity",
    body: "The Next.js app and the Expo iOS client share the same API layer, keeping messaging and reports consistent across platforms.",
  },
];
