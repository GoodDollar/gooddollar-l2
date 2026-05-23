(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/components/HedgeProofErrorCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HedgeProofErrorCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
'use client';
;
;
function HedgeProofErrorCard({ title, detail, onRetry, variant = 'neutral', testid = 'hedge-proof-error' }) {
    const wrapperClass = variant === 'error' ? 'border-red-500/30 bg-red-500/10' : 'border-dark-50 bg-dark-100/40';
    const titleColor = variant === 'error' ? 'text-red-200' : 'text-white';
    // Match the dashboard's red-on-red Retry palette when the wrapper is red,
    // and keep the neutral grey on the calmer "no proof yet" / empty-body
    // surfaces. Both variants share `disabled:opacity-50` so any future
    // caller wiring an in-flight `disabled` attribute fades consistently.
    const retryClass = variant === 'error' ? 'text-xs px-3 py-1.5 rounded-md border border-red-500/40 text-red-200 hover:bg-red-500/10 disabled:opacity-50' : 'text-xs px-3 py-1.5 rounded-md border border-dark-50 text-gray-200 hover:bg-dark-50 disabled:opacity-50';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "data-testid": testid,
        className: `rounded-xl border ${wrapperClass} p-5`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: `text-base font-semibold ${titleColor}`,
                children: title
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofErrorCard.tsx",
                lineNumber: 59,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-1 text-sm text-gray-300",
                children: detail
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofErrorCard.tsx",
                lineNumber: 60,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 flex items-center gap-3 flex-wrap",
                children: [
                    onRetry && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        "data-testid": "hedge-proof-retry",
                        onClick: ()=>void onRetry(),
                        className: retryClass,
                        children: "Retry"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeProofErrorCard.tsx",
                        lineNumber: 63,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/analytics",
                        className: "text-xs text-gray-400 hover:text-white",
                        children: "← Back to dashboard"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeProofErrorCard.tsx",
                        lineNumber: 72,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeProofErrorCard.tsx",
                lineNumber: 61,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeProofErrorCard.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
_c = HedgeProofErrorCard;
var _c;
__turbopack_context__.k.register(_c, "HedgeProofErrorCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/HedgeProofViewer/proof-response.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Lane 5 — proof-response envelope + branded error-copy resolution.
 *
 * Split from `HedgeProofViewer.tsx` so the viewer module stays a
 * components-only file (Fast Refresh / `react-doctor/only-export-
 * components`) and the exhaustive switch is easy to unit-test in
 * isolation.
 *
 * `ProofResponse` must stay a superset of every status emitted by
 * `/api/hedge/proof/latest.json` AND `/api/hedge/proof/[receiptId]`.
 * The `default` branch in `copyForResponse` is intentionally
 * defensive — it returns a branded `ErrorCopy` instead of `undefined`
 * so a wire-shape skew (engine version emits a new status, response
 * cast through `as`) never crashes render with `Cannot read
 * properties of undefined (reading 'title')`. The `const _exhaustive:
 * never = res` pattern simultaneously forces every known status to
 * be handled at compile time.
 */ __turbopack_context__.s([
    "copyForResponse",
    ()=>copyForResponse
]);
function copyForResponse(res) {
    switch(res.status){
        case 'ok':
        case 'no_proof':
            return {
                title: 'Hedge proof unavailable',
                detail: 'No further detail available.'
            };
        case 'engine_down':
            return {
                title: 'Hedge engine unreachable',
                detail: 'Could not fetch the latest proof pointer from the hedge engine.'
            };
        case 'engine_error':
            return {
                title: 'Hedge engine returned an error',
                detail: `Proof pointer endpoint returned HTTP ${res.httpStatus}.`
            };
        case 'unreadable':
            return {
                title: 'Hedge engine returned an unreadable response',
                detail: res.reason
            };
        case 'forbidden':
            return {
                title: 'Proof path forbidden',
                detail: res.reason
            };
        case 'missing':
            return {
                title: 'Hedge proof file missing',
                detail: res.reason
            };
        case 'invalid_id':
            return {
                title: 'Receipt id was rejected',
                detail: res.reason
            };
        default:
            {
                const _exhaustive = res;
                void _exhaustive;
                return {
                    title: 'Hedge proof unavailable',
                    detail: 'The proof endpoint returned an unexpected response. Retry, or open the dashboard to pick another receipt.'
                };
            }
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/HedgeProofViewer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HedgeProofViewer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$markdown$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__Markdown__as__default$3e$__ = __turbopack_context__.i("[project]/node_modules/react-markdown/lib/index.js [app-client] (ecmascript) <export Markdown as default>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeProofErrorCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/HedgeProofErrorCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeProofViewer$2f$proof$2d$response$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/HedgeProofViewer/proof-response.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
function copyForNetwork() {
    return {
        title: 'No network connection',
        detail: 'Could not reach the proof endpoint. Check your connection and retry.'
    };
}
function renderTimestamp(ms) {
    const iso = Number.isFinite(ms) ? new Date(ms).toISOString() : '';
    const diff = Math.max(0, Math.floor((Date.now() - ms) / 1000));
    let relative;
    if (!Number.isFinite(ms)) relative = 'unknown';
    else if (diff < 60) relative = `${diff}s ago`;
    else if (diff < 3600) relative = `${Math.floor(diff / 60)}m ago`;
    else if (diff < 86400) relative = `${Math.floor(diff / 3600)}h ago`;
    else relative = `${Math.floor(diff / 86400)}d ago`;
    return {
        iso,
        relative
    };
}
const DEFAULT_NOT_FOUND_TITLE = 'No hedge proof yet';
const DEFAULT_NOT_FOUND_DETAIL = 'The hedge engine has not written any proof artifacts yet. The dashboard will surface a proof link the moment the next cycle completes.';
function HedgeProofViewer({ endpoint, notFoundTitle = DEFAULT_NOT_FOUND_TITLE, notFoundDetail = DEFAULT_NOT_FOUND_DETAIL, rawMarkdownHref }) {
    _s();
    const [view, setView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        kind: 'loading'
    });
    const load = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HedgeProofViewer.useCallback[load]": async ()=>{
            setView({
                kind: 'loading'
            });
            let res;
            try {
                res = await fetch(endpoint, {
                    cache: 'no-store'
                });
            } catch  {
                setView({
                    kind: 'error',
                    copy: copyForNetwork()
                });
                return;
            }
            let body;
            try {
                body = await res.json();
            } catch  {
                setView({
                    kind: 'error',
                    copy: {
                        title: 'Hedge engine returned an unreadable response',
                        detail: 'The proof endpoint did not return JSON.'
                    }
                });
                return;
            }
            if (body.status === 'ok') {
                if (body.markdown.trim().length === 0) {
                    setView({
                        kind: 'empty_body',
                        data: body
                    });
                } else {
                    setView({
                        kind: 'ok',
                        data: body
                    });
                }
                return;
            }
            if (body.status === 'no_proof') {
                setView({
                    kind: 'no_proof'
                });
                return;
            }
            setView({
                kind: 'error',
                copy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeProofViewer$2f$proof$2d$response$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["copyForResponse"])(body)
            });
        }
    }["HedgeProofViewer.useCallback[load]"], [
        endpoint
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HedgeProofViewer.useEffect": ()=>{
            void load();
        }
    }["HedgeProofViewer.useEffect"], [
        load
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-3xl mx-auto px-4 py-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PageHeader, {}, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 134,
                columnNumber: 7
            }, this),
            view.kind === 'loading' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingState, {}, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 135,
                columnNumber: 35
            }, this),
            view.kind === 'ok' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OkState, {
                data: view.data,
                rawMarkdownHref: rawMarkdownHref
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 137,
                columnNumber: 9
            }, this),
            view.kind === 'empty_body' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyBodyState, {
                data: view.data,
                onRetry: load,
                rawMarkdownHref: rawMarkdownHref
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 140,
                columnNumber: 9
            }, this),
            view.kind === 'no_proof' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeProofErrorCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                title: notFoundTitle,
                detail: notFoundDetail,
                onRetry: load
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 147,
                columnNumber: 9
            }, this),
            view.kind === 'error' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeProofErrorCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                title: view.copy.title,
                detail: view.copy.detail,
                onRetry: load,
                variant: "error"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 154,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
        lineNumber: 133,
        columnNumber: 5
    }, this);
}
_s(HedgeProofViewer, "w5uxSzu2tRjD/RrX/OnjcqRnt/A=");
_c = HedgeProofViewer;
function PageHeader() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
        className: "mb-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                "data-testid": "hedge-proof-back-link",
                href: "/analytics",
                className: "text-xs text-gray-400 hover:text-white inline-flex items-center gap-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": "true",
                        children: "←"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                        lineNumber: 173,
                        columnNumber: 9
                    }, this),
                    " Back to dashboard"
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 168,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "mt-2 text-2xl font-semibold text-white",
                children: "Hedge proof"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 175,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
        lineNumber: 167,
        columnNumber: 5
    }, this);
}
_c1 = PageHeader;
function LoadingState() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "data-testid": "hedge-proof-loading",
        className: "space-y-3 animate-pulse",
        "aria-busy": "true",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-5 bg-dark-50 rounded w-2/3"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 187,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-4 bg-dark-50 rounded w-1/2"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 188,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-4 bg-dark-50 rounded w-3/4"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 189,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-4 bg-dark-50 rounded w-5/6"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 190,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
        lineNumber: 182,
        columnNumber: 5
    }, this);
}
_c2 = LoadingState;
function OkState({ data, rawMarkdownHref }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
        "data-testid": "hedge-proof-viewer",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofMetadataStrip, {
                pointer: data.pointer,
                rawMarkdownHref: rawMarkdownHref
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 204,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "hedge-proof-body",
                className: "prose prose-invert max-w-none rounded-xl border border-dark-50 bg-dark-100/40 p-5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$markdown$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__Markdown__as__default$3e$__["default"], {
                    children: data.markdown
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                    lineNumber: 209,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 205,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
        lineNumber: 203,
        columnNumber: 5
    }, this);
}
_c3 = OkState;
function ProofMetadataStrip({ pointer, rawMarkdownHref }) {
    const ts = renderTimestamp(pointer.timestamp);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mb-4 flex items-center gap-3 flex-wrap text-xs text-gray-400",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                title: ts.iso,
                "data-testid": "hedge-proof-timestamp",
                children: ts.relative
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 225,
                columnNumber: 7
            }, this),
            pointer.summary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "data-testid": "hedge-proof-summary",
                className: "rounded-md bg-dark-50 px-2 py-0.5 font-mono text-gray-300",
                title: pointer.summary,
                children: pointer.summary
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 229,
                columnNumber: 9
            }, this),
            rawMarkdownHref && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                "data-testid": "hedge-proof-raw-link",
                href: rawMarkdownHref,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-goodgreen hover:underline",
                children: "View raw markdown"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 238,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
        lineNumber: 224,
        columnNumber: 5
    }, this);
}
_c4 = ProofMetadataStrip;
function EmptyBodyState({ data, onRetry, rawMarkdownHref }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofMetadataStrip, {
                pointer: data.pointer,
                rawMarkdownHref: rawMarkdownHref
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 263,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeProofErrorCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                testid: "hedge-proof-empty-body",
                title: "Proof body is empty",
                detail: "The engine wrote a pointer but the markdown body is empty. This usually means the current cycle is still in progress — try again in a few seconds, or view the raw file.",
                onRetry: onRetry
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 264,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
        lineNumber: 262,
        columnNumber: 5
    }, this);
}
_c5 = EmptyBodyState;
var _c, _c1, _c2, _c3, _c4, _c5;
__turbopack_context__.k.register(_c, "HedgeProofViewer");
__turbopack_context__.k.register(_c1, "PageHeader");
__turbopack_context__.k.register(_c2, "LoadingState");
__turbopack_context__.k.register(_c3, "OkState");
__turbopack_context__.k.register(_c4, "ProofMetadataStrip");
__turbopack_context__.k.register(_c5, "EmptyBodyState");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/app/(app)/analytics/hedge/proof/[receiptId]/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HedgeProofViewerPerReceiptPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeProofViewer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/HedgeProofViewer.tsx [app-client] (ecmascript)");
'use client';
;
;
;
function HedgeProofViewerPerReceiptPage({ params }) {
    const { receiptId } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["use"])(params);
    const safe = encodeURIComponent(receiptId);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeProofViewer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        endpoint: `/api/hedge/proof/${safe}`,
        notFoundTitle: `Proof not found for receipt ${receiptId}`,
        notFoundDetail: "The hedge engine has no proof artifact for this receipt id. It may have been pruned or the id may belong to a different engine instance."
    }, void 0, false, {
        fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/[receiptId]/page.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
_c = HedgeProofViewerPerReceiptPage;
var _c;
__turbopack_context__.k.register(_c, "HedgeProofViewerPerReceiptPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_src_0wgzrc5._.js.map