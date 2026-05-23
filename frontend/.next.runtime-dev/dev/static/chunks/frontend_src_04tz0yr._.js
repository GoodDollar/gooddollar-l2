(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/lib/rpc.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Strict JSON-RPC POST helper for the bare-fetch transport used by the Live
 * Activity page (and any future page that wants raw RPC without pulling in the
 * full wagmi/viem stack).
 *
 * Background — task 0069: the previous inline `rpcCall` in
 * `frontend/src/app/activity/page.tsx` swallowed every error path silently:
 *
 *   - no `res.ok` check     → 5xx surfaced as `data.result === undefined`
 *   - no `data.error` check → JSON-RPC errors surfaced as `undefined`
 *   - no timeout            → a hanging service-worker intercept hung forever
 *   - no `Accept: application/json`
 *                           → an intercepting service worker could serve a
 *                             cached HTML 404 for a POST, making `res.json()`
 *                             throw and the page anchor at "Block #0"
 *
 * `hexToNumber(undefined)` coerces to `NaN` and then `0`, which rendered as
 * `Block #0` beside a green "Live" pulse — the most misleading possible
 * combination. This helper makes every failure mode loud and typed so callers
 * can render a real error banner.
 *
 * Cache-busting note — task 0091: we deliberately do NOT send a
 * `Cache-Control: no-store` request header. `Cache-Control` is not on the
 * Fetch spec's CORS-safelisted request header list, so sending it forces a
 * CORS preflight. Our production RPC (`rpc.goodclaw.org`, fronted by Caddy)
 * only whitelists `Content-Type` in `Access-Control-Allow-Headers`, so a
 * preflight that includes `Cache-Control` is rejected and the browser fails
 * the request with an opaque `TypeError: Failed to fetch`, which silently
 * breaks the entire /activity page. We instead express the same cache-busting
 * intent via the `cache: 'no-store'` `RequestInit` option, which instructs
 * the user agent to bypass the HTTP cache (and any intercepting service
 * worker that respects it) without adding any non-safelisted headers.
 */ __turbopack_context__.s([
    "RpcError",
    ()=>RpcError,
    "rpcCall",
    ()=>rpcCall
]);
class RpcError extends Error {
    method;
    code;
    url;
    constructor(method, code, message, url){
        super(message), this.method = method, this.code = code, this.url = url;
        this.name = 'RpcError';
    }
}
async function rpcCall(url, method, params = [], options = {}) {
    const timeoutMs = options.timeoutMs ?? 4_000;
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), timeoutMs);
    try {
        let res;
        try {
            res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                // See file docblock — `cache: 'no-store'` bypasses HTTP/SW caches
                // WITHOUT adding a non-safelisted `Cache-Control` request header
                // that would trigger a CORS preflight that the upstream RPC rejects.
                cache: 'no-store',
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method,
                    params,
                    id: 1
                }),
                signal: ctrl.signal
            });
        } catch (e) {
            const err = e;
            const code = err.name === 'AbortError' ? 'timeout' : 'network-error';
            throw new RpcError(method, code, err.message || String(err), url);
        }
        if (!res.ok) {
            throw new RpcError(method, res.status, `HTTP ${res.status}`, url);
        }
        let data;
        try {
            data = await res.json();
        } catch (e) {
            throw new RpcError(method, 'invalid-json', e.message || 'response was not valid JSON', url);
        }
        if (data?.error) {
            throw new RpcError(method, data.error.code ?? 'rpc-error', data.error.message ?? 'unknown JSON-RPC error', url);
        }
        if (data?.result === undefined) {
            throw new RpcError(method, 'no-result', 'response missing result field', url);
        }
        return data.result;
    } finally{
        clearTimeout(t);
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/ui/skeleton.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Skeleton",
    ()=>Skeleton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-client] (ecmascript)");
;
;
function Skeleton({ className, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('animate-pulse rounded-md bg-muted', className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/skeleton.tsx",
        lineNumber: 5,
        columnNumber: 5
    }, this);
}
_c = Skeleton;
;
var _c;
__turbopack_context__.k.register(_c, "Skeleton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/app/activity/block-timeline.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Block Timeline rendering helpers.
 *
 * Extracted from `activity/page.tsx` so the height/empty-state math can be
 * unit-tested in isolation. The original inline implementation had a
 * division-by-zero bug: when every block in the recent window had
 * `txCount === 0`, `Math.max(...counts)` became `0`, and `count / max`
 * produced `NaN`, which then collapsed the bar to zero height in the DOM —
 * making the entire Block Timeline card look like a blank rectangle.
 *
 * The fix is twofold:
 *  - Guard the divisor with `Math.max(1, ...)` so we always have a non-zero
 *    denominator.
 *  - Floor every bar at a small minimum (default 4px) so empty blocks remain
 *    visible as ticks.
 *
 * The caller is responsible for showing an explicit "no activity" empty-state
 * copy when `blocks.length === 0` or when no block has any transactions —
 * this helper just makes the math safe.
 */ __turbopack_context__.s([
    "computeBarHeights",
    ()=>computeBarHeights
]);
function computeBarHeights(blocks, chartHeightPx = 64, minBarPx = 4) {
    if (blocks.length === 0) return [];
    const counts = blocks.map((b)=>b.txCount);
    const max = Math.max(1, ...counts);
    return blocks.map((b)=>({
            height: Math.max(minBarPx, b.txCount / max * chartHeightPx),
            hasTxs: b.txCount > 0
        }));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/priceSource.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * priceSource — shared discriminated union for the provenance of every
 * price rendered anywhere in the app.
 *
 * Lane 4 (`0007d-app-integration`) requires every visible price to carry
 * a single, honest attribution. This module is the canonical helper:
 *
 *   resolvePriceSource({ chainOk, statusQuote, coinGeckoLive, hasFallback })
 *
 * Returns one of:
 *   - `chain-oracle`  — on-chain `*PriceOracle` answered with a sane value
 *   - `etoro-demo`    — price-service marks the symbol as eToro-fed
 *   - `coingecko`     — CoinGecko proxy returned a live value
 *   - `fallback`      — only the static seed is available (cached, fabricated)
 *   - `stale`         — last known value is past `STALE_THRESHOLD_MS`
 *   - `closed`        — sessionState is `closed` or `halted`
 *   - `unknown`       — no signal whatsoever
 *
 * The function is pure. No React, no fetch.
 */ __turbopack_context__.s([
    "STALE_THRESHOLD_MS",
    ()=>STALE_THRESHOLD_MS,
    "WARN_THRESHOLD_MS",
    ()=>WARN_THRESHOLD_MS,
    "priceSourceLabel",
    ()=>priceSourceLabel,
    "resolvePriceSource",
    ()=>resolvePriceSource
]);
const STALE_THRESHOLD_MS = 60_000;
const WARN_THRESHOLD_MS = 15_000;
function resolvePriceSource(input) {
    const { chainOk, coinGeckoLive = false, hasFallback = false, statusQuote } = input;
    if (chainOk) return 'chain-oracle';
    if (statusQuote) {
        const session = statusQuote.sessionState;
        if (session === 'closed' || session === 'halted') return 'closed';
        if (statusQuote.lastUpdateMs > STALE_THRESHOLD_MS) return 'stale';
        if (statusQuote.source === 'etoro') return 'etoro-demo';
    }
    if (coinGeckoLive) return 'coingecko';
    if (hasFallback) return 'fallback';
    return 'unknown';
}
function priceSourceLabel(source) {
    switch(source){
        case 'chain-oracle':
            return 'Chain oracle';
        case 'etoro-demo':
            return 'eToro demo';
        case 'coingecko':
            return 'Cached (CoinGecko)';
        case 'fallback':
            return 'Fallback price';
        case 'stale':
            return 'Stale';
        case 'closed':
            return 'Market closed';
        case 'unknown':
            return 'Unknown';
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/PriceSourceBadge.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PriceSourceBadge",
    ()=>PriceSourceBadge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$priceSource$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/priceSource.ts [app-client] (ecmascript)");
'use client';
;
;
function PriceSourceBadge({ source, size = 'md', className = '' }) {
    const label = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$priceSource$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["priceSourceLabel"])(source);
    const variant = VARIANTS[source];
    const dotSize = size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5';
    const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
    const gap = size === 'sm' ? 'gap-1' : 'gap-1.5';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "price-source-badge",
        "data-source": source,
        "aria-label": `Price source: ${label}`,
        className: `inline-flex items-center ${gap} ${textSize} ${variant.textClass} ${className}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "data-testid": "price-source-dot",
                "aria-hidden": "true",
                className: `${dotSize} rounded-full ${variant.dotClass} ${variant.animateClass ?? ''}`
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PriceSourceBadge.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: label
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PriceSourceBadge.tsx",
                lineNumber: 41,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/PriceSourceBadge.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
_c = PriceSourceBadge;
const VARIANTS = {
    'chain-oracle': {
        dotClass: 'bg-green-400',
        textClass: 'text-green-400',
        animateClass: 'animate-pulse'
    },
    'etoro-demo': {
        dotClass: 'bg-sky-400',
        textClass: 'text-sky-400'
    },
    'coingecko': {
        dotClass: 'bg-gray-400',
        textClass: 'text-gray-400'
    },
    'fallback': {
        dotClass: 'bg-yellow-400',
        textClass: 'text-yellow-400'
    },
    'stale': {
        dotClass: 'bg-amber-400',
        textClass: 'text-amber-400'
    },
    'closed': {
        dotClass: 'bg-gray-500',
        textClass: 'text-gray-400'
    },
    'unknown': {
        dotClass: 'bg-gray-600',
        textClass: 'text-gray-500'
    }
};
var _c;
__turbopack_context__.k.register(_c, "PriceSourceBadge");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/LivePriceCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LivePriceCard",
    ()=>LivePriceCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/PriceSourceBadge.tsx [app-client] (ecmascript)");
'use client';
;
;
;
function formatPrice(value) {
    if (!Number.isFinite(value)) return '$–';
    if (Math.abs(value) >= 1000) return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
    if (Math.abs(value) >= 1) return `$${value.toFixed(2)}`;
    if (Math.abs(value) >= 0.01) return `$${value.toFixed(4)}`;
    return `$${value.toFixed(6)}`;
}
function formatAge(ms) {
    if (ms == null) return 'just now';
    if (ms < 1000) return 'just now';
    if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
    return `${Math.floor(ms / 3_600_000)}h ago`;
}
/**
 * Source-aware freshness line. Honest about whether the displayed value is
 * actually fresh: `fallback` / `closed` / `unknown` carry no age (because the
 * underlying number isn't the result of a refresh tick), `stale` reads
 * "Last seen" not "Updated", and only the live sources show "Updated …".
 */ function freshnessText(source, ms) {
    switch(source){
        case 'chain-oracle':
        case 'etoro-demo':
        case 'coingecko':
            return {
                text: `Updated ${formatAge(ms)}`,
                tone: 'normal'
            };
        case 'stale':
            return {
                text: `Last seen ${formatAge(ms)}`,
                tone: 'warning'
            };
        case 'closed':
            return {
                text: 'Market closed',
                tone: 'normal'
            };
        case 'fallback':
            return {
                text: 'No live data',
                tone: 'normal'
            };
        case 'unknown':
            return {
                text: 'No data',
                tone: 'normal'
            };
    }
}
const WARNING_SOURCES = new Set([
    'closed',
    'stale'
]);
function LivePriceCard(props) {
    const { symbol, price, change24h, source, updatedAgoMs, compact = false, className = '' } = props;
    const isFallback = source === 'fallback';
    const showWarning = WARNING_SOURCES.has(source);
    const changeColor = change24h == null ? 'text-gray-500' : change24h > 0 ? 'text-green-400' : change24h < 0 ? 'text-red-400' : 'text-gray-400';
    const changeText = change24h == null ? '' : `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-testid": "live-price-card",
        className: `flex flex-col ${compact ? 'p-2.5' : 'p-3'} min-w-[120px] rounded-xl bg-dark-100/70 border border-gray-700/30 ${className}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mb-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs font-semibold text-gray-300",
                        children: symbol
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                        lineNumber: 98,
                        columnNumber: 9
                    }, this),
                    showWarning && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                        "data-testid": "live-price-warning",
                        "aria-label": source === 'closed' ? 'Market closed' : 'Stale price',
                        className: "size-3.5 text-amber-400 shrink-0"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                        lineNumber: 100,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 97,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "live-price",
                className: `font-semibold ${compact ? 'text-sm' : 'text-base'} ${isFallback ? 'text-gray-500 opacity-70' : 'text-white'}`,
                ...isFallback ? {
                    'data-testid-fallback': ''
                } : {},
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    "data-testid": isFallback ? 'fallback-price' : undefined,
                    children: formatPrice(price)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                    lineNumber: 113,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 108,
                columnNumber: 7
            }, this),
            !compact && change24h != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "live-price-change",
                className: `text-[11px] mt-0.5 ${changeColor}`,
                children: changeText
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 117,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mt-2 gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceSourceBadge"], {
                        source: source,
                        size: "sm"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                        lineNumber: 126,
                        columnNumber: 9
                    }, this),
                    (()=>{
                        const { text, tone } = freshnessText(source, updatedAgoMs);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            "data-testid": "live-price-freshness",
                            className: `text-[10px] shrink-0 ${tone === 'warning' ? 'text-amber-400' : 'text-gray-500'}`,
                            children: text
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                            lineNumber: 130,
                            columnNumber: 13
                        }, this);
                    })()
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 125,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
        lineNumber: 93,
        columnNumber: 5
    }, this);
}
_c = LivePriceCard;
var _c;
__turbopack_context__.k.register(_c, "LivePriceCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/LivePriceStrip.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LivePriceStrip",
    ()=>LivePriceStrip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/LivePriceCard.tsx [app-client] (ecmascript)");
'use client';
;
;
const DEFAULT_EMPTY_MESSAGE = 'No positions yet — connect a wallet to track live prices for the stocks and crypto you hold.';
function LivePriceStrip({ entries, compact = false, className = '', title, loading = false, emptyMessage = DEFAULT_EMPTY_MESSAGE }) {
    const isEmpty = entries.length === 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `w-full ${className}`,
        children: [
            title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-xs uppercase tracking-wider text-gray-500 mb-2 px-1",
                children: title
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                lineNumber: 53,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "live-price-strip",
                className: "flex items-stretch gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide",
                children: [
                    isEmpty && loading && Array.from({
                        length: 3
                    }, (_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            "data-testid": "live-price-skeleton",
                            className: "min-w-[120px] h-[78px] rounded-xl bg-dark-100/70 border border-gray-700/30 animate-pulse",
                            "aria-hidden": "true"
                        }, `skeleton-${i}`, false, {
                            fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                            lineNumber: 61,
                            columnNumber: 13
                        }, this)),
                    isEmpty && !loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "data-testid": "live-price-empty",
                        role: "status",
                        className: "flex-1 min-w-0 flex items-center gap-2 rounded-xl bg-dark-100/70 border border-gray-700/30 px-3 py-3 text-xs text-gray-400",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "aria-hidden": "true",
                                className: "inline-block w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                                lineNumber: 75,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "leading-snug",
                                children: emptyMessage
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                                lineNumber: 79,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                        lineNumber: 70,
                        columnNumber: 11
                    }, this),
                    !isEmpty && entries.map((e)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LivePriceCard"], {
                            ...e,
                            compact: compact
                        }, e.symbol, false, {
                            fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                            lineNumber: 83,
                            columnNumber: 11
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
        lineNumber: 51,
        columnNumber: 5
    }, this);
}
_c = LivePriceStrip;
var _c;
__turbopack_context__.k.register(_c, "LivePriceStrip");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/usePriceFeeds.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FALLBACK_PRICES",
    ()=>FALLBACK_PRICES,
    "__resetPriceFeedStoreForTests",
    ()=>__resetPriceFeedStoreForTests,
    "getPrice",
    ()=>getPrice,
    "usePriceFeeds",
    ()=>usePriceFeeds
]);
/**
 * usePriceFeeds — live USD price data via CoinGecko public API.
 *
 * Architecture: shared module-level singleton.
 *  - One fetch per refresh tick, regardless of how many components subscribe.
 *  - One setInterval, started on first subscriber, cleared on last unsubscribe.
 *  - Subscribers union their requested symbols into a single tracked set.
 *  - When a brand-new symbol is added, an immediate refetch fires so the new
 *    consumer does not wait up to 60s for its data.
 *
 * Falls back to static mock prices when:
 *  - the fetch fails (network error, rate limit)
 *  - running in a test environment (no window)
 *  - the symbol is not in the CoinGecko mapping
 *
 * Prices refresh every 60 seconds.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
// ─── CoinGecko ID mapping ─────────────────────────────────────────────────────
const COINGECKO_IDS = {
    ETH: 'ethereum',
    WETH: 'ethereum',
    WBTC: 'wrapped-bitcoin',
    USDC: 'usd-coin',
    USDT: 'tether',
    DAI: 'dai',
    'G$': 'good-dollar',
    LINK: 'chainlink',
    UNI: 'uniswap',
    AAVE: 'aave',
    ARB: 'arbitrum',
    OP: 'optimism',
    MKR: 'maker',
    COMP: 'compound-governance-token',
    SNX: 'havven',
    CRV: 'curve-dao-token',
    LDO: 'lido-dao',
    MATIC: 'matic-network'
};
const FALLBACK_PRICES = {
    ETH: 3012.45,
    WETH: 3012.45,
    WBTC: 60125.80,
    USDC: 1.00,
    USDT: 1.00,
    DAI: 1.00,
    'G$': 0.0102,
    LINK: 14.85,
    UNI: 7.92,
    AAVE: 89.50,
    ARB: 1.18,
    OP: 2.45,
    MKR: 2814.00,
    COMP: 49.80,
    SNX: 2.95,
    CRV: 0.58,
    LDO: 2.18,
    MATIC: 0.71
};
// ─── Fetch helper ─────────────────────────────────────────────────────────────
const REFRESH_MS = 60_000;
async function fetchCoinGeckoQuotes(symbols) {
    // Compute client-side "unknown" set up front so we surface it even when we
    // early-return without hitting the server, or when the server response is
    // the legacy shape (no unknownSymbols field).
    const clientUnknown = symbols.filter((s)=>!COINGECKO_IDS[s]);
    const ids = Array.from(new Set(symbols.map((s)=>COINGECKO_IDS[s]).filter(Boolean)));
    if (ids.length === 0) {
        return {
            prices: {},
            quotes: {},
            unknownSymbols: clientUnknown
        };
    }
    const res = await fetch(`/api/prices?symbols=${symbols.join(',')}`);
    // Task 0027: the server now returns 400 + `code: "no_supported_symbols"`
    // when every requested symbol is unmapped. Defensively handle that — even
    // though `ids.length === 0` above usually short-circuits first, the
    // server's symbol table and the client's can drift.
    if (res.status === 400) {
        let body = {};
        try {
            body = await res.json();
        } catch  {}
        if (body.code === 'no_supported_symbols') {
            const reported = Array.isArray(body.details?.unknownSymbols) ? body.details.unknownSymbols.filter((x)=>typeof x === 'string') : symbols;
            return {
                prices: {},
                quotes: {},
                unknownSymbols: reported
            };
        }
    }
    if (!res.ok) throw new Error(`Price proxy ${res.status}`);
    const data = await res.json();
    const serverUnknown = Array.isArray(data.unknownSymbols) ? data.unknownSymbols.filter((x)=>typeof x === 'string') : null;
    const prices = {};
    const quotes = {};
    for (const sym of symbols){
        const id = COINGECKO_IDS[sym];
        if (!id) continue;
        const entry = data[id];
        if (!entry || typeof entry.usd !== 'number') continue;
        prices[sym] = entry.usd;
        quotes[sym] = {
            price: entry.usd,
            change24h: typeof entry.usd_24h_change === 'number' ? entry.usd_24h_change : 0,
            volume24h: typeof entry.usd_24h_vol === 'number' ? entry.usd_24h_vol : 0,
            marketCap: typeof entry.usd_market_cap === 'number' ? entry.usd_market_cap : 0
        };
    }
    // Prefer the server's view (authoritative re: supported symbols today),
    // fall back to the client-computed set for legacy/mocked responses.
    return {
        prices,
        quotes,
        unknownSymbols: serverUnknown ?? clientUnknown
    };
}
const store = {
    state: {
        prices: FALLBACK_PRICES,
        quotes: {},
        isLive: false,
        lastUpdated: null,
        error: null,
        unknownSymbols: [],
        sources: {}
    },
    refs: new Map(),
    subscribers: new Set(),
    intervalId: null,
    inFlight: false
};
function notify() {
    for (const sub of store.subscribers)sub(store.state);
}
function trackedSymbols() {
    return Array.from(store.refs.keys());
}
async function refresh() {
    if (store.inFlight) return;
    // Skip work while the tab is hidden so a backgrounded landing page does not
    // ping CoinGecko forever. handleVisibilityChange below fires an immediate
    // refresh the moment the tab becomes visible again so prices stay fresh.
    if (typeof document !== 'undefined' && document.hidden) return;
    const symbols = trackedSymbols();
    if (symbols.length === 0) return;
    store.inFlight = true;
    try {
        const { prices: live, quotes, unknownSymbols } = await fetchCoinGeckoQuotes(symbols);
        const nextSources = {};
        for (const sym of symbols){
            nextSources[sym] = live[sym] !== undefined ? 'coingecko' : 'fallback';
        }
        store.state = {
            prices: {
                ...store.state.prices,
                ...live
            },
            quotes: {
                ...store.state.quotes,
                ...quotes
            },
            isLive: Object.keys(live).length > 0,
            lastUpdated: new Date(),
            error: null,
            // Replace (don't accumulate) so dropping a subscriber that was the only
            // one asking for an unknown symbol also drops it from the surfaced list.
            // We always send the full trackedSymbols() set, so the response covers it.
            unknownSymbols,
            sources: {
                ...store.state.sources,
                ...nextSources
            }
        };
    } catch (err) {
        const fallbackSources = {
            ...store.state.sources
        };
        for (const sym of symbols)fallbackSources[sym] = 'fallback';
        store.state = {
            ...store.state,
            isLive: false,
            error: err instanceof Error ? err.message : 'Price feed unavailable',
            sources: fallbackSources
        };
    } finally{
        store.inFlight = false;
        notify();
    }
}
/**
 * Module-level handler so add/remove pair on the exact same reference.
 * Fires one immediate refresh when the tab returns to the foreground.
 */ function handleVisibilityChange() {
    if (typeof document === 'undefined') return;
    if (!document.hidden) void refresh();
}
function startIntervalIfNeeded() {
    if (store.intervalId !== null) return;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
     // SSR: no interval
    store.intervalId = setInterval(refresh, REFRESH_MS);
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }
}
function stopIntervalIfIdle() {
    if (store.subscribers.size > 0) return;
    if (store.intervalId !== null) {
        clearInterval(store.intervalId);
        store.intervalId = null;
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    }
}
/**
 * Increment refcount for each symbol; return the list of symbols that became
 * tracked for the first time (we'll trigger an immediate refetch for those).
 */ function acquire(symbols) {
    const newlyTracked = [];
    for (const sym of symbols){
        const cur = store.refs.get(sym) ?? 0;
        if (cur === 0) newlyTracked.push(sym);
        store.refs.set(sym, cur + 1);
    }
    return newlyTracked;
}
function release(symbols) {
    for (const sym of symbols){
        const cur = store.refs.get(sym) ?? 0;
        if (cur <= 1) {
            store.refs.delete(sym);
        } else {
            store.refs.set(sym, cur - 1);
        }
    }
}
function __resetPriceFeedStoreForTests() {
    if (store.intervalId !== null) {
        clearInterval(store.intervalId);
        store.intervalId = null;
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    }
    store.refs.clear();
    store.subscribers.clear();
    store.inFlight = false;
    store.state = {
        prices: FALLBACK_PRICES,
        quotes: {},
        isLive: false,
        lastUpdated: null,
        error: null,
        unknownSymbols: [],
        sources: {}
    };
}
function usePriceFeeds(symbols) {
    _s();
    const [snapshot, setSnapshot] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(store.state);
    // Stable key so we only re-subscribe when the symbol set actually changes.
    const key = symbols.join(',');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "usePriceFeeds.useEffect": ()=>{
            const subscriber = {
                "usePriceFeeds.useEffect.subscriber": (next)=>setSnapshot(next)
            }["usePriceFeeds.useEffect.subscriber"];
            store.subscribers.add(subscriber);
            const newlyTracked = acquire(symbols);
            startIntervalIfNeeded();
            // If we added symbols not previously tracked, kick an immediate fetch so
            // this consumer doesn't wait up to 60s for first data.
            if (newlyTracked.length > 0) {
                void refresh();
            } else {
                // Sync the new subscriber to the latest state once.
                setSnapshot(store.state);
            }
            return ({
                "usePriceFeeds.useEffect": ()=>{
                    store.subscribers.delete(subscriber);
                    release(symbols);
                    stopIntervalIfIdle();
                }
            })["usePriceFeeds.useEffect"];
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["usePriceFeeds.useEffect"], [
        key
    ]);
    return snapshot;
}
_s(usePriceFeeds, "W+4Q255jx141yV6+gTsNlFWfkPE=");
function getPrice(prices, symbol) {
    return prices[symbol] ?? FALLBACK_PRICES[symbol] ?? 0;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/usePriceServiceStatus.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "__resetPriceServiceStatusStoreForTests",
    ()=>__resetPriceServiceStatusStoreForTests,
    "getDominantSession",
    ()=>getDominantSession,
    "getSessionLabel",
    ()=>getSessionLabel,
    "refreshPriceServiceStatus",
    ()=>refreshPriceServiceStatus,
    "resolvePriceStatusEndpoint",
    ()=>resolvePriceStatusEndpoint,
    "usePriceServiceStatus",
    ()=>usePriceServiceStatus
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
function sanitizeBaseUrl(url) {
    return url.replace(/\/+$/, '');
}
function resolvePriceStatusEndpoint(explicitBaseUrl) {
    const baseUrl = (explicitBaseUrl ?? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? '').trim();
    if (!baseUrl) return '/api/status/quotes';
    return `${sanitizeBaseUrl(baseUrl)}/status/quotes`;
}
const PRICE_STATUS_ENDPOINT = resolvePriceStatusEndpoint();
const POLL_INTERVAL_MS = 10_000;
const FAILURE_BACKOFF_BASE_MS = 15_000;
const FAILURE_BACKOFF_MAX_MS = 120_000;
const store = {
    state: {
        status: null,
        isLoading: true,
        error: null,
        nextRetryAt: null
    },
    subscribers: new Set(),
    intervalId: null,
    inFlight: false,
    failureCount: 0,
    cooldownUntil: 0
};
function notify() {
    for (const sub of store.subscribers)sub(store.state);
}
async function fetchStatus(force = false) {
    if (store.inFlight) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    if (!force && Date.now() < store.cooldownUntil) return;
    store.inFlight = true;
    try {
        const res = await fetch(PRICE_STATUS_ENDPOINT, {
            signal: AbortSignal.timeout(5000)
        });
        if (!res.ok) throw new Error(`Status endpoint returned ${res.status}`);
        const data = await res.json();
        store.failureCount = 0;
        store.cooldownUntil = 0;
        store.state = {
            status: data,
            isLoading: false,
            error: null,
            nextRetryAt: null
        };
    } catch (err) {
        store.failureCount += 1;
        const backoffMs = Math.min(FAILURE_BACKOFF_MAX_MS, FAILURE_BACKOFF_BASE_MS * 2 ** Math.max(0, store.failureCount - 1));
        store.cooldownUntil = Date.now() + backoffMs;
        store.state = {
            ...store.state,
            isLoading: false,
            error: err instanceof Error ? err.message : 'Oracle status unavailable',
            nextRetryAt: store.cooldownUntil
        };
    } finally{
        store.inFlight = false;
        notify();
    }
}
function startPolling() {
    if (store.intervalId !== null) return;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    store.intervalId = setInterval(fetchStatus, POLL_INTERVAL_MS);
}
function stopPolling() {
    if (store.subscribers.size > 0) return;
    if (store.intervalId !== null) {
        clearInterval(store.intervalId);
        store.intervalId = null;
    }
}
function usePriceServiceStatus() {
    _s();
    const [snapshot, setSnapshot] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(store.state);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "usePriceServiceStatus.useEffect": ()=>{
            const subscriber = {
                "usePriceServiceStatus.useEffect.subscriber": (next)=>setSnapshot(next)
            }["usePriceServiceStatus.useEffect.subscriber"];
            store.subscribers.add(subscriber);
            startPolling();
            if (!store.state.status && !store.inFlight) {
                void fetchStatus();
            } else {
                setSnapshot(store.state);
            }
            return ({
                "usePriceServiceStatus.useEffect": ()=>{
                    store.subscribers.delete(subscriber);
                    stopPolling();
                }
            })["usePriceServiceStatus.useEffect"];
        }
    }["usePriceServiceStatus.useEffect"], []);
    return snapshot;
}
_s(usePriceServiceStatus, "W+4Q255jx141yV6+gTsNlFWfkPE=");
function getSessionLabel(state) {
    switch(state){
        case 'open':
            return 'Market Open';
        case 'pre-market':
            return 'Pre-Market';
        case 'after-hours':
            return 'After Hours';
        case 'closed':
            return 'Market Closed';
        case 'halted':
            return 'Halted';
        default:
            return 'Unknown';
    }
}
async function refreshPriceServiceStatus(force = true) {
    await fetchStatus(force);
}
function getDominantSession(quotes) {
    if (quotes.length === 0) return 'unknown';
    const counts = new Map();
    for (const q of quotes){
        counts.set(q.sessionState, (counts.get(q.sessionState) ?? 0) + 1);
    }
    let max = 0;
    let dominant = 'unknown';
    for (const [state, count] of counts){
        if (count > max) {
            max = count;
            dominant = state;
        }
    }
    return dominant;
}
function __resetPriceServiceStatusStoreForTests() {
    if (store.intervalId !== null) {
        clearInterval(store.intervalId);
    }
    store.state = {
        status: null,
        isLoading: true,
        error: null,
        nextRetryAt: null
    };
    store.subscribers.clear();
    store.intervalId = null;
    store.inFlight = false;
    store.failureCount = 0;
    store.cooldownUntil = 0;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/ActivityPriceStrip.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ActivityPriceStrip",
    ()=>ActivityPriceStrip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/LivePriceStrip.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceFeeds.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceServiceStatus.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
const ACTIVITY_SYMBOLS = [
    'ETH',
    'USDC',
    'G$',
    'WBTC'
];
function ActivityPriceStrip() {
    _s();
    const { prices, sources, quotes, lastUpdated } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceFeeds"])([
        ...ACTIVITY_SYMBOLS
    ]);
    const { status } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceServiceStatus"])();
    const [now, setNow] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "ActivityPriceStrip.useState": ()=>Date.now()
    }["ActivityPriceStrip.useState"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ActivityPriceStrip.useEffect": ()=>{
            const id = setInterval({
                "ActivityPriceStrip.useEffect.id": ()=>setNow(Date.now())
            }["ActivityPriceStrip.useEffect.id"], 1000);
            return ({
                "ActivityPriceStrip.useEffect": ()=>clearInterval(id)
            })["ActivityPriceStrip.useEffect"];
        }
    }["ActivityPriceStrip.useEffect"], []);
    const updatedAgoMs = lastUpdated ? now - lastUpdated.getTime() : null;
    const entries = ACTIVITY_SYMBOLS.map((sym)=>{
        let source = sources[sym] ?? 'unknown';
        const sq = status?.quotes.find((q)=>q.symbol === sym);
        if (sq && sq.lastUpdateMs > 60_000) source = 'stale';
        if (sq && (sq.sessionState === 'closed' || sq.sessionState === 'halted')) source = 'closed';
        return {
            symbol: sym,
            price: prices[sym] ?? 0,
            change24h: quotes[sym]?.change24h ?? null,
            source,
            updatedAgoMs
        };
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LivePriceStrip"], {
        entries: entries
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ActivityPriceStrip.tsx",
        lineNumber: 44,
        columnNumber: 10
    }, this);
}
_s(ActivityPriceStrip, "vczpDULuZGDX6IwgbwAEM7ZRM9E=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceFeeds"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceServiceStatus"]
    ];
});
_c = ActivityPriceStrip;
var _c;
__turbopack_context__.k.register(_c, "ActivityPriceStrip");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/app/activity/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ActivityPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$rpc$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/rpc.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/skeleton.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$app$2f$activity$2f$block$2d$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/app/activity/block-timeline.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ActivityPriceStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ActivityPriceStrip.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
const RPC_URL = '/api/rpc';
// Visibility-gated polling cadence — see task 0096. Tab-hidden ticks become
// no-ops so a forgotten tab cannot pummel the RPC. Value stays at 10s for
// continuity with the previous behaviour; out of scope to change it here.
const POLL_INTERVAL_MS = 10_000;
const TESTERS = [
    {
        name: 'Tester Alpha',
        role: 'Swaps & Lending',
        address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        color: '#10b981',
        emoji: '🟢'
    },
    {
        name: 'Tester Beta',
        role: 'Perps & Predictions',
        address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        color: '#f59e0b',
        emoji: '🟡'
    },
    {
        name: 'Tester Gamma',
        role: 'Stocks & Stress',
        address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        color: '#ef4444',
        emoji: '🔴'
    }
];
// Reverse map: lowercase address → contract name, derived from canonical devnet config
const CONTRACTS = Object.fromEntries(_c1 = Object.entries(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"]).map(_c = ([name, addr])=>[
        addr.toLowerCase(),
        name
    ]));
_c2 = CONTRACTS;
const TESTER_ADDRS = new Set(TESTERS.map((t)=>t.address.toLowerCase()));
// Strict JSON-RPC helper — throws RpcError on any error path (non-2xx,
// JSON-RPC error envelope, missing result, network failure, 4s timeout).
// Previously this was an inline helper that swallowed errors and returned
// `undefined`, which `hexToNumber(undefined)` coerced to `0`, rendering as
// "Block #0" beside a green "Live" pulse. See task 0069.
function rpcCall(method, params = []) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$rpc$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["rpcCall"])(RPC_URL, method, params);
}
function hexToNumber(hex) {
    if (!hex) return 0;
    return parseInt(hex, 16);
}
function hexToEth(hex) {
    if (!hex) return '0.0000';
    const wei = BigInt(hex);
    const eth = Number(wei) / 1e18;
    return eth.toFixed(eth < 1 ? 4 : 2);
}
function shortenHash(hash) {
    return hash.slice(0, 10) + '…' + hash.slice(-6);
}
function getContractName(addr) {
    return CONTRACTS[addr.toLowerCase()] || shortenHash(addr);
}
function getTesterInfo(addr) {
    return TESTERS.find((t)=>t.address.toLowerCase() === addr.toLowerCase());
}
function timeAgo(timestamp) {
    const diff = Math.floor(Date.now() / 1000) - timestamp;
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
}
function ActivityPage() {
    _s();
    const [transactions, setTransactions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [testerStats, setTesterStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [blocks, setBlocks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [contractHits, setContractHits] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [currentBlock, setCurrentBlock] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [lastUpdate, setLastUpdate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // RpcError surfaces fetch failures as a visible banner with retry, instead
    // of silently anchoring the page at "Block #0" with a green "Live" pulse.
    const [rpcError, setRpcError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Cache the last block we performed the expensive 20-block sweep on.
    // On a quiet chain the head advances slower than the 10s poll cadence,
    // so re-fetching 20 blocks + ~40 receipts + 3×2 tester calls on every
    // tick is pure waste. See task 0096.
    const lastFetchedBlockRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(-1);
    const fetchData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ActivityPage.useCallback[fetchData]": async ()=>{
            try {
                // Get latest block number. This is the only call we ALWAYS issue —
                // the rest of the sweep short-circuits if the head hasn't advanced.
                const blockHex = await rpcCall('eth_blockNumber');
                const latestBlock = hexToNumber(blockHex);
                setCurrentBlock(latestBlock);
                // Short-circuit on unchanged head: the "Updated" timestamp still
                // ticks (gives a live-pulse feel) but we skip the heavy fanout.
                if (latestBlock === lastFetchedBlockRef.current) {
                    setLastUpdate(new Date());
                    setRpcError(null);
                    return;
                }
                // Fetch last 20 blocks. Type the promise as `EthBlock | null` —
                // anvil can return `null` for not-yet-mined blocks at the head, so we
                // narrow inside the loop instead of asserting non-null here.
                const blockPromises = [];
                const start = Math.max(0, latestBlock - 19);
                for(let i = latestBlock; i >= start; i--){
                    blockPromises.push(rpcCall('eth_getBlockByNumber', [
                        '0x' + i.toString(16),
                        true
                    ]));
                }
                const blockResults = await Promise.all(blockPromises);
                const newBlocks = [];
                const hits = {};
                const pending = [];
                for (const block of blockResults){
                    if (!block) continue;
                    const blockNum = hexToNumber(block.number);
                    const timestamp = hexToNumber(block.timestamp);
                    const txs = block.transactions || [];
                    newBlocks.push({
                        number: blockNum,
                        txCount: txs.length,
                        timestamp
                    });
                    for (const tx of txs){
                        const toAddr = tx.to?.toLowerCase() || '';
                        const contractName = CONTRACTS[toAddr];
                        if (contractName) {
                            hits[contractName] = (hits[contractName] || 0) + 1;
                        }
                        // Wrap the receipt call so a single failure cannot reject the
                        // outer Promise.all — receipts may be `null` for in-flight txs.
                        const receiptPromise = rpcCall('eth_getTransactionReceipt', [
                            tx.hash
                        ]).catch({
                            "ActivityPage.useCallback[fetchData].receiptPromise": ()=>null
                        }["ActivityPage.useCallback[fetchData].receiptPromise"]);
                        pending.push({
                            tx,
                            blockNum,
                            timestamp,
                            receiptPromise
                        });
                    }
                }
                // Pass 2: await ALL receipts in parallel.
                const receipts = await Promise.all(pending.map({
                    "ActivityPage.useCallback[fetchData]": (p)=>p.receiptPromise
                }["ActivityPage.useCallback[fetchData]"]));
                const allTxs = pending.map({
                    "ActivityPage.useCallback[fetchData].allTxs": (p, i)=>{
                        const receipt = receipts[i];
                        const toAddr = p.tx.to?.toLowerCase() || '';
                        let status = 'pending';
                        let gasUsed = '0';
                        if (receipt) {
                            status = receipt.status === '0x1' ? 'success' : 'failed';
                            gasUsed = hexToNumber(receipt.gasUsed).toLocaleString();
                        }
                        return {
                            hash: p.tx.hash,
                            from: p.tx.from,
                            to: p.tx.to || '(contract creation)',
                            value: p.tx.value,
                            blockNumber: p.blockNum,
                            timestamp: p.timestamp,
                            status,
                            gasUsed,
                            contractName: CONTRACTS[toAddr] || ''
                        };
                    }
                }["ActivityPage.useCallback[fetchData].allTxs"]);
                setBlocks(newBlocks);
                setTransactions(allTxs.slice(0, 50));
                setContractHits(hits);
                // Fetch tester stats. Both calls return a 0x-prefixed hex string;
                // typing them as `EthHex` keeps `hexToEth` / `hexToNumber` strict.
                const testerPromises = TESTERS.map({
                    "ActivityPage.useCallback[fetchData].testerPromises": async (t)=>{
                        const [balHex, nonceHex] = await Promise.all([
                            rpcCall('eth_getBalance', [
                                t.address,
                                'latest'
                            ]),
                            rpcCall('eth_getTransactionCount', [
                                t.address,
                                'latest'
                            ])
                        ]);
                        return {
                            ...t,
                            balance: hexToEth(balHex),
                            nonce: hexToNumber(nonceHex)
                        };
                    }
                }["ActivityPage.useCallback[fetchData].testerPromises"]);
                setTesterStats(await Promise.all(testerPromises));
                // Only record the new head AFTER all the heavy fetches succeeded —
                // a thrown RpcError in the middle of the sweep must NOT mark the
                // block as "already fetched", or the retry button would short-circuit.
                lastFetchedBlockRef.current = latestBlock;
                setLastUpdate(new Date());
                setLoading(false);
                setRpcError(null);
            } catch (e) {
                if (e instanceof __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$rpc$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RpcError"]) {
                    // Rate limits / upstream RPC failures are surfaced in the page banner;
                    // keep them out of console.error so route-smoke E2E only fails on true
                    // unhandled application errors.
                    console.warn('RPC fetch warning:', e.message);
                    setRpcError(e);
                } else {
                    console.error('Fetch error:', e);
                    // Wrap non-RpcError failures so the banner still renders with useful
                    // context instead of leaving the page in a silent indeterminate state.
                    setRpcError(new __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$rpc$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RpcError"]('unknown', 'unexpected', e?.message || String(e), RPC_URL));
                }
                setLoading(false);
            }
        }
    }["ActivityPage.useCallback[fetchData]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ActivityPage.useEffect": ()=>{
            // Initial fetch. We always run this, even if the tab starts hidden —
            // the user must see SOMETHING on first mount, and the visibility gate
            // only protects the recurring poll.
            fetchData();
            // Tab-visibility-aware polling. The interval fires every 10s but the
            // tick is a no-op while the tab is hidden — a forgotten tab will not
            // continue hammering the RPC. When the tab becomes visible again we
            // also do an immediate catch-up fetch so the data isn't stale by up
            // to 10s. See task 0096.
            const interval = setInterval({
                "ActivityPage.useEffect.interval": ()=>{
                    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
                    fetchData();
                }
            }["ActivityPage.useEffect.interval"], POLL_INTERVAL_MS);
            const onVisibilityChange = {
                "ActivityPage.useEffect.onVisibilityChange": ()=>{
                    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                        fetchData();
                    }
                }
            }["ActivityPage.useEffect.onVisibilityChange"];
            if (typeof document !== 'undefined') {
                document.addEventListener('visibilitychange', onVisibilityChange);
            }
            return ({
                "ActivityPage.useEffect": ()=>{
                    clearInterval(interval);
                    if (typeof document !== 'undefined') {
                        document.removeEventListener('visibilitychange', onVisibilityChange);
                    }
                }
            })["ActivityPage.useEffect"];
        }
    }["ActivityPage.useEffect"], [
        fetchData
    ]);
    const barHeights = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$app$2f$activity$2f$block$2d$timeline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["computeBarHeights"])(blocks);
    const reversedBlocks = blocks.slice().reverse();
    const reversedHeights = barHeights.slice().reverse();
    const totalTxsInWindow = blocks.reduce((sum, b)=>sum + b.txCount, 0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-5xl mx-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ActivityPriceStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ActivityPriceStrip"], {}, void 0, false, {
                    fileName: "[project]/frontend/src/app/activity/page.tsx",
                    lineNumber: 297,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/activity/page.tsx",
                lineNumber: 296,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-2xl font-bold text-white",
                                children: "Live Activity"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 303,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-400 mt-1",
                                "data-testid": "activity-subtitle",
                                children: currentBlock === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        "Connecting to chain ",
                                        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DEVNET_CHAIN_ID"],
                                        "…"
                                    ]
                                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        "Block #",
                                        currentBlock.toLocaleString(),
                                        " • Chain ",
                                        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DEVNET_CHAIN_ID"],
                                        lastUpdate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: [
                                                " • Updated ",
                                                lastUpdate.toLocaleTimeString()
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/app/activity/page.tsx",
                                            lineNumber: 310,
                                            columnNumber: 32
                                        }, this)
                                    ]
                                }, void 0, true)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 304,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                        lineNumber: 302,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `inline-block w-2 h-2 rounded-full animate-pulse ${rpcError ? 'bg-red-400' : 'bg-goodgreen'}`
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 316,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `text-xs ${rpcError ? 'text-red-400' : 'text-goodgreen'}`,
                                children: rpcError ? 'Offline' : 'Live'
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 321,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                        lineNumber: 315,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/activity/page.tsx",
                lineNumber: 301,
                columnNumber: 7
            }, this),
            rpcError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                role: "alert",
                className: "mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3",
                "data-testid": "activity-rpc-error",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 text-sm text-red-200",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-semibold",
                                children: "Couldn’t reach the chain RPC."
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 334,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs text-red-300/80 mt-1 font-mono break-all",
                                children: [
                                    rpcError.method,
                                    " → ",
                                    rpcError.url,
                                    " (",
                                    rpcError.message,
                                    ")"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 335,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                        lineNumber: 333,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>fetchData(),
                        "aria-label": "Retry chain RPC fetch",
                        className: "self-start sm:self-auto px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold",
                        children: "Retry now"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                        lineNumber: 339,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/activity/page.tsx",
                lineNumber: 328,
                columnNumber: 9
            }, this),
            loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8",
                children: [
                    ...Array(3)
                ].map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-2xl bg-dark-100/60 border border-gray-700/30 p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 mb-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Skeleton"], {
                                        className: "h-6 w-6 rounded-full"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 355,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Skeleton"], {
                                                className: "h-4 w-20 mb-1"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 357,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Skeleton"], {
                                                className: "h-3 w-16"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 358,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 356,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 354,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Skeleton"], {
                                                className: "h-3 w-12 mb-1"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 363,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Skeleton"], {
                                                className: "h-4 w-16"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 364,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 362,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Skeleton"], {
                                                className: "h-3 w-16 mb-1"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 367,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$skeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Skeleton"], {
                                                className: "h-4 w-12"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 368,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 366,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 361,
                                columnNumber: 15
                            }, this)
                        ]
                    }, i, true, {
                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                        lineNumber: 353,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/activity/page.tsx",
                lineNumber: 351,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8",
                        children: testerStats.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-2xl bg-dark-100/60 border border-gray-700/30 p-4 hover:border-goodgreen/30 transition-colors",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 mb-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-lg",
                                                children: t.emoji
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 381,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm font-semibold text-white",
                                                        children: t.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                        lineNumber: 383,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-xs text-gray-400",
                                                        children: t.role
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                        lineNumber: 384,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 382,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 380,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid grid-cols-2 gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-xs text-gray-500",
                                                        children: "Balance"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                        lineNumber: 389,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm font-mono text-white",
                                                        children: [
                                                            t.balance,
                                                            " ETH"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                        lineNumber: 390,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 388,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-xs text-gray-500",
                                                        children: "Transactions"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                        lineNumber: 393,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm font-mono text-goodgreen",
                                                        children: t.nonce
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                        lineNumber: 394,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 392,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 387,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 text-xs text-gray-500 font-mono truncate",
                                        children: t.address
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 397,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, t.address, true, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 379,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                        lineNumber: 377,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-2xl bg-dark-100/60 border border-gray-700/30 p-4 mb-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between mb-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-sm font-semibold text-white",
                                        children: "Block Timeline"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 407,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-gray-500",
                                        children: [
                                            totalTxsInWindow,
                                            " ",
                                            totalTxsInWindow === 1 ? 'tx' : 'txs',
                                            " in last ",
                                            blocks.length || 0,
                                            " blocks"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 408,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 406,
                                columnNumber: 13
                            }, this),
                            blocks.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col items-center justify-center h-16 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500",
                                        children: "No recent blocks available."
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 414,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[10px] text-gray-600 mt-1",
                                        children: "Waiting for chain to advance…"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 415,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 413,
                                columnNumber: 15
                            }, this) : totalTxsInWindow === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-end gap-1 h-16",
                                        role: "img",
                                        "aria-label": "No transactions in the last 20 blocks",
                                        children: reversedBlocks.map((b, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex-1 group relative",
                                                title: `Block ${b.number}: 0 txs`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "w-full rounded-t bg-gray-600/40",
                                                        style: {
                                                            height: `${reversedHeights[i].height}px`
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                        lineNumber: 426,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-dark-50 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10",
                                                        children: [
                                                            "#",
                                                            b.number,
                                                            " • 0 tx"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                        lineNumber: 430,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, b.number, true, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 421,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 419,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500 text-center mt-2",
                                        children: [
                                            "No transactions in the last ",
                                            blocks.length,
                                            " blocks. Send a swap, perp, or predict tx to light it up."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 436,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-end gap-1 h-16",
                                role: "img",
                                "aria-label": `Block transaction histogram, ${totalTxsInWindow} total transactions`,
                                children: reversedBlocks.map((b, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1 group relative",
                                        title: `Block ${b.number}: ${b.txCount} txs`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `w-full rounded-t transition-all ${reversedHeights[i].hasTxs ? 'bg-goodgreen' : 'bg-gray-600/40'}`,
                                                style: {
                                                    height: `${reversedHeights[i].height}px`
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 448,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-dark-50 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10",
                                                children: [
                                                    "#",
                                                    b.number,
                                                    " • ",
                                                    b.txCount,
                                                    " tx"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 452,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, b.number, true, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 443,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 441,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between mt-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-gray-500",
                                        children: blocks.length > 0 ? `#${blocks[blocks.length - 1]?.number}` : ''
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 460,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-gray-500",
                                        children: blocks.length > 0 ? `#${blocks[0]?.number}` : ''
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 463,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 459,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                        lineNumber: 405,
                        columnNumber: 11
                    }, this),
                    Object.keys(contractHits).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-2xl bg-dark-100/60 border border-gray-700/30 p-4 mb-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-sm font-semibold text-white mb-3",
                                children: "Contract Activity (last 20 blocks)"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 472,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2",
                                children: Object.entries(contractHits).sort(([, a], [, b])=>b - a).map(([name, count])=>{
                                    const maxHits = Math.max(...Object.values(contractHits));
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-36 text-xs text-gray-300 truncate",
                                                children: name
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 480,
                                                columnNumber: 25
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex-1 bg-gray-700/20 rounded-full h-2 overflow-hidden",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "h-full bg-goodgreen rounded-full transition-all",
                                                    style: {
                                                        width: `${count / maxHits * 100}%`
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                    lineNumber: 482,
                                                    columnNumber: 27
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 481,
                                                columnNumber: 25
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-8 text-xs text-goodgreen text-right",
                                                children: count
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 487,
                                                columnNumber: 25
                                            }, this)
                                        ]
                                    }, name, true, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 479,
                                        columnNumber: 23
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 473,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                        lineNumber: 471,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-2xl bg-dark-100/60 border border-gray-700/30 overflow-hidden",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "px-4 py-3 border-b border-gray-700/30",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-sm font-semibold text-white",
                                    children: [
                                        "Recent Transactions (",
                                        transactions.length,
                                        ")"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/app/activity/page.tsx",
                                    lineNumber: 498,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 497,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "divide-y divide-gray-700/20 max-h-[600px] overflow-y-auto",
                                children: transactions.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "p-8 text-center text-gray-500 text-sm",
                                    children: "No transactions in recent blocks"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/activity/page.tsx",
                                    lineNumber: 502,
                                    columnNumber: 17
                                }, this) : transactions.map((tx)=>{
                                    const tester = getTesterInfo(tx.from);
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "px-4 py-3 hover:bg-dark-50/30 transition-colors",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-between",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2 min-w-0",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: `w-2 h-2 rounded-full flex-shrink-0 ${tx.status === 'success' ? 'bg-green-400' : tx.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'}`
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                                lineNumber: 510,
                                                                columnNumber: 27
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: `https://explorer.goodclaw.org/tx/${tx.hash}`,
                                                                target: "_blank",
                                                                rel: "noopener noreferrer",
                                                                className: "text-xs font-mono text-goodgreen/80 hover:text-goodgreen truncate",
                                                                children: shortenHash(tx.hash)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                                lineNumber: 511,
                                                                columnNumber: 27
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                        lineNumber: 509,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-xs text-gray-500 flex-shrink-0 ml-2",
                                                        children: [
                                                            "Block #",
                                                            tx.blockNumber
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                        lineNumber: 520,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 508,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 mt-1",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-xs text-gray-400",
                                                        children: tester ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            style: {
                                                                color: tester.color
                                                            },
                                                            children: [
                                                                tester.emoji,
                                                                " ",
                                                                tester.name.split(' ')[1]
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                            lineNumber: 527,
                                                            columnNumber: 29
                                                        }, this) : shortenHash(tx.from)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                        lineNumber: 525,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-xs text-gray-600",
                                                        children: "→"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                        lineNumber: 532,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-xs text-gray-300",
                                                        children: tx.contractName ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "bg-goodgreen/10 text-goodgreen px-1.5 py-0.5 rounded text-[10px]",
                                                            children: tx.contractName
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                            lineNumber: 535,
                                                            columnNumber: 29
                                                        }, this) : typeof tx.to === 'string' ? shortenHash(tx.to) : tx.to
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                        lineNumber: 533,
                                                        columnNumber: 25
                                                    }, this),
                                                    tx.gasUsed !== '0' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-[10px] text-gray-500 ml-auto",
                                                        children: [
                                                            "⛽ ",
                                                            tx.gasUsed
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                        lineNumber: 543,
                                                        columnNumber: 27
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                                lineNumber: 524,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, tx.hash, true, {
                                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                                        lineNumber: 507,
                                        columnNumber: 21
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/activity/page.tsx",
                                lineNumber: 500,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/activity/page.tsx",
                        lineNumber: 496,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/activity/page.tsx",
        lineNumber: 294,
        columnNumber: 5
    }, this);
}
_s(ActivityPage, "bp/JrINMunTrdXfv9CJZSwv0ssQ=");
_c3 = ActivityPage;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "CONTRACTS$Object.fromEntries$Object.entries(DEVNET_CONTRACTS).map");
__turbopack_context__.k.register(_c1, "CONTRACTS$Object.fromEntries");
__turbopack_context__.k.register(_c2, "CONTRACTS");
__turbopack_context__.k.register(_c3, "ActivityPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_src_04tz0yr._.js.map