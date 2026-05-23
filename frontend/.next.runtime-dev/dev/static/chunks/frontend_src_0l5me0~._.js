(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/components/ScrollStrip.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ScrollStrip",
    ()=>ScrollStrip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function ScrollStrip({ children, className = '', wrapperClassName = '', fadeFromClass = 'from-[hsl(var(--background))]', fadeWidthClass = 'w-8', ariaLabel }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `relative ${wrapperClassName}`.trim(),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-scroll-strip-scroller": "",
                className: `overflow-x-auto scrollbar-none ${className}`.trim(),
                ...ariaLabel ? {
                    role: 'group',
                    'aria-label': ariaLabel
                } : {},
                children: children
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ScrollStrip.tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "data-scroll-strip-fade": "",
                "aria-hidden": "true",
                className: `pointer-events-none absolute right-0 top-0 bottom-0 ${fadeWidthClass} bg-gradient-to-l ${fadeFromClass} to-transparent`
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/ScrollStrip.tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/ScrollStrip.tsx",
        lineNumber: 45,
        columnNumber: 5
    }, this);
}
_c = ScrollStrip;
var _c;
__turbopack_context__.k.register(_c, "ScrollStrip");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/SectionNav.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SectionNav",
    ()=>SectionNav
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ScrollStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ScrollStrip.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function SectionNav({ tabs, mobileCompact = false }) {
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const tabSpacingClass = mobileCompact ? 'px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm' : 'px-4 py-2.5 text-sm';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `w-full max-w-5xl mx-auto ${mobileCompact ? 'mb-4 sm:mb-6' : 'mb-6'}`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ScrollStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ScrollStrip"], {
            wrapperClassName: "border-b border-gray-700/20",
            className: "flex gap-1",
            ariaLabel: "Section navigation",
            children: tabs.map((tab)=>{
                const active = tab.match(pathname);
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    href: tab.href,
                    prefetch: false,
                    className: `shrink-0 ${tabSpacingClass} font-medium transition-colors border-b-2 ${active ? 'text-white border-goodgreen' : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'}`,
                    children: tab.label
                }, tab.href, false, {
                    fileName: "[project]/frontend/src/components/SectionNav.tsx",
                    lineNumber: 34,
                    columnNumber: 13
                }, this);
            })
        }, void 0, false, {
            fileName: "[project]/frontend/src/components/SectionNav.tsx",
            lineNumber: 26,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/SectionNav.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
_s(SectionNav, "xbyQPtUVMO7MNj7WjJlpdWqRcTo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = SectionNav;
var _c;
__turbopack_context__.k.register(_c, "SectionNav");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/app/(app)/stocks/StocksSectionNav.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StocksSectionNav",
    ()=>StocksSectionNav
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SectionNav$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/SectionNav.tsx [app-client] (ecmascript)");
'use client';
;
;
const TABS = [
    {
        label: 'Markets',
        href: '/stocks',
        prefetch: false,
        match: (p)=>p.startsWith('/stocks') && p !== '/stocks/portfolio'
    },
    {
        label: 'Portfolio',
        href: '/stocks/portfolio',
        prefetch: false,
        match: (p)=>p === '/stocks/portfolio'
    }
];
function StocksSectionNav() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SectionNav$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SectionNav"], {
        tabs: TABS,
        mobileCompact: true
    }, void 0, false, {
        fileName: "[project]/frontend/src/app/(app)/stocks/StocksSectionNav.tsx",
        lineNumber: 21,
        columnNumber: 10
    }, this);
}
_c = StocksSectionNav;
var _c;
__turbopack_context__.k.register(_c, "StocksSectionNav");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_src_0l5me0~._.js.map