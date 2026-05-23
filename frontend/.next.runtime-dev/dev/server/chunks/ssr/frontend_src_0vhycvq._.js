module.exports = [
"[project]/frontend/src/lib/indicators.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_INDICATORS",
    ()=>DEFAULT_INDICATORS,
    "calculateEMA",
    ()=>calculateEMA,
    "calculateSMA",
    ()=>calculateSMA
]);
function calculateSMA(data, period) {
    if (data.length < period) return [];
    const result = [];
    let sum = 0;
    for(let i = 0; i < period; i++){
        sum += data[i].close;
    }
    result.push({
        time: data[period - 1].time,
        value: sum / period
    });
    for(let i = period; i < data.length; i++){
        sum += data[i].close - data[i - period].close;
        result.push({
            time: data[i].time,
            value: sum / period
        });
    }
    return result;
}
function calculateEMA(data, period) {
    if (data.length < period) return [];
    const k = 2 / (period + 1);
    const result = [];
    let sum = 0;
    for(let i = 0; i < period; i++){
        sum += data[i].close;
    }
    let ema = sum / period;
    result.push({
        time: data[period - 1].time,
        value: ema
    });
    for(let i = period; i < data.length; i++){
        ema = data[i].close * k + ema * (1 - k);
        result.push({
            time: data[i].time,
            value: ema
        });
    }
    return result;
}
const DEFAULT_INDICATORS = {
    vol: true,
    sma20: false,
    ema50: false
};
}),
"[project]/frontend/src/components/PriceChart.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PriceChart",
    ()=>PriceChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/lightweight-charts/dist/lightweight-charts.development.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$indicators$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/indicators.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
function PriceChart({ data, height = 400, indicators = __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$indicators$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DEFAULT_INDICATORS"] }) {
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const chartRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const candleRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const volumeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const smaRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const emaRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const smaData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$indicators$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateSMA"])(data, 20), [
        data
    ]);
    const emaData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$indicators$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateEMA"])(data, 50), [
        data
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!containerRef.current) return;
        const chart = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createChart"])(containerRef.current, {
            layout: {
                background: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ColorType"].Solid,
                    color: 'transparent'
                },
                textColor: '#9CA3AF',
                fontSize: 12
            },
            grid: {
                vertLines: {
                    color: 'rgba(107, 114, 128, 0.1)'
                },
                horzLines: {
                    color: 'rgba(107, 114, 128, 0.1)'
                }
            },
            crosshair: {
                vertLine: {
                    color: 'rgba(0, 176, 160, 0.3)',
                    width: 1,
                    style: 2
                },
                horzLine: {
                    color: 'rgba(0, 176, 160, 0.3)',
                    width: 1,
                    style: 2
                }
            },
            rightPriceScale: {
                borderColor: 'rgba(107, 114, 128, 0.2)'
            },
            timeScale: {
                borderColor: 'rgba(107, 114, 128, 0.2)',
                timeVisible: true,
                secondsVisible: false
            },
            width: containerRef.current.clientWidth,
            height
        });
        const candleSeries = chart.addSeries(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CandlestickSeries"], {
            upColor: '#22C55E',
            downColor: '#EF4444',
            borderDownColor: '#EF4444',
            borderUpColor: '#22C55E',
            wickDownColor: '#EF4444',
            wickUpColor: '#22C55E'
        });
        const volumeSeries = chart.addSeries(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HistogramSeries"], {
            color: 'rgba(0, 176, 160, 0.15)',
            priceFormat: {
                type: 'volume'
            },
            priceScaleId: 'vol'
        });
        chart.priceScale('vol').applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0
            }
        });
        const smaSeries = chart.addSeries(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LineSeries"], {
            color: '#FBBF24',
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false
        });
        const emaSeries = chart.addSeries(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lightweight$2d$charts$2f$dist$2f$lightweight$2d$charts$2e$development$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LineSeries"], {
            color: '#A78BFA',
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false
        });
        chartRef.current = chart;
        candleRef.current = candleSeries;
        volumeRef.current = volumeSeries;
        smaRef.current = smaSeries;
        emaRef.current = emaSeries;
        const handleResize = ()=>{
            if (containerRef.current) {
                chart.applyOptions({
                    width: containerRef.current.clientWidth
                });
            }
        };
        window.addEventListener('resize', handleResize);
        return ()=>{
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [
        height
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!candleRef.current || !volumeRef.current || data.length === 0) return;
        candleRef.current.setData(data.map((d)=>({
                time: d.time,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close
            })));
        volumeRef.current.setData(data.map((d)=>({
                time: d.time,
                value: d.volume,
                color: d.close >= d.open ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
            })));
        chartRef.current?.timeScale().fitContent();
    }, [
        data
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!volumeRef.current) return;
        volumeRef.current.applyOptions({
            visible: indicators.vol
        });
    }, [
        indicators.vol
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!smaRef.current) return;
        if (indicators.sma20 && smaData.length > 0) {
            smaRef.current.setData(smaData.map((p)=>({
                    time: p.time,
                    value: p.value
                })));
            smaRef.current.applyOptions({
                visible: true
            });
        } else {
            smaRef.current.applyOptions({
                visible: false
            });
        }
    }, [
        indicators.sma20,
        smaData
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!emaRef.current) return;
        if (indicators.ema50 && emaData.length > 0) {
            emaRef.current.setData(emaData.map((p)=>({
                    time: p.time,
                    value: p.value
                })));
            emaRef.current.applyOptions({
                visible: true
            });
        } else {
            emaRef.current.applyOptions({
                visible: false
            });
        }
    }, [
        indicators.ema50,
        emaData
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: containerRef,
        className: "w-full"
    }, void 0, false, {
        fileName: "[project]/frontend/src/components/PriceChart.tsx",
        lineNumber: 152,
        columnNumber: 10
    }, this);
}
}),
];

//# sourceMappingURL=frontend_src_0vhycvq._.js.map