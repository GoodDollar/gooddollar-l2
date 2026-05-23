(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/lib/perpsHistoryData.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateFundingRateHistory",
    ()=>generateFundingRateHistory,
    "useDemoFundingHistory",
    ()=>useDemoFundingHistory,
    "useDemoOpenOrders",
    ()=>useDemoOpenOrders,
    "useDemoOrderHistory",
    ()=>useDemoOrderHistory,
    "useDemoTradeHistory",
    ()=>useDemoTradeHistory,
    "useFundingHistory",
    ()=>useFundingHistory,
    "useFundingRateChart",
    ()=>useFundingRateChart,
    "useOpenOrders",
    ()=>useOpenOrders,
    "useOrderHistory",
    ()=>useOrderHistory,
    "useTradeHistory",
    ()=>useTradeHistory
]);
/**
 * perpsHistoryData.ts — Types, market-wide funding-rate generator, and
 * deterministic demo seeds for the four /perps history tabs.
 *
 * Production hooks (`useOpenOrders` / `useOrderHistory` / `useTradeHistory`
 * / `useFundingHistory`) currently return `[]` until on-chain perps event
 * indexing is wired. The seeded demo generators are exposed via explicit
 * `useDemo*` hooks for storybook + fixture tests only — production routes
 * MUST NOT import them.
 *
 * Funding-rate **chart** data (`generateFundingRateHistory`) is market-wide
 * and intentionally remains a deterministic placeholder until the indexer
 * lands.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature(), _s4 = __turbopack_context__.k.signature();
;
// ─── Deterministic pseudo-random ──────────────────────────────────────────────
function seededRng(seed) {
    let s = seed;
    return ()=>{
        s = s * 1664525 + 1013904223 & 0x7fffffff;
        return s / 0x7fffffff;
    };
}
// ─── Demo generators (storybook + fixture seeds only) ─────────────────────────
const PAIRS = [
    'BTC-USD',
    'ETH-USD',
    'SOL-USD',
    'AAPL-USD',
    'TSLA-USD'
];
const BASE_PRICES = {
    'BTC-USD': 67800,
    'ETH-USD': 1920,
    'SOL-USD': 134,
    'AAPL-USD': 192,
    'TSLA-USD': 178
};
function generateOpenOrders(count) {
    const rng = seededRng(42);
    const now = Date.now();
    return Array.from({
        length: count
    }, (_, i)=>{
        const pair = PAIRS[Math.floor(rng() * PAIRS.length)];
        const base = BASE_PRICES[pair] ?? 100;
        const side = rng() > 0.5 ? 'long' : 'short';
        const type = rng() > 0.5 ? 'limit' : 'stop-limit';
        const offset = (rng() - 0.5) * 0.04 * base;
        const size = +(rng() * 2 + 0.01).toFixed(4);
        return {
            id: `oo-${i}`,
            pair,
            side,
            type,
            price: +(base + offset).toFixed(2),
            triggerPrice: type === 'stop-limit' ? +(base + offset * 0.8).toFixed(2) : undefined,
            size,
            filled: 0,
            leverage: [
                2,
                5,
                10,
                25
            ][Math.floor(rng() * 4)],
            createdAt: now - Math.floor(rng() * 3600_000 * 24)
        };
    });
}
function generateOrderHistory(count) {
    const rng = seededRng(123);
    const now = Date.now();
    const statuses = [
        'filled',
        'cancelled',
        'expired',
        'partial'
    ];
    return Array.from({
        length: count
    }, (_, i)=>{
        const pair = PAIRS[Math.floor(rng() * PAIRS.length)];
        const base = BASE_PRICES[pair] ?? 100;
        const status = statuses[Math.floor(rng() * statuses.length)];
        const size = +(rng() * 3 + 0.01).toFixed(4);
        const createdAt = now - Math.floor(rng() * 3600_000 * 72);
        return {
            id: `oh-${i}`,
            pair,
            side: rng() > 0.5 ? 'long' : 'short',
            type: [
                'market',
                'limit',
                'stop-limit'
            ][Math.floor(rng() * 3)],
            price: +(base + (rng() - 0.5) * 0.06 * base).toFixed(2),
            size,
            filledSize: status === 'filled' ? size : status === 'partial' ? +(size * rng()).toFixed(4) : 0,
            status,
            createdAt,
            filledAt: status === 'filled' || status === 'partial' ? createdAt + Math.floor(rng() * 60_000) : undefined
        };
    });
}
function generateTradeHistory(count) {
    const rng = seededRng(777);
    const now = Date.now();
    return Array.from({
        length: count
    }, (_, i)=>{
        const pair = PAIRS[Math.floor(rng() * PAIRS.length)];
        const base = BASE_PRICES[pair] ?? 100;
        const size = +(rng() * 2 + 0.01).toFixed(4);
        const price = +(base + (rng() - 0.5) * 0.04 * base).toFixed(2);
        const notional = size * price;
        return {
            id: `th-${i}`,
            pair,
            side: rng() > 0.5 ? 'long' : 'short',
            price,
            size,
            fee: +(notional * 0.001).toFixed(4),
            pnl: +((rng() - 0.45) * notional * 0.08).toFixed(2),
            timestamp: now - Math.floor(rng() * 3600_000 * 168)
        };
    });
}
function generateFundingHistory(count) {
    const rng = seededRng(999);
    const now = Date.now();
    return Array.from({
        length: count
    }, (_, i)=>{
        const pair = PAIRS[Math.floor(rng() * PAIRS.length)];
        const rate = (rng() - 0.5) * 0.0006;
        const positionSize = +(rng() * 5 + 0.1).toFixed(3);
        const base = BASE_PRICES[pair] ?? 100;
        return {
            id: `fh-${i}`,
            pair,
            rate,
            amount: +(rate * positionSize * base).toFixed(4),
            positionSize,
            timestamp: now - i * 8 * 3600_000
        };
    });
}
const RANGE_HOURS = {
    '24h': 24,
    '7d': 168,
    '30d': 720
};
const PAIR_SEEDS = {
    'BTC-USD': 5001,
    'ETH-USD': 5002,
    'SOL-USD': 5003,
    'AAPL-USD': 5004,
    'TSLA-USD': 5005
};
function generateFundingRateHistory(symbol, range) {
    const hours = RANGE_HOURS[range];
    const rng = seededRng((PAIR_SEEDS[symbol] ?? 5999) + hours);
    const now = Date.now();
    const snapshots = [];
    let drift = (rng() - 0.4) * 0.0001;
    for(let i = hours - 1; i >= 0; i--){
        drift += (rng() - 0.5) * 0.00004;
        const rate = drift + (rng() - 0.5) * 0.0002;
        snapshots.push({
            timestamp: now - i * 3600_000,
            rate: +rate.toFixed(6),
            annualized: +(rate * 8760 * 100).toFixed(4)
        });
    }
    return snapshots;
}
function useFundingRateChart(symbol, range) {
    _s();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useFundingRateChart.useMemo": ()=>generateFundingRateHistory(symbol, range)
    }["useFundingRateChart.useMemo"], [
        symbol,
        range
    ]);
}
_s(useFundingRateChart, "nwk+m61qLgjDVUp4IGV/072DDN4=");
// ─── Production hooks ─────────────────────────────────────────────────────────
// Each hook returns `[]` until perps event indexing ships. The empty array
// flows through PerpsHistoryTabs into the existing `<EmptyState>` branches —
// no fake rows, no orphan Cancel buttons.
//
// TODO: replace each return with the real on-chain reads once
// `useOnChainOpenOrders` / `useOnChainOrderHistory` / `useOnChainTradeHistory`
// / `useOnChainFundingPayments` exist.
const EMPTY_OPEN_ORDERS = Object.freeze([]);
const EMPTY_ORDER_HISTORY = Object.freeze([]);
const EMPTY_TRADE_HISTORY = Object.freeze([]);
const EMPTY_FUNDING_HISTORY = Object.freeze([]);
function useOpenOrders() {
    return EMPTY_OPEN_ORDERS;
}
function useOrderHistory() {
    return EMPTY_ORDER_HISTORY;
}
function useTradeHistory() {
    return EMPTY_TRADE_HISTORY;
}
function useFundingHistory() {
    return EMPTY_FUNDING_HISTORY;
}
function useDemoOpenOrders() {
    _s1();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useDemoOpenOrders.useMemo": ()=>generateOpenOrders(5)
    }["useDemoOpenOrders.useMemo"], []);
}
_s1(useDemoOpenOrders, "nwk+m61qLgjDVUp4IGV/072DDN4=");
function useDemoOrderHistory() {
    _s2();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useDemoOrderHistory.useMemo": ()=>generateOrderHistory(20)
    }["useDemoOrderHistory.useMemo"], []);
}
_s2(useDemoOrderHistory, "nwk+m61qLgjDVUp4IGV/072DDN4=");
function useDemoTradeHistory() {
    _s3();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useDemoTradeHistory.useMemo": ()=>generateTradeHistory(25)
    }["useDemoTradeHistory.useMemo"], []);
}
_s3(useDemoTradeHistory, "nwk+m61qLgjDVUp4IGV/072DDN4=");
function useDemoFundingHistory() {
    _s4();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useDemoFundingHistory.useMemo": ()=>generateFundingHistory(30)
    }["useDemoFundingHistory.useMemo"], []);
}
_s4(useDemoFundingHistory, "nwk+m61qLgjDVUp4IGV/072DDN4=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/ui/button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-client] (ecmascript)");
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]', {
    variants: {
        variant: {
            default: 'bg-goodgreen text-dark font-semibold hover:bg-goodgreen-600 active:bg-goodgreen-700',
            secondary: 'bg-dark-50 text-foreground hover:bg-dark-100 border border-border',
            outline: 'border border-goodgreen text-goodgreen bg-transparent hover:bg-goodgreen/10',
            ghost: 'text-foreground hover:bg-dark-50 hover:text-white',
            destructive: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
            link: 'text-goodgreen underline-offset-4 hover:underline p-0 h-auto'
        },
        size: {
            sm: 'h-8 px-3 text-xs rounded',
            default: 'h-10 px-4 py-2',
            lg: 'h-12 px-6 text-base rounded-lg',
            icon: 'h-10 w-10',
            'icon-sm': 'h-8 w-8'
        }
    },
    defaultVariants: {
        variant: 'default',
        size: 'default'
    }
});
const Button = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, variant, size, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/button.tsx",
        lineNumber: 47,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = Button;
Button.displayName = 'Button';
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Button$React.forwardRef");
__turbopack_context__.k.register(_c1, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/ui/empty-state.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "EmptyState",
    ()=>EmptyState
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/cn.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/button.tsx [app-client] (ecmascript)");
'use client';
;
;
;
;
function EmptyState({ icon, title, description, action, className }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$cn$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex flex-col items-center justify-center text-center py-6 px-4', className),
        "data-testid": "empty-state",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-10 h-10 rounded-full bg-gradient-to-br from-goodgreen/20 to-goodgreen/5 border border-goodgreen/15 flex items-center justify-center text-goodgreen mb-3",
                children: icon
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/empty-state.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm font-medium text-white",
                children: title
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/empty-state.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, this),
            description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-gray-400 mt-1 max-w-xs",
                children: description
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/empty-state.tsx",
                lineNumber: 44,
                columnNumber: 9
            }, this),
            action && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                href: action.href,
                className: "mt-3 inline-flex",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                    variant: "ghost",
                    size: "sm",
                    children: action.label
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/ui/empty-state.tsx",
                    lineNumber: 48,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ui/empty-state.tsx",
                lineNumber: 47,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ui/empty-state.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
_c = EmptyState;
var _c;
__turbopack_context__.k.register(_c, "EmptyState");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/PerpsHistoryTabs.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PerpsHistoryTabs",
    ()=>PerpsHistoryTabs
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/perpsData.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsHistoryData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/perpsHistoryData.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ScrollStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ScrollStrip.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$empty$2d$state$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/empty-state.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
// ─── Formatters ───────────────────────────────────────────────────────────────
function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}
function dateStr(ts) {
    return new Date(ts).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
// ─── Side badge ───────────────────────────────────────────────────────────────
function SideBadge({ side, leverage }) {
    const isLong = side === 'long';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `px-1.5 py-0.5 rounded text-[10px] font-semibold ${isLong ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`,
        children: [
            side.toUpperCase(),
            leverage ? ` ${leverage}x` : ''
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
        lineNumber: 40,
        columnNumber: 5
    }, this);
}
_c = SideBadge;
function StatusBadge({ status }) {
    const styles = {
        filled: 'bg-green-500/15 text-green-400',
        partial: 'bg-yellow-500/15 text-yellow-400',
        cancelled: 'bg-gray-500/15 text-gray-400',
        expired: 'bg-gray-500/15 text-gray-500'
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${styles[status] ?? 'bg-gray-500/15 text-gray-400'}`,
        children: status
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
        lineNumber: 56,
        columnNumber: 5
    }, this);
}
_c1 = StatusBadge;
// ─── Tab panels ───────────────────────────────────────────────────────────────
function OpenOrdersPanel({ orders }) {
    if (orders.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$empty$2d$state$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EmptyState"], {
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                className: "w-5 h-5",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 1.5,
                    d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                    lineNumber: 68,
                    columnNumber: 94
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                lineNumber: 68,
                columnNumber: 15
            }, this),
            title: "No open orders",
            description: "Place a limit or stop-limit order to see it here."
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
            lineNumber: 67,
            columnNumber: 7
        }, this);
    }
    // NOTE: the `Cancel` column was removed alongside the mock data drop in
    // task 0017 — the previous `<button>` had no onClick, so a click on a
    // user's "own" order silently did nothing. The real cancel wiring will
    // be added back when on-chain order indexing ships.
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "overflow-x-auto",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: "w-full text-xs min-w-[480px]",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        className: "text-gray-500 border-b border-gray-700/20",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-left py-2 px-3 font-medium",
                                children: "Pair"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 83,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-left py-2 px-2 font-medium",
                                children: "Side"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 84,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-left py-2 px-2 font-medium",
                                children: "Type"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 85,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-right py-2 px-2 font-medium",
                                children: "Price"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 86,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-right py-2 px-2 font-medium",
                                children: "Size"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 87,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-right py-2 px-3 font-medium",
                                children: "Time"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 88,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                        lineNumber: 82,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                    lineNumber: 81,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                    children: orders.map((o)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            className: "border-b border-gray-700/10 hover:bg-white/[0.02] transition-colors",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-3 text-white font-medium",
                                    children: o.pair
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 94,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-2",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SideBadge, {
                                        side: o.side,
                                        leverage: o.leverage
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                        lineNumber: 95,
                                        columnNumber: 41
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 95,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-2 text-gray-400 capitalize",
                                    children: o.type
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 96,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-2 text-right text-white",
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(o.price)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 97,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-2 text-right text-white",
                                    children: o.size
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 98,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-3 text-right text-gray-500",
                                    children: timeAgo(o.createdAt)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 99,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, o.id, true, {
                            fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                            lineNumber: 93,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                    lineNumber: 91,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
            lineNumber: 80,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
        lineNumber: 79,
        columnNumber: 5
    }, this);
}
_c2 = OpenOrdersPanel;
function OrderHistoryPanel({ orders }) {
    if (orders.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$empty$2d$state$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EmptyState"], {
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                className: "w-5 h-5",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 1.5,
                    d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                    lineNumber: 112,
                    columnNumber: 94
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                lineNumber: 112,
                columnNumber: 15
            }, this),
            title: "No order history",
            description: "Your past orders will appear here."
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
            lineNumber: 111,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "overflow-x-auto",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: "w-full text-xs min-w-[600px]",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        className: "text-gray-500 border-b border-gray-700/20",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-left py-2 px-3 font-medium",
                                children: "Pair"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 123,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-left py-2 px-2 font-medium",
                                children: "Side"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 124,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-left py-2 px-2 font-medium",
                                children: "Type"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 125,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-right py-2 px-2 font-medium",
                                children: "Price"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 126,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-right py-2 px-2 font-medium",
                                children: "Size"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 127,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-right py-2 px-2 font-medium",
                                children: "Filled"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 128,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-center py-2 px-2 font-medium",
                                children: "Status"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 129,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-right py-2 px-3 font-medium",
                                children: "Time"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 130,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                        lineNumber: 122,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                    lineNumber: 121,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                    children: orders.map((o)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            className: "border-b border-gray-700/10 hover:bg-white/[0.02] transition-colors",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-3 text-white font-medium",
                                    children: o.pair
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 136,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-2",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SideBadge, {
                                        side: o.side
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                        lineNumber: 137,
                                        columnNumber: 41
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 137,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-2 text-gray-400 capitalize",
                                    children: o.type
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 138,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-2 text-right text-white",
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(o.price)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 139,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-2 text-right text-white",
                                    children: o.size
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 140,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-2 text-right text-gray-300",
                                    children: [
                                        o.filledSize,
                                        "/",
                                        o.size
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 141,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-2 text-center",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusBadge, {
                                        status: o.status
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                        lineNumber: 142,
                                        columnNumber: 53
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 142,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-3 text-right text-gray-500",
                                    children: dateStr(o.createdAt)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 143,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, o.id, true, {
                            fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                            lineNumber: 135,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                    lineNumber: 133,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
            lineNumber: 120,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
        lineNumber: 119,
        columnNumber: 5
    }, this);
}
_c3 = OrderHistoryPanel;
function TradeHistoryPanel({ trades }) {
    if (trades.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$empty$2d$state$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EmptyState"], {
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                className: "w-5 h-5",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 1.5,
                    d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                    lineNumber: 156,
                    columnNumber: 94
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                lineNumber: 156,
                columnNumber: 15
            }, this),
            title: "No trade history",
            description: "Your executed trades will appear here."
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
            lineNumber: 155,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "overflow-x-auto",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: "w-full text-xs min-w-[560px]",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        className: "text-gray-500 border-b border-gray-700/20",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-left py-2 px-3 font-medium",
                                children: "Pair"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 167,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-left py-2 px-2 font-medium",
                                children: "Side"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 168,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-right py-2 px-2 font-medium",
                                children: "Price"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 169,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-right py-2 px-2 font-medium",
                                children: "Size"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 170,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-right py-2 px-2 font-medium",
                                children: "Fee"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 171,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-right py-2 px-2 font-medium",
                                children: "P&L"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 172,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-right py-2 px-3 font-medium",
                                children: "Time"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 173,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                        lineNumber: 166,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                    lineNumber: 165,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                    children: trades.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            className: "border-b border-gray-700/10 hover:bg-white/[0.02] transition-colors",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-3 text-white font-medium",
                                    children: t.pair
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 179,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-2",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SideBadge, {
                                        side: t.side
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                        lineNumber: 180,
                                        columnNumber: 41
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 180,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-2 text-right text-white",
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(t.price)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 181,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-2 text-right text-white",
                                    children: t.size
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 182,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-2 text-right text-gray-400",
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(t.fee)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 183,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: `py-2 px-2 text-right font-medium ${t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                    children: [
                                        t.pnl >= 0 ? '+' : '',
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(t.pnl)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 184,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-3 text-right text-gray-500",
                                    children: dateStr(t.timestamp)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 187,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, t.id, true, {
                            fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                            lineNumber: 178,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                    lineNumber: 176,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
            lineNumber: 164,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
        lineNumber: 163,
        columnNumber: 5
    }, this);
}
_c4 = TradeHistoryPanel;
function FundingHistoryPanel({ payments }) {
    if (payments.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$empty$2d$state$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["EmptyState"], {
            icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                className: "w-5 h-5",
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 1.5,
                    d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                    lineNumber: 200,
                    columnNumber: 94
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                lineNumber: 200,
                columnNumber: 15
            }, this),
            title: "No funding payments",
            description: "Funding payments accrue every 8 hours on open positions."
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
            lineNumber: 199,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "overflow-x-auto",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
            className: "w-full text-xs min-w-[480px]",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                        className: "text-gray-500 border-b border-gray-700/20",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-left py-2 px-3 font-medium",
                                children: "Pair"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 211,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-right py-2 px-2 font-medium",
                                children: "Rate"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 212,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-right py-2 px-2 font-medium",
                                children: "Position"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 213,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-right py-2 px-2 font-medium",
                                children: "Payment"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 214,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                className: "text-right py-2 px-3 font-medium",
                                children: "Time"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                lineNumber: 215,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                        lineNumber: 210,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                    lineNumber: 209,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                    children: payments.map((f)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                            className: "border-b border-gray-700/10 hover:bg-white/[0.02] transition-colors",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-3 text-white font-medium",
                                    children: f.pair
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 221,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: `py-2 px-2 text-right font-medium ${f.rate >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatFundingRate"])(f.rate)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 222,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-2 text-right text-gray-300",
                                    children: f.positionSize
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 225,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: `py-2 px-2 text-right font-medium ${f.amount >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                    children: [
                                        f.amount >= 0 ? '+' : '',
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatPerpsPrice"])(f.amount)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 226,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    className: "py-2 px-3 text-right text-gray-500",
                                    children: dateStr(f.timestamp)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 229,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, f.id, true, {
                            fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                            lineNumber: 220,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                    lineNumber: 218,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
            lineNumber: 208,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
        lineNumber: 207,
        columnNumber: 5
    }, this);
}
_c5 = FundingHistoryPanel;
const TAB_CONFIG = [
    {
        id: 'open-orders',
        label: 'Open Orders'
    },
    {
        id: 'order-history',
        label: 'Order History'
    },
    {
        id: 'trade-history',
        label: 'Trade History'
    },
    {
        id: 'funding-history',
        label: 'Funding History'
    }
];
function PerpsHistoryTabs() {
    _s();
    const [activeTab, setActiveTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('open-orders');
    const openOrders = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsHistoryData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOpenOrders"])();
    const orderHistory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsHistoryData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOrderHistory"])();
    const tradeHistory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsHistoryData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTradeHistory"])();
    const fundingHistory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsHistoryData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useFundingHistory"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border-b border-gray-700/20",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ScrollStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ScrollStrip"], {
                    className: "flex",
                    ariaLabel: "Perps history tabs",
                    fadeFromClass: "from-dark-100",
                    children: TAB_CONFIG.map((tab)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setActiveTab(tab.id),
                            className: `shrink-0 px-4 py-3 text-xs font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'text-goodgreen border-goodgreen' : 'text-gray-400 border-transparent hover:text-white'}`,
                            children: [
                                tab.label,
                                tab.id === 'open-orders' && openOrders.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-goodgreen/15 text-goodgreen font-semibold",
                                    children: openOrders.length
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                                    lineNumber: 276,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, tab.id, true, {
                            fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                            lineNumber: 265,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                    lineNumber: 259,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                lineNumber: 258,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "min-h-[120px]",
                children: [
                    activeTab === 'open-orders' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OpenOrdersPanel, {
                        orders: openOrders
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                        lineNumber: 286,
                        columnNumber: 41
                    }, this),
                    activeTab === 'order-history' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OrderHistoryPanel, {
                        orders: orderHistory
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                        lineNumber: 287,
                        columnNumber: 43
                    }, this),
                    activeTab === 'trade-history' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TradeHistoryPanel, {
                        trades: tradeHistory
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                        lineNumber: 288,
                        columnNumber: 43
                    }, this),
                    activeTab === 'funding-history' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FundingHistoryPanel, {
                        payments: fundingHistory
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                        lineNumber: 289,
                        columnNumber: 45
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
                lineNumber: 285,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/PerpsHistoryTabs.tsx",
        lineNumber: 257,
        columnNumber: 5
    }, this);
}
_s(PerpsHistoryTabs, "pkoqP8vEp0m3MJnpuF53ME1xOv4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsHistoryData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOpenOrders"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsHistoryData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOrderHistory"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsHistoryData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTradeHistory"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsHistoryData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useFundingHistory"]
    ];
});
_c6 = PerpsHistoryTabs;
var _c, _c1, _c2, _c3, _c4, _c5, _c6;
__turbopack_context__.k.register(_c, "SideBadge");
__turbopack_context__.k.register(_c1, "StatusBadge");
__turbopack_context__.k.register(_c2, "OpenOrdersPanel");
__turbopack_context__.k.register(_c3, "OrderHistoryPanel");
__turbopack_context__.k.register(_c4, "TradeHistoryPanel");
__turbopack_context__.k.register(_c5, "FundingHistoryPanel");
__turbopack_context__.k.register(_c6, "PerpsHistoryTabs");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/PerpsHistoryTabs.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/frontend/src/components/PerpsHistoryTabs.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=frontend_src_013pfqr._.js.map