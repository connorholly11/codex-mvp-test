import Link from 'next/link';
import type { OnboardingData } from '@/features/onboarding/types';
import { generatePersonalInsights } from '@/lib/reports';


export function YouReportCard({ data }: { data: OnboardingData }) {
  const summary = generatePersonalInsights(data);

  return (
    <div className="rounded-2xl border border-border bg-surface-muted px-5 py-6 shadow-sm sm:rounded-3xl sm:p-6">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Personal Insights
          </span>
          <h2 className="text-xl font-semibold text-foreground">Your report is ready</h2>
        </div>
        <span className="w-fit rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent">
          Prototype view
        </span>
      </header>
      <div className="flex flex-col gap-4 text-sm text-muted">
        {summary.topValueLabel ? (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Core value focus
            </h3>
            <p className="text-foreground">
              You ranked <strong>{summary.topValueLabel}</strong> as your north star. Expect
              Fermi to anchor plans around this priority.
            </p>
          </div>
        ) : null}
        {summary.growthAreaLabel ? (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Growth edge
            </h3>
            <p className="text-foreground">
              {summary.growthAreaLabel}
              {summary.growthAreaScore ? ` scored ${summary.growthAreaScore}/5.` : '.'} We’ll explore
              micro-quests and reframes to unlock progress here.
            </p>
          </div>
        ) : null}
        {summary.constraint ? (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Primary constraint
            </h3>
            <p className="text-foreground">{summary.constraint}</p>
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex justify-center sm:justify-end">
        <Link
          href="/reports/personal-insights"
          className="inline-flex w-full items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto"
        >
          Open full report
        </Link>
      </div>
    </div>
  );
}

