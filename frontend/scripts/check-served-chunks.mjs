#!/usr/bin/env node
/**
 * Runtime probe: verify that the JS/CSS chunks the LIVE PM2-managed Next.js
 * process is referencing in its HTML actually return 200 from the live
 * process.
 *
 * Why this exists (iter11)
 * ------------------------
 * scripts/pm2-launch-next.mjs already fences out "PM2 starts a corrupt
 * build" at boot by parsing `.next/build-manifest.json` and
 * `.next/app-build-manifest.json` and confirming every referenced chunk
 * exists on disk. That check happens ONCE, before `next start` runs.
 *
 * Once the process is up, however, the on-disk `.next/` tree can still
 * be silently overwritten by:
 *   - a stray `next dev` run (rotates BUILD_ID and chunk hashes, writes
 *     a dev-mode manifest);
 *   - a `next build` performed outside the deploy wrapper (rotates
 *     BUILD_ID and chunk hashes but does not call `pm2 reload`).
 *
 * The PM2 process keeps serving HTML with the OLD chunk hashes from its
 * in-memory manifest. Every fresh page request returns 200 with HTML, but
 * every `<script src="/_next/static/chunks/app/...-OLD.js">` 404s (or 400s
 * from Next's static handler). The site looks "up" but every route renders
 * blank. This is the exact mode iter11 caught in production.
 *
 * This probe closes that loop: it fetches each probed page, extracts every
 * `/_next/...` chunk URL, and HEAD/GETs each one against the same live
 * process. Any non-2xx is a fatal stale-bundle condition.
 *
 * Tracking: .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *   0022-iter11-blocker-pm2-stale-bundle-after-dev-clobber.md
 *
 * Modes
 * -----
 *   - strict (CLI flag --strict, or NEXT_LIVE_URL_STRICT set): live process
 *     MUST be reachable. Unreachable ⇒ exit 1.
 *   - non-strict (default): unreachable live process ⇒ exit 0 SKIP (CI
 *     build phase where nothing is bound to :3100).
 */

const TRACKING =
  '.autobuilder/initiatives/0004-testnet-readiness-gate/tasks/' +
  '0022-iter11-blocker-pm2-stale-bundle-after-dev-clobber.md'

// Default routes probed by the CLI. Each route must use a different App
// Router segment so we exercise its `app/<segment>/page-*.js` chunk, not
// just the shared webpack/main-app chunks. `/` covers the root; `/predict`
// and `/explore` were the two routes that broke first in the iter11
// incident, so they make natural canaries.
const DEFAULT_PROBE_PATHS = ['/', '/predict', '/explore']

// Match any `/_next/...` reference, regardless of attribute context:
//   - <script src="/_next/static/chunks/...">
//   - <link rel="stylesheet" href="/_next/static/css/...">
//   - <link rel="preload" as="..." href="/_next/static/chunks/...">
//   - inline RSC payloads that embed /_next/... paths
//
// The capturing group stops at the first `"`, `'`, ` `, `<`, or `\`. NOTE:
// `(` and `)` are deliberately NOT terminators — Next.js App Router route
// groups generate chunk paths like
//   /_next/static/chunks/app/(app)/predict/page-<hash>.js
// and parens are legal URL path characters (RFC 3986 §3.3 "sub-delims").
// Truncating at `)` (the bug we shipped in iter11) produced false-positive
// 404s for every route-group chunk and failed postbuild against green builds.
const CHUNK_REF_REGEX = /\/_next\/[^"'\s<\\]+/g

/**
 * Probe one live URL: fetch its HTML and probe every chunk it references.
 *
 * Returns { ok, status, chunksTotal, chunkFailures: [{path, status, error}] }
 * Caller aggregates across probePaths.
 */
async function probeOne({ origin, pagePath, alreadyProbed, fetchImpl }) {
  const url = origin + pagePath
  let html
  let pageStatus
  try {
    const res = await fetchImpl(url)
    pageStatus = res?.status ?? 0
    if (!res?.ok && !(pageStatus >= 200 && pageStatus < 300)) {
      return {
        pagePath,
        pageStatus,
        pageError: `non-2xx status ${pageStatus}`,
        chunks: [],
        chunkFailures: [],
      }
    }
    html = await res.text()
  } catch (err) {
    return {
      pagePath,
      pageStatus: 0,
      pageError: String(err?.message ?? err),
      chunks: [],
      chunkFailures: [],
    }
  }

  // Extract & dedupe within this page.
  const seenHere = new Set()
  const matches = html.match(CHUNK_REF_REGEX) ?? []
  for (const m of matches) {
    // Strip JSON-escape artifacts that can leak in from RSC payloads, e.g.
    // `/_next/static/chunks/foo.js\\` → `/_next/static/chunks/foo.js`.
    const clean = m.replace(/\\+$/, '')

    // Next 16/Turbopack may split a long RSC string literal across adjacent
    // `<script>self.__next_f.push(...)` tags. A naive regex then sees partial
    // prefixes such as `/_next/static/chunks/0` or `/_next/sta`, which are not
    // real asset URLs and should not be probed. Keep only complete static
    // asset references with an expected extension.
    if (!/\.(?:js|css|woff2?|png|jpe?g|webp|svg|ico)(?:[?#].*)?$/.test(clean)) continue

    seenHere.add(clean)
  }

  // Only probe chunks we haven't already probed via a prior page. The
  // aggregate caller passes `alreadyProbed` (a Set) so we don't waste
  // requests on shared chunks (webpack-*.js, main-app-*.js, etc.).
  const toProbe = [...seenHere].filter((p) => !alreadyProbed.has(p))

  const chunkFailures = []
  // Probe sequentially. Concurrency on localhost has no benefit and a
  // serial probe gives cleaner, ordered failure output.
  for (const path of toProbe) {
    alreadyProbed.add(path)
    try {
      const res = await fetchImpl(origin + path)
      const st = res?.status ?? 0
      if (!(st >= 200 && st < 300)) {
        chunkFailures.push({ path, status: st, error: null, viaPage: pagePath })
      }
    } catch (err) {
      chunkFailures.push({
        path,
        status: 0,
        error: String(err?.message ?? err),
        viaPage: pagePath,
      })
    }
  }

  return {
    pagePath,
    pageStatus,
    pageError: null,
    chunks: toProbe,
    chunkFailures,
  }
}

export async function checkServedChunks({
  liveUrl = process.env.NEXT_LIVE_URL ?? 'http://localhost:3100/',
  probePaths = DEFAULT_PROBE_PATHS,
  strict = false,
  fetchImpl = globalThis.fetch,
} = {}) {
  // Normalize origin: liveUrl may be "http://localhost:3100/" or
  // ".../some/path"; we only want scheme+host+port.
  const u = new URL(liveUrl)
  const origin = `${u.protocol}//${u.host}`

  const alreadyProbed = new Set()
  const perPage = []

  for (const pagePath of probePaths) {
    const r = await probeOne({ origin, pagePath, alreadyProbed, fetchImpl })
    perPage.push(r)
  }

  // --- Reachability handling -------------------------------------------------
  // If the very first probe failed with a network error, the live process is
  // unreachable. Honour strict/non-strict like check-buildid-sync.mjs does.
  const networkDead = perPage.every(
    (p) => p.pageStatus === 0 && typeof p.pageError === 'string' && p.pageError !== null,
  )
  if (networkDead) {
    const reason = perPage[0]?.pageError ?? 'unknown'
    if (strict) {
      return {
        exitCode: 1,
        sampledCount: 0,
        missing: [],
        message: [
          '[check-served-chunks] FAIL: live process is unreachable',
          `  url: ${liveUrl}`,
          `  reason: ${reason}`,
          '  the goodswap PM2 process is not bound to that port.',
          '  fix: `pm2 reload goodswap --update-env` or `pm2 start pm2-ecosystem.config.js`.',
          '',
          `Tracking: ${TRACKING}`,
        ].join('\n'),
      }
    }
    return {
      exitCode: 0,
      sampledCount: 0,
      missing: [],
      message: [
        `[check-served-chunks] SKIP: live process at ${liveUrl} unreachable (${reason}).`,
        '  Non-strict mode: assuming CI build phase. Run with --strict (or set',
        '  NEXT_LIVE_URL_STRICT=1) after `pm2 reload goodswap` to enforce.',
      ].join('\n'),
    }
  }

  // --- Aggregate per-page page errors (non-2xx pages) ------------------------
  const pageErrors = perPage.filter((p) => p.pageError || (p.pageStatus && (p.pageStatus < 200 || p.pageStatus >= 300)))
  if (pageErrors.length > 0) {
    const lines = pageErrors.map(
      (p) => `  ${p.pagePath} → status ${p.pageStatus}${p.pageError ? ` (${p.pageError})` : ''}`,
    )
    return {
      exitCode: 1,
      sampledCount: alreadyProbed.size,
      missing: [],
      message: [
        '[check-served-chunks] FAIL: probed page(s) did not return 2xx',
        ...lines,
        '  the live process is up but route(s) are broken; investigate `pm2 logs goodswap`.',
        '',
        `Tracking: ${TRACKING}`,
      ].join('\n'),
    }
  }

  // --- Defensive: HTML returned but contained no /_next/ references ----------
  // Caddy serving a maintenance page or wrong upstream would hit this branch.
  if (alreadyProbed.size === 0) {
    return {
      exitCode: 1,
      sampledCount: 0,
      missing: [],
      message: [
        '[check-served-chunks] FAIL: probed page(s) returned HTML with no /_next/* chunk references',
        '  pages: ' + probePaths.join(', '),
        '  this is not a Next.js response — wrong port? maintenance page? Caddy upstream off?',
        '',
        `Tracking: ${TRACKING}`,
      ].join('\n'),
    }
  }

  // --- Chunk failures = the stale-manifest condition we exist to catch ------
  const allFailures = perPage.flatMap((p) => p.chunkFailures)
  if (allFailures.length > 0) {
    const lines = allFailures.map(
      (f) =>
        `  ${f.path} → ${f.error ? f.error : `status ${f.status}`} (referenced from ${f.viaPage})`,
    )
    return {
      exitCode: 1,
      sampledCount: alreadyProbed.size,
      missing: allFailures.map((f) => f.path),
      message: [
        `[check-served-chunks] FAIL: live process is serving HTML that references chunks it cannot return`,
        ...lines,
        '',
        '  Diagnosis: PM2 has a stale in-memory manifest. The on-disk `.next/`',
        '  tree was rewritten (`next build` outside the deploy wrapper, or a',
        '  stray `next dev`) but the live process was never reloaded, so it',
        '  keeps emitting HTML with chunk hashes that no longer exist on disk.',
        '',
        '  Fix: `pm2 reload goodswap --update-env`',
        '       (the npm `build` script\'s postbuild hook does this automatically;',
        '        a chunk failure here means either the postbuild hook was bypassed',
        '        or someone ran `next dev` over the production tree afterwards.)',
        '',
        `Tracking: ${TRACKING}`,
      ].join('\n'),
    }
  }

  return {
    exitCode: 0,
    sampledCount: alreadyProbed.size,
    missing: [],
    message:
      `[check-served-chunks] OK — ${alreadyProbed.size} chunk(s) referenced by ` +
      `${probePaths.length} probed page(s) all returned 2xx from ${origin}.`,
  }
}

// --- CLI entry point ---------------------------------------------------------
// Only run when invoked directly (not when imported by tests).
const invokedAsScript =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('check-served-chunks.mjs')

if (invokedAsScript) {
  const strict = process.argv.includes('--strict') || !!process.env.NEXT_LIVE_URL_STRICT
  // Optional: pass `--paths /,/predict,/explore` to override the default set.
  const pathsArgIdx = process.argv.indexOf('--paths')
  const probePaths =
    pathsArgIdx >= 0 && process.argv[pathsArgIdx + 1]
      ? process.argv[pathsArgIdx + 1].split(',').filter(Boolean)
      : undefined
  const result = await checkServedChunks({ strict, probePaths })
  if (result.exitCode === 0) {
    console.log(result.message)
  } else {
    console.error(result.message)
  }
  process.exit(result.exitCode)
}
