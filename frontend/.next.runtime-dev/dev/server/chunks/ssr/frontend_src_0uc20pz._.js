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
"[project]/frontend/src/lib/parseRunId.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseRunId",
    ()=>parseRunId
]);
/**
 * Parse the hedge engine's runId composite (filesystem-safe form
 * `YYYY-MM-DDTHH-MM-SS-mmm-<6-12 hex>`) into a human-readable ISO timestamp
 * plus the short hex disambiguator. Returns `null` for any input that does
 * not match the canonical pattern so renderers can fall back to the raw
 * string for older or hand-crafted run ids.
 *
 * Lives outside `LastDemoHedgePanel.tsx` so the panel file only exports
 * React components (Fast Refresh requirement) and so the pure parser is
 * unit-testable without involving the rendering layer.
 */ const RUNID_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})-([0-9a-f]{6,12})$/i;
function parseRunId(raw) {
    const m = RUNID_PATTERN.exec(raw);
    if (!m) return null;
    const [, date, hh, mm, ss, ms, tag] = m;
    return {
        iso: `${date}T${hh}:${mm}:${ss}.${ms}Z`,
        tag
    };
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
        case 'hedge-proof':
            return 'Hedge proof endpoint is unreachable. The /api/hedge-proof/latest route may be restarting.';
        case 'hedge-proof-shape':
            return 'Hedge proof file has an unexpected shape. Re-run the hedge engine to regenerate it.';
        case 'oracle-subscription':
            return 'PriceUpdated subscription is in an error state. The chain RPC may be unreachable or the WebSocket filter may have expired.';
    }
}
}),
"[project]/frontend/src/components/proof/PanelHeaderMeta.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MonoLinkAtom",
    ()=>MonoLinkAtom,
    "MonoSourceAtom",
    ()=>MonoSourceAtom,
    "PanelHeaderMeta",
    ()=>PanelHeaderMeta
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
;
function PanelHeaderMeta({ source, cadence }) {
    if (!source && !cadence) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-testid": "panel-header-meta",
        className: "flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500",
        children: [
            source,
            source && cadence ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "aria-hidden": true,
                children: "·"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PanelHeaderMeta.tsx",
                lineNumber: 29,
                columnNumber: 28
            }, this) : null,
            cadence
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/PanelHeaderMeta.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
function MonoSourceAtom({ value, title, ...rest }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "font-mono text-gray-400 truncate max-w-[55%]",
        title: title ?? value,
        ...rest,
        children: value
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/PanelHeaderMeta.tsx",
        lineNumber: 44,
        columnNumber: 5
    }, this);
}
function MonoLinkAtom({ value, href, title, ...rest }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
        href: href,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "font-mono text-gray-400 truncate max-w-[55%] underline-offset-2 hover:text-accent hover:underline transition-colors",
        title: title ?? value,
        ...rest,
        children: [
            value,
            " ↗"
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/PanelHeaderMeta.tsx",
        lineNumber: 64,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/proof/panelCountdown.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Pure formatter for the per-panel "next poll in Ns" caption rendered
 * by `NextPollCountdown` in `PanelHeaderControls.tsx`. Pulled out of
 * the component so unit tests can pin the wording without mocking
 * timers, and so Fast Refresh stays clean (a component file may only
 * export components).
 *
 * See task lane6-degraded-panels-offer-no-retry-or-open-url-or-next-poll-
 * countdown (0060).
 */ __turbopack_context__.s([
    "describeNextPoll",
    ()=>describeNextPoll
]);
function describeNextPoll({ lastPollAt, intervalMs, now, busy }) {
    if (busy) return 'polling…';
    if (lastPollAt === null) return 'next poll soon';
    const elapsed = Math.max(0, now - lastPollAt);
    const remainingMs = Math.max(0, intervalMs - elapsed);
    if (remainingMs <= 0) return 'polling…';
    const seconds = Math.max(1, Math.ceil(remainingMs / 1_000));
    return `next poll in ${seconds}s`;
}
}),
"[project]/frontend/src/components/proof/ProofNowProvider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProofNowProvider",
    ()=>ProofNowProvider,
    "useProofNow",
    ()=>useProofNow
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
/**
 * Page-scoped 1 s tick broadcaster for proof-page countdowns. One
 * `setInterval` drives every `NextPollCountdown` caption, so all three
 * panel headers tick in the same React commit and the proof page only
 * pays for one second-cadence timer. See task lane6-next-poll-countdown-
 * mounts-independent-1s-setintervals-per-panel (0066).
 */ const ProofNowContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
function ProofNowProvider({ children }) {
    const [now, setNow] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>Date.now());
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const id = setInterval(()=>setNow(Date.now()), 1_000);
        return ()=>clearInterval(id);
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofNowContext.Provider, {
        value: now,
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/ProofNowProvider.tsx",
        lineNumber: 28,
        columnNumber: 5
    }, this);
}
function useProofNow() {
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(ProofNowContext);
    const fallbackRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    if (ctx !== null) return ctx;
    if (fallbackRef.current === null) fallbackRef.current = Date.now();
    return fallbackRef.current;
}
}),
"[project]/frontend/src/components/proof/PanelHeaderControls.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NextPollCountdown",
    ()=>NextPollCountdown,
    "RetryButton",
    ()=>RetryButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$panelCountdown$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/panelCountdown.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofNowProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofNowProvider.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
/**
 * Shared "Retry now" button used in every proof data panel header. Pulled
 * out of the four panels into one place so the busy chrome (spinner,
 * disabled state, focus ring) stays identical across the family. Keep
 * this dependency-free and ARIA-correct — both the panel button and
 * the page-level "Refresh all" button consume the same chip CSS.
 *
 * See task lane6-degraded-panels-offer-no-retry-or-open-url-or-next-poll-
 * countdown (0060).
 */ const RETRY_BUTTON_BASE_CLASS = 'inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-gray-300 transition-colors hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-progress';
function RetryButton({ onRetry, busy, testId, label = 'Retry now', ariaLabel }) {
    const fireRetry = ()=>{
        if (busy) return;
        void onRetry();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        onClick: fireRetry,
        disabled: busy,
        "data-testid": testId,
        "aria-label": ariaLabel ?? (busy ? `${label} — in flight` : label),
        className: RETRY_BUTTON_BASE_CLASS,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RetryIcon, {
                spinning: busy
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PanelHeaderControls.tsx",
                lineNumber: 51,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: busy ? 'Retrying…' : label
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PanelHeaderControls.tsx",
                lineNumber: 52,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/PanelHeaderControls.tsx",
        lineNumber: 43,
        columnNumber: 5
    }, this);
}
function RetryIcon({ spinning }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        "aria-hidden": true,
        viewBox: "0 0 16 16",
        width: 11,
        height: 11,
        className: `text-gray-300 ${spinning ? 'animate-spin' : ''}`,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M3 8a5 5 0 0 1 8.5-3.5L13 6"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PanelHeaderControls.tsx",
                lineNumber: 71,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M13 3v3h-3"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PanelHeaderControls.tsx",
                lineNumber: 72,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M13 8a5 5 0 0 1-8.5 3.5L3 10"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PanelHeaderControls.tsx",
                lineNumber: 73,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M3 13v-3h3"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PanelHeaderControls.tsx",
                lineNumber: 74,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/PanelHeaderControls.tsx",
        lineNumber: 59,
        columnNumber: 5
    }, this);
}
function NextPollCountdown({ lastPollAt, intervalMs, testId, busy = false }) {
    const now = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofNowProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useProofNow"])();
    const text = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$panelCountdown$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["describeNextPoll"])({
            lastPollAt,
            intervalMs,
            now,
            busy
        }), [
        lastPollAt,
        intervalMs,
        now,
        busy
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": testId,
        title: "next scheduled poll",
        children: text
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/PanelHeaderControls.tsx",
        lineNumber: 115,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/proof/ProofPanelActionsProvider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProofPanelActionsProvider",
    ()=>ProofPanelActionsProvider,
    "usePanelRetry",
    ()=>usePanelRetry,
    "useProofPanelActionsContext",
    ()=>useProofPanelActionsContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
const NOOP_STATE = {
    registerPanelRetry: ()=>()=>undefined,
    retryPanel: ()=>Promise.resolve(),
    refreshAll: ()=>Promise.resolve(),
    isRetrying: ()=>false,
    anyRetrying: false
};
const ProofPanelActionsContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
function ProofPanelActionsProvider({ children }) {
    const retriesRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    const [retryingSet, setRetryingSet] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const markRetrying = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((key, value)=>{
        setRetryingSet((prev)=>{
            if (value === prev.has(key)) return prev;
            const next = new Set(prev);
            if (value) next.add(key);
            else next.delete(key);
            return next;
        });
    }, []);
    const registerPanelRetry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((key, fn)=>{
        retriesRef.current.set(key, fn);
        return ()=>{
            if (retriesRef.current.get(key) === fn) {
                retriesRef.current.delete(key);
            }
        };
    }, []);
    const retryPanel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (key)=>{
        const fn = retriesRef.current.get(key);
        if (!fn) return;
        markRetrying(key, true);
        try {
            await fn();
        } finally{
            markRetrying(key, false);
        }
    }, [
        markRetrying
    ]);
    const refreshAll = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        const keys = Array.from(retriesRef.current.keys());
        await Promise.allSettled(keys.map((k)=>retryPanel(k)));
    }, [
        retryPanel
    ]);
    const isRetrying = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((key)=>retryingSet.has(key), [
        retryingSet
    ]);
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            registerPanelRetry,
            retryPanel,
            refreshAll,
            isRetrying,
            anyRetrying: retryingSet.size > 0
        }), [
        registerPanelRetry,
        retryPanel,
        refreshAll,
        isRetrying,
        retryingSet
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofPanelActionsContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/ProofPanelActionsProvider.tsx",
        lineNumber: 131,
        columnNumber: 5
    }, this);
}
function useProofPanelActionsContext() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(ProofPanelActionsContext) ?? NOOP_STATE;
}
function usePanelRetry(key, retry) {
    const { registerPanelRetry, retryPanel, isRetrying } = useProofPanelActionsContext();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>registerPanelRetry(key, retry), [
        registerPanelRetry,
        key,
        retry
    ]);
    const busy = isRetrying(key);
    const fire = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>retryPanel(key), [
        retryPanel,
        key
    ]);
    return {
        busy,
        fire
    };
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
"[project]/frontend/src/components/proof/proofAxes.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Shared types, predicates, and verdict derivation for the proof page's
 * pipeline-axis machinery. Lifted out of `PipelineStatusBanner.tsx` and
 * `PipelineFlowDiagram.tsx` (which previously each carried byte-identical
 * copies) so the AlivenessRollup and the PipelineFlowDiagram cannot
 * disagree about what "healthy / degraded / unknown" means for any axis.
 *
 * See task lane6-pipeline-flow-onchain-nodes-render-unknown-while-rollup-says-degraded
 * (0050) for the contradiction this module is the root fix for.
 */ __turbopack_context__.s([
    "PANEL_BY_AXIS",
    ()=>PANEL_BY_AXIS,
    "TOTAL_AXIS_COUNT",
    ()=>TOTAL_AXIS_COUNT,
    "countResolvedAxes",
    ()=>countResolvedAxes,
    "deriveOnChainAxisFromRows",
    ()=>deriveOnChainAxisFromRows,
    "derivePartialVerdict",
    ()=>derivePartialVerdict,
    "deriveVerdict",
    ()=>deriveVerdict,
    "describeAxisForFlowNode",
    ()=>describeAxisForFlowNode,
    "isFreshQuotes",
    ()=>isFreshQuotes,
    "isHealthyOnChain",
    ()=>isHealthyOnChain,
    "reasonForAxis",
    ()=>reasonForAxis
]);
function isFreshQuotes(payload, stalenessMs) {
    if (typeof payload !== 'object' || payload === null) return false;
    const r = payload;
    const quotes = r.quotes;
    if (typeof quotes !== 'object' || quotes === null || Array.isArray(quotes)) return false;
    const values = Object.values(quotes);
    if (values.length === 0) return false;
    let freshestAge = Number.POSITIVE_INFINITY;
    for (const v of values){
        if (typeof v !== 'object' || v === null) continue;
        const q = v;
        if (typeof q.cacheAge !== 'number') continue;
        if (q.cacheAge < freshestAge) freshestAge = q.cacheAge;
    }
    if (!Number.isFinite(freshestAge)) return false;
    return freshestAge <= stalenessMs;
}
function isHealthyOnChain(data) {
    if (typeof data !== 'object' || data === null) return false;
    const r = data;
    const price8 = r.price8;
    const timestamp = r.timestamp;
    if (typeof price8 !== 'bigint' || typeof timestamp !== 'bigint') return false;
    return price8 > 0n && timestamp > 0n;
}
function deriveOnChainAxisFromRows(rows, isError, isUnknown) {
    if (isUnknown) return 'unknown';
    if (isError) return 'degraded';
    if (rows.length === 0) return 'degraded';
    for (const r of rows){
        if (isHealthyOnChain(r)) return 'healthy';
    }
    return 'degraded';
}
const PANEL_BY_AXIS = {
    quotes: {
        reason: 'price-service unreachable',
        anchor: 'panel-live-quotes'
    },
    onChain: {
        reason: 'no on-chain prices',
        anchor: 'panel-onchain-oracle'
    },
    hedgeProof: {
        reason: 'hedge-proof missing',
        anchor: 'panel-last-hedge'
    }
};
function reasonForAxis(axis) {
    return PANEL_BY_AXIS[axis].reason;
}
/**
 * User-facing word for each AxisHealth state. `unknown` renders as
 * `loading first read` because that's the same vocabulary the rollup
 * banner already uses on first paint ("Loading pipeline status"). The
 * `Record<AxisHealth, string>` type makes the mapping exhaustive — adding
 * a new AxisHealth value would be a compile-time error here.
 */ const STATE_WORD = {
    healthy: 'healthy',
    degraded: 'degraded',
    unknown: 'loading first read'
};
function describeAxisForFlowNode(nodeLabel, resolved, axisKey) {
    if (resolved.subordinated) {
        const underlying = resolved.ok ? STATE_WORD.healthy : `${STATE_WORD.degraded} — ${PANEL_BY_AXIS[axisKey].reason}`;
        return `${nodeLabel}: ${underlying} (mirroring upstream tone)`;
    }
    if (resolved.axis === 'degraded') {
        return `${nodeLabel}: ${STATE_WORD.degraded} — ${PANEL_BY_AXIS[axisKey].reason}`;
    }
    return `${nodeLabel}: ${STATE_WORD[resolved.axis]}`;
}
function deriveVerdict(axes) {
    const values = [
        axes.quotes,
        axes.onChain,
        axes.hedgeProof
    ];
    let unknownCount = 0;
    let healthyCount = 0;
    let degradedCount = 0;
    for (const v of values){
        if (v === 'unknown') unknownCount += 1;
        else if (v === 'healthy') healthyCount += 1;
        else degradedCount += 1;
    }
    if (unknownCount > 0) return 'loading';
    if (healthyCount === 3) return 'green';
    if (degradedCount === 3) return 'red';
    return 'amber';
}
const TOTAL_AXIS_COUNT = 3;
function countResolvedAxes(axes) {
    let resolved = 0;
    if (axes.quotes !== 'unknown') resolved += 1;
    if (axes.onChain !== 'unknown') resolved += 1;
    if (axes.hedgeProof !== 'unknown') resolved += 1;
    return resolved;
}
function derivePartialVerdict(axes) {
    const values = [
        axes.quotes,
        axes.onChain,
        axes.hedgeProof
    ];
    let resolved = 0;
    let healthy = 0;
    let degraded = 0;
    for (const v of values){
        if (v === 'unknown') continue;
        resolved += 1;
        if (v === 'healthy') healthy += 1;
        else degraded += 1;
    }
    if (resolved === 0) return 'loading';
    if (resolved === TOTAL_AXIS_COUNT && healthy === TOTAL_AXIS_COUNT) return 'green';
    if (resolved === TOTAL_AXIS_COUNT && degraded === TOTAL_AXIS_COUNT) return 'red';
    return 'amber';
}
}),
"[project]/frontend/src/components/proof/useProofPipelineAxes.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_ORACLE_EVENT_POLLING_INTERVAL_MS",
    ()=>DEFAULT_ORACLE_EVENT_POLLING_INTERVAL_MS,
    "useProofPipelineAxes",
    ()=>useProofPipelineAxes
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContracts.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/sanitiseClientError.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofAxes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/proofAxes.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
const DEFAULT_PRICE_SERVICE_URL = 'http://localhost:9300';
const DEFAULT_STALENESS_THRESHOLD_MS = 30_000;
/**
 * Off-chain `/quotes` and `/api/hedge-proof/latest` poll cadence (5s).
 * Matches the LiveQuotesPanel's "next poll" caption so the
 * rollup/flow tone and the panel's freshness chip can never disagree
 * on whether the service is reachable in the same render frame — see
 * task lane6-three-independent-quotes-pollers-at-conflicting-cadences (0051).
 */ const DEFAULT_OFF_CHAIN_INTERVAL_MS = 5_000;
/**
 * Chain `useReadContracts` cadence (30s). On-chain prices update on
 * block boundaries; polling the full 12-ticker multicall faster is
 * wasted RPC traffic. The hook owns the single timer; the axis-health
 * value is derived state, recomputed each render from the most recent
 * multicall snapshot — no second timer is needed for the rollup
 * (#0063 collapsed the previous 15s AAPL probe onto this poll).
 */ const DEFAULT_CHAIN_PANEL_INTERVAL_MS = 30_000;
const DEFAULT_ORACLE_EVENT_POLLING_INTERVAL_MS = 5_000;
const INITIAL_QUOTES_RESULT = {
    axis: 'unknown',
    status: 'loading',
    payload: null,
    at: null
};
const INITIAL_HEDGE_PROOF_RESULT = {
    axis: 'unknown',
    status: 'loading',
    payload: null,
    at: null
};
/**
 * Generic interval-with-manual-retry hook. Keeps the latest `fetchOnce`
 * closure in a ref so a manual retry always fires the most up-to-date
 * fetch, and so a `setInterval` callback never closes over a stale
 * dependency snapshot. The retry resets the interval so the next
 * scheduled poll fires `intervalMs` after the manual click rather than
 * immediately after.
 *
 * Pulled out of `useProofPipelineAxes` so the quotes and hedge-proof
 * pollers can run on independent timers, satisfying the per-panel
 * retry-isolation contract — see task lane6-degraded-panels-offer-no-
 * retry-or-open-url-or-next-poll-countdown (0060).
 */ function useIndependentPoller({ initial, intervalMs, fetchOnce }) {
    const [result, setResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(initial);
    const fetchOnceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(fetchOnce);
    fetchOnceRef.current = fetchOnce;
    const cancelledRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const timerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const tick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        const next = await fetchOnceRef.current();
        if (cancelledRef.current) return;
        setResult(next);
    }, []);
    const arm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(()=>void tick(), intervalMs);
    }, [
        intervalMs,
        tick
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        cancelledRef.current = false;
        void tick();
        arm();
        return ()=>{
            cancelledRef.current = true;
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
        };
    }, [
        arm,
        tick
    ]);
    const retry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        await tick();
        arm();
    }, [
        arm,
        tick
    ]);
    return {
        result,
        retry
    };
}
function useProofPipelineAxes({ priceServiceUrl = process.env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? DEFAULT_PRICE_SERVICE_URL, hedgeProofEndpoint = '/api/hedge-proof/latest', offChainIntervalMs = DEFAULT_OFF_CHAIN_INTERVAL_MS, chainPanelIntervalMs = DEFAULT_CHAIN_PANEL_INTERVAL_MS, stalenessThresholdMs = DEFAULT_STALENESS_THRESHOLD_MS } = {}) {
    const oracleAddress = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].StocksPriceOracle;
    const tickers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAllTickers"])(), []);
    // The contracts array is what wagmi keys the multicall on — make it
    // a stable reference so we don't re-arm every render. Empty array
    // when we can't read (no address / no tickers) keeps the type
    // inference happy and disables the underlying query.
    const onChainContracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!oracleAddress || tickers.length === 0) return [];
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
    // Pin all auto-refetch triggers off so the multicall fires only on
    // `refetchInterval` plus the manual `Retry now` button. Without these,
    // wagmi's TanStack Query defaults (refetchOnMount, refetchOnWindowFocus,
    // refetchOnReconnect — all `true`) fire 3-4 extra POSTs per cycle on
    // first paint and on tab focus. See task lane6-onchain-multicall-fires-
    // 4x-per-refresh-48-eth-calls-for-12-tickers (#0067).
    const { data: onChainData, error: onChainError, isLoading: onChainIsLoading, refetch: refetchOnChain } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts: onChainContracts,
        query: {
            enabled: onChainContracts.length > 0,
            refetchInterval: chainPanelIntervalMs,
            staleTime: chainPanelIntervalMs,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false
        }
    });
    const checkQuotes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        const at = Date.now();
        try {
            const res = await fetch(`${priceServiceUrl}/quotes`, {
                cache: 'no-store'
            });
            if (!res.ok) return {
                axis: 'degraded',
                status: 'error',
                payload: null,
                at
            };
            const body = await res.json();
            const axis = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofAxes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isFreshQuotes"])(body, stalenessThresholdMs) ? 'healthy' : 'degraded';
            return {
                axis,
                status: 'ok',
                payload: body,
                at
            };
        } catch (err) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitiseClientError"])('price-service', err);
            return {
                axis: 'degraded',
                status: 'error',
                payload: null,
                at
            };
        }
    }, [
        priceServiceUrl,
        stalenessThresholdMs
    ]);
    const checkHedgeProof = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        const at = Date.now();
        try {
            const res = await fetch(hedgeProofEndpoint, {
                cache: 'no-store'
            });
            if (res.status === 404) {
                return {
                    axis: 'degraded',
                    status: 'missing',
                    payload: null,
                    at
                };
            }
            if (!res.ok) return {
                axis: 'degraded',
                status: 'error',
                payload: null,
                at
            };
            const body = await res.json();
            return {
                axis: 'healthy',
                status: 'ok',
                payload: body,
                at
            };
        } catch (err) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitiseClientError"])('hedge-proof', err);
            return {
                axis: 'degraded',
                status: 'error',
                payload: null,
                at
            };
        }
    }, [
        hedgeProofEndpoint
    ]);
    const { result: quotes, retry: retryQuotes } = useIndependentPoller({
        initial: INITIAL_QUOTES_RESULT,
        intervalMs: offChainIntervalMs,
        fetchOnce: checkQuotes
    });
    const { result: hedgeProof, retry: retryHedgeProof } = useIndependentPoller({
        initial: INITIAL_HEDGE_PROOF_RESULT,
        intervalMs: offChainIntervalMs,
        fetchOnce: checkHedgeProof
    });
    // Decode the wagmi multicall into one tidy row per success. Skips
    // tickers whose slot reverted so callers don't have to thread error
    // branches through their render. Same decode shape the panel used
    // before #0063 — moved here so the panel can be a pure renderer.
    const onChainRows = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (!onChainData) return [];
        const out = [];
        for(let i = 0; i < tickers.length; i++){
            const r = onChainData[i];
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
        onChainData,
        tickers
    ]);
    // Log once per failed multicall — the panel renders a hardcoded copy
    // string so we keep the single sanitise + console.error pair here at
    // the data boundary (#0063).
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!onChainError) return;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitiseClientError"])('oracle-multicall', onChainError);
    }, [
        onChainError
    ]);
    const onChainStatus = onChainError ? 'error' : onChainIsLoading ? 'loading' : 'ok';
    const [onChainAt, setOnChainAt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (onChainData !== undefined || onChainError) setOnChainAt(Date.now());
    }, [
        onChainData,
        onChainError
    ]);
    const onChain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofAxes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deriveOnChainAxisFromRows"])(onChainRows, Boolean(onChainError), onChainData === undefined && !onChainError);
    const retryOnChain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        await refetchOnChain();
    }, [
        refetchOnChain
    ]);
    const axes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            quotes: quotes.axis,
            onChain,
            hedgeProof: hedgeProof.axis
        }), [
        quotes.axis,
        hedgeProof.axis,
        onChain
    ]);
    const verdict = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofAxes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deriveVerdict"])(axes), [
        axes
    ]);
    const partialVerdict = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofAxes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["derivePartialVerdict"])(axes), [
        axes
    ]);
    const resolvedAxisCount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofAxes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["countResolvedAxes"])(axes), [
        axes
    ]);
    const [lastFullyAliveAt, setLastFullyAliveAt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const lastFullyAliveBumpKey = `${quotes.axis}|${onChain}|${hedgeProof.axis}|${quotes.at ?? 0}|${hedgeProof.at ?? 0}`;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (axes.quotes === 'healthy' && axes.onChain === 'healthy' && axes.hedgeProof === 'healthy') {
            setLastFullyAliveAt(Date.now());
        }
    // The `lastFullyAliveBumpKey` literal in the dep array is what makes
    // each successive all-healthy poll bump the timestamp — even when
    // axis values themselves haven't changed across polls.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        lastFullyAliveBumpKey
    ]);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            axes,
            verdict,
            partialVerdict,
            resolvedAxisCount,
            lastFullyAliveAt,
            lastQuotesPayload: quotes.payload,
            lastQuotesAt: quotes.at,
            lastQuotesStatus: quotes.status,
            lastHedgeProofPayload: hedgeProof.payload,
            lastHedgeProofAt: hedgeProof.at,
            lastHedgeProofStatus: hedgeProof.status,
            onChainRows,
            onChainStatus,
            onChainAt,
            cadenceMs: offChainIntervalMs,
            onChainCadenceMs: chainPanelIntervalMs,
            priceServiceUrl,
            hedgeProofEndpoint,
            stalenessThresholdMs,
            retryQuotes,
            retryHedgeProof,
            retryOnChain
        }), [
        axes,
        verdict,
        partialVerdict,
        resolvedAxisCount,
        lastFullyAliveAt,
        quotes.payload,
        quotes.at,
        quotes.status,
        hedgeProof.payload,
        hedgeProof.at,
        hedgeProof.status,
        onChainRows,
        onChainStatus,
        onChainAt,
        offChainIntervalMs,
        chainPanelIntervalMs,
        priceServiceUrl,
        hedgeProofEndpoint,
        stalenessThresholdMs,
        retryQuotes,
        retryHedgeProof,
        retryOnChain
    ]);
}
}),
"[project]/frontend/src/components/proof/ProofPipelineAxesProvider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProofPipelineAxesProvider",
    ()=>ProofPipelineAxesProvider,
    "TestProofPipelineAxesProvider",
    ()=>TestProofPipelineAxesProvider,
    "useProofPipelineAxesContext",
    ()=>useProofPipelineAxesContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$useProofPipelineAxes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/useProofPipelineAxes.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const ProofPipelineAxesContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
function ProofPipelineAxesProvider({ children, ...opts }) {
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$useProofPipelineAxes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useProofPipelineAxes"])(opts);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofPipelineAxesContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/ProofPipelineAxesProvider.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
function useProofPipelineAxesContext() {
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(ProofPipelineAxesContext);
    if (ctx === null) {
        throw new Error('useProofPipelineAxesContext must be used inside <ProofPipelineAxesProvider>');
    }
    return ctx;
}
function TestProofPipelineAxesProvider({ value, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofPipelineAxesContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/ProofPipelineAxesProvider.tsx",
        lineNumber: 57,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/proof/proofRelativeAge.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Format an age in milliseconds into the proof-page family of relative-
 * time captions ("just now", "Ns ago", "Nm ago", "Nh ago"). Pure helper
 * — takes pre-computed age so callers own the "now" source (typically
 * `useProofNow()` from `ProofNowProvider`). Shared by
 * `LastDemoHedgePanel.RelativeTimestamp` and
 * `OracleUpdatesPanel`'s per-event caption — see tasks
 * lane6-last-demo-hedge-relative-timestamp-mounts-its-own-30s-setinterval-per-instance
 * (#0069) and lane6-oracle-updates-panel-formatrelative-never-ticks-stale-event-captions-and-no-shared-now
 * (#0070).
 *
 * Defensive against negative input (clock skew between server-side
 * timestamps and the page-scoped `useProofNow()` tick): clamps `ageMs`
 * to zero before bucketing.
 */ __turbopack_context__.s([
    "formatRelativeAge",
    ()=>formatRelativeAge
]);
function formatRelativeAge(ageMs) {
    const a = Math.max(0, ageMs);
    if (a < 1_000) return 'just now';
    if (a < 60_000) return `${Math.floor(a / 1_000)}s ago`;
    if (a < 3_600_000) return `${Math.floor(a / 60_000)}m ago`;
    return `${Math.floor(a / 3_600_000)}h ago`;
}
}),
"[project]/frontend/src/components/proof/panelHeaderMetaUtils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Pure helpers consumed by the proof-page header rails. Kept in a
 * separate module from `PanelHeaderMeta.tsx` so the component file
 * only exports components (fast-refresh friendly).
 */ /** Render an address as `0x{first4}…{last4}` for inline rail metadata. */ __turbopack_context__.s([
    "shortAddress",
    ()=>shortAddress,
    "shortenSourcePath",
    ()=>shortenSourcePath
]);
function shortAddress(addr) {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
function shortenSourcePath(path) {
    if (!path) return path;
    const parts = path.split('/').filter(Boolean);
    if (parts.length <= 2) return parts.join('/');
    return parts.slice(-2).join('/');
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
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$parseRunId$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/parseRunId.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/sanitiseClientError.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/PanelHeaderMeta.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderControls$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/PanelHeaderControls.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofNowProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofNowProvider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelActionsProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPanelActionsProvider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPipelineAxesProvider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofRelativeAge$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/proofRelativeAge.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$panelHeaderMetaUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/panelHeaderMetaUtils.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
;
;
;
;
const STATUS_PILL_BASE = 'rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider';
const STATUS_PILL_TONE = {
    neutral: 'bg-white/10 text-gray-200',
    buy: 'bg-green-500/10 text-green-300',
    sell: 'bg-red-500/10 text-red-300',
    accent: 'bg-accent/10 text-accent',
    safe: 'bg-green-500/10 text-green-300',
    symbol: 'bg-white/15 text-white'
};
function StatusPill({ tone, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `${STATUS_PILL_BASE} ${STATUS_PILL_TONE[tone]}`,
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 38,
        columnNumber: 10
    }, this);
}
function SymbolLabel({ symbol, notionalUsd }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "inline-flex items-baseline gap-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                tone: "symbol",
                children: symbol
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 44,
                columnNumber: 7
            }, this),
            notionalUsd !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "font-mono text-xs text-gray-100",
                children: formatUsd(notionalUsd)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 46,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 43,
        columnNumber: 5
    }, this);
}
const SHAPE_MISMATCH = 'SHAPE_MISMATCH';
function isExposure(v) {
    if (typeof v !== 'object' || v === null) return false;
    const e = v;
    return typeof e.netDelta === 'number' && typeof e.absExposure === 'number' && typeof e.blockNumber === 'number';
}
function isHedgeProof(v) {
    if (typeof v !== 'object' || v === null) return false;
    const p = v;
    return typeof p.runId === 'string' && typeof p.orderId === 'string' && typeof p.symbol === 'string' && (p.side === 'buy' || p.side === 'sell') && typeof p.notionalUsd === 'number' && typeof p.timestamp === 'number' && isExposure(p.beforeExposure) && isExposure(p.afterExposure) && typeof p.dryRun === 'boolean' && typeof p.etoroMode === 'string' && typeof p.realTradingEnabled === 'boolean';
}
function isProofEnvelope(v) {
    if (typeof v !== 'object' || v === null) return false;
    const e = v;
    return typeof e.source === 'string' && isHedgeProof(e.proof);
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
/**
 * Render the "Xs ago · HH:MM:SS UTC" caption for a hedge proof
 * timestamp. Reads the page-scoped 1s tick from `useProofNow()` so the
 * caption updates each second without a per-instance setInterval, and
 * ticks in lockstep with every other relative-age caption on the proof
 * page (panel countdowns, pipeline banner, oracle updates). See task
 * lane6-last-demo-hedge-relative-timestamp-mounts-its-own-30s-setinterval-per-instance
 * (#0069). Falls back to a stable captured `now` when no provider is
 * mounted, keeping isolated unit tests deterministic.
 */ function RelativeTimestamp({ ms }) {
    const now = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofNowProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useProofNow"])();
    const finite = Number.isFinite(ms) && ms !== 0;
    if (!finite) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            "data-testid": "hedge-timestamp",
            children: "—"
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
            lineNumber: 123,
            columnNumber: 12
        }, this);
    }
    const ageMs = Math.max(0, now - ms);
    const date = new Date(ms);
    const iso = date.toISOString();
    const local = date.toLocaleString(undefined, {
        timeZoneName: 'short'
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "hedge-timestamp",
        title: `${iso}\n${local}`,
        className: "inline-flex flex-wrap items-baseline gap-1",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "font-mono break-all text-gray-200",
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofRelativeAge$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatRelativeAge"])(ageMs)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 135,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "aria-hidden": true,
                className: "text-gray-500",
                children: "·"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 136,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "font-mono text-gray-400",
                children: [
                    iso.slice(11, 19),
                    " UTC"
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 137,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 130,
        columnNumber: 5
    }, this);
}
function LastDemoHedgePanel() {
    const { lastHedgeProofPayload, lastHedgeProofStatus, lastHedgeProofAt, cadenceMs, hedgeProofEndpoint, retryHedgeProof } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useProofPipelineAxesContext"])();
    const { busy, fire: handleRetry } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelActionsProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePanelRetry"])('hedgeProof', retryHedgeProof);
    const state = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (lastHedgeProofStatus === 'loading') return {
            status: 'loading'
        };
        if (lastHedgeProofStatus === 'missing') {
            return {
                status: 'missing',
                message: 'No hedge proof recorded yet.'
            };
        }
        if (lastHedgeProofStatus === 'error') {
            return {
                status: 'error',
                message: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitiseClientError"])('hedge-proof', new Error('hedge-proof fetch failed'))
            };
        }
        if (!isProofEnvelope(lastHedgeProofPayload)) {
            return {
                status: 'error',
                message: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitiseClientError"])('hedge-proof-shape', new Error(SHAPE_MISMATCH))
            };
        }
        return {
            status: 'ok',
            data: lastHedgeProofPayload
        };
    }, [
        lastHedgeProofStatus,
        lastHedgeProofPayload
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "panel-last-hedge",
        "aria-labelledby": "last-hedge-heading",
        className: "flex h-full flex-col rounded-2xl border border-white/10 bg-dark-100/60 p-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-3 flex flex-wrap items-center justify-between gap-y-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        id: "last-hedge-heading",
                        className: "text-sm font-semibold uppercase tracking-wider text-gray-400",
                        children: "Last Demo Hedge"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 192,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-center gap-x-3 gap-y-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PanelHeaderMeta"], {
                                source: state.status === 'ok' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MonoSourceAtom"], {
                                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$panelHeaderMetaUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["shortenSourcePath"])(state.data.source),
                                    title: state.data.source
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                    lineNumber: 199,
                                    columnNumber: 17
                                }, this) : undefined,
                                cadence: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderControls$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NextPollCountdown"], {
                                    lastPollAt: lastHedgeProofAt,
                                    intervalMs: cadenceMs,
                                    busy: busy,
                                    testId: "last-hedge-countdown"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                    lineNumber: 206,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 196,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderControls$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RetryButton"], {
                                onRetry: handleRetry,
                                busy: busy,
                                testId: "last-hedge-retry",
                                ariaLabel: "Re-fetch the latest hedge proof"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 214,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 195,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 191,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1",
                children: [
                    state.status === 'loading' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-32 animate-pulse rounded bg-white/5",
                        role: "status",
                        "aria-label": "Loading hedge proof"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 225,
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
                                lineNumber: 230,
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
                                        lineNumber: 232,
                                        columnNumber: 17
                                    }, this),
                                    " in",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                        className: "text-accent",
                                        children: " backend/hedge-engine"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                        lineNumber: 233,
                                        columnNumber: 13
                                    }, this),
                                    " to generate one."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 231,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: hedgeProofEndpoint,
                                target: "_blank",
                                rel: "noopener noreferrer",
                                "data-testid": "hedge-proof-url-link",
                                className: "mt-2 inline-flex items-center gap-1 font-mono text-xs text-gray-400 underline-offset-2 hover:text-accent hover:underline",
                                children: [
                                    hedgeProofEndpoint,
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        "aria-hidden": true,
                                        children: "↗"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                        lineNumber: 242,
                                        columnNumber: 34
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 235,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 229,
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
                                lineNumber: 249,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 text-yellow-300/80",
                                children: state.message
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 250,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: hedgeProofEndpoint,
                                target: "_blank",
                                rel: "noopener noreferrer",
                                "data-testid": "hedge-proof-url-link",
                                className: "mt-2 inline-flex items-center gap-1 font-mono text-xs text-yellow-100 underline-offset-2 hover:underline",
                                children: [
                                    hedgeProofEndpoint,
                                    " ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        "aria-hidden": true,
                                        children: "↗"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                        lineNumber: 258,
                                        columnNumber: 34
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 251,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 248,
                        columnNumber: 9
                    }, this),
                    state.status === 'ok' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofCard, {
                        proof: state.data.proof
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 263,
                        columnNumber: 33
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 223,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 186,
        columnNumber: 5
    }, this);
}
function ProofCard({ proof }) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$hedgeProof$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isNoOpProof"])(proof)) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NoOpCard, {
            proof: proof
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
            lineNumber: 271,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(HedgeCard, {
        proof: proof
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 273,
        columnNumber: 10
    }, this);
}
function HedgeCard({ proof }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3 text-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                        tone: proof.side === 'buy' ? 'buy' : 'sell',
                        children: proof.side
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 280,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SymbolLabel, {
                        symbol: proof.symbol,
                        notionalUsd: proof.notionalUsd
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 281,
                        columnNumber: 9
                    }, this),
                    proof.dryRun && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                        tone: "accent",
                        children: "DRY-RUN"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 282,
                        columnNumber: 26
                    }, this),
                    !proof.realTradingEnabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                        tone: "safe",
                        children: "real trading: false"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 284,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 279,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofMeta, {
                proof: proof
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 288,
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
                        lineNumber: 291,
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
                                lineNumber: 293,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-500",
                                children: "→"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 294,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-200",
                                children: formatUsd(proof.afterExposure.netDelta)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 295,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 292,
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
                        lineNumber: 297,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 290,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 278,
        columnNumber: 5
    }, this);
}
function NoOpCard({ proof }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3 text-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                        tone: "neutral",
                        children: "Below-threshold tick"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 309,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SymbolLabel, {
                        symbol: proof.symbol
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 310,
                        columnNumber: 9
                    }, this),
                    proof.dryRun && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                        tone: "accent",
                        children: "DRY-RUN"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 311,
                        columnNumber: 26
                    }, this),
                    !proof.realTradingEnabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                        tone: "safe",
                        children: "real trading: false"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 313,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 308,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-gray-400",
                children: "No hedge needed — exposure stayed inside the configured threshold; the engine still recorded a proof so the pipeline is observable."
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 317,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofMeta, {
                proof: proof
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 322,
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
                        lineNumber: 326,
                        columnNumber: 9
                    }, this),
                    ' ',
                    "· block #",
                    proof.beforeExposure.blockNumber
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 324,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 307,
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
                lineNumber: 336,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldNode, {
                label: "runId",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RunIdValue, {
                    raw: proof.runId
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                    lineNumber: 338,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 337,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldNode, {
                label: "timestamp",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RelativeTimestamp, {
                    ms: proof.timestamp
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                    lineNumber: 341,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 340,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                label: "etoroMode",
                value: proof.etoroMode
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 343,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 335,
        columnNumber: 5
    }, this);
}
function RunIdValue({ raw }) {
    const parsed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$parseRunId$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["parseRunId"])(raw);
    if (parsed === null) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            "data-testid": "hedge-runid",
            title: raw,
            className: "font-mono break-all text-gray-200",
            children: raw
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
            lineNumber: 352,
            columnNumber: 7
        }, this);
    }
    const wallclock = `${parsed.iso.slice(0, 10)} ${parsed.iso.slice(11, 19)} UTC`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "hedge-runid",
        title: raw,
        className: "inline-flex flex-wrap items-baseline gap-1",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "font-mono text-gray-200",
                children: wallclock
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 364,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "aria-hidden": true,
                className: "text-gray-500",
                children: "·"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 365,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "font-mono text-xs text-gray-400",
                children: parsed.tag
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 366,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CopyRunIdButton, {
                raw: raw
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 367,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 359,
        columnNumber: 5
    }, this);
}
function CopyRunIdButton({ raw }) {
    const [copied, setCopied] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const onClick = ()=>{
        void navigator.clipboard.writeText(raw).then(()=>{
            setCopied(true);
            setTimeout(()=>setCopied(false), 1_500);
        }).catch(()=>{
        // Insecure origin / browser without clipboard support. The
        // `title=` tooltip remains the user's fallback; no console
        // noise, no UI alert.
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        onClick: onClick,
        "data-testid": "hedge-runid-copy",
        "aria-label": copied ? 'runId copied to clipboard' : 'Copy raw runId to clipboard',
        className: "ml-1 inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-gray-300 hover:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-accent",
        children: copied ? 'copied' : 'copy'
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 388,
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
                lineNumber: 403,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                className: `mt-0.5 text-gray-200 ${mono ? 'font-mono break-all' : ''}`,
                children: value
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 404,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 402,
        columnNumber: 5
    }, this);
}
function FieldNode({ label, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                className: "text-[10px] uppercase tracking-wider text-gray-500",
                children: label
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 412,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                className: "mt-0.5 text-gray-200",
                children: children
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 413,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 411,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/lib/proofFormat.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * proofFormat — precision-aware USD formatter shared by the
 * /live-prices-proof panels.
 *
 * The price-service synthesiser emits stock prices at 2/3-decimal
 * precision and crypto prices at 4-decimal precision; the on-chain
 * oracle decodes 8-decimal big integers into floats. Without a
 * normalising formatter, the same instrument renders as `$426.10`
 * in one column and `$426.125` in another. This module picks the
 * digit count from the symbol's instrument class so MID, BID, ASK,
 * and the on-chain decode all read as a tidy ladder.
 */ __turbopack_context__.s([
    "CRYPTO_SYMBOLS",
    ()=>CRYPTO_SYMBOLS,
    "decimalsFor",
    ()=>decimalsFor,
    "formatProofUsd",
    ()=>formatProofUsd
]);
const CRYPTO_SYMBOLS = new Set([
    'BTC',
    'ETH',
    'SOL'
]);
function decimalsFor(symbol, value) {
    if (CRYPTO_SYMBOLS.has(symbol)) {
        if (value >= 1_000) return 2;
        if (value >= 1) return 4;
        return 6;
    }
    return 2;
}
function formatProofUsd(symbol, n) {
    if (!Number.isFinite(n)) return '—';
    const decimals = decimalsFor(symbol, n);
    return n.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}
}),
"[project]/frontend/src/components/proof/sessionPill.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * sessionPill — case-insensitive lookup that maps an instrument's
 * sessionState string to a Tailwind class string for its on-page chip.
 *
 * The price-service feed emits lowercase strings (`open`, `closed`)
 * while the on-chain oracle decoder uses capitalised labels
 * (`Open`, `Closed`, `Halted`, `PreMarket`, `AfterHours`). Lower-case
 * the input so the two callers share one source of truth, and so
 * minor punctuation variants (`pre-market`, `after-hours`) still map
 * to the right colour.
 *
 * Colour vocabulary matches the page's existing semantic ramp:
 * green for live, neutral gray for closed, yellow for pre/after,
 * red for halted (a trading-alarm condition).
 */ __turbopack_context__.s([
    "sessionPillClass",
    ()=>sessionPillClass
]);
function sessionPillClass(session) {
    const s = session.toLowerCase();
    if (s === 'open') return 'bg-green-500/10 text-green-300 ring-1 ring-green-500/20';
    if (s === 'closed') return 'bg-white/5 text-gray-400 ring-1 ring-white/10';
    if (s === 'premarket' || s === 'pre-market' || s === 'afterhours' || s === 'after-hours') {
        return 'bg-yellow-500/10 text-yellow-200 ring-1 ring-yellow-500/20';
    }
    if (s === 'halted') return 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30';
    return 'bg-white/5 text-gray-300 ring-1 ring-white/10';
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
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$proofFormat$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/proofFormat.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$sessionPill$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/sessionPill.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/PanelHeaderMeta.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderControls$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/PanelHeaderControls.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelActionsProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPanelActionsProvider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPipelineAxesProvider.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
/**
 * Render a compact host form of the configured price-service URL.
 * Drops the scheme, drops a bare trailing slash, and (critically) drops
 * any userinfo (URL.host excludes it by construction) so neither the
 * visible pill nor the tooltip leaks credentials. Malformed strings fall
 * back to their raw form so the pill remains informative even when
 * NEXT_PUBLIC_PRICE_SERVICE_URL is set to something unusual.
 */ function displayHost(url) {
    try {
        const u = new URL(url);
        const pathSuffix = u.pathname === '/' ? '' : u.pathname;
        return `${u.host}${pathSuffix}`;
    } catch  {
        return url;
    }
}
function spreadPct(bid, ask) {
    if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0) return 0;
    return (ask - bid) / ((ask + bid) / 2) * 100;
}
function formatAge(ms) {
    if (!Number.isFinite(ms) || ms < 0) return '—';
    if (ms < 1_000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60_000)}m`;
}
function computeFreshnessSummary(quotes, thresholdMs) {
    if (quotes.length === 0) return {
        kind: 'empty'
    };
    let minAgeMs = Number.POSITIVE_INFINITY;
    let totalStale = 0;
    for (const q of quotes){
        if (q.cacheAge < minAgeMs) minAgeMs = q.cacheAge;
        if (q.cacheAge > thresholdMs) totalStale += 1;
    }
    if (totalStale > 0) {
        return {
            kind: 'has-stale',
            minAgeMs,
            totalStale,
            total: quotes.length
        };
    }
    return {
        kind: 'all-current',
        minAgeMs,
        total: quotes.length
    };
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
function LiveQuotesPanel() {
    const { lastQuotesPayload, lastQuotesStatus, lastQuotesAt, cadenceMs, priceServiceUrl, stalenessThresholdMs, retryQuotes } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useProofPipelineAxesContext"])();
    const { busy, fire: handleRetry } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelActionsProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePanelRetry"])('quotes', retryQuotes);
    const state = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        if (lastQuotesStatus === 'loading') return {
            status: 'loading'
        };
        if (lastQuotesStatus === 'error') return {
            status: 'error',
            ctx: 'price-service'
        };
        if (!isQuotesResponse(lastQuotesPayload)) {
            return {
                status: 'error',
                ctx: 'price-service-shape'
            };
        }
        return {
            status: 'ok',
            data: lastQuotesPayload
        };
    }, [
        lastQuotesPayload,
        lastQuotesStatus
    ]);
    const quotesUrl = `${priceServiceUrl.replace(/\/$/, '')}/quotes`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "panel-live-quotes",
        "aria-labelledby": "live-quotes-heading",
        className: "flex h-full flex-col rounded-2xl border border-white/10 bg-dark-100/60 p-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-3 flex flex-wrap items-center justify-between gap-y-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        id: "live-quotes-heading",
                        className: "text-sm font-semibold uppercase tracking-wider text-gray-400",
                        children: "Live Quotes (price-service)"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 156,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-center gap-x-3 gap-y-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PanelHeaderMeta"], {
                                source: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MonoSourceAtom"], {
                                    value: displayHost(priceServiceUrl),
                                    "data-testid": "price-service-url"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                    lineNumber: 162,
                                    columnNumber: 15
                                }, this),
                                cadence: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderControls$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NextPollCountdown"], {
                                    lastPollAt: lastQuotesAt,
                                    intervalMs: cadenceMs,
                                    busy: busy,
                                    testId: "live-quotes-countdown"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                    lineNumber: 168,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                lineNumber: 160,
                                columnNumber: 11
                            }, this),
                            state.status === 'ok' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FreshnessChip, {
                                summary: computeFreshnessSummary(Object.values(state.data.quotes), stalenessThresholdMs)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                lineNumber: 176,
                                columnNumber: 37
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderControls$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RetryButton"], {
                                onRetry: handleRetry,
                                busy: busy,
                                testId: "live-quotes-retry",
                                ariaLabel: "Re-run live-quotes fetch"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                lineNumber: 179,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 159,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 155,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1",
                children: [
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
                                lineNumber: 192,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 190,
                        columnNumber: 9
                    }, this),
                    state.status === 'error' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(DegradedBox, {
                        ctx: state.ctx,
                        host: displayHost(priceServiceUrl),
                        quotesUrl: quotesUrl
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 198,
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
                                                lineNumber: 210,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "py-2 pr-3 font-medium text-right",
                                                children: "Mid"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                lineNumber: 211,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "py-2 pr-3 font-medium text-right",
                                                children: "Bid / Ask"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                lineNumber: 212,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "py-2 pr-3 font-medium text-right",
                                                children: "Spread"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                lineNumber: 213,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "py-2 pr-3 font-medium",
                                                children: "Session"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                lineNumber: 214,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                        lineNumber: 209,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                    lineNumber: 208,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    children: Object.values(state.data.quotes).length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                            colSpan: 5,
                                            className: "py-4 text-center text-xs text-gray-500",
                                            children: "No quotes returned. price-service may be running but not yet seeded."
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                            lineNumber: 220,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                        lineNumber: 219,
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
                                                    lineNumber: 229,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-2 pr-3 text-right font-mono text-gray-100",
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$proofFormat$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatProofUsd"])(q.symbol, q.mid)
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                    lineNumber: 230,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-2 pr-3 text-right font-mono text-gray-400",
                                                    children: [
                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$proofFormat$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatProofUsd"])(q.symbol, q.bid),
                                                        " / ",
                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$proofFormat$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatProofUsd"])(q.symbol, q.ask)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                    lineNumber: 231,
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
                                                    lineNumber: 234,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-2 pr-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            "data-testid": `session-pill-${q.symbol}`,
                                                            className: `rounded-md px-2 py-0.5 text-xs ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$sessionPill$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sessionPillClass"])(q.sessionState)}`,
                                                            children: q.sessionState
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                            lineNumber: 238,
                                                            columnNumber: 25
                                                        }, this),
                                                        stale && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            "data-testid": `quote-stale-${q.symbol}`,
                                                            className: "ml-2 inline-flex items-center gap-1 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-200",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "h-1.5 w-1.5 rounded-full bg-yellow-400",
                                                                    "aria-hidden": true
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                                    lineNumber: 249,
                                                                    columnNumber: 29
                                                                }, this),
                                                                "stale ",
                                                                formatAge(q.cacheAge)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                            lineNumber: 245,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                    lineNumber: 237,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, q.symbol, true, {
                                            fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                            lineNumber: 228,
                                            columnNumber: 21
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                    lineNumber: 217,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                            lineNumber: 207,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 206,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 188,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
        lineNumber: 150,
        columnNumber: 5
    }, this);
}
/**
 * Render the yellow degraded box with copy that depends on whether the
 * fetch failed at the network layer (price-service unreachable) or at
 * the payload layer (service answered but the shape was wrong). Both
 * branches surface the configured host so reviewers can see which
 * endpoint was attempted without opening devtools.
 *
 * The canned sanitised string is still produced and console-logged by
 * `sanitiseClientError` upstream — we just don't paint it twice into
 * the DOM (see lane6-live-quotes-error-panel-says-unreachable-twice).
 */ function DegradedBox({ ctx, host, quotesUrl }) {
    const HostPill = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
        href: quotesUrl,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "font-mono underline-offset-2 hover:text-yellow-100 hover:underline transition-colors",
        "data-testid": "price-service-url-link",
        "aria-label": `Open ${host} in a new tab`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "data-testid": "price-service-url-inline",
                children: host
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 296,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "aria-hidden": true,
                children: " ↗"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 297,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
        lineNumber: 288,
        columnNumber: 5
    }, this);
    switch(ctx){
        case 'price-service-shape':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-semibold",
                        children: "price-service returned an unexpected payload"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 304,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-1 text-yellow-300/80",
                        children: [
                            "The feed at ",
                            HostPill,
                            " is up but the response shape did not match the schema this panel expects. Re-run the price-service or check its build version."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 305,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 303,
                columnNumber: 9
            }, this);
        case 'price-service':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-semibold",
                        children: "price-service unreachable"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 313,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-1 text-yellow-300/80",
                        children: [
                            "Live quotes feed at ",
                            HostPill,
                            " is unreachable. The price-service may be offline or restarting."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 314,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 312,
                columnNumber: 9
            }, this);
    }
}
function FreshnessChip({ summary }) {
    if (summary.kind === 'empty') return null;
    const fresh = summary.kind === 'all-current';
    const dotClass = fresh ? 'bg-green-400' : 'bg-yellow-400';
    const toneClass = fresh ? 'inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-300' : 'inline-flex items-center gap-1.5 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-200';
    const summaryText = summary.kind === 'all-current' ? 'all current' : `${summary.totalStale} stale of ${summary.total}`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "quotes-freshness",
        className: toneClass,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `h-1.5 w-1.5 rounded-full ${dotClass}`,
                "aria-hidden": true
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 335,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: [
                    formatAge(summary.minAgeMs),
                    " · ",
                    summaryText
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 336,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
        lineNumber: 334,
        columnNumber: 5
    }, this);
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
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$proofFormat$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/proofFormat.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$sessionPill$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/sessionPill.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/PanelHeaderMeta.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderControls$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/PanelHeaderControls.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelActionsProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPanelActionsProvider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$panelHeaderMetaUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/panelHeaderMetaUtils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPipelineAxesProvider.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
;
;
;
/**
 * User-facing copy for a failed on-chain multicall. The underlying
 * error is already sanitised + logged at the data boundary inside
 * `useProofPipelineAxes` (#0063) so the panel only needs a stable
 * customer-readable string here; this keeps the panel a pure renderer
 * with no second sanitise pair.
 */ const ORACLE_MULTICALL_DEGRADED_COPY = 'The on-chain oracle is temporarily unreachable. The next scheduled poll will retry automatically.';
const SESSION_LABELS = {
    0: 'Open',
    1: 'PreMarket',
    2: 'AfterHours',
    3: 'Closed',
    4: 'Halted'
};
/**
 * Source-of-truth for the On-Chain Oracle table layout. Both the header
 * row and the screen-reader `<dl>` consume this array, so adding or
 * renaming a column is a one-line change. The descriptions are written
 * for a fresh non-engineer reviewer; they surface via the native `title=`
 * tooltip on hover and via `aria-describedby` for screen readers (see
 * task lane6-onchain-oracle-column-headers-unexplained-jargon).
 */ const COLUMNS = [
    {
        key: 'symbol',
        label: 'Symbol',
        shortDescription: 'Ticker the oracle is publishing for. One row per ticker the keeper expects to write.',
        align: 'left'
    },
    {
        key: 'price',
        label: 'Price (8-dec → USD)',
        shortDescription: 'On-chain price stored as an unsigned integer with 8 decimals of precision, divided by 1e8 to render as USD.',
        align: 'right'
    },
    {
        key: 'session',
        label: 'Session',
        shortDescription: 'Market session enum reported by the keeper: Open, PreMarket, AfterHours, Closed, or Halted.',
        align: 'left'
    },
    {
        key: 'conf',
        label: 'Conf',
        shortDescription: 'Confidence score (0-100) reported by the keeper for this round: how strongly the upstream feeds agreed on the price.',
        align: 'right'
    },
    {
        key: 'signers',
        label: 'Signers',
        shortDescription: 'Number of distinct authorised keeper keys that signed this price round (k-of-n multisig).',
        align: 'right'
    },
    {
        key: 'updated',
        label: 'Updated',
        shortDescription: 'How long ago this row was last written on-chain, derived from the row\u2019s on-chain timestamp.',
        align: 'right'
    }
];
function descIdFor(key) {
    return `onchain-oracle-col-desc-${key}`;
}
function formatUsd8(symbol, price8) {
    const v = Number(price8) / 1e8;
    if (!Number.isFinite(v) || v === 0) return '—';
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$proofFormat$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatProofUsd"])(symbol, v);
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
    const explorer = process.env.NEXT_PUBLIC_BLOCK_EXPLORER ?? process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ?? '';
    const tickers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAllTickers"])(), []);
    const { onChainRows: rows, onChainStatus, onChainAt, onChainCadenceMs, retryOnChain } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useProofPipelineAxesContext"])();
    const { busy, fire: handleRetry } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelActionsProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePanelRetry"])('onChain', retryOnChain);
    // `rows.length === 0` and `onChainStatus === 'loading'` only line up
    // before the first multicall settles; afterwards the loading flag
    // drops even on subsequent refetches (wagmi sets `isLoading=true`
    // only on the initial fetch), so the empty branch must key off the
    // resolved status, not row count alone.
    const isInitialLoad = onChainStatus === 'loading' && rows.length === 0;
    const isErrored = onChainStatus === 'error';
    const isEmptyResolved = onChainStatus === 'ok' && rows.length === 0;
    const hasRows = rows.length > 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "panel-onchain-oracle",
        "aria-labelledby": "onchain-oracle-heading",
        className: "flex h-full flex-col rounded-2xl border border-white/10 bg-dark-100/60 p-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-3 flex flex-wrap items-center justify-between gap-y-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        id: "onchain-oracle-heading",
                        className: "text-sm font-semibold uppercase tracking-wider text-gray-400",
                        children: "On-chain Oracle (getPriceData)"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 146,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-center gap-x-3 gap-y-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PanelHeaderMeta"], {
                                source: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(OracleAddressAtom, {
                                    oracleAddress: oracleAddress,
                                    explorer: explorer
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                    lineNumber: 151,
                                    columnNumber: 21
                                }, this),
                                cadence: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderControls$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["NextPollCountdown"], {
                                    lastPollAt: onChainAt,
                                    intervalMs: onChainCadenceMs,
                                    busy: busy,
                                    testId: "onchain-oracle-countdown"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                    lineNumber: 153,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 150,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderControls$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RetryButton"], {
                                onRetry: handleRetry,
                                busy: busy,
                                testId: "onchain-oracle-retry",
                                ariaLabel: "Re-run on-chain oracle multicall"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 161,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 149,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                lineNumber: 145,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1",
                children: [
                    isInitialLoad && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                                lineNumber: 174,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 172,
                        columnNumber: 9
                    }, this),
                    isErrored && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-semibold",
                                children: "Oracle multicall failed"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 181,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 text-yellow-300/80",
                                children: ORACLE_MULTICALL_DEGRADED_COPY
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 182,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 180,
                        columnNumber: 9
                    }, this),
                    isEmptyResolved && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "data-testid": "onchain-oracle-awaiting",
                        className: "rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-semibold",
                                children: "Awaiting first on-chain write"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 191,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-yellow-300/80",
                                children: "The oracle contract exists at the address above but no symbol has a non-zero price yet. The oracle-signer keeper writes prices on a fixed cadence — this panel will populate as soon as the first round lands."
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 192,
                                columnNumber: 11
                            }, this),
                            oracleAddress && explorer && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: `${explorer.replace(/\/$/, '')}/address/${oracleAddress}`,
                                target: "_blank",
                                rel: "noopener noreferrer",
                                "data-testid": "onchain-oracle-explorer-link",
                                className: "mt-2 inline-flex items-center gap-1 text-yellow-100 underline-offset-2 hover:underline",
                                "aria-label": `Open ${oracleAddress} on the block explorer`,
                                children: [
                                    "Open on block explorer ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        "aria-hidden": true,
                                        children: "↗"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                        lineNumber: 206,
                                        columnNumber: 38
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 198,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ExpectedSymbolsList, {
                                tickers: tickers
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 209,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 187,
                        columnNumber: 9
                    }, this),
                    hasRows && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "overflow-x-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "sr-only",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                                    children: COLUMNS.map((col)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                    children: col.label
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                    lineNumber: 219,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                    id: descIdFor(col.key),
                                                    children: col.shortDescription
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                    lineNumber: 220,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, col.key, true, {
                                            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                            lineNumber: 218,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                    lineNumber: 216,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 215,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                className: "w-full text-sm",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: "border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-500",
                                            children: COLUMNS.map((col)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(OracleHeaderCell, {
                                                    col: col
                                                }, col.key, false, {
                                                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                    lineNumber: 229,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                            lineNumber: 227,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                        lineNumber: 226,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                        children: rows.map((row)=>{
                                            const sessionLabel = SESSION_LABELS[row.session] ?? `enum(${row.session})`;
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                className: "border-b border-white/5 last:border-0",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3 font-medium text-white",
                                                        children: row.symbol
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                        lineNumber: 238,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3 text-right font-mono text-gray-100",
                                                        children: formatUsd8(row.symbol, row.price8)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                        lineNumber: 239,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            "data-testid": `session-pill-${row.symbol}`,
                                                            className: `rounded-md px-2 py-0.5 text-xs ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$sessionPill$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sessionPillClass"])(sessionLabel)}`,
                                                            children: sessionLabel
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                            lineNumber: 241,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                        lineNumber: 240,
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
                                                        lineNumber: 248,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3 text-right font-mono text-gray-300",
                                                        children: row.signerCount
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                        lineNumber: 249,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3 text-right text-xs text-gray-400",
                                                        children: formatAgo(row.timestamp)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                        lineNumber: 250,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, row.symbol, true, {
                                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                lineNumber: 237,
                                                columnNumber: 19
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                        lineNumber: 233,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 225,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 214,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                lineNumber: 170,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
        lineNumber: 140,
        columnNumber: 5
    }, this);
}
/**
 * Pick the right header source atom for the on-chain oracle address.
 * Renders the explorer link when both pieces are configured, the plain
 * mono span when only the address is configured, or nothing when no
 * address is known so the panel-header rail collapses to empty.
 *
 * The visible value is the canonical `0x{first6}…{last4}` short form
 * (#0072) so this panel renders the same string `OracleUpdatesPanel`
 * does — the two adjacent proof-page panels can no longer disagree on
 * how the same `CONTRACTS.StocksPriceOracle` address looks. The
 * `title` tooltip, the `aria-label`, and the explorer `href` all keep
 * the full hex so power users (and screen-reader users) reach the
 * exact address.
 */ function OracleAddressAtom({ oracleAddress, explorer }) {
    if (!oracleAddress) return null;
    const visible = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$panelHeaderMetaUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["shortAddress"])(oracleAddress);
    if (explorer) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MonoLinkAtom"], {
            value: visible,
            href: `${explorer.replace(/\/$/, '')}/address/${oracleAddress}`,
            "data-testid": "oracle-address-link",
            "aria-label": `Open ${oracleAddress} on block explorer`,
            title: oracleAddress
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
            lineNumber: 288,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MonoSourceAtom"], {
        value: visible,
        "data-testid": "oracle-address-text",
        title: oracleAddress
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
        lineNumber: 298,
        columnNumber: 5
    }, this);
}
/**
 * Awaiting-state expected-symbols list. Renders the configured ticker
 * set as a tidy grid of small mono pills, one chip per ticker, under a
 * labelled `EXPECTED SYMBOLS (N)` heading. Replaces the previous inline
 * comma-joined mono string so prose stays prose and the symbol set
 * reads as a list of equal atoms — see #0046.
 */ function ExpectedSymbolsList({ tickers }) {
    if (tickers.length === 0) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-2.5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-[10px] font-semibold uppercase tracking-wider text-yellow-300/70",
                children: [
                    "Expected symbols (",
                    tickers.length,
                    ")"
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                lineNumber: 317,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                "data-testid": "onchain-oracle-expected-symbols",
                className: "mt-1 flex flex-wrap gap-1.5",
                children: tickers.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: "rounded-md border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 font-mono text-[10px] text-yellow-100/90",
                        children: t
                    }, t, false, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 325,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                lineNumber: 320,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
        lineNumber: 316,
        columnNumber: 5
    }, this);
}
function OracleHeaderCell({ col }) {
    const alignClass = col.align === 'right' ? 'py-2 pr-3 font-medium text-right' : 'py-2 pr-3 font-medium';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
        scope: "col",
        className: alignClass,
        title: col.shortDescription,
        "aria-describedby": descIdFor(col.key),
        "data-testid": `onchain-oracle-header-${col.key}`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "inline-flex items-center gap-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: col.label
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                    lineNumber: 348,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    "aria-hidden": true,
                    className: "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/20 bg-white/5 text-[9px] font-bold text-gray-400",
                    children: "?"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                    lineNumber: 349,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
            lineNumber: 347,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
        lineNumber: 340,
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
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/sanitiseClientError.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/PanelHeaderMeta.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderControls$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/PanelHeaderControls.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofNowProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofNowProvider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelActionsProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPanelActionsProvider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$panelHeaderMetaUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/panelHeaderMetaUtils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPipelineAxesProvider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofRelativeAge$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/proofRelativeAge.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$useProofPipelineAxes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/useProofPipelineAxes.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
;
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
/**
 * Per-row leaf component that renders the "Xs ago" caption for an
 * oracle event timestamp. Subscribes to the page-scoped 1s tick from
 * `useProofNow()` so the caption keeps updating between events without
 * waiting for a fresh `PriceUpdated` log to land — see task lane6-
 * oracle-updates-panel-formatrelative-never-ticks-stale-event-captions-and-no-shared-now
 * (#0070). Only this leaf re-renders per tick; the panel header and
 * subscription banner stay stable.
 */ function RelativeAge({ ts }) {
    const now = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofNowProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useProofNow"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofRelativeAge$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatRelativeAge"])(Math.max(0, now - ts))
    }, void 0, false);
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
    const { axes } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useProofPipelineAxesContext"])();
    // Gate the watcher on the on-chain axis: when the axis is degraded
    // or unknown, no keeper writes can reach the chain anyway, so
    // polling the empty filter is pure waste — see task lane6-watch-
    // contract-event-block-poll-rate-uncapped (0064). The yellow
    // "subscription degraded" notice stays reserved for real wagmi
    // `onError` callbacks; an axis-paused state is communicated by the
    // header cadence caption only.
    const subscriptionEnabled = Boolean(oracleAddress) && axes.onChain === 'healthy';
    const [events, setEvents] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [subscriptionError, setSubscriptionError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [subscriptionEpoch, setSubscriptionEpoch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const onLogs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((logs)=>{
        setSubscriptionError(null);
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
    const onError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((err)=>{
        setSubscriptionError((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitiseClientError"])('oracle-subscription', err));
    }, []);
    const retry = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        setSubscriptionError(null);
        setSubscriptionEpoch((e)=>e + 1);
    }, []);
    const { busy, fire: handleRetry } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelActionsProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePanelRetry"])('oracleEvents', retry);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "panel-oracle-updates",
        "aria-labelledby": "oracle-updates-heading",
        className: "flex h-full flex-col rounded-2xl border border-white/10 bg-dark-100/60 p-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(OracleEventSubscription, {
                oracleAddress: oracleAddress,
                enabled: subscriptionEnabled,
                pollingInterval: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$useProofPipelineAxes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DEFAULT_ORACLE_EVENT_POLLING_INTERVAL_MS"],
                onLogs: onLogs,
                onError: onError
            }, subscriptionEpoch, false, {
                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                lineNumber: 123,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-3 flex flex-wrap items-center justify-between gap-y-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        id: "oracle-updates-heading",
                        className: "text-sm font-semibold uppercase tracking-wider text-gray-400",
                        children: "Recent Oracle Updates"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                        lineNumber: 132,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-center gap-x-3 gap-y-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PanelHeaderMeta"], {
                                source: oracleAddress ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MonoSourceAtom"], {
                                    value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$panelHeaderMetaUtils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["shortAddress"])(oracleAddress),
                                    title: oracleAddress
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                    lineNumber: 139,
                                    columnNumber: 17
                                }, this) : undefined,
                                cadence: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    "data-testid": "oracle-updates-status",
                                    children: cadenceCaption({
                                        subscriptionError,
                                        subscriptionEnabled,
                                        onChainAxis: axes.onChain
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                    lineNumber: 143,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                lineNumber: 136,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderControls$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RetryButton"], {
                                onRetry: handleRetry,
                                busy: busy,
                                testId: "oracle-updates-retry",
                                ariaLabel: "Re-subscribe to PriceUpdated events"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                lineNumber: 152,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                        lineNumber: 135,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                lineNumber: 131,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1",
                children: [
                    subscriptionError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-semibold",
                                children: "Oracle event subscription degraded"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                lineNumber: 164,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 text-yellow-300/80",
                                children: subscriptionError
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                lineNumber: 165,
                                columnNumber: 11
                            }, this),
                            oracleAddress && explorer && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: `${explorer.replace(/\/$/, '')}/address/${oracleAddress}`,
                                target: "_blank",
                                rel: "noopener noreferrer",
                                "data-testid": "oracle-updates-explorer-link",
                                className: "mt-2 inline-flex items-center gap-1 text-yellow-100 underline-offset-2 hover:underline",
                                children: [
                                    "View events on block explorer ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        "aria-hidden": true,
                                        children: "↗"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                        lineNumber: 174,
                                        columnNumber: 45
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                lineNumber: 167,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                        lineNumber: 163,
                        columnNumber: 9
                    }, this),
                    events.length === 0 ? subscriptionError ? null : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-white/5 bg-white/[0.02] p-4 text-xs text-gray-500",
                        children: [
                            "Listening for ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                className: "text-gray-400",
                                children: "PriceUpdated"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                lineNumber: 183,
                                columnNumber: 27
                            }, this),
                            " events. None observed yet; this populates as the oracle-signer keeper writes to the chain.",
                            SESSION_LABEL[0] ? null : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                        lineNumber: 182,
                        columnNumber: 11
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
                                                lineNumber: 195,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-mono text-xs text-gray-400",
                                                children: formatUsd8(e.price8)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                                lineNumber: 196,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                        lineNumber: 194,
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
                                                lineNumber: 199,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-gray-500",
                                                children: "·"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                                lineNumber: 200,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-gray-400",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RelativeAge, {
                                                    ts: e.capturedAt
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                                    lineNumber: 201,
                                                    columnNumber: 51
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                                lineNumber: 201,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-gray-500",
                                                children: "·"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                                lineNumber: 202,
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
                                                lineNumber: 204,
                                                columnNumber: 21
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-mono text-gray-300",
                                                children: shortHash(e.txHash)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                                lineNumber: 213,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                        lineNumber: 198,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, `${e.txHash}-${e.symbol}`, true, {
                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                lineNumber: 193,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                        lineNumber: 189,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                lineNumber: 161,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
        lineNumber: 118,
        columnNumber: 5
    }, this);
}
/**
 * Renders nothing — exists purely to host a `useWatchContractEvent`
 * subscription whose lifetime can be reset via React's `key` prop.
 * The parent re-mounts this component (by bumping
 * `subscriptionEpoch`) when the user clicks `Retry now`, so a stale
 * filter/RPC connection is fully torn down and a fresh subscription
 * is opened — no manual `enabled: false → true` toggle required.
 */ /**
 * Map the watcher's resolved state into the cadence-slot caption.
 * Four mutually-exclusive branches in priority order:
 *  1. `subscriptionError` — wagmi raised `onError`. Reserved for real
 *     subscription failures; communicated by the yellow banner too.
 *  2. `subscriptionEnabled` — watcher is armed and polling.
 *  3. `onChainAxis === 'unknown'` — first paint, axis not resolved.
 *  4. Otherwise — axis is `'degraded'`; no keeper writes can land.
 */ function cadenceCaption({ subscriptionError, subscriptionEnabled, onChainAxis }) {
    if (subscriptionError) return 'subscription degraded';
    if (subscriptionEnabled) return `live · last ${MAX_EVENTS} PriceUpdated events`;
    if (onChainAxis === 'unknown') return 'subscription paused · awaiting on-chain axis';
    return 'subscription paused · on-chain axis degraded';
}
function OracleEventSubscription({ oracleAddress, enabled, pollingInterval, onLogs, onError }) {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWatchContractEvent$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWatchContractEvent"])({
        address: oracleAddress,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PriceOracleABI"],
        eventName: 'PriceUpdated',
        onLogs,
        onError,
        enabled,
        pollingInterval
    });
    return null;
}
}),
"[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PipelineFlowDiagram",
    ()=>PipelineFlowDiagram
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofAxes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/proofAxes.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPipelineAxesProvider.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
/**
 * Per-node jump target for the flow diagram. Finer-grained than the
 * axis-keyed `PANEL_BY_AXIS` (which the rollup chip row still owns)
 * because two nodes that share the same `onChain` axis can still want
 * different panel destinations: `oracle-signer` is the WRITE side (its
 * output is the keeper's `PriceUpdated` events), `chain`/`frontend` are
 * the READ side (multicall over `getPriceData`). Pre-0073 all three
 * shared `#panel-onchain-oracle`, which made the OracleUpdatesPanel
 * unreachable from the diagram and conflated the keeper with its
 * read-side mirror — see task #0073.
 */ const PANEL_BY_NODE = {
    etoro: null,
    'price-service': {
        anchor: 'panel-live-quotes',
        humanName: 'live quotes'
    },
    'oracle-signer': {
        anchor: 'panel-oracle-updates',
        humanName: 'recent oracle updates'
    },
    chain: {
        anchor: 'panel-onchain-oracle',
        humanName: 'on-chain oracle'
    },
    frontend: {
        anchor: 'panel-onchain-oracle',
        humanName: 'on-chain oracle'
    },
    'demo-hedge': {
        anchor: 'panel-last-hedge',
        humanName: 'last demo hedge'
    }
};
const NODES = [
    {
        id: 'etoro',
        label: 'eToro',
        axis: 'quotes',
        subtitle: 'demo'
    },
    {
        id: 'price-service',
        label: 'price-service',
        axis: 'quotes'
    },
    {
        id: 'oracle-signer',
        label: 'oracle-signer',
        axis: 'onChain'
    },
    {
        id: 'chain',
        label: 'chain',
        axis: 'onChain'
    },
    {
        id: 'frontend',
        label: 'frontend',
        axis: 'onChain'
    },
    {
        id: 'demo-hedge',
        label: 'demo hedge',
        axis: 'hedgeProof'
    }
];
const EDGES = [
    {
        id: 'etoro-price-service',
        axis: 'quotes'
    },
    {
        id: 'price-service-oracle-signer',
        axis: 'onChain'
    },
    {
        id: 'oracle-signer-chain',
        axis: 'onChain'
    },
    {
        id: 'chain-frontend',
        axis: 'onChain'
    },
    {
        id: 'frontend-demo-hedge',
        axis: 'hedgeProof'
    }
];
const TONE_NODE_CLASS = {
    healthy: 'border-green-500/40 bg-green-500/10 text-green-200',
    degraded: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-100',
    unknown: 'border-white/10 bg-white/5 text-gray-400 animate-pulse'
};
const TONE_EDGE_CLASS = {
    healthy: 'text-green-400',
    degraded: 'text-yellow-400',
    unknown: 'text-white/40'
};
function axisToTone(axis) {
    switch(axis){
        case 'healthy':
            return 'healthy';
        case 'degraded':
            return 'degraded';
        case 'unknown':
            return 'unknown';
    }
}
/**
 * Visual prominence of each axis state on the pipeline-flow diagram.
 * Lower values dominate higher ones because the page reads worst-case
 * tones first (degraded/unknown surfaces before healthy). Used by
 * `dominantUpstreamTone` to pick the upstream tone the terminal
 * `demo-hedge` segment should inherit when it would otherwise look
 * orphaned — see #0047.
 */ const TONE_PROMINENCE = {
    unknown: 0,
    degraded: 1,
    healthy: 2
};
function dominantUpstreamTone(quotes, onChain) {
    return TONE_PROMINENCE[quotes] <= TONE_PROMINENCE[onChain] ? quotes : onChain;
}
/**
 * Pick the rendered axis state for a single node/edge segment. The
 * upstream axes (`quotes`, `onChain`) always paint their own state;
 * the trailing `hedgeProof` segment subordinates to the dominant
 * upstream tone when upstream is non-healthy so the terminal node
 * stays visually connected to the chain. Underlying truth survives
 * via the `ok` flag, which drives a small indicator dot on the
 * subordinated node — see #0047.
 */ function resolveAxisForSegment(axis, axes) {
    if (axis !== 'hedgeProof') {
        return {
            axis: axes[axis],
            subordinated: false,
            ok: axes[axis] === 'healthy'
        };
    }
    const upstream = dominantUpstreamTone(axes.quotes, axes.onChain);
    const ok = axes.hedgeProof === 'healthy';
    if (upstream === 'healthy') return {
        axis: axes.hedgeProof,
        subordinated: false,
        ok
    };
    return {
        axis: upstream,
        subordinated: true,
        ok
    };
}
function resolveNodesForRender(axes) {
    return NODES.map((node, idx)=>{
        const resolved = resolveAxisForSegment(node.axis, axes);
        const edge = EDGES[idx];
        const edgeResolved = edge ? resolveAxisForSegment(edge.axis, axes) : null;
        return {
            spec: node,
            tone: axisToTone(resolved.axis),
            statusSentence: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofAxes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["describeAxisForFlowNode"])(node.label, resolved, node.axis),
            showHedgeProofIndicator: node.id === 'demo-hedge' && resolved.subordinated && resolved.ok,
            trailingEdge: edge && edgeResolved ? {
                spec: edge,
                tone: axisToTone(edgeResolved.axis)
            } : null
        };
    });
}
function PipelineFlowDiagram() {
    const { axes } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useProofPipelineAxesContext"])();
    const resolved = resolveNodesForRender(axes);
    // Single source of truth for "is the hedge-proof subordinated indicator
    // currently on screen?". The FlowNode for `demo-hedge` reads this via
    // `showHedgeProofIndicator` (inside `resolveNodesForRender`) and the
    // `ToneLegend`'s 4th entry reads it via prop — see #0075. Computed
    // once here so the two consumers cannot drift.
    const hedgeIndicatorVisible = resolved.some((r)=>r.spec.id === 'demo-hedge' && r.showHedgeProofIndicator);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "aria-label": "Pipeline flow",
        "data-testid": "pipeline-flow-diagram",
        className: "rounded-2xl border border-white/10 bg-dark-100/40 px-4 py-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                "data-testid": "pipeline-flow-mobile",
                "data-variant": "mobile",
                className: "flex flex-col gap-2 text-xs sm:hidden",
                children: resolved.map((r, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FlowNode, {
                                spec: r.spec,
                                tone: r.tone,
                                statusSentence: r.statusSentence,
                                showHedgeProofIndicator: r.showHedgeProofIndicator,
                                trailingEdge: null
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                                lineNumber: 232,
                                columnNumber: 13
                            }, this),
                            idx < resolved.length - 1 && r.trailingEdge && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MobileChevron, {
                                edge: r.trailingEdge
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                                lineNumber: 240,
                                columnNumber: 15
                            }, this)
                        ]
                    }, `mobile-${r.spec.id}`, true, {
                        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                        lineNumber: 231,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 225,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                "data-testid": "pipeline-flow-desktop",
                "data-variant": "desktop",
                className: "hidden flex-wrap items-center gap-y-2 text-xs sm:flex",
                children: resolved.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FlowNode, {
                        spec: r.spec,
                        tone: r.tone,
                        statusSentence: r.statusSentence,
                        showHedgeProofIndicator: r.showHedgeProofIndicator,
                        trailingEdge: r.trailingEdge
                    }, `desktop-${r.spec.id}`, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                        lineNumber: 251,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 245,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ToneLegend, {
                hedgeIndicatorVisible: hedgeIndicatorVisible
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 261,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
        lineNumber: 220,
        columnNumber: 5
    }, this);
}
/**
 * Standalone `↓` chevron for the mobile vertical stack. Renders its own
 * `<li>` so the previous node and the next node share no DOM ancestry
 * with the chevron — flex-wrap orphaning is structurally impossible
 * (the mobile stack does not wrap; each row is one item).
 */ function MobileChevron({ edge }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
        role: "presentation",
        "data-testid": `pipeline-edge-${edge.spec.id}`,
        "data-tone": edge.tone,
        className: `self-center text-base leading-none ${TONE_EDGE_CLASS[edge.tone]}`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            "aria-hidden": true,
            children: "↓"
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
            lineNumber: 280,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
        lineNumber: 274,
        columnNumber: 5
    }, this);
}
/**
 * Inline tone legend mapping each pipeline-flow tone family to its
 * user-facing word — see #0057. The legend is descriptive content, not
 * interactive, and is wrapped in an `aria-label`-ed `<ul>` so screen
 * readers announce it as a single grouped region.
 *
 * Layout: on viewports ≥ sm the legend right-aligns on the same row as
 * the node strip wraps onto when there's space; on smaller viewports it
 * wraps below. The swatch uses a tiny ringed circle (not the node's
 * rounded-lg rectangle) so the visual primitive is clearly "swatch",
 * not "pill".
 *
 * The optional 4th entry (`pipeline-legend-hedge-subordinated`) only
 * renders when `hedgeIndicatorVisible` is true — the same boolean that
 * gates the green indicator dot on the demo-hedge pill (#0075). The
 * legend's job is to describe glyphs ON THIS DIAGRAM, RIGHT NOW; an
 * entry for a glyph that isn't present sends the reviewer hunting for
 * something that doesn't exist.
 */ function ToneLegend({ hedgeIndicatorVisible }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
        "aria-label": "Pipeline tone legend",
        "data-testid": "pipeline-flow-legend",
        className: "mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-wider text-gray-400 sm:mt-1 sm:justify-end",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                className: "inline-flex items-center gap-1.5",
                "data-testid": "pipeline-legend-healthy",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": true,
                        className: "inline-block h-2 w-2 rounded-full border border-green-500/50 bg-green-500/20"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                        lineNumber: 312,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "healthy"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                        lineNumber: 316,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 311,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                className: "inline-flex items-center gap-1.5",
                "data-testid": "pipeline-legend-degraded",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": true,
                        className: "inline-block h-2 w-2 rounded-full border border-yellow-500/50 bg-yellow-500/20"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                        lineNumber: 319,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "degraded"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                        lineNumber: 323,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 318,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                className: "inline-flex items-center gap-1.5",
                "data-testid": "pipeline-legend-loading",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": true,
                        className: "inline-block h-2 w-2 rounded-full border border-white/15 bg-white/5"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                        lineNumber: 326,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "loading"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                        lineNumber: 330,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 325,
                columnNumber: 7
            }, this),
            hedgeIndicatorVisible && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                className: "inline-flex items-center gap-1.5 sm:ml-2",
                "data-testid": "pipeline-legend-hedge-subordinated",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": true,
                        className: "inline-block h-1.5 w-1.5 rounded-full bg-green-400/80"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                        lineNumber: 351,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "hedge-proof healthy (mirroring upstream tone)"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                        lineNumber: 355,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 347,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
        lineNumber: 306,
        columnNumber: 5
    }, this);
}
const PILL_BASE_CLASS = 'inline-flex items-baseline gap-1.5 rounded-lg border px-3 py-1.5';
const PILL_INTERACTIVE_CLASS = 'no-underline transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-100 focus-visible:ring-accent/60';
function FlowNode({ spec, tone, statusSentence, trailingEdge, showHedgeProofIndicator }) {
    // Per-node jump target — finer-grained than `PANEL_BY_AXIS` so the
    // write-side (`oracle-signer` → OracleUpdatesPanel) and the read-side
    // (`chain`/`frontend` → OnChainOraclePanel) don't share one anchor
    // (#0073). `etoro` is intentionally `null` (no first-class panel).
    const jumpTarget = PANEL_BY_NODE[spec.id];
    const pillClass = `${PILL_BASE_CLASS} ${TONE_NODE_CLASS[tone]}`;
    const pillContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "font-mono uppercase tracking-wider",
                children: spec.label
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 389,
                columnNumber: 7
            }, this),
            spec.subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-[10px] uppercase tracking-wider text-gray-400",
                children: spec.subtitle
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 391,
                columnNumber: 9
            }, this),
            showHedgeProofIndicator && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "aria-hidden": true,
                "data-testid": `pipeline-node-${spec.id}-indicator`,
                title: "hedge-proof axis healthy — pill colour mirrors upstream tone",
                className: "ml-1 inline-block h-1.5 w-1.5 self-center rounded-full bg-green-400/80"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 394,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
        "data-testid": `pipeline-node-${spec.id}`,
        "data-tone": tone,
        className: "inline-flex items-center",
        children: [
            jumpTarget ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                href: `#${jumpTarget.anchor}`,
                "data-testid": `pipeline-node-${spec.id}-link`,
                className: `${pillClass} ${PILL_INTERACTIVE_CLASS}`,
                title: statusSentence,
                // When the node is an anchor, the aria-label overrides the
                // rendered text for screen readers — append the jump intent so
                // both halves are announced (axis state from #0055 plus the
                // panel-jump from #0054, now per-node from #0073).
                "aria-label": `${statusSentence} — jump to ${jumpTarget.humanName} panel`,
                children: pillContent
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 411,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: pillClass,
                title: statusSentence,
                "aria-label": statusSentence,
                children: pillContent
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 425,
                columnNumber: 9
            }, this),
            trailingEdge && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "aria-hidden": true,
                "data-testid": `pipeline-edge-${trailingEdge.spec.id}`,
                "data-tone": trailingEdge.tone,
                className: `mx-1.5 text-base leading-none sm:mx-2 ${TONE_EDGE_CLASS[trailingEdge.tone]}`,
                children: "→"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 430,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
        lineNumber: 405,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/proof/PipelineStatusBanner.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PipelineStatusBanner",
    ()=>PipelineStatusBanner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofAxes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/proofAxes.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofNowProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofNowProvider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPipelineAxesProvider.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
/**
 * Outer container className shared by every verdict branch (loading,
 * amber, red, green). Hoisted so a layout-shift regression in one
 * branch is impossible — the box height is pinned by `min-h` on every
 * branch.
 *
 * `min-h-[4.75rem]` matches the typical resolved height (chip row +
 * reason chips line + last-alive caption + `py-3`) so the page does
 * NOT reflow when the rollup transitions from skeleton to coloured
 * content.  See task lane6-pipeline-status-rollup-blank-during-panel-
 * first-paint (0059).
 */ const BANNER_OUTER_BASE_CLASS = 'rounded-2xl px-4 py-3 min-h-[4.75rem]';
const BANNER_TONE_CLASS = {
    loading: 'border border-white/10 bg-dark-100/60',
    green: 'border border-green-500/30 bg-green-500/5',
    amber: 'border border-yellow-500/40 bg-yellow-500/5',
    red: 'border border-red-500/40 bg-red-500/10'
};
function bannerOuterClass(verdict) {
    return `${BANNER_OUTER_BASE_CLASS} ${BANNER_TONE_CLASS[verdict]}`;
}
function PipelineStatusBanner() {
    const { axes, partialVerdict, resolvedAxisCount, lastFullyAliveAt } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useProofPipelineAxesContext"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PipelineStatusView, {
        axes: axes,
        verdict: partialVerdict,
        resolvedAxisCount: resolvedAxisCount,
        lastFullyAliveAt: lastFullyAliveAt
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
        lineNumber: 59,
        columnNumber: 5
    }, this);
}
function PipelineStatusView({ axes, verdict, resolvedAxisCount, lastFullyAliveAt }) {
    if (verdict === 'loading') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            "aria-label": "Pipeline status",
            "data-testid": "pipeline-status-banner",
            "data-status": "loading",
            className: bannerOuterClass(verdict),
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                role: "status",
                "aria-label": "Loading pipeline status",
                className: "h-5 w-56 animate-pulse rounded bg-white/10"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                lineNumber: 89,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
            lineNumber: 83,
            columnNumber: 7
        }, this);
    }
    if (verdict === 'green') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            "aria-label": "Pipeline status",
            "data-testid": "pipeline-status-banner",
            "data-status": "green",
            className: bannerOuterClass(verdict),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-wrap items-center gap-3 text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-green-300",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse",
                                    "aria-hidden": true
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                                    lineNumber: 108,
                                    columnNumber: 13
                                }, this),
                                "Alive"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                            lineNumber: 107,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs text-gray-300",
                            children: "Live quotes fresh · on-chain oracle returning data · hedge-proof artifact present"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                            lineNumber: 111,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                    lineNumber: 106,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LastAliveLine, {
                    verdict: verdict,
                    lastFullyAliveAt: lastFullyAliveAt
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                    lineNumber: 115,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
            lineNumber: 100,
            columnNumber: 7
        }, this);
    }
    const degradedEntries = Object.keys(axes).filter((axis)=>axes[axis] === 'degraded').map((axis)=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofAxes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PANEL_BY_AXIS"][axis]);
    if (verdict === 'red') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            "aria-label": "Pipeline status",
            "data-testid": "pipeline-status-banner",
            "data-status": "red",
            className: bannerOuterClass(verdict),
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                role: "alert",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-center gap-3 text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-red-300",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "inline-block h-1.5 w-1.5 rounded-full bg-red-400",
                                        "aria-hidden": true
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                                        lineNumber: 135,
                                        columnNumber: 15
                                    }, this),
                                    "Cold"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                                lineNumber: 134,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-red-200",
                                children: "All upstreams unreachable; this release is not verifiable."
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                                lineNumber: 138,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                        lineNumber: 133,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ReasonChips, {
                        entries: degradedEntries,
                        tone: "red"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                        lineNumber: 142,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RollupProgress, {
                        resolvedAxisCount: resolvedAxisCount
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                        lineNumber: 143,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LastAliveLine, {
                        verdict: verdict,
                        lastFullyAliveAt: lastFullyAliveAt
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                        lineNumber: 144,
                        columnNumber: 11
                    }, this)
                ]
            }, "red", true, {
                fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                lineNumber: 132,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
            lineNumber: 126,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "aria-label": "Pipeline status",
        "data-testid": "pipeline-status-banner",
        "data-status": "amber",
        className: bannerOuterClass(verdict),
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            role: "alert",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-wrap items-center gap-3 text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "inline-flex items-center gap-1.5 rounded-full bg-yellow-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-200",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "inline-block h-1.5 w-1.5 rounded-full bg-yellow-400",
                                    "aria-hidden": true
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                                    lineNumber: 160,
                                    columnNumber: 13
                                }, this),
                                "Degraded"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                            lineNumber: 159,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs text-yellow-100/80",
                            children: "Pipeline partially alive — investigate the listed axes before shipping."
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                            lineNumber: 163,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                    lineNumber: 158,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ReasonChips, {
                    entries: degradedEntries,
                    tone: "amber"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                    lineNumber: 167,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RollupProgress, {
                    resolvedAxisCount: resolvedAxisCount
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                    lineNumber: 168,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LastAliveLine, {
                    verdict: verdict,
                    lastFullyAliveAt: lastFullyAliveAt
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                    lineNumber: 169,
                    columnNumber: 9
                }, this)
            ]
        }, "amber", true, {
            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
            lineNumber: 157,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
        lineNumber: 151,
        columnNumber: 5
    }, this);
}
/**
 * "Computing N of M axes…" caption rendered when at least one axis
 * has reported but not all of them have. Disappears entirely once
 * every axis has resolved — at which point the rollup either matches
 * the strict {@link deriveVerdict} value or has already settled on a
 * degraded/cold verdict that the caption can't refine.
 */ function RollupProgress({ resolvedAxisCount }) {
    if (resolvedAxisCount <= 0 || resolvedAxisCount >= __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofAxes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TOTAL_AXIS_COUNT"]) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        "data-testid": "rollup-progress",
        className: "mt-1 text-[11px] text-gray-400",
        children: [
            "Computing ",
            resolvedAxisCount,
            " of ",
            __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofAxes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TOTAL_AXIS_COUNT"],
            " axes — banner refines as remaining axes report."
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
        lineNumber: 185,
        columnNumber: 5
    }, this);
}
const LAST_ALIVE_TONE_CLASS = {
    amber: 'mt-1 text-[11px] text-yellow-100/70',
    red: 'mt-1 text-[11px] text-red-200/70'
};
/**
 * Leaf component for the "Last fully alive" caption. Pulls the page-
 * scoped 1s tick from `useProofNow()` so the "Xs ago" value updates in
 * lockstep with the panel-header countdowns and only this leaf re-
 * renders per second — siblings (chip row, ReasonChips, RollupProgress)
 * stay stable across ticks. See task lane6-pipeline-status-banner-runs-
 * its-own-setinterval-1s-duplicate-of-proofnowprovider (#0068).
 */ function LastAliveLine({ verdict, lastFullyAliveAt }) {
    const now = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofNowProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useProofNow"])();
    switch(verdict){
        case 'loading':
            return null;
        case 'green':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                "data-testid": "last-fully-alive",
                className: "mt-1 text-[11px] text-green-200/80",
                children: "Last fully alive: just now"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                lineNumber: 218,
                columnNumber: 9
            }, this);
        case 'amber':
        case 'red':
            {
                if (lastFullyAliveAt === null) {
                    const stateWord = verdict === 'red' ? 'cold' : 'degraded';
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        "data-testid": "last-fully-alive",
                        className: LAST_ALIVE_TONE_CLASS[verdict],
                        children: [
                            "No all-green observation yet this session — the page has been in a ",
                            stateWord,
                            " state since it loaded."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                        lineNumber: 227,
                        columnNumber: 11
                    }, this);
                }
                const ago = Math.max(0, Math.round((now - lastFullyAliveAt) / 1000));
                const wallclock = new Date(lastFullyAliveAt).toISOString().slice(11, 19);
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    "data-testid": "last-fully-alive",
                    className: LAST_ALIVE_TONE_CLASS[verdict],
                    children: [
                        "Last fully alive: ",
                        wallclock,
                        " UTC · ",
                        ago,
                        "s ago"
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                    lineNumber: 235,
                    columnNumber: 9
                }, this);
            }
    }
}
const CHIP_BASE_CLASS = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-100';
const CHIP_TONE_CLASS = {
    amber: 'bg-yellow-500/10 text-yellow-200 hover:bg-yellow-500/20 focus:ring-yellow-400/50',
    red: 'bg-red-500/15 text-red-200 hover:bg-red-500/25 focus:ring-red-400/50'
};
function ReasonChips({ entries, tone }) {
    if (entries.length === 0) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
        className: "mt-2 flex flex-wrap gap-1.5",
        children: entries.map((e)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: `#${e.anchor}`,
                    "data-testid": `reason-chip-${e.anchor}`,
                    className: `${CHIP_BASE_CLASS} ${CHIP_TONE_CLASS[tone]}`,
                    "aria-label": `Jump to ${e.reason}, opens the corresponding panel`,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: e.reason
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                            lineNumber: 263,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            "aria-hidden": true,
                            children: "↓"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                            lineNumber: 264,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                    lineNumber: 257,
                    columnNumber: 11
                }, this)
            }, e.anchor, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                lineNumber: 256,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
        lineNumber: 254,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/proof/ProofPageActions.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProofPageActions",
    ()=>ProofPageActions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelActionsProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPanelActionsProvider.tsx [app-ssr] (ecmascript)");
'use client';
;
;
const ACTION_BUTTON_CLASS = 'inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-gray-200 transition-colors hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-progress';
function ProofPageActions() {
    const { refreshAll, anyRetrying } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelActionsProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useProofPanelActionsContext"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-testid": "proof-page-actions",
        className: "flex flex-wrap items-center gap-2",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            type: "button",
            onClick: ()=>void refreshAll(),
            disabled: anyRetrying,
            "data-testid": "refresh-all-panels",
            "aria-label": anyRetrying ? 'Refresh all panels — retry in flight' : 'Refresh all panels — re-runs every panel fetch in parallel',
            className: ACTION_BUTTON_CLASS,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RefreshIcon, {
                    spinning: anyRetrying
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/ProofPageActions.tsx",
                    lineNumber: 40,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: anyRetrying ? 'Refreshing…' : 'Refresh all panels'
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/ProofPageActions.tsx",
                    lineNumber: 41,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/proof/ProofPageActions.tsx",
            lineNumber: 28,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/ProofPageActions.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
function RefreshIcon({ spinning }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        "aria-hidden": true,
        viewBox: "0 0 16 16",
        width: 12,
        height: 12,
        className: spinning ? 'animate-spin' : '',
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M3 8a5 5 0 0 1 8.5-3.5L13 6"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/ProofPageActions.tsx",
                lineNumber: 61,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M13 3v3h-3"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/ProofPageActions.tsx",
                lineNumber: 62,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M13 8a5 5 0 0 1-8.5 3.5L3 10"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/ProofPageActions.tsx",
                lineNumber: 63,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M3 13v-3h3"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/ProofPageActions.tsx",
                lineNumber: 64,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/ProofPageActions.tsx",
        lineNumber: 49,
        columnNumber: 5
    }, this);
}
}),
"[project]/frontend/src/components/proof/ProofPanelBoundary.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProofPanelBoundary",
    ()=>ProofPanelBoundary
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
class ProofPanelBoundary extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Component"] {
    state = {
        hasError: false,
        retryKey: 0
    };
    static getDerivedStateFromError() {
        return {
            hasError: true
        };
    }
    componentDidCatch(error, info) {
        console.error('[proof-panel-boundary]', this.props.label, error, info);
    }
    handleRetry = ()=>{
        this.setState((prev)=>({
                hasError: false,
                retryKey: prev.retryKey + 1
            }));
    };
    render() {
        if (this.state.hasError) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-semibold",
                        children: "panel crashed"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/ProofPanelBoundary.tsx",
                        lineNumber: 37,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-1 text-yellow-300/80",
                        children: [
                            "The ",
                            this.props.label,
                            " panel hit an unexpected runtime error. The rest of this proof page is still valid; details are in the browser console."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/ProofPanelBoundary.tsx",
                        lineNumber: 38,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: this.handleRetry,
                        className: "mt-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-100 transition-colors hover:bg-yellow-500/20",
                        children: "Retry"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/ProofPanelBoundary.tsx",
                        lineNumber: 43,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/ProofPanelBoundary.tsx",
                lineNumber: 36,
                columnNumber: 9
            }, this);
        }
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: this.props.children
        }, this.state.retryKey, false, {
            fileName: "[project]/frontend/src/components/proof/ProofPanelBoundary.tsx",
            lineNumber: 53,
            columnNumber: 12
        }, this);
    }
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
const POLL_INTERVAL_MS = 15_000;
/**
 * Whether the current `/api/safety-state` payload is the "safe" branch:
 * server reports real-trading off, the build-time mirror agrees, and
 * the configured `ETORO_MODE` is in the allow-list. Promoted out of the
 * render body so the polling effect and the renderer share one
 * definition (#0071).
 */ function computeSafe(data) {
    return data.realTradingEnabled === false && __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$safety$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["REAL_TRADING_ENABLED"] === false && (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$safety$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isEtoroModeAllowed"])(data.etoroMode);
}
function SafetyBanner({ endpoint = '/api/safety-state', intervalMs = POLL_INTERVAL_MS }) {
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        status: 'loading'
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let cancelled = false;
        let timer = null;
        let lastSafe = false;
        const cancelInterval = ()=>{
            if (timer !== null) {
                clearInterval(timer);
                timer = null;
            }
        };
        const armRecoveryInterval = ()=>{
            if (timer !== null) return;
            timer = setInterval(()=>void load(), intervalMs);
        };
        const load = async ()=>{
            try {
                const res = await fetch(endpoint, {
                    cache: 'no-store'
                });
                if (!res.ok) throw new Error(`safety-state returned ${res.status}`);
                const data = await res.json();
                if (cancelled) return;
                setState({
                    status: 'ok',
                    data
                });
                if (computeSafe(data)) {
                    lastSafe = true;
                    cancelInterval();
                } else {
                    lastSafe = false;
                    armRecoveryInterval();
                }
            } catch (err) {
                console.error('[safety-banner] fetch failed', err);
                if (cancelled) return;
                setState({
                    status: 'error'
                });
                lastSafe = false;
                armRecoveryInterval();
            }
        };
        const onVisibility = ()=>{
            if (document.visibilityState !== 'visible') return;
            if (!lastSafe) return;
            void load();
        };
        void load();
        document.addEventListener('visibilitychange', onVisibility);
        return ()=>{
            cancelled = true;
            cancelInterval();
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [
        endpoint,
        intervalMs
    ]);
    if (state.status === 'loading') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            role: "status",
            "aria-label": "Loading safety state",
            className: "w-full rounded-2xl border border-white/10 bg-dark-50/40 px-4 py-3",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-5 w-48 animate-pulse rounded bg-white/10"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                lineNumber: 127,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
            lineNumber: 122,
            columnNumber: 7
        }, this);
    }
    if (state.status === 'error') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            role: "alert",
            className: "w-full rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-sm font-semibold text-red-200",
                    children: "Safety state unverified."
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 138,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-1 text-xs text-red-300/80",
                    children: "The /api/safety-state endpoint did not respond. Treat the release as unverified until the safety check completes."
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 141,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
            lineNumber: 134,
            columnNumber: 7
        }, this);
    }
    const safe = computeSafe(state.data);
    if (!safe) {
        const apiOk = state.data.realTradingEnabled === false;
        const frontendOk = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$safety$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["REAL_TRADING_ENABLED"] === false;
        const modeOk = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$safety$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isEtoroModeAllowed"])(state.data.etoroMode);
        const realTradingTripped = !apiOk || !frontendOk;
        const headline = realTradingTripped ? 'REFUSAL: real trading flag tripped. This release is NOT safe to ship.' : 'REFUSAL: ETORO_MODE is outside the allowed demo set. This release is NOT safe to ship.';
        const allowedList = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$safety$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ALLOWED_ETORO_MODES"].join(', ');
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            role: "alert",
            className: "w-full rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2 text-sm font-semibold text-red-200",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "inline-block h-2 w-2 rounded-full bg-red-400",
                            "aria-hidden": true
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                            lineNumber: 166,
                            columnNumber: 11
                        }, this),
                        headline
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 165,
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
                    lineNumber: 169,
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
                    lineNumber: 175,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
            lineNumber: 161,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        role: "status",
        className: "w-full rounded-2xl border border-green-500/30 bg-green-500/5 px-4 py-3",
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
                            lineNumber: 190,
                            columnNumber: 11
                        }, this),
                        "Safe"
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 189,
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
                            lineNumber: 194,
                            columnNumber: 11
                        }, this),
                        " on both sides"
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 193,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-gray-500",
                    children: "·"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 196,
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
                            lineNumber: 198,
                            columnNumber: 24
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 197,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
            lineNumber: 188,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
        lineNumber: 184,
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
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PipelineFlowDiagram$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PipelineStatusBanner$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/PipelineStatusBanner.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPageActions$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPageActions.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofNowProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofNowProvider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelActionsProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPanelActionsProvider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelBoundary$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPanelBoundary.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPipelineAxesProvider.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$SafetyBanner$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/SafetyBanner.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
;
;
;
;
;
/**
 * Single source of truth for the inter-section vertical rhythm on the
 * proof page. The header above the section stack uses `mb-6` (24 px)
 * and the footer below uses `mt-8` (32 px); the data-panel grid uses
 * `gap-5` (20 px) for inner cell separation. Everything between the
 * SafetyBanner and the data grid sits on this 16 px cadence.
 */ const SECTION_GAP_CLASS = 'mt-4';
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
                        children: "Release gate · GoodChain live-prices pipeline"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 33,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        id: "proof-page-heading",
                        className: "text-2xl font-semibold text-white sm:text-3xl",
                        children: "Live Prices Proof"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 36,
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
                                lineNumber: 42,
                                columnNumber: 18
                            }, this),
                            " events are observed, and the demo-hedge proof artifact reflects the latest hedge run."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 39,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        "aria-label": "How to read this page",
                        "data-testid": "reviewer-context",
                        className: "mt-4 flex max-w-3xl items-start gap-3 rounded-2xl border border-accent/20 bg-dark-100/60 p-5 text-sm text-gray-300",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "aria-hidden": true,
                                className: "mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-[11px] font-bold text-accent",
                                children: "i"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                lineNumber: 50,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "font-semibold text-white",
                                        children: "How to read this page"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                        lineNumber: 57,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 text-sm text-gray-300",
                                        children: "The page reads top-to-bottom as a single pipeline check. Each section below tells you something different:"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                        lineNumber: 58,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                                        className: "mt-3 space-y-1.5 text-sm text-gray-300",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-semibold text-white",
                                                        children: "1. Safety banner"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                                        lineNumber: 64,
                                                        columnNumber: 17
                                                    }, this),
                                                    ' — ',
                                                    "confirms real trading is fenced off (",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                        className: "text-accent",
                                                        children: "REAL_TRADING_ENABLED = false"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                                        lineNumber: 66,
                                                        columnNumber: 17
                                                    }, this),
                                                    ",",
                                                    ' ',
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                        className: "text-accent",
                                                        children: "ETORO_MODE = sandbox"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                                        lineNumber: 67,
                                                        columnNumber: 17
                                                    }, this),
                                                    ")."
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                                lineNumber: 63,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-semibold text-white",
                                                        children: "2. Verdict banner"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                                        lineNumber: 70,
                                                        columnNumber: 17
                                                    }, this),
                                                    ' — ',
                                                    "one-line rollup of the whole pipeline (",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-green-300",
                                                        children: "Alive"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                                        lineNumber: 72,
                                                        columnNumber: 17
                                                    }, this),
                                                    ",",
                                                    ' ',
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-yellow-200",
                                                        children: "Degraded"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                                        lineNumber: 73,
                                                        columnNumber: 17
                                                    }, this),
                                                    ", or",
                                                    ' ',
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-red-300",
                                                        children: "Cold"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                                        lineNumber: 74,
                                                        columnNumber: 17
                                                    }, this),
                                                    "). Any failing axis becomes a clickable chip that jumps to the corresponding panel below."
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                                lineNumber: 69,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-semibold text-white",
                                                        children: "3. Pipeline flow"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                                        lineNumber: 78,
                                                        columnNumber: 17
                                                    }, this),
                                                    ' — ',
                                                    "the six services that data passes through. Each pill is coloured by health (green = healthy, yellow = degraded, gray = loading first read), and clicking a pill jumps to the matching panel."
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                                lineNumber: 77,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "font-semibold text-white",
                                                        children: "4. Data panels"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                                        lineNumber: 84,
                                                        columnNumber: 17
                                                    }, this),
                                                    ' — ',
                                                    "per-service deep-dive: live quotes, on-chain oracle, recent oracle updates, last demo hedge. A panel rendering numbers means that service is alive and producing data; a yellow “degraded” or “awaiting” notice is the service's own intentional fallback — the page never silently swallows an error or an empty feed."
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                                lineNumber: 83,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                        lineNumber: 62,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                lineNumber: 56,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 45,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelBoundary$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProofPanelBoundary"], {
                label: "Safety Banner",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$SafetyBanner$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SafetyBanner"], {}, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                    lineNumber: 98,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                lineNumber: 97,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProofPipelineAxesProvider"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofNowProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProofNowProvider"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelActionsProvider$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProofPanelActionsProvider"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: SECTION_GAP_CLASS,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPageActions$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProofPageActions"], {}, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                    lineNumber: 105,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                lineNumber: 104,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: SECTION_GAP_CLASS,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelBoundary$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProofPanelBoundary"], {
                                    label: "Pipeline Status",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PipelineStatusBanner$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PipelineStatusBanner"], {}, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                        lineNumber: 110,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                    lineNumber: 109,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                lineNumber: 108,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: SECTION_GAP_CLASS,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelBoundary$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProofPanelBoundary"], {
                                    label: "Pipeline Flow",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PipelineFlowDiagram$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PipelineFlowDiagram"], {}, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                        lineNumber: 116,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                    lineNumber: 115,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                lineNumber: 114,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `${SECTION_GAP_CLASS} grid grid-cols-1 gap-5 lg:grid-cols-2`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelBoundary$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProofPanelBoundary"], {
                                        label: "Live Quotes",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$LiveQuotesPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LiveQuotesPanel"], {}, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                            lineNumber: 122,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                        lineNumber: 121,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelBoundary$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProofPanelBoundary"], {
                                        label: "On-chain Oracle",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$OnChainOraclePanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["OnChainOraclePanel"], {}, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                            lineNumber: 125,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                        lineNumber: 124,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelBoundary$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProofPanelBoundary"], {
                                        label: "Oracle Updates",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$OracleUpdatesPanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["OracleUpdatesPanel"], {}, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                            lineNumber: 128,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                        lineNumber: 127,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelBoundary$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ProofPanelBoundary"], {
                                        label: "Last Demo Hedge",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$LastDemoHedgePanel$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LastDemoHedgePanel"], {}, void 0, false, {
                                            fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                            lineNumber: 131,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                        lineNumber: 130,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                lineNumber: 120,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 103,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                    lineNumber: 102,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                lineNumber: 101,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                "data-testid": "proof-page-footer",
                className: "mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: [
                        "Canonical artifact for initiative",
                        ' ',
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                            className: "text-gray-500",
                            children: "0007f-qa-proof-release"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                            lineNumber: 144,
                            columnNumber: 11
                        }, this),
                        " (Lane 6)."
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                    lineNumber: 142,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                lineNumber: 138,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
        lineNumber: 27,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=frontend_src_0uc20pz._.js.map