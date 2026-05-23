(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/lib/perpsHistoryData.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateFundingRateHistory",
    ()=>generateFundingRateHistory,
    "useFundingRateChart",
    ()=>useFundingRateChart,
    "useMockFundingHistory",
    ()=>useMockFundingHistory,
    "useMockOpenOrders",
    ()=>useMockOpenOrders,
    "useMockOrderHistory",
    ()=>useMockOrderHistory,
    "useMockTradeHistory",
    ()=>useMockTradeHistory
]);
/**
 * perpsHistoryData.ts — Types and mock data generators for Perps history tabs.
 *
 * Provides hooks returning realistic placeholder data for Open Orders,
 * Order History, Trade History, and Funding History until on-chain event
 * indexing is available.
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
// ─── Generators ───────────────────────────────────────────────────────────────
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
function useMockOpenOrders() {
    _s1();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useMockOpenOrders.useMemo": ()=>generateOpenOrders(5)
    }["useMockOpenOrders.useMemo"], []);
}
_s1(useMockOpenOrders, "nwk+m61qLgjDVUp4IGV/072DDN4=");
function useMockOrderHistory() {
    _s2();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useMockOrderHistory.useMemo": ()=>generateOrderHistory(20)
    }["useMockOrderHistory.useMemo"], []);
}
_s2(useMockOrderHistory, "nwk+m61qLgjDVUp4IGV/072DDN4=");
function useMockTradeHistory() {
    _s3();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useMockTradeHistory.useMemo": ()=>generateTradeHistory(25)
    }["useMockTradeHistory.useMemo"], []);
}
_s3(useMockTradeHistory, "nwk+m61qLgjDVUp4IGV/072DDN4=");
function useMockFundingHistory() {
    _s4();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useMockFundingHistory.useMemo": ()=>generateFundingHistory(30)
    }["useMockFundingHistory.useMemo"], []);
}
_s4(useMockFundingHistory, "nwk+m61qLgjDVUp4IGV/072DDN4=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/FundingRateChart.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FundingRateChart",
    ()=>FundingRateChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsHistoryData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/perpsHistoryData.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const RANGES = [
    {
        label: '24H',
        value: '24h'
    },
    {
        label: '7D',
        value: '7d'
    },
    {
        label: '30D',
        value: '30d'
    }
];
function formatTime(ts, range) {
    const d = new Date(ts);
    if (range === '24h') return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    if (range === '7d') return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}
function formatRate(rate) {
    return `${rate >= 0 ? '+' : ''}${(rate * 100).toFixed(4)}%`;
}
function formatAnnualized(pct) {
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
}
function BarChart({ data, range }) {
    _s();
    const svgRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [tooltip, setTooltip] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [dimensions, setDimensions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        width: 600,
        height: 200
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BarChart.useEffect": ()=>{
            const el = svgRef.current?.parentElement;
            if (!el) return;
            const ro = new ResizeObserver({
                "BarChart.useEffect": (entries)=>{
                    const entry = entries[0];
                    if (entry) setDimensions({
                        width: entry.contentRect.width,
                        height: 200
                    });
                }
            }["BarChart.useEffect"]);
            ro.observe(el);
            return ({
                "BarChart.useEffect": ()=>ro.disconnect()
            })["BarChart.useEffect"];
        }
    }["BarChart.useEffect"], []);
    const { width, height } = dimensions;
    const padding = {
        top: 16,
        right: 8,
        bottom: 24,
        left: 48
    };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const rates = data.map((d)=>d.rate);
    const maxAbs = Math.max(Math.abs(Math.min(...rates)), Math.abs(Math.max(...rates)), 0.00005);
    const yScale = (rate)=>padding.top + chartH / 2 - rate / maxAbs * (chartH / 2);
    const zeroY = yScale(0);
    const barW = Math.max(1, chartW / data.length - 1);
    const gap = Math.max(0.5, (chartW - barW * data.length) / Math.max(data.length - 1, 1));
    const handleMouseMove = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BarChart.useCallback[handleMouseMove]": (e)=>{
            const svg = svgRef.current;
            if (!svg) return;
            const rect = svg.getBoundingClientRect();
            const mouseX = e.clientX - rect.left - padding.left;
            const idx = Math.round(mouseX / (barW + gap || 1));
            const clamped = Math.max(0, Math.min(data.length - 1, idx));
            const snap = data[clamped];
            if (snap) {
                setTooltip({
                    x: padding.left + clamped * (barW + gap) + barW / 2,
                    y: yScale(snap.rate),
                    snapshot: snap,
                    range
                });
            }
        }
    }["BarChart.useCallback[handleMouseMove]"], [
        data,
        barW,
        gap,
        padding.left,
        range,
        yScale
    ]);
    const labelCount = range === '24h' ? 6 : range === '7d' ? 7 : 6;
    const xLabels = [];
    for(let i = 0; i < labelCount; i++){
        const idx = Math.floor(i / (labelCount - 1) * (data.length - 1));
        const snap = data[idx];
        if (snap) {
            xLabels.push({
                x: padding.left + idx * (barW + gap) + barW / 2,
                text: formatTime(snap.timestamp, range)
            });
        }
    }
    const yTicks = [
        -maxAbs,
        -maxAbs / 2,
        0,
        maxAbs / 2,
        maxAbs
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative w-full",
        style: {
            height
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                ref: svgRef,
                width: width,
                height: height,
                className: "w-full",
                onMouseMove: handleMouseMove,
                onMouseLeave: ()=>setTooltip(null),
                children: [
                    yTicks.map((tick, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                    x1: padding.left,
                                    x2: width - padding.right,
                                    y1: yScale(tick),
                                    y2: yScale(tick),
                                    stroke: "rgba(255,255,255,0.06)",
                                    strokeDasharray: tick === 0 ? undefined : '2,3'
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                                    lineNumber: 108,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                                    x: padding.left - 4,
                                    y: yScale(tick) + 3,
                                    textAnchor: "end",
                                    fill: "rgba(255,255,255,0.3)",
                                    fontSize: 9,
                                    children: formatRate(tick)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                                    lineNumber: 113,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, i, true, {
                            fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                            lineNumber: 107,
                            columnNumber: 11
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                        x1: padding.left,
                        x2: width - padding.right,
                        y1: zeroY,
                        y2: zeroY,
                        stroke: "rgba(255,255,255,0.15)",
                        strokeWidth: 1
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                        lineNumber: 122,
                        columnNumber: 9
                    }, this),
                    data.map((snap, i)=>{
                        const x = padding.left + i * (barW + gap);
                        const barHeight = Math.abs(yScale(snap.rate) - zeroY);
                        const barY = snap.rate >= 0 ? yScale(snap.rate) : zeroY;
                        const color = snap.rate >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                            x: x,
                            y: barY,
                            width: barW,
                            height: Math.max(barHeight, 0.5),
                            fill: color,
                            opacity: 0.8,
                            rx: barW > 3 ? 1 : 0
                        }, i, false, {
                            fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                            lineNumber: 134,
                            columnNumber: 13
                        }, this);
                    }),
                    xLabels.map((lbl, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                            x: lbl.x,
                            y: height - 4,
                            textAnchor: "middle",
                            fill: "rgba(255,255,255,0.3)",
                            fontSize: 9,
                            children: lbl.text
                        }, i, false, {
                            fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                            lineNumber: 145,
                            columnNumber: 11
                        }, this)),
                    tooltip && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                        x1: tooltip.x,
                        x2: tooltip.x,
                        y1: padding.top,
                        y2: height - padding.bottom,
                        stroke: "rgba(255,255,255,0.2)",
                        strokeDasharray: "3,3"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                        lineNumber: 151,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                lineNumber: 98,
                columnNumber: 7
            }, this),
            tooltip && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute pointer-events-none bg-dark-50 border border-gray-700/40 rounded-lg px-3 py-2 text-xs shadow-xl z-10",
                style: {
                    left: Math.min(tooltip.x, width - 180),
                    top: Math.max(0, tooltip.y - 70)
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-gray-400 mb-1",
                        children: new Date(tooltip.snapshot.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        })
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                        lineNumber: 167,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `font-medium ${tooltip.snapshot.rate >= 0 ? 'text-green-400' : 'text-red-400'}`,
                        children: [
                            "Rate: ",
                            formatRate(tooltip.snapshot.rate)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                        lineNumber: 172,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-gray-300",
                        children: [
                            "Annualized: ",
                            formatAnnualized(tooltip.snapshot.annualized)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                        lineNumber: 175,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                lineNumber: 160,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
        lineNumber: 97,
        columnNumber: 5
    }, this);
}
_s(BarChart, "78w10ylmoVXcLBBxzz3MN+v8MXY=");
_c = BarChart;
function FundingRateChart({ symbol }) {
    _s1();
    const [range, setRange] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('7d');
    const data = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsHistoryData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useFundingRateChart"])(symbol, range);
    const avgRate = data.length > 0 ? data.reduce((s, d)=>s + d.rate, 0) / data.length : 0;
    const avgAnnualized = avgRate * 8760 * 100;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-dark-100 rounded-2xl border border-gray-700/20 overflow-hidden",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between px-4 py-3 border-b border-gray-700/20",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-xs font-semibold text-white",
                                children: "Funding Rate History"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                                lineNumber: 195,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-1.5 text-[11px]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-500",
                                        children: "Avg:"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                                        lineNumber: 197,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `font-medium ${avgRate >= 0 ? 'text-green-400' : 'text-red-400'}`,
                                        children: formatRate(avgRate)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                                        lineNumber: 198,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-600",
                                        children: "|"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                                        lineNumber: 201,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `${avgAnnualized >= 0 ? 'text-green-300' : 'text-red-300'}`,
                                        children: [
                                            formatAnnualized(avgAnnualized),
                                            " ann."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                                        lineNumber: 202,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                                lineNumber: 196,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                        lineNumber: 194,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-1",
                        children: RANGES.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setRange(r.value),
                                className: `px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${range === r.value ? 'bg-goodgreen/15 text-goodgreen' : 'text-gray-500 hover:text-gray-300'}`,
                                children: r.label
                            }, r.value, false, {
                                fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                                lineNumber: 209,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                        lineNumber: 207,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                lineNumber: 193,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-2 py-2",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BarChart, {
                    data: data,
                    range: range
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                    lineNumber: 224,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
                lineNumber: 223,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/FundingRateChart.tsx",
        lineNumber: 192,
        columnNumber: 5
    }, this);
}
_s1(FundingRateChart, "rkSKURCxIVv7uwgt/TjpX5QXvsA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$perpsHistoryData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useFundingRateChart"]
    ];
});
_c1 = FundingRateChart;
var _c, _c1;
__turbopack_context__.k.register(_c, "BarChart");
__turbopack_context__.k.register(_c1, "FundingRateChart");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/FundingRateChart.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/frontend/src/components/FundingRateChart.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=frontend_src_0ir.-27._.js.map