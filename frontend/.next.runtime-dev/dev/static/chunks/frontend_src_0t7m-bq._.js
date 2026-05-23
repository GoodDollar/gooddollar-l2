(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/components/TokenSelector.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TOKENS",
    ()=>TOKENS,
    "TokenSelector",
    ()=>TokenSelector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TokenIcon$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/TokenIcon.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/tokens.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
const TokenSelectorModal = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["lazy"])(()=>__turbopack_context__.A("[project]/frontend/src/components/TokenSelectorModal.tsx [app-client] (ecmascript, async loader)"));
_c = TokenSelectorModal;
const TOKENS = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"];
function TokenSelector({ selected, onSelect, exclude }) {
    _s();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const handleOpen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TokenSelector.useCallback[handleOpen]": ()=>setOpen(true)
    }["TokenSelector.useCallback[handleOpen]"], []);
    const handleClose = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TokenSelector.useCallback[handleClose]": ()=>setOpen(false)
    }["TokenSelector.useCallback[handleClose]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: handleOpen,
                "aria-haspopup": "dialog",
                "aria-expanded": open,
                className: "flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-50 hover:bg-dark-50/80 border border-gray-700/50 transition-colors min-w-[120px] focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TokenIcon$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenIcon"], {
                        symbol: selected.symbol,
                        size: 20
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/TokenSelector.tsx",
                        lineNumber: 32,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-semibold text-white",
                        children: selected.symbol
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/TokenSelector.tsx",
                        lineNumber: 33,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-4 h-4 text-gray-400 ml-auto",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M19 9l-7 7-7-7"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/TokenSelector.tsx",
                            lineNumber: 35,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/TokenSelector.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/TokenSelector.tsx",
                lineNumber: 26,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
                fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "fixed inset-0 z-50"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/TokenSelector.tsx",
                    lineNumber: 40,
                    columnNumber: 29
                }, this),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TokenSelectorModal, {
                    open: open,
                    onClose: handleClose,
                    onSelect: onSelect,
                    selected: selected,
                    exclude: exclude
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/TokenSelector.tsx",
                    lineNumber: 41,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenSelector.tsx",
                lineNumber: 40,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true);
}
_s(TokenSelector, "h5GNM6NXQts9Glew/KUO7gp3pJA=");
_c1 = TokenSelector;
var _c, _c1;
__turbopack_context__.k.register(_c, "TokenSelectorModal");
__turbopack_context__.k.register(_c1, "TokenSelector");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/format.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compactAmount",
    ()=>compactAmount,
    "formatAmount",
    ()=>formatAmount,
    "formatTradeAmount",
    ()=>formatTradeAmount,
    "formatUsdValue",
    ()=>formatUsdValue,
    "sanitizeNumericInput",
    ()=>sanitizeNumericInput
]);
const ABBREVIATIONS = [
    [
        1e18,
        'Qi'
    ],
    [
        1e15,
        'Q'
    ],
    [
        1e12,
        'T'
    ],
    [
        1e9,
        'B'
    ],
    [
        1e6,
        'M'
    ]
];
function formatAmount(value, maxDecimals = 6) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num === 0) return '0';
    const abs = Math.abs(num);
    for (const [threshold, suffix] of ABBREVIATIONS){
        if (abs >= threshold) {
            const abbreviated = num / threshold;
            const fixed = abbreviated.toFixed(2).replace(/\.?0+$/, '');
            return `${fixed}${suffix}`;
        }
    }
    if (abs >= 1000) {
        const intPart = Math.floor(abs);
        const decPart = abs - intPart;
        const formatted = intPart.toLocaleString('en-US');
        if (decPart > 0.005) {
            const decimals = Math.min(maxDecimals, 2);
            const decStr = decPart.toFixed(decimals).slice(1).replace(/0+$/, '').replace(/\.$/, '');
            return (num < 0 ? '-' : '') + formatted + decStr;
        }
        return (num < 0 ? '-' : '') + formatted;
    }
    if (abs >= 1) {
        const decimals = Math.min(maxDecimals, 4);
        return trimTrailingZeros(num.toFixed(decimals));
    }
    const significantDecimals = Math.min(maxDecimals, 6);
    if (abs < Math.pow(10, -significantDecimals)) {
        return '< 0.000001';
    }
    return trimTrailingZeros(num.toFixed(significantDecimals));
}
function compactScientific(num) {
    // toExponential picks the smallest mantissa precision that still survives
    // JS's Number → string round-trip, then we trim trailing zeros so e.g.
    // 1e-12 → "1e-12" rather than "1.000000e-12".
    const raw = num.toExponential();
    const [mantissa, exponent] = raw.split('e');
    const cleanMantissa = mantissa.includes('.') ? mantissa.replace(/0+$/, '').replace(/\.$/, '') : mantissa;
    return `${cleanMantissa}e${exponent}`;
}
function trimTrailingZeros(s) {
    if (!s.includes('.')) return s;
    return s.replace(/0+$/, '').replace(/\.$/, '');
}
const COMPACT_THRESHOLDS = [
    [
        1e12,
        'T'
    ],
    [
        1e9,
        'B'
    ],
    [
        1e6,
        'M'
    ],
    [
        1e3,
        'K'
    ]
];
function compactAmount(value, maxChars) {
    if (value === 0 || isNaN(value)) return '0';
    const full = formatAmount(value);
    if (full.length <= maxChars) return full;
    for (const [threshold, suffix] of COMPACT_THRESHOLDS){
        if (Math.abs(value) >= threshold) {
            const abbreviated = value / threshold;
            const decimals = abbreviated >= 100 ? 0 : abbreviated >= 10 ? 1 : 2;
            let fixed = abbreviated.toFixed(decimals);
            if (fixed.includes('.')) fixed = fixed.replace(/0+$/, '').replace(/\.$/, '');
            return `${fixed}${suffix}`;
        }
    }
    return full;
}
const USD_COMPACT = [
    [
        1e12,
        'T'
    ],
    [
        1e9,
        'B'
    ],
    [
        1e6,
        'M'
    ]
];
function formatUsdValue(usd) {
    if (!usd || isNaN(usd)) return '';
    if (usd < 0.01) return '< $0.01';
    for (const [threshold, suffix] of USD_COMPACT){
        if (usd >= threshold) {
            const abbr = usd / threshold;
            const fixed = abbr >= 100 ? abbr.toFixed(0) : abbr >= 10 ? abbr.toFixed(1) : abbr.toFixed(2);
            const clean = fixed.includes('.') ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed;
            return `~$${clean}${suffix}`;
        }
    }
    if (usd >= 100_000) {
        const k = usd / 1000;
        const fixed = k >= 100 ? k.toFixed(0) : k.toFixed(1);
        const clean = fixed.includes('.') ? fixed.replace(/0+$/, '').replace(/\.$/, '') : fixed;
        return `~$${clean}K`;
    }
    if (usd >= 1000) {
        const intPart = Math.floor(usd);
        const decPart = usd - intPart;
        const formatted = intPart.toLocaleString('en-US');
        if (decPart >= 0.005) {
            return `~$${formatted}.${decPart.toFixed(2).slice(2)}`;
        }
        return `~$${formatted}`;
    }
    if (Number.isInteger(usd)) return `~$${usd}`;
    return `~$${usd.toFixed(2)}`;
}
function formatTradeAmount(n) {
    if (!isFinite(n) || isNaN(n)) return '$0.00';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs === 0) return '$0.00';
    if (abs < 0.01) return '< $0.01';
    if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}K`;
    return `${sign}$${abs.toFixed(2)}`;
}
function sanitizeNumericInput(value) {
    let sanitized = value.replace(/[^0-9.]/g, '');
    const dotIndex = sanitized.indexOf('.');
    if (dotIndex !== -1) {
        sanitized = sanitized.slice(0, dotIndex + 1) + sanitized.slice(dotIndex + 1).replace(/\./g, '');
    }
    if (dotIndex !== -1) {
        const intPart = sanitized.slice(0, dotIndex);
        const stripped = intPart.replace(/^0+/, '') || '0';
        sanitized = stripped + sanitized.slice(dotIndex);
    } else if (sanitized.length > 1) {
        sanitized = sanitized.replace(/^0+/, '') || '0';
    }
    if (sanitized.length > 20) {
        sanitized = sanitized.slice(0, 20);
    }
    return sanitized;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/UBIBreakdown.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UBIBreakdown",
    ()=>UBIBreakdown
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TokenIcon$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/TokenIcon.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/format.ts [app-client] (ecmascript)");
'use client';
;
;
;
function UBIBreakdown({ ubiFeeAmount, outputToken, visible }) {
    if (!visible || ubiFeeAmount <= 0) return null;
    const formatted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatAmount"])(ubiFeeAmount);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mx-4 mt-3 p-3 rounded-xl bg-goodgreen/5 border border-goodgreen/20",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-2",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-6 h-6 rounded-full bg-goodgreen/10 flex items-center justify-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TokenIcon$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenIcon"], {
                        symbol: "G$",
                        size: 16
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/UBIBreakdown.tsx",
                        lineNumber: 22,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/UBIBreakdown.tsx",
                    lineNumber: 21,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm font-medium text-goodgreen",
                            children: [
                                formatted,
                                " ",
                                outputToken.symbol,
                                " funds UBI"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/UBIBreakdown.tsx",
                            lineNumber: 25,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-goodgreen mt-0.5",
                            children: "33% of the swap fee goes directly to the GoodDollar UBI pool"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/UBIBreakdown.tsx",
                            lineNumber: 28,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/UBIBreakdown.tsx",
                    lineNumber: 24,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/UBIBreakdown.tsx",
            lineNumber: 20,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/UBIBreakdown.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
_c = UBIBreakdown;
var _c;
__turbopack_context__.k.register(_c, "UBIBreakdown");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/StalePriceBanner.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StalePriceBanner",
    ()=>StalePriceBanner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
'use client';
;
const MESSAGES = {
    swap: {
        icon: '⚠️',
        text: 'Live prices unavailable: showing cached rates. Swap at your own risk.'
    },
    stocks: {
        icon: '📡',
        text: 'Oracle offline: showing demo prices. Data may not reflect current market values.'
    }
};
function StalePriceBanner({ variant, className = '' }) {
    const { icon, text } = MESSAGES[variant];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `flex items-center gap-2 px-3 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs ${className}`,
        role: "alert",
        "data-testid": "stale-price-banner",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-sm shrink-0",
                children: icon
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/StalePriceBanner.tsx",
                lineNumber: 28,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: text
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/StalePriceBanner.tsx",
                lineNumber: 29,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/StalePriceBanner.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
_c = StalePriceBanner;
var _c;
__turbopack_context__.k.register(_c, "StalePriceBanner");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/useSwapSettings.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSwapSettings",
    ()=>useSwapSettings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
const STORAGE_KEY = 'goodswap-settings';
const HISTORY_KEY = 'goodswap-transaction-history';
const DEFAULTS = {
    slippage: 0.5,
    deadline: 30
};
function loadPreferences() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        // Load current settings
        const settingsRaw = localStorage.getItem(STORAGE_KEY);
        const settings = settingsRaw ? JSON.parse(settingsRaw) : DEFAULTS;
        // Load transaction history
        const historyRaw = localStorage.getItem(HISTORY_KEY);
        const history = historyRaw ? JSON.parse(historyRaw) : [];
        // Clean old history (keep last 30 days)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recentHistory = history.filter((record)=>record.timestamp > thirtyDaysAgo);
        return {
            settings: {
                slippage: typeof settings.slippage === 'number' ? settings.slippage : DEFAULTS.slippage,
                deadline: typeof settings.deadline === 'number' ? settings.deadline : DEFAULTS.deadline
            },
            history: recentHistory,
            suggestions: analyzeUserPreferences(recentHistory)
        };
    } catch  {
        return {
            settings: DEFAULTS,
            history: []
        };
    }
}
function analyzeUserPreferences(history) {
    if (history.length < 3) return {} // Need at least 3 transactions for patterns
    ;
    // Group by success rate for different slippage ranges
    const slippageGroups = {
        low: history.filter((r)=>r.settings.slippage <= 0.5),
        medium: history.filter((r)=>r.settings.slippage > 0.5 && r.settings.slippage <= 1.0),
        high: history.filter((r)=>r.settings.slippage > 1.0)
    };
    // Calculate success rates
    const successRates = Object.entries(slippageGroups).map(([range, records])=>({
            range,
            successRate: records.length > 0 ? records.filter((r)=>r.success).length / records.length : 0,
            count: records.length,
            avgSlippage: records.length > 0 ? records.reduce((sum, r)=>sum + r.settings.slippage, 0) / records.length : 0
        })).filter((group)=>group.count >= 2) // Only consider groups with at least 2 transactions
    ;
    if (successRates.length === 0) return {};
    // Find the range with best success rate
    const bestRange = successRates.reduce((best, current)=>current.successRate > best.successRate ? current : best);
    // Only suggest if there's a clear pattern (>80% success rate with reasonable sample size)
    if (bestRange.successRate >= 0.8 && bestRange.count >= 3) {
        return {
            recommendedSlippage: Math.round(bestRange.avgSlippage * 10) / 10,
            confidence: Math.min(0.95, bestRange.successRate * (bestRange.count / 10)) // Higher confidence with more data
        };
    }
    return {};
}
function clampSlippage(val) {
    return Math.max(0, Math.min(50, val));
}
function useSwapSettings() {
    _s();
    const [preferences, setPreferences] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "useSwapSettings.useState": ()=>loadPreferences()
    }["useSwapSettings.useState"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useSwapSettings.useEffect": ()=>{
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences.settings));
                if (preferences.history.length > 0) {
                    localStorage.setItem(HISTORY_KEY, JSON.stringify(preferences.history));
                }
            } catch  {}
        }
    }["useSwapSettings.useEffect"], [
        preferences
    ]);
    const setSlippage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSwapSettings.useCallback[setSlippage]": (val)=>{
            setPreferences({
                "useSwapSettings.useCallback[setSlippage]": (prev)=>({
                        ...prev,
                        settings: {
                            ...prev.settings,
                            slippage: clampSlippage(val)
                        }
                    })
            }["useSwapSettings.useCallback[setSlippage]"]);
        }
    }["useSwapSettings.useCallback[setSlippage]"], []);
    const setDeadline = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSwapSettings.useCallback[setDeadline]": (val)=>{
            setPreferences({
                "useSwapSettings.useCallback[setDeadline]": (prev)=>({
                        ...prev,
                        settings: {
                            ...prev.settings,
                            deadline: Math.max(1, Math.min(180, val))
                        }
                    })
            }["useSwapSettings.useCallback[setDeadline]"]);
        }
    }["useSwapSettings.useCallback[setDeadline]"], []);
    const recordTransaction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSwapSettings.useCallback[recordTransaction]": (success, tokenPair, amount)=>{
            const record = {
                settings: {
                    ...preferences.settings
                },
                success,
                timestamp: Date.now(),
                tokenPair,
                amount
            };
            setPreferences({
                "useSwapSettings.useCallback[recordTransaction]": (prev)=>{
                    const newHistory = [
                        ...prev.history,
                        record
                    ];
                    return {
                        ...prev,
                        history: newHistory,
                        suggestions: analyzeUserPreferences(newHistory)
                    };
                }
            }["useSwapSettings.useCallback[recordTransaction]"]);
        }
    }["useSwapSettings.useCallback[recordTransaction]"], [
        preferences.settings
    ]);
    const applySuggestion = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSwapSettings.useCallback[applySuggestion]": ()=>{
            if (preferences.suggestions?.recommendedSlippage) {
                setSlippage(preferences.suggestions.recommendedSlippage);
            }
        }
    }["useSwapSettings.useCallback[applySuggestion]"], [
        preferences.suggestions?.recommendedSlippage,
        setSlippage
    ]);
    const getSuggestionText = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSwapSettings.useCallback[getSuggestionText]": ()=>{
            const { suggestions } = preferences;
            if (!suggestions?.recommendedSlippage || !suggestions.confidence) return null;
            const currentSlippage = preferences.settings.slippage;
            const recommended = suggestions.recommendedSlippage;
            const confidence = Math.round(suggestions.confidence * 100);
            if (Math.abs(currentSlippage - recommended) < 0.1) return null // Already using optimal setting
            ;
            if (recommended < currentSlippage) {
                return `Try ${recommended}% slippage for better success rate (${confidence}% confidence)`;
            } else {
                return `Consider ${recommended}% slippage for fewer failed trades (${confidence}% confidence)`;
            }
        }
    }["useSwapSettings.useCallback[getSuggestionText]"], [
        preferences
    ]);
    return {
        slippage: preferences.settings.slippage,
        deadline: preferences.settings.deadline,
        setSlippage,
        setDeadline,
        recordTransaction,
        applySuggestion,
        suggestion: getSuggestionText(),
        hasLearning: preferences.history.length >= 3
    };
}
_s(useSwapSettings, "dJcv2mAQJHUHCbrPMWP3H3+EYT8=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/SwapSettings.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SwapSettings",
    ()=>SwapSettings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useSwapSettings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useSwapSettings.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/format.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
const PRESETS = [
    0.1,
    0.5,
    1.0
];
function SwapSettings() {
    _s();
    const { slippage, deadline, setSlippage, setDeadline, suggestion, applySuggestion, hasLearning } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useSwapSettings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSwapSettings"])();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [customSlippage, setCustomSlippage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [showMaxWarning, setShowMaxWarning] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const panelRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SwapSettings.useEffect": ()=>{
            function handleClick(e) {
                if (panelRef.current && !panelRef.current.contains(e.target)) {
                    setOpen(false);
                }
            }
            if (open) document.addEventListener('mousedown', handleClick);
            return ({
                "SwapSettings.useEffect": ()=>document.removeEventListener('mousedown', handleClick)
            })["SwapSettings.useEffect"];
        }
    }["SwapSettings.useEffect"], [
        open
    ]);
    const isPreset = PRESETS.includes(slippage);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative",
        ref: panelRef,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setOpen((o)=>!o),
                "aria-label": "Settings",
                className: "p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-50 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    className: "w-5 h-5",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 1.5,
                            d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                            lineNumber: 44,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 1.5,
                            d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                            lineNumber: 45,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                    lineNumber: 43,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                lineNumber: 38,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute right-0 top-full mt-2 w-80 bg-dark-100 border border-gray-700/50 rounded-xl shadow-2xl z-50 p-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-sm font-semibold text-white mb-3",
                        children: "Transaction Settings"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                        lineNumber: 51,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "slippage-custom",
                                className: "text-xs text-gray-400 mb-2 block",
                                children: "Slippage Tolerance"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                lineNumber: 54,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-2",
                                children: [
                                    PRESETS.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                setSlippage(p);
                                                setCustomSlippage('');
                                            },
                                            className: `flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none ${slippage === p && isPreset ? 'bg-goodgreen/10 text-goodgreen border border-goodgreen/40' : 'bg-dark-50 text-gray-300 border border-gray-700/50 hover:border-gray-600'}`,
                                            children: [
                                                p,
                                                "%"
                                            ]
                                        }, p, true, {
                                            fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                            lineNumber: 57,
                                            columnNumber: 17
                                        }, this)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative flex-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                id: "slippage-custom",
                                                type: "text",
                                                inputMode: "decimal",
                                                placeholder: "Custom",
                                                "aria-label": "Custom slippage tolerance percentage",
                                                value: customSlippage,
                                                onChange: (e)=>{
                                                    const val = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumericInput"])(e.target.value);
                                                    const num = parseFloat(val);
                                                    if (!isNaN(num) && num > 50) {
                                                        setCustomSlippage('50');
                                                        setShowMaxWarning(true);
                                                        setSlippage(50);
                                                    } else {
                                                        setCustomSlippage(val);
                                                        setShowMaxWarning(false);
                                                        if (!isNaN(num) && num > 0) setSlippage(num);
                                                    }
                                                },
                                                onBlur: ()=>{
                                                    const num = parseFloat(customSlippage);
                                                    if (!isNaN(num) && num > 50) {
                                                        setCustomSlippage('50');
                                                        setShowMaxWarning(true);
                                                    } else if (!isNaN(num) && num > 0) {
                                                        setShowMaxWarning(false);
                                                    }
                                                },
                                                className: `w-full py-1.5 px-2 rounded-lg text-sm text-right bg-dark-50 border outline-none transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 ${!isPreset && slippage > 0 ? 'border-goodgreen/40 text-goodgreen' : 'border-gray-700/50 text-gray-300'}`
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                                lineNumber: 70,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500",
                                                children: "%"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                                lineNumber: 105,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                        lineNumber: 69,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                lineNumber: 55,
                                columnNumber: 13
                            }, this),
                            suggestion && !showMaxWarning && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-blue-300 flex-1",
                                            children: suggestion
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                            lineNumber: 113,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: applySuggestion,
                                            className: "ml-2 px-2 py-1 text-xs text-blue-300 hover:text-white border border-blue-500/30 rounded hover:bg-blue-500/20 transition-colors focus-visible:ring-1 focus-visible:ring-blue-500/50 focus-visible:outline-none",
                                            children: "Apply"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                            lineNumber: 114,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                    lineNumber: 112,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                lineNumber: 111,
                                columnNumber: 15
                            }, this),
                            showMaxWarning && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-orange-400 mt-1.5",
                                children: "Maximum slippage is 50%"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                lineNumber: 125,
                                columnNumber: 15
                            }, this),
                            !showMaxWarning && !suggestion && slippage > 5 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-yellow-400 mt-1.5",
                                children: "High slippage increases risk of front-running"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                lineNumber: 128,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                        lineNumber: 53,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                htmlFor: "deadline-minutes",
                                className: "text-xs text-gray-400 mb-2 block",
                                children: "Transaction Deadline"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                lineNumber: 133,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        id: "deadline-minutes",
                                        type: "text",
                                        inputMode: "numeric",
                                        placeholder: "1–180",
                                        "aria-label": "Transaction deadline in minutes",
                                        value: deadline,
                                        onChange: (e)=>{
                                            const raw = e.target.value.replace(/[^0-9]/g, '');
                                            if (!raw) return;
                                            const num = parseInt(raw, 10);
                                            if (!isNaN(num)) setDeadline(num);
                                        },
                                        className: "w-16 py-1.5 px-2 rounded-lg text-sm text-center bg-dark-50 border border-gray-700/50 text-white outline-none focus:border-goodgreen/40 focus-visible:ring-2 focus-visible:ring-goodgreen/50 transition-colors"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                        lineNumber: 135,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-gray-400",
                                        children: "minutes"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                        lineNumber: 150,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                lineNumber: 134,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-600 mt-1",
                                children: "Min 1, max 180 minutes"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                                lineNumber: 152,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                        lineNumber: 132,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/SwapSettings.tsx",
                lineNumber: 50,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/SwapSettings.tsx",
        lineNumber: 37,
        columnNumber: 5
    }, this);
}
_s(SwapSettings, "k8FzoyZMemiZ37lCaDavLHrGCpQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useSwapSettings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSwapSettings"]
    ];
});
_c = SwapSettings;
var _c;
__turbopack_context__.k.register(_c, "SwapSettings");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/SwapDetails.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SwapDetails",
    ()=>SwapDetails
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
function getPriceImpactColor(impact) {
    if (impact < 1) return 'text-goodgreen';
    if (impact < 5) return 'text-yellow-400';
    return 'text-red-400';
}
function SwapDetails({ priceImpact, minimumReceived, outputSymbol, networkFee, visible }) {
    _s();
    const [expanded, setExpanded] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    if (!visible) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mx-4 mt-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setExpanded((e)=>!e),
                className: "w-full flex items-center justify-between py-2 px-1 text-xs text-gray-400 hover:text-gray-300 transition-colors rounded-lg focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Swap Details"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapDetails.tsx",
                        lineNumber: 30,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: `w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`,
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M19 9l-7 7-7-7"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapDetails.tsx",
                            lineNumber: 37,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapDetails.tsx",
                        lineNumber: 31,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/SwapDetails.tsx",
                lineNumber: 26,
                columnNumber: 7
            }, this),
            expanded && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-2 pb-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between text-xs",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-400",
                                children: "Price Impact"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapDetails.tsx",
                                lineNumber: 44,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "data-testid": "price-impact",
                                className: `font-medium ${getPriceImpactColor(priceImpact)}`,
                                children: [
                                    priceImpact.toFixed(2),
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/SwapDetails.tsx",
                                lineNumber: 45,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/SwapDetails.tsx",
                        lineNumber: 43,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between text-xs",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-400",
                                children: "Minimum Received"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapDetails.tsx",
                                lineNumber: 53,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-white",
                                children: [
                                    minimumReceived,
                                    " ",
                                    outputSymbol
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/SwapDetails.tsx",
                                lineNumber: 54,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/SwapDetails.tsx",
                        lineNumber: 52,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between text-xs",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-400",
                                children: "Network Fee"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapDetails.tsx",
                                lineNumber: 57,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-white",
                                children: networkFee
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapDetails.tsx",
                                lineNumber: 58,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/SwapDetails.tsx",
                        lineNumber: 56,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/SwapDetails.tsx",
                lineNumber: 42,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/SwapDetails.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
_s(SwapDetails, "NZEs4N34I2vU569ODzuIjdsqMlo=");
_c = SwapDetails;
var _c;
__turbopack_context__.k.register(_c, "SwapDetails");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/SwapRoute.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SwapRoute",
    ()=>SwapRoute
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
'use client';
;
function SwapRoute({ inputToken, outputToken }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mx-4 mb-2 px-4 py-2.5 rounded-xl bg-dark/50 border border-gray-700/15",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-1.5 text-xs text-gray-400 mb-1.5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-3.5 h-3.5",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M13 7l5 5m0 0l-5 5m5-5H6"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapRoute.tsx",
                            lineNumber: 10,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapRoute.tsx",
                        lineNumber: 9,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "Route"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapRoute.tsx",
                        lineNumber: 12,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/SwapRoute.tsx",
                lineNumber: 8,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2 flex-wrap",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-dark-100 border border-gray-700/20 text-xs font-medium text-white",
                        children: [
                            inputToken.icon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-sm",
                                children: inputToken.icon
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapRoute.tsx",
                                lineNumber: 16,
                                columnNumber: 31
                            }, this),
                            inputToken.symbol
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/SwapRoute.tsx",
                        lineNumber: 15,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-4 h-4 text-gray-500 shrink-0",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M9 5l7 7-7 7"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapRoute.tsx",
                            lineNumber: 21,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapRoute.tsx",
                        lineNumber: 20,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-goodgreen/10 border border-goodgreen/20 text-xs font-medium text-goodgreen",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "w-3.5 h-3.5 rounded-full bg-goodgreen/10 flex items-center justify-center text-[8px]",
                                children: "G"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapRoute.tsx",
                                lineNumber: 25,
                                columnNumber: 11
                            }, this),
                            "GoodSwap Pool"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/SwapRoute.tsx",
                        lineNumber: 24,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-4 h-4 text-gray-500 shrink-0",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M9 5l7 7-7 7"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapRoute.tsx",
                            lineNumber: 30,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapRoute.tsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-dark-100 border border-gray-700/20 text-xs font-medium text-white",
                        children: [
                            outputToken.icon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-sm",
                                children: outputToken.icon
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapRoute.tsx",
                                lineNumber: 34,
                                columnNumber: 32
                            }, this),
                            outputToken.symbol
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/SwapRoute.tsx",
                        lineNumber: 33,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/SwapRoute.tsx",
                lineNumber: 14,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/SwapRoute.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
_c = SwapRoute;
var _c;
__turbopack_context__.k.register(_c, "SwapRoute");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/useOnChainSwap.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MAX_SWAP_DEADLINE_SECS",
    ()=>MAX_SWAP_DEADLINE_SECS,
    "MIN_SWAP_DEADLINE_SECS",
    ()=>MIN_SWAP_DEADLINE_SECS,
    "computePriceImpactBps",
    ()=>computePriceImpactBps,
    "computePriceImpactPct",
    ()=>computePriceImpactPct,
    "computeSwapDeadline",
    ()=>computeSwapDeadline,
    "getPriceImpactSeverity",
    ()=>getPriceImpactSeverity,
    "getSwapTokenAddr",
    ()=>getSwapTokenAddr,
    "isSwapSupported",
    ()=>isSwapSupported,
    "useSwapExecute",
    ()=>useSwapExecute,
    "useSwapQuote",
    ()=>useSwapQuote
]);
/**
 * useOnChainSwap — wagmi hooks for GoodSwapRouter on-chain interactions.
 *
 * GoodSwapRouter (chain 42069) supports three devnet token pairs:
 *   G$/WETH, G$/USDC, WETH/USDC
 *
 * Addresses from CONTRACTS (devnet.ts):
 *   SwapGD, SwapWETH, SwapUSDC, GoodSwapRouter
 *
 * useSwapQuote: live getAmountOut read — replaces mock price feed for supported pairs.
 * useSwapExecute: approve + swapExactTokensForTokens write flow.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useReadContract.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useWriteContract.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/wagmi/dist/esm/hooks/useAccount.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$parseUnits$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/utils/unit/parseUnits.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatUnits$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/utils/unit/formatUnits.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/abi.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chain$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/chain.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/frontend/src/lib/devnet.ts [app-client] (ecmascript) <locals>");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
const ROUTER = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].GoodSwapRouter;
/** Supported devnet tokens: symbol → (address, decimals) */ const SWAP_TOKENS = {
    'G$': {
        address: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].SwapGD,
        decimals: 18
    },
    'WETH': {
        address: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].SwapWETH,
        decimals: 18
    },
    'ETH': {
        address: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].SwapWETH,
        decimals: 18
    },
    'USDC': {
        address: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$devnet$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["CONTRACTS"].SwapUSDC,
        decimals: 6
    }
};
function getSwapTokenAddr(symbol) {
    return SWAP_TOKENS[symbol]?.address;
}
function isSwapSupported(symbol) {
    return symbol in SWAP_TOKENS;
}
const MIN_SWAP_DEADLINE_SECS = 60;
const MAX_SWAP_DEADLINE_SECS = 3 * 60 * 60;
/** Fallback minutes used when no valid value is provided. */ const DEFAULT_SWAP_DEADLINE_MINUTES = 30;
function computeSwapDeadline(deadlineMinutes, nowSecs) {
    const now = typeof nowSecs === 'number' ? nowSecs : Math.floor(Date.now() / 1000);
    const minutes = Number.isFinite(deadlineMinutes) ? deadlineMinutes : DEFAULT_SWAP_DEADLINE_MINUTES;
    const requested = Math.floor(minutes * 60);
    const clamped = Math.min(MAX_SWAP_DEADLINE_SECS, Math.max(MIN_SWAP_DEADLINE_SECS, requested));
    return BigInt(now + clamped);
}
// ─── Price impact (real, reserve-based) ──────────────────────────────────────
//
// Previous behaviour was a synthetic ladder driven by raw input *amount* (not
// liquidity), so a 100 G$ swap would show 1.8% impact even when the pool was
// deep enough to absorb 1M with negligible slippage, and a 1M USDC swap on a
// shallow pool would show ~15% even when it was effectively draining the LP.
// This silently lulled users into approving sandwich-attack-shaped trades and
// is the second half of the iteration #24 deep-dive Swap finding.
//
// Real impact is the gap between the marginal "spot" rate (the rate you'd get
// for an infinitesimal trade) and the executed rate for the user's actual
// trade. We approximate the spot rate by quoting a tiny reference amount from
// the same on-chain `getAmountOut`, which already accounts for fees and the
// constant-product curve. That keeps the math source-of-truth as the router
// itself — no need to mirror its formula in the frontend.
const PRICE_IMPACT_BPS_CAP = 10_000n;
function computePriceImpactBps(refIn, refOut, actualIn, actualOut) {
    if (refIn <= 0n || refOut < 0n) return 0;
    if (actualIn <= 0n) return 0;
    if (actualOut <= 0n) return Number(PRICE_IMPACT_BPS_CAP);
    // refRate - actualRate, scaled by refIn * actualIn:
    //   refRate    = refOut   / refIn
    //   actualRate = actualOut / actualIn
    // (refRate - actualRate) / refRate
    //   = 1 - (actualRate / refRate)
    //   = 1 - (actualOut * refIn) / (actualIn * refOut)
    // bps = 10_000 - (actualOut * refIn * 10_000) / (actualIn * refOut)
    if (refOut === 0n) return Number(PRICE_IMPACT_BPS_CAP);
    const numerator = actualOut * refIn * PRICE_IMPACT_BPS_CAP;
    const denominator = actualIn * refOut;
    if (denominator === 0n) return 0;
    const ratioBps = numerator / denominator;
    if (ratioBps >= PRICE_IMPACT_BPS_CAP) return 0 // executed rate ≥ spot — clamp to 0
    ;
    const impact = PRICE_IMPACT_BPS_CAP - ratioBps;
    // Clamp to [0, 10_000]; impact is already non-negative here but be defensive.
    if (impact <= 0n) return 0;
    if (impact >= PRICE_IMPACT_BPS_CAP) return Number(PRICE_IMPACT_BPS_CAP);
    return Number(impact);
}
function computePriceImpactPct(refIn, refOut, actualIn, actualOut) {
    const bps = computePriceImpactBps(refIn, refOut, actualIn, actualOut);
    return bps / 100;
}
function getPriceImpactSeverity(pct) {
    if (!Number.isFinite(pct) || pct < 1) return 'normal';
    if (pct < 3) return 'notice';
    if (pct < 5) return 'warning';
    if (pct < 15) return 'high';
    return 'extreme';
}
function useSwapQuote(amountIn, tokenInSymbol, tokenOutSymbol) {
    _s();
    const tokenIn = SWAP_TOKENS[tokenInSymbol];
    const tokenOut = SWAP_TOKENS[tokenOutSymbol];
    const isSupported = !!(tokenIn && tokenOut && tokenInSymbol !== tokenOutSymbol);
    const amountInWei = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useSwapQuote.useMemo[amountInWei]": ()=>{
            if (!isSupported || !amountIn) return BigInt(0);
            try {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$parseUnits$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseUnits"])(amountIn, tokenIn.decimals);
            } catch  {
                return BigInt(0);
            }
        }
    }["useSwapQuote.useMemo[amountInWei]"], [
        amountIn,
        tokenIn,
        isSupported
    ]);
    const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: ROUTER,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GoodSwapRouterABI"],
        functionName: 'getAmountOut',
        args: isSupported && amountInWei > BigInt(0) ? [
            amountInWei,
            tokenIn.address,
            tokenOut.address
        ] : undefined,
        query: {
            enabled: isSupported && amountInWei > BigInt(0),
            refetchInterval: 5_000
        }
    });
    // Reference (tiny) quote — approximates the marginal "spot" rate by asking the
    // router what the user would get for the smallest meaningful unit. We need at
    // least 1 unit at the token's decimals so the router's fee math doesn't round
    // the result to zero on micro inputs.
    const refAmountInWei = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useSwapQuote.useMemo[refAmountInWei]": ()=>{
            if (!isSupported || !tokenIn) return BigInt(0);
            return BigInt(10) ** BigInt(tokenIn.decimals) // 1 token (e.g. 1e18 wei)
            ;
        }
    }["useSwapQuote.useMemo[refAmountInWei]"], [
        isSupported,
        tokenIn
    ]);
    const refResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"])({
        address: ROUTER,
        abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GoodSwapRouterABI"],
        functionName: 'getAmountOut',
        args: isSupported && refAmountInWei > BigInt(0) ? [
            refAmountInWei,
            tokenIn.address,
            tokenOut.address
        ] : undefined,
        query: {
            enabled: isSupported && amountInWei > BigInt(0),
            refetchInterval: 5_000
        }
    });
    const amountOutFormatted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useSwapQuote.useMemo[amountOutFormatted]": ()=>{
            if (!result.data || !tokenOut) return '';
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$formatUnits$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatUnits"])(result.data, tokenOut.decimals);
        }
    }["useSwapQuote.useMemo[amountOutFormatted]"], [
        result.data,
        tokenOut
    ]);
    const priceImpactPct = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useSwapQuote.useMemo[priceImpactPct]": ()=>{
            if (!result.data || !refResult.data || refAmountInWei === BigInt(0) || amountInWei === BigInt(0)) return 0;
            return computePriceImpactPct(refAmountInWei, refResult.data, amountInWei, result.data);
        }
    }["useSwapQuote.useMemo[priceImpactPct]"], [
        result.data,
        refResult.data,
        refAmountInWei,
        amountInWei
    ]);
    const priceImpactSeverity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "useSwapQuote.useMemo[priceImpactSeverity]": ()=>getPriceImpactSeverity(priceImpactPct)
    }["useSwapQuote.useMemo[priceImpactSeverity]"], [
        priceImpactPct
    ]);
    return {
        amountOut: result.data,
        amountOutFormatted,
        isLoading: result.isLoading,
        isSupported,
        priceImpactPct,
        priceImpactSeverity
    };
}
_s(useSwapQuote, "K3YP9e1g5Ami4m2Emw5MJWjs1mc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useReadContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReadContract"]
    ];
});
function useSwapExecute() {
    _s1();
    const [phase, setPhase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const { writeContractAsync } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWriteContract"])();
    const { address, isConnected } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"])();
    const reset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSwapExecute.useCallback[reset]": ()=>{
            setPhase('idle');
            setError(null);
        }
    }["useSwapExecute.useCallback[reset]"], []);
    const swap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSwapExecute.useCallback[swap]": async (tokenInSymbol, tokenOutSymbol, amountIn, amountOutMin, deadlineMinutes = DEFAULT_SWAP_DEADLINE_MINUTES)=>{
            if (!isConnected || !address) {
                setError('Wallet not connected');
                return;
            }
            if (!ROUTER) {
                setError('GoodSwapRouter not deployed');
                return;
            }
            const tokenIn = SWAP_TOKENS[tokenInSymbol];
            const tokenOut = SWAP_TOKENS[tokenOutSymbol];
            if (!tokenIn || !tokenOut) {
                setError('Token pair not supported on devnet');
                return;
            }
            let amountInWei;
            try {
                amountInWei = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$utils$2f$unit$2f$parseUnits$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseUnits"])(amountIn, tokenIn.decimals);
            } catch  {
                setError('Invalid amount');
                return;
            }
            // Deadline is plumbed from useSwapSettings (user setting, default 30m, clamped 1m..3h)
            // to honour user-configured MEV protection rather than hardcoding 20m.
            const deadline = computeSwapDeadline(deadlineMinutes);
            try {
                setPhase('approving');
                await writeContractAsync({
                    address: tokenIn.address,
                    abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ERC20ABI"],
                    functionName: 'approve',
                    args: [
                        ROUTER,
                        amountInWei
                    ]
                });
                setPhase('swapping');
                await writeContractAsync({
                    address: ROUTER,
                    abi: __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$abi$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["GoodSwapRouterABI"],
                    functionName: 'swapExactTokensForTokens',
                    args: [
                        amountInWei,
                        amountOutMin,
                        [
                            tokenIn.address,
                            tokenOut.address
                        ],
                        address,
                        deadline
                    ]
                });
                setPhase('done');
            } catch (err) {
                const e = err;
                setError(e?.shortMessage ?? e?.message ?? 'Swap failed');
                setPhase('error');
            }
        }
    }["useSwapExecute.useCallback[swap]"], [
        isConnected,
        address,
        writeContractAsync
    ]);
    return {
        swap,
        phase,
        error,
        reset,
        isConnected,
        isDeployed: !!ROUTER
    };
}
_s1(useSwapExecute, "ReO5BhbfOhdUIFtO4Ci2yUVPZiA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useWriteContract$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWriteContract"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$wagmi$2f$dist$2f$esm$2f$hooks$2f$useAccount$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAccount"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/PriceImpactWarning.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PriceImpactWarning",
    ()=>PriceImpactWarning
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainSwap$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useOnChainSwap.ts [app-client] (ecmascript)");
'use client';
;
;
function PriceImpactWarning({ priceImpact, visible = true }) {
    if (!visible) return null;
    const severity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainSwap$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPriceImpactSeverity"])(priceImpact);
    if (severity === 'normal' || severity === 'notice') return null;
    const isRed = severity === 'high' || severity === 'extreme';
    const isExtreme = severity === 'extreme';
    const headline = isExtreme ? `Extreme Price Impact — ${priceImpact.toFixed(2)}%` : isRed ? `High Price Impact — ${priceImpact.toFixed(2)}%` : `Price Impact Warning — ${priceImpact.toFixed(2)}%`;
    const body = isExtreme ? 'This trade will move the pool significantly. Consider splitting it into smaller swaps to avoid sandwich attacks.' : 'You may receive significantly less than expected due to limited pool liquidity.';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-testid": "price-impact-warning",
        "data-severity": severity,
        className: `mx-4 mt-2 p-3 rounded-xl flex items-start gap-2.5 text-sm ${isRed ? 'bg-red-500/10 border border-red-500/30' : 'bg-yellow-500/10 border border-yellow-500/30'}`,
        role: isRed ? 'alert' : undefined,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                className: `w-5 h-5 flex-shrink-0 mt-0.5 ${isRed ? 'text-red-400' : 'text-yellow-400'}`,
                fill: "none",
                stroke: "currentColor",
                viewBox: "0 0 24 24",
                "aria-hidden": "true",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/PriceImpactWarning.tsx",
                    lineNumber: 47,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PriceImpactWarning.tsx",
                lineNumber: 46,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: `font-medium ${isRed ? 'text-red-400' : 'text-yellow-400'}`,
                        children: headline
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PriceImpactWarning.tsx",
                        lineNumber: 50,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: `text-xs mt-0.5 ${isRed ? 'text-red-300' : 'text-yellow-400/70'}`,
                        children: body
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/PriceImpactWarning.tsx",
                        lineNumber: 53,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/PriceImpactWarning.tsx",
                lineNumber: 49,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/PriceImpactWarning.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
_c = PriceImpactWarning;
var _c;
__turbopack_context__.k.register(_c, "PriceImpactWarning");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/FeeBreakdownBadge.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FeeBreakdownBadge",
    ()=>FeeBreakdownBadge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
const feeRows = [
    {
        label: 'UBI Pool',
        pct: '33%',
        color: 'text-goodgreen'
    },
    {
        label: 'Protocol',
        pct: '17%',
        color: 'text-gray-300'
    },
    {
        label: 'Liquidity Providers',
        pct: '50%',
        color: 'text-gray-300'
    }
];
function FeeBreakdownBadge() {
    _s();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FeeBreakdownBadge.useEffect": ()=>{
            if (!open) return;
            function handleEscape(e) {
                if (e.key === 'Escape') setOpen(false);
            }
            function handleClickOutside(e) {
                if (ref.current && !ref.current.contains(e.target)) {
                    setOpen(false);
                }
            }
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('mousedown', handleClickOutside);
            return ({
                "FeeBreakdownBadge.useEffect": ()=>{
                    document.removeEventListener('keydown', handleEscape);
                    document.removeEventListener('mousedown', handleClickOutside);
                }
            })["FeeBreakdownBadge.useEffect"];
        }
    }["FeeBreakdownBadge.useEffect"], [
        open
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: "relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: ()=>setOpen((o)=>!o),
                className: "flex items-center gap-1.5 text-xs bg-goodgreen/10 text-goodgreen px-2.5 py-1 rounded-lg hover:bg-goodgreen/10 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none",
                "aria-expanded": open,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-3 h-3",
                        fill: "currentColor",
                        viewBox: "0 0 20 20",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            fillRule: "evenodd",
                            d: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z",
                            clipRule: "evenodd"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/FeeBreakdownBadge.tsx",
                            lineNumber: 43,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/FeeBreakdownBadge.tsx",
                        lineNumber: 42,
                        columnNumber: 9
                    }, this),
                    "0.1% funds UBI"
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/FeeBreakdownBadge.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute right-0 top-full mt-2 w-56 p-3 rounded-xl bg-dark-50 border border-gray-700/50 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[10px] text-gray-400 uppercase tracking-wider mb-2",
                        children: "0.3% total fee split"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/FeeBreakdownBadge.tsx",
                        lineNumber: 50,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-2",
                        children: feeRows.map((row)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-gray-300",
                                        children: row.label
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/FeeBreakdownBadge.tsx",
                                        lineNumber: 56,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `text-xs font-semibold ${row.color}`,
                                        children: row.pct
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/FeeBreakdownBadge.tsx",
                                        lineNumber: 57,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, row.label, true, {
                                fileName: "[project]/frontend/src/components/FeeBreakdownBadge.tsx",
                                lineNumber: 55,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/FeeBreakdownBadge.tsx",
                        lineNumber: 53,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-2.5 pt-2 border-t border-gray-700/30",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-[10px] text-gray-500 leading-relaxed",
                            children: "Every swap automatically funds universal basic income for verified humans worldwide."
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/FeeBreakdownBadge.tsx",
                            lineNumber: 62,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/FeeBreakdownBadge.tsx",
                        lineNumber: 61,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/FeeBreakdownBadge.tsx",
                lineNumber: 49,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/FeeBreakdownBadge.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
_s(FeeBreakdownBadge, "wl9VvfhnMVWQ+kCekFjcRPEi3/0=");
_c = FeeBreakdownBadge;
var _c;
__turbopack_context__.k.register(_c, "FeeBreakdownBadge");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/SwapConfirmModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SwapConfirmModal",
    ()=>SwapConfirmModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TokenIcon$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/TokenIcon.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainSwap$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useOnChainSwap.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
// Tiered colours that match getPriceImpactSeverity:
//   normal  (<1%)   green
//   notice  (1–3%)  green-ish
//   warning (3–5%)  yellow
//   high    (5–15%) orange/red
//   extreme (≥15%)  red
function getPriceImpactColor(impact) {
    const sev = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainSwap$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPriceImpactSeverity"])(impact);
    if (sev === 'normal' || sev === 'notice') return 'text-goodgreen';
    if (sev === 'warning') return 'text-yellow-400';
    return 'text-red-400';
}
function SwapConfirmModal({ open, onClose, onConfirm, inputAmount, outputAmount, inputSymbol, outputSymbol, inputUsd, outputUsd, exchangeRate, priceImpact, minimumReceived, networkFee, ubiFee, deadlineMinutes = 30 }) {
    _s();
    const dialogRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Extreme-impact gate: at >=15% the user MUST tick "I understand"
    // before the Confirm button enables. We reset the ack every time the
    // modal closes so re-opening always re-arms the safety check.
    const severity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainSwap$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPriceImpactSeverity"])(priceImpact);
    const isExtreme = severity === 'extreme';
    const [acknowledged, setAcknowledged] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SwapConfirmModal.useEffect": ()=>{
            if (!open) setAcknowledged(false);
        }
    }["SwapConfirmModal.useEffect"], [
        open
    ]);
    const confirmDisabled = isExtreme && !acknowledged;
    const handleKeyDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SwapConfirmModal.useCallback[handleKeyDown]": (e)=>{
            if (e.key === 'Escape') onClose();
        }
    }["SwapConfirmModal.useCallback[handleKeyDown]"], [
        onClose
    ]);
    const handleConfirm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SwapConfirmModal.useCallback[handleConfirm]": ()=>{
            if (confirmDisabled) return;
            onConfirm();
        }
    }["SwapConfirmModal.useCallback[handleConfirm]"], [
        confirmDisabled,
        onConfirm
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SwapConfirmModal.useEffect": ()=>{
            if (open && dialogRef.current) {
                dialogRef.current.focus();
            }
        }
    }["SwapConfirmModal.useEffect"], [
        open
    ]);
    if (!open) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-testid": "modal-backdrop",
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm",
        onMouseDown: (e)=>{
            if (e.target === e.currentTarget) onClose();
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: dialogRef,
            role: "dialog",
            "aria-modal": "true",
            "aria-label": "Review Swap",
            tabIndex: -1,
            onKeyDown: handleKeyDown,
            className: "w-full max-w-[420px] mx-4 bg-dark-100 border border-gray-700/40 rounded-2xl shadow-2xl outline-none animate-in zoom-in-95 duration-150",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between px-5 pt-5 pb-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-lg font-semibold text-white",
                            children: "Review Swap"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                            lineNumber: 106,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            "aria-label": "Close",
                            className: "p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-50 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-5 h-5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M6 18L18 6M6 6l12 12"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 113,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                lineNumber: 112,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                            lineNumber: 107,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                    lineNumber: 105,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-5 space-y-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "p-3 rounded-xl bg-dark/80 border border-gray-700/20",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-gray-400 mb-1",
                                    children: "You pay"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 122,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xl font-semibold text-white",
                                                    children: inputAmount
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                                    lineNumber: 125,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-500",
                                                    children: inputUsd
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                                    lineNumber: 126,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                            lineNumber: 124,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TokenIcon$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenIcon"], {
                                                    symbol: inputSymbol,
                                                    size: 24
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                                    lineNumber: 129,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-semibold text-white",
                                                    children: inputSymbol
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                                    lineNumber: 130,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                            lineNumber: 128,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 123,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                            lineNumber: 121,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-center -my-1",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-8 h-8 rounded-lg bg-dark-100 border border-gray-700/50 flex items-center justify-center text-gray-400",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "w-4 h-4",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        strokeWidth: 2,
                                        d: "M19 14l-7 7m0 0l-7-7m7 7V3"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                        lineNumber: 139,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 138,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                lineNumber: 137,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                            lineNumber: 136,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "p-3 rounded-xl bg-dark/80 border border-gray-700/20",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-gray-400 mb-1",
                                    children: "You receive"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 146,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xl font-semibold text-white",
                                                    children: outputAmount
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                                    lineNumber: 149,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-500",
                                                    children: outputUsd
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                                    lineNumber: 150,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                            lineNumber: 148,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TokenIcon$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenIcon"], {
                                                    symbol: outputSymbol,
                                                    size: 24
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                                    lineNumber: 153,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-semibold text-white",
                                                    children: outputSymbol
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                                    lineNumber: 154,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                            lineNumber: 152,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 147,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                            lineNumber: 145,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                    lineNumber: 119,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-5 mt-4 space-y-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between text-xs",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-400",
                                    children: "Rate"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 163,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-white",
                                    children: exchangeRate
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 164,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                            lineNumber: 162,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between text-xs",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-400",
                                    children: "Price Impact"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 167,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: `font-medium ${getPriceImpactColor(priceImpact)}`,
                                    children: [
                                        priceImpact.toFixed(2),
                                        "%"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 168,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                            lineNumber: 166,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between text-xs",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-400",
                                    children: "Minimum Received"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 173,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-white",
                                    children: minimumReceived
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 174,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                            lineNumber: 172,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between text-xs",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-400",
                                    children: "Network Fee"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 177,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-white",
                                    children: networkFee
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 178,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                            lineNumber: 176,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between text-xs",
                            title: "If the swap doesn't confirm in this window, it will be auto-cancelled to protect against MEV / sandwich attacks.",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-400",
                                    children: "Auto-cancel after"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 181,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-white",
                                    children: [
                                        deadlineMinutes,
                                        " ",
                                        deadlineMinutes === 1 ? 'minute' : 'minutes'
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 182,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                            lineNumber: 180,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between text-xs",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-gray-400",
                                    children: "UBI Contribution"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 187,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-goodgreen",
                                    children: [
                                        ubiFee,
                                        " funds UBI"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 188,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                            lineNumber: 186,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                    lineNumber: 161,
                    columnNumber: 9
                }, this),
                isExtreme && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    "data-testid": "extreme-impact-warning",
                    role: "alert",
                    className: "mx-5 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-sm",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "font-semibold text-red-400",
                            children: [
                                "Extreme price impact: ",
                                priceImpact.toFixed(2),
                                "%"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                            lineNumber: 199,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-red-400/80 mt-1",
                            children: "This trade will move the pool significantly and is highly vulnerable to sandwich attacks. Consider splitting it into smaller swaps or routing through a deeper pool."
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                            lineNumber: 202,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "mt-3 flex items-start gap-2 text-xs text-red-400 cursor-pointer select-none",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "checkbox",
                                    checked: acknowledged,
                                    onChange: (e)=>setAcknowledged(e.target.checked),
                                    className: "mt-0.5 h-4 w-4 rounded border-red-500/50 bg-transparent accent-red-500 focus-visible:ring-2 focus-visible:ring-red-500/50",
                                    "aria-label": "I understand the risk of an extreme price impact swap"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 208,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "I understand the risk and want to proceed anyway."
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                                    lineNumber: 215,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                            lineNumber: 207,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                    lineNumber: 194,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-5 pt-4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleConfirm,
                        disabled: confirmDisabled,
                        "aria-disabled": confirmDisabled,
                        className: `w-full py-4 rounded-xl font-semibold text-base transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:outline-none ${confirmDisabled ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : isExtreme || priceImpact >= 10 ? 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500/50' : 'bg-goodgreen text-black hover:bg-goodgreen-600 focus-visible:ring-goodgreen/50'}`,
                        children: "Confirm Swap"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                        lineNumber: 224,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
                    lineNumber: 223,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
            lineNumber: 95,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/SwapConfirmModal.tsx",
        lineNumber: 88,
        columnNumber: 5
    }, this);
}
_s(SwapConfirmModal, "/foDp5QmAMz62yg3N7uXdf7NKbY=");
_c = SwapConfirmModal;
var _c;
__turbopack_context__.k.register(_c, "SwapConfirmModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/SwapWalletActions.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SwapWalletActions",
    ()=>SwapWalletActions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SwapConfirmModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/SwapConfirmModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainSwap$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useOnChainSwap.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useSwapSettings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useSwapSettings.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/toast.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
function SwapWalletActions(props) {
    if (props.variant === 'balance') {
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SwapButton, {
        inputToken: props.inputToken,
        outputToken: props.outputToken,
        inputAmount: props.inputAmount,
        hasAmount: props.hasAmount,
        priceImpact: props.priceImpact,
        outputAmount: props.outputAmount,
        inputUsd: props.inputUsd,
        outputUsd: props.outputUsd,
        exchangeRate: props.exchangeRate,
        minimumReceived: props.minimumReceived,
        networkFee: props.networkFee,
        ubiFee: props.ubiFee,
        onChainAmountOutMin: props.onChainAmountOutMin,
        pairOnChain: props.pairOnChain,
        canSubmit: props.canSubmit,
        disabledReason: props.disabledReason,
        onInvalidSubmit: props.onInvalidSubmit
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/SwapWalletActions.tsx",
        lineNumber: 60,
        columnNumber: 5
    }, this);
}
_c = SwapWalletActions;
function SwapButton({ inputToken, outputToken, inputAmount, hasAmount, priceImpact = 0, outputAmount = '', inputUsd = '', outputUsd = '', exchangeRate = '', minimumReceived = '', networkFee = '< $0.01', ubiFee = '', onChainAmountOutMin, pairOnChain = false, canSubmit = true, disabledReason = 'dust', onInvalidSubmit }) {
    _s();
    const [showReview, setShowReview] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { swap, phase, error, reset, isConnected } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainSwap$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSwapExecute"])();
    const { deadline: deadlineMinutes } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useSwapSettings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSwapSettings"])();
    const prevPhase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(phase);
    // Fire toasts on phase transitions
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SwapButton.useEffect": ()=>{
            const prev = prevPhase.current;
            prevPhase.current = phase;
            if (phase === prev) return;
            if (phase === 'approving') {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toastPending"])('Awaiting approval…', 'Please confirm the token approval in your wallet.');
            } else if (phase === 'swapping') {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toastPending"])('Swap submitted', 'Waiting for transaction confirmation…');
            } else if (phase === 'done') {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toastSuccess"])('Swap complete!', `${inputToken.symbol} → ${outputToken.symbol} transaction confirmed.`);
            }
        }
    }["SwapButton.useEffect"], [
        phase,
        inputToken.symbol,
        outputToken.symbol
    ]);
    // Fire error toast
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SwapButton.useEffect": ()=>{
            if (error) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toastError"])('Swap failed', error);
            }
        }
    }["SwapButton.useEffect"], [
        error
    ]);
    const handleSwapClick = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SwapButton.useCallback[handleSwapClick]": ()=>{
            setShowReview(true);
        }
    }["SwapButton.useCallback[handleSwapClick]"], []);
    const handleConfirm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SwapButton.useCallback[handleConfirm]": async ()=>{
            setShowReview(false);
            if (pairOnChain && isConnected) {
                await swap(inputToken.symbol, outputToken.symbol, inputAmount, onChainAmountOutMin ?? BigInt(0), deadlineMinutes);
            }
        }
    }["SwapButton.useCallback[handleConfirm]"], [
        pairOnChain,
        isConnected,
        swap,
        inputToken.symbol,
        outputToken.symbol,
        inputAmount,
        onChainAmountOutMin,
        deadlineMinutes
    ]);
    const handleClose = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SwapButton.useCallback[handleClose]": ()=>{
            setShowReview(false);
            reset();
        }
    }["SwapButton.useCallback[handleClose]"], [
        reset
    ]);
    const isExecuting = phase === 'approving' || phase === 'swapping';
    const buttonLabel = ()=>{
        if (phase === 'approving') return 'Approving…';
        if (phase === 'swapping') return 'Swapping…';
        if (phase === 'done') return `Swapped!`;
        if (priceImpact >= 10) return `Swap Anyway — High Price Impact`;
        return `Swap ${inputToken.symbol} for ${outputToken.symbol}`;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            !hasAmount ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onInvalidSubmit,
                        className: "w-full py-4 rounded-xl font-semibold text-base bg-dark-50 text-gray-400 cursor-not-allowed",
                        "data-testid": "swap-button-empty",
                        children: "Enter an Amount"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapWalletActions.tsx",
                        lineNumber: 181,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-gray-500 text-center mt-3",
                        children: [
                            "Try swapping ",
                            inputToken.symbol,
                            " → ",
                            outputToken.symbol,
                            " — 0.1% of fees fund basic income for 640K+ people"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/SwapWalletActions.tsx",
                        lineNumber: 188,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true) : !canSubmit ? disabledReason === 'over-cap' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onInvalidSubmit,
                        className: "w-full py-4 rounded-xl font-semibold text-base bg-dark-50 text-gray-400 cursor-not-allowed",
                        "data-testid": "swap-button-over-cap",
                        "aria-disabled": "true",
                        disabled: true,
                        children: "Amount Too Large"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapWalletActions.tsx",
                        lineNumber: 195,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-amber-400/90 text-center mt-3",
                        children: "That amount is well above the per-swap cap. Reduce it to continue."
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapWalletActions.tsx",
                        lineNumber: 204,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onInvalidSubmit,
                        className: "w-full py-4 rounded-xl font-semibold text-base bg-dark-50 text-gray-400 cursor-not-allowed",
                        "data-testid": "swap-button-dust-guard",
                        "aria-disabled": "true",
                        children: "Amount Too Small"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapWalletActions.tsx",
                        lineNumber: 210,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-amber-400/90 text-center mt-3",
                        children: "Output rounds to zero. Try a larger amount — sub-dust swaps would waste gas and disable slippage protection."
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapWalletActions.tsx",
                        lineNumber: 218,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: handleSwapClick,
                    disabled: isExecuting,
                    className: `w-full py-4 rounded-xl font-semibold text-base transition-all active:scale-[0.98] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-70 disabled:cursor-not-allowed ${priceImpact >= 10 ? 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500/50' : 'bg-goodgreen text-black hover:bg-goodgreen-600 focus-visible:ring-goodgreen/50'}`,
                    "data-testid": "swap-button-active",
                    children: buttonLabel()
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/SwapWalletActions.tsx",
                    lineNumber: 226,
                    columnNumber: 11
                }, this)
            }, void 0, false),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SwapConfirmModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SwapConfirmModal"], {
                // Gate on canSubmit so that if a live quote refresh demotes a healthy
                // amount to dust while the modal is already open, the modal hides
                // before the user can confirm a zero-output swap.
                open: showReview && canSubmit,
                onClose: handleClose,
                onConfirm: handleConfirm,
                inputAmount: inputAmount,
                outputAmount: outputAmount,
                inputSymbol: inputToken.symbol,
                outputSymbol: outputToken.symbol,
                inputUsd: inputUsd,
                outputUsd: outputUsd,
                exchangeRate: exchangeRate,
                priceImpact: priceImpact,
                minimumReceived: minimumReceived,
                networkFee: networkFee,
                ubiFee: ubiFee,
                deadlineMinutes: deadlineMinutes
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/SwapWalletActions.tsx",
                lineNumber: 242,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s(SwapButton, "40VSTIc0oh+QyOPk/uUIYTBRcSM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainSwap$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSwapExecute"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useSwapSettings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSwapSettings"]
    ];
});
_c1 = SwapButton;
var _c, _c1;
__turbopack_context__.k.register(_c, "SwapWalletActions");
__turbopack_context__.k.register(_c1, "SwapButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/usePriceFeeds.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FALLBACK_PRICES",
    ()=>FALLBACK_PRICES,
    "__resetPriceFeedStoreForTests",
    ()=>__resetPriceFeedStoreForTests,
    "getPrice",
    ()=>getPrice,
    "usePriceFeeds",
    ()=>usePriceFeeds
]);
/**
 * usePriceFeeds — live USD price data via CoinGecko public API.
 *
 * Architecture: shared module-level singleton.
 *  - One fetch per refresh tick, regardless of how many components subscribe.
 *  - One setInterval, started on first subscriber, cleared on last unsubscribe.
 *  - Subscribers union their requested symbols into a single tracked set.
 *  - When a brand-new symbol is added, an immediate refetch fires so the new
 *    consumer does not wait up to 60s for its data.
 *
 * Falls back to static mock prices when:
 *  - the fetch fails (network error, rate limit)
 *  - running in a test environment (no window)
 *  - the symbol is not in the CoinGecko mapping
 *
 * Prices refresh every 60 seconds.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
// ─── CoinGecko ID mapping ─────────────────────────────────────────────────────
const COINGECKO_IDS = {
    ETH: 'ethereum',
    WETH: 'ethereum',
    WBTC: 'wrapped-bitcoin',
    USDC: 'usd-coin',
    USDT: 'tether',
    DAI: 'dai',
    'G$': 'good-dollar',
    LINK: 'chainlink',
    UNI: 'uniswap',
    AAVE: 'aave',
    ARB: 'arbitrum',
    OP: 'optimism',
    MKR: 'maker',
    COMP: 'compound-governance-token',
    SNX: 'havven',
    CRV: 'curve-dao-token',
    LDO: 'lido-dao',
    MATIC: 'matic-network'
};
const FALLBACK_PRICES = {
    ETH: 3012.45,
    WETH: 3012.45,
    WBTC: 60125.80,
    USDC: 1.00,
    USDT: 1.00,
    DAI: 1.00,
    'G$': 0.0102,
    LINK: 14.85,
    UNI: 7.92,
    AAVE: 89.50,
    ARB: 1.18,
    OP: 2.45,
    MKR: 2814.00,
    COMP: 49.80,
    SNX: 2.95,
    CRV: 0.58,
    LDO: 2.18,
    MATIC: 0.71
};
// ─── Fetch helper ─────────────────────────────────────────────────────────────
const REFRESH_MS = 60_000;
async function fetchCoinGeckoQuotes(symbols) {
    // Compute client-side "unknown" set up front so we surface it even when we
    // early-return without hitting the server, or when the server response is
    // the legacy shape (no unknownSymbols field).
    const clientUnknown = symbols.filter((s)=>!COINGECKO_IDS[s]);
    const ids = Array.from(new Set(symbols.map((s)=>COINGECKO_IDS[s]).filter(Boolean)));
    if (ids.length === 0) {
        return {
            prices: {},
            quotes: {},
            unknownSymbols: clientUnknown
        };
    }
    const res = await fetch(`/api/prices?symbols=${symbols.join(',')}`);
    // Task 0027: the server now returns 400 + `code: "no_supported_symbols"`
    // when every requested symbol is unmapped. Defensively handle that — even
    // though `ids.length === 0` above usually short-circuits first, the
    // server's symbol table and the client's can drift.
    if (res.status === 400) {
        let body = {};
        try {
            body = await res.json();
        } catch  {}
        if (body.code === 'no_supported_symbols') {
            const reported = Array.isArray(body.details?.unknownSymbols) ? body.details.unknownSymbols.filter((x)=>typeof x === 'string') : symbols;
            return {
                prices: {},
                quotes: {},
                unknownSymbols: reported
            };
        }
    }
    if (!res.ok) throw new Error(`Price proxy ${res.status}`);
    const data = await res.json();
    const serverUnknown = Array.isArray(data.unknownSymbols) ? data.unknownSymbols.filter((x)=>typeof x === 'string') : null;
    const prices = {};
    const quotes = {};
    for (const sym of symbols){
        const id = COINGECKO_IDS[sym];
        if (!id) continue;
        const entry = data[id];
        if (!entry || typeof entry.usd !== 'number') continue;
        prices[sym] = entry.usd;
        quotes[sym] = {
            price: entry.usd,
            change24h: typeof entry.usd_24h_change === 'number' ? entry.usd_24h_change : 0,
            volume24h: typeof entry.usd_24h_vol === 'number' ? entry.usd_24h_vol : 0,
            marketCap: typeof entry.usd_market_cap === 'number' ? entry.usd_market_cap : 0
        };
    }
    // Prefer the server's view (authoritative re: supported symbols today),
    // fall back to the client-computed set for legacy/mocked responses.
    return {
        prices,
        quotes,
        unknownSymbols: serverUnknown ?? clientUnknown
    };
}
const store = {
    state: {
        prices: FALLBACK_PRICES,
        quotes: {},
        isLive: false,
        lastUpdated: null,
        error: null,
        unknownSymbols: [],
        sources: {}
    },
    refs: new Map(),
    subscribers: new Set(),
    intervalId: null,
    inFlight: false
};
function notify() {
    for (const sub of store.subscribers)sub(store.state);
}
function trackedSymbols() {
    return Array.from(store.refs.keys());
}
async function refresh() {
    if (store.inFlight) return;
    // Skip work while the tab is hidden so a backgrounded landing page does not
    // ping CoinGecko forever. handleVisibilityChange below fires an immediate
    // refresh the moment the tab becomes visible again so prices stay fresh.
    if (typeof document !== 'undefined' && document.hidden) return;
    const symbols = trackedSymbols();
    if (symbols.length === 0) return;
    store.inFlight = true;
    try {
        const { prices: live, quotes, unknownSymbols } = await fetchCoinGeckoQuotes(symbols);
        const nextSources = {};
        for (const sym of symbols){
            nextSources[sym] = live[sym] !== undefined ? 'coingecko' : 'fallback';
        }
        store.state = {
            prices: {
                ...store.state.prices,
                ...live
            },
            quotes: {
                ...store.state.quotes,
                ...quotes
            },
            isLive: Object.keys(live).length > 0,
            lastUpdated: new Date(),
            error: null,
            // Replace (don't accumulate) so dropping a subscriber that was the only
            // one asking for an unknown symbol also drops it from the surfaced list.
            // We always send the full trackedSymbols() set, so the response covers it.
            unknownSymbols,
            sources: {
                ...store.state.sources,
                ...nextSources
            }
        };
    } catch (err) {
        const fallbackSources = {
            ...store.state.sources
        };
        for (const sym of symbols)fallbackSources[sym] = 'fallback';
        store.state = {
            ...store.state,
            isLive: false,
            error: err instanceof Error ? err.message : 'Price feed unavailable',
            sources: fallbackSources
        };
    } finally{
        store.inFlight = false;
        notify();
    }
}
/**
 * Module-level handler so add/remove pair on the exact same reference.
 * Fires one immediate refresh when the tab returns to the foreground.
 */ function handleVisibilityChange() {
    if (typeof document === 'undefined') return;
    if (!document.hidden) void refresh();
}
function startIntervalIfNeeded() {
    if (store.intervalId !== null) return;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
     // SSR: no interval
    store.intervalId = setInterval(refresh, REFRESH_MS);
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }
}
function stopIntervalIfIdle() {
    if (store.subscribers.size > 0) return;
    if (store.intervalId !== null) {
        clearInterval(store.intervalId);
        store.intervalId = null;
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    }
}
/**
 * Increment refcount for each symbol; return the list of symbols that became
 * tracked for the first time (we'll trigger an immediate refetch for those).
 */ function acquire(symbols) {
    const newlyTracked = [];
    for (const sym of symbols){
        const cur = store.refs.get(sym) ?? 0;
        if (cur === 0) newlyTracked.push(sym);
        store.refs.set(sym, cur + 1);
    }
    return newlyTracked;
}
function release(symbols) {
    for (const sym of symbols){
        const cur = store.refs.get(sym) ?? 0;
        if (cur <= 1) {
            store.refs.delete(sym);
        } else {
            store.refs.set(sym, cur - 1);
        }
    }
}
function __resetPriceFeedStoreForTests() {
    if (store.intervalId !== null) {
        clearInterval(store.intervalId);
        store.intervalId = null;
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    }
    store.refs.clear();
    store.subscribers.clear();
    store.inFlight = false;
    store.state = {
        prices: FALLBACK_PRICES,
        quotes: {},
        isLive: false,
        lastUpdated: null,
        error: null,
        unknownSymbols: [],
        sources: {}
    };
}
function usePriceFeeds(symbols) {
    _s();
    const [snapshot, setSnapshot] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(store.state);
    // Stable key so we only re-subscribe when the symbol set actually changes.
    const key = symbols.join(',');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "usePriceFeeds.useEffect": ()=>{
            const subscriber = {
                "usePriceFeeds.useEffect.subscriber": (next)=>setSnapshot(next)
            }["usePriceFeeds.useEffect.subscriber"];
            store.subscribers.add(subscriber);
            const newlyTracked = acquire(symbols);
            startIntervalIfNeeded();
            // If we added symbols not previously tracked, kick an immediate fetch so
            // this consumer doesn't wait up to 60s for first data.
            if (newlyTracked.length > 0) {
                void refresh();
            } else {
                // Sync the new subscriber to the latest state once.
                setSnapshot(store.state);
            }
            return ({
                "usePriceFeeds.useEffect": ()=>{
                    store.subscribers.delete(subscriber);
                    release(symbols);
                    stopIntervalIfIdle();
                }
            })["usePriceFeeds.useEffect"];
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["usePriceFeeds.useEffect"], [
        key
    ]);
    return snapshot;
}
_s(usePriceFeeds, "W+4Q255jx141yV6+gTsNlFWfkPE=");
function getPrice(prices, symbol) {
    return prices[symbol] ?? FALLBACK_PRICES[symbol] ?? 0;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/ui/animated-number.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AnimatedNumber",
    ()=>AnimatedNumber
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-spring.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-motion-value.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/value/use-transform.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function AnimatedNumber({ value, decimals = 2, className }) {
    _s();
    const motionValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"])(value);
    const spring = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"])(motionValue, {
        stiffness: 80,
        damping: 20
    });
    const display = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransform"])(spring, {
        "AnimatedNumber.useTransform[display]": (v)=>v.toFixed(decimals)
    }["AnimatedNumber.useTransform[display]"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnimatedNumber.useEffect": ()=>{
            motionValue.set(value);
        }
    }["AnimatedNumber.useEffect"], [
        value,
        motionValue
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].span, {
        className: className,
        children: display
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/ui/animated-number.tsx",
        lineNumber: 22,
        columnNumber: 10
    }, this);
}
_s(AnimatedNumber, "P6nQ//zngBBnrbVNmgbUKXUZrtU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$motion$2d$value$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMotionValue"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$spring$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSpring"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$value$2f$use$2d$transform$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTransform"]
    ];
});
_c = AnimatedNumber;
var _c;
__turbopack_context__.k.register(_c, "AnimatedNumber");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/priceSource.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * priceSource — shared discriminated union for the provenance of every
 * price rendered anywhere in the app.
 *
 * Lane 4 (`0007d-app-integration`) requires every visible price to carry
 * a single, honest attribution. This module is the canonical helper:
 *
 *   resolvePriceSource({ chainOk, statusQuote, coinGeckoLive, hasFallback })
 *
 * Returns one of:
 *   - `chain-oracle`  — on-chain `*PriceOracle` answered with a sane value
 *   - `etoro-demo`    — price-service marks the symbol as eToro-fed
 *   - `coingecko`     — CoinGecko proxy returned a live value
 *   - `fallback`      — only the static seed is available (cached, fabricated)
 *   - `stale`         — last known value is past `STALE_THRESHOLD_MS`
 *   - `closed`        — sessionState is `closed` or `halted`
 *   - `unknown`       — no signal whatsoever
 *
 * The function is pure. No React, no fetch.
 */ __turbopack_context__.s([
    "STALE_THRESHOLD_MS",
    ()=>STALE_THRESHOLD_MS,
    "WARN_THRESHOLD_MS",
    ()=>WARN_THRESHOLD_MS,
    "priceSourceLabel",
    ()=>priceSourceLabel,
    "resolvePriceSource",
    ()=>resolvePriceSource
]);
const STALE_THRESHOLD_MS = 60_000;
const WARN_THRESHOLD_MS = 15_000;
function resolvePriceSource(input) {
    const { chainOk, coinGeckoLive = false, hasFallback = false, statusQuote } = input;
    if (chainOk) return 'chain-oracle';
    if (statusQuote) {
        const session = statusQuote.sessionState;
        if (session === 'closed' || session === 'halted') return 'closed';
        if (statusQuote.lastUpdateMs > STALE_THRESHOLD_MS) return 'stale';
        if (statusQuote.source === 'etoro') return 'etoro-demo';
    }
    if (coinGeckoLive) return 'coingecko';
    if (hasFallback) return 'fallback';
    return 'unknown';
}
function priceSourceLabel(source) {
    switch(source){
        case 'chain-oracle':
            return 'Chain oracle';
        case 'etoro-demo':
            return 'eToro demo';
        case 'coingecko':
            return 'Cached (CoinGecko)';
        case 'fallback':
            return 'Fallback price';
        case 'stale':
            return 'Stale';
        case 'closed':
            return 'Market closed';
        case 'unknown':
            return 'Unknown';
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/PriceSourceBadge.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PriceSourceBadge",
    ()=>PriceSourceBadge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$priceSource$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/priceSource.ts [app-client] (ecmascript)");
'use client';
;
;
function PriceSourceBadge({ source, size = 'md', className = '' }) {
    const label = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$priceSource$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["priceSourceLabel"])(source);
    const variant = VARIANTS[source];
    const dotSize = size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5';
    const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
    const gap = size === 'sm' ? 'gap-1' : 'gap-1.5';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": "price-source-badge",
        "data-source": source,
        "aria-label": `Price source: ${label}`,
        className: `inline-flex items-center ${gap} ${textSize} ${variant.textClass} ${className}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                "data-testid": "price-source-dot",
                "aria-hidden": "true",
                className: `${dotSize} rounded-full ${variant.dotClass} ${variant.animateClass ?? ''}`
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PriceSourceBadge.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: label
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/PriceSourceBadge.tsx",
                lineNumber: 41,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/PriceSourceBadge.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
_c = PriceSourceBadge;
const VARIANTS = {
    'chain-oracle': {
        dotClass: 'bg-green-400',
        textClass: 'text-green-400',
        animateClass: 'animate-pulse'
    },
    'etoro-demo': {
        dotClass: 'bg-sky-400',
        textClass: 'text-sky-400'
    },
    'coingecko': {
        dotClass: 'bg-gray-400',
        textClass: 'text-gray-400'
    },
    'fallback': {
        dotClass: 'bg-yellow-400',
        textClass: 'text-yellow-400'
    },
    'stale': {
        dotClass: 'bg-amber-400',
        textClass: 'text-amber-400'
    },
    'closed': {
        dotClass: 'bg-gray-500',
        textClass: 'text-gray-400'
    },
    'unknown': {
        dotClass: 'bg-gray-600',
        textClass: 'text-gray-500'
    }
};
var _c;
__turbopack_context__.k.register(_c, "PriceSourceBadge");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/lib/swapLimits.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PER_SYMBOL_MAX_INPUT",
    ()=>PER_SYMBOL_MAX_INPUT,
    "getSwapInputCap",
    ()=>getSwapInputCap,
    "isAmountWithinCap",
    ()=>isAmountWithinCap
]);
/**
 * swapLimits — per-symbol sanity caps for the SwapCard input.
 *
 * Lane 4 safety gate: the swap quote multiplies the user's input by the
 * current rate and renders the result. Without a per-symbol cap, a user
 * can type `99,999,999,999,999` ETH (≈ 800,000× the world's ETH supply)
 * and watch the UI quote them `19,950,459T G$` (~$2 quadrillion) with a
 * fully-enabled "Swap" CTA. Even in demo mode this is "pretending a
 * price is real" in a way the lane-4 spec explicitly forbids.
 *
 * The cap table here is the single source of truth. Anything above it
 * blocks the quote, dashes the output, hides the UBI breakdown, and
 * disables the swap CTA at the UI layer. The chain still has its own
 * balance check downstream — this just stops the UI from baiting the
 * user there.
 */ const DEFAULT_MAX_INPUT = 1_000_000;
const PER_SYMBOL_MAX_INPUT = {
    ETH: 1_000_000,
    WETH: 1_000_000,
    WBTC: 100_000,
    USDC: 100_000_000,
    USDT: 100_000_000,
    DAI: 100_000_000,
    'G$': 1_000_000_000
};
function getSwapInputCap(symbol) {
    return PER_SYMBOL_MAX_INPUT[symbol] ?? DEFAULT_MAX_INPUT;
}
function isAmountWithinCap(symbol, amount) {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!Number.isFinite(n) || n <= 0) return true;
    return n <= getSwapInputCap(symbol);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/SwapCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SwapCard",
    ()=>SwapCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/arrow-up-down.js [app-client] (ecmascript) <export default as ArrowUpDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/chevron-down.js [app-client] (ecmascript) <export default as ChevronDown>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TokenSelector$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/TokenSelector.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/tokens.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$UBIBreakdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/UBIBreakdown.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$StalePriceBanner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/StalePriceBanner.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SwapSettings$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/SwapSettings.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SwapDetails$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/SwapDetails.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SwapRoute$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/SwapRoute.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceImpactWarning$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/PriceImpactWarning.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$FeeBreakdownBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/FeeBreakdownBadge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/format.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useSwapSettings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useSwapSettings.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SwapWalletActions$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/SwapWalletActions.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceFeeds.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainSwap$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/useOnChainSwap.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$animated$2d$number$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/ui/animated-number.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/PriceSourceBadge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$swapLimits$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/swapLimits.ts [app-client] (ecmascript)");
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
function getLiveRate(prices, from, to) {
    if (from === to) return 1;
    const fromPrice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPrice"])(prices, from);
    const toPrice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPrice"])(prices, to);
    if (!fromPrice || !toPrice) return 0;
    return fromPrice / toPrice;
}
const SWAP_FEE_BPS = 30;
const UBI_FEE_BPS = 2000;
// Cap on "You pay" input length. 16 chars covers the realistic range
// for every token in the app (G$ totalSupply ≈ 1 trillion → 13 integer
// digits + "." + 2 decimals = 16) without entering JS `Number` precision
// loss territory. Stops the trillion-scale display overflow and the
// 24-digit "huge input flips to tiny output" pathology at the source.
const MAX_INPUT_LEN = 16;
// Display floor for the "You receive" cell. When the parsed input is
// non-zero but the resulting `rawOutputAmount` is below 1e-6, we render
// this literal instead of fabricating a numeric value that's
// inevitably the wrong order of magnitude.
const FLOOR_STR = '< 0.000001';
const FLOOR_THRESHOLD = 1e-6;
function SwapCard() {
    _s();
    const { slippage } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useSwapSettings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSwapSettings"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const [inputToken, setInputToken] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"][1]);
    const [outputToken, setOutputToken] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"][0]);
    const [inputAmount, setInputAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [showAdvanced, setShowAdvanced] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Live price feeds — falls back to static prices when CoinGecko is unreachable
    const feed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceFeeds"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].map({
        "SwapCard.usePriceFeeds[feed]": (t)=>t.symbol
    }["SwapCard.usePriceFeeds[feed]"]));
    const { prices, isLive } = feed;
    // Defensive read: some legacy tests mock `usePriceFeeds` without the
    // lane-4 `sources` field. Treat that as "we don't know" instead of crashing.
    const sources = feed.sources ?? {};
    // Pick the "less authoritative" source between the two legs so the badge
    // honestly reflects the weakest link in the rate calculation. Chain wins
    // when both sides have it; if either side is fallback, the rate is fallback.
    const rateSource = (()=>{
        const fromSrc = sources[inputToken.symbol] ?? 'unknown';
        const toSrc = sources[outputToken.symbol] ?? 'unknown';
        const order = [
            'chain-oracle',
            'etoro-demo',
            'coingecko',
            'stale',
            'closed',
            'fallback',
            'unknown'
        ];
        const fromRank = order.indexOf(fromSrc);
        const toRank = order.indexOf(toSrc);
        return order[Math.max(fromRank, toRank)] ?? 'unknown';
    })();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SwapCard.useEffect": ()=>{
            const buyParam = searchParams.get('buy');
            if (buyParam) {
                const found = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].find({
                    "SwapCard.useEffect.found": (t)=>t.symbol.toUpperCase() === buyParam.toUpperCase()
                }["SwapCard.useEffect.found"]);
                if (found) {
                    setOutputToken({
                        "SwapCard.useEffect": (prev)=>{
                            if (prev.symbol === found.symbol) return prev;
                            setInputToken({
                                "SwapCard.useEffect": (inp)=>inp.symbol === found.symbol ? __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].find({
                                        "SwapCard.useEffect": (t)=>t.symbol !== found.symbol
                                    }["SwapCard.useEffect"]) ?? __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"][1] : inp
                            }["SwapCard.useEffect"]);
                            return found;
                        }
                    }["SwapCard.useEffect"]);
                }
                return;
            }
            const tokenParam = searchParams.get('token');
            if (!tokenParam) return;
            const found = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].find({
                "SwapCard.useEffect.found": (t)=>t.symbol.toUpperCase() === tokenParam.toUpperCase()
            }["SwapCard.useEffect.found"]);
            if (!found) return;
            setInputToken({
                "SwapCard.useEffect": (prev)=>{
                    if (prev.symbol === found.symbol) return prev;
                    setOutputToken({
                        "SwapCard.useEffect": (out)=>out.symbol === found.symbol ? __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].find({
                                "SwapCard.useEffect": (t)=>t.symbol !== found.symbol
                            }["SwapCard.useEffect"]) ?? __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"][0] : out
                    }["SwapCard.useEffect"]);
                    return found;
                }
            }["SwapCard.useEffect"]);
        }
    }["SwapCard.useEffect"], [
        searchParams
    ]);
    // On-chain quote from GoodSwapRouter (supported pairs: G$, WETH/ETH, USDC)
    const { amountOutFormatted: onChainAmountOut, amountOut: onChainAmountOutWei, isSupported: pairOnChain, priceImpactPct: onChainPriceImpact } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainSwap$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSwapQuote"])(inputAmount, inputToken.symbol, outputToken.symbol);
    const rawOutputAmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapCard.useMemo[rawOutputAmount]": ()=>{
            if (pairOnChain && onChainAmountOut) return parseFloat(onChainAmountOut);
            const amt = parseFloat(inputAmount);
            if (!amt || isNaN(amt)) return 0;
            const rate = getLiveRate(prices, inputToken.symbol, outputToken.symbol);
            const gross = amt * rate;
            const fee = gross * (SWAP_FEE_BPS / 10000);
            return gross - fee;
        }
    }["SwapCard.useMemo[rawOutputAmount]"], [
        inputAmount,
        inputToken.symbol,
        outputToken.symbol,
        prices,
        pairOnChain,
        onChainAmountOut
    ]);
    const outputAmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapCard.useMemo[outputAmount]": ()=>{
            if (!rawOutputAmount) return '';
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatAmount"])(rawOutputAmount, outputToken.symbol === 'USDC' ? 2 : 6);
        }
    }["SwapCard.useMemo[outputAmount]"], [
        rawOutputAmount,
        outputToken.symbol
    ]);
    const compactOutputAmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapCard.useMemo[compactOutputAmount]": ()=>{
            if (!rawOutputAmount) return '';
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["compactAmount"])(rawOutputAmount, 6);
        }
    }["SwapCard.useMemo[compactOutputAmount]"], [
        rawOutputAmount
    ]);
    // Number of integer digits in the raw output. >10 means we'd render
    // 11+ digits before the decimal point, which overflows the desktop
    // card past the output-token selector even with the existing font-size
    // clamp. AnimatedNumber uses `.toFixed(decimals)` and does not
    // abbreviate, so the only safe path is to swap to the compact form.
    const integerDigits = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapCard.useMemo[integerDigits]": ()=>{
            if (!rawOutputAmount) return 0;
            return String(Math.floor(Math.abs(rawOutputAmount))).length;
        }
    }["SwapCard.useMemo[integerDigits]"], [
        rawOutputAmount
    ]);
    // True when the parsed input is non-zero but the resulting output
    // would round to 0 at six decimals. Catches the inverse pathology:
    // `0.000000000000001` ETH → 2.9 trillion G$ render that's purely an
    // artifact of `parseFloat → formatUnits` scientific-notation churn.
    const isBelowFloor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapCard.useMemo[isBelowFloor]": ()=>{
            return rawOutputAmount > 0 && rawOutputAmount < FLOOR_THRESHOLD;
        }
    }["SwapCard.useMemo[isBelowFloor]"], [
        rawOutputAmount
    ]);
    // True the moment the user types a 16th character. The amber warning
    // chip appears so they know the cap was hit and double-check the
    // intent before submitting.
    const inputAtCap = inputAmount.length >= MAX_INPUT_LEN;
    // Sanity cap on the parsed amount itself. The 16-char cap doesn't stop
    // the trillion-scale pathology (99,999,999,999,999 ETH is only 14 chars)
    // — this does. When tripped we suppress the quote and disable the CTA.
    const isOverCap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapCard.useMemo[isOverCap]": ()=>!(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$swapLimits$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isAmountWithinCap"])(inputToken.symbol, inputAmount)
    }["SwapCard.useMemo[isOverCap]"], [
        inputAmount,
        inputToken.symbol
    ]);
    const overCapNumeric = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapCard.useMemo[overCapNumeric]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$swapLimits$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSwapInputCap"])(inputToken.symbol).toLocaleString()
    }["SwapCard.useMemo[overCapNumeric]"], [
        inputToken.symbol
    ]);
    const ubiFee = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapCard.useMemo[ubiFee]": ()=>{
            const amt = parseFloat(inputAmount);
            if (!amt || isNaN(amt)) return 0;
            const rate = getLiveRate(prices, inputToken.symbol, outputToken.symbol);
            const gross = amt * rate;
            const swapFee = gross * (SWAP_FEE_BPS / 10000);
            return swapFee * (UBI_FEE_BPS / 10000);
        }
    }["SwapCard.useMemo[ubiFee]"], [
        inputAmount,
        inputToken.symbol,
        outputToken.symbol,
        prices
    ]);
    const priceImpact = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapCard.useMemo[priceImpact]": ()=>{
            // For on-chain supported pairs, use the real reserve-based impact computed
            // from a tiny reference quote vs. the user's actual quote — that's the only
            // honest answer because the previous synthetic ladder was driven by raw
            // amount, not pool depth, and silently masked sandwich-shaped trades.
            if (pairOnChain) return onChainPriceImpact;
            // For unsupported pairs (legacy mock-feed fallback), keep a *capped* and
            // explicitly-conservative estimate so we never under-warn vs. the on-chain
            // path. This only fires off-chain (no reserves to consult).
            const amt = parseFloat(inputAmount);
            if (!amt || isNaN(amt)) return 0;
            if (amt < 1) return 0.01;
            if (amt < 10) return 0.1 + amt / 10 * 0.2;
            if (amt < 100) return 0.3 + amt / 100 * 1.5;
            return Math.min(0.3 + amt / 100 * 1.5, 15);
        }
    }["SwapCard.useMemo[priceImpact]"], [
        inputAmount,
        pairOnChain,
        onChainPriceImpact
    ]);
    const minimumReceived = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapCard.useMemo[minimumReceived]": ()=>{
            if (!rawOutputAmount) return '';
            const min = rawOutputAmount * (1 - slippage / 100);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatAmount"])(min, outputToken.symbol === 'USDC' ? 2 : 6);
        }
    }["SwapCard.useMemo[minimumReceived]"], [
        rawOutputAmount,
        slippage,
        outputToken.symbol
    ]);
    const exchangeRate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapCard.useMemo[exchangeRate]": ()=>{
            const rate = getLiveRate(prices, inputToken.symbol, outputToken.symbol);
            if (rate >= 1000) return `1 ${inputToken.symbol} = ${rate.toLocaleString()} ${outputToken.symbol}`;
            if (rate >= 1) return `1 ${inputToken.symbol} = ${rate.toFixed(2)} ${outputToken.symbol}`;
            return `1 ${inputToken.symbol} = ${rate.toFixed(6)} ${outputToken.symbol}`;
        }
    }["SwapCard.useMemo[exchangeRate]"], [
        inputToken.symbol,
        outputToken.symbol,
        prices
    ]);
    const inputUsd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapCard.useMemo[inputUsd]": ()=>{
            const amt = parseFloat(inputAmount);
            if (!amt || isNaN(amt)) return '';
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatUsdValue"])(amt * (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPrice"])(prices, inputToken.symbol));
        }
    }["SwapCard.useMemo[inputUsd]"], [
        inputAmount,
        inputToken.symbol,
        prices
    ]);
    const outputUsd = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapCard.useMemo[outputUsd]": ()=>{
            if (!rawOutputAmount) return '';
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatUsdValue"])(rawOutputAmount * (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPrice"])(prices, outputToken.symbol));
        }
    }["SwapCard.useMemo[outputUsd]"], [
        rawOutputAmount,
        outputToken.symbol,
        prices
    ]);
    const inputFontSize = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapCard.useMemo[inputFontSize]": ()=>{
            const len = inputAmount.length;
            if (len <= 8) return undefined;
            const size = Math.max(16, 30 - (len - 8) * 1.5);
            return `${size}px`;
        }
    }["SwapCard.useMemo[inputFontSize]"], [
        inputAmount
    ]);
    const [inputShake, setInputShake] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [flipRotation, setFlipRotation] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const handleFlip = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SwapCard.useCallback[handleFlip]": ()=>{
            setInputToken(outputToken);
            setOutputToken(inputToken);
            setFlipRotation({
                "SwapCard.useCallback[handleFlip]": (r)=>r + 180
            }["SwapCard.useCallback[handleFlip]"]);
        }
    }["SwapCard.useCallback[handleFlip]"], [
        inputToken,
        outputToken
    ]);
    const handleInputSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SwapCard.useCallback[handleInputSelect]": (t)=>{
            if (t.symbol === outputToken.symbol) setOutputToken(inputToken);
            setInputToken(t);
        }
    }["SwapCard.useCallback[handleInputSelect]"], [
        inputToken,
        outputToken
    ]);
    const handleOutputSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SwapCard.useCallback[handleOutputSelect]": (t)=>{
            if (t.symbol === inputToken.symbol) setInputToken(outputToken);
            setOutputToken(t);
        }
    }["SwapCard.useCallback[handleOutputSelect]"], [
        inputToken,
        outputToken
    ]);
    const hasAmount = !!inputAmount && parseFloat(inputAmount) > 0;
    // Defense-in-depth: only allow swap submission when the input is non-zero
    // AND the on-chain quote produces a non-trivial output. Sub-floor outputs
    // (rounded to 0 in the UI, or below FLOOR_THRESHOLD) would either revert
    // on-chain (wasted gas) or accept `amountOutMin = 0`, which disables
    // slippage protection and exposes the user to sandwich attacks.
    const canSubmit = hasAmount && rawOutputAmount > 0 && !isBelowFloor && !isOverCap;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        id: "swap-card",
        className: "w-full max-w-[460px]",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-dark-100 rounded-2xl border border-gray-700/30 shadow-xl overflow-hidden",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-5 pt-5 pb-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-lg font-semibold text-white",
                                    children: "Swap"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                    lineNumber: 257,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$FeeBreakdownBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FeeBreakdownBadge"], {}, void 0, false, {
                                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                            lineNumber: 259,
                                            columnNumber: 15
                                        }, this),
                                        showAdvanced && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SwapSettings$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SwapSettings"], {}, void 0, false, {
                                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                            lineNumber: 260,
                                            columnNumber: 32
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                    lineNumber: 258,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                            lineNumber: 256,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-3 flex justify-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setShowAdvanced(!showAdvanced),
                                className: "flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none rounded-lg",
                                "aria-label": showAdvanced ? "Hide advanced settings" : "Show advanced settings",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "Advanced"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                        lineNumber: 271,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronDown$3e$__["ChevronDown"], {
                                        className: `w-3 h-3 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                        lineNumber: 272,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                lineNumber: 266,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                            lineNumber: 265,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                    lineNumber: 255,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                    className: "mx-4 p-4 rounded-xl bg-dark/80 border border-gray-700/20",
                    animate: inputShake ? {
                        x: [
                            0,
                            8,
                            -8,
                            6,
                            -6,
                            0
                        ]
                    } : {},
                    transition: {
                        duration: 0.35,
                        ease: 'easeInOut'
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between mb-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs text-gray-400",
                                    children: "You pay"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                    lineNumber: 287,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SwapWalletActions$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SwapWalletActions"], {
                                    variant: "balance",
                                    inputToken: inputToken,
                                    onSetAmount: setInputAmount
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                    lineNumber: 288,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                            lineNumber: 286,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    inputMode: "decimal",
                                    placeholder: "0",
                                    "aria-label": `Amount to swap (${inputToken?.symbol ?? 'token'})`,
                                    value: inputAmount,
                                    maxLength: MAX_INPUT_LEN,
                                    onChange: (e)=>setInputAmount((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumericInput"])(e.target.value).slice(0, MAX_INPUT_LEN)),
                                    style: inputFontSize ? {
                                        fontSize: inputFontSize
                                    } : undefined,
                                    className: `flex-1 bg-transparent font-medium text-white outline-none placeholder:text-gray-500 min-w-0 focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:ring-offset-1 focus-visible:ring-offset-dark rounded-lg transition-[font-size] duration-100 ${inputFontSize ? '' : 'text-3xl'}`
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                    lineNumber: 295,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TokenSelector$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenSelector"], {
                                    selected: inputToken,
                                    onSelect: handleInputSelect,
                                    exclude: outputToken.symbol
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                    lineNumber: 306,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                            lineNumber: 294,
                            columnNumber: 11
                        }, this),
                        inputUsd && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-gray-500 mt-1.5",
                            "data-testid": "input-usd",
                            children: inputUsd
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                            lineNumber: 313,
                            columnNumber: 13
                        }, this),
                        inputAtCap && !isOverCap && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-[11px] text-amber-400 mt-1.5",
                            "data-testid": "input-cap-warning",
                            role: "status",
                            children: "Amount is unusually large. Double-check before swapping."
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                            lineNumber: 316,
                            columnNumber: 13
                        }, this),
                        isOverCap && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-[11px] text-amber-400 mt-1.5",
                            "data-testid": "swap-amount-over-cap",
                            role: "alert",
                            children: [
                                "Amount exceeds the per-swap cap (",
                                overCapNumeric,
                                " ",
                                inputToken.symbol,
                                "). Reduce to continue."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                            lineNumber: 325,
                            columnNumber: 13
                        }, this)
                    ]
                }, inputShake, true, {
                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                    lineNumber: 280,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-center -my-3 relative z-[60]",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleFlip,
                        "aria-label": "Swap token direction",
                        className: "w-10 h-10 rounded-xl bg-dark-100 border border-gray-700/50 flex items-center justify-center hover:border-goodgreen/50 hover:text-goodgreen transition-colors text-gray-400 focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$up$2d$down$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowUpDown$3e$__["ArrowUpDown"], {
                            className: "w-5 h-5 transition-transform duration-200",
                            style: {
                                transform: `rotate(${flipRotation}deg)`
                            }
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                            lineNumber: 342,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapCard.tsx",
                        lineNumber: 337,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                    lineNumber: 336,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mx-4 p-4 rounded-xl bg-dark/80 border border-gray-700/20",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between mb-2",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs text-gray-400",
                                children: "You receive"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                lineNumber: 352,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                            lineNumber: 351,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    title: isOverCap ? '' : rawOutputAmount ? rawOutputAmount.toString() : '',
                                    className: "flex-1 text-3xl sm:text-3xl font-medium min-w-0 cursor-default select-text",
                                    style: {
                                        fontSize: outputAmount.length > 10 ? 'clamp(1.125rem, 5vw, 1.875rem)' : undefined
                                    },
                                    "data-testid": "output-amount",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-white sm:hidden",
                                            children: isOverCap ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-gray-500",
                                                "data-testid": "output-overcap",
                                                children: "—"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                                lineNumber: 364,
                                                columnNumber: 21
                                            }, this) : isBelowFloor ? FLOOR_STR : compactOutputAmount || /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-gray-600",
                                                children: "0"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                                lineNumber: 367,
                                                columnNumber: 47
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                            lineNumber: 362,
                                            columnNumber: 15
                                        }, this),
                                        isOverCap ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-gray-500 hidden sm:inline",
                                            "data-testid": "output-overcap-desktop",
                                            children: "—"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                            lineNumber: 375,
                                            columnNumber: 17
                                        }, this) : isBelowFloor ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-white hidden sm:inline",
                                            "data-testid": "output-floor",
                                            children: FLOOR_STR
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                            lineNumber: 377,
                                            columnNumber: 17
                                        }, this) : integerDigits > 10 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-white hidden sm:inline",
                                            "data-testid": "output-compact",
                                            children: compactOutputAmount
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                            lineNumber: 379,
                                            columnNumber: 17
                                        }, this) : rawOutputAmount ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$ui$2f$animated$2d$number$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatedNumber"], {
                                            value: rawOutputAmount,
                                            decimals: outputToken.symbol === 'USDC' ? 2 : 6,
                                            className: "text-white hidden sm:inline"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                            lineNumber: 381,
                                            columnNumber: 17
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-gray-600 hidden sm:inline",
                                            children: "0"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                            lineNumber: 383,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                    lineNumber: 355,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TokenSelector$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenSelector"], {
                                    selected: outputToken,
                                    onSelect: handleOutputSelect,
                                    exclude: inputToken.symbol
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                    lineNumber: 386,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                            lineNumber: 354,
                            columnNumber: 11
                        }, this),
                        outputUsd && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-gray-500 mt-1.5",
                            "data-testid": "output-usd",
                            children: outputUsd
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                            lineNumber: 393,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                    lineNumber: 350,
                    columnNumber: 9
                }, this),
                hasAmount && showAdvanced && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mx-4 mt-3 px-4 py-2 text-xs text-gray-400 flex justify-between items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "flex items-center gap-1.5",
                            children: [
                                "Rate",
                                isLive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "inline-flex items-center gap-1 text-[10px] text-goodgreen/70",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "w-1.5 h-1.5 rounded-full bg-goodgreen animate-pulse inline-block"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                            lineNumber: 404,
                                            columnNumber: 19
                                        }, this),
                                        "live"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                    lineNumber: 403,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceSourceBadge"], {
                                    source: rateSource,
                                    size: "sm"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                                    lineNumber: 408,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                            lineNumber: 400,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: exchangeRate
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                            lineNumber: 410,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                    lineNumber: 399,
                    columnNumber: 11
                }, this),
                hasAmount && !showAdvanced && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mx-4 mt-3 px-4 py-1 flex justify-end",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceSourceBadge"], {
                        source: rateSource,
                        size: "sm"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapCard.tsx",
                        lineNumber: 418,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                    lineNumber: 417,
                    columnNumber: 11
                }, this),
                !isLive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mx-4 mt-2",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$StalePriceBanner$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StalePriceBanner"], {
                        variant: "swap"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapCard.tsx",
                        lineNumber: 424,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                    lineNumber: 423,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$UBIBreakdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UBIBreakdown"], {
                    ubiFeeAmount: ubiFee,
                    outputToken: outputToken,
                    visible: hasAmount && !isOverCap
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                    lineNumber: 430,
                    columnNumber: 9
                }, this),
                showAdvanced && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SwapDetails$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SwapDetails"], {
                            priceImpact: priceImpact,
                            minimumReceived: minimumReceived,
                            outputSymbol: outputToken.symbol,
                            networkFee: "< $0.01",
                            visible: hasAmount
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                            lineNumber: 439,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceImpactWarning$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceImpactWarning"], {
                            priceImpact: priceImpact,
                            visible: hasAmount
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                            lineNumber: 446,
                            columnNumber: 13
                        }, this),
                        hasAmount && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SwapRoute$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SwapRoute"], {
                            inputToken: inputToken,
                            outputToken: outputToken
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/SwapCard.tsx",
                            lineNumber: 447,
                            columnNumber: 27
                        }, this)
                    ]
                }, void 0, true),
                !showAdvanced && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceImpactWarning$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceImpactWarning"], {
                    priceImpact: priceImpact,
                    visible: hasAmount && priceImpact >= 5
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                    lineNumber: 453,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-4 pt-3",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SwapWalletActions$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SwapWalletActions"], {
                        variant: "swap-button",
                        inputToken: inputToken,
                        outputToken: outputToken,
                        inputAmount: inputAmount,
                        hasAmount: hasAmount,
                        priceImpact: priceImpact,
                        outputAmount: outputAmount,
                        inputUsd: inputUsd,
                        outputUsd: outputUsd,
                        exchangeRate: exchangeRate,
                        minimumReceived: `${minimumReceived} ${outputToken.symbol}`,
                        networkFee: "< $0.01",
                        ubiFee: ubiFee > 0 ? `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$format$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatAmount"])(ubiFee)} ${outputToken.symbol}` : '',
                        onChainAmountOutMin: onChainAmountOutWei !== undefined && slippage > 0 ? onChainAmountOutWei * BigInt(Math.floor((1 - slippage / 100) * 10000)) / BigInt(10000) : onChainAmountOutWei,
                        pairOnChain: pairOnChain,
                        canSubmit: canSubmit,
                        disabledReason: isOverCap ? 'over-cap' : 'dust',
                        onInvalidSubmit: ()=>setInputShake((p)=>p + 1)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapCard.tsx",
                        lineNumber: 458,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/SwapCard.tsx",
                    lineNumber: 457,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/SwapCard.tsx",
            lineNumber: 254,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/SwapCard.tsx",
        lineNumber: 253,
        columnNumber: 5
    }, this);
}
_s(SwapCard, "bGqUTb4LYoNIUD7pRxyCJeE9KJc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useSwapSettings$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSwapSettings"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceFeeds"],
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$useOnChainSwap$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSwapQuote"]
    ];
});
_c = SwapCard;
var _c;
__turbopack_context__.k.register(_c, "SwapCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/LivePriceCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LivePriceCard",
    ()=>LivePriceCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/PriceSourceBadge.tsx [app-client] (ecmascript)");
'use client';
;
;
;
function formatPrice(value) {
    if (!Number.isFinite(value)) return '$–';
    if (Math.abs(value) >= 1000) return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
    if (Math.abs(value) >= 1) return `$${value.toFixed(2)}`;
    if (Math.abs(value) >= 0.01) return `$${value.toFixed(4)}`;
    return `$${value.toFixed(6)}`;
}
function formatAge(ms) {
    if (ms == null) return 'just now';
    if (ms < 1000) return 'just now';
    if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
    return `${Math.floor(ms / 3_600_000)}h ago`;
}
/**
 * Source-aware freshness line. Honest about whether the displayed value is
 * actually fresh: `fallback` / `closed` / `unknown` carry no age (because the
 * underlying number isn't the result of a refresh tick), `stale` reads
 * "Last seen" not "Updated", and only the live sources show "Updated …".
 */ function freshnessText(source, ms) {
    switch(source){
        case 'chain-oracle':
        case 'etoro-demo':
        case 'coingecko':
            return {
                text: `Updated ${formatAge(ms)}`,
                tone: 'normal'
            };
        case 'stale':
            return {
                text: `Last seen ${formatAge(ms)}`,
                tone: 'warning'
            };
        case 'closed':
            return {
                text: 'Market closed',
                tone: 'normal'
            };
        case 'fallback':
            return {
                text: 'No live data',
                tone: 'normal'
            };
        case 'unknown':
            return {
                text: 'No data',
                tone: 'normal'
            };
    }
}
const WARNING_SOURCES = new Set([
    'closed',
    'stale'
]);
function LivePriceCard(props) {
    const { symbol, price, change24h, source, updatedAgoMs, compact = false, className = '' } = props;
    const isFallback = source === 'fallback';
    const showWarning = WARNING_SOURCES.has(source);
    const changeColor = change24h == null ? 'text-gray-500' : change24h > 0 ? 'text-green-400' : change24h < 0 ? 'text-red-400' : 'text-gray-400';
    const changeText = change24h == null ? '' : `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-testid": "live-price-card",
        className: `flex flex-col ${compact ? 'p-2.5' : 'p-3'} min-w-[120px] rounded-xl bg-dark-100/70 border border-gray-700/30 ${className}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mb-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-xs font-semibold text-gray-300",
                        children: symbol
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                        lineNumber: 98,
                        columnNumber: 9
                    }, this),
                    showWarning && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"], {
                        "data-testid": "live-price-warning",
                        "aria-label": source === 'closed' ? 'Market closed' : 'Stale price',
                        className: "size-3.5 text-amber-400 shrink-0"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                        lineNumber: 100,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 97,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "live-price",
                className: `font-semibold ${compact ? 'text-sm' : 'text-base'} ${isFallback ? 'text-gray-500 opacity-70' : 'text-white'}`,
                ...isFallback ? {
                    'data-testid-fallback': ''
                } : {},
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    "data-testid": isFallback ? 'fallback-price' : undefined,
                    children: formatPrice(price)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                    lineNumber: 113,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 108,
                columnNumber: 7
            }, this),
            !compact && change24h != null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "live-price-change",
                className: `text-[11px] mt-0.5 ${changeColor}`,
                children: changeText
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 117,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-between mt-2 gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$PriceSourceBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PriceSourceBadge"], {
                        source: source,
                        size: "sm"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                        lineNumber: 126,
                        columnNumber: 9
                    }, this),
                    (()=>{
                        const { text, tone } = freshnessText(source, updatedAgoMs);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            "data-testid": "live-price-freshness",
                            className: `text-[10px] shrink-0 ${tone === 'warning' ? 'text-amber-400' : 'text-gray-500'}`,
                            children: text
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                            lineNumber: 130,
                            columnNumber: 13
                        }, this);
                    })()
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
                lineNumber: 125,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/LivePriceCard.tsx",
        lineNumber: 93,
        columnNumber: 5
    }, this);
}
_c = LivePriceCard;
var _c;
__turbopack_context__.k.register(_c, "LivePriceCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/LivePriceStrip.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LivePriceStrip",
    ()=>LivePriceStrip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/LivePriceCard.tsx [app-client] (ecmascript)");
'use client';
;
;
const DEFAULT_EMPTY_MESSAGE = 'No positions yet — connect a wallet to track live prices for the stocks and crypto you hold.';
function LivePriceStrip({ entries, compact = false, className = '', title, loading = false, emptyMessage = DEFAULT_EMPTY_MESSAGE }) {
    const isEmpty = entries.length === 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `w-full ${className}`,
        children: [
            title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                className: "text-xs uppercase tracking-wider text-gray-500 mb-2 px-1",
                children: title
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                lineNumber: 53,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-testid": "live-price-strip",
                className: "flex items-stretch gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide",
                children: [
                    isEmpty && loading && Array.from({
                        length: 3
                    }, (_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            "data-testid": "live-price-skeleton",
                            className: "min-w-[120px] h-[78px] rounded-xl bg-dark-100/70 border border-gray-700/30 animate-pulse",
                            "aria-hidden": "true"
                        }, `skeleton-${i}`, false, {
                            fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                            lineNumber: 61,
                            columnNumber: 13
                        }, this)),
                    isEmpty && !loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "data-testid": "live-price-empty",
                        role: "status",
                        className: "flex-1 min-w-0 flex items-center gap-2 rounded-xl bg-dark-100/70 border border-gray-700/30 p-3 text-xs text-gray-400",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "aria-hidden": "true",
                                className: "inline-block w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                                lineNumber: 75,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "leading-snug",
                                children: emptyMessage
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                                lineNumber: 79,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                        lineNumber: 70,
                        columnNumber: 11
                    }, this),
                    !isEmpty && entries.map((e)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LivePriceCard"], {
                            ...e,
                            compact: compact
                        }, e.symbol, false, {
                            fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                            lineNumber: 83,
                            columnNumber: 11
                        }, this))
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/LivePriceStrip.tsx",
        lineNumber: 51,
        columnNumber: 5
    }, this);
}
_c = LivePriceStrip;
var _c;
__turbopack_context__.k.register(_c, "LivePriceStrip");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/LandingPriceStrip.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LandingPriceStrip",
    ()=>LandingPriceStrip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/LivePriceStrip.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceFeeds.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
const SYMBOLS = [
    'ETH',
    'USDC',
    'G$'
];
function LandingPriceStrip() {
    _s();
    const { prices, quotes, sources, lastUpdated } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceFeeds"])([
        ...SYMBOLS
    ]);
    const [now, setNow] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "LandingPriceStrip.useState": ()=>Date.now()
    }["LandingPriceStrip.useState"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LandingPriceStrip.useEffect": ()=>{
            const id = setInterval({
                "LandingPriceStrip.useEffect.id": ()=>setNow(Date.now())
            }["LandingPriceStrip.useEffect.id"], 1000);
            return ({
                "LandingPriceStrip.useEffect": ()=>clearInterval(id)
            })["LandingPriceStrip.useEffect"];
        }
    }["LandingPriceStrip.useEffect"], []);
    const updatedAgo = lastUpdated ? now - lastUpdated.getTime() : null;
    const entries = SYMBOLS.map((symbol)=>({
            symbol,
            price: prices[symbol] ?? 0,
            change24h: quotes[symbol]?.change24h ?? null,
            source: sources[symbol] ?? 'unknown',
            updatedAgoMs: updatedAgo
        }));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LivePriceStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LivePriceStrip"], {
        entries: entries
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/LandingPriceStrip.tsx",
        lineNumber: 36,
        columnNumber: 10
    }, this);
}
_s(LandingPriceStrip, "BAa87Gr5Dw772AeVXiIPFleAi4Q=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceFeeds"]
    ];
});
_c = LandingPriceStrip;
var _c;
__turbopack_context__.k.register(_c, "LandingPriceStrip");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/LandingSwapCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LandingSwapCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$WalletProviders$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/WalletProviders.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SwapCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/SwapCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LandingPriceStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/components/LandingPriceStrip.tsx [app-client] (ecmascript)");
'use client';
;
;
;
;
function LandingSwapCard() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$WalletProviders$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col gap-3 items-center w-full max-w-[460px] mx-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$LandingPriceStrip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LandingPriceStrip"], {}, void 0, false, {
                    fileName: "[project]/frontend/src/components/LandingSwapCard.tsx",
                    lineNumber: 24,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$SwapCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SwapCard"], {}, void 0, false, {
                    fileName: "[project]/frontend/src/components/LandingSwapCard.tsx",
                    lineNumber: 25,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/src/components/LandingSwapCard.tsx",
            lineNumber: 23,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/LandingSwapCard.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
_c = LandingSwapCard;
var _c;
__turbopack_context__.k.register(_c, "LandingSwapCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/LandingSwapCard.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/frontend/src/components/LandingSwapCard.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=frontend_src_0t7m-bq._.js.map