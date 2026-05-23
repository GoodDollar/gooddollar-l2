(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/src/lib/chartData.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "computeSMA",
    ()=>computeSMA,
    "generateProbabilityHistory",
    ()=>generateProbabilityHistory,
    "getChartData",
    ()=>getChartData
]);
const TIMEFRAME_CONFIG = {
    '1H': {
        points: 60,
        intervalMs: 60_000,
        useTimestamp: true
    },
    '4H': {
        points: 42,
        intervalMs: 14_400_000,
        useTimestamp: true
    },
    '1D': {
        points: 24,
        intervalMs: 3_600_000,
        useTimestamp: true
    },
    '1W': {
        points: 28,
        intervalMs: 6 * 3_600_000,
        useTimestamp: true
    },
    '1M': {
        points: 30,
        intervalMs: 86_400_000,
        useTimestamp: false
    },
    '3M': {
        points: 90,
        intervalMs: 86_400_000,
        useTimestamp: false
    },
    '1Y': {
        points: 365,
        intervalMs: 86_400_000,
        useTimestamp: false
    }
};
function generateOHLC(basePrice, config, volatility = 0.02) {
    const { points, intervalMs, useTimestamp } = config;
    const data = [];
    const nowMs = Date.now();
    const prices = [
        basePrice
    ];
    for(let i = 1; i < points; i++){
        const prev = prices[0];
        const change = (Math.random() - 0.52) * volatility * prev;
        prices.unshift(prev - change);
    }
    for(let i = 0; i < points; i++){
        const candleMs = nowMs - (points - 1 - i) * intervalMs;
        const time = useTimestamp ? Math.floor(candleMs / 1000) : new Date(candleMs).toISOString().split('T')[0];
        const close = prices[i];
        const open = i > 0 ? prices[i - 1] : close * (1 + (Math.random() - 0.5) * volatility);
        const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
        const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
        const volume = Math.floor(1_000_000 + Math.random() * 50_000_000);
        data.push({
            time,
            open,
            high,
            low,
            close,
            volume
        });
    }
    return data;
}
const CHART_CACHE = new Map();
function computeSMA(data, period) {
    if (data.length < period) return [];
    const result = [];
    let sum = 0;
    for(let i = 0; i < data.length; i++){
        sum += data[i].close;
        if (i >= period) sum -= data[i - period].close;
        if (i >= period - 1) {
            result.push({
                time: data[i].time,
                value: sum / period
            });
        }
    }
    return result;
}
function getChartData(symbol, timeframe, basePrice) {
    if (!CHART_CACHE.has(symbol)) {
        CHART_CACHE.set(symbol, new Map());
    }
    const symbolCache = CHART_CACHE.get(symbol);
    if (!symbolCache.has(timeframe)) {
        symbolCache.set(timeframe, generateOHLC(basePrice, TIMEFRAME_CONFIG[timeframe]));
    }
    return symbolCache.get(timeframe);
}
function generateProbabilityHistory(currentProb, days) {
    const data = [];
    let prob = 0.3 + Math.random() * 0.4;
    const now = new Date();
    for(let i = days; i >= 0; i--){
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const drift = (currentProb - prob) * 0.02;
        const noise = (Math.random() - 0.5) * 0.06;
        prob = Math.max(0.01, Math.min(0.99, prob + drift + noise));
        data.push({
            time: dateStr,
            value: prob
        });
    }
    if (data.length > 0) {
        data[data.length - 1].value = currentProb;
    }
    return data;
}
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
        unknownSymbols: []
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
            unknownSymbols
        };
    } catch (err) {
        store.state = {
            ...store.state,
            isLive: false,
            error: err instanceof Error ? err.message : 'Price feed unavailable'
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
        unknownSymbols: []
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
"[project]/frontend/src/components/SwapPriceChart.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SwapPriceChart",
    ()=>SwapPriceChart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chartData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/chartData.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/usePriceFeeds.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
const TIMEFRAMES = [
    '1D',
    '1W',
    '1M'
];
function formatRate(rate) {
    if (rate >= 1_000_000) return rate.toLocaleString('en-US', {
        maximumFractionDigits: 0
    });
    if (rate >= 1000) return rate.toLocaleString('en-US', {
        maximumFractionDigits: 0
    });
    if (rate >= 1) return rate.toLocaleString('en-US', {
        maximumFractionDigits: 2
    });
    if (rate >= 0.01) return rate.toLocaleString('en-US', {
        maximumFractionDigits: 4
    });
    return rate.toLocaleString('en-US', {
        maximumFractionDigits: 6
    });
}
const SwapPriceChart = /*#__PURE__*/ _s((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memo"])(_c = _s(function SwapPriceChart({ inputSymbol, outputSymbol }) {
    _s();
    const { prices } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceFeeds"])([
        inputSymbol,
        outputSymbol
    ]);
    const inputPrice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPrice"])(prices, inputSymbol);
    const outputPrice = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPrice"])(prices, outputSymbol);
    const [timeframe, setTimeframe] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('1W');
    const exchangeRate = outputPrice > 0 ? inputPrice / outputPrice : 0;
    const chartData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapPriceChart.SwapPriceChart.useMemo[chartData]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$chartData$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getChartData"])(inputSymbol, timeframe, inputPrice)
    }["SwapPriceChart.SwapPriceChart.useMemo[chartData]"], [
        inputSymbol,
        timeframe,
        inputPrice
    ]);
    const closePrices = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapPriceChart.SwapPriceChart.useMemo[closePrices]": ()=>chartData.map({
                "SwapPriceChart.SwapPriceChart.useMemo[closePrices]": (d)=>d.close / (outputPrice || 1)
            }["SwapPriceChart.SwapPriceChart.useMemo[closePrices]"])
    }["SwapPriceChart.SwapPriceChart.useMemo[closePrices]"], [
        chartData,
        outputPrice
    ]);
    const changePercent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapPriceChart.SwapPriceChart.useMemo[changePercent]": ()=>{
            if (closePrices.length < 2) return 0;
            const first = closePrices[0];
            const last = closePrices[closePrices.length - 1];
            return first > 0 ? (last - first) / first * 100 : 0;
        }
    }["SwapPriceChart.SwapPriceChart.useMemo[changePercent]"], [
        closePrices
    ]);
    const isPositive = changePercent >= 0;
    const color = isPositive ? '#4ade80' : '#f87171';
    const w = 400;
    const h = 100;
    const pad = 2;
    const { linePoints, areaPoints } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SwapPriceChart.SwapPriceChart.useMemo": ()=>{
            if (closePrices.length < 2) return {
                linePoints: '',
                areaPoints: ''
            };
            const min = Math.min(...closePrices);
            const max = Math.max(...closePrices);
            const range = max - min || 1;
            const coords = closePrices.map({
                "SwapPriceChart.SwapPriceChart.useMemo.coords": (v, i)=>({
                        x: pad + i / (closePrices.length - 1) * (w - pad * 2),
                        y: pad + (1 - (v - min) / range) * (h - pad * 2)
                    })
            }["SwapPriceChart.SwapPriceChart.useMemo.coords"]);
            const line = coords.map({
                "SwapPriceChart.SwapPriceChart.useMemo.line": (c)=>`${c.x},${c.y}`
            }["SwapPriceChart.SwapPriceChart.useMemo.line"]).join(' ');
            const area = `${coords[0].x},${h} ${line} ${coords[coords.length - 1].x},${h}`;
            return {
                linePoints: line,
                areaPoints: area
            };
        }
    }["SwapPriceChart.SwapPriceChart.useMemo"], [
        closePrices
    ]);
    if (!exchangeRate) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-[460px] mb-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-baseline justify-between mb-2 px-1",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-sm text-gray-400 mb-0.5",
                                children: [
                                    "1 ",
                                    inputSymbol,
                                    " = ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-white font-medium",
                                        children: [
                                            formatRate(exchangeRate),
                                            " ",
                                            outputSymbol
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/src/components/SwapPriceChart.tsx",
                                        lineNumber: 80,
                                        columnNumber: 31
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/SwapPriceChart.tsx",
                                lineNumber: 79,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`,
                                children: [
                                    isPositive ? '▲' : '▼',
                                    " ",
                                    Math.abs(changePercent).toFixed(2),
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/src/components/SwapPriceChart.tsx",
                                lineNumber: 82,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/src/components/SwapPriceChart.tsx",
                        lineNumber: 78,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-1",
                        children: TIMEFRAMES.map((tf)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setTimeframe(tf),
                                className: `px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${timeframe === tf ? 'bg-goodgreen/15 text-goodgreen border border-goodgreen/20' : 'text-gray-500 hover:text-gray-300 bg-dark-100 border border-gray-700/20'}`,
                                children: tf
                            }, tf, false, {
                                fileName: "[project]/frontend/src/components/SwapPriceChart.tsx",
                                lineNumber: 88,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/frontend/src/components/SwapPriceChart.tsx",
                        lineNumber: 86,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/src/components/SwapPriceChart.tsx",
                lineNumber: 77,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-dark-100/50 rounded-xl border border-gray-700/15 p-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    viewBox: `0 0 ${w} ${h}`,
                    className: "w-full",
                    preserveAspectRatio: "none",
                    "aria-label": `${inputSymbol}/${outputSymbol} price chart`,
                    children: areaPoints && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("linearGradient", {
                                    id: "chartFill",
                                    x1: "0",
                                    y1: "0",
                                    x2: "0",
                                    y2: "1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                            offset: "0%",
                                            stopColor: color,
                                            stopOpacity: 0.15
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/SwapPriceChart.tsx",
                                            lineNumber: 114,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                            offset: "100%",
                                            stopColor: color,
                                            stopOpacity: 0.02
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/src/components/SwapPriceChart.tsx",
                                            lineNumber: 115,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/src/components/SwapPriceChart.tsx",
                                    lineNumber: 113,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapPriceChart.tsx",
                                lineNumber: 112,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polygon", {
                                points: areaPoints,
                                fill: "url(#chartFill)"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapPriceChart.tsx",
                                lineNumber: 118,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                                points: linePoints,
                                fill: "none",
                                stroke: color,
                                strokeWidth: 1.5,
                                strokeLinecap: "round",
                                strokeLinejoin: "round"
                            }, void 0, false, {
                                fileName: "[project]/frontend/src/components/SwapPriceChart.tsx",
                                lineNumber: 119,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true)
                }, void 0, false, {
                    fileName: "[project]/frontend/src/components/SwapPriceChart.tsx",
                    lineNumber: 104,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/src/components/SwapPriceChart.tsx",
                lineNumber: 103,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/src/components/SwapPriceChart.tsx",
        lineNumber: 76,
        columnNumber: 5
    }, this);
}, "95Pbi+G7C7pMIJeTnImE3E6JOj4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceFeeds"]
    ];
})), "95Pbi+G7C7pMIJeTnImE3E6JOj4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$usePriceFeeds$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePriceFeeds"]
    ];
});
_c1 = SwapPriceChart;
var _c, _c1;
__turbopack_context__.k.register(_c, "SwapPriceChart$memo");
__turbopack_context__.k.register(_c1, "SwapPriceChart");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/src/components/SwapPriceChart.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/frontend/src/components/SwapPriceChart.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=frontend_src_0v5p6in._.js.map