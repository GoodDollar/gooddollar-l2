(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/components/StartSwappingCTA.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StartSwappingCTA",
    ()=>StartSwappingCTA
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
'use client';
;
function StartSwappingCTA({ swapCardRef } = {}) {
    const handleClick = ()=>{
        const card = swapCardRef?.current ?? document.getElementById('swap-card');
        if (!card) return;
        card.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        const input = card.querySelector('input[inputmode="decimal"]');
        input?.focus({
            preventScroll: true
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mt-10 mb-2 flex justify-center",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: handleClick,
            className: "group px-8 py-3 rounded-full bg-goodgreen text-dark font-semibold text-sm hover:bg-goodgreen/90 transition-colors shadow-lg shadow-goodgreen/20",
            children: [
                "Start Trading",
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "inline-block ml-1.5 transition-transform group-hover:translate-x-0.5",
                    children: "→"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/StartSwappingCTA.tsx",
                    lineNumber: 25,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/StartSwappingCTA.tsx",
            lineNumber: 20,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/StartSwappingCTA.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
_c = StartSwappingCTA;
var _c;
__turbopack_context__.k.register(_c, "StartSwappingCTA");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/StartSwappingCTA.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/frontend/src/components/StartSwappingCTA.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=frontend_src_components_StartSwappingCTA_tsx_10ll4ec._.js.map