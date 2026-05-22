/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const priceServiceOrigins = (() => {
  const url = process.env.NEXT_PUBLIC_PRICE_SERVICE_URL
  if (!url) return []
  try { return [new URL(url).origin] } catch { return [] }
})()

const securityHeaders = [
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop browsers leaking referrer to third-party origins
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Prevent MIME sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Enable XSS filter in older browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Require HTTPS for 1 year (only active in production)
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }]
    : []),
  // Permissions policy — deny access to camera, mic, geolocation
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Content-Security-Policy
  // 'unsafe-eval' + 'unsafe-inline' in script-src are required by wagmi/viem
  // WebAssembly crypto modules and Next.js RSC inline scripts respectively.
  // Removing them breaks wallet connections and server component hydration.
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://assets.coingecko.com https://raw.githubusercontent.com https://goodswap.goodclaw.org",
      [
        "connect-src 'self'",
        'https://*.alchemyapi.io',
        'https://*.g.alchemy.com',
        'wss://*.alchemyapi.io',
        'wss://*.g.alchemy.com',
        'https://api.coingecko.com',
        'https://*.infura.io',
        'wss://*.infura.io',
        'https://api.walletconnect.com',
        'wss://*.walletconnect.com',
        'https://explorer-api.walletconnect.com',
        'https://rpc.gooddollar.org',
        'https://clapi.gooddollar.org',
        'https://rpc.goodclaw.org',
        'wss://rpc.goodclaw.org',
        'https://pulse.walletconnect.org',
        'wss://pulse.walletconnect.org',
        'https://api.web3modal.org',
        ...priceServiceOrigins,
        ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:*'] : []),
      ].join(' '),
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      ...(process.env.NODE_ENV === 'production'
        ? ['upgrade-insecure-requests', 'report-uri /api/csp-report', 'report-to csp-violations']
        : []),
    ].join('; '),
  },
  ...(process.env.NODE_ENV === 'production'
    ? [{
        key: 'Report-To',
        value: JSON.stringify({
          group: 'csp-violations',
          max_age: 86400,
          endpoints: [{ url: '/api/csp-report' }],
        }),
      }]
    : []),
]

const nextConfig = {
  // CRITICAL: Honors NEXT_DIST_DIR env var so Playwright (via webServer.env)
  // can redirect its `next dev` build artifacts to `.next.e2e/` instead of
  // clobbering the production `.next/` directory served by the PM2-managed
  // `goodswap` service. PM2 / `next start` / `next build` leave NEXT_DIST_DIR
  // unset, so production transparently uses `.next` and behavior is unchanged.
  //
  // History: iter19 (task 0029) tried to do this with `next dev --dist-dir`,
  // but that CLI flag is not supported on `next dev` in Next 14.2.x — the
  // webServer silently failed every time anyone ran `playwright test`.
  // Iter21 (task 0032) moved the bridge into the config + env-var pattern,
  // which IS honored by `next dev`. The
  // `frontend/scripts/check-playwright-isolation.mjs` guard enforces the
  // shape of this bridge so it cannot quietly regress again.
  distDir: process.env.NEXT_DIST_DIR || '.next',

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  // Framework-level redirects emit a proper `Location` header at request time.
  // Doing the same job via `redirect('/')` from a server component (the
  // previous `src/app/swap/page.tsx`) got statically prerendered into
  // `.next/server/app/swap.meta` as a 307 with NO `Location` header, which
  // broke direct navigation to `/swap`. See:
  //   .autobuilder/initiatives/0002-security-hardening/tasks/0034-fix-swap-page-broken-prerender-redirect.md
  async redirects() {
    return [
      {
        source: '/swap',
        destination: '/',
        permanent: false, // 307 — preserves prior semantics
      },
    ]
  },

  experimental: {
    optimizePackageImports: [
      'viem',
      'wagmi',
      '@rainbow-me/rainbowkit',
      '@tanstack/react-query',
      'lucide-react',
    ],
  },
  webpack: (config) => {
    // Bundle optimization for better caching and performance
    config.optimization.splitChunks = {
      ...config.optimization.splitChunks,
      cacheGroups: {
        ...config.optimization.splitChunks.cacheGroups,
        // Web3 vendor chunk — `chunks: 'async'` ensures wagmi / RainbowKit /
        // WalletConnect / viem only end up in the bundle of routes that
        // statically reach them (the `(app)` route group via WalletProviders),
        // OR are loaded on demand via `next/dynamic({ ssr: false })`. They are
        // never preloaded as a `<script async>` on marketing pages such as `/`.
        // See `.autobuilder/initiatives/0002-security-hardening/tasks/0020-...`.
        web3: {
          name: 'web3-vendor',
          chunks: 'async',
          test: /[\\/]node_modules[\\/](@wagmi|wagmi|viem|@rainbow-me|@walletconnect|@reown)/,
          priority: 30,
          reuseExistingChunk: true,
          enforce: true,
        },
        // UI vendor chunk (radix + lucide only — globally loaded)
        ui: {
          name: 'ui-vendor',
          chunks: 'all',
          test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)/,
          priority: 25,
          reuseExistingChunk: true,
        },
        // framer-motion async — only loaded on pages that actually import it
        framer: {
          name: 'framer-vendor',
          chunks: 'async',
          test: /[\\/]node_modules[\\/](framer-motion)/,
          priority: 28,
          reuseExistingChunk: true,
        },
        // React vendor chunk
        react: {
          name: 'react-vendor',
          chunks: 'all',
          test: /[\\/]node_modules[\\/](react|react-dom|@tanstack\/react-query)/,
          priority: 20,
          reuseExistingChunk: true,
        },
      },
    }

    config.resolve.fallback = {
      ...config.resolve.fallback,
      'porto/internal': false,
      '@react-native-async-storage/async-storage': false,
    }
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
}
module.exports = withBundleAnalyzer(nextConfig)
