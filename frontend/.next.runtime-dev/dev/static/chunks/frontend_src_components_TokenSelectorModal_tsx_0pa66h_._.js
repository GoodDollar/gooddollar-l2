(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/components/TokenSelectorModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TokenSelectorModal",
    ()=>TokenSelectorModal,
    "default",
    ()=>__TURBOPACK__default__export__
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
function TokenSelectorModal({ open, onClose, onSelect, selected, exclude }) {
    _s();
    const [query, setQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [highlightedIndex, setHighlightedIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const searchRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const listRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const trimmedQuery = query.trim();
    const filtered = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TokenSelectorModal.useMemo[filtered]": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TOKENS"].filter({
                "TokenSelectorModal.useMemo[filtered]": (t)=>{
                    if (!trimmedQuery) return true;
                    const q = trimmedQuery.toLowerCase();
                    return t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q);
                }
            }["TokenSelectorModal.useMemo[filtered]"])
    }["TokenSelectorModal.useMemo[filtered]"], [
        trimmedQuery
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TokenSelectorModal.useEffect": ()=>{
            if (open) {
                setQuery('');
                setHighlightedIndex(0);
                requestAnimationFrame({
                    "TokenSelectorModal.useEffect": ()=>searchRef.current?.focus()
                }["TokenSelectorModal.useEffect"]);
            }
        }
    }["TokenSelectorModal.useEffect"], [
        open
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TokenSelectorModal.useEffect": ()=>{
            setHighlightedIndex(0);
        }
    }["TokenSelectorModal.useEffect"], [
        query
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TokenSelectorModal.useEffect": ()=>{
            if (!open) return;
            function handleEscape(e) {
                if (e.key === 'Escape') onClose();
            }
            document.addEventListener('keydown', handleEscape);
            return ({
                "TokenSelectorModal.useEffect": ()=>document.removeEventListener('keydown', handleEscape)
            })["TokenSelectorModal.useEffect"];
        }
    }["TokenSelectorModal.useEffect"], [
        open,
        onClose
    ]);
    const handleSelect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TokenSelectorModal.useCallback[handleSelect]": (token)=>{
            onSelect(token);
            onClose();
        }
    }["TokenSelectorModal.useCallback[handleSelect]"], [
        onSelect,
        onClose
    ]);
    const handleKeyDown = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TokenSelectorModal.useCallback[handleKeyDown]": (e)=>{
            switch(e.key){
                case 'ArrowDown':
                    e.preventDefault();
                    setHighlightedIndex({
                        "TokenSelectorModal.useCallback[handleKeyDown]": (i)=>Math.min(i + 1, filtered.length - 1)
                    }["TokenSelectorModal.useCallback[handleKeyDown]"]);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setHighlightedIndex({
                        "TokenSelectorModal.useCallback[handleKeyDown]": (i)=>Math.max(i - 1, 0)
                    }["TokenSelectorModal.useCallback[handleKeyDown]"]);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filtered[highlightedIndex]) handleSelect(filtered[highlightedIndex]);
                    break;
            }
        }
    }["TokenSelectorModal.useCallback[handleKeyDown]"], [
        filtered,
        highlightedIndex,
        handleSelect
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TokenSelectorModal.useEffect": ()=>{
            if (!listRef.current) return;
            const highlighted = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
            highlighted?.scrollIntoView({
                block: 'nearest'
            });
        }
    }["TokenSelectorModal.useEffect"], [
        highlightedIndex
    ]);
    if (!open) return null;
    const popularFiltered = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$tokens$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["POPULAR_TOKENS"].filter((t)=>t.symbol !== exclude);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Select a token",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 bg-black/60 backdrop-blur-sm",
                onClick: onClose
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                lineNumber: 84,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative w-full sm:max-w-[420px] max-h-[85vh] sm:max-h-[600px] bg-dark-100 border border-gray-700/40 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:fade-in duration-200",
                onKeyDown: handleKeyDown,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between px-5 pt-5 pb-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-lg font-semibold text-white",
                                children: "Select a token"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                                lineNumber: 90,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: onClose,
                                className: "p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-dark-50 transition-colors focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:outline-none",
                                "aria-label": "Close",
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
                                        fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                                        lineNumber: 97,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                                    lineNumber: 96,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                                lineNumber: 91,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                        lineNumber: 89,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-5 pb-3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            ref: searchRef,
                            type: "text",
                            placeholder: "Search by name or symbol",
                            "aria-label": "Search tokens by name or symbol",
                            value: query,
                            onChange: (e)=>setQuery(e.target.value),
                            className: "w-full px-4 py-3 rounded-xl bg-dark/80 border border-gray-700/30 text-white placeholder:text-gray-500 text-sm outline-none focus-visible:ring-2 focus-visible:ring-goodgreen/50 focus-visible:border-goodgreen/30"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                            lineNumber: 103,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                        lineNumber: 102,
                        columnNumber: 9
                    }, this),
                    !trimmedQuery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-5 pb-3 flex flex-wrap gap-2",
                        children: popularFiltered.map((token)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>handleSelect(token),
                                className: `flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${token.symbol === selected.symbol ? 'border-goodgreen/50 bg-goodgreen/10 text-goodgreen' : 'border-gray-700/40 bg-dark-50/50 text-white hover:border-gray-600 hover:bg-dark-50'}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TokenIcon$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenIcon"], {
                                        symbol: token.symbol,
                                        size: 18
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                                        lineNumber: 126,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-medium",
                                        children: token.symbol
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                                        lineNumber: 127,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, token.symbol, true, {
                                fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                                lineNumber: 117,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                        lineNumber: 115,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-t border-gray-700/20"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                        lineNumber: 133,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: listRef,
                        className: "flex-1 overflow-y-auto min-h-0 py-2",
                        role: "listbox",
                        children: filtered.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "px-5 py-8 text-center text-gray-500 text-sm",
                            children: "No tokens found"
                        }, void 0, false, {
                            fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                            lineNumber: 137,
                            columnNumber: 13
                        }, this) : filtered.map((token, index)=>{
                            const isSelected = token.symbol === selected.symbol;
                            const isExcluded = token.symbol === exclude;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                role: "option",
                                "aria-selected": isSelected,
                                "data-index": index,
                                onClick: ()=>!isExcluded && handleSelect(token),
                                onMouseEnter: ()=>setHighlightedIndex(index),
                                className: `w-full flex items-center gap-3 px-5 py-3 transition-colors ${isExcluded ? 'opacity-30 cursor-not-allowed' : index === highlightedIndex ? 'bg-goodgreen/10' : 'hover:bg-dark-50/60'}`,
                                disabled: isExcluded,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$components$2f$TokenIcon$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TokenIcon"], {
                                        symbol: token.symbol,
                                        size: 36
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                                        lineNumber: 159,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-left flex-1 min-w-0",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "font-semibold text-white text-sm",
                                                children: token.symbol
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                                                lineNumber: 161,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-xs text-gray-400 truncate",
                                                children: token.name
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                                                lineNumber: 162,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                                        lineNumber: 160,
                                        columnNumber: 19
                                    }, this),
                                    isSelected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-5 h-5 text-goodgreen shrink-0",
                                        fill: "none",
                                        stroke: "currentColor",
                                        viewBox: "0 0 24 24",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: 2.5,
                                            d: "M5 13l4 4L19 7"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                                            lineNumber: 166,
                                            columnNumber: 23
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                                        lineNumber: 165,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, token.symbol, true, {
                                fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                                lineNumber: 143,
                                columnNumber: 17
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                        lineNumber: 135,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
                lineNumber: 85,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/TokenSelectorModal.tsx",
        lineNumber: 83,
        columnNumber: 5
    }, this);
}
_s(TokenSelectorModal, "Dl3tqHr7d75Li48pST0zf0ei4G0=");
_c = TokenSelectorModal;
const __TURBOPACK__default__export__ = TokenSelectorModal;
var _c;
__turbopack_context__.k.register(_c, "TokenSelectorModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_src_components_TokenSelectorModal_tsx_0pa66h_._.js.map