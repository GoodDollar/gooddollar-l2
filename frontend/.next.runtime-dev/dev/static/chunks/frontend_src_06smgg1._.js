(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
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
    "ExclamationCircleIcon",
    ()=>ExclamationCircleIcon,
    "InboxIcon",
    ()=>InboxIcon,
    "InformationCircleIcon",
    ()=>InformationCircleIcon
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
function ExclamationCircleIcon({ size = 16 } = {}) {
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
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "12",
                cy: "12",
                r: "9"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 113,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 8v5"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 114,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "12",
                cy: "16.25",
                r: "0.5",
                fill: "currentColor"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 115,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
        lineNumber: 102,
        columnNumber: 5
    }, this);
}
_c4 = ExclamationCircleIcon;
function InformationCircleIcon({ size = 16 } = {}) {
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
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "12",
                cy: "12",
                r: "9"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 137,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12 11v5"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 138,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "12",
                cy: "8",
                r: "0.5",
                fill: "currentColor"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
                lineNumber: 139,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeStatusCard/icons.tsx",
        lineNumber: 126,
        columnNumber: 5
    }, this);
}
_c5 = InformationCircleIcon;
var _c, _c1, _c2, _c3, _c4, _c5;
__turbopack_context__.k.register(_c, "ArrowPathIcon");
__turbopack_context__.k.register(_c1, "CloudOffIcon");
__turbopack_context__.k.register(_c2, "AlertTriangleIcon");
__turbopack_context__.k.register(_c3, "InboxIcon");
__turbopack_context__.k.register(_c4, "ExclamationCircleIcon");
__turbopack_context__.k.register(_c5, "InformationCircleIcon");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/HedgeProofErrorCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HedgeProofErrorCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeStatusCard$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/HedgeStatusCard/icons.tsx [app-client] (ecmascript)");
'use client';
;
;
function HedgeProofErrorCard({ title, detail, onRetry, variant = 'neutral', testid = 'hedge-proof-error', titleTooltip }) {
    const wrapperClass = variant === 'error' ? 'border-red-500/30 bg-red-500/10' : 'border-dark-50 bg-dark-100/40';
    const titleColor = variant === 'error' ? 'text-red-200' : 'text-white';
    // Match the dashboard's red-on-red Retry palette when the wrapper is red,
    // and keep the neutral grey on the calmer "no proof yet" / empty-body
    // surfaces. Both variants share `disabled:opacity-50` so any future
    // caller wiring an in-flight `disabled` attribute fades consistently.
    const retryClass = variant === 'error' ? 'text-xs px-3 py-1.5 rounded-md border border-red-500/40 text-red-200 hover:bg-red-500/10 disabled:opacity-50' : 'text-xs px-3 py-1.5 rounded-md border border-dark-50 text-gray-200 hover:bg-dark-50 disabled:opacity-50';
    // Anchor every error surface with a status glyph (#0057). The
    // exclamation-in-circle reads as "this is an error" before any copy is
    // parsed; the calmer information glyph reads as "empty state, not a
    // failure" on the no_proof / empty_body surfaces. Both icons carry
    // `aria-hidden="true"` via the shared SVG primitive — copy stays the
    // semantic source of truth for screen readers.
    const StatusGlyph = variant === 'error' ? __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeStatusCard$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ExclamationCircleIcon"] : __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeStatusCard$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["InformationCircleIcon"];
    const iconColor = variant === 'error' ? 'text-red-400' : 'text-gray-400';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        "data-testid": testid,
        className: `rounded-xl border ${wrapperClass} p-5`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-start gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "data-testid": "hedge-proof-error-icon",
                        className: `${iconColor} shrink-0 mt-0.5`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusGlyph, {
                            size: 20
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/HedgeProofErrorCard.tsx",
                            lineNumber: 82,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeProofErrorCard.tsx",
                        lineNumber: 78,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "min-w-0 flex-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: `text-base font-semibold ${titleColor} break-words [overflow-wrap:anywhere]`,
                                title: titleTooltip,
                                children: title
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/HedgeProofErrorCard.tsx",
                                lineNumber: 94,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-sm text-gray-300",
                                children: detail
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/HedgeProofErrorCard.tsx",
                                lineNumber: 100,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/HedgeProofErrorCard.tsx",
                        lineNumber: 84,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeProofErrorCard.tsx",
                lineNumber: 77,
                columnNumber: 7
            }, this),
            onRetry && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-4 flex items-center gap-3 flex-wrap",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    "data-testid": "hedge-proof-retry",
                    onClick: ()=>void onRetry(),
                    className: retryClass,
                    children: "Retry"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/HedgeProofErrorCard.tsx",
                    lineNumber: 105,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofErrorCard.tsx",
                lineNumber: 104,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeProofErrorCard.tsx",
        lineNumber: 73,
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
function copyForResponse(res, surface = 'latest') {
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
                detail: surface === 'receipt' ? "Could not fetch this receipt's proof from the hedge engine." : 'Could not fetch the latest proof pointer from the hedge engine.'
            };
        case 'engine_error':
            return {
                title: 'Hedge engine returned an error',
                detail: surface === 'receipt' ? `Receipt proof endpoint returned HTTP ${res.httpStatus}.` : `Proof pointer endpoint returned HTTP ${res.httpStatus}.`
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
function HedgeProofViewer({ endpoint, notFoundTitle = DEFAULT_NOT_FOUND_TITLE, notFoundDetail = DEFAULT_NOT_FOUND_DETAIL, notFoundTitleTooltip, rawMarkdownHref, surface = 'latest' }) {
    _s();
    const [view, setView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        kind: 'loading'
    });
    // Race-condition guards (#0065). Mirrors the canonical pattern from
    // `HedgeStatusCard` (#0011):
    //   - `seqRef`: monotonic per-load counter; only the latest fetch's
    //     `setView` calls win even if a slow upstream ignores the abort.
    //   - `abortRef`: latest controller so a new load cancels its
    //     predecessor and unmount cancels whichever is in flight.
    // Retry calls `load` directly through this same path so a stale
    // retry response can never overwrite a newer one.
    const seqRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const abortRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const load = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "HedgeProofViewer.useCallback[load]": async ()=>{
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            const mySeq = ++seqRef.current;
            setView({
                kind: 'loading'
            });
            let res;
            try {
                res = await fetch(endpoint, {
                    cache: 'no-store',
                    signal: controller.signal
                });
            } catch  {
                if (controller.signal.aborted) return;
                if (mySeq !== seqRef.current) return;
                setView({
                    kind: 'error',
                    copy: copyForNetwork(),
                    status: 'network_error'
                });
                return;
            }
            let body;
            try {
                body = await res.json();
            } catch  {
                if (controller.signal.aborted) return;
                if (mySeq !== seqRef.current) return;
                setView({
                    kind: 'error',
                    copy: {
                        title: 'Hedge engine returned an unreadable response',
                        detail: 'The proof endpoint did not return JSON.'
                    },
                    status: 'unreadable'
                });
                return;
            }
            if (mySeq !== seqRef.current) return;
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
                copy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeProofViewer$2f$proof$2d$response$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["copyForResponse"])(body, surface),
                status: body.status
            });
        }
    }["HedgeProofViewer.useCallback[load]"], [
        endpoint,
        surface
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HedgeProofViewer.useEffect": ()=>{
            void load();
            return ({
                "HedgeProofViewer.useEffect": ()=>{
                    abortRef.current?.abort();
                }
            })["HedgeProofViewer.useEffect"];
        }
    }["HedgeProofViewer.useEffect"], [
        load
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-3xl mx-auto px-4 py-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PageHeader, {}, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 197,
                columnNumber: 7
            }, this),
            view.kind === 'loading' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingState, {}, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 198,
                columnNumber: 35
            }, this),
            view.kind === 'ok' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(OkState, {
                data: view.data,
                rawMarkdownHref: rawMarkdownHref
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 200,
                columnNumber: 9
            }, this),
            view.kind === 'empty_body' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyBodyState, {
                data: view.data,
                onRetry: load,
                rawMarkdownHref: rawMarkdownHref
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 203,
                columnNumber: 9
            }, this),
            view.kind === 'no_proof' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeProofErrorCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        title: notFoundTitle,
                        detail: notFoundDetail,
                        onRetry: load,
                        titleTooltip: notFoundTitleTooltip
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                        lineNumber: 211,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofErrorRecoveryRow, {
                        endpoint: endpoint,
                        status: "no_proof",
                        rawMarkdownHref: rawMarkdownHref
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                        lineNumber: 217,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true),
            view.kind === 'error' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeProofErrorCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        title: view.copy.title,
                        detail: view.copy.detail,
                        onRetry: load,
                        variant: "error"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                        lineNumber: 226,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ProofErrorRecoveryRow, {
                        endpoint: endpoint,
                        status: view.status,
                        rawMarkdownHref: rawMarkdownHref
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                        lineNumber: 232,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
        lineNumber: 196,
        columnNumber: 5
    }, this);
}
_s(HedgeProofViewer, "BbwD1aSoZ8bY16Z3CpjyJ0JmT/k=");
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
                        lineNumber: 251,
                        columnNumber: 9
                    }, this),
                    " Back to dashboard"
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 246,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "mt-2 text-2xl font-semibold text-white",
                children: "Hedge proof"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 253,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
        lineNumber: 245,
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
                lineNumber: 265,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-4 bg-dark-50 rounded w-1/2"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 266,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-4 bg-dark-50 rounded w-3/4"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 267,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-4 bg-dark-50 rounded w-5/6"
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 268,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
        lineNumber: 260,
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
                lineNumber: 282,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "hedge-proof-body",
                className: "prose prose-invert max-w-none rounded-xl border border-dark-50 bg-dark-100/40 p-5",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$markdown$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__Markdown__as__default$3e$__["default"], {
                    children: data.markdown
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                    lineNumber: 287,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 283,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
        lineNumber: 281,
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
                lineNumber: 303,
                columnNumber: 7
            }, this),
            pointer.summary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "data-testid": "hedge-proof-summary",
                className: "rounded-md bg-dark-50 px-2 py-0.5 font-mono text-gray-300",
                title: pointer.summary,
                children: pointer.summary
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 307,
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
                lineNumber: 316,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
        lineNumber: 302,
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
                lineNumber: 341,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeProofErrorCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                testid: "hedge-proof-empty-body",
                title: "Proof body is empty",
                detail: "The engine wrote a pointer but the markdown body is empty. This usually means the current cycle is still in progress — try again in a few seconds, or view the raw file.",
                onRetry: onRetry
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 342,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
        lineNumber: 340,
        columnNumber: 5
    }, this);
}
_c5 = EmptyBodyState;
/**
 * Secondary recovery affordances rendered beneath the error / no_proof
 * cards (#0071). The Retry button alone is not useful when the engine
 * is down (the operator already knows clicking Retry won't help until
 * the engine recovers); this row gives them somewhere to go:
 *
 *   - `View raw markdown ↗` — escape-hatch to the raw endpoint when
 *     ops scripts or curl are the only way forward (only rendered
 *     when the parent passes `rawMarkdownHref`; per-receipt viewer
 *     omits it because there is no equivalent markdown route).
 *   - `Jump to receipts table ↓` — anchor to `#hedge-status-card` on
 *     `/analytics`, the table they're most likely heading to next.
 *   - Endpoint + status recap — machine-readable line so an operator
 *     copy-pasting it into Slack carries both pieces of context.
 */ function ProofErrorRecoveryRow({ endpoint, status, rawMarkdownHref }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-testid": "hedge-proof-recovery-row",
        className: "mt-4 space-y-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-4 flex-wrap text-xs",
                children: [
                    rawMarkdownHref && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        "data-testid": "hedge-proof-recovery-raw-link",
                        href: rawMarkdownHref,
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-goodgreen hover:underline",
                        children: "View raw markdown ↗"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                        lineNumber: 383,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        "data-testid": "hedge-proof-recovery-jump-link",
                        href: "/analytics#hedge-status-card",
                        className: "text-goodgreen hover:underline",
                        children: "Jump to receipts table ↓"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                        lineNumber: 393,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 381,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "hedge-proof-recovery-recap",
                className: "text-xs text-gray-500 font-mono",
                children: [
                    "Endpoint: ",
                    endpoint,
                    " · status: ",
                    status
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
                lineNumber: 401,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/HedgeProofViewer.tsx",
        lineNumber: 377,
        columnNumber: 5
    }, this);
}
_c6 = ProofErrorRecoveryRow;
var _c, _c1, _c2, _c3, _c4, _c5, _c6;
__turbopack_context__.k.register(_c, "HedgeProofViewer");
__turbopack_context__.k.register(_c1, "PageHeader");
__turbopack_context__.k.register(_c2, "LoadingState");
__turbopack_context__.k.register(_c3, "OkState");
__turbopack_context__.k.register(_c4, "ProofMetadataStrip");
__turbopack_context__.k.register(_c5, "EmptyBodyState");
__turbopack_context__.k.register(_c6, "ProofErrorRecoveryRow");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>HedgeProofViewerLatestPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeProofViewer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/HedgeProofViewer.tsx [app-client] (ecmascript)");
'use client';
;
;
function HedgeProofViewerLatestPage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$HedgeProofViewer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        endpoint: "/api/hedge/proof/latest.json",
        rawMarkdownHref: "/api/hedge/proof/latest",
        surface: "latest"
    }, void 0, false, {
        fileName: "[project]/frontend/src/app/(app)/analytics/hedge/proof/latest/page.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
_c = HedgeProofViewerLatestPage;
var _c;
__turbopack_context__.k.register(_c, "HedgeProofViewerLatestPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_src_06smgg1._.js.map