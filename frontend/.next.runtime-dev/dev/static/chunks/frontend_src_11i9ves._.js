(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
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
    const { symbol, price, change24h, source, updatedAgoMs, divergent = false, compact = false, className = '' } = props;
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
                        lineNumber: 107,
                        columnNumber: 9
                    }, this),
                    showWarning && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                        "data-testid": "live-price-warning",
                        "aria-label": source === 'closed' ? 'Market closed' : 'Stale price',
                        className: "size-3.5 text-amber-400 shrink-0"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                        lineNumber: 109,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 106,
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
                    lineNumber: 122,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 117,
                columnNumber: 7
            }, this),
            !compact && change24h != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "live-price-change",
                className: `text-[11px] mt-0.5 ${changeColor}`,
                children: changeText
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 126,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mt-2 gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-1 min-w-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceSourceBadge"], {
                                source: source,
                                size: "sm"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                                lineNumber: 136,
                                columnNumber: 11
                            }, this),
                            divergent && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "data-testid": "live-price-divergent",
                                title: "Chain oracle and cached feed disagree by more than 0.5%",
                                className: "text-[10px] text-amber-400 shrink-0",
                                children: "Source disagrees"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                                lineNumber: 138,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                        lineNumber: 135,
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
                            lineNumber: 150,
                            columnNumber: 13
                        }, this);
                    })()
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 134,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
        lineNumber: 102,
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
                        className: "flex-1 min-w-0 flex items-center gap-2 rounded-xl bg-dark-100/70 border border-gray-700/30 p-3 text-xs text-gray-400",
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
"[project]/frontend/src/components/AnalyticsPriceStrip.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AnalyticsPriceStrip",
    ()=>AnalyticsPriceStrip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/LivePriceStrip.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceFeeds.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceServiceStatus.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$priceSource$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/priceSource.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
const ANALYTICS_SYMBOLS = [
    'ETH',
    'USDC',
    'G$',
    'WBTC'
];
function AnalyticsPriceStrip() {
    _s();
    const { prices, sources, quotes, lastUpdated } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceFeeds"])([
        ...ANALYTICS_SYMBOLS
    ]);
    const { status, error } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceServiceStatus"])();
    const [now, setNow] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "AnalyticsPriceStrip.useState": ()=>Date.now()
    }["AnalyticsPriceStrip.useState"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnalyticsPriceStrip.useEffect": ()=>{
            const id = setInterval({
                "AnalyticsPriceStrip.useEffect.id": ()=>setNow(Date.now())
            }["AnalyticsPriceStrip.useEffect.id"], 1000);
            return ({
                "AnalyticsPriceStrip.useEffect": ()=>clearInterval(id)
            })["AnalyticsPriceStrip.useEffect"];
        }
    }["AnalyticsPriceStrip.useEffect"], []);
    const updatedAgoMs = lastUpdated ? now - lastUpdated.getTime() : null;
    const entries = ANALYTICS_SYMBOLS.map((sym)=>{
        let source = sources[sym] ?? 'unknown';
        const sq = status?.quotes.find((q)=>q.symbol === sym);
        if (sq) {
            const sessionSource = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$priceSource$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolvePriceSource"])({
                chainOk: source === 'chain-oracle',
                coinGeckoLive: source === 'coingecko',
                hasFallback: true,
                statusQuote: {
                    lastUpdateMs: sq.lastUpdateMs,
                    sessionState: sq.sessionState,
                    source: sq.source
                }
            });
            if (sessionSource === 'stale' || sessionSource === 'closed') source = sessionSource;
        }
        return {
            symbol: sym,
            price: prices[sym] ?? 0,
            change24h: quotes[sym]?.change24h ?? null,
            source,
            updatedAgoMs
        };
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-2",
        children: [
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "price-status-offline",
                role: "status",
                className: "self-start inline-flex items-center gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-xs text-amber-300",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": "true",
                        className: "w-1.5 h-1.5 rounded-full bg-amber-400"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/AnalyticsPriceStrip.tsx",
                        lineNumber: 64,
                        columnNumber: 11
                    }, this),
                    "Status feed offline — per-symbol freshness unavailable; values below come from CoinGecko / chain only."
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/AnalyticsPriceStrip.tsx",
                lineNumber: 59,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LivePriceStrip"], {
                entries: entries
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/AnalyticsPriceStrip.tsx",
                lineNumber: 68,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/AnalyticsPriceStrip.tsx",
        lineNumber: 57,
        columnNumber: 5
    }, this);
}
_s(AnalyticsPriceStrip, "EkOJ1yfnBDbWbc50q8DbxxfM6kA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceFeeds"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceServiceStatus"]
    ];
});
_c = AnalyticsPriceStrip;
var _c;
__turbopack_context__.k.register(_c, "AnalyticsPriceStrip");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/stocksOracleHealth.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deriveStocksOracleHealth",
    ()=>deriveStocksOracleHealth
]);
const STALE_MS = 60_000;
function deriveStocksOracleHealth(payload, now = Date.now(), onChainReachable) {
    const data = payload;
    if (!data || !Array.isArray(data.services)) return 'offline';
    const service = data.services.find((s)=>s?.name === 'stocks-keeper');
    if (!service) return 'offline';
    if (service.status === 'auth' || service.status === 'unauthorized') return 'auth';
    if (service.status !== 'ok') return 'degraded';
    if (!service.lastChecked) return liveOrFallback(onChainReachable);
    const ts = Date.parse(service.lastChecked);
    if (!Number.isFinite(ts)) return 'degraded';
    if (now - ts > STALE_MS) return 'degraded';
    return liveOrFallback(onChainReachable);
}
// Keeper is healthy: distinguish live (on-chain oracle reachable) vs fallback
// (keeper green, but on-chain oracle is unreachable so UI is showing demo data).
// Undefined = unknown reachability → preserve legacy "live" behaviour.
function liveOrFallback(onChainReachable) {
    return onChainReachable === false ? 'fallback' : 'live';
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/OracleStatusBadge.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OracleStatusBadge",
    ()=>OracleStatusBadge,
    "__resetOracleStatusFallbackForTests",
    ()=>__resetOracleStatusFallbackForTests
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceServiceStatus.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stocksOracleHealth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stocksOracleHealth.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function formatAge(ms) {
    if (ms < 1000) return 'just now';
    if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
    return `${Math.floor(ms / 3_600_000)}h ago`;
}
const FALLBACK_STATUS_TTL_MS = 30_000;
let fallbackCache = null;
let fallbackInFlight = null;
async function resolveStocksFallbackStatus({ force = false } = {}) {
    const now = Date.now();
    if (!force && fallbackCache && fallbackCache.expiresAt > now) {
        return fallbackCache.value;
    }
    if (!force && fallbackInFlight) {
        return fallbackInFlight;
    }
    let request;
    request = fetch('/api/status', {
        cache: 'no-store'
    }).then(async (res)=>{
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stocksOracleHealth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deriveStocksOracleHealth"])(data);
    }).catch(()=>'offline').then((value)=>{
        fallbackCache = {
            value,
            expiresAt: Date.now() + FALLBACK_STATUS_TTL_MS
        };
        return value;
    }).finally(()=>{
        if (fallbackInFlight === request) fallbackInFlight = null;
    });
    fallbackInFlight = request;
    return fallbackInFlight;
}
function OracleStatusBadge({ variant = 'compact', symbol, useStocksFallback = false }) {
    _s();
    const { status, error } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceServiceStatus"])();
    const [fallbackState, setFallbackState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('offline');
    const [fallbackLoading, setFallbackLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [fallbackReady, setFallbackReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [timeoutPhase, setTimeoutPhase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('loading');
    const [retryCount, setRetryCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const slowTimer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const timedOutTimer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const clearTimers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "OracleStatusBadge.useCallback[clearTimers]": ()=>{
            if (slowTimer.current) {
                clearTimeout(slowTimer.current);
                slowTimer.current = null;
            }
            if (timedOutTimer.current) {
                clearTimeout(timedOutTimer.current);
                timedOutTimer.current = null;
            }
        }
    }["OracleStatusBadge.useCallback[clearTimers]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "OracleStatusBadge.useEffect": ()=>{
            let cancelled = false;
            if (!useStocksFallback || status || !error) return;
            setFallbackReady(false);
            setFallbackLoading(true);
            setTimeoutPhase('loading');
            slowTimer.current = setTimeout({
                "OracleStatusBadge.useEffect": ()=>{
                    if (!cancelled) setTimeoutPhase('slow');
                }
            }["OracleStatusBadge.useEffect"], 5000);
            timedOutTimer.current = setTimeout({
                "OracleStatusBadge.useEffect": ()=>{
                    if (!cancelled) setTimeoutPhase('timed-out');
                }
            }["OracleStatusBadge.useEffect"], 15000);
            resolveStocksFallbackStatus({
                force: retryCount > 0
            }).then({
                "OracleStatusBadge.useEffect": (nextState)=>{
                    if (cancelled) return;
                    clearTimers();
                    setFallbackState(nextState);
                }
            }["OracleStatusBadge.useEffect"]).finally({
                "OracleStatusBadge.useEffect": ()=>{
                    if (!cancelled) {
                        setFallbackLoading(false);
                        setFallbackReady(true);
                    }
                }
            }["OracleStatusBadge.useEffect"]);
            return ({
                "OracleStatusBadge.useEffect": ()=>{
                    cancelled = true;
                    clearTimers();
                }
            })["OracleStatusBadge.useEffect"];
        }
    }["OracleStatusBadge.useEffect"], [
        useStocksFallback,
        status,
        error,
        retryCount,
        clearTimers
    ]);
    if (error || !status) {
        if (useStocksFallback) {
            if (fallbackLoading || !fallbackReady) {
                if (timeoutPhase === 'timed-out') {
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline-flex items-center gap-1.5 text-xs text-yellow-400",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "w-1.5 h-1.5 rounded-full bg-yellow-400"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                                lineNumber: 119,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Price feed unavailable"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                                lineNumber: 120,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>setRetryCount((c)=>c + 1),
                                className: "underline hover:text-yellow-300 transition-colors",
                                children: "Retry"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                                lineNumber: 121,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                        lineNumber: 118,
                        columnNumber: 13
                    }, this);
                }
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "inline-flex items-center gap-1.5",
                    "aria-label": timeoutPhase === 'slow' ? 'Price feed connecting' : 'Checking price feed',
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "animate-pulse h-5 w-24 rounded-full bg-dark-50/30"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                        lineNumber: 133,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 132,
                    columnNumber: 11
                }, this);
            }
            if (fallbackState === 'live') {
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "inline-flex items-center gap-1.5 text-xs text-gray-400",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                            lineNumber: 140,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Live"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                            lineNumber: 141,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-gray-600",
                            children: "·"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                            lineNumber: 142,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "stocks-keeper"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                            lineNumber: 143,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 139,
                    columnNumber: 11
                }, this);
            }
            if (fallbackState === 'degraded') {
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "inline-flex items-center gap-1.5 text-xs text-gray-400",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "w-1.5 h-1.5 rounded-full bg-yellow-400"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                            lineNumber: 150,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Oracle degraded"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                            lineNumber: 151,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 149,
                    columnNumber: 11
                }, this);
            }
        }
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "inline-flex items-center gap-1.5 text-xs text-gray-500",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "w-1.5 h-1.5 rounded-full bg-gray-500"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 158,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: "Oracle offline"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 159,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
            lineNumber: 157,
            columnNumber: 7
        }, this);
    }
    const { healthy, freshCount, totalCount, quotes } = status;
    if (variant === 'detail' && symbol) {
        const quoteStatus = quotes.find((q)=>q.symbol === symbol);
        if (!quoteStatus) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "inline-flex items-center gap-1.5 text-xs text-gray-500",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "w-1.5 h-1.5 rounded-full bg-gray-500"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                        lineNumber: 171,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            "No oracle data for ",
                            symbol
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                        lineNumber: 172,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                lineNumber: 170,
                columnNumber: 9
            }, this);
        }
        const isStale = quoteStatus.lastUpdateMs > 60_000;
        const dotColor = quoteStatus.lastUpdateMs < 15_000 ? 'bg-green-400' : isStale ? 'bg-red-400' : 'bg-yellow-400';
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "inline-flex items-center gap-1.5 text-xs",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: `w-1.5 h-1.5 rounded-full ${dotColor}`
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 186,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-gray-400",
                    children: [
                        "Updated ",
                        formatAge(quoteStatus.lastUpdateMs)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 187,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-gray-600",
                    children: "·"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 190,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-gray-400",
                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSessionLabel"])(quoteStatus.sessionState)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                    lineNumber: 191,
                    columnNumber: 9
                }, this),
                quoteStatus.confidence > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-gray-600",
                            children: "·"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                            lineNumber: 196,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: quoteStatus.confidence >= 70 ? 'text-gray-400' : 'text-yellow-400',
                            children: [
                                quoteStatus.confidence,
                                "% conf"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                            lineNumber: 197,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
            lineNumber: 185,
            columnNumber: 7
        }, this);
    }
    const dominantSession = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getDominantSession"])(quotes);
    const maxAge = quotes.length > 0 ? Math.max(...quotes.map((q)=>q.lastUpdateMs)) : 0;
    const anyStale = maxAge > 60_000;
    const dotColor = healthy && !anyStale ? 'bg-green-400' : healthy && anyStale ? 'bg-yellow-400' : 'bg-red-400';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "inline-flex items-center gap-1.5 text-xs text-gray-400",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `w-1.5 h-1.5 rounded-full ${dotColor} ${healthy && !anyStale ? 'animate-pulse' : ''}`
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                lineNumber: 217,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: [
                    freshCount,
                    "/",
                    totalCount,
                    " feeds"
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                lineNumber: 218,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-gray-600",
                children: "·"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                lineNumber: 219,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSessionLabel"])(dominantSession)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                lineNumber: 220,
                columnNumber: 7
            }, this),
            anyStale && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-gray-600",
                        children: "·"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                        lineNumber: 223,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-yellow-400",
                        children: "delayed"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
                        lineNumber: 224,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/OracleStatusBadge.tsx",
        lineNumber: 216,
        columnNumber: 5
    }, this);
}
_s(OracleStatusBadge, "q5hLBXFCw6CB3hbYQ2KUthgZXgU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceServiceStatus$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceServiceStatus"]
    ];
});
_c = OracleStatusBadge;
function __resetOracleStatusFallbackForTests() {
    fallbackCache = null;
    fallbackInFlight = null;
}
var _c;
__turbopack_context__.k.register(_c, "OracleStatusBadge");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/app/(app)/analytics/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AnalyticsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$AnalyticsPriceStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/AnalyticsPriceStrip.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$OracleStatusBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/OracleStatusBadge.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
// ─── Small UI helpers ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-dark-50 rounded-xl p-4 flex flex-col gap-1",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-xs text-gray-400 uppercase tracking-wide",
                children: label
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 131,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `text-2xl font-bold ${color ?? 'text-white'}`,
                children: value
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 132,
                columnNumber: 7
            }, this),
            sub && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-xs text-gray-500",
                children: sub
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 133,
                columnNumber: 15
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
        lineNumber: 130,
        columnNumber: 5
    }, this);
}
_c = StatCard;
function shortAddr(addr) {
    if (!addr) return '—';
    return addr.slice(0, 6) + '…' + addr.slice(-4);
}
function timeAgo(ms) {
    if (!ms) return '—';
    const diff = Math.max(0, Math.floor((Date.now() - ms) / 1000));
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}
function PanelError({ message }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "font-medium",
                children: "Source unavailable:"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 155,
                columnNumber: 7
            }, this),
            " ",
            message
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
        lineNumber: 154,
        columnNumber: 5
    }, this);
}
_c1 = PanelError;
function FreshnessBadge({ status, lagBlocks }) {
    const config = {
        fresh: {
            label: 'Fresh',
            cls: 'bg-goodgreen/20 text-goodgreen border-goodgreen/40'
        },
        stale: {
            label: 'Stale',
            cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
        },
        far_behind: {
            label: 'Far behind',
            cls: 'bg-red-500/20 text-red-300 border-red-500/40'
        },
        db_ahead_of_chain: {
            label: 'DB ahead of chain — reset',
            cls: 'bg-red-500/20 text-red-300 border-red-500/40'
        },
        unknown: {
            label: 'Unknown',
            cls: 'bg-gray-500/20 text-gray-300 border-gray-500/40'
        }
    };
    const c = config[status];
    const detail = typeof lagBlocks === 'number' ? ` (${lagBlocks.toLocaleString()} blocks)` : '';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "indexer-freshness-badge",
        className: `inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${c.cls}`,
        children: [
            c.label,
            detail
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
        lineNumber: 181,
        columnNumber: 5
    }, this);
}
_c2 = FreshnessBadge;
// ─── Page ────────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 30_000;
function AnalyticsPage() {
    _s();
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loadError, setLoadError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [lastFetched, setLastFetched] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isRefetching, setIsRefetching] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const fetchOverview = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AnalyticsPage.useCallback[fetchOverview]": async (signal)=>{
            setIsRefetching(true);
            try {
                const res = await fetch('/api/analytics/overview', {
                    cache: 'no-store',
                    signal
                });
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                const body = await res.json();
                if (!body.ok) {
                    throw new Error('API returned ok=false');
                }
                setData(body);
                setLastFetched(Date.now());
                setLoadError(null);
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                setLoadError(err instanceof Error ? err.message : 'unknown');
            } finally{
                setIsRefetching(false);
            }
        }
    }["AnalyticsPage.useCallback[fetchOverview]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnalyticsPage.useEffect": ()=>{
            const ctrl = new AbortController();
            void fetchOverview(ctrl.signal);
            const interval = setInterval({
                "AnalyticsPage.useEffect.interval": ()=>{
                    void fetchOverview();
                }
            }["AnalyticsPage.useEffect.interval"], POLL_INTERVAL_MS);
            return ({
                "AnalyticsPage.useEffect": ()=>{
                    clearInterval(interval);
                    ctrl.abort();
                }
            })["AnalyticsPage.useEffect"];
        }
    }["AnalyticsPage.useEffect"], [
        fetchOverview
    ]);
    const isInitialLoad = data === null && loadError === null;
    const summary = data?.summary;
    const status = data?.status;
    const indexer = data?.indexer;
    const chain = data?.chain;
    const ubi = data?.ubi;
    const protocols = data?.protocols ?? [];
    const ubiBps = ubi?.feeSplitBps;
    const ubiPct = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "AnalyticsPage.useMemo[ubiPct]": ()=>{
            if (!ubiBps) return '—';
            return `${ubiBps.protocol / 100}% / ${ubiBps.ubi / 100}%`;
        }
    }["AnalyticsPage.useMemo[ubiPct]"], [
        ubiBps
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-6xl mx-auto px-4 py-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-5 flex flex-col gap-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$AnalyticsPriceStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnalyticsPriceStrip"], {}, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                    lineNumber: 257,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 256,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-start justify-between mb-6 flex-wrap gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-2xl font-bold text-white",
                                children: "Analytics Dashboard"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 263,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-sm text-gray-400 mt-0.5",
                                children: [
                                    "Internal view of chain activity, UBI fee routing, and service health.",
                                    ' ',
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "/api/analytics/overview",
                                        className: "text-goodgreen hover:underline",
                                        children: "/api/analytics/overview"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 266,
                                        columnNumber: 13
                                    }, this),
                                    ' ',
                                    "·",
                                    ' ',
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "/api/status",
                                        className: "text-goodgreen hover:underline",
                                        children: "/api/status"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 270,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 264,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$OracleStatusBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OracleStatusBadge"], {}, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                    lineNumber: 275,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 274,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 262,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-gray-500",
                                children: lastFetched ? `Updated ${timeAgo(lastFetched)} · auto-refresh 30s` : 'Loading…'
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 279,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>void fetchOverview(),
                                disabled: isRefetching,
                                className: "text-xs px-3 py-1 rounded-md border border-dark-50 text-gray-300 hover:bg-dark-50 disabled:opacity-50",
                                children: isRefetching ? 'Refreshing…' : 'Refresh'
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 284,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 278,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 261,
                columnNumber: 7
            }, this),
            loadError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PanelError, {
                    message: loadError
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                    lineNumber: 297,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 296,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                        label: "Protocols",
                        value: summary?.totalProtocols ?? (isInitialLoad ? '…' : 0),
                        sub: summary ? `${summary.totalContracts} contracts` : 'address book'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 303,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                        label: "Indexed events",
                        value: indexer?.ok && typeof indexer.totalEvents === 'number' ? indexer.totalEvents.toLocaleString() : '—',
                        sub: indexer?.ok && typeof indexer.lastBlock === 'number' ? `block ${indexer.lastBlock.toLocaleString()}` : 'indexer offline',
                        color: indexer?.ok ? 'text-white' : 'text-red-400'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 308,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                        label: "Chain tip",
                        value: chain?.ok && typeof chain.blockNumber === 'number' ? chain.blockNumber.toLocaleString() : '—',
                        sub: chain?.ok ? 'eth_blockNumber' : 'rpc offline',
                        color: chain?.ok ? 'text-white' : 'text-red-400'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 322,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                        label: "Service health",
                        value: status?.ok && typeof status.healthy === 'number' ? `${status.healthy}/${status.total}` : '—',
                        sub: status?.overall ?? 'aggregator offline',
                        color: status?.overall === 'healthy' ? 'text-goodgreen' : status?.overall === 'degraded' ? 'text-yellow-400' : status?.overall === 'down' ? 'text-red-400' : 'text-white'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 332,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 302,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "mb-6 bg-dark-100/50 rounded-xl p-5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-lg font-semibold text-white mb-3",
                        children: "Service Health"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 354,
                        columnNumber: 9
                    }, this),
                    !data && isInitialLoad ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500",
                        children: "Loading…"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 356,
                        columnNumber: 11
                    }, this) : status?.ok ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-center gap-3 text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-300",
                                children: [
                                    "Aggregator says ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-semibold text-white",
                                        children: status.overall
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 360,
                                        columnNumber: 31
                                    }, this),
                                    " —",
                                    ' ',
                                    status.healthy,
                                    " / ",
                                    status.total,
                                    " services healthy."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 359,
                                columnNumber: 13
                            }, this),
                            typeof status.aggregatorUptime === 'number' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-500",
                                children: [
                                    "· uptime ",
                                    Math.round(status.aggregatorUptime),
                                    "s"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 364,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/api/status",
                                className: "text-xs px-2 py-0.5 rounded border border-dark-50 text-gray-400 hover:bg-dark-50",
                                children: "raw JSON →"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 368,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 358,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PanelError, {
                        message: status?.error ?? 'status aggregator unreachable'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 376,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 353,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "mb-6 bg-dark-100/50 rounded-xl p-5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between mb-3 flex-wrap gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-lg font-semibold text-white",
                                children: "Chain & Indexer Activity"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 383,
                                columnNumber: 11
                            }, this),
                            indexer && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FreshnessBadge, {
                                status: indexer.lagStatus,
                                lagBlocks: indexer.lagBlocks
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 385,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 382,
                        columnNumber: 9
                    }, this),
                    indexer && indexer.lagStatus === 'db_ahead_of_chain' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-red-300 mb-3",
                        children: "Indexer database holds blocks newer than the live chain. This usually indicates a chain reset since the last index. The dashboard surfaces this rather than hiding it (Non-Negotiable #8); track recovery in iter 28 (indexer reset playbook)."
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 390,
                        columnNumber: 11
                    }, this),
                    !indexer && isInitialLoad && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500",
                        children: "Loading indexer overview…"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 399,
                        columnNumber: 11
                    }, this),
                    indexer?.ok && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-dark-50 rounded-lg p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-sm font-medium text-gray-300 mb-2",
                                        children: "Per-protocol events"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 405,
                                        columnNumber: 15
                                    }, this),
                                    indexer.protocols && indexer.protocols.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                        className: "w-full text-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    className: "text-xs text-gray-500 uppercase",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left py-1",
                                                            children: "Protocol"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 410,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-right py-1",
                                                            children: "Events"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 411,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-right py-1",
                                                            children: "Last block"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 412,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-right py-1",
                                                            children: "Updated"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 413,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                    lineNumber: 409,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 408,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                children: indexer.protocols.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        className: "border-t border-dark-100",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 text-white capitalize",
                                                                children: p.protocol
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 419,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 text-right text-gray-300",
                                                                children: p.total_events.toLocaleString()
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 420,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 text-right text-gray-400 font-mono text-xs",
                                                                children: p.last_event_block.toLocaleString()
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 423,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 text-right text-gray-500 text-xs",
                                                                children: timeAgo(p.last_updated)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 426,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, p.protocol, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                        lineNumber: 418,
                                                        columnNumber: 23
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 416,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 407,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500",
                                        children: "No protocol activity yet."
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 434,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 404,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-dark-50 rounded-lg p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-sm font-medium text-gray-300 mb-2",
                                        children: "Top events"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 439,
                                        columnNumber: 15
                                    }, this),
                                    indexer.topEvents && indexer.topEvents.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "space-y-1 text-sm",
                                        children: indexer.topEvents.map((ev)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                className: "flex items-center justify-between text-gray-300",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-mono text-xs text-white",
                                                        children: ev.event_name
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                        lineNumber: 447,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-gray-400",
                                                        children: ev.cnt.toLocaleString()
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                        lineNumber: 448,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, ev.event_name, true, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 443,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 441,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500",
                                        children: "No events recorded yet."
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 453,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 438,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 403,
                        columnNumber: 11
                    }, this),
                    indexer && !indexer.ok && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PanelError, {
                        message: indexer.error ?? 'indexer unreachable'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 460,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 381,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "mb-6 bg-dark-100/50 rounded-xl p-5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-lg font-semibold text-white mb-3",
                        children: "UBI Fee Landscape"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 466,
                        columnNumber: 9
                    }, this),
                    !ubi && isInitialLoad && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500",
                        children: "Loading…"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 468,
                        columnNumber: 35
                    }, this),
                    ubi && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                        label: "Fee routes",
                                        value: ubi.totalRoutes,
                                        sub: "from address book"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 473,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                        label: "Splitters pending",
                                        value: ubi.pendingCount,
                                        sub: ubi.pendingCount > 0 ? 'needs deploy' : 'all live',
                                        color: ubi.pendingCount > 0 ? 'text-yellow-400' : 'text-goodgreen'
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 474,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                        label: "Protocol / UBI split",
                                        value: ubiPct,
                                        sub: "canonical bps"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 480,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                        label: "Address book",
                                        value: data?.summary.addressBookVersion ?? '—',
                                        sub: "iter 26 artefact"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 485,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 472,
                                columnNumber: 13
                            }, this),
                            ubi.pendingSplitters.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-sm font-medium text-gray-300 mb-1",
                                        children: "Pending splitters"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 494,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-wrap gap-1.5",
                                        children: ubi.pendingSplitters.map((name)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "px-2 py-0.5 text-xs rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-300",
                                                children: name
                                            }, name, false, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 497,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 495,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 493,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-dark-50 rounded-lg p-4 overflow-x-auto",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-sm font-medium text-gray-300 mb-2",
                                        children: "Fee route map"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 509,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                        className: "w-full text-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                    className: "text-xs text-gray-500 uppercase",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left py-1 pr-3",
                                                            children: "Protocol"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 513,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left py-1 pr-3",
                                                            children: "Route"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 514,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left py-1 pr-3",
                                                            children: "Source"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 515,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left py-1 pr-3",
                                                            children: "Sink"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 516,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left py-1 pr-3",
                                                            children: "Method"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 517,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-right py-1",
                                                            children: "Status"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 518,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                    lineNumber: 512,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 511,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                children: ubi.routes.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                        className: "border-t border-dark-100",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 pr-3 text-white capitalize",
                                                                children: r.protocol
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 524,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 pr-3 text-gray-300",
                                                                children: r.label
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 525,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 pr-3 text-gray-400 font-mono text-xs",
                                                                children: r.source_contract
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 526,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 pr-3 text-gray-400 font-mono text-xs",
                                                                children: r.sink_contract
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 529,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 pr-3 text-gray-500 font-mono text-xs",
                                                                children: r.sink_method
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 532,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 text-right text-xs",
                                                                children: r.source_address_pending_deploy ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-yellow-400",
                                                                    children: "pending"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                    lineNumber: 537,
                                                                    columnNumber: 27
                                                                }, this) : r.event_contract_deployed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-goodgreen",
                                                                    children: "deployed"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                    lineNumber: 539,
                                                                    columnNumber: 27
                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-gray-400",
                                                                    children: "unknown"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                    lineNumber: 541,
                                                                    columnNumber: 27
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 535,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, r.id, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                        lineNumber: 523,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 521,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 510,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 508,
                                columnNumber: 13
                            }, this),
                            ubi.splitDoc && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-500 mt-3",
                                children: [
                                    "Split policy: ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-300",
                                        children: ubi.splitDoc
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 552,
                                        columnNumber: 31
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 551,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 465,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "mb-6 bg-dark-100/50 rounded-xl p-5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-lg font-semibold text-white mb-3",
                        children: "Protocols"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 561,
                        columnNumber: 9
                    }, this),
                    protocols.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500",
                        children: "No protocols loaded."
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 563,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3",
                        children: protocols.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-dark-50 rounded-lg p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between mb-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "font-semibold text-white",
                                                children: p.label
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 569,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-gray-500",
                                                children: [
                                                    p.count,
                                                    " contracts"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 570,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 568,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                        className: "space-y-1",
                                        children: [
                                            p.sampleContracts.map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                    className: "flex justify-between text-xs",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-gray-300",
                                                            children: c.name
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 575,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "font-mono text-gray-500",
                                                            children: shortAddr(c.address)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 576,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, c.address, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                    lineNumber: 574,
                                                    columnNumber: 21
                                                }, this)),
                                            p.count > p.sampleContracts.length && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                className: "text-xs text-gray-500 pt-1",
                                                children: [
                                                    "… and ",
                                                    p.count - p.sampleContracts.length,
                                                    " more"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 580,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 572,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, p.key, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 567,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 565,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 560,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-gray-500 mt-6",
                children: [
                    "Sources: ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: "analytics/address-book.json"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 592,
                        columnNumber: 18
                    }, this),
                    " (committed by iter 26), the status aggregator on ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: ":9200"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 593,
                        columnNumber: 34
                    }, this),
                    ", the indexer on",
                    ' ',
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: ":4200"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 594,
                        columnNumber: 9
                    }, this),
                    ", and ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: "eth_blockNumber"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 594,
                        columnNumber: 33
                    }, this),
                    " via",
                    ' ',
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "/api/rpc",
                        className: "text-goodgreen hover:underline",
                        children: "/api/rpc"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 595,
                        columnNumber: 9
                    }, this),
                    "."
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 591,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
        lineNumber: 254,
        columnNumber: 5
    }, this);
}
_s(AnalyticsPage, "RRwp5ZQ/m0ieJ8CE73CwbXAXNvw=");
_c3 = AnalyticsPage;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "StatCard");
__turbopack_context__.k.register(_c1, "PanelError");
__turbopack_context__.k.register(_c2, "FreshnessBadge");
__turbopack_context__.k.register(_c3, "AnalyticsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_src_11i9ves._.js.map