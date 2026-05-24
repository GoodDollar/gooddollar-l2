import e2eRegistry from '@/lib/tests/e2eRegistry.json'
import allTestsRegistry from '@/lib/tests/allTestsRegistry.json'
import artifactRegistry from '@/lib/tests/artifactRegistry.json'

export const metadata = {
  title: 'All Tests',
  description: 'Browsable GoodDollar L2 test inventory: Vitest, Playwright, Foundry, backend services, and quality gates.',
}

type TestCategory = {
  id: string
  title: string
  kind: string
  command: string
  quickCommand?: string
  config?: string
  report?: string
  artifactLinks?: Array<{ label: string; href: string; description?: string }>
  files: string[]
}

const apps = e2eRegistry.apps
const criticalCount = apps.filter((app) => app.critical).length
const categories = allTestsRegistry.categories as TestCategory[]
const totalFiles = allTestsRegistry.summary.files
const playwrightCategory = categories.find((category) => category.id === 'playwright-e2e')

export default function TestsPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <section className="rounded-3xl border border-goodgreen/20 bg-goodgreen/5 p-6 sm:p-8 shadow-[0_24px_80px_rgba(19,198,54,0.10)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-goodgreen">GoodDollar L2 QA</p>
            <h1 className="mt-3 text-3xl font-bold text-white sm:text-5xl">All tests, one page</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-300">
              Full source-controlled test inventory for the GoodDollar L2 repo: frontend Vitest, Playwright browser E2E,
              Foundry contracts, backend service tests, SDK tests, and quality/performance checks.
            </p>
          </div>
          <div className="grid min-w-[280px] grid-cols-2 gap-3 text-sm">
            <Stat label="Total files" value={String(totalFiles)} />
            <Stat label="Playwright" value={String(allTestsRegistry.summary.playwrightSpecs)} />
            <Stat label="Images" value={String(artifactRegistry.summary.playwrightImages)} />
            <Stat label="Tx hashes" value={String(artifactRegistry.summary.transactionHashes)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-white/[0.08] bg-etoro-card p-5">
          <div className="text-sm text-gray-400">Registry</div>
          <div className="mt-2 font-mono text-sm text-white">{allTestsRegistry.version}</div>
          <div className="mt-4 text-sm text-gray-400">Updated</div>
          <div className="mt-2 font-mono text-sm text-white">{allTestsRegistry.updatedAt}</div>
          <div className="mt-4 text-sm text-gray-400">Source root</div>
          <div className="mt-2 break-all font-mono text-xs text-goodgreen">{allTestsRegistry.sourceRoot}</div>
          <div className="mt-4 text-sm text-gray-400">Artifact portal</div>
          <a className="mt-2 block break-all font-mono text-xs text-goodgreen hover:underline" href={artifactRegistry.links.root}>
            {artifactRegistry.links.root}
          </a>
        </div>
        <div className="rounded-2xl border border-white/[0.08] bg-etoro-card p-5">
          <div className="text-sm text-gray-400">Main commands</div>
          <div className="mt-3 grid gap-2">
            {allTestsRegistry.commands.map((item) => (
              <div key={item.label} className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{item.label}</div>
                <code className="mt-1 block whitespace-pre-wrap break-all text-xs text-goodgreen">{item.command}</code>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-goodgreen">Inventory</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Test suites by runner</h2>
          </div>
          <p className="text-sm text-gray-400">Click a suite to see every tracked test file.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {categories.map((category) => (
            <details key={category.id} className="group rounded-2xl border border-white/[0.08] bg-etoro-card p-5 open:border-goodgreen/25">
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-goodgreen">{category.kind}</div>
                    <h3 className="mt-1 text-lg font-semibold text-white">{category.title}</h3>
                    <code className="mt-3 block break-all rounded-xl bg-black/25 p-3 text-xs text-goodgreen">{category.command}</code>
                    {category.quickCommand ? (
                      <code className="mt-2 block break-all rounded-xl bg-black/15 p-3 text-xs text-gray-300">Quick: {category.quickCommand}</code>
                    ) : null}
                    {category.artifactLinks?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {category.artifactLinks.map((link) => (
                          <a
                            key={`${category.id}-${link.href}`}
                            href={link.href}
                            className="rounded-full border border-goodgreen/25 bg-goodgreen/10 px-3 py-1.5 text-xs font-semibold text-goodgreen hover:bg-goodgreen/15"
                            title={link.description}
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-goodgreen/10 px-3 py-1 text-xs font-semibold text-goodgreen">
                    {category.files.length} files
                  </span>
                </div>
              </summary>
              <div className="mt-4 max-h-96 overflow-auto rounded-xl border border-white/[0.06] bg-black/20 p-3">
                <ul className="space-y-1 font-mono text-xs text-gray-300">
                  {category.files.map((file) => (
                    <li key={file} className="break-all">{file}</li>
                  ))}
                </ul>
              </div>
              {category.config || category.report ? (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400">
                  {category.config ? <span>Config: <code className="text-gray-200">{category.config}</code></span> : null}
                  {category.report ? <span>Report: <code className="text-gray-200">{category.report}</code></span> : null}
                </div>
              ) : null}
            </details>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-goodgreen">Playwright route coverage</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">{apps.length} app routes · {criticalCount} critical</h2>
          </div>
          <code className="rounded-xl bg-black/25 px-3 py-2 text-xs text-goodgreen">
            {playwrightCategory?.config ?? e2eRegistry.playwright.config}
          </code>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apps.map((app) => (
            <article key={app.id} className="rounded-2xl border border-white/[0.08] bg-etoro-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{app.name}</h3>
                  <a href={app.route} className="mt-1 block font-mono text-xs text-goodgreen hover:underline">
                    {app.route}
                  </a>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${app.critical ? 'bg-goodgreen/10 text-goodgreen' : 'bg-white/10 text-gray-300'}`}>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-etoro-card p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 font-mono text-2xl font-semibold text-white">{value}</div>
    </div>
  )
}
