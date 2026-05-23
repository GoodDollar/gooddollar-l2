module.exports = [
"[project]/frontend/src/lib/computeDepthCurve.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "computeDepthCurve",
    ()=>computeDepthCurve
]);
function computeDepthCurve(params) {
    const { oraclePrice, baseSpread = 0.0015, skewFactor = 0.08, maxPoolCapacity = 500_000, steps = 50 } = params;
    const buyPoints = [];
    const sellPoints = [];
    for(let i = 0; i <= steps; i++){
        const sizeRatio = i / steps;
        const size = sizeRatio * maxPoolCapacity;
        const impact = baseSpread + skewFactor * sizeRatio;
        buyPoints.push({
            size,
            price: oraclePrice * (1 + impact),
            impact: impact * 100
        });
        sellPoints.push({
            size,
            price: oraclePrice * (1 - impact),
            impact: -impact * 100
        });
    }
    return {
        buyPoints,
        sellPoints,
        oraclePrice,
        maxSize: maxPoolCapacity
    };
}
}),
"[project]/frontend/src/components/stocks/DepthChart.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DepthChart",
    ()=>DepthChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$computeDepthCurve$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/computeDepthCurve.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/stockData.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
function formatSize(value) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toFixed(0);
}
function DepthChart({ oraclePrice, height = 280 }) {
    const svgRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [hover, setHover] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const curve = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$computeDepthCurve$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["computeDepthCurve"])({
            oraclePrice,
            steps: 50
        }), [
        oraclePrice
    ]);
    const padding = {
        top: 20,
        right: 16,
        bottom: 32,
        left: 60
    };
    const chartWidth = 600;
    const chartHeight = height;
    const innerW = chartWidth - padding.left - padding.right;
    const innerH = chartHeight - padding.top - padding.bottom;
    const priceMin = curve.sellPoints[curve.sellPoints.length - 1].price;
    const priceMax = curve.buyPoints[curve.buyPoints.length - 1].price;
    const priceRange = priceMax - priceMin;
    const scaleX = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((size)=>{
        return padding.left + size / curve.maxSize * innerW;
    }, [
        curve.maxSize,
        innerW,
        padding.left
    ]);
    const scaleY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((price)=>{
        return padding.top + innerH - (price - priceMin) / priceRange * innerH;
    }, [
        innerH,
        padding.top,
        priceMin,
        priceRange
    ]);
    const oracleY = scaleY(oraclePrice);
    const buyPath = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const points = curve.buyPoints.map((p)=>`${scaleX(p.size)},${scaleY(p.price)}`).join(' L ');
        const lastX = scaleX(curve.maxSize);
        const baseY = scaleY(oraclePrice);
        return `M ${scaleX(0)},${baseY} L ${points} L ${lastX},${baseY} Z`;
    }, [
        curve,
        scaleX,
        scaleY,
        oraclePrice
    ]);
    const sellPath = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const points = curve.sellPoints.map((p)=>`${scaleX(p.size)},${scaleY(p.price)}`).join(' L ');
        const lastX = scaleX(curve.maxSize);
        const baseY = scaleY(oraclePrice);
        return `M ${scaleX(0)},${baseY} L ${points} L ${lastX},${baseY} Z`;
    }, [
        curve,
        scaleX,
        scaleY,
        oraclePrice
    ]);
    const handleMouseMove = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((e)=>{
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const svgX = (e.clientX - rect.left) / rect.width * chartWidth;
        const svgY = (e.clientY - rect.top) / rect.height * chartHeight;
        const sizeRatio = Math.max(0, Math.min(1, (svgX - padding.left) / innerW));
        const index = Math.round(sizeRatio * 50);
        const clampedIdx = Math.max(0, Math.min(50, index));
        const isBuySide = svgY < oracleY;
        const point = isBuySide ? curve.buyPoints[clampedIdx] : curve.sellPoints[clampedIdx];
        setHover({
            x: svgX,
            y: svgY,
            point,
            side: isBuySide ? 'buy' : 'sell'
        });
    }, [
        chartWidth,
        chartHeight,
        padding.left,
        innerW,
        oracleY,
        curve
    ]);
    const sizeLabels = [
        0,
        0.25,
        0.5,
        0.75,
        1
    ].map((r)=>({
            x: scaleX(r * curve.maxSize),
            label: formatSize(r * curve.maxSize)
        }));
    const priceTicks = 5;
    const priceLabels = Array.from({
        length: priceTicks
    }, (_, i)=>{
        const price = priceMin + priceRange * i / (priceTicks - 1);
        return {
            y: scaleY(price),
            label: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatStockPrice"])(price)
        };
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-testid": "depth-chart",
        className: "relative w-full",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                ref: svgRef,
                viewBox: `0 0 ${chartWidth} ${chartHeight}`,
                className: "w-full",
                style: {
                    height
                },
                onMouseMove: handleMouseMove,
                onMouseLeave: ()=>setHover(null),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: buyPath,
                        fill: "rgba(239, 68, 68, 0.15)",
                        stroke: "rgb(239, 68, 68)",
                        strokeWidth: "1.5"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                        lineNumber: 99,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: sellPath,
                        fill: "rgba(34, 197, 94, 0.15)",
                        stroke: "rgb(34, 197, 94)",
                        strokeWidth: "1.5"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                        lineNumber: 102,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                        x1: padding.left,
                        y1: oracleY,
                        x2: chartWidth - padding.right,
                        y2: oracleY,
                        stroke: "rgb(156, 163, 175)",
                        strokeWidth: "1",
                        strokeDasharray: "4 3"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                        lineNumber: 105,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                        x: chartWidth - padding.right + 4,
                        y: oracleY + 3,
                        fontSize: "9",
                        fill: "rgb(156, 163, 175)",
                        children: "Oracle"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                        lineNumber: 114,
                        columnNumber: 9
                    }, this),
                    priceLabels.map((tick, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                            x: padding.left - 6,
                            y: tick.y + 3,
                            fontSize: "9",
                            fill: "rgb(107, 114, 128)",
                            textAnchor: "end",
                            children: tick.label
                        }, i, false, {
                            fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                            lineNumber: 120,
                            columnNumber: 11
                        }, this)),
                    sizeLabels.map((tick, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                            x: tick.x,
                            y: chartHeight - 8,
                            fontSize: "9",
                            fill: "rgb(107, 114, 128)",
                            textAnchor: "middle",
                            children: tick.label
                        }, i, false, {
                            fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                            lineNumber: 127,
                            columnNumber: 11
                        }, this)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                        x: chartWidth / 2,
                        y: chartHeight - 0,
                        fontSize: "9",
                        fill: "rgb(75, 85, 99)",
                        textAnchor: "middle",
                        children: "Trade Size (USD)"
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                        lineNumber: 133,
                        columnNumber: 9
                    }, this),
                    hover && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                                x1: hover.x,
                                y1: padding.top,
                                x2: hover.x,
                                y2: chartHeight - padding.bottom,
                                stroke: "rgba(255,255,255,0.2)",
                                strokeWidth: "1"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                                lineNumber: 140,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                cx: hover.x,
                                cy: scaleY(hover.point.price),
                                r: "4",
                                fill: hover.side === 'buy' ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                                lineNumber: 141,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                lineNumber: 90,
                columnNumber: 7
            }, this),
            hover && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute pointer-events-none bg-dark-200 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg z-10",
                style: {
                    left: `${Math.min(hover.x / chartWidth * 100, 75)}%`,
                    top: `${Math.min(hover.y / chartHeight * 100, 60)}%`
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-gray-400",
                        children: [
                            "Size: ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-white font-medium",
                                children: [
                                    "$",
                                    formatSize(hover.point.size)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                                lineNumber: 156,
                                columnNumber: 19
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                        lineNumber: 155,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-gray-400",
                        children: [
                            "Price: ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-white font-medium",
                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$stockData$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatStockPrice"])(hover.point.price)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                                lineNumber: 159,
                                columnNumber: 20
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                        lineNumber: 158,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-gray-400",
                        children: [
                            "Impact:",
                            ' ',
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: hover.point.impact >= 0 ? 'text-red-400' : 'text-green-400',
                                children: [
                                    hover.point.impact >= 0 ? '+' : '',
                                    hover.point.impact.toFixed(3),
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                                lineNumber: 163,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                        lineNumber: 161,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                lineNumber: 148,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-4 mt-2 px-2 text-[10px] text-gray-500",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-2.5 h-2.5 rounded-sm bg-red-400/30 border border-red-400"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                                lineNumber: 173,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Buy Impact (cost)"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                                lineNumber: 174,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                        lineNumber: 172,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-2.5 h-2.5 rounded-sm bg-green-400/30 border border-green-400"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                                lineNumber: 177,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Sell Impact (receive)"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                                lineNumber: 178,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                        lineNumber: 176,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center gap-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-6 h-0 border-t border-dashed border-gray-400"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                                lineNumber: 181,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Oracle Price"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                                lineNumber: 182,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                        lineNumber: 180,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
                lineNumber: 171,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/stocks/DepthChart.tsx",
        lineNumber: 89,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=frontend_src_0klu2-x._.js.map