'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser-client';
import { useSessionStore } from '@/store/use-session-store';
import type { OnboardingStepComponentProps } from '@/features/onboarding/types';

function validateEmail(value: string): boolean {
  return /.+@.+\..+/.test(value.trim());
}

export function AccountStep({ onBack, onContinue }: OnboardingStepComponentProps) {
  const user = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);
  const updateUser = useSessionStore((state) => state.updateUser);

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [name, setName] = useState(user?.displayName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [linkSent, setLinkSent] = useState(false);
  const [sessionReady, setSessionReady] = useState(Boolean(user));
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }
      const session = data.session;
      if (!session?.user) {
        return;
      }

      const fullName = (session.user.user_metadata?.full_name as string | undefined) ?? null;
      setName((current) => current || fullName || session.user.email || '');
      setEmail((current) => current || session.user.email || '');

      const nextUser = {
        id: session.user.id,
        email: session.user.email ?? '',
        displayName: fullName ?? session.user.email ?? '',
        legalAcceptedAt: user?.legalAcceptedAt ?? null,
      } as const;

      if (!user) {
        setUser(nextUser);
      } else {
        updateUser(nextUser);
      }

      setLinkSent(true);
      setSessionReady(true);
      setStatusMessage('Email confirmed. You can continue.');
    });
    return () => {
      active = false;
    };
  }, [setUser, supabase, updateUser, user]);

  const canContinue = useMemo(() => {
    return name.trim().length >= 2 && validateEmail(email);
  }, [name, email]);

  const handleSubmit = async () => {
    if (!canContinue) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!linkSent) {
      setIsLoading(true);
      setStatusMessage(null);
      setSessionReady(false);
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setIsLoading(false);

      if (error) {
        setStatusMessage(error.message);
        return;
      }

      setLinkSent(true);
      setStatusMessage('Magic link sent. Check your email, open the link, then return here.');
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      setStatusMessage(error.message);
      setIsLoading(false);
      return;
    }

    const session = data.session;
    if (!session?.user) {
      setStatusMessage('Still waiting for confirmation. Click the magic link in your email.');
      setIsLoading(false);
      return;
    }

    await supabase.auth.updateUser({
      data: { full_name: trimmedName },
    });

    const nextUser = {
      id: session.user.id,
      email: session.user.email ?? trimmedEmail,
      displayName: trimmedName,
      legalAcceptedAt: user?.legalAcceptedAt ?? null,
    } as const;

    if (!user) {
      setUser(nextUser);
    } else {
      updateUser(nextUser);
    }

      setIsLoading(false);
      setSessionReady(true);
      setStatusMessage(null);
      onContinue();
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    if (linkSent && !sessionReady) {
      setLinkSent(false);
      setSessionReady(false);
      setStatusMessage(null);
    }
    setEmail(next);
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Almost there
        </p>
        <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Create your account</h2>
        <p className="text-sm text-muted">
          We’ll send a one-time magic link to verify your email. After you open it, come back
          here to continue the assessment.
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

        {statusMessage ? <p className="text-sm text-muted">{statusMessage}</p> : null}
      </form>

      <footer className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex w-full items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto"
          >
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canContinue || isLoading}
          className="inline-flex w-full items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isLoading
            ? 'Working…'
            : linkSent
              ? sessionReady
                ? 'Continue'
                : 'I opened the magic link'
              : 'Send magic link'}
        </button>
      </footer>
    </div>
  );
}
