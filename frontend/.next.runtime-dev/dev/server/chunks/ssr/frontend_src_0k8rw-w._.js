module.exports = [
"[project]/frontend/src/lib/hedgeProof.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Frontend mirror of the hedge-engine proof types and the
 * "no-op" sentinel detector. Kept lockstep with
 * `backend/hedge-engine/src/hedge-proof.ts` so the proof page can
 * recognise the engine's below-threshold sentinel and render a
 * distinct "no hedge needed" card instead of a misleading green
 * BUY $0.00 row.
 *
 * The two modules don't share a package; a backend unit test asserts
 * `NO_OP_ORDER_ID === 'no-op'` as a rename guard for this mirror.
 */ __turbopack_context__.s([
    "NO_OP_ORDER_ID",
    ()=>NO_OP_ORDER_ID,
    "isNoOpProof",
    ()=>isNoOpProof
]);
const NO_OP_ORDER_ID = 'no-op';
function isNoOpProof(proof) {
    return proof.orderId === NO_OP_ORDER_ID && proof.notionalUsd === 0 && proof.beforeExposure.netDelta === proof.afterExposure.netDelta && proof.beforeExposure.blockNumber === proof.afterExposure.blockNumber;
}
}),
"[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LastDemoHedgePanel",
    ()=>LastDemoHedgePanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$hedgeProof$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/hedgeProof.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
async function readSanitisedMessage(res) {
    try {
        const body = await res.json();
        if (typeof body?.message === 'string' && body.message.length > 0) {
            return body.message;
        }
    } catch  {
    // body wasn't JSON; fall through to the generic status message.
    }
    return `HTTP ${res.status}`;
}
function formatUsd(n) {
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
function formatTs(ms) {
    if (!Number.isFinite(ms) || ms === 0) return '—';
    return new Date(ms).toISOString();
}
function LastDemoHedgePanel({ endpoint = '/api/hedge-proof/latest', intervalMs = 15_000 }) {
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        status: 'loading'
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let cancelled = false;
        let timer;
        const load = async ()=>{
            try {
                const res = await fetch(endpoint, {
                    cache: 'no-store'
                });
                if (res.status === 404) {
                    if (!cancelled) setState({
                        status: 'missing',
                        message: 'No hedge proof recorded yet.'
                    });
                    return;
                }
                if (!res.ok) {
                    const sanitisedMessage = await readSanitisedMessage(res);
                    if (!cancelled) setState({
                        status: 'error',
                        message: sanitisedMessage
                    });
                    return;
                }
                const data = await res.json();
                if (!cancelled) setState({
                    status: 'ok',
                    data
                });
            } catch (err) {
                if (!cancelled) setState({
                    status: 'error',
                    message: err.message
                });
            }
        };
        void load();
        timer = setInterval(()=>void load(), intervalMs);
        return ()=>{
            cancelled = true;
            if (timer) clearInterval(timer);
        };
    }, [
        endpoint,
        intervalMs
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "aria-labelledby": "last-hedge-heading",
        className: "rounded-2xl border border-white/10 bg-dark-100/60 p-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-3 flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        id: "last-hedge-heading",
                        className: "text-sm font-semibold uppercase tracking-wider text-gray-400",
                        children: "Last Demo Hedge"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 93,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs text-gray-500",
                        children: state.status === 'ok' ? state.data.proof.dryRun ? 'dry-run' : 'demo trade' : '—'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 96,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 92,
                columnNumber: 7
            }, this),
            state.status === 'loading' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-32 animate-pulse rounded bg-white/5",
                role: "status",
                "aria-label": "Loading hedge proof"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 102,
                columnNumber: 9
            }, this),
            state.status === 'missing' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border border-white/5 bg-white/[0.02] p-4 text-sm text-gray-400",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-medium text-gray-300",
                        children: "No proof yet."
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 107,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-1 text-xs text-gray-500",
                        children: [
                            "Run ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                className: "text-accent",
                                children: "npm run hedge:demo -- --dry-run"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 109,
                                columnNumber: 17
                            }, this),
                            " in",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                className: "text-accent",
                                children: " backend/hedge-engine"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 110,
                                columnNumber: 13
                            }, this),
                            " to generate one."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 108,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 106,
                columnNumber: 9
            }, this),
            state.status === 'error' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-semibold",
                        children: "Hedge proof unavailable"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 117,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-1 text-yellow-300/80",
                        children: state.message
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 118,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 116,
                columnNumber: 9
            }, this),
            state.status === 'ok' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofCard, {
                proof: state.data.proof,
                source: state.data.source
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 123,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 88,
        columnNumber: 5
    }, this);
}
function ProofCard({ proof, source }) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$hedgeProof$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNoOpProof"])(proof)) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NoOpCard, {
            proof: proof,
            source: source
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
            lineNumber: 131,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(HedgeCard, {
        proof: proof,
        source: source
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 133,
        columnNumber: 10
    }, this);
}
function HedgeCard({ proof, source }) {
    const sideColor = proof.side === 'buy' ? 'text-green-300' : 'text-red-300';
    const sideBg = proof.side === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3 text-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${sideBg} ${sideColor}`,
                        children: proof.side
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 142,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-base font-semibold text-white",
                        children: proof.symbol
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 145,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-mono text-base text-gray-100",
                        children: formatUsd(proof.notionalUsd)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 146,
                        columnNumber: 9
                    }, this),
                    proof.dryRun && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent",
                        children: "DRY-RUN"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 148,
                        columnNumber: 11
                    }, this),
                    !proof.realTradingEnabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-300",
                        children: "real trading: false"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 151,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 141,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofMeta, {
                proof: proof
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 157,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border border-white/5 bg-white/[0.02] p-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-1 text-xs uppercase tracking-wider text-gray-500",
                        children: "netDelta (before → after)"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 160,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-baseline gap-3 font-mono",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-200",
                                children: formatUsd(proof.beforeExposure.netDelta)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 162,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-500",
                                children: "→"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 163,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-200",
                                children: formatUsd(proof.afterExposure.netDelta)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 164,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 161,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-1 text-xs text-gray-500",
                        children: [
                            "block #",
                            proof.beforeExposure.blockNumber,
                            " → #",
                            proof.afterExposure.blockNumber
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 166,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 159,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SourceFooter, {
                source: source
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 171,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 140,
        columnNumber: 5
    }, this);
}
function NoOpCard({ proof, source }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3 text-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-gray-200",
                        children: "Below-threshold tick"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 180,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-base font-semibold text-white",
                        children: proof.symbol
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 183,
                        columnNumber: 9
                    }, this),
                    proof.dryRun && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent",
                        children: "DRY-RUN"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 185,
                        columnNumber: 11
                    }, this),
                    !proof.realTradingEnabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-300",
                        children: "real trading: false"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 188,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 179,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-gray-400",
                children: "No hedge needed — exposure stayed inside the configured threshold; the engine still recorded a proof so the pipeline is observable."
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 194,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofMeta, {
                proof: proof
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 199,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-gray-400",
                children: [
                    "netDelta unchanged at",
                    ' ',
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-mono text-gray-200",
                        children: formatUsd(proof.beforeExposure.netDelta)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 203,
                        columnNumber: 9
                    }, this),
                    ' ',
                    "· block #",
                    proof.beforeExposure.blockNumber
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 201,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SourceFooter, {
                source: source
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 207,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 178,
        columnNumber: 5
    }, this);
}
function ProofMeta({ proof }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
        className: "grid grid-cols-1 gap-2 text-xs sm:grid-cols-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                label: "orderId",
                value: proof.etoroOrderId ?? proof.orderId,
                mono: true
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 215,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                label: "runId",
                value: proof.runId,
                mono: true
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 216,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                label: "timestamp",
                value: formatTs(proof.timestamp),
                mono: true
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 217,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                label: "etoroMode",
                value: proof.etoroMode
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 218,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 214,
        columnNumber: 5
    }, this);
}
function SourceFooter({ source }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-[10px] text-gray-600 break-all",
        children: [
            "source: ",
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                children: source
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 225,
                columnNumber: 66
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 225,
        columnNumber: 5
    }, this);
}
function Field({ label, value, mono = false }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                className: "text-[10px] uppercase tracking-wider text-gray-500",
                children: label
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 232,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                className: `mt-0.5 text-gray-200 ${mono ? 'font-mono break-all' : ''}`,
                children: value
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 233,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 231,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/lib/sanitiseClientError.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sanitiseClientError",
    ()=>sanitiseClientError
]);
function sanitiseClientError(ctx, err) {
    console.error('[proof-panel]', ctx, err);
    switch(ctx){
        case 'price-service':
            return 'Live quotes feed is unreachable. The price-service may be offline or restarting.';
        case 'price-service-shape':
            return 'Live quotes feed returned an unexpected payload shape.';
        case 'oracle-multicall':
            return 'On-chain oracle reads are unavailable. The RPC endpoint may be unreachable.';
    }
}
}),
"[project]/frontend/src/components/proof/LiveQuotesPanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LiveQuotesPanel",
    ()=>LiveQuotesPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/sanitiseClientError.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const DEFAULT_PRICE_SERVICE_URL = 'http://localhost:9300';
const DEFAULT_STALENESS_THRESHOLD_MS = 30_000;
const POLL_INTERVAL_MS = 5_000;
function spreadPct(bid, ask) {
    if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0) return 0;
    return (ask - bid) / ((ask + bid) / 2) * 100;
}
function formatUsd(n) {
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
    });
}
function formatAge(ms) {
    if (!Number.isFinite(ms) || ms < 0) return '—';
    if (ms < 1_000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60_000)}m`;
}
/**
 * Structural guard for a single quote row. Only validates the fields the
 * renderer actually reads; extending the price-service response with new
 * optional fields stays a non-breaking change for this panel.
 */ function isQuote(v) {
    if (typeof v !== 'object' || v === null) return false;
    const q = v;
    return typeof q.symbol === 'string' && typeof q.bid === 'number' && typeof q.ask === 'number' && typeof q.mid === 'number' && typeof q.cacheAge === 'number' && typeof q.sessionState === 'string';
}
function isQuotesResponse(x) {
    if (typeof x !== 'object' || x === null) return false;
    const r = x;
    if (typeof r.timestamp !== 'number') return false;
    const quotes = r.quotes;
    if (typeof quotes !== 'object' || quotes === null) return false;
    if (Array.isArray(quotes)) return false;
    for (const v of Object.values(quotes)){
        if (!isQuote(v)) return false;
    }
    return true;
}
const SHAPE_MISMATCH = 'SHAPE_MISMATCH';
function LiveQuotesPanel({ priceServiceUrl = process.env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? DEFAULT_PRICE_SERVICE_URL, stalenessThresholdMs = DEFAULT_STALENESS_THRESHOLD_MS, intervalMs = POLL_INTERVAL_MS }) {
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        status: 'loading'
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let cancelled = false;
        let timer;
        const fetchQuotes = async ()=>{
            try {
                const res = await fetch(`${priceServiceUrl}/quotes`, {
                    cache: 'no-store'
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const raw = await res.json();
                if (!isQuotesResponse(raw)) throw new Error(SHAPE_MISMATCH);
                if (!cancelled) setState({
                    status: 'ok',
                    data: raw
                });
            } catch (err) {
                if (!cancelled) {
                    const ctx = err instanceof Error && err.message === SHAPE_MISMATCH ? 'price-service-shape' : 'price-service';
                    setState({
                        status: 'error',
                        message: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitiseClientError"])(ctx, err)
                    });
                }
            }
        };
        void fetchQuotes();
        timer = setInterval(()=>void fetchQuotes(), intervalMs);
        return ()=>{
            cancelled = true;
            if (timer) clearInterval(timer);
        };
    }, [
        priceServiceUrl,
        intervalMs
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "aria-labelledby": "live-quotes-heading",
        className: "rounded-2xl border border-white/10 bg-dark-100/60 p-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-3 flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        id: "live-quotes-heading",
                        className: "text-sm font-semibold uppercase tracking-wider text-gray-400",
                        children: "Live Quotes (price-service)"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 139,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs text-gray-500",
                        children: [
                            "refreshes every ",
                            intervalMs / 1000,
                            "s"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 142,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 138,
                columnNumber: 7
            }, this),
            state.status === 'loading' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-2",
                role: "status",
                "aria-label": "Loading live quotes",
                children: [
                    0,
                    1,
                    2,
                    3
                ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-7 animate-pulse rounded bg-white/5"
                    }, i, false, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 148,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 146,
                columnNumber: 9
            }, this),
            state.status === 'error' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-semibold",
                        children: "price-service unreachable"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 155,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-1 text-yellow-300/80",
                        children: state.message
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 156,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 154,
                columnNumber: 9
            }, this),
            state.status === 'ok' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "overflow-x-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    className: "w-full text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                className: "border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-500",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 pr-3 font-medium",
                                        children: "Symbol"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                        lineNumber: 165,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 pr-3 font-medium text-right",
                                        children: "Mid"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                        lineNumber: 166,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 pr-3 font-medium text-right",
                                        children: "Bid / Ask"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                        lineNumber: 167,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 pr-3 font-medium text-right",
                                        children: "Spread"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                        lineNumber: 168,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 pr-3 font-medium",
                                        children: "Session"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                        lineNumber: 169,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 pr-3 font-medium text-right",
                                        children: "Age"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                        lineNumber: 170,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                lineNumber: 164,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                            lineNumber: 163,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: Object.values(state.data.quotes).length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    colSpan: 6,
                                    className: "py-4 text-center text-xs text-gray-500",
                                    children: "No quotes returned. price-service may be running but not yet seeded."
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                    lineNumber: 176,
                                    columnNumber: 19
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                lineNumber: 175,
                                columnNumber: 17
                            }, this) : Object.values(state.data.quotes).map((q)=>{
                                const stale = q.cacheAge > stalenessThresholdMs;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    className: "border-b border-white/5 last:border-0",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 pr-3 font-medium text-white",
                                            children: q.symbol
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                            lineNumber: 185,
                                            columnNumber: 23
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 pr-3 text-right font-mono text-gray-100",
                                            children: formatUsd(q.mid)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                            lineNumber: 186,
                                            columnNumber: 23
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 pr-3 text-right font-mono text-gray-400",
                                            children: [
                                                formatUsd(q.bid),
                                                " / ",
                                                formatUsd(q.ask)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                            lineNumber: 187,
                                            columnNumber: 23
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 pr-3 text-right font-mono text-gray-300",
                                            children: [
                                                spreadPct(q.bid, q.ask).toFixed(3),
                                                "%"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                            lineNumber: 190,
                                            columnNumber: 23
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 pr-3",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-300",
                                                children: q.sessionState
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                lineNumber: 194,
                                                columnNumber: 25
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                            lineNumber: 193,
                                            columnNumber: 23
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 pr-3 text-right",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: stale ? 'inline-flex items-center gap-1.5 text-xs font-medium text-yellow-300' : 'inline-flex items-center gap-1.5 text-xs text-gray-400',
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `h-1.5 w-1.5 rounded-full ${stale ? 'bg-yellow-400' : 'bg-green-400'}`,
                                                        "aria-hidden": true
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                        lineNumber: 206,
                                                        columnNumber: 27
                                                    }, this),
                                                    formatAge(q.cacheAge),
                                                    stale && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-yellow-200/90",
                                                        children: "stale"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                        lineNumber: 211,
                                                        columnNumber: 37
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                lineNumber: 199,
                                                columnNumber: 25
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                            lineNumber: 198,
                                            columnNumber: 23
                                        }, this)
                                    ]
                                }, q.symbol, true, {
                                    fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                    lineNumber: 184,
                                    columnNumber: 21
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                            lineNumber: 173,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                    lineNumber: 162,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 161,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
        lineNumber: 134,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/lib/abi.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CollateralRegistryABI",
    ()=>CollateralRegistryABI,
    "CollateralVaultABI",
    ()=>CollateralVaultABI,
    "ConditionalTokensABI",
    ()=>ConditionalTokensABI,
    "ERC20ABI",
    ()=>ERC20ABI,
    "FundingRateABI",
    ()=>FundingRateABI,
    "GoodDAOABI",
    ()=>GoodDAOABI,
    "GoodDollarTokenABI",
    ()=>GoodDollarTokenABI,
    "GoodLendPoolABI",
    ()=>GoodLendPoolABI,
    "GoodLendPriceOracleABI",
    ()=>GoodLendPriceOracleABI,
    "GoodPoolABI",
    ()=>GoodPoolABI,
    "GoodSwapRouterABI",
    ()=>GoodSwapRouterABI,
    "GoodVaultABI",
    ()=>GoodVaultABI,
    "MarginVaultABI",
    ()=>MarginVaultABI,
    "MarketFactoryABI",
    ()=>MarketFactoryABI,
    "PerpEngineABI",
    ()=>PerpEngineABI,
    "PriceOracleABI",
    ()=>PriceOracleABI,
    "SyntheticAssetFactoryABI",
    ()=>SyntheticAssetFactoryABI,
    "TestRegistryABI",
    ()=>TestRegistryABI,
    "UBIFeeHookABI",
    ()=>UBIFeeHookABI,
    "UBIRevenueTrackerABI",
    ()=>UBIRevenueTrackerABI,
    "VaultFactoryABI",
    ()=>VaultFactoryABI,
    "VaultManagerABI",
    ()=>VaultManagerABI,
    "VoteEscrowedGDABI",
    ()=>VoteEscrowedGDABI
]);
const GoodDollarTokenABI = [
    {
        inputs: [
            {
                name: 'account',
                type: 'address'
            }
        ],
        name: 'balanceOf',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'name',
        outputs: [
            {
                name: '',
                type: 'string'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'symbol',
        outputs: [
            {
                name: '',
                type: 'string'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'decimals',
        outputs: [
            {
                name: '',
                type: 'uint8'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'spender',
                type: 'address'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'approve',
        outputs: [
            {
                name: '',
                type: 'bool'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'to',
                type: 'address'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'transfer',
        outputs: [
            {
                name: '',
                type: 'bool'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'owner',
                type: 'address'
            },
            {
                name: 'spender',
                type: 'address'
            }
        ],
        name: 'allowance',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const MarketFactoryABI = [
    {
        inputs: [
            {
                name: 'question',
                type: 'string'
            },
            {
                name: 'endTime',
                type: 'uint256'
            },
            {
                name: 'resolver',
                type: 'address'
            }
        ],
        name: 'createMarket',
        outputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            },
            {
                name: 'isYES',
                type: 'bool'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'buy',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'redeem',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'getMarket',
        outputs: [
            {
                name: 'question',
                type: 'string'
            },
            {
                name: 'endTime',
                type: 'uint256'
            },
            {
                name: 'status',
                type: 'uint8'
            },
            {
                name: 'totalYES',
                type: 'uint256'
            },
            {
                name: 'totalNO',
                type: 'uint256'
            },
            {
                name: 'collateral',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'marketCount',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'impliedProbabilityYES',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    // Events — required for client-side viem.getLogs(...) volume rollups
    // (task 0049: 24h volume + momentum delta on cards).
    {
        type: 'event',
        name: 'MarketCreated',
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'marketId',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'question',
                type: 'string'
            },
            {
                indexed: false,
                name: 'endTime',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'resolver',
                type: 'address'
            }
        ]
    },
    {
        type: 'event',
        name: 'Bought',
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'marketId',
                type: 'uint256'
            },
            {
                indexed: true,
                name: 'buyer',
                type: 'address'
            },
            {
                indexed: false,
                name: 'isYES',
                type: 'bool'
            },
            {
                indexed: false,
                name: 'amount',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'cost',
                type: 'uint256'
            }
        ]
    },
    {
        type: 'event',
        name: 'Redeemed',
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'marketId',
                type: 'uint256'
            },
            {
                indexed: true,
                name: 'redeemer',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amount',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'payout',
                type: 'uint256'
            }
        ]
    }
];
const ConditionalTokensABI = [
    {
        inputs: [
            {
                name: 'owner',
                type: 'address'
            },
            {
                name: 'id',
                type: 'uint256'
            }
        ],
        name: 'balanceOf',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'yesTokenId',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'pure',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'noTokenId',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'pure',
        type: 'function'
    }
];
const UBIFeeHookABI = [
    {
        inputs: [
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'calculateUBIFee',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'ubiFeeShareBPS',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'totalSwapsProcessed',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'token',
                type: 'address'
            }
        ],
        name: 'totalUBIFees',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const GoodLendPoolABI = [
    // supply
    {
        inputs: [
            {
                name: 'asset',
                type: 'address'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'supply',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    // withdraw
    {
        inputs: [
            {
                name: 'asset',
                type: 'address'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'withdraw',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    // borrow
    {
        inputs: [
            {
                name: 'asset',
                type: 'address'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'borrow',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    // repay
    {
        inputs: [
            {
                name: 'asset',
                type: 'address'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'repay',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    // liquidate
    {
        inputs: [
            {
                name: 'collateralAsset',
                type: 'address'
            },
            {
                name: 'debtAsset',
                type: 'address'
            },
            {
                name: 'user',
                type: 'address'
            },
            {
                name: 'debtToCover',
                type: 'uint256'
            }
        ],
        name: 'liquidate',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    // getUserAccountData
    {
        inputs: [
            {
                name: 'user',
                type: 'address'
            }
        ],
        name: 'getUserAccountData',
        outputs: [
            {
                name: 'healthFactor',
                type: 'uint256'
            },
            {
                name: 'totalCollateralUSD',
                type: 'uint256'
            },
            {
                name: 'totalDebtUSD',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    // getReserveData
    {
        inputs: [
            {
                name: 'asset',
                type: 'address'
            }
        ],
        name: 'getReserveData',
        outputs: [
            {
                name: 'totalDeposits',
                type: 'uint256'
            },
            {
                name: 'totalBorrows',
                type: 'uint256'
            },
            {
                name: 'liquidityIndex',
                type: 'uint256'
            },
            {
                name: 'borrowIndex',
                type: 'uint256'
            },
            {
                name: 'supplyRate',
                type: 'uint256'
            },
            {
                name: 'borrowRate',
                type: 'uint256'
            },
            {
                name: 'accruedToTreasury',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    // reserves mapping (public)
    {
        inputs: [
            {
                name: 'asset',
                type: 'address'
            }
        ],
        name: 'reserves',
        outputs: [
            {
                name: 'gToken',
                type: 'address'
            },
            {
                name: 'debtToken',
                type: 'address'
            },
            {
                name: 'reserveFactorBPS',
                type: 'uint256'
            },
            {
                name: 'ltvBPS',
                type: 'uint256'
            },
            {
                name: 'liquidationThresholdBPS',
                type: 'uint256'
            },
            {
                name: 'liquidationBonusBPS',
                type: 'uint256'
            },
            {
                name: 'supplyCap',
                type: 'uint256'
            },
            {
                name: 'borrowCap',
                type: 'uint256'
            },
            {
                name: 'decimals',
                type: 'uint8'
            },
            {
                name: 'isActive',
                type: 'bool'
            },
            {
                name: 'borrowingEnabled',
                type: 'bool'
            },
            {
                name: 'liquidityIndex',
                type: 'uint256'
            },
            {
                name: 'variableBorrowIndex',
                type: 'uint256'
            },
            {
                name: 'currentBorrowRate',
                type: 'uint256'
            },
            {
                name: 'currentSupplyRate',
                type: 'uint256'
            },
            {
                name: 'lastUpdateTimestamp',
                type: 'uint40'
            },
            {
                name: 'accruedToTreasury',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    // Events
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'asset',
                type: 'address'
            },
            {
                indexed: true,
                name: 'user',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'Supply',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'asset',
                type: 'address'
            },
            {
                indexed: true,
                name: 'user',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'Withdraw',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'asset',
                type: 'address'
            },
            {
                indexed: true,
                name: 'user',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'Borrow',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'asset',
                type: 'address'
            },
            {
                indexed: true,
                name: 'user',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'Repay',
        type: 'event'
    }
];
const PerpEngineABI = [
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            },
            {
                name: 'size',
                type: 'uint256'
            },
            {
                name: 'isLong',
                type: 'bool'
            },
            {
                name: 'margin',
                type: 'uint256'
            }
        ],
        name: 'openPosition',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'closePosition',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'markets',
        outputs: [
            {
                name: 'key',
                type: 'bytes32'
            },
            {
                name: 'maxLeverage',
                type: 'uint256'
            },
            {
                name: 'isActive',
                type: 'bool'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'marketCount',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'user',
                type: 'address'
            },
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'positions',
        outputs: [
            {
                name: 'isOpen',
                type: 'bool'
            },
            {
                name: 'isLong',
                type: 'bool'
            },
            {
                name: 'size',
                type: 'uint256'
            },
            {
                name: 'entryPrice',
                type: 'uint256'
            },
            {
                name: 'margin',
                type: 'uint256'
            },
            {
                name: 'entryFundingIdx',
                type: 'int256'
            },
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'user',
                type: 'address'
            },
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'marginRatio',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'user',
                type: 'address'
            },
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'unrealizedPnL',
        outputs: [
            {
                name: '',
                type: 'int256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const CollateralVaultABI = [
    {
        inputs: [
            {
                name: 'ticker',
                type: 'string'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'depositCollateral',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ticker',
                type: 'string'
            },
            {
                name: 'collateralAmount',
                type: 'uint256'
            },
            {
                name: 'syntheticAmount',
                type: 'uint256'
            }
        ],
        name: 'depositAndMint',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'user',
                type: 'address'
            },
            {
                name: 'ticker',
                type: 'string'
            },
            {
                name: 'syntheticAmount',
                type: 'uint256'
            },
            {
                name: 'additionalCollateral',
                type: 'uint256'
            }
        ],
        name: 'getMintRequirements',
        outputs: [
            {
                name: 'requiredCollateral',
                type: 'uint256'
            },
            {
                name: 'fee',
                type: 'uint256'
            },
            {
                name: 'available',
                type: 'uint256'
            },
            {
                name: 'canMint',
                type: 'bool'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ticker',
                type: 'string'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'withdrawCollateral',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ticker',
                type: 'string'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'mint',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ticker',
                type: 'string'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'burn',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'user',
                type: 'address'
            },
            {
                name: 'ticker',
                type: 'string'
            }
        ],
        name: 'getPosition',
        outputs: [
            {
                name: 'userCollateral',
                type: 'uint256'
            },
            {
                name: 'userDebt',
                type: 'uint256'
            },
            {
                name: 'ratio',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'user',
                type: 'address'
            },
            {
                name: 'ticker',
                type: 'string'
            }
        ],
        name: 'getCollateralRatio',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        type: 'event',
        name: 'Minted',
        inputs: [
            {
                name: 'user',
                type: 'address',
                indexed: true
            },
            {
                name: 'ticker',
                type: 'bytes32',
                indexed: true
            },
            {
                name: 'syntheticAmount',
                type: 'uint256',
                indexed: false
            },
            {
                name: 'collateralUsed',
                type: 'uint256',
                indexed: false
            },
            {
                name: 'fee',
                type: 'uint256',
                indexed: false
            }
        ]
    },
    {
        type: 'event',
        name: 'Burned',
        inputs: [
            {
                name: 'user',
                type: 'address',
                indexed: true
            },
            {
                name: 'ticker',
                type: 'bytes32',
                indexed: true
            },
            {
                name: 'syntheticAmount',
                type: 'uint256',
                indexed: false
            },
            {
                name: 'collateralReturned',
                type: 'uint256',
                indexed: false
            },
            {
                name: 'fee',
                type: 'uint256',
                indexed: false
            }
        ]
    }
];
const SyntheticAssetFactoryABI = [
    {
        inputs: [
            {
                name: 'ticker',
                type: 'string'
            }
        ],
        name: 'getAsset',
        outputs: [
            {
                name: 'tokenAddress',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'key',
                type: 'bytes32'
            }
        ],
        name: 'keyToTicker',
        outputs: [
            {
                name: '',
                type: 'string'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'listedCount',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'index',
                type: 'uint256'
            }
        ],
        name: 'listedKeys',
        outputs: [
            {
                name: '',
                type: 'bytes32'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const MarginVaultABI = [
    {
        inputs: [],
        name: 'collateral',
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'deposit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'user',
                type: 'address'
            }
        ],
        name: 'balances',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const FundingRateABI = [
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'cumulativeFundingIndex',
        outputs: [
            {
                name: '',
                type: 'int256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'marketId',
                type: 'uint256'
            }
        ],
        name: 'lastFundingTime',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'FUNDING_INTERVAL',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const ERC20ABI = [
    {
        inputs: [
            {
                name: 'account',
                type: 'address'
            }
        ],
        name: 'balanceOf',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'owner',
                type: 'address'
            },
            {
                name: 'spender',
                type: 'address'
            }
        ],
        name: 'allowance',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'spender',
                type: 'address'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'approve',
        outputs: [
            {
                name: '',
                type: 'bool'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [],
        name: 'decimals',
        outputs: [
            {
                name: '',
                type: 'uint8'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'totalSupply',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const GoodLendPriceOracleABI = [
    {
        inputs: [
            {
                name: 'asset',
                type: 'address'
            }
        ],
        name: 'getAssetPrice',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const PriceOracleABI = [
    {
        inputs: [
            {
                name: 'ticker',
                type: 'string'
            }
        ],
        name: 'getPrice',
        outputs: [
            {
                name: 'price',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ticker',
                type: 'string'
            }
        ],
        name: 'hasFeed',
        outputs: [
            {
                name: '',
                type: 'bool'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'maxAge',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    // StockOracleV2 tuple read — used by the Lane 6 proof page (live-prices-proof).
    {
        inputs: [
            {
                name: 'symbol',
                type: 'string'
            }
        ],
        name: 'getPriceData',
        outputs: [
            {
                name: '',
                type: 'tuple',
                components: [
                    {
                        name: 'price8',
                        type: 'uint256'
                    },
                    {
                        name: 'timestamp',
                        type: 'uint256'
                    },
                    {
                        name: 'session',
                        type: 'uint8'
                    },
                    {
                        name: 'confidence',
                        type: 'uint8'
                    },
                    {
                        name: 'signerCount',
                        type: 'uint8'
                    }
                ]
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    // StockOracleV2 events — used by the Oracle Updates panel.
    {
        type: 'event',
        name: 'PriceUpdated',
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'symbolHash',
                type: 'bytes32'
            },
            {
                indexed: false,
                name: 'symbol',
                type: 'string'
            },
            {
                indexed: false,
                name: 'price8',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'timestamp',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'signerCount',
                type: 'uint8'
            },
            {
                indexed: false,
                name: 'session',
                type: 'uint8'
            }
        ]
    },
    {
        type: 'event',
        name: 'BatchPriceUpdate',
        anonymous: false,
        inputs: [
            {
                indexed: false,
                name: 'count',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'timestamp',
                type: 'uint256'
            }
        ]
    }
];
const VaultManagerABI = [
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            },
            {
                name: 'owner',
                type: 'address'
            }
        ],
        name: 'vaults',
        outputs: [
            {
                name: 'collateral',
                type: 'uint256'
            },
            {
                name: 'normalizedDebt',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            }
        ],
        name: 'accumulators',
        outputs: [
            {
                name: 'chi',
                type: 'uint256'
            },
            {
                name: 'lastDrip',
                type: 'uint256'
            },
            {
                name: 'totalNormalizedDebt',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            },
            {
                name: 'owner',
                type: 'address'
            }
        ],
        name: 'vaultDebt',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            }
        ],
        name: 'openVault',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'depositCollateral',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'withdrawCollateral',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'mintGUSD',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            },
            {
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'repayGUSD',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            }
        ],
        name: 'closeVault',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    }
];
const CollateralRegistryABI = [
    {
        inputs: [
            {
                name: 'ilk',
                type: 'bytes32'
            }
        ],
        name: 'getConfig',
        outputs: [
            {
                components: [
                    {
                        name: 'token',
                        type: 'address'
                    },
                    {
                        name: 'liquidationRatio',
                        type: 'uint256'
                    },
                    {
                        name: 'liquidationPenalty',
                        type: 'uint256'
                    },
                    {
                        name: 'debtCeiling',
                        type: 'uint256'
                    },
                    {
                        name: 'stabilityFeeRate',
                        type: 'uint256'
                    },
                    {
                        name: 'active',
                        type: 'bool'
                    }
                ],
                name: '',
                type: 'tuple'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'ilkCount',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        name: 'ilkList',
        outputs: [
            {
                name: '',
                type: 'bytes32'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    }
];
const GoodPoolABI = [
    {
        inputs: [],
        name: 'tokenA',
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'tokenB',
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'reserveA',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'reserveB',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'totalLiquidity',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        name: 'liquidity',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'spotPrice',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'tokenIn',
                type: 'address'
            },
            {
                name: 'amountIn',
                type: 'uint256'
            }
        ],
        name: 'getAmountOut',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'tokenIn',
                type: 'address'
            },
            {
                name: 'amountIn',
                type: 'uint256'
            },
            {
                name: 'minOut',
                type: 'uint256'
            }
        ],
        name: 'swap',
        outputs: [
            {
                name: 'amountOut',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'amountA',
                type: 'uint256'
            },
            {
                name: 'amountB',
                type: 'uint256'
            }
        ],
        name: 'addLiquidity',
        outputs: [
            {
                name: 'lp',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'lpAmount',
                type: 'uint256'
            }
        ],
        name: 'removeLiquidity',
        outputs: [
            {
                name: 'outA',
                type: 'uint256'
            },
            {
                name: 'outB',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'trader',
                type: 'address'
            },
            {
                indexed: false,
                name: 'tokenIn',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amountIn',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'amountOut',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'fee',
                type: 'uint256'
            }
        ],
        name: 'Swap',
        type: 'event'
    }
];
const GoodSwapRouterABI = [
    {
        inputs: [
            {
                name: 'amountIn',
                type: 'uint256'
            },
            {
                name: 'tokenIn',
                type: 'address'
            },
            {
                name: 'tokenOut',
                type: 'address'
            }
        ],
        name: 'getAmountOut',
        outputs: [
            {
                name: 'amountOut',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'amountOut',
                type: 'uint256'
            },
            {
                name: 'tokenIn',
                type: 'address'
            },
            {
                name: 'tokenOut',
                type: 'address'
            }
        ],
        name: 'getAmountIn',
        outputs: [
            {
                name: 'amountIn',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'tokenIn',
                type: 'address'
            },
            {
                name: 'tokenOut',
                type: 'address'
            }
        ],
        name: 'getPool',
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'amountIn',
                type: 'uint256'
            },
            {
                name: 'amountOutMin',
                type: 'uint256'
            },
            {
                name: 'path',
                type: 'address[]'
            },
            {
                name: 'to',
                type: 'address'
            },
            {
                name: 'deadline',
                type: 'uint256'
            }
        ],
        name: 'swapExactTokensForTokens',
        outputs: [
            {
                name: 'amountOut',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'amountOut',
                type: 'uint256'
            },
            {
                name: 'amountInMax',
                type: 'uint256'
            },
            {
                name: 'path',
                type: 'address[]'
            },
            {
                name: 'to',
                type: 'address'
            },
            {
                name: 'deadline',
                type: 'uint256'
            }
        ],
        name: 'swapTokensForExactTokens',
        outputs: [
            {
                name: 'amountIn',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'tokenIn',
                type: 'address'
            },
            {
                indexed: true,
                name: 'tokenOut',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amountIn',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'amountOut',
                type: 'uint256'
            },
            {
                indexed: true,
                name: 'to',
                type: 'address'
            }
        ],
        name: 'Swap',
        type: 'event'
    }
];
const VoteEscrowedGDABI = [
    {
        inputs: [
            {
                name: '_gd',
                type: 'address'
            },
            {
                name: '_ubiTreasury',
                type: 'address'
            },
            {
                name: '_admin',
                type: 'address'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'constructor'
    },
    {
        inputs: [
            {
                name: 'amount',
                type: 'uint256'
            },
            {
                name: 'duration',
                type: 'uint256'
            }
        ],
        name: 'lock',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'addedAmount',
                type: 'uint256'
            }
        ],
        name: 'increaseLock',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'newEnd',
                type: 'uint256'
            }
        ],
        name: 'extendLock',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [],
        name: 'earlyUnlock',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'delegatee',
                type: 'address'
            }
        ],
        name: 'delegate',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'account',
                type: 'address'
            }
        ],
        name: 'votingPowerOf',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'account',
                type: 'address'
            }
        ],
        name: 'getVotes',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'account',
                type: 'address'
            },
            {
                name: 'timestamp',
                type: 'uint256'
            }
        ],
        name: 'getPastVotes',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'totalVotingPower',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'totalLocked',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        name: 'locks',
        outputs: [
            {
                name: 'amount',
                type: 'uint128'
            },
            {
                name: 'end',
                type: 'uint128'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        name: 'delegates',
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'MAX_LOCK',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'MIN_LOCK',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'gd',
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'name',
        outputs: [
            {
                name: '',
                type: 'string'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'symbol',
        outputs: [
            {
                name: '',
                type: 'string'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'user',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amount',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'unlockTime',
                type: 'uint256'
            }
        ],
        name: 'Locked',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'user',
                type: 'address'
            },
            {
                indexed: false,
                name: 'received',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'penalty',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'toUBI',
                type: 'uint256'
            }
        ],
        name: 'EarlyUnlocked',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'user',
                type: 'address'
            },
            {
                indexed: false,
                name: 'amount',
                type: 'uint256'
            }
        ],
        name: 'Withdrawn',
        type: 'event'
    }
];
const GoodDAOABI = [
    {
        inputs: [
            {
                name: '_veGD',
                type: 'address'
            },
            {
                name: '_guardian',
                type: 'address'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'constructor'
    },
    {
        inputs: [
            {
                name: 'targets',
                type: 'address[]'
            },
            {
                name: 'values',
                type: 'uint256[]'
            },
            {
                name: 'calldatas',
                type: 'bytes[]'
            },
            {
                name: 'description',
                type: 'string'
            }
        ],
        name: 'propose',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'proposalId',
                type: 'uint256'
            },
            {
                name: 'support',
                type: 'uint8'
            }
        ],
        name: 'castVote',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'proposalId',
                type: 'uint256'
            }
        ],
        name: 'queue',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'proposalId',
                type: 'uint256'
            }
        ],
        name: 'execute',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'proposalId',
                type: 'uint256'
            }
        ],
        name: 'cancel',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    },
    {
        inputs: [
            {
                name: 'proposalId',
                type: 'uint256'
            }
        ],
        name: 'state',
        outputs: [
            {
                name: '',
                type: 'uint8'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'proposalCount',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        name: 'proposals',
        outputs: [
            {
                name: 'id',
                type: 'uint256'
            },
            {
                name: 'proposer',
                type: 'address'
            },
            {
                name: 'description',
                type: 'string'
            },
            {
                name: 'startTime',
                type: 'uint256'
            },
            {
                name: 'endTime',
                type: 'uint256'
            },
            {
                name: 'executionTime',
                type: 'uint256'
            },
            {
                name: 'forVotes',
                type: 'uint256'
            },
            {
                name: 'againstVotes',
                type: 'uint256'
            },
            {
                name: 'abstainVotes',
                type: 'uint256'
            },
            {
                name: 'canceled',
                type: 'bool'
            },
            {
                name: 'executed',
                type: 'bool'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [
            {
                name: '',
                type: 'uint256'
            },
            {
                name: '',
                type: 'address'
            }
        ],
        name: 'receipts',
        outputs: [
            {
                name: 'hasVoted',
                type: 'bool'
            },
            {
                name: 'support',
                type: 'uint8'
            },
            {
                name: 'votes',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'veGD',
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'guardian',
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'VOTING_DELAY',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'VOTING_PERIOD',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'TIMELOCK_DELAY',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'PROPOSAL_THRESHOLD_BPS',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        inputs: [],
        name: 'QUORUM_BPS',
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view',
        type: 'function'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'id',
                type: 'uint256'
            },
            {
                indexed: true,
                name: 'proposer',
                type: 'address'
            },
            {
                indexed: false,
                name: 'description',
                type: 'string'
            }
        ],
        name: 'ProposalCreated',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'voter',
                type: 'address'
            },
            {
                indexed: true,
                name: 'proposalId',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'support',
                type: 'uint8'
            },
            {
                indexed: false,
                name: 'votes',
                type: 'uint256'
            }
        ],
        name: 'VoteCast',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'id',
                type: 'uint256'
            },
            {
                indexed: false,
                name: 'executionTime',
                type: 'uint256'
            }
        ],
        name: 'ProposalQueued',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'id',
                type: 'uint256'
            }
        ],
        name: 'ProposalExecuted',
        type: 'event'
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'id',
                type: 'uint256'
            }
        ],
        name: 'ProposalCanceled',
        type: 'event'
    }
];
const TestRegistryABI = [
    {
        type: 'function',
        name: 'getResultCount',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'getResult',
        inputs: [
            {
                name: 'resultId',
                type: 'uint256'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'tuple',
                components: [
                    {
                        name: 'tester',
                        type: 'address'
                    },
                    {
                        name: 'contractTested',
                        type: 'address'
                    },
                    {
                        name: 'functionSelector',
                        type: 'bytes4'
                    },
                    {
                        name: 'success',
                        type: 'bool'
                    },
                    {
                        name: 'gasUsed',
                        type: 'uint256'
                    },
                    {
                        name: 'timestamp',
                        type: 'uint256'
                    },
                    {
                        name: 'note',
                        type: 'string'
                    }
                ]
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'getResults',
        inputs: [
            {
                name: 'from',
                type: 'uint256'
            },
            {
                name: 'to',
                type: 'uint256'
            }
        ],
        outputs: [
            {
                name: 'results',
                type: 'tuple[]',
                components: [
                    {
                        name: 'tester',
                        type: 'address'
                    },
                    {
                        name: 'contractTested',
                        type: 'address'
                    },
                    {
                        name: 'functionSelector',
                        type: 'bytes4'
                    },
                    {
                        name: 'success',
                        type: 'bool'
                    },
                    {
                        name: 'gasUsed',
                        type: 'uint256'
                    },
                    {
                        name: 'timestamp',
                        type: 'uint256'
                    },
                    {
                        name: 'note',
                        type: 'string'
                    }
                ]
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'getResultsByTester',
        inputs: [
            {
                name: 'tester',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: 'matches',
                type: 'tuple[]',
                components: [
                    {
                        name: 'tester',
                        type: 'address'
                    },
                    {
                        name: 'contractTested',
                        type: 'address'
                    },
                    {
                        name: 'functionSelector',
                        type: 'bytes4'
                    },
                    {
                        name: 'success',
                        type: 'bool'
                    },
                    {
                        name: 'gasUsed',
                        type: 'uint256'
                    },
                    {
                        name: 'timestamp',
                        type: 'uint256'
                    },
                    {
                        name: 'note',
                        type: 'string'
                    }
                ]
            },
            {
                name: 'ids',
                type: 'uint256[]'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'event',
        name: 'TestResultLogged',
        inputs: [
            {
                name: 'resultId',
                type: 'uint256',
                indexed: true
            },
            {
                name: 'tester',
                type: 'address',
                indexed: true
            },
            {
                name: 'contractTested',
                type: 'address',
                indexed: true
            },
            {
                name: 'functionSelector',
                type: 'bytes4',
                indexed: false
            },
            {
                name: 'success',
                type: 'bool',
                indexed: false
            },
            {
                name: 'gasUsed',
                type: 'uint256',
                indexed: false
            },
            {
                name: 'timestamp',
                type: 'uint256',
                indexed: false
            },
            {
                name: 'note',
                type: 'string',
                indexed: false
            }
        ],
        anonymous: false
    }
];
const UBIRevenueTrackerABI = [
    {
        type: 'function',
        name: 'getDashboardData',
        inputs: [],
        outputs: [
            {
                name: '_totalFees',
                type: 'uint256'
            },
            {
                name: '_totalUBI',
                type: 'uint256'
            },
            {
                name: '_totalTx',
                type: 'uint256'
            },
            {
                name: '_protocolCount',
                type: 'uint256'
            },
            {
                name: '_activeProtocols',
                type: 'uint256'
            },
            {
                name: '_splitterFees',
                type: 'uint256'
            },
            {
                name: '_splitterUBI',
                type: 'uint256'
            },
            {
                name: '_snapshotCount',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'getAllProtocols',
        inputs: [],
        outputs: [
            {
                name: 'result',
                type: 'tuple[]',
                components: [
                    {
                        name: 'name',
                        type: 'string'
                    },
                    {
                        name: 'category',
                        type: 'string'
                    },
                    {
                        name: 'feeSource',
                        type: 'address'
                    },
                    {
                        name: 'totalFees',
                        type: 'uint256'
                    },
                    {
                        name: 'ubiContribution',
                        type: 'uint256'
                    },
                    {
                        name: 'txCount',
                        type: 'uint256'
                    },
                    {
                        name: 'lastUpdateBlock',
                        type: 'uint256'
                    },
                    {
                        name: 'active',
                        type: 'bool'
                    }
                ]
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'getSnapshots',
        inputs: [
            {
                name: 'count',
                type: 'uint256'
            }
        ],
        outputs: [
            {
                name: 'result',
                type: 'tuple[]',
                components: [
                    {
                        name: 'timestamp',
                        type: 'uint256'
                    },
                    {
                        name: 'totalUBI',
                        type: 'uint256'
                    },
                    {
                        name: 'totalFees',
                        type: 'uint256'
                    },
                    {
                        name: 'protocolCount',
                        type: 'uint256'
                    }
                ]
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'protocolCount',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'snapshotCount',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalFeesTracked',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalUBITracked',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalTxTracked',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    }
];
const VaultFactoryABI = [
    {
        type: 'function',
        name: 'allVaults',
        inputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'vaultCount',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalTVL',
        inputs: [],
        outputs: [
            {
                name: 'tvl',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalUBIFunded',
        inputs: [],
        outputs: [
            {
                name: 'total',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'isVault',
        inputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'bool'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'getVaultsByAsset',
        inputs: [
            {
                name: '_asset',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'address[]'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'approvedStrategies',
        inputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'bool'
            }
        ],
        stateMutability: 'view'
    }
];
const GoodVaultABI = [
    {
        type: 'function',
        name: 'name',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'string'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'symbol',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'string'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'decimals',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint8'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'asset',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalSupply',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalAssets',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'balanceOf',
        inputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'convertToShares',
        inputs: [
            {
                name: 'assets',
                type: 'uint256'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'convertToAssets',
        inputs: [
            {
                name: 'shares',
                type: 'uint256'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'maxDeposit',
        inputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'previewDeposit',
        inputs: [
            {
                name: 'assets',
                type: 'uint256'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'previewWithdraw',
        inputs: [
            {
                name: 'assets',
                type: 'uint256'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'deposit',
        inputs: [
            {
                name: 'assets',
                type: 'uint256'
            },
            {
                name: 'receiver',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: 'shares',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable'
    },
    {
        type: 'function',
        name: 'withdraw',
        inputs: [
            {
                name: 'assets',
                type: 'uint256'
            },
            {
                name: 'receiver',
                type: 'address'
            },
            {
                name: 'owner',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: 'shares',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable'
    },
    {
        type: 'function',
        name: 'redeem',
        inputs: [
            {
                name: 'shares',
                type: 'uint256'
            },
            {
                name: 'receiver',
                type: 'address'
            },
            {
                name: 'owner',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: 'assets',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable'
    },
    {
        type: 'function',
        name: 'harvest',
        inputs: [],
        outputs: [
            {
                name: 'profit',
                type: 'uint256'
            },
            {
                name: 'loss',
                type: 'uint256'
            }
        ],
        stateMutability: 'nonpayable'
    },
    {
        type: 'function',
        name: 'strategy',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'address'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'depositCap',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalDebt',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'performanceFeeBPS',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'managementFeeBPS',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalGainSinceInception',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'totalUBIFunded',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'paused',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'bool'
            }
        ],
        stateMutability: 'view'
    },
    {
        type: 'function',
        name: 'lastReport',
        inputs: [],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    },
    // ERC-20 approve (needed for deposit)
    {
        type: 'function',
        name: 'allowance',
        inputs: [
            {
                name: 'owner',
                type: 'address'
            },
            {
                name: 'spender',
                type: 'address'
            }
        ],
        outputs: [
            {
                name: '',
                type: 'uint256'
            }
        ],
        stateMutability: 'view'
    }
];
}),
"[project]/frontend/src/lib/stockData.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * stockData.ts — Types and formatting utilities for GoodStocks.
 *
 * MOCK DATA REMOVED — all data now comes from on-chain hooks:
 *   - useOnChainStocks() for stock listings + prices
 *   - useOnChainHoldings() for portfolio positions
 *   - useStockPrices() for live oracle prices
 *
 * This file retains types and formatting functions used by components.
 */ // ─── Types ────────────────────────────────────────────────────────────────────
__turbopack_context__.s([
    "DEFAULT_STOCK_SPREAD_BPS",
    ()=>DEFAULT_STOCK_SPREAD_BPS,
    "MAX_STOCK_ORDER_USD",
    ()=>MAX_STOCK_ORDER_USD,
    "formatLargeCount",
    ()=>formatLargeCount,
    "formatLargeNumber",
    ()=>formatLargeNumber,
    "formatStockPrice",
    ()=>formatStockPrice,
    "formatStockShares",
    ()=>formatStockShares,
    "getAllTickers",
    ()=>getAllTickers,
    "getPortfolioHoldings",
    ()=>getPortfolioHoldings,
    "getPortfolioSummary",
    ()=>getPortfolioSummary,
    "getStockByTicker",
    ()=>getStockByTicker,
    "getStockData",
    ()=>getStockData,
    "getStockFinancials",
    ()=>getStockFinancials,
    "getTradeHistory",
    ()=>getTradeHistory
]);
function formatStockPrice(price) {
    return `$${price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}
function _formatWithSuffix(n) {
    if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return n.toFixed(0);
}
function formatLargeNumber(n) {
    return `$${_formatWithSuffix(n)}`;
}
function formatLargeCount(n) {
    return _formatWithSuffix(n);
}
function formatStockShares(n) {
    if (!Number.isFinite(n)) return '0';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
    return `${sign}${abs.toFixed(4)}`;
}
const DEFAULT_STOCK_SPREAD_BPS = 15;
const MAX_STOCK_ORDER_USD = 10_000_000;
// ─── Ticker list (for oracle reads) ──────────────────────────────────────────
const TICKERS = [
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
function getAllTickers() {
    return TICKERS;
}
const FINANCIALS_DATA = {
    AAPL: {
        nextEarningsDate: 'Jul 31, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 94.8e9,
                eps: 1.65,
                epsEstimate: 1.60
            },
            {
                quarter: 'Q1 2026',
                revenue: 124.3e9,
                eps: 2.40,
                epsEstimate: 2.35
            },
            {
                quarter: 'Q4 2025',
                revenue: 89.5e9,
                eps: 1.46,
                epsEstimate: 1.47
            },
            {
                quarter: 'Q3 2025',
                revenue: 85.8e9,
                eps: 1.40,
                epsEstimate: 1.35
            }
        ]
    },
    TSLA: {
        nextEarningsDate: 'Jul 22, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 25.7e9,
                eps: 0.85,
                epsEstimate: 0.78
            },
            {
                quarter: 'Q1 2026',
                revenue: 21.3e9,
                eps: 0.52,
                epsEstimate: 0.58
            },
            {
                quarter: 'Q4 2025',
                revenue: 25.2e9,
                eps: 0.73,
                epsEstimate: 0.71
            },
            {
                quarter: 'Q3 2025',
                revenue: 23.4e9,
                eps: 0.62,
                epsEstimate: 0.60
            }
        ]
    },
    NVDA: {
        nextEarningsDate: 'Aug 20, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 44.1e9,
                eps: 0.89,
                epsEstimate: 0.84
            },
            {
                quarter: 'Q1 2026',
                revenue: 39.3e9,
                eps: 0.78,
                epsEstimate: 0.74
            },
            {
                quarter: 'Q4 2025',
                revenue: 35.1e9,
                eps: 0.68,
                epsEstimate: 0.64
            },
            {
                quarter: 'Q3 2025',
                revenue: 30.0e9,
                eps: 0.58,
                epsEstimate: 0.57
            }
        ]
    },
    MSFT: {
        nextEarningsDate: 'Jul 22, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 65.6e9,
                eps: 3.30,
                epsEstimate: 3.22
            },
            {
                quarter: 'Q1 2026',
                revenue: 69.6e9,
                eps: 3.46,
                epsEstimate: 3.30
            },
            {
                quarter: 'Q4 2025',
                revenue: 62.0e9,
                eps: 3.05,
                epsEstimate: 2.98
            },
            {
                quarter: 'Q3 2025',
                revenue: 56.5e9,
                eps: 2.93,
                epsEstimate: 2.82
            }
        ]
    },
    META: {
        nextEarningsDate: 'Jul 23, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 42.3e9,
                eps: 6.20,
                epsEstimate: 5.95
            },
            {
                quarter: 'Q1 2026',
                revenue: 40.1e9,
                eps: 5.85,
                epsEstimate: 5.70
            },
            {
                quarter: 'Q4 2025',
                revenue: 40.1e9,
                eps: 5.33,
                epsEstimate: 5.25
            },
            {
                quarter: 'Q3 2025',
                revenue: 34.1e9,
                eps: 4.50,
                epsEstimate: 4.39
            }
        ]
    },
    AMZN: {
        nextEarningsDate: 'Jul 24, 2026',
        quarters: [
            {
                quarter: 'Q2 2026',
                revenue: 158.9e9,
                eps: 1.45,
                epsEstimate: 1.38
            },
            {
                quarter: 'Q1 2026',
                revenue: 155.7e9,
                eps: 1.36,
                epsEstimate: 1.29
            },
            {
                quarter: 'Q4 2025',
                revenue: 170.0e9,
                eps: 1.48,
                epsEstimate: 1.46
            },
            {
                quarter: 'Q3 2025',
                revenue: 143.1e9,
                eps: 1.14,
                epsEstimate: 1.12
            }
        ]
    }
};
function getStockFinancials(ticker) {
    return FINANCIALS_DATA[ticker] ?? null;
}
function getStockData() {
    return [];
}
function getStockByTicker(_ticker) {
    return undefined;
}
function getPortfolioHoldings() {
    return [];
}
function getTradeHistory() {
    return [];
}
function getPortfolioSummary() {
    return {
        totalValue: 0,
        totalCost: 0,
        totalCollateral: 0,
        totalRequired: 0,
        unrealizedPnl: 0,
        pnlPercent: 0,
        healthRatio: 0
    };
}
}),
"[project]/frontend/src/components/proof/OnChainOraclePanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OnChainOraclePanel",
    ()=>OnChainOraclePanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContracts.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/sanitiseClientError.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
const SESSION_LABELS = {
    0: 'Open',
    1: 'PreMarket',
    2: 'AfterHours',
    3: 'Closed',
    4: 'Halted'
};
function formatUsd8(price8) {
    const v = Number(price8) / 1e8;
    if (!Number.isFinite(v) || v === 0) return '—';
    return v.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
    });
}
function formatAgo(unixSec) {
    const ts = Number(unixSec);
    if (!Number.isFinite(ts) || ts === 0) return 'never';
    const ageSec = Math.max(0, Math.floor(Date.now() / 1000 - ts));
    if (ageSec < 60) return `${ageSec}s ago`;
    if (ageSec < 3600) return `${Math.floor(ageSec / 60)}m ago`;
    return `${Math.floor(ageSec / 3600)}h ago`;
}
function OnChainOraclePanel() {
    const oracleAddress = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].StocksPriceOracle;
    const tickers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAllTickers"])(), []);
    const contracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!oracleAddress) return [];
        return tickers.map((ticker)=>({
                address: oracleAddress,
                abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PriceOracleABI"],
                functionName: 'getPriceData',
                args: [
                    ticker
                ]
            }));
    }, [
        oracleAddress,
        tickers
    ]);
    const { data, isLoading, error } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts,
        query: {
            enabled: contracts.length > 0,
            refetchInterval: 30_000,
            staleTime: 30_000
        }
    });
    const sanitisedErrorMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>error ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitiseClientError"])('oracle-multicall', error) : null, [
        error
    ]);
    const rows = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!data) return [];
        const out = [];
        for(let i = 0; i < tickers.length; i++){
            const r = data[i];
            if (r?.status !== 'success' || !r.result) continue;
            const tuple = r.result;
            out.push({
                symbol: tickers[i],
                price8: tuple.price8 ?? 0n,
                timestamp: tuple.timestamp ?? 0n,
                session: tuple.session ?? 3,
                confidence: tuple.confidence ?? 0,
                signerCount: tuple.signerCount ?? 0
            });
        }
        return out;
    }, [
        data,
        tickers
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "aria-labelledby": "onchain-oracle-heading",
        className: "rounded-2xl border border-white/10 bg-dark-100/60 p-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-3 flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        id: "onchain-oracle-heading",
                        className: "text-sm font-semibold uppercase tracking-wider text-gray-400",
                        children: "On-chain Oracle (getPriceData)"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs text-gray-500 truncate ml-2 max-w-[40%] font-mono",
                        children: oracleAddress
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 109,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                lineNumber: 105,
                columnNumber: 7
            }, this),
            isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-2",
                role: "status",
                "aria-label": "Loading on-chain oracle data",
                children: [
                    0,
                    1,
                    2,
                    3
                ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-7 animate-pulse rounded bg-white/5"
                    }, i, false, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 115,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                lineNumber: 113,
                columnNumber: 9
            }, this),
            sanitisedErrorMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-semibold",
                        children: "Oracle multicall failed"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 122,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-1 text-yellow-300/80",
                        children: sanitisedErrorMessage
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 123,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                lineNumber: 121,
                columnNumber: 9
            }, this),
            !isLoading && !error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "overflow-x-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                    className: "w-full text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                className: "border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-500",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 pr-3 font-medium",
                                        children: "Symbol"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                        lineNumber: 132,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 pr-3 font-medium text-right",
                                        children: "Price (8-dec → USD)"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                        lineNumber: 133,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 pr-3 font-medium",
                                        children: "Session"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                        lineNumber: 134,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 pr-3 font-medium text-right",
                                        children: "Conf"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                        lineNumber: 135,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 pr-3 font-medium text-right",
                                        children: "Signers"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                        lineNumber: 136,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                        className: "py-2 pr-3 font-medium text-right",
                                        children: "Updated"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                        lineNumber: 137,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 131,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                            lineNumber: 130,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                            children: rows.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                    colSpan: 6,
                                    className: "py-4 text-center text-xs text-gray-500",
                                    children: "No on-chain price data available. The oracle may be unset or unreachable."
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                    lineNumber: 143,
                                    columnNumber: 19
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 142,
                                columnNumber: 17
                            }, this) : rows.map((row)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    className: "border-b border-white/5 last:border-0",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 pr-3 font-medium text-white",
                                            children: row.symbol
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                            lineNumber: 150,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 pr-3 text-right font-mono text-gray-100",
                                            children: formatUsd8(row.price8)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                            lineNumber: 151,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 pr-3",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-300",
                                                children: SESSION_LABELS[row.session] ?? `enum(${row.session})`
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                lineNumber: 153,
                                                columnNumber: 23
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                            lineNumber: 152,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 pr-3 text-right font-mono text-gray-300",
                                            children: [
                                                row.confidence,
                                                "%"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                            lineNumber: 157,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 pr-3 text-right font-mono text-gray-300",
                                            children: row.signerCount
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                            lineNumber: 158,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            className: "py-2 pr-3 text-right text-xs text-gray-400",
                                            children: formatAgo(row.timestamp)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                            lineNumber: 159,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, row.symbol, true, {
                                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                    lineNumber: 149,
                                    columnNumber: 19
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                            lineNumber: 140,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                    lineNumber: 129,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                lineNumber: 128,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
        lineNumber: 101,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OracleUpdatesPanel",
    ()=>OracleUpdatesPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWatchContractEvent$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useWatchContractEvent.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
const MAX_EVENTS = 10;
const SESSION_LABEL = {
    0: 'Open',
    1: 'PreMarket',
    2: 'AfterHours',
    3: 'Closed',
    4: 'Halted'
};
function formatRelative(ts) {
    const ageMs = Math.max(0, Date.now() - ts);
    if (ageMs < 1000) return 'just now';
    if (ageMs < 60_000) return `${Math.floor(ageMs / 1000)}s ago`;
    if (ageMs < 3_600_000) return `${Math.floor(ageMs / 60_000)}m ago`;
    return `${Math.floor(ageMs / 3_600_000)}h ago`;
}
function formatUsd8(price8) {
    const v = Number(price8) / 1e8;
    return v.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
    });
}
function shortHash(hash) {
    if (!hash || hash.length < 12) return hash;
    return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}
function OracleUpdatesPanel() {
    const oracleAddress = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].StocksPriceOracle;
    const explorer = process.env.NEXT_PUBLIC_BLOCK_EXPLORER ?? process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ?? '';
    const [events, setEvents] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const onLogs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((logs)=>{
        setEvents((prev)=>{
            const next = [
                ...prev
            ];
            for (const log of logs){
                const l = log;
                if (!l.transactionHash) continue;
                next.unshift({
                    txHash: l.transactionHash,
                    blockNumber: l.blockNumber ?? 0n,
                    symbol: l.args?.symbol ?? '?',
                    price8: l.args?.price8 ?? 0n,
                    capturedAt: Date.now()
                });
            }
            return next.slice(0, MAX_EVENTS);
        });
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWatchContractEvent$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWatchContractEvent"])({
        address: oracleAddress,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PriceOracleABI"],
        eventName: 'PriceUpdated',
        onLogs,
        enabled: Boolean(oracleAddress)
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "aria-labelledby": "oracle-updates-heading",
        className: "rounded-2xl border border-white/10 bg-dark-100/60 p-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-3 flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        id: "oracle-updates-heading",
                        className: "text-sm font-semibold uppercase tracking-wider text-gray-400",
                        children: "Recent Oracle Updates"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                        lineNumber: 92,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs text-gray-500",
                        children: [
                            "last ",
                            MAX_EVENTS,
                            " PriceUpdated events"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                        lineNumber: 95,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                lineNumber: 91,
                columnNumber: 7
            }, this),
            events.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border border-white/5 bg-white/[0.02] p-4 text-xs text-gray-500",
                children: [
                    "Listening for ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        className: "text-gray-400",
                        children: "PriceUpdated"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                        lineNumber: 100,
                        columnNumber: 25
                    }, this),
                    " events. None observed yet; this populates as the oracle-signer keeper writes to the chain.",
                    SESSION_LABEL[0] ? null : null
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                lineNumber: 99,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "divide-y divide-white/5",
                children: events.map((e)=>{
                    const link = explorer ? `${explorer.replace(/\/$/, '')}/tx/${e.txHash}` : undefined;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: "flex items-center justify-between py-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm font-medium text-white",
                                        children: e.symbol
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                        lineNumber: 111,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-mono text-xs text-gray-400",
                                        children: formatUsd8(e.price8)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                        lineNumber: 112,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                lineNumber: 110,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 text-xs",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-500",
                                        children: [
                                            "block #",
                                            String(e.blockNumber)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                        lineNumber: 115,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-500",
                                        children: "·"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                        lineNumber: 116,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-400",
                                        children: formatRelative(e.capturedAt)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                        lineNumber: 117,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gray-500",
                                        children: "·"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                        lineNumber: 118,
                                        columnNumber: 19
                                    }, this),
                                    link ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: link,
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                        className: "font-mono text-accent hover:text-white transition-colors",
                                        children: [
                                            shortHash(e.txHash),
                                            " ↗"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                        lineNumber: 120,
                                        columnNumber: 21
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-mono text-gray-300",
                                        children: shortHash(e.txHash)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                        lineNumber: 129,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                lineNumber: 114,
                                columnNumber: 17
                            }, this)
                        ]
                    }, `${e.txHash}-${e.symbol}`, true, {
                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                        lineNumber: 109,
                        columnNumber: 15
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                lineNumber: 105,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
        lineNumber: 87,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/lib/safety.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/frontend/src/components/proof/SafetyBanner.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SafetyBanner",
    ()=>SafetyBanner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$safety$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/safety.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
function SafetyBanner({ endpoint = '/api/safety-state' }) {
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        status: 'loading'
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let cancelled = false;
        fetch(endpoint, {
            cache: 'no-store'
        }).then(async (res)=>{
            if (!res.ok) throw new Error(`safety-state returned ${res.status}`);
            const data = await res.json();
            if (!cancelled) setState({
                status: 'ok',
                data
            });
        }).catch((err)=>{
            console.error('[safety-banner] fetch failed', err);
            if (!cancelled) setState({
                status: 'error'
            });
        });
        return ()=>{
            cancelled = true;
        };
    }, [
        endpoint
    ]);
    if (state.status === 'loading') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            role: "status",
            "aria-label": "Loading safety state",
            className: "w-full rounded-xl border border-white/10 bg-dark-50/40 px-4 py-3",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-5 w-48 animate-pulse rounded bg-white/10"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                lineNumber: 48,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
            lineNumber: 43,
            columnNumber: 7
        }, this);
    }
    if (state.status === 'error') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            role: "alert",
            className: "w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-sm font-semibold text-red-200",
                    children: "Safety state unverified."
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 59,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-1 text-xs text-red-300/80",
                    children: "The /api/safety-state endpoint did not respond. Treat the release as unverified until the safety check completes."
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 62,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
            lineNumber: 55,
            columnNumber: 7
        }, this);
    }
    const apiOk = state.data.realTradingEnabled === false;
    const frontendOk = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$safety$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["REAL_TRADING_ENABLED"] === false;
    const modeOk = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$safety$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isEtoroModeAllowed"])(state.data.etoroMode);
    const safe = apiOk && frontendOk && modeOk;
    if (!safe) {
        const realTradingTripped = !apiOk || !frontendOk;
        const headline = realTradingTripped ? 'REFUSAL: real trading flag tripped. This release is NOT safe to ship.' : 'REFUSAL: ETORO_MODE is outside the allowed demo set. This release is NOT safe to ship.';
        const allowedList = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$safety$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ALLOWED_ETORO_MODES"].join(', ');
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            role: "alert",
            className: "w-full rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2 text-sm font-semibold text-red-200",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "inline-block h-2 w-2 rounded-full bg-red-400",
                            "aria-hidden": true
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                            lineNumber: 87,
                            columnNumber: 11
                        }, this),
                        headline
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 86,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-1 text-xs text-red-300/80",
                    children: [
                        "frontend.REAL_TRADING_ENABLED = ",
                        String(frontendOk ? false : true),
                        " · server.realTradingEnabled = ",
                        String(state.data.realTradingEnabled),
                        " · ETORO_MODE = ",
                        state.data.etoroMode || '(unset)'
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 90,
                    columnNumber: 9
                }, this),
                !modeOk && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-1 text-xs text-red-300/80",
                    children: [
                        "failed: ETORO_MODE (allowed: ",
                        allowedList,
                        ")"
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 96,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
            lineNumber: 82,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        role: "status",
        className: "w-full rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-wrap items-center gap-3 text-sm",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-green-300",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse",
                            "aria-hidden": true
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                            lineNumber: 111,
                            columnNumber: 11
                        }, this),
                        "Safe"
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 110,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-gray-300",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                            className: "text-green-300",
                            children: "REAL_TRADING_ENABLED = false"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                            lineNumber: 115,
                            columnNumber: 11
                        }, this),
                        " on both sides"
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 114,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-gray-500",
                    children: "·"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 117,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-gray-300",
                    children: [
                        "ETORO_MODE = ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                            className: "text-accent",
                            children: state.data.etoroMode
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                            lineNumber: 119,
                            columnNumber: 24
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 118,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
            lineNumber: 109,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
        lineNumber: 105,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/app/(app)/live-prices-proof/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LivePricesProofPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$LastDemoHedgePanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$LiveQuotesPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/LiveQuotesPanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$OnChainOraclePanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/OnChainOraclePanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$OracleUpdatesPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$SafetyBanner$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/SafetyBanner.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
function LivePricesProofPage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "aria-labelledby": "proof-page-heading",
        className: "mx-auto max-w-7xl px-4 py-8",
        "data-testid": "live-prices-proof-page",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent",
                        children: "Lane 6 · release proof"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 17,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        id: "proof-page-heading",
                        className: "text-2xl font-semibold text-white sm:text-3xl",
                        children: "Live Prices Proof"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 20,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-2 max-w-2xl text-sm text-gray-400",
                        children: [
                            "One-glance evidence that the full live-prices pipeline is alive: eToro quotes flow through the price-service, on-chain oracle reads return real numbers, recent ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                className: "text-accent",
                                children: "PriceUpdated"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                lineNumber: 26,
                                columnNumber: 18
                            }, this),
                            " events are observed, and the demo-hedge proof artifact reflects the latest hedge run."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 23,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                lineNumber: 16,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$SafetyBanner$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SafetyBanner"], {}, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$LiveQuotesPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LiveQuotesPanel"], {}, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$OnChainOraclePanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["OnChainOraclePanel"], {}, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$OracleUpdatesPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["OracleUpdatesPanel"], {}, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 36,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$LastDemoHedgePanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LastDemoHedgePanel"], {}, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 37,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                className: "mt-8 text-xs text-gray-500",
                children: "Reviewers: this page is the canonical Lane 6 proof artifact. If any panel is empty, the corresponding service is unreachable; degraded states are surfaced inline, not silently swallowed."
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                lineNumber: 40,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
        lineNumber: 11,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=frontend_src_0k8rw-w._.js.map