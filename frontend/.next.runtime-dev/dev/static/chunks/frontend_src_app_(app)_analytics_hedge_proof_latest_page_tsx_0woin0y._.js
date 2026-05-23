(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HedgeProofViewerPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$markdown$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__Markdown__as__default$3e$__ = __turbopack_context__.i("[project]/node_modules/react-markdown/lib/index.js [app-client] (ecmascript) <export Markdown as default>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
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
    }
}
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
function HedgeProofViewerPage() {
    _s();
    const [view, setView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        kind: 'loading'
    });
    const load = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HedgeProofViewerPage.useCallback[load]": async ()=>{
            setView({
                kind: 'loading'
            });
            let res;
            try {
                res = await fetch('/api/hedge/proof/latest.json', {
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
                // An OK response with an empty / whitespace-only body is reachable
                // when the engine emits the `latest.json` pointer at cycle start
                // but flushes the markdown body at cycle end, after a header-only
                // no-op cycle, or after a `> latest.md` truncation. Route those
                // into a dedicated empty-state instead of rendering an outlined
                // void in the OK shell (task 0037).
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
                copy: copyForResponse(body)
            });
        }
    }["HedgeProofViewerPage.useCallback[load]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HedgeProofViewerPage.useEffect": ()=>{
            void load();
        }
    }["HedgeProofViewerPage.useEffect"], [
        load
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-3xl mx-auto px-4 py-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PageHeader, {}, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 154,
                columnNumber: 7
            }, this),
            view.kind === 'loading' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingState, {}, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 155,
                columnNumber: 35
            }, this),
            view.kind === 'ok' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OkState, {
                data: view.data
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 156,
                columnNumber: 30
            }, this),
            view.kind === 'empty_body' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyBodyState, {
                data: view.data,
                onRetry: load
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 158,
                columnNumber: 9
            }, this),
            view.kind === 'no_proof' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NotFoundState, {
                title: "No hedge proof yet",
                detail: "The hedge engine has not written any proof artifacts yet. The dashboard will surface a proof link the moment the next cycle completes.",
                onRetry: load
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 161,
                columnNumber: 9
            }, this),
            view.kind === 'error' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NotFoundState, {
                title: view.copy.title,
                detail: view.copy.detail,
                onRetry: load,
                variant: "error"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 168,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
        lineNumber: 153,
        columnNumber: 5
    }, this);
}
_s(HedgeProofViewerPage, "w5uxSzu2tRjD/RrX/OnjcqRnt/A=");
_c = HedgeProofViewerPage;
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
                        fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                        lineNumber: 187,
                        columnNumber: 9
                    }, this),
                    " Back to dashboard"
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 182,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "mt-2 text-2xl font-semibold text-white",
                children: "Hedge proof"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 189,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
        lineNumber: 181,
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
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 201,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-4 bg-dark-50 rounded w-1/2"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 202,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-4 bg-dark-50 rounded w-3/4"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 203,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-4 bg-dark-50 rounded w-5/6"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 204,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
        lineNumber: 196,
        columnNumber: 5
    }, this);
}
_c2 = LoadingState;
function OkState({ data }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
        "data-testid": "hedge-proof-viewer",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofMetadataStrip, {
                pointer: data.pointer
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 212,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "hedge-proof-body",
                className: "prose prose-invert max-w-none rounded-xl border border-dark-50 bg-dark-100/40 p-5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$markdown$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__Markdown__as__default$3e$__["default"], {
                    children: data.markdown
                }, void 0, false, {
                    fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                    lineNumber: 217,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 213,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
        lineNumber: 211,
        columnNumber: 5
    }, this);
}
_c3 = OkState;
// Metadata strip (relative time + summary chip + raw-markdown link)
// rendered above both the OK body and the empty-body fallback so the
// operator keeps pointer context across both states (task 0037).
function ProofMetadataStrip({ pointer }) {
    const ts = renderTimestamp(pointer.timestamp);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mb-4 flex items-center gap-3 flex-wrap text-xs text-gray-400",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                title: ts.iso,
                "data-testid": "hedge-proof-timestamp",
                children: ts.relative
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 230,
                columnNumber: 7
            }, this),
            pointer.summary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "data-testid": "hedge-proof-summary",
                className: "rounded-md bg-dark-50 px-2 py-0.5 font-mono text-gray-300",
                title: pointer.summary,
                children: pointer.summary
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 234,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                "data-testid": "hedge-proof-raw-link",
                href: "/api/hedge/proof/latest",
                target: "_blank",
                rel: "noopener noreferrer",
                className: "text-goodgreen hover:underline",
                children: "View raw markdown"
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 242,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
        lineNumber: 229,
        columnNumber: 5
    }, this);
}
_c4 = ProofMetadataStrip;
function EmptyBodyState({ data, onRetry }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofMetadataStrip, {
                pointer: data.pointer
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 264,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NotFoundState, {
                testid: "hedge-proof-empty-body",
                title: "Proof body is empty",
                detail: "The engine wrote a pointer but the markdown body is empty. This usually means the current cycle is still in progress — try again in a few seconds, or view the raw file.",
                onRetry: onRetry
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 265,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
        lineNumber: 263,
        columnNumber: 5
    }, this);
}
_c5 = EmptyBodyState;
function NotFoundState({ title, detail, onRetry, variant = 'neutral', testid = 'hedge-proof-error' }) {
    const wrapperClass = variant === 'error' ? 'border-red-500/30 bg-red-500/10' : 'border-dark-50 bg-dark-100/40';
    const titleColor = variant === 'error' ? 'text-red-200' : 'text-white';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "data-testid": testid,
        className: `rounded-xl border ${wrapperClass} p-5`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                className: `text-base font-semibold ${titleColor}`,
                children: title
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 298,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-1 text-sm text-gray-300",
                children: detail
            }, void 0, false, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 299,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 flex items-center gap-3 flex-wrap",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        "data-testid": "hedge-proof-retry",
                        onClick: ()=>void onRetry(),
                        className: "text-xs px-3 py-1.5 rounded-md border border-dark-50 text-gray-200 hover:bg-dark-50",
                        children: "Retry"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                        lineNumber: 301,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/analytics",
                        className: "text-xs text-gray-400 hover:text-white",
                        children: "← Back to dashboard"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                        lineNumber: 309,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
                lineNumber: 300,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
        lineNumber: 294,
        columnNumber: 5
    }, this);
}
_c6 = NotFoundState;
var _c, _c1, _c2, _c3, _c4, _c5, _c6;
__turbopack_context__.k.register(_c, "HedgeProofViewerPage");
__turbopack_context__.k.register(_c1, "PageHeader");
__turbopack_context__.k.register(_c2, "LoadingState");
__turbopack_context__.k.register(_c3, "OkState");
__turbopack_context__.k.register(_c4, "ProofMetadataStrip");
__turbopack_context__.k.register(_c5, "EmptyBodyState");
__turbopack_context__.k.register(_c6, "NotFoundState");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_src_app_%28app%29_analytics_hedge_proof_latest_page_tsx_0woin0y._.js.map