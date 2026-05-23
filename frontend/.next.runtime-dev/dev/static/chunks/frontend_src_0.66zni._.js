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
"[project]/frontend/src/lib/hedge-error.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Backend error strings for `/api/hedge/status` already name the subject
 * ("Hedge engine unreachable"). Concatenating them with a hardcoded
 * "Hedge engine unavailable:" label produced the tautological banner
 * "Hedge engine unavailable: Hedge engine unreachable".
 *
 * `normalizeHedgeError` strips the redundant subject prefix so the UI
 * banner can render a single coherent sentence. Falls back to
 * "unreachable" when the resulting tail is empty so the headline
 * template always reads cleanly.
 */ __turbopack_context__.s([
    "buildHedgeErrorHeadline",
    ()=>buildHedgeErrorHeadline,
    "classifyClientError",
    ()=>classifyClientError,
    "normalizeHedgeError",
    ()=>normalizeHedgeError
]);
function normalizeHedgeError(raw) {
    if (!raw) return 'unreachable';
    const stripped = raw.replace(/^\s*hedge\s+engine\s*[:\-]?\s*/i, '').trim();
    return stripped.length === 0 ? 'unreachable' : stripped;
}
// Tails that already begin with a finite verb form (or a label-shaped
// continuation like "upstream") do NOT need an inserted "is " —
// otherwise the banner reads "Hedge engine is returned an error." or
// "Hedge engine is upstream error (HTTP 500)." Anything else keeps the
// legacy "is …" prefix so noun-shaped tails like "unreachable" /
// "HTTP 500" continue to render the same sentence they always have.
const FINITE_VERB_TAIL = /^(is|has|had|returned|returning|timed|timing|failed|crashed|stopped|went|upstream)\s+/i;
function buildHedgeErrorHeadline(raw) {
    const tail = normalizeHedgeError(raw);
    if (FINITE_VERB_TAIL.test(tail)) return `Hedge engine ${tail}.`;
    return `Hedge engine is ${tail}.`;
}
function classifyClientError(err) {
    const raw = err instanceof Error ? err.message : '';
    if (/network|failed to fetch|load failed/i.test(raw)) {
        return 'is unreachable — no network connection';
    }
    if (/json|unexpected token|parse/i.test(raw)) {
        return 'returned an unreadable response';
    }
    if (/timeout|timed out/i.test(raw)) {
        return 'timed out';
    }
    return 'is unreachable';
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/usePollWhileVisible.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "usePollWhileVisible",
    ()=>usePollWhileVisible
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
function usePollWhileVisible(callback, intervalMs, options = {}) {
    _s();
    const { enabled = true } = options;
    const cbRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(callback);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "usePollWhileVisible.useEffect": ()=>{
            cbRef.current = callback;
        }
    }["usePollWhileVisible.useEffect"], [
        callback
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "usePollWhileVisible.useEffect": ()=>{
            if (!enabled) return;
            if (typeof document === 'undefined') return;
            let timer = null;
            let mounted = true;
            const run = {
                "usePollWhileVisible.useEffect.run": ()=>{
                    if (!mounted) return;
                    void cbRef.current();
                }
            }["usePollWhileVisible.useEffect.run"];
            const startInterval = {
                "usePollWhileVisible.useEffect.startInterval": ()=>{
                    if (timer !== null) return;
                    timer = setInterval(run, intervalMs);
                }
            }["usePollWhileVisible.useEffect.startInterval"];
            const stopInterval = {
                "usePollWhileVisible.useEffect.stopInterval": ()=>{
                    if (timer === null) return;
                    clearInterval(timer);
                    timer = null;
                }
            }["usePollWhileVisible.useEffect.stopInterval"];
            const onVisibility = {
                "usePollWhileVisible.useEffect.onVisibility": ()=>{
                    if (!mounted) return;
                    if (document.visibilityState === 'visible') {
                        run();
                        stopInterval();
                        startInterval();
                    } else {
                        stopInterval();
                    }
                }
            }["usePollWhileVisible.useEffect.onVisibility"];
            if (document.visibilityState === 'visible') {
                run();
                startInterval();
            }
            document.addEventListener('visibilitychange', onVisibility);
            return ({
                "usePollWhileVisible.useEffect": ()=>{
                    mounted = false;
                    stopInterval();
                    document.removeEventListener('visibilitychange', onVisibility);
                }
            })["usePollWhileVisible.useEffect"];
        }
    }["usePollWhileVisible.useEffect"], [
        enabled,
        intervalMs
    ]);
}
_s(usePollWhileVisible, "FFKoWCp2dKZt8pye+jO1BslqfVU=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/HedgeStatusCard/icons.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Inline SVG icons for HedgeStatusCard. Kept in a dedicated module so
// the main component file can stay focused on state + layout. All icons
// accept an optional `size` prop (default 16 px) so callers like the
// empty-receipts state can render a larger 28 px version without
// duplicating the SVG markup.
__turbopack_context__.s([
    "AlertTriangleIcon",
    ()=>AlertTriangleIcon,
    "ArrowPathIcon",
    ()=>ArrowPathIcon,
    "CloudOffIcon",
    ()=>CloudOffIcon,
    "InboxIcon",
    ()=>InboxIcon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function ArrowPathIcon({ spinning = false, size = 14 }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        "aria-hidden": "true",
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.75",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: spinning ? 'animate-spin' : undefined,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M3 12a9 9 0 0 1 15.5-6.3L21 8"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M21 4v4h-4"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 29,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M21 12a9 9 0 0 1-15.5 6.3L3 16"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 30,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M3 20v-4h4"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
        lineNumber: 16,
        columnNumber: 5
    }, this);
}
_c = ArrowPathIcon;
function CloudOffIcon({ size = 16 } = {}) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        "aria-hidden": "true",
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M2 2l20 20"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 49,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M5.78 5.78A6 6 0 003 11a4 4 0 004 4h9.5"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 50,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M21 17.5a4 4 0 00-1.83-3.36"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 51,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M9 4.07A6 6 0 0119 8.5"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 52,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
_c1 = CloudOffIcon;
function AlertTriangleIcon({ size = 16 } = {}) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        "aria-hidden": "true",
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 3l10 18H2L12 3z"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 70,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 10v5"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 71,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "12",
                cy: "18",
                r: "0.5",
                fill: "currentColor"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 72,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
        lineNumber: 59,
        columnNumber: 5
    }, this);
}
_c2 = AlertTriangleIcon;
function InboxIcon({ size = 16 } = {}) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        "aria-hidden": "true",
        viewBox: "0 0 24 24",
        width: size,
        height: size,
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M3 13l3-7h12l3 7"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 90,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M3 13v6h18v-6h-6a3 3 0 01-6 0H3z"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 91,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
        lineNumber: 79,
        columnNumber: 5
    }, this);
}
_c3 = InboxIcon;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "ArrowPathIcon");
__turbopack_context__.k.register(_c1, "CloudOffIcon");
__turbopack_context__.k.register(_c2, "AlertTriangleIcon");
__turbopack_context__.k.register(_c3, "InboxIcon");
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
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$hedge$2d$error$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/hedge-error.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePollWhileVisible$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePollWhileVisible.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeStatusCard$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/HedgeStatusCard/icons.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature();
'use client';
;
;
;
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
// "Healthy converged" → the most recent poll *was* the most recent tick;
// collapse the two timestamps into a single compact freshness line. When
// they diverge (engine error path keeps polling but stops ticking) render
// both so the operator can see at a glance which value is actually stale.
const HEALTHY_CONVERGED_TOLERANCE_MS = 1_500;
function renderFreshnessText(input) {
    const tickStr = input.lastTickAt === null ? 'never' : timeAgo(input.lastTickAt);
    const polledStr = input.lastPolledAt === null ? '—' : timeAgo(input.lastPolledAt);
    const autoRefresh = `auto-refresh ${Math.round(input.pollIntervalMs / 1000)}s`;
    const healthyConverged = input.lastTickAt !== null && input.lastPolledAt !== null && Math.abs(input.lastPolledAt - input.lastTickAt) < HEALTHY_CONVERGED_TOLERANCE_MS;
    if (healthyConverged) return `Last tick ${tickStr} · ${autoRefresh}`;
    return `Last tick ${tickStr} · last polled ${polledStr}`;
}
// Owns its own 1 s ticker so the parent card does not reconcile every
// second just to advance the "Last tick Xs ago" copy. Once the inputs
// are older than 60 s the rendered string only changes once per minute,
// so we slow the ticker to 30 s to avoid pure-overhead renders.
const FRESHNESS_STALE_MS = 60_000;
const FRESHNESS_FAST_INTERVAL_MS = 1_000;
const FRESHNESS_SLOW_INTERVAL_MS = 30_000;
function FreshnessLabel({ lastTickAt, lastPolledAt, pollIntervalMs }) {
    _s();
    const [, setTick] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FreshnessLabel.useEffect": ()=>{
            const now = Date.now();
            const tickStale = lastTickAt === null || now - lastTickAt >= FRESHNESS_STALE_MS;
            const polledStale = lastPolledAt === null || now - lastPolledAt >= FRESHNESS_STALE_MS;
            const ms = tickStale && polledStale ? FRESHNESS_SLOW_INTERVAL_MS : FRESHNESS_FAST_INTERVAL_MS;
            const t = setInterval({
                "FreshnessLabel.useEffect.t": ()=>setTick({
                        "FreshnessLabel.useEffect.t": (n)=>n + 1
                    }["FreshnessLabel.useEffect.t"])
            }["FreshnessLabel.useEffect.t"], ms);
            return ({
                "FreshnessLabel.useEffect": ()=>clearInterval(t)
            })["FreshnessLabel.useEffect"];
        }
    }["FreshnessLabel.useEffect"], [
        lastTickAt,
        lastPolledAt
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "hedge-last-success",
        className: "text-gray-500",
        children: renderFreshnessText({
            lastTickAt,
            lastPolledAt,
            pollIntervalMs
        })
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
        lineNumber: 165,
        columnNumber: 5
    }, this);
}
_s(FreshnessLabel, "/BsGHtAT6SHgLOdnp4Vgh6P3EWk=");
_c = FreshnessLabel;
// Owns its own 250 ms countdown ticker. Calls back on expiry so the
// parent can clear its throttle state and trigger the next fetch.
function ThrottleCountdown({ retryAt, onExpire }) {
    _s1();
    const [, setTick] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ThrottleCountdown.useEffect": ()=>{
            if (retryAt - Date.now() <= 0) {
                onExpire();
                return;
            }
            const t = setInterval({
                "ThrottleCountdown.useEffect.t": ()=>{
                    if (retryAt - Date.now() <= 0) {
                        clearInterval(t);
                        onExpire();
                        return;
                    }
                    setTick({
                        "ThrottleCountdown.useEffect.t": (n)=>n + 1
                    }["ThrottleCountdown.useEffect.t"]);
                }
            }["ThrottleCountdown.useEffect.t"], 250);
            return ({
                "ThrottleCountdown.useEffect": ()=>clearInterval(t)
            })["ThrottleCountdown.useEffect"];
        }
    }["ThrottleCountdown.useEffect"], [
        retryAt,
        onExpire
    ]);
    const remaining = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "hedge-throttle-countdown",
        className: "font-mono",
        children: [
            remaining,
            "s"
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
        lineNumber: 198,
        columnNumber: 5
    }, this);
}
_s1(ThrottleCountdown, "/BsGHtAT6SHgLOdnp4Vgh6P3EWk=");
_c1 = ThrottleCountdown;
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
// Resolves the engine's display model in one place so the header pill, stat
// tile value, and sub-line copy can never disagree about severity.
// Exhaustive switch on EngineStateLabel forces deliberate handling when a
// new state is added.
function resolveEngineState(input) {
    const label = resolveEngineLabel(input);
    switch(label){
        case 'ok':
            return {
                label,
                statLabel: 'ok',
                color: 'text-goodgreen',
                sub: {
                    text: `last tick ${timeAgo(input.snapshot?.timestamp)}`
                }
            };
        case 'degraded':
            return {
                label,
                statLabel: 'degraded',
                color: 'text-yellow-400',
                sub: {
                    text: input.breaker?.reason ?? 'degraded',
                    mono: true
                }
            };
        case 'halted':
            return {
                label,
                statLabel: 'halted',
                color: 'text-yellow-400',
                sub: {
                    text: 'kill-switch engaged'
                }
            };
        case 'unreachable':
            return {
                label,
                statLabel: 'down',
                color: 'text-red-400',
                sub: {
                    text: `auto-retry ${Math.round(input.pollIntervalMs / 1000)}s`,
                    color: 'text-red-400/80'
                }
            };
        case 'awaiting tick':
            return {
                label,
                statLabel: 'awaiting',
                color: 'text-gray-400',
                sub: {
                    text: 'warming up'
                }
            };
    }
}
function resolveEngineLabel(input) {
    if (input.error && !input.snapshot) return 'unreachable';
    if (!input.snapshot) return 'awaiting tick';
    if (input.killSwitch) return 'halted';
    if (input.breaker?.tripped) return 'degraded';
    return 'ok';
}
// Owns its own minute-resolution ticker so the receipts panel header
// re-renders the staleness label "stale 2m ago" without the parent
// card reconciling on every second. Reuses the same isolation pattern
// as `FreshnessLabel` (#0031).
function StaleChip({ sinceMs }) {
    _s2();
    const [, setTick] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StaleChip.useEffect": ()=>{
            const t = setInterval({
                "StaleChip.useEffect.t": ()=>setTick({
                        "StaleChip.useEffect.t": (n)=>n + 1
                    }["StaleChip.useEffect.t"])
            }["StaleChip.useEffect.t"], 30_000);
            return ({
                "StaleChip.useEffect": ()=>clearInterval(t)
            })["StaleChip.useEffect"];
        }
    }["StaleChip.useEffect"], []);
    const minutes = Math.max(0, Math.floor((Date.now() - sinceMs) / 60_000));
    const label = minutes <= 0 ? 'stale just now' : `stale ${minutes}m ago`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "hedge-receipts-stale",
        className: "text-xs rounded-md px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30",
        children: label
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
        lineNumber: 321,
        columnNumber: 5
    }, this);
}
_s2(StaleChip, "/BsGHtAT6SHgLOdnp4Vgh6P3EWk=");
_c2 = StaleChip;
function DegradedHint({ children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "hedge-degraded-hint",
        className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
        lineNumber: 332,
        columnNumber: 5
    }, this);
}
_c3 = DegradedHint;
// Centered icon-over-text empty state. Sits inside a `min-h-[7rem]`
// reserved wrapper (see render below) so the receipts panel stays the
// same height whether empty or populated — no layout jump when the first
// receipt arrives. The 28-px icon and two-line copy give the empty
// state real vertical presence next to the populated table.
const EMPTY_RECEIPTS_BASE_CLASS = 'flex flex-col items-center justify-center gap-2 text-center py-6 text-xs';
function EmptyReceiptsState({ error, hasSnapshot, degradedReceipts }) {
    if (error && !hasSnapshot) {
        // When the top error banner already carries the canonical
        // "Hedge engine unreachable / retrying" copy, this empty state
        // reverts to its functional "no receipts" role so the card does not
        // shout the same incident twice. The 28-px icon + headline/sub
        // structure from #0025 is preserved.
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            "data-testid": "hedge-receipts-empty",
            className: `${EMPTY_RECEIPTS_BASE_CLASS} text-gray-500`,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeStatusCard$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InboxIcon"], {
                    size: 28
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                    lineNumber: 369,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "font-medium text-sm text-gray-300",
                    children: "No receipts to show"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                    lineNumber: 370,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: "Engine offline (see banner above)."
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                    lineNumber: 371,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
            lineNumber: 365,
            columnNumber: 7
        }, this);
    }
    if (degradedReceipts) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            "data-testid": "hedge-receipts-empty",
            className: `${EMPTY_RECEIPTS_BASE_CLASS} text-yellow-300`,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeStatusCard$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertTriangleIcon"], {
                    size: 28
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                    lineNumber: 381,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "font-medium text-sm",
                    children: "Receipts source degraded"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                    lineNumber: 382,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-yellow-300/80 font-mono",
                    children: degradedReceipts
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                    lineNumber: 383,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
            lineNumber: 377,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-testid": "hedge-receipts-empty",
        className: `${EMPTY_RECEIPTS_BASE_CLASS} text-gray-500`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeStatusCard$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InboxIcon"], {
                size: 28
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 392,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "font-medium text-sm text-gray-300",
                children: "No hedge activity yet"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 393,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: "Receipts will appear here once the engine sends an order."
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 394,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
        lineNumber: 388,
        columnNumber: 5
    }, this);
}
_c4 = EmptyReceiptsState;
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
        className: `inline-flex items-center whitespace-nowrap shrink-0 px-2 py-0.5 rounded-md text-xs font-medium border ${c.cls}`,
        children: c.label
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
        lineNumber: 408,
        columnNumber: 5
    }, this);
}
_c5 = ModeBadge;
function resolveMode(data, error) {
    if (!data || error) return 'unknown';
    if (data.mode === 'demo' || data.mode === 'sandbox' || data.mode === 'real') {
        return data.mode;
    }
    return 'unknown';
}
// Engine-state pill replaces the trading-mode badge in the header when the
// engine has gone into an abnormal state. The header severity now mirrors
// the body's red `ENGINE: unreachable` stat tile instead of contradicting
// it with a calm grey `unknown`. Exhaustive switch forces a deliberate
// copy decision when a new engine state is added.
function resolveEngineStatePill(state) {
    switch(state){
        case 'unreachable':
            return {
                label: 'engine down',
                cls: 'bg-red-500/15 text-red-300 border-red-500/30'
            };
        case 'halted':
            return {
                label: 'engine halted',
                cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
            };
        case 'degraded':
            return {
                label: 'engine degraded',
                cls: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
            };
        case 'ok':
        case 'awaiting tick':
            return null;
    }
}
function HeaderStatusPill({ engineState, mode, lastReceiptMode }) {
    const pill = resolveEngineStatePill(engineState.label);
    const title = lastReceiptMode ? `last receipt mode: ${lastReceiptMode}` : undefined;
    if (pill) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            title: title,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "data-testid": "hedge-engine-state-pill",
                className: `inline-flex items-center whitespace-nowrap shrink-0 px-2 py-0.5 rounded-md text-xs font-medium border ${pill.cls}`,
                children: pill.label
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 472,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
            lineNumber: 471,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        title: title,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ModeBadge, {
            mode: mode
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
            lineNumber: 483,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
        lineNumber: 482,
        columnNumber: 5
    }, this);
}
_c6 = HeaderStatusPill;
function parseRetryAfterSeconds(header, body) {
    if (header) {
        const n = Number.parseInt(header, 10);
        if (Number.isFinite(n) && n > 0) return n;
    }
    if (body && Number.isFinite(body.retryAfterSeconds) && body.retryAfterSeconds > 0) {
        return body.retryAfterSeconds;
    }
    return 5;
}
const HedgeStatusCard = /*#__PURE__*/ _s3((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c7 = _s3(function HedgeStatusCard(_, ref) {
    _s3();
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isFetching, setIsFetching] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [throttle, setThrottle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // `lastPolledAt` updates after every resolved fetch (including error
    // shells that return 200 + `{error, snapshot: null}`). `lastTickAt`
    // only advances when we accept a real snapshot. Tracking them
    // separately lets the freshness label tell two distinct truths instead
    // of conflating "we reached the proxy" with "we have fresh engine
    // data".
    const [lastPolledAt, setLastPolledAt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [lastTickAt, setLastTickAt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // `lastGood` is the most recent healthy envelope. When the engine
    // flaps, the live `data` flips to the engine-down shell (so the
    // engine tile / pill / banner stay accurate) but `lastGood` keeps
    // feeding the cap tiles, receipts table, and proof link so the
    // operator never loses diagnostic context. `staleSinceMs` marks the
    // *first* unhealthy poll after the most recent healthy one — it
    // resets to null on recovery.
    const [lastGood, setLastGood] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [staleSinceMs, setStaleSinceMs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
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
                if (res.status === 429) {
                    // Self-inflicted rate-limit from withApiRateLimit. Don't render the
                    // red "engine unavailable" banner — surface a throttled state with
                    // a live countdown so the operator knows it's their own clicks.
                    const headerVal = res.headers.get('Retry-After');
                    let body = null;
                    try {
                        body = await res.json();
                    } catch  {
                        body = null;
                    }
                    if (gen !== genRef.current) return;
                    const seconds = parseRetryAfterSeconds(headerVal, body);
                    setThrottle({
                        retryAt: Date.now() + seconds * 1000
                    });
                    setError(null);
                    return;
                }
                // Always parse the body — every non-2xx response from
                // /api/hedge/status returns a JSON envelope with a useful `error`
                // string (503 engine-down, 502 upstream-error, 502 malformed). The
                // legacy `throw new Error(`HTTP ${status}`)` discarded the
                // server-composed message and surfaced a stack-trace-shaped
                // banner instead. Any genuine non-JSON body is caught here and
                // routed through `classifyClientError` so the banner reads as a
                // single branded sentence regardless of upstream shape.
                let body = null;
                let parseFailed = false;
                try {
                    body = await res.json();
                } catch  {
                    parseFailed = true;
                }
                if (gen !== genRef.current) return;
                setThrottle(null);
                const now = Date.now();
                setLastPolledAt(now);
                const markStale = {
                    "HedgeStatusCard.HedgeStatusCard.useCallback[fetchOnce].markStale": ()=>setStaleSinceMs({
                            "HedgeStatusCard.HedgeStatusCard.useCallback[fetchOnce].markStale": (prev)=>prev ?? now
                        }["HedgeStatusCard.HedgeStatusCard.useCallback[fetchOnce].markStale"])
                }["HedgeStatusCard.HedgeStatusCard.useCallback[fetchOnce].markStale"];
                if (parseFailed) {
                    setError((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$hedge$2d$error$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["classifyClientError"])(new SyntaxError('parse failed')));
                    markStale();
                    return;
                }
                if (!res.ok) {
                    const reason = body?.error ?? `upstream error (HTTP ${res.status})`;
                    setError(reason);
                    if (res.status === 503 && body) setData(body);
                    markStale();
                    return;
                }
                const envelope = body;
                if (envelope.error && !envelope.snapshot) {
                    setError(envelope.error);
                    setData(envelope);
                    markStale();
                } else {
                    setError(null);
                    setData(envelope);
                    setLastGood(envelope);
                    setStaleSinceMs(null);
                    setLastTickAt(now);
                }
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                if (gen !== genRef.current) return;
                setError((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$hedge$2d$error$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["classifyClientError"])(err));
                setStaleSinceMs({
                    "HedgeStatusCard.HedgeStatusCard.useCallback[fetchOnce]": (prev)=>prev ?? Date.now()
                }["HedgeStatusCard.HedgeStatusCard.useCallback[fetchOnce]"]);
            } finally{
                if (gen === genRef.current) {
                    inFlightRef.current = false;
                    setLoading(false);
                    setIsFetching(false);
                }
            }
        }
    }["HedgeStatusCard.HedgeStatusCard.useCallback[fetchOnce]"], []);
    // Poll only while the tab is visible so background tabs stop fanning
    // out hedge-engine snapshot/receipts/proof requests for nobody. Skip
    // when a fetch is still in flight so a slow upstream doesn't stack
    // concurrent aborts → re-fetches.
    const pollOnce = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HedgeStatusCard.HedgeStatusCard.useCallback[pollOnce]": ()=>{
            if (inFlightRef.current) return;
            void fetchOnce();
        }
    }["HedgeStatusCard.HedgeStatusCard.useCallback[pollOnce]"], [
        fetchOnce
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePollWhileVisible$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePollWhileVisible"])(pollOnce, POLL_INTERVAL_MS);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HedgeStatusCard.HedgeStatusCard.useEffect": ()=>{
            return ({
                "HedgeStatusCard.HedgeStatusCard.useEffect": ()=>{
                    abortRef.current?.abort();
                }
            })["HedgeStatusCard.HedgeStatusCard.useEffect"];
        }
    }["HedgeStatusCard.HedgeStatusCard.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useImperativeHandle"])(ref, {
        "HedgeStatusCard.HedgeStatusCard.useImperativeHandle": ()=>({
                refresh: ({
                    "HedgeStatusCard.HedgeStatusCard.useImperativeHandle": ()=>fetchOnce()
                })["HedgeStatusCard.HedgeStatusCard.useImperativeHandle"]
            })
    }["HedgeStatusCard.HedgeStatusCard.useImperativeHandle"], [
        fetchOnce
    ]);
    const handleThrottleExpire = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HedgeStatusCard.HedgeStatusCard.useCallback[handleThrottleExpire]": ()=>{
            setThrottle(null);
            void fetchOnce();
        }
    }["HedgeStatusCard.HedgeStatusCard.useCallback[handleThrottleExpire]"], [
        fetchOnce
    ]);
    const throttleRemainingSeconds = throttle ? Math.max(0, Math.ceil((throttle.retryAt - Date.now()) / 1000)) : 0;
    const isThrottled = throttle !== null;
    const fetchBusy = isFetching || isThrottled;
    const isStale = staleSinceMs !== null && lastGood !== null;
    // Cap, receipts, and proof come from `lastGood` while stale so the
    // operator sees the prior numbers (clearly marked) instead of em-dash
    // placeholders. Live signals — engine state, mode, breaker, kill
    // switch — keep flowing from `data`.
    const renderSource = isStale ? lastGood : data;
    const receipts = renderSource?.receipts ?? [];
    const cap = renderSource?.capSnapshot ?? null;
    const mode = resolveMode(data, error);
    const lastReceiptMode = receipts[0]?.mode;
    const breaker = data?.breakerState;
    const killSwitch = Boolean(data?.killSwitchEngaged);
    const hasSnapshot = Boolean(renderSource?.snapshot);
    const showSkeleton = loading && !data;
    const engineState = resolveEngineState({
        snapshot: data?.snapshot ?? null,
        error,
        breaker,
        killSwitch,
        pollIntervalMs: POLL_INTERVAL_MS
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "data-testid": "hedge-status-card",
        className: "bg-dark-100/50 rounded-xl border border-dark-50 p-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "data-testid": "hedge-header-row1",
                        className: "flex flex-wrap items-center justify-between gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3 min-w-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "text-lg font-semibold text-white",
                                        children: "Demo hedge proof"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                        lineNumber: 695,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(HeaderStatusPill, {
                                        engineState: engineState,
                                        mode: mode,
                                        lastReceiptMode: lastReceiptMode
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                        lineNumber: 698,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 694,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                "data-testid": "hedge-header-refresh-button",
                                onClick: ()=>void fetchOnce(),
                                disabled: fetchBusy,
                                "aria-label": isThrottled ? `Retry available in ${throttleRemainingSeconds} seconds` : isFetching ? 'Refreshing hedge status' : 'Refresh hedge status',
                                title: isThrottled ? `Retry available in ${throttleRemainingSeconds}s` : 'Refresh hedge status',
                                className: "shrink-0 inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-dark-50 text-gray-300 hover:text-white hover:bg-dark-50 disabled:opacity-50",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeStatusCard$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ArrowPathIcon"], {
                                        spinning: isFetching && !isThrottled
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                        lineNumber: 723,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: isThrottled ? `Retry in ${throttleRemainingSeconds}s` : isFetching ? 'Refreshing…' : 'Refresh'
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                        lineNumber: 724,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 704,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 690,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "data-testid": "hedge-header-row2",
                        className: "mt-2 flex items-center gap-2 flex-wrap text-xs",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FreshnessLabel, {
                                lastTickAt: lastTickAt,
                                lastPolledAt: lastPolledAt,
                                pollIntervalMs: POLL_INTERVAL_MS
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 737,
                                columnNumber: 11
                            }, this),
                            data?.degraded?.proof && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DegradedHint, {
                                children: [
                                    "proof: ",
                                    data.degraded.proof
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 743,
                                columnNumber: 13
                            }, this),
                            renderSource?.proof && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 flex-wrap",
                                children: [
                                    renderSource.proof.summary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        "data-testid": "hedge-proof-summary",
                                        className: "text-gray-400 font-mono truncate max-w-[28ch]",
                                        title: renderSource.proof.summary,
                                        children: renderSource.proof.summary
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                        lineNumber: 748,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        "data-testid": "hedge-proof-link",
                                        href: "/analytics/hedge/proof/latest",
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                        className: "text-goodgreen hover:underline font-mono",
                                        title: renderSource.proof.path,
                                        children: "latest proof →"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                        lineNumber: 756,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 746,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 733,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 689,
                columnNumber: 7
            }, this),
            isThrottled && throttle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "hedge-status-throttled",
                className: "mb-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-200 flex items-center justify-between gap-3 flex-wrap",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-medium",
                                children: "Throttled."
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 777,
                                columnNumber: 13
                            }, this),
                            " Too many requests, retrying in",
                            ' ',
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ThrottleCountdown, {
                                retryAt: throttle.retryAt,
                                onExpire: handleThrottleExpire
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 778,
                                columnNumber: 13
                            }, this),
                            "."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 776,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        "data-testid": "hedge-retry-button",
                        onClick: ()=>void fetchOnce(),
                        disabled: true,
                        className: "text-xs px-2.5 py-1 rounded-md border border-yellow-500/40 text-yellow-200 disabled:opacity-50",
                        children: [
                            "Retry in ",
                            throttleRemainingSeconds,
                            "s"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 781,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 772,
                columnNumber: 9
            }, this),
            !isThrottled && error && !data?.snapshot && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "hedge-status-error",
                className: "mb-3 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300 flex items-center justify-between gap-3 flex-wrap",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-0.5 min-w-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "font-medium",
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$hedge$2d$error$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildHedgeErrorHeadline"])(error)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 799,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-red-300/80 text-xs",
                                children: [
                                    "Auto-retrying every ",
                                    Math.round(POLL_INTERVAL_MS / 1000),
                                    "s."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 800,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 798,
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
                        lineNumber: 804,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 794,
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
                        lineNumber: 821,
                        columnNumber: 11
                    }, this),
                    " No further orders will be sent until the kill-switch file is removed."
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 817,
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
                        lineNumber: 831,
                        columnNumber: 11
                    }, this),
                    ' ',
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-mono break-all min-w-0",
                        children: breaker.reason
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 837,
                        columnNumber: 11
                    }, this),
                    breaker.detail && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-yellow-300/80 block sm:inline",
                        children: [
                            ' ',
                            "— ",
                            breaker.detail
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 839,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 827,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "hedge-stat-grid",
                className: "grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4",
                children: showSkeleton ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    "data-testid": "hedge-status-loading",
                    className: "col-span-2 sm:col-span-4 space-y-2 animate-pulse",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-4 bg-dark-50 rounded w-1/3"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                            lineNumber: 856,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-4 bg-dark-50 rounded w-2/3"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                            lineNumber: 857,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-4 bg-dark-50 rounded w-1/2"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                            lineNumber: 858,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                    lineNumber: 852,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Stat, {
                            testId: "hedge-notional-stat",
                            label: "Today's notional",
                            value: cap ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2d$notional$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNotionalUsd"])(cap.dailyNotionalUsd) : '—',
                            sub: cap ? `${cap.dailyOrders} orders${isStale ? ' · stale' : ''}` : hasSnapshot ? 'no caps' : 'awaiting tick',
                            stale: isStale
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                            lineNumber: 862,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Stat, {
                            testId: "hedge-cycle-orders-stat",
                            label: "Cycle orders",
                            value: cap ? `${cap.cycleOrders}` : '—',
                            sub: cap ? `day ${cap.dayKey}${isStale ? ' · stale' : ''}` : hasSnapshot ? 'no data' : 'awaiting tick',
                            stale: isStale
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                            lineNumber: 875,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Stat, {
                            testId: "hedge-receipts-visible-stat",
                            label: "Receipts visible",
                            value: hasSnapshot ? `${receipts.length}` : '—',
                            sub: hasSnapshot ? `newest 5${isStale ? ' · stale' : ''}` : 'awaiting tick',
                            stale: isStale
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                            lineNumber: 888,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Stat, {
                            testId: "hedge-engine-stat",
                            label: "Engine",
                            value: engineState.statLabel,
                            color: engineState.color,
                            sub: engineState.sub.text,
                            subColor: engineState.sub.color,
                            subMono: engineState.sub.mono,
                            subTestId: "hedge-engine-stat-sub"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                            lineNumber: 899,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 847,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-dark-50 rounded-lg p-3 overflow-x-auto",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between mb-2 flex-wrap gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2 flex-wrap",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-sm font-medium text-gray-300",
                                        children: "Recent receipts"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                        lineNumber: 916,
                                        columnNumber: 13
                                    }, this),
                                    isStale && staleSinceMs !== null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StaleChip, {
                                        sinceMs: staleSinceMs
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                        lineNumber: 918,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 915,
                                columnNumber: 11
                            }, this),
                            data?.degraded?.receipts && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DegradedHint, {
                                children: [
                                    "receipts source degraded: ",
                                    data.degraded.receipts
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 922,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 914,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "data-testid": "hedge-receipts-reserved",
                        className: "min-h-[7rem] flex flex-col justify-start",
                        children: receipts.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyReceiptsState, {
                            error: error,
                            hasSnapshot: hasSnapshot,
                            degradedReceipts: data?.degraded?.receipts
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                            lineNumber: 930,
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
                                                lineNumber: 939,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-1 pr-2",
                                                children: "id"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                lineNumber: 940,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-1 pr-2",
                                                children: "symbol"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                lineNumber: 941,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-1 pr-2",
                                                children: "side"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                lineNumber: 942,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-right py-1 pr-2",
                                                children: "notional"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                lineNumber: 943,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-1 pr-2",
                                                children: "exposure Δ"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                lineNumber: 944,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "text-left py-1",
                                                children: "status"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                                lineNumber: 945,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                        lineNumber: 938,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                    lineNumber: 937,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    children: receipts.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ReceiptRow, {
                                            receipt: r
                                        }, r.id, false, {
                                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                            lineNumber: 950,
                                            columnNumber: 17
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                    lineNumber: 948,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                            lineNumber: 936,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 925,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 913,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
        lineNumber: 685,
        columnNumber: 5
    }, this);
}, "Rg7rtvVlOmVX3iznfqyXb+BB30M=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePollWhileVisible$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePollWhileVisible"]
    ];
})), "Rg7rtvVlOmVX3iznfqyXb+BB30M=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePollWhileVisible$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePollWhileVisible"]
    ];
});
_c8 = HedgeStatusCard;
HedgeStatusCard.displayName = 'HedgeStatusCard';
const __TURBOPACK__default__export__ = HedgeStatusCard;
// Memoised so the four stat tiles skip the className build + re-render
// when their (entirely-primitive) props are unchanged. Default shallow
// compare is sufficient — every prop is a string/boolean.
const Stat = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memo"])(function Stat({ label, value, sub, color, testId, subColor, subMono, subTestId, stale }) {
    const subClasses = [
        'text-xs',
        subColor ?? 'text-gray-500',
        subMono ? 'font-mono truncate max-w-[14ch]' : ''
    ].filter(Boolean).join(' ');
    const containerClasses = [
        'bg-dark-50 rounded-xl p-3 flex flex-col gap-0.5',
        stale ? 'opacity-60' : ''
    ].filter(Boolean).join(' ');
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: containerClasses,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-xs text-gray-400 uppercase tracking-wide min-h-[2lh] sm:min-h-0",
                children: label
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 1003,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "data-testid": testId,
                className: `text-lg font-bold ${color ?? 'text-white'}`,
                children: value
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 1004,
                columnNumber: 7
            }, this),
            sub && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "data-testid": subTestId,
                className: subClasses,
                children: sub
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 1011,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
        lineNumber: 1002,
        columnNumber: 5
    }, this);
});
_c9 = Stat;
// Receipt rows come from a fresh JSON parse on every poll, so object
// identity is never stable. Compare on the exact subset of fields the
// row JSX reads so a byte-identical receipt skips re-render entirely.
// NB: extending the row's JSX requires adding any new field here too.
function areReceiptPropsEqual(a, b) {
    const x = a.receipt;
    const y = b.receipt;
    return x.id === y.id && x.timestamp === y.timestamp && x.success === y.success && x.notionalUsd === y.notionalUsd && x.beforeExposure === y.beforeExposure && x.afterExposure === y.afterExposure && x.etoroOrderId === y.etoroOrderId && x.symbol === y.symbol && x.side === y.side && x.error === y.error;
}
const ReceiptRow = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memo"])(function ReceiptRow({ receipt: r }) {
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
                lineNumber: 1051,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "py-1.5 pr-2 text-xs text-gray-300",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: shortId(r.id)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 1058,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "data-testid": "hedge-receipt-etoro-id",
                        className: "text-gray-500",
                        children: [
                            "eToro:",
                            ' ',
                            r.etoroOrderId ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-400 inline-block max-w-[10ch] truncate align-bottom",
                                title: r.etoroOrderId,
                                children: r.etoroOrderId
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 1069,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-400",
                                children: "—"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                                lineNumber: 1076,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 1059,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 1057,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "py-1.5 pr-2 text-white",
                children: r.symbol
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 1080,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "py-1.5 pr-2 text-gray-300",
                children: r.side
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 1081,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "py-1.5 pr-2 text-right text-gray-200",
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2d$notional$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatNotionalUsd"])(r.notionalUsd)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 1082,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                "data-testid": "hedge-receipt-exposure-delta",
                className: "py-1.5 pr-2 text-xs text-gray-300",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: delta.display
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                        lineNumber: 1089,
                        columnNumber: 9
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
                        lineNumber: 1090,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 1085,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                className: "py-1.5 text-xs",
                children: r.success ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-goodgreen",
                    children: "ok"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                    lineNumber: 1094,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-yellow-400",
                    children: r.error ?? 'failed'
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                    lineNumber: 1096,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
                lineNumber: 1092,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard.tsx",
        lineNumber: 1046,
        columnNumber: 5
    }, this);
}, areReceiptPropsEqual);
_c10 = ReceiptRow;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10;
__turbopack_context__.k.register(_c, "FreshnessLabel");
__turbopack_context__.k.register(_c1, "ThrottleCountdown");
__turbopack_context__.k.register(_c2, "StaleChip");
__turbopack_context__.k.register(_c3, "DegradedHint");
__turbopack_context__.k.register(_c4, "EmptyReceiptsState");
__turbopack_context__.k.register(_c5, "ModeBadge");
__turbopack_context__.k.register(_c6, "HeaderStatusPill");
__turbopack_context__.k.register(_c7, "HedgeStatusCard$forwardRef");
__turbopack_context__.k.register(_c8, "HedgeStatusCard");
__turbopack_context__.k.register(_c9, "Stat");
__turbopack_context__.k.register(_c10, "ReceiptRow");
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
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePollWhileVisible$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePollWhileVisible.ts [app-client] (ecmascript)");
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
    // Pause overview polling when the tab is hidden so idle browser
    // windows don't keep the address-book + indexer + status-aggregator
    // fan-out hot for nobody.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePollWhileVisible$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePollWhileVisible"])(fetchOverview, POLL_INTERVAL_MS);
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
                                lineNumber: 253,
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
                                        lineNumber: 256,
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
                                        lineNumber: 260,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 254,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 252,
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
                                lineNumber: 266,
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
                                lineNumber: 271,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 265,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 251,
                columnNumber: 7
            }, this),
            loadError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PanelError, {
                    message: loadError
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                    lineNumber: 295,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 294,
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
                        lineNumber: 301,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                        label: "Indexed events",
                        value: indexer?.ok && typeof indexer.totalEvents === 'number' ? indexer.totalEvents.toLocaleString() : '—',
                        sub: indexer?.ok && typeof indexer.lastBlock === 'number' ? `block ${indexer.lastBlock.toLocaleString()}` : 'indexer offline',
                        color: indexer?.ok ? 'text-white' : 'text-red-400'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 306,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                        label: "Chain tip",
                        value: chain?.ok && typeof chain.blockNumber === 'number' ? chain.blockNumber.toLocaleString() : '—',
                        sub: chain?.ok ? 'eth_blockNumber' : 'rpc offline',
                        color: chain?.ok ? 'text-white' : 'text-red-400'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 320,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                        label: "Service health",
                        value: status?.ok && typeof status.healthy === 'number' ? `${status.healthy}/${status.total}` : '—',
                        sub: status?.overall ?? 'aggregator offline',
                        color: status?.overall === 'healthy' ? 'text-goodgreen' : status?.overall === 'degraded' ? 'text-yellow-400' : status?.overall === 'down' ? 'text-red-400' : 'text-white'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 330,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 300,
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
                        lineNumber: 352,
                        columnNumber: 9
                    }, this),
                    !data && isInitialLoad ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500",
                        children: "Loading…"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 354,
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
                                        lineNumber: 358,
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
                                lineNumber: 357,
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
                                lineNumber: 362,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/api/status",
                                className: "text-xs px-2 py-0.5 rounded border border-dark-50 text-gray-400 hover:bg-dark-50",
                                children: "raw JSON →"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 366,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 356,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PanelError, {
                        message: status?.error ?? 'status aggregator unreachable'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 374,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 351,
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
                                lineNumber: 381,
                                columnNumber: 11
                            }, this),
                            indexer && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FreshnessBadge, {
                                status: indexer.lagStatus,
                                lagBlocks: indexer.lagBlocks
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 383,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 380,
                        columnNumber: 9
                    }, this),
                    indexer && indexer.lagStatus === 'db_ahead_of_chain' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-red-300 mb-3",
                        children: "Indexer database holds blocks newer than the live chain. This usually indicates a chain reset since the last index. The dashboard surfaces this rather than hiding it (Non-Negotiable #8); track recovery in iter 28 (indexer reset playbook)."
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 388,
                        columnNumber: 11
                    }, this),
                    !indexer && isInitialLoad && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500",
                        children: "Loading indexer overview…"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 397,
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
                                        lineNumber: 403,
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
                                                            lineNumber: 408,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-right py-1",
                                                            children: "Events"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 409,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-right py-1",
                                                            children: "Last block"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 410,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-right py-1",
                                                            children: "Updated"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 411,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                    lineNumber: 407,
                                                    columnNumber: 21
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 406,
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
                                                                lineNumber: 417,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 text-right text-gray-300",
                                                                children: p.total_events.toLocaleString()
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 418,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 text-right text-gray-400 font-mono text-xs",
                                                                children: p.last_event_block.toLocaleString()
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 421,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 text-right text-gray-500 text-xs",
                                                                children: timeAgo(p.last_updated)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 424,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, p.protocol, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                        lineNumber: 416,
                                                        columnNumber: 23
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 414,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 405,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500",
                                        children: "No protocol activity yet."
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 432,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 402,
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
                                        lineNumber: 437,
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
                                                        lineNumber: 445,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-gray-400",
                                                        children: ev.cnt.toLocaleString()
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                        lineNumber: 446,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, ev.event_name, true, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 441,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 439,
                                        columnNumber: 17
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs text-gray-500",
                                        children: "No events recorded yet."
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 451,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 436,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 401,
                        columnNumber: 11
                    }, this),
                    indexer && !indexer.ok && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PanelError, {
                        message: indexer.error ?? 'indexer unreachable'
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 458,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 379,
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
                        lineNumber: 464,
                        columnNumber: 9
                    }, this),
                    !ubi && isInitialLoad && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500",
                        children: "Loading…"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 466,
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
                                        lineNumber: 471,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                        label: "Splitters pending",
                                        value: ubi.pendingCount,
                                        sub: ubi.pendingCount > 0 ? 'needs deploy' : 'all live',
                                        color: ubi.pendingCount > 0 ? 'text-yellow-400' : 'text-goodgreen'
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 472,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                        label: "Protocol / UBI split",
                                        value: ubiPct,
                                        sub: "canonical bps"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 478,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatCard, {
                                        label: "Address book",
                                        value: data?.summary.addressBookVersion ?? '—',
                                        sub: "iter 26 artefact"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 483,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 470,
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
                                        lineNumber: 492,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-wrap gap-1.5",
                                        children: ubi.pendingSplitters.map((name)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "px-2 py-0.5 text-xs rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-300",
                                                children: name
                                            }, name, false, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 495,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 493,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 491,
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
                                        lineNumber: 507,
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
                                                            lineNumber: 511,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left py-1 pr-3",
                                                            children: "Route"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 512,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left py-1 pr-3",
                                                            children: "Source"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 513,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left py-1 pr-3",
                                                            children: "Sink"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 514,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-left py-1 pr-3",
                                                            children: "Method"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 515,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                            className: "text-right py-1",
                                                            children: "Status"
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 516,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                    lineNumber: 510,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 509,
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
                                                                lineNumber: 522,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 pr-3 text-gray-300",
                                                                children: r.label
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 523,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 pr-3 text-gray-400 font-mono text-xs",
                                                                children: r.source_contract
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 524,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 pr-3 text-gray-400 font-mono text-xs",
                                                                children: r.sink_contract
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 527,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 pr-3 text-gray-500 font-mono text-xs",
                                                                children: r.sink_method
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 530,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                className: "py-1.5 text-right text-xs",
                                                                children: r.source_address_pending_deploy ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-yellow-400",
                                                                    children: "pending"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                    lineNumber: 535,
                                                                    columnNumber: 27
                                                                }, this) : r.event_contract_deployed ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-goodgreen",
                                                                    children: "deployed"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                    lineNumber: 537,
                                                                    columnNumber: 27
                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-gray-400",
                                                                    children: "unknown"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                    lineNumber: 539,
                                                                    columnNumber: 27
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                                lineNumber: 533,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, r.id, true, {
                                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                        lineNumber: 521,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                lineNumber: 519,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 508,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 506,
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
                                        lineNumber: 550,
                                        columnNumber: 31
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 549,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 463,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeStatusCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    ref: hedgeCardRef
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                    lineNumber: 559,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 558,
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
                        lineNumber: 564,
                        columnNumber: 9
                    }, this),
                    protocols.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500",
                        children: "No protocols loaded."
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 566,
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
                                                lineNumber: 572,
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
                                                lineNumber: 573,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 571,
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
                                                            lineNumber: 578,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "font-mono text-gray-500",
                                                            children: shortAddr(c.address)
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                            lineNumber: 579,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, c.address, true, {
                                                    fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                                    lineNumber: 577,
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
                                                lineNumber: 583,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                        lineNumber: 575,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, p.key, true, {
                                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                                lineNumber: 570,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 568,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 563,
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
                        lineNumber: 595,
                        columnNumber: 18
                    }, this),
                    " (committed by iter 26), the status aggregator on ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: ":9200"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 596,
                        columnNumber: 34
                    }, this),
                    ", the indexer on",
                    ' ',
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: ":4200"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 597,
                        columnNumber: 9
                    }, this),
                    ", and ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        children: "eth_blockNumber"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                        lineNumber: 597,
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
                        lineNumber: 598,
                        columnNumber: 9
                    }, this),
                    "."
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
                lineNumber: 594,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/analytics/page.tsx",
        lineNumber: 249,
        columnNumber: 5
    }, this);
}
_s(AnalyticsPage, "jRFFhswmMzFXo1uyz99LbqfrpVk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePollWhileVisible$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePollWhileVisible"]
    ];
});
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

//# sourceMappingURL=frontend_src_0.66zni._.js.map