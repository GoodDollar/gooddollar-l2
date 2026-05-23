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
"[project]/frontend/src/lib/stocksRebalanceInvariant.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_DIVERGENCE_STOP_BPS",
    ()=>DEFAULT_DIVERGENCE_STOP_BPS,
    "buildSymbolRebalanceStatus",
    ()=>buildSymbolRebalanceStatus,
    "computeDivergenceBps",
    ()=>computeDivergenceBps,
    "evaluateRebalanceGuard",
    ()=>evaluateRebalanceGuard,
    "evaluateRebalanceInvariant",
    ()=>evaluateRebalanceInvariant,
    "humanizeRiskReason",
    ()=>humanizeRiskReason,
    "toInvariantInputFromStatus",
    ()=>toInvariantInputFromStatus
]);
const DEFAULT_DIVERGENCE_STOP_BPS = 50;
const PRODUCTS = [
    'amm',
    'perps',
    'predict',
    'lend',
    'yield'
];
function computeDivergenceBps(normalizedPrice, oraclePrice) {
    if (!normalizedPrice || !oraclePrice || normalizedPrice <= 0 || oraclePrice <= 0) {
        return 0;
    }
    const diff = Math.abs(normalizedPrice - oraclePrice);
    return diff / normalizedPrice * 10_000;
}
function evaluateRebalanceInvariant(input, divergenceStopBps = DEFAULT_DIVERGENCE_STOP_BPS) {
    const syncedBlocks = [
        input.products.amm,
        input.products.perps,
        input.products.prediction,
        input.products.lend,
        input.products.yield
    ];
    const lastSyncedBlock = Math.min(...syncedBlocks);
    const blockSkew = Math.max(0, input.currentBlock - lastSyncedBlock);
    const coherentBlock = syncedBlocks.every((b)=>b === input.oracleBlock);
    const divergenceBps = computeDivergenceBps(input.normalizedPrice, input.oraclePrice);
    const stopReasons = [];
    if (divergenceBps > divergenceStopBps) stopReasons.push('divergence_gt_0_5pct');
    if (input.stalePropagation || lastSyncedBlock < input.currentBlock) stopReasons.push('stale_propagation');
    if (!coherentBlock) stopReasons.push('cross_product_block_mismatch');
    if (input.secretLeakage) stopReasons.push('secret_leakage');
    return {
        symbol: input.symbol,
        currentBlock: input.currentBlock,
        oracleBlock: input.oracleBlock,
        products: input.products,
        lastSyncedBlock,
        blockSkew,
        divergenceBps,
        coherentBlock,
        stopReasons,
        riskIncreaseAllowed: stopReasons.length === 0
    };
}
function toInvariantInputFromStatus(symbol, currentBlock, raw) {
    const data = raw ?? {};
    const oracleBlock = Number.isFinite(data.oracleBlock) ? Number(data.oracleBlock) : currentBlock;
    const products = {
        amm: Number.isFinite(data.products?.amm) ? Number(data.products?.amm) : oracleBlock,
        perps: Number.isFinite(data.products?.perps) ? Number(data.products?.perps) : oracleBlock,
        prediction: Number.isFinite(data.products?.prediction) ? Number(data.products?.prediction) : oracleBlock,
        lend: Number.isFinite(data.products?.lend) ? Number(data.products?.lend) : oracleBlock,
        yield: Number.isFinite(data.products?.yield) ? Number(data.products?.yield) : oracleBlock
    };
    return {
        symbol,
        currentBlock,
        oracleBlock,
        normalizedPrice: data.normalizedPrice,
        oraclePrice: data.oraclePrice,
        stalePropagation: Boolean(data.stalePropagation),
        secretLeakage: Boolean(data.secretLeakage),
        products
    };
}
function toFiniteNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}
function parseProductState(raw) {
    const data = raw ?? {};
    return {
        lastSyncedBlock: toFiniteNumber(data.lastSyncedBlock),
        divergencePct: toFiniteNumber(data.divergencePct)
    };
}
function buildSymbolRebalanceStatus(symbol, statusPayload) {
    const payload = statusPayload ?? {};
    const raw = payload.rebalance?.symbols?.[symbol];
    const products = Object.fromEntries(PRODUCTS.map((key)=>[
            key,
            parseProductState(raw?.products?.[key])
        ]));
    const rawProof = Array.isArray(raw?.blockProof) ? raw?.blockProof : [];
    const blockProof = rawProof.map((v)=>toFiniteNumber(v)).filter((v)=>v !== null);
    return {
        symbol,
        snapshotBlock: toFiniteNumber(raw?.snapshotBlock),
        products,
        stalePropagation: !!raw?.stalePropagation,
        secretLeak: !!raw?.secretLeak,
        blockProof
    };
}
function humanizeRiskReason(reason) {
    if (reason === 'divergence_gt_0_5pct' || reason.includes('exceeds') && reason.includes('stop rule')) {
        return 'Price discrepancy detected — verifying';
    }
    if (reason === 'stale_propagation' || reason.includes('Stale propagation')) {
        return 'Price data refreshing';
    }
    if (reason === 'cross_product_block_mismatch' || reason.includes('Awaiting same-block sync')) {
        return 'Price feeds syncing';
    }
    if (reason === 'secret_leakage' || reason.includes('Secret leakage') || reason.includes('secretLeak')) {
        return 'System check in progress';
    }
    if (reason.includes('Two-block oracle sync proof')) {
        return 'Prices are being verified';
    }
    if (reason.includes('Current block unavailable')) {
        return 'Waiting for network confirmation';
    }
    return 'Trading temporarily paused';
}
function evaluateRebalanceGuard(symbolStatus, currentBlock) {
    const reasons = [];
    const staleProducts = [];
    let maxDivergencePct = 0;
    for (const product of PRODUCTS){
        const state = symbolStatus.products[product];
        const lastSynced = state.lastSyncedBlock;
        if (currentBlock !== null && (lastSynced === null || lastSynced < currentBlock)) {
            staleProducts.push(product);
        }
        if (typeof state.divergencePct === 'number' && state.divergencePct > maxDivergencePct) {
            maxDivergencePct = state.divergencePct;
        }
    }
    if (currentBlock === null) {
        reasons.push('Current block unavailable — sync proof required before trading');
    }
    const hasTwoBlockProof = symbolStatus.blockProof.some((value, idx, arr)=>idx > 0 && value === arr[idx - 1] + 1);
    if (!hasTwoBlockProof) {
        reasons.push('Two-block oracle sync proof missing');
    }
    if (staleProducts.length > 0) {
        reasons.push(`Awaiting same-block sync for: ${staleProducts.join(', ')}`);
    }
    if (maxDivergencePct > 0.5) {
        reasons.push(`Divergence ${maxDivergencePct.toFixed(2)}% exceeds 0.50% stop rule`);
    }
    if (symbolStatus.stalePropagation) {
        reasons.push('Stale propagation detected across products');
    }
    if (symbolStatus.secretLeak) {
        reasons.push('Secret leakage flag raised by risk monitor');
    }
    return {
        blocked: reasons.length > 0,
        reasons,
        staleProducts,
        maxDivergencePct,
        hasTwoBlockProof
    };
}
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
"[project]/frontend/src/app/api/stocks/rebalance-status/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stocksRebalanceInvariant$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stocksRebalanceInvariant.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2d$error$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/api-error.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$withApiRateLimit$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/withApiRateLimit.ts [app-route] (ecmascript)");
;
;
;
;
const runtime = 'nodejs';
const STATUS_URL = process.env.STATUS_AGGREGATOR_URL ?? 'http://localhost:9200/status.json';
const TIMEOUT_MS = 5000;
const DEFAULT_SYMBOLS = [
    'AAPL',
    'TSLA',
    'NVDA',
    'MSFT',
    'AMZN',
    'GOOGL',
    'META',
    'JPM',
    'V',
    'DIS',
    'NFLX',
    'AMD'
];
function parseRequestedSymbols(req) {
    const querySymbols = req.nextUrl.searchParams.get('symbols');
    const singleSymbol = req.nextUrl.searchParams.get('symbol');
    const raw = querySymbols ?? singleSymbol ?? '';
    if (!raw.trim()) return DEFAULT_SYMBOLS;
    const parsed = raw.split(',').map((s)=>s.trim().toUpperCase()).filter((s)=>/^[A-Z0-9]{1,16}$/.test(s));
    return parsed.length > 0 ? parsed : DEFAULT_SYMBOLS;
}
function getCurrentBlock(payload) {
    return Number(payload.stocksRebalance?.currentBlock ?? payload.chain?.blockNumber ?? payload.blockNumber ?? 0);
}
function buildSymbolResults(symbols, currentBlock, payload) {
    const symbolData = payload.stocksRebalance?.symbols ?? {};
    return symbols.map((symbol)=>{
        const input = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stocksRebalanceInvariant$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toInvariantInputFromStatus"])(symbol, currentBlock, symbolData[symbol]);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stocksRebalanceInvariant$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["evaluateRebalanceInvariant"])(input);
    });
}
async function handleGet(req) {
    const symbols = parseRequestedSymbols(req);
    try {
        const controller = new AbortController();
        const timer = setTimeout(()=>controller.abort(), TIMEOUT_MS);
        const res = await fetch(STATUS_URL, {
            signal: controller.signal,
            cache: 'no-store'
        });
        clearTimeout(timer);
        if (!res.ok) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Status aggregator returned an error',
                httpStatus: res.status
            }, {
                status: 502
            });
        }
        const payload = await res.json();
        const currentBlock = getCurrentBlock(payload);
        const results = buildSymbolResults(symbols, currentBlock, payload);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            generatedAt: new Date().toISOString(),
            currentBlock,
            symbols: results,
            stopActive: results.some((s)=>!s.riskIncreaseAllowed)
        }, {
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Status aggregator unreachable',
            currentBlock: 0,
            symbols: symbols.map((symbol)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stocksRebalanceInvariant$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["evaluateRebalanceInvariant"])({
                    symbol,
                    currentBlock: 0,
                    oracleBlock: 0,
                    products: {
                        amm: 0,
                        perps: 0,
                        prediction: 0,
                        lend: 0,
                        yield: 0
                    },
                    stalePropagation: true
                })),
            stopActive: true
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

//# sourceMappingURL=%5Broot-of-the-server%5D__0gcm8to._.js.map