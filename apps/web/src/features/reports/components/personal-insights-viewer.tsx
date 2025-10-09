'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchChatHistory } from '@purpose/api-client';
import { logEvent } from '@/lib/analytics';
import {
  parsePersonalInsightsReport,
  type PersonalInsightsReport,
} from '@/lib/reports';

export function PersonalInsightsViewer() {
  const router = useRouter();
  const [report, setReport] = useState<PersonalInsightsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReport() {
      try {
        const history = await fetchChatHistory();
        if (!active) {
          return;
        }

        const content = history.report?.content
          ? parsePersonalInsightsReport(history.report.content)
          : null;

        if (!content) {
          router.replace('/onboarding');
          return;
        }

        setReport(content);
        setIsLoading(false);
        logEvent('report_viewed', { reportId: 'personal-insights' });
      } catch (error) {
        if (!active) {
          return;
        }
        console.error('Failed to load personal insights report', error);
        setError('Unable to load your report right now. Please try again later.');
        setIsLoading(false);
      }
    }

    loadReport();

    return () => {
      active = false;
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-8 text-sm text-muted sm:rounded-3xl sm:p-10">
        Loading your report…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-8 text-center text-sm text-muted sm:rounded-3xl sm:p-10">
        {error}
      </div>
    );
  }

  if (!report) {
    return null;
  }

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
