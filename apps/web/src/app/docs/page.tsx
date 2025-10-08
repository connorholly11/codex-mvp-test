import fs from 'node:fs/promises';
import path from 'node:path';

export default async function DocsPage() {
  const specPath = path.join(process.cwd(), 'docs', 'WEB_SPEC.md');
  const spec = await fs.readFile(specPath, 'utf-8');

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Web specification</h1>
        <p className="max-w-2xl text-sm text-muted">
          This view surfaces the current working spec for the browser-based Purpose
          prototype. Content is read directly from <code>docs/WEB_SPEC.md</code> so edits in
          the repository stay in sync with the product experience.
        </p>
      </header>
      <article className="rounded-2xl border border-border bg-surface px-4 py-5 sm:rounded-3xl sm:p-6">
        <pre className="whitespace-pre-wrap text-sm leading-6 text-muted">
          {spec}
        </pre>
      </article>
    </div>
  );
}
