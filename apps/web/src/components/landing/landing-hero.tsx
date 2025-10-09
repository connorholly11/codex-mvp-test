'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgeGateDialog } from '@/components/landing/age-gate-dialog';
import { usePrototypeSettings } from '@/store/use-prototype-settings';

export function LandingHero() {
  const router = useRouter();
  const { hasConfirmedAge, confirmAge } = usePrototypeSettings();
  const [ageGateOpen, setAgeGateOpen] = useState(false);

  const handleBegin = () => {
    if (hasConfirmedAge) {
      router.push('/onboarding');
      return;
    }
    setAgeGateOpen(true);
  };

  const handleConfirm = () => {
    confirmAge();
    setAgeGateOpen(false);
    router.push('/onboarding');
  };

  return (
    <>
      <section className="flex flex-col gap-6 rounded-2xl bg-surface px-6 py-8 shadow-lg shadow-black/10 sm:rounded-3xl sm:px-8 sm:py-10 md:p-12">
        <span className="text-sm font-medium uppercase tracking-[0.25em] text-muted">
          MVP Sandbox
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Preview the Purpose coaching experience on the web.
        </h1>
        <p className="max-w-2xl text-lg text-muted">
          This build persists onboarding, chat, and reports to Supabase and streams guidance from Anthropic’s Claude Sonnet.
          Use it to walk through the full flow before we open access more broadly.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={handleBegin}
            className="inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto"
          >
            Start onboarding
          </button>
          <a
            href="/docs"
            className="inline-flex w-full items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto"
          >
            View technical plan
          </a>
        </div>
      </section>

      <AgeGateDialog
        open={ageGateOpen}
        onConfirm={handleConfirm}
        onCancel={() => setAgeGateOpen(false)}
      />
    </>
  );
}
