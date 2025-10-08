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
    title: "Local-first foundation",
    body: "Persist onboarding progress, chat history, and reports in local storage so the prototype mirrors a full product flow without external infrastructure.",
  },
  {
    title: "Anthropic-ready",
    body: "The only required environment variable will be the Anthropic API key, keeping integration friction low while allowing realistic coaching conversations.",
  },
  {
    title: "Feature-parity roadmap",
    body: "Onboarding, chat, quests, and insights map directly to the mobile spec so we can evaluate the web UX quickly and iterate in place.",
  },
];
