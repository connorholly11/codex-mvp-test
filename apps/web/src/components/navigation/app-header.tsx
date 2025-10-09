'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/use-session-store';
import { useChatStore } from '@/store/use-chat-store';
import { useOnboardingStore } from '@/store/use-onboarding-store';
import { useQuestsStore } from '@/store/use-quests-store';
import { usePrototypeSettings } from '@/store/use-prototype-settings';
import { clearEvents } from '@/lib/analytics';

const NAV_LINKS = [
  { href: '/chat', label: 'Chat', gated: true },
  { href: '/quests', label: 'Quests', gated: true },
  { href: '/journey', label: 'Journey', gated: true },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSessionStore((state) => state.user);
  const hasSession = Boolean(user?.legalAcceptedAt);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (href: string, gated: boolean) => {
    if (gated && !hasSession) {
      router.push('/onboarding');
      return;
    }
    router.push(href);
  };

  const handleReset = () => {
    useChatStore.getState().clear();
    useOnboardingStore.getState().reset();
    useQuestsStore.getState().reset();
    useSessionStore.getState().clearUser();
    usePrototypeSettings.getState().reset();
    clearEvents();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Purpose
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const isDisabled = link.gated && !hasSession;
            return (
              <button
                key={link.href}
                type="button"
                onClick={() => handleNav(link.href, link.gated)}
                disabled={isDisabled}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted hover:bg-surface-muted'
                } ${isDisabled ? 'opacity-40' : ''}`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-sm font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            ☰
          </button>
          <Link
            href="/debug/analytics"
            className="hidden rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:inline-flex"
          >
            Analytics
          </Link>
          <button
            type="button"
            onClick={handleReset}
            className="hidden rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent md:inline-flex"
          >
            Reset prototype
          </button>
          {!hasSession ? (
            <Link
              href="/onboarding"
              className="hidden rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-muted md:inline-flex"
            >
              Start assessment
            </Link>
          ) : null}
        </div>
      </div>
      {menuOpen ? (
        <div className="md:hidden">
          <nav className="border-t border-border bg-background/95 backdrop-blur">
            <ul className="flex flex-col gap-2 px-4 py-4">
              {NAV_LINKS.map((link) => {
                const isActive = pathname.startsWith(link.href);
                const isDisabled = link.gated && !hasSession;
                return (
                  <li key={link.href}>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        handleNav(link.href, link.gated);
                      }}
                      disabled={isDisabled}
                      className={`w-full rounded-full px-4 py-2 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted hover:bg-surface-muted'
                      } ${isDisabled ? 'opacity-40' : ''}`}
                    >
                      {link.label}
                    </button>
                  </li>
                );
              })}
              <li>
                <Link
                  href="/debug/analytics"
                  className="inline-flex w-full items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={() => setMenuOpen(false)}
                >
                  Analytics
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleReset();
                  }}
                  className="inline-flex w-full items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Reset prototype
                </button>
              </li>
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
