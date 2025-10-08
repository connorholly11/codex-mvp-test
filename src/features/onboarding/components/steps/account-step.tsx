'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { PrototypeUser, useSessionStore } from '@/store/use-session-store';
import type { OnboardingStepComponentProps } from '@/features/onboarding/types';

function validateEmail(value: string): boolean {
  return /.+@.+\..+/.test(value.trim());
}

export function AccountStep({ onBack, onContinue }: OnboardingStepComponentProps) {
  const user = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);
  const updateUser = useSessionStore((state) => state.updateUser);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  const canContinue = useMemo(() => {
    return name.trim().length >= 2 && validateEmail(email);
  }, [name, email]);

  const handleSubmit = () => {
    if (!canContinue) {
      return;
    }

    const baseUser: PrototypeUser =
      user ?? {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `user-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
      };

    if (!user) {
      setUser({ ...baseUser, name: name.trim(), email: email.trim() });
    } else {
      updateUser({ name: name.trim(), email: email.trim() });
    }

    onContinue();
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Almost there
        </p>
        <h2 className="text-3xl font-semibold text-foreground">Create your prototype account</h2>
        <p className="text-sm text-muted">
          For this internal build we keep the account local to your browser. Share a name and
          email so your insights and conversation history stay organised.
        </p>
      </header>

      <form className="flex flex-col gap-5" onSubmit={(event) => event.preventDefault()}>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-muted">Name</span>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="How should Fermi address you?"
            className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-muted">Email</span>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="name@example.com"
            className="rounded-2xl border border-border bg-surface-muted px-4 py-3 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>
      </form>

      <footer className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canContinue}
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue
        </button>
      </footer>
    </div>
  );
}
