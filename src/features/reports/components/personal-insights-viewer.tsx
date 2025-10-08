'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/store/use-onboarding-store';
import { useSessionStore } from '@/store/use-session-store';
import { buildPersonalInsightsReport } from '@/lib/reports';
import { logEvent } from '@/lib/analytics';

export function PersonalInsightsViewer() {
  const router = useRouter();
  const data = useOnboardingStore((state) => state.data);
  const user = useSessionStore((state) => state.user);

  const isReady = Boolean(user?.legalAcceptedAt);

  useEffect(() => {
    if (!isReady) {
      router.replace('/onboarding');
    } else {
      logEvent('report_viewed', { reportId: 'personal-insights' });
    }
  }, [isReady, router]);

  if (!isReady) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-8 text-sm text-muted sm:rounded-3xl sm:p-10">
        Redirecting to onboarding…
      </div>
    );
  }

  const report = buildPersonalInsightsReport(data);

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-2 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Personal report
        </span>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{report.title}</h1>
        <p className="text-sm text-muted">{report.openingInsight}</p>
      </header>
      <div className="flex flex-col gap-6">
        {report.sections.map((section) => (
          <section
            key={section.id}
            className="rounded-2xl border border-border bg-surface-muted px-5 py-6 shadow-sm sm:rounded-3xl sm:p-6"
          >
            <h2 className="mb-3 text-xl font-semibold text-foreground">{section.title}</h2>
            <MarkdownText content={section.content} />
          </section>
        ))}
      </div>
    </article>
  );
}

function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n\n');
  return (
    <div className="flex flex-col gap-3 text-sm text-muted">
      {lines.map((line, index) => {
        const key = `${line}-${index}`;
        if (line.startsWith('**') && line.includes('**', 2)) {
          const withoutStars = line.replace(/\*\*/g, '');
          const [label, rest] = withoutStars.split(': ');
          if (rest) {
            return (
              <p key={key}>
                <span className="font-semibold text-foreground">{label}: </span>
                {rest}
              </p>
            );
          }
        }
        if (line.startsWith('*')) {
          return (
            <ul key={key} className="list-disc pl-6 text-muted">
              <li>{line.replace(/^\*\s*/, '')}</li>
            </ul>
          );
        }
        return (
          <p key={key} className="leading-6 text-muted">
            {line}
          </p>
        );
      })}
    </div>
  );
}
