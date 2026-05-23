(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/lib/format-notional.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatNotionalUsd",
    ()=>formatNotionalUsd
]);
/**
 * USD notional formatter for hedge proof surfaces.
 *
 * - Conventional sign placement: `-50` → `-$50.00` (not `$-50.00`).
 * - Thousands separators: `12500` → `$12,500.00`.
 * - Defends against non-finite engine bugs: returns `—` for NaN / ±Infinity
 *   so the dashboard never reads `$NaN` to an operator.
 */ const USD_FORMATTER = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});
function formatNotionalUsd(value) {
    if (!Number.isFinite(value)) return '—';
    return USD_FORMATTER.format(value);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/HedgeStatusCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2d$notional$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/format-notional.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const POLL_INTERVAL_MS = 10_000;
function shortId(id) {
    if (!id) return '—';
    return id.length <= 8 ? id : id.slice(0, 8);
}
function timeAgo(ms) {
    if (!ms) return '—';
    const diff = Math.max(0, Math.floor((Date.now() - ms) / 1000));
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}
function isoTitle(ms) {
    if (!ms || !Number.isFinite(ms)) return undefined;
    return new Date(ms).toISOString();
}
function formatExposureDelta(before, after) {
    const delta = after - before;
    const display = `${before} → ${after}`;
    if (!Number.isFinite(delta) || delta === 0) {
        return {
            display,
            deltaSigned: '0',
            deltaClass: 'text-gray-500'
        };
    }
    if (delta > 0) {
        return {
            display,
            deltaSigned: `+${delta}`,
            deltaClass: 'text-goodgreen'
        };
    }
    return {
        display,
        deltaSigned: `−${Math.abs(delta)}`,
        deltaClass: 'text-red-300'
    };
}
function resolveEngineState(input) {
    if (input.error && !input.snapshot) {
        return {
            label: 'unreachable',
            color: 'text-red-400'
        };
    }
    if (!input.snapshot) {
        return {
            label: 'awaiting tick',
            color: 'text-gray-400'
        };
    }
    if (input.killSwitch) return {
        label: 'halted',
        color: 'text-yellow-400'
    };
    if (input.breaker?.tripped) return {
        label: 'degraded',
        color: 'text-yellow-400'
    };
    return {
        label: 'ok',
        color: 'text-goodgreen'
    };
}
function DegradedHint({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "hedge-degraded-hint",
        className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
        lineNumber: 152,
        columnNumber: 5
    }, this);
}
_c = DegradedHint;
function ModeBadge({ mode }) {
    const labelMap = {
        demo: {
            label: 'demo',
            cls: 'bg-goodgreen/15 text-goodgreen border-goodgreen/30'
        },
        sandbox: {
            label: 'sandbox',
            cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
        },
        real: {
            label: 'real',
            cls: 'bg-red-500/15 text-red-300 border-red-500/30'
        },
        unknown: {
            label: 'unknown',
            cls: 'bg-gray-500/15 text-gray-300 border-gray-500/30'
        }
    };
    const c = labelMap[mode];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "hedge-mode-badge",
        className: `inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${c.cls}`,
        children: c.label
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
        lineNumber: 170,
        columnNumber: 5
    }, this);
}
_c1 = ModeBadge;
function resolveMode(data, error) {
    if (!data || error) return 'unknown';
    if (data.mode === 'demo' || data.mode === 'sandbox' || data.mode === 'real') {
        return data.mode;
    }
    return 'unknown';
}
const HedgeStatusCard = /*#__PURE__*/ _s((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c2 = _s(function HedgeStatusCard(_, ref) {
    _s();
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isFetching, setIsFetching] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Race-condition guards: many call sites (mount, poll, header button,
    // retry button, imperative refresh) all write to the same state. Without
    // sequencing, a slow earlier response can clobber a fast newer one.
    //   - genRef:       monotonic call counter; only the latest call writes state.
    //   - abortRef:     latest controller so a new call cancels its predecessor
    //                   and unmount cancels whichever is in flight.
    //   - inFlightRef:  synchronous read for the poll guard. `isFetching` lags
    //                   by a render and is unsafe to read inside setInterval.
    const genRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const abortRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const inFlightRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const fetchOnce = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HedgeStatusCard.HedgeStatusCard.useCallback[fetchOnce]": async ()=>{
            abortRef.current?.abort();
            const ctrl = new AbortController();
            abortRef.current = ctrl;
            const gen = ++genRef.current;
            inFlightRef.current = true;
            setIsFetching(true);
            try {
                const res = await fetch('/api/hedge/status', {
                    cache: 'no-store',
                    signal: ctrl.signal
                });
                if (!res.ok && res.status !== 503) {
                    throw new Error(`HTTP ${res.status}`);
                }
                const body = await res.json();
                if (gen !== genRef.current) return;
                if (body.error && !body.snapshot) {
                    setError(body.error);
                    setData(body);
                } else {
                    setError(null);
                    setData(body);
                }
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                if (gen !== genRef.current) return;
                setError(err instanceof Error ? err.message : 'unknown');
            } finally{
                if (gen === genRef.current) {
                    inFlightRef.current = false;
                    setLoading(false);
                    setIsFetching(false);
                }
            }
        }
    }["HedgeStatusCard.HedgeStatusCard.useCallback[fetchOnce]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HedgeStatusCard.HedgeStatusCard.useEffect": ()=>{
            void fetchOnce();
            const t = setInterval({
                "HedgeStatusCard.HedgeStatusCard.useEffect.t": ()=>{
                    if (inFlightRef.current) return;
                    void fetchOnce();
                }
            }["HedgeStatusCard.HedgeStatusCard.useEffect.t"], POLL_INTERVAL_MS);
            return ({
                "HedgeStatusCard.HedgeStatusCard.useEffect": ()=>{
                    clearInterval(t);
                    abortRef.current?.abort();
                }
            })["HedgeStatusCard.HedgeStatusCard.useEffect"];
        }
    }["HedgeStatusCard.HedgeStatusCard.useEffect"], [
        fetchOnce
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useImperativeHandle"])(ref, {
        "HedgeStatusCard.HedgeStatusCard.useImperativeHandle": ()=>({
                refresh: ({
                    "HedgeStatusCard.HedgeStatusCard.useImperativeHandle": ()=>fetchOnce()
                })["HedgeStatusCard.HedgeStatusCard.useImperativeHandle"]
            })
    }["HedgeStatusCard.HedgeStatusCard.useImperativeHandle"], [
        fetchOnce
    ]);
    const receipts = data?.receipts ?? [];
    const mode = resolveMode(data, error);
    const lastReceiptMode = receipts[0]?.mode;
    const breaker = data?.breakerState;
    const cap = data?.capSnapshot;
    const killSwitch = Boolean(data?.killSwitchEngaged);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "data-testid": "hedge-status-card",
        className: "bg-dark-100/50 rounded-xl border border-dark-50 p-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "flex items-center justify-between mb-3 flex-wrap gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-lg font-semibold text-white",
                                children: "Demo hedge proof"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 274,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                title: lastReceiptMode ? `last receipt mode: ${lastReceiptMode}` : undefined,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ModeBadge, {
                                    mode: mode
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                    lineNumber: 278,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 275,
                                columnNumber: 11
                            }, this),
                            data?.snapshot?.timestamp && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-gray-500",
                                children: [
                                    "Last tick ",
                                    timeAgo(data.snapshot.timestamp)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 281,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 273,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-2 flex-wrap",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                "data-testid": "hedge-header-refresh-button",
                                onClick: ()=>void fetchOnce(),
                                disabled: isFetching,
                                "aria-label": "Refresh hedge status",
                                title: "Refresh hedge status",
                                className: "text-xs px-2 py-1 rounded-md border border-dark-50 text-gray-400 hover:text-white hover:bg-dark-50 disabled:opacity-50",
                                children: isFetching ? '…' : '↻'
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 287,
                                columnNumber: 11
                            }, this),
                            data?.degraded?.proof && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DegradedHint, {
                                children: [
                                    "proof: ",
                                    data.degraded.proof
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 299,
                                columnNumber: 13
                            }, this),
                            data?.proof && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 flex-wrap",
                                children: [
                                    data.proof.summary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        "data-testid": "hedge-proof-summary",
                                        className: "text-xs text-gray-400 font-mono truncate max-w-[28ch]",
                                        title: data.proof.summary,
                                        children: data.proof.summary
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                        lineNumber: 304,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        "data-testid": "hedge-proof-link",
                                        href: "/api/hedge/proof/latest",
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                        className: "text-xs text-goodgreen hover:underline font-mono",
                                        title: data.proof.path,
                                        children: "latest proof →"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                        lineNumber: 312,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 302,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 286,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 272,
                columnNumber: 7
            }, this),
            loading && !data && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "hedge-status-loading",
                className: "space-y-2 animate-pulse",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-4 bg-dark-50 rounded w-1/3"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 329,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-4 bg-dark-50 rounded w-2/3"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 330,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-4 bg-dark-50 rounded w-1/2"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 331,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 328,
                columnNumber: 9
            }, this),
            error && !data?.snapshot && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "hedge-status-error",
                className: "bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300 flex items-center justify-between gap-3 flex-wrap",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-medium",
                                children: "Hedge engine unavailable:"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 341,
                                columnNumber: 13
                            }, this),
                            " ",
                            error
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 340,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        "data-testid": "hedge-retry-button",
                        onClick: ()=>void fetchOnce(),
                        disabled: isFetching,
                        className: "text-xs px-2.5 py-1 rounded-md border border-red-500/40 text-red-200 hover:bg-red-500/10 disabled:opacity-50",
                        children: isFetching ? 'Retrying…' : 'Retry'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 343,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 336,
                columnNumber: 9
            }, this),
            killSwitch && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "hedge-killswitch-callout",
                className: "mb-3 bg-red-500/15 border border-red-500/40 rounded-lg p-3 text-sm text-red-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "Kill switch engaged."
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 360,
                        columnNumber: 11
                    }, this),
                    " No further orders will be sent until the kill-switch file is removed."
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 356,
                columnNumber: 9
            }, this),
            breaker?.tripped && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "hedge-breaker-callout",
                className: "mb-3 bg-yellow-500/15 border border-yellow-500/40 rounded-lg p-3 text-sm text-yellow-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "Breaker tripped:"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 370,
                        columnNumber: 11
                    }, this),
                    ' ',
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-mono",
                        children: breaker.reason
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 371,
                        columnNumber: 11
                    }, this),
                    breaker.detail && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-yellow-300/80",
                        children: [
                            " — ",
                            breaker.detail
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 372,
                        columnNumber: 30
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 366,
                columnNumber: 9
            }, this),
            data && !(error && !data.snapshot) && (()=>{
                const engineState = resolveEngineState({
                    snapshot: data.snapshot,
                    error,
                    breaker,
                    killSwitch
                });
                const hasSnapshot = Boolean(data.snapshot);
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    "data-testid": "hedge-stat-grid",
                    className: "grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Stat, {
                            label: "Today's notional",
                            value: cap ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2d$notional$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNotionalUsd"])(cap.dailyNotionalUsd) : '—',
                            sub: cap ? `${cap.dailyOrders} orders` : hasSnapshot ? 'no caps' : 'awaiting tick'
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                            lineNumber: 390,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Stat, {
                            label: "Cycle orders",
                            value: cap ? `${cap.cycleOrders}` : '—',
                            sub: cap ? `day ${cap.dayKey}` : hasSnapshot ? '' : 'awaiting tick'
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                            lineNumber: 395,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Stat, {
                            label: "Receipts visible",
                            value: hasSnapshot ? `${receipts.length}` : '—',
                            sub: hasSnapshot ? 'newest 5' : 'awaiting tick'
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                            lineNumber: 400,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Stat, {
                            testId: "hedge-engine-stat",
                            label: "Engine",
                            value: engineState.label,
                            color: engineState.color
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                            lineNumber: 405,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                    lineNumber: 386,
                    columnNumber: 13
                }, this);
            })(),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-dark-50 rounded-lg p-3 overflow-x-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between mb-2 flex-wrap gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-sm font-medium text-gray-300",
                                children: "Recent receipts"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 418,
                                columnNumber: 11
                            }, this),
                            data?.degraded?.receipts && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DegradedHint, {
                                children: [
                                    "receipts source degraded: ",
                                    data.degraded.receipts
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 420,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 417,
                        columnNumber: 9
                    }, this),
                    receipts.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        "data-testid": "hedge-receipts-empty",
                        className: "text-xs text-gray-500 py-2",
                        children: "No hedge activity yet."
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 424,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                        className: "w-full text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    className: "text-xs text-gray-500 uppercase",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "text-left py-1 pr-2",
                                            children: "time"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                            lineNumber: 434,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "text-left py-1 pr-2",
                                            children: "id"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                            lineNumber: 435,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "text-left py-1 pr-2",
                                            children: "symbol"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                            lineNumber: 436,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "text-left py-1 pr-2",
                                            children: "side"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                            lineNumber: 437,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "text-right py-1 pr-2",
                                            children: "notional"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                            lineNumber: 438,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "text-left py-1 pr-2",
                                            children: "exposure Δ"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                            lineNumber: 439,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "text-left py-1",
                                            children: "status"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                            lineNumber: 440,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                    lineNumber: 433,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 432,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                children: receipts.map((r)=>{
                                    const delta = formatExposureDelta(r.beforeExposure, r.afterExposure);
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        "data-testid": "hedge-receipt-row",
                                        title: r.id,
                                        className: "border-t border-dark-100 font-mono",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "py-1.5 pr-2 text-xs text-gray-300",
                                                title: isoTitle(r.timestamp),
                                                children: timeAgo(r.timestamp)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                lineNumber: 453,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "py-1.5 pr-2 text-xs text-gray-300",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: shortId(r.id)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                        lineNumber: 460,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        "data-testid": "hedge-receipt-etoro-id",
                                                        className: "text-gray-500",
                                                        children: [
                                                            "eToro: ",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-400",
                                                                children: r.etoroOrderId ?? '—'
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                                lineNumber: 465,
                                                                columnNumber: 32
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                        lineNumber: 461,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                lineNumber: 459,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "py-1.5 pr-2 text-white",
                                                children: r.symbol
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                lineNumber: 468,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "py-1.5 pr-2 text-gray-300",
                                                children: r.side
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                lineNumber: 469,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "py-1.5 pr-2 text-right text-gray-200",
                                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2d$notional$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNotionalUsd"])(r.notionalUsd)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                lineNumber: 470,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                "data-testid": "hedge-receipt-exposure-delta",
                                                className: "py-1.5 pr-2 text-xs text-gray-300",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: delta.display
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                        lineNumber: 477,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: delta.deltaClass,
                                                        children: [
                                                            "(",
                                                            delta.deltaSigned,
                                                            ")"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                        lineNumber: 478,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                lineNumber: 473,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "py-1.5 text-xs",
                                                children: r.success ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-goodgreen",
                                                    children: "ok"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                    lineNumber: 482,
                                                    columnNumber: 25
                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-yellow-400",
                                                    children: r.error ?? 'failed'
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                    lineNumber: 484,
                                                    columnNumber: 25
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                lineNumber: 480,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, r.id, true, {
                                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                        lineNumber: 447,
                                        columnNumber: 19
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 443,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 431,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 416,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
        lineNumber: 268,
        columnNumber: 5
    }, this);
}, "FlrG4/K0tXGF/MrLYlzX6bfiEdk=")), "FlrG4/K0tXGF/MrLYlzX6bfiEdk=");
_c3 = HedgeStatusCard;
HedgeStatusCard.displayName = 'HedgeStatusCard';
const __TURBOPACK__default__export__ = HedgeStatusCard;
function Stat({ label, value, sub, color, testId }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bg-dark-50 rounded-xl p-3 flex flex-col gap-0.5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-xs text-gray-400 uppercase tracking-wide",
                children: label
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 516,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "data-testid": testId,
                className: `text-lg font-bold ${color ?? 'text-white'}`,
                children: value
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 517,
                columnNumber: 7
            }, this),
            sub && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-xs text-gray-500",
                children: sub
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 523,
                columnNumber: 15
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
        lineNumber: 515,
        columnNumber: 5
    }, this);
}
_c4 = Stat;
var _c, _c1, _c2, _c3, _c4;
__turbopack_context__.k.register(_c, "DegradedHint");
__turbopack_context__.k.register(_c1, "ModeBadge");
__turbopack_context__.k.register(_c2, "HedgeStatusCard$forwardRef");
__turbopack_context__.k.register(_c3, "HedgeStatusCard");
__turbopack_context__.k.register(_c4, "Stat");
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
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeStatusCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/HedgeStatusCard.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
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
                lineNumber: 130,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `text-2xl font-bold ${color ?? 'text-white'}`,
                children: value
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 131,
                columnNumber: 7
            }, this),
            sub && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-xs text-gray-500",
                children: sub
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 132,
                columnNumber: 15
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
        lineNumber: 129,
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
                lineNumber: 154,
                columnNumber: 7
            }, this),
            " ",
            message
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
        lineNumber: 153,
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
        lineNumber: 180,
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
    const hedgeCardRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // NB: `isRefetching` is owned by the page-level Refresh button click
    // handler so it can reflect combined in-flight state across the overview
    // and the hedge card. Toggling it from inside `fetchOverview` would race
    // the outer button promise and clear the flag mid-flight.
    const fetchOverview = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AnalyticsPage.useCallback[fetchOverview]": async (signal)=>{
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
                className: "flex items-start justify-between mb-6 flex-wrap gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-2xl font-bold text-white",
                                children: "Analytics Dashboard"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 259,
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
                                        lineNumber: 262,
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
                                        lineNumber: 266,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 260,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 258,
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
                                lineNumber: 272,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                "data-testid": "analytics-refresh-button",
                                onClick: async ()=>{
                                    setIsRefetching(true);
                                    try {
                                        await Promise.allSettled([
                                            fetchOverview(),
                                            hedgeCardRef.current?.refresh() ?? Promise.resolve()
                                        ]);
                                    } finally{
                                        setIsRefetching(false);
                                    }
                                },
                                disabled: isRefetching,
                                className: "text-xs px-3 py-1 rounded-md border border-dark-50 text-gray-300 hover:bg-dark-50 disabled:opacity-50",
                                children: isRefetching ? 'Refreshing…' : 'Refresh'
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 277,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 271,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 257,
                columnNumber: 7
            }, this),
            loadError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PanelError, {
                    message: loadError
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                    lineNumber: 301,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 300,
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
                        lineNumber: 307,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                        label: "Indexed events",
                        value: indexer?.ok && typeof indexer.totalEvents === 'number' ? indexer.totalEvents.toLocaleString() : '—',
                        sub: indexer?.ok && typeof indexer.lastBlock === 'number' ? `block ${indexer.lastBlock.toLocaleString()}` : 'indexer offline',
                        color: indexer?.ok ? 'text-white' : 'text-red-400'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 312,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                        label: "Chain tip",
                        value: chain?.ok && typeof chain.blockNumber === 'number' ? chain.blockNumber.toLocaleString() : '—',
                        sub: chain?.ok ? 'eth_blockNumber' : 'rpc offline',
                        color: chain?.ok ? 'text-white' : 'text-red-400'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 326,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                        label: "Service health",
                        value: status?.ok && typeof status.healthy === 'number' ? `${status.healthy}/${status.total}` : '—',
                        sub: status?.overall ?? 'aggregator offline',
                        color: status?.overall === 'healthy' ? 'text-goodgreen' : status?.overall === 'degraded' ? 'text-yellow-400' : status?.overall === 'down' ? 'text-red-400' : 'text-white'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 336,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 306,
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
                        lineNumber: 358,
                        columnNumber: 9
                    }, this),
                    !data && isInitialLoad ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500",
                        children: "Loading…"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 360,
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
                                        lineNumber: 364,
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
                                lineNumber: 363,
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
                                lineNumber: 368,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/api/status",
                                className: "text-xs px-2 py-0.5 rounded border border-dark-50 text-gray-400 hover:bg-dark-50",
                                children: "raw JSON →"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 372,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 362,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PanelError, {
                        message: status?.error ?? 'status aggregator unreachable'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 380,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 357,
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
                                lineNumber: 387,
                                columnNumber: 11
                            }, this),
                            indexer && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FreshnessBadge, {
                                status: indexer.lagStatus,
                                lagBlocks: indexer.lagBlocks
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 389,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 386,
                        columnNumber: 9
                    }, this),
                    indexer && indexer.lagStatus === 'db_ahead_of_chain' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-red-300 mb-3",
                        children: "Indexer database holds blocks newer than the live chain. This usually indicates a chain reset since the last index. The dashboard surfaces this rather than hiding it (Non-Negotiable #8); track recovery in iter 28 (indexer reset playbook)."
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 394,
                        columnNumber: 11
                    }, this),
                    !indexer && isInitialLoad && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500",
                        children: "Loading indexer overview…"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 403,
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
                                        lineNumber: 409,
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
                                                            lineNumber: 414,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-right py-1",
                                                            children: "Events"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 415,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-right py-1",
                                                            children: "Last block"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 416,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-right py-1",
                                                            children: "Updated"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 417,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                    lineNumber: 413,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 412,
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
                                                                lineNumber: 423,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 text-right text-gray-300",
                                                                children: p.total_events.toLocaleString()
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 424,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 text-right text-gray-400 font-mono text-xs",
                                                                children: p.last_event_block.toLocaleString()
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 427,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 text-right text-gray-500 text-xs",
                                                                children: timeAgo(p.last_updated)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 430,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, p.protocol, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                        lineNumber: 422,
                                                        columnNumber: 23
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 420,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 411,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500",
                                        children: "No protocol activity yet."
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 438,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 408,
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
                                        lineNumber: 443,
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
                                                        lineNumber: 451,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-gray-400",
                                                        children: ev.cnt.toLocaleString()
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                        lineNumber: 452,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, ev.event_name, true, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 447,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 445,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500",
                                        children: "No events recorded yet."
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 457,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 442,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 407,
                        columnNumber: 11
                    }, this),
                    indexer && !indexer.ok && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PanelError, {
                        message: indexer.error ?? 'indexer unreachable'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 464,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 385,
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
                        lineNumber: 470,
                        columnNumber: 9
                    }, this),
                    !ubi && isInitialLoad && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500",
                        children: "Loading…"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 472,
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
                                        lineNumber: 477,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                        label: "Splitters pending",
                                        value: ubi.pendingCount,
                                        sub: ubi.pendingCount > 0 ? 'needs deploy' : 'all live',
                                        color: ubi.pendingCount > 0 ? 'text-yellow-400' : 'text-goodgreen'
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 478,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                        label: "Protocol / UBI split",
                                        value: ubiPct,
                                        sub: "canonical bps"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 484,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                        label: "Address book",
                                        value: data?.summary.addressBookVersion ?? '—',
                                        sub: "iter 26 artefact"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 489,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 476,
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
                                        lineNumber: 498,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-wrap gap-1.5",
                                        children: ubi.pendingSplitters.map((name)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "px-2 py-0.5 text-xs rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-300",
                                                children: name
                                            }, name, false, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 501,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 499,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 497,
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
                                        lineNumber: 513,
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
                                                            lineNumber: 517,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left py-1 pr-3",
                                                            children: "Route"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 518,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left py-1 pr-3",
                                                            children: "Source"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 519,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left py-1 pr-3",
                                                            children: "Sink"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 520,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left py-1 pr-3",
                                                            children: "Method"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 521,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-right py-1",
                                                            children: "Status"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 522,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                    lineNumber: 516,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 515,
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
                                                                lineNumber: 528,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 pr-3 text-gray-300",
                                                                children: r.label
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 529,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 pr-3 text-gray-400 font-mono text-xs",
                                                                children: r.source_contract
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 530,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 pr-3 text-gray-400 font-mono text-xs",
                                                                children: r.sink_contract
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 533,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 pr-3 text-gray-500 font-mono text-xs",
                                                                children: r.sink_method
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 536,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 text-right text-xs",
                                                                children: r.source_address_pending_deploy ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-yellow-400",
                                                                    children: "pending"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                    lineNumber: 541,
                                                                    columnNumber: 27
                                                                }, this) : r.event_contract_deployed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-goodgreen",
                                                                    children: "deployed"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                    lineNumber: 543,
                                                                    columnNumber: 27
                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-gray-400",
                                                                    children: "unknown"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                    lineNumber: 545,
                                                                    columnNumber: 27
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 539,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, r.id, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                        lineNumber: 527,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 525,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 514,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 512,
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
                                        lineNumber: 556,
                                        columnNumber: 31
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 555,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 469,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeStatusCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    ref: hedgeCardRef
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                    lineNumber: 565,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 564,
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
                        lineNumber: 570,
                        columnNumber: 9
                    }, this),
                    protocols.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500",
                        children: "No protocols loaded."
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 572,
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
                                                lineNumber: 578,
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
                                                lineNumber: 579,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 577,
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
                                                            lineNumber: 584,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "font-mono text-gray-500",
                                                            children: shortAddr(c.address)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 585,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, c.address, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                    lineNumber: 583,
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
                                                lineNumber: 589,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 581,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, p.key, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 576,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 574,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 569,
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
                        lineNumber: 601,
                        columnNumber: 18
                    }, this),
                    " (committed by iter 26), the status aggregator on ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: ":9200"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 602,
                        columnNumber: 34
                    }, this),
                    ", the indexer on",
                    ' ',
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: ":4200"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 603,
                        columnNumber: 9
                    }, this),
                    ", and ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: "eth_blockNumber"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 603,
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
                        lineNumber: 604,
                        columnNumber: 9
                    }, this),
                    "."
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 600,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
        lineNumber: 255,
        columnNumber: 5
    }, this);
}
_s(AnalyticsPage, "QYHMcBThDCC2J9c3NRW59pd69xY=");
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

//# sourceMappingURL=frontend_src_0k46ow5._.js.map