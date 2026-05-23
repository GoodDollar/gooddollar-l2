module.exports = [
"[project]/frontend/src/components/ScrollStrip.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ScrollStrip",
    ()=>ScrollStrip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
;
function ScrollStrip({ children, className = '', wrapperClassName = '', fadeFromClass = 'from-[hsl(var(--background))]', fadeWidthClass = 'w-8', ariaLabel }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `relative ${wrapperClassName}`.trim(),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
}),
"[project]/frontend/src/components/SectionNav.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SectionNav",
    ()=>SectionNav
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ScrollStrip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ScrollStrip.tsx [app-ssr] (ecmascript)");
'use client';
;
;
;
;
function SectionNav({ tabs, mobileCompact = false }) {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const tabSpacingClass = mobileCompact ? 'px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm' : 'px-4 py-2.5 text-sm';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `w-full max-w-5xl mx-auto ${mobileCompact ? 'mb-4 sm:mb-6' : 'mb-6'}`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ScrollStrip$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ScrollStrip"], {
            wrapperClassName: "border-b border-gray-700/20",
            className: "flex gap-1",
            ariaLabel: "Section navigation",
            children: tabs.map((tab)=>{
                const active = tab.match(pathname);
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
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
}),
"[project]/frontend/src/app/(app)/stocks/StocksSectionNav.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StocksSectionNav",
    ()=>StocksSectionNav
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SectionNav$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/SectionNav.tsx [app-ssr] (ecmascript)");
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SectionNav$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SectionNav"], {
        tabs: TABS,
        mobileCompact: true
    }, void 0, false, {
        fileName: "[project]/frontend/src/app/(app)/stocks/StocksSectionNav.tsx",
        lineNumber: 21,
        columnNumber: 10
    }, this);
}
}),
];

//# sourceMappingURL=frontend_src_0poul-_._.js.map