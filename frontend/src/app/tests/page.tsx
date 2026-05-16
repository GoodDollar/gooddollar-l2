import registry from '@/lib/tests/e2eRegistry.json'

export const metadata = {
  title: 'E2E Tests',
  description: 'Versioned Playwright E2E coverage for GoodDollar L2 apps.',
}

const apps = registry.apps
const criticalCount = apps.filter((app) => app.critical).length

export default function TestsPage() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <section className="rounded-3xl border border-goodgreen/20 bg-goodgreen/5 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-goodgreen">GoodDollar L2 QA</p>
            <h1 className="mt-3 text-3xl font-bold text-white">E2E Test Registry</h1>
            <p className="mt-3 max-w-2xl text-sm text-gray-300">
              Versioned, browsable Playwright automation for every GoodDollar L2 app route. This page is published at
              {' '}<span className="font-mono text-goodgreen">goodclaw.org/tests</span> and mirrors the source-controlled registry.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-700/30 bg-dark-100 p-4 text-sm">
            <div className="text-gray-400">Version</div>
            <div className="font-mono text-white">{registry.version}</div>
            <div className="mt-3 text-gray-400">Coverage</div>
            <div className="font-mono text-white">{apps.length} routes · {criticalCount} critical</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-700/30 bg-dark-100 p-5">
          <div className="text-sm text-gray-400">Playwright config</div>
          <div className="mt-2 break-all font-mono text-sm text-white">{registry.playwright.config}</div>
        </div>
        <div className="rounded-2xl border border-gray-700/30 bg-dark-100 p-5 sm:col-span-2">
          <div className="text-sm text-gray-400">Sequential command</div>
          <code className="mt-2 block whitespace-pre-wrap rounded-xl bg-black/30 p-3 text-xs text-goodgreen">
            {registry.playwright.command}
          </code>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">App coverage</h2>
          <a className="text-sm text-goodgreen hover:underline" href="https://goodswap.goodclaw.org/tests">
            App mirror →
          </a>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apps.map((app) => (
            <article key={app.id} className="rounded-2xl border border-gray-700/30 bg-dark-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{app.name}</h3>
                  <a href={app.route} className="mt-1 block font-mono text-xs text-goodgreen hover:underline">
                    {app.route}
                  </a>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${app.critical ? 'bg-goodgreen/10 text-goodgreen' : 'bg-gray-700/30 text-gray-300'}`}>
                  {app.critical ? 'critical' : app.kind}
                </span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                {app.assertions.map((assertion) => (
                  <li key={assertion} className="flex gap-2">
                    <span className="text-goodgreen">✓</span>
                    <span>{assertion}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 text-xs text-gray-500">Owner: {app.owner}</div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
