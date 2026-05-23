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
"[project]/frontend/src/lib/api-error.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "apiError",
    ()=>apiError,
    "methodNotAllowed",
    ()=>methodNotAllowed
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
function apiError(status, code, message, extra) {
    const { headers: extraHeaders, cacheControl, ...rest } = extra ?? {};
    const body = {
        error: message,
        code,
        timestamp: new Date().toISOString(),
        ...rest
    };
    const headers = {
        'Content-Type': 'application/json; charset=utf-8'
    };
    if (cacheControl) {
        headers['Cache-Control'] = cacheControl;
    } else if (status >= 400) {
        headers['Cache-Control'] = 'no-store';
    }
    if (extraHeaders) {
        for (const [k, v] of Object.entries(extraHeaders)){
            headers[k] = v;
        }
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(body, {
        status,
        headers
    });
}
function methodNotAllowed(req, allowed) {
    const url = new URL(req.url);
    const allowedUpper = allowed.map((m)=>m.toUpperCase());
    return apiError(405, 'method_not_allowed', 'Method not allowed', {
        path: url.pathname,
        method: req.method,
        allowed: allowedUpper,
        headers: {
            Allow: allowedUpper.join(', ')
        }
    });
}
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
"[project]/frontend/src/app/api/hedge/status/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "PATCH",
    ()=>PATCH,
    "POST",
    ()=>POST,
    "PUT",
    ()=>PUT,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2d$error$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/api-error.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$withApiRateLimit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/withApiRateLimit.ts [app-route] (ecmascript)");
;
;
;
const runtime = 'nodejs';
const SNAPSHOT_URL = process.env.HEDGE_STATUS_URL ?? 'http://localhost:9116/hedge/snapshot';
const RECEIPTS_URL_BASE = process.env.HEDGE_RECEIPTS_URL ?? 'http://localhost:9116/hedge/receipts';
const PROOF_URL = process.env.HEDGE_PROOF_URL ?? 'http://localhost:9116/hedge/proof/latest';
const TIMEOUT_MS = 5_000;
async function timedFetch(url) {
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(), TIMEOUT_MS);
    try {
        return await fetch(url, {
            signal: controller.signal,
            cache: 'no-store'
        });
    } finally{
        clearTimeout(timer);
    }
}
async function handleGet(_req) {
    try {
        const [snapRes, receiptsRes, proofRes] = await Promise.all([
            timedFetch(SNAPSHOT_URL),
            timedFetch(`${RECEIPTS_URL_BASE}?limit=5`),
            timedFetch(PROOF_URL)
        ]);
        if (!snapRes.ok && snapRes.status !== 503) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Hedge engine returned an error',
                httpStatus: snapRes.status
            }, {
                status: 502
            });
        }
        const snapshotEnvelope = snapRes.ok ? await snapRes.json() : null;
        const receipts = receiptsRes.ok ? (await receiptsRes.json()).receipts ?? [] : [];
        const proof = proofRes.ok ? await proofRes.json() : null;
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            snapshot: snapshotEnvelope?.snapshot ?? null,
            capSnapshot: snapshotEnvelope?.capSnapshot ?? null,
            breakerState: snapshotEnvelope?.breakerState ?? null,
            killSwitchEngaged: Boolean(snapshotEnvelope?.killSwitchEngaged),
            mode: snapshotEnvelope?.mode ?? null,
            receipts,
            proof
        });
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Hedge engine unreachable',
            snapshot: null,
            mode: null,
            receipts: [],
            proof: null
        }, {
            status: 503
        });
    }
}
const GET = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$withApiRateLimit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["withApiRateLimit"])(handleGet);
const ALLOWED = [
    'GET'
];
const reject = (req)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2d$error$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["methodNotAllowed"])(req, [
        ...ALLOWED
    ]);
const POST = reject;
const PUT = reject;
const DELETE = reject;
const PATCH = reject;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__073xvk5._.js.map