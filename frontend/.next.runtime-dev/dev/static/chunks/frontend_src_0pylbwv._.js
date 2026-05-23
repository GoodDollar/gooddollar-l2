(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/lib/hedgeProof.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/parseRunId.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/sanitiseClientError.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/proof/PanelHeaderMeta.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MonoLinkAtom",
    ()=>MonoLinkAtom,
    "MonoSourceAtom",
    ()=>MonoSourceAtom,
    "PanelHeaderMeta",
    ()=>PanelHeaderMeta
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function PanelHeaderMeta({ source, cadence }) {
    if (!source && !cadence) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-testid": "panel-header-meta",
        className: "flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500",
        children: [
            source,
            source && cadence ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_c = PanelHeaderMeta;
function MonoSourceAtom({ value, title, ...rest }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
_c1 = MonoSourceAtom;
function MonoLinkAtom({ value, href, title, ...rest }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
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
_c2 = MonoLinkAtom;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "PanelHeaderMeta");
__turbopack_context__.k.register(_c1, "MonoSourceAtom");
__turbopack_context__.k.register(_c2, "MonoLinkAtom");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/proof/panelHeaderMetaUtils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LastDemoHedgePanel",
    ()=>LastDemoHedgePanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$hedgeProof$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/hedgeProof.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$parseRunId$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/parseRunId.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/sanitiseClientError.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/PanelHeaderMeta.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$panelHeaderMetaUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/panelHeaderMetaUtils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
'use client';
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `${STATUS_PILL_BASE} ${STATUS_PILL_TONE[tone]}`,
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 33,
        columnNumber: 10
    }, this);
}
_c = StatusPill;
function SymbolLabel({ symbol, notionalUsd }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "inline-flex items-baseline gap-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                tone: "symbol",
                children: symbol
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this),
            notionalUsd !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "font-mono text-xs text-gray-100",
                children: formatUsd(notionalUsd)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 41,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
_c1 = SymbolLabel;
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
function formatRelative(ts) {
    const ageMs = Math.max(0, Date.now() - ts);
    if (ageMs < 1_000) return 'just now';
    if (ageMs < 60_000) return `${Math.floor(ageMs / 1_000)}s ago`;
    if (ageMs < 3_600_000) return `${Math.floor(ageMs / 60_000)}m ago`;
    return `${Math.floor(ageMs / 3_600_000)}h ago`;
}
const RELATIVE_TICK_MS = 30_000;
function RelativeTimestamp({ ms }) {
    _s();
    const [, setTick] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const finite = Number.isFinite(ms) && ms !== 0;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RelativeTimestamp.useEffect": ()=>{
            if (!finite) return;
            const id = setInterval({
                "RelativeTimestamp.useEffect.id": ()=>setTick({
                        "RelativeTimestamp.useEffect.id": (n)=>n + 1
                    }["RelativeTimestamp.useEffect.id"])
            }["RelativeTimestamp.useEffect.id"], RELATIVE_TICK_MS);
            return ({
                "RelativeTimestamp.useEffect": ()=>clearInterval(id)
            })["RelativeTimestamp.useEffect"];
        }
    }["RelativeTimestamp.useEffect"], [
        finite
    ]);
    if (!finite) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            "data-testid": "hedge-timestamp",
            children: "—"
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
            lineNumber: 142,
            columnNumber: 12
        }, this);
    }
    const date = new Date(ms);
    const iso = date.toISOString();
    const local = date.toLocaleString(undefined, {
        timeZoneName: 'short'
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "hedge-timestamp",
        title: `${iso}\n${local}`,
        className: "font-mono break-all",
        children: [
            formatRelative(ms),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "aria-hidden": true,
                className: "ml-1 text-gray-500",
                children: [
                    "· ",
                    iso.slice(11, 19),
                    " UTC"
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 154,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 148,
        columnNumber: 5
    }, this);
}
_s(RelativeTimestamp, "/BsGHtAT6SHgLOdnp4Vgh6P3EWk=");
_c2 = RelativeTimestamp;
function LastDemoHedgePanel({ endpoint = '/api/hedge-proof/latest', intervalMs = 15_000 }) {
    _s1();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        status: 'loading'
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LastDemoHedgePanel.useEffect": ()=>{
            let cancelled = false;
            let timer;
            const load = {
                "LastDemoHedgePanel.useEffect.load": async ()=>{
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
                        const raw = await res.json();
                        if (!isProofEnvelope(raw)) throw new Error(SHAPE_MISMATCH);
                        if (!cancelled) setState({
                            status: 'ok',
                            data: raw
                        });
                    } catch (err) {
                        if (!cancelled) {
                            const ctx = err instanceof Error && err.message === SHAPE_MISMATCH ? 'hedge-proof-shape' : 'hedge-proof';
                            setState({
                                status: 'error',
                                message: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitiseClientError"])(ctx, err)
                            });
                        }
                    }
                }
            }["LastDemoHedgePanel.useEffect.load"];
            void load();
            timer = setInterval({
                "LastDemoHedgePanel.useEffect": ()=>void load()
            }["LastDemoHedgePanel.useEffect"], intervalMs);
            return ({
                "LastDemoHedgePanel.useEffect": ()=>{
                    cancelled = true;
                    if (timer) clearInterval(timer);
                }
            })["LastDemoHedgePanel.useEffect"];
        }
    }["LastDemoHedgePanel.useEffect"], [
        endpoint,
        intervalMs
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "panel-last-hedge",
        "aria-labelledby": "last-hedge-heading",
        className: "flex h-full flex-col rounded-2xl border border-white/10 bg-dark-100/60 p-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-3 flex items-center justify-between gap-y-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        id: "last-hedge-heading",
                        className: "text-sm font-semibold uppercase tracking-wider text-gray-400",
                        children: "Last Demo Hedge"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 212,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PanelHeaderMeta"], {
                        source: state.status === 'ok' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MonoSourceAtom"], {
                            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$panelHeaderMetaUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shortenSourcePath"])(state.data.source),
                            title: state.data.source
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                            lineNumber: 218,
                            columnNumber: 15
                        }, this) : undefined,
                        cadence: state.status === 'ok' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: state.data.proof.dryRun ? 'dry-run' : 'demo trade'
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                            lineNumber: 226,
                            columnNumber: 15
                        }, this) : undefined
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 215,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 211,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1",
                children: [
                    state.status === 'loading' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-32 animate-pulse rounded bg-white/5",
                        role: "status",
                        "aria-label": "Loading hedge proof"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 234,
                        columnNumber: 9
                    }, this),
                    state.status === 'missing' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-white/5 bg-white/[0.02] p-4 text-sm text-gray-400",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-medium text-gray-300",
                                children: "No proof yet."
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 239,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 text-xs text-gray-500",
                                children: [
                                    "Run ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                        className: "text-accent",
                                        children: "npm run hedge:demo -- --dry-run"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                        lineNumber: 241,
                                        columnNumber: 17
                                    }, this),
                                    " in",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                        className: "text-accent",
                                        children: " backend/hedge-engine"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                        lineNumber: 242,
                                        columnNumber: 13
                                    }, this),
                                    " to generate one."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 240,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 238,
                        columnNumber: 9
                    }, this),
                    state.status === 'error' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-semibold",
                                children: "Hedge proof unavailable"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 249,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 text-yellow-300/80",
                                children: state.message
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 250,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 248,
                        columnNumber: 9
                    }, this),
                    state.status === 'ok' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofCard, {
                        proof: state.data.proof
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 254,
                        columnNumber: 33
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 232,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 206,
        columnNumber: 5
    }, this);
}
_s1(LastDemoHedgePanel, "89uoRRnsEk3s2dQRu70t7khov70=");
_c3 = LastDemoHedgePanel;
function ProofCard({ proof }) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$hedgeProof$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isNoOpProof"])(proof)) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NoOpCard, {
            proof: proof
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
            lineNumber: 262,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(HedgeCard, {
        proof: proof
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 264,
        columnNumber: 10
    }, this);
}
_c4 = ProofCard;
function HedgeCard({ proof }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3 text-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                        tone: proof.side === 'buy' ? 'buy' : 'sell',
                        children: proof.side
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 271,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SymbolLabel, {
                        symbol: proof.symbol,
                        notionalUsd: proof.notionalUsd
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 272,
                        columnNumber: 9
                    }, this),
                    proof.dryRun && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                        tone: "accent",
                        children: "DRY-RUN"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 273,
                        columnNumber: 26
                    }, this),
                    !proof.realTradingEnabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                        tone: "safe",
                        children: "real trading: false"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 275,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 270,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofMeta, {
                proof: proof
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 279,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border border-white/5 bg-white/[0.02] p-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-1 text-xs uppercase tracking-wider text-gray-500",
                        children: "netDelta (before → after)"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 282,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-baseline gap-3 font-mono",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-200",
                                children: formatUsd(proof.beforeExposure.netDelta)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 284,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-500",
                                children: "→"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 285,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-200",
                                children: formatUsd(proof.afterExposure.netDelta)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                                lineNumber: 286,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 283,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-1 text-xs text-gray-500",
                        children: [
                            "block #",
                            proof.beforeExposure.blockNumber,
                            " → #",
                            proof.afterExposure.blockNumber
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 288,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 281,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 269,
        columnNumber: 5
    }, this);
}
_c5 = HedgeCard;
function NoOpCard({ proof }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3 text-sm",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-wrap items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                        tone: "neutral",
                        children: "Below-threshold tick"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 300,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SymbolLabel, {
                        symbol: proof.symbol
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 301,
                        columnNumber: 9
                    }, this),
                    proof.dryRun && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                        tone: "accent",
                        children: "DRY-RUN"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 302,
                        columnNumber: 26
                    }, this),
                    !proof.realTradingEnabled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusPill, {
                        tone: "safe",
                        children: "real trading: false"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 304,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 299,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-gray-400",
                children: "No hedge needed — exposure stayed inside the configured threshold; the engine still recorded a proof so the pipeline is observable."
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 308,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofMeta, {
                proof: proof
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 313,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-gray-400",
                children: [
                    "netDelta unchanged at",
                    ' ',
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-mono text-gray-200",
                        children: formatUsd(proof.beforeExposure.netDelta)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                        lineNumber: 317,
                        columnNumber: 9
                    }, this),
                    ' ',
                    "· block #",
                    proof.beforeExposure.blockNumber
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 315,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 298,
        columnNumber: 5
    }, this);
}
_c6 = NoOpCard;
function ProofMeta({ proof }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
        className: "grid grid-cols-1 gap-2 text-xs sm:grid-cols-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                label: "orderId",
                value: proof.etoroOrderId ?? proof.orderId,
                mono: true
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 327,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldNode, {
                label: "runId",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RunIdValue, {
                    raw: proof.runId
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                    lineNumber: 329,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 328,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FieldNode, {
                label: "timestamp",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RelativeTimestamp, {
                    ms: proof.timestamp
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                    lineNumber: 332,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 331,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                label: "etoroMode",
                value: proof.etoroMode
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 334,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 326,
        columnNumber: 5
    }, this);
}
_c7 = ProofMeta;
function RunIdValue({ raw }) {
    const parsed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$parseRunId$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseRunId"])(raw);
    if (parsed === null) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            "data-testid": "hedge-runid",
            title: raw,
            className: "font-mono break-all text-gray-200",
            children: raw
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
            lineNumber: 343,
            columnNumber: 7
        }, this);
    }
    const wallclock = `${parsed.iso.slice(0, 10)} ${parsed.iso.slice(11, 19)} UTC`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "hedge-runid",
        title: raw,
        className: "inline-flex flex-wrap items-baseline gap-1",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "font-mono text-gray-200",
                children: wallclock
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 355,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "aria-hidden": true,
                className: "text-gray-500",
                children: "·"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 356,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "font-mono text-xs text-gray-400",
                children: parsed.tag
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 357,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CopyRunIdButton, {
                raw: raw
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 358,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 350,
        columnNumber: 5
    }, this);
}
_c8 = RunIdValue;
function CopyRunIdButton({ raw }) {
    _s2();
    const [copied, setCopied] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        onClick: onClick,
        "data-testid": "hedge-runid-copy",
        "aria-label": copied ? 'runId copied to clipboard' : 'Copy raw runId to clipboard',
        className: "ml-1 inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-gray-300 hover:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-accent",
        children: copied ? 'copied' : 'copy'
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 379,
        columnNumber: 5
    }, this);
}
_s2(CopyRunIdButton, "NE86rL3vg4NVcTTWDavsT0hUBJs=");
_c9 = CopyRunIdButton;
function Field({ label, value, mono = false }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                className: "text-[10px] uppercase tracking-wider text-gray-500",
                children: label
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 394,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                className: `mt-0.5 text-gray-200 ${mono ? 'font-mono break-all' : ''}`,
                children: value
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 395,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
        lineNumber: 393,
        columnNumber: 5
    }, this);
}
_c10 = Field;
function FieldNode({ label, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                className: "text-[10px] uppercase tracking-wider text-gray-500",
                children: label
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx",
                lineNumber: 403,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                className: "mt-0.5 text-gray-200",
                children: children
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
_c11 = FieldNode;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
__turbopack_context__.k.register(_c, "StatusPill");
__turbopack_context__.k.register(_c1, "SymbolLabel");
__turbopack_context__.k.register(_c2, "RelativeTimestamp");
__turbopack_context__.k.register(_c3, "LastDemoHedgePanel");
__turbopack_context__.k.register(_c4, "ProofCard");
__turbopack_context__.k.register(_c5, "HedgeCard");
__turbopack_context__.k.register(_c6, "NoOpCard");
__turbopack_context__.k.register(_c7, "ProofMeta");
__turbopack_context__.k.register(_c8, "RunIdValue");
__turbopack_context__.k.register(_c9, "CopyRunIdButton");
__turbopack_context__.k.register(_c10, "Field");
__turbopack_context__.k.register(_c11, "FieldNode");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/proofFormat.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/proof/sessionPill.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/proof/LiveQuotesPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LiveQuotesPanel",
    ()=>LiveQuotesPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/sanitiseClientError.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$proofFormat$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/proofFormat.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$sessionPill$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/sessionPill.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/PanelHeaderMeta.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
const DEFAULT_PRICE_SERVICE_URL = 'http://localhost:9300';
const DEFAULT_STALENESS_THRESHOLD_MS = 30_000;
const POLL_INTERVAL_MS = 5_000;
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
const SHAPE_MISMATCH = 'SHAPE_MISMATCH';
function LiveQuotesPanel({ priceServiceUrl = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? DEFAULT_PRICE_SERVICE_URL, stalenessThresholdMs = DEFAULT_STALENESS_THRESHOLD_MS, intervalMs = POLL_INTERVAL_MS }) {
    _s();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        status: 'loading'
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LiveQuotesPanel.useEffect": ()=>{
            let cancelled = false;
            let timer;
            const fetchQuotes = {
                "LiveQuotesPanel.useEffect.fetchQuotes": async ()=>{
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
                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitiseClientError"])(ctx, err);
                            setState({
                                status: 'error',
                                ctx
                            });
                        }
                    }
                }
            }["LiveQuotesPanel.useEffect.fetchQuotes"];
            void fetchQuotes();
            timer = setInterval({
                "LiveQuotesPanel.useEffect": ()=>void fetchQuotes()
            }["LiveQuotesPanel.useEffect"], intervalMs);
            return ({
                "LiveQuotesPanel.useEffect": ()=>{
                    cancelled = true;
                    if (timer) clearInterval(timer);
                }
            })["LiveQuotesPanel.useEffect"];
        }
    }["LiveQuotesPanel.useEffect"], [
        priceServiceUrl,
        intervalMs
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "panel-live-quotes",
        "aria-labelledby": "live-quotes-heading",
        className: "flex h-full flex-col rounded-2xl border border-white/10 bg-dark-100/60 p-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-3 flex flex-wrap items-center justify-between gap-y-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        id: "live-quotes-heading",
                        className: "text-sm font-semibold uppercase tracking-wider text-gray-400",
                        children: "Live Quotes (price-service)"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 173,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-center gap-x-3 gap-y-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PanelHeaderMeta"], {
                                source: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MonoSourceAtom"], {
                                    value: displayHost(priceServiceUrl),
                                    "data-testid": "price-service-url"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                    lineNumber: 179,
                                    columnNumber: 15
                                }, this),
                                cadence: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: [
                                        "refreshes every ",
                                        intervalMs / 1000,
                                        "s"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                    lineNumber: 184,
                                    columnNumber: 22
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                lineNumber: 177,
                                columnNumber: 11
                            }, this),
                            state.status === 'ok' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FreshnessChip, {
                                summary: computeFreshnessSummary(Object.values(state.data.quotes), stalenessThresholdMs)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                lineNumber: 186,
                                columnNumber: 37
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 176,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 172,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1",
                children: [
                    state.status === 'loading' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-2",
                        role: "status",
                        "aria-label": "Loading live quotes",
                        children: [
                            0,
                            1,
                            2,
                            3
                        ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-7 animate-pulse rounded bg-white/5"
                            }, i, false, {
                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                lineNumber: 196,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 194,
                        columnNumber: 9
                    }, this),
                    state.status === 'error' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DegradedBox, {
                        ctx: state.ctx,
                        host: displayHost(priceServiceUrl)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 202,
                        columnNumber: 9
                    }, this),
                    state.status === 'ok' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "overflow-x-auto",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full text-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: "border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-500",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "py-2 pr-3 font-medium",
                                                children: "Symbol"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                lineNumber: 210,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "py-2 pr-3 font-medium text-right",
                                                children: "Mid"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                lineNumber: 211,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "py-2 pr-3 font-medium text-right",
                                                children: "Bid / Ask"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                lineNumber: 212,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "py-2 pr-3 font-medium text-right",
                                                children: "Spread"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                lineNumber: 213,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
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
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    children: Object.values(state.data.quotes).length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
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
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: "border-b border-white/5 last:border-0",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-2 pr-3 font-medium text-white",
                                                    children: q.symbol
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                    lineNumber: 229,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-2 pr-3 text-right font-mono text-gray-100",
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$proofFormat$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatProofUsd"])(q.symbol, q.mid)
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                    lineNumber: 230,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-2 pr-3 text-right font-mono text-gray-400",
                                                    children: [
                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$proofFormat$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatProofUsd"])(q.symbol, q.bid),
                                                        " / ",
                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$proofFormat$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatProofUsd"])(q.symbol, q.ask)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                    lineNumber: 231,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
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
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "py-2 pr-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            "data-testid": `session-pill-${q.symbol}`,
                                                            className: `rounded-md px-2 py-0.5 text-xs ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$sessionPill$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sessionPillClass"])(q.sessionState)}`,
                                                            children: q.sessionState
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                                                            lineNumber: 238,
                                                            columnNumber: 25
                                                        }, this),
                                                        stale && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            "data-testid": `quote-stale-${q.symbol}`,
                                                            className: "ml-2 inline-flex items-center gap-1 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-200",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                lineNumber: 192,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
        lineNumber: 167,
        columnNumber: 5
    }, this);
}
_s(LiveQuotesPanel, "89uoRRnsEk3s2dQRu70t7khov70=");
_c = LiveQuotesPanel;
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
 */ function DegradedBox({ ctx, host }) {
    const HostPill = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "font-mono",
        "data-testid": "price-service-url-inline",
        children: host
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
        lineNumber: 280,
        columnNumber: 5
    }, this);
    switch(ctx){
        case 'price-service-shape':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-semibold",
                        children: "price-service returned an unexpected payload"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 288,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-1 text-yellow-300/80",
                        children: [
                            "The feed at ",
                            HostPill,
                            " is up but the response shape did not match the schema this panel expects. Re-run the price-service or check its build version."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 289,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 287,
                columnNumber: 9
            }, this);
        case 'price-service':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-semibold",
                        children: "price-service unreachable"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 297,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-1 text-yellow-300/80",
                        children: [
                            "Live quotes feed at ",
                            HostPill,
                            " is unreachable. The price-service may be offline or restarting."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                        lineNumber: 298,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 296,
                columnNumber: 9
            }, this);
    }
}
_c1 = DegradedBox;
function FreshnessChip({ summary }) {
    if (summary.kind === 'empty') return null;
    const fresh = summary.kind === 'all-current';
    const dotClass = fresh ? 'bg-green-400' : 'bg-yellow-400';
    const toneClass = fresh ? 'inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-300' : 'inline-flex items-center gap-1.5 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-200';
    const summaryText = summary.kind === 'all-current' ? 'all current' : `${summary.totalStale} stale of ${summary.total}`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "quotes-freshness",
        className: toneClass,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `h-1.5 w-1.5 rounded-full ${dotClass}`,
                "aria-hidden": true
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 319,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: [
                    formatAge(summary.minAgeMs),
                    " · ",
                    summaryText
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
                lineNumber: 320,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/LiveQuotesPanel.tsx",
        lineNumber: 318,
        columnNumber: 5
    }, this);
}
_c2 = FreshnessChip;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "LiveQuotesPanel");
__turbopack_context__.k.register(_c1, "DegradedBox");
__turbopack_context__.k.register(_c2, "FreshnessChip");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/stockData.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/proof/OnChainOraclePanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OnChainOraclePanel",
    ()=>OnChainOraclePanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContracts.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/sanitiseClientError.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$proofFormat$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/proofFormat.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$sessionPill$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/sessionPill.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/PanelHeaderMeta.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
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
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$proofFormat$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatProofUsd"])(symbol, v);
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
    _s();
    const oracleAddress = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].StocksPriceOracle;
    const explorer = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_BLOCK_EXPLORER ?? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ?? '';
    const tickers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "OnChainOraclePanel.useMemo[tickers]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAllTickers"])()
    }["OnChainOraclePanel.useMemo[tickers]"], []);
    const contracts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "OnChainOraclePanel.useMemo[contracts]": ()=>{
            if (!oracleAddress) return [];
            return tickers.map({
                "OnChainOraclePanel.useMemo[contracts]": (ticker)=>({
                        address: oracleAddress,
                        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceOracleABI"],
                        functionName: 'getPriceData',
                        args: [
                            ticker
                        ]
                    })
            }["OnChainOraclePanel.useMemo[contracts]"]);
        }
    }["OnChainOraclePanel.useMemo[contracts]"], [
        oracleAddress,
        tickers
    ]);
    const { data, isLoading, error } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"])({
        contracts,
        query: {
            enabled: contracts.length > 0,
            refetchInterval: 30_000,
            staleTime: 30_000
        }
    });
    const sanitisedErrorMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "OnChainOraclePanel.useMemo[sanitisedErrorMessage]": ()=>error ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitiseClientError"])('oracle-multicall', error) : null
    }["OnChainOraclePanel.useMemo[sanitisedErrorMessage]"], [
        error
    ]);
    const rows = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "OnChainOraclePanel.useMemo[rows]": ()=>{
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
        }
    }["OnChainOraclePanel.useMemo[rows]"], [
        data,
        tickers
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "panel-onchain-oracle",
        "aria-labelledby": "onchain-oracle-heading",
        className: "flex h-full flex-col rounded-2xl border border-white/10 bg-dark-100/60 p-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-3 flex items-center justify-between gap-y-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        id: "onchain-oracle-heading",
                        className: "text-sm font-semibold uppercase tracking-wider text-gray-400",
                        children: "On-chain Oracle (getPriceData)"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 173,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PanelHeaderMeta"], {
                        source: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OracleAddressAtom, {
                            oracleAddress: oracleAddress,
                            explorer: explorer
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                            lineNumber: 176,
                            columnNumber: 34
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 176,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                lineNumber: 172,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1",
                children: [
                    isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-2",
                        role: "status",
                        "aria-label": "Loading on-chain oracle data",
                        children: [
                            0,
                            1,
                            2,
                            3
                        ].map((i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-7 animate-pulse rounded bg-white/5"
                            }, i, false, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 183,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 181,
                        columnNumber: 9
                    }, this),
                    sanitisedErrorMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-semibold",
                                children: "Oracle multicall failed"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 190,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 text-yellow-300/80",
                                children: sanitisedErrorMessage
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 191,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 189,
                        columnNumber: 9
                    }, this),
                    !isLoading && !error && rows.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "data-testid": "onchain-oracle-awaiting",
                        className: "rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-semibold",
                                children: "Awaiting first on-chain write"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 200,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-yellow-300/80",
                                children: "The oracle contract exists at the address above but no symbol has a non-zero price yet. The oracle-signer keeper writes prices on a fixed cadence — this panel will populate as soon as the first round lands."
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 201,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ExpectedSymbolsList, {
                                tickers: tickers
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 206,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 196,
                        columnNumber: 9
                    }, this),
                    !isLoading && !error && rows.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "overflow-x-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "sr-only",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                                    children: COLUMNS.map((col)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                    children: col.label
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                    lineNumber: 216,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                    id: descIdFor(col.key),
                                                    children: col.shortDescription
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                    lineNumber: 217,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, col.key, true, {
                                            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                            lineNumber: 215,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                    lineNumber: 213,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 212,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                className: "w-full text-sm",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: "border-b border-white/10 text-left text-xs uppercase tracking-wider text-gray-500",
                                            children: COLUMNS.map((col)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OracleHeaderCell, {
                                                    col: col
                                                }, col.key, false, {
                                                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                    lineNumber: 226,
                                                    columnNumber: 19
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                            lineNumber: 224,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                        lineNumber: 223,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                        children: rows.map((row)=>{
                                            const sessionLabel = SESSION_LABELS[row.session] ?? `enum(${row.session})`;
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                className: "border-b border-white/5 last:border-0",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3 font-medium text-white",
                                                        children: row.symbol
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                        lineNumber: 235,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3 text-right font-mono text-gray-100",
                                                        children: formatUsd8(row.symbol, row.price8)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                        lineNumber: 236,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            "data-testid": `session-pill-${row.symbol}`,
                                                            className: `rounded-md px-2 py-0.5 text-xs ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$sessionPill$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sessionPillClass"])(sessionLabel)}`,
                                                            children: sessionLabel
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                            lineNumber: 238,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                        lineNumber: 237,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3 text-right font-mono text-gray-300",
                                                        children: [
                                                            row.confidence,
                                                            "%"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                        lineNumber: 245,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3 text-right font-mono text-gray-300",
                                                        children: row.signerCount
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                        lineNumber: 246,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "py-2 pr-3 text-right text-xs text-gray-400",
                                                        children: formatAgo(row.timestamp)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                        lineNumber: 247,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, row.symbol, true, {
                                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                                lineNumber: 234,
                                                columnNumber: 19
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                        lineNumber: 230,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                                lineNumber: 222,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 211,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                lineNumber: 179,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
        lineNumber: 167,
        columnNumber: 5
    }, this);
}
_s(OnChainOraclePanel, "ohTelnp/uUbjYzxpaFv/plHfnsc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContracts$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContracts"]
    ];
});
_c = OnChainOraclePanel;
/**
 * Pick the right header source atom for the on-chain oracle address.
 * Renders the explorer link when both pieces are configured, the plain
 * mono span when only the address is configured, or nothing when no
 * address is known so the panel-header rail collapses to empty.
 */ function OracleAddressAtom({ oracleAddress, explorer }) {
    if (!oracleAddress) return null;
    if (explorer) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MonoLinkAtom"], {
            value: oracleAddress,
            href: `${explorer.replace(/\/$/, '')}/address/${oracleAddress}`,
            "data-testid": "oracle-address-link",
            "aria-label": `Open ${oracleAddress} on block explorer`,
            title: oracleAddress
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
            lineNumber: 276,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MonoSourceAtom"], {
        value: oracleAddress,
        "data-testid": "oracle-address-text",
        title: oracleAddress
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
        lineNumber: 286,
        columnNumber: 5
    }, this);
}
_c1 = OracleAddressAtom;
/**
 * Awaiting-state expected-symbols list. Renders the configured ticker
 * set as a tidy grid of small mono pills, one chip per ticker, under a
 * labelled `EXPECTED SYMBOLS (N)` heading. Replaces the previous inline
 * comma-joined mono string so prose stays prose and the symbol set
 * reads as a list of equal atoms — see #0046.
 */ function ExpectedSymbolsList({ tickers }) {
    if (tickers.length === 0) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-2.5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-[10px] font-semibold uppercase tracking-wider text-yellow-300/70",
                children: [
                    "Expected symbols (",
                    tickers.length,
                    ")"
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                lineNumber: 305,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                "data-testid": "onchain-oracle-expected-symbols",
                className: "mt-1 flex flex-wrap gap-1.5",
                children: tickers.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: "rounded-md border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 font-mono text-[10px] text-yellow-100/90",
                        children: t
                    }, t, false, {
                        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                        lineNumber: 313,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                lineNumber: 308,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
        lineNumber: 304,
        columnNumber: 5
    }, this);
}
_c2 = ExpectedSymbolsList;
function OracleHeaderCell({ col }) {
    const alignClass = col.align === 'right' ? 'py-2 pr-3 font-medium text-right' : 'py-2 pr-3 font-medium';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
        scope: "col",
        className: alignClass,
        title: col.shortDescription,
        "aria-describedby": descIdFor(col.key),
        "data-testid": `onchain-oracle-header-${col.key}`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "inline-flex items-center gap-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: col.label
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                    lineNumber: 336,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    "aria-hidden": true,
                    className: "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/20 bg-white/5 text-[9px] font-bold text-gray-400",
                    children: "?"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
                    lineNumber: 337,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
            lineNumber: 335,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/OnChainOraclePanel.tsx",
        lineNumber: 328,
        columnNumber: 5
    }, this);
}
_c3 = OracleHeaderCell;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "OnChainOraclePanel");
__turbopack_context__.k.register(_c1, "OracleAddressAtom");
__turbopack_context__.k.register(_c2, "ExpectedSymbolsList");
__turbopack_context__.k.register(_c3, "OracleHeaderCell");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "OracleUpdatesPanel",
    ()=>OracleUpdatesPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWatchContractEvent$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useWatchContractEvent.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/sanitiseClientError.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/PanelHeaderMeta.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$panelHeaderMetaUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/panelHeaderMetaUtils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
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
    _s();
    const oracleAddress = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].StocksPriceOracle;
    const explorer = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_BLOCK_EXPLORER ?? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ?? '';
    const [events, setEvents] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [subscriptionError, setSubscriptionError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const onLogs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "OracleUpdatesPanel.useCallback[onLogs]": (logs)=>{
            setSubscriptionError(null);
            setEvents({
                "OracleUpdatesPanel.useCallback[onLogs]": (prev)=>{
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
                }
            }["OracleUpdatesPanel.useCallback[onLogs]"]);
        }
    }["OracleUpdatesPanel.useCallback[onLogs]"], []);
    const onError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "OracleUpdatesPanel.useCallback[onError]": (err)=>{
            setSubscriptionError((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitiseClientError"])('oracle-subscription', err));
        }
    }["OracleUpdatesPanel.useCallback[onError]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWatchContractEvent$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWatchContractEvent"])({
        address: oracleAddress,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceOracleABI"],
        eventName: 'PriceUpdated',
        onLogs,
        onError,
        enabled: Boolean(oracleAddress)
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "panel-oracle-updates",
        "aria-labelledby": "oracle-updates-heading",
        className: "flex h-full flex-col rounded-2xl border border-white/10 bg-dark-100/60 p-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-3 flex items-center justify-between gap-y-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        id: "oracle-updates-heading",
                        className: "text-sm font-semibold uppercase tracking-wider text-gray-400",
                        children: "Recent Oracle Updates"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                        lineNumber: 103,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PanelHeaderMeta"], {
                        source: oracleAddress ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PanelHeaderMeta$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MonoSourceAtom"], {
                            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$panelHeaderMetaUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["shortAddress"])(oracleAddress),
                            title: oracleAddress
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                            lineNumber: 109,
                            columnNumber: 15
                        }, this) : undefined,
                        cadence: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: [
                                "last ",
                                MAX_EVENTS,
                                " PriceUpdated events"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                            lineNumber: 112,
                            columnNumber: 20
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                lineNumber: 102,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1",
                children: [
                    subscriptionError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-semibold",
                                children: "Oracle event subscription degraded"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                lineNumber: 119,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 text-yellow-300/80",
                                children: subscriptionError
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                lineNumber: 120,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                        lineNumber: 118,
                        columnNumber: 9
                    }, this),
                    events.length === 0 ? subscriptionError ? null : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-lg border border-white/5 bg-white/[0.02] p-4 text-xs text-gray-500",
                        children: [
                            "Listening for ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                className: "text-gray-400",
                                children: "PriceUpdated"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                lineNumber: 127,
                                columnNumber: 27
                            }, this),
                            " events. None observed yet; this populates as the oracle-signer keeper writes to the chain.",
                            SESSION_LABEL[0] ? null : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                        lineNumber: 126,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                        className: "divide-y divide-white/5",
                        children: events.map((e)=>{
                            const link = explorer ? `${explorer.replace(/\/$/, '')}/tx/${e.txHash}` : undefined;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                className: "flex items-center justify-between py-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm font-medium text-white",
                                                children: e.symbol
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                                lineNumber: 139,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-mono text-xs text-gray-400",
                                                children: formatUsd8(e.price8)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                                lineNumber: 140,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                        lineNumber: 138,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-3 text-xs",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-gray-500",
                                                children: [
                                                    "block #",
                                                    String(e.blockNumber)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                                lineNumber: 143,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-gray-500",
                                                children: "·"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                                lineNumber: 144,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-gray-400",
                                                children: formatRelative(e.capturedAt)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                                lineNumber: 145,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-gray-500",
                                                children: "·"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                                lineNumber: 146,
                                                columnNumber: 19
                                            }, this),
                                            link ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
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
                                                lineNumber: 148,
                                                columnNumber: 21
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-mono text-gray-300",
                                                children: shortHash(e.txHash)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                                lineNumber: 157,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                        lineNumber: 142,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, `${e.txHash}-${e.symbol}`, true, {
                                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                                lineNumber: 137,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                        lineNumber: 133,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
                lineNumber: 116,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx",
        lineNumber: 97,
        columnNumber: 5
    }, this);
}
_s(OracleUpdatesPanel, "9RHcahEx44wB/EQCuUR4EvaHywk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWatchContractEvent$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWatchContractEvent"]
    ];
});
_c = OracleUpdatesPanel;
var _c;
__turbopack_context__.k.register(_c, "OracleUpdatesPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PipelineFlowDiagram",
    ()=>PipelineFlowDiagram
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContract.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/sanitiseClientError.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
const DEFAULT_PRICE_SERVICE_URL = 'http://localhost:9300';
const DEFAULT_STALENESS_THRESHOLD_MS = 30_000;
const DEFAULT_POLL_INTERVAL_MS = 15_000;
const REASON_BY_AXIS = {
    quotes: 'price-service unreachable',
    onChain: 'no on-chain prices',
    hedgeProof: 'hedge-proof missing'
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
function PipelineFlowDiagram({ priceServiceUrl = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? DEFAULT_PRICE_SERVICE_URL, hedgeProofEndpoint = '/api/hedge-proof/latest', intervalMs = DEFAULT_POLL_INTERVAL_MS, stalenessThresholdMs = DEFAULT_STALENESS_THRESHOLD_MS }) {
    _s();
    const oracleAddress = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].StocksPriceOracle;
    const probeTicker = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "PipelineFlowDiagram.useMemo[probeTicker]": ()=>{
            const tickers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAllTickers"])();
            return tickers.length > 0 ? tickers[0] : null;
        }
    }["PipelineFlowDiagram.useMemo[probeTicker]"], []);
    const onChainReadEnabled = Boolean(oracleAddress) && probeTicker !== null;
    const { data: onChainData, error: onChainError } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: oracleAddress || undefined,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceOracleABI"],
        functionName: 'getPriceData',
        args: probeTicker ? [
            probeTicker
        ] : undefined,
        query: {
            enabled: onChainReadEnabled,
            refetchInterval: intervalMs,
            staleTime: intervalMs
        }
    });
    const [offChain, setOffChain] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        quotes: 'unknown',
        hedgeProof: 'unknown'
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PipelineFlowDiagram.useEffect": ()=>{
            let cancelled = false;
            const checkQuotes = {
                "PipelineFlowDiagram.useEffect.checkQuotes": async ()=>{
                    try {
                        const res = await fetch(`${priceServiceUrl}/quotes`, {
                            cache: 'no-store'
                        });
                        if (!res.ok) return 'degraded';
                        const body = await res.json();
                        return isFreshQuotes(body, stalenessThresholdMs) ? 'healthy' : 'degraded';
                    } catch (err) {
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitiseClientError"])('price-service', err);
                        return 'degraded';
                    }
                }
            }["PipelineFlowDiagram.useEffect.checkQuotes"];
            const checkHedgeProof = {
                "PipelineFlowDiagram.useEffect.checkHedgeProof": async ()=>{
                    try {
                        const res = await fetch(hedgeProofEndpoint, {
                            cache: 'no-store'
                        });
                        return res.ok ? 'healthy' : 'degraded';
                    } catch (err) {
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitiseClientError"])('hedge-proof', err);
                        return 'degraded';
                    }
                }
            }["PipelineFlowDiagram.useEffect.checkHedgeProof"];
            const tick = {
                "PipelineFlowDiagram.useEffect.tick": async ()=>{
                    const [quotesResult, hedgeProofResult] = await Promise.allSettled([
                        checkQuotes(),
                        checkHedgeProof()
                    ]);
                    if (cancelled) return;
                    setOffChain({
                        quotes: quotesResult.status === 'fulfilled' ? quotesResult.value : 'degraded',
                        hedgeProof: hedgeProofResult.status === 'fulfilled' ? hedgeProofResult.value : 'degraded'
                    });
                }
            }["PipelineFlowDiagram.useEffect.tick"];
            void tick();
            const timer = setInterval({
                "PipelineFlowDiagram.useEffect.timer": ()=>void tick()
            }["PipelineFlowDiagram.useEffect.timer"], intervalMs);
            return ({
                "PipelineFlowDiagram.useEffect": ()=>{
                    cancelled = true;
                    clearInterval(timer);
                }
            })["PipelineFlowDiagram.useEffect"];
        }
    }["PipelineFlowDiagram.useEffect"], [
        priceServiceUrl,
        hedgeProofEndpoint,
        intervalMs,
        stalenessThresholdMs
    ]);
    const onChain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "PipelineFlowDiagram.useMemo[onChain]": ()=>{
            if (!onChainReadEnabled) return 'degraded';
            if (onChainError) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitiseClientError"])('oracle-multicall', onChainError);
                return 'degraded';
            }
            if (onChainData === undefined) return 'unknown';
            return isHealthyOnChain(onChainData) ? 'healthy' : 'degraded';
        }
    }["PipelineFlowDiagram.useMemo[onChain]"], [
        onChainReadEnabled,
        onChainError,
        onChainData
    ]);
    const axes = {
        quotes: offChain.quotes,
        onChain,
        hedgeProof: offChain.hedgeProof
    };
    const failedReasons = Object.keys(axes).filter((axis)=>axes[axis] === 'degraded').map((axis)=>REASON_BY_AXIS[axis]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "aria-label": "Pipeline flow",
        "data-testid": "pipeline-flow-diagram",
        className: "rounded-2xl border border-white/10 bg-dark-100/40 px-4 py-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                className: "flex flex-wrap items-center gap-y-2 text-xs",
                children: NODES.map((node, idx)=>{
                    const resolved = resolveAxisForSegment(node.axis, axes);
                    const edge = EDGES[idx];
                    const edgeResolved = edge ? resolveAxisForSegment(edge.axis, axes) : null;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FlowNode, {
                        spec: node,
                        tone: axisToTone(resolved.axis),
                        showHedgeProofIndicator: node.id === 'demo-hedge' && resolved.subordinated && resolved.ok,
                        trailingEdge: edge && edgeResolved ? {
                            spec: edge,
                            tone: axisToTone(edgeResolved.axis)
                        } : null
                    }, `node-${node.id}`, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                        lineNumber: 269,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 263,
                columnNumber: 7
            }, this),
            failedReasons.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                "data-testid": "pipeline-flow-degradation",
                className: "mt-2 text-xs text-yellow-200/80",
                children: failedReasons.join(' · ')
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 284,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
        lineNumber: 258,
        columnNumber: 5
    }, this);
}
_s(PipelineFlowDiagram, "9Co5wrIDq4RDSvm11Evd/7VAdv4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"]
    ];
});
_c = PipelineFlowDiagram;
function FlowNode({ spec, tone, trailingEdge, showHedgeProofIndicator }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
        "data-testid": `pipeline-node-${spec.id}`,
        "data-tone": tone,
        className: "inline-flex items-center",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: `inline-flex items-baseline gap-1.5 rounded-lg border px-3 py-1.5 ${TONE_NODE_CLASS[tone]}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-mono uppercase tracking-wider",
                        children: spec.label
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                        lineNumber: 315,
                        columnNumber: 9
                    }, this),
                    spec.subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[10px] uppercase tracking-wider text-gray-400",
                        children: spec.subtitle
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                        lineNumber: 317,
                        columnNumber: 11
                    }, this),
                    showHedgeProofIndicator && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": true,
                        "data-testid": `pipeline-node-${spec.id}-indicator`,
                        className: "ml-1 inline-block h-1.5 w-1.5 self-center rounded-full bg-green-400/80"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                        lineNumber: 320,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 312,
                columnNumber: 7
            }, this),
            trailingEdge && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "aria-hidden": true,
                "data-testid": `pipeline-edge-${trailingEdge.spec.id}`,
                "data-tone": trailingEdge.tone,
                className: `mx-1.5 text-base leading-none sm:mx-2 ${TONE_EDGE_CLASS[trailingEdge.tone]}`,
                children: "→"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
                lineNumber: 328,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx",
        lineNumber: 307,
        columnNumber: 5
    }, this);
}
_c1 = FlowNode;
var _c, _c1;
__turbopack_context__.k.register(_c, "PipelineFlowDiagram");
__turbopack_context__.k.register(_c1, "FlowNode");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/proof/proofAxes.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
    "deriveVerdict",
    ()=>deriveVerdict,
    "isFreshQuotes",
    ()=>isFreshQuotes,
    "isHealthyOnChain",
    ()=>isHealthyOnChain
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/proof/useProofPipelineAxes.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useProofPipelineAxes",
    ()=>useProofPipelineAxes
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContract.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/sanitiseClientError.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofAxes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/proofAxes.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
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
const DEFAULT_POLL_INTERVAL_MS = 15_000;
function useProofPipelineAxes({ priceServiceUrl = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_PRICE_SERVICE_URL ?? DEFAULT_PRICE_SERVICE_URL, hedgeProofEndpoint = '/api/hedge-proof/latest', intervalMs = DEFAULT_POLL_INTERVAL_MS, stalenessThresholdMs = DEFAULT_STALENESS_THRESHOLD_MS } = {}) {
    _s();
    const oracleAddress = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].StocksPriceOracle;
    const probeTicker = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useProofPipelineAxes.useMemo[probeTicker]": ()=>{
            const tickers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAllTickers"])();
            return tickers.length > 0 ? tickers[0] : null;
        }
    }["useProofPipelineAxes.useMemo[probeTicker]"], []);
    const onChainReadEnabled = Boolean(oracleAddress) && probeTicker !== null;
    const { data: onChainData, error: onChainError } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: oracleAddress || undefined,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceOracleABI"],
        functionName: 'getPriceData',
        args: probeTicker ? [
            probeTicker
        ] : undefined,
        query: {
            enabled: onChainReadEnabled,
            refetchInterval: intervalMs,
            staleTime: intervalMs
        }
    });
    const [offChain, setOffChain] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        quotes: 'unknown',
        hedgeProof: 'unknown'
    });
    /**
   * Bumped on every off-chain poll so `lastFullyAliveAt` can re-fire even
   * when the axes haven't changed (e.g. consecutive all-healthy polls all
   * advance the timestamp, not just the first healthy transition).
   */ const [pollSeq, setPollSeq] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [lastFullyAliveAt, setLastFullyAliveAt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useProofPipelineAxes.useEffect": ()=>{
            let cancelled = false;
            const checkQuotes = {
                "useProofPipelineAxes.useEffect.checkQuotes": async ()=>{
                    try {
                        const res = await fetch(`${priceServiceUrl}/quotes`, {
                            cache: 'no-store'
                        });
                        if (!res.ok) return 'degraded';
                        const body = await res.json();
                        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofAxes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isFreshQuotes"])(body, stalenessThresholdMs) ? 'healthy' : 'degraded';
                    } catch (err) {
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitiseClientError"])('price-service', err);
                        return 'degraded';
                    }
                }
            }["useProofPipelineAxes.useEffect.checkQuotes"];
            const checkHedgeProof = {
                "useProofPipelineAxes.useEffect.checkHedgeProof": async ()=>{
                    try {
                        const res = await fetch(hedgeProofEndpoint, {
                            cache: 'no-store'
                        });
                        return res.ok ? 'healthy' : 'degraded';
                    } catch (err) {
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitiseClientError"])('hedge-proof', err);
                        return 'degraded';
                    }
                }
            }["useProofPipelineAxes.useEffect.checkHedgeProof"];
            const tick = {
                "useProofPipelineAxes.useEffect.tick": async ()=>{
                    const [quotesResult, hedgeProofResult] = await Promise.allSettled([
                        checkQuotes(),
                        checkHedgeProof()
                    ]);
                    if (cancelled) return;
                    setOffChain({
                        quotes: quotesResult.status === 'fulfilled' ? quotesResult.value : 'degraded',
                        hedgeProof: hedgeProofResult.status === 'fulfilled' ? hedgeProofResult.value : 'degraded'
                    });
                    setPollSeq({
                        "useProofPipelineAxes.useEffect.tick": (s)=>s + 1
                    }["useProofPipelineAxes.useEffect.tick"]);
                }
            }["useProofPipelineAxes.useEffect.tick"];
            void tick();
            const timer = setInterval({
                "useProofPipelineAxes.useEffect.timer": ()=>void tick()
            }["useProofPipelineAxes.useEffect.timer"], intervalMs);
            return ({
                "useProofPipelineAxes.useEffect": ()=>{
                    cancelled = true;
                    clearInterval(timer);
                }
            })["useProofPipelineAxes.useEffect"];
        }
    }["useProofPipelineAxes.useEffect"], [
        priceServiceUrl,
        hedgeProofEndpoint,
        intervalMs,
        stalenessThresholdMs
    ]);
    const onChain = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useProofPipelineAxes.useMemo[onChain]": ()=>{
            if (!onChainReadEnabled) return 'degraded';
            if (onChainError) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$sanitiseClientError$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitiseClientError"])('oracle-multicall', onChainError);
                return 'degraded';
            }
            if (onChainData === undefined) return 'unknown';
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofAxes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isHealthyOnChain"])(onChainData) ? 'healthy' : 'degraded';
        }
    }["useProofPipelineAxes.useMemo[onChain]"], [
        onChainReadEnabled,
        onChainError,
        onChainData
    ]);
    const axes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useProofPipelineAxes.useMemo[axes]": ()=>({
                quotes: offChain.quotes,
                onChain,
                hedgeProof: offChain.hedgeProof
            })
    }["useProofPipelineAxes.useMemo[axes]"], [
        offChain.quotes,
        offChain.hedgeProof,
        onChain
    ]);
    const verdict = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useProofPipelineAxes.useMemo[verdict]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$proofAxes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deriveVerdict"])(axes)
    }["useProofPipelineAxes.useMemo[verdict]"], [
        axes
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useProofPipelineAxes.useEffect": ()=>{
            if (axes.quotes === 'healthy' && axes.onChain === 'healthy' && axes.hedgeProof === 'healthy') {
                setLastFullyAliveAt(Date.now());
            }
        }
    }["useProofPipelineAxes.useEffect"], [
        pollSeq,
        axes.quotes,
        axes.onChain,
        axes.hedgeProof
    ]);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useProofPipelineAxes.useMemo": ()=>({
                axes,
                verdict,
                lastFullyAliveAt
            })
    }["useProofPipelineAxes.useMemo"], [
        axes,
        verdict,
        lastFullyAliveAt
    ]);
}
_s(useProofPipelineAxes, "gzSL9rgCi+dGTEpZpS1beMx8/p8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/proof/ProofPipelineAxesProvider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProofPipelineAxesProvider",
    ()=>ProofPipelineAxesProvider,
    "TestProofPipelineAxesProvider",
    ()=>TestProofPipelineAxesProvider,
    "useProofPipelineAxesContext",
    ()=>useProofPipelineAxesContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$useProofPipelineAxes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/useProofPipelineAxes.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const ProofPipelineAxesContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function ProofPipelineAxesProvider({ children, ...opts }) {
    _s();
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$useProofPipelineAxes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProofPipelineAxes"])(opts);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofPipelineAxesContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/ProofPipelineAxesProvider.tsx",
        lineNumber: 28,
        columnNumber: 5
    }, this);
}
_s(ProofPipelineAxesProvider, "4a+2WffYFebskfgFIRfovC/iTLI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$useProofPipelineAxes$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProofPipelineAxes"]
    ];
});
_c = ProofPipelineAxesProvider;
function useProofPipelineAxesContext() {
    _s1();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ProofPipelineAxesContext);
    if (ctx === null) {
        throw new Error('useProofPipelineAxesContext must be used inside <ProofPipelineAxesProvider>');
    }
    return ctx;
}
_s1(useProofPipelineAxesContext, "/dMy7t63NXD4eYACoT93CePwGrg=");
function TestProofPipelineAxesProvider({ value, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofPipelineAxesContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/ProofPipelineAxesProvider.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
_c1 = TestProofPipelineAxesProvider;
var _c, _c1;
__turbopack_context__.k.register(_c, "ProofPipelineAxesProvider");
__turbopack_context__.k.register(_c1, "TestProofPipelineAxesProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/proof/PipelineStatusBanner.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PipelineStatusBanner",
    ()=>PipelineStatusBanner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPipelineAxesProvider.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
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
function PipelineStatusBanner() {
    _s();
    const { axes, verdict, lastFullyAliveAt } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProofPipelineAxesContext"])();
    /**
   * Drives the 1s "Xs ago" tick under the degraded/red verdict line.
   * Pure presentation — does not own the underlying timestamp.
   */ const [now, setNow] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "PipelineStatusBanner.useState": ()=>Date.now()
    }["PipelineStatusBanner.useState"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PipelineStatusBanner.useEffect": ()=>{
            if (lastFullyAliveAt === null) return;
            if (verdict === 'green' || verdict === 'loading') return;
            setNow(Date.now());
            const id = setInterval({
                "PipelineStatusBanner.useEffect.id": ()=>setNow(Date.now())
            }["PipelineStatusBanner.useEffect.id"], 1_000);
            return ({
                "PipelineStatusBanner.useEffect": ()=>clearInterval(id)
            })["PipelineStatusBanner.useEffect"];
        }
    }["PipelineStatusBanner.useEffect"], [
        lastFullyAliveAt,
        verdict
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PipelineStatusView, {
        axes: axes,
        verdict: verdict,
        lastFullyAliveAt: lastFullyAliveAt,
        now: now
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
        lineNumber: 43,
        columnNumber: 5
    }, this);
}
_s(PipelineStatusBanner, "L9J+Dw8plLh2/TZpHsYuX+WCwVQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPipelineAxesProvider$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useProofPipelineAxesContext"]
    ];
});
_c = PipelineStatusBanner;
function PipelineStatusView({ axes, verdict, lastFullyAliveAt, now }) {
    if (verdict === 'loading') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            "aria-label": "Pipeline status",
            "data-testid": "pipeline-status-banner",
            "data-status": "loading",
            className: "rounded-2xl border border-white/10 bg-dark-100/60 px-4 py-3",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                role: "status",
                "aria-label": "Loading pipeline status",
                className: "h-5 w-56 animate-pulse rounded bg-white/10"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                lineNumber: 68,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
            lineNumber: 62,
            columnNumber: 7
        }, this);
    }
    if (verdict === 'green') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            "aria-label": "Pipeline status",
            "data-testid": "pipeline-status-banner",
            "data-status": "green",
            className: "rounded-2xl border border-green-500/30 bg-green-500/5 px-4 py-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-wrap items-center gap-3 text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-green-300",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse",
                                    "aria-hidden": true
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                                    lineNumber: 87,
                                    columnNumber: 13
                                }, this),
                                "Alive"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                            lineNumber: 86,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs text-gray-300",
                            children: "Live quotes fresh · on-chain oracle returning data · hedge-proof artifact present"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                            lineNumber: 90,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                    lineNumber: 85,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LastAliveLine, {
                    verdict: verdict,
                    lastFullyAliveAt: lastFullyAliveAt,
                    now: now
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                    lineNumber: 94,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
            lineNumber: 79,
            columnNumber: 7
        }, this);
    }
    const degradedEntries = Object.keys(axes).filter((axis)=>axes[axis] === 'degraded').map((axis)=>PANEL_BY_AXIS[axis]);
    if (verdict === 'red') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            "aria-label": "Pipeline status",
            "data-testid": "pipeline-status-banner",
            "data-status": "red",
            className: "rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                role: "alert",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-center gap-3 text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-red-300",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "inline-block h-1.5 w-1.5 rounded-full bg-red-400",
                                        "aria-hidden": true
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                                        lineNumber: 114,
                                        columnNumber: 15
                                    }, this),
                                    "Cold"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                                lineNumber: 113,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-red-200",
                                children: "All upstreams unreachable; this release is not verifiable."
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                                lineNumber: 117,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                        lineNumber: 112,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ReasonChips, {
                        entries: degradedEntries,
                        tone: "red"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                        lineNumber: 121,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LastAliveLine, {
                        verdict: verdict,
                        lastFullyAliveAt: lastFullyAliveAt,
                        now: now
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                        lineNumber: 122,
                        columnNumber: 11
                    }, this)
                ]
            }, "red", true, {
                fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                lineNumber: 111,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
            lineNumber: 105,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "aria-label": "Pipeline status",
        "data-testid": "pipeline-status-banner",
        "data-status": "amber",
        className: "rounded-2xl border border-yellow-500/40 bg-yellow-500/5 px-4 py-3",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            role: "alert",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-wrap items-center gap-3 text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "inline-flex items-center gap-1.5 rounded-full bg-yellow-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-200",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "inline-block h-1.5 w-1.5 rounded-full bg-yellow-400",
                                    "aria-hidden": true
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                                    lineNumber: 138,
                                    columnNumber: 13
                                }, this),
                                "Degraded"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                            lineNumber: 137,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs text-yellow-100/80",
                            children: "Pipeline partially alive — investigate the listed axes before shipping."
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                            lineNumber: 141,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                    lineNumber: 136,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ReasonChips, {
                    entries: degradedEntries,
                    tone: "amber"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                    lineNumber: 145,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LastAliveLine, {
                    verdict: verdict,
                    lastFullyAliveAt: lastFullyAliveAt,
                    now: now
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                    lineNumber: 146,
                    columnNumber: 9
                }, this)
            ]
        }, "amber", true, {
            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
            lineNumber: 135,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
        lineNumber: 129,
        columnNumber: 5
    }, this);
}
_c1 = PipelineStatusView;
const LAST_ALIVE_TONE_CLASS = {
    amber: 'mt-1 text-[11px] text-yellow-100/70',
    red: 'mt-1 text-[11px] text-red-200/70'
};
function LastAliveLine({ verdict, lastFullyAliveAt, now }) {
    switch(verdict){
        case 'loading':
            return null;
        case 'green':
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                "data-testid": "last-fully-alive",
                className: "mt-1 text-[11px] text-green-200/80",
                children: "Last fully alive: just now"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                lineNumber: 171,
                columnNumber: 9
            }, this);
        case 'amber':
        case 'red':
            {
                if (lastFullyAliveAt === null) {
                    const stateWord = verdict === 'red' ? 'cold' : 'degraded';
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        "data-testid": "last-fully-alive",
                        className: LAST_ALIVE_TONE_CLASS[verdict],
                        children: [
                            "No all-green observation yet this session — the page has been in a ",
                            stateWord,
                            " state since it loaded."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                        lineNumber: 180,
                        columnNumber: 11
                    }, this);
                }
                const ago = Math.max(0, Math.round((now - lastFullyAliveAt) / 1000));
                const wallclock = new Date(lastFullyAliveAt).toISOString().slice(11, 19);
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
                    lineNumber: 188,
                    columnNumber: 9
                }, this);
            }
    }
}
_c2 = LastAliveLine;
const CHIP_BASE_CLASS = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-100';
const CHIP_TONE_CLASS = {
    amber: 'bg-yellow-500/10 text-yellow-200 hover:bg-yellow-500/20 focus:ring-yellow-400/50',
    red: 'bg-red-500/15 text-red-200 hover:bg-red-500/25 focus:ring-red-400/50'
};
function ReasonChips({ entries, tone }) {
    if (entries.length === 0) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
        className: "mt-2 flex flex-wrap gap-1.5",
        children: entries.map((e)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: `#${e.anchor}`,
                    "data-testid": `reason-chip-${e.anchor}`,
                    className: `${CHIP_BASE_CLASS} ${CHIP_TONE_CLASS[tone]}`,
                    "aria-label": `Jump to ${e.reason}, opens the corresponding panel`,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: e.reason
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                            lineNumber: 216,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            "aria-hidden": true,
                            children: "↓"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                            lineNumber: 217,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                    lineNumber: 210,
                    columnNumber: 11
                }, this)
            }, e.anchor, false, {
                fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
                lineNumber: 209,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/PipelineStatusBanner.tsx",
        lineNumber: 207,
        columnNumber: 5
    }, this);
}
_c3 = ReasonChips;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "PipelineStatusBanner");
__turbopack_context__.k.register(_c1, "PipelineStatusView");
__turbopack_context__.k.register(_c2, "LastAliveLine");
__turbopack_context__.k.register(_c3, "ReasonChips");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/proof/ProofPanelBoundary.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProofPanelBoundary",
    ()=>ProofPanelBoundary
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
'use client';
;
;
class ProofPanelBoundary extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Component"] {
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
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "font-semibold",
                        children: "panel crashed"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/proof/ProofPanelBoundary.tsx",
                        lineNumber: 37,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: this.props.children
        }, this.state.retryKey, false, {
            fileName: "[project]/frontend/src/components/proof/ProofPanelBoundary.tsx",
            lineNumber: 53,
            columnNumber: 12
        }, this);
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/safety.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/proof/SafetyBanner.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SafetyBanner",
    ()=>SafetyBanner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$safety$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/safety.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const POLL_INTERVAL_MS = 15_000;
function SafetyBanner({ endpoint = '/api/safety-state', intervalMs = POLL_INTERVAL_MS }) {
    _s();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        status: 'loading'
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SafetyBanner.useEffect": ()=>{
            let cancelled = false;
            const load = {
                "SafetyBanner.useEffect.load": async ()=>{
                    try {
                        const res = await fetch(endpoint, {
                            cache: 'no-store'
                        });
                        if (!res.ok) throw new Error(`safety-state returned ${res.status}`);
                        const data = await res.json();
                        if (!cancelled) setState({
                            status: 'ok',
                            data
                        });
                    } catch (err) {
                        console.error('[safety-banner] fetch failed', err);
                        if (!cancelled) setState({
                            status: 'error'
                        });
                    }
                }
            }["SafetyBanner.useEffect.load"];
            void load();
            const timer = setInterval({
                "SafetyBanner.useEffect.timer": ()=>void load()
            }["SafetyBanner.useEffect.timer"], intervalMs);
            return ({
                "SafetyBanner.useEffect": ()=>{
                    cancelled = true;
                    clearInterval(timer);
                }
            })["SafetyBanner.useEffect"];
        }
    }["SafetyBanner.useEffect"], [
        endpoint,
        intervalMs
    ]);
    if (state.status === 'loading') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            role: "status",
            "aria-label": "Loading safety state",
            className: "w-full rounded-2xl border border-white/10 bg-dark-50/40 px-4 py-3",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-5 w-48 animate-pulse rounded bg-white/10"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                lineNumber: 61,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
            lineNumber: 56,
            columnNumber: 7
        }, this);
    }
    if (state.status === 'error') {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            role: "alert",
            className: "w-full rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-sm font-semibold text-red-200",
                    children: "Safety state unverified."
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 72,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-1 text-xs text-red-300/80",
                    children: "The /api/safety-state endpoint did not respond. Treat the release as unverified until the safety check completes."
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 75,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
            lineNumber: 68,
            columnNumber: 7
        }, this);
    }
    const apiOk = state.data.realTradingEnabled === false;
    const frontendOk = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$safety$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["REAL_TRADING_ENABLED"] === false;
    const modeOk = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$safety$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isEtoroModeAllowed"])(state.data.etoroMode);
    const safe = apiOk && frontendOk && modeOk;
    if (!safe) {
        const realTradingTripped = !apiOk || !frontendOk;
        const headline = realTradingTripped ? 'REFUSAL: real trading flag tripped. This release is NOT safe to ship.' : 'REFUSAL: ETORO_MODE is outside the allowed demo set. This release is NOT safe to ship.';
        const allowedList = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$safety$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ALLOWED_ETORO_MODES"].join(', ');
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            role: "alert",
            className: "w-full rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2 text-sm font-semibold text-red-200",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "inline-block h-2 w-2 rounded-full bg-red-400",
                            "aria-hidden": true
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                            lineNumber: 100,
                            columnNumber: 11
                        }, this),
                        headline
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 99,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    lineNumber: 103,
                    columnNumber: 9
                }, this),
                !modeOk && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-1 text-xs text-red-300/80",
                    children: [
                        "failed: ETORO_MODE (allowed: ",
                        allowedList,
                        ")"
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 109,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
            lineNumber: 95,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        role: "status",
        className: "w-full rounded-2xl border border-green-500/30 bg-green-500/5 px-4 py-3",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-wrap items-center gap-3 text-sm",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-green-300",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "inline-block h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse",
                            "aria-hidden": true
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                            lineNumber: 124,
                            columnNumber: 11
                        }, this),
                        "Safe"
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 123,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-gray-300",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                            className: "text-green-300",
                            children: "REAL_TRADING_ENABLED = false"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                            lineNumber: 128,
                            columnNumber: 11
                        }, this),
                        " on both sides"
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 127,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-gray-500",
                    children: "·"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 130,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-gray-300",
                    children: [
                        "ETORO_MODE = ",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                            className: "text-accent",
                            children: state.data.etoroMode
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                            lineNumber: 132,
                            columnNumber: 24
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
                    lineNumber: 131,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
            lineNumber: 122,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/proof/SafetyBanner.tsx",
        lineNumber: 118,
        columnNumber: 5
    }, this);
}
_s(SafetyBanner, "89uoRRnsEk3s2dQRu70t7khov70=");
_c = SafetyBanner;
var _c;
__turbopack_context__.k.register(_c, "SafetyBanner");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/app/(app)/live-prices-proof/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LivePricesProofPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$LastDemoHedgePanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/LastDemoHedgePanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$LiveQuotesPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/LiveQuotesPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$OnChainOraclePanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/OnChainOraclePanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$OracleUpdatesPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/OracleUpdatesPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PipelineFlowDiagram$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/PipelineFlowDiagram.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PipelineStatusBanner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/PipelineStatusBanner.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelBoundary$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/ProofPanelBoundary.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$SafetyBanner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/proof/SafetyBanner.tsx [app-client] (ecmascript)");
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
/**
 * Single source of truth for the inter-section vertical rhythm on the
 * proof page. The header above the section stack uses `mb-6` (24 px)
 * and the footer below uses `mt-8` (32 px); the data-panel grid uses
 * `gap-5` (20 px) for inner cell separation. Everything between the
 * SafetyBanner and the data grid sits on this 16 px cadence.
 */ const SECTION_GAP_CLASS = 'mt-4';
function LivePricesProofPage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "aria-labelledby": "proof-page-heading",
        className: "mx-auto max-w-7xl px-4 py-8",
        "data-testid": "live-prices-proof-page",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent",
                        children: "Release gate · GoodChain live-prices pipeline"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        id: "proof-page-heading",
                        className: "text-2xl font-semibold text-white sm:text-3xl",
                        children: "Live Prices Proof"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 32,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-2 max-w-2xl text-sm text-gray-400",
                        children: [
                            "One-glance evidence that the full live-prices pipeline is alive: eToro quotes flow through the price-service, on-chain oracle reads return real numbers, recent ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                className: "text-accent",
                                children: "PriceUpdated"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                lineNumber: 38,
                                columnNumber: 18
                            }, this),
                            " events are observed, and the demo-hedge proof artifact reflects the latest hedge run."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                        "aria-label": "How to read this page",
                        "data-testid": "reviewer-context",
                        className: "mt-4 flex max-w-3xl items-start gap-3 rounded-2xl border border-accent/20 bg-dark-100/60 p-5 text-sm text-gray-300",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "aria-hidden": true,
                                className: "mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-[11px] font-bold text-accent",
                                children: "i"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                lineNumber: 46,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-semibold text-white",
                                        children: "How to read this page:"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                        lineNumber: 53,
                                        columnNumber: 13
                                    }, this),
                                    ' ',
                                    "Each panel below is the live output of one service in the live-prices pipeline. A panel rendering numbers means that service is alive and producing data. A panel rendering a yellow “degraded” or “awaiting” notice is the service's own intentional fallback — the page never silently swallows an error or an empty feed."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                                lineNumber: 52,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 41,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelBoundary$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProofPanelBoundary"], {
                label: "Safety Banner",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$SafetyBanner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SafetyBanner"], {}, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                    lineNumber: 65,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                lineNumber: 64,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: SECTION_GAP_CLASS,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelBoundary$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProofPanelBoundary"], {
                    label: "Pipeline Status",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PipelineStatusBanner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PipelineStatusBanner"], {}, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 70,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                    lineNumber: 69,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                lineNumber: 68,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: SECTION_GAP_CLASS,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelBoundary$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProofPanelBoundary"], {
                    label: "Pipeline Flow",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$PipelineFlowDiagram$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PipelineFlowDiagram"], {}, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 76,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                    lineNumber: 75,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                lineNumber: 74,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `${SECTION_GAP_CLASS} grid grid-cols-1 gap-5 lg:grid-cols-2`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelBoundary$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProofPanelBoundary"], {
                        label: "Live Quotes",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$LiveQuotesPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LiveQuotesPanel"], {}, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                            lineNumber: 82,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 81,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelBoundary$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProofPanelBoundary"], {
                        label: "On-chain Oracle",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$OnChainOraclePanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OnChainOraclePanel"], {}, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                            lineNumber: 85,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 84,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelBoundary$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProofPanelBoundary"], {
                        label: "Oracle Updates",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$OracleUpdatesPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OracleUpdatesPanel"], {}, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                            lineNumber: 88,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 87,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$ProofPanelBoundary$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProofPanelBoundary"], {
                        label: "Last Demo Hedge",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$proof$2f$LastDemoHedgePanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LastDemoHedgePanel"], {}, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                            lineNumber: 91,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                        lineNumber: 90,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                lineNumber: 80,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                "data-testid": "proof-page-footer",
                className: "mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-600",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    children: [
                        "Canonical artifact for initiative",
                        ' ',
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                            className: "text-gray-500",
                            children: "0007f-qa-proof-release"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                            lineNumber: 101,
                            columnNumber: 11
                        }, this),
                        " (Lane 6)."
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                    lineNumber: 99,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
                lineNumber: 95,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/live-prices-proof/page.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
_c = LivePricesProofPage;
var _c;
__turbopack_context__.k.register(_c, "LivePricesProofPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_src_0pylbwv._.js.map