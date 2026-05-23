module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/frontend/src/lib/rate-limit.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "_resetBuckets",
    ()=>_resetBuckets,
    "checkRateLimit",
    ()=>checkRateLimit,
    "getRealIp",
    ()=>getRealIp
]);
/**
 * Canonical IP rate limiter for Next.js API route handlers (Node.js runtime).
 *
 * Implementation: token bucket, in-memory `Map`, per-process.
 * Default RPM: 60 (override with `RATE_LIMIT_RPM` env var).
 *
 * IMPORTANT: This module is for Node.js-runtime route handlers only. It must
 * never be imported from `src/middleware.ts` — Next.js 14.2.35 + Node 22 runs
 * middleware inside an Edge Runtime sandbox that crashes any request with
 *   EvalError: Code generation from strings disallowed for this context
 * (See `frontend/scripts/check-middleware-absent.mjs` and tasks
 *  0021-fix-middleware-evalerror-crashes-next-start.md and
 *  0023-iter11-followup-middleware-reintroduced-fails-perf-gate.md.)
 *
 * Use the `withApiRateLimit` wrapper in `./withApiRateLimit.ts` to enforce
 * limits at the route-handler layer.
 *
 * Production deployments on multi-instance infrastructure should replace
 * the per-process Map with a Redis-backed store (e.g. @upstash/ratelimit)
 * or push the limiter into an upstream proxy (Cloudflare / nginx / Caddy).
 */ const DEFAULT_RPM = 60;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const STALE_THRESHOLD_MS = 10 * 60 * 1000;
const buckets = new Map();
let lastCleanup = Date.now();
function _resetBuckets() {
    buckets.clear();
    lastCleanup = Date.now();
}
function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;
    for (const [key, bucket] of buckets){
        if (now - bucket.lastRefill > STALE_THRESHOLD_MS) {
            buckets.delete(key);
        }
    }
}
function checkRateLimit(ip) {
    cleanup();
    const rpm = Number(process.env.RATE_LIMIT_RPM) || DEFAULT_RPM;
    const now = Date.now();
    const refillRate = rpm / 60_000; // tokens per ms
    let bucket = buckets.get(ip);
    if (!bucket) {
        bucket = {
            tokens: rpm,
            lastRefill: now
        };
        buckets.set(ip, bucket);
    }
    const elapsed = now - bucket.lastRefill;
    bucket.tokens = Math.min(rpm, bucket.tokens + elapsed * refillRate);
    bucket.lastRefill = now;
    if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        return {
            allowed: true,
            retryAfterSeconds: 0
        };
    }
    const waitMs = (1 - bucket.tokens) / refillRate;
    return {
        allowed: false,
        retryAfterSeconds: Math.ceil(waitMs / 1000)
    };
}
function getRealIp(req) {
    const get = req?.headers?.get?.bind(req.headers);
    if (!get) return '127.0.0.1';
    const realIp = get('x-real-ip');
    if (realIp) return realIp;
    const forwarded = get('x-forwarded-for');
    if (forwarded) {
        const first = forwarded.split(',')[0]?.trim();
        if (first) return first;
    }
    return '127.0.0.1';
}
}),
"[project]/frontend/src/lib/withApiRateLimit.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "withApiRateLimit",
    ()=>withApiRateLimit
]);
/**
 * Higher-order wrapper that gates a Next.js Node-runtime API route handler
 * with the canonical token-bucket rate limiter in `./rate-limit.ts`.
 *
 * Why this exists:
 *   - `frontend/src/middleware.ts` was removed (task 0021 + 0023) because
 *     Next.js 14.2.35 + Node 22 runs middleware inside an Edge Runtime
 *     sandbox that crashes with `EvalError: Code generation from strings
 *     disallowed for this context`.
 *   - Rate limiting therefore has to move from Edge middleware into
 *     individual Node-runtime route handlers.
 *
 * Contract:
 *   - On allow: returns the wrapped handler's response unchanged.
 *   - On deny: returns HTTP 429 with body `{ error, retryAfterSeconds }`
 *     and a `Retry-After` header.
 *
 * Limits:
 *   - Default RPM is 60, overridable via `RATE_LIMIT_RPM` env var.
 *   - Bucket state is per-process. For multi-instance deploys (PM2 cluster,
 *     multiple pods) replace with a Redis-backed limiter — see comment in
 *     `./rate-limit.ts`.
 *
 * Tracking:
 *   - .autobuilder/initiatives/0004-testnet-readiness-gate/tasks/
 *     0023-iter11-followup-middleware-reintroduced-fails-perf-gate.md
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/rate-limit.ts [app-route] (ecmascript)");
;
;
function withApiRateLimit(handler) {
    return async (req, ctx)=>{
        // Operator kill switch — mirrors the semantics of the (removed)
        // src/middleware.ts so existing deployment env files still behave the
        // same way. Setting RATE_LIMIT_ENABLED=false disables ALL per-route
        // limits.
        if (process.env.RATE_LIMIT_ENABLED === 'false') {
            return handler(req, ctx);
        }
        const ip = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getRealIp"])(req);
        const { allowed, retryAfterSeconds } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$rate$2d$limit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["checkRateLimit"])(ip);
        if (!allowed) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Too many requests',
                retryAfterSeconds
            }, {
                status: 429,
                headers: {
                    'Retry-After': String(retryAfterSeconds)
                }
            });
        }
        return handler(req, ctx);
    };
}
}),
"[project]/frontend/src/lib/safety.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Frontend safety mirror — Lane 6 release-gate proof.
 *
 * Mirrors the `REAL_TRADING_ENABLED` constant from `backend/etoro-client/src/safety.ts`
 * (and the hedge-engine internal mirror). This is intentionally a literal `false`
 * type so any attempt to set it to `true` is a compile-time TypeScript error.
 *
 * The /live-prices-proof page cross-checks this value against the
 * `/api/safety-state` endpoint (which reads the server-side env). A mismatch
 * (either side reporting `true`) renders a refusal banner.
 */ __turbopack_context__.s([
    "ALLOWED_ETORO_MODES",
    ()=>ALLOWED_ETORO_MODES,
    "REAL_TRADING_ENABLED",
    ()=>REAL_TRADING_ENABLED,
    "SAFETY_STATE_VERSION",
    ()=>SAFETY_STATE_VERSION,
    "isEtoroModeAllowed",
    ()=>isEtoroModeAllowed
]);
const REAL_TRADING_ENABLED = false;
const SAFETY_STATE_VERSION = 1;
const ALLOWED_ETORO_MODES = [
    'sandbox',
    'demo'
];
function isEtoroModeAllowed(raw) {
    if (typeof raw !== 'string') return false;
    const normalised = raw.toLowerCase().trim();
    return ALLOWED_ETORO_MODES.includes(normalised);
}
}),
"[project]/frontend/src/app/api/safety-state/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$withApiRateLimit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/withApiRateLimit.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$safety$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/safety.ts [app-route] (ecmascript)");
;
;
;
const runtime = 'nodejs';
async function handleGet(_req) {
    const body = {
        realTradingEnabled: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$safety$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["REAL_TRADING_ENABLED"],
        etoroMode: process.env.ETORO_MODE ?? 'sandbox',
        version: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$safety$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SAFETY_STATE_VERSION"]
    };
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(body, {
        headers: {
            'Cache-Control': 'no-store'
        }
    });
}
const GET = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$withApiRateLimit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["withApiRateLimit"])(handleGet);
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__02abm~o._.js.map